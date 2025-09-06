
import { Stock, HistoricalDataPoint } from '../types';

// Interface for the structure of a single stock object from the TWSE getStockInfo API response
interface TwseStock {
    c: string; // code
    n: string; // name
    z: string; // price
    v: string; // volume
    o: string; // open
    h: string; // high
    l: string; // low
    y: string; // yesterday's price
}

/**
 * Fetches real-time stock data from the Taiwan Stock Exchange (TWSE) API.
 * Due to browser CORS (Cross-Origin Resource Sharing) policies, we must use a proxy
 * to fetch data from the TWSE domain. This function routes the request through a
 * public CORS proxy to enable access.
 * @param codes - An array of stock codes to fetch data for.
 * @returns A promise that resolves to an array of Stock objects.
 */
export const fetchStockData = async (codes: string[]): Promise<Stock[]> => {
    if (codes.length === 0) {
        return [];
    }

    const query = codes.flatMap(code => [`tse_${code}.tw`, `otc_${code}.tw`]).join('|');
    const apiUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${query}&json=1&delay=0&_=${Date.now()}`;
    
    // Use a more reliable CORS proxy
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Proxy request failed with status ${response.status}:`, errorBody.substring(0, 500));
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error("Failed to parse stock data JSON from proxy. Response text:", responseText.substring(0, 500));
            throw new Error("無法解析從證交所收到的資料。 API 可能暫時無法使用。");
        }

        if (!data || !data.msgArray || data.msgArray.length === 0) {
            return []; // No data for the given codes, not an error.
        }

        const stocks: Stock[] = data.msgArray.map((item: TwseStock) => {
            const price = parseFloat(item.z);
            const yesterdayPrice = parseFloat(item.y);
            const change = price - yesterdayPrice;
            const changePercent = yesterdayPrice !== 0 ? (change / yesterdayPrice) * 100 : 0;

            return {
                code: item.c,
                name: item.n,
                price: price,
                change: parseFloat(change.toFixed(2)),
                changePercent: parseFloat(changePercent.toFixed(2)),
                open: parseFloat(item.o),
                high: parseFloat(item.h),
                low: parseFloat(item.l),
                volume: parseInt(item.v, 10),
                yesterdayPrice: yesterdayPrice,
            };
        });

        const uniqueStocks = Array.from(new Map(stocks.map(stock => [stock.code, stock])).values());
        return uniqueStocks;

    } catch (error) {
        console.error("Failed to fetch real stock data via CORS proxy:", error);
        throw new Error("無法從台灣證券交易所獲取即時資料。這可能是暫時性網路問題或 CORS Proxy 服務不穩定所致。");
    }
};


/**
 * Fetches historical daily stock data for the last ~30 trading days for technical analysis.
 * It tries fetching from TSE, and if that fails, it tries the TPEX (OTC) API.
 * This version fetches full OHLCV (Open, High, Low, Close, Volume) data.
 * @param code - The stock code.
 * @returns A promise that resolves to an array of HistoricalDataPoint objects.
 */
export const fetchHistoricalData = async (code: string): Promise<HistoricalDataPoint[]> => {
    const today = new Date();
    // Fetch data for the current month and the previous month to ensure we get at least 30 days of data
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const fetchData = async (isTse: boolean): Promise<any[]> => {
        const dates = [today, lastMonthDate];
        const urls = dates.map(date => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            if (isTse) {
                const queryDate = `${year}${month}01`;
                return `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${queryDate}&stockNo=${code}`;
            } else {
                const rocYear = year - 1911;
                const queryDate = `${rocYear}/${month}`;
                return `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?l=zh-tw&d=${queryDate}&stkno=${code}`;
            }
        });

        const responses = await Promise.all(urls.map(url => fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)));
        let combinedData: any[] = [];

        for (const response of responses) {
            if (response.ok) {
                const responseText = await response.text();
                try {
                    const json = JSON.parse(responseText);
                    if (isTse && json.stat === "OK" && Array.isArray(json.data)) {
                        combinedData.push(...json.data);
                    } else if (!isTse && Array.isArray(json.aaData)) {
                        combinedData.push(...json.aaData);
                    }
                } catch (e) {
                    console.warn(`Failed to parse historical data response as JSON. URL: ${response.url}, Body:`, responseText.substring(0, 200));
                }
            }
        }
        return combinedData;
    };

    try {
        let rawData = await fetchData(true);
        if (rawData.length === 0) {
            rawData = await fetchData(false); // Fallback to OTC
        }
        if (rawData.length === 0) {
            throw new Error('No historical data found from TSE or OTC sources.');
        }
        
        const isOtc = rawData[0]?.length === 8; // OTC data has 8 fields, TSE has 9

        const historicalPoints: HistoricalDataPoint[] = rawData
            .map(item => {
                if (Array.isArray(item) && item.length >= 7) {
                    try {
                        return {
                            date: item[0]?.trim(),
                            volume: parseInt(item[1]?.trim().replace(/,/g, ''), 10) * (isOtc ? 1000 : 1),
                            open: parseFloat(item[3]?.trim().replace(/,/g, '')),
                            high: parseFloat(item[4]?.trim().replace(/,/g, '')),
                            low: parseFloat(item[5]?.trim().replace(/,/g, '')),
                            close: parseFloat(item[6]?.trim().replace(/,/g, '')),
                        };
                    } catch {
                        return null; // Skip if parsing fails for any field
                    }
                }
                return null;
            })
            .filter((point): point is HistoricalDataPoint => 
                point !== null && 
                point.date != null && 
                !isNaN(point.close) &&
                !isNaN(point.open) &&
                !isNaN(point.high) &&
                !isNaN(point.low) &&
                !isNaN(point.volume)
            );

        // Remove duplicates and sort by date descending (newest first)
        const uniquePoints = Array.from(new Map(historicalPoints.map(p => [p.date, p])).values());
        
        uniquePoints.sort((a, b) => {
            const dateA = new Date(a.date.replace(/(\d+)\/(\d+)\/(\d+)/, (_, y, m, d) => `${parseInt(y) + 1911}-${m}-${d}`));
            const dateB = new Date(b.date.replace(/(\d+)\/(\d+)\/(\d+)/, (_, y, m, d) => `${parseInt(y) + 1911}-${m}-${d}`));
            return dateB.getTime() - dateA.getTime();
        });

        // The API returns monthly data, so we slice to get roughly the last 30 trading days
        return uniquePoints.slice(0, 60).reverse(); // Return last 60 days, oldest first for charting

    } catch (error) {
        console.error(`Failed to fetch historical data for ${code}:`, error);
        throw new Error("無法獲取歷史股價資料。");
    }
};

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
            const yesterdayPrice = parseFloat(item.y);
            
            // The API returns '-' for untraded stocks (e.g., pre-market).
            const hasTraded = item.z && item.z !== '-';

            const price = hasTraded ? parseFloat(item.z) : yesterdayPrice;
            const open = (item.o && item.o !== '-') ? parseFloat(item.o) : yesterdayPrice;
            const high = (item.h && item.h !== '-') ? parseFloat(item.h) : yesterdayPrice;
            const low = (item.l && item.l !== '-') ? parseFloat(item.l) : yesterdayPrice;
            const volume = parseInt(item.v, 10) || 0;

            const change = hasTraded ? price - yesterdayPrice : 0;
            const changePercent = yesterdayPrice > 0 ? (change / yesterdayPrice) * 100 : 0;

            // Final check for any potential NaN values to ensure data integrity
            return {
                code: item.c,
                name: item.n,
                price: isNaN(price) ? 0 : price,
                change: isNaN(change) ? 0 : parseFloat(change.toFixed(2)),
                changePercent: isNaN(changePercent) ? 0 : parseFloat(changePercent.toFixed(2)),
                open: isNaN(open) ? 0 : open,
                high: isNaN(high) ? 0 : high,
                low: isNaN(low) ? 0 : low,
                volume: isNaN(volume) ? 0 : volume,
                yesterdayPrice: isNaN(yesterdayPrice) ? 0 : yesterdayPrice,
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
 * Fetches historical daily stock data for the last ~30 days for technical analysis.
 * It tries fetching from TSE, OTC, and Emerging markets in sequence to find data.
 * @param code - The stock code.
 * @returns A promise that resolves to an array of HistoricalDataPoint objects.
 */
export const fetchHistoricalData = async (code: string): Promise<HistoricalDataPoint[]> => {
    const today = new Date();
    // Fetch data for the current month and the previous month to ensure we get ~30 days.
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    // Define the different data sources and their properties.
    const sources = {
        TSE: {
            getUrl: (year: number, month: string) => `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${year}${month}01&stockNo=${code}`,
            getData: (json: any) => (json.stat === "OK" && Array.isArray(json.data) ? json.data : []),
            getClosePriceIndex: () => 6,
        },
        OTC: {
            getUrl: (rocYear: number, month: string) => `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?l=zh-tw&d=${rocYear}/${month}&stkno=${code}`,
            getData: (json: any) => (Array.isArray(json.aaData) ? json.aaData : []),
            getClosePriceIndex: () => 6,
        },
        EMERGING: {
            getUrl: (rocYear: number, month: string) => `https://www.tpex.org.tw/web/stock/emergingstock/historical/daily/EMDaily_result.php?l=zh-tw&d=${rocYear}/${month}&stkno=${code}`,
            getData: (json: any) => (Array.isArray(json.aaData) ? json.aaData : []),
            // Emerging market uses weighted average price as there is no "closing" price.
            getClosePriceIndex: () => 4,
        }
    };

    let rawData: any[] = [];
    let sourceKey: keyof typeof sources | null = null;

    try {
        // Sequentially try to fetch data from each source.
        for (const key of Object.keys(sources) as Array<keyof typeof sources>) {
            sourceKey = key;
            const currentSource = sources[sourceKey];
            const dates = [today, lastMonthDate];

            const urls = dates.map(date => {
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const rocYear = year - 1911;
                return currentSource.getUrl(sourceKey === 'TSE' ? year : rocYear, month);
            });

            const responses = await Promise.all(urls.map(url => fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)));
            let combinedData: any[] = [];

            for (const response of responses) {
                if (response.ok) {
                    const responseText = await response.text();
                    try {
                        const json = JSON.parse(responseText);
                        combinedData.push(...currentSource.getData(json));
                    } catch (e) {
                        console.warn(`Failed to parse historical data for ${sourceKey}. URL: ${response.url}, Body:`, responseText.substring(0, 200));
                    }
                }
            }
            
            if (combinedData.length > 0) {
                rawData = combinedData;
                break; // Found data, stop searching.
            } else {
                sourceKey = null; // Reset if no data found.
            }
        }
        
        if (rawData.length === 0 || !sourceKey) {
            throw new Error('No historical data found from TSE, OTC, or Emerging sources.');
        }

        const closePriceIndex = sources[sourceKey].getClosePriceIndex();
        const historicalPoints: HistoricalDataPoint[] = rawData
            .map(item => {
                if (Array.isArray(item) && item.length > closePriceIndex) {
                    const date = item[0]?.trim();
                    const closePriceStr = item[closePriceIndex];
                    if (date && typeof closePriceStr === 'string') {
                         return {
                            date: date,
                            close: parseFloat(closePriceStr.trim().replace(/,/g, '')),
                        };
                    }
                }
                return null;
            })
            .filter((point): point is HistoricalDataPoint => point !== null && point.date != null && !isNaN(point.close) && point.close > 0);

        if (historicalPoints.length === 0) {
            throw new Error('Could not parse any valid historical data points from the API response.');
        }

        // De-duplicate and sort the data.
        const uniquePoints = Array.from(new Map(historicalPoints.map(p => [p.date, p])).values());
        
        uniquePoints.sort((a, b) => {
            // Dates are in ROC format (e.g., "113/05/22").
            const dateA = new Date(a.date.replace(/(\d+)\/(\d+)\/(\d+)/, (_, y, m, d) => `${parseInt(y) + 1911}-${m}-${d}`));
            const dateB = new Date(b.date.replace(/(\d+)\/(\d+)\/(\d+)/, (_, y, m, d) => `${parseInt(y) + 1911}-${m}-${d}`));
            return dateB.getTime() - dateA.getTime();
        });

        // Return the most recent 30 trading days.
        return uniquePoints.slice(0, 30);

    } catch (error) {
        console.error(`Failed to fetch or parse historical data for ${code}:`, error);
        if (error instanceof Error && error.message.includes('No historical data found')) {
             throw new Error("無法從上市、上櫃或興櫃市場獲取此股票的歷史股價資料。");
        }
        throw new Error("無法獲取歷史股價資料。");
    }
};

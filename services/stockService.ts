

import { Stock, HistoricalDataPoint, FinancialDataPoint, StockListItem } from '../types';

/**
 * Fetches real-time stock data from the official Taiwan Stock Exchange (TWSE) MIS API.
 * This is more reliable and accurate than scraping.
 * @param codes - An array of stock codes to fetch data for.
 * @param stockList - The full list of stocks containing market information.
 * @returns A promise that resolves to an array of Stock objects.
 */
export const fetchStockData = async (codes: string[], stockList: StockListItem[]): Promise<Stock[]> => {
    if (codes.length === 0) {
        return [];
    }

    const stockMap = new Map(stockList.map(s => [s.code, s]));

    const exChList = codes
        .map(code => {
            const stockInfo = stockMap.get(code);
            const market = stockInfo?.market;
            // Default to 'tse' (上市) if market is unknown.
            const prefix = market === '上櫃' ? 'otc' : 'tse';
            return `${prefix}_${code}.tw`;
        })
        .join('|');

    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exChList}&_=${Date.now()}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Proxy request failed with status ${response.status}`);
        }
        
        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse MIS API data from proxy. Response:", text?.substring(0, 500));
            throw new Error('API 回應格式錯誤，可能是暫時的網路問題或服務中斷。');
        }


        if (!json.msgArray || json.msgArray.length === 0) {
            console.warn("MIS API returned no data", json);
            // This can happen if all requested stocks are invalid, so we return an empty array.
            if (codes.length > 0) {
                 throw new Error("無法獲取任何股票資料。請檢查您的網路連線或稍後再試。");
            }
            return [];
        }

        const stocks: Stock[] = json.msgArray
            .map((data: any) => {
                // Robust parsing: convert to string, handle potential nulls, and remove commas.
                const priceStr = String(data.z || '').replace(/,/g, '');
                const price = parseFloat(priceStr);
                const yesterdayPrice = parseFloat(String(data.y || '').replace(/,/g, ''));
                const open = parseFloat(String(data.o || '').replace(/,/g, ''));
                const high = parseFloat(String(data.h || '').replace(/,/g, ''));
                const low = parseFloat(String(data.l || '').replace(/,/g, ''));
                // Use `tv` (total volume in lots) instead of `v` (last trade volume).
                const totalVolumeInLots = parseInt(String(data.tv || '').replace(/,/g, ''), 10);

                if (isNaN(yesterdayPrice)) {
                    return null; // Cannot proceed without a reference price.
                }
                
                // If price is not a number (e.g., '-'), the stock hasn't traded.
                // Display yesterday's price with 0 change for a better UX.
                const displayPrice = isNaN(price) ? yesterdayPrice : price;
                const change = isNaN(price) ? 0 : displayPrice - yesterdayPrice;
                const changePercent = yesterdayPrice !== 0 ? (change / yesterdayPrice) * 100 : 0;
                
                const validOpen = isNaN(open) ? yesterdayPrice : open;
                const stockInfo = stockMap.get(data.c);
                const tradingDate = data.d; // e.g. "20240909"
                const formattedDate = tradingDate ? `${tradingDate.substring(0, 4)}-${tradingDate.substring(4, 6)}-${tradingDate.substring(6, 8)}` : undefined;

                return {
                    code: data.c,
                    name: stockInfo?.name || data.n,
                    market: stockInfo?.market, // Pass market type for financial data fetching
                    date: formattedDate,
                    price: displayPrice,
                    change: parseFloat(change.toFixed(2)),
                    changePercent: parseFloat(changePercent.toFixed(2)),
                    open: validOpen,
                    // If high/low are not available, they should be at least the opening price.
                    high: isNaN(high) ? validOpen : high,
                    low: isNaN(low) ? validOpen : low,
                    volume: isNaN(totalVolumeInLots) ? 0 : totalVolumeInLots,
                    yesterdayPrice: yesterdayPrice,
                };
            })
            .filter((stock): stock is Stock => stock !== null);
            
        if (codes.length > 0 && stocks.length === 0) {
             throw new Error("無法獲取任何股票資料。請檢查您的網路連線或稍後再試。");
        }
        
        return stocks;

    } catch (error) {
        console.error("Failed to fetch real stock data from MIS API:", error);
        if (error instanceof Error) throw error;
        throw new Error("無法從證交所 MIS API 獲取即時資料。");
    }
};

/**
 * Fetches intraday (5-minute interval) stock data from Yahoo Finance for sparkline charts.
 * @param code - The stock code.
 * @returns A promise that resolves to an array of numbers (prices) or null if failed.
 */
export const fetchIntradayData = async (code: string): Promise<number[] | null> => {
    try {
        const market = parseInt(code, 10) >= 3000 && parseInt(code, 10) < 9000 && code.length === 4 ? 'TWO' : 'TW';
        const yahooApiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${market}?region=US&lang=en-US&includePrePost=false&interval=5m&useYfid=true&range=1d`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooApiUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) return null;
        
        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (result && result.indicators?.quote?.[0]?.close) {
            // Filter out any null values which can occur during market breaks.
            return result.indicators.quote[0].close.filter((p: number | null) => p !== null);
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch intraday chart data for ${code}:`, error);
        return null;
    }
};

/**
 * Fetches detailed chart data from Yahoo Finance for modal charts.
 * @param code - The stock code.
 * @param range - The time range ('intraday', 'daily', 'weekly', 'monthly').
 * @returns A promise that resolves to an array of HistoricalDataPoint objects.
 */
export const fetchChartData = async (code: string, range: 'intraday' | 'daily' | 'weekly' | 'monthly'): Promise<HistoricalDataPoint[]> => {
    let apiRange: string;
    let apiInterval: string;

    switch (range) {
        case 'daily':
            apiRange = '1y';
            apiInterval = '1d';
            break;
        case 'weekly':
            apiRange = '5y';
            apiInterval = '1wk';
            break;
        case 'monthly':
            apiRange = 'max';
            apiInterval = '1mo';
            break;
        case 'intraday':
        default:
            apiRange = '1d';
            apiInterval = '5m';
            break;
    }

    try {
        const market = parseInt(code, 10) >= 3000 && parseInt(code, 10) < 9000 && code.length === 4 ? 'TWO' : 'TW';
        const yahooApiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${market}?region=US&lang=en-US&includePrePost=false&interval=${apiInterval}&useYfid=true&range=${apiRange}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooApiUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Yahoo API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
            const points: HistoricalDataPoint[] = result.timestamp
                .map((ts: number, index: number) => ({
                    date: String(ts), // Store Unix timestamp (in seconds) as a string
                    close: result.indicators.quote[0].close[index],
                }))
                .filter((p: any) => p.close !== null);
            
            if (points.length < 2) {
                 throw new Error('API 回傳的數據點不足以繪製圖表。');
            }

            return points;
        }
        
        throw new Error('從 API 回應中找不到有效的圖表數據。');
    } catch (error) {
        console.error(`Failed to fetch chart data for ${code} with range ${range}:`, error);
        if (error instanceof Error) throw error;
        throw new Error("無法獲取走勢資料。");
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
                    const text = await response.text();
                    try {
                        const json = JSON.parse(text);
                        combinedData.push(...currentSource.getData(json));
                    } catch (e) {
                        console.warn(`Failed to parse historical data for ${sourceKey}. URL: ${response.url}, Body:`, text?.substring(0, 200));
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
                    const dateStr = item[0]?.trim();
                    const closePriceStr = item[closePriceIndex];
                    if (dateStr && typeof closePriceStr === 'string') {
                         const rocParts = dateStr.split('/');
                         if (rocParts.length === 3) {
                            const year = parseInt(rocParts[0], 10) + 1911;
                            const isoDate = `${year}-${rocParts[1].padStart(2, '0')}-${rocParts[2].padStart(2, '0')}`;
                            return {
                                date: isoDate,
                                close: parseFloat(closePriceStr.trim().replace(/,/g, '')),
                            };
                         }
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
        
        uniquePoints.sort((a, b) => b.date.localeCompare(a.date));

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

/**
 * Fetches quarterly financial data by scraping the official Market Observation Post System (MOPS).
 * @param stock - The stock object, which includes the code and market type.
 * @returns A promise that resolves to an array of FinancialDataPoint objects.
 */
export const fetchFinancialData = async (stock: Stock): Promise<FinancialDataPoint[]> => {
    const code = stock.code;
    const marketType = stock.market === '上櫃' ? 'otc' : 'sii';
    const results: FinancialDataPoint[] = [];

    // Determine the latest completed quarter to start fetching from.
    const today = new Date();
    let year = today.getFullYear();
    let quarter = Math.floor((today.getMonth()) / 3); // Current quarter (0-3 -> Q1-Q4)
    if (quarter === 0) {
        quarter = 4;
        year -= 1;
    }

    try {
        for (let i = 0; i < 4; i++) {
            const rocYear = year - 1911;
            const season = String(quarter).padStart(2, '0');

            const formData = new URLSearchParams();
            formData.append('encodeURIComponent', '1');
            formData.append('step', '1');
            formData.append('firstin', '1');
            formData.append('off', '1');
            formData.append('TYPEK', marketType);
            formData.append('year', String(rocYear));
            formData.append('season', season);
            formData.append('co_id', code);
            
            const url = 'https://mopsov.twse.com.tw/mops/web/t163sb01';
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            if (response.ok) {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const rows = doc.querySelectorAll('table.hasBorder tr');
                const dataMap = new Map<string, number>();

                rows.forEach(row => {
                    const tableRow = row as HTMLTableRowElement;
                    const titleCell = tableRow.cells[0]?.textContent?.trim().replace(/\s/g, '');
                    let valueCell = tableRow.cells[1]?.textContent?.trim().replace(/,/g, '');

                    if (titleCell && valueCell) {
                        // Handle negative numbers represented by parentheses, e.g., (123,456)
                        const isNegative = valueCell.startsWith('(') && valueCell.endsWith(')');
                        if (isNegative) {
                            valueCell = '-' + valueCell.substring(1, valueCell.length - 1);
                        }
                        
                        const value = parseFloat(valueCell);
                        if (!isNaN(value)) {
                            if (titleCell.includes('營業收入')) dataMap.set('revenue', value);
                            else if (titleCell.includes('營業毛利')) dataMap.set('grossProfit', value);
                            else if (titleCell.includes('營業利益')) dataMap.set('operatingIncome', value);
                            else if (titleCell.includes('本期淨利')) dataMap.set('netIncome', value);
                        }
                    }
                });
                
                const revenue = dataMap.get('revenue');
                const grossProfit = dataMap.get('grossProfit');
                const operatingIncome = dataMap.get('operatingIncome');
                const netIncome = dataMap.get('netIncome');

                if (revenue && grossProfit && operatingIncome && netIncome && revenue !== 0) {
                     const revenueInBillions = parseFloat((revenue / 100000).toFixed(2));
                     const grossMargin = parseFloat(((grossProfit / revenue) * 100).toFixed(2));
                     const operatingMargin = parseFloat(((operatingIncome / revenue) * 100).toFixed(2));
                     const netMargin = parseFloat(((netIncome / revenue) * 100).toFixed(2));
                     
                     results.push({
                        quarter: `${rocYear}Q${quarter}`,
                        revenue: revenueInBillions,
                        grossMargin: isNaN(grossMargin) ? 0 : grossMargin,
                        operatingMargin: isNaN(operatingMargin) ? 0 : operatingMargin,
                        netMargin: isNaN(netMargin) ? 0 : netMargin,
                     });
                }
            }

            // Decrement quarter for the next iteration.
            quarter--;
            if (quarter === 0) {
                quarter = 4;
                year--;
            }
        }

        if (results.length === 0) {
            throw new Error('無法從 MOPS 網站解析出有效的財務數據。');
        }

        return results.reverse(); // Sort from oldest to newest for charting.

    } catch (error) {
        console.error(`Failed to fetch financial data for ${code} from MOPS:`, error);
        if (error instanceof Error) {
             if(error.message.includes('fetch')) {
                throw new Error('無法連接至公開資訊觀測站，請檢查網路連線。');
            }
            throw error;
        }
        throw new Error('無法從公開資訊觀測站獲取財務報表。');
    }
};
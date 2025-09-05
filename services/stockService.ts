import { Stock } from '../types';

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

    // Construct the query string required by the TWSE API, e.g., 'tse_2330.tw|tse_2317.tw'
    const query = codes.map(code => `tse_${code}.tw`).join('|');
    
    // The official TWSE API endpoint for real-time data
    const apiUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${query}&json=1&delay=0&_=${Date.now()}`;
    
    // We use a public CORS proxy to bypass browser security restrictions.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();

        if (!data || !data.msgArray || data.msgArray.length === 0) {
            console.warn("TWSE API returned no data for codes:", codes);
            // Return empty array for codes that might be invalid or delisted
            return [];
        }

        // Map the raw API response to our standardized 'Stock' interface
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

        return stocks;
    } catch (error) {
        console.error("Failed to fetch real stock data via CORS proxy:", error);
        throw new Error("無法從台灣證券交易所獲取即時資料。這可能是暫時性網路問題或 CORS Proxy 服務不穩定所致。");
    }
};

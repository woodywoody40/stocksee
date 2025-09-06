import { TW_STOCKS } from '../data/tw_stocks';

interface StockListItem {
  code: string;
  name: string;
  alias?: string[];
}

const CACHE_KEY = 'full-stock-list';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Official and more reliable sources for stock lists
const TSE_LIST_URL = 'https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json&type=ALL';
const OTC_LIST_URL = 'https://www.tpex.org.tw/web/stock/aftertrading/daily_close_quotes/stk_quote_result.php?l=zh-tw&o=json';
const ETF_LIST_URL = 'https://www.twse.com.tw/zh/api/ETF/list';
const EMG_LIST_URL = 'https://www.tpex.org.tw/web/stock/emergingstock/stk_quote/stk_quote_result.php?l=zh-tw&o=json';


const fetchJsonWithProxy = async (url: string) => {
    // Switched to a more robust CORS proxy to resolve fetch failures.
    const proxyUrl = `https://cors.bridged.cc/${url}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch from ${url} via proxy with status: ${response.status}`);
    }
    
    // The new proxy returns the JSON directly, no need to parse 'contents'.
    return response.json();
};

const fetchFullListFromApi = async (): Promise<StockListItem[]> => {
    try {
        console.log("Fetching full stock list from official sources...");
        const sources = [
            { name: 'TSE', url: TSE_LIST_URL, parser: (data: any) => data.data9?.map((s: string[]) => ({ code: s[0].trim(), name: s[1].trim() })) || [] },
            { name: 'OTC', url: OTC_LIST_URL, parser: (data: any) => data.aaData?.map((s: string[]) => ({ code: s[0].trim(), name: s[1].trim() })) || [] },
            { name: 'ETF', url: ETF_LIST_URL, parser: (data: any) => data.result?.map((s: { stk_no: string; stk_name: string; }) => ({ code: s.stk_no.trim(), name: s.stk_name.trim() })) || [] },
            { name: 'EMG', url: EMG_LIST_URL, parser: (data: any) => data.aaData?.map((s: string[]) => ({ code: s[0].trim(), name: s[1].trim() })) || [] }
        ];
        
        const results = await Promise.allSettled(sources.map(s => fetchJsonWithProxy(s.url)));
        
        let combinedList: StockListItem[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                try {
                    const parsedStocks = sources[index].parser(result.value);
                    if (parsedStocks.length > 0) {
                        combinedList.push(...parsedStocks);
                    }
                } catch (parseError) {
                    console.warn(`Failed to parse stock list for ${sources[index].name}:`, parseError);
                }
            } else {
                console.warn(`Failed to fetch stock list for ${sources[index].name}:`, result.reason);
            }
        });

        if (combinedList.length === 0) {
           throw new Error("All official API sources failed to return data.");
        }
        
        const uniqueStocks = Array.from(new Map(combinedList.map(item => [item.code, item])).values());
        
        const fallbackMap = new Map(TW_STOCKS.map(s => [s.code, s.alias]));
        const listWithAliases = uniqueStocks.map(stock => {
            const alias = fallbackMap.get(stock.code);
            return alias ? { ...stock, alias } : stock;
        });

        console.log(`Successfully fetched and combined ${listWithAliases.length} stocks from official sources.`);
        return listWithAliases;
    } catch (error) {
        console.error("Failed to fetch full stock list from API:", error);
        throw error;
    }
};

/**
 * Gets the complete list of Taiwanese stocks.
 * It first tries to load from a 24-hour local cache. If the cache is stale or absent,
 * it fetches fresh data from the APIs. If the API fetch fails, it returns a static
 * fallback list.
 * @returns A promise that resolves to an array of stock list items.
 */
export const getFullStockList = async (): Promise<StockListItem[]> => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                console.log("Using cached full stock list.");
                return data;
            }
        }

        const freshData = await fetchFullListFromApi();
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: freshData }));
        return freshData;

    } catch (error) {
        console.warn("Using fallback static stock list due to an error fetching/caching the full list.");
        return TW_STOCKS;
    }
};
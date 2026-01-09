import { TW_STOCKS } from '../data/tw_stocks';
import { StockListItem } from '../types';

/**
 * Gets the complete list of Taiwanese stocks.
 * Since we now use an automated script (scripts/update-stocks.js) to generate a comprehensive
 * local list in TW_STOCKS, we no longer need to fetch from the unpredictable ISIN page at runtime.
 * This ensures:
 * 1. Zero network latency for the search bar.
 * 2. 100% reliability (no proxy failures).
 * 3. Consistent results matching the repo state.
 * 
 * @returns A promise that resolves to an array of stock list items.
 */
export const getFullStockList = async (): Promise<StockListItem[]> => {
    // We wrap it in a promise to keep the interface consistent for now,
    // in case we want to add back async sources later.
    return Promise.resolve(TW_STOCKS);
};
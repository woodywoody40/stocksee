import { TW_STOCKS } from '../data/tw_stocks';
import { StockListItem } from '../types';

/**
 * Gets the complete list of Taiwanese stocks.
 * To maximize performance and reliability, this function now uses a comprehensive,
 * built-in static list of stocks and programmatically adds the market type.
 * This avoids slow, unreliable, and proxy-dependent web scraping for a list
 * that changes infrequently.
 * @returns A promise that resolves to an array of stock list items.
 */
export const getFullStockList = async (): Promise<StockListItem[]> => {
    console.log("Using optimized static stock list for performance and reliability.");

    const processedList = TW_STOCKS.map(stock => {
        // Heuristic to determine market type based on stock code. This is crucial for
        // the financial data fetching service which requires the market type.
        // '上市' (TSE) or '上櫃' (OTC).
        const codeNum = parseInt(stock.code, 10);
        let market = '上市'; // Default to TSE (上市)

        // General rule for OTC stocks (上櫃) - many are in the 3000-8999 range.
        // This is a heuristic and might not be 100% accurate but covers the vast majority.
        if (!isNaN(codeNum) && stock.code.length === 4) {
            if ((codeNum >= 3000 && codeNum < 4000) || 
                (codeNum >= 4100 && codeNum < 5000) || 
                (codeNum >= 5200 && codeNum < 5500) || 
                (codeNum >= 6100 && codeNum < 6700) ||
                (codeNum >= 8000 && codeNum < 9000)) {
                market = '上櫃';
            }
        }
        
        // ETFs are listed on TSE.
        if (stock.code.startsWith('00')) {
            market = '上市';
        }

        return { ...stock, market };
    });
    
    // The function remains async to maintain a consistent interface across services.
    return Promise.resolve(processedList);
};

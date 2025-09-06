import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { fetchStockData } from '../services/stockService';
import { Stock } from '../types';
import { DEFAULT_STOCKS, REFRESH_INTERVAL } from '../constants';
import StockCard from './StockCard';
import StockModal from './StockModal';
import SearchBar from './SearchBar';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-12 space-x-2">
        <div className="w-3 h-3 bg-brand-gold rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-3 h-3 bg-brand-gold rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-brand-gold rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-2xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary tracking-wide flex items-center gap-3">
        <span className="w-1.5 h-6 bg-brand-gold rounded-full"></span>
        {children}
    </h2>
);

interface MarketViewProps {
    onStartAnalysis: (stockName: string, stockCode: string) => void;
}

const MarketView: React.FC<MarketViewProps> = ({ onStartAnalysis }) => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [watchlist, setWatchlist] = useLocalStorage<string[]>('watchlist', []);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [searchCodes, setSearchCodes] = useState<string[]>([]);

    const codesToFetch = useMemo(() => {
        const combined = new Set([...DEFAULT_STOCKS, ...watchlist, ...searchCodes]);
        return Array.from(combined);
    }, [watchlist, searchCodes]);

    // Effect for user-driven data fetching (initial load, search, watchlist changes)
    useEffect(() => {
        let isCancelled = false;
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            if (codesToFetch.length === 0) {
                setStocks([]);
                setIsLoading(false);
                return;
            }

            try {
                const data = await fetchStockData(codesToFetch);
                if (!isCancelled) {
                    const sortedData = data.sort((a, b) => codesToFetch.indexOf(a.code) - codesToFetch.indexOf(b.code));
                    setStocks(sortedData);
                }
            } catch (err) {
                if (!isCancelled) {
                    setError('無法獲取股票資料，請稍後再試。');
                    console.error(err);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isCancelled = true;
        };
    }, [codesToFetch]);

    // Effect for background refresh interval
    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (codesToFetch.length === 0 || document.hidden) return;
            try {
                const data = await fetchStockData(codesToFetch);
                const sortedData = data.sort((a, b) => codesToFetch.indexOf(a.code) - codesToFetch.indexOf(b.code));
                setStocks(currentStocks => {
                    const newStocksMap = new Map(sortedData.map(s => [s.code, s]));
                    // Create a combined list of codes to maintain order and include new stocks
                    const allCodes = Array.from(new Set([...currentStocks.map(s => s.code), ...sortedData.map(s => s.code)]));
                    return allCodes.map(code => newStocksMap.get(code) || currentStocks.find(s => s.code === code)).filter(Boolean) as Stock[];
                });
            } catch (err) {
                console.error("Background refresh failed:", err);
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [codesToFetch]);


    const toggleWatchlist = (code: string) => {
        setWatchlist(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const handleSearch = (codes: string[]) => {
        setSearchCodes(codes);
    };

    const watchlistStocks = stocks.filter(stock => watchlist.includes(stock.code));
    const marketStocks = stocks.filter(stock => DEFAULT_STOCKS.includes(stock.code));
    const searchResultStocks = searchCodes.length > 0 ? stocks.filter(stock => searchCodes.includes(stock.code)) : [];

    const renderStockGrid = (stockList: Stock[]) => (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {stockList.map((stock, index) => (
                <div key={stock.code} className="animate-staggered-fade-in" style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}>
                    <StockCard
                        stock={stock}
                        isWatched={watchlist.includes(stock.code)}
                        onToggleWatchlist={toggleWatchlist}
                        onCardClick={setSelectedStock}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-12">
            <SearchBar onSearch={handleSearch} />
            {error && <p className="text-center text-positive bg-positive/20 p-3 rounded-lg">{error}</p>}
            
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {searchCodes.length > 0 ? (
                        <section>
                            <SectionHeader>搜尋結果</SectionHeader>
                            {searchResultStocks.length > 0 ? renderStockGrid(searchResultStocks) : <p className="text-text-light-secondary dark:text-text-dark-secondary text-center py-8">找不到符合代號的股票。</p>}
                        </section>
                    ) : (
                        <>
                            {watchlist.length > 0 && (
                                <section>
                                    <SectionHeader>我的關注列表</SectionHeader>
                                    {renderStockGrid(watchlistStocks)}
                                </section>
                            )}

                            <section>
                                <SectionHeader>市場焦點</SectionHeader>
                                {marketStocks.length > 0 ? (
                                   renderStockGrid(marketStocks)
                                ) : (
                                   <p className="text-text-light-secondary dark:text-text-dark-secondary text-center py-8">
                                       無法載入市場焦點。
                                   </p>
                                )}
                            </section>
                        </>
                    )}
                </>
            )}

            {selectedStock && (
                <StockModal 
                  stock={selectedStock} 
                  onClose={() => setSelectedStock(null)}
                  onStartAnalysis={onStartAnalysis}
                />
            )}
        </div>
    );
};

export default MarketView;
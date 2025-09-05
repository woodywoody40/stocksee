import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { fetchStockData } from '../services/stockService';
import { Stock } from '../types';
import { DEFAULT_STOCKS, REFRESH_INTERVAL } from '../constants';
import StockCard from './StockCard';
import StockModal from './StockModal';
import SearchBar from './SearchBar';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
    </div>
);

const MarketView: React.FC = () => {
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

    const fetchData = useCallback(async () => {
        if (codesToFetch.length === 0) {
            setStocks([]);
            setIsLoading(false);
            return;
        }
        
        if(stocks.length === 0) setIsLoading(true);
        setError(null);
        try {
            const data = await fetchStockData(codesToFetch);
            // Sort data to maintain a consistent order
            const sortedData = data.sort((a, b) => codesToFetch.indexOf(a.code) - codesToFetch.indexOf(b.code));
            setStocks(sortedData);
        } catch (err) {
            setError('無法獲取股票資料，請稍後再試。');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [codesToFetch, stocks.length]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, REFRESH_INTERVAL);
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const marketStocks = stocks.filter(stock => !watchlist.includes(stock.code) && DEFAULT_STOCKS.includes(stock.code) && !searchCodes.length);
    const searchResultStocks = searchCodes.length > 0 ? stocks.filter(stock => searchCodes.includes(stock.code)) : [];

    const renderStockGrid = (stockList: Stock[]) => (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {stockList.map((stock, index) => (
                <div key={stock.code} className="animate-staggered-fade-in" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
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
        <div className="space-y-10">
            <SearchBar onSearch={handleSearch} />
            {error && <p className="text-center text-negative bg-negative/20 p-3 rounded-lg">{error}</p>}
            
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {searchCodes.length > 0 ? (
                        <section>
                            <h2 className="text-2xl font-bold mb-5 text-gray-100 border-l-4 border-brand-gold pl-3">搜尋結果</h2>
                            {searchResultStocks.length > 0 ? renderStockGrid(searchResultStocks) : <p className="text-text-secondary text-center py-8">找不到符合代號的股票。</p>}
                        </section>
                    ) : (
                        <>
                            {watchlist.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold mb-5 text-gray-100 border-l-4 border-brand-gold pl-3">我的關注列表</h2>
                                    {renderStockGrid(watchlistStocks)}
                                </section>
                            )}

                            <section>
                                <h2 className="text-2xl font-bold mb-5 text-gray-100 border-l-4 border-brand-gold pl-3">市場焦點</h2>
                                {marketStocks.length > 0 ? (
                                   renderStockGrid(marketStocks)
                                ) : (
                                   <p className="text-text-secondary text-center py-8">
                                       {watchlist.length === 0 ? '您的關注列表是空的。點擊股票卡片上的星星來新增。' : '無法載入市場焦點。'}
                                   </p>
                                )}
                            </section>
                        </>
                    )}
                </>
            )}

            {selectedStock && (
                <StockModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
            )}
        </div>
    );
};

export default MarketView;
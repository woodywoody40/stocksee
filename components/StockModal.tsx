

import React, { useEffect, useState, useCallback } from 'react';
import { Stock, HistoricalDataPoint, FinancialDataPoint } from '../types';
import { fetchHistoricalData, fetchFinancialData } from '../services/stockService';
import { getAIFinancialAnalysis } from '../services/geminiService';
import StockChart from './StockChart';
import BarChart from './BarChart';

interface StockModalProps {
    stock: Stock;
    apiKey: string;
    onClose: () => void;
    onStartAnalysis: (stockName: string, stockCode: string) => void;
}

type ModalTab = 'quote' | 'financials';

const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
    </svg>
);

const ArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
    </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const LoadingSpinner: React.FC<{ small?: boolean }> = ({ small = false }) => (
    <div className={`flex justify-center items-center space-x-2 ${small ? '' : 'p-4'}`}>
        <div className={`bg-primary rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0s' }}></div>
        <div className={`bg-primary rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0.2s' }}></div>
        <div className={`bg-primary rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className = '' }) => (
    <div className="bg-white/5 rounded-xl p-3 text-center">
        <p className="text-sm text-secondary-dark mb-1">{label}</p>
        <p className={`text-lg font-semibold ${className}`}>{value}</p>
    </div>
);

const QuoteTab: React.FC<{ stock: Stock, apiKey: string, onStartAnalysis: (name: string, code: string) => void }> = ({ stock, apiKey, onStartAnalysis }) => {
    const isPositive = stock.change > 0;
    const isNegative = stock.change < 0;
    const chartColor = isPositive
        ? 'rgb(var(--color-positive))'
        : isNegative
        ? 'rgb(var(--color-negative))'
        : '#a1a1aa';
    
    const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[] | null>(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);

    useEffect(() => {
        const loadHistoricalData = async () => {
            setIsHistoryLoading(true);
            setHistoryError(null);
            setHistoricalData(null);
            try {
                const data = await fetchHistoricalData(stock.code);
                // Only add today's point if we have a valid date from the stock data
                if (stock.date) {
                    const todayPoint: HistoricalDataPoint = {
                        date: stock.date,
                        close: stock.price,
                    };
                    const combinedData = data ? [todayPoint, ...data.filter(d => d.date !== todayPoint.date)] : [todayPoint];
                    setHistoricalData(combinedData);
                } else {
                    // If we don't have a date (e.g., API error), just show historical data
                    setHistoricalData(data);
                }
            } catch (err) {
                 if (err instanceof Error) {
                    setHistoryError(err.message);
                } else {
                    setHistoryError('獲取歷史資料時發生未知錯誤。');
                }
            } finally {
                setIsHistoryLoading(false);
            }
        };
        loadHistoricalData();
    }, [stock.code, stock.price, stock.date]);

    const getStatColor = (value: number) => {
        if (value > stock.yesterdayPrice) return 'text-positive';
        if (value < stock.yesterdayPrice) return 'text-negative';
        return 'text-on-surface-dark';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="h-40 -mx-6 bg-black/10 rounded-lg">
                {isHistoryLoading ? (
                        <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>
                ) : historyError ? (
                        <div className="h-full flex items-center justify-center"><p className="text-sm text-center text-positive/90 p-2">{historyError}</p></div>
                ) : historicalData ? (
                        <StockChart priceData={historicalData} color={chartColor} />
                ) : null}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <DetailItem label="開盤價" value={stock.open.toFixed(2)} className={getStatColor(stock.open)} />
                <DetailItem label="最高價" value={stock.high.toFixed(2)} className={getStatColor(stock.high)} />
                <DetailItem label="最低價" value={stock.low.toFixed(2)} className={getStatColor(stock.low)} />
                <DetailItem label="昨收價" value={stock.yesterdayPrice.toFixed(2)} className="text-on-surface-dark" />
                <DetailItem label="成交量" value={`${Math.floor(stock.volume).toLocaleString()}`} className="text-on-surface-dark" />
            </div>
            <button
                onClick={() => onStartAnalysis(stock.name, stock.code)}
                disabled={!apiKey}
                className="w-full flex justify-center items-center gap-2 bg-primary/90 hover:bg-primary text-on-primary font-bold py-3 px-4 rounded-xl transition duration-300 disabled:bg-tertiary-dark disabled:cursor-not-allowed transform hover:scale-105"
            >
                <SparklesIcon className="w-5 h-5" />
                一鍵深度洞察
            </button>
        </div>
    );
};

const FinancialsTab: React.FC<{ stock: Stock, apiKey: string }> = ({ stock, apiKey }) => {
    const [financialData, setFinancialData] = useState<FinancialDataPoint[] | null>(null);
    const [isFinancialsLoading, setIsFinancialsLoading] = useState(true);
    const [financialsError, setFinancialsError] = useState<string | null>(null);
    
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(true);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        const loadFinancials = async () => {
            setIsFinancialsLoading(true);
            setFinancialsError(null);
            setFinancialData(null);
            setIsAiLoading(true);
            setAiError(null);
            setAiSummary(null);

            try {
                const data = await fetchFinancialData(stock);
                setFinancialData(data);
                
                try {
                    const summary = await getAIFinancialAnalysis(apiKey, stock.name, data);
                    setAiSummary(summary);
                } catch (err) {
                    setAiError(err instanceof Error ? err.message : 'AI 分析失敗');
                }

            } catch (err) {
                setFinancialsError(err instanceof Error ? err.message : '無法獲取財務資料');
            } finally {
                setIsFinancialsLoading(false);
                setIsAiLoading(false);
            }
        };

        if (apiKey) {
            loadFinancials();
        } else {
             setFinancialsError("請先在「AI 新聞分析」頁面設定 Gemini API 金鑰以使用此功能。");
             setIsFinancialsLoading(false);
             setIsAiLoading(false);
        }
    }, [stock, apiKey]);

    if (isFinancialsLoading) {
        return <div className="py-10"><LoadingSpinner /></div>;
    }

    if (financialsError) {
        return <div className="text-center py-10 text-positive/90 text-sm">{financialsError}</div>;
    }

    if (!financialData || financialData.length < 1) {
        return <div className="text-center py-10 text-secondary-dark text-sm">此股票缺乏足夠的季度財務數據。</div>;
    }

    const chartData = {
        revenue: financialData.map(d => ({ label: d.quarter, value: d.revenue })),
        grossMargin: financialData.map(d => ({ label: d.quarter, value: d.grossMargin })),
        operatingMargin: financialData.map(d => ({ label: d.quarter, value: d.operatingMargin })),
        netMargin: financialData.map(d => ({ label: d.quarter, value: d.netMargin })),
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-primary">
                    <SparklesIcon className="w-5 h-5" /> AI 財務總評
                </h4>
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-sm text-on-surface-dark/90 leading-relaxed">
                   {isAiLoading && (
                        <div className="space-y-2">
                           <div className="h-3 bg-primary/30 rounded w-full animate-pulse"></div>
                           <div className="h-3 bg-primary/30 rounded w-5/6 animate-pulse"></div>
                           <div className="h-3 bg-primary/30 rounded w-3/4 animate-pulse"></div>
                        </div>
                   )}
                   {aiError && <p className="text-positive/90">{aiError}</p>}
                   {aiSummary && <p>{aiSummary}</p>}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                    關鍵指標趨勢
                </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <BarChart title="營業收入" unit="億元" data={chartData.revenue} />
                    <BarChart title="毛利率" unit="%" data={chartData.grossMargin} />
                    <BarChart title="營業利益率" unit="%" data={chartData.operatingMargin} />
                    <BarChart title="稅後淨利率" unit="%" data={chartData.netMargin} />
                </div>
            </div>
        </div>
    );
};

const StockModal: React.FC<StockModalProps> = ({ stock, apiKey, onClose, onStartAnalysis }) => {
    const isPositive = stock.change > 0;
    const isNegative = stock.change < 0;
    const priceColor = isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-on-surface-dark';
    
    const [isClosing, setIsClosing] = useState(false);
    const [activeTab, setActiveTab] = useState<ModalTab>('quote');
    
    const handleClose = useCallback(() => {
        if (isClosing) return;
        setIsClosing(true);
    }, [isClosing]);

    const handleAnimationEnd = (e: React.AnimationEvent) => {
        if (e.target === e.currentTarget && isClosing) {
            onClose();
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);
    
    const getTabClass = (tab: ModalTab) => 
        `px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/80 ${
            activeTab === tab 
            ? 'bg-primary/90 text-on-primary' 
            : 'text-secondary-dark hover:bg-white/10'
        }`;

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-backdrop-fade-in"
            style={{ perspective: '2000px' }}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
        >
            <div 
                className={`bg-surface-dark/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl w-full max-w-md flex flex-col overflow-hidden backface-hidden dark max-h-[90vh] ${isClosing ? 'animate-flip-out' : 'animate-flip-in'}`}
                style={{ transformStyle: 'preserve-3d', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
                onClick={(e) => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                <div className="flex-shrink-0 p-6 pb-0">
                     <button 
                        onClick={handleClose} 
                        className="absolute top-4 right-4 text-secondary-dark hover:text-on-surface-dark bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary z-20"
                        aria-label="關閉視窗"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                    <div id="stock-modal-title" className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-positive/20' : isNegative ? 'bg-negative/20' : 'bg-white/10'}`}>
                            {isPositive ? <ArrowUpIcon className="w-5 h-5 text-positive" /> : isNegative ? <ArrowDownIcon className="w-5 h-5 text-negative" /> : <span className="text-xl font-bold text-secondary-dark">-</span>}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-on-surface-dark">{stock.name}</h2>
                            <p className="text-sm text-secondary-dark">{stock.code}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-left">
                        <p className={`text-5xl font-bold ${priceColor}`}>{stock.price.toFixed(2)}</p>
                        <div className={`text-base font-semibold ${priceColor} mt-1 flex items-center`}>
                            <span>{isPositive ? '▲' : isNegative ? '▼' : ''}</span>
                            <span className={isPositive || isNegative ? "ml-1" : ""}>{stock.change.toFixed(2)}</span>
                            <span className="ml-2">({stock.changePercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 p-4">
                     <div className="bg-black/20 p-1 rounded-xl flex items-center gap-1">
                        <button onClick={() => setActiveTab('quote')} className={`w-1/2 ${getTabClass('quote')}`}>即時行情</button>
                        <button onClick={() => setActiveTab('financials')} className={`w-1/2 ${getTabClass('financials')}`}>財務簡析</button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto modal-scrollbar p-6 pt-2">
                   {activeTab === 'quote' && <QuoteTab stock={stock} apiKey={apiKey} onStartAnalysis={onStartAnalysis} />}
                   {activeTab === 'financials' && <FinancialsTab stock={stock} apiKey={apiKey} />}
                </div>
            </div>
        </div>
    );
};

export default StockModal;
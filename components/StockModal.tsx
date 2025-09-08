

import React, { useEffect, useState, useCallback } from 'react';
import { Stock, HistoricalDataPoint } from '../types';
import { getAIStockInsight } from '../services/geminiService';
import { fetchHistoricalData } from '../services/stockService';
import StockChart from './StockChart';

interface StockModalProps {
    stock: Stock;
    apiKey: string;
    onClose: () => void;
    onStartAnalysis: (stockName: string, stockCode: string) => void;
}

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
        <div className={`bg-brand-orange rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0s' }}></div>
        <div className={`bg-brand-orange rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0.2s' }}></div>
        <div className={`bg-brand-orange rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className = '' }) => (
    <div className="bg-surface-dark-alt/50 rounded-xl p-3 text-center">
        <p className="text-sm text-secondary-dark mb-1.5">{label}</p>
        <p className={`text-lg font-semibold text-on-surface-dark ${className}`}>{value}</p>
    </div>
);

const StockModal: React.FC<StockModalProps> = ({ stock, apiKey, onClose, onStartAnalysis }) => {
    const isPositive = stock.change >= 0;
    const priceColor = isPositive ? 'text-positive' : 'text-negative';
    const chartColor = isPositive ? '#ef4444' : '#22c55e';
    
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [insightError, setInsightError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    
    const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[] | null>(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);

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
    
    useEffect(() => {
        const loadHistoricalData = async () => {
            setIsHistoryLoading(true);
            setHistoryError(null);
            setHistoricalData(null);
            try {
                const data = await fetchHistoricalData(stock.code);
                const todayPoint: HistoricalDataPoint = {
                    date: new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
                    close: stock.price,
                };
                
                const combinedData = data ? [todayPoint, ...data.filter(d => d.date !== todayPoint.date)] : [todayPoint];
                setHistoricalData(combinedData);
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
    }, [stock.code, stock.price]);

    useEffect(() => {
        const fetchInsight = async () => {
            if (!apiKey) {
                setInsightError("請先至「AI 新聞分析」頁面設定 API 金鑰。");
                return;
            }
            setIsInsightLoading(true);
            setInsightError(null);
            try {
                const insight = await getAIStockInsight(apiKey, stock.name, stock.code);
                setAiInsight(insight);
            } catch (err) {
                if (err instanceof Error) {
                    setInsightError(err.message);
                } else {
                    setInsightError("無法生成 AI 洞察，請稍後再試。");
                }
            } finally {
                setIsInsightLoading(false);
            }
        };

        fetchInsight();
    }, [stock, apiKey]);
    
    const handleDeepAnalysisClick = () => {
        onStartAnalysis(stock.name, stock.code);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-fade-in"
            style={{ perspective: '2000px' }}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
        >
            <div 
                className={`bg-background-dark rounded-3xl border border-outline-dark shadow-2xl w-full max-w-md flex flex-col overflow-hidden backface-hidden dark max-h-[85vh] ${isClosing ? 'animate-flip-out' : 'animate-flip-in'}`}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={(e) => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                <div className="flex-grow overflow-y-auto modal-scrollbar p-6 space-y-6">
                    <div className="relative">
                        <button 
                            onClick={handleClose} 
                            className="absolute -top-2 -right-2 text-secondary-dark hover:text-on-surface-dark bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange z-20"
                            aria-label="關閉視窗"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>

                        <div id="stock-modal-title" className="flex items-center gap-3 mb-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-positive/20' : 'bg-negative/20'}`}>
                               {isPositive ? <ArrowUpIcon className="w-5 h-5 text-positive" /> : <ArrowDownIcon className="w-5 h-5 text-negative" /> }
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-on-surface-dark">{stock.name}</h2>
                                <p className="text-sm text-secondary-dark">{stock.code}</p>
                            </div>
                        </div>
                        
                        <div className="my-4 text-left">
                            <p className={`text-5xl font-bold ${priceColor}`}>{stock.price.toFixed(2)}</p>
                            <div className={`text-base font-semibold ${priceColor} mt-1 flex items-center`}>
                                <span>{isPositive ? '▲' : '▼'}</span>
                                <span className="ml-1">{stock.change.toFixed(2)}</span>
                                <span className="ml-2">({stock.changePercent.toFixed(2)}%)</span>
                            </div>
                        </div>
                        
                        <div className="h-40 my-4 -mx-6">
                            {isHistoryLoading ? (
                                 <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>
                            ) : historyError ? (
                                 <div className="h-full flex items-center justify-center"><p className="text-sm text-center text-positive/90 p-2">{historyError}</p></div>
                            ) : historicalData ? (
                                 <StockChart priceData={historicalData} color={chartColor} />
                            ) : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <DetailItem label="開盤價" value={stock.open.toFixed(2)} />
                        <DetailItem label="最高價" value={stock.high.toFixed(2)} className="text-positive" />
                        <DetailItem label="最低價" value={stock.low.toFixed(2)} className="text-negative" />
                        <DetailItem label="昨收價" value={stock.yesterdayPrice.toFixed(2)} />
                        <DetailItem label="成交量" value={`${Math.floor(stock.volume / 1000).toLocaleString()} 張`} />
                    </div>
                     
                    <div className="relative p-4 rounded-xl border border-brand-orange/40 bg-gradient-to-br from-brand-orange/10 to-transparent">
                       <div className="absolute -top-1 -right-1 text-brand-orange/20">
                            <SparklesIcon className="w-16 h-16 transform rotate-12" />
                       </div>
                       <div className="relative z-10">
                            <div className="flex items-center gap-2 text-brand-orange font-semibold mb-2">
                               <SparklesIcon className="w-5 h-5"/>
                               <h4>AI 即時洞察</h4>
                            </div>
                             <div className="text-sm min-h-[50px]">
                               {isInsightLoading ? <LoadingSpinner small /> :
                               insightError ? <p className="text-positive/90">{insightError}</p> :
                               aiInsight && <p className="text-secondary-dark leading-relaxed whitespace-pre-wrap">{aiInsight}</p>}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleDeepAnalysisClick}
                        disabled={!apiKey}
                        className="w-full flex justify-center items-center gap-2 bg-surface-dark-alt hover:bg-gray-700 text-on-primary font-bold py-3 px-4 rounded-xl transition duration-300 disabled:bg-tertiary-dark disabled:cursor-not-allowed transform hover:scale-105"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        一鍵深度洞察
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockModal;

import React, { useEffect, useState } from 'react';
import { Stock } from '../types';
import Sparkline from './Sparkline';
import { getAIStockInsight } from '../services/geminiService';

interface StockModalProps {
    stock: Stock;
    onClose: () => void;
    onStartAnalysis: (stockName: string, stockCode: string) => void;
}

const TrendUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
);

const TrendDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25" />
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
    <div className={`flex justify-center items-center space-x-2 ${small ? 'p-0' : 'p-4'}`}>
        <div className={`bg-brand-gold rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0s' }}></div>
        <div className={`bg-brand-gold rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0.2s' }}></div>
        <div className={`bg-brand-gold rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0.4s' }}></div>
    </div>
);


const DetailItem: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className = '' }) => (
    <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-lg border border-light-border dark:border-dark-border">
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">{label}</p>
        <p className={`text-xl font-semibold text-text-light-primary dark:text-text-dark-primary ${className}`}>{value}</p>
    </div>
);

const StockModal: React.FC<StockModalProps> = ({ stock, onClose, onStartAnalysis }) => {
    const isPositive = stock.change >= 0;
    const priceColor = isPositive ? 'text-positive' : 'text-negative';
    const priceData = [stock.open, stock.low, stock.high, stock.price].filter(p => p > 0);
    
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [insightError, setInsightError] = useState<string | null>(null);
    const [isButtonLoading, setIsButtonLoading] = useState(false);

    useEffect(() => {
        const fetchInsight = async () => {
            const cacheKey = `stock-insight-${stock.code}`;
            const cachedItem = sessionStorage.getItem(cacheKey);
            if (cachedItem) {
                 const { insight, timestamp } = JSON.parse(cachedItem);
                 // Cache for 5 minutes
                 if (Date.now() - timestamp < 5 * 60 * 1000) {
                    setAiInsight(insight);
                    return;
                 }
            }

            setIsInsightLoading(true);
            setInsightError(null);
            try {
                const insight = await getAIStockInsight(stock.name, stock.code);
                setAiInsight(insight);
                sessionStorage.setItem(cacheKey, JSON.stringify({ insight, timestamp: Date.now() }));
            } catch (err) {
                if (err instanceof Error) {
                    setInsightError(err.message);
                } else {
                    setInsightError("發生未知錯誤");
                }
            } finally {
                setIsInsightLoading(false);
            }
        };

        fetchInsight();
    }, [stock]);
    
    const handleDeepAnalysisClick = () => {
        setIsButtonLoading(true);
        onStartAnalysis(stock.name, stock.code);
        // Don't close immediately to show loading state, App.tsx will change view
        // onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-backdrop-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
        >
            <div 
                className="bg-light-card/90 dark:bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-light-border dark:border-dark-border shadow-2xl w-full max-w-md transform animate-pop-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                 <div className="p-6 pb-0">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue z-20"
                        aria-label="關閉視窗"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>

                    <div id="stock-modal-title" className="flex items-center gap-4 mb-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-positive/20' : 'bg-negative/20'}`}>
                           {isPositive ? <TrendUpIcon className="w-6 h-6 text-positive" /> : <TrendDownIcon className="w-6 h-6 text-negative" /> }
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">{stock.name}</h2>
                            <p className="text-text-light-secondary dark:text-text-dark-secondary">{stock.code}</p>
                        </div>
                    </div>
                    
                    <div className="my-6 text-center">
                        <p className={`text-5xl font-bold ${priceColor}`}>{stock.price.toFixed(2)}</p>
                        <div className={`text-lg font-semibold ${priceColor} mt-1`}>
                            <span>{isPositive ? '▲' : '▼'}</span>
                            <span> {stock.change.toFixed(2)}</span>
                            <span className="ml-2">({stock.changePercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                    
                    <div className="h-20 mb-6 -mt-4">
                        <Sparkline data={priceData} />
                    </div>
                </div>

                <div className="max-h-[calc(90vh-320px)] overflow-y-auto px-6 pb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="開盤價" value={stock.open.toFixed(2)} />
                        <DetailItem label="昨收價" value={stock.yesterdayPrice.toFixed(2)} />
                        <DetailItem label="最高價" value={stock.high.toFixed(2)} className="text-positive" />
                        <DetailItem label="最低價" value={stock.low.toFixed(2)} className="text-negative" />
                        <DetailItem label="成交量(張)" value={Math.floor(stock.volume / 1000).toLocaleString()} />
                    </div>

                    <div className="mt-6">
                        <div className="relative p-4 rounded-lg border border-brand-gold/20 dark:border-brand-gold/30 bg-gradient-to-br from-brand-gold/5 to-transparent dark:from-brand-gold/10 dark:to-transparent overflow-hidden">
                           <div className="absolute -top-10 -right-10 text-brand-gold/20 dark:text-brand-gold/20">
                                <SparklesIcon className="w-24 h-24 transform rotate-12" />
                           </div>
                           <div className="relative z-10">
                                <div className="flex items-center gap-2 text-brand-gold font-semibold mb-3">
                                   <SparklesIcon className="w-5 h-5"/>
                                   <h4>AI 即時洞察</h4>
                                </div>
                                 <div className="text-sm min-h-[60px]">
                                   {isInsightLoading && <LoadingSpinner />}
                                   {insightError && <p className="text-positive/90">{insightError}</p>}
                                   {aiInsight && <p className="text-text-light-secondary dark:text-text-dark-secondary leading-relaxed whitespace-pre-wrap">{aiInsight}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-4 bg-slate-100/70 dark:bg-black/20 border-t border-light-border dark:border-dark-border">
                     <button
                        onClick={handleDeepAnalysisClick}
                        disabled={isButtonLoading}
                        className="w-full flex justify-center items-center gap-2 bg-brand-blue hover:bg-brand-blue/80 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-text-light-tertiary dark:disabled:bg-text-dark-tertiary disabled:cursor-wait transform hover:scale-105"
                    >
                        {isButtonLoading ? (
                           <LoadingSpinner small={true} />
                        ) : (
                           <SparklesIcon className="w-5 h-5" />
                        )}
                        一鍵深度洞察
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockModal;
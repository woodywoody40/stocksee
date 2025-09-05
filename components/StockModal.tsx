import React from 'react';
import { Stock } from '../types';

interface StockModalProps {
    stock: Stock;
    onClose: () => void;
}

const TrendUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
);

const TrendDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 4.5 15 15m0 0V8.25m0 11.25H8.25" />
    </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const DetailItem: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className = '' }) => (
    <div className="bg-dark-bg/60 p-4 rounded-lg border border-dark-border">
        <p className="text-sm text-text-secondary mb-1">{label}</p>
        <p className={`text-xl font-semibold text-text-primary ${className}`}>{value}</p>
    </div>
);

const StockModal: React.FC<StockModalProps> = ({ stock, onClose }) => {
    const isPositive = stock.change >= 0;
    const priceColor = isPositive ? 'text-positive' : 'text-negative';

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-fade-in"
            onClick={onClose}
            role="dialog"
            // FIX: Ensure aria-modal is a string "true" to avoid type conflicts.
            aria-modal="true"
            aria-labelledby="stock-modal-title"
        >
            <div 
                className="bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-2xl w-full max-w-md transform animate-pop-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        aria-label="關閉視窗"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>

                    <div id="stock-modal-title" className="flex items-center gap-4 mb-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-positive/20' : 'bg-negative/20'}`}>
                           {isPositive ? <TrendUpIcon className="w-6 h-6 text-positive" /> : <TrendDownIcon className="w-6 h-6 text-negative" /> }
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">{stock.name}</h2>
                            <p className="text-text-secondary">{stock.code}</p>
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
                    
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="開盤價" value={stock.open.toFixed(2)} />
                        <DetailItem label="昨收價" value={stock.yesterdayPrice.toFixed(2)} />
                        <DetailItem label="最高價" value={stock.high.toFixed(2)} className="text-positive" />
                        <DetailItem label="最低價" value={stock.low.toFixed(2)} className="text-negative" />
                        <DetailItem label="成交量(張)" value={Math.floor(stock.volume / 1000).toLocaleString()} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// FIX: Add default export to make the component importable.
export default StockModal;

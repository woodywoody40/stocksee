import React from 'react';
import { Stock } from '../types';

interface StockCardProps {
    stock: Stock;
    isWatched: boolean;
    onToggleWatchlist: (code: string) => void;
    onCardClick: (stock: Stock) => void;
}

const StarIcon: React.FC<React.SVGProps<SVGSVGElement> & { isFilled: boolean }> = ({ isFilled, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
);

const Sparkline: React.FC<{ isPositive: boolean }> = ({ isPositive }) => {
  const color = isPositive ? 'var(--color-positive, #ef4444)' : 'var(--color-negative, #22c55e)';
  const path = isPositive 
    ? "M 0 40 L 10 30 L 20 35 L 30 20 L 40 25 L 50 15 L 60 20 L 70 5 L 80 10"
    : "M 0 10 L 10 20 L 20 15 L 30 30 L 40 25 L 50 35 L 60 30 L 70 45 L 80 40";

  return (
    <svg viewBox="0 0 80 50" className="w-full h-8" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
};


const StockCard: React.FC<StockCardProps> = ({ stock, isWatched, onToggleWatchlist, onCardClick }) => {
    const isPositive = stock.change >= 0;
    const priceColor = isPositive ? 'text-positive' : 'text-negative';
    const borderColor = isPositive ? 'border-positive' : 'border-negative';
    
    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleWatchlist(stock.code);
    };

    return (
        <div 
            className={`relative bg-dark-card border border-dark-border rounded-xl p-4 cursor-pointer transition-all duration-300 ease-in-out overflow-hidden group hover:shadow-2xl hover:border-text-tertiary hover:-translate-y-1 border-l-4 ${borderColor}`}
            onClick={() => onCardClick(stock)}
        >
             <div className={`absolute top-0 right-0 h-full w-2/3 bg-gradient-to-l ${isPositive ? 'from-positive/10' : 'from-negative/10'} to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-text-primary">{stock.name}</h3>
                        <p className="text-sm text-text-secondary">{stock.code}</p>
                    </div>
                    <button 
                        onClick={handleStarClick}
                        className="text-text-tertiary hover:text-brand-gold transition-colors p-1 -mr-1 -mt-1"
                        aria-label={isWatched ? '從關注列表移除' : '加入關注列表'}
                    >
                        <StarIcon isFilled={isWatched} className={`w-6 h-6 ${isWatched ? 'text-brand-gold' : ''}`} />
                    </button>
                </div>
                <div className="mt-4 flex justify-between items-end gap-2">
                    <div className="text-left">
                        <p className={`text-3xl font-bold ${priceColor}`}>{stock.price.toFixed(2)}</p>
                        <div className={`text-sm font-semibold ${priceColor}`}>
                            <span>{isPositive ? '▲' : '▼'}</span>
                            <span> {stock.change.toFixed(2)}</span>
                            <span className="ml-2">({stock.changePercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                    <div className="w-1/3">
                        <Sparkline isPositive={isPositive} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockCard;
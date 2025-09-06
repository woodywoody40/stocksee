// FIX: Import `useCallback` from React.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { HistoricalDataPoint } from '../types';

interface StockChartProps {
    priceData: HistoricalDataPoint[];
}

const StockChart: React.FC<StockChartProps> = ({ priceData }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: HistoricalDataPoint; } | null>(null);
    const svgRef = React.useRef<SVGSVGElement>(null);

    if (!priceData || priceData.length < 2) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-xs text-secondary-dark">歷史資料不足</p>
            </div>
        );
    }
  
    const reversedData = useMemo(() => [...priceData].reverse(), [priceData]);
    const priceColor = reversedData[reversedData.length - 1].close >= reversedData[0].close ? '#ef4444' : '#22c55e';
    const gradientColor = reversedData[reversedData.length - 1].close >= reversedData[0].close ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
    const gradientId = `chart-gradient-${priceColor.replace('#', '')}`;

    const svgWidth = 300;
    const svgHeight = 100;
    const paddingY = 5;
    const chartHeight = svgHeight - paddingY * 2;

    const allValues = useMemo(() => reversedData.map(p => p.close), [reversedData]);
    const maxVal = useMemo(() => Math.max(...allValues), [allValues]);
    const minVal = useMemo(() => Math.min(...allValues), [allValues]);
    const valueRange = maxVal - minVal;

    const scaleY = useCallback((value: number) => {
        if (valueRange === 0) return svgHeight / 2;
        return (svgHeight - paddingY) - ((value - minVal) / valueRange) * chartHeight;
    }, [valueRange, svgHeight, chartHeight, paddingY]);

    const dataLength = reversedData.length;
    const xStep = svgWidth / (dataLength > 1 ? dataLength - 1 : 1);

    const points = useMemo(() => reversedData.map((d, i) => ({
        x: i * xStep,
        y: scaleY(d.close),
        data: d,
    })), [reversedData, xStep, scaleY]);

    const pricePath = useMemo(() => {
        if (points.length === 0) return '';
        return `M ${points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ')}`;
    }, [points]);
    
    const areaPath = useMemo(() => `${pricePath} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`, [pricePath, svgWidth, svgHeight]);

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const svgX = event.clientX - svgRect.left;
        
        const index = Math.round(svgX / xStep);
        if (index >= 0 && index < points.length) {
            const point = points[index];
            setTooltip({
                x: point.x,
                y: point.y,
                data: point.data,
            });
        }
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div className="relative w-full h-full cursor-crosshair">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full"
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradientColor} stopOpacity={0.5}/>
                    <stop offset="100%" stopColor={gradientColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <line
                        key={i}
                        x1="0"
                        y1={i * (svgHeight / 4)}
                        x2={svgWidth}
                        y2={i * (svgHeight / 4)}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="0.5"
                    />
                ))}

                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path d={pricePath} fill="none" stroke={priceColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                
                {tooltip && (
                    <g>
                        <line
                            x1={tooltip.x}
                            y1="0"
                            x2={tooltip.x}
                            y2={svgHeight}
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                        <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={priceColor} stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                    </g>
                )}
            </svg>
            
            {/* Legend */}
            <div className="absolute top-0 right-0 flex items-center text-xs p-1 space-x-2 bg-surface-dark/50 rounded-bl-md">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5" style={{ backgroundColor: priceColor }}></div>
                    <span className="text-secondary-dark font-mono">股價</span>
                </div>
            </div>
            
            {/* Tooltip Text */}
            {tooltip && (
                <div 
                    className="absolute top-0 left-0 bg-black/70 text-white text-xs rounded-md p-2 pointer-events-none transition-transform duration-100 ease-out"
                    style={{ transform: `translateX(${tooltip.x + 10}px)` }}
                >
                    <div>{tooltip.data.date}</div>
                    <div className="font-bold">{tooltip.data.close.toFixed(2)}</div>
                </div>
            )}
        </div>
    );
};

export default StockChart;
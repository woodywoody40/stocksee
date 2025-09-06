

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Stock, HistoricalDataPoint, IndicatorPoint, MACDPoint } from '../types';
import { fetchHistoricalData } from '../services/stockService';
import { calculateMA, calculateMACD, calculateRSI } from '../utils/technicalAnalysis';

interface TechnicalAnalysisViewProps {
    stock: Stock;
    onClose: () => void;
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-12 space-x-2">
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const Checkbox: React.FC<{ checked: boolean; onChange: () => void; label: string; color: string; value: string | null; }> = ({ checked, onChange, label, color, value }) => (
    <label className="flex flex-col md:flex-row items-center md:space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0">
        <div className="relative flex items-center">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
            <div className={`w-5 h-5 rounded-md border-2 transition-all ${checked ? `bg-brand-orange border-brand-orange` : 'border-gray-500'}`}>
                {checked && <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
            </div>
        </div>
        <div className="flex items-center gap-2 mt-1 md:mt-0">
            <span className="font-semibold text-sm" style={{ color }}>{label}</span>
            {value && <span className="text-xs font-mono text-gray-400">{value}</span>}
        </div>
    </label>
);

const RadioButton: React.FC<{ active: boolean; onClick: () => void; label: string; }> = ({ active, onClick, label }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex-shrink-0 ${active ? 'bg-brand-orange text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}>
        {label}
    </button>
);

const INDICATOR_COLORS = {
    ma5: '#f97316',   // Orange
    ma10: '#38bdf8',  // Sky Blue
    ma20: '#a78bfa',  // Violet
    macd: '#f43f5e',   // Rose
    signal: '#34d399',// Emerald
    rsi: '#fbbf24',    // Amber
};

const TechnicalAnalysisView: React.FC<TechnicalAnalysisViewProps> = ({ stock, onClose }) => {
    const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showMA5, setShowMA5] = useState(true);
    const [showMA10, setShowMA10] = useState(false);
    const [showMA20, setShowMA20] = useState(false);
    const [activeOscillator, setActiveOscillator] = useState<'macd' | 'rsi' | 'none'>('macd');

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartDimensions, setChartDimensions] = useState({ width: 0, mainHeight: 0, subHeight: 0 });
    const [tooltip, setTooltip] = useState<{ x: number, index: number } | null>(null);
    
    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await fetchHistoricalData(stock.code);
                setHistoricalData(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [stock.code]);

    useEffect(() => {
        const updateDimensions = () => {
            if (chartContainerRef.current) {
                const { width, height } = chartContainerRef.current.getBoundingClientRect();
                setChartDimensions({ width, mainHeight: height * (activeOscillator !== 'none' ? 0.7 : 1), subHeight: height * 0.3 });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [activeOscillator]);
    
    const ma5 = useMemo(() => showMA5 ? calculateMA(historicalData, 5) : [], [historicalData, showMA5]);
    const ma10 = useMemo(() => showMA10 ? calculateMA(historicalData, 10) : [], [historicalData, showMA10]);
    const ma20 = useMemo(() => showMA20 ? calculateMA(historicalData, 20) : [], [historicalData, showMA20]);
    const macd = useMemo(() => activeOscillator === 'macd' ? calculateMACD(historicalData) : [], [historicalData, activeOscillator]);
    const rsi = useMemo(() => activeOscillator === 'rsi' ? calculateRSI(historicalData) : [], [historicalData, activeOscillator]);

    const allMainValues = useMemo(() => {
        const values: number[] = [];
        historicalData.forEach(d => { values.push(d.high, d.low); });
        [ma5, ma10, ma20].forEach(ma => ma.forEach(p => p.value !== null && values.push(p.value)));
        return values;
    }, [historicalData, ma5, ma10, ma20]);
    
    const maxMainVal = Math.max(...allMainValues);
    const minMainVal = Math.min(...allMainValues);

    const allVolumeValues = useMemo(() => historicalData.map(d => d.volume), [historicalData]);
    const maxVolume = Math.max(...allVolumeValues);
    
    const xStep = chartDimensions.width / (historicalData.length > 1 ? historicalData.length - 1 : 1);
    const candleWidth = Math.max(1, xStep * 0.7);

    const scaleYMain = useCallback((val: number) => {
        const range = maxMainVal - minMainVal;
        if(range === 0) return chartDimensions.mainHeight / 2;
        return (1 - (val - minMainVal) / range) * chartDimensions.mainHeight;
    }, [maxMainVal, minMainVal, chartDimensions.mainHeight]);
    
    const scaleYVolume = useCallback((val: number) => {
       return (1 - val / maxVolume) * (chartDimensions.mainHeight * 0.25) + (chartDimensions.mainHeight * 0.75);
    }, [maxVolume, chartDimensions.mainHeight]);
    
     const updateTooltip = useCallback((clientX: number) => {
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const index = Math.min(historicalData.length - 1, Math.max(0, Math.round(x / xStep)));
        setTooltip({ x: index * xStep, index });
    }, [historicalData.length, xStep]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        updateTooltip(e.clientX);
    }, [updateTooltip]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        updateTooltip(e.touches[0].clientX);
    }, [updateTooltip]);

    const handleMouseOrTouchLeave = useCallback(() => {
        setTooltip(null);
    }, []);


    if (isLoading) return <div className="fixed inset-0 bg-background-dark flex items-center justify-center"><LoadingSpinner /></div>;
    if (error) return <div className="fixed inset-0 bg-background-dark flex items-center justify-center text-red-500"><p>Error: {error}</p></div>;

    const tooltipData = tooltip ? historicalData[tooltip.index] : null;
    const formatNumber = (num?: number | null) => num?.toFixed(2) ?? 'N/A';

    return (
        <div className="fixed inset-0 bg-background-dark text-on-background-dark flex flex-col font-sans dark">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-outline-dark">
                <div>
                    <h1 className="text-xl font-bold">{stock.name} <span className="text-secondary-dark font-mono">{stock.code}</span></h1>
                    {tooltipData && <p className="text-sm text-secondary-dark font-mono">{tooltipData.date}</p>}
                </div>
                <div className="flex items-center gap-4">
                    {tooltipData && (
                         <div className="text-xs text-right font-mono hidden sm:block">
                            <span className="text-gray-400">O:</span><span className="text-white">{formatNumber(tooltipData.open)}</span>
                            <span className="text-gray-400 ml-2">H:</span><span className="text-positive">{formatNumber(tooltipData.high)}</span>
                            <span className="text-gray-400 ml-2">L:</span><span className="text-negative">{formatNumber(tooltipData.low)}</span>
                            <span className="text-gray-400 ml-2">C:</span><span className="text-white">{formatNumber(tooltipData.close)}</span>
                        </div>
                    )}
                    <button onClick={onClose} className="text-secondary-dark hover:text-white transition-colors p-2 rounded-full bg-white/5 hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
                {/* Chart Area */}
                <div 
                    className="flex-grow flex flex-col" 
                    ref={chartContainerRef}
                    onMouseMove={handleMouseMove} 
                    onMouseLeave={handleMouseOrTouchLeave}
                    onTouchStart={handleTouchMove}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseOrTouchLeave}
                >
                   {chartDimensions.width > 0 && (
                     <>
                        {/* Main Chart (Price, MA, Volume) */}
                        <svg width={chartDimensions.width} height={chartDimensions.mainHeight}>
                            {/* Grid Lines */}
                            {Array.from({ length: 5 }).map((_, i) => <line key={i} x1={0} y1={i * chartDimensions.mainHeight / 4} x2={chartDimensions.width} y2={i * chartDimensions.mainHeight / 4} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />)}
                            
                            {/* Volume Bars */}
                            {historicalData.map((d, i) => <rect key={i} x={i * xStep - candleWidth / 2} y={scaleYVolume(d.volume)} width={candleWidth} height={chartDimensions.mainHeight - scaleYVolume(d.volume)} fill={d.close >= d.open ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'} />)}
                            
                            {/* Candlesticks */}
                            {historicalData.map((d, i) => {
                                const isPositive = d.close >= d.open;
                                const color = isPositive ? '#ef4444' : '#22c55e';
                                return (
                                    <g key={i}>
                                        <line x1={i * xStep} y1={scaleYMain(d.high)} x2={i * xStep} y2={scaleYMain(d.low)} stroke={color} strokeWidth={1.5} />
                                        <rect x={i * xStep - candleWidth / 2} y={scaleYMain(Math.max(d.open, d.close))} width={candleWidth} height={Math.abs(scaleYMain(d.open) - scaleYMain(d.close))} fill={color} />
                                    </g>
                                );
                            })}
                            
                            {/* MA Lines */}
                            {[ { data: ma5, color: INDICATOR_COLORS.ma5 }, { data: ma10, color: INDICATOR_COLORS.ma10 }, { data: ma20, color: INDICATOR_COLORS.ma20 }].map(({ data, color }) => (
                                <path key={color} d={`M ${data.map((p, i) => p.value !== null ? `${i * xStep},${scaleYMain(p.value)}` : '').filter(Boolean).join(' L ')}`} fill="none" stroke={color} strokeWidth={2} />
                            ))}

                            {/* Tooltip Crosshair */}
                            {tooltip && <line x1={tooltip.x} y1={0} x2={tooltip.x} y2={chartDimensions.mainHeight} stroke="rgba(255,255,255,0.4)" strokeDasharray="3,3" />}
                        </svg>

                        {/* Sub Chart (Oscillators) */}
                        {activeOscillator !== 'none' && (
                             <svg width={chartDimensions.width} height={chartDimensions.subHeight} className="mt-2">
                                {/* Grid Lines */}
                                {Array.from({ length: 3 }).map((_, i) => <line key={i} x1={0} y1={i * chartDimensions.subHeight / 2} x2={chartDimensions.width} y2={i * chartDimensions.subHeight / 2} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />)}

                                {activeOscillator === 'macd' && macd.length > 0 && (
                                    <g>
                                        {/* MACD Histogram */}
                                        {macd.map((p, i) => {
                                             if (p.histogram === undefined) return null;
                                             const yZero = chartDimensions.subHeight / 2;
                                             const maxHist = Math.max(...macd.map(d => Math.abs(d.histogram ?? 0)).filter(v => !isNaN(v)));
                                             const barHeight = maxHist > 0 ? (p.histogram / maxHist) * yZero * 0.8 : 0;
                                             return <rect key={i} x={i * xStep - candleWidth/2} y={yZero - Math.max(0, barHeight)} width={candleWidth} height={Math.abs(barHeight)} fill={p.histogram >= 0 ? 'rgba(244, 63, 94, 0.5)' : 'rgba(52, 211, 153, 0.5)'}/>
                                        })}
                                        {/* MACD and Signal Lines */}
                                        {[{dataKey: 'macd', color: INDICATOR_COLORS.macd}, {dataKey: 'signal', color: INDICATOR_COLORS.signal}].map(({dataKey, color}) => {
                                            const allVals = macd.flatMap(p => [p.macd, p.signal]).filter(v => v !== undefined) as number[];
                                            const max = Math.max(...allVals);
                                            const min = Math.min(...allVals);
                                            const range = max - min;
                                            const scale = (val: number) => range > 0 ? (1 - (val - min) / range) * chartDimensions.subHeight : chartDimensions.subHeight / 2;
                                            // FIX: Removed incorrect type cast `as keyof MACDPoint` which caused a type error.
                                            return <path key={dataKey} d={`M ${macd.map((p,i) => p[dataKey] !== undefined ? `${i * xStep},${scale(p[dataKey]!)}` : '').filter(Boolean).join(' L ')}`} stroke={color} strokeWidth={2} fill="none" />
                                        })}
                                    </g>
                                )}
                                {activeOscillator === 'rsi' && rsi.length > 0 && (
                                     <g>
                                         <line x1={0} y1={chartDimensions.subHeight * 0.3} x2={chartDimensions.width} y2={chartDimensions.subHeight * 0.3} stroke="rgba(255,255,255,0.3)" strokeDasharray="2,2" />
                                         <text x={5} y={chartDimensions.subHeight * 0.3 - 5} fill="rgba(255,255,255,0.5)" fontSize="10">70</text>
                                         <line x1={0} y1={chartDimensions.subHeight * 0.7} x2={chartDimensions.width} y2={chartDimensions.subHeight * 0.7} stroke="rgba(255,255,255,0.3)" strokeDasharray="2,2" />
                                          <text x={5} y={chartDimensions.subHeight * 0.7 + 15} fill="rgba(255,255,255,0.5)" fontSize="10">30</text>
                                        <path d={`M ${rsi.map((p, i) => p.value !== null ? `${i * xStep},${(1 - p.value/100) * chartDimensions.subHeight}` : '').filter(Boolean).join(' L ')}`} fill="none" stroke={INDICATOR_COLORS.rsi} strokeWidth={2} />
                                    </g>
                                )}
                                {/* Tooltip Crosshair */}
                                {tooltip && <line x1={tooltip.x} y1={0} x2={tooltip.x} y2={chartDimensions.subHeight} stroke="rgba(255,255,255,0.4)" strokeDasharray="3,3" />}
                             </svg>
                        )}
                     </>
                   )}
                </div>

                {/* Control Panel */}
                <aside className="w-full md:w-64 flex-shrink-0 bg-surface-dark md:p-4 rounded-lg flex md:flex-col overflow-hidden">
                    <div className="flex flex-row md:flex-col gap-4 md:gap-6 p-2 md:p-0 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto">
                        <div className="flex-shrink-0">
                            <h3 className="font-bold mb-3 text-lg px-2 md:px-0">Moving Averages</h3>
                            <div className="flex flex-row md:flex-col gap-2">
                                <Checkbox checked={showMA5} onChange={() => setShowMA5(p => !p)} label="MA5" color={INDICATOR_COLORS.ma5} value={tooltip && ma5[tooltip.index] ? formatNumber(ma5[tooltip.index].value) : null} />
                                <Checkbox checked={showMA10} onChange={() => setShowMA10(p => !p)} label="MA10" color={INDICATOR_COLORS.ma10} value={tooltip && ma10[tooltip.index] ? formatNumber(ma10[tooltip.index].value) : null} />
                                <Checkbox checked={showMA20} onChange={() => setShowMA20(p => !p)} label="MA20" color={INDICATOR_COLORS.ma20} value={tooltip && ma20[tooltip.index] ? formatNumber(ma20[tooltip.index].value) : null} />
                            </div>
                        </div>
                         <div className="flex-shrink-0">
                            <h3 className="font-bold mb-3 text-lg px-2 md:px-0">Oscillators</h3>
                            <div className="flex items-center space-x-2 px-2 md:px-0">
                               <RadioButton active={activeOscillator === 'macd'} onClick={() => setActiveOscillator('macd')} label="MACD" />
                               <RadioButton active={activeOscillator === 'rsi'} onClick={() => setActiveOscillator('rsi')} label="RSI" />
                               <RadioButton active={activeOscillator === 'none'} onClick={() => setActiveOscillator('none')} label="None" />
                            </div>
                             {tooltip && activeOscillator === 'macd' && macd[tooltip.index] && (
                                <div className="mt-3 text-xs font-mono space-y-1 px-2 md:px-0">
                                    <p><span style={{color: INDICATOR_COLORS.macd}}>MACD:</span> {formatNumber(macd[tooltip.index].macd)}</p>
                                    <p><span style={{color: INDICATOR_COLORS.signal}}>Signal:</span> {formatNumber(macd[tooltip.index].signal)}</p>
                                    <p><span>Hist:</span> {formatNumber(macd[tooltip.index].histogram)}</p>
                                </div>
                            )}
                            {tooltip && activeOscillator === 'rsi' && rsi[tooltip.index] && (
                                 <div className="mt-3 text-xs font-mono px-2 md:px-0">
                                    <p><span style={{color: INDICATOR_COLORS.rsi}}>RSI:</span> {formatNumber(rsi[tooltip.index].value)}</p>
                                 </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TechnicalAnalysisView;
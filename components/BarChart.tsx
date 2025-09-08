import React from 'react';

interface BarChartProps {
    title: string;
    unit: string;
    data: { label: string; value: number }[];
}

const BarChart: React.FC<BarChartProps> = ({ title, unit, data }) => {
    if (!data || data.length === 0) {
        return null;
    }

    const values = data.map(d => d.value);
    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(0, ...values);
    const totalRange = maxVal - minVal;

    // The position of the zero-axis, as a percentage from the bottom of the container.
    const zeroPosition = totalRange > 0 ? (Math.abs(minVal) / totalRange) * 100 : 0;

    return (
        <div className="bg-white/5 rounded-xl p-3 flex flex-col h-48">
            {/* Header */}
            <div className="flex justify-between items-baseline mb-2">
                <h5 className="text-sm font-semibold text-on-surface-dark">{title}</h5>
                <span className="text-xs text-secondary-dark">{unit}</span>
            </div>

            {/* Chart Area */}
            <div className="relative flex-grow flex justify-around items-end space-x-2">
                {/* Zero Line */}
                {minVal < 0 && maxVal > 0 && (
                    <div className="absolute w-full h-px bg-white/20" style={{ bottom: `${zeroPosition}%`, left: 0 }} />
                )}

                {/* Bars */}
                {data.map((d, i) => {
                    const isNegative = d.value < 0;
                    const barHeightPercent = totalRange > 0 ? (Math.abs(d.value) / totalRange) * 100 : 0;

                    const style: React.CSSProperties = {
                        height: `${barHeightPercent}%`,
                        bottom: isNegative ? `${zeroPosition - barHeightPercent}%` : `${zeroPosition}%`,
                        animationDelay: `${i * 50}ms`,
                        animationFillMode: 'backwards'
                    };
                    
                    return (
                        <div key={i} className="flex-1 relative group h-full"> 
                            <div
                                className={`absolute w-10/12 left-1/12 transition-all duration-300 group-hover:opacity-80 animate-slide-up-fade ${
                                    isNegative 
                                    ? 'bg-negative/80 rounded-b-sm'
                                    : 'bg-brand-orange/80 rounded-t-sm'
                                }`}
                                style={style}
                            >
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {d.value.toLocaleString()}{unit}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Labels */}
            <div className="flex-shrink-0 flex justify-around pt-1.5 mt-1 border-t border-white/10">
                {data.map((d, i) => (
                    <div key={i} className="flex-1">
                        <span className="text-xs text-secondary-dark text-center block">{d.label.substring(d.label.indexOf('Q'))}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;

import React from 'react';

interface BarChartProps {
    title: string;
    unit: string;
    data: { label: string; value: number }[];
}

const BarChart: React.FC<BarChartProps> = ({ title, unit, data }) => {
    const values = data.map(d => d.value);
    const maxVal = Math.max(...values, 0);
    // Ensure we have a non-zero max for scaling, and add a little headroom
    const scaleMax = maxVal === 0 ? 1 : maxVal * 1.2;

    return (
        <div className="bg-white/5 rounded-xl p-3">
            <div className="flex justify-between items-baseline mb-3">
                <h5 className="text-sm font-semibold text-on-surface-dark">{title}</h5>
                <span className="text-xs text-secondary-dark">{unit}</span>
            </div>
            <div className="flex justify-around items-end h-32 space-x-2">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                         <div 
                             className="relative w-full bg-brand-orange/40 rounded-t-sm transition-all duration-300 hover:bg-brand-orange/80 animate-slide-up-fade"
                             style={{ 
                                height: `${(Math.max(0, d.value) / scaleMax) * 100}%`,
                                animationDelay: `${i * 50}ms`,
                                animationFillMode: 'backwards'
                             }}
                         >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {d.value.toLocaleString()}{unit}
                            </div>
                         </div>
                         <span className="text-xs text-secondary-dark mt-1.5">{d.label.replace(/Q\d/, '')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;
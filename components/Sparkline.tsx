import React from 'react';

interface SparklineProps {
    data?: number[];
    trend: 'positive' | 'negative' | 'neutral';
}

const Sparkline: React.FC<SparklineProps> = ({ data, trend }) => {
  // Ensure we have at least two points to draw a line
  if (!data || data.length < 2) {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <p className="text-xs text-tertiary-dark">N/A</p>
        </div>
    );
  }

  const color = trend === 'positive' 
      ? 'rgb(var(--color-positive))'
      : trend === 'negative'
      ? 'rgb(var(--color-negative))'
      : 'rgb(161 161 170)'; // Neutral (secondary-dark)
  
  const gradientId = `spark-gradient-${trend}`;
  const gradientColor = color; // Use the same base color for the gradient

  // SVG dimensions
  const svgWidth = 100;
  const svgHeight = 40;
  const paddingY = 5;
  const chartHeight = svgHeight - paddingY * 2;

  // Data normalization
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const valueRange = maxVal - minVal;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * svgWidth;
    // Handle flat line case to avoid division by zero
    const y = valueRange === 0 
      ? svgHeight / 2 
      : (svgHeight - paddingY) - ((d - minVal) / valueRange) * chartHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  const path = `M ${points}`;
  const areaPath = `${path} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: gradientColor, stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: gradientColor, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export default Sparkline;

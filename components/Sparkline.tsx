import React from 'react';

interface SparklineProps {
    isPositive: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({ isPositive }) => {
  const color = isPositive ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)'; // Red 500, Green 500
  const path = isPositive 
    ? "M 0 40 L 10 30 L 20 35 L 30 20 L 40 25 L 50 15 L 60 20 L 70 5 L 80 10"
    : "M 0 10 L 10 20 L 20 15 L 30 30 L 40 25 L 50 35 L 60 30 L 70 45 L 80 40";
  
  const gradientId = isPositive ? 'positive-spark-gradient' : 'negative-spark-gradient';
  const gradientColor = isPositive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)';

  return (
    <svg viewBox="0 0 80 50" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: gradientColor, stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: gradientColor, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={`${path} L 80 50 L 0 50 Z`} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
    </svg>
  );
};

export default Sparkline;

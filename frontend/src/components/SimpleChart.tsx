import React from 'react';
import { ChartDataPoint } from '../utils/stats';

interface SimpleChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
}

const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  height = 200,
  className = ''
}) => {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-body text-content-secondary">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));

  const chartWidth = 400;
  const chartHeight = height - 40; // Leave space for labels
  const bottomPadding = 20;
  const leftPadding = 30;
  const rightPadding = 10;
  const topPadding = 10;

  const usableWidth = chartWidth - leftPadding - rightPadding;
  const usableHeight = chartHeight - topPadding - bottomPadding;

  const barWidth = (usableWidth / data.length) * 0.8;
  const gap = (usableWidth / data.length) * 0.2;

  const bars = data.map((point, index) => {
    const x = leftPadding + index * (barWidth + gap) + gap / 2;
    const barHeight = ((point.value - (minValue < 0 ? minValue : 0)) / (maxValue === 0 ? 1 : maxValue)) * usableHeight;
    const y = chartHeight - bottomPadding - barHeight;
    return { x, y, width: barWidth, height: barHeight, ...point };
  });

  // Generate grid lines
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = topPadding + (i / 4) * usableHeight;
    const value = maxValue - (i / 4) * maxValue;
    gridLines.push(
      <g key={`grid-${i}`}>
        <line
          x1={leftPadding}
          y1={y}
          x2={chartWidth - rightPadding}
          y2={y}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.1"
        />
        <text
          x={leftPadding - 8}
          y={y + 4}
          textAnchor="end"
          className="text-[10px] fill-content-tertiary font-medium"
        >
          {Math.round(value)}
        </text>
      </g>
    );
  }

  const getQualityColor = (quality?: number) => {
    if (quality === undefined || quality === 0) return 'rgb(229 231 235)'; // gray-200
    if (quality < 2) return '#ef4444'; // red-500
    if (quality < 4) return '#f97316'; // orange-500
    if (quality < 6) return '#eab308'; // yellow-500
    if (quality < 8) return '#22c55e'; // green-500
    return '#06b6d4'; // cyan-500 (Epic)
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines and Y-axis labels */}
          {gridLines}

          {/* X-axis base line */}
          <line
            x1={leftPadding}
            y1={chartHeight - bottomPadding}
            x2={chartWidth - rightPadding}
            y2={chartHeight - bottomPadding}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.2"
          />

          {/* Bars */}
          {bars.map((bar, index) => (
            <rect
              key={`bar-${index}`}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={getQualityColor(bar.avgWaveQuality)}
              rx="2"
            >
              <title>{`${bar.label}: ${bar.value} min (Quality: ${bar.avgWaveQuality?.toFixed(1) || 0})`}</title>
            </rect>
          ))}

          {/* X-axis labels */}
          {bars.filter((_, index) => {
            if (bars.length <= 10) return true;
            return index % Math.ceil(bars.length / 8) === 0;
          }).map((bar, index) => (
            <text
              key={`x-label-${index}`}
              x={bar.x + bar.width / 2}
              y={chartHeight - bottomPadding + 15}
              textAnchor="middle"
              className="text-[10px] fill-content-tertiary font-medium"
            >
              {bar.label}
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-[10px] font-medium text-content-secondary">Poor (0-2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f97316' }}></div>
            <span className="text-[10px] font-medium text-content-secondary">Fair (2-4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-[10px] font-medium text-content-secondary">Average (4-6)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-[10px] font-medium text-content-secondary">Good (6-8)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#06b6d4' }}></div>
            <span className="text-[10px] font-medium text-content-secondary">Epic (8-10)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SimpleChart };
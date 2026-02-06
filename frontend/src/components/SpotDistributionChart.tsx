import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartDataPoint } from '../utils/stats';
import { motion, AnimatePresence } from 'framer-motion';

interface SpotDistributionChartProps {
  data: PieChartDataPoint[];
  height?: number;
  className?: string;
}

const SpotDistributionChart: React.FC<SpotDistributionChartProps> = ({
  data,
  height = 300,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-body text-content-secondary">No data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, point) => sum + point.value, 0);
  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  const chartSize = height * 0.8;
  
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 ${className}`} style={{ minHeight: `${height}px` }}>
      {/* Chart Section */}
      <div className="relative flex-shrink-0" style={{ width: `${chartSize}px`, height: `${chartSize}px` }}>
        <ResponsiveContainer width={chartSize} height={chartSize}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="95%"
              paddingAngle={4}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
              animationBegin={0}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  style={{ 
                    outline: 'none',
                    cursor: 'pointer',
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
                    transition: 'opacity 0.3s ease-in-out'
                  }} 
                />
              ))}
            </Pie>
            <Tooltip content={<div className="hidden" />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Info Panel */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none overflow-hidden">
          <AnimatePresence mode="wait">
            {activeItem ? (
              <motion.div 
                key={activeItem.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="px-4"
              >
                <p className="text-sm font-bold text-content-primary line-clamp-2 leading-tight mb-1">
                  {activeItem.name}
                </p>
                <p className="text-xs font-medium text-content-secondary">
                  {activeItem.value} {activeItem.value === 1 ? 'session' : 'sessions'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-2xl font-bold text-content-primary leading-none mb-1">{total}</p>
                <p className="text-[10px] uppercase tracking-wider text-content-tertiary font-bold">Total</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom Legend Section */}
      <div className="flex flex-col gap-2.5 min-w-[140px] max-h-full overflow-y-auto py-2 pr-4 custom-scrollbar">
        {data.map((point, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{ x: activeIndex === index ? 4 : 0 }}
            className={`flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
              activeIndex === index ? 'bg-background-secondary' : 'bg-transparent'
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: point.color }}
            />
            <span className="text-xs font-medium text-content-secondary truncate max-w-[120px]">
              {point.name}
            </span>
            <span className="text-xs font-bold text-content-primary ml-auto pl-2">
              {Math.round((point.value / total) * 100)}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export { SpotDistributionChart };

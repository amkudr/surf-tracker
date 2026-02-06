import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChartDataPoint } from '../utils/stats';

interface SimpleChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
  showLabels?: boolean;
  timeRange?: 'week' | 'month' | '3month' | 'all';
}

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const QUALITY_LEVELS = [
  { label: 'Poor', min: 0, max: 2, color: '#ef4444', text: '0-2' },
  { label: 'Fair', min: 2, max: 4, color: '#f97316', text: '2-4' },
  { label: 'Average', min: 4, max: 6, color: '#eab308', text: '4-6' },
  { label: 'Good', min: 6, max: 8, color: '#22c55e', text: '6-8' },
  { label: 'Epic', min: 8, max: 10, color: '#06b6d4', text: '8-10' },
];

const CustomTooltip = React.memo(({ active, payload, timeRange }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const sessions = dataPoint.sessions || [];
    const quality = dataPoint.avgWaveQuality;
    const level = quality !== undefined && quality !== 0 
      ? (QUALITY_LEVELS.find((l) => quality < l.max) || QUALITY_LEVELS[QUALITY_LEVELS.length - 1])
      : null;

    const formatTime = (datetime: string) => {
      return new Date(datetime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    };

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}.${month}`;
    };

    const getDayName = (date: Date) => {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getTitle = () => {
      if (timeRange === '3month') {
        const weekEnd = addDays(dataPoint.date, 6);
        return `${formatDate(dataPoint.date)} - ${formatDate(weekEnd)}`;
      } else if (timeRange === 'all') {
        return dataPoint.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      return `${getDayName(dataPoint.date)} ${formatDate(dataPoint.date)}`;
    };

    const getQualityLevel = (q: number) => {
      return QUALITY_LEVELS.find((l) => q < l.max) || QUALITY_LEVELS[QUALITY_LEVELS.length - 1];
    };

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[220px]">
        <p className="text-sm font-bold text-content-primary mb-3 pb-2 border-b border-border">
          {getTitle()}
        </p>
        
        {sessions.length === 0 ? (
          <div className="text-xs text-content-tertiary">No sessions</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: any, index: number) => {
              const sessionLevel = getQualityLevel(session.wave_quality);
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-content-primary">{session.spot.name}</span>
                    <span className="text-xs text-content-tertiary whitespace-nowrap">{formatTime(session.datetime)}</span>
                  </div>
                  <div className="text-xs text-content-secondary">
                    Duration: {session.duration_minutes} min
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sessionLevel.color }}></div>
                    <span className="font-semibold text-content-primary">{session.wave_quality.toFixed(1)}</span>
                    <span className="text-content-tertiary">({sessionLevel.label})</span>
                  </div>
                </div>
              );
            })}
            
            {sessions.length > 1 && (
              <div className="pt-2 mt-2 border-t border-border flex justify-between text-xs text-content-secondary">
                <span>Total: {payload[0].value} min</span>
                <span>Avg: {quality?.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
});

const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  height = 200,
  className = '',
  showLabels = false,
  timeRange = 'week'
}) => {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-body text-content-secondary">No data available</p>
      </div>
    );
  }

  const getQualityColor = (quality?: number) => {
    if (quality === undefined || quality === 0) return '#e5e5ea'; // border secondary
    const level = QUALITY_LEVELS.find(l => quality < l.max) || QUALITY_LEVELS[QUALITY_LEVELS.length - 1];
    return level.color;
  };

  const getDateLabel = (label: string, date: Date, range: string) => {
    if (!showLabels) return '';
    
    if (range === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (range === 'month') {
      return date.getDate().toString();
    } else if (range === '3month') {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    } else if (range === 'all') {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    return '';
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const chartDataWithLabels = data.map(point => {
    const pointDateStr = `${point.date.getFullYear()}-${String(point.date.getMonth() + 1).padStart(2, '0')}-${String(point.date.getDate()).padStart(2, '0')}`;
    return {
      ...point,
      displayLabel: getDateLabel(point.label, point.date, timeRange) || point.label,
      isToday: pointDateStr === todayStr
    };
  });

  const tooltipContent = useMemo(() => <CustomTooltip timeRange={timeRange} />, [timeRange]);

  // Keep ticks readable: show all for week, throttle others to ~12
  const tickStep = timeRange === 'week' ? 1 : Math.max(1, Math.ceil(chartDataWithLabels.length / 12));
  const allDayTicks = chartDataWithLabels
    .map((p, i) => (i % tickStep === 0 || i === chartDataWithLabels.length - 1 ? p.displayLabel : null))
    .filter(Boolean);

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload, index } = props;
    const isToday = chartDataWithLabels[index]?.isToday || false;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={14}
          textAnchor="middle"
          fill={isToday ? '#0071e3' : '#8e8e93'}
          fontSize={10}
          fontWeight={500}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <div style={{ width: '100%', height: `${height}px`, minHeight: `${height}px` }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartDataWithLabels}
            margin={{ top: 10, right: 12, left: 0, bottom: showLabels ? 20 : 5 }}
            barGap={1}
          >
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e5e5ea" opacity={0.25} />
            <XAxis
              dataKey="displayLabel"
              axisLine={false}
              tickLine={false}
              tick={showLabels ? <CustomXAxisTick /> : false}
              ticks={showLabels ? allDayTicks : undefined}
              interval={0}
              minTickGap={0}
              tickMargin={10}
              type="category"
              allowDuplicatedCategory={false}
              height={showLabels ? 26 : 0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={50}
              tick={{ fontSize: 12, fill: '#8e8e93', fontWeight: 400 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              content={tooltipContent} 
              cursor={{ fill: 'currentColor', opacity: 0.05 }}
              isAnimationActive={false}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {chartDataWithLabels.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getQualityColor(entry.avgWaveQuality)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export { SimpleChart };

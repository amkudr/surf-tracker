import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { SimpleChart } from './SimpleChart';
import { ChartDataPoint } from '../utils/stats';

vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
    CartesianGrid: () => <div data-testid="grid" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Cell: () => <div data-testid="cell" />,
  };
});

describe('SimpleChart', () => {
  it('shows empty state when no data', () => {
    render(<SimpleChart data={[]} />);
    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  it('renders a bar when data is provided', () => {
    const data: ChartDataPoint[] = [
      {
        label: 'Jan 1',
        value: 30,
        date: new Date('2026-01-01T00:00:00Z'),
        avgWaveQuality: 6,
      },
    ];

    const { container } = render(
      <div style={{ width: 800, height: 300 }}>
        <SimpleChart data={data} height={200} showLabels timeRange="week" />
      </div>
    );

    expect(screen.queryByText(/No data available/i)).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="bar-chart"]')).toBeTruthy();
  });
});

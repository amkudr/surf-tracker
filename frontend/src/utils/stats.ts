import { SurfSessionResponse } from '../types/api';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, subDays, isWithinInterval, format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';

export type TimeRange = 'week' | 'month' | 'all';

export interface SessionStats {
  sessionsCount: number;
  totalSurfTime: number;
  avgWaveQuality: number;
  mostPopularSpot: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  date: Date;
  avgWaveQuality?: number;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

/**
 * Calculate statistics for a given set of sessions
 */
export function calculateStats(sessions: SurfSessionResponse[]): SessionStats {
  if (sessions.length === 0) {
    return {
      sessionsCount: 0,
      totalSurfTime: 0,
      avgWaveQuality: 0,
      mostPopularSpot: '—',
    };
  }

  const sessionsCount = sessions.length;
  const totalSurfTime = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
  const avgWaveQuality = sessions.reduce((sum, session) => sum + session.wave_quality, 0) / sessions.length;

  // Calculate most popular spot
  const spotCounts: Record<string, number> = {};
  sessions.forEach(session => {
    const spotName = session.spot.name;
    spotCounts[spotName] = (spotCounts[spotName] || 0) + 1;
  });

  let mostPopularSpot = '—';
  let maxCount = 0;

  Object.entries(spotCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostPopularSpot = name;
    }
  });

  return {
    sessionsCount,
    totalSurfTime,
    avgWaveQuality,
    mostPopularSpot,
  };
}

/**
 * Filter sessions from the last 30 days (rolling window)
 */
export function getLastMonthSessions(sessions: SurfSessionResponse[]): SurfSessionResponse[] {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  return sessions.filter(session => {
    const sessionDate = parseISO(session.datetime);
    return sessionDate >= thirtyDaysAgo && sessionDate <= now;
  });
}

/**
 * Get sessions for the selected time range
 */
export function getSessionsForTimeRange(sessions: SurfSessionResponse[], timeRange: TimeRange): SurfSessionResponse[] {
  switch (timeRange) {
    case 'week':
      return getLastWeekSessions(sessions);
    case 'month':
      return getLastMonthSessions(sessions);
    default:
      return sessions;
  }
}

/**
 * Filter sessions from the last 7 days (rolling window)
 */
export function getLastWeekSessions(sessions: SurfSessionResponse[]): SurfSessionResponse[] {
  const now = new Date();
  const sevenDaysAgo = subWeeks(now, 1);

  return sessions.filter(session => {
    const sessionDate = parseISO(session.datetime);
    return sessionDate >= sevenDaysAgo && sessionDate <= now;
  });
}

/**
 * Group sessions by day for the last N days
 */
export function groupSessionsByDay(sessions: SurfSessionResponse[], days: number): ChartDataPoint[] {
  const now = new Date();
  const startDate = startOfDay(subDays(now, days - 1));
  const endDate = startOfDay(now);

  const daysArray = eachDayOfInterval({ start: startDate, end: endDate });
  const dataPoints: ChartDataPoint[] = [];

  daysArray.forEach(day => {
    const dayStart = startOfDay(day);
    const dayEnd = startOfDay(subDays(day, -1)); // End of the day

    const daySessions = sessions.filter(session => {
      const sessionDate = parseISO(session.datetime);
      return isWithinInterval(sessionDate, { start: dayStart, end: dayEnd });
    });

    const dayStats = calculateStats(daySessions);

    dataPoints.push({
      label: format(day, 'MMM d'),
      value: dayStats.totalSurfTime, // Default to total surf time
      date: day,
      avgWaveQuality: dayStats.avgWaveQuality,
    });
  });

  return dataPoints;
}

/**
 * Group sessions by week for the last 12 weeks
 */
export function groupSessionsByWeek(sessions: SurfSessionResponse[]): ChartDataPoint[] {
  const now = new Date();
  const dataPoints: ChartDataPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i));
    const weekEnd = endOfWeek(subWeeks(now, i));

    const weekSessions = sessions.filter(session => {
      const sessionDate = parseISO(session.datetime);
      return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
    });

    const weekStats = calculateStats(weekSessions);

    dataPoints.push({
      label: format(weekStart, 'MMM d'),
      value: weekStats.sessionsCount, // Default to session count
      date: weekStart,
    });
  }

  return dataPoints;
}

/**
 * Get chart data for the selected time range
 */
export function getChartDataForTimeRange(sessions: SurfSessionResponse[], timeRange: TimeRange): ChartDataPoint[] {
  switch (timeRange) {
    case 'week':
      const weekSessions = getSessionsForTimeRange(sessions, timeRange);
      return groupSessionsByDay(weekSessions, 7);
    case 'month':
      const monthSessions = getSessionsForTimeRange(sessions, timeRange);
      return groupSessionsByDay(monthSessions, 30);
    case 'all':
      // Show last 12 months aggregated by month
      return groupSessionsByMonth(sessions);
    default:
      return [];
  }
}

/**
 * Group sessions by month for the last 12 months
 */
export function groupSessionsByMonth(sessions: SurfSessionResponse[]): ChartDataPoint[] {
  const now = new Date();
  const dataPoints: ChartDataPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));

    const monthSessions = sessions.filter(session => {
      const sessionDate = parseISO(session.datetime);
      return isWithinInterval(sessionDate, { start: monthStart, end: monthEnd });
    });

    const monthStats = calculateStats(monthSessions);

    dataPoints.push({
      label: format(monthStart, 'MMM yyyy'),
      value: monthStats.totalSurfTime, // Default to total surf time
      date: monthStart,
      avgWaveQuality: monthStats.avgWaveQuality,
    });
  }

  return dataPoints;
}

/**
 * Group sessions by spot for the selected time range
 */
export function groupSessionsBySpot(sessions: SurfSessionResponse[]): PieChartDataPoint[] {
  const spotCounts: Record<string, number> = {};
  
  sessions.forEach(session => {
    const spotName = session.spot.name;
    spotCounts[spotName] = (spotCounts[spotName] || 0) + 1;
  });

  const colors = [
    '#06b6d4', // cyan-500
    '#22c55e', // green-500
    '#eab308', // yellow-500
    '#f97316', // orange-500
    '#ef4444', // red-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
  ];

  return Object.entries(spotCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
}

/**
 * Format duration in minutes to a readable string
 */
export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

/**
 * Format wave quality with one decimal place
 */
export function formatWaveQuality(quality: number): string {
  return `${quality.toFixed(1)}/10`;
}

/**
 * Format date consistently across the app
 */
export function formatSessionDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date for table: month and day on first line, year on second (e.g. "Feb 2" / "2026").
 */
export function formatSessionDateTable(dateString: string): { dateLine: string; yearLine: string } {
  const d = parseISO(dateString);
  return {
    dateLine: format(d, 'MMM d'),
    yearLine: format(d, 'yyyy'),
  };
}

/**
 * Format time from datetime string (e.g. "08:00")
 */
export function formatSessionTime(datetimeString: string): string {
  return new Date(datetimeString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Format wave height with 1 decimal place and unit, or dash if null
 */
export function formatWaveHeight(height?: number): string {
  return height != null ? `${height.toFixed(1)} m` : '—';
}

/**
 * Format wind speed as integer with unit, or dash if null
 */
export function formatWindSpeed(speed?: number): string {
  return speed != null ? `${Math.round(speed)} km/h` : '—';
}

/**
 * Format direction as compact text, or dash if null
 */
export function formatDirection(direction?: string): string {
  return direction ?? '—';
}

/**
 * Format duration as clean number for table cells (no units)
 */
export function formatDurationClean(minutes: number): string {
  return minutes.toString();
}

/**
 * Format wave height as clean number for table cells (no units), or dash if null
 */
export function formatWaveHeightClean(height?: number): string {
  return height != null ? height.toFixed(1) : '—';
}

/**
 * Format wind speed as clean number for table cells (no units), or dash if null
 */
export function formatWindSpeedClean(speed?: number): string {
  return speed != null ? Math.round(speed).toString() : '—';
}
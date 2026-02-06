import { SurfSessionResponse } from '../types/api';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subDays, isWithinInterval, format, parseISO, eachDayOfInterval, startOfDay, addMinutes } from 'date-fns';

export type TimeRange = 'week' | 'month' | '3month' | 'all';

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
  sessions?: SurfSessionResponse[];
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
 * Filter sessions for the last 7 days ending on baseDate
 */
export function getSessionsForWeek(sessions: SurfSessionResponse[], baseDate: Date): SurfSessionResponse[] {
  const weekEnd = startOfDay(subDays(baseDate, -1));
  const weekStart = startOfDay(subDays(baseDate, 6));

  return sessions.filter(session => {
    const sessionDate = parseISO(session.datetime);
    return sessionDate >= weekStart && sessionDate < weekEnd;
  });
}

/**
 * Filter sessions for the last 30 days ending on baseDate
 */
export function getSessionsForMonth(sessions: SurfSessionResponse[], baseDate: Date): SurfSessionResponse[] {
  const monthEnd = startOfDay(subDays(baseDate, -1));
  const monthStart = startOfDay(subDays(baseDate, 29));

  return sessions.filter(session => {
    const sessionDate = parseISO(session.datetime);
    return sessionDate >= monthStart && sessionDate < monthEnd;
  });
}

/**
 * Filter sessions for the last 90 days ending on baseDate
 */
export function getSessionsFor3Months(sessions: SurfSessionResponse[], baseDate: Date): SurfSessionResponse[] {
  const monthEnd = startOfDay(subDays(baseDate, -1));
  const threeMonthsStart = startOfDay(subDays(baseDate, 89));

  return sessions.filter(session => {
    const sessionDate = parseISO(session.datetime);
    return sessionDate >= threeMonthsStart && sessionDate < monthEnd;
  });
}

/**
 * Get sessions for the selected time range and base date
 */
export function getSessionsForTimeRange(
  sessions: SurfSessionResponse[], 
  timeRange: TimeRange, 
  baseDate: Date = new Date()
): SurfSessionResponse[] {
  switch (timeRange) {
    case 'week':
      return getSessionsForWeek(sessions, baseDate);
    case 'month':
      return getSessionsForMonth(sessions, baseDate);
    case '3month':
      return getSessionsFor3Months(sessions, baseDate);
    default:
      return sessions;
  }
}

/**
 * Group sessions by day for a specific N-day range ending on baseDate
 */
export function groupSessionsByDay(sessions: SurfSessionResponse[], days: number, baseDate: Date = new Date()): ChartDataPoint[] {
  const startDate = startOfDay(subDays(baseDate, days - 1));
  const endDate = startOfDay(baseDate);

  const daysArray = eachDayOfInterval({ start: startDate, end: endDate });
  const dataPoints: ChartDataPoint[] = [];

  daysArray.forEach(day => {
    const dayStart = startOfDay(day);
    const dayEnd = startOfDay(subDays(day, -1));

    const daySessions = sessions.filter(session => {
      const sessionDate = parseISO(session.datetime);
      return isWithinInterval(sessionDate, { start: dayStart, end: dayEnd });
    });

    const dayStats = calculateStats(daySessions);

    dataPoints.push({
      label: format(day, 'MMM d'),
      value: dayStats.totalSurfTime,
      date: day,
      avgWaveQuality: dayStats.avgWaveQuality,
      sessions: daySessions,
    });
  });

  return dataPoints;
}

/**
 * Group sessions by day for the last 7 days ending on baseDate
 */
export function groupSessionsForCalendarWeek(sessions: SurfSessionResponse[], baseDate: Date): ChartDataPoint[] {
  const weekEnd = startOfDay(baseDate);
  const weekStart = startOfDay(subDays(baseDate, 6));

  const daysArray = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const dataPoints: ChartDataPoint[] = [];

  daysArray.forEach(day => {
    const dayStart = startOfDay(day);
    const dayEnd = startOfDay(subDays(day, -1));

    const daySessions = sessions.filter(session => {
      const sessionDate = parseISO(session.datetime);
      return sessionDate >= dayStart && sessionDate < dayEnd;
    });

    const dayStats = calculateStats(daySessions);

    dataPoints.push({
      label: format(day, 'MMM d'),
      value: dayStats.totalSurfTime,
      date: day,
      avgWaveQuality: dayStats.avgWaveQuality,
      sessions: daySessions,
    });
  });

  return dataPoints;
}

/**
 * Group sessions by day for the last 30 days ending on baseDate
 */
export function groupSessionsForCalendarMonth(sessions: SurfSessionResponse[], baseDate: Date): ChartDataPoint[] {
  const monthEnd = startOfDay(baseDate);
  const monthStart = startOfDay(subDays(baseDate, 29));

  const daysArray = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dataPoints: ChartDataPoint[] = [];

  daysArray.forEach(day => {
    const dayStart = startOfDay(day);
    const dayEnd = startOfDay(subDays(day, -1));

    const daySessions = sessions.filter(session => {
      const sessionDate = parseISO(session.datetime);
      return sessionDate >= dayStart && sessionDate < dayEnd;
    });

    const dayStats = calculateStats(daySessions);

    dataPoints.push({
      label: format(day, 'MMM d'),
      value: dayStats.totalSurfTime,
      date: day,
      avgWaveQuality: dayStats.avgWaveQuality,
      sessions: daySessions,
    });
  });

  return dataPoints;
}

/**
 * Group sessions by week for the last 90 days ending on baseDate
 */
export function groupSessionsFor3Months(sessions: SurfSessionResponse[], baseDate: Date): ChartDataPoint[] {
  const monthEnd = startOfDay(baseDate);
  const threeMonthsStart = startOfDay(subDays(baseDate, 89));

  const weeksArray: ChartDataPoint[] = [];
  let currentWeekStart = threeMonthsStart;

  while (currentWeekStart <= monthEnd) {
    const currentWeekEnd = startOfDay(subDays(currentWeekStart, -7));
    const actualWeekEnd = currentWeekEnd > startOfDay(subDays(monthEnd, -1)) ? startOfDay(subDays(monthEnd, -1)) : currentWeekEnd;

    const weekSessions = sessions.filter(session => {
      const sessionDate = parseISO(session.datetime);
      return sessionDate >= currentWeekStart && sessionDate < actualWeekEnd;
    });

    const weekStats = calculateStats(weekSessions);

    weeksArray.push({
      label: format(currentWeekStart, 'MMM d'),
      value: weekStats.totalSurfTime,
      date: currentWeekStart,
      avgWaveQuality: weekStats.avgWaveQuality,
      sessions: weekSessions,
    });

    currentWeekStart = actualWeekEnd;
  }

  return weeksArray;
}

/**
 * Get chart data for the selected time range and navigated date
 */
export function getChartDataForTimeRange(
  sessions: SurfSessionResponse[], 
  timeRange: TimeRange,
  baseDate: Date = new Date()
): ChartDataPoint[] {
  switch (timeRange) {
    case 'week':
      return groupSessionsForCalendarWeek(sessions, baseDate);
    case 'month':
      return groupSessionsForCalendarMonth(sessions, baseDate);
    case '3month':
      return groupSessionsFor3Months(sessions, baseDate);
    case 'all':
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
      value: monthStats.totalSurfTime,
      date: monthStart,
      avgWaveQuality: monthStats.avgWaveQuality,
      sessions: monthSessions,
    });
  }

  return dataPoints;
}

/**
 * Get a readable label for the current time range
 */
export function getTimeRangeLabel(timeRange: TimeRange, baseDate: Date): string {
  if (timeRange === 'all') return 'All time';

  if (timeRange === 'week') {
    const start = startOfDay(subDays(baseDate, 6));
    const end = startOfDay(baseDate);
    
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${format(start, 'd')}-${format(end, 'd')} ${format(end, 'MMM yyyy')}`;
    }
    return `${format(start, 'd')} ${format(start, 'MMM')} - ${format(end, 'd')} ${format(end, 'MMM yyyy')}`;
  }

  if (timeRange === '3month') {
    const start = startOfDay(subDays(baseDate, 89));
    const end = startOfDay(baseDate);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }

  if (timeRange === 'month') {
    const start = startOfDay(subDays(baseDate, 29));
    const end = startOfDay(baseDate);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }

  return format(baseDate, 'MMMM yyyy');
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
export function formatSessionTime(datetimeString: string, durationMinutes?: number): string {
  const startDate = parseISO(datetimeString);
  const startTime = format(startDate, 'HH:mm');
  if (durationMinutes == null || Number.isNaN(durationMinutes)) {
    return startTime;
  }
  const endDate = addMinutes(startDate, durationMinutes);
  const endTime = format(endDate, 'HH:mm');
  return `${startTime} - ${endTime}`;
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

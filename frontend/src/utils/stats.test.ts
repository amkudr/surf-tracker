import {
  calculateStats,
  getSessionsForTimeRange,
  groupSessionsBySpot,
} from './stats';
import { type SurfSessionResponse } from '../types/api';

const makeSession = (
  id: number,
  datetime: string,
  duration: number,
  waveQuality: number,
  spotName: string
): SurfSessionResponse => ({
  id,
  datetime,
  duration_minutes: duration,
  notes: '',
  spot_id: id,
  surfboard_id: undefined,
  user_id: 1,
  created_at: datetime,
  review: {
    id,
    surf_session_id: id,
    spot_id: id,
    observed_at: datetime,
    quality: waveQuality,
    crowded_level: 5,
    wave_height_index: 5,
    short_long_index: 5,
    wind_index: 5,
    created_at: datetime,
  },
  spot: {
    id,
    name: spotName,
  },
});

describe('stats utils', () => {
  const baseDate = new Date('2026-02-06T12:00:00Z');
  const sessions: SurfSessionResponse[] = [
    makeSession(1, '2026-02-05T08:00:00Z', 60, 6.5, 'Pipeline'),
    makeSession(2, '2026-02-03T09:00:00Z', 30, 7.5, 'Pipeline'),
    makeSession(3, '2026-01-31T10:00:00Z', 45, 5.5, 'Mavericks'),
    makeSession(4, '2026-01-20T11:00:00Z', 40, 4.0, 'Trestles'),
  ];

  it('calculates aggregate stats', () => {
    const stats = calculateStats(sessions);
    expect(stats.sessionsCount).toBe(4);
    expect(stats.totalSurfTime).toBe(175);
    expect(stats.avgWaveQuality).toBeCloseTo((6.5 + 7.5 + 5.5 + 4.0) / 4);
    expect(stats.mostPopularSpot).toBe('Pipeline');
  });

  it.each(['week', 'month', '3month'] as const)(
    'filters sessions for %s range relative to baseDate',
    (range) => {
      const filtered = getSessionsForTimeRange(sessions, range, baseDate);
      const earliestAllowed =
        range === 'week'
          ? new Date('2026-01-31T00:00:00Z')
          : range === 'month'
            ? new Date('2026-01-08T00:00:00Z')
            : new Date('2025-11-09T00:00:00Z');

      expect(filtered.length).toBe(range === 'week' ? 3 : 4);
      expect(filtered.every((s) => new Date(s.datetime) >= earliestAllowed)).toBe(true);
    }
  );

  it('groups sessions by spot with counts and colors', () => {
    const grouped = groupSessionsBySpot(sessions);
    expect(grouped[0]).toMatchObject({ name: 'Pipeline', value: 2 });
    expect(grouped.find((g) => g.name === 'Mavericks')?.value).toBe(1);
    expect(grouped.find((g) => g.name === 'Trestles')?.value).toBe(1);
    expect(grouped.every((g) => !!g.color)).toBe(true);
  });
});

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { surfSessionsAPI } from '../services/api';
import { SurfSessionResponse } from '../types/api';
import { Plus, Clock, Waves, Calendar, Edit } from 'lucide-react';
import { StatCard, Card, CardHeader, CardContent, EmptyState, Button, SegmentedControl, SectionTitle } from '../components/ui';
import { SimpleChart } from '../components/SimpleChart';
import { PageHero } from '../components/PageHero';
import {
  calculateStats,
  getSessionsForTimeRange,
  getChartDataForTimeRange,
  formatDuration,
  formatWaveQuality,
  formatSessionDate,
  type TimeRange
} from '../utils/stats';

const DashboardPage = () => {
  const [sessions, setSessions] = useState<SurfSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await surfSessionsAPI.getAll();
        setSessions(data);
      } catch (err: any) {
        setError('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Calculate statistics for selected time range
  const timeRangeSessions = timeRange === 'all' ? sessions : getSessionsForTimeRange(sessions, timeRange as 'week' | 'month');
  const timeRangeStats = calculateStats(timeRangeSessions);

  // Prepare chart data for selected time range
  const chartData = getChartDataForTimeRange(sessions, timeRange);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <PageHero
        title="Dashboard"
        subtitle="Welcome back. Here's your surf session overview."
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <SegmentedControl
              options={[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'all', label: 'All time' },
              ]}
              value={timeRange}
              onChange={(value) => setTimeRange(value as TimeRange)}
            />
            <Link to="/sessions/new">
              <Button variant="primary" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary & Chart Integrated Card */}
      <Card>
        <CardHeader>
          <SectionTitle>
            Surf Overview ({
              timeRange === 'all' ? 'All time' :
              timeRange === 'week' ? 'Week' :
              'Month'
            })
          </SectionTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Sessions"
                value={timeRangeStats.sessionsCount.toString()}
                icon={<Calendar className="h-5 w-5 text-accent" />}
              />

              <StatCard
                title="Avg Wave Quality"
                value={formatWaveQuality(timeRangeStats.avgWaveQuality)}
                icon={<Waves className="h-5 w-5 text-accent" />}
              />

              <StatCard
                title="Total Surf Time"
                value={formatDuration(timeRangeStats.totalSurfTime)}
                icon={<Clock className="h-5 w-5 text-accent" />}
              />

              <StatCard
                title="Most Popular Spot"
                value={timeRangeStats.mostPopularSpot}
                icon={<Plus className="h-5 w-5 text-accent" />}
              />
            </div>
            
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-content-secondary mb-4">
                Surf Time ({
                  timeRange === 'all' ? 'All time' :
                  timeRange === 'week' ? 'Week' :
                  'Month'
                })
              </h4>
              <SimpleChart
                data={chartData}
                height={240}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions - Clean list */}
      <Card>
        <CardHeader>
          <SectionTitle>Recent Sessions</SectionTitle>
        </CardHeader>

        <div className="p-6 space-y-4">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-body text-destructive">{error}</p>
            </div>
          )}

          {sessions.length === 0 ? (
            <EmptyState
              icon={<Waves className="h-12 w-12" />}
              title="No surf sessions yet"
              description="Start tracking your surf sessions to see insights here."
              action={{
                label: "Add Your First Session",
                onClick: () => window.location.href = '/sessions/new'
              }}
            />
          ) : (
            <div>
              {/* Desktop table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="col-span-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</span>
                </div>
                <div className="col-span-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Spot</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quality</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</span>
                </div>
              </div>

              {/* Recent sessions list - show last 5 */}
              <div className="divide-y divide-border">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="p-4 hover:bg-background-secondary transition-colors">
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <h3 className="text-body font-medium text-content-primary">{session.spot.name}</h3>
                            <p className="text-caption text-content-secondary">{formatSessionDate(session.datetime)}</p>
                          </div>
                        </div>
                        <Link to={`/sessions/${session.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-caption text-content-secondary">Duration</p>
                          <p className="text-body font-medium text-content-primary">{formatDuration(session.duration_minutes)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-caption text-content-secondary">Quality</p>
                          <p className="text-body font-medium text-content-primary">{formatWaveQuality(session.wave_quality)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop table layout */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4">
                        <span className="text-sm text-content-primary">{formatSessionDate(session.datetime)}</span>
                      </div>
                      <div className="col-span-4">
                        <span className="text-sm text-content-primary">{session.spot.name}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-sm text-content-primary">{formatDuration(session.duration_minutes)}</span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-sm text-content-primary">{formatWaveQuality(session.wave_quality)}</span>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Link to={`/sessions/${session.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {sessions.length >= 5 && (
                <div className="text-center pt-4">
                  <Link to="/sessions" className="text-accent hover:text-accent-hover text-body font-medium">
                    View all sessions →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
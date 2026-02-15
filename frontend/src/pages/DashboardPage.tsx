import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { surfSessionsAPI } from '../services/api';
import { SurfSessionResponse } from '../types/api';
import { Waves, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, EmptyState, Button, SectionTitle, SegmentedControl, Loading, Alert, AlertDescription } from '../components/ui';
import { SimpleChart } from '../components/SimpleChart';
import { PageHero } from '../components/PageHero';
import { 
  addDays,
  subDays,
} from 'date-fns';
import {
  calculateStats,
  getSessionsForTimeRange,
  getChartDataForTimeRange,
  formatDuration,
  formatWaveQuality,
  formatSessionDate,
  groupSessionsBySpot,
  getTimeRangeLabel,
  type TimeRange
} from '../utils/stats';
import { SpotDistributionChart } from '../components/SpotDistributionChart';

const DashboardPage = () => {
  const [sessions, setSessions] = useState<SurfSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Calculate statistics for selected time range and current date
  const timeRangeSessions = useMemo(() => {
    return getSessionsForTimeRange(sessions, timeRange, currentDate);
  }, [sessions, timeRange, currentDate]);

  const timeRangeStats = useMemo(() => {
    return calculateStats(timeRangeSessions);
  }, [timeRangeSessions]);

  // Prepare chart data for selected time range
  const chartData = useMemo(() => {
    return getChartDataForTimeRange(sessions, timeRange, currentDate);
  }, [sessions, timeRange, currentDate]);

  const spotDistributionData = useMemo(() => {
    return groupSessionsBySpot(timeRangeSessions);
  }, [timeRangeSessions]);

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
      .slice(0, 5);
  }, [sessions]);

  const handlePrevious = () => {
    if (timeRange === 'week') {
      setCurrentDate(prev => {
        const newDate = subDays(prev, 7);
        return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      });
    } else if (timeRange === 'month') {
      setCurrentDate(prev => {
        const newDate = subDays(prev, 30);
        return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      });
    } else if (timeRange === '3month') {
      setCurrentDate(prev => {
        const newDate = subDays(prev, 90);
        return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      });
    }
  };

  const handleNext = () => {
    if (timeRange === 'week') {
      setCurrentDate(prev => {
        const newDate = addDays(prev, 7);
        return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      });
    } else if (timeRange === 'month') {
      setCurrentDate(prev => {
        const newDate = addDays(prev, 30);
        return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      });
    } else if (timeRange === '3month') {
      setCurrentDate(prev => {
        const newDate = addDays(prev, 90);
        return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      });
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (timeRange !== 'all') {
        handleNext();
      }
    },
    onSwipedRight: () => {
      if (timeRange !== 'all') {
        handlePrevious();
      }
    },
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 50, // minimum swipe distance in pixels
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <PageHero
        title="Dashboard"
        subtitle="Welcome back. Here's your surf session overview."
        actions={
          <Link to="/sessions/new">
            <Button variant="primary" size="md">
              Add Session
            </Button>
          </Link>
        }
      />

      {/* Main Statistics Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {/* Header Section */}
          <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
            {/* Controls + Stats in one row on large+ screens */}
            <div className="hidden lg:grid grid-cols-[44px_272px_1fr_200px_44px] items-center gap-4">
              <div className="flex justify-center">
                {timeRange !== 'all' && (
                  <Button
                    onClick={handlePrevious}
                    aria-label="Previous period"
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
              </div>

              <SegmentedControl
                value={timeRange}
                onChange={(value) => {
                  setTimeRange(value as TimeRange);
                  setCurrentDate(new Date());
                }}
                options={[
                  { value: 'week', label: 'W' },
                  { value: 'month', label: 'M' },
                  { value: '3month', label: '3M' },
                  { value: 'all', label: 'All' },
                ]}
                size="md"
                className="w-[272px] justify-between"
              />

              <div className="grid grid-cols-3 items-center gap-12 justify-items-center">
                <div className="flex flex-col items-center gap-1 min-w-[120px]">
                  <span className="text-5xl font-bold text-content-primary tabular-nums">{timeRangeStats.sessionsCount}</span>
                  <span className="text-sm text-content-tertiary">sessions</span>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[120px]">
                  <span className="text-5xl font-bold text-content-primary tabular-nums">{timeRangeStats.totalSurfTime}</span>
                  <span className="text-sm text-content-tertiary">minutes</span>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[120px]">
                  <span className="text-5xl font-bold text-content-primary tabular-nums">{timeRangeStats.avgWaveQuality.toFixed(1)}</span>
                  <span className="text-sm text-content-tertiary">quality</span>
                </div>
              </div>

              <div className="text-sm text-content-secondary text-right font-medium whitespace-nowrap">
                {getTimeRangeLabel(timeRange, currentDate)}
              </div>

              <div className="flex justify-center">
                {timeRange !== 'all' && (
                  <Button
                    onClick={handleNext}
                    aria-label="Next period"
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile/Tablet stacked layout */}
            <div className="lg:hidden space-y-4">
              <SegmentedControl
                value={timeRange}
                onChange={(value) => {
                  setTimeRange(value as TimeRange);
                  setCurrentDate(new Date());
                }}
                options={[
                  { value: 'week', label: 'W' },
                  { value: 'month', label: 'M' },
                  { value: '3month', label: '3M' },
                  { value: 'all', label: 'All' },
                ]}
                size="md"
                className="w-full justify-between rounded-full bg-white border-border/70 shadow-sm"
              />
              <div className="flex items-center justify-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center">
                  {timeRange !== 'all' && (
                    <Button
                      onClick={handlePrevious}
                      aria-label="Previous period"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-full p-0 text-content-secondary hover:text-content-primary"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex-1 max-w-[260px] text-center text-sm text-content-primary font-medium bg-white px-4 py-2.5 rounded-full whitespace-nowrap">
                  {getTimeRangeLabel(timeRange, currentDate)}
                </div>
                <div className="h-9 w-9 flex items-center justify-center">
                  {timeRange !== 'all' && (
                    <Button
                      onClick={handleNext}
                      aria-label="Next period"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-full p-0 text-content-secondary hover:text-content-primary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 justify-items-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-content-primary tabular-nums">{timeRangeStats.sessionsCount}</span>
                  <span className="text-xs text-content-tertiary">sessions</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-content-primary tabular-nums">{timeRangeStats.totalSurfTime}</span>
                  <span className="text-xs text-content-tertiary">minutes</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-content-primary tabular-nums">{timeRangeStats.avgWaveQuality.toFixed(1)}</span>
                  <span className="text-xs text-content-tertiary">quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Swipeable Chart Area */}
          <div className="-mx-6 sm:-mx-8 lg:-mx-10">
            <div 
              {...swipeHandlers}
              className={`select-none rounded-2xl p-0 sm:p-1 ${timeRange !== 'all' ? 'cursor-grab active:cursor-grabbing' : ''}`}
              style={{ touchAction: 'pan-y' }}
            >
              <SimpleChart
                data={chartData}
                height={280}
                showLabels={true}
                timeRange={timeRange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <SectionTitle>Popular Spot</SectionTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 sm:pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-xl">
                <Waves className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">
                  {timeRangeStats.mostPopularSpot}
                </p>
                <p className="text-sm text-content-secondary">Most visited</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SectionTitle>Spot Distribution</SectionTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 sm:pb-6">
            <SpotDistributionChart
              data={spotDistributionData}
              height={180}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions - Clean list */}
      <Card>
        <CardHeader className="pb-2">
          <SectionTitle>Recent Sessions</SectionTitle>
        </CardHeader>

        <div className="p-5 sm:p-6 space-y-3">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-background-secondary">
                <div className="col-span-4">
                  <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Date</span>
                </div>
                <div className="col-span-4">
                  <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Spot</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Duration</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Quality</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Actions</span>
                </div>
              </div>

              {/* Recent sessions list - show last 5 */}
              <div className="divide-y divide-border rounded-xl overflow-hidden border border-border/70">
                {recentSessions.map((session) => (
                  <div key={session.id} className="p-3 sm:p-4 hover:bg-background-secondary transition-colors">
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
                          <p className="text-body font-medium text-content-primary">{formatWaveQuality(session.review?.quality)}</p>
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
                        <span className="text-sm text-content-primary">{formatWaveQuality(session.review?.quality)}</span>
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

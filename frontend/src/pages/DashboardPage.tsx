import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { surfSessionsAPI } from '../services/api';
import { SurfSessionResponse } from '../types/api';
import { Plus, Waves, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, EmptyState, Button, SectionTitle } from '../components/ui';
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <PageHero
        title="Dashboard"
        subtitle="Welcome back. Here's your surf session overview."
        actions={
          <Link to="/sessions/new">
            <Button variant="primary" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </Link>
        }
      />

      {/* Main Statistics Card */}
      <Card>
        <CardContent className="p-6">
          {/* Header Section */}
          <div className="space-y-6 mb-8">
            {/* Time Range Selector */}
            <div className="flex items-center justify-center gap-3">
              {[
                { value: 'week' as TimeRange, label: 'W' },
                { value: 'month' as TimeRange, label: 'M' },
                { value: '3month' as TimeRange, label: '3M' },
                { value: 'all' as TimeRange, label: 'All' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTimeRange(option.value);
                    setCurrentDate(new Date());
                  }}
                  className={`
                    min-w-[64px] px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200
                    ${timeRange === option.value
                      ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Stats and Date Row - Desktop */}
            <div className="hidden lg:grid grid-cols-[40px_1fr_auto_40px] items-center gap-6 px-8">
              {/* Left Arrow - Fixed width */}
              <div className="flex items-center justify-center">
                {timeRange !== 'all' && (
                  <button
                    onClick={handlePrevious}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                    aria-label="Previous period"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* Stats - Fixed grid */}
              <div className="grid grid-cols-3 gap-16">
                <div className="flex items-baseline gap-3 justify-center">
                  <span className="text-5xl font-bold text-gray-900 tabular-nums">{timeRangeStats.sessionsCount}</span>
                  <span className="text-sm text-gray-500">sessions</span>
                </div>
                <div className="flex items-baseline gap-3 justify-center">
                  <span className="text-5xl font-bold text-gray-900 tabular-nums">{timeRangeStats.totalSurfTime}</span>
                  <span className="text-sm text-gray-500">minutes</span>
                </div>
                <div className="flex items-baseline gap-3 justify-center">
                  <span className="text-5xl font-bold text-gray-900 tabular-nums">{timeRangeStats.avgWaveQuality.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">quality</span>
                </div>
              </div>

              {/* Date Range - Fixed position */}
              <div className="text-sm text-gray-500 text-right min-w-[200px]">
                {getTimeRangeLabel(timeRange, currentDate)}
              </div>

              {/* Right Arrow - Fixed width */}
              <div className="flex items-center justify-center">
                {timeRange !== 'all' && (
                  <button
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                    aria-label="Next period"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Stats and Date - Mobile (Stacked) */}
            <div className="lg:hidden space-y-4">
              <div className="text-center text-sm text-gray-500">
                {getTimeRangeLabel(timeRange, currentDate)}
              </div>
              <div className="flex items-center justify-center gap-12">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 mb-1">{timeRangeStats.sessionsCount}</p>
                  <p className="text-xs text-gray-500">sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 mb-1">{timeRangeStats.totalSurfTime}</p>
                  <p className="text-xs text-gray-500">minutes</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 mb-1">{timeRangeStats.avgWaveQuality.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">quality</p>
                </div>
              </div>
            </div>
          </div>

          {/* Swipeable Chart Area */}
          <div 
            {...swipeHandlers}
            className={`px-2 select-none ${timeRange !== 'all' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ touchAction: 'pan-y' }}
          >
            <SimpleChart
              data={chartData}
              height={280}
              showLabels={true}
              timeRange={timeRange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Secondary Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <SectionTitle>Popular Spot</SectionTitle>
          </CardHeader>
          <CardContent>
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
          <CardHeader>
            <SectionTitle>Spot Distribution</SectionTitle>
          </CardHeader>
          <CardContent>
            <SpotDistributionChart
              data={spotDistributionData}
              height={180}
            />
          </CardContent>
        </Card>
      </div>

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
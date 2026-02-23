import { useEffect, useState, type ReactNode } from 'react';
import { spotsAPI } from '../services/api';
import { SpotResponse, SpotCreate, SpotReviewResponse } from '../types/api';
import { MapPin, Navigation, Hash, Save, LayoutGrid, Map as MapIcon, ExternalLink, Waves, ChevronDown, Star, Users, Wind, ArrowLeftRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, EmptyState, Button, FormField, DifficultyBadges, CoordinatesBadge, SegmentedControl, SurfForecastWidget, Input, Alert, AlertDescription, Loading, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../components/ui';
import { PageHero } from '../components/PageHero';
import { MapProvider } from '../components/MapProvider';
import { SpotMap } from '../components/SpotMap';
import { cn } from '../utils/cn';

const SurfSpotsPage = () => {
  const [spots, setSpots] = useState<SpotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<SpotCreate>({
    name: '',
    latitude: undefined,
    longitude: undefined,
    difficulty: [],
    surf_forecast_name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [expandedSpotId, setExpandedSpotId] = useState<number | null>(null);
  const [reviewsBySpot, setReviewsBySpot] = useState<Record<number, SpotReviewResponse[]>>({});
  const [reviewsHasMore, setReviewsHasMore] = useState<Record<number, boolean>>({});
  const [reviewsLoading, setReviewsLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    setError('');
    try {
      const data = await spotsAPI.getAll();
      setSpots(data);
      setError('');
    } catch (err: any) {
      setError('Failed to load spots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'latitude' || name === 'longitude'
        ? (value === '' ? undefined : parseFloat(value))
        : value,
    });
  };

  const handleDifficultyChange = (difficulty: number) => {
    setFormData({
      ...formData,
      difficulty: formData.difficulty?.includes(difficulty)
        ? formData.difficulty.filter(d => d !== difficulty)
        : [...(formData.difficulty || []), difficulty],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Sort difficulty array to ensure ascending order (required by database constraint)
      const sortedFormData = {
        ...formData,
        difficulty: [...(formData.difficulty || [])].sort((a, b) => a - b),
      };
      
      await spotsAPI.create(sortedFormData);
      setFormData({
        name: '',
        latitude: undefined,
        longitude: undefined,
        difficulty: [],
        surf_forecast_name: '',
      });
      setShowForm(false);
      fetchSpots();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create spot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSpotReviews = async (spotId: number, append: boolean) => {
    setReviewsLoading(prev => ({ ...prev, [spotId]: true }));
    const offset = append ? (reviewsBySpot[spotId]?.length || 0) : 0;
    try {
      const loadedReviews = await spotsAPI.getReviews(spotId, 10, offset);
      setReviewsBySpot(prev => ({
        ...prev,
        [spotId]: append ? [...(prev[spotId] || []), ...loadedReviews] : loadedReviews,
      }));
      setReviewsHasMore(prev => ({ ...prev, [spotId]: loadedReviews.length === 10 }));
    } finally {
      setReviewsLoading(prev => ({ ...prev, [spotId]: false }));
    }
  };

  const toggleSpotReviews = async (spotId: number) => {
    if (expandedSpotId === spotId) {
      setExpandedSpotId(null);
      return;
    }
    setExpandedSpotId(spotId);
    if (!reviewsBySpot[spotId]) {
      await loadSpotReviews(spotId, false);
    }
  };

  const formatObservedAt = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const renderMeter = (
    value: number | null | undefined,
    max: number,
    activeClassName: string
  ): ReactNode => {
    if (value == null) {
      return <span className="text-content-tertiary">—</span>;
    }
    const normalized = Math.max(0, Math.min(1, value / max));
    const filled = Math.round(normalized * 5);
    return (
      <span className="inline-flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={`meter-${i}`}
            className={cn(
              'h-1.5 w-4 rounded-full transition-colors',
              i < filled ? activeClassName : 'bg-border-secondary'
            )}
          />
        ))}
      </span>
    );
  };

  const renderStars = (
    value: number | null | undefined,
    activeClassName = 'text-amber-500'
  ): ReactNode => {
    if (value == null) {
      return <span className="text-content-tertiary">—</span>;
    }
    const filled = Math.round(Math.max(0, Math.min(1, value / 10)) * 5);
    return (
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={`star-${i}`}
            className={cn('text-[13px] leading-none', i < filled ? activeClassName : 'text-border')}
          >
            ★
          </span>
        ))}
      </span>
    );
  };

  type ValueBand = { max: number; label: string };
  type ColorBand = { max: number; iconClassName: string; meterClassName: string };

  const QUALITY_BANDS: ValueBand[] = [
    { max: 1, label: 'flat' },
    { max: 3, label: 'weak' },
    { max: 5, label: 'average' },
    { max: 7, label: 'good' },
    { max: 10, label: 'epic' },
  ];
  const CROWD_BANDS: ValueBand[] = [
    { max: 1, label: 'empty' },
    { max: 3, label: 'quiet' },
    { max: 5, label: 'busy' },
    { max: 7, label: 'crowded' },
    { max: 10, label: 'packed' },
  ];
  const WAVE_BANDS: ValueBand[] = [
    { max: 1, label: 'glassy' },
    { max: 3, label: 'choppy' },
    { max: 5, label: 'shoulder-high' },
    { max: 7, label: 'overhead' },
    { max: 10, label: 'heavy' },
  ];
  const BOARD_FIT_BANDS: ValueBand[] = [
    { max: 1, label: 'shortboard only' },
    { max: 3, label: 'shortboard lean' },
    { max: 6, label: 'neutral' },
    { max: 8, label: 'longboard lean' },
    { max: 10, label: 'longboard only' },
  ];
  const WIND_BANDS: ValueBand[] = [
    { max: 1, label: 'glassy' },
    { max: 3, label: 'light' },
    { max: 5, label: 'breezy' },
    { max: 7, label: 'windy' },
    { max: 10, label: 'stormy' },
  ];
  const CROWD_COLOR_BANDS: ColorBand[] = [
    { max: 1, iconClassName: 'text-emerald-500', meterClassName: 'bg-emerald-500' },
    { max: 3, iconClassName: 'text-lime-500', meterClassName: 'bg-lime-500' },
    { max: 5, iconClassName: 'text-amber-500', meterClassName: 'bg-amber-500' },
    { max: 7, iconClassName: 'text-orange-500', meterClassName: 'bg-orange-500' },
    { max: 10, iconClassName: 'text-rose-500', meterClassName: 'bg-rose-500' },
  ];
  const WIND_COLOR_BANDS: ColorBand[] = [
    { max: 1, iconClassName: 'text-emerald-500', meterClassName: 'bg-emerald-500' },
    { max: 3, iconClassName: 'text-lime-500', meterClassName: 'bg-lime-500' },
    { max: 5, iconClassName: 'text-amber-500', meterClassName: 'bg-amber-500' },
    { max: 7, iconClassName: 'text-orange-500', meterClassName: 'bg-orange-500' },
    { max: 10, iconClassName: 'text-rose-500', meterClassName: 'bg-rose-500' },
  ];

  const getBandLabel = (value: number, bands: ValueBand[]): string => {
    const clampedValue = Math.max(0, Math.min(10, value));
    return (bands.find((band) => clampedValue <= band.max) ?? bands[bands.length - 1]).label;
  };

  const getMetricColor = (
    value: number | null | undefined,
    bands: ColorBand[]
  ): { iconClassName: string; meterClassName: string } => {
    if (value == null) {
      return { iconClassName: 'text-content-tertiary', meterClassName: 'bg-border-secondary' };
    }
    const clampedValue = Math.max(0, Math.min(10, value));
    const band = bands.find((item) => clampedValue <= item.max) ?? bands[bands.length - 1];
    return { iconClassName: band.iconClassName, meterClassName: band.meterClassName };
  };

  const getCrowdColor = (value: number | null | undefined) => getMetricColor(value, CROWD_COLOR_BANDS);
  const getWindColor = (value: number | null | undefined) => getMetricColor(value, WIND_COLOR_BANDS);

  const metricTooltipTitle = (
    label: string,
    value: number | null | undefined,
    bands: ValueBand[]
  ): string => {
    if (value == null) {
      return `${label} —`;
    }
    return `${label} ${(value || 0).toFixed(1)}/10(${getBandLabel(value, bands)})`;
  };

  const SymbolLegend = ({
    title,
    children,
    className,
  }: {
    title: string;
    children: ReactNode;
    className?: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('cursor-help', className)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-semibold">{title}</p>
      </TooltipContent>
    </Tooltip>
  );



  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-8">
      {/* Hero Header */}
      <PageHero
        title="Surf Spots"
        subtitle="Discover and manage surf locations"
        actions={
          <div className="inline-flex items-center gap-2">
            <Button
              variant={showForm ? 'secondary' : 'primary'}
              size="md"
              onClick={() => setShowForm(!showForm)}
              className="whitespace-nowrap"
            >
              {showForm ? (
                <>
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <span>Add Spot</span>
                </>
              )}
            </Button>
            <SegmentedControl
              options={[
                { value: 'grid', label: <LayoutGrid className="h-4 w-4" /> },
                { value: 'map', label: <MapIcon className="h-4 w-4" /> },
              ]}
              value={viewMode}
              onChange={(value) => setViewMode(value as 'grid' | 'map')}
              size="md"
            />
          </div>
        }
      />

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Spot Form */}
      {showForm && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Add New Surf Spot</CardTitle>
            <p className="text-body text-content-secondary mt-1">Create a new location for surf sessions</p>
          </CardHeader>

          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Spot Name */}
              <FormField label="Spot Name" required icon={<MapPin className="h-4 w-4" />}>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter spot name"
                />
              </FormField>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Latitude (optional)" icon={<Navigation className="h-4 w-4" />}>
                  <Input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    step="0.0001"
                    placeholder="-37.8136"
                  />
                </FormField>

                <FormField label="Longitude (optional)" icon={<Navigation className="h-4 w-4" />}>
                  <Input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    step="0.0001"
                    placeholder="144.9631"
                  />
                </FormField>
              </div>

              {/* Difficulty Levels */}
              <FormField label="Difficulty Levels" icon={<Hash className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 0, label: 'Beginner' },
                    { value: 1, label: 'Intermediate' },
                    { value: 2, label: 'Advanced' },
                    { value: 3, label: 'Expert' },
                  ].map((level) => (
                    <label key={level.value} className="relative flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.difficulty?.includes(level.value) || false}
                        onChange={() => handleDifficultyChange(level.value)}
                        className="w-4 h-4 text-accent border-border rounded focus:ring-accent focus:ring-2"
                      />
                      <span className="text-body text-content-primary">{level.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-caption text-content-secondary mt-2">
                  Select all difficulty levels that apply to this spot
                </p>
              </FormField>

              {/* Surf Forecast Name */}
              <FormField label="Surf Forecast Name (optional)" icon={<Waves className="h-4 w-4" />}>
                <Input
                  type="text"
                  id="surf_forecast_name"
                  name="surf_forecast_name"
                  value={formData.surf_forecast_name}
                  onChange={handleChange}
                  placeholder="e.g., Bells Beach"
                />
                <p className="text-caption text-content-secondary mt-2">
                  Enter the name used by the surf forecast provider (e.g., Stormrdr, Magicseaweed)
                </p>
              </FormField>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Add Spot
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Spots Content */}
      <MapProvider>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <EmptyState
                    icon={<MapPin className="h-12 w-12" />}
                    title="No surf spots yet"
                    description="Add your favorite surf locations to start tracking sessions at different spots."
                    action={{
                      label: "Add Your First Spot",
                      onClick: () => setShowForm(true)
                    }}
                  />
                </Card>
              </div>
            ) : (
              spots.map((spot) => (
                <Card key={spot.id} className="overflow-hidden border border-border shadow-none">
                  <div className="aspect-video relative">
                    {spot.latitude && spot.longitude ? (
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${spot.longitude - 0.01},${spot.latitude - 0.01},${spot.longitude + 0.01},${spot.latitude + 0.01}&layer=mapnik&marker=${spot.latitude},${spot.longitude}`}
                        className="w-full h-full border-0"
                        style={{ aspectRatio: '16 / 9' }}
                        loading="lazy"
                        title={`Map of ${spot.name}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-content-tertiary/20 flex items-center justify-center">
                        <p className="text-content-secondary text-body">No location data</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3 min-h-[32px] gap-3">
                      <h3 className="text-h3 font-semibold text-content-primary truncate mr-2" title={spot.name}>
                        {spot.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {spot.surf_forecast_name && (
                          <SurfForecastWidget
                            spotName={spot.surf_forecast_name}
                            buttonLabel="Forecast"
                            buttonClassName="text-[10px] h-7 px-2"
                          />
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (spot.latitude && spot.longitude) {
                              window.open(`https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`, '_blank');
                            }
                          }}
                          disabled={!spot.latitude || !spot.longitude}
                          className="text-[10px] h-7 px-2"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Maps
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <CoordinatesBadge
                        latitude={spot.latitude}
                        longitude={spot.longitude}
                        size="sm"
                      />

                      {spot.difficulty && spot.difficulty.length > 0 && (
                        <DifficultyBadges
                          values={spot.difficulty}
                          size="sm"
                          variant="bar"
                          interactive
                        />
                      )}
                    </div>

                    {(spot.review_summary?.review_count ?? 0) > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content-tertiary">
                            Today review
                          </span>
                          <SymbolLegend
                            title={metricTooltipTitle('Quality', spot.review_summary?.weighted_quality, QUALITY_BANDS)}
                            className="inline-flex items-center text-sm font-semibold text-content-primary"
                          >
                            {renderStars(spot.review_summary?.weighted_quality, 'text-amber-500')}
                          </SymbolLegend>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-content-secondary">
                          <SymbolLegend
                            title={metricTooltipTitle('Crowd', spot.review_summary?.avg_crowded_level, CROWD_BANDS)}
                            className="inline-flex items-center gap-1.5"
                          >
                            <Users className={cn('h-3.5 w-3.5', getCrowdColor(spot.review_summary?.avg_crowded_level).iconClassName)} />
                            {renderMeter(
                              spot.review_summary?.avg_crowded_level,
                              10,
                              getCrowdColor(spot.review_summary?.avg_crowded_level).meterClassName
                            )}
                          </SymbolLegend>
                          <SymbolLegend
                            title={metricTooltipTitle('Wave height', spot.review_summary?.avg_wave_height_index, WAVE_BANDS)}
                            className="inline-flex items-center gap-1.5"
                          >
                            <Waves className="h-3.5 w-3.5 text-cyan-500" />
                            {renderMeter(spot.review_summary?.avg_wave_height_index, 10, 'bg-cyan-500')}
                          </SymbolLegend>
                          <SymbolLegend
                            title={metricTooltipTitle('Board fit', spot.review_summary?.avg_short_long_index, BOARD_FIT_BANDS)}
                            className="inline-flex items-center gap-1.5"
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-500" />
                            {renderMeter(spot.review_summary?.avg_short_long_index, 10, 'bg-emerald-500')}
                          </SymbolLegend>
                          <SymbolLegend
                            title={metricTooltipTitle('Wind', spot.review_summary?.avg_wind_index, WIND_BANDS)}
                            className="inline-flex items-center gap-1.5"
                          >
                            <Wind className={cn('h-3.5 w-3.5', getWindColor(spot.review_summary?.avg_wind_index).iconClassName)} />
                            {renderMeter(
                              spot.review_summary?.avg_wind_index,
                              10,
                              getWindColor(spot.review_summary?.avg_wind_index).meterClassName
                            )}
                          </SymbolLegend>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-xs text-content-secondary">
                          <span>{spot.review_summary?.review_count ?? 0} reviews</span>
                          <button
                            type="button"
                            onClick={() => toggleSpotReviews(spot.id)}
                            className="inline-flex items-center gap-1 px-1 py-0.5 font-medium text-accent hover:text-accent-hover"
                          >
                            <span>{expandedSpotId === spot.id ? 'Hide reviews' : 'See all reviews'}</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedSpotId === spot.id ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {expandedSpotId === spot.id && (
                          <div className="space-y-2 pt-1">
                            {reviewsLoading[spot.id] && !reviewsBySpot[spot.id] ? (
                              <div className="py-2">
                                <Loading />
                              </div>
                            ) : (
                              <>
                                {(reviewsBySpot[spot.id] || spot.recent_reviews || []).map((review) => (
                                  <div key={review.id} className="py-2 text-xs">
                                    <div className="flex items-center justify-between text-content-secondary">
                                      <span className="font-medium">{formatObservedAt(review.observed_at)}</span>
                                      <SymbolLegend
                                        title={metricTooltipTitle('Quality', review.quality, QUALITY_BANDS)}
                                        className="inline-flex items-center gap-1 font-medium text-content-primary"
                                      >
                                        <Star className="h-3.5 w-3.5 text-amber-500" />
                                        {renderStars(review.quality, 'text-amber-500')}
                                      </SymbolLegend>
                                    </div>
                                    <div className="mt-1 grid grid-cols-2 gap-1 text-content-secondary">
                                      <SymbolLegend
                                        title={metricTooltipTitle('Crowd', review.crowded_level, CROWD_BANDS)}
                                        className="inline-flex items-center gap-1.5"
                                      >
                                        <Users className={cn('h-3.5 w-3.5', getCrowdColor(review.crowded_level).iconClassName)} />
                                        {renderMeter(review.crowded_level, 10, getCrowdColor(review.crowded_level).meterClassName)}
                                      </SymbolLegend>
                                      <SymbolLegend
                                        title={metricTooltipTitle('Wave height', review.wave_height_index, WAVE_BANDS)}
                                        className="inline-flex items-center gap-1.5"
                                      >
                                        <Waves className="h-3.5 w-3.5 text-cyan-500" />
                                        {renderMeter(review.wave_height_index, 10, 'bg-cyan-500')}
                                      </SymbolLegend>
                                      <SymbolLegend
                                        title={metricTooltipTitle('Board fit', review.short_long_index, BOARD_FIT_BANDS)}
                                        className="inline-flex items-center gap-1.5"
                                      >
                                        <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-500" />
                                        {renderMeter(review.short_long_index, 10, 'bg-emerald-500')}
                                      </SymbolLegend>
                                      <SymbolLegend
                                        title={metricTooltipTitle('Wind', review.wind_index, WIND_BANDS)}
                                        className="inline-flex items-center gap-1.5"
                                      >
                                        <Wind className={cn('h-3.5 w-3.5', getWindColor(review.wind_index).iconClassName)} />
                                        {renderMeter(review.wind_index, 10, getWindColor(review.wind_index).meterClassName)}
                                      </SymbolLegend>
                                    </div>
                                  </div>
                                ))}
                                {reviewsHasMore[spot.id] && (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => loadSpotReviews(spot.id, true)}
                                    disabled={!!reviewsLoading[spot.id]}
                                    className="w-full"
                                  >
                                    {reviewsLoading[spot.id] ? 'Loading...' : 'Load more reviews'}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <SpotMap 
              spots={spots} 
              className="h-[600px] w-full"
            />
          </Card>
        )}
      </MapProvider>
      </div>
    </TooltipProvider>
  );
};

export default SurfSpotsPage;

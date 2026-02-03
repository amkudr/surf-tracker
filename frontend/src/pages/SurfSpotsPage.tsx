import { useEffect, useState } from 'react';
import { spotsAPI } from '../services/api';
import { SpotResponse, SpotCreate } from '../types/api';
import { Plus, MapPin, Navigation, Hash, X, Save, LayoutGrid, Map as MapIcon, ExternalLink, Waves } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, EmptyState, Button, FormField, DifficultyBadges, CoordinatesBadge, SegmentedControl, SurfForecastWidget } from '../components/ui';
import { PageHero } from '../components/PageHero';
import { MapProvider } from '../components/MapProvider';
import { SpotMap } from '../components/SpotMap';

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

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const data = await spotsAPI.getAll();
      setSpots(data);
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
        difficulty: formData.difficulty?.sort((a, b) => a - b) || [],
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
        title="Surf Spots"
        subtitle="Discover and manage surf locations"
        actions={
          <div className="flex items-center space-x-4">
            <SegmentedControl
              options={[
                { value: 'grid', label: <LayoutGrid className="h-4 w-4" /> },
                { value: 'map', label: <MapIcon className="h-4 w-4" /> },
              ]}
              value={viewMode}
              onChange={(value) => setViewMode(value as 'grid' | 'map')}
            />
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                showForm
                  ? 'bg-content-secondary hover:bg-content-tertiary text-background'
                  : 'bg-accent hover:bg-accent-hover text-background'
              }`}
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add New Spot</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-body text-destructive">{error}</p>
        </div>
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
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter spot name"
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-background text-content-primary"
                />
              </FormField>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Latitude (optional)" icon={<Navigation className="h-4 w-4" />}>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    step="0.0001"
                    placeholder="-37.8136"
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-background text-content-primary"
                  />
                </FormField>

                <FormField label="Longitude (optional)" icon={<Navigation className="h-4 w-4" />}>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    step="0.0001"
                    placeholder="144.9631"
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-background text-content-primary"
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
                <input
                  type="text"
                  id="surf_forecast_name"
                  name="surf_forecast_name"
                  value={formData.surf_forecast_name}
                  onChange={handleChange}
                  placeholder="e.g., Bells Beach"
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-accent focus:border-accent transition-colors bg-background text-content-primary"
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
                <Card key={spot.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
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
                    <div className="flex items-center justify-between mb-3 min-h-[32px]">
                      <h3 className="text-h3 font-semibold text-content-primary truncate mr-2" title={spot.name}>
                        {spot.name}
                      </h3>
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
                        className="text-[10px] h-7 px-2 flex-shrink-0"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Maps
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <CoordinatesBadge
                        latitude={spot.latitude}
                        longitude={spot.longitude}
                        size="sm"
                      />

                      {spot.difficulty && spot.difficulty.length > 0 && (
                        <DifficultyBadges values={spot.difficulty} size="sm" />
                      )}
                    </div>

                    {/* Surf Forecast Widget */}
                    {spot.surf_forecast_name && (
                      <div className="mt-3">
                        <SurfForecastWidget spotName={spot.surf_forecast_name} />
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
  );
};

export default SurfSpotsPage;
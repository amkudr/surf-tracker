import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Card, Button, FormField, Input, Select, Textarea } from '../components/ui';
import { useSurfSessionForm } from '../hooks/useSurfSessionForm';

const SurfSessionFormPage = () => {
  const {
    formData,
    spots,
    isLoading,
    isLoadingData,
    error,
    isEditing,
    handleChange,
    handleSpotChange,
    handleSubmit,
    handleDelete,
  } = useSurfSessionForm();

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Back Navigation */}
      <Link
        to="/sessions"
        className="inline-flex items-center space-x-2 text-content-secondary hover:text-content-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-body">Back to Sessions</span>
      </Link>

      {/* Form Card */}
      <Card className="p-8">
        <div className="mb-8">
          <h1 className="text-h1 font-semibold text-content-primary">
            {isEditing ? 'Edit Session' : 'Add Session'}
          </h1>
          <p className="text-body text-content-secondary mt-1">
            {isEditing ? 'Update your session details' : 'Record a new surf session'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Session Date" required>
              <Input
                type="date"
                name="date"
                value={formData.datetime.slice(0, 10)}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Session Time" required>
              <Input
                type="time"
                name="time"
                value={formData.datetime.slice(11, 16)}
                onChange={handleChange}
                required
              />
            </FormField>
          </div>

          {/* Surf Spot */}
          <FormField label="Surf Spot" required>
            <Select
              name="spot_id"
              value={formData.spot_id || ''}
              onChange={handleSpotChange}
              required
            >
              <option value="">Select a surf spot...</option>
              {spots.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Duration and Wave Quality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Duration (minutes)" required>
              <Input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="1"
                max="1000"
                required
              />
            </FormField>

            <FormField label="Wave Quality (1-10)" required>
              <Input
                type="number"
                name="wave_quality"
                value={formData.wave_quality}
                onChange={handleChange}
                min="1"
                max="10"
                required
              />
            </FormField>
          </div>

          {/* Notes */}
          <FormField label="Notes" hint="How were the conditions? Any notable events?">
            <Textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="How were the conditions? Any notable events?"
              rows={4}
            />
          </FormField>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-body text-destructive">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Link to="/sessions" className="flex-1">
                 <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                  >
                    Cancel
                 </Button>
            </Link> 
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Session' : 'Save Session'}
                </>
              )}
            </Button>
          </div>

          {/* Delete Action for Edit Mode */}
          {isEditing && (
            <div className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Session
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default SurfSessionFormPage;
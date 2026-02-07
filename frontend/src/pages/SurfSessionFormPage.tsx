import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Card, Button, FormField, Input, Select, Textarea, Loading, Alert, AlertDescription } from '../components/ui';
import { useSurfSessionForm } from '../hooks/useSurfSessionForm';

const SurfSessionFormPage = () => {
  const {
    formData,
    dateForInput,
    timeForInput,
    spots,
    surfboards,
    isLoading,
    isLoadingData,
    error,
    isEditing,
    useTemporaryBoard,
    handleChange,
    handleSpotChange,
    handleSaveBoardToggle,
    handleSubmit,
    handleDelete,
  } = useSurfSessionForm();

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
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
                value={dateForInput}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Session Time" required>
              <Input
                type="time"
                name="time"
                value={timeForInput}
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
          
          {/* Surfboard selection / one-time entry */}
          <FormField label="Surfboard">
            <div className="space-y-3">
              <Select
                name="surfboard_id"
                value={useTemporaryBoard ? '__other__' : formData.surfboard_id || ''}
                onChange={handleChange}
              >
                <option value="">Select a surfboard...</option>
                <option value="__other__">Other surfboard</option>
                {surfboards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name || 'Board'} {board.brand ? `(${board.brand})` : ''} - {board.length_ft}'
                  </option>
                ))}
              </Select>

              <label className="flex items-center gap-2 text-sm text-content-secondary">
                {/* The \"Other surfboard\" select option controls temporary mode now */}
              </label>

              {useTemporaryBoard && (
                <div className="space-y-4 rounded-2xl border border-border bg-background-secondary/60 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[14px] font-medium text-content-primary">
                        Length (ft) <span className="text-destructive">*</span>
                      </span>
                      <Input
                        type="number"
                        name="surfboard_length_ft"
                        value={formData.surfboard_length_ft ?? ''}
                        onChange={handleChange}
                        placeholder="6.4"
                        step="0.1"
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[14px] font-medium text-content-primary">Board name</span>
                      <Input
                        name="surfboard_name"
                        value={formData.surfboard_name || ''}
                        onChange={handleChange}
                        placeholder="Foamy, Fish, etc."
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[14px] font-medium text-content-primary">Brand</span>
                      <Input
                        name="surfboard_brand"
                        value={formData.surfboard_brand || ''}
                        onChange={handleChange}
                        placeholder="Firewire"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[14px] font-medium text-content-primary">Model</span>
                      <Input
                        name="surfboard_model"
                        value={formData.surfboard_model || ''}
                        onChange={handleChange}
                        placeholder="Seaside"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[14px] font-medium text-content-primary">Width (in)</span>
                      <Input
                        type="number"
                        name="surfboard_width_in"
                        value={formData.surfboard_width_in ?? ''}
                        onChange={handleChange}
                        placeholder="20.25"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[14px] font-medium text-content-primary">Thickness (in)</span>
                      <Input
                        type="number"
                        name="surfboard_thickness_in"
                        value={formData.surfboard_thickness_in ?? ''}
                        onChange={handleChange}
                        placeholder="2.5"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[14px] font-medium text-content-primary">Volume (L)</span>
                      <Input
                        type="number"
                        name="surfboard_volume_liters"
                        value={formData.surfboard_volume_liters ?? ''}
                        onChange={handleChange}
                        placeholder="35.0"
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div className="h-full flex items-center justify-center">
                      <label className="inline-flex items-center gap-2 text-sm text-content-secondary">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-accent"
                          checked={!!formData.save_surfboard_to_quiver}
                          onChange={(e) => handleSaveBoardToggle(e.target.checked)}
                        />
                        <span>Add to my surfboards</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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

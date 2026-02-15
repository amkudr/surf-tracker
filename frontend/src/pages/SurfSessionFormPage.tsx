import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Card, Button, FormField, Input, Select, Textarea, Loading, Alert, AlertDescription } from '../components/ui';
import { useSurfSessionForm } from '../hooks/useSurfSessionForm';
import { cn } from '../utils/cn';

interface SliderDescriptor {
  min: number;
  max: number;
  label: string;
  textClassName?: string;
}

const ACTIVE_DESCRIPTOR_BADGE_CLASS =
  'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold';

interface ReviewSliderFieldProps {
  label: string;
  name: string;
  value: number | undefined;
  min: number;
  max: number;
  hint?: string;
  lowLabel?: string;
  highLabel?: string;
  accentColor?: string;
  descriptors?: SliderDescriptor[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ReviewSliderField = ({
  label,
  name,
  value,
  min,
  max,
  hint,
  lowLabel,
  highLabel,
  accentColor = '#0071e3',
  descriptors,
  onChange,
}: ReviewSliderFieldProps) => {
  const safeValue = value ?? Math.round((min + max) / 2);
  const fillPercent = Math.max(0, Math.min(100, ((safeValue - min) / (max - min || 1)) * 100));
  const activeDescriptor = descriptors?.find((descriptor) => safeValue >= descriptor.min && safeValue <= descriptor.max);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-[14px] font-medium text-content-primary">{label}</p>
        {hint && <p className="text-[11px] text-content-secondary mt-0.5">{hint}</p>}
      </div>

      <input
        type="range"
        name={name}
        value={safeValue}
        min={min}
        max={max}
        step={1}
        onChange={onChange}
        className="review-slider w-full"
        style={
          {
            '--slider-color': accentColor,
            '--slider-fill': `${fillPercent}%`,
          } as React.CSSProperties
        }
      />
      <div className="grid grid-cols-3 items-center text-[11px] text-content-secondary">
        <span className="justify-self-start">{lowLabel ?? min}</span>
        {activeDescriptor ? (
          <span
            className={cn(
              ACTIVE_DESCRIPTOR_BADGE_CLASS,
              'justify-self-center text-center',
              activeDescriptor.textClassName ?? 'text-content-primary'
            )}
          >
            {activeDescriptor.label}
          </span>
        ) : (
          <span className={cn(ACTIVE_DESCRIPTOR_BADGE_CLASS, 'justify-self-center text-center text-content-primary')}>{safeValue}</span>
        )}
        <span className="justify-self-end text-right">{highLabel ?? max}</span>
      </div>
    </div>
  );
};

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
    isReviewEnabled,
    handleChange,
    handleSpotChange,
    handleSaveBoardToggle,
    handleReviewToggle,
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

          {/* Duration */}
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
          </div>

          <div className="space-y-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-body font-medium text-content-primary">
              <span>Session review</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={isReviewEnabled}
                onChange={(e) => handleReviewToggle(e.target.checked)}
              />
            </label>

            {isReviewEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 rounded-2xl border border-border bg-background-secondary/60 p-4">
                  <ReviewSliderField
                    label="Quality"
                    name="quality"
                    value={formData.review?.quality}
                    min={0}
                    max={10}
                    lowLabel="Poor"
                    highLabel="Excellent"
                    accentColor="#f59e0b"
                    descriptors={[
                      { min: 0, max: 1, label: 'Flat', textClassName: 'text-rose-700' },
                      { min: 2, max: 3, label: 'Weak', textClassName: 'text-orange-700' },
                      { min: 4, max: 5, label: 'Average', textClassName: 'text-amber-700' },
                      { min: 6, max: 7, label: 'Good', textClassName: 'text-lime-700' },
                      { min: 8, max: 10, label: 'Epic', textClassName: 'text-emerald-700' },
                    ]}
                    onChange={handleChange}
                  />
                  <ReviewSliderField
                    label="Crowded level"
                    name="crowded_level"
                    value={formData.review?.crowded_level}
                    min={0}
                    max={10}
                    lowLabel="Empty"
                    highLabel="Packed"
                    accentColor="#0ea5e9"
                    descriptors={[
                      { min: 0, max: 1, label: 'Empty', textClassName: 'text-emerald-700' },
                      { min: 2, max: 3, label: 'Quiet', textClassName: 'text-lime-700' },
                      { min: 4, max: 5, label: 'Busy', textClassName: 'text-amber-700' },
                      { min: 6, max: 7, label: 'Crowded', textClassName: 'text-orange-700' },
                      { min: 8, max: 10, label: 'Packed', textClassName: 'text-rose-700' },
                    ]}
                    onChange={handleChange}
                  />
                  <ReviewSliderField
                    label="Wave height"
                    name="wave_height_index"
                    value={formData.review?.wave_height_index}
                    min={0}
                    max={10}
                    lowLabel="Small"
                    highLabel="Big"
                    accentColor="#06b6d4"
                    descriptors={[
                      { min: 0, max: 1, label: 'Glassy', textClassName: 'text-cyan-700' },
                      { min: 2, max: 3, label: 'Choppy', textClassName: 'text-sky-700' },
                      { min: 4, max: 5, label: 'Shoulder', textClassName: 'text-blue-700' },
                      { min: 6, max: 7, label: 'Overhead', textClassName: 'text-indigo-700' },
                      { min: 8, max: 10, label: 'Heavy', textClassName: 'text-violet-700' },
                    ]}
                    onChange={handleChange}
                  />
                  <ReviewSliderField
                    label="Board fit"
                    name="short_long_index"
                    value={formData.review?.short_long_index}
                    min={0}
                    max={10}
                    lowLabel="Shortboard"
                    highLabel="Longboard"
                    accentColor="#10b981"
                    descriptors={[
                      { min: 0, max: 1, label: 'Only Short', textClassName: 'text-emerald-700' },
                      { min: 2, max: 3, label: 'Better Short', textClassName: 'text-teal-700' },
                      { min: 4, max: 6, label: 'Neutral', textClassName: 'text-slate-700' },
                      { min: 7, max: 8, label: 'Better Long', textClassName: 'text-sky-700' },
                      { min: 9, max: 10, label: 'Only Long', textClassName: 'text-blue-700' },
                    ]}
                    onChange={handleChange}
                  />
                  <ReviewSliderField
                    label="Wind"
                    name="wind_index"
                    value={formData.review?.wind_index}
                    min={0}
                    max={10}
                    lowLabel="Calm"
                    highLabel="Strong"
                    accentColor="#f97316"
                    descriptors={[
                      { min: 0, max: 1, label: 'Glassy', textClassName: 'text-emerald-700' },
                      { min: 2, max: 3, label: 'Light', textClassName: 'text-lime-700' },
                      { min: 4, max: 5, label: 'Breezy', textClassName: 'text-amber-700' },
                      { min: 6, max: 7, label: 'Windy', textClassName: 'text-orange-700' },
                      { min: 8, max: 10, label: 'Stormy', textClassName: 'text-rose-700' },
                    ]}
                    onChange={handleChange}
                  />
              </div>
            )}
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

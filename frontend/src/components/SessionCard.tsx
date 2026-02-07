import { useId, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { SurfSessionResponse } from '../types/api';
import { Calendar, ChevronDown, Clock, Edit, Trash2 } from 'lucide-react';
import {
  formatDurationClean,
  formatWaveQuality,
  formatSessionDate,
  formatSessionTime,
  formatWaveHeightClean,
  formatWindSpeedClean,
} from '../utils/stats';
import { compassLetterToDegrees } from '../utils/compass';
import { DirectionCompass } from './DirectionCompass';

interface SessionCardProps {
  session: SurfSessionResponse;
  onDelete: (id: number) => void;
}

function SessionCardComponent({ session, onDelete }: SessionCardProps) {
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const forecastPanelId = useId();
  const notesPanelId = useId();
  const formattedDate = formatSessionDate(session.datetime);
  const formattedTime = formatSessionTime(session.datetime, session.duration_minutes);
  const durationLabel = `${formatDurationClean(session.duration_minutes)} min`;
  const qualityLabel = formatWaveQuality(session.wave_quality);
  const waveHeightLabel = session.wave_height_m != null ? `${formatWaveHeightClean(session.wave_height_m)} m` : '—';
  const wavePeriodLabel = session.wave_period != null ? session.wave_period.toFixed(1) : '—';
  const windSpeedLabel = session.wind_speed_kmh != null ? `${formatWindSpeedClean(session.wind_speed_kmh)} km/h` : '—';
  const energyLabel = session.energy != null ? `${session.energy.toFixed(1)} kJ` : '—';
  const ratingLabel = session.rating != null ? session.rating : '—';
  const tideLabel = session.tide_height_m != null ? session.tide_height_m : '—';
  const tideRangeLabel =
    session.tide_low_m != null || session.tide_high_m != null
      ? `(${session.tide_low_m ?? '?'}-${session.tide_high_m ?? '?'})`
      : null;
  const hasWaveHeight = session.wave_height_m != null;
  const hasWavePeriod = session.wave_period != null;
  const hasWaveEnergy = session.energy != null;
  const hasWaveDir = session.wave_dir != null && `${session.wave_dir}`.trim() !== '';
  const hasWaveData = hasWaveHeight || hasWavePeriod || hasWaveEnergy || hasWaveDir;
  const hasWindSpeed = session.wind_speed_kmh != null;
  const hasWindDir = session.wind_dir != null && `${session.wind_dir}`.trim() !== '';
  const hasWindData = hasWindSpeed || hasWindDir;
  const hasForecastData = hasWaveData || hasWindData;
  const surfboardLabel = session.surfboard
    ? `${session.surfboard.name || 'Board'} · ${session.surfboard.length_ft}'`
    : session.surfboard_name
      ? `${session.surfboard_name}${session.surfboard_length_ft ? ` · ${session.surfboard_length_ft}'` : ''}`
      : null;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header: Spot name + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-content-primary leading-snug">{session.spot.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-content-secondary">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background-secondary px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background-secondary px-2.5 py-1">
              <Clock className="h-3.5 w-3.5" />
              {formattedTime}
            </span>
            {surfboardLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 font-medium text-accent">
                {surfboardLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            to={`/sessions/${session.id}/edit`}
            className="p-1.5 rounded-lg text-content-secondary hover:text-accent hover:bg-background-secondary transition-colors"
            title="Edit session"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(session.id)}
            className="p-1.5 rounded-lg text-content-secondary hover:text-destructive hover:bg-background-secondary transition-colors"
            title="Delete session"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/60 bg-background-secondary/40 px-3 py-2">
          <span className="block text-[11px] uppercase tracking-wide text-content-tertiary">Duration</span>
          <span className="text-sm font-semibold text-content-primary">{durationLabel}</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-background-secondary/40 px-3 py-2">
          <span className="block text-[11px] uppercase tracking-wide text-content-tertiary">Quality</span>
          <span className="text-sm font-semibold text-content-primary">{qualityLabel}</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-background-secondary/40 px-3 py-2">
          <span className="block text-[11px] uppercase tracking-wide text-content-tertiary">Rating</span>
          <span className="text-sm font-semibold text-content-primary">{ratingLabel}</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-background-secondary/40 px-3 py-2">
          <span className="block text-[11px] uppercase tracking-wide text-content-tertiary">Tide</span>
          <span className="text-sm font-semibold text-content-primary">
            {tideLabel}
            {tideRangeLabel && (
              <span className="text-[11px] text-content-secondary ml-1 font-normal">
                {tideRangeLabel}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Forecast details (expandable) */}
      {hasForecastData && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsForecastOpen((open) => !open)}
            className="w-full flex items-center justify-between rounded-lg border border-border/60 bg-background-secondary/40 px-3 py-2 text-left"
            aria-expanded={isForecastOpen}
            aria-controls={forecastPanelId}
          >
            <span className="block text-sm font-semibold text-content-primary">Wave &amp; wind details</span>
            <ChevronDown
              className={`h-4 w-4 text-content-secondary transition-transform ${isForecastOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isForecastOpen && (
            <div id={forecastPanelId} className="space-y-2">
              {hasWaveData && (
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background-secondary/40 px-3 py-2">
                  {hasWaveDir && (
                    <DirectionCompass deg={compassLetterToDegrees(session.wave_dir)} type="wave" size={32} />
                  )}
                  <div className="space-y-0.5">
                    <span className="block text-[11px] uppercase tracking-wide text-content-tertiary">Wave</span>
                    {hasWaveHeight && (
                      <span className="block text-sm font-semibold text-content-primary">{waveHeightLabel}</span>
                    )}
                    {hasWavePeriod && (
                      <span className="block text-xs text-content-secondary">Period {wavePeriodLabel}</span>
                    )}
                    {hasWaveEnergy && (
                      <span className="block text-xs text-content-secondary">Energy {energyLabel}</span>
                    )}
                  </div>
                </div>
              )}
              {hasWindData && (
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background-secondary/40 px-3 py-2">
                  {hasWindDir && (
                    <DirectionCompass deg={compassLetterToDegrees(session.wind_dir)} type="wind" size={32} />
                  )}
                  <div className="space-y-0.5">
                    <span className="block text-[11px] uppercase tracking-wide text-content-tertiary">Wind</span>
                    {hasWindSpeed && (
                      <span className="block text-sm font-semibold text-content-primary">{windSpeedLabel}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes section */}
      {session.notes && (
        <div className="space-y-2 pt-1 border-t border-border">
          <button
            type="button"
            onClick={() => setIsNotesOpen((open) => !open)}
            className="w-full flex items-center justify-between rounded-lg border border-border/60 bg-background-secondary/40 px-3 py-2 text-left"
            aria-expanded={isNotesOpen}
            aria-controls={notesPanelId}
          >
            <span className="block text-sm font-semibold text-content-primary">Notes</span>
            <ChevronDown
              className={`h-4 w-4 text-content-secondary transition-transform ${isNotesOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isNotesOpen && (
            <p id={notesPanelId} className="text-sm text-content-secondary px-3 pb-1">
              {session.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const SessionCard = memo(SessionCardComponent);

export { SessionCard };

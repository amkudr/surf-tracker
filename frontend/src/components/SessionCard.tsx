import { Link } from 'react-router-dom';
import { SurfSessionResponse } from '../types/api';
import { Calendar, Clock, Timer, Waves, Edit, Trash2 } from 'lucide-react';
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

export function SessionCard({ session, onDelete }: SessionCardProps) {
  return (
    <div className="p-6 space-y-4">
      {/* Header: Spot name with actions */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold text-content-primary">
          {session.spot.name}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            to={`/sessions/${session.id}/edit`}
            className="p-2 rounded-lg text-content-secondary hover:text-accent hover:bg-gray-100 transition-colors"
            title="Edit session"
          >
            <Edit className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(session.id)}
            className="p-2 rounded-lg text-content-secondary hover:text-destructive hover:bg-gray-100 transition-colors"
            title="Delete session"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Date and Time */}
      <div className="flex items-center gap-6 text-base text-content-secondary">
        <span className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formatSessionDate(session.datetime)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {formatSessionTime(session.datetime)}
        </span>
      </div>

      {/* Duration and Quality */}
      <div className="flex items-center gap-6 text-base">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-content-tertiary" />
          <span>{formatDurationClean(session.duration_minutes)} min</span>
        </div>
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-content-tertiary" />
          <span>{formatWaveQuality(session.wave_quality)}</span>
        </div>
      </div>

      {/* Wave and Wind metrics with compasses */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        {/* Wave row */}
        <div className="flex items-center text-base">
          <div className="flex items-center gap-3">
            <span className="font-medium text-content-secondary">Wave</span>
            <span className="font-medium">{formatWaveHeightClean(session.wave_height_m)} m</span>
          </div>
          <div className="ml-3">
            <DirectionCompass deg={compassLetterToDegrees(session.wave_dir)} type="wave" size={40} />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-medium text-content-secondary">Period</span>
            <span className="font-medium">
              {session.wave_period != null ? session.wave_period.toFixed(1) : '—'}
            </span>
          </div>
        </div>

        {/* Wind row */}
        <div className="flex items-center text-base">
          <div className="flex items-center gap-3">
            <span className="font-medium text-content-secondary">Wind</span>
            <span className="font-medium">{formatWindSpeedClean(session.wind_speed_kmh)} km/h</span>
          </div>
          <div className="ml-3">
            <DirectionCompass deg={compassLetterToDegrees(session.wind_dir)} type="wind" size={40} />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-medium text-content-secondary">Energy</span>
            <span className="font-medium">
              {session.energy != null ? `${session.energy.toFixed(1)} kJ` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 text-base">
        <span className="font-medium text-content-secondary">Rating</span>
        <span className="font-medium">{session.rating != null ? session.rating : '—'}</span>
      </div>

      {/* Notes section */}
      {session.notes && (
        <p className="text-sm text-content-secondary line-clamp-2 pt-4 border-t border-gray-200">
          {session.notes}
        </p>
      )}
    </div>
  );
}

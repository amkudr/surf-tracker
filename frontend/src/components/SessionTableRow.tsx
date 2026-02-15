import { Link } from 'react-router-dom';
import { SurfSessionResponse } from '../types/api';
import { Edit, Trash2 } from 'lucide-react';
import {
  formatDurationClean,
  formatWaveQuality,
  formatSessionDateTable,
  formatWaveHeightClean,
  formatWindSpeedClean,
} from '../utils/stats';
import { compassLetterToDegrees } from '../utils/compass';
import { DirectionCompass } from './DirectionCompass';
import { addMinutes, format, parseISO } from 'date-fns';

interface SessionTableRowProps {
  session: SurfSessionResponse;
  onDelete: (id: number) => void;
}

const cellBase = 'px-1.5 py-3 text-sm text-content-primary border-b border-border text-center last:pr-2 tabular-nums';

export function SessionTableRow({ session, onDelete }: SessionTableRowProps) {
  const { dateLine, yearLine } = formatSessionDateTable(session.datetime);
  const startDate = parseISO(session.datetime);
  const startTime = format(startDate, 'HH:mm');
  const endTime = Number.isFinite(session.duration_minutes)
    ? format(addMinutes(startDate, session.duration_minutes), 'HH:mm')
    : null;

  let boardTooltip: string | undefined;
  if (session.surfboard) {
    const { name, brand, model, width_in, thickness_in, volume_liters, length_ft } = session.surfboard;
    const details = [
      name || `${length_ft}' board`,
      brand,
      model,
      `${length_ft}'`,
      width_in ? `${width_in} in wide` : null,
      thickness_in ? `${thickness_in} in thick` : null,
      volume_liters ? `${volume_liters} L` : null,
    ].filter(Boolean);
    boardTooltip = details.length ? details.join(' • ') : 'Surfboard details';
  } else if (session.surfboard_name || session.surfboard_length_ft) {
    const details = [
      session.surfboard_name,
      session.surfboard_brand,
      session.surfboard_model,
      session.surfboard_length_ft ? `${session.surfboard_length_ft}'` : null,
      session.surfboard_width_in ? `${session.surfboard_width_in} in wide` : null,
      session.surfboard_thickness_in ? `${session.surfboard_thickness_in} in thick` : null,
      session.surfboard_volume_liters ? `${session.surfboard_volume_liters} L` : null,
    ].filter(Boolean);
    boardTooltip = details.length ? details.join(' • ') : undefined;
  }
  const boardLength = session.surfboard
    ? `${session.surfboard.length_ft}'`
    : session.surfboard_length_ft
      ? `${session.surfboard_length_ft}'`
      : '—';

  return (
    <tr className="even:bg-background-secondary hover:bg-background-tertiary transition-colors">
      <td className={cellBase}>
        <span className="block">{dateLine}</span>
        <span className="block text-content-secondary">{yearLine}</span>
      </td>
      <td className={`${cellBase} leading-tight`}>
        <span className="block">{startTime}</span>
        {endTime && <span className="block text-content-secondary">{endTime}</span>}
      </td>
      <td className={`${cellBase} font-medium overflow-hidden text-center align-middle`}>
        <span className="block truncate whitespace-nowrap" title={session.spot.name}>
          {session.spot.name}
        </span>
      </td>
      <td className={cellBase} title={boardTooltip} aria-label={boardTooltip}>
        <span className="block font-medium">{boardLength}</span>
      </td>
      <td className={cellBase}>{formatDurationClean(session.duration_minutes)}</td>
      <td className={cellBase}>{formatWaveQuality(session.review?.quality)}</td>
      <td className={cellBase}>{formatWaveHeightClean(session.wave_height_m)}</td>
      <td className={cellBase}>
        {session.wave_period != null ? session.wave_period.toFixed(1) : '—'}
      </td>
      <td className={cellBase}>
        <div className="flex justify-center">
          <DirectionCompass deg={compassLetterToDegrees(session.wave_dir)} type="wave" size={40} />
        </div>
      </td>
      <td className={cellBase}>{formatWindSpeedClean(session.wind_speed_kmh)}</td>
      <td className={cellBase}>
        <div className="flex justify-center">
          <DirectionCompass deg={compassLetterToDegrees(session.wind_dir)} type="wind" size={40} />
        </div>
      </td>
      <td className={cellBase}>
        {session.energy != null ? session.energy.toFixed(1) : '—'}
      </td>
      <td className={cellBase}>{session.rating != null ? session.rating : '—'}</td>
      <td className={cellBase}>
        {session.tide_height_m != null ? (
          <div className="flex flex-col items-center">
            <span className="font-medium">{session.tide_height_m}</span>
            {(session.tide_low_m != null || session.tide_high_m != null) && (
              <span className="text-[10px] text-content-secondary mt-0.5">
                {session.tide_low_m != null ? session.tide_low_m : '?'} - {session.tide_high_m != null ? session.tide_high_m : '?'}
              </span>
            )}
          </div>
        ) : (
          '—'
        )}
      </td>
      <td className={cellBase}>
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onDelete(session.id)}
            className="inline-flex p-2 rounded-lg text-content-secondary hover:text-destructive hover:bg-background-secondary transition-colors focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            title="Delete session"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <Link
            to={`/sessions/${session.id}/edit`}
            className="inline-flex p-2 rounded-lg text-content-secondary hover:text-accent hover:bg-background-secondary transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            title="Edit session"
          >
            <Edit className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

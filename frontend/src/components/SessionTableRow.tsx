import { Link } from 'react-router-dom';
import { SurfSessionResponse } from '../types/api';
import { Edit } from 'lucide-react';
import {
  formatDurationClean,
  formatWaveQuality,
  formatSessionDateTable,
  formatSessionTime,
  formatWaveHeightClean,
  formatWindSpeedClean,
} from '../utils/stats';
import { compassLetterToDegrees } from '../utils/compass';
import { DirectionCompass } from './DirectionCompass';

interface SessionTableRowProps {
  session: SurfSessionResponse;
  onDelete: (id: number) => void;
}

const cellBase = 'px-2 py-3 text-sm text-content-primary border-b border-gray-200 text-center last:pr-2';

export function SessionTableRow({ session, onDelete }: SessionTableRowProps) {
  const { dateLine, yearLine } = formatSessionDateTable(session.datetime);
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className={cellBase}>
        <span className="block">{dateLine}</span>
        <span className="block text-content-secondary">{yearLine}</span>
      </td>
      <td className={cellBase}>{formatSessionTime(session.datetime)}</td>
      <td className={`${cellBase} font-medium`}>{session.spot.name}</td>
      <td className={cellBase}>{formatDurationClean(session.duration_minutes)}</td>
      <td className={cellBase}>{formatWaveQuality(session.wave_quality)}</td>
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
        <Link
          to={`/sessions/${session.id}/edit`}
          className="inline-flex p-2 rounded-lg text-content-secondary hover:text-accent hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          title="Edit session"
        >
          <Edit className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

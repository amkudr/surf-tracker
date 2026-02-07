import { Link } from 'react-router-dom';
import { SurfSessionResponse } from '../types/api';
import { SessionTableRow } from './SessionTableRow';
import { SessionCard } from './SessionCard';
import { EmptyState } from './ui';
import { Waves } from 'lucide-react';

interface SessionsTableProps {
  sessions: SurfSessionResponse[];
  onDelete: (id: number) => void;
  emptyMessage?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
}

const TABLE_HEADERS: { label: string; unit?: string; key: string; width?: string; className?: string }[] = [
  { label: 'Date', key: 'date' },
  { label: 'Time', key: 'time' },
  { label: 'Spot', key: 'spot' },
  { label: 'Board', key: 'board' },
  { label: 'Duration', unit: 'min', key: 'duration' },
  { label: 'Quality', key: 'quality' },
  { label: 'Wave', unit: 'm', key: 'wave' },
  { label: 'Period', key: 'period' },
  { label: 'Wave dir', key: 'waveDir' },
  { label: 'Wind', unit: 'km/h', key: 'wind' },
  { label: 'Wind dir', key: 'windDir' },
  { label: 'Energy', unit: 'kJ', key: 'energy' },
  { label: 'Rating', key: 'rating' },
  { label: 'Tide', unit: 'm', key: 'tide' },
  { label: '', key: 'actions', width: '48px' },
];

export function SessionsTable({
  sessions,
  onDelete,
  emptyMessage = 'No sessions yet.',
  emptyActionHref,
  emptyActionLabel,
}: SessionsTableProps) {
  const isEmpty = sessions.length === 0;

  return (
    <div className="min-h-[200px] w-full">
      {/* Mobile: card list or empty state */}
      <div className="md:hidden">
        {isEmpty ? (
          <div className="p-6">
            <EmptyState
              icon={<Waves className="h-12 w-12" />}
              title="No surf sessions yet"
              description={emptyMessage}
              action={
                emptyActionHref && emptyActionLabel
                  ? { label: emptyActionLabel, onClick: () => (window.location.href = emptyActionHref) }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: semantic table — auto layout with balanced spacing */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full min-w-[980px] border-collapse table-auto">
          <colgroup>
            {TABLE_HEADERS.map(({ key }) => {
              if (key === 'spot') return <col key={key} style={{ width: '14%' }} />;
              if (key === 'actions') return <col key={key} style={{ width: '48px' }} />;
              return <col key={key} />;
            })}
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-background-secondary">
              {TABLE_HEADERS.map(({ label, unit, key, className }) => (
                <th
                  key={key}
                  className={`px-1.5 py-3 text-xs font-semibold text-content-secondary uppercase tracking-wider align-top ${
                    className || 'text-center'
                  }`}
                >
                  <span className="block whitespace-nowrap">{label}</span>
                  {unit && (
                    <span className="block text-[10px] font-normal normal-case text-content-tertiary mt-0.5">
                      {unit}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-4 py-12 text-center text-content-secondary">
                  {emptyMessage}
                  {emptyActionHref && emptyActionLabel && (
                    <span className="block mt-2">
                      <Link to={emptyActionHref} className="text-accent hover:underline">
                        {emptyActionLabel}
                      </Link>
                    </span>
                  )}
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <SessionTableRow key={session.id} session={session} onDelete={onDelete} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

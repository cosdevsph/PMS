import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Calendar, Clock, Loader2, MapPin } from 'lucide-react';
import type { ScheduleImpact } from '../../../types/staff.types';
import { formatTime } from './practitionerSchedule';

interface Props {
  impact: ScheduleImpact | null;
  /** True while the confirmed save is running. */
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "Mon, Nov 16, 2026" from an ISO date, read as a local date so the day never shifts. */
const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Shown when new working hours (or a removed clinic) would leave upcoming appointments outside the
 * practitioner's hours. Nothing has been saved yet. "Save anyway" saves the hours and leaves every
 * appointment exactly as it is; the clinic reschedules them by hand.
 */
export const ScheduleImpactDialog: React.FC<Props> = ({ impact, busy, onConfirm, onCancel }) => {
  const goBackRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!impact) return undefined;
    goBackRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [impact, busy, onCancel]);

  if (!impact) return null;
  const shown = impact.affected_appointments;
  const more = impact.affected_count - shown.length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="schedule-impact-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-amber-50">
          <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full">
            <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
          </div>
          <div>
            <h2 id="schedule-impact-title" className="text-lg font-bold text-gray-900">Upcoming appointments affected</h2>
            <p className="text-sm text-gray-600">These hours have not been saved yet</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">
            {impact.detail || `${impact.affected_count} upcoming appointments would fall outside the new working hours.`}
          </p>

          <ul className="max-h-56 overflow-y-auto space-y-2">
            {shown.map((a) => (
              <li key={a.id} className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs text-gray-700 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />{formatDate(a.date)}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />{formatTime(a.start_time)} – {formatTime(a.end_time)}
                </p>
                {a.branch_name && (
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />{a.branch_name}</p>
                )}
              </li>
            ))}
            {more > 0 && <li className="text-xs text-gray-500 px-1">…and {more} more.</li>}
          </ul>

          <p className="text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
            Saving does not cancel, move or change these appointments. Reschedule them in the Diary afterwards.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {busy ? 'Saving…' : 'Save anyway'}
          </button>
          <button
            ref={goBackRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

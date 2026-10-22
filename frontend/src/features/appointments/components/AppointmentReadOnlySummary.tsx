import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import type { Appointment } from '@/types';

interface Props {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

const formatTime = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return format(new Date(2000, 0, 1, h, m), 'h:mm a');
};

/**
 * What a user sees when they open an appointment in a branch they only have View access to
 * (another branch's Diary). Details only: no status changes, billing, notes or patient profile.
 */
export const AppointmentReadOnlySummary: React.FC<Props> = ({ isOpen, appointment, onClose }) => {
  if (!isOpen || !appointment) return null;

  const rows: Array<[string, string]> = [
    ['Patient', appointment.patient_name],
    ['Service', appointment.service_name ?? '—'],
    ['Practitioner', appointment.practitioner_name ?? '—'],
    ['Branch', appointment.clinic_name ?? '—'],
    ['Date', format(new Date(`${appointment.date}T00:00:00`), 'EEEE, MMMM d, yyyy')],
    ['Time', `${formatTime(appointment.start_time)} – ${formatTime(appointment.end_time)}`],
    ['Status', appointment.status.replace(/_/g, ' ').toLowerCase()],
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="appt-readonly-title"
          className="w-full max-w-md bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 id="appt-readonly-title" className="text-base font-semibold text-gray-900">Appointment</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <dl className="px-5 py-4 space-y-2.5 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex gap-4">
                <dt className="w-28 shrink-0 text-gray-500">{label}</dt>
                <dd className="text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="px-5 pb-4 text-xs text-gray-500">
            View only. You can see this branch&apos;s Diary but cannot change it. Ask the clinic owner for edit access.
          </p>
        </div>
      </div>
    </>
  );
};

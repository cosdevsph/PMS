import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, CheckCircle2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import type { Appointment } from '@/types';
import { getAppointment } from '../appointment.api';
import {
  assignAppointmentToPackage,
  canManagePrivatePackages,
  getPrivatePackages,
  privatePackageErrorMessage,
  unassignAppointmentFromPackage,
} from '@/features/patients/privatePackages.api';

interface AppointmentPrivatePackageCardProps {
  appointment: Appointment;
  /** True once the appointment has an invoice (assignment is then locked). */
  hasInvoice: boolean;
  /** Receives the refreshed appointment after an assign / remove. */
  onChanged: (updated: Appointment) => void;
}

/**
 * Explicit, staff-controlled link between an appointment and one of the patient's
 * Private Package Sessions (decision D1). Nothing here happens automatically.
 */
export const AppointmentPrivatePackageCard: React.FC<AppointmentPrivatePackageCardProps> = ({
  appointment,
  hasInvoice,
  onChanged,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const canManage = canManagePrivatePackages(user);
  const [selectedPackage, setSelectedPackage] = useState<string>('');

  const isAssigned = !!appointment.private_package_id;
  const isCancelled = appointment.status === 'CANCELLED';

  const { data: packages = [] } = useQuery({
    queryKey: ['private-packages', appointment.patient],
    queryFn: () => getPrivatePackages(appointment.patient),
    enabled: !isAssigned,
  });

  const activePackages = packages.filter((p) => p.status === 'ACTIVE');
  const eligible = activePackages.filter((p) =>
    p.items.some((i) => i.service === appointment.service && i.remaining > 0),
  );

  const refresh = async () => {
    const updated = await getAppointment(appointment.id);
    onChanged(updated);
    queryClient.invalidateQueries({ queryKey: ['private-packages', appointment.patient] });
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['diary-appointments'] });
  };

  const assign = useMutation({
    mutationFn: () => assignAppointmentToPackage(Number(selectedPackage), appointment.id),
    onSuccess: async () => {
      toast.success('Appointment added to the Private Package Session');
      setSelectedPackage('');
      await refresh();
    },
    onError: (err) => toast.error(privatePackageErrorMessage(err, 'Could not add the appointment to the package.')),
  });

  const unassign = useMutation({
    mutationFn: () => unassignAppointmentFromPackage(appointment.private_package_id as number, appointment.id),
    onSuccess: async () => {
      toast.success('Appointment removed from the package');
      await refresh();
    },
    onError: (err) => toast.error(privatePackageErrorMessage(err, 'Could not remove the appointment from the package.')),
  });

  // Already part of a package
  if (isAssigned) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-900">Covered by a Private Package Session</p>
              <p className="text-xs text-emerald-800 truncate">{appointment.private_package_title}</p>
              <p className="text-xs text-emerald-700 mt-0.5">This appointment has no service charge.</p>
            </div>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Remove this appointment from the package? The session returns to the package.')) {
                  unassign.mutate();
                }
              }}
              disabled={hasInvoice || unassign.isPending}
              title={hasInvoice ? 'This appointment already has an invoice' : undefined}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {unassign.isPending ? 'Removing…' : 'Remove from package'}
            </button>
          )}
        </div>
        {hasInvoice && (
          <p className="mt-2 text-xs text-emerald-700 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            An invoice exists for this appointment, so the package assignment can no longer be removed.
          </p>
        )}
      </div>
    );
  }

  // Not assigned: only show the card when it could be useful
  if (isCancelled || activePackages.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-sky-600" />
        <p className="text-sm font-semibold text-gray-900">Private Package Session</p>
      </div>

      {hasInvoice ? (
        <p className="text-xs text-gray-500 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          This appointment already has an invoice and can no longer be added to a package.
        </p>
      ) : !canManage ? (
        <p className="text-xs text-gray-500">This patient has an active package. Ask a practitioner or staff member to assign it.</p>
      ) : eligible.length === 0 ? (
        <p className="text-xs text-gray-500">
          None of this patient's active packages has a session left for {appointment.service_name || 'this service'}.
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            aria-label="Private Package Session"
          >
            <option value="">Not part of a package</option>
            {eligible.map((p) => {
              const item = p.items.find((i) => i.service === appointment.service);
              return (
                <option key={p.id} value={p.id}>
                  {p.title} — {item?.remaining} session{item?.remaining === 1 ? '' : 's'} left for {item?.service_name}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={() => assign.mutate()}
            disabled={!selectedPackage || assign.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assign.isPending ? 'Adding…' : 'Add to package'}
          </button>
        </div>
      )}
      <p className="mt-2 text-xs text-gray-400">
        Nothing is applied automatically. Adding this appointment uses one session and removes its service charge.
      </p>
    </div>
  );
};

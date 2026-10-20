import React, { useMemo, useState } from 'react';
import { X, Package, Plus, Trash2, CalendarPlus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useAppointmentServices } from '@/features/appointments/hooks/useAppointmentServices';
import { usePractitioners } from '@/features/clinics/hooks/usePractitioners';
import { createAppointment } from '@/features/appointments/appointment.api';
import { createPatientCase } from '../patientCases.api';
import type { PatientCase } from '@/types/patient';
import {
  assignAppointmentToPackage,
  createPrivatePackage,
  privatePackageErrorMessage,
  updatePrivatePackage,
} from '../privatePackages.api';
import type { PrivatePackage, PrivatePackageStatus } from '../privatePackages.api';

interface ServiceRow {
  key: string;
  /** Present for rows that already exist on the package (edit mode). */
  itemId?: number;
  service: number | '';
  quantity: number | '';
  used: number;
  // Optional appointment scheduled together with the package (create mode only)
  schedule: boolean;
  date: string;
  time: string;
  practitioner: string;
  caseChoice: string; // '' | 'NEW' | existing case id
  newCaseTitle: string;
}

interface PrivatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  patientId: number;
  cases: PatientCase[];
  /** Required in edit mode */
  pkg?: PrivatePackage | null;
  /** Called after a save so the page can reload (also after a partially successful create). */
  onSaved: () => void;
}

const inputBase =
  'w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none disabled:bg-gray-50 disabled:text-gray-500';

let rowCounter = 0;
const newKey = () => `row-${++rowCounter}`;

const emptyRow = (): ServiceRow => ({
  key: newKey(),
  service: '',
  quantity: 1,
  used: 0,
  schedule: false,
  date: '',
  time: '',
  practitioner: '',
  caseChoice: '',
  newCaseTitle: '',
});

const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const rowsFromPackage = (pkg: PrivatePackage | null | undefined): ServiceRow[] =>
  pkg
    ? pkg.items.map((item) => ({
        ...emptyRow(),
        itemId: item.id,
        service: item.service,
        quantity: item.quantity,
        used: item.used,
      }))
    : [emptyRow()];

/** Mounted fresh every time the modal opens, so its state starts from the props. */
const PrivatePackageModalBody: React.FC<Omit<PrivatePackageModalProps, 'isOpen'>> = ({
  onClose,
  mode,
  patientId,
  cases,
  pkg,
  onSaved,
}) => {
  const { user } = useAuthStore();
  const { services, loading: loadingServices } = useAppointmentServices();
  const { practitioners } = usePractitioners({});

  const editing = mode === 'edit' ? pkg : null;
  const [title, setTitle] = useState(editing?.title ?? '');
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [status, setStatus] = useState<PrivatePackageStatus>(editing?.status ?? 'ACTIVE');
  const [rows, setRows] = useState<ServiceRow[]>(() => rowsFromPackage(editing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCases = useMemo(
    () => cases.filter((c) => !c.is_archived && c.status === 'OPEN'),
    [cases],
  );
  const schedulablePractitioners = useMemo(
    () => practitioners.filter((p) => p.role !== 'STAFF' && /^\d+$/.test(String(p.id))),
    [practitioners],
  );

  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  // Default the practitioner to the logged-in user when they are one
  const defaultPractitioner = useMemo(() => {
    const own = schedulablePractitioners.find((p) => p.user_id === user?.id);
    return own ? String(own.id) : '';
  }, [schedulablePractitioners, user?.id]);

  const regularTotal = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const svc = r.service === '' ? undefined : serviceById.get(r.service);
        return sum + (svc ? Number(svc.price) * (Number(r.quantity) || 0) : 0);
      }, 0),
    [rows, serviceById],
  );
  const totalSessions = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  const updateRow = (key: string, patch: Partial<ServiceRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const toggleSchedule = (row: ServiceRow) => {
    if (row.schedule) {
      updateRow(row.key, { schedule: false });
      return;
    }
    updateRow(row.key, {
      schedule: true,
      practitioner: row.practitioner || defaultPractitioner,
      caseChoice: row.caseChoice || (openCases.length === 1 ? String(openCases[0].id) : openCases.length === 0 ? 'NEW' : ''),
      newCaseTitle: row.newCaseTitle || title,
    });
  };

  const validate = (): string | null => {
    if (!title.trim()) return 'Enter a package title.';
    if (price === '' || Number(price) < 0 || Number.isNaN(Number(price))) return 'Enter a valid package price (0 or more).';
    if (rows.length === 0) return 'Add at least one service.';
    const seen = new Set<number>();
    for (const r of rows) {
      if (r.service === '') return 'Choose a service for every row.';
      if (seen.has(r.service)) return 'Each service can only be listed once; increase its quantity instead.';
      seen.add(r.service);
      const qty = Number(r.quantity);
      if (!Number.isInteger(qty) || qty < 1) return 'Each quantity must be at least 1.';
      if (qty < r.used) return `"${serviceById.get(r.service)?.name ?? 'This service'}" already has ${r.used} session(s) in use; the quantity cannot be lower.`;
      if (r.schedule) {
        if (!r.date || !r.time) return 'Enter a date and time for each appointment you want to schedule.';
        if (!r.practitioner) return 'Choose a practitioner for each appointment you want to schedule.';
        if (!r.caseChoice) return 'Choose a Case (or create one) for each appointment you want to schedule.';
        if (r.caseChoice === 'NEW' && !r.newCaseTitle.trim()) return 'Enter a title for the new Case.';
      }
    }
    return null;
  };

  /** Create the appointments entered in the modal, then assign each one to the new package. */
  const scheduleAppointments = async (created: PrivatePackage, scheduled: ServiceRow[]): Promise<string[]> => {
    const problems: string[] = [];
    const newCases = new Map<string, number>(); // reuse one new Case for rows that share a title

    for (const row of scheduled) {
      const service = serviceById.get(row.service as number);
      const label = service?.name ?? 'service';
      try {
        let caseId: number;
        if (row.caseChoice === 'NEW') {
          const key = row.newCaseTitle.trim().toLowerCase();
          if (!newCases.has(key)) {
            const practitionerId = Number(row.practitioner);
            const newCase = await createPatientCase({
              patient: patientId,
              title: row.newCaseTitle.trim(),
              status: 'OPEN',
              primary_practitioner: practitionerId || undefined,
            });
            newCases.set(key, newCase.id);
          }
          caseId = newCases.get(key)!;
        } else {
          caseId = Number(row.caseChoice);
        }

        const practitioner = schedulablePractitioners.find((p) => String(p.id) === row.practitioner);
        const duration = service?.duration_minutes ?? 30;
        const appointment = await createAppointment({
          clinic: practitioner?.clinic_branch_id ?? (user?.clinic as number),
          patient: patientId,
          patient_case: caseId,
          service: row.service as number,
          practitioner: Number(row.practitioner),
          appointment_type: 'INITIAL',
          date: row.date,
          start_time: row.time,
          end_time: addMinutes(row.time, duration),
          duration_minutes: duration,
          notes: `Private Package Session: ${created.title}`,
        });

        try {
          await assignAppointmentToPackage(created.id, appointment.id, 'Scheduled together with the package');
        } catch (err: unknown) {
          problems.push(`${label}: the appointment was booked but could not be added to the package (${privatePackageErrorMessage(err, 'unknown error')}).`);
        }
      } catch (err: unknown) {
        problems.push(`${label}: the appointment could not be scheduled (${privatePackageErrorMessage(err, 'unknown error')}).`);
      }
    }
    return problems;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setSaving(true);

    const items = rows.map((r) => ({ service: r.service as number, quantity: Number(r.quantity) }));

    try {
      if (mode === 'edit' && pkg) {
        await updatePrivatePackage(pkg.id, {
          title: title.trim(),
          price: Number(price).toFixed(2),
          notes,
          status,
          items,
        });
        toast.success('Private Package Session updated');
        onSaved();
        onClose();
        return;
      }

      const created = await createPrivatePackage({
        patient: patientId,
        title: title.trim(),
        price: Number(price).toFixed(2),
        notes,
        items,
      });

      const scheduled = rows.filter((r) => r.schedule);
      const problems = scheduled.length ? await scheduleAppointments(created, scheduled) : [];

      if (problems.length === 0) {
        toast.success(
          scheduled.length
            ? `Package created and ${scheduled.length} appointment(s) scheduled`
            : 'Private Package Session created',
        );
      } else {
        toast.error(
          `Package created, but ${problems.length} appointment(s) need attention:\n${problems.join('\n')}`,
          { duration: 10000 },
        );
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(privatePackageErrorMessage(err, 'Failed to save the package.'));
      setSaving(false);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" onClick={!saving ? onClose : undefined} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {isEdit ? 'Edit Private Package Session' : 'Add Private Package Session'}
                </h3>
                <p className="text-xs text-gray-500">Not shown in online booking.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <div className="p-6 space-y-5 overflow-y-auto">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Private Package Session Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 10-session Rehab Program"
                  maxLength={200}
                  className={inputBase}
                  disabled={saving}
                  autoFocus
                />
              </div>

              {/* 2. Services */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Clinic Services</label>
                  <span className="text-xs text-gray-500">
                    {totalSessions} session{totalSessions === 1 ? '' : 's'} in total
                  </span>
                </div>

                <div className="space-y-3">
                  {rows.map((row) => {
                    const takenElsewhere = new Set(
                      rows.filter((r) => r.key !== row.key && r.service !== '').map((r) => r.service as number),
                    );
                    const isExisting = row.itemId !== undefined;
                    const service = row.service === '' ? undefined : serviceById.get(row.service);
                    return (
                      <div key={row.key} className="border border-gray-200 rounded-xl p-3 space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <select
                              value={row.service}
                              onChange={(e) => updateRow(row.key, { service: e.target.value === '' ? '' : Number(e.target.value) })}
                              className={inputBase}
                              disabled={saving || isExisting || loadingServices}
                              aria-label="Clinic service"
                            >
                              <option value="">{loadingServices ? 'Loading services…' : 'Select a service'}</option>
                              {services
                                .filter((s) => !takenElsewhere.has(s.id) || s.id === row.service)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} — ₱{Number(s.price).toLocaleString()}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="w-24 shrink-0">
                            <input
                              type="number"
                              min={Math.max(1, row.used)}
                              step={1}
                              value={row.quantity}
                              onChange={(e) =>
                                updateRow(row.key, { quantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) })
                              }
                              className={`${inputBase} text-center`}
                              disabled={saving}
                              aria-label="Number of sessions"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                            disabled={saving || rows.length === 1 || row.used > 0}
                            title={row.used > 0 ? 'Sessions are already in use' : 'Remove service'}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {isExisting && (
                          <p className="text-xs text-gray-500">
                            {row.used} of {row.quantity || 0} used
                          </p>
                        )}

                        {/* Optional appointment (create mode only) */}
                        {!isEdit && (
                          <div>
                            <button
                              type="button"
                              onClick={() => toggleSchedule(row)}
                              disabled={saving || row.service === ''}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-800 disabled:opacity-40"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              {row.schedule ? 'Remove appointment' : `Schedule an appointment${service ? ` for ${service.name}` : ''}`}
                            </button>

                            {row.schedule && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-sky-50/50 border border-sky-100 rounded-xl">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                                  <input
                                    type="date"
                                    value={row.date}
                                    onChange={(e) => updateRow(row.key, { date: e.target.value })}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className={inputBase}
                                    disabled={saving}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                                  <input
                                    type="time"
                                    value={row.time}
                                    onChange={(e) => updateRow(row.key, { time: e.target.value })}
                                    className={inputBase}
                                    disabled={saving}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Practitioner</label>
                                  <select
                                    value={row.practitioner}
                                    onChange={(e) => updateRow(row.key, { practitioner: e.target.value })}
                                    className={inputBase}
                                    disabled={saving}
                                  >
                                    <option value="">Select a practitioner</option>
                                    {schedulablePractitioners.map((p) => (
                                      <option key={p.id} value={String(p.id)}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Case</label>
                                  <select
                                    value={row.caseChoice}
                                    onChange={(e) => updateRow(row.key, { caseChoice: e.target.value })}
                                    className={inputBase}
                                    disabled={saving}
                                  >
                                    <option value="">Select a Case</option>
                                    {openCases.map((c) => (
                                      <option key={c.id} value={String(c.id)}>
                                        {c.title}
                                      </option>
                                    ))}
                                    <option value="NEW">+ Create a new Case</option>
                                  </select>
                                  {openCases.length === 0 && (
                                    <p className="mt-1 text-xs text-gray-500">No open Cases yet. A new one will be created.</p>
                                  )}
                                </div>
                                {row.caseChoice === 'NEW' && (
                                  <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">New Case title</label>
                                    <input
                                      type="text"
                                      value={row.newCaseTitle}
                                      onChange={(e) => updateRow(row.key, { newCaseTitle: e.target.value })}
                                      placeholder="e.g. Low back pain"
                                      className={inputBase}
                                      disabled={saving}
                                    />
                                  </div>
                                )}
                                <p className="sm:col-span-2 text-xs text-gray-500">
                                  Books one appointment and uses one session of this service. More can be scheduled later and
                                  assigned from the appointment.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, emptyRow()])}
                  disabled={saving}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add more services
                </button>
              </div>

              {/* 3. Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Private Package Session Price (₱)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={inputBase}
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This price is used instead of the individual service prices
                  {regularTotal > 0 && <> (regular total: ₱{regularTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })})</>}.
                  {isEdit && pkg?.invoice_amount_paid && Number(pkg.invoice_amount_paid) > 0 && (
                    <> The invoice already has payments, so the price can no longer be changed here.</>
                  )}
                </p>
              </div>

              {/* Status (edit only) */}
              {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PrivatePackageStatus)}
                    className={inputBase}
                    disabled={saving}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}

              {/* 4. Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Terms agreed with the patient, payment arrangement, etc."
                  className={inputBase}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create package'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export const PrivatePackageModal: React.FC<PrivatePackageModalProps> = ({ isOpen, ...rest }) => {
  if (!isOpen) return null;
  return <PrivatePackageModalBody {...rest} />;
};

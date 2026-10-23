import React, { useState } from 'react';
import { Building2, Check, Clock, Info, Loader2, Lock, MapPin, Pencil, Plus, Stethoscope, X } from 'lucide-react';
import type { ClinicBranch } from '@/types/clinic';
import type { DutyDay, DutySchedule } from '@/features/clinics/clinic.api';
import type { BranchAssignment, StaffMember } from '../../../types/staff.types';
import {
  DEFAULT_HOURS, WEEKDAYS, combine, describeSlice, scheduleErrorText, sliceOf, toSlice, uniformHours, type ClinicHours,
} from './practitionerSchedule';

interface Props {
  /** Practitioners in the selected group. */
  members: StaffMember[];
  branches: ClinicBranch[];
  /** Clinics the viewer may add / change / remove; null = every clinic (the Owner). */
  scopeIds: number[] | null;
  loading: boolean;
  /** Saves the full combined schedule; throws on a backend refusal (the message is shown inline). */
  onSave: (member: StaffMember, schedule: DutySchedule) => Promise<void>;
}

const fullName = (m: StaffMember) => `${m.first_name} ${m.last_name}`.trim() || m.email;
const initials = (m: StaffMember) => `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase() || '?';

const activeAssignments = (m: StaffMember): BranchAssignment[] => (m.branch_assignments ?? []).filter((a) => a.is_active);

// ─── Days + hours form (add a clinic / change a clinic's hours) ───────────────

const HoursForm: React.FC<{
  /** Clinic choices (add mode); omitted when editing a fixed clinic. */
  options?: ClinicBranch[];
  fixedName?: string;
  initial: ClinicHours;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (branchId: number | null, hours: ClinicHours) => void;
  onCancel: () => void;
}> = ({ options, fixedName, initial, busy, error, submitLabel, onSubmit, onCancel }) => {
  const [branchId, setBranchId] = useState<number | ''>('');
  const [hours, setHours] = useState<ClinicHours>(initial);
  const toggle = (day: DutyDay) => setHours((h) => ({
    ...h, days: h.days.includes(day) ? h.days.filter((d) => d !== day) : [...h.days, day],
  }));
  const invalid = (options && branchId === '') || hours.days.length === 0 || !hours.start || !hours.end || hours.start >= hours.end;

  return (
    <form
      className="mt-3 rounded-xl border border-sky-200 bg-sky-50/40 p-3.5 space-y-3"
      onSubmit={(e) => { e.preventDefault(); if (!invalid) onSubmit(branchId === '' ? null : branchId, hours); }}
    >
      {options ? (
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">Clinic</span>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : '')}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="">Choose a clinic…</option>
            {options.map((b) => <option key={b.id} value={b.id}>{b.name}{b.is_main_branch ? ' (Main)' : ''}</option>)}
          </select>
        </label>
      ) : (
        <p className="text-xs font-semibold text-gray-700">Working hours at {fixedName}</p>
      )}

      <fieldset>
        <legend className="text-xs font-semibold text-gray-700 mb-1.5">Working days</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => {
            const on = hours.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(day)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  on ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">From</span>
          <input type="time" value={hours.start} onChange={(e) => setHours((h) => ({ ...h, start: e.target.value }))}
            className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">To</span>
          <input type="time" value={hours.end} onChange={(e) => setHours((h) => ({ ...h, end: e.target.value }))}
            className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </label>
        {hours.start && hours.end && hours.start >= hours.end && (
          <span className="text-xs text-amber-700">The end time must be after the start time.</span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy || !!invalid}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Check className="w-3.5 h-3.5" aria-hidden="true" />}
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={busy}
          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
      </div>
    </form>
  );
};

// ─── One practitioner ─────────────────────────────────────────────────────────

const PractitionerCard: React.FC<{
  member: StaffMember;
  branches: ClinicBranch[];
  scopeIds: number[] | null;
  onSave: Props['onSave'];
}> = ({ member, branches, scopeIds, onSave }) => {
  const [mode, setMode] = useState<{ kind: 'add' } | { kind: 'edit'; branchId: number } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignments = activeAssignments(member);
  const assignedIds = assignments.map((a) => a.branch_id);
  const inScope = (branchId: number) => scopeIds === null || scopeIds.includes(branchId);
  const addable = branches.filter((b) => b.is_active && !assignedIds.includes(b.id) && inScope(b.id));
  const slices = assignments.map((a) => ({ branchId: a.branch_id, slice: sliceOf(a) }));

  const save = async (key: string, next: Array<{ branchId: number; slice: DutySchedule }>): Promise<boolean> => {
    setBusyKey(key); setError(null);
    try {
      await onSave(member, combine(next));
      return true;
    } catch (err: unknown) {
      setError(scheduleErrorText(err, 'Could not update the working clinics.'));
      return false;
    } finally { setBusyKey(null); }
  };

  const add = async (branchId: number | null, hours: ClinicHours) => {
    if (branchId === null) return;
    if (await save('add', [...slices, { branchId, slice: toSlice(hours) }])) setMode(null);
  };
  const change = async (branchId: number, hours: ClinicHours) => {
    if (await save(`edit-${branchId}`, slices.map((s) => (s.branchId === branchId ? { ...s, slice: toSlice(hours) } : s)))) setMode(null);
  };
  const remove = (branchId: number) => { void save(`remove-${branchId}`, slices.filter((s) => s.branchId !== branchId)); };

  const editing = mode?.kind === 'edit' ? assignments.find((a) => a.branch_id === mode.branchId) : undefined;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0" aria-hidden="true">
          {initials(member)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName(member)}</p>
          <p className="text-xs text-gray-400 truncate">{member.email}{!member.is_active ? ' · Inactive' : ''}</p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
          1 clinician
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Stethoscope className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <h5 className="text-xs font-bold text-gray-700">Works at</h5>
          <span className="text-[11px] text-gray-400">Diary, Calendar and patients of each clinic</span>
        </div>

        <ul className="space-y-2">
          {assignments.map((a) => {
            const slice = sliceOf(a);
            const editable = inScope(a.branch_id) && uniformHours(slice) !== null;
            const mine = inScope(a.branch_id);
            const removeBlock = !mine ? 'Managed by another Branch Manager'
              : assignments.length <= 1 ? 'A practitioner must work at at least one clinic' : undefined;
            return (
              <li key={a.branch_id} className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2">
                <MapPin className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                    {a.branch_name || `Clinic #${a.branch_id}`}
                    {!mine && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" aria-hidden="true" /> Managed by another Branch Manager
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" aria-hidden="true" />{describeSlice(slice)}
                  </p>
                </div>
                {mine && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={!editable || !!busyKey}
                      onClick={() => { setError(null); setMode({ kind: 'edit', branchId: a.branch_id }); }}
                      title={editable ? 'Change days and hours' : 'Custom hours: change them in Setup → Staff'}
                      aria-label={`Change hours at ${a.branch_name}`}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-sky-700 hover:bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={!!removeBlock || !!busyKey}
                      onClick={() => remove(a.branch_id)}
                      title={removeBlock ?? `Stop working at ${a.branch_name}`}
                      aria-label={`Remove ${a.branch_name}`}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {busyKey === `remove-${a.branch_id}`
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        : <X className="w-3.5 h-3.5" aria-hidden="true" />}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {assignments.length === 0 && <li className="text-xs text-amber-600">No clinic assigned yet.</li>}
        </ul>

        {mode?.kind === 'edit' && editing && (
          <HoursForm
            fixedName={editing.branch_name}
            initial={uniformHours(sliceOf(editing)) ?? DEFAULT_HOURS}
            busy={busyKey === `edit-${editing.branch_id}`}
            error={error}
            submitLabel="Save hours"
            onSubmit={(_, hours) => { void change(editing.branch_id, hours); }}
            onCancel={() => { setMode(null); setError(null); }}
          />
        )}

        {mode?.kind === 'add' ? (
          <HoursForm
            options={addable}
            initial={DEFAULT_HOURS}
            busy={busyKey === 'add'}
            error={error}
            submitLabel="Add clinic"
            onSubmit={(id, hours) => { void add(id, hours); }}
            onCancel={() => { setMode(null); setError(null); }}
          />
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={addable.length === 0 || !!busyKey}
              onClick={() => { setError(null); setMode({ kind: 'add' }); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-dashed border-sky-300 text-sky-700 bg-sky-50/50 hover:bg-sky-50 hover:border-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add more branch
            </button>
            {addable.length === 0 && (
              <span className="text-[11px] text-gray-400">
                {scopeIds === null ? 'Works at every clinic already.' : 'No other clinic you manage is left to add.'}
              </span>
            )}
          </div>
        )}

        {error && mode === null && (
          <p role="alert" className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>
    </article>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

export const PractitionerBranchPanel: React.FC<Props> = ({ members, branches, scopeIds, loading, onSave }) => (
  <div className="border-t border-gray-100 bg-gradient-to-b from-emerald-50/40 to-white px-5 py-5 space-y-4 rounded-b-2xl">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
        <Building2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-gray-900">Clinics for Practitioners</h4>
        <p className="text-xs text-gray-500 leading-snug">
          Choose the clinics each Practitioner in this group works at. At each clinic they appear in the Diary and Calendar
          on the days and hours you set, and see that clinic&apos;s patients and notes. Changes here save right away.
        </p>
      </div>
    </div>

    <p className="text-xs rounded-xl px-3.5 py-2.5 flex items-start gap-2 border bg-sky-50 border-sky-200 text-sky-800">
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        <strong>One person, one clinician.</strong> A Practitioner who works at several clinics counts as 1 clinician on your plan.
        {scopeIds !== null && ' You can add or change only the clinics you manage; hours at other clinics stay as they are.'}
      </span>
    </p>

    {loading ? (
      <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
    ) : members.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
        No Practitioner is in this group yet. Add one in <strong>Setup → Staff</strong>, then choose their clinics here.
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3">
        {members.map((member) => (
          <PractitionerCard key={member.id} member={member} branches={branches} scopeIds={scopeIds} onSave={onSave} />
        ))}
      </div>
    )}
  </div>
);

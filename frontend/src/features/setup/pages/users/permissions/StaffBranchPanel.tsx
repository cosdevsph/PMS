import React, { useState } from 'react';
import { Building2, Info, Lock, UsersRound } from 'lucide-react';
import type { ClinicBranch } from '@/types/clinic';
import type { StaffMember } from '../../../types/staff.types';
import { AddBranchMenu, ClinicChip, type Option } from './BranchAccessPanel';
import { clinicIdsOf } from './staffClinics';

interface Props {
  /** Frontdesk / Finance staff in the selected group. */
  members: StaffMember[];
  branches: ClinicBranch[];
  /** Clinics the viewer may add or remove; null = every clinic (the Owner). */
  scopeIds: number[] | null;
  loading: boolean;
  /** Saves the full clinic list (home clinic first); throws on a backend refusal. */
  onSave: (member: StaffMember, clinicIds: number[]) => Promise<void>;
}

const fullName = (m: StaffMember) => `${m.first_name} ${m.last_name}`.trim() || m.email;
const initials = (m: StaffMember) => `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase() || '?';

const StaffCard: React.FC<{
  member: StaffMember; branches: ClinicBranch[]; scopeIds: number[] | null; onSave: Props['onSave'];
}> = ({ member, branches, scopeIds, onSave }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ids = clinicIdsOf(member);
  const byId = new Map(branches.map((b) => [b.id, b]));
  const inScope = (id: number) => scopeIds === null || scopeIds.includes(id);
  const options: Option[] = branches.filter((b) => b.is_active && !ids.includes(b.id) && inScope(b.id)).map((b) => ({ branch: b }));

  const save = async (next: number[]) => {
    setBusy(true); setError(null);
    try { await onSave(member, next); } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const pick = (v: unknown) => (typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : null);
      setError(pick(data?.work_branch_ids) ?? pick(data?.detail) ?? 'Could not update the clinics.');
    } finally { setBusy(false); }
  };

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0" aria-hidden="true">
          {initials(member)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName(member)}</p>
          <p className="text-xs text-gray-400 truncate">{member.email}{!member.is_active ? ' · Inactive' : ''}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
          <h5 className="text-xs font-bold text-gray-700">Works at</h5>
          <span className="text-[11px] text-gray-400">Same permissions at every clinic</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ids.map((id) => {
            const branch = byId.get(id);
            const mine = inScope(id);
            const reason = !mine ? 'Managed by another Branch Manager' : ids.length <= 1 ? 'Must work at at least one clinic' : undefined;
            return (
              <span key={id} className="inline-flex items-center gap-1">
                <ClinicChip
                  branch={branch ?? { id, name: `Clinic #${id}` }}
                  tone="sky"
                  readOnly={!mine || busy}
                  onRemove={() => { void save(ids.filter((i) => i !== id)); }}
                  removeDisabledReason={reason}
                />
                {!mine && <Lock className="w-3 h-3 text-gray-400" aria-label="Managed by another Branch Manager" />}
              </span>
            );
          })}
          <AddBranchMenu options={options} onPick={(id) => { void save([...ids, id]); }} busy={busy} disabled={options.length === 0} />
        </div>
        {error && <p role="alert" className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </div>
    </article>
  );
};

export const StaffBranchPanel: React.FC<Props> = ({ members, branches, scopeIds, loading, onSave }) => (
  <div className="border-t border-gray-100 bg-gradient-to-b from-sky-50/40 to-white px-5 py-5 space-y-4 rounded-b-2xl">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
        <UsersRound className="w-4 h-4 text-sky-600" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-gray-900">Clinics for staff</h4>
        <p className="text-xs text-gray-500 leading-snug">
          Choose the clinics each person in this group works at. A clinic widens where they work, not what they may do:
          they keep this group&apos;s permissions. Changes here save right away.
        </p>
      </div>
    </div>
    <p className="text-xs rounded-xl px-3.5 py-2.5 flex items-start gap-2 border bg-sky-50 border-sky-200 text-sky-800">
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{scopeIds === null ? 'The Owner can use any clinic.' : 'You can add or remove only the clinics you manage; other clinics stay as they are.'}</span>
    </p>
    {loading ? (
      <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
    ) : members.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
        Nobody is in this group yet. Add staff in <strong>Setup → Staff</strong>.
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3">
        {members.map((m) => <StaffCard key={m.id} member={m} branches={branches} scopeIds={scopeIds} onSave={onSave} />)}
      </div>
    )}
  </div>
);

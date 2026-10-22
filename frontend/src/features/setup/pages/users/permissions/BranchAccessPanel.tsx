import React, { useEffect, useRef, useState } from 'react';
import { Building2, Info, Loader2, Lock, MapPin, Plus, ShieldAlert, UserCog, X } from 'lucide-react';
import type { ClinicBranch } from '@/types/clinic';
import type { AccessLevel } from '../../../services/PermissionGroupService';
import type { StaffMember } from '../../../types/staff.types';
import { AccessBadge } from './AccessControl';

export interface BranchPatch { branch_ids?: number[]; extra_diary_branch_ids?: number[] }

interface Props {
  /** Current level of the group's "Other Branches' Diary" row (live while editing). */
  level: AccessLevel;
  /** Branch Managers who belong to this group. */
  members: StaffMember[];
  /** Every Branch Manager of the clinic (to show who already manages which clinic). */
  allManagers: StaffMember[];
  branches: ClinicBranch[];
  loading: boolean;
  /** Only the Owner may change clinics. */
  canEdit: boolean;
  onSave: (member: StaffMember, patch: BranchPatch) => Promise<void>;
}

interface Option { branch: ClinicBranch; disabledReason?: string }

const initials = (m: StaffMember) => `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase() || '?';
const fullName = (m: StaffMember) => `${m.first_name} ${m.last_name}`.trim() || m.email;

const LEVEL_COPY: Record<AccessLevel, string> = {
  none: 'No access to other clinics. Set "Other Branches\' Diary" to View or Edit above to choose clinics.',
  view: 'Can open these clinics\' Diary, read only.',
  edit: 'Can open these clinics\' Diary and book, move and cancel there. Patient lookup is for booking only; records, invoices and reports of those clinics stay hidden.',
};

// ─── "+ Add more branch" menu ─────────────────────────────────────────────────

const AddBranchMenu: React.FC<{
  options: Option[];
  onPick: (id: number) => void;
  disabled?: boolean;
  busy?: boolean;
  label?: string;
}> = ({ options, onPick, disabled, busy, label = 'Add more branch' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const available = options.filter((o) => !o.disabledReason).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-dashed border-sky-300 text-sky-700 bg-sky-50/50 hover:bg-sky-50 hover:border-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Plus className="w-3.5 h-3.5" aria-hidden="true" />}
        {label}
      </button>
      {open && (
        <div role="listbox" className="absolute z-30 mt-2 w-96 max-w-[calc(100vw-3rem)] max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl p-1.5">
          {options.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">Every clinic has already been added.</p>
          ) : options.map(({ branch, disabledReason }) => (
            <button
              key={branch.id}
              type="button"
              role="option"
              aria-selected={false}
              disabled={!!disabledReason}
              onClick={() => { onPick(branch.id); setOpen(false); }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-sky-50 disabled:hover:bg-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-800">
                  {branch.name}{branch.is_main_branch ? ' (Main)' : ''}
                </span>
                {branch.city && <span className="block text-[11px] text-gray-400 truncate">{branch.city}</span>}
              </span>
              {disabledReason && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">{disabledReason}</span>
              )}
            </button>
          ))}
          {options.length > 0 && available === 0 && (
            <p className="px-3 pb-2 pt-1 text-[11px] text-gray-400">None of these clinics can be added right now.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── A clinic shown as a chip ─────────────────────────────────────────────────

const ClinicChip: React.FC<{
  branch?: { id: number; name: string; city?: string | null; is_main_branch?: boolean };
  onRemove?: () => void;
  removeDisabledReason?: string;
  tone: 'violet' | 'sky';
  readOnly?: boolean;
}> = ({ branch, onRemove, removeDisabledReason, tone, readOnly }) => {
  if (!branch) return null;
  const toneCls = tone === 'violet'
    ? 'bg-violet-50 border-violet-200 text-violet-800'
    : 'bg-sky-50 border-sky-200 text-sky-800';
  return (
    <span className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border text-xs font-medium ${toneCls}`}>
      <MapPin className="w-3 h-3 opacity-70" aria-hidden="true" />
      {branch.name}{branch.is_main_branch ? ' (Main)' : ''}
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          disabled={!!removeDisabledReason}
          title={removeDisabledReason ?? `Remove ${branch.name}`}
          aria-label={`Remove ${branch.name}`}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
};

// ─── One Branch Manager ───────────────────────────────────────────────────────

const ManagerCard: React.FC<{
  member: StaffMember;
  level: AccessLevel;
  branches: ClinicBranch[];
  managedByOther: Record<number, string>;
  canEdit: boolean;
  onSave: Props['onSave'];
}> = ({ member, level, branches, managedByOther, canEdit, onSave }) => {
  const [busy, setBusy] = useState<'managed' | 'extra' | null>(null);

  const managed: { id: number; name: string; city?: string | null; is_main_branch?: boolean }[] = member.manager_branches ?? [];
  const extra: { id: number; name: string }[] = member.extra_diary_branches ?? [];
  const managedIds = managed.map((b) => b.id);
  const extraIds = extra.map((b) => b.id);
  const byId = new Map(branches.map((b) => [b.id, b]));
  const extraEnabled = level !== 'none';

  // Keep the member's primary clinic first so adding a clinic never silently changes it.
  const ordered = (ids: number[]) => {
    const primary = member.clinic_branch;
    return primary && ids.includes(primary) ? [primary, ...ids.filter((i) => i !== primary)] : ids;
  };

  const run = async (kind: 'managed' | 'extra', patch: BranchPatch) => {
    setBusy(kind);
    try { await onSave(member, patch); } finally { setBusy(null); }
  };

  const addManaged = (id: number) => run('managed', {
    branch_ids: ordered([...managedIds, id]),
    // a clinic they now manage is no longer an "extra" one
    extra_diary_branch_ids: extraIds.filter((e) => e !== id),
  });
  const removeManaged = (id: number) => run('managed', { branch_ids: ordered(managedIds.filter((m) => m !== id)) });
  const addExtra = (id: number) => run('extra', { extra_diary_branch_ids: [...extraIds, id] });
  const removeExtra = (id: number) => run('extra', { extra_diary_branch_ids: extraIds.filter((e) => e !== id) });

  const managedOptions: Option[] = branches
    .filter((b) => !managedIds.includes(b.id))
    .map((b) => ({ branch: b, disabledReason: managedByOther[b.id] ? `Managed by ${managedByOther[b.id]}` : undefined }));
  const extraOptions: Option[] = branches
    .filter((b) => !managedIds.includes(b.id) && !extraIds.includes(b.id))
    .map((b) => ({ branch: b }));

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0" aria-hidden="true">
          {initials(member)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName(member)}</p>
          <p className="text-xs text-gray-400 truncate">{member.email}{!member.is_active ? ' · Inactive' : ''}</p>
        </div>
      </div>

      {/* Clinics they manage */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <UserCog className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" />
          <h5 className="text-xs font-bold text-gray-700">Clinics they manage</h5>
          <span className="text-[11px] text-gray-400">One Branch Manager per clinic</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {managed.map((b) => (
            <ClinicChip
              key={b.id}
              branch={byId.get(b.id) ?? b}
              tone="violet"
              readOnly={!canEdit}
              onRemove={() => removeManaged(b.id)}
              removeDisabledReason={managed.length <= 1 ? 'A Branch Manager must manage at least one clinic' : undefined}
            />
          ))}
          {managed.length === 0 && <span className="text-xs text-amber-600">No clinic assigned yet.</span>}
          {canEdit && (
            <AddBranchMenu options={managedOptions} onPick={addManaged} busy={busy === 'managed'} />
          )}
        </div>
      </div>

      {/* Diary & patient access to other clinics */}
      <div className={extraEnabled ? '' : 'opacity-60'}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Building2 className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
          <h5 className="text-xs font-bold text-gray-700">Diary &amp; patient access to other clinics</h5>
          <AccessBadge value={level} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extra.map((b) => (
            <ClinicChip key={b.id} branch={byId.get(b.id) ?? b} tone="sky" readOnly={!canEdit} onRemove={() => removeExtra(b.id)} />
          ))}
          {extra.length === 0 && <span className="text-xs text-gray-400">None added.</span>}
          {canEdit && (
            <AddBranchMenu options={extraOptions} onPick={addExtra} disabled={!extraEnabled} busy={busy === 'extra'} />
          )}
        </div>
        {!extraEnabled && extra.length > 0 && (
          <p className="mt-2 text-[11px] text-amber-700 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            These clinics are saved but not active while the level is No Access.
          </p>
        )}
      </div>
    </article>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

export const BranchAccessPanel: React.FC<Props> = ({ level, members, allManagers, branches, loading, canEdit, onSave }) => {
  const managedByOthers = (excludeId: number): Record<number, string> => {
    const map: Record<number, string> = {};
    allManagers.filter((m) => m.id !== excludeId).forEach((m) => {
      (m.manager_branches ?? []).forEach((b: { id: number }) => { map[b.id] = fullName(m); });
    });
    return map;
  };

  return (
    <div className="border-t border-gray-100 bg-gradient-to-b from-violet-50/40 to-white px-5 py-5 space-y-4 rounded-b-2xl">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-violet-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-900">Branch access for Branch Managers</h4>
          <p className="text-xs text-gray-500 leading-snug">
            Choose which clinics each Branch Manager in this group manages, and which other clinics they can open in the Diary.
            Changes here save right away.
          </p>
        </div>
      </div>

      <p className={`text-xs rounded-xl px-3.5 py-2.5 flex items-start gap-2 border ${
        level === 'none' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-sky-50 border-sky-200 text-sky-800'
      }`}>
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span><strong>Other branches&apos; Diary: {level === 'none' ? 'No Access' : level === 'view' ? 'View' : 'Edit'}.</strong> {LEVEL_COPY[level]}</span>
      </p>

      {!canEdit && (
        <p className="text-xs text-gray-500 flex items-center gap-2"><Lock className="w-3.5 h-3.5" aria-hidden="true" />Only the Owner can change clinics.</p>
      )}

      {loading ? (
        <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
          No Branch Manager is in this group yet. Assign one in <strong>Setup → Staff</strong>, then choose their clinics here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {members.map((member) => (
            <ManagerCard
              key={member.id}
              member={member}
              level={level}
              branches={branches}
              managedByOther={managedByOthers(member.id)}
              canEdit={canEdit}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

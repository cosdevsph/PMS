/**
 * Permissions.tsx — Permission Group builder.
 *
 * Lets the Owner (and a Branch Manager whose group grants Permissions: Edit):
 *   - browse the clinic's permission groups
 *   - set each feature to No Access / View / Edit from the dropdown on its row; every card keeps
 *     its own unsaved changes and shows its own Save changes / Discard only when it has some
 *   - create, duplicate and delete groups
 *   - (Owner) choose, per Branch Manager in a group, which clinics they manage and which other
 *     clinics they can open in the Diary
 *   - choose, per Practitioner in a group, the clinics they work at and their hours there (the
 *     Owner: any clinic; a Branch Manager: the clinics they manage). One clinician on the plan.
 *
 * The Owner is never listed: the Owner always has full access and has no permission settings.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Copy, Crown, Info, Lock, Plus, RefreshCw, Search, Shield, Trash2, Users,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/auth.store';
import { useClinicBranches } from '@/features/clinics/hooks/useClinicBranches';
import {
  createPermissionGroup,
  deletePermissionGroup,
  duplicatePermissionGroup,
  listPermissionGroups,
  updatePermissionGroup,
  type AccessLevel,
  type PermissionGroup,
  type RoleTemplate,
} from '../../services/PermissionGroupService';
import { getStaff, saveStaffClinics, saveStaffSchedule, updateStaff } from '../../services/StaffService';
import type { CreateStaffData, StaffMember } from '../../types/staff.types';
import type { DutySchedule } from '@/features/clinics/clinic.api';
import { BranchAccessPanel, type BranchPatch } from './permissions/BranchAccessPanel';
import { FeatureSections } from './permissions/FeatureSections';
import { CreateGroupModal, DeleteConfirmModal } from './permissions/GroupModals';
import { GroupSidebar } from './permissions/GroupSidebar';
import { PractitionerBranchPanel } from './permissions/PractitionerBranchPanel';
import { StaffBranchPanel } from './permissions/StaffBranchPanel';
import {
  AUDIENCE_LABELS, BRANCH_MANAGER_MANAGEABLE_TEMPLATES, ROLE_ORDER, TEMPLATE_DEFAULT_PERMS, TEMPLATE_LABELS, TEMPLATE_STYLES, summarize,
} from './permissions/meta';

const errorText = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return fallback;
  const pick = (value: unknown): string | null =>
    typeof value === 'string' ? value : Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null;
  return pick(data.detail) ?? pick(data.branch_ids) ?? pick(data.extra_diary_branch_ids) ?? pick(data.clinic_branch) ?? fallback;
};

const isBranchManager = (s: StaffMember) => (s.roles?.length ? s.roles : [s.role]).includes('BRANCH_MANAGER');
const isPractitioner = (s: StaffMember) => (s.roles?.length ? s.roles : [s.role]).includes('PRACTITIONER');
// Frontdesk / Finance: works at several clinics through `work_branch_ids` (not a Practitioner or Branch Manager).
const isFrontdeskOrFinance = (s: StaffMember) => {
  const roles = s.roles?.length ? s.roles : [s.role];
  return roles.some((r) => r === 'STAFF' || r === 'FINANCE') && !roles.some((r) => r === 'PRACTITIONER' || r === 'BRANCH_MANAGER' || r === 'OWNER');
};

export const Permissions: React.FC = () => {
  const { isOwner, isBranchManager: actorIsBranchManager, permissionsMap, managerBranches } = usePermissions();
  // Subscribe to external permission refreshes (e.g. WS-driven updates from another browser session).
  const permissionsVersion = useAuthStore((s) => s.permissionsVersion);
  const ownGroupId = useAuthStore((s) => s.user?.permission_group ?? null);
  const { branches } = useClinicBranches();

  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Unsaved choices for the selected group: only the features whose level differs from the saved one.
  const [pending, setPending] = useState<Record<string, AccessLevel>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PermissionGroup | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // Same rule as the backend: the Owner and every Branch Manager (no Owner switch since 2026-10-23).
  // A Branch Manager is limited to the Frontdesk / Practitioner / Finance groups, never above their own
  // level of a feature, and only for groups whose members all work at clinics they manage.
  const canManage = isOwner || actorIsBranchManager;

  // BRANCH_MANAGER → FRONTDESK → PRACTITIONER → CUSTOM; the Owner group is never shown. A Branch Manager
  // is shown only the groups they manage (the backend returns just those; this filter mirrors it).
  const sortedGroups = useMemo(
    () =>
      groups
        .filter((g) => g.role_template !== 'OWNER')
        .filter((g) => isOwner || BRANCH_MANAGER_MANAGEABLE_TEMPLATES.includes(g.role_template))
        .sort((a, b) => {
          const orderA = ROLE_ORDER[a.role_template] ?? 99;
          const orderB = ROLE_ORDER[b.role_template] ?? 99;
          return orderA !== orderB ? orderA - orderB : a.name.localeCompare(b.name);
        }),
    [groups, isOwner],
  );

  const selected = sortedGroups.find((g) => g.id === selectedId) ?? sortedGroups[0] ?? null;
  const savedMap = useMemo<Record<string, AccessLevel>>(() => selected?.permissions_map ?? {}, [selected]);
  const activeMap = useMemo(() => ({ ...savedMap, ...pending }), [savedMap, pending]);
  const dirtyCount = Object.keys(pending).length;

  // ── Loading ───────────────────────────────────────────────────────────────

  const fetchGroups = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setGroups(await listPermissionGroups());
    } catch (err: unknown) {
      const msg = errorText(err, 'Failed to load permission groups.');
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, []);

  // The Owner needs the staff for both panels; a Branch Manager who manages groups, for the Practitioner panel.
  const needsStaff = canManage;
  const fetchStaff = useCallback(async () => {
    if (!needsStaff) return;
    setStaffLoading(true);
    try { setStaff(await getStaff()); } catch { /* the branch panel simply shows no managers */ } finally { setStaffLoading(false); }
  }, [needsStaff]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);
  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // Re-fetch when an external session triggers a WS-driven permission refresh (skip the first render).
  const isFirstVersionRender = useRef(true);
  useEffect(() => {
    if (isFirstVersionRender.current) { isFirstVersionRender.current = false; return; }
    fetchGroups();
  }, [permissionsVersion, fetchGroups]);

  // ── Editing (per card) ────────────────────────────────────────────────────

  const confirmDiscard = () => dirtyCount === 0 || window.confirm('Discard your unsaved permission changes?');

  const selectGroup = (id: number) => {
    if (id === selected?.id) return;
    if (!confirmDiscard()) return;
    setPending({}); setSelectedId(id); setQuery('');
  };

  /** Choosing the saved level again simply removes the pending change. */
  const setLevel = (key: string, level: AccessLevel) =>
    setPending((prev) => {
      const next = { ...prev };
      if ((savedMap[key] ?? 'none') === level) delete next[key]; else next[key] = level;
      return next;
    });

  const discardSection = (keys: string[]) =>
    setPending((prev) => {
      const next = { ...prev };
      keys.forEach((key) => { delete next[key]; });
      return next;
    });

  /** Saves only this card's unsaved choices; other cards keep theirs. */
  const saveSection = async (sectionLabel: string, keys: string[]) => {
    if (!selected) return;
    const changes = Object.fromEntries(keys.filter((k) => k in pending).map((k) => [k, pending[k]]));
    if (Object.keys(changes).length === 0) return;

    // The API replaces the whole map, so send the saved map with this card's changes applied.
    const merged = { ...savedMap, ...changes };
    const snapshotGroups = groups;
    const groupId = selected.id;
    const groupName = selected.name;

    // Optimistic update for instant feedback, rolled back if the save fails.
    setGroups((prev) => prev.map((x) => (x.id === groupId ? { ...x, permissions_map: merged } : x)));
    setPending((prev) => { const next = { ...prev }; Object.keys(changes).forEach((k) => { delete next[k]; }); return next; });
    setSavingSection(sectionLabel);
    try {
      await updatePermissionGroup(groupId, { permissions: merged });
      toast.success(`${sectionLabel} saved for "${groupName}".`);
    } catch (err: unknown) {
      setGroups(snapshotGroups);
      setPending((prev) => ({ ...prev, ...changes }));
      toast.error(errorText(err, 'Failed to save changes.'));
    } finally { setSavingSection(null); }
  };

  // ── Group actions ─────────────────────────────────────────────────────────

  const handleCreate = async (name: string, template: RoleTemplate, description: string) => {
    const permissions = { ...TEMPLATE_DEFAULT_PERMS[template] };
    const created = await createPermissionGroup({ name, role_template: template, description, permissions });
    setGroups((prev) => [...prev, created]);
    setPending({}); setSelectedId(created.id);
    toast.success(`"${name}" permission group created.`);
  };

  const handleDuplicate = async (g: PermissionGroup) => {
    if (!confirmDiscard()) return;
    let name = `${g.name} (Copy)`; let idx = 2;
    while (groups.some((x) => x.name === name)) name = `${g.name} (Copy ${idx++})`;
    try {
      const copy = await duplicatePermissionGroup(g.id, name);
      setGroups((prev) => [...prev, copy]);
      setPending({}); setSelectedId(copy.id);
      toast.success(`Duplicated as "${name}".`);
      if (copy.lowered_features?.length) {
        toast(`Lowered to your own access: ${copy.lowered_features.join(', ').replace(/_/g, ' ')}.`, { icon: 'ℹ️' });
      }
    } catch (err: unknown) {
      toast.error(errorText(err, 'Failed to duplicate group.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePermissionGroup(deleteTarget.id);
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) { setSelectedId(null); setPending({}); }
      toast.success(`"${deleteTarget.name}" deleted.`);
    } catch (err: unknown) {
      toast.error(errorText(err, 'Failed to delete group.'));
    } finally { setDeleteTarget(null); }
  };

  // ── Branch access (Owner only) ────────────────────────────────────────────

  const handleBranchSave = async (member: StaffMember, patch: BranchPatch) => {
    try {
      const updated = await updateStaff(member.id, patch as Partial<CreateStaffData>);
      setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, ...updated } : s)));
      toast.success(`${member.first_name}'s branch access updated.`);
    } catch (err: unknown) {
      toast.error(errorText(err, 'Could not update branch access.'));
      throw err;
    }
  };

  // Practitioner clinics: saved through the user update, so the same overlap and scope rules apply.
  const handlePractitionerSave = async (member: StaffMember, schedule: DutySchedule) => {
    const updated = await saveStaffSchedule(member.id, schedule);   // a refusal is shown inline by the panel
    setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, ...updated } : s)));
    toast.success(`${member.first_name}'s clinics updated.`);
  };

  // Frontdesk / Finance clinics: same save path (user update), same scope rules as the schedule.
  const handleStaffClinicsSave = async (member: StaffMember, clinicIds: number[]) => {
    const updated = await saveStaffClinics(member.id, clinicIds);   // a refusal is shown inline by the panel
    setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, ...updated } : s)));
    toast.success(`${member.first_name}'s clinics updated.`);
  };

  const branchManagers = useMemo(() => staff.filter(isBranchManager), [staff]);
  const members = useMemo(
    () => (selected ? branchManagers.filter((s) => s.permission_group === selected.id) : []),
    [branchManagers, selected],
  );
  const showBranchPanel = isOwner && !!selected && (selected.role_template === 'BRANCH_MANAGER' || members.length > 0);
  const lockedReason = selected && !isOwner ? (selected.locked_reason ?? null) : null;
  const canManageSelected = !!selected && canManage && (isOwner || (selected.id !== ownGroupId && !lockedReason));
  const practitioners = useMemo(
    () => (selected ? staff.filter((s) => isPractitioner(s) && s.permission_group === selected.id) : []),
    [staff, selected],
  );
  const staffMembers = useMemo(
    () => (selected ? staff.filter((s) => isFrontdeskOrFinance(s) && s.permission_group === selected.id) : []),
    [staff, selected],
  );
  const showStaffPanel = !!selected && canManageSelected
    && (selected.role_template === 'FRONTDESK' || selected.role_template === 'FINANCE' || staffMembers.length > 0)
    && selected.role_template !== 'PRACTITIONER';
  // Clinics the viewer may change: everything for the Owner, the managed clinics for a Branch Manager.
  const practitionerScope = isOwner ? null : managerBranches.map((b) => b.id);
  const showPractitionerPanel = !!selected && canManageSelected
    && (selected.role_template === 'PRACTITIONER' || practitioners.length > 0);

  // ── Render ────────────────────────────────────────────────────────────────

  // The Owner manages every group. A Branch Manager (with Permissions: Edit) manages the groups they are
  // shown (Frontdesk, Practitioner, Finance), never the one they belong to (the backend enforces both).
  const style = selected ? (TEMPLATE_STYLES[selected.role_template] ?? TEMPLATE_STYLES.CUSTOM) : TEMPLATE_STYLES.CUSTOM;
  const StyleIcon = style.icon;
  const counts = summarize(activeMap);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Permission Groups</h1>
            <p className="text-xs text-gray-500">Decide what each group of staff can see and do. Assign people to a group in Setup → Staff.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
            <Crown className="w-3.5 h-3.5" aria-hidden="true" /> The Owner always has full access
          </span>
          <button
            type="button"
            onClick={() => { if (confirmDiscard()) { setPending({}); fetchGroups(); fetchStaff(); } }}
            disabled={loading}
            title="Refresh"
            aria-label="Refresh"
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> New group
            </button>
          )}
        </div>
      </header>

      {!canManage && (
        <div className="flex items-center gap-2 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
          View-only. Contact the Owner to make changes.
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />{error}
        </div>
      )}

      {loading ? (
        <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[74px] rounded-2xl bg-gray-100 animate-pulse" />)}</div>
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        </div>
      ) : !error && sortedGroups.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
          <p className="text-sm">No permission groups yet. Create one to get started.</p>
        </div>
      ) : selected && (
        <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
          <GroupSidebar groups={sortedGroups} selectedId={selected.id} onSelect={selectGroup} canCreate={false} onCreate={() => setShowCreate(true)} isLocked={canManage && !isOwner ? (g) => g.id === ownGroupId : undefined} />

          <div className="space-y-4 min-w-0">
            {/* Group summary */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                    <StyleIcon className={`w-6 h-6 ${style.iconColor}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-gray-900 truncate">{selected.name}</h2>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {TEMPLATE_LABELS[selected.role_template] ?? selected.role_template}
                      </span>
                      {selected.is_protected && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" aria-hidden="true" /> Protected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
                      {selected.description || 'No description.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5 inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      {selected.member_count} member{selected.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {canManage && (isOwner || selected.id !== ownGroupId) && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => handleDuplicate(selected)} title="Duplicate group" aria-label="Duplicate group"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:text-teal-700 hover:bg-teal-50 transition-colors">
                      <Copy className="w-4 h-4" aria-hidden="true" /> Duplicate
                    </button>
                    {canManageSelected && !selected.is_protected && (
                      <button type="button" onClick={() => setDeleteTarget(selected)} title="Delete group" aria-label="Delete group"
                        className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <dl className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/60">
                {[
                  { label: 'Full edit', value: counts.edit, cls: 'text-emerald-600' },
                  { label: 'View only', value: counts.view, cls: 'text-sky-600' },
                  { label: 'No access', value: counts.none, cls: 'text-gray-500' },
                ].map((stat) => (
                  <div key={stat.label} className="px-5 py-3">
                    <dd className={`text-xl font-bold ${stat.cls}`}>{stat.value}</dd>
                    <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{stat.label}</dt>
                  </div>
                ))}
              </dl>

              {lockedReason && (
                <p className="px-5 py-3 text-xs text-amber-700 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {lockedReason}
                </p>
              )}
              {!canManageSelected && canManage && selected.id === ownGroupId && (
                <p className="px-5 py-3 text-xs text-amber-700 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  This is your own group. Only the Owner can change it.
                </p>
              )}
            </section>

            {/* Feature search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search features, e.g. diary, invoices, staff…"
                aria-label="Search features"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
              />
            </div>

            <FeatureSections
              activeMap={activeMap}
              savedMap={savedMap}
              canEdit={canManageSelected}
              ceiling={isOwner ? undefined : (permissionsMap as Record<string, AccessLevel>)}
              audience={selected ? (AUDIENCE_LABELS[selected.role_template] ?? 'Members of this group') : 'Members of this group'}
              query={query}
              onChange={setLevel}
              onSaveSection={saveSection}
              onDiscardSection={discardSection}
              savingSection={savingSection}
              extras={showBranchPanel || showPractitionerPanel || showStaffPanel ? {
                'Diary & Calendar': (
                  <>
                    {showBranchPanel && (
                      <BranchAccessPanel
                        level={(activeMap.diary_other_branches ?? 'none') as AccessLevel}
                        members={members}
                        allManagers={branchManagers}
                        branches={branches}
                        loading={staffLoading}
                        canEdit={isOwner}
                        onSave={handleBranchSave}
                      />
                    )}
                    {showStaffPanel && (
                      <StaffBranchPanel
                        members={staffMembers}
                        branches={branches}
                        scopeIds={practitionerScope}
                        loading={staffLoading}
                        onSave={handleStaffClinicsSave}
                      />
                    )}
                    {showPractitionerPanel && (
                      <PractitionerBranchPanel
                        members={practitioners}
                        branches={branches}
                        scopeIds={practitionerScope}
                        loading={staffLoading}
                        onSave={handlePractitionerSave}
                      />
                    )}
                  </>
                ),
              } : undefined}
            />
          </div>
        </div>
      )}

      <CreateGroupModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        allowedTemplates={isOwner ? undefined : BRANCH_MANAGER_MANAGEABLE_TEMPLATES}
      />
      <DeleteConfirmModal group={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
};

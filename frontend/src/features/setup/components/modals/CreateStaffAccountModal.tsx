import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, UserPlus, AlertCircle, Building2, RefreshCw, Clock, Plus, Trash2, Check, CheckCircle2, ShieldCheck, Stethoscope, Users, DollarSign, Crown, Eye, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CreateStaffData, StaffFormErrors, StaffMember, PractitionerRoleImpact, UserLookupResult } from '../../types/staff.types';
import type { DutySchedule, DutyDay, ShiftBlock } from '@/features/clinics/clinic.api';
import { TITLE_OPTIONS, GENDER_OPTIONS } from '../../types/staff.types';
import { useDisciplineOptions } from '../../hooks/useDisciplineOptions';
import { useClinicBranches } from '@/features/clinics/hooks/useClinicBranches';
import type { ClinicBranch } from '@/types/clinic';
import { validateEmailDetailed, validatePHPhoneDetailed } from '@/utils/validation';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { usePermissions } from '@/hooks/usePermissions';
import { PractitionerRemovalModal } from './PractitionerRemovalModal';
import { ClinicianLimitReachedModal, type ClinicianLimitInfo } from './ClinicianLimitReachedModal';
import { getPractitionerRoleImpact, lookupUserByEmail, updateStaff } from '../../services/StaffService';
import { emitPractitionerRemoved, emitPractitionerUpdated } from '@/events/practitionerEvents';
import { useAuthStore } from '@/store/auth.store';

// ── Clinical Role Cards ──────────────────────────────────────────────────────

type ClinicalRoleValue = 'OWNER' | 'BRANCH_MANAGER' | 'PRACTITIONER' | 'STAFF' | 'FINANCE' | 'READ_ONLY';

const ALL_CLINICAL_ROLES: {
  value: ClinicalRoleValue;
  label: string;
  description: string;
  icon: React.ElementType;
  ring: string;
  bg: string;
  /** If true, only admins (isOwner) can see + select this card */
  ownerOnly?: boolean;
  /** If true, only Owners can see this card (Branch Managers cannot create Branch Managers) */
  managerOnly?: boolean;
  /** Warning shown beneath role card when selected */
  warning?: string;
}[] = [
  {
    value: 'OWNER',
    label: 'Owner',
    description: 'Full system access',
    icon: Crown,
    ring: 'ring-amber-400',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    ownerOnly: true,
    warning: 'This user will have full system access. At least one Owner must always exist.',
  },
  {
    value: 'BRANCH_MANAGER',
    label: 'Branch Manager',
    description: 'Branch management & oversight',
    icon: ShieldCheck,
    ring: 'ring-violet-400',
    bg: 'bg-violet-50 text-violet-700 border-violet-200',
    /** Only Owner can create another Branch Manager. Branch Managers cannot create Branch Managers. */
    managerOnly: true,
  },
  {
    value: 'PRACTITIONER',
    label: 'Practitioner',
    description: 'Clinical & patient care',
    icon: Stethoscope,
    ring: 'ring-purple-400',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    value: 'STAFF',
    label: 'Staff',
    description: 'Front desk & operations',
    icon: Users,
    ring: 'ring-sky-400',
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    value: 'FINANCE',
    label: 'Finance',
    description: 'Billing, invoicing & reports',
    icon: DollarSign,
    ring: 'ring-green-400',
    bg: 'bg-green-50 text-green-700 border-green-200',
  },
  {
    value: 'READ_ONLY',
    label: 'Read-Only',
    description: 'View-only access',
    icon: Eye,
    ring: 'ring-gray-400',
    bg: 'bg-gray-100 text-gray-600 border-gray-300',
  },
];

const CLINICAL_ROLE_VALUES: ClinicalRoleValue[] = ALL_CLINICAL_ROLES.map(r => r.value);

const DUTY_DAY_OPTIONS: { value: DutyDay; label: string }[] = [
  { value: 'Mon', label: 'Mon' },
  { value: 'Tue', label: 'Tue' },
  { value: 'Wed', label: 'Wed' },
  { value: 'Thu', label: 'Thu' },
  { value: 'Fri', label: 'Fri' },
  { value: 'Sat', label: 'Sat' },
  { value: 'Sun', label: 'Sun' },
];

const DEFAULT_DUTY_DAYS: DutyDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/** Format time string (HH:MM or HH:MM:SS) into 12-hour format e.g. "9:00 AM" */
export const formatTime12h = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  const [hourStr, minuteStr = '00'] = timeStr.trim().split(':');
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${formattedHour}:${minuteStr} ${ampm}`;
};

/** Returns the conflicting pair if any two blocks overlap in time. */
const checkScheduleConflict = (blocks: ShiftBlock[]): { prev: ShiftBlock; curr: ShiftBlock } | null => {
  if (!blocks || blocks.length < 2) return null;
  const sorted = [...blocks].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].end > sorted[i + 1].start) {
      return { prev: sorted[i], curr: sorted[i + 1] };
    }
  }
  return null;
};

const makeDefaultSchedule = (days: DutyDay[], defaultBranchId: number | null = null): DutySchedule =>
  Object.fromEntries(days.map(d => [d, [{ start: '08:00', end: '17:00', branch_id: defaultBranchId }]])) as DutySchedule;

const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const h24 = String(i).padStart(2, '0');
      const m = String(j).padStart(2, '0');
      const ampm = i >= 12 ? 'PM' : 'AM';
      const h12 = i % 12 === 0 ? 12 : i % 12;
      const h12Str = String(h12).padStart(2, '0');
      options.push({
        value: `${h24}:${m}`,
        label: `${h12Str}:${m} ${ampm}`
      });
    }
  }
  // Also add 23:59 as a convenient end-of-day option
  options.push({ value: '23:59', label: '11:59 PM' });
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

/** Build a duty_schedule from editing staff data, reconstructing multi-branch blocks when available. */
const buildDutySchedule = (staff: StaffMember): DutySchedule => {
  // 1. Reconstruct from active branch assignments
  if (staff.branch_assignments && staff.branch_assignments.length > 0) {
    const activeAssignments = staff.branch_assignments.filter(b => b.is_active);
    const merged: Record<DutyDay, ShiftBlock[]> = {} as any;

    for (const ba of activeAssignments) {
      if (ba.duty_schedule && typeof ba.duty_schedule === 'object') {
        for (const [day, blocks] of Object.entries(ba.duty_schedule)) {
          const d = day as DutyDay;
          if (!merged[d]) merged[d] = [];
          for (const b of (blocks as ShiftBlock[])) {
            merged[d].push({
              start: b.start,
              end: b.end,
              branch_id: ba.branch_id,
              branch_name: ba.branch_name,
            });
          }
        }
      } else if (ba.duty_days && ba.duty_days.length > 0) {
        const start = ba.duty_start_time || '08:00';
        const end = ba.duty_end_time || '17:00';
        for (const day of ba.duty_days) {
          const d = day as DutyDay;
          if (!merged[d]) merged[d] = [];
          merged[d].push({
            start,
            end,
            branch_id: ba.branch_id,
            branch_name: ba.branch_name,
          });
        }
      }
    }
    if (Object.keys(merged).length > 0) {
      return merged;
    }
  }

  // 2. Direct duty_schedule fallback
  const rawSched = staff.duty_schedule || (staff.availability?.duty_schedule as DutySchedule) || null;
  if (rawSched && typeof rawSched === 'object') {
    const enriched: Record<DutyDay, ShiftBlock[]> = {} as any;
    for (const [day, blocks] of Object.entries(rawSched)) {
      const d = day as DutyDay;
      enriched[d] = (blocks as ShiftBlock[]).map(b => ({
        ...b,
        branch_id: b.branch_id ?? staff.clinic_branch ?? null,
      }));
    }
    return enriched;
  }

  // 3. Legacy single-window fallback
  const days: DutyDay[] = (
    staff.duty_days ?? staff.availability?.duty_days ?? DEFAULT_DUTY_DAYS
  ) as DutyDay[];
  const start = staff.availability?.duty_start_time ?? '08:00';
  const end   = staff.availability?.duty_end_time   ?? '17:00';
  const fallbackBranchId = staff.clinic_branch ?? null;
  return Object.fromEntries(
    days.map(d => [d, [{ start, end, branch_id: fallbackBranchId }]])
  ) as DutySchedule;
};

interface CreateStaffAccountModalProps {
  isOpen:          boolean;
  onClose:         () => void;
  onSubmit:        (data: CreateStaffData) => Promise<void>;
  editingStaff?:   StaffMember | null;
  /** ID of the currently logged-in user. Used to show the "Me" badge. */
  currentUserId?:  number;
  /** Optional branches passed from parent (e.g. ClinicSetupPage during onboarding) */
  branches?:       ClinicBranch[];
  /** Which Branch Manager manages each clinic (clinic id -> manager). A clinic can have only one. */
  branchManagers?: Record<number, { id: number; name: string }>;
}

const EMPTY_FORM: CreateStaffData = {
  first_name:    '',
  last_name:     '',
  middle_name:   '',
  nickname:      '',
  title:         'Mr',
  position:      '',
  discipline:    'OCCUPATIONAL_THERAPY',
  email:         '',
  phone:         '',
  address:       '',
  date_of_birth: '',
  gender:        'Male',
  roles:         ['STAFF'],
  clinic_branch: null,
  branch_ids:    [],
  // Availability defaults
  duty_days:        DEFAULT_DUTY_DAYS,
  lunch_start_time: '12:00',
  lunch_end_time:   '13:00',
  duty_schedule:    makeDefaultSchedule(DEFAULT_DUTY_DAYS),
};

/* ── Reusable field helpers ─────────────────────────────── */
const inputCls = (hasError?: boolean) =>
  `w-full border ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}
   rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2
   focus:ring-sky-400 focus:border-transparent transition`;

const selectCls =
  'w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition';

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    {children} {required && <span className="text-red-400">*</span>}
  </label>
);

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? <p className="mt-0.5 text-[11px] text-red-500">{msg}</p> : null;

const SectionTitle: React.FC<{ color?: string; children: React.ReactNode }> = ({
  color = 'text-sky-600', children,
}) => (
  <p className={`text-[11px] font-bold ${color} uppercase tracking-widest mb-3`}>
    {children}
  </p>
);

export const CreateStaffAccountModal: React.FC<CreateStaffAccountModalProps> = ({
  isOpen, onClose, onSubmit, editingStaff = null, currentUserId, branches: propBranches, branchManagers,
}) => {
  const isEditMode = !!editingStaff;
  const { isOwner, isBranchManager, managerBranches } = usePermissions();
  const currentUser = useAuthStore(s => s.user);

  // Multi-role helpers
  const isMe = !!(editingStaff && currentUserId && editingStaff.id === currentUserId);
  // Original roles array of the staff being edited (for submit payload preservation)
  const originalRolesRef = useRef<string[]>([]);

  // Phase 6/7: Filter role cards based on the actor's authority.
  // Owner: sees all cards (including OWNER and BRANCH_MANAGER/Branch Manager).
  // Branch Manager: can see operational roles only — cannot create Owner or another Branch Manager.
  // Others: only see operational roles.
  const visibleClinicalRoles = ALL_CLINICAL_ROLES.filter(r => {
    if (r.ownerOnly && !isOwner)   return false;  // OWNER card: Owner only
    if (r.managerOnly && !isOwner) return false;  // Branch Manager card: Owner only (Branch Managers cannot create Branch Managers)
    return true;
  });

  const [formData, setFormData] = useState<CreateStaffData>(EMPTY_FORM);
  const [errors, setErrors]     = useState<StaffFormErrors>({});
  const [loading, setLoading]   = useState(false);

  // ── Practitioner removal confirmation state ────────────────────────────────
  // When the admin removes the PRACTITIONER role we intercept the submit,
  // fetch the impact counts, and surface a confirmation modal.  The pending
  // payload is stored here so we can re-fire it once confirmed.
  const [showRemovalModal, setShowRemovalModal]   = useState(false);
  const [removalImpact, setRemovalImpact]         = useState<PractitionerRoleImpact | null>(null);
  const [removalLoading, setRemovalLoading]       = useState(false);
  const pendingPayloadRef = useRef<(CreateStaffData & { confirm_practitioner_removal?: boolean }) | null>(null);

  // ── Clinician capacity limit modal state (Strict Sharp Corners) ────────────
  const [showClinicianLimitModal, setShowClinicianLimitModal] = useState(false);
  const [clinicianLimitInfo, setClinicianLimitInfo]           = useState<ClinicianLimitInfo | null>(null);

  // ── Multi-Branch: Existing practitioner detection state ─────────────────────
  const [existingUserMatch, setExistingUserMatch] = useState<UserLookupResult['user'] | null>(null);
  const [isLookingUpEmail, setIsLookingUpEmail]   = useState(false);
  const lookupDebounceRef = useRef<any>(null);

  const isAlreadyAssignedToSelectedBranch = Boolean(
    existingUserMatch &&
    formData.clinic_branch &&
    existingUserMatch.assigned_branch_ids?.includes(Number(formData.clinic_branch))
  );

  // ── Discipline create-inline state ─────────────────────────────────────────
  const [showCreateDiscipline, setShowCreateDiscipline] = useState(false);
  const [newDisciplineLabel, setNewDisciplineLabel]     = useState('');
  const newDisciplineInputRef = useRef<HTMLInputElement>(null);
  const { allOptions: disciplineOptions, addDiscipline } = useDisciplineOptions();

  const handleAddDiscipline = () => {
    const created = addDiscipline(newDisciplineLabel);
    if (!created) {
      toast.error('Please enter a discipline name.');
      return;
    }
    set('discipline', created.value);
    setNewDisciplineLabel('');
    setShowCreateDiscipline(false);
  };

  const { branches: fetchedBranches, loading: loadingBranches } = useClinicBranches();

  const branches = useMemo(() => {
    return propBranches && propBranches.length > 0 ? propBranches : fetchedBranches;
  }, [propBranches, fetchedBranches]);

  // Multi-branch scheduling helpers
  const availableBranches = useMemo(() => {
    if (isOwner) return branches;
    if (isBranchManager) {
      if (managerBranches && managerBranches.length > 0) return managerBranches as any[];
      if (currentUser?.clinic_branch) return branches.filter(b => b.id === currentUser.clinic_branch);
      return branches;
    }
    if (currentUser?.clinic_branch) return branches.filter(b => b.id === currentUser.clinic_branch);
    return branches;
  }, [isOwner, isBranchManager, branches, managerBranches, currentUser?.clinic_branch]);

  const defaultBranchId = useMemo(() => {
    if (formData.clinic_branch) return Number(formData.clinic_branch);
    if (isBranchManager && !isOwner) {
      if (currentUser?.clinic_branch) return currentUser.clinic_branch;
      if (managerBranches && managerBranches.length > 0) return managerBranches[0].id;
    }
    if (availableBranches.length > 0) return availableBranches[0].id;
    if (branches.length > 0) return branches[0].id;
    return null;
  }, [formData.clinic_branch, isBranchManager, isOwner, currentUser?.clinic_branch, managerBranches, availableBranches, branches]);

  const uniqueAssignedBranchIds = useMemo(() => {
    const ids = new Set<number>();
    const effectiveDefault = defaultBranchId ?? availableBranches[0]?.id ?? branches[0]?.id ?? null;
    if (formData.duty_schedule) {
      for (const day of (formData.duty_days ?? [])) {
        const blocks = formData.duty_schedule[day] ?? [];
        for (const b of blocks) {
          const bId = b.branch_id ?? effectiveDefault;
          if (bId) ids.add(Number(bId));
        }
      }
    }
    if (ids.size === 0) {
      const bId = formData.clinic_branch ?? effectiveDefault;
      if (bId) ids.add(Number(bId));
    }
    return Array.from(ids);
  }, [formData.duty_schedule, formData.duty_days, formData.clinic_branch, defaultBranchId, availableBranches, branches]);

  // Keep blocks populated with a default branch_id once branches are loaded
  useEffect(() => {
    if (!defaultBranchId) return;
    setFormData(prev => {
      let changed = false;
      let nextClinicBranch = prev.clinic_branch;
      if (!nextClinicBranch) {
        nextClinicBranch = defaultBranchId;
        changed = true;
      }
      if (!prev.duty_schedule) {
        return changed ? { ...prev, clinic_branch: nextClinicBranch } : prev;
      }
      const nextSchedule: DutySchedule = {};
      for (const [day, blocks] of Object.entries(prev.duty_schedule)) {
        nextSchedule[day as DutyDay] = blocks.map(b => {
          if (!b.branch_id) {
            changed = true;
            return { ...b, branch_id: defaultBranchId };
          }
          return b;
        });
      }
      if (!changed) return prev;
      return {
        ...prev,
        clinic_branch: nextClinicBranch,
        duty_schedule: nextSchedule,
      };
    });
  }, [defaultBranchId]);

  // A Branch Manager may place new staff in ANY clinic they manage. Default to their primary clinic when
  // they manage it (else the first one they manage), and keep whatever they pick afterwards.
  useEffect(() => {
    if (!isEditMode && isBranchManager && !isOwner && managerBranches.length > 0) {
      const managedIds = managerBranches.map(b => b.id);
      const primary = currentUser?.clinic_branch;
      const fallback = primary && managedIds.includes(primary) ? primary : managedIds[0];
      setFormData(prev => {
        const keep = prev.clinic_branch && managedIds.includes(Number(prev.clinic_branch));
        const chosen = keep ? Number(prev.clinic_branch) : fallback;
        return { ...prev, clinic_branch: chosen, branch_ids: [chosen] };
      });
    }
  }, [isEditMode, isBranchManager, isOwner, currentUser?.clinic_branch, managerBranches]);

  // Debounced lookup for existing practitioner by email
  useEffect(() => {
    if (isEditMode) return;
    const email = (formData.email || '').trim().toLowerCase();
    if (!email || !email.includes('@') || email.length < 5) {
      setExistingUserMatch(null);
      return;
    }

    if (lookupDebounceRef.current) {
      clearTimeout(lookupDebounceRef.current);
    }

    lookupDebounceRef.current = setTimeout(async () => {
      try {
        setIsLookingUpEmail(true);
        const res = await lookupUserByEmail(email);
        if (res.found && res.user && res.user.is_practitioner) {
          setExistingUserMatch(res.user);
          setFormData(prev => ({
            ...prev,
            first_name: res.user!.first_name,
            last_name: res.user!.last_name,
            phone: res.user!.phone || prev.phone,
            discipline: res.user!.discipline || prev.discipline,
            roles: ['PRACTITIONER'],
          }));
        } else {
          setExistingUserMatch(null);
        }
      } catch (err) {
        setExistingUserMatch(null);
      } finally {
        setIsLookingUpEmail(false);
      }
    }, 450);

    return () => {
      if (lookupDebounceRef.current) clearTimeout(lookupDebounceRef.current);
    };
  }, [formData.email, isEditMode]);

  useEffect(() => {
    if (editingStaff) {
      // Compute effective roles (multi-role aware)
      const effectiveRoles: string[] =
        editingStaff.roles && editingStaff.roles.length > 0
          ? editingStaff.roles
          : [editingStaff.role];
      // Cache original roles for submit preservation
      originalRolesRef.current = effectiveRoles;

      // Extract only the clinical roles (those selectable in the multi-role cards).
      const clinicalRoles = effectiveRoles.filter(r =>
        CLINICAL_ROLE_VALUES.includes(r as ClinicalRoleValue)
      ) as ClinicalRoleValue[];
      const displayRoles: ClinicalRoleValue[] = clinicalRoles.length > 0 ? clinicalRoles : ['STAFF'];

      setFormData({
        first_name:    editingStaff.first_name,
        last_name:     editingStaff.last_name,
        middle_name:   editingStaff.middle_name   ?? '',
        nickname:      editingStaff.nickname       ?? '',
        title:         editingStaff.title          ?? 'Mr',
        position:      editingStaff.position       ?? '',
        discipline:    editingStaff.discipline || 'OCCUPATIONAL_THERAPY',
        email:         editingStaff.email,
        phone:         editingStaff.phone || '',
        address:       editingStaff.address        ?? '',
        date_of_birth: editingStaff.date_of_birth  ?? '',
        gender:        editingStaff.gender         ?? 'Male',
        roles:         displayRoles,
        clinic_branch: editingStaff.clinic_branch  ?? null,
        branch_ids:    editingStaff.manager_branches ? editingStaff.manager_branches.map((b: any) => b.id) : [],
        // Only the Owner may send this field (the backend rejects it from anyone else).
        ...(isOwner ? { extra_diary_branch_ids: (editingStaff.extra_diary_branches ?? []).map((b) => b.id) } : {}),
        // Availability
        duty_days:        (editingStaff.duty_days ?? editingStaff.availability?.duty_days ?? DEFAULT_DUTY_DAYS) as DutyDay[],
        lunch_start_time: editingStaff.lunch_start_time ?? editingStaff.availability?.lunch_start_time ?? '12:00',
        lunch_end_time:   editingStaff.lunch_end_time   ?? editingStaff.availability?.lunch_end_time   ?? '13:00',
        duty_schedule:    buildDutySchedule(editingStaff),
      });
    } else {
      originalRolesRef.current = [];
      const initialBranchId = defaultBranchId ?? availableBranches[0]?.id ?? branches[0]?.id ?? null;
      setFormData({
        ...EMPTY_FORM,
        clinic_branch: initialBranchId,
        duty_schedule: makeDefaultSchedule(DEFAULT_DUTY_DAYS, initialBranchId),
      });
    }
    setExistingUserMatch(null);
    setErrors({});
  }, [editingStaff, isOpen, defaultBranchId]);

  const validateForm = (): boolean => {
    const e: StaffFormErrors = {};
    if (!formData.first_name.trim()) e.first_name = 'First name is required';
    if (!formData.last_name.trim())  e.last_name  = 'Last name is required';
    if (!formData.roles || formData.roles.length === 0) e.general = 'Select at least one clinical role';

    const emailErr = validateEmailDetailed(formData.email);
    if (emailErr) e.email = emailErr;

    const phoneErr = validatePHPhoneDetailed(formData.phone);
    if (phoneErr) e.phone = phoneErr;

    if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date())
      e.date_of_birth = 'Date of birth cannot be in the future';

    const isPractitioner = (formData.roles ?? []).includes('PRACTITIONER');
    const effectiveDefaultBranch = defaultBranchId ?? availableBranches[0]?.id ?? branches[0]?.id ?? null;

    // Branch is required for all roles — every user must be scoped to a branch.
    // For Branch Managers, we auto-inject their branch, bypassing UI-level requirement checks here.
    if (!isBranchManager || isOwner) {
      const isManagerRole = (formData.roles ?? []).includes('BRANCH_MANAGER');
      if (isManagerRole) {
        if (!formData.branch_ids || formData.branch_ids.length === 0) {
          e.clinic_branch = 'A Branch Manager must be assigned to at least one branch.';
        }
      } else if (isPractitioner) {
        if (uniqueAssignedBranchIds.length === 0 && !formData.clinic_branch && !effectiveDefaultBranch) {
          e.clinic_branch = 'Please assign at least one branch in the schedule.';
        }
      } else {
        if (!formData.clinic_branch && !effectiveDefaultBranch) e.clinic_branch = 'Branch assignment is required.';
      }
    }

    // Availability validation (for PRACTITIONER role only)
    if (isPractitioner) {
      if (!formData.duty_days || formData.duty_days.length === 0)
        e.duty_days = 'At least one duty day is required';
      // Validate per-day blocks
      if (formData.duty_schedule) {
        for (const day of (formData.duty_days ?? [])) {
          const blocks = formData.duty_schedule[day] ?? [];
          if (blocks.length === 0) {
            e.duty_schedule = `${day}: At least one working period is required.`;
            break;
          }
          for (const block of blocks) {
            if (!block.start || !block.end) {
              e.duty_schedule = `${day}: Every working period must have a start and end time.`;
              break;
            }
            if (block.start >= block.end) {
              e.duty_schedule = `${day}: Period end time must be after start time (${formatTime12h(block.start)} – ${formatTime12h(block.end)}).`;
              break;
            }
            const blockBranch = block.branch_id ?? effectiveDefaultBranch;
            if (!blockBranch) {
              e.duty_schedule = `${day}: Every working period must have an assigned branch.`;
              break;
            }
          }
          if (e.duty_schedule) break;
          const conflict = checkScheduleConflict(blocks);
          if (conflict) {
            const prevBranchName = conflict.prev.branch_name || branches.find(b => b.id === (conflict.prev.branch_id ?? effectiveDefaultBranch))?.name;
            const currBranchName = conflict.curr.branch_name || branches.find(b => b.id === (conflict.curr.branch_id ?? effectiveDefaultBranch))?.name;
            const prevBranchStr = prevBranchName ? ` (${prevBranchName})` : '';
            const currBranchStr = currBranchName ? ` (${currBranchName})` : '';
            e.duty_schedule = `${day}: Working periods overlap: ${formatTime12h(conflict.prev.start)}–${formatTime12h(conflict.prev.end)}${prevBranchStr} and ${formatTime12h(conflict.curr.start)}–${formatTime12h(conflict.curr.end)}${currBranchStr}. Shifts cannot overlap.`;
            break;
          }
        }
      }
      if (!formData.lunch_start_time) e.lunch_start_time = 'Required';
      if (!formData.lunch_end_time)   e.lunch_end_time   = 'Required';
    }

    setErrors(e);
    if (Object.keys(e).length > 0) {
      console.error('[CreateStaffAccountModal] Validation Failed! Errors:', e);
      console.log('[CreateStaffAccountModal] Current formData:', formData);
    }
    return Object.keys(e).length === 0;
  };

  // ── Core submit helper (shared by direct submit & confirmed removal) ────────
  const executeSubmit = async (
    payload: CreateStaffData & { confirm_practitioner_removal?: boolean }
  ) => {
    try {
      await onSubmit(payload as CreateStaffData);
      const targetUserId = (payload as any).id ?? (payload as any).existing_user_id ?? editingStaff?.id;
      if (targetUserId) {
        emitPractitionerUpdated(targetUserId, editingStaff?.practitioner_id ?? null);
      }
      handleClose();
    } catch (err: any) {
      const data = err?.response?.data as Record<string, any> | undefined;
      console.log('[DEBUG-MODAL] Error Data:', data);

      if (data?.error === 'CLINICIAN_LIMIT_REACHED' || data?.code === 'CLINICIAN_LIMIT_REACHED') {
        // Intercept clinician limit capacity error and trigger sharp geometric modal
        setClinicianLimitInfo({
          current_allocations: data.current_allocations,
          allowed_allocations: data.allowed_allocations,
          archived_allocations: data.archived_allocations,
          archived_practitioners: data.archived_practitioners,
          plan_code: data.plan_code,
          detail: data.detail,
        });
        setShowClinicianLimitModal(true);
        throw err;
      }

      if (data) {
        const mapped: StaffFormErrors = {};
        const pick = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);
        if (data.email)  mapped.email  = pick(data.email);
        if (data.phone)  mapped.phone  = pick(data.phone);
        if (data.branch_ids) mapped.general = pick(data.branch_ids);
        if (data.detail) mapped.general = pick(data.detail);
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
          if (mapped.email)        toast.error(mapped.email,   { id: 'staff-email-error' });
          else if (mapped.phone)   toast.error(mapped.phone,   { id: 'staff-phone-error' });
          else if (mapped.general) toast.error(mapped.general);
        } else {
          const msg = err.message || 'Failed to save. Please try again.';
          setErrors({ general: msg });
          toast.error(msg);
        }
      } else {
        const msg = err.message || 'Failed to save. Please try again.';
        setErrors({ general: msg });
        toast.error(msg);
      }
      throw err; // re-throw so callers can reset loading state
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[CreateStaffAccountModal] Logging before submit:', {
      role: isOwner ? 'Owner' : isBranchManager ? 'Branch Manager' : 'Staff',
      userBranch: currentUser?.clinic_branch,
      payload: formData
    });

    if (!validateForm()) {
      toast.error('Please fix the highlighted errors before submitting.', { id: 'staff-validation' });
      return;
    }

    // ── Multi-Branch Assignment: Existing Practitioner Detected ───────────────
    if (existingUserMatch) {
      const effectiveDefaultBranch = defaultBranchId ?? availableBranches[0]?.id ?? branches[0]?.id ?? null;
      const primaryBranch = uniqueAssignedBranchIds.length > 0
        ? uniqueAssignedBranchIds[0]
        : (formData.clinic_branch ? Number(formData.clinic_branch) : effectiveDefaultBranch);

      if (!primaryBranch) {
        toast.error('Please configure at least one branch in the schedule.');
        return;
      }

      setLoading(true);
      try {
        let sanitizedSchedule = formData.duty_schedule;
        if (formData.duty_schedule) {
          sanitizedSchedule = {};
          const fallbackBid = primaryBranch ?? effectiveDefaultBranch;
          for (const [day, blocks] of Object.entries(formData.duty_schedule)) {
            sanitizedSchedule[day as DutyDay] = blocks.map(b => ({
              ...b,
              branch_id: b.branch_id ?? fallbackBid,
            }));
          }
        }

        const payloadToSave: CreateStaffData & { id?: number; existing_user_id?: number } = {
          ...formData,
          clinic_branch: primaryBranch,
          duty_schedule: sanitizedSchedule,
          roles: ['PRACTITIONER'],
          id: existingUserMatch.id,
          existing_user_id: existingUserMatch.id,
        };

        await updateStaff(existingUserMatch.id, payloadToSave);
        toast.success(`Updated Dr. ${existingUserMatch.name}'s schedule and branch assignments successfully!`);
        emitPractitionerUpdated(existingUserMatch.id, existingUserMatch.practitioner_id ?? null);
        handleClose();
      } catch (err: any) {
        const data = err?.response?.data;
        if (data?.error === 'CLINICIAN_LIMIT_REACHED' || data?.code === 'CLINICIAN_LIMIT_REACHED') {
          setClinicianLimitInfo({
            current_allocations: data.current_allocations,
            allowed_allocations: data.allowed_allocations,
            archived_allocations: data.archived_allocations,
            archived_practitioners: data.archived_practitioners,
            plan_code: data.plan_code,
            detail: data.detail,
          });
          setShowClinicianLimitModal(true);
        } else {
          toast.error(data?.detail || err.message || 'Failed to update practitioner schedule.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Rebuild the full roles array: preserve non-clinical roles that aren't
    // selectable in the card UI (none currently), then add all selected
    // clinical roles. OWNER is now a selectable card so it flows through
    // the standard clinical-roles path.
    const preservedRoles = originalRolesRef.current.filter(
      r => !CLINICAL_ROLE_VALUES.includes(r as ClinicalRoleValue)
    );
    const finalRoles = [...preservedRoles, ...(formData.roles ?? ['STAFF'])];

    const isPractitionerRole = finalRoles.includes('PRACTITIONER');
    const effectiveDefaultBranch = defaultBranchId ?? availableBranches[0]?.id ?? branches[0]?.id ?? null;
    const primaryBranch = isPractitionerRole
      ? (uniqueAssignedBranchIds.length > 0 ? uniqueAssignedBranchIds[0] : (formData.clinic_branch ?? effectiveDefaultBranch))
      : (formData.clinic_branch ?? effectiveDefaultBranch);

    let sanitizedSchedule = formData.duty_schedule;
    if (isPractitionerRole && formData.duty_schedule) {
      sanitizedSchedule = {};
      const fallbackBid = primaryBranch ?? effectiveDefaultBranch;
      for (const [day, blocks] of Object.entries(formData.duty_schedule)) {
        sanitizedSchedule[day as DutyDay] = blocks.map(b => ({
          ...b,
          branch_id: b.branch_id ?? fallbackBid,
        }));
      }
    }

    const scheduleDays = Object.keys(sanitizedSchedule || {}) as DutyDay[];
    const combinedDutyDays = Array.from(new Set([...(formData.duty_days || []), ...scheduleDays]));

    const payload: CreateStaffData & { confirm_practitioner_removal?: boolean } = {
      ...formData,
      clinic_branch: primaryBranch,
      duty_days: isPractitionerRole && combinedDutyDays.length > 0 ? combinedDutyDays : formData.duty_days,
      duty_schedule: isPractitionerRole ? sanitizedSchedule : formData.duty_schedule,
      phone: formData.phone,
      roles: finalRoles as CreateStaffData['roles'],
    };

    // ── Detect PRACTITIONER role removal ─────────────────────────────────────
    // If we are in edit mode and PRACTITIONER was in the original roles but
    // is NOT in the new roles, we must confirm before submitting because the
    // backend will delete future scheduling data.
    const hadPractitioner  = originalRolesRef.current.includes('PRACTITIONER');
    const hasPractitioner  = finalRoles.includes('PRACTITIONER');
    const removingPractitioner = isEditMode && hadPractitioner && !hasPractitioner;

    if (removingPractitioner && editingStaff) {
      setLoading(true);
      try {
        const impact = await getPractitionerRoleImpact(editingStaff.id);
        if (impact.has_impact) {
          // Store payload for the confirmed re-submit and surface the modal
          pendingPayloadRef.current = payload;
          setRemovalImpact(impact);
          setShowRemovalModal(true);
          return; // don't submit yet — wait for confirmation
        }
        // No future data to clean up — proceed immediately (no modal needed)
        await executeSubmit(payload);
      } catch (err: any) {
        // If the impact check itself fails, fall through to a normal submit
        // attempt so the user isn't silently blocked.
        console.warn('[CreateStaffAccountModal] impact check failed, proceeding:', err);
        await executeSubmit(payload);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal (non-practitioner-removal) submit path
    setLoading(true);
    setErrors({});
    try {
      await executeSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  // Called when the admin confirms in the PractitionerRemovalModal
  const handleRemovalConfirm = async () => {
    const payload = pendingPayloadRef.current;
    if (!payload) return;
    setRemovalLoading(true);
    try {
      await executeSubmit({ ...payload, confirm_practitioner_removal: true });
      setShowRemovalModal(false);
      pendingPayloadRef.current = null;

      // Notify Calendar / Diary to immediately refetch all scheduling data.
      // This clears appointments, block-outs and notes for the former
      // practitioner from the live calendar view without a page reload.
      const userId = editingStaff?.id ?? null;
      const practitionerId = removalImpact?.practitioner_id ?? null;
      if (userId !== null) {
        emitPractitionerRemoved(userId, practitionerId);
      }
    } finally {
      setRemovalLoading(false);
    }
  };

  const handleRemovalCancel = () => {
    setShowRemovalModal(false);
    pendingPayloadRef.current = null;
    setRemovalImpact(null);
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setExistingUserMatch(null);
    setErrors({});
    onClose();
  };

  const set = <K extends keyof CreateStaffData>(field: K, value: CreateStaffData[K]) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  // ── Split-shift schedule handlers ──────────────────────────────────────────
  const toggleDutyDay = (day: DutyDay) => {
    const currentDays = formData.duty_days ?? [];
    const isActive = currentDays.includes(day);
    if (isActive) {
      const newDays = currentDays.filter(d => d !== day);
      const newSchedule = { ...(formData.duty_schedule ?? {}) } as DutySchedule;
      delete newSchedule[day];
      setFormData(prev => ({
        ...prev,
        duty_days: newDays,
        duty_schedule: Object.keys(newSchedule).length > 0 ? newSchedule : null,
      }));
    } else {
      const newDays = [...currentDays, day];
      const existing = formData.duty_schedule ?? {};
      const fallbackBid = defaultBranchId ?? availableBranches[0]?.id ?? branches[0]?.id ?? null;
      const newSchedule: DutySchedule = {
        ...existing,
        [day]: (existing[day] ?? [{ start: '08:00', end: '17:00', branch_id: fallbackBid }]),
      };
      setFormData(prev => ({ ...prev, duty_days: newDays, duty_schedule: newSchedule }));
    }
  };

  const addBlock = (day: DutyDay) => {
    const fallbackBid = defaultBranchId ?? availableBranches[0]?.id ?? branches[0]?.id ?? null;
    const existing = formData.duty_schedule ?? {};
    const blocks = existing[day] ?? [{ start: '08:00', end: '17:00', branch_id: fallbackBid }];
    const lastBlock = blocks[blocks.length - 1];
    const [h, m] = (lastBlock?.end ?? '08:00').split(':').map(Number);
    const newH = Math.min(h + 1, 23);
    const newBlock: ShiftBlock = {
      start: `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      end:   `${String(Math.min(newH + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      branch_id: lastBlock?.branch_id ?? fallbackBid,
    };
    setFormData(prev => ({
      ...prev,
      duty_schedule: { ...existing, [day]: [...blocks, newBlock] },
    }));
  };

  const removeBlock = (day: DutyDay, idx: number) => {
    const existing = formData.duty_schedule ?? {};
    const blocks = (existing[day] ?? []).filter((_: ShiftBlock, i: number) => i !== idx);
    const newSchedule = { ...existing, [day]: blocks } as DutySchedule;
    setFormData(prev => ({ ...prev, duty_schedule: newSchedule }));
  };

  const updateBlock = (day: DutyDay, idx: number, field: 'start' | 'end' | 'branch_id', value: any) => {
    const existing = formData.duty_schedule ?? {};
    const blocks = [...(existing[day] ?? [])];
    const val = field === 'branch_id' ? (value ? Number(value) : null) : value;
    blocks[idx] = { ...blocks[idx], [field]: val };
    setFormData(prev => ({ ...prev, duty_schedule: { ...existing, [day]: blocks } }));
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Top accent bar ── */}
          <div className="h-1.5 w-full bg-sky-500 rounded-t-2xl" />

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">
                    {isEditMode ? 'Edit Staff Account' : 'New Staff Member'}
                  </h2>
                  {isMe && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 leading-none">
                      Me
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {isEditMode
                    ? `Editing ${editingStaff?.first_name} ${editingStaff?.last_name}`
                    : 'Add a new staff member to your practice'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-4">

              {/* General error */}
              {errors.general && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.general}
                </div>
              )}

              {/* Info notice — create mode only */}
              {!isEditMode && (
                <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-sky-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    A temporary password will be auto-generated and sent to the staff member's
                    email. They must change it on first login.
                  </span>
                </div>
              )}

              {/* ════════════════════════════════════════
                  SECTION 1 — Personal Information
              ════════════════════════════════════════ */}
              <div>
                <SectionTitle color="text-sky-600">Personal Information</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

                  {/* Title */}
                  <div>
                    <Label required>Title</Label>
                    <select
                      value={formData.title}
                      onChange={e => set('title', e.target.value as any)}
                      className={selectCls}
                    >
                      {TITLE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <Label>Gender</Label>
                    <select
                      value={formData.gender}
                      onChange={e => set('gender', e.target.value as any)}
                      className={selectCls}
                    >
                      {GENDER_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* First Name */}
                  <div>
                    <Label required>First Name</Label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={e => set('first_name', e.target.value)}
                      placeholder="John"
                      className={inputCls(!!errors.first_name)}
                    />
                    <FieldError msg={errors.first_name} />
                  </div>

                  {/* Last Name */}
                  <div>
                    <Label required>Last Name</Label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={e => set('last_name', e.target.value)}
                      placeholder="Doe"
                      className={inputCls(!!errors.last_name)}
                    />
                    <FieldError msg={errors.last_name} />
                  </div>

                  {/* Middle Name */}
                  <div>
                    <Label>Middle Name</Label>
                    <input
                      type="text"
                      value={formData.middle_name}
                      onChange={e => set('middle_name', e.target.value)}
                      placeholder="Optional"
                      className={inputCls()}
                    />
                  </div>

                  {/* Nickname */}
                  <div>
                    <Label>Nickname</Label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={e => set('nickname', e.target.value)}
                      placeholder="Optional"
                      className={inputCls()}
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <Label>Date of Birth</Label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={e => set('date_of_birth', e.target.value)}
                      className={inputCls(!!errors.date_of_birth)}
                    />
                    <FieldError msg={errors.date_of_birth} />
                  </div>

                </div>
              </div>

              {/* ════════════════════════════════════════
                  SECTION 2 — Professional Information
              ════════════════════════════════════════ */}
              <div>
                <SectionTitle color="text-slate-500">Professional Information</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

                  {/* ── Clinical Role (multi-select cards) — FIRST ── */}
                  <div className="md:col-span-2">
                    <Label required>Clinical Role</Label>

                    {/* READ-ONLY notice banner */}
                    {(formData.roles ?? []).includes('READ_ONLY') && !(formData.roles ?? []).some(r => r !== 'READ_ONLY') && (
                      <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                        <Eye className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-xs text-gray-600">
                          Read-Only users can view allowed modules but cannot create, edit, or delete anything.
                        </span>
                      </div>
                    )}

                    {/* OWNER promotion warning */}
                    {(formData.roles ?? []).includes('OWNER') && (
                      <div className="flex items-center gap-2 mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-xs text-amber-700">
                          This user will have <strong>full system access</strong>. At least one Owner must always exist.
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {visibleClinicalRoles.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = (formData.roles ?? []).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const current = formData.roles ?? [];
                              const next = isSelected
                                ? current.filter(r => r !== opt.value)
                                : [...current, opt.value];
                              setFormData(prev => ({ ...prev, roles: next.length > 0 ? next : [opt.value] }));
                            }}
                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                              isSelected
                                ? `${opt.bg} ring-2 ${opt.ring}`
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-gray-400'}`} />
                            <span className="text-xs font-semibold leading-tight text-center">{opt.label}</span>
                            <span className={`text-[10px] leading-tight text-center ${isSelected ? 'opacity-80' : 'text-gray-400'}`}>{opt.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <Label>Position</Label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={e => set('position', e.target.value)}
                      placeholder="e.g. Clinic Desk, Office Manager"
                      className={inputCls(!!errors.position)}
                    />
                    <FieldError msg={errors.position} />
                  </div>

                  {/* Discipline — only shown for PRACTITIONER */}
                  {(formData.roles ?? []).includes('PRACTITIONER') && (
                    <div>
                      <Label required>Discipline</Label>
                      {showCreateDiscipline ? (
                        <div className="space-y-2">
                          <input
                            ref={newDisciplineInputRef}
                            type="text"
                            value={newDisciplineLabel}
                            onChange={e => setNewDisciplineLabel(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); handleAddDiscipline(); }
                              if (e.key === 'Escape') { setShowCreateDiscipline(false); setNewDisciplineLabel(''); }
                            }}
                            placeholder="e.g. Psychology"
                            className={inputCls()}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleAddDiscipline}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowCreateDiscipline(false); setNewDisciplineLabel(''); }}
                              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select
                          value={formData.discipline ?? ''}
                          onChange={e => {
                            if (e.target.value === '__CREATE__') {
                              setShowCreateDiscipline(true);
                            } else {
                              set('discipline', e.target.value);
                            }
                          }}
                          className={selectCls}
                        >
                          {disciplineOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                          <option disabled className="text-gray-300">──────────────</option>
                          <option value="__CREATE__">➕ Create Discipline...</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* ── Availability Section (for PRACTITIONER only) ── */}
                  {(formData.roles ?? []).includes('PRACTITIONER') && (
                    <div className="md:col-span-2 border-t border-gray-200 pt-5">
                      <SectionTitle color="text-emerald-600">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Practitioner Schedule
                        </span>
                      </SectionTitle>

                      {/* Duty Days */}
                      <div className="mb-4">
                        <Label required>Duty Days</Label>
                        <div className="flex flex-wrap gap-2">
                          {DUTY_DAY_OPTIONS.map(day => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDutyDay(day.value)}
                              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                                (formData.duty_days ?? []).includes(day.value)
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400'
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                        {errors.duty_days && <FieldError msg={errors.duty_days} />}
                      </div>

                      {/* Per-day shift blocks */}
                      <div className="space-y-3 mb-4">
                        {DUTY_DAY_OPTIONS.filter(d => (formData.duty_days ?? []).includes(d.value)).map(day => {
                          const blocks = formData.duty_schedule?.[day.value] ?? [{ start: '08:00', end: '17:00', branch_id: defaultBranchId }];
                          return (
                            <div key={day.value} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                              <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  {day.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addBlock(day.value)}
                                  className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors border border-emerald-200/60 bg-white"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add Working Period
                                </button>
                              </div>
                              <div className="space-y-2">
                                {blocks.map((block: ShiftBlock, idx: number) => {
                                  const blockBranchId = block.branch_id ?? defaultBranchId;
                                  return (
                                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-2xs">
                                      <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                        <select
                                          value={block.start}
                                          onChange={e => updateBlock(day.value, idx, 'start', e.target.value)}
                                          className="flex-1 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                                        >
                                          {TIME_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                        <span className="text-gray-400 text-xs shrink-0 font-bold">–</span>
                                        <select
                                          value={block.end}
                                          onChange={e => updateBlock(day.value, idx, 'end', e.target.value)}
                                          className="flex-1 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                                        >
                                          {TIME_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="flex items-center gap-1.5 flex-1 min-w-[170px]">
                                        <span className="text-xs text-gray-400 shrink-0 font-medium">at</span>
                                        <select
                                          value={blockBranchId ?? ''}
                                          onChange={e => updateBlock(day.value, idx, 'branch_id', Number(e.target.value))}
                                          className="flex-1 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                                        >
                                          <option value="" disabled>Select branch</option>
                                          {availableBranches.map(b => (
                                            <option key={b.id} value={b.id}>
                                              {b.name}{b.is_main_branch ? ' (Main)' : ''}{b.city ? ` · ${b.city}` : ''}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <button
                                        type="button"
                                        disabled={blocks.length === 1}
                                        onClick={() => removeBlock(day.value, idx)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                                        title="Remove working period"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {errors.duty_schedule && <FieldError msg={errors.duty_schedule} />}

                      {/* Configured Branch Assignments Summary Card */}
                      {uniqueAssignedBranchIds.length > 0 && (
                        <div className="mb-4 p-3.5 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-bold text-emerald-900 tracking-wide uppercase">
                                Configured Branch Assignments ({uniqueAssignedBranchIds.length})
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                              {uniqueAssignedBranchIds.length} Clinician {uniqueAssignedBranchIds.length === 1 ? 'Seat' : 'Seats'}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800/80 mb-2.5">
                            The practitioner will have working hours at each configured branch. Multiple periods at the same branch reuse the single assignment.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {uniqueAssignedBranchIds.map(bId => {
                              const branchObj = branches.find(b => b.id === bId) || (managerBranches as any[])?.find(b => b.id === bId);
                              const workingDays = (formData.duty_days ?? []).filter(day => {
                                const blocks = formData.duty_schedule?.[day] ?? [];
                                return blocks.some(b => (b.branch_id ?? defaultBranchId) === bId);
                              });
                              return (
                                <div key={bId} className="flex items-start gap-2 p-2 bg-white/90 border border-emerald-100 rounded-lg text-xs shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">
                                      {branchObj?.name || `Branch #${bId}`}
                                      {branchObj?.is_main_branch && <span className="ml-1 text-[10px] text-sky-600 font-bold bg-sky-50 px-1 rounded">Main</span>}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                      {workingDays.length > 0 ? workingDays.join(', ') : 'No working periods'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Lunch Break (global) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label required>Lunch Start</Label>
                          <select
                            value={formData.lunch_start_time ?? '12:00'}
                            onChange={e => set('lunch_start_time', e.target.value)}
                            className={selectCls}
                          >
                            {TIME_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <FieldError msg={errors.lunch_start_time} />
                        </div>
                        <div>
                          <Label required>Lunch End</Label>
                          <select
                            value={formData.lunch_end_time ?? '13:00'}
                            onChange={e => set('lunch_end_time', e.target.value)}
                            className={selectCls}
                          >
                            {TIME_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <FieldError msg={errors.lunch_end_time} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Phase 8: Context-aware Branch Selector ─────────────────────── */}
                  <div className="md:col-span-2">
                    <Label required>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-500" />
                        Assign to Clinic Branch
                      </span>
                    </Label>

                    {/* Multi-Branch Active Overview for Edit Mode */}
                    {isEditMode && editingStaff?.branch_assignments && editingStaff.branch_assignments.length > 0 && (
                      <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <span className="font-semibold text-slate-700">All Branch Assignments:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {editingStaff.branch_assignments.map((b, idx) => (
                            <span key={idx} className={`px-2 py-0.5 rounded-full border text-xs font-medium ${
                              b.is_active ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {b.branch_name || `Branch #${b.branch_id}`} {b.is_active ? '· Active' : '· Inactive'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(formData.roles ?? []).includes('PRACTITIONER') ? (
                      /* ── Practitioner Scope: Multi-branch Schedule Notice ── */
                      <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-start gap-2.5">
                        <Building2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-sky-900">Multi-Branch Schedule Configured</span>
                          <p className="text-[11px] text-sky-700 mt-0.5">
                            Branch assignments and working hours for this practitioner are configured above per duty day and working period. Primary branch: <strong className="font-bold">{branches.find(b => b.id === (uniqueAssignedBranchIds[0] ?? formData.clinic_branch))?.name || 'Selected branch'}</strong>.
                          </p>
                        </div>
                      </div>
                    ) : formData.roles.includes('BRANCH_MANAGER') ? (
                      /* ── Branch Manager Scope: Multi-branch Checkboxes ── */
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 mb-2">
                          Select the branches this Branch Manager is authorized to manage.
                        </p>
                        {(isOwner ? branches : managerBranches).map(branch => {
                          const isSelected = formData.branch_ids?.includes(branch.id);
                          const manager = branchManagers?.[branch.id];
                          const takenByOther = !!manager && manager.id !== editingStaff?.id;
                          return (
                            <label
                              key={branch.id}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                                takenByOther
                                  ? 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200 cursor-pointer'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                value={branch.id}
                                checked={isSelected && !takenByOther}
                                disabled={takenByOther}
                                onChange={(e) => {
                                  const current = formData.branch_ids || [];
                                  if (e.target.checked) {
                                    set('branch_ids', [...current, branch.id]);
                                  } else {
                                    set('branch_ids', current.filter(id => id !== branch.id));
                                  }
                                }}
                                className="accent-sky-500 w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-400"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {branch.name}
                                {branch.is_main_branch ? (
                                  <span className="ml-1.5 text-[10px] font-semibold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded">Main</span>
                                ) : null}
                                {branch.city ? <span className="ml-1 text-gray-400">· {branch.city}</span> : null}
                                {takenByOther ? (
                                  <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                    Managed by {manager?.name}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                        {(!formData.branch_ids || formData.branch_ids.length === 0) && (
                          <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            A Branch Manager must be assigned to at least one branch.
                          </p>
                        )}

                        {/* ── Other branches' Diary (Owner only) ── */}
                        {isOwner && (
                          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                            <p className="text-xs font-semibold text-gray-700">Other branches&apos; Diary access</p>
                            <p className="text-xs text-gray-500">
                              Branches this Branch Manager may open in the Diary besides the ones above. It only takes effect when
                              the Branch Manager&apos;s permission group sets &quot;Other Branches&apos; Diary&quot; to View or Edit.
                            </p>
                            {branches.filter(b => !(formData.branch_ids ?? []).includes(b.id)).map(branch => {
                              const picked = (formData.extra_diary_branch_ids ?? []).includes(branch.id);
                              return (
                                <label
                                  key={branch.id}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                    picked ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-100' : 'bg-white border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={picked}
                                    onChange={(e) => {
                                      const current = formData.extra_diary_branch_ids ?? [];
                                      set('extra_diary_branch_ids', e.target.checked
                                        ? [...current, branch.id]
                                        : current.filter(id => id !== branch.id));
                                    }}
                                    className="accent-teal-500 w-4 h-4 rounded border-gray-300"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {branch.name}
                                    {branch.city ? <span className="ml-1 text-gray-400">· {branch.city}</span> : null}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ── Operational Roles: Single Primary Branch ── */
                      <>
                        {/* ── Branch Manager: choose among the clinics they manage ── */}
                        {isBranchManager && !isOwner && managerBranches.length === 1 && (
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-800">
                            <Lock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span>Assigned to your clinic: <strong>{managerBranches[0].name}</strong>.</span>
                          </div>
                        )}
                        {isBranchManager && !isOwner && managerBranches.length > 1 && (
                          <>
                            <select
                              value={formData.clinic_branch ?? ''}
                              onChange={e => {
                                const id = e.target.value ? Number(e.target.value) : null;
                                set('clinic_branch', id);
                                if (id) set('branch_ids', [id]);
                              }}
                              className={`${selectCls} ${errors.clinic_branch ? 'border-rose-400 ring-2 ring-rose-200' : ''}`}
                            >
                              <option value="" disabled>— Select one of your clinics —</option>
                              {managerBranches.map(b => (
                                <option key={b.id} value={b.id}>
                                  {b.name}{b.is_main_branch ? ' (Main)' : ''}{b.city ? ` · ${b.city}` : ''}
                                </option>
                              ))}
                            </select>
                            <p className="mt-0.5 text-[10px] text-gray-400">
                              You manage {managerBranches.length} clinics. Choose which one this person belongs to.
                            </p>
                          </>
                        )}

                        {/* ── Case C: Owner → full dropdown of all branches ── */}
                        {(isOwner || (!isBranchManager && managerBranches.length === 0)) && (
                          <>
                            {loadingBranches ? (
                              <div className={`${selectCls} text-gray-400`}>Loading branches…</div>
                            ) : branches.length === 0 ? (
                              <div className={`${selectCls} text-amber-600 bg-amber-50 border-amber-200`}>
                                No branches found. Please add a clinic branch first.
                              </div>
                            ) : (
                              <select
                                value={formData.clinic_branch ?? defaultBranchId ?? ''}
                                onChange={e =>
                                  set('clinic_branch', e.target.value ? Number(e.target.value) : null)
                                }
                                className={`${selectCls} ${
                                  errors.clinic_branch ? 'border-rose-400 ring-2 ring-rose-200' : ''
                                }`}
                              >
                                <option value="" disabled>— Select a branch —</option>
                                {branches.map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}
                                    {b.is_main_branch ? ' (Main)' : ''}
                                    {b.city ? ` · ${b.city}` : ''}
                                  </option>
                                ))}
                              </select>
                            )}
                            {errors.clinic_branch ? (
                              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {errors.clinic_branch}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[10px] text-gray-400">
                                Every user must be assigned to a branch for correct diary and calendar scoping.
                              </p>
                            )}
                          </>
                        )}

                        {/* No branches case for Branch Manager */}
                        {isBranchManager && !isOwner && managerBranches.length === 0 && (
                          <div className={`${selectCls} text-amber-600 bg-amber-50 border-amber-200`}>
                            You have no branches assigned. Contact the Owner.
                          </div>
                        )}
                      </>
                    )}
                  </div>

                </div>
              </div>

              {/* ════════════════════════════════════════
                  SECTION 3 — Contact Information
              ════════════════════════════════════════ */}
              <div>
                <SectionTitle color="text-slate-500">Contact Information</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

                  {/* Email */}
                  <div className="md:col-span-2">
                    <Label required>Email Address</Label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => {
                        set('email', e.target.value);
                        const msg = validateEmailDetailed(e.target.value);
                        setErrors(prev => ({ ...prev, email: msg || undefined }));
                      }}
                      onBlur={e => {
                        const msg = validateEmailDetailed(e.target.value);
                        setErrors(prev => ({ ...prev, email: msg || undefined }));
                      }}
                      placeholder="john.doe@example.com"
                      className={inputCls(!!errors.email)}
                    />
                    {isEditMode && editingStaff && formData.email.trim().toLowerCase() !== editingStaff.email.trim().toLowerCase() && (
                      <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          Changing the email will reset this user's password and send new
                          login credentials to <strong>{formData.email}</strong>. The old
                          email address will no longer work for sign-in.
                        </span>
                      </div>
                    )}
                    {isEditMode && editingStaff && formData.email.trim().toLowerCase() === editingStaff.email.trim().toLowerCase() && (
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Updating the email will send new temporary credentials to the new address and require a password reset.
                      </p>
                    )}
                    <FieldError msg={errors.email} />

                    {isLookingUpEmail && (
                      <p className="mt-1 text-xs text-sky-600 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Checking existing practitioner accounts…
                      </p>
                    )}

                    {existingUserMatch && (
                      <div className={`mt-2.5 p-3.5 rounded-xl border text-xs ${
                        isAlreadyAssignedToSelectedBranch
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-sky-50 border-sky-200 text-sky-800'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-sky-600" />
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">
                              {isAlreadyAssignedToSelectedBranch
                                ? `Already Assigned: Dr. ${existingUserMatch.name}`
                                : `Existing Practitioner Found: Dr. ${existingUserMatch.name}`}
                            </p>
                            <p>
                              Account: <strong>{existingUserMatch.email}</strong> · Specialization: {existingUserMatch.specialization || 'General'}
                            </p>
                            {existingUserMatch.assigned_branches && existingUserMatch.assigned_branches.length > 0 && (
                              <p>
                                Currently assigned to: {existingUserMatch.assigned_branches.map(b => b.branch_name).join(', ')}
                              </p>
                            )}
                            {isAlreadyAssignedToSelectedBranch ? (
                              <p className="font-semibold text-amber-700 mt-1">
                                ⚠ This practitioner is already assigned to the selected branch. Please choose a different branch to assign them to.
                              </p>
                            ) : (
                              <p className="text-sky-700 font-medium mt-1">
                                ✓ Ready to assign Dr. {existingUserMatch.name} to this branch with independent duty hours. (Consumes 1 clinician allocation).
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <Label required>Phone Number</Label>
                    <div className={`flex w-full overflow-hidden p-0 bg-slate-50 border rounded-xl focus-within:ring-2 focus-within:ring-care-blue focus-within:bg-white transition-colors ${errors.phone ? 'border-red-300' : 'border-slate-200'}`}>
                      <PhoneInput
                        international
                        defaultCountry="PH"
                        value={formData.phone}
                        onChange={val => {
                          set('phone', val || '');
                          const msg = validatePHPhoneDetailed(val || '');
                          setErrors(prev => ({ ...prev, phone: msg || undefined }));
                        }}
                        className="w-full"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <FieldError msg={errors.phone} />
                  </div>

                  {/* Address */}
                  <div>
                    <Label>Address</Label>
                    <textarea
                      rows={3}
                      value={formData.address}
                      onChange={e => set('address', e.target.value)}
                      placeholder="Street, City, Province, ZIP"
                      className={`${inputCls()} resize-none`}
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm font-semibold"
              >
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />{isEditMode ? 'Saving…' : (existingUserMatch ? 'Assigning…' : 'Creating…')}</>
                  : existingUserMatch
                  ? <><Building2 className="w-4 h-4" />Assign to Selected Branch</>
                  : <><UserPlus  className="w-4 h-4" />{isEditMode ? 'Save Changes' : 'Create Staff Member'}</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

      {/* ── Practitioner Removal Confirmation Modal ───────────────────────── */}
      {removalImpact && (
        <PractitionerRemovalModal
          isOpen={showRemovalModal}
          onClose={handleRemovalCancel}
          onConfirm={handleRemovalConfirm}
          loading={removalLoading}
          impact={removalImpact}
          practitionerName={
            editingStaff
              ? `${editingStaff.first_name} ${editingStaff.last_name}`.trim()
              : ''
          }
        />
      )}

      {/* ── Clinician Limit Capacity Modal (Strict Sharp Corners) ─────────── */}
      <ClinicianLimitReachedModal
        isOpen={showClinicianLimitModal}
        onClose={() => setShowClinicianLimitModal(false)}
        limitInfo={clinicianLimitInfo}
        onUpgrade={() => {
          setShowClinicianLimitModal(false);
          handleClose();
          window.location.href = '/setup?card=account&option=subscription';
        }}
      />
    </>
  );
};
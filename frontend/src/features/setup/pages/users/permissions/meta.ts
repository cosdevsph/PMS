/**
 * Shared metadata for the Permission Groups screen: which features exist, how they are grouped,
 * what each starting template grants, and how access levels look. Pure data and small helpers.
 */
import type React from 'react';
import {
  Ban, BarChart3, Briefcase, CalendarDays, CreditCard, Crown, Eye, LayoutDashboard, Pencil,
  Settings, Shield, ShieldCheck, SlidersHorizontal, Stethoscope, UserCog, Users,
} from 'lucide-react';
import type { AccessLevel, RoleTemplate } from '../../../services/PermissionGroupService';

// ─── Feature catalogue ────────────────────────────────────────────────────────

export interface FeatureRow { key: string; label: string; hint?: string }
export interface FeatureSection { label: string; description: string; icon: React.ElementType; keys: FeatureRow[] }

const SECTION_META: Record<string, { description: string; icon: React.ElementType }> = {
  'Dashboard':           { description: 'The home overview and key figures.', icon: LayoutDashboard },
  'Diary & Calendar':    { description: 'Booking, moving and viewing appointments.', icon: CalendarDays },
  'Patients & Cases':    { description: 'Patient records and their cases.', icon: Users },
  'Clinical':            { description: 'Notes, outcome measures and documents.', icon: Stethoscope },
  'Billing & Finance':   { description: 'Invoices and billing.', icon: CreditCard },
  'Operations':          { description: 'Contacts, inventory, messages and reports.', icon: Briefcase },
  'Administration':      { description: 'Staff, permissions, settings and subscription.', icon: ShieldCheck },
  'Setup Sections':      { description: 'Which cards of the Setup page are available.', icon: Settings },
  'Manage Sections':     { description: 'Which cards of the Manage page are available.', icon: SlidersHorizontal },
  'Report Sections':     { description: 'Which report families can be opened.', icon: BarChart3 },
};

const RAW_FEATURE_GROUPS: { label: string; keys: FeatureRow[] }[] = [
  {
    label: 'Dashboard',
    keys: [{ key: 'dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Diary & Calendar',
    keys: [
      { key: 'diary',         label: 'Diary' },
      // No hint here: the "Branch access" panel below explains this level, per Branch Manager.
      { key: 'diary_other_branches', label: "Other Branches' Diary" },
      { key: 'calendar',      label: 'Calendar' },
      { key: 'appointments',  label: 'Appointments' },
    ],
  },
  {
    label: 'Patients & Cases',
    keys: [
      { key: 'patients',     label: 'Patients' },
      { key: 'client_cases', label: 'Client Cases' },
    ],
  },
  {
    label: 'Clinical',
    keys: [
      { key: 'clinical_notes',   label: 'Clinical Notes' },
      { key: 'outcome_measures', label: 'Outcome Measures' },
      { key: 'documents',        label: 'Documents' },
    ],
  },
  {
    label: 'Billing & Finance',
    keys: [
      { key: 'invoices', label: 'Invoices' },
      { key: 'billing',  label: 'Billing' },
    ],
  },
  {
    label: 'Operations',
    keys: [
      { key: 'contacts',      label: 'Contacts' },
      { key: 'inventory',     label: 'Inventory' },
      { key: 'communication', label: 'Communication' },
      { key: 'reports',       label: 'Reports' },
    ],
  },
  {
    label: 'Administration',
    keys: [
      // 'setup' key intentionally excluded here — it controls the sidebar lock
      // icon only.  Card-level access is configured via Setup Sections below.
      { key: 'staff_management', label: 'Staff Management', hint: 'Branch Managers always have Edit here (they manage the staff of their own clinics).' },
      { key: 'permissions',      label: 'Permissions' },
      { key: 'settings',         label: 'Settings' },
      { key: 'subscriptions',    label: 'Subscriptions' },
    ],
  },
  {
    label: 'Setup Sections',
    keys: [
      { key: 'setup_practice',      label: 'Setup – Practice' },
      { key: 'setup_items',         label: 'Setup – Items' },
      { key: 'setup_users',         label: 'Setup – Users', hint: 'Branch Managers always have Edit here.' },
      { key: 'setup_account',       label: 'Setup – Account' },
      { key: 'setup_communication', label: 'Setup – Communication' },
    ],
  },
  {
    label: 'Manage Sections',
    keys: [
      { key: 'manage_administration', label: 'Manage – Administration' },
      { key: 'manage_clinical',       label: 'Manage – Clinical' },
      { key: 'manage_communications', label: 'Manage – Communications' },
    ],
  },
  {
    label: 'Report Sections',
    keys: [
      { key: 'reports_administration', label: 'Reports – Administration' },
      { key: 'reports_clinic',         label: 'Reports – Clinic' },
      { key: 'reports_financial',      label: 'Reports – Financial' },
      { key: 'reports_performance',    label: 'Reports – Performance' },
    ],
  },
];

export const FEATURE_SECTIONS: FeatureSection[] = RAW_FEATURE_GROUPS.map((g) => ({
  ...g,
  description: SECTION_META[g.label]?.description ?? '',
  icon: SECTION_META[g.label]?.icon ?? Shield,
}));

export const ALL_FEATURE_KEYS = FEATURE_SECTIONS.flatMap((g) => g.keys.map((k) => k.key));

// ─── Display order and styles ─────────────────────────────────────────────────
// DISPLAY ONLY — does not affect RBAC logic or database records.

export const ROLE_ORDER: Record<string, number> = {
  OWNER: 1, BRANCH_MANAGER: 2, FRONTDESK: 3, PRACTITIONER: 4, FINANCE: 5, READ_ONLY: 6, CUSTOM: 7,
};

export const TEMPLATE_LABELS: Record<RoleTemplate, string> = {
  OWNER: 'Owner', BRANCH_MANAGER: 'Branch Manager', FRONTDESK: 'Frontdesk', PRACTITIONER: 'Practitioner',
  FINANCE: 'Finance', READ_ONLY: 'Read-Only', CUSTOM: 'Custom',
};

/**
 * The only groups a Branch Manager may manage or hand to staff (same rule as the backend). Every other
 * group (the Branch Manager's own, Read-Only, Custom) can be managed only by the Owner.
 */
export const BRANCH_MANAGER_MANAGEABLE_TEMPLATES: RoleTemplate[] = ['FRONTDESK', 'PRACTITIONER', 'FINANCE'];

/** Who the levels are about, in the Owner's words: "<audience> can: | Edit |". */
export const AUDIENCE_LABELS: Record<RoleTemplate, string> = {
  OWNER: 'The Owner',
  BRANCH_MANAGER: 'Your branch managers',
  FRONTDESK: 'Your frontdesk staff',
  PRACTITIONER: 'Your practitioners',
  FINANCE: 'Your finance staff',
  READ_ONLY: 'Your read-only users',
  CUSTOM: 'Members of this group',
};

export const TEMPLATE_STYLES: Record<
  RoleTemplate,
  { iconBg: string; icon: React.ElementType; iconColor: string; badge: string; ring: string }
> = {
  OWNER:          { iconBg: 'bg-amber-100',  icon: Crown,       iconColor: 'text-amber-600',  badge: 'bg-amber-50 text-amber-800 border-amber-200',   ring: 'ring-amber-300' },
  BRANCH_MANAGER: { iconBg: 'bg-violet-100', icon: UserCog,     iconColor: 'text-violet-600', badge: 'bg-violet-50 text-violet-800 border-violet-200', ring: 'ring-violet-300' },
  FRONTDESK:      { iconBg: 'bg-teal-100',   icon: Users,       iconColor: 'text-teal-600',   badge: 'bg-teal-50 text-teal-800 border-teal-200',       ring: 'ring-teal-300' },
  PRACTITIONER:   { iconBg: 'bg-purple-100', icon: Stethoscope, iconColor: 'text-purple-600', badge: 'bg-purple-50 text-purple-800 border-purple-200', ring: 'ring-purple-300' },
  FINANCE:        { iconBg: 'bg-green-100',  icon: Users,       iconColor: 'text-green-600',  badge: 'bg-green-50 text-green-800 border-green-200',     ring: 'ring-green-300' },
  READ_ONLY:      { iconBg: 'bg-gray-100',   icon: Eye,         iconColor: 'text-gray-500',   badge: 'bg-gray-50 text-gray-600 border-gray-300',        ring: 'ring-gray-300' },
  CUSTOM:         { iconBg: 'bg-sky-100',    icon: Shield,      iconColor: 'text-sky-600',    badge: 'bg-sky-50 text-sky-800 border-sky-200',           ring: 'ring-sky-300' },
};

export const ACCESS_OPTIONS: {
  value: AccessLevel; label: string; icon: React.ElementType;
  active: string; badge: string; dot: string;
}[] = [
  { value: 'none', label: 'No Access', icon: Ban,    active: 'text-gray-700',    badge: 'bg-gray-100 text-gray-600 border-gray-200',        dot: 'bg-gray-300' },
  { value: 'view', label: 'View',      icon: Eye,    active: 'text-sky-700',     badge: 'bg-sky-50 text-sky-700 border-sky-200',            dot: 'bg-sky-400' },
  { value: 'edit', label: 'Edit',      icon: Pencil, active: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
];

/** Counts of each access level in a permissions map. */
export function summarize(map: Record<string, AccessLevel | undefined>): { edit: number; view: number; none: number } {
  const out = { edit: 0, view: 0, none: 0 };
  for (const key of ALL_FEATURE_KEYS) {
    const level = (map[key] ?? 'none') as AccessLevel;
    out[level] += 1;
  }
  return out;
}

// ─── Starting templates ───────────────────────────────────────────────────────

export const TEMPLATE_DEFAULT_PERMS: Record<RoleTemplate, Record<string, AccessLevel>> = {
  OWNER:    Object.fromEntries(ALL_FEATURE_KEYS.map((k) => [k, 'edit'])) as Record<string, AccessLevel>,
  BRANCH_MANAGER: {
    dashboard: 'edit', appointments: 'edit', calendar: 'edit', diary: 'edit', diary_other_branches: 'none',
    clinical_notes: 'edit', client_cases: 'edit', patients: 'edit', reports: 'edit',
    inventory: 'edit', invoices: 'edit', billing: 'edit', subscriptions: 'view',
    setup: 'view', staff_management: 'edit', permissions: 'view', settings: 'view',
    documents: 'edit', outcome_measures: 'edit', contacts: 'edit', communication: 'edit',
    setup_practice: 'edit', setup_items: 'edit', setup_users: 'edit',
    setup_account: 'view', setup_communication: 'edit',
    manage_administration: 'edit', manage_clinical: 'edit', manage_communications: 'edit',
    reports_administration: 'edit', reports_clinic: 'edit',
    reports_financial: 'edit', reports_performance: 'edit',
  },
  FRONTDESK: {
    dashboard: 'view', appointments: 'edit', calendar: 'edit', diary: 'edit', diary_other_branches: 'none',
    clinical_notes: 'view', client_cases: 'view', patients: 'edit', reports: 'view',
    inventory: 'view', invoices: 'edit', billing: 'view', subscriptions: 'none',
    setup: 'none', staff_management: 'none', permissions: 'none', settings: 'none',
    documents: 'view', outcome_measures: 'view', contacts: 'edit', communication: 'edit',
    setup_practice: 'view', setup_items: 'view', setup_users: 'none',
    setup_account: 'none', setup_communication: 'view',
    manage_administration: 'view', manage_clinical: 'view', manage_communications: 'edit',
    reports_administration: 'edit', reports_clinic: 'view',
    reports_financial: 'edit', reports_performance: 'view',
  },
  PRACTITIONER: {
    dashboard: 'view', appointments: 'edit', calendar: 'edit', diary: 'edit', diary_other_branches: 'none',
    clinical_notes: 'edit', client_cases: 'edit', patients: 'edit', reports: 'view',
    inventory: 'view', invoices: 'view', billing: 'none', subscriptions: 'none',
    setup: 'none', staff_management: 'none', permissions: 'none', settings: 'none',
    documents: 'edit', outcome_measures: 'edit', contacts: 'edit', communication: 'view',
    setup_practice: 'view', setup_items: 'none', setup_users: 'none',
    setup_account: 'none', setup_communication: 'view',
    manage_administration: 'none', manage_clinical: 'edit', manage_communications: 'view',
    reports_administration: 'none', reports_clinic: 'edit',
    reports_financial: 'none', reports_performance: 'view',
  },
  FINANCE: {
    dashboard: 'view', appointments: 'view', calendar: 'view', diary: 'none', diary_other_branches: 'none',
    clinical_notes: 'none', client_cases: 'none', patients: 'view', reports: 'view',
    inventory: 'view', invoices: 'edit', billing: 'edit', subscriptions: 'none',
    setup: 'none', staff_management: 'none', permissions: 'none', settings: 'none',
    documents: 'none', outcome_measures: 'none', contacts: 'view', communication: 'view',
    setup_practice: 'none', setup_items: 'none', setup_users: 'none',
    setup_account: 'none', setup_communication: 'none',
    manage_administration: 'edit', manage_clinical: 'none', manage_communications: 'none',
    reports_administration: 'view', reports_clinic: 'none',
    reports_financial: 'edit', reports_performance: 'view',
  },
  READ_ONLY: {
    // View access to all non-admin features; admin-only sections set to 'none'.
    dashboard: 'view', appointments: 'view', calendar: 'view', diary: 'view', diary_other_branches: 'none',
    clinical_notes: 'view', client_cases: 'view', patients: 'view', reports: 'view',
    inventory: 'view', invoices: 'view', billing: 'view', subscriptions: 'none',
    setup: 'none', staff_management: 'none', permissions: 'none', settings: 'none',
    documents: 'view', outcome_measures: 'view', contacts: 'view', communication: 'view',
    setup_practice: 'none', setup_items: 'none', setup_users: 'none',
    setup_account: 'none', setup_communication: 'none',
    manage_administration: 'none', manage_clinical: 'view', manage_communications: 'view',
    reports_administration: 'none', reports_clinic: 'view',
    reports_financial: 'none', reports_performance: 'view',
  },
  CUSTOM: Object.fromEntries(ALL_FEATURE_KEYS.map((k) => [k, 'none'])) as Record<string, AccessLevel>,
};

export const TEMPLATE_OPTIONS: { value: RoleTemplate; label: string }[] = [
  { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
  { value: 'FRONTDESK',       label: 'Frontdesk' },
  { value: 'PRACTITIONER',    label: 'Practitioner' },
  { value: 'FINANCE',         label: 'Finance' },
  { value: 'READ_ONLY',       label: 'Read-Only (View Only)' },
  { value: 'CUSTOM',          label: 'Custom (No Access)' },
];

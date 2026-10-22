/**
 * Role codes and labels.
 *
 * Vocabulary (since 2026-10-22): the clinic owner is the "Owner" and the branch-level role is the
 * "Branch Manager". Never "Admin", "Administrator", "Admin Assistant" or "Manager" for these roles.
 *
 * The old codes (ADMIN, ADMIN_ASSISTANT, and the MANAGER permission-group template) are accepted
 * only as input, so a cached login or an older backend response keeps working during the rollout.
 * They are converted here and never shown. Remove the aliases in a later release.
 */

export const ROLE_OWNER = 'OWNER';
export const ROLE_BRANCH_MANAGER = 'BRANCH_MANAGER';

export type RoleCode = 'OWNER' | 'BRANCH_MANAGER' | 'PRACTITIONER' | 'STAFF' | 'FINANCE' | 'READ_ONLY';

/** Short labels for badges and lists. */
export const ROLE_LABELS: Record<RoleCode, string> = {
  OWNER: 'Owner',
  BRANCH_MANAGER: 'Branch Manager',
  PRACTITIONER: 'Practitioner',
  STAFF: 'Staff',
  FINANCE: 'Finance',
  READ_ONLY: 'Read-Only',
};

const LEGACY_ROLE_ALIASES: Record<string, RoleCode> = {
  ADMIN: 'OWNER',
  ADMIN_ASSISTANT: 'BRANCH_MANAGER',
};

const LEGACY_TEMPLATE_ALIASES: Record<string, string> = {
  MANAGER: 'BRANCH_MANAGER',
  ADMIN_ASSISTANT: 'BRANCH_MANAGER',
};

export const normalizeRole = <T extends string>(role: T): T | RoleCode =>
  (LEGACY_ROLE_ALIASES[role] as RoleCode | undefined) ?? role;

/** Convert legacy codes in a roles list, dropping duplicates and keeping order. */
export const normalizeRoles = <T extends string>(roles: readonly T[] | undefined | null): Array<T | RoleCode> => {
  const seen = new Set<string>();
  const out: Array<T | RoleCode> = [];
  for (const role of roles ?? []) {
    const next = normalizeRole(role);
    if (!seen.has(next)) {
      seen.add(next);
      out.push(next);
    }
  }
  return out;
};

export const normalizeTemplate = <T extends string>(template: T): T | string => LEGACY_TEMPLATE_ALIASES[template] ?? template;

/**
 * Convert a user object (login response, /auth/me, or a cached copy) to the current vocabulary.
 * Also maps the old `is_manager` flag to `is_branch_manager` when talking to an older backend.
 */
export function normalizeUser<U extends { role?: string; roles?: readonly string[]; is_manager?: boolean; is_branch_manager?: boolean }>(
  user: U,
): U {
  if (!user) return user;
  const next: U = { ...user };
  if (next.role) next.role = normalizeRole(next.role);
  if (next.roles) next.roles = normalizeRoles(next.roles);
  if (next.is_branch_manager === undefined && next.is_manager !== undefined) {
    next.is_branch_manager = next.is_manager;
  }
  delete next.is_manager;
  return next;
}

/**
 * Human label for a role code. Legacy codes are converted first, and an unknown code is shown in
 * Title Case ("SOME_ROLE" -> "Some Role") rather than as a raw code.
 */
export function roleLabel(code?: string | null): string {
  if (!code) return '';
  const normalized = normalizeRole(code);
  const known = ROLE_LABELS[normalized as RoleCode];
  if (known) return known;
  return String(normalized)
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/**
 * Convert legacy role codes anywhere in an API response: any `role` / `user_role` string and any
 * `roles` list holding ADMIN or ADMIN_ASSISTANT. This keeps every screen on the new vocabulary
 * while a database or an older backend still returns the old codes. Remove with the other aliases.
 */
export function normalizeRolesDeep<T>(data: T, depth = 0): T {
  if (depth > 8 || data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    data.forEach((item, index) => { data[index] = normalizeRolesDeep(item, depth + 1); });
    return data;
  }
  if (!isPlainObject(data)) return data;
  const record: Record<string, unknown> = data;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if ((key === 'role' || key === 'user_role') && typeof value === 'string') {
      record[key] = normalizeRole(value);
    } else if (key === 'roles' && Array.isArray(value)) {
      record[key] = normalizeRoles(value as string[]);
    } else if (value !== null && typeof value === 'object') {
      record[key] = normalizeRolesDeep(value, depth + 1);
    }
  }
  return data;
}

import type { StaffMember } from '../../../types/staff.types';

/** Clinics a user works at (active assignments plus the home clinic), home clinic first. */
export const clinicIdsOf = (m: StaffMember): number[] => {
  const ids = new Set<number>(m.assigned_branch_ids ?? []);
  if (m.clinic_branch) ids.add(m.clinic_branch);
  const rest = [...ids].filter((i) => i !== m.clinic_branch);
  return m.clinic_branch ? [m.clinic_branch, ...rest] : rest;
};

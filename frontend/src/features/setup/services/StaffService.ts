import { axiosInstance } from '@/lib/axios';
import type { StaffMember, CreateStaffData, PractitionerRoleImpact, UserLookupResult, AssignBranchData } from '../types/staff.types';

/**
 * Get all staff members for the current clinic
 */
export const getStaff = async (): Promise<StaffMember[]> => {
  const response = await axiosInstance.get<{ results: StaffMember[] }>('/users/');
  return response.data.results || [];
};

/**
 * Get single staff member by ID
 */
export const getStaffMember = async (id: number): Promise<StaffMember> => {
  const response = await axiosInstance.get<StaffMember>(`/users/${id}/`);
  return response.data;
};

/**
 * Create new staff member
 * Password is auto-generated and sent via email
 */
export const createStaff = async (data: CreateStaffData): Promise<StaffMember> => {
  console.log('[StaffService] createStaff called', { data });
  console.log('[StaffService] Data being sent:', JSON.stringify(data, null, 2));
  const response = await axiosInstance.post<StaffMember>('/users/', data);
  console.log('[StaffService] Response received:', response.data);
  return response.data;
};

/**
 * Update staff member
 */
export const updateStaff = async (
  id: number,
  data: Partial<CreateStaffData>
): Promise<StaffMember> => {
  console.log('[StaffService] updateStaff called', { id, data });
  console.log('[StaffService] Data being sent:', JSON.stringify(data, null, 2));
  const response = await axiosInstance.patch<StaffMember>(`/users/${id}/`, data);
  console.log('[StaffService] Response received:', response.data);
  console.log('[StaffService] Response availability:', response.data?.availability);
  return response.data;
};

/**
 * Soft delete staff member (deactivates account; retains clinician seat allocation)
 */
export const deleteStaff = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/users/${id}/`);
};

/**
 * Permanently purge staff member account to release clinician allocation.
 * Preserves all historical appointments, clinical notes, documents, and invoices.
 */
export const permanentDeleteStaff = async (id: number): Promise<void> => {
  await axiosInstance.post(`/users/${id}/permanent-delete/`);
};

/**
 * Toggle staff member active status
 */
export const toggleStaffStatus = async (
  id: number,
  isActive: boolean
): Promise<StaffMember> => {
  const response = await axiosInstance.patch<StaffMember>(`/users/${id}/`, {
    is_active: isActive,
  });
  return response.data;
};

/**
 * Get practitioner role removal impact counts.
 *
 * Returns the number of future appointments, block-outs, and calendar events
 * that would be deleted if the PRACTITIONER role is removed from this user.
 */
export const getPractitionerRoleImpact = async (
  userId: number
): Promise<PractitionerRoleImpact> => {
  const response = await axiosInstance.get<PractitionerRoleImpact>(
    `/users/${userId}/practitioner-role-impact/`
  );
  return response.data;
};

/**
 * Get the list of branches the currently authenticated Branch Manager is allowed to assign.
 * Owners (OWNER) receive the full branch list; Branch Managers receive only their branches.
 * Phase 9: This is the authoritative source — do NOT rely solely on client-side filtering.
 */
export const getManagerBranches = async (): Promise<{
  branches: { id: number; name: string; city?: string | null; is_main_branch: boolean }[];
  count: number;
}> => {
  const response = await axiosInstance.get('/users/me/manager-branches/');
  return response.data;
};

/**
 * Lookup an existing user by email within the clinic organization.
 */
export const lookupUserByEmail = async (email: string): Promise<UserLookupResult> => {
  const response = await axiosInstance.get<UserLookupResult>('/users/lookup/', {
    params: { email },
  });
  return response.data;
};

import { emitPractitionerUpdated } from '@/events/practitionerEvents';

/**
 * Assign an existing practitioner to an additional branch with specific duty hours.
 */
export const assignPractitionerToBranch = async (
  userId: number,
  data: AssignBranchData
): Promise<StaffMember> => {
  const response = await axiosInstance.post<StaffMember>(
    `/users/${userId}/assign_branch/`,
    data
  );
  emitPractitionerUpdated(userId, response.data.practitioner_id ?? null);
  return response.data;
};

/**
 * Update branch-specific duty hours for a practitioner.
 */
export const updateBranchAssignment = async (
  userId: number,
  data: Partial<AssignBranchData> & { branch_id: number }
): Promise<StaffMember> => {
  const response = await axiosInstance.patch<StaffMember>(
    `/users/${userId}/update_branch_assignment/`,
    data
  );
  emitPractitionerUpdated(userId, response.data.practitioner_id ?? null);
  return response.data;
};

/**
 * Deactivate a practitioner's assignment to a specific branch.
 */
export const deactivateBranchAssignment = async (
  userId: number,
  branchId: number
): Promise<StaffMember> => {
  const response = await axiosInstance.post<StaffMember>(
    `/users/${userId}/deactivate_branch_assignment/`,
    { branch_id: branchId }
  );
  emitPractitionerUpdated(userId, response.data.practitioner_id ?? null);
  return response.data;
};
/**
 * Save a practitioner's working hours at all their clinics in one go (`duty_schedule` blocks carry
 * the clinic). Clinics missing from the schedule are removed. One clinician seat however many clinics.
 */
export const saveStaffSchedule = async (
  userId: number,
  duty_schedule: NonNullable<StaffMember['duty_schedule']>
): Promise<StaffMember> => {
  const response = await axiosInstance.patch<StaffMember>(`/users/${userId}/`, { duty_schedule });
  emitPractitionerUpdated(userId, response.data.practitioner_id ?? null);
  return response.data;
};

/**
 * Set the clinics a Frontdesk or Finance user works at (the first is their home clinic).
 * Role permissions are unchanged: a clinic widens where they work, not what they may do.
 */
export const saveStaffClinics = async (userId: number, work_branch_ids: number[]): Promise<StaffMember> => {
  const response = await axiosInstance.patch<StaffMember>(`/users/${userId}/`, { work_branch_ids });
  return response.data;
};

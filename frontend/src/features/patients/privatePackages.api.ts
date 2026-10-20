import axiosInstance from '@/lib/axios';
import type { User } from '@/types/auth';

const BASE_URL = '/private-packages/';

export type PrivatePackageStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PrivatePackageItem {
  id: number;
  service: number;
  service_name: string;
  service_color: string;
  quantity: number;
  used: number;
  remaining: number;
}

export interface PrivatePackage {
  id: number;
  patient: number;
  patient_name: string;
  clinic: number;
  title: string;
  price: string;
  notes: string;
  status: PrivatePackageStatus;
  items: PrivatePackageItem[];
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  invoice: number | null;
  invoice_number: string | null;
  invoice_status: string | null;
  invoice_total: string | null;
  invoice_amount_paid: string | null;
  invoice_balance_due: string | null;
  created_by: number | null;
  created_by_name: string | null;
  modified_by: number | null;
  modified_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrivatePackageItemInput {
  service: number;
  quantity: number;
}

export interface CreatePrivatePackageData {
  patient: number;
  title: string;
  price: string | number;
  notes?: string;
  items: PrivatePackageItemInput[];
}

export interface UpdatePrivatePackageData {
  title?: string;
  price?: string | number;
  notes?: string;
  status?: PrivatePackageStatus;
  items?: PrivatePackageItemInput[];
}

export interface PrivatePackageItemChange {
  service: string;
  quantity?: number;
  from?: number;
  to?: number;
}

/** Shape of the `changes` JSON the backend writes to the audit log. */
export interface PrivatePackageChanges {
  title?: string | { from: string; to: string };
  price?: string | { from: string; to: string };
  notes?: { from: string; to: string };
  status?: { from: string; to: string };
  items?:
    | PrivatePackageItemChange[]
    | {
        added?: PrivatePackageItemChange[];
        removed?: PrivatePackageItemChange[];
        quantity_changed?: PrivatePackageItemChange[];
      };
  service?: string;
  session?: string;
}

export interface PrivatePackageHistoryEntry {
  id: number;
  action: string;
  action_display: string;
  user: number | null;
  user_name: string | null;
  appointment: number | null;
  changes: PrivatePackageChanges;
  reason: string;
  created_at: string;
}

/**
 * Roles that may create and edit Private Package Sessions (owner decision D3).
 * Mirrors PACKAGE_WRITE_ROLES in backend/apps/patients/package_views.py; the
 * backend is the real gate, this only hides buttons.
 */
export const PRIVATE_PACKAGE_WRITE_ROLES = ['ADMIN', 'ADMIN_ASSISTANT', 'STAFF', 'PRACTITIONER'];

export const canManagePrivatePackages = (user: Pick<User, 'role' | 'roles'> | null | undefined): boolean => {
  if (!user) return false;
  const roles = user.roles?.length ? user.roles : [user.role];
  return roles.some((r) => PRIVATE_PACKAGE_WRITE_ROLES.includes(r));
};

/** Extract a readable message from a DRF error response. */
export const privatePackageErrorMessage = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;
  const first = Object.values(record)[0];
  if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
  if (typeof first === 'string') return first;
  return fallback;
};

export const getPrivatePackages = async (patientId: number): Promise<PrivatePackage[]> => {
  const response = await axiosInstance.get(BASE_URL, { params: { patient: patientId, page_size: 100 } });
  return response.data.results ?? response.data;
};

export const createPrivatePackage = async (data: CreatePrivatePackageData): Promise<PrivatePackage> => {
  const response = await axiosInstance.post(BASE_URL, data);
  return response.data;
};

export const updatePrivatePackage = async (id: number, data: UpdatePrivatePackageData): Promise<PrivatePackage> => {
  const response = await axiosInstance.patch(`${BASE_URL}${id}/`, data);
  return response.data;
};

export const getPrivatePackageHistory = async (id: number): Promise<PrivatePackageHistoryEntry[]> => {
  const response = await axiosInstance.get(`${BASE_URL}${id}/history/`);
  return response.data;
};

export const assignAppointmentToPackage = async (
  packageId: number,
  appointmentId: number,
  reason?: string,
): Promise<PrivatePackage> => {
  const response = await axiosInstance.post(`${BASE_URL}${packageId}/assign-appointment/`, {
    appointment: appointmentId,
    ...(reason ? { reason } : {}),
  });
  return response.data;
};

export const unassignAppointmentFromPackage = async (
  packageId: number,
  appointmentId: number,
  reason?: string,
): Promise<PrivatePackage> => {
  const response = await axiosInstance.post(`${BASE_URL}${packageId}/unassign-appointment/`, {
    appointment: appointmentId,
    ...(reason ? { reason } : {}),
  });
  return response.data;
};

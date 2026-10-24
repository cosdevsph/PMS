import api from '@/lib/axios';
import type { ClinicProfile } from './letters.api';

export interface LetterTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  discipline?: string;
  clinic_branch?: number | null;
  clinic_branch_name?: string;
  updated_at?: string;
  layout_letter_head: boolean;
  layout_remove_top_space: boolean;
  layout_date: boolean;
  layout_addressee: boolean;
  content_html: string;
  header_html?: string;
  footer_html?: string;
  is_active: boolean;
  version: number;
}

export const getActiveLetterTemplates = async (): Promise<LetterTemplate[]> => {
  const response = await api.get('/letters/templates/active/');
  return response.data;
};

export const getLetterTemplates = async (): Promise<LetterTemplate[]> => {
  const response = await api.get('/letters/templates/');
  return response.data.results || response.data;
};

export const createLetterTemplate = async (data: Partial<LetterTemplate>): Promise<LetterTemplate> => {
  const response = await api.post('/letters/templates/', data);
  return response.data;
};

export const updateLetterTemplate = async (id: number, data: Partial<LetterTemplate>): Promise<LetterTemplate> => {
  const response = await api.patch(`/letters/templates/${id}/`, data);
  return response.data;
};

export const archiveLetterTemplate = async (id: number): Promise<void> => {
  await api.patch(`/letters/templates/${id}/`, { is_active: false });
};

/**
 * The clinic letterhead (logo, name, address, phone, email). `patientId` gives the patient's own branch
 * (what their letters carry), or that of `appointmentId` when the letter is for an appointment; `branchId` a branch of the group; neither = the user's own clinic.
 */
export const getLetterhead = async (
  branchId?: number | null,
  patientId?: number | string | null,
  appointmentId?: number | null,
): Promise<ClinicProfile> => {
  const params: Record<string, number | string> = {};
  if (patientId) {
    params.patient = patientId;
    if (appointmentId) params.appointment = appointmentId;   // the appointment's branch wins over the patient's
  }
  else if (branchId) params.branch = branchId;
  const response = await api.get('/letters/templates/letterhead/', { params });
  return response.data;
};

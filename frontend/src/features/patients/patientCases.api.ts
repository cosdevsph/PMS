import axiosInstance from '@/lib/axios';
import type { PatientCase, PatientCaseStatus, PatientCasePayer } from '@/types/patient';

const BASE_URL = '/patient-cases/';

export interface CreateCaseData {
  patient: number;
  title: string;
  description?: string;
  status?: PatientCaseStatus;
  primary_practitioner?: number;
  primary_practitioner_name?: string;
  payer?: PatientCasePayer;
  alert_notes?: string;
  referred_by?: string;
  referral_info?: string;
}

export interface UpdateCaseData {
  title?: string;
  description?: string;
  status?: PatientCaseStatus;
  primary_practitioner?: number;
  primary_practitioner_name?: string;
  payer?: PatientCasePayer;
  alert_notes?: string;
  referred_by?: string;
  referral_info?: string;
}

export const getPatientCases = async (patientId: number, isArchived?: boolean): Promise<PatientCase[]> => {
  const url = isArchived !== undefined 
    ? `${BASE_URL}?patient=${patientId}&is_archived=${isArchived}`
    : `${BASE_URL}?patient=${patientId}`;
  const response = await axiosInstance.get(url);
  return response.data.results ?? response.data;
};

export const createPatientCase = async (data: CreateCaseData): Promise<PatientCase> => {
  const response = await axiosInstance.post(BASE_URL, data);
  return response.data;
};

export const updatePatientCase = async (caseId: number, data: UpdateCaseData): Promise<PatientCase> => {
  const response = await axiosInstance.patch(`${BASE_URL}${caseId}/`, data);
  return response.data;
};

export const deletePatientCase = async (caseId: number): Promise<void> => {
  await axiosInstance.delete(`${BASE_URL}${caseId}/`);
};

export const archivePatientCase = async (caseId: number): Promise<void> => {
  await axiosInstance.post(`${BASE_URL}${caseId}/archive/`);
};

export const restorePatientCase = async (caseId: number): Promise<void> => {
  await axiosInstance.post(`${BASE_URL}${caseId}/restore/`);
};

export const getCaseDeletionImpact = async (caseId: number): Promise<any> => {
  const response = await axiosInstance.get(`${BASE_URL}${caseId}/deletion_impact/`);
  return response.data;
};

export const assignNoteToCase = async (noteId: number, caseId: number): Promise<void> => {
  await axiosInstance.patch(`/clinical-templates/notes/${noteId}/`, { patient_case: caseId });
};

export interface CasePaymentSummary {
  is_package: boolean;
  package_total: string;
  total_paid: string;
  outstanding_balance: string;
}

export const getCasePaymentSummary = async (caseId: number): Promise<CasePaymentSummary> => {
  const response = await axiosInstance.get(`${BASE_URL}${caseId}/payment-summary/`);
  return response.data;
};
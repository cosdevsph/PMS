import api from '@/lib/axios';
import type {
  Answers, LibraryEntry, OutcomeAssessment, OutcomeAssessmentDetail, OutcomeDefinition, TrendResponse,
} from './outcomes.types';

const unwrap = <T,>(data: T[] | { results: T[] }): T[] => (Array.isArray(data) ? data : data.results);

export const getEnabledDefinitions = async (): Promise<OutcomeDefinition[]> =>
  (await api.get('/outcomes/definitions/')).data;

export const getLibrary = async (): Promise<LibraryEntry[]> => (await api.get('/outcomes/library/')).data;

export const setLibraryEnabled = async (code: string, enabled: boolean): Promise<LibraryEntry[]> =>
  (await api.post(`/outcomes/library/${code}/`, { enabled })).data;

export const getAssessments = async (params: { patient: number; patient_case?: number; code?: string }): Promise<OutcomeAssessment[]> =>
  unwrap((await api.get('/outcomes/assessments/', { params })).data);

export const getAssessment = async (id: number): Promise<OutcomeAssessmentDetail> =>
  (await api.get(`/outcomes/assessments/${id}/`)).data;

export interface CreateAssessmentPayload {
  patient: number;
  definition: number;
  answers: Answers;
  assessed_on?: string;
  patient_case?: number | null;
  appointment?: number | null;
  /** The recording user's own password; checked by the server before anything is saved. */
  password: string;
}

export const createAssessment = async (payload: CreateAssessmentPayload): Promise<OutcomeAssessment> =>
  (await api.post('/outcomes/assessments/', payload)).data;

export const voidAssessment = async (id: number, reason: string): Promise<OutcomeAssessment> =>
  (await api.post(`/outcomes/assessments/${id}/void/`, { reason })).data;

export const emailAssessment = async (
  id: number,
  payload: { to: string; subject: string; body: string; attachment: File },
): Promise<{ detail: string }> => {
  const form = new FormData();
  form.append('to', payload.to);
  form.append('subject', payload.subject);
  form.append('body', payload.body);
  form.append('attachment', payload.attachment);
  return (await api.post(`/outcomes/assessments/${id}/email/`, form)).data;
};

export const getTrend = async (patient: number, code: string, patientCase?: number | null): Promise<TrendResponse> =>
  (await api.get('/outcomes/assessments/trend/', { params: { patient, code, ...(patientCase ? { patient_case: patientCase } : {}) } })).data;

/** Turn an API error into readable lines. */
export const apiErrorLines = (err: unknown): string[] => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== 'object') return ['Something went wrong. Please try again.'];
  const lines: string[] = [];
  Object.values(data as Record<string, unknown>).forEach((v) => {
    if (Array.isArray(v)) v.forEach((x) => lines.push(String(x)));
    else if (typeof v === 'string') lines.push(v);
  });
  return lines.length ? lines : ['Something went wrong. Please try again.'];
};

import axios from 'axios';

export interface RebookingDetails {
  patient_first_name: string;
  service_name: string;
  service_id: number;
  practitioner_name: string;
  practitioner_id: number;
  clinic_name: string;
  clinic_id: number;
  original_date: string;
  original_start_time: string;
  duration_minutes: number;
  expires_at: string;
}

export interface RebookingSubmitPayload {
  date: string;
  start_time: string;
  end_time: string;
}

export interface RebookingSubmitResponse {
  detail: string;
  appointment_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export interface AvailableSlots {
  date: string;
  slots: string[];
}

const BACKEND_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/api\/?$/, '') ||
  'http://127.0.0.1:8000';

const publicAxios = axios.create({ baseURL: BACKEND_URL });

export async function getRebookingDetails(token: string): Promise<RebookingDetails> {
  const { data } = await publicAxios.get<RebookingDetails>(
    `/api/appointments/rebook/${token}/`,
  );
  return data;
}

export async function getRebookingSlots(
  token: string,
  date: string,
): Promise<AvailableSlots> {
  const { data } = await publicAxios.get<AvailableSlots>(
    `/api/appointments/rebook/${token}/slots/`,
    { params: { date } },
  );
  return data;
}

export async function submitRebooking(
  token: string,
  payload: RebookingSubmitPayload,
): Promise<RebookingSubmitResponse> {
  const { data } = await publicAxios.post<RebookingSubmitResponse>(
    `/api/appointments/rebook/${token}/`,
    payload,
  );
  return data;
}

export async function cancelRebooking(token: string): Promise<{ detail: string; appointment_id: number }> {
  const { data } = await publicAxios.delete<{ detail: string; appointment_id: number }>(
    `/api/appointments/rebook/${token}/`,
  );
  return data;
}

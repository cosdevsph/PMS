import axiosInstance from '@/lib/axios';

export interface ClinicDevice {
  id: string;
  device_identifier: string;
  name: string;
  phone_number: string;
  phone_number_verified: boolean;
  sim_carrier: string;
  sim_slot_index: number | null;
  sim_subscription_id: number | null;
  sms_capable: boolean;
  model_name: string;
  android_version: string;
  app_version: string;
  battery_level: number | null;
  is_charging?: boolean | null;
  network_type?: string | null;
  sim_carrier_2?: string | null;
  signal_strength?: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  is_active: boolean;
  is_online: boolean;
  sms_service_status: 'READY' | 'DEGRADED' | 'OFFLINE' | 'SIM_UNAVAILABLE' | 'SUSPENDED' | 'INACTIVE';
  last_seen_at: string | null;
  last_sms_at: string | null;
  clinic_id: number;
  clinic_name: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicDeviceResponse {
  has_device: boolean;
  device: ClinicDevice | null;
}

export interface PairingSessionResponse {
  id: string;
  pairing_token: string;
  pairing_code: string;
  status: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  expires_at: string;
  time_remaining_seconds: number;
  clinic_id: number;
  clinic_name: string;
  qr_payload: {
    v: number;
    type: string;
    endpoint: string;
    token: string;
    code: string;
    clinic_id: number;
    clinic_name: string;
  };
  created_at: string;
}

export interface PairingStatusResponse {
  id: string;
  status: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  is_expired: boolean;
  time_remaining_seconds: number;
  claimed_at: string | null;
  claimed_by_device: {
    id: string;
    name: string;
    device_identifier: string;
  } | null;
}

export const gatewayApi = {
  /**
   * Fetch the currently active paired device for this clinic.
   */
  getClinicDevice: async (clinicId?: number): Promise<ClinicDeviceResponse> => {
    const params = clinicId ? { clinic_id: clinicId } : {};
    const res = await axiosInstance.get<ClinicDeviceResponse>('/gateway/devices/clinic-device/', { params });
    return res.data;
  },

  /**
   * Create a new 10-minute secure pairing session with QR payload and fallback code.
   */
  createPairingSession: async (clinicId?: number): Promise<PairingSessionResponse> => {
    const data = clinicId ? { clinic_id: clinicId } : {};
    const res = await axiosInstance.post<PairingSessionResponse>('/gateway/pairing/session/', data);
    return res.data;
  },

  /**
   * Poll status of an active pairing session to detect when phone claims the session.
   */
  getPairingStatus: async (sessionId: string): Promise<PairingStatusResponse> => {
    const res = await axiosInstance.get<PairingStatusResponse>(`/gateway/pairing/status/${sessionId}/`);
    return res.data;
  },

  /**
   * Cancel an in-flight pairing session.
   */
  cancelPairingSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>('/gateway/pairing/cancel/', {
      session_id: sessionId,
    });
    return res.data;
  },

  /**
   * Disconnect / revoke the clinic's paired device.
   */
  disconnectClinicDevice: async (clinicId?: number, deviceId?: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.post<{ success: boolean; message: string }>('/gateway/devices/disconnect/', {
      clinic_id: clinicId,
      device_id: deviceId,
    });
    return res.data;
  },

  /**
   * Fetch metadata about the Malasakit Gateway Android APK.
   */
  getApkInfo: async (): Promise<ApkInfoResponse> => {
    const res = await axiosInstance.get<ApkInfoResponse>('/gateway/apk-info/');
    return res.data;
  },

  /**
   * Get direct download URL for the Malasakit Gateway Android APK.
   */
  getApkDownloadUrl: (): string => {
    // If running in browser, build full absolute URL so mobile devices scanning QR code reach backend
    const host = window.location.origin;
    return `${host}/api/gateway/download-apk/`;
  },
};

export interface ApkInfoResponse {
  available: boolean;
  version: string;
  app_name: string;
  package_name: string;
  filename: string;
  size_bytes: number;
  size_mb: number;
  download_url: string;
  min_android_version: string;
  recommended_android_version: string;
  release_notes: string;
}

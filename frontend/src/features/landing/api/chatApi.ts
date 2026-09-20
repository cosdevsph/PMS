import { axiosInstance } from '@/lib/axios';
import type { DeviceInfo } from '../utils/deviceDetection';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatApiResponse {
  response: string;
  is_unrelated?: boolean;
  is_locked?: boolean;
  lockout_seconds?: number;
  lockout_until?: number;
  strikes?: number;
}

/**
 * Sends a message, conversation history, device diagnostics, device ID, and optional captcha token.
 *
 * @param message The user's question or message.
 * @param conversation Array of prior messages in the active chat session.
 * @param deviceInfo Client device diagnostics (OS, browser, screen, etc.)
 * @param captchaToken Optional Google reCAPTCHA token
 * @param deviceId Optional client device fingerprint for persistent security tracking
 * @returns The structured API response object.
 */
export const sendPublicChatMessage = async (
  message: string,
  conversation: ChatMessage[],
  deviceInfo?: DeviceInfo,
  captchaToken?: string | null,
  deviceId?: string
): Promise<ChatApiResponse> => {
  const response = await axiosInstance.post<ChatApiResponse>('/public/ai/chat/', {
    message: message.trim(),
    conversation: conversation.map((msg) => ({
      role: msg.role,
      content: msg.content.trim(),
    })),
    device_info: deviceInfo ? {
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      device_type: deviceInfo.deviceType,
      screen_resolution: deviceInfo.screenResolution,
      viewport: deviceInfo.viewport,
      language: deviceInfo.language,
      timezone: deviceInfo.timezone,
      platform: deviceInfo.platform,
    } : undefined,
    device_id: deviceId || undefined,
    captcha_token: captchaToken || undefined,
  });

  return response.data;
};

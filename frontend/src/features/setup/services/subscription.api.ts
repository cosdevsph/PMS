import axiosInstance from '@/lib/axios';

export type SubscriptionPlan = 'TRIAL' | 'MONTHLY';
export type SubscriptionState = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface SubscriptionStatusResponse {
  plan: SubscriptionPlan;
  status: SubscriptionState;
  is_trial: boolean;
  start_date: string;
  end_date: string;
  days_remaining: number;
}

export interface ActivateMonthlyResponse {
  message: string;
}

export const subscriptionApi = {
  getStatus: async (): Promise<SubscriptionStatusResponse> => {
    const { data } = await axiosInstance.get('/subscription/status/');
    return data;
  },

  activateMonthly: async (): Promise<ActivateMonthlyResponse> => {
    const { data } = await axiosInstance.post('/subscription/activate/');
    return data;
  },
};

export const isSubscriptionActive = (subscription?: SubscriptionStatusResponse | null): boolean => {
  if (!subscription || subscription.status !== 'ACTIVE') {
    return false;
  }

  const expiresAt = Date.parse(subscription.end_date);
  if (Number.isNaN(expiresAt)) {
    return true;
  }

  return expiresAt >= Date.now();
};

export const getSafeDaysRemaining = (subscription?: SubscriptionStatusResponse | null): number => {
  if (!subscription) {
    return 0;
  }

  return Math.max(subscription.days_remaining ?? 0, 0);
};

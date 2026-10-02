import axiosInstance from '@/lib/axios';

export type SubscriptionPlan = 'TRIAL' | 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE' | 'MONTHLY' | string;
export type SubscriptionState = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface SubscriptionUsageClinicians {
  used: number;
  limit: number | null;
  remaining: number | null;
  is_at_limit: boolean;
  active_count: number;
  archived_count: number;
  archived_practitioners?: Array<{ id: number; name: string; email: string }>;
  allocations_breakdown?: Array<{
    practitioner_id: number;
    name: string;
    email: string;
    is_active: boolean;
    is_deleted: boolean;
    branches_count: number;
    allocations_consumed: number;
    branches: Array<{ id: number; name: string }>;
  }>;
}

export interface SubscriptionUsageBranches {
  used: number;
  limit: number;
  remaining: number;
  is_at_limit: boolean;
  included_branches: number;
  additional_branches: number;
}

export interface PlanCatalogItem {
  id: string;
  name: string;
  badge?: string;
  description: string;
  clinician_limit: number | null;
  included_branches: number;
  monthly_price_pesos: number | null;
  annual_price_pesos: number | null;
  additional_branch_monthly_pesos: number | null;
  additional_branch_annual_pesos: number | null;
  annual_savings_pesos: number | null;
  commitment_months: number;
  features_included: string[];
  unlimited_admins: boolean;
}

export interface SubscriptionStatusResponse {
  plan: SubscriptionPlan;
  plan_name?: string;
  billing_cycle?: BillingCycle;
  commitment_months?: number;
  status: SubscriptionState;
  is_trial: boolean;
  is_active?: boolean;
  start_date: string;
  end_date: string;
  days_remaining: number;
  clinician_limit?: number | null;
  branch_limit?: number;
  additional_branches?: number;
  effective_clinician_limit?: number | null;
  effective_branch_limit?: number;
  usage?: {
    clinicians: SubscriptionUsageClinicians;
    branches: SubscriptionUsageBranches;
    unlimited_admins: boolean;
  };
}

export interface CreateCheckoutPayload {
  plan: string;
  billing_cycle: BillingCycle;
  additional_branches?: number;
}

export interface CheckoutSessionResponse {
  checkout_url: string;
  checkout_id: string;
  plan?: string;
  billing_cycle?: BillingCycle;
  additional_branches?: number;
  total_pesos?: string;
}

export const subscriptionApi = {
  getStatus: async (): Promise<SubscriptionStatusResponse> => {
    const { data } = await axiosInstance.get('/subscription/status/');
    return data;
  },

  getPlans: async (): Promise<PlanCatalogItem[]> => {
    const { data } = await axiosInstance.get('/subscription/plans/');
    return data;
  },

  /**
   * Creates a PayMongo Checkout Session for the selected plan, cycle, and branch add-ons.
   * Returns the checkout_url to redirect the user to for payment.
   * Secret keys never leave the backend.
   */
  createCheckout: async (payload?: CreateCheckoutPayload): Promise<CheckoutSessionResponse> => {
    const { data } = await axiosInstance.post('/subscription/checkout/create/', payload || {
      plan: 'STARTER',
      billing_cycle: 'MONTHLY',
      additional_branches: 0,
    });
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


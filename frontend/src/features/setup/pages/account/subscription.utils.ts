import type { SubscriptionState, SubscriptionStatusResponse } from '../../services/subscription.api';

export const TRIAL_DURATION_DAYS = 14;
export const MONTHLY_PLAN_PRICE = 3999;

export const formatPlanLabel = (plan?: string): string => {
  if (!plan) return 'Free Trial';
  switch (plan.toUpperCase()) {
    case 'STARTER':
      return 'Starter Plan';
    case 'GROWTH':
      return 'Growth Plan';
    case 'PROFESSIONAL':
      return 'Professional Plan';
    case 'ENTERPRISE':
      return 'Enterprise Plan';
    case 'MONTHLY':
      return 'Monthly Plan';
    case 'TRIAL':
      return '14-Day Free Trial';
    default:
      return `${plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()} Plan`;
  }
};

export const formatStatusLabel = (status: SubscriptionState): string => {
  if (status === 'ACTIVE') {
    return 'Active';
  }
  if (status === 'EXPIRED') {
    return 'Expired';
  }
  return 'Cancelled';
};

export const formatCurrency = (amount?: number | string | null): string => {
  if (amount === undefined || amount === null) return '₱0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return '₱0';
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const formatDateTime = (value?: string): string => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateOnly = (value?: string): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const getTrialProgressPercent = (subscription?: SubscriptionStatusResponse): number => {
  if (!subscription || !subscription.is_trial) {
    return 0;
  }

  const start = new Date(subscription.start_date).getTime();
  const now = Date.now();
  if (Number.isNaN(start)) {
    return 0;
  }

  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
  const progress = (elapsedDays / TRIAL_DURATION_DAYS) * 100;

  return Math.max(0, Math.min(progress, 100));
};

export const getStatusBadgeClasses = (status: SubscriptionState): string => {
  if (status === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  if (status === 'EXPIRED') {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

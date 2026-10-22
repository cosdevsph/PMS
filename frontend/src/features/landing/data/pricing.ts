/**
 * Public pricing shown on the landing page and on /pricing.
 *
 * SOURCE OF TRUTH: backend/apps/subscriptions/plans.py (PLAN_CATALOG). The public pages cannot call
 * the plans API (it requires login), so these values are mirrored here. Change both together.
 * The 12-clinician tier is `PROFESSIONAL` in the backend and is shown as "Enterprise".
 */

export const ANNUAL_DISCOUNT_PERCENT = 10;
export const COMMITMENT_MONTHS = 12;
export const INCLUDED_BRANCHES = 1;
export const BRANCH_ADDON_MONTHLY = 2000;
export const BRANCH_ADDON_ANNUAL = 21600; // 2,000 x 12, 10% off

export interface PricingTier {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  badge?: string;
  clinicianLimit: number;
  /** Price per month when paid monthly. */
  monthly: number;
  /** Price per year when paid annually (exactly 10% off monthly x 12). */
  annual: number;
  description: string;
  highlight?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    clinicianLimit: 4,
    monthly: 3999,
    annual: 43189.2,
    description: 'Perfect for single clinics and boutique group practices.',
  },
  {
    id: 'growth',
    name: 'Growth',
    badge: 'Most Popular',
    clinicianLimit: 8,
    monthly: 6999,
    annual: 75589.2,
    description: 'Ideal for expanding multi-discipline practices.',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    clinicianLimit: 12,
    monthly: 9999,
    annual: 107989.2,
    description: 'Built for high-volume polyclinics and multi-site centers.',
  },
];

/** Features are identical on every plan, so one list is shared by all cards. */
export const SHARED_FEATURES: string[] = [
  '100% full feature access on every plan',
  'Unlimited Owner, Branch Manager and Staff accounts',
  'Appointments & visual diary',
  'Electronic medical records & clinical notes',
  'PhilHealth & HMO claims workflow',
  'Invoicing, billing & receipts',
  'SMS & email notifications',
  'Patient portal & online booking',
];

/** Whole pesos show without decimals; amounts with centavos show two decimals. */
export const formatPeso = (amount: number): string => {
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

/** What a customer saves per year by paying annually instead of monthly. */
export const annualSavings = (tier: PricingTier): number => Math.round((tier.monthly * 12 - tier.annual) * 100) / 100;

export const BRANCH_LINE = `${INCLUDED_BRANCHES} Branch Included + ${formatPeso(BRANCH_ADDON_MONTHLY)}/month per additional branch`;

/** Worked example used in the explainer under the cards. */
export const GROWTH_BRANCH_EXAMPLE = (() => {
  const growth = PRICING_TIERS.find((t) => t.id === 'growth')!;
  return {
    plan: growth.name,
    clinicians: growth.clinicianLimit,
    base: growth.monthly,
    branch: BRANCH_ADDON_MONTHLY,
    total: growth.monthly + BRANCH_ADDON_MONTHLY,
  };
})();

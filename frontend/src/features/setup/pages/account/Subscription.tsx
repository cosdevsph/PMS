import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useSubscription } from '@/features/setup/hooks/useSubscription';
import {
  getSafeDaysRemaining,
  isSubscriptionActive,
  type BillingCycle,
} from '@/features/setup/services/subscription.api';
import {
  formatCurrency,
  formatDateOnly,
  formatPlanLabel,
  formatStatusLabel,
  getStatusBadgeClasses,
  getTrialProgressPercent,
} from './subscription.utils';
import { UpgradeSubscriptionModal } from '../../components/modals/UpgradeSubscriptionModal';

export const Subscription: React.FC = () => {
  const {
    subscription,
    isLoading,
    isFetching,
    isError,
    error,
    refresh,
    plans,
    startCheckout,
    isStartingCheckout,
  } = useSubscription();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [plansCycle, setPlansCycle] = useState<BillingCycle>('MONTHLY');

  const daysRemaining = getSafeDaysRemaining(subscription);
  const isActive = isSubscriptionActive(subscription);
  const trialProgress = getTrialProgressPercent(subscription);

  // Handle redirect back from PayMongo checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');

    if (payment === 'success') {
      toast.success(
        'Payment received! Your subscription is being activated. Please refresh in a moment.',
        { duration: 6000 },
      );
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => refresh(), 3000);
    } else if (payment === 'cancelled') {
      toast('Payment cancelled. You can try again whenever you\'re ready.', {
        icon: '↩',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errorMessage =
    (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.message ||
    (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.detail ||
    'Failed to load subscription details.';

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 min-h-65 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Loading subscription details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !subscription) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8">
          <div className="flex items-center gap-3 text-red-700 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Unable to load subscription</h2>
          </div>
          <p className="text-sm text-red-600 mb-5">{errorMessage}</p>
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract usage counters from subscription response
  const clinicianLimit = subscription.usage?.clinicians?.limit ?? subscription.effective_clinician_limit ?? 4;
  const cliniciansUsed = subscription.usage?.clinicians?.used ?? 0;
  const clinicianRemaining = subscription.usage?.clinicians?.remaining ?? Math.max(0, clinicianLimit - cliniciansUsed);
  const isClinicianAtLimit = subscription.usage?.clinicians?.is_at_limit ?? (cliniciansUsed >= clinicianLimit);
  const clinicianPercent = Math.min(100, Math.round((cliniciansUsed / (clinicianLimit || 1)) * 100));

  const branchLimit = subscription.usage?.branches?.limit ?? subscription.effective_branch_limit ?? 1;
  const branchesUsed = subscription.usage?.branches?.used ?? 1;
  const branchRemaining = subscription.usage?.branches?.remaining ?? Math.max(0, branchLimit - branchesUsed);
  const isBranchAtLimit = subscription.usage?.branches?.is_at_limit ?? (branchesUsed >= branchLimit);
  const branchPercent = Math.min(100, Math.round((branchesUsed / (branchLimit || 1)) * 100));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header & Active Status ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-200/50">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900">Subscription & Entitlements</h1>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeClasses(
                    subscription.status,
                  )}`}
                >
                  {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {formatStatusLabel(subscription.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                Manage your practice plan, clinician allocations, branch locations, and PayMongo billing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => refresh()}
              disabled={isFetching}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh Status
            </button>
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs hover:shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              {subscription.is_trial ? 'Upgrade to Paid Plan' : 'Change Tier / Add Branches'}
            </button>
          </div>
        </div>

        {/* Inactive Warning Alert */}
        {!isActive && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Subscription access restricted</p>
              <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                Your subscription has expired or is inactive. To restore uninterrupted access to calendar scheduling, patient charts, and billing for your entire clinic, please renew or upgrade your plan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(true)}
              className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 shrink-0 shadow-xs"
            >
              Subscribe Now
            </button>
          </div>
        )}

        {/* Current Plan Overview Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 p-5 md:p-6 bg-gradient-to-br from-emerald-50/70 via-sky-50/40 to-white relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200/60">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                  Current Practice Plan
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    {formatPlanLabel(subscription.plan)}
                  </h2>
                  {subscription.billing_cycle && (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                      {subscription.billing_cycle} Billing
                    </span>
                  )}
                  {subscription.is_trial && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Free Trial
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white/90 border border-gray-200 px-3 py-1.5 rounded-full shadow-2xs">
                  <Clock3 className="w-3.5 h-3.5 text-sky-600" />
                  {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining
                </span>
              </div>
            </div>

            {/* Dates & Commitment Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="rounded-xl bg-white/80 border border-white/80 p-3 shadow-2xs">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Start Date</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDateOnly(subscription.start_date)}</p>
              </div>
              <div className="rounded-xl bg-white/80 border border-white/80 p-3 shadow-2xs">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Renewal / Expiry Date</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDateOnly(subscription.end_date)}</p>
              </div>
              <div className="rounded-xl bg-white/80 border border-white/80 p-3 shadow-2xs">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Contract Term</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  12-Month Commitment
                </p>
              </div>
            </div>

            {/* Trial Progress Bar */}
            {subscription.is_trial && (
              <div className="mt-5 pt-4 border-t border-gray-200/60">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-amber-900">Trial Progress</span>
                  <span className="text-amber-800">{Math.round(trialProgress)}% elapsed</span>
                </div>
                <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${trialProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Value Callout Card */}
          <div className="rounded-2xl border border-gray-200 p-5 md:p-6 bg-white flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">100% Full Feature Parity</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                No feature gating. All Malasakit plans include access to every clinical and practice module:
              </p>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Appointments, Calendar & Diary</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>EMR, Clinical Records & Notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Invoicing, Receipts & PhilHealth Claims</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Inventory, SMS Reminders & Multi-Branch</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Need more seats?</span>
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              >
                Upgrade Plan <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Real-Time Entitlement Usage Meters ─────────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Entitlement Usage & Capacity</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time tracking of clinician seats and branch locations currently allocated to your clinic.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Clinician Usage Meter */}
            <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-2xs">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Clinician Allocations</h4>
                    <p className="text-xs text-gray-500">Active, inactive & archived accounts</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-gray-900">
                    {cliniciansUsed} / {clinicianLimit ?? '∞'}
                  </span>
                  <p className="text-[11px] text-gray-500">
                    {clinicianRemaining} seat{clinicianRemaining === 1 ? '' : 's'} available
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-500 ${
                    isClinicianAtLimit
                      ? 'bg-rose-500'
                      : clinicianPercent > 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${clinicianPercent}%` }}
                />
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>Multi-branch note:</strong> Practitioners assigned to multiple branches consume 1 allocation per branch. Only permanently deleted accounts release a clinician allocation.
                </p>
              </div>

              {isClinicianAtLimit && (
                <div className="mt-3 flex items-center justify-between text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <span className="font-semibold">Clinician capacity reached.</span>
                  <button
                    type="button"
                    onClick={() => setUpgradeModalOpen(true)}
                    className="font-bold underline hover:text-rose-900"
                  >
                    Upgrade Tier
                  </button>
                </div>
              )}
            </div>

            {/* Branch Usage Meter */}
            <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-2xs">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Practice Branch Locations</h4>
                    <p className="text-xs text-gray-500">Main clinic + physical branch locations</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-gray-900">
                    {branchesUsed} / {branchLimit}
                  </span>
                  <p className="text-[11px] text-gray-500">
                    {branchRemaining} branch{branchRemaining === 1 ? '' : 'es'} available
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-500 ${
                    isBranchAtLimit
                      ? 'bg-rose-500'
                      : branchPercent > 75
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${branchPercent}%` }}
                />
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>Branch Add-on:</strong> 1 branch is included in your plan. Additional branches can be added for ₱2,000 – ₱3,000/month depending on your plan tier.
                </p>
              </div>

              {isBranchAtLimit && (
                <div className="mt-3 flex items-center justify-between text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <span className="font-semibold">Branch limit reached.</span>
                  <button
                    type="button"
                    onClick={() => setUpgradeModalOpen(true)}
                    className="font-bold underline hover:text-rose-900"
                  >
                    Add Branches
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Unlimited Admins Benefit Banner */}
          <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Unlimited Administrator & Staff Accounts Included
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Receptionists, clinic managers, billing staff, and clinic owners do not consume clinician allocations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Available Subscription Plans Grid ─────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Compare Plans & Pricing Tiers</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                All plans include 100% full feature access with a 12-month commitment.
              </p>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPlansCycle('MONTHLY')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  plansCycle === 'MONTHLY'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setPlansCycle('ANNUAL')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  plansCycle === 'ANNUAL'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Annual</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    plansCycle === 'ANNUAL'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Save ~10%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const isCurrent =
                subscription.plan?.toUpperCase() === plan.id.toUpperCase() && !subscription.is_trial;
              const isAnnual = plansCycle === 'ANNUAL';
              const price = isAnnual ? plan.annual_price_pesos : plan.monthly_price_pesos;
              const branchAddonPrice = isAnnual
                ? plan.additional_branch_annual_pesos
                : plan.additional_branch_monthly_pesos;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all bg-white relative ${
                    isCurrent
                      ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 shadow-2xs'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-2.5 right-4">
                      <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-gray-900">{plan.name}</h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>

                    {/* Price Block */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      {plan.id === 'ENTERPRISE' ? (
                        <div>
                          <span className="text-2xl font-extrabold text-gray-900">Custom</span>
                          <p className="text-xs text-gray-500 mt-0.5">Tailored pricing</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-extrabold text-gray-900">
                              {formatCurrency(price)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {isAnnual ? '/ year' : '/ month'}
                            </span>
                          </div>
                          {isAnnual && plan.annual_savings_pesos && (
                            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                              Save {formatCurrency(plan.annual_savings_pesos)} / yr
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="mt-5 space-y-2.5 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-gray-900">
                          {plan.clinician_limit ? `Up to ${plan.clinician_limit} clinicians` : 'Custom clinician capacity'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>
                          {plan.included_branches} branch included
                          {branchAddonPrice && (
                            <span className="text-gray-500 block text-[11px]">
                              (+{formatCurrency(branchAddonPrice)} {isAnnual ? '/yr' : '/mo'} per extra branch)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 font-medium">100% full feature access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>Unlimited Admin accounts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {plan.id === 'ENTERPRISE' ? (
                      <a
                        href="mailto:support@malasakitpms.ph?subject=Enterprise%20Inquiry"
                        className="w-full inline-flex items-center justify-center py-2 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                      >
                        Contact Sales
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUpgradeModalOpen(true)}
                        className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
                          isCurrent
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                        }`}
                      >
                        {isCurrent ? 'Modify Plan / Add Branches' : `Select ${plan.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Upgrade / Plan Selection Modal ────────────────────────────────────── */}
      <UpgradeSubscriptionModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentSubscription={subscription}
        plans={plans}
        onStartCheckout={async (payload) => {
          await startCheckout(payload);
        }}
        isStartingCheckout={isStartingCheckout}
      />
    </div>
  );
};
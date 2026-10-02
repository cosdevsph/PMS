import React, { useState } from 'react';
import {
  Building2,
  Check,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import type {
  BillingCycle,
  PlanCatalogItem,
  SubscriptionStatusResponse,
} from '../../services/subscription.api';
import { formatCurrency } from '../../pages/account/subscription.utils';

interface UpgradeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription?: SubscriptionStatusResponse | null;
  plans: PlanCatalogItem[];
  onStartCheckout: (payload: {
    plan: string;
    billing_cycle: BillingCycle;
    additional_branches: number;
  }) => Promise<any>;
  isStartingCheckout: boolean;
}

export const UpgradeSubscriptionModal: React.FC<UpgradeSubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  plans,
  onStartCheckout,
  isStartingCheckout,
}) => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(
    currentSubscription?.billing_cycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY',
  );

  // Default to Growth if Starter or Trial, or keep current plan
  const initialPlan =
    currentSubscription?.plan && ['STARTER', 'GROWTH', 'PROFESSIONAL'].includes(currentSubscription.plan)
      ? currentSubscription.plan
      : 'GROWTH';
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>(initialPlan);

  const [additionalBranches, setAdditionalBranches] = useState<number>(
    currentSubscription?.additional_branches || 0,
  );
  const [termsAgreed, setTermsAgreed] = useState<boolean>(true);

  if (!isOpen) return null;

  // Filter out Enterprise or non-public for standard self-serve checkout
  const selfServePlans = plans.filter((p) => p.id !== 'ENTERPRISE');
  const selectedPlan = selfServePlans.find((p) => p.id === selectedPlanCode) || selfServePlans[0];

  // Pricing calculations
  const isAnnual = selectedCycle === 'ANNUAL';
  const basePrice = selectedPlan
    ? (isAnnual ? selectedPlan.annual_price_pesos : selectedPlan.monthly_price_pesos) || 0
    : 0;

  const branchRate = selectedPlan
    ? (isAnnual
        ? selectedPlan.additional_branch_annual_pesos
        : selectedPlan.additional_branch_monthly_pesos) || 0
    : 0;

  const branchTotal = branchRate * additionalBranches;
  const grandTotal = basePrice + branchTotal;

  const handleCheckoutSubmit = async () => {
    if (!selectedPlan) return;
    if (!termsAgreed) {
      toast.error('Please acknowledge the 12-month contract commitment to proceed.');
      return;
    }

    try {
      await onStartCheckout({
        plan: selectedPlan.id,
        billing_cycle: selectedCycle,
        additional_branches: additionalBranches,
      });
    } catch (err: any) {
      // Error toast already handled by hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isStartingCheckout ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 z-10">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/60 via-sky-50/40 to-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Select Your Subscription Plan
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  12-month contract commitment with flexible monthly or annual billing. All plans include 100% full features.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isStartingCheckout}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Billing Cycle Switch */}
          <div className="mt-5 flex items-center justify-center">
            <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedCycle('MONTHLY')}
                className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  selectedCycle === 'MONTHLY'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycle('ANNUAL')}
                className={`relative px-5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedCycle === 'ANNUAL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Annual Billing</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedCycle === 'ANNUAL'
                      ? 'bg-emerald-700 text-emerald-100'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Save ~10%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selfServePlans.map((plan) => {
              const isSelected = selectedPlanCode === plan.id;
              const isCurrent = currentSubscription?.plan === plan.id && !currentSubscription?.is_trial;
              const price = isAnnual ? plan.annual_price_pesos : plan.monthly_price_pesos;
              const period = isAnnual ? '/ year' : '/ month';

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanCode(plan.id)}
                  className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-2.5 right-4">
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-gray-900">
                          {formatCurrency(price)}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{period}</span>
                      </div>
                      {isAnnual && plan.annual_savings_pesos && (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          Save {formatCurrency(plan.annual_savings_pesos)} per year
                        </p>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-gray-900">
                          Up to {plan.clinician_limit} clinicians
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>{plan.included_branches} branch included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 font-medium">100% full feature access</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>Unlimited Admin accounts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      className={`w-full py-2 text-xs font-bold rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add-on Branches Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-600" />
                  <h4 className="text-sm font-bold text-gray-900">Additional Branch Locations</h4>
                </div>
                <p className="text-xs text-gray-600 mt-1 max-w-xl">
                  Need more than {selectedPlan?.included_branches || 1} branch? Add extra branch locations to your clinic.
                  Rate for {selectedPlan?.name}:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(branchRate)} {isAnnual ? '/ year' : '/ month'} per branch
                  </span>
                  .
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-3 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setAdditionalBranches(Math.max(0, additionalBranches - 1))}
                  disabled={additionalBranches <= 0}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-12 text-center">
                  <span className="text-lg font-bold text-gray-900">{additionalBranches}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdditionalBranches(additionalBranches + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {additionalBranches > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-gray-700">
                <span>
                  Total branches allowed: <strong>{1 + additionalBranches} branches</strong>
                </span>
                <span className="font-semibold text-sky-800">
                  + {formatCurrency(branchTotal)} {isAnnual ? '/ year' : '/ month'}
                </span>
              </div>
            )}
          </div>

          {/* Enterprise Inquiry Banner */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">
                  Need more than 12 clinicians or a tailored hospital system?
                </p>
                <p className="text-[11px] text-indigo-700">
                  Explore our Enterprise tier with custom capacity, dedicated SLA, and white-glove onboarding.
                </p>
              </div>
            </div>
            <a
              href="mailto:support@malasakitpms.ph?subject=Enterprise%20Plan%20Inquiry"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap px-3 py-1.5 rounded-lg border border-indigo-200 bg-white transition-colors"
            >
              Contact Sales
            </a>
          </div>

          {/* Order Summary & Terms */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Order Summary
            </h4>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>
                  {selectedPlan?.name} ({isAnnual ? 'Annual' : 'Monthly'})
                </span>
                <span className="font-semibold text-gray-900">{formatCurrency(basePrice)}</span>
              </div>

              {additionalBranches > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Additional Branches ({additionalBranches} location{additionalBranches > 1 ? 's' : ''})</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(branchTotal)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-bold text-gray-900">Total Due Today</span>
                  <p className="text-[11px] text-gray-500">
                    Billed in Philippine Pesos (PHP) via PayMongo
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-700">
                    {formatCurrency(grandTotal)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    {isAnnual ? '/ year' : '/ month'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commitment Disclosure */}
            <div className="pt-3 border-t border-gray-200 flex items-start gap-2.5">
              <input
                id="commitment-terms"
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="commitment-terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                I understand that Malasakit plans carry a <strong>12-month contract commitment</strong> with flexible {isAnnual ? 'annual' : 'monthly'} billing. Subscription activates immediately upon completed payment.
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isStartingCheckout}
            className="px-4 py-2.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCheckoutSubmit}
            disabled={isStartingCheckout || !termsAgreed}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStartingCheckout ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting to PayMongo...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Proceed to Checkout ({formatCurrency(grandTotal)})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

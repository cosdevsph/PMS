import React from 'react';
import { Building2 } from 'lucide-react';
import {
  ANNUAL_DISCOUNT_PERCENT,
  BRANCH_ADDON_ANNUAL,
  COMMITMENT_MONTHS,
  GROWTH_BRANCH_EXAMPLE as ex,
  formatPeso,
} from '../../../data/pricing';

/** Short explanation shown once under the plan cards instead of repeating it on every tier. */
export const PricingExplainer: React.FC<{ tone?: 'dark' | 'light' }> = ({ tone = 'dark' }) => {
  const dark = tone === 'dark';
  return (
    <section
      aria-labelledby="pricing-explainer-title"
      className={`mt-10 rounded-3xl p-6 sm:p-8 ${dark ? 'bg-white/[0.06] ring-1 ring-white/10' : 'bg-white ring-1 ring-gray-200/80'}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${dark ? 'bg-white/10 text-healing-mint' : 'bg-care-blue/10 text-care-blue'}`}
          aria-hidden="true"
        >
          <Building2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 id="pricing-explainer-title" className={`text-lg font-bold font-heading ${dark ? 'text-white' : 'text-gray-900'}`}>
            How branches and clinician limits work
          </h3>

          <p className={`mt-2 text-sm font-body leading-relaxed ${dark ? 'text-white/80' : 'text-steady-slate'}`}>
            <strong className={dark ? 'text-white' : 'text-gray-900'}>Example:</strong> a {ex.plan} Plan with {ex.clinicians} clinicians and 2 branches is{' '}
            {formatPeso(ex.base)} ({ex.plan}) + {formatPeso(ex.branch)} (additional branch) ={' '}
            <strong className={dark ? 'text-white' : 'text-gray-900'}>{formatPeso(ex.total)}/month</strong>.
          </p>

          <ul className={`mt-3 space-y-1.5 text-sm font-body leading-relaxed list-disc pl-5 ${dark ? 'text-white/75' : 'text-steady-slate'}`}>
            <li>
              The clinician limit is <strong>shared across all your branches</strong>. Split your clinicians between branches however you like.
              A clinician who works at more than one branch counts once.
            </li>
            <li>You only move up to the next plan when your total number of clinicians goes above your plan's limit.</li>
            <li>
              Annual billing is {ANNUAL_DISCOUNT_PERCENT}% off, including additional branches ({formatPeso(BRANCH_ADDON_ANNUAL)}/year each).
            </li>
            <li>
              Every plan has a {COMMITMENT_MONTHS}-month minimum term, paid monthly or annually. Paying monthly does not allow month-to-month cancellation:
              a cancellation takes effect at the end of the current term.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default PricingExplainer;

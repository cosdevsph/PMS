import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, ShieldCheck, Sparkles, Users } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  clinicians: string;
  branches: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: string;
  branchAddonMonthly: number;
  description: string;
  highlight?: boolean;
}

const TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    clinicians: 'Up to 4 clinicians',
    branches: '1 branch included',
    monthlyPrice: 3999,
    annualPrice: 43000,
    annualSavings: 'Save ₱4,988/yr',
    branchAddonMonthly: 2000,
    description: 'Perfect for single clinics and boutique group practices.',
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    badge: 'Most Popular',
    clinicians: 'Up to 8 clinicians',
    branches: '1 branch included',
    monthlyPrice: 6999,
    annualPrice: 75000,
    annualSavings: 'Save ₱8,988/yr',
    branchAddonMonthly: 2500,
    description: 'Ideal for expanding multi-discipline practices.',
    highlight: true,
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    clinicians: 'Up to 12 clinicians',
    branches: '1 branch included',
    monthlyPrice: 9999,
    annualPrice: 108000,
    annualSavings: 'Save ₱11,988/yr',
    branchAddonMonthly: 3000,
    description: 'Built for high-volume polyclinics and multi-site centers.',
  },
];

export const Plans: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="plans" className="py-20 sm:py-28 bg-trust-harbor relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
            Plans Tailored to Your Clinic’s Scale
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-300 leading-relaxed font-body">
            All plans include 100% full system access and unlimited admin accounts. 12-month commitment with flexible monthly or annual billing.
          </p>

          {/* Monthly / Annual Switch */}
          <div className="mt-8 inline-flex p-1 rounded-2xl bg-gray-800/80 border border-gray-700 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                !isAnnual
                  ? 'bg-primary-gradient text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                isAnnual
                  ? 'bg-primary-gradient text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Save ~10%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {TIERS.map((tier) => {
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            const period = isAnnual ? '/ year' : '/ month';

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 border ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 scale-105 z-10'
                    : 'bg-gray-800/60 border-gray-700/80 hover:border-gray-600'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 right-6">
                    <span className="bg-primary-gradient text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-bold text-white font-display">{tier.name}</h3>
                  <p className="mt-2 text-sm text-gray-400 min-h-[40px] font-body">{tier.description}</p>

                  <div className="mt-6 pt-6 border-t border-gray-700/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white font-display">
                        ₱{price.toLocaleString('en-PH')}
                      </span>
                      <span className="text-sm text-gray-400 font-body">{period}</span>
                    </div>
                    {isAnnual && (
                      <p className="mt-1 text-xs text-emerald-400 font-semibold font-body">
                        {tier.annualSavings}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 space-y-3 font-body text-sm">
                    <div className="flex items-center gap-3 text-white">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold">{tier.clinicians}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span>
                        {tier.branches}
                        <span className="block text-xs text-gray-400">
                          +₱{tier.branchAddonMonthly.toLocaleString('en-PH')}/mo per extra branch
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-emerald-300 font-medium">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span>100% Full Feature Parity</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Unlimited Admin Accounts</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700/60">
                  <Link
                    to="/register"
                    className={`block w-full py-3.5 px-4 text-center text-sm font-bold rounded-xl transition-all shadow-md font-body ${
                      tier.highlight
                        ? 'bg-primary-gradient text-white hover:opacity-95'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    Start 14-Day Free Trial
                  </Link>
                  <p className="mt-2 text-center text-xs text-gray-400 font-body">
                    No credit card required for trial
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise & Custom Scale Callout */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-gray-800 via-gray-850 to-gray-800 border border-gray-700 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">
                Enterprise & Healthcare Networks
              </h3>
              <p className="mt-1 text-sm text-gray-300 font-body max-w-2xl">
                Need more than 12 clinicians, bespoke branch networks, dedicated onboarding, or custom integrations? We offer tailored enterprise agreements.
              </p>
            </div>
          </div>

          <a
            href="mailto:support@malasakitpms.ph?subject=Enterprise%20Inquiry"
            className="px-6 py-3 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-bold text-sm whitespace-nowrap transition-colors shadow-md font-body"
          >
            Contact Enterprise Sales
          </a>
        </div>

        {/* Commitment & Features Banner */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400 font-body">
            All paid plans include a <strong>12-month contract commitment</strong> with flexible monthly or annual billing options.
          </p>
        </div>
      </div>
    </section>
  );
};

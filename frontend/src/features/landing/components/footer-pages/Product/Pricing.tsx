import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

export const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: '₱3,999',
      annualPrice: '₱43,000',
      annualSavings: 'Save ₱4,988/yr',
      clinicians: 'Up to 4 clinicians',
      branches: '1 branch included',
      branchAddon: '+₱2,000/mo per extra branch',
      description: 'Ideal for solo practitioners and boutique clinics.',
      features: [
        'Up to 4 clinicians included',
        '1 clinic branch included',
        '100% full feature parity',
        'Unlimited Admin accounts',
        'Appointments & Visual Diary',
        'Complete EMR & Patient Charting',
        'PhilHealth & HMO Claims Workflow',
        'Invoicing, Billing & Receipts',
        'SMS & Email Notifications',
      ],
    },
    {
      name: 'Growth',
      monthlyPrice: '₱6,999',
      annualPrice: '₱75,000',
      annualSavings: 'Save ₱8,988/yr',
      clinicians: 'Up to 8 clinicians',
      branches: '1 branch included',
      branchAddon: '+₱2,500/mo per extra branch',
      description: 'Designed for expanding practices and multidisciplinary centers.',
      popular: true,
      features: [
        'Up to 8 clinicians included',
        '1 clinic branch included',
        '100% full feature parity',
        'Unlimited Admin accounts',
        'Multi-branch calendar scheduling',
        'Unified patient medical records',
        'PhilHealth & HMO billing',
        'Inventory & dispensary tracking',
        'Priority email & chat support',
      ],
    },
    {
      name: 'Professional',
      monthlyPrice: '₱9,999',
      annualPrice: '₱108,000',
      annualSavings: 'Save ₱11,988/yr',
      clinicians: 'Up to 12 clinicians',
      branches: '1 branch included',
      branchAddon: '+₱3,000/mo per extra branch',
      description: 'Built for high-volume polyclinics and diagnostic clinics.',
      features: [
        'Up to 12 clinicians included',
        '1 clinic branch included',
        '100% full feature parity',
        'Unlimited Admin accounts',
        'Multi-site practice coordination',
        'Advanced clinical notes & audits',
        'PhilHealth automated claims',
        'High-capacity patient management',
        'Dedicated account manager',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center text-healing-mint hover:text-white transition-colors mb-6 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Simple, Predictable Clinic Pricing
            </h1>
            <p className="text-lg text-white/80 mt-3 leading-relaxed">
              Every plan includes 100% full feature access and unlimited Admin accounts. 12-month commitment with flexible monthly or annual billing.
            </p>
          </div>

          {/* Billing Switch */}
          <div className="mt-8 inline-flex p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                !isAnnual
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                isAnnual
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Save ~10%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between ${
                plan.popular
                  ? 'bg-gray-800/90 border-emerald-500/80 shadow-2xl scale-105 ring-2 ring-emerald-500/20'
                  : 'bg-gray-800/40 border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {plan.popular && (
                  <div className="bg-emerald-500 text-gray-950 text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full inline-block mb-4 shadow-sm">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-white/70 text-sm mt-1.5 mb-6 min-h-[38px]">{plan.description}</p>

                <div className="mb-6 pt-4 border-t border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-sm text-white/60">
                      {isAnnual ? '/ year' : '/ month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-emerald-400 font-semibold mt-1">
                      {plan.annualSavings}
                    </p>
                  )}
                  <p className="text-xs text-white/50 mt-1">
                    {plan.branchAddon}
                  </p>
                </div>

                <Link
                  to="/register"
                  className={`w-full py-3 rounded-xl font-bold mb-8 transition-colors block text-center text-sm shadow-md ${
                    plan.popular
                      ? 'bg-emerald-500 text-gray-950 hover:bg-emerald-400'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Start 14-Day Free Trial
                </Link>

                <ul className="space-y-3 text-sm text-white/80">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise Callout */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-gray-800 via-gray-850 to-gray-800 border border-white/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Enterprise & Large Healthcare Systems
              </h3>
              <p className="mt-1 text-sm text-white/70 max-w-2xl">
                For clinics requiring more than 12 clinicians, custom branch networks, bespoke integrations, and dedicated enterprise SLA.
              </p>
            </div>
          </div>

          <a
            href="mailto:support@malasakitpms.ph?subject=Enterprise%20Inquiry"
            className="px-6 py-3 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-bold text-sm whitespace-nowrap transition-colors shadow-md"
          >
            Contact Sales
          </a>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 bg-gray-800/40 rounded-3xl p-10 border border-white/10">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-bold text-emerald-400 mb-2">How do clinician allocations work?</h3>
              <p className="text-white/70 leading-relaxed">
                A clinician allocation is consumed whenever a practitioner is active or assigned to a branch. If a practitioner works across 2 branches, they consume 2 clinician allocations. Permanently purging a staff member releases their allocation while preserving all their clinical history.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-emerald-400 mb-2">Do Admin or Receptionist accounts count?</h3>
              <p className="text-white/70 leading-relaxed">
                No! All plans include unlimited Administrator and Staff accounts at no additional cost. Only accounts with the Practitioner clinical role consume allocations.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-emerald-400 mb-2">Are features locked behind higher tiers?</h3>
              <p className="text-white/70 leading-relaxed">
                Never. Every plan from Starter to Enterprise includes 100% full feature parity—EMR, Diary, PhilHealth claims, billing, inventory, SMS notifications, and multi-branch features are included in all tiers.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-emerald-400 mb-2">What is the contract commitment?</h3>
              <p className="text-white/70 leading-relaxed">
                All plans carry a standard 12-month commitment. You have the flexibility to pay either monthly or annually (which saves you approximately 10% each year).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

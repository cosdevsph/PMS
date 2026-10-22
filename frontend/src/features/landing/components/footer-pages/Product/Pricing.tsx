import React from 'react';
import { Building2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { PlanCard } from '../../public/pricing/PlanCard';
import { PricingExplainer } from '../../public/pricing/PricingExplainer';
import {
  ANNUAL_DISCOUNT_PERCENT,
  BRANCH_ADDON_ANNUAL,
  BRANCH_LINE,
  COMMITMENT_MONTHS,
  PRICING_TIERS,
  SHARED_FEATURES,
  annualSavings,
  formatPeso,
} from '../../../data/pricing';

const FAQS = [
  {
    question: 'How do clinician limits work?',
    answer:
      'Your plan includes a number of clinicians, shared across all your branches. Split them between branches however you like. A clinician who works at more than one branch counts once. You only move up to the next plan when your total number of clinicians goes above your plan limit.',
  },
  {
    question: 'How much does an additional branch cost?',
    answer: `Every plan includes 1 branch. Each additional branch is ₱2,000/month on any plan, or ${formatPeso(BRANCH_ADDON_ANNUAL)}/year with annual billing (${ANNUAL_DISCOUNT_PERCENT}% off). For example, Growth (₱6,999) + 1 additional branch (₱2,000) = ₱8,999/month.`,
  },
  {
    question: 'Do Owner, Branch Manager or Receptionist accounts count?',
    answer:
      'No. All plans include unlimited Owner, Branch Manager and Staff accounts at no additional cost. Only accounts with the Practitioner clinical role count toward your clinician limit.',
  },
  {
    question: 'Are features locked behind higher tiers?',
    answer:
      'No. Every plan includes 100% of the features. Plans differ only in the number of clinicians included.',
  },
  {
    question: 'What is the contract commitment?',
    answer: `All plans have a ${COMMITMENT_MONTHS}-month minimum term. You can pay monthly, or pay annually and save ${ANNUAL_DISCOUNT_PERCENT}%. Paying monthly does not allow month-to-month cancellation: if you request a cancellation during the term, it takes effect at the end of your current ${COMMITMENT_MONTHS}-month term and you keep full access until then.`,
  },
];

export const Pricing: React.FC = () => {
  return (
    <PublicPageLayout title="Pricing">
      <PageHeader
        category="Product"
        title="Simple, Predictable Clinic Pricing"
        breadcrumbLabel="Pricing"
        description={`Every plan includes 100% full feature access and unlimited Owner, Branch Manager and staff accounts. ${COMMITMENT_MONTHS}-month minimum term, paid monthly or annually (annual saves ${ANNUAL_DISCOUNT_PERCENT}%).`}
      />

      <div className="bg-clinical-cloud">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Pricing Cards */}
          <ul className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-md md:max-w-none mx-auto">
            {PRICING_TIERS.map((tier) => (
              <li key={tier.id} className="h-full">
                <PlanCard
                  tone="light"
                  headingLevel="h2"
                  name={tier.name}
                  badge={tier.badge}
                  highlight={tier.highlight}
                  description={tier.description}
                  priceOptions={[
                    { label: 'Monthly', price: formatPeso(tier.monthly), period: '/ month' },
                    {
                      label: 'Annual',
                      tag: `${ANNUAL_DISCOUNT_PERCENT}% off`,
                      price: formatPeso(tier.annual),
                      period: '/ year',
                      note: `Save ${formatPeso(annualSavings(tier))} a year`,
                    },
                  ]}
                  highlights={[
                    { icon: Users, label: `Up to ${tier.clinicianLimit} clinicians`, emphasis: true },
                    { icon: Building2, label: BRANCH_LINE },
                    { icon: ShieldCheck, label: '100% Full Feature Parity', emphasis: true },
                  ]}
                  features={SHARED_FEATURES.slice(1)}
                  ctaLabel="Start 14-Day Free Trial"
                  ctaTo="/register"
                  ctaNote="No credit card required for trial"
                />
              </li>
            ))}
          </ul>

          <PricingExplainer tone="light" />

          {/* Custom plan callout */}
          <div className="mt-12 rounded-3xl bg-trust-harbor p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-trust-harbor/10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-healing-mint flex items-center justify-center shrink-0" aria-hidden="true">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl text-white font-display">Custom Plan & Healthcare Networks</h2>
                <p className="mt-1 text-sm text-white/80 max-w-2xl leading-relaxed font-body">
                  Need more than 12 clinicians or a larger multi-branch network? Contact us and we will quote a plan that fits.
                </p>
              </div>
            </div>

            <a
              href="mailto:support@malasakitpms.ph?subject=Custom%20Plan%20Inquiry"
              className="w-full md:w-auto text-center px-6 py-3 rounded-xl bg-white text-trust-harbor hover:bg-clinical-cloud font-bold text-sm whitespace-nowrap transition-colors shadow-md font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trust-harbor"
            >
              Contact Us
            </a>
          </div>

          {/* FAQ Section */}
          <section aria-labelledby="pricing-faq-title" className="mt-16 sm:mt-20 rounded-3xl bg-white ring-1 ring-gray-200/80 px-6 py-10 sm:px-12 sm:py-12">
            <h2 id="pricing-faq-title" className="text-2xl sm:text-3xl tracking-tight text-gray-900 font-display mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <dl className="grid md:grid-cols-2 gap-x-10 gap-y-8 max-w-5xl mx-auto">
              {FAQS.map((faq) => (
                <div key={faq.question}>
                  <dt className="font-bold text-trust-harbor mb-2 font-heading">{faq.question}</dt>
                  <dd className="text-steady-slate leading-relaxed font-body">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </PublicPageLayout>
  );
};

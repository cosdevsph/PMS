import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { BillingToggle } from '../../public/pricing/BillingToggle';
import { PlanCard } from '../../public/pricing/PlanCard';

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

  const faqs = [
    {
      question: 'How do clinician allocations work?',
      answer: 'A clinician allocation is consumed whenever a practitioner is active or assigned to a branch. If a practitioner works across 2 branches, they consume 2 clinician allocations. Permanently purging a staff member releases their allocation while preserving all their clinical history.',
    },
    {
      question: 'Do Admin or Receptionist accounts count?',
      answer: 'No! All plans include unlimited Administrator and Staff accounts at no additional cost. Only accounts with the Practitioner clinical role consume allocations.',
    },
    {
      question: 'Are features locked behind higher tiers?',
      answer: 'Never. Every plan from Starter to Enterprise includes 100% full feature parity—EMR, Diary, PhilHealth claims, billing, inventory, SMS notifications, and multi-branch features are included in all tiers.',
    },
    {
      question: 'What is the contract commitment?',
      answer: 'All plans carry a standard 12-month commitment. You have the flexibility to pay either monthly or annually (which saves you approximately 10% each year).',
    },
  ];

  return (
    <PublicPageLayout title="Pricing">
      <PageHeader
        category="Product"
        title="Simple, Predictable Clinic Pricing"
        breadcrumbLabel="Pricing"
        description="Every plan includes 100% full feature access and unlimited Admin accounts. 12-month commitment with flexible monthly or annual billing."
      >
        <BillingToggle isAnnual={isAnnual} onChange={setIsAnnual} />
      </PageHeader>

      <div className="bg-clinical-cloud">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Pricing Cards */}
          <ul className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-md md:max-w-none mx-auto">
            {plans.map((plan, index) => (
              <li key={index} className="h-full">
                <PlanCard
                  tone="light"
                  headingLevel="h2"
                  name={plan.name}
                  badge={plan.popular ? 'Most Popular' : undefined}
                  highlight={plan.popular}
                  description={plan.description}
                  priceLabel={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  periodLabel={isAnnual ? '/ year' : '/ month'}
                  savingsLabel={isAnnual ? plan.annualSavings : undefined}
                  priceNote={plan.branchAddon}
                  features={plan.features}
                  ctaLabel="Start 14-Day Free Trial"
                  ctaTo="/register"
                />
              </li>
            ))}
          </ul>

          {/* Enterprise Callout */}
          <div className="mt-12 rounded-3xl bg-trust-harbor p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-trust-harbor/10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-healing-mint flex items-center justify-center shrink-0" aria-hidden="true">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl text-white font-display">
                  Enterprise & Large Healthcare Systems
                </h2>
                <p className="mt-1 text-sm text-white/80 max-w-2xl leading-relaxed font-body">
                  For clinics requiring more than 12 clinicians, custom branch networks, bespoke integrations, and dedicated enterprise SLA.
                </p>
              </div>
            </div>

            <a
              href="mailto:support@malasakitpms.ph?subject=Enterprise%20Inquiry"
              className="w-full md:w-auto text-center px-6 py-3 rounded-xl bg-white text-trust-harbor hover:bg-clinical-cloud font-bold text-sm whitespace-nowrap transition-colors shadow-md font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trust-harbor"
            >
              Contact Sales
            </a>
          </div>

          {/* FAQ Section */}
          <section aria-labelledby="pricing-faq-title" className="mt-16 sm:mt-20 rounded-3xl bg-white ring-1 ring-gray-200/80 px-6 py-10 sm:px-12 sm:py-12">
            <h2 id="pricing-faq-title" className="text-2xl sm:text-3xl tracking-tight text-gray-900 font-display mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <dl className="grid md:grid-cols-2 gap-x-10 gap-y-8 max-w-5xl mx-auto">
              {faqs.map((faq) => (
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

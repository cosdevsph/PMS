import React, { useState } from 'react';
import { Building2, Check, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { SectionHeader } from './public/SectionHeader';
import { BillingToggle } from './public/pricing/BillingToggle';
import { PlanCard } from './public/pricing/PlanCard';
import { Reveal } from './motion/Reveal';

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
    <section id="plans" aria-labelledby="plans-title" className="py-20 sm:py-28 bg-trust-harbor relative overflow-hidden scroll-mt-28">
      {/* Subtle brand glow */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[48rem] h-[24rem] bg-care-blue/30 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-[100rem] mx-auto px-4 sm:px-5 lg:px-6">
        <SectionHeader
          id="plans-title"
          tone="dark"
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Transparent Pricing
            </span>
          }
          title="Plans Tailored to Your Clinic’s Scale"
          description="All plans include 100% full system access and unlimited admin accounts. 12-month commitment with flexible monthly or annual billing."
        />

        <div className="mt-8 flex justify-center">
          <BillingToggle isAnnual={isAnnual} onChange={setIsAnnual} />
        </div>

        {/* Pricing Cards Grid */}
        <ul className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-md md:max-w-none mx-auto">
          {TIERS.map((tier, index) => (
            <Reveal as="li" key={tier.id} delay={index * 80} className="h-full">
              <PlanCard
                tone="dark"
                name={tier.name}
                badge={tier.badge}
                highlight={tier.highlight}
                description={tier.description}
                priceLabel={`₱${(isAnnual ? tier.annualPrice : tier.monthlyPrice).toLocaleString('en-PH')}`}
                periodLabel={isAnnual ? '/ year' : '/ month'}
                savingsLabel={isAnnual ? tier.annualSavings : undefined}
                highlights={[
                  { icon: Users, label: tier.clinicians, emphasis: true },
                  {
                    icon: Building2,
                    label: tier.branches,
                    sublabel: `+₱${tier.branchAddonMonthly.toLocaleString('en-PH')}/mo per extra branch`,
                  },
                  { icon: ShieldCheck, label: '100% Full Feature Parity', emphasis: true },
                  { icon: Check, label: 'Unlimited Admin Accounts' },
                ]}
                ctaLabel="Start 14-Day Free Trial"
                ctaTo="/register"
                ctaNote="No credit card required for trial"
              />
            </Reveal>
          ))}
        </ul>

        {/* Enterprise & Custom Scale Callout */}
        <div className="mt-12 rounded-3xl bg-white/[0.06] ring-1 ring-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-healing-mint flex items-center justify-center shrink-0" aria-hidden="true">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">
                Enterprise & Healthcare Networks
              </h3>
              <p className="mt-1 text-sm text-white/75 font-body max-w-2xl leading-relaxed">
                Need more than 12 clinicians, bespoke branch networks, dedicated onboarding, or custom integrations? We offer tailored enterprise agreements.
              </p>
            </div>
          </div>

          <a
            href="mailto:support@malasakitpms.ph?subject=Enterprise%20Inquiry"
            className="w-full md:w-auto text-center px-6 py-3 rounded-xl bg-white text-trust-harbor hover:bg-clinical-cloud font-bold text-sm whitespace-nowrap transition-colors shadow-md font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trust-harbor"
          >
            Contact Enterprise Sales
          </a>
        </div>

        {/* Commitment & Features Banner */}
        <div className="mt-12 text-center">
          <p className="text-sm text-white/70 font-body">
            All paid plans include a <strong className="text-white/90">12-month contract commitment</strong> with flexible monthly or annual billing options.
          </p>
        </div>
      </div>
    </section>
  );
};

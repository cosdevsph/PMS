import React from 'react';
import { Building2, CalendarCheck, Check, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { SectionHeader } from './public/SectionHeader';
import { PlanCard } from './public/pricing/PlanCard';
import { PricingExplainer } from './public/pricing/PricingExplainer';
import { Reveal } from './motion/Reveal';
import {
  ANNUAL_DISCOUNT_PERCENT,
  BRANCH_LINE,
  COMMITMENT_REASON,
  CUSTOM_PLAN,
  PRICING_INTRO,
  PRICING_TIERS,
  STAFF_ACCOUNTS_LINE,
  annualSavings,
  formatPeso,
} from '../data/pricing';

export const Plans: React.FC = () => {
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
          description={
            <>
              <strong className="block mb-2 text-white font-heading font-bold">{PRICING_INTRO.lead}</strong>
              {PRICING_INTRO.text}
            </>
          }
        />

        {/* Pricing Cards Grid */}
        <ul className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-md md:max-w-none mx-auto">
          {PRICING_TIERS.map((tier, index) => (
            <Reveal as="li" key={tier.id} delay={index * 80} className="h-full">
              <PlanCard
                tone="dark"
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
                  { icon: ShieldCheck, label: 'Full System Access Included', emphasis: true },
                  { icon: Check, label: STAFF_ACCOUNTS_LINE.label, sublabel: STAFF_ACCOUNTS_LINE.sublabel },
                ]}
                ctaLabel="Start 14-Day Free Trial"
                ctaTo="/register"
                ctaNote="No credit card required for trial"
              />
            </Reveal>
          ))}
        </ul>

        <PricingExplainer tone="dark" />

        {/* Enterprise & Custom Scale Callout */}
        <div className="mt-12 rounded-3xl bg-white/[0.06] ring-1 ring-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-healing-mint flex items-center justify-center shrink-0" aria-hidden="true">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">
                {CUSTOM_PLAN.title}
              </h3>
              <p className="mt-1 text-sm text-white/75 font-body max-w-2xl leading-relaxed">
                {CUSTOM_PLAN.text}
              </p>
            </div>
          </div>

          <a
            href="mailto:support@malasakitpms.ph?subject=Custom%20Plan%20Inquiry"
            className="w-full md:w-auto text-center px-6 py-3 rounded-xl bg-white text-trust-harbor hover:bg-clinical-cloud font-bold text-sm whitespace-nowrap transition-colors shadow-md font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trust-harbor"
          >
            Contact Us About a Custom Plan
          </a>
        </div>

        {/* Why a minimum term */}
        <div className="mt-12 rounded-3xl bg-white/[0.06] ring-1 ring-white/10 p-6 sm:p-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-healing-mint flex items-center justify-center shrink-0" aria-hidden="true">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-heading">{COMMITMENT_REASON.title}</h3>
            <div className="mt-2 space-y-3 max-w-3xl text-sm sm:text-base text-white/80 font-body leading-relaxed">
              {COMMITMENT_REASON.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PlanHighlight {
  icon: LucideIcon;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  emphasis?: boolean;
}

/** One billing option shown side by side with the others (e.g. monthly and annual). */
export interface PriceOption {
  label: string;
  price: string;
  period: string;
  /** Small highlighted tag, e.g. "10% off". */
  tag?: string;
  /** Small print under the price, e.g. "Save ₱8,398.80 a year". */
  note?: string;
}

export interface PlanCardProps {
  name: string;
  description: string;
  /** Single price. Ignored when `priceOptions` is given. */
  priceLabel?: string;
  periodLabel?: string;
  savingsLabel?: string;
  /** Two or more billing options rendered side by side. */
  priceOptions?: PriceOption[];
  /** Small print under the price (e.g. branch add-on pricing). */
  priceNote?: string;
  badge?: string;
  highlight?: boolean;
  highlights?: PlanHighlight[];
  features?: string[];
  ctaLabel: string;
  ctaTo: string;
  ctaNote?: string;
  tone?: 'dark' | 'light';
  headingLevel?: 'h3' | 'h2';
}

const TONES = {
  dark: {
    card: 'bg-white/[0.06] ring-1 ring-white/10 hover:ring-white/20',
    cardHighlight: 'bg-white/[0.1] ring-2 ring-healing-mint/70 shadow-2xl shadow-black/20',
    name: 'text-white',
    description: 'text-white/75',
    divider: 'border-white/10',
    price: 'text-white',
    period: 'text-white/70',
    savings: 'text-healing-mint',
    note: 'text-white/65',
    chip: 'bg-white/10 text-healing-mint',
    item: 'text-white/85',
    itemEmphasis: 'text-white font-semibold',
    sublabel: 'text-white/60',
    check: 'text-healing-mint',
    cta: 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white focus-visible:ring-offset-trust-harbor',
    ctaHighlight:
      'bg-primary-gradient text-white hover:opacity-95 shadow-lg focus-visible:ring-white focus-visible:ring-offset-trust-harbor',
    ctaNote: 'text-white/60',
    badge: 'bg-healing-mint text-trust-harbor',
    optionBase: 'bg-white/[0.04] ring-white/10',
    optionAccent: 'bg-healing-mint/10 ring-healing-mint/40',
    optionTag: 'bg-healing-mint text-trust-harbor font-bold',
  },
  light: {
    card: 'bg-white ring-1 ring-gray-200 hover:ring-gray-300 shadow-sm',
    cardHighlight: 'bg-white ring-2 ring-care-blue shadow-xl shadow-care-blue/10',
    name: 'text-gray-900',
    description: 'text-steady-slate',
    divider: 'border-gray-100',
    price: 'text-gray-900',
    period: 'text-steady-slate',
    savings: 'text-emerald-700',
    note: 'text-steady-slate',
    chip: 'bg-care-blue/10 text-care-blue',
    item: 'text-gray-700',
    itemEmphasis: 'text-gray-900 font-semibold',
    sublabel: 'text-steady-slate',
    check: 'text-care-blue',
    cta: 'bg-clinical-cloud text-trust-harbor ring-1 ring-gray-200 hover:bg-gray-100 focus-visible:ring-care-blue',
    ctaHighlight: 'bg-primary-gradient text-white hover:opacity-95 shadow-md focus-visible:ring-care-blue',
    ctaNote: 'text-steady-slate',
    badge: 'bg-care-blue text-white',
    optionBase: 'bg-clinical-cloud ring-gray-200',
    optionAccent: 'bg-emerald-50 ring-emerald-300',
    optionTag: 'bg-emerald-600 text-white font-bold',
  },
} as const;

/** Presentational subscription plan card shared by the landing Plans section and /pricing. */
export const PlanCard: React.FC<PlanCardProps> = ({
  name,
  description,
  priceLabel,
  periodLabel,
  savingsLabel,
  priceOptions,
  priceNote,
  badge,
  highlight = false,
  highlights = [],
  features = [],
  ctaLabel,
  ctaTo,
  ctaNote,
  tone = 'dark',
  headingLevel = 'h3',
}) => {
  const t = TONES[tone];
  const Heading = headingLevel;

  return (
    <div
      className={`relative h-full rounded-3xl p-7 sm:p-8 flex flex-col transition-shadow duration-200 ${
        highlight ? t.cardHighlight : t.card
      }`}
    >
      {badge && (
        <span
          className={`absolute -top-3 left-7 sm:left-8 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm font-body ${t.badge}`}
        >
          {badge}
        </span>
      )}

      <Heading className={`text-xl sm:text-2xl font-heading font-bold ${t.name}`}>{name}</Heading>
      <p className={`mt-2 text-sm leading-relaxed font-body lg:min-h-[2.75rem] ${t.description}`}>{description}</p>

      <div className={`mt-6 pt-6 border-t ${t.divider}`}>
        {priceOptions && priceOptions.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {priceOptions.map((option) => (
              <div
                key={option.label}
                className={`rounded-2xl p-3.5 ring-1 ${option.tag ? t.optionAccent : t.optionBase}`}
              >
                <p className={`text-[11px] font-bold uppercase tracking-wider font-body flex items-center gap-1.5 flex-wrap min-h-[1.25rem] ${t.period}`}>
                  {option.label}
                  {option.tag && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] normal-case tracking-normal ${t.optionTag}`}>{option.tag}</span>
                  )}
                </p>
                <p className={`mt-1.5 text-2xl tracking-tight font-heading font-extrabold tabular-nums leading-tight ${t.price}`}>
                  {option.price}
                </p>
                <p className={`text-xs font-body ${t.period}`}>{option.period}</p>
                {option.note && <p className={`mt-1 text-[11px] font-semibold font-body ${t.savings}`}>{option.note}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-4xl tracking-tight font-heading font-extrabold tabular-nums ${t.price}`}>{priceLabel}</span>
            <span className={`text-sm font-body ${t.period}`}>{periodLabel}</span>
          </p>
        )}
        {savingsLabel && <p className={`mt-1.5 text-xs font-semibold font-body ${t.savings}`}>{savingsLabel}</p>}
        {priceNote && <p className={`mt-1.5 text-xs font-body ${t.note}`}>{priceNote}</p>}
      </div>

      {highlights.length > 0 && (
        <ul className="mt-6 space-y-3.5 text-sm font-body">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index} className={`flex items-start gap-3 ${item.emphasis ? t.itemEmphasis : t.item}`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.chip}`} aria-hidden="true">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="pt-1">
                  {item.label}
                  {item.sublabel && <span className={`block text-xs font-normal mt-0.5 ${t.sublabel}`}>{item.sublabel}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {features.length > 0 && (
        <ul className={`mt-6 space-y-3 text-sm font-body ${t.item}`}>
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <Check className={`w-4 h-4 mt-0.5 shrink-0 ${t.check}`} aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={`mt-auto pt-8`}>
        <Link
          to={ctaTo}
          aria-label={`${ctaLabel} — ${name}`}
          className={`block w-full py-3.5 px-4 text-center text-sm font-bold rounded-xl transition-all duration-200 font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            highlight ? t.ctaHighlight : t.cta
          }`}
        >
          {ctaLabel}
        </Link>
        {ctaNote && <p className={`mt-2.5 text-center text-xs font-body ${t.ctaNote}`}>{ctaNote}</p>}
      </div>
    </div>
  );
};

export default PlanCard;

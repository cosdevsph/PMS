import React from 'react';

export interface BillingToggleProps {
  isAnnual: boolean;
  onChange: (isAnnual: boolean) => void;
}

/** Monthly / Annual segmented control for use on dark or brand-gradient backgrounds. */
export const BillingToggle: React.FC<BillingToggleProps> = ({ isAnnual, onChange }) => {
  const base =
    'px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-colors duration-200 font-body flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trust-harbor';
  const active = 'bg-white text-trust-harbor shadow-md';
  const inactive = 'text-white/85 hover:text-white hover:bg-white/10';

  return (
    <div role="group" aria-label="Billing cycle" className="inline-flex p-1 rounded-2xl bg-white/10 ring-1 ring-white/20">
      <button type="button" aria-pressed={!isAnnual} onClick={() => onChange(false)} className={`${base} ${!isAnnual ? active : inactive}`}>
        Monthly Billing
      </button>
      <button type="button" aria-pressed={isAnnual} onClick={() => onChange(true)} className={`${base} ${isAnnual ? active : inactive}`}>
        <span>Annual Billing</span>
        <span
          className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isAnnual ? 'bg-healing-mint/25 text-trust-harbor' : 'bg-healing-mint/20 text-healing-mint'
          }`}
        >
          Save ~10%
        </span>
      </button>
      <span className="sr-only" aria-live="polite">
        {isAnnual ? 'Annual Billing' : 'Monthly Billing'}
      </span>
    </div>
  );
};

export default BillingToggle;

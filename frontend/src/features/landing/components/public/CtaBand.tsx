import React from 'react';

export interface CtaBandProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** Closing call-to-action panel used at the end of footer pages. */
export const CtaBand: React.FC<CtaBandProps> = ({ title, description, children, className = '' }) => (
  <div className={`relative overflow-hidden rounded-3xl bg-trust-harbor px-6 py-12 sm:px-12 sm:py-14 text-center ${className}`}>
    <div
      className="absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-56 bg-care-blue/40 rounded-full blur-3xl pointer-events-none"
      aria-hidden="true"
    />
    <div className="relative max-w-2xl mx-auto">
      <h2 className="text-2xl sm:text-3xl tracking-tight text-white font-display">{title}</h2>
      {description && <p className="mt-3 text-base sm:text-lg text-white/80 leading-relaxed font-body">{description}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  </div>
);

/** Primary button styling for links inside a CtaBand. */
export const ctaBandButtonClass =
  'inline-flex items-center justify-center bg-white text-trust-harbor px-8 py-3.5 rounded-xl font-bold hover:bg-clinical-cloud transition-colors shadow-md font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trust-harbor';

/** Shared styles for the (non-functional, flagged) newsletter forms on footer pages. */
export const ctaBandInputClass =
  'flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/10 ring-1 ring-inset ring-white/25 text-white placeholder-white/60 font-body focus:outline-none focus:ring-2 focus:ring-healing-mint';

export default CtaBand;

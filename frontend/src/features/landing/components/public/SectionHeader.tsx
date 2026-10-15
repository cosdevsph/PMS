import React from 'react';

export interface SectionHeaderProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  id?: string;
  align?: 'center' | 'left';
  tone?: 'light' | 'dark';
  className?: string;
}

/** Shared eyebrow + h2 + lead pattern for public-site sections. */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  eyebrow,
  description,
  id,
  align = 'center',
  tone = 'light',
  className = '',
}) => {
  const isDark = tone === 'dark';

  return (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} max-w-3xl ${className}`}>
      {eyebrow && (
        <p
          className={`mb-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] font-body ${
            isDark ? 'text-healing-mint' : 'text-care-blue'
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={`text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] tracking-tight font-display ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 text-base sm:text-lg leading-relaxed font-body ${
            isDark ? 'text-white/80' : 'text-steady-slate'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;

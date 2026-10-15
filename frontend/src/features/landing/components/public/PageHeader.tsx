import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface PageHeaderProps {
  category: 'Company' | 'Product' | 'Legal';
  title: React.ReactNode;
  /** Shorter label for the breadcrumb when the title is long. */
  breadcrumbLabel?: string;
  description?: React.ReactNode;
  /** Extra content below the description (e.g. a billing toggle). */
  children?: React.ReactNode;
}

/** Brand-gradient page header with breadcrumb, used by every footer page. */
export const PageHeader: React.FC<PageHeaderProps> = ({ category, title, breadcrumbLabel, description, children }) => {
  return (
    <header className="relative overflow-hidden bg-primary-gradient text-white">
      {/* Brand pillar-arch motif (static) */}
      <div
        className="absolute right-0 bottom-0 hidden sm:flex items-end gap-3 pr-6 lg:pr-16 pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-16 lg:w-24 h-48 lg:h-64 rounded-t-full bg-white/[0.05] border-t border-l border-white/[0.08]" />
        <div className="w-20 lg:w-28 h-36 lg:h-48 rounded-t-full bg-white/[0.04] border-t border-l border-white/[0.06]" />
        <div className="w-14 lg:w-20 h-24 lg:h-32 rounded-t-full bg-white/[0.03] border-t border-l border-white/[0.05]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-14 sm:pb-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/85 font-body">
            <li>
              <Link
                to="/"
                className="rounded hover:text-white hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            </li>
            <li>{category}</li>
            <li aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            </li>
            <li aria-current="page" className="font-medium text-white">
              {breadcrumbLabel ?? title}
            </li>
          </ol>
        </nav>

        <div className="mt-6 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl tracking-tight leading-[1.1] font-display">{title}</h1>
          {description && (
            <p className="mt-4 text-lg sm:text-xl text-white/90 leading-relaxed font-body">{description}</p>
          )}
        </div>

        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  );
};

export default PageHeader;

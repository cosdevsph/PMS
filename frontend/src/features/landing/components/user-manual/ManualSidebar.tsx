import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { getSidebarStructure } from '../../data/manual-registry';

interface ManualSidebarProps {
  activeChapterId: string;
  /** desktop: sticky card beside the content; mobile: collapsible table of contents above it */
  variant?: 'desktop' | 'mobile';
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-1';

export const ManualSidebar: React.FC<ManualSidebarProps> = ({ activeChapterId, variant = 'desktop' }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const structure = getSidebarStructure();
  const navRef = useRef<HTMLElement>(null);
  const isMobile = variant === 'mobile';

  // Keep the active chapter visible inside the sidebar's own scroll area (never scrolls the page)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || (isMobile && !isMobileOpen)) return;
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const top = active.offsetTop - nav.offsetTop;
    const bottom = top + active.offsetHeight;
    if (top < nav.scrollTop + 8) nav.scrollTop = Math.max(0, top - 48);
    else if (bottom > nav.scrollTop + nav.clientHeight - 8) nav.scrollTop = bottom - nav.clientHeight + 48;
  }, [activeChapterId, isMobile, isMobileOpen]);

  const list = (
    <nav
      ref={navRef}
      aria-label="User manual chapters"
      className={`relative space-y-7 overflow-y-auto overscroll-contain ${
        isMobile ? 'max-h-[60vh] px-4 pb-5 pt-1' : 'flex-1 px-3 pb-6 pt-1 [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent]'
      }`}
    >
      {structure.map((part) => (
        <div key={part.partTitle}>
          <h4 className="px-3 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] font-body">
            {part.partTitle}
          </h4>
          <ul className="space-y-0.5">
            {part.chapters.map((ch) => {
              const isActive = ch.id === activeChapterId;
              const match = ch.title.match(/^Chapter (\d+): (.*)$/);
              const number = match ? match[1] : '';
              const label = match ? match[2] : ch.title;
              return (
                <li key={ch.id}>
                  <a
                    href={`#${ch.id}`}
                    onClick={() => setIsMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={ch.title}
                    className={`group relative flex items-center gap-3 rounded-lg py-2 pl-3 pr-2 text-sm font-body transition-colors ${focusRing} ${
                      isActive
                        ? 'bg-care-blue/10 text-trust-harbor font-semibold'
                        : 'text-gray-600 hover:bg-clinical-cloud hover:text-trust-harbor'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-care-blue" aria-hidden="true" />
                    )}
                    <span
                      className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-bold tabular-nums ${
                        isActive
                          ? 'bg-care-blue text-white'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-trust-harbor'
                      }`}
                      aria-hidden="true"
                    >
                      {number}
                    </span>
                    <span className="leading-snug" aria-hidden="true">
                      {label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  if (isMobile) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-expanded={isMobileOpen}
          aria-controls="manual-toc-mobile"
          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left text-base font-semibold text-trust-harbor font-heading ${focusRing}`}
        >
          <span className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-care-blue" aria-hidden="true" />
            Table of Contents
          </span>
          <ChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 motion-reduce:transition-none ${isMobileOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        <div id="manual-toc-mobile" hidden={!isMobileOpen} className="border-t border-gray-100 pt-3">
          {list}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-6 pb-4 pt-5 border-b border-gray-100">
        <p className="flex items-center gap-2 text-sm font-bold text-trust-harbor font-heading">
          <BookOpen className="h-4 w-4 text-care-blue" aria-hidden="true" />
          User Manual
        </p>
        <h3 className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 font-body">
          Table of Contents
        </h3>
      </div>
      <div className="flex min-h-0 flex-1 flex-col pt-3">{list}</div>
    </div>
  );
};

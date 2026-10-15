import React from 'react';
import { List } from 'lucide-react';

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface LegalDocumentProps {
  sections: LegalSection[];
  /** Optional content rendered after the last section (e.g. a preferences panel). */
  footer?: React.ReactNode;
}

// Typography for long-form legal copy, applied to the plain elements inside each section
const proseClasses = [
  'text-base leading-7 text-gray-700 font-body',
  '[&_p+p]:mt-4 [&_p+ul]:mt-4 [&_ul+p]:mt-4',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:pl-1 [&_li]:marker:text-care-blue',
  '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-1.5 [&_h3]:font-heading',
  '[&_strong]:font-semibold [&_strong]:text-gray-900',
].join(' ');

const TocLinks: React.FC<{ sections: LegalSection[] }> = ({ sections }) => (
  <ol className="space-y-1 text-sm font-body">
    {sections.map((section) => (
      <li key={section.id}>
        <a
          href={`#${section.id}`}
          className="block rounded-lg px-3 py-1.5 text-steady-slate hover:text-care-blue hover:bg-clinical-cloud transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue"
        >
          {section.title}
        </a>
      </li>
    ))}
  </ol>
);

/** Readable legal-document layout with a sticky table of contents on desktop. */
export const LegalDocument: React.FC<LegalDocumentProps> = ({ sections, footer }) => {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        {/* Desktop table of contents */}
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-32">
            <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 font-body">
              On this page
            </p>
            <TocLinks sections={sections} />
          </nav>
        </aside>

        <div className="min-w-0 max-w-[72ch]">
          {/* Mobile table of contents */}
          <details className="lg:hidden mb-10 rounded-2xl border border-gray-200 bg-clinical-cloud/60 group">
            <summary className="flex items-center gap-2 cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-900 font-body rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue">
              <List className="w-4 h-4 text-care-blue" aria-hidden="true" />
              On this page
            </summary>
            <nav aria-label="On this page" className="px-1 pb-3">
              <TocLinks sections={sections} />
            </nav>
          </details>

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-32">
                <h2 id={`${section.id}-title`} className="text-2xl tracking-tight text-gray-900 font-display mb-4">
                  {section.title}
                </h2>
                <div className={proseClasses}>{section.content}</div>
              </section>
            ))}
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Contact card used at the end of legal documents. */
export const LegalContactCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-5 rounded-2xl border border-gray-200 bg-clinical-cloud p-6 [&_p+p]:mt-1">{children}</div>
);

export default LegalDocument;

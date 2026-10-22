import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { faqs } from '../data/faqs';
import { SUPPORT_EMAIL } from '../data/support';
import { SectionHeader } from './public/SectionHeader';

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" aria-labelledby="faq-title" className="py-20 sm:py-28 bg-white scroll-mt-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="faq-title"
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          description="Everything you need to know about Malasakit"
        />

        <div className="mt-12 sm:mt-14 divide-y divide-gray-200 rounded-2xl ring-1 ring-gray-200 bg-white shadow-sm overflow-hidden">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            const buttonId = `faq-button-${faq.id}`;
            const panelId = `faq-panel-${faq.id}`;

            return (
              <div key={faq.id} className={`transition-colors duration-200 ${isOpen ? 'bg-clinical-cloud/70' : 'bg-white'}`}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full px-5 sm:px-7 py-5 sm:py-6 text-left flex items-center justify-between gap-4 hover:bg-clinical-cloud transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-care-blue"
                  >
                    <span className="text-base sm:text-lg font-semibold text-gray-900 font-heading">
                      {faq.question}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? 'bg-care-blue text-white' : 'bg-care-blue/10 text-care-blue'
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  inert={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 sm:px-7 pb-6 text-base text-steady-slate leading-relaxed font-body">
                      {faq.answer}
                      {faq.link && (
                        <>
                          {' '}
                          <a
                            href={faq.link.href}
                            className="font-semibold text-care-blue underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue"
                          >
                            {faq.link.label}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 bg-trust-harbor text-white px-6 sm:px-8 py-4 rounded-2xl shadow-lg shadow-trust-harbor/15">
            <MessageCircle className="w-5 h-5 text-healing-mint shrink-0" aria-hidden="true" />
            <p className="text-base font-medium font-body">
              Still have questions?{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold underline decoration-white/40 underline-offset-4 hover:decoration-white rounded font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

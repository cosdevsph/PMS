import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { whyChooseItems } from '../data/whyChoose';
import { SectionHeader } from './public/SectionHeader';

export const WhyChoose: React.FC = () => {
  // The first reason starts open so the section does not read as a bare list of titles.
  const [openId, setOpenId] = useState<string | null>(whyChooseItems[0].id);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="why-malasakit" aria-labelledby="why-malasakit-title" className="py-20 sm:py-28 bg-white scroll-mt-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="why-malasakit-title"
          eyebrow="Why Malasakit"
          title="Why Clinics Choose Malasakit"
        />

        <div className="mt-12 sm:mt-14 divide-y divide-gray-200 rounded-2xl ring-1 ring-gray-200 bg-white shadow-sm overflow-hidden">
          {whyChooseItems.map((item) => {
            const isOpen = openId === item.id;
            const buttonId = `why-button-${item.id}`;
            const panelId = `why-panel-${item.id}`;

            return (
              <div key={item.id} className={`transition-colors duration-200 ${isOpen ? 'bg-clinical-cloud/70' : 'bg-white'}`}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full px-5 sm:px-7 py-5 sm:py-6 text-left flex items-center justify-between gap-4 hover:bg-clinical-cloud transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-care-blue"
                  >
                    <span className="text-base sm:text-lg font-semibold text-gray-900 font-heading">
                      {item.title}
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
                    <div className="px-5 sm:px-7 pb-6 space-y-3 text-base text-steady-slate leading-relaxed font-body">
                      {item.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;

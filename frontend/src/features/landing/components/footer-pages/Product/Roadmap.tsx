import React from 'react';
import { Circle, CircleDot, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { CtaBand, ctaBandButtonClass, ctaBandInputClass } from '../../public/CtaBand';
import { Reveal } from '../../motion/Reveal';

export const Roadmap: React.FC = () => {
  const roadmapItems = [
    {
      phase: 'Q2 2026',
      status: 'In Progress',
      items: [
        'Advanced patient analytics dashboard',
        'Multi-language support',
        'Mobile app for iOS and Android',
        'Video consultation integration'
      ]
    },
    {
      phase: 'Q3 2026',
      status: 'Planned',
      items: [
        'AI-powered appointment optimization',
        'Advanced prescription management',
        'Insurance claims automation',
        'Staff performance analytics'
      ]
    },
    {
      phase: 'Q4 2026',
      status: 'Planned',
      items: [
        'Telemedicine platform',
        'Patient portal enhancements',
        'Advanced reporting tools',
        'Integration marketplace'
      ]
    },
    {
      phase: 'Q1 2027',
      status: 'Planned',
      items: [
        'Blockchain-based records',
        'Advanced interoperability',
        'Machine learning predictions',
        'Custom workflow builder'
      ]
    }
  ];

  return (
    <PublicPageLayout title="Roadmap">
      <PageHeader category="Product" title="Product Roadmap" breadcrumbLabel="Roadmap" description="What's coming to Malasakit" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Roadmap Timeline */}
        <ol className="relative">
          {roadmapItems.map((phase, index) => {
            const inProgress = phase.status === 'In Progress';
            const isLast = index === roadmapItems.length - 1;
            return (
              <li key={index} className="relative flex gap-5 sm:gap-8 pb-10 last:pb-0">
                {/* Timeline rail */}
                <div className="relative flex flex-col items-center">
                  <span
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white ${
                      inProgress ? 'bg-care-blue text-white' : 'bg-clinical-cloud text-steady-slate border border-gray-200'
                    }`}
                    aria-hidden="true"
                  >
                    {inProgress ? <CircleDot className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </span>
                  {!isLast && <span className="flex-1 w-0.5 mt-2 bg-gradient-to-b from-care-blue/40 to-gray-200" aria-hidden="true" />}
                </div>

                <Reveal className="flex-1 min-w-0">
                  <div
                    className={`rounded-2xl bg-white p-6 sm:p-8 shadow-sm ${
                      inProgress ? 'ring-2 ring-care-blue/40' : 'ring-1 ring-gray-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                      <h2 className="text-2xl tracking-tight text-gray-900 font-display">{phase.phase}</h2>
                      <span
                        className={`px-3.5 py-1 rounded-full text-sm font-semibold font-body ${
                          inProgress
                            ? 'bg-care-blue/10 text-care-blue'
                            : 'bg-gray-100 text-steady-slate'
                        }`}
                      >
                        {phase.status}
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {phase.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-700 flex items-start gap-3 font-body">
                          <ArrowRight className="w-4 h-4 mt-1 text-care-blue shrink-0" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>

        {/* CTA */}
        <CtaBand
          className="mt-16 sm:mt-20"
          title="Stay Updated"
          description="Subscribe to our newsletter to get notified about new features"
        >
          <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
            <label htmlFor="roadmap-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="roadmap-newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              className={ctaBandInputClass}
            />
            <button type="submit" className={ctaBandButtonClass}>
              Subscribe
            </button>
          </form>
        </CtaBand>
      </div>
    </PublicPageLayout>
  );
};

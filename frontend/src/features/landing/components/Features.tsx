import React from 'react';
import { features } from '../data/features';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from './public/SectionHeader';
import { Reveal } from './motion/Reveal';

const scrollToPlans = () => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });

export const Features: React.FC = () => {
  // Brand-only icon tints, rotated across the grid
  const tints = [
    'bg-care-blue/10 text-care-blue',
    'bg-trust-harbor/10 text-trust-harbor',
    'bg-gentle-renewal/50 text-trust-harbor',
  ];

  return (
    <section id="features" aria-labelledby="features-title" className="py-20 sm:py-28 bg-clinical-cloud scroll-mt-28">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-5 lg:px-6">
        <SectionHeader
          id="features-title"
          eyebrow="Features"
          title="Powerful Features for Your Practice"
          description="Everything you need to streamline your clinic operations and deliver exceptional patient care."
        />

        <ul className="mt-14 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal as="li" key={feature.id} delay={(index % 3) * 80} className="h-full">
                <div className="group h-full flex flex-col bg-white rounded-2xl p-7 sm:p-8 ring-1 ring-gray-200/70 shadow-sm hover:shadow-lg hover:-translate-y-0.5 motion-reduce:transform-none transition-all duration-200">
                  <div className={`w-12 h-12 ${tints[index % tints.length]} rounded-xl flex items-center justify-center mb-5`} aria-hidden="true">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-heading">
                    {feature.title}
                  </h3>
                  <p className="text-base text-steady-slate leading-relaxed font-body">
                    {feature.description}
                  </p>

                  <button
                    type="button"
                    onClick={scrollToPlans}
                    aria-label={`Learn more about ${feature.title} — view pricing plans`}
                    className="mt-auto pt-5 self-start inline-flex items-center text-sm font-semibold text-care-blue hover:text-trust-harbor rounded transition-colors font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2"
                  >
                    Learn more <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-0.5 motion-reduce:transform-none transition-transform" aria-hidden="true" />
                  </button>
                </div>
              </Reveal>
            );
          })}
        </ul>

        {/* Bottom CTA */}
        <div className="mt-14 sm:mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-white rounded-2xl ring-1 ring-gray-200/70 shadow-sm px-6 sm:px-8 py-5">
            <p className="text-base text-steady-slate font-body">
              Ready to transform your practice?{' '}
            </p>
            <button
              type="button"
              onClick={scrollToPlans}
              className="text-base text-care-blue font-semibold hover:text-trust-harbor rounded transition-colors font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2"
            >
              View pricing plans →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

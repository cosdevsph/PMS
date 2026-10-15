import React from 'react';
import { Target, Award, Users } from 'lucide-react';
import { SectionHeader } from './public/SectionHeader';
import { Reveal } from './motion/Reveal';

export const About: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'Empowering healthcare providers with technology that simplifies practice management.',
      color: 'blue'
    },
    {
      icon: Award,
      title: 'Quality First',
      description: 'Built with best practices, security, and compliance at the core of everything we do.',
      color: 'harbor'
    },
    {
      icon: Users,
      title: 'Customer-Centric',
      description: 'Your success is our priority. We listen, adapt, and continuously improve.',
      color: 'mint'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-care-blue/10 text-care-blue';
      case 'harbor':
        return 'bg-trust-harbor/10 text-trust-harbor';
      case 'mint':
        return 'bg-gentle-renewal/50 text-trust-harbor';
      default:
        return 'bg-clinical-cloud text-steady-slate';
    }
  };

  return (
    <section id="about" aria-labelledby="about-title" className="py-20 sm:py-28 bg-white scroll-mt-28">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-5 lg:px-6">
        <SectionHeader
          id="about-title"
          eyebrow="About"
          title="Built for Healthcare Professionals"
          description="We understand the challenges of running a modern practice. That's why we created a platform that combines simplicity with powerful features."
        />

        {/* Values */}
        <ul className="mt-14 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-7xl mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Reveal
                as="li"
                key={index}
                delay={index * 80}
                className={`h-full ${index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className="h-full bg-white rounded-2xl p-7 sm:p-8 ring-1 ring-gray-200/80 shadow-sm hover:shadow-md hover:ring-gray-300/80 transition-shadow duration-200">
                  <div className={`w-12 h-12 ${getColorClasses(value.color)} rounded-xl flex items-center justify-center mb-5`} aria-hidden="true">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-heading">
                    {value.title}
                  </h3>
                  <p className="text-base text-steady-slate leading-relaxed font-body">
                    {value.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        {/* Story */}
        <Reveal className="mt-14 sm:mt-16">
          <div className="relative overflow-hidden bg-clinical-cloud rounded-3xl px-6 py-10 sm:px-12 sm:py-12 ring-1 ring-gray-200/60">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-gradient" aria-hidden="true" />
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed font-body">
                Founded by healthcare professionals and technologists, Malasakit was born from
                firsthand experience with outdated practice management systems. We believe
                that technology should enhance patient care, not complicate it.
              </p>
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed font-body">
                Today, we serve over 10,000 practitioners across multiple specialties,
                helping them save time, reduce errors, and focus on what matters most—their patients.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

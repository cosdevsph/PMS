import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Target, Lightbulb } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { CtaBand, ctaBandButtonClass } from '../../public/CtaBand';
import { Reveal } from '../../motion/Reveal';

export const About: React.FC = () => {
  const values = [
    {
      icon: Users,
      title: 'Patient-Centric',
      description: 'Everything we build is designed with patients and healthcare providers in mind.',
    },
    {
      icon: Target,
      title: 'Reliable & Secure',
      description: 'We maintain the highest standards of security and reliability for sensitive healthcare data.',
    },
    {
      icon: Lightbulb,
      title: 'Innovative',
      description: 'We continuously innovate to bring cutting-edge solutions to healthcare management.',
    },
  ];

  return (
    <PublicPageLayout title="About">
      <PageHeader category="Company" title="About Malasakit" description="Transforming healthcare practice management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 sm:space-y-20">
        {/* Mission Section */}
        <section aria-labelledby="mission-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12">
          <h2 id="mission-title" className="lg:col-span-4 text-3xl sm:text-4xl tracking-tight text-gray-900 font-display">
            Our Mission
          </h2>
          <p className="lg:col-span-8 text-lg sm:text-xl text-gray-700 leading-relaxed font-body">
            At Malasakit, we believe that healthcare professionals should spend their time caring for patients, not managing administrative tasks.
            We're committed to creating innovative, user-friendly software that empowers clinics and practices to operate more efficiently,
            reduce costs, and ultimately deliver better patient care.
          </p>
        </section>

        {/* Values */}
        <ul className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Reveal as="li" key={value.title} delay={index * 80} className="h-full">
                <div className="h-full rounded-2xl bg-white p-7 sm:p-8 ring-1 ring-gray-200/80 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center mb-5" aria-hidden="true">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-heading">{value.title}</h3>
                  <p className="text-steady-slate leading-relaxed font-body">{value.description}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        {/* Story */}
        <section aria-labelledby="story-title" className="relative overflow-hidden rounded-3xl bg-clinical-cloud ring-1 ring-gray-200/60 px-6 py-10 sm:px-12 sm:py-14">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-gradient" aria-hidden="true" />
          <div className="max-w-3xl">
            <h2 id="story-title" className="text-3xl tracking-tight text-gray-900 font-display mb-6">Our Story</h2>
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed font-body">
              <p>
                Malasakit was founded by a clinician, a physiotherapist, and built by software engineers and developers
                based in Bacolod City, Negros Occidental, Philippines, 6100.
              </p>
              <p>
                It started with a vision: clinics should spend their time caring for patients, not struggling with outdated,
                fragmented systems that waste time and money.
              </p>
              <p>
                "Malasakit" is a Filipino word that means compassion. It reflects our commitment to serving healthcare providers
                with genuine care and understanding, and to building a platform that addresses the real pain points clinics face every day.
              </p>
              <p>
                Today, we are proud to serve healthcare clinics, practitioners and doctors, helping them provide better care to their patients.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <CtaBand title="Join Us on Our Mission" description="Transform your practice with Malasakit today">
          <Link to="/pricing" className={ctaBandButtonClass}>
            Get Started
          </Link>
        </CtaBand>
      </div>
    </PublicPageLayout>
  );
};

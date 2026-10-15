import React from 'react';
import { MapPin, Briefcase, Check } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { CtaBand, ctaBandButtonClass } from '../../public/CtaBand';

export const Careers: React.FC = () => {
  const positions = [
    {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Bacolod City',
      type: 'Full-time'
    },
    {
      title: 'Healthcare Compliance Specialist',
      department: 'Operations',
      location: 'Remote',
      type: 'Full-time'
    },
    {
      title: 'Customer Success Manager',
      department: 'Sales & Support',
      location: 'Bacolod City',
      type: 'Full-time'
    },
    {
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time'
    },
    {
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time'
    }
  ];

  const reasons = [
    { title: 'Mission-Driven', description: 'Work on a product that positively impacts healthcare delivery and patient outcomes.' },
    { title: 'Collaborative Culture', description: 'Join a talented team that values innovation, creativity, and continuous learning.' },
    { title: 'Growth Opportunities', description: 'Develop your skills and advance your career with a rapidly growing company.' },
  ];

  const benefits = [
    { title: 'Competitive Salary', description: 'Industry-competitive compensation packages' },
    { title: 'Health Insurance', description: 'Comprehensive medical, dental, and vision coverage' },
    { title: 'Flexible Work', description: 'Remote and flexible working arrangements' },
    { title: 'Professional Development', description: 'Training budget and career development opportunities' },
  ];

  return (
    <PublicPageLayout title="Careers">
      <PageHeader category="Company" title="Careers" description="Join our team and help transform healthcare" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 sm:space-y-20">
        {/* Why Join Us */}
        <section aria-labelledby="why-join-title">
          <h2 id="why-join-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8">Why Join Malasakit?</h2>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {reasons.map((reason) => (
              <div key={reason.title} className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200/60 p-7">
                <h3 className="font-bold text-trust-harbor text-lg mb-2 font-heading">{reason.title}</h3>
                <p className="text-steady-slate leading-relaxed font-body">{reason.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section aria-labelledby="positions-title">
          <h2 id="positions-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8">Open Positions</h2>
          <ul className="divide-y divide-gray-200 rounded-2xl ring-1 ring-gray-200/80 bg-white shadow-sm overflow-hidden">
            {positions.map((position, index) => (
              <li key={index} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-heading">
                    {position.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-steady-slate text-sm font-body">
                    <span className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" aria-hidden="true" />
                      {position.department}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
                      {position.location}
                    </span>
                    <span className="bg-gentle-renewal/50 text-trust-harbor font-medium px-3 py-0.5 rounded-full">
                      {position.type}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="self-start sm:self-center text-sm font-bold text-care-blue hover:text-trust-harbor transition-colors rounded font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2"
                >
                  View →
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Benefits */}
        <section aria-labelledby="benefits-title" className="rounded-3xl bg-clinical-cloud ring-1 ring-gray-200/60 px-6 py-10 sm:px-12 sm:py-12">
          <h2 id="benefits-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8">Benefits & Perks</h2>
          <ul className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-lg bg-care-blue/10 text-care-blue flex items-center justify-center shrink-0" aria-hidden="true">
                  <Check className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 font-heading">{benefit.title}</h3>
                  <p className="text-steady-slate font-body">{benefit.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <CtaBand title="Ready to Make an Impact?" description="Send us your resume and let's talk about your future">
          <a href="mailto:careers@malasakit.com" className={ctaBandButtonClass}>
            Apply Now
          </a>
        </CtaBand>
      </div>
    </PublicPageLayout>
  );
};

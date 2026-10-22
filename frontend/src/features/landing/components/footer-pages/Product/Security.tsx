import React from 'react';
import { Shield, Lock, Eye } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { CtaBand, ctaBandButtonClass } from '../../public/CtaBand';
import { Reveal } from '../../motion/Reveal';
import { SUPPORT_EMAIL } from '../../../data/support';

export const Security: React.FC = () => {
  // Only describe controls that exist in the product. Do not add certifications or infrastructure
  // claims (SOC 2, ISO 27001, uptime, backup targets, 24/7 monitoring) unless they are true and documented.
  const securityFeatures = [
    {
      icon: Lock,
      title: 'Encrypted Clinical Notes',
      description: 'The content of clinical notes is encrypted before it is stored, so it is not kept as plain text in the database.'
    },
    {
      icon: Shield,
      title: 'Data Privacy & HIPAA-Aligned Practices',
      description: 'Malasakit is built to help clinics meet the Philippine Data Privacy Act, and Malasakit Systems incorporates HIPAA-aligned security practices.'
    },
    {
      icon: Eye,
      title: 'Access Control',
      description: 'Role-based access control and branch assignments ensure staff only see the information they are authorized to access.'
    }
  ];

  const approach = [
    'Philippine Data Privacy Act (RA 10173)',
    'HIPAA-aligned practices',
    'Patient privacy consent records',
    'Audit & version history',
  ];

  const practices = [
    {
      title: 'Role-Based Permissions',
      description: 'Owners, managers, practitioners, staff, finance and read-only users each get only the access their role needs.',
    },
    {
      title: 'Patient Consent',
      description: 'Data privacy consent is captured and stored with a signature, for online bookings and in the clinic.',
    },
    {
      title: 'Audit & Version History',
      description: 'Clinical notes and invoices keep a version history showing what changed, when and by whom.',
    },
    {
      title: 'Secure Sign-In',
      description: 'Token-based sessions with automatic sign-out after a period of inactivity.',
    },
  ];

  return (
    <PublicPageLayout title="Security">
      <PageHeader
        category="Product"
        title="Security & Compliance"
        breadcrumbLabel="Security"
        description="We take your data security seriously"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 sm:space-y-20">
        {/* Security Features */}
        <ul className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal as="li" key={index} delay={index * 80} className="h-full">
                <div className="h-full rounded-2xl bg-white ring-1 ring-gray-200/80 shadow-sm p-7 sm:p-8">
                  <span className="w-12 h-12 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center mb-5" aria-hidden="true">
                    <Icon className="w-6 h-6" />
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-heading">{feature.title}</h3>
                  <p className="text-steady-slate leading-relaxed font-body">{feature.description}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        {/* Compliance approach */}
        <section aria-labelledby="compliance-title" className="text-center">
          <h2 id="compliance-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8">Our Compliance Approach</h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {approach.map((item) => (
              <li key={item} className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200/60 p-6">
                <p className="font-bold text-trust-harbor font-heading">{item}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl mx-auto text-sm text-steady-slate leading-relaxed font-body">
            These are tools and practices to support your clinic&apos;s own compliance. Clinics remain responsible for how they collect, use and share patient
            information. Malasakit Systems does not currently hold a formal HIPAA, SOC 2 or ISO 27001 certification.
          </p>
        </section>

        {/* Security Practices */}
        <section aria-labelledby="practices-title" className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          <h2 id="practices-title" className="lg:col-span-4 text-3xl tracking-tight text-gray-900 font-display">Our Security Practices</h2>
          <dl className="lg:col-span-8 divide-y divide-gray-200 border-y border-gray-200">
            {practices.map((practice) => (
              <div key={practice.title} className="py-5 sm:grid sm:grid-cols-3 sm:gap-6">
                <dt className="font-bold text-trust-harbor text-lg mb-1 sm:mb-0 font-heading">{practice.title}</dt>
                <dd className="sm:col-span-2 text-steady-slate leading-relaxed font-body">{practice.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Contact Security */}
        <CtaBand title="Have Security or Privacy Questions?" description="Send us a message and we will get back to you within one business day">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Security%20Question`} className={ctaBandButtonClass}>
            Contact Support
          </a>
        </CtaBand>
      </div>
    </PublicPageLayout>
  );
};

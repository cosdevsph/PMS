import React from 'react';
import { Shield, Lock, Eye } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { CtaBand, ctaBandButtonClass } from '../../public/CtaBand';
import { Reveal } from '../../motion/Reveal';

export const Security: React.FC = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All patient data is encrypted using industry-standard AES-256 encryption both in transit and at rest.'
    },
    {
      icon: Shield,
      title: 'HIPAA Compliance',
      description: 'Full compliance with HIPAA regulations to protect patient privacy and maintain data integrity.'
    },
    {
      icon: Eye,
      title: 'Access Control',
      description: 'Role-based access control ensures staff can only view data they are authorized to access.'
    }
  ];

  const certifications = ['HIPAA', 'SOC 2 Type II', 'ISO 27001', 'GDPR Compliant'];

  const practices = [
    {
      title: 'Regular Security Audits',
      description: 'We conduct regular third-party security audits to identify and address vulnerabilities.',
    },
    {
      title: 'Secure Infrastructure',
      description: 'Our infrastructure is hosted on AWS with multi-region redundancy and automatic backups.',
    },
    {
      title: 'Data Backup & Recovery',
      description: 'Automatic daily backups with recovery point objectives (RPO) of less than 1 hour.',
    },
    {
      title: 'Incident Response',
      description: '24/7 security monitoring and incident response team for immediate threat mitigation.',
    },
    {
      title: 'Staff Training',
      description: 'All team members undergo regular security training and background checks.',
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

        {/* Certifications */}
        <section aria-labelledby="certifications-title" className="text-center">
          <h2 id="certifications-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8">Certifications & Compliance</h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {certifications.map((cert, index) => (
              <li
                key={index}
                className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200/60 p-6"
              >
                <p className="font-bold text-trust-harbor font-heading">{cert}</p>
              </li>
            ))}
          </ul>
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
        <CtaBand title="Have Security Questions?" description="Our security team is ready to address your concerns">
          <a href="mailto:security@malasakit.com" className={ctaBandButtonClass}>
            Contact Security Team
          </a>
        </CtaBand>
      </div>
    </PublicPageLayout>
  );
};

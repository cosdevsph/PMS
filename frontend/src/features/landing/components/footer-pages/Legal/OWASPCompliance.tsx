import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { SystemBranding } from '@/config/branding';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';

export const OWASPCompliance: React.FC = () => {
  const standards = [
    {
      name: 'A01: Broken Access Control',
      status: 'Compliant',
      description: 'Role-based access control and proper authentication mechanisms implemented'
    },
    {
      name: 'A02: Cryptographic Failures',
      status: 'Compliant',
      description: 'All data encrypted in transit (TLS 1.3) and at rest (AES-256)'
    },
    {
      name: 'A03: Injection',
      status: 'Compliant',
      description: 'Parameterized queries and input validation on all user inputs'
    },
    {
      name: 'A04: Insecure Design',
      status: 'Compliant',
      description: 'Security-by-design principles and threat modeling integrated'
    },
    {
      name: 'A05: Security Misconfiguration',
      status: 'Compliant',
      description: 'Regular security audits and configuration reviews'
    },
    {
      name: 'A06: Vulnerable Components',
      status: 'Compliant',
      description: 'Automatic dependency scanning and patching'
    },
    {
      name: 'A07: Authentication Failures',
      status: 'Compliant',
      description: 'Multi-factor authentication and secure password policies'
    },
    {
      name: 'A08: Software/Data Integrity Failures',
      status: 'Compliant',
      description: 'Signed dependencies and secure CI/CD pipeline'
    },
    {
      name: 'A09: Logging & Monitoring Failures',
      status: 'Compliant',
      description: '24/7 security monitoring and comprehensive audit logs'
    },
    {
      name: 'A10: SSRF',
      status: 'Compliant',
      description: 'Network segmentation and request validation'
    }
  ];

  const initiatives = [
    {
      title: 'Secure Development Lifecycle',
      description: 'Security is integrated into every stage of our development process, from design through deployment.',
    },
    {
      title: 'Regular Audits & Testing',
      description: 'We conduct quarterly security audits, annual penetration testing, and continuous vulnerability scanning.',
    },
    {
      title: 'Bug Bounty Program',
      description: 'We maintain an active bug bounty program to identify and remediate security issues quickly.',
    },
    {
      title: 'Incident Response Plan',
      description: 'We have a documented incident response plan with 24/7 monitoring and rapid response capabilities.',
    },
  ];

  return (
    <PublicPageLayout title="OWASP Compliance">
      <PageHeader category="Legal" title="OWASP Compliance" description="Security Top 10 Compliance Overview" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 sm:space-y-20">
        {/* Overview */}
        <section aria-labelledby="about-owasp-title" className="grid lg:grid-cols-12 gap-6 lg:gap-12">
          <h2 id="about-owasp-title" className="lg:col-span-4 text-3xl tracking-tight text-gray-900 font-display">About OWASP</h2>
          <div className="lg:col-span-8 max-w-[72ch] space-y-4 text-lg text-gray-700 leading-relaxed font-body">
            <p>
              The Open Worldwide Application Security Project (OWASP) is a nonprofit foundation that works to improve the
              security of software. The OWASP Top 10 is a standard list of the most critical web application security risks.
            </p>
            <p>
              {SystemBranding.companyName} is fully compliant with OWASP Top 10 standards. Our development process includes
              security reviews, code analysis, and penetration testing to ensure protection against these vulnerabilities.
            </p>
          </div>
        </section>

        {/* Compliance Details */}
        <section aria-labelledby="compliance-status-title">
          <h2 id="compliance-status-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8">Compliance Status</h2>
          <ul className="divide-y divide-gray-200 rounded-2xl ring-1 ring-gray-200/80 bg-white shadow-sm overflow-hidden">
            {standards.map((standard, index) => (
              <li key={index} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <CheckCircle className="hidden sm:block w-6 h-6 text-care-blue shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 font-heading">
                    {standard.name}
                  </h3>
                  <p className="text-steady-slate font-body">{standard.description}</p>
                </div>
                <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 bg-gentle-renewal/50 text-trust-harbor rounded-full text-sm font-semibold font-body">
                  <CheckCircle className="sm:hidden w-4 h-4" aria-hidden="true" />
                  {standard.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Security Initiatives */}
        <section aria-labelledby="initiatives-title" className="rounded-3xl bg-clinical-cloud ring-1 ring-gray-200/60 px-6 py-10 sm:px-12 sm:py-12">
          <h2 id="initiatives-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8">Our Security Initiatives</h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {initiatives.map((initiative) => (
              <div key={initiative.title} className="flex gap-4">
                <span className="w-10 h-10 rounded-xl bg-care-blue/10 text-care-blue flex items-center justify-center shrink-0" aria-hidden="true">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1 font-heading">{initiative.title}</h3>
                  <p className="text-steady-slate leading-relaxed font-body">{initiative.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Certification */}
        <section aria-labelledby="certifications-title" className="text-center">
          <h2 id="certifications-title" className="text-3xl tracking-tight text-gray-900 font-display">Additional Certifications</h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {['SOC 2 Type II', 'ISO 27001', 'HIPAA', 'GDPR'].map((cert) => (
              <li key={cert} className="rounded-2xl bg-white ring-1 ring-gray-200/80 shadow-sm p-6">
                <p className="font-bold text-trust-harbor font-heading">{cert}</p>
                <p className="text-steady-slate text-sm mt-1.5 font-body">Certified</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicPageLayout>
  );
};

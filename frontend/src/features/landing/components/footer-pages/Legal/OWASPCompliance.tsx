import React from 'react';
import { CheckCircle } from 'lucide-react';
import { SystemBranding } from '@/config/branding';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';

export const OWASPCompliance: React.FC = () => {
  // Describe only controls that exist in the product. This page is NOT a compliance or audit claim;
  // do not add certifications, penetration tests, bug bounties or monitoring promises unless they are real.
  const controls = [
    {
      name: 'A01: Broken Access Control',
      description: 'Role-based permissions, and patient and branch visibility rules enforced on the server for each request.'
    },
    {
      name: 'A02: Cryptographic Failures',
      description: 'The content of clinical notes is encrypted before it is stored, and the application is served over HTTPS.'
    },
    {
      name: 'A03: Injection',
      description: 'Database access goes through the framework ORM (parameterized queries), and request data is validated by server-side serializers.'
    },
    {
      name: 'A07: Identification & Authentication Failures',
      description: 'Token-based sessions (refresh tokens can be revoked), reCAPTCHA on login, and a forced password change for temporary passwords.'
    },
    {
      name: 'A09: Logging & Monitoring Failures',
      description: 'Audit and version history on key records such as clinical notes and invoices, plus application logging.'
    }
  ];

  return (
    <PublicPageLayout title="Security Practices">
      <PageHeader category="Legal" title="Security Practices (OWASP Top 10)" breadcrumbLabel="OWASP Practices" description="How we approach common web application security risks" />

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
              {SystemBranding.companyName} uses the OWASP Top 10 as a reference when building and reviewing features. The controls below are the
              ones currently in place. This page is not an independent audit, assessment or certification.
            </p>
          </div>
        </section>

        {/* Compliance Details */}
        <section aria-labelledby="compliance-status-title">
          <h2 id="compliance-status-title" className="text-3xl tracking-tight text-gray-900 font-display mb-8">Controls in Place</h2>
          <ul className="divide-y divide-gray-200 rounded-2xl ring-1 ring-gray-200/80 bg-white shadow-sm overflow-hidden">
            {controls.map((standard, index) => (
              <li key={index} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <CheckCircle className="hidden sm:block w-6 h-6 text-care-blue shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 font-heading">
                    {standard.name}
                  </h3>
                  <p className="text-steady-slate font-body">{standard.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicPageLayout>
  );
};

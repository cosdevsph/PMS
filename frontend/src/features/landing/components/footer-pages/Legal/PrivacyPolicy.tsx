import React from 'react';
import { SystemBranding } from '@/config/branding';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { LegalDocument, LegalContactCard } from '../../public/LegalDocument';
import type { LegalSection } from '../../public/LegalDocument';

export const PrivacyPolicy: React.FC = () => {
  const sections: LegalSection[] = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: (
        <p>
          {SystemBranding.companyName} ("we," "us," "our," or "Company") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
          our website and services.
        </p>
      ),
    },
    {
      id: 'information-we-collect',
      title: '2. Information We Collect',
      content: (
        <div className="space-y-6">
          <div>
            <h3>Personal Information You Provide</h3>
            <p>
              We collect information you voluntarily provide, including your name, email address, phone number,
              clinic information, and payment details. This information is collected when you create an account,
              subscribe to services, or contact us.
            </p>
          </div>
          <div>
            <h3>Patient Information</h3>
            <p>
              As a healthcare practice management platform, you may store patient health information. This data
              is only used to provide our services and is never shared with third parties without explicit consent.
            </p>
          </div>
          <div>
            <h3>Automatically Collected Information</h3>
            <p>
              We automatically collect certain information about your device and how you interact with our platform,
              including IP address, browser type, and usage patterns.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'how-we-use-your-information',
      title: '3. How We Use Your Information',
      content: (
        <ul>
          <li>To provide, maintain, and improve our services</li>
          <li>To process transactions and send related information</li>
          <li>To send promotional communications (with your consent)</li>
          <li>To comply with legal obligations and regulations</li>
          <li>To prevent fraud and enhance security</li>
          <li>To analyze usage patterns and improve user experience</li>
        </ul>
      ),
    },
    {
      id: 'data-security',
      title: '4. Data Security',
      content: (
        <>
          <p>
            We implement comprehensive security measures to protect your information, including:
          </p>
          <ul>
            <li>End-to-end encryption for data in transit and at rest</li>
            <li>Regular security audits and penetration testing</li>
            <li>Secure access controls and authentication</li>
            <li>Automatic daily backups and disaster recovery</li>
            <li>Compliance with HIPAA, GDPR, and industry standards</li>
          </ul>
        </>
      ),
    },
    {
      id: 'data-retention',
      title: '5. Data Retention',
      content: (
        <p>
          We retain your data for as long as necessary to provide our services and comply with legal obligations.
          You may request deletion of your data at any time, subject to legal requirements.
        </p>
      ),
    },
    {
      id: 'your-rights',
      title: '6. Your Rights',
      content: (
        <>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability in a structured format</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </>
      ),
    },
    {
      id: 'third-party-services',
      title: '7. Third-Party Services',
      content: (
        <p>
          We use trusted third-party services for payments, analytics, and hosting. These services have their own
          privacy policies and are bound by strict data protection agreements. We do not share patient health
          information with third parties without explicit consent.
        </p>
      ),
    },
    {
      id: 'changes-to-this-policy',
      title: '8. Changes to This Policy',
      content: (
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant changes via email
          or by posting the updated policy on our website with an updated revision date.
        </p>
      ),
    },
    {
      id: 'contact-us',
      title: '9. Contact Us',
      content: (
        <>
          <p>
            If you have questions about this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <LegalContactCard>
            <p className="font-semibold text-gray-900">{SystemBranding.companyName}</p>
            <p>Email: privacy@malasakit.com</p>
            <p>Phone: +63 9457 123 456</p>
            <p>Address: Bacolod City, Negros Occidental, Philippines</p>
          </LegalContactCard>
        </>
      ),
    },
  ];

  return (
    <PublicPageLayout title="Privacy Policy">
      <PageHeader category="Legal" title="Privacy Policy" description="Last updated: April 2026" />
      <LegalDocument sections={sections} />
    </PublicPageLayout>
  );
};

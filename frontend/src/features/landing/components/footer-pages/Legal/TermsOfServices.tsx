import React from 'react';
import { SystemBranding } from '@/config/branding';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { LegalDocument, LegalContactCard } from '../../public/LegalDocument';
import type { LegalSection } from '../../public/LegalDocument';

export const TermsOfServices: React.FC = () => {
  const sections: LegalSection[] = [
    {
      id: 'acceptance-of-terms',
      title: '1. Acceptance of Terms',
      content: (
        <p>
          By accessing and using {SystemBranding.companyName} ("Service"), you accept and agree to be bound by the terms
          and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </p>
      ),
    },
    {
      id: 'service-description',
      title: '2. Service Description',
      content: (
        <p>
          Malasakit provides practice management software designed for healthcare professionals. The Service includes
          appointment scheduling, patient records management, billing, and related features. We reserve the right to
          modify features and services at any time with notice to users.
        </p>
      ),
    },
    {
      id: 'user-accounts',
      title: '3. User Accounts',
      content: (
        <>
          <p>
            To use the Service, you must create an account with accurate, complete, and current information.
            You are responsible for maintaining the confidentiality of your account credentials and for all activity
            under your account.
          </p>
          <p>
            You agree not to share your account with unauthorized persons and to notify us immediately of any
            unauthorized use of your account.
          </p>
        </>
      ),
    },
    {
      id: 'user-responsibilities',
      title: '4. User Responsibilities',
      content: (
        <ul>
          <li>Comply with all applicable laws and regulations</li>
          <li>Use the Service only for lawful purposes</li>
          <li>Not upload or store illegal content</li>
          <li>Maintain accurate patient records</li>
          <li>Comply with the Philippine Data Privacy Act and other applicable healthcare privacy regulations</li>
          <li>Not attempt to gain unauthorized access to the Service</li>
        </ul>
      ),
    },
    {
      id: 'intellectual-property',
      title: '5. Intellectual Property',
      content: (
        <>
          <p>
            All content, features, and functionality of the Service (including code, design, and text) are owned by{' '}
            {SystemBranding.companyName} and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You may not reproduce, modify, distribute, or transmit any content without our prior written permission.
          </p>
        </>
      ),
    },
    {
      id: 'payment-and-billing',
      title: '6. Payment and Billing',
      content: (
        <>
          <p>
            By providing payment information, you authorize us to charge the applicable subscription fees to your
            account. All fees are exclusive of applicable taxes.
          </p>
          <p>
            Paid subscriptions have a minimum term of twelve (12) months. You may pay monthly, or pay annually in advance
            at the discounted annual price. Paying monthly does not give you the right to cancel month to month.
          </p>
          <p>
            You may request cancellation at any time during the term. A cancellation takes effect at the end of your
            current twelve (12) month term, not immediately. You keep access to the Service until then, and you remain
            responsible for the fees for the remainder of the term. No refunds will be issued for any unused part of a
            term or billing period. Cancellation requests can be made and withdrawn by the clinic owner in the
            Subscription settings.
          </p>
        </>
      ),
    },
    {
      id: 'disclaimers',
      title: '7. Disclaimers',
      content: (
        <>
          <p>
            THE SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
            NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, error-free, or secure.
          </p>
        </>
      ),
    },
    {
      id: 'limitation-of-liability',
      title: '8. Limitation of Liability',
      content: (
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, MALASAKIT SOLUTIONS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
      ),
    },
    {
      id: 'indemnification',
      title: '9. Indemnification',
      content: (
        <p>
          You agree to indemnify and hold harmless {SystemBranding.companyName} and its officers, directors, and employees
          from any claims, damages, or costs arising from your use of the Service or violation of these Terms.
        </p>
      ),
    },
    {
      id: 'termination',
      title: '10. Termination',
      content: (
        <p>
          We may terminate your access to the Service at any time for violations of these Terms or for any other reason.
          Upon termination, your right to use the Service ceases immediately.
        </p>
      ),
    },
    {
      id: 'changes-to-terms',
      title: '11. Changes to Terms',
      content: (
        <p>
          We reserve the right to modify these Terms at any time. Changes become effective upon posting to the website.
          Your continued use of the Service constitutes acceptance of modified Terms.
        </p>
      ),
    },
    {
      id: 'contact',
      title: '12. Contact',
      content: (
        <>
          <p>
            If you have questions about these Terms, please contact us at:
          </p>
          <LegalContactCard>
            <p className="font-semibold text-gray-900">{SystemBranding.companyName}</p>
            <p>Email: legal@malasakit.com</p>
            <p>Address: Bacolod City, Negros Occidental, Philippines</p>
          </LegalContactCard>
        </>
      ),
    },
  ];

  return (
    <PublicPageLayout title="Terms of Service">
      <PageHeader category="Legal" title="Terms of Service" description="Last updated: April 2026" />
      <LegalDocument sections={sections} />
    </PublicPageLayout>
  );
};

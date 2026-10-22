import React from 'react';
import { SystemBranding } from '@/config/branding';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { LegalDocument, LegalContactCard } from '../../public/LegalDocument';
import type { LegalSection } from '../../public/LegalDocument';

export const CookiePolicy: React.FC = () => {
  const sections: LegalSection[] = [
    {
      id: 'what-are-cookies',
      title: '1. What Are Cookies?',
      content: (
        <p>
          Cookies are small text files placed on your device when you visit our website. They contain information
          about your browsing activity and preferences, enabling us to provide a better user experience.
        </p>
      ),
    },
    {
      id: 'types-of-cookies',
      title: '2. Types of Cookies We Use',
      content: (
        <div className="space-y-6">
          <div>
            <h3>Essential Cookies</h3>
            <p>
              These cookies are necessary for the basic functionality of our website and services. They enable
              user authentication, security features, and session management. These cookies cannot be disabled.
            </p>
          </div>
          <div>
            <h3>Performance Cookies</h3>
            <p>
              We use these cookies to analyze how visitors interact with our website, including pages visited,
              time spent on pages, and navigation patterns. This helps us improve site performance and user experience.
            </p>
          </div>
          <div>
            <h3>Functional Cookies</h3>
            <p>
              These cookies remember user preferences and choices (like language preferences and layout settings)
              to provide a personalized experience on return visits.
            </p>
          </div>
          <div>
            <h3>Marketing Cookies</h3>
            <p>
              We use these cookies to track your interest in our services and to show you relevant advertisements.
              You can opt-out of these cookies.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'third-party-cookies',
      title: '3. Third-Party Cookies',
      content: (
        <>
          <p>
            We use third-party services that may set their own cookies, including:
          </p>
          <ul>
            <li><strong>Analytics:</strong> Google Analytics for usage tracking and analysis</li>
            <li><strong>Payments:</strong> Payment processors for secure transaction handling</li>
            <li><strong>Social Media:</strong> Integration with social media platforms</li>
            <li><strong>Customer Support:</strong> Support ticket and AI assistant tools</li>
          </ul>
        </>
      ),
    },
    {
      id: 'cookie-duration',
      title: '4. How Long Do Cookies Persist?',
      content: (
        <>
          <p>
            <strong>Session Cookies:</strong> These are temporary cookies that are deleted when you close your browser.
            They are used for authentication and session management.
          </p>
          <p>
            <strong>Persistent Cookies:</strong> These cookies remain on your device for a specified period (typically
            months to years) and are used to remember preferences and track behavior.
          </p>
        </>
      ),
    },
    {
      id: 'managing-cookie-preferences',
      title: '5. Managing Your Cookie Preferences',
      content: (
        <>
          <p>
            You can control cookie preferences through your browser settings. Most browsers allow you to:
          </p>
          <ul>
            <li>View cookies stored on your device</li>
            <li>Delete cookies automatically when closing the browser</li>
            <li>Block cookies from specific websites</li>
            <li>Block third-party cookies</li>
          </ul>
          <p>
            <strong>Note:</strong> Disabling essential cookies may prevent you from accessing or using parts of our website.
          </p>
        </>
      ),
    },
    {
      id: 'do-not-track',
      title: '6. Do Not Track (DNT)',
      content: (
        <p>
          Some browsers include a "Do Not Track" feature. We respect DNT signals, although web standards for
          recognizing DNT signals have not been established. If you enable DNT in your browser, some features
          of our website may not function optimally.
        </p>
      ),
    },
    {
      id: 'cookie-consent',
      title: '7. Cookie Consent',
      content: (
        <p>
          We display a cookie consent banner when you first visit our website. By accepting cookies, you consent
          to our use of cookies as described in this policy. You can withdraw consent at any time by adjusting
          your preferences.
        </p>
      ),
    },
    {
      id: 'patient-data-and-cookies',
      title: '8. Patient Data and Cookies',
      content: (
        <p>
          We do not use cookies to store sensitive patient health information. Patient data is stored securely
          on our servers and is not accessible through cookies. Cookies are only used for session management
          and user preference tracking.
        </p>
      ),
    },
    {
      id: 'data-privacy-with-cookies',
      title: '9. Data Privacy with Cookies',
      content: (
        <p>
          Information collected through cookies is subject to our Privacy Policy. We do not sell or share
          personal information collected through cookies with third parties without your consent, except as
          required by law or as necessary to provide our services.
        </p>
      ),
    },
    {
      id: 'changes-to-this-policy',
      title: '10. Changes to This Policy',
      content: (
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our practices, technology,
          legal requirements, or other factors. We will notify you of significant changes by posting the updated
          policy on our website with an updated revision date.
        </p>
      ),
    },
    {
      id: 'contact-us',
      title: '11. Contact Us',
      content: (
        <>
          <p>
            If you have questions about our use of cookies, please contact us at:
          </p>
          <LegalContactCard>
            <p className="font-semibold text-gray-900">{SystemBranding.companyName}</p>
            <p>Email: privacy@malasakit.com</p>
            <p>Address: Bacolod City, Negros Occidental, Philippines</p>
          </LegalContactCard>
        </>
      ),
    },
  ];

  const checkboxClass = 'w-4 h-4 rounded border-gray-300 accent-care-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2';

  return (
    <PublicPageLayout title="Cookie Policy">
      <PageHeader category="Legal" title="Cookie Policy" description="Last updated: April 2026" />
      <LegalDocument
        sections={sections}
        footer={
          /* Cookie Settings Banner */
          <div className="rounded-2xl bg-clinical-cloud ring-1 ring-gray-200 p-6 sm:p-8">
            <h3 className="font-bold text-lg text-gray-900 mb-4 font-heading">Your Cookie Preferences</h3>
            <div className="space-y-3 text-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className={checkboxClass} />
                <span>Essential Cookies (cannot be disabled)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className={checkboxClass} />
                <span>Performance & Analytics</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className={checkboxClass} />
                <span>Functional Cookies</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className={checkboxClass} />
                <span>Marketing Cookies</span>
              </label>
            </div>
            <button className="mt-6 w-full sm:w-auto bg-trust-harbor text-white px-6 py-3 rounded-xl font-bold hover:bg-trust-harbor/90 transition-colors font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2">
              Save Preferences
            </button>
          </div>
        }
      />
    </PublicPageLayout>
  );
};

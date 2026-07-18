import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SystemBranding } from '@/config/branding';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center text-healing-mint hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-xl text-white/70 mt-2">Last updated: April 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8 text-white/80">
          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">1. Introduction</h2>
            <p>
              {SystemBranding.companyName} ("we," "us," "our," or "Company") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Personal Information You Provide</h3>
                <p>
                  We collect information you voluntarily provide, including your name, email address, phone number, 
                  clinic information, and payment details. This information is collected when you create an account, 
                  subscribe to services, or contact us.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Patient Information</h3>
                <p>
                  As a healthcare practice management platform, you may store patient health information. This data 
                  is only used to provide our services and is never shared with third parties without explicit consent.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Automatically Collected Information</h3>
                <p>
                  We automatically collect certain information about your device and how you interact with our platform, 
                  including IP address, browser type, and usage patterns.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">3. How We Use Your Information</h2>
            <ul className="space-y-2">
              <li>• To provide, maintain, and improve our services</li>
              <li>• To process transactions and send related information</li>
              <li>• To send promotional communications (with your consent)</li>
              <li>• To comply with legal obligations and regulations</li>
              <li>• To prevent fraud and enhance security</li>
              <li>• To analyze usage patterns and improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">4. Data Security</h2>
            <p>
              We implement comprehensive security measures to protect your information, including:
            </p>
            <ul className="space-y-2 mt-4">
              <li>• End-to-end encryption for data in transit and at rest</li>
              <li>• Regular security audits and penetration testing</li>
              <li>• Secure access controls and authentication</li>
              <li>• Automatic daily backups and disaster recovery</li>
              <li>• Compliance with HIPAA, GDPR, and industry standards</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">5. Data Retention</h2>
            <p>
              We retain your data for as long as necessary to provide our services and comply with legal obligations. 
              You may request deletion of your data at any time, subject to legal requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="space-y-2 mt-4">
              <li>• Access your personal information</li>
              <li>• Correct inaccurate data</li>
              <li>• Request deletion of your data</li>
              <li>• Opt-out of marketing communications</li>
              <li>• Data portability in a structured format</li>
              <li>• Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">7. Third-Party Services</h2>
            <p>
              We use trusted third-party services for payments, analytics, and hosting. These services have their own 
              privacy policies and are bound by strict data protection agreements. We do not share patient health 
              information with third parties without explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email 
              or by posting the updated policy on our website with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-4 bg-gray-800/50 p-6 rounded-lg border border-white/10">
              <p className="font-bold text-healing-mint">{SystemBranding.companyName}</p>
              <p>Email: privacy@malasakit.com</p>
              <p>Phone: +63 9457 123 456</p>
              <p>Address: Bacolod City, Negros Occidental, Philippines</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

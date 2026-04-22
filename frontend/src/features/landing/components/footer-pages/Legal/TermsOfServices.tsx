import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TermsOfServices: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center text-healing-mint hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <p className="text-xl text-white/70 mt-2">Last updated: April 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8 text-white/80">
          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Malasakit Solutions ("Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">2. Service Description</h2>
            <p>
              Malasakit provides practice management software designed for healthcare professionals. The Service includes 
              appointment scheduling, patient records management, billing, and related features. We reserve the right to 
              modify features and services at any time with notice to users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">3. User Accounts</h2>
            <div className="space-y-4">
              <p>
                To use the Service, you must create an account with accurate, complete, and current information. 
                You are responsible for maintaining the confidentiality of your account credentials and for all activity 
                under your account.
              </p>
              <p>
                You agree not to share your account with unauthorized persons and to notify us immediately of any 
                unauthorized use of your account.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">4. User Responsibilities</h2>
            <ul className="space-y-2">
              <li>• Comply with all applicable laws and regulations</li>
              <li>• Use the Service only for lawful purposes</li>
              <li>• Not upload or store illegal content</li>
              <li>• Maintain accurate patient records</li>
              <li>• Comply with HIPAA and healthcare privacy regulations</li>
              <li>• Not attempt to gain unauthorized access to the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Service (including code, design, and text) are owned by 
              Malasakit Solutions and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-4">
              You may not reproduce, modify, distribute, or transmit any content without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">6. Payment and Billing</h2>
            <div className="space-y-4">
              <p>
                By providing payment information, you authorize us to charge the applicable subscription fees to your 
                account. All fees are exclusive of applicable taxes.
              </p>
              <p>
                You may cancel your subscription at any time. Cancellation will take effect at the end of your current 
                billing period. No refunds will be issued for partial months.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">7. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, 
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR 
              NON-INFRINGEMENT.
            </p>
            <p className="mt-4">
              We do not warrant that the Service will be uninterrupted, error-free, or secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MALASAKIT SOLUTIONS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Malasakit Solutions and its officers, directors, and employees 
              from any claims, damages, or costs arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">10. Termination</h2>
            <p>
              We may terminate your access to the Service at any time for violations of these Terms or for any other reason. 
              Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes become effective upon posting to the website. 
              Your continued use of the Service constitutes acceptance of modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">12. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 bg-gray-800/50 p-6 rounded-lg border border-white/10">
              <p className="font-bold text-healing-mint">Malasakit Solutions</p>
              <p>Email: legal@malasakit.com</p>
              <p>Phone: +63 9457 123 456</p>
              <p>Address: Bacolod City, Negros Occidental, Philippines</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

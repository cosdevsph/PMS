import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center text-healing-mint hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Cookie Policy</h1>
          <p className="text-xl text-white/70 mt-2">Last updated: April 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8 text-white/80">
          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit our website. They contain information 
              about your browsing activity and preferences, enabling us to provide a better user experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">2. Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Essential Cookies</h3>
                <p>
                  These cookies are necessary for the basic functionality of our website and services. They enable 
                  user authentication, security features, and session management. These cookies cannot be disabled.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Performance Cookies</h3>
                <p>
                  We use these cookies to analyze how visitors interact with our website, including pages visited, 
                  time spent on pages, and navigation patterns. This helps us improve site performance and user experience.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Functional Cookies</h3>
                <p>
                  These cookies remember user preferences and choices (like language preferences and layout settings) 
                  to provide a personalized experience on return visits.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Marketing Cookies</h3>
                <p>
                  We use these cookies to track your interest in our services and to show you relevant advertisements. 
                  You can opt-out of these cookies.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">3. Third-Party Cookies</h2>
            <p>
              We use third-party services that may set their own cookies, including:
            </p>
            <ul className="space-y-2 mt-4">
              <li>• <strong>Analytics:</strong> Google Analytics for usage tracking and analysis</li>
              <li>• <strong>Payments:</strong> Payment processors for secure transaction handling</li>
              <li>• <strong>Social Media:</strong> Integration with social media platforms</li>
              <li>• <strong>Customer Support:</strong> Live chat and support tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">4. How Long Do Cookies Persist?</h2>
            <div className="space-y-4">
              <p>
                <strong>Session Cookies:</strong> These are temporary cookies that are deleted when you close your browser. 
                They are used for authentication and session management.
              </p>
              <p>
                <strong>Persistent Cookies:</strong> These cookies remain on your device for a specified period (typically 
                months to years) and are used to remember preferences and track behavior.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">5. Managing Your Cookie Preferences</h2>
            <div className="space-y-4">
              <p>
                You can control cookie preferences through your browser settings. Most browsers allow you to:
              </p>
              <ul className="space-y-2">
                <li>• View cookies stored on your device</li>
                <li>• Delete cookies automatically when closing the browser</li>
                <li>• Block cookies from specific websites</li>
                <li>• Block third-party cookies</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> Disabling essential cookies may prevent you from accessing or using parts of our website.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">6. Do Not Track (DNT)</h2>
            <p>
              Some browsers include a "Do Not Track" feature. We respect DNT signals, although web standards for 
              recognizing DNT signals have not been established. If you enable DNT in your browser, some features 
              of our website may not function optimally.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">7. Cookie Consent</h2>
            <p>
              We display a cookie consent banner when you first visit our website. By accepting cookies, you consent 
              to our use of cookies as described in this policy. You can withdraw consent at any time by adjusting 
              your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">8. Patient Data and Cookies</h2>
            <p>
              We do not use cookies to store sensitive patient health information. Patient data is stored securely 
              on our servers and is not accessible through cookies. Cookies are only used for session management 
              and user preference tracking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">9. Data Privacy with Cookies</h2>
            <p>
              Information collected through cookies is subject to our Privacy Policy. We do not sell or share 
              personal information collected through cookies with third parties without your consent, except as 
              required by law or as necessary to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices, technology, 
              legal requirements, or other factors. We will notify you of significant changes by posting the updated 
              policy on our website with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-healing-mint mb-4">11. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at:
            </p>
            <div className="mt-4 bg-gray-800/50 p-6 rounded-lg border border-white/10">
              <p className="font-bold text-healing-mint">Malasakit Solutions</p>
              <p>Email: privacy@malasakit.com</p>
              <p>Phone: +63 9457 123 456</p>
              <p>Address: Bacolod City, Negros Occidental, Philippines</p>
            </div>
          </section>

          {/* Cookie Settings Banner */}
          <div className="bg-gradient-to-r from-healing-mint/20 to-blue-600/20 rounded-lg p-8 border border-healing-mint/50">
            <h3 className="font-bold text-lg mb-4">Your Cookie Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Essential Cookies (cannot be disabled)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Performance & Analytics</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Functional Cookies</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span>Marketing Cookies</span>
              </label>
            </div>
            <button className="mt-6 bg-healing-mint text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-white transition-colors w-full">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

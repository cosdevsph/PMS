import React from 'react';
import { DocCallout } from '../DocCallout';
import { ScreenshotPlaceholder } from '../ScreenshotPlaceholder';

const Chapter32: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how clinic owners can manage their Malasakit subscription, understand plan limits, and maintain uninterrupted access to the system.
      </p>

      {/* SECTION 32.1 — Overview */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        32.1 Overview
      </h3>
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The Subscription module is the central administrative hub where you manage your clinic's licensing for the Malasakit system. It allows owners to view their current plan, monitor feature usage against their limits, and process renewals or upgrades to support organizational growth.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Active subscription management is crucial to ensure uninterrupted access to the platform's clinical, scheduling, and financial tools.
          </p>
          
          <DocCallout type="info" title="Subscription Management">
            Subscription settings contain sensitive financial and operational controls. Consequently, they are only accessible to authorized users (typically the Clinic Owner) and are hidden from Managers, Practitioners, and other staff roles.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 32.2 — Subscription Plans */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        32.2 Subscription Plans
      </h3>
      <p className="text-gray-700 font-body mb-6">Evaluating features based on clinic size.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Malasakit offers tiered subscription plans designed to scale alongside your business—from solo practitioner setups to multi-branch enterprise networks. 
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            As your clinic expands, you may need to upgrade your plan to unlock higher capacity. Depending on the tier, plans dictate specific maximum allocations for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Number of registered Staff Users and Practitioners</li>
            <li>Number of distinct Clinic Branches</li>
            <li>Total Patient Capacity (if applicable)</li>
            <li>Cloud Storage allocations (for Clinical Note attachments, etc.)</li>
            <li>Access to Premium Features (e.g., automated communications)</li>
          </ul>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Because plans evolve, you are encouraged to carefully review the feature comparison details on the Subscription page before processing an upgrade.
          </p>

          <ScreenshotPlaceholder label="Screenshot 32.1: Subscription Plans Page. Highlight: Current subscription plan, Available upgrade options, Feature comparison cards, Current plan badge." />
        </div>
      </div>


      {/* SECTION 32.3 — Plan Limits */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        32.3 Plan Limits
      </h3>
      <p className="text-gray-700 font-body mb-6">Monitoring current operational capacity.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Every subscription tier includes hard usage limits. To help you monitor your clinic's expansion, the Subscription dashboard displays your current live usage directly alongside these limits (e.g., "3 of 5 Clinic Branches active").
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Visual progress bars help owners easily gauge remaining allocation before hitting a threshold.
          </p>

          <ScreenshotPlaceholder label="Screenshot 32.2: Plan Usage and Limits. Highlight: Current usage counters, Progress bars, Remaining allocation, Plan limit summary." />
          
          <DocCallout type="important">
            Reaching specific plan limits will actively prevent the creation of additional resources. For example, if you reach your Branch limit, the system will block the creation of new clinics until you upgrade to a higher tier.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 32.4 — Subscription Renewal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        32.4 Subscription Renewal
      </h3>
      <p className="text-gray-700 font-body mb-6">Maintaining uninterrupted platform access.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To prevent critical service interruptions, clinic owners must renew their subscription before the current billing cycle expires. The general renewal workflow involves:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Navigating to the <strong>Subscription</strong> page.</li>
            <li>Reviewing the current plan and deciding whether to maintain the tier or select an upgrade.</li>
            <li>Selecting the <strong>Renew</strong> option.</li>
            <li>Completing the secure payment gateway process (process varies depending on regional deployment).</li>
            <li>Verifying the subscription status updates to Active upon success.</li>
          </ol>

          <ScreenshotPlaceholder label="Screenshot 32.3: Subscription Renewal Process. Highlight: Renewal button, Subscription expiration date, Subscription status, Confirmation screen (if available)." />
        </div>
      </div>


      {/* SECTION 32.5 — Subscription Status */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        32.5 Subscription Status
      </h3>
      <p className="text-gray-700 font-body mb-6">Interpreting system licensing alerts.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Malasakit continuously tracks the health of your licensing agreement and will display your current state prominently. The common states include:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Active:</strong> License is valid and in good standing.</li>
            <li><strong>Expiring Soon:</strong> An alert indicating that the renewal date is approaching and action is required.</li>
            <li><strong>Expired:</strong> The license has lapsed, which may result in restricted access or total service interruption until renewed.</li>
            <li><strong>Trial:</strong> A temporary evaluation period with full or partial features unlocked.</li>
          </ul>

          <ScreenshotPlaceholder label="Screenshot 32.4: Current Subscription Status. Highlight: Status badge, Expiration date, Remaining subscription period." />
        </div>
      </div>


      {/* SECTION 32.6 — Best Practices */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        32.6 Best Practices
      </h3>
      
      <DocCallout type="tip" title="Subscription Tips">
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Monitor Capacity:</strong> Check your usage periodically to ensure you have enough remaining allocation for expected patient or staff growth.</li>
          <li><strong>Renew Early:</strong> Always process renewals well before expiration to eliminate the risk of operational downtime.</li>
          <li><strong>Evaluate Expansion:</strong> If your clinic is nearing the branch or user limit, factor an upgrade into your operational budget.</li>
          <li><strong>Update Billing Info:</strong> Ensure the clinic's billing contact and payment information remains accurate to prevent failed automated renewals.</li>
        </ul>
      </DocCallout>

    </>
  );
};

export default Chapter32;

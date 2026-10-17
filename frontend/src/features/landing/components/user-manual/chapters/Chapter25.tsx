import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot25_1 from '@/assets/manual/Chapter 25/Screensbot 25.1.png';
import Screenshot25_2 from '@/assets/manual/Chapter 25/Screensbot 25.2.png';
import Screenshot25_2_1 from '@/assets/manual/Chapter 25/Screensbot 25.2.1.png';

const Chapter25: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to access your clinic subscription, review your active plan and clinician allocations, and explore tier upgrades or branch add-ons.
      </p>

      {/* 14-DAY TRIAL PROMINENT NOTICE */}
      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 md:p-8 rounded-r-2xl mb-12 shadow-[0_2px_12px_rgb(16,185,129,0.08)]">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold uppercase rounded-md tracking-wider">
            Free Evaluation
          </span>
          <h3 className="text-xl font-bold text-emerald-950">Malasakit 14-Day Free Trial</h3>
        </div>
        <p className="text-gray-700 font-body leading-relaxed mb-4">
          Malasakit offers a full-featured <strong>14-day trial</strong> so you can experience the complete practice management system with your team. <strong>No credit card is required</strong> upon first registration. Your chosen subscription plan and billing will only take effect after the 14-day trial period concludes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm font-medium text-emerald-900 font-body pt-2 border-t border-emerald-200/60">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>14-day complete evaluation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Zero credit card required upfront</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Billing only begins after trial ends</span>
          </div>
        </div>
      </div>


      {/* SECTION 25.1 — Navigate to Setup and Account Card */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        25.1 Navigate to Setup and Select Subscription
      </h3>
      <p className="text-gray-700 font-body mb-6">
        Access your practice subscription details directly from the Account settings card.
      </p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body mb-6">
            <li>
              Click on <strong>Setup</strong> in the top primary navigation bar.
            </li>
            <li>
              Under the <strong>Account</strong> card, click <strong>Subscription</strong>.
            </li>
          </ol>

          <DocCallout type="info" title="Administrator & Owner Access">
            Subscription controls and billing settings contain confidential financial information and are accessible to Clinic Owners and authorized Administrators.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot25_1}
              alt="Screenshot 25.1: Navigate to Setup and under Account Card, select Subscription"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 25.2 — Current Subscription Plan Display */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        25.2 Current Subscription Plan Display
      </h3>
      <p className="text-gray-700 font-body mb-6">
        Review active tier details, remaining days, feature parity, and live entitlement usage.
      </p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Once on the <strong>Subscription & Entitlements</strong> page, your active plan information is presented in real time:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
              <h5 className="font-bold text-sky-950 text-sm mb-2">Active Plan Overview</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li>• <strong>Plan Tier:</strong> Displays your plan (e.g., <em>Professional Plan</em>) and billing cadence (<em>Monthly / Annual</em>).</li>
                <li>• <strong>Validity & Expiry:</strong> Highlights remaining days, start date, renewal/expiry date, and contract commitment.</li>
                <li>• <strong>Quick Controls:</strong> Click <em>Refresh Status</em> or <em>Change Tier / Add Branches</em> anytime.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <h5 className="font-bold text-emerald-950 text-sm mb-2">100% Full Feature Parity</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li>• <strong>No Feature Gating:</strong> All Malasakit plans grant complete access to all modules.</li>
                <li>• <strong>Included Features:</strong> Appointments & Diary, EMR & Clinical Notes, Invoicing & Receipts, PhilHealth claims, and Inventory.</li>
                <li>• <strong>Unlimited Staff:</strong> Receptionists, clinic managers, and billing staff do not consume clinician seats.</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 mb-6">
            <h5 className="font-bold text-gray-900 text-sm mb-2">Entitlement Usage & Capacity</h5>
            <ul className="text-xs space-y-1 text-gray-600 font-body">
              <li>• <strong>Clinician Allocations:</strong> Tracks assigned doctor/practitioner accounts against your licensed seat capacity (e.g., <em>0 of 4 seats used</em>).</li>
              <li>• <strong>Branch Locations:</strong> Tracks active clinic locations (e.g., <em>1 of 3 branches configured</em>). Additional branches can be added as needed.</li>
            </ul>
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot25_2}
              alt="Screenshot 25.2: Current Subscription plan and entitlement details display"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 25.2.1 — Other Upgrade of Plans */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        25.2.1 Compare Plans & Upgrade Tiers
      </h3>
      <p className="text-gray-700 font-body mb-6">
        Other upgrade plans are displayed on the same page in case of tier changes or branch expansion.
      </p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Scroll down on the same Subscription page to view the <strong>Compare Plans & Pricing Tiers</strong> section. You can evaluate available tiers and upgrade or switch plans whenever your practice expands:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  Essential Practice
                </span>
                <h5 className="font-bold text-gray-900 text-base mt-2">Starter</h5>
                <p className="text-xl font-bold text-gray-900 font-mono mt-1">₱3,999 <span className="text-xs text-gray-500 font-normal">/ mo</span></p>
                <p className="text-xs text-gray-500 mt-2">Ideal for emerging private practices and boutique healthcare clinics.</p>
                <ul className="text-xs space-y-1.5 text-gray-700 font-body mt-3 pt-3 border-t border-gray-100">
                  <li>• Up to 4 clinicians</li>
                  <li>• 1 branch included (+₱2,000/mo extra)</li>
                  <li>• 100% full feature access</li>
                  <li>• Unlimited Admin accounts</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/30 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Most Popular
                </span>
                <h5 className="font-bold text-gray-900 text-base mt-2">Growth</h5>
                <p className="text-xl font-bold text-gray-900 font-mono mt-1">₱6,999 <span className="text-xs text-gray-500 font-normal">/ mo</span></p>
                <p className="text-xs text-gray-500 mt-2">Designed for growing multi-disciplinary teams expanding clinical services.</p>
                <ul className="text-xs space-y-1.5 text-gray-700 font-body mt-3 pt-3 border-t border-gray-200">
                  <li>• Up to 8 clinicians</li>
                  <li>• 1 branch included (+₱2,500/mo extra)</li>
                  <li>• 100% full feature access</li>
                  <li>• Unlimited Admin accounts</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-white shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Advanced Operations
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-300 px-1.5 py-0.2 rounded">
                    Active
                  </span>
                </div>
                <h5 className="font-bold text-gray-900 text-base mt-2">Professional</h5>
                <p className="text-xl font-bold text-gray-900 font-mono mt-1">₱9,999 <span className="text-xs text-gray-500 font-normal">/ mo</span></p>
                <p className="text-xs text-gray-500 mt-2">Complete clinical infrastructure for high-volume practices and medical centers.</p>
                <ul className="text-xs space-y-1.5 text-gray-700 font-body mt-3 pt-3 border-t border-gray-100">
                  <li>• Up to 12 clinicians</li>
                  <li>• 1 branch included (+₱3,000/mo extra)</li>
                  <li>• 100% full feature access</li>
                  <li>• Unlimited Admin accounts</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Custom Scale
                </span>
                <h5 className="font-bold text-gray-900 text-base mt-2">Enterprise</h5>
                <p className="text-xl font-bold text-gray-900 font-mono mt-1">Custom <span className="text-xs text-gray-500 font-normal">pricing</span></p>
                <p className="text-xs text-gray-500 mt-2">Tailored capacity, custom branch networks, and dedicated support.</p>
                <ul className="text-xs space-y-1.5 text-gray-700 font-body mt-3 pt-3 border-t border-gray-100">
                  <li>• Custom clinician capacity</li>
                  <li>• Multi-branch included</li>
                  <li>• 100% full feature access</li>
                  <li>• Dedicated support</li>
                </ul>
              </div>
            </div>
          </div>

          <DocCallout type="tip" title="Flexible Annual Savings & Branch Add-Ons">
            You can toggle between <strong>Monthly</strong> and <strong>Annual</strong> billing at the top of the comparison matrix to save approximately <strong>10%</strong>. Additional physical branch locations can be added flexibly to any tier.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot25_2_1}
              alt="Screenshot 25.2.1: Other upgrade of plans displayed on the same page"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to manage your practice licensing and subscription:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li><strong>25.1 Navigation:</strong> Head to <strong>Setup</strong> and select <strong>Subscription</strong> under the Account card.</li>
        <li><strong>25.2 Current Plan Display:</strong> Monitor your active subscription tier, renewal/expiry date, contract term, and real-time clinician/branch allocations.</li>
        <li><strong>25.2.1 Plan Upgrades:</strong> Compare Starter, Growth, Professional, and Enterprise plans right on the same page whenever your clinic needs to expand seats or add branches.</li>
        <li><strong>14-Day Free Trial:</strong> Malasakit gives you 14 days of unrestricted access with no credit card required at sign up. Subscription plan charges only start after the 14-day trial ends.</li>
      </ul>
    </>
  );
};

export default Chapter25;

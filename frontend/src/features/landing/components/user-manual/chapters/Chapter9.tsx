import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot9_1 from '@/assets/manual/Chapter 9/Screenshot 9.1.webp';
import Screenshot9_2 from '@/assets/manual/Chapter 9/Screenshot 9.2.webp';
import Screenshot9_3 from '@/assets/manual/Chapter 9/Screenshot 9.3.webp';
import Screenshot9_4 from '@/assets/manual/Chapter 9/Screenshot 9.4.webp';
import Screenshot9_5 from '@/assets/manual/Chapter 9/Screenshot 9.5.webp';
import Screenshot9_6 from '@/assets/manual/Chapter 9/Screenshot 9.6.webp';
import Screenshot9_7 from '@/assets/manual/Chapter 9/Screenshot 9.7.webp';

const Chapter9: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn where to find the Permission Groups page in Malasakit PMS, understand the core permission groups, and see what features each group can access.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Permission Groups Quick Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Permission Groups define the exact tools and modules that users assigned to a specific role template can view, edit, or manage across your clinic:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Navigation Path</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Setup Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Users Card</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Click Permissions</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">Permission Groups Page</span>
          </div>
        </div>
      </div>


      {/* SECTION 9.1 — Locating the Permission Groups Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        9.1 Locating the Permission Groups Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Find and access the centralized permissions configuration page.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-4 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Go to the Setup Page:</strong> Click on <strong>Setup</strong> in the left-hand navigation sidebar to open your clinic's administrative hub.
            </li>
            <li>
              <strong>Find the Users Card:</strong> In the setup grid, locate the <strong>Users</strong> card (teal icon).
            </li>
            <li>
              <strong>Click Permissions:</strong> Select the <strong>Permissions</strong> option under the card.
            </li>
            <li>
              <strong>Permission Groups Page is Displayed:</strong> The system opens the <strong>Permission Groups</strong> builder, displaying all system templates, member counts, and customization controls.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot9_1}
              width={1032}
              height={976}
              decoding="async"
              alt="Screenshot 9.1: Permission Group Location"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot9_2}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 9.2: Permission Groups Page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Only clinic <strong>Owners</strong> have permission to open and configure the Permission Groups page. Restricted roles cannot modify group settings.
      </DocCallout>


      {/* SECTION 9.2 — Permission Groups & What They Can Access */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        9.2 Permission Groups & What They Can Access
      </h3>
      <p className="text-gray-700 font-body mb-6">
        Malasakit PMS includes five built-in system permission groups tailored for standard healthcare clinic workflows.
      </p>

      {/* Group 1: Owner */}
      <div className="space-y-8 mb-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
              System Protected
            </span>
            <h4 className="text-xl font-bold text-gray-900 font-heading">1. Owner</h4>
          </div>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Owner</strong> permission group grants full, unrestricted administrative and clinical authority across all clinic branches.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-body">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <p className="font-semibold text-emerald-900 mb-2">✔ What They Can Access:</p>
              <ul className="space-y-1 text-emerald-800 list-disc pl-5">
                <li>Full access to all clinic branches and locations</li>
                <li>Subscription, plan management, and invoices</li>
                <li>Staff account creation, editing, and archiving</li>
                <li>Permission groups configuration and customization</li>
                <li>All branch calendars, diaries, and patient records</li>
                <li>Organization-wide financial and performance reports</li>
                <li>Global clinic setup and communication settings</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="font-semibold text-gray-900 mb-2">✘ System Restrictions:</p>
              <ul className="space-y-1 text-gray-600 list-disc pl-5">
                <li>None — Owners have unrestricted access to all modules and system data.</li>
                <li>Protected group: cannot be deleted or revoked.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot9_3}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 9.3: Owner Permission Group Settings"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Group 2: Branch Manager */}
      <div className="space-y-8 mb-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 text-xs font-bold uppercase tracking-wider">
              Management
            </span>
            <h4 className="text-xl font-bold text-gray-900 font-heading">2. Branch Manager</h4>
          </div>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Branch Manager</strong> group is designed for administrative leaders overseeing day-to-day operations for their authorized clinic branches.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-body">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <p className="font-semibold text-emerald-900 mb-2">✔ What They Can Access:</p>
              <ul className="space-y-1 text-emerald-800 list-disc pl-5">
                <li>Manage staff and practitioners in assigned branches</li>
                <li>Patient records, appointments, calendar, and diary</li>
                <li>Branch-specific financial and performance reports</li>
                <li>Configure branch consent forms and public booking links</li>
                <li>Inventory and item management</li>
                <li>Invoices, billing, and operational communication</li>
                <li>View clinical notes for supervision (read-only)</li>
              </ul>
            </div>
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
              <p className="font-semibold text-rose-900 mb-2">✘ What They Cannot Access:</p>
              <ul className="space-y-1 text-rose-800 list-disc pl-5">
                <li>Cannot manage clinic subscription or billing settings</li>
                <li>Cannot modify system permission groups</li>
                <li>Cannot edit or sign medical clinical notes</li>
                <li>Cannot view or manage unassigned clinic branches</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot9_4}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 9.4: Branch Manager Permission Group Settings"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Group 3: Practitioner */}
      <div className="space-y-8 mb-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold uppercase tracking-wider">
              Clinical
            </span>
            <h4 className="text-xl font-bold text-gray-900 font-heading">3. Practitioner</h4>
          </div>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Practitioner</strong> group is tailored specifically for clinical providers focused on treating patients across their authorized clinic locations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-body">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <p className="font-semibold text-emerald-900 mb-2">✔ What They Can Access:</p>
              <ul className="space-y-1 text-emerald-800 list-disc pl-5">
                <li>Create, edit, and sign Clinical Notes and treatment records</li>
                <li>Patient medical charts, client cases, and documents</li>
                <li>Manage appointment schedules across authorized branches</li>
                <li>View branch calendar, diary, and own working availability</li>
                <li>View clinical outcome measures and treatment history</li>
                <li>View treatment invoices associated with their patients</li>
              </ul>
            </div>
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
              <p className="font-semibold text-rose-900 mb-2">✘ What They Cannot Access:</p>
              <ul className="space-y-1 text-rose-800 list-disc pl-5">
                <li>Cannot access Staff Management or edit employee accounts</li>
                <li>Cannot modify system permissions or clinic settings</li>
                <li>Cannot manage subscription plans or organization billing</li>
                <li>Cannot access financial accounting reports</li>
                <li>Strictly blocked from unassigned clinic branches</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot9_5}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 9.5: Practitioner Permission Group Settings"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Group 4: Front Desk */}
      <div className="space-y-8 mb-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider">
              Reception & Intake
            </span>
            <h4 className="text-xl font-bold text-gray-900 font-heading">4. Front Desk (Staff)</h4>
          </div>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Front Desk</strong> group is designed for receptionists and intake coordinators who manage appointments and patient check-ins.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-body">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <p className="font-semibold text-emerald-900 mb-2">✔ What They Can Access:</p>
              <ul className="space-y-1 text-emerald-800 list-disc pl-5">
                <li>Book, reschedule, and cancel calendar appointments</li>
                <li>Manage branch diary and incoming public portal bookings</li>
                <li>Register new patients and update contact demographics</li>
                <li>Manage patient check-ins and attendance statuses</li>
                <li>Generate invoices and process payment receipts at the front desk</li>
                <li>View patient clinical notes (read-only reference)</li>
              </ul>
            </div>
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
              <p className="font-semibold text-rose-900 mb-2">✘ What They Cannot Access:</p>
              <ul className="space-y-1 text-rose-800 list-disc pl-5">
                <li>Cannot author, edit, or sign clinical medical notes</li>
                <li>Cannot manage staff accounts or user permissions</li>
                <li>Cannot configure clinic settings or subscriptions</li>
                <li>Cannot access unassigned clinic branches</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot9_6}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 9.6: Front Desk Permission Group Settings"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Group 5: Finance */}
      <div className="space-y-8 mb-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 text-xs font-bold uppercase tracking-wider">
              Accounting & Billing
            </span>
            <h4 className="text-xl font-bold text-gray-900 font-heading">5. Finance</h4>
          </div>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Finance</strong> group is focused strictly on billing, invoicing, payments, and financial reporting for authorized clinic branches.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm font-body">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <p className="font-semibold text-emerald-900 mb-2">✔ What They Can Access:</p>
              <ul className="space-y-1 text-emerald-800 list-disc pl-5">
                <li>Create, edit, issue, and manage client invoices</li>
                <li>Record payments, track balances, and handle refunds</li>
                <li>Process bulk invoicing runs for corporate/insurance accounts</li>
                <li>Generate financial statements, revenue summaries, and tax reports</li>
                <li>View patient demographic information for invoicing purposes</li>
                <li>View appointment lists to verify billing items</li>
              </ul>
            </div>
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
              <p className="font-semibold text-rose-900 mb-2">✘ What They Cannot Access:</p>
              <ul className="space-y-1 text-rose-800 list-disc pl-5">
                <li>Cannot access clinical medical notes or treatment records</li>
                <li>Cannot access or manage clinic diary</li>
                <li>Cannot modify staff members or permission groups</li>
                <li>Cannot view financial data for unassigned clinic branches</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot9_7}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 9.7: Finance Permission Group Settings"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Remember that a user's final access is governed by both their <strong>Permission Group</strong> (which features are unlocked) and their <strong>Branch Assignment</strong> (which clinic locations they can see).
      </DocCallout>

      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to navigate and understand Permission Groups in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Navigating to <strong>Setup</strong> &rarr; <strong>Users Card</strong> &rarr; <strong>Permissions</strong> to find the Permission Groups page.</li>
        <li>The system-wide governance of the <strong>Owner</strong> group.</li>
        <li>The operational and staff oversight of the <strong>Branch Manager</strong> group.</li>
        <li>The dedicated clinical treatment authority of the <strong>Practitioner</strong> group.</li>
        <li>The scheduling and intake focus of the <strong>Front Desk (Staff)</strong> group.</li>
        <li>The billing, invoicing, and revenue focus of the <strong>Finance</strong> group.</li>
      </ul>
    </>
  );
};

export default Chapter9;

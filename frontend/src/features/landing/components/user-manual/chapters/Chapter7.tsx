import React from 'react';
import { DocCallout } from '../DocCallout';

import Diagram7_1 from '@/assets/manual/Chapter 7/Diagram 7.1.webp';
import Screenshot7_1 from '@/assets/manual/Chapter 7/Screenshot 7.1.webp';
import Screenshot7_2 from '@/assets/manual/Chapter 7/Screenshot 7.2.webp';
import Screenshot7_4 from '@/assets/manual/Chapter 7/Screenshot 7.4.webp';
import Screenshot7_6 from '@/assets/manual/Chapter 7/Screenshot 7.6.webp';
import Screenshot7_7 from '@/assets/manual/Chapter 7/Screenshot 7.7.webp';

const Chapter7: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how Malasakit combines Role-Based Access Control (RBAC) and Multi-Branch Authorization to securely govern feature permissions and clinic-specific patient data.
      </p>

      {/* IMPORTANT CONCEPT — How Multi-Branch RBAC Works */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-4">Understanding Multi-Branch RBAC</h3>
        
        <p className="text-gray-700 font-body mb-4">
          In Malasakit, every user account is assigned one or more roles and authorized for specific clinic branches. A user's effective permissions and visible data are calculated by evaluating two distinct authorization layers:
        </p>
        
        <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6 font-medium">
          <li>
            <strong>Role Permissions (What you can do):</strong> Assigned roles (e.g., Practitioner, Branch Manager, Front Desk, Finance) determine which features, modules, and administrative tools are unlocked.
          </li>
          <li>
            <strong>Branch Authorization (Where you can do it):</strong> Assigned clinic branches determine which physical clinic locations, patient records, appointment calendars, and reports you are authorized to view and manage.
          </li>
        </ol>

        <p className="text-gray-700 font-body mb-6">
          This dual-layer architecture guarantees that staff and clinicians have all the tools needed to perform their duties while maintaining strict patient confidentiality across separate clinic locations.
        </p>

        {/* Permission Flow Diagram */}
        <div className="bg-white p-6 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] mb-6 text-center">
          <p className="text-sm font-semibold text-gray-800 mb-3">Multi-Branch Authorization Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">User Account</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Assigned Role(s)</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Assigned Branch(es)</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-300 font-bold">Authorized Branch Data</span>
          </div>
          <p className="text-xs text-gray-500 font-body mt-3">
            Roles define functional capabilities; branch assignments restrict access to authorized clinic locations only.
          </p>
        </div>

        <div className="mt-6 w-full flex justify-center bg-white border border-sky-200 rounded-xl overflow-hidden p-2 shadow-sm">
          <img
            src={Diagram7_1}
            width={1536}
            height={1024}
            decoding="async"
            alt="Diagram 7.1: Multi-Branch RBAC Flow"
            className="w-full max-h-[500px] object-contain rounded-lg"
          />
        </div>
      </div>


      {/* SECTION 7.1 — Owner */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        7.1 Owner
      </h3>
      <p className="text-gray-700 font-body mb-6">The highest level of administrative access across the entire organization.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            <strong>Owners</strong> hold full system control and unrestricted access across all clinic branches. Because the Owner role operates at the organizational root, it is branch-independent and not restricted by branch assignment lists.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Manage organization subscription, plans, and billing</li>
            <li>Create, configure, and manage all clinic branches</li>
            <li>Configure global clinic settings, services, and inventory templates</li>
            <li>Create and manage all staff accounts, role assignments, and branch authorizations</li>
            <li>View all branch calendars, diaries, patient lists, and appointments</li>
            <li>Access consolidated and branch-specific financial records and performance reports</li>
            <li>Oversee all branch consent forms, public booking links, and QR codes</li>
          </ul>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_1}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.1: Owner Dashboard"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 7.2 — Branch Manager */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.2 Branch Manager
      </h3>
      <p className="text-gray-700 font-body mb-6">Administrative leaders overseeing operations for designated clinic branches.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            <strong>Branch Managers</strong> act as operational administrators for the specific branches assigned to their account. A Branch Manager can be assigned to oversee a single branch or multiple regional branches.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Manage practitioners, front desk, and finance staff assigned to their authorized branches</li>
            <li>Oversee patient records and manage branch appointment calendars</li>
            <li>View branch-specific performance metrics and financial reports</li>
            <li>Configure branch-specific consent agreements and legal disclosures</li>
            <li>Manage branch public booking links and QR codes</li>
          </ul>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.2: Branch Manager Dashboard"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        If a Branch Manager is assigned to a single branch, the branch selector is locked to that location. If assigned to multiple branches, a dropdown allows seamless switching between authorized branches. Branch Managers can never view or modify unassigned branches.
      </DocCallout>


      {/* SECTION 7.3 — Practitioner */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.3 Practitioner
      </h3>
      <p className="text-gray-700 font-body mb-6">Clinical professionals delivering patient care across authorized clinic locations.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-3">Multi-Branch Practitioner Architecture</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            In Malasakit PMS, <strong>a Practitioner can be assigned to multiple clinic branches using a single user account</strong>. Clinicians who divide their working hours between different branches do not need separate login accounts for each location.
          </p>

          {/* Practitioner Multi-Branch Visual Model */}
          <div className="p-5 rounded-xl border border-purple-200 bg-purple-50/60 mb-6">
            <h5 className="font-bold text-purple-900 mb-2">Multi-Branch Assignment Model</h5>
            <p className="text-sm text-purple-800 font-body mb-4">
              A single practitioner identity connects to multiple clinic locations with independent schedules, while preserving strict data isolation from unassigned branches:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs font-body">
              <div className="p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                <p className="font-bold text-purple-900">Branch A (Makati)</p>
                <p className="text-emerald-600 font-medium mt-1">✔ Assigned</p>
                <p className="text-gray-500 text-[11px] mt-1">Mon / Wed / Fri</p>
                <p className="text-gray-500 text-[11px]">9:00 AM – 5:00 PM</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                <p className="font-bold text-purple-900">Branch B (BGC)</p>
                <p className="text-emerald-600 font-medium mt-1">✔ Assigned</p>
                <p className="text-gray-500 text-[11px] mt-1">Tue / Thu</p>
                <p className="text-gray-500 text-[11px]">10:00 AM – 6:00 PM</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-300 opacity-75">
                <p className="font-bold text-gray-700">Branch C (Pasig)</p>
                <p className="text-red-500 font-medium mt-1">✘ Not Assigned</p>
                <p className="text-gray-400 text-[11px] mt-1">No Access</p>
                <p className="text-gray-400 text-[11px]">Strictly Blocked</p>
              </div>
            </div>
          </div>

          <h5 className="font-bold text-gray-900 mb-2">Key Practitioner Capabilities</h5>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Single Sign-On Identity:</strong> Log in once with a single email address to practice across all authorized clinic locations.</li>
            <li><strong>Branch-Specific Schedules:</strong> Set independent duty days, working hours, and lunch breaks for each assigned branch (e.g., Makati on Mondays/Wednesdays, BGC on Tuesdays/Thursdays).</li>
            <li><strong>Cross-Branch Conflict Prevention:</strong> Appointments booked at one branch automatically block the clinician's availability across all other branches during that time window, preventing double-booking.</li>
            <li><strong>Multi-Branch Patient Access:</strong> Review records, medical history, and treatment plans for patients registered in their authorized branches.</li>
            <li><strong>Clinical Notes & Treatment:</strong> Create, edit, and securely sign clinical notes for treated patients.</li>
            <li><strong>Calendar & Diary Access:</strong> Seamlessly toggle between authorized branches to view and manage appointments and daily schedules.</li>
          </ul>

          <h5 className="font-bold text-gray-900 mb-2">System Boundaries & Security Restrictions</h5>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Practitioner permissions are strictly scoped to clinical workflows within authorized branches. Practitioners cannot view unassigned branches, modify clinic billing subscriptions, configure system-wide settings, or access staff management. Restricted administrative modules in the sidebar appear disabled or hidden.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_4}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.4: Practitioner Calendar"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="warning">
        Practitioners cannot bypass branch boundaries by manually editing URLs or altering browser storage. Branch access is strictly enforced by the backend server; unauthorized branch requests return an immediate 403 Forbidden error.
      </DocCallout>


      {/* SECTION 7.4 — Front Desk */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.4 Front Desk (Staff)
      </h3>
      <p className="text-gray-700 font-body mb-6">Frontline operators managing patient intake and scheduling for designated branches.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            <strong>Front Desk</strong> users handle day-to-day scheduling, patient check-ins, and reception workflows within their assigned clinic branches.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Register new patients and update demographics for their assigned branches</li>
            <li>Book, reschedule, and cancel appointments on the branch calendar</li>
            <li>Review and process incoming online bookings submitted via public portals</li>
            <li>Manage patient check-ins and appointment attendance statuses</li>
          </ul>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_6}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.6: Front Desk Dashboard"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 7.5 — Finance */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.5 Finance
      </h3>
      <p className="text-gray-700 font-body mb-6">Financial specialists managing billing, payments, and invoices.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            <strong>Finance</strong> users are granted dedicated access to billing and revenue tools for their assigned clinic branches, without clinical record editing rights.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Generate, review, and issue invoices for appointments and services</li>
            <li>Record patient payments and track outstanding receivables</li>
            <li>Process bulk invoicing batches for corporate or insurance accounts</li>
            <li>Generate financial reports and reconciliation summaries for assigned branches</li>
          </ul>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_7}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.7: Finance Dashboard"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 7.6 — Multi-Role Accounts */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.6 Multi-Role Accounts & Permission Resolution
      </h3>
      <p className="text-gray-700 font-body mb-6">How permissions are calculated when a user holds more than one role.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            In many clinics, a staff member may fulfill multiple responsibilities—such as a clinical Practitioner who also serves as the Branch Manager. Malasakit PMS supports assigning multiple roles to a single account using an intuitive <strong>permission union policy</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-2">Union-Based Feature Access</h5>
              <p className="text-sm text-gray-700 font-body leading-relaxed">
                When a user holds multiple roles, the system evaluates the union of permissions across each role. The highest privilege level (<code className="text-xs bg-gray-200 px-1 py-0.5 rounded">none &lt; view &lt; edit</code>) always takes precedence. For example, a Branch Manager who is also a Practitioner can edit both clinical notes and staff assignments.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-2">Branch Boundaries Still Apply</h5>
              <p className="text-sm text-gray-700 font-body leading-relaxed">
                Assigning multiple roles broadens what tools a user can access, but <strong>does not grant unassigned branch access</strong>. All actions—clinical, administrative, or financial—remain strictly confined to the clinic branches assigned to that account.
              </p>
            </div>
          </div>
        </div>
      </div>

      <DocCallout type="important">
        Assigning multiple roles never overrides branch security. A user who is both a Branch Manager and Practitioner can only manage and treat patients in their authorized branches.
      </DocCallout>


      {/* SECTION 7.7 — Branch Scope Scenarios */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.7 Branch Scope Scenarios
      </h3>
      <p className="text-gray-700 font-body mb-6">Real-world examples illustrating how role and branch assignments dictate system visibility.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            When creating or updating staff accounts, administrators assign one or more roles along with specific branch authorizations. Here is how different account configurations translate to live system access:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Example 1: Branch Manager */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-2">Example 1: Branch Manager (Multiple Branches)</h5>
              <p className="text-xs text-gray-500 mb-1"><strong>Role:</strong> Branch Manager</p>
              <p className="text-xs text-gray-500 mb-3"><strong>Branches:</strong> Branch 1 & Branch 2</p>
              <ul className="text-sm space-y-1.5 font-body">
                <li className="text-emerald-700">✔ Full manager access in Branch 1</li>
                <li className="text-emerald-700">✔ Full manager access in Branch 2</li>
                <li className="text-emerald-700">✔ Seamless branch switching</li>
                <li className="text-red-500">✘ Completely blocked from Branch 3</li>
              </ul>
            </div>

            {/* Example 2: Multi-Branch Practitioner */}
            <div className="p-5 rounded-xl border border-purple-200 bg-purple-50/50">
              <h5 className="font-bold text-purple-900 mb-2 border-b border-purple-200 pb-2">Example 2: Multi-Branch Practitioner</h5>
              <p className="text-xs text-purple-700 mb-1"><strong>Role:</strong> Practitioner (Dr. Santos)</p>
              <p className="text-xs text-purple-700 mb-3"><strong>Branches:</strong> Branch 1 & Branch 2</p>
              <ul className="text-sm space-y-1.5 font-body">
                <li className="text-emerald-700">✔ Access patients & diary at Branch 1</li>
                <li className="text-emerald-700">✔ Access patients & diary at Branch 2</li>
                <li className="text-emerald-700">✔ Independent branch duty hours</li>
                <li className="text-emerald-700">✔ Cross-branch booking protection</li>
                <li className="text-red-500">✘ Blocked from Branch 3 (Unassigned)</li>
                <li className="text-red-500">✘ No access to global clinic setup</li>
              </ul>
            </div>

            {/* Example 3: Owner */}
            <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/50">
              <h5 className="font-bold text-blue-900 mb-2 border-b border-blue-200 pb-2">Example 3: System Owner</h5>
              <p className="text-xs text-blue-700 mb-1"><strong>Role:</strong> Owner</p>
              <p className="text-xs text-blue-700 mb-3"><strong>Branches:</strong> System-Wide (All Branches)</p>
              <ul className="text-sm space-y-1.5 font-body">
                <li className="text-blue-800">✔ Unrestricted access to all branches</li>
                <li className="text-blue-800">✔ Organization-wide reports & billing</li>
                <li className="text-blue-800">✔ Global staff & permission setup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Assign staff and practitioners only to the branches where they actively work. This keeps calendars, patient queues, and daily schedules clean while enforcing zero-trust data privacy between locations.
      </DocCallout>

      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how Malasakit combines role permissions and branch authorizations to provide secure, location-specific access throughout the practice. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>The system-wide administrative governance of the <strong>Owner</strong> role.</li>
        <li>The branch-level operational responsibilities of a <strong>Branch Manager</strong> across authorized locations.</li>
        <li>How <strong>Practitioners</strong> practice across multiple branches using a single user account with independent duty hours.</li>
        <li>How cross-branch conflict prevention keeps multi-branch practitioner schedules synchronized.</li>
        <li>The scheduling intake duties of <strong>Front Desk</strong> staff and billing workflows of <strong>Finance</strong> specialists.</li>
        <li>How the <strong>permission union policy</strong> combines privileges for users holding multiple roles without weakening branch security.</li>
        <li>How backend authorization strictly isolates patient records, calendars, and reports from unauthorized branches.</li>
      </ul>
    </>
  );
};

export default Chapter7;

import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot8_1 from '@/assets/manual/Chapter 8/Screenshot 8.1.webp';
import Screenshot8_2 from '@/assets/manual/Chapter 8/Screenshot 8.2.webp';
import Screenshot8_3 from '@/assets/manual/Chapter 8/Screenshot 8.3.webp';
import Screenshot8_4 from '@/assets/manual/Chapter 8/Screenshot 8.4.webp';

const Chapter8: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to navigate to the Staff Management module and create new staff members and practitioners with assigned roles and clinic branches.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Staff Creation Quick Guide</h3>
        <p className="text-gray-700 font-body mb-6">
          Follow this streamlined path to access user management and register a new team member into Malasakit PMS:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workflow Summary</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Setup Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Staff Card</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Staff Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">New Staff Member</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">Created Successfully</span>
          </div>
        </div>
      </div>


      {/* SECTION 8.1 — Accessing the Staff Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        8.1 Navigating to the Staff Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Access the centralized staff and practitioner directory from the Setup hub.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-4 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Go to the Setup Page:</strong> In the main navigation sidebar, click on <strong>Setup</strong>. This opens the central configuration hub.
            </li>
            <li>
              <strong>Locate the Staff / Users Card:</strong> Find the <strong>Users</strong> card (or Staff card) in the setup options grid.
            </li>
            <li>
              <strong>Click Staff:</strong> Select the <strong>Staff</strong> option under the card.
            </li>
            <li>
              <strong>Staff Page is Displayed:</strong> The system opens the <strong>Staff Management</strong> directory, listing all existing staff members, their roles, active branches, and status toggles.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot8_1}
              width={1031}
              height={976}
              decoding="async"
              alt="Screenshot 8.1: Setup Page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot8_2}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 8.2: Staff Management Page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 8.2 — Creating a New Staff Member */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        8.2 Creating a New Staff Member
      </h3>
      <p className="text-gray-700 font-body mb-6">Open the registration modal and configure employee information, roles, and branch access.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 1: Click "New Staff Member"</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            At the top right of the Staff page, click the blue <strong>New Staff Member</strong> button. The staff creation modal will open.
          </p>

          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 2: Enter Staff Details</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Complete the form fields across the three main sections:
          </p>

          {/* Form Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Card 1: Personal Information */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-2">1. Personal Information</h5>
              <ul className="text-sm space-y-2 text-gray-700 font-body">
                <li><strong>Title:</strong> Dr., Mr., Ms., Mrs., or Prof.</li>
                <li><strong>Full Name:</strong> First Name and Last Name (required), Middle Name, and Nickname.</li>
                <li><strong>Gender:</strong> Select Male, Female, or Other.</li>
                <li><strong>Date of Birth:</strong> Staff member's birth date for identification records.</li>
              </ul>
            </div>

            {/* Card 2: Professional Information */}
            <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
              <h5 className="font-bold text-sky-900 mb-2 border-b border-sky-200 pb-2">2. Professional & Roles</h5>
              <ul className="text-sm space-y-2 text-gray-700 font-body">
                <li><strong>Clinical Role:</strong> Select one or more roles (Administrator, Manager, Practitioner, Staff / Front Desk, Finance, Read-Only).</li>
                <li><strong>Discipline:</strong> Clinical discipline (e.g., Occupational Therapy, Physical Therapy, Psychology) for practitioners.</li>
                <li><strong>Practitioner Schedule:</strong> Configure duty days, working shift hours, and lunch breaks per branch.</li>
                <li><strong>Branch Assignment:</strong> Assign the user to their authorized clinic branch or branches.</li>
              </ul>
            </div>

            {/* Card 3: Contact Information */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-2">3. Contact Information</h5>
              <ul className="text-sm space-y-2 text-gray-700 font-body">
                <li><strong>Email Address:</strong> Required for login. An automated check detects if an existing clinician account can be linked to additional branches.</li>
                <li><strong>Phone Number:</strong> Official mobile number for system alerts and communication.</li>
                <li><strong>Address:</strong> Residential or clinic location address (optional).</li>
              </ul>
            </div>
          </div>

          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 3: Save and Submit</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Review the entered details and click the <strong>Create Staff Member</strong> button (or <strong>Assign to Selected Branch</strong> if linking an existing practitioner).
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot8_3}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 8.3: Create Staff Member Modal"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Always enter the staff member's official work email address. Malasakit uses this address to deliver temporary login credentials and automated password setup instructions.
      </DocCallout>


      {/* SECTION 8.3 — Successful Creation */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        8.3 Successful Account Creation
      </h3>
      <p className="text-gray-700 font-body mb-6">What happens after submitting the form.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Once saved, the system completes the following automated actions:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Instant Directory Update:</strong> The new staff member immediately appears in the <strong>Staff</strong> table with their assigned role badges and active branch tags.</li>
            <li><strong>Automated Welcome Email:</strong> An email containing system login credentials and a secure temporary password is dispatched to the user.</li>
            <li><strong>Mandatory First-Time Password Reset:</strong> Upon their first login, the user is required to set a new password before accessing clinic data.</li>
            <li><strong>Immediate RBAC Scoping:</strong> Role permissions and branch boundaries take effect instantly on both the user interface and backend API.</li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot8_4}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 8.4: Staff Table with New Member"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        If you ever need to update a staff member's roles, contact details, or assigned clinic branches, simply click their row in the Staff directory to open the edit modal.
      </DocCallout>

      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned the simplified process for registering team members in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Navigating from <strong>Setup</strong> &rarr; <strong>Staff Card</strong> &rarr; <strong>Staff Page</strong>.</li>
        <li>Launching the creation modal via the <strong>New Staff Member</strong> button.</li>
        <li>Entering <strong>Personal Information</strong>, <strong>Professional Roles & Schedules</strong>, and <strong>Contact Details</strong>.</li>
        <li>Successfully saving the account and verifying immediate directory and email dispatch.</li>
      </ul>
    </>
  );
};

export default Chapter8;

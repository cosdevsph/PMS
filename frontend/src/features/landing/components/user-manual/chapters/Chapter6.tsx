import React from 'react';
import { DocCallout } from '../DocCallout';

import Diagram6_1 from '@/assets/manual/Chapter 6/Diagram 6.1.webp';
import Screenshot6_1 from '@/assets/manual/Chapter 6/Screenshot 6.1.webp';
import Screenshot6_2 from '@/assets/manual/Chapter 6/Screenshot 6.2.webp';
import Screenshot6_3 from '@/assets/manual/Chapter 6/Screenshot 6.3.webp';
import Screenshot6_4 from '@/assets/manual/Chapter 6/Screenshot 6.4.webp';
import Screenshot6_5 from '@/assets/manual/Chapter 6/Screenshot 6.5.webp';
import Screenshot6_6 from '@/assets/manual/Chapter 6/Screenshot 6.6.webp';

const Chapter6: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to create, manage, and assign legal and operational consent forms for your clinic branches.
      </p>

      {/* IMPORTANT CONCEPT — Branch-Based Clinic Consent Forms */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-4">Understanding Branch-Based Consent</h3>
        
        <p className="text-gray-700 font-body mb-4">
          Because every clinic branch may offer different services, employ different practitioners, and face distinct legal or operational requirements, Malasakit introduces a <strong>Branch-Based Consent Architecture</strong>. 
        </p>

        <p className="text-gray-700 font-body mb-6">
          This means that every clinic branch owns and maintains its own independent consent agreement. Patients automatically receive and sign the exact consent form associated with the specific branch where their appointment is booked.
        </p>

        <div className="mt-6 w-full flex justify-center bg-white border border-sky-200 rounded-xl overflow-hidden p-2 shadow-sm">
          <img
            src={Diagram6_1}
            width={1536}
            height={1024}
            decoding="async"
            alt="Diagram 6.1: Branch → Consent Relationship"
            className="w-full max-h-[500px] object-contain rounded-lg"
          />
        </div>
      </div>


      {/* SECTION 6.1 — Creating/Editing a Clinic Consent Form */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        6.1 Creating and Editing a Consent Form
      </h3>
      <p className="text-gray-700 font-body mb-6">Learn how to write the legal or operational agreement for a branch.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 1: Open Clinic Consent Forms</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Navigate to the <strong>Clinic Consent Forms</strong> page. This page lists all branches that you have access to, along with their current consent form status, creator, and last modified date. To begin, click the <strong>Edit</strong> button next to a branch.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_1}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.1: Clinic Consent Forms page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 2: Enter Consent Content</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            In the Configure Clinic Consent Form modal, you will find two primary text fields to define your agreement:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Header Content (Optional):</strong> A brief introductory sentence or subtitle, such as "Acknowledgment of Policies and Procedures".</li>
            <li><strong>Body Content (Required):</strong> The main terms and conditions. This is where you outline privacy policies, operational rules, and medical liabilities.</li>
          </ul>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.2: Consent Editor"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 3: Live Preview & Save</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Before saving, click the <strong>Live Preview</strong> button. This opens a realistic mockup of exactly what the patient will see on their mobile device or computer before confirming their booking. Once satisfied, click <strong>Save Configuration</strong>.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_3}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.3: Live Preview Modal"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Use simple and understandable language so patients can easily understand the consent they are signing. Avoid overly complex legal jargon when possible.
      </DocCallout>


      {/* SECTION 6.2 — Branch Assignment & Access Control */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        6.2 Branch Assignment & Access Control
      </h3>
      <p className="text-gray-700 font-body mb-6">Understand how different roles configure consent forms.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            When configuring a consent form, the system enforces Role-Based Access Control (RBAC) to ensure staff can only modify forms for branches they are assigned to.
          </p>
          
          <h5 className="font-bold text-gray-900 mb-2 mt-6">For Clinic Owners & Branch Managers (Multiple Branches)</h5>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Staff with access to multiple branches will see an <strong>Assign To</strong> dropdown menu at the top of the modal. They can select any branch under their jurisdiction to configure its specific consent form.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_4}
              width={1338}
              height={316}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.4: Branch Manager (Multiple Branches) - Branch selection dropdown"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <h5 className="font-bold text-gray-900 mb-2 mt-8">For Branch Managers with a Single Branch</h5>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            If a manager is only assigned to a single location, the system automatically detects their branch. The dropdown menu is locked and read-only, preventing them from modifying agreements for other branches.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_5}
              width={1448}
              height={242}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.5: Branch Manager (Single Branch) - Locked auto-selected branch"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="important">
        Review all legal and operational wording with a professional before publishing updates to a consent form, as these act as binding agreements.
      </DocCallout>


      {/* SECTION 6.3 — Activating and Deactivating Consent Forms */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        6.3 Activating and Deactivating Consent Forms
      </h3>
      <p className="text-gray-700 font-body mb-6">Control when a consent form is presented to patients.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Require Consent Signature</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Inside the consent configuration modal, there is a toggle switch labeled <strong>Require Consent Signature</strong>.
          </p>
          
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Active (Enabled):</strong> New patients booking online at this branch will be required to read and electronically sign this document before their appointment is confirmed.</li>
            <li><strong>Inactive (Disabled):</strong> The consent form is turned off. New patients will bypass the consent step during registration. However, any previously signed historical consent records remain securely stored in the system.</li>
          </ul>
          
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_6}
              width={1378}
              height={470}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.6: Require Consent Signature Toggle"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="warning">
        Deactivating a consent form removes the legal safety net for new bookings at that branch. Ensure this is intentional before saving the configuration.
      </DocCallout>

      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to manage legal and operational agreements across different clinic locations. You should now know how to:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Understand the independent branch-based consent architecture.</li>
        <li>Locate and edit a specific branch's consent form.</li>
        <li>Write Header and Body content for the agreement.</li>
        <li>Use the Live Preview tool to verify patient experience.</li>
        <li>Activate or deactivate the signature requirement.</li>
      </ul>
    </>
  );
};

export default Chapter6;

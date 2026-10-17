import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot10_1 from '@/assets/manual/Chapter 10/Screenshot 10.1.webp';
import Screenshot10_2 from '@/assets/manual/Chapter 10/Screenshot 10.2.webp';

const Chapter10: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how clinic Owners and Managers access the Practitioner directory under the Setup module and review clinician profile details.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Practitioner Profiles Navigation Path</h3>
        <p className="text-gray-700 font-body mb-6">
          Accessing and reviewing practitioner profiles follows a straightforward path from your clinic administration hub:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workflow Sequence</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Navigate to Setup Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Users Card</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Click Staff</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">Practitioner List Page</span>
          </div>
        </div>
      </div>


      {/* SECTION 10.1 — Locating Practitioner Profiles */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        10.1 Locating Practitioner Profiles
      </h3>
      <p className="text-gray-700 font-body mb-6">Find and open the practitioner directory from the clinic setup hub.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-4 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Navigate to Setup Page:</strong> Click on <strong>Setup</strong> in the left-hand navigation sidebar to open your clinic's administrative control panel.
            </li>
            <li>
              <strong>Locate Staff under Users Card:</strong> On the Setup page, find the <strong>Users</strong> card and click on <strong>Staff</strong>.
            </li>
            <li>
              <strong>Practitioner List Page is Displayed:</strong> The system opens the comprehensive staff directory where all healthcare providers and clinic staff are listed.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot10_1}
              width={1032}
              height={976}
              decoding="async"
              alt="Screenshot 10.1: Setup Page showing Staff under Users Card"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Only clinic Owners and authorized Managers have permission to access the Setup module and manage practitioner accounts.
      </DocCallout>


      {/* SECTION 10.2 — Practitioner List Page with Practitioner Details */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        10.2 Practitioner List Page & Details Table
      </h3>
      <p className="text-gray-700 font-body mb-6">Review clinician information, clinical disciplines, assigned roles, and statuses in the directory table.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The Practitioner List displays each clinician as a dedicated row in the table, giving administrators a clear overview of the provider roster:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-1 text-sm">Practitioner Details Columns</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Name & Avatar:</strong> Clinician's full name and profile avatar.</li>
                <li><strong>Position:</strong> Job title or administrative designation.</li>
                <li><strong>Discipline:</strong> Primary clinical specialization (e.g., Physical Therapy, Dental, Occupational Therapy).</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-1 text-sm">Operational Columns</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Contact:</strong> Email address and direct mobile number.</li>
                <li><strong>Role(s):</strong> Assigned permission badges (e.g., Practitioner, Manager).</li>
                <li><strong>Status:</strong> Active or Inactive status toggle.</li>
                <li><strong>Actions:</strong> Quick controls to edit profile, configure duty hours, or archive.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot10_2}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 10.2: Practitioner List Page with Practitioner Details in the Table"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Clicking <strong>Edit</strong> on any practitioner row opens the staff modal where you can update their discipline, branch assignments, and duty hours schedule.
      </DocCallout>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to locate and review practitioner profiles in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Navigating to <strong>Setup → Users Card → Staff</strong>.</li>
        <li>Accessing the centralized <strong>Practitioner List Page</strong>.</li>
        <li>Reviewing key clinician details including clinical discipline, contact information, role badges, and active status.</li>
      </ul>
    </>
  );
};

export default Chapter10;

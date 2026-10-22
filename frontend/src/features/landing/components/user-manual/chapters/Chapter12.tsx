import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot12_1 from '@/assets/manual/Chapter 12/Screenshot 12.1.webp';
import Screenshot12_2 from '@/assets/manual/Chapter 12/Screenshot 12.2.webp';
import Screenshot12_3 from '@/assets/manual/Chapter 12/Screenshot 12.3.webp';

const Chapter12: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to locate the Client/Patient directory in Malasakit PMS, open a patient record, and navigate the full-screen Patient Profile layout.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Patient Records Navigation Guide</h3>
        <p className="text-gray-700 font-body mb-6">
          Accessing and reviewing a patient's complete medical and administrative record follows a straightforward path:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workflow Summary</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Main Sidebar</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Click Clients</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Client / Patient List</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Select Patient</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">Full-Screen Patient Profile</span>
          </div>
        </div>
      </div>


      {/* SECTION 12.1 — Locating the Client/Patient List Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        12.1 Locating the Client / Patient List Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Find and open the central patient directory from the main navigation.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-4 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Locate Clients in the Navigation Bar:</strong> Look at the main left-hand sidebar menu and find the <strong>Clients</strong> tab (users icon).
            </li>
            <li>
              <strong>Click Clients:</strong> Clicking this item takes you directly to the primary patient directory route (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-sky-700 font-mono">/clients</code>).
            </li>
            <li>
              <strong>Client / Patient List Page is Displayed:</strong> The system displays the comprehensive patient directory table, complete with live search, branch filtering, quick statistics, and pagination.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot12_1}
              width={1032}
              height={44}
              decoding="async"
              alt="Screenshot 12.1: Clients Navigation Bar"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot12_2}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 12.2: Client / Patient List Page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        In accordance with Role-Based Access Control (RBAC), the patient directory only displays records belonging to clinic branches that your account is actively authorized to access.
      </DocCallout>


      {/* SECTION 12.2 — How to View a Patient Profile */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        12.2 How to View a Patient Profile
      </h3>
      <p className="text-gray-700 font-body mb-6">Select a patient from the directory to open their detailed clinical and personal file.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Opening a patient's complete file requires just a few simple steps from the list page:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Search or Browse:</strong> Use the search bar at the top of the table to find a patient by first name, last name, phone number, or unique Client ID.
            </li>
            <li>
              <strong>Click on the Patient Record:</strong> Click directly on the patient's name or row in the table.
            </li>
            <li>
              <strong>Open Full-Screen Profile:</strong> The system automatically navigates to that patient's dedicated profile route (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-sky-700 font-mono">/clients/:id</code>), loading their entire clinical and operational dashboard.
            </li>
          </ol>
        </div>
      </div>

      <DocCallout type="tip">
        You can also quickly navigate to a patient's profile from any appointment card on the Calendar or Diary by clicking on the patient's name.
      </DocCallout>


      {/* SECTION 12.3 — Patient Profile Page Layout */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        12.3 Patient Profile Page Layout
      </h3>
      <p className="text-gray-700 font-body mb-6">Understand the full-screen layout, dedicated sidebar, and patient details workspace.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The Patient Profile page is designed as an immersive full-screen workspace with two primary functional zones:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Zone 1: Dedicated Sidebar */}
            <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
              <h5 className="font-bold text-sky-900 mb-2 border-b border-sky-200 pb-2">1. Dedicated Patient Sidebar (Left)</h5>
              <p className="text-xs text-sky-700 font-body mb-3">
                Provides persistent patient identification and fast navigation between clinical modules:
              </p>
              <ul className="text-sm space-y-1.5 text-gray-700 font-body">
                <li><strong>Patient Identity:</strong> Avatar, Full Name, and unique Client ID.</li>
                <li><strong>Profile:</strong> General demographics, contact numbers, and emergency contacts.</li>
                <li><strong>Appointments:</strong> Upcoming bookings, attendance history, and re-booking.</li>
                <li><strong>Cases:</strong> Ongoing clinical conditions, treatment plans, and diagnoses.</li>
                <li><strong>Documents:</strong> Uploaded medical files, consent forms, and referral letters.</li>
                <li><strong>Clinical Notes:</strong> SOAP notes, examination entries, and signed medical charts.</li>
                <li><strong>Invoices:</strong> Billing statements, payments, and outstanding balances.</li>
                <li><strong>Communication History:</strong> Record of SMS and email reminders sent.</li>
                <li><strong>Settings:</strong> Merging duplicates, archiving, or profile administration.</li>
              </ul>
            </div>

            {/* Zone 2: Patient Details Workspace */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-2">2. Patient Details Workspace (Main)</h5>
              <p className="text-xs text-gray-500 font-body mb-3">
                Displays the primary information and workspace corresponding to the active sidebar tab:
              </p>
              <ul className="text-sm space-y-1.5 text-gray-700 font-body">
                <li><strong>Personal Demographics:</strong> Date of birth, gender, marital status, and occupation.</li>
                <li><strong>Contact Information:</strong> Primary email address, mobile phone, and home address.</li>
                <li><strong>Emergency Contacts:</strong> Primary contact person, relationship, and emergency phone.</li>
                <li><strong>Clinic & Branch Association:</strong> Primary home branch and registration date.</li>
                <li><strong>Account Status:</strong> Active, archived, or merged status flags.</li>
                <li><strong>Action Buttons:</strong> Edit details, book new appointment, or create a clinical note.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot12_3}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 12.3: Full-Screen Patient Profile Page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Clicking any tab on the dedicated patient sidebar updates the main workspace without leaving the patient's record, ensuring a smooth and focused clinical workflow.
      </DocCallout>


      {/* SECTION 12.4 — Branch Visibility */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        12.4 Branch Visibility & Privacy
      </h3>
      <p className="text-gray-700 font-body mb-6">How patient privacy is enforced across multi-branch clinic organizations.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To strictly enforce patient confidentiality, access to patient records is governed by role permissions and assigned branches:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-1">Owner</h5>
              <p className="text-xs text-gray-600">Can view all patient records across all clinic branches system-wide.</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-1">Branch Manager & Front Desk</h5>
              <p className="text-xs text-gray-600">Can view patients registered at or attending their assigned clinic branches.</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
              <h5 className="font-bold text-gray-900 mb-1">Practitioner</h5>
              <p className="text-xs text-gray-600">Can view patients scheduled for appointments across their authorized branches.</p>
            </div>
          </div>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to access and navigate patient records in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Finding the <strong>Clients</strong> link in the main navigation sidebar.</li>
        <li>Browsing, filtering, and searching the <strong>Client / Patient List Page</strong>.</li>
        <li>Selecting a patient record to open their dedicated full-screen file.</li>
        <li>Navigating between clinical modules using the <strong>Patient Sidebar</strong> (Profile, Appointments, Cases, Documents, Clinical Notes, Invoices, Communications, Settings).</li>
        <li>Reviewing personal demographics and emergency contacts within the <strong>Patient Details</strong> workspace.</li>
        <li>Understanding how multi-branch role permissions keep patient records secure and compliant.</li>
      </ul>
    </>
  );
};

export default Chapter12;

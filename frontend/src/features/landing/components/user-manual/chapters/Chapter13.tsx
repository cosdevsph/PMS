import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot13_1 from '@/assets/manual/Chapter 13/Screenshot 13.1.png';
import Screenshot13_2 from '@/assets/manual/Chapter 13/Screenshot 13.2.png';
import Screenshot13_3 from '@/assets/manual/Chapter 13/Screenshot 13.3.png';
import Screenshot13_4 from '@/assets/manual/Chapter 13/Screenshot 13.4.png';
import Screenshot13_5 from '@/assets/manual/Chapter 13/Screenshot 13.5.png';

const Chapter13: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn the two simple methods to register new clients in Malasakit PMS: directly from the Client Directory or quickly while booking an appointment on the Calendar.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Patient Registration Pathways</h3>
        <p className="text-gray-700 font-body mb-6">
          Depending on your immediate task, you can add new clients through two convenient workflows:
        </p>

        <div className="space-y-4">
          {/* Flow 1 Summary */}
          <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.08)]">
            <p className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">1st Flow — From the Client Directory</p>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-700 font-mono">
              <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Client Page</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">Add Client Button</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-300 font-bold">Add Client Modal</span>
            </div>
          </div>

          {/* Flow 2 Summary */}
          <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.08)]">
            <p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2">2nd Flow — Directly from the Calendar</p>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-700 font-mono">
              <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Calendar</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Double-Click Blank Slot</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">Type Name</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">Create New Client</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-300 font-bold">Add New Client Modal</span>
            </div>
          </div>
        </div>
      </div>


      {/* SECTION 13.1 — 1st Flow: Client Page > Add Client button > Add Client Modal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        13.1 1st Flow: Registering via the Client Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Standard registration workflow through the centralized client directory.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Use this flow when onboarding patients in advance, performing front-desk intake, or registering a client without immediately scheduling an appointment:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Navigate to Client Page:</strong> Click <strong>Clients</strong> in the main navigation sidebar to open the full client directory.
            </li>
            <li>
              <strong>Click the Add Client Button:</strong> Locate and click the primary <strong>Add Client</strong> button at the top right of the table.
            </li>
            <li>
              <strong>Complete the Add Client Modal:</strong> The <strong>Add Client Modal</strong> appears. Enter the required personal demographics (First Name, Last Name, Date of Birth, Gender), contact details (Phone, Email, Address), and optional emergency contact.
            </li>
            <li>
              <strong>Save Client:</strong> Click <strong>Save Client</strong> to register the record. The new patient immediately appears in the directory table and is available across all clinic branches.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot13_1}
              alt="Screenshot 13.1: Client Page with Add Client button"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot13_2}
              alt="Screenshot 13.2: Add Client Modal"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Clients registered via the Client Page are instantly saved to the centralized database and can be accessed by authorized staff across all assigned clinic branches.
      </DocCallout>


      {/* SECTION 13.2 — 2nd Flow: Calendar > Double Click Blank Appointment > Type Name > Create New Client > Add New Client Modal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        13.2 2nd Flow: Fast Registration from the Calendar
      </h3>
      <p className="text-gray-700 font-body mb-6">Register a first-time client directly while booking an appointment slot.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            This quick-creation flow is designed for rapid phone bookings or walk-ins, allowing front desk staff to register a brand-new client without losing their calendar place:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Open Calendar:</strong> Navigate to the <strong>Calendar</strong> (or Diary) to view the daily or weekly schedule.
            </li>
            <li>
              <strong>Double-Click Blank Appointment:</strong> Double-click directly on any open, blank time slot under the desired practitioner and time.
            </li>
            <li>
              <strong>Type Name into Search:</strong> In the appointment booking pop-up, type the patient's name into the client search bar.
            </li>
            <li>
              <strong>Click Create New Client:</strong> If no existing patient matches the entered name, click the <strong>+ Add New Client</strong> button in the dropdown.
            </li>
            <li>
              <strong>Complete Add New Client Modal:</strong> The <strong>Add New Client Modal</strong> opens directly over the calendar. Enter the client's information and click <strong>Save</strong>. The newly created client is automatically linked to the pending appointment slot.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot13_3}
              alt="Screenshot 13.3: Calendar Blank Appointment"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot13_4}
              alt="Screenshot 13.4: Booking Pop-up Client Search"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot13_5}
              alt="Screenshot 13.5: Add New Client Modal from Calendar"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Registering clients directly from the calendar saves valuable time during phone inquiries because the appointment time and practitioner remain held while you record the patient's details.
      </DocCallout>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned the two standard methods to register clients in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li><strong>1st Flow (Client Page):</strong> Navigate to <strong>Clients</strong> → click <strong>Add Client</strong> → complete and save the <strong>Add Client Modal</strong>.</li>
        <li><strong>2nd Flow (Calendar):</strong> Open <strong>Calendar</strong> → double-click a blank appointment slot → type the patient's name → click <strong>+ Add New Client</strong> → complete the <strong>Add New Client Modal</strong> to register and book in one seamless step.</li>
      </ul>
    </>
  );
};

export default Chapter13;

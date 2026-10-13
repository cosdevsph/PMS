import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot16_1 from '@/assets/manual/Chapter 16/Screenshot 16.1.png';
import Screenshot16_2 from '@/assets/manual/Chapter 16/Screenshot 16.2.png';
import Screenshot16_3 from '@/assets/manual/Chapter 16/Screenshot 16.3.png';
import Screenshot16_4 from '@/assets/manual/Chapter 16/Screenshot 16.4.png';

const Chapter16: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn the simple and fast workflow to book a new patient consultation directly from the Diary and Calendar in Malasakit PMS.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Appointment Creation Workflow</h3>
        <p className="text-gray-700 font-body mb-6">
          Front desk staff and clinicians can book an appointment directly from the schedule in six simple steps:
        </p>

        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.08)]">
          <p className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">Step-by-Step Flow</p>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Diary & Calendar</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Double-Click Blank Slot</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">Enter Patient Name</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">Click Create Appointment</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-800 rounded border border-purple-200 font-medium">Enter Details</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-300 font-bold">Create Filled Appointment</span>
          </div>
        </div>
      </div>

      {/* SECTION 16.1 — Step-by-Step Guide */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        16.1 Booking an Appointment from the Diary & Calendar
      </h3>
      <p className="text-gray-700 font-body mb-6">
        Follow these steps to schedule a patient consultation quickly and accurately:
      </p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-4 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>From Diary and Calendar:</strong> Navigate to the <strong>Diary</strong> (or Calendar) from the main sidebar navigation. Select your clinic branch and preferred calendar view (Day View or Week View).
            </li>
            <li>
              <strong>Double-Click Blank Slot:</strong> Find an open, available time slot under the desired practitioner's column and double-click the blank slot where you want to book the consultation.
            </li>
            <li>
              <strong>Enter Patient First Name and Last Name:</strong> A quick patient pop-up modal opens. Type the patient's first and last name into the search field:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li>If the patient already exists, click their name from the suggestions list.</li>
                <li>If they are a new client, you can enter their name to register them seamlessly.</li>
              </ul>
            </li>
            <li>
              <strong>Click Create Appointment:</strong> With the patient selected, click the <strong>Create Appointment</strong> button in the pop-up to proceed to the full appointment creation window.
            </li>
            <li>
              <strong>Enter Details:</strong> In the <strong>Creating Appointment Modal</strong>, review and fill in the required consultation details:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li><strong>Practitioner & Branch:</strong> Confirm the assigned practitioner and clinic location.</li>
                <li><strong>Service:</strong> Select the consultation or treatment service (duration and pricing update automatically).</li>
                <li><strong>Date & Time:</strong> Verify the start time and end time for the session.</li>
                <li><strong>Assigned Case:</strong> Link the visit to an existing patient case or create a new case inline.</li>
                <li><strong>Notes & Chief Complaint:</strong> Enter optional reason for visit, symptoms, or internal clinic notes.</li>
              </ul>
            </li>
            <li>
              <strong>Create Filled Appointment:</strong> Click <strong>Create Appointment</strong> at the bottom of the modal to confirm the booking. The appointment is immediately saved and displayed as a colored, filled appointment block on the calendar grid.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot16_1}
              alt="Screenshot 16.1: Diary & Calendar — Double-clicking a blank slot on the schedule"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot16_2}
              alt="Screenshot 16.2: Quick Pop-up Modal — Entering patient first and last name"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot16_3}
              alt="Screenshot 16.3: Creating Appointment Modal — Entering consultation details"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot16_4}
              alt="Screenshot 16.4: Calendar with Filled Appointment — Confirmed appointment block displayed on the schedule"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Double-clicking directly on a practitioner's column automatically pre-selects that practitioner and the chosen time slot in the booking modal, saving you time!
      </DocCallout>

      <DocCallout type="info">
        Note: Online patient self-booking through the public portal will be covered in detail in a separate chapter.
      </DocCallout>

      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        Scheduling an appointment in Malasakit PMS takes just a few clicks:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li><strong>Open Calendar:</strong> Locate the desired practitioner and date on the Diary/Calendar.</li>
        <li><strong>Double-Click Slot:</strong> Double-click the blank time slot to start the booking.</li>
        <li><strong>Select Patient:</strong> Enter the patient's first and last name and click Create Appointment.</li>
        <li><strong>Fill Details:</strong> Specify service, timing, and case assignment.</li>
        <li><strong>Save & Confirm:</strong> Save the modal to render the filled appointment block on the schedule.</li>
      </ul>
    </>
  );
};

export default Chapter16;

import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot14_1 from '@/assets/manual/Chapter 14/Screenshot 14.1.png';
import Screenshot14_2 from '@/assets/manual/Chapter 14/Screenshot 14.2.png';
import Screenshot14_3 from '@/assets/manual/Chapter 14/Screenshot 14.3.png';
import Screenshot14_4 from '@/assets/manual/Chapter 14/Screenshot 14.4.png';
import Screenshot14_5 from '@/assets/manual/Chapter 14/Screenshot 14.5.png';
import Screenshot14_6 from '@/assets/manual/Chapter 14/Screenshot 14.6.png';

const Chapter14: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to manage Patient Cases through the Patient Profile and how to assign or create cases directly while scheduling an appointment in the Diary.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Patient Case Workflows</h3>
        <p className="text-gray-700 font-body mb-6">
          Patient Cases group related appointments, treatment plans, clinical notes, and invoices under a single condition. You can create cases from two locations:
        </p>

        <div className="space-y-4">
          {/* Pathway 1 Summary */}
          <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.08)]">
            <p className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">1. Patient Profile Location</p>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-700 font-mono">
              <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Patient Page</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Click View Profile</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">Select Cases Menu</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">Cases List</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-300 font-bold">Create New Case Modal</span>
            </div>
          </div>

          {/* Pathway 2 Summary */}
          <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.08)]">
            <p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2">2. Diary / Calendar Appointment Booking</p>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-700 font-mono">
              <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Diary Page</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">Select Patient</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">Creating Appointment Modal</span>
              <span className="text-sky-400 font-bold">→</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-300 font-bold">Assigned Case Field (Existing or New)</span>
            </div>
          </div>
        </div>
      </div>


      {/* SECTION 14.1 — Patient Case Location (From Patient Profile) */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        14.1 Patient Case Location (Patient Profile)
      </h3>
      <p className="text-gray-700 font-body mb-6">Manage patient cases and treatment plans directly within the patient file.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Follow this path to view existing cases or establish a new treatment case from the patient profile:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Open Patient Page:</strong> Navigate to the <strong>Clients</strong> (Patients) directory from the main sidebar navigation.
            </li>
            <li>
              <strong>Click View Profile in Action:</strong> Find the patient record and click <strong>View Profile</strong> under the <strong>Action</strong> column (or click the patient row).
            </li>
            <li>
              <strong>Select Cases Menu:</strong> On the dedicated left-hand patient sidebar, click on the <strong>Cases</strong> menu tab.
            </li>
            <li>
              <strong>Patient Cases List Displayed:</strong> The system displays all ongoing and past cases for this patient, detailing active statuses, session counts, primary practitioners, and payer types.
            </li>
            <li>
              <strong>Click Create Case Button:</strong> Click the <strong>New Case</strong> (or Create Case) button at the top of the cases view.
            </li>
            <li>
              <strong>Enter Details in Create New Case Modal:</strong> Complete the case details:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li><strong>Case Title:</strong> Name of the clinical condition or care plan (e.g., Post-Op ACL Rehabilitation, Chronic Cervical Pain).</li>
                <li><strong>Primary Practitioner:</strong> Assign the attending clinician responsible for the case.</li>
                <li><strong>Payer & Billing:</strong> Choose payment source (Self-Pay, HMO, Insurance, or Package).</li>
                <li><strong>Approved Sessions:</strong> Enter the allocated number of sessions or enable Unlimited.</li>
                <li><strong>Description & Referral:</strong> Add clinical notes, referral information, or diagnosis summary.</li>
              </ul>
            </li>
            <li>
              <strong>Save and Create Case:</strong> Click <strong>Create Case</strong> to save the treatment program.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot14_1}
              alt="Screenshot 14.1: Patient Page View Profile Action"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot14_2}
              alt="Screenshot 14.2: Patient Cases Menu & Cases List Display"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot14_3}
              alt="Screenshot 14.3: Create New Case Modal"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Cases allow clinics to organize multiple appointments over time under a unified clinical diagnosis, making it easy to track treatment progression and billing packages.
      </DocCallout>


      {/* SECTION 14.2 — Diary Page (Appointment Booking with Assigned Case) */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        14.2 Diary Page: Assigning or Creating Cases during Appointment Booking
      </h3>
      <p className="text-gray-700 font-body mb-6">Link appointments to an existing case or create a brand-new case on the fly.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Every appointment in Malasakit PMS connects to a case. You can select an ongoing case or create a new one directly while booking in the Diary:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Open Diary Page:</strong> Navigate to the <strong>Diary</strong> (or Calendar) to view practitioner appointment schedules.
            </li>
            <li>
              <strong>Create an Appointment:</strong> Double-click an available time slot or click the <strong>Create Appointment</strong> button.
            </li>
            <li>
              <strong>Select Patient:</strong> Search and select the patient, then click the <strong>Create Appointment</strong> button in the pop-up to proceed.
            </li>
            <li>
              <strong>Creating Appointment Modal is Displayed:</strong> The comprehensive appointment modal opens with clinician, branch, date, and service options.
            </li>
            <li>
              <strong>Configure the Assigned Case Field:</strong>
              <div className="mt-2 space-y-2">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Option A — Select Existing Case</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Select an ongoing case from the dropdown. The system automatically tracks this visit against the patient's approved sessions and package balance.
                  </p>
                </div>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                  <p className="text-xs font-bold text-sky-900 uppercase tracking-wide">Option B — Create New Case</p>
                  <p className="text-xs text-sky-700 mt-1">
                    Select <strong>+ Create New Case</strong> in the dropdown. An inline form opens immediately inside the modal where you enter the Case Title, Payer, Approved Sessions, and optional Package Cost without ever leaving your calendar.
                  </p>
                </div>
              </div>
            </li>
            <li>
              <strong>Confirm and Save Appointment:</strong> Complete service selection and click <strong>Create Appointment</strong>. The appointment is immediately booked and linked to the chosen or newly created case.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot14_4}
              alt="Screenshot 14.4: Diary Page Patient Selection"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot14_5}
              alt="Screenshot 14.5: Creating Appointment Modal Assigned Case Field"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot14_6}
              alt="Screenshot 14.6: Creating Appointment Modal Inline New Case"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Creating a case directly within the appointment booking modal saves time during fast front-desk intake, ensuring new consultations are always tied to a structured clinical plan.
      </DocCallout>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to navigate and manage Patient Cases in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li><strong>Patient Profile Location:</strong> Navigate to <strong>Clients</strong> → <strong>View Profile</strong> → <strong>Cases</strong> menu → click <strong>New Case</strong> to enter case details and create the treatment plan.</li>
        <li><strong>Diary Page Booking:</strong> Start an appointment in the <strong>Diary</strong> → select patient → open the <strong>Creating Appointment Modal</strong> → use the <strong>Assigned Case</strong> field to either link an existing case or create a new case inline.</li>
      </ul>
    </>
  );
};

export default Chapter14;

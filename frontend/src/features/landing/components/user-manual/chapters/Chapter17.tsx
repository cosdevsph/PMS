import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot17_1 from '@/assets/manual/Chapter 17/Screenshot 17.1.png';
import Screenshot17_2 from '@/assets/manual/Chapter 17/Screenshot 17.2.png';
import Screenshot17_3 from '@/assets/manual/Chapter 17/Screenshot 17.3.png';
import Screenshot17_4 from '@/assets/manual/Chapter 17/Screenshot 17.4.png';
import Screenshot17_5 from '@/assets/manual/Chapter 17/Screenshot 17.5.png';

const Chapter17: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to schedule recurring appointments from an existing booking in Malasakit PMS, validate clinician availability across future dates, and display the generated series on the Calendar.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Recurring Appointments Workflow</h3>
        <p className="text-gray-700 font-body mb-6">
          Generating a recurring appointment series follows five clear steps from the Diary:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">5-Step Sequence</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">17.1 Existing Appointment</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">17.2 Action Dropdown</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">17.3 Input Details</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">17.4 Check Availability & Save</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">17.5 Saved on Calendar</span>
          </div>
        </div>
      </div>


      {/* SECTION 17.1 — Diary Showing Existing Appointment */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        17.1 Diary Showing the Existing Appointment
      </h3>
      <p className="text-gray-700 font-body mb-6">Locate and select the base appointment from your practitioner's schedule.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            To create a recurring appointment series, start by finding the patient's current appointment on the schedule:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Open Diary / Calendar:</strong> Navigate to the <strong>Diary</strong> from the main navigation sidebar.
            </li>
            <li>
              <strong>Locate Existing Appointment:</strong> Find the patient's booked appointment card under the practitioner's column.
            </li>
            <li>
              <strong>Click Appointment Card:</strong> Click directly on the appointment card to open the detailed <strong>AppointmentView</strong> modal.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot17_1}
              alt="Screenshot 17.1: Diary showing the existing appointment"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 17.2 — AppointmentView Modal Showing Dropdown Recurring Appointment */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        17.2 AppointmentView Modal Showing Dropdown Recurring Appointment
      </h3>
      <p className="text-gray-700 font-body mb-6">Access the appointment options menu to initiate recurrence.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>AppointmentView</strong> modal displays the complete consultation details and includes an action dropdown menu for advanced scheduling:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Open Actions Menu:</strong> In the top header of the AppointmentView modal, click the actions dropdown button (three dots or options button).
            </li>
            <li>
              <strong>Select Add Recurring Appointments:</strong> In the menu list, click <strong>Add Recurring Appointments</strong> (repeat icon).
            </li>
            <li>
              <strong>Recurring Modal Opens:</strong> The system automatically launches the <strong>Add Recurring Appointments</strong> configuration modal with the patient, practitioner, and clinic branch pre-filled.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot17_2}
              alt="Screenshot 17.2: AppointmentView modal showing dropdown recurring appointment"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 17.3 — Inputting Details in Recurring Appointments Modal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        17.3 Inputting Details in Recurring Appointments Modal
      </h3>
      <p className="text-gray-700 font-body mb-6">Configure the frequency, repeating weekdays, repetition count, and appointment time.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Inside the recurring modal, specify the parameters for the future appointment series:
          </p>

          <ul className="list-disc pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Service & Duration:</strong> Pre-selected from the original appointment. You can adjust the consultation type or duration (minutes) if needed.
            </li>
            <li>
              <strong>Frequency:</strong> Select the recurrence pattern — <strong>Weekly</strong> (most common for therapy/rehab), <strong>Monthly</strong>, or <strong>Yearly</strong>.
            </li>
            <li>
              <strong>Repetitions:</strong> Enter the total number of sessions to generate (e.g., 4, 8, or 12 sessions).
            </li>
            <li>
              <strong>Days of the Week:</strong> Toggle the specific weekdays when the patient will attend (e.g., Monday and Thursday).
            </li>
            <li>
              <strong>Start Time:</strong> Set the appointment start time for each recurring visit.
            </li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot17_3}
              alt="Screenshot 17.3: Inputting details in Recurring appointments modal"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 17.4 — Checking of Schedule Availability and Save Recurring */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        17.4 Checking of Schedule Availability and Save Recurring
      </h3>
      <p className="text-gray-700 font-body mb-6">Validate future dates against practitioner duty hours and confirm the series.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Before generating future bookings, Malasakit performs an automated conflict and duty-hour availability check:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Check Availability:</strong> Click the <strong>Check Availability</strong> button. The system scans the practitioner's calendar and duty hours for every requested date in the series.
            </li>
            <li>
              <strong>Review Generated Slots Preview:</strong> The modal displays a clear list of all calculated session dates:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                <li><strong className="text-emerald-700">Available:</strong> Confirms the clinician is on duty and the time slot is free.</li>
                <li><strong className="text-amber-700">Booked / Unavailable:</strong> Alerts you if another appointment already occupies that time or if the clinician is off-duty.</li>
              </ul>
            </li>
            <li>
              <strong>Save Recurring Appointments:</strong> Once satisfied with the validated schedule preview, click <strong>Save Recurring Appointments</strong> to book the entire series.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot17_4}
              alt="Screenshot 17.4: Checking schedule availability and save recurring"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        The availability check guarantees that recurring appointments never create unintended double-bookings or fall outside approved clinician duty hours.
      </DocCallout>


      {/* SECTION 17.5 — Saved Recurring Display on Calendar */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        17.5 Saved Recurring Display on Calendar
      </h3>
      <p className="text-gray-700 font-body mb-6">View the newly generated appointment series directly on your calendar view.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Upon saving, the series is committed to the database and immediately reflected across the Diary:
          </p>

          <ul className="list-disc pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Immediate Calendar Sync:</strong> All confirmed recurring appointments populate their respective date and time slots on the Calendar across upcoming weeks.
            </li>
            <li>
              <strong>Connected Patient Case:</strong> Each occurrence automatically remains connected to the patient's assigned treatment case, tracking session numbers towards approved limits.
            </li>
            <li>
              <strong>Independent Flexibility:</strong> While created as a series, each individual booking can be rescheduled, edited, or marked as completed as the patient's care progresses.
            </li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot17_5}
              alt="Screenshot 17.5: Saved recurring display on calendar"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Switch to the <strong>Week</strong> or <strong>Month</strong> view on the Calendar toolbar to quickly inspect the full progression of your patient's recurring sessions.
      </DocCallout>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to easily schedule recurring appointments in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Opening an existing booking from the <strong>Diary</strong>.</li>
        <li>Selecting <strong>Add Recurring Appointments</strong> from the <strong>AppointmentView</strong> actions dropdown.</li>
        <li>Setting recurrence frequency, repetition counts, weekdays, and start times.</li>
        <li>Validating clinician availability and confirming the series with <strong>Save Recurring</strong>.</li>
        <li>Reviewing the automatically populated recurring appointments across the <strong>Calendar</strong>.</li>
      </ul>
    </>
  );
};

export default Chapter17;

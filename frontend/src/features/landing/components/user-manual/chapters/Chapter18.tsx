import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot18_1 from '@/assets/manual/Chapter 18/Screenshot 18.1.png';
import Screenshot18_2 from '@/assets/manual/Chapter 18/Screenshot 18.2.png';
import Screenshot18_3 from '@/assets/manual/Chapter 18/Screenshot 18.3.png';
import Screenshot18_4 from '@/assets/manual/Chapter 18/Screenshot 18.4.png';
import Screenshot18_5 from '@/assets/manual/Chapter 18/Screenshot 18.5.png';
import Screenshot18_6 from '@/assets/manual/Chapter 18/Screenshot 18.6.png';
import Screenshot18_7 from '@/assets/manual/Chapter 18/Screenshot 18.7.png';

const Chapter18: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to manage existing appointments in Malasakit PMS through the Appointment View modal, including viewing and editing details, handling cancellations, and updating attendance and booking statuses.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Appointment Management Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Managing an appointment throughout its lifecycle involves seven key actions within the Appointment View interface:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workflow Sequence</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">18.1 View Modal</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">18.2 Action Dropdown</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">18.3 View Details</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">18.4 Edit Details</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">18.5 Cancel Modal</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">18.6 Status Menu</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">18.7 Arrival Status</span>
          </div>
        </div>
      </div>


      {/* SECTION 18.1 — Appointment View Modal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        18.1 Appointment View Modal
      </h3>
      <p className="text-gray-700 font-body mb-6">Open and inspect the centralized appointment dashboard.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Clicking any booked appointment card on the <strong>Diary</strong> or <strong>Calendar</strong> opens the full <strong>Appointment View</strong> modal. This dashboard serves as the single source of truth for the consultation, displaying patient demographics, attendance flags, service details, and quick action shortcuts.
          </p>

          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Locate the appointment on the Diary schedule.</li>
            <li>Click the appointment card to open the <strong>Appointment View</strong> modal.</li>
            <li>Review the patient header, appointment timing, and clinical status badges.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot18_1}
              alt="Screenshot 18.1: Appointment View Modal"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 18.2 — Display the Appointment Dropdown in the Appointment View modal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.2 Display the Appointment Dropdown in the Appointment View Modal
      </h3>
      <p className="text-gray-700 font-body mb-6">Access additional appointment management actions from the header menu.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The action dropdown in the top header of the Appointment View modal provides fast access to operational commands:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Cancel Appointment:</strong> Open the cancellation flow with reason capture.</li>
            <li><strong>Add Recurring Appointments:</strong> Launch the multi-week recurring appointment generator.</li>
            <li><strong>Rebook Appointment:</strong> Duplicate appointment settings for a fast future follow-up.</li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot18_2}
              alt="Screenshot 18.2: Display the Appointment Dropdown in the Appointment View modal"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 18.3 — Appointment Details Display */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.3 Appointment Details Display
      </h3>
      <p className="text-gray-700 font-body mb-6">Review complete consultation information, timing, and clinical assignments.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Appointment Details</strong> panel provides a comprehensive breakdown of all administrative and clinical parameters:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Clinical & Service Information</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Practitioner:</strong> Assigned healthcare provider.</li>
                <li><strong>Service:</strong> Consultation or treatment type and duration.</li>
                <li><strong>Assigned Case:</strong> Connected medical case and session progress.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Schedule & Location</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Date & Time:</strong> Appointment date, start time, and end time.</li>
                <li><strong>Branch Location:</strong> Clinic branch where the consultation takes place.</li>
                <li><strong>Notes:</strong> Internal booking remarks and chief complaints.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot18_3}
              alt="Screenshot 18.3: Appointment Details Display"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 18.4 — Edit Appointment Details Display */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.4 Edit Appointment Details Display
      </h3>
      <p className="text-gray-700 font-body mb-6">Modify consultation parameters, services, or internal notes.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Authorized staff can update booking details whenever treatment plans or schedules change:
          </p>

          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Click the <strong>Edit</strong> button within the appointment details view.</li>
            <li>Modify the service type, practitioner, scheduled time, or case assignment.</li>
            <li>Add or update internal appointment notes and symptoms.</li>
            <li>Click <strong>Save Changes</strong> to instantly update the booking across the calendar.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot18_4}
              alt="Screenshot 18.4: Edit Appointment Details Display"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 18.5 — Cancel Appointment Modal, Entering Reason of cancellation, and Confirm */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.5 Cancel Appointment Modal, Entering Reason of Cancellation, and Confirm
      </h3>
      <p className="text-gray-700 font-body mb-6">Safely remove appointments from the schedule while maintaining a clear audit trail.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            When a patient cancels a visit, use the cancellation workflow to immediately reopen the slot for other bookings:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Select Cancel Appointment:</strong> Open the options dropdown in Appointment View and choose <strong>Cancel Appointment</strong>.
            </li>
            <li>
              <strong>Cancel Appointment Modal Appears:</strong> The system opens the confirmation modal to prevent accidental cancellations.
            </li>
            <li>
              <strong>Enter Cancellation Reason:</strong> Select or type the specific reason for cancellation (e.g., Patient Request, Sickness, Rescheduled, or Emergency).
            </li>
            <li>
              <strong>Confirm Cancellation:</strong> Click <strong>Confirm Cancellation</strong>. The appointment is removed from the active calendar grid, and the slot becomes instantly available for new bookings while preserving the historical record in the patient's file.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot18_5}
              alt="Screenshot 18.5: Cancel Appointment Modal, Entering Reason of cancellation, and Confirm"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Cancelled appointments are never permanently deleted from patient history; they remain visible in the patient's case timeline for clinical governance and attendance tracking.
      </DocCallout>


      {/* SECTION 18.6 — Appointment View Modal displaying the Status menu */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.6 Appointment View Modal Displaying the Status Menu
      </h3>
      <p className="text-gray-700 font-body mb-6">Update the primary booking lifecycle status.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The booking status dropdown controls the overall operational state of the appointment:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Pending:</strong> Tentative booking awaiting final patient confirmation.</li>
            <li><strong>Confirmed:</strong> Patient has confirmed attendance.</li>
            <li><strong>Completed:</strong> Treatment consultation has finished and is ready for billing.</li>
            <li><strong>Cancelled:</strong> Appointment was cancelled prior to the session.</li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot18_6}
              alt="Screenshot 18.6: Appointment View Modal displaying the Status menu"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 18.7 — Arrival Status Dropdown */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.7 Arrival Status Dropdown
      </h3>
      <p className="text-gray-700 font-body mb-6">Track real-time patient physical arrival and attendance at the clinic.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Front Desk staff update the <strong>Arrival Status</strong> as patients check in on the day of their appointment:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <h5 className="font-bold text-emerald-900 mb-1 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Arrived
              </h5>
              <p className="text-xs text-emerald-800 font-body">
                Indicates the patient is in the waiting room. Instantly alerts the treating practitioner on their Diary view that the patient is ready.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
              <h5 className="font-bold text-red-900 mb-1 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                DNA (Did Not Arrive)
              </h5>
              <p className="text-xs text-red-800 font-body">
                Marks a no-show. The appointment card highlights in red on the calendar and logs the missed visit in the patient's attendance record.
              </p>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot18_7}
              alt="Screenshot 18.7: Arrival Status Dropdown"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Keeping Arrival Status up-to-date ensures seamless communication between reception and practitioners without requiring intercom calls or physical walk-ins.
      </DocCallout>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to manage existing appointments in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Opening the centralized <strong>Appointment View Modal</strong> from the Diary.</li>
        <li>Accessing options through the <strong>Appointment Dropdown</strong> menu.</li>
        <li>Reviewing and editing consultation parameters via <strong>Appointment Details</strong>.</li>
        <li>Cancelling bookings cleanly with required reasons using the <strong>Cancel Appointment Modal</strong>.</li>
        <li>Updating the overall <strong>Booking Status</strong> (Pending, Confirmed, Completed).</li>
        <li>Tracking real-time patient reception and no-shows using the <strong>Arrival Status Dropdown</strong> (Arrived, DNA).</li>
      </ul>
    </>
  );
};

export default Chapter18;

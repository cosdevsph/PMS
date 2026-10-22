import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot11_1 from '@/assets/manual/Chapter 11/Screenshot 11.1.webp';
import Screenshot11_2 from '@/assets/manual/Chapter 11/Screenshot 11.2.webp';
import Screenshot11_3 from '@/assets/manual/Chapter 11/Screenshot 11.3.webp';
import Screenshot11_4 from '@/assets/manual/Chapter 11/Screenshot 11.4.webp';
import Screenshot11_5 from '@/assets/manual/Chapter 11/Screenshot 11.5.webp';
import Screenshot11_6 from '@/assets/manual/Chapter 11/Screenshot 11.6.webp';

const Chapter11: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how clinic Owners and Branch Managers configure practitioner duty hours, view schedules across different calendar layouts, and monitor clinic occupancy calculations.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Duty Hours & Calendar Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Configuring duty hours ensures appointment calendars accurately reflect when practitioners are available and powers automated occupancy reporting:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workflow Sequence</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">Setup → Staff</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Staff Modal</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Configure Duty Hours</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Diary / Calendar Views</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">Live Occupancy Stats</span>
          </div>
        </div>
      </div>


      {/* SECTION 11.1 — Setting Duty Hours in CreateStaffAccountModal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        11.1 Configuring Practitioner Duty Hours in Staff Modal
      </h3>
      <p className="text-gray-700 font-body mb-6">Set working days, daily shifts, and break intervals for clinic practitioners.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Clinic Owners and Branch Managers configure practitioner working schedules directly inside the <strong>Create / Edit Staff Account Modal</strong> (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-sky-700 font-mono">CreateStaffAccountModal</code>):
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body leading-relaxed mb-6">
            <li>
              <strong>Open Staff Member Form:</strong> Navigate to <strong>Setup → Staff</strong>, then click <strong>New Staff Member</strong> or click <strong>Edit</strong> on an existing practitioner record.
            </li>
            <li>
              <strong>Assign Role:</strong> Ensure the staff member has the <strong>Practitioner</strong> role enabled to display the duty hours configuration section.
            </li>
            <li>
              <strong>Select Working Days:</strong> Toggle the practitioner's active duty days (e.g., Monday through Friday). Unselected days will be treated as non-working days.
            </li>
            <li>
              <strong>Configure Shift Blocks & Branches:</strong> Set the shift <strong>Start Time</strong> and <strong>End Time</strong> for each active day, and assign the specific clinic branch for that shift. Additional working periods can be added per day if needed.
            </li>
            <li>
              <strong>Set Lunch Break:</strong> Specify the <strong>Lunch Start</strong> and <strong>Lunch End</strong> times. The system automatically reserves this time window so appointments are not booked during lunch.
            </li>
            <li>
              <strong>Save Schedule:</strong> Click <strong>Save Changes</strong> or <strong>Create Staff</strong> to apply the duty hours across the clinic calendars.
            </li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot11_1}
              width={1032}
              height={976}
              decoding="async"
              alt="Screenshot 11.1: Setting Duty Hours in CreateStaffAccountModal"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Only clinic Owners and Branch Managers have access to configure or modify practitioner duty schedules.
      </DocCallout>


      {/* SECTION 11.2 — Diary Week View: Duty Hours vs Non-Duty Hours */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        11.2 Diary Week View: Duty Hours vs. Non-Duty Hours
      </h3>
      <p className="text-gray-700 font-body mb-6">Understand how practitioner availability and off-duty intervals appear on the weekly schedule.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The Diary Week View visually translates the configured duty hours into clear scheduling intervals:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <h5 className="font-bold text-emerald-900 mb-2 border-b border-emerald-200 pb-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Duty Hours (Available)
              </h5>
              <p className="text-xs text-emerald-800 font-body mb-3">
                Open bookable intervals where the practitioner is active on duty:
              </p>
              <ul className="text-sm space-y-1.5 text-gray-700 font-body">
                <li>Displayed with a clear, open background.</li>
                <li>Ready for one-click appointment slotting.</li>
                <li>Counts directly toward total available minutes for daily occupancy.</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl border border-purple-200 bg-purple-50/50">
              <h5 className="font-bold text-purple-900 mb-2 border-b border-purple-200 pb-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Non-Duty Hours & Days (Unavailable)
              </h5>
              <p className="text-xs text-purple-800 font-body mb-3">
                Off-duty times, unscheduled days, and configured break intervals:
              </p>
              <ul className="text-sm space-y-1.5 text-gray-700 font-body">
                <li>Clearly distinguished with a shaded / tinted background.</li>
                <li>Displays a "Non-duty" indicator to prevent accidental bookings.</li>
                <li>Staff can still apply administrative overrides if an urgent appointment is required.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot11_2}
              width={1032}
              height={976}
              decoding="async"
              loading="lazy"
              alt="Screenshot 11.2: Diary Week View Showing Duty Hours and Non-Duty Hours"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Shaded non-duty slots help Front Desk staff instantly identify when a clinician is off-duty without needing to memorize individual staff timetables.
      </DocCallout>


      {/* SECTION 11.3 — Different Calendar Views */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        11.3 Different Calendar Views
      </h3>
      <p className="text-gray-700 font-body mb-6">Switch between Day, Week, and Month perspectives to fit your daily workflow.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The calendar toolbar provides three distinct view modes designed for different operational needs:
          </p>

          <div className="space-y-8">
            {/* Day View */}
            <div className="border-t border-gray-100 pt-6 first:border-0 first:pt-0">
              <h4 className="text-lg font-bold text-gray-900 mb-2">1. Day View</h4>
              <p className="text-gray-700 font-body mb-4">
                Provides an hour-by-hour operational breakdown of a single day across practitioners. Best for Front Desk staff managing patient check-ins, walk-ins, and daily clinical flow.
              </p>
              <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
                <img
                  src={Screenshot11_3}
                  width={1032}
                  height={976}
                  decoding="async"
                  loading="lazy"
                  alt="Screenshot 11.3: Calendar Day View"
                  className="w-full max-h-[500px] object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Week View */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">2. Week View</h4>
              <p className="text-gray-700 font-body mb-4">
                Displays a 7-day schedule breakdown for a practitioner or branch. Ideal for reviewing weekly shift coverage, spotting open appointment slots, and balancing booking distribution.
              </p>
              <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
                <img
                  src={Screenshot11_4}
                  width={1032}
                  height={976}
                  decoding="async"
                  loading="lazy"
                  alt="Screenshot 11.4: Calendar Week View"
                  className="w-full max-h-[500px] object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Month View */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">3. Month View</h4>
              <p className="text-gray-700 font-body mb-4">
                Offers a high-level monthly calendar grid showing appointment volumes, holidays, and overall clinic booking density at a glance.
              </p>
              <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
                <img
                  src={Screenshot11_5}
                  width={1032}
                  height={976}
                  decoding="async"
                  loading="lazy"
                  alt="Screenshot 11.5: Calendar Month View"
                  className="w-full max-h-[500px] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* SECTION 11.4 — Occupancy Calculations */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        11.4 Occupancy Calculations
      </h3>
      <p className="text-gray-700 font-body mb-6">Track practitioner utilization and clinic volume in real time.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Malasakit PMS automatically computes daily practitioner utilization using the configured duty hours. The calendar header displays real-time performance statistics:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>
              <strong>Occupancy %:</strong> Calculated as <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-sky-700 font-mono">(Booked Appointment Minutes / Total Duty Minutes) × 100%</code>. Shows how much of a practitioner's scheduled working time is filled with appointments.
            </li>
            <li>
              <strong>Number of Clients:</strong> The total count of unique patients scheduled for consultations during the selected period.
            </li>
            <li>
              <strong>New Clients:</strong> The number of first-time visitors attending their initial clinic appointment.
            </li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot11_6}
              width={851}
              height={109}
              decoding="async"
              loading="lazy"
              alt="Screenshot 11.6: Occupancy Calculations and Statistics"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Review occupancy percentages regularly to identify peak utilization hours, prevent practitioner burnout, and adjust duty schedules to meet patient demand.
      </DocCallout>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how practitioner duty hours and calendar views operate in Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Configuring working days, shift hours, branch locations, and lunch breaks in the <strong>CreateStaffAccountModal</strong>.</li>
        <li>Distinguishing active duty hours from shaded non-duty periods in the <strong>Diary Week View</strong>.</li>
        <li>Switching between <strong>Day View</strong>, <strong>Week View</strong>, and <strong>Month View</strong> based on operational tasks.</li>
        <li>Monitoring practitioner utilization and clinic volume via real-time <strong>Occupancy Calculations</strong>.</li>
      </ul>
    </>
  );
};

export default Chapter11;

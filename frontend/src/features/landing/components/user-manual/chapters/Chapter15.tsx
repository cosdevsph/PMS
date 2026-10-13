import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot15_1 from '@/assets/manual/Chapter 15/Screenshot 15.1.png';
import Screenshot15_2 from '@/assets/manual/Chapter 15/Screenshot 15.2.png';
import Screenshot15_3 from '@/assets/manual/Chapter 15/Screenshot 15.3.png';
import Screenshot15_4 from '@/assets/manual/Chapter 15/Screenshot 15.4.png';
import Screenshot15_5 from '@/assets/manual/Chapter 15/Screenshot 15.5.png';
import Screenshot15_6 from '@/assets/manual/Chapter 15/Screenshot 15.6.png';

const Chapter15: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to navigate the operational center of Malasakit PMS to monitor appointments, explore different calendar perspectives, and track clinic occupancy.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Calendar & Diary Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Malasakit PMS provides multiple dedicated views to help clinic staff easily plan and coordinate patient care:
        </p>

        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.08)]">
          <p className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">Core Calendar & Diary Perspectives</p>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 font-medium">1. Full Calendar</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">2. Day View</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">3. Week View</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">4. Month View</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-800 rounded border border-purple-200 font-medium">5. Whole Diary Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-300 font-bold">6. Occupancy Statistics</span>
          </div>
        </div>
      </div>


      {/* SECTION 15.1 — Full Calendar Photo */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        15.1 Full Calendar Interface
      </h3>
      <p className="text-gray-700 font-body mb-6">A complete overview of the centralized scheduling workspace.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Calendar</strong> serves as the central operational hub for Malasakit PMS. From here, clinic owners, practitioners, and front desk personnel can oversee schedules across branches, track arrivals, book appointments, and review daily provider availability at a glance.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot15_1}
              alt="Screenshot 15.1: Full Calendar Photo"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 15.2 — Day View */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        15.2 Day View
      </h3>
      <p className="text-gray-700 font-body mb-6">Detailed single-day schedule broken down by practitioner columns.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            <strong>Day View</strong> organizes the daily schedule into 15-minute intervals across individual practitioner columns. This allows front desk staff to monitor simultaneous sessions, view active duty hours, identify open slots, and manage incoming patient traffic smoothly throughout the day.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot15_2}
              alt="Screenshot 15.2: Day View"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        In Day View, active working hours are clearly shaded according to each practitioner's configured Duty Hours, making it easy to spot bookable periods.
      </DocCallout>


      {/* SECTION 15.3 — Week View */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        15.3 Week View
      </h3>
      <p className="text-gray-700 font-body mb-6">Seven-day schedule to balance weekly workloads and spot booking gaps.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            <strong>Week View</strong> expands the schedule across seven consecutive days. It provides clinicians and managers with a comprehensive short-term outlook to check upcoming patient volume, prevent provider burnout, and balance appointment bookings across all operating days.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot15_3}
              alt="Screenshot 15.3: Week View"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Use Week View to spot open scheduling gaps before accepting new bookings, ensuring balanced provider occupancy throughout the week.
      </DocCallout>


      {/* SECTION 15.4 — Month View */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        15.4 Month View
      </h3>
      <p className="text-gray-700 font-body mb-6">High-level density calendar for long-term capacity planning.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            <strong>Month View</strong> displays a traditional calendar grid that visually represents appointment density for every day of the month. Clicking on any individual date immediately zooms into that day's detailed Day View for faster drill-down navigation.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot15_4}
              alt="Screenshot 15.4: Month View"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 15.5 — Whole Diary Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        15.5 Whole Diary Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Chronological agenda view for sequential patient tracking.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Diary Page</strong> arranges the day's appointments in a clean, chronological list. This format allows practitioners and receptionists to sequentially review patient consultations, check arrival statuses, and review treatment services without relying on grid alignments.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot15_5}
              alt="Screenshot 15.5: Whole Diary Page"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 15.6 — Occupancy Statistics */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        15.6 Occupancy Statistics
      </h3>
      <p className="text-gray-700 font-body mb-6">Real-time practitioner utilization and patient visit analytics.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Located directly at the top of the schedule, the <strong>Occupancy Statistics</strong> bar provides key operational metrics:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/50">
              <h5 className="font-bold text-sky-900 text-sm mb-1">Occupancy %</h5>
              <p className="text-xs text-sky-800 font-body">
                Calculated strictly by comparing booked appointment duration against configured practitioner Duty Hours.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
              <h5 className="font-bold text-emerald-900 text-sm mb-1">Total Clients</h5>
              <p className="text-xs text-emerald-800 font-body">
                The total number of patients with scheduled appointments on the active date.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
              <h5 className="font-bold text-purple-900 text-sm mb-1">New Clients</h5>
              <p className="text-xs text-purple-800 font-body">
                The number of first-time patients visiting your clinic today.
              </p>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot15_6}
              alt="Screenshot 15.6: Occupancy Statistics"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="important">
        Occupancy % is based on working duty hours rather than raw appointment count, providing an accurate measure of clinic resource utilization.
      </DocCallout>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you explored the primary calendar and diary features of Malasakit PMS:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li><strong>Full Calendar Photo:</strong> Central overview workspace for managing clinic appointments across branches.</li>
        <li><strong>Day View:</strong> Single-day 15-minute grid divided by practitioner columns for active daily operations.</li>
        <li><strong>Week View:</strong> Seven-day schedule overview to monitor capacity and balance weekly workloads.</li>
        <li><strong>Month View:</strong> Monthly calendar grid to inspect overall density and forecast future booking capacity.</li>
        <li><strong>Whole Diary Page:</strong> Chronological agenda list for sequential consultation tracking.</li>
        <li><strong>Occupancy Statistics:</strong> Real-time utilization metrics calculated from practitioner duty hours.</li>
      </ul>
    </>
  );
};

export default Chapter15;

import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot32_1 from '@/assets/manual/Chapter 32/Screenshot 32.1.webp';
import Screenshot32_2 from '@/assets/manual/Chapter 32/Screenshot 32.2.webp';
import Screenshot32_3 from '@/assets/manual/Chapter 32/Screenshot 32.3.webp';
import Screenshot32_4 from '@/assets/manual/Chapter 32/Screenshot 32.4.webp';

const Chapter32: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how branches appear in Malasakit's reports: which reports combine every branch, where you can filter to a single branch, and how to tell which branch a record belongs to.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Multi-Branch Reporting Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          If your clinic has more than one branch, Malasakit reports bring them together by default and the Occupancy report lets you narrow down to one:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Reporting Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">32.1 Reports Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">32.2 All Branches</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">32.3 One Branch</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">32.4 Branch Column</span>
          </div>
        </div>
      </div>


      {/* SECTION 32.1 — The Reports Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        32.1 The Reports Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Four groups of reports.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Reports</strong> in the top navigation bar. The reports are grouped in four cards:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Administration and Clinic</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Administration:</strong> Uninvoiced Bookings, Cancellations</li>
                <li><strong>Clinic:</strong> Clients &amp; Cases, Clinical Notes, Providers &amp; Practice</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Financial and Performance</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Financial:</strong> Inventory Items, Appointment Costs, Banking, Ageing Debts, Revenue, Categories, Account Credits and Export All (PDF)</li>
                <li><strong>Performance:</strong> Occupancy, Business Performance, Outcome Measures</li>
              </ul>
            </div>
          </div>

          <DocCallout type="info" title="Branches are combined by default">
            Most reports include the data of every branch in your clinic. Two exceptions: <strong>Inventory Items</strong> covers only your own branch, and a practitioner opening <strong>Providers &amp; Practice</strong> sees their own figures.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot32_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 32.1: Reports page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 32.2 — Occupancy Across All Branches */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        32.2 Occupancy Across All Branches
      </h3>
      <p className="text-gray-700 font-body mb-6">Compare branches side by side.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Occupancy</strong> in the <strong>Performance</strong> card. Choose a <strong>Date Range</strong> (such as <em>This Week</em>), leave <strong>Branch</strong> on <strong>All Branches</strong> and click <strong>Run Report</strong>.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>The tiles show <strong>Occupancy %</strong>, <strong>Utilization %</strong>, hours <strong>Available</strong>, <strong>Booked</strong>, <strong>Completed</strong> and <strong>Cancel/DNA</strong> time.</li>
            <li>The table lists each practitioner with their <strong>Branch</strong>, so you can see where each person works.</li>
            <li><strong>Occupancy by Branch</strong> compares the branches, and <strong>Daily Occupancy Trend</strong> shows each day. Click <strong>Print</strong> for a printable copy.</li>
          </ul>

          <DocCallout type="tip">
            A practitioner is counted under their home branch, the clinic they belong to in Malasakit.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot32_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 32.2: Occupancy report for all branches"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 32.3 — Filtering to One Branch */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        32.3 Filtering to One Branch
      </h3>
      <p className="text-gray-700 font-body mb-6">Focus on a single location.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Open the <strong>Branch</strong> drop-down, choose a branch and click <strong>Run Report</strong>. The tiles, table and charts now show that branch only. You can also narrow the report to one <strong>Practitioner</strong>.
          </p>

          <DocCallout type="important" title="Only Occupancy has a branch filter">
            <strong>Occupancy</strong> is the only report with a <strong>Branch</strong> selector today. The other reports show all branches together; use the filters described in 32.4 to find a branch's records.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot32_3}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 32.3: Occupancy report filtered to one branch"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 32.4 — Finding a Branch in Other Reports */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        32.4 Finding a Branch in Other Reports
      </h3>
      <p className="text-gray-700 font-body mb-6">The Clinic Branch column.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Cancellations</strong>, <strong>Uninvoiced Bookings</strong>, <strong>Clients &amp; Cases</strong> and <strong>Clinical Notes</strong> reports show a <strong>Clinic Branch</strong> column. Set the date range, click <strong>Run Report</strong>, and read the column to see which branch each record belongs to.
          </p>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Dashboard</strong> shows today's figures for all branches together and has no branch selector.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot32_4}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 32.4: Cancellations report with the Clinic Branch column"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how branches appear in Malasakit reports. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>That most reports <strong>combine all branches</strong> of your clinic.</li>
        <li>How to run <strong>Occupancy</strong> for all branches and compare them in <strong>Occupancy by Branch</strong>.</li>
        <li>How to <strong>filter Occupancy to one branch</strong> or practitioner.</li>
        <li>How to read the <strong>Clinic Branch</strong> column in other reports.</li>
      </ul>
    </>
  );
};

export default Chapter32;

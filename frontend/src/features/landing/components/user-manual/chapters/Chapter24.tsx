import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot24_1 from '@/assets/manual/Chapter 24/Screenshot 24.1.png';
import Screenshot24_2 from '@/assets/manual/Chapter 24/Screenshot 24.2.png';
import Screenshot24_3 from '@/assets/manual/Chapter 24/Screenshot 24.3.png';
import Screenshot24_4 from '@/assets/manual/Chapter 24/Screenshot 24.4.png';
import Screenshot24_5 from '@/assets/manual/Chapter 24/Screenshot 24.5.png';
import Screenshot24_6 from '@/assets/manual/Chapter 24/Screenshot 24.6.png';

const Chapter24: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to navigate the centralized Reports page, run targeted operational and financial reports by date ranges, and print or export standardized PDF documents.
      </p>

      {/* QUICK OVERVIEW & PRINTING CALLOUT */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Centralized Reports & PDF Export</h3>
        <p className="text-gray-700 font-body mb-6">
          Malasakit categorizes clinic reporting into four distinct modules: <strong>Administration</strong>, <strong>Clinic</strong>, <strong>Financial</strong>, and <strong>Performance</strong>.
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Universal Reporting Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">1. Select Report Category</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">2. Choose Date From & To</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-medium">3. Click "Run Report"</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">4. Print / Download PDF</span>
          </div>
        </div>

        <DocCallout type="tip" title="Universal Printing & PDF Export">
          <strong>ALL REPORTS can be printed or downloaded as a PDF.</strong> Once you run any report, click the <strong>Print Report</strong> button with the printer icon in the top-right corner to open your browser print preview or save as a clean PDF file.
        </DocCallout>
      </div>


      {/* SECTION 24.1 — Navigate to Reports page via top bar */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        24.1 Navigate to Reports Page via the Top Bar
      </h3>
      <p className="text-gray-700 font-body mb-6">Access all operational, clinical, and financial report categories in one place.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click on <strong>Reports</strong> in the main top navigation bar. The dashboard organizes clinic analytics into four clear, color-coded categories:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h5 className="font-bold text-amber-950 text-sm">Administration</h5>
              </div>
              <ul className="text-xs space-y-1 text-gray-700 font-body">
                <li>• Uninvoiced Bookings</li>
                <li>• Cancellations</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <h5 className="font-bold text-sky-950 text-sm">Clinic</h5>
              </div>
              <ul className="text-xs space-y-1 text-gray-700 font-body">
                <li>• Clients & Cases</li>
                <li>• Clinical Notes</li>
                <li>• Providers & Practice</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h5 className="font-bold text-emerald-950 text-sm">Financial</h5>
              </div>
              <ul className="text-xs space-y-1 text-gray-700 font-body">
                <li>• Inventory Items & Costs</li>
                <li>• Banking & Revenue</li>
                <li>• Ageing Debts & Credits</li>
                <li>• Export All (PDF)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h5 className="font-bold text-purple-950 text-sm">Performance</h5>
              </div>
              <ul className="text-xs space-y-1 text-gray-700 font-body">
                <li>• Occupancy %</li>
                <li>• Business Performance</li>
                <li>• Outcome Measures</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot24_1}
              alt="Screenshot 24.1: Navigate to Reports page via top bar"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 24.2 — Uninvoiced Bookings Report */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        24.2 Uninvoiced Bookings Report Example
      </h3>
      <p className="text-gray-700 font-body mb-6">Select Date From and Date To &gt; Run Report &gt; Print or download PDF.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Under <strong>Administration</strong>, select <strong>Uninvoiced Bookings</strong>:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Select the <strong>Date From</strong> and <strong>Date To</strong> range.</li>
            <li>Optionally filter by <strong>Appt. Status</strong> (e.g. <em>All Status</em>, <em>Completed</em>, <em>Scheduled</em>).</li>
            <li>Click the orange <strong>Run Report</strong> button.</li>
            <li>The system lists all appointments with no invoice or only pending drafts, displaying the patient name, date, time slot, clinic branch, assigned practitioner, service, and status.</li>
            <li>To print or download as PDF, click <strong>Print Report</strong> on the top-right corner.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot24_2}
              alt="Screenshot 24.2: Uninvoiced Bookings report example"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 24.3 — Cancellations Report */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        24.3 Cancellations Report Example
      </h3>
      <p className="text-gray-700 font-body mb-6">Select Date From and Date To &gt; Run Report &gt; Print or download PDF.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Under <strong>Administration</strong>, select <strong>Cancellations</strong>:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Set the <strong>Date From</strong> and <strong>Date To</strong> range.</li>
            <li>Optionally check <strong>Include No-Shows</strong>.</li>
            <li>Click the orange <strong>Run Report</strong> button.</li>
            <li>View real-time summary cards: <strong>Total</strong>, <strong>Cancelled</strong>, <strong>No Show</strong>, and <strong>With Reason</strong>.</li>
            <li>Inspect the ledger to see who cancelled the appointment, timestamps, and recorded cancellation reasons.</li>
            <li>Click <strong>Print Report</strong> in the top right to print or save a PDF.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot24_3}
              alt="Screenshot 24.3: Cancellations report example"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 24.4 — Clients & Cases Report */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        24.4 Clients & Cases Report Example
      </h3>
      <p className="text-gray-700 font-body mb-6">Select Date From and Date To &gt; Run Report &gt; Print or download PDF.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Under <strong>Clinic</strong>, select <strong>Clients & Cases</strong>:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Select your desired <strong>Date From</strong> and <strong>Date To</strong>.</li>
            <li>Optionally check <strong>Show new clients only</strong> to focus on first-time registrations.</li>
            <li>Click the orange <strong>Run Report</strong> button.</li>
            <li>Examine summary totals for <strong>Total Clients</strong> and <strong>New This Period</strong>.</li>
            <li>The table details client names, registration dates, clinic branch, primary practitioner, and active case tags (e.g. <em>Head Injury</em>, <em>Low Backpain</em>).</li>
            <li>Print or export the client list using <strong>Print Report</strong>.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot24_4}
              alt="Screenshot 24.4: Clients and Cases report example"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 24.5 — Clinical Notes Report */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        24.5 Clinical Notes Report Example
      </h3>
      <p className="text-gray-700 font-body mb-6">Select Date From and Date To &gt; Run Report &gt; Print or download PDF.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Under <strong>Clinic</strong>, select <strong>Clinical Notes</strong>:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Choose the <strong>Date From</strong> and <strong>Date To</strong> filter.</li>
            <li>Optionally check <strong>Include unsigned (draft) notes</strong>.</li>
            <li>Click the orange <strong>Run Report</strong> button.</li>
            <li>Track clinical compliance: view counters for <strong>Total Missing</strong>, <strong>No Note At All</strong>, and <strong>Unsigned Drafts</strong>.</li>
            <li>Review the appointment list to identify incomplete documentation, note status (*No Notes Yet*), and associated medical cases.</li>
            <li>Click <strong>Print Report</strong> to generate a compliance audit document.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot24_5}
              alt="Screenshot 24.5: Clinical Notes report example"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 24.6 — Providers & Practice Report */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        24.6 Providers & Practice Report Example
      </h3>
      <p className="text-gray-700 font-body mb-6">Select Date From and Date To &gt; Run Report &gt; Print or download PDF.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Under <strong>Clinic</strong>, select <strong>Providers & Practice</strong>:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Select the <strong>Date From</strong> and <strong>Date To</strong> range.</li>
            <li>Click the orange <strong>Run Report</strong> button.</li>
            <li>Analyze high-level metric cards: <strong>Total Revenue</strong>, <strong>Avg Revenue / Provider</strong>, <strong>Total Consultations</strong>, <strong>Avg Forward Booking %</strong>, <strong>Total Appointments</strong>, <strong>Completed</strong>, <strong>Cancelled</strong>, and <strong>DNA (No-show)</strong>.</li>
            <li>Review the <strong>Provider Breakdown</strong> table for individual doctor workloads, revenue generated, and consultation mix graphs.</li>
            <li>Click <strong>Print Report</strong> in the top-right corner to print or export as PDF.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot24_6}
              alt="Screenshot 24.6: Providers and Practice report example"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to generate, analyze, and export clinic reports:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li><strong>24.1 Reports Categories:</strong> Navigate between Administration, Clinic, Financial, and Performance reports.</li>
        <li><strong>24.2 Uninvoiced Bookings:</strong> Identify completed visits requiring invoice generation.</li>
        <li><strong>24.3 Cancellations:</strong> Track cancellation reasons and patient no-show rates.</li>
        <li><strong>24.4 Clients & Cases:</strong> Monitor patient acquisition and active medical case tags.</li>
        <li><strong>24.5 Clinical Notes:</strong> Audit notes compliance and locate missing or unsigned consultation notes.</li>
        <li><strong>24.6 Providers & Practice:</strong> Review provider-level performance, revenue contributions, and booking rates.</li>
        <li><strong>Print & PDF Export:</strong> Every report can be immediately printed or saved as PDF via the <strong>Print Report</strong> button.</li>
      </ul>
    </>
  );
};

export default Chapter24;

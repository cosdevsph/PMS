import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot23_1 from '@/assets/manual/Chapter 23/Screenshot 23.1.png';
import Screenshot23_2 from '@/assets/manual/Chapter 23/Screenshot 23.2.png';
import Screenshot23_3 from '@/assets/manual/Chapter 23/Screenshot 23.3.png';
import Screenshot23_4 from '@/assets/manual/Chapter 23/Screenshot 23.4.png';
import Screenshot23_5 from '@/assets/manual/Chapter 23/Screenshot 23.5.png';

const Chapter23: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to generate an invoice directly from an existing diary appointment, configure line items and payment methods, and review patient billing history.
      </p>

      {/* QUICK WORKFLOW SEQUENCE */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Invoice Generation Sequence</h3>
        <p className="text-gray-700 font-body mb-6">
          Generating a patient invoice from an appointment follows five straightforward steps:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Billing Workflow Steps</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">23.1 Select Appointment</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">23.2 "Generate Invoice" Tab</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">23.3 Click Generate Invoice</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-medium">23.4 Enter Details & Save</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">23.5 Billing History</span>
          </div>
        </div>
      </div>


      {/* SECTION 23.1 — Select an existing appointment */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        23.1 Select an Existing Appointment in the Diary Calendar
      </h3>
      <p className="text-gray-700 font-body mb-6">Locate and select the scheduled consultation or service in the clinic diary.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Navigate to the <strong>Diary</strong> page from the top navigation bar. Click on the target patient appointment on the calendar grid to open the appointment preview popover:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Review the patient name, appointment status (e.g., <em>Completed</em>), consultation date and time slot.</li>
            <li>Confirm the assigned practitioner, rendered service (e.g., <em>Second Consultation</em>), and chief complaint.</li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot23_1}
              alt="Screenshot 23.1: Select an existing appointment in the diary calendar"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 23.2 — Navigate to Generate Invoice Tab */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        23.2 Navigate to the "Generate Invoice" Tab in Appointment View
      </h3>
      <p className="text-gray-700 font-body mb-6">Access billing actions directly from the appointment details modal.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            In the <strong>Appointment Details</strong> window, locate the top tab navigation bar. Click on the <strong>Generate Invoice</strong> tab:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6 text-center text-xs font-medium text-gray-600">
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">Client Information</div>
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">Appointment</div>
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">Status</div>
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">Clinical Notes</div>
            <div className="p-2.5 bg-blue-50 text-care-blue rounded-lg border border-blue-300 font-bold">Generate Invoice</div>
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">Communications</div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot23_2}
              alt="Screenshot 23.2: From appointment view modal, navigate to Generate Invoice Tab"
              className="w-full max-h-[300px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 23.3 — Click Generate Invoice */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        23.3 Click "Generate Invoice" to Create the Draft
      </h3>
      <p className="text-gray-700 font-body mb-6">Review the session summary and trigger invoice generation.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Generate Invoice</strong> tab presents a consolidated <strong>Appointment Summary</strong> card verifying:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-gray-700 font-body mb-6">
            <li><strong>Patient:</strong> Verified client profile name.</li>
            <li><strong>Practitioner:</strong> Doctor or clinician who conducted the session.</li>
            <li><strong>Date & Time:</strong> Appointment schedule timestamp and duration.</li>
            <li><strong>Service:</strong> Scheduled clinical procedure or consultation type.</li>
          </ul>

          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Click the prominent blue <strong>+ Generate Invoice</strong> button to open the full invoice editor.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot23_3}
              alt="Screenshot 23.3: Click Generate Invoice to generate an invoice"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Malasakit automatically prevents duplicate billing: each appointment is uniquely associated with its generated invoice.
      </DocCallout>


      {/* SECTION 23.4 — Enter Details & Generate Invoice */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        23.4 Enter Invoice Details & Complete Generation
      </h3>
      <p className="text-gray-700 font-body mb-6">Configure line items, apply payments, add notes, and finalize the invoice.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            On the <strong>New Invoice</strong> page, review the pre-populated appointment details and fill in the required billing information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Invoice Details & Line Items</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li>• Pre-loaded consultation service item, quantity, and unit price.</li>
                <li>• Set optional discounts or tax (GST) rates.</li>
                <li>• Click <strong>Add item</strong> to include extra medications, supplies, or add-on procedures.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Payment Methods & Summary</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li>• Log received amounts under <strong>Cash</strong>, <strong>Debit Card</strong>, <strong>Credit Card</strong>, <strong>Cheque</strong>, or <strong>GCash</strong>.</li>
                <li>• Check live calculations for <em>Package Subtotal</em>, <em>Total Amount Paid</em>, and remaining <em>Package Balance Due</em>.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 md:col-span-2">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Invoice & Account Notes</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li>• <strong>Invoice Notes:</strong> Notes specific to this billing document (printed on patient receipts).</li>
                <li>• <strong>Account Notes:</strong> Persistent internal billing reminders for the patient's record.</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Once all details are verified, click the dark <strong>Generate Invoice</strong> button in the bottom right corner.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot23_4}
              alt="Screenshot 23.4: Enter necessary invoice details and click Generate Invoice"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Partial payments are fully supported. If a patient pays only a portion today, enter the collected amount in the appropriate payment field, and the system will automatically track the remaining balance due.
      </DocCallout>


      {/* SECTION 23.5 — Redirect to Billing History */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        23.5 Redirect to Billing History via Patient Profile
      </h3>
      <p className="text-gray-700 font-body mb-6">Review the saved invoice, payment statuses, and outstanding balances.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Upon saving the invoice, the system automatically redirects you to the patient's <strong>Billing History</strong> page under <strong>Patient Profile &gt; Invoices</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
              <h5 className="font-bold text-sky-950 mb-1 text-sm">Master Invoices</h5>
              <p className="text-xs text-gray-600">Displays treatment packages, total amounts paid, and pending balance summaries.</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <h5 className="font-bold text-emerald-950 mb-1 text-sm">Standard Transactions</h5>
              <p className="text-xs text-gray-600">Lists invoice numbers, dates, payment status (<em>Paid</em> / <em>Pending</em>), and quick actions (Print, Email, Edit, Delete).</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <h5 className="font-bold text-amber-950 mb-1 text-sm">Outstanding Balance Monitoring</h5>
              <p className="text-xs text-gray-600">Tracks unpaid amounts across visits to maintain accurate patient financial ledgers.</p>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot23_5}
              alt="Screenshot 23.5: Redirect to Billing History page via Patient Profile > Invoices menu"
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
        In this chapter, you learned how simple it is to generate and manage patient invoices:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li><strong>23.1 Select Appointment:</strong> Open the target appointment card directly on the Diary calendar.</li>
        <li><strong>23.2 Generate Invoice Tab:</strong> Navigate to the dedicated billing tab within the Appointment Details view.</li>
        <li><strong>23.3 Create Draft Bill:</strong> Click the "+ Generate Invoice" button to start creating the invoice.</li>
        <li><strong>23.4 Configure Details:</strong> Add line items, specify payment methods (Cash, Card, GCash), and save notes.</li>
        <li><strong>23.5 Billing History:</strong> Review invoices and monitor outstanding balances in the patient's billing profile.</li>
      </ul>
    </>
  );
};

export default Chapter23;

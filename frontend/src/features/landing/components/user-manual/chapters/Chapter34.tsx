import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot34_1 from '@/assets/manual/Chapter 34/Screenshot 34.1.webp';
import Screenshot34_2 from '@/assets/manual/Chapter 34/Screenshot 34.2.webp';

const Chapter34: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to review who created and changed clinical notes, read earlier versions of a note, and find the other change histories in Malasakit.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Audit Logs Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Malasakit keeps a record of changes to clinical notes so you can answer who did what and when. Other records have their own histories:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Audit Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">34.1 Clinical Audit Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">34.2 Note Version History</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">34.3 Other Histories</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">34.4 What Is Not Covered</span>
          </div>
        </div>
      </div>


      {/* SECTION 34.1 — The Clinical Audit Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        34.1 The Clinical Audit Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Every action on clinical notes.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Go to <strong>Manage</strong> and, in the <strong>Communications</strong> card, click <strong>Clinical Audit</strong>. The page <strong>Clinical Note Audit Logs</strong> lists what was done to clinical notes.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Search by <strong>user or patient name</strong>, or choose a <strong>from</strong> and <strong>to</strong> date, then click <strong>Filter</strong>.</li>
            <li><strong>Date &amp; Time</strong> shows when it happened.</li>
            <li><strong>Action</strong> shows what happened, such as <strong>CREATED</strong>, <strong>UPDATED</strong>, <strong>SIGNED</strong> or <strong>DELETED</strong>.</li>
            <li><strong>User</strong> is who did it, <strong>Patient</strong> is whose note, and <strong>Note Date</strong> is the date of the note.</li>
            <li>Use the page controls at the bottom to move through long lists. <em>No Audit Logs Found</em> means nothing matches your filter.</li>
          </ul>

          <DocCallout type="tip" title="Who can open it">
            By default the Branch Manager and Front Desk can use the page, the Practitioner can only view it, and Finance cannot open it. The Owner always has access. Permission groups are set under <strong>Setup &gt; Users &gt; Permissions</strong>.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot34_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 34.1: Clinical Note Audit Logs"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 34.2 — Reading a Note's Version History */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.2 Reading a Note's Version History
      </h3>
      <p className="text-gray-700 font-body mb-6">See exactly what a note said earlier.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>History</strong> at the end of a row. The <strong>Version History</strong> window lists each saved version of the note with its date and author. Select a version to read it. Earlier versions are shown <strong>read only</strong>, including any chart drawings.
          </p>

          <DocCallout type="info">
            You can also open the version history from a note itself with the <strong>History</strong> button beside the note.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot34_2}
              width={2368}
              height={1866}
              decoding="async"
              loading="lazy"
              alt="Screenshot 34.2: Version History of a clinical note"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 34.3 — Other Change Histories */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.3 Other Change Histories
      </h3>
      <p className="text-gray-700 font-body mb-6">Where to look for other records.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Private package sessions:</strong> the <strong>Edit History</strong> button on the package lists every change and who made it. See the Prepaid Packages chapter.</li>
            <li><strong>Invoices:</strong> the invoice detail window has a <strong>Version History</strong> for earlier versions of an invoice.</li>
            <li><strong>Messages:</strong> <strong>Setup &gt; Communication &gt; Logs</strong> lists the emails and SMS the clinic sent. See the Automated SMS and Notifications chapter.</li>
          </ul>
        </div>
      </div>


      {/* SECTION 34.4 — What Is Not Covered */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        34.4 What Is Not Covered
      </h3>
      <p className="text-gray-700 font-body mb-6">Know the limits of the logs today.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <DocCallout type="important" title="No single activity log yet">
            Malasakit does not yet have one screen that lists every action by every user or system, such as sign-ins, role changes or patient merges. The Clinical Audit page covers clinical notes only, and the histories above cover packages, invoices and messages. If you need a record for an investigation or a compliance request, contact support.
          </DocCallout>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to review changes in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to open <strong>Clinical Audit</strong> and filter by user, patient and date.</li>
        <li>How to read an earlier version of a note in <strong>Version History</strong>.</li>
        <li>Where to find the histories of <strong>packages, invoices and messages</strong>.</li>
        <li>That there is <strong>no single activity log</strong> for all users and system actions yet.</li>
      </ul>
    </>
  );
};

export default Chapter34;

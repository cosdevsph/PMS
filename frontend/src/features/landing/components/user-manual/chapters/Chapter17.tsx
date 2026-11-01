import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot17_1 from '@/assets/manual/Chapter 17/Screenshot 17.1.webp';
import Screenshot17_2 from '@/assets/manual/Chapter 17/Screenshot 17.2.webp';
import Screenshot17_3 from '@/assets/manual/Chapter 17/Screenshot 17.3.webp';
import Screenshot17_3_1 from '@/assets/manual/Chapter 17/Screenshot 17.3.1.webp';
import Screenshot17_4 from '@/assets/manual/Chapter 17/Screenshot 17.4.webp';
import Screenshot17_5 from '@/assets/manual/Chapter 17/Screenshot 17.5.webp';

const Chapter17: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to record a private package agreed with a patient, use one session each time an appointment is covered by it, see how many sessions have been used and are left, and read the package history.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Private Package Sessions Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          A private package is a number of sessions that a patient and the clinic agree on in person, usually at a set price. Malasakit tracks the sessions for you:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Package Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">17.1 Package List</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">17.2 Add a Package</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">17.3 Cover Appointments</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">17.4 Invoice</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">17.5 History</span>
          </div>
        </div>
      </div>


      {/* SECTION 17.1 — The Private Package Sessions Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        17.1 The Private Package Sessions Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Every package for one patient.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Clients</strong>, open a patient, then click <strong>Private Package Sessions</strong> in the patient's left menu. The page lists the patient's packages.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Reading the table</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Package:</strong> the title, notes and the date it was created.</li>
                <li><strong>Services:</strong> each service with how many sessions are used, for example <em>1/3 used</em>.</li>
                <li><strong>Sessions:</strong> sessions remaining and used out of the total, with a progress bar. The bar is green, turns amber when 2 or fewer sessions remain, and red at 0.</li>
                <li><strong>Price / Payment:</strong> the package price and whether it is <em>Paid</em>, <em>Partial</em>, <em>Unpaid</em> or has no invoice.</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Status, filters and actions</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Status:</strong> Active, Completed or Cancelled.</li>
                <li>Use the <strong>All, Active, Completed</strong> and <strong>Cancelled</strong> filters or the search box to narrow the list.</li>
                <li><strong>Created / Modified by:</strong> who created and last changed the package.</li>
                <li><strong>Edit</strong> changes the package and <strong>Edit History</strong> shows what happened to it.</li>
              </ul>
            </div>
          </div>

          <DocCallout type="info">
            Private packages are agreed on site. They are not shown in online booking.
          </DocCallout>

          <DocCallout type="tip" title="Who can add and edit">
            The Owner, Branch Manager, Front Desk and Practitioner roles can add and edit packages. Finance and Read-only users can view the page but not change it.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot17_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 17.1: Private Package Sessions page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 17.2 — Adding a Package */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        17.2 Adding a Package
      </h3>
      <p className="text-gray-700 font-body mb-6">Record what was agreed with the patient.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>On the <strong>Private Package Sessions</strong> page, click <strong>Add Private Package Session</strong>.</li>
            <li>Enter a <strong>Private Package Session Title</strong>, for example <em>10-session Rehab Program</em>.</li>
            <li>Under <strong>Clinic Services</strong>, choose a service and enter how many sessions it includes. Click <strong>Add more services</strong> for each additional service. The total number of sessions is shown above the list.</li>
            <li>Optionally, click <strong>Schedule an appointment for</strong> a service to book its first appointment now by choosing the date, time, practitioner and case.</li>
            <li>Enter the <strong>Private Package Session Price (₱)</strong>. This price is used instead of the individual service prices; the regular total is shown beneath it for comparison.</li>
            <li>Add <strong>Notes</strong> such as the agreed terms, then click <strong>Create package</strong>.</li>
          </ol>

          <DocCallout type="info">
            Creating a package also creates an invoice for the package price, unless the price is 0.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot17_2}
              width={1632}
              height={1460}
              decoding="async"
              loading="lazy"
              alt="Screenshot 17.2: Add Private Package Session form"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 17.3 — Covering Appointments with a Package */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        17.3 Covering Appointments with a Package
      </h3>
      <p className="text-gray-700 font-body mb-6">Use one session for each appointment.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Nothing is applied automatically. You choose which appointments use a session:
          </p>

          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Open the appointment from the <strong>Diary</strong> and stay on the <strong>Client Information</strong> tab.</li>
            <li>In the <strong>Private Package Session</strong> card at the bottom, open the drop-down. Each option shows the package and how many sessions are left for this appointment's service.</li>
            <li>Select the package and click <strong>Add to package</strong>.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot17_3}
              width={2368}
              height={1781}
              decoding="async"
              loading="lazy"
              alt="Screenshot 17.3: Private Package Session card on an appointment, before adding"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The card turns green and reads <strong>Covered by a Private Package Session</strong>, with the package name and the note that the appointment has no service charge. Click <strong>Remove from package</strong> to undo it.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot17_3_1}
              width={2368}
              height={1709}
              decoding="async"
              loading="lazy"
              alt="Screenshot 17.3.1: Appointment covered by a Private Package Session"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <DocCallout type="important" title="What counts as a used session">
            Cancelling or deleting a covered appointment gives its session back. An appointment marked <strong>DNA</strong> (did not attend) still counts as used. Once an invoice exists for the appointment, it can no longer be removed from the package.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 17.4 — Invoicing Covered Appointments */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        17.4 Invoicing Covered Appointments
      </h3>
      <p className="text-gray-700 font-body mb-6">Covered sessions are free of charge on the invoice.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            When you generate the invoice for a covered appointment, its line reads <strong>(Covered by Private Package Session)</strong> at ₱0 and the price cannot be changed. Anything extra you add is charged as usual. The package itself appears on its own invoice as <strong>Package: title</strong>.
          </p>

          <DocCallout type="info">
            Some invoice screens also show a <strong>Package Subtotal</strong> and <strong>Package Balance Due</strong> box. That box belongs to the older case-based package billing and does not show the balance of a private package. Use the package page to see what has been paid.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot17_4}
              width={2012}
              height={454}
              decoding="async"
              loading="lazy"
              alt="Screenshot 17.4: Invoice line covered by a Private Package Session"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 17.5 — Editing a Package and Reading Its History */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        17.5 Editing a Package and Reading Its History
      </h3>
      <p className="text-gray-700 font-body mb-6">Correct, close or review a package.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Edit</strong> to change the status (Active, Completed or Cancelled), the quantities or the notes. A package cannot be deleted; cancel it instead.
          </p>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Edit History</strong> to see who created and last changed the package, followed by every event: <em>Package Created</em>, <em>Package Updated</em>, <em>Status Changed</em>, <em>Appointment Assigned</em> and <em>Appointment Unassigned</em>. Assignment entries show which session it was, for example <em>session 1 of 4</em>, and any reason that was entered.
          </p>

          <DocCallout type="info" title="Two kinds of session number">
            The history shows <em>session 1 of 4</em> for a package. The <strong>Session N</strong> badge in the clinical notes screen is different: it is the position of the visit within the patient's case and has nothing to do with packages.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot17_5}
              width={1440}
              height={852}
              decoding="async"
              loading="lazy"
              alt="Screenshot 17.5: Edit History of a Private Package Session"
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
        In this chapter, you learned how to manage private package sessions in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to find a patient's packages under <strong>Private Package Sessions</strong> and read the sessions used and remaining.</li>
        <li>How to <strong>add a package</strong> with services, quantities and a package price.</li>
        <li>How to <strong>cover an appointment</strong> with a package, and how to remove it.</li>
        <li>How covered sessions appear on the <strong>invoice</strong>.</li>
        <li>How to <strong>edit</strong> a package and read its <strong>Edit History</strong>.</li>
      </ul>
    </>
  );
};

export default Chapter17;

import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot6_1 from '@/assets/manual/Chapter 6/Screenshot 6.1.webp';
import Screenshot6_2 from '@/assets/manual/Chapter 6/Screenshot 6.2.webp';
import Screenshot6_3 from '@/assets/manual/Chapter 6/Screenshot 6.3.webp';
import Screenshot6_4 from '@/assets/manual/Chapter 6/Screenshot 6.4.webp';
import Screenshot6_4_1 from '@/assets/manual/Chapter 6/Screenshot 6.4.1.webp';

const Chapter6: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to create and edit the services your clinic offers, set each service's price, duration and calendar colour, switch services on or off, and understand which services patients can book online.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Clinic Services Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Services are what you book in the Diary, invoice to patients and, while they are active, offer through online booking. Managing them takes four steps:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Service Management Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">6.1 Open Clinic Services</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">6.2 Review the List</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">6.3 Create a Service</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">6.4 Edit, Switch Off or Delete</span>
          </div>
        </div>
      </div>


      {/* SECTION 6.1 — Opening Clinic Services */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        6.1 Opening Clinic Services
      </h3>
      <p className="text-gray-700 font-body mb-6">Find the service list on the Manage page.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Services are managed under <strong>Manage</strong>, in the <strong>Clinical</strong> card, next to Clinic Link Portal and Note Templates.
          </p>

          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Click <strong>Manage</strong> in the top navigation bar.</li>
            <li>In the <strong>Clinical</strong> card, click <strong>Clinic Services</strong>.</li>
            <li>The <strong>Clinic Services</strong> page opens with every service your clinic offers.</li>
          </ol>

          <DocCallout type="info">
            Services and prices belong to the whole clinic. The same list and the same prices apply at every branch; there are no branch-specific prices.
          </DocCallout>

          <DocCallout type="tip" title="Who can change services">
            The Owner can always edit services. By default the <strong>Practitioner</strong> permission group can edit them, while <strong>Branch Manager</strong> and <strong>Front Desk</strong> can only view. The Owner can change this under <strong>Setup &gt; Users &gt; Permissions</strong>.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 6.1: Manage Page Display, Clinical card with Clinic Services"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 6.2 — The Clinic Services List */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        6.2 The Clinic Services List
      </h3>
      <p className="text-gray-700 font-body mb-6">Every service with its price, duration and status.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The list shows one row for each service. Use the <strong>Search services...</strong> box to find a service by name. The footer shows how many services are listed, for example <em>Showing 8 of 8 services</em>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">What each column shows</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Code:</strong> the row number (S001, S002 …). It is not saved with the service and can change when you search or delete.</li>
                <li><strong>Name:</strong> click it to edit the service.</li>
                <li><strong>Description:</strong> a short note about the service.</li>
                <li><strong>Discipline:</strong> the practitioner discipline that offers it.</li>
                <li><strong>Colour:</strong> the colour used for these appointments in the Diary.</li>
                <li><strong>Duration</strong> and <strong>Price:</strong> for example 45 mins and ₱1,800.00.</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Status and actions</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Portal:</strong> <em>Yes</em> means the service can be offered in online booking.</li>
                <li><strong>Active:</strong> the toggle switches the service on or off. Inactive services are faded.</li>
                <li><strong>Actions:</strong> the pencil edits the service and the bin deletes it.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.2: Clinic Services list with prices, durations and status"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 6.3 — Creating a Service */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        6.3 Creating a Service
      </h3>
      <p className="text-gray-700 font-body mb-6">Add a new service with one form.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Click <strong>Create Service</strong> at the top right of the page.</li>
            <li>Enter the <strong>Service Name</strong> (required), for example <em>Physical Therapy Follow-up</em>.</li>
            <li>Optionally add a <strong>Description</strong>.</li>
            <li>Choose the <strong>Duration</strong> (from 15 minutes up to 8 hours in 15-minute steps) and enter the <strong>Price (₱)</strong>.</li>
            <li>Pick a <strong>Calendar Colour</strong> with the colour picker or by typing a hex code.</li>
            <li>Choose the <strong>Assigned Discipline</strong> (required). All practitioners with this discipline can offer the service.</li>
            <li>Click <strong>Create Service</strong>. A message confirms that the service was created.</li>
          </ol>

          <DocCallout type="tip">
            Give each service its own colour so appointments are easy to tell apart in the Diary day and week views.
          </DocCallout>

          <DocCallout type="info">
            The duration you set is the default length of an appointment booked for this service, and the price is the amount offered when you invoice it.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_3}
              width={1120}
              height={1318}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.3: Create Service form"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 6.4 — Editing, Switching Off and Deleting */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        6.4 Editing, Switching Off and Deleting
      </h3>
      <p className="text-gray-700 font-body mb-6">Keep the list up to date without losing history.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Editing a service</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click the service name or the pencil icon. The same form opens as <strong>Edit Service</strong>. Change what you need and click <strong>Save Changes</strong>.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_4}
              width={1120}
              height={1318}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.4: Edit Service form"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <h4 className="text-lg font-semibold text-gray-900 mb-3">Switching a service off</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click the toggle in the <strong>Active</strong> column. An inactive service is faded and no longer appears when you book appointments or on the online booking page. Switch it back on at any time.
          </p>

          <DocCallout type="warning">
            Saving the <strong>Edit Service</strong> form switches the service back on. If you edit a service that is currently off, check its <strong>Active</strong> toggle afterwards.
          </DocCallout>

          <h4 className="text-lg font-semibold text-gray-900 mb-3">Deleting a service</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click the bin icon in the <strong>Actions</strong> column. A dialog asks you to confirm because the action cannot be undone. Click <strong>Delete</strong> to confirm or <strong>Cancel</strong> to keep the service. A deleted service leaves the list and can no longer be booked.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot6_4_1}
              width={864}
              height={424}
              decoding="async"
              loading="lazy"
              alt="Screenshot 6.4.1: Delete Service confirmation dialog"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <DocCallout type="tip">
            If a service may come back, for example a seasonal programme, switch it off instead of deleting it.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 6.5 — Services and Online Booking */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        6.5 Services and Online Booking
      </h3>
      <p className="text-gray-700 font-body mb-6">What patients can choose on your booking page.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            A patient booking online sees a service only when all of the following are true:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>The service is <strong>Active</strong>.</li>
            <li>The <strong>Portal</strong> column shows <strong>Yes</strong>.</li>
            <li>The service matches the discipline of the practitioner the patient chose.</li>
            <li>The service is not a package. Packages are never offered through online booking.</li>
          </ul>

          <DocCallout type="important" title="No separate online booking switch">
            The Create and Edit forms do not have an online booking switch, and new services are always set to <strong>Portal: Yes</strong>. To keep a service off the booking page, switch it off with the <strong>Active</strong> toggle. Note that this also removes it from the Diary. See the Online Booking chapter to see how patients choose a service.
          </DocCallout>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to manage your clinic's services in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to open <strong>Clinic Services</strong> from the <strong>Clinical</strong> card on the <strong>Manage</strong> page.</li>
        <li>How to read the list, including <strong>Duration</strong>, <strong>Price</strong>, <strong>Portal</strong> and <strong>Active</strong>.</li>
        <li>How to <strong>create</strong> a service with a name, duration, price, colour and discipline.</li>
        <li>How to <strong>edit, switch off or delete</strong> a service, and why switching off is safer than deleting.</li>
        <li>Which services patients can book online, and how to keep a service off the booking page.</li>
      </ul>
    </>
  );
};

export default Chapter6;

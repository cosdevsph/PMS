import React from 'react';
import { DocCallout } from '../DocCallout';

import Diagram5_1 from '@/assets/manual/Chapter 5/Diagram 5.1.webp';
import Screenshot5_1 from '@/assets/manual/Chapter 5/Screenshot 5.1.webp';
import Screenshot5_2 from '@/assets/manual/Chapter 5/Screenshot 5.2.webp';
import Screenshot5_3 from '@/assets/manual/Chapter 5/Screenshot 5.3.webp';
import Screenshot5_4 from '@/assets/manual/Chapter 5/Screenshot 5.4.webp';
import Screenshot5_5 from '@/assets/manual/Chapter 5/Screenshot 5.5.webp';
import Screenshot5_6 from '@/assets/manual/Chapter 5/Screenshot 5.6.webp';
import Screenshot5_7 from '@/assets/manual/Chapter 5/Screenshot 5.7.webp';
import Screenshot5_8 from '@/assets/manual/Chapter 5/Screenshot 5.8.webp';

const Chapter5: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how Malasakit handles multiple clinic branches, allowing you to manage each location independently while remaining under one central clinic account.
      </p>

      {/* IMPORTANT CONCEPT — New Branch Workflow */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-4">Understanding the Branch Workflow</h3>
        
        <p className="text-gray-700 font-body mb-4">
          Malasakit introduces a decentralized branch architecture. Unlike traditional systems where patients open a single website and manually select a branch from a dropdown list, every Malasakit clinic branch functions as its own dedicated patient entry point.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl border border-sky-100">
            <h4 className="font-semibold text-gray-900 mb-2">Traditional Workflow</h4>
            <p className="text-sm text-gray-600 mb-2">Patient opens Clinic Website</p>
            <p className="text-sm text-gray-400">↓</p>
            <p className="text-sm text-gray-600 mb-2">Manually selects a Branch</p>
            <p className="text-sm text-gray-400">↓</p>
            <p className="text-sm text-gray-600 mb-2">Selects a Practitioner</p>
            <p className="text-sm text-gray-400">↓</p>
            <p className="text-sm text-gray-600">Books Appointment</p>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-[0_4px_12px_rgb(16,185,129,0.1)]">
            <h4 className="font-semibold text-emerald-900 mb-2">Malasakit Workflow</h4>
            <p className="text-sm text-gray-600 mb-2">Patient opens Branch's Unique Public Link / Scans QR</p>
            <p className="text-sm text-emerald-400">↓</p>
            <p className="text-sm text-gray-600 mb-2">Selects a Practitioner (Only branch staff shown)</p>
            <p className="text-sm text-emerald-400">↓</p>
            <p className="text-sm text-gray-600">Books Appointment</p>
          </div>
        </div>

        <p className="text-gray-700 font-body mb-6">
          Because every branch has its own dedicated entry point:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
          <li>Patients no longer need to manually select a clinic branch.</li>
          <li>The branch is automatically determined by the URL or QR Code they used.</li>
          <li>Only practitioners assigned to that specific branch are displayed to the patient.</li>
          <li>Bookings are automatically associated with the correct physical location.</li>
        </ul>

        <div className="mt-6 w-full flex justify-center bg-white border border-sky-200 rounded-xl overflow-hidden p-2 shadow-sm">
          <img
            src={Diagram5_1}
            width={1536}
            height={1024}
            decoding="async"
            alt="Diagram 5.1: Branch Architecture Diagram"
            className="w-full max-h-[500px] object-contain rounded-lg"
          />
        </div>
      </div>


      {/* SECTION 5.1 — Creating a Clinic Branch */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        5.1 Creating a Clinic Branch
      </h3>
      <p className="text-gray-700 font-body mb-6">Learn how to create additional clinic locations.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 1: Open Locations Page</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Navigate to the <strong>Clinic Locations</strong> page in your Settings. Here you will see a list of all your active and inactive branches.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot5_1}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 5.1: Clinic Locations page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 2: Fill Branch Details</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Create New Branch</strong>. A modal will appear with the following required information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Branch Name:</strong> The specific location or barangay name (e.g., "Lacson"). This is automatically appended to your main clinic name (e.g., "Malasakit Clinic - Lacson").</li>
            <li><strong>Branch ID:</strong> Automatically generated by the system for internal tracking.</li>
            <li><strong>Email & Phone:</strong> The contact details specific to this branch location.</li>
            <li><strong>Address & Map Pin:</strong> The physical location of the branch. Similar to the initial clinic setup, you can use the map to drop a pin on the exact building.</li>
          </ul>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot5_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 5.2: Create Branch Modal"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Step 3: Save</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Click <strong>Create Branch</strong>. The new branch will immediately appear as a card in your branch list and inherit the subscription plan from the main clinic.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot5_3}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 5.3: Updated Branch List"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 5.2 — Editing a Clinic Branch */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        5.2 Editing a Clinic Branch
      </h3>
      <p className="text-gray-700 font-body mb-6">Keep your branch information up to date.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To edit an existing branch, locate its card on the Clinic Locations page and click <strong>Edit Details</strong> (or use the three-dot menu). You can update the address, contact information, and map pin at any time.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot5_4}
              width={1132}
              height={570}
              decoding="async"
              loading="lazy"
              alt="Screenshot 5.4: Edit Branch Modal"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        Updating branch information automatically affects reports, appointment scheduling, online booking, printed documents, and patient communications across the system.
      </DocCallout>


      {/* SECTION 5.3 — Branch Portals & Public Links */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        5.3 Branch Portals & Public Links
      </h3>
      <p className="text-gray-700 font-body mb-6">Manage how patients access each specific branch.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Unique Booking URLs</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Navigate to the <strong>Branch Portals</strong> page. Every active branch automatically receives its own unique <strong>Booking URL</strong>. Patients who visit this URL are directed straight to that specific branch's scheduling portal.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot5_5}
              width={1696}
              height={1096}
              decoding="async"
              loading="lazy"
              alt="Screenshot 5.5: Branch Portals page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Public Access Toggle</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            If a branch is temporarily closed or not accepting online appointments, you can toggle the <strong>Public Access</strong> switch at the bottom of the portal card. This immediately disables the booking link and QR code.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot5_6}
              width={916}
              height={1350}
              decoding="async"
              loading="lazy"
              alt="Screenshot 5.6: Public Access Toggle"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Share the branch-specific public link on your website, Facebook page, email signatures, or appointment reminder messages so patients always book at the correct location!
      </DocCallout>


      {/* SECTION 5.4 — Branch QR Codes */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        5.4 Branch QR Codes
      </h3>
      <p className="text-gray-700 font-body mb-6">Utilize physical marketing materials to drive bookings.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Downloading QR Codes</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            On the <strong>Branch Portals</strong> page, every branch features an auto-generated QR code. Clicking <strong>Save PNG</strong> downloads a high-resolution, print-ready image card that includes your clinic logo, branch location name, and the scannable code.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot5_7}
              width={1696}
              height={1096}
              decoding="async"
              loading="lazy"
              alt="Screenshot 5.7: QR Code section"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <h4 className="text-xl font-semibold text-trust-harbor font-heading mb-4">Regenerating QR Codes</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            If your QR code is ever compromised or you wish to invalidate old marketing materials, you can click the <strong>Regenerate</strong> button. This instantly creates a new booking URL and QR code, rendering all previous versions permanently inactive.
          </p>
          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot5_8}
              width={892}
              height={676}
              decoding="async"
              loading="lazy"
              alt="Screenshot 5.8: Regenerate QR Confirmation"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      <DocCallout type="info">
        QR Codes are ideal for reception counters, clinic entrances, flyers, business cards, and printed prescription pads.
      </DocCallout>

      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to manage multiple physical locations within a single clinic workspace. You should now know how to:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>Understand the independent entry-point architecture of Malasakit branches.</li>
        <li>Create and update clinic branches.</li>
        <li>Locate and share branch-specific booking URLs.</li>
        <li>Toggle public portal access for individual branches.</li>
        <li>Download and regenerate print-ready QR codes.</li>
      </ul>

      <DocCallout type="info">
        Note: Operating hours are not defined at the branch level. Instead, availability is configured per-practitioner to provide maximum scheduling flexibility. This will be covered in upcoming chapters.
      </DocCallout>
    </>
  );
};

export default Chapter5;

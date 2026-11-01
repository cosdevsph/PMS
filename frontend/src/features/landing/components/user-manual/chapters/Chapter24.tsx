import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot24_1 from '@/assets/manual/Chapter 24/Screenshot 24.1.webp';
import Screenshot24_2 from '@/assets/manual/Chapter 24/Screenshot 24.2.webp';
import Screenshot24_3 from '@/assets/manual/Chapter 24/Screenshot 24.3.webp';

const Chapter24: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to navigate to the Clinic Link Portal from the Manage page, share public booking links, download printable QR codes, and control online scheduling access for your clinic branches.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Clinic Link Portal Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Setting up and sharing your clinic's self-service online booking portal involves two simple screens and a few places to share the result:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Portal Access Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">24.1 Manage Page Display</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">Select Clinic Link Portal</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">24.2 Clinic Link Portal Page Display</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">24.3 Share Your Link and QR Code</span>
          </div>
        </div>
      </div>


      {/* SECTION 24.1 — Manage Page Display */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        24.1 Manage Page Display
      </h3>
      <p className="text-gray-700 font-body mb-6">Access centralized administration, clinical configurations, and communication settings.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The <strong>Manage</strong> page serves as the control center for your clinic's administrative and operational configurations. Clicking <strong>Manage</strong> on the top navigation bar opens the main hub, categorized into three distinct operational cards:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Administration
              </h5>
              <p className="text-xs text-gray-600 mb-2">Reports, invoicing, and print operations.</p>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li>Print Appointments</li>
                <li>Bulk Invoicing</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
              <h5 className="font-bold text-sky-950 mb-2 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Clinical
              </h5>
              <p className="text-xs text-gray-600 mb-2">Templates, services, and public portals.</p>
              <ul className="text-xs space-y-1 text-gray-800 font-body list-disc pl-4 font-medium">
                <li className="text-teal-700 font-bold">Clinic Link Portal</li>
                <li>Note Templates</li>
                <li>Letter Templates</li>
                <li>Clinic Services</li>
                <li>Clinic Profile</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                Communications
              </h5>
              <p className="text-xs text-gray-600 mb-2">Reminders, records, and notifications.</p>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li>Email Reminder</li>
                <li>Records</li>
                <li>Clinical Audit</li>
              </ul>
            </div>
          </div>

          <h4 className="text-lg font-semibold text-gray-900 mb-3">Navigating to Clinic Link Portal</h4>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Click <strong>Manage</strong> in the top navigation bar.</li>
            <li>Locate the <strong>Clinical</strong> card in the center.</li>
            <li>Click <strong>Clinic Link Portal</strong> to view and configure branch-specific public booking portals.</li>
          </ol>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot24_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 24.1: Manage Page Display"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 24.2 — Clinic Link Portal Page Display */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        24.2 Clinic Link Portal Page Display
      </h3>
      <p className="text-gray-700 font-body mb-6">Manage branch booking links, QR code posters, public availability, and link security.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The <strong>Branch Portals</strong> page displays individual booking cards for each clinic branch you are authorized to manage (such as <em>Malasakit Clinic - Bacolod</em> and <em>Malasakit Clinic - South</em>). Each card serves as a self-contained command panel for the branch's online patient intake.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 1. Copy Public Link */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">1</span>
                <h5 className="font-bold text-gray-900 text-base">Copy Public Booking Link</h5>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Each clinic branch is assigned a unique, dedicated web link under <strong>BOOKING URL</strong>.
              </p>
              <ul className="text-xs space-y-2 text-gray-700 font-body list-disc pl-4">
                <li>
                  <strong>Copy Button:</strong> Click the green <strong>Copy</strong> button to instantly copy the full booking URL (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-800">https://www.malasakitsystems.com/book/...</code>) to your clipboard.
                </li>
                <li>
                  <strong>Multi-Channel Distribution:</strong> Paste and share the link on your official website, social media pages (Facebook, Instagram), SMS appointment blast messages, or email signatures.
                </li>
                <li>
                  <strong>Open Preview:</strong> Click the <strong>Open</strong> button to view the public portal page in a new browser tab exactly as patients will see it.
                </li>
              </ul>
            </div>

            {/* 2. Download QR Code as PNG */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">2</span>
                <h5 className="font-bold text-gray-900 text-base">Download QR Code as PNG</h5>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Each branch generates a clean, scannable QR code directly tied to its specific booking portal.
              </p>
              <ul className="text-xs space-y-2 text-gray-700 font-body list-disc pl-4">
                <li>
                  <strong>Save PNG Button:</strong> Click the <strong>Save PNG</strong> button directly beneath the QR code preview.
                </li>
                <li>
                  <strong>Print-Ready Artwork:</strong> Malasakit automatically compiles a 1080×1350 PNG image with the QR code, the branch name, its city, and the Malasakit logo. The file is named after the branch, for example <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-800">malasakit-clinic---bacolod-qr-code.png</code>.
                </li>
                <li>
                  <strong>Physical Display:</strong> Print and display the downloaded graphic at reception counters, waiting areas, building entry points, or on promotional flyers for convenient walk-in rebooking.
                </li>
              </ul>
            </div>

            {/* 3. Enable / Disable Portal Access */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">3</span>
                <h5 className="font-bold text-gray-900 text-base">Enable / Disable Public Access</h5>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Control the online booking availability of any branch with a single click.
              </p>
              <ul className="text-xs space-y-2 text-gray-700 font-body list-disc pl-4">
                <li>
                  <strong>Public Access Toggle:</strong> Located in the footer of each branch card, the <strong>Public Access</strong> toggle switch lets you activate or deactivate online scheduling in real time.
                </li>
                <li>
                  <strong>Status Badge:</strong> An active portal displays a bright green <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">• ACTIVE</span> indicator at the top right of the card.
                </li>
                <li>
                  <strong>Instant Closure:</strong> If disabled, visitors who open the link see the message <em>This booking page is unavailable or the link has expired</em>, which prevents bookings during clinic renovations, holidays, or staff leave. Turn the toggle back on to reopen online booking.
                </li>
              </ul>
            </div>

            {/* 4. Regenerate New Public Link */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">4</span>
                <h5 className="font-bold text-gray-900 text-base">Regenerate New Public Link</h5>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                The orange refresh icon beside <strong>Save PNG</strong> regenerates the branch's booking token.
              </p>
              <ul className="text-xs space-y-2 text-gray-700 font-body list-disc pl-4">
                <li>
                  <strong>Regenerate Button:</strong> Click the orange refresh icon (<code className="text-xs bg-amber-50 px-1 py-0.5 rounded text-amber-800">🔄</code>) beside the Save PNG button, then click <strong>Generate New QR</strong> in the confirmation window.
                </li>
                <li>
                  <strong>The address stays the same:</strong> The booking URL shown on the card is built from your clinic's short name, so the URL and the QR code <strong>do not change</strong> after you regenerate, and codes you have already printed keep working.
                </li>
                <li>
                  <strong>To stop bookings:</strong> Switch <strong>Public Access</strong> off for the branch. Visitors then see that the page is unavailable until you switch it back on.
                </li>
              </ul>
            </div>
          </div>

          <DocCallout type="tip">
            Print the downloaded QR code PNG in high quality and place it at your front desk. Patients waiting in the reception lounge can scan the code with their smartphone camera to schedule follow-up visits without staff intervention.
          </DocCallout>

          <DocCallout type="info" title="About the regenerate message">
            After you regenerate, the screen may say the old QR code is no longer valid. In practice the booking address and QR code stay the same and your printed codes continue to work. Use <strong>Public Access</strong> to close online booking.
          </DocCallout>

          <div className="mt-8 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot24_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 24.2: Clinic Link Portal Page Display"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 24.3 — Share Your Link and QR Code */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        24.3 Sharing Your Booking Link and QR Code
      </h3>
      <p className="text-gray-700 font-body mb-6">Put your booking link where patients already look for you.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Each branch has its own booking link and QR code. Share the one for the branch you want patients to book at.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Online: use the link</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li>Your <strong>website:</strong> add a <em>Book Online</em> button or menu link that opens the booking URL.</li>
                <li><strong>Social media:</strong> paste the link in your Facebook or Instagram profile, or in a post announcing online booking.</li>
                <li><strong>Messages and email:</strong> add the link to message templates and to your email signature.</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Offline: use the QR code</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li>Click <strong>Save PNG</strong> to download the print-ready card (a 1080×1350 image).</li>
                <li>Print it for the front desk, the waiting area, the clinic entrance or window, flyers, appointment cards and posters.</li>
                <li>Patients scan it with their phone camera and land on the branch's booking page.</li>
              </ul>
            </div>
          </div>

          <DocCallout type="tip" title="Before you print or publish">
            Click <strong>Open</strong> on the branch card, or scan the QR code with your own phone, to check that it opens the right branch. Print the QR code at least 3 cm wide with a plain margin around it so that phone cameras can read it easily.
          </DocCallout>

          <DocCallout type="info">
            Links and QR codes do not expire. To pause online booking for a branch, switch its <strong>Public Access</strong> toggle off and back on when you are ready.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot24_3}
              width={1080}
              height={1350}
              decoding="async"
              loading="lazy"
              alt="Screenshot 24.3: Print-ready QR code card downloaded with Save PNG"
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
        In this chapter, you learned how to navigate and manage your clinic's self-service booking portal in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to navigate to <strong>Clinic Link Portal</strong> from the <strong>Clinical</strong> section of the <strong>Manage</strong> page.</li>
        <li>How to <strong>copy and share</strong> branch-specific public booking links across social media, SMS, and website platforms.</li>
        <li>How to <strong>download high-resolution QR codes as PNG</strong> posters ready for in-clinic display and patient self-check-in.</li>
        <li>How to <strong>enable or disable Public Access</strong> to control when online booking is available for each branch.</li>
        <li>What <strong>regenerating</strong> does, and that the booking address and printed QR codes stay the same.</li>
        <li>How to <strong>share your booking link and QR code</strong> on your website, social media and printed materials.</li>
      </ul>
    </>
  );
};

export default Chapter24;

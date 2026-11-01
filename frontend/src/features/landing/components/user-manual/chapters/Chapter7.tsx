import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot7_1 from '@/assets/manual/Chapter 7/Screenshot 7.1.webp';
import Screenshot7_2 from '@/assets/manual/Chapter 7/Screenshot 7.2.webp';
import Screenshot7_2_1 from '@/assets/manual/Chapter 7/Screenshot 7.2.1.webp';
import Screenshot7_3 from '@/assets/manual/Chapter 7/Screenshot 7.3.webp';
import Screenshot7_4 from '@/assets/manual/Chapter 7/Screenshot 7.4.webp';
import Screenshot7_5 from '@/assets/manual/Chapter 7/Screenshot 7.5.webp';

const Chapter7: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to install the Malasakit Clinic app on an Android phone, pair it with your clinic, read the connection status, switch or disconnect a phone, and fix common problems.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">SMS Gateway Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Your clinic's own Android phone and SIM card send the automated SMS messages. Malasakit tells the phone which messages to send, so setting it up once is all that is needed:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Gateway Setup Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">7.1 Gateway Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">7.2 Install the App</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">7.3 Pair the Phone</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">7.4 Check the Connection</span>
          </div>
        </div>
      </div>


      {/* SECTION 7.1 — The SMS Gateway Device Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        7.1 The SMS Gateway Device Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Where the clinic phone is paired and monitored.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Go to <strong>Setup</strong> and, in the <strong>Communication</strong> card, click <strong>SMS Gateway Device</strong>. The page shows whether a phone is paired and whether it is working.
          </p>

          <DocCallout type="info">
            The gateway app is available for <strong>Android</strong> only. Support for iPhone is not available yet.
          </DocCallout>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Under <strong>Recommended Device Setup</strong> the page lists three tips for a reliable gateway phone:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Keep the phone plugged in</strong> so it stays connected to a charger at the clinic.</li>
            <li><strong>Unrestricted battery:</strong> set the Malasakit app's battery usage to <em>Unrestricted</em> in Android settings so the system does not stop it.</li>
            <li><strong>Active SIM load:</strong> make sure the SIM has enough SMS credit or an unlimited text promo.</li>
          </ul>

          <DocCallout type="tip" title="Who can manage the gateway">
            The Owner and Branch Manager can pair, switch or disconnect a phone. By default Practitioner and Front Desk users can only view the page.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 7.1: SMS Gateway Device page with a paired phone online"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 7.2 — Installing the App */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.2 Installing the App
      </h3>
      <p className="text-gray-700 font-body mb-6">Put the Malasakit Clinic app on the clinic phone.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            When no phone is paired, the page shows <strong>No Android SMS Gateway Paired</strong> with three buttons: <strong>Install App (.apk)</strong>, <strong>Pair Malasakit App</strong> and <strong>Refresh</strong>.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.2: SMS Gateway Device page with no phone paired"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Install App (.apk)</strong>. The dialog offers a <strong>Download APK</strong> button and a QR code you can scan with the phone's camera to download the file straight onto the phone.
          </p>

          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Download and open the APK</strong> on the Android phone. When the download finishes, tap the notification or open the file in the <em>Files</em> or <em>Downloads</em> app.</li>
            <li><strong>Allow Install Unknown Apps.</strong> If Android warns about the file, tap <em>Download anyway</em> and allow installation from your browser or Files app.</li>
            <li><strong>Open the app and grant permissions</strong> for SMS (send and receive) and for the camera, which is used to scan the pairing code.</li>
          </ol>

          <DocCallout type="info" title="Privacy">
            The app does not ask for permission to read or write your contacts. Your clinic's and patients' contacts stay private.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_2_1}
              width={1120}
              height={1696}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.2.1: Install Malasakit Gateway App dialog"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 7.3 — Pairing the Phone */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.3 Pairing the Phone
      </h3>
      <p className="text-gray-700 font-body mb-6">Link the phone to your clinic with a QR code.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>On the web page, click <strong>Pair Malasakit App</strong>. A dialog shows a QR code and a manual code that looks like <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-800">MAL-AB12</code>.</li>
            <li>On the phone, open the <strong>Malasakit Clinic</strong> app and tap <strong>Scan QR Code</strong>. Point the camera at the QR code on the screen.</li>
            <li>If the camera is unavailable, tap <strong>Or Enter Code Manually</strong> in the app, type the pairing code, the server address and a device label such as <em>Front Desk Phone</em>, then tap <strong>Connect &amp; Pair Device</strong>.</li>
            <li>When pairing succeeds, the dialog closes and a message confirms that the app is paired.</li>
            <li>On the phone, tap <strong>Start Gateway</strong> so it begins sending messages.</li>
          </ol>

          <DocCallout type="warning" title="The code expires">
            The QR code and manual code are valid for 10 minutes. The dialog counts down the time left. If it runs out, click <strong>Generate New Code</strong>.
          </DocCallout>

          <DocCallout type="important" title="One phone for each branch">
            A phone is paired with the branch of the user who pairs it and sends only that branch's messages. A clinic with several branches needs one phone per branch, paired by a user assigned to that branch.
          </DocCallout>

          <DocCallout type="info">
            The pairing dialog says to tap <em>Link to Clinic</em>. In the app, the button to use is <strong>Scan QR Code</strong>.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_3}
              width={1120}
              height={1456}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.3: Pair Malasakit Clinic App dialog with QR code and manual code"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 7.4 — Checking the Connection */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.4 Checking the Connection
      </h3>
      <p className="text-gray-700 font-body mb-6">Read the status badge and the four tiles.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            A paired phone appears as a card with its name, model and a status badge:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Online &amp; Ready:</strong> the phone is connected and can send.</li>
            <li><strong>Degraded: Low Battery:</strong> the battery is at 15% or lower and the phone is not charging.</li>
            <li><strong>Offline:</strong> the phone has not contacted Malasakit for more than 2 minutes. The badge shows how long ago it was last seen.</li>
            <li><strong>No SIM Detected:</strong> the phone cannot find a SIM card.</li>
          </ul>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Four tiles give the details: <strong>SIM Carrier</strong>, <strong>Battery</strong> (including whether it is charging), <strong>Connection</strong> (when the phone last checked in; the page asks for an update every 15 seconds) and <strong>Software</strong> (app and Android version). The footer shows <strong>Last SMS Sent</strong>, the time of the most recent message. Click <strong>Refresh</strong> to update the card at any time.
          </p>

          <DocCallout type="tip" title="Test from the phone">
            In the app's settings, <strong>Ping Server / Test Heartbeat</strong> checks the connection and reports how many messages are waiting.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_4}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.4: Gateway phone shown as offline"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 7.5 — Switching or Disconnecting a Phone */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        7.5 Switching or Disconnecting a Phone
      </h3>
      <p className="text-gray-700 font-body mb-6">Replace the clinic phone or stop using it.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Switch Device</strong> to pair a new phone. The new phone replaces the old one, which stops sending messages.
          </p>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Disconnect</strong> to remove the phone. A dialog shows the phone's name, carrier and number and warns that it will immediately lose authorization to send. Click <strong>Disconnect Device</strong> to confirm or <strong>Keep Device</strong> to cancel. Messages meant for the phone wait in a queue until a phone is paired again.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot7_5}
              width={992}
              height={947}
              decoding="async"
              loading="lazy"
              alt="Screenshot 7.5: Disconnect Gateway Device dialog"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <h4 className="text-lg font-semibold text-gray-900 mb-3">Troubleshooting</h4>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Offline:</strong> check that the phone is switched on, has internet access, is plugged in and that the app shows <em>Stop Gateway</em> (meaning it is running). Then click <strong>Refresh</strong>.</li>
            <li><strong>Degraded: Low Battery:</strong> plug the phone in and set the app's battery usage to Unrestricted.</li>
            <li><strong>No SIM Detected:</strong> check that the SIM is inserted and enabled in the phone's settings.</li>
            <li><strong>The code expired or pairing failed:</strong> click <strong>Generate New Code</strong> and scan again.</li>
          </ul>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to set up and monitor the clinic's SMS gateway phone. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to open <strong>SMS Gateway Device</strong> from <strong>Setup &gt; Communication</strong>.</li>
        <li>How to <strong>install the Android app</strong> and grant its permissions.</li>
        <li>How to <strong>pair the phone</strong> with the QR code or the manual code before it expires.</li>
        <li>How to read the <strong>status badge</strong> and the SIM, battery, connection and software tiles.</li>
        <li>How to <strong>switch or disconnect</strong> a phone and what to check when it goes offline.</li>
      </ul>
    </>
  );
};

export default Chapter7;

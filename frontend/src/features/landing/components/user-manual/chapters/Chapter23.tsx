import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot23_1 from '@/assets/manual/Chapter 23/Screenshot 23.1.webp';
import Screenshot23_2 from '@/assets/manual/Chapter 23/Screenshot 23.2.webp';
import Screenshot23_4 from '@/assets/manual/Chapter 23/Screenshot 23.4.webp';
import Screenshot23_5 from '@/assets/manual/Chapter 23/Screenshot 23.5.webp';
import Screenshot23_5_1 from '@/assets/manual/Chapter 23/Screenshot 23.5.1.webp';

const Chapter23: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how automated appointment messages work in Malasakit: how to switch them on, what is sent and when, how a patient can opt out, and how to check what was actually sent.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Automated Messages Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Malasakit sends appointment confirmations, reminders and follow-ups for you. A message is sent only when the right switches are on:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Setting Up Automated Messages</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">23.1 Clinic Switches</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">23.2 Communication Settings</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">23.3 What Is Sent</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">23.4 Patient Settings</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">23.5 Check What Was Sent</span>
          </div>
        </div>
      </div>


      {/* SECTION 23.1 — Switching Notifications On for the Clinic */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        23.1 Switching Notifications On for the Clinic
      </h3>
      <p className="text-gray-700 font-body mb-6">The master switches for email and SMS.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Go to <strong>Setup</strong> and click <strong>Locations</strong> in the <strong>Practice</strong> card.</li>
            <li>On your main branch, click <strong>Edit Details</strong>.</li>
            <li>Scroll to <strong>Notification Preferences</strong>.</li>
            <li>Tick <strong>Email Notifications</strong> and <strong>SMS Notifications</strong> as needed, then click <strong>Save Changes</strong>.</li>
          </ol>

          <DocCallout type="important" title="SMS needs three things">
            An SMS is sent only when (1) <strong>SMS Notifications</strong> is ticked here, (2) the patient's own <strong>SMS notifications</strong> switch is on (see 23.4), and (3) a clinic phone is paired and online. See the SMS Gateway chapter for the phone.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot23_1}
              width={1408}
              height={1866}
              decoding="async"
              alt="Screenshot 23.1: Notification Preferences in the Edit Branch dialog"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 23.2 — Automated Communication Settings */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        23.2 Automated Communication Settings
      </h3>
      <p className="text-gray-700 font-body mb-6">Choose which messages go out and how.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Go to <strong>Setup &gt; Communication &gt; Settings</strong>. At the top, a card shows the paired gateway phone and its status. Below it, each message type has an on/off switch. Changes save as you click; the page briefly shows <em>Saving...</em> and then <em>Settings saved</em>.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Booking Confirmations:</strong> sent when an appointment is booked. Choose the <strong>Delivery Channel</strong>: Email, SMS or Both.</li>
            <li><strong>Appointment Reminders:</strong> reminds patients before their appointment and lets them reply Y to confirm or N if they cannot attend. Choose the <strong>Delivery Channel</strong>. A <strong>Reminder Timing</strong> box (hours before the appointment) is also shown.</li>
            <li><strong>DNA / Decline Follow-up:</strong> sends a link to reschedule after a missed or declined appointment.</li>
            <li><strong>No-Rebook Follow-up</strong> and <strong>Inactive Patient Wellness Check-in:</strong> follow-up options for patients who have not rebooked and for patients who have not visited for a while, with a delay in days or months.</li>
          </ul>

          <DocCallout type="info">
            The settings of a message type appear when its switch is on and you click its row to open it.
          </DocCallout>

          <DocCallout type="warning" title="Check the Logs">
            The daily reminder is sent every morning at 8:00 AM for the next day's appointments and does not change with the <strong>Reminder Timing</strong> box. The follow-up options are sent by scheduled jobs, so check the <strong>Logs</strong> page (see 23.5) to confirm they are going out for your clinic.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot23_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 23.2: Automated Communication Settings"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 23.3 — What Is Sent and When */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        23.3 What Is Sent and When
      </h3>
      <p className="text-gray-700 font-body mb-6">The messages patients receive.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Before the appointment</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Booking confirmation:</strong> sent when staff book an appointment. A patient who books online also receives a confirmation email.</li>
                <li><strong>Reminder:</strong> every morning at 8:00 AM, for appointments the next day, by email and, with SMS on, by SMS from the clinic phone.</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Changes and missed visits</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Cancellation:</strong> when staff cancel an appointment the patient receives an email. When a patient cancels with the link in a message, the clinic phone sends an SMS.</li>
                <li><strong>Rescheduling:</strong> when a patient picks a new time with the rebooking link, the clinic phone sends an SMS about the change.</li>
                <li><strong>Missed appointment (DNA):</strong> marking an appointment DNA, or a patient replying N to a reminder, sends a follow-up with a link to choose a new time.</li>
              </ul>
            </div>
          </div>

          <DocCallout type="tip" title="Patient replies">
            A patient who replies <strong>Y</strong> to a reminder confirms the appointment, and <strong>N</strong> declines it. The reply is saved with the appointment.
          </DocCallout>

          <DocCallout type="info">
            The wording of each message is fixed by Malasakit. You choose whether a message is sent and, for confirmations and reminders, by which channel.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 23.4 — A Patient's Notification Settings */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        23.4 A Patient's Notification Settings
      </h3>
      <p className="text-gray-700 font-body mb-6">Let a patient opt out of email or SMS.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Open the patient and click <strong>Settings</strong> in the patient's left menu. The <strong>Notification Settings</strong> card has switches for <strong>Email notifications</strong> and <strong>SMS notifications</strong>. <strong>Push notifications</strong> is marked <em>Coming soon</em>. Click <strong>Save Changes</strong> after changing a switch.
          </p>

          <DocCallout type="important">
            If a patient's switch is off, they do not receive that kind of message, even when the clinic switch is on.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot23_4}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 23.4: Notification Settings on the patient's Settings page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 23.5 — Checking What Was Sent */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        23.5 Checking What Was Sent
      </h3>
      <p className="text-gray-700 font-body mb-6">The Logs page and the patient's Communication History.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Go to <strong>Setup &gt; Communication &gt; Logs</strong>. The summary cards show <strong>Total Sent</strong>, <strong>Delivered</strong>, <strong>Failed</strong> and <strong>Replied</strong>. Use the search box and the <strong>All Types</strong>, <strong>Channel</strong> and <strong>Status</strong> filters, then click a patient to read the messages sent to them.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot23_5}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 23.5: Communication Logs"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            A patient's own <strong>Communication History</strong> (in the patient's left menu) is a shorter list. It shows reminder replies and missed-appointment follow-ups with their outcome, such as <em>Confirmed</em>, <em>Cancelled</em> or <em>Rescheduled</em>. You can filter it by time and by status.
          </p>

          <DocCallout type="info">
            Use <strong>Logs</strong> to see every message sent by the clinic. The patient's Communication History shows outcomes, not every message.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot23_5_1}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 23.5.1: Communication History in the patient profile"
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
        In this chapter, you learned how automated messages work in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to switch <strong>Email and SMS notifications</strong> on for the clinic.</li>
        <li>How to use <strong>Automated Communication Settings</strong>.</li>
        <li>Which messages are sent, and <strong>when</strong>.</li>
        <li>How a patient's <strong>notification settings</strong> affect what they receive.</li>
        <li>How to check messages in <strong>Logs</strong> and the patient's <strong>Communication History</strong>.</li>
      </ul>
    </>
  );
};

export default Chapter23;

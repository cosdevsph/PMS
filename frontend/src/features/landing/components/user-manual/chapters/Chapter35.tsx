import React from 'react';
import { DocCallout } from '../DocCallout';
import { ScreenshotPlaceholder } from '../ScreenshotPlaceholder';

const Chapter35: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        A quick-reference knowledge base providing concise, practical solutions to common questions encountered by clinic staff and administrators.
      </p>

      {/* SECTION 35.1 — Overview */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        35.1 Overview
      </h3>
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            This chapter serves as the primary troubleshooting hub for the Malasakit Practice Management System. It is designed to provide immediate answers to the most frequently asked questions without requiring users to search through the entire manual. 
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Each entry provides a concise solution alongside a reference link directing you to the appropriate chapter if you require a more detailed technical explanation.
          </p>
          
          <DocCallout type="info" title="Quick Help">
            Always check this FAQ section before contacting your system administrators or technical support. The vast majority of daily operational questions can be resolved immediately using these guides.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 35.2 — Account & Login Questions */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.2 Account & Login Questions
      </h3>

      <div className="space-y-4 mb-8">
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q1: I forgot my password.
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">You can easily reset your password securely from the login screen:</p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
              <li>Navigate to the Malasakit Login screen.</li>
              <li>Click the <strong>Forgot Password?</strong> link below the login form.</li>
              <li>Enter your registered email address to receive a secure recovery link.</li>
              <li>Follow the instructions in the email to create a new password.</li>
            </ol>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-3" className="hover:underline">Chapter 3 — Signing In</a></p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q2: I didn't receive my OTP (One-Time Password).
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">If your verification code has not arrived, consider these common causes:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Email Delay:</strong> Corporate email servers occasionally delay automated messages by a few minutes.</li>
              <li><strong>Spam Folder:</strong> Check your Junk or Spam folders, as strict email filters may misclassify the alert.</li>
              <li><strong>Incorrect Email:</strong> Ensure the email address entered exactly matches your registered account.</li>
            </ul>
            <p className="text-gray-700 mb-4">If you still haven't received it after 5 minutes, click the <strong>Resend Code</strong> button on the verification screen.</p>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-34" className="hover:underline">Chapter 34 — Security</a></p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q3: Why can't I log in?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Login failures generally occur due to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>An incorrect password (ensure Caps Lock is off).</li>
              <li>An incorrect or misspelled email address.</li>
              <li>An inactive or suspended user account.</li>
              <li>Attempting to use an expired staff invitation link.</li>
            </ul>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-3" className="hover:underline">Chapter 3 — Signing In</a></p>
          </div>
        </details>
      </div>
      
      <ScreenshotPlaceholder label="Screenshot 35.1: Sign In and Forgot Password Screen." />


      {/* SECTION 35.3 — Appointments */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.3 Appointments
      </h3>

      <div className="space-y-4 mb-8">
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q1: Why can't I book an appointment?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">The system prevents bookings when availability conditions are not met. Check the following:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>The practitioner's Duty Hours are not configured for that specific day.</li>
              <li>There is a scheduling conflict with an existing appointment.</li>
              <li>The practitioner is explicitly marked as unavailable (e.g., on leave).</li>
              <li>The selected clinic branch is closed during the requested time.</li>
            </ul>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-16" className="hover:underline">Chapter 16 — Creating Appointments</a></p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q2: Why is the appointment marked as DNA?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">DNA stands for "Did Not Attend." An appointment is marked as DNA when the scheduled time has passed and the patient failed to arrive or officially cancel the session. This status preserves the booking history for analytical purposes rather than deleting the record entirely.</p>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-18" className="hover:underline">Chapter 18 — Appointment Management</a></p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q3: Why can't I select a specific practitioner?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Practitioners will only appear in dropdown menus if they are explicitly assigned to the clinic branch you are currently viewing. If a practitioner works at Branch A, they will not be selectable when booking an appointment at Branch B.</p>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-10" className="hover:underline">Chapter 10 — Practitioner Profiles</a></p>
          </div>
        </details>
      </div>

      <ScreenshotPlaceholder label="Screenshot 35.2: Appointment Booking Screen." />


      {/* SECTION 35.4 — Clinical Notes */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.4 Clinical Notes
      </h3>

      <div className="space-y-4 mb-8">
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q1: Why can't I edit a Clinical Note?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">You may not have the required role permissions (e.g., you are logged in as Front Desk). Alternatively, if the note was finalized and marked as "Completed" by the author, it becomes a permanent legal medical record and can no longer be edited.</p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q2: Why isn't my Clinical Note appearing in the appointment?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">The note may have been created independently in the Patient Timeline without being explicitly linked to the specific appointment session. Ensure you select the correct appointment session from the dropdown when creating the note.</p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q3: Can multiple Clinical Notes exist for one appointment?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Yes. Malasakit allows multiple distinct clinical notes (e.g., a triage note and a final consultation note) to be linked to a single appointment session.</p>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-21" className="hover:underline">Chapter 21 — Clinical Notes</a></p>
          </div>
        </details>
      </div>

      <ScreenshotPlaceholder label="Screenshot 35.3: Appointment with Clinical Notes." />


      {/* SECTION 35.5 — Billing & Payments */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.5 Billing & Payments
      </h3>

      <div className="space-y-4 mb-8">
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q1: Why can't I generate an invoice?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Invoices in Malasakit are strictly linked to appointments. You must first create and save an appointment session before the system will allow you to generate an associated invoice.</p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q2: Why does the Invoice tab show "View Invoice" instead of "Generate Invoice"?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Malasakit enforces a strict one-to-one relationship between appointments and invoices. If the system detects that an invoice has already been generated for that specific appointment, the tab automatically transitions from "Generate" to "View" to prevent duplicate billing.</p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q3: Can invoices be regenerated?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Once generated, an invoice becomes a permanent financial record. If an error was made, you generally must void the original invoice (depending on clinic workflow) rather than simply "regenerating" a replacement over the original.</p>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-23" className="hover:underline">Chapter 23 — Invoices</a></p>
          </div>
        </details>
      </div>

      <ScreenshotPlaceholder label="Screenshot 35.4: Invoice Page." />


      {/* SECTION 35.6 — Notifications */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.6 Notifications
      </h3>

      <div className="space-y-4 mb-8">
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q1: Why didn't a patient receive an appointment reminder?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">If an automated communication failed to deliver, check the following:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>The patient's profile is missing a valid email address or mobile number.</li>
              <li>The patient explicitly opted out of communications in their profile settings.</li>
              <li>Automated reminders are globally disabled in the System Preferences.</li>
            </ul>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-31" className="hover:underline">Chapter 31 — Automated Communication</a></p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q2: Why am I not receiving Notifications?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Notifications are filtered via Role-Based Access Control. If you are a Manager assigned exclusively to Branch A, the system will intentionally not send you notifications for events occurring at Branch B.</p>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-30" className="hover:underline">Chapter 30 — Notifications</a></p>
          </div>
        </details>
      </div>

      <ScreenshotPlaceholder label="Screenshot 35.5: Notifications Page." />


      {/* SECTION 35.7 — Subscription */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.7 Subscription
      </h3>

      <div className="space-y-4 mb-8">
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q1: Why can't I create another practitioner?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">You have likely reached the maximum number of allowed practitioners for your current subscription tier. You will need to upgrade your subscription plan to expand your staff capacity.</p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q2: Why can't I add another clinic branch?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Similar to practitioners, clinic branches are limited by your active plan. Check the usage progress bars on the Subscription page to confirm if you have reached your plan's maximum branch allocation.</p>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-32" className="hover:underline">Chapter 32 — Subscription</a></p>
          </div>
        </details>
      </div>

      <ScreenshotPlaceholder label="Screenshot 35.6: Subscription Usage." />


      {/* SECTION 35.8 — Security */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.8 Security
      </h3>

      <div className="space-y-4 mb-8">
        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q1: Why can't I access a Setup page?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">Malasakit enforces strict Role-Based Access Control (RBAC). If your assigned user role (e.g., Front Desk) does not have explicit authorization to view administrative or configuration settings, the system will actively block your access to those pages.</p>
          </div>
        </details>

        <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
          <summary className="p-5 font-bold text-gray-900 cursor-pointer bg-gray-50 group-open:bg-sky-50 group-open:text-sky-900 transition-colors">
            Q2: Why does the system automatically log me out?
          </summary>
          <div className="p-5 border-t border-gray-200">
            <p className="text-gray-700 mb-4">For security and HIPAA compliance purposes, Malasakit actively monitors user sessions. If the system detects a prolonged period of inactivity, it automatically terminates the session to protect sensitive patient data from unauthorized access on unattended computers.</p>
            <p className="text-sm text-sky-700 font-semibold">Reference: <a href="#chapter-34" className="hover:underline">Chapter 34 — Security</a></p>
          </div>
        </details>
      </div>

      <ScreenshotPlaceholder label="Screenshot 35.7: Access Denied Page." />


      {/* SECTION 35.9 — Troubleshooting Tips */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.9 Troubleshooting Tips
      </h3>
      <p className="text-gray-700 font-body mb-6">A quick checklist before contacting support.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ul className="space-y-3 text-gray-700 font-body">
            <li className="flex items-start">
              <span className="text-emerald-500 mr-3 mt-0.5 font-bold">✔</span>
              <span><strong>Refresh the page:</strong> Sometimes a simple browser refresh clears temporary glitches.</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-3 mt-0.5 font-bold">✔</span>
              <span><strong>Verify internet connectivity:</strong> Ensure your device has a stable connection to the server.</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-3 mt-0.5 font-bold">✔</span>
              <span><strong>Check browser compatibility:</strong> Ensure you are using an updated, supported web browser (like Chrome or Safari).</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-3 mt-0.5 font-bold">✔</span>
              <span><strong>Clear browser cache:</strong> Outdated cached data can sometimes interfere with system updates.</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-3 mt-0.5 font-bold">✔</span>
              <span><strong>Confirm account permissions:</strong> Ensure your role actually allows you to perform the action.</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-3 mt-0.5 font-bold">✔</span>
              <span><strong>Verify branch assignment:</strong> Ensure you are operating within the correct clinic location.</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-3 mt-0.5 font-bold">✔</span>
              <span><strong>Ensure practitioner availability:</strong> Verify duty hours if an appointment cannot be booked.</span>
            </li>
          </ul>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-gray-700 font-semibold">Contact the clinic administrator if the issue persists after running through this checklist.</p>
          </div>
        </div>
      </div>

      <DocCallout type="tip">
        Recommend using the <strong>Search</strong> feature within the User Manual navigation sidebar to quickly locate relevant documentation before escalating a ticket to support.
      </DocCallout>


      {/* SECTION 35.10 — Need More Help? */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        35.10 Need More Help?
      </h3>

      <div className="space-y-8">
        <div className="bg-sky-50 rounded-2xl border border-sky-200 p-6 md:p-8">
          <p className="text-sky-900 font-body leading-relaxed mb-6">
            If you cannot find the answer to your specific issue within this FAQ, we recommend the following escalation path:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-sky-800 font-body mb-6">
            <li><strong>Review the Manual:</strong> Navigate to the relevant User Manual chapter for a deep dive into the module's workflows.</li>
            <li><strong>Internal Support:</strong> Contact your Clinic Owner or local System Administrator to verify your permissions or branch assignments.</li>
            <li><strong>Technical Support:</strong> If the issue appears to be a bug or system failure, contact the official Malasakit Support Team for technical resolution.</li>
          </ol>

          <ScreenshotPlaceholder label="Screenshot 35.8: User Manual Search Bar and Table of Contents." />
        </div>
      </div>

    </>
  );
};

export default Chapter35;

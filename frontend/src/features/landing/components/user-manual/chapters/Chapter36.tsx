import React from 'react';
import { DocCallout } from '../DocCallout';
import { ScreenshotPlaceholder } from '../ScreenshotPlaceholder';

const Chapter36: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        A structured guide to help clinic staff identify the cause of common problems and follow recommended recovery steps before escalating to technical support.
      </p>

      {/* SECTION 36.1 — Overview */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        36.1 Overview
      </h3>
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Even within a stable enterprise system like Malasakit, users may occasionally encounter issues. The vast majority of these problems are not system failures, but rather the result of configuration errors, strict permission constraints, temporary browser caching, or brief internet connectivity interruptions.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            This chapter provides step-by-step diagnostic and recovery procedures for the most common operational roadblocks encountered during daily clinic workflows.
          </p>
          
          <DocCallout type="info" title="Before Contacting Support">
            Before submitting a technical support ticket, we strongly recommend you:
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Refresh the page.</li>
              <li>Verify your internet connection is stable.</li>
              <li>Confirm you are signed into the correct account.</li>
              <li>Review the related User Manual chapter.</li>
              <li>Check whether another authorized user in your clinic experiences the same issue.</li>
            </ul>
          </DocCallout>
        </div>
      </div>


      {/* SECTION 36.2 — Common Errors */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        36.2 Common Errors
      </h3>
      <p className="text-gray-700 font-body mb-6">Diagnosing general system roadblocks.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          
          <h4 className="text-lg font-bold text-gray-900 mb-2">Unable to Save Record</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> Required fields are incomplete, or the data entered fails specific validation rules (e.g., invalid phone number format).</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Review the form for any fields highlighted in red. Complete all mandatory information marked with an asterisk (*) and ensure data formats are correct before trying to save again.</p>

          <h4 className="text-lg font-bold text-gray-900 mb-2">Unexpected Error Message</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> A temporary server timeout, an expired user session, or a brief network interruption.</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Refresh the page. If the system logs you out, sign in again. Retry the exact operation.</p>

          <h4 className="text-lg font-bold text-gray-900 mb-2">Data Not Updating Visually</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> Your web browser is displaying cached (old) data, a background synchronization delay, or you navigated away before the system finished saving.</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Perform a hard refresh on your browser. Confirm the record was successfully saved by checking for the green success notification before closing a form.</p>

          <ScreenshotPlaceholder label="Screenshot 36.1: Example Validation or Error Message. Highlight: Validation warning, Required field indicator, Error notification." />
        </div>
      </div>


      {/* SECTION 36.3 — Permission Issues */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        36.3 Permission Issues
      </h3>
      <p className="text-gray-700 font-body mb-6">Understanding access restrictions.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          
          <h4 className="text-lg font-bold text-gray-900 mb-2">Cannot Access a Specific Page</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> Your assigned User Role (e.g., Front Desk) strictly forbids access to the module (e.g., Financial Reports), or you are trying to view data for a Branch you are not assigned to.</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Verify your assigned role and branch configuration. If you legitimately need access to perform your job, contact your Clinic Owner or Administrator to request a permissions update.</p>

          <h4 className="text-lg font-bold text-gray-900 mb-2">"Access Denied" Screen</h4>
          <p className="text-gray-700 mb-6"><strong>Explanation:</strong> Malasakit utilizes strict Role-Based Access Control (RBAC). When you encounter this screen, it means the server explicitly rejected your request to view the data to protect clinic privacy.</p>

          <ScreenshotPlaceholder label="Screenshot 36.2: Access Denied Page. Highlight: Access Denied message, Return to Dashboard button (if available)." />
          
          <DocCallout type="important">
            You cannot bypass permission restrictions by manually typing or copying URLs. The Malasakit backend verifies your permissions on every single request.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 36.4 — Booking Issues */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        36.4 Booking Issues
      </h3>
      <p className="text-gray-700 font-body mb-6">Resolving calendar and scheduling roadblocks.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          
          <h4 className="text-lg font-bold text-gray-900 mb-2">Unable to Book Appointment</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> The requested time falls outside the practitioner's configured duty hours, there is a scheduling conflict with another patient, or the clinic branch is marked as closed.</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Verify the practitioner's duty hours in their profile. Use the calendar to identify open slots, or select an alternative appointment time.</p>

          <h4 className="text-lg font-bold text-gray-900 mb-2">Online Booking Unavailable for Patients</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> Public booking is toggled off in Branch Settings, or all practitioners at that branch have fully booked schedules for the requested period.</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Have a Manager verify the branch booking settings and confirm that the public booking link is active.</p>

          <h4 className="text-lg font-bold text-gray-900 mb-2">Appointment Does Not Appear on Calendar</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> You have an active practitioner/branch filter applied that is hiding the appointment, you are viewing the wrong branch, or the calendar simply needs a refresh.</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Clear all calendar filters. Ensure you are viewing the correct branch. Refresh the calendar view.</p>

          <ScreenshotPlaceholder label="Screenshot 36.3: Calendar with Appointment Conflict. Highlight: Conflict warning, Occupied schedule, Practitioner availability." />
        </div>
      </div>


      {/* SECTION 36.5 — Sync Issues */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        36.5 Sync Issues
      </h3>
      <p className="text-gray-700 font-body mb-6">Handling browser and display discrepancies.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          
          <h4 className="text-lg font-bold text-gray-900 mb-2">Notifications Not Updating</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> Your browser has temporarily lost connection to the server, or there was a brief internet interruption.</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Refresh the page to force the browser to establish a fresh connection with the server.</p>

          <h4 className="text-lg font-bold text-gray-900 mb-2">Dashboard Statistics Look Incorrect</h4>
          <p className="text-gray-700 mb-2"><strong>Possible causes:</strong> The dashboard is displaying cached information, or massive background data updates are still pending processing.</p>
          <p className="text-gray-700 mb-6"><strong>Solution:</strong> Refresh the dashboard. Confirm that any recent invoices or appointments were successfully saved and finalized.</p>

          <ScreenshotPlaceholder label="Screenshot 36.4: Dashboard or Calendar Refresh. Highlight: Updated dashboard, Calendar synchronization, Notification refresh." />

          <DocCallout type="tip">
            We recommend keeping only one active Malasakit browser tab open when performing important administrative updates (like changing branch settings). Multiple open tabs can sometimes lead to confusion caused by stale cached data.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 36.6 — Recovery Steps */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        36.6 Universal Recovery Steps
      </h3>
      <p className="text-gray-700 font-body mb-6">A checklist to run before requesting technical assistance.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body">
            <li>Save any unsaved work (or copy text you don't want to lose).</li>
            <li>Refresh the current browser page.</li>
            <li>Verify your internet connectivity by opening a new website.</li>
            <li>Sign out of Malasakit and sign back in.</li>
            <li>Clear your browser cache if the issue involves visual display errors.</li>
            <li>Confirm your user permissions allow the action you are trying to perform.</li>
            <li>Verify you are operating within the correct clinic branch.</li>
            <li>Review the relevant User Manual chapter to ensure you are following the correct workflow.</li>
            <li>Retry the exact operation carefully.</li>
            <li>Contact your clinic administrator if the issue persists after all above steps.</li>
          </ol>

          <ScreenshotPlaceholder label="Screenshot 36.5: Browser Refresh or User Menu. Highlight: Refresh action, User profile menu, Logout option." />
        </div>
      </div>


      {/* SECTION 36.7 — Preventing Common Issues */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        36.7 Preventing Common Issues
      </h3>
      
      <DocCallout type="tip" title="Proactive Maintenance">
        Regularly reviewing clinic settings can prevent many operational issues before they occur. We recommend that administrators:
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Keep practitioner duty hours updated well in advance.</li>
          <li>Regularly audit staff permissions.</li>
          <li>Monitor subscription limits (like maximum practitioners) proactively.</li>
          <li>Keep web browsers updated to the latest versions.</li>
          <li>Always log out completely after using shared front-desk computers.</li>
        </ul>
      </DocCallout>


      {/* SECTION 36.8 — When to Contact Support */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        36.8 When to Contact Support
      </h3>

      <div className="space-y-8">
        <div className="bg-sky-50 rounded-2xl border border-sky-200 p-6 md:p-8">
          <p className="text-sky-900 font-body leading-relaxed mb-6">
            If an issue persists after performing the universal recovery steps, it may require technical escalation. You should contact official Malasakit Support when you experience:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sky-800 font-body mb-6">
            <li>Repeated system "Server 500" errors.</li>
            <li>Complete login failures even after successfully resetting your password.</li>
            <li>Data appearing completely missing after a confirmed successful save.</li>
            <li>Technical issues affecting multiple users across different devices simultaneously.</li>
            <li>Persistent and unexplainable synchronization failures.</li>
          </ul>
          
          <p className="text-sky-900 font-body font-bold mt-8 mb-4">What to include in your support ticket:</p>
          <ul className="list-disc pl-6 space-y-2 text-sky-800 font-body mb-6">
            <li>The exact wording of the error message.</li>
            <li>A full-screen screenshot showing the error and the URL.</li>
            <li>The date and time the issue occurred.</li>
            <li>The exact steps you performed immediately before the issue occurred.</li>
          </ul>

          <ScreenshotPlaceholder label="Screenshot 36.6: Example Error with Browser Console. Highlight: Visible error message, Browser interface, Context of the issue." />
        </div>
      </div>

    </>
  );
};

export default Chapter36;

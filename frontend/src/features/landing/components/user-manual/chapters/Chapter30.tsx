import React from 'react';
import { DocCallout } from '../DocCallout';
import { ScreenshotPlaceholder } from '../ScreenshotPlaceholder';

const Chapter30: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to monitor important activities occurring throughout the system using the centralized Notifications page.
      </p>

      {/* SECTION 30.1 — Overview */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        30.1 Overview
      </h3>
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The Notifications page provides a centralized activity feed that helps users stay informed about important events occurring within the clinic. Rather than constantly checking individual modules like the Calendar or Patient list, staff can monitor a single unified feed.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Notifications are generated automatically by the system and are securely filtered to match the logged-in user's role and assigned clinic branches. This ensures that a Manager for Branch A only sees notifications relevant to their specific operational jurisdiction.
          </p>
        </div>
      </div>

      <DocCallout type="info">
        Notifications help clinic staff monitor important activities globally without needing to manually check every individual module.
      </DocCallout>


      {/* SECTION 30.2 — New Appointments */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.2 New Appointments
      </h3>
      <p className="text-gray-700 font-body mb-6">Tracking scheduling activity across the clinic.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The system automatically generates a notification whenever a new appointment is booked. This covers bookings originating from all sources, including Front Desk bookings, Practitioner-created appointments, Online Bookings, or Admin-created sessions.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Each notification displays critical summary information so staff can rapidly assess the booking:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Patient Name</strong></li>
            <li><strong>Practitioner</strong> & <strong>Clinic Branch</strong></li>
            <li><strong>Appointment Date & Time</strong></li>
            <li><strong>Appointment Type / Service</strong></li>
          </ul>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Clicking directly on the notification card will immediately navigate you to the related Appointment Details view.
          </p>

          <ScreenshotPlaceholder label="Screenshot 30.1: Notifications page showing newly created appointment notifications. Highlight: Appointment notification cards, Patient name, Date and time, Appointment icon, Timestamp." />
        </div>
      </div>


      {/* SECTION 30.3 — New Clients */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.3 New Clients
      </h3>
      <p className="text-gray-700 font-body mb-6">Monitoring patient acquisition and registrations.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To help front desk and management teams track clinic growth, the system alerts users whenever a new patient profile is successfully created in the registry. 
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            These alerts capture all registration vectors, including manual front-desk entry, patient self-registration via the Online Booking portal, and bulk data imports (if enabled). The notification explicitly displays the patient's name, the registration date, and the primary branch they were assigned to upon creation. Clicking the notification opens their full patient profile.
          </p>

          <ScreenshotPlaceholder label="Screenshot 30.2: Notification generated after registering a new patient. Highlight: New Client notification, Patient name, Registration timestamp." />
        </div>
      </div>


      {/* SECTION 30.4 — Online Bookings */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.4 Online Bookings
      </h3>
      <p className="text-gray-700 font-body mb-6">Tracking self-service patient appointments.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            When a patient independently books an appointment through the public-facing Patient Portal, an immediate notification is pushed to the clinic dashboard. 
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            This notification highlights the Patient, Practitioner, Branch, and Schedule, and explicitly notes that the <strong>Booking Channel</strong> was "Online." It is essential that clinic staff review these notifications promptly to ensure the self-service bookings align with clinical availability and that any required pre-appointment follow-ups are handled correctly.
          </p>

          <ScreenshotPlaceholder label="Screenshot 30.3: Online Booking notification displayed in the Notifications page. Highlight: Online Booking icon, Patient name, Appointment date, Branch name." />
        </div>
      </div>


      {/* SECTION 30.5 — System Notifications */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.5 System Notifications
      </h3>
      <p className="text-gray-700 font-body mb-6">Monitoring global operational events.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Beyond just appointments and registrations, Malasakit tracks an array of critical system events to maintain a comprehensive activity ledger. The system may generate notifications for events such as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Financial:</strong> Invoice Generated, Payment Recorded</li>
            <li><strong>Scheduling:</strong> Appointment Cancelled, Appointment Rescheduled</li>
            <li><strong>Clinical:</strong> Clinical Note Completed</li>
            <li><strong>Tasks:</strong> Reminder Completed</li>
          </ul>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            As new operational features are added to Malasakit, the variety of these system-generated alerts will continue to expand.
          </p>

          <ScreenshotPlaceholder label="Screenshot 30.4: System-generated notifications list. Highlight: Several different notification types in a single activity feed." />
        </div>
      </div>


      {/* SECTION 30.6 — Notification Timeline */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.6 Notification Timeline
      </h3>
      <p className="text-gray-700 font-body mb-6">Interpreting the chronological activity feed.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            All items on the Notifications page are strictly ordered chronologically, creating a live timeline of clinic activity. The most recent events always appear at the very top of the feed.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Each entry includes a precise relative timestamp (e.g., "5 minutes ago", "2 hours ago"), allowing staff to quickly determine the exact sequencing and recency of operational events.
          </p>

          <ScreenshotPlaceholder label="Screenshot 30.5: Notification timeline sorted by most recent activity." />
        </div>
      </div>


      {/* SECTION 30.7 — Notification Status */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.7 Notification Status
      </h3>
      <p className="text-gray-700 font-body mb-6">Managing read and unread alerts.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To help users manage their attention, notifications exist in one of two states: <strong>Unread</strong> or <strong>Read</strong>. 
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Unread notifications are visibly highlighted and directly contribute to the numerical notification badge displayed persistently in the global navigation bar. Once a user reviews the notification, marking it as read will clear it from the unread counter, helping staff maintain a clean "inbox zero" approach to system alerts.
          </p>

          <ScreenshotPlaceholder label="Screenshot 30.6: Unread notification badge displayed in the navigation bar." />
        </div>
      </div>


      {/* SECTION 30.8 — Best Practices */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.8 Best Practices
      </h3>
      
      <DocCallout type="tip" title="Operational Tips">
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Review regularly:</strong> Check the notifications feed multiple times throughout the day.</li>
          <li><strong>Prioritize Online Bookings:</strong> Check online booking alerts promptly to prevent sudden schedule conflicts.</li>
          <li><strong>Verify Registrations:</strong> Double-check new patient registrations to ensure demographics were entered accurately.</li>
          <li><strong>Morning Routine:</strong> Monitor appointment cancellations and reschedules first thing before the clinic formally opens.</li>
          <li><strong>Stay Organized:</strong> Keep your feed clean by marking items as read immediately after reviewing them.</li>
        </ul>
      </DocCallout>

    </>
  );
};

export default Chapter30;

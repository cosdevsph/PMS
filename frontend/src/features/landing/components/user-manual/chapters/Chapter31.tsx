import React from 'react';
import { DocCallout } from '../DocCallout';
import { ScreenshotPlaceholder } from '../ScreenshotPlaceholder';

const Chapter31: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how Malasakit automatically communicates with patients throughout the entire appointment lifecycle, from booking confirmations to wellness follow-ups.
      </p>

      {/* SECTION 31.1 — Overview */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        31.1 Overview
      </h3>
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The Automated Communication system ensures patients stay informed and engaged without requiring constant manual intervention from your staff. Malasakit sends scheduled notifications to patients at critical points throughout their healthcare journey.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Depending on your clinic's configuration, these communications may be delivered via <strong>Email</strong>, <strong>SMS</strong>, or both. Leveraging these automations helps reduce missed appointments, improve patient attendance, and significantly increase overall clinic efficiency.
          </p>
          
          <DocCallout type="info" title="How Automated Communication Works">
            Communication is triggered automatically based on specific appointment events (like booking or cancelling) and clinic-configured schedules (like sending a reminder 24 hours prior). This effectively eliminates the need for front-desk staff to perform manual follow-ups in most situations.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 31.2 — Appointment Confirmations */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        31.2 Appointment Confirmations
      </h3>
      <p className="text-gray-700 font-body mb-6">Reassuring patients their slot is secured.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Immediately after an appointment is successfully booked—whether via the Online Booking Portal, the Front Desk, Practitioner staff, or a System Administrator—Malasakit automatically dispatches a confirmation message.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            This confirmation provides the patient with critical scheduling details to prevent confusion:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Patient Name</strong> & <strong>Practitioner</strong></li>
            <li><strong>Clinic Branch</strong> (with location details)</li>
            <li><strong>Appointment Date & Time</strong></li>
            <li><strong>Appointment Type</strong></li>
            <li><strong>Booking Reference</strong> (if applicable)</li>
          </ul>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            For <em>recurring appointments</em>, the confirmation message will also explicitly list out the full recurring schedule so the patient can add all future dates to their personal calendar.
          </p>

          <ScreenshotPlaceholder label="Screenshot 31.1: Appointment Confirmation Notification. Highlight: Newly booked appointment, Confirmation email or SMS preview, Patient name, Appointment details, Recurring schedule (if applicable)." />
        </div>
      </div>


      {/* SECTION 31.3 — Appointment Reminders */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        31.3 Appointment Reminders
      </h3>
      <p className="text-gray-700 font-body mb-6">Reducing no-shows through timely alerts.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To drastically reduce the rate of missed appointments, Malasakit sends automated reminder messages prior to the scheduled session. The timing of these reminders is highly configurable; clinics commonly use <strong>24 Hours Before</strong>, <strong>12 Hours Before</strong>, or <strong>2 Hours Before</strong> the appointment.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            If your clinic has enabled <em>Attendance Confirmation</em>, these reminder messages may also include a link or prompt allowing the patient to explicitly confirm they will attend or to inform the clinic if they must decline/reschedule.
          </p>

          <ScreenshotPlaceholder label="Screenshot 31.2: Appointment Reminder Message. Highlight: Reminder notification, Appointment date and time, Practitioner, Clinic branch, Attendance confirmation instructions (if enabled)." />
        </div>
      </div>


      {/* SECTION 31.4 — DNA Follow-up */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        31.4 DNA (Did Not Attend) Follow-up
      </h3>
      <p className="text-gray-700 font-body mb-6">Re-engaging patients who missed their slot.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            If a patient Does Not Attend (DNA), cancels late, or formally declines attendance via a reminder link, Malasakit can trigger an automated follow-up communication designed to gently encourage the patient to reschedule.
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Clinics can configure a specific delay before this follow-up is sent (e.g., waiting 2 hours after the missed slot), select the preferred communication method, and include a branch-specific booking link to make rescheduling frictionless. This automation significantly improves patient retention while minimizing the manual phone calls front desk staff usually perform.
          </p>

          <ScreenshotPlaceholder label="Screenshot 31.3: DNA Follow-up Message. Highlight: Missed appointment notification, Friendly rescheduling message, 'Book Again' button or booking link." />
          
          <DocCallout type="important">
            Automated DNA follow-ups should always remain professional and supportive. The goal is to encourage patients to continue their care without creating unnecessary pressure or guilt regarding the missed appointment.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 31.5 — Wellness Check-ins */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        31.5 Wellness Check-ins
      </h3>
      <p className="text-gray-700 font-body mb-6">Reconnecting with inactive patients over time.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            To ensure long-term patient retention and encourage preventive care, Malasakit can automatically contact patients who have not visited the clinic for a configurable extended period. Common intervals include <strong>3 Months</strong> or <strong>6 Months</strong>, though you may configure a custom interval suited to your clinic's specialty (e.g., annual dental cleanings).
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            A typical wellness check-in message includes a personalized greeting, a gentle note mentioning the time since their last visit, an invitation to schedule another appointment, and a direct link to the clinic's online booking portal.
          </p>

          <ScreenshotPlaceholder label="Screenshot 31.4: Wellness Check-in Email or SMS. Highlight: Friendly follow-up message, Clinic branding, Booking button or booking link." />
        </div>
      </div>


      {/* SECTION 31.6 — Communication Settings */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        31.6 Communication Settings
      </h3>
      <p className="text-gray-700 font-body mb-6">Configuring how and when messages are sent.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Clinic Administrators retain full control over these automated behaviors through the Communication Settings panel. 
          </p>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            From here, administrators can toggle the specific <strong>Confirmation Method</strong> and <strong>Reminder Method</strong> (Email vs SMS), adjust the exact <strong>Reminder Timing</strong>, and define the <strong>DNA Follow-up Delay</strong> or <strong>Wellness Check-in Interval</strong>. These global settings apply across the clinic while intelligently respecting branch-specific variables (like routing patients to the correct branch's booking link).
          </p>

          <ScreenshotPlaceholder label="Screenshot 31.5: Automated Communication Settings. Highlight: Communication Settings page, Email/SMS options, Reminder timing, DNA follow-up settings, Wellness interval settings." />
        </div>
      </div>


      {/* SECTION 31.7 — Best Practices */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        31.7 Best Practices
      </h3>
      
      <DocCallout type="tip" title="Communication Tips">
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Keep reminder timing consistent:</strong> Strive for a predictable cadence, such as 24 hours prior to every appointment.</li>
          <li><strong>Always enable confirmations:</strong> Confirmations prevent basic scheduling errors from the moment a patient books.</li>
          <li><strong>Review settings periodically:</strong> Check your communication configurations quarterly to ensure they align with your clinic's current operational volume.</li>
          <li><strong>Customize wellness intervals:</strong> Base your check-in intervals on clinical necessity (e.g., 6 months for dental, 1 year for general checkups).</li>
          <li><strong>Verify contact info:</strong> Train front-desk staff to always verify that email addresses and mobile numbers are accurate upon patient arrival.</li>
          <li><strong>Test templates:</strong> Always test new communication templates internally before enabling live automation.</li>
        </ul>
      </DocCallout>

    </>
  );
};

export default Chapter31;

import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot20_1 from '@/assets/manual/Chapter 20/Screenshot 20.1.webp';
import Screenshot20_2 from '@/assets/manual/Chapter 20/Screenshot 20.2.webp';
import Screenshot20_3 from '@/assets/manual/Chapter 20/Screenshot 20.3.webp';
import Screenshot20_4 from '@/assets/manual/Chapter 20/Screenshot 20.4.webp';

const Chapter20: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how patients seamlessly schedule their own appointments through the self-service Clinic Online Booking portal—from choosing a practitioner and service to picking an available time slot and submitting verified booking details.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Clinic Online Booking Workflow</h3>
        <p className="text-gray-700 font-body mb-6">
          The public booking flow guides patients through four intuitive, sequential steps:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Patient Booking Journey</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">20.1 Choose Practitioner</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">20.2 Select Service</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">20.3 Pick Date & Time</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">20.4 Details & Confirm</span>
          </div>
        </div>
      </div>


      {/* SECTION 20.1 — Clinic Online Booking Selection of Practitioner */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        20.1 Clinic Online Booking Selection of Practitioner
      </h3>
      <p className="text-gray-700 font-body mb-6">Select the healthcare provider assigned to the clinic branch.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            When patients open your clinic's public booking link or scan the branch QR code, they are directed to the <strong>Choose Practitioner</strong> step. The left sidebar displays clinic contact details and a live progress tracker.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Practitioner Filtering & Search</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Search Field:</strong> Patients can filter clinicians instantly by typing their name or medical specialty.</li>
                <li><strong>Department Grouping:</strong> Practitioners are organized by specialty category (such as <em>Occupational Therapy</em>).</li>
                <li><strong>Branch Accuracy:</strong> Only practitioners actively assigned to the selected branch appear in the list.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Practitioner Card Details</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Profile Overview:</strong> Displays practitioner photo or avatar, full name, profession initials, and specialty tag.</li>
                <li><strong>Selection Action:</strong> Clicking the <strong>Select</strong> button marks the practitioner card and updates <em>Your Selection</em> in the sidebar.</li>
                <li><strong>Continue Button:</strong> Clicking <strong>Continue →</strong> advances the patient to the service selection step.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot20_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 20.1: Clinic Online Booking Selection of Practitioner"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 20.2 — Selecting Clinic Services */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        20.2 Selecting Clinic Services
      </h3>
      <p className="text-gray-700 font-body mb-6">Choose the consultation type, treatment package, or therapy service.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            In Step 3, <strong>Select a Service</strong>, patients browse the treatments and consultations associated with their chosen practitioner:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>
              <strong>Specialty Category Tag:</strong> A filter pill (e.g., <em>Occupational Therapy services</em>) highlights the relevant service catalog.
            </li>
            <li>
              <strong>Service Catalog Details:</strong> Each service card shows the complete service title (e.g. <em>Second Consultation</em>), clinical description, expected duration (e.g. <em>45 min</em>), and transparent pricing (e.g. <em>₱ 5,870</em>).
            </li>
            <li>
              <strong>Selection Feedback:</strong> Selecting a service marks it as <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-sky-100 text-sky-800 text-xs">✓ Selected</span> and immediately records it under <strong>Your Selection</strong> in the sidebar.
            </li>
            <li>
              <strong>Search & Navigation:</strong> Patients can use the <em>Search services...</em> input box to find specific services quickly, or click <strong>← Back</strong> to change their chosen practitioner.
            </li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot20_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 20.2: Selecting Clinic Services"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 20.3 — Picking Date and Time */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        20.3 Picking Date and Time
      </h3>
      <p className="text-gray-700 font-body mb-6">Browse live calendar availability and pick an open appointment slot.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            In Step 4, <strong>Pick Date & Time</strong>, the booking portal displays an interactive calendar calculated in real time against the practitioner's configured Duty Hours, split shifts, and existing bookings:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Monthly Calendar View</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Interactive Month Grid:</strong> Navigate forward or backward across calendar months.</li>
                <li><strong>Available Days:</strong> Working days with open openings are selectable; days with no practitioner duty hours are disabled.</li>
                <li><strong>Schedule Tag:</strong> Indicates schedule patterns such as <em>Split-shift schedule</em> or full-day coverage.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Time Slot Blocks</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Morning Slots:</strong> Available morning time chips (e.g. <em>8:00 AM – 11:15 AM</em>) based on session duration.</li>
                <li><strong>Protected Lunch Break:</strong> Displays a distinct banner (<em>12:00 PM – 1:00 PM · No appointments available</em>) preventing midday bookings.</li>
                <li><strong>Afternoon Slots:</strong> Available afternoon time chips (e.g. <em>1:00 PM – 4:15 PM</em>).</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Clicking a preferred time slot (e.g., <strong>9:45 AM</strong>) activates the confirmation bar below: <strong>Confirm — [Date] at [Time]</strong>. Clicking this button locks the time slot and proceeds to patient details.
          </p>

          <DocCallout type="info">
            Time slots are validated in real time. If another patient or staff member books the same slot simultaneously, Malasakit immediately detects the conflict and requests the patient select another time.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot20_3}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 20.3: Picking Date and Time"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 20.4 — Booking Details and Confirmation */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        20.4 Booking Details and Confirmation
      </h3>
      <p className="text-gray-700 font-body mb-6">Complete demographic intake, notes, legal consents, and finalize the appointment.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The final step, <strong>Your Booking Details</strong>, captures the patient's identity and clinical concerns while ensuring full compliance with clinic consent requirements:
          </p>

          <div className="space-y-4 mb-6">
            {/* Demographic Information */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">1. Patient Demographic Information</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 font-body">
                <div>
                  <strong>Email Address *:</strong> Primary contact email for booking confirmations, reminders, and patient record linking.
                </div>
                <div>
                  <strong>Date of Birth (DOB) *:</strong> Birthdate selector used alongside email to match existing records or create a new profile.
                </div>
                <div>
                  <strong>First Name & Last Name *:</strong> Legal patient identity fields.
                </div>
                <div>
                  <strong>Mobile Phone *:</strong> Mobile contact number with international country dial code selector (e.g. <em>+63</em>) for automated SMS notifications.
                </div>
              </div>
            </div>

            {/* Clinical Concerns */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">2. Patient Concerns Field</h5>
              <p className="text-xs text-gray-700 font-body leading-relaxed">
                <strong>Notes / Please specify your concerns:</strong> An open text area where patients can explain their current symptoms, chief complaints, previous therapy history, or specific requests for the practitioner prior to consultation.
              </p>
            </div>

            {/* Terms and Consent Forms */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">3. Mandatory Terms & Consent Forms</h5>
              <ul className="text-xs space-y-2 text-gray-700 font-body list-disc pl-4">
                <li>
                  <strong>Terms & Conditions *:</strong> Patient agrees to clinic operational, cancellation, and booking policies.
                </li>
                <li>
                  <strong>Data Privacy Policy *:</strong> Patient consents to health data handling in compliance with privacy regulations.
                </li>
                <li>
                  <strong>Clinic Consent Form *:</strong> Patient reviews and signs the digital clinic consent form before booking can proceed.
                </li>
              </ul>
            </div>
          </div>

          <h4 className="text-lg font-semibold text-gray-900 mb-3">Finalizing the Booking</h4>
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Once all required fields (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-800">*</code>) are completed and consent checkboxes are checked, the patient clicks the blue <strong>Confirm Booking</strong> button. The appointment is immediately synced to the clinic's internal Diary / Calendar and a confirmation is generated for both patient and clinician.
          </p>

          <DocCallout type="tip">
            Because Malasakit checks both email address and Date of Birth upon submission, existing patients are automatically matched to their existing records—preventing accidental duplicate profiles while allowing first-time patients to register seamlessly.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot20_4}
              width={3420}
              height={2001}
              decoding="async"
              loading="lazy"
              alt="Screenshot 20.4: Booking Details and Confirmation"
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
        In this chapter, you learned how patients complete the self-service online booking workflow in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How patients <strong>choose their practitioner</strong> filtered by branch assignment and clinical specialty.</li>
        <li>How patients <strong>select clinic services</strong> with clear visibility into consultation length and service fees.</li>
        <li>How patients <strong>pick an available date and time</strong> through a live monthly calendar with split-shift and lunch break protection.</li>
        <li>How patients enter their <strong>booking details</strong> (Email, DOB, Name, Phone), describe their <strong>clinical concerns</strong>, agree to <strong>Terms & Consent forms</strong>, and <strong>confirm the booking</strong>.</li>
      </ul>
    </>
  );
};

export default Chapter20;

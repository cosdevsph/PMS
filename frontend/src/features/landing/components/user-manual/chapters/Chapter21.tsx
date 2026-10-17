import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot21_1 from '@/assets/manual/Chapter 21/Screenshot 21.1.png';
import Screenshot21_2 from '@/assets/manual/Chapter 21/Screenshot 21.2.png';
import Screenshot21_3 from '@/assets/manual/Chapter 21/Screenshot 21.3.png';
import Screenshot21_4 from '@/assets/manual/Chapter 21/Screenshot 21.4.png';
import Screenshot21_5 from '@/assets/manual/Chapter 21/Screenshot 21.5.png';

const Chapter21: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how clinicians and practitioners navigate to and document patient consultations in Malasakit PMS—from selecting an appointment and launching templates to annotating interactive body charts and choosing whether to save drafts or finalize clinical notes.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Clinical Notes Documentation Workflow</h3>
        <p className="text-gray-700 font-body mb-6">
          Documenting a consultation follows five structured, user-friendly steps:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Clinical Documentation Journey</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">21.1 Calendar Appointment</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">21.2 Clinical Notes Tab</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">21.3 Notes Page Display</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">21.4 Select Template</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">21.5 Details & Save / Finalize</span>
          </div>
        </div>
      </div>


      {/* SECTION 21.1 — Various kind to navigate to notes */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        21.1 Navigating to Clinical Notes
      </h3>
      <p className="text-gray-700 font-body mb-6">Access clinical documentation through the Calendar view or the Patient Profile.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Malasakit provides flexible access points to patient clinical notes, allowing practitioners to initiate documentation seamlessly from their daily schedule or client records:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
              <h5 className="font-bold text-sky-950 mb-2 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                Primary Pathway: Calendar / Diary View
              </h5>
              <p className="text-xs text-gray-700 leading-relaxed">
                From the <strong>Diary</strong> or <strong>Calendar</strong>, locate the patient's booked appointment card (e.g. <em>John Doe · 6/3 Sessions · 9:45 AM</em>) under the practitioner column. Clicking the appointment card opens the centralized <strong>Appointment View</strong> modal.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                Secondary Pathway: Patient Profile
              </h5>
              <p className="text-xs text-gray-700 leading-relaxed">
                Navigate to <strong>Clients</strong>, search for the patient, click <strong>View Profile</strong>, and select the <strong>Clinical note</strong> item from the patient sidebar menu to access all historical and case notes.
              </p>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot21_1}
              alt="Screenshot 21.1: Calendar view selecting Appointment and Patient Profile"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 21.2 — Appointment View Modal, select the Clinical Notes Tab */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        21.2 Appointment View Modal: Clinical Notes Tab
      </h3>
      <p className="text-gray-700 font-body mb-6">Access clinical documentation directly from the consultation header tabs.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Upon opening the <strong>Appointment View</strong> modal, the top navigation tab bar displays operational and clinical tools for the consultation:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Client Information:</strong> Review patient demographics, contact details, and attendance flags.</li>
            <li><strong>Appointment ⌵:</strong> Manage appointment actions (Cancel, Add Recurring, Rebook).</li>
            <li><strong>Status:</strong> Update attendance (Arrived, Did Not Arrive, In Consultation, Completed).</li>
            <li>
              <strong>Clinical Notes:</strong> Click this tab to navigate directly into the clinical note workspace, automatically binding the active appointment session.
            </li>
            <li><strong>Generate Invoice:</strong> Bill consultation fees and generate patient receipts.</li>
            <li><strong>Communications:</strong> Review automated reminders and messaging logs.</li>
          </ul>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot21_2}
              alt="Screenshot 21.2: Appointment View Modal, select the Clinical Notes Tab"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 21.3 — redirected to Patient Profile > Clinical Note Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        21.3 Redirected to Patient Profile: Clinical Note Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Manage templates, letters, and chronological medical history for the active case.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Clicking the <strong>Clinical Notes</strong> tab redirects you directly to the patient's dedicated <strong>Clinical note</strong> dashboard within their profile (e.g. <em>John Doe — LOW BACKPAIN</em>):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Patient Sidebar Context</h5>
              <p className="text-xs text-gray-600 mb-2">Preserves complete patient orientation:</p>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li>Patient Avatar & Name (e.g. <em>John Doe</em>)</li>
                <li>Unique Client ID (e.g. <em>20261004-0002</em>)</li>
                <li>Active menu item: <strong>Clinical note</strong></li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Workspace Navigation Tabs</h5>
              <p className="text-xs text-gray-600 mb-2">Four core clinical modules:</p>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Templates:</strong> Browse and launch documentation templates.</li>
                <li><strong>Letters:</strong> Issue medical certificates and referral letters.</li>
                <li><strong>History:</strong> Chronological record of drafted and finalized notes.</li>
                <li><strong>Documents:</strong> Attached diagnostic scans and patient files.</li>
              </ul>
            </div>
          </div>

          <DocCallout type="info">
            If this is the patient's initial session, the History panel displays <em>"No Clinical Notes Found"</em>, allowing the practitioner to begin documentation fresh from the Templates catalog.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot21_3}
              alt="Screenshot 21.3: redirected to Patient Profile > Clinical Note Page"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 21.4 — Creating a note, select a template */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        21.4 Creating a Note: Select a Template
      </h3>
      <p className="text-gray-700 font-body mb-6">Select standardized clinical forms tailored to the specialty and consultation type.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Under the <strong>Templates</strong> tab, pre-configured documentation forms are structured by clinical department to ensure comprehensive, standardized medical record keeping:
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-1 text-sm">Search Templates</h5>
              <p className="text-xs text-gray-600">
                Use the search input (<em>Search templates...</em>) to quickly find templates across all departments.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40">
              <h5 className="font-bold text-teal-950 mb-1 text-sm">General Templates</h5>
              <p className="text-xs text-gray-700">
                <strong>General SOAP</strong> (<span className="text-teal-700 font-semibold">Malasakit Default</span>): Standardized Subjective, Objective, Assessment, and Plan note for routine consultations.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
              <h5 className="font-bold text-blue-950 mb-1 text-sm">Occupational Therapy Templates</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 list-disc pl-4">
                <li><strong>SOAP Note – OT:</strong> Tailored for occupational therapy assessments and progress tracking.</li>
                <li><strong>Head Injury Consultation:</strong> Specialized neurological and concussion assessment protocols.</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Clicking on any template card (such as <strong>SOAP Note – OT</strong>) immediately loads the interactive clinical note editor.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot21_4}
              alt="Screenshot 21.4: Creating a note, select a template"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 21.5 — Enter Note details > Save Draft or Finalize Note */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        21.5 Enter Note Details: Save Draft or Finalize Note
      </h3>
      <p className="text-gray-700 font-body mb-6">Record clinical findings, annotate anatomical charts, and control finalization status.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-6">
            The note editor presents a structured documentation interface pre-linked to the consultation session:
          </p>

          <div className="space-y-4 mb-6">
            {/* Header & Session */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">1. Session & Timing Linking</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 font-body">
                <div>
                  <strong>DATE:</strong> Date of the clinical evaluation (e.g. <em>17 / 10 / 2026</em>).
                </div>
                <div>
                  <strong>SESSION:</strong> Automatically links to the specific booked appointment (e.g. <em>Oct 17, 2026 — 9:45 AM — John Doe</em>) to preserve chronological integrity.
                </div>
              </div>
            </div>

            {/* Template Fields & Interactive Body Chart */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">2. Template Fields & Interactive Body Chart</h5>
              <ul className="text-xs space-y-2 text-gray-700 font-body list-disc pl-4">
                <li>
                  <strong>Clinical Fields:</strong> Fill in customizable fields such as <em>Physical Test</em>, numerical measurements, and timing details.
                </li>
                <li>
                  <strong>Multi-Color Body Chart:</strong> Interactive anatomical diagrams (front view, side profiles, and back view). Clinicians can select drawing colors (blue, red, orange, yellow, purple, black), sketch areas of pain or tenderness with the <strong>Pen</strong> tool, and use <strong>Undo</strong> or <strong>Clear</strong> to refine annotations.
                </li>
              </ul>
            </div>

            {/* Saving Actions */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">3. Saving Actions</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-700 font-body">
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <strong className="text-gray-700">Cancel:</strong>
                  <p className="mt-1 text-gray-600">Discards unsaved edits and returns to the patient clinical notes list.</p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <strong className="text-sky-800">Save Draft:</strong>
                  <p className="mt-1 text-gray-600">Saves your progress without locking the note, allowing you to resume and edit details at a later time.</p>
                </div>
                <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200">
                  <strong className="text-blue-900">Finalize:</strong>
                  <p className="mt-1 text-gray-600">Permanently locks and signs the clinical note as an official medical record in the patient's case history.</p>
                </div>
              </div>
            </div>
          </div>

          <DocCallout type="warning">
            Finalized clinical notes cannot be deleted or casually edited, ensuring strict medico-legal compliance. If notes are still preliminary, always choose <strong>Save Draft</strong> until all assessments and treatment plans are complete.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot21_5}
              alt="Screenshot 21.5: Enter Note details > Save Draft or Finalize Note"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to document consultations using the Clinical Notes module in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to <strong>navigate to clinical notes</strong> directly from the Calendar appointment or Patient Profile.</li>
        <li>How the <strong>Clinical Notes tab</strong> in the Appointment View modal bridges scheduling and documentation.</li>
        <li>How the <strong>Patient Profile Clinical Note page</strong> centralizes templates, letters, and note history.</li>
        <li>How to <strong>select standardized templates</strong> (such as General SOAP or Occupational Therapy notes).</li>
        <li>How to <strong>record consultation details</strong>, annotate the <strong>interactive Body Chart</strong>, and choose between <strong>Save Draft</strong> and <strong>Finalize</strong>.</li>
      </ul>
    </>
  );
};

export default Chapter21;

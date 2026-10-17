import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot22_1 from '@/assets/manual/Chapter 22/Screenshot 22.1.webp';
import Screenshot22_2 from '@/assets/manual/Chapter 22/Screenshot 22.2.webp';
import Screenshot22_3 from '@/assets/manual/Chapter 22/Screenshot 22.3.webp';
import Screenshot22_4 from '@/assets/manual/Chapter 22/Screenshot 22.4.webp';

const Chapter22: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to locate patient clinical notes, export professional PDF documents, print physical medical reports, and securely dispatch notes via email directly from Malasakit PMS.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Export & Email Workflow Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Printing or emailing a consultation report follows four simple, integrated steps:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Document Distribution Steps</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">22.1 Clinical Note Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">22.2 Select Print or Email Icon</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">22.3 Print Preview & PDF</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">22.4 Send Direct Email</span>
          </div>
        </div>
      </div>


      {/* SECTION 22.1 — Navigate to Clinical Note Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        22.1 Navigate to Clinical Note Page
      </h3>
      <p className="text-gray-700 font-body mb-6">Access the patient's clinical history timeline and past consultation records.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            To view, export, or share a clinical note, first open the patient's record by selecting <strong>Clinical note</strong> from the patient profile sidebar (or by clicking the <em>Clinical Notes</em> tab from an active appointment):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Patient & Case Context</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Breadcrumb Header:</strong> Identifies the active medical case (e.g. <em>John Doe — LOW BACKPAIN</em>).</li>
                <li><strong>Patient Sidebar:</strong> Shows avatar, patient name, and client ID (e.g. <em>20261004-0002</em>).</li>
                <li><strong>History Tab:</strong> Displays session count (e.g. <em>3 out of 3 Sessions</em>) with quick <em>Expand all Notes</em> and <em>Collapse all Notes</em> controls.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Note Card Overview</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Session & Date:</strong> Consultation timestamp, date, and appointment name.</li>
                <li><strong>Practitioner Info:</strong> Name, role, contact information, and clinic branch.</li>
                <li><strong>Clinical Content:</strong> Template name, documented values, and interactive body chart drawings.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot22_1}
              width={3420}
              height={2001}
              decoding="async"
              alt="Screenshot 22.1: Navigate to Clinical Note Page"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 22.2 — Select desired Note and navigate to Print icon or Email icon */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        22.2 Select Desired Note: Print or Email Actions
      </h3>
      <p className="text-gray-700 font-body mb-6">Choose between physical printing, PDF export, or direct email dispatch.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            On the top-right corner of each clinical note header card, four action icons provide immediate document controls:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm">🖨️</span>
                <h5 className="font-bold text-blue-950 text-sm">Print Icon (Print / Export PDF)</h5>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Clicking the <strong>Print icon</strong> opens the Print Preview modal, allowing you to generate an A4 clinical document to print physically or download as a PDF.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700 text-sm">✉️</span>
                <h5 className="font-bold text-teal-950 text-sm">Email Icon (Send to Email)</h5>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Clicking the <strong>Email icon</strong> opens the direct email dialog, pre-loaded with the patient's email and a ready-to-send PDF attachment.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            <em>Note: The adjacent pencil icon enables editing for authorized staff, and the copy icon duplicates note structure for recurring sessions.</em>
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot22_2}
              width={1330}
              height={280}
              decoding="async"
              loading="lazy"
              alt="Screenshot 22.2: Select desired Note and navigate to Print icon or Email icon"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 22.3 — Print Preview: Download as PDF or Print buttons */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        22.3 Print Preview: Download as PDF or Print Buttons
      </h3>
      <p className="text-gray-700 font-body mb-6">Review the formatted A4 medical layout before printing or exporting.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Clicking the <strong>Print icon</strong> displays the <strong>Print Preview</strong> modal, showing an exact representation of how the clinical note will appear on paper or inside a PDF viewer:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Document Layout & Standards</h5>
              <ul className="text-xs space-y-1.5 text-gray-700 font-body">
                <li><strong>Clinic Header:</strong> High-resolution clinic logo, branch name (e.g. <em>Bacolod Clinic</em>), and contact details.</li>
                <li><strong>Practitioner & Document Info:</strong> Provider name, administrative title, and document type (e.g. <em>SOAP Note – OT</em>).</li>
                <li><strong>Patient & Consultation Meta:</strong> Patient name, date of consultation, and session identifier.</li>
                <li><strong>Embedded Charts:</strong> Full-resolution body charts with all anatomical drawings and notes perfectly rendered.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Output Actions</h5>
              <ul className="text-xs space-y-2 text-gray-700 font-body">
                <li>
                  <strong>Download PDF:</strong> Click the <strong>Download PDF</strong> button to save an electronic <code>.pdf</code> file directly to your computer for archival or external specialist sharing.
                </li>
                <li>
                  <strong>Print Note:</strong> Click the blue <strong>Print Note</strong> button to trigger the native browser print dialogue for physical printer output.
                </li>
              </ul>
            </div>
          </div>

          <DocCallout type="tip">
            Because Malasakit compiles the PDF using standardized vector formatting, body chart drawings, text, and logos remain crisp and clear when printed on standard A4 paper.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot22_3}
              width={1678}
              height={1931}
              decoding="async"
              loading="lazy"
              alt="Screenshot 22.3: Print Preview: Download as PDF or Print buttons"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 22.4 — Sending email directly modal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        22.4 Sending Email Directly Modal
      </h3>
      <p className="text-gray-700 font-body mb-6">Dispatch clinical reports directly to the patient or external recipients via email.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Clicking the <strong>Email icon</strong> opens the <strong>Send Clinical Note via Email</strong> modal, allowing you to email the documentation instantly without leaving Malasakit:
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">1. Recipient Management (To *)</h5>
              <p className="text-xs text-gray-700 leading-relaxed mb-2">
                By default, the <strong>To *</strong> field is automatically pre-filled with the client/patient's registered email address (e.g. <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-800">john.doe@gmail.com</code>).
              </p>
              <ul className="text-xs space-y-1 text-gray-600 list-disc pl-4">
                <li>Press <em>Enter</em>, <em>Space</em>, or <em>comma</em> to add multiple recipients (such as referring doctors or family members).</li>
                <li>Click the <strong>✕</strong> on any tag to remove an address.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">2. Subject & Customizable Message</h5>
              <div className="space-y-2 text-xs text-gray-700 font-body">
                <div>
                  <strong>Subject:</strong> Automatically formatted as <em>Clinical Note – [Date]</em> (e.g. <em>Clinical Note – Oct 17, 2026</em>), but completely editable.
                </div>
                <div>
                  <strong>Customizable Message:</strong> Comes pre-populated with a polite template addressing the patient by name. Clinicians can freely edit the text to include personalized recovery advice, medication instructions, or follow-up reminders.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">3. Automatic PDF Attachment & Sending</h5>
              <p className="text-xs text-gray-700 leading-relaxed mb-2">
                The clinical note is automatically compiled and attached as a standardized PDF document (e.g. <strong>ClinicalNote_John-Doe.pdf</strong> · 426.0 KB).
              </p>
              <p className="text-xs text-gray-600">
                Click <strong>Send Email</strong> to securely dispatch the report. The patient will receive the email with the attached PDF in their inbox immediately.
              </p>
            </div>
          </div>

          <DocCallout type="warning">
            Clinical notes contain sensitive medical information. Always verify recipient email addresses carefully before clicking <strong>Send Email</strong>.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot22_4}
              width={3420}
              height={2001}
              decoding="async"
              loading="lazy"
              alt="Screenshot 22.4: Sending email directly modal"
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
        In this chapter, you learned how to export, print, and email Clinical Notes in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to <strong>navigate to the Clinical Note page</strong> and inspect consultation history.</li>
        <li>Where to find the <strong>Print icon</strong> and <strong>Email icon</strong> on any clinical note header.</li>
        <li>How to use <strong>Print Preview</strong> to print physical copies or <strong>Download PDF</strong> files.</li>
        <li>How to use the <strong>Send Clinical Note via Email</strong> modal, manage recipients, customize messages, and dispatch automatic PDF attachments.</li>
      </ul>
    </>
  );
};

export default Chapter22;

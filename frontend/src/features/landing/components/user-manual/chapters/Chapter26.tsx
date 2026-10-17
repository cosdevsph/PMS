import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot26_1 from '@/assets/manual/Chapter 26/Screenshot 26.1.png';
import Screenshot26_2 from '@/assets/manual/Chapter 26/Screenshot 26.2.png';

const Chapter26: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to reach Malasakit support, submit bug reports or feature feedback directly within the application, and contact our team via email.
      </p>

      {/* DIRECT EMAIL & CONTACT SUPPORT BANNER */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12 shadow-[0_2px_12px_rgb(14,165,233,0.08)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 bg-sky-600 text-white text-xs font-bold uppercase rounded-md tracking-wider">
              Direct Support
            </span>
            <h3 className="text-xl font-bold text-sky-950 mt-2 mb-1">Need Assistance? We're Here to Help</h3>
            <p className="text-gray-700 font-body text-sm leading-relaxed">
              Aside from the in-app support widget, you can always reach our dedicated support desk directly via email.
            </p>
          </div>
          <div className="shrink-0 bg-white border border-sky-200 rounded-xl p-4 shadow-sm text-center sm:text-left">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Official Support Email</p>
            <a
              href="mailto:malasakitsolutions@gmail.com"
              className="text-base sm:text-lg font-bold text-sky-600 hover:text-sky-700 font-mono underline"
            >
              malasakitsolutions@gmail.com
            </a>
          </div>
        </div>
      </div>


      {/* SECTION 26.1 — Right Utility Panel */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        26.1 Utility Panel & In-App Contact Support
      </h3>
      <p className="text-gray-700 font-body mb-6">
        Access quick communication tools and the support launcher from the persistent right-side panel.
      </p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            On the right side of every page in the application, you will find the persistent utility bar with quick-access tabs:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="w-4 h-4 rounded-full bg-emerald-500 shrink-0"></span>
              <div>
                <p className="text-xs font-bold text-emerald-950">Green Tab</p>
                <p className="text-xs text-gray-600">Messages & Chat</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
              <span className="w-4 h-4 rounded-full bg-amber-500 shrink-0"></span>
              <div>
                <p className="text-xs font-bold text-amber-950">Orange Tab</p>
                <p className="text-xs text-gray-600">Notifications & Alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-sky-300 bg-sky-50">
              <span className="w-4 h-4 rounded-full bg-sky-500 shrink-0"></span>
              <div>
                <p className="text-xs font-bold text-sky-950">Blue Tab (Headset)</p>
                <p className="text-xs text-sky-700 font-medium">Contact Support Launcher</p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 font-body leading-relaxed mb-6">
            Clicking the <strong>blue headset icon</strong> immediately opens the <strong>Submit Feedback & Reports</strong> modal over your active screen without navigating away from your work.
          </p>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot26_1}
              alt="Screenshot 26.1: Right utility panel showing the blue contact support button"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* SECTION 26.2 — Feedback and Reports Modal */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        26.2 Feedback and Reports Modal
      </h3>
      <p className="text-gray-700 font-body mb-6">
        Submit detailed bug reports, questions, or product enhancement requests with optional screenshot attachments.
      </p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            When the modal appears, fill out the following fields to help our support and technical engineering team resolve your inquiry quickly:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 font-body mb-6">
            <li>
              <strong>Type:</strong> Select the category of your submission (e.g., <em>Bug Report</em>, <em>Feature Request</em>, or <em>General Inquiry</em>).
            </li>
            <li>
              <strong>Priority:</strong> Choose the appropriate urgency level (e.g., <em>Low</em>, <em>Medium</em>, <em>High</em>, or <em>Urgent</em>).
            </li>
            <li>
              <strong>Title:</strong> Enter a concise summary of the issue or feedback.
            </li>
            <li>
              <strong>Description:</strong> Provide a clear explanation. If reporting an anomaly, include the steps to reproduce the behavior.
            </li>
            <li>
              <strong>Attachments (Optional):</strong> Click <strong>+ Add File</strong> to attach screenshots, error images, or relevant documents.
            </li>
            <li>
              Click <strong>Submit Report</strong> to send your ticket directly to our engineering support queue.
            </li>
          </ol>

          <DocCallout type="important" title="Privacy Warning">
            Please avoid including unnecessary patient or confidential clinical information in screenshots. Redact patient names or sensitive details prior to uploading attachments.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2">
            <img
              src={Screenshot26_2}
              alt="Screenshot 26.2: Feedback and Reports modal with type, priority, title, description, and attachments"
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
        You now know how to reach out for assistance or submit feedback in Malasakit:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li><strong>26.1 Utility Panel:</strong> Click the blue headset icon on the right edge of any screen to open in-app support.</li>
        <li><strong>26.2 Feedback & Reports Modal:</strong> Specify the type, priority, title, description, and attach screenshots before clicking <strong>Submit Report</strong>.</li>
        <li><strong>Direct Support Email:</strong> Contact us anytime directly at <a href="mailto:malasakitsolutions@gmail.com" className="text-sky-600 font-bold underline font-mono">malasakitsolutions@gmail.com</a>.</li>
      </ul>
    </>
  );
};

export default Chapter26;

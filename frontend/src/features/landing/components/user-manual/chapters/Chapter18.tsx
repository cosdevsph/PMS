import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot18_1 from '@/assets/manual/Chapter 18/Screenshot 18.1.webp';
import Screenshot18_2 from '@/assets/manual/Chapter 18/Screenshot 18.2.webp';
import Screenshot18_3 from '@/assets/manual/Chapter 18/Screenshot 18.3.webp';
import Screenshot18_4 from '@/assets/manual/Chapter 18/Screenshot 18.4.webp';

const Chapter18: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to upload, view, download and delete a patient's documents, and where documents appear in the patient profile and in a case.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Patient Documents Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Documents such as referral letters, reports and consent forms are kept with the patient, grouped by case:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Documents Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">18.1 Documents Page</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">18.2 Upload</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">18.3 View, Download, Delete</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">18.4 Documents in a Case</span>
          </div>
        </div>
      </div>


      {/* SECTION 18.1 — The Patient Documents Page */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        18.1 The Patient Documents Page
      </h3>
      <p className="text-gray-700 font-body mb-6">All of a patient's files in one place.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Clients</strong>, open a patient, then click <strong>Documents</strong> in the patient's left menu. Documents are grouped in folders, one for each case, plus an <strong>Unassigned Documents</strong> folder. Each folder shows how many documents it holds; click a folder to open it.
          </p>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Each row shows the document title, its size and file type, the upload date, who uploaded it and, for signed consent forms, a <strong>Consent Form</strong> badge. Click the download icon to save a copy.
          </p>

          <DocCallout type="info" title="Branch visibility">
            Documents are listed for the branch where they were uploaded. A document uploaded at one branch may not appear when you are working at another.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot18_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 18.1: Patient Documents page with case folders"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 18.2 — Uploading a Document */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.2 Uploading a Document
      </h3>
      <p className="text-gray-700 font-body mb-6">Add a file to the patient record.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Click <strong>Add Documents</strong>.</li>
            <li>In the <strong>Upload Document</strong> dialog, click <strong>Upload a file</strong> and choose the file.</li>
            <li>Check the <strong>Title</strong>. It starts as the file name; change it to something clear.</li>
            <li>Click <strong>Upload Document</strong>.</li>
          </ol>

          <DocCallout type="important" title="File types and size">
            Only <strong>PDF, DOC and DOCX</strong> files up to <strong>5 MB</strong> can be uploaded. Image files are not accepted.
          </DocCallout>

          <DocCallout type="tip" title="Where the file is saved">
            A document uploaded from the patient's <strong>Documents</strong> page is saved under <strong>Unassigned Documents</strong>. A document uploaded from inside a case (see 18.4) is saved with that case.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot18_2}
              width={1120}
              height={944}
              decoding="async"
              loading="lazy"
              alt="Screenshot 18.2: Upload Document dialog"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 18.3 — Viewing, Downloading and Deleting */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.3 Viewing, Downloading and Deleting
      </h3>
      <p className="text-gray-700 font-body mb-6">Open a document or remove it.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click a document row to preview it. PDFs and generated letters open in the preview. Word files (DOC and DOCX) show <strong>Preview Unavailable</strong>; use <strong>Download</strong> to open them on your computer.
          </p>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            To delete a document, click the bin icon in the preview, then confirm. A confirmation asks <em>Are you sure you want to delete this document?</em> and warns that the action cannot be undone.
          </p>

          <DocCallout type="warning" title="Deleting is permanent">
            A deleted document cannot be restored. Download a copy first if you may need it later.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot18_3}
              width={1856}
              height={1866}
              decoding="async"
              loading="lazy"
              alt="Screenshot 18.3: Document preview with Download and Delete"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 18.4 — Documents Inside a Case */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        18.4 Documents Inside a Case
      </h3>
      <p className="text-gray-700 font-body mb-6">Work with documents while writing clinical notes.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Open a case from <strong>Cases</strong>, or use <strong>Clinical note</strong> in the patient's menu and choose a case. In the clinical documentation workspace, click the <strong>Documents</strong> tab on the right. Documents are grouped under each appointment (with its <strong>Session</strong> number) and under <strong>Case Level Documents</strong>.
          </p>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>Add Documents</strong> here to attach a file to this case. Letters generated from letter templates are added to the case documents automatically.
          </p>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot18_4}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 18.4: Documents tab in the clinical documentation workspace"
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
        In this chapter, you learned how to manage patient documents in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to open a patient's <strong>Documents</strong> page and read the case folders.</li>
        <li>How to <strong>upload</strong> PDF, DOC or DOCX files up to 5 MB.</li>
        <li>How to <strong>preview, download and delete</strong> a document, and that deleting is permanent.</li>
        <li>How to find and add documents from the <strong>Documents tab</strong> of a case.</li>
      </ul>
    </>
  );
};

export default Chapter18;

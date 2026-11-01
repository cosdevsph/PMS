import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot26_1 from '@/assets/manual/Chapter 26/Screenshot 26.1.webp';
import Screenshot26_2 from '@/assets/manual/Chapter 26/Screenshot 26.2.webp';
import Screenshot26_2_1 from '@/assets/manual/Chapter 26/Screenshot 26.2.1.webp';
import Screenshot26_4 from '@/assets/manual/Chapter 26/Screenshot 26.4.webp';

const Chapter26: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to build clinical note templates for your clinic, add the fields your practitioners need, and use a template when writing a note.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Note Templates Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          A template is the form practitioners fill in when they write a clinical note. You design it once and reuse it for every patient:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Template Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">26.1 Template List</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">26.2 Build a Template</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">26.3 Field Types</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">26.4 Use in a Note</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">26.5 Archive</span>
          </div>
        </div>
      </div>


      {/* SECTION 26.1 — The Note Templates List */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        26.1 The Note Templates List
      </h3>
      <p className="text-gray-700 font-body mb-6">All templates available to your clinic.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Go to <strong>Manage</strong> and, in the <strong>Clinical</strong> card, click <strong>Note Templates</strong>. The page <strong>Clinical Note Templates</strong> lists every template, grouped by discipline with <strong>General</strong> first. Use the search box and the <strong>All Disciplines</strong> filter to find one, and <strong>Show Archived</strong> to include archived templates.
          </p>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Each template shows its sections and fields, who created it and whether it is active. <strong>Malasakit Default</strong> marks the built-in template, which is read-only. Click the ⋮ menu on a template to <strong>Edit Template</strong> or <strong>Archive</strong> it.
          </p>

          <DocCallout type="tip" title="Who can build templates">
            By default the Owner and the Practitioner permission group can edit templates; Branch Manager and Front Desk can only view them.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot26_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 26.1: Clinical Note Templates list"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 26.2 — Creating a Template */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        26.2 Creating a Template
      </h3>
      <p className="text-gray-700 font-body mb-6">Name it, choose who it is for, and add fields.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Click <strong>New Template</strong>.</li>
            <li>Enter the <strong>Template Name</strong>, for example <em>SOAP Note - Physiotherapy</em>.</li>
            <li>Choose the <strong>Discipline</strong>. Pick one from the list, or type a new discipline and choose <em>Create</em>.</li>
            <li>Optionally choose a <strong>Location</strong> (<em>All Locations</em> or one branch).</li>
            <li>Click <strong>Add Field</strong> in the <strong>Form Builder</strong> and set it up (see 26.3). The <strong>Live Preview</strong> on the right shows how practitioners will see the form.</li>
            <li>Click <strong>Create Template</strong>.</li>
          </ol>

          <DocCallout type="info">
            <strong>Discipline</strong> and <strong>Location</strong> are labels that help you organise templates. They do not hide a template from practitioners: every active template is offered in the clinical notes screen.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot26_2}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 26.2: Create New Template with the Form Builder"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot26_2_1}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 26.2.1: A new field added to the template"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 26.3 — Field Types and Settings */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        26.3 Field Types and Settings
      </h3>
      <p className="text-gray-700 font-body mb-6">What you can add to a template.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Field types</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li>Section Header and Heading</li>
                <li>Text and Text Area</li>
                <li>Number and Scale (0–10 by default, shown as numbered buttons from <em>No pain</em> to <em>Worst pain</em>)</li>
                <li>Multiple Choice, Check Boxes and Dropdown (add the choices with <strong>Add Option</strong>)</li>
                <li>Date/Time</li>
                <li>Chart: Body, Back, Head, Hand or Feet</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
              <h5 className="font-bold text-gray-900 mb-2 text-sm">Settings for each field</h5>
              <ul className="text-xs space-y-1 text-gray-700 font-body list-disc pl-4">
                <li><strong>Label</strong> and <strong>Type</strong></li>
                <li><strong>Default</strong> value and <strong>Rows</strong> for text areas</li>
                <li><strong>Minimum</strong> and <strong>Maximum</strong> for scales</li>
                <li><strong>Help / Info</strong> text shown under the field</li>
                <li><strong>Required</strong>: the note cannot be finalized without it</li>
                <li><strong>Remove Field</strong></li>
              </ul>
            </div>
          </div>

          <DocCallout type="tip" title="Charts">
            Practitioners can draw on a chart with the <strong>Pen</strong> or place numbered <strong>Marker</strong> points with a note. Each marker records the side of the body (front, back, left or right). <strong>Undo</strong> and <strong>Clear</strong> remove drawing. The original chart image is never changed.
          </DocCallout>
        </div>
      </div>


      {/* SECTION 26.4 — Using a Template to Write a Note */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        26.4 Using a Template to Write a Note
      </h3>
      <p className="text-gray-700 font-body mb-6">Pick a template from the case.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Open the patient and click a case under <strong>Cases</strong> (or use <strong>Clinical note</strong> in the patient's menu).</li>
            <li>In the clinical documentation workspace, stay on the <strong>Templates</strong> tab and click a template.</li>
            <li>Choose the <strong>Date</strong> and the <strong>Session</strong> (the appointment the note belongs to), then fill in the form.</li>
            <li>Click <strong>Save Draft</strong> to keep working later, or <strong>Finalize</strong> when the note is complete.</li>
          </ol>

          <DocCallout type="info">
            If the <strong>Session</strong> list is empty, the case has no appointment yet. Book an appointment for the case first. See the Clinical Notes chapter for the full note workflow.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot26_4}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 26.4: Templates tab in the clinical documentation workspace"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 26.5 — Archiving and Limits */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        26.5 Archiving and Limits
      </h3>
      <p className="text-gray-700 font-body mb-6">Retire a template and know what it does not do.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Open a template's ⋮ menu and click <strong>Archive</strong>, then confirm. An archived template is no longer offered for new notes; notes already written with it keep their content. Turn on <strong>Show Archived</strong> to see archived templates.
          </p>

          <DocCallout type="warning" title="Only the Owner can archive">
            Other roles see <strong>Archive</strong> in the menu but receive a message that only the Owner can archive templates.
          </DocCallout>

          <DocCallout type="important" title="Editing changes the template itself">
            Saving changes updates the template in place; the screens do not create a separate version. Plan edits carefully and archive a template that you want to replace.
          </DocCallout>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to build and use clinical note templates in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to find templates under <strong>Manage &gt; Clinical &gt; Note Templates</strong>.</li>
        <li>How to <strong>create a template</strong> with a name, discipline and fields.</li>
        <li>The <strong>field types</strong> available, including scales and charts.</li>
        <li>How to <strong>use a template</strong> from a case to write a note.</li>
        <li>How to <strong>archive</strong> a template, and that only the Owner can.</li>
      </ul>
    </>
  );
};

export default Chapter26;

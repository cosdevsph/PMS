import React from 'react';
import { EditorContent, Editor } from '@tiptap/react';
import type { ClinicProfile } from '@/features/clinical-documentation/api/letters.api';
import { LetterLayoutBlocks, LetterTopSpace } from '@/features/clinical-documentation/components/letter/LetterLayoutBlocks';
import type { LetterPatient } from '@/features/clinical-documentation/components/letter/letterLayout';

interface LetterDocumentEditorProps {
  bodyEditor: Editor | null;
  profile: ClinicProfile | null;
  layoutLetterHead: boolean;
  layoutRemoveTopSpace: boolean;
  layoutDate: boolean;
  layoutAddressee: boolean;
}

/** Sample data only: the real addressee is the patient of the letter being written. */
const SAMPLE_PATIENT: LetterPatient = {
  full_name: 'Sample Patient',
  address: '123 Sample Street',
  city: 'Bacolod City',
  province: 'Negros Occidental',
  postal_code: '6100',
};

const Hidden: React.FC<{ label: string }> = ({ label }) => (
  <div className="mb-4 px-3 py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-400 select-none">{label} hidden</div>
);

export const LetterDocumentEditor: React.FC<LetterDocumentEditorProps> = ({
  bodyEditor, profile, layoutLetterHead, layoutRemoveTopSpace, layoutDate, layoutAddressee,
}) => (
  <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-gray-100">
    {/* A4 width (794px); grey bands every 1123px mark where a page ends. */}
    <div
      className="w-[794px] min-h-[1123px] flex flex-col mb-6 shadow-md relative"
      style={{
        backgroundColor: 'white',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1099px, #f3f4f6 1099px, #f3f4f6 1123px)',
      }}
    >
      <div className="px-12 pt-4 select-none" aria-label="Letterhead, date and addressee preview">
        <LetterTopSpace removed={layoutRemoveTopSpace} />
        {layoutLetterHead && !profile ? (
          <div className="mb-6 h-16 rounded bg-gray-100 animate-pulse" aria-hidden="true" />
        ) : null}
        <LetterLayoutBlocks
          profile={profile}
          patient={SAMPLE_PATIENT}
          letterHead={layoutLetterHead}
          showDate={layoutDate}
          addressee={layoutAddressee}
        />
        {!layoutLetterHead && <Hidden label="Letterhead" />}
        {!layoutDate && <Hidden label="Date" />}
        {!layoutAddressee && <Hidden label="Addressee" />}
        {layoutAddressee && <p className="-mt-6 mb-6 text-[11px] text-gray-400">Sample patient: each letter uses its own patient.</p>}
      </div>

      {/* The only editable region */}
      <div
        className="mx-12 mb-12 flex-1 cursor-text border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400 transition-colors"
        onClick={() => bodyEditor?.commands.focus()}
      >
        <EditorContent editor={bodyEditor} className="prose prose-sm max-w-none focus:outline-none min-h-[400px]" />
      </div>
    </div>
  </div>
);

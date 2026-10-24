import React from 'react';
import { LayoutTemplate } from 'lucide-react';

interface LetterDocumentLayoutPanelProps {
  layoutLetterHead: boolean;
  setLayoutLetterHead: (v: boolean) => void;
  layoutRemoveTopSpace: boolean;
  setLayoutRemoveTopSpace: (v: boolean) => void;
  layoutDate: boolean;
  setLayoutDate: (v: boolean) => void;
  layoutAddressee: boolean;
  setLayoutAddressee: (v: boolean) => void;
}

const LayoutToggle = ({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (c: boolean) => void }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-800">{label}</p>
      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{hint}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`mt-0.5 w-10 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${checked ? 'bg-sky-500' : 'bg-gray-300'}`}
    >
      <span className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

export const LetterDocumentLayoutPanel: React.FC<LetterDocumentLayoutPanelProps> = ({
  layoutLetterHead, setLayoutLetterHead,
  layoutRemoveTopSpace, setLayoutRemoveTopSpace,
  layoutDate, setLayoutDate,
  layoutAddressee, setLayoutAddressee,
}) => (
  <aside className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 overflow-y-auto">
    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
      <h3 className="font-bold text-gray-800 text-xs flex items-center gap-2 uppercase tracking-wide">
        <LayoutTemplate className="w-4 h-4 text-sky-600" aria-hidden="true" />
        Page layout
      </h3>
      <p className="text-xs text-gray-500 mt-1">What is placed above the letter body when a letter is created.</p>
    </div>
    <div className="px-4 py-3 flex flex-col gap-3">
      <LayoutToggle label="Letterhead" hint="Clinic logo, name, address, phone and email." checked={layoutLetterHead} onChange={setLayoutLetterHead} />
      <div className="h-px bg-gray-100" />
      <LayoutToggle label="Date" hint="The day the letter is created." checked={layoutDate} onChange={setLayoutDate} />
      <div className="h-px bg-gray-100" />
      <LayoutToggle label="Addressee" hint="The patient's name and address." checked={layoutAddressee} onChange={setLayoutAddressee} />
      <div className="h-px bg-gray-100" />
      <LayoutToggle label="Remove top space" hint="No gap above the first block. Use it for pre-printed letterhead paper." checked={layoutRemoveTopSpace} onChange={setLayoutRemoveTopSpace} />
    </div>
    <div className="mt-auto px-4 py-3 bg-sky-50/50 text-xs text-sky-700 leading-relaxed border-t border-sky-100">
      The page shows your real letterhead and a sample patient. Writers can still change these four settings for each letter.
    </div>
  </aside>
);

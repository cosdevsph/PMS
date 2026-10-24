import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, Save, MapPin, ChevronDown, Plus, Check, Circle } from 'lucide-react';
import type { LetterTemplate } from '@/features/clinical-documentation/api/letterTemplates.api';
import { useClinicBranches } from '@/features/clinics/hooks/useClinicBranches';
import { DISCIPLINE_OPTIONS } from '@/features/setup/types/staff.types';

const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: 'General letter' },
  { value: 'REFERRAL', label: 'Referral letter' },
  { value: 'REPORT', label: 'Clinical report' },
  { value: 'MEDICAL_CERT', label: 'Medical certificate' },
];

interface LetterTemplateHeaderProps {
  template: LetterTemplate | null;
  name: string;
  setName: (name: string) => void;
  discipline: string;
  setDiscipline: (d: string) => void;
  clinicBranch: number | null;
  setClinicBranch: (b: number | null) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  category: string;
  setCategory: (c: string) => void;
  description: string;
  setDescription: (d: string) => void;
  /** Something differs from what is saved (or, for a new template, anything was entered). */
  dirty: boolean;
  /** Show the "title required" message. */
  showNameError: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const LetterTemplateHeader: React.FC<LetterTemplateHeaderProps> = ({
  template,
  name,
  setName,
  discipline,
  setDiscipline,
  clinicBranch,
  setClinicBranch,
  isActive,
  setIsActive,
  category,
  setCategory,
  description,
  setDescription,
  dirty,
  showNameError,
  saving,
  onSave,
  onCancel,
}) => {
  const { branches } = useClinicBranches();
  
  // Discipline dropdown state
  const [disciplineOpen, setDisciplineOpen] = useState(false);
  const [disciplineSearch, setDisciplineSearch] = useState('');
  const [customDisciplines, setCustomDisciplines] = useState<string[]>([]);
  const disciplineRef = useRef<HTMLDivElement>(null);

  // A discipline saved earlier that is not one of the standard ones still shows in the list.
  const allDisciplines = Array.from(new Set([
    ...DISCIPLINE_OPTIONS.map((d) => d.label),
    ...(discipline ? [discipline] : []),
    ...customDisciplines,
  ]));

  const filteredDisciplines = allDisciplines.filter((d) =>
    d.toLowerCase().includes(disciplineSearch.toLowerCase())
  );

  const canCreateNew =
    disciplineSearch.trim().length > 0 &&
    !allDisciplines.some((d) => d.toLowerCase() === disciplineSearch.trim().toLowerCase());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (disciplineRef.current && !disciplineRef.current.contains(e.target as Node)) {
        setDisciplineOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDiscipline = (d: string) => {
    setDiscipline(d);
    setDisciplineSearch('');
    setDisciplineOpen(false);
  };

  const handleCreateDiscipline = () => {
    const newName = disciplineSearch.trim();
    if (newName && canCreateNew) {
      setCustomDisciplines((prev) => [...prev, newName]);
      setDiscipline(newName);
      setDisciplineSearch('');
      setDisciplineOpen(false);
    }
  };

  const fieldLabel = 'block text-[10px] font-semibold text-gray-500 mb-0.5 uppercase tracking-wider';
  const canSave = !saving && (!template || dirty);

  return (
    <div className="shrink-0 flex flex-col z-20 shadow-sm relative">
      {/* Title bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            title="Back to templates"
            aria-label="Back to templates"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-gray-200 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] leading-tight text-gray-400 font-medium">Letter templates / {template ? 'Edit' : 'New'}</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Letter title"
              aria-invalid={showNameError}
              className={`w-full max-w-xl text-base font-bold text-gray-900 bg-transparent border-b-2 px-0 py-0 focus:outline-none placeholder:text-gray-300 placeholder:font-semibold ${
                showNameError ? 'border-rose-400' : 'border-transparent hover:border-gray-200 focus:border-sky-500'
              }`}
              placeholder="Letter title, e.g. Referral Letter"
            />
            {showNameError && <p role="alert" className="text-xs text-rose-600 mt-1">Give the template a title before saving.</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${dirty ? 'text-amber-600' : 'text-gray-400'}`} role="status">
            {dirty ? <Circle className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> : <Check className="w-3.5 h-3.5" />}
            {dirty ? 'Unsaved changes' : template ? 'All changes saved' : 'No changes yet'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-full"
            title={isActive ? 'Active: writers can choose this template' : 'Inactive: hidden from writers'}
          >
            <span className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
            </span>
            <span className="text-sm font-medium text-gray-700">{isActive ? 'Active' : 'Inactive'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save template'}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-3 gap-y-2">
          <div>
            <label className={fieldLabel} htmlFor="letter-category">Category</label>
            <div className="relative">
              <select
                id="letter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white appearance-none"
              >
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                {!CATEGORY_OPTIONS.some((c) => c.value === category) && <option value={category}>{category}</option>}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div ref={disciplineRef} className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Discipline
            </label>
            <button
              type="button"
              onClick={() => setDisciplineOpen(!disciplineOpen)}
              className="w-full h-8 text-xs border rounded-lg px-2.5 py-1.5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white border-gray-300"
            >
              <span className={discipline ? 'text-gray-900' : 'text-gray-400'}>
                {discipline || 'Select or create a discipline'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {disciplineOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={disciplineSearch}
                    onChange={(e) => setDisciplineSearch(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Search or type a new discipline..."
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredDisciplines.map((d) => (
                    <button
                      key={d}
                      onClick={() => handleSelectDiscipline(d)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-sky-50 transition-colors ${
                        discipline === d ? 'bg-sky-50 text-sky-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                  {filteredDisciplines.length === 0 && !canCreateNew && (
                    <p className="px-3 py-2 text-xs text-gray-400">No disciplines found</p>
                  )}
                </div>
                {canCreateNew && (
                  <button
                    onClick={handleCreateDiscipline}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-sky-600 hover:bg-sky-50 border-t border-gray-100 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create "{disciplineSearch.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <select
                value={clinicBranch ?? ''}
                onChange={(e) => setClinicBranch(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-8 text-xs border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white appearance-none"
              >
                <option value="">All Locations</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={fieldLabel} htmlFor="letter-description">Description <span className="normal-case font-normal text-gray-400">(opt.)</span></label>
            <input
              id="letter-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              className="w-full h-8 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              placeholder="When to use this template"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

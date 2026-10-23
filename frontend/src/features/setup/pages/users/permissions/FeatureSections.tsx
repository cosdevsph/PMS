import React from 'react';
import { Loader2, Save, SearchX, Undo2 } from 'lucide-react';
import type { AccessLevel } from '../../../services/PermissionGroupService';
import { AccessBadge, LevelDropdown } from './AccessControl';
import { ACCESS_OPTIONS, FEATURE_SECTIONS } from './meta';

interface Props {
  /** Saved levels with any unsaved choices applied on top. */
  activeMap: Record<string, AccessLevel>;
  savedMap: Record<string, AccessLevel>;
  /** False when the viewer may not change this group: levels are shown as plain badges. */
  canEdit: boolean;
  /** Who the levels are about, shown before every level: "<audience> can: | Edit |". */
  audience: string;
  query: string;
  onChange: (key: string, level: AccessLevel) => void;
  /** Save / discard the unsaved choices of ONE card (the keys of that card). */
  onSaveSection: (sectionLabel: string, keys: string[]) => void;
  onDiscardSection: (keys: string[]) => void;
  /** Label of the card currently being saved, if any. */
  savingSection: string | null;
  /** Extra content rendered at the bottom of a card, keyed by the section label. */
  extras?: Record<string, React.ReactNode>;
  /** The viewer's own level per feature; a level above it cannot be chosen. Omit for the Owner. */
  ceiling?: Record<string, AccessLevel>;
}

const levelOf = (map: Record<string, AccessLevel>, key: string): AccessLevel => map[key] ?? 'none';

/** The feature matrix: one card per area, one row per feature. */
export const FeatureSections: React.FC<Props> = ({
  activeMap, savedMap, canEdit, audience, query, onChange, onSaveSection, onDiscardSection, savingSection, extras, ceiling,
}) => {
  const q = query.trim().toLowerCase();

  const sections = FEATURE_SECTIONS
    .map((section) => ({
      ...section,
      rows: q
        ? section.keys.filter((row) => `${row.label} ${section.label} ${row.hint ?? ''}`.toLowerCase().includes(q))
        : section.keys,
    }))
    .filter((section) => section.rows.length > 0);

  if (sections.length === 0) {
    return (
      <div className="text-center py-14 text-gray-400">
        <SearchX className="w-9 h-9 mx-auto mb-3 opacity-40" aria-hidden="true" />
        <p className="text-sm">No feature matches &ldquo;{query}&rdquo;.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      {sections.map((section) => {
        const Icon = section.icon;
        const sectionKeys = section.keys.map((row) => row.key);
        const counts = { edit: 0, view: 0, none: 0 };
        sectionKeys.forEach((key) => { counts[levelOf(activeMap, key)] += 1; });
        const changedKeys = sectionKeys.filter((key) => levelOf(activeMap, key) !== levelOf(savedMap, key));
        const saving = savingSection === section.label;
        const extra = extras?.[section.label];

        return (
          <section
            key={section.label}
            className={`bg-white rounded-2xl border shadow-xs transition-colors ${
              changedKeys.length ? 'border-amber-300' : 'border-gray-200'
            } ${extra ? 'xl:col-span-2' : ''}`}
          >
            <header className="px-5 py-4 flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">{section.label}</h3>
                  <p className="text-xs text-gray-400 leading-snug">{section.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                    {ACCESS_OPTIONS.slice().reverse().map((opt) => (
                      <span key={opt.value} className="inline-flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} aria-hidden="true" />
                        {counts[opt.value]} {opt.value === 'none' ? 'no access' : opt.value === 'view' ? 'view only' : 'can edit'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </header>

            <ul className="divide-y divide-gray-100">
              {section.rows.map((row) => {
                const level = levelOf(activeMap, row.key);
                const changed = level !== levelOf(savedMap, row.key);
                return (
                  <li
                    key={row.key}
                    className={`px-5 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ${changed ? 'bg-amber-50/60' : ''} ${
                      !extra && !changedKeys.length ? 'last:rounded-b-2xl' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                        {row.label}
                        {changed && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Changed</span>
                        )}
                      </p>
                      {row.hint && <p className="text-[11px] text-gray-400 leading-snug mt-0.5 max-w-xl">{row.hint}</p>}
                    </div>
                    <div className="flex items-center gap-2.5 ml-auto">
                      <span className="text-xs text-gray-500 whitespace-nowrap">{audience} can:</span>
                      {canEdit
                        ? <LevelDropdown value={level} onChange={(v) => onChange(row.key, v)} label={row.label} audience={audience} changed={changed} maxLevel={ceiling ? (ceiling[row.key] ?? 'none') : undefined} />
                        : <AccessBadge value={level} />}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Appears only on a card that has unsaved changes */}
            {changedKeys.length > 0 && (
              <div
                role="status"
                className={`flex items-center justify-between gap-3 flex-wrap px-5 py-3 border-t border-amber-200 bg-amber-50 ${extra ? '' : 'rounded-b-2xl'}`}
              >
                <p className="text-xs font-semibold text-amber-800">
                  {changedKeys.length} unsaved change{changedKeys.length !== 1 ? 's' : ''} in {section.label}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDiscardSection(sectionKeys)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Undo2 className="w-3.5 h-3.5" aria-hidden="true" /> Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => onSaveSection(section.label, sectionKeys)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}

            {extra}
          </section>
        );
      })}
    </div>
  );
};

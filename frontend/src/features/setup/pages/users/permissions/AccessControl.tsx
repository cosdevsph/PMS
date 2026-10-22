import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { AccessLevel } from '../../../services/PermissionGroupService';
import { ACCESS_OPTIONS } from './meta';

const DESCRIPTIONS: Record<AccessLevel, string> = {
  none: 'Cannot see or use this',
  view: 'Can see it, cannot change anything',
  edit: 'Can see it and make changes',
};

/** Read-only pill showing one access level (used when the viewer cannot change permissions). */
export const AccessBadge: React.FC<{ value: AccessLevel }> = ({ value }) => {
  const opt = ACCESS_OPTIONS.find((o) => o.value === value) ?? ACCESS_OPTIONS[0];
  const Icon = opt.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${opt.badge}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {opt.label}
    </span>
  );
};

/**
 * The level pill as a dropdown: click it to choose No Access, View or Edit.
 * Opens upward when there is not enough room below.
 */
export const LevelDropdown: React.FC<{
  value: AccessLevel;
  onChange: (value: AccessLevel) => void;
  label: string;
  /** Who the level is about, e.g. "Your branch managers". Used for the screen-reader name. */
  audience: string;
  changed?: boolean;
}> = ({ value, onChange, label, audience, changed }) => {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const current = ACCESS_OPTIONS.find((o) => o.value === value) ?? ACCESS_OPTIONS[0];
  const CurrentIcon = current.icon;

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    setDropUp(!!rect && window.innerHeight - rect.bottom < 230);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const index = Math.max(0, ACCESS_OPTIONS.findIndex((o) => o.value === value));
    optionRefs.current[index]?.focus();
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, value]);

  const move = (from: number, step: number) => {
    const next = (from + step + ACCESS_OPTIONS.length) % ACCESS_OPTIONS.length;
    optionRefs.current[next]?.focus();
  };

  const onMenuKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); move(index, 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(index, -1); }
    else if (e.key === 'Tab') { setOpen(false); }
  };

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}. ${audience} can: ${current.label}. Change access level`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold pl-2.5 pr-2 py-1 rounded-full border transition-all hover:shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${current.badge} ${
          changed ? 'ring-2 ring-amber-300' : ''
        }`}
      >
        <CurrentIcon className="w-3 h-3" aria-hidden="true" />
        {current.label}
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={`${label} access level`}
          className={`absolute right-0 z-30 w-64 rounded-xl border border-gray-200 bg-white shadow-xl p-1.5 ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
        >
          {ACCESS_OPTIONS.map((opt, index) => {
            const Icon = opt.icon;
            const selected = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  ref={(el) => { optionRefs.current[index] = el; }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onKeyDown={(e) => onMenuKey(e, index)}
                  onClick={() => { setOpen(false); triggerRef.current?.focus(); if (!selected) onChange(opt.value); }}
                  className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:bg-sky-50 hover:bg-sky-50 ${selected ? 'bg-gray-50' : ''}`}
                >
                  <span className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${opt.badge}`}>
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800">{opt.label}</span>
                    <span className="block text-[11px] text-gray-400 leading-snug">{DESCRIPTIONS[opt.value]}</span>
                  </span>
                  {selected && <Check className="w-4 h-4 text-sky-600 mt-1 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

import React from 'react';
import type { OutcomeItem } from '../../outcomes.types';

interface Props {
  item: OutcomeItem;
  value: number | boolean | undefined;
  onChange: (v: number | boolean) => void;
  disabled?: boolean;
}

/** Single choice (the instrument's own options) and yes / no, shown as a list of radio options. */
export const ChoiceInput: React.FC<Props> = ({ item, value, onChange, disabled }) => {
  const options: { key: string; label: string; selected: boolean; pick: () => void }[] =
    item.type === 'yes_no'
      ? [
          { key: 'yes', label: 'Yes', selected: value === true, pick: () => onChange(true) },
          { key: 'no', label: 'No', selected: value === false, pick: () => onChange(false) },
        ]
      : (item.options ?? []).map((o) => ({
          key: String(o.value), label: o.label, selected: value === o.value, pick: () => onChange(o.value),
        }));

  return (
    <div role="radiogroup" aria-label={item.prompt} className="space-y-1.5">
      {options.map((o) => (
        <label
          key={o.key}
          className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
            o.selected ? 'border-sky-500 bg-sky-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name={`item-${item.id}`}
            checked={o.selected}
            disabled={disabled}
            onChange={o.pick}
            className="mt-0.5 accent-sky-600"
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
};

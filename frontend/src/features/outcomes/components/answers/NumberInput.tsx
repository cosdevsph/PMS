import React from 'react';
import type { OutcomeItem } from '../../outcomes.types';

interface Props {
  item: OutcomeItem;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  disabled?: boolean;
}

export const NumberInput: React.FC<Props> = ({ item, value, onChange, disabled }) => (
  <div className="flex items-center gap-2">
    <input
      type="number"
      inputMode="decimal"
      min={item.min}
      max={item.max}
      step={item.step ?? 1}
      value={value ?? ''}
      disabled={disabled}
      aria-label={item.prompt}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      className="w-32 h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
    />
    {item.unit && <span className="text-sm text-slate-500">{item.unit}</span>}
    {(item.min !== undefined || item.max !== undefined) && (
      <span className="text-xs text-slate-400">{item.min} to {item.max}</span>
    )}
  </div>
);

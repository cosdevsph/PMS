import React from 'react';
import type { OutcomeItem } from '../../outcomes.types';
import { RangeTrack } from './RangeTrack';

interface Props {
  item: OutcomeItem;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  disabled?: boolean;
}

/** A continuous slider that saves the exact number shown; it starts unanswered. */
export const SliderInput: React.FC<Props> = ({ item, value, onChange, disabled }) => {
  const min = item.min ?? 0;
  const max = item.max ?? 100;
  const answered = value !== undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-slate-500">{answered ? 'Selected value' : 'Move the slider to answer'}</span>
        <span className={`text-2xl font-bold tabular-nums ${answered ? 'text-sky-700' : 'text-slate-300'}`} aria-live="polite">
          {answered ? value : '–'}
          {answered && item.unit ? <span className="ml-1 text-sm font-medium text-slate-500">{item.unit}</span> : null}
        </span>
      </div>
      <RangeTrack
        min={min}
        max={max}
        step={item.step ?? 1}
        value={value}
        onChange={onChange}
        label={item.prompt}
        unit={item.unit}
        disabled={disabled}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}{item.anchors?.min ? ` – ${item.anchors.min}` : ''}</span>
        {item.anchors?.mid && <span className="text-center">{item.anchors.mid}</span>}
        <span className="text-right">{max}{item.anchors?.max ? ` – ${item.anchors.max}` : ''}</span>
      </div>
      {answered && item.required === false && (
        <button type="button" onClick={() => onChange(undefined)} className="mt-2 text-xs text-slate-500 underline">
          Clear answer
        </button>
      )}
    </div>
  );
};

import React from 'react';
import type { OutcomeItem } from '../../outcomes.types';
import { RangeTrack } from './RangeTrack';

interface Props {
  item: OutcomeItem;
  value: number | undefined;
  onChange: (v: number) => void;
  disabled?: boolean;
}

/**
 * A numbered rating scale. The coloured bar can be tapped on a number, and the track beneath it can be dragged;
 * both snap to whole steps and nothing is selected until the person answers.
 */
export const NrsInput: React.FC<Props> = ({ item, value, onChange, disabled }) => {
  const min = item.min ?? 0;
  const max = item.max ?? 10;
  const step = item.step ?? 1;
  const values: number[] = [];
  for (let v = min; v <= max; v += step) values.push(v);

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={item.prompt}
        className="flex h-12 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 shadow-inner"
      >
        {values.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(n)}
              className={`flex-1 text-sm sm:text-base font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:opacity-60 ${
                selected ? 'bg-white/35 ring-2 ring-inset ring-white' : 'hover:bg-white/15'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {(item.anchors?.min || item.anchors?.max) && (
        <div className="mt-1.5 flex justify-between gap-4 text-xs sm:text-sm text-slate-500">
          <span>{item.anchors?.min}</span>
          <span className="text-right">{item.anchors?.max}</span>
        </div>
      )}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <RangeTrack min={min} max={max} step={step} value={value} onChange={onChange} label={item.prompt} disabled={disabled} />
        </div>
        <div
          className={`w-14 h-11 shrink-0 rounded-lg flex items-center justify-center text-lg font-bold tabular-nums ${
            value === undefined ? 'bg-slate-100 text-slate-300' : 'bg-emerald-600 text-white'
          }`}
          aria-live="polite"
        >
          {value === undefined ? '–' : value}
        </div>
      </div>
    </div>
  );
};

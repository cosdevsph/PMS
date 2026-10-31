import React from 'react';

interface Props {
  min: number;
  max: number;
  step: number;
  /** Undefined until the person answers: no default position is recorded. */
  value: number | undefined;
  onChange: (v: number) => void;
  label: string;
  unit?: string;
  disabled?: boolean;
}

/**
 * A draggable track (mouse, touch and keyboard). The value is committed when the person drags, taps the track or
 * presses a key, so a slider that was never touched is not an answer.
 */
export const RangeTrack: React.FC<Props> = ({ min, max, step, value, onChange, label, unit, disabled }) => {
  const answered = value !== undefined;
  const shown = answered ? value : min;
  const percent = ((shown - min) / (max - min)) * 100;
  const commit = (el: HTMLInputElement) => onChange(el.valueAsNumber);

  return (
    <div className="relative py-3 touch-none">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-200" aria-hidden="true">
        {answered && <div className="h-2 rounded-full bg-sky-500" style={{ width: `${percent}%` }} />}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        disabled={disabled}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={answered ? shown : undefined}
        aria-valuetext={answered ? `${shown}${unit ? ` ${unit}` : ''}` : 'Not answered'}
        onChange={(e) => commit(e.currentTarget)}
        onPointerUp={(e) => commit(e.currentTarget)}
        onKeyUp={(e) => { if (e.key.startsWith('Arrow') || e.key.startsWith('Page') || e.key === 'Home' || e.key === 'End') commit(e.currentTarget); }}
        className={`relative w-full h-7 appearance-none bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow
          [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
          ${answered
            ? '[&::-webkit-slider-thumb]:bg-sky-600 [&::-moz-range-thumb]:bg-sky-600'
            : '[&::-webkit-slider-thumb]:bg-slate-300 [&::-moz-range-thumb]:bg-slate-300'}`}
      />
    </div>
  );
};

import React from 'react';
import type { AssessmentScores } from '../outcomes.types';
import { directionText } from '../outcomes.utils';

/** Shows the saved score(s). No interpretation or "improvement" wording: the instrument supplies none yet. */
export const ScoreSummary: React.FC<{ scores: AssessmentScores }> = ({ scores }) => {
  const total = scores.total;
  const subs = Object.entries(scores.subscales ?? {});
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      {scores.method === 'external' ? (
        <p className="text-sm text-slate-600">This measure is scored by its owner's scoring service; no score is calculated here.</p>
      ) : total && total.valid && total.score !== null ? (
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-sky-700 tabular-nums">{total.score}</span>
          {total.range && <span className="text-sm text-slate-500">out of {total.range[1]}</span>}
        </div>
      ) : (
        <p className="text-sm text-amber-700">No score: too many answers were missing for this measure's scoring rule.</p>
      )}
      {subs.length > 0 && (
        <ul className="text-sm text-slate-700 space-y-0.5">
          {subs.map(([id, s]) => (
            <li key={id} className="flex justify-between gap-4">
              <span>{s.name ?? id}</span>
              <span className="font-semibold tabular-nums">{s.valid && s.score !== null ? s.score : 'no score'}</span>
            </li>
          ))}
        </ul>
      )}
      {directionText(scores.direction) && <p className="text-xs text-slate-500">{directionText(scores.direction)}</p>}
    </div>
  );
};

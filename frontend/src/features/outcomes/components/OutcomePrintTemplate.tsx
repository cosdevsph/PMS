import React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { OutcomeAssessmentDetail } from '../outcomes.types';
import { answerText, directionText, formatStamp, resultScore } from '../outcomes.utils';
import type { OutcomeGroup } from '../outcomes.utils';

interface Props {
  group: OutcomeGroup;
  /** The newest result with its questions and answers. */
  detail: OutcomeAssessmentDetail | null;
  patientName: string;
  caseTitle?: string;
  clinicName?: string;
  clinicLogoUrl?: string;
}

const MAX_ROWS = 20;

/** A4 report of one measure in one case: scores over time, who recorded them, and the newest answers. */
export const OutcomePrintTemplate: React.FC<Props> = ({ group, detail, patientName, caseTitle, clinicName, clinicLogoUrl }) => {
  const range = group.latest?.scores.total?.range ?? null;
  const chronological = [...group.active].reverse().filter((r) => resultScore(r) !== null);
  const chart = chronological.map((r) => ({
    date: new Date(r.assessed_on).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' }),
    score: resultScore(r) as number,
  }));
  const latestScore = resultScore(group.latest);
  const previousScore = resultScore(group.previous);

  return (
    <div className="bg-white text-slate-900 p-10" style={{ width: 794, minHeight: 1122 }}>
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Outcome Measure Report</p>
          <h1 className="text-2xl font-bold mt-1">{group.name}</h1>
          <p className="text-sm text-slate-600 mt-1">Patient: <span className="font-semibold">{patientName}</span>{caseTitle ? ` · Case: ${caseTitle}` : ''}</p>
        </div>
        <div className="text-right">
          {clinicLogoUrl && <img src={clinicLogoUrl} alt="" crossOrigin="anonymous" className="ml-auto mb-1 max-h-12 w-auto" />}
          {clinicName && <p className="text-sm font-semibold">{clinicName}</p>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 text-sm">
        <p><span className="text-slate-500">Created by:</span> <span className="font-medium">{group.created.by || 'Unknown'}</span>, {formatStamp(group.created.at)}</p>
        <p><span className="text-slate-500">Modified by:</span> <span className="font-medium">{group.modified.by || 'Unknown'}</span>, {formatStamp(group.modified.at)}</p>
      </div>

      <div className="mt-5 flex items-end gap-8">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Latest score</p>
          <p className="text-4xl font-bold text-sky-700 tabular-nums">{latestScore ?? 'No score'}{latestScore !== null && range ? <span className="text-base font-medium text-slate-500"> / {range[1]}</span> : null}</p>
        </div>
        {previousScore !== null && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Previous score</p>
            <p className="text-2xl font-semibold text-slate-700 tabular-nums">{previousScore}</p>
          </div>
        )}
        <p className="text-xs text-slate-500 pb-1">{directionText(group.latest?.scores.direction)}</p>
      </div>

      {chart.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold mb-1">Progress in this case</p>
          <LineChart width={714} height={210} data={chart} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={range ? [range[0], range[1]] : ['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
          </LineChart>
        </div>
      )}

      <div className="mt-5">
        <p className="text-sm font-semibold mb-1">Results recorded</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-1.5 pr-3">Date</th><th className="py-1.5 pr-3">Score</th><th className="py-1.5 pr-3">Recorded by</th><th className="py-1.5">Version</th>
            </tr>
          </thead>
          <tbody>
            {group.results.slice(0, MAX_ROWS).map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-1.5 pr-3">{formatStamp(r.completed_at)}</td>
                <td className="py-1.5 pr-3 font-semibold tabular-nums">{r.status === 'VOIDED' ? 'Voided' : (resultScore(r) ?? 'No score')}</td>
                <td className="py-1.5 pr-3">{r.created_by_name || '—'}</td>
                <td className="py-1.5">v{r.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {group.results.length > MAX_ROWS && <p className="mt-1 text-xs text-slate-500">Showing the latest {MAX_ROWS} of {group.results.length} results.</p>}
      </div>

      {detail && (
        <div className="mt-5">
          <p className="text-sm font-semibold mb-1">Latest answers ({formatStamp(detail.completed_at)})</p>
          <ol className="space-y-1.5 text-sm">
            {detail.items.map((item, i) => (
              <li key={item.id} className="flex justify-between gap-6 border-b border-slate-100 pb-1">
                <span className="text-slate-700">{detail.items.length > 1 ? `${i + 1}. ` : ''}{item.prompt}</span>
                <span className="shrink-0 font-semibold tabular-nums">{answerText(item, detail.answers)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="mt-8 text-[11px] text-slate-400">Printed {formatStamp(new Date().toISOString())}</p>
    </div>
  );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2 } from 'lucide-react';
import { getTrend } from '../outcomes.api';
import { directionText, formatStamp } from '../outcomes.utils';

const COLORS = ['#0284c7', '#7c3aed', '#059669', '#d97706'];

/** Scores over time. Results scored by different rules are drawn as separate lines, never joined. */
export const TrendChart: React.FC<{ patientId: number; code: string; caseId?: number | null; height?: number }> = ({ patientId, code, caseId, height = 256 }) => {
  const { data, isLoading, isError } = useQuery({ queryKey: ['outcomes', 'trend', patientId, code, caseId ?? null], queryFn: () => getTrend(patientId, code, caseId) });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>;
  if (isError) return <p className="text-sm text-rose-600">The graph could not be loaded.</p>;
  if (!data || data.points.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">No scored assessments yet for this measure.</p>;
  }

  const keys = Array.from(new Set(data.points.map((p) => p.scoring_key)));
  // Every point has its own key (the result's id). Two results on the same day must not share an x value, or the
  // tooltip would show the first of them whichever one is hovered.
  const byId = new Map(data.points.map((p) => [p.id, p]));
  const rows = data.points.map((p) => ({
    id: p.id,
    ...Object.fromEntries(keys.map((k) => [`s_${k}`, p.scoring_key === k ? p.score : null])),
  }));
  const shortDate = (id: number) => {
    const p = byId.get(id);
    return p ? new Date(p.assessed_on).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' }) : '';
  };
  const range = data.measure?.range;

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="id" tickFormatter={(id) => shortDate(Number(id))} tick={{ fontSize: 11 }} />
            <YAxis domain={range ? [range[0], range[1]] : ['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(id) => {
                const p = byId.get(Number(id));
                return p ? `${formatStamp(p.completed_at)} · v${p.version}` : '';
              }}
            />
            {keys.length > 1 && <Legend formatter={(_v, _e, i) => `Scoring rules ${i + 1}`} />}
            {keys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={`s_${k}`} name="Score" stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-2">{directionText(data.measure?.direction)}</p>
      {keys.length > 1 && <p className="text-xs text-amber-700 mt-1">This measure's scoring changed between versions, so those results are shown as separate lines.</p>}
    </div>
  );
};

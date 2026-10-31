import type { Answers, OutcomeAssessment, OutcomeItem, ScoreDirection } from './outcomes.types';

export const directionText = (d?: ScoreDirection | null): string =>
  d === 'higher_worse' ? 'A higher score means more symptoms or disability.'
    : d === 'higher_better' ? 'A higher score means better function or health.'
      : '';

/** How a saved answer reads to a person (the option's label, Yes / No, or the number with its unit). */
export const answerText = (item: OutcomeItem, answers: Answers): string => {
  const v = answers[item.id];
  if (v === undefined) return 'Not answered';
  if (item.type === 'yes_no') return v ? 'Yes' : 'No';
  if (item.type === 'single_choice') return item.options?.find((o) => o.value === v)?.label ?? String(v);
  return `${v}${item.unit ? ` ${item.unit}` : ''}`;
};

/** "5 Aug 2026, 4:27 PM": always a 12-hour clock with AM / PM. */
export const formatStamp = (iso: string): string => {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}, ${time}`;
};

export interface Stamp { by: string; at: string }

/** All the results of one measure in one case, shown as a single History card. */
export interface OutcomeGroup {
  code: string;
  name: string;
  abbreviation: string;
  patientId: number;
  caseId: number | null;
  /** Newest first, voided ones included. */
  results: OutcomeAssessment[];
  /** Newest first, voided ones left out. */
  active: OutcomeAssessment[];
  latest: OutcomeAssessment | null;
  previous: OutcomeAssessment | null;
  created: Stamp;
  modified: Stamp;
  /** When the card last changed (milliseconds): places it in the timeline. */
  lastActivity: number;
}

const scoreOf = (a: OutcomeAssessment | null) => (a && a.scores.total?.valid && a.scores.total.score !== null ? a.scores.total.score : null);
export const resultScore = scoreOf;

/**
 * Groups saved results by measure (the list is already limited to one case). Each result stays its own saved record;
 * the card is created by the first result and modified by the latest result or void.
 */
export const groupAssessments = (assessments: OutcomeAssessment[]): OutcomeGroup[] => {
  const byCode = new Map<string, OutcomeAssessment[]>();
  for (const a of assessments) byCode.set(a.code, [...(byCode.get(a.code) ?? []), a]);

  const groups: OutcomeGroup[] = [];
  for (const [code, rows] of byCode) {
    const results = [...rows].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    const active = results.filter((r) => r.status === 'COMPLETED');
    const oldest = results[results.length - 1];

    // every change to the card: a result being recorded, or being voided
    const events: Stamp[] = results.flatMap((r) => [
      { by: r.created_by_name, at: r.completed_at },
      ...(r.voided_at ? [{ by: r.voided_by_name, at: r.voided_at }] : []),
    ]);
    const modified = events.reduce((latest, e) => (new Date(e.at) > new Date(latest.at) ? e : latest));
    const head = results[0];

    groups.push({
      code,
      name: head.measure_name,
      abbreviation: head.abbreviation,
      patientId: head.patient,
      caseId: head.patient_case,
      results,
      active,
      latest: active[0] ?? null,
      previous: active[1] ?? null,
      created: { by: oldest.created_by_name, at: oldest.completed_at },
      modified,
      lastActivity: new Date(modified.at).getTime(),
    });
  }
  return groups.sort((a, b) => b.lastActivity - a.lastActivity);
};

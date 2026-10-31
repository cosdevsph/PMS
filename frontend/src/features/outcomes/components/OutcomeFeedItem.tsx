import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, ClipboardList, Mail, Printer } from 'lucide-react';
import { usePatientProfileContext } from '@/features/patients/context/PatientProfileContext';
import { getMyClinic } from '@/features/clinics/clinic.api';
import { formatStamp, resultScore } from '../outcomes.utils';
import type { OutcomeGroup } from '../outcomes.utils';
import { AssessmentDetailModal } from './AssessmentDetailModal';
import { PrintOutcomeModal } from './PrintOutcomeModal';
import { SendOutcomeEmailModal } from './SendOutcomeEmailModal';
import { TrendChart } from './TrendChart';

const iconButton = 'p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400';

/**
 * One History card for one measure in one case. Recording the measure again adds a result to this card (and a point
 * to its graph) instead of a new card; every result stays a saved record of its own.
 */
export const OutcomeFeedItem: React.FC<{ group: OutcomeGroup; canEdit: boolean }> = ({ group, canEdit }) => {
  const { patient, cases } = usePatientProfileContext();
  const { data: clinic } = useQuery({ queryKey: ['myClinic'], queryFn: getMyClinic });
  const [showResults, setShowResults] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [printing, setPrinting] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const patientName = patient ? `${patient.first_name} ${patient.last_name}` : '';
  const caseTitle = cases.find((c) => c.id === group.caseId)?.title;
  const latestScore = resultScore(group.latest);
  const previousScore = resultScore(group.previous);
  const range = group.latest?.scores.total?.range ?? null;
  const hasActive = group.active.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <ClipboardList className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{group.name}</p>
          <p className="text-xs text-slate-500">
            {group.latest ? `v${group.latest.version} · ` : ''}{group.results.length} {group.results.length === 1 ? 'result' : 'results'} recorded
          </p>
          <p className="mt-1.5 text-xs text-slate-600"><span className="text-slate-400">Created by:</span> <span className="font-medium">{group.created.by || 'Unknown'}</span> · {formatStamp(group.created.at)}</p>
          <p className="text-xs text-slate-600"><span className="text-slate-400">Modified by:</span> <span className="font-medium">{group.modified.by || 'Unknown'}</span> · {formatStamp(group.modified.at)}</p>
        </div>
        {latestScore !== null ? (
          <div className="text-right">
            <p className="text-2xl font-bold leading-none text-sky-700 tabular-nums" aria-label={`Latest score ${latestScore}`}>{latestScore}</p>
            {range && <p className="text-[11px] text-slate-400">out of {range[1]}</p>}
            {previousScore !== null && <p className="mt-1 text-[11px] text-slate-500">previous {previousScore}</p>}
          </div>
        ) : (
          <p className="text-xs text-slate-400">{hasActive ? 'No score' : 'All voided'}</p>
        )}
      </div>

      {hasActive && (
        <div className="px-3 pb-1">
          <p className="px-1 text-xs font-medium text-slate-500">{group.name} progress in this case</p>
          <TrendChart patientId={group.patientId} code={group.code} caseId={group.caseId} height={180} />
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5">
        <button type="button" onClick={() => setShowResults((v) => !v)} aria-expanded={showResults} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50">
          {showResults ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Results ({group.results.length})
        </button>
        <div className="flex items-center gap-0.5">
          <button type="button" title="Print Outcome Measure" aria-label="Print Outcome Measure" disabled={!hasActive} onClick={() => setPrinting(true)} className={iconButton}><Printer className="h-4 w-4" /></button>
          <button type="button" title="Send via Email" aria-label="Send via Email" disabled={!hasActive || !canEdit} onClick={() => setEmailing(true)} className={iconButton}><Mail className="h-4 w-4" /></button>
        </div>
      </div>

      {showResults && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {group.results.map((r) => {
            const score = resultScore(r);
            return (
              <li key={r.id}>
                <button type="button" onClick={() => setOpenId(r.id)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${r.status === 'VOIDED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{formatStamp(r.completed_at)}</p>
                    <p className="text-xs text-slate-500">{r.created_by_name || 'Unknown'} · v{r.version}{r.status === 'VOIDED' ? ` · voided by ${r.voided_by_name || 'unknown'}` : ''}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-sky-700">{r.status === 'COMPLETED' && score !== null ? score : ''}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {openId !== null && <AssessmentDetailModal id={openId} canEdit={canEdit} onClose={() => setOpenId(null)} />}
      {printing && (
        <PrintOutcomeModal group={group} patientName={patientName} caseTitle={caseTitle} clinicName={clinic?.name} clinicLogoUrl={clinic?.logo_url ?? undefined} onClose={() => setPrinting(false)} />
      )}
      {emailing && (
        <SendOutcomeEmailModal group={group} patientName={patientName} patientEmail={patient?.email || ''} caseTitle={caseTitle} clinicName={clinic?.name} clinicLogoUrl={clinic?.logo_url ?? undefined} onClose={() => setEmailing(false)} />
      )}
    </div>
  );
};

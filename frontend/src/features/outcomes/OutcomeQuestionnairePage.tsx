import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPatient } from '@/features/patients/patient.api';
import { apiErrorLines, createAssessment, getEnabledDefinitions } from './outcomes.api';
import type { Answers, OutcomeItem } from './outcomes.types';
import { ChoiceInput } from './components/answers/ChoiceInput';
import { NrsInput } from './components/answers/NrsInput';
import { NumberInput } from './components/answers/NumberInput';
import { SliderInput } from './components/answers/SliderInput';
import { PasswordConfirmDialog } from './components/PasswordConfirmDialog';

const circleButton =
  'w-12 h-12 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 disabled:cursor-not-allowed';

/**
 * Full-page questionnaire: description, then one question per page with Previous / Next, then Save and a password
 * check. Reached from the Outcomes tab; returns to the case's workspace afterwards.
 */
export const OutcomeQuestionnairePage: React.FC = () => {
  const { patientId, caseId, definitionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = useLocation().state as { appointmentId?: number } | null;

  const pid = Number(patientId);
  const cid = Number(caseId);
  const workspaceUrl = `/patients/${pid}/cases/${cid}/clinical-documentation`;

  const patient = useQuery({ queryKey: ['patient', pid], queryFn: () => getPatient(pid) });
  const definitions = useQuery({ queryKey: ['outcomes', 'definitions'], queryFn: getEnabledDefinitions });
  const definition = useMemo(
    () => definitions.data?.find((d) => d.id === Number(definitionId)),
    [definitions.data, definitionId],
  );
  const items: OutcomeItem[] = definition?.definition.items ?? [];

  // step -1 is the description page; 0..n-1 are the questions
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [askPassword, setAskPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pageErrors, setPageErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const dirty = !saved && Object.keys(answers).length > 0;
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: (password: string) => createAssessment({
      patient: pid, definition: definition!.id, answers, password,
      patient_case: cid, appointment: state?.appointmentId ?? null,
    }),
    onSuccess: () => {
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['outcomes'] });
      toast.success('Outcome measure saved');
      navigate(workspaceUrl, { replace: true });
    },
    onError: (err) => {
      const data = (err as { response?: { data?: Record<string, unknown>; status?: number } })?.response?.data;
      if (data && data.password) {
        setPasswordError(String(Array.isArray(data.password) ? data.password[0] : data.password));
      } else if ((err as { response?: { status?: number } })?.response?.status === 429) {
        setPasswordError(String(data?.detail ?? 'Too many incorrect passwords. Please try again in 15 minutes.'));
      } else {
        setAskPassword(false);
        setPageErrors(apiErrorLines(err));
      }
    },
  });

  const exit = () => {
    if (dirty && !window.confirm('Leave without saving? Your answers will be lost.')) return;
    setSaved(true); // the leave warning is no longer needed
    navigate(workspaceUrl);
  };

  const setAnswer = (item: OutcomeItem, value: number | boolean | undefined) => {
    setPageErrors([]);
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined || (typeof value === 'number' && Number.isNaN(value))) delete next[item.id];
      else next[item.id] = value;
      return next;
    });
  };

  const renderInput = (item: OutcomeItem) => {
    const value = answers[item.id];
    switch (item.type) {
      case 'nrs': return <NrsInput item={item} value={value as number | undefined} onChange={(v) => setAnswer(item, v)} />;
      case 'slider': return <SliderInput item={item} value={value as number | undefined} onChange={(v) => setAnswer(item, v)} />;
      case 'numeric': return <NumberInput item={item} value={value as number | undefined} onChange={(v) => setAnswer(item, v)} />;
      default: return <ChoiceInput item={item} value={value} onChange={(v) => setAnswer(item, v)} />;
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-100">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6 sm:py-10">
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={exit} aria-label="Exit questionnaire" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-white hover:text-slate-800">
            <X className="h-4 w-4" /> Exit
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  if (definitions.isLoading || patient.isLoading) {
    return shell(<div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div>);
  }
  if (!definition) {
    return shell(
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-700">This outcome measure is not available. It may be switched off for your clinic.</p>
        <button type="button" onClick={() => navigate(workspaceUrl)} className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Back to the case</button>
      </div>,
    );
  }

  const total = items.length;
  const onIntro = step === -1;
  const item = onIntro ? null : items[step];
  const isLast = step === total - 1;
  const answered = item ? answers[item.id] !== undefined : false;
  const mustAnswer = item ? item.required !== false : false;
  const patientName = patient.data ? `${patient.data.first_name} ${patient.data.last_name}` : '';

  return (
    <>
      {shell(
        <div className="rounded-2xl bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{definition.name}</h1>
              {patientName && <p className="mt-0.5 text-sm text-slate-500">{patientName}</p>}
            </div>
            {!onIntro && (
              <span className="shrink-0 rounded-md bg-sky-600 px-3 py-1 text-sm font-semibold text-white tabular-nums" aria-label={`Question ${step + 1} of ${total}`}>
                {step + 1}/{total}
              </span>
            )}
          </div>
          {!onIntro && (
            <div className="h-1 bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step + 1}>
              <div className="h-1 bg-sky-500 transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
            </div>
          )}

          <div className="min-h-[18rem] px-6 py-8 sm:px-8">
            {onIntro ? (
              <div className="space-y-4">
                {definition.definition.description && <p className="text-base text-slate-700">{definition.definition.description}</p>}
                {definition.definition.instructions && (
                  <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600"><span className="font-semibold">Instructions: </span>{definition.definition.instructions}</p>
                )}
                <p className="text-sm text-slate-500">{total} {total === 1 ? 'question' : 'questions'}</p>
                <button type="button" onClick={() => setStep(0)} className="mt-2 rounded-xl bg-sky-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
                  Get Started
                </button>
              </div>
            ) : item ? (
              <div key={item.id} className="space-y-7">
                <h2 className="text-lg font-medium leading-snug text-slate-900 sm:text-xl">{item.prompt}</h2>
                {renderInput(item)}
                {mustAnswer && !answered && <p className="text-xs text-slate-400">Choose an answer to continue.</p>}
              </div>
            ) : null}
            {pageErrors.length > 0 && (
              <div role="alert" className="mt-6 space-y-0.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {pageErrors.map((e) => <p key={e}>{e}</p>)}
              </div>
            )}
          </div>

          {!onIntro && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-5 sm:px-8">
              <button type="button" onClick={() => setStep((s) => s - 1)} aria-label="Previous question" className={`${circleButton} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                <ArrowLeft className="h-5 w-5" />
              </button>
              {isLast ? (
                <button
                  type="button"
                  disabled={mustAnswer && !answered}
                  onClick={() => { setPasswordError(null); setAskPassword(true); }}
                  className="rounded-full bg-sky-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save
                </button>
              ) : (
                <button
                  type="button"
                  disabled={mustAnswer && !answered}
                  onClick={() => setStep((s) => s + 1)}
                  aria-label="Next question"
                  className={`${circleButton} bg-sky-600 text-white hover:bg-sky-700`}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>,
      )}
      {askPassword && (
        <PasswordConfirmDialog
          busy={save.isPending}
          error={passwordError}
          onBack={() => setAskPassword(false)}
          onEnter={(pw) => { setPasswordError(null); save.mutate(pw); }}
        />
      )}
    </>
  );
};

export default OutcomeQuestionnairePage;

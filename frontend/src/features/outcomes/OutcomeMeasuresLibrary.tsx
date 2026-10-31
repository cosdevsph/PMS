import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorLines, getLibrary, setLibraryEnabled } from './outcomes.api';

/** Manage → Clinical → Outcome Measures: switch platform measures on or off for this clinic. */
export const OutcomeMeasuresLibrary: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['outcomes', 'library'], queryFn: getLibrary });

  const toggle = useMutation({
    mutationFn: ({ code, enabled }: { code: string; enabled: boolean }) => setLibraryEnabled(code, enabled),
    onSuccess: (rows) => {
      queryClient.setQueryData(['outcomes', 'library'], rows);
      void queryClient.invalidateQueries({ queryKey: ['outcomes', 'definitions'] });
    },
    onError: (err) => toast.error(apiErrorLines(err).join(' ')),
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <h1 className="text-lg font-bold text-slate-900">Outcome Measures</h1>
      <p className="text-sm text-slate-500 mt-1 mb-5">
        Choose which measures your practitioners can use. Turning a measure off hides it from new assessments only;
        every result already recorded stays in the patient's history.
      </p>
      {isLoading && <Loader2 className="w-6 h-6 animate-spin text-sky-600" />}
      {isError && <p className="text-sm text-rose-600">The library could not be loaded. Only an Owner or Branch Manager can open this page.</p>}
      {data && data.length === 0 && <p className="text-sm text-slate-500">No measures are available yet.</p>}
      <ul className="space-y-2">
        {data?.map((m) => (
          <li key={m.code} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{m.name}{m.abbreviation ? <span className="ml-2 text-xs font-normal text-slate-400">{m.abbreviation}</span> : null}</p>
              {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
              <p className="text-[11px] text-slate-400 mt-0.5">Version {m.version}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={m.enabled}
              aria-label={`${m.name} ${m.enabled ? 'on' : 'off'}`}
              disabled={toggle.isPending}
              onClick={() => toggle.mutate({ code: m.code, enabled: !m.enabled })}
              className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60 ${m.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${m.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OutcomeMeasuresLibrary;

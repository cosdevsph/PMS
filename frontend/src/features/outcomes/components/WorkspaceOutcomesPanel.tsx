import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import { usePatientProfileContext } from '@/features/patients/context/PatientProfileContext';
import { useClinicalWorkspace } from '@/features/clinical-documentation/context/ClinicalWorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { getEnabledDefinitions } from '../outcomes.api';

/** Lists the measures this clinic has switched on. Choosing one opens the full-page questionnaire. */
export const WorkspaceOutcomesPanel: React.FC = () => {
  const { patient } = usePatientProfileContext();
  const { selectedCaseId } = useClinicalWorkspace();
  const { canEdit } = usePermissions();
  const navigate = useNavigate();
  const state = useLocation().state as { appointmentId?: number } | null;
  const mayEdit = canEdit('outcome_measures');
  const definitions = useQuery({ queryKey: ['outcomes', 'definitions'], queryFn: getEnabledDefinitions });

  if (!patient) return null;

  const start = (definitionId: number) =>
    navigate(`/patients/${patient.id}/cases/${selectedCaseId}/outcome-measures/${definitionId}`, {
      state: { appointmentId: state?.appointmentId },
    });

  return (
    <div className="p-4">
      <h2 className="text-sm font-bold text-slate-800 mb-1">Outcome measures</h2>
      <p className="text-xs text-slate-500 mb-3">Choose a questionnaire to complete. Saved results appear in this case's History.</p>
      {definitions.isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
      ) : (definitions.data ?? []).length === 0 ? (
        <p className="text-sm text-slate-500">
          No outcome measures are switched on for this clinic. An Owner or Branch Manager can turn them on under Manage → Clinical → Outcome Measures.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {definitions.data!.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                disabled={!mayEdit || !selectedCaseId}
                onClick={() => start(d.id)}
                title={mayEdit ? undefined : 'You can view outcome measures but not record them'}
                className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50 transition-colors disabled:opacity-60 disabled:hover:bg-white disabled:hover:border-slate-200"
              >
                <ClipboardList className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-sm font-medium text-slate-800">{d.name}</span>
                {d.abbreviation && <span className="ml-auto text-xs text-slate-400">{d.abbreviation}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

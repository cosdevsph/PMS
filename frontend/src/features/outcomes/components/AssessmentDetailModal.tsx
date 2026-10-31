import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorLines, getAssessment, voidAssessment } from '../outcomes.api';
import { answerText } from '../outcomes.utils';
import { OutcomeModal } from './OutcomeModal';
import { ScoreSummary } from './ScoreSummary';

export const AssessmentDetailModal: React.FC<{ id: number; canEdit: boolean; onClose: () => void }> = ({ id, canEdit, onClose }) => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['outcomes', 'assessment', id], queryFn: () => getAssessment(id) });
  const [reason, setReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const voidMutation = useMutation({
    mutationFn: () => voidAssessment(id, reason.trim()),
    onSuccess: () => {
      toast.success('Assessment voided');
      void queryClient.invalidateQueries({ queryKey: ['outcomes'] });
      onClose();
    },
    onError: (err) => toast.error(apiErrorLines(err).join(' ')),
  });

  return (
    <OutcomeModal title={data?.measure_name ?? 'Assessment'} subtitle={data ? `Version ${data.version} · ${new Date(data.assessed_on).toLocaleDateString()}` : undefined} onClose={onClose}>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>}
      {isError && <p className="text-sm text-rose-600">This assessment could not be loaded.</p>}
      {data && (
        <div className="space-y-4">
          {data.status === 'VOIDED' && (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">Voided: {data.void_reason}</p>
          )}
          <ScoreSummary scores={data.scores} />
          <ol className="space-y-2.5">
            {data.items.map((item, i) => (
              <li key={item.id} className="text-sm">
                <p className="text-slate-500">{data.items.length > 1 ? `${i + 1}. ` : ''}{item.prompt}</p>
                <p className="font-medium text-slate-900">{answerText(item, data.answers)}</p>
              </li>
            ))}
          </ol>
          <p className="text-xs text-slate-400">Recorded by {data.created_by_name || 'unknown'}.</p>
          {canEdit && data.status === 'COMPLETED' && (
            voiding ? (
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <label className="block text-xs font-medium text-slate-600" htmlFor="void-reason">Why is this being voided?</label>
                <input id="void-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300}
                  className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setVoiding(false)} className="px-3 py-1.5 text-sm text-slate-700 border border-slate-300 rounded-lg">Back</button>
                  <button type="button" disabled={!reason.trim() || voidMutation.isPending} onClick={() => voidMutation.mutate()}
                    className="px-3 py-1.5 text-sm text-white bg-rose-600 rounded-lg disabled:opacity-50">Void assessment</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setVoiding(true)} className="text-sm text-rose-600 hover:underline">Void this assessment</button>
            )
          )}
        </div>
      )}
    </OutcomeModal>
  );
};

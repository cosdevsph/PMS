import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2, Printer, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAssessment } from '../outcomes.api';
import type { OutcomeGroup } from '../outcomes.utils';
import { renderToPdfBlob } from '../utils/pdf';
import { OutcomePrintTemplate } from './OutcomePrintTemplate';

interface Props {
  group: OutcomeGroup;
  patientName: string;
  caseTitle?: string;
  clinicName?: string;
  clinicLogoUrl?: string;
  onClose: () => void;
}

/** Preview of the outcome report, with Print and Download PDF (same pattern as printing a clinical note). */
export const PrintOutcomeModal: React.FC<Props> = ({ group, patientName, caseTitle, clinicName, clinicLogoUrl, onClose }) => {
  const [busy, setBusy] = useState(false);
  const detail = useQuery({
    queryKey: ['outcomes', 'assessment', group.latest?.id],
    queryFn: () => getAssessment(group.latest!.id),
    enabled: !!group.latest,
  });

  const template = (
    <OutcomePrintTemplate
      group={group}
      detail={detail.data ?? null}
      patientName={patientName}
      caseTitle={caseTitle}
      clinicName={clinicName}
      clinicLogoUrl={clinicLogoUrl}
    />
  );

  const makePdf = async (): Promise<Blob | null> => {
    setBusy(true);
    try {
      return await renderToPdfBlob(template);
    } catch (err) {
      console.error('Could not create the PDF', err);
      toast.error('Could not create the PDF.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const print = async () => {
    const blob = await makePdf();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const download = async () => {
    const blob = await makePdf();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group.name.replace(/ /g, '-')}_${patientName.replace(/ /g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Print preview">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xl">
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50"><Printer className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Print Preview</h2>
              <p className="text-sm font-medium text-slate-500">{group.name} · {patientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={download} disabled={busy || detail.isLoading} className="hidden items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 sm:flex">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
            </button>
            <button type="button" onClick={print} disabled={busy || detail.isLoading} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Print
            </button>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100/80 p-5">
          <div className="mx-auto w-fit shadow-md">{template}</div>
        </div>
      </div>
    </div>
  );
};

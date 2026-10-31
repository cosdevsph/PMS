import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, FileText, Loader2, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { apiErrorLines, emailAssessment, getAssessment } from '../outcomes.api';
import type { OutcomeGroup } from '../outcomes.utils';
import { renderToPdfBlob } from '../utils/pdf';
import { OutcomePrintTemplate } from './OutcomePrintTemplate';

interface Props {
  group: OutcomeGroup;
  patientName: string;
  patientEmail: string;
  caseTitle?: string;
  clinicName?: string;
  clinicLogoUrl?: string;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails the outcome report as a PDF (same pattern as emailing a clinical note). */
export const SendOutcomeEmailModal: React.FC<Props> = ({ group, patientName, patientEmail, caseTitle, clinicName, clinicLogoUrl, onClose }) => {
  const { emailEnabled } = useClinicSettings();
  const [emails, setEmails] = useState<string[]>(patientEmail.trim() ? [patientEmail.trim()] : []);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState(`${group.name} – ${patientName}`);
  const [body, setBody] = useState(
    `Dear ${patientName},\n\nPlease find attached your ${group.name} report.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\n${clinicName ?? 'Clinic Team'}`,
  );
  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const started = useRef(false);

  const detail = useQuery({
    queryKey: ['outcomes', 'assessment', group.latest?.id],
    queryFn: () => getAssessment(group.latest!.id),
    enabled: !!group.latest,
  });

  // Build the PDF once the newest answers have loaded.
  useEffect(() => {
    if (started.current || detail.isLoading) return;
    started.current = true;
    renderToPdfBlob(
      <OutcomePrintTemplate group={group} detail={detail.data ?? null} patientName={patientName} caseTitle={caseTitle} clinicName={clinicName} clinicLogoUrl={clinicLogoUrl} />,
    )
      .then((blob) => setPdf(new File([blob], `${group.name.replace(/ /g, '-')}_${patientName.replace(/ /g, '-')}.pdf`, { type: 'application/pdf' })))
      .catch(() => { setPdfError(true); toast.error('Could not create the PDF attachment.'); });
  }, [detail.isLoading, detail.data, group, patientName, caseTitle, clinicName, clinicLogoUrl]);

  const send = useMutation({
    mutationFn: () => emailAssessment(group.results[0].id, { to: emails.join(','), subject, body, attachment: pdf! }),
    onSuccess: (r) => { toast.success(r.detail); onClose(); },
    onError: (err) => toast.error(apiErrorLines(err).join(' ')),
  });

  const addEmail = (raw: string = input) => {
    const value = raw.trim().replace(/[,;]$/, '').toLowerCase();
    if (!value) return;
    if (!EMAIL_RE.test(value)) { toast.error(`"${value}" is not a valid email address.`); return; }
    if (!emails.includes(value)) setEmails([...emails, value]);
    setInput('');
  };

  const canSend = emailEnabled && emails.length > 0 && !!pdf && !send.isPending;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Send by email">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50"><Mail className="h-5 w-5 text-sky-600" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Send Outcome Measure via Email</h2>
              <p className="text-sm text-gray-500">{group.name} · {patientName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          {!emailEnabled && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm"><span className="font-semibold">Email sending is disabled.</span> Please enable it in Clinic Settings to send emails.</p>
            </div>
          )}
          <div>
            <label htmlFor="outcome-email-to" className="mb-1.5 block text-sm font-semibold text-gray-700">To <span className="text-red-500">*</span></label>
            <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-xl border border-gray-300 bg-white p-1.5 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
              {emails.map((e) => (
                <span key={e} className="inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50 px-2.5 py-1 text-sm text-sky-700">
                  {e}
                  <button type="button" aria-label={`Remove ${e}`} onClick={() => setEmails(emails.filter((x) => x !== e))} className="rounded p-0.5 hover:bg-sky-200/50"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
              <input
                id="outcome-email-to"
                type="email"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',' || e.key === ' ') { e.preventDefault(); addEmail(); }
                  else if (e.key === 'Backspace' && !input && emails.length) setEmails(emails.slice(0, -1));
                }}
                onBlur={() => addEmail()}
                placeholder={emails.length === 0 ? 'Add email address…' : ''}
                className="min-w-[200px] flex-1 border-none bg-transparent p-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
              />
            </div>
            {emails.length === 0 && !patientEmail.trim() && <p className="mt-1 text-xs text-gray-400">This patient has no email on file; add an address.</p>}
          </div>
          <div>
            <label htmlFor="outcome-email-subject" className="mb-1.5 block text-sm font-semibold text-gray-700">Subject</label>
            <input id="outcome-email-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div>
            <label htmlFor="outcome-email-body" className="mb-1.5 block text-sm font-semibold text-gray-700">Message</label>
            <textarea id="outcome-email-body" value={body} onChange={(e) => setBody(e.target.value)} rows={7} className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <FileText className="h-4 w-4 shrink-0 text-sky-600" />
            {pdf ? <span className="truncate">{pdf.name}</span> : pdfError ? <span className="text-rose-600">The PDF could not be created.</span> : <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Preparing the PDF…</span>}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" disabled={!canSend} onClick={() => send.mutate()} className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send
          </button>
        </div>
      </div>
    </div>
  );
};

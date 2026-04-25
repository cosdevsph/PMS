import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, FilePlus, Files, FileText, Plus, Send, XCircle } from 'lucide-react';
import { usePatientProfileContext } from './context/PatientProfileContext';
import {
  getPatientConsents,
  createOrUpdateConsent,
  getClientFormRequests,
  type PatientConsentRecord,
  type ClientFormRequestRecord,
} from './patient.api';
import { AddDocumentModal } from './components/AddDocumentModal';
import { ViewConsentFormModal } from './components/ViewConsentFormModal';
import { SendConsentFormModal } from './components/SendConsentFormModal';
import { SendClientFormModal } from './components/SendClientFormModal';
import { ViewClientFormModal } from './components/ViewClientFormModal';
import { ConsentFormModal } from '@/features/patient-portal/components/ConsentFormModal';
import { formatDate } from './patientProfile.utils.tsx';

const CONSENT_TEXT =
  'I hereby give my informed consent for the clinic to collect, process, and store my personal and health information for scheduling, treatment, billing, follow-up, and related healthcare operations, in accordance with applicable data protection laws including the Data Privacy Act of 2012. I understand that my information will be handled confidentially and disclosed only when legally required or with my authorization.';

export const PatientDocumentsPage = () => {
  const { patient } = usePatientProfileContext();

  const [consents, setConsents] = useState<PatientConsentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showAddDocModal, setShowAddDocModal]         = useState(false);
  const [showSignModal, setShowSignModal]             = useState(false);
  const [viewingConsent, setViewingConsent]           = useState<PatientConsentRecord | null>(null);
  const [sendingConsent, setSendingConsent]           = useState<PatientConsentRecord | null>(null);
  const [showClientFormModal, setShowClientFormModal] = useState(false);
  const [viewingClientForm, setViewingClientForm]       = useState<ClientFormRequestRecord | null>(null);

  const [clientForms, setClientForms]       = useState<ClientFormRequestRecord[]>([]);
  const [loadingForms, setLoadingForms]     = useState(false);

  // ── Load consents ─────────────────────────────────────────────────────────
  const loadConsents = useCallback(() => {
    if (!patient) return;
    let mounted = true;
    setLoading(true);

    getPatientConsents(patient.id)
      .then((data) => {
        if (mounted) setConsents(data);
      })
      .catch(() => {
        if (mounted) setConsents([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [patient]);

  // ── Load client form requests ─────────────────────────────────────────────
  const loadClientForms = useCallback(() => {
    if (!patient) return;
    let mounted = true;
    setLoadingForms(true);

    getClientFormRequests(patient.id)
      .then((data) => { if (mounted) setClientForms(data); })
      .catch(() => {   if (mounted) setClientForms([]); })
      .finally(() => { if (mounted) setLoadingForms(false); });

    return () => { mounted = false; };
  }, [patient]);

  useEffect(() => {
    const cleanup = loadConsents();
    return cleanup;
  }, [loadConsents]);

  useEffect(() => {
    const cleanup = loadClientForms();
    return cleanup;
  }, [loadClientForms]);

  // ── Handle signed consent from ConsentFormModal ───────────────────────────
  const handleConsentSigned = async (signatureDataUrl: string, consentTextFromModal: string) => {
    if (!patient) return;
    setSaving(true);
    try {
      const saved = await createOrUpdateConsent(patient.id, {
        full_name: `${patient.first_name} ${patient.last_name}`.trim(),
        email:     patient.email ?? '',
        consent_text: consentTextFromModal || CONSENT_TEXT,
        signature: signatureDataUrl,
        type: 'CONSENT_FORM',
      });
      setConsents([saved]);
    } catch {
      // error silently — user can retry via Add button
    } finally {
      setSaving(false);
    }
  };

  if (!patient) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
        <p className="text-sm text-gray-500">Loading patient documents...</p>
      </div>
    );
  }

  const hasConsent = consents.length > 0;

  return (
    <>
      <div className="space-y-4">
        {/* ── Page header ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-heading text-gray-900">Documents</h1>
              <p className="text-sm text-gray-500 mt-1">
                Patient consent forms and legal records
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-lg text-xs font-medium text-sky-700">
                <Files className="w-4 h-4" />
                {consents.length} consent {consents.length === 1 ? 'form' : 'forms'}
              </div>
              <button
                type="button"
                onClick={() => setShowClientFormModal(true)}
                title={!patient.email ? 'Patient has no email on file' : undefined}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Send Client Form
              </button>
              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* ── Document list ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          {loading || saving ? (
            <div className="py-10 text-center text-sm text-gray-500">
              {saving ? 'Saving consent form…' : 'Loading documents…'}
            </div>
          ) : !hasConsent ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-sky-50 flex items-center justify-center">
                <FilePlus className="w-7 h-7 text-sky-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No consent form on file</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Add a signed Data Privacy Consent Form for this patient.
              </p>
              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Consent Form
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {consents.map((consent) => (
                <article
                  key={consent.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4.5 h-4.5 text-sky-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">
                            Data Privacy Consent Form
                          </h3>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                            Consent
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Signed by {consent.full_name} · {formatDate(consent.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingConsent(consent)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors border border-sky-200"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Client form request history ── */}
      {(clientForms.length > 0 || loadingForms) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-500" />
            Client Form History
          </h2>

          {loadingForms ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
          ) : (
            <div className="space-y-3">
              {clientForms.map((req) => {
                const isCompleted = req.is_completed;
                const isExpired   = !isCompleted && req.is_expired;
                const isPending   = !isCompleted && !isExpired;

                return (
                  <article
                    key={req.id}
                    className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted ? 'bg-green-50' : isExpired ? 'bg-gray-100' : 'bg-amber-50'
                      }`}>
                        {isCompleted
                          ? <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                          : isExpired
                            ? <XCircle className="w-4.5 h-4.5 text-gray-400" />
                            : <Clock className="w-4.5 h-4.5 text-amber-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">
                            Client Information Form
                          </h3>
                          {isCompleted && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              Completed
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                              Expired
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Awaiting Response
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isCompleted && req.completed_at
                            ? <>Submitted {formatDate(req.completed_at)}</>
                            : <>Sent {formatDate(req.created_at)}</>
                          }
                          {req.sent_by_name && (
                            <> · by {req.sent_by_name}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingClientForm(req)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 shrink-0"
                    >
                      View
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── View client form modal ── */}
      {viewingClientForm && (
        <ViewClientFormModal
          isOpen={true}
          req={viewingClientForm}
          patient={patient}
          onClose={() => setViewingClientForm(null)}
        />
      )}

      {/* ── Send client form modal ── */}
      <SendClientFormModal
        isOpen={showClientFormModal}
        onClose={() => {
          setShowClientFormModal(false);
          loadClientForms();
        }}
        patientId={patient.id}
        patientName={`${patient.first_name} ${patient.last_name}`.trim()}
        patientEmail={patient.email ?? ''}
      />

      {/* ── Add document picker ── */}
      <AddDocumentModal
        isOpen={showAddDocModal}
        onClose={() => setShowAddDocModal(false)}
        onSelect={() => setShowSignModal(true)}
      />

      {/* ── Consent signature modal ── */}
      <ConsentFormModal
        isOpen={showSignModal}
        patientFullName={`${patient.first_name} ${patient.last_name}`.trim()}
        patientEmail={patient.email ?? ''}
        onClose={() => setShowSignModal(false)}
        onSigned={(signature, consentText) => {
          setShowSignModal(false);
          void handleConsentSigned(signature, consentText);
        }}
      />

      {/* ── View consent modal ── */}
      {viewingConsent && (
        <ViewConsentFormModal
          isOpen={true}
          consent={viewingConsent}
          onClose={() => setViewingConsent(null)}
          onSendEmail={() => setSendingConsent(viewingConsent)}
        />
      )}

      {/* ── Send consent email modal ── */}
      {sendingConsent && (
        <SendConsentFormModal
          isOpen={true}
          onClose={() => setSendingConsent(null)}
          patientId={patient.id}
          consent={sendingConsent}
        />
      )}
    </>
  );
};

export default PatientDocumentsPage;

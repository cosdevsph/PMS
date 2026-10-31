import { useState, useEffect, useCallback, useMemo } from 'react';
import { History, Loader2, Plus } from 'lucide-react';
import { getNotes, getActiveTemplates } from '@/features/clinical-template/clinical-templates.api';
import { getCaseDocuments, type CaseDocument } from '../api/caseDocuments.api';
import { getPatientConsentDocuments, type PatientConsentDocumentRecord } from '@/features/patients/patient.api';
import { getAppointments } from '@/features/appointments/appointment.api';
import { useQuery } from '@tanstack/react-query';
import { usePatientProfileContext } from '@/features/patients/context/PatientProfileContext';
import { usePermissions } from '@/hooks/usePermissions';
import { getAssessments } from '@/features/outcomes/outcomes.api';
import { OutcomeFeedItem } from '@/features/outcomes/components/OutcomeFeedItem';
import { groupAssessments } from '@/features/outcomes/outcomes.utils';
import type { OutcomeGroup } from '@/features/outcomes/outcomes.utils';
import { useClinicalWorkspace } from '../context/ClinicalWorkspaceContext';
import { ClinicalNoteFeedItem } from './ClinicalNoteFeedItem';
import { WorkspaceDocumentsFeed } from './WorkspaceDocumentsFeed';
import { UploadDocumentModal } from './UploadDocumentModal';
import type { ClinicalNote, ClinicalTemplate } from '@/types/clinicalTemplate';
import type { Appointment } from '@/types';

export const WorkspaceRightPanel = () => {
  const { patient, refreshCases } = usePatientProfileContext();
  const { selectedCaseId, refreshTrigger, triggerRefresh, setEditorContext, activeRightTab, setActiveRightTab } = useClinicalWorkspace();

  const { canView, canEdit } = usePermissions();
  const mayViewOutcomes = canView('outcome_measures');

  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [documents, setDocuments] = useState<(CaseDocument | (PatientConsentDocumentRecord & { category: string, description?: string }))[]>([]);
  const [templates, setTemplates] = useState<ClinicalTemplate[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!patient) return;
    setLoading(true);
    try {
      const [notesData, docsData, consentDocsData, templatesData, appointmentsData] = await Promise.all([
        getNotes({ 
          patient: patient.id, 
          patient_case: selectedCaseId ? selectedCaseId : -1 
        }),
        getCaseDocuments(patient.id),
        getPatientConsentDocuments(patient.id),
        getActiveTemplates(),
        getAppointments({ patient: patient.id, page_size: 100 })
      ]);
      setNotes(notesData || []);
      
      // Filter documents strictly by selected case
      const filteredDocs = (docsData || []).filter(doc => 
        selectedCaseId ? doc.patient_case === selectedCaseId : false
      );
      
      const appointmentsList = appointmentsData.results || [];
      const appointmentsForCase = appointmentsList.filter(
        (appt) => appt.patient_case === selectedCaseId || (appt as any).patient_case?.id === selectedCaseId
      );
      const appointmentIdsForCase = new Set(appointmentsForCase.map(a => a.id));

      // Filter consent docs strictly by selected case OR by an appointment that belongs to this case
      const rawConsentDocs = (consentDocsData || []).filter(doc => {
        if (!selectedCaseId) return false;
        if (doc.patient_case_id === selectedCaseId || doc.patient_case === selectedCaseId) return true;
        if (doc.appointment_id && appointmentIdsForCase.has(doc.appointment_id)) return true;
        if (doc.appointment && appointmentIdsForCase.has(doc.appointment)) return true;
        return false;
      });

      // Deduplicate consent docs by type and appointment (keep latest signed_at)
      const uniqueConsentDocsMap = new Map();
      rawConsentDocs.forEach(doc => {
        const apptId = doc.appointment_id || doc.appointment || 'no-appt';
        const key = `${doc.type}-${apptId}`;
        const existing = uniqueConsentDocsMap.get(key);
        if (!existing || new Date(doc.signed_at).getTime() > new Date(existing.signed_at).getTime()) {
          uniqueConsentDocsMap.set(key, doc);
        }
      });
      const filteredConsentDocs = Array.from(uniqueConsentDocsMap.values());

      // Add consent docs mapping them to a common format
      const mappedConsentDocs = filteredConsentDocs.map(doc => ({
        ...doc,
        id: `consent-${doc.id}`, // Prevent key collision with CaseDocument
        title: doc.type === 'DATA_PRIVACY_CONSENT' ? 'Data Privacy Form' : 'Clinic Consent Form',
        category: 'CONSENT_FORM',
        description: null // Remove redundant description since date is already shown
      }));
      
      setDocuments([...filteredDocs, ...mappedConsentDocs]);
      
      setTemplates(templatesData || []);
      
      // Auto-expand the newest note if none is expanded
      if (notesData && notesData.length > 0 && expandedNoteIds.size === 0) {
        setExpandedNoteIds(new Set([notesData[0].id]));
      }
      
      const sortedAppointments = (appointmentsData.results || []).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Failed to fetch workspace data', error);
    } finally {
      setLoading(false);
    }
  }, [patient?.id, selectedCaseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);


  const assessmentsQuery = useQuery({
    queryKey: ['outcomes', 'assessments', patient?.id, selectedCaseId],
    queryFn: () => getAssessments({ patient: patient!.id, patient_case: selectedCaseId as number }),
    enabled: !!patient && !!selectedCaseId && mayViewOutcomes,
    retry: false,
  });

  // Saved outcome measures join the timeline without reordering the notes: each goes above the first note that
  // was created before it.
  const timeline = useMemo(() => {
    // One card per measure in this case, placed by when it last changed.
    const groups = groupAssessments(assessmentsQuery.data ?? []);
    const entries: ({ kind: 'note'; note: ClinicalNote } | { kind: 'outcome'; group: OutcomeGroup })[] = [];
    let next = 0;
    for (const note of notes) {
      const noteTime = new Date(note.created_at).getTime();
      while (next < groups.length && groups[next].lastActivity >= noteTime) {
        entries.push({ kind: 'outcome', group: groups[next++] });
      }
      entries.push({ kind: 'note', note });
    }
    while (next < groups.length) entries.push({ kind: 'outcome', group: groups[next++] });
    return entries;
  }, [notes, assessmentsQuery.data]);

  const handleRefreshFeed = () => {
    setEditorContext({ type: 'IDLE' });
    triggerRefresh();
    refreshCases();
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-slate-50">
      {/* Right Panel Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto hide-scrollbar flex-shrink-0">
        <button
          onClick={() => setActiveRightTab('history')}
          className={`flex-1 min-w-[100px] py-2.5 text-xs 2xl:text-sm font-semibold transition-colors ${
            activeRightTab === 'history' ? 'bg-white border-t-2 border-t-sky-600 text-sky-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveRightTab('documents')}
          className={`flex-1 min-w-[100px] py-2.5 text-xs 2xl:text-sm font-semibold transition-colors ${
            activeRightTab === 'documents' ? 'bg-white border-t-2 border-t-sky-600 text-sky-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Documents
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 lg:p-4 bg-slate-50/50">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          </div>
        ) : activeRightTab === 'history' ? (
          <div className="w-full space-y-4">
            {timeline.length === 0 ? (
              <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-base 2xl:text-lg font-medium text-slate-600 mb-2">No Clinical Notes Found</h3>
                <p className="text-xs 2xl:text-sm">There are no finalized or drafted clinical notes or outcome measures for this case.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div />
                  <div className="flex justify-end gap-2">
                    <button
                    onClick={() => setExpandedNoteIds(new Set(notes.map(n => n.id)))}
                    className="text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Expand all Notes
                  </button>
                  <button
                    onClick={() => setExpandedNoteIds(new Set())}
                    className="text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Collapse all Notes
                  </button>
                  </div>
                </div>
                <div className="space-y-3 pl-6 border-l-2 border-slate-200 ml-3 relative before:absolute before:top-0 before:bottom-0 before:-left-[2px] before:w-[2px] before:bg-gradient-to-b before:from-slate-200 before:via-indigo-200 before:to-slate-200">
                  {timeline.map((entry) => entry.kind === 'outcome' ? (
                    <div key={`outcome-${entry.group.code}`} className="relative">
                      <div className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-white border-2 border-sky-400 shadow-sm z-10" />
                      <OutcomeFeedItem group={entry.group} canEdit={canEdit('outcome_measures')} />
                    </div>
                  ) : (() => { const note = entry.note; return (
                    <div key={note.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 shadow-sm z-10" />
                      <div className="absolute left-6 top-16 bottom-[-24px] w-0.5 bg-slate-200 -z-10 last:hidden" />
                      <ClinicalNoteFeedItem 
                        note={note} 
                        appointments={appointments}
                        templates={templates} 
                        onRefreshFeed={handleRefreshFeed}
                        isExpanded={expandedNoteIds.has(note.id)}
                        onToggleExpand={() => {
                          setExpandedNoteIds(prev => {
                            const next = new Set(prev);
                            if (next.has(note.id)) {
                              next.delete(note.id);
                            } else {
                              next.add(note.id);
                            }
                            return next;
                          });
                        }}
                      />
                    </div>
                  ); })())}
                </div>
              </>
            )}
          </div>
        ) : activeRightTab === 'documents' ? (
          <div className="w-full flex flex-col min-h-full">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-xs 2xl:text-sm transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Documents
              </button>
            </div>
            <WorkspaceDocumentsFeed 
              documents={documents} 
              appointments={appointments} 
              onDeleteSuccess={handleRefreshFeed}
            />
            {showUploadModal && patient && (
              <UploadDocumentModal
                patientId={patient.id}
                preSelectedCaseId={selectedCaseId || undefined}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                  setShowUploadModal(false);
                  handleRefreshFeed();
                }}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

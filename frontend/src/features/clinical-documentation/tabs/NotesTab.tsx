import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { FileText, Loader2, Plus, Pencil, History, CheckCircle, Mail, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import { getNote, getPrintNote } from '@/features/clinical-template/clinical-templates.api';
import { ClinicalNoteTemplate } from '@/features/clinical-template/components/ClinicalNoteTemplate';
import { CreateClinicalNoteModal } from '@/features/clinical-template/components/CreateClinicalNoteModal';
import { EditClinicalNoteModal } from '@/features/clinical-template/components/EditClinicalNoteModal';
import { SendClinicalNoteModal } from '@/features/clinical-template/components/SendClinicalNoteModal';
import { ClinicalNoteHistoryModal } from '@/features/clinical-template/components/ClinicalNoteHistoryModal';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { usePatientProfileContext } from '@/features/patients/context/PatientProfileContext';
import { formatDate } from '@/features/patients/patientProfile.utils.tsx';
import type { ClinicalNote, ClinicalTemplate, TemplateSection, TemplateField } from '@/types/clinicalTemplate';
import type { ClinicalWorkspaceContext } from '../ClinicalDocumentationWorkspace';

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};


const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

interface NoteDetailCardProps {
  note: ClinicalNote;
  onEdit: () => void;
}

const NoteDetailCard = ({ note, onEdit }: NoteDetailCardProps) => {
  const [fullNote, setFullNote] = useState<ClinicalNote | null>(null);
  const [template, setTemplate] = useState<ClinicalTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { emailEnabled } = useClinicSettings();

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const noteData = await getNote(note.id);
        if (cancelled) return;
        setFullNote(noteData);
        if (noteData.template) {
          const { getTemplate } = await import('@/features/clinical-template/clinical-templates.api');
          const templateData = await getTemplate(noteData.template);
          if (!cancelled) setTemplate(templateData);
        }
      } catch {
        if (!cancelled) setFullNote(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchDetail();
    return () => { cancelled = true; };
  }, [note.id]);

  const displayNote = fullNote ?? note;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const printData = await getPrintNote(note.id);
      const A4_W = 794;
      const container = document.createElement('div');
      container.style.cssText = `position:fixed;left:-9999px;top:0;width:${A4_W}px;background:white;z-index:-1;overflow:hidden;`;
      document.body.appendChild(container);
      const root = createRoot(container);
      await new Promise<void>((resolve) => {
        root.render(<ClinicalNoteTemplate data={printData} />);
        setTimeout(resolve, 500);
      });
      const cssRules: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          if (sheet.cssRules) {
            cssRules.push(Array.from(sheet.cssRules).map((r) => r.cssText).join('\n'));
          }
        } catch {
          if (sheet.href) cssRules.push(`@import url("${sheet.href}");`);
        }
      }
      const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((link) => `<link rel="stylesheet" href="${(link as HTMLLinkElement).href}" />`)
        .join('\n');
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head>
          <meta charset="UTF-8" />
          ${linkTags}
          <style>${cssRules.join('\n')}</style>
          <style>
            @page { size: A4 portrait; margin: 0; }
            html, body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head><body>${container.innerHTML}</body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 600);
      }
      root.unmount();
      document.body.removeChild(container);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || 'Failed to generate print view');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Card header: practitioner + actions */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {displayNote.practitioner_avatar ? (
          <img
            src={displayNote.practitioner_avatar}
            alt={displayNote.practitioner_name}
            className="w-10 h-10 rounded-full object-cover border-2 border-sky-300 shadow-sm shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-sky-100 border-2 border-sky-200 flex items-center justify-center text-sky-700 font-bold text-sm shrink-0">
            {getInitials(displayNote.practitioner_name ?? '')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {displayNote.practitioner_name || 'Unknown Practitioner'}
          </p>
          <p className="text-xs text-gray-500 truncate">{displayNote.template_name || 'Clinical Note'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{formatDate(displayNote.date)}</span>
          {displayNote.is_signed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-2.5 h-2.5" />
              Signed
            </span>
          )}
          {displayNote.is_draft && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Draft
            </span>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-sky-700 hover:border-sky-300 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          
          {/* History Button */}
          {((displayNote as any).version_number ?? 1) > 1 && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              title={`View Version History`}
            >
              <History className="w-3 h-3" />
              History ({(displayNote as any).version_number})
            </button>
          )}
          <button
            type="button"
            onClick={() => emailEnabled && setSendEmailOpen(true)}
            disabled={!emailEnabled}
            title={!emailEnabled ? 'Email notifications are disabled in Clinic Setup' : 'Send via Email'}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-sky-700 hover:border-sky-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-3 h-3" />
            Email
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {printing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
            Print
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {/* Patient & Session info */}
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Patient Information</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 p-3">
              {fullNote?.patient_name && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Patient Name</p>
                  <p className="text-xs font-medium text-gray-900">{fullNote.patient_name}</p>
                </div>
              )}
              {fullNote?.appointment_date && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Session Date</p>
                  <p className="text-xs font-medium text-gray-900">{formatDate(fullNote.appointment_date)}</p>
                </div>
              )}
              {fullNote?.appointment_time && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Session Time</p>
                  <p className="text-xs font-medium text-gray-900">{formatTime(fullNote.appointment_time)}</p>
                </div>
              )}
              {fullNote?.appointment_service && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Service</p>
                  <p className="text-xs font-medium text-gray-900">{fullNote.appointment_service}</p>
                </div>
              )}
            </div>
          </div>

          {/* Template sections */}
          {fullNote?.decrypted_content && template?.structure?.sections && (
            <div className="space-y-3">
              {(template.structure.sections as TemplateSection[]).map((section, sectionIndex) => (
                <div key={section.id || sectionIndex} className="rounded-lg border border-gray-100 overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{section.title}</p>
                  </div>
                  <div className="p-3 space-y-2.5">
                    {(section.fields as TemplateField[])?.map((field, fieldIndex) => {
                      if (field.type === 'section_header') return null;

                      if (field.type === 'heading') {
                        return (
                          <h5 key={field.id || fieldIndex} className="text-xs font-semibold text-gray-700 pt-1">
                            {field.label}
                          </h5>
                        );
                      }

                      if (field.type === 'chart') {
                        const chartValue = fullNote.decrypted_content?.[field.id];
                        const canvasImage: string | null =
                          typeof chartValue === 'string' && chartValue.startsWith('data:image/')
                            ? chartValue
                            : chartValue && typeof chartValue === 'object' && 'canvas_image' in chartValue
                              ? (chartValue as { canvas_image: string | null }).canvas_image
                              : null;
                        
                        const chartType = (field.chartType as 'body' | 'head' | 'hand' | 'feet') || 'body';
                        const fallbackImageMap: Record<string, string> = {
                          body: '/src/assets/charts/body-chart.webp',
                          head: '/src/assets/charts/head-chart.webp',
                          hand: '/src/assets/charts/hand-chart.webp',
                          feet: '/src/assets/charts/feet-chart.webp',
                        };
                        const fallbackImage = fallbackImageMap[chartType] || fallbackImageMap.body;
                        const finalImage = canvasImage || fallbackImage;

                        return (
                          <div key={field.id || fieldIndex}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{field.label}</p>
                            <img
                              src={finalImage}
                              alt="chart annotation"
                              className="w-full rounded-lg border border-gray-200"
                            />
                          </div>
                        );
                      }

                      const value = fullNote.decrypted_content?.[field.id];
                      const displayValue = (): string => {
                        if (value === undefined || value === '' || value === null) return '—';
                        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                        if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '—';
                        if (field.type === 'scale') return `${value} / ${field.max || 10}`;
                        return String(value);
                      };

                      return (
                        <div key={field.id || fieldIndex}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{field.label}</p>
                          <p className="text-sm text-gray-900 bg-gray-50 rounded px-2 py-1.5 min-h-8 whitespace-pre-wrap">{displayValue()}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SendClinicalNoteModal
        isOpen={sendEmailOpen}
        onClose={() => setSendEmailOpen(false)}
        noteId={note.id}
        patientName={displayNote.patient_name ?? ''}
      />
      <ClinicalNoteHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        noteId={note.id}
        templateStructure={template?.structure}
      />
    </div>
  );
};





export const NotesTab = () => {
  const {
    patient,
    clinicalNotes,
    cases,
    loadingPatient,
    loadingNotes,
    refreshClinicalNotes,
  } = usePatientProfileContext();

  const { selectedCaseId } = useOutletContext<ClinicalWorkspaceContext>();

  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [createNoteAppointmentId, setCreateNoteAppointmentId] = useState<number | undefined>(undefined);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { openCreateNoteForAppointment?: number; openNoteId?: number } | null;
    let shouldClearState = false;

    if (state?.openCreateNoteForAppointment) {
      setCreateNoteAppointmentId(state.openCreateNoteForAppointment);
      setIsCreateNoteOpen(true);
      shouldClearState = true;
    } else if (state?.openNoteId) {
      setEditingNoteId(state.openNoteId);
      shouldClearState = true;
    }

    if (shouldClearState) {
      // Clear the state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!patient || !selectedCaseId) {
      setNotes([]);
      return;
    }

    setNotes(clinicalNotes.filter((note) => note.patient_case === selectedCaseId));
  }, [patient, selectedCaseId, clinicalNotes]);

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  if (loadingPatient || !patient) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading patient details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">Clinical Notes</h2>
        {selectedCaseId && (
          <button
            type="button"
            onClick={() => setIsCreateNoteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Clinical Note
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2">
        {!selectedCaseId ? (
          <div className="text-gray-400 text-center mt-20 bg-white p-8 rounded-xl border border-slate-200">
            Select a case to view clinical notes
          </div>
        ) : loadingNotes ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-white p-12 rounded-xl border border-slate-200 mt-4">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No clinical notes for this case yet</p>
            <p className="text-xs text-gray-400 mt-1">Add a note to start documenting case progress.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteDetailCard
                key={note.id}
                note={note}
                onEdit={() => setEditingNoteId(note.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedCase && (
        <CreateClinicalNoteModal
          isOpen={isCreateNoteOpen}
          onClose={() => {
            setIsCreateNoteOpen(false);
            setCreateNoteAppointmentId(undefined);
          }}
          appointmentId={createNoteAppointmentId}
          patientCaseId={selectedCase.id}
          patientId={patient.id}
          patientName={patient.full_name}
          existingNotes={clinicalNotes
            .filter((note) => note.appointment !== null)
            .map((note) => ({ appointment: note.appointment as number }))}
          onSuccess={() => {
            setIsCreateNoteOpen(false);
            void refreshClinicalNotes();
          }}
        />
      )}

      {editingNoteId && (
        <EditClinicalNoteModal
          isOpen={Boolean(editingNoteId)}
          onClose={() => setEditingNoteId(null)}
          noteId={editingNoteId}
          patientId={patient.id}
          cases={cases}
          onSuccess={() => {
            setEditingNoteId(null);
            void refreshClinicalNotes();
          }}
        />
      )}
    </div>
  );
};

export default NotesTab;

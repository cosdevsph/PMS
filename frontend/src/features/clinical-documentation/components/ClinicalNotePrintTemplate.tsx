import React from 'react';
import type { ClinicalNote, ClinicalTemplate } from '@/types/clinicalTemplate';
import type { Appointment } from '@/types';
import { DynamicFormRenderer } from '@/features/clinical-template/components/DynamicFormRenderer';
import { SystemBranding } from '@/config/branding';
import { UserAvatar } from '@/components/UserAvatar';
import { chartImageMap } from '@/features/clinical-template/utils/chartMapping';
import { format } from 'date-fns';

interface ClinicalNotePrintTemplateProps {
  note: ClinicalNote;
  template: ClinicalTemplate | null;
  appointment?: Appointment | null;
  patientName: string;
  clinicName?: string;
  clinicLogoUrl?: string;
  className?: string;
}

export const ClinicalNotePrintTemplate: React.FC<ClinicalNotePrintTemplateProps> = ({
  note,
  template,
  appointment,
  patientName,
  clinicName = 'Malasakit Clinic',
  clinicLogoUrl,
  className = ''
}) => {
  const noteDate = note.date ? new Date(note.date).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : '';

  const formattedAppointmentTime = (() => {
    if (!appointment?.date || !appointment?.start_time) return null;
    try {
      const [hours, minutes] = appointment.start_time.split(':');
      const d = new Date(appointment.date);
      d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      return format(d, "EEEE, do MMMM yyyy, hh:mma");
    } catch (e) {
      return `${appointment.date} ${appointment.start_time}`;
    }
  })();

  // Ensure content uses chart images if present
  const renderContent = { ...(note.decrypted_content || {}) };
  if (note.chart_annotation_data) {
    Object.entries(note.chart_annotation_data).forEach(([fieldId, annotationData]: [string, any]) => {
      renderContent[fieldId] = {
        canvas_image: renderContent[fieldId] || null,
        doodle_data: annotationData.doodle_data || [],
      };
    });
  }

  const isGeneralSoap =
    template?.name === 'General SOAP' ||
    note.template_name === 'General SOAP' ||
    (Boolean(template?.is_system_template) && (template?.name?.includes('SOAP') ?? false));

  const getBodyChartImage = () => {
    const val = renderContent.body_chart;
    if (!val) return chartImageMap.body;
    if (typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('http') || val.startsWith('/'))) {
      return val;
    }
    if (typeof val === 'object' && val.canvas_image) {
      return val.canvas_image;
    }
    return chartImageMap.body;
  };

  if (isGeneralSoap) {
    const soapSections = [
      {
        id: 'subjective',
        code: 'S',
        title: 'Subjective',
        color: 'bg-blue-600',
        value: renderContent.subjective,
        placeholder: 'No subjective observations, patient history, or symptoms recorded.',
      },
      {
        id: 'objective',
        code: 'O',
        title: 'Objective',
        color: 'bg-emerald-600',
        value: renderContent.objective,
        placeholder: 'No objective findings, vital signs, or physical examination details recorded.',
      },
      {
        id: 'assessment',
        code: 'A',
        title: 'Assessment',
        color: 'bg-amber-600',
        value: renderContent.assessment || renderContent.diagnosis_analysis,
        placeholder: 'No clinical assessment, diagnostic impression, or analysis recorded.',
      },
      {
        id: 'plan',
        code: 'P',
        title: 'Plan',
        color: 'bg-purple-600',
        value: renderContent.plan,
        placeholder: 'No future treatment plan, follow-up, or recommendations recorded.',
      },
    ];

    return (
      <div className={`space-y-6 ${className}`}>
        {/* ── PAGE 1: Body Chart & Session Details ─────────────────────── */}
        <div
          className="print-page w-[794px] min-h-[1123px] h-[1123px] max-h-[1123px] bg-white flex flex-col justify-between mx-auto text-slate-900 font-sans shadow-xl border border-slate-200 overflow-hidden box-border p-8"
          style={{ width: '794px', height: '1123px', minHeight: '1123px', maxHeight: '1123px' }}
        >
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="pb-4 border-b border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  {clinicLogoUrl && (
                    <img src={clinicLogoUrl} alt={clinicName} className="h-14 w-auto object-contain rounded-lg border border-slate-200 bg-white p-1" />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">{clinicName}</h1>
                    {note.created_by_clinic_name && note.created_by_clinic_name !== clinicName && (
                      <p className="text-xs text-slate-500">{note.created_by_clinic_name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    Clinical Note • General SOAP
                  </span>
                </div>
              </div>

              {/* Practitioner & Appointment Info */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatarUrl={note.created_by_avatar || note.practitioner_avatar}
                    name={note.created_by_name || note.practitioner_name || 'Practitioner'}
                    className="w-11 h-11 border-2 border-white shadow-sm ring-1 ring-slate-200"
                  />
                  <div>
                    {formattedAppointmentTime && (
                      <p className="text-xs font-bold text-slate-900 mb-0.5 tracking-tight">
                        {formattedAppointmentTime}
                      </p>
                    )}
                    <p className="font-bold text-slate-900 text-base">{note.created_by_name || note.practitioner_name || 'Practitioner'}</p>
                    <p className="text-xs text-slate-600 font-medium">{note.created_by_title || 'Practitioner'}</p>
                    {(note.created_by_email || note.created_by_phone) && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {[note.created_by_email, note.created_by_phone].filter(Boolean).join(' | ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-0.5">Document Type</p>
                  <p className="font-bold text-slate-800 text-sm">{template?.name || 'General SOAP'}</p>
                </div>
              </div>
            </div>

            {/* Patient Info Card */}
            <div className="grid grid-cols-3 gap-4 my-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-0.5">Patient Name</p>
                <p className="font-bold text-slate-900 text-sm">{patientName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-0.5">Date of Note</p>
                <p className="font-bold text-slate-900 text-sm">{noteDate || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-0.5">Session / Service</p>
                <p className="font-bold text-slate-900 text-sm">{appointment?.service_name || note.appointment_service || 'General Consultation'}</p>
              </div>
            </div>

            {/* Body Chart Section */}
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Body Chart Examination (Anterior & Posterior)
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Anatomical Findings & Markings
                </span>
              </div>
              <div className="h-[520px] w-full bg-slate-50/60 rounded-xl border border-slate-200 flex items-center justify-center p-3 overflow-hidden">
                <img
                  src={getBodyChartImage()}
                  alt="Body Chart"
                  className="max-h-full max-w-full object-contain mx-auto"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          </div>

          {/* Page 1 Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 mt-2">
            <p className="text-[11px]">This document is a confidential clinical record.</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Generated by</span>
              <img src={SystemBranding.logoColored} alt={SystemBranding.companyName} className="h-3.5 object-contain opacity-70 grayscale" />
              <span>on {new Date().toLocaleDateString('en-PH')}</span>
            </div>
            <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full text-xs">
              Page 1 of 2
            </span>
          </div>
        </div>

        {/* ── PAGE 2: SOAP Text Sections & Sign-off ────────────────────── */}
        <div
          className="print-page w-[794px] min-h-[1123px] h-[1123px] max-h-[1123px] bg-white flex flex-col justify-between mx-auto text-slate-900 font-sans shadow-xl border border-slate-200 overflow-hidden box-border p-8"
          style={{ width: '794px', height: '1123px', minHeight: '1123px', maxHeight: '1123px' }}
        >
          <div className="flex-1 flex flex-col justify-between">
            {/* Running Compact Header */}
            <div className="pb-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 mb-3">
              <div className="flex items-center gap-2">
                {clinicLogoUrl && (
                  <img src={clinicLogoUrl} alt={clinicName} className="h-6 w-auto object-contain rounded" />
                )}
                <span className="font-bold text-slate-900">{clinicName}</span>
                <span className="text-slate-300">|</span>
                <span className="text-blue-600 font-semibold">General SOAP Note</span>
              </div>
              <div className="flex items-center gap-4">
                <span><strong className="text-slate-700">Patient:</strong> {patientName}</span>
                <span><strong className="text-slate-700">Date:</strong> {noteDate}</span>
                <span><strong className="text-slate-700">Practitioner:</strong> {note.created_by_name || note.practitioner_name || 'Practitioner'}</span>
              </div>
            </div>

            {/* 5 SOAP Sections */}
            <div className="space-y-2.5 flex-1 flex flex-col justify-around my-1">
              {soapSections.map((field) => (
                <div key={field.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-white text-[11px] font-black ${field.color}`}>
                      {field.code}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {field.title}
                    </span>
                  </div>
                  <div className="text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap pl-7">
                    {field.value ? (
                      String(field.value)
                    ) : (
                      <span className="text-xs text-slate-400 italic">{field.placeholder}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Verification & Sign-off Block */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-end my-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Clinical Record Status</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    note.status === 'finalized' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {note.status === 'finalized' ? 'Finalized' : 'Draft'}
                  </span>
                  {note.signed_at && (
                    <span className="text-xs text-slate-500">
                      Signed on {new Date(note.signed_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="w-52 border-b border-slate-400 mb-1 ml-auto"></div>
                <p className="text-xs font-bold text-slate-900">{note.created_by_name || note.practitioner_name || 'Practitioner'}</p>
                <p className="text-[11px] text-slate-500">{note.created_by_title || 'Attending Practitioner'}</p>
              </div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 mt-2">
            <p className="text-[11px]">This document is a confidential clinical record.</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Generated by</span>
              <img src={SystemBranding.logoColored} alt={SystemBranding.companyName} className="h-3.5 object-contain opacity-70 grayscale" />
              <span>on {new Date().toLocaleDateString('en-PH')}</span>
            </div>
            <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full text-xs">
              Page 2 of 2 • End of Document
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`print-page bg-white max-w-[800px] mx-auto text-slate-900 font-sans shadow-xl border border-slate-200 ${className}`}>
      
      <div className="px-8 pt-8 pb-6 bg-slate-50 border-b border-slate-200">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {clinicLogoUrl && (
              <img src={clinicLogoUrl} alt={clinicName} className="h-20 w-auto object-contain rounded-lg shadow-sm bg-white p-1" />
            )}
            <h1 className="text-2xl font-bold text-slate-900">{clinicName}</h1>
          </div>
          <div className="text-right pt-2">
            <p className="text-sm uppercase tracking-wider font-bold text-transparent bg-clip-text bg-primary-gradient">
              Clinical Note
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-5 border-t border-slate-200/60">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={note.created_by_avatar || note.practitioner_avatar}
              name={note.created_by_name || note.practitioner_name || 'Practitioner'}
              className="w-12 h-12 border-2 border-white shadow-sm ring-1 ring-slate-200"
            />
            <div>
              {appointment && appointment.date && appointment.start_time && (
                <p className="text-[15px] font-black text-slate-900 mb-1.5 tracking-tight">
                  {(() => {
                    try {
                      const [hours, minutes] = appointment.start_time.split(':');
                      const d = new Date(appointment.date);
                      d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
                      return format(d, "EEEE, do MMMM yyyy, hh:mma");
                    } catch (e) {
                      return `${appointment.date} ${appointment.start_time}`;
                    }
                  })()}
                </p>
              )}
              <p className="font-bold text-slate-900 text-lg">{note.created_by_name || note.practitioner_name || 'Practitioner'}</p>
              <p className="text-sm text-slate-600 font-medium">{note.created_by_title || 'Practitioner'}</p>
              {(note.created_by_email || note.created_by_phone) && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {[note.created_by_email, note.created_by_phone].filter(Boolean).join(' | ')}
                </p>
              )}
              {note.created_by_clinic_name && (
                <p className="text-xs text-slate-500">{note.created_by_clinic_name}</p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Document Type</p>
            <p className="font-bold text-slate-800">{template?.name || 'Note Details'}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm p-5 rounded-xl border border-slate-100 bg-slate-50/50">
        <div>
          <p className="text-slate-500 font-medium mb-1">Patient Name:</p>
          <p className="font-semibold">{patientName}</p>
        </div>
        <div>
          <p className="text-slate-500 font-medium mb-1">Date:</p>
          <p className="font-semibold">{noteDate}</p>
        </div>
        {appointment && (
          <div>
            <p className="text-slate-500 font-medium mb-1">Session:</p>
            <p className="font-semibold">{appointment.service_name || 'General Consultation'}</p>
          </div>
        )}
      </div>

        {template?.description && (
          <div className="mb-6">
            <p className="text-sm text-slate-500">{template.description}</p>
          </div>
        )}

        <div className="mt-4 pointer-events-none">
        {template?.structure?.sections ? (
          <DynamicFormRenderer
            sections={template.structure.sections as any}
            values={renderContent}
            onChange={() => {}}
            disabled={true}
          />
        ) : (
          <div className="text-sm text-slate-600">
            {Object.entries(renderContent).map(([key, value]) => {
              // Hide complex objects in raw fallback
              if (typeof value === 'object' && value !== null) return null;
              return (
                <div key={key} className="mb-4">
                  <p className="font-bold text-slate-700 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                  <p>{String(value)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 text-sm text-slate-500 rounded-b-xl">
        <p className="mb-1 text-xs">This document is a confidential clinical record.</p>
        <div className="flex items-center gap-1.5 mt-2 mb-4 text-xs text-slate-400">
          <span>Generated by</span>
          <img src={SystemBranding.logoColored} alt={SystemBranding.companyName} className="h-3.5 object-contain opacity-70 grayscale hover:grayscale-0 transition-all" />
          <span>on {new Date().toLocaleDateString('en-PH')}</span>
        </div>

      </div>
    </div>
  );
};


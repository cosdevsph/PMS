import React, { useState, useEffect } from 'react';
import { Loader2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Practitioner } from '@/features/clinics/clinic.api';
import type { PatientCase, PatientCaseStatus, PatientCasePayer } from '@/types/patient';

export interface CaseFormData {
  title: string;
  status: PatientCaseStatus;
  primaryPractitionerId: string;
  primaryPractitionerName: string;
  payer: PatientCasePayer;
  alertNotes: string;
  sessionSource?: 'MANUAL' | 'PACKAGE' | 'HMO';
  approvedSessions?: number;
  packageCost?: number;
  isUnlimited: boolean;
  referredBy: string;
  referralInfo: string;
  description: string;
}

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialValues?: Partial<PatientCase>;
  onSave: (data: CaseFormData) => void;
  practitioners: Practitioner[];
  loadingPractitioners: boolean;
  /** When true, the Primary Practitioner field is shown read-only (auto-filled from the appointment). */
  autoFocusField?: 'approved_sessions';
  lockPractitioner?: boolean;
}

export const CaseModal = ({ isOpen, onClose, mode, initialValues, onSave, practitioners, loadingPractitioners, lockPractitioner, autoFocusField }: CaseModalProps) => {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [status, setStatus] = useState<PatientCaseStatus>(initialValues?.status ?? 'OPEN');
  const [primaryPractitionerId, setPrimaryPractitionerId] = useState(initialValues?.primary_practitioner ? String(initialValues.primary_practitioner) : '');
  const [primaryPractitionerName, setPrimaryPractitionerName] = useState(initialValues?.primary_practitioner_name ?? '');
  const [payer, setPayer] = useState<PatientCasePayer>(initialValues?.payer ?? '');
  const [alertNotes, setAlertNotes] = useState(initialValues?.alert_notes ?? '');
  
  // Session Management State
  const approvedSessionsRef = React.useRef<HTMLInputElement>(null);
  const [approvedSessions, setApprovedSessions] = useState<number | ''>(
    initialValues?.approved_sessions ?? (mode === 'create' ? 1 : '')
  );
  const [packageCost, setPackageCost] = useState<number | ''>(
    initialValues?.package_cost ? Number(initialValues.package_cost) : ''
  );
  const [isUnlimited, setIsUnlimited] = useState<boolean>(initialValues?.is_unlimited ?? false);
  
  // Progress (Read-Only for Edit mode)
  const completedSessions = initialValues?.completed_sessions ?? 0;
  const remainingSessions = initialValues?.remaining_sessions ?? null;

  const [referredBy, setReferredBy] = useState(initialValues?.referred_by ?? '');
  const [referralInfo, setReferralInfo] = useState(initialValues?.referral_info ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');


  useEffect(() => {
    if (isOpen) {
      setTitle(initialValues?.title ?? '');
      setStatus(initialValues?.status ?? 'OPEN');
      setPrimaryPractitionerId(initialValues?.primary_practitioner ? String(initialValues.primary_practitioner) : '');
      setPrimaryPractitionerName(initialValues?.primary_practitioner_name ?? '');
      setPayer(initialValues?.payer ?? '');
      setAlertNotes(initialValues?.alert_notes ?? '');
      setApprovedSessions(initialValues?.approved_sessions ?? (mode === 'create' ? 1 : ''));
      setPackageCost(initialValues?.package_cost ? Number(initialValues.package_cost) : '');
      setIsUnlimited(initialValues?.is_unlimited ?? false);
      setReferredBy(initialValues?.referred_by ?? '');
      setReferralInfo(initialValues?.referral_info ?? '');
      setDescription(initialValues?.description ?? '');
      
      if (autoFocusField === 'approved_sessions') {
        setTimeout(() => {
          approvedSessionsRef.current?.focus();
        }, 100);
      }
    }
  }, [isOpen, initialValues, autoFocusField]);

  const handlePractitionerChange = (id: string) => {

    setPrimaryPractitionerId(id);
    const found = practitioners.find((p) => String(p.id) === id);
    setPrimaryPractitionerName(found?.name ?? '');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {mode === 'create' ? 'Create New Case' : 'Edit Case'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {mode === 'create'
                  ? 'Define a case to organize patient notes and follow-up actions.'
                  : 'Update case details and assignment.'}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ── Left Column ── */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Case Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Post-op Knee Recovery"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PatientCaseStatus)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="OPEN">Active</option>
                    <option value="DISCHARGED">Discharged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Practitioner</label>
                  {lockPractitioner ? (
                    <div className="px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                      {primaryPractitionerName || <span className="text-gray-400 italic">Unassigned</span>}
                    </div>
                  ) : loadingPractitioners ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 border border-gray-200 rounded-lg">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading practitioners...
                    </div>
                  ) : (
                    <select
                      value={primaryPractitionerId}
                      onChange={(e) => handlePractitionerChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">— Not assigned —</option>
                      {practitioners.map((p) => (
                        <option key={p.id} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payer</label>
                  <select
                    value={payer}
                    onChange={(e) => setPayer(e.target.value as PatientCasePayer)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">— Select payer —</option>
                    <option value="PRIVATE">Private Pay</option>
                    <option value="HMO">HMO</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-800">Pre-Approved Sessions</h4>
                    <span className="text-[10px] font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded px-1.5 py-0.5">CASE ALLOCATION</span>
                  </div>
                  <p className="text-xs text-gray-500 -mt-2">
                    Specify the number of prepaid or approved sessions allocated for this case.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Pre-Approved Sessions</label>
                      <input
                        type="number"
                        min="1"
                        ref={approvedSessionsRef}
                        value={isUnlimited ? '' : approvedSessions}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setApprovedSessions(val);
                          if (!isUnlimited && typeof val === 'number' && val < 2) {
                            setPackageCost('');
                          }
                        }}
                        disabled={isUnlimited}
                        placeholder={isUnlimited ? "Unlimited sessions" : "1"}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="unlimited-sessions"
                      checked={isUnlimited}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsUnlimited(checked);
                        if (checked) {
                          setApprovedSessions('');
                        } else {
                          setApprovedSessions(1);
                        }
                      }}
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    />
                    <label htmlFor="unlimited-sessions" className="text-sm font-medium text-gray-700">
                      Unlimited Sessions (No Quota Limit)
                    </label>
                  </div>

                  {/* ── Price of Case Package: appears if unlimited sessions or pre-approved sessions is 2 or higher ── */}
                  {(isUnlimited || (typeof approvedSessions === 'number' && approvedSessions >= 2)) && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Price of Case Package <span className="text-xs font-normal text-gray-400">(Manual Entry)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">₱</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={packageCost}
                          onChange={(e) => setPackageCost(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g., 5000"
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {isUnlimited
                          ? 'Total package price for unlimited sessions.'
                          : `Total package price for all ${approvedSessions} pre-approved sessions.`}
                      </p>
                    </div>
                  )}

                  {mode === 'edit' && !isUnlimited && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Approved</p>
                        <p className="text-sm font-semibold text-gray-900">{approvedSessions || 0}</p>
                      </div>
                      <div className="h-8 w-px bg-gray-300"></div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Used</p>
                        <p className="text-sm font-semibold text-gray-900">{completedSessions}</p>
                      </div>
                      <div className="h-8 w-px bg-gray-300"></div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Remaining</p>
                        <p className="text-sm font-semibold text-sky-700">{remainingSessions ?? '—'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right Column ── */}
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Alert Notes
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 leading-none">CASE-WIDE</span>
                  </label>
                  <textarea
                    value={alertNotes}
                    onChange={(e) => setAlertNotes(e.target.value)}
                    rows={4}
                    placeholder="Persistent alerts visible across all sessions for this case..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800">Referral <span className="text-gray-400 font-normal">(Optional)</span></h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Referred By</label>
                    <input
                      type="text"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      placeholder="e.g., Dr. Smith"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Referral Notes</label>
                    <textarea
                      value={referralInfo}
                      onChange={(e) => setReferralInfo(e.target.value)}
                      rows={3}
                      placeholder="Additional referral information..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Add context, goals, and notes for this case"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!title.trim()) {
                  toast.error('Case title is required');
                  return;
                }
                const sessionsNum = isUnlimited ? undefined : (approvedSessions === '' ? (mode === 'create' ? 1 : undefined) : approvedSessions);
                const hasPackage = isUnlimited || (typeof sessionsNum === 'number' && sessionsNum >= 2);
                const packageCostNum = (hasPackage && packageCost !== '') ? Number(packageCost) : undefined;

                onSave({ 
                  title: title.trim(), 
                  status, 
                  primaryPractitionerId, 
                  primaryPractitionerName, 
                  payer, 
                  alertNotes, 
                  sessionSource: hasPackage ? 'PACKAGE' : (initialValues?.session_source ?? 'MANUAL'),
                  approvedSessions: sessionsNum,
                  packageCost: packageCostNum,
                  isUnlimited,
                  referredBy, 
                  referralInfo, 
                  description 
                });
              }}
              className="px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700"
            >
              {mode === 'create' ? 'Create Case' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

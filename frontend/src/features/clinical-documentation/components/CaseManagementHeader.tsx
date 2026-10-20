import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

import { usePatientProfileContext } from '@/features/patients/context/PatientProfileContext';
import { CaseModal } from '@/features/patients/CaseModal';
import {
  createPatientCase,
  updatePatientCase,
} from '@/features/patients/patientCases.api';
import { getPractitioners, type Practitioner } from '@/features/clinics/clinic.api';
import type { PatientCase, PatientCaseStatus } from '@/types/patient';

const STATUS_CONFIG: Record<PatientCaseStatus, { label: string; className: string }> = {
  OPEN:       { label: 'Active',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DISCHARGED: { label: 'Discharged', className: 'bg-purple-50 text-purple-700 border-purple-200' },
};

interface CaseManagementHeaderProps {
  selectedCaseId: number | null;
  onSelectCase: (id: number | null) => void;
}

export const CaseManagementHeader: React.FC<CaseManagementHeaderProps> = ({
  selectedCaseId,
  onSelectCase,
}) => {
  const { patient, cases, refreshCases } = usePatientProfileContext();

  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<PatientCase | undefined>();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loadingPractitioners, setLoadingPractitioners] = useState(false);

  useEffect(() => {
    const fetchPractitioners = async () => {
      setLoadingPractitioners(true);
      try {
        const { practitioners: list } = await getPractitioners();
        setPractitioners(list);
      } catch (err) {
        console.error('Failed to load practitioners', err);
      } finally {
        setLoadingPractitioners(false);
      }
    };
    fetchPractitioners();
  }, []);

  const activeCases = useMemo(() => cases.filter(c => !c.is_archived), [cases]);
  const selectedCase = useMemo(() => cases.find(c => c.id === selectedCaseId), [cases, selectedCaseId]);

  // Case CRUD Actions
  const handleCreateCase = async (formData: any) => {
    if (!patient) return;
    try {
      const data = {
        patient: patient.id,
        primary_practitioner: formData.primaryPractitionerId ? Number(formData.primaryPractitionerId) : undefined,
        primary_practitioner_name: formData.primaryPractitionerName || undefined,
        title: formData.title,
        description: formData.description || '',
        referred_by: formData.referredBy || undefined,
        referral_info: formData.referralInfo || undefined,
        status: formData.status,
      };
      const newCase = await createPatientCase(data);
      await refreshCases();
      onSelectCase(newCase.id);
      setIsCreateCaseOpen(false);
      toast.success('Case created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create case');
    }
  };

  const handleUpdateCase = async (formData: any) => {
    if (!editingCase) return;
    try {
      const data = {
        primary_practitioner: formData.primaryPractitionerId ? Number(formData.primaryPractitionerId) : undefined,
        primary_practitioner_name: formData.primaryPractitionerName || undefined,
        title: formData.title,
        description: formData.description || '',
        referred_by: formData.referredBy || undefined,
        referral_info: formData.referralInfo || undefined,
        status: formData.status,
      };
      await updatePatientCase(editingCase.id, data);
      await refreshCases();
      setEditingCase(undefined);
      toast.success('Case updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update case');
    }
  };

  const handleStatusChange = async (caseId: number, newStatus: PatientCaseStatus) => {
    try {
      await updatePatientCase(caseId, { status: newStatus });
      toast.success(`Case marked as ${STATUS_CONFIG[newStatus].label}`);
      await refreshCases();
    } catch {
      toast.error('Failed to update case status');
    }
  };

  if (activeCases.length === 0) {
    return (
      <div className="bg-white p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">No cases found for this patient.</p>
          <button
            onClick={() => setIsCreateCaseOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Case
          </button>
        </div>
        {isCreateCaseOpen && (
          <CaseModal
            isOpen={isCreateCaseOpen}
            onClose={() => setIsCreateCaseOpen(false)}
            mode="create"
            onSave={handleCreateCase}
            practitioners={practitioners}
            loadingPractitioners={loadingPractitioners}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start">
      {/* Sidebar / Selector */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Active Case
          </label>
          <select
            value={selectedCaseId || ''}
            onChange={(e) => onSelectCase(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            {activeCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateCaseOpen(true)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded hover:bg-sky-100 transition-colors"
          >
            New Case
          </button>
          {selectedCase && (
            <button
              onClick={() => setEditingCase(selectedCase)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
            >
              Edit Case
            </button>
          )}
        </div>
      </div>

      {/* Main details */}
      <div className="flex-1 w-full flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 p-5">
        {selectedCase ? (
          <>
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {selectedCase.title}
                  </h2>
                  <select
                    value={selectedCase.status}
                    onChange={(event) => handleStatusChange(selectedCase.id, event.target.value as PatientCaseStatus)}
                    className={`text-xs border rounded-full px-2 py-0.5 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer ${
                      STATUS_CONFIG[selectedCase.status].className
                    }`}
                  >
                    <option value="OPEN">Active</option>
                    <option value="DISCHARGED">Discharged</option>
                  </select>
                </div>
                {selectedCase.primary_practitioner_name && (
                  <p className="text-xs text-gray-500 mt-0.5">Primary: {selectedCase.primary_practitioner_name}</p>
                )}
                {selectedCase.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedCase.description}</p>
                )}
                {selectedCase.referred_by && (
                  <p className="text-xs text-gray-500 mt-0.5">Referral: {selectedCase.referred_by}</p>
                )}
              </div>
            </div>

            {/* Legacy package billing (read-only). Case session limits were retired; prepaid sessions
                now live in Private Package Sessions on the Patient Profile. */}
            <div className="grid grid-cols-1 gap-4">
              {/* Package Billing UI */}
              {selectedCase.session_source === 'PACKAGE' && (
                <div className="p-4 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] border border-emerald-100/50 flex flex-col gap-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="flex flex-col gap-4 h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 min-w-max">
                        <Receipt className="w-4 h-4 text-emerald-500" />
                        Package Billing
                      </h3>
                      {selectedCase.package_status && (
                        <span className={`text-[10px] px-2 py-1.5 rounded-md font-bold uppercase tracking-wide border ${
                          selectedCase.package_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          selectedCase.package_status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {selectedCase.package_status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 w-fit mt-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Cost</span>
                        <span className="text-base font-bold text-gray-900 leading-none">₱{Number(selectedCase.package_cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="h-3 w-px bg-gray-200" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Paid</span>
                        <span className="text-base font-bold text-gray-900 leading-none">₱{Number(selectedCase.amount_paid || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="h-3 w-px bg-gray-200" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Balance</span>
                        <span className={`text-base font-bold leading-none ${Number(selectedCase.outstanding_balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ₱{Number(selectedCase.outstanding_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">Please select a case to view details.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateCaseOpen && (
        <CaseModal
          isOpen={isCreateCaseOpen}
          onClose={() => setIsCreateCaseOpen(false)}
          mode="create"
          onSave={handleCreateCase}
          practitioners={practitioners}
          loadingPractitioners={loadingPractitioners}
        />
      )}

      {editingCase && (
        <CaseModal
          isOpen={!!editingCase}
          onClose={() => setEditingCase(undefined)}
          mode="edit"
          initialValues={editingCase}
          onSave={handleUpdateCase}
          practitioners={practitioners}
          loadingPractitioners={loadingPractitioners}
                  />
      )}

    </div>
  );
};

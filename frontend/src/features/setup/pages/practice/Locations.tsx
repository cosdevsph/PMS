import React, { useState } from 'react';
import {
  MapPin, Plus, Building2, Phone, Mail, Star, Edit,
  MoreVertical, CheckCircle, XCircle, Globe, Loader2,
  Hash, Trash2, AlertCircle
} from 'lucide-react';
import { useClinicBranches } from '@/features/clinics/hooks/useClinicBranches';
import { createClinicBranch, updateClinicBranch, deleteClinicBranch } from '@/features/clinics/clinic.api';
import { invalidateClinicSettingsCache } from '@/hooks/useClinicSettings';
import { CreateBranchModal } from './components/CreateBranchModal';
import type { ClinicBranch, CreateBranchData } from '@/types/clinic';
import toast from 'react-hot-toast';

// Strip redundant clinic name prefix: "Biosymm - Biosymm - Lacson" → "Biosymm - Lacson"
const deduplicateName = (name: string): string => {
  const parts = name.split(' - ');
  if (parts.length >= 2 && parts[0] === parts[1]) {
    return [parts[0], ...parts.slice(2)].join(' - ');
  }
  return name;
};

// ─── BranchCard ───────────────────────────────────────────────────────────────

interface BranchCardProps {
  branch: ClinicBranch;
  onAction: (action: 'edit' | 'delete', branch: ClinicBranch) => void;
}

const BranchCard: React.FC<BranchCardProps> = ({ branch, onAction }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${
      branch.is_main_branch ? 'border-sky-300' : 'border-gray-200'
    }`}>
      <div className={`h-1 ${branch.is_main_branch ? 'bg-sky-500' : 'bg-gray-200'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              branch.is_main_branch ? 'bg-sky-100' : 'bg-gray-100'
            }`}>
              <Building2 className={`w-5 h-5 ${branch.is_main_branch ? 'text-sky-600' : 'text-gray-500'}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900 truncate">{deduplicateName(branch.name)}</h3>
                {branch.is_main_branch && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200 flex-shrink-0">
                    <Star className="w-3 h-3 fill-sky-500 text-sky-500" />
                    Main Branch
                  </span>
                )}
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${
                branch.is_active ? 'text-green-600' : 'text-gray-400'
              }`}>
                {branch.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {branch.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Action menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[150px]">
                  <button
                    onClick={() => { onAction('edit', branch); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 text-sky-500" />
                    Edit Details
                  </button>
                  
                  {!branch.is_main_branch && (
                    <>
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={() => { onAction('delete', branch); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        Delete Branch
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Branch ID pill */}
        {branch.branch_code && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
              <Hash className="w-3 h-3 text-gray-400" />
              {branch.branch_code}
            </span>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2">
          {(branch.address || branch.city) && (
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>
                {[branch.address, branch.city, branch.province, branch.postal_code]
                  .filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{branch.phone}</span>
            </div>
          )}
          {branch.email && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{branch.email}</span>
            </div>
          )}
          {branch.website && (
            <div className="flex items-center gap-2 text-xs text-sky-600">
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <a href={branch.website} target="_blank" rel="noreferrer" className="hover:underline truncate">
                {branch.website}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
        <button
          onClick={() => onAction('edit', branch)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit Details
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const PracticeOption1: React.FC = () => {
  const { branches, mainClinicId, loading, refetch } = useClinicBranches();

  const [modalOpen, setModalOpen]         = useState(false);
  const [editingBranch, setEditingBranch] = useState<ClinicBranch | null>(null);
  const [saving, setSaving]               = useState(false);
  
  const [confirmModal, setConfirmModal]   = useState<{ action: 'delete' | null; branch: ClinicBranch | null }>({ action: null, branch: null });
  const [isConfirming, setIsConfirming]   = useState(false);

  const mainClinic     = branches.find((b) => b.is_main_branch);
  const mainClinicName = deduplicateName(mainClinic?.name ?? '');

  const total    = branches.length;
  const active   = branches.filter((b) => b.is_active).length;
  const inactive = branches.filter((b) => !b.is_active).length;

  const handleOpenCreate = () => { setEditingBranch(null); setModalOpen(true); };
  
  const handleAction = (action: 'edit' | 'delete', branch: ClinicBranch) => {
    if (action === 'edit') {
      setEditingBranch(branch);
      setModalOpen(true);
    } else {
      setConfirmModal({ action, branch });
    }
  };

  const handleSave = async (data: CreateBranchData) => {
    setSaving(true);
    try {
      if (editingBranch) {
        await updateClinicBranch(editingBranch.id, data);
        if (editingBranch.is_main_branch) invalidateClinicSettingsCache();
        toast.success('Branch updated successfully');
      } else {
        if (!mainClinicId) throw new Error('No main clinic found');
        await createClinicBranch(mainClinicId, data);
        toast.success('Branch created successfully');
      }
      await refetch();
      setModalOpen(false);
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        // Collect all field-level error messages
        const fieldMessages = Object.entries(data)
          .filter(([, v]) => v)
          .map(([key, val]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            const msg = Array.isArray(val) ? val[0] : String(val);
            return key === 'detail' ? msg : `${label}: ${msg}`;
          });
        if (fieldMessages.length > 0) {
          fieldMessages.forEach((msg) => toast.error(msg));
        } else {
          toast.error('Failed to save branch');
        }
      } else {
        toast.error(err.message || 'Failed to save branch');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.branch || !confirmModal.action) return;
    const { branch, action } = confirmModal;
    setIsConfirming(true);
    try {
      if (action === 'delete') {
        await deleteClinicBranch(branch.id);
        toast.success('Branch deleted successfully');
      }
      await refetch();
      setConfirmModal({ action: null, branch: null });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Failed to ${action} branch`);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <div className="p-6 space-y-5">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Clinic Locations</h2>
              <p className="text-xs text-gray-500">Manage your clinic branches and locations</p>
              {mainClinicName && (
                <p className="text-xs text-sky-600 mt-0.5 font-medium">{mainClinicName}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Branch
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Locations', value: total,    color: 'text-gray-900',  bg: 'bg-white',    border: 'border-gray-200'  },
            { label: 'Active',          value: active,   color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
            { label: 'Inactive',        value: inactive, color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200'   },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Branch Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <Building2 className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No locations yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Add your first clinic branch to get started</p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Branch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...branches]
              .sort((a, b) => Number(b.is_main_branch) - Number(a.is_main_branch))
              .map((branch) => (
                <BranchCard key={branch.id} branch={branch} onAction={handleAction} />
              ))}
          </div>
        )}
      </div>

      {/* ── Modal — rendered outside the page div to avoid layout interference ── */}
      <CreateBranchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        branch={editingBranch}
        mode={editingBranch ? 'edit' : 'create'}
        saving={saving}
        mainClinicName={mainClinicName}
      />

      {/* Confirmation Modal */}
      {confirmModal.action && confirmModal.branch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setConfirmModal({ action: null, branch: null })} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Delete Branch
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to permanently delete <strong>{deduplicateName(confirmModal.branch.name)}</strong>? 
                <br /><br />
                This will delete the clinic branch and all users (staff, practitioners, managers) exclusively associated with it. 
                <strong> Patient and client records will NOT be deleted.</strong>
                <br /><br />
                This action cannot be undone.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ action: null, branch: null })}
                  disabled={isConfirming}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isConfirming}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-red-600 hover:bg-red-700"
                >
                  {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
                  Yes, Delete Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
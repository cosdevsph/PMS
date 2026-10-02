import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  UserMinus,
  X,
} from 'lucide-react';
import type { PractitionerRoleImpact } from '../../types/staff.types';

interface DeleteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { isPermanent: boolean }) => void;
  loading: boolean;
  staffName: string;
  impact?: PractitionerRoleImpact;
  isPractitioner: boolean;
  canPermanentDelete?: boolean;
}

export const DeleteStaffModal: React.FC<DeleteStaffModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  staffName,
  impact,
  isPractitioner,
  canPermanentDelete = true,
}) => {
  const [deleteMode, setDeleteMode] = useState<'archive' | 'permanent'>('archive');

  if (!isOpen) return null;

  const isPermanent = deleteMode === 'permanent';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 border border-gray-100">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-rose-50/60 to-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-200/50 shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">
                {isPractitioner ? 'Remove Practitioner' : 'Remove Staff Member'}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Confirm action for <span className="font-semibold text-gray-800">{staffName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 -mt-1 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Future Appointments Impact Alert */}
          {isPractitioner && impact && impact.future_appointments > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">Active Schedule Warning</p>
                  <p className="mt-1 text-amber-800 leading-relaxed">
                    This practitioner currently has{' '}
                    <strong className="text-rose-700 font-bold">
                      {impact.future_appointments} future appointment{impact.future_appointments !== 1 ? 's' : ''}
                    </strong>
                    . Removing or purging will cancel scheduled future bookings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Deletion Mode Choice (Archive vs Permanent Purge) */}
          {canPermanentDelete && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Select Removal Option
              </label>

              <div className="grid grid-cols-1 gap-3">
                {/* Option 1: Soft Archive */}
                <div
                  onClick={() => !loading && setDeleteMode('archive')}
                  className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                    deleteMode === 'archive'
                      ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-400/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                        <UserMinus className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          Deactivate / Archive Account
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          Revokes user login credentials and hides them from active daily rosters.
                        </p>
                        <p className="text-[11px] font-semibold text-amber-800 mt-1">
                          ⚠️ Note: Clinician seat allocation remains occupied.
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === 'archive'}
                      onChange={() => setDeleteMode('archive')}
                      className="mt-1 text-amber-600 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Option 2: Permanent Purge */}
                <div
                  onClick={() => !loading && setDeleteMode('permanent')}
                  className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                    deleteMode === 'permanent'
                      ? 'border-rose-600 bg-rose-50/30 ring-2 ring-rose-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">
                            Permanently Purge & Release Seat
                          </h4>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            Frees 1 Seat
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          Permanently deletes user account credentials and immediately frees 1 clinician allocation on your subscription.
                        </p>
                        <p className="text-[11px] font-semibold text-rose-700 mt-1">
                          Cannot be undone. Historical clinical records remain preserved.
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === 'permanent'}
                      onChange={() => setDeleteMode('permanent')}
                      className="mt-1 text-rose-600 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Data Preservation Guarantee */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 space-y-1">
                <p className="font-bold">Historical Medical Records Preserved</p>
                <p className="text-emerald-900 leading-relaxed">
                  All past completed appointments, clinical notes, patient files, uploaded documents, invoices, and billing audit trails remain permanently stored and intact for compliance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm({ isPermanent })}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-xs transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              isPermanent
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Processing…
              </>
            ) : isPermanent ? (
              <>
                <Trash2 className="w-4 h-4" />
                Permanently Purge & Release Seat
              </>
            ) : (
              <>
                <UserMinus className="w-4 h-4" />
                Archive Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

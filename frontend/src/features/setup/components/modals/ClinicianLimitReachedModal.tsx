import React from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ClinicianLimitInfo {
  current_allocations?: number;
  allowed_allocations?: number;
  archived_allocations?: number;
  archived_practitioners?: Array<{ id: number; name: string; email: string }>;
  plan_code?: string;
  detail?: string;
}

export interface ClinicianLimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitInfo?: ClinicianLimitInfo | null;
  onUpgrade?: () => void;
}

export const ClinicianLimitReachedModal: React.FC<ClinicianLimitReachedModalProps> = ({
  isOpen,
  onClose,
  limitInfo,
  onUpgrade,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const allowed = limitInfo?.allowed_allocations ?? 4;
  const current = limitInfo?.current_allocations ?? 4;
  const archived = limitInfo?.archived_allocations ?? 0;
  const plan = limitInfo?.plan_code ?? 'STARTER';

  const handleUpgradeClick = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/setup?card=account&option=subscription');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity rounded-none"
        onClick={onClose}
      />

      {/* Minimalist Sharp Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-none border border-black shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Subtle Malasakit Primary Gradient Accent Line */}
        <div className="w-full h-1 bg-primary-gradient" />

        <div className="p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
                {plan} Plan • Limit Reached
              </p>
              <h2 className="text-xl font-bold text-black tracking-tight mt-1">
                Clinician Limit Reached
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-black transition-colors rounded-none"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Minimalist Stat Counter & Slim Progress Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-black font-mono tracking-tight">
                {current} / {allowed}
              </span>
              <span className="text-xs font-mono font-medium text-slate-500">
                Clinicians allocated (0 left)
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-none overflow-hidden mt-3">
              <div className="h-full bg-primary-gradient rounded-none w-full" />
            </div>
          </div>

          {/* Concise Text */}
          <div className="mt-5 space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              Your clinic has used all clinician allocations on this plan.
              Upgrade your subscription to add more clinicians.
            </p>
            {archived > 0 && (
              <p className="text-[11px] text-slate-400">
                Note: {archived} archived account{archived > 1 ? 's' : ''} currently hold seat allocations.
              </p>
            )}
          </div>

          {/* Minimalist Action Buttons */}
          <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black transition-colors rounded-none"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleUpgradeClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-slate-800 transition-all rounded-none shadow-sm"
            >
              <span>Upgrade Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

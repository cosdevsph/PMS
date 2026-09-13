import React from 'react';
import { AlertTriangle, Loader2, X, Smartphone, ShieldAlert } from 'lucide-react';
import type { ClinicDevice } from '../../../services/gateway.api';

interface DisconnectConfirmModalProps {
  isOpen: boolean;
  device: ClinicDevice | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const DisconnectConfirmModal: React.FC<DisconnectConfirmModalProps> = ({
  isOpen,
  device,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500 text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Disconnect Gateway Device</h3>
              <p className="text-xs text-red-600">Action cannot be undone automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Are you sure you want to disconnect this device from your clinic?
          </p>

          {/* Device Card Info */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-bold text-gray-900">{device.name}</span>
              {device.model_name && (
                <span className="text-[11px] text-gray-500">({device.model_name})</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-[11px]">
              <div>
                <span className="text-gray-400">Carrier:</span>{' '}
                <span className="text-gray-700 font-medium">
                  {device.sim_carrier || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Phone:</span>{' '}
                <span className="text-gray-700 font-mono">
                  {device.phone_number || 'No number'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Once disconnected, this phone will immediately lose authorization to claim messages.
              Automated clinic SMS messages will either route through the central fallback gateway or remain queued until a new device is paired.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 hover:bg-white text-gray-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Keep Device
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect Device'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  AlertCircle,
  ShieldCheck,
  Zap,
  BatteryCharging,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { gatewayApi, type ClinicDevice } from '../../services/gateway.api';
import { DeviceStatusCard } from './components/DeviceStatusCard';
import { PairingModal } from './components/PairingModal';
import { DisconnectConfirmModal } from './components/DisconnectConfirmModal';
import { InstallAppModal } from './components/InstallAppModal';

export const SMSGatewayDevicePage: React.FC = () => {
  const [device, setDevice] = useState<ClinicDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch paired device
  const fetchDevice = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const res = await gatewayApi.getClinicDevice();
      setDevice(res.has_device ? res.device : null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch clinic device:', err);
      setError('Could not retrieve SMS device status. Please check your network or try again.');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevice();

    // Auto-poll device telemetry every 15 seconds
    const interval = setInterval(() => {
      fetchDevice(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchDevice]);

  // Disconnect handler
  const handleConfirmDisconnect = async () => {
    if (!device) return;

    try {
      setDisconnecting(true);
      const res = await gatewayApi.disconnectClinicDevice(device.clinic_id, device.id);
      toast.success(res.message || 'Device disconnected successfully.');
      setIsDisconnectModalOpen(false);
      setDevice(null);
      await fetchDevice(true);
    } catch (err: any) {
      console.error('Failed to disconnect device:', err);
      const msg = err.response?.data?.error || 'Failed to disconnect device.';
      toast.error(msg);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-sky-500 text-white rounded-xl shadow-xs shrink-0">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">SMS Gateway Device</h2>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              Send automated patient SMS via your clinic's Android phone and SIM card.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Primary Device Status Card */}
      <DeviceStatusCard
        device={device}
        loading={loading || refreshing}
        onPairClick={() => setIsPairModalOpen(true)}
        onDisconnectClick={() => setIsDisconnectModalOpen(true)}
        onRefreshClick={() => fetchDevice(true)}
        onInstallClick={() => setIsInstallModalOpen(true)}
      />

      {/* Diagnostic & Operating Guide */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
          <h3 className="text-xs sm:text-sm font-bold text-gray-900">Recommended Device Setup</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-800 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              1. Keep Phone Plugged In
            </div>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              Keep connected to a charger inside clinic for continuous background sync.
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-800 text-xs">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
              2. Unrestricted Battery
            </div>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              Set Malasakit App battery to "Unrestricted" in Android settings so the OS won't sleep it.
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-800 text-xs">
              <Smartphone className="w-3.5 h-3.5 text-purple-500" />
              3. Active SIM Load
            </div>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              Ensure SIM has active SMS credits or unlimited telco promo (Globe, Smart, DITO).
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PairingModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onSuccess={async () => {
          setIsPairModalOpen(false);
          await fetchDevice(true);
        }}
        onInstallClick={() => {
          setIsPairModalOpen(false);
          setIsInstallModalOpen(true);
        }}
        clinicId={device?.clinic_id}
      />

      <DisconnectConfirmModal
        isOpen={isDisconnectModalOpen}
        device={device}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={handleConfirmDisconnect}
        loading={disconnecting}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onOpenPairModal={() => setIsPairModalOpen(true)}
      />
    </div>
  );
};

export default SMSGatewayDevicePage;


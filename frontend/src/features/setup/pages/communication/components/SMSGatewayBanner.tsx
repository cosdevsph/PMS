import React from 'react';
import { Smartphone, QrCode, ArrowRight, CheckCircle2, AlertCircle, WifiOff, Download, Zap } from 'lucide-react';
import type { ClinicDevice } from '../../../services/gateway.api';

export interface SMSGatewayBannerProps {
  device: ClinicDevice | null;
  loading: boolean;
  onManageClick: () => void;
  onPairClick: () => void;
  onInstallClick?: () => void;
  compact?: boolean;
  className?: string;
}

export const SMSGatewayBanner: React.FC<SMSGatewayBannerProps> = ({
  device,
  loading,
  onManageClick,
  onPairClick,
  onInstallClick,
  compact = false,
  className = '',
}) => {
  if (loading) return null;

  if (!device) {
    return (
      <div
        className={`mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-sky-50/60 to-white border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs ${className}`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 sm:p-2.5 bg-sky-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                Malasakit SMS Gateway
              </h4>
              <span className="text-[10px] font-semibold bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded-full">
                Decentralized
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-snug line-clamp-2 sm:line-clamp-none">
              {compact
                ? 'Link an Android phone with your SIM to send SMS directly.'
                : 'Link an Android SIM phone to send automated patient SMS notifications directly.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
          {onInstallClick && (
            <button
              type="button"
              onClick={onInstallClick}
              className="flex-1 sm:flex-initial px-3 py-1.5 sm:py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Download Android APK"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>APK</span>
            </button>
          )}
          <button
            type="button"
            onClick={onPairClick}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-1.5 sm:py-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Pair Phone</span>
            <span className="xs:hidden">Pair</span>
          </button>
        </div>
      </div>
    );
  }

  const isReady = device.sms_service_status === 'READY';
  const isOffline = device.sms_service_status === 'OFFLINE';

  return (
    <div
      className={`mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs ${
        isReady
          ? 'bg-emerald-50/40 border-emerald-200'
          : isOffline
          ? 'bg-amber-50/40 border-amber-200'
          : 'bg-gray-50 border-gray-200'
      } ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`p-2 sm:p-2.5 rounded-xl shadow-xs text-white shrink-0 mt-0.5 sm:mt-0 ${
            isReady ? 'bg-emerald-600' : isOffline ? 'bg-amber-500' : 'bg-gray-600'
          }`}
        >
          <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[180px] sm:max-w-xs">
              {device.name}
            </h4>
            {isReady ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3" />
                Online & Ready
              </span>
            ) : isOffline ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-700 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-gray-700 bg-gray-200 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                <AlertCircle className="w-3 h-3" />
                {device.sms_service_status}
              </span>
            )}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
            {device.sim_carrier && (
              <span className="font-medium text-gray-700">{device.sim_carrier}</span>
            )}
            {device.phone_number && (
              <>
                <span className="text-gray-300">•</span>
                <span className="font-mono text-gray-600">{device.phone_number}</span>
              </>
            )}
            {device.battery_level !== null && (
              <>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-0.5 text-gray-600">
                  {device.is_charging && <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  {device.battery_level}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
        <button
          type="button"
          onClick={onManageClick}
          className="w-full sm:w-auto px-3.5 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <span>Manage Device</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};


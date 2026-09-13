import {
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  Battery,
  Radio,
  Clock,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Layers,
  Zap,
  Download,
} from 'lucide-react';
import type { ClinicDevice } from '../../../services/gateway.api';

interface DeviceStatusCardProps {
  device: ClinicDevice | null;
  loading: boolean;
  onPairClick: () => void;
  onDisconnectClick: () => void;
  onRefreshClick: () => void;
  onInstallClick?: () => void;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({
  device,
  loading,
  onPairClick,
  onDisconnectClick,
  onRefreshClick,
  onInstallClick,
}) => {
  // Format relative time helper
  const formatRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const date = new Date(timestamp);
    const diffSecs = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Status configuration helper
  const getStatusBadge = () => {
    if (!device) return null;

    switch (device.sms_service_status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online & Ready
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Degraded: Low Battery ({device.battery_level}%)
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Offline ({formatRelativeTime(device.last_seen_at)})
          </span>
        );
      case 'SIM_UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            No SIM Detected
          </span>
        );
      case 'SUSPENDED':
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            {device.status || 'Disconnected'}
          </span>
        );
    }
  };

  // Battery gauge color
  const getBatteryInfo = () => {
    if (!device || device.battery_level === null || device.battery_level === undefined) {
      return { text: 'N/A', color: 'text-gray-400', barColor: 'bg-gray-300' };
    }
    const lvl = device.battery_level;
    if (lvl > 50) return { text: `${lvl}%`, color: 'text-emerald-600', barColor: 'bg-emerald-500' };
    if (lvl > 20) return { text: `${lvl}%`, color: 'text-amber-600', barColor: 'bg-amber-500' };
    return { text: `${lvl}%`, color: 'text-red-600', barColor: 'bg-red-500' };
  };

  const battery = getBatteryInfo();

  // If no device is currently linked
  if (!device) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 sm:p-8 text-center shadow-2xs">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sky-50 text-sky-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xs">
          <Smartphone className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">No Android SMS Gateway Paired</h3>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1 mb-5 sm:mb-6 leading-relaxed">
          Connect an Android phone running <strong>Malasakit Clinic App</strong> with your clinic's SIM card to deliver automated patient SMS notifications directly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-8 w-full">
          {onInstallClick && (
            <button
              type="button"
              onClick={onInstallClick}
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Install App (.apk)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onPairClick}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <QrCode className="w-4 h-4" />
            <span>Pair Malasakit App</span>
          </button>
          <button
            type="button"
            onClick={onRefreshClick}
            disabled={loading}
            className="w-full sm:w-auto px-3.5 sm:px-4 py-2.5 sm:py-3 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 max-w-2xl mx-auto pt-4 sm:pt-6 border-t border-gray-100 text-left">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              Clinic's Own SIM
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              Send SMS with your own carrier promo without third-party fees.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              Centralized Dispatch
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              Queued on server and synced automatically via secure background heartbeat.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              Real-time Telemetry
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              Monitor battery level, carrier status, and delivery receipts live.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Paired Device Card
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-xs hover:border-gray-300 transition-colors">
      {/* Top Banner / Identity */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-gradient-to-r from-sky-50/40 via-white to-sky-50/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-13 sm:h-13 bg-sky-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs shrink-0">
            <Smartphone className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{device.name}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {device.model_name ? `${device.model_name} • ` : ''}
              <span className="font-mono text-gray-600 text-[11px]">
                {device.device_identifier}
              </span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start flex-wrap mt-1 sm:mt-0">
          <button
            type="button"
            onClick={onRefreshClick}
            disabled={loading}
            className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh device status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onPairClick}
            className="flex-1 sm:flex-initial px-3 py-2 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Switch Device</span>
          </button>
          <button
            type="button"
            onClick={onDisconnectClick}
            className="flex-1 sm:flex-initial px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/50">
        {/* Metric 1: SIM & Carrier */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">SIM Carrier</span>
            <Radio className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 truncate">
            {device.sim_carrier || 'No SIM detected'}
            {device.sim_carrier_2 ? ` • ${device.sim_carrier_2}` : ''}
          </p>
          <p className="text-[11px] text-gray-500 font-mono mt-0.5">
            {device.phone_number || (device.sim_slot_index !== null ? `Slot ${device.sim_slot_index + 1}` : 'No number')}
            {device.sim_carrier_2 ? ' (Dual-SIM)' : ''}
          </p>
        </div>

        {/* Metric 2: Battery Level */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">Battery</span>
            <div className="flex items-center gap-1">
              {device.is_charging && (
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              )}
              <Battery className={`w-4 h-4 ${battery.color}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-bold ${battery.color}`}>{battery.text}</span>
            {device.is_charging ? (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 flex items-center gap-0.5">
                Charging
              </span>
            ) : device.battery_level !== null ? (
              <span className="text-[10px] text-gray-400">
                {device.battery_level > 20 ? 'Optimal' : 'Needs charge'}
              </span>
            ) : null}
          </div>
          {device.battery_level !== null && (
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${battery.barColor}`}
                style={{ width: `${Math.min(100, Math.max(0, device.battery_level))}%` }}
              />
            </div>
          )}
        </div>

        {/* Metric 3: Heartbeat / Last Seen */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">Connection</span>
            {device.is_online ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-sm font-bold text-gray-900">
              {formatRelativeTime(device.last_seen_at)}
            </p>
            {device.network_type && (
              <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200/80">
                {device.network_type}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 truncate mt-0.5" title={device.last_seen_at || ''}>
            {device.is_online ? 'Polling every 15s' : 'Awaiting heartbeat'}
          </p>
        </div>

        {/* Metric 4: App & OS */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">Software</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 truncate">
            {device.app_version ? `v${device.app_version}` : 'Malasakit App'}
          </p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] text-gray-500 truncate">
              {device.android_version ? `Android ${device.android_version}` : 'Android Device'}
            </p>
            {onInstallClick && (
              <button
                type="button"
                onClick={onInstallClick}
                className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Download or update Android APK"
              >
                <Download className="w-3 h-3" />
                APK
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="px-6 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>Last SMS Sent: {device.last_sms_at ? formatRelativeTime(device.last_sms_at) : 'None recorded yet'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-gray-400">Clinic:</span>
          <span className="font-semibold text-gray-700">{device.clinic_name}</span>
        </div>
      </div>
    </div>
  );
};

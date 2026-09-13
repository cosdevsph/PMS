import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { gatewayApi, type PairingSessionResponse } from '../../../services/gateway.api';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deviceInfo?: any) => void;
  onInstallClick?: () => void;
  clinicId?: number;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onInstallClick,
  clinicId,
}) => {
  const [session, setSession] = useState<PairingSessionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [pairSuccess, setPairSuccess] = useState(false);
  const [claimedDevice, setClaimedDevice] = useState<any>(null);

  const pollTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // Initialize or fetch new pairing session
  const initSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPairSuccess(false);
      setClaimedDevice(null);

      const data = await gatewayApi.createPairingSession(clinicId);
      setSession(data);
      setTimeRemaining(data.time_remaining_seconds || 600);
    } catch (err: any) {
      console.error('Failed to create pairing session:', err);
      const msg = err.response?.data?.error || 'Failed to generate pairing QR code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // Open modal handler
  useEffect(() => {
    if (isOpen) {
      initSession();
    } else {
      // Clean up timers on close
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setSession(null);
      setPairSuccess(false);
    }
  }, [isOpen, initSession]);

  // Countdown timer
  useEffect(() => {
    if (!session || pairSuccess) return;

    countdownTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [session, pairSuccess]);

  // Status polling every 2 seconds
  useEffect(() => {
    if (!session || pairSuccess || timeRemaining <= 0) return;

    const pollStatus = async () => {
      try {
        const res = await gatewayApi.getPairingStatus(session.id);
        if (res.status === 'CLAIMED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setPairSuccess(true);
          setClaimedDevice(res.claimed_by_device);
          toast.success('Malasakit Clinic App successfully paired!');

          // Wait 1.8s for visual confirmation, then trigger parent callback
          setTimeout(() => {
            onSuccess(res.claimed_by_device);
            onClose();
          }, 1800);
        } else if (res.status === 'EXPIRED' || res.is_expired) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setTimeRemaining(0);
        }
      } catch (err) {
        console.warn('Pairing status poll failed:', err);
      }
    };

    pollTimerRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [session, pairSuccess, timeRemaining, onSuccess, onClose]);

  // Handle cancel & close
  const handleClose = async () => {
    if (session && session.status === 'PENDING' && !pairSuccess) {
      try {
        await gatewayApi.cancelPairingSession(session.id);
      } catch {
        // Ignore cancel errors on exit
      }
    }
    onClose();
  };

  const handleCopyCode = () => {
    if (!session?.pairing_code) return;
    navigator.clipboard.writeText(session.pairing_code);
    setCopied(true);
    toast.success('Pairing code copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500 text-white rounded-xl shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Pair Malasakit Clinic App</h3>
              <p className="text-xs text-gray-500">Android SMS Gateway Configuration</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-3" />
              <p className="text-sm font-medium text-gray-700">Generating secure pairing session...</p>
              <p className="text-xs text-gray-400 mt-1">Creating one-time handshake token</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">Could not initialize pairing</h4>
              <p className="text-xs text-red-600 mt-1 max-w-sm">{error}</p>
              <button
                onClick={initSession}
                className="mt-5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : pairSuccess ? (
            <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Device Successfully Paired!</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                {claimedDevice?.name || 'Your Android phone'} is now connected to{' '}
                <span className="font-semibold text-gray-700">{session?.clinic_name}</span>.
              </p>
              <div className="mt-4 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-700">
                SMS Gateway is online & active
              </div>
            </div>
          ) : session ? (
            <div className="space-y-5">
              {/* Instructions */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 leading-relaxed">
                  <p className="font-semibold">Scan with Malasakit Clinic App</p>
                  <p className="text-sky-700 mt-0.5">
                    Open the app on your Android device containing the clinic SIM card, tap{' '}
                    <strong>Link to Clinic</strong>, and point your camera at this QR code.
                  </p>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center">
                <div className="relative p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-xs flex items-center justify-center">
                  {timeRemaining > 0 ? (
                    <QRCodeSVG
                      value={JSON.stringify(session.qr_payload)}
                      size={210}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-[210px] h-[210px] flex flex-col items-center justify-center bg-gray-50 rounded-xl text-center p-4">
                      <Clock className="w-8 h-8 text-amber-500 mb-2" />
                      <p className="text-xs font-semibold text-gray-800">QR Code Expired</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 mb-3">
                        Codes expire after 10 minutes for security.
                      </p>
                      <button
                        onClick={initSession}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Generate New Code
                      </button>
                    </div>
                  )}

                  {/* Pulse indicator for live polling */}
                  {timeRemaining > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-full border border-gray-200 text-[10px] text-gray-500 font-mono shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Listening
                    </div>
                  )}
                </div>

                {/* Expiry Countdown */}
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">
                    Expires in:{' '}
                    <strong
                      className={`font-mono ${
                        timeRemaining < 60 ? 'text-red-500' : 'text-gray-800'
                      }`}
                    >
                      {formatTime(timeRemaining)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Manual Code Fallback */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600">Manual Pairing Code:</span>
                  <span className="text-[11px] text-gray-400">If camera is unavailable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-center text-base font-bold tracking-wider text-gray-900 select-all">
                    {session.pairing_code}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-2 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-colors"
                    title="Copy code"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gray-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onInstallClick ? (
            <button
              type="button"
              onClick={onInstallClick}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/80 transition-colors cursor-pointer"
              title="Download or scan QR to install Android APK"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Need the Android app? Install / Download APK</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>Need the Android APK? Download Malasakit Clinic App</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 border border-gray-200 hover:bg-white text-gray-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

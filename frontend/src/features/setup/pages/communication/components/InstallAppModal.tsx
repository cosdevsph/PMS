import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Download,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { gatewayApi, type ApkInfoResponse } from '../../../services/gateway.api';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPairModal?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  onOpenPairModal,
}) => {
  const [apkInfo, setApkInfo] = useState<ApkInfoResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('/api/gateway/download-apk/');

  useEffect(() => {
    if (isOpen) {
      // Resolve download URL based on window location
      setDownloadUrl(gatewayApi.getApkDownloadUrl());

      // Fetch APK info
      gatewayApi.getApkInfo()
        .then((info) => setApkInfo(info))
        .catch((err) => {
          console.warn('Could not fetch APK info, using defaults:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 flex items-center justify-between bg-sky-50/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-sky-500 text-white rounded-lg sm:rounded-xl shadow-xs shrink-0">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Install Malasakit Gateway App</h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500">Decentralized Android SMS Dispatcher Node</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Top Download Callout Card */}
          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-sky-50 via-white to-sky-50/30 border border-sky-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-sky-100 text-sky-800">
                  <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                  Official APK
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-gray-500">
                  v{apkInfo?.version || '1.0.0'}
                </span>
                {apkInfo?.size_mb ? (
                  <span className="text-[10px] sm:text-[11px] text-gray-400">
                    ({apkInfo.size_mb} MB)
                  </span>
                ) : null}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                Malasakit Clinic Gateway Node
              </h4>
              <p className="text-[10px] sm:text-[11px] text-gray-500 max-w-xs leading-relaxed">
                Install on any Android device (Android 8.0+) with your clinic's SIM card.
              </p>
            </div>

            <a
              href={downloadUrl}
              download="MalasakitGateway.apk"
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-[11px] sm:text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download APK {apkInfo?.size_mb ? `(${apkInfo.size_mb} MB)` : ''}</span>
            </a>
          </div>

          {/* QR Code Quick Scan for Mobile Browsers */}
          <div className="p-3 sm:p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xs shrink-0">
              <QRCodeSVG
                value={downloadUrl}
                size={84}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs font-bold text-gray-900">
                <QrCode className="w-3.5 h-3.5 text-sky-500" />
                Scan to Download Direct on Phone
              </div>
              <p className="text-[10px] sm:text-[10.5px] text-gray-500 leading-relaxed">
                Open your Android phone camera or QR scanner and point it at this code to download the APK directly onto the phone browser.
              </p>
            </div>
          </div>

          {/* 3-Step Installation Guide */}
          <div className="space-y-2">
            <h5 className="text-[10px] sm:text-[10.5px] font-bold text-gray-800 uppercase tracking-wider">
              Installation Steps on Android
            </h5>

            <div className="space-y-1.5 text-[10px] sm:text-[11px]">
              <div className="p-2.5 rounded-lg sm:rounded-xl bg-white border border-gray-200 flex items-start gap-2.5">
                <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[10.5px] sm:text-[11px]">Download and Open the APK</p>
                  <p className="text-[10px] sm:text-[10.5px] text-gray-500 mt-0.5 leading-relaxed">
                    Download <strong>MalasakitGateway.apk</strong> via the button or QR scan. When download finishes, tap the notification or open the file in your <strong>Files / Downloads</strong> app.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg sm:rounded-xl bg-white border border-gray-200 flex items-start gap-2.5">
                <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[10.5px] sm:text-[11px]">Allow "Install Unknown Apps"</p>
                  <p className="text-[10px] sm:text-[10.5px] text-gray-500 mt-0.5 leading-relaxed">
                    If Android prompts <em>"File might be harmful"</em>, tap <strong>Download anyway</strong>. If prompted for unknown sources, toggle <strong>Allow from this source</strong> for your browser/Files app.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg sm:rounded-xl bg-white border border-gray-200 flex items-start gap-2.5">
                <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[10.5px] sm:text-[11px]">Open App & Grant Permissions</p>
                  <p className="text-[10px] sm:text-[10.5px] text-gray-500 mt-0.5 leading-relaxed">
                    Launch <strong>Malasakit Gateway</strong> and grant SMS (Send/Receive) and Camera permissions. Then tap <strong>Link to Clinic</strong> to scan your dashboard pairing code!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-2.5 sm:p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2 sm:gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[9.5px] sm:text-[10px] text-emerald-900 leading-relaxed">
              <span className="font-bold">Strict Privacy Protection:</span> Malasakit Clinic Gateway operates under zero contacts permissions (<code className="bg-emerald-100/80 px-1 rounded text-[9px] sm:text-[9.5px]">READ_CONTACTS</code> and <code className="bg-emerald-100/80 px-1 rounded text-[9px] sm:text-[9.5px]">WRITE_CONTACTS</code> are completely omitted). Your clinic and patient contacts remain 100% private.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {onOpenPairModal ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPairModal();
              }}
              className="text-[10.5px] sm:text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Already installed? Pair phone now
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-gray-200 hover:bg-white text-gray-700 rounded-lg sm:rounded-xl text-[10.5px] sm:text-[11px] font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppModal;

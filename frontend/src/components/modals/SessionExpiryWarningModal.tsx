import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';

interface SessionExpiryWarningModalProps {
  showWarning:    boolean;
  remainingMs:    number;
  onStayLoggedIn: () => void;
  onLogout:       () => void;
}

export const SessionExpiryWarningModal: React.FC<SessionExpiryWarningModalProps> = ({
  showWarning,
  remainingMs,
  onStayLoggedIn,
  onLogout,
}) => {
  if (!showWarning) return null;

  const totalSec  = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes   = Math.floor(totalSec / 60);
  const seconds   = totalSec % 60;
  const timeLabel = minutes > 0
    ? `${minutes}m ${String(seconds).padStart(2, '0')}s`
    : `${seconds}s`;

  // Progress: 0 = full bar, 1 = empty (counts down over the 5-min window)
  const WARNING_TOTAL_S = 5 * 60;
  const progress = Math.max(0, Math.min(1, totalSec / WARNING_TOTAL_S));

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-fadeIn"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expiry-title"
        aria-describedby="session-expiry-desc"
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-amber-500" />
        </div>

        {/* Heading */}
        <div className="text-center mb-5">
          <h2 id="session-expiry-title" className="text-lg font-semibold text-gray-900 mb-1">
            Session expiring soon
          </h2>
          <p id="session-expiry-desc" className="text-sm text-gray-500">
            You've been inactive for a while. For your security, you'll be automatically
            signed out in:
          </p>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-2xl font-bold tabular-nums text-amber-700">{timeLabel}</span>
          </div>

          {/* Countdown progress bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign out now
          </button>
          <button
            onClick={onStayLoggedIn}
            className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-sm font-medium text-white hover:bg-sky-700 active:bg-sky-800 transition-colors"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
};

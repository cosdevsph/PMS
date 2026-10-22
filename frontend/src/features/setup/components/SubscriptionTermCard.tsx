import React, { useState } from 'react';
import { AlertTriangle, CalendarClock, Info, Loader2, X } from 'lucide-react';

import type { SubscriptionStatusResponse } from '../services/subscription.api';
import { formatDateOnly } from '../pages/account/subscription.utils';

interface SubscriptionTermCardProps {
  subscription: SubscriptionStatusResponse;
  /** Only the clinic owner (Owner role) can request or withdraw a cancellation. */
  isOwner: boolean;
  onRequestCancellation: (reason: string) => Promise<unknown>;
  onWithdrawCancellation: () => Promise<unknown>;
  isRequesting: boolean;
  isWithdrawing: boolean;
}

/** 12-month minimum term and cancellation. Cancellation never takes effect before the term ends. */
export const SubscriptionTermCard: React.FC<SubscriptionTermCardProps> = ({
  subscription,
  isOwner,
  onRequestCancellation,
  onWithdrawCancellation,
  isRequesting,
  isWithdrawing,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  const months = subscription.commitment_months ?? 12;
  const termEnd = formatDateOnly(subscription.term_end ?? undefined);

  const submit = async () => {
    if (!reason.trim()) return;
    try {
      await onRequestCancellation(reason.trim());
      setDialogOpen(false);
      setReason('');
    } catch {
      // The hook shows the error toast; keep the dialog open so the text isn't lost.
    }
  };

  // Free trial: nothing to cancel
  if (subscription.is_trial) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Subscription term</h3>
            <p className="text-xs text-gray-600 mt-1">
              You are on a free trial, so there is nothing to cancel and no commitment yet. Paid plans have a{' '}
              {months}-month minimum term, paid monthly or annually.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs" id="subscription-term">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">{months}-month term</h3>
            <p className="text-xs text-gray-600 mt-1">
              {subscription.term_start && subscription.term_end ? (
                <>
                  Current term: <strong>{formatDateOnly(subscription.term_start)}</strong> to{' '}
                  <strong>{termEnd}</strong>.
                </>
              ) : (
                <>Your {months}-month term dates are being set up.</>
              )}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-xl leading-relaxed">
              Paying monthly does not mean you can cancel month to month. A cancellation request always takes effect at
              the end of the current term, and you keep full access until then.
            </p>
          </div>
        </div>

        {!subscription.cancellation_pending && subscription.can_request_cancellation && isOwner && (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="self-start px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Request cancellation
          </button>
        )}
      </div>

      {subscription.cancellation_pending && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Cancellation scheduled for {formatDateOnly(subscription.cancellation_effective_at ?? undefined)}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Your subscription stays fully active until then. Changed your mind? You can withdraw the request
                before that date.
              </p>
            </div>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => onWithdrawCancellation().catch(() => undefined)}
              disabled={isWithdrawing}
              className="self-start inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {isWithdrawing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Withdraw request
            </button>
          )}
        </div>
      )}

      {!isOwner && (
        <p className="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Only the clinic owner can request or withdraw a cancellation.
        </p>
      )}

      {dialogOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" onClick={() => !isRequesting && setDialogOpen(false)} />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-dialog-title"
              className="w-full max-w-md bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 id="cancel-dialog-title" className="text-base font-semibold text-gray-900">
                  Request cancellation
                </h3>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  disabled={isRequesting}
                  aria-label="Close"
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="rounded-lg bg-sky-50 border border-sky-100 p-3 text-xs text-sky-900 leading-relaxed">
                  Your subscription will <strong>end on {termEnd}</strong>, the end of your current {months}-month
                  term. You keep full access until then, and no refund is given for the remaining term. You can
                  withdraw this request any time before that date.
                </div>
                <div>
                  <label htmlFor="cancel-reason" className="block text-xs font-semibold text-gray-700 mb-1">
                    Why are you cancelling? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="cancel-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Your feedback helps us improve."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    disabled={isRequesting}
                  />
                </div>
              </div>
              <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  disabled={isRequesting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                >
                  Keep my subscription
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={isRequesting || !reason.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequesting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Schedule cancellation
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

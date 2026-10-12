import React from 'react';
import type { Appointment } from '@/types';

export type ReminderResponseStatus = 'CONFIRMED' | 'DECLINED' | 'AWAITING' | null;

export interface ReminderResponseInfo {
  status: ReminderResponseStatus;
  color: string;
  dotClass: string;
  badgeClass: string;
  label: string;
  tooltip: string;
  details?: string;
}

/**
 * Derives the visual reminder response indicator state for an appointment.
 * 
 * Rules:
 * - Green (#10B981): Confirmed (SMS 'YES'/'CONFIRM', Email confirmation link, or CONFIRMED status)
 * - Red (#EF4444): Cancelled / Declined (SMS 'NO'/'CANCEL', Email cancel link, DECLINED/CANCELLED status)
 * - Orange (#F97316): Awaiting response (reminder/confirmation dispatched, but no patient reply yet)
 * - null: No reminder or confirmation ever dispatched (no indicator rendered)
 */
export const getAppointmentReminderResponse = (apt: Appointment | null | undefined): ReminderResponseInfo | null => {
  if (!apt) return null;

  const replyUpper = (apt.patient_reply || apt.response_value || '').trim().toUpperCase();
  const confStatus = (apt.confirmation_status || '').toUpperCase();

  // 1. CONFIRMED (Green: #10B981)
  if (
    confStatus === 'CONFIRMED' ||
    replyUpper === 'Y' ||
    replyUpper === 'YES' ||
    replyUpper === 'CONFIRM' ||
    replyUpper === 'CONFIRMED' ||
    (apt.status === 'CONFIRMED' && Boolean(apt.reminder_sent || apt.confirmation_sent || apt.is_responded))
  ) {
    const replyAt = apt.patient_reply_at
      ? ` at ${new Date(apt.patient_reply_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : '';
    return {
      status: 'CONFIRMED',
      color: '#10B981',
      dotClass: 'bg-[#10B981]',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Confirmed',
      tooltip: `Confirmed (Patient confirmed attendance via SMS/Email${replyAt})`,
      details: apt.patient_reply_at
        ? `Confirmed on ${new Date(apt.patient_reply_at).toLocaleString()}`
        : 'Confirmed by patient',
    };
  }

  // 2. CANCELLED / DECLINED (Red: #EF4444)
  if (
    confStatus === 'DECLINED' ||
    confStatus === 'CANCELLED' ||
    replyUpper === 'N' ||
    replyUpper === 'NO' ||
    replyUpper === 'CANCEL' ||
    replyUpper === 'CANCELLED' ||
    apt.status === 'CANCELLED'
  ) {
    const replyAt = apt.patient_reply_at
      ? ` at ${new Date(apt.patient_reply_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : '';
    return {
      status: 'DECLINED',
      color: '#EF4444',
      dotClass: 'bg-[#EF4444]',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      label: 'Cancelled / Declined',
      tooltip: `Cancelled (Patient declined/cancelled via SMS/Email${replyAt})`,
      details: apt.patient_reply_at
        ? `Declined on ${new Date(apt.patient_reply_at).toLocaleString()}`
        : 'Declined by patient',
    };
  }

  // 3. AWAITING RESPONSE (Orange: #F97316)
  const reminderSent = Boolean(
    apt.reminder_sent ||
    apt.confirmation_sent ||
    apt.reminder_sent_at ||
    apt.confirmation_sent_at
  );

  if (reminderSent || confStatus === 'PENDING') {
    const sentAt = apt.reminder_sent_at || apt.confirmation_sent_at;
    const sentTime = sentAt
      ? ` sent ${new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : '';
    return {
      status: 'AWAITING',
      color: '#F97316',
      dotClass: 'bg-[#F97316]',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Awaiting Response',
      tooltip: `Awaiting Response (Reminder${sentTime}, pending patient reply)`,
      details: sentAt
        ? `Reminder sent ${new Date(sentAt).toLocaleString()}`
        : 'Reminder sent, awaiting reply',
    };
  }

  // 4. NO REMINDER / NO INDICATOR
  return null;
};

/**
 * Circular dot indicator component (Nookal/Malasakit PMS standard).
 */
export const ReminderResponseDot: React.FC<{
  appointment: Appointment | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ appointment, size = 'sm', className = '' }) => {
  const info = getAppointmentReminderResponse(appointment);
  if (!info) return null;

  const sizeClass = size === 'md' ? 'w-2.5 h-2.5 min-w-[10px]' : 'w-2 h-2 min-w-[8px]';

  return (
    <span
      className={`inline-block ${sizeClass} rounded-full ${info.dotClass} ring-1 ring-white/60 shadow-sm flex-shrink-0 mr-1.5 ${className}`}
      title={info.tooltip}
      aria-label={info.tooltip}
      role="status"
    />
  );
};

/**
 * Badge component for displaying response status in details/hover cards.
 */
export const ReminderResponseBadge: React.FC<{
  appointment: Appointment | null | undefined;
  className?: string;
}> = ({ appointment, className = '' }) => {
  const info = getAppointmentReminderResponse(appointment);
  if (!info) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${info.badgeClass} ${className}`}
      title={info.tooltip}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${info.dotClass}`} />
      {info.label}
    </span>
  );
};

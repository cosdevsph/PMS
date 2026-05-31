/**
 * ActionGuard — fine-grained action-level RBAC guard for wrapping buttons,
 * forms, and interactive elements with inline permission enforcement.
 *
 * Usage:
 *   <ActionGuard feature="clinical_notes" required="edit" reason="create clinical notes">
 *     <button onClick={handleCreate}>New Note</button>
 *   </ActionGuard>
 *
 * Access states:
 *   • edit granted   → children render normally
 *   • view only      → children rendered with opacity-50 + pointer-events-none
 *   • none           → children rendered with opacity-40 + blur + pointer-events-none
 *
 * Notes:
 *   • ADMIN (isOwner) bypasses all checks — always full access.
 *   • READ_ONLY role is always blocked for mutations.
 *   • A floating toast notification appears on interaction explaining the restriction.
 */

import React from 'react';
import toast from 'react-hot-toast';
import { Lock, Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import type { FeatureKey, AccessLevel } from '@/types/auth';

// ── Toast renderers ────────────────────────────────────────────────────────────

const ActionLockedToast: React.FC<{ reason?: string; visible: boolean }> = ({ reason, visible }) => (
  <div
    className={`
      flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-rose-200
      px-4 py-3 max-w-xs w-full transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
    `}
  >
    <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
      <Lock className="w-4 h-4 text-rose-500" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800">Action Restricted</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
        {reason
          ? `You don't have permission to ${reason}.`
          : "You don't have permission to perform this action."}
        {' '}Contact your administrator.
      </p>
    </div>
  </div>
);

const ViewOnlyActionToast: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div
    className={`
      flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-amber-200
      px-4 py-3 max-w-xs w-full transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
    `}
  >
    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
      <Eye className="w-4 h-4 text-amber-500" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800">View Only</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
        You have view-only access. Editing and creating are disabled.
        Contact your administrator to request write access.
      </p>
    </div>
  </div>
);

// ── ActionGuard ────────────────────────────────────────────────────────────────

interface ActionGuardProps {
  /** The feature key to check against the user's permission map. */
  feature: FeatureKey;
  /** Minimum access level required for children to be interactive. Defaults to 'edit'. */
  required?: AccessLevel;
  /** Human-readable description of the action, used in the toast message. */
  reason?: string;
  /** The child element(s) to render with access enforcement applied. */
  children: React.ReactNode;
  /** Override the disabled wrapper className. */
  disabledClassName?: string;
}

export const ActionGuard: React.FC<ActionGuardProps> = ({
  feature,
  required = 'edit',
  reason,
  children,
  disabledClassName,
}) => {
  const { accessLevel, isOwner } = usePermissions();

  // ADMIN — fully transparent passthrough
  if (isOwner) return <>{children}</>;

  const level    = accessLevel(feature);
  const hasNone  = level === 'none';
  const viewOnly = level === 'view' && required === 'edit';
  const isDenied = hasNone || viewOnly;

  // Full access — transparent passthrough
  if (!isDenied) return <>{children}</>;

  const showToast = () => {
    const toastId = `action-guard-${feature}-${hasNone ? 'none' : 'view'}`;
    if (hasNone) {
      toast.custom(
        (t) => <ActionLockedToast reason={reason} visible={t.visible} />,
        { id: toastId, duration: 4000 },
      );
    } else {
      toast.custom(
        (t) => <ViewOnlyActionToast visible={t.visible} />,
        { id: toastId, duration: 4000 },
      );
    }
  };

  // ── No access: blurred + dimmed + fully disabled ──
  if (hasNone) {
    return (
      <div
        className={disabledClassName ?? 'opacity-40 blur-[1px] pointer-events-none select-none'}
        aria-disabled="true"
        role="button"
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); showToast(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') showToast(); }}
      >
        {children}
      </div>
    );
  }

  // ── View only: dimmed + interactions disabled ──
  return (
    <div
      className={disabledClassName ?? 'opacity-60 pointer-events-none select-none'}
      aria-disabled="true"
      role="button"
      tabIndex={-1}
      onClick={(e) => { e.stopPropagation(); showToast(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') showToast(); }}
    >
      {children}
    </div>
  );
};

/**
 * practitionerEvents.ts
 *
 * Lightweight event bus for practitioner lifecycle events.
 *
 * Uses the browser's CustomEvent API so any component in any route tree can
 * subscribe without prop drilling or shared state.
 *
 * Events dispatched here trigger `Diary.tsx` to force-refetch appointments,
 * block-outs, and calendar notes immediately after a practitioner role removal.
 *
 * Usage:
 *   // Emitter (CreateStaffAccountModal / useStaffManagement)
 *   import { emitPractitionerRemoved } from '@/events/practitionerEvents';
 *   emitPractitionerRemoved(userId);
 *
 *   // Listener (Diary.tsx)
 *   import { PRACTITIONER_REMOVED_EVENT } from '@/events/practitionerEvents';
 *   window.addEventListener(PRACTITIONER_REMOVED_EVENT, handler);
 */

export const PRACTITIONER_REMOVED_EVENT = 'pms:practitioner-role-removed' as const;

export interface PractitionerRemovedDetail {
  /** User ID whose PRACTITIONER role was just removed */
  userId: number;
  /** Practitioner profile ID that was soft-deleted */
  practitionerId: number | null;
  /** Timestamp of the removal */
  removedAt: string;
}

/**
 * Emit a practitioner-removed event so Calendar/Diary immediately refetch.
 * Safe to call from any component — no import cycles.
 */
export const emitPractitionerRemoved = (
  userId: number,
  practitionerId: number | null = null
): void => {
  const detail: PractitionerRemovedDetail = {
    userId,
    practitionerId,
    removedAt: new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent<PractitionerRemovedDetail>(PRACTITIONER_REMOVED_EVENT, {
      detail,
      bubbles: false,
    })
  );
};

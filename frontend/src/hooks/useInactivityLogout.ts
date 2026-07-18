import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 60 * 1000;  // 10 hours
const TICK_MS               = 1_000;                 // countdown tick interval

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
] as const;

const LS_LAST_ACTIVITY = 'last_activity';

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Tracks user activity and automatically logs out after INACTIVITY_TIMEOUT_MS
 * (10 hours) of no interaction.
 *
 * Only active while the user is authenticated.
 */
export function useInactivityLogout() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout          = useAuthStore(state => state.logout);

  // Refs so interval callbacks always see the latest values without deps churn
  const lastActivityRef   = useRef(Date.now());
  const logoutRef         = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  /** Record activity */
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem(LS_LAST_ACTIVITY, String(lastActivityRef.current));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Restore last-activity timestamp from storage so a page reload doesn't
    // reset the clock (the user was already active in this browser session).
    const stored = localStorage.getItem(LS_LAST_ACTIVITY);
    lastActivityRef.current = stored ? parseInt(stored, 10) : Date.now();

    // Register DOM activity listeners
    ACTIVITY_EVENTS.forEach(ev =>
      document.addEventListener(ev, resetActivity, { passive: true })
    );

    // Tick every second to update the countdown and trigger logout
    const interval = setInterval(() => {
      const elapsed   = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);

      if (remaining === 0) {
        // Time's up — log the user out
        clearInterval(interval);
        toast.error("Your session has expired due to inactivity. Please sign in again.", { duration: 8000 });
        logoutRef.current();
        return;
      }
    }, TICK_MS);

    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach(ev =>
        document.removeEventListener(ev, resetActivity)
      );
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, resetActivity]);
}


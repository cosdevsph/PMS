import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

// ─── Constants ────────────────────────────────────────────────────────────────
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;  // 2 hours
const WARNING_BEFORE_MS     = 5 * 60 * 1000;        // show warning 5 min before logout
const TICK_MS               = 1_000;                 // countdown tick interval

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
] as const;

const LS_LAST_ACTIVITY = 'last_activity';

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Tracks user activity and automatically logs out after INACTIVITY_TIMEOUT_MS
 * (2 hours) of no interaction.  Shows a warning modal 5 minutes before logout.
 *
 * Only active while the user is authenticated.
 *
 * Returns:
 *  - showWarning   – true when the 5-min countdown is active
 *  - remainingMs   – ms until auto-logout (meaningful only while showWarning)
 *  - stayLoggedIn  – call this when the user clicks "Stay logged in"
 */
export function useInactivityLogout() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout          = useAuthStore(state => state.logout);

  const [showWarning, setShowWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(INACTIVITY_TIMEOUT_MS);

  // Refs so interval callbacks always see the latest values without deps churn
  const lastActivityRef   = useRef(Date.now());
  const warningShownRef   = useRef(false);
  const logoutRef         = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  /** Record activity and dismiss the warning if it is currently shown. */
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem(LS_LAST_ACTIVITY, String(lastActivityRef.current));
    if (warningShownRef.current) {
      warningShownRef.current = false;
      setShowWarning(false);
      setRemainingMs(INACTIVITY_TIMEOUT_MS);
    }
  }, []);

  /** Called by the warning modal's "Stay logged in" button. */
  const stayLoggedIn = useCallback(() => {
    resetActivity();
  }, [resetActivity]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up any leftover countdown state when the user is logged out.
      setShowWarning(false);
      setRemainingMs(INACTIVITY_TIMEOUT_MS);
      return;
    }

    // Restore last-activity timestamp from storage so a page reload doesn't
    // reset the clock (the user was already active in this browser session).
    const stored = localStorage.getItem(LS_LAST_ACTIVITY);
    lastActivityRef.current = stored ? parseInt(stored, 10) : Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setRemainingMs(INACTIVITY_TIMEOUT_MS);

    // Register DOM activity listeners
    ACTIVITY_EVENTS.forEach(ev =>
      document.addEventListener(ev, resetActivity, { passive: true })
    );

    // Tick every second to update the countdown and trigger logout/warning
    const interval = setInterval(() => {
      const elapsed   = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);

      setRemainingMs(remaining);

      if (remaining === 0) {
        // Time's up — log the user out
        clearInterval(interval);
        logoutRef.current();
        return;
      }

      if (remaining <= WARNING_BEFORE_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        setShowWarning(true);
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

  return { showWarning, remainingMs, stayLoggedIn };
}

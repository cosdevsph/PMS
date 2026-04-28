/**
 * useCalendarSocket — real-time calendar synchronisation via WebSocket.
 *
 * Connects to  ws/calendar/  using the same JWT-subprotocol auth as the
 * existing notification and chat WebSocket hooks.  On receiving a
 * calendar.update event the appropriate state-update handler is called so
 * the calendar grid refreshes instantly — no full refetch required.
 *
 * Reconnection uses exponential back-off (3 s → … → 48 s, max 5 retries).
 * Handler callbacks are kept in a ref so they never force a reconnect.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Appointment, BlockAppointment } from '@/types';

const WS_BASE     = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://127.0.0.1:8000';
const MAX_RETRIES   = 5;
const BASE_DELAY_MS = 3_000;

// ── Token helper (mirrors the pattern used in useWebSocket.ts) ────────────────
const getToken = (): string | null => {
  const direct = localStorage.getItem('access_token');
  if (direct) return direct;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.tokens?.access ?? parsed?.tokens?.access ?? null;
    }
  } catch { /* ignore */ }
  return null;
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalendarSocketHandlers {
  /** Called when a new appointment is created by any user in the clinic. */
  onAppointmentCreated:  (apt: Appointment)        => void;
  /** Called when an existing appointment is updated (any field). */
  onAppointmentUpdated:  (apt: Appointment)        => void;
  /** Called when an appointment is deleted; receives its numeric id. */
  onAppointmentDeleted:  (id: number)              => void;
  /** Called when a new block-appointment event is created. */
  onBlockCreated:        (block: BlockAppointment) => void;
  /** Called when an existing block-appointment event is updated. */
  onBlockUpdated:        (block: BlockAppointment) => void;
  /** Called when a block-appointment event is deleted; receives its numeric id. */
  onBlockDeleted:        (id: number)              => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Establishes and maintains a WebSocket connection to  ws/calendar/.
 * Returns `{ isConnected }` so the parent can render a live-status indicator.
 *
 * @example
 * const { isConnected } = useCalendarSocket({
 *   onAppointmentCreated: addAppointmentToState,
 *   onAppointmentUpdated: updateAppointmentInState,
 *   onAppointmentDeleted: removeAppointmentFromState,
 *   onBlockCreated:       addBlockAppointmentToState,
 *   onBlockUpdated:       updateBlockAppointmentInState,
 *   onBlockDeleted:       removeBlockAppointmentFromState,
 * });
 */
export const useCalendarSocket = ({
  onAppointmentCreated,
  onAppointmentUpdated,
  onAppointmentDeleted,
  onBlockCreated,
  onBlockUpdated,
  onBlockDeleted,
}: CalendarSocketHandlers): { isConnected: boolean } => {
  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef   = useRef(true);
  const retriesRef   = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  // Keep handler callbacks in a ref so they stay fresh without triggering
  // a reconnect whenever the parent re-renders.
  const handlersRef = useRef<CalendarSocketHandlers>({
    onAppointmentCreated,
    onAppointmentUpdated,
    onAppointmentDeleted,
    onBlockCreated,
    onBlockUpdated,
    onBlockDeleted,
  });

  useEffect(() => {
    handlersRef.current = {
      onAppointmentCreated,
      onAppointmentUpdated,
      onAppointmentDeleted,
      onBlockCreated,
      onBlockUpdated,
      onBlockDeleted,
    };
  }, [
    onAppointmentCreated,
    onAppointmentUpdated,
    onAppointmentDeleted,
    onBlockCreated,
    onBlockUpdated,
    onBlockDeleted,
  ]);

  // ── Cleanup helper ────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen    = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror   = null;
      wsRef.current.onclose   = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // ── Connect ───────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Don't open a second socket while one is already connecting / open.
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
       wsRef.current.readyState === WebSocket.CONNECTING)
    ) return;

    if (retriesRef.current >= MAX_RETRIES) {
      console.warn('[CalendarWS] Max retries reached — giving up.');
      return;
    }

    const token = getToken();
    if (!token) {
      // Token not ready yet — retry shortly.
      reconnectRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 1_000);
      return;
    }

    // Pass the JWT as a WebSocket subprotocol — the server reads it from the
    // Sec-WebSocket-Protocol header and never from the URL, so it won't
    // appear in access logs or browser history.
    const ws = new WebSocket(`${WS_BASE}/ws/calendar/`, ['bearer', token]);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      retriesRef.current = 0;
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data as string) as {
          type:  string;
          event: string;
          data:  unknown;
        };

        // Silently discard anything that isn't our calendar update event
        // (e.g. the pong response to keepalive pings).
        if (msg.type !== 'calendar.update') return;

        const h = handlersRef.current;

        switch (msg.event) {
          case 'APPOINTMENT_CREATED':
            h.onAppointmentCreated(msg.data as Appointment);
            break;
          case 'APPOINTMENT_UPDATED':
            h.onAppointmentUpdated(msg.data as Appointment);
            break;
          case 'APPOINTMENT_DELETED':
            h.onAppointmentDeleted((msg.data as { id: number }).id);
            break;
          case 'BLOCK_CREATED':
            h.onBlockCreated(msg.data as BlockAppointment);
            break;
          case 'BLOCK_UPDATED':
            h.onBlockUpdated(msg.data as BlockAppointment);
            break;
          case 'BLOCK_DELETED':
            h.onBlockDeleted((msg.data as { id: number }).id);
            break;
          default:
            break;
        }
      } catch {
        // Ignore malformed frames.
      }
    };

    ws.onerror = () => {
      // Let onclose handle the reconnect schedule.
      ws.close();
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      wsRef.current = null;
      setIsConnected(false);
      retriesRef.current += 1;

      // Exponential back-off: 3 s → 6 s → 12 s → 24 s → 48 s
      const delay = Math.min(BASE_DELAY_MS * 2 ** (retriesRef.current - 1), 48_000);
      reconnectRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount / unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    retriesRef.current = 0;

    // Short initial delay to ensure the JWT is available in localStorage
    // before attempting the first connection.
    reconnectRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, 300);

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);

  return { isConnected };
};

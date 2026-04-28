"""
Utility for broadcasting calendar mutation events to connected clients via
Django Channels / Redis channel layer.

Called synchronously from DRF views; wraps the async group_send with
async_to_sync so it can be invoked from standard synchronous view code.
"""

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

# ── Public event-type constants ───────────────────────────────────────────────

APPOINTMENT_CREATED = 'APPOINTMENT_CREATED'
APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED'
APPOINTMENT_DELETED = 'APPOINTMENT_DELETED'

BLOCK_CREATED = 'BLOCK_CREATED'
BLOCK_UPDATED = 'BLOCK_UPDATED'
BLOCK_DELETED = 'BLOCK_DELETED'


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_main_clinic_id(user) -> int | None:
    """
    Return the root (main) clinic ID for a user.

    user.clinic points to the user's primary clinic, which may itself be a
    branch.  We walk up to the root with .main_clinic so that all users in the
    same organisation share a single channel group regardless of which branch
    they are assigned to.

    Returns None if the user has no clinic association.
    """
    if not user or not getattr(user, 'clinic_id', None):
        return None
    try:
        return user.clinic.main_clinic.id
    except Exception as exc:  # pragma: no cover
        logger.warning('calendar_events: failed to resolve main_clinic for user %s: %s', user.id, exc)
        return None


def emit_calendar_event(main_clinic_id: int, event_type: str, data: dict) -> None:
    """
    Broadcast a calendar event to every WebSocket client connected to the
    clinic's channel group  ``clinic_{main_clinic_id}``.

    The payload forwarded to the client:
        {
          "type":  "calendar.update",
          "event": "<EVENT_TYPE>",
          "data":  { ... serialized object or {"id": ...} for deletes }
        }

    This function is safe to call from synchronous DRF views.  If the
    channel layer is unavailable (e.g. in tests without Redis) the call is
    silently skipped.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    try:
        async_to_sync(channel_layer.group_send)(
            f'clinic_{main_clinic_id}',
            {
                # 'type' uses underscores — maps to the calendar_update() handler
                # method in CalendarConsumer.
                'type':  'calendar_update',
                'event': event_type,
                'data':  data,
            },
        )
    except Exception as exc:
        # Never let a WS broadcast failure break the HTTP response.
        logger.warning(
            'calendar_events: failed to emit %s for clinic %s: %s',
            event_type, main_clinic_id, exc,
        )

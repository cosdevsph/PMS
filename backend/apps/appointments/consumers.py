"""
CalendarConsumer — real-time calendar event push via WebSocket.

Each authenticated user joins their organisation's channel group:
    clinic_{main_clinic_id}

The backend broadcasts appointment/block-appointment mutations to this group
via calendar_events.emit_calendar_event() after every create/update/delete
operation.  This consumer forwards those broadcasts to the connected browser.

URL:  ws/calendar/
Auth: JWT subprotocol (same mechanism as NotificationConsumer).
"""

import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)


class CalendarConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for real-time calendar synchronisation."""

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def connect(self):
        self.user = self.scope.get('user', AnonymousUser())

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        clinic_group = await self._resolve_clinic_group()
        if not clinic_group:
            # User has no clinic association — cannot join a calendar group.
            await self.close(code=4002)
            return

        self.clinic_group = clinic_group

        await self.channel_layer.group_add(self.clinic_group, self.channel_name)

        # Echo the agreed subprotocol so the browser handshake completes.
        subprotocol = 'bearer' if 'bearer' in self.scope.get('subprotocols', []) else None
        await self.accept(subprotocol=subprotocol)

        logger.debug(
            '[WS:calendar] user %s connected → group %s',
            self.user.id, self.clinic_group,
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'clinic_group'):
            await self.channel_layer.group_discard(self.clinic_group, self.channel_name)

        logger.debug(
            '[WS:calendar] user %s disconnected (code=%s)',
            getattr(self.user, 'id', '?'), close_code,
        )

    async def receive_json(self, content, **kwargs):
        """Handle messages from the client — currently only keepalive pings."""
        if content.get('type') == 'ping':
            await self.send_json({'type': 'pong'})

    # ── Channel-layer event handler ───────────────────────────────────────────

    async def calendar_update(self, event):
        """
        Called by the channel layer when calendar_events.emit_calendar_event()
        invokes group_send with type='calendar_update'.

        Forwards the payload verbatim to the connected WebSocket client.
        """
        await self.send_json({
            'type':  'calendar.update',
            'event': event['event'],
            'data':  event['data'],
        })

    # ── Helpers ───────────────────────────────────────────────────────────────

    @database_sync_to_async
    def _resolve_clinic_group(self) -> str | None:
        """
        Resolve the root clinic for this user and return the channel group name.
        Runs in a thread pool so it can safely perform ORM queries.
        """
        try:
            if not self.user.clinic_id:
                return None
            main_clinic = self.user.clinic.main_clinic
            return f'clinic_{main_clinic.id}'
        except Exception as exc:
            logger.warning(
                '[WS:calendar] failed to resolve clinic group for user %s: %s',
                getattr(self.user, 'id', '?'), exc,
            )
            return None

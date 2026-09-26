"""
gateway/views.py

All gateway-facing API views.

Authentication contract:
  - DeviceRegisterView   : uses GATEWAY_REGISTRATION_SECRET (server-to-server, one-time)
  - All other views      : GatewayDeviceAuthentication (Bearer <device_token>) + IsActiveGatewayDevice
"""
import os
import logging
from datetime import timedelta
from django.conf import settings
from django.http import FileResponse
from django.urls import reverse
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.common.permissions import HasFeaturePermission
from apps.clinics.models import Clinic
from .authentication import GatewayDeviceAuthentication, IsActiveGatewayDevice
from .models import GatewayDevice, WebhookEvent, DevicePairingSession
from .serializers import (
    DeviceRegistrationSerializer,
    DeviceRegistrationResponseSerializer,
    DevicePublicSerializer,
    ClinicDeviceDetailSerializer,
    DevicePairingSessionResponseSerializer,
    DevicePairingRequestSerializer,
)
from apps.smsgateway.models import SMSMessage, DeliveryEvent, InboundSMS
from django.db import models
import phonenumbers

logger = logging.getLogger(__name__)


# ==============================================================================
# DEVICE REGISTRATION
# ==============================================================================

class DeviceRegisterView(APIView):
    """
    POST /api/gateway/devices/register/

    Register a physical Android gateway device.
    Protected by GATEWAY_REGISTRATION_SECRET (shared server-side secret),
    separate from the per-device token that this endpoint generates.

    Authentication: X-Registration-Secret header
    Permission:     None (public but secret-protected)

    Idempotent: if device_identifier already exists, returns the existing
    device record WITHOUT rotating the token.
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        # 1. Verify registration secret
        registration_secret = request.headers.get('X-Registration-Secret', '')
        expected_secret = settings.GATEWAY_REGISTRATION_SECRET
        if not registration_secret or registration_secret != expected_secret:
            logger.warning("DeviceRegisterView: unauthorized registration attempt from %s", request.META.get('REMOTE_ADDR'))
            return Response({"error": "Invalid registration secret."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = DeviceRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        device_identifier = serializer.validated_data['device_identifier']
        device_name = serializer.validated_data['device_name']
        phone_number = serializer.validated_data.get('phone_number', '')

        # 2. Idempotency — return existing device without token rotation
        try:
            device = GatewayDevice.objects.get(device_identifier=device_identifier)
            logger.info("DeviceRegisterView: device '%s' already exists — returning existing record", device_identifier)
            # Return existing device WITHOUT the token (token already issued)
            return Response(
                DevicePublicSerializer(device).data,
                status=status.HTTP_200_OK
            )
        except GatewayDevice.DoesNotExist:
            pass

        # 3. Create new device with a fresh cryptographic token
        token = GatewayDevice.generate_token()
        device = GatewayDevice.objects.create(
            device_identifier=device_identifier,
            name=device_name,
            phone_number=phone_number,
            device_token=token,
            status='ACTIVE',
            is_active=True,
        )
        logger.info("DeviceRegisterView: registered new device '%s' (id=%s)", device_identifier, device.id)

        # Return token ONLY on initial registration
        response_data = DeviceRegistrationResponseSerializer(device).data
        return Response(response_data, status=status.HTTP_201_CREATED)


# ==============================================================================
# DEVICE HEARTBEAT
# ==============================================================================

class DeviceHeartbeatView(APIView):
    """
    POST /api/gateway/devices/heartbeat/

    Called periodically by the Android app to signal the device is online.
    Updates last_seen_at on the GatewayDevice record and updates any telemetry provided.

    Authentication: Bearer <device_token>
    """
    authentication_classes = [GatewayDeviceAuthentication]
    permission_classes = [IsActiveGatewayDevice]

    def post(self, request, *args, **kwargs):
        device = request.gateway_device
        
        # Telemetry updates (battery, charging, network, SIMs, app version)
        update_fields = ['last_seen_at', 'updated_at']
        sim_carrier = request.data.get('sim_carrier')
        sim_carrier_2 = request.data.get('sim_carrier_2')
        battery_level = request.data.get('battery_level')
        is_charging = request.data.get('is_charging')
        network_type = request.data.get('network_type')
        signal_strength = request.data.get('signal_strength')
        app_version = request.data.get('app_version')
        phone_number = request.data.get('phone_number')
        sim_slot_index = request.data.get('sim_slot_index')
        sim_subscription_id = request.data.get('sim_subscription_id')
        
        if sim_carrier:
            device.sim_carrier = sim_carrier
            update_fields.append('sim_carrier')
        if sim_carrier_2 is not None:
            device.sim_carrier_2 = sim_carrier_2
            update_fields.append('sim_carrier_2')
        if is_charging is not None:
            device.is_charging = bool(is_charging)
            update_fields.append('is_charging')
        if network_type:
            device.network_type = network_type
            update_fields.append('network_type')
        if signal_strength is not None:
            try:
                device.signal_strength = int(signal_strength)
                update_fields.append('signal_strength')
            except (ValueError, TypeError):
                pass
        if battery_level is not None:
            try:
                device.battery_level = int(battery_level)
                update_fields.append('battery_level')
            except (ValueError, TypeError):
                pass
        if app_version:
            device.app_version = app_version
            update_fields.append('app_version')
        if phone_number and not device.phone_number:
            device.phone_number = phone_number
            update_fields.append('phone_number')
        if sim_slot_index is not None:
            device.sim_slot_index = sim_slot_index
            update_fields.append('sim_slot_index')
        if sim_subscription_id is not None:
            device.sim_subscription_id = sim_subscription_id
            update_fields.append('sim_subscription_id')

        device.last_seen_at = timezone.now()
        device.save(update_fields=list(set(update_fields)))

        # Calculate pending outbound messages queued for this device / clinic
        from apps.smsgateway.models import SMSMessage
        if device.clinic:
            queue_count = SMSMessage.objects.filter(
                clinic=device.clinic,
                status=SMSMessage.STATUS_QUEUED
            ).count()
        else:
            queue_count = SMSMessage.objects.filter(
                clinic__isnull=True,
                status=SMSMessage.STATUS_QUEUED
            ).count()
        
        logger.info(
            "DeviceHeartbeatView: heartbeat from '%s' (service=%s, battery=%s%%, charging=%s, net=%s, queue=%s)",
            device.device_identifier, device.sms_service_status, device.battery_level, device.is_charging, device.network_type, queue_count
        )
        return Response({
            "device_id": str(device.id),
            "device_identifier": device.device_identifier,
            "status": "online",
            "device_status": device.status,
            "is_online": device.is_online(),
            "sms_service_status": device.sms_service_status,
            "queue_count": queue_count,
            "last_seen_at": device.last_seen_at,
        }, status=status.HTTP_200_OK)


# ==============================================================================
# GATEWAY QUEUE
# ==============================================================================

class GatewayQueueView(APIView):
    """
    GET /api/gateway/queue/

    Polled by the Android gateway device to claim QUEUED messages.

    Authentication: Bearer <device_token>

    UNASSIGNED MESSAGE POLICY (Chunk 2):
    Messages with gateway_device=NULL are visible to any authenticated active device.
    This allows the system to work before device-level routing is configured.
    In a future chunk, explicit device assignment routing can be added.

    Race condition protection:
    Uses SELECT FOR UPDATE SKIP LOCKED + atomic SENDING transition, so concurrent
    polls from different devices cannot claim the same message.

    After claiming, last_seen_at is updated (implicit heartbeat).
    """
    authentication_classes = [GatewayDeviceAuthentication]
    permission_classes = [IsActiveGatewayDevice]

    def get(self, request, *args, **kwargs):
        device = request.gateway_device

        with transaction.atomic():
            # Clinic-Specific Routing & Queue Isolation:
            # 1. If device is assigned to a specific clinic (Malasakit Clinic App):
            #    Claim ONLY messages originating from device.clinic.
            # 2. If device is global / legacy (Gateway BNE-LX1, clinic=None):
            #    Claim messages with clinic=None OR clinics without an active paired device.
            if device.clinic_id is not None:
                queue_filter = models.Q(clinic=device.clinic) & (
                    models.Q(gateway_device=device) | models.Q(gateway_device__isnull=True)
                )
            else:
                # Active clinics that currently have their own active paired phone
                active_paired_clinic_ids = GatewayDevice.objects.filter(
                    clinic__isnull=False,
                    is_active=True,
                    status='ACTIVE'
                ).values_list('clinic_id', flat=True)

                queue_filter = (
                    models.Q(clinic__isnull=True) | ~models.Q(clinic_id__in=active_paired_clinic_ids)
                ) & (
                    models.Q(gateway_device=device) | models.Q(gateway_device__isnull=True)
                )

            queued_messages = SMSMessage.objects.select_for_update(skip_locked=True).filter(
                status=SMSMessage.STATUS_QUEUED
            ).filter(
                queue_filter
            ).filter(
                models.Q(scheduled_time__isnull=True) | models.Q(scheduled_time__lte=timezone.now())
            ).order_by('created_at')[:50]

            message_list = list(queued_messages)
            message_ids = [m.id for m in message_list]

            # Atomically claim: assign device + transition to SENDING
            if message_ids:
                SMSMessage.objects.filter(id__in=message_ids).update(
                    status=SMSMessage.STATUS_SENDING,
                    gateway_device=device,
                    updated_at=timezone.now()
                )
                try:
                    from apps.notifications.models import CommunicationLog
                    from apps.notifications.services.notification_service import broadcast_communication_log_updated
                    comm_logs = CommunicationLog.objects.filter(message_id__in=[str(m_id) for m_id in message_ids])
                    for cl in comm_logs:
                        cl.status = 'SENT'
                        meta = cl.event_metadata or {}
                        meta['gateway_device'] = {
                            'id': str(device.id),
                            'name': device.name,
                            'identifier': device.device_identifier,
                            'sim_carrier': device.sim_carrier or '',
                            'model_name': device.model_name or '',
                        }
                        cl.event_metadata = meta
                        cl.save(update_fields=['status', 'event_metadata', 'updated_at'])
                        try:
                            broadcast_communication_log_updated(cl)
                        except Exception as bc_e:
                            pass
                except Exception as cl_err:
                    logger.warning("GatewayQueueView: Failed to sync CommunicationLog: %s", cl_err)

        # Implicit heartbeat — polling counts as activity
        device.touch()

        logger.info(
            "GatewayQueueView: device '%s' (clinic=%s) claimed %s message(s)",
            device.device_identifier, device.clinic_id, len(message_list)
        )

        messages_data = [
            {
                "id": str(msg.id),
                "recipient": msg.recipient_number,
                "body": msg.body,
            }
            for msg in message_list
        ]

        return Response({"messages": messages_data}, status=status.HTTP_200_OK)


# ==============================================================================
# DELIVERY WEBHOOK
# ==============================================================================

class WebhookDeliveryView(APIView):
    """
    POST /api/gateway/webhooks/delivery/

    Receives delivery status updates from the Android gateway device.

    Authentication: Bearer <device_token>

    Ownership check: a device can only update SMS messages it was assigned.
    Cross-device updates return 403 Forbidden.

    Payload:
        message_id  — SMSMessage UUID returned by /queue/
        status      — SENT / DELIVERED / FAILED / UNDELIVERED
        event_id    — unique ID for this event (idempotency key)
        description — optional human-readable detail
    """
    authentication_classes = [GatewayDeviceAuthentication]
    permission_classes = [IsActiveGatewayDevice]

    def post(self, request, *args, **kwargs):
        device = request.gateway_device
        payload = request.data
        message_id = payload.get('message_id')
        new_status = payload.get('status')
        event_id = payload.get('event_id')

        if not message_id or not new_status:
            return Response(
                {"error": "Missing required fields: message_id, status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Idempotency — reject already-processed event_ids
            if event_id and WebhookEvent.objects.filter(
                raw_payload__event_id=event_id, status='PROCESSED'
            ).exists():
                return Response({"message": "Already processed"}, status=status.HTTP_200_OK)

            webhook_event = WebhookEvent.objects.create(
                event_type='delivery_receipt',
                raw_payload=payload,
                gateway_device=device,
                status='PENDING'
            )

            # Look up SMSMessage by UUID
            try:
                sms_message = SMSMessage.objects.get(id=message_id)
            except (SMSMessage.DoesNotExist, Exception):
                # Fallback: try provider_message_id
                try:
                    sms_message = SMSMessage.objects.get(provider_message_id=message_id)
                except SMSMessage.DoesNotExist:
                    webhook_event.status = 'FAILED'
                    webhook_event.save()
                    logger.warning("WebhookDeliveryView: message_id %s not found", message_id)
                    return Response({"error": "Message not found"}, status=status.HTTP_200_OK)

            # Ownership check — prevent Device A from modifying Device B's SMS
            if sms_message.gateway_device_id and sms_message.gateway_device_id != device.id:
                webhook_event.status = 'FAILED'
                webhook_event.save()
                logger.warning(
                    "WebhookDeliveryView: device '%s' attempted to update SMS %s owned by device '%s'",
                    device.device_identifier, message_id,
                    sms_message.gateway_device.device_identifier if sms_message.gateway_device else 'unknown'
                )
                return Response(
                    {"error": "Forbidden: this message was not assigned to your device."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Idempotency — reject duplicate state transition
            if sms_message.status == new_status and sms_message.delivery_events.filter(status=new_status).exists():
                webhook_event.status = 'IGNORED'
                webhook_event.save()
                return Response({"message": "Duplicate state transition ignored"}, status=status.HTTP_200_OK)

            # Record delivery event
            DeliveryEvent.objects.create(
                message=sms_message,
                status=new_status,
                description=payload.get('description', ''),
                provider_timestamp=timezone.now()
            )

            # Update SMSMessage status using model helpers
            if new_status == SMSMessage.STATUS_DELIVERED:
                sms_message.mark_delivered()
            elif new_status == SMSMessage.STATUS_SENT:
                sms_message.mark_sent()
            elif new_status in [SMSMessage.STATUS_FAILED, SMSMessage.STATUS_UNDELIVERED]:
                sms_message.mark_failed(reason=payload.get('description', 'Gateway reported failure'))
            else:
                sms_message.status = new_status
                sms_message.save(update_fields=['status', 'updated_at'])

            webhook_event.status = 'PROCESSED'
            webhook_event.save()

            device.last_sms_at = timezone.now()
            device.save(update_fields=['last_sms_at', 'updated_at'])

            # Synchronize with CommunicationLog for real-time web dashboard visibility
            try:
                from apps.notifications.models import CommunicationLog
                from apps.notifications.services.notification_service import broadcast_communication_log_updated

                comm_log = CommunicationLog.objects.filter(message_id=str(sms_message.id)).first()
                if not comm_log and sms_message.recipient_number:
                    comm_log = CommunicationLog.objects.filter(
                        recipient=sms_message.recipient_number,
                        channel='SMS'
                    ).order_by('-created_at').first()

                if comm_log:
                    status_map = {
                        SMSMessage.STATUS_DELIVERED: 'DELIVERED',
                        SMSMessage.STATUS_SENT: 'SENT',
                        SMSMessage.STATUS_FAILED: 'FAILED',
                        SMSMessage.STATUS_UNDELIVERED: 'FAILED',
                    }
                    mapped_status = status_map.get(new_status, new_status)
                    comm_log.status = mapped_status
                    if new_status == SMSMessage.STATUS_DELIVERED:
                        comm_log.delivered_at = timezone.now()
                    elif new_status in [SMSMessage.STATUS_FAILED, SMSMessage.STATUS_UNDELIVERED]:
                        comm_log.error_message = payload.get('description', 'Gateway reported delivery failure')

                    meta = comm_log.event_metadata or {}
                    meta['gateway_device'] = {
                        'id': str(device.id),
                        'name': device.name,
                        'identifier': device.device_identifier,
                        'sim_carrier': device.sim_carrier or '',
                        'model_name': device.model_name or '',
                    }
                    if payload.get('error_code'):
                        meta['carrier_error_code'] = payload.get('error_code')
                    if payload.get('delivered_at'):
                        meta['device_timestamp'] = payload.get('delivered_at')
                    comm_log.event_metadata = meta

                    comm_log.save(update_fields=['status', 'delivered_at', 'error_message', 'event_metadata', 'updated_at'])
                    broadcast_communication_log_updated(comm_log)
            except Exception as comm_err:
                logger.warning("WebhookDeliveryView: Failed to sync CommunicationLog: %s", comm_err)

            logger.info(
                "WebhookDeliveryView: device '%s' updated SMS %s → %s",
                device.device_identifier, message_id, new_status
            )
            return Response({"message": "Webhook processed successfully"}, status=status.HTTP_200_OK)


# ==============================================================================
# INBOUND WEBHOOK
# ==============================================================================

class WebhookInboundView(APIView):
    """
    POST /api/gateway/webhooks/inbound/

    Receives inbound SMS messages captured by the Android gateway device.

    Authentication: Bearer <device_token>

    The authenticated device is recorded as the gateway_device on the
    InboundSMS record for traceability.

    Payload:
        message_id — unique ID from the device (idempotency key)
        sender     — sender phone number
        recipient  — gateway SIM phone number
        message    — SMS body text
    """
    authentication_classes = [GatewayDeviceAuthentication]
    permission_classes = [IsActiveGatewayDevice]

    def post(self, request, *args, **kwargs):
        device = request.gateway_device
        payload = request.data
        provider_message_id = payload.get('message_id')
        sender = payload.get('sender')
        recipient = (payload.get('recipient') or device.phone_number or device.name or 'Clinic Gateway')[:20]
        body = payload.get('message')

        if not all([provider_message_id, sender, body]):
            return Response(
                {"error": "Missing required fields: message_id, sender, message"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Idempotency
            if InboundSMS.objects.filter(provider_message_id=provider_message_id).exists():
                return Response({"message": "Already processed"}, status=status.HTTP_200_OK)

            # Normalize sender to E.164 (PH region)
            normalized_sender = sender
            try:
                parsed = phonenumbers.parse(sender, "PH")
                if phonenumbers.is_valid_number(parsed):
                    normalized_sender = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            except Exception:
                pass

            # Build phone variations for robust patient matching (E.164, local 09XX, 639XX)
            possible_phones = {sender, normalized_sender}
            if normalized_sender.startswith('+63'):
                possible_phones.add('0' + normalized_sender[3:])
                possible_phones.add(normalized_sender[1:])
            elif normalized_sender.startswith('0'):
                possible_phones.add('+63' + normalized_sender[1:])
            elif normalized_sender.startswith('63'):
                possible_phones.add('+' + normalized_sender)
                possible_phones.add('0' + normalized_sender[2:])

            inbound_sms = InboundSMS.objects.create(
                clinic=device.clinic,
                sender_number=normalized_sender[:20],
                recipient_number=recipient,
                body=body,
                gateway_device=device,
                provider_message_id=provider_message_id,
                processed_status='PENDING',
                received_at=timezone.now()
            )

            # ── Correlate context and Auto-Process Y/N Replies ───────
            reply_text = body.strip().upper()
            try:
                from apps.appointments.models import Appointment, AppointmentCancelToken, RebookingLink
                from apps.notifications.models import CommunicationLog
                from apps.notifications.services.notification_service import broadcast_communication_log_updated
                from apps.gateway.services import (
                    resolve_interaction_context,
                    queue_confirmation_sms_on_yes,
                    queue_options_sms_on_no,
                )

                patient, appointment, clinic, original_reminder_log = resolve_interaction_context(
                    sender_phone=sender,
                    device=device
                )

                if clinic and not inbound_sms.clinic:
                    inbound_sms.clinic = clinic
                    inbound_sms.save(update_fields=['clinic'])

                is_yes = reply_text in ["Y", "YES"]
                is_no = reply_text in ["N", "NO"]
                patient_reply_val = 'CONFIRM' if is_yes else ('CANCEL' if is_no else '')

                if appointment:
                    if is_yes:
                        # Mark appointment confirmed if not already
                        if appointment.status != 'CONFIRMED':
                            appointment.status = 'CONFIRMED'
                            appointment.confirmation_status = 'CONFIRMED'
                            appointment.patient_reply = 'Y'
                            appointment.patient_reply_at = timezone.now()
                            appointment.save(update_fields=[
                                'status', 'confirmation_status', 'patient_reply', 'patient_reply_at', 'updated_at'
                            ])

                            # Invalidate unused tokens
                            RebookingLink.objects.filter(appointment=appointment, is_used=False).update(
                                is_used=True, used_at=timezone.now()
                            )
                            AppointmentCancelToken.objects.filter(appointment=appointment, is_used=False).update(
                                is_used=True, used_at=timezone.now()
                            )

                            target_clinic = clinic or appointment.clinic or device.clinic
                            queue_confirmation_sms_on_yes(
                                appointment=appointment,
                                patient=patient,
                                clinic=target_clinic,
                                device=device
                            )
                        else:
                            logger.info("Appointment %s is already CONFIRMED; skipping duplicate confirmation SMS", appointment.id)

                    elif is_no:
                        # DO NOT cancel immediately. Keep appointment SCHEDULED.
                        appointment.confirmation_status = 'DECLINED'
                        appointment.patient_reply = 'N'
                        appointment.patient_reply_at = timezone.now()
                        appointment.save(update_fields=[
                            'confirmation_status', 'patient_reply', 'patient_reply_at', 'updated_at'
                        ])

                        # Check idempotency: avoid spamming options SMS if sent in the last 10 minutes
                        recent_options_sms = CommunicationLog.objects.filter(
                            appointment=appointment,
                            comm_type='CANCELLATION_NOTICE',
                            channel='SMS',
                            direction='OUTBOUND',
                            created_at__gte=timezone.now() - timedelta(minutes=10)
                        ).exists()

                        if not recent_options_sms:
                            target_clinic = clinic or appointment.clinic or device.clinic
                            queue_options_sms_on_no(
                                appointment=appointment,
                                patient=patient,
                                clinic=target_clinic,
                                device=device
                            )
                        else:
                            logger.info("Options SMS already sent recently for appointment %s; skipping duplicate", appointment.id)

                # Update original reminder log if correlated
                if original_reminder_log and patient_reply_val:
                    original_reminder_log.status = 'REPLIED'
                    original_reminder_log.patient_reply = patient_reply_val
                    original_reminder_log.replied_at = timezone.now()
                    original_reminder_log.save(update_fields=['status', 'patient_reply', 'replied_at'])
                    try:
                        broadcast_communication_log_updated(original_reminder_log)
                    except Exception as bc_e:
                        logger.warning("Failed to broadcast updated reminder log: %s", bc_e)

                # Always log the inbound message to CommunicationLog if patient is identified
                if patient:
                    meta = {
                        'gateway_device': {
                            'id': str(device.id),
                            'name': device.name,
                            'identifier': device.device_identifier,
                            'sim_carrier': device.sim_carrier or '',
                        },
                        'raw_reply': body,
                        'normalized_sender': normalized_sender,
                    }
                    if appointment:
                        meta['appointment_id'] = str(appointment.id)
                        meta['appointment_status'] = appointment.status

                    target_clinic = clinic or (appointment.clinic if appointment else (patient.clinic if patient else device.clinic))
                    if target_clinic:
                        new_log = CommunicationLog.objects.create(
                            clinic=target_clinic,
                            patient=patient,
                            appointment=appointment,
                            practitioner=appointment.practitioner if appointment else None,
                            comm_type='PATIENT_RESPONSE',
                            channel='SMS',
                            direction='INBOUND',
                            status='DELIVERED',
                            recipient=normalized_sender,
                            subject=f"Patient Reply: {body[:30]}",
                            body_preview=body[:2000],
                            full_body=body,
                            patient_reply=patient_reply_val,
                            replied_at=timezone.now(),
                            event_metadata=meta,
                        )
                        try:
                            broadcast_communication_log_updated(new_log)
                        except Exception as bc_e:
                            logger.warning("Failed to broadcast patient response log: %s", bc_e)

                    inbound_sms.processed_status = 'PROCESSED'
                    inbound_sms.save(update_fields=['processed_status'])
                    logger.info("WebhookInboundView: Logged inbound message from %s (appointment %s)", normalized_sender, appointment.id if appointment else "None")
                else:
                    logger.info("WebhookInboundView: Received inbound SMS from unknown patient %s", normalized_sender)

            except Exception as ex:
                logger.error("WebhookInboundView: Error processing reply: %s", ex, exc_info=True)

            logger.info(
                "WebhookInboundView: device '%s' received inbound SMS from %s (msg_id=%s)",
                device.device_identifier, normalized_sender, provider_message_id
            )
            return Response({"message": "Inbound message received"}, status=status.HTTP_200_OK)


# ==============================================================================
# SECURE QR & CODE PAIRING VIEWS
# ==============================================================================

def _resolve_user_clinic(user, clinic_id=None):
    """
    Safely resolve target clinic from request user.
    Enforces that user can only manage their own clinic or child branches.
    """
    if not user.clinic:
        return None, "User has no clinic assigned."

    user_clinic = user.clinic
    user_main_clinic = user_clinic.main_clinic

    if clinic_id:
        try:
            target = Clinic.objects.get(id=clinic_id)
            if target.main_clinic.id != user_main_clinic.id and not getattr(user, 'is_owner', False):
                return None, "You do not have permission to access this clinic branch."
            return target, None
        except Clinic.DoesNotExist:
            return None, "Clinic branch not found."

    # Default to user's assigned clinic_branch if present, else user_clinic
    return getattr(user, 'clinic_branch', None) or user_clinic, None


class CreatePairingSessionView(APIView):
    """
    POST /api/gateway/pairing/session/

    Generates a secure, short-lived (10 min) pairing session with a one-time
    cryptographic token, human-friendly fallback code, and QR payload.
    Requires: IsAuthenticated and setup_communication ('edit').
    """
    permission_classes = [IsAuthenticated, HasFeaturePermission]
    rbac_feature = 'setup_communication'
    rbac_min_level = 'edit'

    def post(self, request, *args, **kwargs):
        clinic, error = _resolve_user_clinic(request.user, request.data.get('clinic_id'))
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Invalidate any existing PENDING sessions for this clinic
            DevicePairingSession.objects.filter(
                clinic=clinic,
                status=DevicePairingSession.STATUS_PENDING
            ).update(status=DevicePairingSession.STATUS_CANCELLED)

            pairing_token = DevicePairingSession.generate_token()
            pairing_code = DevicePairingSession.generate_unique_code()
            expires_at = timezone.now() + timedelta(minutes=10)

            session = DevicePairingSession.objects.create(
                clinic=clinic,
                pairing_token=pairing_token,
                pairing_code=pairing_code,
                status=DevicePairingSession.STATUS_PENDING,
                expires_at=expires_at,
                created_by=request.user,
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        logger.info(
            "CreatePairingSessionView: Created pairing session %s (code=%s) for clinic '%s' by user %s",
            session.id, pairing_code, clinic.name, request.user.email
        )

        serializer = DevicePairingSessionResponseSerializer(session, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CancelPairingSessionView(APIView):
    """
    POST /api/gateway/pairing/cancel/

    Cancels active pending pairing session(s) for the clinic.
    """
    permission_classes = [IsAuthenticated, HasFeaturePermission]
    rbac_feature = 'setup_communication'
    rbac_min_level = 'edit'

    def post(self, request, *args, **kwargs):
        clinic, error = _resolve_user_clinic(request.user, request.data.get('clinic_id'))
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        session_id = request.data.get('session_id')
        if session_id:
            qs = DevicePairingSession.objects.filter(id=session_id, clinic=clinic, status=DevicePairingSession.STATUS_PENDING)
        else:
            qs = DevicePairingSession.objects.filter(clinic=clinic, status=DevicePairingSession.STATUS_PENDING)

        count = qs.update(status=DevicePairingSession.STATUS_CANCELLED)
        logger.info("CancelPairingSessionView: Cancelled %s session(s) for clinic '%s'", count, clinic.name)
        return Response({"message": f"{count} pairing session(s) cancelled."}, status=status.HTTP_200_OK)


class PairingSessionStatusView(APIView):
    """
    GET /api/gateway/pairing/status/<uuid:session_id>/

    Polls status of a pairing session to see if device completed handshake.
    """
    permission_classes = [IsAuthenticated, HasFeaturePermission]
    rbac_feature = 'setup_communication'
    rbac_min_level = 'view'

    def get(self, request, session_id, *args, **kwargs):
        clinic, error = _resolve_user_clinic(request.user)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = DevicePairingSession.objects.select_related('clinic', 'claimed_by_device').get(id=session_id)
        except DevicePairingSession.DoesNotExist:
            return Response({"error": "Pairing session not found."}, status=status.HTTP_404_NOT_FOUND)

        # Clinic isolation guard
        if session.clinic.main_clinic.id != clinic.main_clinic.id and not getattr(request.user, 'is_owner', False):
            return Response({"error": "Forbidden: Session belongs to another clinic."}, status=status.HTTP_403_FORBIDDEN)

        # Auto-expire if past expiry
        if session.status == DevicePairingSession.STATUS_PENDING and timezone.now() >= session.expires_at:
            session.status = DevicePairingSession.STATUS_EXPIRED
            session.save(update_fields=['status', 'updated_at'])

        time_remaining = max(0, int((session.expires_at - timezone.now()).total_seconds()))
        device_data = ClinicDeviceDetailSerializer(session.claimed_by_device).data if session.claimed_by_device else None

        return Response({
            "session_id": str(session.id),
            "status": session.status,
            "is_claimed": session.status == DevicePairingSession.STATUS_CLAIMED,
            "time_remaining_seconds": time_remaining,
            "device": device_data,
        }, status=status.HTTP_200_OK)


class DevicePairView(APIView):
    """
    POST /api/gateway/devices/pair/

    Public endpoint used by the Malasakit Clinic App on Android to complete pairing.
    Requires a valid, unexpired, one-time pairing token (from QR code) or pairing code (manual).
    Atomically registers the device, associates it with the clinic, and returns the permanent device_token.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = DevicePairingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token = serializer.validated_data.get('pairing_token', '').strip()
        code = serializer.validated_data.get('pairing_code', '').strip().upper()
        device_identifier = serializer.validated_data['device_identifier'].strip()
        device_name = serializer.validated_data['device_name'].strip()

        with transaction.atomic():
            # Lookup session by token or code
            session = None
            if token:
                session = DevicePairingSession.objects.select_for_update().filter(pairing_token=token).first()
            elif code:
                session = DevicePairingSession.objects.select_for_update().filter(pairing_code=code).first()

            if not session:
                logger.warning("DevicePairView: Invalid pairing attempt from %s (identifier=%s)", request.META.get('REMOTE_ADDR'), device_identifier)
                return Response({"error": "Invalid pairing token or code."}, status=status.HTTP_400_BAD_REQUEST)

            if session.status == DevicePairingSession.STATUS_CLAIMED:
                logger.warning("DevicePairView: Replay attempt on claimed session %s", session.id)
                return Response({"error": "This pairing code has already been used."}, status=status.HTTP_400_BAD_REQUEST)

            if session.status in [DevicePairingSession.STATUS_CANCELLED, DevicePairingSession.STATUS_EXPIRED]:
                return Response({"error": f"Pairing session is {session.status.lower()}."}, status=status.HTTP_400_BAD_REQUEST)

            if timezone.now() >= session.expires_at:
                session.status = DevicePairingSession.STATUS_EXPIRED
                session.save(update_fields=['status', 'updated_at'])
                logger.warning("DevicePairView: Expired pairing attempt on session %s", session.id)
                return Response({"error": "Pairing session has expired. Please generate a new code on the web dashboard."}, status=status.HTTP_400_BAD_REQUEST)

            # Consume the session immediately (one-time use)
            session.status = DevicePairingSession.STATUS_CLAIMED
            session.claimed_at = timezone.now()

            # Deactivate any previous active devices for this clinic (single active device rule)
            GatewayDevice.objects.filter(clinic=session.clinic, is_active=True).exclude(
                device_identifier=device_identifier
            ).update(is_active=False, status='INACTIVE', updated_at=timezone.now())

            # Generate fresh cryptographically secure device token
            new_device_token = GatewayDevice.generate_token()

            device, created = GatewayDevice.objects.update_or_create(
                device_identifier=device_identifier,
                defaults={
                    'clinic': session.clinic,
                    'name': device_name,
                    'model_name': serializer.validated_data.get('model_name', ''),
                    'android_version': serializer.validated_data.get('android_version', ''),
                    'app_version': serializer.validated_data.get('app_version', ''),
                    'sim_carrier': serializer.validated_data.get('sim_carrier', ''),
                    'sim_slot_index': serializer.validated_data.get('sim_slot_index'),
                    'sim_subscription_id': serializer.validated_data.get('sim_subscription_id'),
                    'phone_number': serializer.validated_data.get('phone_number', ''),
                    'phone_number_verified': bool(serializer.validated_data.get('phone_number')),
                    'sms_capable': serializer.validated_data.get('sms_capable', True),
                    'device_token': new_device_token,
                    'status': 'ACTIVE',
                    'is_active': True,
                    'is_legacy': False,
                    'last_seen_at': timezone.now(),
                }
            )

            session.claimed_by_device = device
            session.save(update_fields=['status', 'claimed_at', 'claimed_by_device', 'updated_at'])

            logger.info(
                "DevicePairView: Successfully paired device '%s' (%s) with clinic '%s' (id=%s). Created=%s",
                device.name, device.device_identifier, session.clinic.name, session.clinic.id, created
            )

        return Response({
            "success": True,
            "device_token": device.device_token,
            "device_id": str(device.id),
            "device_identifier": device.device_identifier,
            "clinic_id": session.clinic.id,
            "clinic_name": session.clinic.name,
            "message": f"Device successfully paired with {session.clinic.name}."
        }, status=status.HTTP_200_OK)


class ClinicDeviceDetailView(APIView):
    """
    GET /api/gateway/devices/clinic-device/

    Retrieves the currently paired and active device for the requesting user's clinic.
    """
    permission_classes = [IsAuthenticated, HasFeaturePermission]
    rbac_feature = 'setup_communication'
    rbac_min_level = 'view'

    def get(self, request, *args, **kwargs):
        clinic, error = _resolve_user_clinic(request.user, request.query_params.get('clinic_id'))
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        device = GatewayDevice.objects.filter(clinic=clinic, is_active=True).first()
        if not device:
            return Response({"has_device": False, "device": None}, status=status.HTTP_200_OK)

        serializer = ClinicDeviceDetailSerializer(device)
        return Response({
            "has_device": True,
            "device": serializer.data
        }, status=status.HTTP_200_OK)


class DisconnectClinicDeviceView(APIView):
    """
    POST /api/gateway/devices/disconnect/

    Disconnects / revokes the active SMS device for the clinic.
    """
    permission_classes = [IsAuthenticated, HasFeaturePermission]
    rbac_feature = 'setup_communication'
    rbac_min_level = 'edit'

    def post(self, request, *args, **kwargs):
        clinic, error = _resolve_user_clinic(request.user, request.data.get('clinic_id'))
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        device_id = request.data.get('device_id')
        if device_id:
            device = GatewayDevice.objects.filter(id=device_id, clinic=clinic).first()
        else:
            device = GatewayDevice.objects.filter(clinic=clinic, is_active=True).first()

        if not device:
            return Response({"error": "No active device found for this clinic."}, status=status.HTTP_404_NOT_FOUND)

        # Revoke device
        device.is_active = False
        device.status = 'SUSPENDED'
        # Invalidate current token by rolling to a random string so old app cannot authenticate
        device.device_token = GatewayDevice.generate_token()
        device.save(update_fields=['is_active', 'status', 'device_token', 'updated_at'])

        logger.info(
            "DisconnectClinicDeviceView: Device '%s' (%s) revoked from clinic '%s' by user %s",
            device.name, device.device_identifier, clinic.name, request.user.email
        )

        return Response({
            "success": True,
            "message": f"Device '{device.name}' has been disconnected from {clinic.name}."
        }, status=status.HTTP_200_OK)


# ==============================================================================
# APK DISTRIBUTION & INSTALLATION
# ==============================================================================

def _find_gateway_apk():
    """
    Look for the compiled Malasakit Android APK in standard locations:
    1. Static directory bundled in backend repo (production-safe, git tracked)
    2. App static directory
    3. Built Gradle output (release or debug)
    4. Uploaded / deployed media directory
    """
    candidates = [
        os.path.join(settings.BASE_DIR, 'apps', 'gateway', 'static', 'apk', 'MalasakitGateway.apk'),
        os.path.join(settings.BASE_DIR, 'static', 'apk', 'MalasakitGateway.apk'),
        os.path.join(getattr(settings, 'STATIC_ROOT', ''), 'apk', 'MalasakitGateway.apk'),
        os.path.join(getattr(settings, 'MEDIA_ROOT', ''), 'apk', 'MalasakitGateway.apk'),
        os.path.join(settings.BASE_DIR, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
        os.path.join(settings.BASE_DIR, '..', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    ]
    for path in candidates:
        if not path:
            continue
        normalized = os.path.normpath(path)
        if os.path.isfile(normalized):
            return normalized
    return None


class DownloadGatewayApkView(APIView):
    """
    GET /api/gateway/download-apk/

    Directly downloads the compiled Malasakit Gateway Android APK file.
    Publicly accessible (AllowAny) so Android phone browsers can download via direct link or QR code.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        apk_path = _find_gateway_apk()
        if not apk_path or not os.path.exists(apk_path):
            return Response(
                {
                    "error": "The Malasakit Gateway Android APK has not been compiled yet on the server.",
                    "details": "Run './gradlew assembleDebug' in the android/ directory or place the APK in the server media path."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        response = FileResponse(
            open(apk_path, 'rb'),
            content_type='application/vnd.android.package-archive',
            as_attachment=True,
            filename='MalasakitGateway.apk'
        )
        response['Content-Length'] = os.path.getsize(apk_path)
        response['Content-Disposition'] = 'attachment; filename="MalasakitGateway.apk"'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response


class GatewayApkInfoView(APIView):
    """
    GET /api/gateway/apk-info/

    Returns metadata and direct download link for the latest Malasakit Gateway Android APK.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        apk_path = _find_gateway_apk()
        available = bool(apk_path and os.path.exists(apk_path))
        size_bytes = os.path.getsize(apk_path) if available else 0
        size_mb = round(size_bytes / (1024 * 1024), 1) if available else 0

        download_path = reverse('gateway:download-apk')
        download_url = request.build_absolute_uri(download_path)

        return Response({
            "available": available,
            "version": "1.0.0",
            "app_name": "Malasakit Clinic App",
            "package_name": "com.malasakit.clinic",
            "filename": "MalasakitGateway.apk",
            "size_bytes": size_bytes,
            "size_mb": size_mb,
            "download_url": download_url,
            "min_android_version": "Android 8.0 (Oreo / API 26) or higher",
            "recommended_android_version": "Android 10 - 15",
            "release_notes": "Official release of Malasakit Decentralized SMS Gateway Node with multi-SIM support, automated delivery receipts, and patient reply auto-confirmation."
        }, status=status.HTTP_200_OK)


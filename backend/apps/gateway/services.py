from abc import ABC, abstractmethod
import uuid
from typing import Dict, Any

class BaseSMSProvider(ABC):
    @abstractmethod
    def send_sms(self, message_obj) -> Dict[str, Any]:
        """
        Sends an SMS via the provider.
        Should return a dictionary with at least 'provider_message_id' and 'status'.
        """
        pass

    @abstractmethod
    def check_status(self, provider_message_id: str) -> Dict[str, Any]:
        """
        Checks the status of a previously sent message.
        """
        pass

    @abstractmethod
    def handle_webhook(self, payload: dict) -> None:
        """
        Process incoming webhooks (delivery receipts, inbound messages).
        """
        pass


class LocalGatewayProvider(BaseSMSProvider):
    """
    A local mock provider that simulates an in-house hardware gateway.
    It logs the message and immediately marks it as sent.
    """
    def send_sms(self, message_obj) -> Dict[str, Any]:
        print(f"[LOCAL GATEWAY] Sending SMS to {message_obj.recipient_number}: {message_obj.body}")
        
        # Simulate successful dispatch
        return {
            'provider_message_id': f"local-{uuid.uuid4().hex[:8]}",
            'status': 'SENT',
        }

    def check_status(self, provider_message_id: str) -> Dict[str, Any]:
        return {
            'status': 'DELIVERED',
            'description': 'Local simulated delivery'
        }

    def handle_webhook(self, payload: dict) -> None:
        print(f"[LOCAL GATEWAY] Webhook received: {payload}")


class ProviderFactory:
    @staticmethod
    def get_provider(provider_type: str = "LOCAL") -> BaseSMSProvider:
        # In the future, this can instantiate different providers dynamically.
        return LocalGatewayProvider()


# ==============================================================================
# INTERACTION CONTEXT RESOLUTION & TWO-WAY SMS HELPERS
# ==============================================================================

import logging
from datetime import timedelta
from typing import Any, Tuple, Optional, Set
import phonenumbers
from django.conf import settings
from django.utils import timezone


logger = logging.getLogger(__name__)


def build_phone_variations(phone: str) -> Set[str]:
    """
    Generate standard variations for Philippine phone numbers
    (+639XXXXXXXXX, 09XXXXXXXXX, 639XXXXXXXXX, etc.)
    """
    cleaned = (phone or '').strip()
    if not cleaned:
        return set()

    variations = {cleaned}
    normalized = cleaned
    try:
        parsed = phonenumbers.parse(cleaned, "PH")
        if phonenumbers.is_valid_number(parsed):
            normalized = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            variations.add(normalized)
    except Exception:
        pass

    if normalized.startswith('+63'):
        variations.add('0' + normalized[3:])
        variations.add(normalized[1:])
    elif normalized.startswith('0'):
        variations.add('+63' + normalized[1:])
        variations.add('63' + normalized[1:])
    elif normalized.startswith('63'):
        variations.add('+' + normalized)
        variations.add('0' + normalized[2:])

    return variations


def resolve_interaction_context(
    sender_phone: str,
    device: Optional[Any] = None
) -> Tuple[Optional[Any], Optional[Any], Optional[Any], Optional[Any]]:
    """
    Correlates an incoming SMS reply to the exact Patient, Appointment, Clinic,
    and original outbound reminder CommunicationLog.

    Resolution strategy:
    1. Look up recent outbound APPOINTMENT_REMINDER communication logs sent to this
       phone within the interaction window (e.g. past 7 days) for an upcoming or today's
       appointment that is still SCHEDULED (or CONFIRMED).
       - If device is clinic-paired (device.clinic is not None), restrict to device.clinic.
       - If device is legacy (clinic=None), the log directly tells us which clinic originated it!
    2. Fallback: If no recent reminder log exists (e.g. reminder sent before logging was enabled),
       find Patient matching the phone variations (scoped by device.clinic if available)
       and select the closest upcoming SCHEDULED appointment.
    
    Returns:
        (patient, appointment, clinic, original_reminder_log)
    """
    from apps.patients.models import Patient
    from apps.appointments.models import Appointment
    from apps.notifications.models import CommunicationLog

    possible_phones = build_phone_variations(sender_phone)
    cutoff = timezone.now() - timedelta(days=7)
    today = timezone.now().date()

    # 1. Primary: Correlation via outbound CommunicationLog
    reminder_log_qs = CommunicationLog.objects.filter(
        recipient__in=possible_phones,
        comm_type='APPOINTMENT_REMINDER',
        channel='SMS',
        direction='OUTBOUND',
        created_at__gte=cutoff,
    ).select_related('patient', 'appointment', 'clinic')

    if device and getattr(device, 'clinic_id', None):
        reminder_log_qs = reminder_log_qs.filter(clinic_id=device.clinic_id)

    # Prefer reminder logs for upcoming scheduled appointments
    active_reminder_log = reminder_log_qs.filter(
        appointment__isnull=False,
        appointment__date__gte=today,
        appointment__status__in=['SCHEDULED', 'CONFIRMED']
    ).order_by('-created_at').first()

    # Fallback to any recent reminder log if none active
    if not active_reminder_log:
        active_reminder_log = reminder_log_qs.order_by('-created_at').first()

    if active_reminder_log:
        patient = active_reminder_log.patient
        appointment = active_reminder_log.appointment
        clinic = active_reminder_log.clinic
        return patient, appointment, clinic, active_reminder_log

    # 2. Fallback: Patient & Appointment resolution
    patient_qs = Patient.objects.filter(phone__in=possible_phones)
    if device and getattr(device, 'clinic_id', None):
        patient = patient_qs.filter(clinic_id=device.clinic_id).first() or patient_qs.first()
    else:
        patient = patient_qs.first()

    if not patient:
        target_clinic = device.clinic if device else None
        return None, None, target_clinic, None

    appointment = Appointment.objects.filter(
        patient=patient,
        status__in=['SCHEDULED'],
        date__gte=today
    ).select_related('clinic', 'patient').order_by('date', 'start_time').first()

    clinic = appointment.clinic if appointment else (patient.clinic if patient else (device.clinic if device else None))
    return patient, appointment, clinic, None


def queue_confirmation_sms_on_yes(
    appointment: Any,
    patient: Any,
    clinic: Any,
    device: Optional[Any] = None
) -> Optional[Any]:
    """
    Sends/queues confirmation SMS when patient replies YES:
    "Thank you, [Patient Name].
    Your appointment on [DATE] at [TIME] has been confirmed."
    Also creates outbound CommunicationLog.
    """
    from apps.notifications.models import CommunicationLog
    from apps.notifications.services.notification_service import broadcast_communication_log_updated
    from apps.smsgateway.models import SMSMessage

    raw_phone = getattr(patient, 'phone', None)
    if not raw_phone:
        logger.warning("queue_confirmation_sms_on_yes: Patient %s has no phone number", getattr(patient, 'id', None))
        return None

    to_number = raw_phone
    try:
        parsed = phonenumbers.parse(raw_phone, "PH")
        if phonenumbers.is_valid_number(parsed):
            to_number = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except Exception:
        pass

    appt_date = appointment.date.strftime('%a, %b %d %Y')
    appt_time = appointment.start_time.strftime('%I:%M %p')
    body = (
        f"Thank you, {patient.first_name}.\n"
        f"Your appointment on {appt_date} at {appt_time} has been confirmed."
    )

    sms_message = SMSMessage.objects.create(
        clinic=clinic,
        gateway_device=device if (device and device.clinic_id == clinic.id) else None,
        recipient_number=to_number,
        body=body,
        status=SMSMessage.STATUS_QUEUED
    )

    try:
        from apps.smsgateway.tasks import dispatch_sms_task
        dispatch_sms_task.delay(str(sms_message.id))
    except Exception:
        pass

    try:
        new_log = CommunicationLog.objects.create(
            clinic=clinic,
            patient=patient,
            appointment=appointment,
            practitioner=appointment.practitioner,
            comm_type='BOOKING_CONFIRMATION',
            channel='SMS',
            direction='OUTBOUND',
            status='QUEUED',
            recipient=to_number,
            subject='Appointment Confirmed via SMS',
            body_preview=body[:2000],
            full_body=body,
            message_id=str(sms_message.id),
            event_metadata={
                'sms_message_id': str(sms_message.id),
                'automated_confirmation': True,
            }
        )
        broadcast_communication_log_updated(new_log)
    except Exception as comm_err:
        logger.warning("Failed to create CommunicationLog for confirmation SMS: %s", comm_err)

    return sms_message


def queue_options_sms_on_no(
    appointment: Any,
    patient: Any,
    clinic: Any,
    device: Optional[Any] = None
) -> Tuple[Optional[Any], str, str]:
    """
    Sends/queues options SMS when patient replies NO:
    "We understand that you cannot attend your scheduled appointment on
    [DATE] at [TIME].

    You may reschedule/rebook or cancel your appointment.

    RESCHEDULE / REBOOK:
    [SECURE RESCHEDULE LINK]

    CANCEL APPOINTMENT:
    [SECURE CANCEL LINK]"
    """
    from apps.appointments.models import RebookingLink, AppointmentCancelToken
    from apps.notifications.models import CommunicationLog
    from apps.notifications.services.notification_service import broadcast_communication_log_updated
    from apps.smsgateway.models import SMSMessage

    raw_phone = getattr(patient, 'phone', None)
    if not raw_phone:
        logger.warning("queue_options_sms_on_no: Patient %s has no phone number", getattr(patient, 'id', None))
        return None, '', ''

    to_number = raw_phone
    try:
        parsed = phonenumbers.parse(raw_phone, "PH")
        if phonenumbers.is_valid_number(parsed):
            to_number = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except Exception:
        pass

    frontend_base = getattr(settings, 'FRONTEND_URL', 'https://app.mespms.com').rstrip('/')

    # Invalidate previous unused tokens for this appointment
    RebookingLink.objects.filter(appointment=appointment, is_used=False).update(is_used=True, used_at=timezone.now())
    AppointmentCancelToken.objects.filter(appointment=appointment, is_used=False).update(is_used=True, used_at=timezone.now())

    rebook_token = RebookingLink.objects.create(patient=patient, appointment=appointment)
    cancel_token = AppointmentCancelToken.objects.create(appointment=appointment)

    rebook_url = f"{frontend_base}/rebook/{rebook_token.token}"
    cancel_url = f"{frontend_base}/cancel/{cancel_token.token}"

    appt_date = appointment.date.strftime('%a, %b %d %Y')
    appt_time = appointment.start_time.strftime('%I:%M %p')

    body = (
        f"We understand that you cannot attend your scheduled appointment on {appt_date} at {appt_time}.\n\n"
        f"You may reschedule/rebook or cancel your appointment.\n\n"
        f"RESCHEDULE / REBOOK:\n{rebook_url}\n\n"
        f"CANCEL APPOINTMENT:\n{cancel_url}"
    )

    sms_message = SMSMessage.objects.create(
        clinic=clinic,
        gateway_device=device if (device and device.clinic_id == clinic.id) else None,
        recipient_number=to_number,
        body=body,
        status=SMSMessage.STATUS_QUEUED
    )

    try:
        from apps.smsgateway.tasks import dispatch_sms_task
        dispatch_sms_task.delay(str(sms_message.id))
    except Exception:
        pass

    try:
        new_log = CommunicationLog.objects.create(
            clinic=clinic,
            patient=patient,
            appointment=appointment,
            practitioner=appointment.practitioner,
            comm_type='CANCELLATION_NOTICE',
            channel='SMS',
            direction='OUTBOUND',
            status='QUEUED',
            recipient=to_number,
            subject='Reschedule and Cancellation Options',
            body_preview=body[:2000],
            full_body=body,
            message_id=str(sms_message.id),
            event_metadata={
                'sms_message_id': str(sms_message.id),
                'rebook_token': str(rebook_token.token),
                'cancel_token': str(cancel_token.token),
            }
        )
        broadcast_communication_log_updated(new_log)
    except Exception as comm_err:
        logger.warning("Failed to create CommunicationLog for NO options SMS: %s", comm_err)

    return sms_message, rebook_url, cancel_url


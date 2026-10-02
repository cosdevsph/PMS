import logging
from apps.patients.models import PatientCase, SessionConsumptionLog
from django.db import transaction

logger = logging.getLogger(__name__)


def consume_case_session(appointment, user=None) -> bool:
    """
    Atomically consume one Pre-Approved Session from the appointment's PatientCase
    if available. Returns True if a session was consumed, False otherwise.
    """
    if not appointment.patient_case_id:
        return False

    with transaction.atomic():
        case = PatientCase.objects.select_for_update().get(id=appointment.patient_case_id)

        # Check net consumed count for this appointment to guarantee idempotency
        used_count = SessionConsumptionLog.objects.filter(
            appointment=appointment,
            patient_case=case,
            action='USED'
        ).count()
        restored_count = SessionConsumptionLog.objects.filter(
            appointment=appointment,
            patient_case=case,
            action='REMOVED'
        ).count()
        if used_count > restored_count:
            return True

        # Check if case has available pre-approved sessions
        if not case.is_unlimited and (case.approved_sessions is None or case.remaining_sessions <= 0):
            # No available pre-approved sessions for this case
            return False

        # Consume 1 session
        case.completed_sessions += 1
        case.save(update_fields=['completed_sessions'])

        SessionConsumptionLog.objects.create(
            patient_case=case,
            appointment=appointment,
            practitioner=appointment.practitioner,
            created_by=user or appointment.created_by,
            action='USED',
            reason=f'Pre-approved session consumed by appointment #{appointment.id} on {appointment.date}'
        )
        logger.info(
            f"Pre-approved session consumed: Case #{case.id} now has {case.completed_sessions} used "
            f"(Appointment #{appointment.id})"
        )
        return True


def restore_case_session(appointment, user=None, reason: str = '') -> bool:
    """
    Atomically restore a consumed session if this appointment previously consumed one
    (e.g., when an appointment is cancelled or deleted).
    """
    if not appointment.patient_case_id:
        return False

    with transaction.atomic():
        case = PatientCase.objects.select_for_update().get(id=appointment.patient_case_id)

        # Check if this appointment currently has an un-restored consumed session
        used_count = SessionConsumptionLog.objects.filter(
            appointment=appointment,
            patient_case=case,
            action='USED'
        ).count()
        restored_count = SessionConsumptionLog.objects.filter(
            appointment=appointment,
            patient_case=case,
            action='REMOVED'
        ).count()
        if used_count <= restored_count:
            return False

        # Decrement completed sessions safely
        case.completed_sessions = max(0, case.completed_sessions - 1)
        case.save(update_fields=['completed_sessions'])

        SessionConsumptionLog.objects.create(
            patient_case=case,
            appointment=appointment,
            practitioner=appointment.practitioner,
            created_by=user or appointment.updated_by,
            action='REMOVED',
            reason=reason or f'Session restored due to cancellation/deletion of appointment #{appointment.id}'
        )
        logger.info(
            f"Pre-approved session restored: Case #{case.id} now has {case.completed_sessions} used "
            f"(Appointment #{appointment.id})"
        )
        return True


def auto_populate_package_case(appointment):
    """
    Legacy helper: Kept for backward compatibility with historical records.
    If the appointment uses a legacy Package Service, ensure it is linked to a PatientCase.
    """
    if not appointment.service or not getattr(appointment.service, 'is_package', False):
        return

    if appointment.patient_case:
        case = appointment.patient_case
        if case.approved_sessions is None or case.approved_sessions == 0:
            case.approved_sessions = appointment.service.session_allocation or 0
            case.completed_sessions = 0
            case.session_source = 'PACKAGE'
            case.is_unlimited = False
            if not case.package_cost or case.package_cost == 0:
                case.package_cost = appointment.service.price
            case.save(update_fields=['approved_sessions', 'completed_sessions', 'session_source', 'is_unlimited', 'package_cost'])
        return

    service = appointment.service
    patient = appointment.patient
    case_title = f"{service.name} - {service.session_allocation} Sessions"

    case = PatientCase.objects.create(
        patient=patient,
        title=case_title,
        description=f"Auto-generated case for legacy {service.name} package.",
        status='OPEN',
        primary_practitioner=appointment.practitioner,
        payer='PRIVATE',
        approved_sessions=service.session_allocation,
        package_cost=service.price,
        session_source='PACKAGE',
        completed_sessions=0,
        is_unlimited=False,
    )

    appointment.patient_case = case
    appointment.save(update_fields=['patient_case'])

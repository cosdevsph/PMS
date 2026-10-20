from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from apps.clinical_templates.models import ClinicalNote

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ClinicalNote)
def complete_appointment_on_note_save(sender, instance, created, **kwargs):
    """
    When a Clinical Note is saved (or finalized) for an appointment, mark the
    appointment COMPLETED if it is still in an active/pending state.

    This reflects the business reality that writing a clinical note means the
    treatment occurred. (Case session limits were retired; notes no longer
    consume sessions. Prepaid sessions are tracked by Private Package Sessions.)
    """
    if getattr(instance, 'is_deleted', False) or not instance.appointment:
        return

    appointment = instance.appointment
    if appointment.status in ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'ARRIVED']:
        appointment.status = 'COMPLETED'
        appointment.save(update_fields=['status'])

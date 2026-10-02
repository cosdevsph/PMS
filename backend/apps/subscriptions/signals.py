import logging
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Subscription

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=User)
def create_subscription(sender, instance, created, **kwargs):
    """
    Ensure the user's main clinic or personal account has an active subscription.
    Avoids creating redundant subscriptions for staff/practitioners invited to an existing clinic.
    """
    if created:
        if instance.clinic_id:
            try:
                main_clinic = instance.clinic.main_clinic
                if not Subscription.objects.filter(clinic=main_clinic).exists():
                    sub = Subscription.objects.create(clinic=main_clinic, user=instance)
                    sub.start_trial()
                    logger.info("Initialized trial subscription for clinic %s (via user %s)", main_clinic.id, instance.id)
            except Exception as exc:
                logger.error("Failed to associate clinic subscription for user %s: %s", instance.id, exc)
        else:
            # Standalone registration without clinic yet
            sub = Subscription.objects.create(user=instance)
            sub.start_trial()
            logger.info("Initialized personal trial subscription for user %s", instance.id)


@receiver(post_save, sender='clinics.Clinic')
def create_clinic_subscription(sender, instance, created, **kwargs):
    """
    Ensure every newly created main clinic practice has a subscription record.
    """
    if created and instance.is_main_branch and not instance.parent_clinic_id:
        if not Subscription.objects.filter(clinic=instance).exists():
            sub = Subscription.objects.create(clinic=instance)
            sub.start_trial()
            logger.info("Initialized trial subscription for new main clinic %s", instance.id)

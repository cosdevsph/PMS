from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Subscription

User = get_user_model()


@receiver(post_save, sender=User)
def create_subscription(sender, instance, created, **kwargs):
    if created:
        subscription = Subscription.objects.create(user=instance)
        subscription.start_trial()

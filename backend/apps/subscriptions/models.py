from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


def default_trial_end_date():
    return timezone.now() + timedelta(days=14)


class Subscription(models.Model):
    PLAN_TRIAL = 'TRIAL'
    PLAN_MONTHLY = 'MONTHLY'
    PLAN_CHOICES = (
        (PLAN_TRIAL, 'Trial'),
        (PLAN_MONTHLY, 'Monthly'),
    )

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_EXPIRED = 'EXPIRED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_CHOICES = (
        (STATUS_ACTIVE, 'Active'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_CANCELLED, 'Cancelled'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription',
    )

    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=PLAN_TRIAL)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)

    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(default=default_trial_end_date)
    is_trial = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'end_date'], name='subs_status_end_idx'),
        ]

    def is_active(self):
        return self.status == self.STATUS_ACTIVE and self.end_date >= timezone.now()

    def start_trial(self):
        now = timezone.now()
        self.plan = self.PLAN_TRIAL
        self.status = self.STATUS_ACTIVE
        self.is_trial = True
        self.start_date = now
        self.end_date = now + timedelta(days=14)
        self.save()

    def activate_monthly(self):
        now = timezone.now()
        self.plan = self.PLAN_MONTHLY
        self.status = self.STATUS_ACTIVE
        self.is_trial = False
        self.start_date = now
        self.end_date = now + timedelta(days=30)
        self.save()

    def expire(self):
        self.status = self.STATUS_EXPIRED
        self.save(update_fields=['status', 'updated_at'])

    def __str__(self):
        return f"{self.user} - {self.plan} ({self.status})"

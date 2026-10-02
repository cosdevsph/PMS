import os
from datetime import timedelta
from typing import Any, Dict, Optional

from django.conf import settings
from django.core.cache import cache
from django.db import models
from django.utils import timezone

from .plans import (
    BILLING_CYCLE_CHOICES,
    CYCLE_ANNUAL,
    CYCLE_MONTHLY,
    MINIMUM_COMMITMENT_MONTHS,
    PLAN_CATALOG,
    PLAN_CHOICES,
    PLAN_ENTERPRISE,
    PLAN_GROWTH,
    PLAN_PROFESSIONAL,
    PLAN_STARTER,
    PLAN_TRIAL,
)


def _trial_days():
    return int(os.getenv('TRIAL_DAYS', 14))


def _subscription_days():
    return int(os.getenv('SUBSCRIPTION_DAYS', 30))


def default_trial_end_date():
    return timezone.now() + timedelta(days=_trial_days())


# Extended choices that preserve legacy 'MONTHLY' as a valid choice for backwards compatibility
EXTENDED_PLAN_CHOICES = PLAN_CHOICES + (('MONTHLY', 'Monthly (Legacy)'),)


class Subscription(models.Model):
    PLAN_TRIAL = PLAN_TRIAL
    PLAN_STARTER = PLAN_STARTER
    PLAN_GROWTH = PLAN_GROWTH
    PLAN_PROFESSIONAL = PLAN_PROFESSIONAL
    PLAN_ENTERPRISE = PLAN_ENTERPRISE
    PLAN_MONTHLY = 'MONTHLY'  # Backward compat alias

    STATUS_ACTIVE = 'ACTIVE'
    STATUS_EXPIRED = 'EXPIRED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_CHOICES = (
        (STATUS_ACTIVE, 'Active'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_CANCELLED, 'Cancelled'),
    )

    # ── Multi-Tenant Scope ───────────────────────────────────────────────────
    # Subscriptions belong to the main Clinic/practice.
    clinic = models.OneToOneField(
        'clinics.Clinic',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subscription',
        help_text='Main practice clinic this subscription belongs to.',
    )

    # User who created or administers this subscription
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_subscriptions',
        help_text='User who initiated or administers the subscription.',
    )

    # ── Plan & Status ────────────────────────────────────────────────────────
    plan = models.CharField(max_length=20, choices=EXTENDED_PLAN_CHOICES, default=PLAN_TRIAL)
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CYCLE_CHOICES, default=CYCLE_MONTHLY)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)

    # ── Entitlements & Capacity ──────────────────────────────────────────────
    # Maximum clinician allocations. When null, uses the plan catalog default.
    # Configured explicitly for ENTERPRISE custom plans.
    clinician_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Maximum clinician allocations. If null, uses plan default; for Enterprise stores custom limit.',
    )
    # Included branches from the base plan (standard = 1)
    branch_limit = models.PositiveIntegerField(
        default=1,
        help_text='Number of branches included in the base plan.',
    )
    # Paid additional branches beyond included
    additional_branches = models.PositiveIntegerField(
        default=0,
        help_text='Number of paid additional branch allocations.',
    )

    # ── Commitment & Billing Period ──────────────────────────────────────────
    commitment_months = models.PositiveIntegerField(
        default=MINIMUM_COMMITMENT_MONTHS,
        help_text='Minimum commitment duration in months (standard = 12).',
    )
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(default=default_trial_end_date)
    current_period_start = models.DateTimeField(default=timezone.now)
    current_period_end = models.DateTimeField(default=default_trial_end_date)
    is_trial = models.BooleanField(default=True)

    # PayMongo checkout session ID — tracks in-flight or completed checkout
    paymongo_checkout_id = models.CharField(max_length=100, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'end_date'], name='subs_status_end_idx'),
            models.Index(fields=['clinic', 'status'], name='subs_clinic_status_idx'),
        ]

    def _invalidate_cache(self):
        if self.user_id:
            cache.delete(f'sub_active_{self.user_id}')
        if self.clinic_id:
            cache.delete(f'sub_active_clinic_{self.clinic_id}')
            # Clear cached status for all users belonging to this clinic
            try:
                for uid in self.clinic.users.values_list('id', flat=True):
                    cache.delete(f'sub_active_{uid}')
            except Exception:
                pass

    @property
    def effective_clinician_limit(self) -> Optional[int]:
        """
        Return the active clinician capacity limit.
        Uses explicit clinician_limit override if set, else looks up default in PLAN_CATALOG.
        None indicates an unconstrained or pending custom enterprise setup.
        """
        if self.clinician_limit is not None:
            return self.clinician_limit
        meta = PLAN_CATALOG.get(self.plan)
        if meta and meta.get('clinician_limit') is not None:
            return meta['clinician_limit']
        # Fallback default
        return 4

    @property
    def effective_branch_limit(self) -> int:
        """
        Return the total allowed branches: included branches + additional purchased branches.
        """
        base = self.branch_limit if self.branch_limit is not None else 1
        return base + (self.additional_branches or 0)

    def is_active(self):
        return self.status == self.STATUS_ACTIVE and self.end_date >= timezone.now()

    def start_trial(self):
        now = timezone.now()
        self.plan = self.PLAN_TRIAL
        self.status = self.STATUS_ACTIVE
        self.is_trial = True
        self.billing_cycle = CYCLE_MONTHLY
        self.clinician_limit = 4
        self.branch_limit = 1
        self.additional_branches = 0
        self.start_date = now
        self.end_date = now + timedelta(days=_trial_days())
        self.current_period_start = now
        self.current_period_end = self.end_date
        self.save()
        self._invalidate_cache()

    def activate_monthly(self):
        """Legacy helper for monthly activation."""
        self.activate_plan(plan_code=self.PLAN_STARTER, billing_cycle=CYCLE_MONTHLY)

    def activate_plan(
        self,
        plan_code: str,
        billing_cycle: str = CYCLE_MONTHLY,
        additional_branches: int = 0,
        checkout_id: str = '',
        custom_clinician_limit: Optional[int] = None,
        custom_branch_limit: Optional[int] = None,
    ):
        """
        Authoritative activation/renewal for a specific plan tier and billing cycle.
        """
        now = timezone.now()
        normalized_plan = plan_code.upper() if plan_code else self.PLAN_STARTER
        if normalized_plan == 'MONTHLY':
            normalized_plan = self.PLAN_STARTER

        self.plan = normalized_plan
        self.status = self.STATUS_ACTIVE
        self.is_trial = False
        self.billing_cycle = billing_cycle.upper() if billing_cycle else CYCLE_MONTHLY
        self.additional_branches = max(0, additional_branches)

        meta = PLAN_CATALOG.get(normalized_plan, {})
        if custom_clinician_limit is not None:
            self.clinician_limit = custom_clinician_limit
        elif meta.get('clinician_limit') is not None:
            self.clinician_limit = meta['clinician_limit']

        if custom_branch_limit is not None:
            self.branch_limit = custom_branch_limit
        elif meta.get('included_branches') is not None:
            self.branch_limit = meta['included_branches']

        # Determine duration: 365 days for annual, 30 days for monthly
        duration_days = 365 if self.billing_cycle == CYCLE_ANNUAL else _subscription_days()
        self.start_date = now
        self.current_period_start = now
        # Honour partial remaining time on renewal
        self.end_date = max(self.end_date, now) + timedelta(days=duration_days)
        self.current_period_end = self.end_date

        if checkout_id:
            self.paymongo_checkout_id = checkout_id

        self.save()
        self._invalidate_cache()

    def activate_from_webhook(
        self,
        checkout_id: str = '',
        plan_code: str = '',
        billing_cycle: str = '',
        additional_branches: int = 0,
    ):
        """Activate/renew subscription from a verified PayMongo webhook."""
        target_plan = plan_code or (self.plan if self.plan != self.PLAN_TRIAL else self.PLAN_STARTER)
        target_cycle = billing_cycle or self.billing_cycle or CYCLE_MONTHLY
        self.activate_plan(
            plan_code=target_plan,
            billing_cycle=target_cycle,
            additional_branches=additional_branches,
            checkout_id=checkout_id,
        )

    def expire(self):
        self.status = self.STATUS_EXPIRED
        self.save(update_fields=['status', 'updated_at'])
        self._invalidate_cache()

    def __str__(self):
        target = self.clinic.name if self.clinic else str(self.user)
        return f"{target} - {self.plan} ({self.status}, max {self.effective_clinician_limit} clinicians, {self.effective_branch_limit} branches)"


class PayMongoPaymentLog(models.Model):
    """Immutable audit log of every PayMongo webhook event processed."""

    clinic = models.ForeignKey(
        'clinics.Clinic',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='paymongo_logs',
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_logs',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='paymongo_logs',
    )
    event_type = models.CharField(max_length=100)
    checkout_id = models.CharField(max_length=100, blank=True, default='')
    payment_id = models.CharField(max_length=100, blank=True, default='')
    plan = models.CharField(max_length=20, blank=True, default='')
    billing_cycle = models.CharField(max_length=10, blank=True, default='')
    additional_branches = models.PositiveIntegerField(default=0)
    amount = models.IntegerField(default=0)  # centavos
    currency = models.CharField(max_length=10, default='PHP')
    raw_payload = models.JSONField(default=dict)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-processed_at']

    def __str__(self):
        return f"{self.event_type} — {self.checkout_id} ({self.processed_at:%Y-%m-%d %H:%M})"

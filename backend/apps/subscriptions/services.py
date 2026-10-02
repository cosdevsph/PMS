"""
Authoritative Subscription, Plan Entitlement, and Allocation Engine.

Enforces:
  1. Clinician Capacity across the clinic family.
  2. Multi-branch assignments multiplier (1 allocation per assigned branch).
  3. Multi-role clinician allocations (Practitioner, Admin+Practitioner, Staff+Practitioner).
  4. Active, Inactive, and Archived (soft-deleted) counting rules.
  5. Branch Entitlement limits (included + purchased additional branches).
  6. Concurrency protection via select_for_update() row locking.
"""
import logging
from typing import Any, Dict, List, Optional, Tuple

from django.db import transaction
from django.db.models import Q

from apps.clinics.models import Clinic
from apps.subscriptions.models import Subscription
from apps.subscriptions.plans import (
    PLAN_CATALOG,
    PLAN_ENTERPRISE,
    PLAN_STARTER,
    PLAN_TRIAL,
)

logger = logging.getLogger(__name__)


class SubscriptionLimitException(Exception):
    """Base exception for subscription entitlement violations."""
    pass


class ClinicianLimitReachedException(SubscriptionLimitException):
    """Raised when an operation would exceed allowed clinician allocations."""

    def __init__(
        self,
        current_allocations: int,
        allowed_allocations: int,
        archived_allocations: int = 0,
        archived_practitioners: Optional[List[Dict[str, Any]]] = None,
        plan_code: str = '',
        message: str = '',
    ):
        self.current_allocations = current_allocations
        self.allowed_allocations = allowed_allocations
        self.archived_allocations = archived_allocations
        self.archived_practitioners = archived_practitioners or []
        self.plan_code = plan_code

        if not message:
            base = (
                f"Your subscription allows up to {allowed_allocations} clinician allocation"
                f"{'' if allowed_allocations == 1 else 's'}. "
                f"You currently have {current_allocations} clinician allocation"
                f"{'' if current_allocations == 1 else 's'}."
            )
            if archived_allocations > 0 and self.archived_practitioners:
                names = ", ".join(p.get('name') for p in self.archived_practitioners[:3])
                base += (
                    f" Note: {archived_allocations} allocation{' is' if archived_allocations == 1 else 's are'} "
                    f"consumed by archived practitioner(s) ({names}). "
                    f"To add another practitioner, please upgrade your subscription or permanently delete an existing practitioner."
                )
            else:
                base += " Please upgrade your subscription to add more clinicians."
            message = base

        super().__init__(message)


class BranchLimitReachedException(SubscriptionLimitException):
    """Raised when attempting to create branches beyond subscription entitlement."""

    def __init__(
        self,
        current_branches: int,
        allowed_branches: int,
        plan_code: str = '',
        message: str = '',
    ):
        self.current_branches = current_branches
        self.allowed_branches = allowed_branches
        self.plan_code = plan_code

        if not message:
            message = (
                f"Your subscription allows up to {allowed_branches} branch"
                f"{'' if allowed_branches == 1 else 'es'} (included + additional). "
                f"You currently have {current_branches} active branch"
                f"{'' if current_branches == 1 else 'es'}. "
                f"Please upgrade your plan or purchase an additional branch allocation to create more branches."
            )

        super().__init__(message)


# ── CLINICIAN ALLOCATION ENGINE ───────────────────────────────────────────────

def get_clinic_family_branch_ids(clinic: Clinic) -> List[int]:
    """
    Return all active branch IDs belonging to the clinic family (root + branches).
    """
    main_clinic = clinic.main_clinic
    branch_ids = list(
        Clinic.objects.filter(
            Q(id=main_clinic.id) | Q(parent_clinic=main_clinic),
            is_deleted=False,
        ).values_list('id', flat=True)
    )
    if main_clinic.id not in branch_ids:
        branch_ids.append(main_clinic.id)
    return branch_ids


def get_clinician_allocations_for_clinic(clinic: Clinic) -> Dict[str, Any]:
    """
    Calculate the authoritative clinician allocation usage for a clinic.

    Rules:
      1. Clinician Definition: User with PRACTITIONER capability (Practitioner,
         Admin+Practitioner, Staff+Practitioner). Non-clinical roles consume 0.
      2. Multi-Branch Multiplier: A practitioner assigned to N branches consumes
         N clinician allocations.
      3. Active / Inactive / Archived:
         - Active practitioner -> COUNTS
         - Inactive practitioner -> COUNTS
         - Archived (soft-deleted) practitioner -> COUNTS
         - Permanently deleted practitioner -> DOES NOT COUNT
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    main_clinic = clinic.main_clinic
    branch_ids = get_clinic_family_branch_ids(main_clinic)

    # Query all users associated with this clinic family who are NOT permanently deleted
    users_qs = User.objects.filter(
        Q(clinic=main_clinic) |
        Q(clinic_branch_id__in=branch_ids) |
        Q(branch_accesses__branch_id__in=branch_ids)
    )

    # Exclude permanently deleted users if field exists
    if hasattr(User, 'is_permanently_deleted'):
        users_qs = users_qs.filter(is_permanently_deleted=False)

    users = list(
        users_qs.distinct()
        .prefetch_related('branch_accesses')
        .select_related('practitioner_profile', 'clinic', 'clinic_branch')
    )

    active_allocations = 0
    archived_allocations = 0
    archived_practitioners = []
    clinical_users_count = 0

    for user in users:
        roles = user.roles or ([user.role] if user.role else [])
        is_clinical = (
            'PRACTITIONER' in roles or
            user.role == 'PRACTITIONER' or
            (user.is_deleted and hasattr(user, 'practitioner_profile') and user.practitioner_profile is not None)
        )

        if not is_clinical:
            continue

        clinical_users_count += 1

        # Multi-branch assignment calculation
        # Distinct branches the user is assigned to within this clinic family
        assigned_branches = set(
            user.branch_accesses.filter(branch_id__in=branch_ids).values_list('branch_id', flat=True)
        )
        if user.clinic_branch_id and user.clinic_branch_id in branch_ids:
            assigned_branches.add(user.clinic_branch_id)

        # If no explicit branch is assigned, default to 1 allocation on main branch
        user_allocations = max(1, len(assigned_branches))

        # Check if user is archived (soft-deleted)
        is_archived = (
            user.is_deleted or
            (hasattr(user, 'practitioner_profile') and getattr(user.practitioner_profile, 'is_deleted', False))
        )

        if is_archived:
            archived_allocations += user_allocations
            archived_practitioners.append({
                'id': user.id,
                'name': user.get_full_name() or user.email,
                'email': user.email,
                'allocations': user_allocations,
            })
        else:
            active_allocations += user_allocations

    total_allocations = active_allocations + archived_allocations

    return {
        'total_allocations': total_allocations,
        'active_allocations': active_allocations,
        'archived_allocations': archived_allocations,
        'archived_practitioners': archived_practitioners,
        'clinical_users_count': clinical_users_count,
    }


def get_branch_usage_for_clinic(clinic: Clinic) -> int:
    """
    Return the total number of existing active branches (main clinic + child branches).
    """
    main_clinic = clinic.main_clinic
    return Clinic.objects.filter(
        Q(id=main_clinic.id) | Q(parent_clinic=main_clinic),
        is_deleted=False,
    ).count()


def check_clinician_capacity(
    clinic: Clinic,
    additional_allocations: int = 1,
) -> Dict[str, Any]:
    """
    Check whether the clinic has capacity for `additional_allocations` clinicians.
    Acquires an atomic database row lock on the clinic's Subscription to prevent race conditions.

    Raises ClinicianLimitReachedException if limit would be exceeded.
    Returns current allocation details if capacity is available.
    """
    if additional_allocations <= 0:
        return get_clinician_allocations_for_clinic(clinic)

    main_clinic = clinic.main_clinic

    with transaction.atomic():
        # Lock subscription row
        sub = (
            Subscription.objects.select_for_update()
            .filter(clinic=main_clinic)
            .first()
        )
        if not sub:
            # Fallback: create trial subscription if not yet present
            sub = Subscription.objects.create(clinic=main_clinic)
            sub.start_trial()

        allowed = sub.effective_clinician_limit
        allocations = get_clinician_allocations_for_clinic(main_clinic)
        current = allocations['total_allocations']

        # None limit implies unconstrained custom enterprise
        if allowed is not None and (current + additional_allocations) > allowed:
            raise ClinicianLimitReachedException(
                current_allocations=current,
                allowed_allocations=allowed,
                archived_allocations=allocations['archived_allocations'],
                archived_practitioners=allocations['archived_practitioners'],
                plan_code=sub.plan,
            )

        return allocations


def check_branch_capacity(
    clinic: Clinic,
    additional_branches: int = 1,
) -> int:
    """
    Check whether the clinic has capacity for `additional_branches` branches.
    Acquires an atomic database row lock on the clinic's Subscription to prevent race conditions.

    Raises BranchLimitReachedException if limit would be exceeded.
    Returns current branch count if capacity is available.
    """
    if additional_branches <= 0:
        return get_branch_usage_for_clinic(clinic)

    main_clinic = clinic.main_clinic

    with transaction.atomic():
        sub = (
            Subscription.objects.select_for_update()
            .filter(clinic=main_clinic)
            .first()
        )
        if not sub:
            sub = Subscription.objects.create(clinic=main_clinic)
            sub.start_trial()

        allowed = sub.effective_branch_limit
        current = get_branch_usage_for_clinic(main_clinic)

        if (current + additional_branches) > allowed:
            raise BranchLimitReachedException(
                current_branches=current,
                allowed_branches=allowed,
                plan_code=sub.plan,
            )

        return current


def get_subscription_usage_summary(clinic: Clinic) -> Dict[str, Any]:
    """
    Return comprehensive real-time entitlement and usage summary for status API and UI.
    """
    from django.utils import timezone

    main_clinic = clinic.main_clinic
    sub = getattr(main_clinic, 'subscription', None)
    if not sub:
        sub, _ = Subscription.objects.get_or_create(clinic=main_clinic)
        sub.start_trial()

    now = timezone.now()
    if sub.status == Subscription.STATUS_ACTIVE and sub.end_date < now:
        sub.expire()

    allocations = get_clinician_allocations_for_clinic(main_clinic)
    branches_used = get_branch_usage_for_clinic(main_clinic)

    days_remaining = max((sub.end_date - now).days, 0) if sub.end_date else 0

    return {
        'plan': sub.plan,
        'status': sub.status,
        'billing_cycle': sub.billing_cycle,
        'commitment_months': sub.commitment_months,
        'is_trial': sub.is_trial,
        'start_date': sub.start_date,
        'end_date': sub.end_date,
        'days_remaining': days_remaining,
        'clinician_limit': sub.effective_clinician_limit,
        'clinicians_used': allocations['total_allocations'],
        'clinicians_active': allocations['active_allocations'],
        'clinicians_archived': allocations['archived_allocations'],
        'archived_practitioners': allocations['archived_practitioners'],
        'branch_limit': sub.branch_limit,
        'additional_branches': sub.additional_branches,
        'effective_branch_limit': sub.effective_branch_limit,
        'branches_used': branches_used,
    }

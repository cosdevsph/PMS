"""
One-time conversion of legacy package Cases into Private Package Sessions.

Background: before Private Package Sessions, a prepaid package was a Case with
session_source='PACKAGE', an allowance (approved_sessions), a stored counter
(completed_sessions) and a per-appointment consumption log. Case session limits
are being retired (decision R12), so each package Case that still has an
allowance is converted into a patient-level package.

The conversion is deliberately conservative:
  * It never changes the Case, its appointments, its logs or any invoice.
  * It only converts a Case when its numbers are consistent; anything else is
    reported with a reason so the owner can review it (nothing is guessed).
  * Packages created here keep a link to the Case (`source_case`), which also
    makes the conversion idempotent.

Run it through `manage.py convert_package_cases` (dry run unless --apply).
"""
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from decimal import Decimal

from django.db import transaction

from apps.appointments.models import Appointment
from apps.patients.models import (
    PatientCase,
    PrivatePackageSession,
    PrivatePackageSessionAuditLog,
    PrivatePackageSessionItem,
    PrivatePackageSessionUsage,
    SessionConsumptionLog,
)

READY = 'READY'
SKIPPED = 'SKIPPED'

# Skip reasons (stable codes, shown in the report)
ALREADY_CONVERTED = 'ALREADY_CONVERTED'
ARCHIVED = 'ARCHIVED'
UNLIMITED_OR_NO_ALLOWANCE = 'UNLIMITED_OR_NO_ALLOWANCE'
NO_SERVICE_INFORMATION = 'NO_SERVICE_INFORMATION'
USED_EXCEEDS_ALLOWANCE = 'USED_EXCEEDS_ALLOWANCE'
COUNTER_MISMATCH = 'COUNTER_MISMATCH'

REASON_TEXT = {
    ALREADY_CONVERTED: 'already converted to a Private Package Session',
    ARCHIVED: 'the Case is archived',
    UNLIMITED_OR_NO_ALLOWANCE: 'unlimited or no session allowance, so there is no session count to carry over',
    NO_SERVICE_INFORMATION: 'no appointment used a session yet, so the services covered cannot be determined',
    USED_EXCEEDS_ALLOWANCE: 'more sessions were used than the allowance',
    COUNTER_MISMATCH: "the Case's stored counter does not match its session log",
}


@dataclass
class ConversionPlan:
    case: PatientCase
    status: str = READY
    reasons: list = field(default_factory=list)      # skip reason codes
    warnings: list = field(default_factory=list)     # things to check, but convertible
    details: dict = field(default_factory=dict)      # numbers behind a skip
    title: str = ''
    price: Decimal = Decimal('0')
    invoice = None
    clinic = None
    items: dict = field(default_factory=dict)        # {service: quantity}
    usages: list = field(default_factory=list)       # [(appointment, service)]
    total: int = 0
    used: int = 0

    @property
    def remaining(self) -> int:
        return self.total - self.used


def _net_used_appointments(case):
    """Appointments whose consumption log is net 'used' (USED minus restores) and still count."""
    net = defaultdict(int)
    logs = SessionConsumptionLog.objects.filter(
        patient_case=case, appointment__isnull=False, action__in=['USED', 'REMOVED'],
    ).values_list('appointment_id', 'action')
    for appointment_id, action in logs:
        net[appointment_id] += 1 if action == 'USED' else -1
    ids = [a for a, n in net.items() if n > 0]
    return list(
        Appointment.objects.filter(id__in=ids, is_deleted=False)
        .exclude(status='CANCELLED')
        .select_related('service')
        .order_by('date', 'start_time', 'id')
    )


def plan_conversion(case, include_counter_mismatch=False) -> ConversionPlan:
    plan = ConversionPlan(case=case)

    if case.converted_private_packages.exists():
        plan.status, plan.reasons = SKIPPED, [ALREADY_CONVERTED]
        return plan
    if case.is_archived:
        plan.status, plan.reasons = SKIPPED, [ARCHIVED]
        return plan
    if case.is_unlimited or not case.approved_sessions:
        plan.status, plan.reasons = SKIPPED, [UNLIMITED_OR_NO_ALLOWANCE]
        return plan

    appointments = _net_used_appointments(case)
    total, used = case.approved_sessions, len(appointments)
    plan.total, plan.used = total, used
    plan.details = {'approved_sessions': total, 'counter': case.completed_sessions, 'logged_used': used}

    if used == 0:
        plan.status, plan.reasons = SKIPPED, [NO_SERVICE_INFORMATION]
        return plan
    if used > total:
        plan.status, plan.reasons = SKIPPED, [USED_EXCEEDS_ALLOWANCE]
        return plan
    if case.completed_sessions != used and not include_counter_mismatch:
        plan.status, plan.reasons = SKIPPED, [COUNTER_MISMATCH]
        return plan
    if case.completed_sessions != used:
        plan.warnings.append(
            f'Counter ({case.completed_sessions}) differs from the log ({used}); the log was used.'
        )

    with_service = [a for a in appointments if a.service_id]
    if not with_service:
        plan.status, plan.reasons = SKIPPED, [NO_SERVICE_INFORMATION]
        return plan

    counts = Counter(a.service_id for a in with_service)
    services = {a.service_id: a.service for a in with_service}
    most = max(counts.values())
    # Primary service: most used; on a tie, the one used most recently.
    primary_id = [a.service_id for a in reversed(with_service) if counts[a.service_id] == most][0]

    quantities = Counter()
    for appointment in appointments:
        service_id = appointment.service_id or primary_id
        quantities[service_id] += 1
        plan.usages.append((appointment, services[service_id]))
    if len(with_service) != used:
        plan.warnings.append(
            f'{used - len(with_service)} used session(s) had no service and were counted under "{services[primary_id].name}".'
        )

    remaining = total - used
    if remaining:
        quantities[primary_id] += remaining
        plan.warnings.append(
            f'{remaining} unused session(s) were assigned to "{services[primary_id].name}" (the most used service); '
            'the old package did not record which services it covered.'
        )

    plan.items = {services[sid]: qty for sid, qty in quantities.items()}
    for service in plan.items:
        if service.is_deleted or not service.is_active:
            plan.warnings.append(f'Service "{service.name}" is inactive or deleted.')

    invoice = case.package_invoice
    plan.invoice = invoice if invoice is not None and not invoice.is_deleted else None
    if plan.invoice is None:
        plan.warnings.append('The Case has no package invoice; none is created by the conversion.')
    plan.price = case.package_cost or (plan.invoice.total_amount if plan.invoice else Decimal('0'))

    patient = case.patient
    plan.clinic = patient.home_branch or patient.clinic
    plan.title = case.title
    if remaining and case.status == 'DISCHARGED':
        plan.warnings.append('The Case is discharged but still has unused sessions.')
    return plan


@transaction.atomic
def apply_plan(plan: ConversionPlan, user=None) -> PrivatePackageSession:
    """Create the package for a READY plan. Never touches the Case, appointments or invoices."""
    assert plan.status == READY, 'Only a READY plan can be applied.'
    case = plan.case

    package = PrivatePackageSession.objects.create(
        patient=case.patient,
        clinic=plan.clinic,
        title=plan.title,
        price=plan.price,
        notes=f'Converted from Case "{case.title}" (#{case.id}) on the retirement of Case session limits.',
        status='COMPLETED' if plan.remaining == 0 else 'ACTIVE',
        invoice=plan.invoice,
        source_case=case,
        created_by=user,
        modified_by=user,
    )
    items = {
        service.id: PrivatePackageSessionItem.objects.create(package=package, service=service, quantity=qty)
        for service, qty in plan.items.items()
    }
    for appointment, service in plan.usages:
        PrivatePackageSessionUsage.objects.create(
            item=items[service.id], appointment=appointment, created_by=user,
        )
    PrivatePackageSessionAuditLog.objects.create(
        package=package, user=user, action='CREATED',
        reason=f'One-time conversion from legacy package Case #{case.id}.',
        changes={
            'converted_from_case': case.id,
            'title': plan.title,
            'price': str(plan.price),
            'items': [{'service': s.name, 'quantity': q} for s, q in plan.items.items()],
            'sessions_used': plan.used,
            'sessions_total': plan.total,
        },
    )
    return package

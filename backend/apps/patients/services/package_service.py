"""
Business logic for Private Package Sessions (create / edit / assign).

All writes happen here, inside transactions, so views stay thin and the rules
(who owns the package, what may be edited, what is recorded in the audit log)
live in one place. See docs/development/features/private-package-sessions.md.
"""
import logging
from decimal import Decimal, InvalidOperation

from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.appointments.models import Appointment
from apps.billing.models import Invoice, InvoiceItem, Payment
from apps.clinics.models import Clinic
from apps.clinics.services.models import Service
from apps.patients.models import (
    Patient,
    PrivatePackageSession,
    PrivatePackageSessionAuditLog,
    PrivatePackageSessionItem,
    PrivatePackageSessionUsage,
)

logger = logging.getLogger(__name__)

INVOICE_LINE_PREFIX = 'Package: '


# ── Scoping ───────────────────────────────────────────────────────────────────

def clinic_group_ids(clinic) -> list:
    """IDs of the main clinic and all its branches (same scope Cases use)."""
    if not clinic:
        return []
    return list(clinic.main_clinic.get_all_branches().values_list('id', flat=True))


def visible_branch_ids(user):
    """
    Which patients' packages a user may see, expressed as home-branch ids.
    Mirrors PatientViewSet.get_queryset: admins see the whole clinic group (None);
    managers see their managed branches; everyone else sees their assigned branches
    (branch accesses, else their own branch). A package is visible exactly when its
    patient is.
    """
    if user.is_admin:
        return None
    if user.is_manager:
        return list(user.get_managed_branches().values_list('id', flat=True))
    ids = list(user.branch_accesses.values_list('branch_id', flat=True))
    if not ids and user.clinic_branch_id:
        ids = [user.clinic_branch_id]
    return ids


def with_balances(queryset):
    """
    Prefetch items with their used-session count annotated, so list screens do
    not run one query per item. The rule matches `_counted_usages` in models.py:
    the appointment exists, is not soft-deleted and is not cancelled.
    """
    from django.db.models import Prefetch

    counted = (
        Q(usages__appointment__isnull=False)
        & Q(usages__appointment__is_deleted=False)
        & ~Q(usages__appointment__status='CANCELLED')
    )
    items = PrivatePackageSessionItem.objects.select_related('service').annotate(
        used_count=Count('usages', filter=counted),
    )
    return queryset.select_related(
        'patient', 'clinic', 'invoice', 'created_by', 'modified_by',
    ).prefetch_related(Prefetch('items', queryset=items))


# ── Validation helpers ────────────────────────────────────────────────────────

def _clean_title(value) -> str:
    title = (value or '').strip()
    if not title:
        raise ValidationError({'title': 'A title is required.'})
    if len(title) > 200:
        raise ValidationError({'title': 'The title must be 200 characters or fewer.'})
    return title


def _clean_price(value) -> Decimal:
    try:
        price = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError({'price': 'Enter a valid price.'})
    if not price.is_finite() or price < 0:
        raise ValidationError({'price': 'The price cannot be negative.'})
    return price.quantize(Decimal('0.01'))


def _clean_items(raw_items, group_ids) -> dict:
    """Return {service_id: (Service, quantity)} after validating the payload."""
    if not raw_items:
        raise ValidationError({'items': 'Add at least one service.'})

    wanted = {}
    for row in raw_items:
        try:
            service_id = int(row.get('service'))
            quantity = int(row.get('quantity'))
        except (TypeError, ValueError, AttributeError):
            raise ValidationError({'items': 'Each service needs a valid service and quantity.'})
        if quantity < 1:
            raise ValidationError({'items': 'Each quantity must be at least 1.'})
        if service_id in wanted:
            raise ValidationError({'items': 'A service can only be listed once; increase its quantity instead.'})
        wanted[service_id] = quantity

    services = {
        s.id: s for s in Service.objects.filter(
            id__in=wanted.keys(), clinic_id__in=group_ids, is_active=True, is_deleted=False,
        )
    }
    missing = set(wanted) - set(services)
    if missing:
        raise ValidationError({'items': 'One or more services are not available at this clinic.'})
    return {sid: (services[sid], qty) for sid, qty in wanted.items()}


def _log(package, user, action, changes=None, reason='', appointment=None):
    return PrivatePackageSessionAuditLog.objects.create(
        package=package, user=user, action=action,
        changes=changes or {}, reason=reason, appointment=appointment,
    )


def _invoice_has_payments(invoice) -> bool:
    return invoice.amount_paid > 0 or Payment.objects.filter(invoice=invoice).exists()


# ── Invoice ───────────────────────────────────────────────────────────────────

def _create_package_invoice(package, user, ip_address=None):
    """
    One invoice at the package price, created through the existing Invoice /
    InvoiceItem code and versioning. No invoice is created for a free (0) package.
    """
    if package.price <= 0:
        return None

    invoice = Invoice.objects.create(
        clinic=package.clinic,
        patient=package.patient,
        appointment=None,
        patient_case=None,
        invoice_date=timezone.localdate(),
        created_by=user,
        status='DRAFT',
    )
    InvoiceItem.objects.create(
        invoice=invoice,
        description=f'{INVOICE_LINE_PREFIX}{package.title}',
        quantity=1,
        unit_price=package.price,
    )
    invoice.update_totals()
    invoice.refresh_from_db()
    invoice.create_version_snapshot(
        user=user,
        change_summary={'created': f'Private Package Session invoice created for package #{package.id}.'},
        ip_address=ip_address,
    )
    package.invoice = invoice
    package.save(update_fields=['invoice', 'updated_at'])
    return invoice


def _sync_package_invoice(package, user, old_title, old_price, ip_address=None):
    """
    Keep the package invoice in step with the package, without silently changing
    an invoice that already has payments.
    """
    invoice = package.invoice
    price_changed = package.price != old_price
    title_changed = package.title != old_title

    if invoice is None or invoice.is_deleted:
        if price_changed and package.price > 0 and invoice is None:
            _create_package_invoice(package, user, ip_address)
        return

    if not (price_changed or title_changed):
        return

    if _invoice_has_payments(invoice):
        if price_changed:
            raise ValidationError({
                'price': 'This package invoice already has payments. Adjust the amount through the invoice instead.',
            })
        return  # title only: leave a paid invoice untouched

    line = invoice.items.filter(description__startswith=INVOICE_LINE_PREFIX).first()
    if line is None:
        return
    line.description = f'{INVOICE_LINE_PREFIX}{package.title}'
    line.unit_price = package.price
    line.save()
    invoice.update_totals()
    invoice.refresh_from_db()
    invoice.create_version_snapshot(
        user=user,
        change_summary={'package_updated': f'Package #{package.id} was edited.'},
        ip_address=ip_address,
    )


# ── Create ────────────────────────────────────────────────────────────────────

@transaction.atomic
def create_package(user, patient_id, title, price, notes, raw_items, ip_address=None):
    clinic = user.clinic
    group_ids = clinic_group_ids(clinic)
    if not group_ids:
        raise ValidationError({'detail': 'Your account has no clinic assigned.'})

    patients = Patient.objects.filter(
        id=patient_id, clinic_id__in=group_ids, is_deleted=False,
        is_archived=False, is_merged=False,
    )
    branches = visible_branch_ids(user)
    if branches is not None:
        patients = patients.filter(home_branch_id__in=branches)
    patient = patients.first()
    if patient is None:
        raise ValidationError({'patient': 'Patient not found.'})

    title = _clean_title(title)
    price = _clean_price(price)
    wanted = _clean_items(raw_items, group_ids)

    package = PrivatePackageSession.objects.create(
        patient=patient, clinic=clinic, title=title, price=price,
        notes=(notes or '').strip(), status='ACTIVE',
        created_by=user, modified_by=user,
    )
    PrivatePackageSessionItem.objects.bulk_create([
        PrivatePackageSessionItem(package=package, service=service, quantity=qty)
        for service, qty in wanted.values()
    ])

    _log(package, user, 'CREATED', changes={
        'title': title,
        'price': str(price),
        'items': [{'service': s.name, 'quantity': q} for s, q in wanted.values()],
    })
    _create_package_invoice(package, user, ip_address)

    logger.info('Private package #%s created for patient #%s by %s', package.id, patient.id, user.email)
    return package


# ── Edit ──────────────────────────────────────────────────────────────────────

def _apply_item_changes(package, wanted):
    """
    Make the package's items match `wanted` ({service_id: (Service, quantity)}).
    Never takes a quantity below the sessions already used, and never removes a
    service that has used sessions. Returns a changes dict for the audit log.
    """
    existing = {
        item.service_id: item
        for item in package.items.select_related('service').all()
    }
    changes = {'added': [], 'removed': [], 'quantity_changed': []}

    for service_id, item in existing.items():
        used = item.used
        if service_id not in wanted:
            if used > 0:
                raise ValidationError({
                    'items': f'"{item.service.name}" has {used} session(s) in use and cannot be removed.',
                })
            changes['removed'].append({'service': item.service.name, 'quantity': item.quantity})
            item.delete()
            continue

        new_qty = wanted[service_id][1]
        if new_qty < used:
            raise ValidationError({
                'items': f'"{item.service.name}" has {used} session(s) in use; the quantity cannot be lowered below that.',
            })
        if new_qty != item.quantity:
            changes['quantity_changed'].append({
                'service': item.service.name, 'from': item.quantity, 'to': new_qty,
            })
            item.quantity = new_qty
            item.save(update_fields=['quantity'])

    for service_id, (service, qty) in wanted.items():
        if service_id not in existing:
            PrivatePackageSessionItem.objects.create(package=package, service=service, quantity=qty)
            changes['added'].append({'service': service.name, 'quantity': qty})

    return {k: v for k, v in changes.items() if v}


@transaction.atomic
def update_package(user, package, data, ip_address=None):
    """
    Edit title, price, notes, status and/or the item list (`items` replaces the
    list). Everything is recorded in the audit log with who and when.
    """
    # Lock the row so a concurrent assignment cannot slip past the quantity check.
    package = PrivatePackageSession.objects.select_for_update().get(pk=package.pk)
    group_ids = clinic_group_ids(user.clinic)
    changes = {}

    old_title, old_price = package.title, package.price

    if 'title' in data:
        title = _clean_title(data['title'])
        if title != package.title:
            changes['title'] = {'from': package.title, 'to': title}
            package.title = title
    if 'price' in data:
        price = _clean_price(data['price'])
        if price != package.price:
            changes['price'] = {'from': str(package.price), 'to': str(price)}
            package.price = price
    if 'notes' in data:
        notes = (data['notes'] or '').strip()
        if notes != package.notes:
            changes['notes'] = {'from': package.notes, 'to': notes}
            package.notes = notes

    status_change = None
    if 'status' in data and data['status'] != package.status:
        if data['status'] not in dict(PrivatePackageSession.STATUS_CHOICES):
            raise ValidationError({'status': 'Invalid status.'})
        status_change = {'from': package.status, 'to': data['status']}
        package.status = data['status']

    if 'items' in data:
        wanted = _clean_items(data['items'], group_ids)
        item_changes = _apply_item_changes(package, wanted)
        if item_changes:
            changes['items'] = item_changes

    if not changes and not status_change:
        return package

    package.modified_by = user
    package.save()

    if 'price' in changes or 'title' in changes:
        _sync_package_invoice(package, user, old_title, old_price, ip_address)

    if changes:
        _log(package, user, 'UPDATED', changes=changes)
    if status_change:
        _log(package, user, 'STATUS_CHANGED', changes={'status': status_change})

    logger.info('Private package #%s updated by %s', package.id, user.email)
    return package


# ── Assign / unassign an appointment (decision D1: always explicit) ──────────

def _active_invoices_for(appointment):
    """Non-deleted invoices that belong to the appointment, directly or via a version."""
    return Invoice.objects.filter(is_deleted=False).filter(
        Q(appointment=appointment) | Q(versions__appointment=appointment)
    ).distinct()


@transaction.atomic
def assign_appointment(user, package, appointment, reason='', ip_address=None):
    """
    Explicitly assign an existing appointment to a package. Nothing here runs
    automatically: only an authorized user calling this uses a session.

    Rules (D1, Q13, Q15):
      - same patient; the package is ACTIVE; the appointment is not cancelled;
      - the appointment is not already assigned to any package;
      - the appointment has no active invoice (Q13);
      - the appointment's service is in the package with a session left.
    """
    # Serialises assignments per package, so the last session cannot be taken twice.
    package = PrivatePackageSession.objects.select_for_update().get(pk=package.pk)

    if appointment.is_deleted:
        raise ValidationError({'appointment': 'Appointment not found.'})
    if appointment.patient_id != package.patient_id:
        raise ValidationError({'appointment': 'This appointment belongs to a different patient than the package.'})
    if package.status != 'ACTIVE':
        raise ValidationError({'package': 'Only an active package can be assigned to an appointment.'})
    if appointment.status == 'CANCELLED':
        raise ValidationError({'appointment': 'A cancelled appointment cannot be assigned to a package.'})
    if PrivatePackageSessionUsage.objects.filter(appointment=appointment).exists():
        raise ValidationError({'appointment': 'This appointment is already assigned to a package.'})
    if _active_invoices_for(appointment).exists():
        raise ValidationError({'appointment': 'This appointment already has an invoice and can no longer be added to a package.'})

    item = (
        package.items.select_related('service')
        .filter(service_id=appointment.service_id).first()
        if appointment.service_id else None
    )
    if item is None:
        raise ValidationError({'appointment': "This appointment's service is not part of the package."})
    used = item.used
    if used >= item.quantity:
        raise ValidationError({'appointment': f'No sessions left for "{item.service.name}" in this package.'})

    try:
        with transaction.atomic():
            usage = PrivatePackageSessionUsage.objects.create(
                item=item, appointment=appointment, created_by=user,
            )
    except IntegrityError:
        raise ValidationError({'appointment': 'This appointment is already assigned to a package.'})

    package.modified_by = user
    package.save(update_fields=['modified_by', 'updated_at'])
    _log(
        package, user, 'APPOINTMENT_ASSIGNED', appointment=appointment, reason=reason,
        changes={'service': item.service.name, 'session': f'{used + 1} of {item.quantity}'},
    )
    logger.info('Appointment #%s assigned to private package #%s by %s', appointment.id, package.id, user.email)
    return usage


@transaction.atomic
def unassign_appointment(user, package, appointment, reason='', ip_address=None):
    """
    Undo an assignment (Q15). The session returns to the package. Blocked once
    the appointment has an active invoice, so an invoice that already reflects
    the package is never silently contradicted.
    """
    package = PrivatePackageSession.objects.select_for_update().get(pk=package.pk)

    usage = PrivatePackageSessionUsage.objects.select_related('item__service').filter(
        item__package=package, appointment=appointment,
    ).first()
    if usage is None:
        raise ValidationError({'appointment': 'This appointment is not assigned to this package.'})
    if _active_invoices_for(appointment).exists():
        raise ValidationError({'appointment': 'This appointment already has an invoice, so its package assignment can no longer be removed.'})

    service_name = usage.item.service.name
    usage.delete()

    package.modified_by = user
    package.save(update_fields=['modified_by', 'updated_at'])
    _log(
        package, user, 'APPOINTMENT_UNASSIGNED', appointment=appointment, reason=reason,
        changes={'service': service_name},
    )
    logger.info('Appointment #%s removed from private package #%s by %s', appointment.id, package.id, user.email)


# ── Billing: a package-covered appointment has no service charge (R5) ────────

COVERED_SUFFIX = ' (Covered by Private Package Session)'


def get_usage(appointment):
    """The package usage of this appointment, or None."""
    return PrivatePackageSessionUsage.objects.select_related('item__package').filter(
        appointment=appointment,
    ).first()


def cover_service_line(appointment, items):
    """
    Return `items` (a list of invoice-line dicts) with the appointment's service
    line priced at 0 and marked as covered, when the appointment is assigned to a
    Private Package Session. Prices sent by the client for that line are ignored.
    Other lines (extras such as products) are left untouched. If no line matches
    the service, a covered 0-price line is added at the top. Appointments that
    are not assigned to a package get `items` back unchanged.
    """
    if appointment.service_id is None or get_usage(appointment) is None:
        return items

    name = appointment.service.name
    wanted = name.strip().lower()
    covered = {
        'description': f'{name}{COVERED_SUFFIX}',
        'quantity': 1,
        'unit_price': Decimal('0'),
        'discount_percent': Decimal('0'),
        'tax_percent': Decimal('0'),
        'service_code': '',
    }

    result, replaced = [], False
    for item in items:
        description = (item.get('description') or '').strip().lower()
        is_service_line = description == wanted or description.startswith(f'{wanted} (covered')
        if is_service_line and not replaced:
            result.append({**dict(item), **covered, 'service_code': item.get('service_code', '') or ''})
            replaced = True
        else:
            result.append(item)
    if not replaced:
        result.insert(0, covered)
    return result

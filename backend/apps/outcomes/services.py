"""Loading definitions, picking the ones a clinic can use, and completing assessments."""
import json
from pathlib import Path

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import (
    ClinicOutcomeMeasure, OutcomeAssessment, OutcomeAssessmentAuditLog, OutcomeDefinition, definition_checksum,
)
from .scoring import score_assessment
from .validation import DefinitionError, validate_answers, validate_definition

LIBRARY_DIR = Path(__file__).resolve().parent / 'library'


def _version_key(version):
    return tuple(int(part) for part in version.split('.'))


def publish_definition(data):
    """
    Validate and store one definition. Returns (definition, created).
    The same code + version with the same content is a no-op; with different content it is refused.
    """
    validate_definition(data)
    existing = OutcomeDefinition.objects.filter(code=data['code'], version=data['version']).first()
    if existing:
        if existing.checksum != definition_checksum(data):
            raise DefinitionError([
                f'{data["code"]} {data["version"]} is already published with different content; '
                'publish a new version instead.'
            ])
        approved = data['licence']['approved_for_production']
        if existing.platform_approved != approved:
            existing.platform_approved = approved
            existing.save(update_fields=['platform_approved', 'updated_at'])
        return existing, False

    licence = data['licence']
    created = OutcomeDefinition.objects.create(
        code=data['code'],
        version=data['version'],
        name=data['name'],
        abbreviation=data.get('abbreviation', ''),
        category=data['category'],
        language=data.get('language', 'en'),
        definition=data,
        licence_category=licence['category'],
        licence_notes=licence.get('notes', ''),
        platform_approved=licence['approved_for_production'],
    )
    return created, True


def load_library(directory=LIBRARY_DIR):
    """Publish every JSON file in the library folder. Returns [(file name, 'created'|'unchanged'|error text)]."""
    report = []
    for path in sorted(Path(directory).glob('*.json')):
        try:
            _, created = publish_definition(json.loads(path.read_text(encoding='utf-8')))
            report.append((path.name, 'created' if created else 'unchanged'))
        except (DefinitionError, ValueError) as exc:
            report.append((path.name, f'REJECTED: {exc}'))
    return report


def main_clinic_of(user):
    return user.clinic.main_clinic if user.clinic else None


def library_for_clinic(clinic):
    """Latest approved version of each measure with the clinic's on/off state: [(definition, setting or None)]."""
    latest = {}
    for d in OutcomeDefinition.objects.filter(platform_approved=True, retired_at__isnull=True):
        if d.code not in latest or _version_key(d.version) > _version_key(latest[d.code].version):
            latest[d.code] = d
    settings_by_code = {s.code: s for s in ClinicOutcomeMeasure.objects.filter(clinic=clinic)}
    return [(d, settings_by_code.get(d.code)) for d in sorted(latest.values(), key=lambda d: (d.category, d.name))]


def enabled_definitions(clinic):
    """Definitions a practitioner of this clinic may use now (pinned version if the clinic pinned one)."""
    out = []
    for definition, setting in library_for_clinic(clinic):
        if not (setting and setting.enabled):
            continue
        if setting.pinned_version:
            pinned = OutcomeDefinition.objects.filter(
                code=definition.code, version=setting.pinned_version, platform_approved=True,
            ).first()
            definition = pinned or definition
        out.append(definition)
    return out


def usable_definition(clinic, definition_id):
    """The definition if the clinic currently has it switched on, else None."""
    return next((d for d in enabled_definitions(clinic) if d.id == definition_id), None)


@transaction.atomic
def complete_assessment(*, user, patient, definition, raw_answers, assessed_on=None, patient_case=None,
                        appointment=None, practitioner=None, ip_address=None):
    """Validate answers, score them on the server and save a new assessment. Raises DefinitionError."""
    cleaned = validate_answers(definition.definition, raw_answers)
    scores = score_assessment(definition.definition, cleaned)
    assessment = OutcomeAssessment(
        patient=patient,
        clinic=patient.clinic.main_clinic,
        patient_case=patient_case,
        appointment=appointment,
        practitioner=practitioner,
        created_by=user,
        definition=definition,
        scores=scores,
        scoring_snapshot=definition.definition['scoring'],
    )
    if assessed_on:
        assessment.assessed_on = assessed_on
    assessment.answers = cleaned
    assessment.save()
    OutcomeAssessmentAuditLog.objects.create(assessment=assessment, action='CREATED', user=user, ip_address=ip_address)
    return assessment


@transaction.atomic
def void_assessment(*, assessment, user, reason, ip_address=None):
    assessment.status = OutcomeAssessment.STATUS_VOIDED
    assessment.voided_at = timezone.now()
    assessment.voided_by = user
    assessment.void_reason = reason
    assessment.save(update_fields=['status', 'voided_at', 'voided_by', 'void_reason', 'updated_at'])
    OutcomeAssessmentAuditLog.objects.create(assessment=assessment, action='VOIDED', user=user, ip_address=ip_address)
    return assessment


def visible_patients(user):
    """
    Patients the user may see. Same rule as the patients list: the whole clinic group for an Owner, otherwise only
    patients whose home branch is one of the user's assigned branches.
    """
    from apps.accounts.utils.rbac import get_assigned_branch_ids
    from apps.patients.models import Patient

    if not user.clinic:
        return Patient.objects.none()
    qs = Patient.objects.filter(clinic_id__in=user.clinic.main_clinic.get_all_branches().values_list('id', flat=True))
    if user.is_owner:
        return qs
    if user.is_branch_manager:
        branches = list(user.get_managed_branches().values_list('id', flat=True))
    else:
        branches = get_assigned_branch_ids(user)
        if not branches and user.clinic_branch_id:
            branches = [user.clinic_branch_id]
    return qs.filter(home_branch_id__in=branches)

import hashlib
import json

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.encryption import FieldEncryptor
from apps.common.models import TimeStampedModel


def definition_checksum(definition):
    return hashlib.sha256(json.dumps(definition, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


class OutcomeDefinition(TimeStampedModel):
    """
    One published version of an outcome measure (items, answer options, scoring, licence).

    Immutable: the definition, code and version of a saved row can never change. A correction is published as
    a new version, so a patient's saved result always points at exactly what they were asked.
    """
    LICENCE_CHOICES = [('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')]

    code = models.CharField(max_length=40)
    version = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    abbreviation = models.CharField(max_length=40, blank=True)
    category = models.CharField(max_length=40)
    language = models.CharField(max_length=10, default='en')
    definition = models.JSONField()
    checksum = models.CharField(max_length=64)
    licence_category = models.CharField(max_length=1, choices=LICENCE_CHOICES)
    licence_notes = models.TextField(blank=True)
    platform_approved = models.BooleanField(
        default=False,
        help_text='Only approved definitions can be switched on by a clinic.',
    )
    retired_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'outcome_definitions'
        unique_together = [('code', 'version')]
        ordering = ['category', 'name', 'code']

    def __str__(self):
        return f'{self.code} {self.version}'

    def save(self, *args, **kwargs):
        if self.pk:
            old = OutcomeDefinition.objects.filter(pk=self.pk).values('code', 'version', 'definition', 'checksum').first()
            if old and (old['code'], old['version'], old['definition'], old['checksum']) != (
                self.code, self.version, self.definition, self.checksum
            ):
                raise ValueError('A published outcome definition cannot be changed; publish a new version.')
        else:
            self.checksum = definition_checksum(self.definition)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError('A published outcome definition cannot be deleted; retire it instead.')


class ClinicOutcomeMeasure(TimeStampedModel):
    """A clinic's on/off choice for one measure. Turning it off never touches saved assessments."""
    clinic = models.ForeignKey('clinics.Clinic', on_delete=models.CASCADE, related_name='outcome_measure_settings')
    code = models.CharField(max_length=40)
    enabled = models.BooleanField(default=False)
    pinned_version = models.CharField(max_length=20, blank=True, help_text='Empty = always the latest approved version.')
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+',
    )

    class Meta:
        db_table = 'clinic_outcome_measures'
        unique_together = [('clinic', 'code')]

    def __str__(self):
        return f'{self.clinic_id} {self.code} {"on" if self.enabled else "off"}'


class OutcomeAssessment(TimeStampedModel):
    """One completion of an outcome measure for a patient. Answers are encrypted; scores are kept in plain form."""
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_VOIDED = 'VOIDED'
    STATUS_CHOICES = [(STATUS_COMPLETED, 'Completed'), (STATUS_VOIDED, 'Voided')]

    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='outcome_assessments')
    clinic = models.ForeignKey('clinics.Clinic', on_delete=models.CASCADE, related_name='outcome_assessments')
    patient_case = models.ForeignKey(
        'patients.PatientCase', on_delete=models.SET_NULL, null=True, blank=True, related_name='outcome_assessments',
    )
    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.SET_NULL, null=True, blank=True, related_name='outcome_assessments',
    )
    practitioner = models.ForeignKey(
        'clinics.Practitioner', on_delete=models.SET_NULL, null=True, blank=True, related_name='outcome_assessments',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='outcome_assessments_created',
    )
    definition = models.ForeignKey(OutcomeDefinition, on_delete=models.PROTECT, related_name='assessments')
    assessed_on = models.DateField(default=timezone.localdate)
    encrypted_answers = models.TextField(blank=True)
    scores = models.JSONField(default=dict)
    scoring_snapshot = models.JSONField(default=dict, help_text='The scoring rules used, copied at completion.')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_COMPLETED)
    completed_at = models.DateTimeField(default=timezone.now)
    voided_at = models.DateTimeField(null=True, blank=True)
    voided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+',
    )
    void_reason = models.CharField(max_length=300, blank=True)

    class Meta:
        db_table = 'outcome_assessments'
        ordering = ['-assessed_on', '-completed_at']
        indexes = [
            models.Index(fields=['patient', 'definition', 'assessed_on']),
            models.Index(fields=['clinic', 'assessed_on']),
        ]

    @property
    def answers(self):
        return FieldEncryptor.decrypt(self.encrypted_answers)

    @answers.setter
    def answers(self, value):
        self.encrypted_answers = FieldEncryptor.encrypt(value)


class OutcomeAssessmentAuditLog(TimeStampedModel):
    ACTION_CHOICES = [('CREATED', 'Created'), ('VIEWED', 'Viewed'), ('VOIDED', 'Voided'), ('EMAILED', 'Emailed')]

    assessment = models.ForeignKey(OutcomeAssessment, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+')
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'outcome_assessment_audit_logs'
        ordering = ['-created_at']

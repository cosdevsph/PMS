import hashlib
import json
import logging

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import EmailMessage
from django.core.validators import validate_email

from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.services.login_throttle_service import (
    get_client_ip, is_throttled, record_failed_attempt, reset_failed_attempts,
)
from apps.appointments.models import Appointment
from apps.common.permissions import HasFeaturePermission
from apps.patients.models import PatientCase

from .models import ClinicOutcomeMeasure, OutcomeAssessment, OutcomeAssessmentAuditLog
from .serializers import (
    AssessmentCreateSerializer, LibraryEntrySerializer, OutcomeAssessmentDetailSerializer,
    OutcomeAssessmentSerializer, OutcomeDefinitionSerializer,
)
from .services import (
    complete_assessment, enabled_definitions, library_for_clinic, main_clinic_of, usable_definition,
    visible_patients, void_assessment,
)
from .validation import DefinitionError


logger = logging.getLogger(__name__)

MAX_EMAIL_RECIPIENTS = 10
MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024


def _require_clinic(user):
    clinic = main_clinic_of(user)
    if clinic is None:
        raise PermissionDenied('Your account is not linked to a clinic.')
    return clinic


class EnabledDefinitionsView(APIView):
    """The measures this clinic has switched on, with items, for the questionnaire screen."""
    permission_classes = [IsAuthenticated, HasFeaturePermission]
    rbac_feature = 'outcome_measures'

    def get(self, request):
        definitions = enabled_definitions(_require_clinic(request.user))
        return Response(OutcomeDefinitionSerializer(definitions, many=True).data)


class ClinicLibraryView(APIView):
    """Owner / Branch Manager: list the platform library and switch measures on or off for the clinic."""
    permission_classes = [IsAuthenticated]

    def _check_manager(self, request):
        if not (request.user.is_owner or request.user.is_branch_manager):
            raise PermissionDenied('Only an Owner or Branch Manager can change the clinic library.')

    @staticmethod
    def _rows(clinic):
        return [
            {
                'id': d.id, 'code': d.code, 'version': d.version, 'name': d.name, 'abbreviation': d.abbreviation,
                'category': d.category, 'description': d.definition.get('description', ''),
                'licence_category': d.licence_category,
                'enabled': bool(s and s.enabled), 'pinned_version': s.pinned_version if s else '',
            }
            for d, s in library_for_clinic(clinic)
        ]

    def get(self, request):
        self._check_manager(request)
        return Response(LibraryEntrySerializer(self._rows(_require_clinic(request.user)), many=True).data)

    def post(self, request, code=None):
        self._check_manager(request)
        clinic = _require_clinic(request.user)
        if code not in {d.code for d, _ in library_for_clinic(clinic)}:
            raise ValidationError({'code': 'This measure is not in the library.'})
        enabled = request.data.get('enabled')
        if not isinstance(enabled, bool):
            raise ValidationError({'enabled': 'Send true or false.'})
        ClinicOutcomeMeasure.objects.update_or_create(
            clinic=clinic, code=code, defaults={'enabled': enabled, 'updated_by': request.user},
        )
        return Response(LibraryEntrySerializer(self._rows(clinic), many=True).data)


class OutcomeAssessmentViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Saved assessments. Created through `create`, never edited; a mistake is voided and re-entered."""
    permission_classes = [IsAuthenticated, HasFeaturePermission]
    rbac_feature = 'outcome_measures'
    serializer_class = OutcomeAssessmentSerializer

    def get_queryset(self):
        qs = OutcomeAssessment.objects.select_related('definition', 'created_by', 'voided_by').filter(
            patient__in=visible_patients(self.request.user),
        )
        params = self.request.query_params
        for param, lookup in (('patient', 'patient_id'), ('patient_case', 'patient_case_id'), ('code', 'definition__code')):
            if params.get(param):
                qs = qs.filter(**{lookup: params[param]})
        return qs

    def get_serializer_class(self):
        return OutcomeAssessmentDetailSerializer if self.action == 'retrieve' else OutcomeAssessmentSerializer

    def retrieve(self, request, *args, **kwargs):
        assessment = self.get_object()
        OutcomeAssessmentAuditLog.objects.create(
            assessment=assessment, action='VIEWED', user=request.user, ip_address=get_client_ip(request),
        )
        return Response(self.get_serializer(assessment).data)

    def create(self, request):
        body = AssessmentCreateSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        data = body.validated_data
        clinic = _require_clinic(request.user)

        # Recording a result needs the user's own password. Wrong tries share the login lockout counter.
        ip, email = get_client_ip(request), request.user.email
        if is_throttled(ip, email):
            return Response(
                {'detail': 'Too many incorrect passwords. Please try again in 15 minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        if not request.user.check_password(data['password']):
            record_failed_attempt(ip, email)
            raise ValidationError({'password': 'Incorrect password.'})
        reset_failed_attempts(ip, email)

        patient = visible_patients(request.user).filter(pk=data['patient']).select_related('clinic').first()
        if patient is None:
            raise ValidationError({'patient': 'This patient is not available to you.'})
        definition = usable_definition(clinic, data['definition'])
        if definition is None:
            raise ValidationError({'definition': 'This measure is not switched on for your clinic.'})

        case = None
        if data.get('patient_case'):
            case = PatientCase.objects.filter(pk=data['patient_case'], patient=patient).first()
            if case is None:
                raise ValidationError({'patient_case': 'This case does not belong to the patient.'})
        appointment = None
        if data.get('appointment'):
            appointment = Appointment.objects.filter(pk=data['appointment'], patient=patient).first()
            if appointment is None:
                raise ValidationError({'appointment': 'This appointment does not belong to the patient.'})

        try:
            assessment = complete_assessment(
                user=request.user, patient=patient, definition=definition, raw_answers=data['answers'],
                assessed_on=data.get('assessed_on'), patient_case=case, appointment=appointment,
                practitioner=getattr(request.user, 'practitioner_profile', None),
                ip_address=get_client_ip(request),
            )
        except DefinitionError as exc:
            raise ValidationError({'answers': exc.errors})
        return Response(OutcomeAssessmentSerializer(assessment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def void(self, request, pk=None):
        assessment = self.get_object()
        reason = str(request.data.get('reason', '')).strip()
        if not reason:
            raise ValidationError({'reason': 'Give a reason.'})
        if assessment.status == OutcomeAssessment.STATUS_VOIDED:
            raise ValidationError({'detail': 'Already voided.'})
        void_assessment(assessment=assessment, user=request.user, reason=reason[:300], ip_address=get_client_ip(request))
        return Response(self.get_serializer(assessment).data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser, JSONParser])
    def email(self, request, pk=None):
        """
        Email an outcome-measure report to the patient or others, with the PDF the screen generated attached.
        Fields: `to` (comma-separated), `subject`, `body`, `attachment` (a PDF file).
        """
        assessment = self.get_object()
        patient, clinic = assessment.patient, assessment.clinic

        raw = str(request.data.get('to', '')).replace(';', ',')
        recipients = [e.strip() for e in raw.split(',') if e.strip()] or ([patient.email] if patient.email else [])
        if not recipients:
            raise ValidationError({'to': 'Add a recipient; this patient has no email on file.'})
        if len(recipients) > MAX_EMAIL_RECIPIENTS:
            raise ValidationError({'to': f'At most {MAX_EMAIL_RECIPIENTS} recipients.'})
        for address in recipients:
            try:
                validate_email(address)
            except DjangoValidationError:
                raise ValidationError({'to': f'"{address}" is not a valid email address.'})

        attachment = request.FILES.get('attachment')
        if attachment is None:
            raise ValidationError({'attachment': 'The PDF report is required.'})
        if attachment.size > MAX_ATTACHMENT_BYTES:
            raise ValidationError({'attachment': 'The PDF is too large to email.'})
        content = attachment.read()
        if not content.startswith(b'%PDF'):
            raise ValidationError({'attachment': 'The attachment must be a PDF.'})

        measure = assessment.definition.name
        subject = str(request.data.get('subject', '')).strip() or f'{measure} – {clinic.name}'
        body = str(request.data.get('body', '')).strip() or (
            f'Dear {patient.get_full_name()},\n\nPlease find attached your {measure} report.\n\n'
            f'Best regards,\n{clinic.name}'
        )

        message = EmailMessage(
            subject=subject[:200], body=body, from_email=getattr(clinic, 'email', None) or settings.DEFAULT_FROM_EMAIL,
            to=recipients,
        )
        slug = measure.replace(' ', '-').lower()
        message.attach(f'{slug}-{patient.get_full_name().replace(" ", "-").lower()}.pdf', content, 'application/pdf')
        try:
            message.send(fail_silently=False)
        except Exception:
            logger.exception('Outcome report email failed')
            return Response({'detail': 'The email could not be sent. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)

        OutcomeAssessmentAuditLog.objects.create(
            assessment=assessment, action='EMAILED', user=request.user, ip_address=get_client_ip(request),
        )
        return Response({'detail': f"Sent to {', '.join(recipients)}"})

    @action(detail=False, methods=['get'])
    def trend(self, request):
        """Scores over time for one patient and measure. Voided and unscorable results are left out."""
        patient_id, code = request.query_params.get('patient'), request.query_params.get('code')
        if not patient_id or not code:
            raise ValidationError({'detail': 'patient and code are required.'})
        rows = self.get_queryset().filter(
            patient_id=patient_id, definition__code=code, status=OutcomeAssessment.STATUS_COMPLETED,
        ).order_by('assessed_on', 'completed_at')
        points, meta = [], None
        for a in rows:
            total = (a.scores or {}).get('total') or {}
            if total.get('score') is None:
                continue
            # Results scored by different rules are not joined on the graph.
            scoring_key = hashlib.sha256(json.dumps(a.scoring_snapshot, sort_keys=True).encode()).hexdigest()[:12]
            points.append({
                'id': a.id, 'assessed_on': a.assessed_on, 'completed_at': a.completed_at,
                'version': a.definition.version, 'score': total['score'],
                'subscales': {k: v.get('score') for k, v in (a.scores.get('subscales') or {}).items()},
                'scoring_key': scoring_key,
            })
            meta = {
                'name': a.definition.name, 'abbreviation': a.definition.abbreviation,
                'direction': a.scores.get('direction'), 'range': total.get('range'),
                'subscale_names': {k: v.get('name') for k, v in (a.scores.get('subscales') or {}).items()},
            }
        return Response({'points': points, 'measure': meta})

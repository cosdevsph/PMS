from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from rest_framework.response import Response

from apps.appointments.models import Appointment
from apps.common.permissions import HasFeaturePermission, HasRoleIn
from apps.patients.models import PrivatePackageSession
from apps.patients.package_serializers import (
    PrivatePackageAuditLogSerializer,
    PrivatePackageSessionSerializer,
    PrivatePackageWriteSerializer,
)
from apps.patients.services import package_service

# Owner, Branch Manager (BRANCH_MANAGER), Staff and Practitioner may create and
# edit Private Package Sessions (decision D3, 2026-10-20). The role list is used
# instead of a feature key because Staff only has `client_cases: view` by default.
PACKAGE_WRITE_ROLES = ['OWNER', 'BRANCH_MANAGER', 'STAFF', 'PRACTITIONER']


def _client_ip(request) -> str:
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR') or '127.0.0.1'


class PrivatePackageSessionViewSet(viewsets.ModelViewSet):
    """
    Private Package Sessions: prepaid packages owned by a patient.

    GET    /api/private-packages/?patient=<id>&status=<s>   list (with balances)
    POST   /api/private-packages/                           create (+ package invoice)
    GET    /api/private-packages/{id}/                      detail
    PATCH  /api/private-packages/{id}/                      edit (title, price, notes, status, items)
    GET    /api/private-packages/{id}/history/              audit log
    POST   /api/private-packages/{id}/assign-appointment/   explicitly assign an appointment  {appointment, reason?}
    POST   /api/private-packages/{id}/unassign-appointment/ undo an assignment               {appointment, reason?}

    Packages are cancelled by setting status=CANCELLED, never deleted.
    """

    serializer_class = PrivatePackageSessionSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['patient', 'status']
    ordering_fields = ['created_at', 'updated_at', 'title']

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            self.rbac_feature = 'patients'
            self.rbac_min_level = 'view'
            return [IsAuthenticated(), HasFeaturePermission()]
        self.rbac_allowed_roles = PACKAGE_WRITE_ROLES
        return [IsAuthenticated(), HasRoleIn()]

    def get_queryset(self):
        user = self.request.user
        group_ids = package_service.clinic_group_ids(user.clinic)
        qs = PrivatePackageSession.objects.filter(patient__clinic_id__in=group_ids)
        branches = package_service.visible_branch_ids(user)
        if branches is not None:
            # Same rule as the patient list: a package is visible when its patient is.
            qs = qs.filter(patient__home_branch_id__in=branches)
        return package_service.with_balances(qs)

    def create(self, request, *args, **kwargs):
        ser = PrivatePackageWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        package = package_service.create_package(
            user=request.user,
            patient_id=data.get('patient'),
            title=data.get('title'),
            price=data.get('price', 0),
            notes=data.get('notes', ''),
            raw_items=data.get('items'),
            ip_address=_client_ip(request),
        )
        return Response(self._read(package.pk), status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        package = self.get_object()
        ser = PrivatePackageWriteSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = {k: v for k, v in ser.validated_data.items() if k != 'patient'}
        package_service.update_package(request.user, package, data, ip_address=_client_ip(request))
        return Response(self._read(package.pk))

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        package = self.get_object()
        logs = package.audit_logs.select_related('user')
        return Response(PrivatePackageAuditLogSerializer(logs, many=True).data)

    def _appointment_from_request(self, request):
        try:
            appointment_id = int(request.data.get('appointment'))
        except (TypeError, ValueError):
            raise ValidationError({'appointment': 'An appointment is required.'})
        group_ids = package_service.clinic_group_ids(request.user.clinic)
        appointment = Appointment.objects.filter(
            pk=appointment_id, is_deleted=False, clinic_id__in=group_ids,
        ).first()
        if appointment is None:
            raise ValidationError({'appointment': 'Appointment not found.'})
        return appointment

    @action(detail=True, methods=['post'], url_path='assign-appointment')
    def assign_appointment(self, request, pk=None):
        package = self.get_object()
        appointment = self._appointment_from_request(request)
        package_service.assign_appointment(
            request.user, package, appointment,
            reason=(request.data.get('reason') or '').strip(), ip_address=_client_ip(request),
        )
        return Response(self._read(package.pk))

    @action(detail=True, methods=['post'], url_path='unassign-appointment')
    def unassign_appointment(self, request, pk=None):
        package = self.get_object()
        appointment = self._appointment_from_request(request)
        package_service.unassign_appointment(
            request.user, package, appointment,
            reason=(request.data.get('reason') or '').strip(), ip_address=_client_ip(request),
        )
        return Response(self._read(package.pk))

    def _read(self, pk):
        """Re-read with annotated balances so the response matches the list."""
        package = self.get_queryset().get(pk=pk)
        return PrivatePackageSessionSerializer(package, context=self.get_serializer_context()).data

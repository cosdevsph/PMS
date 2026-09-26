import logging
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework import status
import re
from .serializers import SendSMSSerializer, MessageDetailSerializer, SMSTemplateSerializer
from .models import SMSMessage, SMSTemplate
from .tasks import dispatch_sms_task

logger = logging.getLogger(__name__)


class SendSMSView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'user_sms'

    def post(self, request, *args, **kwargs):
        serializer = SendSMSSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        recipient = serializer.validated_data['to']
        sender_id = serializer.validated_data.get('sender_id')
        template_id = serializer.validated_data.get('template_id')

        if template_id:
            try:
                template = SMSTemplate.objects.get(id=template_id)
            except SMSTemplate.DoesNotExist:
                return Response({"error": "Template not found."}, status=status.HTTP_404_NOT_FOUND)

            template_vars = serializer.validated_data.get('template_vars') or {}
            body = template.content

            def replace_var(match):
                var_name = match.group(1).strip()
                return str(template_vars.get(var_name, match.group(0)))

            body = re.sub(r'\{\{([^}]+)\}\}', replace_var, body)
        else:
            body = serializer.validated_data.get('message', '').strip()

        scheduled_time = serializer.validated_data.get('scheduled_time')

        if not body.startswith("[Malasakit]"):
            body = f"[Malasakit] {body}"

        clinic = None
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            clinic_id = request.data.get('clinic_id')
            if clinic_id:
                from apps.clinics.models import Clinic
                clinic = Clinic.objects.filter(id=clinic_id).first()
            if not clinic and getattr(user, 'clinic', None):
                clinic = getattr(user, 'clinic_branch', None) or user.clinic

        sms_message = SMSMessage.objects.create(
            clinic=clinic,
            recipient_number=recipient,
            sender_id=sender_id,
            body=body,
            status=SMSMessage.STATUS_QUEUED,
            scheduled_time=scheduled_time
        )
        logger.info("SendSMSView: created SMSMessage %s for %s (clinic=%s)", sms_message.id, recipient, clinic)

        if clinic:
            try:
                from apps.notifications.models import CommunicationLog
                from apps.notifications.services.notification_service import broadcast_communication_log_updated
                from apps.patients.models import Patient
                from apps.gateway.services import build_phone_variations
                patient = Patient.objects.filter(clinic=clinic, phone__in=build_phone_variations(recipient)).first()
                comm_log = CommunicationLog.objects.create(
                    clinic=clinic,
                    patient=patient,
                    comm_type='SYSTEM_NOTIFICATION',
                    channel='SMS',
                    direction='OUTBOUND',
                    status='QUEUED',
                    recipient=recipient,
                    subject='Direct SMS',
                    body_preview=body[:2000] if body else '',
                    full_body=body,
                    message_id=str(sms_message.id),
                    event_metadata={
                        'sms_message_id': str(sms_message.id),
                    }
                )
                broadcast_communication_log_updated(comm_log)
            except Exception as comm_err:
                logger.warning("SendSMSView: Failed to create CommunicationLog: %s", comm_err)

        try:
            if scheduled_time:
                dispatch_sms_task.apply_async(args=[str(sms_message.id)], eta=scheduled_time)
            else:
                dispatch_sms_task.delay(str(sms_message.id))
        except Exception as e:
            # If the user doesn't run Redis/Celery in production to save money, 
            # we just silently ignore the broker error. The message is already in 
            # the database as STATUS_QUEUED, so the Android app will pick it up anyway!
            logger.warning("Celery broker offline, but message %s is queued in DB safely: %s", sms_message.id, e)

        return Response({
            "message_id": sms_message.id,
            "recipient": sms_message.recipient_number,
            "status": SMSMessage.STATUS_QUEUED,
            "created_at": sms_message.created_at,
        }, status=status.HTTP_202_ACCEPTED)


class MessageDetailView(RetrieveAPIView):
    queryset = SMSMessage.objects.prefetch_related('delivery_events').all()
    serializer_class = MessageDetailSerializer
    lookup_field = 'id'


class SMSTemplateViewSet(ModelViewSet):
    queryset = SMSTemplate.objects.all()
    serializer_class = SMSTemplateSerializer

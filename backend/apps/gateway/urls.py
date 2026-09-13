from django.urls import path
from .views import (
    DeviceRegisterView,
    DeviceHeartbeatView,
    GatewayQueueView,
    WebhookDeliveryView,
    WebhookInboundView,
    CreatePairingSessionView,
    CancelPairingSessionView,
    PairingSessionStatusView,
    DevicePairView,
    ClinicDeviceDetailView,
    DisconnectClinicDeviceView,
    DownloadGatewayApkView,
    GatewayApkInfoView,
)

app_name = 'gateway'

urlpatterns = [
    # APK Distribution & Download
    path('download-apk/', DownloadGatewayApkView.as_view(), name='download-apk'),
    path('apk-info/', GatewayApkInfoView.as_view(), name='apk-info'),

    # Pairing Handshake (Web Dashboard)
    path('pairing/session/', CreatePairingSessionView.as_view(), name='pairing-session-create'),
    path('pairing/cancel/', CancelPairingSessionView.as_view(), name='pairing-session-cancel'),
    path('pairing/status/<uuid:session_id>/', PairingSessionStatusView.as_view(), name='pairing-session-status'),

    # Device Pairing (Malasakit Clinic App)
    path('devices/pair/', DevicePairView.as_view(), name='device-pair'),

    # Clinic Device Management (Web Dashboard)
    path('devices/clinic-device/', ClinicDeviceDetailView.as_view(), name='clinic-device-detail'),
    path('devices/disconnect/', DisconnectClinicDeviceView.as_view(), name='clinic-device-disconnect'),

    # Legacy & Shared Gateway Device Lifecycle
    path('devices/register/', DeviceRegisterView.as_view(), name='device-register'),
    path('devices/heartbeat/', DeviceHeartbeatView.as_view(), name='device-heartbeat'),

    # Gateway operations (require per-device Bearer token)
    path('queue/', GatewayQueueView.as_view(), name='gateway-queue'),
    path('webhooks/delivery/', WebhookDeliveryView.as_view(), name='webhook-delivery'),
    path('webhooks/inbound/', WebhookInboundView.as_view(), name='webhook-inbound'),
]


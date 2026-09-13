"""
gateway/serializers.py

Serializers for gateway device registration and management.
"""
from rest_framework import serializers
from .models import GatewayDevice


class DeviceRegistrationSerializer(serializers.Serializer):
    """Validates the device registration request payload."""
    device_identifier = serializers.CharField(
        max_length=255,
        help_text="Unique identifier for this device (e.g. ANDROID-GATEWAY-001)"
    )
    device_name = serializers.CharField(
        max_length=255,
        help_text="Friendly name for this device"
    )
    phone_number = serializers.CharField(
        max_length=20, required=False, allow_blank=True, default='',
        help_text="SIM phone number on this device (E.164, optional)"
    )


class DevicePublicSerializer(serializers.ModelSerializer):
    """
    Safe serializer for GatewayDevice — NEVER includes device_token.
    Used for registration responses (token returned separately) and all other
    device read operations.
    """
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = GatewayDevice
        fields = [
            'id', 'device_identifier', 'name', 'phone_number',
            'status', 'is_active', 'is_online', 'last_seen_at',
            'created_at', 'updated_at',
        ]
        # device_token is explicitly excluded

    def get_is_online(self, obj):
        return obj.is_online()


class DeviceRegistrationResponseSerializer(serializers.ModelSerializer):
    """
    Registration response — the ONLY serializer that includes device_token.
    Used exactly once per registration (or token rotation).
    """
    class Meta:
        model = GatewayDevice
        fields = [
            'id', 'device_identifier', 'name', 'phone_number',
            'status', 'is_active', 'device_token', 'created_at',
        ]


class HeartbeatResponseSerializer(serializers.Serializer):
    """Response body for the heartbeat endpoint."""
    device_id = serializers.UUIDField()
    device_identifier = serializers.CharField()
    status = serializers.CharField()
    is_online = serializers.BooleanField()
    last_seen_at = serializers.DateTimeField()


from .models import DevicePairingSession


class ClinicDeviceDetailSerializer(serializers.ModelSerializer):
    is_online = serializers.SerializerMethodField()
    sms_service_status = serializers.CharField(read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True, default='')

    class Meta:
        model = GatewayDevice
        fields = [
            'id', 'device_identifier', 'name', 'phone_number', 'phone_number_verified',
            'sim_carrier', 'sim_carrier_2', 'sim_slot_index', 'sim_subscription_id', 'sms_capable',
            'model_name', 'android_version', 'app_version', 'battery_level', 'is_charging',
            'network_type', 'signal_strength',
            'status', 'is_active', 'is_online', 'sms_service_status',
            'last_seen_at', 'last_sms_at', 'clinic_id', 'clinic_name',
            'created_at', 'updated_at',
        ]

    def get_is_online(self, obj):
        return obj.is_online()


class DevicePairingSessionResponseSerializer(serializers.ModelSerializer):
    qr_payload = serializers.SerializerMethodField()
    time_remaining_seconds = serializers.SerializerMethodField()
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)

    class Meta:
        model = DevicePairingSession
        fields = [
            'id', 'pairing_token', 'pairing_code', 'status',
            'expires_at', 'time_remaining_seconds', 'clinic_id', 'clinic_name',
            'qr_payload', 'created_at',
        ]

    def get_time_remaining_seconds(self, obj):
        from django.utils import timezone
        diff = (obj.expires_at - timezone.now()).total_seconds()
        return max(0, int(diff))

    def get_qr_payload(self, obj):
        request = self.context.get('request')
        endpoint = request.build_absolute_uri('/api/gateway/devices/pair/') if request else '/api/gateway/devices/pair/'
        if endpoint.startswith('http://') and not any(h in endpoint for h in ('localhost', '127.0.0.1', '10.0.2.2')):
            endpoint = 'https://' + endpoint[7:]
        return {
            'v': 1,
            'type': 'malasakit_sms_pairing',
            'endpoint': endpoint,
            'token': obj.pairing_token,
            'code': obj.pairing_code,
            'clinic_id': obj.clinic_id,
            'clinic_name': obj.clinic.name,
        }


class DevicePairingRequestSerializer(serializers.Serializer):
    """Payload from Android app when pairing via QR code or manual code."""
    pairing_token = serializers.CharField(required=False, allow_blank=True, default='')
    pairing_code = serializers.CharField(required=False, allow_blank=True, default='')
    device_identifier = serializers.CharField(max_length=255)
    device_name = serializers.CharField(max_length=255)
    model_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    android_version = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    app_version = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    sim_carrier = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    sim_slot_index = serializers.IntegerField(required=False, allow_null=True, default=None)
    sim_subscription_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    sms_capable = serializers.BooleanField(required=False, default=True)

    def validate(self, attrs):
        token = attrs.get('pairing_token', '').strip()
        code = attrs.get('pairing_code', '').strip().upper()
        if not token and not code:
            raise serializers.ValidationError("Either pairing_token or pairing_code is required.")
        return attrs


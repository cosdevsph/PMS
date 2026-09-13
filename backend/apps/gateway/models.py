import uuid
import secrets
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.common.models import TimeStampedModel


class GatewayDevice(models.Model):
    """
    Represents a physical Android device acting as an SMS gateway node.
    Each device has a unique identifier (set at registration) and a unique
    cryptographic token used to authenticate API requests.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        'clinics.Clinic',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='gateway_devices',
        help_text="The clinic this device is paired with. NULL for legacy global gateway."
    )
    is_legacy = models.BooleanField(
        default=False,
        help_text="Designates the pre-existing production gateway (Gateway BNE-LX1)."
    )
    name = models.CharField(
        max_length=255,
        help_text="Friendly name for this device (e.g. 'Clinic A - Samsung A55')"
    )
    device_identifier = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        default=uuid.uuid4,
        help_text="Unique identifier supplied by the Android app (e.g. ANDROID-GATEWAY-001 or Android device UUID)"
    )
    phone_number = models.CharField(
        max_length=20, blank=True,
        help_text="The SIM phone number on this device (E.164)"
    )
    sim_carrier = models.CharField(max_length=100, blank=True, help_text="Detected carrier name (e.g. Globe, Smart)")
    sim_slot_index = models.IntegerField(null=True, blank=True)
    sim_subscription_id = models.IntegerField(null=True, blank=True)
    phone_number_verified = models.BooleanField(default=False)
    sms_capable = models.BooleanField(default=True)
    model_name = models.CharField(max_length=100, blank=True, help_text="e.g. Samsung Galaxy A15")
    android_version = models.CharField(max_length=50, blank=True)
    app_version = models.CharField(max_length=50, blank=True)
    battery_level = models.IntegerField(null=True, blank=True, help_text="Battery percentage (0-100)")
    is_charging = models.BooleanField(null=True, blank=True, help_text="True if device is currently plugged into charger")
    network_type = models.CharField(max_length=50, blank=True, help_text="Network transport: WIFI, CELLULAR, NONE")
    sim_carrier_2 = models.CharField(max_length=100, blank=True, help_text="Secondary SIM carrier name")
    signal_strength = models.IntegerField(null=True, blank=True, help_text="Signal strength dBm or bars")
    last_sms_at = models.DateTimeField(null=True, blank=True)

    # The token is stored in plain text because we need to compare it on every
    # request. In a higher-security environment this could be hashed.
    device_token = models.CharField(
        max_length=128, unique=True, db_index=True,
        help_text="Secret token used by the device to authenticate with the API — never expose in list views"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_active = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(null=True, blank=True, help_text="Last time the device polled or sent a heartbeat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        clinic_label = self.clinic.name if self.clinic else ("Legacy Gateway" if self.is_legacy else "Unassigned")
        return f"{self.name} [{clinic_label}] ({self.status})"

    class Meta:
        ordering = ['name']

    @staticmethod
    def generate_token():
        """Generate a cryptographically secure 64-character hex token."""
        return secrets.token_hex(32)  # 256 bits of randomness

    def is_online(self):
        """
        Derive online status from last_seen_at.
        A device is considered online if it sent a heartbeat or poll within
        GATEWAY_HEARTBEAT_TIMEOUT_SECONDS (default: 120 seconds).
        """
        if not self.last_seen_at:
            return False
        timeout = getattr(settings, 'GATEWAY_HEARTBEAT_TIMEOUT_SECONDS', 120)
        return (timezone.now() - self.last_seen_at).total_seconds() <= timeout

    def touch(self):
        """Update last_seen_at to now (called on heartbeat or queue poll)."""
        self.last_seen_at = timezone.now()
        self.save(update_fields=['last_seen_at', 'updated_at'])

    @property
    def sms_service_status(self):
        """
        Derives real-time SMS service readiness:
        - 'READY': Device active, online, SIM detected, SMS capable.
        - 'DEGRADED': Device online and SIM detected, but critically low battery (<=15% and not charging).
        - 'OFFLINE': Device active, but no recent heartbeat (>120s).
        - 'SIM_UNAVAILABLE': Device online, but no active SIM detected.
        - 'SUSPENDED': Device deactivated or suspended by clinic admin.
        - 'INACTIVE': Device inactive.
        """
        if not self.is_active or self.status == 'SUSPENDED':
            return 'SUSPENDED'
        if self.status != 'ACTIVE':
            return 'INACTIVE'
        if not self.is_online():
            return 'OFFLINE'
        if not self.sms_capable or (not self.sim_carrier and not self.phone_number and self.sim_subscription_id is None):
            return 'SIM_UNAVAILABLE'
        if self.battery_level is not None and self.battery_level <= 15 and not getattr(self, 'is_charging', False):
            return 'DEGRADED'
        return 'READY'


class DevicePairingSession(TimeStampedModel):
    """
    Manages short-lived, secure pairing sessions between a Clinic and an Android device.
    Supports both QR code scanning and manual fallback pairing codes.
    """
    STATUS_PENDING = 'PENDING'
    STATUS_CLAIMED = 'CLAIMED'
    STATUS_EXPIRED = 'EXPIRED'
    STATUS_CANCELLED = 'CANCELLED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_CLAIMED, 'Claimed'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clinic = models.ForeignKey(
        'clinics.Clinic',
        on_delete=models.CASCADE,
        related_name='pairing_sessions'
    )
    pairing_token = models.CharField(max_length=64, unique=True, db_index=True)
    pairing_code = models.CharField(max_length=16, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    expires_at = models.DateTimeField()
    claimed_at = models.DateTimeField(null=True, blank=True)
    claimed_by_device = models.ForeignKey(
        GatewayDevice,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='pairing_sessions'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['clinic', 'status']),
            models.Index(fields=['pairing_token']),
            models.Index(fields=['pairing_code']),
        ]

    def __str__(self):
        return f"PairingSession {self.pairing_code} ({self.clinic.name}) - {self.status}"

    @property
    def is_valid(self):
        return self.status == self.STATUS_PENDING and timezone.now() < self.expires_at

    @staticmethod
    def generate_token():
        return secrets.token_hex(32)

    @classmethod
    def generate_unique_code(cls):
        """Generate human-readable pairing code: MAL-XXXX (4 alphanumeric chars)"""
        import string
        chars = string.ascii_uppercase.replace('O', '').replace('I', '') + '23456789'
        for _ in range(100):
            code_num = ''.join(secrets.choice(chars) for _ in range(4))
            code = f"MAL-{code_num}"
            if not cls.objects.filter(pairing_code=code, status=cls.STATUS_PENDING).exists():
                return code
        return f"MAL-{secrets.token_hex(2).upper()}"


class Provider(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Internal name for the provider configuration")
    provider_type = models.CharField(max_length=50, help_text="Identifier for the provider integration (e.g., LOCAL, SMPP, HTTP)")
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.provider_type})"


class WebhookEvent(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSED', 'Processed'),
        ('FAILED', 'Failed'),
        ('IGNORED', 'Ignored'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(Provider, on_delete=models.SET_NULL, null=True, blank=True)
    gateway_device = models.ForeignKey(GatewayDevice, on_delete=models.SET_NULL, null=True, blank=True)
    event_type = models.CharField(max_length=100)
    raw_payload = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Webhook {self.event_type} - {self.status}"

"""
gateway/tests.py — Chunk 2 Test Suite

Covers:
  - Device Registration (success, idempotency, duplicate protection)
  - Device Authentication (Bearer token, invalid token, inactive device)
  - Device Heartbeat (updates last_seen_at, token not rotated)
  - Token Exposure (public serializations do not leak token)
  - Gateway Queue (isolation, atomic claiming)
  - Delivery Webhook (ownership, idempotency)
  - Inbound Webhook (ownership)
"""
from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from apps.smsgateway.models import SMSMessage, DeliveryEvent, InboundSMS
from apps.gateway.models import GatewayDevice, WebhookEvent
from django.conf import settings
from django.utils import timezone
from unittest.mock import patch
import uuid


class BaseGatewayTestCase(APITestCase):
    def setUp(self):
        # Create a test active device
        self.device = GatewayDevice.objects.create(
            device_identifier='ANDROID-TEST-001',
            name='Test Gateway 1',
            device_token=GatewayDevice.generate_token(),
            status='ACTIVE',
            is_active=True
        )
        self.auth_header = f"Bearer {self.device.device_token}"

        # Create a second active device for isolation tests
        self.device2 = GatewayDevice.objects.create(
            device_identifier='ANDROID-TEST-002',
            name='Test Gateway 2',
            device_token=GatewayDevice.generate_token(),
            status='ACTIVE',
            is_active=True
        )
        self.auth_header2 = f"Bearer {self.device2.device_token}"

        # Setup URLs
        self.register_url = reverse('gateway:device-register')
        self.heartbeat_url = reverse('gateway:device-heartbeat')
        self.queue_url = reverse('gateway:gateway-queue')
        self.delivery_url = reverse('gateway:webhook-delivery')
        self.inbound_url = reverse('gateway:webhook-inbound')


# ==============================================================================
# 1. REGISTRATION TESTS
# ==============================================================================

class DeviceRegistrationTests(BaseGatewayTestCase):
    def test_register_device_success(self):
        """TEST 1: Register Device -> 201, token returned."""
        payload = {
            'device_identifier': 'NEW-DEVICE-999',
            'device_name': 'New Device',
        }
        headers = {'HTTP_X_REGISTRATION_SECRET': settings.GATEWAY_REGISTRATION_SECRET}
        response = self.client.post(self.register_url, payload, format='json', **headers)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('device_token', response.data)
        self.assertEqual(response.data['device_identifier'], 'NEW-DEVICE-999')
        self.assertEqual(GatewayDevice.objects.filter(device_identifier='NEW-DEVICE-999').count(), 1)

    def test_register_device_duplicate_idempotent(self):
        """TEST 2: Duplicate Device -> Returns existing without duplicate."""
        payload = {
            'device_identifier': self.device.device_identifier,
            'device_name': 'Attempted Duplicate',
        }
        headers = {'HTTP_X_REGISTRATION_SECRET': settings.GATEWAY_REGISTRATION_SECRET}
        response = self.client.post(self.register_url, payload, format='json', **headers)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Token MUST NOT be exposed on idempotent re-registration
        self.assertNotIn('device_token', response.data)
        self.assertEqual(response.data['name'], self.device.name)
        # Ensure no duplicates were created
        self.assertEqual(GatewayDevice.objects.filter(device_identifier=self.device.device_identifier).count(), 1)

    def test_register_unauthorized(self):
        payload = {'device_identifier': 'ANY', 'device_name': 'ANY'}
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ==============================================================================
# 2. AUTHENTICATION & SECURITY TESTS
# ==============================================================================

class GatewayAuthenticationTests(BaseGatewayTestCase):
    def test_valid_token(self):
        """TEST 3: Device Authentication using Bearer device_token -> 200."""
        response = self.client.post(self.heartbeat_url, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_token(self):
        """TEST 4: Invalid Token -> 401."""
        response = self.client.post(self.heartbeat_url, format='json', HTTP_AUTHORIZATION='Bearer invalid123')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_device(self):
        """TEST 5: Inactive Device -> 403 Forbidden on all protected endpoints."""
        self.device.is_active = False
        self.device.save()

        # Heartbeat
        resp1 = self.client.post(self.heartbeat_url, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(resp1.status_code, status.HTTP_403_FORBIDDEN)
        
        # Queue
        resp2 = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(resp2.status_code, status.HTTP_403_FORBIDDEN)
        
        # Delivery
        resp3 = self.client.post(self.delivery_url, {}, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(resp3.status_code, status.HTTP_403_FORBIDDEN)

        # Inbound
        resp4 = self.client.post(self.inbound_url, {}, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(resp4.status_code, status.HTTP_403_FORBIDDEN)


# ==============================================================================
# 3. HEARTBEAT TESTS
# ==============================================================================

class HeartbeatTests(BaseGatewayTestCase):
    def test_heartbeat_updates_last_seen(self):
        """TEST 6: Heartbeat -> Updates last_seen_at."""
        self.assertIsNone(self.device.last_seen_at)
        response = self.client.post(self.heartbeat_url, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.device.refresh_from_db()
        self.assertIsNotNone(self.device.last_seen_at)
        self.assertTrue(self.device.is_online())

    def test_heartbeat_does_not_rotate_token(self):
        """TEST 11: Heartbeat -> Token remains unchanged."""
        original_token = self.device.device_token
        self.client.post(self.heartbeat_url, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.client.post(self.heartbeat_url, format='json', HTTP_AUTHORIZATION=self.auth_header)
        
        self.device.refresh_from_db()
        self.assertEqual(self.device.device_token, original_token)

    def test_heartbeat_updates_extended_telemetry(self):
        """Chunk 11: Heartbeat updates charging state, network type, secondary SIM, and battery."""
        payload = {
            'battery_level': 88,
            'is_charging': True,
            'network_type': 'WIFI',
            'sim_carrier': 'Globe Telecom',
            'sim_carrier_2': 'Smart Communications',
            'signal_strength': 4,
            'app_version': '1.0.0',
        }
        res = self.client.post(self.heartbeat_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'online')
        self.assertEqual(res.data['device_status'], 'ACTIVE')
        self.assertEqual(res.data['sms_service_status'], 'READY')
        self.assertIn('queue_count', res.data)

        self.device.refresh_from_db()
        self.assertEqual(self.device.battery_level, 88)
        self.assertTrue(self.device.is_charging)
        self.assertEqual(self.device.network_type, 'WIFI')
        self.assertEqual(self.device.sim_carrier, 'Globe Telecom')
        self.assertEqual(self.device.sim_carrier_2, 'Smart Communications')
        self.assertEqual(self.device.signal_strength, 4)

    def test_heartbeat_degraded_status_on_critically_low_unplugged_battery(self):
        """Chunk 11: Device with <=15% battery and NOT charging reports DEGRADED status."""
        payload = {
            'battery_level': 10,
            'is_charging': False,
            'sim_carrier': 'Globe Telecom',
        }
        res = self.client.post(self.heartbeat_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['sms_service_status'], 'DEGRADED')

        self.device.refresh_from_db()
        self.assertEqual(self.device.sms_service_status, 'DEGRADED')

        # When plugged in, recovers back to READY
        payload_plugged = {
            'battery_level': 10,
            'is_charging': True,
            'sim_carrier': 'Globe Telecom',
        }
        res2 = self.client.post(self.heartbeat_url, payload_plugged, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['sms_service_status'], 'READY')


# ==============================================================================
# 4. QUEUE TESTS
# ==============================================================================

class QueueTests(BaseGatewayTestCase):
    def test_queue_isolation(self):
        """TEST 7: Queue Isolation -> Device A gets only A's messages, B gets B's."""
        # Unassigned (can be claimed by anyone, but we want to test assignment)
        SMSMessage.objects.create(recipient_number='+639000000001', body='Msg A', status=SMSMessage.STATUS_QUEUED, gateway_device=self.device)
        SMSMessage.objects.create(recipient_number='+639000000002', body='Msg B', status=SMSMessage.STATUS_QUEUED, gateway_device=self.device2)
        
        resp_a = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_header)
        resp_b = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_header2)
        
        self.assertEqual(len(resp_a.data['messages']), 1)
        self.assertEqual(resp_a.data['messages'][0]['body'], 'Msg A')
        
        self.assertEqual(len(resp_b.data['messages']), 1)
        self.assertEqual(resp_b.data['messages'][0]['body'], 'Msg B')

    def test_queue_unassigned_claim(self):
        """Unassigned messages should be claimed by the polling device."""
        msg = SMSMessage.objects.create(recipient_number='+639000000003', body='Unassigned', status=SMSMessage.STATUS_QUEUED)
        self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_header)
        msg.refresh_from_db()
        self.assertEqual(msg.gateway_device, self.device)
        self.assertEqual(msg.status, SMSMessage.STATUS_SENDING)


# ==============================================================================
# 5. WEBHOOK OWNERSHIP TESTS
# ==============================================================================

class WebhookOwnershipTests(BaseGatewayTestCase):
    def test_delivery_ownership(self):
        """TEST 9: Delivery Ownership -> Device A cannot update Device B's SMS."""
        msg_b = SMSMessage.objects.create(
            recipient_number='+639000000004',
            body='Msg B',
            status=SMSMessage.STATUS_SENDING,
            gateway_device=self.device2
        )
        
        payload = {
            'message_id': str(msg_b.id),
            'status': 'DELIVERED',
            'event_id': 'evt_1'
        }
        # Device A attempts to update Device B's message
        response = self.client.post(self.delivery_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        msg_b.refresh_from_db()
        self.assertEqual(msg_b.status, SMSMessage.STATUS_SENDING) # Not changed

    def test_inbound_ownership(self):
        """TEST 10: Inbound Ownership -> Inbound SMS is associated with the authenticated device."""
        payload = {
            'message_id': 'inbound-001',
            'sender': '+639123456789',
            'recipient': '+639085608811',
            'message': 'Hello'
        }
        response = self.client.post(self.inbound_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        inbound = InboundSMS.objects.get(provider_message_id='inbound-001')
        self.assertEqual(inbound.gateway_device, self.device)


# ==============================================================================
# 5. DEVICE PAIRING & CLINIC ARCHITECTURE TESTS (CHUNK 3)
# ==============================================================================

from django.contrib.auth import get_user_model
from apps.clinics.models import Clinic
from apps.gateway.models import DevicePairingSession
from datetime import timedelta

User = get_user_model()


class DevicePairingTests(APITestCase):
    def setUp(self):
        self.clinic1 = Clinic.objects.create(name="Clinic Alpha", email="alpha@test.com")
        self.clinic2 = Clinic.objects.create(name="Clinic Beta", email="beta@test.com")

        self.user1 = User.objects.create_user(
            email="admin@alpha.com",
            password="password123",
            first_name="Admin",
            last_name="Alpha",
            clinic=self.clinic1,
            role="ADMIN",
            roles=["ADMIN"]
        )
        self.user2 = User.objects.create_user(
            email="admin@beta.com",
            password="password123",
            first_name="Admin",
            last_name="Beta",
            clinic=self.clinic2,
            role="ADMIN",
            roles=["ADMIN"]
        )

        self.session_create_url = reverse('gateway:pairing-session-create')
        self.session_cancel_url = reverse('gateway:pairing-session-cancel')
        self.device_pair_url = reverse('gateway:device-pair')
        self.clinic_device_url = reverse('gateway:clinic-device-detail')
        self.disconnect_url = reverse('gateway:clinic-device-disconnect')

    def test_create_pairing_session_requires_auth(self):
        """Unauthenticated user cannot create pairing session -> 401."""
        response = self.client.post(self.session_create_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_pairing_session_success(self):
        """Authenticated clinic admin can create pairing session -> 201 with QR payload & code."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.session_create_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data

        self.assertIn('pairing_token', data)
        self.assertIn('pairing_code', data)
        self.assertTrue(data['pairing_code'].startswith('MAL-'))
        self.assertIn('qr_payload', data)
        self.assertEqual(data['qr_payload']['clinic_id'], self.clinic1.id)
        self.assertEqual(data['qr_payload']['clinic_name'], self.clinic1.name)
        self.assertGreater(data['time_remaining_seconds'], 500)

        # Verify in DB
        session = DevicePairingSession.objects.get(id=data['id'])
        self.assertEqual(session.status, DevicePairingSession.STATUS_PENDING)
        self.assertEqual(session.clinic, self.clinic1)
        self.assertEqual(session.created_by, self.user1)

    def test_pair_device_via_qr_token_success(self):
        """Android app pairs using QR pairing_token -> 200, receives device_token, binds to clinic."""
        # 1. Admin creates session
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(self.session_create_url, {}, format='json')
        token = res.data['pairing_token']
        session_id = res.data['id']

        # 2. Android app calls pair endpoint (unauthenticated)
        self.client.force_authenticate(user=None)
        payload = {
            'pairing_token': token,
            'device_identifier': 'ANDROID-SAMSUNG-A15-01',
            'device_name': 'Samsung Galaxy A15',
            'model_name': 'SM-A155F',
            'android_version': '14',
            'app_version': '1.0.0',
            'sim_carrier': 'Globe Telecom',
            'sim_slot_index': 0,
            'sim_subscription_id': 1,
            'phone_number': '+639171234567',
            'sms_capable': True,
        }
        pair_res = self.client.post(self.device_pair_url, payload, format='json')
        self.assertEqual(pair_res.status_code, status.HTTP_200_OK)
        self.assertTrue(pair_res.data['success'])
        self.assertIn('device_token', pair_res.data)
        self.assertEqual(pair_res.data['clinic_id'], self.clinic1.id)

        # 3. Verify session is now CLAIMED
        session = DevicePairingSession.objects.get(id=session_id)
        self.assertEqual(session.status, DevicePairingSession.STATUS_CLAIMED)
        self.assertIsNotNone(session.claimed_at)
        self.assertIsNotNone(session.claimed_by_device)

        # 4. Verify device record
        device = GatewayDevice.objects.get(device_identifier='ANDROID-SAMSUNG-A15-01')
        self.assertEqual(device.clinic, self.clinic1)
        self.assertEqual(device.sim_carrier, 'Globe Telecom')
        self.assertEqual(device.phone_number, '+639171234567')
        self.assertEqual(device.sms_service_status, 'READY')

    def test_pair_device_via_manual_code_success(self):
        """Android app pairs using manual fallback pairing_code -> 200."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(self.session_create_url, {}, format='json')
        code = res.data['pairing_code']

        self.client.force_authenticate(user=None)
        payload = {
            'pairing_code': code.lower(),  # Verify case-insensitivity
            'device_identifier': 'ANDROID-MANUAL-001',
            'device_name': 'Manual Paired Phone',
            'sim_carrier': 'Smart Communications',
        }
        pair_res = self.client.post(self.device_pair_url, payload, format='json')
        self.assertEqual(pair_res.status_code, status.HTTP_200_OK)

        device = GatewayDevice.objects.get(device_identifier='ANDROID-MANUAL-001')
        self.assertEqual(device.clinic, self.clinic1)
        self.assertEqual(device.sim_carrier, 'Smart Communications')

    def test_pairing_token_one_time_use_prevent_replay(self):
        """Attempting to reuse an already CLAIMED token -> 400."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(self.session_create_url, {}, format='json')
        token = res.data['pairing_token']

        # First claim succeeds
        self.client.force_authenticate(user=None)
        payload = {
            'pairing_token': token,
            'device_identifier': 'DEV-1',
            'device_name': 'Phone 1',
        }
        res1 = self.client.post(self.device_pair_url, payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Second claim with same token fails (replay attack prevention)
        payload2 = {
            'pairing_token': token,
            'device_identifier': 'DEV-2',
            'device_name': 'Phone 2',
        }
        res2 = self.client.post(self.device_pair_url, payload2, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already been used", res2.data['error'])

    def test_pairing_session_expiration(self):
        """Expired pairing session is rejected -> 400."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(self.session_create_url, {}, format='json')
        session_id = res.data['id']
        token = res.data['pairing_token']

        # Artificially expire the session
        session = DevicePairingSession.objects.get(id=session_id)
        session.expires_at = timezone.now() - timedelta(minutes=1)
        session.save()

        self.client.force_authenticate(user=None)
        res_expired = self.client.post(self.device_pair_url, {
            'pairing_token': token,
            'device_identifier': 'DEV-EXPIRED',
            'device_name': 'Late Phone',
        }, format='json')

        self.assertEqual(res_expired.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", res_expired.data['error'].lower())

    def test_single_active_device_per_clinic(self):
        """Pairing a new device deactivates previous device for that clinic."""
        self.client.force_authenticate(user=self.user1)

        # 1. Pair Phone 1
        res1 = self.client.post(self.session_create_url, {}, format='json')
        self.client.force_authenticate(user=None)
        self.client.post(self.device_pair_url, {
            'pairing_token': res1.data['pairing_token'],
            'device_identifier': 'PHONE-ALPHA-1',
            'device_name': 'Old Phone',
        }, format='json')

        phone1 = GatewayDevice.objects.get(device_identifier='PHONE-ALPHA-1')
        self.assertTrue(phone1.is_active)
        self.assertEqual(phone1.status, 'ACTIVE')

        # 2. Pair Phone 2 to same clinic
        self.client.force_authenticate(user=self.user1)
        res2 = self.client.post(self.session_create_url, {}, format='json')
        self.client.force_authenticate(user=None)
        self.client.post(self.device_pair_url, {
            'pairing_token': res2.data['pairing_token'],
            'device_identifier': 'PHONE-ALPHA-2',
            'device_name': 'New Phone',
        }, format='json')

        phone1.refresh_from_db()
        phone2 = GatewayDevice.objects.get(device_identifier='PHONE-ALPHA-2')

        # Phone 1 deactivated, Phone 2 active
        self.assertFalse(phone1.is_active)
        self.assertEqual(phone1.status, 'INACTIVE')
        self.assertTrue(phone2.is_active)
        self.assertEqual(phone2.status, 'ACTIVE')

    def test_disconnect_clinic_device(self):
        """Admin can disconnect/revoke their clinic's device -> 200, sets SUSPENDED, invalidates token."""
        # Pair a device first
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(self.session_create_url, {}, format='json')
        self.client.force_authenticate(user=None)
        pair_res = self.client.post(self.device_pair_url, {
            'pairing_token': res.data['pairing_token'],
            'device_identifier': 'PHONE-REVOKE-01',
            'device_name': 'Revokable Phone',
        }, format='json')
        old_token = pair_res.data['device_token']

        # Disconnect via web dashboard
        self.client.force_authenticate(user=self.user1)
        disc_res = self.client.post(self.disconnect_url, {}, format='json')
        self.assertEqual(disc_res.status_code, status.HTTP_200_OK)

        device = GatewayDevice.objects.get(device_identifier='PHONE-REVOKE-01')
        self.assertFalse(device.is_active)
        self.assertEqual(device.status, 'SUSPENDED')
        self.assertNotEqual(device.device_token, old_token)

    def test_android_qr_handshake_with_hardware_telemetry(self):
        """Chunk 8: Android app sends full hardware telemetry via QR token pairing."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(self.session_create_url, {}, format='json')
        token = res.data['pairing_token']

        self.client.force_authenticate(user=None)
        payload = {
            'pairing_token': token,
            'device_identifier': 'sha256_hardware_fingerprint_001',
            'device_name': 'Front Desk Phone',
            'model_name': 'Samsung SM-A155F',
            'android_version': '14',
            'app_version': '1.0.0',
            'sim_carrier': 'Globe Telecom',
            'sim_slot_index': 0,
            'sim_subscription_id': 1,
            'phone_number': '+639170001122',
            'sms_capable': True,
        }
        pair_res = self.client.post(self.device_pair_url, payload, format='json')
        self.assertEqual(pair_res.status_code, status.HTTP_200_OK)
        self.assertTrue(pair_res.data['success'])
        self.assertIn('device_token', pair_res.data)
        self.assertEqual(pair_res.data['clinic_id'], self.clinic1.id)
        self.assertEqual(pair_res.data['clinic_name'], self.clinic1.name)

        device = GatewayDevice.objects.get(device_identifier='sha256_hardware_fingerprint_001')
        self.assertEqual(device.name, 'Front Desk Phone')
        self.assertEqual(device.model_name, 'Samsung SM-A155F')
        self.assertEqual(device.android_version, '14')
        self.assertEqual(device.sim_carrier, 'Globe Telecom')
        self.assertEqual(device.sim_slot_index, 0)
        self.assertEqual(device.status, 'ACTIVE')
        self.assertTrue(device.is_active)
        self.assertFalse(device.is_legacy)

    def test_android_manual_code_handshake_case_insensitive_and_whitespace(self):
        """Chunk 8: Android app sends manual pairing code with lowercase / whitespace."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(self.session_create_url, {}, format='json')
        code = res.data['pairing_code']

        self.client.force_authenticate(user=None)
        payload = {
            'pairing_code': f"  {code.lower()}  ",
            'device_identifier': 'sha256_hardware_fingerprint_002',
            'device_name': 'Doctor Clinic Phone',
            'model_name': 'Xiaomi Redmi 12',
            'sim_carrier': 'Smart Communications',
        }
        pair_res = self.client.post(self.device_pair_url, payload, format='json')
        self.assertEqual(pair_res.status_code, status.HTTP_200_OK)
        self.assertTrue(pair_res.data['success'])

        device = GatewayDevice.objects.get(device_identifier='sha256_hardware_fingerprint_002')
        self.assertEqual(device.clinic, self.clinic1)
        self.assertEqual(device.sim_carrier, 'Smart Communications')


# ==============================================================================
# 7. CLINIC QUEUE PARTITIONING & ROUTING TESTS (CHUNK 5)
# ==============================================================================

class ClinicQueueRoutingTests(APITestCase):
    """
    Tests ensuring:
    - Clinic A's paired phone only receives Clinic A's SMS.
    - Clinic B's paired phone only receives Clinic B's SMS.
    - Legacy Gateway (BNE-LX1, clinic=None) claims messages for clinics WITHOUT a paired phone, and fallback messages.
    - Strict clinic isolation: No cross-clinic leakage.
    - Inbound SMS is correctly stamped with device.clinic.
    """
    def setUp(self):
        from apps.clinics.models import Clinic
        self.clinic_a = Clinic.objects.create(name='Alpha Health Clinic', phone='+639111111111')
        self.clinic_b = Clinic.objects.create(name='Beta Care Clinic', phone='+639222222222')
        self.clinic_c = Clinic.objects.create(name='Gamma Medical Center', phone='+639333333333')

        # Device Alpha (paired with Clinic Alpha)
        self.device_a = GatewayDevice.objects.create(
            device_identifier='DEVICE-CLINIC-ALPHA',
            name='Alpha Samsung A15',
            clinic=self.clinic_a,
            device_token=GatewayDevice.generate_token(),
            status='ACTIVE',
            is_active=True,
            is_legacy=False
        )
        self.auth_a = f"Bearer {self.device_a.device_token}"

        # Device Beta (paired with Clinic Beta)
        self.device_b = GatewayDevice.objects.create(
            device_identifier='DEVICE-CLINIC-BETA',
            name='Beta Redmi Note',
            clinic=self.clinic_b,
            device_token=GatewayDevice.generate_token(),
            status='ACTIVE',
            is_active=True,
            is_legacy=False
        )
        self.auth_b = f"Bearer {self.device_b.device_token}"

        # Legacy Gateway (Global, clinic=None, is_legacy=True)
        self.legacy_device = GatewayDevice.objects.create(
            device_identifier='LEGACY-PROD-BNE-LX1',
            name='Production Gateway BNE-LX1',
            clinic=None,
            device_token=GatewayDevice.generate_token(),
            status='ACTIVE',
            is_active=True,
            is_legacy=True
        )
        self.auth_legacy = f"Bearer {self.legacy_device.device_token}"

        self.queue_url = reverse('gateway:gateway-queue')
        self.inbound_url = reverse('gateway:webhook-inbound')

    def test_clinic_device_claims_only_own_clinic_messages(self):
        """Device Alpha claims only Alpha SMS; Device Beta claims only Beta SMS."""
        sms_a = SMSMessage.objects.create(
            clinic=self.clinic_a,
            recipient_number='+639011111111',
            body='Hello from Clinic Alpha',
            status=SMSMessage.STATUS_QUEUED
        )
        sms_b = SMSMessage.objects.create(
            clinic=self.clinic_b,
            recipient_number='+639022222222',
            body='Hello from Clinic Beta',
            status=SMSMessage.STATUS_QUEUED
        )

        # Device Alpha polls queue
        res_a = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_a)
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        messages_a = res_a.data['messages']
        self.assertEqual(len(messages_a), 1)
        self.assertEqual(messages_a[0]['id'], str(sms_a.id))
        self.assertEqual(messages_a[0]['body'], 'Hello from Clinic Alpha')

        # Verify state in DB
        sms_a.refresh_from_db()
        self.assertEqual(sms_a.status, SMSMessage.STATUS_SENDING)
        self.assertEqual(sms_a.gateway_device, self.device_a)

        # Device Beta polls queue
        res_b = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_b)
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        messages_b = res_b.data['messages']
        self.assertEqual(len(messages_b), 1)
        self.assertEqual(messages_b[0]['id'], str(sms_b.id))
        self.assertEqual(messages_b[0]['body'], 'Hello from Clinic Beta')

        sms_b.refresh_from_db()
        self.assertEqual(sms_b.status, SMSMessage.STATUS_SENDING)
        self.assertEqual(sms_b.gateway_device, self.device_b)

    def test_legacy_gateway_claims_unpaired_and_global_messages_only(self):
        """Legacy gateway claims messages for Clinic C (unpaired) and global messages, skipping Clinic A & B."""
        sms_a = SMSMessage.objects.create(
            clinic=self.clinic_a,
            recipient_number='+639011111111',
            body='For Alpha with active phone',
            status=SMSMessage.STATUS_QUEUED
        )
        sms_c = SMSMessage.objects.create(
            clinic=self.clinic_c,
            recipient_number='+639033333333',
            body='For Gamma without phone',
            status=SMSMessage.STATUS_QUEUED
        )
        sms_global = SMSMessage.objects.create(
            clinic=None,
            recipient_number='+639099999999',
            body='Global unassigned message',
            status=SMSMessage.STATUS_QUEUED
        )

        res_legacy = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_legacy)
        self.assertEqual(res_legacy.status_code, status.HTTP_200_OK)
        claimed_ids = [m['id'] for m in res_legacy.data['messages']]

        # Must claim Clinic C and Global
        self.assertIn(str(sms_c.id), claimed_ids)
        self.assertIn(str(sms_global.id), claimed_ids)

        # Must NOT claim Clinic A (since Clinic A has active paired phone)
        self.assertNotIn(str(sms_a.id), claimed_ids)

        sms_a.refresh_from_db()
        self.assertEqual(sms_a.status, SMSMessage.STATUS_QUEUED) # Still queued for Device Alpha

    def test_legacy_gateway_fallback_when_device_inactive(self):
        """When Clinic A deactivates/disconnects its phone, legacy gateway steps in as fallback."""
        self.device_a.is_active = False
        self.device_a.status = 'SUSPENDED'
        self.device_a.save()

        sms_a = SMSMessage.objects.create(
            clinic=self.clinic_a,
            recipient_number='+639011111111',
            body='Alpha fallback message',
            status=SMSMessage.STATUS_QUEUED
        )

        res_legacy = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_legacy)
        self.assertEqual(res_legacy.status_code, status.HTTP_200_OK)
        claimed_ids = [m['id'] for m in res_legacy.data['messages']]
        self.assertIn(str(sms_a.id), claimed_ids)

        sms_a.refresh_from_db()
        self.assertEqual(sms_a.status, SMSMessage.STATUS_SENDING)
        self.assertEqual(sms_a.gateway_device, self.legacy_device)

    def test_inbound_sms_associated_with_device_clinic(self):
        """Inbound SMS received by Device Alpha is stamped with Clinic Alpha."""
        from apps.smsgateway.models import InboundSMS
        res = self.client.post(self.inbound_url, {
            'message_id': 'inbound-alpha-001',
            'sender': '+639123456789',
            'recipient': '+639111111111',
            'message': 'Confirming my appointment tomorrow',
        }, format='json', HTTP_AUTHORIZATION=self.auth_a)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        inbound = InboundSMS.objects.get(provider_message_id='inbound-alpha-001')
        self.assertEqual(inbound.clinic, self.clinic_a)
        self.assertEqual(inbound.gateway_device, self.device_a)


# ==============================================================================
# 8. COMMUNICATION LOG SYNCHRONIZATION TESTS (CHUNK 6)
# ==============================================================================

class CommunicationLogSyncTests(APITestCase):
    def setUp(self):
        from apps.clinics.models import Clinic
        self.clinic = Clinic.objects.create(name='Sync Clinic', phone='+639111111111')
        self.device = GatewayDevice.objects.create(
            device_identifier='SYNC-DEVICE-01',
            name='Sync Samsung A15',
            model_name='SM-A155F',
            sim_carrier='Globe Telecom',
            clinic=self.clinic,
            device_token=GatewayDevice.generate_token(),
            status='ACTIVE',
            is_active=True,
        )
        self.auth_header = f"Bearer {self.device.device_token}"
        self.queue_url = reverse('gateway:gateway-queue')
        self.delivery_url = reverse('gateway:webhook-delivery')

    def test_queue_claim_enriches_communication_log(self):
        """Claiming a queued message populates CommunicationLog with gateway device metadata."""
        from apps.notifications.models import CommunicationLog
        sms = SMSMessage.objects.create(
            clinic=self.clinic,
            recipient_number='+639123456789',
            body='Reminder test',
            status=SMSMessage.STATUS_QUEUED,
        )
        log = CommunicationLog.objects.create(
            clinic=self.clinic,
            comm_type='APPOINTMENT_REMINDER',
            channel='SMS',
            status='QUEUED',
            recipient='+639123456789',
            subject='SMS Reminder',
            message_id=str(sms.id),
        )

        res = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        log.refresh_from_db()
        self.assertEqual(log.status, 'SENT')
        self.assertIsNotNone(log.event_metadata.get('gateway_device'))
        self.assertEqual(log.event_metadata['gateway_device']['name'], 'Sync Samsung A15')
        self.assertEqual(log.event_metadata['gateway_device']['sim_carrier'], 'Globe Telecom')

    def test_delivery_webhook_updates_communication_log_to_delivered(self):
        """Delivered receipt updates CommunicationLog status and sets delivered_at."""
        from apps.notifications.models import CommunicationLog
        sms = SMSMessage.objects.create(
            clinic=self.clinic,
            recipient_number='+639123456789',
            body='Reminder test',
            status=SMSMessage.STATUS_SENDING,
            gateway_device=self.device,
        )
        log = CommunicationLog.objects.create(
            clinic=self.clinic,
            comm_type='APPOINTMENT_REMINDER',
            channel='SMS',
            status='SENT',
            recipient='+639123456789',
            message_id=str(sms.id),
        )

        payload = {
            'message_id': str(sms.id),
            'status': 'DELIVERED',
            'event_id': 'evt_deliv_1',
            'delivered_at': '2026-09-13T10:00:00Z',
        }
        res = self.client.post(self.delivery_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        log.refresh_from_db()
        self.assertEqual(log.status, 'DELIVERED')
        self.assertIsNotNone(log.delivered_at)
        self.assertEqual(log.event_metadata['gateway_device']['name'], 'Sync Samsung A15')

    def test_delivery_webhook_updates_communication_log_to_failed(self):
        """Failed receipt updates CommunicationLog status and sets error message."""
        from apps.notifications.models import CommunicationLog
        sms = SMSMessage.objects.create(
            clinic=self.clinic,
            recipient_number='+639123456789',
            body='Reminder test',
            status=SMSMessage.STATUS_SENDING,
            gateway_device=self.device,
        )
        log = CommunicationLog.objects.create(
            clinic=self.clinic,
            comm_type='APPOINTMENT_REMINDER',
            channel='SMS',
            status='SENT',
            recipient='+639123456789',
            message_id=str(sms.id),
        )

        payload = {
            'message_id': str(sms.id),
            'status': 'FAILED',
            'event_id': 'evt_fail_1',
            'description': 'SIM card out of load',
            'error_code': 'CARRIER_GENERIC_FAILURE',
        }
        res = self.client.post(self.delivery_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        log.refresh_from_db()
        self.assertEqual(log.status, 'FAILED')
        self.assertIn('SIM card out of load', log.error_message)
        self.assertEqual(log.event_metadata['carrier_error_code'], 'CARRIER_GENERIC_FAILURE')


# ==============================================================================
# 9. INBOUND REPLY & APPOINTMENT PROCESSING TESTS (CHUNK 10)
# ==============================================================================

class InboundReplyRoutingTests(APITestCase):
    """
    Tests ensuring:
    - Android gateway forwards incoming patient SMS replies via POST /api/gateway/webhooks/inbound/
    - "Y" / "YES" replies automatically confirm upcoming scheduled appointments.
    - "N" / "NO" replies automatically cancel upcoming scheduled appointments and set cancelled_at.
    - Arbitrary text replies are recorded as PATIENT_RESPONSE CommunicationLogs without altering appointment status.
    - Multi-format phone numbers (+639..., 09...) match patients reliably.
    - Missing recipient in payload gracefully falls back to device phone / name.
    """
    def setUp(self):
        from apps.clinics.models import Clinic, Practitioner
        from apps.patients.models import Patient
        from apps.appointments.models import Appointment

        self.clinic = Clinic.objects.create(name='Malasakit Health Clinic', phone='+639111222333')
        self.device = GatewayDevice.objects.create(
            device_identifier='DEVICE-INBOUND-TEST',
            name='Clinic Front Desk Phone',
            phone_number='+639111222333',
            sim_carrier='Smart Communications',
            clinic=self.clinic,
            device_token=GatewayDevice.generate_token(),
            status='ACTIVE',
            is_active=True,
        )
        self.auth_header = f"Bearer {self.device.device_token}"
        self.inbound_url = reverse('gateway:webhook-inbound')

        # Create practitioner & patient
        self.user = User.objects.create_user(
            email='doc.inbound@test.com',
            password='password123',
            first_name='Dr. Maria',
            last_name='Santos',
            clinic=self.clinic,
            role='PRACTITIONER'
        )
        self.practitioner = Practitioner.objects.create(user=self.user, clinic=self.clinic)
        self.patient = Patient.objects.create(
            first_name='Juan',
            last_name='Dela Cruz',
            date_of_birth='1992-05-15',
            clinic=self.clinic,
            phone='+639171234567'
        )

        # Scheduled appointment for tomorrow
        tomorrow = timezone.now().date() + timedelta(days=1)
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            clinic=self.clinic,
            practitioner=self.practitioner,
            date=tomorrow,
            start_time='09:00:00',
            end_time='09:30:00',
            status='SCHEDULED'
        )

    def test_inbound_confirmation_yes_confirms_appointment(self):
        """Inbound 'YES' reply confirms upcoming appointment and logs PATIENT_RESPONSE."""
        from apps.notifications.models import CommunicationLog
        payload = {
            'message_id': 'inbound-yes-001',
            'sender': '+639171234567',
            'recipient': '+639111222333',
            'message': 'YES',
        }
        res = self.client.post(self.inbound_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # InboundSMS saved and marked processed
        inbound = InboundSMS.objects.get(provider_message_id='inbound-yes-001')
        self.assertEqual(inbound.processed_status, 'PROCESSED')
        self.assertEqual(inbound.gateway_device, self.device)
        self.assertEqual(inbound.clinic, self.clinic)

        # Appointment transitioned to CONFIRMED
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'CONFIRMED')

        # CommunicationLog created with PATIENT_RESPONSE & patient_reply=CONFIRM
        log = CommunicationLog.objects.filter(
            patient=self.patient,
            comm_type='PATIENT_RESPONSE'
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.patient_reply, 'CONFIRM')
        self.assertEqual(log.appointment, self.appointment)
        self.assertEqual(log.direction, 'INBOUND')
        self.assertEqual(log.status, 'DELIVERED')
        self.assertEqual(log.event_metadata['gateway_device']['name'], 'Clinic Front Desk Phone')

    def test_inbound_cancellation_no_queues_options_and_keeps_scheduled(self):
        """Inbound 'NO' reply keeps appointment SCHEDULED, sets confirmation_status=DECLINED, and queues options SMS."""
        from apps.notifications.models import CommunicationLog
        from apps.appointments.models import AppointmentCancelToken, RebookingLink
        from apps.smsgateway.models import SMSMessage

        payload_exact_no = {
            'message_id': 'inbound-no-002',
            'sender': '+639171234567',
            'recipient': '+639111222333',
            'message': 'NO',
        }
        res2 = self.client.post(self.inbound_url, payload_exact_no, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        self.appointment.refresh_from_db()
        # Appointment remains SCHEDULED (not cancelled immediately)
        self.assertEqual(self.appointment.status, 'SCHEDULED')
        self.assertEqual(self.appointment.confirmation_status, 'DECLINED')
        self.assertEqual(self.appointment.patient_reply, 'N')
        self.assertIsNotNone(self.appointment.patient_reply_at)

        # Inbound log recorded
        log = CommunicationLog.objects.filter(
            patient=self.patient,
            patient_reply='CANCEL'
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.appointment, self.appointment)

        # Options SMS queued
        options_sms = SMSMessage.objects.filter(recipient_number='+639171234567').order_by('-created_at').first()
        self.assertIsNotNone(options_sms)
        self.assertIn('/rebook/', options_sms.body)
        self.assertIn('/cancel/', options_sms.body)

        # Rebook and cancel tokens created
        self.assertTrue(RebookingLink.objects.filter(appointment=self.appointment, is_used=False).exists())
        self.assertTrue(AppointmentCancelToken.objects.filter(appointment=self.appointment, is_used=False).exists())

    def test_inbound_duplicate_yes_idempotent(self):
        """Duplicate YES messages do not cause redundant confirmation SMS messages."""
        from apps.smsgateway.models import SMSMessage

        # First YES
        res1 = self.client.post(self.inbound_url, {
            'message_id': 'inbound-dup-yes-1',
            'sender': '+639171234567',
            'recipient': '+639111222333',
            'message': 'YES',
        }, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        count_first = SMSMessage.objects.filter(recipient_number='+639171234567').count()

        # Second YES
        res2 = self.client.post(self.inbound_url, {
            'message_id': 'inbound-dup-yes-2',
            'sender': '+639171234567',
            'recipient': '+639111222333',
            'message': 'YES',
        }, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        count_second = SMSMessage.objects.filter(recipient_number='+639171234567').count()

        self.assertEqual(count_first, count_second)

    def test_public_cancel_with_declined_status_and_dispatches_sms(self):
        """A patient who replied NO (status=SCHEDULED, confirmation_status=DECLINED) can cancel via web link and receives SMS."""
        from apps.appointments.models import AppointmentCancelToken
        from apps.smsgateway.models import SMSMessage
        self.appointment.confirmation_status = 'DECLINED'
        self.appointment.patient_reply = 'N'
        self.appointment.save()

        token = AppointmentCancelToken.objects.create(appointment=self.appointment)
        cancel_url = reverse('public-cancel-email', kwargs={'token': str(token.token)})

        # GET details succeeds
        get_res = self.client.get(cancel_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)

        # POST cancel succeeds
        post_res = self.client.post(cancel_url)
        self.assertEqual(post_res.status_code, status.HTTP_200_OK)

        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'CANCELLED')

        # Cancellation confirmation SMS queued
        cancel_sms = SMSMessage.objects.filter(clinic=self.clinic, recipient_number='+639171234567').order_by('-created_at').first()
        self.assertIsNotNone(cancel_sms)
        self.assertIn('successfully cancelled', cancel_sms.body)

    def test_public_rebook_creates_new_cancels_old_and_dispatches_sms(self):
        """Rebooking creates new appointment, cancels original, and dispatches reschedule SMS."""
        from apps.appointments.models import RebookingLink, Appointment
        from apps.smsgateway.models import SMSMessage
        from datetime import timedelta

        rebook_link = RebookingLink.objects.create(patient=self.patient, appointment=self.appointment)
        rebook_url = reverse('public-rebooking', kwargs={'token': str(rebook_link.token)})

        # GET rebook details
        get_res = self.client.get(rebook_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)

        # POST rebook to a new slot
        new_slot_date = (timezone.now() + timedelta(days=5)).date()
        post_payload = {
            'date': str(new_slot_date),
            'start_time': '14:00',
            'end_time': '14:30',
        }
        post_res = self.client.post(rebook_url, post_payload, format='json')
        self.assertEqual(post_res.status_code, status.HTTP_201_CREATED)

        # Original appointment is cancelled
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'CANCELLED')
        self.assertIn('Rescheduled to', self.appointment.cancellation_reason)

        # New appointment exists and is SCHEDULED
        new_appt_id = post_res.data['appointment_id']
        new_appt = Appointment.objects.get(id=new_appt_id)
        self.assertEqual(new_appt.status, 'SCHEDULED')
        self.assertEqual(str(new_appt.date), str(new_slot_date))

        # Rebooking confirmation SMS queued
        rebook_sms = SMSMessage.objects.filter(clinic=self.clinic, recipient_number='+639171234567').order_by('-created_at').first()
        self.assertIsNotNone(rebook_sms)
        self.assertIn('successfully rescheduled', rebook_sms.body)

    def test_inbound_arbitrary_reply_logged_without_changing_appointment(self):
        """Non-Y/N reply is logged to CommunicationLog while appointment remains SCHEDULED."""
        from apps.notifications.models import CommunicationLog
        payload = {
            'message_id': 'inbound-question-001',
            'sender': '+639171234567',
            'recipient': '+639111222333',
            'message': 'Do I need to fast before the blood test?',
        }
        res = self.client.post(self.inbound_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'SCHEDULED') # Not altered

        log = CommunicationLog.objects.filter(
            patient=self.patient,
            comm_type='PATIENT_RESPONSE'
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.patient_reply, '')
        self.assertIn('blood test', log.full_body)
        self.assertEqual(log.appointment, self.appointment)

    def test_inbound_resilient_missing_recipient_fallback(self):
        """Android device omitting recipient in JSON payload succeeds with device phone fallback."""
        payload = {
            'message_id': 'inbound-fallback-001',
            'sender': '+639171234567',
            'message': 'YES',
            # 'recipient' deliberately omitted
        }
        res = self.client.post(self.inbound_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        inbound = InboundSMS.objects.get(provider_message_id='inbound-fallback-001')
        self.assertEqual(inbound.recipient_number, self.device.phone_number)
        self.assertEqual(inbound.processed_status, 'PROCESSED')

    def test_inbound_national_phone_matching(self):
        """Patient stored with national format 09171234567 matches E.164 incoming SMS."""
        from apps.patients.models import Patient
        from apps.appointments.models import Appointment
        patient_nat = Patient.objects.create(
            first_name='Pedro',
            last_name='Penduko',
            date_of_birth='1988-08-08',
            clinic=self.clinic,
            phone='09187654321' # local 09... format
        )
        appt_nat = Appointment.objects.create(
            patient=patient_nat,
            clinic=self.clinic,
            date=timezone.now().date() + timedelta(days=2),
            start_time='14:00:00',
            end_time='14:30:00',
            status='SCHEDULED'
        )

        payload = {
            'message_id': 'inbound-nat-001',
            'sender': '+639187654321', # E.164 incoming format
            'message': 'Y',
        }
        res = self.client.post(self.inbound_url, payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        appt_nat.refresh_from_db()
        self.assertEqual(appt_nat.status, 'CONFIRMED')


# ==============================================================================
# 10. END-TO-END GATEWAY SYSTEM & REGRESSION AUDIT (CHUNK 12)
# ==============================================================================

class EndToEndGatewaySystemTests(APITestCase):
    """
    Comprehensive End-to-End System Test verifying the complete 10-step lifecycle:
    1. Web Dashboard creates pairing session (generates QR payload & MAL-XXXX code).
    2. Android Clinic App scans QR code and completes cryptographic handshake.
    3. Device reports telemetry heartbeat (battery, charging, network, SIM carrier).
    4. Web Dashboard retrieves real-time clinic device status & health metrics.
    5. PMS schedules appointment reminder (creates QUEUED SMS and CommunicationLog).
    6. Android device claims queued message atomically (transitions to SENDING).
    7. Android device reports delivery receipt webhook (transitions to DELIVERED).
    8. Patient replies "YES" via SMS (Android forwards inbound SMS webhook).
    9. Backend confirms appointment and logs PATIENT_RESPONSE CommunicationLog.
    10. Web Dashboard disconnects device (revokes token, suspends device).
    11. Coexistence Audit: Legacy Gateway (BNE-LX1) continues unimpeded.
    """
    def setUp(self):
        from apps.clinics.models import Clinic, Practitioner
        from apps.patients.models import Patient
        from apps.appointments.models import Appointment

        # Primary Clinic for Decentralized Gateway testing
        self.clinic = Clinic.objects.create(name='San Pedro Medical Clinic', phone='+639171112222')
        self.admin_user = User.objects.create_user(
            email='admin@sanpedro.com',
            password='password123',
            first_name='Admin',
            last_name='San Pedro',
            clinic=self.clinic,
            role='ADMIN',
            roles=['ADMIN']
        )
        self.practitioner_user = User.objects.create_user(
            email='dr.reyes@sanpedro.com',
            password='password123',
            first_name='Dr. Roberto',
            last_name='Reyes',
            clinic=self.clinic,
            role='PRACTITIONER'
        )
        self.practitioner = Practitioner.objects.create(user=self.practitioner_user, clinic=self.clinic)

        self.patient = Patient.objects.create(
            first_name='Maria',
            last_name='Clara',
            date_of_birth='1995-03-20',
            clinic=self.clinic,
            phone='+639189998888'
        )

        # Legacy Gateway Device (Production BNE-LX1, clinic=None, is_legacy=True)
        self.legacy_gateway = GatewayDevice.objects.create(
            device_identifier='LEGACY-PROD-BNE-LX1',
            name='Production Gateway BNE-LX1',
            clinic=None,
            is_legacy=True,
            status='ACTIVE',
            is_active=True,
            device_token=GatewayDevice.generate_token()
        )
        self.legacy_auth = f"Bearer {self.legacy_gateway.device_token}"

        # Endpoints
        self.session_create_url = reverse('gateway:pairing-session-create')
        self.session_status_url = lambda sid: reverse('gateway:pairing-session-status', kwargs={'session_id': sid})
        self.device_pair_url = reverse('gateway:device-pair')
        self.clinic_device_url = reverse('gateway:clinic-device-detail')
        self.heartbeat_url = reverse('gateway:device-heartbeat')
        self.queue_url = reverse('gateway:gateway-queue')
        self.delivery_url = reverse('gateway:webhook-delivery')
        self.inbound_url = reverse('gateway:webhook-inbound')
        self.disconnect_url = reverse('gateway:clinic-device-disconnect')

    def test_full_decentralized_gateway_lifecycle_e2e(self):
        """Execute complete end-to-end flow from pairing to SMS dispatch, delivery, and inbound reply."""
        from apps.notifications.models import CommunicationLog
        from apps.appointments.models import Appointment

        # ----------------------------------------------------------------------
        # Step 1: Web Dashboard creates pairing session (authenticated admin)
        # ----------------------------------------------------------------------
        self.client.force_authenticate(user=self.admin_user)
        res_session = self.client.post(self.session_create_url, {}, format='json')
        self.assertEqual(res_session.status_code, status.HTTP_201_CREATED)
        session_id = res_session.data['id']
        pairing_token = res_session.data['pairing_token']
        pairing_code = res_session.data['pairing_code']

        self.assertIn('qr_payload', res_session.data)
        self.assertEqual(res_session.data['qr_payload']['clinic_id'], self.clinic.id)

        # ----------------------------------------------------------------------
        # Step 2: Android App scans QR payload and completes pairing handshake
        # ----------------------------------------------------------------------
        self.client.force_authenticate(user=None) # Android app unauthenticated during pairing
        pair_payload = {
            'pairing_token': pairing_token,
            'device_identifier': 'HW-FINGERPRINT-SAMSUNG-A15-001',
            'device_name': 'San Pedro Front Desk A15',
            'model_name': 'Samsung Galaxy A15',
            'android_version': '14',
            'app_version': '1.0.0',
            'sim_carrier': 'Globe Telecom',
            'sim_carrier_2': 'Smart Communications',
            'sim_slot_index': 0,
            'phone_number': '+639171112222',
            'sms_capable': True,
        }
        res_pair = self.client.post(self.device_pair_url, pair_payload, format='json')
        self.assertEqual(res_pair.status_code, status.HTTP_200_OK)
        self.assertTrue(res_pair.data['success'])
        device_token = res_pair.data['device_token']
        device_id = res_pair.data['device_id']
        android_auth = f"Bearer {device_token}"

        # Verify session is now CLAIMED on web dashboard polling
        self.client.force_authenticate(user=self.admin_user)
        res_status = self.client.get(self.session_status_url(session_id))
        self.assertEqual(res_status.status_code, status.HTTP_200_OK)
        self.assertTrue(res_status.data['is_claimed'])

        # ----------------------------------------------------------------------
        # Step 3: Android App sends telemetry heartbeat
        # ----------------------------------------------------------------------
        self.client.force_authenticate(user=None)
        heartbeat_payload = {
            'battery_level': 92,
            'is_charging': True,
            'network_type': 'WIFI',
            'sim_carrier': 'Globe Telecom',
            'sim_carrier_2': 'Smart Communications',
            'signal_strength': 4,
            'app_version': '1.0.0',
        }
        res_heartbeat = self.client.post(self.heartbeat_url, heartbeat_payload, format='json', HTTP_AUTHORIZATION=android_auth)
        self.assertEqual(res_heartbeat.status_code, status.HTTP_200_OK)
        self.assertEqual(res_heartbeat.data['sms_service_status'], 'READY')
        self.assertEqual(res_heartbeat.data['device_status'], 'ACTIVE')

        # ----------------------------------------------------------------------
        # Step 4: Web Dashboard retrieves clinic device telemetry
        # ----------------------------------------------------------------------
        self.client.force_authenticate(user=self.admin_user)
        res_device = self.client.get(self.clinic_device_url)
        self.assertEqual(res_device.status_code, status.HTTP_200_OK)
        self.assertTrue(res_device.data['has_device'])
        device_info = res_device.data['device']
        self.assertEqual(device_info['name'], 'San Pedro Front Desk A15')
        self.assertEqual(device_info['battery_level'], 92)
        self.assertTrue(device_info['is_charging'])
        self.assertEqual(device_info['network_type'], 'WIFI')
        self.assertEqual(device_info['sim_carrier'], 'Globe Telecom')
        self.assertEqual(device_info['sim_carrier_2'], 'Smart Communications')
        self.assertEqual(device_info['sms_service_status'], 'READY')

        # ----------------------------------------------------------------------
        # Step 5: PMS creates scheduled appointment and enqueues reminder SMS
        # ----------------------------------------------------------------------
        tomorrow = timezone.now().date() + timedelta(days=1)
        appointment = Appointment.objects.create(
            patient=self.patient,
            clinic=self.clinic,
            practitioner=self.practitioner,
            date=tomorrow,
            start_time='10:00:00',
            end_time='10:30:00',
            status='SCHEDULED'
        )

        sms_msg = SMSMessage.objects.create(
            clinic=self.clinic,
            recipient_number=self.patient.phone,
            body='Hello Maria, reminder for your appointment tomorrow at 10:00 AM. Reply YES to confirm or NO to cancel.',
            status=SMSMessage.STATUS_QUEUED
        )
        comm_log = CommunicationLog.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            appointment=appointment,
            practitioner=self.practitioner,
            comm_type='APPOINTMENT_REMINDER',
            channel='SMS',
            direction='OUTBOUND',
            status='QUEUED',
            recipient=self.patient.phone,
            subject='Appointment Reminder',
            body_preview=sms_msg.body[:100],
            full_body=sms_msg.body,
            message_id=str(sms_msg.id)
        )

        # ----------------------------------------------------------------------
        # Step 6: Android App claims message from queue
        # ----------------------------------------------------------------------
        self.client.force_authenticate(user=None)
        res_queue = self.client.get(self.queue_url, HTTP_AUTHORIZATION=android_auth)
        self.assertEqual(res_queue.status_code, status.HTTP_200_OK)
        claimed_messages = res_queue.data['messages']
        self.assertEqual(len(claimed_messages), 1)
        self.assertEqual(claimed_messages[0]['id'], str(sms_msg.id))

        sms_msg.refresh_from_db()
        self.assertEqual(sms_msg.status, SMSMessage.STATUS_SENDING)
        self.assertEqual(sms_msg.gateway_device.id, uuid.UUID(device_id))

        comm_log.refresh_from_db()
        self.assertEqual(comm_log.status, 'SENT')
        self.assertEqual(comm_log.event_metadata['gateway_device']['name'], 'San Pedro Front Desk A15')

        # ----------------------------------------------------------------------
        # Step 7: Android App reports delivery receipt webhook
        # ----------------------------------------------------------------------
        delivery_payload = {
            'message_id': str(sms_msg.id),
            'status': 'DELIVERED',
            'event_id': 'evt_e2e_deliv_001',
            'delivered_at': timezone.now().isoformat()
        }
        res_deliv = self.client.post(self.delivery_url, delivery_payload, format='json', HTTP_AUTHORIZATION=android_auth)
        self.assertEqual(res_deliv.status_code, status.HTTP_200_OK)

        sms_msg.refresh_from_db()
        self.assertEqual(sms_msg.status, SMSMessage.STATUS_DELIVERED)
        self.assertIsNotNone(sms_msg.delivered_at)

        comm_log.refresh_from_db()
        self.assertEqual(comm_log.status, 'DELIVERED')
        self.assertIsNotNone(comm_log.delivered_at)

        # ----------------------------------------------------------------------
        # Step 8: Patient replies "YES" and Android forwards inbound SMS webhook
        # ----------------------------------------------------------------------
        inbound_payload = {
            'message_id': 'inbound_reply_e2e_001',
            'sender': self.patient.phone,
            'recipient': '+639171112222',
            'message': 'YES',
        }
        res_inbound = self.client.post(self.inbound_url, inbound_payload, format='json', HTTP_AUTHORIZATION=android_auth)
        self.assertEqual(res_inbound.status_code, status.HTTP_200_OK)

        # Appointment transitioned to CONFIRMED
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'CONFIRMED')

        # InboundSMS recorded and processed
        inbound_sms = InboundSMS.objects.get(provider_message_id='inbound_reply_e2e_001')
        self.assertEqual(inbound_sms.processed_status, 'PROCESSED')
        self.assertEqual(inbound_sms.clinic, self.clinic)

        # Patient response communication log recorded
        response_log = CommunicationLog.objects.filter(
            patient=self.patient,
            comm_type='PATIENT_RESPONSE'
        ).first()
        self.assertIsNotNone(response_log)
        self.assertEqual(response_log.patient_reply, 'CONFIRM')
        self.assertEqual(response_log.direction, 'INBOUND')
        self.assertEqual(response_log.status, 'DELIVERED')
        self.assertEqual(response_log.event_metadata['gateway_device']['name'], 'San Pedro Front Desk A15')

        # ----------------------------------------------------------------------
        # Step 9: Web Dashboard disconnects device
        # ----------------------------------------------------------------------
        self.client.force_authenticate(user=self.admin_user)
        res_disc = self.client.post(self.disconnect_url, {}, format='json')
        self.assertEqual(res_disc.status_code, status.HTTP_200_OK)

        device_record = GatewayDevice.objects.get(id=device_id)
        self.assertFalse(device_record.is_active)
        self.assertEqual(device_record.status, 'SUSPENDED')

        # Old device token is revoked and cannot access queue (invalid token returns 401 Unauthorized)
        self.client.force_authenticate(user=None)
        res_unauth = self.client.get(self.queue_url, HTTP_AUTHORIZATION=android_auth)
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # ----------------------------------------------------------------------
        # Step 10: Legacy Gateway (Production BNE-LX1) Coexistence Audit
        # ----------------------------------------------------------------------
        # Create unassigned global message
        global_msg = SMSMessage.objects.create(
            clinic=None,
            recipient_number='+639085608811',
            body='Global notification for legacy gateway',
            status=SMSMessage.STATUS_QUEUED
        )
        res_legacy = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.legacy_auth)
        self.assertEqual(res_legacy.status_code, status.HTTP_200_OK)
        legacy_claimed = [m['id'] for m in res_legacy.data['messages']]
        self.assertIn(str(global_msg.id), legacy_claimed)

        global_msg.refresh_from_db()
        self.assertEqual(global_msg.status, SMSMessage.STATUS_SENDING)
        self.assertEqual(global_msg.gateway_device, self.legacy_gateway)


class GatewayApkDownloadTests(APITestCase):
    """
    Tests for APK metadata info and direct binary download endpoints.
    """
    def setUp(self):
        self.apk_info_url = reverse('gateway:apk-info')
        self.download_apk_url = reverse('gateway:download-apk')

    def test_apk_info_returns_metadata_and_download_url(self):
        res = self.client.get(self.apk_info_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('download_url', res.data)
        self.assertIn('version', res.data)
        self.assertEqual(res.data['app_name'], 'Malasakit Clinic App')
        self.assertEqual(res.data['package_name'], 'com.malasakit.clinic')
        self.assertEqual(res.data['filename'], 'MalasakitGateway.apk')
        self.assertTrue(res.data['available'])
        self.assertGreater(res.data['size_bytes'], 0)

    def test_download_apk_serves_binary(self):
        res = self.client.get(self.download_apk_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.headers.get('Content-Type'), 'application/vnd.android.package-archive')
        self.assertIn('attachment; filename="MalasakitGateway.apk"', res.headers.get('Content-Disposition', ''))
        self.assertGreater(int(res.headers.get('Content-Length', 0)), 0)


class CommunicationLogMonitoringTests(APITestCase):
    """
    Comprehensive tests ensuring that all SMS messages sent (reminders, confirmations,
    options notices, direct messages) and client responses (YES, NO, inquiries) are
    accurately logged, updated, and monitored in CommunicationLog.
    """
    def setUp(self):
        from apps.clinics.models import Clinic, Practitioner
        from apps.patients.models import Patient
        from apps.appointments.models import Appointment
        from apps.accounts.models import User
        from apps.gateway.models import GatewayDevice
        from datetime import timedelta, time
        from django.utils import timezone

        self.clinic = Clinic.objects.create(
            name='Malasakit Monitoring Clinic',
            email='clinic@monitoring.com',
            phone='+639171234567',
            sms_notifications_enabled=True,
        )
        self.staff_user = User.objects.create_user(
            email='staff@monitoring.com',
            password='StaffPassword123!',
            clinic=self.clinic,
            role='STAFF',
            is_active=True,
        )
        self.device = GatewayDevice.objects.create(
            clinic=self.clinic,
            name='Monitoring Gateway Phone',
            device_identifier='HW-MONITOR-001',
            device_token='token-monitor-001',
            phone_number='+639111222333',
            sim_carrier='Globe Telecom',
            is_active=True,
            status='ACTIVE',
        )
        self.auth_header = 'Bearer token-monitor-001'

        self.patient = Patient.objects.create(
            clinic=self.clinic,
            first_name='Maria',
            last_name='Santos',
            date_of_birth='1995-03-20',
            gender='F',
            email='maria.santos@example.com',
            phone='+639178889999',
            sms_notifications_enabled=True,
        )

        tomorrow = (timezone.now() + timedelta(days=1)).date()
        self.appointment = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            date=tomorrow,
            start_time=time(10, 0),
            end_time=time(10, 30),
            status='SCHEDULED',
        )

        self.queue_url = reverse('gateway:gateway-queue')
        self.delivery_url = reverse('gateway:webhook-delivery')
        self.inbound_url = reverse('gateway:webhook-inbound')
        self.comm_logs_url = reverse('communication-log-list')

    def test_outbound_sms_reminder_logged_and_monitored(self):
        """Outbound reminder SMS is logged with QUEUED status and OUTBOUND direction."""
        from apps.appointments.sms_service import send_appointment_reminder_sms
        from apps.notifications.models import CommunicationLog
        from apps.smsgateway.models import SMSMessage

        success, err = send_appointment_reminder_sms(self.appointment)
        self.assertTrue(success, f"Reminder SMS failed: {err}")

        # SMSMessage queued
        sms = SMSMessage.objects.filter(clinic=self.clinic, recipient_number='+639178889999').first()
        self.assertIsNotNone(sms)
        self.assertEqual(sms.status, SMSMessage.STATUS_QUEUED)

        # CommunicationLog queued
        log = CommunicationLog.objects.filter(
            appointment=self.appointment,
            comm_type='APPOINTMENT_REMINDER'
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.direction, 'OUTBOUND')
        self.assertEqual(log.channel, 'SMS')
        self.assertEqual(log.status, 'QUEUED')
        self.assertEqual(log.patient, self.patient)
        self.assertEqual(log.message_id, str(sms.id))
        self.assertIn('Reply YES to confirm or NO', log.body_preview)

    def test_gateway_pickup_and_delivery_receipt_synchronization(self):
        """Gateway polling transitions log to SENT; delivery receipt transitions log to DELIVERED."""
        from apps.appointments.sms_service import send_appointment_reminder_sms
        from apps.notifications.models import CommunicationLog
        from apps.smsgateway.models import SMSMessage

        send_appointment_reminder_sms(self.appointment)
        sms = SMSMessage.objects.filter(clinic=self.clinic, recipient_number='+639178889999').first()
        log = CommunicationLog.objects.get(message_id=str(sms.id))
        self.assertEqual(log.status, 'QUEUED')

        # 1. Gateway pickup (queue claim)
        res_queue = self.client.get(self.queue_url, HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res_queue.status_code, status.HTTP_200_OK)
        log.refresh_from_db()
        self.assertEqual(log.status, 'SENT')
        self.assertEqual(log.event_metadata['gateway_device']['identifier'], 'HW-MONITOR-001')

        # 2. Gateway delivery report
        delivery_payload = {
            'message_id': str(sms.id),
            'status': 'DELIVERED',
            'delivered_at': '2026-09-24T12:00:00Z',
        }
        res_del = self.client.post(self.delivery_url, delivery_payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res_del.status_code, status.HTTP_200_OK)
        log.refresh_from_db()
        self.assertEqual(log.status, 'DELIVERED')
        self.assertIsNotNone(log.delivered_at)

    def test_inbound_patient_reply_yes_logged_and_monitored(self):
        """Inbound YES updates original reminder to REPLIED, logs PATIENT_RESPONSE, and logs BOOKING_CONFIRMATION."""
        from apps.appointments.sms_service import send_appointment_reminder_sms
        from apps.notifications.models import CommunicationLog

        send_appointment_reminder_sms(self.appointment)

        inbound_payload = {
            'message_id': 'inbound-msg-yes-123',
            'sender': '+639178889999',
            'recipient': '+639111222333',
            'message': 'YES',
        }
        res = self.client.post(self.inbound_url, inbound_payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Inbound reply log
        inbound_log = CommunicationLog.objects.filter(
            patient=self.patient,
            comm_type='PATIENT_RESPONSE'
        ).first()
        self.assertIsNotNone(inbound_log)
        self.assertEqual(inbound_log.direction, 'INBOUND')
        self.assertEqual(inbound_log.patient_reply, 'CONFIRM')
        self.assertEqual(inbound_log.full_body, 'YES')

        # Original reminder log updated to REPLIED
        reminder_log = CommunicationLog.objects.filter(
            appointment=self.appointment,
            comm_type='APPOINTMENT_REMINDER'
        ).first()
        self.assertEqual(reminder_log.status, 'REPLIED')
        self.assertEqual(reminder_log.patient_reply, 'CONFIRM')
        self.assertIsNotNone(reminder_log.replied_at)

        # Appointment confirmed
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'CONFIRMED')
        self.assertEqual(self.appointment.confirmation_status, 'CONFIRMED')

        # Outbound confirmation SMS logged
        conf_log = CommunicationLog.objects.filter(
            appointment=self.appointment,
            comm_type='BOOKING_CONFIRMATION'
        ).first()
        self.assertIsNotNone(conf_log)
        self.assertEqual(conf_log.direction, 'OUTBOUND')
        self.assertIn('has been confirmed', conf_log.body_preview)

    def test_inbound_patient_reply_no_logged_and_monitored(self):
        """Inbound NO updates original reminder, logs PATIENT_RESPONSE, keeps appointment SCHEDULED, and logs CANCELLATION_NOTICE."""
        from apps.appointments.sms_service import send_appointment_reminder_sms
        from apps.notifications.models import CommunicationLog

        send_appointment_reminder_sms(self.appointment)

        inbound_payload = {
            'message_id': 'inbound-msg-no-123',
            'sender': '+639178889999',
            'recipient': '+639111222333',
            'message': 'NO',
        }
        res = self.client.post(self.inbound_url, inbound_payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Inbound reply log
        inbound_log = CommunicationLog.objects.filter(
            patient=self.patient,
            comm_type='PATIENT_RESPONSE'
        ).first()
        self.assertIsNotNone(inbound_log)
        self.assertEqual(inbound_log.direction, 'INBOUND')
        self.assertEqual(inbound_log.patient_reply, 'CANCEL')

        # Original reminder log updated to REPLIED
        reminder_log = CommunicationLog.objects.filter(
            appointment=self.appointment,
            comm_type='APPOINTMENT_REMINDER'
        ).first()
        self.assertEqual(reminder_log.status, 'REPLIED')
        self.assertEqual(reminder_log.patient_reply, 'CANCEL')

        # Appointment remains SCHEDULED (not cancelled immediately)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'SCHEDULED')
        self.assertEqual(self.appointment.confirmation_status, 'DECLINED')

        # Outbound options notice logged with rebook & cancel tokens
        options_log = CommunicationLog.objects.filter(
            appointment=self.appointment,
            comm_type='CANCELLATION_NOTICE'
        ).first()
        self.assertIsNotNone(options_log)
        self.assertEqual(options_log.direction, 'OUTBOUND')
        self.assertIn('/rebook/', options_log.full_body)
        self.assertIn('/cancel/', options_log.full_body)
        self.assertIn('rebook_token', options_log.event_metadata)
        self.assertIn('cancel_token', options_log.event_metadata)

    def test_inbound_arbitrary_client_inquiry_logged_and_monitored(self):
        """Arbitrary incoming SMS text is logged to CommunicationLog without altering appointment."""
        from apps.notifications.models import CommunicationLog

        inbound_payload = {
            'message_id': 'inbound-msg-question-123',
            'sender': '+639178889999',
            'recipient': '+639111222333',
            'message': 'Good day, can I bring my laboratory results from yesterday?',
        }
        res = self.client.post(self.inbound_url, inbound_payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        inbound_log = CommunicationLog.objects.filter(
            patient=self.patient,
            comm_type='PATIENT_RESPONSE'
        ).first()
        self.assertIsNotNone(inbound_log)
        self.assertEqual(inbound_log.direction, 'INBOUND')
        self.assertIn('laboratory results', inbound_log.full_body)
        self.assertEqual(self.appointment.status, 'SCHEDULED')

    def test_communication_logs_api_filtering_and_retrieval(self):
        """Staff can query communication logs and filter by direction (INBOUND vs OUTBOUND) or patient."""
        from apps.notifications.models import CommunicationLog

        # Create 1 Outbound log and 1 Inbound log
        CommunicationLog.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            comm_type='APPOINTMENT_REMINDER',
            channel='SMS',
            direction='OUTBOUND',
            status='DELIVERED',
            recipient='+639178889999',
            subject='Reminder',
            full_body='Reminder message',
        )
        CommunicationLog.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            comm_type='PATIENT_RESPONSE',
            channel='SMS',
            direction='INBOUND',
            status='DELIVERED',
            recipient='+639178889999',
            subject='Client Reply',
            full_body='Yes I will attend',
            patient_reply='CONFIRM',
        )

        self.client.force_authenticate(user=self.staff_user)

        # 1. Query all
        res_all = self.client.get(self.comm_logs_url)
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        self.assertEqual(res_all.data['count'], 2)

        # 2. Filter by direction=INBOUND
        res_inbound = self.client.get(self.comm_logs_url, {'direction': 'INBOUND'})
        self.assertEqual(res_inbound.status_code, status.HTTP_200_OK)
        self.assertEqual(res_inbound.data['count'], 1)
        self.assertEqual(res_inbound.data['results'][0]['direction'], 'INBOUND')
        self.assertEqual(res_inbound.data['results'][0]['patient_reply'], 'CONFIRM')

        # 3. Filter by direction=OUTBOUND
        res_outbound = self.client.get(self.comm_logs_url, {'direction': 'OUTBOUND'})
        self.assertEqual(res_outbound.status_code, status.HTTP_200_OK)
        self.assertEqual(res_outbound.data['count'], 1)
        self.assertEqual(res_outbound.data['results'][0]['direction'], 'OUTBOUND')

    def test_appointment_reminder_is_responded_boolean_and_value_storage(self):
        """Verify database persistence of is_responded boolean and normalized value for appointment & communication log."""
        from apps.appointments.sms_service import send_appointment_reminder_sms
        from apps.appointments.serializers import AppointmentSerializer
        from apps.notifications.models import CommunicationLog
        from apps.notifications.serializers import CommunicationLogSerializer

        # 1. Before response: reminder sent, is_responded is False
        send_appointment_reminder_sms(self.appointment)
        self.appointment.refresh_from_db()
        reminder_log = CommunicationLog.objects.get(appointment=self.appointment, comm_type='APPOINTMENT_REMINDER')

        self.assertFalse(self.appointment.is_responded)
        self.assertEqual(self.appointment.response_value, '')
        self.assertFalse(reminder_log.is_responded)
        self.assertEqual(reminder_log.response_value, '')

        # Serializer representation before reply
        appt_data = AppointmentSerializer(self.appointment).data
        self.assertFalse(appt_data['is_responded'])
        self.assertEqual(appt_data['response_value'], '')

        log_data = CommunicationLogSerializer(reminder_log).data
        self.assertFalse(log_data['is_responded'])
        self.assertEqual(log_data['response_value'], '')

        # 2. Patient replies "YES" via gateway
        inbound_payload = {
            'message_id': 'inbound-is-responded-001',
            'sender': '+639178889999',
            'recipient': '+639111222333',
            'message': 'YES',
        }
        res = self.client.post(self.inbound_url, inbound_payload, format='json', HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # 3. Verify Database Storage after reply
        self.appointment.refresh_from_db()
        reminder_log.refresh_from_db()

        # Appointment model verification
        self.assertTrue(self.appointment.is_responded)
        self.assertEqual(self.appointment.response_value, 'YES')
        self.assertEqual(self.appointment.patient_reply, 'Y')
        self.assertIsNotNone(self.appointment.patient_reply_at)
        self.assertEqual(self.appointment.confirmation_status, 'CONFIRMED')

        # CommunicationLog model verification
        self.assertTrue(reminder_log.is_responded)
        self.assertEqual(reminder_log.response_value, 'YES')
        self.assertEqual(reminder_log.status, 'REPLIED')
        self.assertEqual(reminder_log.patient_reply, 'CONFIRM')
        self.assertIsNotNone(reminder_log.replied_at)

        # Serializer representation after reply
        appt_data_after = AppointmentSerializer(self.appointment).data
        self.assertTrue(appt_data_after['is_responded'])
        self.assertEqual(appt_data_after['response_value'], 'YES')

        log_data_after = CommunicationLogSerializer(reminder_log).data
        self.assertTrue(log_data_after['is_responded'])
        self.assertEqual(log_data_after['response_value'], 'YES')








from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.clinics.models import Clinic, Practitioner
from apps.clinics.services.models import Service
from apps.patients.models import PatientConsent, PortalBooking, PortalLink


class PortalBookingRestrictionTests(TestCase):
    """
    The public booking endpoint must accept only the services the public
    portal listing shows, and the public payload must not expose hidden or
    legacy package services.
    """

    def setUp(self):
        self.client = APIClient()

        self.clinic = Clinic.objects.create(name="Malasakit Health")
        self.other_clinic = Clinic.objects.create(name="Other Clinic")
        self.portal_link, _ = PortalLink.get_or_create_for_clinic(self.clinic)

        user = User.objects.create_user(
            email="practitioner@malasakit.com",
            password="testpassword123",
            first_name="Maria",
            last_name="Santos",
            clinic=self.clinic,
            clinic_branch=self.clinic,
            role="PRACTITIONER",
        )
        self.practitioner = Practitioner.objects.create(
            user=user, clinic=self.clinic, consultation_fee=Decimal('500.00'),
        )

        self.public_service = self._service("Physical Therapy")
        self.hidden_service = self._service("Internal Review", show_in_portal=False)
        self.package_service = self._service(
            "Legacy Package", is_package=True, session_allocation=5,
        )
        self.inactive_service = self._service("Retired Service", is_active=False)
        self.deleted_service = self._service("Deleted Service", is_deleted=True)
        self.other_clinic_service = self._service("Elsewhere", clinic=self.other_clinic)

        for svc in (self.hidden_service, self.package_service):
            self.practitioner.services.add(svc)
        self.practitioner.services.add(self.public_service)

        self.consent = PatientConsent.objects.create(
            portal_link=self.portal_link,
            full_name="Juan Dela Cruz",
            email="juan@example.com",
            consent_text="consent",
            signature="sig",
        )

    def _service(self, name, clinic=None, **overrides):
        fields = dict(
            clinic=clinic or self.clinic,
            name=name,
            duration_minutes=30,
            price=Decimal('1000.00'),
            is_active=True,
            show_in_portal=True,
            is_package=False,
        )
        fields.update(overrides)
        return Service.objects.create(**fields)

    def _book_url(self):
        return f'/api/public/portal/{self.portal_link.token}/book/'

    def _payload(self, service):
        return {
            'consent_id': self.consent.id,
            'service': service.id,
            'patient_first_name': 'Juan',
            'patient_last_name': 'Dela Cruz',
            'patient_email': 'juan@example.com',
            'patient_phone': '+639171234567',
            'patient_date_of_birth': '1990-01-01',
            'appointment_date': (date.today() + timedelta(days=3)).isoformat(),
            'appointment_time': '10:00:00',
        }

    # ── Submit endpoint ──────────────────────────────────────────────────────

    def test_regular_public_service_can_still_be_booked(self):
        response = self.client.post(self._book_url(), self._payload(self.public_service), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(PortalBooking.objects.count(), 1)
        self.assertTrue(Appointment.objects.filter(service=self.public_service).exists())

    def _assert_rejected(self, service):
        response = self.client.post(self._book_url(), self._payload(service), format='json')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn('service', response.data)
        self.assertEqual(PortalBooking.objects.count(), 0)
        self.assertEqual(Appointment.objects.count(), 0)

    def test_hidden_service_is_rejected(self):
        self._assert_rejected(self.hidden_service)

    def test_legacy_package_service_is_rejected(self):
        self._assert_rejected(self.package_service)

    def test_inactive_service_is_rejected(self):
        self._assert_rejected(self.inactive_service)

    def test_soft_deleted_service_is_rejected(self):
        self._assert_rejected(self.deleted_service)

    def test_other_clinics_service_is_rejected(self):
        self._assert_rejected(self.other_clinic_service)

    def test_branch_portal_accepts_service_owned_by_main_clinic(self):
        branch = Clinic.objects.create(name="Malasakit Branch", parent_clinic=self.clinic)
        branch_link, _ = PortalLink.get_or_create_for_clinic(branch)
        consent = PatientConsent.objects.create(
            portal_link=branch_link, full_name="Juan Dela Cruz",
            email="juan@example.com", consent_text="consent", signature="sig",
        )
        payload = self._payload(self.public_service)
        payload['consent_id'] = consent.id
        response = self.client.post(
            f'/api/public/portal/{branch_link.token}/book/', payload, format='json',
        )
        self.assertEqual(response.status_code, 201, response.data)

    # ── Public payload ───────────────────────────────────────────────────────

    def test_public_payload_lists_only_public_services(self):
        response = self.client.get(f'/api/public/portal/{self.portal_link.token}/')
        self.assertEqual(response.status_code, 200)

        listed = {
            svc['name']
            for category in response.data['categories']
            for svc in category['services']
        }
        self.assertEqual(listed, {"Physical Therapy"})

    def test_public_payload_does_not_leak_hidden_services_via_practitioners(self):
        response = self.client.get(f'/api/public/portal/{self.portal_link.token}/')
        self.assertEqual(response.status_code, 200)

        practitioner = next(p for p in response.data['practitioners'] if p['id'] == self.practitioner.id)
        names = {svc['name'] for svc in practitioner['services']}
        self.assertEqual(names, {"Physical Therapy"})

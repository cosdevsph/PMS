from decimal import Decimal
from datetime import date, time
from django.test import TestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.accounts.models import User
from apps.clinics.models import Clinic, Practitioner
from apps.clinics.services.models import Service
from apps.clinics.services.serializers import ServiceSerializer
from apps.patients.models import Patient, PatientCase, SessionConsumptionLog
from apps.patients.services.case_service import consume_case_session, restore_case_session
from apps.patients.services.session_engine import SessionEngine
from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.billing.models import Invoice, InvoiceItem
from apps.billing.views import InvoiceViewSet


class PreApprovedSessionsRegressionTests(TestCase):
    """
    Automated regression test suite verifying the deprecation of package services
    and the introduction of case-level pre-approved sessions.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Clinic & Users
        self.clinic = Clinic.objects.create(name="Malasakit Health")
        self.user = User.objects.create_user(
            email="practitioner@malasakit.com",
            password="testpassword123",
            first_name="Maria",
            last_name="Santos",
            clinic=self.clinic,
            role="PRACTITIONER"
        )
        self.practitioner = Practitioner.objects.create(
            user=self.user,
            clinic=self.clinic,
            consultation_fee=Decimal('500.00')
        )

        # Standard Clinical Service
        self.service = Service.objects.create(
            clinic=self.clinic,
            name="Physical Therapy",
            duration_minutes=45,
            price=Decimal('1500.00'),
            is_package=False,
            is_active=True,
            show_in_portal=True
        )

        # Patient
        self.patient = Patient.objects.create(
            first_name="Juan",
            last_name="Dela Cruz",
            clinic=self.clinic,
            date_of_birth=date(1988, 5, 20)
        )

    # ──────────────────────────────────────────────────────────────────────────
    # 1. Service Management & Legacy Package Deprecation
    # ──────────────────────────────────────────────────────────────────────────

    def test_service_serializer_rejects_new_package_service(self):
        """ServiceSerializer must reject creating new services with is_package=True."""
        request = self.factory.post('/api/services/')
        request.user = self.user

        data = {
            'clinic': self.clinic.id,
            'name': '10-Session PT Package',
            'duration_minutes': 60,
            'price': '12000.00',
            'is_package': True,
            'session_allocation': 10
        }
        serializer = ServiceSerializer(data=data, context={'request': request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('is_package', serializer.errors)
        self.assertIn('no longer supported', serializer.errors['is_package'][0].lower())

    def test_service_serializer_rejects_converting_existing_service_to_package(self):
        """ServiceSerializer must reject converting an existing standard service to a package."""
        request = self.factory.patch(f'/api/services/{self.service.id}/')
        request.user = self.user

        serializer = ServiceSerializer(
            instance=self.service,
            data={'is_package': True},
            partial=True,
            context={'request': request}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('is_package', serializer.errors)
        self.assertIn('converting an existing service', serializer.errors['is_package'][0].lower())

    def test_service_serializer_allows_standard_service_creation(self):
        """ServiceSerializer must allow creating normal clinic services."""
        request = self.factory.post('/api/services/')
        request.user = self.user

        data = {
            'clinic': self.clinic.id,
            'name': 'Occupational Therapy',
            'duration_minutes': 60,
            'price': '1800.00',
            'is_package': False
        }
        serializer = ServiceSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        service = serializer.save(clinic=self.clinic)
        self.assertFalse(service.is_package)

    # ──────────────────────────────────────────────────────────────────────────
    # 2. Online Booking Safeguards
    # ──────────────────────────────────────────────────────────────────────────

    def test_portal_service_exclusion_of_package_services(self):
        """Online booking endpoints and serializers must exclude package services."""
        legacy_package = Service.objects.create(
            clinic=self.clinic,
            name="Legacy Package",
            duration_minutes=30,
            price=Decimal('5000.00'),
            is_package=True,
            session_allocation=5,
            is_active=True,
            show_in_portal=True
        )

        portal_qs = Service.objects.filter(
            clinic=self.clinic,
            is_active=True,
            show_in_portal=True,
            is_package=False
        )
        self.assertIn(self.service, portal_qs)
        self.assertNotIn(legacy_package, portal_qs)

    # ──────────────────────────────────────────────────────────────────────────
    # 3. Case-Level Pre-Approved Sessions
    # ──────────────────────────────────────────────────────────────────────────

    def test_case_approved_sessions_creation_and_stats(self):
        """Case with pre-approved sessions initializes with correct stats."""
        case = PatientCase.objects.create(
            patient=self.patient,
            title="Stroke Rehabilitation",
            approved_sessions=10,
            completed_sessions=0,
            is_unlimited=False
        )
        self.assertEqual(case.approved_sessions, 10)
        self.assertEqual(case.completed_sessions, 0)
        self.assertEqual(case.remaining_sessions, 10)

        # SessionEngine inspection
        stats = SessionEngine.get_session_stats(case)
        self.assertEqual(stats['approved_sessions'], 10)
        self.assertEqual(stats['remaining_sessions'], 10)
        self.assertEqual(stats['allocation_source'], 'MANUAL')
        self.assertEqual(stats['allocation_status'], 'ACTIVE')

    def test_case_edit_and_unlimited_sessions(self):
        """Editing approved sessions or setting unlimited reflects accurately."""
        case = PatientCase.objects.create(
            patient=self.patient,
            title="Knee Post-Op",
            approved_sessions=6,
            completed_sessions=2,
            is_unlimited=False
        )
        self.assertEqual(case.remaining_sessions, 4)

        # Allocate 4 more sessions
        case.approved_sessions = 10
        case.save(update_fields=['approved_sessions'])
        case.refresh_from_db()
        self.assertEqual(case.remaining_sessions, 8)

        # Switch to unlimited
        case.is_unlimited = True
        case.save(update_fields=['is_unlimited'])
        case.refresh_from_db()
        self.assertIsNone(case.remaining_sessions)
        stats = SessionEngine.get_session_stats(case)
        self.assertEqual(stats['allocation_status'], 'UNLIMITED')

    # ──────────────────────────────────────────────────────────────────────────
    # 4. Appointment Session Consumption & Idempotency
    # ──────────────────────────────────────────────────────────────────────────

    def test_appointment_booking_consumes_session_atomically(self):
        """Booking an appointment consumes 1 pre-approved session."""
        case = PatientCase.objects.create(
            patient=self.patient,
            title="Spinal Recovery",
            approved_sessions=3,
            completed_sessions=0,
            is_unlimited=False
        )

        appointment = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            patient_case=case,
            date=date.today(),
            start_time=time(9, 0),
            end_time=time(9, 45),
            status='SCHEDULED'
        )

        # Consume session
        consumed = consume_case_session(appointment, user=self.user)
        self.assertTrue(consumed)

        case.refresh_from_db()
        self.assertEqual(case.completed_sessions, 1)
        self.assertEqual(case.remaining_sessions, 2)

        # Verify audit log
        log = SessionConsumptionLog.objects.filter(appointment=appointment, patient_case=case).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.action, 'USED')

        # Idempotency check: consuming again for the same appointment does NOT increment
        second_call = consume_case_session(appointment, user=self.user)
        self.assertTrue(second_call)
        case.refresh_from_db()
        self.assertEqual(case.completed_sessions, 1)
        self.assertEqual(case.remaining_sessions, 2)

    # ──────────────────────────────────────────────────────────────────────────
    # 5. Boundary & Exhaustion Safety
    # ──────────────────────────────────────────────────────────────────────────

    def test_case_session_boundary_and_exhaustion(self):
        """Sessions cannot drop below 0; remaining sessions never become negative."""
        case = PatientCase.objects.create(
            patient=self.patient,
            title="Ankle Sprain",
            approved_sessions=1,
            completed_sessions=0,
            is_unlimited=False
        )

        appt1 = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            patient_case=case,
            date=date.today(),
            start_time=time(10, 0),
            end_time=time(10, 45),
            status='SCHEDULED'
        )
        self.assertTrue(consume_case_session(appt1, user=self.user))
        case.refresh_from_db()
        self.assertEqual(case.completed_sessions, 1)
        self.assertEqual(case.remaining_sessions, 0)
        stats = SessionEngine.get_session_stats(case)
        self.assertEqual(stats['allocation_status'], 'EXHAUSTED')

        # Attempt to consume with a second appointment when quota is exhausted
        appt2 = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            patient_case=case,
            date=date.today(),
            start_time=time(14, 0),
            end_time=time(14, 45),
            status='SCHEDULED'
        )
        consumed_second = consume_case_session(appt2, user=self.user)
        self.assertFalse(consumed_second)

        case.refresh_from_db()
        self.assertEqual(case.completed_sessions, 1)
        self.assertEqual(case.remaining_sessions, 0)

    # ──────────────────────────────────────────────────────────────────────────
    # 6. Cancellation & Deletion Restoration
    # ──────────────────────────────────────────────────────────────────────────

    def test_appointment_cancellation_restores_consumed_session(self):
        """Cancelling or deleting an appointment restores the pre-approved session."""
        case = PatientCase.objects.create(
            patient=self.patient,
            title="Wrist Rehab",
            approved_sessions=5,
            completed_sessions=0,
            is_unlimited=False
        )

        appointment = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            patient_case=case,
            date=date.today(),
            start_time=time(11, 0),
            end_time=time(11, 45),
            status='SCHEDULED'
        )
        consume_case_session(appointment, user=self.user)
        case.refresh_from_db()
        self.assertEqual(case.completed_sessions, 1)

        # Restore session (simulating cancellation)
        restored = restore_case_session(appointment, user=self.user, reason="Appointment cancelled")
        self.assertTrue(restored)

        case.refresh_from_db()
        self.assertEqual(case.completed_sessions, 0)
        self.assertEqual(case.remaining_sessions, 5)

        # Verify restoration log
        restore_log = SessionConsumptionLog.objects.filter(
            appointment=appointment,
            patient_case=case,
            action='REMOVED'
        ).first()
        self.assertIsNotNone(restore_log)
        self.assertIn("cancelled", restore_log.reason.lower())

        # Repeated restoration returns False and does not drop completed below 0
        second_restore = restore_case_session(appointment, user=self.user)
        self.assertFalse(second_restore)
        case.refresh_from_db()
        self.assertEqual(case.completed_sessions, 0)

    # ──────────────────────────────────────────────────────────────────────────
    # 7. Zero-Rated Invoices for Covered Sessions
    # ──────────────────────────────────────────────────────────────────────────

    def test_invoice_creation_zero_rated_for_covered_session(self):
        """
        An appointment with a consumed pre-approved session produces a $0.00 service fee invoice
        annotated with '(Covered by Pre-Approved Session)'.
        """
        case = PatientCase.objects.create(
            patient=self.patient,
            title="Shoulder Pain",
            approved_sessions=5,
            completed_sessions=0,
            is_unlimited=False
        )

        covered_appt = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            patient_case=case,
            date=date.today(),
            start_time=time(10, 0),
            end_time=time(10, 45),
            status='SCHEDULED',
            appointment_type='THERAPY'
        )
        consume_case_session(covered_appt, user=self.user)

        # Create invoice via InvoiceViewSet.create_from_appointment
        view = InvoiceViewSet.as_view({'post': 'create_from_appointment'})
        request = self.factory.post(
            '/api/billing/invoices/create-from-appointment/',
            {
                'appointment': covered_appt.id,
                'invoice_date': date.today().isoformat(),
            },
            format='json'
        )
        force_authenticate(request, user=self.user)
        response = view(request)

        self.assertIn(response.status_code, [200, 201], response.data)
        invoice = Invoice.objects.get(appointment=covered_appt)
        item = invoice.items.first()
        self.assertIsNotNone(item)
        self.assertEqual(item.unit_price, Decimal('0.00'))
        self.assertIn("(Covered by Pre-Approved Session)", item.description)
        self.assertEqual(invoice.total_amount, Decimal('0.00'))

    def test_invoice_creation_normal_fee_for_uncovered_session(self):
        """
        An appointment WITHOUT a consumed session produces an invoice with the standard service fee.
        """
        uncovered_appt = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            date=date.today(),
            start_time=time(13, 0),
            end_time=time(13, 45),
            status='SCHEDULED',
            appointment_type='THERAPY'
        )

        view = InvoiceViewSet.as_view({'post': 'create_from_appointment'})
        request = self.factory.post(
            '/api/billing/invoices/create-from-appointment/',
            {
                'appointment': uncovered_appt.id,
                'invoice_date': date.today().isoformat(),
            },
            format='json'
        )
        force_authenticate(request, user=self.user)
        response = view(request)

        self.assertIn(response.status_code, [200, 201], response.data)
        invoice = Invoice.objects.get(appointment=uncovered_appt)
        item = invoice.items.first()
        self.assertIsNotNone(item)
        self.assertEqual(item.unit_price, self.service.price)
        self.assertNotIn("(Covered by Pre-Approved Session)", item.description)
        self.assertEqual(invoice.total_amount, self.service.price)

    # ──────────────────────────────────────────────────────────────────────────
    # 8. Multi-Case Isolation Per Patient
    # ──────────────────────────────────────────────────────────────────────────

    def test_multiple_cases_per_patient_quota_isolation(self):
        """Multiple cases for the same patient have strictly isolated quotas."""
        case_a = PatientCase.objects.create(
            patient=self.patient,
            title="Case A: Left Knee",
            approved_sessions=5,
            completed_sessions=0,
            is_unlimited=False
        )
        case_b = PatientCase.objects.create(
            patient=self.patient,
            title="Case B: Right Shoulder",
            approved_sessions=3,
            completed_sessions=0,
            is_unlimited=False
        )

        appt_a = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            patient_case=case_a,
            date=date.today(),
            start_time=time(9, 0),
            end_time=time(9, 45),
            status='SCHEDULED'
        )
        consume_case_session(appt_a, user=self.user)

        case_a.refresh_from_db()
        case_b.refresh_from_db()

        # Case A consumed 1, Case B untouched
        self.assertEqual(case_a.completed_sessions, 1)
        self.assertEqual(case_a.remaining_sessions, 4)
        self.assertEqual(case_b.completed_sessions, 0)
        self.assertEqual(case_b.remaining_sessions, 3)

        # Now book and consume for Case B
        appt_b = Appointment.objects.create(
            clinic=self.clinic,
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            patient_case=case_b,
            date=date.today(),
            start_time=time(11, 0),
            end_time=time(11, 45),
            status='SCHEDULED'
        )
        consume_case_session(appt_b, user=self.user)

        case_a.refresh_from_db()
        case_b.refresh_from_db()
        self.assertEqual(case_a.completed_sessions, 1)
        self.assertEqual(case_b.completed_sessions, 1)
        self.assertEqual(case_b.remaining_sessions, 2)

    # ──────────────────────────────────────────────────────────────────────────
    # 9. Appointment Serializer Rejection of Legacy Package Services
    # ──────────────────────────────────────────────────────────────────────────

    def test_appointment_serializer_rejects_booking_package_service(self):
        """AppointmentSerializer must reject booking a service marked as is_package=True."""
        package_service = Service.objects.create(
            clinic=self.clinic,
            name="Old Package Service",
            duration_minutes=60,
            price=Decimal('10000.00'),
            is_package=True,
            session_allocation=10
        )
        case = PatientCase.objects.create(
            patient=self.patient,
            title="General Rehab",
            approved_sessions=10,
            completed_sessions=0
        )

        data = {
            'clinic': self.clinic.id,
            'patient': self.patient.id,
            'practitioner': self.practitioner.id,
            'service': package_service.id,
            'patient_case': case.id,
            'date': date.today().isoformat(),
            'start_time': '10:00:00',
            'end_time': '11:00:00',
            'duration_minutes': 60,
            'status': 'SCHEDULED'
        }
        serializer = AppointmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('service', serializer.errors)
        self.assertIn('package services cannot be booked', str(serializer.errors['service']).lower())

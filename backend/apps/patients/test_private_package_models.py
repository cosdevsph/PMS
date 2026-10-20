from datetime import date, time
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.clinics.models import Clinic, Practitioner
from apps.clinics.services.models import Service
from apps.patients.models import (
    Patient,
    PrivatePackageSession,
    PrivatePackageSessionAuditLog,
    PrivatePackageSessionItem,
    PrivatePackageSessionUsage,
)


class PrivatePackageModelTests(TestCase):
    """
    Data model and computed balances for Private Package Sessions.
    Balances are always derived from usage rows and appointment status.
    """

    def setUp(self):
        self.clinic = Clinic.objects.create(name="Malasakit Health")
        self.user = User.objects.create_user(
            email="practitioner@malasakit.com",
            password="testpassword123",
            first_name="Maria",
            last_name="Santos",
            clinic=self.clinic,
            role="PRACTITIONER",
        )
        self.practitioner = Practitioner.objects.create(
            user=self.user, clinic=self.clinic, consultation_fee=Decimal('500.00'),
        )
        self.physio = Service.objects.create(
            clinic=self.clinic, name="Physio Session", duration_minutes=45,
            price=Decimal('1500.00'),
        )
        self.consult = Service.objects.create(
            clinic=self.clinic, name="Initial Consultation", duration_minutes=30,
            price=Decimal('1000.00'),
        )
        self.patient = Patient.objects.create(
            first_name="Juan", last_name="Dela Cruz", clinic=self.clinic,
            date_of_birth=date(1988, 5, 20),
        )

        self.package = PrivatePackageSession.objects.create(
            patient=self.patient, clinic=self.clinic, title="Rehab Program",
            price=Decimal('12000.00'), created_by=self.user,
        )
        self.physio_item = PrivatePackageSessionItem.objects.create(
            package=self.package, service=self.physio, quantity=3,
        )
        self.consult_item = PrivatePackageSessionItem.objects.create(
            package=self.package, service=self.consult, quantity=1,
        )

    def _appointment(self, service=None, status='SCHEDULED', hour=9):
        return Appointment.objects.create(
            clinic=self.clinic, patient=self.patient, practitioner=self.practitioner,
            service=service or self.physio, status=status,
            date=date.today(), start_time=time(hour, 0), end_time=time(hour, 45),
        )

    def _use(self, item, appointment):
        return PrivatePackageSessionUsage.objects.create(
            item=item, appointment=appointment, created_by=self.user,
        )

    # ── Balances ─────────────────────────────────────────────────────────────

    def test_new_package_has_all_sessions_remaining(self):
        self.assertEqual(self.package.total_sessions, 4)
        self.assertEqual(self.package.used_sessions, 0)
        self.assertEqual(self.package.remaining_sessions, 4)
        self.assertEqual(self.physio_item.remaining, 3)

    def test_creating_an_appointment_does_not_use_a_session(self):
        """No automatic assignment: an appointment never consumes a session by itself."""
        self._appointment()
        self.assertEqual(self.package.used_sessions, 0)
        self.assertEqual(PrivatePackageSessionUsage.objects.count(), 0)

    def test_assigned_appointment_uses_one_session_of_its_item(self):
        self._use(self.physio_item, self._appointment())

        self.assertEqual(self.physio_item.used, 1)
        self.assertEqual(self.physio_item.remaining, 2)
        self.assertEqual(self.consult_item.remaining, 1)
        self.assertEqual(self.package.used_sessions, 1)
        self.assertEqual(self.package.remaining_sessions, 3)

    def test_cancelled_appointment_returns_its_session(self):
        appt = self._appointment()
        self._use(self.physio_item, appt)
        self.assertEqual(self.package.remaining_sessions, 3)

        appt.status = 'CANCELLED'
        appt.save()
        self.assertEqual(self.package.remaining_sessions, 4)
        self.assertEqual(self.physio_item.remaining, 3)

    def test_no_show_and_dna_stay_used(self):
        no_show = self._appointment(status='NO_SHOW', hour=9)
        dna = self._appointment(status='DNA', hour=11)
        self._use(self.physio_item, no_show)
        self._use(self.physio_item, dna)

        self.assertEqual(self.physio_item.used, 2)
        self.assertEqual(self.package.remaining_sessions, 2)

    def test_deleted_appointment_returns_its_session(self):
        appt = self._appointment()
        self._use(self.physio_item, appt)

        appt.is_deleted = True
        appt.save()
        self.assertEqual(self.package.remaining_sessions, 4)

    def test_hard_deleted_appointment_keeps_usage_row_but_returns_session(self):
        appt = self._appointment()
        usage = self._use(self.physio_item, appt)

        appt.delete()
        usage.refresh_from_db()
        self.assertIsNone(usage.appointment)
        self.assertEqual(self.package.remaining_sessions, 4)

    def test_balance_is_isolated_per_package(self):
        other = PrivatePackageSession.objects.create(
            patient=self.patient, clinic=self.clinic, title="Second", price=Decimal('0'),
        )
        other_item = PrivatePackageSessionItem.objects.create(
            package=other, service=self.physio, quantity=5,
        )
        self._use(self.physio_item, self._appointment())

        self.assertEqual(other.used_sessions, 0)
        self.assertEqual(other_item.remaining, 5)
        self.assertEqual(self.package.used_sessions, 1)

    # ── Database safeguards ──────────────────────────────────────────────────

    def test_an_appointment_can_use_only_one_session(self):
        appt = self._appointment()
        self._use(self.physio_item, appt)

        with self.assertRaises(IntegrityError), transaction.atomic():
            self._use(self.consult_item, appt)
        self.assertEqual(PrivatePackageSessionUsage.objects.count(), 1)

    def test_same_service_cannot_appear_twice_in_a_package(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            PrivatePackageSessionItem.objects.create(
                package=self.package, service=self.physio, quantity=2,
            )

    def test_item_quantity_must_be_at_least_one(self):
        extra = Service.objects.create(
            clinic=self.clinic, name="Extra", duration_minutes=30, price=Decimal('100'),
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            PrivatePackageSessionItem.objects.create(
                package=self.package, service=extra, quantity=0,
            )

    def test_price_cannot_be_negative(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            PrivatePackageSession.objects.create(
                patient=self.patient, clinic=self.clinic, title="Bad", price=Decimal('-1'),
            )

    def test_service_in_a_package_cannot_be_hard_deleted(self):
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.physio.delete()

    def test_patient_with_packages_cannot_be_hard_deleted(self):
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.patient.delete()

    # ── Audit log ────────────────────────────────────────────────────────────

    def test_audit_log_records_actor_action_and_changes(self):
        PrivatePackageSessionAuditLog.objects.create(
            package=self.package, user=self.user, action='CREATED',
            changes={'price': {'from': None, 'to': '12000.00'}},
        )
        appt = self._appointment()
        PrivatePackageSessionAuditLog.objects.create(
            package=self.package, user=self.user, action='APPOINTMENT_ASSIGNED',
            appointment=appt, reason='Agreed onsite',
        )

        logs = list(self.package.audit_logs.all())
        self.assertEqual(len(logs), 2)
        self.assertEqual({l.action for l in logs}, {'CREATED', 'APPOINTMENT_ASSIGNED'})
        self.assertTrue(all(l.user == self.user for l in logs))
        self.assertTrue(all(l.created_at for l in logs))

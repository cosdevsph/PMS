import threading
from datetime import date, time
from decimal import Decimal

from django.db import connection
from django.test import TestCase, TransactionTestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.accounts.models import User, UserBranchAccess
from apps.appointments.models import Appointment
from apps.billing.models import Invoice, InvoiceVersion
from apps.clinics.models import Clinic, Practitioner
from apps.clinics.services.models import Service
from apps.patients.models import (
    Patient,
    PatientCase,
    PrivatePackageSession,
    PrivatePackageSessionUsage,
)
from apps.patients.services import package_service

URL = '/api/private-packages/'


class AssignmentFixtureMixin:
    """Shared data. Works for both TestCase and TransactionTestCase."""

    def build_fixture(self):
        self.clinic = Clinic.objects.create(name="Malasakit Health")
        self.other_clinic = Clinic.objects.create(name="Other Clinic")
        self.admin = self._user("admin@x.com", "ADMIN")
        self.practitioner = Practitioner.objects.create(
            user=self._user("prac@x.com", "PRACTITIONER"), clinic=self.clinic, consultation_fee=Decimal('500'),
        )
        self.physio = self._service("Physio Session")
        self.consult = self._service("Initial Consultation")
        self.massage = self._service("Massage")
        self.patient = self._patient("Juan")
        self.package = package_service.create_package(
            user=self.admin, patient_id=self.patient.id, title="Rehab Program", price='12000',
            notes='', raw_items=[
                {'service': self.physio.id, 'quantity': 2},
                {'service': self.consult.id, 'quantity': 1},
            ],
        )

    def _user(self, email, role, clinic=None):
        clinic = clinic or self.clinic
        user = User.objects.create_user(
            email=email, password="testpassword123", first_name="Test", last_name=role.title(),
            clinic=clinic, clinic_branch=clinic, role=role,
        )
        if role == 'ADMIN_ASSISTANT':   # managers see the branches they are assigned to manage
            UserBranchAccess.objects.create(user=user, branch=clinic)
        return user

    def _service(self, name, clinic=None):
        return Service.objects.create(
            clinic=clinic or self.clinic, name=name, duration_minutes=30, price=Decimal('1000'),
        )

    def _patient(self, first_name, clinic=None):
        clinic = clinic or self.clinic
        return Patient.objects.create(
            first_name=first_name, last_name="Dela Cruz", clinic=clinic, home_branch=clinic,
            date_of_birth=date(1988, 5, 20),
        )

    def _appointment(self, service=None, patient=None, status='SCHEDULED', hour=9, **kw):
        return Appointment.objects.create(
            clinic=self.clinic, patient=patient or self.patient, practitioner=self.practitioner,
            service=service or self.physio, status=status,
            date=date.today(), start_time=time(hour, 0), end_time=time(hour, 30), **kw,
        )

    def _assign(self, appointment, package=None, user=None):
        return package_service.assign_appointment(user or self.admin, package or self.package, appointment)


class AssignServiceTests(AssignmentFixtureMixin, TestCase):
    def setUp(self):
        self.build_fixture()

    def _rejects(self, appointment, field='appointment', package=None):
        with self.assertRaises(ValidationError) as ctx:
            self._assign(appointment, package=package)
        self.assertIn(field, ctx.exception.detail)
        self.assertFalse(PrivatePackageSessionUsage.objects.filter(appointment=appointment).exists())

    def test_creating_appointments_never_assigns_or_uses_a_session(self):
        self._appointment()
        case = PatientCase.objects.create(patient=self.patient, title="Case")
        self._appointment(patient=self.patient, patient_case=case, hour=11)
        self.assertEqual(PrivatePackageSessionUsage.objects.count(), 0)
        self.assertEqual(self.package.remaining_sessions, 3)

    def test_assign_uses_one_session_of_the_matching_service(self):
        appt = self._appointment(self.physio)
        usage = self._assign(appt)
        self.assertEqual(usage.item.service, self.physio)
        self.assertEqual(usage.created_by, self.admin)
        self.assertEqual(self.package.remaining_sessions, 2)
        self.assertEqual(self.package.items.get(service=self.consult).remaining, 1)

    def test_assign_writes_an_audit_entry_and_sets_modified_by(self):
        appt = self._appointment()
        editor = self._user("editor@x.com", "STAFF")
        package_service.assign_appointment(editor, self.package, appt, reason='Agreed onsite')
        log = self.package.audit_logs.get(action='APPOINTMENT_ASSIGNED')
        self.assertEqual(log.user, editor)
        self.assertEqual(log.appointment, appt)
        self.assertEqual(log.reason, 'Agreed onsite')
        self.assertEqual(log.changes['session'], '1 of 2')
        self.package.refresh_from_db()
        self.assertEqual(self.package.modified_by, editor)

    def test_a_different_patients_appointment_is_rejected(self):
        other = self._patient("Maria")
        self._rejects(self._appointment(patient=other))

    def test_a_service_not_in_the_package_is_rejected(self):
        self._rejects(self._appointment(self.massage))

    def test_an_appointment_without_a_service_is_rejected(self):
        appt = self._appointment()
        appt.service = None
        appt.save()
        self._rejects(appt)

    def test_a_cancelled_appointment_is_rejected(self):
        self._rejects(self._appointment(status='CANCELLED'))

    def test_a_deleted_appointment_is_rejected(self):
        self._rejects(self._appointment(is_deleted=True))

    def test_completed_no_show_and_dna_appointments_can_be_assigned(self):
        for hour, status in ((9, 'COMPLETED'), (10, 'NO_SHOW')):
            self._assign(self._appointment(status=status, hour=hour))
        self.assertEqual(self.package.remaining_sessions, 1)

    def test_an_inactive_package_is_rejected(self):
        for status in ('COMPLETED', 'CANCELLED'):
            with self.subTest(status):
                PrivatePackageSession.objects.filter(pk=self.package.pk).update(status=status)
                self._rejects(self._appointment(hour=12), field='package')

    def test_double_assignment_is_rejected_even_to_another_package(self):
        appt = self._appointment()
        self._assign(appt)
        with self.assertRaises(ValidationError):
            self._assign(appt)

        second = package_service.create_package(
            user=self.admin, patient_id=self.patient.id, title="Second", price='0', notes='',
            raw_items=[{'service': self.physio.id, 'quantity': 5}],
        )
        with self.assertRaises(ValidationError):
            self._assign(appt, package=second)
        self.assertEqual(PrivatePackageSessionUsage.objects.filter(appointment=appt).count(), 1)

    def test_an_exhausted_service_is_rejected_but_a_cancelled_one_frees_a_slot(self):
        first, second = self._appointment(hour=9), self._appointment(hour=10)
        self._assign(first)
        self._assign(second)
        self._rejects(self._appointment(hour=11))

        first.status = 'CANCELLED'
        first.save()
        self._assign(self._appointment(hour=12))  # slot returned by the cancellation
        self.assertEqual(self.package.items.get(service=self.physio).remaining, 0)

    def test_an_appointment_with_an_invoice_is_rejected(self):
        appt = self._appointment()
        Invoice.objects.create(
            clinic=self.clinic, patient=self.patient, appointment=appt, invoice_date=date.today(),
        )
        self._rejects(appt)

    def test_an_appointment_on_an_invoice_version_is_rejected(self):
        appt = self._appointment()
        master = Invoice.objects.create(clinic=self.clinic, patient=self.patient, invoice_date=date.today())
        master.create_version_snapshot(user=self.admin, change_summary={}, appointment=appt)
        self._rejects(appt)

    def test_a_deleted_invoice_does_not_block_assignment(self):
        appt = self._appointment()
        Invoice.objects.create(
            clinic=self.clinic, patient=self.patient, appointment=appt,
            invoice_date=date.today(), is_deleted=True,
        )
        self._assign(appt)

    def test_the_appointments_case_is_never_changed(self):
        case = PatientCase.objects.create(patient=self.patient, title="Case")
        appt = self._appointment(patient_case=case)
        self._assign(appt)
        appt.refresh_from_db()
        self.assertEqual(appt.patient_case, case)

        loose = self._appointment(hour=11)
        self._assign(loose)
        loose.refresh_from_db()
        self.assertIsNone(loose.patient_case)

    def test_unassign_returns_the_session_and_is_audited(self):
        appt = self._appointment()
        self._assign(appt)
        package_service.unassign_appointment(self.admin, self.package, appt, reason='Wrong package')

        self.assertEqual(self.package.remaining_sessions, 3)
        self.assertFalse(PrivatePackageSessionUsage.objects.filter(appointment=appt).exists())
        log = self.package.audit_logs.get(action='APPOINTMENT_UNASSIGNED')
        self.assertEqual((log.user, log.appointment, log.reason), (self.admin, appt, 'Wrong package'))
        self._assign(appt)  # and it can be assigned again

    def test_unassign_rejects_an_appointment_that_is_not_assigned(self):
        with self.assertRaises(ValidationError):
            package_service.unassign_appointment(self.admin, self.package, self._appointment())

    def test_unassign_is_blocked_once_the_appointment_has_an_invoice(self):
        appt = self._appointment()
        self._assign(appt)
        Invoice.objects.create(clinic=self.clinic, patient=self.patient, appointment=appt, invoice_date=date.today())
        with self.assertRaises(ValidationError):
            package_service.unassign_appointment(self.admin, self.package, appt)
        self.assertEqual(self.package.remaining_sessions, 2)

    def test_editing_quantity_below_assigned_sessions_is_blocked(self):
        for hour in (9, 10):
            self._assign(self._appointment(hour=hour))
        with self.assertRaises(ValidationError):
            package_service.update_package(self.admin, self.package, {'items': [
                {'service': self.physio.id, 'quantity': 1}, {'service': self.consult.id, 'quantity': 1},
            ]})


class AssignApiTests(AssignmentFixtureMixin, TestCase):
    def setUp(self):
        self.build_fixture()
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def _post(self, action, appointment, package=None, **extra):
        package = package or self.package
        return self.client.post(
            f"{URL}{package.id}/{action}/", {'appointment': appointment.id, **extra}, format='json',
        )

    def test_assign_and_unassign_round_trip(self):
        appt = self._appointment()
        response = self._post('assign-appointment', appt, reason='Agreed')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['used_sessions'], 1)
        self.assertEqual(response.data['remaining_sessions'], 2)

        response = self._post('unassign-appointment', appt)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['remaining_sessions'], 3)

    def test_validation_errors_are_400_and_change_nothing(self):
        other = self._patient("Maria")
        for appt in (self._appointment(patient=other), self._appointment(self.massage, hour=11)):
            response = self._post('assign-appointment', appt)
            self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(PrivatePackageSessionUsage.objects.count(), 0)

    def test_missing_or_unknown_appointment_is_400(self):
        for body in ({}, {'appointment': 999999}, {'appointment': 'abc'}):
            response = self.client.post(f"{URL}{self.package.id}/assign-appointment/", body, format='json')
            self.assertEqual(response.status_code, 400, response.data)

    def test_only_the_four_roles_can_assign(self):
        for role, allowed in (('ADMIN_ASSISTANT', True), ('STAFF', True), ('PRACTITIONER', True),
                              ('FINANCE', False), ('READ_ONLY', False)):
            with self.subTest(role):
                self.client.force_authenticate(self._user(f"a-{role.lower()}@x.com", role))
                appt = self._appointment(hour=9 + len(role) % 7)
                response = self._post('assign-appointment', appt)
                self.assertEqual(response.status_code, 200 if allowed else 403, response.data)
                if allowed:
                    self._post('unassign-appointment', appt)

    def test_other_clinic_cannot_assign_or_unassign(self):
        appt = self._appointment()
        self._assign(appt)
        self.client.force_authenticate(self._user("out@x.com", "ADMIN", clinic=self.other_clinic))
        self.assertEqual(self._post('assign-appointment', self._appointment(hour=11)).status_code, 404)
        self.assertEqual(self._post('unassign-appointment', appt).status_code, 404)
        self.assertEqual(self.package.remaining_sessions, 2)


class LastSessionConcurrencyTests(AssignmentFixtureMixin, TransactionTestCase):
    """Two requests race for the final session; exactly one may win."""

    def setUp(self):
        self.build_fixture()

    def test_only_one_of_two_concurrent_assignments_gets_the_last_session(self):
        consult_appts = [self._appointment(self.consult, hour=9), self._appointment(self.consult, hour=10)]
        results, barrier = [], threading.Barrier(2)

        def worker(appt):
            try:
                barrier.wait(timeout=10)
                package_service.assign_appointment(self.admin, self.package, appt)
                results.append('ok')
            except ValidationError:
                results.append('rejected')
            finally:
                connection.close()

        threads = [threading.Thread(target=worker, args=(a,)) for a in consult_appts]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)

        self.assertEqual(sorted(results), ['ok', 'rejected'])
        consult_item = self.package.items.get(service=self.consult)
        self.assertEqual(consult_item.usages.count(), 1)
        self.assertEqual(consult_item.remaining, 0)

    def test_the_same_appointment_assigned_twice_concurrently_is_used_once(self):
        appt = self._appointment(self.physio)
        results, barrier = [], threading.Barrier(2)

        def worker():
            try:
                barrier.wait(timeout=10)
                package_service.assign_appointment(self.admin, self.package, appt)
                results.append('ok')
            except ValidationError:
                results.append('rejected')
            finally:
                connection.close()

        threads = [threading.Thread(target=worker) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)

        self.assertEqual(sorted(results), ['ok', 'rejected'])
        self.assertEqual(PrivatePackageSessionUsage.objects.filter(appointment=appt).count(), 1)

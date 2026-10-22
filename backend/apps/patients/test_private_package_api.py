from datetime import date, time
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User, UserBranchAccess
from apps.appointments.models import Appointment
from apps.billing.models import Invoice, Payment
from apps.clinics.models import Clinic, Practitioner
from apps.clinics.services.models import Service
from apps.patients.models import (
    Patient,
    PrivatePackageSession,
    PrivatePackageSessionUsage,
)
from apps.patients.services.merge_service import PatientMergeService

URL = '/api/private-packages/'


class PrivatePackageApiTestBase(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(name="Malasakit Health")
        self.other_clinic = Clinic.objects.create(name="Other Clinic")

        self.admin = self._user("admin@x.com", "OWNER")
        self.practitioner_user = self._user("prac@x.com", "PRACTITIONER")
        self.practitioner = Practitioner.objects.create(
            user=self.practitioner_user, clinic=self.clinic, consultation_fee=Decimal('500'),
        )

        self.physio = self._service("Physio Session", Decimal('1500'))
        self.consult = self._service("Initial Consultation", Decimal('1000'))
        self.patient = self._patient("Juan", self.clinic)

        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def _user(self, email, role, clinic=None):
        clinic = clinic or self.clinic
        user = User.objects.create_user(
            email=email, password="testpassword123", first_name="Test", last_name=role.title(),
            clinic=clinic, clinic_branch=clinic, role=role,
        )
        if role == 'BRANCH_MANAGER':   # managers see the branches they are assigned to manage
            UserBranchAccess.objects.create(user=user, branch=clinic, is_managed=True)
        return user

    def _service(self, name, price, clinic=None, **kw):
        return Service.objects.create(
            clinic=clinic or self.clinic, name=name, duration_minutes=30, price=price, **kw,
        )

    def _patient(self, first_name, clinic, **kw):
        kw.setdefault('home_branch', clinic)
        return Patient.objects.create(
            first_name=first_name, last_name="Dela Cruz", clinic=clinic,
            date_of_birth=date(1988, 5, 20), **kw,
        )

    def _payload(self, **overrides):
        data = {
            'patient': self.patient.id,
            'title': 'Rehab Program',
            'price': '12000.00',
            'notes': 'Agreed onsite',
            'items': [
                {'service': self.physio.id, 'quantity': 3},
                {'service': self.consult.id, 'quantity': 1},
            ],
        }
        data.update(overrides)
        return data

    def _create(self, **overrides):
        response = self.client.post(URL, self._payload(**overrides), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        return PrivatePackageSession.objects.get(pk=response.data['id'])

    def _appointment(self, service, status='SCHEDULED', hour=9):
        return Appointment.objects.create(
            clinic=self.clinic, patient=self.patient, practitioner=self.practitioner,
            service=service, status=status,
            date=date.today(), start_time=time(hour, 0), end_time=time(hour, 30),
        )


class CreatePackageTests(PrivatePackageApiTestBase):
    def test_create_builds_package_items_audit_and_invoice(self):
        response = self.client.post(URL, self._payload(), format='json')
        self.assertEqual(response.status_code, 201, response.data)

        package = PrivatePackageSession.objects.get(pk=response.data['id'])
        self.assertEqual(package.patient, self.patient)
        self.assertEqual(package.clinic, self.clinic)
        self.assertEqual(package.price, Decimal('12000.00'))
        self.assertEqual(package.created_by, self.admin)
        self.assertEqual(package.status, 'ACTIVE')
        self.assertEqual(package.items.count(), 2)

        self.assertEqual(response.data['total_sessions'], 4)
        self.assertEqual(response.data['used_sessions'], 0)
        self.assertEqual(response.data['remaining_sessions'], 4)
        self.assertEqual(response.data['created_by_name'], self.admin.get_full_name())

        log = package.audit_logs.get()
        self.assertEqual(log.action, 'CREATED')
        self.assertEqual(log.user, self.admin)

    def test_create_makes_one_invoice_at_the_package_price(self):
        package = self._create()
        invoice = package.invoice
        self.assertIsNotNone(invoice)
        self.assertEqual(invoice.patient, self.patient)
        self.assertIsNone(invoice.appointment)
        self.assertIsNone(invoice.patient_case)
        self.assertEqual(invoice.status, 'DRAFT')
        self.assertEqual(invoice.total_amount, Decimal('12000.00'))
        self.assertEqual(invoice.items.count(), 1)
        self.assertEqual(invoice.items.get().description, 'Package: Rehab Program')
        self.assertEqual(invoice.versions.count(), 1)
        self.assertEqual(Invoice.objects.filter(patient=self.patient).count(), 1)

    def test_package_price_overrides_service_prices(self):
        package = self._create(price='9000.00')
        self.assertEqual(package.invoice.total_amount, Decimal('9000.00'))
        self.assertNotEqual(package.invoice.total_amount, Decimal('1500') * 3 + Decimal('1000'))

    def test_free_package_creates_no_invoice(self):
        package = self._create(price='0')
        self.assertIsNone(package.invoice)
        self.assertEqual(Invoice.objects.count(), 0)

    def test_create_does_not_create_appointments_or_use_sessions(self):
        package = self._create()
        self.assertEqual(Appointment.objects.count(), 0)
        self.assertEqual(PrivatePackageSessionUsage.objects.count(), 0)
        self.assertEqual(package.remaining_sessions, 4)

    def test_creating_an_appointment_for_a_covered_service_does_not_use_a_session(self):
        package = self._create()
        self._appointment(self.physio)
        self.assertEqual(package.remaining_sessions, 4)
        self.assertEqual(PrivatePackageSessionUsage.objects.count(), 0)

    def test_validation_errors(self):
        cases = {
            'no items': (self._payload(items=[]), 'items'),
            'missing items': ({k: v for k, v in self._payload().items() if k != 'items'}, 'items'),
            'duplicate service': (self._payload(items=[
                {'service': self.physio.id, 'quantity': 1}, {'service': self.physio.id, 'quantity': 2},
            ]), 'items'),
            'zero quantity': (self._payload(items=[{'service': self.physio.id, 'quantity': 0}]), 'items'),
            'negative price': (self._payload(price='-5'), 'price'),
            'blank title': (self._payload(title='   '), 'title'),
            'unknown patient': (self._payload(patient=999999), 'patient'),
            'unknown service': (self._payload(items=[{'service': 999999, 'quantity': 1}]), 'items'),
        }
        for name, (payload, field) in cases.items():
            with self.subTest(name):
                response = self.client.post(URL, payload, format='json')
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn(field, response.data)
        self.assertEqual(PrivatePackageSession.objects.count(), 0)
        self.assertEqual(Invoice.objects.count(), 0)

    def test_inactive_deleted_and_other_clinic_services_are_rejected(self):
        inactive = self._service("Retired", Decimal('100'), is_active=False)
        deleted = self._service("Gone", Decimal('100'), is_deleted=True)
        elsewhere = self._service("Elsewhere", Decimal('100'), clinic=self.other_clinic)
        for service in (inactive, deleted, elsewhere):
            with self.subTest(service.name):
                response = self.client.post(
                    URL, self._payload(items=[{'service': service.id, 'quantity': 1}]), format='json',
                )
                self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(PrivatePackageSession.objects.count(), 0)

    def test_patient_of_another_clinic_or_archived_is_rejected(self):
        stranger = self._patient("Stranger", self.other_clinic)
        archived = self._patient("Archived", self.clinic, is_archived=True)
        for patient in (stranger, archived):
            with self.subTest(patient.first_name):
                response = self.client.post(URL, self._payload(patient=patient.id), format='json')
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn('patient', response.data)

    def test_a_failed_create_leaves_nothing_behind(self):
        response = self.client.post(URL, self._payload(
            items=[{'service': self.physio.id, 'quantity': 1}, {'service': 999999, 'quantity': 1}],
        ), format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(PrivatePackageSession.objects.count(), 0)
        self.assertEqual(Invoice.objects.count(), 0)


class BranchScopeTests(PrivatePackageApiTestBase):
    """A package is visible exactly when its patient is (same rule as the patient list)."""

    def setUp(self):
        super().setUp()
        self.branch = Clinic.objects.create(name="Branch", parent_clinic=self.clinic)
        self.main_patient = self.patient                                  # home branch: main clinic
        self.branch_patient = self._patient("Bea", self.clinic, home_branch=self.branch)
        self.main_pkg = self._create(patient=self.main_patient.id, title='Main package')
        self.branch_pkg = self._create(patient=self.branch_patient.id, title='Branch package')

    def _ids(self, user):
        self.client.force_authenticate(user)
        data = self.client.get(URL).data
        rows = data['results'] if isinstance(data, dict) and 'results' in data else data
        return {r['id'] for r in rows}

    def test_admin_sees_every_branch(self):
        self.assertEqual(self._ids(self.admin), {self.main_pkg.id, self.branch_pkg.id})

    def test_a_branch_user_sees_only_their_branchs_patients(self):
        staff = self._user("branch-staff@x.com", "STAFF", clinic=self.branch)
        self.assertEqual(self._ids(staff), {self.branch_pkg.id})
        self.assertEqual(self.client.get(f"{URL}{self.main_pkg.id}/").status_code, 404)
        self.assertEqual(self.client.get(f"{URL}{self.main_pkg.id}/history/").status_code, 404)
        self.assertEqual(self.client.patch(f"{URL}{self.main_pkg.id}/", {'notes': 'x'}, format='json').status_code, 404)
        self.assertEqual(self.client.get(f"{URL}{self.branch_pkg.id}/").status_code, 200)

    def test_a_branch_user_can_create_only_for_their_branchs_patients(self):
        staff = self._user("branch-staff@x.com", "STAFF", clinic=self.branch)
        self.client.force_authenticate(staff)
        denied = self.client.post(URL, self._payload(patient=self.main_patient.id), format='json')
        self.assertEqual(denied.status_code, 400, denied.data)
        self.assertIn('patient', denied.data)

        ok = self.client.post(URL, self._payload(patient=self.branch_patient.id, title='Another'), format='json')
        self.assertEqual(ok.status_code, 201, ok.data)
        self.assertEqual(PrivatePackageSession.objects.get(pk=ok.data['id']).clinic, self.branch)

    def test_a_branch_user_cannot_assign_appointments_of_another_branchs_package(self):
        staff = self._user("branch-staff@x.com", "STAFF", clinic=self.branch)
        self.client.force_authenticate(staff)
        appt = self._appointment(self.physio)
        response = self.client.post(f"{URL}{self.main_pkg.id}/assign-appointment/", {'appointment': appt.id}, format='json')
        self.assertEqual(response.status_code, 404)

    def test_a_manager_sees_the_branches_they_manage(self):
        manager = self._user("mgr@x.com", "BRANCH_MANAGER", clinic=self.branch)   # access: branch only
        self.assertEqual(self._ids(manager), {self.branch_pkg.id})
        UserBranchAccess.objects.create(user=manager, branch=self.clinic, is_managed=True)           # now manages both
        self.assertEqual(self._ids(manager), {self.main_pkg.id, self.branch_pkg.id})

    def test_explicit_branch_accesses_define_a_staff_users_view(self):
        """As for patients: branch accesses, when present, replace the user's own branch."""
        staff = self._user("branch-staff@x.com", "STAFF", clinic=self.branch)
        UserBranchAccess.objects.create(user=staff, branch=self.clinic)
        self.assertEqual(self._ids(staff), {self.main_pkg.id})
        UserBranchAccess.objects.create(user=staff, branch=self.branch)
        self.assertEqual(self._ids(staff), {self.main_pkg.id, self.branch_pkg.id})

    def test_package_visibility_matches_the_patient_list_for_every_kind_of_user(self):
        """Packages are visible exactly when their patient is, per the real /api/patients/ list."""
        # One Branch Manager per clinic: mgr-b manages the branch; manager_both manages the main clinic
        # and only has a plain (unmanaged) assignment at the branch.
        manager_both = self._user("mgr2@x.com", "BRANCH_MANAGER", clinic=self.clinic)
        UserBranchAccess.objects.create(user=manager_both, branch=self.branch)
        users = [
            self.admin,
            self._user("staff-b@x.com", "STAFF", clinic=self.branch),
            self._user("prac-b@x.com", "PRACTITIONER", clinic=self.branch),
            self._user("mgr-b@x.com", "BRANCH_MANAGER", clinic=self.branch),
            manager_both,
            self._user("staff-main@x.com", "STAFF"),
        ]
        for user in users:
            with self.subTest(user.email):
                self.client.force_authenticate(user)
                patients = self.client.get('/api/patients/', {'page_size': 100}).data
                rows = patients['results'] if isinstance(patients, dict) and 'results' in patients else patients
                visible_patients = {r['id'] for r in rows} & {self.main_patient.id, self.branch_patient.id}
                package_patients = {
                    PrivatePackageSession.objects.get(pk=pk).patient_id for pk in self._ids(user)
                }
                self.assertEqual(package_patients, visible_patients)

    def test_a_user_with_no_branch_sees_nothing(self):
        loner = User.objects.create_user(
            email="loner@x.com", password="testpassword123", first_name="L", last_name="N",
            clinic=self.clinic, role="STAFF",
        )
        self.assertEqual(self._ids(loner), set())


class PermissionTests(PrivatePackageApiTestBase):
    def test_owner_manager_staff_and_practitioner_can_create_and_edit(self):
        for role in ('OWNER', 'BRANCH_MANAGER', 'STAFF', 'PRACTITIONER'):
            with self.subTest(role):
                self.client.force_authenticate(self._user(f"writer-{role.lower()}@x.com", role))
                created = self.client.post(URL, self._payload(title=f'{role} package'), format='json')
                self.assertEqual(created.status_code, 201, created.data)
                edited = self.client.patch(f"{URL}{created.data['id']}/", {'notes': 'edited'}, format='json')
                self.assertEqual(edited.status_code, 200, edited.data)

    def test_finance_and_read_only_cannot_create_or_edit_but_can_view(self):
        package = self._create()
        for role in ('FINANCE', 'READ_ONLY'):
            with self.subTest(role):
                self.client.force_authenticate(self._user(f"{role.lower()}@x.com", role))
                self.assertEqual(self.client.post(URL, self._payload(), format='json').status_code, 403)
                self.assertEqual(
                    self.client.patch(f"{URL}{package.id}/", {'notes': 'x'}, format='json').status_code, 403,
                )
                self.assertEqual(self.client.get(f"{URL}{package.id}/").status_code, 200)
        self.assertEqual(PrivatePackageSession.objects.count(), 1)
        package.refresh_from_db()
        self.assertEqual(package.notes, 'Agreed onsite')

    def test_unauthenticated_access_is_denied(self):
        self.client.force_authenticate(None)
        self.assertIn(self.client.get(URL).status_code, (401, 403))
        self.assertIn(self.client.post(URL, self._payload(), format='json').status_code, (401, 403))

    def test_delete_and_put_are_not_allowed(self):
        package = self._create()
        self.assertEqual(self.client.delete(f"{URL}{package.id}/").status_code, 405)
        self.assertEqual(self.client.put(f"{URL}{package.id}/", self._payload(), format='json').status_code, 405)
        self.assertTrue(PrivatePackageSession.objects.filter(pk=package.pk).exists())

    def test_other_clinic_cannot_see_or_edit_a_package(self):
        package = self._create()
        outsider = self._user("outsider@x.com", "OWNER", clinic=self.other_clinic)
        self.client.force_authenticate(outsider)
        self.assertEqual(self.client.get(f"{URL}{package.id}/").status_code, 404)
        self.assertEqual(self.client.get(f"{URL}{package.id}/history/").status_code, 404)
        self.assertEqual(self.client.patch(f"{URL}{package.id}/", {'notes': 'x'}, format='json').status_code, 404)
        self.assertEqual(self.client.get(URL).data['results'] if 'results' in self.client.get(URL).data else self.client.get(URL).data, [])


class ListAndBalanceTests(PrivatePackageApiTestBase):
    def _rows(self, **params):
        data = self.client.get(URL, params).data
        return data['results'] if isinstance(data, dict) and 'results' in data else data

    def test_list_filters_by_patient_and_status(self):
        mine = self._create()
        other_patient = self._patient("Maria", self.clinic)
        theirs = self._create(patient=other_patient.id, title='Other')
        self.client.patch(f"{URL}{theirs.id}/", {'status': 'CANCELLED'}, format='json')

        self.assertEqual({r['id'] for r in self._rows()}, {mine.id, theirs.id})
        self.assertEqual({r['id'] for r in self._rows(patient=self.patient.id)}, {mine.id})
        self.assertEqual({r['id'] for r in self._rows(status='CANCELLED')}, {theirs.id})

    def test_list_balances_match_the_model_balances(self):
        package = self._create()
        physio_item = package.items.get(service=self.physio)
        consult_item = package.items.get(service=self.consult)

        PrivatePackageSessionUsage.objects.create(item=physio_item, appointment=self._appointment(self.physio, hour=9))
        PrivatePackageSessionUsage.objects.create(item=physio_item, appointment=self._appointment(self.physio, hour=10, status='NO_SHOW'))
        PrivatePackageSessionUsage.objects.create(item=physio_item, appointment=self._appointment(self.physio, hour=11, status='CANCELLED'))
        deleted = self._appointment(self.consult, hour=12)
        PrivatePackageSessionUsage.objects.create(item=consult_item, appointment=deleted)
        deleted.is_deleted = True
        deleted.save()

        row = self._rows()[0]
        # scheduled + no-show count; cancelled and deleted return their session
        self.assertEqual(row['used_sessions'], 2)
        self.assertEqual(row['remaining_sessions'], 2)
        self.assertEqual(row['used_sessions'], package.used_sessions)
        by_service = {i['service']: i for i in row['items']}
        self.assertEqual(by_service[self.physio.id]['used'], 2)
        self.assertEqual(by_service[self.physio.id]['remaining'], 1)
        self.assertEqual(by_service[self.consult.id]['used'], 0)
        self.assertEqual(by_service[self.consult.id]['remaining'], 1)

    def test_list_query_count_does_not_grow_with_the_number_of_packages(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        self._create(title='Package 0')
        with CaptureQueriesContext(connection) as one:
            self.assertEqual(len(self._rows()), 1)

        for i in range(1, 5):
            self._create(title=f'Package {i}')
        with CaptureQueriesContext(connection) as five:
            self.assertEqual(len(self._rows()), 5)

        self.assertEqual(len(one), len(five))


class EditPackageTests(PrivatePackageApiTestBase):
    def setUp(self):
        super().setUp()
        self.package = self._create()

    def _patch(self, data, expect=200):
        response = self.client.patch(f"{URL}{self.package.id}/", data, format='json')
        self.assertEqual(response.status_code, expect, response.data)
        self.package.refresh_from_db()
        return response

    def test_edit_title_and_notes_records_who_and_what(self):
        other = self._user("other@x.com", "STAFF")
        self.client.force_authenticate(other)
        self._patch({'title': 'Renamed', 'notes': 'New note'})

        self.assertEqual(self.package.title, 'Renamed')
        self.assertEqual(self.package.modified_by, other)
        self.assertEqual(self.package.created_by, self.admin)
        log = self.package.audit_logs.filter(action='UPDATED').get()
        self.assertEqual(log.user, other)
        self.assertEqual(log.changes['title'], {'from': 'Rehab Program', 'to': 'Renamed'})

    def test_no_change_edit_writes_no_audit_entry(self):
        before = self.package.audit_logs.count()
        self._patch({'title': 'Rehab Program', 'notes': 'Agreed onsite'})
        self.assertEqual(self.package.audit_logs.count(), before)

    def test_patient_cannot_be_changed(self):
        other_patient = self._patient("Maria", self.clinic)
        self._patch({'patient': other_patient.id, 'notes': 'x'})
        self.assertEqual(self.package.patient, self.patient)

    def test_price_change_without_payments_updates_the_invoice_and_versions_it(self):
        self._patch({'price': '10000.00'})
        invoice = self.package.invoice
        invoice.refresh_from_db()
        self.assertEqual(invoice.total_amount, Decimal('10000.00'))
        self.assertEqual(invoice.items.count(), 1)
        self.assertEqual(invoice.versions.count(), 2)

    def test_price_change_with_payments_is_rejected_and_nothing_changes(self):
        invoice = self.package.invoice
        Payment.objects.create(
            invoice=invoice, payment_date=date.today(), amount=Decimal('2000'),
            payment_method='CASH', received_by=self.admin,
        )
        audit_before = self.package.audit_logs.count()

        response = self.client.patch(
            f"{URL}{self.package.id}/", {'price': '9000.00', 'title': 'Changed'}, format='json',
        )
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn('price', response.data)

        self.package.refresh_from_db()
        invoice.refresh_from_db()
        self.assertEqual(self.package.price, Decimal('12000.00'))
        self.assertEqual(self.package.title, 'Rehab Program')  # rolled back with the price
        self.assertEqual(invoice.total_amount, Decimal('12000.00'))
        self.assertEqual(self.package.audit_logs.count(), audit_before)

    def test_title_change_on_a_paid_invoice_leaves_the_invoice_untouched(self):
        invoice = self.package.invoice
        Payment.objects.create(
            invoice=invoice, payment_date=date.today(), amount=Decimal('2000'),
            payment_method='CASH', received_by=self.admin,
        )
        self._patch({'title': 'Renamed'})
        self.assertEqual(self.package.title, 'Renamed')
        self.assertEqual(invoice.items.get().description, 'Package: Rehab Program')

    def test_price_set_on_a_free_package_creates_the_invoice(self):
        free = self._create(price='0', title='Free')
        self.assertIsNone(free.invoice)
        self.client.patch(f"{URL}{free.id}/", {'price': '500'}, format='json')
        free.refresh_from_db()
        self.assertIsNotNone(free.invoice)
        self.assertEqual(free.invoice.total_amount, Decimal('500.00'))

    def test_add_change_and_remove_items(self):
        extra = self._service("Massage", Decimal('800'))
        self._patch({'items': [
            {'service': self.physio.id, 'quantity': 5},   # 3 -> 5
            {'service': extra.id, 'quantity': 2},         # added; consult removed
        ]})
        quantities = {i.service_id: i.quantity for i in self.package.items.all()}
        self.assertEqual(quantities, {self.physio.id: 5, extra.id: 2})
        changes = self.package.audit_logs.filter(action='UPDATED').get().changes['items']
        self.assertEqual(len(changes['added']), 1)
        self.assertEqual(len(changes['removed']), 1)
        self.assertEqual(changes['quantity_changed'][0]['to'], 5)

    def test_cannot_remove_a_service_that_has_sessions_in_use(self):
        item = self.package.items.get(service=self.physio)
        PrivatePackageSessionUsage.objects.create(item=item, appointment=self._appointment(self.physio))
        response = self.client.patch(
            f"{URL}{self.package.id}/", {'items': [{'service': self.consult.id, 'quantity': 1}]}, format='json',
        )
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(self.package.items.count(), 2)

    def test_cannot_lower_quantity_below_sessions_used(self):
        item = self.package.items.get(service=self.physio)
        for hour in (9, 10):
            PrivatePackageSessionUsage.objects.create(item=item, appointment=self._appointment(self.physio, hour=hour))
        items = [{'service': self.physio.id, 'quantity': 1}, {'service': self.consult.id, 'quantity': 1}]
        self.assertEqual(self.client.patch(f"{URL}{self.package.id}/", {'items': items}, format='json').status_code, 400)

        items[0]['quantity'] = 2  # equal to used is allowed
        self.assertEqual(self.client.patch(f"{URL}{self.package.id}/", {'items': items}, format='json').status_code, 200)
        self.assertEqual(self.package.items.get(service=self.physio).quantity, 2)

    def test_a_cancelled_appointment_frees_quantity_for_lowering(self):
        item = self.package.items.get(service=self.physio)
        PrivatePackageSessionUsage.objects.create(
            item=item, appointment=self._appointment(self.physio, status='CANCELLED'),
        )
        items = [{'service': self.physio.id, 'quantity': 1}, {'service': self.consult.id, 'quantity': 1}]
        self.assertEqual(self.client.patch(f"{URL}{self.package.id}/", {'items': items}, format='json').status_code, 200)

    def test_status_change_is_audited(self):
        self._patch({'status': 'CANCELLED'})
        self.assertEqual(self.package.status, 'CANCELLED')
        log = self.package.audit_logs.filter(action='STATUS_CHANGED').get()
        self.assertEqual(log.changes['status'], {'from': 'ACTIVE', 'to': 'CANCELLED'})
        self.assertEqual(log.user, self.admin)

    def test_invalid_status_is_rejected(self):
        self._patch({'status': 'BOGUS'}, expect=400)

    def test_history_lists_created_by_and_modified_by_entries(self):
        editor = self._user("editor@x.com", "PRACTITIONER")
        self.client.force_authenticate(editor)
        self._patch({'title': 'Renamed'})

        history = self.client.get(f"{URL}{self.package.id}/history/").data
        actions = [h['action'] for h in history]
        self.assertEqual(actions, ['UPDATED', 'CREATED'])  # newest first
        self.assertEqual(history[0]['user'], editor.id)
        self.assertEqual(history[0]['user_name'], editor.get_full_name())
        self.assertEqual(history[1]['user_name'], self.admin.get_full_name())
        detail = self.client.get(f"{URL}{self.package.id}/").data
        self.assertEqual(detail['modified_by_name'], editor.get_full_name())
        self.assertEqual(detail['created_by_name'], self.admin.get_full_name())


class PatientMergeTests(PrivatePackageApiTestBase):
    def test_merge_moves_packages_to_the_primary_patient(self):
        duplicate = self._patient("Duplicate", self.clinic)
        package = self._create(patient=duplicate.id, title='Dup package')

        preview = PatientMergeService.preview_merge(self.patient.id, duplicate.id)
        self.assertEqual(preview['private_packages'], 1)

        log = PatientMergeService.execute_merge(self.patient.id, duplicate.id, self.admin, reason='test')
        package.refresh_from_db()
        self.assertEqual(package.patient, self.patient)
        self.assertEqual(log.relationships_transferred['private_package_sessions'], [package.id])

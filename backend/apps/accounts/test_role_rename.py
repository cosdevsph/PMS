"""
The 2026-10-22 rename: ADMIN -> OWNER, ADMIN_ASSISTANT -> BRANCH_MANAGER (and MANAGER template merged).

* the data migrations convert users, permission groups, the audit log and support tickets,
  and reverse cleanly;
* legacy codes are still accepted on input and are never stored or returned;
* no code outside accounts/roles.py (and migrations) uses the old codes again.
"""
import re
from importlib import import_module
from pathlib import Path

from django.apps import apps as real_apps
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APIClient

from apps.accounts.models import PermissionGroup, User
from apps.accounts.roles import normalize_role, normalize_roles
from apps.clinics.models import Clinic

BEFORE = [('accounts', '0024_user_extra_diary_branches'), ('support', '0003_remove_userfeedback_resolution_message_and_more'),
          ('appointments', '0022_appointment_patient_case')]
AFTER = [('accounts', '0025_rename_roles_owner_branch_manager'), ('support', '0004_rename_role_snapshots'),
         ('appointments', '0023_booking_source_owner')]


def _migrate(targets):
    executor = MigrationExecutor(connection)
    executor.migrate(targets)
    return MigrationExecutor(connection).loader.project_state(targets).apps


class RoleRenameMigrationTests(TransactionTestCase):
    """Builds old-style rows, migrates forward, checks, migrates back, checks."""

    def setUp(self):
        self.old = _migrate(BEFORE)
        Clinic = self.old.get_model('clinics', 'Clinic')
        User = self.old.get_model('accounts', 'User')
        Group = self.old.get_model('accounts', 'PermissionGroup')
        Log = self.old.get_model('accounts', 'UserRoleChangeLog')
        Feedback = self.old.get_model('support', 'UserFeedback')

        self.c1 = Clinic.objects.create(name='C1')
        self.c2 = Clinic.objects.create(name='C2')

        def user(email, role, roles):
            return User.objects.create(email=email, first_name='T', last_name='U', role=role, roles=roles, clinic=self.c1)

        self.owner = user('o@x.com', 'ADMIN', ['ADMIN', 'PRACTITIONER'])
        self.mgr = user('m@x.com', 'ADMIN_ASSISTANT', ['ADMIN_ASSISTANT'])
        self.both = user('b@x.com', 'ADMIN', ['ADMIN', 'ADMIN_ASSISTANT'])   # dedupes after the merge-style mapping
        self.staff = user('s@x.com', 'STAFF', ['STAFF'])

        # c1: seeded "Admin Assistant" system group. c2: a custom group already named "Branch Manager".
        Group.objects.create(clinic=self.c1, name='Admin Assistant', role_template='ADMIN_ASSISTANT',
                             is_system_template=True, description='Default Admin Assistant permission group.')
        Group.objects.create(clinic=self.c1, name='Front Managers', role_template='MANAGER')
        Group.objects.create(clinic=self.c1, name='Owner', role_template='OWNER', is_system_template=True, is_protected=True)
        Group.objects.create(clinic=self.c2, name='Branch Manager', role_template='CUSTOM')
        Group.objects.create(clinic=self.c2, name='Admin Assistant', role_template='ADMIN_ASSISTANT', is_system_template=True)
        Group.objects.create(clinic=self.c2, name='My Admin Assistant', role_template='CUSTOM')

        Log.objects.create(target_user_id=self.owner.pk, target_user_email='o@x.com', action='add', role='ADMIN',
                           roles_before=['STAFF'], roles_after=['ADMIN', 'STAFF'])
        Feedback.objects.create(submitted_by=self.owner, user_role='ADMIN', title='t', description='d')
        Feedback.objects.create(submitted_by=self.mgr, user_role='ADMIN_ASSISTANT', title='t', description='d')
        Feedback.objects.create(submitted_by=self.staff, user_role='STAFF', title='t', description='d')

    def tearDown(self):
        # leave the test database fully migrated for whatever runs next
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

    def test_forward_converts_every_table(self):
        new = _migrate(AFTER)
        User, Group = new.get_model('accounts', 'User'), new.get_model('accounts', 'PermissionGroup')
        Log, Feedback = new.get_model('accounts', 'UserRoleChangeLog'), new.get_model('support', 'UserFeedback')

        self.assertEqual(User.objects.get(email='o@x.com').role, 'OWNER')
        self.assertEqual(User.objects.get(email='o@x.com').roles, ['OWNER', 'PRACTITIONER'])
        self.assertEqual(User.objects.get(email='m@x.com').role, 'BRANCH_MANAGER')
        self.assertEqual(User.objects.get(email='m@x.com').roles, ['BRANCH_MANAGER'])
        self.assertEqual(User.objects.get(email='b@x.com').roles, ['OWNER', 'BRANCH_MANAGER'])
        self.assertEqual(User.objects.get(email='s@x.com').roles, ['STAFF'])   # untouched

        c1 = Group.objects.filter(clinic__name='C1')
        seeded = c1.get(role_template='BRANCH_MANAGER', is_system_template=True)
        self.assertEqual(seeded.name, 'Branch Manager')
        self.assertEqual(seeded.description, 'Default Branch Manager permission group.')
        self.assertEqual(c1.get(name='Front Managers').role_template, 'BRANCH_MANAGER')   # MANAGER merged, name kept
        self.assertEqual(c1.get(name='Owner').role_template, 'OWNER')

        c2 = Group.objects.filter(clinic__name='C2')
        self.assertEqual(c2.get(role_template='BRANCH_MANAGER', is_system_template=True).name, 'Branch Manager (default)')
        self.assertTrue(c2.filter(name='Branch Manager', role_template='CUSTOM').exists())   # custom group untouched
        self.assertTrue(c2.filter(name='My Admin Assistant').exists())                       # custom names are never renamed

        log = Log.objects.get()
        self.assertEqual((log.role, log.roles_before, log.roles_after), ('OWNER', ['STAFF'], ['OWNER', 'STAFF']))
        self.assertEqual(sorted(Feedback.objects.values_list('user_role', flat=True)), ['BRANCH_MANAGER', 'OWNER', 'STAFF'])
        # the unique (clinic, name) rule still holds
        self.assertEqual(len({(g.clinic_id, g.name) for g in Group.objects.all()}), Group.objects.count())

    def test_backward_restores_the_old_codes(self):
        _migrate(AFTER)
        old = _migrate(BEFORE)
        User, Group = old.get_model('accounts', 'User'), old.get_model('accounts', 'PermissionGroup')
        Log, Feedback = old.get_model('accounts', 'UserRoleChangeLog'), old.get_model('support', 'UserFeedback')
        self.assertEqual(User.objects.get(email='o@x.com').roles, ['ADMIN', 'PRACTITIONER'])
        self.assertEqual(User.objects.get(email='m@x.com').role, 'ADMIN_ASSISTANT')
        self.assertEqual(Group.objects.get(clinic__name='C1', is_system_template=True, role_template='ADMIN_ASSISTANT').name, 'Admin Assistant')
        self.assertEqual(Log.objects.get().role, 'ADMIN')
        self.assertEqual(sorted(Feedback.objects.values_list('user_role', flat=True)), ['ADMIN', 'ADMIN_ASSISTANT', 'STAFF'])

    def test_report_command_flags_legacy_codes_then_reports_clean(self):
        from io import StringIO
        from django.core.management import call_command
        from django.core.management.base import CommandError
        _migrate(AFTER)   # the real models now match the migrated schema
        out = StringIO()
        call_command('report_role_codes', '--strict', stdout=out)
        self.assertIn('No legacy role codes remain', out.getvalue())
        User.objects.filter(email='s@x.com').update(role='ADMIN')   # plant a legacy value
        with self.assertRaises(CommandError):
            call_command('report_role_codes', '--strict', stdout=StringIO())


class BookingSourceMigrationTests(TestCase):
    def test_admin_booking_source_becomes_owner_and_back(self):
        from datetime import date, time
        from decimal import Decimal
        from apps.appointments.models import Appointment
        from apps.clinics.models import Practitioner
        from apps.clinics.services.models import Service
        from apps.patients.models import Patient

        clinic = Clinic.objects.create(name='X')
        user = User.objects.create_user(email='p@x.com', password='x', first_name='P', last_name='U', clinic=clinic, role='PRACTITIONER')
        prac = Practitioner.objects.create(user=user, clinic=clinic, consultation_fee=Decimal('1'))
        svc = Service.objects.create(clinic=clinic, name='S', duration_minutes=30, price=Decimal('1'))
        patient = Patient.objects.create(first_name='A', last_name='B', clinic=clinic, home_branch=clinic, date_of_birth=date(1990, 1, 1))
        appt = Appointment.objects.create(clinic=clinic, patient=patient, practitioner=prac, service=svc, status='SCHEDULED',
                                          date=date.today(), start_time=time(9, 0), end_time=time(9, 30))
        Appointment.objects.filter(pk=appt.pk).update(booking_source='admin')

        module = import_module('apps.appointments.migrations.0023_booking_source_owner')
        module.forward(real_apps, None)
        appt.refresh_from_db()
        self.assertEqual(appt.booking_source, 'owner')
        module.backward(real_apps, None)
        appt.refresh_from_db()
        self.assertEqual(appt.booking_source, 'admin')


class LegacyCodesOnInputTests(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(name='Main')
        self.owner = User.objects.create_user(email='owner@x.com', password='x', first_name='O', last_name='U',
                                              clinic=self.clinic, clinic_branch=self.clinic, role='OWNER')
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def test_normalizers(self):
        self.assertEqual(normalize_role('ADMIN'), 'OWNER')
        self.assertEqual(normalize_role('ADMIN_ASSISTANT'), 'BRANCH_MANAGER')
        self.assertEqual(normalize_role('STAFF'), 'STAFF')
        self.assertEqual(normalize_roles(['ADMIN', 'OWNER', 'ADMIN_ASSISTANT']), ['OWNER', 'BRANCH_MANAGER'])

    def test_model_save_converts_legacy_codes(self):
        user = User.objects.create_user(email='legacy@x.com', password='x', first_name='L', last_name='U',
                                        clinic=self.clinic, role='ADMIN_ASSISTANT')
        user.refresh_from_db()
        self.assertEqual((user.role, user.roles), ('BRANCH_MANAGER', ['BRANCH_MANAGER']))
        owner = User.objects.create_user(email='legacy2@x.com', password='x', first_name='L', last_name='U',
                                         clinic=self.clinic, role='STAFF')
        owner.roles = ['ADMIN', 'PRACTITIONER']
        owner.save()
        owner.refresh_from_db()
        self.assertEqual((owner.role, owner.roles), ('OWNER', ['OWNER', 'PRACTITIONER']))
        self.assertTrue(owner.is_owner)

    def test_api_accepts_legacy_codes_but_returns_new_ones(self):
        target = User.objects.create_user(email='t@x.com', password='x', first_name='T', last_name='U',
                                          clinic=self.clinic, clinic_branch=self.clinic, role='STAFF')
        r = self.client.put(f'/api/users/{target.id}/roles/', {'roles': ['ADMIN']}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        target.refresh_from_db()
        self.assertEqual(target.roles, ['OWNER'])
        me = self.client.get(f'/api/users/{target.id}/')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['role'], 'OWNER')
        self.assertEqual(me.data['roles'], ['OWNER'])
        self.assertNotIn('is_manager', me.data)
        self.assertIn('is_branch_manager', me.data)

    def test_permission_group_template_legacy_codes_are_converted(self):
        r = self.client.post('/api/permission-groups/', {'name': 'Legacy', 'role_template': 'ADMIN_ASSISTANT', 'permissions': {}, 'clinic': self.clinic.id}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(PermissionGroup.objects.get(name='Legacy').role_template, 'BRANCH_MANAGER')

    def test_new_clinics_get_the_branch_manager_group(self):
        names = set(PermissionGroup.objects.filter(clinic=self.clinic, is_system_template=True).values_list('name', flat=True))
        self.assertIn('Branch Manager', names)
        self.assertNotIn('Admin Assistant', names)


class NoLegacyCodesInSourceTests(TestCase):
    """The old codes may only live in roles.py (aliases) and in migrations."""

    PATTERN = re.compile(r"""['"](ADMIN|ADMIN_ASSISTANT|MANAGER)['"]|\bADMIN_ASSISTANT\b|\.is_admin\b|\.is_manager\b""")

    def test_backend_source_has_no_legacy_role_codes(self):
        root = Path(__file__).resolve().parents[1]
        offenders = []
        for path in root.rglob('*.py'):
            rel = path.relative_to(root).as_posix()
            if '/migrations/' in rel or rel == 'accounts/roles.py' or rel == 'accounts/test_role_rename.py':
                continue
            if rel.startswith('accounts/management/commands/report_role_codes'):
                continue
            for number, line in enumerate(path.read_text().splitlines(), 1):
                if self.PATTERN.search(line) and 'unchanged behavior' not in line:
                    offenders.append(f'{rel}:{number}: {line.strip()[:100]}')
        self.assertEqual(offenders, [], '\n'.join(offenders))


class UnmigratedLegacyRowsTests(TestCase):
    """
    Between a code deploy and `migrate`, rows still hold ADMIN / ADMIN_ASSISTANT. They must keep
    behaving as Owner / Branch Manager and the API must never return the old codes.
    """

    def setUp(self):
        self.clinic = Clinic.objects.create(name='Legacy')

        def legacy(email, role, roles):
            user = User.objects.create_user(email=email, password='x', first_name='L', last_name='U',
                                            clinic=self.clinic, clinic_branch=self.clinic, role='STAFF')
            User.objects.filter(pk=user.pk).update(role=role, roles=roles)   # write the old codes as stored before the rename
            return User.objects.get(pk=user.pk)

        self.owner = legacy('lo@x.com', 'ADMIN', ['ADMIN'])
        self.manager = legacy('lm@x.com', 'ADMIN_ASSISTANT', ['ADMIN_ASSISTANT'])
        self.both = legacy('lb@x.com', 'ADMIN', ['ADMIN', 'PRACTITIONER'])

    def test_stored_rows_really_hold_the_old_codes(self):
        self.assertEqual(User.objects.values_list('role', flat=True).get(pk=self.owner.pk), 'ADMIN')

    def test_model_helpers_understand_legacy_rows(self):
        self.assertTrue(self.owner.is_owner)
        self.assertFalse(self.owner.is_branch_manager)
        self.assertTrue(self.manager.is_branch_manager)
        self.assertFalse(self.manager.is_owner)
        self.assertEqual(self.both.get_effective_roles(), ['OWNER', 'PRACTITIONER'])
        self.assertTrue(self.owner.can_edit('subscriptions'))        # Owner keeps full access
        self.assertFalse(self.manager.can_edit('subscriptions'))     # Branch Manager default stays restricted

    def test_api_never_returns_legacy_codes(self):
        client = APIClient()
        client.force_authenticate(self.owner)
        response = client.get('/api/users/')
        self.assertEqual(response.status_code, 200)
        rows = {row['email']: (row['role'], row['roles']) for row in response.data['results']}
        self.assertEqual(rows['lo@x.com'], ('OWNER', ['OWNER']))
        self.assertEqual(rows['lm@x.com'], ('BRANCH_MANAGER', ['BRANCH_MANAGER']))
        self.assertEqual(rows['lb@x.com'], ('OWNER', ['OWNER', 'PRACTITIONER']))

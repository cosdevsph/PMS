"""
Branch Manager rules (2026-10-22):

  Rule 1  no clinic may have two Branch Managers (a Branch Manager may manage any number of clinics)
  Rule 2  a Branch Manager always manages (edit) the staff of their own clinics
  The Owner has no permission settings: the Owner group is hidden, locked and not assignable.
"""
from django.db import IntegrityError, connection, transaction
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APIClient

from apps.accounts.models import FeaturePermission, PermissionGroup, User, UserBranchAccess
from apps.clinics.models import Clinic

USERS = '/api/users/'
GROUPS = '/api/permission-groups/'
PHONE = '+639171234567'


class BranchManagerTestBase(TestCase):
    """Clinic 1 (main), Clinic 2 and Clinic 3 in one clinic group."""

    def setUp(self):
        self.c1 = Clinic.objects.create(name='Clinic 1')
        self.c2 = Clinic.objects.create(name='Clinic 2', parent_clinic=self.c1, is_main_branch=False)
        self.c3 = Clinic.objects.create(name='Clinic 3', parent_clinic=self.c1, is_main_branch=False)
        self.owner = self._user('owner@x.com', 'OWNER')
        self.client = APIClient()

    def _user(self, email, role, branch=None, roles=None):
        user = User.objects.create_user(email=email, password='x', first_name=email.split('@')[0].title(), last_name='User',
                                        clinic=self.c1, clinic_branch=branch or self.c1, role=role, phone=PHONE)
        if roles:
            user.roles = roles
            user.save()
        return user

    def _manager(self, email, *clinics):
        """A Branch Manager who manages `clinics`."""
        manager = self._user(email, 'BRANCH_MANAGER', branch=clinics[0])
        for clinic in clinics:
            UserBranchAccess.objects.create(user=manager, branch=clinic, is_managed=True)
        return manager

    def as_(self, user):
        self.client.force_authenticate(user)
        return self.client

    def managed(self, user):
        return set(UserBranchAccess.objects.filter(user=user, is_managed=True).values_list('branch__name', flat=True))

    def create_staff(self, actor, email, **extra):
        data = {'email': email, 'first_name': 'New', 'last_name': 'Staff', 'role': 'STAFF', 'roles': ['STAFF'], 'phone': PHONE}
        data.update(extra)
        return self.as_(actor).post(USERS, data, format='json')


class OneBranchManagerPerClinicTests(BranchManagerTestBase):
    def test_a_branch_manager_can_manage_several_clinics(self):
        bm1 = self._manager('bm1@x.com', self.c1, self.c2)
        bm2 = self._manager('bm2@x.com', self.c3)
        self.assertEqual(self.managed(bm1), {'Clinic 1', 'Clinic 2'})
        self.assertEqual(self.managed(bm2), {'Clinic 3'})
        self.assertEqual(set(bm1.get_managed_branches().values_list('name', flat=True)), {'Clinic 1', 'Clinic 2'})

    def test_database_refuses_a_second_manager_of_a_clinic(self):
        self._manager('bm1@x.com', self.c1)
        other = self._user('bm2@x.com', 'BRANCH_MANAGER')
        with self.assertRaises(IntegrityError), transaction.atomic():
            UserBranchAccess.objects.create(user=other, branch=self.c1, is_managed=True)

    def test_owner_cannot_give_a_managed_clinic_to_another_branch_manager(self):
        self._manager('bm1@x.com', self.c1, self.c2)
        bm2 = self._manager('bm2@x.com', self.c3)
        r = self.as_(self.owner).patch(f'{USERS}{bm2.id}/', {'branch_ids': [self.c3.id, self.c2.id]}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('already has a Branch Manager', str(r.data))
        self.assertIn('Bm1', str(r.data))                      # names the current manager
        self.assertEqual(self.managed(bm2), {'Clinic 3'})      # unchanged

    def test_creating_a_branch_manager_for_a_taken_clinic_is_refused(self):
        self._manager('bm1@x.com', self.c2)
        r = self.create_staff(self.owner, 'bm3@x.com', role='BRANCH_MANAGER', roles=['BRANCH_MANAGER'],
                              clinic_branch=self.c2.id, branch_ids=[self.c2.id])
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertFalse(User.objects.filter(email='bm3@x.com').exists())

    def test_the_same_manager_can_be_saved_again_with_their_own_clinics(self):
        bm1 = self._manager('bm1@x.com', self.c1, self.c2)
        r = self.as_(self.owner).patch(f'{USERS}{bm1.id}/', {'branch_ids': [self.c1.id, self.c2.id]}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.managed(bm1), {'Clinic 1', 'Clinic 2'})

    def test_owner_can_move_a_clinic_from_one_manager_to_another_in_two_steps(self):
        bm1 = self._manager('bm1@x.com', self.c1, self.c2)
        bm2 = self._manager('bm2@x.com', self.c3)
        self.assertEqual(self.as_(self.owner).patch(f'{USERS}{bm1.id}/', {'branch_ids': [self.c1.id]}, format='json').status_code, 200)
        self.assertEqual(self.as_(self.owner).patch(f'{USERS}{bm2.id}/', {'branch_ids': [self.c3.id, self.c2.id]}, format='json').status_code, 200)
        self.assertEqual(self.managed(bm1), {'Clinic 1'})
        self.assertEqual(self.managed(bm2), {'Clinic 2', 'Clinic 3'})

    def test_roles_endpoint_applies_the_rule_and_rolls_back(self):
        self._manager('bm1@x.com', self.c2)
        staff = self._user('s@x.com', 'STAFF')
        r = self.as_(self.owner).put(f'{USERS}{staff.id}/roles/', {'roles': ['BRANCH_MANAGER'], 'branch_ids': [self.c2.id]}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        staff.refresh_from_db()
        self.assertEqual(staff.roles, ['STAFF'])                # the role change was rolled back too
        ok = self.as_(self.owner).put(f'{USERS}{staff.id}/roles/', {'roles': ['BRANCH_MANAGER'], 'branch_ids': [self.c3.id]}, format='json')
        self.assertEqual(ok.status_code, 200, getattr(ok, 'data', None))
        self.assertEqual(self.managed(staff), {'Clinic 3'})

    def test_removing_the_role_frees_the_clinics(self):
        bm1 = self._manager('bm1@x.com', self.c1, self.c2)
        self.assertEqual(self.as_(self.owner).put(f'{USERS}{bm1.id}/roles/', {'roles': ['STAFF']}, format='json').status_code, 200)
        self.assertEqual(self.managed(bm1), set())
        bm2 = self._manager('bm2@x.com', self.c2)               # now allowed
        self.assertEqual(self.managed(bm2), {'Clinic 2'})

    def test_archiving_a_branch_manager_frees_the_clinics(self):
        bm1 = self._manager('bm1@x.com', self.c2)
        r = self.as_(self.owner).delete(f'{USERS}{bm1.id}/')
        self.assertIn(r.status_code, (200, 204), getattr(r, 'data', None))
        self.assertEqual(self.managed(bm1), set())
        self._manager('bm2@x.com', self.c2)

    def test_a_practitioner_assignment_is_not_management(self):
        """A Branch Manager who also practises at Clinic 3 does not manage it, so another manager may."""
        bm1 = self._manager('bm1@x.com', self.c1)
        bm1.roles = ['BRANCH_MANAGER', 'PRACTITIONER']
        bm1.save()
        UserBranchAccess.objects.create(user=bm1, branch=self.c3)            # practitioner assignment, not managed
        self.assertEqual(self.managed(bm1), {'Clinic 1'})
        self.assertEqual(set(bm1.get_managed_branches().values_list('name', flat=True)), {'Clinic 1'})
        self._manager('bm2@x.com', self.c3)                                 # allowed

    def test_syncing_keeps_a_practitioner_row_when_management_ends(self):
        from apps.accounts.serializers import UserSerializer
        bm1 = self._manager('bm1@x.com', self.c1, self.c2)
        bm1.roles = ['BRANCH_MANAGER', 'PRACTITIONER']
        bm1.save()
        UserSerializer._sync_branch_accesses(bm1, [self.c1.id])
        self.assertEqual(self.managed(bm1), {'Clinic 1'})
        self.assertTrue(UserBranchAccess.objects.filter(user=bm1, branch=self.c2, is_managed=False).exists())


class BranchManagerStaffTests(BranchManagerTestBase):
    def setUp(self):
        super().setUp()
        self.bm1 = self._manager('bm1@x.com', self.c1, self.c2)   # Branch Manager 1: Clinic 1 + Clinic 2
        self.bm2 = self._manager('bm2@x.com', self.c3)            # Branch Manager 2: Clinic 3

    def test_branch_manager_adds_staff_to_each_of_their_clinics(self):
        for clinic in (self.c1, self.c2):
            r = self.create_staff(self.bm1, f'staff{clinic.id}@x.com', clinic_branch=clinic.id)
            self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
            self.assertEqual(User.objects.get(email=f'staff{clinic.id}@x.com').clinic_branch_id, clinic.id)

    def test_branch_manager_cannot_add_staff_to_a_clinic_they_do_not_manage(self):
        r = self.create_staff(self.bm1, 'x@x.com', clinic_branch=self.c3.id)
        self.assertEqual(r.status_code, 403, getattr(r, 'data', None))
        self.assertFalse(User.objects.filter(email='x@x.com').exists())

    def test_default_clinic_is_the_managers_primary_clinic(self):
        r = self.create_staff(self.bm1, 'd@x.com')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(User.objects.get(email='d@x.com').clinic_branch_id, self.c1.id)

    def test_branch_manager_moves_staff_between_their_own_clinics_only(self):
        staff = self._user('s@x.com', 'STAFF', branch=self.c1)
        self.assertEqual(self.as_(self.bm1).patch(f'{USERS}{staff.id}/', {'clinic_branch': self.c2.id}, format='json').status_code, 200)
        staff.refresh_from_db()
        self.assertEqual(staff.clinic_branch_id, self.c2.id)
        r = self.as_(self.bm1).patch(f'{USERS}{staff.id}/', {'clinic_branch': self.c3.id}, format='json')
        self.assertIn(r.status_code, (400, 403), getattr(r, 'data', None))
        staff.refresh_from_db()
        self.assertEqual(staff.clinic_branch_id, self.c2.id)

    def test_branch_manager_cannot_reach_staff_of_another_managers_clinic(self):
        other = self._user('o@x.com', 'STAFF', branch=self.c3)
        r = self.as_(self.bm1).patch(f'{USERS}{other.id}/', {'position': 'Hacked'}, format='json')
        self.assertIn(r.status_code, (403, 404))

    def test_branch_manager_cannot_change_which_clinics_they_manage(self):
        r = self.as_(self.bm1).patch(f'{USERS}{self.bm1.id}/', {'position': 'Lead', 'branch_ids': [self.c1.id, self.c2.id, self.c3.id]}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.managed(self.bm1), {'Clinic 1', 'Clinic 2'})

    def test_staff_edit_is_always_on_whatever_the_permission_group_says(self):
        group = PermissionGroup.objects.create(clinic=self.c1, name='Locked down', role_template='CUSTOM')
        for key in ('staff_management', 'setup_users', 'permissions', 'subscriptions'):
            FeaturePermission.objects.create(group=group, feature_key=key, access_level='none')
        self.bm1.permission_group = group
        self.bm1.save()
        self.assertTrue(self.bm1.can_edit('staff_management'))
        self.assertTrue(self.bm1.can_edit('setup_users'))
        self.assertFalse(self.bm1.can_edit('subscriptions'))     # everything else still follows the group
        self.assertFalse(self.bm1.can_edit('permissions'))
        me = self.as_(self.bm1).get(f'{USERS}{self.bm1.id}/')
        self.assertEqual(me.data['permissions_map']['staff_management'], 'edit')
        self.assertEqual(me.data['permissions_map']['setup_users'], 'edit')
        self.assertEqual(me.data['permissions_map']['subscriptions'], 'none')
        self.assertEqual(self.create_staff(self.bm1, 'ok@x.com').status_code, 201)

    def test_branch_manager_cannot_create_owner_or_branch_manager(self):
        for roles in (['OWNER'], ['BRANCH_MANAGER']):
            r = self.create_staff(self.bm1, f'bad{roles[0]}@x.com', role=roles[0], roles=roles)
            self.assertEqual(r.status_code, 403)

    def test_branch_manager_cannot_use_the_owner_group_or_change_their_own_group(self):
        owner_group = PermissionGroup.objects.get(clinic=self.c1, role_template='OWNER', is_system_template=True)
        staff = self._user('s@x.com', 'STAFF', branch=self.c1)
        r = self.as_(self.bm1).patch(f'{USERS}{staff.id}/', {'permission_group': owner_group.id}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        other = PermissionGroup.objects.create(clinic=self.c1, name='Other', role_template='CUSTOM')
        r = self.as_(self.bm1).patch(f'{USERS}{self.bm1.id}/', {'permission_group': other.id}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))

    def test_staff_can_still_not_manage_staff(self):
        staff = self._user('s@x.com', 'STAFF', branch=self.c1)
        self.assertEqual(self.create_staff(staff, 'n@x.com').status_code, 403)


class OwnerHasNoPermissionSettingsTests(BranchManagerTestBase):
    def setUp(self):
        super().setUp()
        self.owner_group = PermissionGroup.objects.get(clinic=self.c1, role_template='OWNER', is_system_template=True)
        self.bm = self._manager('bm@x.com', self.c1)

    def test_owner_group_is_not_listed_or_opened(self):
        for actor in (self.owner, self.bm):
            r = self.as_(actor).get(GROUPS)
            names = [g['name'] for g in (r.data['results'] if isinstance(r.data, dict) else r.data)]
            self.assertNotIn('Owner', names)
            self.assertEqual(self.as_(actor).get(f'{GROUPS}{self.owner_group.id}/').status_code, 404)

    def test_nobody_can_change_delete_or_duplicate_it(self):
        c = self.as_(self.owner)
        self.assertEqual(c.patch(f'{GROUPS}{self.owner_group.id}/', {'permissions': {'diary': 'none'}}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'{GROUPS}{self.owner_group.id}/').status_code, 403)
        self.assertEqual(c.post(f'{GROUPS}{self.owner_group.id}/duplicate/', {'name': 'Copy'}, format='json').status_code, 403)
        self.assertEqual(self.owner_group.get_permission('diary'), 'edit')

    def test_no_new_owner_template_group(self):
        r = self.as_(self.owner).post(GROUPS, {'name': 'Another owner', 'role_template': 'OWNER', 'permissions': {}, 'clinic': self.c1.id}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertFalse(PermissionGroup.objects.filter(name='Another owner').exists())

    def test_the_owner_group_cannot_be_assigned_and_owners_take_no_group(self):
        staff = self._user('s@x.com', 'STAFF')
        r = self.as_(self.owner).post(f'{GROUPS}{self.owner_group.id}/assign-user/', {'user_id': staff.id}, format='json')
        self.assertEqual(r.status_code, 400)
        normal = PermissionGroup.objects.create(clinic=self.c1, name='Normal', role_template='CUSTOM')
        r = self.as_(self.owner).post(f'{GROUPS}{normal.id}/assign-user/', {'user_id': self.owner.id}, format='json')
        self.assertEqual(r.status_code, 400)
        ok = self.as_(self.owner).post(f'{GROUPS}{normal.id}/assign-user/', {'user_id': staff.id}, format='json')
        self.assertEqual(ok.status_code, 200, getattr(ok, 'data', None))

    def test_owner_always_has_full_access(self):
        self.assertTrue(self.owner.can_edit('subscriptions'))
        self.assertTrue(self.owner.can_edit('permissions'))
        me = self.as_(self.owner).get(f'{USERS}{self.owner.id}/')
        self.assertEqual(set(me.data['permissions_map'].values()), {'edit'})


NO_ROLE_RENAME = [('accounts', '0025_rename_roles_owner_branch_manager')]
WITH_MANAGED = [('accounts', '0027_one_branch_manager_per_clinic')]


class ManagedClinicsMigrationTests(TransactionTestCase):
    """The backfill marks a Branch Manager's existing rows as managed, and stops on duplicates."""

    def setUp(self):
        executor = MigrationExecutor(connection)
        executor.migrate(NO_ROLE_RENAME)
        self.old = MigrationExecutor(connection).loader.project_state(NO_ROLE_RENAME).apps
        Clinic, User, Row = (self.old.get_model('clinics', 'Clinic'), self.old.get_model('accounts', 'User'),
                             self.old.get_model('accounts', 'UserBranchAccess'))
        self.a = Clinic.objects.create(name='A')
        self.b = Clinic.objects.create(name='B')
        self.c = Clinic.objects.create(name='C')

        def user(email, role, roles, deleted=False):
            return User.objects.create(email=email, first_name='T', last_name='U', role=role, roles=roles, clinic=self.a, is_deleted=deleted)

        self.bm = user('bm@x.com', 'BRANCH_MANAGER', ['BRANCH_MANAGER'])
        self.staff = user('st@x.com', 'STAFF', ['STAFF'])
        self.gone = user('gone@x.com', 'BRANCH_MANAGER', ['BRANCH_MANAGER'], deleted=True)
        Row.objects.create(user=self.bm, branch=self.a)
        Row.objects.create(user=self.bm, branch=self.b)
        Row.objects.create(user=self.staff, branch=self.c)
        Row.objects.create(user=self.gone, branch=self.a)        # an archived manager must not block the clinic
        self.Row = Row

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

    def test_backfill_marks_only_live_branch_manager_rows(self):
        MigrationExecutor(connection).migrate(WITH_MANAGED)
        rows = MigrationExecutor(connection).loader.project_state(WITH_MANAGED).apps.get_model('accounts', 'UserBranchAccess')
        managed = sorted(rows.objects.filter(is_managed=True).values_list('branch__name', flat=True))
        self.assertEqual(managed, ['A', 'B'])
        self.assertFalse(rows.objects.get(user__email='st@x.com').is_managed)
        self.assertFalse(rows.objects.get(user__email='gone@x.com').is_managed)

    def test_migration_stops_with_a_clear_list_when_a_clinic_has_two_managers(self):
        User = self.old.get_model('accounts', 'User')
        other = User.objects.create(email='bm2@x.com', first_name='T', last_name='U', role='BRANCH_MANAGER', roles=['BRANCH_MANAGER'], clinic=self.a)
        self.Row.objects.create(user=other, branch=self.b)
        with self.assertRaises(RuntimeError) as ctx:
            MigrationExecutor(connection).migrate([('accounts', '0026_user_branch_access_is_managed')])
        message = str(ctx.exception)
        self.assertIn('clinic "B"', message)
        self.assertIn('bm@x.com', message)
        self.assertIn('bm2@x.com', message)
        self.assertIn('Nothing was changed', message)
        # nothing was applied: the column does not exist
        with connection.cursor() as cursor:
            columns = [c.name for c in connection.introspection.get_table_description(cursor, 'user_branch_access')]
        self.assertNotIn('is_managed', columns)
        # resolve the duplicate (as the owner would) so the teardown can migrate fully
        self.Row.objects.filter(user=other).delete()

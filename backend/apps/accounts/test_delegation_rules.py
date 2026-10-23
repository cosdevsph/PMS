"""
Delegation limits (client feedback, 2026-10-23).

  1. Only the Owner and Branch Managers grant access.
  2. A clinic added to a user widens WHERE they work, never WHAT they may do (Frontdesk / Finance too).
  3. A Branch Manager delegates only to the clinics they manage and never above their own level:
     - a group's levels may not be raised above the Branch Manager's own levels;
     - permission groups are shared by the whole clinic group, so a Branch Manager may change one only
       when every member works at clinics they manage;
     - they set groups only for their own staff.
"""
from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import FeaturePermission, PermissionGroup, User, UserBranchAccess
from apps.accounts.utils.rbac import get_allowed_branches
from apps.clinics.models import Clinic
from apps.patients.models import Patient
from apps.subscriptions.services import get_clinician_allocations_for_clinic

USERS = '/api/users/'
GROUPS = '/api/permission-groups/'
PHONE = '+639171234567'


class DelegationBase(TestCase):
    """Clinic 1 (main), 2, 3. bm1 manages 1 + 2 (Diary edit, Patients view, no Reports); bm3 manages 3."""

    def setUp(self):
        self.c1 = Clinic.objects.create(name='Clinic 1')
        self.c2 = Clinic.objects.create(name='Clinic 2', parent_clinic=self.c1, is_main_branch=False)
        self.c3 = Clinic.objects.create(name='Clinic 3', parent_clinic=self.c1, is_main_branch=False)
        self.owner = self._user('owner@x.com', 'OWNER')
        self.bm_group = self._group('BM levels', 'BRANCH_MANAGER',
                                    {'diary': 'edit', 'patients': 'view', 'reports': 'none', 'permissions': 'none'})
        self.bm1 = self._manager('bm1@x.com', self.c1, self.c2)
        self.bm3 = self._manager('bm3@x.com', self.c3)
        seeded = {g.role_template: g for g in PermissionGroup.objects.filter(clinic=self.c1, is_system_template=True)}
        self.frontdesk = seeded['FRONTDESK']
        self.client = APIClient()

    def _user(self, email, role, branch=None, group=None):
        return User.objects.create_user(email=email, password='x', first_name=email.split('@')[0].title(), last_name='User',
                                        clinic=self.c1, clinic_branch=branch or self.c1, role=role, phone=PHONE,
                                        permission_group=group)

    def _manager(self, email, *clinics):
        manager = self._user(email, 'BRANCH_MANAGER', branch=clinics[0], group=self.bm_group)
        for clinic in clinics:
            UserBranchAccess.objects.create(user=manager, branch=clinic, is_managed=True)
        return manager

    def _group(self, name, template, rows):
        group = PermissionGroup.objects.create(clinic=self.c1, name=name, role_template=template)
        for key, level in rows.items():
            FeaturePermission.objects.create(group=group, feature_key=key, access_level=level)
        return group

    def _work_at(self, user, *clinics):
        for clinic in clinics:
            UserBranchAccess.objects.create(user=user, branch=clinic, is_active=True)

    def as_(self, user):
        self.client.force_authenticate(user)
        return self.client

    def levels(self, group):
        return group.get_permissions_dict()


class CeilingTests(DelegationBase):
    def test_a_branch_manager_cannot_raise_a_level_above_their_own(self):
        current = self.levels(self.frontdesk)
        r = self.as_(self.bm1).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {**current, 'reports': 'edit'}}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('Reports', str(r.data))
        self.assertEqual(self.levels(self.frontdesk), current)

    def test_unchanged_rows_above_their_level_may_stay_and_be_lowered(self):
        self.frontdesk.feature_permissions.update_or_create(feature_key='invoices', defaults={'access_level': 'edit'})
        current = self.levels(self.frontdesk)                 # invoices edit: above bm1 (none)
        r = self.as_(self.bm1).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {**current, 'diary': 'view'}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        r = self.as_(self.bm1).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {**current, 'invoices': 'view'}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.levels(self.frontdesk)['invoices'], 'view')

    def test_creating_a_group_above_their_level_is_refused(self):
        r = self.as_(self.bm1).post(GROUPS, {'name': 'Desk+', 'role_template': 'FRONTDESK', 'permissions': {'reports': 'view'}}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        r = self.as_(self.bm1).post(GROUPS, {'name': 'Desk', 'role_template': 'FRONTDESK', 'permissions': {'diary': 'edit'}}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))

    def test_a_branch_managers_copy_is_capped_to_their_levels(self):
        self.frontdesk.feature_permissions.update_or_create(feature_key='reports', defaults={'access_level': 'edit'})
        r = self.as_(self.bm1).post(f'{GROUPS}{self.frontdesk.id}/duplicate/', {'name': 'Desk copy'}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertIn('reports', r.data['lowered_features'])
        self.assertEqual(PermissionGroup.objects.get(pk=r.data['id']).get_permission('reports'), 'none')

    def test_the_owner_has_no_ceiling(self):
        r = self.as_(self.owner).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {'reports': 'edit'}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))

    def test_a_branch_manager_needs_no_owner_switch_to_manage_frontdesk(self):
        self.assertEqual(self.bm_group.get_permission('permissions'), 'none')
        r = self.as_(self.bm1).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {'diary': 'view'}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))


class SharedGroupTests(DelegationBase):
    def test_a_group_used_at_another_managers_clinic_is_locked_for_a_branch_manager(self):
        self._user('desk3@x.com', 'STAFF', branch=self.c3, group=self.frontdesk)
        r = self.as_(self.bm1).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {'diary': 'view'}}, format='json')
        self.assertEqual(r.status_code, 403, getattr(r, 'data', None))
        self.assertIn('Duplicate it', str(r.data))
        self.assertEqual(self.as_(self.bm1).delete(f'{GROUPS}{self.frontdesk.id}/').status_code, 403)
        listed = {g['id']: g for g in self.as_(self.bm1).get(GROUPS).data['results']}
        self.assertIsNotNone(listed[self.frontdesk.id]['locked_reason'])

    def test_a_shared_staff_member_also_locks_the_group(self):
        desk = self._user('desk@x.com', 'STAFF', branch=self.c1, group=self.frontdesk)
        self._work_at(desk, self.c1, self.c3)
        r = self.as_(self.bm1).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {'diary': 'view'}}, format='json')
        self.assertEqual(r.status_code, 403, getattr(r, 'data', None))

    def test_a_group_of_only_their_staff_stays_editable(self):
        self._user('desk1@x.com', 'STAFF', branch=self.c1, group=self.frontdesk)
        self._user('desk2@x.com', 'STAFF', branch=self.c2, group=self.frontdesk)
        r = self.as_(self.bm1).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {'diary': 'view'}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        listed = {g['id']: g for g in self.as_(self.bm1).get(GROUPS).data['results']}
        self.assertIsNone(listed[self.frontdesk.id]['locked_reason'])

    def test_the_owner_can_change_a_shared_group(self):
        self._user('desk3@x.com', 'STAFF', branch=self.c3, group=self.frontdesk)
        r = self.as_(self.owner).patch(f'{GROUPS}{self.frontdesk.id}/', {'permissions': {'diary': 'view'}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        listed = {g['id']: g for g in self.as_(self.owner).get(GROUPS).data['results']}
        self.assertIsNone(listed[self.frontdesk.id]['locked_reason'])


class AssignUserScopeTests(DelegationBase):
    def _assign(self, actor, user):
        return self.as_(actor).post(f'{GROUPS}{self.frontdesk.id}/assign-user/', {'user_id': user.id}, format='json')

    def test_a_branch_manager_sets_groups_only_for_their_own_staff(self):
        mine = self._user('desk1@x.com', 'STAFF', branch=self.c2)
        theirs = self._user('desk3@x.com', 'STAFF', branch=self.c3)
        shared = self._user('shared@x.com', 'STAFF', branch=self.c1)
        self._work_at(shared, self.c1, self.c3)
        self.assertEqual(self._assign(self.bm1, mine).status_code, 200)
        self.assertEqual(self._assign(self.bm1, theirs).status_code, 403)
        self.assertEqual(self._assign(self.bm1, shared).status_code, 403)
        self.assertEqual(self._assign(self.owner, theirs).status_code, 200)

    def test_staff_list_drops_someone_removed_from_their_clinic(self):
        moved = self._user('moved@x.com', 'STAFF', branch=self.c3)
        UserBranchAccess.objects.create(user=moved, branch=self.c2, is_active=False)
        emails = {u['email'] for u in self.as_(self.bm1).get(USERS).data['results']}
        self.assertNotIn('moved@x.com', emails)
        UserBranchAccess.objects.filter(user=moved, branch=self.c2).update(is_active=True)
        emails = {u['email'] for u in self.as_(self.bm1).get(USERS).data['results']}
        self.assertIn('moved@x.com', emails)


class StaffClinicsTests(DelegationBase):
    """Frontdesk / Finance at several clinics: same role permissions, wider clinic scope."""

    def setUp(self):
        super().setUp()
        self.desk = self._user('desk@x.com', 'STAFF', branch=self.c1)
        self.patient3 = Patient.objects.create(first_name='Ana', last_name='AtThree', clinic=self.c1, home_branch=self.c3,
                                               date_of_birth=date(1990, 1, 2))

    def patch(self, actor, ids, user=None):
        return self.as_(actor).patch(f'{USERS}{(user or self.desk).id}/', {'work_branch_ids': ids}, format='json')

    def clinics(self, user=None):
        return set(UserBranchAccess.objects.filter(user=user or self.desk, is_active=True).values_list('branch__name', flat=True))

    def patient_ids(self, user):
        r = self.as_(user).get('/api/patients/')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        rows = r.data['results'] if isinstance(r.data, dict) and 'results' in r.data else r.data
        return {row['id'] for row in rows}

    def test_owner_gives_any_clinic_and_access_follows(self):
        self.assertNotIn(self.patient3.id, self.patient_ids(self.desk))
        r = self.patch(self.owner, [self.c1.id, self.c3.id])
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.clinics(), {'Clinic 1', 'Clinic 3'})
        self.assertEqual(set(get_allowed_branches(self.desk)), {self.c1.id, self.c3.id})
        self.assertIn(self.patient3.id, self.patient_ids(self.desk))
        # role permissions unchanged
        self.desk.refresh_from_db()
        self.assertIsNone(self.desk.permission_group_id)

    def test_removing_a_clinic_removes_access(self):
        self.patch(self.owner, [self.c1.id, self.c3.id])
        r = self.patch(self.owner, [self.c1.id])
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.clinics(), {'Clinic 1'})
        self.assertNotIn(self.patient3.id, self.patient_ids(self.desk))

    def test_branch_manager_adds_only_their_own_clinics(self):
        self.assertEqual(self.patch(self.bm1, [self.c1.id, self.c2.id]).status_code, 200)
        self.assertEqual(self.clinics(), {'Clinic 1', 'Clinic 2'})
        r = self.patch(self.bm1, [self.c1.id, self.c2.id, self.c3.id])
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertEqual(self.clinics(), {'Clinic 1', 'Clinic 2'})

    def test_branch_manager_keeps_another_managers_clinic_as_it_is(self):
        self.patch(self.owner, [self.c1.id, self.c3.id])
        self.assertEqual(self.patch(self.bm1, [self.c1.id, self.c3.id, self.c2.id]).status_code, 200)
        r = self.patch(self.bm1, [self.c1.id, self.c2.id])            # would drop Clinic 3
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertEqual(self.clinics(), {'Clinic 1', 'Clinic 2', 'Clinic 3'})

    def test_branch_manager_cannot_move_the_home_clinic_to_a_foreign_one(self):
        self.patch(self.owner, [self.c1.id, self.c3.id])
        r = self.patch(self.bm1, [self.c3.id, self.c1.id])
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))

    def test_branch_manager_creates_frontdesk_for_two_of_their_clinics(self):
        r = self.as_(self.bm1).post(USERS, {
            'email': 'new@x.com', 'first_name': 'New', 'last_name': 'Desk', 'role': 'STAFF', 'roles': ['STAFF'],
            'phone': PHONE, 'clinic_branch': self.c1.id, 'work_branch_ids': [self.c1.id, self.c2.id]}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(self.clinics(User.objects.get(email='new@x.com')), {'Clinic 1', 'Clinic 2'})

    def test_finance_can_have_several_clinics_too(self):
        fin = self._user('fin@x.com', 'FINANCE', branch=self.c1)
        self.assertEqual(self.patch(self.owner, [self.c1.id, self.c2.id], user=fin).status_code, 200)
        self.assertEqual(self.clinics(fin), {'Clinic 1', 'Clinic 2'})

    def test_not_for_practitioners_or_branch_managers(self):
        dr = self._user('dr@x.com', 'PRACTITIONER', branch=self.c1)
        self.assertEqual(self.patch(self.owner, [self.c1.id, self.c2.id], user=dr).status_code, 400)
        self.assertEqual(self.patch(self.owner, [self.c1.id], user=self.bm3).status_code, 400)

    def test_staff_clinics_never_cost_a_clinician_seat(self):
        self.patch(self.owner, [self.c1.id, self.c2.id, self.c3.id])
        self.assertEqual(get_clinician_allocations_for_clinic(self.c1)['total_allocations'], 0)

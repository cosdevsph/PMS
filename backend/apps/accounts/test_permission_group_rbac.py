from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import FeaturePermission, PermissionGroup, User, UserBranchAccess
from apps.clinics.models import Clinic

URL = '/api/permission-groups/'


class PermissionGroupRbacTests(TestCase):
    """Who may change permission groups, and the self-escalation hole (a user editing their own group)."""

    def setUp(self):
        self.clinic = Clinic.objects.create(name="Main Clinic")
        self.owner = self._user("owner@x.com", "OWNER")
        self.owner_group = self._group("T Owner", 'OWNER', {'permissions': 'edit'})
        self.manager_group = self._group("T Manager", 'BRANCH_MANAGER', {'permissions': 'none', 'diary': 'edit'})
        self.staff_group = self._group("T Frontdesk", 'FRONTDESK', {'permissions': 'none'})
        self.admin_manager_group = self._group("T Manager+", 'CUSTOM', {'permissions': 'edit', 'diary': 'edit'})
        self.manager = self._user("manager@x.com", "BRANCH_MANAGER", self.manager_group)
        self.staff = self._user("staff@x.com", "STAFF", self.staff_group)
        self.trusted = self._user("trusted@x.com", "BRANCH_MANAGER", self.admin_manager_group)
        self.client = APIClient()

    def _user(self, email, role, group=None):
        return User.objects.create_user(
            email=email, password="testpassword123", first_name="T", last_name=role.title(),
            clinic=self.clinic, clinic_branch=self.clinic, role=role, permission_group=group)

    def _group(self, name, template, rows):
        group = PermissionGroup.objects.create(clinic=self.clinic, name=name, role_template=template)
        for key, level in rows.items():
            FeaturePermission.objects.create(group=group, feature_key=key, access_level=level)
        return group

    def as_(self, user):
        self.client.force_authenticate(user)
        return self.client

    def _grant_self(self, user, group):
        return self.as_(user).patch(f'{URL}{group.id}/', {'permissions': {'permissions': 'edit', 'subscriptions': 'edit'}}, format='json')

    def level(self, group, key):
        return group.get_permission(key)

    # ── the escalation bug ────────────────────────────────────────────────────
    def test_manager_cannot_edit_their_own_group(self):
        r = self._grant_self(self.manager, self.manager_group)
        self.assertEqual(r.status_code, 403, getattr(r, 'data', None))
        self.assertEqual(self.level(self.manager_group, 'permissions'), 'none')
        self.assertEqual(self.level(self.manager_group, 'subscriptions'), 'none')

    def test_staff_cannot_edit_their_own_group(self):
        r = self._grant_self(self.staff, self.staff_group)
        self.assertEqual(r.status_code, 403)
        self.assertEqual(self.level(self.staff_group, 'permissions'), 'none')

    def test_manager_cannot_give_a_group_more_than_they_have(self):
        # Since 2026-10-23 a Branch Manager always manages the Frontdesk group (no "Permissions: Edit"
        # switch; superseded), but never above their own level: this manager has no Permissions or
        # Subscriptions access, so they cannot hand it out.
        r = self._grant_self(self.manager, self.staff_group)
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('more access than you have yourself', str(r.data))
        self.assertEqual(self.level(self.staff_group, 'permissions'), 'none')
        self.assertEqual(self.level(self.staff_group, 'subscriptions'), 'none')

    def test_staff_cannot_create_duplicate_or_delete_groups(self):
        c = self.as_(self.staff)
        self.assertEqual(c.post(URL, {'name': 'X', 'role_template': 'CUSTOM', 'permissions': {}}, format='json').status_code, 403)
        self.assertEqual(c.post(f'{URL}{self.staff_group.id}/duplicate/', {'name': 'Copy'}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'{URL}{self.staff_group.id}/').status_code, 403)
        self.assertTrue(PermissionGroup.objects.filter(pk=self.staff_group.pk).exists())

    def test_manager_in_the_default_group_manages_frontdesk_but_not_custom_groups(self):
        # Superseded (2026-10-23): "without Permissions: Edit a Branch Manager cannot create or delete".
        c = self.as_(self.manager)
        self.assertEqual(c.post(URL, {'name': 'X', 'role_template': 'CUSTOM', 'permissions': {}}, format='json').status_code, 403)
        self.assertEqual(c.post(URL, {'name': 'Desk 2', 'role_template': 'FRONTDESK', 'permissions': {'diary': 'edit'}}, format='json').status_code, 201)
        self.assertEqual(c.delete(f'{URL}{self.staff_group.id}/').status_code, 204)

    # ── what stays allowed ────────────────────────────────────────────────────
    def test_owner_can_edit_any_group_including_a_managers(self):
        r = self.as_(self.owner).patch(f'{URL}{self.manager_group.id}/', {'permissions': {'diary': 'view'}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.level(self.manager_group, 'diary'), 'view')

    def test_manager_with_permissions_edit_can_edit_another_non_owner_group(self):
        r = self.as_(self.trusted).patch(f'{URL}{self.staff_group.id}/', {'permissions': {'diary': 'view'}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))

    def test_manager_with_permissions_edit_cannot_edit_their_own_group(self):
        r = self._grant_self(self.trusted, self.admin_manager_group)
        self.assertEqual(r.status_code, 403)

    def test_manager_with_permissions_edit_cannot_touch_the_owner_group(self):
        c = self.as_(self.trusted)
        # Owner groups are not even listed for Managers (404); a direct hit must never succeed.
        self.assertIn(c.patch(f'{URL}{self.owner_group.id}/', {'permissions': {'diary': 'none'}}, format='json').status_code, (403, 404))
        self.assertIn(c.delete(f'{URL}{self.owner_group.id}/').status_code, (403, 404))
        self.assertEqual(self.level(self.owner_group, 'permissions'), 'edit')
        self.assertTrue(PermissionGroup.objects.filter(pk=self.owner_group.pk).exists())

    def test_everyone_can_still_read_their_own_group(self):
        self.assertEqual(self.as_(self.staff).get(f'{URL}{self.staff_group.id}/').status_code, 200)
        self.assertEqual(self.as_(self.manager).get(URL).status_code, 200)


class CreateGroupFromTheScreenTests(TestCase):
    """The Permissions screen creates a group WITHOUT sending `clinic` and needs the full group back."""

    def setUp(self):
        self.clinic = Clinic.objects.create(name="Main Clinic")
        self.owner = User.objects.create_user(
            email="o@x.com", password="x", first_name="O", last_name="U", clinic=self.clinic, clinic_branch=self.clinic, role="OWNER")
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def test_create_without_clinic_returns_the_full_group(self):
        r = self.client.post(URL, {'name': 'Senior Receptionist', 'role_template': 'FRONTDESK', 'description': 'x',
                                   'permissions': {'diary': 'edit', 'patients': 'view'}}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertTrue(r.data['id'])
        self.assertEqual(r.data['permissions_map']['diary'], 'edit')
        self.assertEqual(r.data['permissions_map']['patients'], 'view')
        self.assertEqual(r.data['permissions_map']['settings'], 'none')
        self.assertEqual(r.data['member_count'], 0)
        group = PermissionGroup.objects.get(pk=r.data['id'])
        self.assertEqual(group.clinic_id, self.clinic.id)

    def test_a_clinic_in_the_payload_cannot_redirect_the_group(self):
        other = Clinic.objects.create(name="Someone else")
        r = self.client.post(URL, {'name': 'Sneaky', 'role_template': 'CUSTOM', 'permissions': {}, 'clinic': other.id}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(PermissionGroup.objects.get(name='Sneaky').clinic_id, self.clinic.id)

    def test_duplicate_names_are_refused_cleanly(self):
        self.client.post(URL, {'name': 'Dup', 'role_template': 'CUSTOM', 'permissions': {}}, format='json')
        r = self.client.post(URL, {'name': 'Dup', 'role_template': 'CUSTOM', 'permissions': {}}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))


class BranchManagerGroupScopeTests(TestCase):
    """
    A Branch Manager may manage ONLY the Frontdesk, Practitioner and Finance groups. The Owner and Branch
    Manager groups (and Read-Only and Custom ones) can be managed only by the Owner.
    """

    def setUp(self):
        self.clinic = Clinic.objects.create(name="Main Clinic")
        self.owner = User.objects.create_user(
            email="o@x.com", password="x", first_name="O", last_name="U", clinic=self.clinic, clinic_branch=self.clinic, role="OWNER")
        # A Branch Manager whose own group lets them edit permissions
        own = PermissionGroup.objects.create(clinic=self.clinic, name="BM own", role_template='CUSTOM')
        FeaturePermission.objects.create(group=own, feature_key='permissions', access_level='edit')
        FeaturePermission.objects.create(group=own, feature_key='diary', access_level='edit')
        self.bm = User.objects.create_user(
            email="bm@x.com", password="x", first_name="B", last_name="M", clinic=self.clinic, clinic_branch=self.clinic,
            role="BRANCH_MANAGER", permission_group=own)
        UserBranchAccess.objects.create(user=self.bm, branch=self.clinic, is_managed=True)   # they manage this clinic
        self.staff = User.objects.create_user(
            email="s@x.com", password="x", first_name="S", last_name="T", clinic=self.clinic, clinic_branch=self.clinic, role="STAFF")
        seeded = {g.role_template: g for g in PermissionGroup.objects.filter(clinic=self.clinic, is_system_template=True)}
        self.frontdesk, self.practitioner, self.finance = seeded['FRONTDESK'], seeded['PRACTITIONER'], seeded['FINANCE']
        self.bm_group = seeded['BRANCH_MANAGER']
        self.readonly = PermissionGroup.objects.create(clinic=self.clinic, name="Read only team", role_template='READ_ONLY')
        self.custom = PermissionGroup.objects.create(clinic=self.clinic, name="Special", role_template='CUSTOM')
        self.client = APIClient()
        self.client.force_authenticate(self.bm)

    def _patch(self, group):
        return self.client.patch(f'{URL}{group.id}/', {'permissions': {'diary': 'view'}}, format='json')

    def test_can_edit_frontdesk_practitioner_and_finance_groups(self):
        for group in (self.frontdesk, self.practitioner, self.finance):
            r = self._patch(group)
            self.assertEqual(r.status_code, 200, (group.name, getattr(r, 'data', None)))
            self.assertEqual(group.get_permission('diary'), 'view')

    def test_cannot_edit_the_branch_manager_group_or_any_other_group(self):
        for group in (self.bm_group, self.readonly, self.custom):
            r = self._patch(group)
            self.assertEqual(r.status_code, 403, (group.name, getattr(r, 'data', None)))
            self.assertIn('Only the Owner', str(r.data))
            self.assertNotEqual(group.get_permission('diary'), 'view', group.name)

    def test_the_owner_can_edit_all_of_them(self):
        self.client.force_authenticate(self.owner)
        for group in (self.frontdesk, self.bm_group, self.readonly, self.custom):
            self.assertEqual(self._patch(group).status_code, 200, group.name)

    def test_cannot_delete_or_duplicate_owner_only_groups(self):
        for group in (self.bm_group, self.readonly, self.custom):
            self.assertEqual(self.client.delete(f'{URL}{group.id}/').status_code, 403, group.name)
            self.assertEqual(self.client.post(f'{URL}{group.id}/duplicate/', {'name': f'Copy of {group.name}'}, format='json').status_code, 403, group.name)
            self.assertTrue(PermissionGroup.objects.filter(pk=group.pk).exists())

    def test_can_create_only_frontdesk_practitioner_or_finance_groups(self):
        for template in ('FRONTDESK', 'PRACTITIONER', 'FINANCE'):
            r = self.client.post(URL, {'name': f'New {template}', 'role_template': template, 'permissions': {}}, format='json')
            self.assertEqual(r.status_code, 201, (template, getattr(r, 'data', None)))
        for template in ('BRANCH_MANAGER', 'OWNER', 'READ_ONLY', 'CUSTOM'):
            r = self.client.post(URL, {'name': f'Bad {template}', 'role_template': template, 'permissions': {}}, format='json')
            self.assertIn(r.status_code, (400, 403), (template, getattr(r, 'data', None)))
            self.assertFalse(PermissionGroup.objects.filter(name=f'Bad {template}').exists(), template)

    def test_a_copy_made_by_a_branch_manager_stays_manageable_by_them(self):
        r = self.client.post(f'{URL}{self.frontdesk.id}/duplicate/', {'name': 'Frontdesk 2'}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(r.data['role_template'], 'FRONTDESK')
        copy = PermissionGroup.objects.get(pk=r.data['id'])
        self.assertEqual(self._patch(copy).status_code, 200)
        self.assertEqual(self.client.delete(f'{URL}{copy.id}/').status_code, 204)

    def test_the_owners_copy_is_still_a_custom_group(self):
        self.client.force_authenticate(self.owner)
        r = self.client.post(f'{URL}{self.frontdesk.id}/duplicate/', {'name': 'Owner copy'}, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['role_template'], 'CUSTOM')

    def test_can_assign_only_the_three_groups_to_staff(self):
        for group in (self.frontdesk, self.practitioner, self.finance):
            r = self.client.post(f'{URL}{group.id}/assign-user/', {'user_id': self.staff.id}, format='json')
            self.assertEqual(r.status_code, 200, (group.name, getattr(r, 'data', None)))
        for group in (self.bm_group, self.readonly, self.custom):
            r = self.client.post(f'{URL}{group.id}/assign-user/', {'user_id': self.staff.id}, format='json')
            self.assertIn(r.status_code, (400, 403), group.name)
        self.staff.refresh_from_db()
        self.assertEqual(self.staff.permission_group_id, self.finance.id)

    def test_cannot_hand_an_owner_only_group_to_staff_through_the_user_api(self):
        for group in (self.bm_group, self.readonly, self.custom):
            r = self.client.patch(f'/api/users/{self.staff.id}/', {'permission_group': group.id}, format='json')
            self.assertEqual(r.status_code, 400, (group.name, getattr(r, 'data', None)))
        ok = self.client.patch(f'/api/users/{self.staff.id}/', {'permission_group': self.frontdesk.id}, format='json')
        self.assertEqual(ok.status_code, 200, getattr(ok, 'data', None))

    def test_the_owner_can_hand_out_any_group(self):
        self.client.force_authenticate(self.owner)
        r = self.client.patch(f'/api/users/{self.staff.id}/', {'permission_group': self.bm_group.id}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))

    def test_a_branch_manager_is_only_shown_the_groups_they_manage(self):
        r = self.client.get(URL)
        rows = r.data['results'] if isinstance(r.data, dict) else r.data
        shown = {row['role_template'] for row in rows}
        self.assertEqual(r.status_code, 200)
        self.assertEqual(shown, {'FRONTDESK', 'PRACTITIONER', 'FINANCE'})
        names = {row['name'] for row in rows}
        for hidden in (self.bm_group, self.readonly, self.custom):
            self.assertNotIn(hidden.name, names)
            self.assertEqual(self.client.get(f'{URL}{hidden.id}/').status_code, 404, hidden.name)
        for visible in (self.frontdesk, self.practitioner, self.finance):
            self.assertEqual(self.client.get(f'{URL}{visible.id}/').status_code, 200, visible.name)

    def test_the_owner_still_sees_every_group_except_the_owner_group(self):
        self.client.force_authenticate(self.owner)
        r = self.client.get(URL)
        rows = r.data['results'] if isinstance(r.data, dict) else r.data
        shown = {row['role_template'] for row in rows}
        self.assertTrue({'BRANCH_MANAGER', 'FRONTDESK', 'PRACTITIONER', 'FINANCE', 'READ_ONLY', 'CUSTOM'} <= shown)
        self.assertNotIn('OWNER', shown)

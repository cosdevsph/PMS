from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import FeaturePermission, PermissionGroup, User
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
        self.admin_manager_group = self._group("T Manager+", 'CUSTOM', {'permissions': 'edit'})
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

    def test_manager_without_permissions_edit_cannot_edit_any_group(self):
        r = self._grant_self(self.manager, self.staff_group)
        self.assertEqual(r.status_code, 403)

    def test_staff_cannot_create_duplicate_or_delete_groups(self):
        c = self.as_(self.staff)
        self.assertEqual(c.post(URL, {'name': 'X', 'role_template': 'CUSTOM', 'permissions': {}}, format='json').status_code, 403)
        self.assertEqual(c.post(f'{URL}{self.staff_group.id}/duplicate/', {'name': 'Copy'}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'{URL}{self.staff_group.id}/').status_code, 403)
        self.assertTrue(PermissionGroup.objects.filter(pk=self.staff_group.pk).exists())

    def test_manager_without_permissions_edit_cannot_create_or_delete(self):
        c = self.as_(self.manager)
        self.assertEqual(c.post(URL, {'name': 'X', 'role_template': 'CUSTOM', 'permissions': {}}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'{URL}{self.staff_group.id}/').status_code, 403)

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

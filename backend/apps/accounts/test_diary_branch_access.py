from datetime import date, time
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import FeaturePermission, PermissionGroup, User, UserBranchAccess
from apps.appointments.models import Appointment, BlockAppointment
from apps.clinics.models import Clinic, Practitioner
from apps.clinics.services.models import Service
from apps.patients.models import Patient, PatientCase

DIARY = '/api/appointments/'
BLOCKS = '/api/block-appointments/'
USERS = '/api/users/'


class DiaryBranchTestBase(TestCase):
    """Main clinic A with branches B and C. The Manager works at A and is granted B by the Owner."""

    def setUp(self):
        self.a = Clinic.objects.create(name="Main Clinic")
        self.b = Clinic.objects.create(name="Branch B", parent_clinic=self.a, is_main_branch=False)
        self.c = Clinic.objects.create(name="Branch C", parent_clinic=self.a, is_main_branch=False)

        self.owner = self._user("owner@x.com", "OWNER")
        self.manager = self._user("manager@x.com", "BRANCH_MANAGER", self.a)
        UserBranchAccess.objects.create(user=self.manager, branch=self.a, is_managed=True)

        prac_user = self._user("prac@x.com", "PRACTITIONER", self.b)
        self.prac = Practitioner.objects.create(user=prac_user, clinic=self.b, consultation_fee=Decimal('500'))
        self.service = Service.objects.create(clinic=self.a, name="Physio", duration_minutes=30, price=Decimal('1000'))

        self.patient_b = Patient.objects.create(
            first_name="Ana", last_name="Reyes", clinic=self.a, home_branch=self.b, date_of_birth=date(1990, 1, 2))
        self.patient_a = Patient.objects.create(
            first_name="Ben", last_name="Reyes", clinic=self.a, home_branch=self.a, date_of_birth=date(1991, 1, 2))
        self.case_b = PatientCase.objects.create(patient=self.patient_b, title="Knee rehab")
        self.appt_b = self._appointment(self.b, self.patient_b)

        self.client = APIClient()

    def _user(self, email, role, clinic=None):
        clinic = clinic or self.a
        return User.objects.create_user(
            email=email, password="testpassword123", first_name="T", last_name=role.title(),
            clinic=self.a, clinic_branch=clinic, role=role)

    def _appointment(self, clinic, patient, hour=9):
        return Appointment.objects.create(
            clinic=clinic, patient=patient, practitioner=self.prac, service=self.service, status='SCHEDULED',
            date=date.today(), start_time=time(hour, 0), end_time=time(hour, 30))

    def _group_for(self, user, level, permissions=None):
        """Give `user` a permission group with the 'Other Branches' Diary' level."""
        group = PermissionGroup.objects.create(clinic=self.a, name=f"G-{user.email}-{level}", role_template='CUSTOM')
        rows = {'diary': 'edit', 'calendar': 'edit', 'appointments': 'edit', 'diary_other_branches': level}
        rows.update(permissions or {})
        for key, value in rows.items():
            FeaturePermission.objects.create(group=group, feature_key=key, access_level=value)
        user.permission_group = group
        user.save()
        return group

    def _grant(self, level, branches=None):
        self._group_for(self.manager, level)
        self.manager.extra_diary_branches.set(branches if branches is not None else [self.b])

    def as_(self, user):
        self.client.force_authenticate(user)
        return self.client

    def _block(self, clinic, **kw):
        data = {'clinic': clinic.id, 'practitioner': self.prac.id, 'event_name': 'Meeting',
                'date': str(date.today()), 'start_time': '13:00:00', 'end_time': '14:00:00',
                'visibility_type': 'ALL'}
        data.update(kw)
        return self.as_(self.manager).post(BLOCKS, data, format='json')


class ManagerDiaryReadTests(DiaryBranchTestBase):
    def ids(self, response):
        rows = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        return {r['id'] for r in rows}

    def test_default_manager_cannot_open_another_branch(self):
        r = self.as_(self.manager).get(DIARY, {'clinic_branch': self.b.id})
        self.assertEqual(r.status_code, 403)

    def test_level_none_even_with_a_picked_branch_gives_no_access(self):
        self._grant('none')
        self.assertEqual(self.as_(self.manager).get(DIARY, {'clinic_branch': self.b.id}).status_code, 403)

    def test_view_level_without_a_picked_branch_gives_no_access(self):
        self._grant('view', branches=[])
        self.assertEqual(self.as_(self.manager).get(DIARY, {'clinic_branch': self.b.id}).status_code, 403)

    def test_view_level_opens_only_the_picked_branch(self):
        self._grant('view', branches=[self.b])
        r = self.as_(self.manager).get(DIARY, {'clinic_branch': self.b.id})
        self.assertEqual(r.status_code, 200)
        self.assertIn(self.appt_b.id, self.ids(r))
        self.assertEqual(self.as_(self.manager).get(DIARY, {'clinic_branch': self.c.id}).status_code, 403)

    def test_view_level_unfiltered_list_includes_picked_branch_but_not_others(self):
        appt_c = self._appointment(self.c, self.patient_b, hour=11)
        self._grant('view', branches=[self.b])
        ids = self.ids(self.as_(self.manager).get(DIARY))
        self.assertIn(self.appt_b.id, ids)
        self.assertNotIn(appt_c.id, ids)

    def test_owner_is_unchanged(self):
        self.assertEqual(self.as_(self.owner).get(DIARY, {'clinic_branch': self.c.id}).status_code, 200)


class ManagerDiaryWriteTests(DiaryBranchTestBase):
    def test_view_level_cannot_change_an_appointment_in_the_other_branch(self):
        self._grant('view')
        r = self.as_(self.manager).patch(f'{DIARY}{self.appt_b.id}/', {'notes': 'x'}, format='json')
        self.assertIn(r.status_code, (403, 404))
        self.appt_b.refresh_from_db()
        self.assertEqual(self.appt_b.notes, '')

    def test_edit_level_can_change_an_appointment_in_the_other_branch(self):
        self._grant('edit')
        r = self.as_(self.manager).patch(f'{DIARY}{self.appt_b.id}/', {'notes': 'x'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.appt_b.refresh_from_db()
        self.assertEqual(self.appt_b.notes, 'x')

    def test_view_level_cannot_create_a_block_in_the_other_branch(self):
        self._grant('view')
        self.assertEqual(self._block(self.b).status_code, 403)
        self.assertFalse(BlockAppointment.objects.filter(clinic=self.b).exists())

    def test_edit_level_can_create_and_delete_a_block_in_the_other_branch(self):
        self._grant('edit')
        r = self._block(self.b)
        self.assertEqual(r.status_code, 201, r.data)
        block = BlockAppointment.objects.get(clinic=self.b)
        self.assertEqual(self.as_(self.manager).delete(f'{BLOCKS}{block.id}/').status_code, 204)

    def test_view_level_cannot_delete_a_block_in_the_other_branch(self):
        block = BlockAppointment.objects.create(
            clinic=self.b, practitioner=self.prac, event_name='Out', date=date.today(),
            start_time=time(13, 0), end_time=time(14, 0), visibility_type='ALL', created_by=self.owner)
        self._grant('view')
        r = self.as_(self.manager).delete(f'{BLOCKS}{block.id}/')
        self.assertIn(r.status_code, (403, 404))
        self.assertTrue(BlockAppointment.objects.filter(pk=block.pk).exists())

    def test_own_branch_stays_editable_at_every_level(self):
        for level in ('none', 'view', 'edit'):
            self._group_for(self.manager, level)
            self.manager.extra_diary_branches.set([self.b])
            self.assertEqual(self._block(self.a).status_code, 201, level)
            BlockAppointment.objects.filter(clinic=self.a).delete()
            PermissionGroup.objects.filter(users=self.manager).delete()
            self.manager.refresh_from_db()


class BookingLookupTests(DiaryBranchTestBase):
    URL = '/api/patients/booking-lookup/'

    def test_requires_edit_level(self):
        for level in ('none', 'view'):
            self._grant(level)
            r = self.as_(self.manager).get(self.URL, {'branch': self.b.id})
            self.assertEqual(r.status_code, 403, level)
            PermissionGroup.objects.filter(users=self.manager).delete()
            self.manager.refresh_from_db()

    def test_edit_level_finds_that_branchs_patients_and_open_cases_only(self):
        self._grant('edit')
        r = self.as_(self.manager).get(self.URL, {'branch': self.b.id, 'search': 'ana'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual([p['id'] for p in r.data['results']], [self.patient_b.id])
        self.assertEqual(r.data['results'][0]['cases'], [{'id': self.case_b.id, 'title': 'Knee rehab'}])
        self.assertEqual(set(r.data['results'][0]), {'id', 'first_name', 'last_name', 'patient_number', 'date_of_birth', 'cases'})

    def test_not_a_picked_branch_is_refused(self):
        self._grant('edit', branches=[self.b])
        self.assertEqual(self.as_(self.manager).get(self.URL, {'branch': self.c.id}).status_code, 403)

    def test_patient_records_of_the_other_branch_stay_hidden(self):
        self._grant('edit')
        self.assertEqual(self.as_(self.manager).get(f'/api/patients/{self.patient_b.id}/').status_code, 404)

    def test_owner_can_look_up_any_branch(self):
        self.assertEqual(self.as_(self.owner).get(self.URL, {'branch': self.c.id}).status_code, 200)

    def test_branch_is_required_and_must_belong_to_the_clinic_group(self):
        self.assertEqual(self.as_(self.owner).get(self.URL).status_code, 400)
        other = Clinic.objects.create(name="Someone else")
        self.assertEqual(self.as_(self.owner).get(self.URL, {'branch': other.id}).status_code, 403)


class ExtraDiaryBranchAssignmentTests(DiaryBranchTestBase):
    def _patch(self, actor, target, ids):
        return self.as_(actor).patch(f'{USERS}{target.id}/', {'extra_diary_branch_ids': ids}, format='json')

    def test_owner_can_pick_branches_for_a_manager(self):
        r = self._patch(self.owner, self.manager, [self.b.id, self.c.id])
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(set(self.manager.extra_diary_branches.values_list('id', flat=True)), {self.b.id, self.c.id})
        self.assertEqual({b['id'] for b in r.data['extra_diary_branches']}, {self.b.id, self.c.id})

    def test_a_manager_cannot_pick_branches_even_for_themselves(self):
        r = self._patch(self.manager, self.manager, [self.b.id])
        self.assertEqual(r.status_code, 400)
        self.assertFalse(self.manager.extra_diary_branches.exists())

    def test_branch_from_another_clinic_is_rejected(self):
        other = Clinic.objects.create(name="Someone else")
        r = self._patch(self.owner, self.manager, [other.id])
        self.assertEqual(r.status_code, 400)

    def test_own_branch_is_not_stored_as_extra(self):
        self._patch(self.owner, self.manager, [self.a.id, self.b.id])
        self.assertEqual(list(self.manager.extra_diary_branches.values_list('id', flat=True)), [self.b.id])

    def test_only_managers_hold_extra_branches(self):
        staff = self._user("staff@x.com", "STAFF")
        self._patch(self.owner, staff, [self.b.id])
        self.assertFalse(staff.extra_diary_branches.exists())

    def test_level_none_hides_the_branches_in_the_users_own_view(self):
        self.manager.extra_diary_branches.set([self.b])
        r = self.as_(self.manager).get(f'{USERS}{self.manager.id}/')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(r.data['diary_branches'], [])
        self.assertEqual(r.data['diary_other_branches_level'], 'none')
        self._grant('view')
        r = self.as_(self.manager).get(f'{USERS}{self.manager.id}/')
        self.assertEqual([b['id'] for b in r.data['diary_branches']], [self.b.id])
        self.assertEqual(r.data['diary_other_branches_level'], 'view')

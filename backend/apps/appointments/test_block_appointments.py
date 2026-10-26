"""
Block Appointments (production bug, 2026-10-26): a block affects ONLY the selected practitioners.

  * the creator is never added automatically ("Include me" is the only way in);
  * who may block whose schedule is enforced in the backend;
  * one rule (`BlockAppointment.affecting`) decides who is unavailable, for slots, portal and Calendar.
"""
from datetime import date, time
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import FeaturePermission, PermissionGroup, User, UserBranchAccess
from apps.appointments.models import BlockAppointment
from apps.clinics.models import Clinic, Practitioner

URL = '/api/block-appointments/'
DAY = date(2026, 11, 2)


class BlockBase(TestCase):
    """Clinic A (main) with branches B and C. Santos + Reyes work at A, Cruz at C."""

    def setUp(self):
        self.a = Clinic.objects.create(name='Clinic A')
        self.b = Clinic.objects.create(name='Clinic B', parent_clinic=self.a, is_main_branch=False)
        self.c = Clinic.objects.create(name='Clinic C', parent_clinic=self.a, is_main_branch=False)
        self.owner = self._user('owner@x.com', 'OWNER', self.a)
        self.manager = self._user('manager@x.com', 'BRANCH_MANAGER', self.a)
        UserBranchAccess.objects.create(user=self.manager, branch=self.a, is_managed=True)
        UserBranchAccess.objects.create(user=self.manager, branch=self.b, is_managed=True)
        self.santos = self._practitioner('santos@x.com', self.a)
        self.reyes = self._practitioner('reyes@x.com', self.a)
        self.cruz = self._practitioner('cruz@x.com', self.c)       # a clinic the manager does not manage
        self.staff = self._user('staff@x.com', 'STAFF', self.a)
        self._diary_edit(self.staff)
        self.client = APIClient()

    def _user(self, email, role, branch):
        return User.objects.create_user(email=email, password='x', first_name=email.split('@')[0].title(), last_name='U',
                                        clinic=self.a, clinic_branch=branch, role=role)

    def _practitioner(self, email, branch):
        user = self._user(email, 'PRACTITIONER', branch)
        return Practitioner.objects.create(user=user, clinic=branch, consultation_fee=Decimal('500'))

    def _diary_edit(self, user):
        group = PermissionGroup.objects.create(clinic=self.a, name=f'G-{user.email}', role_template='CUSTOM')
        FeaturePermission.objects.create(group=group, feature_key='diary', access_level='edit')
        user.permission_group = group
        user.save()

    def as_(self, user):
        self.client.force_authenticate(user)
        return self.client

    def payload(self, **extra):
        data = {'clinic': self.a.id, 'event_name': 'Leave of Absence', 'date': str(DAY),
                'start_time': '09:00:00', 'end_time': '17:00:00'}
        data.update(extra)
        return data

    def create(self, actor, **extra):
        return self.as_(actor).post(URL, self.payload(**extra), format='json')

    def blocked(self, practitioner):
        return BlockAppointment.objects.filter(BlockAppointment.affecting(practitioner), date=DAY, is_deleted=False).distinct().exists()


class WhoIsBlockedTests(BlockBase):
    def test_1_manager_blocks_one_practitioner_and_stays_available(self):
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id])
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertTrue(self.blocked(self.santos))
        self.assertFalse(self.blocked(self.reyes))
        self.assertEqual(r.data['affected_practitioner_ids'], [self.santos.id])
        self.assertFalse(r.data['creator_included'])
        self.assertFalse(BlockAppointment.objects.get(pk=r.data['id']).visible_to_users.filter(pk=self.manager.pk).exists())

    def test_2_two_practitioners_only(self):
        r = self.create(self.manager, visibility_type='SELECTED',
                        visible_to_user_ids=[self.santos.user_id, self.reyes.user_id])
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(sorted(r.data['affected_practitioner_ids']), sorted([self.santos.id, self.reyes.id]))
        self.assertFalse(self.blocked(self.cruz))

    def test_include_me_adds_the_creator_who_is_a_practitioner(self):
        mgr_prac = Practitioner.objects.create(user=self.manager, clinic=self.a, consultation_fee=Decimal('1'))
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id], include_creator=True)
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertTrue(r.data['creator_included'])
        self.assertTrue(self.blocked(mgr_prac))

    def test_include_me_alone_is_enough(self):
        r = self.create(self.santos.user, visibility_type='SELECTED', visible_to_user_ids=[], include_creator=True)
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertTrue(self.blocked(self.santos))

    def test_3_block_own_schedule(self):
        r = self.create(self.santos.user, visibility_type='SELF', practitioner=self.santos.id)
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertTrue(self.blocked(self.santos))
        self.assertFalse(self.blocked(self.reyes))

    def test_self_block_without_a_practitioner_blocks_the_creators_own_column(self):
        r = self.create(self.santos.user, visibility_type='SELF')
        self.assertEqual(r.data['affected_practitioner_ids'], [self.santos.id])
        self.assertTrue(self.blocked(self.santos))
        self.assertFalse(self.blocked(self.reyes))

    def test_clinic_wide_block_still_blocks_everyone(self):
        r = self.create(self.manager, visibility_type='ALL')
        self.assertTrue(r.data['is_clinic_wide'])
        for p in (self.santos, self.reyes, self.cruz):
            self.assertTrue(self.blocked(p))

    def test_selected_block_without_a_practitioner_is_not_clinic_wide(self):
        # Old behavior: any block without a practitioner blocked everybody, even a "selected users" one.
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id])
        self.assertFalse(r.data['is_clinic_wide'])
        self.assertFalse(self.blocked(self.cruz))

    def test_creator_selecting_themselves_counts_as_included(self):
        r = self.create(self.santos.user, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id, self.reyes.user_id])
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))   # a practitioner cannot block Reyes
        r = self.create(self.santos.user, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id])
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertTrue(r.data['creator_included'])

    def test_selected_needs_somebody(self):
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[])
        self.assertEqual(r.status_code, 400)

    def test_creator_always_sees_their_block(self):
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id])
        ids = {b['id'] for b in self.as_(self.manager).get(URL).data['results']}
        self.assertIn(r.data['id'], ids)
        ids = {b['id'] for b in self.as_(self.reyes.user).get(URL).data['results']}
        self.assertNotIn(r.data['id'], ids)


class PermissionTests(BlockBase):
    def test_owner_may_block_anyone(self):
        r = self.create(self.owner, visibility_type='SELECTED', visible_to_user_ids=[self.cruz.user_id])
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))

    def test_branch_manager_only_inside_their_clinics(self):
        self.assertEqual(self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id]).status_code, 201)
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.cruz.user_id])
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('Cruz', str(r.data))
        self.assertFalse(self.blocked(self.cruz))

    def test_staff_with_diary_edit_blocks_practitioners_of_their_clinic(self):
        self.assertEqual(self.create(self.staff, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id]).status_code, 201)
        self.assertEqual(self.create(self.staff, visibility_type='SELECTED', visible_to_user_ids=[self.cruz.user_id]).status_code, 400)

    def test_staff_without_diary_edit_cannot_block_practitioners(self):
        plain = self._user('plain@x.com', 'STAFF', self.a)
        group = PermissionGroup.objects.create(clinic=self.a, name='Diary view only', role_template='CUSTOM')
        FeaturePermission.objects.create(group=group, feature_key='diary', access_level='view')
        plain.permission_group = group
        plain.save()
        r = self.create(plain, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id])
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))

    def test_practitioner_cannot_block_another_practitioner_even_by_the_api(self):
        r = self.create(self.santos.user, visibility_type='SELECTED', visible_to_user_ids=[self.reyes.user_id])
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertFalse(self.blocked(self.reyes))
        r = self.create(self.santos.user, visibility_type='SELF', practitioner=self.reyes.id)
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))

    def test_users_outside_the_clinic_cannot_be_selected(self):
        other = Clinic.objects.create(name='Other group')
        stranger = User.objects.create_user(email='s@y.com', password='x', first_name='S', last_name='T', clinic=other, clinic_branch=other, role='STAFF')
        r = self.create(self.owner, visibility_type='SELECTED', visible_to_user_ids=[stranger.id])
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))

    def test_non_practitioner_invitees_are_just_visibility(self):
        r = self.create(self.santos.user, visibility_type='SELECTED', visible_to_user_ids=[self.staff.id, self.santos.user_id])
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(r.data['affected_practitioner_ids'], [self.santos.id])


class EditTests(BlockBase):
    def _block(self, **extra):
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id], **extra)
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        return r.data['id']

    def test_8_change_the_affected_practitioner(self):
        pk = self._block()
        r = self.as_(self.manager).patch(f'{URL}{pk}/', {'visible_to_user_ids': [self.reyes.user_id], 'include_creator': False}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(r.data['affected_practitioner_ids'], [self.reyes.id])
        self.assertFalse(self.blocked(self.santos))
        self.assertTrue(self.blocked(self.reyes))
        self.assertFalse(r.data['creator_included'])

    def test_editing_does_not_add_the_creator(self):
        pk = self._block()
        r = self.as_(self.manager).patch(f'{URL}{pk}/', {'event_name': 'Renamed'}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertFalse(r.data['creator_included'])

    def test_include_me_can_be_turned_on_and_off(self):
        Practitioner.objects.create(user=self.manager, clinic=self.a, consultation_fee=Decimal('1'))
        pk = self._block()
        on = self.as_(self.manager).patch(f'{URL}{pk}/', {'include_creator': True}, format='json')
        self.assertTrue(on.data['creator_included'])
        off = self.as_(self.manager).patch(f'{URL}{pk}/', {'include_creator': False}, format='json')
        self.assertFalse(off.data['creator_included'])

    def test_a_legacy_block_that_includes_its_creator_can_be_corrected(self):
        pk = self._block()
        block = BlockAppointment.objects.get(pk=pk)
        block.visible_to_users.add(self.manager)                       # what the old auto-add stored
        r = self.as_(self.manager).patch(f'{URL}{pk}/', {'visible_to_user_ids': [self.santos.user_id], 'include_creator': False}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertFalse(r.data['creator_included'])

    def test_changing_a_block_to_someone_you_cannot_block_is_refused_but_existing_people_stay(self):
        pk = self._block()
        r = self.as_(self.manager).patch(f'{URL}{pk}/', {'visible_to_user_ids': [self.santos.user_id, self.cruz.user_id]}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        r = self.as_(self.manager).patch(f'{URL}{pk}/', {'event_name': 'Same people'}, format='json')
        self.assertEqual(r.status_code, 200)

    def test_put_and_patch_answer_with_the_full_block(self):
        pk = self._block()
        r = self.as_(self.manager).patch(f'{URL}{pk}/', {'notes': 'x'}, format='json')
        for key in ('id', 'created_by_name', 'affected_practitioner_ids', 'practitioner_id'):
            self.assertIn(key, r.data)


class RegularAppointmentsAreNotAffectedTests(BlockBase):
    """Owner decision: a block never refuses or removes regular appointments."""

    def test_booking_over_a_block_still_works(self):
        from apps.clinics.services.models import Service
        from apps.patients.models import Patient
        self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id])
        svc = Service.objects.create(clinic=self.a, name='Physio', duration_minutes=30, price=Decimal('100'))
        from apps.patients.models import PatientCase
        patient = Patient.objects.create(first_name='Ana', last_name='R', clinic=self.a, home_branch=self.a, date_of_birth=date(1990, 1, 1))
        case = PatientCase.objects.create(patient=patient, title='Knee')
        r = self.as_(self.staff).post('/api/appointments/', {
            'patient': patient.id, 'patient_case': case.id, 'practitioner': self.santos.id, 'service': svc.id, 'clinic': self.a.id,
            'date': str(DAY), 'start_time': '10:00:00', 'end_time': '10:30:00', 'status': 'SCHEDULED'}, format='json')
        self.assertIn(r.status_code, (200, 201), getattr(r, 'data', None))


class LegacyReportTests(BlockBase):
    def test_report_counts_blocks_that_block_their_creator_and_changes_nothing(self):
        from io import StringIO
        from django.core.management import call_command
        legacy = BlockAppointment.objects.create(
            clinic=self.a, event_name='Old', date=DAY, start_time=time(9), end_time=time(10),
            visibility_type='SELECTED', created_by=self.manager, practitioner=self.santos)
        legacy.visible_to_users.set([self.manager, self.santos.user])      # what the old auto-add stored
        clean = BlockAppointment.objects.create(
            clinic=self.a, event_name='New', date=DAY, start_time=time(11), end_time=time(12),
            visibility_type='SELECTED', created_by=self.manager)
        clean.visible_to_users.set([self.santos.user])
        out = StringIO()
        call_command('report_block_creator_participants', stdout=out)
        text = out.getvalue()
        self.assertIn('Active block appointments: 2', text)
        self.assertIn('Blocks that block their creator (either): 1', text)
        self.assertIn('Nothing was changed.', text)
        self.assertEqual(legacy.visible_to_users.count(), 2)


class PractitionerListTests(BlockBase):
    def test_practitioners_list_carries_the_user_id_the_block_form_needs(self):
        r = self.as_(self.manager).get('/api/appointments/practitioners/')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        by_id = {p['id']: p for p in r.data['practitioners']}
        self.assertEqual(by_id[self.santos.id]['user_id'], self.santos.user_id)
        self.assertEqual(by_id[self.reyes.id]['user_id'], self.reyes.user_id)


class LocationTests(BlockBase):
    """Where / Location is optional free text."""

    def test_location_is_optional_and_defaults_to_empty(self):
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id])
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(r.data['location'], '')

    def test_location_is_saved_returned_and_editable(self):
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id], location='Conference Room A')
        self.assertEqual(r.data['location'], 'Conference Room A')
        pk = r.data['id']
        r = self.as_(self.manager).patch(f'{URL}{pk}/', {'location': 'Room B'}, format='json')
        self.assertEqual(r.data['location'], 'Room B')
        r = self.as_(self.manager).patch(f'{URL}{pk}/', {'location': ''}, format='json')
        self.assertEqual(r.data['location'], '')
        self.assertEqual(BlockAppointment.objects.get(pk=pk).location, '')

    def test_location_is_limited_to_200_characters(self):
        r = self.create(self.manager, visibility_type='SELECTED', visible_to_user_ids=[self.santos.user_id], location='x' * 201)
        self.assertEqual(r.status_code, 400)

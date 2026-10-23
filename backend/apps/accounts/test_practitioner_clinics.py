"""
A Practitioner can work at several clinics (2026-10-23).

  - Clinics are added / changed / removed through the user update (combined `duty_schedule`) or the
    single-clinic endpoints; both refuse overlapping hours.
  - A Branch Manager can only change hours at the clinics they manage; hours at other managers'
    clinics must come back exactly as stored.
  - A practitioner is ONE clinician for the plan limit, however many clinics they work at.
  - A clinic the practitioner no longer works at grants no Diary / patient access.
"""
from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User, UserBranchAccess
from apps.accounts.utils.rbac import get_allowed_branches
from apps.clinics.models import Clinic, Practitioner
from apps.patients.models import Patient
from apps.subscriptions.models import Subscription
from apps.subscriptions.services import get_clinician_allocations_for_clinic

USERS = '/api/users/'
PHONE = '+639171234567'
MON_FRI = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']


def week(start, end, branch_id, days=MON_FRI):
    return {day: [{'start': start, 'end': end, 'branch_id': branch_id}] for day in days}


def merged(*schedules):
    out = {}
    for schedule in schedules:
        for day, blocks in schedule.items():
            out.setdefault(day, []).extend(blocks)
    return out


class PractitionerClinicsBase(TestCase):
    """Clinic 1 (main), 2 and 3. bm1 manages 1 + 2, bm3 manages 3. The plan allows 2 clinicians."""

    def setUp(self):
        self.c1 = Clinic.objects.create(name='Clinic 1')
        self.c2 = Clinic.objects.create(name='Clinic 2', parent_clinic=self.c1, is_main_branch=False)
        self.c3 = Clinic.objects.create(name='Clinic 3', parent_clinic=self.c1, is_main_branch=False)
        self.owner = self._user('owner@x.com', 'OWNER')
        self.bm1 = self._manager('bm1@x.com', self.c1, self.c2)
        self.bm3 = self._manager('bm3@x.com', self.c3)
        self.sub, _ = Subscription.objects.get_or_create(clinic=self.c1)
        self.sub.clinician_limit = 2
        self.sub.save()
        self.client = APIClient()

    def _user(self, email, role, branch=None):
        return User.objects.create_user(email=email, password='x', first_name=email.split('@')[0].title(), last_name='User',
                                        clinic=self.c1, clinic_branch=branch or self.c1, role=role, phone=PHONE)

    def _manager(self, email, *clinics):
        manager = self._user(email, 'BRANCH_MANAGER', branch=clinics[0])
        for clinic in clinics:
            UserBranchAccess.objects.create(user=manager, branch=clinic, is_managed=True)
        return manager

    def _practitioner(self, email, *placements):
        """A practitioner working at `placements`: [(clinic, start, end), ...] Mon-Fri."""
        user = self._user(email, 'PRACTITIONER', branch=placements[0][0])
        combined = merged(*[week(start, end, clinic.id) for clinic, start, end in placements])
        Practitioner.objects.create(user=user, clinic=placements[0][0], consultation_fee=Decimal('500'),
                                    duty_schedule=combined, duty_days=MON_FRI)
        for clinic, start, end in placements:
            UserBranchAccess.objects.create(
                user=user, branch=clinic, duty_days=MON_FRI, duty_start_time=start, duty_end_time=end,
                duty_schedule={d: [{'start': start, 'end': end}] for d in MON_FRI}, is_active=True)
        return user

    def as_(self, user):
        self.client.force_authenticate(user)
        return self.client

    def schedule(self, user):
        user.practitioner_profile.refresh_from_db()
        return user.practitioner_profile.duty_schedule

    def active(self, user):
        return set(UserBranchAccess.objects.filter(user=user, is_active=True).values_list('branch__name', flat=True))

    def patch_schedule(self, actor, target, schedule):
        return self.as_(actor).patch(f'{USERS}{target.id}/', {'duty_schedule': schedule}, format='json')

    def seats(self):
        return get_clinician_allocations_for_clinic(self.c1)['total_allocations']


class AddingAClinicTests(PractitionerClinicsBase):
    def test_branch_manager_adds_a_second_clinic_they_manage(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        r = self.patch_schedule(self.bm1, dr, merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c2.id)))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.active(dr), {'Clinic 1', 'Clinic 2'})

    def test_branch_manager_cannot_add_a_clinic_they_do_not_manage(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        r = self.patch_schedule(self.bm1, dr, merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c3.id)))
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertEqual(self.active(dr), {'Clinic 1'})

    def test_owner_can_add_any_clinic(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        r = self.patch_schedule(self.owner, dr, merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c3.id)))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.active(dr), {'Clinic 1', 'Clinic 3'})

    def test_overlapping_hours_at_two_clinics_are_refused(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        r = self.patch_schedule(self.bm1, dr, merged(week('08:00', '12:00', self.c1.id), week('11:00', '15:00', self.c2.id)))
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('cannot work in two places simultaneously', str(r.data))
        self.assertEqual(self.active(dr), {'Clinic 1'})

    def test_back_to_back_hours_are_not_an_overlap(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        r = self.patch_schedule(self.bm1, dr, merged(week('08:00', '12:00', self.c1.id), week('12:00', '16:00', self.c2.id)))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))

    def test_removing_a_clinic_deactivates_it(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        r = self.patch_schedule(self.bm1, dr, week('08:00', '17:00', self.c1.id))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.active(dr), {'Clinic 1'})


class SharedWithAnotherManagerTests(PractitionerClinicsBase):
    """dr works at Clinic 2 (bm1) and Clinic 3 (bm3)."""

    def setUp(self):
        super().setUp()
        self.dr = self._practitioner('dr@x.com', (self.c2, '08:00', '12:00'), (self.c3, '13:00', '17:00'))
        self.stored_c3 = week('13:00', '17:00', self.c3.id)

    def test_unchanged_hours_at_the_other_managers_clinic_may_be_resent(self):
        r = self.patch_schedule(self.bm1, self.dr, merged(week('09:00', '12:00', self.c2.id), self.stored_c3))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.active(self.dr), {'Clinic 2', 'Clinic 3'})
        self.assertEqual(self.schedule(self.dr)['Mon'][0]['start'], '09:00')

    def test_changing_hours_at_the_other_managers_clinic_is_refused(self):
        r = self.patch_schedule(self.bm1, self.dr, merged(week('08:00', '12:00', self.c2.id), week('14:00', '17:00', self.c3.id)))
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('not one of the clinics you manage', str(r.data))

    def test_dropping_the_other_managers_clinic_is_refused(self):
        r = self.patch_schedule(self.bm1, self.dr, week('08:00', '12:00', self.c2.id))
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('only change working hours at the clinics you manage', str(r.data))
        self.assertEqual(self.active(self.dr), {'Clinic 2', 'Clinic 3'})

    def test_owner_can_change_either_clinic(self):
        r = self.patch_schedule(self.owner, self.dr, merged(week('08:00', '12:00', self.c2.id), week('14:00', '17:00', self.c3.id)))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))


class SingleClinicEndpointTests(PractitionerClinicsBase):
    def test_assign_branch_refuses_overlapping_hours(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        r = self.as_(self.bm1).post(f'{USERS}{dr.id}/assign_branch/', {
            'branch_id': self.c2.id, 'duty_days': MON_FRI, 'duty_start_time': '10:00', 'duty_end_time': '15:00'}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('two places simultaneously', str(r.data))

    def test_assign_branch_keeps_the_combined_schedule_in_step(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        r = self.as_(self.bm1).post(f'{USERS}{dr.id}/assign_branch/', {
            'branch_id': self.c2.id, 'duty_days': MON_FRI, 'duty_start_time': '13:00', 'duty_end_time': '17:00'}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual({b['branch_id'] for b in self.schedule(dr)['Mon']}, {self.c1.id, self.c2.id})

    def test_update_branch_assignment_refuses_overlapping_hours(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        r = self.as_(self.bm1).patch(f'{USERS}{dr.id}/update_branch_assignment/', {
            'branch_id': self.c2.id, 'duty_start_time': '11:00', 'duty_end_time': '17:00',
            'duty_schedule': {d: [{'start': '11:00', 'end': '17:00'}] for d in MON_FRI}}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))

    def test_deactivating_a_clinic_updates_the_combined_schedule(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        r = self.as_(self.bm1).post(f'{USERS}{dr.id}/deactivate_branch_assignment/', {'branch_id': self.c2.id}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual({b['branch_id'] for b in self.schedule(dr)['Mon']}, {self.c1.id})


class SeatCountTests(PractitionerClinicsBase):
    """The plan allows 2 clinicians. A practitioner at several clinics is still one."""

    def test_one_practitioner_at_two_clinics_is_one_seat(self):
        self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        self.assertEqual(self.seats(), 1)

    def _create_practitioner(self, actor, email, schedule):
        return self.as_(actor).post(USERS, {
            'email': email, 'first_name': 'New', 'last_name': 'Doc', 'role': 'PRACTITIONER', 'roles': ['PRACTITIONER'],
            'phone': PHONE, 'duty_schedule': schedule, 'consultation_fee': 500}, format='json')

    def test_creating_a_practitioner_for_two_clinics_costs_one_seat_at_the_limit(self):
        self._practitioner('first@x.com', (self.c1, '08:00', '12:00'))   # 1 of 2 used
        r = self._create_practitioner(self.bm1, 'second@x.com',
                                      merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c2.id)))
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))
        self.assertEqual(self.seats(), 2)

    def test_a_third_practitioner_is_still_refused(self):
        self._practitioner('first@x.com', (self.c1, '08:00', '12:00'))
        self._practitioner('second@x.com', (self.c2, '08:00', '12:00'))
        r = self._create_practitioner(self.bm1, 'third@x.com', week('08:00', '12:00', self.c1.id))
        self.assertEqual(r.status_code, 403, getattr(r, 'data', None))
        self.assertEqual(r.data['error'], 'CLINICIAN_LIMIT_REACHED')

    def test_adding_a_clinic_to_a_practitioner_at_the_limit_is_allowed(self):
        dr = self._practitioner('first@x.com', (self.c1, '08:00', '12:00'))
        self._practitioner('second@x.com', (self.c2, '08:00', '12:00'))   # now 2 of 2
        r = self.patch_schedule(self.bm1, dr, merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c2.id)))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.seats(), 2)

    def test_assign_branch_at_the_limit_is_allowed(self):
        dr = self._practitioner('first@x.com', (self.c1, '08:00', '12:00'))
        self._practitioner('second@x.com', (self.c2, '08:00', '12:00'))
        r = self.as_(self.bm1).post(f'{USERS}{dr.id}/assign_branch/', {
            'branch_id': self.c2.id, 'duty_days': MON_FRI, 'duty_start_time': '13:00', 'duty_end_time': '17:00'}, format='json')
        self.assertEqual(r.status_code, 201, getattr(r, 'data', None))

    def test_becoming_a_practitioner_at_the_limit_is_refused(self):
        self._practitioner('first@x.com', (self.c1, '08:00', '12:00'))
        self._practitioner('second@x.com', (self.c2, '08:00', '12:00'))
        staff = self._user('staff@x.com', 'STAFF')
        r = self.as_(self.owner).patch(f'{USERS}{staff.id}/', {'roles': ['PRACTITIONER'], 'role': 'PRACTITIONER'}, format='json')
        self.assertEqual(r.status_code, 403, getattr(r, 'data', None))
        self.assertEqual(r.data['error'], 'CLINICIAN_LIMIT_REACHED')


class AccessFollowsActiveClinicsTests(PractitionerClinicsBase):
    def test_an_added_clinic_grants_diary_and_patient_access(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        patient = Patient.objects.create(first_name='Ana', last_name='Reyes', clinic=self.c1, home_branch=self.c2,
                                         date_of_birth=date(1990, 1, 2))
        self.assertEqual(set(get_allowed_branches(dr)), {self.c1.id})
        self.assertNotIn(patient.id, self._visible_patient_ids(dr))

        self.patch_schedule(self.bm1, dr, merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c2.id)))
        self.assertEqual(set(get_allowed_branches(dr)), {self.c1.id, self.c2.id})
        self.assertIn(patient.id, self._visible_patient_ids(dr))

    def test_a_removed_clinic_grants_nothing(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        patient = Patient.objects.create(first_name='Ana', last_name='Reyes', clinic=self.c1, home_branch=self.c2,
                                         date_of_birth=date(1990, 1, 2))
        self.assertIn(patient.id, self._visible_patient_ids(dr))

        self.patch_schedule(self.bm1, dr, week('08:00', '12:00', self.c1.id))
        self.assertEqual(set(get_allowed_branches(dr)), {self.c1.id})
        self.assertNotIn(patient.id, self._visible_patient_ids(dr))

    def test_a_branch_managers_managed_clinics_do_not_depend_on_is_active(self):
        UserBranchAccess.objects.filter(user=self.bm1).update(is_active=False)
        self.assertEqual(set(get_allowed_branches(self.bm1)), {self.c1.id, self.c2.id})

    def _visible_patient_ids(self, user):
        r = self.as_(user).get('/api/patients/', format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        rows = r.data['results'] if isinstance(r.data, dict) and 'results' in r.data else r.data
        return {row['id'] for row in rows}

"""
One practitioner, several clinics: hours may not overlap, whichever clinic is being edited (2026-11-09).

  - overlapping hours are refused with a message that names the clinics, days and times, plus a
    structured `schedule_conflicts` list; non-overlapping hours (other days, or other hours on the same
    day, back-to-back included) are allowed;
  - the check covers every active clinic, not only the one being edited;
  - the single-clinic endpoints lock the person while they check;
  - the two other places that used to write hours (`/api/practitioners/`, `/api/practitioner-schedules/`)
    can no longer change them;
  - shortening hours or removing a clinic that has upcoming appointments asks for a confirmation
    (409) and, once confirmed, changes no appointment;
  - Add Staff can warn about a second account for the same name.
"""
from datetime import date, time, timedelta
from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.utils import timezone

from apps.accounts.models import User, UserBranchAccess
from apps.accounts.test_practitioner_clinics import MON_FRI, USERS, PractitionerClinicsBase, merged, week
from apps.accounts.utils.schedule import find_overlaps
from apps.appointments.models import Appointment
from apps.clinics.models import Clinic
from apps.patients.models import Patient

MWF = ['Mon', 'Wed', 'Fri']
TTSS = ['Tue', 'Thu', 'Sat', 'Sun']


def next_monday():
    today = timezone.localdate()
    return today + timedelta(days=(7 - today.weekday()) % 7 or 7)


class ConflictRuleTests(PractitionerClinicsBase):
    def a_mwf(self):
        """Dr works Mon/Wed/Fri 8-5 at Clinic 1 only."""
        user = self._user('dr@x.com', 'PRACTITIONER', branch=self.c1)
        from apps.clinics.models import Practitioner
        Practitioner.objects.create(user=user, clinic=self.c1, duty_schedule=week('08:00', '17:00', self.c1.id, MWF), duty_days=MWF)
        UserBranchAccess.objects.create(user=user, branch=self.c1, duty_days=MWF, duty_start_time='08:00', duty_end_time='17:00',
                                        duty_schedule={d: [{'start': '08:00', 'end': '17:00'}] for d in MWF}, is_active=True)
        return user

    def full_schedule(self, a_days, a_hours, b_days, b_hours):
        return merged(week(*a_hours, self.c1.id, a_days), week(*b_hours, self.c2.id, b_days))

    def test_different_days_are_allowed(self):
        dr = self.a_mwf()
        r = self.patch_schedule(self.bm1, dr, self.full_schedule(MWF, ('08:00', '17:00'), TTSS, ('08:00', '17:00')))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(self.active(dr), {'Clinic 1', 'Clinic 2'})

    def test_same_days_and_hours_are_refused_with_a_clear_message(self):
        dr = self.a_mwf()
        r = self.patch_schedule(self.bm1, dr, self.full_schedule(MWF, ('08:00', '17:00'), MWF, ('08:00', '17:00')))
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        message = str(r.data['duty_schedule'])
        for text in ('Clinic 1', 'Clinic 2', 'Mon, Wed, Fri', '8:00 AM–5:00 PM', 'cannot work in two places simultaneously'):
            self.assertIn(text, message)
        self.assertEqual(len(r.data['schedule_conflicts']), 3)
        self.assertEqual({c['day'] for c in r.data['schedule_conflicts']}, set(MWF))
        self.assertEqual(self.active(dr), {'Clinic 1'})                       # nothing saved

    def test_partial_overlap_is_refused(self):
        dr = self.a_mwf()
        r = self.patch_schedule(self.bm1, dr, self.full_schedule(MWF, ('08:00', '17:00'), ['Mon'], ('13:00', '19:00')))
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertEqual([c['day'] for c in r.data['schedule_conflicts']], ['Mon'])

    def test_other_hours_on_the_same_day_are_allowed(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        r = self.patch_schedule(self.bm1, dr, self.full_schedule(MON_FRI, ('08:00', '12:00'), MON_FRI, ('13:00', '17:00')))
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))

    def test_times_with_seconds_do_not_make_back_to_back_hours_overlap(self):
        schedule = merged(week('08:00:00', '12:00:00', 1, ['Mon']), week('12:00', '16:00', 2, ['Mon']))
        self.assertEqual(find_overlaps(schedule), [])
        overlapping = merged(week('08:00:00', '12:01:00', 1, ['Mon']), week('12:00', '16:00', 2, ['Mon']))
        self.assertEqual(len(find_overlaps(overlapping)), 1)

    def test_three_clinics_check_every_other_clinic(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        new = merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c2.id), week('16:00', '18:00', self.c3.id))
        r = self.patch_schedule(self.owner, dr, new)
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('Clinic 2', str(r.data['duty_schedule']))
        # Through the single-clinic endpoint the check also reads the clinics NOT being edited.
        r = self.as_(self.owner).post(f'{USERS}{dr.id}/assign_branch/', {
            'branch_id': self.c3.id, 'duty_days': MON_FRI, 'duty_start_time': '16:00', 'duty_end_time': '18:00'}, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertIn('Clinic 2', r.data['detail'])
        self.assertTrue(r.data['schedule_conflicts'])
        ok = self.as_(self.owner).post(f'{USERS}{dr.id}/assign_branch/', {
            'branch_id': self.c3.id, 'duty_days': MON_FRI, 'duty_start_time': '17:00', 'duty_end_time': '18:00'}, format='json')
        self.assertEqual(ok.status_code, 201, getattr(ok, 'data', None))

    def test_resaving_unchanged_hours_is_not_a_conflict(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        same = merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c2.id))
        self.assertEqual(self.patch_schedule(self.bm1, dr, same).status_code, 200)
        r = self.as_(self.bm1).patch(f'{USERS}{dr.id}/update_branch_assignment/', {
            'branch_id': self.c2.id, 'duty_schedule': {d: [{'start': '13:00', 'end': '17:00'}] for d in MON_FRI}}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))

    def test_an_edit_that_introduces_an_overlap_changes_nothing(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        before = self.schedule(dr)
        r = self.patch_schedule(self.bm1, dr, merged(week('08:00', '12:00', self.c1.id), week('11:00', '17:00', self.c2.id)))
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))
        self.assertEqual(self.schedule(dr), before)
        self.assertEqual(UserBranchAccess.objects.get(user=dr, branch=self.c2).duty_schedule['Mon'][0]['start'], '13:00')


class AccessTests(PractitionerClinicsBase):
    def test_only_owner_and_branch_manager_change_hours(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        staff = self._user('staff@x.com', 'STAFF')
        new = merged(week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c2.id))
        self.assertEqual(self.patch_schedule(dr, dr, new).status_code, 403)
        self.assertEqual(self.patch_schedule(staff, dr, new).status_code, 403)
        self.assertEqual(self.active(dr), {'Clinic 1'})

    def test_me_ignores_working_hours(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        before = self.schedule(dr)
        self.as_(dr).patch(f'{USERS}me/', {'duty_schedule': week('00:00', '23:00', self.c2.id)}, format='json')
        self.assertEqual(self.schedule(dr), before)

    def test_practitioners_endpoint_cannot_change_hours(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        before = self.schedule(dr)
        r = self.as_(self.owner).patch(f'/api/practitioners/{dr.practitioner_profile.id}/', {
            'duty_schedule': merged(week('08:00', '12:00', self.c1.id), week('09:00', '12:00', self.c2.id)), 'duty_start_time': '05:00'}, format='json')
        self.assertIn(r.status_code, (200, 400), getattr(r, 'data', None))
        self.assertEqual(self.schedule(dr), before)
        dr.practitioner_profile.refresh_from_db()
        self.assertEqual(dr.practitioner_profile.duty_start_time.strftime('%H:%M'), '08:00')

    def test_practitioner_schedules_endpoint_is_read_only(self):
        self.assertEqual(self.as_(self.owner).post('/api/practitioner-schedules/', {}, format='json').status_code, 405)
        self.assertEqual(self.as_(self.owner).get('/api/practitioner-schedules/').status_code, 200)

    def test_branch_manager_still_cannot_change_a_clinic_they_do_not_manage(self):
        dr = self._practitioner('dr@x.com', (self.c2, '08:00', '12:00'), (self.c3, '13:00', '17:00'))
        r = self.patch_schedule(self.bm1, dr, merged(week('08:00', '12:00', self.c2.id), week('14:00', '17:00', self.c3.id)))
        self.assertEqual(r.status_code, 400, getattr(r, 'data', None))


class LockingTests(PractitionerClinicsBase):
    def test_single_clinic_endpoints_lock_the_person_before_checking(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        with mock.patch('apps.accounts.views.lock_person') as lock:
            self.as_(self.bm1).post(f'{USERS}{dr.id}/assign_branch/', {
                'branch_id': self.c2.id, 'duty_days': MON_FRI, 'duty_start_time': '13:00', 'duty_end_time': '17:00'}, format='json')
            self.as_(self.bm1).patch(f'{USERS}{dr.id}/update_branch_assignment/', {
                'branch_id': self.c2.id, 'duty_start_time': '14:00', 'duty_end_time': '17:00'}, format='json')
            self.as_(self.bm1).post(f'{USERS}{dr.id}/deactivate_branch_assignment/', {'branch_id': self.c2.id}, format='json')
        self.assertEqual(lock.call_count, 3)

    def test_a_second_overlapping_assignment_is_refused(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        first = {'branch_id': self.c2.id, 'duty_days': MON_FRI, 'duty_start_time': '13:00', 'duty_end_time': '17:00'}
        self.assertEqual(self.as_(self.owner).post(f'{USERS}{dr.id}/assign_branch/', first, format='json').status_code, 201)
        second = {**first, 'branch_id': self.c3.id, 'duty_start_time': '16:00', 'duty_end_time': '18:00'}
        self.assertEqual(self.as_(self.owner).post(f'{USERS}{dr.id}/assign_branch/', second, format='json').status_code, 400)
        self.assertEqual(self.active(dr), {'Clinic 1', 'Clinic 2'})


class UpcomingAppointmentTests(PractitionerClinicsBase):
    """A schedule change never cancels or moves an appointment; it asks for confirmation first."""

    def setUp(self):
        super().setUp()
        self.dr = self._practitioner('dr@x.com', (self.c1, '08:00', '17:00'))
        self.patient = Patient.objects.create(first_name='Ana', last_name='Reyes', clinic=self.c1, home_branch=self.c1,
                                              date_of_birth=date(1990, 1, 2))
        self.monday = next_monday()

    def book(self, day, start, end, clinic=None, status='SCHEDULED'):
        return Appointment.objects.create(
            clinic=clinic or self.c1, patient=self.patient, practitioner=self.dr.practitioner_profile,
            date=day, start_time=start, end_time=end, status=status)

    def tue_to_fri(self):
        return week('08:00', '17:00', self.c1.id, ['Tue', 'Wed', 'Thu', 'Fri'])

    def test_removing_a_day_with_an_upcoming_appointment_asks_first(self):
        appt = self.book(self.monday, time(9), time(10))
        r = self.patch_schedule(self.owner, self.dr, self.tue_to_fri())
        self.assertEqual(r.status_code, 409, getattr(r, 'data', None))
        self.assertEqual(r.data['code'], 'SCHEDULE_AFFECTS_APPOINTMENTS')
        self.assertEqual(r.data['affected_count'], 1)
        self.assertEqual(r.data['affected_appointments'][0]['id'], appt.id)
        self.assertNotIn('patient', str(r.data).lower().replace('patient_', ''))   # no patient details in the warning
        self.assertIn('Mon', self.schedule(self.dr))                                # nothing saved

    def test_confirming_saves_and_leaves_the_appointment_alone(self):
        appt = self.book(self.monday, time(9), time(10))
        r = self.as_(self.owner).patch(f'{USERS}{self.dr.id}/', {
            'duty_schedule': self.tue_to_fri(), 'confirm_appointment_impact': True}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertNotIn('Mon', self.schedule(self.dr))
        appt.refresh_from_db()
        self.assertEqual((appt.status, appt.date, appt.start_time, appt.practitioner_id, appt.clinic_id),
                         ('SCHEDULED', self.monday, time(9), self.dr.practitioner_profile.id, self.c1.id))

    def test_only_future_active_appointments_inside_the_old_hours_count(self):
        self.book(timezone.localdate() - timedelta(days=7), time(9), time(10))          # past
        self.book(self.monday, time(9), time(10), status='CANCELLED')                   # not active
        self.book(self.monday, time(18), time(19))                                      # already outside the old hours
        self.assertEqual(self.patch_schedule(self.owner, self.dr, self.tue_to_fri()).status_code, 200)

    def test_hours_that_still_cover_the_appointment_do_not_warn(self):
        self.book(self.monday, time(9), time(10))
        self.assertEqual(self.patch_schedule(self.owner, self.dr, week('09:00', '12:00', self.c1.id)).status_code, 200)

    def test_removing_a_clinic_warns_on_every_path(self):
        self.assertEqual(self.patch_schedule(self.owner, self.dr, merged(
            week('08:00', '12:00', self.c1.id), week('13:00', '17:00', self.c2.id))).status_code, 200)
        self.book(self.monday, time(14), time(15), clinic=self.c2)
        r = self.as_(self.owner).post(f'{USERS}{self.dr.id}/deactivate_branch_assignment/', {'branch_id': self.c2.id}, format='json')
        self.assertEqual(r.status_code, 409, getattr(r, 'data', None))
        self.assertIn('Clinic 2', self.active(self.dr))
        r = self.as_(self.owner).patch(f'{USERS}{self.dr.id}/update_branch_assignment/', {
            'branch_id': self.c2.id, 'is_active': False}, format='json')
        self.assertEqual(r.status_code, 409, getattr(r, 'data', None))
        r = self.as_(self.owner).post(f'{USERS}{self.dr.id}/deactivate_branch_assignment/', {
            'branch_id': self.c2.id, 'confirm_appointment_impact': True}, format='json')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        self.assertEqual(Appointment.objects.filter(status='SCHEDULED').count(), 1)


class AvailabilityConsistencyTests(PractitionerClinicsBase):
    def hours_for_all_branches(self, user):
        r = self.as_(self.owner).get('/api/appointments/practitioners/')
        self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
        row = next(p for p in r.data['practitioners'] if p['user_id'] == user.id)
        return row['availability']['duty_schedule']

    def test_all_branches_hours_come_from_the_active_clinic_rows(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'), (self.c2, '13:00', '17:00'))
        clinics = {b['branch_id'] for b in self.hours_for_all_branches(dr)['Mon']}
        self.assertEqual(clinics, {self.c1.id, self.c2.id})
        # The profile copy drifts (e.g. an old save); the Diary still follows the rows.
        dr.practitioner_profile.duty_schedule = None
        dr.practitioner_profile.save()
        self.assertEqual({b['branch_id'] for b in self.hours_for_all_branches(dr)['Mon']}, {self.c1.id, self.c2.id})

    def test_a_refused_overlap_leaves_availability_untouched(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        before = self.hours_for_all_branches(dr)
        r = self.patch_schedule(self.owner, dr, merged(week('08:00', '12:00', self.c1.id), week('10:00', '15:00', self.c2.id)))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.hours_for_all_branches(dr), before)


class PractitionerMatchTests(PractitionerClinicsBase):
    def matches(self, actor, first='Dr', last='User'):
        return self.as_(actor).get(f'{USERS}practitioner-matches/', {'first_name': first, 'last_name': last})

    def test_same_name_practitioner_is_reported_to_owner_and_manager(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        for actor in (self.owner, self.bm1):
            r = self.matches(actor, 'dr', 'USER')
            self.assertEqual(r.status_code, 200, getattr(r, 'data', None))
            self.assertEqual([m['id'] for m in r.data['matches']], [dr.id])
            self.assertEqual(r.data['matches'][0]['clinics'], ['Clinic 1'])

    def test_staff_is_refused_and_other_organisations_are_never_returned(self):
        self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        other = Clinic.objects.create(name='Other Org')
        User.objects.create_user(email='dr@other.com', password='x', first_name='Dr', last_name='User', clinic=other,
                                 clinic_branch=other, role='PRACTITIONER', phone='+639171234568')
        self.assertEqual(self.matches(self._user('staff@x.com', 'STAFF')).status_code, 403)
        r = self.matches(self.owner)
        self.assertEqual([m['email'] for m in r.data['matches']], ['dr@x.com'])

    def test_missing_name_returns_nothing(self):
        self.assertEqual(self.matches(self.owner, 'Dr', '').data, {'matches': []})


class ReportCommandTests(PractitionerClinicsBase):
    def test_report_finds_a_seeded_overlap_and_writes_nothing(self):
        dr = self._practitioner('dr@x.com', (self.c1, '08:00', '12:00'))
        # Seed what the old code allowed: a second clinic row that overlaps, written straight to the database.
        UserBranchAccess.objects.create(user=dr, branch=self.c2, duty_days=MON_FRI, duty_start_time='10:00', duty_end_time='15:00',
                                        duty_schedule={d: [{'start': '10:00', 'end': '15:00'}] for d in MON_FRI}, is_active=True)
        before = list(UserBranchAccess.objects.order_by('id').values())
        out = StringIO()
        call_command('report_practitioner_schedule_conflicts', stdout=out)
        text = out.getvalue()
        self.assertIn('-> 1 found', text.split('2. Combined')[0])
        self.assertIn('Clinic 1', text)
        self.assertEqual(list(UserBranchAccess.objects.order_by('id').values()), before)

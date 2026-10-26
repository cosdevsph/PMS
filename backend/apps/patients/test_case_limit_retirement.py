from datetime import date, time, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.clinical_templates.signals import complete_appointment_on_note_save
from apps.clinics.models import Clinic, Practitioner
from apps.clinics.services.models import Service
from apps.letters.services import LetterGeneratorService
from apps.patients.models import (
    Patient,
    PatientCase,
    PatientConsent,
    PortalLink,
    SessionConsumptionLog,
)

AVAILABLE = mock.patch(
    'apps.appointments.availability_service.is_appointment_within_availability',
    return_value=(True, ''),
)


class CaseLimitRetirementTests(TestCase):
    """
    Case session limits were retired: a Case's old allowance neither blocks bookings nor is
    consumed or restored. The old columns and logs stay as read-only history.
    """

    def setUp(self):
        self.clinic = Clinic.objects.create(name="Malasakit Health")
        self.user = User.objects.create_user(
            email="admin@x.com", password="testpassword123", first_name="A", last_name="D",
            clinic=self.clinic, role="OWNER",
        )
        self.practitioner = Practitioner.objects.create(
            user=User.objects.create_user(
                email="prac@x.com", password="testpassword123", first_name="P", last_name="R",
                clinic=self.clinic, role="PRACTITIONER",
            ),
            clinic=self.clinic, consultation_fee=Decimal('500'),
        )
        self.service = Service.objects.create(
            clinic=self.clinic, name="Physio Session", duration_minutes=30, price=Decimal('1500'),
        )
        self.patient = Patient.objects.create(
            first_name="Juan", last_name="Dela Cruz", clinic=self.clinic,
            date_of_birth=date(1988, 5, 20), email="juan@example.com", phone="+639171234567",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        patcher = AVAILABLE
        patcher.start()
        self.addCleanup(patcher.stop)

    def _legacy_case(self, approved=1, completed=1, **kw):
        return PatientCase.objects.create(
            patient=self.patient, title=kw.pop('title', 'Legacy capped case'),
            approved_sessions=approved, completed_sessions=completed, **kw,
        )

    def _appointment(self, case=None, hour=9, **kw):
        return Appointment.objects.create(
            clinic=self.clinic, patient=self.patient, practitioner=self.practitioner,
            service=self.service, patient_case=case,
            date=date.today() + timedelta(days=1), start_time=time(hour, 0), end_time=time(hour, 30),
            **kw,
        )

    def _book(self, case, hour=9):
        return self.client.post('/api/appointments/', {
            'clinic': self.clinic.id, 'patient': self.patient.id, 'practitioner': self.practitioner.id,
            'service': self.service.id, 'patient_case': case.id,
            'date': (date.today() + timedelta(days=1)).isoformat(),
            'start_time': f'{hour:02d}:00:00', 'end_time': f'{hour:02d}:30:00', 'duration_minutes': 30,
        }, format='json')

    def _consumed(self, case, appt):
        """Legacy state: this appointment consumed a Case session back when limits existed."""
        SessionConsumptionLog.objects.create(patient_case=case, appointment=appt, action='USED', reason='legacy')

    def _assert_untouched(self, case, completed, logs=0):
        case.refresh_from_db()
        self.assertEqual(case.completed_sessions, completed)
        self.assertEqual(SessionConsumptionLog.objects.filter(patient_case=case).count(), logs)

    # ── bookings ─────────────────────────────────────────────────────────────

    def test_an_exhausted_case_allowance_no_longer_blocks_booking(self):
        case = self._legacy_case(approved=1, completed=1)   # used to answer "reached its allocation"
        response = self._book(case)
        self.assertEqual(response.status_code, 201, response.data)
        self._assert_untouched(case, completed=1)

    def test_booking_does_not_consume_a_case_session(self):
        case = self._legacy_case(approved=5, completed=0)
        self.assertEqual(self._book(case).status_code, 201)
        self.assertEqual(self._book(case, hour=11).status_code, 201)
        self._assert_untouched(case, completed=0)

    def test_cancelling_does_not_restore_or_change_anything(self):
        case = self._legacy_case(approved=5, completed=1)
        appt = self._appointment(case)
        self._consumed(case, appt)
        response = self.client.post(f'/api/appointments/{appt.id}/cancel/', {'cancellation_reason': 'x'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self._assert_untouched(case, completed=1, logs=1)   # no REMOVED row, counter not decremented

    def test_deleting_does_not_restore_or_change_anything(self):
        case = self._legacy_case(approved=5, completed=1)
        appt = self._appointment(case)
        self._consumed(case, appt)
        self.assertEqual(self.client.delete(f'/api/appointments/{appt.id}/').status_code, 204)
        self._assert_untouched(case, completed=1, logs=1)

    def test_moving_an_appointment_to_another_case_changes_no_counters(self):
        old = self._legacy_case(approved=5, completed=2, title='old')
        new = self._legacy_case(approved=5, completed=0, title='new')
        appt = self._appointment(old)
        self._consumed(old, appt)
        response = self.client.patch(f'/api/appointments/{appt.id}/', {'patient_case': new.id}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        appt.refresh_from_db()
        self.assertEqual(appt.patient_case_id, new.id)
        self._assert_untouched(old, completed=2, logs=1)   # not restored
        self._assert_untouched(new, completed=0)           # not consumed

    def test_saving_a_clinical_note_completes_the_appointment_but_uses_no_session(self):
        case = self._legacy_case(approved=5, completed=0)
        appt = self._appointment(case)
        note = SimpleNamespace(is_deleted=False, appointment=appt, patient_case=case, practitioner=self.practitioner)
        complete_appointment_on_note_save(sender=None, instance=note, created=True)
        appt.refresh_from_db()
        self.assertEqual(appt.status, 'COMPLETED')
        self._assert_untouched(case, completed=0)

    def test_online_booking_attaches_the_case_without_using_or_checking_its_allowance(self):
        case = self._legacy_case(approved=1, completed=1, status='OPEN')
        link, _ = PortalLink.get_or_create_for_clinic(self.clinic)
        consent = PatientConsent.objects.create(
            portal_link=link, full_name="Juan Dela Cruz", email="juan@example.com",
            consent_text="c", signature="s",
        )
        response = APIClient().post(f'/api/public/portal/{link.token}/book/', {
            'is_returning_patient': True, 'consent_id': consent.id, 'service': self.service.id,
            'patient_email': 'juan@example.com', 'patient_date_of_birth': '1988-05-20',
            'appointment_date': (date.today() + timedelta(days=3)).isoformat(), 'appointment_time': '10:00:00',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        appt = Appointment.objects.get(patient=self.patient, booking_source='portal')
        self.assertEqual(appt.patient_case_id, case.id)
        self._assert_untouched(case, completed=1)

    # ── Case API ─────────────────────────────────────────────────────────────

    def test_case_limit_and_package_fields_are_read_only(self):
        case = self._legacy_case(approved=5, completed=2, package_cost=Decimal('900'))
        response = self.client.patch(f'/api/patient-cases/{case.id}/', {
            'title': 'Renamed', 'approved_sessions': 99, 'is_unlimited': True,
            'session_source': 'PACKAGE', 'package_cost': '1', 'amount_paid': '1',
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        case.refresh_from_db()
        self.assertEqual(case.title, 'Renamed')                      # normal fields still editable
        self.assertEqual((case.approved_sessions, case.is_unlimited), (5, False))
        self.assertEqual((case.session_source, case.package_cost, case.amount_paid), ('MANUAL', Decimal('900'), Decimal('0')))

    def test_a_new_case_cannot_be_created_as_a_package_or_with_a_limit(self):
        response = self.client.post('/api/patient-cases/', {
            'patient': self.patient.id, 'title': 'New', 'approved_sessions': 10,
            'session_source': 'PACKAGE', 'package_cost': '5000', 'is_unlimited': True,
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        case = PatientCase.objects.get(pk=response.data['id'])
        self.assertIsNone(case.approved_sessions)
        self.assertEqual((case.session_source, case.package_cost, case.is_unlimited), ('MANUAL', Decimal('0'), False))

    def test_the_session_limit_endpoints_are_gone(self):
        case = self._legacy_case()
        for action in ('add_sessions', 'remove_sessions', 'remove_limit', 'reset_allocation'):
            with self.subTest(action):
                response = self.client.post(f'/api/patient-cases/{case.id}/{action}/', {'amount': 1}, format='json')
                self.assertEqual(response.status_code, 404)
        self._assert_untouched(case, completed=1)

    def test_case_payload_carries_no_limit_but_keeps_the_old_numbers_as_history(self):
        case = self._legacy_case(approved=5, completed=2)
        data = self.client.get(f'/api/patient-cases/{case.id}/').data
        self.assertIsNone(data['remaining_sessions'])
        self.assertIsNone(data['effective_session_limit'])
        self.assertEqual(data['progress_text'], '')
        self.assertEqual(data['allocation_status'], 'ACTIVE')
        self.assertEqual((data['approved_sessions'], data['completed_sessions']), (5, 2))   # history kept

    def test_appointment_payload_carries_no_limit(self):
        case = self._legacy_case(approved=5, completed=2)
        appt = self._appointment(case)
        data = self.client.get(f'/api/appointments/{appt.id}/').data
        for field in ('case_remaining_sessions', 'case_approved_sessions', 'effective_session_limit', 'session_display'):
            self.assertIsNone(data[field], field)
        self.assertFalse(data['case_is_unlimited'])
        self.assertEqual(data['case_session_number'], 1)          # ordinal within the Case is kept

    # ── letters ──────────────────────────────────────────────────────────────

    def test_retired_letter_placeholders_render_blank_and_others_still_work(self):
        case = self._legacy_case(approved=5, completed=2, title='Knee rehab')
        text = (
            'A{{case.sessions.approved_sessions}}|B{{case.sessions.sessions_used}}|'
            'C{{case.sessions.sessions_remaining}}|D{{case.sessions.session_allocation}}|'
            'E{{case.sessions.package_sessions}}|F{{case.title}}'
        )
        result = LetterGeneratorService.replace_variables(text, patient=self.patient, patient_case=case)
        # merge-field values print bold (2026-10-24), the retired session fields stay blank
        self.assertEqual(result, 'A|B|C|D|E|F<strong>Knee rehab</strong>')

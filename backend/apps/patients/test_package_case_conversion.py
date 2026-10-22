from datetime import date, time
from decimal import Decimal
from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from apps.accounts.models import User
from apps.appointments.models import Appointment
from apps.billing.models import Invoice
from apps.clinics.models import Clinic, Practitioner
from apps.clinics.services.models import Service
from apps.patients.models import (
    Patient,
    PatientCase,
    PrivatePackageSession,
    PrivatePackageSessionUsage,
    SessionConsumptionLog,
)
from apps.patients.services import package_conversion as conv
from apps.patients.services import package_service


class ConversionTests(TestCase):
    """Legacy package Case -> Private Package Session. Cases, logs and invoices stay untouched."""

    def setUp(self):
        self.clinic = Clinic.objects.create(name="Malasakit Health")
        self.admin = User.objects.create_user(
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
        self.physio = Service.objects.create(clinic=self.clinic, name="Physio Session", duration_minutes=30, price=Decimal('1500'))
        self.consult = Service.objects.create(clinic=self.clinic, name="Initial Consultation", duration_minutes=30, price=Decimal('1000'))
        self.patient = Patient.objects.create(
            first_name="Juan", last_name="Dela Cruz", clinic=self.clinic, date_of_birth=date(1988, 5, 20),
        )

    # ── helpers: build legacy data directly, as the old code left it ─────────

    def _case(self, approved=5, source='PACKAGE', **kw):
        return PatientCase.objects.create(
            patient=self.patient, title=kw.pop('title', 'Legacy package'), approved_sessions=approved,
            session_source=source, package_cost=kw.pop('package_cost', Decimal('9000')), **kw,
        )

    def _used(self, case, service, hour, status='SCHEDULED', counter=True):
        appt = Appointment.objects.create(
            clinic=self.clinic, patient=self.patient, practitioner=self.practitioner, service=service,
            patient_case=case, status=status, date=date.today(), start_time=time(hour, 0), end_time=time(hour, 30),
        )
        SessionConsumptionLog.objects.create(patient_case=case, appointment=appt, action='USED', reason='legacy')
        if counter:
            case.completed_sessions += 1
            case.save(update_fields=['completed_sessions'])
        return appt

    def _restore(self, case, appt):
        """What the old cancel flow did: a REMOVED log row and a counter decrement."""
        SessionConsumptionLog.objects.create(patient_case=case, appointment=appt, action='REMOVED', reason='cancelled')
        case.completed_sessions -= 1
        case.save(update_fields=['completed_sessions'])

    def _ready_case(self):
        case = self._case(approved=5)
        invoice = Invoice.objects.create(clinic=self.clinic, patient=self.patient, invoice_date=date.today(), patient_case=case)
        case.package_invoice = invoice
        case.save(update_fields=['package_invoice'])
        a1 = self._used(case, self.physio, 9)
        a2 = self._used(case, self.physio, 10)
        a3 = self._used(case, self.consult, 11)
        return case, invoice, (a1, a2, a3)

    # ── the happy path ───────────────────────────────────────────────────────

    def test_a_consistent_case_is_converted_with_matching_balances(self):
        case, invoice, (a1, a2, a3) = self._ready_case()
        plan = conv.plan_conversion(case)
        self.assertEqual(plan.status, conv.READY, plan.reasons)

        package = conv.apply_plan(plan, user=self.admin)

        self.assertEqual(package.patient, self.patient)
        self.assertEqual(package.source_case, case)
        self.assertEqual(package.invoice, invoice)
        self.assertEqual(package.price, Decimal('9000'))
        self.assertEqual(package.status, 'ACTIVE')
        self.assertEqual((package.total_sessions, package.used_sessions, package.remaining_sessions), (5, 3, 2))
        # physio used twice (+2 unused, as the most-used service), consultation once
        self.assertEqual({i.service_id: i.quantity for i in package.items.all()},
                         {self.physio.id: 4, self.consult.id: 1})
        self.assertEqual(package.items.get(service=self.physio).used, 2)
        self.assertEqual(package.items.get(service=self.physio).remaining, 2)
        for appt in (a1, a2, a3):
            self.assertTrue(PrivatePackageSessionUsage.objects.filter(appointment=appt).exists())
        log = package.audit_logs.get()
        self.assertEqual((log.action, log.changes['converted_from_case']), ('CREATED', case.id))

    def test_the_conversion_never_changes_the_case_logs_appointments_or_invoice(self):
        case, invoice, appts = self._ready_case()
        before = (
            PatientCase.objects.values().get(pk=case.pk),
            list(SessionConsumptionLog.objects.order_by('id').values()),
            list(Appointment.objects.order_by('id').values()),
            Invoice.objects.values().get(pk=invoice.pk),
        )
        conv.apply_plan(conv.plan_conversion(case), user=self.admin)
        after = (
            PatientCase.objects.values().get(pk=case.pk),
            list(SessionConsumptionLog.objects.order_by('id').values()),
            list(Appointment.objects.order_by('id').values()),
            Invoice.objects.values().get(pk=invoice.pk),
        )
        self.assertEqual(before, after)

    def test_a_fully_used_package_is_converted_as_completed(self):
        case = self._case(approved=2)
        self._used(case, self.physio, 9)
        self._used(case, self.physio, 10)
        package = conv.apply_plan(conv.plan_conversion(case))
        self.assertEqual(package.status, 'COMPLETED')
        self.assertEqual(package.remaining_sessions, 0)

    def test_a_restored_session_is_not_counted_as_used(self):
        case = self._case(approved=4)
        keep = self._used(case, self.physio, 9)
        cancelled = self._used(case, self.physio, 10, status='CANCELLED')
        self._restore(case, cancelled)

        plan = conv.plan_conversion(case)
        self.assertEqual(plan.status, conv.READY, plan.reasons)
        package = conv.apply_plan(plan)
        self.assertEqual((package.used_sessions, package.remaining_sessions), (1, 3))
        self.assertTrue(PrivatePackageSessionUsage.objects.filter(appointment=keep).exists())
        self.assertFalse(PrivatePackageSessionUsage.objects.filter(appointment=cancelled).exists())

    def test_a_session_restored_by_moving_the_appointment_to_another_case_is_not_counted(self):
        """Log arithmetic (USED minus REMOVED), independent of the appointment's status."""
        case = self._case(approved=4)
        self._used(case, self.physio, 9)
        moved = self._used(case, self.physio, 10)   # still SCHEDULED
        self._restore(case, moved)                   # old flow when the Case was reassigned

        plan = conv.plan_conversion(case)
        self.assertEqual(plan.status, conv.READY, plan.reasons)
        self.assertEqual(plan.used, 1)
        self.assertNotIn(moved, [a for a, _ in plan.usages])

    def test_without_a_package_invoice_none_is_created_and_a_warning_is_given(self):
        case = self._case(approved=3)
        self._used(case, self.physio, 9)
        plan = conv.plan_conversion(case)
        package = conv.apply_plan(plan)
        self.assertIsNone(package.invoice)
        self.assertEqual(Invoice.objects.count(), 0)
        self.assertTrue(any('no package invoice' in w for w in plan.warnings))

    # ── what is skipped, and why ─────────────────────────────────────────────

    def _skip_reason(self, case, **kw):
        plan = conv.plan_conversion(case, **kw)
        self.assertEqual(plan.status, conv.SKIPPED)
        return plan.reasons[0]

    def test_skip_reasons(self):
        unlimited = self._case(approved=None, is_unlimited=True, title='u')
        self.assertEqual(self._skip_reason(unlimited), conv.UNLIMITED_OR_NO_ALLOWANCE)

        no_allowance = self._case(approved=0, title='z')
        self.assertEqual(self._skip_reason(no_allowance), conv.UNLIMITED_OR_NO_ALLOWANCE)

        unused = self._case(approved=5, title='unused')
        self.assertEqual(self._skip_reason(unused), conv.NO_SERVICE_INFORMATION)

        archived = self._case(approved=5, title='arch', is_archived=True)
        self._used(archived, self.physio, 9)
        self.assertEqual(self._skip_reason(archived), conv.ARCHIVED)

        over = self._case(approved=1, title='over')
        self._used(over, self.physio, 9)
        self._used(over, self.physio, 10)
        self.assertEqual(self._skip_reason(over), conv.USED_EXCEEDS_ALLOWANCE)

        mismatch = self._case(approved=5, title='mismatch')
        self._used(mismatch, self.physio, 9, counter=False)
        mismatch.completed_sessions = 3
        mismatch.save(update_fields=['completed_sessions'])
        self.assertEqual(self._skip_reason(mismatch), conv.COUNTER_MISMATCH)

    def test_a_counter_mismatch_can_be_converted_on_request_using_the_log(self):
        case = self._case(approved=5)
        self._used(case, self.physio, 9, counter=False)
        case.completed_sessions = 3
        case.save(update_fields=['completed_sessions'])

        plan = conv.plan_conversion(case, include_counter_mismatch=True)
        self.assertEqual(plan.status, conv.READY)
        self.assertTrue(any('Counter' in w for w in plan.warnings))
        self.assertEqual(conv.apply_plan(plan).used_sessions, 1)

    def test_non_package_cases_are_not_considered(self):
        manual = self._case(approved=5, source='MANUAL')
        self._used(manual, self.physio, 9)
        out = StringIO()
        call_command('convert_package_cases', '--apply', stdout=out)
        self.assertEqual(PrivatePackageSession.objects.count(), 0)
        self.assertIn('Package Cases examined: 0', out.getvalue())

    # ── the command ──────────────────────────────────────────────────────────

    def test_dry_run_writes_nothing(self):
        self._ready_case()
        out = StringIO()
        call_command('convert_package_cases', stdout=out)
        self.assertEqual(PrivatePackageSession.objects.count(), 0)
        self.assertEqual(PrivatePackageSessionUsage.objects.count(), 0)
        text = out.getvalue()
        self.assertIn('DRY RUN', text)
        self.assertIn('READY', text)
        self.assertIn('Nothing was written', text)

    def test_apply_converts_once_and_a_second_run_is_idempotent(self):
        case, _, _ = self._ready_case()
        out = StringIO()
        call_command('convert_package_cases', '--apply', '--user-email', self.admin.email, stdout=out)
        self.assertEqual(PrivatePackageSession.objects.count(), 1)
        self.assertEqual(PrivatePackageSession.objects.get().created_by, self.admin)
        self.assertIn('converted: 1', out.getvalue())

        again = StringIO()
        call_command('convert_package_cases', '--apply', stdout=again)
        self.assertEqual(PrivatePackageSession.objects.count(), 1)
        self.assertEqual(PrivatePackageSessionUsage.objects.count(), 3)
        self.assertIn('already converted', again.getvalue())

    def test_case_and_clinic_filters(self):
        case, _, _ = self._ready_case()
        out = StringIO()
        call_command('convert_package_cases', '--apply', '--case-id', str(case.id + 999), stdout=out)
        self.assertEqual(PrivatePackageSession.objects.count(), 0)

        other = Clinic.objects.create(name="Other")
        call_command('convert_package_cases', '--apply', '--clinic-id', str(other.id), stdout=StringIO())
        self.assertEqual(PrivatePackageSession.objects.count(), 0)

        call_command('convert_package_cases', '--apply', '--clinic-id', str(self.clinic.id), stdout=StringIO())
        self.assertEqual(PrivatePackageSession.objects.count(), 1)

    # ── converted packages behave like any other ─────────────────────────────

    def test_a_converted_package_can_be_used_for_new_appointments(self):
        case, _, _ = self._ready_case()
        package = conv.apply_plan(conv.plan_conversion(case), user=self.admin)
        new_appt = Appointment.objects.create(
            clinic=self.clinic, patient=self.patient, practitioner=self.practitioner, service=self.physio,
            date=date.today(), start_time=time(14, 0), end_time=time(14, 30),
        )
        package_service.assign_appointment(self.admin, package, new_appt)
        self.assertEqual(package.remaining_sessions, 1)
        # the converted appointments are marked as covered, so bulk billing skips them
        self.assertTrue(package_service.get_usage(case.case_appointments.first()))

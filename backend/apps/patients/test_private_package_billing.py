from datetime import date
from decimal import Decimal
from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient

from apps.appointments.models import Appointment
from apps.billing.bulk_invoice_service import preview_bulk_invoice, run_bulk_invoice
from apps.billing.models import Invoice, InvoiceItem
from apps.patients.models import PrivatePackageSessionUsage
from apps.patients.services import package_service
from apps.patients.test_private_package_assignment import AssignmentFixtureMixin

INVOICE_URL = '/api/invoices/create-from-appointment/'
COVERED = package_service.COVERED_SUFFIX


class CoveredBillingTests(AssignmentFixtureMixin, TestCase):
    """A package-covered appointment carries no service charge (R5); everything else bills as before."""

    def setUp(self):
        self.build_fixture()
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.covered = self._appointment(self.physio, hour=9)
        self._assign(self.covered)
        self.plain = self._appointment(self.massage, hour=10)  # not in the package, not assigned

    def _invoice(self, appointment, items=None, expect=201):
        payload = {'appointment': appointment.id, 'invoice_date': date.today().isoformat()}
        if items is not None:
            payload['items'] = items
        response = self.client.post(INVOICE_URL, payload, format='json')
        self.assertEqual(response.status_code, expect, getattr(response, 'data', None))
        return Invoice.objects.get(pk=response.data['id']) if expect == 201 else None

    # ── create-from-appointment ──────────────────────────────────────────────

    def test_service_line_is_forced_to_zero_whatever_the_client_sends(self):
        invoice = self._invoice(self.covered, [
            {'description': 'Physio Session', 'quantity': 1, 'unit_price': '1500.00'},
        ])
        item = invoice.items.get()
        self.assertEqual(item.unit_price, Decimal('0'))
        self.assertEqual(item.description, f'Physio Session{COVERED}')
        self.assertEqual(invoice.total_amount, Decimal('0'))

    def test_extras_are_still_billed_next_to_the_covered_line(self):
        invoice = self._invoice(self.covered, [
            {'description': 'Physio Session', 'quantity': 1, 'unit_price': '1500.00'},
            {'description': 'Resistance band', 'quantity': 2, 'unit_price': '250.00'},
        ])
        lines = {i.description: i.unit_price for i in invoice.items.all()}
        self.assertEqual(lines[f'Physio Session{COVERED}'], Decimal('0'))
        self.assertEqual(lines['Resistance band'], Decimal('250.00'))
        self.assertEqual(invoice.total_amount, Decimal('500.00'))

    def test_a_covered_line_is_added_when_the_client_sends_no_matching_line(self):
        invoice = self._invoice(self.covered, [
            {'description': 'Resistance band', 'quantity': 1, 'unit_price': '250.00'},
        ])
        self.assertEqual(invoice.items.count(), 2)
        self.assertEqual(invoice.items.get(description=f'Physio Session{COVERED}').unit_price, Decimal('0'))
        self.assertEqual(invoice.total_amount, Decimal('250.00'))

    def test_no_items_sent_gives_a_single_covered_line(self):
        invoice = self._invoice(self.covered)
        item = invoice.items.get()
        self.assertEqual((item.description, item.unit_price), (f'Physio Session{COVERED}', Decimal('0')))

    def test_matching_is_case_insensitive_and_does_not_duplicate_the_line(self):
        invoice = self._invoice(self.covered, [
            {'description': 'physio session (Covered by Package)', 'quantity': 1, 'unit_price': '0'},
        ])
        self.assertEqual(invoice.items.count(), 1)

    def test_an_appointment_not_in_a_package_is_billed_exactly_as_before(self):
        invoice = self._invoice(self.plain, [
            {'description': 'Massage', 'quantity': 1, 'unit_price': '800.00'},
        ])
        item = invoice.items.get()
        self.assertEqual((item.description, item.unit_price), ('Massage', Decimal('800.00')))
        self.assertEqual(invoice.total_amount, Decimal('800.00'))

    def test_an_unassigned_appointment_of_a_package_service_is_billed_normally(self):
        """Being eligible is not enough; only an explicit assignment covers an appointment."""
        loose = self._appointment(self.physio, hour=11)
        invoice = self._invoice(loose, [{'description': 'Physio Session', 'quantity': 1, 'unit_price': '1500.00'}])
        self.assertEqual(invoice.total_amount, Decimal('1500.00'))

    def test_a_duplicate_invoice_for_the_same_appointment_is_rejected(self):
        self._invoice(self.covered)
        self._invoice(self.covered, expect=400)
        self.assertEqual(Invoice.objects.filter(appointment=self.covered).count(), 1)

    def test_a_failed_invoice_creation_leaves_the_assignment_and_balance_untouched(self):
        with mock.patch('apps.billing.views.InvoiceItem.objects.create', side_effect=RuntimeError('boom')):
            response = self.client.post(INVOICE_URL, {
                'appointment': self.covered.id, 'invoice_date': date.today().isoformat(),
            }, format='json')
        self.assertEqual(response.status_code, 500)
        self.assertEqual(Invoice.objects.filter(appointment=self.covered).count(), 0)
        self.assertTrue(PrivatePackageSessionUsage.objects.filter(appointment=self.covered).exists())
        self.assertEqual(self.package.remaining_sessions, 2)

    # ── generic invoice endpoint ─────────────────────────────────────────────

    def test_the_generic_invoice_endpoint_also_covers_the_service_line(self):
        # Note: this endpoint crashes when `inline_items` is sent (existing behaviour, unrelated
        # to packages and unused by the UI), so the covered line is checked without it.
        response = self.client.post('/api/invoices/', {
            'appointment': self.covered.id, 'patient': self.patient.id, 'clinic': self.clinic.id,
            'invoice_date': date.today().isoformat(),
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        invoice = Invoice.objects.get(pk=response.data['id'])
        self.assertEqual(invoice.total_amount, Decimal('0'))
        self.assertEqual(invoice.items.get().description, f'Physio Session{COVERED}')

    # ── editing a covered line ───────────────────────────────────────────────

    def test_a_covered_line_cannot_be_given_a_price(self):
        invoice = self._invoice(self.covered)
        item = invoice.items.get()
        response = self.client.patch(f'/api/invoice-items/{item.id}/', {'unit_price': '500.00'}, format='json')
        self.assertEqual(response.status_code, 400, response.data)
        item.refresh_from_db()
        self.assertEqual(item.unit_price, Decimal('0'))

        ok = self.client.patch(f'/api/invoice-items/{item.id}/', {'unit_price': '0'}, format='json')
        self.assertEqual(ok.status_code, 200, ok.data)

    def test_an_ordinary_line_can_still_be_repriced(self):
        invoice = self._invoice(self.plain, [{'description': 'Massage', 'quantity': 1, 'unit_price': '800.00'}])
        item = invoice.items.get()
        response = self.client.patch(f'/api/invoice-items/{item.id}/', {'unit_price': '900.00'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        item.refresh_from_db()
        self.assertEqual(item.unit_price, Decimal('900.00'))

    # ── bulk invoicing ───────────────────────────────────────────────────────

    def _bulk_params(self):
        return {
            'date_from': date.today(), 'date_to': date.today(),
            'status_filter': ['COMPLETED'], 'skip_existing': True,
            'invoice_date': date.today(),
        }

    def test_bulk_invoicing_skips_package_covered_appointments(self):
        for appt in (self.covered, self.plain):
            appt.status = 'COMPLETED'
            appt.save()

        preview = preview_bulk_invoice(self._bulk_params(), self.admin, self.clinic)
        self.assertEqual(preview['total_appointments'], 1)
        self.assertEqual([p['appointment_id'] for p in preview['preview']], [self.plain.id])

        run_bulk_invoice(self._bulk_params(), self.admin, self.clinic)
        self.assertFalse(Invoice.objects.filter(appointment=self.covered).exists())
        self.assertTrue(Invoice.objects.filter(appointment=self.plain).exists())

    def test_bulk_invoicing_bills_a_completed_appointment_again_once_it_is_unassigned(self):
        self.covered.status = 'COMPLETED'
        self.covered.save()
        package_service.unassign_appointment(self.admin, self.package, self.covered)
        preview = preview_bulk_invoice(self._bulk_params(), self.admin, self.clinic)
        self.assertEqual(preview['total_appointments'], 1)

    # ── appointment payload ──────────────────────────────────────────────────

    def test_appointment_api_shows_which_package_covers_an_appointment(self):
        data = self.client.get(f'/api/appointments/{self.covered.id}/').data
        self.assertEqual(data['private_package_id'], self.package.id)
        self.assertEqual(data['private_package_title'], 'Rehab Program')

        data = self.client.get(f'/api/appointments/{self.plain.id}/').data
        self.assertIsNone(data['private_package_id'])
        self.assertIsNone(data['private_package_title'])

    def test_assigning_appointments_does_not_add_queries_to_the_appointment_list(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        big = package_service.create_package(
            user=self.admin, patient_id=self.patient.id, title="Big", price='0', notes='',
            raw_items=[{'service': self.physio.id, 'quantity': 10}],
        )
        extra = [self._appointment(self.physio, hour=h) for h in (11, 12, 13, 14)]

        def list_queries():
            with CaptureQueriesContext(connection) as ctx:
                response = self.client.get('/api/appointments/', {'patient': self.patient.id, 'page_size': 50})
                self.assertEqual(response.status_code, 200)
            return len(ctx), response.data

        before, _ = list_queries()
        for appt in extra:
            package_service.assign_appointment(self.admin, big, appt)
        after, data = list_queries()

        self.assertEqual(before, after)
        rows = data['results'] if isinstance(data, dict) else data
        covered_ids = {r['id'] for r in rows if r['private_package_id']}
        self.assertTrue({a.id for a in extra} <= covered_ids)

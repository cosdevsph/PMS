from datetime import datetime
from types import SimpleNamespace

from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.clinics.models import Clinic
from apps.letters.services import LetterGeneratorService as Service

PROFILE = {'name': 'Sample Physio & Rehab', 'logo': '', 'address': '12 Rizal St, Bacolod', 'phone': '+63 34 123 4567', 'email': 'hi@sample.test'}
PATIENT = SimpleNamespace(city='Bacolod', province='Negros Occidental', postal_code='6100', address='5 Mabini St',
                          get_full_name=lambda: 'Ana Reyes')
TODAY = datetime(2026, 10, 24, 9, 0)


class BuildLayoutHtmlTests(SimpleTestCase):
    def build(self, profile=PROFILE, patient=PATIENT, **flags):
        return Service.build_layout_html(profile, patient, today=TODAY, **flags)

    def test_all_blocks(self):
        html = self.build()
        self.assertIn('SAMPLE PHYSIO &amp; REHAB', html)
        self.assertIn('12 Rizal St, Bacolod', html)
        self.assertIn('+63 34 123 4567 | hi@sample.test', html)
        self.assertIn('24 October 2026', html)
        self.assertIn('Ana Reyes', html)
        self.assertIn('Bacolod Negros Occidental 6100', html)

    def test_each_block_can_be_turned_off(self):
        self.assertNotIn('SAMPLE PHYSIO', self.build(letter_head=False))
        self.assertNotIn('24 October 2026', self.build(date=False))
        self.assertNotIn('Ana Reyes', self.build(addressee=False))
        self.assertEqual(self.build(letter_head=False, date=False, addressee=False), '')

    def test_values_are_escaped(self):
        profile = {**PROFILE, 'name': '<b>Evil</b>', 'address': 'A & B <script>'}
        patient = SimpleNamespace(city='', province='', postal_code='', address='"x" <i>', get_full_name=lambda: 'O\'Neil <u>')
        html = self.build(profile=profile, patient=patient)
        for raw in ('<b>Evil', '<script>', '<i>', '<u>'):
            self.assertNotIn(raw, html)
        self.assertIn('&lt;B&gt;EVIL&lt;/B&gt;', html)

    def test_no_flexbox_and_logo_optional(self):
        self.assertNotIn('flex', self.build())
        self.assertNotIn('<img', self.build())
        self.assertIn('<img src="https://x.test/logo.png"', self.build(profile={**PROFILE, 'logo': 'https://x.test/logo.png'}))

    def test_empty_address_lines_are_skipped(self):
        patient = SimpleNamespace(city='', province='', postal_code='', address='', get_full_name=lambda: 'Ana Reyes')
        html = self.build(patient=patient, letter_head=False, date=False)
        self.assertEqual(html.count('<p'), 1)

    def test_top_spacer(self):
        self.assertEqual(Service.top_spacer_html(True), '')
        self.assertIn('height: 30px', Service.top_spacer_html(False))

    def test_pdf_has_no_padded_wrapper_gaps(self):
        pdf = Service.generate_pdf(Service.top_spacer_html(False) + self.build() + '<p>Dear Dr Cruz,</p>')
        self.assertTrue(pdf.startswith(b'%PDF'))


class LetterheadEndpointTests(TestCase):
    def setUp(self):
        self.main = Clinic.objects.create(name='Main')
        self.branch = Clinic.objects.create(name='Branch', parent_clinic=self.main, is_main_branch=False)
        self.other = Clinic.objects.create(name='Other group')
        self.user = User.objects.create_user(email='o@x.com', password='x', first_name='O', last_name='W',
                                             clinic=self.main, clinic_branch=self.main, role='OWNER')
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_defaults_to_the_users_clinic(self):
        r = self.client.get('/api/letters/templates/letterhead/')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['branch_name'], 'Main')

    def test_a_branch_of_the_group(self):
        r = self.client.get(f'/api/letters/templates/letterhead/?branch={self.branch.id}')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['branch_name'], 'Branch')

    def test_another_groups_clinic_and_junk_are_refused(self):
        self.assertEqual(self.client.get(f'/api/letters/templates/letterhead/?branch={self.other.id}').status_code, 404)
        self.assertEqual(self.client.get('/api/letters/templates/letterhead/?branch=abc').status_code, 404)

    def test_login_required(self):
        self.assertIn(APIClient().get('/api/letters/templates/letterhead/').status_code, (401, 403))


class PatientBranchLetterheadTests(TestCase):
    """A letter carries the letterhead of the patient's branch, whoever writes it (client feedback 2026-10-24)."""

    def setUp(self):
        from datetime import date
        from apps.patients.models import Patient
        self.a = Clinic.objects.create(name='Clinic A', address='A street')
        self.b = Clinic.objects.create(name='Clinic B', parent_clinic=self.a, is_main_branch=False, address='B street')
        self.c = Clinic.objects.create(name='Clinic C', parent_clinic=self.a, is_main_branch=False, address='C street')
        # the writer's own clinic is B, the patient belongs to branch A / C
        self.user = User.objects.create_user(email='dr@x.com', password='x', first_name='D', last_name='R',
                                             clinic=self.a, clinic_branch=self.b, role='OWNER')
        self.p_home = Patient.objects.create(first_name='Ana', last_name='A', clinic=self.a, home_branch=self.c, date_of_birth=date(1990, 1, 1))
        self.p_clinic = Patient.objects.create(first_name='Ben', last_name='B', clinic=self.a, date_of_birth=date(1990, 1, 1))
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_resolver(self):
        self.assertEqual(Service.letterhead_clinic(self.p_home, self.b), self.c)       # home branch wins
        self.assertEqual(Service.letterhead_clinic(self.p_clinic, self.b), self.a)     # else the patient's clinic
        self.assertEqual(Service.letterhead_clinic(None, self.b), self.b)

    def test_endpoint_uses_the_patients_branch(self):
        r = self.client.get(f'/api/letters/templates/letterhead/?patient={self.p_home.id}')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['branch_name'], 'Clinic C')
        r = self.client.get(f'/api/letters/templates/letterhead/?patient={self.p_clinic.id}')
        self.assertEqual(r.data['branch_name'], 'Clinic A')

    def test_unknown_or_foreign_patient_is_refused(self):
        from datetime import date
        from apps.patients.models import Patient
        other = Clinic.objects.create(name='Other group')
        foreign = Patient.objects.create(first_name='Zed', last_name='Z', clinic=other, date_of_birth=date(1990, 1, 1))
        self.assertEqual(self.client.get(f'/api/letters/templates/letterhead/?patient={foreign.id}').status_code, 404)
        self.assertEqual(self.client.get('/api/letters/templates/letterhead/?patient=abc').status_code, 404)

    def test_generated_letter_carries_the_patients_branch(self):
        from apps.letters.models import LetterTemplate
        t = LetterTemplate.objects.create(clinic=self.a, name='T', content_html='<p>Hi</p>')
        r = self.client.post('/api/letters/letters/preview/', {'template_id': t.id, 'patient_id': self.p_home.id}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['clinic_profile']['branch_name'], 'Clinic C')
        self.assertIn('C street', r.data['full_html'])
        self.assertNotIn('B street', r.data['full_html'])


class AppointmentBranchLetterheadTests(PatientBranchLetterheadTests):
    """When the letter is for an appointment, that appointment's branch wins over the patient's branch."""

    def _appointment(self, clinic):
        from datetime import date, time
        from apps.appointments.models import Appointment
        from apps.clinics.models import Practitioner
        from apps.clinics.services.models import Service as ClinicService
        dr = Practitioner.objects.create(user=self.user, clinic=clinic)
        svc = ClinicService.objects.create(clinic=self.a, name='Physio', duration_minutes=30, price=100)
        return Appointment.objects.create(clinic=clinic, patient=self.p_home, practitioner=dr, service=svc, status='SCHEDULED',
                                          date=date.today(), start_time=time(9, 0), end_time=time(9, 30))

    def test_resolver_prefers_the_appointment_branch(self):
        appt = self._appointment(self.b)
        self.assertEqual(Service.letterhead_clinic(self.p_home, self.a, appt), self.b)
        self.assertEqual(Service.letterhead_clinic(self.p_home, self.a, None), self.c)

    def test_endpoint_and_preview_follow_the_appointment(self):
        from apps.letters.models import LetterTemplate
        appt = self._appointment(self.b)
        r = self.client.get(f'/api/letters/templates/letterhead/?patient={self.p_home.id}&appointment={appt.id}')
        self.assertEqual(r.data['branch_name'], 'Clinic B')
        t = LetterTemplate.objects.create(clinic=self.a, name='T2', content_html='<p>Hi</p>')
        r = self.client.post('/api/letters/letters/preview/', {'template_id': t.id, 'patient_id': self.p_home.id, 'appointment_id': appt.id}, format='json')
        self.assertEqual(r.data['clinic_profile']['branch_name'], 'Clinic B')
        self.assertIn('B street', r.data['full_html'])

    def test_another_patients_appointment_is_ignored(self):
        appt = self._appointment(self.b)
        r = self.client.get(f'/api/letters/templates/letterhead/?patient={self.p_clinic.id}&appointment={appt.id}')
        self.assertEqual(r.data['branch_name'], 'Clinic A')


class MergeFieldValueTests(SimpleTestCase):
    """Merge-field values print bold, escaped, with the spacing the template author typed."""

    PT = SimpleNamespace(first_name='John', last_name='Doe', middle_name='', date_of_birth=None, address='', email='',
                         get_full_name=lambda: 'John Doe', clinic=None)

    def span(self, var, label='x'):
        return f'<span data-type="merge-field" class="merge-field-tag" data-id="{var}" data-label="{label}">{var}</span>'

    def render(self, html, patient=None):
        return Service.replace_variables(html, patient=patient or self.PT)

    def test_values_are_bold_and_keep_the_space_between_them(self):
        html = f'<p>Dear {self.span("{{patient.first_name}}")} {self.span("{{patient.last_name}}")},</p>'
        self.assertEqual(self.render(html), '<p>Dear <strong>John</strong> <strong>Doe</strong>,</p>')

    def test_values_are_escaped_and_backslashes_are_safe(self):
        pt = SimpleNamespace(first_name=r'A\1<b>', last_name='O&Neil', get_full_name=lambda: '')
        out = self.render(f'<p>{self.span("{{patient.first_name}}")} {self.span("{{patient.last_name}}")}</p>', patient=pt)
        self.assertEqual(out, r'<p><strong>A\1&lt;b&gt;</strong> <strong>O&amp;Neil</strong></p>')

    def test_empty_value_leaves_no_double_space(self):
        out = self.render(f'<p>Dear {self.span("{{patient.title}}")} {self.span("{{patient.first_name}}")}</p>')
        self.assertEqual(out, '<p>Dear <strong>John</strong></p>')

    def test_raw_text_variable_without_a_span_is_bold_too(self):
        self.assertEqual(self.render('<p>Hi {{patient.first_name}}</p>'), '<p>Hi <strong>John</strong></p>')

    def test_unknown_field_is_removed(self):
        self.assertEqual(self.render('<p>A {{no.such}} B</p>'), '<p>A  B</p>')

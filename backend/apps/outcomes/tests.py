import copy
import json
import tempfile
from pathlib import Path

from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.test import TestCase

from apps.accounts.models import User
from apps.clinics.models import Clinic
from apps.patients.models import Patient, PatientCase

from apps.outcomes.models import ClinicOutcomeMeasure, OutcomeAssessment, OutcomeAssessmentAuditLog, OutcomeDefinition
from apps.outcomes.scoring import score_assessment
from apps.outcomes.services import LIBRARY_DIR, load_library, publish_definition
from apps.outcomes.validation import DefinitionError, validate_answers, validate_definition


def synthetic(**overrides):
    """A made-up test-only measure (not a real instrument): 4 choice items, 2 subscales, one reversed."""
    options = [{'value': v, 'label': f'Option {v}'} for v in range(0, 4)]
    data = {
        'schema': 'malasakit.outcome-definition/1', 'code': 'TESTM', 'version': '1.0.0', 'name': 'Test measure',
        'abbreviation': 'TM', 'category': 'general',
        'licence': {'category': 'D', 'notes': 'synthetic', 'approved_for_production': True},
        'items': [
            {'id': 'a1', 'type': 'single_choice', 'prompt': 'Item a1', 'options': options},
            {'id': 'a2', 'type': 'single_choice', 'prompt': 'Item a2', 'options': options},
            {'id': 'b1', 'type': 'single_choice', 'prompt': 'Item b1', 'options': options},
            {'id': 'b2', 'type': 'yes_no', 'prompt': 'Item b2', 'required': False},
        ],
        'scoring': {
            'method': 'sum', 'items': ['a1', 'a2', 'b1', 'b2'], 'range': [0, 10], 'direction': 'higher_worse',
            'reverse_items': ['a2'],
            'missing': {'max_missing': 0, 'rule': 'invalid'},
            'subscales': [
                {'id': 'sa', 'name': 'Sub A', 'items': ['a1', 'a2'], 'method': 'sum', 'range': [0, 6]},
                {'id': 'sb', 'name': 'Sub B', 'items': ['b1', 'b2'], 'method': 'percent_of_max'},
            ],
        },
    }
    data.update(overrides)
    return data


class DefinitionValidationTest(TestCase):
    def test_valid_definition_passes(self):
        validate_definition(synthetic())

    def test_library_files_are_valid(self):
        for path in Path(LIBRARY_DIR).glob('*.json'):
            validate_definition(json.loads(path.read_text()))

    def test_problems_are_all_reported(self):
        bad = synthetic(code='bad code', version='1', items=[])
        with self.assertRaises(DefinitionError) as ctx:
            validate_definition(bad)
        text = ' '.join(ctx.exception.errors)
        self.assertIn('code', text)
        self.assertIn('version', text)
        self.assertIn('items', text)

    def test_unknown_scoring_method_is_rejected(self):
        data = synthetic()
        data['scoring']['method'] = 'eval("1+1")'
        with self.assertRaises(DefinitionError):
            validate_definition(data)

    def test_scoring_cannot_refer_to_unknown_item(self):
        data = synthetic()
        data['scoring']['items'] = ['a1', 'nope']
        with self.assertRaises(DefinitionError):
            validate_definition(data)

    def test_missing_answers_need_an_explicit_rule(self):
        data = synthetic()
        data['scoring']['missing'] = {'max_missing': 1, 'rule': 'invalid'}
        with self.assertRaises(DefinitionError):
            validate_definition(data)

    def test_licence_b_cannot_be_approved_without_confirmed_permission(self):
        for licence in (
            {'category': 'B', 'approved_for_production': True},
            {'category': 'B', 'approved_for_production': True, 'permission_confirmed': True},
            {'category': 'B', 'approved_for_production': True, 'permission_confirmed': True, 'permission_note': '  '},
            {'category': 'C', 'approved_for_production': True, 'permission_confirmed': True, 'permission_note': 'x'},
        ):
            data = synthetic()
            data['licence'] = licence
            with self.assertRaises(DefinitionError, msg=licence):
                validate_definition(data)

    def test_licence_b_with_recorded_permission_can_be_approved(self):
        data = synthetic()
        data['licence'] = {'category': 'B', 'approved_for_production': True, 'permission_confirmed': True,
                           'permission_note': 'Owner holds written permission.'}
        validate_definition(data)

    def test_slider_range_and_step_must_fit(self):
        data = synthetic()
        data['items'][0] = {'id': 'a1', 'type': 'slider', 'prompt': 'x', 'min': 0, 'max': 10, 'step': 3}
        with self.assertRaises(DefinitionError):
            validate_definition(data)

    def test_non_object_is_rejected(self):
        with self.assertRaises(DefinitionError):
            validate_definition(['not', 'an', 'object'])


class AnswerValidationTest(TestCase):
    def setUp(self):
        self.slider = synthetic(code='SLID')
        self.slider['items'] = [{
            'id': 's1', 'type': 'slider', 'prompt': 'x', 'min': 0, 'max': 100, 'step': 5, 'required': True,
        }]
        self.slider['scoring'] = {'method': 'sum', 'items': ['s1'], 'direction': 'higher_worse'}

    def test_slider_keeps_exact_value(self):
        self.assertEqual(validate_answers(self.slider, {'s1': 35}), {'s1': 35})

    def test_slider_rejects_out_of_range_and_off_step(self):
        for value in (-5, 105, 33, 'abc', True):
            with self.assertRaises(DefinitionError, msg=value):
                validate_answers(self.slider, {'s1': value})

    def test_required_item_must_be_answered(self):
        with self.assertRaises(DefinitionError):
            validate_answers(self.slider, {})

    def test_choice_must_be_an_option(self):
        with self.assertRaises(DefinitionError):
            validate_answers(synthetic(), {'a1': 9, 'a2': 1, 'b1': 1})

    def test_unknown_item_is_rejected(self):
        with self.assertRaises(DefinitionError):
            validate_answers(synthetic(), {'a1': 1, 'a2': 1, 'b1': 1, 'zzz': 1})


class ScoringTest(TestCase):
    def test_sum_with_reverse_and_subscales(self):
        answers = {'a1': 2, 'a2': 1, 'b1': 3, 'b2': True}
        result = score_assessment(synthetic(), answers)
        # a2 reversed: 0+3-1 = 2 ; total = 2 + 2 + 3 + 1
        self.assertEqual(result['total']['score'], 8)
        self.assertEqual(result['subscales']['sa']['score'], 4)
        # b: (3+1 - 0) / (3+1 - 0) * 100
        self.assertEqual(result['subscales']['sb']['score'], 100)

    def test_missing_answer_makes_score_invalid_not_zero(self):
        result = score_assessment(synthetic(), {'a1': 2, 'a2': 1, 'b1': 3})
        self.assertFalse(result['total']['valid'])
        self.assertIsNone(result['total']['score'])
        self.assertEqual(result['total']['missing'], 1)

    def test_prorate_rule_uses_mean_of_answered(self):
        data = synthetic()
        data['scoring']['missing'] = {'max_missing': 1, 'rule': 'prorate_mean'}
        result = score_assessment(data, {'a1': 2, 'a2': 1, 'b1': 3})
        # values 2, 2(rev), 3 -> total 7 over 3 -> 7/3*4
        self.assertEqual(result['total']['score'], round(7 / 3 * 4, 2))

    def test_mean_method(self):
        data = synthetic()
        data['scoring']['method'] = 'mean'
        result = score_assessment(data, {'a1': 2, 'a2': 1, 'b1': 3, 'b2': False})
        self.assertEqual(result['total']['score'], 1.75)

    def test_external_method_computes_nothing(self):
        data = synthetic()
        data['scoring'] = {'method': 'external', 'direction': 'higher_better'}
        self.assertIsNone(score_assessment(data, {})['total'])


class PublishingTest(TestCase):
    def test_publish_is_idempotent_and_immutable(self):
        first, created = publish_definition(synthetic())
        self.assertTrue(created)
        again, created = publish_definition(synthetic())
        self.assertFalse(created)
        self.assertEqual(first.pk, again.pk)

        changed = synthetic()
        changed['items'][0]['prompt'] = 'Edited wording'
        with self.assertRaises(DefinitionError):
            publish_definition(changed)

        first.definition = changed
        with self.assertRaises(ValueError):
            first.save()
        with self.assertRaises(ValueError):
            first.delete()

    def test_new_version_is_a_new_row(self):
        publish_definition(synthetic())
        v2 = synthetic(version='1.1.0')
        _, created = publish_definition(v2)
        self.assertTrue(created)
        self.assertEqual(OutcomeDefinition.objects.filter(code='TESTM').count(), 2)

    def test_load_library_command_and_rejection(self):
        # `migrate` already published the library files (post_migrate), so loading again changes nothing.
        self.assertTrue(OutcomeDefinition.objects.filter(code='NPRS').exists())
        self.assertEqual(dict(load_library())['NPRS.json'], 'unchanged')
        OutcomeDefinition.objects.all().delete()  # queryset delete skips the model's own guard
        self.assertEqual(dict(load_library())['NPRS.json'], 'created')
        call_command('load_outcome_definitions', stdout=open('/dev/null', 'w'))
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / 'broken.json').write_text('{"code": "x"}')
            (Path(tmp) / 'garbage.json').write_text('not json')
            outcome = dict(load_library(tmp))
        self.assertTrue(outcome['broken.json'].startswith('REJECTED'))
        self.assertTrue(outcome['garbage.json'].startswith('REJECTED'))


def make_user(email, clinic, role, **extra):
    return User.objects.create_user(email=email, password='password', first_name=role.title(), last_name='U',
                                    clinic=clinic, role=role, **extra)


class OutcomeApiTest(APITestCase):
    def setUp(self):
        cache.clear()  # the password check shares the login lockout counter
        self.clinic = Clinic.objects.create(name='Clinic A')
        self.branch1 = Clinic.objects.create(name='Branch 1', parent_clinic=self.clinic)
        self.branch2 = Clinic.objects.create(name='Branch 2', parent_clinic=self.clinic)
        self.other_clinic = Clinic.objects.create(name='Clinic B')

        self.owner = make_user('o@example.com', self.clinic, 'OWNER')
        self.manager = make_user('m@example.com', self.clinic, 'BRANCH_MANAGER')
        self.prac = make_user('p@example.com', self.clinic, 'PRACTITIONER', clinic_branch=self.branch1)
        self.finance = make_user('f@example.com', self.clinic, 'FINANCE')
        self.other_owner = make_user('ob@example.com', self.other_clinic, 'OWNER')

        self.p1 = Patient.objects.create(first_name='Ann', last_name='One', date_of_birth='1990-01-01',
                                         clinic=self.branch1, home_branch=self.branch1)
        self.p2 = Patient.objects.create(first_name='Bea', last_name='Two', date_of_birth='1990-01-01',
                                         clinic=self.branch2, home_branch=self.branch2)
        self.p_other = Patient.objects.create(first_name='Cy', last_name='Three', date_of_birth='1990-01-01',
                                              clinic=self.other_clinic, home_branch=self.other_clinic)
        self.case = PatientCase.objects.create(patient=self.p1, title='Case 1')
        self.case_other = PatientCase.objects.create(patient=self.p2, title='Case 2')

        self.defn, _ = publish_definition(synthetic())
        self.nprs, _ = publish_definition(json.loads((Path(LIBRARY_DIR) / 'NPRS.json').read_text()))
        self.vas, _ = publish_definition(json.loads((Path(LIBRARY_DIR) / 'VAS_PAIN.json').read_text()))
        self.answers = {'a1': 2, 'a2': 1, 'b1': 3, 'b2': True}

    def enable(self, code, user=None, clinic=None):
        self.client.force_authenticate(user=user or self.owner)
        return self.client.post(reverse('outcome-library-toggle', args=[code]), {'enabled': True}, format='json')

    def create(self, user=None, **overrides):
        self.client.force_authenticate(user=user or self.owner)
        body = {'patient': self.p1.id, 'definition': self.defn.id, 'answers': self.answers, 'password': 'password'}
        body.update(overrides)
        return self.client.post(reverse('outcome-assessments-list'), body, format='json')

    # ── clinic library ──
    def test_library_is_manager_only(self):
        self.client.force_authenticate(user=self.prac)
        self.assertEqual(self.client.get(reverse('outcome-library')).status_code, 403)
        self.assertEqual(self.enable('NPRS', user=self.prac).status_code, 403)
        self.assertEqual(self.enable('NPRS', user=self.manager).status_code, 200)

    def test_unapproved_measure_is_not_in_the_library(self):
        data = synthetic(code='LOCKED')
        data['licence'] = {'category': 'D', 'approved_for_production': False}
        publish_definition(data)
        self.client.force_authenticate(user=self.owner)
        codes = {row['code'] for row in self.client.get(reverse('outcome-library')).data}
        self.assertNotIn('LOCKED', codes)
        self.assertEqual(self.enable('LOCKED').status_code, 400)

    def test_enable_is_per_clinic(self):
        self.enable('NPRS')
        self.client.force_authenticate(user=self.other_owner)
        rows = {r['code']: r['enabled'] for r in self.client.get(reverse('outcome-library')).data}
        self.assertFalse(rows['NPRS'])
        self.client.force_authenticate(user=self.prac)
        ids = [d['code'] for d in self.client.get(reverse('outcome-definitions')).data]
        self.assertEqual(ids, ['NPRS'])

    def test_definitions_need_feature_access(self):
        self.client.force_authenticate(user=self.finance)
        self.assertEqual(self.client.get(reverse('outcome-definitions')).status_code, 403)

    # ── assessments ──
    def test_cannot_use_a_measure_that_is_switched_off(self):
        response = self.create()
        self.assertEqual(response.status_code, 400)
        self.assertIn('definition', response.data)

    def test_create_scores_on_the_server_and_encrypts_answers(self):
        self.enable('TESTM')
        response = self.create(patient_case=self.case.id, scores={'total': {'score': 999}})
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['scores']['total']['score'], 8)
        row = OutcomeAssessment.objects.get(pk=response.data['id'])
        self.assertNotIn('"a1"', row.encrypted_answers)
        self.assertEqual(row.answers, {'a1': 2, 'a2': 1, 'b1': 3, 'b2': True})
        self.assertEqual(row.patient_case_id, self.case.id)
        self.assertEqual(row.clinic_id, self.clinic.id)
        self.assertEqual(row.scoring_snapshot['method'], 'sum')

    def test_invalid_answers_are_rejected(self):
        self.enable('TESTM')
        response = self.create(answers={'a1': 99, 'a2': 1, 'b1': 3})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(OutcomeAssessment.objects.count(), 0)

    def test_slider_value_is_stored_exactly(self):
        self.enable('VAS_PAIN')
        response = self.create(definition=self.vas.id, answers={'pain_vas': 37})
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(OutcomeAssessment.objects.get().answers, {'pain_vas': 37})
        self.assertEqual(self.create(definition=self.vas.id, answers={'pain_vas': 101}).status_code, 400)
        self.assertEqual(self.create(definition=self.vas.id, answers={'pain_vas': 36.5}).status_code, 400)

    def test_case_must_belong_to_the_patient(self):
        self.enable('TESTM')
        self.assertEqual(self.create(patient_case=self.case_other.id).status_code, 400)

    def test_other_clinics_patient_is_refused(self):
        self.enable('TESTM')
        self.assertEqual(self.create(patient=self.p_other.id).status_code, 400)

    def test_practitioner_only_reaches_own_branch_patients(self):
        self.enable('TESTM')
        self.assertEqual(self.create(user=self.prac, patient=self.p2.id).status_code, 400)
        self.assertEqual(self.create(user=self.prac, patient=self.p1.id).status_code, 201)

    def test_history_is_clinic_scoped_and_repeat_creates_new_rows(self):
        self.enable('TESTM')
        self.create()
        self.create()
        self.client.force_authenticate(user=self.owner)
        listed = self.client.get(reverse('outcome-assessments-list'), {'patient': self.p1.id}).data
        self.assertEqual(len(listed['results'] if isinstance(listed, dict) else listed), 2)
        self.client.force_authenticate(user=self.other_owner)
        listed = self.client.get(reverse('outcome-assessments-list')).data
        self.assertEqual(len(listed['results'] if isinstance(listed, dict) else listed), 0)

    def test_history_survives_switching_off_and_a_new_version(self):
        self.enable('TESTM')
        saved = self.create().data
        # switch off
        self.client.force_authenticate(user=self.owner)
        self.client.post(reverse('outcome-library-toggle', args=['TESTM']), {'enabled': False}, format='json')
        # publish a changed version
        v2 = synthetic(version='2.0.0')
        v2['items'][0]['prompt'] = 'Reworded item a1'
        v2['scoring']['method'] = 'mean'
        publish_definition(v2)

        detail = self.client.get(reverse('outcome-assessments-detail', args=[saved['id']])).data
        self.assertEqual(detail['version'], '1.0.0')
        self.assertEqual(detail['scores']['total']['score'], 8)
        self.assertEqual(detail['items'][0]['prompt'], 'Item a1')
        self.assertEqual(detail['answers']['a1'], 2)

    def test_newer_version_is_offered_after_publishing(self):
        self.enable('TESTM')
        publish_definition(synthetic(version='1.2.0'))
        self.client.force_authenticate(user=self.owner)
        shown = self.client.get(reverse('outcome-definitions')).data
        self.assertEqual([d['version'] for d in shown], ['1.2.0'])

    def test_void_keeps_the_record_and_needs_a_reason(self):
        self.enable('TESTM')
        saved = self.create().data
        url = reverse('outcome-assessments-void', args=[saved['id']])
        self.assertEqual(self.client.post(url, {}, format='json').status_code, 400)
        self.assertEqual(self.client.post(url, {'reason': 'Wrong patient'}, format='json').status_code, 200)
        row = OutcomeAssessment.objects.get(pk=saved['id'])
        self.assertEqual(row.status, 'VOIDED')
        self.assertEqual(row.void_reason, 'Wrong patient')

    def test_trend_skips_voided_and_invalid_results(self):
        self.enable('TESTM')
        ok = self.create().data
        voided = self.create().data
        self.client.post(reverse('outcome-assessments-void', args=[voided['id']]), {'reason': 'x'}, format='json')
        self.client.force_authenticate(user=self.owner)
        data = self.client.get(reverse('outcome-assessments-trend'), {'patient': self.p1.id, 'code': 'TESTM'}).data
        self.assertEqual([p['id'] for p in data['points']], [ok['id']])
        self.assertIn('completed_at', data['points'][0])
        self.assertEqual(data['measure']['direction'], 'higher_worse')

    def test_read_only_user_cannot_create(self):
        self.enable('TESTM')
        ro = make_user('ro@example.com', self.clinic, 'READ_ONLY')
        self.assertEqual(self.create(user=ro).status_code, 403)

    def test_patient_merge_moves_assessments(self):
        from apps.patients.services.merge_service import PatientMergeService
        self.enable('TESTM')
        saved = self.create().data
        self.assertEqual(PatientMergeService._transfer(OutcomeAssessment, self.p1, self.p2), [saved['id']])
        self.assertEqual(OutcomeAssessment.objects.get().patient_id, self.p2.id)

    # ── password confirmation ──
    def test_password_is_required(self):
        self.enable('TESTM')
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(reverse('outcome-assessments-list'), {
            'patient': self.p1.id, 'definition': self.defn.id, 'answers': self.answers}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)
        self.assertEqual(OutcomeAssessment.objects.count(), 0)

    def test_wrong_password_saves_nothing(self):
        self.enable('TESTM')
        response = self.create(password='not-the-password')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Incorrect password', str(response.data['password']))
        self.assertEqual(OutcomeAssessment.objects.count(), 0)

    def test_repeated_wrong_passwords_lock_out_even_the_right_one(self):
        self.enable('TESTM')
        for _ in range(5):
            self.assertEqual(self.create(password='nope').status_code, 400)
        locked = self.create(password='password')
        self.assertEqual(locked.status_code, 429)
        self.assertEqual(OutcomeAssessment.objects.count(), 0)

    def test_right_password_after_a_wrong_one_saves(self):
        self.enable('TESTM')
        self.assertEqual(self.create(password='nope').status_code, 400)
        self.assertEqual(self.create().status_code, 201)

    def test_password_is_not_stored_or_returned(self):
        self.enable('TESTM')
        response = self.create()
        self.assertNotIn('password', response.data)

    # ── Bournemouth Back Questionnaire (library file) ──
    def test_bournemouth_is_in_the_library_and_scores_as_a_sum(self):
        self.enable('BQ_BACK')
        bq = OutcomeDefinition.objects.get(code='BQ_BACK')
        self.assertEqual(len(bq.definition['items']), 7)
        answers = {i['id']: 5 for i in bq.definition['items']}
        response = self.create(definition=bq.id, answers=answers)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['scores']['total']['score'], 35)
        self.assertEqual(response.data['scores']['total']['range'], [0, 70])
        self.assertEqual(response.data['scores']['direction'], 'higher_worse')

    def test_bournemouth_needs_every_answer(self):
        self.enable('BQ_BACK')
        bq = OutcomeDefinition.objects.get(code='BQ_BACK')
        answers = {i['id']: 5 for i in bq.definition['items'][:-1]}
        self.assertEqual(self.create(definition=bq.id, answers=answers).status_code, 400)

    # ── void details and the emailed report ──
    def test_list_shows_who_voided_and_when(self):
        self.enable('TESTM')
        saved = self.create().data
        self.client.post(reverse('outcome-assessments-void', args=[saved['id']]), {'reason': 'Wrong visit'}, format='json')
        listed = self.client.get(reverse('outcome-assessments-list'), {'patient': self.p1.id}).data
        row = (listed['results'] if isinstance(listed, dict) else listed)[0]
        self.assertTrue(row['voided_by_name'])
        self.assertIsNotNone(row['voided_at'])
        self.assertTrue(row['created_by_name'])

    def _email(self, user=None, assessment_id=None, **fields):
        self.client.force_authenticate(user=user or self.owner)
        if assessment_id is None:
            assessment_id = self.saved_id
        body = {'to': 'someone@example.com', 'attachment': SimpleUploadedFile('r.pdf', b'%PDF-1.4 test', content_type='application/pdf')}
        body.update(fields)
        return self.client.post(reverse('outcome-assessments-email', args=[assessment_id]), body, format='multipart')

    def _saved(self):
        self.enable('TESTM')
        self.saved_id = self.create().data['id']

    def test_email_sends_the_pdf_and_is_audited(self):
        self._saved()
        response = self._email()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ['someone@example.com'])
        self.assertEqual(sent.attachments[0][2], 'application/pdf')
        self.assertTrue(OutcomeAssessmentAuditLog.objects.filter(assessment_id=self.saved_id, action='EMAILED').exists())

    def test_email_rejects_a_bad_address_a_non_pdf_and_a_missing_file(self):
        self._saved()
        self.assertEqual(self._email(to='not-an-email').status_code, 400)
        self.assertEqual(self._email(attachment=SimpleUploadedFile('r.pdf', b'hello', content_type='application/pdf')).status_code, 400)
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(reverse('outcome-assessments-email', args=[self.saved_id]), {'to': 'a@example.com'}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_email_defaults_to_the_patient_address_and_needs_one(self):
        self._saved()
        self.assertEqual(self._email(to='').status_code, 400)  # patient has no email on file
        self.p1.email = 'patient@example.com'
        self.p1.save()
        self.assertEqual(self._email(to='').status_code, 200)
        self.assertEqual(mail.outbox[0].to, ['patient@example.com'])

    def test_email_is_limited_to_your_clinic_and_to_editors(self):
        self._saved()
        self.assertEqual(self._email(user=self.other_owner).status_code, 404)
        ro = make_user('ro2@example.com', self.clinic, 'READ_ONLY')
        self.assertEqual(self._email(user=ro).status_code, 403)
        self.assertEqual(len(mail.outbox), 0)

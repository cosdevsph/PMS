from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.clinics.models import Clinic, Practitioner
from apps.patients.models import Patient
from apps.records.models import OutcomeMeasure


def _user(email, clinic, role):
    return User.objects.create_user(
        email=email, password='password', first_name=role.title(), last_name='User', clinic=clinic, role=role,
    )


class OutcomeMeasureScopingTest(APITestCase):
    """The legacy outcome-measures endpoint is limited to the caller's own clinic, Owners included."""

    def setUp(self):
        self.clinic_a = Clinic.objects.create(name='Clinic A')
        self.branch_a = Clinic.objects.create(name='Branch A', parent_clinic=self.clinic_a)
        self.clinic_b = Clinic.objects.create(name='Clinic B')

        self.owner_a = _user('owner-a@example.com', self.clinic_a, 'OWNER')
        self.owner_b = _user('owner-b@example.com', self.clinic_b, 'OWNER')
        self.finance_a = _user('finance-a@example.com', self.clinic_a, 'FINANCE')
        self.read_only_a = _user('readonly-a@example.com', self.clinic_a, 'READ_ONLY')
        prac_user = _user('prac-a@example.com', self.clinic_a, 'PRACTITIONER')
        self.practitioner_a = Practitioner.objects.create(
            user=prac_user, clinic=self.clinic_a, license_number='L-1', specialization='Physio',
        )

        self.patient_a = Patient.objects.create(first_name='Ann', last_name='A', date_of_birth='1990-01-01', clinic=self.clinic_a)
        self.patient_branch = Patient.objects.create(first_name='Bea', last_name='Branch', date_of_birth='1990-01-01', clinic=self.branch_a)
        self.patient_b = Patient.objects.create(first_name='Bob', last_name='B', date_of_birth='1990-01-01', clinic=self.clinic_b)

        self.om_a = self._measure(self.patient_a)
        self.om_branch = self._measure(self.patient_branch)
        self.om_b = self._measure(self.patient_b)
        self.url = reverse('outcome-measures-list')

    def _measure(self, patient):
        return OutcomeMeasure.objects.create(
            patient=patient, practitioner=self.practitioner_a,
            measure_name='NPRS', date=date(2026, 10, 1), score=5, max_score=10,
        )

    def _ids(self, response):
        data = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        return {row['id'] for row in data}

    def test_owner_sees_own_clinic_and_branches_only(self):
        self.client.force_authenticate(user=self.owner_a)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._ids(response), {self.om_a.id, self.om_branch.id})

    def test_other_clinic_owner_cannot_see_these_rows(self):
        self.client.force_authenticate(user=self.owner_b)
        self.assertEqual(self._ids(self.client.get(self.url)), {self.om_b.id})

    def test_owner_cannot_open_another_clinics_measure(self):
        self.client.force_authenticate(user=self.owner_a)
        detail = reverse('outcome-measures-detail', args=[self.om_b.id])
        self.assertEqual(self.client.get(detail).status_code, status.HTTP_404_NOT_FOUND)

    def test_trends_are_clinic_scoped(self):
        self.client.force_authenticate(user=self.owner_a)
        response = self.client.get(reverse('outcome-measures-trends'), {'patient': self.patient_b.id, 'measure_name': 'NPRS'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_create_for_another_clinics_patient_is_rejected(self):
        self.client.force_authenticate(user=self.owner_a)
        response = self.client.post(self.url, {
            'patient': self.patient_b.id, 'practitioner': self.practitioner_a.id,
            'measure_name': 'NPRS', 'date': '2026-10-02', 'score': '4', 'max_score': '10',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('patient', response.data)

    def test_create_for_own_branch_patient_is_allowed(self):
        self.client.force_authenticate(user=self.owner_a)
        response = self.client.post(self.url, {
            'patient': self.patient_branch.id, 'practitioner': self.practitioner_a.id,
            'measure_name': 'NPRS', 'date': '2026-10-02', 'score': '4', 'max_score': '10',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_without_feature_access_is_denied(self):
        self.client.force_authenticate(user=self.finance_a)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)

    def test_read_only_user_cannot_write(self):
        self.client.force_authenticate(user=self.read_only_a)
        response = self.client.post(self.url, {
            'patient': self.patient_a.id, 'practitioner': self.practitioner_a.id,
            'measure_name': 'NPRS', 'date': '2026-10-02', 'score': '4', 'max_score': '10',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

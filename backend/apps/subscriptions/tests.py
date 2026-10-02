import json
from decimal import Decimal
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import UserBranchAccess
from apps.clinics.models import Clinic, Practitioner
from apps.subscriptions.models import PayMongoPaymentLog, Subscription
from apps.subscriptions.plans import (
    CYCLE_ANNUAL,
    CYCLE_MONTHLY,
    PLAN_ENTERPRISE,
    PLAN_GROWTH,
    PLAN_PROFESSIONAL,
    PLAN_STARTER,
    PLAN_TRIAL,
    calculate_subscription_amount,
    get_all_plans_summary,
    get_plan_metadata,
)
from apps.subscriptions.services import (
    BranchLimitReachedException,
    ClinicianLimitReachedException,
    check_branch_capacity,
    check_clinician_capacity,
    get_clinician_allocations_for_clinic,
    get_subscription_usage_summary,
)

User = get_user_model()


class PlansCatalogAndPricingTestCase(TestCase):
    def test_starter_pricing(self):
        monthly = calculate_subscription_amount(PLAN_STARTER, CYCLE_MONTHLY)
        self.assertEqual(monthly['total_centavos'], 399900)
        self.assertEqual(monthly['total_pesos'], Decimal('3999.00'))

        annual = calculate_subscription_amount(PLAN_STARTER, CYCLE_ANNUAL)
        self.assertEqual(annual['total_centavos'], 4300000)
        self.assertEqual(annual['total_pesos'], Decimal('43000.00'))

    def test_growth_pricing_with_additional_branches(self):
        calc = calculate_subscription_amount(PLAN_GROWTH, CYCLE_MONTHLY, additional_branches=2)
        self.assertEqual(calc['base_plan_centavos'], 699900)
        self.assertEqual(calc['additional_branch_centavos'], 500000)
        self.assertEqual(calc['total_centavos'], 1199900)
        self.assertEqual(calc['total_pesos'], Decimal('11999.00'))

    def test_professional_pricing_annual_with_branches(self):
        calc = calculate_subscription_amount(PLAN_PROFESSIONAL, CYCLE_ANNUAL, additional_branches=1)
        self.assertEqual(calc['base_plan_centavos'], 10800000)
        self.assertEqual(calc['additional_branch_centavos'], 3600000)
        self.assertEqual(calc['total_centavos'], 14400000)
        self.assertEqual(calc['total_pesos'], Decimal('144000.00'))

    def test_enterprise_pricing(self):
        with self.assertRaises(ValueError):
            calculate_subscription_amount(PLAN_ENTERPRISE, CYCLE_MONTHLY)

        calc = calculate_subscription_amount(
            PLAN_ENTERPRISE,
            CYCLE_MONTHLY,
            custom_amount_centavos=2500000,
        )
        self.assertEqual(calc['total_centavos'], 2500000)
        self.assertEqual(calc['total_pesos'], Decimal('25000.00'))

    def test_invalid_plan_and_cycle(self):
        with self.assertRaises(ValueError):
            calculate_subscription_amount('UNKNOWN_PLAN', CYCLE_MONTHLY)
        with self.assertRaises(ValueError):
            calculate_subscription_amount(PLAN_STARTER, 'WEEKLY')
        with self.assertRaises(ValueError):
            calculate_subscription_amount(PLAN_STARTER, CYCLE_MONTHLY, additional_branches=-1)

    def test_public_plans_summary(self):
        summary = get_all_plans_summary()
        self.assertEqual(len(summary), 4)
        plan_ids = [p['id'] for p in summary]
        self.assertIn(PLAN_STARTER, plan_ids)
        self.assertIn(PLAN_GROWTH, plan_ids)
        self.assertIn(PLAN_PROFESSIONAL, plan_ids)
        self.assertIn(PLAN_ENTERPRISE, plan_ids)


class SubscriptionModelTestCase(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(name='Test Practice Clinic', is_main_branch=True)
        self.user = User.objects.create_user(
            email='owner@testpractice.com',
            password='Password123!',
            first_name='Practice',
            last_name='Owner',
            role='ADMIN',
            roles=['ADMIN'],
            clinic=self.clinic,
        )

    def test_clinic_subscription_initialization(self):
        sub = self.clinic.subscription
        self.assertIsNotNone(sub)
        self.assertEqual(sub.plan, PLAN_TRIAL)
        self.assertEqual(sub.effective_clinician_limit, 4)
        self.assertEqual(sub.effective_branch_limit, 1)
        self.assertTrue(sub.is_active())
        self.assertTrue(sub.is_trial)

    def test_user_subscription_property_resolution(self):
        self.assertEqual(self.user.subscription.pk, self.clinic.subscription.pk)

    def test_plan_activation_monthly_and_annual(self):
        sub = self.clinic.subscription
        sub.activate_plan(PLAN_GROWTH, billing_cycle=CYCLE_MONTHLY, additional_branches=1)
        self.assertEqual(sub.plan, PLAN_GROWTH)
        self.assertEqual(sub.effective_clinician_limit, 8)
        self.assertEqual(sub.effective_branch_limit, 2)
        self.assertFalse(sub.is_trial)
        self.assertEqual(sub.billing_cycle, CYCLE_MONTHLY)

        sub.activate_plan(PLAN_PROFESSIONAL, billing_cycle=CYCLE_ANNUAL, additional_branches=2)
        self.assertEqual(sub.plan, PLAN_PROFESSIONAL)
        self.assertEqual(sub.effective_clinician_limit, 12)
        self.assertEqual(sub.effective_branch_limit, 3)
        self.assertEqual(sub.billing_cycle, CYCLE_ANNUAL)

    def test_enterprise_custom_limits(self):
        sub = self.clinic.subscription
        sub.activate_plan(
            PLAN_ENTERPRISE,
            billing_cycle=CYCLE_MONTHLY,
            custom_clinician_limit=25,
            custom_branch_limit=5,
            additional_branches=0,
        )
        self.assertEqual(sub.plan, PLAN_ENTERPRISE)
        self.assertEqual(sub.effective_clinician_limit, 25)
        self.assertEqual(sub.effective_branch_limit, 5)


class ClinicianAllocationEngineTestCase(TestCase):
    def setUp(self):
        self.main_clinic = Clinic.objects.create(name='Alpha Practice', is_main_branch=True)
        self.sub = self.main_clinic.subscription
        self.sub.activate_plan(PLAN_STARTER, billing_cycle=CYCLE_MONTHLY)  # Limit: 4 clinicians, 1 branch

        self.branch_b = Clinic.objects.create(
            name='Alpha Branch B',
            parent_clinic=self.main_clinic,
            is_main_branch=False,
        )

        # Owner only (non-clinical)
        self.owner = User.objects.create_user(
            email='owner@alpha.com',
            password='Password123!',
            first_name='Alpha',
            last_name='Owner',
            role='ADMIN',
            roles=['ADMIN'],
            clinic=self.main_clinic,
        )
        # Staff only (non-clinical)
        self.staff = User.objects.create_user(
            email='staff@alpha.com',
            password='Password123!',
            first_name='Alpha',
            last_name='Staff',
            role='STAFF',
            roles=['STAFF'],
            clinic=self.main_clinic,
        )

    def test_non_clinical_roles_consume_zero_allocations(self):
        usage = get_clinician_allocations_for_clinic(self.main_clinic)
        self.assertEqual(usage['total_allocations'], 0)

    def test_single_practitioner_allocation(self):
        # 1 Practitioner in Main Clinic = 1 allocation
        p1 = User.objects.create_user(
            email='p1@alpha.com',
            password='Password123!',
            first_name='Dr.',
            last_name='One',
            role='PRACTITIONER',
            roles=['PRACTITIONER'],
            clinic=self.main_clinic,
            clinic_branch=self.main_clinic,
        )
        Practitioner.objects.create(user=p1, clinic=self.main_clinic, license_number='PRC-001')

        usage = get_clinician_allocations_for_clinic(self.main_clinic)
        self.assertEqual(usage['total_allocations'], 1)
        self.assertEqual(usage['active_allocations'], 1)
        self.assertEqual(usage['archived_allocations'], 0)

    def test_multi_branch_practitioner_allocation(self):
        # 1 Practitioner assigned to Branch A + Branch B = 2 allocations
        dr_santos = User.objects.create_user(
            email='santos@alpha.com',
            password='Password123!',
            first_name='Dr.',
            last_name='Santos',
            role='PRACTITIONER',
            roles=['PRACTITIONER'],
            clinic=self.main_clinic,
            clinic_branch=self.main_clinic,
        )
        Practitioner.objects.create(user=dr_santos, clinic=self.main_clinic, license_number='PRC-002')
        UserBranchAccess.objects.create(user=dr_santos, branch=self.main_clinic)
        UserBranchAccess.objects.create(user=dr_santos, branch=self.branch_b)

        usage = get_clinician_allocations_for_clinic(self.main_clinic)
        self.assertEqual(usage['total_allocations'], 2)

    def test_multi_role_owner_plus_practitioner(self):
        # Promoting owner to Admin + Practitioner consumes 1 allocation
        self.owner.roles = ['ADMIN', 'PRACTITIONER']
        self.owner.save()
        Practitioner.objects.create(user=self.owner, clinic=self.main_clinic, license_number='PRC-OWN')

        usage = get_clinician_allocations_for_clinic(self.main_clinic)
        self.assertEqual(usage['total_allocations'], 1)

    def test_active_inactive_archived_and_permanent_delete_rules(self):
        prac_user = User.objects.create_user(
            email='temp@alpha.com',
            password='Password123!',
            first_name='Dr.',
            last_name='Temp',
            role='PRACTITIONER',
            roles=['PRACTITIONER'],
            clinic=self.main_clinic,
        )
        prac_profile = Practitioner.objects.create(user=prac_user, clinic=self.main_clinic, license_number='PRC-TMP')

        # 1. Active practitioner counts
        usage = get_clinician_allocations_for_clinic(self.main_clinic)
        self.assertEqual(usage['total_allocations'], 1)
        self.assertEqual(usage['active_allocations'], 1)

        # 2. Inactive practitioner (is_active=False) STILL COUNTS
        prac_user.is_active = False
        prac_user.save()
        usage = get_clinician_allocations_for_clinic(self.main_clinic)
        self.assertEqual(usage['total_allocations'], 1)

        # 3. Soft-deleted / Archived practitioner (is_deleted=True) STILL COUNTS
        prac_user.is_deleted = True
        prac_user.save()
        usage = get_clinician_allocations_for_clinic(self.main_clinic)
        self.assertEqual(usage['total_allocations'], 1)
        self.assertEqual(usage['archived_allocations'], 1)
        self.assertEqual(len(usage['archived_practitioners']), 1)
        self.assertEqual(usage['archived_practitioners'][0]['email'], 'temp@alpha.com')

        # 4. Permanently deleted practitioner (is_permanently_deleted=True) RELEASES ALLOCATION
        prac_user.is_permanently_deleted = True
        prac_user.save()
        usage = get_clinician_allocations_for_clinic(self.main_clinic)
        self.assertEqual(usage['total_allocations'], 0)
        self.assertEqual(usage['archived_allocations'], 0)


class EntitlementEnforcementTestCase(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(name='Beta Practice', is_main_branch=True)
        self.sub = self.clinic.subscription
        # Starter: 4 clinicians, 1 branch included
        self.sub.activate_plan(PLAN_STARTER, billing_cycle=CYCLE_MONTHLY)

    def test_clinician_limit_enforcement(self):
        # Create 4 practitioners -> fills Starter limit of 4
        for i in range(1, 5):
            u = User.objects.create_user(
                email=f'dr{i}@beta.com',
                password='Password123!',
                first_name='Dr.',
                last_name=f'{i}',
                role='PRACTITIONER',
                roles=['PRACTITIONER'],
                clinic=self.clinic,
            )
            Practitioner.objects.create(user=u, clinic=self.clinic, license_number=f'PRC-B{i}')

        usage = get_clinician_allocations_for_clinic(self.clinic)
        self.assertEqual(usage['total_allocations'], 4)

        # 5th clinician allocation must be BLOCKED
        with self.assertRaises(ClinicianLimitReachedException):
            check_clinician_capacity(self.clinic, additional_allocations=1)

    def test_branch_limit_enforcement(self):
        # 1 branch already exists (main clinic)
        # Attempting to add 1 more branch when allowed=1 must be BLOCKED
        with self.assertRaises(BranchLimitReachedException):
            check_branch_capacity(self.clinic, additional_branches=1)

        # Purchase 1 additional branch allocation
        self.sub.additional_branches = 1
        self.sub.save()
        self.assertEqual(self.sub.effective_branch_limit, 2)

        # Now capacity check passes
        current = check_branch_capacity(self.clinic, additional_branches=1)
        self.assertEqual(current, 1)


class ServerSideAPIEnforcementTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.clinic = Clinic.objects.create(name='Gamma Practice', is_main_branch=True)
        self.owner = User.objects.create_user(
            email='admin@gamma.com',
            password='AdminPassword123!',
            first_name='Admin',
            last_name='User',
            role='ADMIN',
            roles=['ADMIN'],
            clinic=self.clinic,
        )
        self.client.force_authenticate(user=self.owner)
        self.sub = self.clinic.subscription
        self.sub.activate_plan(PLAN_STARTER, billing_cycle=CYCLE_MONTHLY)  # 4 clinicians, 1 branch

    def test_create_branch_blocked_at_limit(self):
        # Attempt to create branch beyond limit 1
        response = self.client.post(
            f'/api/clinics/{self.clinic.id}/create_branch/',
            {
                'name': 'Gamma Branch 2',
                'city': 'Cebu',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], 'BRANCH_LIMIT_REACHED')
        self.assertTrue(response.data['upgrade_required'])

    def test_create_practitioner_blocked_when_limit_reached(self):
        # Fill capacity to 4
        for i in range(1, 5):
            u = User.objects.create_user(
                email=f'doc{i}@gamma.com',
                password='Password123!',
                role='PRACTITIONER',
                roles=['PRACTITIONER'],
                clinic=self.clinic,
            )
            Practitioner.objects.create(user=u, clinic=self.clinic, license_number=f'LIC-{i}')

        # Attempt to create 5th practitioner via API
        response = self.client.post(
            '/api/users/',
            {
                'email': 'doc5@gamma.com',
                'first_name': 'Doctor',
                'last_name': 'Five',
                'role': 'PRACTITIONER',
                'roles': ['PRACTITIONER'],
                'license_number': 'LIC-5',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], 'CLINICIAN_LIMIT_REACHED')
        self.assertEqual(response.data['current_allocations'], 4)
        self.assertEqual(response.data['allowed_allocations'], 4)
        self.assertTrue(response.data['upgrade_required'])

    def test_promote_staff_to_practitioner_blocked_when_limit_reached(self):
        # Fill capacity to 4
        for i in range(1, 5):
            u = User.objects.create_user(
                email=f'fill{i}@gamma.com',
                password='Password123!',
                role='PRACTITIONER',
                roles=['PRACTITIONER'],
                clinic=self.clinic,
            )
            Practitioner.objects.create(user=u, clinic=self.clinic, license_number=f'FILL-{i}')

        # Create staff user (0 allocations consumed)
        staff = User.objects.create_user(
            email='secretary@gamma.com',
            password='Password123!',
            first_name='Sally',
            last_name='Secretary',
            role='STAFF',
            roles=['STAFF'],
            clinic=self.clinic,
        )

        # Attempt to promote staff -> Staff + Practitioner
        response = self.client.patch(
            f'/api/users/{staff.id}/',
            {
                'roles': ['STAFF', 'PRACTITIONER'],
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['error'], 'CLINICIAN_LIMIT_REACHED')

    def test_permanent_delete_releases_clinician_capacity(self):
        # Create practitioner
        p = User.objects.create_user(
            email='retiring.doctor@gamma.com',
            password='Password123!',
            first_name='Retiring',
            last_name='Doctor',
            role='PRACTITIONER',
            roles=['PRACTITIONER'],
            clinic=self.clinic,
        )
        Practitioner.objects.create(user=p, clinic=self.clinic, license_number='RET-001')

        # 1. Soft-delete
        p.is_deleted = True
        p.save()
        usage = get_clinician_allocations_for_clinic(self.clinic)
        self.assertEqual(usage['total_allocations'], 1)
        self.assertEqual(usage['archived_allocations'], 1)

        # 2. Permanent delete via API
        response = self.client.post(f'/api/users/{p.id}/permanent-delete/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_permanently_deleted'])

        # Capacity is released!
        usage_after = get_clinician_allocations_for_clinic(self.clinic)
        self.assertEqual(usage_after['total_allocations'], 0)
        self.assertEqual(usage_after['archived_allocations'], 0)

    def test_subscription_status_api_usage_summary(self):
        response = self.client.get('/api/subscription/status/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('clinician_limit', response.data)
        self.assertIn('clinicians_used', response.data)
        self.assertIn('effective_branch_limit', response.data)
        self.assertIn('branches_used', response.data)
        self.assertEqual(response.data['clinician_limit'], 4)
        self.assertEqual(response.data['effective_branch_limit'], 1)

    @patch('apps.subscriptions.views.create_checkout_session')
    def test_create_checkout_session_dynamic(self, mock_checkout):
        mock_checkout.return_value = {
            'checkout_id': 'cs_test_growth_123',
            'checkout_url': 'https://checkout.paymongo.com/cs_test_growth_123',
            'total_pesos': Decimal('135000.00'),
            'total_centavos': 13500000,
        }

        # Non-admin forbidden
        staff = User.objects.create_user(
            email='checkout.staff@gamma.com',
            password='Password123!',
            first_name='Check',
            last_name='Staff',
            role='STAFF',
            roles=['STAFF'],
            clinic=self.clinic,
        )
        self.client.force_authenticate(user=staff)
        res_forbidden = self.client.post('/api/subscription/checkout/create/', {
            'plan': 'GROWTH',
            'billing_cycle': 'ANNUAL',
            'additional_branches': 2,
        }, format='json')
        self.assertEqual(res_forbidden.status_code, 403)

        # Admin allowed
        self.client.force_authenticate(user=self.owner)
        res_ok = self.client.post('/api/subscription/checkout/create/', {
            'plan': 'GROWTH',
            'billing_cycle': 'ANNUAL',
            'additional_branches': 2,
        }, format='json')
        self.assertEqual(res_ok.status_code, 200)
        self.assertEqual(res_ok.data['checkout_id'], 'cs_test_growth_123')
        self.assertEqual(res_ok.data['plan'], 'GROWTH')
        self.assertEqual(res_ok.data['billing_cycle'], 'ANNUAL')
        self.assertEqual(res_ok.data['additional_branches'], 2)

    @patch('apps.subscriptions.views.verify_webhook_signature', return_value=True)
    def test_paymongo_webhook_activates_plan(self, mock_verify):
        webhook_payload = {
            'data': {
                'id': 'evt_test_paid_123',
                'type': 'event',
                'attributes': {
                    'type': 'checkout_session.payment.paid',
                    'data': {
                        'id': 'cs_test_growth_123',
                        'type': 'checkout_session',
                        'attributes': {
                            'metadata': {
                                'user_id': str(self.owner.id),
                                'clinic_id': str(self.clinic.id),
                                'plan': 'GROWTH',
                                'billing_cycle': 'ANNUAL',
                                'additional_branches': '2',
                            },
                            'payments': [
                                {
                                    'id': 'pay_12345',
                                    'attributes': {
                                        'amount': 13500000,
                                        'currency': 'PHP',
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }

        response = self.client.post(
            '/api/subscription/webhook/paymongo/',
            data=json.dumps(webhook_payload),
            content_type='application/json',
            HTTP_PAYMONGO_SIGNATURE='t=123,te=abc',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')

        # Verify clinic subscription activated with Growth tier and limits
        sub = self.clinic.subscription
        sub.refresh_from_db()
        self.assertEqual(sub.plan, 'GROWTH')
        self.assertEqual(sub.billing_cycle, 'ANNUAL')
        self.assertEqual(sub.status, 'ACTIVE')
        self.assertFalse(sub.is_trial)
        self.assertEqual(sub.clinician_limit, 8)
        self.assertEqual(sub.additional_branches, 2)
        self.assertEqual(sub.effective_branch_limit, 3)  # 1 included + 2 extra
        self.assertEqual(sub.commitment_months, 12)
        self.assertTrue(sub.is_active())

        # Verify PayMongoPaymentLog was created
        log = PayMongoPaymentLog.objects.filter(checkout_id='cs_test_growth_123').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.amount, 13500000)
        self.assertEqual(log.currency, 'PHP')

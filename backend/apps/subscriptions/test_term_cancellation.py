from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from dateutil.relativedelta import relativedelta
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.clinics.models import Clinic
from apps.subscriptions.models import PayMongoPaymentLog, Subscription, SubscriptionEvent
from apps.subscriptions.plans import CYCLE_ANNUAL, CYCLE_MONTHLY, PLAN_GROWTH, PLAN_PROFESSIONAL

User = get_user_model()
T0 = timezone.now().replace(microsecond=0)


def at(when):
    """Pretend 'now' is `when` for everything that calls django.utils.timezone.now()."""
    return patch('django.utils.timezone.now', return_value=when)


class TermAndCancellationBase(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(name='Term Clinic', is_main_branch=True)
        self.owner = User.objects.create_user(
            email='owner@term.com', password='Password123!', first_name='O', last_name='W',
            role='OWNER', roles=['OWNER'], clinic=self.clinic,
        )
        self.sub = self.clinic.subscription

    def pay(self, when, plan=PLAN_GROWTH, cycle=CYCLE_MONTHLY, branches=0):
        with at(when):
            self.sub.activate_plan(plan, billing_cycle=cycle, additional_branches=branches)
        self.sub.refresh_from_db()


class TermTests(TermAndCancellationBase):
    def test_first_paid_activation_starts_a_12_month_term(self):
        self.pay(T0)
        self.assertEqual(self.sub.term_start, T0)
        self.assertEqual(self.sub.term_end, T0 + relativedelta(months=12))

    def test_monthly_renewals_do_not_move_the_term(self):
        self.pay(T0)
        for month in range(1, 6):
            self.pay(T0 + timedelta(days=30 * month))
        self.assertEqual(self.sub.term_start, T0)
        self.assertEqual(self.sub.term_end, T0 + relativedelta(months=12))

    def test_changing_plan_inside_the_term_keeps_the_term(self):
        self.pay(T0, plan=PLAN_GROWTH)
        self.pay(T0 + timedelta(days=90), plan=PLAN_PROFESSIONAL, cycle=CYCLE_ANNUAL, branches=1)
        self.assertEqual(self.sub.plan, PLAN_PROFESSIONAL)
        self.assertEqual(self.sub.term_start, T0)
        self.assertEqual(self.sub.term_end, T0 + relativedelta(months=12))

    def test_a_payment_after_the_term_ended_starts_a_new_term_and_clears_cancellation(self):
        self.pay(T0)
        with at(T0 + timedelta(days=10)):
            self.sub.request_cancellation(self.owner, 'Closing clinic')
        later = T0 + relativedelta(months=12, days=3)
        self.pay(later)
        self.assertEqual(self.sub.term_start, later)
        self.assertIsNone(self.sub.cancellation_effective_at)
        self.assertEqual(self.sub.cancellation_reason, '')
        self.assertEqual(self.sub.status, Subscription.STATUS_ACTIVE)

    def test_trial_has_no_term(self):
        self.assertTrue(self.sub.is_trial)
        self.assertIsNone(self.sub.term_end)
        self.assertFalse(self.sub.can_request_cancellation())


class CancellationTests(TermAndCancellationBase):
    def setUp(self):
        super().setUp()
        self.pay(T0)   # monthly payer, 12-month term

    def test_cancellation_takes_effect_at_term_end_not_immediately(self):
        month3 = T0 + timedelta(days=95)
        with at(month3):
            self.sub.request_cancellation(self.owner, 'Too expensive')
        self.sub.refresh_from_db()
        self.assertEqual(self.sub.cancellation_effective_at, self.sub.term_end)
        self.assertEqual(self.sub.status, Subscription.STATUS_ACTIVE)
        self.assertTrue(self.sub.cancellation_pending)
        self.assertEqual(self.sub.cancellation_requested_by, self.owner)

    def test_monthly_payer_keeps_access_until_the_term_ends(self):
        with at(T0 + timedelta(days=95)):
            self.sub.request_cancellation(self.owner, 'Too expensive')
        # still paying monthly inside the term: month 11 is fully active
        self.pay(T0 + timedelta(days=330))
        with at(T0 + timedelta(days=335)):
            self.assertTrue(self.sub.is_active())
            self.assertEqual(self.sub.status, Subscription.STATUS_ACTIVE)

    def test_subscription_becomes_cancelled_only_after_the_term_end(self):
        with at(T0 + timedelta(days=95)):
            self.sub.request_cancellation(self.owner, 'Too expensive')
        self.pay(T0 + timedelta(days=350))           # last monthly payment pushes end_date past term_end
        after = self.sub.term_end + timedelta(days=1)
        with at(after):
            self.assertFalse(self.sub.is_active())    # even though end_date is later than term_end
        self.sub.refresh_from_db()
        self.assertEqual(self.sub.status, Subscription.STATUS_CANCELLED)
        self.assertEqual(self.sub.events.filter(event_type=SubscriptionEvent.CANCELLATION_EFFECTIVE).count(), 1)
        with at(after + timedelta(days=1)):
            self.sub.is_active()                      # idempotent: no second event
        self.assertEqual(self.sub.events.filter(event_type=SubscriptionEvent.CANCELLATION_EFFECTIVE).count(), 1)

    def test_reason_is_required_and_trial_or_duplicate_requests_are_rejected(self):
        with self.assertRaises(ValueError):
            self.sub.request_cancellation(self.owner, '   ')
        self.sub.request_cancellation(self.owner, 'Reason')
        with self.assertRaises(ValueError):
            self.sub.request_cancellation(self.owner, 'Again')

        trial_clinic = Clinic.objects.create(name='Trial Only', is_main_branch=True)
        with self.assertRaises(ValueError):
            trial_clinic.subscription.request_cancellation(self.owner, 'Reason')

    def test_withdrawing_clears_the_request_and_is_audited(self):
        self.sub.request_cancellation(self.owner, 'Reason')
        self.sub.withdraw_cancellation(self.owner)
        self.sub.refresh_from_db()
        self.assertIsNone(self.sub.cancellation_effective_at)
        self.assertFalse(self.sub.cancellation_pending)
        self.assertEqual(
            list(self.sub.events.order_by('id').values_list('event_type', flat=True)),
            [SubscriptionEvent.CANCELLATION_REQUESTED, SubscriptionEvent.CANCELLATION_WITHDRAWN],
        )
        with self.assertRaises(ValueError):
            self.sub.withdraw_cancellation(self.owner)

    def test_a_withdrawn_cancellation_never_takes_effect(self):
        self.sub.request_cancellation(self.owner, 'Reason')
        self.sub.withdraw_cancellation(self.owner)
        with at(self.sub.term_end + timedelta(days=1)):
            self.sub.refresh_from_db()
            self.assertFalse(self.sub.apply_scheduled_cancellation())
        self.assertEqual(self.sub.status, Subscription.STATUS_ACTIVE)


class CancellationApiTests(TermAndCancellationBase):
    def setUp(self):
        super().setUp()
        self.pay(T0 - timedelta(days=60))
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def test_owner_can_schedule_and_the_status_endpoint_reports_it(self):
        response = self.client.post('/api/subscription/cancel/', {'reason': 'Switching systems'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data['cancellation_pending'])
        self.assertEqual(response.data['cancellation_reason'], 'Switching systems')
        self.assertEqual(response.data['cancellation_effective_at'], response.data['term_end'])
        self.assertEqual(response.data['status'], 'ACTIVE')
        self.assertFalse(response.data['can_request_cancellation'])

        status = self.client.get('/api/subscription/status/').data
        self.assertTrue(status['cancellation_pending'])
        self.assertIsNotNone(status['term_end'])

    def test_missing_reason_and_duplicate_requests_are_400(self):
        self.assertEqual(self.client.post('/api/subscription/cancel/', {}, format='json').status_code, 400)
        self.client.post('/api/subscription/cancel/', {'reason': 'x'}, format='json')
        self.assertEqual(self.client.post('/api/subscription/cancel/', {'reason': 'y'}, format='json').status_code, 400)

    def test_only_the_owner_can_cancel_or_withdraw(self):
        for role in ('BRANCH_MANAGER', 'STAFF', 'PRACTITIONER', 'FINANCE', 'READ_ONLY'):
            with self.subTest(role):
                user = User.objects.create_user(
                    email=f'{role.lower()}@term.com', password='Password123!', first_name='X', last_name=role,
                    role=role, roles=[role], clinic=self.clinic,
                )
                self.client.force_authenticate(user)
                self.assertEqual(self.client.post('/api/subscription/cancel/', {'reason': 'x'}, format='json').status_code, 403)
                self.assertEqual(self.client.post('/api/subscription/cancel/withdraw/', {}, format='json').status_code, 403)
        self.sub.refresh_from_db()
        self.assertIsNone(self.sub.cancellation_effective_at)

    def test_withdraw_endpoint(self):
        self.client.post('/api/subscription/cancel/', {'reason': 'x'}, format='json')
        response = self.client.post('/api/subscription/cancel/withdraw/', {}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(response.data['cancellation_pending'])
        self.assertTrue(response.data['can_request_cancellation'])
        self.assertEqual(self.client.post('/api/subscription/cancel/withdraw/', {}, format='json').status_code, 400)

    def test_users_of_another_clinic_cannot_touch_this_subscription(self):
        other = Clinic.objects.create(name='Other', is_main_branch=True)
        outsider = User.objects.create_user(
            email='outsider@other.com', password='Password123!', first_name='O', last_name='S',
            role='OWNER', roles=['OWNER'], clinic=other,
        )
        self.client.force_authenticate(outsider)
        # the outsider's own subscription is a trial, so nothing can be cancelled, and ours is untouched
        self.assertEqual(self.client.post('/api/subscription/cancel/', {'reason': 'x'}, format='json').status_code, 400)
        self.sub.refresh_from_db()
        self.assertIsNone(self.sub.cancellation_effective_at)


class BackfillCommandTests(TermAndCancellationBase):
    def _legacy_paid(self, started):
        """A paid subscription created before terms existed."""
        self.pay(started)
        Subscription.objects.filter(pk=self.sub.pk).update(term_start=None, term_end=None)
        self.sub.refresh_from_db()

    def test_dry_run_writes_nothing(self):
        self._legacy_paid(T0 - timedelta(days=100))
        out = StringIO()
        call_command('backfill_subscription_terms', stdout=out)
        self.sub.refresh_from_db()
        self.assertIsNone(self.sub.term_end)
        self.assertIn('DRY RUN', out.getvalue())

    def test_apply_uses_the_first_payment_and_rolls_an_ended_term_forward(self):
        self._legacy_paid(T0 - relativedelta(months=15))
        PayMongoPaymentLog.objects.create(subscription=self.sub, clinic=self.clinic, event_type='payment.paid')
        PayMongoPaymentLog.objects.filter(subscription=self.sub).update(processed_at=T0 - relativedelta(months=15))

        call_command('backfill_subscription_terms', '--apply', stdout=StringIO())
        self.sub.refresh_from_db()
        self.assertEqual(self.sub.term_start, T0 - relativedelta(months=3))   # 15 months ago + 12 months
        self.assertEqual(self.sub.term_end, T0 + relativedelta(months=9))
        self.assertGreater(self.sub.term_end, timezone.now())

    def test_trials_and_subscriptions_that_already_have_a_term_are_left_alone(self):
        self.pay(T0)
        before = (self.sub.term_start, self.sub.term_end)
        call_command('backfill_subscription_terms', '--apply', stdout=StringIO())
        self.sub.refresh_from_db()
        self.assertEqual((self.sub.term_start, self.sub.term_end), before)
        trial_clinic = Clinic.objects.create(name='Trial', is_main_branch=True)
        call_command('backfill_subscription_terms', '--apply', stdout=StringIO())
        self.assertIsNone(Subscription.objects.get(clinic=trial_clinic).term_end)

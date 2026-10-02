import json
import logging

from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PayMongoPaymentLog, Subscription
from .paymongo_service import (
    PayMongoError,
    create_checkout_session,
    extract_checkout_metadata,
    verify_webhook_signature,
)

logger = logging.getLogger(__name__)


class SubscriptionBaseView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def ensure_subscription(user):
        if user.clinic_id:
            main_clinic = user.clinic.main_clinic
            subscription = getattr(main_clinic, 'subscription', None)
            if not subscription:
                subscription = Subscription.objects.filter(clinic=main_clinic).first()
            if not subscription:
                # Check if this user had a legacy subscription we can attach to the clinic
                legacy = Subscription.objects.filter(user=user, clinic__isnull=True).first()
                if legacy:
                    legacy.clinic = main_clinic
                    legacy.save(update_fields=['clinic', 'updated_at'])
                    subscription = legacy
                else:
                    subscription = Subscription.objects.create(clinic=main_clinic, user=user)
                    subscription.start_trial()
            return subscription
        else:
            subscription = Subscription.objects.filter(user=user).first()
            if not subscription:
                subscription = Subscription.objects.create(user=user)
                subscription.start_trial()
            return subscription


class SubscriptionPlansView(APIView):
    """
    GET /api/subscription/plans/
    Returns list of all available subscription plans with pricing, entitlements, and savings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .plans import get_all_plans_summary
        return Response(get_all_plans_summary())


class SubscriptionStatusView(SubscriptionBaseView):
    def get(self, request):
        sub = self.ensure_subscription(request.user)

        if request.user.clinic_id:
            from .services import get_subscription_usage_summary
            usage = get_subscription_usage_summary(request.user.clinic.main_clinic)
            return Response(usage)

        now = timezone.now()
        if sub.status == Subscription.STATUS_ACTIVE and sub.end_date < now:
            sub.expire()

        return Response(
            {
                'plan': sub.plan,
                'status': sub.status,
                'billing_cycle': sub.billing_cycle,
                'commitment_months': sub.commitment_months,
                'is_trial': sub.is_trial,
                'start_date': sub.start_date,
                'end_date': sub.end_date,
                'days_remaining': max((sub.end_date - now).days, 0) if sub.end_date else 0,
                'clinician_limit': sub.effective_clinician_limit,
                'clinicians_used': 0,
                'clinicians_active': 0,
                'clinicians_archived': 0,
                'archived_practitioners': [],
                'branch_limit': sub.branch_limit,
                'additional_branches': sub.additional_branches,
                'effective_branch_limit': sub.effective_branch_limit,
                'branches_used': 1,
            }
        )


class CreateCheckoutView(SubscriptionBaseView):
    """
    POST /api/subscription/checkout/create/

    Creates a PayMongo Checkout Session and returns the checkout URL.
    The frontend redirects the user to that URL to complete payment.
    Secret keys never leave the backend.
    """

    def post(self, request):
        if not request.user.is_admin:
            return Response(
                {'detail': 'Only clinic administrators can manage subscriptions and billing.'},
                status=403,
            )

        sub = self.ensure_subscription(request.user)

        plan = request.data.get('plan', Subscription.PLAN_STARTER)
        if isinstance(plan, str):
            plan = plan.upper()
        billing_cycle = request.data.get('billing_cycle', 'MONTHLY')
        if isinstance(billing_cycle, str):
            billing_cycle = billing_cycle.upper()

        try:
            additional_branches = int(request.data.get('additional_branches', 0))
            if additional_branches < 0:
                additional_branches = 0
        except (ValueError, TypeError):
            additional_branches = 0

        from .plans import PLAN_CATALOG
        if plan not in PLAN_CATALOG or plan == Subscription.PLAN_TRIAL:
            return Response({'error': f'Invalid plan: {plan}'}, status=400)
        if plan == Subscription.PLAN_ENTERPRISE:
            return Response({'error': 'Enterprise plan requires custom quotation. Please contact sales.'}, status=400)
        if billing_cycle not in ['MONTHLY', 'ANNUAL']:
            return Response({'error': f'Invalid billing cycle: {billing_cycle}'}, status=400)

        try:
            result = create_checkout_session(
                user=request.user,
                plan_code=plan,
                billing_cycle=billing_cycle,
                additional_branches=additional_branches,
                frontend_url=settings.FRONTEND_URL,
            )
        except PayMongoError as exc:
            logger.error('Failed to create PayMongo checkout for user %s: %s', request.user.pk, exc)
            return Response(
                {'error': 'Payment service unavailable. Please try again later.'},
                status=503,
            )
        except Exception as exc:
            logger.error('Unexpected error creating checkout for user %s: %s', request.user.pk, exc)
            return Response({'error': str(exc)}, status=400)

        # Persist checkout ID so we can correlate the webhook
        sub.paymongo_checkout_id = result['checkout_id']
        sub.save(update_fields=['paymongo_checkout_id', 'updated_at'])

        return Response(
            {
                'checkout_url': result['checkout_url'],
                'checkout_id': result['checkout_id'],
                'plan': plan,
                'billing_cycle': billing_cycle,
                'additional_branches': additional_branches,
                'total_pesos': str(result.get('total_pesos', '0.00')),
            }
        )


# ── Webhook (no auth, no CSRF — server-to-server from PayMongo) ───────────────

@csrf_exempt
@require_POST
def paymongo_webhook(request):
    """
    POST /api/subscription/webhook/paymongo/

    Receives PayMongo webhook events, verifies the signature, and activates
    the user's or clinic's subscription on payment.paid / checkout_session.payment.paid.

    Security:
    - HMAC-SHA256 signature verification (constant-time comparison)
    - User/Clinic ID sourced exclusively from webhook metadata (never from frontend)
    - Idempotent: duplicate events for the same checkout are ignored
    """
    raw_body: bytes = request.body
    signature_header: str | None = request.headers.get('Paymongo-Signature')

    # ── 1. Verify signature ───────────────────────────────────────────────────
    if not verify_webhook_signature(raw_body, signature_header):
        logger.warning('PayMongo webhook rejected — invalid signature.')
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    # ── 2. Parse payload ──────────────────────────────────────────────────────
    try:
        payload: dict = json.loads(raw_body)
    except json.JSONDecodeError:
        logger.error('PayMongo webhook — malformed JSON body.')
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    extracted = extract_checkout_metadata(payload)
    if not extracted:
        # Unparseable payload — acknowledge to prevent infinite retries
        logger.error('PayMongo webhook — could not extract metadata from payload.')
        return JsonResponse({'status': 'ignored', 'reason': 'unparseable'}, status=200)

    event_type: str = extracted.get('event_type', '')
    checkout_id: str = extracted.get('checkout_id', '')
    metadata: dict = extracted.get('metadata', {})

    # ── 3. Only handle paid events ────────────────────────────────────────────
    PAID_EVENTS = {'payment.paid', 'checkout_session.payment.paid'}
    if event_type not in PAID_EVENTS:
        logger.debug('PayMongo webhook — ignoring event type: %s', event_type)
        return JsonResponse({'status': 'ignored', 'event': event_type}, status=200)

    # ── 4. Resolve user / clinic from metadata (never trust frontend) ──────────
    user_id = metadata.get('user_id')
    clinic_id = metadata.get('clinic_id')
    if not user_id and not clinic_id:
        logger.error('PayMongo webhook %s — no user_id or clinic_id in metadata.', event_type)
        return JsonResponse({'status': 'ignored', 'reason': 'no user_id or clinic_id'}, status=200)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    from apps.clinics.models import Clinic

    user = None
    if user_id:
        try:
            user = User.objects.select_related('clinic').get(pk=user_id)
        except User.DoesNotExist:
            logger.warning('PayMongo webhook — user_id %s not found.', user_id)

    clinic = None
    if clinic_id:
        try:
            clinic = Clinic.objects.get(pk=clinic_id).main_clinic
        except Clinic.DoesNotExist:
            logger.warning('PayMongo webhook — clinic_id %s not found.', clinic_id)
    elif user and user.clinic_id:
        clinic = user.clinic.main_clinic

    # ── 5. Activate / renew subscription ─────────────────────────────────────
    subscription = None
    if clinic:
        subscription = getattr(clinic, 'subscription', None)
        if not subscription:
            subscription = Subscription.objects.filter(clinic=clinic).first()
        if not subscription:
            subscription = Subscription.objects.create(clinic=clinic, user=user)
    elif user:
        subscription, _ = Subscription.objects.get_or_create(user=user)

    if not subscription:
        logger.error('PayMongo webhook — could not locate subscription to activate.')
        return JsonResponse({'status': 'ignored', 'reason': 'subscription not found'}, status=200)

    plan_code = metadata.get('plan') or Subscription.PLAN_STARTER
    billing_cycle = metadata.get('billing_cycle') or 'MONTHLY'
    try:
        additional_branches = int(metadata.get('additional_branches', 0))
    except (ValueError, TypeError):
        additional_branches = 0

    subscription.activate_from_webhook(
        checkout_id=checkout_id,
        plan_code=plan_code,
        billing_cycle=billing_cycle,
        additional_branches=additional_branches,
    )
    logger.info(
        'Subscription activated via webhook — sub=%s clinic=%s plan=%s cycle=%s extra_branches=%s checkout=%s',
        subscription.pk, clinic.pk if clinic else None, plan_code, billing_cycle, additional_branches, checkout_id,
    )

    # ── 6. Persist audit log ──────────────────────────────────────────────────
    PayMongoPaymentLog.objects.create(
        user=user,
        event_type=event_type,
        checkout_id=checkout_id,
        payment_id=extracted.get('payment_id', ''),
        amount=extracted.get('amount', 0),
        currency=extracted.get('currency', 'PHP'),
        raw_payload=payload,
    )

    return JsonResponse({'status': 'ok'}, status=200)


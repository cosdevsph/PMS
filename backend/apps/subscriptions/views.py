from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Subscription


class SubscriptionBaseView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def ensure_subscription(user):
        subscription, created = Subscription.objects.get_or_create(user=user)
        if created:
            subscription.start_trial()
        return subscription


class SubscriptionStatusView(SubscriptionBaseView):
    def get(self, request):
        sub = self.ensure_subscription(request.user)

        now = timezone.now()
        if sub.status == Subscription.STATUS_ACTIVE and sub.end_date < now:
            sub.expire()

        return Response(
            {
                'plan': sub.plan,
                'status': sub.status,
                'is_trial': sub.is_trial,
                'start_date': sub.start_date,
                'end_date': sub.end_date,
                'days_remaining': max((sub.end_date - now).days, 0),
            }
        )


class ActivateMonthlyView(SubscriptionBaseView):
    def post(self, request):
        sub = self.ensure_subscription(request.user)
        sub.activate_monthly()

        return Response({'message': 'Subscription upgraded to Monthly Plan (₱299)'})

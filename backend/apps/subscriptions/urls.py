from django.urls import path

from .views import ActivateMonthlyView, SubscriptionStatusView

urlpatterns = [
    path('status/', SubscriptionStatusView.as_view()),
    path('activate/', ActivateMonthlyView.as_view()),
]

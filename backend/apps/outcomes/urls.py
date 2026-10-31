from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ClinicLibraryView, EnabledDefinitionsView, OutcomeAssessmentViewSet

router = DefaultRouter()
router.register(r'assessments', OutcomeAssessmentViewSet, basename='outcome-assessments')

urlpatterns = [
    path('definitions/', EnabledDefinitionsView.as_view(), name='outcome-definitions'),
    path('library/', ClinicLibraryView.as_view(), name='outcome-library'),
    path('library/<str:code>/', ClinicLibraryView.as_view(), name='outcome-library-toggle'),
] + router.urls

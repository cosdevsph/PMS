from django.contrib import admin

from .models import ClinicOutcomeMeasure, OutcomeAssessment, OutcomeDefinition


@admin.register(OutcomeDefinition)
class OutcomeDefinitionAdmin(admin.ModelAdmin):
    list_display = ['code', 'version', 'name', 'licence_category', 'platform_approved', 'retired_at']
    list_filter = ['licence_category', 'platform_approved', 'category']
    readonly_fields = ['code', 'version', 'definition', 'checksum']


@admin.register(ClinicOutcomeMeasure)
class ClinicOutcomeMeasureAdmin(admin.ModelAdmin):
    list_display = ['clinic', 'code', 'enabled', 'pinned_version']


@admin.register(OutcomeAssessment)
class OutcomeAssessmentAdmin(admin.ModelAdmin):
    # Answers are encrypted and deliberately not shown here.
    list_display = ['id', 'patient', 'definition', 'assessed_on', 'status']
    exclude = ['encrypted_answers']
    readonly_fields = ['scores', 'scoring_snapshot']

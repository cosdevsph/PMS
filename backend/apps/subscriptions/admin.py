from django.contrib import admin

from .models import PayMongoPaymentLog, Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'clinic',
        'user',
        'plan',
        'billing_cycle',
        'status',
        'effective_clinician_limit_display',
        'effective_branch_limit_display',
        'is_trial',
        'end_date',
        'updated_at',
    )
    list_filter = ('plan', 'billing_cycle', 'status', 'is_trial')
    search_fields = (
        'clinic__name',
        'user__email',
        'user__first_name',
        'user__last_name',
        'paymongo_checkout_id',
    )
    readonly_fields = ('created_at', 'updated_at')

    def effective_clinician_limit_display(self, obj):
        return obj.effective_clinician_limit
    effective_clinician_limit_display.short_description = 'Clinician Limit'

    def effective_branch_limit_display(self, obj):
        return f"{obj.effective_branch_limit} ({obj.branch_limit} incl + {obj.additional_branches} add'l)"
    effective_branch_limit_display.short_description = 'Branches'


@admin.register(PayMongoPaymentLog)
class PayMongoPaymentLogAdmin(admin.ModelAdmin):
    list_display = (
        'event_type',
        'clinic',
        'user',
        'plan',
        'billing_cycle',
        'checkout_id',
        'payment_id',
        'amount',
        'currency',
        'processed_at',
    )
    list_filter = ('event_type', 'plan', 'billing_cycle', 'currency')
    search_fields = ('checkout_id', 'payment_id', 'user__email', 'clinic__name')
    readonly_fields = ('processed_at', 'raw_payload')

    def has_add_permission(self, request):
        return False  # Logs are created only by webhooks

    def has_change_permission(self, request, obj=None):
        return False  # Immutable audit log

from rest_framework import serializers

from apps.patients.models import (
    PrivatePackageSession,
    PrivatePackageSessionAuditLog,
    PrivatePackageSessionItem,
)


def _user_name(user) -> str | None:
    return user.get_full_name() if user else None


class PrivatePackageItemSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_color = serializers.CharField(source='service.color_hex', read_only=True)
    used = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = PrivatePackageSessionItem
        fields = ['id', 'service', 'service_name', 'service_color', 'quantity', 'used', 'remaining']

    def get_used(self, obj) -> int:
        # `used_count` is annotated by package_service.with_balances for list screens.
        return obj.used_count if hasattr(obj, 'used_count') else obj.used

    def get_remaining(self, obj) -> int:
        return obj.quantity - self.get_used(obj)


class PrivatePackageSessionSerializer(serializers.ModelSerializer):
    """Read serializer. Balances are computed, never stored."""
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    items = PrivatePackageItemSerializer(many=True, read_only=True)
    total_sessions = serializers.SerializerMethodField()
    used_sessions = serializers.SerializerMethodField()
    remaining_sessions = serializers.SerializerMethodField()
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True, default=None)
    invoice_status = serializers.CharField(source='invoice.status', read_only=True, default=None)
    invoice_total = serializers.DecimalField(
        source='invoice.total_amount', max_digits=10, decimal_places=2, read_only=True, default=None,
    )
    invoice_amount_paid = serializers.DecimalField(
        source='invoice.amount_paid', max_digits=10, decimal_places=2, read_only=True, default=None,
    )
    invoice_balance_due = serializers.DecimalField(
        source='invoice.balance_due', max_digits=10, decimal_places=2, read_only=True, default=None,
    )
    created_by_name = serializers.SerializerMethodField()
    modified_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PrivatePackageSession
        fields = [
            'id', 'patient', 'patient_name', 'clinic', 'title', 'price', 'notes', 'status',
            'items', 'total_sessions', 'used_sessions', 'remaining_sessions',
            'source_case', 'invoice', 'invoice_number', 'invoice_status', 'invoice_total',
            'invoice_amount_paid', 'invoice_balance_due',
            'created_by', 'created_by_name', 'modified_by', 'modified_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def _items(self, obj):
        return list(obj.items.all())  # uses the prefetch when present

    def get_total_sessions(self, obj) -> int:
        return sum(i.quantity for i in self._items(obj))

    def get_used_sessions(self, obj) -> int:
        item_ser = PrivatePackageItemSerializer()
        return sum(item_ser.get_used(i) for i in self._items(obj))

    def get_remaining_sessions(self, obj) -> int:
        return self.get_total_sessions(obj) - self.get_used_sessions(obj)

    def get_created_by_name(self, obj) -> str | None:
        return _user_name(obj.created_by)

    def get_modified_by_name(self, obj) -> str | None:
        return _user_name(obj.modified_by)


class PrivatePackageItemInputSerializer(serializers.Serializer):
    service = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class PrivatePackageWriteSerializer(serializers.Serializer):
    """
    Shape check only; the business rules (clinic scope, duplicates, quantity
    floor, invoice handling) live in services/package_service.py.
    """
    patient = serializers.IntegerField(required=False)
    title = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=PrivatePackageSession.STATUS_CHOICES, required=False)
    items = PrivatePackageItemInputSerializer(many=True, required=False)


class PrivatePackageAuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = PrivatePackageSessionAuditLog
        fields = [
            'id', 'action', 'action_display', 'user', 'user_name',
            'appointment', 'changes', 'reason', 'created_at',
        ]

    def get_user_name(self, obj) -> str | None:
        return _user_name(obj.user)

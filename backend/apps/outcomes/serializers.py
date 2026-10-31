from rest_framework import serializers

from .models import OutcomeAssessment, OutcomeDefinition


class OutcomeDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutcomeDefinition
        fields = [
            'id', 'code', 'version', 'name', 'abbreviation', 'category', 'language',
            'licence_category', 'definition',
        ]


class LibraryEntrySerializer(serializers.Serializer):
    """A platform measure with this clinic's on/off state. Items are not included."""
    id = serializers.IntegerField()
    code = serializers.CharField()
    version = serializers.CharField()
    name = serializers.CharField()
    abbreviation = serializers.CharField()
    category = serializers.CharField()
    description = serializers.CharField()
    licence_category = serializers.CharField()
    enabled = serializers.BooleanField()
    pinned_version = serializers.CharField()


class OutcomeAssessmentSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source='definition.code', read_only=True)
    version = serializers.CharField(source='definition.version', read_only=True)
    measure_name = serializers.CharField(source='definition.name', read_only=True)
    abbreviation = serializers.CharField(source='definition.abbreviation', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    voided_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OutcomeAssessment
        fields = [
            'id', 'patient', 'patient_case', 'appointment', 'practitioner', 'definition',
            'code', 'version', 'measure_name', 'abbreviation',
            'assessed_on', 'scores', 'status', 'void_reason', 'completed_at', 'created_by_name',
            'voided_at', 'voided_by_name',
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else ''

    def get_voided_by_name(self, obj):
        return obj.voided_by.get_full_name() if obj.voided_by else ''


class OutcomeAssessmentDetailSerializer(OutcomeAssessmentSerializer):
    answers = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    scoring_snapshot = serializers.JSONField(read_only=True)

    class Meta(OutcomeAssessmentSerializer.Meta):
        fields = OutcomeAssessmentSerializer.Meta.fields + ['answers', 'items', 'scoring_snapshot']

    def get_answers(self, obj):
        return obj.answers

    def get_items(self, obj):
        """The questions exactly as asked at the time (from the version used, not the latest)."""
        return obj.definition.definition['items']


class AssessmentCreateSerializer(serializers.Serializer):
    patient = serializers.IntegerField()
    definition = serializers.IntegerField()
    answers = serializers.DictField()
    assessed_on = serializers.DateField(required=False)
    patient_case = serializers.IntegerField(required=False, allow_null=True)
    appointment = serializers.IntegerField(required=False, allow_null=True)
    # The recording user's own password, checked before anything is saved.
    password = serializers.CharField(write_only=True, trim_whitespace=False)

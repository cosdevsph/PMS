from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
import logging
from .roles import normalize_role, normalize_roles, normalize_role_payload
from .utils.rbac import clinics_of, group_lock_reason, validate_branches_free_for_manager
from .utils.schedule import blocks_outside, find_overlap, overlap_message
from .models import (
    User, Role, Permission, PermissionGroup, FeaturePermission,
    UserBranchAccess,
    FEATURE_KEYS, ROLE_PRIORITY, _union_permissions, BRANCH_MANAGER_ALWAYS_EDIT, BRANCH_MANAGER_MANAGEABLE_TEMPLATES,
    derive_permission_group_for_roles,
)
from apps.clinics.models import Practitioner
from apps.common.validators import normalize_international_phone, validate_international_phone, validate_email_detailed
from django.core.exceptions import ValidationError as DjangoValidationError

logger = logging.getLogger(__name__)


# ── RBAC Serializers ──────────────────────────────────────────────────────────

class FeaturePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeaturePermission
        fields = ['id', 'feature_key', 'access_level']


class PermissionGroupSerializer(serializers.ModelSerializer):
    feature_permissions = FeaturePermissionSerializer(many=True, read_only=True)
    member_count        = serializers.SerializerMethodField()
    permissions_map     = serializers.SerializerMethodField()
    # Why the requesting Branch Manager may not change this group (shared with another manager's
    # clinics), or null when they may.
    locked_reason       = serializers.SerializerMethodField()

    class Meta:
        model  = PermissionGroup
        fields = [
            'id', 'name', 'description', 'role_template',
            'is_protected', 'is_system_template',
            'clinic', 'feature_permissions', 'permissions_map',
            'member_count', 'locked_reason', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_system_template']

    def get_member_count(self, obj) -> int:
        return obj.users.filter(is_deleted=False).count()

    def get_permissions_map(self, obj) -> dict:
        """Return a flat {feature_key: access_level} dict for UI consumption."""
        return obj.get_permissions_dict()

    def get_locked_reason(self, obj):
        request = self.context.get('request')
        return group_lock_reason(getattr(request, 'user', None), obj)


class PermissionGroupWriteSerializer(serializers.ModelSerializer):
    """Used for create/update — accepts `permissions` as a dict."""
    permissions = serializers.DictField(
        child=serializers.ChoiceField(choices=['none', 'view', 'edit']),
        required=False,
        write_only=True,
    )

    class Meta:
        model  = PermissionGroup
        fields = ['name', 'description', 'role_template', 'is_protected', 'clinic', 'permissions']

    def to_internal_value(self, data):
        # Legacy template codes are accepted and converted (see accounts/roles.py).
        return super().to_internal_value(normalize_role_payload(data))

    def validate_permissions(self, value):
        invalid = [k for k in value if k not in FEATURE_KEYS]
        if invalid:
            raise serializers.ValidationError(
                f"Unknown feature keys: {invalid}. Valid keys: {FEATURE_KEYS}"
            )
        return value

    def create(self, validated_data):
        permissions = validated_data.pop('permissions', {})
        group = PermissionGroup.objects.create(**validated_data)
        for feature_key, access_level in permissions.items():
            FeaturePermission.objects.create(
                group=group,
                feature_key=feature_key,
                access_level=access_level,
            )
        return group

    def update(self, instance, validated_data):
        permissions = validated_data.pop('permissions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if permissions is not None:
            # Atomically replace ALL feature permissions so stale records
            # from previous saves can never linger.
            with transaction.atomic():
                instance.feature_permissions.all().delete()
                FeaturePermission.objects.bulk_create([
                    FeaturePermission(
                        group=instance,
                        feature_key=feature_key,
                        access_level=access_level,
                    )
                    for feature_key, access_level in permissions.items()
                ])
        return instance


class PractitionerBranchAssignmentSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    availability = serializers.ReadOnlyField()

    class Meta:
        model = UserBranchAccess
        fields = [
            'id', 'user', 'branch', 'branch_name', 'is_active',
            'duty_days', 'duty_start_time', 'duty_end_time',
            'lunch_start_time', 'lunch_end_time', 'duty_schedule',
            'availability', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'availability']


class UserSerializer(serializers.ModelSerializer):
    password               = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    needs_password_change  = serializers.BooleanField(read_only=True)
    clinic_branch_name     = serializers.SerializerMethodField()
    avatar_url             = serializers.SerializerMethodField()
    phone                  = serializers.CharField(max_length=20, required=False, allow_blank=True)

    # ── NEW: expose whether the admin has completed clinic setup ──────────────
    clinic_setup_complete  = serializers.SerializerMethodField()

    # ── RBAC: permission group + flat permissions map ─────────────────────────
    permission_group_name  = serializers.SerializerMethodField()
    permissions_map        = serializers.SerializerMethodField()

    # ── Multi-Role: writable list of role slugs ───────────────────────────────
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=[r for r, _ in User.ROLE_CHOICES]),
        required=False,
        allow_empty=False,
        help_text='All roles assigned to this user. Must contain at least one entry.',
    )

    # ── Practitioner availability fields ─────────────────────────────────────────
    duty_days        = serializers.ListField(child=serializers.CharField(), required=False)
    duty_start_time  = serializers.CharField(required=False, allow_blank=True)
    duty_end_time    = serializers.CharField(required=False, allow_blank=True)
    lunch_start_time = serializers.CharField(required=False, allow_blank=True)
    lunch_end_time   = serializers.CharField(required=False, allow_blank=True)
    # Split-shift schedule (both PRACTITIONER and STAFF)
    duty_schedule    = serializers.JSONField(required=False, allow_null=True)

    # ── Position and discipline ──────────────────────────────────────────────
    position         = serializers.CharField(required=False, allow_blank=True)
    discipline       = serializers.CharField(required=False, allow_blank=True)

    # ── Phase 4/9/10: Multi-branch assignment (Branch Manager scope) ─────────────────
    # Write-only list of branch PKs.  Used when creating/updating a Branch Manager.
    # For read, use `manager_branches` (SerializerMethodField below).
    branch_ids      = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=True,
        help_text='List of branch IDs to assign to this user (Branch Managers only).',
    )
    # Read-only: list of branches this Branch Manager is assigned to.
    manager_branches = serializers.SerializerMethodField()
    # Read-only: whether this user holds the Branch Manager (BRANCH_MANAGER) role.
    is_branch_manager       = serializers.SerializerMethodField()

    # ── Diary access to other branches (Branch Manager only; set by the Owner) ───────
    # Write: list of branch PKs the Branch Manager may open in the Diary besides their own.
    extra_diary_branch_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=True,
        help_text="Owner only. Branch IDs whose Diary this Branch Manager may open (level from the permission group).",
    )
    # Read: branches the Branch Manager has been given (as chosen by the Owner, used by the Owner's form).
    extra_diary_branches = serializers.SerializerMethodField()
    # Read: branches the user can currently open in the Diary beyond their own
    # (empty unless the permission group's 'Other Branches' Diary' is view or edit).
    diary_branches = serializers.SerializerMethodField()
    diary_other_branches_level = serializers.SerializerMethodField()

    # ── Multi-branch assignments for practitioners & staff ───────────────────
    branch_assignments  = serializers.SerializerMethodField()
    assigned_branch_ids = serializers.SerializerMethodField()
    # Write: the clinics a Frontdesk (STAFF) or Finance user works at; the first is their home clinic.
    # Practitioners get their clinics from their working hours, Branch Managers from `branch_ids`.
    work_branch_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=True,
        help_text="Frontdesk / Finance only. Clinic IDs the user works at; the first is the home clinic.",
    )

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'roles', 'phone',
            'avatar', 'avatar_url', 'is_active', 'clinic', 'clinic_branch', 'clinic_branch_name',
            'created_at', 'password', 'password_changed', 'needs_password_change',
            'must_change_password',
            'clinic_setup_complete',
            'password_rotation', 'last_password_change',
            # RBAC
            'permission_group', 'permission_group_name', 'permissions_map',
            # Branch Manager multi-branch
            'branch_ids', 'manager_branches', 'is_branch_manager',
            # Diary access to other branches
            'extra_diary_branch_ids', 'extra_diary_branches', 'diary_branches', 'diary_other_branches_level',
            # Multi-branch assignments
            'branch_assignments', 'assigned_branch_ids', 'work_branch_ids',
            # Position (for all staff)
            'position',
            # Availability fields (legacy single block)
            'duty_days', 'duty_start_time', 'duty_end_time', 'lunch_start_time', 'lunch_end_time',
            # Split-shift schedule
            'duty_schedule',
            # Discipline (for PRACTITIONER)
            'discipline',
        ]
        read_only_fields = ['id', 'created_at', 'password_changed', 'must_change_password']

    def to_internal_value(self, data):
        # Legacy role codes are accepted and converted (see accounts/roles.py).
        return super().to_internal_value(normalize_role_payload(data))

    def get_permission_group_name(self, obj) -> str | None:
        if obj.permission_group_id:
            return obj.permission_group.name
        return None

    def get_manager_branches(self, obj) -> list:
        """
        Return a list of branch dicts for Branch Manager users and Practitioners.
        Used by the frontend to populate the branch-scope picker and
        by the backend security layer to validate branch assignments.
        """
        effective_roles = obj.get_effective_roles()
        if 'OWNER' in effective_roles:
            # Owner sees all branches — return minimal list for reference
            if obj.clinic:
                return list(
                    obj.clinic.get_all_branches().values('id', 'name', 'city', 'is_main_branch')
                )
            return []
            
        # Branch Managers: the clinics they manage. All other roles: their assigned branches.
        rows = obj.branch_accesses
        if obj.is_branch_manager:
            rows = rows.filter(is_managed=True)
        branches = rows.select_related('branch').values(
            'branch__id', 'branch__name', 'branch__city', 'branch__is_main_branch'
        ).order_by('branch__name')
        
        branch_list = [
            {
                'id': b['branch__id'],
                'name': b['branch__name'],
                'city': b['branch__city'],
                'is_main_branch': b['branch__is_main_branch']
            }
            for b in branches
        ]
        
        # Fallback for single-branch assigned users
        if not branch_list and obj.clinic_branch:
            branch_list = [{
                'id': obj.clinic_branch.id,
                'name': obj.clinic_branch.name,
                'city': obj.clinic_branch.city,
                'is_main_branch': obj.clinic_branch.is_main_branch
            }]
            
        return branch_list

    def get_is_branch_manager(self, obj) -> bool:
        return obj.is_branch_manager

    @staticmethod
    def _branch_dicts(qs) -> list:
        return [
            {'id': b.id, 'name': b.name, 'city': b.city, 'is_main_branch': b.is_main_branch}
            for b in qs
        ]

    def get_extra_diary_branches(self, obj) -> list:
        if not obj.is_branch_manager or obj.is_owner:
            return []
        return self._branch_dicts(obj.extra_diary_branches.filter(is_deleted=False).order_by('name'))

    def get_diary_branches(self, obj) -> list:
        """Extra branches the user may open in the Diary right now (permission level applied)."""
        from apps.accounts.utils.rbac import get_extra_diary_branch_ids
        ids = get_extra_diary_branch_ids(obj)
        if not ids:
            return []
        from apps.clinics.models import Clinic
        return self._branch_dicts(Clinic.objects.filter(id__in=ids).order_by('name'))

    def get_diary_other_branches_level(self, obj) -> str:
        if obj.has_feature_permission('diary_other_branches', 'edit'):
            return 'edit'
        if obj.has_feature_permission('diary_other_branches', 'view'):
            return 'view'
        return 'none'

    def get_branch_assignments(self, obj) -> list:
        branch_accesses = obj.branch_accesses.select_related('branch').all()
        result = []
        for ba in branch_accesses:
            result.append({
                'id': ba.id,
                'branch_id': ba.branch_id,
                'branch_name': ba.branch.name if ba.branch else '',
                'is_active': ba.is_active,
                'duty_days': ba.duty_days or [],
                'duty_start_time': ba.duty_start_time.strftime('%H:%M') if hasattr(ba.duty_start_time, 'strftime') else (str(ba.duty_start_time)[:5] if ba.duty_start_time else '08:00'),
                'duty_end_time': ba.duty_end_time.strftime('%H:%M') if hasattr(ba.duty_end_time, 'strftime') else (str(ba.duty_end_time)[:5] if ba.duty_end_time else '17:00'),
                'lunch_start_time': ba.lunch_start_time.strftime('%H:%M') if hasattr(ba.lunch_start_time, 'strftime') else (str(ba.lunch_start_time)[:5] if ba.lunch_start_time else '12:00'),
                'lunch_end_time': ba.lunch_end_time.strftime('%H:%M') if hasattr(ba.lunch_end_time, 'strftime') else (str(ba.lunch_end_time)[:5] if ba.lunch_end_time else '13:00'),
                'duty_schedule': ba.duty_schedule,
            })
        return result

    def get_assigned_branch_ids(self, obj) -> list:
        active_ids = list(obj.branch_accesses.filter(is_active=True).values_list('branch_id', flat=True))
        if not active_ids and obj.clinic_branch_id:
            active_ids = [obj.clinic_branch_id]
        return active_ids

    def get_permissions_map(self, obj) -> dict:
        """
        Return a flat {feature_key: access_level} dict.

        Resolution order:
        1. OWNER in roles → all 'edit'.
        2. permission_group assigned → use the group's explicit matrix.
        3. Fallback → union of DEFAULT_PERMISSIONS across all assigned roles.
        """
        effective_roles = obj.get_effective_roles()
        if 'OWNER' in effective_roles:
            return {key: 'edit' for key in FEATURE_KEYS}
        if obj.permission_group_id:
            permissions = obj.permission_group.get_permissions_dict()
        else:
            permissions = _union_permissions(effective_roles)   # union fallback
        if 'BRANCH_MANAGER' in effective_roles:
            # Rule 2: a Branch Manager always manages the staff of their own clinics.
            for key in BRANCH_MANAGER_ALWAYS_EDIT:
                permissions[key] = 'edit'
        return permissions

    def get_avatar_url(self, obj) -> str | None:
        """Return the full URL for the avatar image."""
        request = self.context.get('request')
        if not obj.avatar:
            return None

        # Cloudinary already returns an absolute URL; local storage returns /media/...
        avatar_url = obj.avatar.url
        if request:
            return request.build_absolute_uri(avatar_url)
        return avatar_url

    def get_clinic_branch_name(self, obj) -> str | None:
        if obj.clinic_branch:
            return obj.clinic_branch.name
        return None

    def get_clinic_setup_complete(self, obj) -> bool:
        """
        Returns True if the user's main clinic has completed setup.
        Non-admin users always see True (they don't do setup).
        """
        if not obj.is_owner:
            return True
        if obj.clinic:
            return obj.clinic.main_clinic.setup_complete
        return False

    def to_representation(self, instance):
        """Add practitioner/staff availability, discipline, and practitioner_id to the serialized output."""
        data = super().to_representation(instance)
        # Never return legacy role codes, even for a row that has not been migrated yet.
        if data.get('role') is not None:
            data['role'] = normalize_role(data['role'])
        if isinstance(data.get('roles'), list):
            data['roles'] = normalize_roles(data['roles'])
        effective_roles = instance.get_effective_roles()

        if 'PRACTITIONER' in effective_roles:
            try:
                practitioner = instance.practitioner_profile
                if practitioner and not practitioner.is_deleted:
                    data['practitioner_id']  = practitioner.id
                    data['duty_days']        = practitioner.duty_days or ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
                    data['duty_start_time']  = practitioner.duty_start_time.strftime('%H:%M') if hasattr(practitioner.duty_start_time, 'strftime') else (str(practitioner.duty_start_time)[:5] if practitioner.duty_start_time else '08:00')
                    data['duty_end_time']    = practitioner.duty_end_time.strftime('%H:%M') if hasattr(practitioner.duty_end_time, 'strftime') else (str(practitioner.duty_end_time)[:5] if practitioner.duty_end_time else '17:00')
                    data['lunch_start_time'] = practitioner.lunch_start_time.strftime('%H:%M') if hasattr(practitioner.lunch_start_time, 'strftime') else (str(practitioner.lunch_start_time)[:5] if practitioner.lunch_start_time else '12:00')
                    data['lunch_end_time']   = practitioner.lunch_end_time.strftime('%H:%M') if hasattr(practitioner.lunch_end_time, 'strftime') else (str(practitioner.lunch_end_time)[:5] if practitioner.lunch_end_time else '13:00')
                    data['duty_schedule']    = practitioner.duty_schedule
                    data['discipline']       = practitioner.discipline or 'OCCUPATIONAL_THERAPY'
                else:
                    # Profile missing or soft-deleted — surface whatever is stored on the User model
                    # so the frontend always gets a non-empty discipline for prefill.
                    data['discipline'] = instance.discipline or 'OCCUPATIONAL_THERAPY'
            except Exception as exc:
                logger.warning(
                    "UserSerializer.to_representation: could not load practitioner profile for user %s: %s",
                    instance.pk, exc,
                )
                # Graceful fallback: use the User-level discipline field so the
                # frontend is never handed an empty string for an OWNER+PRACTITIONER.
                data['discipline'] = instance.discipline or 'OCCUPATIONAL_THERAPY'
        elif 'STAFF' in effective_roles:
            # Expose Staff availability stored directly on the User model
            data['duty_days']        = instance.duty_days or []
            data['duty_start_time']  = ''
            data['duty_end_time']    = ''
            data['lunch_start_time'] = instance.lunch_start_time or '12:00'
            data['lunch_end_time']   = instance.lunch_end_time or '13:00'
            data['duty_schedule']    = instance.duty_schedule
            data['discipline']       = instance.discipline or ''
        return data

    def validate_email(self, value):
        """Normalize email to lowercase; validate format with specific error messages."""
        normalized = value.strip().lower()
        try:
            validate_email_detailed(normalized)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message)
        return normalized

    def validate_phone(self, value):
        """Validate phone with specific error messages and normalize to +63 format."""
        if not value:
            return value
        try:
            validate_international_phone(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        return normalize_international_phone(value)

    def _manager_scope(self):
        """
        The clinics a Branch Manager actor may place staff in, or None when the actor is not a
        Branch Manager (the Owner is limited only to their clinic group).
        """
        request = self.context.get('request')
        actor = getattr(request, 'user', None)
        if not (actor and actor.is_authenticated and actor.is_branch_manager and not actor.is_owner):
            return None
        scope = set(actor.get_managed_branch_ids())
        if not scope and actor.clinic_branch_id:
            scope.add(actor.clinic_branch_id)   # legacy Branch Manager without managed rows
        return scope

    def validate_clinic_branch(self, value):
        if value is None:
            return value
        request = self.context.get('request')
        if request and request.user and request.user.clinic:
            main_clinic = request.user.clinic.main_clinic
            if value.id != main_clinic.id and value.parent_clinic_id != main_clinic.id:
                raise serializers.ValidationError(
                    "The selected branch does not belong to your clinic."
                )
        scope = self._manager_scope()
        unchanged = self.instance is not None and value.id == self.instance.clinic_branch_id
        if scope is not None and value.id not in scope and not unchanged:
            raise serializers.ValidationError("You can only use the clinics you manage.")
        return value

    def validate_permission_group(self, value):
        """
        Only the Owner may hand out permission groups freely. Anyone else may not pick an Owner group,
        a group of another clinic, or change the group they belong to themselves.
        """
        request = self.context.get('request')
        actor = getattr(request, 'user', None)
        if value is None or not (actor and actor.is_authenticated) or actor.is_owner:
            return value
        if self.instance is not None and value.pk == self.instance.permission_group_id:
            return value   # unchanged: re-sending the current group is always fine
        if value.role_template not in BRANCH_MANAGER_MANAGEABLE_TEMPLATES:
            raise serializers.ValidationError(
                "Only the Owner can use this permission group. Branch Managers can use the Frontdesk, Practitioner and Finance groups."
            )
        if actor.clinic and value.clinic_id != actor.clinic.main_clinic.id:
            raise serializers.ValidationError("That permission group does not belong to your clinic.")
        if self.instance is not None and self.instance.pk == actor.pk and value.pk != actor.permission_group_id:
            raise serializers.ValidationError("You cannot change your own permission group.")
        return value

    @staticmethod
    def _format_time_12h(time_str: str) -> str:
        """Format 'HH:MM' string to 12-hour format e.g. '09:00 AM'."""
        try:
            parts = str(time_str).strip().split(':')
            h = int(parts[0])
            m = int(parts[1]) if len(parts) > 1 else 0
            ampm = 'PM' if h >= 12 else 'AM'
            h12 = 12 if h % 12 == 0 else h % 12
            return f"{h12}:{m:02d} {ampm}"
        except Exception:
            return str(time_str)

    def _validate_duty_schedule(self, schedule):
        """Validate duty_schedule structure and check for overlaps (12h error messages)."""
        valid_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        if not isinstance(schedule, dict):
            raise serializers.ValidationError(
                {'duty_schedule': 'duty_schedule must be an object mapping day names to lists of blocks.'}
            )

        request = self.context.get('request')
        from apps.clinics.models import Clinic
        main_clinic = request.user.clinic.main_clinic if (request and getattr(request.user, 'clinic', None)) else None

        for day, blocks in schedule.items():
            if day not in valid_days:
                raise serializers.ValidationError(
                    {'duty_schedule': f'Invalid day key: {day}. Must be one of {valid_days}.'}
                )
            if not isinstance(blocks, list):
                raise serializers.ValidationError(
                    {'duty_schedule': f'Blocks for {day} must be a list.'}
                )
            sorted_blocks = sorted(blocks, key=lambda b: b.get('start', ''))
            for i, block in enumerate(sorted_blocks):
                if 'start' not in block or 'end' not in block:
                    raise serializers.ValidationError(
                        {'duty_schedule': f'Each block in {day} must have "start" and "end" keys.'}
                    )
                if block['start'] >= block['end']:
                    s_12 = self._format_time_12h(block['start'])
                    e_12 = self._format_time_12h(block['end'])
                    raise serializers.ValidationError(
                        {'duty_schedule': f'{day}: block start ({s_12}) must be before end ({e_12}).'}
                    )
                # Validate branch_id if provided
                bid = block.get('branch_id')
                if bid and main_clinic:
                    try:
                        branch_obj = Clinic.objects.get(pk=bid, is_deleted=False)
                        if branch_obj.id != main_clinic.id and branch_obj.parent_clinic_id != main_clinic.id:
                            raise serializers.ValidationError(
                                {'duty_schedule': f'Branch #{bid} does not belong to your clinic.'}
                            )
                        scope = self._manager_scope()
                        if scope is not None and branch_obj.id not in scope and not self._block_is_stored(day, block):
                            raise serializers.ValidationError(
                                {'duty_schedule': f'Branch #{bid} is not one of the clinics you manage.'}
                            )
                    except Clinic.DoesNotExist:
                        raise serializers.ValidationError(
                            {'duty_schedule': f'Branch #{bid} does not exist.'}
                        )

        overlap = find_overlap(schedule)
        if overlap:
            names = dict(Clinic.objects.filter(
                pk__in={b.get('branch_id') for blocks in schedule.values() for b in blocks if b.get('branch_id')}
            ).values_list('id', 'name'))
            raise serializers.ValidationError(
                {'duty_schedule': overlap_message(overlap, lambda branch_id: names.get(int(branch_id)))}
            )

        # A Branch Manager may only change hours at the clinics they manage. Hours at any other clinic
        # (managed by someone else) must come back exactly as stored: added, changed or removed -> refused.
        scope = self._manager_scope()
        if scope is not None and self.instance is not None:
            default_bid = self.instance.clinic_branch_id
            if blocks_outside(schedule, scope, default_bid) != blocks_outside(self._stored_schedule(), scope, default_bid):
                raise serializers.ValidationError(
                    {'duty_schedule': 'You can only change working hours at the clinics you manage.'}
                )

    def _stored_schedule(self):
        """The combined working hours currently saved for the user being edited."""
        user = self.instance
        if user is None:
            return {}
        if 'PRACTITIONER' in user.get_effective_roles():
            profile = getattr(user, 'practitioner_profile', None)
            if profile is not None and not profile.is_deleted and isinstance(profile.duty_schedule, dict):
                return profile.duty_schedule
        return user.duty_schedule if isinstance(user.duty_schedule, dict) else {}

    def _block_is_stored(self, day, block):
        """True when this exact block (day, hours, clinic) is already saved for the user being edited."""
        try:
            bid = int(block.get('branch_id'))
        except (TypeError, ValueError):
            return False
        key = (day, str(block.get('start')), str(block.get('end')), bid)
        return key in set(blocks_outside(self._stored_schedule(), set(), None))

    def validate(self, attrs):
        duty_schedule = attrs.get('duty_schedule')
        if duty_schedule is not None:
            self._validate_duty_schedule(duty_schedule)

        duty_days = attrs.get('duty_days')
        if duty_days is not None:
            valid_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            if not isinstance(duty_days, list):
                raise serializers.ValidationError({"duty_days": "duty_days must be a list."})
            for day in duty_days:
                if day not in valid_days:
                    raise serializers.ValidationError(
                        {"duty_days": f"Invalid day: {day}. Must be one of {valid_days}"}
                    )

        # Only validate legacy single-block times when duty_schedule is NOT provided
        if not duty_schedule:
            duty_start  = attrs.get('duty_start_time')
            duty_end    = attrs.get('duty_end_time')
            lunch_start = attrs.get('lunch_start_time')
            lunch_end   = attrs.get('lunch_end_time')

            if duty_start and duty_end:
                if duty_start >= duty_end:
                    raise serializers.ValidationError({
                        'duty_end_time': 'Duty end time must be after duty start time.'
                    })

            if lunch_start and lunch_end:
                if lunch_start >= lunch_end:
                    raise serializers.ValidationError({
                        'lunch_end_time': 'Lunch end time must be after lunch start time.'
                    })

        # ── Phase 5: One Branch Manager per branch constraint ────────────────────────
        # Validated here (serializer layer) AND enforced in the view layer with
        # select_for_update() inside a transaction to prevent race conditions.
        incoming_roles = attrs.get('roles') or [attrs.get('role', 'STAFF')]
        branch_ids     = attrs.get('branch_ids', [])

        if 'BRANCH_MANAGER' in incoming_roles and branch_ids:
            from apps.clinics.models import Clinic
            for branch_id in branch_ids:
                if not Clinic.objects.filter(pk=branch_id, is_deleted=False).exists():
                    raise serializers.ValidationError(
                        {'branch_ids': f'Branch ID {branch_id} does not exist.'}
                    )
            # Rule: no clinic may have two Branch Managers (shared helper, same message on every path).
            validate_branches_free_for_manager(branch_ids, exclude_user=self.instance)


        attrs = self._validate_extra_diary_branches(attrs)
        attrs = self._validate_work_branches(attrs)
        return attrs

    WORK_BRANCH_ROLES = {'STAFF', 'FINANCE'}

    def _validate_work_branches(self, attrs):
        """
        Frontdesk / Finance clinics. The Owner may use any clinic of the group. A Branch Manager may add
        or remove only the clinics they manage; any other clinic must stay as it is.
        """
        if 'work_branch_ids' not in attrs:
            return attrs
        roles = attrs.get('roles') or ([attrs['role']] if attrs.get('role') else None)
        if not roles:
            roles = self.instance.get_effective_roles() if self.instance else ['STAFF']
        roles = set(normalize_roles(list(roles)))
        if roles & {'OWNER', 'BRANCH_MANAGER', 'PRACTITIONER'} or not roles & self.WORK_BRANCH_ROLES:
            raise serializers.ValidationError({'work_branch_ids': (
                'Clinics are set this way only for Frontdesk and Finance staff. Practitioners get their clinics '
                'from their working hours, and the Owner sets the clinics a Branch Manager manages.')})

        ids = list(dict.fromkeys(attrs['work_branch_ids']))
        if not ids:
            raise serializers.ValidationError({'work_branch_ids': 'Choose at least one clinic.'})

        request = self.context.get('request')
        actor = getattr(request, 'user', None)
        if actor and actor.is_authenticated and actor.clinic:
            group_ids = set(actor.clinic.main_clinic.get_all_branches().values_list('id', flat=True))
            bad = [i for i in ids if i not in group_ids]
            if bad:
                raise serializers.ValidationError({'work_branch_ids': f'Clinic ID(s) {bad} do not belong to your clinic.'})

        scope = self._manager_scope()
        if scope is not None:
            stored = clinics_of(self.instance) if self.instance is not None else set()
            changed = set(ids) ^ stored
            home_unchanged = self.instance is not None and ids[0] == self.instance.clinic_branch_id
            if not changed <= scope or (ids[0] not in scope and not home_unchanged):
                raise serializers.ValidationError({'work_branch_ids': 'You can only add or remove the clinics you manage.'})

        attrs['work_branch_ids'] = ids
        return attrs

    @staticmethod
    def _sync_work_branches(user, branch_ids):
        """
        Make `branch_ids` the clinics a Frontdesk / Finance user works at: active assignment rows for each,
        other assignment rows deactivated (kept for history), home clinic = the first one.
        """
        from apps.clinics.models import Clinic
        with transaction.atomic():
            for branch_id in branch_ids:
                access, _ = UserBranchAccess.objects.select_for_update().get_or_create(
                    user=user, branch_id=branch_id, defaults={'is_active': True})
                if not access.is_active:
                    access.is_active = True
                    access.save(update_fields=['is_active'])
            (UserBranchAccess.objects
                .filter(user=user, is_active=True, is_managed=False)
                .exclude(branch_id__in=branch_ids)
                .update(is_active=False))
            home = Clinic.objects.filter(pk=branch_ids[0], is_deleted=False).first()
            if home and user.clinic_branch_id != home.id:
                user.clinic_branch = home
                user.save(update_fields=['clinic_branch'])

    def _validate_extra_diary_branches(self, attrs):
        """Only the Owner may grant extra Diary branches; they must be in the same clinic group."""
        if 'extra_diary_branch_ids' not in attrs:
            return attrs
        request = self.context.get('request')
        actor = getattr(request, 'user', None)
        if not (actor and actor.is_authenticated and actor.is_owner):
            raise serializers.ValidationError(
                {'extra_diary_branch_ids': 'Only the clinic owner can choose which other branches a Branch Manager may open.'}
            )
        ids = list(dict.fromkeys(attrs['extra_diary_branch_ids']))
        if ids:
            if not actor.clinic:
                raise serializers.ValidationError({'extra_diary_branch_ids': 'No clinic found for this account.'})
            group_ids = set(actor.clinic.main_clinic.get_all_branches().values_list('id', flat=True))
            bad = [i for i in ids if i not in group_ids]
            if bad:
                raise serializers.ValidationError(
                    {'extra_diary_branch_ids': f'Branch ID(s) {bad} do not belong to your clinic.'}
                )
        attrs['extra_diary_branch_ids'] = ids
        return attrs

    @staticmethod
    def _apply_extra_diary_branches(user, ids):
        """
        Store the picked branches. Only a Branch Manager can hold any, and a branch the Branch Manager
        already works at is not an "extra" one, so it is dropped.
        """
        from apps.clinics.models import Clinic
        if not user.is_branch_manager or user.is_owner:
            ids = []
        own = set(user.branch_accesses.values_list('branch_id', flat=True))
        if user.clinic_branch_id:
            own.add(user.clinic_branch_id)
        keep = [i for i in ids if i not in own]
        user.extra_diary_branches.set(Clinic.objects.filter(id__in=keep, is_deleted=False))

    def create(self, validated_data):
        password  = validated_data.pop('password', None)
        branch_ids = validated_data.pop('branch_ids', [])
        extra_diary_ids = validated_data.pop('extra_diary_branch_ids', None)

        # Ensure roles is set; derive from role if absent.
        roles = validated_data.get('roles')
        role  = validated_data.get('role', 'STAFF')
        if not roles:
            validated_data['roles'] = [role]
        roles = validated_data['roles']

        # Auto-derive permission_group from roles when not explicitly provided.
        if not validated_data.get('permission_group'):
            clinic = validated_data.get('clinic')
            if clinic:
                group = derive_permission_group_for_roles(roles, clinic)
                if group:
                    validated_data['permission_group'] = group

        # Pop fields that do not exist on the User model (Practitioner handles them)
        for field in ['duty_start_time', 'duty_end_time']:
            validated_data.pop(field, None)
        work_branch_ids = validated_data.pop('work_branch_ids', None)

        # duty_days, lunch_start_time, lunch_end_time, duty_schedule are columns on User
        # so they stay in validated_data and are set directly.

        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()

        # ── Phase 4: Sync UserBranchAccess rows for Branch Managers ─────────────────
        if branch_ids and 'BRANCH_MANAGER' in roles:
            self._sync_branch_accesses(user, branch_ids)
            # Keep clinic_branch FK pointing at primary (first) branch for compat
            if branch_ids:
                from apps.clinics.models import Clinic
                try:
                    primary = Clinic.objects.get(pk=branch_ids[0])
                    User.objects.filter(pk=user.pk).update(clinic_branch=primary)
                    user.clinic_branch = primary
                except Clinic.DoesNotExist:
                    pass

        if extra_diary_ids is not None:
            self._apply_extra_diary_branches(user, extra_diary_ids)
        if work_branch_ids:
            self._sync_work_branches(user, work_branch_ids)

        return user

    # ── Branch Manager clinics helper ─────────────────────────────────────────
    @staticmethod
    def _sync_branch_accesses(user, branch_ids: list):
        """
        Make `branch_ids` exactly the clinics `user` manages as Branch Manager.

        * Rule: no clinic may have two Branch Managers. Checked under a row lock here (and enforced by
          the database constraint) so two concurrent saves cannot both win.
        * Only managed rows are touched. A practitioner / staff assignment row of the same user is kept
          (it just stops being managed); a row that only existed for management is deleted.
        """
        from django.db import transaction as db_transaction
        wanted = set(branch_ids)
        with db_transaction.atomic():
            rows = {
                r.branch_id: r
                for r in UserBranchAccess.objects.select_for_update().filter(user=user)
            }
            # Lock the other managed rows on the wanted clinics, then check the rule.
            list(UserBranchAccess.objects.select_for_update().filter(branch_id__in=wanted, is_managed=True))
            validate_branches_free_for_manager(wanted, exclude_user=user)

            keeps_other_assignments = 'PRACTITIONER' in user.get_effective_roles()
            for branch_id, row in rows.items():
                if branch_id in wanted or not row.is_managed:
                    continue
                if keeps_other_assignments:
                    row.is_managed = False
                    row.save(update_fields=['is_managed'])
                else:
                    row.delete()

            for branch_id in wanted:
                row = rows.get(branch_id)
                if row is None:
                    UserBranchAccess.objects.create(user=user, branch_id=branch_id, is_managed=True)
                elif not row.is_managed:
                    row.is_managed = True
                    row.save(update_fields=['is_managed'])

    @staticmethod
    def _clear_managed_branches(user):
        """The user is no longer a Branch Manager: they manage no clinic (assignment rows are kept)."""
        UserBranchAccess.objects.filter(user=user, is_managed=True).update(is_managed=False)

    # ── Multi-Branch helper: sync UserBranchAccess rows for Practitioners ───
    @staticmethod
    def _sync_practitioner_branch_schedules(
        user,
        duty_schedule,
        default_branch=None,
        lunch_start_time='12:00',
        lunch_end_time='13:00'
    ):
        """
        Slices a combined multi-branch duty_schedule and synchronizes UserBranchAccess
        records for each unique assigned branch.

        - Reuses the same UserBranchAccess for multiple periods at the same branch.
        - Slices duty_schedule and duty_days per branch so branch-level availability
          and calendar queries are scoped correctly.
        - Soft-deactivates (is_active=False) any previously active UserBranchAccess
          for branches that no longer have working periods in the new schedule.
        """
        from apps.accounts.models import UserBranchAccess
        from apps.clinics.models import Clinic
        from django.db import transaction as db_transaction

        default_branch_id = default_branch.id if hasattr(default_branch, 'id') else default_branch
        if not default_branch_id and user.clinic_branch_id:
            default_branch_id = user.clinic_branch_id

        # Collect unique branches and their respective working periods
        branch_periods = {}  # branch_id -> { day: [ {start, end} ] }

        if duty_schedule and isinstance(duty_schedule, dict):
            for day, blocks in duty_schedule.items():
                if not isinstance(blocks, list):
                    continue
                for block in blocks:
                    bid = block.get('branch_id') or default_branch_id
                    if not bid:
                        continue
                    bid = int(bid)
                    if bid not in branch_periods:
                        branch_periods[bid] = {}
                    if day not in branch_periods[bid]:
                        branch_periods[bid][day] = []
                    branch_periods[bid][day].append({
                        'start': block['start'],
                        'end': block['end'],
                    })

        # If no branch_periods were extracted from duty_schedule, but a default_branch_id exists
        if not branch_periods and default_branch_id:
            branch_periods[default_branch_id] = duty_schedule or {}

        with db_transaction.atomic():
            # 1. Update/create active branch accesses for branches in the new schedule
            for branch_id, sched in branch_periods.items():
                try:
                    branch_obj = Clinic.objects.get(pk=branch_id, is_deleted=False)
                except Clinic.DoesNotExist:
                    continue

                days = list(sched.keys())
                all_starts = [b['start'] for blocks in sched.values() for b in blocks if 'start' in b]
                all_ends = [b['end'] for blocks in sched.values() for b in blocks if 'end' in b]
                duty_start = min(all_starts) if all_starts else '08:00'
                duty_end = max(all_ends) if all_ends else '17:00'

                uba, _ = UserBranchAccess.objects.select_for_update().get_or_create(
                    user=user,
                    branch=branch_obj,
                    defaults={
                        'duty_days': days,
                        'duty_schedule': sched,
                        'duty_start_time': duty_start,
                        'duty_end_time': duty_end,
                        'lunch_start_time': lunch_start_time or '12:00',
                        'lunch_end_time': lunch_end_time or '13:00',
                        'is_active': True,
                    }
                )
                uba.duty_days = days
                uba.duty_schedule = sched
                uba.duty_start_time = duty_start
                uba.duty_end_time = duty_end
                uba.lunch_start_time = lunch_start_time or '12:00'
                uba.lunch_end_time = lunch_end_time or '13:00'
                uba.is_active = True
                uba.save()

            # 2. For previously active branches of this practitioner that are NOT in branch_periods,
            # soft-deactivate them (is_active=False)
            assigned_bids = set(branch_periods.keys())
            if assigned_bids:
                UserBranchAccess.objects.filter(
                    user=user,
                    is_active=True
                ).exclude(branch_id__in=assigned_bids).update(is_active=False)

    def update(self, instance, validated_data):
        password   = validated_data.pop('password', None)
        branch_ids = validated_data.pop('branch_ids', None)  # None = not in payload (no change)
        extra_diary_ids = validated_data.pop('extra_diary_branch_ids', None)
        work_branch_ids = validated_data.pop('work_branch_ids', None)

        # Fields that live on the Practitioner model (not User) — pull them out
        practitioner_only_fields = ['duty_start_time', 'duty_end_time', 'discipline']
        practitioner_data = {}
        for field in practitioner_only_fields:
            if field in validated_data:
                practitioner_data[field] = validated_data.pop(field)

        # duty_days, lunch_*, duty_schedule live on User for STAFF and on Practitioner for PRACTITIONER
        shared_availability = {}
        for field in ['duty_days', 'lunch_start_time', 'lunch_end_time', 'duty_schedule']:
            if field in validated_data:
                shared_availability[field] = validated_data.pop(field)

        # Determine effective roles BEFORE calling instance.save(), because the
        # User.save() override normalises instance.role to the highest-priority
        # entry in instance.roles (e.g. OWNER beats PRACTITIONER).  Using
        # instance.role *after* save would therefore always resolve to 'OWNER'
        # for Owner+Practitioner users, preventing their schedule from syncing.
        incoming_roles = validated_data.get('roles', None)
        effective_roles_after = (
            incoming_roles
            if isinstance(incoming_roles, list) and incoming_roles
            else instance.get_effective_roles()
        )

        # Auto-sync permission_group when roles change.
        # Only overrides when roles are explicitly part of this update payload;
        # a patch that only touches availability fields must not change the group.
        if incoming_roles is not None:
            clinic = instance.clinic
            if clinic:
                group = derive_permission_group_for_roles(effective_roles_after, clinic)
                if group:
                    instance.permission_group = group

        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Store availability on User for STAFF-only users (not combined with PRACTITIONER)
        if 'STAFF' in effective_roles_after and 'PRACTITIONER' not in effective_roles_after:
            for field, value in shared_availability.items():
                setattr(instance, field, value)
            if 'discipline' in practitioner_data:
                instance.discipline = practitioner_data['discipline']

        if password:
            instance.set_password(password)
            instance.password_changed = True
        instance.save()

        # Sync Practitioner availability fields when PRACTITIONER is in effective roles.
        # This handles pure-PRACTITIONER AND Owner+Practitioner users correctly.
        if 'PRACTITIONER' in effective_roles_after:
            try:
                practitioner = instance.practitioner_profile
                if practitioner and not practitioner.is_deleted:
                    import json
                    update_data = {}
                    if 'duty_days' in shared_availability:
                        duty_days = shared_availability['duty_days']
                        if isinstance(duty_days, str):
                            try:
                                duty_days = json.loads(duty_days)
                            except (json.JSONDecodeError, ValueError):
                                duty_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
                        update_data['duty_days'] = duty_days
                    if 'duty_start_time' in practitioner_data:
                        update_data['duty_start_time'] = practitioner_data['duty_start_time']
                    if 'duty_end_time' in practitioner_data:
                        update_data['duty_end_time'] = practitioner_data['duty_end_time']
                    for f in ['lunch_start_time', 'lunch_end_time', 'duty_schedule']:
                        if f in shared_availability:
                            update_data[f] = shared_availability[f]
                    if 'discipline' in practitioner_data:
                        # Only overwrite when a non-empty value is provided so that
                        # an empty-string payload (caused by a frontend prefill miss)
                        # does not silently erase a previously saved discipline.
                        incoming_discipline = practitioner_data['discipline']
                        if incoming_discipline:
                            update_data['discipline'] = incoming_discipline
                        else:
                            # Fall back to keep existing value; use default only if
                            # the practitioner record itself has no discipline yet.
                            if not practitioner.discipline:
                                update_data['discipline'] = 'OCCUPATIONAL_THERAPY'

                    if update_data:
                        Practitioner.objects.filter(pk=practitioner.pk).update(**update_data)
                        # Mirror discipline on the User model so to_representation always
                        # has a fallback even when the practitioner reverse accessor fails.
                        if 'discipline' in update_data:
                            User.objects.filter(pk=instance.pk).update(
                                discipline=update_data['discipline']
                            )
                        instance.__dict__.pop('practitioner_profile', None)
            except Exception as exc:
                logger.warning(
                    "UserSerializer.update: could not sync practitioner profile for user %s: %s",
                    instance.pk, exc,
                )

        # ── Phase 4: Sync UserBranchAccess rows for Branch Managers (on update) ───────────
        # branch_ids is None when not present in the payload (no change desired);
        # an empty list means "remove all branch assignments".
        if branch_ids is not None and 'BRANCH_MANAGER' in effective_roles_after:
            self._sync_branch_accesses(instance, branch_ids)
            # Sync clinic_branch FK to the primary (first) branch
            if branch_ids:
                from apps.clinics.models import Clinic
                try:
                    primary = Clinic.objects.get(pk=branch_ids[0])
                    instance.clinic_branch = primary
                    instance.save(update_fields=['clinic_branch'])
                except Clinic.DoesNotExist:
                    pass
            else:
                # All branches removed \u2014 null out the FK
                instance.clinic_branch = None
                instance.save(update_fields=['clinic_branch'])

        # Not a Branch Manager (any more): manages no clinic.
        if 'BRANCH_MANAGER' not in effective_roles_after:
            self._clear_managed_branches(instance)

        # ── Multi-Branch: Sync UserBranchAccess rows for Practitioners ─────────────
        if 'PRACTITIONER' in effective_roles_after:
            sched_to_sync = shared_availability.get('duty_schedule')
            if sched_to_sync is None and hasattr(instance, 'practitioner_profile'):
                sched_to_sync = getattr(instance.practitioner_profile, 'duty_schedule', None)
            if sched_to_sync is not None:
                self._sync_practitioner_branch_schedules(
                    user=instance,
                    duty_schedule=sched_to_sync,
                    default_branch=instance.clinic_branch,
                    lunch_start_time=shared_availability.get('lunch_start_time', '12:00'),
                    lunch_end_time=shared_availability.get('lunch_end_time', '13:00'),
                )

        # ── Frontdesk / Finance clinics ──────────────────────────────────────────
        if work_branch_ids:
            self._sync_work_branches(instance, work_branch_ids)

        # ── Diary access to other branches (re-applied after role/branch changes) ──
        if extra_diary_ids is not None:
            self._apply_extra_diary_branches(instance, extra_diary_ids)
        elif 'BRANCH_MANAGER' not in effective_roles_after or 'OWNER' in effective_roles_after:
            instance.extra_diary_branches.clear()

        return instance


class AdminRegistrationSerializer(serializers.Serializer):
    first_name   = serializers.CharField(max_length=150, required=True)
    last_name    = serializers.CharField(max_length=150, required=True)
    company_name = serializers.CharField(max_length=255, required=True)
    email        = serializers.EmailField(required=True)
    phone        = serializers.CharField(max_length=15, required=False, allow_blank=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        try:
            validate_email_detailed(normalized)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message)
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def validate_phone(self, value):
        if value:
            try:
                validate_international_phone(value)
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.message)
            return normalize_international_phone(value)
        return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm', 'role', 'phone']

    def validate_email(self, value):
        """Normalize email to lowercase; validate format with specific error messages."""
        normalized = value.strip().lower()
        try:
            validate_email_detailed(normalized)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message)
        return normalized

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user     = User.objects.create(**validated_data)
        user.set_password(password)
        user.password_changed = True
        user.save()
        return user


class PasswordChangeSerializer(serializers.Serializer):
    old_password         = serializers.CharField(required=True, write_only=True)
    new_password         = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Permission
        fields = '__all__'


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model  = Role
        fields = '__all__'
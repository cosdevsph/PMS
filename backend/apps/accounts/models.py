from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from apps.common.models import TimeStampedModel, SoftDeleteModel
from apps.common.validators import validate_international_phone
from apps.accounts.roles import (
    ROLE_PRIORITY, ROLE_OWNER, ROLE_BRANCH_MANAGER, normalize_role, normalize_roles,
)

# ── RBAC Feature Keys ─────────────────────────────────────────────────────────
FEATURE_KEYS = [
    'dashboard',
    'appointments',
    'calendar',
    'diary',
    # Lets a Branch Manager open the Diary of the extra branches the Owner picked for them
    # (User.extra_diary_branches). none = own branches only.
    'diary_other_branches',
    'clinical_notes',
    'client_cases',
    'patients',
    'reports',
    'inventory',
    'invoices',
    'billing',
    'subscriptions',
    # 'setup' kept for sidebar lock-icon; page access is always granted.
    'setup',
    'staff_management',
    'permissions',
    'settings',
    'documents',
    'outcome_measures',
    'contacts',
    'communication',
    # Granular Setup card permissions — each controls one card inside /setup
    'setup_practice',
    'setup_items',
    'setup_users',
    'setup_account',
    'setup_communication',
    # Granular Manage card permissions — each controls one card inside /manage
    'manage_administration',
    'manage_clinical',
    'manage_communications',
    # Granular Report card permissions — each controls one card inside /reports
    'reports_administration',
    'reports_clinic',
    'reports_financial',
    'reports_performance',
]

# Default permission matrices for each role template
DEFAULT_PERMISSIONS = {
    'OWNER': {key: 'edit' for key in FEATURE_KEYS},
    'BRANCH_MANAGER': {
        'dashboard': 'edit',
        'appointments': 'edit',
        'calendar': 'edit',
        'diary': 'edit',
        'diary_other_branches': 'none',
        'clinical_notes': 'view',   # Branch Manager can VIEW clinical notes, not edit
        'client_cases': 'edit',
        'patients': 'edit',
        'reports': 'edit',
        'inventory': 'edit',
        'invoices': 'edit',
        'billing': 'edit',
        'subscriptions': 'none',    # No subscription management
        'setup': 'view',
        'staff_management': 'edit',
        'permissions': 'none',      # Cannot manage system permissions
        'settings': 'none',         # No system settings access
        'documents': 'edit',
        'outcome_measures': 'edit',
        'contacts': 'edit',
        'communication': 'edit',
        # Granular setup card permissions
        'setup_practice':      'edit',
        'setup_items':         'edit',
        'setup_users':         'edit',
        'setup_account':       'none',  # No account/billing settings
        'setup_communication': 'edit',
        # Granular manage card permissions
        'manage_administration': 'edit',
        'manage_clinical':       'view',
        'manage_communications': 'edit',
        # Granular report card permissions
        'reports_administration': 'edit',
        'reports_clinic':         'edit',
        'reports_financial':      'edit',
        'reports_performance':    'edit',
    },
    'FRONTDESK': {
        'dashboard': 'view',
        'appointments': 'edit',
        'calendar': 'edit',
        'diary': 'edit',
        'diary_other_branches': 'none',
        'clinical_notes': 'view',
        'client_cases': 'view',
        'patients': 'edit',
        'reports': 'view',
        'inventory': 'view',
        'invoices': 'edit',
        'billing': 'view',
        'subscriptions': 'none',
        'setup': 'none',
        'staff_management': 'none',
        'permissions': 'none',
        'settings': 'none',
        'documents': 'view',
        'outcome_measures': 'view',
        'contacts': 'edit',
        'communication': 'edit',
        # Granular setup card permissions
        'setup_practice':      'view',
        'setup_items':         'view',
        'setup_users':         'none',
        'setup_account':       'none',
        'setup_communication': 'view',
        # Granular manage card permissions
        'manage_administration': 'view',
        'manage_clinical':       'view',
        'manage_communications': 'edit',
        # Granular report card permissions
        'reports_administration': 'edit',
        'reports_clinic':         'view',
        'reports_financial':      'edit',
        'reports_performance':    'view',
    },
    'PRACTITIONER': {
        'dashboard': 'view',
        'appointments': 'edit',
        'calendar': 'edit',
        'diary': 'edit',
        'diary_other_branches': 'none',
        'clinical_notes': 'edit',
        'client_cases': 'edit',
        'patients': 'edit',
        'reports': 'view',
        'inventory': 'view',
        'invoices': 'view',
        'billing': 'none',
        'subscriptions': 'none',
        'setup': 'none',
        'staff_management': 'none',
        'permissions': 'none',
        'settings': 'none',
        'documents': 'edit',
        'outcome_measures': 'edit',
        'contacts': 'edit',
        'communication': 'view',
        # Granular setup card permissions
        'setup_practice':      'view',
        'setup_items':         'none',
        'setup_users':         'none',
        'setup_account':       'none',
        'setup_communication': 'view',
        # Granular manage card permissions
        'manage_administration': 'none',
        'manage_clinical':       'edit',
        'manage_communications': 'view',
        # Granular report card permissions
        'reports_administration': 'none',
        'reports_clinic':         'edit',
        'reports_financial':      'none',
        'reports_performance':    'view',
    },
}

# ── Multi-Role Helpers ────────────────────────────────────────────────────────

# Features a Branch Manager ALWAYS has Edit on, whatever their permission group says: managing the staff of
# their own clinics (Rule 2, 2026-10-22). The Owner configures everything else.
BRANCH_MANAGER_ALWAYS_EDIT = ('staff_management', 'setup_users')

# Role precedence (ROLE_PRIORITY, from accounts.roles) derives the "primary" role field when a
# user has multiple roles: the highest priority wins.

# Permission defaults for the FINANCE role. (BRANCH_MANAGER is defined above.)
DEFAULT_PERMISSIONS['FINANCE'] = {
    'dashboard':    'view',
    'appointments': 'view',
    'calendar':     'view',
    'diary':        'none',
    'diary_other_branches': 'none',
    'clinical_notes':   'none',
    'client_cases':     'none',
    'patients':         'view',
    'reports':          'view',
    'inventory':        'view',
    'invoices':         'edit',
    'billing':          'edit',
    'subscriptions':    'none',
    'setup':            'none',
    'staff_management': 'none',
    'permissions':      'none',
    'settings':         'none',
    'documents':        'none',
    'outcome_measures': 'none',
    'contacts':         'view',
    'communication':    'view',
    # Granular setup card permissions
    'setup_practice':      'none',
    'setup_items':         'none',
    'setup_users':         'none',
    'setup_account':       'none',
    'setup_communication': 'none',
    # Granular manage card permissions
    'manage_administration': 'edit',
    'manage_clinical':       'none',
    'manage_communications': 'none',
    # Granular report card permissions
    'reports_administration': 'view',
    'reports_clinic':         'none',
    'reports_financial':      'edit',
    'reports_performance':    'view',
}

# READ_ONLY: view-only access. Sensitive admin-only keys are set to 'none'.
DEFAULT_PERMISSIONS['READ_ONLY'] = {key: 'view' for key in FEATURE_KEYS}
DEFAULT_PERMISSIONS['READ_ONLY'].update({
    'permissions':       'none',
    'diary_other_branches': 'none',
    'subscriptions':     'none',
    'setup_account':     'none',
    'staff_management':  'none',
    'setup_users':       'none',
    # Granular manage/report sections — view is fine for read-only
})

# Default permission matrix per role — used for union-based access when a user
# has no explicit PermissionGroup assigned but holds multiple roles.
ROLE_DEFAULT_PERMISSIONS = {
    'OWNER':           {key: 'edit' for key in FEATURE_KEYS},
    'BRANCH_MANAGER':  DEFAULT_PERMISSIONS['BRANCH_MANAGER'],
    'PRACTITIONER':    DEFAULT_PERMISSIONS['PRACTITIONER'],
    'STAFF':           DEFAULT_PERMISSIONS['FRONTDESK'],
    'FINANCE':         DEFAULT_PERMISSIONS['FINANCE'],
    'READ_ONLY':       DEFAULT_PERMISSIONS['READ_ONLY'],
}

ACCESS_LEVELS = {'none': 0, 'view': 1, 'edit': 2}
REVERSE_ACCESS = {v: k for k, v in ACCESS_LEVELS.items()}


# ── Role → PermissionGroup template lookup map ──────────────────────────────
# Used by derive_permission_group_for_roles() to map each role to its
# corresponding system PermissionGroup template key.
_ROLE_TO_PG_TEMPLATE = {
    'OWNER':           'BRANCH_MANAGER',   # unchanged behavior: Owners were mapped to the Branch Manager-level group
    'BRANCH_MANAGER':  'BRANCH_MANAGER',
    'PRACTITIONER':    'PRACTITIONER',
    'STAFF':           'FRONTDESK',        # STAFF users get Frontdesk-level group
    'FINANCE':         'FINANCE',
    'READ_ONLY':       'READ_ONLY',
}


def derive_permission_group_for_roles(roles: list, clinic) -> 'PermissionGroup | None':
    """
    Return the clinic's system PermissionGroup that best matches the given roles.

    Selection logic:
    - Iterates ROLE_PRIORITY (OWNER → BRANCH_MANAGER → PRACTITIONER → STAFF → FINANCE)
    - First matching role in the list determines the template.
    - Looks up the main clinic's system template group for that template key.
    - Returns None if no suitable group is found (e.g. clinic not yet seeded).

    Example:
        roles=["OWNER", "PRACTITIONER"] → BRANCH_MANAGER template group
        roles=["STAFF", "PRACTITIONER"] → PRACTITIONER template group
        roles=["FINANCE"]              → FINANCE template group
    """
    if not roles or not clinic:
        return None

    # Resolve to main clinic — system templates are always seeded on the main branch
    main_clinic = clinic if getattr(clinic, 'is_main_branch', True) else getattr(clinic, 'parent_clinic', clinic)

    for role in ROLE_PRIORITY:
        if role not in roles:
            continue
        template = _ROLE_TO_PG_TEMPLATE.get(role)
        if not template:
            continue
        group = PermissionGroup.objects.filter(
            clinic=main_clinic,
            role_template=template,
            is_system_template=True,
        ).first()
        if group:
            return group

    return None


def _union_permissions(roles: list) -> dict:
    """
    Return a {feature_key: access_level} dict that is the union (max level)
    of all default permission matrices for the given roles.
    """
    result = {key: 0 for key in FEATURE_KEYS}
    for role in roles:
        matrix = ROLE_DEFAULT_PERMISSIONS.get(role, {})
        for key in FEATURE_KEYS:
            level = ACCESS_LEVELS.get(matrix.get(key, 'none'), 0)
            if level > result[key]:
                result[key] = level
    return {key: REVERSE_ACCESS[v] for key, v in result.items()}


# ── RBAC Models ───────────────────────────────────────────────────────────────

class PermissionGroup(TimeStampedModel):
    """
    A clinic-specific permission group that defines a set of feature-level
    access levels. Acts as both a reusable template and actual assignment target.
    """
    TEMPLATE_CHOICES = [
        ('OWNER',           'Owner'),
        ('BRANCH_MANAGER',  'Branch Manager'),
        ('FRONTDESK',       'Frontdesk'),
        ('PRACTITIONER',    'Practitioner'),
        ('FINANCE',         'Finance'),
        ('READ_ONLY',       'Read-Only'),
        ('CUSTOM',          'Custom'),
    ]

    clinic = models.ForeignKey(
        'clinics.Clinic',
        on_delete=models.CASCADE,
        related_name='permission_groups',
        help_text='The clinic this permission group belongs to.',
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    role_template = models.CharField(
        max_length=20,
        choices=TEMPLATE_CHOICES,
        default='CUSTOM',
        help_text='Starting template used to seed default permissions.',
    )
    is_protected = models.BooleanField(
        default=False,
        help_text='Protected groups (e.g. Owner) cannot be deleted.',
    )
    is_system_template = models.BooleanField(
        default=False,
        help_text='System-seeded defaults; one per clinic per role template.',
    )

    class Meta:
        db_table = 'permission_groups'
        unique_together = [('clinic', 'name')]
        ordering = ['role_template', 'name']

    def __str__(self):
        return f"{self.name} ({self.clinic.name})"

    def get_permission(self, feature_key: str) -> str:
        """Return the access level for a feature, defaulting to 'none'."""
        try:
            return self.feature_permissions.get(feature_key=feature_key).access_level
        except FeaturePermission.DoesNotExist:
            return 'none'

    def get_permissions_dict(self) -> dict:
        """Return {feature_key: access_level} for ALL known features.
        Features without an explicit FeaturePermission record default to 'none'.
        """
        existing = {
            fp.feature_key: fp.access_level
            for fp in self.feature_permissions.all()
        }
        return {key: existing.get(key, 'none') for key in FEATURE_KEYS}


class FeaturePermission(models.Model):
    """
    A single feature → access_level mapping within a PermissionGroup.
    """
    ACCESS_CHOICES = [
        ('none', 'No Access'),
        ('view', 'View'),
        ('edit', 'Edit'),
    ]

    group = models.ForeignKey(
        PermissionGroup,
        on_delete=models.CASCADE,
        related_name='feature_permissions',
    )
    feature_key = models.CharField(
        max_length=100,
        help_text='One of the FEATURE_KEYS constants.',
    )
    access_level = models.CharField(
        max_length=10,
        choices=ACCESS_CHOICES,
        default='none',
    )

    class Meta:
        db_table = 'feature_permissions'
        unique_together = [('group', 'feature_key')]

    def __str__(self):
        return f"{self.group.name} | {self.feature_key} → {self.access_level}"


# ── User Manager ──────────────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        # normalize_email only lowercases the domain; lower() covers the local part too.
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'OWNER')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser, TimeStampedModel, SoftDeleteModel):
    """Custom User model with role-based access control"""
    
    ROLE_CHOICES = [
        ('OWNER',            'Owner'),
        ('BRANCH_MANAGER',   'Branch Manager'),
        ('PRACTITIONER',     'Practitioner'),
        ('STAFF',            'Staff'),
        ('FINANCE',          'Finance'),
        ('READ_ONLY',        'Read-Only'),
    ]
    
    username = None  # Remove username field
    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')
    phone = models.CharField(max_length=15, blank=True, validators=[validate_international_phone])
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_permanently_deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text='True when an admin permanently purges this user. Releases clinician allocation while preserving historical records.'
    )
    
    # Password change tracking
    password_changed = models.BooleanField(default=False)

    # Mandatory first-login password change flag
    # Set to True when a temporary password is issued (admin registration / forced reset).
    # Must be cleared by the user completing the ChangePasswordPage flow.
    must_change_password = models.BooleanField(
        default=False,
        help_text='Forces the user to set a new password before accessing the application.'
    )

    # Password rotation schedule
    ROTATION_CHOICES = [
        ('none',    'None'),
        ('weekly',  'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly',  'Yearly'),
    ]
    password_rotation    = models.CharField(
        max_length=10, choices=ROTATION_CHOICES, default='none',
        help_text='Automatic password rotation schedule'
    )
    last_password_change = models.DateTimeField(
        null=True, blank=True,
        help_text='Timestamp of the last password change'
    )

    # Temporary credential expiry — set when a system-generated password is issued.
    # Login is rejected (and admin must reset the account) if this timestamp passes
    # before the user completes the mandatory first-login password change.
    temp_password_expires_at = models.DateTimeField(
        null=True, blank=True,
        help_text='Expiry timestamp for system-issued temporary credentials. '
                  'Null means no TTL is enforced.'
    )

    # Staff position/title (e.g., "Clinic Desk", "Office Manager")
    position = models.CharField(max_length=200, blank=True)

    # Discipline (for STAFF role — PRACTITIONERs use the Practitioner model)
    discipline = models.CharField(max_length=200, blank=True)

    # Clinic association (main clinic)
    clinic = models.ForeignKey(
        'clinics.Clinic',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )

    # ✅ NEW: Specific branch assignment (optional — null means "all branches")
    clinic_branch = models.ForeignKey(
        'clinics.Clinic',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='branch_users',
        help_text='Specific branch this staff/practitioner is assigned to. '
                  'Null means they work across all branches.'
    )

    # ── Availability (for STAFF role — PRACTITIONERs use the Practitioner model) ──
    duty_days = models.JSONField(
        default=list,
        blank=True,
        help_text='List of duty days for staff, e.g. ["Mon","Tue"]'
    )
    lunch_start_time = models.CharField(
        max_length=5, blank=True, default='12:00',
        help_text='Lunch start HH:MM'
    )
    lunch_end_time = models.CharField(
        max_length=5, blank=True, default='13:00',
        help_text='Lunch end HH:MM'
    )
    # Split-shift schedule: {"Mon": [{"start":"08:00","end":"11:00"}, ...], ...}
    duty_schedule = models.JSONField(
        null=True, blank=True, default=None,
        help_text='Per-day list of {start, end} blocks (Staff scheduling)'
    )

    # ── RBAC: Permission Group assignment ─────────────────────────────────────
    permission_group = models.ForeignKey(
        'accounts.PermissionGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        help_text='The RBAC permission group assigned to this user. '
                  'Overrides role-based defaults for feature-level access.',
    )

    # ── Diary access to branches outside the user's own ────────────────────
    # Set by the Owner for a Branch Manager (BRANCH_MANAGER). Used only for Diary /
    # Calendar access, together with the 'diary_other_branches' permission level.
    # Deliberately NOT UserBranchAccess: that table drives clinician seat counts,
    # practitioner lists, schedules and the one-Branch-Manager-per-branch rule.
    extra_diary_branches = models.ManyToManyField(
        'clinics.Clinic',
        blank=True,
        related_name='extra_diary_users',
        help_text='Branches whose Diary this Branch Manager may open in addition to their own. '
                  'The level (view/edit) comes from the permission group.',
    )

    # ── Multi-Role: ordered list of assigned roles ─────────────────────────
    # e.g. ["OWNER", "PRACTITIONER"] — kept in sync with `role` (primary).
    roles = models.JSONField(
        default=list,
        blank=True,
        help_text='All roles assigned to this user. '
                  'The highest-priority entry drives the `role` field.'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['clinic_branch']),   # ✅ NEW index
        ]

    def save(self, *args, **kwargs):
        # Always persist email in lowercase to prevent case-sensitive duplicates.
        if self.email:
            self.email = self.email.strip().lower()

        # ── Legacy role codes are converted on the way in (see accounts/roles.py) ──
        self.role = normalize_role(self.role)
        self.roles = normalize_roles(self.roles)

        # ── Multi-role sync ──────────────────────────────────────────────────
        # Ensure `roles` is a valid, deduplicated list.
        if not isinstance(self.roles, list):
            self.roles = [self.role] if self.role else []
        else:
            # Deduplicate while preserving priority order
            seen = set()
            cleaned = []
            for r in self.roles:
                if r in dict(self.ROLE_CHOICES) and r not in seen:
                    cleaned.append(r)
                    seen.add(r)
            self.roles = cleaned

        # If roles is empty, seed from the existing `role` field.
        if not self.roles and self.role:
            self.roles = [self.role]

        # Derive primary `role` from the highest-priority entry in `roles`.
        if self.roles:
            for priority_role in ROLE_PRIORITY:
                if priority_role in self.roles:
                    self.role = priority_role
                    break

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    @property
    def is_owner(self):
        """True when the user holds the OWNER role (the clinic owner)."""
        return ROLE_OWNER in self.get_effective_roles()

    @property
    def is_branch_manager(self):
        """True when the user holds the BRANCH_MANAGER role."""
        return ROLE_BRANCH_MANAGER in self.get_effective_roles()

    @property
    def is_practitioner(self):
        return 'PRACTITIONER' in (self.roles or [self.role])
    
    @property
    def is_staff_member(self):
        return 'STAFF' in (self.roles or [self.role])

    @property
    def subscription(self):
        """
        Return the authoritative subscription for this user.
        If user belongs to a clinic, resolves to main clinic's subscription.
        Falls back to user's created subscriptions.
        """
        if self.clinic:
            main = self.clinic.main_clinic
            if hasattr(main, 'subscription') and main.subscription:
                return main.subscription
        return self.created_subscriptions.first() if hasattr(self, 'created_subscriptions') else None
    
    @property
    def needs_password_change(self):
        """Check if user needs to change password"""
        return not self.password_changed

    def get_effective_roles(self) -> list:
        """
        Return the canonical roles list, always non-empty.

        Legacy role codes are converted on read (see accounts/roles.py), so a row that has not been
        migrated yet (a database between a code deploy and `migrate`) still behaves as an Owner /
        Branch Manager instead of silently losing its access.
        """
        r = self.roles or []
        if not r and self.role:
            return normalize_roles([self.role])
        return normalize_roles(r)

    def has_feature_permission(self, feature_key: str, required_level: str = 'view') -> bool:
        """
        Check whether this user has at least `required_level` access to a feature.

        Access hierarchy: edit > view > none

        Resolution order:
        1. OWNER in roles → always grant.
        2. BRANCH_MANAGER + staff management features → always grant (Rule 2).
        3. permission_group assigned → use the group's explicit matrix.
        4. Fallback → union of DEFAULT_PERMISSIONS across all assigned roles.
        """
        effective_roles = self.get_effective_roles()

        if 'OWNER' in effective_roles:
            return True

        # Rule 2: a Branch Manager can always manage staff in their own clinics.
        if 'BRANCH_MANAGER' in effective_roles and feature_key in BRANCH_MANAGER_ALWAYS_EDIT:
            return True

        levels = ACCESS_LEVELS
        required = levels.get(required_level, 1)

        if self.permission_group_id:
            actual = levels.get(self.permission_group.get_permission(feature_key), 0)
            return actual >= required

        # No explicit group — union across role defaults
        if not effective_roles:
            return False
        union_map = _union_permissions(effective_roles)
        actual = levels.get(union_map.get(feature_key, 'none'), 0)
        return actual >= required

    def can_view(self, feature_key: str) -> bool:
        return self.has_feature_permission(feature_key, 'view')

    def can_edit(self, feature_key: str) -> bool:
        return self.has_feature_permission(feature_key, 'edit')

    def get_managed_branch_ids(self):
        """
        IDs of the clinics this user manages as Branch Manager (rows with is_managed=True).
        Practitioner / staff branch assignments are not management and are not included.
        Empty for every other role; the Owner manages everything and is handled by the callers.
        """
        if not self.is_branch_manager:
            return []
        return list(self.branch_accesses.filter(is_managed=True).values_list('branch_id', flat=True))

    def get_managed_branches(self):
        """
        Return the QuerySet of Clinic branches this user is assigned to manage.

        For BRANCH_MANAGER users: the clinics they manage (UserBranchAccess rows with
        is_managed=True). One clinic has at most one Branch Manager; one Branch Manager may
        manage any number of clinics.

        For OWNER users: returns all branches of their clinic family.

        For all other roles: returns an empty QuerySet.
        """
        from apps.clinics.models import Clinic
        if self.is_owner:
            if self.clinic:
                return self.clinic.get_all_branches()
            return Clinic.objects.none()
        if self.is_branch_manager:
            return Clinic.objects.filter(
                user_branch_accesses__user=self,
                user_branch_accesses__is_managed=True,
                is_deleted=False,
            )
        return Clinic.objects.none()


class Permission(TimeStampedModel):
    """Custom permissions for fine-grained access control"""
    
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'permissions'
    
    def __str__(self):
        return self.name


class Role(TimeStampedModel):
    """Role model for grouping permissions"""
    
    name = models.CharField(max_length=50, unique=True)
    permissions = models.ManyToManyField(Permission, related_name='roles')
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'roles'
    
    def __str__(self):
        return self.name


# ── Audit: Role Change Log ────────────────────────────────────────────────────

# ── Phase 4: Branch Assignment Engine ─────────────────────────────────────────

class UserBranchAccess(TimeStampedModel):
    """
    Many-to-many junction table between Users and Clinic branches.

    Primary purpose: express a Branch Manager's (BRANCH_MANAGER) scope — i.e. which
    branches they are responsible for.  One Branch Manager may own many branches, but
    each branch may only have ONE Branch Manager (enforced in the serializer layer).

    Also used to express multi-branch assignments for operational roles in
    future phases (currently operational users keep the single clinic_branch FK).

    The existing User.clinic_branch FK is kept as a convenience pointer to the
    "primary" branch and remains the source of truth for all existing queries
    in Calendar, Diary, and Appointments.
    """

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='branch_accesses',
        help_text='The user who has access to / manages this branch.',
    )
    branch = models.ForeignKey(
        'clinics.Clinic',
        on_delete=models.CASCADE,
        related_name='user_branch_accesses',
        help_text='The clinic branch the user can access.',
    )

    # ── Branch-specific practitioner / staff schedule ─────────────────────────
    duty_days = models.JSONField(
        default=list,
        blank=True,
        help_text='List of duty days for this branch, e.g. ["Mon", "Tue"]'
    )
    duty_start_time = models.TimeField(
        null=True,
        blank=True,
        default='08:00',
        help_text='Duty start time for this branch'
    )
    duty_end_time = models.TimeField(
        null=True,
        blank=True,
        default='17:00',
        help_text='Duty end time for this branch'
    )
    lunch_start_time = models.TimeField(
        null=True,
        blank=True,
        default='12:00',
        help_text='Lunch start time for this branch'
    )
    lunch_end_time = models.TimeField(
        null=True,
        blank=True,
        default='13:00',
        help_text='Lunch end time for this branch'
    )
    duty_schedule = models.JSONField(
        null=True,
        blank=True,
        default=None,
        help_text='Per-day split-shift schedule for this branch'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Active status of this branch assignment'
    )
    is_managed = models.BooleanField(
        default=False,
        help_text='True when this user is the Branch Manager of this clinic. A clinic can have at most one '
                  'managed row (database constraint). Practitioner / staff assignments stay False.',
    )

    class Meta:
        db_table = 'user_branch_access'
        unique_together = [('user', 'branch')]
        ordering = ['branch__name']
        indexes = [
            models.Index(fields=['user', 'branch']),
            models.Index(fields=['branch']),
            models.Index(fields=['user', 'is_active']),
        ]
        constraints = [
            # Rule: no clinic may have two Branch Managers.
            models.UniqueConstraint(
                fields=['branch'],
                condition=models.Q(is_managed=True),
                name='one_branch_manager_per_clinic',
            ),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} → {self.branch.name} ({'Active' if self.is_active else 'Inactive'})"

    @property
    def availability(self):
        """Return branch-specific availability dictionary."""
        return {
            'duty_days': self.duty_days or ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            'duty_start_time': self.duty_start_time.strftime('%H:%M') if self.duty_start_time else '08:00',
            'duty_end_time': self.duty_end_time.strftime('%H:%M') if self.duty_end_time else '17:00',
            'lunch_start_time': self.lunch_start_time.strftime('%H:%M') if self.lunch_start_time else '12:00',
            'lunch_end_time': self.lunch_end_time.strftime('%H:%M') if self.lunch_end_time else '13:00',
            'duty_schedule': self.duty_schedule,
        }


class UserRoleChangeLog(models.Model):
    """
    Immutable audit record for every role assignment change.

    Written whenever an admin adds or removes a role from a user.
    Stored separately to keep the audit trail even if the user is deleted.
    """
    ACTION_CHOICES = [
        ('add',    'Role Added'),
        ('remove', 'Role Removed'),
    ]

    target_user_id    = models.IntegerField(db_index=True)
    target_user_email = models.CharField(max_length=255)
    changed_by_id     = models.IntegerField(null=True, db_index=True)
    changed_by_email  = models.CharField(max_length=255, blank=True)
    action            = models.CharField(max_length=10, choices=ACTION_CHOICES)
    role              = models.CharField(max_length=20)
    roles_before      = models.JSONField(default=list)
    roles_after       = models.JSONField(default=list)
    timestamp         = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = 'user_role_change_log'
        ordering = ['-timestamp']

    def __str__(self):
        return (
            f"[{self.timestamp:%Y-%m-%d %H:%M}] "
            f"{self.action.upper()} {self.role} "
            f"for {self.target_user_email} by {self.changed_by_email}"
        )
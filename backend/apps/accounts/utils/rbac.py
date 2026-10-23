from rest_framework.exceptions import PermissionDenied

def get_assigned_branch_ids(user):
    """
    Clinics the user is assigned to: their ACTIVE assignment rows plus the clinics they manage.
    A deactivated assignment (the user no longer works at that clinic) grants nothing.
    """
    from django.db.models import Q
    return list(
        user.branch_accesses.filter(Q(is_active=True) | Q(is_managed=True)).values_list('branch_id', flat=True)
    )


def get_allowed_branches(user):
    """
    Returns a list of branch IDs the user is allowed to access.
    If the user is an OWNER, returns None (meaning access to all branches).
    Otherwise, evaluates UserBranchAccess and User.clinic_branch.
    """
    effective_roles = user.get_effective_roles()
    
    if 'OWNER' in effective_roles:
        return None
        
    branches = get_assigned_branch_ids(user)
    if not branches and user.clinic_branch_id:
        branches = [user.clinic_branch_id]
        
    return branches

def validate_branch_access(user, requested_branch_id=None):
    """
    Validates if the user can access the requested branch.
    If requested_branch_id is not provided, returns the list of allowed branches.
    Raises PermissionDenied if the user attempts to access an unauthorized branch.
    
    Returns: (list_of_allowed_branch_ids_or_None, bool_is_restricted)
    """
    effective_roles = user.get_effective_roles()
    
    if 'OWNER' in effective_roles:
        return None, False
        
    allowed_branches = get_allowed_branches(user)
    
    if requested_branch_id is not None:
        if requested_branch_id not in allowed_branches:
            raise PermissionDenied("You do not have permission to access this branch.")
            
    return allowed_branches, True


# ── Diary / Calendar branch access ────────────────────────────────────────────
# A Branch Manager's own branches (get_allowed_branches) plus, when the Owner has
# granted it, the extra branches in User.extra_diary_branches. The level comes
# from the permission group row 'diary_other_branches': view = read, edit = write.
# This is used for the Diary only: patients, invoices and reports keep using
# get_allowed_branches.

def get_extra_diary_branch_ids(user, write=False):
    """Extra branch IDs the user may open in the Diary (empty for the Owner and for non-Branch Managers)."""
    if 'OWNER' in user.get_effective_roles() or 'BRANCH_MANAGER' not in user.get_effective_roles():
        return []
    if not user.has_feature_permission('diary_other_branches', 'edit' if write else 'view'):
        return []
    return list(user.extra_diary_branches.filter(is_deleted=False).values_list('id', flat=True))


def get_diary_branch_ids(user, write=False):
    """
    Branch IDs whose Diary the user may read (write=False) or change (write=True).
    Returns None for the Owner (all branches).
    """
    allowed = get_allowed_branches(user)
    if allowed is None:
        return None
    return list(dict.fromkeys(list(allowed) + get_extra_diary_branch_ids(user, write)))


def validate_diary_branch(user, requested_branch_id=None, write=False):
    """
    Like validate_branch_access, but for the Diary: honours the extra branches.
    Returns (allowed_branch_ids_or_None, is_restricted). Raises PermissionDenied
    for a branch the user may not open (or, with write=True, may not change).
    """
    allowed = get_diary_branch_ids(user, write)
    if allowed is None:
        return None, False
    if requested_branch_id is not None and requested_branch_id not in allowed:
        raise PermissionDenied("You do not have permission to access this branch.")
    return allowed, True


# ── Branch Manager clinics (managed clinics) ──────────────────────────────────
# Rule: no clinic may have two Branch Managers. A Branch Manager may manage any number of clinics.
# "Managed" is UserBranchAccess.is_managed=True; practitioner / staff assignments are not management.
# The database enforces it (constraint one_branch_manager_per_clinic); this helper gives the clear message.

def find_manager_conflicts(branch_ids, exclude_user=None):
    """Managed rows of other (non-deleted) users on any of `branch_ids`."""
    from apps.accounts.models import UserBranchAccess
    qs = (
        UserBranchAccess.objects
        .filter(branch_id__in=list(branch_ids), is_managed=True, user__is_deleted=False)
        .select_related('user', 'branch')
    )
    if exclude_user is not None:
        qs = qs.exclude(user=exclude_user)
    return list(qs)


def validate_branches_free_for_manager(branch_ids, exclude_user=None):
    """
    Raise a DRF ValidationError when any clinic in `branch_ids` already has a Branch Manager
    (other than `exclude_user`). Shared by every path that can assign a Branch Manager.
    """
    from rest_framework.exceptions import ValidationError
    conflicts = find_manager_conflicts(branch_ids, exclude_user)
    if conflicts:
        first = conflicts[0]
        name = first.user.get_full_name() or first.user.email
        raise ValidationError({
            'branch_ids': f'Clinic "{first.branch.name}" already has a Branch Manager ({name}). '
                          f'A clinic can have only one Branch Manager.'
        })

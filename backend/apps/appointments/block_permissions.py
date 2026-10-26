"""
Who may block whose schedule (Block Appointments).

  Owner                    any practitioner of the clinic group
  Branch Manager           practitioners of the clinics whose Diary they may change: the clinics they manage
                           plus any other branch the Owner gave them Diary Edit on (plus themselves)
  Frontdesk / Staff        practitioners of their own clinics when their group has Diary: Edit (plus themselves)
  Practitioner (only)      themselves

A block "affects" a practitioner when it is scoped to them or when they are in its selection; see
`BlockAppointment.affecting`.
"""
from django.db.models import Q

from apps.accounts.utils.rbac import get_assigned_branch_ids, get_diary_branch_ids
from apps.clinics.models import Practitioner


def blockable_practitioner_ids(actor):
    """Ids of the practitioners `actor` may block; None means every practitioner (the Owner)."""
    if actor.is_owner:
        return None
    ids = set()
    own = getattr(actor, 'practitioner_profile', None)
    if own is not None and not own.is_deleted:
        ids.add(own.id)

    roles = set(actor.get_effective_roles())
    branches = None
    if actor.is_branch_manager:
        branches = set(get_diary_branch_ids(actor, write=True) or [])   # managed + Diary-Edit branches
    elif 'STAFF' in roles and actor.can_edit('diary'):
        branches = set(get_assigned_branch_ids(actor))
        if actor.clinic_branch_id:
            branches.add(actor.clinic_branch_id)
    if branches and actor.clinic_id:
        ids.update(
            Practitioner.objects.filter(is_deleted=False, user__clinic_id=actor.clinic_id).filter(
                Q(user__clinic_branch_id__in=branches)
                | Q(user__branch_accesses__branch_id__in=branches, user__branch_accesses__is_active=True)
            ).values_list('id', flat=True)
        )
    return ids

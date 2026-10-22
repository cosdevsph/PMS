"""
Branch Managers manage clinics (2026-10-22).

Adds UserBranchAccess.is_managed and backfills it: every existing branch-access row of a
non-deleted Branch Manager came from the manager form, so it becomes a managed clinic. Practitioner
and staff assignment rows stay unmanaged.

Rule: no clinic may have two Branch Managers. If existing data already breaks it, this migration
STOPS (nothing is changed; the whole migration is rolled back) and lists each clinic with its
managers, so the owner can decide who keeps it. Fix it by removing the extra Branch Manager's
branch assignment (Setup > Staff) or by changing one manager's role, then migrate again.

The constraint that enforces the rule is added in 0027 (data changes and constraint DDL are kept in
separate migrations on purpose).
"""
from django.db import migrations, models

BRANCH_MANAGER_CODES = ('BRANCH_MANAGER', 'ADMIN_ASSISTANT')   # ADMIN_ASSISTANT only if 0025 was skipped by hand


def backfill_managed(apps, schema_editor):
    Row = apps.get_model('accounts', 'UserBranchAccess')
    managers_by_clinic = {}   # clinic id -> {'name': str, 'users': [labels]}
    to_mark = []
    for row in Row._base_manager.filter(user__is_deleted=False).select_related('user', 'branch').iterator():
        roles = row.user.roles if isinstance(row.user.roles, list) else []
        if not (set(roles) & set(BRANCH_MANAGER_CODES) or row.user.role in BRANCH_MANAGER_CODES):
            continue
        to_mark.append(row.pk)
        entry = managers_by_clinic.setdefault(row.branch_id, {'name': row.branch.name, 'users': []})
        entry['users'].append(f'{row.user.email} (user {row.user_id})')

    conflicts = {cid: e for cid, e in managers_by_clinic.items() if len(e['users']) > 1}
    if conflicts:
        lines = [
            f'  - clinic "{e["name"]}" (id {cid}): {", ".join(e["users"])}'
            for cid, e in sorted(conflicts.items())
        ]
        raise RuntimeError(
            'Cannot enforce "one Branch Manager per clinic": these clinics already have more than one:\n'
            + '\n'.join(lines)
            + '\nRemove the extra Branch Manager from each clinic (Setup > Staff) or change a role, '
              'then run migrate again. Nothing was changed.'
        )
    Row._base_manager.filter(pk__in=to_mark).update(is_managed=True)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0025_rename_roles_owner_branch_manager'),
        ('clinics', '0023_clinicconsentform_created_by_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userbranchaccess',
            name='is_managed',
            field=models.BooleanField(default=False, help_text='True when this user is the Branch Manager of this clinic. A clinic can have at most one managed row (database constraint). Practitioner / staff assignments stay False.'),
        ),
        migrations.RunPython(backfill_managed, migrations.RunPython.noop),
    ]

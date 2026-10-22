"""
Rename the roles: ADMIN -> OWNER and ADMIN_ASSISTANT -> BRANCH_MANAGER (2026-10-22).

Converts stored data so the whole system uses one vocabulary:
  * users.role and users.roles
  * permission_groups.role_template (ADMIN_ASSISTANT and MANAGER are merged into BRANCH_MANAGER)
    and the seeded group name "Admin Assistant" -> "Branch Manager"
  * user_role_change_log (role, roles_before, roles_after)

The mapping tables are written out here on purpose (not imported from app code) so this migration
keeps working unchanged if the app code changes later. Custom permission-group names are not touched.

Reverse: maps OWNER -> ADMIN and BRANCH_MANAGER -> ADMIN_ASSISTANT. The merge of the MANAGER template
into BRANCH_MANAGER cannot be split again; reversed groups come back as ADMIN_ASSISTANT.
"""

from django.db import migrations, models


BATCH = 500

ROLE_FORWARD = {'ADMIN': 'OWNER', 'ADMIN_ASSISTANT': 'BRANCH_MANAGER'}
ROLE_BACKWARD = {'OWNER': 'ADMIN', 'BRANCH_MANAGER': 'ADMIN_ASSISTANT'}
TEMPLATE_FORWARD = {'ADMIN_ASSISTANT': 'BRANCH_MANAGER', 'MANAGER': 'BRANCH_MANAGER'}
TEMPLATE_BACKWARD = {'BRANCH_MANAGER': 'ADMIN_ASSISTANT'}


def _map_list(values, mapping):
    """Map a roles list, keep order, drop duplicates. Non-lists are returned unchanged."""
    if not isinstance(values, list):
        return values
    seen, out = set(), []
    for value in values:
        value = mapping.get(value, value)
        if value not in seen:
            seen.add(value)
            out.append(value)
    return out


def _flush(manager, rows, fields):
    if rows:
        manager.bulk_update(rows, fields, batch_size=BATCH)


def _convert_users(apps, role_map):
    User = apps.get_model('accounts', 'User')
    pending = []
    for user in User._base_manager.all().only('id', 'role', 'roles').iterator(chunk_size=BATCH):
        new_role = role_map.get(user.role, user.role)
        new_roles = _map_list(user.roles, role_map)
        if new_role != user.role or new_roles != user.roles:
            user.role, user.roles = new_role, new_roles
            pending.append(user)
        if len(pending) >= BATCH:
            _flush(User._base_manager, pending, ['role', 'roles'])
            pending = []
    _flush(User._base_manager, pending, ['role', 'roles'])


def _convert_change_log(apps, role_map):
    Log = apps.get_model('accounts', 'UserRoleChangeLog')
    pending = []
    for row in Log._base_manager.all().iterator(chunk_size=BATCH):
        new_role = role_map.get(row.role, row.role)
        new_before = _map_list(row.roles_before, role_map)
        new_after = _map_list(row.roles_after, role_map)
        if (new_role, new_before, new_after) != (row.role, row.roles_before, row.roles_after):
            row.role, row.roles_before, row.roles_after = new_role, new_before, new_after
            pending.append(row)
        if len(pending) >= BATCH:
            _flush(Log._base_manager, pending, ['role', 'roles_before', 'roles_after'])
            pending = []
    _flush(Log._base_manager, pending, ['role', 'roles_before', 'roles_after'])


def _unique_name(Group, clinic_id, wanted, exclude_pk):
    """`wanted`, or `wanted (default)` / `wanted (default 2)`... when the clinic already uses the name."""
    taken = set(Group._base_manager.filter(clinic_id=clinic_id).exclude(pk=exclude_pk).values_list('name', flat=True))
    if wanted not in taken:
        return wanted
    candidate = f'{wanted} (default)'
    n = 2
    while candidate in taken:
        candidate = f'{wanted} (default {n})'
        n += 1
    return candidate


def _convert_groups(apps, template_map, old_name, new_name, old_desc, new_desc):
    Group = apps.get_model('accounts', 'PermissionGroup')
    for group in Group._base_manager.all().iterator(chunk_size=BATCH):
        fields = []
        new_template = template_map.get(group.role_template, group.role_template)
        if new_template != group.role_template:
            group.role_template = new_template
            fields.append('role_template')
        # Only the seeded system group is renamed; names people chose themselves are left alone.
        if group.is_system_template and group.name == old_name:
            group.name = _unique_name(Group, group.clinic_id, new_name, group.pk)
            fields.append('name')
            if group.description == old_desc:
                group.description = new_desc
                fields.append('description')
        if fields:
            group.save(update_fields=fields)


def rename_roles_forward(apps, schema_editor):
    _convert_users(apps, ROLE_FORWARD)
    _convert_change_log(apps, ROLE_FORWARD)
    _convert_groups(
        apps, TEMPLATE_FORWARD,
        'Admin Assistant', 'Branch Manager',
        'Default Admin Assistant permission group.', 'Default Branch Manager permission group.',
    )


def rename_roles_backward(apps, schema_editor):
    _convert_users(apps, ROLE_BACKWARD)
    _convert_change_log(apps, ROLE_BACKWARD)
    _convert_groups(
        apps, TEMPLATE_BACKWARD,
        'Branch Manager', 'Admin Assistant',
        'Default Branch Manager permission group.', 'Default Admin Assistant permission group.',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0024_user_extra_diary_branches'),
        ('clinics', '0023_clinicconsentform_created_by_and_more'),
    ]

    operations = [
        # ── schema (choices / help text only; no column changes) ──
        migrations.AlterField(
            model_name='permissiongroup',
            name='role_template',
            field=models.CharField(choices=[('OWNER', 'Owner'), ('BRANCH_MANAGER', 'Branch Manager'), ('FRONTDESK', 'Frontdesk'), ('PRACTITIONER', 'Practitioner'), ('FINANCE', 'Finance'), ('READ_ONLY', 'Read-Only'), ('CUSTOM', 'Custom')], default='CUSTOM', help_text='Starting template used to seed default permissions.', max_length=20),
        ),
        migrations.AlterField(
            model_name='user',
            name='extra_diary_branches',
            field=models.ManyToManyField(blank=True, help_text='Branches whose Diary this Branch Manager may open in addition to their own. The level (view/edit) comes from the permission group.', related_name='extra_diary_users', to='clinics.clinic'),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('OWNER', 'Owner'), ('BRANCH_MANAGER', 'Branch Manager'), ('PRACTITIONER', 'Practitioner'), ('STAFF', 'Staff'), ('FINANCE', 'Finance'), ('READ_ONLY', 'Read-Only')], default='STAFF', max_length=20),
        ),
        # ── data ──
        migrations.RunPython(rename_roles_forward, rename_roles_backward),
    ]

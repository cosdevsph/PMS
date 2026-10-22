"""
Rename the stored role snapshot on support tickets: ADMIN -> OWNER, ADMIN_ASSISTANT -> BRANCH_MANAGER
(2026-10-22). The mapping is written out here on purpose so the migration does not depend on app code.
Reverse maps the codes back.
"""
from django.db import migrations

FORWARD = {'ADMIN': 'OWNER', 'ADMIN_ASSISTANT': 'BRANCH_MANAGER'}
BACKWARD = {'OWNER': 'ADMIN', 'BRANCH_MANAGER': 'ADMIN_ASSISTANT'}


def _convert(apps, mapping):
    Feedback = apps.get_model('support', 'UserFeedback')
    for old, new in mapping.items():
        Feedback._base_manager.filter(user_role=old).update(user_role=new)


def forward(apps, schema_editor):
    _convert(apps, FORWARD)


def backward(apps, schema_editor):
    _convert(apps, BACKWARD)


class Migration(migrations.Migration):

    dependencies = [
        ('support', '0003_remove_userfeedback_resolution_message_and_more'),
        ('accounts', '0025_rename_roles_owner_branch_manager'),
    ]

    operations = [
        migrations.RunPython(forward, backward),
    ]

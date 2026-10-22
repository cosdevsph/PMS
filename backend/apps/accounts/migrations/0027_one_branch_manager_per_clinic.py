"""Database rule: at most one managed row (Branch Manager) per clinic. See 0026 for the backfill."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0026_user_branch_access_is_managed'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='userbranchaccess',
            constraint=models.UniqueConstraint(
                condition=models.Q(('is_managed', True)),
                fields=('branch',),
                name='one_branch_manager_per_clinic',
            ),
        ),
    ]

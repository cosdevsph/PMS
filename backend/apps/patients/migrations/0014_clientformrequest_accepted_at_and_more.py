from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0013_rename_client_form_patient_completed_idx_client_form_patient_3591bd_idx'),
    ]

    operations = [
        migrations.AddField(
            model_name='clientformrequest',
            name='accepted_terms',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='clientformrequest',
            name='accepted_privacy',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='clientformrequest',
            name='accepted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

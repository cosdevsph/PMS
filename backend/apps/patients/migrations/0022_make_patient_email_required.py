"""
Migration: make Patient.email required (remove blank=True).

All existing patient records should already have emails populated (or this
migration can be run after a backfill). The serializer enforces the required
constraint at the API level; this migration aligns the model definition.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0021_add_payer_alert_notes_to_patientcase'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patient',
            name='email',
            field=models.EmailField(
                max_length=254,
                verbose_name='email address',
            ),
        ),
    ]

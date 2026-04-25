from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0009_patientconsent'),
    ]

    operations = [
        # Make portal_link nullable (admin-created consents have no portal link)
        migrations.AlterField(
            model_name='patientconsent',
            name='portal_link',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='consents',
                to='patients.portallink',
            ),
        ),
        # Add type field
        migrations.AddField(
            model_name='patientconsent',
            name='type',
            field=models.CharField(
                choices=[('CONSENT_FORM', 'Data Privacy Consent Form')],
                default='CONSENT_FORM',
                max_length=50,
            ),
        ),
    ]

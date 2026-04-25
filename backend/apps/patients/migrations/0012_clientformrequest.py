import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0011_merge_0010'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ClientFormRequest',
            fields=[
                ('id',           models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at',   models.DateTimeField(auto_now_add=True)),
                ('updated_at',   models.DateTimeField(auto_now=True)),
                ('token',        models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)),
                ('expires_at',   models.DateTimeField()),
                ('is_completed', models.BooleanField(default=False, db_index=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('patient',      models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='client_form_requests', to='patients.patient')),
                ('sent_by',      models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sent_client_form_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'client_form_requests',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='clientformrequest',
            index=models.Index(fields=['patient', 'is_completed'], name='client_form_patient_completed_idx'),
        ),
    ]

"""
Booking source 'admin' becomes 'owner' (2026-10-22 role rename). Reverse maps it back.
"""

from django.db import migrations, models


def forward(apps, schema_editor):
    apps.get_model('appointments', 'Appointment')._base_manager.filter(booking_source='admin').update(booking_source='owner')


def backward(apps, schema_editor):
    apps.get_model('appointments', 'Appointment')._base_manager.filter(booking_source='owner').update(booking_source='admin')


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0022_appointment_patient_case'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appointment',
            name='booking_source',
            field=models.CharField(blank=True, choices=[('portal', 'Patient Portal'), ('staff', 'Staff'), ('owner', 'Owner'), ('practitioner', 'Practitioner')], default='staff', help_text='How this appointment was originally booked', max_length=20),
        ),
        migrations.RunPython(forward, backward),
    ]

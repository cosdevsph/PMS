# Generated data migration to backfill existing practitioner branch access records

from django.db import migrations


def backfill_practitioner_schedules(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    UserBranchAccess = apps.get_model('accounts', 'UserBranchAccess')
    Practitioner = apps.get_model('clinics', 'Practitioner')

    for p in Practitioner.objects.select_related('user').all():
        user = p.user
        if not user:
            continue

        branch = user.clinic_branch or p.clinic
        if not branch:
            continue

        uba, created = UserBranchAccess.objects.get_or_create(
            user=user,
            branch=branch,
            defaults={
                'duty_days': p.duty_days or ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                'duty_start_time': p.duty_start_time or '08:00',
                'duty_end_time': p.duty_end_time or '17:00',
                'lunch_start_time': p.lunch_start_time or '12:00',
                'lunch_end_time': p.lunch_end_time or '13:00',
                'duty_schedule': p.duty_schedule,
                'is_active': True,
            }
        )
        if not created:
            # If the row already existed (e.g. from previous manager access), populate missing schedule fields
            updated_fields = []
            if not uba.duty_days and p.duty_days:
                uba.duty_days = p.duty_days
                updated_fields.append('duty_days')
            if not uba.duty_schedule and p.duty_schedule:
                uba.duty_schedule = p.duty_schedule
                updated_fields.append('duty_schedule')
            if updated_fields:
                uba.save(update_fields=updated_fields)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0022_add_schedule_fields_to_user_branch_access'),
        ('clinics', '0023_clinicconsentform_created_by_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_practitioner_schedules, noop_reverse),
    ]

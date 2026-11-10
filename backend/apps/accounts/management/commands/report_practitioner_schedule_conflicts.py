"""
Read-only report of practitioner working-hour problems across clinics. It never writes.

    python manage.py report_practitioner_schedule_conflicts

Lists:
  1. practitioners whose ACTIVE clinic rows overlap each other (should be none since 2026-10-23);
  2. practitioners whose combined profile schedule differs from their active clinic rows;
  3. practitioner accounts with the same first and last name whose combined hours overlap (possibly
     one person with two logins, which the overlap check cannot see);
  4. how many rows the legacy PractitionerSchedule table still holds.

Fix anything it finds by hand in Setup -> Permissions (Clinics for Practitioners) or the Staff form;
each save re-syncs the profile. Accounts are never merged automatically.
"""
from django.core.management.base import BaseCommand
from django.db import connection, transaction

from apps.accounts.models import User
from apps.accounts.utils.schedule import (
    clinic_names, conflict_error, merge_schedules, schedule_from_accesses,
)
from apps.appointments.models import PractitionerSchedule
from apps.clinics.models import Practitioner


def _normalised(schedule):
    return sorted(
        (day, str(b.get('start'))[:5], str(b.get('end'))[:5], int(b.get('branch_id') or 0))
        for day, blocks in (schedule or {}).items() for b in (blocks or [])
    )


class Command(BaseCommand):
    help = 'Report overlapping or inconsistent practitioner working hours across clinics (read-only).'

    def handle(self, *args, **options):
        with transaction.atomic():
            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute('SET TRANSACTION READ ONLY')
            self._report()

    def _report(self):
        out = self.stdout.write
        users = list(User.objects.filter(roles__contains=['PRACTITIONER'], is_deleted=False))
        out(f'Practitioner accounts: {len(users)}')

        out('\n1. Overlapping hours across active clinic rows')
        found = 0
        for user in users:
            combined = schedule_from_accesses(user)
            clash = conflict_error(combined, clinic_names(combined))
            if clash:
                found += 1
                out(f'  user {user.id} ({user.get_full_name()}): {clash["detail"]}')
        out(f'  -> {found} found')

        out('\n2. Combined profile schedule differs from the active clinic rows')
        drift = 0
        for profile in Practitioner.objects.filter(is_deleted=False).select_related('user'):
            rows = _normalised(schedule_from_accesses(profile.user))
            stored = _normalised(profile.duty_schedule if isinstance(profile.duty_schedule, dict) else {})
            if rows != stored:
                drift += 1
                out(f'  user {profile.user_id}: {"profile empty" if not stored else "rows empty" if not rows else "differs"}')
        out(f'  -> {drift} found (re-saving the practitioner in Permissions or Staff syncs it)')

        out('\n3. Same-name accounts whose hours would overlap if they were one person')
        by_name = {}
        for user in users:
            by_name.setdefault((user.first_name.strip().lower(), user.last_name.strip().lower()), []).append(user)
        pairs = 0
        for accounts in by_name.values():
            if len(accounts) < 2:
                continue
            combined = merge_schedules(*[schedule_from_accesses(u) for u in accounts])
            clash = conflict_error(combined, clinic_names(combined))
            if clash:
                pairs += 1
                out(f'  users {[u.id for u in accounts]} ({accounts[0].get_full_name()}): {clash["detail"]}')
        out(f'  -> {pairs} found (the owner decides whether these are one person; no merge tool exists)')

        out(f'\n4. Legacy PractitionerSchedule rows: {PractitionerSchedule.objects.count()}')

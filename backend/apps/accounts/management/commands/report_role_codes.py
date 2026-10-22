"""
Read-only report of the role codes stored in the database.

Run it before and after the Owner / Branch Manager rename (2026-10-22) to check the conversion:

    python manage.py report_role_codes            # print the counts
    python manage.py report_role_codes --strict   # also exit with an error if any legacy code remains
"""
from collections import Counter

from django.core.management.base import BaseCommand, CommandError

LEGACY_ROLES = {'ADMIN', 'ADMIN_ASSISTANT'}
LEGACY_TEMPLATES = {'MANAGER', 'ADMIN_ASSISTANT'}
LEGACY_NAMES = {'Admin Assistant'}


class Command(BaseCommand):
    help = 'Count the role codes stored in the database and flag legacy ones (read-only).'

    def add_arguments(self, parser):
        parser.add_argument('--strict', action='store_true',
                            help='Exit with an error when any legacy code remains.')

    def handle(self, *args, **options):
        from apps.accounts.models import PermissionGroup, User, UserRoleChangeLog
        from apps.appointments.models import Appointment
        from apps.support.models import UserFeedback

        legacy_found = 0

        def section(title, counter, legacy):
            nonlocal legacy_found
            self.stdout.write(self.style.MIGRATE_HEADING(title))
            if not counter:
                self.stdout.write('  (none)')
            for value, count in sorted(counter.items(), key=lambda kv: str(kv[0])):
                bad = value in legacy
                legacy_found += count if bad else 0
                line = f'  {value!s:<22} {count}'
                self.stdout.write(self.style.ERROR(line + '   <-- legacy') if bad else line)

        users = User._base_manager.all()
        section('users.role', Counter(users.values_list('role', flat=True)), LEGACY_ROLES)
        roles_counter = Counter()
        for roles in users.values_list('roles', flat=True):
            for role in (roles if isinstance(roles, list) else []):
                roles_counter[role] += 1
        section('users.roles (each role held)', roles_counter, LEGACY_ROLES)

        groups = PermissionGroup._base_manager.all()
        section('permission_groups.role_template', Counter(groups.values_list('role_template', flat=True)), LEGACY_TEMPLATES)
        system_names = Counter(groups.filter(is_system_template=True).values_list('name', flat=True))
        section('permission_groups (system) names', system_names, LEGACY_NAMES)

        log_roles = Counter(UserRoleChangeLog._base_manager.values_list('role', flat=True))
        section('user_role_change_log.role', log_roles, LEGACY_ROLES)
        log_lists = Counter()
        for before, after in UserRoleChangeLog._base_manager.values_list('roles_before', 'roles_after'):
            for lst in (before, after):
                for role in (lst if isinstance(lst, list) else []):
                    log_lists[role] += 1
        section('user_role_change_log.roles_before/after', log_lists, LEGACY_ROLES)

        section('support feedback.user_role', Counter(UserFeedback._base_manager.values_list('user_role', flat=True)), LEGACY_ROLES)
        sources = Counter(Appointment._base_manager.values_list('booking_source', flat=True))
        section('appointments.booking_source', sources, {'admin'})

        self.stdout.write('')
        if legacy_found:
            self.stdout.write(self.style.ERROR(f'{legacy_found} legacy value(s) remain.'))
            if options['strict']:
                raise CommandError(f'{legacy_found} legacy role value(s) remain.')
        else:
            self.stdout.write(self.style.SUCCESS('No legacy role codes remain.'))

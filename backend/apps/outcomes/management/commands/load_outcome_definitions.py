from django.core.management.base import BaseCommand, CommandError

from apps.outcomes.services import load_library


class Command(BaseCommand):
    help = 'Validate and publish the outcome-measure definitions in apps/outcomes/library/. Safe to run again.'

    def handle(self, *args, **options):
        report = load_library()
        for name, outcome in report:
            self.stdout.write(f'{name}: {outcome}')
        if any(outcome.startswith('REJECTED') for _, outcome in report):
            raise CommandError('Some definitions were rejected.')

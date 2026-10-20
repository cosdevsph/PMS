from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import User
from apps.clinics.models import Clinic
from apps.patients.models import PatientCase
from apps.patients.services import package_conversion as conv


class Command(BaseCommand):
    help = (
        'Convert legacy package Cases (session_source=PACKAGE) into Private Package Sessions. '
        'DRY RUN by default: nothing is written unless --apply is given. Review the dry-run list first. '
        'Cases, appointments, session logs and invoices are never modified.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Write the conversion. Without it, only report.')
        parser.add_argument('--clinic-id', type=int, help='Only Cases of patients in this clinic group (main clinic or branch id).')
        parser.add_argument('--case-id', type=int, action='append', help='Only this Case id (repeatable).')
        parser.add_argument('--user-email', help='Recorded as the creator of the converted packages (optional).')
        parser.add_argument(
            '--include-counter-mismatch', action='store_true',
            help="Also convert Cases whose stored counter differs from their session log (the log is used).",
        )

    def handle(self, *args, **opts):
        apply = opts['apply']
        user = None
        if opts['user_email']:
            user = User.objects.filter(email__iexact=opts['user_email']).first()
            if user is None:
                raise CommandError(f"No user with email {opts['user_email']}.")

        cases = PatientCase.objects.filter(session_source='PACKAGE').select_related(
            'patient', 'patient__clinic', 'patient__home_branch', 'package_invoice',
        ).order_by('id')
        if opts['clinic_id']:
            clinic = Clinic.objects.filter(pk=opts['clinic_id']).first()
            if clinic is None:
                raise CommandError(f"No clinic with id {opts['clinic_id']}.")
            cases = cases.filter(patient__clinic_id__in=clinic.main_clinic.get_all_branches().values_list('id', flat=True))
        if opts['case_id']:
            cases = cases.filter(id__in=opts['case_id'])

        self.stdout.write(self.style.WARNING(
            'APPLYING the conversion.' if apply else 'DRY RUN: nothing will be written. Re-run with --apply after review.'
        ))

        ready = skipped = converted = 0
        skip_counts = {}
        for case in cases:
            plan = conv.plan_conversion(case, include_counter_mismatch=opts['include_counter_mismatch'])
            label = f'Case #{case.id} "{case.title}" (patient #{case.patient_id})'
            if plan.status == conv.SKIPPED:
                skipped += 1
                for code in plan.reasons:
                    skip_counts[code] = skip_counts.get(code, 0) + 1
                reason = '; '.join(conv.REASON_TEXT[c] for c in plan.reasons)
                show_numbers = bool(set(plan.reasons) & {conv.COUNTER_MISMATCH, conv.USED_EXCEEDS_ALLOWANCE})
                extra = f' {plan.details}' if show_numbers and plan.details else ''
                self.stdout.write(f'  SKIP  {label}: {reason}.{extra}')
                continue

            ready += 1
            items = ', '.join(f'{s.name} x{q}' for s, q in plan.items.items())
            self.stdout.write(self.style.SUCCESS(
                f'  READY {label}: {plan.used}/{plan.total} used, {plan.remaining} left, price {plan.price}, items: {items}'
            ))
            for warning in plan.warnings:
                self.stdout.write(f'          note: {warning}')
            if apply:
                package = conv.apply_plan(plan, user=user)
                converted += 1
                self.stdout.write(f'          -> created Private Package Session #{package.id}')

        self.stdout.write('')
        self.stdout.write(f'Package Cases examined: {ready + skipped}')
        self.stdout.write(f'Ready to convert: {ready}' + (f' (converted: {converted})' if apply else ''))
        self.stdout.write(f'Skipped: {skipped}' + (' ' + str(skip_counts) if skip_counts else ''))
        if not apply and ready:
            self.stdout.write(self.style.WARNING('Nothing was written. Review the list, then run again with --apply.'))

from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.subscriptions.models import PayMongoPaymentLog, Subscription


class Command(BaseCommand):
    help = (
        'Give existing PAID subscriptions a 12-month term (term_start / term_end). '
        'DRY RUN by default: nothing is written unless --apply is given. '
        'term_start is the first recorded PayMongo payment (else the subscription start date). '
        'If that term already ended, the term is rolled forward in 12-month steps, because a '
        'subscription that keeps being paid continues into a new term.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Write the terms. Without it, only report.')

    def handle(self, *args, **opts):
        apply = opts['apply']
        now = timezone.now()
        self.stdout.write(self.style.WARNING(
            'APPLYING.' if apply else 'DRY RUN: nothing will be written. Re-run with --apply after review.'
        ))

        subs = Subscription.objects.filter(is_trial=False, term_end__isnull=True).select_related('clinic').order_by('id')
        count = 0
        for sub in subs:
            first_payment = (
                PayMongoPaymentLog.objects.filter(subscription=sub).order_by('processed_at').first()
            )
            start = first_payment.processed_at if first_payment else sub.start_date
            months = sub.commitment_months or 12
            end = start + relativedelta(months=months)
            rolled = 0
            while end <= now:
                start, end = end, end + relativedelta(months=months)
                rolled += 1

            name = sub.clinic.name if sub.clinic else f'user {sub.user_id}'
            source = 'first payment' if first_payment else 'subscription start date'
            note = f', rolled forward {rolled} term(s)' if rolled else ''
            self.stdout.write(
                f'  #{sub.id} {name} [{sub.plan}/{sub.billing_cycle}/{sub.status}]: '
                f'term {start:%Y-%m-%d} to {end:%Y-%m-%d} (from {source}{note})'
            )
            if apply:
                sub.term_start, sub.term_end = start, end
                sub.save(update_fields=['term_start', 'term_end', 'updated_at'])
            count += 1

        self.stdout.write('')
        self.stdout.write(f'Paid subscriptions without a term: {count}' + (' (updated)' if apply else ''))
        if not apply and count:
            self.stdout.write(self.style.WARNING('Nothing was written. Review the list, then run again with --apply.'))

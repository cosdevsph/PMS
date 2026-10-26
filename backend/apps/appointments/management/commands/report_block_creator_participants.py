"""
Read-only report: Block Appointments created before the "Include me" change may block their creator.

Before 2026-10-26 the creator was added to every "Selected Users" block, and the block's practitioner was
whatever column the creator clicked (often their own). Those rows still block the creator. This command only
COUNTS them; it changes nothing. Whether to remove the creator from a given block depends on what the creator
meant, so correct blocks one by one (edit the block and untick "Include me") or decide a rule with the owner first.
"""
from collections import Counter

from django.core.management.base import BaseCommand

from apps.appointments.models import BlockAppointment


class Command(BaseCommand):
    help = "Count active block appointments that block their own creator (read-only)."

    def handle(self, *args, **options):
        blocks = BlockAppointment.objects.filter(is_deleted=False).select_related('clinic', 'created_by', 'practitioner__user')
        by_clinic = Counter()
        total = creator_selected = creator_column = both = 0
        for block in blocks:
            total += 1
            in_list = (block.visibility_type == 'SELECTED' and block.created_by_id is not None
                       and block.visible_to_users.filter(pk=block.created_by_id).exists())
            own_column = bool(block.practitioner_id and block.created_by_id and block.practitioner.user_id == block.created_by_id)
            if in_list:
                creator_selected += 1
            if own_column:
                creator_column += 1
            if in_list or own_column:
                by_clinic[block.clinic.name] += 1
            if in_list and own_column:
                both += 1

        self.stdout.write(f'Active block appointments: {total}')
        self.stdout.write(f'  creator is in the selected-users list (auto-added before the change): {creator_selected}')
        self.stdout.write(f'  block is scoped to the creator\'s own practitioner column:             {creator_column}')
        self.stdout.write(f'  both:                                                                  {both}')
        self.stdout.write(f'Blocks that block their creator (either): {sum(by_clinic.values())}')
        for clinic, n in by_clinic.most_common():
            self.stdout.write(f'  {clinic}: {n}')
        self.stdout.write('Nothing was changed.')

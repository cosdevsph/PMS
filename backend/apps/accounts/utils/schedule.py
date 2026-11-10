"""
Working-hours helpers for practitioners who work at more than one clinic.

A practitioner's combined schedule is `{day: [{start, end, branch_id}, ...]}`. Each clinic they work
at also has a `UserBranchAccess` row holding that clinic's slice of it (`{day: [{start, end}]}`).
"""

WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']


def format_time_12h(time_str):
    """'HH:MM' -> '9:00 AM'. Anything unparsable is returned as given."""
    try:
        parts = str(time_str).strip().split(':')
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        return f"{12 if h % 12 == 0 else h % 12}:{m:02d} {'PM' if h >= 12 else 'AM'}"
    except Exception:
        return str(time_str)


def _hhmm(value):
    if hasattr(value, 'strftime'):
        return value.strftime('%H:%M')
    return str(value)[:5] if value else None


def branch_slice(access):
    """The `{day: [{start, end}]}` slice stored for one clinic's access row."""
    if isinstance(access.duty_schedule, dict) and access.duty_schedule:
        return access.duty_schedule
    start, end = _hhmm(access.duty_start_time), _hhmm(access.duty_end_time)
    if not (start and end):
        return {}
    return {day: [{'start': start, 'end': end}] for day in (access.duty_days or [])}


def schedule_of_branch(branch_id, duty_days, start, end):
    """Combined-schedule form of the single-clinic fields used by the assign endpoints."""
    return {
        day: [{'start': _hhmm(start), 'end': _hhmm(end), 'branch_id': int(branch_id)}]
        for day in (duty_days or [])
    }


def schedule_from_accesses(user, exclude_branch_id=None):
    """
    The combined schedule built from the user's ACTIVE clinic rows, optionally leaving one clinic
    out (the one that is about to change).
    """
    combined = {}
    accesses = user.branch_accesses.filter(is_active=True)
    if exclude_branch_id is not None:
        accesses = accesses.exclude(branch_id=int(exclude_branch_id))
    for access in accesses:
        for day, blocks in branch_slice(access).items():
            for block in blocks or []:
                combined.setdefault(day, []).append({
                    'start': block.get('start'),
                    'end': block.get('end'),
                    'branch_id': access.branch_id,
                })
    return combined


def merge_schedules(*schedules):
    merged = {}
    for schedule in schedules:
        for day, blocks in (schedule or {}).items():
            merged.setdefault(day, []).extend(blocks or [])
    return merged


def _sorted_blocks(schedule, day):
    """The day's blocks with `HH:MM` start / end (so '12:00:00' and '12:00' compare equal), earliest first."""
    out = []
    for block in (schedule or {}).get(day) or []:
        start, end = _hhmm(block.get('start')), _hhmm(block.get('end'))
        if start and end:
            out.append({**block, 'start': start, 'end': end})
    return sorted(out, key=lambda b: b['start'])


def find_overlaps(schedule):
    """
    Every pair of blocks that overlap on one day, as `[(day, earlier, later), ...]` in week order.
    Blocks that merely touch (one ends when the next starts) do not overlap.
    """
    found = []
    for day in WEEKDAYS:
        blocks = _sorted_blocks(schedule, day)
        for i, first in enumerate(blocks):
            for second in blocks[i + 1:]:
                if second['start'] < first['end']:
                    found.append((day, first, second))
    return found


def find_overlap(schedule):
    """First pair from `find_overlaps`, or None."""
    found = find_overlaps(schedule)
    return found[0] if found else None


def schedule_conflicts(overlaps, branch_name_of=lambda branch_id: None):
    """Structured form of `find_overlaps` for the API (`schedule_conflicts` in a 400 response)."""
    def name(block):
        return branch_name_of(block.get('branch_id')) if block.get('branch_id') else None

    return [
        {
            'day': day,
            'branch_id': first.get('branch_id'), 'branch_name': name(first),
            'start': first['start'], 'end': first['end'],
            'other_branch_id': second.get('branch_id'), 'other_branch_name': name(second),
            'other_start': second['start'], 'other_end': second['end'],
        }
        for day, first, second in overlaps
    ]


def conflicts_message(conflicts):
    """
    The user-facing sentence for `schedule_conflicts` output. Days that clash in the same way are
    grouped: "Mon, Wed, Fri: 8:00 AM–5:00 PM at Branch A overlaps 8:00 AM–5:00 PM at Branch B."
    """
    groups = {}
    for c in conflicts:
        key = (c['branch_name'], c['start'], c['end'], c['other_branch_name'], c['other_start'], c['other_end'])
        groups.setdefault(key, []).append(c['day'])

    def part(name, start, end):
        return f"{format_time_12h(start)}–{format_time_12h(end)}" + (f" at {name}" if name else '')

    lines = [
        f"{', '.join(days)}: {part(a, s1, e1)} overlaps {part(b, s2, e2)}."
        for (a, s1, e1, b, s2, e2), days in groups.items()
    ]
    return (
        'Schedule conflict. ' + ' '.join(lines)
        + ' A practitioner cannot work in two places simultaneously. Choose different days or hours that do not overlap.'
    )


def conflict_error(schedule, names):
    """`{'detail': message, 'schedule_conflicts': [...]}` for the overlaps in `schedule`, or None."""
    overlaps = find_overlaps(schedule)
    if not overlaps:
        return None
    conflicts = schedule_conflicts(overlaps, lambda branch_id: names.get(int(branch_id)))
    return {'detail': conflicts_message(conflicts), 'schedule_conflicts': conflicts}


def clinic_names(schedule):
    """`{clinic id: name}` for the clinics that appear in a combined schedule."""
    from apps.clinics.models import Clinic

    ids = {int(b['branch_id']) for blocks in (schedule or {}).values() for b in blocks or [] if b.get('branch_id')}
    return dict(Clinic.objects.filter(pk__in=ids).values_list('id', 'name')) if ids else {}


def blocks_outside(schedule, allowed_branch_ids, default_branch_id=None):
    """
    The blocks of `schedule` at clinics NOT in `allowed_branch_ids`, as a sorted list of comparable
    tuples. A block without a clinic belongs to the default clinic.
    """
    out = []
    for day, blocks in (schedule or {}).items():
        for block in blocks or []:
            bid = block.get('branch_id') or default_branch_id
            if bid and int(bid) not in allowed_branch_ids:
                out.append((day, str(block.get('start')), str(block.get('end')), int(bid)))
    return sorted(out)


def proposed_for_branch(branch_id, duty_schedule=None, duty_days=None, start=None, end=None):
    """
    The hours proposed for ONE clinic in combined form (`{day: [{start, end, branch_id}]}`).
    `duty_schedule` is that clinic's `{day: [{start, end}]}` slice; without it the single
    `duty_days` / `start` / `end` form is used.
    """
    if isinstance(duty_schedule, dict) and duty_schedule:
        return {
            day: [{'start': b.get('start'), 'end': b.get('end'), 'branch_id': int(branch_id)} for b in (blocks or [])]
            for day, blocks in duty_schedule.items()
        }
    return schedule_of_branch(branch_id, duty_days, start, end)


def branch_overlap_error(user, branch_id, duty_schedule=None, duty_days=None, start=None, end=None):
    """
    `{'detail', 'schedule_conflicts'}` when the hours proposed for one clinic overlap the user's hours
    at their OTHER active clinics, else None.
    """
    combined = merge_schedules(
        schedule_from_accesses(user, exclude_branch_id=branch_id),
        proposed_for_branch(branch_id, duty_schedule, duty_days, start, end),
    )
    return conflict_error(combined, clinic_names(combined))


def lock_person(user):
    """
    Serialise changes to one person's hours: take a row lock on the user. Call inside
    `transaction.atomic()` BEFORE reading their other clinics, so two simultaneous saves cannot both
    pass the overlap check.
    """
    from apps.accounts.models import User

    list(User.objects.select_for_update().filter(pk=user.pk).values_list('pk', flat=True))


def sync_combined_schedule(user):
    """
    Re-save the practitioner's combined `duty_schedule` from their active clinic rows, so the
    Staff form (which reads the combined schedule) and the clinic rows never disagree after a
    clinic is added, changed or removed through the single-clinic endpoints.
    """
    profile = getattr(user, 'practitioner_profile', None)
    if profile is None or getattr(profile, 'is_deleted', False):
        return
    profile.duty_schedule = schedule_from_accesses(user)
    profile.save(update_fields=['duty_schedule'])


ACTIVE_APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS']


def _fits(schedule, day, clinic_id, start, end, default_branch_id):
    """True when start-end lies inside one block of `schedule` for that clinic on that day (lunch is ignored)."""
    for block in _sorted_blocks(schedule, day):
        bid = block.get('branch_id') or default_branch_id
        if bid and int(bid) == int(clinic_id) and block['start'] <= start and end <= block['end']:
            return True
    return False


def appointments_losing_hours(user, new_schedule, default_branch_id=None, limit=10):
    """
    The practitioner's FUTURE active appointments that fit their current hours but would not fit
    `new_schedule` (the combined schedule they would have after the change).

    Nothing is changed here; callers use it to warn before saving. Returns
    `{'count': n, 'appointments': [{id, date, start_time, end_time, branch_id, branch_name}, ...]}`
    (the first `limit`, earliest first; no patient names).
    """
    from django.db.models import Q
    from django.utils import timezone

    from apps.appointments.models import Appointment

    profile = getattr(user, 'practitioner_profile', None)
    if profile is None or getattr(profile, 'is_deleted', False):
        return {'count': 0, 'appointments': []}

    old_schedule = schedule_from_accesses(user) or (profile.duty_schedule if isinstance(profile.duty_schedule, dict) else {})
    now = timezone.localtime()
    upcoming = Appointment.objects.filter(
        practitioner=profile, is_deleted=False, status__in=ACTIVE_APPOINTMENT_STATUSES,
    ).filter(
        Q(date__gt=now.date()) | Q(date=now.date(), start_time__gte=now.time())
    ).select_related('clinic').order_by('date', 'start_time')

    default_id = default_branch_id or user.clinic_branch_id
    lost = []
    for appt in upcoming:
        day = WEEKDAYS[appt.date.weekday()]
        start, end = appt.start_time.strftime('%H:%M'), appt.end_time.strftime('%H:%M')
        if _fits(old_schedule, day, appt.clinic_id, start, end, default_id) and not _fits(new_schedule, day, appt.clinic_id, start, end, default_id):
            lost.append(appt)

    return {
        'count': len(lost),
        'appointments': [
            {
                'id': a.id, 'date': a.date.isoformat(),
                'start_time': a.start_time.strftime('%H:%M'), 'end_time': a.end_time.strftime('%H:%M'),
                'branch_id': a.clinic_id, 'branch_name': a.clinic.name if a.clinic_id else None,
            }
            for a in lost[:limit]
        ],
    }


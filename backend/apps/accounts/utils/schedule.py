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


def find_overlap(schedule):
    """
    First pair of blocks that overlap on one day, as `(day, earlier, later)`, or None.
    Blocks that merely touch (one ends when the next starts) do not overlap.
    """
    for day in WEEKDAYS:
        blocks = [b for b in (schedule or {}).get(day) or [] if b.get('start') and b.get('end')]
        blocks.sort(key=lambda b: b['start'])
        for prev, block in zip(blocks, blocks[1:]):
            if block['start'] < prev['end']:
                return day, prev, block
    return None


def overlap_message(overlap, branch_name_of=lambda branch_id: None):
    """The user-facing sentence for a `find_overlap` result."""
    day, prev, block = overlap

    def label(b):
        name = branch_name_of(b.get('branch_id')) if b.get('branch_id') else None
        return f" ({name})" if name else ''

    return (
        f"{day}: Working periods overlap: {format_time_12h(prev['start'])}–{format_time_12h(prev['end'])}{label(prev)} "
        f"and {format_time_12h(block['start'])}–{format_time_12h(block['end'])}{label(block)}. "
        "A practitioner cannot work in two places simultaneously."
    )


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


def branch_overlap_error(user, branch_id, duty_schedule=None, duty_days=None, start=None, end=None):
    """
    Message when the hours proposed for one clinic overlap the user's hours at their OTHER active
    clinics, else None. `duty_schedule` is that clinic's `{day: [{start, end}]}` slice; without it the
    single `duty_days` / `start` / `end` form is used.
    """
    from apps.clinics.models import Clinic

    if isinstance(duty_schedule, dict) and duty_schedule:
        proposed = {
            day: [{'start': b.get('start'), 'end': b.get('end'), 'branch_id': int(branch_id)} for b in (blocks or [])]
            for day, blocks in duty_schedule.items()
        }
    else:
        proposed = schedule_of_branch(branch_id, duty_days, start, end)

    overlap = find_overlap(merge_schedules(schedule_from_accesses(user, exclude_branch_id=branch_id), proposed))
    if not overlap:
        return None
    ids = {b['branch_id'] for b in overlap[1:] if b.get('branch_id')}
    names = dict(Clinic.objects.filter(pk__in=ids).values_list('id', 'name'))
    return overlap_message(overlap, lambda bid: names.get(int(bid)))


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

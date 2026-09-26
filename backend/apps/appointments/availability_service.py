import logging
from datetime import date, time, datetime
from typing import List, Tuple, Optional, Dict, Any
from django.db.models import Q
from apps.clinics.models import Practitioner
from apps.appointments.models import Appointment, BlockAppointment, PractitionerSchedule

logger = logging.getLogger(__name__)

DAY_MAP = {
    0: 'Mon',
    1: 'Tue',
    2: 'Wed',
    3: 'Thu',
    4: 'Fri',
    5: 'Sat',
    6: 'Sun'
}

CLINIC_START = 6 * 60   # 06:00 (360 mins)
CLINIC_END   = 21 * 60  # 21:00 (1260 mins)


def time_to_minutes(t) -> int:
    """Convert time object or 'HH:MM' string to minutes from midnight."""
    if isinstance(t, str):
        parts = t.strip().split(':')
        return int(parts[0]) * 60 + int(parts[1])
    return t.hour * 60 + t.minute


def minutes_to_time(m: int) -> time:
    """Convert minutes from midnight to time object."""
    m = max(0, min(1439, m))
    return time(m // 60, m % 60)


def subtract_interval(working_ranges: List[Tuple[int, int]], subtract_start: int, subtract_end: int) -> List[Tuple[int, int]]:
    """Subtract an interval [subtract_start, subtract_end] from a list of working ranges."""
    if subtract_end <= subtract_start:
        return working_ranges
        
    new_ranges = []
    for r_start, r_end in working_ranges:
        if subtract_end <= r_start or subtract_start >= r_end:
            new_ranges.append((r_start, r_end))
        else:
            if r_start < subtract_start:
                new_ranges.append((r_start, subtract_start))
            if r_end > subtract_end:
                new_ranges.append((subtract_end, r_end))
    return new_ranges


def get_practitioner_working_windows(practitioner: Optional[Practitioner], target_date: date) -> List[Tuple[int, int]]:
    """
    Returns the practitioner's available working windows [(start_min, end_min), ...]
    for target_date, accounting for duty days, split shifts, legacy duty hours,
    and lunch breaks.
    Clamped to clinic operating hours [CLINIC_START, CLINIC_END].
    """
    weekday = target_date.weekday()
    day_key = DAY_MAP[weekday]

    if not practitioner:
        # Fallback to standard clinic operating hours with default lunch
        base_windows = [(CLINIC_START, CLINIC_END)]
        return subtract_interval(base_windows, 12 * 60, 13 * 60)

    # 1. Check PractitionerSchedule table first
    if getattr(practitioner, 'pk', None):
        sched_qs = PractitionerSchedule.objects.filter(
            practitioner=practitioner,
            weekday=weekday,
            is_available=True,
        ).order_by('start_time')
        if sched_qs.exists():
            windows = []
            for s in sched_qs:
                s_start = max(time_to_minutes(s.start_time), CLINIC_START)
                s_end = min(time_to_minutes(s.end_time), CLINIC_END)
                if s_end > s_start:
                    windows.append((s_start, s_end))
            return windows

    # 2. Check Practitioner duty_days
    duty_days = practitioner.duty_days or []
    duty_sched = practitioner.duty_schedule

    # If duty_schedule is configured with days, it defines the schedule days
    if duty_sched and isinstance(duty_sched, dict) and len(duty_sched) > 0:
        if day_key not in duty_sched:
            return []
    elif duty_days and len(duty_days) > 0:
        if day_key not in duty_days:
            return []

    # 3. Build candidate blocks
    working_ranges: List[Tuple[int, int]] = []
    if duty_sched and isinstance(duty_sched, dict) and day_key in duty_sched:
        blocks = duty_sched[day_key]
        if isinstance(blocks, list) and len(blocks) > 0:
            for b in blocks:
                try:
                    b_start = time_to_minutes(b['start'])
                    b_end = time_to_minutes(b['end'])
                    if b_end > b_start:
                        working_ranges.append((b_start, b_end))
                except Exception:
                    pass
    elif practitioner.duty_start_time and practitioner.duty_end_time:
        start_min = time_to_minutes(practitioner.duty_start_time)
        end_min = time_to_minutes(practitioner.duty_end_time)
        if end_min > start_min:
            working_ranges.append((start_min, end_min))

    if not working_ranges:
        # If no specific duty schedule or hours, default to clinic hours
        working_ranges = [(CLINIC_START, CLINIC_END)]

    # 4. Subtract lunch break
    if practitioner.lunch_start_time and practitioner.lunch_end_time:
        l_start = time_to_minutes(practitioner.lunch_start_time)
        l_end = time_to_minutes(practitioner.lunch_end_time)
        working_ranges = subtract_interval(working_ranges, l_start, l_end)
    elif not (duty_sched and isinstance(duty_sched, dict) and day_key in duty_sched):
        # Subtract standard clinic lunch 12:00-13:00 for non-split schedules
        working_ranges = subtract_interval(working_ranges, 12 * 60, 13 * 60)

    # 5. Clamp to clinic hours
    clamped_ranges: List[Tuple[int, int]] = []
    for r_start, r_end in working_ranges:
        c_start = max(r_start, CLINIC_START)
        c_end = min(r_end, CLINIC_END)
        if c_end > c_start:
            clamped_ranges.append((c_start, c_end))

    return clamped_ranges


def is_appointment_within_availability(
    practitioner: Optional[Practitioner],
    target_date: date,
    start_time: Any,
    duration_minutes: int,
) -> Tuple[bool, str]:
    """
    Validates the Core Business Rule:
        start_time + duration_minutes <= availability_end
    
    The entire appointment must fit inside one continuous availability window.
    Exact end time is valid (appointment_end == availability_end).
    """
    start_min = time_to_minutes(start_time)
    duration = int(duration_minutes or 0)
    if duration <= 0:
        duration = 15

    end_min = start_min + duration

    if start_min < CLINIC_START or end_min > CLINIC_END:
        return (
            False,
            f"Appointment ({minutes_to_time(start_min).strftime('%H:%M')} – {minutes_to_time(end_min).strftime('%H:%M')}) "
            f"extends outside clinic operating hours (06:00 – 21:00)."
        )

    windows = get_practitioner_working_windows(practitioner, target_date)
    if not windows:
        day_name = target_date.strftime('%A')
        return (False, f"Practitioner is not scheduled to work on {day_name}.")

    # Check if the entire appointment fits within at least one continuous window
    for w_start, w_end in windows:
        if w_start <= start_min and end_min <= w_end:
            return (True, "")

    # If it didn't fit, provide a specific helpful error
    # Check if it started inside a window but exceeded the end time
    for w_start, w_end in windows:
        if w_start <= start_min < w_end and end_min > w_end:
            w_end_12 = minutes_to_time(w_end).strftime('%I:%M %p').lstrip('0')
            w_end_24 = minutes_to_time(w_end).strftime('%H:%M')
            return (
                False,
                f"Appointment duration ({duration} mins) extends beyond practitioner's "
                f"availability end time ({w_end_12} / {w_end_24})."
            )

    return (
        False,
        "The requested appointment time falls outside the practitioner's available working hours."
    )


def generate_available_slots(
    practitioner: Optional[Practitioner],
    target_date: date,
    duration_minutes: int,
    booked_ranges: Optional[List[Tuple[int, int]]] = None,
    slot_interval: int = 15,
) -> List[str]:
    """
    Generates available slot start times ('HH:MM') for target_date.
    Ensures that for every slot:
        slot_start + duration_minutes <= window_end
    and slot does not overlap any booked_ranges.
    """
    duration = int(duration_minutes or 15)
    if duration <= 0:
        duration = 15

    windows = get_practitioner_working_windows(practitioner, target_date)
    all_booked = booked_ranges or []

    available_slots: List[str] = []

    for w_start, w_end in windows:
        m = w_start
        # Crucial condition: slot + duration must fit entirely inside this window
        while m + duration <= w_end:
            slot_start = m
            slot_end = m + duration

            if slot_end <= CLINIC_END:
                # Check overlap with existing appointments / blocks
                overlaps = any(
                    slot_start < b_end and slot_end > b_start
                    for b_start, b_end in all_booked
                )
                if not overlaps:
                    available_slots.append(f"{m // 60:02d}:{m % 60:02d}")

            m += slot_interval

    return sorted(list(dict.fromkeys(available_slots)))

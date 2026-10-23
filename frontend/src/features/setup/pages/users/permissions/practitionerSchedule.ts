import type { DutyDay, DutySchedule, ShiftBlock } from '@/features/clinics/clinic.api';
import type { BranchAssignment } from '../../../types/staff.types';

export const WEEKDAYS: DutyDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Hours at ONE clinic: the same single block on each of its days. */
export interface ClinicHours { days: DutyDay[]; start: string; end: string }

export const DEFAULT_HOURS: ClinicHours = { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start: '08:00', end: '17:00' };

const hhmm = (value?: string | null): string => (value ? value.slice(0, 5) : '');

/** The `{day: [{start, end}]}` slice stored for one clinic (falls back to its simple days + hours). */
export const sliceOf = (a: BranchAssignment): DutySchedule => {
  const stored = a.duty_schedule;
  if (stored && Object.values(stored).some((blocks) => (blocks ?? []).length > 0)) return stored;
  const start = hhmm(a.duty_start_time);
  const end = hhmm(a.duty_end_time);
  if (!start || !end) return {};
  const slice: DutySchedule = {};
  (a.duty_days ?? []).forEach((day) => { slice[day] = [{ start, end }]; });
  return slice;
};

/** Editable hours when the slice is the same single block on every day, else null (custom hours). */
export const uniformHours = (slice: DutySchedule): ClinicHours | null => {
  const days = WEEKDAYS.filter((d) => (slice[d] ?? []).length > 0);
  if (days.length === 0) return null;
  let first: ShiftBlock | null = null;
  for (const day of days) {
    const blocks = slice[day] ?? [];
    if (blocks.length !== 1) return null;
    if (!first) first = blocks[0];
    else if (blocks[0].start !== first.start || blocks[0].end !== first.end) return null;
  }
  return first ? { days, start: hhmm(first.start), end: hhmm(first.end) } : null;
};

export const toSlice = (hours: ClinicHours): DutySchedule => {
  const slice: DutySchedule = {};
  hours.days.forEach((day) => { slice[day] = [{ start: hours.start, end: hours.end }]; });
  return slice;
};

/** Combined schedule for the user update: every given clinic's slice tagged with its clinic. */
export const combine = (slices: Array<{ branchId: number; slice: DutySchedule }>): DutySchedule => {
  const combined: DutySchedule = {};
  slices.forEach(({ branchId, slice }) => {
    WEEKDAYS.forEach((day) => {
      (slice[day] ?? []).forEach((block) => {
        (combined[day] ??= []).push({ start: hhmm(block.start), end: hhmm(block.end), branch_id: branchId });
      });
    });
  });
  return combined;
};

export const formatTime = (value: string): string => {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h)) return value;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const dayRanges = (days: DutyDay[]): string => {
  const idx = days.map((d) => WEEKDAYS.indexOf(d)).sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j += 1;
    parts.push(j - i >= 2 ? `${WEEKDAYS[idx[i]]}–${WEEKDAYS[idx[j]]}` : idx.slice(i, j + 1).map((k) => WEEKDAYS[k]).join(', '));
    i = j + 1;
  }
  return parts.join(', ');
};

/** "Mon–Fri 8:00 AM–5:00 PM" (several groups are joined with " · "). */
export const describeSlice = (slice: DutySchedule): string => {
  const byHours = new Map<string, DutyDay[]>();
  WEEKDAYS.forEach((day) => {
    const label = (slice[day] ?? []).map((b) => `${formatTime(hhmm(b.start))}–${formatTime(hhmm(b.end))}`).join(' & ');
    if (label) byHours.set(label, [...(byHours.get(label) ?? []), day]);
  });
  if (byHours.size === 0) return 'No hours set';
  return [...byHours.entries()].map(([label, days]) => `${dayRanges(days)} ${label}`).join(' · ');
};

/** Backend validation text (overlap, clinic out of scope, ...) or a fallback. */
export const scheduleErrorText = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return fallback;
  const pick = (value: unknown): string | null =>
    typeof value === 'string' ? value : Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null;
  return pick(data.duty_schedule) ?? pick(data.detail) ?? pick(data.error) ?? fallback;
};

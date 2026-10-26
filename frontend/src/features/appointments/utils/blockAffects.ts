import type { BlockAppointment } from '@/types';

/**
 * Whether a block belongs in a practitioner's column. The same rule the backend uses to make that
 * practitioner unavailable: a clinic-wide block shows in every column; any other block shows only for
 * the practitioners it affects (the one it is scoped to, or those selected). The person who created a
 * block is NOT affected just for creating it.
 */
export const blockAffects = (block: BlockAppointment, practitionerId: number | null | undefined): boolean => {
  if (block.is_clinic_wide) return true;
  if (practitionerId == null) return false;
  return (
    block.practitioner_id === practitionerId ||
    (block.affected_practitioner_ids ?? []).includes(practitionerId)
  );
};

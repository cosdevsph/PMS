import type { PrivatePackageHistoryEntry } from './privatePackages.api';

const peso = (value: unknown) =>
  `₱${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Turn an audit-log entry into short human-readable lines. */
export const describeHistoryEntry = (entry: PrivatePackageHistoryEntry): string[] => {
  const c = entry.changes || {};
  const lines: string[] = [];

  switch (entry.action) {
    case 'CREATED': {
      if (typeof c.title === 'string') lines.push(`Package "${c.title}" created at ${peso(c.price)}.`);
      if (Array.isArray(c.items) && c.items.length) {
        lines.push(c.items.map((i) => `${i.service} × ${i.quantity}`).join(', '));
      }
      break;
    }
    case 'UPDATED': {
      if (c.title && typeof c.title === 'object') lines.push(`Title: "${c.title.from}" → "${c.title.to}"`);
      if (c.price && typeof c.price === 'object') lines.push(`Price: ${peso(c.price.from)} → ${peso(c.price.to)}`);
      if (c.notes) lines.push('Notes were edited.');
      if (c.items && !Array.isArray(c.items)) {
        c.items.added?.forEach((i) => lines.push(`Added ${i.service} × ${i.quantity}`));
        c.items.removed?.forEach((i) => lines.push(`Removed ${i.service} × ${i.quantity}`));
        c.items.quantity_changed?.forEach((i) => lines.push(`${i.service}: ${i.from} → ${i.to} sessions`));
      }
      break;
    }
    case 'STATUS_CHANGED':
      if (c.status) lines.push(`Status: ${c.status.from} → ${c.status.to}`);
      break;
    case 'APPOINTMENT_ASSIGNED':
      lines.push(
        `Appointment${entry.appointment ? ` #${entry.appointment}` : ''} assigned${c.service ? ` (${c.service}${c.session ? `, session ${c.session}` : ''})` : ''}.`,
      );
      break;
    case 'APPOINTMENT_UNASSIGNED':
      lines.push(
        `Appointment${entry.appointment ? ` #${entry.appointment}` : ''} removed from the package${c.service ? ` (${c.service})` : ''}.`,
      );
      break;
    default:
      break;
  }
  return lines;
};

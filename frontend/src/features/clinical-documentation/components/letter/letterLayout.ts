export interface LetterPatient {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
}

export const FONT = 'Helvetica, Arial, sans-serif';
export const TOP_SPACE_PX = 30;

export const formatLetterDate = (value?: string | Date): string =>
  (value ? new Date(value) : new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

export const patientName = (p: LetterPatient) => p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();

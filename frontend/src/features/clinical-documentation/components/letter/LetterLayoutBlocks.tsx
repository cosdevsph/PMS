import React from 'react';
import { formatLetterDate, patientName, TOP_SPACE_PX, FONT, type LetterPatient } from './letterLayout';
import type { ClinicProfile } from '../../api/letters.api';

/**
 * The blocks above a letter's body (letterhead, date, addressee), written once and used by the template
 * editor, the letter writer, the viewer, the preview and the print window. Inline styles only, so the same
 * markup also works in the print window, which has no stylesheet. The PDF is the backend twin of this
 * (`LetterGeneratorService.build_layout_html`).
 */


export const LetterheadBlock: React.FC<{ profile?: ClinicProfile | null }> = ({ profile }) => {
  if (!profile) return null;
  const contact = [profile.phone, profile.email].filter(Boolean).join(' | ');
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 26, fontFamily: FONT }}>
      <tbody>
        <tr>
          {profile.logo ? (
            <td style={{ width: 90, verticalAlign: 'middle', padding: '0 16px 14px 0' }}>
              <img src={profile.logo} alt="" style={{ height: 64, maxWidth: 160, objectFit: 'contain' }} />
            </td>
          ) : null}
          <td style={{ verticalAlign: 'middle', padding: '0 0 14px 0', borderBottom: '1px solid #1e293b' }}>
            <p style={{ margin: '0 0 2px 0', fontSize: 18, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>{profile.name}</p>
            {profile.address ? <p style={{ margin: 0, fontSize: 11, color: '#334155' }}>{profile.address}</p> : null}
            {contact ? <p style={{ margin: 0, fontSize: 11, color: '#334155' }}>{contact}</p> : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export const LetterDateBlock: React.FC<{ date?: string | Date }> = ({ date }) => (
  <p style={{ margin: '0 0 20px 0', fontFamily: FONT, fontSize: 14, color: '#1e293b' }}>{formatLetterDate(date)}</p>
);

export const LetterAddresseeBlock: React.FC<{ patient: LetterPatient }> = ({ patient }) => {
  const cityLine = [patient.city, patient.province, patient.postal_code].filter(Boolean).join(' ');
  const lines = [patientName(patient), patient.address, cityLine].filter(Boolean) as string[];
  return (
    <div style={{ margin: '0 0 30px 0', fontFamily: FONT, fontSize: 14, color: '#1e293b' }}>
      {lines.map((line, i) => (
        <p key={i} style={{ margin: 0, fontWeight: i === 0 ? 700 : 400 }}>{line}</p>
      ))}
    </div>
  );
};

interface LayoutBlocksProps {
  profile?: ClinicProfile | null;
  patient?: LetterPatient | null;
  date?: string | Date;
  letterHead: boolean;
  showDate: boolean;
  addressee: boolean;
}

/** The three blocks in letter order, each only when its toggle is on. */
export const LetterLayoutBlocks: React.FC<LayoutBlocksProps> = ({ profile, patient, date, letterHead, showDate, addressee }) => (
  <>
    {letterHead ? <LetterheadBlock profile={profile} /> : null}
    {showDate ? <LetterDateBlock date={date} /> : null}
    {addressee && patient ? <LetterAddresseeBlock patient={patient} /> : null}
  </>
);

/** Space above the first block ("Remove top space" turns it off), same 30 px as the PDF. */
export const LetterTopSpace: React.FC<{ removed: boolean }> = ({ removed }) =>
  removed ? null : <div style={{ height: TOP_SPACE_PX }} aria-hidden="true" />;

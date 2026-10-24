import { renderToStaticMarkup } from 'react-dom/server';
import type { ClinicProfile } from '../../api/letters.api';
import { LetterLayoutBlocks, LetterTopSpace } from './LetterLayoutBlocks';
import { FONT, type LetterPatient } from './letterLayout';

/** A complete printable document: the blocks plus the letter body. */
export const buildLetterPrintHtml = (
  props: {
    profile?: ClinicProfile | null;
    patient?: LetterPatient | null;
    date?: string | Date;
    letterHead: boolean;
    showDate: boolean;
    addressee: boolean; removeTopSpace: boolean; bodyHtml: string; title: string },
): string => {
  const blocks = renderToStaticMarkup(
    <>
      <LetterTopSpace removed={props.removeTopSpace} />
      <LetterLayoutBlocks {...props} />
    </>,
  );
  const escapedTitle = props.title.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
  return `<html><head><title>${escapedTitle}</title><style>
    body { font-family: ${FONT}; font-size: 14px; line-height: 1.5; color: #1e293b; margin: 0; padding: 20px 40px; }
    table { border-collapse: collapse; }
  </style></head><body>${blocks}<div>${props.bodyHtml}</div></body></html>`;
};

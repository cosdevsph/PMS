import React from 'react';
import type { ClinicProfile } from '../api/letters.api';
import { LetterheadBlock } from './letter/LetterLayoutBlocks';

interface ClinicLetterheadProps {
  profile: ClinicProfile | undefined;
}

/** Kept for existing imports; the letterhead itself lives in the shared letter layout blocks. */
export const ClinicLetterhead: React.FC<ClinicLetterheadProps> = ({ profile }) => <LetterheadBlock profile={profile} />;

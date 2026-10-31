export type AnswerValue = number | boolean;
export type Answers = Record<string, AnswerValue>;

export type ItemType = 'single_choice' | 'yes_no' | 'numeric' | 'nrs' | 'slider';

export interface OutcomeItem {
  id: string;
  type: ItemType;
  prompt: string;
  required?: boolean;
  options?: { value: number; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  anchors?: { min?: string; max?: string; mid?: string };
}

export type ScoreDirection = 'higher_worse' | 'higher_better';

export interface OutcomeDefinition {
  id: number;
  code: string;
  version: string;
  name: string;
  abbreviation: string;
  category: string;
  language: string;
  licence_category: string;
  definition: {
    description?: string;
    instructions?: string;
    items: OutcomeItem[];
    scoring: { method: string; direction?: ScoreDirection; range?: [number, number] };
  };
}

export interface ScoreGroup {
  score: number | null;
  valid: boolean;
  answered: number;
  missing: number;
  range?: [number, number] | null;
  name?: string;
}

export interface AssessmentScores {
  method: string;
  direction?: ScoreDirection | null;
  total: ScoreGroup | null;
  subscales: Record<string, ScoreGroup>;
}

export interface OutcomeAssessment {
  id: number;
  patient: number;
  patient_case: number | null;
  appointment: number | null;
  definition: number;
  code: string;
  version: string;
  measure_name: string;
  abbreviation: string;
  assessed_on: string;
  scores: AssessmentScores;
  status: 'COMPLETED' | 'VOIDED';
  void_reason: string;
  completed_at: string;
  created_by_name: string;
  voided_at: string | null;
  voided_by_name: string;
}

export interface OutcomeAssessmentDetail extends OutcomeAssessment {
  answers: Answers;
  items: OutcomeItem[];
}

export interface LibraryEntry {
  id: number;
  code: string;
  version: string;
  name: string;
  abbreviation: string;
  category: string;
  description: string;
  licence_category: string;
  enabled: boolean;
  pinned_version: string;
}

export interface TrendPoint {
  id: number;
  assessed_on: string;
  completed_at: string;
  version: string;
  score: number;
  subscales: Record<string, number | null>;
  scoring_key: string;
}

export interface TrendResponse {
  points: TrendPoint[];
  measure: {
    name: string;
    abbreviation: string;
    direction: ScoreDirection | null;
    range: [number, number] | null;
    subscale_names: Record<string, string>;
  } | null;
}

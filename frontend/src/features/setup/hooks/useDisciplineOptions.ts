import { useState, useCallback } from 'react';
import { DISCIPLINE_OPTIONS } from '../types/staff.types';

export interface DisciplineOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

const STORAGE_KEY = 'pms_custom_disciplines';

const loadCustomDisciplines = (): DisciplineOption[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DisciplineOption[]) : [];
  } catch {
    return [];
  }
};

/**
 * Returns the full list of discipline options (built-in + custom),
 * plus a helper to permanently add a new custom discipline.
 */
export const useDisciplineOptions = () => {
  const [customDisciplines, setCustomDisciplines] = useState<DisciplineOption[]>(
    loadCustomDisciplines,
  );

  const allOptions: DisciplineOption[] = [
    ...DISCIPLINE_OPTIONS,
    ...customDisciplines,
  ];

  /**
   * Adds a new custom discipline (persisted in localStorage).
   * Returns the created option, or undefined if label is empty / already exists.
   */
  const addDiscipline = useCallback((label: string): DisciplineOption | undefined => {
    const trimmed = label.trim();
    if (!trimmed) return undefined;

    // Derive a stable value key from the label
    const value = trimmed
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');

    // Prevent duplicates against both built-in and custom options
    const existing = [...DISCIPLINE_OPTIONS, ...loadCustomDisciplines()];
    if (existing.some(d => d.value === value || d.label.toLowerCase() === trimmed.toLowerCase())) {
      return existing.find(
        d => d.value === value || d.label.toLowerCase() === trimmed.toLowerCase(),
      ) as DisciplineOption;
    }

    const newOption: DisciplineOption = { value, label: trimmed, isCustom: true };

    setCustomDisciplines(prev => {
      const updated = [...prev, newOption];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // quota exceeded – still work in-memory
      }
      return updated;
    });

    return newOption;
  }, []);

  return { allOptions, addDiscipline };
};

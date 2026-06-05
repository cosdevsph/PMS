import { useState, useEffect, useCallback } from 'react';
import { getCalendarNotes } from '../appointment.api';
import { format } from 'date-fns';
import type { CalendarNote } from '@/types';
import toast from 'react-hot-toast';

interface UseNotesParams {
  startDate:       Date;
  endDate:         Date;
  clinicBranchId?: number | null;
  /** When set, only fetch notes belonging to this practitioner (or clinic-wide null notes). */
  practitionerId?: number | null;
}

export const useNotes = ({
  startDate,
  endDate,
  clinicBranchId = null,
  practitionerId = null,
}: UseNotesParams) => {
  const [notes,   setNotes]   = useState<CalendarNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr   = format(endDate,   'yyyy-MM-dd');

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { start_date: string; end_date: string; clinic_branch?: number; practitioner?: number } = {
        start_date: startDateStr,
        end_date:   endDateStr,
      };
      if (clinicBranchId  !== null) params.clinic_branch = clinicBranchId;
      if (practitionerId  !== null) params.practitioner  = practitionerId;

      const data = await getCalendarNotes(params);
      setNotes(data);
    } catch (err: any) {
      console.error('Failed to fetch calendar notes:', err);
      const msg = err.response?.data?.detail || 'Failed to load notes';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [startDateStr, endDateStr, clinicBranchId, practitionerId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNoteToState = useCallback((note: CalendarNote) => {
    setNotes(prev => {
      if (prev.some(n => n.id === note.id)) return prev;
      return [...prev, note];
    });
  }, []);

  const removeNoteFromState = useCallback((noteId: number) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }, []);

  const updateNoteInState = useCallback((updated: CalendarNote) => {
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  }, []);

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    addNoteToState,
    removeNoteFromState,
    updateNoteInState,
  };
};

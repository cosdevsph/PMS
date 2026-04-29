import { useState, useRef, useCallback } from 'react';
import type { CalendarNote } from '@/types';

interface NoteHoverState {
  note: CalendarNote | null;
  anchorRect: DOMRect | null;
  visible: boolean;
}

export const useNoteHover = () => {
  const [noteHoverState, setNoteHoverState] = useState<NoteHoverState>({
    note: null,
    anchorRect: null,
    visible: false,
  });

  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current)     clearTimeout(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const onNoteMouseEnter = useCallback((note: CalendarNote, e: React.MouseEvent) => {
    clearTimers();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    timerRef.current = setTimeout(() => {
      setNoteHoverState({ note, anchorRect: rect, visible: true });
    }, 150);
  }, []);

  const onNoteMouseLeave = useCallback(() => {
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      setNoteHoverState(prev => ({ ...prev, visible: false }));
    }, 120);
  }, []);

  const onNotePopoverEnter = useCallback(() => {
    clearTimers();
  }, []);

  const onNotePopoverLeave = useCallback(() => {
    clearTimers();
    setNoteHoverState(prev => ({ ...prev, visible: false }));
  }, []);

  const hideNoteHover = useCallback(() => {
    clearTimers();
    setNoteHoverState({ note: null, anchorRect: null, visible: false });
  }, []);

  return {
    noteHoverState,
    onNoteMouseEnter,
    onNoteMouseLeave,
    onNotePopoverEnter,
    onNotePopoverLeave,
    hideNoteHover,
  };
};

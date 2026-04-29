import { useState, useCallback, useRef } from 'react';
import type { CalendarNote } from '@/types';

const DRAG_THRESHOLD = 5; // pixels of movement before drag activates

export interface NoteDragState {
  isDragging:    boolean;
  draggedNote:   CalendarNote | null;
  ghostPosition: { x: number; y: number } | null;
  isHolding:     boolean;
}

interface UseNoteDragReturn {
  noteDragState:    NoteDragState;
  startNoteDrag:    (note: CalendarNote, e: React.MouseEvent | React.TouchEvent) => void;
  cancelNoteDrag:   () => void;
  onNoteDragMove:   (e: React.MouseEvent | React.TouchEvent) => void;
  onNoteDropOnSlot: (date: Date, hour: number, minutes: number) => void;
}

const EMPTY_NOTE_DRAG_STATE: NoteDragState = {
  isDragging:    false,
  draggedNote:   null,
  ghostPosition: null,
  isHolding:     false,
};

export const useNoteDrag = (
  onReschedule: (note: CalendarNote, newDate: Date, newHour: number, newMinutes: number) => void,
): UseNoteDragReturn => {
  const [noteDragState, setNoteDragState] = useState<NoteDragState>(EMPTY_NOTE_DRAG_STATE);

  const dragStartRef = useRef<{ x: number; y: number; note: CalendarNote } | null>(null);

  const startNoteDrag = useCallback((note: CalendarNote, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY, note };
    setNoteDragState({ isDragging: false, draggedNote: note, ghostPosition: null, isHolding: true });
  }, []);

  const cancelNoteDrag = useCallback(() => {
    dragStartRef.current = null;
    setNoteDragState(EMPTY_NOTE_DRAG_STATE);
  }, []);

  const onNoteDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Pending drag — activate once movement exceeds threshold
    if (dragStartRef.current && !noteDragState.isDragging) {
      const dx = Math.abs(clientX - dragStartRef.current.x);
      const dy = Math.abs(clientY - dragStartRef.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        setNoteDragState({
          isDragging:    true,
          draggedNote:   dragStartRef.current.note,
          ghostPosition: { x: clientX, y: clientY },
          isHolding:     false,
        });
        dragStartRef.current = null;
      }
      return;
    }

    // Active drag — update ghost
    if (!noteDragState.isDragging) return;
    setNoteDragState(prev => ({ ...prev, ghostPosition: { x: clientX, y: clientY } }));
  }, [noteDragState.isDragging]);

  const onNoteDropOnSlot = useCallback((date: Date, hour: number, minutes: number) => {
    if (!noteDragState.isDragging || !noteDragState.draggedNote) return;
    onReschedule(noteDragState.draggedNote, date, hour, minutes);
    setNoteDragState(EMPTY_NOTE_DRAG_STATE);
  }, [noteDragState.isDragging, noteDragState.draggedNote, onReschedule]);

  return { noteDragState, startNoteDrag, cancelNoteDrag, onNoteDragMove, onNoteDropOnSlot };
};

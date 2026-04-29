import { useState, useCallback, useRef } from 'react';
import type { Appointment } from '@/types';

const DRAG_THRESHOLD = 5; // pixels of movement required before drag activates

export interface DragState {
  isDragging:         boolean;
  draggedAppointment: Appointment | null;
  ghostPosition:      { x: number; y: number } | null;
  /** Always 0 — hold-to-drag removed. Kept for interface compatibility. */
  holdProgress:       number;
  /** Always false — hold-to-drag removed. Kept for interface compatibility. */
  isHolding:          boolean;
}

interface UseAppointmentDragReturn {
  dragState:            DragState;
  startHold:            (apt: Appointment, e: React.MouseEvent | React.TouchEvent) => void;
  cancelHold:           () => void;
  onDragMove:           (e: React.MouseEvent | React.TouchEvent) => void;
  onDropOnSlot:         (date: Date, hour: number, minutes: number) => void;
  cancelDrag:           () => void;
}

const EMPTY_STATE: DragState = {
  isDragging:          false,
  draggedAppointment:  null,
  ghostPosition:       null,
  holdProgress:        0,
  isHolding:           false,
};

export const useAppointmentDrag = (
  onReschedule: (appointment: Appointment, newDate: Date, newHour: number, newMinutes: number) => void
): UseAppointmentDragReturn => {

  const [dragState, setDragState] = useState<DragState>(EMPTY_STATE);

  /**
   * Stores the mousedown position + appointment while waiting for the drag
   * threshold. No state change on mousedown — keeps simple clicks fast.
   */
  const dragStartRef = useRef<{ x: number; y: number; apt: Appointment } | null>(null);

  /** Records the mousedown position. Actual drag starts in onDragMove once
   *  the cursor moves more than DRAG_THRESHOLD pixels. */
  const startHold = useCallback((apt: Appointment, e: React.MouseEvent | React.TouchEvent) => {
    if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return;

    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = { x: clientX, y: clientY, apt };
  }, []);

  /** Cancels any pending or active drag. */
  const cancelHold = useCallback(() => {
    dragStartRef.current = null;
    setDragState(EMPTY_STATE);
  }, []);

  const onDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Pending drag — activate once movement exceeds threshold
    if (dragStartRef.current && !dragState.isDragging) {
      const dx = Math.abs(clientX - dragStartRef.current.x);
      const dy = Math.abs(clientY - dragStartRef.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        setDragState({
          isDragging:         true,
          draggedAppointment: dragStartRef.current.apt,
          ghostPosition:      { x: clientX, y: clientY },
          holdProgress:       0,
          isHolding:          false,
        });
        dragStartRef.current = null;
      }
      return;
    }

    // Active drag — update ghost position
    if (!dragState.isDragging) return;
    setDragState(prev => ({ ...prev, ghostPosition: { x: clientX, y: clientY } }));
  }, [dragState.isDragging]);

  const onDropOnSlot = useCallback((date: Date, hour: number, minutes: number) => {
    if (!dragState.isDragging || !dragState.draggedAppointment) return;
    onReschedule(dragState.draggedAppointment, date, hour, minutes);
    setDragState(EMPTY_STATE);
  }, [dragState.isDragging, dragState.draggedAppointment, onReschedule]);

  const cancelDrag = useCallback(() => {
    dragStartRef.current = null;
    setDragState(EMPTY_STATE);
  }, []);

  return { dragState, startHold, cancelHold, onDragMove, onDropOnSlot, cancelDrag };
};
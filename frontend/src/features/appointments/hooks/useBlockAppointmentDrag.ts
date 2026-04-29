import { useState, useCallback, useRef } from 'react';
import type { BlockAppointment } from '@/types';

const DRAG_THRESHOLD = 5; // pixels of movement required before drag activates

export interface BlockDragState {
  isDragging:    boolean;
  draggedBlock:  BlockAppointment | null;
  ghostPosition: { x: number; y: number } | null;
  /** Always 0 — hold-to-drag removed. Kept for interface compatibility. */
  holdProgress:  number;
  /** Always false — hold-to-drag removed. Kept for interface compatibility. */
  isHolding:     boolean;
}

interface UseBlockAppointmentDragReturn {
  blockDragState:    BlockDragState;
  startBlockHold:    (block: BlockAppointment, e: React.MouseEvent | React.TouchEvent) => void;
  cancelBlockHold:   () => void;
  onBlockDragMove:   (e: React.MouseEvent | React.TouchEvent) => void;
  onBlockDropOnSlot: (date: Date, hour: number, minutes: number) => void;
  cancelBlockDrag:   () => void;
}

const EMPTY_BLOCK_STATE: BlockDragState = {
  isDragging:    false,
  draggedBlock:  null,
  ghostPosition: null,
  holdProgress:  0,
  isHolding:     false,
};

export const useBlockAppointmentDrag = (
  onReschedule: (block: BlockAppointment, newDate: Date, newHour: number, newMinutes: number) => void
): UseBlockAppointmentDragReturn => {

  const [blockDragState, setBlockDragState] = useState<BlockDragState>(EMPTY_BLOCK_STATE);

  /**
   * Stores the mousedown position + block while waiting for the drag threshold.
   * No state change on mousedown — keeps simple clicks fast.
   */
  const dragStartRef = useRef<{ x: number; y: number; block: BlockAppointment } | null>(null);

  const startBlockHold = useCallback((block: BlockAppointment, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = { x: clientX, y: clientY, block };
  }, []);

  const cancelBlockHold = useCallback(() => {
    dragStartRef.current = null;
    setBlockDragState(EMPTY_BLOCK_STATE);
  }, []);

  const onBlockDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Pending drag — activate once movement exceeds threshold
    if (dragStartRef.current && !blockDragState.isDragging) {
      const dx = Math.abs(clientX - dragStartRef.current.x);
      const dy = Math.abs(clientY - dragStartRef.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        setBlockDragState({
          isDragging:    true,
          draggedBlock:  dragStartRef.current.block,
          ghostPosition: { x: clientX, y: clientY },
          holdProgress:  0,
          isHolding:     false,
        });
        dragStartRef.current = null;
      }
      return;
    }

    // Active drag — update ghost position
    if (!blockDragState.isDragging) return;
    setBlockDragState(prev => ({ ...prev, ghostPosition: { x: clientX, y: clientY } }));
  }, [blockDragState.isDragging]);

  const onBlockDropOnSlot = useCallback((date: Date, hour: number, minutes: number) => {
    if (!blockDragState.isDragging || !blockDragState.draggedBlock) return;
    onReschedule(blockDragState.draggedBlock, date, hour, minutes);
    setBlockDragState(EMPTY_BLOCK_STATE);
  }, [blockDragState.isDragging, blockDragState.draggedBlock, onReschedule]);

  const cancelBlockDrag = useCallback(() => {
    dragStartRef.current = null;
    setBlockDragState(EMPTY_BLOCK_STATE);
  }, []);

  return { blockDragState, startBlockHold, cancelBlockHold, onBlockDragMove, onBlockDropOnSlot, cancelBlockDrag };
};
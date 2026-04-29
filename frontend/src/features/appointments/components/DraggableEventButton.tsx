import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface DraggableEventButtonProps {
  onDragEnd?: (date: Date, hour: number, minute: number) => void;
  onClick?: () => void;
}

export const DraggableEventButton: React.FC<DraggableEventButtonProps> = ({ onDragEnd, onClick }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const isDraggingRef = useRef(false);
  const onDragEndRef  = useRef(onDragEnd);

  // Keep ref in sync
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const handleMouseUpRef   = useRef<((e: MouseEvent) => void) | null>(null);

  useEffect(() => {
    handleMouseMoveRef.current = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    };

    handleMouseUpRef.current = (e: MouseEvent) => {
      if (isDraggingRef.current && onDragEndRef.current) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element) {
          const slotElement = element.closest('[data-slot-date]');
          if (slotElement) {
            const dateStr = slotElement.getAttribute('data-slot-date');
            const hour    = parseInt(slotElement.getAttribute('data-slot-hour')   || '9', 10);
            const minute  = parseInt(slotElement.getAttribute('data-slot-minute') || '0', 10);
            if (dateStr) {
              onDragEndRef.current(new Date(dateStr), hour, minute);
            }
          }
        }
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      setDragPosition(null);

      document.removeEventListener('mousemove', handleMouseMoveRef.current!);
      document.removeEventListener('mouseup',   handleMouseUpRef.current!);
    };

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRef.current!);
      document.removeEventListener('mouseup',   handleMouseUpRef.current!);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    isDraggingRef.current = true;
    setIsDragging(true);
    setDragPosition({ x: e.clientX, y: e.clientY });

    if (handleMouseMoveRef.current && handleMouseUpRef.current) {
      document.addEventListener('mousemove', handleMouseMoveRef.current);
      document.addEventListener('mouseup',   handleMouseUpRef.current);
    }
  }, []);

  return (
    <>
      <button
        onMouseDown={handleMouseDown}
        onClick={onClick}
        className={`
          relative flex items-center gap-2 px-4 py-2 text-sm font-medium
          text-white rounded-lg transition-all
          ${isDragging ? 'opacity-50 cursor-grabbing' : 'bg-indigo-600 hover:bg-indigo-700 cursor-grab'}
        `}
      >
        <Plus className="w-4 h-4" />
        <span>Add Event</span>
      </button>

      {isDragging && dragPosition && (
        <div
          className="fixed pointer-events-none z-[9999] opacity-90 shadow-2xl"
          style={{
            left:  dragPosition.x - 80,
            top:   dragPosition.y - 20,
            width: 160,
          }}
        >
          <div className="bg-indigo-500 text-white rounded-lg px-3 py-2 text-xs font-semibold shadow-lg border-2 border-indigo-300">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Drop to create event
            </div>
          </div>
        </div>
      )}
    </>
  );
};
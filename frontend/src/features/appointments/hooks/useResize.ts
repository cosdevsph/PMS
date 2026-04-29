import { useState, useCallback } from 'react';

export type ResizeHandle = 'top' | 'bottom';
export type ResizeType   = 'appointment' | 'block' | 'note';

/** h-6 = 24px per 15-minute slot → 1.6 px/min */
const PX_PER_MIN = 24 / 15;
const MIN_DURATION_MINS = 15;

interface ResizeTarget {
  type:          ResizeType;
  id:            number;
  handle:        ResizeHandle;
  startY:        number;
  origStartMins: number;
  origEndMins:   number;
  date:          string;
}

interface ResizePreview {
  startMins: number;
  endMins:   number;
}

export interface ResizeCommitResult {
  type:       ResizeType;
  id:         number;
  date:       string;
  start_time: string;
  end_time:   string;
}

const timeToMins = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minsToTime = (mins: number): string =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

const snapTo15 = (mins: number): number => Math.round(mins / 15) * 15;

export const useResize = () => {
  const [resizeTarget,  setResizeTarget]  = useState<ResizeTarget | null>(null);
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null);

  const startResize = useCallback((
    type:      ResizeType,
    id:        number,
    handle:    ResizeHandle,
    startTime: string,
    endTime:   string,
    date:      string,
    e:         React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const origStartMins = timeToMins(startTime);
    const origEndMins   = timeToMins(endTime);
    setResizeTarget({ type, id, handle, startY: e.clientY, origStartMins, origEndMins, date });
    setResizePreview({ startMins: origStartMins, endMins: origEndMins });
  }, []);

  const onResizeMove = useCallback((e: React.MouseEvent) => {
    setResizePreview(prev => {
      if (!resizeTarget || !prev) return prev;
      const deltaY    = e.clientY - resizeTarget.startY;
      const snapped   = Math.round((deltaY / PX_PER_MIN) / 15) * 15;

      if (resizeTarget.handle === 'bottom') {
        return {
          startMins: resizeTarget.origStartMins,
          endMins:   Math.max(
            resizeTarget.origStartMins + MIN_DURATION_MINS,
            snapTo15(resizeTarget.origEndMins + snapped),
          ),
        };
      } else {
        return {
          startMins: Math.min(
            resizeTarget.origEndMins - MIN_DURATION_MINS,
            snapTo15(resizeTarget.origStartMins + snapped),
          ),
          endMins: resizeTarget.origEndMins,
        };
      }
    });
  }, [resizeTarget]);

  const commitResize = useCallback((): ResizeCommitResult | null => {
    if (!resizeTarget || !resizePreview) return null;
    const result: ResizeCommitResult = {
      type:       resizeTarget.type,
      id:         resizeTarget.id,
      date:       resizeTarget.date,
      start_time: minsToTime(resizePreview.startMins),
      end_time:   minsToTime(resizePreview.endMins),
    };
    setResizeTarget(null);
    setResizePreview(null);
    return result;
  }, [resizeTarget, resizePreview]);

  const cancelResize = useCallback(() => {
    setResizeTarget(null);
    setResizePreview(null);
  }, []);

  /** Returns override times for the card being resized, null otherwise. */
  const getPreviewTimes = useCallback(
    (type: ResizeType, id: number): { start_time: string; end_time: string } | null => {
      if (!resizeTarget || resizeTarget.type !== type || resizeTarget.id !== id || !resizePreview) {
        return null;
      }
      return {
        start_time: minsToTime(resizePreview.startMins),
        end_time:   minsToTime(resizePreview.endMins),
      };
    },
    [resizeTarget, resizePreview],
  );

  return {
    resizeTarget,
    isResizing: resizeTarget !== null,
    startResize,
    onResizeMove,
    commitResize,
    cancelResize,
    getPreviewTimes,
  };
};

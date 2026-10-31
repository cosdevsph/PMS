import type { ChartType } from '@/types/clinicalTemplate';

/**
 * Where each anatomical view sits inside a chart image, as fractions of the image width (measured from the
 * four-view charts in assets/charts). A marker's view and patient side are worked out from where it is placed.
 * Bump CHART_VERSION if an image or these ranges ever change, so saved markers can still be read correctly.
 */
export const CHART_VERSION = 1;

export type ViewId = 'anterior' | 'posterior' | 'right_lateral' | 'left_lateral';
export type Side = 'left' | 'right' | 'midline';

export interface ChartView {
  id: ViewId;
  label: string;
  /** Left and right edge of the view, 0 to 1 across the image. */
  x0: number;
  x1: number;
  /** Centre line of the figure; only front and back views have one. */
  midline?: number;
}

export const VIEW_LABELS: Record<ViewId, string> = {
  anterior: 'Front',
  posterior: 'Back',
  right_lateral: 'Right side',
  left_lateral: 'Left side',
};

export const SIDE_LABELS: Record<Side, string> = { left: 'Left', right: 'Right', midline: 'Midline' };

// The first side view of the body chart faces right (patient's right side); of the head chart, left.
export const CHART_VIEWS: Partial<Record<ChartType, ChartView[]>> = {
  body: [
    { id: 'anterior', label: VIEW_LABELS.anterior, x0: 0, x1: 0.265, midline: 0.1375 },
    { id: 'right_lateral', label: VIEW_LABELS.right_lateral, x0: 0.265, x1: 0.505 },
    { id: 'left_lateral', label: VIEW_LABELS.left_lateral, x0: 0.505, x1: 0.74 },
    { id: 'posterior', label: VIEW_LABELS.posterior, x0: 0.74, x1: 1, midline: 0.86 },
  ],
  head: [
    { id: 'anterior', label: VIEW_LABELS.anterior, x0: 0, x1: 0.255, midline: 0.14 },
    { id: 'left_lateral', label: VIEW_LABELS.left_lateral, x0: 0.255, x1: 0.5 },
    { id: 'right_lateral', label: VIEW_LABELS.right_lateral, x0: 0.5, x1: 0.745 },
    { id: 'posterior', label: VIEW_LABELS.posterior, x0: 0.745, x1: 1, midline: 0.86 },
  ],
  back: [{ id: 'posterior', label: VIEW_LABELS.posterior, x0: 0, x1: 1, midline: 0.5 }],
};

/** Closer to the centre line than this counts as midline. */
const MIDLINE_BAND = 0.012;

export interface Location {
  view: ViewId;
  side: Side;
}

/** The view and the patient's left / right for a point at horizontal position `x` (0 to 1). */
export const locate = (chartType: ChartType, x: number): Location | null => {
  const views = CHART_VIEWS[chartType];
  const view = views?.find((v) => x >= v.x0 && x < v.x1) ?? views?.[views.length - 1];
  if (!view) return null;
  if (view.id === 'right_lateral') return { view: view.id, side: 'right' };
  if (view.id === 'left_lateral') return { view: view.id, side: 'left' };
  const mid = view.midline ?? (view.x0 + view.x1) / 2;
  if (Math.abs(x - mid) <= MIDLINE_BAND) return { view: view.id, side: 'midline' };
  const imageLeft = x < mid;
  // Facing the patient, the patient's right is on the viewer's left; from behind it is the other way round.
  if (view.id === 'anterior') return { view: view.id, side: imageLeft ? 'right' : 'left' };
  return { view: view.id, side: imageLeft ? 'left' : 'right' };
};

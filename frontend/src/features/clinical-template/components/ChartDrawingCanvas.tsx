import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import { chartImageMap, chartLabel } from '../utils/chartMapping';
import { CHART_VERSION, SIDE_LABELS, VIEW_LABELS, locate } from '../utils/chartViews';
import type { Side, ViewId } from '../utils/chartViews';
import type { ChartType } from '@/types/clinicalTemplate';
import { MapPin, PenLine, Trash2, Undo2, X } from 'lucide-react';

// ─── Stroke, Marker & Annotation Data Types ─────────────────────────────────

export interface ChartStroke {
  tool: 'pen';
  color: string;
  strokeWidth: number;
  points: number[];
}

/**
 * A marker placed on the chart. x and y are fractions (0 to 1) of the chart image, so they stay correct at any
 * screen size. Markers are kept in `doodle_data` next to the pen strokes; older notes simply have none.
 */
export interface ChartMarker {
  tool: 'marker';
  color: string;
  x: number;
  y: number;
  view: ViewId | null;
  side: Side | null;
  note: string;
  chart_version: number;
}

export type ChartItem = ChartStroke | ChartMarker;

export interface ChartAnnotation {
  canvas_image: string | null;
  doodle_data: ChartItem[];
  chart_type?: string;
}

const isMarker = (item: ChartItem): item is ChartMarker => item.tool === 'marker';

const describeMarker = (m: ChartMarker): string => {
  const parts = [m.view ? VIEW_LABELS[m.view] : null, m.side ? SIDE_LABELS[m.side] : null].filter(Boolean);
  return parts.join(' · ') || 'Marker';
};

// ─── Color Palette ───────────────────────────────────────────────────────────

const BRUSH_COLORS: { label: string; color: string }[] = [
  { label: 'Blue', color: '#0575E6' },
  { label: 'Green', color: '#5CDB95' },
  { label: 'Red', color: '#EF4444' },
  { label: 'Orange', color: '#F59E0B' },
  { label: 'Purple', color: '#8B5CF6' },
  { label: 'Black', color: '#000000' },
];

const DEFAULT_STROKE_WIDTH = 3;
const BASE_WIDTH = 700;
const MARKER_RADIUS = 9;

// ─── Props ───────────────────────────────────────────────────────────────────

interface ChartDrawingCanvasProps {
  chartType: ChartType;
  /** Existing saved annotation (canvas_image + doodle_data). */
  value?: ChartAnnotation | null;
  onChange?: (annotation: ChartAnnotation) => void;
  /** When true, shows the saved canvas image read-only (no drawing). */
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
}

const MarkerList: React.FC<{
  markers: { marker: ChartMarker; index: number }[];
  readOnly: boolean;
  onNote?: (index: number, note: string) => void;
  onCommit?: () => void;
  onRemove?: (index: number) => void;
}> = ({ markers, readOnly, onNote, onCommit, onRemove }) => {
  if (markers.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5" aria-label="Chart markers">
      {markers.map(({ marker, index }, n) => (
        <li key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-5 h-5 shrink-0 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: marker.color }}
          >
            {n + 1}
          </span>
          <span className="w-28 shrink-0 text-xs text-gray-500">{describeMarker(marker)}</span>
          {readOnly ? (
            <span className="text-gray-700">{marker.note}</span>
          ) : (
            <>
              <input
                type="text"
                value={marker.note}
                maxLength={200}
                aria-label={`Note for marker ${n + 1}`}
                placeholder="What is here? e.g. sharp pain"
                onChange={(e) => onNote?.(index, e.target.value)}
                onBlur={onCommit}
                className="flex-1 min-w-0 h-8 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => onRemove?.(index)}
                aria-label={`Remove marker ${n + 1}`}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const ChartDrawingCanvas: React.FC<ChartDrawingCanvasProps> = ({
  chartType,
  value,
  onChange,
  disabled = false,
  label,
  required,
  error,
  helpText,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [chartImage, setChartImage] = useState<HTMLImageElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(700);
  const [canvasHeight, setCanvasHeight] = useState(300);

  const [items, setItems] = useState<ChartItem[]>([]);
  const [currentStroke, setCurrentStroke] = useState<ChartStroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [tool, setTool] = useState<'pen' | 'marker'>('pen');
  const [selectedColor, setSelectedColor] = useState(BRUSH_COLORS[0].color);

  // The chart in "base" units: BASE_WIDTH wide, as tall as the image's shape requires.
  const aspect = chartImage ? chartImage.naturalHeight / chartImage.naturalWidth : 0.545;
  const baseHeight = BASE_WIDTH * aspect;

  // ── Load chart image ──────────────────────────────────────────────────────
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = chartImageMap[chartType];
    img.onload = () => setChartImage(img);
  }, [chartType]);

  // ── Size canvas to container ──────────────────────────────────────────────
  useEffect(() => {
    if (!chartImage || !containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || 700;
      const ratio = chartImage.naturalHeight / chartImage.naturalWidth;
      setCanvasWidth(w);
      setCanvasHeight(Math.max(Math.round(w * ratio), 120));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [chartImage]);

  // ── Populate strokes and markers from saved value ─────────────────────────
  useEffect(() => {
    setItems(value?.doodle_data ?? []);
  }, [value]);

  // ── Export composite PNG and notify parent ─────────────────────────────────
  const exportAndNotify = useCallback(
    (latest: ChartItem[]) => {
      if (!onChange) return;
      // Defer so Konva has rendered the new stroke
      setTimeout(() => {
        try {
          const dataURL = stageRef.current?.toDataURL({ pixelRatio: 1.5 }) ?? null;
          onChange({ canvas_image: dataURL, doodle_data: latest, chart_type: chartType });
        } catch (err) {
          console.error('Failed to generate canvas image:', err);
        }
      }, 60);
    },
    [onChange, chartType],
  );

  // ── Drawing handlers ──────────────────────────────────────────────────────
  const getPos = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition() ?? null;
    if (!pos) return null;
    const scale = canvasWidth / BASE_WIDTH;
    return { x: pos.x / scale, y: pos.y / scale };
  };

  const placeMarker = (pos: { x: number; y: number }) => {
    const x = Math.min(Math.max(pos.x / BASE_WIDTH, 0), 1);
    const y = Math.min(Math.max(pos.y / baseHeight, 0), 1);
    const where = locate(chartType, x);
    const marker: ChartMarker = {
      tool: 'marker',
      color: selectedColor,
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
      view: where?.view ?? null,
      side: where?.side ?? null,
      note: '',
      chart_version: CHART_VERSION,
    };
    const next = [...items, marker];
    setItems(next);
    exportAndNotify(next);
  };

  const handlePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (disabled) return;
    e.evt.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    if (tool === 'marker') {
      placeMarker(pos);
      return;
    }
    setIsDrawing(true);
    setCurrentStroke({
      tool: 'pen',
      color: selectedColor,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      points: [pos.x, pos.y],
    });
  };

  const handlePointerMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing || !currentStroke || disabled) return;
    e.evt.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    setCurrentStroke((prev) =>
      prev ? { ...prev, points: [...prev.points, pos.x, pos.y] } : prev,
    );
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    const next = [...items, currentStroke];
    setItems(next);
    setCurrentStroke(null);
    exportAndNotify(next);
  };

  const handleClear = () => {
    setItems([]);
    setCurrentStroke(null);
    onChange?.({ canvas_image: null, doodle_data: [], chart_type: chartType });
  };

  const handleUndo = () => {
    const next = items.slice(0, -1);
    setItems(next);
    exportAndNotify(next);
  };

  const handleRemove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    exportAndNotify(next);
  };

  const handleNote = (index: number, note: string) =>
    setItems((prev) => prev.map((item, i) => (i === index && isMarker(item) ? { ...item, note } : item)));

  const markers = items.flatMap((item, index) => (isMarker(item) ? [{ marker: item, index }] : []));

  const name = chartLabel[chartType];

  // ── Disabled / Read-only mode ─────────────────────────────────────────────
  if (disabled) {
    const savedImg = value?.canvas_image;
    const finalImg = savedImg || chartImageMap[chartType];
    const savedMarkers = (value?.doodle_data ?? []).flatMap((item, index) => (isMarker(item) ? [{ marker: item, index }] : []));
    return (
      <div>
        {label && (
          <p className="text-xs font-medium text-gray-600 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
        )}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <img src={finalImg} alt={name || 'Chart Annotation'} className="max-w-full h-auto block" />
        </div>
        <MarkerList markers={savedMarkers} readOnly />
        {helpText && <p className="text-xs text-gray-400 mt-1 italic">{helpText}</p>}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  const toolButton = (id: 'pen' | 'marker', text: string, icon: React.ReactNode) => (
    <button
      type="button"
      aria-pressed={tool === id}
      onClick={() => setTool(id)}
      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
        tool === id ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {icon}
      {text}
    </button>
  );

  // ── Edit / Draw mode ──────────────────────────────────────────────────────
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-2 px-3 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
        {toolButton('pen', 'Pen', <PenLine className="w-3.5 h-3.5" />)}
        {toolButton('marker', 'Marker', <MapPin className="w-3.5 h-3.5" />)}

        {/* Color swatches */}
        {BRUSH_COLORS.map(({ label: colorLabel, color }) => (
          <button
            key={color}
            type="button"
            title={colorLabel}
            aria-label={colorLabel}
            onClick={() => setSelectedColor(color)}
            className={`w-6 h-6 rounded-full border-2 transition-transform focus:outline-none ${
              selectedColor === color
                ? 'border-gray-700 ring-2 ring-offset-1 ring-gray-400 scale-110'
                : 'border-gray-300 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}

        <div className="flex-1" />

        {/* Undo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={items.length === 0}
          title="Undo the last stroke or marker"
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>

        {/* Clear */}
        <button
          type="button"
          onClick={handleClear}
          disabled={items.length === 0}
          title="Clear all annotations"
          className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="rounded-xl border border-gray-200 overflow-hidden bg-white select-none"
        style={{ cursor: 'crosshair', touchAction: 'none' }}
      >
        {chartImage && canvasWidth > 0 && canvasHeight > 0 ? (
          <Stage
            ref={stageRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            {/* Layer 1: Chart image */}
            <Layer>
              <KonvaImage image={chartImage} width={canvasWidth} height={canvasHeight} />
            </Layer>

            {/* Layer 2: Saved strokes, markers + current in-progress stroke */}
            <Layer scale={{ x: canvasWidth / BASE_WIDTH, y: canvasWidth / BASE_WIDTH }}>
              {items.map((item, i) =>
                isMarker(item) ? null : (
                  <Line
                    key={i}
                    points={item.points}
                    stroke={item.color}
                    strokeWidth={item.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                  />
                ),
              )}
              {currentStroke && (
                <Line
                  points={currentStroke.points}
                  stroke={currentStroke.color}
                  strokeWidth={currentStroke.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {markers.map(({ marker, index }, n) => (
                <React.Fragment key={`m-${index}`}>
                  <Circle
                    x={marker.x * BASE_WIDTH}
                    y={marker.y * baseHeight}
                    radius={MARKER_RADIUS}
                    fill={marker.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <KonvaText
                    x={marker.x * BASE_WIDTH - MARKER_RADIUS}
                    y={marker.y * baseHeight - 5.5}
                    width={MARKER_RADIUS * 2}
                    align="center"
                    text={String(n + 1)}
                    fontSize={11}
                    fontStyle="bold"
                    fill="#ffffff"
                    listening={false}
                  />
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        ) : (
          <div
            className="flex items-center justify-center bg-gray-50"
            style={{ height: `${canvasHeight}px` }}
          >
            <p className="text-sm text-gray-400">Loading {name}…</p>
          </div>
        )}
      </div>

      <MarkerList
        markers={markers}
        readOnly={false}
        onNote={handleNote}
        onCommit={() => exportAndNotify(items)}
        onRemove={handleRemove}
      />

      {helpText && <p className="text-xs text-gray-400 mt-1 italic">{helpText}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

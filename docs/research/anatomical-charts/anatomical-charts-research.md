# Anatomical charts: research notes

**Status:** Research (2026-10-31). Markers with view / side and the Back chart were implemented the same day (see the CHANGELOG); SVG regions and new assets remain Proposed.
**Related:** [licensing-inventory.md](licensing-inventory.md) · [chart-manifest.json](chart-manifest.json)

## What exists (verified in code)
- Chart field type `chart` with `ChartType = 'body' | 'head' | 'hand' | 'feet'` ([clinicalTemplate.ts](../../../frontend/src/types/clinicalTemplate.ts)). Back / spine is not a type yet.
- Images map to `frontend/src/assets/charts/*-chart.webp` in [chartMapping.ts](../../../frontend/src/features/clinical-template/utils/chartMapping.ts); all four are 2816 x 1536 raster, no selectable regions.
- Drawing: [ChartDrawingCanvas.tsx](../../../frontend/src/features/clinical-template/components/ChartDrawingCanvas.tsx), react-konva freehand pen with 6 colours, undo and clear. Strokes are stored apart from the image, so the original is never altered.
- Persistence: `ClinicalNote.chart_annotation_data`, shaped `{ field_id: { chart_type, doodle_data: [strokes] } }`, copied into `ClinicalNoteVersion`.

## Proposal
- SVG becomes the primary format for new interactive charts; the existing `.webp` charts keep working for old notes.
- A chart manifest per asset: id, version, file, `viewBox`, licence block, views, regions. Region IDs come only from the real SVG paths; none are written until an SVG is inspected.
- Annotation data extends the existing shape additively: `asset_id`, `asset_version`, `points`, `regions`, `strokes`. Coordinates are normalised 0 to 1 of the `viewBox`. A record without a version is the legacy raster chart.
- Views needed: body front and back, back / spine, head front and side; body sides second.

## Open decisions
1. Confirm the creator and licence of the existing charts.
2. Whether to commission original SVGs for the missing side, head and spine views.
3. Legal check of the CC0 source's personality-rights note and of Servier terms section 6.

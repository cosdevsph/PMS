# Outcome measures: research notes

**Status:** Research (2026-10-31). The library, assessments and progress graph were implemented the same day with two generic measures (see the CHANGELOG); licensed instruments remain Proposed.
**Related:** [licensing-inventory.md](licensing-inventory.md) · [dataset-inventory.json](dataset-inventory.json) · [../anatomical-charts/anatomical-charts-research.md](../anatomical-charts/anatomical-charts-research.md)

## What exists in the product (verified in code, 2026-10-31)
- `records.OutcomeMeasure` ([models.py](../../../backend/apps/records/models.py)): patient, practitioner, free-text `measure_name`, date, `score`, `max_score`, notes. No definition, no item answers, no version, no case or appointment link.
- API: `/api/outcome-measures/` (router in `backend/config/urls.py`) with a `trends/` action. No frontend calls it. The patient merge transfers its rows.
- Feature key `outcome_measures` already exists in the permission matrix.
- The Reports → "Outcome Measures" page actually shows clinical-note completion rates, not outcome scores.

## Score metadata taken from owner or summary pages (no item text)
| Instrument | Items | Item scale | Total range | Source |
|---|---|---|---|---|
| NPRS | 1 | 0 to 10 | 0 to 10 | SRALab |
| RMDQ | 24 | yes / no, 1 point each | 0 to 24 | SRALab |
| ODI | 10 | 0 to 5 | 0 to 50 raw, shown as 0 to 100 % | SRALab |
| NDI | 10 | 0 to 5 | 0 to 50 raw, or 0 to 100 | SRALab |
| Bournemouth Back Questionnaire | 7 | 0 to 10 | 0 to 70, higher is worse | PMC9744002 |
| QuickDASH | 11 | 1 to 5 | scaled 0 to 100; at most one missing item | IWH |
| KOOS | 42 in 5 subscales | 0 to 4 | each subscale 0 to 100 (100 = no problems) | koos.nu |
| LEFS | 20 | 0 to 4 | 0 to 80 | SRALab |
| PROMIS | varies | varies | T-score, mean 50, SD 10, via the HealthMeasures scoring service | HealthMeasures |

**Not recorded on purpose:** interpretation bands and MCID values. They are added only when taken from a primary source. No scoring formula is invented; each is copied from the owner's manual when licensed.

## Proposed model (not built)
- New app `backend/apps/outcomes/`, separate from `records` and from clinical notes.
- Master definitions: version-controlled JSON loaded into immutable rows (`code` + `version`).
- Patient assessments store the definition version, raw answers (encrypted with `FieldEncryptor`), computed scores and a snapshot of the scoring rules, so a master update never changes history.
- Clinic enable / disable per definition; disabling never deletes results.
- Scoring runs on the server only. Methods limited to `sum | mean | percent_of_max | subscale_sum | external`.
- Answer types for v1: single choice, yes / no, numeric, NRS 0 to 10, VAS slider. The slider stores the exact number, is empty until touched, and is used only for instruments that are slider scales.
- Clinic-created measures are a later, separate feature, flagged unvalidated.

## Example definition shape (structure only)
```json
{
  "schema": "malasakit.outcome-definition/1",
  "code": "NPRS", "version": "1.0.0", "category": "pain",
  "licence": { "category": "D", "source_url": null, "verified_on": null },
  "items": [ { "id": "q1", "type": "nrs", "min": 0, "max": 10, "step": 1, "required": true } ],
  "scoring": { "method": "sum", "items": ["q1"], "range": [0, 10], "direction": "higher_worse",
               "missing": { "max_missing": 0, "rule": "invalid" } },
  "interpretation": null, "mcid": null
}
```

## Open decisions
1. Which licences to buy first (DASH / QuickDASH, ODI / NDI, KOOS / HOOS, PROMIS).
2. Confirm RMDQ public-domain status at the source.
3. New `outcomes` app versus extending `records.OutcomeMeasure` (recommended: new app, old table kept read-only).
4. Patient self-completion in v1 (recommended: later).

# FIRST-USE-DATA-MANIFEST.md

## First-Use Starting Data Manifest

> Task: QC-100-FINAL-019 · Derived from `scripts/data/master-data-catalog.ts`.
> Status is evidence-derived: a record is READY only when an APPROVED + GOVERNED
> source exists. Missing authority is an external dependency, never "ready".
> PASS ≠ RELEASED. No production seeding is implied or performed.

## How to read this manifest

- **READY** — an APPROVED governed surface exists and local tooling can load it.
- **MISSING-VALUES** — the surface exists, but no approved values are supplied
  in this repository; real values must come from the accountable owner.
- **MISSING-AUTHORITY** — no approved schema/values exist; blocked on a decision.
- **Owner** is a role/owner slot or a named dependency (never an invented person).

## Ready / missing register

| Entity | State | Reason | Owner / dependency |
| ------ | ----- | ------ | ------------------ |
| Equipment (`qc.equipment`) | READY (schema + importer) · MISSING-VALUES (real list) | Governed table + UNIQUE key + constraints exist; importer verified | Admin (ROLE-MATRIX §43–48); approved equipment list from operations owner |
| Controlled template (`qc.inspection_templates`, `qc.lab_test_templates`) | READY (schema) · MISSING-VALUES + MISSING-AUTHORITY (import path) | Governance + P-06 lifecycle exist; multi-level import needs an approved template source | P-06 authority set; approved template source via 013/026 |
| Site | MISSING-AUTHORITY | Organizational scope `UNCONFIRMED — DO NOT MIGRATE` (§16) | 013/026 — organizational structure approval |
| Department | MISSING-AUTHORITY | Same as site; free text only | 013/026 — organizational structure approval |
| Item | MISSING-AUTHORITY | Free-text code, no governed catalog; BD-020 open | 013 — BD-020 controlled reference-data decision |
| Supplier | MISSING-VALUES | Descriptive text only; no supplier master or code list | 013 — BD-020 controlled reference-data decision |
| Method (test/analysis) | MISSING-AUTHORITY | SOURCE-DEPENDENT on a controlled source (§3) | 013 — laboratory controlled-source owner |

## Counts

| Bucket | Count |
| ------ | ----: |
| Entities inventoried | 7 |
| READY governed surfaces | 2 |
| MISSING-VALUES (approved values needed) | 1 (+1 partial) |
| MISSING-AUTHORITY (decision needed) | 4 |

## What the local pack can do today

- Preflight and load **disposable** equipment fixtures into a task-owned
  database only (see `Documents/MASTER-DATA-STARTING-DATA.md` §4).
- Produce a reconciliation report and rejection classification for any dataset.
- It **cannot** and **must not** invent site/department/item/supplier/method
  values or approved template content.

## Next inputs required from owners

1. Approved organizational structure (site/department) decision — 013/026.
2. BD-020 controlled reference-data scope (item/supplier) — 013.
3. Laboratory controlled-source confirmation for methods — 013.
4. Approved equipment list and approved template content from the operations
   and P-06 owners.

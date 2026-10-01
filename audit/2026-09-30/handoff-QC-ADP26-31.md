# QC-ADP26-31 — Performance budget and representative measurement

**State: PARTIAL.** Source N+1 on calibration creation is removed and focused contracts pass. Representative PostgreSQL 18 measurements and full browser performance measurements remain NOT VERIFIED.

## Changed

- `/assets/calibrations/new` previously called the eligibility use case once per equipment option. For the 80-equipment representative fixture, source shape was 1 list query plus 80 equipment reads, 80 maintenance reads, and up to 80 current-calibration reads: **161–241 SQL statements by source-count calculation**.
- It now calls `assessMany` once. The assessment reader batch-fetches equipment, current calibration rows (when any exist), and in-progress maintenance rows. The page list plus assessment therefore uses **3–4 SQL statements by source inspection**, independent of the option count. This is a source bound, not a PostgreSQL observation.
- Authorization remains per source record (`PERM-EQP-VIEW`, `PERM-CAL-VIEW`, and `PERM-MNT-VIEW` where a record exists). The page remains read-only on GET. There is no transaction, audit, outbox, schema, or migration change in this read path. The existing POST action still revalidates through its application use case.
- Added `scripts/performance/budgets.qc-adp26-31.json`. It carries the prior report’s proposed web/query budgets, the 4-statement selector bound, an existing GLB cap of 1 MiB, and zero script/network/WebGL budgets for the static authenticated background. Budgets are marked `PROPOSED_NOT_APPROVED_SLO`; INP and hardware GPU frame-time limits remain unset pending measurement and owner approval.

## Candidate and environment

- Audit-requested SHA: `0b1bb21bb3b4eca77862dbba1da8623044e96355`.
- Rebound candidate: HEAD `9ee20b9846c47fdc8303c5e5862a589ce041ea1f`, branch `main`; initial worktree was clean. Current dirty source fingerprint is recorded by the final verification run context in `.ci-results/run-context.json` (excluded from source control).
- Node used for focused tests/build: `v24.20.0` (project contract). Bundled pnpm reports `11.25.0`; the Corepack shim could not create its cache under the default home path, so verification binaries were invoked directly with the contract Node runtime.
- Source migration head at build: `0043_controlled_document_source_binding`. No migration was needed. Installed local PostgreSQL is `14.19`; `pg_isready` found no running server. PostgreSQL 18 disposable dataset run is **BLOCKED**; no database was used and no DB writes occurred.
- The existing synthetic performance seed is deterministic and defines 80 equipment / 240 calibration records (alongside larger workload tables). It was not run because this host has neither a PostgreSQL 18 server nor a container runtime suitable for the required database proof.

## Evidence

| Check | Result | Evidence |
|---|---|---|
| Focused equipment eligibility + static background tests | PASS, 17/17 | `vitest run tests/unit/assets/equipment-eligibility.test.ts tests/unit/ui/system-background.test.ts` on Node 24.20.0 |
| Batch positive/negative/invalid inputs | PASS | Unit contracts cover eligible current calibration, no current calibration, invalid ID, and denial when a valid equipment row’s calibration source permission is absent. |
| SQL statement bound | PASS by source inspection; runtime NOT VERIFIED | One equipment list statement plus three batched source statements, with calibration query omitted for an empty current-calibration set. No PG18 query counter/latency evidence. |
| Static SystemBackground | PASS for source contract | Component is CSS-only and `data-motion="static"`; focused test confirms no Lottie runtime/WASM/asset request or script. |
| Login GLB | PARTIAL | The local browser visibly rendered the separate login Three.js scene. `public/assets/qc-medical-hero.glb` is 943,748 bytes; code caps DPR at 1.65 desktop, 1.35 tablet, and 1.15 mobile. No GPU timer or frame-time sample was collected. |
| Login LCP / INP / CPU / GPU; authenticated route p95 and payload | NOT VERIFIED | No raw browser timing capture on the controlled candidate. INP needs a measured interaction; GPU frame timing needs a hardware timer capture. |
| Representative page p95 / response payload | BLOCKED | Requires the isolated PostgreSQL 18 fixture and authenticated performance session. PostgreSQL 14.19 was not substituted. |
| `astro check` | FAIL, 1 unrelated error | Existing `src/pages/ai-advisory.astro` nullable `requestButton` diagnostic; no diagnostics remain in changed files. |
| Astro production build and candidate-bound evidence | PASS | Exact run context, source fingerprint, candidate SHA, migration head, and artifact digests are recorded in the current `.ci-results/build.json` and `dist/release-identity.json`; build evidence totals 1/1 PASS. |
| Direct browser, 320/375/768/1440 widths, 200% zoom, AT, UAT | NOT VERIFIED | Local `/login` was rendered and observed; the full viewport/AT/UAT matrix was not run. |

## Budgets and remaining decisions

The historical QC-100-FINAL-007 report proposes typical register TTFB p95 ≤100 ms, unfiltered tasks ≤150 ms, laboratory ≤200 ms, list HTML ≤300 KB, LCP p95 ≤500 ms, CLS 0, 24-reader p95 ≤600 ms, and critical-read SQL p95 ≤50 ms. These remain **historical proposals, not approved SLOs**, per `Documents/PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md`. This task adds no new INP or GPU frame-time threshold without an interaction and hardware measurement.

| Page / finding | Closed | Still open |
|---|---|---|
| `/assets/calibrations/new` / `QC-PAGE-F-031` | N+1 source fan-out replaced with bounded batch reads; role checks preserved. | PG18 statement count, query p95, HTML payload, and authenticated page measurement. |
| `/login` / `QC-PAGE-F-031` | Existing separate GLB scene rendered locally; asset size and source DPR caps recorded. | Same-candidate LCP/INP/CPU/GPU measurement and performance comparison. |
| Authenticated pages using `SystemBackground` / `QC-PAGE-F-031` | Static CSS-only source contract verified. | Real page timing on representative authenticated data. |
| Remaining affected routes | None measured for this finding in this run. | Representative route coverage, query p95/payload, and candidate-bound browser evidence. |

QC-ADP26-12 remains an unresolved dependency for broad route performance acceptance. Keep all affected page-card scores unchanged; this partial source change does not close `QC-PAGE-F-031` system-wide and does not support a 100% claim.

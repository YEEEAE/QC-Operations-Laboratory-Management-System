# QC-ADP-10 — Report parity handoff

**Task:** تكافؤ التقارير — `/reports`, `/reports/[reportCode]`  
**State:** PARTIAL / NO-GO. Source and PostgreSQL candidate checks pass; the live authenticated print check and a policy-backed persisted cross-request snapshot are not verified.  
**Source HEAD:** `4eef818421e1091528b677a505ce92a5cc78dcc5` (`main`, local working tree changed).  
**Reporting source/test fingerprint:** `sha256:08b9d66dad690e2fbb7ae2435b2c2dbfc4fc7b528f80b16a35da3cfa9fdc6410` (12 affected source/test files; file paths and full contents hashed in sorted path order).  
**Source schema head:** `0041_document_review_queue_indexes` (41 migrations). Testcontainers applied the source migrations to a disposable PostgreSQL 18 database. No production or shared database was changed.  
**Test actors:** synthetic ACTIVE `EMPLOYEE` actors with explicit `OWN` report view/run/export permissions; negative export actor lacks the format-specific permission. This does not establish a live role/grant.

## Root cause

The report detail page and download route already used `parseReportFilters()` and `RunReportUseCase`; that canonical query applies `created_by = actor.id`, the server-side filters, and a deterministic `receiving_date DESC, id DESC` order. Print is the same server-rendered table and provenance block.

The Astro Action export path diverged at the delivery boundary: its input schema accepted only `from` and `to`, so action-based exports silently dropped `lot`, `itemCode`, `workflowState`, `inspectionResult`, and `releaseSystem`. The prior PostgreSQL fixture also lacked multiple report dates and compared CSV receiving numbers/counts without decoding every XLSX cell. It did not exercise the print surface.

The repair makes the Action accept all seven report filters and sends them through the shared strict parser. A shared provenance builder now supplies the screen, CSV, and XLSX with the same source, actor scope, period, normalized filter order, count, status, and registered sort description. CSV quotes the sort description correctly; XLSX carries the same metadata. The generated-at time is explicit UTC for each output generation. It does not add report-run persistence: each page render/print and each later export request re-runs the canonical query; if source rows change between separate HTTP requests, historical byte-for-byte snapshot identity is not guaranteed. `REQ-RPT-005` lists `report_runs`, while `BR-RPT-005` says generation context applies “where applicable” and the data model describes this as logical metadata. The retention and persistence rule for report-run snapshots must be reconciled by the owner before adding persisted row snapshots/artifacts. This dependency remains BLOCKED.

## Acceptance checklist and results

The task-specific checklist was fixed at six checks per affected route before implementation. For `/reports`, only registry permission/link discovery applies: its source maps `registry.list()` definitions into cards and contains no filter controls, result dataset, count, export, or print surface (`src/pages/reports/index.astro:7-10`). The route matrix describes the registry as an authorized read model; it is not being used alone to justify N/A.

| Route | Check | Result | Evidence / boundary |
|---|---|---|---|
| `/reports` | Registered report entry is permission-filtered and links to its registered detail code | SOURCE PASS; LIVE NOT VERIFIED | `src/pages/reports/index.astro:7-10`; live page was not exercised on this candidate. |
| `/reports` | Filter controls and selected filter state | N/A | No filter controls on the registry source: `src/pages/reports/index.astro:11-14`. |
| `/reports` | Result count and stable row ordering | N/A | Registry maps report definitions only; it does not render result rows/counts: `src/pages/reports/index.astro:7-14`. |
| `/reports` | CSV/XLSX row parity and formula safety | N/A | No export action/link or data cells on this route: `src/pages/reports/index.astro:11-14`. |
| `/reports` | Print output and accessible result table | N/A | No result table or print surface on this route: `src/pages/reports/index.astro:11-14`. |
| `/reports` | Dataset source, period, generated time, and count provenance | N/A | These describe report runs and are rendered on the detail route; registry source only renders catalog metadata: `src/pages/reports/index.astro:7-14`. |
| `/reports/[reportCode]` | Screen and export use the same registered source, actor scope, SQL filters, and stable order | PASS | `tests/integration/reporting/report-export-parity.test.ts`; disposable PG18. |
| `/reports/[reportCode]` | All seven filters are preserved and validated on page, download, and Action paths | PASS | `tests/unit/reporting/report-filter-parser.test.ts`; multi-filter populated PG18 fixture. Authenticated browser execution of the Action is NOT RUN. |
| `/reports/[reportCode]` | Inclusive date bounds, multi-date exclusions, count, and stable tie ordering | PASS | Populated PG18 fixture with before/on/after dates and two same-date rows. |
| `/reports/[reportCode]` | CSV and XLSX match every displayed column/value in order and count | PASS | PG test decodes CSV and stored XLSX worksheet cells against the screen `ReportDataset`. |
| `/reports/[reportCode]` | Formula neutralization and export authorization denial | PASS | Formula-like descriptions checked in CSV/XLSX; view/run-only actor is denied by format-specific export permission; cross-owner rows are excluded. |
| `/reports/[reportCode]` | Screen/print/CSV/XLSX provenance agrees on source, scope, period, filters, sort, status, and count; generated time is explicit UTC | SOURCE PASS; E2E NOT RUN | Screen and both exporters call `createReportProvenance`; PG test checks matching source/period/sort, rows/cells, and count; SSR uses the same `report.rows` for table and print stylesheet. Authenticated E2E credentials were unavailable; no live screenshot was captured. |

No quality percentage is claimed. `/reports` remains NOT VERIFIED live. The report detail route has five applicable checks PASS and one live print/E2E check NOT RUN; therefore neither affected route is READY for final acceptance.

## Page closure metric

The fixed denominator is six checks per route; N/A checks are excluded only with the source reasons above. `/reports`: 1 applicable check, 0 PASS, 1 NOT VERIFIED because the permission-filtered registry was not exercised as an authenticated route on this candidate (**0/1 = 0%**). `/reports/[reportCode]`: 6 applicable checks, 5 PASS, 1 NOT RUN for authenticated print/browser verification (**5/6 = 83.3%**). These are route-check closure ratios only; the remaining live and policy blockers keep both routes NO-GO.

## Verification

| Evidence | Result |
|---|---|
| `tests/integration/reporting/report-export-parity.test.ts` on disposable PG18 via Docker/Testcontainers | **9/9 PASS** (includes scope, filters, boundaries, ordering, all CSV/XLSX cells, provenance metadata, injection, and permission denial). |
| Focused parser/export/provenance/report suite (five non-container files plus the PG18 parity file) | **35/35 PASS**. |
| Focused ESLint | **PASS**. |
| Prettier check for applicable changed TypeScript/test/Markdown files | **PASS**; `.astro` formatting was not checked because the installed Prettier has no Astro parser plugin. |
| `astro check` via project binary with Node `24.20.0` | **0 errors / 0 warnings / 89 hints** on the earlier task run; final check on this updated candidate: **0 errors / 0 warnings / 89 hints**. |
| `astro build` via project binary with Node `24.20.0` | **PASS**. Build emitted existing dependency/chunk warnings; no release identity was generated. |
| `requirements:check` | **FAIL** — guard reports `REQ-READY-003` missing an owning-task mapping. The modified evidence row was `REQ-AUDF-004`; no report requirement or owner decision was changed. |
| Authenticated print E2E | **NOT RUN** — `QC_E2E_LOGIN_IDENTITY` and `QC_E2E_PASSWORD` are not configured. |
| Live deployment, applied production schema/role, UAT, retained run snapshot policy | **NOT VERIFIED / BLOCKED**. Existing read-only health history reports live head `0018`; it is not rechecked here and does not represent this source candidate. |

The source candidate adds no migration. Formula-injection test actors are synthetic; live roles/scopes and exact deployed release identity remain outside this evidence.

## Source and diff references

- Root-cause boundary: `src/actions/reports.ts:30` maps Action input through `parseReportFilterValues`; `src/modules/reporting/application/parse-report-filters.ts:79` adapts all seven fields into the same `parseReportFilters` contract used by the detail route.
- Shared database predicate and deterministic order: `src/modules/reporting/infrastructure/postgres-report-query.ts:40-48` (`created_by = actor.id`, inclusive date bounds, optional filter predicates, `receiving_date DESC, id DESC`).
- Shared display/export metadata: `src/modules/reporting/application/report-provenance.ts:8-38`; page consumes it at `src/pages/reports/[reportCode].astro:21`, export at `src/modules/reporting/application/export-report.ts:58`; CSV/XLSX serialize its sort field in their metadata blocks.
- Regression evidence: `tests/integration/reporting/report-export-parity.test.ts` exercises multiple owners/dates, boundaries, all row/cell values, sort, scope, and formula safety on PG18; `tests/unit/reporting/report-provenance.test.ts` fixes metadata labels/order; authenticated print/Action assertions are in `tests/e2e/files-reports.spec.ts` but NOT RUN.

## Requirement and route handoff

- `QC-PAGE-F-011` and improvement `I-05` are addressed locally by the common parser for Action exports plus full-row parity fixtures. The finding is not closed for live/exact-release evidence.
- `RT-REPORT-001` and `RT-REPORT-002` cards in `audit/2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md` point here; both remain NOT VERIFIED for live acceptance.
- `REQ-RPT-001..007` and `REQ-AUDF-004` remain approved contracts; this handoff does not alter policy. `REQ-RPT-005` persistence semantics and retention need owner reconciliation before adding a durable report-run snapshot.
- Dependencies QC-ADP-01/08 remain relevant to live schema/grant scope. No finding is marked READY while applicable checks remain NOT RUN/BLOCKED.

## Changed paths

- `src/actions/reports.ts`
- `src/modules/reporting/application/parse-report-filters.ts`
- `src/modules/reporting/application/report-provenance.ts`
- `src/modules/reporting/application/export-report.ts`
- `src/modules/reporting/domain/report-definition.ts`
- `src/modules/reporting/infrastructure/csv-exporter.ts`
- `src/modules/reporting/infrastructure/xlsx-exporter.ts`
- `src/pages/reports/[reportCode].astro`
- `tests/unit/reporting/report-filter-parser.test.ts`
- `tests/unit/reporting/report-provenance.test.ts`
- `tests/integration/reporting/report-export-parity.test.ts`
- `tests/e2e/files-reports.spec.ts` (new authenticated print/action-parity case; NOT RUN)
- This handoff and the two page cards / requirement evidence index.

No commit, push, migration, deployment, or production write was performed.

# QC-POST-100-009 — representative search, notifications, dashboard and reports

Date: 2026-10-02  
State: **PARTIAL** — source and focused checks are present on the frozen local candidate. PostgreSQL 18, authenticated route/rendering, print/CSV/XLSX parity against populated database rows, assistive technology and human UAT remain blocked or not verified.

## Candidate binding

- Requested historical candidate: `6059e177438d8ae110c99084d32758b048f22cd2`; not the current source candidate. Historical section ratings and `verification-data.json` were not carried forward as current evidence.
- Final source candidate: HEAD `35284d53578b66b71adcf7f3e5b5a80e38c514a8`, branch `main`, with local changes. Its final source fingerprint, build run, release identity and artifact digest are bound in `.ci-results/build.json` and `.ci-results/QC-POST-100-009.json` after the final freeze.
- Source migration head: `0043_controlled_document_source_binding.sql`; the applied schema head is not verified.
- Build, focused tests, typecheck and release verification ran with Node `v24.19.0`, below the project contract `>=24.20.0 <25`. Treat those passes as **environment-qualified**, not contract-conforming final proof. No current Node 24.20 runtime was available.

## Current source and evidence

| Domain | Current source / focused result | Remaining evidence |
|---|---|---|
| `/search` (F-014) | Per-source read grants and supported scopes precede result rows/counts; task-title search, 25-row cursor pages, exact authorized total and stable ordering are implemented. Existing PostgreSQL fixture describes readable-other-owner, denied-existing and 37-row/25+ paging cases. | Search scope integration was attempted; all 6 tests skipped because Testcontainers could not find a container runtime. Exact PostgreSQL totals, actor scopes and runtime latency are **BLOCKED**. |
| `/notifications` (F-015) | Recipient-scoped read/mark-read, idempotent state, newest-first 50-row pages, exact count; dashboard unread metric uses the full total. Memory-backed 51-row test covers 50+1 pages, exact 51/50 totals, distinct IDs, other-recipient isolation, denial and replay. | Added `tests/integration/shared/notification-paging-parity.test.ts` for the same ordering, 50+1, count, private-row denial, read refresh and replay against PostgreSQL. Its setup was blocked before test execution by the missing container runtime. |
| `/dashboard`, `/work` (F-017) | Current source exposes count definitions (numerator, denominator, grain, state, actor scope, freshness and drill-down), separates unavailable from zero, and orders attention/decision queues before summaries. Dashboard source assertion now matches the approved current review-queue description. | Dashboard PostgreSQL register-bounds tests (3) skipped at container setup. Exact populated count/list parity and authenticated next-action usability are **NOT VERIFIED**. |
| `/reject-reports` (F-029) | Exact decimal strings, per-type and per-unit aggregates, filter-aware drilldowns and server append/version/audit/outbox transaction are present. Unit suite includes large exact decimals, mixed-unit separation, zero denominator and append guards. | Reject Reports PostgreSQL integration (8) skipped at container setup. Database rollback, no-double-count, changed-source/state, concurrency/replay and authenticated screens are **BLOCKED/NOT VERIFIED**. QC/QMS precision and RM/good-unit semantics remain owner decisions; no policy was added. |
| `/reports`, report detail and reject print (F-030) | One canonical report query and request-local digest bind actor/filter/columns/rows; downloads deny a changed dataset. Screen/CSV/XLSX provenance and formula safety are implemented; XLSX decimal text avoids float rounding; print branches are informational and omit mutation controls. | Focused report tests passed in the 78-test run. PostgreSQL report parity integration (10) skipped at container setup; populated DB filter/scope/order and CSV/XLSX parity, concurrent source-change denial, authenticated downloads and A4 page-cut rendering remain **BLOCKED/NOT VERIFIED**. |

## Verification run

- Focused unit/source regression: **78/78 PASS** across 11 files, including notifications, dashboard, reporting and reject-reports; memory/fake-backed cases are not PostgreSQL evidence.
- Candidate build: **PASS, environment-qualified** under Node 24.19.0; build identity was verified against the candidate. The engine warning reported the required minimum Node 24.20.0.
- `astro check`: **PASS, environment-qualified**, 1,035 files, 0 errors, 0 warnings, 114 hints.
- `release:verify`: **PASS** for `rel-0e63ae17f9de0040` and SHA `35284d53578b66b71adcf7f3e5b5a80e38c514a8`.
- `git diff --check`: **PASS**.
- PostgreSQL integration attempt: **BLOCKED before fixtures** — Testcontainers error `Could not find a working container runtime strategy`; 28 cases skipped across notification paging, search scope, reporting parity, dashboard register bounds and reject reports.
- Authenticated browser/HTTP, manual AT/responsive/keyboard, rendered print, human UAT: **NOT VERIFIED**. No credentials, production database, or human sign-off were used.

## Report snapshot and retention decision

Current request-local digests detect a changed source between screen render and download but do not provide a durable historical snapshot or stored `report_run`. `REQ-RPT-005`, `BR-RPT-005`, and the data dictionary leave persistence/retention unresolved. Reporting/QMS owner reconciliation is required before adding durable snapshot storage or selecting a retention period. Runtime remains read-only with no durable report history introduced.

## Final status

`QC-POST-100-009`: **PARTIAL / NOT CLOSED**. Do not transfer historical audit evidence from SHA `6059e177438d8ae110c99084d32758b048f22cd2`. No commit, push, merge, deployment, production database access, migration, or human UAT was performed.

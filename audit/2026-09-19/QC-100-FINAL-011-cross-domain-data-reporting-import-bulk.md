# QC-100-FINAL-011 — Cross-domain data, reporting, import and bulk workflows

> Date: 2026-09-19 · Candidate HEAD: `f2a8172063d6b855dc94cd2351e6b70bd55c0b60` (`main`), dirty tree (4 files, +85/−2)
> Content fingerprint of working diff (SHA-256 of `git diff` + `git diff --cached`): `08c532863c258822d1cb11c01465441e630e63da88d9fa9273049fe2a715a2d5`
> Environment: macOS host, Node v22.22.3 (outside declared `>=24.20.0 <25` contract — local results are not runtime-parity evidence), pnpm 11.25.0, disposable PostgreSQL 18.6 (Homebrew) on `127.0.0.1:55432`, TLS verify-full via `scripts/db/disposable-postgres.sh`; Docker unavailable on this host.
> Finding reference: QC-FINAL012-F-009 (integration suite failures/skips). Baseline report `653b58d2…` (maturity 45.8%, gates 0/19, NO-GO) remains the comparison baseline, not proof for this candidate.

## Scope executed

Source starting points resolved against the current repository: `src/shared/search`, `src/shared/outbox`, `src/modules/reporting`, `tests/integration/shared`, `tests/integration/reporting`. Primary domain ownership: 3, 37, 38, 39, 40, 64, 71, 72, 73, 74.

## 1. Literal %/_ search, scope, stable sorting — VERIFIED (re-proved) + filter repair

- Global search (`src/shared/search/postgres-search.ts`) already implements approved literal escaping (`%`/`_` escaped, `ESCAPE '\'`), actor-scoped WHERE clauses for all 11 entity types, and a stable total order (`ORDER BY businessId, entityType, entityId`). Reproduced with known authorized (6×`SRCH-A-*` for user A, 4×`SRCH-B-*` for user B) and unauthorized records: literal `%`/`_` queries match nothing, no cross-actor existence leak, stable ordering and stable disjoint limited pages. `tests/integration/shared/search-scope.test.ts` 6/6 PASS on live PG 18.6. Visibility was not widened.
- **Source repair (this task):** report substring filters `lot`/`itemCode` in `src/modules/reporting/infrastructure/postgres-report-query.ts` interpolated user input into `ILIKE '%…%'` without escaping, so `%`/`_` inside a filter value acted as pattern metacharacters (silent over-matching; `LOT-%` matched every lot). Added `literalLikeContains()` (escapes `\`, `%`, `_`; `ESCAPE '\'`) preserving the approved substring semantics. New regression in `tests/integration/reporting/report-export-parity.test.ts`: `LOT-%` → 0 rows, `LOT-1_0` → 0 rows (no `_` standing for `0`), literal `LOT-100` → exactly its row, identical on screen dataset and CSV export.

## 2. Outbox / notification deterministic ordering, replay, scope — VERIFIED + ordering repair

- **Source repair (this task):** `PostgresOutboxRepository.claim` ordered by `created_at` only; `created_at` is not unique, so a bounded claim (`LIMIT`) over tied timestamps had no deterministic order and could re-serve or skip events between runs. Added an `id` tie-break (`ORDER BY created_at, id`). New regression in `tests/integration/shared/notification-outbox-delivery.test.ts`: 5 events forced to one identical `created_at`; two bounded claims (3+2) return all 5 exactly once in the SQL-declared total order.
- Already implemented and re-proved on live PG: dedupe on enqueue (`uq_outbox_events__dedupe_key`, ON CONFLICT DO NOTHING), replay-safe delivery (handler replay after crash creates no duplicate notification; DB-enforced notification dedupe), recipient scope (recipient B sees nothing and cannot mark A's notification read), stable recipient listing order (`created_at DESC, id DESC`), idempotent mark-read, retry retention via `markRetry` (`last_error` + `available_at` deferral, 30 s), and failure isolation (a failed handler does not mark the event processed and does not rerun the business mutation — BR-NOT-005/REQ-NOT-004). Worker telemetry stays outcome-only, no payloads.
- Notification ≠ business action: the QC outbox handler (`qc-event-handler.ts`) only projects committed approval events into recipient-scoped notifications; business truth stays in the owning transaction. No change made.
- Retry backoff policy beyond the documented `attempt_count`/`available_at` durable-retry model is **not specified** in the approved documents; none was invented. Escalating backoff/max-attempt policy: BLOCKED — owner decision required via 013.
## 3. Report / export / print grain, scope, filters, date boundaries — VERIFIED within one registered report

- Exactly one report is registered: `quarantine-aging` (quarantine receiving register). Screen (`/reports/[reportCode]`), CSV, XLSX, and the print stylesheet all consume the same `RunReportUseCase` dataset — parity is structural, not re-implemented. Re-proved with 261 populated rows + 3 cross-user rows: identical row sets screen/CSV/XLSX, inclusive `from`/`to` date boundaries (single-day `from=to` returns the full day; `from` next day returns 0), deterministic byte-identical repeated exports, formula-injection neutralization, header-only export for authorized empty results, and export permission-denial (`AUTHZ_PERMISSION_MISSING`) for a view/run-only actor while the screen dataset remains available. Owner-scoped exports never disclose the other user's rows.
- Grain/scope note: the report query applies Actor (`created_by = actor.id`) and server-side filters; the OWN scope enforced by `authorize` in the use case matches that predicate. `PERM-RPT-RUN` does not grant an unrestricted dataset (PERMISSION-MATRIX §67). Unknown/unavailable values are preserved as SQL NULL → empty cell, never coerced to zero.
- Timezone/DST: the report's date columns are pure `DATE` (REQ-DATA-004) filtered against `from`/`to` date literals — no `TIMESTAMPTZ` in this report, so no midnight/DST boundary exists in this dataset. Invalid dates (non-`YYYY-MM-DD`) are rejected before the query with `VALIDATION_INVALID_DATE`; `from > to` rejected with `VALIDATION_INVALID_QUERY` (unit-level, `tests/integration/reporting/reports.test.ts`).
- `REQ-RPT-005` (generation metadata / `report_runs`) is conditional ("حيث applicable"); `report_artifacts` explicitly requires a retention policy that does not exist. No `report_runs` table is migrated; in-memory generation with no retained artifacts carries no persistence obligation today. Persisted report-run retention: BLOCKED — owner/retention decision via 013.

## 4. Reference-data, import and bulk inventory — BLOCKED on owner policy (no placeholder claimed)

Inventory of every required import/bulk path against approved sources:

| Path | Rule | Status in source | Decision |
|---|---|---|---|
| Lab measurement Excel paste / bulk entry | REQ-LAB-021, BR-LAB-023 (full validation), BR-LAB-024 (reviewable before commit) | Bulk fill/paste review UI exists in the lab measurement entry flow; no file-import path | Partial — file-based import not approved/implemented |
| Generic CSV/Excel import | BR-GEN-063 (same rules as manual input) APPROVED; BR-GEN-064 (failure strategy) **UNCONFIRMED**; BD-019 (transaction strategy) open | No generic importer exists | BLOCKED — BR-GEN-064/BD-019 must be decided per use case via 013; inventing a strategy is prohibited |
| Controlled reference-data import | BD-020 (which reference data needs Change Request) open | Foundation seed scripts only (`db:seed:foundation`) | BLOCKED — BD-020 via 013 |
| Evidence ingestion (CI/E2E/security/UAT into release gates) | Domain supports `IMPORTED_*` evidence sources | Writer exists; no ingestion path executed (QC-100-FINAL-013 open item) | BLOCKED — owner: 013, depends on authorized CI candidate-publication path |

Per the task rule: "If policy or applicability is missing, obtain its decision through 013; do not claim a placeholder is completion." No import placeholder was built.

## 5. Cross-domain handoffs, provenance, browser scenarios — PARTIAL / HANDOFF

- Populated integration fixtures prove cross-domain provenance: approval-event outbox handler projects committed inspection/lab approvals into author-scoped notifications with dedupe (`tests/integration/shared/notification-outbox-delivery.test.ts`, plus QC-100-FINAL-013/014 suites on the same cluster family). Partial dependency failure is covered by the outbox retry/failure model (handler failure ⇒ event retained, business mutation not repeated) and by dashboard/source-failure semantics owned by 017.
- Unauthorized exports: permission-denial tests at use-case level (this task) and route-level 401/403 mapping in `src/pages/reports/[reportCode]/export.ts` (source-verified). **Browser-executed** export scenarios on the exact candidate remain NOT RUN — authenticated Playwright on this host is blocked (Docker absent; Chromium sandbox restrictions), handed to QC-100-FINAL-002/003.
- Bounded source-owned read models for 017: dashboard consumes owner-module use cases (7 action counts, quarantine overview projection — QC-100-FINAL-005/017); reporting exposes `ReportQuery` as the source-owned read port. No duplicate SQL was added to pages in this task.

## Evidence summary (this candidate, this environment)

| Suite | Result |
|---|---|
| Focused scope (search, search-scope, outbox, notification-delivery, reporting×3) | 28/28 PASS (was 26/26 at baseline; +2 new regressions) |
| Full integration (`tests/integration`, PG 18.6 TLS disposable) | 442/442 PASS, 0 skips |
| Unit (`tests/unit`) | 677/677 PASS (93 files) |
| Migrations (`tests/integration/database`) | 29/29 PASS |
| Typecheck (`astro check`) | 0 errors / 0 warnings / 74 hints |
| ESLint + Prettier (4 touched files) | PASS |
| Architecture boundaries + route registry | PASS |
| Build (`astro build`) | PASS (exit 0) |
| Diff secret scan | 0 hits |

## Changed paths

- `src/modules/reporting/infrastructure/postgres-report-query.ts` (literal LIKE escaping for `lot`/`itemCode` filters)
- `src/shared/outbox/postgres-outbox-repository.ts` (deterministic claim order: `created_at, id`)
- `tests/integration/reporting/report-export-parity.test.ts` (literal-wildcard filter regression, screen+export)
- `tests/integration/shared/notification-outbox-delivery.test.ts` (deterministic bounded-claim ordering regression)

## Unresolved dependencies / downstream owners

- BR-GEN-064 / BD-019 / BD-020 (import failure strategy, transaction strategy, controlled reference-data set): **owner decision via QC-100-FINAL-013** — implementation BLOCKED until decided.
- Outbox escalating backoff / max-attempt policy: not specified in approved docs — 013.
- Reject-reports export definition + `PERM-RPT-*` mapping: open owner decision recorded by QC-100-FINAL-014.
- Browser-executed export/print parity and authenticated E2E on the exact candidate: QC-100-FINAL-002/003 (host lacks Docker; Chromium sandbox restrictions).
- Node 22.22.3 vs declared Node 24 contract: local results are not runtime-parity evidence (QC-100-FINAL-001/015).
- Production gates remain 0/19; `PASS ≠ RELEASED`; this report is not release authorization.

## Work / evidence status

- Work: **PARTIAL** (in-scope source repairs DONE; import/bulk paths BLOCKED on owner policy; browser/UAT evidence out of scope per prompt).
- Evidence: focused + integration + unit + migrations + typecheck/lint/format/architecture/build **PASS** (local, disposable PG); authenticated browser E2E **NOT RUN**; CI/provider/UAT/production **BLOCKED/NOT VERIFIED** (external blockers recorded in Mind).


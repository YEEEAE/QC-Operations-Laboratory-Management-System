# QC-CLOSURE-014 — Performance, Reliability & Observability Evidence

**Date:** 2026-09-18 (Asia/Riyadh)  
**State:** PARTIAL / NO-GO for production performance capacity claims  
**Source HEAD:** `8e7162ded4861d24c5336f5d9e001e33a72eaaea`  
**Runtime caveat:** local Node `v22.22.3`; project contract is `>=24.20.0 <25`.

## Implemented in this task

- Normal HTTP responses now carry `x-request-id`; structured HTTP logs include bounded
  `request_id` and `trace_id`, while normalized route templates remain the only route label.
- Admin Users and System Control Center no longer issue two authorization queries per user.
  Production PostgreSQL uses two batched read queries (roles and active scopes), with a safe
  compatibility fallback for test doubles.
- Migration `0029_performance_query_indexes.sql` adds composite/partial indexes for task
  queues, receiving filters/reports, inspection/lab author-state reads, audit timelines, and
  active user grants.

## Static audit findings

| Area | Result | Evidence |
|---|---|---|
| N+1 queries | Improved for admin register/control center | Batched repository methods in `src/modules/administration/infrastructure/postgres-authorization-repository.ts` |
| Pagination | Mixed | Shared page/audit/reject-report primitives exist; task list and quarantine-aging report remain unbounded in current source |
| Filters/indexes | Improved, runtime unverified | `0029` covers equality/order predicates; wildcard cross-domain search still needs representative `EXPLAIN (ANALYZE, BUFFERS)` |
| Dashboard | Instrumented, runtime unverified | Bounded dashboard attention/activity reads and database telemetry plugin exist |
| Payloads/Astro output | Build verified; no approved budget | Build reports a 734.44 kB minified Three.js chunk and 165.07 kB application chunk; Lottie/WASM remain deferred assets |
| Structured logs/request IDs | PASS at source and local smoke | Pino redaction plus middleware correlation; local logs contained request/trace IDs and no credentials |
| Metrics/tracing | Implemented at seam, exporter not live-verified | `telemetry.ts`, `db-telemetry.ts`, HTTP and dependency counters/histograms |
| Health/readiness | PASS locally, dependency readiness 503 without DB | `/api/health/live` returned 200; `/api/health/ready` returned sanitized 503 when DB was unavailable |
| Dependency degradation | Implemented | Sanitized database/storage/outbox/AI statuses; no raw exception or endpoint exposure |

## Local verification

- `pnpm typecheck`: PASS — 0 errors, existing 68 hints/warnings.
- Focused admin/observability/health tests: **41/41 PASS**.
- `pnpm test:architecture`: PASS.
- `pnpm build`: PASS. Existing non-task warnings include Node engine mismatch, an unused
  external `Writable` import, and a large Three.js client chunk.
- Read-only smoke against the built preview, 3 samples plus 1 warmup per route:
  `/login` 200, p95 total `6.403 ms`, `1,928 B`; `/api/health/live` 200, p95 total
  `3.760 ms`, `20 B`; `/api/health/ready` sanitized 503, p95 total `3.123 ms`, `22 B`.
  These are observational only and have no approved SLO or representative database dataset.
- Sensitive-data check: smoke output and captured structured logs showed no password,
  token, cookie, authorization header, database URL, password hash, or secret values.

## Not closed / required external evidence

- Synthetic volume scenarios for users, tasks, inspections, lab tests, audit events, reports,
  and documents were **NOT RUN** against a disposable PostgreSQL dataset in this task.
- No representative `EXPLAIN (ANALYZE, BUFFERS)`, query-count budget, heap/CPU profile,
  browser Web Vitals, Lottie frame/CPU evidence, or concurrency capacity result is claimed.
- PostgreSQL runtime migration/application and Render deployment were not performed. Render
  migration remains governed by the existing credential-rotation gate.
- OTLP/exporter, alert routing, retention, and production dashboard evidence remain unverified.


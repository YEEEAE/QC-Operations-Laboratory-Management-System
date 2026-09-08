# QC-100-10 — Performance Baseline

**Recorded:** 2026-09-08 (Asia/Riyadh)  
**Status:** PARTIAL — instrumentation and repeatable measurement paths exist; no representative production-like benchmark has been executed.

## Evidence-backed state

| Surface | Measurement path | Current evidence | Budget status |
| --- | --- | --- | --- |
| Server response time | `qc_http_server_duration_ms`; JSON request log `duration_ms` | Source + focused telemetry test | No approved SLO; do not infer one. |
| DB query latency / slow patterns | `qc_db_query_duration_ms`, bounded `statement_kind` and query counters | Source + focused telemetry test | Requires representative PostgreSQL workload and `EXPLAIN (ANALYZE, BUFFERS)` evidence. |
| Dashboard, tables, search, reports | `tests/performance/smoke.mjs` and read load profiles | Runner present, not run against representative authenticated data | Unverified. |
| File operations | `qc_file_operations_total` with bounded operation/outcome labels | Focused test-backed | Latency baseline unverified. |
| Login / critical writes | HTTP metric plus explicit write-gated profile | Profile present; no credential or disposable DB was supplied | Unverified. |
| `background.lottie` client impact | Deferred startup, visibility pause and reduced-motion bypass in `SystemBackground.astro` | Existing source/test evidence only | Browser CPU, memory and frame-time measurement unverified. |

## Repeatable collection

Build and run the deployed artifact or a representative local server, then run:

```sh
QC_PERF_BASE_URL=http://127.0.0.1:4321 pnpm exec node tests/performance/smoke.mjs
QC_PERF_BASE_URL=http://127.0.0.1:4321 QC_PERF_LOAD_PROFILE=dashboard-reads QC_PERF_CONCURRENCY=5 QC_PERF_REQUESTS=50 pnpm exec node tests/performance/load-profiles.mjs
```

Profiles: `concurrent-logins`, `dashboard-reads`, `filtered-lists`, `search`, `receiving-item-creation`, `laboratory-writes`, `approvals`, and `report-generation`. Write profiles are intentionally blocked until `QC_PERF_ENABLE_WRITES=true`; use only a controlled disposable environment, valid authorization, and unique idempotency inputs. The runner reports observed status distribution and p50/p95/max only. It is not a capacity claim.

## Budget policy

No numeric budget is declared here because no approved performance SLO or representative execution data was available. Establish a budget only after preserving: release identity, dataset shape, database version/configuration, concurrency, warm-up, raw output, and repeat runs. Investigate a regression against the recorded baseline; do not label it PASS/FAIL without an approved threshold.

## Required next evidence

1. Execute each profile against a disposable PostgreSQL dataset representative of the intended workload.
2. Preserve raw runner JSON and database `EXPLAIN (ANALYZE, BUFFERS)` for observed slow statement kinds without SQL values or PII.
3. Capture browser performance evidence for the Lottie background with and without reduced motion.
4. Agree approved SLOs/capacity ownership outside this repository before alert thresholds or capacity claims are made.

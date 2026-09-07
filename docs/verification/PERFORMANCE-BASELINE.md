# Performance Baseline — MASTER-034

## Status

This is an observational baseline only. No approved performance SLO or pass threshold is defined, so the measurements below do not constitute a PASS/READY claim.

## Release and environment

- Release/service version: `0.1.0`
- Git SHA: `7d2e4c31018e81f205be4f4d75422e79f8036bdc` (working tree was dirty; see limitations)
- Build/artifact identity: `dist/server/entry.mjs SHA-256 3b2d02f9543121c5091a256b66ae3693c7e88def142dd9cccf9e317d104c5d71`
- Measurement date/time: `2026-09-07T16:45:16.762Z`
- Runtime: `Node v22.22.3 · Darwin 25.6.0 · darwin-arm64`
- Base URL: `http://127.0.0.1:4321`
- Dataset: `Unauthenticated representative routes; no database dataset supplied`
- PostgreSQL version: `Not supplied for this baseline`
- Warmups/samples: `1 warmup / 5 measured samples per route`

## Measured values

Run:

```sh
node tests/performance/smoke.mjs
```

| Route | HTTP statuses | Response bytes (min/max) | TTFB p50/p95 (ms) | Total p50/p95 (ms) |
| --- | --- | ---: | ---: | ---: |
| `/login` | `200 × 5` | `1331 / 1331` | `1.013 / 1.761` | `1.138 / 2.451` |
| `/definitely-not-a-page-master034` | `404 × 5` | `759 / 759` | `1.147 / 1.759` | `1.294 / 1.926` |
| `/api/health/ready` | `503 × 5` | `22 / 22` | `0.632 / 0.712` | `0.713 / 0.747` |

## Method and limitations

- The smoke runner measures server response TTFB, total response time, status, and body size for representative routes.
- The recorded run used one warmup and five measured samples per route; p50/p95 values are milliseconds.
- `QC_PERF_PATHS` can add authenticated representative routes; use `QC_PERF_COOKIE` only with a disposable test session and never record the cookie in this document or logs.
- No production traffic, production secrets, or production database was used.
- The readiness endpoint returned `503` because no `DATABASE_URL`/disposable PostgreSQL dataset was supplied; this is an expected dependency-failure observation, not a readiness claim.
- The runtime was Node `22.22.3` while the repository engine range requests Node `24.20.x`; repeat the baseline on the approved runtime before comparing releases.
- The baseline does not prove capacity, browser rendering performance, PostgreSQL scalability, or production readiness.
- No unbounded 100k-row page load was introduced by this measurement. Existing operational list queries require a separate representative PostgreSQL data-volume run before performance readiness can be assessed.

## Query-shape investigation

- Dashboard read model currently issues three bounded, actor-scoped queries in parallel; attention and activity reads use `LIMIT 8`.
- Static inspection identified existing unbounded operational list reads, including equipment, maintenance, calibration, inspection, laboratory, receiving, task, and several quality repositories. They require bounded pagination before performance readiness can be assessed.
- Static inspection identified existing N+1-shaped hydration in `src/modules/laboratory/infrastructure/postgres-repository.ts:list`, `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts:list`, `src/modules/tasks/infrastructure/postgres-repository.ts:list`, and document version/file hydration in `src/modules/documents/infrastructure/postgres-repository.ts:listVersions`.
- These findings are recorded for follow-up; this prompt does not change repository query behavior without an approved pagination contract and representative database fixture.
- Report and list performance still requires a disposable PostgreSQL dataset with approved volume. This baseline does not invent a row-count target or SLO.

## Result

- **Status:** `UNVERIFIED` for performance readiness.
- **Reason:** Measurements are recorded as a baseline, but approved SLOs, production-like dataset volume, browser metrics, and database-backed query evidence are not available in this run.

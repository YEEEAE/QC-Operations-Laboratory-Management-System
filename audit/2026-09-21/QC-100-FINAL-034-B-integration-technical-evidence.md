# QC-100-FINAL-034-B — Integration and technical evidence

**Work state: PARTIAL.** Item 1 has fresh source and test evidence but no configured exporter or deployed alert delivery. Item 2 has a fresh populated database+file restore and bounded local read-pressure measurements on PostgreSQL 18.6/current schema. RPO policy acceptance, production-like capacity limits, provider recovery and service-level RTO remain unverified. No maturity score or domain denominator changed.

## Frozen candidate and identity

| Field | Value |
|---|---|
| Frozen Git SHA | `4fa6ac3b3bdf2330335ba1d26d019c83af7c8876` |
| Branch / start state | `main`; clean before this task's test correction |
| Dirty fingerprint | `b8feaa9e5457318e5caa907444e2d2ea349f5c47ef6483ead0806457ea9712db`; SHA-256 over sorted changed source paths (audit and Mind excluded), each path + NUL + file bytes + NUL |
| Runtime | Node `24.20.0` (selected explicitly for build and tests); pnpm `11.25.0` |
| Build | Astro server output with `@astrojs/node`; `pnpm build` PASS at 2026-09-21 00:41:41 UTC |
| Local release identity | `rel-0e889c54aa21f576`, build `local-4fa6ac3b3bdf`; `release:verify` PASS at 00:43:06 UTC, exact Git SHA verified, working tree marked dirty |
| Source schema | PostgreSQL 18.x; migration head `0034_template_document_link_variable_scope`; checksum `628dc3dcb228906e813e532d093c3284a5b220f5226b0346bb762265a9e5f2ab` |
| Applied schema | Task-owned isolated PostgreSQL 18.6: PASS; 34 migrations applied/validated through `0034_template_document_link_variable_scope`. This is local fixture evidence, not deployed-schema evidence. |

Times in this report are UTC on 2026-09-21. `PASS` is technical evidence only; it does not mean `RELEASED`.

## Evidence by scoped item

| Item | State | Changed paths and evidence | Unresolved dependency / owner |
|---|---|---|---|
| 1. Telemetry exporter, correlation/redaction, actionable alerts and health degradation | **PARTIAL** | Changed test path: `tests/integration/observability/correlation.test.ts`; test fixture now implements the current file repository/object-store contracts (`createWithEvidence`, `findEvidence`, `delete`). Evidence: focused correlation/health/backup suite **PASS, 65/65**; a fresh canonical readiness probe against an unavailable local port returned sanitized `ready:false` (**PASS**). Tests verify request/trace correlation, label bounds, failure isolation, structured-log redaction, file/outbox/DB telemetry contracts, and liveness/readiness agreements. Source inspection confirms production starts with no-op trace and meter providers; `setTelemetryProviders` has no production call site, so exporter verification is **NOT RUN / NOT CONFIGURED**. Approved alert examples cover DB/auth/controlled-write/integrity/restore failures (P1), sustained 5xx/pool exhaustion/growing outbox/storage/deadlocks (P2), and elevated latency/provider degradation (P3); numeric thresholds and alert routing are explicitly deferred. The authenticated health outbox probe currently reports HEALTHY for any successful query, regardless of pending count or growth. Alert rule execution/delivery is **NOT RUN**. | 013/026: confirm threshold/SLO, export/backend and alert-routing authority; operational owner to configure exporter and alert rules; 002/027 exact-candidate DB regression; 003 authenticated E2E; 006/040 applicable accessibility; 012 final evidence reconciliation. External alert delivery/provider changes were not attempted. |
| 2. Populated DB+file restore, measured RPO/RTO and capacity assumptions/limits | **PARTIAL** | Changed evidence path: this report; no new runtime path. Starting from the read-only 008 populated dump (SHA-256 `4fedf18cfe2b8816a6c4c8e622970ac1810cb45e30558653a8994eb0217dfc8e`, original migration head `0030`), a task-owned PostgreSQL 18.6 source copy was migrated using current migrations `0031`–`0034`. A current-head logical dump (`4b9e45bf97f6388988c82bd59e5ade4847e2339355c1c0a010eee7d3ce477a4a`) restored to an isolated target. Recovery validators returned DB **PASS** (exact 34-entry ledger/head, all 77 required core and 13 history relation checks) and files **PASS** (1 object, 43 bytes, expected SHA-256). All 79 application tables plus one task-owned probe table had their row counts compared: source had 532 rows after a post-backup marker, target had 531; all pre-backup counts matched and the post-backup marker was absent. Dump took **74.612 ms**. From `pg_restore` start through DB+file validation, local technical recovery took **573.956 ms**; this is not end-to-end service RTO. The known post-backup marker was absent; **74.623 ms** elapsed from dump process start to the marker insert request, followed immediately by its commit. This is a lower bound for this one missed record, not maximum RPO. The local RPO/RTO targets are **NOT VERIFIED** against approved budgets. The capacity profile is detailed below: **2,000/2,000** synthetic reads succeeded through concurrency 40; no production capacity ceiling is asserted. | 013/026 + operations owner: approve RPO/RTO/capacity/queue-drain budgets (runbook target 24h/4h conflicts with policy plan's pending approval and remains target-only); 002/027: reconcile/extend representative workload, DB/outbox/file/provider failure, recovery and queue-drain evidence; provider-specific PITR/WAL/DR remains **NOT RUN**; 012 reconcile. |

### Capacity profile detail

Assumptions: local Darwin 25.6.0 / arm64, 8 CPU cores, 8 GiB RAM; PostgreSQL 18.6 with `max_connections=100`, `shared_buffers=128MB`, `work_mem=4MB`; 79 application tables plus one probe table, 531 restored rows and one 43-byte file; Node 24.20.0; node-postgres pool maximum 10; no warm-up and one run per concurrency. Query workload was read-only task count, 400 requests per level. Values are observations only.

| Concurrency | Requests | Errors | p50 / p95 / max (ms) | Peak pool waiters | Throughput (/s) |
|---:|---:|---:|---:|---:|---:|
| 1 | 400 | 0 | 0.075 / 0.109 / 16.182 | 0 | 8,550.6 |
| 4 | 400 | 0 | 0.074 / 0.216 / 4.935 | 0 | 30,149.5 |
| 10 | 400 | 0 | 0.156 / 0.710 / 7.856 | 0 | 33,429.0 |
| 20 | 400 | 0 | 0.250 / 0.369 / 0.481 | 10 | 72,352.4 |
| 40 | 400 | 0 | 0.510 / 0.636 / 0.715 | 30 | 76,257.7 |

## Candidate and handoff verification

The 034-A handoff report identifies candidate `0e9bdf28…`; the B frozen candidate is newer (`4fa6ac3…`) and includes the A implementation in its ancestry. B used the exact current `HEAD` for its local verification and did not treat A's older evidence as current-candidate evidence. Build and release identity are local only. Source migration identity and a disposable schema at that head are verified; deployed schema remains NOT VERIFIED. The current-candidate source evidence path is `tests/integration/observability/correlation.test.ts`; detailed machine-readable restore/load data is in `QC-100-FINAL-034-B-local-drill-evidence.json` beside this report.

## Command record

| UTC | Command / action | Result |
|---|---|---|
| 00:41:17 | Focused 15-file suite, first attempt | FAIL: one observability file mock still used superseded file service methods; 64/65 passed |
| 00:41:37 | Updated only the stale file-service mock to current interfaces; reran affected test and `pnpm build` | PASS: 18/18 file telemetry suite; Astro server/client build complete |
| 00:42:43 | Focused 15-file resilience/health/backup suite after correction | PASS: 65/65 across 15 files |
| 00:42:45–00:43:06 | `pnpm typecheck`, `pnpm release:identity`, `pnpm release:verify` | PASS: 0 type errors, 0 warnings, 74 hints; local release verifies exact SHA |
| 00:50 UTC | `pnpm requirements:check` | PASS: 100 requirements, 34 risks, 20 gaps, 33 decisions, 5 assumptions, 7 mapped domains; denominator remains 80 |
| 00:42:00, 00:42:09 | Disposable PG18 startup attempts under sandbox | BLOCKED: `shmget` EPERM, including mmap-configured retry; local escalated start then succeeded with a temporary isolated TLS certificate |
| 00:42 | Docker availability / local preview bind | BLOCKED: Docker daemon socket unavailable; preview bind was sandbox-denied. PostgreSQL-based restore and read-pressure evidence was subsequently completed without preview or Docker |
| 00:49 UTC (temporary evidence files timestamped 00:49:04) | Current-head restore and validation | PASS: PG18.6; applied migrations 0031–0034; 80 tables including probe; 531 restored rows and exact pre-backup counts; 34-entry migration ledger and file-object SHA validated |
| 00:50:14 | Bounded disposable DB read-pressure profile | PASS observational: 2,000/2,000 reads, 0 errors through concurrency 40, queue waiters drained to 0, recovery probe PASS; no target threshold available |

Build emitted existing third-party annotation, import, dynamic chunk and large client-chunk warnings; build exited successfully. Typecheck emitted existing hints. The fresh restore started from an immutable local copy of the prior 008 disposable fixture and used only temporary PG data, a generated one-day local TLS certificate, a synthetic probe table/markers and the prior sample file. Review artifacts are under `/private/tmp/qc034b.DimkDL/`: `current-head.dump`, `manifest.json`, and `objects/recovery/sample.txt`; the manifest remains `NOT_VERIFIED` by design, with verification in the validator outputs recorded above. No external provider, real alert channel, production database, production data, credential, or paid service was used. The earlier malformed quoted identity query in the pressure harness was discarded; the corrected profile above ran successfully.

## Next phase / required inputs

No additional 034 phase is defined after B; feed this report and exact-candidate artifacts to 012 for reconciliation. Keep the family PARTIAL until owners provide an approved telemetry exporter/alert route and threshold decisions, approved capacity/RPO/RTO budgets, representative DB/outbox/file/provider failure and queue-drain evidence, and provider DR proof. Provider DR and human acceptance evidence remain separate external dependencies. The 80-domain denominator and scores are unchanged.

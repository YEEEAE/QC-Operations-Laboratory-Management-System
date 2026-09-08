# QC-100-10 — Resilience Matrix

**Recorded:** 2026-09-08 (Asia/Riyadh)  
**Status vocabulary:** IMPLEMENTED/TESTED, IMPLEMENTED/UNVERIFIED, or NOT EVIDENCED. “Tested” below means focused automated evidence, not a production incident drill.

| Failure mode | Expected authoritative behavior | Evidence | Status / remaining evidence |
| --- | --- | --- | --- |
| DB outage / timeout / stale connection | Database error maps to a user-safe unavailable result; readiness returns minimal `503`; no internal detail is exposed. | `src/shared/database/{pool,database}.ts`, `src/shared/health/*`, readiness tests | IMPLEMENTED/TESTED for response mapping; real outage/stale-pool drill unverified. |
| Duplicate request / client retry / ambiguous outcome | Critical workflows require idempotency records and state/version checks; the same command must not create another transition. | `src/shared/idempotency/*`, `tests/integration/concurrency/idempotency.test.ts`, `STATE-MACHINES.md` | IMPLEMENTED; current PostgreSQL execution evidence not collected in this prompt. |
| Downstream notification failure | Durable outbox retries delivery; a failed delivery must not roll back or replay business truth. | `src/shared/outbox/worker.ts`, observability focused test | IMPLEMENTED/TESTED at unit seam; durable worker/PostgreSQL drill unverified. |
| Object storage failure | File service surfaces the failure and does not log file content/name in telemetry. | `FileService` telemetry test | IMPLEMENTED/TESTED at seam; provider outage drill unverified. |
| AI outage | AI stays advisory; provider failure cannot set controlled result, approval, release, or signature. | AI advisory integration/security tests and Foundation rules | IMPLEMENTED/UNVERIFIED for live provider outage. |
| Observability exporter / log sink failure | Telemetry and log failures are swallowed; controlled business operation proceeds. | `telemetry.ts`, `logger.ts`, `correlation.test.ts` | IMPLEMENTED/TESTED. |

## Drill constraints

No failure drill may bypass authorization, alter production, or use an uncontrolled write path. Preserve request correlation, release identity, exact dependency failure injection, state before/after, audit/outbox evidence, and recovery result. A timeout after a committed write is an ambiguous outcome and must be resolved by an idempotency/status lookup, never by blind replay.

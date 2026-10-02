# QC-POST-100-011 — Storage, monitoring, recovery, and DR

**Priority:** P1  
**Findings:** QC-PAGE-F-027, QC-ENV-F-003  
**State:** PARTIAL — current source contracts and focused unit checks reviewed; owner decisions and isolated PostgreSQL 18 restore/DR acceptance remain open.

## Candidate identity

- Audit candidate: `6059e177438d8ae110c99084d32758b048f22cd2` (historical evidence only).
- Current repository HEAD at task start: `c083a5b998cc8d51d23f7df0cc578c8a43ab767f`.
- Final local verification context: run `42c4419e-aeeb-47a0-98dc-5cb5fa8b7a7d`, HEAD `c083a5b998cc8d51d23f7df0cc578c8a43ab767f`, source fingerprint `44abae61b70c28af842b341c4c912f08c57dbff1cd49311867ae4e0e9276eabb`.
- The local candidate does not inherit the historical candidate's runtime or provider evidence.
- Host Node: `22.22.3`; project contract is `>=24.20.0 <25`. Focused test outcomes are environment-qualified.

## Reconciliation

The historical report's sections 4/5/41/50 and `audit/2026-10-02/post-implementation/verification-data.json` identify these gaps on the audit candidate: no recorded outbox worker heartbeat/channel delivery/alerts, no approved RPO/RTO or isolated restore proof, memory-only local artifacts, no durable scheduled catalog integration, and no telemetry exporter. Their scores and live observations are historical; they were not transferred to current-source acceptance.

Current source still has a provider-neutral outbox batch worker (`src/shared/outbox/worker.ts`) and one-shot runner (`scripts/workers/outbox.ts`), an R2 backup artifact adapter, and read-only queue age/count diagnostics on `/system/health`. The health page explicitly reports heartbeat as `NOT_RECORDED` and channel delivery as `NOT_REPRESENTED`. The internal notification delivery path and its PostgreSQL integration tests exist, but no persistent worker schedule, approved alert receiver, delivery acknowledgement evidence, or external alert policy is established. For controlled document files, `FileService` is dependency-injected; the local filesystem adapter rejects production and the S3-compatible adapter has no runtime composition/client binding under `src`. R2 selection remains optional at configuration level; the local backup artifact adapter is process-memory-only. OTEL remains optional/no-op with no exporter. These technical contracts do not establish owner-approved capability requirements.

The restore action records an authorized `PLANNED` intent only; it does not execute restoration. Production restore remains denied. The current task did not select a paid/provider resource, enter credentials, contact an external receiver, run a production operation, or alter migrations.

## Changes in this task

- Updated the stale readiness test double to return the complete aggregate row now consumed by the outbox probe. The previous fake omitted new selected fields and incorrectly made the probe look unavailable.
- No runtime policy, provider configuration, scheduler, receiver, migration, or production setting was changed because provider requirements, alert ownership, retention, and RPO/RTO require the owner's decision.

## Verification

| Check | Result | Notes |
|---|---|---|
| `tests/unit/backup-recovery`, canonical readiness, dependency failure, server env config | PASS 43/43 | Node 22.22.3 is below the declared Node contract; source/unit evidence only. |
| PostgreSQL integration: outbox, notification delivery, control center, restore atomicity | BLOCKED | Testcontainers could not find a container runtime. Outbox suite 1/1 passed; 23 tests skipped; three suites failed during setup. |
| Durable provider storage round-trip/failure | NOT VERIFIED | No approved provider target or credentials. |
| Worker age/count/ack and approved receiver/alerts | PARTIAL / NOT VERIFIED | Source queue diagnostics and worker path exist; persistent heartbeat/schedule, channel acknowledgement and approved alert destination are absent. |
| Backup checksum/schema/business-history verification | NOT VERIFIED for current candidate | No current isolated populated PostgreSQL 18 restore was run. |
| Measured restore/RPO/RTO | BLOCKED / NOT APPROVED | No isolated PG18 runtime in this environment; no owner-approved objectives. No production restore attempted. |
| Authenticated browser, accessibility, human UAT | NOT VERIFIED | No candidate-bound page/AT/UAT evidence was produced. |

## Owner decisions needed

1. Is durable backup required, and which provider/plan, access scope, retention, recovery target, and responsible operator are approved?
2. What RPO and RTO are approved, and who accepts the measured isolated drill?
3. Is telemetry export/alerting required? If so, approve the receiver/backend, alert thresholds/budget, escalation owner, and data-redaction limits.

Until those decisions and isolated evidence exist, keep the findings PARTIAL/OPEN and keep RPO/RTO NOT APPROVED. No human acceptance or recovery claim is inferred.

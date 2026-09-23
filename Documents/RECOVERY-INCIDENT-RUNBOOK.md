# Recovery Incident Runbook

**Status:** operational procedure; provider alerting, policy objectives, and named on-call ownership remain unverified.  
**Scope:** backup failure, suspected data loss/corruption, isolated recovery, and production cutover decision.  
**Related:** `BACKUP-RECOVERY-PLAN.md`, `RESTORE-DRILL-RUNBOOK.md`, `SUPPORT-OWNERSHIP-REGISTER.md`.

## Roles and response ownership

- **Technical response (L3):** Admin role with the applicable `PERM-BKP-*` permissions. A named operator/on-call rotation is `UNRESOLVED` (PD-29); do not infer one from the login used.
- **Escalation and production recovery decision (L4):** system owner `yazeed`. A separate explicit production-restore authorization remains required (PD-28 / RD-020); this runbook does not grant it.
- **Provider actions:** only the authorized database/platform account operator. Current plan eligibility, alert routing, PITR, and export configuration must be checked in the provider control plane and recorded for each incident.
- **Business/QMS impact owner:** unresolved. Do not declare product disposition, record retention, or risk acceptance without the authorized owner.

## Trigger and preserve evidence

Triggers include a failed or missed backup schedule, catalog/storage verification failure, reported corruption or missing evidence, provider recovery warning, or an unexplained gap in WAL/recovery-point coverage.

1. Record incident ID, UTC timestamp, reporter role, affected service/environment, observed error, request/correlation ID, and the exact provider alert or log reference. Keep credentials, raw connection strings, and session data out of the record.
2. Preserve provider job history, catalog/manifest, object references and hashes, database/WAL/PITR status, deployment/release identity, and audit events before cleanup or retry.
3. Notify Admin L3 and escalate production impact to system owner `yazeed` through the approved organizational channel. No on-call response time is currently approved; record actual notification and acknowledgement timestamps rather than claiming an SLA.
4. Do not blindly retry, delete artifacts, change retention, run migrations/seeds, or point the application at a candidate restore.

## Isolated recovery and evidence

Use only a dedicated isolated target with an approved recovery manifest and sanitized/approved data. Follow `RESTORE-DRILL-RUNBOOK.md`; never restore over or test on production. The target must not share writable data paths, credentials, or application traffic with production.

Record evidence timestamps from the same drill/incident:

| Timestamp | Required evidence |
| --- | --- |
| `incidentStartedAt` | approved incident simulation start or sourced incident start |
| `recoveredDataAsOf` | verified timestamp of latest data present in the candidate restore |
| `recoveryStartedAt` | start of the approved recovery attempt |
| `recoveryValidatedAt` | completion time after all required validation passes |

RPO measurement is `incidentStartedAt - recoveredDataAsOf`; RTO measurement is `recoveryValidatedAt - incidentStartedAt`, including detection and response time. `recoveryStartedAt` separately marks the operator's work start and must not shorten RTO. Report whole seconds rounded upward from the timestamp difference and preserve the original source references and UTC timestamps. Missing timestamps mean `NOT MEASURED`. These measurements do not approve RPO/RTO objectives or claim they were met. Compare with objectives only after PD-26/PD-27 have approved values.

Validation evidence must cover database table/row counts, migration ledger and checksums, foreign-key violations, immutable/audit history, attachment object count/size/SHA-256 and database references, application candidate/release identity, health/readiness, and application-role authorization (including denied out-of-scope access). Do not run migrations to make a mismatched candidate appear valid.

## Stop / GO decision and rollback

**STOP / NO-GO** if the manifest or source is unapproved, isolation is uncertain, provider/WAL coverage has a gap, candidate release or migration identity mismatches, row/reference/hash/FK/audit checks fail, app authorization fails, credentials/keys cannot be safely supplied, evidence is incomplete, or the decision owner is unavailable. Keep the candidate isolated, preserve evidence, and do not reopen service.

**GO to a production cutover is a separate owner decision**, not a consequence of `RESTORE VERIFIED`, a passing validation, an approved RPO/RTO, or a request to restore. It requires explicit system-owner authorization under RD-020 and the approved business/QMS risk decision. Record the decision, scope, approver, timestamp, selected recovery point, candidate identity, and communication plan before any traffic or write routing changes.

Before cutover, the stop path is to leave the original service authoritative and discard/retain the isolated candidate only under approved retention/security rules. After cutover, do not perform an automatic rollback if the recovered service accepted writes: first freeze further routing changes, preserve both histories, establish which copy has authoritative writes, and obtain owner direction. Never overwrite the original database or erase either history as an ad hoc rollback.

## Failure monitoring and closure

For each scheduled backup/drill, the provider or scheduler must expose run identity, start/end time, result, failure details, and a notification delivered to an approved response channel. Verify a deliberately failed test in a representative nonproduction environment before claiming monitoring works. The scheduler, alert channel, recipient, thresholds, and acknowledgement path are currently `NOT VERIFIED`; do not claim operational monitoring until that evidence and an owner are recorded.

Close the incident only after technical evidence, business disposition, follow-up owner, and evidence-retention handling are recorded. Capture actual response and restore timestamps; do not backfill estimates as measurements.

## Current rehearsal status

**BLOCKED / NOT RUN (2026-09-23):** the user confirmed that no isolated target or populated recovery bundle is available and that the RPO/RTO, retention, and response-owner decisions remain open. The local host also has no available Docker daemon or PostgreSQL listener. No restore was run against production. A representative response-time rehearsal remains unperformed; measured RPO/RTO remain absent.

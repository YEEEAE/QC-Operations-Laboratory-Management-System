# Render forward migration plan: 0018 → 0037

**Status:** PROPOSED — operator approval required; not executed  
**Observed:** 2026-09-22, read-only Render provider query and authenticated GET requests  
**Scope:** Review plan for the existing Render database only. It does not authorize a production connection, credential change, migration, restore, deployment, or production write.

## Observed gap

- Render's latest observed provider deployment was `dep-dapeak67bikc73f1poa0`, commit `7d7f869d778c850d14e0021d38540831336c3bd1`.
- The provider deployment ID and commit are control-plane evidence. Application `releaseId`, `buildId`, application version, and application-reported Git SHA were `UNVERIFIED` in the live system-health page.
- The Render service was reported as runtime `rust`; the repository's declared deployment baseline is Node `24.20.0`. This configuration drift requires separate controlled reconciliation.
- The read-only ledger query returned applied head `0018`. The inspected repository source has 37 migration files; source head is `0037_qc_data_003_lab_batches_samples_readings`. Migrations `0019`–`0037` (19 files) are pending.
- Live `/reject-reports` returned 503. It uses `PostgresRejectReportRepository.availability()`, which requires all four tables created by `0026_reject_reports`: `qc.reject_reports`, `qc.reject_issue_slips`, `qc.issue_slip_approval_confirmations`, and `qc.daily_reject_entries`.
- The pre-fix live `/system/health` reported application/database healthy and `READY`, because it did not probe the Reject Reports schema. Live release identity fields were unverified.

These observations are historical for the live deployment. This repository task changes only local code and documents. It does not deploy the change or alter the production ledger.

## Migration risk notes from source review

All migration files are forward-only and immutable. The runner applies pending files in lexical order, one transaction per migration, and records each result in `qc.schema_migrations`; a failed migration rolls back that migration but does not undo earlier completed migrations.

The pending set is not only additive DDL:

- `0019` adds backup/recovery metadata, constraints, and a partial unique index.
- `0024` closes duplicate active user-role grants, clears non-canonical scope values, then adds an index and constraint.
- `0026` inserts permission/grant rows and creates the Reject Reports tables and indexes.
- `0027` adds equipment/calibration/maintenance history and populates history from existing rows.
- `0028` adds controlled-record constraints/triggers and updates existing template state values as defined by the SQL.
- `0029` creates ordinary (not concurrent) indexes; assess lock and duration risk against production data size.
- `0030`–`0031` adjust role grants and QC state constraints; `0031` contains a delete from the role-permission join.
- `0035` adds receiving fields, checks, indexes, and a partial unique index. It intentionally does not infer/backfill historical values.
- `0036`–`0037` add inspection/laboratory tables and columns, indexes, and constraints.

The exact SQL and checksums in `db/migrations/` remain the source of truth. Before approval, the operator/reviewer must inspect each pending migration against the actual data volume and current ledger, especially the data-changing operations, constraints, uniqueness assumptions, and ordinary index builds. This plan does not infer row counts, duration, lock behavior, or scientific/acceptance policy.

## Preconditions and operator approvals

Do not proceed until the responsible operators have recorded decisions for each applicable gate:

1. **Credential gate:** complete the rotation and revoke the compromised credential as required by `Documents/RENDER-DATABASE-CONNECTION.md`. Confirm access only through the approved secret mechanism. Do not use or print a local provider export.
2. **Exact target and candidate:** confirm the Render database/service identity privately; select an immutable candidate SHA, build/artifact ID and digest, application version, release ID, and intended migration head. Resolve runtime/configuration drift separately or explicitly document the approved compatible path.
3. **Schema and compatibility review:** verify the pre-migration ledger and checksums with `pnpm db:preflight`, `pnpm db:migrate:status`, and `pnpm db:migrate:check` after the credential gate. Review all 19 SQL files and confirm migration principal ownership/privileges. Do not edit old migrations.
4. **Disposable/staging rehearsal:** restore or provision a non-production PostgreSQL target with an approved sanitized dataset. Verify the restored baseline before migration. Run the explicit forward sequence there, then verify migration status/checksums/schema, Reject Reports availability, and application compatibility. Record elapsed time and observed blocking/lock behavior from that rehearsal; do not extrapolate it as a guaranteed production duration.
5. **Recovery readiness:** obtain the approved provider backup/export and protected recovery reference for the pre-migration state. A created backup is not `RESTORE VERIFIED`; complete the isolated restore and validation path in `Documents/RESTORE-DRILL-RUNBOOK.md` where required by the approved risk/recovery policy. Current backup catalog and restore verification were not established by this live check. Exact retention, RPO, RTO, provider recovery capability, and backup cadence remain policy/provider-dependent.
6. **Window and impact approval:** choose the maintenance/change window, acceptable impact, owner, monitoring, abort criteria, and communication path. The repository does not establish a maintenance-mode implementation or an approved outage duration.
7. **Release approval:** satisfy the exact CI, UAT, security, recovery, release-identity, deployment, and production-readiness requirements in `Documents/RELEASE-RUNBOOK.md` and `Documents/DEPLOYMENT-ARCHITECTURE.md`. A green health check or successful migration command alone is not approval.
8. **Production migration authority:** obtain explicit authorization for this exact target, candidate, migration range, backup/recovery posture, and window. This document and the local code change are not that authorization.

## Forward-only operator sequence (after all gates)

Run only through the approved operator environment and secret interface. Never put a connection URL in the command line, shell history, logs, or this document.

1. Capture a read-only baseline: exact database identity/version (privately), applied head/checksums, source/candidate head, pending versions/count, safe privilege/topology results, and current application release identity. If any value is unknown, stop for review.
2. Confirm the candidate and immutable migration checksums match the staged rehearsal. Confirm pre-migration recovery reference and that the original baseline has been verified before any forward upgrade.
3. Apply the reviewed pending migrations with the repository's explicit migration runner. Do not add migrations to application startup. The planned source range is `0019` through `0037`.
4. On failure, stop. Do not edit or reverse a migration, retry blindly, or declare success. First collect sanitized `status`/checksum evidence to establish which individually committed migrations completed and obtain a reviewed continuation or forward-fix decision.
5. After success, run `pnpm db:migrate:status`, `pnpm db:migrate:check`, and `pnpm db:schema:check`. Require applied head `0037`, zero pending migrations, no checksum/schema error, and a passing exact Reject Reports table probe.
6. Verify the exact promoted application/release identity independently from the Render deploy ID. Run liveness and readiness checks, then an authorized read-only `/reject-reports` smoke path and `/system/health`. Verify migration `appliedHead` matches shipped/source head, workflow readiness is `READY`, and QC release evidence remains separately recorded. Any authorized write smoke requires its own policy/test data and is outside this plan.
7. Record before/after heads, checksums, candidate/deployment IDs, safe command results, timestamps, measured impact, health/readiness, route smoke, incidents, decision references, and any forward-fix. Keep secrets and database URLs out of the evidence.

## Outage and user impact

- Until `0026_reject_reports` has applied successfully and the exact table probe passes, `/reject-reports` remains unavailable and returns 503. The updated machine readiness endpoint also remains 503 while a required table is missing or cannot be checked.
- The full migration range includes table/constraint/index DDL and some data-changing statements. PostgreSQL locks, statement duration, application write conflicts, and temporary effects on other workflows depend on live data and must be measured in a representative disposable/staging rehearsal.
- Reaching `0026` can make the four-table Reject Reports probe pass before the whole source head reaches `0037`. In that interval the page-specific workflow may be available, while migration drift and the QC release gate remain blocked. Do not call the release ready until the complete approved candidate and migration head are verified.
- No production outage duration, retention period, RPO/RTO, or user communication SLA is specified here. The responsible operator must approve those values using the governing project policies.

## Failure handling and rollback boundary

- **Application rollback:** allowed only if the prior artifact is proven compatible with the resulting migrated schema and controlled data. If compatibility is not known, mark code rollback `BLOCKED` and use a reviewed forward fix.
- **Database rollback:** there are no down migrations. Do not reverse SQL or treat a code rollback as a database rollback.
- **Restore/recovery:** separate from deployment rollback. Consider it only for an actual data/integrity or recovery event under the approved recovery authority. Restore the original baseline into an isolated target first; verify its ledger, checksums, schema, application compatibility, and required data before any separately approved forward migration. A production restore is destructive/high-risk and requires explicit authority not supplied by this task.
- **Partial migration:** each migration commits separately. Preserve the ledger as evidence; do not hand-edit it. Establish the exact stopping head and review the failed statement before a controlled continuation or forward fix.

## Current disposition

```text
Live migration baseline: VERIFIED READ-ONLY — applied 0018, source 0037, 19 pending
Reject Reports schema gap: VERIFIED READ-ONLY — required 0026 tables unavailable
Live app release/build identity: NOT VERIFIED
Current production backup/restore evidence: NOT VERIFIED
Production credential rotation gate: BLOCKED until operator completes it
Production migration: NOT AUTHORIZED / NOT EXECUTED
Production release readiness/UAT: NOT VERIFIED
```

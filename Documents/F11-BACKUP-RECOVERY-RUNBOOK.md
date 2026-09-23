# F-11 Backup & Recovery Runbook

**Current status — 2026-09-23:** `OPEN / PARTIAL`. Historical local logical
backup and isolated restore evidence exists, but current-provider retention,
PITR/WAL, and a restore drill bound to the deployed release remain unverified.
RPO/RTO objectives are not approved.

## Runtime boundary

Cloudflare R2 Standard is used only as private object storage through its S3-compatible API. R2 is not PostgreSQL backup, WAL archiving, or PITR. The current implementation creates a logical `pg_dump` artifact; physical base backup, WAL, and PITR remain unproven.

Configure these values in the approved secret manager or service environment, never in Git:

- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `DATABASE_URL`
- `BACKUP_GIT_SHA`
- `BACKUP_BUILD_ID`
- `BACKUP_RELEASE_ID`
- `BACKUP_MIGRATION_HEAD`
- `BACKUP_POSTGRES_VERSION`

The application does not print values from these variables.

## Daily job

Run `pnpm recovery:backup:daily` once per day from the approved scheduler. The job:

1. runs `pg_dump --format=custom`;
2. computes SHA-256 and byte size from the exact bytes;
3. creates a manifest in memory and uploads a private artifact to R2;
4. reads the object back and verifies size and SHA-256;
5. reports `VERIFIED` only after the read-after-write check succeeds.

The current script prints a `catalogId`, but does not persist its manifest or a row in `qc.backup_runs`. The R2 adapter does not implement object listing. Thus the script, application catalog, and retention inventory are not yet one operational chain; `VERIFIED` means stored artifact bytes matched this job only, not that a restore or complete recovery set was validated.

Any missing configuration, command failure, provider failure, or hash mismatch exits non-zero and reports only `BACKUP_JOB_BLOCKED` or a sanitized failure code.

## Retention

Retention period and purge eligibility are `NOT APPROVED` (PD-24/PD-25). The backup job must not assign an expiry based on an assumed duration, and cleanup must fail closed until a class-specific policy with an approval reference is supplied. Once authorized, cleanup must never remove the last eligible recoverable artifact. Backup retention remains separate from controlled-record retention.

## Monthly isolated drill

The monthly drill must use an isolated non-production PostgreSQL target. It must download the exact catalog artifact, verify SHA-256 before restore, restore without silently applying newer migrations, validate database/history/object linkage/application compatibility/security, measure duration, persist evidence, and dispose of the target.

`pnpm recovery:restore:monthly` deliberately exits blocked until an explicit isolated target and verified artifact are supplied. It cannot target production.

## Targets versus measurements

- RPO objective: **NOT APPROVED** (PD-26; business owner decision required).
- RTO objective: **NOT APPROVED** (PD-27; business owner decision required).
- Measured values: not recorded for the current provider/environment. Derive only from the isolated-drill evidence timestamps defined in `RECOVERY-INCIDENT-RUNBOOK.md`.

Configuration, a historical local drill, or a successful backup job does not approve an objective or prove current provider recovery performance.

## Production recovery

Production restore/reopen is not enabled by the local-only implementation. The future controlled path must accept only `yazeed/SYSTEM_OWNER`, reauthenticate, require E-Signature, exact artifact/build identity, reason, request ID, expected-version validation, and immutable audit. Admin, Supervisor, and Manager are denied.

## Closure rule

F-11 remains `OPEN / PARTIAL` until a verified R2 artifact and successful isolated restore exist for the same deployed release/build identity. Local tests alone are not closure evidence.

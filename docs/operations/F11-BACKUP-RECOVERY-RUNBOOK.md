# F-11 Backup & Recovery Runbook

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
3. uploads a private artifact and manifest to R2;
4. reads the object back and verifies size and SHA-256;
5. reports `VERIFIED` only after the read-after-write check succeeds.

Any missing configuration, command failure, provider failure, or hash mismatch exits non-zero and reports only `BACKUP_JOB_BLOCKED` or a sanitized failure code.

## Retention

Artifacts are retained for 30 days. Cleanup must never remove the last eligible recoverable artifact. Backup retention is separate from controlled-record retention.

## Monthly isolated drill

The monthly drill must use an isolated non-production PostgreSQL target. It must download the exact catalog artifact, verify SHA-256 before restore, restore without silently applying newer migrations, validate database/history/object linkage/application compatibility/security, measure duration, persist evidence, and dispose of the target.

`pnpm recovery:restore:monthly` deliberately exits blocked until an explicit isolated target and verified artifact are supplied. It cannot target production.

## Targets versus measurements

- RPO target: **24 hours**
- RTO target: **4 hours**
- RPO/RTO measured values: shown only from completed recovery evidence

Configuration or a successful backup job does not prove either target was met.

## Production recovery

Production restore/reopen is not enabled by the local-only implementation. The future controlled path must accept only `yazeed/SYSTEM_OWNER`, reauthenticate, require E-Signature, exact artifact/build identity, reason, request ID, expected-version validation, and immutable audit. Admin, Supervisor, and Manager are denied.

## Closure rule

F-11 remains `OPEN / PARTIAL` until a verified R2 artifact and successful isolated restore exist for the same deployed release/build identity. Local tests alone are not closure evidence.

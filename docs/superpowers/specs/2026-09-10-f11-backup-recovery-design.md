# F-11 Backup & Recovery Design

**Date:** 2026-09-10  
**Status:** Approved for implementation  
**Scope:** Local implementation and verification only; F-11 remains open until a verified artifact and successful isolated restore are proven for the same deployed release.

## Goal

Implement the operational mechanics requested for F-11 without false-green behavior:

- Cloudflare R2 Standard through its S3-compatible API for private backup-artifact storage.
- Daily PostgreSQL backup execution with 30-day artifact retention.
- Immutable catalog identity and SHA-256 verification.
- Monthly isolated restore-drill scheduling and execution contracts.
- Approved RPO target of 24 hours and RTO target of 4 hours, always displayed separately from measured values.
- Production restore/reopen restricted to `yazeed/SYSTEM_OWNER`, with reauthentication, E-Signature, exact artifact/build identity, reason, request ID, version check, and immutable audit.
- Admin, Supervisor, and Manager denied for production restore/reopen.
- AI remains optional/advisory-only and never gates core readiness.

## Non-goals and honest status

- No credentials, bucket names, endpoints, or provider secrets enter source control.
- R2 is an object-storage destination only; it is not described as PostgreSQL backup, WAL archive, or PITR.
- A logical `pg_dump` artifact is not presented as physical base backup, WAL archiving, or PITR evidence.
- No production database or production R2 bucket is accessed by local verification.
- No deployed-release closure is claimed from local tests alone.
- Missing provider/runtime configuration makes the operation `UNAVAILABLE` or `BLOCKED`, never `SUCCEEDED`.

## Architecture

### Ports and adapters

The backup-recovery module gets explicit ports for:

1. `BackupArtifactStore` — put, head/read, and retention deletion through an S3-compatible interface.
2. `PostgresBackupExecutor` — create a logical backup artifact and restore it into an isolated target. The executor reports command identity and timings without exposing connection strings.
3. `ReleaseIdentitySource` — resolves the exact Git SHA, build/release ID, migration head, and PostgreSQL context bound to an artifact.
4. `BackupScheduler` — schedules the daily backup and monthly drill without embedding cron behavior in domain code.
5. `RecoveryEvidenceRepository` — persists immutable catalog and drill evidence separately from application logs.

The production adapter is `CloudflareR2ArtifactStore`, configured only from runtime environment. Tests use an in-memory/file-backed fake store and disposable PostgreSQL. No fake production orchestrator is wired into readiness.

### Artifact and manifest

Each artifact is addressed by an immutable catalog ID and contains a manifest with:

- artifact/catalog ID and object key generated server-side;
- backup type (`LOGICAL_EXPORT` for the implemented local path);
- PostgreSQL version/context;
- Git SHA, build/release ID, migration head;
- created/start/end timestamps in UTC;
- byte size and SHA-256;
- retention expiry at 30 days;
- verification status and known gaps;
- linked recovery evidence IDs.

The public view exposes status, timestamps, release identity, measured values, and sanitized gaps only. It never exposes object keys, bucket names, credentials, connection strings, or raw provider errors.

### Job flow

1. Scheduler invokes the daily job with a request ID and exact release identity.
2. Executor creates the logical PostgreSQL artifact in an isolated working directory.
3. SHA-256 and size are computed from the exact bytes.
4. Artifact and manifest are uploaded to the private R2 adapter.
5. A read-after-write integrity check verifies size and SHA-256.
6. The immutable catalog row is committed with `VERIFIED` only after all checks pass; any failure records `FAILED` and cannot be interpreted as a backup success.
7. Retention removes only artifacts older than 30 days and never deletes the last eligible recoverable artifact; failures remain visible as sanitized evidence.

### Restore drill flow

The monthly scheduler creates a drill operation for an eligible verified artifact. The isolated runner:

1. downloads the exact artifact and verifies its SHA-256 before restore;
2. provisions or receives an isolated non-production PostgreSQL target;
3. restores the logical artifact without applying unrelated newer migrations before baseline validation;
4. validates migration context, core relations, audit/history, representative evidence linkage, and application compatibility;
5. records start/end times and measured recovery duration;
6. records `RESTORE VERIFIED` only after every required local validation passes;
7. disposes the isolated target and temporary credentials safely.

Corruption, hash mismatch, missing artifact, wrong release/build, migration mismatch, or validation failure produces `VERIFICATION_FAILED` and blocks any success claim.

## Authorization and production boundary

- Drill requests and local isolated execution follow the existing recovery permission boundary.
- Production restore and production reopen use a separate explicit policy path and are denied by default.
- Only the named `yazeed/SYSTEM_OWNER` identity can pass the production authority check.
- Execution must reauthenticate, verify exact artifact ID + SHA-256 + Git SHA/build/release + migration head, require a non-empty reason and request ID, check expected version, perform E-Signature ceremony, and append immutable audit evidence in the same controlled transition.
- Admin, Supervisor, Manager, and any other actor are denied even if they can view the catalog.
- GET routes remain read-only; mutation uses an authenticated server action/use case.

## Readiness and metrics

System health keeps these facts separate:

- backup job state;
- artifact integrity state;
- latest restore verification state;
- AI provider state;
- core readiness state.

The UI/reporting contract displays:

- `RPO target: 24 hours` and measured recoverable-point age separately;
- `RTO target: 4 hours` and measured restore duration separately;
- no `RPO met`, `RTO met`, `DR ready`, or `F-11 closed` label unless current evidence supports it.

AI remains optional. AI `UNKNOWN`, `NOT_CONFIGURED`, or provider failure cannot turn a valid core backup/restore result into failure, and AI cannot approve, authorize, sign, restore, reopen, or set readiness.

## Verification plan

Add tests for:

- R2 adapter contract, private storage, sanitized errors, and no credential leakage;
- logical backup artifact creation, manifest identity, SHA-256, read-after-write verification, and immutable catalog behavior;
- scheduler cadence and 30-day retention, including protection of the last eligible artifact;
- corruption, wrong hash, missing artifact, wrong release/build, and migration mismatch;
- isolated PostgreSQL restore and business/history/file-link validation;
- authorization-negative coverage for Admin/Supervisor/Manager and non-owner identities;
- reauthentication, E-Signature, reason, request ID, expected-version, exact-identity, and audit requirements;
- separate RPO/RTO targets versus measured values;
- AI optionality and core-readiness independence;
- no raw credentials/endpoints/stack traces in catalog/UI/evidence responses.

## Closure gate

After implementation, local verification may prove code and disposable-runtime behavior only. F-11 remains `OPEN / PARTIAL` until all of the following exist for one deployed release:

1. an artifact uploaded to the approved private R2 bucket;
2. immutable catalog identity and SHA-256 evidence;
3. a successful isolated restore drill from that exact artifact;
4. exact deployed Git SHA/build/release binding;
5. sanitized recovery evidence and authorization/audit evidence;
6. current operational review confirming measured RPO/RTO separately from targets.

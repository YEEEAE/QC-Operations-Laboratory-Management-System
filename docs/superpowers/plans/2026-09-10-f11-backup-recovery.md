# F-11 Backup & Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` or `executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build truthful daily PostgreSQL logical-backup and isolated-restore mechanics with private Cloudflare R2 storage, immutable SHA-256 evidence, 30-day retention, monthly drill scheduling, strict production authorization, and separate RPO/RTO measurements.

**Architecture:** Extend the existing `backup-recovery` module with ports for artifact storage, backup execution, release identity, scheduling, and immutable recovery evidence. Use a real Cloudflare R2 S3-compatible adapter configured only from environment, while local tests use an in-memory/file fake and disposable PostgreSQL. Logical `pg_dump` is implemented as a secondary artifact path; physical base backup, WAL, and PITR remain explicitly unsupported unless a real provider/runtime proves them.

**Tech Stack:** Astro 4 SSR/Actions, TypeScript, PostgreSQL 18, Kysely, Node `pg`, AWS S3 protocol client or a minimal signed S3 adapter, Vitest, Testcontainers PostgreSQL, existing authorization/audit/outbox/release-identity layers.

---

## File map

### New files

- `db/migrations/0019_backup_catalog_identity.sql` — immutable catalog identity, manifest context, retention, and restore evidence fields.
- `src/modules/backup-recovery/ports/artifact-store.ts` — private object-store port; no provider details in domain.
- `src/modules/backup-recovery/ports/backup-executor.ts` — logical backup/restore execution port.
- `src/modules/backup-recovery/ports/release-identity.ts` — exact release/build/migration context port.
- `src/modules/backup-recovery/ports/scheduler.ts` — daily/monthly schedule contracts.
- `src/modules/backup-recovery/ports/recovery-evidence.ts` — immutable evidence repository contract.
- `src/modules/backup-recovery/domain/backup-manifest.ts` — manifest identity, SHA-256, status, and sanitized views.
- `src/modules/backup-recovery/domain/recovery-metrics.ts` — RPO/RTO targets and measured values.
- `src/modules/backup-recovery/application/run-backup-job.ts` — create, upload, verify, and catalog a logical artifact.
- `src/modules/backup-recovery/application/run-restore-drill.ts` — exact-artifact isolated restore and validation.
- `src/modules/backup-recovery/application/retention.ts` — 30-day retention with last-eligible-artifact protection.
- `src/modules/backup-recovery/application/schedule-backup-recovery.ts` — daily/monthly scheduler definitions.
- `src/modules/backup-recovery/application/production-recovery-authorization.ts` — yazeed/SYSTEM_OWNER-only gate and ceremony requirements.
- `src/modules/backup-recovery/infrastructure/cloudflare-r2-artifact-store.ts` — private R2 S3-compatible adapter.
- `src/modules/backup-recovery/infrastructure/local-artifact-store.ts` — test-only local store.
- `src/modules/backup-recovery/infrastructure/postgres-logical-backup-executor.ts` — safe `pg_dump`/`pg_restore` adapter for isolated targets.
- `src/modules/backup-recovery/infrastructure/postgres-recovery-evidence-repository.ts` — immutable evidence persistence.
- `scripts/recovery/run-daily-backup.ts` — operator/scheduler entry point with sanitized output.
- `scripts/recovery/run-monthly-restore-drill.ts` — operator/scheduler entry point; no production target.

### Modified files

- `src/modules/backup-recovery/domain/backup-record.ts` — align states with manifest and evidence semantics without conflating job success and restore verification.
- `src/modules/backup-recovery/ports/repository.ts` — add immutable catalog/evidence operations.
- `src/modules/backup-recovery/infrastructure/postgres-repository.ts` — map only sanitized domain fields and enforce identity/version predicates.
- `src/modules/backup-recovery/application/dependencies.ts` — compose provider/runtime adapters server-side.
- `src/modules/backup-recovery/application/request-restore.ts` — preserve drill intent and route production requests through the strict authorization gate.
- `src/shared/authorization/policy-registry.ts` and `db/seeds/common.ts` — add explicit production restore/reopen policy entries without granting them to Admin/Supervisor/Manager.
- `src/shared/health/postgres-health-probes.ts` and system-health application types — expose backup/artifact/restore facts separately; AI remains optional.
- `src/pages/system/health.astro`, `src/pages/system/backups/index.astro`, `src/pages/system/backups/[backupId]/index.astro`, `src/pages/system/backups/[backupId]/restore.astro` — show sanitized manifest/evidence and RPO/RTO target-versus-measured values.
- `src/actions/system.ts` and `src/actions/index.ts` — expose only authenticated POST actions for backup/restore operations.
- `src/config/env.ts`, `.env.example`, `render.yaml`, and operational runbooks — document names only and keep credentials/bucket values external.
- `package.json` — add R2/backup scripts and the selected S3 client dependency if not already available.

### Test files

- `tests/unit/backup-recovery/{manifest,metrics,authorization,retention,scheduler}.test.ts`
- `tests/integration/system/{backup-adapter,backup-job,restore-drill,backup-retention,backup-audit,backup-corruption}.test.ts`
- `tests/integration/database/backup-recovery-migration.test.ts`
- `tests/e2e/backup-recovery.spec.ts` — gated by explicit non-production fixture variables; no false-green skips for required local integration tests.

---

## Task 1: Add the immutable schema and manifest domain

**Files:** migration `0019`, `backup-manifest.ts`, `recovery-metrics.ts`, `backup-record.ts`, database types, migration tests.

- [ ] Write failing unit tests for immutable catalog identity, exact release/build binding, SHA-256 format, logical-artifact labeling, target-versus-measured RPO/RTO, and refusal to mark restore verified from backup-job success.
- [ ] Write a failing migration test that expects manifest identity, artifact reference metadata, retention expiry, measured timings, and immutable recovery evidence storage.
- [ ] Add forward-only migration `0019_backup_catalog_identity.sql`; use append-only evidence rows and restrictive foreign keys. Do not rewrite historical migrations or add plaintext secrets.
- [ ] Implement manifest constructors that require server-generated ID, SHA-256, byte size, PostgreSQL context, Git SHA/build/release, migration head, and UTC timestamps.
- [ ] Implement sanitized public views that exclude object key, bucket, endpoint, credentials, connection strings, and raw errors.
- [ ] Implement metric types with fixed targets `RPO=24h` and `RTO=4h`, plus nullable measured values and an explicit `targetStatus` that remains `UNVERIFIED` unless evidence exists.
- [ ] Run `pnpm exec vitest run tests/unit/backup-recovery tests/integration/database/backup-recovery-migration.test.ts` and expect all new tests to pass on PostgreSQL 18 or to fail setup explicitly, never pass through `--passWithNoTests`.

## Task 2: Define storage/executor/release/scheduler/evidence ports

**Files:** the five new port files and their unit contract tests.

- [ ] Write failing contract tests for `put`, `read`, `head`, SHA/size verification, retention deletion, and private-object behavior.
- [ ] Define `BackupArtifactStore` methods using byte streams/buffers and opaque internal references that are never returned by public views.
- [ ] Define `PostgresBackupExecutor.createLogicalBackup()` and `restoreLogicalBackup()` with explicit isolated-target input, command identity, timings, and sanitized failures.
- [ ] Define `ReleaseIdentitySource.getExactIdentity()` to return Git SHA, build/release ID, migration head, checksum, and PostgreSQL major/minor context.
- [ ] Define scheduler contracts for `daily-backup` and `monthly-isolated-restore-drill`; scheduler output must include a request ID and exact release identity.
- [ ] Define immutable evidence append/read contracts with expected-version checks and no update/delete method.
- [ ] Run the focused contract suite and verify TypeScript signatures compile without importing PostgreSQL/provider code into domain files.

## Task 3: Implement Cloudflare R2 and local artifact adapters

**Files:** `cloudflare-r2-artifact-store.ts`, `local-artifact-store.ts`, env/config files, adapter tests, package lock.

- [ ] Write failing adapter tests for private writes, read-after-write size/hash match, missing object, wrong hash, provider error redaction, and refusal when required runtime variables are absent.
- [ ] Implement R2 using its S3-compatible API and runtime-only variables such as endpoint/access key/secret/bucket. Do not hard-code values, print them, or call R2 during build/tests without an explicit fixture.
- [ ] Set private object behavior and avoid public URLs; return opaque references only inside infrastructure.
- [ ] Implement a deterministic local adapter for tests that can corrupt/delete objects to exercise negative paths. Do not wire it as the production adapter.
- [ ] Add `.env.example` names and runbook instructions; keep actual credentials and bucket outside source control. Do not add them to `render.yaml` as literal values.
- [ ] Run adapter tests and a source scan proving no credential literal, public bucket URL, or R2-as-PostgreSQL/WAL/PITR wording exists.

## Task 4: Implement logical PostgreSQL backup execution and daily job

**Files:** `postgres-logical-backup-executor.ts`, `run-backup-job.ts`, `run-daily-backup.ts`, application dependencies, repository, tests.

- [ ] Write failing integration tests using disposable PostgreSQL for creating a logical artifact, restoring its bytes, binding the artifact to the exact release identity, and failing safely when `pg_dump` exits non-zero.
- [ ] Implement execution in a temporary directory with arguments passed as an array, no shell interpolation, no password in command arguments, and connection strings supplied through a controlled process environment.
- [ ] Compute SHA-256 and byte size from the final artifact bytes; upload the artifact and manifest; read back and verify the same values before cataloging `VERIFIED`.
- [ ] Persist `FAILED` plus sanitized error code for any executor/provider/hash/catalog failure. Never persist raw stderr or mark a job `SUCCEEDED` after partial upload.
- [ ] Bind every artifact to current Git SHA/build/release/migration identity; reject unknown or dirty production identity instead of guessing.
- [ ] Add a daily scheduler entry point that is safe to rerun via request ID/idempotency and emits machine-readable sanitized evidence.
- [ ] Run the backup-job integration suite against PostgreSQL 18 and the local artifact adapter; record setup failures as blocked, not passed.

## Task 5: Implement retention and monthly isolated restore drills

**Files:** `retention.ts`, `run-restore-drill.ts`, `schedule-backup-recovery.ts`, executor/repository infrastructure, integration tests.

- [ ] Write failing tests for 30-day expiry, keeping the last eligible recoverable artifact, idempotent cleanup, missing/corrupt artifact, wrong SHA, wrong release/build, and migration mismatch.
- [ ] Implement retention using UTC timestamps and an explicit policy constant; never delete controlled business history or the last eligible artifact.
- [ ] Write a real isolated PostgreSQL restore integration test that loads the exact cataloged bytes into a disposable target, validates schema/migration context, audit/history, representative business relationships, and file/evidence linkage where fixtures exist.
- [ ] Implement monthly drill scheduling as a trigger contract; production is never an accepted drill target.
- [ ] Record start/end times, measured recovery duration, artifact identity, validation outcomes, target isolation, and sanitized known gaps in append-only recovery evidence.
- [ ] Set `VERIFIED` only after all required local validations pass; set `VERIFICATION_FAILED` on any negative condition.
- [ ] Run the isolated restore suite repeatedly and confirm corruption/hash failures never produce a green result.

## Task 6: Enforce production restore/reopen authorization and audit

**Files:** `production-recovery-authorization.ts`, `request-restore.ts`, policy registry/seeds, e-signature integration, authorization tests.

- [ ] Write failing negative tests proving Admin, Supervisor, Manager, and non-owner identities cannot restore/reopen production, even with catalog-view or drill permissions.
- [ ] Write failing positive-contract tests requiring exact identity, reauthentication, E-Signature, non-empty reason, request ID, expected version, and immutable audit evidence.
- [ ] Implement a dedicated production gate that accepts only the named `yazeed/SYSTEM_OWNER` actor and exact production authority policy; all unresolved conditions return safe `AUTHZ_DENIED`.
- [ ] Reauthorize at execution time, not only at page render/request creation. Validate artifact SHA, catalog ID, Git SHA/build/release, migration head, expected version, and target environment server-side.
- [ ] Integrate the existing e-signature ceremony without storing passwords/signature secrets in evidence. Append audit and recovery evidence transactionally with the controlled state change.
- [ ] Keep production execution unavailable in local-only mode unless an explicit approved production fixture is present; local tests must verify denial.
- [ ] Run authorization-negative, e-signature, audit, replay, stale-version, and redaction suites.

## Task 7: Wire health/UI/actions without false-green status

**Files:** system-health types/probes/dependencies, system pages, system actions, UI tests.

- [ ] Write failing UI/contract tests for separate backup-job, artifact-integrity, restore-verification, RPO-target/measured, RTO-target/measured, AI, and core-readiness facts.
- [ ] Add sanitized backup posture fields to System Health; `SUCCEEDED` backup must still display `RESTORE NOT VERIFIED` until a real evidence row exists.
- [ ] Add catalog/detail views for manifest identity and known gaps without object references, endpoints, credentials, raw errors, or misleading “Backup Healthy/DR Ready” badges.
- [ ] Add authenticated POST-only actions for daily backup trigger, drill request, and controlled restore intent. GET remains read-only.
- [ ] Keep AI health optional and advisory-only; AI `UNKNOWN`/`NOT_CONFIGURED` cannot change core readiness.
- [ ] Add explicit display strings: `RPO target: 24 hours`, `RPO measured: ...`, `RTO target: 4 hours`, `RTO measured: ...`; no “met” claim without current evidence.
- [ ] Run Astro check, UI unit tests, action contract tests, and route smoke tests with no session and with a disposable fixture.

## Task 8: Add operational docs, evidence report, and closure gate

**Files:** `docs/operations/` runbooks, `audit/F-10-F-11-policy-deployment-package.md`, new F-11 evidence report, package scripts, CI checks.

- [ ] Document R2 as private object storage only, clearly separate from PostgreSQL backup/WAL/PITR, and list runtime variable names without values.
- [ ] Document daily job, 30-day retention, monthly isolated drill, cleanup, credential rotation, and operator-safe failure handling.
- [ ] Document logical-export scope and explicitly mark physical base backup/WAL/PITR as unproven unless separately evidenced.
- [ ] Add a machine-checkable F-11 report that distinguishes implementation evidence, local disposable evidence, provider evidence, deployed-release evidence, and unverified gates.
- [ ] Update the policy/deployment package only with actual current results; do not mark F-11 closed from local tests.
- [ ] Add a closure command/check that requires the same deployed release identity for artifact and restore evidence, otherwise exits non-zero with sanitized output.
- [ ] Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:architecture`, focused unit/integration tests, `pnpm build`, and `git diff --check`.

## Final verification and status rule

- [ ] Run the full applicable local gates on Node `24.20.0` and PostgreSQL 18 disposable runtime.
- [ ] Run corruption, wrong-hash, missing-object, authorization-negative, retention, audit, and isolated-restore tests.
- [ ] Verify no production database or production R2 bucket was touched during local work.
- [ ] Record actual measured RPO/RTO only from completed evidence; never infer them from configuration.
- [ ] Keep F-11 status `OPEN / PARTIAL` because the selected path is local-only and lacks an artifact plus successful isolated restore from the same deployed release.
- [ ] Update `.agents/mind/01-mind-latest.md` at the top with actual files, commands, results, limitations, and the honest final status.
- [ ] Do not commit, push, deploy, or mutate production unless the user separately requests and confirms those actions; repository policy forbids push and unrequested commits.

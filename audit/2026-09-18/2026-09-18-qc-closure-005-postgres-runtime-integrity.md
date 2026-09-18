# QC-CLOSURE-005 — PostgreSQL, Migrations, Transactions & Integrity

Frozen at task start and re-confirmed at the end of the runtime run.

| Item              | Value                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| HEAD              | `587e807619d9b9e606e22d5bce992ee9f2617a20` (`main`)                            |
| Working tree      | uncommitted QC-CLOSURE-005 changes (no commit, no push, no deploy)             |
| Node / pnpm       | `v22.22.3` / `11.25.0` — **outside** the declared `>=24.20.0 <25` contract     |
| Migration head    | `0024_identity_rbac_grant_integrity` (24 migration files)                       |
| Disposable server | PostgreSQL **18.6** (Homebrew), own PGDATA under `.tmp/pg18`, port `55432`     |
| Container runtime | **unavailable** (`~/.docker/run/docker.sock` missing) — Docker path not run     |

## Runtime environment

Docker is not available on this host, so Testcontainers cannot start. The task
allows an approved equivalent disposable environment; `scripts/db/disposable-postgres.sh`
provisions a local PostgreSQL 18.6 cluster that is:

- created fresh under `.tmp/` (gitignored) with its own `initdb` data directory,
  socket directory, and port; `status`/`stop` subcommands manage its lifecycle;
- reachable without weakening the canonical connection policy — it serves TLS
  from a throwaway local CA (SAN `localhost`, `127.0.0.1`) so suites connect with
  `sslmode=verify-full&sslrootcert=…`, because `sslmode=disable` is rejected by
  `getDatabaseConnectionConfig` and a missing `sslmode` forces certificate
  verification;
- exposed to tests through the pre-existing `QC_TEST_DATABASE_URL` escape hatch.

## CLI pipeline — empty database to head

Run against a freshly provisioned, schemaless `qc_disposable`.

```text
db:preflight       connectivity PASS, PostgreSQL 18.6, schemaQcExists false,
                   migrationCountApplied 0, migrationCountPending 24,
                   transactionReadOnly true
db:migrate:check   {"status":"ok","migrations":24}
db:migrate         applied 0001…0024, pending []
db:migrate:status  applied 0001…0024, pending []
db:schema:check    {"status":"ok","migrationCount":24,"tableCount":70,"orphanCount":0}
```

`pnpm db:preflight` also re-confirmed the canonical TLS path end to end; the
server reported `current_setting('ssl') = on`, and native `uuidv7()` is available
(PostgreSQL 18-only) — which is why migration `0001` requires PG18.

## Test suites (runtime, same HEAD + working tree)

| Suite               | Result                                              |
| ------------------- | --------------------------------------------------- |
| `pnpm test:integration` | **PASS** — 80 files / 314 tests (before fixes: 6 failed files, 304 passed, 1 skipped) |
| `pnpm test:migrations`  | **PASS** — 6 files / 22 tests (before fixes: 3 failed) |
| `pnpm test:concurrency` | **PASS** — 2 files / 12 tests (previously PASS)  |
| `pnpm test:unit`        | **PASS** — 76 files / 497 tests                  |

Static gates on the final tree: `astro check` 736 files / 0 errors / 0 warnings,
`eslint .` clean, `prettier --check .` clean, `test:architecture` PASS,
`pnpm build` PASS, `git diff --check` clean.

Captured logs: `.tmp/qc-closure-005/` (`acceptance.log`,
`integration-before-fixes.log`, `integration-after-fixes.log`).

Provenance note: the per-test totals above were measured on the final test set.
After the last harness-fixture edit, the acceptance re-run re-confirmed the three
database suites at file level (80 / 6 / 2 files, zero failures) before further
test execution was stopped on request; the file-level result is the last
recorded runtime state.

## Migration review (0001 → 0024)

Reviewed every migration in order at source level, then verified the resulting
schema at runtime.

- **Keys and relationships.** Every table has a `uuidv7()` primary key (except
  the intentional composite keys: `qc.role_permissions`, `qc.rate_limit_windows`,
  and the natural key on `qc.schema_migrations`). All foreign keys are
  `ON DELETE RESTRICT`; zero `ON DELETE CASCADE` exists in `qc`, so controlled
  history cannot be cascade-destroyed (`db:schema:check` + `database/constraints`).
- **Uniqueness.** Business numbers are unique (`task_no`, `finding_no`, `ncr_no`,
  `capa_no`, `receiving_no`, `equipment_no`, `calibration_no`, `document_no`,
  `change_no`, `inspection_no`, `lab_test_no`, …), plus partial unique indexes
  for the invariants that only apply to live rows: one `EFFECTIVE` document
  version per document (`0011`), one active scope per `(user, kind, value)`
  (`0016`), one active role grant per `(user, role)` (`0024`), and one artifact
  per `(release_id, checksum)` (`0019`).
- **Nullability and check constraints.** Enumerated state columns use `CHECK (state IN …)`;
  paired lifecycles are enforced structurally (`(revoked_at IS NULL) = (revoked_by IS NULL)`,
  `(used_at, revoked_at)`, notification subject pair, CAPA/session revocation pairs);
  value shapes are constrained (`checksum`/`sha256`/`request_fingerprint` as
  `^[0-9a-f]{64}$`, `git_sha` as 40 hex, non-negative counters and `size_bytes`).
  `qc.inspection_report_results` and `qc.lab_measurements` enforce exactly one
  value column with `num_nonnulls(…) = 1`.
- **Timestamps.** Every `*_at` column is `TIMESTAMPTZ`; runtime check for
  non-`timestamp with time zone` event timestamps returns zero rows.
- **Controlled history / evidence.** Immutable, append-only evidence tables
  (`release_gate_evidence`, `release_risk_evidence`, `recovery_evidence`,
  `uat_*`, `capa_close_snapshots`, `inspection_report_snapshots`,
  `lab_test_snapshots`) carry `evidence_version > 0`, `immutable_reference`,
  observed-at, and release identity; snapshot stages are versioned per subject.
- **Optimistic concurrency.** `version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0)`
  on `users`, `sessions`, `tasks`, checklist items, `findings`, `ncrs`, `rcas`,
  `capas`, `capa_actions`, `receiving_items`, `inspection_*`, `lab_*`, `equipment`,
  `calibration_records`, `maintenance_records`, `document_*`,
  `approval_cases`/`work_items`, `change_requests`, `release_candidates`.
  `user_roles`/`user_scopes` deliberately have **no** version column, so no
  fake `expectedVersion` check is invented for them.
- **Idempotency / outbox / audit.** `idempotency_records` (unique key,
  fingerprint, status with `(status='COMPLETED') = (completed_at IS NOT NULL)`);
  `outbox_events` (unique `dedupe_key`, non-negative `attempt_count`, partial
  index on unprocessed rows); `audit_events` (`event_no` identity, `request_id`
  NOT NULL, actor lineage FK).
- **Sessions.** `sessions` has unique token hash, `expires_at > created_at`,
  revocation pair, and a live-session expiry index.
- **Release governance / UAT.** `release_candidates` (state `PENDING`/`RELEASE_APPROVED`,
  40-hex git SHA), `release_approvals` (unique `release_id`, unique `request_id`,
  authority `MANAGER`/`SYSTEM_OWNER`, signature FK), gate/risk evidence with
  `status IN ('PASS','PARTIAL','FAIL','UNVERIFIED','NOT_APPLICABLE')` and
  `source = 'CONTROLLED_RISK_REGISTER'` for risk rows, and UAT cycles/sessions/
  defects/acceptances with unique signer + signature evidence.
- **Deferred constraints are intentional and closed.** `0008` adds the
  inspection snapshot FK only after the snapshot table exists (circular
  reference); `0010` closes the `0009` laboratory equipment boundary; `0011`
  closes the `0009` document boundary.

**Migration policy respected:** no historical migration was rewritten. The
`0024` schema tightening is a new forward migration that first repairs existing
data (de-duplicates active role grants, preserving the oldest; clears
non-canonical `OWN`/`ASSIGNED`/`GLOBAL` scope values) and only then adds the
stricter constraint. Checksums are validated by the runner and by
`db:migrate:check`.

## Transaction audit

The codebase has 44 `Kysely.transaction()` call sites. Repositories that must
write a mutation together with its audit event and/or outbox event rebind the
shared PostgreSQL repositories onto the transaction handle
(`auditFor(tx)` / `outboxFor(tx)`), so audit, outbox, evidence, and the state
transition commit or roll back as one unit. Verified concretely for the two
highest-consequence paths:

- `PostgresAuthorizationRepository.assignUserRole` — `user_roles` grant and the
  `ASSIGN_USER_ROLE` audit event inside one transaction.
- `PostgresReleaseGovernanceRepository.approve` — idempotency reservation,
  `SELECT … FOR UPDATE` on the candidate, signature, approval row, candidate
  state transition, audit event, and idempotency completion inside one
  transaction, with evidence re-derived and re-verified before commit.

Two new runtime proofs were added to demonstrate the "no half-committed state"
contract (previously unproven at runtime). Each injects a `BEFORE INSERT`
trigger on `qc.audit_events` that raises, then asserts the operation aborted at
that step (`/injected audit failure/`) **and** that nothing persisted:

- release approval → candidate still `PENDING` at version `1`, zero approval
  rows, zero signature rows, zero audit rows, zero idempotency rows;
- role grant → zero active `user_roles` rows for the pair, zero audit rows.

## Defects found and fixed (root cause)

| # | Type | Defect | Root cause / fix |
| - | ---- | ------ | ---------------- |
| D1 | **product** | `RevokeUserSessionsUseCase` could never succeed — always `AUTHZ_DENIED`. | `PERM-IDN-REVOKE-SESSIONS` is an approved permission (PERMISSION-MATRIX §28, SECURITY-ARCHITECTURE §20) but had **no entry in `policy-registry.ts`**, so the policy lookup failed closed forever. Added the `REVOKE_SESSIONS`/`USER` policy for `ACTIVE`/`INACTIVE`/`DISABLED` targets. |
| D2 | **product** | Replaying a committed release approval with the same request id failed with `DOMAIN_INVALID_TRANSITION`. | `ApproveReleaseUseCase` evaluated `candidate.state !== 'PENDING'` **before** delegating, so the repository's idempotency replay (which returns the stored result) was unreachable. Added `ReleaseGovernanceRepository.resolveReplay` and resolve replay before any state/version/authority evaluation; a reused request id with different content still fails closed with `CONFLICT_DUPLICATE_COMMAND`. |
| D3 | test | `database/migrations.test.ts` (2 tests) and `database/upgrade-path.test.ts` (1 test) failed. | Hard-coded migration counts (`23`, `19`) drifted the moment `0024` was added. Expectations now derive from `loadMigrations()`. |
| D4 | test | `actions/server-contract.test.ts` could not run without Docker. | It started its own container, bypassing the `QC_TEST_DATABASE_URL` escape hatch. The TLS container provisioning moved into the shared helper behind an opt-in `{ tls: true }` mode. |
| D5 | test | `identity/system-owner-access.test.ts` failed with "unable to verify the first certificate" **and** "Called end on pool more than once". | The operator script connects through `getDatabaseConnectionConfig`, so it needs a TLS cluster — a plain container URL can never satisfy it; the suite now requests `{ tls: true }`. Separately, a nested Kysely `destroy()` was ending the suite-owned pool (Kysely's `PostgresDriver.destroy()` calls `pool.end()`), so that reader got its own pool. The same pool aliasing was corrected in `identity-rbac-postgres.test.ts`. |
| D6 | harness | `scripts/db/disposable-postgres.sh` version guard rejected PG18, and openssl left a stray `.srl` in the repository root. | Found by actually running the harness. Guard now matches both version spellings; `-CAserial` is set explicitly so no file lands in the working directory. |

## Acceptance criteria

| Criterion | Status | Evidence |
| --------- | ------ | -------- |
| Empty PostgreSQL 18 database migrates from `0001` to current head | **PASS** | `db:migrate` applied `0001…0024` on a schemaless database |
| Migration checksums valid | **PASS** | `db:migrate:check` `{"status":"ok","migrations":24}`; integrity test rejects tampered checksums |
| Schema integrity passes | **PASS** | `db:schema:check` 24 migrations / 70 tables / 0 orphans |
| Zero unexpected pending migrations | **PASS** | `db:migrate:status` `pending []` |
| No FK or orphan defects | **PASS** | zero orphans across every single-column FK; zero `ON DELETE CASCADE` |
| Concurrency tests pass | **PASS** | `test:concurrency` 12/12; plus advisory-lock and business-number races |
| Transactional failure paths tested | **PASS (new)** | two injected-failure atomicity proofs (release approval, role grant) |

## Not verified / limits of this evidence

- **Docker/Testcontainers path not executed here** — no container runtime on
  this host. The helper's container branches (including the new TLS container)
  are **NOT VERIFIED** at runtime; only the external-cluster branch is proven.
  This includes the exact `postgres:18-alpine` image path used in CI.
- **Node `v22.22.3` is outside the declared `>=24.20.0 <25` contract**, so this
  is local environment evidence, not runtime-parity evidence.
- **GitHub exact-HEAD CI remains blocked** (account billing lock, job never
  started). Nothing in this task changes that.
- Unchanged and still open: authenticated E2E execution, UAT cycles, provider
  evidence ingestion, live performance/accessibility matrices, and any
  production/provider claim. This evidence is **local PostgreSQL integrity
  evidence only** — it is not a production, UAT, or release-readiness claim.
- The disposable cluster is local-only and must never be pointed at a shared or
  production database.

## Files changed

Product: `src/shared/authorization/policy-registry.ts`,
`src/modules/release-governance/{ports/repository.ts,application/approve-release.ts,infrastructure/postgres-repository.ts}`.

Tests: `tests/helpers/postgres-container.ts`,
`tests/integration/{actions/server-contract,database/migrations,database/upgrade-path,identity/identity-rbac-postgres,identity/system-owner-access,release-governance/release-concurrency}.test.ts`,
`tests/unit/{shared/authorize,release-governance/release-approval}.test.ts`.

Harness: `scripts/db/disposable-postgres.sh` (new).

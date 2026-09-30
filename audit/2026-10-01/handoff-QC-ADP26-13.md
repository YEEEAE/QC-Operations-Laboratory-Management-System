# QC-ADP26-13 — credential/session/audit atomicity and account confirmation

- **State:** PARTIAL / NO-GO for acceptance.
- **Date:** 2026-10-01 (Asia/Riyadh).
- **Audit baseline:** requested HEAD `0b1bb21bb3b4eca77862dbba1da8623044e96355` did not match the current candidate. Work was rebound to HEAD `831a0f4396e2ae6ea3766489be06012e2ff753ce`, branch `main`. The checkout was clean before work. Final dirty fingerprint is recorded at `.ci-results/build.json` → `candidate.sourceFingerprint` (evidence is generated after this handoff is written).
- **Runtime:** Node `24.20.0`; pnpm `11.25.0`.
- **Schema:** source migration head `0042_immutable_lab_equipment_usage.sql`; applied schema and migration ledger NOT VERIFIED. No schema change was needed and no migration was added.

## Changed

- Added `CredentialMutationCommit` and a PostgreSQL implementation that performs a version-checked user password update, revocation of every active session, and secret-free audit insert in one transaction. An error at any write rejects the transaction.
- Routed both self-service password changes and administrator password resets through that commit. Authorization and scope remain in the use cases; the self-service change also evaluates the persisted account state and uses the user's current version as the compare-and-set value.
- Corrected `/account` copy to explain that every session, including the current one, ends. Field errors are associated with the password inputs, values are not repopulated, duplicate submits are blocked in the browser and by version CAS, and confirmed success redirects with HTTP 303 to login.
- Added a login notice that confirms the password change and requests sign-in with the new password. Stale, denied, provider unavailable, and unknown commit outcomes have distinct safe feedback; unknown outcomes do not claim rollback or invite an immediate resubmit.
- No external event is emitted by this operation. An outbox is not required for the current synchronous, same-database effects; the audit row is part of the same PostgreSQL transaction.

## Database read/write boundary

- **Reads:** the authenticated actor comes from server session resolution; the use case reads the actor's user row and verifies the current password hash. It uses the resolved actor permission and persisted ACTIVE state.
- **Writes:** `users.password_hash`, `users.must_change_password`, `users.updated_at`, `users.updated_by`, and `users.version`; all active `sessions` for the user receive `revoked_at` and the approved reason; `audit_events` receives only actor/subject IDs, action, and request ID. No password, hash, or token is in audit payload/reason.
- **Concurrency/constraints:** `users.id` plus the expected `users.version` condition is the CAS boundary. A lost race raises `CONFLICT_STALE_VERSION`; the transaction rolls back. A duplicate browser POST can therefore commit at most once for the observed version.
- **Transaction boundary:** one Kysely PostgreSQL transaction encloses the credential update, all session revocations, and audit append. No live database was available to inspect before/after rows or applied constraints.

## Evidence

| Item | Status | Evidence / limit |
|---|---|---|
| Candidate SHA and dirty fingerprint | PASS | SHA above; final source fingerprint in `.ci-results/build.json` after evidence generation. |
| Node / pnpm | PASS | Node 24.20.0 and pnpm 11.25.0 meet `package.json` contract. |
| Source schema | PASS | `db/migrations/0042_immutable_lab_equipment_usage.sql` is the source head; no migration created. |
| Applied schema / role binding | NOT VERIFIED | No disposable PostgreSQL 18 cluster/runtime or authenticated database fixture. No production connection was used. |
| Build identity | PASS | Fresh `pnpm run verification:begin` and `pnpm run build`; identity in `.ci-results/build.json`. The Astro build completed and the evidence writer passed on the fresh run. |
| Focused application/recovery tests | PASS | `tests/integration/identity/account.test.ts`, `tests/unit/admin/identity-admin.test.ts`, and `tests/unit/identity/session-recovery.test.ts`: 19/19 PASS on Node 24.20.0. Covers safe account projection, valid self-change command, missing/incorrect current credential, authorization/reset behavior, and confirmed login copy. In-memory cases are not PostgreSQL proof. |
| PostgreSQL 18 transaction success/failure injection | BLOCKED | Added `tests/integration/identity/identity-rbac-postgres.test.ts` coverage for audit failure after credential update and session revocation, rollback/no partial rows, two-session invalidation, old-password rejection, new-password login, and secret-free audit. The two selected PG suites reported 14 skipped and failed setup because Testcontainers found no working container runtime; no test body executed. Host PostgreSQL is 14.19, so it is not an accepted substitute for PostgreSQL 18. |
| Old credential rejected / all sessions revoked | NOT VERIFIED | PostgreSQL scenario is authored but did not execute. |
| Malformed/current credential refusal | PARTIAL | Missing and incorrect current password refusal pass in the unit suite; authenticated malformed HTTP submission was not exercised. |
| Failure after commit / unknown outcome | NOT VERIFIED | Transaction structure is in source, but no PostgreSQL commit failure injection or network ambiguity test ran. UI distinguishes unknown from provider/stale/denied without claiming rollback. |
| Typecheck | FAIL | `astro check` found the pre-existing `Date.formatDate` error in `src/pages/quality/findings/index.astro`; no remaining duplicate-import or changed identity/page type errors. The error is outside this task and was not modified. |
| Direct HTTP / authenticated browser / actual page | NOT VERIFIED | No authenticated fixture and no PostgreSQL 18 runtime. |
| 320/375/768/1440 CSS px, 200% zoom, keyboard, manual AT | NOT VERIFIED | No live authenticated page or manual assistive-technology run. Source has field associations, focus to the refusal message, and live announcements. |
| Human UAT / owner acceptance | NOT RUN | No participant execution or owner signature. |
| Before/after database snapshot | BLOCKED | No database scenario ran; no row/audit/outbox delta is claimed. |
| Secrets in logs/evidence | PASS (source review) | No credentials were supplied or printed; audit input excludes credential values. A full runtime log scan was not applicable because the database test did not start. |

## Verification commands and outcomes

- `PATH=/Users/yzydalshmry/.nvm/versions/node/v24.20.0/bin:$PATH pnpm exec vitest run tests/integration/identity/account.test.ts tests/unit/admin/identity-admin.test.ts tests/unit/identity/session-recovery.test.ts` — **19/19 PASS**.
- `PATH=/Users/yzydalshmry/.nvm/versions/node/v24.20.0/bin:$PATH pnpm exec vitest run tests/integration/identity/identity-rbac-postgres.test.ts tests/integration/system/control-center.test.ts` — **BLOCKED during setup**: 14 tests skipped; Testcontainers could not find a working container runtime; no database cases ran.
- `PATH=/Users/yzydalshmry/.nvm/versions/node/v24.20.0/bin:$PATH pnpm exec astro check` — **FAIL**, existing `Date.formatDate` error at `src/pages/quality/findings/index.astro`; task files reported no remaining type errors.
- `PATH=/Users/yzydalshmry/.nvm/versions/node/v24.20.0/bin:$PATH pnpm run verification:begin && pnpm run build` — **PASS** on the fresh evidence run; see `.ci-results/build.json` for candidate, source fingerprint, migration head, runtime, and artifact digests.
- `pnpm exec prettier --write` — PASS for changed TypeScript/test files. Prettier has no Astro parser installed in this checkout; `.astro` source formatting was not asserted by Prettier.
- `python3 scripts/diagnostics/generate-workspace-map.py` — PASS; engineering workspace map refreshed.
- `git diff --check` — PASS.

## Page and finding disposition

- `/account` / `RT-SHARED-003`: C2 (session copy) and source-level C3 (field-safe feedback/recovery) are **closed in source**. C4 (credential/session/audit atomicity) is **implemented but NOT VERIFIED against PostgreSQL 18**. Authenticated route, direct HTTP, responsive widths, zoom, manual AT, and UAT remain open.
- `/admin/users/[userId]`: administrative password reset now uses the same transaction-bound commit. Page-level PG18 lifecycle and authenticated acceptance remain **NOT VERIFIED**.
- `QC-PAGE-F-013`: **PARTIAL / OPEN** pending PostgreSQL 18 transaction/failure/replay evidence and candidate-bound page acceptance. The source finding is not marked closed and no score is raised.
- The supplied adaptive audit JSON is bound to its recorded audit HEAD `0b1bb21…`, while the present candidate is `831a0f43…`. Its historical aggregate/card denominators were left intact; this handoff is the candidate-rebound evidence record.

## Decisions and remaining work

- No unresolved business-policy decision blocks the source change; existing behavior already revokes all sessions after password change/reset. The Identity/Admin service owner remains unresolved in the governance register and is not inferred here.
- Run the authored integration suite on an isolated PostgreSQL 18.6 database, including audit-failure rollback, credential update/session-revoke fault injection, concurrent version race/replay, audit secrecy, and before/after snapshots.
- Execute authenticated direct HTTP and browser flows with a bound ACTIVE employee self-account and an authorized administrator fixture, including a valid read control and denials against existing valid records.
- Check the page at 320/375/768/1440 CSS px and 200% zoom; complete keyboard and manual AT review. Human UAT and owner acceptance remain separate and unsigned.

## Files

- Runtime: `src/actions/account.ts`, `src/modules/identity/application/change-password.ts`, `src/modules/identity/application/admin-reset-password.ts`, `src/modules/identity/application/identity-dependencies.ts`, `src/modules/identity/application/admin-dependencies.ts`, `src/modules/identity/ports/credential-mutation.ts`, `src/modules/identity/infrastructure/postgres-credential-mutation-commit.ts`, `src/pages/account.astro`, `src/shared/identity/session-recovery.ts`.
- Evidence/tests: `tests/integration/identity/account.test.ts`, `tests/integration/identity/identity-rbac-postgres.test.ts`, `tests/integration/system/control-center.test.ts`, `tests/unit/admin/identity-admin.test.ts`, `tests/unit/identity/session-recovery.test.ts`.
- Project context: `.agents/mind/01-mind-latest.md`, `workspace-map/ENGINEERING.md`.

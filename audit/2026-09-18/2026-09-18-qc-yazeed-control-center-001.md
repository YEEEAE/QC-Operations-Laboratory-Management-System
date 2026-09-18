# QC-YAZEED-CONTROL-CENTER-001 — Canonical Owner System Control Center

> Date: 2026-09-18 · HEAD at execution: working tree on top of `e7d5fc1` (uncommitted).

## Scope delivered

- New canonical route `RT-SYSTEM-002 — /system/control-center` classified explicitly
  `YAZEED_ONLY` in `src/shared/routing/routes.ts` (same single-owner architecture as
  `/system/health`; no second owner guard was created).
- Navigation item "Control center" in the System group; `visibleNavigation` filters it
  through `pageAccessDecision`, so only the canonical owner sees it. Direct URL access by
  any other account collapses to server-side 404 in `src/middleware.ts` (existence is not
  disclosed).
- Page `src/pages/system/control-center.astro` with defense-in-depth `isNamedSystemOwner`
  check in the frontmatter, plus sections:
  1. **System overview** — live sanitized application/PostgreSQL/audit status, applied vs
     expected migration head with drift detection, release identity (release/build ID, Git
     SHA, version, environment), generated-at in Asia/Riyadh conventions, backup posture
     linked to the existing governed pages. No secrets, connection strings, or stack data.
  2. **Accounts** — full account register with totals (ACTIVE/INACTIVE/DISABLED),
     server-rendered search/filter/sort/pagination (works without client JS), roles/scopes
     summaries, last login, optimistic-concurrency version, PROTECTED OWNER badge, and a
     link to the existing account administration workspace (`/admin/users/[userId]`) which
     carries all owner-level mutations (profile, activate/disable, reset password, revoke
     sessions, role/scope grants) through audited use cases.
  3. **Create account** — reuses `actions.admin.createUser` → `CreateUserUseCase`
     (transactional provisioning with initial roles/scopes, argon2id hashing, audit).
     No account-creation logic was duplicated in the page.
  4. **Roles & permissions** — read view over `ListRolesUseCase` with links to the governed
     admin matrices; protected owner grants remain enforced at the persistence layer
     (`isProtectedOwnerRoleGrant` / `isProtectedOwnerScope`).
  5. **System configuration** — explicit documented posture: secrets stay provider-managed;
     no persisted settings model exists and none was invented (would require a forward
     migration + typed repository + validation + audit + optimistic concurrency).
  6. **Recent administrative activity** — sanitized audit list via the canonical
     `AuditQueryService` allowlist (payload/secret columns never leave the store).

## New application/infrastructure code

- `src/modules/system-health/application/get-control-center-overview.ts` —
  `GetControlCenterOverviewUseCase`: named-owner gate (`AUTHZ_DENIED` for every
  non-canonical actor, including SYSTEM_OWNER role holders and full-permission admins),
  failure-isolated probes, migration drift computed from `qc.schema_migrations` vs shipped
  migration files, release identity projection.
- `src/modules/system-health/infrastructure/postgres-migration-status.ts` —
  `createPostgresMigrationStatus` (ledger read + shipped-file diff; bare-version
  comparison against the full release `migrationHead` name) and
  `createPostgresAuditReadiness` (ledger readability probe). Both are sanitized and
  read-only over the shared pool.
- `controlCenterReadDependencies()` wiring in
  `src/modules/system-health/application/dependencies.ts`.

## Evidence

- Unit: `tests/unit/routing/control-center-access.test.ts` 5/5 PASS (visibility matrix:
  anonymous/employee/supervisor/manager/admin/non-canonical SYSTEM_OWNER/full-permission →
  denied; inactive/disabled yazeed → denied; canonical owner → allowed; nav visibility).
- Unit: `tests/unit/system-health/control-center-overview.test.ts` 4/4 PASS (owner gate,
  sanitized view, drift reporting, fail-closed sanitization with secret/connection-string
  assertions).
- Integration (real PostgreSQL 18 disposable cluster, `QC_TEST_DATABASE_URL`):
  `tests/integration/system/control-center.test.ts` 6/6 PASS — non-canonical denial,
  live overview with real migration head `0025`, full account lifecycle
  (create-provisioned → list → update (optimistic concurrency) → scope remove → disable →
  activate → admin reset password → revoke sessions) with audit persistence
  (`CREATE_USER_PROVISIONED`, `UPDATE_USER`, `REMOVE_USER_SCOPE`, `DISABLE_USER`,
  `ACTIVATE_USER`, `ADMIN_RESET_PASSWORD`, `REVOKE_USER_SESSIONS`), protected owner grant
  removal rejected and grants preserved, atomic rollback on invalid role set, audited
  scope assignment.
- E2E: `tests/e2e/control-center.spec.ts` (2 tests listed by Playwright) — gated on
  `QC_VERIFY_*` fixtures and covering: non-owner URL denial + absent navigation item; and the
  owner journey (nav → control center → system overview → account search → create account →
  open workspace → edit profile → assign role → revoke sessions → verify audit → safe
  cleanup by disabling the verification account). Execution is **NOT VERIFIED** (same
  standing blocker as all authenticated E2E on this host).
- Static gates: typecheck (`0 errors / 0 warnings`), lint, build, architecture (boundary +
  route-file integrity) — PASS.
- `pnpm format:check` reports a **pre-existing** failure on
  `audit/QC-Master-Prompts-Interactive-Copy-v2.html`, which is committed unformatted at
  HEAD `e7d5fc1` and untouched by this task (proven by running Prettier against
  `git show HEAD:<file>`). Every file changed by this task passes Prettier.

## Live runtime evidence (built server + disposable PostgreSQL, local only)

Server booted with the built `dist/server/entry.mjs` against the disposable cluster
(`/api/health/ready` = 200):

- Anonymous `GET /system/control-center` → `303` redirect to the login page.
- Authenticated non-owner (`ADMIN` + user-management permission) → `404`, control-center
  navigation item absent from the rendered shell (0 matches).
- Authenticated permission-less actor posting to the create-user action → `403
  AUTHZ_PERMISSION_MISSING`, no row created (the negative actor had no user-management
  permission; an ADMIN legitimately holding that permission remains authorized by the
  action's own model — page visibility never granted or removed mutation authority).
- Canonical owner (`yazeed` + SYSTEM_OWNER + GLOBAL, granted via the canonical
  `pnpm access:grant-system-owner` operator tool — the foundation seed intentionally
  does not create the role) → `200` with all sections rendered, `PROTECTED OWNER` badge
  present, owner navigation item present (4 references), and secret scan of the rendered
  HTML: 0 hits for `password_hash|session_token|postgres://`.
- `POST /_actions/admin.createUser` from the owner session → `200`, user persisted ACTIVE
  with `must_change_password=true`, and `CREATE_USER` audit event recorded.


## Boundaries / non-claims

- `PASS ≠ RELEASED`; nothing here is a production/UAT claim.
- No direct SQL in the page; all reads/mutations flow through repositories/use cases.
- Secrets remain provider/environment-managed; no settings editor was built.
- Authenticated E2E execution remains BLOCKED (host/runtime constraint, unchanged).
- Node locally is outside the declared `>=24.20.0 <25` contract; local results are not
  runtime-parity evidence.

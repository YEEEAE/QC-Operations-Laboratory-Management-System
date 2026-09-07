# Render PostgreSQL Recovery Audit

**Task:** `QC-RENDER-POSTGRES-RECOVERY-001`  
**Audit date:** 2026-09-07  
**Repository HEAD:** `9056ef422684a9bc6e8c25029d7ecfaecec92468`  
**Audit posture:** Reality-first, source and working-tree evidence only. No production credential was read, printed, logged, or used.

## Audit result

**AUDIT RESULT: BLOCKED**

The repository does not currently provide a deterministic, documented, and provider-compatible path from an empty Render PostgreSQL database to a working admin account with effective authorization. The database state supplied for this audit (`to_regclass('qc.users')` returned `NULL`) is consistent with an uninitialized application database, but it was not independently queried during this audit because no database credential was used.

## Frozen reality

| Item | Observed value / result |
|---|---|
| Working directory | `/Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System` |
| Git root | Same as working directory |
| Branch | `main` |
| HEAD | `9056ef422684a9bc6e8c25029d7ecfaecec92468` |
| Working tree | Clean; no short status entries |
| Diff stat | Empty |
| Node | `v22.22.3` |
| Required Node | `24.20.0` from `.node-version` and `package.json` |
| pnpm | Could not be read: Corepack attempted an unauthorized cache write outside the workspace and failed with `EPERM` |
| Migration files | 18 tracked SQL migrations, `0001` through `0018` |
| Seed files | `db/seeds/common.ts`, `dev.ts`, `test.ts` |
| Bootstrap script | `scripts/bootstrap/create-initial-admin.ts` |
| Production DB evidence | User-supplied Render check reported `to_regclass('qc.users') = NULL`; no live query was executed by this audit |
| Credential posture | Previously exposed credential is treated as revoked/unsafe; no credential value was inspected |

The repository has no tracked `.env` file. `.env.example` contains names/placeholders only. `render.yaml` declares Render-managed values with `sync: false`.

## Current architecture

- Astro SSR / Node standalone Web Service on Render.
- PostgreSQL is the application database; application objects are intended to live in schema `qc`.
- `src/shared/database/pool.ts` creates a shared `pg.Pool` with `search_path=qc,pg_catalog` and UTC timezone.
- Kysely repositories use unqualified table names and therefore depend on that connection-level `search_path`.
- Most raw operational queries observed in source are explicitly `qc.*` qualified.
- Migrations are explicit, forward-only SQL files loaded lexically by `scripts/db/migrate.ts`.
- Migration execution uses a PostgreSQL advisory lock and records SHA-256 checksums in `qc.schema_migrations`.
- Identity login uses `qc.users`, Argon2id password hashes, opaque session tokens stored as SHA-256 hashes, and active-account checks.
- Authorization resolves active `user_roles` → `roles` → `role_permissions` → `permissions`; scopes are stored separately in `user_scopes`.
- Bootstrap creates one user, assigns `ADMIN`, assigns `GLOBAL`, and records audit events, but intentionally does not invent permissions.

## Source-of-truth findings

1. **What creates schema `qc`?**

   `db/migrations/0001_core_schema.sql:1` creates it. The migration runner also has a preflight `CREATE SCHEMA IF NOT EXISTS qc` in `scripts/db/migrate.ts:69-71` so it can read the ledger. The first migration then changes schema ownership at `0001:102`.

2. **What creates `qc.users`?**

   `db/migrations/0001_core_schema.sql:26-44` creates `qc.users`. It is not created by a seed or bootstrap command.

3. **What creates the `ADMIN` role?**

   `db/migrations/0003_authorization.sql:70-75` inserts the four system roles, including `ADMIN`. The non-production foundation seed also upserts the four role codes in `db/seeds/common.ts:221-231`.

4. **What creates permissions?**

   `db/seeds/common.ts:8-207` defines the canonical permission list, and `:233-241` inserts/upserts those permissions. No migration inserts the permission catalogue.

5. **What creates `role_permissions`?**

   `db/migrations/0003_authorization.sql:27-39` creates the table only. No current migration, seed, bootstrap command, or documented production command inserts grants into it. This is a critical reproducibility gap.

6. **What creates `user_roles`?**

   `db/migrations/0003_authorization.sql:41-64` creates the table. `BootstrapInitialAdminUseCase` inserts the initial user's `ADMIN` assignment at `src/modules/identity/application/bootstrap-initial-admin.ts:106-119`.

7. **What creates `user_scopes`?**

   `db/migrations/0016_authorization_scopes.sql:1-20` creates the table. Bootstrap inserts one `GLOBAL` scope at `bootstrap-initial-admin.ts:120-132`. Normal scope administration is application code, not a production foundation seed.

8. **What command creates the initial admin?**

   `pnpm bootstrap:admin`, mapped in `package.json` to `tsx scripts/bootstrap/create-initial-admin.ts`. It requires `DATABASE_URL`, `BOOTSTRAP_ADMIN_IDENTITY`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_DISPLAY_NAME`, and optional `BOOTSTRAP_ADMIN_EMAIL`. It refuses pending migrations and a missing/inactive `ADMIN` role. It is one-time/idempotent by identity and does not change an existing account.

9. **What exact production environment variables are required?**

   Application startup validation in `src/config/env.ts:34-46` requires, in `NODE_ENV=production`:

   - `DATABASE_URL`
   - `SESSION_SECRET` with at least 32 characters
   - `RATE_LIMIT_LOGIN_MAX`
   - `RATE_LIMIT_LOGIN_WINDOW_SECONDS`

   The deployment also sets `NODE_ENV=production`, `NODE_VERSION=24.20.0`, `HOST=0.0.0.0`, and `SERVICE_VERSION`; OTEL endpoint/headers are optional according to the parser. The one-time bootstrap command additionally requires the four bootstrap variables above. `DATABASE_URL` must be the Render **internal** URL for the production Web Service when the database and service share a region. Local Mac migration must use the Render **external** URL over TLS, supplied only through a secure environment mechanism. The source does not enforce TLS explicitly in `pg.Client`/`pg.Pool`; it relies on the URL/driver configuration, so this needs an explicit operational and code-level verification.

10. **Are production role/permission foundation data currently reproducible?**

    **No.** `ADMIN` and the other role rows are reproducible through `0003`, and permission rows are reproducible only through the development/test seed guarded by `QC_SEED_ALLOW_NON_PRODUCTION=true`. There is no production-safe permission seed and no role-permission grant seed. Bootstrap reports `authorizationGrantsConfigured: false` when the ADMIN role has no grants and explicitly says grants still require approved configuration.

11. **Can a fresh Render PostgreSQL database go from empty → fully usable production system using documented commands only?**

    **No.** The intended sequence is incomplete and has provider compatibility risk:

    1. Run migrations.
    2. There is no documented production command that deterministically creates permission rows and approved `role_permissions` grants.
    3. Run bootstrap, which creates the account and ADMIN/GLOBAL assignments but cannot make the account authorized without grants.
    4. Login may also be blocked by the current Astro Actions export shape: `src/actions/index.ts` exports multiple top-level namespaces while `server` is only the auth namespace. The live project mind records the resulting `ActionNotFoundError`/404 risk for RPC actions, including login, and this remains visible in current source.

12. **Does migration `0001` depend on PostgreSQL `CREATE ROLE` / `ALTER OWNER` / `GRANT` assumptions that might conflict with managed Render PostgreSQL?**

    **Yes.** `0001:6-15` conditionally executes `CREATE ROLE qc_migrator` and `CREATE ROLE qc_app_runtime`; `0001:102-107` executes `ALTER SCHEMA/TABLE ... OWNER TO qc_migrator`; `0001:109-114` grants schema/table/sequence privileges. A managed Render database connection may not grant the connected database user `CREATEROLE`, ownership transfer authority, or the exact role-management privileges assumed here. The migration does not feature-detect or provide a Render-managed-role path.

13. **Does the connected Render DB user actually receive privileges needed by later migrations and runtime?**

    **Unverified and architecturally unsafe as currently wired.** The application and migration runner both consume the single `DATABASE_URL`; there is no separate migration URL and runtime URL. The created `qc_app_runtime` role is never selected by `pool.ts`, bootstrap, or the Web Service configuration. Therefore:

    - If `DATABASE_URL` is an owner/high-privilege Render URL, migrations may work but runtime is over-privileged.
    - If it is a restricted runtime URL, `0001` may fail before later migrations because it cannot create roles/transfer ownership, and later `GRANT` statements do not grant privileges to the connected user.
    - No current evidence proves `CREATE`, `USAGE`, DML, advisory-lock, sequence, or migration-ledger privileges for the actual Render user.

14. **Are existing migrations unsafe to rewrite because of checksum-based integrity?**

    **Yes.** `scripts/db/migrate.ts:88-101` compares every applied migration name/checksum with the current file and fails on mismatch. `0001` through `0018` are historical migration files and must be treated as immutable. A compatibility fix must be a new forward migration or a provider-specific migration strategy before first production application; do not rewrite an applied file.

15. **Is the application using schema `qc` consistently through `search_path` and qualified queries?**

    **Mostly, but not with sufficient defense-in-depth evidence.** The shared pool sets `search_path=qc,pg_catalog`, bootstrap sets it explicitly, seeds use `qc.*`, migration SQL uses qualified `qc.*`, and sampled raw reporting/search/audit queries use `qc.*`. Kysely repositories rely on the pool search path and do not qualify table identifiers themselves. Readiness only runs `SELECT 1` and does not prove the expected schema/ledger exists. The path is therefore configuration-dependent and should be tested with a non-owner runtime role and an assertion for `current_schema()`/`to_regclass('qc.schema_migrations')`.

## Root causes

1. Foundation schema creation, permission catalogue creation, role grants, user bootstrap, and provider privilege management were implemented as separate concerns, but the production orchestration that composes them was never completed.
2. The seed is deliberately development/test-only, while production bootstrap deliberately refuses to invent grants. That preserves authorization safety but leaves the first production authorization state undefined.
3. One `DATABASE_URL` is used for both migration and runtime, while `qc_migrator`/`qc_app_runtime` roles are declared as if a two-role provider topology already existed.
4. Migration `0001` assumes database-role administration capabilities that are not established for managed Render PostgreSQL.
5. The external TLS requirement and internal-vs-external URL split are documented operationally but not enforced or asserted by the connection layer.
6. The current Astro Actions aggregation leaves authentication HTTP reachability at risk even after the database is repaired.

## Blockers

- `qc.users` is reportedly absent in Render; live independent verification is still outstanding.
- No deterministic production permission and `role_permissions` foundation path.
- No verified Render-compatible migration privilege model.
- No separate migration/runtime database credentials or configuration.
- Runtime privilege posture is unknown and may be either insufficient or excessive.
- External TLS is not explicit in the connection configuration.
- Local Node is outside the repository engine requirement; local pnpm verification was blocked by Corepack filesystem permissions.
- No verified PostgreSQL 18 empty-database run in this environment; the existing integration path depends on a container runtime not available here.
- Current action export shape risks making login unreachable through Astro RPC.
- Previously exposed database credential must be rotated before any operational execution.

## Migration compatibility risks

- `CREATE ROLE`, `ALTER OWNER`, `REVOKE ... FROM PUBLIC`, and `GRANT` in `0001` may be rejected or behave differently under Render-managed ownership.
- `uuidv7()` is assumed by every schema migration; the database must support PostgreSQL 18 as stated, and this needs a fresh Render-compatible run evidence.
- The migration runner creates `qc` before migration checks, but the ledger itself is only created by `0001`; a failed first migration can leave a schema without a ledger.
- Migration files are checksum-protected; editing an already applied file is not an acceptable repair.
- Later grants target `qc_app_runtime`, not necessarily the actual Web Service database user.
- Runtime queries depend on `search_path`, while the readiness endpoint does not validate the application schema.
- No explicit TLS options are passed to `pg`; the connection URL must carry the provider-required TLS mode and certificate behavior must be tested.

## Seed/bootstrap gaps

- `db/seeds/dev.ts` and `db/seeds/test.ts` are guarded against production and are not exposed as package scripts.
- `db/seeds/common.ts` seeds roles and 207 permission codes (the current source list), but no grants.
- No approved role-to-permission mapping is encoded in a reproducible production artifact.
- Bootstrap assigns ADMIN and GLOBAL but intentionally does not grant permissions.
- Bootstrap's `assigned_by` points to the new user itself, which is an explicit system-bootstrap exception that should be retained only if approved and covered by the final audit policy.
- The documented bootstrap example uses a sample identity; operators must supply an approved identity and must remove the one-time variables immediately after use.

## Authorization gaps

- An ADMIN row without `role_permissions` is authenticated but effectively unauthorized for protected business/admin capabilities.
- `resolveActor` derives permissions from role grants and attaches `OWN`/`GLOBAL` in application memory; it does not query `user_scopes` in the shown implementation, so scope enforcement needs end-to-end verification.
- Admin is correctly not treated as a universal business approver, but the first admin has no reproducible approved technical grants.
- Login logic is sound at use-case level (Argon2id, active account, opaque session), but HTTP reachability through the current Astro Actions aggregation remains a release blocker until verified/fixed.
- No production login/authorized-read smoke evidence exists against the actual Render database.

## Render environment gaps

Required production values are named in `render.yaml`, but repository evidence does not prove they are present in Render. The following must be explicitly verified in the Render service without printing values:

- `DATABASE_URL`: internal Render URL for the Web Service; database `qc_operations`; correct region; provider TLS semantics.
- `SESSION_SECRET`: at least 32 random characters, stored only as a managed secret.
- `RATE_LIMIT_LOGIN_MAX` and `RATE_LIMIT_LOGIN_WINDOW_SECONDS`: approved positive values.
- `NODE_VERSION=24.20.0`, `HOST=0.0.0.0`, `NODE_ENV=production`, and the intended `SERVICE_VERSION`.
- One-time bootstrap variables only during the controlled bootstrap window.
- External Mac migration uses the rotated external URL over TLS; it must never be copied into source, logs, shell history, or the report.

## Exact remediation plan

### Phase 0 — credential and evidence safety

1. Rotate/revoke the previously exposed Render database credential.
2. Create fresh internal and external connection values through Render; never paste them into Git, chat, report, or command output.
3. Record only non-secret metadata: database name, region, PostgreSQL major version, schema-regclass checks, migration head, and redacted role/privilege results.

### Phase 1 — provider-compatible database access model

1. Confirm which Render database user is owner/admin and which user will be runtime.
2. Decide and document whether Render supports the two-role model. If not, remove the assumption from the migration path using a new forward-only provider-compatible migration/bootstrap mechanism; do not rewrite applied migrations.
3. Configure separate migration and runtime secret paths. Keep the Web Service on the least-privilege runtime URL and run migrations as an explicit release step with the migration URL.
4. Make TLS behavior explicit for external connections and test certificate verification without logging the URL.
5. Add a migration privilege preflight that checks capability safely and reports redacted failure categories before executing schema changes.

### Phase 2 — deterministic foundation data

1. Add an approved, production-safe, idempotent foundation-data command or migration for permission rows.
2. Add an approved, versioned role-to-permission mapping source and apply it transactionally to `role_permissions`.
3. Keep development/test fixtures separate and preserve the production guard.
4. Add a machine-readable expected foundation count/checksum without storing secrets.

### Phase 3 — bootstrap and auth reachability

1. Run all migrations on a disposable PostgreSQL 18 database and on a Render staging database.
2. Apply the approved foundation data and verify `ADMIN` grants exist.
3. Run `pnpm bootstrap:admin` through a one-off controlled operator session.
4. Verify login, session creation, protected authorized read, denied unauthorized read, and scope behavior.
5. Resolve and test the Astro Actions aggregation so the login action is reachable over the actual HTTP surface.
6. Remove all bootstrap variables immediately after successful verification.

### Phase 4 — production evidence

1. Capture redacted migration status, checksum status, schema-regclass checks, role/privilege checks, readiness, login, and authorized-read evidence.
2. Compare the exact release identity, migration head/checksum, and database state.
3. Mark production readiness `GO` only after all critical gates pass; otherwise remain `BLOCKED`.

## Files expected to change

- `db/migrations/` — only new forward migrations or a provider-specific path; do not rewrite applied history.
- `db/seeds/common.ts` and a new explicitly production-safe foundation-data runner or approved seed artifact.
- `package.json` — explicit foundation-data/migration commands and separate operator semantics.
- `scripts/db/migrate.ts` and related scripts — provider privilege preflight, URL-role separation, redacted diagnostics, and migration status assertions.
- `src/config/env.ts`, `.env.example`, and `render.yaml` — distinct migration/runtime configuration and explicit TLS-related contract where approved.
- `src/shared/database/pool.ts` and `src/shared/health/postgres-readiness-probe.ts` — connection/readiness assertions and safe TLS handling.
- `src/actions/index.ts` and `src/actions/auth.ts` — one verified Astro Actions surface for login and other namespaces.
- `src/modules/identity/application/identity-dependencies.ts` — scope loading aligned with `user_scopes`.
- `scripts/bootstrap/create-initial-admin.ts`, `src/modules/identity/application/bootstrap-initial-admin.ts`, and `docs/operations/INITIAL-ADMIN-BOOTSTRAP.md` — final approved grant and bootstrap contract.
- `docs/operations/RENDER-DEPLOYMENT.md` and a new controlled migration runbook — internal/external URL and TLS execution order.
- Tests under `tests/integration/database`, `tests/integration/bootstrap`, `tests/integration/identity`, `tests/integration/http`, and E2E auth coverage.

## Tests required

- Fresh PostgreSQL 18 migration from empty database to latest head.
- Upgrade migration from the supported prior head with checksum verification.
- Render-compatible privilege test for the actual migration and runtime roles.
- Explicit test that `0001` behavior is either supported or blocked cleanly under managed-provider privileges.
- Foundation seed idempotency, expected role/permission counts, and deterministic `role_permissions` grant mapping.
- Bootstrap transaction rollback, replay/idempotency, ADMIN role assignment, GLOBAL scope, and audit evidence.
- Login success/failure/disabled-account tests with Argon2id and session persistence.
- Protected authorized-read and denied-read tests, including wrong-scope and Admin-without-business-permission cases.
- `search_path`/`current_schema()`/`to_regclass('qc.schema_migrations')` assertions using the runtime role.
- External TLS connection test with certificate verification and no secret output.
- Astro Actions HTTP test proving login is reachable and all action namespaces resolve correctly.
- Readiness test proving empty/unmigrated DB is `503` and migrated reachable DB is `200`.
- Migration checksum tamper test proving applied historical files cannot be rewritten silently.
- Production smoke evidence against a non-destructive, approved test identity only.

## Production execution order

1. Rotate the exposed credential and revoke the old one.
2. Freeze the exact release commit/artifact and verify the working tree is clean.
3. Provision/confirm Render PostgreSQL `qc_operations`, PostgreSQL 18, region, owner/admin access, and backups.
4. Set the Web Service's internal `DATABASE_URL`, session/rate-limit/runtime variables, and Node/host settings; do not set bootstrap values yet.
5. Run a dry-run privilege/schema preflight with redacted output.
6. Execute migrations explicitly with the external TLS URL from a secure Mac/operator environment, or with the approved controlled migration path, using migration credentials only.
7. Verify migration ledger, checksums, `qc.users`, expected tables, schema search path, and runtime-role privileges without exposing credentials.
8. Apply the approved production foundation permission and role-grant data.
9. Run the one-time bootstrap command with temporary managed variables.
10. Verify login, authorized admin read, denied unauthorized read, session cookie behavior, and readiness.
11. Remove all bootstrap variables; rotate any temporary operator secret if policy requires.
12. Capture release/database evidence and make the Production Readiness Go/No-Go decision.
13. Keep rollback as code rollback only when schema compatibility is proven; use a forward fix for schema/data changes.

## Files and locations inspected

- `package.json`, `.node-version`, `.npmrc`, `.env.example`, `render.yaml`
- `scripts/db/migrate.ts`, `scripts/db/migration-status.ts`, `scripts/db/check-migration-integrity.ts`
- `scripts/bootstrap/create-initial-admin.ts`
- `src/config/env.ts`, `src/config/runtime.ts`, `src/shared/database/pool.ts`, `src/shared/database/database.ts`
- `src/modules/identity/application/bootstrap-initial-admin.ts`, login/session/security/repository files
- `src/actions/auth.ts`, `src/actions/index.ts`, middleware, readiness and system-health code
- `db/migrations/0001` through `0018`, `db/seeds/common.ts`, `dev.ts`, `test.ts`
- `Documents/DATABASE-ARCHITECTURE.md`, `Documents/DEPLOYMENT-ARCHITECTURE.md`, `Documents/ROLE-MATRIX.md`, `Documents/PERMISSION-MATRIX.md`, `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `docs/operations/RENDER-DEPLOYMENT.md`, `INITIAL-ADMIN-BOOTSTRAP.md`, `RELEASE-RUNBOOK.md`, `INCIDENT-QUICK-REFERENCE.md`

## Verification performed

- Repository freeze commands completed; no code changes existed before this report.
- Targeted unit tests: `tests/unit/bootstrap/bootstrap-config.test.ts` and `tests/unit/shared/validation.test.ts` — **13/13 passed**.
- `git diff --check` — passed before report creation.
- Current tracked-file and full reachable-history scans for PostgreSQL URLs and database credential assignments were performed with values suppressed. No production-looking PostgreSQL URL or database credential assignment was found outside tests/examples/docs/skills. Test fixtures and placeholders remain intentionally present in test/example files.
- Full PostgreSQL migration/bootstrap runtime was **not run**: no production credential was used, local Node is not the required version, no disposable PostgreSQL 18 runtime was available, and the local `tsx` IPC launch was blocked by sandbox `EPERM`.
- No Render API/database query, migration, seed, bootstrap, commit, or push was performed.


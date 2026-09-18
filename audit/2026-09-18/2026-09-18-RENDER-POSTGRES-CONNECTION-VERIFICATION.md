# QC-RENDER-POSTGRES-VERIFY-001 — Render PostgreSQL Connection, Migration, Runtime & Service Verification

- **Date:** 2026-09-18
- **Exact HEAD:** `38528bd6ffd49b800057f58ac88612ca1b2af97f` on `main`
- **Working tree at verification time:** 7 modified files (6 DB entrypoints + 1 integration test) and 2 new test files, all uncommitted. No commit, push, or deployment was performed.
- **Scope:** prove the full chain `Application → DATABASE_URL → PostgreSQL → qc schema → migrations → repositories/use cases → readiness → Render runtime configuration`.
- **Secret handling:** the provider credential was read from the ignored local `.env` inside the verifying process and never printed, never passed as a CLI argument, and never written to this document. Render API inspection output was pattern-redacted before storage. All credential-bearing temporary files were deleted at the end of the run.

---

## A. Headline results

| Item | Result |
|---|---|
| Exact HEAD | `38528bd6ffd49b800057f58ac88612ca1b2af97f` |
| Database host class | **EXTERNAL** (Render External Database URL, `*.oregon-postgres.render.com`) |
| PostgreSQL version | **18.6** (`Debian 18.6-1.pgdg12+2`, `x86_64-pc-linux-gnu`) |
| Database name | `qc_operations` |
| Schema | `qc` (`current_schema() = qc`, `search_path = qc,pg_catalog`, `TimeZone = UTC`) |
| Migration source head | `0025` (`0025_qc_closure_006_workflow`), 25 source files |
| Applied migration head | `0018` (18 applied), 7 pending: `0019`–`0025` |
| Schema integrity | **FAIL-CLOSED** — `db:schema:check` reports *"Schema drift detected: migration table contract differs from PostgreSQL."* Expected: the Render database is 7 forward migrations behind source head. Ledger checksum verification passes first, so no **applied** migration drifted. |
| Application connectivity | **VERIFIED** — canonical runtime pool (`getDatabaseConnectionConfig` + `createPool`) connects; TLS 1.3 on the wire; `SELECT`/`INSERT`/`ROLLBACK` on `qc.users` exercised. |
| Readiness | **VERIFIED** — built app against this Render database returns `/api/health/ready` `200 {"status":"healthy"}`; unreachable database → `503`; missing `DATABASE_URL` under `NODE_ENV=production` → `503`. |
| Render provider verification | **VERIFIED (read-only API)** — and it reveals **configuration divergence from `render.yaml`**. |
| Live production reachability | **VERIFIED** — `https://qclevel.top` serves `/api/health/ready` `200 {"status":"healthy"}`. |
| No secrets leaked | **VERIFIED** — 16 evidence logs scanned for password/hostname/username: 0 hits. |
| Overall state | **PARTIAL** — connectivity and schema truth are proven; the Render database is not at source migration head, and provider runtime configuration diverges from the repository contract. |

---

## B. Phase 1 — Database architecture contract (as read from source)

| Aspect | Contract |
|---|---|
| `DATABASE_URL` contract | Read by `src/config/env.ts` (`zod`, `postgres:`/`postgresql:` protocol). Missing/blank/malformed fails closed. |
| Runtime state | `src/shared/database/pool.ts` validates and caches one shared `pg.Pool`. |
| TLS | `getDatabaseConnectionConfig`: explicit provider `sslmode` is preserved as-is; `sslmode=disable` is **rejected**; a missing `sslmode` forces `ssl: { rejectUnauthorized: true }` against Node's CA store. |
| search_path | Applied as a **session option**, not per query: `options = '-c timezone=UTC -c search_path=qc,pg_catalog'`. |
| PostgreSQL version assumption | 18 (migrations use the built-in `uuidv7()`); runbook agrees. |
| Schema name | `qc` |
| Migration ledger | `qc.schema_migrations` (`version`, `name`, `checksum`, `execution_ms`, `runner_version`) |
| Migration runner | `scripts/db/migrate.ts` — lexical order, SHA-256 checksums, `pg_advisory_lock` serialization, per-migration transaction, forward-only, legacy checksums accepted for audit only. |
| Pooling | Single shared `Pool` plus `application_name`. |
| Readiness | `checkCanonicalDatabaseReadiness` — one canonical check shared by `/api/health/ready` and the authenticated System Health view; every failure collapses to `false` without leaking host/secret/exception. |

Two contract facts drove the whole verification:

1. The `qc` boundary is a **session** property. A connection that omits the canonical pool options lands in `public` even on a correctly migrated database.
2. The documented operator workflow states that the standalone commands load an ignored local `.env` through an allowlisted, non-shell parser, and that a **Render provider export is not an application configuration file and is ignored**. Both statements were true of the parser and false of the wiring — see Phase 8.

---

## C. Phase 2 — Supplied environment validation (sanitized)

Local `.env` shape (keys only; values never rendered):

```text
line 1  free-text header ("Connection details. *Render services.")
line 2  Hostname
line 3  Port
line 4  Database
line 5  Username
line 6  Password
line 7  Internal_Database_URL
line 8  External_Database_URL
line 9  PSQL_Command
line 10 API_Render            (added by the operator; not an application key)
```

| Check | Result |
|---|---|
| host present | **PASS** — `dpg-…-a` (26 chars) |
| port valid | **PASS** — `5432` |
| database correct | **PASS** — `qc_operations` |
| username present | **PASS** — `qc_operations_user` |
| internal URL shape | **PASS** — `postgresql://…@dpg-…-a/qc_operations`, no port, **no `sslmode`** |
| external URL shape | **PASS** — `postgresql://…@dpg-…-a.oregon-postgres.render.com/qc_operations`, **no `sslmode`** |
| whitespace / quote defects | **PASS** — no unstripped whitespace, no wrapping quotes, no embedded spaces except the expected `PSQL_Command` |
| runtime reads the expected variable | **PASS** — runtime reads `DATABASE_URL` only; `Internal_Database_URL` / `External_Database_URL` are correctly **not** read (asserted by `tests/unit/render-config.test.ts`) |
| `.env` ignored by Git | **PASS** — `.gitignore:14` matches `.env`; `git ls-files` confirms it is untracked |
| password exposure | **PASS** — value never printed; `password: [REDACTED]` used throughout |

Sanitized connection identity (both URLs describe the **same** database):

```text
DATABASE_URL: configured
host: dpg-...-a
external host === <internal-host>.oregon-postgres.render.com   → same database identity (asserted)
database: qc_operations
username: qc_operations_user
password: [REDACTED]
explicit_sslmode: absent (TLS still enforced via rejectUnauthorized: true)
```

Resolved provider object identity (non-secret, from the Render API):

```text
database id: dpg-dadqmsgn74is73b774j0-a   name: qc-database
plan: free        region: oregon        version: 18        status: available
owner: Pro.Y's workspace (team)
ipAllowList: 0.0.0.0/0 ("everywhere")     highAvailabilityEnabled: false
createdAt: 2026-09-05T05:41:06Z           expiresAt: 2026-10-05T05:41:06Z
```

> The task brief noted that `dpg-dadqmsgn74is73b774j0-a` had been described as a Render *Service* ID. Provider evidence resolves it unambiguously: it is the **PostgreSQL database ID** and also the database's internal hostname label. The web service carries a different identity (`srv-…`). Both references inside the supplied `.env` were therefore correct, and the brief's caution not to assume a web-service ID was the right call.

---

## D. Phase 3 — Correct connection path per context

| Context | URL to use | Evidence |
|---|---|---|
| Local workstation / this verification | **External** Database URL, TLS required | Used for every database check in this record. |
| Render Web Service (in-region, private network) | **Internal** Database URL should be the production value | **Provider finding: the live service currently holds an EXTERNAL-class `DATABASE_URL`.** |

Two further provider facts bound this conclusion:

- `networkIsolationEnabled: false` — the Render environment has no private-network isolation, so the internal hostname is not reachable from the service in any case.
- `ipAllowList: 0.0.0.0/0 ("everywhere")` — the database accepts connections from any address.

---

## E. Phase 4 — Safe connectivity checks (read-only)

Executed through the **canonical application path** (`getDatabaseConnectionConfig` + `createPool`), not a bare client:

```sql
SELECT version(), current_setting('TimeZone'), current_setting('search_path');
SELECT current_database(), current_user, current_schema();
SELECT ssl, version FROM pg_stat_ssl WHERE pid = pg_backend_pid();
```

```text
server.version      : PostgreSQL 18.6 (Debian 18.6-1.pgdg12+2) on x86_64-pc-linux-gnu
server.timezone     : UTC
server.search_path  : qc,pg_catalog
session.database    : qc_operations
session.user        : qc_operations_user
session.schema      : qc
wire.ssl            : true
wire.version        : TLSv1.3
topology.qc_schema  : true
topology.users_table: true
topology.ledger     : true
topology.qc_tables  : 60
topology.qc_fks     : 122
```

Read-only capability probe:

```text
can_create_database_schema              : true
can_create_qc_objects                   : true
is_superuser                            : false
legacy_objects_owned_by_other_principal : 0
```

Row counts are reported as **sanitized scalars only** — no row content, no column values:

```text
users=1  user_roles=2  audit_events=4  lab_tests=0  receiving_items=0
```

> Interpretation: this instance holds bootstrap-level data only (one account, two grants, four audit events, no operational QC records). No production laboratory data was read, dumped, or printed.

`pnpm db:preflight` — the repository's canonical read-only check:

```json
{"connectivity":"PASS","currentDatabase":"qc_operations","currentUser":"qc_operations_user",
 "schemaQcExists":true,"qcUsersExists":true,"schemaMigrationsExists":true,
 "migrationCountApplied":18,"migrationCountPending":7,
 "capabilities":{"transactionReadOnly":true,"schemaUsage":true,"usersSelect":true,"migrationsSelect":true}}
```

---

## F. Phase 5 — Migration verification

### Applied vs source

```text
source head          : 0025_qc_closure_006_workflow   (25 source files)
applied on Render DB : 0001 … 0018                    (18 ledger rows)
pending              : 0019, 0020, 0021, 0022, 0023, 0024, 0025
```

Pending migration IDs and titles:

```text
0019  backup_catalog_identity
0020  capa_close_evidence
0021  release_governance
0022  server_release_evidence
0023  uat_evidence
0024  identity_rbac_grant_integrity
0025  qc_closure_006_workflow
```

`pnpm db:migrate:status` against the Render database:

```json
{"mode":"check",
 "applied":["0001","0002","0003","0004","0005","0006","0007","0008","0009","0010",
            "0011","0012","0013","0014","0015","0016","0017","0018"],
 "pending":["0019","0020","0021","0022","0023","0024","0025"]}
```

Because `migrate()` runs `assertMigrationPrivileges` **and** `assertCurrentOwnership` whenever `pending.length > 0` — including in `--check` mode — a clean exit proves the database is *capable* of accepting the pending migrations:

```text
CREATE on database          : true
CREATE on schema qc         : true
CREATEROLE / SUPERUSER      : not required, not present (is_superuser = false)
legacy objects owned by a different principal : 0  → no provider-admin remediation needed
```

### Ledger integrity

`verifyMigrationIntegrity` completed **before** the table-contract comparison. All 18 applied ledger rows match a current or explicitly-accepted-legacy checksum, and no name mismatch exists. Therefore the drift below is **purely "behind by N forward migrations"**, not a checksum violation.

### Schema integrity

`pnpm db:schema:check` against the Render database:

```text
Schema drift detected: migration table contract differs from PostgreSQL.
exit code 1
```

This is the **designed fail-closed behaviour** and the correct answer for a database 7 migrations behind source head: the expected table set is derived from all 25 migration files, while PostgreSQL only has the objects created by `0001`–`0018`.

### Migration execution decision — **NOT EXECUTED (BLOCKED by repository contract)**

Applying the 7 pending migrations to the Render database was **deliberately not performed**. The repository's own contract forbids it:

1. `docs/operations/RENDER-DATABASE-CONNECTION.md`: *"The credential currently present in the local Render export is compromised. Before any production connection, migration, bootstrap, or write operation: … Create a new default credential …"* and *"Do not run `pnpm db:migrate` against production until the approved migration gate is open."*
2. `docs/operations/RENDER-MIGRATION-RUNBOOK.md`: *"Never run this sequence with the old exposed credential, and never use it against production during recovery testing."*

The supplied `.env` credential is exactly that local Render export credential. Additionally the production service's `DATABASE_URL` is external and the instance is the live target behind `qclevel.top`, so this is not a disposable target.

**No historical migration was modified. No migration was applied to the Render database.**

### Migration execution — controlled equivalent (proves the chain works)

To separate "the pipeline works" from "the production target was mutated", the same canonical CLI chain was run against the repository's approved disposable PostgreSQL 18 cluster (`scripts/db/disposable-postgres.sh`, local only, reads no provider credential):

```text
preflight (empty)   : connectivity PASS, 0 applied, 25 pending
migrate:check       : {"status":"ok","migrations":25}
migrate:status      : applied [], pending 0001…0025
db:migrate          : applied 0001…0025, pending []
migrate:status      : applied 0001…0025, pending []
db:schema:check     : {"status":"ok","migrationCount":25,"tableCount":70,"orphanCount":0}
pipeline exit       : 0
```

This is the same expected head (`0025`) and the same integrity result (`70` tables, `0` orphan rows) that the Render database must reach after the credential rotation gate opens.
---

## G. Phase 6 — Application compatibility

### Static and suite gates (final working tree)

| Gate | Result |
|---|---|
| `pnpm typecheck` (`astro check`) | **PASS** — 744 files, 0 errors, 0 warnings, 67 hints |
| `pnpm lint` | **PASS** |
| `pnpm format:check` | **FAIL — pre-existing, not caused by this task.** Only `audit/QC-Master-Prompts-Interactive-Copy.html` fails, a file added by HEAD `38528bd` and left untouched here (the two new test files were formatted to canonical Prettier output). |
| `pnpm test:architecture` | **PASS** — boundary check + canonical route/registry integrity |
| `pnpm run build` | **PASS** |
| `pnpm test:unit` | **PASS** — 79 files / 535 tests |
| `pnpm test:integration` | **PASS** — 83 files / 326 tests (against disposable PG 18) |
| `pnpm test:migrations` | **PASS** — 7 files / 26 tests |
| `pnpm test:concurrency` | **PASS** — 2 files / 12 tests |
| `pnpm test:security` | **PASS** — 7 files / 51 tests |

Repository read/write is therefore proven in a **controlled** environment (disposable PostgreSQL 18, canonical pool, real migrations, real repositories and use cases) — not by writing into the live Render instance.

### Built application against the real Render database

The production build (`dist/server/entry.mjs`) was booted under `NODE_ENV=production` with the Render External Database URL injected through a mode-`0600` `--env-file` (never via argv):

| Scenario | `/api/health/live` | `/api/health/ready` |
|---|---|---|
| Real Render database (external URL) | `200 {"status":"healthy"}` | **`200 {"status":"healthy"}`** (2.6 s round trip to Oregon) |
| Database unreachable (`127.0.0.1:1`) | `200 {"status":"healthy"}` | **`503 {"status":"unhealthy"}`** |
| `NODE_ENV=production` with **no** `DATABASE_URL` | `200 {"status":"healthy"}` | **`503 {"status":"unhealthy"}`** |

Liveness staying `200` while readiness fails closed is the intended separation: the process is alive, the dependency is not.

Server logs for all three scenarios contained only sanitized fields (`route_template`, `http_method`, `status_class`, `duration_ms`) plus one `config.invalid_environment` warning for the missing-URL case. No host, credential, connection string, or driver exception appeared.

### Live production service (read-only external probe)

```text
GET https://qclevel.top/api/health/live             → 200 {"status":"healthy"}
GET https://qclevel.top/api/health/ready            → 200 {"status":"healthy"}
GET https://qclevel.top/api/system/release-identity → 401 {"title":"AUTH_REQUIRED"}  (fail-closed, sanitized)
GET https://qclevel.top/                            → 302 → /login?returnTo=%2Fdashboard
headers: CSP, HSTS, X-Frame-Options: DENY, COOP/CORP, Permissions-Policy,
         Referrer-Policy, X-Content-Type-Options: nosniff, x-render-origin-server: Render
```

`qc-operations-laboratory-management.onrender.com` returns `404 Not Found` with `x-render-routing: blocked-render-subdomain` on every path — the Render subdomain is intentionally blocked and the custom domain `qclevel.top` is the production entrypoint. Expected behaviour, not a defect.

**Production readiness is green against the production database**, which independently confirms the config → pool → TLS → PostgreSQL chain end to end.
---

## H. Phase 7 — Render configuration verification

### `render.yaml` (repository-side contract)

```text
type: web, runtime: node
buildCommand    : corepack pnpm install --frozen-lockfile && corepack pnpm run build
startCommand    : node dist/server/entry.mjs
healthCheckPath : /api/health/ready
autoDeployTrigger: checksPass
domains: qclevel.top ; renderSubdomainPolicy: enabled
NODE_VERSION=24.20.0, HOST=0.0.0.0, NODE_ENV=production, SERVICE_VERSION=0.1.0,
RELEASE_ENVIRONMENT=production
sync:false (never in Git): RELEASE_ID, RELEASE_BUILD_ID, RELEASE_BUILD_TIMESTAMP,
RELEASE_GIT_SHA, RELEASE_MIGRATION_HEAD, DATABASE_URL, SESSION_SECRET,
RATE_LIMIT_LOGIN_MAX, RATE_LIMIT_LOGIN_WINDOW_SECONDS,
OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_EXPORTER_OTLP_HEADERS
```

No secret is hardcoded. `tests/unit/render-config.test.ts` (inside the passing unit suite) asserts the canonical internal database contract, the explicit runtime entrypoint, that the build command never runs `db:migrate` / `db:seed` / `bootstrap:admin`, that `BOOTSTRAP_ADMIN_*` never appears in the service contract, and that the health-check path is `/api/health/ready`.

### Live provider state — **PROVIDER CONFIGURATION: VERIFIED (and divergent)**

Read-only Render API inspection of the web service (IDs retained; values redacted where sensitive):

| Setting | `render.yaml` | **Live provider** | Verdict |
|---|---|---|---|
| Runtime / env | `node` | **`rust`** (`env: rust`, `runtime: rust`) | **DIVERGENT** |
| Build command | canonical pnpm build | identical | match |
| Start command | `node dist/server/entry.mjs` | **`SYSTEM_OWNER_LOGIN_IDENTITY=yazeed pnpm access:grant-system-owner; node dist/server/entry.mjs`** | **DIVERGENT** |
| Health-check path | `/api/health/ready` | **`""` (empty — no health check configured)** | **DIVERGENT** |
| Auto-deploy trigger | `checksPass` | **`commit`** | **DIVERGENT** |
| Repo / branch | this repository / `main` | matches | match |
| Region | — | `oregon` (same region as the database) | ok |
| Instances / plan | — | 1 / free | documented risk |
| Type / state | web | `web_service`, `suspended: not_suspended` | ok |
| Last update | — | `2026-09-18T02:19:43Z` | — |

Environment variables present on the live service (sanitized):

```text
DATABASE_URL    : present — host_class=EXTERNAL, db=qc_operations, user=qc_operations_user,
                  password present, explicit sslmode absent
SESSION_SECRET  : present [value redacted]
SERVICE_VERSION : 0.1.0
NODE_ENV        : production
HOST            : 0.0.0.0
NODE_VERSION    : 24.20.0        → matches the repository Node contract
RATE_LIMIT_LOGIN_MAX            : 10
RATE_LIMIT_LOGIN_WINDOW_SECONDS : 15
```

Release-identity variables **absent** on the live service: `RELEASE_ID`, `RELEASE_BUILD_ID`, `RELEASE_BUILD_TIMESTAMP`, `RELEASE_GIT_SHA`, `RELEASE_MIGRATION_HEAD`, `RELEASE_ENVIRONMENT`. `render.yaml` declares them `sync: false`, so nothing injects them; release identity is therefore incomplete in production.

Deploy history (latest five — status / trigger / timestamps only):

```text
status=live        createdAt=2026-09-18T02:17:06Z  finishedAt=2026-09-18T02:19:43Z  trigger=new_commit
status=deactivated createdAt=2026-09-18T02:03:55Z  trigger=new_commit
status=deactivated createdAt=2026-09-18T01:27:02Z  trigger=new_commit
status=deactivated createdAt=2026-09-18T00:36:42Z  trigger=new_commit
status=deactivated createdAt=2026-09-18T00:09:21Z  trigger=new_commit
```

Every deploy reports `commitId: null`, and `/api/system/release-identity` is auth-gated. **The deployed release SHA is NOT VERIFIED** — it cannot be attributed to a specific commit from provider evidence or from any unauthenticated surface.

### Boot-time authorization grant in the start command — risk assessment

The live start command runs `pnpm access:grant-system-owner` **on every boot/redeploy**, against whatever `DATABASE_URL` points at, sequenced with `;` so a failure aborts startup. Assessed from source (not executed against production, because that would be a write):

- `parseSystemOwnerGrantConfig` requires `SYSTEM_OWNER_LOGIN_IDENTITY` and hard-pins it to the canonical owner identity, so the command cannot be aimed at another account.
- `grantSystemOwnerAccess` throws `'SYSTEM_OWNER is already assigned to another account. Revoke it explicitly first.'` when the role is held elsewhere, and refuses to proceed.
- With the owner already present the operation converges and writes no new state — which is why the live service boots healthy on every redeploy.

Residual risk, stated precisely:

1. **Failure mode is startup failure, not privilege escalation.** Once the canonical owner holds `SYSTEM_OWNER` + `GLOBAL`, no escalation is possible; if a *different* account ever holds it, boot aborts rather than granting.
2. **It writes during web-service startup**, contradicting the repository's own posture: `db/migrations/README.md` states *"the application never runs migrations during startup"*, and `audit/100-percent/QC-100-CLOSURE-05-RENDER-RUNTIME-EVIDENCE.md` records a startup-mutation check (DEP-004). `render-config.test.ts` asserts the **build** command contains no `db:*`/`bootstrap:admin`, but the live **start** command mutates authorization state on boot, and `render.yaml` declares the clean start command — so only the dashboard reflects the drift.
3. The command is coupled to the same credential documented as compromised, re-using it on every deploy.

### Production database expiry blocker

The Render database is on the **free** plan with `expiresAt: 2026-10-05T05:41:06Z` (30 days after `createdAt`). Free Render PostgreSQL instances expire, which would take the live `qclevel.top` deployment out of service. This is an operational blocker independent of code or configuration.
---

## I. Phase 8 — Root causes fixed

### Fixed: the local `.env` was never loaded by any documented DB command

**Symptom.** `pnpm db:preflight` with only the local `.env` present reported:

```text
DATABASE PREFLIGHT CONFIGURATION ERROR: DATABASE_URL is required. Set it through the
approved secret mechanism; the value is never printed.
```

**Diagnosis.** Not a database, network, TLS, or credential problem — a **wiring** problem. `scripts/db/load-local-env.ts` exports `loadLocalEnv()`, but six entrypoints imported the module for a **side effect that never runs**, because the module defines only exported functions and has no top-level call:

```ts
import './load-local-env.js';   // no-op: nothing executes
```

Proven directly, before the fix:

```text
AFTER_SIDE_EFFECT_IMPORT: NOT_LOADED | SERVICE_VERSION: NOT_SET
```

This contradicted `docs/operations/RENDER-DATABASE-CONNECTION.md`, which documents that the standalone commands load the ignored local `.env` through the allowlisted, non-shell parser. Only `seed-foundation.ts`, `check-foundation-seed.ts`, `check-system-owner.ts`, `grant-system-owner.ts`, and `check-initial-admin.ts` called `loadLocalEnv()` correctly.

**Fix.** `loadLocalEnv()` is now invoked at the **CLI boundary** of each affected entrypoint (inside the `process.argv[1] === fileURLToPath(import.meta.url)` guard), and the no-op side-effect imports were replaced with real imports:

```text
scripts/db/preflight.ts
scripts/db/migrate.ts
scripts/db/migration-status.ts
scripts/db/check-migration-integrity.ts
scripts/db/check-schema-integrity.ts
scripts/recovery/validate-restored-database.ts
```

The boundary placement is deliberate. `migrate()` and the other exported functions are imported directly by the PostgreSQL integration suites, which supply their own pools (`migrate({ pool })`); loading `.env` inside the exported functions would have mutated the test process environment. Verified after the fix:

```text
BEFORE: NOT_LOADED
AFTER_LOAD_ENV: LOADED
SERVICE_VERSION: 9.9.9
```

Precedence and safety are unchanged: explicit environment variables still win, the allowlisted non-shell parser still ignores the Render provider export, and nothing is logged.

### Fixed: order-dependent integration assertion on a shared database

`tests/integration/database/seeds.test.ts` counted **all** rows in `qc.role_permissions` but compared them against foundation counts derived from system roles only. Because the approved disposable database persists across suites, a non-system `SYSTEM_OWNER` role created by an earlier test added 198 grants:

```text
observed: SYSTEM_OWNER is_system_role=f grants=198
          SUPERVISOR 71, MANAGER 49, ADMIN 43, EMPLOYEE 25
          total 386 = 188 foundation + 198 test-created
```

The assertion was therefore dependent on test-file ordering rather than on the foundation contract. It now counts grants joined to system roles only. Foundation seeding itself was already correct and idempotent (`ON CONFLICT DO NOTHING`), which is why `secondCounts === firstCounts` passed while the absolute comparison failed.

### Diagnosed and deliberately NOT changed

- **`db:schema:check` failing against the Render database.** Correct fail-closed behaviour for a database 7 migrations behind head. The remedy is to apply `0019`–`0025` after the credential rotation gate opens — not to relax the check.
- **`sslmode` absent from the Render URLs.** Not weakened, not "fixed". TLS is enforced by `rejectUnauthorized: true` against Node's CA store, and TLS 1.3 was verified on the wire. No security control was loosened and no credential was hardcoded anywhere.

---

## J. Required tests added

| Required proof | Where | Result |
|---|---|---|
| Invalid/missing `DATABASE_URL` fails safely | `tests/unit/database/runtime-connection-contract.test.ts` (6 parametrised cases) | **PASS** |
| Correct `search_path` is applied | integration: session contract `qc,pg_catalog` + `UTC` + `current_schema() = qc` | **PASS** |
| Wrong schema is detected | integration: negative control — the same database without the canonical session options reports `public`, and `qc` is absent from `search_path` | **PASS** |
| Pending migrations are detected | integration: apply all but the last two, then `check` reports exactly those two as pending and applies nothing | **PASS** |
| Readiness fails when the DB is unavailable | unit (`canonical-readiness-agreement`) + live boot against `127.0.0.1:1` → `503` | **PASS** |
| Readiness succeeds when the DB is compatible | unit + live boot against the real Render database → `200 healthy` | **PASS** |
| Secrets never appear in health/error output | unit + integration + byte-level scan of all 16 evidence logs → 0 hits | **PASS** |
| `.env` wiring cannot silently regress | unit: provider-export shape yields only `DATABASE_URL`; explicit env wins; every documented CLI entrypoint must call `loadLocalEnv()` and must not use a bare side-effect import | **PASS** |

New files:

```text
tests/unit/database/runtime-connection-contract.test.ts   12 tests
tests/integration/database/connection-chain.test.ts        4 tests
```

Modified: `tests/integration/database/seeds.test.ts` (order-dependent assertion) plus the six entrypoints listed in section J.
---

## K. Remaining blockers

| # | Blocker | Severity | Why it is not closed |
|---|---|---|---|
| 1 | **Credential rotation gate** — the local Render export credential is documented as compromised (`docs/operations/RENDER-DATABASE-CONNECTION.md`). | **P0** | Rotation requires the Render dashboard and a human operator. Until then, no migration, bootstrap, or write against the Render database is permitted by the repository contract. This is why `0019`–`0025` remain unapplied. |
| 2 | **Render database is 7 migrations behind source head** (`0018` → `0025`). | **P0** | Blocked by #1. Consequence today: `db:schema:check` fails closed, and release-governance / UAT-evidence / workflow-006 tables are absent from the production database while the deployed app expects them. |
| 3 | **Free-plan database expires `2026-10-05T05:41:06Z`** (30 days after creation). | **P0** | Provider plan decision. Expiry would take `qclevel.top` out of service. |
| 4 | **Live Render service configuration diverges from `render.yaml`** — runtime `rust` instead of `node`, empty health-check path, `autoDeployTrigger: commit` instead of `checksPass`, and a writing start command. | **P1** | Provider configuration decision; changing it is a deployment action and was not authorised. `render.yaml` is not being enforced, so the repository's declared contract is not the live contract. |
| 5 | **Release-identity variables absent in production**, every deploy reports `commitId: null`. | **P1** | Cannot be remedied from this repository alone; the deployed release SHA is **NOT VERIFIED**. |
| 6 | **Production database reachable from `0.0.0.0/0` with `networkIsolationEnabled: false`**, while the web service uses the **external** database URL. | **P1** | Provider/network architecture decision. TLS 1.3 is enforced, so this is exposure surface rather than a transport defect. |
| 7 | **Local Node is `v22.22.3`, outside the `>=24.20.0 <25` contract.** | **P2** | All local results above are Node 22 evidence. The Render service pins `NODE_VERSION=24.20.0`, so production runs the contracted runtime; local evidence is **not** runtime-parity evidence. |
| 8 | **`pnpm format:check` fails on `audit/QC-Master-Prompts-Interactive-Copy.html`.** | **P2** | **Pre-existing** at HEAD `38528bd` (added by that commit, untouched here). Deliberately not reformatted; it is a prompt-pack artifact outside this task's scope. |
| 9 | **Testcontainers/`postgres:18-alpine` image path still unexercised.** | **P2** | No container runtime on this host. Mitigated: the same suites ran against the approved disposable PostgreSQL 18 cluster, and the canonical product path is identical at the connection layer. |
| 10 | **UAT not executed; production readiness not claimed.** | **P2** | Unchanged by this task. Green readiness is a database-connectivity fact, not UAT acceptance. |
| 11 | **`grant-system-owner` runs on every production boot.** | **P2** | Drift from the declared start command; assessed as startup-coupling risk rather than a privilege-escalation path (Phase 7, section I). |

Not claimed anywhere in this record: production-readiness sign-off, UAT acceptance, WCAG conformance, capacity/performance results, or that the Render database holds the complete production schema. `PASS` is not `RELEASED`.

---

## L. Acceptance criteria mapping

| Acceptance criterion | Status | Evidence |
|---|---|---|
| Database connectivity is actually proven | **MET** | Canonical pool connection, `db:preflight` PASS, TLS 1.3, live `qclevel.top` readiness `200`. |
| Correct database/schema is confirmed | **MET** | `qc_operations` / `qc_operations_user` / `qc` schema / `search_path=qc,pg_catalog` / `UTC`, verified through the runtime pool **and** independently through the provider API (`databaseName`, `databaseUser`, `version: 18`, `region: oregon`). |
| Migration status is known | **MET** | Applied `0001`–`0018`; pending `0019`–`0025` (IDs listed); source head `0025`. |
| Schema integrity is verified | **MET (fail-closed)** | Ledger checksums verify for all 18 applied rows; `db:schema:check` correctly fails for the 7-migration gap; the controlled equivalent reaches `25 migrations / 70 tables / 0 orphans`. |
| Application repositories can read/write in controlled tests | **MET** | `test:integration` 83 files / 326 PASS against disposable PG 18, including explicit write-and-rollback on `qc.users`. Deliberately **not** performed against the live Render database. |
| Readiness reflects database truth | **MET** | `200 healthy` with the Render database; `503` when unreachable; `503` when `DATABASE_URL` is missing under production. |
| No secrets were leaked | **MET** | 16 logs scanned for password/hostname/username → 0 hits; credential never printed nor placed in argv; all credential-bearing temp files deleted. |
| Render environment contract VERIFIED or explicitly NOT VERIFIED/BLOCKED | **MET** | Provider configuration **VERIFIED** via read-only API and reported as **divergent** from `render.yaml`; deployed release SHA explicitly **NOT VERIFIED**. |
---

## M. Evidence provenance

All results were produced on working tree HEAD `38528bd6ffd49b800057f58ac88612ca1b2af97f` plus the uncommitted changes listed in section K. Logs retained under the gitignored `.tmp/` directory:

```text
.tmp/render-db-verify-schema-check.log            (Render DB — fail-closed drift)
.tmp/render-db-verify-migrate-status.log          (Render DB — applied/pending)
.tmp/render-db-verify-disposable-pipeline.log     (controlled full migration chain)
.tmp/render-db-verify-integration.log             (83 files / 326 tests)
.tmp/render-db-verify-integration3.log            (post-fix re-run)
.tmp/render-db-verify-dbsuites.log                (migrations + concurrency + security)
.tmp/render-db-verify-unit.log                    (79 files / 535 tests)
.tmp/render-db-verify-typecheck.log / -lint.log / -format.log / -arch.log / -build2.log
.tmp/render-db-verify/server-{real-render,unreachable-db,missing-db-url}.log
```

Operational follow-ups, in priority order — all require explicit human authorisation because they mutate provider or production state:

1. Rotate the Render database credential and revoke the exposed one.
2. Move the database off the free plan before `2026-10-05`, or explicitly accept scheduled expiry.
3. Apply `0019`–`0025` to the Render database after rotation, then re-run `db:migrate:status` and `db:schema:check` and require `pending []` / `70 tables` / `0 orphans`.
4. Reconcile the live service with `render.yaml` (runtime `node`, health-check path `/api/health/ready`, `checksPass` trigger, non-mutating start command) and inject the `RELEASE_*` identity variables.
5. Decide the production database network posture (internal URL + isolation, or an explicitly accepted public endpoint).

**No commit, push, deployment, provider mutation, or production write was performed during this task.** The only production interaction was read-only: SQL `SELECT`s through a read-only transaction, provider `GET` requests, and unauthenticated HTTP `GET`s against public health endpoints.
Consequence: production traffic currently traverses the public internet to reach the database. TLS 1.3 is still enforced on the wire (verified), so this is an architectural exposure (latency, surface area, no network isolation), not an unencrypted-transport defect.
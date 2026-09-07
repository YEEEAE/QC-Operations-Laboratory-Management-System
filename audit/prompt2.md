
---

# PROMPT 003 — تصحيح وضع `.env` + بوابة الاتصال الآمنة

هذا جديد ومهم بسبب الملف اللي رفعتَه.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-003

MODEL:
GPT-5.6 Luna

MODE:
LOCAL SECURITY REMEDIATION
+ PRODUCTION READ-ONLY PREFLIGHT

REPOSITORY:
YEEEAE/QC-Operations-Laboratory-Management-System

MISSION:
Correct the current local Render PostgreSQL credential/environment handling and establish a safe, verified READ-ONLY connection gate before any production database write is allowed.

IMPORTANT CURRENT VERIFIED CONTEXT:

Tasks already completed:

QC-RENDER-POSTGRES-RECOVERY-001
QC-RENDER-POSTGRES-RECOVERY-002

Do NOT redo them blindly.

The repository now contains:

- Node 24.20.0 as canonical runtime
- pnpm 11.25.0
- pnpm db:preflight
- docs/operations/RENDER-DATABASE-CONNECTION.md
- DATABASE_URL validation
- improved environment validation

Inspect current working tree first because local changes may be newer than GitHub.

CRITICAL NEW CONTEXT:

The local `.env` file currently appears to be a Render connection-information dump rather than the application's canonical environment format.

It contains key names corresponding to concepts such as:

Hostname
Database
Username
Password
Internal_Database_URL
External_Database_URL
PSQL_Command

DO NOT PRINT THEIR VALUES.

The application itself expects DATABASE_URL rather than these Render-display field names.

The `.env` file therefore MUST NOT be assumed to automatically configure:

pnpm db:migrate
pnpm db:preflight
bootstrap commands

Also do not assume tsx CLI scripts automatically load `.env`.

════════════════════════════════════════════════════════════
SECURITY RULES
════════════════════════════════════════════════════════════

Never:

- cat .env
- print .env contents
- echo database URLs
- print password
- print PSQL command
- put DATABASE_URL in a CLI argument
- put secrets into git
- put secrets into documentation
- expose values in test output

Inspect ONLY environment variable names/structure.

Before using the real Render credential:

The operator previously exposed a PostgreSQL credential.

Require explicit confirmation that the active credential has been rotated.

If credential rotation has NOT been confirmed:

STOP all Render connection attempts.

Do not use the previously exposed credential.

════════════════════════════════════════════════════════════
PHASE 1 — CURRENT REALITY
════════════════════════════════════════════════════════════

Run:

git status --short
git diff --stat
node --version
pnpm --version
git check-ignore -v .env || true
git ls-files --error-unmatch .env 2>/dev/null || true

Confirm:

- .env is ignored
- .env is NOT tracked
- no secret-containing env file is staged

Inspect only the KEY NAMES in `.env`.

Do this programmatically without printing values.

Report:

KEY NAME | EXPECTED BY APPLICATION? | CLASSIFICATION

Do not show values.

════════════════════════════════════════════════════════════
PHASE 2 — DETERMINE ACTUAL ENV LOADING
════════════════════════════════════════════════════════════

Inspect:

package.json
scripts/db/preflight.ts
scripts/db/migrate.ts
scripts/bootstrap/create-initial-admin.ts
src/config/env.ts
src/config/runtime.ts
src/shared/database/pool.ts
Astro/Vite configuration

Determine conclusively whether command-line scripts automatically load `.env`.

Do not guess.

If they rely only on process.env, state it explicitly.

════════════════════════════════════════════════════════════
PHASE 3 — LOCAL SECRET STRATEGY
════════════════════════════════════════════════════════════

Do NOT solve this by committing connection details.

Prefer the existing secure shell workflow in:

docs/operations/RENDER-DATABASE-CONNECTION.md

The intended architecture should be:

LOCAL MAC:
Render External Database URL
→ entered privately
→ exported as DATABASE_URL only for the command/session
→ unset immediately afterward

RENDER WEB SERVICE:
Render Internal Database URL
→ stored in Render environment
→ DATABASE_URL

Do not rely on:

External_Database_URL
Internal_Database_URL
Password
Hostname

as application environment variable names.

They are provider-display concepts, not canonical application config.

════════════════════════════════════════════════════════════
PHASE 4 — HANDLE CURRENT .env FILE
════════════════════════════════════════════════════════════

Determine the safest treatment of the current secret-bearing `.env`.

It should NOT be used as a Render credential archive.

Preferred final state:

- `.env.example` remains tracked and contains variable names only.
- actual production DB secrets remain in Render or temporary shell environment.
- local plaintext provider credential dumps are removed when no longer required.

DO NOT delete the current `.env` without first confirming the operator has access to the active Render credential through Render itself.

Do not copy the secrets anywhere else.

════════════════════════════════════════════════════════════
PHASE 5 — READ-ONLY RENDER PREFLIGHT
════════════════════════════════════════════════════════════

ONLY IF credential rotation is confirmed:

Use the approved silent-input workflow.

Do not source the current `.env`.

Run:

pnpm db:preflight

against the Render EXTERNAL database URL using temporary DATABASE_URL.

This is READ ONLY.

Verify safe metadata:

- connectivity
- PostgreSQL version
- current database
- current database user
- qc schema existence
- qc.users existence
- qc.schema_migrations existence
- applied migrations
- pending migrations
- safe privilege capabilities

Expected historical evidence:

qc.users previously returned NULL.

Do not assume it is still NULL; re-check.

Do not modify the database.

════════════════════════════════════════════════════════════
STOP CONDITIONS
════════════════════════════════════════════════════════════

STOP if:

- credential rotation is not confirmed
- database identity is unexpected
- database name is unexpected
- PostgreSQL connection fails
- `.env` is tracked
- secret appears staged/committed
- preflight unexpectedly shows application migrations already applied
- any secret is accidentally printed

════════════════════════════════════════════════════════════
VERIFICATION
════════════════════════════════════════════════════════════

Run relevant tests for changes made.

At minimum if code changed:

pnpm typecheck
pnpm lint
pnpm test

Do NOT run db:migrate.

Do NOT seed.

Do NOT bootstrap admin.

════════════════════════════════════════════════════════════
FINAL RESPONSE
════════════════════════════════════════════════════════════

Return:

ENV FILE SAFETY: PASS/FAIL
ACTIVE CREDENTIAL ROTATED: CONFIRMED/NOT CONFIRMED
DATABASE PREFLIGHT: PASS/FAIL/NOT RUN
DATABASE: <safe database name only>
POSTGRESQL: <version only>
QC SCHEMA: EXISTS/MISSING
QC.USERS: EXISTS/MISSING
MIGRATIONS APPLIED: n
MIGRATIONS PENDING: n
PRODUCTION WRITE GATE: OPEN/BLOCKED

Never print secrets.
```

---

# PROMPT 004 — إصلاح Migration Architecture لـ Render PostgreSQL

هذا يحل أخطر نقطة تقنية عندك الآن.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-004

MODEL:
GPT-5.6 Luna

MODE:
LOCAL IMPLEMENTATION
+ DISPOSABLE DATABASE TESTING

MISSION:
Make the complete migration architecture deterministically compatible with a fresh managed Render PostgreSQL 18 database without requiring unsupported superuser or cluster-level privileges.

DO NOT TOUCH THE REAL RENDER DATABASE.

Continue from completed tasks 001-003.

First inspect current working tree and preserve all valid changes already made.

════════════════════════════════════════════════════════════
KNOWN RISK
════════════════════════════════════════════════════════════

Historically db/migrations/0001_core_schema.sql contained operations such as:

CREATE ROLE qc_migrator
CREATE ROLE qc_app_runtime

ALTER SCHEMA ... OWNER TO qc_migrator
ALTER TABLE ... OWNER TO qc_migrator

GRANT ... TO qc_app_runtime

This may conflict with managed PostgreSQL privileges.

Additionally, changing ownership away from the actual Render migration credential could potentially interfere with later migrations.

Do not assume either behavior.

Prove it.

════════════════════════════════════════════════════════════
PHASE 1 — MIGRATION FORENSICS
════════════════════════════════════════════════════════════

Inspect ALL:

db/migrations/*.sql
scripts/db/migrate.ts
scripts/db/check-migration-integrity.ts
scripts/db/migration-status.ts
scripts/db/preflight.ts
database integration tests
database docs

Build:

MIGRATION
OPERATION
PRIVILEGE REQUIRED
MANAGED POSTGRES RISK
DEPENDENCIES

Pay special attention to:

CREATE ROLE
ALTER ROLE
OWNER TO
GRANT
REVOKE
CREATE EXTENSION
ALTER DATABASE
search_path
uuidv7()
schema ownership
sequence ownership

════════════════════════════════════════════════════════════
PHASE 2 — MIGRATION IMMUTABILITY
════════════════════════════════════════════════════════════

Determine whether existing migration files are already considered immutable.

The migration system stores checksums.

Do NOT blindly modify historical migrations.

Determine whether:

A. migrations have never been applied anywhere important

OR

B. migration checksum compatibility must be preserved

Design the safest solution based on evidence.

Never:

- edit qc.schema_migrations manually
- bypass checksum verification
- mark migrations manually applied

════════════════════════════════════════════════════════════
PHASE 3 — MANAGED POSTGRES DESIGN
════════════════════════════════════════════════════════════

A fresh Render database must work with the provider-managed credential.

Required properties:

- no PostgreSQL superuser required
- no CREATEROLE requirement unless explicitly provisioned
- migration executor retains ability to apply every later migration
- application can use qc schema
- runtime permissions are deterministic
- ownership model is explicit
- security model is documented

If separate:

qc_migrator
qc_app_runtime

cannot be provisioned using normal Render DB credentials:

make that architecture optional or replace it with a managed-service-compatible model.

Do not preserve architecture that cannot actually deploy merely because it looks theoretically stricter.

At the same time, do not silently weaken security.

Document the trust model.

════════════════════════════════════════════════════════════
PHASE 4 — DISPOSABLE POSTGRESQL 18 TEST
════════════════════════════════════════════════════════════

Use PostgreSQL 18.

Use Testcontainers/Docker if supported.

Most importantly:

test using a NON-SUPERUSER deployment identity whose capabilities approximate a managed PostgreSQL application credential.

Do not only test as postgres superuser.

Prove:

EMPTY DATABASE
→ migration runner
→ ALL migrations applied
→ expected qc schema/tables exist

Then:

run migration again
→ zero new migrations

Then:

pnpm db:migrate:check
→ PASS

Then test:

migration checksum mismatch
→ detected

failed migration
→ transaction rolled back correctly

concurrent migration attempt
→ protected by advisory migration lock

════════════════════════════════════════════════════════════
REQUIRED CORE OBJECTS
════════════════════════════════════════════════════════════

At minimum verify:

qc.schema_migrations
qc.users
qc.sessions
qc.audit_events
qc.roles
qc.permissions
qc.role_permissions
qc.user_roles
qc.user_scopes

and every other table expected from all migrations.

════════════════════════════════════════════════════════════
TESTS
════════════════════════════════════════════════════════════

Run:

pnpm typecheck
pnpm lint
pnpm test
pnpm test:migrations
pnpm test:integration

No real Render writes.

════════════════════════════════════════════════════════════
COMPLETION CRITERIA
════════════════════════════════════════════════════════════

Do not state Render-compatible unless:

1. a fresh PostgreSQL 18 database passes
2. non-superuser deployment identity passes
3. all migrations apply
4. migration rerun is idempotent
5. checksum validation passes
6. ownership/privilege model is documented

Final:

MIGRATION ARCHITECTURE: PASS/FAIL
MANAGED POSTGRES COMPATIBILITY: PASS/FAIL
MIGRATIONS VERIFIED: n/n
PRODUCTION MIGRATION GATE: OPEN/BLOCKED
```

---

# PROMPT 005 — Foundation Roles + Permissions + RBAC

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-005

MODEL:
GPT-5.6 Luna

MODE:
LOCAL IMPLEMENTATION
+ AUTHORIZATION TESTING

MISSION:
Create a deterministic production-safe Foundation authorization process for roles, permissions and role grants.

DO NOT TOUCH REAL RENDER PRODUCTION.

Current architecture includes canonical roles such as:

EMPLOYEE
SUPERVISOR
MANAGER
ADMIN

and canonical permission codes.

The critical question is not whether ADMIN exists.

The question is:

Does ADMIN have the correct effective authorization?

════════════════════════════════════════════════════════════
INSPECT
════════════════════════════════════════════════════════════

db/seeds/*
db/migrations/*
authorization modules
permission resolver
role resolver
middleware/guards
security architecture docs
permission matrices
role matrices
tests

Search complete repository for:

role_permissions
APPROVED_PERMISSION_CODES
FOUNDATION_ROLE_CODES
ADMIN
PERM-
permission matrix
authorization matrix

════════════════════════════════════════════════════════════
REQUIREMENTS
════════════════════════════════════════════════════════════

Implement a canonical production-safe command:

pnpm db:seed:foundation

and a read-only verification command:

pnpm db:seed:foundation:check

Names may differ only if repository conventions clearly require it.

Foundation seed must be:

- deterministic
- idempotent
- transactional
- repeatable
- non-destructive
- production-safe
- incapable of inserting dev/test users

Seed:

canonical roles
canonical permissions
canonical role-permission relationships

════════════════════════════════════════════════════════════
NO INVENTED SECURITY POLICY
════════════════════════════════════════════════════════════

Find the approved authorization matrix from repository evidence.

Do NOT invent arbitrary permissions for roles.

If no authoritative role-permission matrix exists:

STOP and report that as an authorization architecture blocker.

If ADMIN is canonically intended to receive all approved permissions:

implement that deterministically.

Otherwise follow the actual policy.

════════════════════════════════════════════════════════════
DRIFT DETECTION
════════════════════════════════════════════════════════════

Foundation check should detect:

missing role
inactive required role
missing permission
unknown/deprecated permission
missing required grant
forbidden grant
duplicate/drift conditions where applicable

Return non-zero on invalid foundation state.

════════════════════════════════════════════════════════════
BOOTSTRAP INTEGRATION
════════════════════════════════════════════════════════════

Initial admin bootstrap must eventually require a valid authorization foundation.

It must not produce:

ACTIVE USER
+
ADMIN LABEL
+
ZERO EFFECTIVE ADMIN PERMISSIONS

as a successful production outcome.

════════════════════════════════════════════════════════════
DISPOSABLE DB TEST
════════════════════════════════════════════════════════════

Prove:

fresh DB
→ migrations
→ foundation seed
→ foundation check PASS

Then run seed again:

→ no duplicates
→ same final state
→ foundation check PASS

Report exact non-sensitive counts:

roles
permissions
role_permissions

════════════════════════════════════════════════════════════
VERIFY
════════════════════════════════════════════════════════════

pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration

Final:

FOUNDATION SEED: PASS/FAIL
FOUNDATION CHECK: PASS/FAIL
ROLES: n
PERMISSIONS: n
ROLE GRANTS: n
AUTHORIZATION GATE: OPEN/BLOCKED
```

---

# PROMPT 006 — تقوية Initial Admin + اختبار Login كامل محليًا

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-006

MODEL:
GPT-5.6 Luna

MODE:
LOCAL IMPLEMENTATION
+ DISPOSABLE END-TO-END TEST

MISSION:
Harden the initial administrator bootstrap and prove that a fresh database can produce a real functioning administrator — not merely a row named ADMIN.

DO NOT TOUCH REAL RENDER PRODUCTION.

Target future production identity:

yazeed

DO NOT hardcode its password.

════════════════════════════════════════════════════════════
INSPECT
════════════════════════════════════════════════════════════

scripts/bootstrap/create-initial-admin.ts
src/modules/identity/application/bootstrap-initial-admin.ts
password hasher
login/authentication
session handling
authorization
audit repository
user_roles
user_scopes
foundation verification

════════════════════════════════════════════════════════════
BOOTSTRAP CONTRACT
════════════════════════════════════════════════════════════

Inputs:

DATABASE_URL
BOOTSTRAP_ADMIN_IDENTITY
BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_DISPLAY_NAME

optional:

BOOTSTRAP_ADMIN_EMAIL

Never log secrets.

Password must use canonical Argon2id implementation.

Successful creation must atomically establish:

USER
+
ACTIVE account
+
ADMIN role
+
GLOBAL scope
+
valid effective ADMIN authorization
+
audit trail

If any part fails:

ROLL BACK ALL bootstrap writes.

════════════════════════════════════════════════════════════
FOUNDATION REQUIREMENT
════════════════════════════════════════════════════════════

Bootstrap MUST fail closed if:

- migrations pending
- ADMIN role missing/inactive
- Foundation authorization invalid
- required ADMIN grants incomplete

Do not merely print:

"authorization grants still require configuration"

and call bootstrap successful in production.

════════════════════════════════════════════════════════════
CHECK COMMAND
════════════════════════════════════════════════════════════

Implement:

pnpm bootstrap:admin:check

or equivalent.

Read only.

Report:

USER EXISTS
ACTIVE
ADMIN ROLE
GLOBAL SCOPE
AUTHORIZATION COMPLETE
AUDIT EVIDENCE

Never print:

password_hash
password
sessions
tokens

════════════════════════════════════════════════════════════
IDEMPOTENCY
════════════════════════════════════════════════════════════

If identity already exists:

- never overwrite password
- never silently add/remove grants
- never silently change account state
- return clear result

════════════════════════════════════════════════════════════
FULL DISPOSABLE TEST
════════════════════════════════════════════════════════════

Create disposable PostgreSQL 18.

Perform:

EMPTY
→ migrations
→ foundation seed
→ foundation check
→ bootstrap admin using TEST-ONLY secret
→ bootstrap check

Then prove actual authentication:

correct test password → succeeds
incorrect password → fails

Then prove authorization:

anonymous protected request → denied
authenticated ordinary user → appropriately denied
bootstrap ADMIN → allowed on an ADMIN-protected operation

Then bootstrap same identity again:

→ no duplicate
→ no password overwrite
→ no authorization corruption

════════════════════════════════════════════════════════════
VERIFY
════════════════════════════════════════════════════════════

pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm test:security

Final:

BOOTSTRAP: PASS/FAIL
AUTHENTICATION: PASS/FAIL
ADMIN ROLE: PASS/FAIL
GLOBAL SCOPE: PASS/FAIL
AUTHORIZATION: PASS/FAIL
AUDIT: PASS/FAIL
PRODUCTION ADMIN GATE: OPEN/BLOCKED
```

---

# PROMPT 007 — التنفيذ الحقيقي للـ Migrations على Render

هنا أول برومبت يسمح بكتابة فعلية على قاعدة Render.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-007

MODEL:
GPT-5.6 Luna

MODE:
PRODUCTION READ-ONLY PREFLIGHT
→ CONDITIONAL PRODUCTION WRITE

MISSION:
Safely initialize the actual Render PostgreSQL database after all local migration/foundation/bootstrap gates have passed.

THIS TASK MAY WRITE TO PRODUCTION.

Do not proceed unless tasks 003-006 are PASS.

════════════════════════════════════════════════════════════
SECRET HANDLING
════════════════════════════════════════════════════════════

The current local `.env` previously contained provider-exported database credentials.

DO NOT:

source .env
cat .env
print it
use PSQL_Command from it
echo any DB URL
pass DB URL directly as a command-line argument

Use the approved secure temporary DATABASE_URL workflow from:

docs/operations/RENDER-DATABASE-CONNECTION.md

Use the Render EXTERNAL Database URL for local Mac access.

Require confirmation that previously exposed credentials have been rotated.

If not confirmed:

STOP.

════════════════════════════════════════════════════════════
RUNTIME GATE
════════════════════════════════════════════════════════════

Verify:

node --version
pnpm --version

Required canonical runtime:

Node 24.20.0
pnpm 11.25.0

Check:

git status --short

Know exactly what code is executing.

════════════════════════════════════════════════════════════
READ-ONLY PREFLIGHT
════════════════════════════════════════════════════════════

Run:

pnpm db:preflight

Confirm:

PostgreSQL major version 18
expected database = qc_operations
expected database user
connection PASS

Capture only safe metadata.

Do not expose hostname if not needed.

If qc.users or migration ledger exists unexpectedly relative to expected state:

STOP and investigate before writing.

════════════════════════════════════════════════════════════
PRE-WRITE METADATA SNAPSHOT
════════════════════════════════════════════════════════════

Record non-sensitive metadata only:

- qc schema existence
- application tables currently present
- schema_migrations existence
- migration count

Do not dump production rows.

════════════════════════════════════════════════════════════
MIGRATION
════════════════════════════════════════════════════════════

Run:

pnpm db:migrate

If any migration fails:

STOP.

Never:

- edit qc.schema_migrations
- mark a failed migration complete
- bypass checksum validation
- retry randomly
- manually create application tables to get past the runner

Use systematic-debugging.

If successful:

pnpm db:migrate:status
pnpm db:migrate:check
pnpm db:preflight

Verify all repository migrations are applied and zero are pending.

════════════════════════════════════════════════════════════
DO NOT YET
════════════════════════════════════════════════════════════

Do not create yazeed yet.

Do not create arbitrary users.

Do not manually insert roles.

════════════════════════════════════════════════════════════
FINAL
════════════════════════════════════════════════════════════

DATABASE CONNECTION: PASS/FAIL
POSTGRESQL: 18/OTHER
DATABASE IDENTITY: PASS/FAIL
MIGRATIONS: n/n
PENDING: n
QC.USERS: EXISTS/MISSING
FOUNDATION: NOT EXECUTED
ADMIN: NOT CREATED
PRODUCTION MIGRATION GATE: PASS/FAIL

No secrets.
```

---

# PROMPT 008 — Foundation + إنشاء yazeed فعليًا على Render

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-008

MODEL:
GPT-5.6 Luna

MODE:
PRODUCTION WRITE
+ AUTHENTICATION VERIFICATION

MISSION:
Configure the canonical production authorization foundation and create the real initial administrator account yazeed.

Only continue after RECOVERY-007 PASS.

════════════════════════════════════════════════════════════
FIRST — READ-ONLY CHECKS
════════════════════════════════════════════════════════════

Using secure temporary DATABASE_URL:

pnpm db:preflight
pnpm db:migrate:check
pnpm db:seed:foundation:check

If foundation check reports missing because it has not yet been seeded:
that may be expected.

If migrations are invalid/pending:

STOP.

════════════════════════════════════════════════════════════
FOUNDATION
════════════════════════════════════════════════════════════

Run canonical:

pnpm db:seed:foundation

Then:

pnpm db:seed:foundation:check

Require PASS.

Do not manually edit roles or permission tables.

════════════════════════════════════════════════════════════
INITIAL ADMIN
════════════════════════════════════════════════════════════

Identity:

yazeed

Display name:

Yazeed

The operator chooses the password.

DO NOT request the password in Codex chat.

Collect it privately through silent terminal input.

Do NOT:

- write password to .env
- save it in shell history
- echo it
- print it
- log hash

Temporarily establish canonical bootstrap environment variables.

Run:

pnpm bootstrap:admin

Then immediately:

pnpm bootstrap:admin:check

════════════════════════════════════════════════════════════
DATABASE VERIFICATION
════════════════════════════════════════════════════════════

Read-only verify:

exactly one yazeed user
ACTIVE
password hash populated
ADMIN role active and assigned
GLOBAL scope active
foundation authorization complete
expected bootstrap audit events

Never print password_hash.

════════════════════════════════════════════════════════════
AUTH TEST
════════════════════════════════════════════════════════════

Verify actual application authentication.

Prove:

valid yazeed credentials → login succeeds
invalid password → fails
anonymous protected access → fails
ADMIN-only operation → succeeds for yazeed

Do not expose credentials in request logs.

════════════════════════════════════════════════════════════
CLEANUP
════════════════════════════════════════════════════════════

Unset temporary:

DATABASE_URL
BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_IDENTITY
BOOTSTRAP_ADMIN_DISPLAY_NAME
BOOTSTRAP_ADMIN_EMAIL

where they were temporarily defined locally.

Do not delete Render DB configuration.

════════════════════════════════════════════════════════════
FINAL
════════════════════════════════════════════════════════════

FOUNDATION: PASS/FAIL
ADMIN USER: PASS/FAIL
ACCOUNT STATE: PASS/FAIL
ADMIN ROLE: PASS/FAIL
GLOBAL SCOPE: PASS/FAIL
AUTHORIZATION: PASS/FAIL
AUTHENTICATION: PASS/FAIL
AUDIT: PASS/FAIL

Do not claim success unless all PASS.
```

---

# PROMPT 009 — ربط Render Web Service بالإنتاج

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-009

MODEL:
GPT-5.6 Luna

MODE:
PRODUCTION CONFIGURATION
+ DEPLOYMENT VERIFICATION

MISSION:
Finalize the Render Web Service production configuration after database initialization and admin creation.

Do not expose secrets.

════════════════════════════════════════════════════════════
DATABASE CONNECTION MODEL
════════════════════════════════════════════════════════════

LOCAL MAC:
External Database URL

RENDER WEB SERVICE:
Internal Database URL when Render private networking/topology permits it.

The application's variable name is:

DATABASE_URL

Do NOT configure application variables named:

Hostname
Database
Username
Password
Internal_Database_URL
External_Database_URL
PSQL_Command

Those are provider connection details, not canonical app config.

════════════════════════════════════════════════════════════
PRODUCTION ENVIRONMENT
════════════════════════════════════════════════════════════

Audit exact current requirements from src/config/env.ts and render.yaml.

At minimum validate:

NODE_VERSION
NODE_ENV
SERVICE_VERSION
DATABASE_URL
SESSION_SECRET
RATE_LIMIT_LOGIN_MAX
RATE_LIMIT_LOGIN_WINDOW_SECONDS

and optional observability config if used.

Never commit secret values.

Generate secure SESSION_SECRET if missing through approved secret handling.

Do not reuse:

database password
admin password
any previously exposed credential

as SESSION_SECRET.

════════════════════════════════════════════════════════════
IMPORTANT ARCHITECTURAL RULE
════════════════════════════════════════════════════════════

Application startup must NOT automatically:

run migrations
run foundation seed
bootstrap admin

Those remain explicit operator-controlled procedures.

════════════════════════════════════════════════════════════
HEALTH
════════════════════════════════════════════════════════════

Verify:

health/live endpoint
health/ready endpoint

or canonical current equivalents.

Readiness should correctly validate required production dependencies without leaking details.

════════════════════════════════════════════════════════════
BUILD / TEST
════════════════════════════════════════════════════════════

Run:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm test:security
pnpm build

Run e2e if valid production-like environment exists.

════════════════════════════════════════════════════════════
RENDER FREE DATABASE LIFECYCLE
════════════════════════════════════════════════════════════

The Render screenshots previously showed this PostgreSQL instance as a FREE database with an expiration/deletion warning.

Explicitly verify current plan/lifecycle with the operator/provider state.

A database scheduled for automatic deletion must NOT be considered acceptable long-lived production storage.

If expiration/deletion remains active:

mark:

PRODUCTION DURABILITY: BLOCKED

even if application connectivity works.

Do not silently call the deployment production-ready.

════════════════════════════════════════════════════════════
FINAL
════════════════════════════════════════════════════════════

WEB SERVICE DATABASE CONFIG: PASS/FAIL
INTERNAL DB CONNECTIVITY: PASS/FAIL
SESSION CONFIG: PASS/FAIL
RATE LIMIT CONFIG: PASS/FAIL
HEALTH LIVE: PASS/FAIL
HEALTH READY: PASS/FAIL
BUILD: PASS/FAIL
PRODUCTION DURABILITY: PASS/BLOCKED
```

---

# PROMPT 010 — Security Closure

هذا الآن يتضمن `.env` الجديد بشكل صريح.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-010

MODEL:
GPT-5.6 Luna

MODE:
SECURITY CLOSURE

MISSION:
Close all database credential, local secret, Render exposure and bootstrap security risks created or discovered during recovery.

════════════════════════════════════════════════════════════
DATABASE CREDENTIAL
════════════════════════════════════════════════════════════

A PostgreSQL credential was previously exposed.

Require evidence/operator confirmation that the active DB credential is rotated.

Never print old or new values.

If the old credential remains active:

SECURITY CLOSURE FAILS.

════════════════════════════════════════════════════════════
LOCAL .env
════════════════════════════════════════════════════════════

The previous local `.env` contained provider connection details including plaintext credential material.

Verify:

git check-ignore -v .env
git ls-files --error-unmatch .env

It must remain untracked.

After production recovery is complete and operator confirms active credentials are safely available in Render:

remove unnecessary plaintext Render credential dumps from local project storage.

Do not replace them with another plaintext copy.

Keep:

.env.example

as variable names/template only.

Do not delete user secrets before confirming recoverability.

════════════════════════════════════════════════════════════
SECRET SCAN
════════════════════════════════════════════════════════════

Scan:

tracked files
git diff
staged diff
documentation
logs
generated reports
config files

for:

postgresql://
postgres://
DATABASE_URL values
passwords
tokens
SESSION_SECRET
authorization headers

Never print discovered secret values.

Report redacted location only.

════════════════════════════════════════════════════════════
BOOTSTRAP CLEANUP
════════════════════════════════════════════════════════════

After successful yazeed creation:

BOOTSTRAP_ADMIN_PASSWORD must not remain configured.

Determine whether other bootstrap variables should also be removed:

BOOTSTRAP_ADMIN_IDENTITY
BOOTSTRAP_ADMIN_DISPLAY_NAME
BOOTSTRAP_ADMIN_EMAIL

Remove from production environment when no longer operationally required.

Do not remove variables from render.yaml definitions merely because their values are absent unless architecture requires it.

════════════════════════════════════════════════════════════
POSTGRESQL NETWORK EXPOSURE
════════════════════════════════════════════════════════════

Previous screenshot showed inbound PostgreSQL access:

0.0.0.0/0
everywhere

Review current Render configuration.

After local database work is complete:

apply/recommend least-privilege inbound restrictions.

If direct Mac DB administration is not required:
external DB access should be disabled/restricted as far as provider supports.

If it is required:
limit access to approved IP/CIDR.

Do not claim this was changed if you cannot modify Render dashboard.

════════════════════════════════════════════════════════════
APPLICATION SECURITY
════════════════════════════════════════════════════════════

Verify logs/errors cannot expose:

DATABASE_URL
password
password_hash
session token
cookies
Authorization headers
bootstrap secrets

Verify SESSION_SECRET is independent and strong.

════════════════════════════════════════════════════════════
VERIFY
════════════════════════════════════════════════════════════

Run:

pnpm test:security
pnpm lint
pnpm typecheck
pnpm test

Generate/update:

docs/operations/POSTGRES-SECURITY-CLOSURE.md

Final controls:

DB CREDENTIAL ROTATED: PASS/FAIL
LOCAL SECRET FILE SAFETY: PASS/FAIL
GIT SECRET SCAN: PASS/FAIL
BOOTSTRAP SECRET CLEANUP: PASS/FAIL
DB NETWORK EXPOSURE: PASS/FAIL/BLOCKED-BY-OPERATOR
LOG REDACTION: PASS/FAIL
SESSION SECRET ISOLATION: PASS/FAIL

SECURITY CLOSED: YES/NO
```

---

# PROMPT 011 — Final Independent Closure

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-FINAL-CLOSURE-011

MODEL:
GPT-5.6 Luna

MODE:
FINAL INDEPENDENT VERIFICATION

MISSION:
Independently re-audit the complete recovery from CURRENT REALITY.

Do not trust PASS statements from tasks 001-010.

Re-run evidence.

════════════════════════════════════════════════════════════
A — TOOLCHAIN
════════════════════════════════════════════════════════════

Verify canonical:

Node 24.20.0
pnpm 11.25.0

════════════════════════════════════════════════════════════
B — LOCAL SECRETS
════════════════════════════════════════════════════════════

Verify:

.env not tracked
no production credential committed
no provider credential dump required for normal operation
DATABASE_URL handling follows approved secret workflow

Never print secrets.

════════════════════════════════════════════════════════════
C — DATABASE
════════════════════════════════════════════════════════════

Using approved secure connection method:

pnpm db:preflight

Verify:

expected Render database
PostgreSQL supported
qc exists
connectivity PASS

════════════════════════════════════════════════════════════
D — MIGRATIONS
════════════════════════════════════════════════════════════

Verify:

every migration file accounted for
every required migration applied
zero pending
checksums valid
migration runner idempotent
managed-Postgres compatibility proven

════════════════════════════════════════════════════════════
E — DATABASE OBJECTS
════════════════════════════════════════════════════════════

Verify every expected application table.

At minimum:

qc.schema_migrations
qc.users
qc.sessions
qc.roles
qc.permissions
qc.role_permissions
qc.user_roles
qc.user_scopes
qc.audit_events

and all domain tables from all migrations.

════════════════════════════════════════════════════════════
F — FOUNDATION
════════════════════════════════════════════════════════════

Run canonical read-only foundation verification.

Verify:

roles
permissions
role grants
no policy drift

════════════════════════════════════════════════════════════
G — YAZEED ADMIN
════════════════════════════════════════════════════════════

Without exposing sensitive fields:

exactly one yazeed
ACTIVE
ADMIN role
GLOBAL scope
complete effective authorization
bootstrap audit trail

════════════════════════════════════════════════════════════
H — AUTHENTICATION
════════════════════════════════════════════════════════════

Prove:

valid login works
invalid login fails
anonymous access blocked
session works
ADMIN authorization works
rate limiting works

Do not expose credentials.

════════════════════════════════════════════════════════════
I — RENDER WEB SERVICE
════════════════════════════════════════════════════════════

Verify:

production environment configuration
internal DB connection where appropriate
SESSION_SECRET
rate limits
health/live
health/ready
build/start
canonical host

════════════════════════════════════════════════════════════
J — DATABASE DURABILITY
════════════════════════════════════════════════════════════

Verify current Render PostgreSQL lifecycle/plan.

If database is still scheduled for automatic deletion/expiration:

PRODUCTION DATABASE READY = FALSE

regardless of all functional tests.

This is a hard operational blocker for durable production use.

════════════════════════════════════════════════════════════
K — SECURITY
════════════════════════════════════════════════════════════

Verify:

previously exposed DB credential rotated
no plaintext credentials committed
bootstrap password removed
external database exposure restricted appropriately
logs clean
SESSION_SECRET independent

════════════════════════════════════════════════════════════
L — FULL QUALITY GATES
════════════════════════════════════════════════════════════

Run:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:migrations
pnpm test:integration
pnpm test:security
pnpm build

Run e2e where valid.

════════════════════════════════════════════════════════════
FINAL REPORT
════════════════════════════════════════════════════════════

Create:

docs/operations/POSTGRES-RENDER-FINAL-CLOSURE.md

Evidence matrix:

CONTROL
EXPECTED
ACTUAL
COMMAND/EVIDENCE
STATUS

Never use fake percentages.

Final verdict EXACTLY:

PRODUCTION DATABASE READY

or

PRODUCTION DATABASE NOT READY

If NOT READY:
list exact blockers in dependency order.

Do not weaken criteria merely because most components pass.
```

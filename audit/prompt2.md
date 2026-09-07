

---

# PROMPT 003 — Secret Rotation + `.env` Normalization

هذا الجديد أهم تغيير عن الخطة السابقة. نفذه قبل أي كتابة حقيقية على Render.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-003

MODEL:
GPT-5.6 Luna

MODE:
LOCAL IMPLEMENTATION
+ SECURITY REMEDIATION
+ CONFIGURATION NORMALIZATION
+ PRODUCTION WRITE BLOCKED

REPOSITORY:
YEEEAE/QC-Operations-Laboratory-Management-System

IMPORTANT CONTEXT:

Tasks already executed:

QC-RENDER-POSTGRES-RECOVERY-001
QC-RENDER-POSTGRES-RECOVERY-002

DO NOT redo them blindly.

FIRST:
Read the actual current working tree and all reports/files produced by those tasks.

Run:

pwd
git status --short
git diff --stat
git diff
git rev-parse HEAD
node --version
pnpm --version

Find and read:

docs/operations/RENDER-POSTGRES-RECOVERY-AUDIT.md
docs/operations/RENDER-DATABASE-CONNECTION.md

or their actual equivalents if task 001/002 used different filenames.

Inspect CURRENT versions of:

package.json
.env
.env.example
.gitignore
render.yaml
src/config/env.*
src/config/runtime.*
src/shared/database/pool.*
scripts/db/*

Do not assume repository state from old prompts.

════════════════════════════════════════════
KNOWN NEW INFORMATION
════════════════════════════════════════════

A local `.env` file now contains Render PostgreSQL connection information.

It currently uses concepts/keys equivalent to:

Hostname
Database
Username
Password
Internal_Database_URL
External_Database_URL
PSQL_Command

IMPORTANT:

The actual credential has already been exposed outside the secret manager.

Treat the CURRENT Render database credential as COMPROMISED.

NEVER:

- print the password
- print any full database URL
- print PSQL_Command containing a password
- echo DATABASE_URL
- include secrets in git diff
- include secrets in docs
- include secrets in tests
- commit `.env`
- copy the old credential into other files

Redact all values in output.

════════════════════════════════════════════
MISSION
════════════════════════════════════════════

Normalize secret handling and make DATABASE_URL the canonical application/migration interface.

1. Verify `.env` and `.env.*` are ignored by Git.

Run:

git check-ignore -v .env
git ls-files .env

Expected:
.env must NOT be tracked.

If tracked:
STOP and remediate safely before continuing.

2. Search git tracked content and current diff for secret leaks.

Search patterns:

postgresql://
postgres://
PGPASSWORD=
DATABASE_URL=
Password=
Internal_Database_URL=
External_Database_URL=
PSQL_Command=

Do not output secret values.

Only report:
path + secret type + redacted status.

3. Determine the canonical environment contract from CURRENT code.

The application/migration system should normally consume:

DATABASE_URL

Do not create parallel runtime contracts such as:

Password
Hostname
Internal_Database_URL
External_Database_URL
PSQL_Command

unless repository architecture explicitly requires them.

4. Normalize local `.env`.

The goal is NOT to store five copies of the credential.

Prefer one canonical local secret:

DATABASE_URL=<local external Render URL>

plus only other application environment variables genuinely required locally.

Do NOT write an actual secret into:
.env.example
render.yaml
tracked source
documentation

5. Local vs Render connection model

LOCAL MAC:
DATABASE_URL must represent the Render EXTERNAL PostgreSQL URL.

RENDER WEB SERVICE:
DATABASE_URL must represent the Render INTERNAL PostgreSQL URL when service/database topology supports private networking.

Do not make the app switch based on custom variable names.

6. TLS

Render external PostgreSQL connectivity must use TLS.

Inspect how node-postgres `pg` currently receives SSL configuration.

Do not blindly duplicate SSL configuration if DATABASE_URL already carries sslmode.

Implement/test a deterministic external connection strategy.

Do not weaken certificate behavior without explaining why.

7. `.env` loading

Determine whether:

pnpm db:preflight
pnpm db:migrate
pnpm db:migrate:status
pnpm db:migrate:check

actually load `.env`.

Do NOT assume Astro/Vite `.env` loading applies to standalone `tsx` scripts.

If standalone scripts currently require manually exporting variables:
choose and implement one canonical safe mechanism.

Requirements:

- deterministic
- works on Node 24.20.0
- does not log secrets
- documented
- testable
- same behavior for all DB operator commands

Avoid unsafe shell parsing of arbitrary passwords.

8. Credential rotation gate

Because the old Render DB credential is compromised:

DO NOT run production mutations yet.

Update the runbook with an explicit operator step:

Render Dashboard
→ PostgreSQL database
→ Credentials
→ create a new default credential
→ update local DATABASE_URL securely
→ later update connected Render services
→ verify new credential
→ revoke/delete old credential

Do not attempt to put the new password in documentation.

9. Remove unnecessary local secret duplication.

The local `.env` should not retain plaintext variants such as:

Password=...
PSQL_Command=PGPASSWORD=...
Internal_Database_URL=...
External_Database_URL=...

if DATABASE_URL alone is the canonical required interface.

Be careful:
do not destroy the only usable credential before the operator completes rotation.

If manual operator action is required:
STOP and clearly state it.

════════════════════════════════════════════
TESTS
════════════════════════════════════════════

Run all relevant non-production tests.

At minimum:

pnpm typecheck
pnpm lint
pnpm test

Test environment parsing without exposing values.

Verify:

git status --short
git diff --check

Verify no secret is present in tracked diff.

════════════════════════════════════════════
STOP CONDITIONS
════════════════════════════════════════════

STOP if:

- .env is tracked
- a real DB credential exists in tracked content
- current credential rotation has not been completed before production write
- DATABASE_URL behavior is ambiguous
- TLS behavior cannot be established safely

DO NOT migrate production in this task.

════════════════════════════════════════════
FINAL RESPONSE
════════════════════════════════════════════

Return:

CURRENT 001/002 STATE:
ENV CONTRACT:
LOCAL DB URL MODE:
RENDER DB URL MODE:
TLS:
.env TRACKED: YES/NO
SECRET LEAKS IN TRACKED FILES: YES/NO
CREDENTIAL ROTATION REQUIRED: YES
PRODUCTION WRITES ALLOWED: NO

FILES CHANGED
TESTS RUN
REMAINING MANUAL ACTION

Never display any credential.
```

بعد ما يخلصه، **نفّذ تدوير credential في Render يدويًا**. لا تحذف القديم إلا بعد ما صار الجديد شغال عندك؛ Render نفسه يدعم هالآلية. 

---

# PROMPT 004 — Render-Compatible Migration Architecture

هذا بديل البرومبت القديم `003` لكن الآن يخليه يعتمد على نتائج 001–003.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-004

MODEL:
GPT-5.6 Luna

MODE:
LOCAL IMPLEMENTATION
+ DISPOSABLE DATABASE TESTING
+ NO PRODUCTION WRITE

MISSION:
Prove and, where necessary, repair the migration architecture so an EMPTY managed Render PostgreSQL 18 database can be migrated safely without PostgreSQL superuser privileges.

PREVIOUS COMPLETED TASKS:

001 reality audit
002 runtime/environment/database tooling
003 secret/env normalization

FIRST:
Read their actual outputs and current working tree.

Do not trust old prompt assumptions.

════════════════════════════════════════════
CRITICAL CURRENT AREA
════════════════════════════════════════════

Inspect every migration, especially:

db/migrations/0001_core_schema.sql

Pay particular attention to:

CREATE ROLE
ALTER ROLE
ALTER SCHEMA ... OWNER
ALTER TABLE ... OWNER
GRANT
REVOKE
uuidv7()
search_path
extensions
schema creation

The Render-managed connection credential must not depend on unsupported superuser-only behavior.

════════════════════════════════════════════
MISSION REQUIREMENTS
════════════════════════════════════════════

1. Determine exactly what privileges migration 0001 requires.

2. Determine what happens when:

qc_operations_user
(or a newly rotated Render-managed PostgreSQL user)

runs the migration.

3. Establish whether changing ownership to:

qc_migrator
qc_app_runtime

could prevent the Render credential from applying later migrations.

4. Determine whether custom PostgreSQL roles are actually required for the current application architecture.

Do NOT preserve complexity merely because it exists.

Do NOT remove security boundaries merely to make tests pass.

5. Migration history integrity

Inspect:

scripts/db/migrate.*
scripts/db/check-migration-integrity.*
qc.schema_migrations logic

Do not rewrite historical migrations blindly.

If migrations have already been applied anywhere and checksum immutability matters:
design a safe compatibility path.

If evidence confirms production DB is genuinely fresh and no authoritative applied migration ledger exists:
still preserve a clean reproducible migration history.

6. Managed PostgreSQL deployment mode

Design explicit support for:

MODE A:
single Render-managed credential performs migrations + runtime

and, only if architecture actually requires:

MODE B:
separate migrator/runtime DB identities provisioned externally

Fresh Render deployment MUST NOT require unsupported `CREATE ROLE` privilege unless Render explicitly supports and project design intentionally requires it.

7. Verify ownership/grants end state.

After migration, the actual runtime credential must be able to perform every SQL operation required by the application.

8. Fresh PostgreSQL 18 test

Use a disposable PostgreSQL 18 environment.

Prefer Testcontainers if repository already supports it.

Start from COMPLETELY EMPTY DB.

Run equivalent of:

pnpm db:preflight
pnpm db:migrate
pnpm db:migrate:status
pnpm db:migrate:check
pnpm db:migrate

The final repeat migration must apply zero new migrations.

Verify all migration versions.

Verify critical objects exist:

qc.schema_migrations
qc.users
qc.sessions
qc.roles
qc.permissions
qc.role_permissions
qc.user_roles
qc.user_scopes
qc.audit_events

plus all expected domain tables.

9. Failure testing

Prove:

- failed migration rolls back
- failed migration is NOT inserted into schema_migrations
- checksum mismatch is rejected
- migration rerun is safe
- concurrency lock behavior remains valid

10. Managed-privilege simulation

Do not test only as PostgreSQL superuser.

Create/use a restricted test DB principal representative of a managed credential and prove migrations succeed under the intended privilege model.

════════════════════════════════════════════
SECURITY
════════════════════════════════════════════

Do not use the actual production Render database.

Do not use actual production secrets.

Do not lower security globally to pass tests.

════════════════════════════════════════════
QUALITY GATES
════════════════════════════════════════════

Run:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm db:migrate:check

as applicable to disposable DB only.

════════════════════════════════════════════
COMPLETION
════════════════════════════════════════════

Do not claim RENDER COMPATIBLE unless an EMPTY PostgreSQL 18 database successfully migrates using the intended managed-user privilege model.

Final response:

MIGRATION ARCHITECTURE: PASS/FAIL
POSTGRES 18 FRESH DB: PASS/FAIL
MANAGED USER PRIVILEGES: PASS/FAIL
IDEMPOTENCY: PASS/FAIL
ROLLBACK: PASS/FAIL
CHECKSUM INTEGRITY: PASS/FAIL

FILES CHANGED
EVIDENCE
REMAINING BLOCKERS

PRODUCTION DB MUST REMAIN UNCHANGED.
```

---

# PROMPT 005 — Production Foundation / RBAC

هذا ما زال ضروري جدًا؛ لأنه يحل مشكلة `ADMIN` بدون صلاحيات.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-005

MODEL:
GPT-5.6 Luna

MODE:
LOCAL IMPLEMENTATION
+ AUTHORIZATION HARDENING
+ DISPOSABLE DB TEST
+ NO PRODUCTION WRITE

MISSION:
Create and verify the canonical production-safe Foundation authorization bootstrap.

Read current repository state after tasks 001–004.

Inspect:

db/seeds/*
db/migrations/*authorization*
src/modules/authorization/**
src/modules/identity/**
permission matrix documentation
role matrix documentation
tests
package.json

════════════════════════════════════════════
PROBLEM TO SOLVE
════════════════════════════════════════════

A database having:

qc.roles(code='ADMIN')

does NOT automatically mean the administrator has effective permissions.

We need a deterministic:

migrations
→ foundation authorization
→ admin bootstrap

production path.

════════════════════════════════════════════
REQUIREMENTS
════════════════════════════════════════════

Create a canonical command such as:

pnpm db:seed:foundation

and read-only verification:

pnpm db:seed:foundation:check

Use actual project naming if a better canonical pattern already exists.

Foundation must configure canonical:

EMPLOYEE
SUPERVISOR
MANAGER
ADMIN

and all approved permissions.

Configure role_permissions according to the repository's authoritative approved permission matrix.

DO NOT invent a security policy.

If no authoritative ADMIN permission matrix exists:
STOP and identify the exact policy gap rather than arbitrarily granting everything.

Foundation execution must be:

- deterministic
- transactional
- idempotent
- production-safe
- non-destructive
- safe to execute repeatedly
- free from development/test users

Never require:

QC_SEED_ALLOW_NON_PRODUCTION=true

for the dedicated production Foundation command.

Keep dev/test seeds separately guarded.

════════════════════════════════════════════
DRIFT VALIDATION
════════════════════════════════════════════

Foundation check must detect:

missing role
inactive required role
missing permission
unexpected/deprecated permission if forbidden
missing expected role_permission
forbidden role_permission
duplicate/impossible state

Return nonzero when canonical authorization is incomplete.

════════════════════════════════════════════
ADMIN BOOTSTRAP RELATIONSHIP
════════════════════════════════════════════

The initial administrator bootstrap must not consider:

"ADMIN role exists"

sufficient.

It must be able to verify canonical ADMIN authorization readiness.

Do not create a nominal administrator with zero effective permissions.

════════════════════════════════════════════
DISPOSABLE DB PROOF
════════════════════════════════════════════

PostgreSQL 18 empty DB:

migrate
→ foundation
→ foundation check
→ foundation again
→ foundation check

Prove same result after repeated run.

Report:

role count
permission count
role_permission count

Do not use fake expected counts.
Derive them from canonical source.

════════════════════════════════════════════
QUALITY GATES
════════════════════════════════════════════

Run:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration

Final:

FOUNDATION: PASS/FAIL
ROLE MATRIX: PASS/FAIL
PERMISSION MATRIX: PASS/FAIL
IDEMPOTENCY: PASS/FAIL
DRIFT CHECK: PASS/FAIL

PRODUCTION DB UNCHANGED.
```

---

# PROMPT 006 — Harden Initial Admin Bootstrap

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-006

MODEL:
GPT-5.6 Luna

MODE:
LOCAL IMPLEMENTATION
+ DISPOSABLE DB TEST
+ NO PRODUCTION WRITE

MISSION:
Harden and fully verify the one-time initial administrator bootstrap.

Target production login identity:

yazeed

Do not hardcode its password.

Read actual outputs from tasks 001–005.

Inspect:

scripts/bootstrap/create-initial-admin.*
src/modules/identity/application/bootstrap-initial-admin.*
password hasher
authentication service
authorization resolver
audit repository
user_roles
user_scopes
sessions
tests

════════════════════════════════════════════
REQUIREMENTS
════════════════════════════════════════════

Bootstrap remains an explicit operator-only command.

It must NEVER run automatically during:

build
migration
foundation seed
server startup
Render deploy

Required inputs:

DATABASE_URL
BOOTSTRAP_ADMIN_IDENTITY
BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_DISPLAY_NAME

Optional email only if current schema supports/needs it.

Password must:

- use canonical Argon2id implementation
- never be logged
- never appear in errors
- never appear in command output
- never be committed
- never be stored plaintext

Successful bootstrap transaction must create/verify:

qc.users
ADMIN user role
GLOBAL user scope
audit events

The complete operation must be atomic.

════════════════════════════════════════════
AUTHORIZATION PRECONDITION
════════════════════════════════════════════

Before creating the account:

db migrations must be complete
Foundation check must PASS
ADMIN role must be active
canonical ADMIN authorization must be complete

If any fail:
bootstrap must fail closed BEFORE leaving a partial account.

════════════════════════════════════════════
CHECK COMMAND
════════════════════════════════════════════

Implement a safe:

pnpm bootstrap:admin:check

or canonical equivalent.

It should report only:

user exists
account active
ADMIN role
GLOBAL scope
effective ADMIN authorization
bootstrap audit presence

Never output:

password_hash
password
session token
DATABASE_URL

════════════════════════════════════════════
EXISTING USER
════════════════════════════════════════════

If identity already exists:

do not reset password
do not silently grant access
do not mutate account unexpectedly

Return a clear state.

════════════════════════════════════════════
DISPOSABLE POSTGRES 18 PROOF
════════════════════════════════════════════

Empty DB:

migrate
→ foundation
→ bootstrap initial admin using TEST-ONLY secret
→ bootstrap check
→ authenticate
→ perform an ADMIN-protected authorization test
→ bootstrap same identity again

Verify idempotent/existing behavior.

════════════════════════════════════════════
QUALITY
════════════════════════════════════════════

Run all related tests and:

pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration

Final:

ADMIN BOOTSTRAP: PASS/FAIL
ATOMICITY: PASS/FAIL
PASSWORD SECURITY: PASS/FAIL
ROLE: PASS/FAIL
GLOBAL SCOPE: PASS/FAIL
EFFECTIVE AUTHORIZATION: PASS/FAIL
AUTHENTICATION: PASS/FAIL

PRODUCTION DB UNCHANGED.
```

---

# PROMPT 007 — Full Empty-Database Dress Rehearsal

هذا جديد ومهم قبل لمس Render فعليًا.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-007

MODEL:
GPT-5.6 Luna

MODE:
LOCAL TEST / RELEASE GATE
NO PRODUCTION WRITE

MISSION:
Perform a complete production-like dress rehearsal from a completely empty PostgreSQL 18 database.

Do NOT change production.

Use the repository AS IT EXISTS after tasks 001–006.

════════════════════════════════════════════
STARTING STATE
════════════════════════════════════════════

Create a disposable PostgreSQL 18 database with no application schema/data.

Use no production credentials.

════════════════════════════════════════════
EXECUTION
════════════════════════════════════════════

Run the real canonical operator sequence:

1. database preflight
2. migrations
3. migration status/check
4. Foundation seed
5. Foundation check
6. initial admin bootstrap using test-only credentials
7. admin check
8. application start in production-like configuration
9. authentication test
10. authorization test
11. health/live
12. health/ready

Verify login failure using incorrect password.

Verify anonymous requests cannot access protected resources.

Verify admin can access at least one genuinely ADMIN-protected operation.

Verify restart does not mutate schema/auth data.

Run migration/seed again:

migrations → no-op
foundation → idempotent

════════════════════════════════════════════
DATA VERIFICATION
════════════════════════════════════════════

Verify critical:

schema_migrations
users
sessions
roles
permissions
role_permissions
user_roles
user_scopes
audit_events

and domain schemas/tables created by all migrations.

════════════════════════════════════════════
NO SHORTCUTS
════════════════════════════════════════════

Do not:

manually INSERT schema_migrations
disable auth
grant superuser to make tests pass
skip Foundation
mock database for this end-to-end gate
reuse production secrets

════════════════════════════════════════════
FULL QUALITY GATES
════════════════════════════════════════════

Run:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm build

Run e2e if available.

════════════════════════════════════════════
FINAL VERDICT
════════════════════════════════════════════

Exactly:

RENDER PRODUCTION WRITE GATE: PASS

or:

RENDER PRODUCTION WRITE GATE: BLOCKED

If BLOCKED, list exact failures.

Do not continue to real Render.
```

---

# PROMPT 008 — Real Render Read-Only Preflight

هنا **لا Migration للحين**. أول نتأكد من القاعدة والـcredential الجديد.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-008

MODEL:
GPT-5.6 Luna

MODE:
PRODUCTION READ-ONLY

MISSION:
Verify the real Render PostgreSQL target before any production schema mutation.

PRECONDITIONS:

Tasks 001–007 must be verified complete.
RENDER PRODUCTION WRITE GATE must be PASS.

The old compromised credential must have been rotated.

Do not trust environment values merely because they exist.

════════════════════════════════════════════
SECURITY
════════════════════════════════════════════

Never print:

DATABASE_URL
password
connection string
PGPASSWORD

Never:

echo $DATABASE_URL
env | grep DATABASE
printenv DATABASE_URL

Use safe commands/tools that consume the value without displaying it.

════════════════════════════════════════════
TARGET EXPECTATION
════════════════════════════════════════════

Expected non-secret identity:

Database:
qc_operations

PostgreSQL:
18.x

This Mac must use Render EXTERNAL connectivity.

Internal Render hostname must NOT be used from local Mac.

TLS must be active for external connectivity.

════════════════════════════════════════════
READ-ONLY PREFLIGHT
════════════════════════════════════════════

Run canonical:

pnpm db:preflight

Verify safely:

connectivity
server PostgreSQL version
database name
current DB username
TLS state where programmatically available
qc schema existence
qc.schema_migrations existence
qc.users existence
migration ledger count
pending migration count
existing application table count

Run read-only SQL metadata inspection if needed.

NO:
CREATE
ALTER
DROP
INSERT
UPDATE
DELETE
GRANT
REVOKE

════════════════════════════════════════════
UNEXPECTED STATE
════════════════════════════════════════════

If any application tables/data unexpectedly exist:

STOP.

Do not migrate until state is understood.

If current evidence remains:

qc.users missing
and no migrations applied

report database as apparently fresh, but substantiate with metadata.

════════════════════════════════════════════
FINAL
════════════════════════════════════════════

PRODUCTION TARGET: CONFIRMED / NOT CONFIRMED
DATABASE: qc_operations / MISMATCH
POSTGRES VERSION: <non-secret>
TLS: PASS/FAIL
qc SCHEMA: EXISTS/MISSING
MIGRATIONS APPLIED: <count>
MIGRATIONS PENDING: <count>
qc.users: EXISTS/MISSING
UNEXPECTED DATA: YES/NO

PRODUCTION WRITE ALLOWED NEXT: YES/NO

Do not perform any write.
```

---

# PROMPT 009 — Real Render Migration + Foundation

الآن فقط يبدأ الكتابة الفعلية.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-009

MODEL:
GPT-5.6 Luna

MODE:
PRODUCTION WRITE
CONTROLLED DATABASE INITIALIZATION

MISSION:
Initialize the confirmed Render PostgreSQL database using the repository's verified canonical migration and Foundation workflow.

PRECONDITIONS:

This prompt is standalone. Do not require, replay, or validate Task 007 or
Task 008 before starting this workflow. Inspect the current database target
and migration state directly in the PRE-WRITE EVIDENCE step below.

If the current target cannot be identified safely, or the live database state
is unexpected, STOP before any write.

════════════════════════════════════════════
SECURITY
════════════════════════════════════════════

Never print DATABASE_URL or credentials.

Never:

edit schema_migrations manually
mark failed migration as applied
disable checksum verification
delete database objects to get a green result
skip a failed migration
use old compromised credential

════════════════════════════════════════════
PRE-WRITE EVIDENCE
════════════════════════════════════════════

Capture non-sensitive metadata only:

database
Postgres version
current schema list
application table count
migration state

════════════════════════════════════════════
MIGRATION
════════════════════════════════════════════

Run:

pnpm db:migrate

If ANY error occurs:

STOP immediately.

Use systematic-debugging.

Do not proceed to Foundation.

After success:

pnpm db:migrate:status
pnpm db:migrate:check
pnpm db:preflight

Require:
all repository migrations applied
zero pending
checksum validation PASS

Verify critical tables.

════════════════════════════════════════════
FOUNDATION
════════════════════════════════════════════

Only after migration verification PASS:

pnpm db:seed:foundation

then:

pnpm db:seed:foundation:check

Require PASS.

Verify expected role/permission/grant counts using canonical repository definitions.

Do not create yazeed yet.

════════════════════════════════════════════
RERUN SAFETY
════════════════════════════════════════════

Run migration check again.

Do not rerun destructive commands.

Foundation may be rerun only if designed/tested idempotent.

════════════════════════════════════════════
FINAL
════════════════════════════════════════════

DATABASE: PASS/FAIL
MIGRATIONS: <applied>/<expected>
PENDING: 0/<nonzero>
CHECKSUMS: PASS/FAIL
FOUNDATION: PASS/FAIL
ROLES: PASS/FAIL
PERMISSIONS: PASS/FAIL
ROLE GRANTS: PASS/FAIL
qc.users TABLE: PASS/FAIL

ADMIN USER CREATED: NO

If anything fails:
PRODUCTION INITIALIZATION: BLOCKED

Otherwise:
PRODUCTION INITIALIZATION: PASS
```

---

# PROMPT 010 — Create Real `yazeed` Admin

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-010

MODEL:
GPT-5.6 Luna

MODE:
PRODUCTION WRITE
ONE-TIME INITIAL ADMIN BOOTSTRAP

MISSION:
Create and verify the real initial administrator.

Identity:

yazeed

Display name:

Yazeed

Do not hardcode the production password.

════════════════════════════════════════════
PRECONDITIONS
════════════════════════════════════════════

Require:

pnpm db:migrate:check → PASS
pnpm db:seed:foundation:check → PASS
pnpm db:preflight → PASS

If not:
STOP.

════════════════════════════════════════════
PASSWORD SECURITY
════════════════════════════════════════════

Do not ask me to paste the password into Codex chat.

Do not use:

BOOTSTRAP_ADMIN_PASSWORD='secret' pnpm ...

because this can enter shell history/process inspection depending on method.

Use the repository's documented private secret-input workflow.

Password must only reach the bootstrap process via a safe mechanism.

Never print it.

════════════════════════════════════════════
BOOTSTRAP
════════════════════════════════════════════

Set securely:

BOOTSTRAP_ADMIN_IDENTITY=yazeed
BOOTSTRAP_ADMIN_DISPLAY_NAME=Yazeed
BOOTSTRAP_ADMIN_PASSWORD=<PRIVATE>

Optional email only if explicitly supplied.

Run:

pnpm bootstrap:admin

Then:

pnpm bootstrap:admin:check

════════════════════════════════════════════
DATABASE VERIFICATION
════════════════════════════════════════════

Read-only verify:

exactly one yazeed user
ACTIVE account
nonempty password_hash without displaying it
ADMIN role
role active
role not revoked
GLOBAL scope
scope not revoked
effective canonical ADMIN permissions
expected bootstrap audit events

════════════════════════════════════════════
AUTHENTICATION
════════════════════════════════════════════

Test through the actual authentication implementation.

Valid production secret:
login succeeds.

Invalid password:
login fails.

Verify a real ADMIN-protected authorization path succeeds.

Anonymous access must fail.

════════════════════════════════════════════
POST-BOOTSTRAP
════════════════════════════════════════════

Unset local bootstrap secret variables where practical.

Do not retain production admin password in `.env`.

Identify one-time Render bootstrap variables that should NOT remain configured.

════════════════════════════════════════════
FINAL
════════════════════════════════════════════

ADMIN USER: PASS/FAIL
ACCOUNT STATE: PASS/FAIL
PASSWORD HASHING: PASS/FAIL
ADMIN ROLE: PASS/FAIL
GLOBAL SCOPE: PASS/FAIL
EFFECTIVE AUTHORIZATION: PASS/FAIL
AUTHENTICATION: PASS/FAIL
AUDIT: PASS/FAIL

Only if all PASS:

INITIAL ADMIN READY
```

---

# PROMPT 011 — Render Web Service Production Connection

هنا الـInternal URL يصير مهم.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-011

MODEL:
GPT-5.6 Luna

MODE:
PRODUCTION CONFIGURATION
+ LOCAL VERIFICATION

MISSION:
Complete the Render Web Service production database/environment configuration.

The production database and initial admin should already be verified.

════════════════════════════════════════════
CONNECTION MODEL
════════════════════════════════════════════

LOCAL MAC:
External Render PostgreSQL connection.

RENDER WEB SERVICE:
Use Render INTERNAL database connection through DATABASE_URL when Web Service and PostgreSQL database support same-region private networking.

Do NOT copy:

Internal_Database_URL

as a second application contract.

The application should continue consuming canonical:

DATABASE_URL

Do not hardcode host/user/password/database in source.

════════════════════════════════════════════
VERIFY RENDER CONFIG CONTRACT
════════════════════════════════════════════

Audit:

render.yaml
src/config/env.*
Astro adapter/config
server startup
health endpoints
cookie/session config
rate limiter

Production required env must be derived from CURRENT source.

At minimum inspect need for:

NODE_VERSION
NODE_ENV
DATABASE_URL
SESSION_SECRET
SERVICE_VERSION
RATE_LIMIT_LOGIN_MAX
RATE_LIMIT_LOGIN_WINDOW_SECONDS

and observability variables if used.

Do not commit secret values.

════════════════════════════════════════════
SECURITY
════════════════════════════════════════════

Production Web Service must NOT use the old compromised DB credential.

Production Web Service must NOT automatically run:

migrations
Foundation seed
admin bootstrap

during startup or deploy.

Keep DB lifecycle operations explicit.

════════════════════════════════════════════
HEALTH
════════════════════════════════════════════

Verify canonical:

liveness
readiness

Readiness must reflect actual required production dependencies safely.

No secrets in responses.

════════════════════════════════════════════
QUALITY
════════════════════════════════════════════

Run:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm build

Then provide exact Render environment configuration instructions WITHOUT values.

Classify each variable:

PUBLIC/NON-SECRET
SECRET
RENDER INTERNAL DATABASE REFERENCE
OPTIONAL

Final:

RENDER CONFIG: PASS/FAIL
INTERNAL DB MODEL: PASS/FAIL
BUILD: PASS/FAIL
HEALTH CONFIG: PASS/FAIL
AUTH CONFIG: PASS/FAIL
```

---

# PROMPT 012 — Security Closure + Final Independent Audit

هذا الأخير يجمع إغلاق credential القديم، `0.0.0.0/0`، وكل التحقق النهائي.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-FINAL-CLOSURE-012

MODEL:
GPT-5.6 Luna

MODE:
SECURITY CLOSURE
+ FINAL INDEPENDENT VERIFICATION

MISSION:
Independently re-verify the entire Render PostgreSQL recovery and close all known security risks.

DO NOT trust completion claims from tasks 001–011.

Current reality only.

════════════════════════════════════════════
A — CREDENTIAL ROTATION
════════════════════════════════════════════

Verify through safe operator evidence that:

- replacement Render PostgreSQL credential is active
- application/local approved access uses replacement credential
- previously exposed credential no longer has login access

Never display either credential.

If the old credential remains active:

FINAL STATUS MUST BE BLOCKED.

════════════════════════════════════════════
B — LOCAL SECRET HYGIENE
════════════════════════════════════════════

Verify:

.env ignored by git
.env not tracked
only canonical necessary secrets retained
no PSQL_Command containing plaintext password
no duplicate Password variable unless application genuinely needs it
no plaintext secret in docs/source/tests/diff

Never print `.env`.

Use redacted scanning.

════════════════════════════════════════════
C — RENDER INBOUND ACCESS
════════════════════════════════════════════

Review current PostgreSQL external inbound rules.

Known prior state included:

0.0.0.0/0

If broad external access remains:

evaluate whether local external DB administration is still required.

Preferred final state:

Render Web Service uses INTERNAL connection.

External access:
restricted to approved operator IP/CIDR
or disabled when not required.

Do not make a networking change without ensuring it will not lock out a required approved workflow.

════════════════════════════════════════════
D — DATABASE
════════════════════════════════════════════

Verify read-only:

all migrations applied
zero pending
checksums valid
Foundation check PASS

Critical tables exist.

No unexpected partial migration state.

════════════════════════════════════════════
E — ADMIN
════════════════════════════════════════════

Verify yazeed:

exactly one account
ACTIVE
ADMIN role
GLOBAL scope
effective canonical ADMIN permissions

Do not display hashes/secrets.

════════════════════════════════════════════
F — AUTHENTICATION / AUTHORIZATION
════════════════════════════════════════════

Verify:

valid login succeeds
invalid login fails
anonymous protected access fails
admin protected operation succeeds
sessions work
secure production cookies
rate limiting configured

════════════════════════════════════════════
G — RENDER SERVICE
════════════════════════════════════════════

Verify:

Node canonical version
NODE_ENV=production
internal DATABASE_URL model
SESSION_SECRET configured
rate-limit configuration
build/start command
health readiness

Never show secret env values.

════════════════════════════════════════════
H — QUALITY GATES
════════════════════════════════════════════

Run:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm build

Run e2e if repository provides production-safe e2e coverage.

════════════════════════════════════════════
I — FINAL REPORT
════════════════════════════════════════════

Create/update:

docs/operations/POSTGRES-RENDER-FINAL-CLOSURE.md

Do NOT put credentials in it.

Evidence table:

CONTROL
EXPECTED
ACTUAL
EVIDENCE
STATUS

Cover:

runtime
secret handling
credential rotation
migration
foundation
admin
authentication
authorization
Render DB connection
health
inbound DB exposure
tests

Final verdict must be exactly:

PRODUCTION DATABASE READY

or

PRODUCTION DATABASE NOT READY

No percentages.

No assumptions.

No fake PASS.
```

## الترتيب الجديد

صار المسار الأفضل:

```text
001 ✅ Reality Audit
      ↓
002 ✅ Runtime / Env / Preflight
      ↓
003 🔴 Normalize .env + Rotate exposed credential
      ↓
004 Migration architecture / Render privileges
      ↓
005 Foundation RBAC
      ↓
006 Admin bootstrap
      ↓
007 Full disposable PostgreSQL 18 rehearsal
      ↓
008 Real Render READ-ONLY preflight
      ↓
009 Real Render migrations + Foundation
      ↓
010 Create real yazeed admin
      ↓
011 Connect Render Web Service using Internal DATABASE_URL
      ↓
012 Security + Final closure
```

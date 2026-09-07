إيه. الأفضل مع **Codex GPT-5.6 Luna** ما تعطيه برومبت واحد ضخم؛ قسمها مراحل تنفيذية عشان ما يخلط بين إصلاح الكود، Migration، Seed، Admin، وRender.

بنيت البرومبتز على واقع المشروع الحالي: المشروع مثبت على Node `24.20.0`، و`render.yaml` عنده متغيرات الإنتاج الأساسية، بينما إنشاء الأدمن عملية منفصلة عن الـmigrations.  

**انسخها بالترتيب ولا تنتقل للبرومبت اللي بعده إلا بعد نجاح السابق.**

---

# PROMPT 1 — تجميد الواقع + تدقيق المشكلة بالكامل

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-001

MODEL:
GPT-5.6 Luna

REPOSITORY:
YEEEAE/QC-Operations-Laboratory-Management-System

LOCAL PROJECT:
QC-Operations-Laboratory-Management-System

MISSION:
Perform a reality-first audit of the current PostgreSQL/Render/database/bootstrap/auth state.

IMPORTANT:
This is NOT an analysis-only task.
Inspect the actual repository and current working tree first.
Do not trust old reports, old chat conclusions, documentation claims, or previous "fixed" statements.

Known current production situation:

- PostgreSQL is hosted on Render.
- Database name is qc_operations.
- PostgreSQL major version is 18.
- The database currently appears effectively uninitialized for this application.
- The following query against Render returned NULL:

  SELECT to_regclass('qc.users');

- Therefore qc.users was not present at the time of the check.
- Previous local `pnpm db:migrate` failed with:
  SYSTEM_CONFIGURATION_INVALID
  because DATABASE_URL was not available in the shell.
- Local Node was previously v22.22.3 while this repository requires Node 24.20.0.
- A Render database credential was accidentally exposed previously.
- Do NOT reuse, print, log, commit, echo, or inspect any actual database password supplied by the user.
- Assume the old credential must be rotated.
- Render external PostgreSQL connections must be treated as TLS connections.
- Production Render Web Service should use Render's INTERNAL database URL when the service and DB are in the same region.
- Local migration from the Mac should use the EXTERNAL URL securely.

Your first job is to freeze current reality.

Run and record, without exposing secrets:

pwd
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short
git diff --stat
node --version
pnpm --version
cat .node-version
cat package.json
git ls-files db/migrations
git ls-files db/seeds
git ls-files scripts/db
git ls-files scripts/bootstrap

Inspect at minimum:

- package.json
- .node-version
- .npmrc
- .env.example
- render.yaml
- scripts/db/migrate.ts
- scripts/db/migration-status.ts
- scripts/db/check-migration-integrity.ts
- scripts/bootstrap/create-initial-admin.ts
- src/config/env.ts
- src/config/runtime.ts
- src/shared/database/pool.ts
- src/modules/identity/application/bootstrap-initial-admin.ts
- src/modules/identity/security/*
- db/migrations/*
- db/seeds/*
- authentication/login implementation
- authorization / role / permission implementation
- health/readiness endpoints
- all docs related to DB migration, production deployment, bootstrap and Render

Explicitly answer from source code:

1. What creates schema qc?
2. What creates qc.users?
3. What creates ADMIN role?
4. What creates permissions?
5. What creates role_permissions?
6. What creates user_roles?
7. What creates user_scopes?
8. What command creates the initial admin?
9. What exact production environment variables are required?
10. Are production role/permission foundation data currently reproducible?
11. Can a fresh Render PostgreSQL database go from empty -> fully usable production system using documented commands only?
12. Does migration 0001 depend on PostgreSQL CREATE ROLE / ALTER OWNER / GRANT assumptions that might conflict with managed Render PostgreSQL?
13. Does the connected Render DB user actually receive the privileges needed by later migrations and runtime?
14. Are any existing migrations unsafe to rewrite because of checksum-based migration integrity?
15. Is the application using schema qc consistently through search_path and qualified queries?

SECURITY:
Search git history/current tracked files for accidentally committed database URLs/passwords/secrets, but DO NOT print secret values.
Report only filenames/locations and redacted findings.

Do NOT modify code yet.

Create:
docs/operations/RENDER-POSTGRES-RECOVERY-AUDIT.md

The report must contain:

- frozen reality
- current architecture
- root causes
- blockers
- migration compatibility risks
- seed/bootstrap gaps
- authorization gaps
- Render environment gaps
- exact remediation plan
- files expected to change
- tests required
- production execution order

Finish with:

AUDIT RESULT: PASS / BLOCKED

Do not claim PASS unless the repository has a deterministic path from an empty Render PostgreSQL database to a working authorized admin account.
```

---

# PROMPT 2 — إصلاح Node + Environment + اتصال PostgreSQL

بعد ما يخلص الأول، انسخ:

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-002

Continue from QC-RENDER-POSTGRES-RECOVERY-001.

MISSION:
Fix runtime/environment/database connection handling so local migration and Render production deployment are deterministic, safe, and correctly validated.

THIS IS AN IMPLEMENTATION TASK.
Make the required code/config/documentation changes and test them.

Requirements:

1. Runtime version

The repository canonical Node version is 24.20.0.

Ensure all relevant locations agree:

- package.json engines
- .node-version
- Render configuration
- CI configuration
- developer documentation

Do not weaken the Node requirement just to make Node 22 work.

Provide the exact safe local command sequence for nvm users:

nvm install 24.20.0
nvm use 24.20.0
corepack enable
corepack prepare pnpm@11.25.0 --activate

Only modify repository files when necessary.

2. Environment validation

Audit all production-required env vars.

At minimum check:

DATABASE_URL
SESSION_SECRET
SERVICE_VERSION
RATE_LIMIT_LOGIN_MAX
RATE_LIMIT_LOGIN_WINDOW_SECONDS
OTEL_EXPORTER_OTLP_ENDPOINT
OTEL_EXPORTER_OTLP_HEADERS

Fix `.env.example` so it reflects the actual server environment schema.

No secret values may be committed.

3. DATABASE_URL behavior

Ensure:
- missing DATABASE_URL produces a clear operator-facing migration error
- malformed DATABASE_URL produces a clear error
- password/URL must never be printed
- database driver errors must not leak credentials
- migration CLI must identify configuration errors separately from DB/network errors

4. Render connection model

Document and enforce the intended connection model:

LOCAL MAC:
Render External Database URL
TLS required
No secrets committed

RENDER WEB SERVICE:
Render Internal Database URL where service/database topology permits it

Do not hardcode Render hostnames.

5. Safe operator workflow

Create or update:
docs/operations/RENDER-DATABASE-CONNECTION.md

Include a secure zsh workflow where DATABASE_URL is entered without echoing the value.

For example, design a safe workflow around:

read -rs 'DATABASE_URL?...'
export DATABASE_URL

but make the instructions technically correct and robust.

Never tell the operator to paste the URL directly as a shell command.

6. Preflight command

Add a production-safe command such as:

pnpm db:preflight

It must connect read-only and report only non-sensitive information:

- connectivity PASS/FAIL
- PostgreSQL version
- current database
- current user
- schema qc existence
- qc.users existence
- schema_migrations existence
- migration count applied/pending
- relevant capability checks

It must NOT:
- modify schema
- print DATABASE_URL
- print password
- expose secrets

7. Tests

Add unit/integration tests for environment parsing and database preflight where practical.

Run at minimum:

pnpm typecheck
pnpm lint
pnpm test

Use verification-before-completion.

At the end give me:

FILES CHANGED
COMMANDS RUN
TEST RESULTS
REMAINING BLOCKERS

Do not perform production migrations yet.
```

---

# PROMPT 3 — أهم مرحلة: جعل الـ Migrations متوافقة مع Render

هذي أهم وحدة لأن عندك مشكلة محتملة في `0001` بسبب `CREATE ROLE / OWNER / GRANT`.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-003

Continue from the previous completed tasks.

MISSION:
Make the database migration architecture work safely and deterministically on a fresh managed Render PostgreSQL 18 database.

THIS IS AN IMPLEMENTATION + TESTING TASK.

Critical area:

Inspect db/migrations/0001_core_schema.sql carefully.

It currently/previously contained concepts such as:

- CREATE SCHEMA qc
- CREATE ROLE qc_migrator
- CREATE ROLE qc_app_runtime
- ALTER SCHEMA ... OWNER TO ...
- ALTER TABLE ... OWNER TO ...
- GRANT ... TO qc_app_runtime

Do NOT assume those operations are valid for the Render-managed database credential.

Also verify whether the Render connection user becomes unable to continue later migrations after ownership changes.

Goal:

A fresh Render-managed PostgreSQL database must be migratable using the Render-managed database credential without requiring PostgreSQL superuser access.

PHASE A — Evidence

Before changing anything, inspect:
- all migrations
- migration checksum/integrity behavior
- tests
- deployment docs
- any DB role architecture documents

Determine whether existing migration files are intended to be immutable.

Check whether any retained/local/test database has already recorded migration checksums if accessible.

Do not rewrite historical migrations blindly.

PHASE B — Design

Implement the minimum robust design.

Requirements:

1. Managed PostgreSQL must be first-class.

2. Migration execution must not require unsupported cluster-level privileges.

3. Application runtime must have sufficient permissions to:
   - connect
   - use schema qc
   - SELECT/INSERT/UPDATE/etc. required application tables

4. Migration user must retain the ability to apply all later migrations.

5. Do not silently remove database security boundaries without documenting the resulting trust model.

6. If separate migrator/runtime roles remain supported:
   - make them optional/configurable
   - do not make fresh Render deployment depend on CREATE ROLE
   - document how separate credentials are provisioned

7. If single Render-managed DB credential is the correct deployment mode:
   implement it explicitly and consistently rather than relying on accidental superuser behavior.

8. Preserve migration checksum guarantees.

If changing an existing migration would break already-applied environments:
DO NOT simply edit it.
Design a safe baseline/compatibility strategy and document why.

PHASE C — Fresh database test

Create a disposable PostgreSQL test environment, preferably PostgreSQL 18 using testcontainers/docker if available.

Prove:

EMPTY DATABASE
   ↓
pnpm db:migrate
   ↓
all migrations applied exactly once
   ↓
pnpm db:migrate again
   ↓
zero new migrations
   ↓
pnpm db:migrate:check
   ↓
no pending migrations
   ↓
qc.users exists
   ↓
qc.roles exists
   ↓
qc.permissions exists
   ↓
qc.role_permissions exists
   ↓
qc.user_roles exists
   ↓
qc.user_scopes exists

Also prove migration rollback behavior if a migration fails.

Test checksum mismatch detection.

Add automated integration tests for fresh-database migration.

Do not connect to production Render in this task.

Update database deployment documentation.

Run:

pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration

At completion provide hard evidence.

Do not say "Render compatible" without a passing fresh PostgreSQL test and an explicit explanation of the privilege model.
```

---

# PROMPT 4 — إصلاح Foundation Seed + Roles + Permissions بالكامل

هذا يسكر الفجوة اللي عندك الآن بين إنشاء Role `ADMIN` ووجود الصلاحيات الفعلية.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-004

MISSION:
Repair and productionize the foundation authorization seed process.

Current concern:

The system has roles and permission codes, but a production-safe deterministic path for complete role/permission configuration must be proven.

Do not assume that merely inserting ADMIN into qc.roles makes the user an authorized administrator.

Inspect:

db/seeds/*
db/migrations/0003_authorization.sql
authorization services
permission matrix
role matrix
docs
tests
qc.role_permissions usage
all code consuming role and permission grants

Determine the canonical approved role-to-permission matrix.

DO NOT invent security policy when an approved matrix already exists in repository documentation/source.

Requirements:

1. Create an explicit production-safe FOUNDATION seed command.

Preferred naming:

pnpm db:seed:foundation

or another clear canonical command.

2. It must be:

- idempotent
- deterministic
- transaction-safe
- production-safe
- non-destructive
- auditable where appropriate
- incapable of creating arbitrary test/dev users
- incapable of deleting real authorization data
- safe to run multiple times

3. It must seed the canonical:

ROLES:
EMPLOYEE
SUPERVISOR
MANAGER
ADMIN

PERMISSIONS:
all currently approved canonical permission codes

ROLE -> PERMISSION grants:
according to the repository's approved authorization matrix.

4. ADMIN behavior

Determine from the canonical security architecture whether ADMIN should receive all approved administrative/system permissions.

If policy explicitly defines ADMIN as full administrator:
implement the complete intended grants.

If the policy does NOT define this:
do not guess.
Create a blocking validation and identify the missing policy.

5. Prevent drift

Add validation that detects:

- required role missing
- permission missing
- unknown/deprecated permission
- expected grant missing
- unauthorized grant present where policy forbids it

6. Add:

pnpm db:seed:foundation:check

or equivalent read-only verification command.

It should return nonzero on drift.

7. Bootstrap dependency

Ensure initial-admin bootstrap fails clearly if:
- ADMIN role missing
- required foundation authorization configuration missing

Do not allow the command to create a user that has an ADMIN label but no usable admin permissions unless explicitly running in a diagnostic/non-production mode.

8. Tests

Using an empty disposable PostgreSQL DB prove:

migrations
→ foundation seed
→ foundation seed again
→ same deterministic result
→ foundation check PASS

Verify there are no duplicate roles, permissions, grants.

Run all relevant tests.

Update:
docs/operations/INITIAL-ADMIN-BOOTSTRAP.md
and database deployment docs.

At end report exact role/permission counts and test evidence.
```

---

# PROMPT 5 — إنشاء الأدمن الأول بشكل صحيح

هنا Luna يصلح الـbootstrap نفسه ويختبره قبل ما نلمس Render.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-005

MISSION:
Harden and fully verify the initial production administrator bootstrap workflow.

Target initial identity:

yazeed

Do NOT hardcode:
- password
- database URL
- email unless required

Inspect current:

scripts/bootstrap/create-initial-admin.ts
src/modules/identity/application/bootstrap-initial-admin.ts
password hashing
login identity normalization
session/auth
roles
scopes
audit events

Requirements:

1. Keep bootstrap explicit and one-time.
It must NEVER automatically execute during:
- build
- server startup
- migration
- deploy
- ordinary seed

2. Required operator inputs:

DATABASE_URL
BOOTSTRAP_ADMIN_IDENTITY
BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_DISPLAY_NAME

Optional:
BOOTSTRAP_ADMIN_EMAIL

3. Password:
- hash with the project's canonical secure Argon2id implementation
- never log plaintext
- never include plaintext in errors
- never persist plaintext outside the hash
- never put password into docs or git

4. Successful bootstrap must create atomically:

qc.users record
+
ADMIN user_role
+
GLOBAL user_scope
+
appropriate audit records

5. Authorization validation

Before commit, verify the ADMIN role actually has the required approved permissions.

If authorization foundation is incomplete:
ROLL BACK the complete admin bootstrap.

Do not leave a partially configured admin.

6. Existing identity behavior

If yazeed already exists:
- do not overwrite password
- do not silently alter permissions
- return a clear status

7. Add a read-only command such as:

pnpm bootstrap:admin:check

that reports:

user exists yes/no
account active yes/no
ADMIN role yes/no
GLOBAL scope yes/no
authorization complete yes/no

Do not reveal:
password hash
session tokens
secret values

8. Integration test

Disposable fresh PostgreSQL:

migrate
→ foundation seed
→ bootstrap admin
→ verify DB records
→ bootstrap again
→ confirm idempotent existing-user behavior
→ test successful authentication using test-only credentials
→ test authorization to an ADMIN-protected operation

9. Documentation

Update initial admin runbook with exact secure steps.

Run complete verification.

Do NOT connect to real Render production in this prompt.
```

---

# PROMPT 6 — تشغيل فعلي على Render من الماك

**قبل هالبرومبت أنت بنفسك غيّر Credential قاعدة Render القديمة** لأنها انكشفت. Render يدعم إنشاء credential جديد ثم حذف القديم، وهذا هو المسار المناسب لتدوير بيانات الدخول. 

بعد تغييرها، افتح Codex داخل المشروع وأرسل:

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-006

MISSION:
Safely initialize the actual EMPTY/FRESH Render production PostgreSQL database from this Mac.

This task is allowed to perform real production database changes ONLY after all previous repository verification tasks pass.

ABSOLUTE SECURITY RULES:

- Never ask me to paste DATABASE_URL into chat.
- Never print DATABASE_URL.
- Never print database password.
- Never run `echo $DATABASE_URL`.
- Never write production DATABASE_URL to a tracked file.
- Never put secrets into command history when avoidable.
- Never use the old exposed credential.
- If DATABASE_URL is not available, instruct me to enter it privately into the current shell using a silent input method.

The local connection is an EXTERNAL Render PostgreSQL connection and must use the full valid External Database URL with TLS.

FIRST:

Verify runtime:

node --version
pnpm --version

Require:
Node 24.20.0
pnpm 11.25.0

If not correct, fix runtime before touching the DB.

SECOND:

Run the read-only database preflight.

Confirm this is the intended database by non-secret properties only:

- PostgreSQL 18
- expected database name
- expected current user
- qc.users current existence
- migrations state

If anything indicates this is not the intended Render DB:
STOP.

THIRD:

Before migration create a pre-migration evidence snapshot containing only metadata:

- schema names relevant to qc
- existing application table count
- migration ledger status

No sensitive row dumps.

FOURTH:

Run:

pnpm db:migrate

If ANY migration fails:
STOP immediately.
Do not manually mark it as applied.
Do not edit qc.schema_migrations manually.
Do not bypass checksums.
Diagnose root cause using systematic-debugging.

If successful run:

pnpm db:migrate:status
pnpm db:migrate:check
pnpm db:preflight

Verify:
- all expected migrations applied
- zero pending
- qc.users exists

FIFTH:

Run the canonical production foundation seed:

pnpm db:seed:foundation

Then:

pnpm db:seed:foundation:check

Require PASS.

SIXTH:

Do NOT create the admin until migration + foundation checks both PASS.

At completion report only:

DB CONNECTION: PASS/FAIL
MIGRATIONS: x/x
FOUNDATION: PASS/FAIL
qc.users: EXISTS/MISSING
ADMIN: NOT CREATED YET

No secrets.
```

---

# PROMPT 7 — إنشاء `yazeed` فعليًا على Render

بعد نجاح اللي فوق:

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-007

MISSION:
Create and verify the real initial administrator account on the initialized Render PostgreSQL database.

Target:

BOOTSTRAP_ADMIN_IDENTITY=yazeed
BOOTSTRAP_ADMIN_DISPLAY_NAME=Yazeed

The user will choose the password privately.

SECURITY:

Do NOT ask the user to type the password into Codex chat.
Do NOT put it directly in shell command arguments.
Do NOT echo it.
Do NOT save it in a tracked .env file.
Do NOT print password hash.

Use safe interactive shell input/environment handling.

Before bootstrap run:

pnpm db:migrate:check
pnpm db:seed:foundation:check
pnpm db:preflight

All must PASS.

Then privately collect/export:

BOOTSTRAP_ADMIN_IDENTITY
BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_DISPLAY_NAME

Optionally:
BOOTSTRAP_ADMIN_EMAIL

Run:

pnpm bootstrap:admin

Immediately run:

pnpm bootstrap:admin:check

Then query/read-only verify:

- exactly one user with login_identity yazeed
- account_state ACTIVE
- password_hash is populated
- ADMIN role assigned
- role not revoked
- GLOBAL scope assigned
- scope not revoked
- expected bootstrap audit events exist
- ADMIN effective authorization passes canonical permission checks

Do NOT display password_hash.

Then verify actual authentication through the application's authentication layer.

If a local production-like server can safely target Render:
test login using the secret without exposing it.

Otherwise provide the exact operator test procedure.

After successful bootstrap:
unset/remove local bootstrap secrets from current shell where practical.

Tell me explicitly which Render bootstrap environment variables should be removed after successful creation.

Final output:

ADMIN USER: PASS/FAIL
AUTHENTICATION: PASS/FAIL
ADMIN ROLE: PASS/FAIL
GLOBAL SCOPE: PASS/FAIL
AUTHORIZATION: PASS/FAIL
AUDIT: PASS/FAIL

Do not declare success unless all six are PASS.
```

---

# PROMPT 8 — ربط Web Service بـ Render DB وضبط Production

هنا نخلي الموقع نفسه يستخدم القاعدة الصح، مو بس الماك.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-008

MISSION:
Complete and verify the production Render Web Service configuration for QC Operations Laboratory Management System.

Do NOT expose or commit secrets.

Inspect:

render.yaml
src/config/*
health checks
database pool
authentication
sessions
rate limiting
production URL/canonical host configuration
deployment docs

Production Render Web Service requirements:

NODE_VERSION=24.20.0
NODE_ENV=production
DATABASE_URL=<Render INTERNAL DB URL where same-region private networking is available>
SESSION_SECRET=<secure random secret at least architecture-required length>
RATE_LIMIT_LOGIN_MAX=<approved value>
RATE_LIMIT_LOGIN_WINDOW_SECONDS=<approved value>

Optional observability settings only if actually configured.

Verify Render service and database region topology.
Prefer internal Render DB connectivity for the deployed service.

Do not use the External DB URL from production Web Service merely because it works.

Ensure the application startup does NOT automatically:
- migrate
- seed
- bootstrap admin

Those must remain explicit controlled operations.

Verify health:

/api/health/live
/api/health/ready

or canonical equivalents.

Readiness must correctly fail when required production dependencies are unavailable.

Verify:
- database connection
- migration status
- session configuration
- login rate limiting
- secure cookies
- canonical production host
- login flow

Check render.yaml against actual application requirements and repair configuration drift.

Do not add plaintext secret values to render.yaml.

Run full local verification:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm build

If repository has e2e tests:
pnpm test:e2e

Document the exact Render environment variables and whether each should use:
- literal non-secret value
- generated secret
- Render DB internal connection

At completion create/update:
docs/operations/RENDER-PRODUCTION-RUNBOOK.md
```

Render نفسه ينصح باستخدام **Internal URL** للخدمات الموجودة عنده في نفس المنطقة، والـExternal URL للاتصالات من خارج Render مثل جهازك. 

---

# PROMPT 9 — Security Closure

هذا مهم لأن الباسورد السابق ظهر، وعندك `0.0.0.0/0`.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-RECOVERY-009

MISSION:
Perform security closure after successful PostgreSQL initialization and admin bootstrap.

This task must NOT reveal secrets.

Verify and document:

1. The previously exposed Render PostgreSQL credential has been rotated.
Do not inspect or print the credential itself.

2. No leaked credential exists in:
- tracked files
- git diff
- .env.example
- render.yaml
- logs
- documentation
- generated reports

Search safely by patterns and report redacted locations only.

3. Review PostgreSQL inbound IP configuration.

Current known risk:
0.0.0.0/0 may allow external connection attempts from anywhere.

Recommend the minimum practical access after setup.

If local Mac access is no longer required:
recommend disabling/restricting external database access.

If local administrative access is still required:
document how to allow only the required IP/CIDR.

Do not modify Render dashboard networking unless you actually have an authorized supported integration.

4. Ensure Render production app uses the internal DB URL where appropriate.

5. Ensure bootstrap secrets are no longer retained after successful admin creation:

BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_IDENTITY
BOOTSTRAP_ADMIN_DISPLAY_NAME
BOOTSTRAP_ADMIN_EMAIL

Determine whether each should be removed.

6. Verify SESSION_SECRET is not reused as any database/admin credential.

7. Verify application logs cannot leak:
- DATABASE_URL
- passwords
- password hashes
- session tokens
- authorization headers

8. Verify git status and secret scans.

9. Run the project's complete security/test gates.

Produce:

docs/operations/POSTGRES-SECURITY-CLOSURE.md

with PASS/FAIL for every control.

Do not mark SECURITY CLOSED while any known exposed credential remains active.
```

Render يسمح افتراضيًا بالاتصال الخارجي حسب قواعد الـIP، وتقدر تقيد الوصول أو حتى توقف External access؛ الخدمات الداخلية بنفس المنطقة ما تعتمد على هالقواعد. 

---

# PROMPT 10 — الفحص النهائي الشامل

آخر واحد، وهذا خله ما يصدق أي شيء نفذه قبل.

```text
@Superpowers

TASK ID: QC-RENDER-POSTGRES-FINAL-CLOSURE-010

PRIORITY:
FINAL INDEPENDENT RE-VERIFICATION

MISSION:
Independently re-verify the complete PostgreSQL + Render + Authentication + Authorization recovery.

Do NOT trust previous task completion claims.

Only current reality counts.

Re-check from scratch:

A. TOOLCHAIN
- Node 24.20.0
- pnpm 11.25.0

B. DATABASE
- Render PostgreSQL reachable
- intended database confirmed
- PostgreSQL version supported
- qc schema exists

C. MIGRATIONS
- every repository migration accounted for
- every expected migration applied
- zero pending
- checksums valid
- repeat migration is idempotent

D. CORE TABLES
At minimum verify existence of:
- qc.users
- qc.sessions
- qc.roles
- qc.permissions
- qc.role_permissions
- qc.user_roles
- qc.user_scopes
- qc.audit_events
- all other domain tables expected by migrations

E. FOUNDATION
- canonical roles exist
- canonical permissions exist
- role grants match approved matrix
- foundation check PASS

F. ADMIN
For yazeed verify without exposing sensitive data:
- exactly one account
- ACTIVE
- ADMIN
- GLOBAL scope
- complete effective admin authorization
- bootstrap audit evidence

G. AUTH
- valid password authentication succeeds
- invalid password fails
- session creation works
- protected page/API blocks anonymous user
- ADMIN-protected function succeeds for yazeed
- rate limiting works

H. RENDER
- production DB connection model correct
- NODE_ENV production
- SESSION_SECRET configured
- required rate-limit env configured
- health readiness works
- build/start configuration correct

I. SECURITY
- old exposed DB credential no longer active according to available evidence/operator confirmation
- no plaintext credentials committed
- bootstrap password removed after use
- external DB exposure reviewed/restricted
- logs do not leak secrets

J. QUALITY GATES

Run:

pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm build

Run e2e if available.

Create:

docs/operations/POSTGRES-RENDER-FINAL-CLOSURE.md

Include an evidence matrix:

CONTROL | EXPECTED | ACTUAL | EVIDENCE | STATUS

Do not use fake percentages.

Final verdict must be exactly one of:

PRODUCTION DATABASE READY
PRODUCTION DATABASE NOT READY

If NOT READY:
list every remaining blocker with exact remediation commands/files.

If READY:
list the exact evidence proving:
empty Render PostgreSQL → migrations → foundation → admin → login → authorization → production application.
```

### الترتيب اللي أنصحك تمشي عليه

```text
001 Audit
   ↓
002 Runtime / Env
   ↓
003 Migration architecture
   ↓
004 Foundation / RBAC
   ↓
005 Admin bootstrap
   ↓
غيّر Render DB credential
   ↓
006 Real Render migration
   ↓
007 Real admin creation
   ↓
008 Web Service production
   ↓
009 Security closure
   ↓
010 Final independent verification
```

**لا تبدأ مباشرة بـ `pnpm db:migrate` على Render الآن.** خلي Luna أول يصلح ويختبر `003` و`004` خصوصًا؛ لأن المشكلة الأكبر مو بس `DATABASE_URL`، عندك تصميم صلاحيات PostgreSQL داخل migration + Foundation/RBAC لازم يثبت إنه صالح قبل ما تدخل تعديلات حقيقية على قاعدة الإنتاج.
# QC Operations & Laboratory Management System — Compact Project Mind

> آخر دمج: 2026-09-18  
> الغرض: ذاكرة تشغيلية قصيرة للوكيل، وليست بديلًا عن الكود أو الوثائق أو أدلة التدقيق.  
> **قاعدة التعارض:** الحالة الحالية والقرارات الثابتة في أعلى هذا الملف تتقدم على السجل التاريخي أدناه. السجل التاريخي للـtraceability فقط، ولا يعيد قرارًا ألغاه قرار أحدث.

## Current audit reality — 2026-09-18

- Exact current HEAD: `38528bd6ffd49b800057f58ac88612ca1b2af97f` on `main` (verified 2026-09-18). `QC-CLOSURE-006` + `QC-CLOSURE-007` are now committed; the working tree carries only the uncommitted `QC-RENDER-POSTGRES-VERIFY-001` changes (6 DB CLI entrypoints, `tests/integration/database/seeds.test.ts`, 2 new test files, 1 audit record). No commit, push, or deployment occurred. Migration source head is `0025_qc_closure_006_workflow`; it is applied locally but **not** on the Render database.
- Fresh local evidence on this HEAD + working tree: typecheck (`744 files`, 0 errors/0 warnings/67 hints), lint, build, architecture, unit (`79 files / 535 tests`), integration (`83 files / 326 tests`), migrations (`7 files / 26 tests`), concurrency (`12 tests`), security (`7 files / 51 tests`) are **PASS**. The PostgreSQL suites now run against the approved disposable PostgreSQL 18 cluster (`scripts/db/disposable-postgres.sh`), not Testcontainers.
- **Render PostgreSQL — VERIFIED (read-only):** `dpg-dadqmsgn74is73b774j0-a` is the Render **database** id (not the web-service id) and is the internal hostname label; app database `qc_operations`, principal `qc_operations_user`, PostgreSQL 18.6, region oregon, **free plan expiring `2026-10-05`**. Canonical pool connects with TLS 1.3 and session `search_path=qc,pg_catalog`, `TimeZone=UTC`; `/api/health/ready` is `200 healthy` both for the built app against this database and for live `https://qclevel.top`. Data is bootstrap-only (1 user, 2 role grants, 4 audit events, 0 lab tests).
- **Render migration gap (blocker):** the Render database is at applied head `0018` with `0019`–`0025` pending, so `db:schema:check` fails closed there while ledger checksums for all 18 applied rows verify. Applying them is **prohibited** until the credential-rotation gate in `docs/operations/RENDER-DATABASE-CONNECTION.md` is satisfied (the local Render export credential — the one in `.env` — is documented as compromised).
- **Render live service DIVERGES from `render.yaml`:** runtime `rust` (not `node`), empty `healthCheckPath` (not `/api/health/ready`), `autoDeployTrigger: commit` (not `checksPass`), and a start command that runs `pnpm access:grant-system-owner` before the server, i.e. authorization mutation during boot. `RELEASE_*` identity variables are absent and every deploy reports `commitId: null`, so the deployed release SHA is **NOT VERIFIED**. The Render subdomain is intentionally blocked (`x-render-routing: blocked-render-subdomain`); `qclevel.top` is the production entrypoint.
- Node locally is `v22.22.3`, outside the declared `>=24.20.0 <25` contract; local results are not runtime-parity evidence (the Render service pins `NODE_VERSION=24.20.0`). Docker/Testcontainers remains **unavailable**, so authenticated Playwright E2E is **NOT VERIFIED**; UAT remains unexecuted.
- GitHub `Verification CI` run `35284944134` for this exact HEAD is **FAIL** before any step (job `Verify`, 0 steps): GitHub annotation says, “The job was not started because your account is locked due to a billing issue.” This is an external account blocker, not a workflow/test failure; CI/E2E/release evidence remains **NOT VERIFIED**.
- Final independent audit decision remains `NO-GO`; details in `audit/100-percent/FINAL-100-DOMAIN-AUDIT.md` and `audit/100-percent/RELEASE-GATE-EVIDENCE.md`.

- **2026-09-18 — QC-RENDER-POSTGRES-VERIFY-001 / Render PostgreSQL connection, migration & service verification**
  - Changed: fixed the root cause that made every documented DB command ignore the local `.env` — `scripts/db/load-local-env.ts` exports `loadLocalEnv()` but 6 entrypoints imported it as a bare side effect (`import './load-local-env.js'`) that never ran; they now call `loadLocalEnv()` at the **CLI boundary** only, because `migrate()` is imported directly by integration suites with their own pools. Also made `tests/integration/database/seeds.test.ts` order-independent (it counted all `qc.role_permissions` on a database that persists across suites while comparing against system-role foundation counts).
  - Evidence: read-only Render verification via the canonical pool — PG 18.6, `qc_operations`, TLS 1.3, `search_path=qc,pg_catalog`, applied `0001`–`0018` / pending `0019`–`0025`, capability checks pass, 0 legacy-ownership conflicts. Controlled disposable PG 18 reached head `0025` (70 tables, 0 orphans). Readiness: `200 healthy` against the Render database, `503` when unreachable, `503` when `DATABASE_URL` is missing in production; live `https://qclevel.top/api/health/ready` `200 healthy`. Unit `79/535`, integration `83/326`, migrations `26`, concurrency `12`, security `51`, typecheck/lint/build/architecture PASS; secret scan of 16 logs: 0 hits. Migration to the Render database **not executed** (blocked by the credential-rotation gate). Record: `audit/2026-09-18-RENDER-POSTGRES-CONNECTION-VERIFICATION.md`.
  - State: PARTIAL — connectivity, schema truth and readiness proven; Render DB behind source head, provider config divergent, rotation gate open.
  - Key files: `scripts/db/{preflight,migrate,migration-status,check-migration-integrity,check-schema-integrity}.ts`, `scripts/recovery/validate-restored-database.ts`, `tests/unit/database/runtime-connection-contract.test.ts`, `tests/integration/database/connection-chain.test.ts`.
## [2026-09-18] — QC-CLOSURE-005 / PostgreSQL, migrations, transactions & integrity

- Changed: added `scripts/db/disposable-postgres.sh` (approved equivalent disposable PostgreSQL 18 environment for hosts without Docker) and an opt-in `{ tls: true }` mode on the shared test-container helper; fixed two runtime-proven product defects — `PERM-IDN-REVOKE-SESSIONS` had no policy-registry entry (so administrative session revocation was permanently `AUTHZ_DENIED`), and `ApproveReleaseUseCase` evaluated candidate state before idempotency replay (so retrying a committed approval failed with `DOMAIN_INVALID_TRANSITION` instead of replaying); replaced drifted hard-coded migration counts with expectations derived from `loadMigrations()`; corrected test-harness defects (container bypassing `QC_TEST_DATABASE_URL`, TLS-requiring operator script fed a non-TLS URL, Kysely `destroy()` ending the suite-owned pool); added two injected-failure atomicity proofs (release approval and role grant leave no half-committed state).
- Evidence: empty PG 18.6 → `0001…0024`, `pending []`, schema check 24/70/0 orphans; integration 80 files / 314 PASS (was 6 failed files), migrations 6 files / 22 PASS (was 3 failed), concurrency 12 PASS; static gates and `build` PASS. Details in `audit/2026-09-18-qc-closure-005-postgres-runtime-integrity.md`.
- State: PARTIAL — Docker/Testcontainers image path, authenticated E2E, UAT, CI and provider evidence remain unexecuted; Node 22 is outside contract.
- Key files: `scripts/db/disposable-postgres.sh`, `src/shared/authorization/policy-registry.ts`, `src/modules/release-governance/{ports/repository.ts,application/approve-release.ts,infrastructure/postgres-repository.ts}`, `tests/helpers/postgres-container.ts`.

## [2026-09-18] — QC-CLOSURE-001 / baseline, CI, and repository hygiene

- Changed: removed four tracked `.DS_Store` files; applied canonical Prettier output; removed two unused assignments/imports that made ESLint fail; added the required Git whitespace gate to canonical CI.
- Evidence: frozen install, format, lint, typecheck, architecture, tech-debt, unit `75/485`, build, release identity/verification, and both diff checks PASS; no tracked `.DS_Store` remains. Exact-head GitHub CI run `35284944134` has zero steps because the account is billing-locked.
- State: PARTIAL / BLOCKED (local repository defects closed; Node 22 mismatch, Docker-backed suites, authenticated E2E, and remote CI cannot be closed locally).

## [2026-09-18] — QC-SYSTEM-OWNER-YAZEED-FINAL-CLOSURE-005 / explicit role+scope admin, dialogs, stale UX

- Changed: added explicit incremental scope administration end to end (`assignUserScope` / `removeUserScope` port methods, transactional PostgreSQL implementation with canonical-owner `GLOBAL` protection, `AssignUserScopeUseCase` / `RemoveUserScopeUseCase`, Astro actions); replaced the replace-only scope UX with per-grant assign/remove plus a clearly-labelled bulk *Replace* inside `<details>`; rewrote `/admin/users/[userId]` with Profile / Account security / Roles / Scopes / Administrative control sections, capability-driven controls, `Protected` markers for canonical owner grants, and de-duplicated lifecycle controls; removed all native `confirm()`/`alert()` from the journey in favour of the shared `ConfirmDialog` + `src/ui/client/dialog.ts` (focus trap, focus return via opener registry, Escape blocked mid-submission, pending state, inline error region, stale refresh control); made the admin Action error boundary deterministic (`astroActionCodeFor` projects `ErrorCode` → Astro code, exact `ErrorCode` travels as the message) and taught the shared classifier the exact-code map plus a `DUPLICATE_COMMAND` state; added `STALE_VERSION_MESSAGE` with an explicit `Refresh record` path and no auto-retry; made `SCOPE_KINDS` the single canonical scope vocabulary for actions, pages, and persistence validation.
- Fixed regression: `ListUserRolesUseCase` authorized `PERM-ADM-ROLE-VIEW`/`VIEW` against entity type `USER`, which the policy registry does not declare (it is declared on `ROLE`), so role membership could never be read; it now uses the registered entity type. This means the pre-005 role list on the user-detail page was always restricted.
- Evidence: `pnpm typecheck` 0 errors; `tests/unit/admin` 65/65 PASS (3 new files: scope administration 17, role administration 6, error contract 14, plus existing guards). Not verified: full unit suite, lint, format, architecture, build, diff check, Playwright, PostgreSQL.
- State: PARTIAL / BLOCKED (source-level closure only).
- Key files: `src/modules/administration/application/{assign-user-scope,remove-user-scope}.ts`, `src/modules/administration/infrastructure/postgres-authorization-repository.ts`, `src/actions/admin.ts`, `src/pages/admin/users/[userId].astro`, `src/ui/components/feedback/ConfirmDialog.astro`, `src/ui/client/dialog.ts`, `src/ui/forms/admin-mutation-copy.ts`, `src/shared/errors/action-error-code.ts`.
- Not done in this task: dedicated Playwright spec, accessibility-spec extension, PostgreSQL integration tests, `SYSTEM-OWNER-DATA-CONTROL-MATRIX.md` classification refresh.

## [2026-09-17] — QC-SYSTEM-OWNER-CROSS-DOMAIN-CONTROL-005 / executable task retirement path

- Changed: added server-authorized draft-task deletion with dependency guard, optimistic concurrency, and transactional audit tombstone; refreshed the system-owner matrix with the exact permission and invariants.
- Evidence: focused administration suite `18/18 PASS`; typecheck has one error in unrelated untracked `scripts/access/check-system-owner 2.ts`; PostgreSQL 18 integration remains `BLOCKED` because Docker is unavailable.
- State: PARTIAL / BLOCKED.
- Key files: `src/modules/tasks/application/delete-draft.ts`, `src/modules/tasks/infrastructure/postgres-repository.ts`, `src/actions/tasks.ts`, `audit/system-owner/SYSTEM-OWNER-DATA-CONTROL-MATRIX.md`.

## [2026-09-17] — QC-SYSTEM-OWNER-ADMIN-UI-006 / identity administration UI

- Changed: wired users list role/scope summaries, authoritative role and initial-scope selection into atomic user creation, and user-detail profile/security/role/scope surfaces with capability-gated activate, disable, revoke-session, and protected-owner indicators.
- Evidence: `pnpm typecheck` 0 errors, unit `72 files / 442 PASS`, architecture/build/diff checks PASS; authenticated E2E and PostgreSQL remain BLOCKED without disposable runtime.
- State: PARTIAL / BLOCKED.
- Key files: `src/pages/admin/users/index.astro`, `src/pages/admin/users/new.astro`, `src/pages/admin/users/[userId].astro`.

## [2026-09-17] — QC-SYSTEM-OWNER-YAZEED-FULL-CONTROL-004 / scopes, provisioning, lifecycle

- Changed: added activation and explicit session-revocation use cases/actions, protected canonical owner GLOBAL scope, added transactional PostgreSQL user provisioning with role/scope validation and audit, and expanded the data-control matrix with explicit statuses.
- Evidence: focused administration suite `18/18 PASS`; typecheck PASS; PostgreSQL 18 execution BLOCKED because Docker Desktop is unavailable.
- State: PARTIAL / BLOCKED.
- Key files: `src/modules/identity/application/activate-user.ts`, `src/modules/identity/application/revoke-user-sessions.ts`, `src/modules/identity/infrastructure/postgres-user-repository.ts`, `src/modules/administration/infrastructure/postgres-authorization-repository.ts`.

## [2026-09-17] — QC-SYSTEM-OWNER-YAZEED-FULL-CONTROL-003 / role administration

- Changed: added server-side list/assign/remove user-role use cases, PostgreSQL transaction-backed repository methods, Astro actions, and preserved owner/password invariants.
- Evidence: focused administration/authorization `18/18 PASS`; typecheck and targeted ESLint PASS; PostgreSQL 18/Testcontainers remains BLOCKED because Docker Desktop is unavailable.
- State: PARTIAL / BLOCKED.
- Key files: `src/modules/administration/application/list-user-roles.ts`, `src/modules/administration/application/manage-user-role.ts`, `src/modules/administration/infrastructure/postgres-authorization-repository.ts`, `src/actions/admin.ts`.

## [2026-09-17] — QC-SYSTEM-OWNER-YAZEED-FULL-CONTROL-002 / permission drift and data-control inventory

- Changed: added read-only `system-owner:check` / `system-owner:reconcile` scripts and a persisted-domain control matrix; password-reset semantics from task 001 remain intact.
- Evidence: typecheck PASS; focused administration tests PASS; PostgreSQL 18/Testcontainers BLOCKED because Docker Desktop is unavailable.
- State: PARTIAL / BLOCKED.
- Key files: `scripts/access/check-system-owner.ts`, `audit/system-owner/SYSTEM-OWNER-DATA-CONTROL-MATRIX.md`.

## [2026-09-17] — QC-SYSTEM-OWNER-YAZEED-FULL-CONTROL-001 / initial owner-control correction

- Changed: administrative password reset now persists `must_change_password = true`; ordinary self-password changes keep it false.
- Evidence: targeted typecheck/unit pending; Docker Desktop is not installed and PostgreSQL runtime remains unavailable.
- State: PARTIAL / BLOCKED.
- Key files: `src/modules/identity/application/admin-reset-password.ts`, `src/modules/identity/infrastructure/postgres-user-repository.ts`.

## [2026-09-17] — QC-ULTIMATE-SYSTEM-CLOSURE-FINAL / Independent 100-domain final verification

- Changed: Added fresh current-HEAD freeze, 100-row evidence matrix, claims-vs-reality, file coverage, release-gate evidence, skill usage, and unresolved blocker records.
- Evidence: 72/442 unit PASS; architecture/typecheck/build PASS; lint/format FAIL; CI/E2E/UAT/restore/provider/database runtime unavailable or unverified; `.DS_Store` tracked.
- State: BLOCKED / NO-GO.
- Key files: `audit/100-percent/FINAL-100-DOMAIN-AUDIT.md`, `audit/100-percent/RELEASE-GATE-EVIDENCE.md`, `audit/100-percent/unresolved-blockers.md`.

> ## 1) قواعد القراءة والتنفيذ

>- اقرأ هذا الملف أولًا لفهم الوضع الحالي، ثم ارجع إلى الكود والوثائق المعتمدة عند التنفيذ.
>- عند التعارض: الكود الحالي + الوثائق المعتمدة + الأدلة الطازجة على نفس HEAD تتقدم على وصف تاريخي قديم.
>- لا تحول نتيجة محلية أو static audit إلى claim عن production/UAT/live behavior.
>- لا تعتبر `PASS` في الفحص مساويًا لـ`RELEASED`; نتيجة الفحص وحالة الإفراج منفصلتان.
>- الأفعال الحساسة تبقى server-authorized وتخضع حسب المسار إلى permission + scope + state + SoD + expected version + business/scientific rules + reauthentication/e-signature عند الحاجة.
>- لا تعتمد بيانات هوية/بوابات/مخاطر قادمة من المتصفح كحقيقة إصدار أو اعتماد.
>- لا commit أو push أو deploy من الوكيل إلا بطلب صريح.
>- Render هو مسار نشر Astro SSR. GitHub Pages/Jekyll ليس هدف نشر التطبيق.

## [2026-09-17] — QC-CLOSURE-POLICY-009: Canonical policy closure matrix

- أضيفت `audit/100-percent/POLICY-CLOSURE-MATRIX.md` كمرجع واحد لـPD-01–PD-37 مع الحقول المطلوبة، والتصنيف `CLOSED/PARTIAL/OPEN/BLOCKED`، وسير controlled configuration/data دون اختراع قيم.
- أُغلقت كقرارات سياسة فقط: P-05 authority slices لـPD-08/09/10، وP-06 دورة حياة القوالب، وP-07 سلطة Production Release النهائية. بقيت أدلة UAT/provider/runtime منفصلة وغير مغلقة.
- حُذفت الحالات الميتة المقابلة من BUSINESS-RULES/PERMISSION-MATRIX/ROLE-MATRIX/STATE-MACHINES/REQUIREMENTS-TRACEABILITY/PRODUCTION-READINESS-CHECKLIST، مع إبقاء التوقيع العام وSoD/QMS/scientific/provider decisions مفتوحة.
- التحقق: targeted unit `43/43 PASS` (3 ملفات)، و`test:architecture` PASS؛ Node المحلي `v22.22.3` ما زال خارج العقد `>=24.20.0 <25`.
- الحالة: PARTIAL — matrix/document closure completed; R-007 remains OPEN for unresolved QMS/provider/data-instance items and live evidence.


## [2026-09-17] — QC-CLOSURE-DR-008: Current-HEAD restore and disaster recovery evidence

### تم التنفيذ
- ثبّتُّ الواقع الحالي على HEAD `54d4fd3320bc9f35631f5bdb0a816e53b8bb2a01`، الإصدار `0.1.0`، وهوية build الاختبار `rel-ebb1253bf3af841e`، وmigration head `0023_uat_evidence` مع checksum `a1ff60a7dbffbc8906b3f648f88a50bbeb96e63e45de8d4b8169f4235d1b2fd6`.
- أحصيت 23 migration source files و70 تعريف جدول static من ملفات migrations؛ هذا ليس live schema/table count.
- حاولت بدء مسار restore الحالي، وتأكد أن Docker daemon غير متوفر وأن أدوات `pg_dump` المحلية PostgreSQL 14.19، لذلك لم يُنشأ backup artifact ولم تُزرع controlled dataset ولم تُنفذ restore.
- حدّثت سجل `RER-2026-09-17-008` بمراحل التجميد، manifest المطلوب، negative tests، application compatibility، وprovider capability status بدون اختراع backup ID أو SHA أو parity.
- حدّثت DR evidence matrix لتربط الحالة بالـcurrent HEAD وتبقي gates المعتمدة `BLOCKED/UNVERIFIED`.

### الملفات المتأثرة
- `audit/100-percent/RESTORE-DRILL-RESULT.md`
- `audit/100-percent/DR-EVIDENCE-MATRIX.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm release:identity -- --environment test ...` ✅؛ حذّر فقط أن Node `v22.22.3` خارج عقد المشروع `>=24.20.0 <25`.
- `pnpm exec vitest run tests/unit/recovery/recovery-tooling.test.ts tests/unit/backup-recovery/manifest.test.ts tests/unit/backup-recovery/backup-job.test.ts` ✅؛ 3 ملفات / 10 اختبارات.
- `pnpm test:architecture` ✅.
- `pnpm build` ✅؛ مع تحذير engine السابق وتحذيرات Rollup من تعليقات dependency.
- `pnpm recovery:restore:monthly` لم يُنفذ كـdrill؛ السكربت رفض قبل التشغيل، وDocker API غير متاح.
- PostgreSQL 18/Testcontainers و`pg_dump`/`pg_restore` الفعلي وHTTP auth/read workflows لم تُشغّل: runtime معزول مطابق غير متوفر.

### النتيجة
- **الحالة:** جزئي / BLOCKED
- **مختصر:** تم تحديث الأدلة على exact current HEAD فقط، لكن logical restore scope المثبت في هذا السجل = لا شيء؛ المطلوب التالي هو توفير disposable PostgreSQL 18 runtime ثم إعادة Phase 2–5 فعليًا. Provider backup/WAL/PITR/retention/cross-region/object/secret recovery وRPO/RTO بقيت `BLOCKED/UNVERIFIED`.

### ملاحظات / مشاكل مفتوحة
- لا يوجد أي اتصال production ولا backup artifact أو dataset restored.
- لا يُسمح بترقية هذا السجل إلى `ACCEPTED` أو `RESTORE VERIFIED` قبل artifact حقيقي وisolated restore واختبارات التطبيق والأمن.


## [2026-09-17] — QC-CLOSURE-UAT-007: تجهيز UAT المضبوط وربط أدلة القبول

### تم التنفيذ
- أضيفت migration `0023_uat_evidence` لتخزين دورات UAT والجلسات والعيوب والقبول الموقّع server-side، مع ربط القبول بإعادة التحقق، الموقّع المخوّل، و`electronic_signatures` وsnapshot hash.
- توسعت مصفوفة التغطية والـkit لتشمل Change Request، File/Evidence، Notifications/Handoffs، Session expiry/recovery، Error/Stale/Conflict recovery، وProduction Release approval UX، إضافة إلى المسارات المطلوبة السابقة.
- شُدد `validate-uat-records.mjs` بعقد CSV مقتبس آمن، تطابق header حرفيًا، SHA كامل ومطابق، بيئة/دور/سيناريو allowlist، منع التكرار، تحقق كل العدادات والـconfidence والـsequence، ومطابقة مدة المهمة للوقت الفعلي.
- أضيف template مستقل لـUAT cycle يترك release/participant/signature بلا قيم، ويبقي الحالة `UNVERIFIED`/`BLOCKED` حتى وجود جلسات بشرية وتوقيع حقيقي.
- وثقت الخطة صراحة أن CSV أو screenshot وحده لا يرفع Release Governance إلى `SIGNED_UAT_CYCLE`، وأن أي تغيير controlled behavior يبطل evidence السابق ويحتاج re-scope/retest.

### الملفات المتأثرة
- `db/migrations/0023_uat_evidence.sql`
- `src/shared/database/db-types.ts`
- `audit/100-percent/uat/UAT-COVERAGE-MATRIX.csv`
- `audit/100-percent/uat/UAT-SESSION-RECORD.csv`
- `audit/100-percent/uat/UAT-DEFECT-BACKLOG.csv`
- `audit/100-percent/uat/validate-uat-records.mjs`
- `audit/100-percent/uat/UAT-CYCLE-MANIFEST.template.json`
- `audit/100-percent/QC-100-CLOSURE-06-UAT-KIT.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`

### التحقق
- `pnpm exec vitest run tests/unit/uat/uat-record-validator.test.ts` ✅ 6/6
- `pnpm test:architecture` ✅
- `pnpm typecheck` ✅ 0 errors؛ warnings/hints موجودة سابقًا
- `pnpm exec prettier --check ...` ✅
- validator على `UAT-SESSION-RECORD.csv` ✅ header صالح، `sessions=0`، وخرج `UAT EXECUTION REQUIRED`
- PostgreSQL/Testcontainers/integration لم تُشغّل: Docker runtime غير متوفر على المضيف

### النتيجة
- **الحالة:** جزئي
- **مختصر:** إطار UAT وأدلة القبول المخزنة صاروا جاهزين للتنفيذ، لكن لا توجد جلسات بشرية أو قبول/توقيع حقيقي؛ لذلك UAT تبقى `UNVERIFIED/BLOCKED` وR-005 لا يُغلق.

### ملاحظات / مشاكل مفتوحة
- المطلوب المتبقي للبشر: نشر نفس release المرشح في test/staging، إدخال مشاركين QC/Laboratory حقيقيين، تنفيذ السيناريوهات، تسجيل كل المقاييس والعيوب، ثم توقيع الدورة من authority مخوّلة بعد reauthentication.
- Node المحلي `v22.22.3` خارج عقد المشروع `>=24.20.0 <25`، لذلك لا تُعامل نتائج التحقق الحالية كدليل بيئة التشغيل النهائية.


## 2) الحالة الحالية — 2026-09-17

### الإغلاق والتحقق
- `astro check` و`astro build` و`format/lint/typecheck/architecture/unit` أصبحت خضراء في آخر جولة قابلة للتشغيل محليًا؛ `pnpm test:unit` وصل إلى 72 ملفًا / 440 اختبارًا ناجحًا.
- security-focused: 6 ملفات / 38 اختبارًا ناجحًا.
- PostgreSQL/Testcontainers/integration/migrations/concurrency ما زالت محجوبة محليًا لأن Docker runtime غير متوفر.
- authenticated critical E2E suite والـdisposable runner جاهزان، لكن التنفيذ الفعلي **BLOCKED** قبل الرحلات المصادق عليها بسبب غياب Docker/PostgreSQL 18 runtime.
- GitHub exact-HEAD GREEN غير مثبت: Verification CI لم يعمل بسبب billing lock؛ GitHub Pages/Jekyll فشل كمسار خارجي غير مستهدف.
- الدليل الحالي engineering evidence فقط؛ `uatClaim: false`. لا يوجد أساس لادعاء UAT أو production readiness.
- آخر runner/evidence مسجل: release `rel-7a5fb92d651ccd42`, git SHA `beeefde6369016f55223df22d482f601325f4a75`, build `qc-closure-beeefde63690`, migration head `0022_server_release_evidence`; هذا **ليس PASS تشغيليًا** لأن الرحلات المصادق عليها لم تُنفذ.
- بيئة Node المحلية الأخيرة `v22.23.1` بينما عقد المشروع `>=24.20.0 <25`; لا تعتبر نتائج Node 22 ممثلة بالكامل لعقد التشغيل.
- pnpm المستخدم في جولة CI: `11.25.0`.

### ما يلزم لإغلاق التحقق
- تشغيل `pnpm verify:e2e:authenticated` على host/CI فيه Docker مع PostgreSQL 18 ومتغيرات كلمات مرور disposable المطلوبة.
- تشغيل integration/migrations/concurrency على نفس بيئة العقد ونفس HEAD.
- حل GitHub billing lock ثم تشغيل Verification CI على نفس SHA.
- تعطيل GitHub Pages من Settings → Pages إذا كان مفعّلًا خارجيًا.
- توفير ingestion موثوق لأدلة CI/Security/E2E/UAT بدل أي browser-controlled evidence.
- تنفيذ UAT منفصل إذا كان المطلوب claim UAT؛ E2E الهندسي لا يحل محله.

## 3) الهوية والتفويض — قرارات ثابتة

### Actor / SYSTEM_OWNER
- `ActorContext` يفرق بين `id` الداخلي الثابت و`loginIdentity`.
- `resolveActor` يشتق الهوية من صف `users` المصادق عليه خادميًا.
- المالك المسمى ينجح فقط إذا كان الحساب `ACTIVE` ودوره `SYSTEM_OWNER` و`loginIdentity === 'yazeed'`.
- لا تعتمد المسارات الحساسة على `actor.id === 'yazeed'`.
- `grant-system-owner` مقفول على الهوية القانونية `yazeed` مع حماية المالك الوحيد.
- `loginIdentity` ما زال اختياريًا في type لتوافق test doubles قديمة، لكن المسارات السلطوية ترفض غيابه.

### Protected grants + explicit scope administration (owner-005, 2026-09-18)
- الحماية على مستوى المنحة لا على مستوى الفاعل: `isProtectedOwnerRoleGrant` (yazeed + SYSTEM_OWNER) و`isProtectedOwnerScope` (yazeed + GLOBAL) هما المصدر الواحد للـUI وللـpersistence.
- `removeUserRole` و`removeUserScope` يرفضان إزالة منحة المالك القانوني حتى لو كان الطالب يملك `PERM-ADM-ROLE-ASSIGN` أو `PERM-ADM-SCOPE-ASSIGN`؛ الإخفاء في الواجهة ليس الضمان.
- إدارة النطاقات صارت incremental: `assignUserScope` / `removeUserScope` (Use Cases + actions) وتعدّل منحة واحدة فقط. `manageUserScopes` / `replaceUserScopes` باقيان للـbulk والـatomic provisioning فقط، وليسا المسار التفاعلي الوحيد.
- Assign idempotent (لا تكرار سجل/تدقيق)، وRemove على منحة غير موجودة no-op محدد بلا تدقيق؛ كل ذلك داخل transaction مع `ASSIGN_USER_SCOPE` / `REMOVE_USER_SCOPE` audit.
- `SCOPE_KINDS` في `src/shared/authorization/types.ts` هو المفردات القانونية الوحيدة (تُستهلك في actions/pages/persistence)؛ `normalizeScopeValue` يفرض القيمة على TEAM/DEPARTMENT/SITE/DOMAIN ويمنعها على GLOBAL.
- جدولا `user_roles` و`user_scopes` بلا version column، فلا يوجد expectedVersion عليهما؛ optimistic concurrency يبقى على `users` (profile/activate/disable/reset password) ولا يُخترع فحص وهمي.
- لا يجوز مصادقة use case على permission مسجّل بنوع كيان مختلف؛ `PERM-ADM-ROLE-VIEW`+VIEW مسجّل على `ROLE` (كان bug في `ListUserRolesUseCase`).
- كل permission معتمد يجب أن يملك سياسة مسجّلة في `policy-registry.ts`؛ `PERM-IDN-REVOKE-SESSIONS` كان غائبًا تمامًا فكان `RevokeUserSessionsUseCase` مرفوضًا دائمًا بـ`AUTHZ_DENIED`. السياسة الحالية: `REVOKE_SESSIONS` على `USER` بحالات `ACTIVE`/`INACTIVE`/`DISABLED`.

### Operational visibility
- كل صفحة تطبيق عادية ظاهرة وقابلة للفتح لأي حساب `ACTIVE` ومصادق؛ التنقل يستهلك قرار رؤية المسار نفسه، وليس permissions الخاصة بالـmutation.
- القراءة العامة لا تعطي حق mutation؛ الإنشاء/التعديل/المراجعة/الاعتماد/الإفراج/VOID/الاستعادة/التوقيع تبقى محكومة خادميًا بالسياسات.
- مسارات الإدارة والقوالب تعرض projections آمنة للقراءة فقط؛ كلمات المرور وhashes والجلسات والأسرار وبيانات أمن الهوية والتشخيصات الخام ليست ضمنها.
- `pageAccessDecision` هو الحارس المركزي: `/system/health` هي `YAZEED_ONLY` وتُرفض خادميًا لغير الحساب `ACTIVE` ذي `SYSTEM_OWNER` و`loginIdentity === 'yazeed'`؛ دور SYSTEM_OWNER غير القانوني لا يكفي.

### P-05 authority
- سلطات P-05 الأساسية: Supervisor وManager و`yazeed`/SYSTEM_OWNER المسمى؛ Admin-only مرفوض.
- تغطي حسب السياسة الحالية inspection/lab/release/retest/document approval وعمليات VOID المرتبطة، مع بقاء state/permission/SoD/version checks.
- لا تستنتج سلطة من role label وحده إذا كانت use case تتطلب permission أو ceremony إضافية.

### P-04 CAPA close
- إغلاق CAPA الاستثنائي: Supervisor فقط مع `PERM-CAPA-CLOSE` + ACTIVE + scope/version + reason + reauthentication + e-signature.
- `ACTIONS_COMPLETE` ومراجعة الفعالية تبقى مطلوبة.
- المسار العام للـtransition لا يجوز أن يتجاوز مراسم `CloseCapaUseCase`.

## 4) Release Governance

- browser لا يرسل حقيقة PASS أو risk acceptance أو هوية إصدار موثوقة.
- Action الاعتماد يقبل فقط مدخلات المستخدم اللازمة، بينما الأدلة والهوية والمخاطر تُشتق/تُقرأ خادميًا.
- migration `0022_server_release_evidence.sql` أضافت `release_gate_evidence` و`release_risk_evidence` كسجلات append-only مرتبطة بهوية الإصدار.
- الأدلة غير الموثوقة/الناقصة/القديمة/الموقعة لإصدار آخر أو UAT غير الموقع تتحول إلى `UNVERIFIED` fail-closed.
- صفحة `/governance/releases/[releaseId]` read-only للأدلة؛ لا checkboxes أو risk JSON قابل للتحرير.
- قبل الاعتماد يعاد القفل والقراءة `FOR UPDATE` وإعادة الاشتقاق داخل transaction؛ أي اختلاف snapshot يرفض العملية.
- إعادة إرسال نفس `requestId` للاعتماد تُحلّ **قبل** أي فحص state/version/authority وتُعيد النتيجة المخزّنة؛ نفس المعرّف بمحتوى مختلف يفشل بـ`CONFLICT_DUPLICATE_COMMAND`.
- سلطة الاعتماد النهائي حسب السياسة المنفذة: Manager أو `yazeed`/SYSTEM_OWNER المسمى؛ Admin-only ليس سلطة اعتماد.
- P-07 هو القرار الحالي المعتمد لهذه السلطة: Manager OR named `yazeed/SYSTEM_OWNER`, one signer; هذا إغلاق لقرار السلطة فقط وليس دليل Production/UAT/provider.
- لا يوجد حتى الآن provider-ingestion خارجي مكتمل لـCI/Security/E2E/UAT؛ هذه فجوة integration وليست وظيفة المتصفح.

## 5) Quarantine / Inspection Templates

- دورة P-06 موجودة في `src/modules/quarantine/templates`.
- Employee يقدر ينشئ `DRAFT`; سلطات القوالب المعتمدة تقدر تنشئ/تراجع/تعتمد حسب السياسة.
- سلطة القوالب الحالية محصورة في Supervisor وManager و`yazeed`؛ Admin أو SYSTEM_OWNER غير المسمى مرفوض.
- stop/void/supersede تتطلب reason + reauthentication + signature حسب المسار.
- التفتيش يأخذ snapshot للقالب عند بدء التنفيذ، والقراءة التاريخية تستخدم snapshot بدل حالة القالب الحالية.
- snapshot يحفظ template/version/context/hash بحيث STOP/SUPERSEDE لا يغير معنى تنفيذ تاريخي.
- RD-019 الخاص باعتماد WI/SOP لم يُغلق ضمن هذا العمل.
- P-06 authority/lifecycle policy مغلق كقرار مالك ومربوط بالوثائق والكود والاختبارات؛ live PostgreSQL/UAT evidence ما زال BLOCKED.
- P-05 يحسم authority role set لـreceiving release/inspection/lab approval إلى Supervisor/Manager/named yazeed مع explicit permission؛ release signature scope يبقى PD-32.
- إثبات PostgreSQL الحي لسلسلة snapshot/audit/signature ما زال يحتاج Testcontainers/runtime.
- QC-CLOSURE-006 يثبت عقود receiving supplier وinspection assignment وsource/evidence linkage/count وreceiving history؛ Submit يرفض التفتيش بلا evidence نشط، وReject قرار workflow مستقل عن النتيجة العلمية FAIL. الإثبات الحي لقاعدة البيانات ما زال BLOCKED.

## 6) Inspection / Laboratory / Release invariants

- `Inspection Result` و`Release System State` حالتان منفصلتان؛ `PASS ≠ RELEASED`.
- Laboratory state machine is fully implemented for Create/Save/Submit/Review/Return/Resume/Approve/**Reject**; `VOID` (TR-LAB-008) remains unimplemented and policy-denied.
- Lab reject (TR-LAB-007) is fail-closed by policy: the transition, reason, dual permission (`PERM-LAB-REJECT` + `PERM-APR-REJECT`), SoD, expected version and P-05 authority are enforced, but the reject **decision authority source does not exist** → default `LabRejectPolicy` throws `POLICY_SOURCE_REQUIRED` (PD-38 OPEN). Reject never changes `scientificResult` and preserves measurements/samples.
- Scientific evaluation stays server-side only: `PostgresControlledLabSources.evaluate()` throws; `PASS`/`FAIL`/`HOLD` are stored only from an injected server evaluator whose `sourceReference`/`contentHash` must match the frozen context. No limit, unit, formula, tolerance or method was invented.
- Equipment eligibility is verified fail-closed at Submit: equipment `ACTIVE`, calibration `CURRENT` + linked + not overdue, and equipment/calibration snapshots must match the referenced records.
- لا تربط نجاح inspection تلقائيًا بإفراج النظام.
- مسار release يفرض SoD مشتقًا خادميًا بين منفذ التفتيش ومنفذ الإفراج، ويعيد الطلب المكرر بعد نجاحه عبر idempotency؛ لا يوجد بعد دليل runtime مطبق للـmigration الجديدة.
- Laboratory retest يخضع للسياسة/السلطة المطبقة ولا تُخترع limits غير موجودة في الوثائق.
- Finding/NCR/CAPA/VOID تبقى مرتبطة بآلات الحالة والأدلة والتوقيعات المعتمدة.
- أي handoff أو Journey Context هو read context؛ لا ينقل ملكية mutation بين الدومينات.

## 7) Change Requests / Documents

- إنشاء Change Request لنوع `DOCUMENT_VERSION` صار contextual؛ لا تعرض UUID/JSON/fieldPath/dataType كمدخلات تشغيلية للمستخدم.
- allowlist الحالية للحقول: `revision`, `changeSummary`, `contentHash` فقط.
- `targetId/version/snapshot/currentValue/dataType` تُشتق خادميًا.
- مستودع الإنشاء يعيد قراءة النسخة `FOR UPDATE` ويرفض stale version.
- الموافقات على الوثائق وتفعيل النسخ تبقى حسب P-05/state/version/signature rules.
- Document Version/Approval/Change Request مرتبطة بعقد Journey Context/Handoff read-only وسجل Audit.

## 8) Backup / Recovery

- F-11 ما زال `OPEN / PARTIAL`.
- الإعدادات الاختيارية لـR2 موجودة بدون أسرار، ويوجد backup job محلي fail-closed وPostgres recovery evidence append-only.
- واجهة Backups تعرض **أهداف** RPO=24h وRTO=4h؛ لا تعتبرها قياسات محققة.
- restore drill يجب أن يكون على target معزول صريح.
- catalog wiring الكامل + artifact حي + restore drill حي على نفس release لم تُثبت بعد.
- Production Recovery authorization تستخدم الهوية server-derived للمالك المسمى؛ لا تمنح Admin سلطة استعادة تلقائيًا.

## 9) Health / Audit / Data truthfulness

### Database readiness
- `/api/health/ready` و`/system/health` يستخدمان فحص قاعدة بيانات canonical واحد ونفس TLS config.
- `sslmode=disable` مرفوض؛ لا تُسرّب host/secret/exception raw.
- failure يتحول إلى حالات منقحة مثل `false` / `UNAVAILABLE` / `503`.

### Audit
- `audit-query.ts` هو العقد المعتمد للفلترة والترقيم والترتيب والمapping.
- لا تختار أو تعرض `payload` الخام عبر read model.
- Dashboard activity و`/audit` يستخدمان mapping/ordering متوافقين ضمن اختلافات التفويض المقصودة.
- لا تحوّل provider unavailable إلى empty/zero.

### Dashboard
- Dashboard decision surface يعرض metadata/source/window/drill-down للـKPI.
- إذا provider غير متاح، تُحجب الادعاءات بدل عرض صفر مضلل.
- لا chart للـtrend حتى يوفر backend time series معرفة ومعتمدة.
- overdue/calibration risk/lab workload/blocked reasons/trend تحتاج read models خادمية قبل تقديمها كحقائق.

## 10) UI / UX / Accessibility

### Language/copy
- الواجهة الحالية English-only, `lang="en"`, LTR.
- الأفعال والعناوين تستخدم sentence case.
- المصطلحات المنظمة مثل NCR/CAPA/PASS/RELEASED لا يُعاد تعريف معناها.
- UX vocabulary المشترك موجود في `src/shared/copy/ux-vocabulary.ts`.

### Mutation UX
- نماذج الإنشاء الرئيسية تملك POST baseline حقيقي وتعمل بدون JavaScript؛ JS enhancement فقط.
- مسار إدارة الأعضاء (owner-005): كل فعل له control واحد canonical، والفشل لا يُختزل في رسالة واحدة — `astroActionCodeFor` يضبط كود Astro بينما `ErrorCode` الدقيق يمرّ كـmessage، ويصنّفه `classifyActionResult` عبر خريطة exact-code إلى `VALIDATION_ERROR` / `CONFLICT_STALE` / `DUPLICATE_COMMAND` / `AUTHORIZATION_CHANGED` / `DEPENDENCY_UNAVAILABLE` / `UNKNOWN_SAFE_ERROR`.
- stale version له UX صريح: `STALE_VERSION_MESSAGE` + زر `Refresh record`، ولا يوجد auto-retry للنية القديمة على data أحدث. `role/scope` لا تحمل version فلا تعرض رسالة stale مُختلقة.
- لا native `confirm()`/`alert()` في مسار الإدارة؛ الحوارات تمر عبر `ConfirmDialog.astro` + `src/ui/client/dialog.ts` (native `<dialog showModal>` للـfocus trap، opener registry لرجوع focus، Escape لا يُغلق أثناء submission، pending + error region + stale refresh). إتاحة الأزرار 44px والمناطق role=status/role=alert مفصولة.
- الأخطاء مرئية ومترابطة مع الحقول، القيم تُحفظ بعد الفشل، النجاح `303` إلى record id مفحوص.
- لا SQL أو business rules داخل الصفحات.
- dialogs/pagination/sort primitives نضجت محليًا، لكن التوصيل الكامل لكل route families يحتاج استمرار تدريجي.

### Accessibility / responsive
- توجد حراسة static/unit لـWCAG fundamentals: landmarks/skip nav/focus/error summary/status semantics/drawer isolation/reduced motion/forced colors وغيرها.
- fixes مؤكدة: loading `role=status`, notification severity نصيًا، forced-colors contract، drawer inert/focus behavior، reflow guards.
- responsive E2E matrix صُممت لـ320/375/414/768/1024/1440 + landscape + LTR/RTL + 200% + text spacing + density.
- live authenticated matrix وVoiceOver/NVDA/axe/320px/200% الشاملة ما زالت **NOT VERIFIED** على نفس current build.
- لا claim امتثال WCAG 2.2 AA كامل.

### Motion/backgrounds
- `/login` له `QCLogin3DBackground` مستقل؛ `systemBackground={false}`.
- authenticated workspaces تستخدم `SystemBackground` مع `background.lottie` المحلي عبر `@lottiefiles/dotlottie-web@0.80.0`.
- WASM محلي `/assets/dotlottie-player.wasm`; لا CDN ولا توسيع CSP بـ`unsafe-inline`/`unsafe-eval`.
- gradient veil fallback يبقى عند reduced-motion/load/render/WASM failure.
- renderer lazy، DPR محدود، cleanup عبر `destroy()`/`pagehide`, `pointer-events:none`, `aria-hidden`.
- Lottie metadata/asset غير مستخدم موجود داخل المصدر؛ تنظيف الحاوية نفسها قرار asset-pipeline مستقل.
- performance live CPU/GPU/heap/Web Vitals ما زالت تحتاج evidence حية.

## 11) Product Analytics / Service Design

### Product Analytics
- توجد طبقة داخلية allowlisted وprivacy-safe.
- تمنع query/userId/recordId/credentials/raw QC content.
- search events المطبقة: `search.submitted`, `search.zero_result`, `form.validation_failed` عبر buckets بدون تخزين نص البحث.
- hand-off عبر outbox `PRODUCT_ANALYTICS_EVENT`; ليس Audit ولا business state.
- exporter/dashboard/retention الرسمي والتغطية خارج البحث ما زالت pending.

### Journey/Handoffs
- `JourneyContextPanel` و`HandoffTimeline` يعرضان current state/next action/owner/wait/dependency/evidence/audit links.
- Receiving, Inspection Review, Lab Test, Calibration, Document Version, Approval, Change Request مرتبطة بالسياق المناسب.
- approval decision لا يعني application success؛ notification delivery ليست business completion.
- لا تخترع record links أو notification status إذا read model لا يوفرها.

## 12) Architecture / Deployment / Assets

- التطبيق Astro SSR ونشره المستهدف Render.
- `public/assets/astro/**` المنسوخ أزيل، ويوجد boundary check يمنع رجوع source tree إلى assets الإنتاج.
- Prettier/ESLint يركزان على كود المشروع ويستثنيان أدوات العمل `.opencode/**` و`.playwright-mcp/**`.
- Login Three.js dynamic/lazy ولا يدخل authenticated critical rendering path.
- لا تعتمد GitHub Pages/Jekyll كمسار نشر أو كإشارة صحة للتطبيق.
- Page-route contract: `definePageRoute` centralizes `id/path/page/domain/title/breadcrumb/visibility`; new browser pages default to `AUTHENTICATED`, `/system/health` is explicit `YAZEED_ONLY`, and the architecture gate rejects registry/page/navigation drift. Route visibility remains separate from server-side mutation authority.

## 13) الوثائق والملفات المرجعية الأعلى أولوية

- `Documents/SYSTEM-INVARIANTS.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/REQUIREMENTS-TRACEABILITY.md`
- `Documents/DATA-MODEL.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md`
- `src/shared/authorization/*`
- `src/modules/release-governance/*`
- `src/modules/quarantine/templates/*`
- `src/modules/quarantine/inspection/*`
- `src/shared/audit/*`
- `src/shared/health/*`
- `src/ui/components/SystemBackground.astro`
- `src/ui/components/QCLogin3DBackground.astro`
- `tests/e2e/authenticated-closure.spec.ts`
- `scripts/verification/run-authenticated-e2e.ts`
- `audit/2026-09-17-authenticated-e2e-closure.md`

## 14) المشاكل المفتوحة الحالية — لا تعيد فتح المشاكل المغلقة تاريخيًا

### P0 / blocking evidence
- Docker/Testcontainers غير متوفر على المضيف المحلي. (PostgreSQL 18 runtime صار متوفرًا محليًا عبر disposable cluster، لكن مسار Docker/image نفسه و authenticated E2E ما زالا غير منفذين.)
- authenticated E2E لم يُنفذ فعليًا بعد.
- GitHub Verification CI exact-HEAD غير مثبت بسبب billing lock.
- Node المحلي خارج contract.
- provider-ingestion الموثوق لأدلة CI/Security/E2E/UAT غير مكتمل.
- UAT غير منفذ؛ production readiness غير مثبت.

### P1 / live validation
- تشغيل مسار Testcontainers/`postgres:18-alpine` (نفس مسار CI) على بيئة فيها container runtime، لأن مسار الـcontainer الفرعي لم يُنفذ فعليًا بعد.
- live performance evidence لخلفية النظام وlogin (CPU/GPU/heap/Web Vitals).
- authenticated accessibility/responsive/keyboard/screen-reader matrix.
- backup catalog + artifact + isolated restore drill.
- ترقية fixtures القديمة بحيث `loginIdentity` يصبح حاضرًا بوضوح في test doubles.
- تنظيف Lottie container metadata/unused asset فقط إذا اعتُمد asset-pipeline لذلك.

## 15) الحالة الحالية — Production NFR evidence

- `QC-CLOSURE-NFR-010` أضاف سجل أدلة موحدًا على exact source `313bdfcc031abc18d3e55e75a025d880b9d16450` وbuild `rel-d740622fc9010566`، مع فصل الأدلة المحلية عن claims الإنتاج/UAT.
- frozen install/lock integrity، 37 focused security/observability tests، typecheck، architecture، build، release identity/verification، source-map scan، local CSP/CSRF/safe-error HTTP checks: **VERIFIED/PASS** ضمن Node `v22.23.1` فقط، وهو خارج contract `>=24.20.0 <25`.
- local smoke: login/live 200، readiness 503 بسبب PostgreSQL unavailable، cross-origin mutation 403؛ هذه أدلة runtime محلي لا production.
- accessibility selected browser run: 6/8 PASS؛ login tests unstable/NOT VERIFIED، وكل authenticated keyboard/AT/manual workflows NOT EXECUTED.
- dependency audit لم يرجع بسبب network، CI exact-head ما زال غير مثبت، Docker/PostgreSQL 18/authenticated E2E/provider/exporter/live performance ما زالت **BLOCKED/UNVERIFIED**.
- privacy data-flow inventory موجود في evidence file؛ مدد retention وdeletion/correction الدقيقة غير مخترعة وتبقى pending policy.

## 16) الحالة الحالية — AI Advisory Safety / Evaluation

- AI remains advisory-only. The boundary now blocks detected PII/secret-like input before provider access, rejects authority-claiming text and structured recommendations, fail-safe refuses high-risk unsupported-source requests, and preserves source identity/citations when supplied.
- Deterministic dataset is `qc-ai-governance-v2` / `2.0.0`; focused run `41/41 PASS` across 3 files. Evidence: `audit/2026-09-17-qc-closure-ai-011-evidence.md`.
- Provider/model identity remains `DisabledAiProvider` / not configured; external provider policy, data handling, live outage/telemetry, and human UAT remain `BLOCKED`. No production/provider approval is inferred.

## 17) سجل تاريخي مضغوط

> هذا السجل يحتفظ بسبب القرارات وتسلسل العمل فقط. إذا تعارض مع الأقسام 1–16، استخدم الأقسام 1–16.

- **2026-09-18 — Project Mind rollover (QC-CLOSURE-007)** — نُقلت أقدم 12 سجلات `[2026-09-10]` إلى أعلى `02-mind-mid.md` للبقاء تحت soft limit؛ تم التحقق من وجود كل سجل في الأرشيف (12/12) قبل الحذف، ولم تُنقل أي قرارات حالية أو مشاكل مفتوحة. الحالة: DONE.
- **2026-09-18 — QC-CLOSURE-007 / Laboratory & scientific governance closure**
  - Changed: implemented the missing TR-LAB-007 reject transition (`RejectLabTestUseCase`, `REJECT: UNDER_REVIEW → REJECTED`, reason + SoD + dual permission + P-05 + expected version, measurements/results preserved, `rejected_at` persisted, action wired as `laboratory.reject`); added the fail-closed `LabRejectPolicy` default and the new `POLICY_SOURCE_REQUIRED` error code; registered `PERM-LAB-REJECT`/`PERM-APR-REJECT` LAB_TEST policies; recorded PD-38 (reject decision authority) as OPEN/BLOCKED in the policy matrix; added fixture-driven lab reject E2E coverage and disclosed the reject policy gate on the review workspace without any actionable control.
  - Evidence: typecheck `742 files / 0 errors`, lint, format, build, architecture PASS; unit `78 files / 523 tests PASS` (lab-focused `26/26`), lab+policy targeted `42/42`, lab reject spec listed by Playwright (`8 tests`) but **NOT VERIFIED** in execution; PostgreSQL-backed integration **BLOCKED** (no container runtime).
  - State: PARTIAL / BLOCKED.
  - Key files: `src/modules/laboratory/application/reject-lab-test.ts`, `src/modules/laboratory/domain/lab-state.ts`, `src/modules/laboratory/infrastructure/postgres-repository.ts`, `tests/unit/laboratory/scientific-governance.test.ts`, `audit/2026-09-18-qc-closure-007-laboratory-scientific-governance.md`.

- **2026-09-18 — QC-CLOSURE-006 / QC operational workflow**
  - Changed: added forward migration `0025_qc_closure_006_workflow`, supplier/assignment/evidence/history contracts, server-counted evidence Submit gate, independent Reject decision, release SoD/idempotency, and fixture-driven Receiving→Inspection→Release Playwright coverage.
  - Evidence: unit `76/497 PASS`; targeted QC tests `15 PASS`; typecheck/build/format/lint/diff checks PASS; PostgreSQL-backed integration and authenticated E2E **BLOCKED/NOT VERIFIED** because no container runtime.
  - State: PARTIAL / BLOCKED.
  - Key files: `db/migrations/0025_qc_closure_006_workflow.sql`, `src/modules/quarantine/{receiving,inspection}`, `tests/e2e/critical-workflows.spec.ts`.

- **2026-09-18 — Project Mind rollover (QC-CLOSURE-005)** — نُقلت 23 من أقدم سجلات `[2026-09-10]` إلى `02-mind-mid.md` للبقاء تحت soft limit؛ تُحقق من وجود كل سجل في الأرشيف قبل حذفه، ولم تُنقل أي قرارات حالية أو مشاكل مفتوحة. الحالة: DONE.

- **2026-09-18 — QC-CLOSURE-004 / Identity, RBAC, roles, scopes, and owner-grant integrity**
  - Changed: added forward migration `0024` for active-role uniqueness and strict canonical scope values; repository now prevents a non-`yazeed` SYSTEM_OWNER grant and validates normalized bulk/provisioned scopes; added PostgreSQL lifecycle/RBAC/concurrency regression suite.
  - Evidence: typecheck 0 errors; focused identity/RBAC unit 32/32, full unit 76/491, lint, format, architecture, and diff check PASS. PostgreSQL suite and live migration remain BLOCKED (Docker/runtime and approved disposable DATABASE_URL unavailable).
  - State: PARTIAL / BLOCKED.

- **2026-09-18 — Project Mind rollover**
  - Changed: moved ten oldest ledger records to `02-mind-mid.md` to retain the live mind at its operating limit.
  - Evidence: archived records were copied before removal.
  - State: DONE.

- **2026-09-18 — QC-CLOSURE-002 / Extensible Route, Module & Page Architecture**
  - Changed: introduced typed page visibility and canonical route integrity checks; registered existing orphaned pages and bound navigation references to canonical route IDs.
  - Evidence: targeted routing/navigation unit tests, route-file architecture gate, and typecheck PASS (Node 22 is outside the runtime contract).
  - State: DONE (local source contract; no production/UAT claim).

- **2026-09-18 — Project Mind rollover**
  - Changed: moved eight obsolete historical ledger entries to `02-mind-mid.md` to keep the live mind under its soft limit.
  - Evidence: archived entries were verified before removal.
  - State: DONE.

- **2026-09-17 — QC-CLOSURE-AI-011 / AI Advisory Safety and Evaluation Closure**
  - Changed: شدّدنا fail-safe للإدخال/الإخراج، حفظ source identity، واختبار عدم الوصول إلى controlled mutation authority؛ dataset v2 يغطي الحالات المطلوبة ويعرّف المقاييس.
  - Evidence: deterministic AI suite `41/41 PASS`; provider/model/external data policy وUAT بقيت `BLOCKED`.
  - State: PARTIAL.
  - Key files: `audit/2026-09-17-qc-closure-ai-011-evidence.md`، `audit/100-percent/ai-evals/deterministic-eval-dataset.json`.

- **2026-09-17 — QC-CLOSURE-NFR-010 / Production Non-Functional Evidence Closure**
  - Changed: أضيف سجل موحد للأمن وسلسلة التوريد والخصوصية والأداء والـobservability والوصول، مربوط بـexact SHA/build، مع budgets مقترحة وحدود evidence صريحة.
  - Evidence: frozen install وlock integrity و37 focused tests وbuild/release verification وlocal HTTP security checks PASS؛ Docker/PostgreSQL، dependency audit، CI، authenticated E2E، provider/live performance، وmanual AT بقيت BLOCKED/UNVERIFIED.
  - State: PARTIAL.
  - Key files: `audit/2026-09-17-qc-nfr-010-production-nfr-evidence.md`.

- **2026-09-17 — QC-CLOSURE-POLICY-009 / Canonical policy closure matrix**
  - Changed: أُغلقت فقط قرارات P-05 authority slices وP-06 وP-07؛ أضيفت مصفوفة canonical وسير controlled configuration، وبقيت قرارات QMS/provider/data-instance مفتوحة.
  - Evidence: targeted unit 43/43 PASS؛ architecture PASS؛ لا UAT/provider/live production claim.
  - State: PARTIAL.
  - Key files: `audit/100-percent/POLICY-CLOSURE-MATRIX.md` والوثائق المعيارية المرتبطة.

- **[2026-09-17] — QC-CLOSURE-E2E-006: Authenticated Critical Workflow E2E Closure** — مسار الإغلاق والأدلة الآلية صار جاهزًا وقابلًا للتشغيل، لكن لم تُنفذ الرحلات المصادق عليها فعليًا لأن PostgreSQL 18 يحتاج Docker runtime غير متوفر على هذا المضيف.
- **[2026-09-17] — QC-CLOSURE-UI-BG-005: Restore Approved Fixed System Lottie Background Safely** — الخلفية الثابتة تعمل كطبقة زخرفية آمنة على الأسطح المصادق عليها، مع fallback مضمون وعدم تغيير CSP أو خلفية login.
- **[2026-09-17] — QC-CLOSURE-CI-004: Exact-HEAD Verification CI Closure** — بوابات الكود القابلة للتشغيل محليًا خضراء بعد إصلاحات السبب الجذري، لكن لا يمكن إعلان GitHub exact-HEAD GREEN قبل تشغيل Docker/E2E في CI وحل قفل الفوترة وتعطيل Pages خارجيًا.
- **[2026-09-15] — QC-CLOSURE-TEMPLATES-003: تثبيت سلطة القوالب وإغلاق حفظ السياق التاريخي** — أُغلق انحراف هوية SYSTEM_OWNER في قوالب التفتيش، وصارت قراءات التفتيش تعتمد على snapshot تاريخي يحافظ على نسخة القالب بعد الإيقاف أو الاستبدال، مع إبقاء RD-019 والـSoD العام خارج نطاق الإغلاق.
- **[2026-09-15] — QC-CLOSURE-RELEASE-002: Server-Derived Production Release Evidence** — لا توجد الآن قناة واجهة تجعل browser-controlled PASS أو risk acceptance حقيقة اعتماد؛ أي اعتماد فعلي يحتاج أدلة موثوقة مخزنة ومطابقة لهوية الإصدار.
- **[2026-09-15] — QC-CLOSURE-IDENTITY-001: إغلاق هوية SYSTEM_OWNER وصلاحيات P-05 والإفراج** — لم تعد مسارات P-05 أو Release أو Production Recovery تعتمد على `actor.id` كهوية دخول؛ الحساب المسمى لا ينجح إلا بهوية server-derived مع الدور والحالة الصحيحة.
- **[2026-09-15] — خط أساس الواقع الحالي قبل أي تغيير** — الواقع الحالي لا يبرر ادعاء أن الاختبارات أو lint أو format أو migration runtime كلها ناجحة؛ البناء والـtypecheck والحدود ناجحة فقط ضمن البيئة الحالية.
- **[2026-09-10] — إعداد سيناريوهات UX وخطة اختبار قابلية الاستخدام بدون ادعاءات بحثية** — صارت خطة الاختبار والسيناريوهات جاهزة للتنفيذ على بيانات synthetic، مع منع ترقية فرضيات UX إلى findings قبل وجود ملاحظة أو قياس صالح.
- **[2026-09-10] — إكمال ربط handoffs والـtimelines لكل المساحات المطلوبة** — اكتمل ربط عقد handoff مع كل المساحات المطلوبة، وصارت الانتقالات والانتظار والمالك والأدلة أوضح، مع بقاء الملكية والتفويض والتاريخ المضبوط كما هي.
- **[2026-09-10] — تنفيذ أولي لعقد handoff وJourney Context على الأسطح التشغيلية** — صار عقد handoff مرئيًا ومستخدمًا فعليًا على أربع مساحات تشغيلية، مع record-level links حيث تتوفر الهوية، وبدون كسر حدود Quarantine/Laboratory/Assets/Audit أو التفويض.
- **[2026-09-10] — خرائط رحلات الخدمة التشغيلية وربط handoffs بين الدومينات** — صار عند المشروع تصور خدمة end-to-end قابل للتنفيذ يوضح الملكية والانتظار والدليل والوجهة التالية، مع الحفاظ على حدود Quarantine/Laboratory/Quality/Approvals/Documents/Assets وAudit/Notifications.
- **[2026-09-10] — تدقيق Motion Design وDigital Art Direction** — الحركة الحالية مناسبة لاتجاه QC الهادئ، والـlogin art منضبط طبيًا، مع debt واضح في layout transition وقياسات أداء حية مطلوبة قبل رفع fidelity.
- **[2026-09-10] — تنفيذ طبقة Product Analytics الخصوصية وربط قياس البحث** — صارت قياسات البحث تمر عبر عقد privacy-safe وoutbox مع اختبارات، بينما التوسع الكامل والمزود الخارجي والبيانات الفعلية ما زالت غير منفذة.
- **[2026-09-10] — رفع Dashboard إلى decision surface صادق بالبيانات** — الداشبورد صار أوضح كواجهة قرار، metadata والـdrill-down وحالات unavailable محروسة، والرسوم غير موجودة عمدًا حتى يوفّر الباكند سلسلة زمنية معرفة.
- **[2026-09-10] — معالجة فجوات الوصول المؤكدة من تدقيق WCAG** — الفجوات المؤكدة في loading/status/forced-colors/notification severity انصلحت ومحروسة، لكن التحقق الحي الكامل لكل route وscreen reader ما زال غير متاح.

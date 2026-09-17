# QC Operations & Laboratory Management System — Compact Project Mind

> آخر دمج: 2026-09-18  
> الغرض: ذاكرة تشغيلية قصيرة للوكيل، وليست بديلًا عن الكود أو الوثائق أو أدلة التدقيق.  
> **قاعدة التعارض:** الحالة الحالية والقرارات الثابتة في أعلى هذا الملف تتقدم على السجل التاريخي أدناه. السجل التاريخي للـtraceability فقط، ولا يعيد قرارًا ألغاه قرار أحدث.

## Current audit reality — 2026-09-18

- Exact current HEAD: `02d94fa48fa5e0ecca0150aa16d1a42997832587` on `main`. The earlier yazeed owner-control work (tasks 001–006) is now **committed**; the working tree currently holds only the uncommitted closure changes of `QC-SYSTEM-OWNER-YAZEED-FINAL-CLOSURE-005` (13 modified + 7 new paths, `1547 insertions / 210 deletions`).
- Fresh local evidence on this HEAD + working tree: `pnpm typecheck` (`astro check`, 729 files) **PASS / 0 errors**; `tests/unit/admin` **65/65 PASS** (6 files). Full `pnpm test:unit` observed **75 files / 485 tests → 484 PASS, 1 FAIL** at `tests/unit/ui/app-shell.test.ts` (a source-text guard on `src/ui/client/dialog.ts` that the dialog refactor invalidated); the guard was then satisfied in source but **NOT re-run** → treat full-unit status as `NOT VERIFIED` for the current tree.
- NOT RUN on this tree: `format:check`, `lint`, `test:architecture`, `build`, `git diff --check`, Playwright, `test:integration`, `test:migrations`, `test:concurrency`, `test:security`, `system-owner:check`, `system-owner:reconcile`. Older lint/format FAILs (`scripts/verification/run-authenticated-e2e.ts:105`, two system-background tests) and the tracked `.DS_Store` hygiene failure are on record and were **not** re-checked.
- Migration source head remains `0023_uat_evidence` with **no new migration** in this task. Release identity `rel-b6af9b842676c931` / build `local-1686d2951e9e` is **stale** relative to this tree; applied DB head, CI, authenticated E2E, UAT, provider, and restore evidence are still not current/verified.
- Docker daemon is **unavailable** on this host (socket `~/.docker/run/docker.sock` missing), so PostgreSQL 18 / Testcontainers execution is `BLOCKED`; UAT validator still reports `sessions=0`.
- Final independent audit decision remains `NO-GO`; details in `audit/100-percent/FINAL-100-DOMAIN-AUDIT.md` and `audit/100-percent/RELEASE-GATE-EVIDENCE.md`.

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

### Operational visibility
- القاعدة التشغيلية: كل حساب `ACTIVE` ومصادق يقدر يقرأ صفحات وسجلات التشغيل العادية على مستوى النظام.
- القراءة العامة لا تعطي حق mutation؛ الإنشاء/التعديل/المراجعة/الاعتماد/الإفراج/VOID/الاستعادة/التوقيع تبقى محكومة بالسياسات.
- كلمات المرور، hashes، sessions، الأسرار، بيانات أمن الهوية، والتشخيصات الخام ليست ضمن القراءة العامة.
- `/admin/*`: القرار الأحدث يسمح لـAdmin و`yazeed` حسب المنح/العقد المعتمد؛ لا تستخدم القرار الأقدم الذي كان يحصر Admin workspace في yazeed فقط.
- `/system/health`: يبقى محصورًا بالمالك المسمى `yazeed`/SYSTEM_OWNER حسب العقد الحالي.

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

## 6) Inspection / Laboratory / Release invariants

- `Inspection Result` و`Release System State` حالتان منفصلتان؛ `PASS ≠ RELEASED`.
- لا تربط نجاح inspection تلقائيًا بإفراج النظام.
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
- Docker/Testcontainers/PostgreSQL runtime غير متوفر على المضيف المحلي.
- authenticated E2E لم يُنفذ فعليًا بعد.
- GitHub Verification CI exact-HEAD غير مثبت بسبب billing lock.
- Node المحلي خارج contract.
- provider-ingestion الموثوق لأدلة CI/Security/E2E/UAT غير مكتمل.
- UAT غير منفذ؛ production readiness غير مثبت.

### P1 / live validation
- تشغيل migration status ورأس قاعدة البيانات الفعلي على بيئة مناسبة.
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
- **[2026-09-10] — تدقيق WCAG 2.2 AA وergonomics لتطبيق QC** — عقود الوصول الأساسية محروسة آليًا، ودليل المتصفح يؤكد صفحة الدخول و404 فقط؛ لا يوجد claim WCAG كامل أو ergonomics كامل لكل route/workflow.
- **[2026-09-10] — تدقيق وكتابة UX للنصوص المنظمة** — تم توحيد ورفع دقة النسخ في المكونات والأسطح الحساسة مع حفظ المعاني المنظمة، لكن لا يوجد claim بأن كل notification runtime تستخدم القاموس حتى تُفحص ببيانات مصادق عليها.
- **[2026-09-10] — إصلاح ملاحظات نماذج UX للبيانات المنظمة** — أُصلحت الملاحظات المؤكدة في النماذج بدون تغيير authorization أو state machine أو business/scientific policy، ووُثقت حدود ما يحتاج backend fixture أو قرار مالك.
- **[2026-09-10] — Principal interaction audit وتنضيج primitives المشتركة** — صار عند المشروع تدقيق تفاعلات قابل للتتبع وتحسينات فعلية في focus/cancel/disabled sort-pagination، مع إبقاء friction والتفويض/state rules حسب الأساس المعتمد. التوصيل الكامل لكل الصفحات والتحقق المصادق ما زال دفعة لاحقة.
- **[2026-09-10] — تدقيق Information Architecture كامل وتحسينات wayfinding آمنة** — صار عند النظام تقرير IA قابل للتتبع وتحسينات wayfinding/semantic navigation بدون تغيير سياسة الأمن أو صلاحيات الأفعال، لكن مصفوفة الأدوار/النطاقات الحية وسلوك browser/AT الكامل ما زال يحتاج fixture مصادق وبيئة تشغيل مناسبة.
- **[2026-09-10] — تدقيق responsive والكثافة الكامل على route families مع assertions للـoverflow** — عقود responsive والكثافة وقياسات E2E أضيفت محليًا مع build/unit evidence، لكن تشغيل المصفوفة على current authenticated content يحتاج بيئة Chromium/fixture مصادق قابلة للتشغيل.
- **[2026-09-10] — تدقيق أسطح البيانات والقرارات كمحطة QC مؤسسية** — الدليل static يثبت أن البنية الدلالية الأساسية موجودة، لكن تجربة القوائم والحالات المؤسسية غير موحّدة، وأكبر blocker هو خلط provider unavailable مع empty/zero، ثم غياب sort/pagination/loading/stale على registers.
- **[2026-09-10] — تنضيج أساس نظام التصميم المؤسسي** — صارت طبقة التصميم المشتركة أوضح وقابلة للتوسع، لكن ترحيل كل CSS المحلي وتعديل تباين semantic status يحتاج دفعات لاحقة وقرار مالك للألوان.
- **[2026-09-10] — إصلاح فجوات التفويض والرؤية في الواجهة** — انحلت فجوات presentation المكتشفة محليًا بدون تغيير السياسة، لكن التحقق المصادق للشخصيات والـfixtures وstale/SoD/e-signature وindistinguishable empty states ما زال ينتظر credentials بيئة غير إنتاجية.
- **[2026-09-10] — تدقيق واجهة التفويض والرؤية مقابل AVD (fail-closed)** — denial anonymous والحدود الدلالية الأساسية واضحة، لكن AVD universal operational visibility غير منعكس بالكامل في navigation، والتحقق المصادق لكل الشخصيات ما اكتمل.
- **[2026-09-10] — إصلاح motion والأداء وتقسيم Three.js في login** — الحركة الزخرفية الثقيلة خرجت من authenticated workspaces، و3D login بقي محفوظًا لكن صار مؤجلًا وlazy وموقوفًا مع reduced motion، مع تثبيت Three.js وإزالة fallback API مكسور.
- **[2026-09-10] — تدقيق motion/performance للـSystemBackground وThree.js login على الإنتاج** — التصميم الحالي محافظ على fallback آمن وواجهة login قابلة للعمل بدون WebGL، لكن لا يوجد claim أن الحركة حسّنت الأداء. الأولوية التالية: تفسير سبب fallback، pin exact لـThree.js إذا اعتمدت سياسة المستودع، وخفض TTFB على mobile قبل أي إزالة للـ3D.
- **[2026-09-10] — Standardize complete mutation UX without weakening server controls (ui-ux-pro-max)** — العقد الموحد مطبق محليًا على كل أسطح الـmutation المطلوبة مع بقاء التفويض الخادمي وآلات الحالة والتزامن المتفائل والتدقيق وPOST الاحتياطي، لكن الدليل الحي الكامل (JS/no-JS/bطء/نقر مزدوج/stale/auth/dependency/success) يحتاج نشرًا ثم إعادة فحص Chrome على المرشح المنشور.
- **[2026-09-10] — WCAG 2.2 AA closure pass: laboratory table scopes (read-only live evidence + one local presentation fix)** — إصلاح عرضي واحد مثبت محليًا، مع إغلاق قراءة فقط موثق، لكن لا يوجد ادعاء امتثال كامل `WCAG 2.2 AA`.
- **[2026-09-10] — إصلاح بنية التنقل الجامع وحماية الداشبورد من استبدال الشل (universal shell repair)** — بنية الشل الجامع مُصلحة ومحروسة بالاختبارات محليًا بلا تغيير تفويض، لكن الإثبات الحي الكامل للمصفوفة ما زال مفتوحًا.
- **[2026-09-10] — إضافة سطر حالة تحت كل برومبت + جدول متابعة رئيسي (complete-prompts)** — كل برومبت صار تحته سطر حالة واحد `☐/✅` وجدول متابعة رئيسي بالأعلى؛ الملف سليم البنية.
- **[2026-09-10] — تدقيق عقد التوكنز البصرية والتباين (visual-token audit, fail-closed)** — عقد التوكنز العام سليم (صفر undefined عامة) والنص المصاحب للحالة وتطابق الوثائق محققان، لكن تباين النص العادي ما زال فاشلًا في 9 تركيبات معروضة (badges released/danger/review/neutral وdanger-on-panel/raised وmuted-on-raised وpill-bad وwhite-buttons) فيحتاج قرار مالك على الباليت قبل أي PASS؛ لم تُدخل عربي ولم يُكسر dark-only ولم يحدث commit/push/deploy.
- **[2026-09-10] — تدقيق UI/UX Pro Max المستقل + معالجة P0 الآمنة (MASTER + Prompts 1–9 جزئيًا)** — 4/10 Pro Max مغلقة بالكامل و4/10 جزئية و2/10 مفتوحة؛ التباين الستي والعدّادات الحقيقية والتحقق الحي الكامل على نفس SHA المنشور ما زالت تمنع APPROVE.
- **[2026-09-10] — تنفيذ Prompt 15 (C-07..C-12) بنفس جلسة Chrome وهوية بناء ثابتة: ‏0/6 PASS و1 FAIL** — C-07 ‏NOT VERIFIED‏ وC-08 ‏NOT VERIFIED‏ وC-09 ‏FAIL‏ وC-10 ‏NOT VERIFIED‏ وC-11 ‏NOT VERIFIED‏ وC-12 ‏NOT VERIFIED‏ (‏0/6 PASS‏)؛ كسر واحد يمنع ‏12/12‏ ويمنع أي مقياس حي من بلوغ ‏100%‏.
- **[2026-09-10] — تنفيذ Prompt 14 (C-01..C-06) في Chrome: الكل NOT VERIFIED لبوابة الهوية** — C-01 وC-02 وC-03 وC-04 وC-05 وC-06 كلها `NOT VERIFIED` (‏0/6 PASS و0 FAIL) لأن هوية Prompt 12 غائبة على المنشور (`UNVERIFIED` ولا تطابق SHA المحلي) ولا توجد fixtures أدوار سالبة/موجبة ولا مصادقة جديدة مشهودة في هذه الجولة؛ الملاحظات السطحية الإيجابية لا تُحتسب PASS.
- **[2026-09-10] — تجهيز حسابات وفيكستشرز التحقق الآمنة ومصفوفة C-12 (Prompt 13)** — فيكستشرز Prompt 13 والمصفوفة والتحقق السالب/الموجب جاهزة ومحروسة، لكن C-12 نفسه يبقى `NOT VERIFIED` حتى تشغيل البذرة على بيئة non-production وتنفيذ المواصفة المصادقة على نفس هوية البناء المنشورة.
- **[2026-09-10] — سطح هوية البناء المصادق وتحقق C-11 المقفل على الفشل (Prompt 12)** — آلية C-11 مكتملة ومحروسة (سطح مصادق + متحقق fail-closed + عينتا بداية/نهاية)، لكن C-11 نفسه يبقى `NOT VERIFIED` حتى نشر نفس SHA بهوية محقونة (wiring الـCI/Render اليدوي) وتنفيذ الجزء المصادق من المواصفة.
- **[2026-09-10] — سجل إغلاق ثابت 15 بندًا على مرشح واحد (Prompt 11: كلها OPEN، ‏0.0%)** — السجل الثابت مكتمل ومربوط بمرشح واحد، لكن الإغلاق ‏0/15‏ لأن الدليل الحي لنفس البناء غائب؛ أي PASS سابق لبناء آخر لم يُرحّل.
- **[2026-09-10] — تنفيذ حوكمة اعتماد إصدار الإنتاج (fail-closed, Manager أو yazeed)** — حوكمة الإصدار المقفلة على الفشل منفذة ومحروسة بالاختبارات والبناء، لكن الإثبات الحي (PG transaction حقيقي + E2E مصادق على مرشح إصدار حقيقي + migration مطبق على قاعدة اختبار) ما زال مفتوحًا.
- **[2026-09-10] — تنفيذ P-05 authority matrix inline (دفعة أولى)** — نواة P-05 التنفيذية والمصفوفة الأساسية خضراء محليًا، لكن أدلة transaction/concurrency/rollback وPlaywright المصادق وتوثيق المصفوفات النهائية ما زالت مفتوحة.
- **[2026-09-10] — إنشاء خطة تنفيذ P-05** — خطة P-05 جاهزة للتنفيذ task-by-task عبر subagent-driven development أو executing-plans، لكن التنفيذ نفسه لم يبدأ.
- **[2026-09-10] — اعتماد وتصميم P-05 authority matrix** — مواصفة P-05 جاهزة للمراجعة قبل إنشاء خطة التنفيذ؛ التنفيذ لم يبدأ بعد التزامًا ببوابة التصميم.
- **[2026-09-10] — استكشاف P-05 وتحديد فجوات authority matrix** — اتحدد نطاق P-05 وفجواته بدقة، لكن ما نقدر ننفذ بأمان قبل حسم التعارض بين Prompt 9 والوثائق التي ما زالت تسمي authority/retest/VOID `POLICY-DEPENDENT`.
- **[2026-09-10] — تنفيذ P-04 لإغلاق CAPA بمسار Supervisor مضبوط** — مسار P-04 منفذ محليًا ومغطى باختبارات unit/domain/build وarchitecture، لكن إثبات PostgreSQL الفعلي وE2E المصادق لم يُنفذ، ولا يوجد commit أو push أو deploy.
- **[2026-09-10] — تنفيذ الإصلاحات الأربعة لفجوات تحقق الإنتاج محليًا** — الإصلاحات الأربعة مضافة للكود ومحروسة بالاختبارات، لكن C-08/C-09/C-11 تحتاج نشرًا يدويًا ثم تحقق Chrome جديد، وC-12 يحتاج fixtures أدوار منفصلة.
- **[2026-09-10] — استكمال تحقق Chrome الحي لبنود C-01 إلى C-12** — تم إغلاق C-06 وC-07 بالدليل الحي، لكن لا يزال التحقق الكامل 12/12 محجوبًا بسبب zoom، mobile drawer، fixtures، وdeployed release identity.
- **[2026-09-10] — تشخيص أخطاء Console في جلسة Dashboard الحية** — الأخطاء ليست من نظام SVG؛ سببها favicon مفقود وCSP تمنع WASM الخاص بخلفية dotLottie.
- **[2026-09-10] — تحقق حي من نسخة الموقع باستخدام yazeed** — نسخة الموقع الحية تحمل نظام SVG والنصوص الجديدة وتسجيل الدخول يعمل، لكن سلوك mobile drawer عند resize الحي يحتاج متابعة منفصلة قبل اعتباره مثبتًا.
- **[2026-09-10] — محاولة تشغيل اختبارات الأيقونات ببيانات yazeed** — بيانات الدخول لم تُقبل على البيئة المحلية الحالية؛ يلزم تحديد بيئة/قاعدة تحتوي الحساب أو التحقق من بيانات الدخول قبل إعادة تشغيل المسارات المصادق عليها.
- **[2026-09-10] — توحيد أيقونات SVG المحلية وتنظيف النسخ التشغيلية** — توحيد الأيقونات والنسخ وعقود الحماية مكتمل محليًا، لكن إثبات shell المصادق في المتصفح ينتظر fixture دخول، وحزمة Playwright العامة ما زالت تتأثر بعائق login headless المعروف.
- **[2026-09-10] — استمرار تنفيذ F-11: تشغيل النسخ المحلي وتوثيق RPO/RTO** — زادت تغطية التنفيذ المحلي والتوثيق والواجهة، لكن F-11 ما زال `OPEN / PARTIAL` لأن catalog wiring الكامل، restore drill المعزول، وartifact حي بنفس deployed release لم تُثبت بعد.
- **[2026-09-10] — تنفيذ Prompt 3 (F-10): دورة حياة قوالب الحجر بسياسة P-06** — دورة حياة القوالب كاملة بسياسة P-06 ومحروسة بالاختبارات السالبة/الموجبة وSoD والتزامن، لكن F-10 يبقى OPEN حتى دليل حي على نفس الـbuild المنشور.
- **[2026-09-10] — تنفيذ Prompt 2: مسار سياقي مصرح به لإنشاء Change Request (DOCUMENT_VERSION)** — فورم Change Request صار سياقيًا مصرحًا بلا UUID/JSON ظاهرين، والقيم الحرجة تُشتق خادميًا مع فحص تزامن ذري، والقائمة المسموحة محروسة من المسارين الخام والسياقي.
- **[2026-09-10] — تنفيذ BI-01: عزل خلفية درج الجوال في AppLayout** — عزل الدرج مطبق ومغطى ومثبت سلوكيًا على البناء المحلي، لكن الإغلاق الحي للإيجاد (C-09 على الإنتاج) ما زال `NOT VERIFIED` — يحتاج fixture مصادقة وbuild منشور.
- **[2026-09-10] — استكمال برومبتات الوصول المثبت إلى 100% في تدقيق الإنتاج** — التقرير يغطي الآن كامل مسار جعل المقاييس الأربعة 100% بشكل قابل للإثبات، لكنه ما يدّعي تحققها قبل التنفيذ والنشر والفحص الحي.
- **[2026-09-10] — تثبيت قرارات السياسة داخل تقرير التدقيق كبرومبتات فقط** — التقرير صار يحتوي القرارات النهائية وبرومبتات تنفيذية دقيقة بدون تطبيق تغييرات على النظام، وبقيت النسب كما هي لأنها ما زالت مرتبطة بأدلة التنفيذ الحقيقية.
- **[2026-09-09] — إعادة تدقيق واجهة الإنتاج بنسب قابلة لإعادة الحساب** — التقرير صار صادقًا حسابيًا وقابلًا لإعادة الإنتاج، والجولة الحية أكدت الواقع بدل الاعتماد على تقدير؛ الحكم بقي `Needs changes` ولا توجد مطالبة 100% أو Production Ready.
- **[2026-09-09] — دمج خلفية QC ثلاثية الأبعاد في صفحة /login فقط** — خلفية الدخول ثلاثية الأبعاد تعمل على `/login` فقط (desktop وmobile) مع بقاء المصادقة والعزل والتنظيف، وبلا commit أو push.
- **[2026-09-09] — حزمة F-10 وF-11: سياسة ونشر مضبوطة بلا تغيير جاهزية** — الحزمة المضبوطة جاهزة كـ blocker متتبع: الجرد والفصل والرفض موثقة بدليل طازج، ولا مزود اختُرع ولا جاهزية تغيّرت.
- **[2026-09-09] — إصلاح F-07: توحيد استعلام التدقيق بين Dashboard و/audit** — السطحان يقرآن الآن نفس العقد المعتمد بترتيب وmapping وترقيم موحد، وحدث GRANT المؤهل يظهر متطابقًا عليهما لنفس الفاعل المخوّل، مع بقاء حماية عدم التسريب وبلا payload/أسرار.
- **[2026-09-09] — إصلاح F-12: واجهة إنجليزية فقط + مفردات sentence-case موحدة** — الواجهة الآن إنجليزية فقط بمفردات جملة موحدة ومحروسة آليًا، مع بقاء semantics المضبوطة والمصطلحات العلمية كما اعتُمدت.
- **[2026-09-09] — إصلاح F-03: إغلاق التمدد الأفقي عند 320px و200% زوم (LTR/RTL)** — التمدد الأفقي على مستوى الصفحة مغلق بالتوكنز القائمة مع درج ميسّر، والحراسة الآلية تمنع الانتكاس، لكن تشغيل الـ18 اختبارًا المصادق يحتاج بيئة disposable بصلاحيات مناسبة (وصحة النظام تحتاج مالك SYSTEM_OWNER).
- **[2026-09-09] — إصلاح F-04 وF-05: POST baseline لكل فورمات الإنشاء التسعة** — الفورمات التسعة تعمل الآن بلا JavaScript عبر POST حقيقي مع أخطاء مرئية وقيم محفوظة واسترداد، وJS تحسين اختياري، مع تغطية unit وعقود وE2E gated.
- **[2026-09-09] — إظهار صفحة Tasks وبياناتها لكل الأعضاء النشطين** — صفحة Tasks وبياناتها صارت ظاهرة لكل الأعضاء النشطين، بينما الإنشاء والتعديل وتغييرات الحالة ما زالت محكومة بالصلاحيات.
- **[2026-09-09] — تنفيذ F-02: مساحة Administration المضبوطة (/admin × 8 مسارات)** — مساحة الإدارة الثمانية تعمل بإنكار افتراضي ومنح صريح، مع رفض Admin-بلا-صلاحية وظهور SYSTEM_OWNER مثبتًا بالاختبارات، وكل الكتابات مدققة ومبنية على النسخة مع إبطال الجلسات.
- **[2026-09-09] — إصلاح F-01: توحيد فحص جاهزية قاعدة البيانات بين System Health وready** — الواجهتان تستهلكان الآن نفس فحص الجاهزية وإعداد TLS، وتتفقان في الحالات الثلاث مع مخرجات منقّحة مثبتة بالاختبارات والدخان الإنتاجي.
- **[2026-09-09] — توسيع وصول Administration لـAdmin وyazeed** — Admin و`yazeed` صاروا مخولين لمساحة Administration، وصحة النظام بقيت مقصورة على `yazeed`.
- **[2026-09-09] — تعريب تقرير تدقيق واجهة الإنتاج** — التقرير الآن بالعربي مع إبقاء البرومبتات التنفيذية بالإنجليزي.
- **[2026-09-09] — اعتماد القراءة العامة وحصرية صحة النظام وإدارة الأعضاء** — أصبحت سياسة الوثائق واضحة: قراءة تشغيلية عامة لكل الأعضاء، مع بقاء الأفعال الحساسة مفوضة، وحصرية صحة النظام وإدارة الأعضاء لـ`yazeed`.
- **[2026-09-09] — تدقيق إنتاجي شامل للواجهة والتدفقات بحساب yazeed** — الوصول الأساسي قوي، لكن النتيجة الإجمالية 68% مع خمس مشكلات عالية تمنع اعتماد الواجهة كتجربة تشغيلية مكتملة.
- **[2026-09-09] — تفعيل SYSTEM_OWNER لحساب yazeed على إنتاج Render** — حساب yazeed يملك الآن `SYSTEM_OWNER` وكل الصلاحيات النشطة بنطاق GLOBAL، والصفحات الأربع التي كانت مفقودة أصبحت ظاهرة وقابلة للفتح على الإنتاج.
- **[2026-09-09] — استثناء yazeed كمالك نظام بصلاحيات كاملة** — أصبح هناك مسار صريح وحصري يمنح yazeed كل permissions والصفحات عبر `SYSTEM_OWNER`. يلزم نشر النسخة ثم تشغيل الأمر على قاعدة الإنتاج حتى يصبح الحساب فعليًا كامل الصلاحيات.

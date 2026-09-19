# QC Operations & Laboratory Management System — Compact Project Mind

> آخر دمج: 2026-09-19  
> الغرض: ذاكرة تشغيلية قصيرة للوكيل، وليست بديلًا عن الكود أو الوثائق أو أدلة التدقيق.  
> **قاعدة التعارض:** الحالة الحالية والقرارات الثابتة في أعلى هذا الملف تتقدم على السجل التاريخي أدناه. السجل التاريخي للـtraceability فقط، ولا يعيد قرارًا ألغاه قرار أحدث.

## Current audit reality — 2026-09-18
- **2026-09-19 — QC-100-FINAL-004 / Task 8: Defect loop + regression + execution report (candidate-side, HEAD `9e258276a0f851a35c58d150f474bc962e38e12d`)**
  - Changed: إصلاحا عيب مكتشفان في دورة Detect→Fix→Retest: `nextAction` في `src/pages/quarantine/inspections/[inspectionId]/review.astro` كان يشير إلى `canApprove` المحذوف من سلسلة المرحلتين (بُدّل بـ`canStageApprove`/`canFinalApprove` حسب الحالة)، و3 مواضع `pool.query` في `tests/integration/uat-evidence/uat-evidence-ingestion.test.ts` صارت `pool!` بنمط الملف. لا تغيير عقود ولا schema.
  - Evidence (على الشجرة النهائية): typecheck **846/0 errors** (كانت 4)؛ architecture PASS؛ unit (uat-evidence+authorization+release-governance+approvals+qc-permission-contract+seeds) **93 PASS**؛ integration على PG 18.6: uat-evidence+release-governance 13 PASS، reject-reports+quarantine 49 PASS؛ `uat:scenarios` على `qc_uat_bringup` **14 PASS/0 FAIL/3 NOT RUN**؛ migrate:check 31 ok / schema:check 77 tables/0 orphans. مصفوفة الوصول مُقاسة من القاعدة: EMPLOYEE 106 صلاحية (0 approve/0 sign/14 create)، Supervisor 170 (stage-1 فقط)، QCM 128 (final)، yazeed 255. حقيقة الأدلة: cycles 7/0 accepted، gate 0، signatures 0، sessions 77 آلية/0 بشرية.
  - State: DONE للمهام 1–8 محليًا مع تقرير تنفيذ صادق (فقرتان FAILED مفتوحتان: ملف تكامل المرحلتين المخصص غير موجود، ووثائق STATE-MACHINES/PERMISSION-MATRIX لم تُزامن `PENDING_QCM_APPROVAL`)؛ **البلوكر النهائي الوحيد: علامة بشرية حقيقية — لا شيء مُفبرك، `uat` gate = UNVERIFIED**.
  - Key files: `audit/2026-09-19/QC-100-FINAL-004-execution-report.md`, `src/pages/quarantine/inspections/[inspectionId]/review.astro`, `tests/integration/uat-evidence/uat-evidence-ingestion.test.ts`.
- **QC-100-FINAL-004 human UAT + sign-off (2026-09-19):** `BLOCKED` — no real participants, no approved staging/UAT environment, no frozen release candidate, UAT-DD-001 signer unresolved; no `SIGNED_UAT_CYCLE` exists and none can be fabricated (release-gate evidence is server-derived, fail-closed, candidate-bound). All 8 implementation tasks are now DONE locally (Tasks 1–8; final report `audit/2026-09-19/QC-100-FINAL-004-execution-report.md`): ingestion path verified (Task 5, 8/8 integration), bring-up verified (Task 6), automated HTTP suite green 14/0/3 (Task 7, can never flip the gate), Task 8 regression cycle fixed 4 typecheck errors (review.astro `canApprove` residue + 3 pool non-null) and re-ran all gates green on HEAD `9e25827`. DB truth on `qc_uat_bringup`: cycles 7/0 accepted, gate rows 0, signatures 0, sessions 77 automated/0 human. The `uat` gate remains `UNVERIFIED`. Open owner items: `Documents/STATE-MACHINES.md` + `PERMISSION-MATRIX.md` lack `PENDING_QCM_APPROVAL` (docs behind code); dedicated two-stage integration test file missing; signer scope decision (GLOBAL vs TEAM for acceptance) unresolved; Node 22 local ≠ contract. Evidence: `audit/2026-09-19/QC-100-FINAL-004-{human-uat-signoff,task5-uat-ingestion-closure,task6-local-uat-bringup,task7-uat-scenarios,execution-report}.md`.
- **2026-09-19 — QC-100-FINAL-004 / Task 7: Automated UAT scenario suite (candidate-side)**
  - Changed: جديد `scripts/uat/run-uat-scenarios.ts` (`pnpm uat:scenarios`) + نواة قرار خالصة `scripts/uat/scenario-support.ts`؛ يقود التطبيق الحقيقي عبر HTTP (login/صفحات/`/_actions/*`) على قاعدة UAT، ثم يكتب دليل جلسات آلية عبر مسار Task 5. النتيجة على `qc_uat_bringup`: **14 PASS / 0 FAIL / 3 NOT RUN / 0 BLOCKED**، مصفوفة إنشاء 12 مسارًا × QC-01/02/03 كلها 200 وبصمات قدرات متطابقة، وقبول واحد حقيقي للـreceiving لكل شخصية.
  - Evidence: ثوابت جديدة أُثبتت حيًا: `quarantine.{release,hold}Receiving` على سجل حقيقي مملوك لـ`uat-qc-01` → `FORBIDDEN`؛ واجهة `/admin/users/new` تُرجع 200 لكل شخصية لكنها **تُخفي النموذج وتُظهر قسم الرفض**، و`admin.createUser` بـpayload صالح → `FORBIDDEN` للثلاثة مع **0** حساب مُنشأ في `qc.users`؛ تحرير مستخدم خارج النطاق يُرفض والسجل المُخزَّن يبقى غير متغيّر (`version=2`)؛ الدورة تبقى `IN_PROGRESS` وبوابة `uat` صفر صفوف. بوابات: unit `28 PASS` للوحدة الجديدة، typecheck 0 errors، architecture PASS.
  - State: PARTIAL (مرشّح محليًا) — NOT RUN: السلسلة الكاملة بالاعتماد المزدوج + التوقيع الإلكتروني (بند 3)، return-for-correction (4)، stage-skip/edit-after-APPROVED/owner override (5 الباقي)، lock+REOPEN (6)، وتأكيدات التدقيق لكل انتقال (7)؛ وإنشاء مسودات لكل نوع تقرير. Key files: `scripts/uat/run-uat-scenarios.ts`, `scripts/uat/scenario-support.ts`, `tests/unit/uat-evidence/uat-scenario-support.test.ts`, `audit/2026-09-19/QC-100-FINAL-004-task7-uat-scenarios.md`.

### قواعد قياس سلبية ثابتة (تسري على أي تدقيق/أتمتة قادمة)
- **رمز الحالة ليس دليل صلاحية:** صفحات delivery الافتراضية في هذا المشروع default-deny، فقد تُرجع 200 وتُخفي النموذج. الدليل يكون على المحتوى المُصيَّر أو على المنع في طبقة الاستخدام (use case).
- **رفض قبل التصريح ليس دليلًا:** رفض بسبب تحقق مدخلات أو سجل غير موجود (`BAD_REQUEST`) لا يُحتسب أبدًا كإثبات رفض صلاحية؛ يُسجَّل `INCONCLUSIVE/NOT RUN`. اختبار سلبي بلا سجل حقيقي أو بلا ضابط موجب = لا دليل.
- **2026-09-19 — Mind rollover (QC-100-FINAL-004 Task 7):** نُقل سجلا التدقيق التحريري (`Editorial revision` و`QC-MIDPOINT-REBASE-001`) إلى أعلى `02-mind-mid.md` بعد التحقق من نسخهما، إذ كان `01` عند الحد؛ أقسام الحالة والـinvariants والـblockers لم تُمس.
- **Fresh QC-100-FINAL-001 recheck (2026-09-19, candidate `31ab21a70ca479e8735d04835b5df62cafc9bc5a`, clean `main`):** Render deploy `dep-dan2jvfavr4c73a29r50` is `live` on exact SHA; live/ready 200, release identity 401, Reject unauthenticated 303. Config diverges (rust, empty health path, commit trigger, disabled subdomain, startup owner grant); RELEASE(0/6), AI(0/8), OTEL(0/2) absent; NODE_VERSION key present but value not revealed (Blueprint expects 24.20.0). Domain names present; verification not checked. DB Free expiry `2026-10-05`; PITR/exports unavailable, zero exports, one default credential; Production unprotected. No production DB access; canonical checks BLOCKED by rotation gate and absent local canonical URL. CI `35426396304` failed before steps due billing lock. PARTIAL / BLOCKED; `audit/2026-09-19/QC-100-FINAL-001-production-parity-recheck.md`.
- **Fresh local QC-100-FINAL-007 (2026-09-19, candidate `daf513ea3f2620f88cee1041bb8cf4ca04273fde` + untracked `scripts/performance/` harness):** representative PERF- dataset re-seeded (25 users / 3000 tasks / 8000 receiving / 2500 inspections / 1800 lab / 1200 reject / 2500 notifications / 12000 audit); EXPLAIN (ANALYZE, BUFFERS) 9 statements all <30 ms, batched reads not N+1, no duplicate dashboard SQL, seq-scan risks on unbounded `/tasks` + receiving scan; authenticated vitals 8 routes (LCP ≤360 ms, CLS 0, JS ~2.9 KB, WASM 0; INP NOT VERIFIED); smoke 11 paths TTFB p95 ≤168 ms except `/tasks` 1.26 MB unbounded; read concurrency to c=24 p95 ≈538 ms zero errors (single shared pool max-10 saturation signature); concurrency suite 12/12 PASS; rate-limit mechanism 5/60s→THROTTLED in-process, production values deferred; outbox single-drain PASS, pressure NOT RUN; logs+correlation+secret-scan PASS; metrics export NOT VERIFIED (no-op providers, no /metrics); alert delivery NOT RUN (OPEN); §6 budgets PROPOSED only (PRD-DD-004/005 still deferred). State: PARTIAL. Evidence: `audit/2026-09-19-QC-100-FINAL-007-performance-capacity-monitoring.md`.
- **Fresh QC-100-FINAL-003 candidate run (2026-09-19):** exact built candidate `bb42d6b51dc2754901dca6f84c4351c6ed36b766`, build `qc-closure-bb42d6b51dc2`, migration head `0030_reject_reports_role_parity`, disposable local PG18.6 equivalent, five `verify-*` personas plus untouched `yazeed`; machine evidence `11 PASS / 10 FAIL / 16 SKIP`. Authenticated closure remains **NOT VERIFIED / PARTIAL**. The run reproduced unsafe login `returnTo`; candidate fix is now in `src/pages/login.astro`. Full representative workflow records were not seeded, so required domain IDs were absent. Evidence: `audit/2026-09-19-QC-100-FINAL-003-authenticated-e2e.md` and `.ci-results/qc-100-final-003-authenticated-e2e-evidence.json`.
- **Fresh local QC-100-FINAL-010 (2026-09-19, candidate `f87ffe107426bc988e1e1e88eed3c5945ce3cb8d` + dirty tree):** focused authorization/security negative matrix `63/63 PASS`; `pnpm test:security` `51 PASS + 1 SKIP`, with the PostgreSQL rate-limit case BLOCKED by unavailable Testcontainers and an existing local PostgreSQL process preventing the disposable fallback. Frozen offline install/lock integrity PASS. Dependency audit produced no network result; SBOM tool and dedicated secret scanner unavailable. Privacy classification/retention/deletion/correction/export/AI-processing approvals remain NOT VERIFIED/open. Evidence: `audit/2026-09-19-QC-100-FINAL-010-security-privacy-supply-chain.md`.
- **Fresh local QC-100-FINAL-009 (2026-09-19, candidate `95d1380f2f463bad911d6ee041ae6a7f45cbf897`):** AI adapter/application-focused suite `4 files / 66 PASS`, Prettier PASS, typecheck `821 files / 0 errors / 72 hints`; runtime Node `24.19.0` is below the declared `24.20.0` minimum. Mocks cover Groq→Gemini bounded failover, 12-second timeout, error classes and sanitized fallback; no provider request was sent. Live Groq/Gemini/models/failover, approved external-processing scope and human reviewer evidence remain NOT RUN/BLOCKED. Evidence: `audit/2026-09-19/QC-100-FINAL-009-ai-provider-verification.md`.
- **Fresh local (QC-100-FINAL-002, candidate `e30285c…`):** install/format/lint/typecheck/architecture/tech-debt/diff-check/build/release PASS on Node `24.20.0` + pnpm `11.25.0`; unit83 files/564 PASS; integration87 files/353 PASS (Reject ambiguous-status SQL fixed); migrations29 PASS; concurrency12 PASS (stability 15/15 runs after re-contracting the loser codes); security52 PASS; schema77 tables/0 orphans. E2E48 PASS/19 FAIL/107 SKIP unchanged (Docker-only authenticated runner). Fixture seed/cleanup against the disposable PG 18.6 PASS. Details: `audit/2026-09-18-qc-100-final-002-verification-gates.md`.
- **QC-100-FINAL-016 live re-verification (2026-09-18, read-only, 36 route families + 18 targeted URL probes):** serif/`Times` fallback on **every** surface incl. `/login`; dashboard + quarantine KPI drill-down params `?inspectionResult=`/`?workflowState=` silently ignored (`?state=` works); topbar identity is the internal UUID with role `Authenticated user`; CSP blocks dotlottie WASM on every page **and** the inlined enhancement scripts on `/ai-advisory` (request flow dead; the build emits a bare `<script>` with unprocessed TS) and `/account` (password toggle inert); `/account` renders outside the app shell; `/quality/{capa,ncr}/new` are registry routes with no page file and render detail pages; the control-center migration card reads `DRIFT DETECTED · applied 0018 · expected 0018 · 11 pending`; `/admin/users/<self>` says “No roles are assigned” while the owner console lists `ADMIN, SYSTEM_OWNER`; `/reject-reports` still `500`. 31 classified findings (P1 5 / P2 16 / P3 10) in `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`. Limits: single role (`yazeed`), bootstrap-only data, no AT/human UAT, deployed SHA `UNVERIFIED`. Indicator deliberately unchanged at `29.0%`.

- **2026-09-19 — QC-100-FINAL-004 / Task 6: Local UAT environment bring-up (candidate-side)**
  - Changed: لا تغيير في الكود؛ أُنشئت قاعدة UAT نظيفة `qc_uat_bringup` على عنقود PostgreSQL 18.6 المصرفي المعتمد (`scripts/db/disposable-postgres.sh`، TLS verify-full على `127.0.0.1:55432`) بدل تدمير قواعد الأدلة السابقة، ثم نُفّذت السلسلة كاملة من الصفر: `db:preflight` → `db:migrate` 0001→0031 → `db:seed:foundation` → `bootstrap:admin` (yazeed) → `access:grant-system-owner` → `uat:seed` (Task 4) → `db:migrate:check` → `db:schema:check` → `pnpm dev`. سُجِّلت كتلة الهوية: gitSha `04004eec154d4ddb4bd512c144d8efba05b23bae`، buildId `uat-bringup-04004eec154d`، releaseId `rel-7198ea06be34b164`، applicationVersion `0.1.0`، migration head `0031_qc_creation_parity_two_stage_approval` (checksum `44b160a6…`)، environment `test`.
  - Evidence: preflight PASS (0/31)، migrations 31/31 `pending []`، foundation 4 roles / 205 permissions / 252 role-permissions، owner grant `205 canonical permissions + GLOBAL`، 5 حسابات `uat-*` ACTIVE بنطاق `TEAM:QC-UAT-TEAM` وانتهاء `2026-09-22T13:52:36+03` وإعادة seed idempotent، migrate:check `{"status":"ok","migrations":31}`، schema:check `31 / 77 tables / 0 orphans`. على الخادم الحي: `/` 302، `/login` 200، `/api/health/live` و`/api/health/ready` 200 `healthy`، و`/dashboard`+`/system/health` 303 لغير المصادق؛ ودخول حقيقي لـ`uat-qcm` عبر `POST /login?_astroAction=login` أنشأ صف `qc.sessions` وأعاد `/dashboard` و`/approvals` و`/quarantine/receiving` بـ200 مع هوية `uat-qcm / Manager`، وEMPLOYEE = 53 صلاحية مع **0** approve/sign. حراسات الـseed رُفضت فعلًا (host شبيه بالإنتاج، `NODE_ENV=production`، غياب `QC_SEED_ALLOW_NON_PRODUCTION`).
  - State: DONE للنطاق المحلي (bring-up + identity block) / PARTIAL للهدف الأوسع: Task 7–8 وUAT البشري والعلامة و`uat` gate تبقى مفتوحة و`UNVERIFIED`. **ملاحظة تشغيلية للأتمتة:** الحسابات المزروعة تحمل `must_change_password = TRUE` (نفس سياسة verification fixtures) فعلى Task 7 إكمال/تجاوز بوابة أول دخول بعد المصادقة.
  - Key files: `audit/2026-09-19/QC-100-FINAL-004-task6-local-uat-bringup.md`, `audit/2026-09-19/QC-100-FINAL-004-task6-uat-bringup-evidence.json`, `scripts/db/disposable-postgres.sh`, `package.json`.
- **2026-09-19 — QC-100-FINAL-004 / Task 5: UAT evidence ingestion module (DONE, verified locally)**
  - Changed: أُغلق مسار الإدخال المُوثَّق عبر إصلاحين حقيقيين: (1) **عقد الهوية** — كل دوال المستودع العامّة تتعامل مع دورة UAT بمعرّف الأعمال `qc.uat_cycles.cycle_id` فقط، وحُذف `getCycle()` ذو المفتاح UUID من الـport والتنفيذ وfake الاختبارات، وتم توحيد الموضعين الداخليين اللذين كانا يمرّران الـUUID الداخلي؛ (2) **نافذة التنفيذ** — معاملة القبول كانت تكتب `execution_ended_at` بلا `execution_started_at` فتُخالف قيد `uat_cycles_check`؛ الآن تُشتقّ البداية من أدلة حقيقية (البداية المسجّلة أو `started_at` لأقدم جلسة أو لحظة إعادة المصادقة). أُصلحت أيضًا 3 معرّفات توقيع في اختبار التكامل كانت بلا hex صحيح، وadّعاء عدّ تدقيق خاطئ (4 صفوف بالضبط: دورة + جلستان + عيب).
  - Evidence: integration `tests/integration/uat-evidence` **8/8 PASS** (كان 1/8) على قاعدة PG 18.6 مصرفية جديدة، وunit `tests/unit/uat-evidence` 17/17، وtypecheck 0 errors، وarchitecture PASS، وunit release-governance+authorization+approvals `70/70`، وintegration release-governance+database `9 files / 34 PASS`. إثبات حي عبر الـCLI على `qc_uat_bringup`: `create-cycle` → جلستان آليتان → عيب واحد → `show` (IN_PROGRESS، humanSessionCount 0، gate UNVERIFIED)، ومحاولة `accept` رُفضت، والحقيقة في القاعدة: `acceptances=0 gate_rows=0 signatures=0` مع audit `UAT_CYCLE_CREATED/UAT_SESSION_RECORDED×2/UAT_DEFECT_RECORDED`؛ وحراسة CLI رفضت `DATABASE_URL` شبيهًا بالإنتاج.
  - State: DONE للمسار المحلي (منشئ → جلسات → عيوب → قراءة، والقبول fail-closed). **قرار مالك مفتوح:** القبول يستخدم `scope: {}` على `UAT_CYCLE` تمامًا كما في `ApproveReleaseUseCase`، ولأن GLOBAL وحدها تمر مع `scope: {}` فإن مدير بنطاق TEAM (شخصية `uat-qcm` في Task 4) يُرفض بـ`AUTHZ_SCOPE_DENIED`؛ أي أن العلامة البشرية ستُنفَّذ من المالك المسمّى ما لم يُعتمد منح GLOBAL للـQCM. لا يوجد ولا يجوز أن يوجد cycle مقبول أو `SIGNED_UAT_CYCLE` بلا جلسات بشرية حقيقية.
  - Key files: `src/modules/uat-evidence/{ports/repository.ts,infrastructure/postgres-repository.ts,application/use-cases.ts}`, `tests/integration/uat-evidence/uat-evidence-ingestion.test.ts`, `audit/2026-09-19/QC-100-FINAL-004-task5-uat-ingestion-closure.md`.
- **2026-09-19 — QC-100-FINAL-004 / Task 4: Six real UAT users + RBAC seeding (candidate-side)**
  - Changed: أُنشئت سكربتات `scripts/uat/seed-uat-personas.ts` و`scripts/uat/cleanup-uat-personas.ts` بنمط `scripts/verification/`، مع fixture عقدي `tests/fixtures/uat-personas.ts` (6 أشخاص: yazeed verify-only + 5 قابلين للحذف `uat-*`: uat-qcm=MANAGER، uat-supervisor=SUPERVISOR، uat-qc-01/02/03=EMPLOYEE بنطاق TEAM مشترك `QC-UAT-TEAM` وانتهاء 72h)؛ حراسات fail-closed (NODE_ENV + `QC_SEED_ALLOW_NON_PRODUCTION` + `QC_UAT_SEED_ALLOW` + رفض hostnames إنتاجية + كلمة مرور ≥16 حرفًا عبر `QC_UAT_*` فقط بلا تسجيل)؛ post-seed assertions تقارن الصلاحيات الفعالة (مسار resolveActor) بالـbundle الأساسي وتفحص ACTIVE/scope، مع EMPLOYEE بصلاحيات approve/sign = صفر؛ أُضيفت `pnpm uat:seed`/`uat:clean` وأسماء env في `load-local-env.ts` و`.env.example`؛ كل كتابة audited (`UAT_FIXTURE_PROVISIONED`/`CLEANED_UP`). لا تغيير schema.
  - Evidence: unit `tests/unit/authorization` 3 ملفات/21 PASS (منها 7 جديدة)؛ typecheck `9 errors` (كلها الأخطاء القائمة الموثّقة من Task 2، ملفات Task 4 صفر أخطاء)؛ eslint/prettier PASS على الملفات الملموسة؛ architecture PASS؛ دورة حية كاملة على PostgreSQL 18.6 مصرفي (migration head 0031 + foundation seed + bootstrap yazeed + owner grant 205 perms): seed PASS مع assertions، إعادة seed idempotent، الـDB أظهر 5 حسابات ACTIVE بأدوار صحيحة وانتهاء 2026-09-22 ونطاق TEAM، uat-qc-* = 53 صلاحية/0 approve-sign، uat-qcm = 64/5، uat-supervisor = 85/4، حراسات الإنتاج/العلامة الناقصة/كلمة المرور القصيرة رفضت فعليًا، cleanup عطّل الحسابات الخمسة وأبقى yazeed ACTIVE، وإعادة الإنشاء بعد cleanup تعمل. **اكتشاف مثبت أثناء التحقق:** assertion المساواة الكاملة للـSYSTEM_OWNER فشلت لأن `FOUNDATION_ROLE_PERMISSIONS.SYSTEM_OWNER` حزمة bootstrap أصغر من فعليّات yazeed (205 عبر 0030/owner grant) — صُحح الـassertion لـACTIVE + SYSTEM_OWNER + GLOBAL بدل المساواة.
  - State: DONE (محليًا على قاعدة UAT مصرفية) / PARTIAL لما بعدها: Task 5–7 (evidence ingestion، bring-up الكامل، scenarios) وUAT البشري والعلامة تبقى BLOCKED.
  - Key files: `scripts/uat/seed-uat-personas.ts`, `scripts/uat/cleanup-uat-personas.ts`, `tests/fixtures/uat-personas.ts`, `tests/unit/authorization/uat-personas.test.ts`, `scripts/db/load-local-env.ts`, `.env.example`, `package.json`.
- **2026-09-19 — QC-100-FINAL-004 / Task 3 (DONE):** نقاط Issue Slip إلزامية التسلسل `SUPERVISOR→QC_MANAGER→FACTORY_DIRECTOR` في الـdomain والـuse case؛ منشئ EMPLOYEE لا يؤكد نقطة أعلى من نقطته ولا يتجاوزها أي دور. Unit `20 PASS` + integration `6/6 PASS`. Key files: `src/modules/reject-reports/domain/issue-slip.ts`, `application/{confirm-issue-slip-approval,view-model}.ts`, `tests/unit/reject-reports/*`. (ملاحظة typecheck القديمة «9 أخطاء قائمة» سُوّيت لاحقًا في Task 8: صارت 0.)
- **2026-09-19 — QC-100-FINAL-018 / Humanized UX writing & content simplification (candidate-side)**
  - Changed: توحيد المفردات في `ux-vocabulary.ts` (`errorClasses` ستة أصناف، `scopeKindLabels`، `severityLabel()`)؛ إنسانة الحالات الخام عبر `stateLabel`/`severityLabel` في findings/equipment/calibrations/maintenance/inspections/backups/search؛ إصلاح روابط 404/500 المكررة؛ تسميات scope kinds بشرية في إنشاء الأعضاء؛ دليل `Documents/UX-WRITING-GUIDE.md`؛ اختبارات `tests/unit/ui/ux-writing-contract.test.ts`. لا تغيير على عقود خادمية أو المصطلحات المنظمة أو الـE2E pins.
  - Evidence: typecheck 820/0 errors؛ targeted UI contracts 44/44 PASS؛ unit 593 PASS + فشل واحد بيئي قائم (`QC_VERIFY_*` env)؛ architecture PASS؛ lint PASS. Browser accessibility وE2E المصادق NOT RUN (لا fixture بيئة).
  - State: DONE (مرشّح محليًا) / PARTIAL للـbrowser accessibility وE2E المصادق وUAT.
  - Key files: `src/shared/copy/ux-vocabulary.ts`, `docs/ui/UX-WRITING-GUIDE.md`, `tests/unit/ui/ux-writing-contract.test.ts`, `audit/2026-09-19-QC-100-FINAL-018-UX-WRITING-HANDOFF.md`.
- **2026-09-19 — توحيد الوثائق في `Documents/` (DONE):** شجرة `docs/` كاملة نُقلت مسطّحة إلى `Documents/`؛ أي مسار قديم بصيغة `docs/...` في هذه الذاكرة تاريخي. Key file: `Documents/DOCUMENTATION-INVENTORY.md`.

- **QC-100-FINAL-016 remediation (candidate-side, 2026-09-19):** رُفعت كل نتائج التدقيق الحي في الكود المرشّح مع أدلة محلية: `font` لا يعيد تعيين `body` (زال fallback الـserif) + أرضية قراءة 12px + هدف 44px؛ روابط KPI تستخدم بارامترات مدعومة مع شرائح فلتر مطبّقة (`inspectionResult`/`releaseState`/`workflowState` server-side على Receiving/Inspections)؛ هوية الشريط العلوي من الشريط = login identity + role/scope مشتقّة server-side (`scope-description.ts`)؛ `/reject-reports` صار يعلن حالته بصدق بدل 500، وقرار المالك: **إسقاط طبقة Lottie** — ونُفّذ + اختبار يفشل عند أي طلب runtime؛ سكربتات الصفحات أُخرجت من inline (CSP) و`/account` داخل AppLayout؛ migration card يستخدم buildHead/expectedHead بلا relabel؛ `/quality/{ncr,capa}/new` لهما صفحات إنشاء؛ وبقرار المالك صار `yazeed` قادرًا على الإنشاء عبر migration `0030_reject_reports_role_parity` (يرمّم bundle الـSYSTEM_OWNER الموجود ويمنح ADMIN كود الاسترداد) مع اختبار upgrade path. أدلة: typecheck 0 errors، unit 563/563 (83 ملف)، integration مركّز على PostgreSQL 18 مصرفي محلي/TLS 39+4+2+15 PASS، build PASS، lint 0 errors، migration integrity 30. `PASS ≠ RELEASED`: لا نشر، لا migration على الإنتاج، هوية الإصدار ما زالت UNVERIFIED، والتدقيق الحي على النسخة الجديدة وUAT البشري ما زالا مفتوحين. تفاصيل: القسم 13 في `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`.
- **Fresh authorized live owner read:** login/dashboard/system-health/control-center200; live/readiness200 healthy; migration projection0018/pending11, expected console0018 misleading versus source0029; internal release/build/Git/environment UNVERIFIED; Reject500. Explicit axe35 rulesPASS/3 incomplete/1 serious label-in-name node; narrower zero-violation scan superseded. Not six-persona E2E or human UAT. No password saved in deliverables.
- **Audit/plan:** overall46.7%(previous52.6); production mandatory-gate completion1/19=5.3%(previous30.0), NO-GO/PARTIAL. Disclosed rubric judgment, not statistical feature completion.16 findings(7P0/7P1/2P2); existing bilingual36-section/80-domain reports and15-prompt HTML refreshed, closure tasks not executed. Copy/Copied/expand-collapse and320/768/1440 light/dark UI PASS.
- **External gates:** CI35325572254 exactHEAD / Verify105537703598 /0 steps /billing lock, not code-test FAIL or PASS. Prior provider deployedSHA observation remains historical valid evidence; no fresh provider API/direct production DB connection here. Credential rotation, populated DR, signed human UAT, live AI and production parity remain open. Latest detailed evidence: audit/2026-09-18-ULTIMATE-COMPREHENSIVE-SYSTEM-AUDIT{,-AR}.md.
- **2026-09-19 — QC-100-FINAL-017 / Dashboard command center on real read models (candidate-side)**
  - Changed: `/dashboard` أُعيد بناؤه ليقرأ 7 action counts من use cases الدومينات نفسها (approvals/notifications/receiving HOLD/inspections RETURNED/tasks due+overdue/calibrations OVERDUE) + quarantine flow من `GetQuarantineOverviewUseCase` + attention queue بسباب وعمر ورابط مباشر + coverage من read model؛ أُضيف فلتر Tasks خادمي `due=overdue|today` مع شرائح مرئية، وأُزيل N+1 من tasks list، ودفع فلاتر inspections register إلى SQL مع batched loads، ومُنحت `KpiCard` قيمة `null` صريحة، ومابر وجهة الإشعارات صار مشتركًا (`notification-destination`).
  - Evidence (أُعيد التحقق على الحالة النهائية): typecheck `819 files / 0 errors`؛ architecture PASS؛ unit `85 files / 580 PASS` (فشل ملف واحد فقط إذا بقيت أسرار `.env` المحلية `QC_VERIFY_*` في البيئة — قيد بيئي لا يخص الـdiff)؛ build PASS؛ PostgreSQL 18.6 مصرفي: migrations `8 files/29 PASS`، وdashboard rollup `9/9` + dashboard-query `2/2` + audit-dashboard-parity `9/9` + register-bounds `3/3` (عدد statements ثابت مع نمو الجدول؛ snapshot = 8 statements في bench والحد الأقصى 30). 4 ملفات pre-existing فاشلة على قاعدة جديدة أيضًا ولا يمسّها هذا الـdiff (search-scope/reporting/system-owner-upgrade-parity `Migration checksum mismatch for version 0030`/control-center). ملاحظة تشغيلية: **`notification-outbox-delivery` يفشل فقط عند إعادة استخدام قاعدة `qc_test` الملوثة عبر suites (`outbox.claim(10)` يستهلكه صفوف سابقة) ويمرّ على قاعدة جديدة** — لا تعتبره انحدارًا في هذا الـdiff. التفاصيل: `audit/2026-09-19-qc-100-final-017-dashboard-command-center.md`.
  - State: DONE (مرشّح محليًا) / PARTIAL للـbrowser وE2E المصادق عليه وUAT والنشر/قياس الأداء بالحجم (Task 007).
  - Key files: `src/modules/dashboard/**`, `src/modules/dashboard/application/dashboard-sources.ts`, `src/pages/dashboard/index.astro`, `src/pages/tasks/index.astro`, `src/modules/tasks/{ports,infrastructure}/`, `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts`.
- **2026-09-19 — Mind rollover (QC-100-FINAL-004 Task 3):** نُقل سجلا `2026-09-18` (QC-CLOSURE-005 وQC-CLOSURE-001) إلى أعلى `02-mind-mid.md` بعد التحقق من نسخهما، إذ كان `01` على 503 سطر؛ أقسام الحالة الحالية والـinvariants لم تُمس.
- **2026-09-19 — QC-100-FINAL-016 / Live UX findings remediation (candidate-side)**
  - Changed: عولجت نتائج التدقيق الحي داخل الكود المرشّح فقط: P1 الخمسة (fallback الـserif، عقد drill-down للـKPI، هوية الشريط العلوي، صحة `/reject-reports`، سكربتات CSP) وP2/P3 بحسب القسم 13 من الأثر؛ أُضيفت migration `0030` لتمكين `yazeed` من إنشاء تقارير الرفض وقرار المالك بإسقاط طبقة Lottie.
  - Evidence: typecheck `0 errors`؛ unit `83 files / 563 PASS`؛ integration مركّز على PostgreSQL 18 مصرفي محلي/TLS `39 + 4 + 2 + 15 PASS`؛ build PASS؛ lint 0 errors؛ migration integrity `30`؛ E2E المصادَق عليه وDocker ما زالا BLOCKED.
  - State: DONE (تعويض مرشّح مُتحقَّق منه محليًا) / PARTIAL لنشر النسخة والتدقيق الحي وUAT البشري.
  - Key files: `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md` (§13), `db/migrations/0030_reject_reports_role_parity.sql`, `src/ui/styles/global.css`, `src/shared/copy/ux-vocabulary.ts`, `src/pages/quarantine/{receiving,inspections}/index.astro`.
- **2026-09-19 — QC-100-FINAL-005 follow-up / Quarantine KPI alignment + approved trend series (candidate-side)**
  - Changed: مؤشرات `/quarantine` صارت projection لنفس سجل Receiving الذي تفتحه روابطها (لا `created_by` counters) بعقد `numerator`/`state`/`actorScope`/`timeWindow` مشترك عبر `KpiCard`؛ "Awaiting inspection" انقسمت لبطاقتين وHOLD لبطاقتين بمعنى واحد لكل رابط؛ فلتر `receivedOn=today` مدعوم خادميًا؛ و`AUTHORIZATION` منفصل عن انقطاع المزوّد. أُضيفت أول series خادمية معتمدة (Receiving per day، grain/numerator/unit/window/zero معلنة) على `/dashboard` بحالات `AVAILABLE|EMPTY|UNAVAILABLE|NOT_SUPPLIED` ولا نقاط إلا في `AVAILABLE`.
  - Evidence: typecheck `813 files / 0 errors`؛ unit `85 files / 579 PASS`؛ architecture PASS؛ eslint على المسارات المعدّلة `0 errors`؛ PostgreSQL 18.6 مصرفي: `overview-parity 6/6` (يُنفذ register لكل href ويقارن العدّ) + `read-models 7/7` + `dashboard 19/19` + migrations `29` + concurrency `12`. NOT RUN: `pnpm build` وbrowser. التفاصيل: `audit/2026-09-19-qc-100-final-005-quarantine-kpi-alignment-and-approved-trend.md`.
  - State: DONE (مرشّح محليًا) / PARTIAL للـbuild/browser/نشر/UAT.
  - Key files: `src/modules/quarantine/application/get-receiving-trend.ts`, `src/modules/dashboard/application/dashboard-series.ts`, `src/modules/quarantine/application/get-quarantine-overview.ts`, `src/pages/quarantine/index.astro`, `tests/integration/quarantine/overview-parity.test.ts`.
- **2026-09-19 — QC-100-FINAL-005 / Dashboard & shared user experience repair (candidate-side)**
  - Changed: عقد KPI صريح (`numerator`/`state`/`actorScope`/time window) + rollup واحد يغذّي `Pending review` و`/approvals` وdecision queue بشدة مشتقة؛ فلتر `ownership=mine` مدعوم خادميًا في سجلي Receiving/Inspections وتستعمله روابط الـKPI؛ فشل الـapprovals أو خطأ `AUTHORIZATION` لا يتحولان إلى `0`/انقطاع مزوّد؛ أرضية 12px وهدف 44px؛ وإصلاح انحدار architecture كان قائمًا على HEAD (domain import في صفحة Inspections).
  - Evidence: typecheck `809/0 errors`؛ unit `84 files / 571 PASS`؛ architecture PASS (كان FAIL)؛ migration integrity `30`؛ build/release-identity/tech-debt/diff-check PASS؛ PostgreSQL 18.6 مصرفي `14 files / 49 PASS` ومنها populated drill-down parity؛ browser مصادق مصحوب ببيانات: 200 وعدد صفوف = قيمة الـKPI، `Inter`، أول عنوان `H1`، `0` عقدة `<12px`، `0` overflow، `0` wasm/lottie/console. التفاصيل: `audit/2026-09-19-qc-100-final-005-dashboard-shared-ux-repair.md`.
  - State: DONE (مرشّح محليًا) / PARTIAL للنشر وE2E المصادق عليه وUAT.
  - Key files: `src/modules/dashboard/**`, `src/pages/dashboard/index.astro`, `src/ui/charts/KpiCard.astro`, `src/pages/quarantine/{receiving,inspections}/index.astro`, `tests/integration/dashboard/dashboard-rollup.test.ts`.
- **2026-09-18 — QC-100-FINAL-001 / Production PostgreSQL & Render parity closure**
  - Changed: re-verified provider, release-identity, and live behaviour read-only; decided the production-migration gate and stopped at **PRODUCTION MIGRATION = BLOCKED**; corrected the stale "no commit identity" record; documented the parity drift and the startup privilege mutation.
  - Evidence: deployed SHA `298e307721af97d9c1bd22279d0c784fbf5b62a8` = current HEAD (deploy `dep-damfhv8u01pc738s4430`, `live`) and live `/api/health/{live,ready}` `200 healthy`; controlled disposable PG 18.6 reached `0029` with 29 migrations / 77 tables / 0 orphans / zero-op re-run; provider divergences: runtime `rust`, empty health path, `autoDeployTrigger commit`, `renderSubdomainPolicy disabl [HISTORICAL detail retained in referenced audit.]
  - State: PARTIAL / BLOCKED (governance gate, not an execution failure).
  - Key files: `audit/2026-09-18-qc-100-final-001-production-parity-closure.md`, `docs/operations/RENDER-DEPLOYMENT.md`.
- **2026-09-18 — QC-CLOSURE-018 / Full repository read + documentation synchronization**
  - Changed: synchronized current README, architecture/route/authorization/data/testing/UAT/security/deployment documents; added the 85-route matrix, documentation inventory, and extensibility guide; preserved historical audits and marked superseded Render/performance records.
  - Evidence: source freeze `7cb266c248be08765f04896ee8618969bd551e07`; 83 physical pages, 85 route declarations, 18 modules, 29 source migrations; local links resolve with no missing targets.
  - State: PARTIAL / NO-GO because existing format/lint, PostgreSQL/container, CI, authenticated E2E, UAT, provider, and production recovery gates remain open.
  - Key files: `docs/architecture/ROUTE-MATRIX.md`, `docs/architecture/EXTENDING-THE-SYSTEM.md`, `docs/DOCUMENTATION-INVENTORY.md`.
- QC-CLOSURE-016 manual browser preflight is recorded in `audit/2026-09-18-qc-closure-016-real-uat-human-validation.md`. The live login page, unauthenticated protected-route redirects, and safe invalid-login recovery were observed manually; no real Employee/Inspector/Supervisor/Manager/Administrator/yazeed participant session, approved staging/UAT environment, authenticated workflow, mobile session, or human sign-off was available. UAT remains **BLOCKED / UNVERIFIED**; preflight is not UAT evidence.
- **2026-09-18 — QC-DASHBOARD-LIVE-REVIEW-001 / Live dashboard UX review (read-only)**
  - Changed: no code changes; produced `audit/2026-09-18-dashboard-live-review.md` from an authenticated live review of `https://qclevel.top/dashboard` as `yazeed` (browser automation).
  - Evidence: 14 findings. Top: authenticated pages render in Times (serif) because `body,button,input,select,textarea{font:inherit}` (`src/ui/styles/global.css:132-137`) overrides the earlier `body{font-family:var(--font-sans)}` (verified in dist order 5813<6983 and by rendered width probe); KPI drill-downs `/quarantine/receiving?inspectionResult=HOLD` and `?workflowState=RELEASED` are silently i [HISTORICAL detail retained in referenced audit.]
  - Also: `/reject-reports` returns **500** on live (missing `0026` tables; Render applied head is `0018`) while all other reviewed pages return 200; the file also carries a data-linked enhancement backlog (quarantine overview/distributions, quality overview, `/reports/quarantine-aging` server-side filters as the working drill-down, calibration `OVERDUE` filter) and chart-ready sources (reject `analytics.trend/byItem/byDepartment/byReason`).
  - State: DONE (review only; no production/UAT claim).
  - Key files: audit/2026-09-18-dashboard-live-review.md.
- **2026-09-18 — QC-CLOSURE-017 / Independent final 80-domain closure audit**
  - Changed: recalculated an 80-domain evidence matrix from the frozen exact HEAD `a6876f0fb0de6acbead7f62b3d1fbdf6c61e5de7`, without carrying prior scores as conclusions.
  - Evidence: unit `83 files / 564 PASS`, typecheck `0 errors`, architecture/build/release identity PASS; format FAIL, lint FAIL (19 errors), integration/migration/concurrency/security DB paths and authenticated E2E blocked by unavailable Docker runtime; provider/Render, restore, exact-head CI, PostgreSQL applied state, and signed UAT remain unverified.
  - State: PARTIAL / BLOCKED / NO-GO. Fresh score `2,638 / 80 = 32.98/100`; closure-level domains `0/80`.
  - Key files: `audit/100-percent/QC-CLOSURE-017-FINAL-80-DOMAIN-AUDIT.md`.
- QC-CLOSURE-015 evidence is recorded in `audit/2026-09-18-qc-closure-015-backup-restore-deployment-production-evidence.md`. A real local PostgreSQL 18.6 logical backup and restore passed on 77 tables / 29 migrations with 0 unvalidated FKs; negative recovery cases fail closed. Populated audit/signature/evidence/session/release-record recovery is not verified because the disposable dataset had zero rows in those tables. `qclevel.top` live/readiness GET checks returned 200 and TLS was valid, but deployed release identity, runtime environment, logs, and provider backup/retention/PITR/WAL/RPO/RTO remain **NOT VERIFIED / BLOCKED / POLICY DECISION REQUIRED**.
- **2026-09-18 — QC-CLOSURE-016 / Real UAT, Usability & Human Validation**
  - Changed: recorded manual live preflight observations and the complete required persona/scenario coverage as blocked; no fabricated participant results or sign-off were added to the UAT CSV templates.
  - Evidence: login page, anonymous `/dashboard`, `/system/health`, `/system/control-center` redirects, and safe invalid-login recovery observed through the browser. Real human role sessions, authenticated workflows, mobile use, stale-data recovery, and authorized sign-off remain unavailable.
  - State: PARTIAL / BLOCKED.
  - Key files: `audit/2026-09-18-qc-closure-016-real-uat-human-validation.md`.
- **2026-09-18 — QC-CLOSURE-015 / Backup, Restore, Deployment & Production Evidence**
  - Changed: added exact local backup/restore evidence and a disposable PostgreSQL portability setting (`dynamic_shared_memory_type = 'mmap'`) required on this host.
  - Evidence: PostgreSQL 18.6 dump `282,954` bytes, SHA-256 captured, restore parity `77/77` tables, ledger `29/29`, FK validation `0` invalid, focused recovery/catalog/health `35/35 PASS`; live domain/TLS/health verified. Production identity, provider capabilities, and populated controlled-record recovery remain unverified.
  - State: PARTIAL / NO-GO.
  - Key files: `audit/2026-09-18-qc-closure-015-backup-restore-deployment-production-evidence.md`, `scripts/db/disposable-postgres.sh`.
- QC-CLOSURE-013 evidence snapshot is recorded in audit/2026-09-18-qc-closure-013-testing-evidence.md for current HEAD ef1ec1aeb29e660a1455e88fbfe040bff19aa17d. It maps 15 critical requirements across implementation, unit, integration, PostgreSQL, security/negative, E2E, and UAT. The result is **PARTIAL / NO-GO**: typecheck, architecture, build, tech-debt, diff check, and the focused Issue Slip UI regression pass; full format/lint/unit, PostgreSQL-backed suites, browser E2E, system-owner check, exact-head CI, and UAT are not closed in this host. Test estate inventory: 83 unit files, 87 integration files, 29 E2E files, 28 skip markers, and 23 source-reading test/support files.
- QC-CLOSURE-014 evidence is recorded in audit/2026-09-18-qc-closure-014-performance-reliability-observability.md. The source now has batched admin grant reads, performance-supporting indexes, consistent response/log request IDs, structured telemetry, health/readiness, and sanitized dependency degradation. Local typecheck, architecture, build, focused 41-test suite, and observational smoke pass; representative PostgreSQL volume/EXPLAIN, browser performance, exporter/alerts, and production capacity evidence remain **NOT VERIFIED**.
- **2026-09-18 — QC-CLOSURE-014 / Performance, reliability & observability**
  - Changed: removed admin register/control-center authorization N+1 reads, added migration `0029` query indexes, and made request IDs consistent in HTTP responses and structured logs.
  - Evidence: focused `41/41 PASS`; typecheck, architecture, build, and local read-only smoke PASS; health readiness correctly returned sanitized `503` without database availability. Representative volume and production telemetry remain unverified.
  - State: PARTIAL / NO-GO for performance capacity or production observability claims.
  - Key files: `db/migrations/0029_performance_query_indexes.sql`, `src/middleware.ts`, `audit/2026-09-18-qc-closure-014-performance-reliability-observability.md`.
- QC-CLOSURE-013 fixed the presentation-contract regression in src/pages/reject-reports/issue-slips/[reportId].astro by replacing placeholder glyphs with CSS status dots; focused tests/unit/ui/icon-and-copy-contract.test.ts is 3/3 PASS. This is a local regression fix only and does not change the release decision.
- **2026-09-18 — QC-CLOSURE-013 / Testing architecture & evidence closure**
  - Changed: added the current requirement-to-evidence traceability register and test-estate audit; replaced Issue Slip placeholder glyphs with semantic CSS status dots.
  - Evidence: focused UI contract 3/3 PASS; typecheck, architecture, build, release tech-debt, and git diff --check PASS. Full gates remain PARTIAL/BLOCKED: format and lint fail on existing files/errors; unit was 563/564 before the focused fix; PostgreSQL suites cannot start without a container runtime; Chromium and system-owner:check are denied by host sandbox; UAT/CI remain unavailable.
  - State: PARTIAL / NO-GO.
  - Key files: audit/2026-09-18-qc-closure-013-testing-evidence.md, src/pages/reject-reports/issue-slips/[reportId].astro.
- Exact current HEAD: `95d1380f2f463bad911d6ee041ae6a7f45cbf897` on `main` with tree `8564646449aabd7692d79c58461494ba1037c0c2` (verified 2026-09-19; pre-existing user changes and QC-100-FINAL-008 working changes preserved). The last provider-verified deploy record bound `298e307721af97d9c1bd22279d0c784fbf5b62a8` (`dep-damfhv8u01pc738s4430`, `live`, finished `2026-09-18T08:43:07Z`); this candidate is **not** provider-verified and live release identity stays `UNVERIFIED` (QC-100-FINAL-016). Migration source head is `0030_reject_reports_role_parity`; it is still not applied to Render and was not runtime-applied against Render during this task. QC-100-FINAL-008 restored the candidate chain locally on disposable PostgreSQL 18.6: 30 migrations / 77 tables / 0 orphans.
- Fresh QC-CLOSURE-008 evidence: closure PostgreSQL suite `3/3 PASS`; focused asset suite `17/17 PASS`; migration/database suite `7 files / 26 tests PASS`; typecheck `0 errors / 68 hints`; build and architecture PASS; targeted ESLint PASS; `git diff --check` PASS. Full lint remains **BLOCKED** by existing Reject Reports errors outside this task. PostgreSQL verification used the approved disposable PostgreSQL 18 cluster (`scripts/db/disposable-postgres.sh`), not Testcontainers.
- **Render PostgreSQL — VERIFIED (read-only):** `dpg-dadqmsgn74is73b774j0-a` is the Render **database** id (not the web-service id) and is the internal hostname label; app database `qc_operations`, principal `qc_operations_user`, PostgreSQL 18.6, region oregon, **free plan expiring `2026-10-05`**. Canonical pool connects with TLS 1.3 and session `search_path=qc,pg_catalog`, `TimeZone=UTC`; `/api/health/ready` is `200 healthy` both for the built app against this database and for live `https://qclevel.top`. Data is bootstrap-only (1 user, 2 role grants, 4 audit events, 0 lab tests).
- **Render migration gap (blocker, re-verified 2026-09-18 by QC-100-FINAL-001):** the Render applied head was last verified as `0018`; it is **not re-verifiable now** because the ignored local `.env` contains **no canonical `DATABASE_URL`** (only a provider display export plus a non-canonical `Database_URL`), so `pnpm db:preflight` fails closed with a configuration error before connecting, and the canonical DB commands cannot run at all. The credential-rotation gate in `docs/operations/RENDER-DATABASE-CONNECTION.md` is **actively open**: constant-time digest comparison shows the live service's `DATABASE_URL` password is byte-identical to the documented-compromised local export credential, and the service uses the **External** URL. Applying migrations is therefore **prohibited**; source-relative pending is `0019`–`0029`. The only reusable production-side facts are provider-reported: database `dpg-dadqmsgn74is73b774j0-a`, `qc_operations`, principal `qc_operations_user`, PostgreSQL major `18`, free plan, expiry `2026-10-05T05:41:06Z`.
- **Render live service DIVERGES from `render.yaml` (re-verified 2026-09-18 by QC-100-FINAL-001):** `serviceDetails.runtime = "rust"` and `env = "rust"` (not `node`), empty `healthCheckPath` (not `/api/health/ready`), `autoDeployTrigger: commit` (not `checksPass`), `renderSubdomainPolicy: disabled` (Blueprint says `enabled`), and a start command that runs `SYSTEM_OWNER_LOGIN_IDENTITY=yazeed pnpm access:grant-system-owner; node dist/server/entry.mjs` before the server, i.e. authorization mutation during boot with a hardcoded identity and no fail-fast. The service `DATABASE_URL` is the **External** database URL with `ipAllowList 0.0.0.0/0`; all six `RELEASE_*` variables, all eight AI provider variables, and both OpenTelemetry variables are absent. **Corrected fact:** the deployed release SHA is now **VERIFIED**, not `NOT VERIFIED` — the provider deploy record binds commit `298e307721af97d9c1bd22279d0c784fbf5b62a8`, exactly the current source HEAD. `qclevel.top` (apex) and `www.qclevel.top` are both `verified` custom domains. Record: `audit/2026-09-18-qc-100-final-001-production-parity-closure.md`.
- Node locally is `v22.22.3`, outside the declared `>=24.20.0 <25` contract; local results are not runtime-parity evidence (the Render service pins `NODE_VERSION=24.20.0`). The prior Docker-backed authenticated Playwright run (`10 PASS / 10 FAIL / 16 SKIPPED`) remains historical; current-head E2E is **NOT VERIFIED** in this host. UAT remains unexecuted.
- GitHub `Verification CI` run `35325572254` for this exact HEAD is **FAIL** before any step (job `Verify`, 0 steps): GitHub annotation says, “The job was not started because your account is locked due to a billing issue.” This is an external account blocker, not a workflow/test failure; CI/E2E/release evidence remains **NOT VERIFIED**.
- Final independent audit decision remains `NO-GO`; details in `audit/100-percent/FINAL-100-DOMAIN-AUDIT.md` and `audit/100-percent/RELEASE-GATE-EVIDENCE.md`.
- QC-CLOSURE-010 source integration now has an approval-event outbox handler, replay-safe notification dedupe, lot/item/state report filters, and expanded cross-domain search identifiers. Focused tests/build/typecheck/architecture pass; PostgreSQL/outbox runtime evidence remains blocked by local shared-memory/Docker availability. Evidence: `audit/2026-09-18-qc-closure-010-cross-domain-integration.md`.
- Project-local PostgreSQL MCP configuration is present in `.codex/config.toml`: its launcher reads only the allowlisted canonical `DATABASE_URL`, maps it to `DATABASE_URI`, and starts `postgres-mcp` in restricted read-only mode. Live MCP/database handshake is **NOT VERIFIED** because the current local provider export is not an approved canonical URL and the credential-rotation gate remains open.
- QC-CLOSURE-012 security/privacy/AI safety is **PARTIAL**: deterministic focused security evidence is `67/67 PASS`, `typecheck` is `0 errors / 68 hints`, architecture and diff checks pass, and file uploads now enforce a 25 MiB ceiling plus safe/matching optional extensions. Full security closure remains blocked by missing Docker-backed PostgreSQL evidence, authenticated browser/CSRF/IDOR/XSS execution, exact-head CI, live provider verification, UAT/privacy retention evidence, and Node 22 versus the declared Node 24 contract. Evidence: `audit/2026-09-18-qc-closure-012-security-privacy-ai-safety.md`.
- **2026-09-18 — QC-CLOSURE-012 / Security, privacy & AI safety closure**
  - Changed: added defensive file upload size, filename-control-character, and optional-extension consistency validation with regression coverage; confirmed the advisory-only AI boundary, origin protection, session/cookie controls, headers, and redaction contracts.
  - Evidence: focused security `67/67 PASS`; Argon2id probe `m=19456,t=2,p=1`; typecheck `0 errors / 68 hints`; architecture and `git diff --check` PASS. Full security suite is `51 PASS / 1 skipped / 1 BLOCKED` because the PostgreSQL rate-limit test cannot start without Docker.
  - State: PARTIAL / NO-GO for full security closure.
  - Key files: `src/shared/files/file-service.ts`, `tests/integration/shared/files.test.ts`, `audit/2026-09-18-qc-closure-012-security-privacy-ai-safety.md`.
- **2026-09-18 — QC-CLOSURE-009 / Controlled records, templates, change control & signatures**
  - Changed: added migration `0028` with explicit inspection/laboratory template lifecycle checks, version-local inspection template content, append-only audit/signature/approval/change/snapshot evidence, and database guards preventing approved document/template content tampering; revision creation no longer mutates the shared historical template header.
  - Evidence: PostgreSQL 18 focused closure suite `6 files / 31 tests PASS`; includes migration engine, tamper/invalid-history negatives, e-signature, document review, change request, and template lifecycle coverage. Typecheck `0 errors`; architecture and `git diff --check` PASS. Testcontainers path was unavailable; disposable PostgreSQL path passed. Node `v22.22.3` remains outside the declared contract.
  - State: PARTIAL — source/integration closure verified locally; Render remains at `0018`, and UAT/provider/CI evidence remain open.
  - Key files: `db/migrations/0028_qc_closure_009_controlled_records.sql`, `src/modules/quarantine/templates/infrastructure/postgres-repository.ts`, `tests/integration/database/controlled-record-integrity.test.ts`.
- **2026-09-18 — QC-SKILL-POSTGRES-ANALYTICS-001 / Verified analytics skill**
  - Changed: installed the global Codex skill and copied it project-scoped into `.agents/skills/postgres-verified-analytics`, adapted from the linked PostgreSQL analytics workspace, with QC-specific schema routing, read-only query guardrails, CTE wrapping, grain/time rules, and evidence labels; no application code or database connection changed.
  - Evidence: `skill-creator` `quick_validate.py` PASS for both global and project copies; file hashes match.
  - State: DONE.
  - Key files: `.agents/skills/postgres-verified-analytics/SKILL.md`, `/Users/yzydalshmry/.codex/skills/postgres-verified-analytics/SKILL.md`.
- **2026-09-18 — QC-CLOSURE-008 / Equipment, calibration & maintenance closure**
  - Changed: added migration `0027` with explicit calibration states, nullable policy flags, append-only equipment/calibration/maintenance histories, evidence-preserving transitions, maintenance downtime/lock, and fail-closed equipment eligibility; added UI history access and regression coverage.
  - Evidence: closure PostgreSQL `3/3 PASS`; focused assets `17/17 PASS`; migrations `26/26 PASS`; typecheck/build/architecture PASS. Full lint remains blocked by existing Reject Reports errors; Node 22 remains outside the declared contract.
  - State: PARTIAL.
  - Key files: `db/migrations/0027_equipment_calibration_maintenance_closure.sql`, `tests/integration/assets/closure-008.test.ts`.
- **2026-09-18 — QC-AUTH-E2E-DOCKER-001 / Docker E2E attempt**
  - Changed: Docker-only runner now loads allowlisted test secrets, bootstraps a fresh isolated `yazeed` with `SYSTEM_OWNER` + all active permissions + `GLOBAL` scope, and refuses external `QC_TEST_DATABASE_URL`; fixed the Reject Reports migration's invalid `qc.uuidv7()` call and the TEAM fixture's missing scope value.
  - Evidence: `typecheck` PASS (0 errors); PostgreSQL 18 migration/owner/fixture bootstrap completed; full authenticated Playwright run: 10 PASS / 10 FAIL / 16 SKIPPED. Failures include unsafe `returnTo`, ambiguous Password locator, and parallel rate-limit/timeouts.
  - State: PARTIAL.
- **2026-09-18 — QC-REJECT-REPORTS-001 / Reject Reports module**
  - Changed: added the PostgreSQL-backed Issue Slip and Daily Reject module, canonical routes/navigation, authenticated operational authorization, approval-confirmation state model, search integration, printable responsive pages, migration `0026_reject_reports.sql`, and domain/application tests.
  - Evidence: typecheck `0 errors`; architecture and canonical route checks PASS; Reject Reports unit suite `9/9 PASS`; `git diff --check` PASS. Integration/PostgreSQL suite remains **BLOCKED/NOT VERIFIED** because the disposable test database/migration ledger state was contaminated during repeated runs; no Render migration or deployment occurred.
  - State: PARTIAL.
  - Key files: `db/migrations/0026_reject_reports.sql`, `src/modules/reject-reports/`, `src/pages/reject-reports/`, `docs/REJECT-REPORTS.md`.
- **2026-09-18 — QC-YAZEED-CONTROL-CENTER-001 / Canonical owner system control center**
  - Changed: registered `RT-SYSTEM-002 — /system/control-center` as the second explicit `YAZEED_ONLY` route (same `pageAccessDecision` + middleware 404 architecture; no second owner guard), added the owner-only nav item, and built the owner console page (live sanitized system overview with migration-drift + release identity, full account register with server-rendered search/filter/sort/pagination, [HISTORICAL detail retained in referenced audit.]
  - Evidence: unit `81 files / 544 tests PASS`; integration against the disposable PostgreSQL 18 cluster `84 files / 332 tests PASS` (including the 6 new owner-control-center cases: non-canonical denial, live head `0025`, full account lifecycle with audit persistence, protected-owner grant preservation, atomic provisioning rollback, audited scope assignment); typecheck/lint/build/architecture PASS [HISTORICAL detail retained in referenced audit.]
  - State: PARTIAL — authenticated E2E/UAT/CI remain unexecuted; Node 22 is outside contract.
  - Key files: `src/shared/routing/routes.ts`, `src/ui/navigation/navigation.ts`, `src/pages/system/control-center.astro`, `src/modules/system-health/application/{get-control-center-overview,dependencies}.ts`, `src/modules/system-health/infrastructure/postgres-migration-status.ts`.
- **2026-09-18 — QC-RENDER-POSTGRES-VERIFY-001 / Render PostgreSQL connection, migration & service verification**
  - Changed: fixed the root cause that made every documented DB command ignore the local `.env` — `scripts/db/load-local-env.ts` exports `loadLocalEnv()` but 6 entrypoints imported it as a bare side effect (`import './load-local-env.js'`) that never ran; they now call `loadLocalEnv()` at the **CLI boundary** only, because `migrate()` is imported directly by integration suites with their own pools. [HISTORICAL detail retained in referenced audit.]
  - Evidence: read-only Render verification via the canonical pool — PG 18.6, `qc_operations`, TLS 1.3, `search_path=qc,pg_catalog`, applied `0001`–`0018` / pending `0019`–`0025`, capability checks pass, 0 legacy-ownership conflicts. Controlled disposable PG 18 reached head `0025` (70 tables, 0 orphans). Readiness: `200 healthy` against the Render database, `503` when unreachable, `503` when `DATA [HISTORICAL detail retained in referenced audit.]
  - State: PARTIAL — connectivity, schema truth and readiness proven; Render DB behind source head, provider config divergent, rotation gate open.
  - Key files: `scripts/db/{preflight,migrate,migration-status,check-migration-integrity,check-schema-integrity}.ts`, `scripts/recovery/validate-restored-database.ts`, `tests/unit/database/runtime-connection-contract.test.ts`, `tests/integration/database/connection-chain.test.ts`.
## [2026-09-18] — QC-SYSTEM-OWNER-YAZEED-FINAL-CLOSURE-005 / explicit role+scope admin, dialogs, stale UX
- Changed: added explicit incremental scope administration end to end (`assignUserScope` / `removeUserScope` port methods, transactional PostgreSQL implementation with canonical-owner `GLOBAL` protection, `AssignUserScopeUseCase` / `RemoveUserScopeUseCase`, Astro actions); replaced the replace-only scope UX with per-grant assign/remove plus a clearly-labelled bulk *Replace* inside `<details>`; rewrote `/admin/users/[userId]` with Profile / Account security / Roles / Scopes / Administrative control sections, capability-driven controls, `Protected` markers for canonical owner grants, and de-duplicated lifecycle controls; removed all native `confirm()`/`alert()` from the journey in favour of the shared `ConfirmDialog` + `src/ui/client/dialog.ts` (focus trap, focus return via opener registry, Escape blocked mid-submission, pending state, inline error region, stale refresh control); made the admin Action error boundary deterministic (`astroActionCodeFor` projects `ErrorCode` → Astro code, exact `ErrorCode` travels as the message) and taught the shared classifier the exact-code map plus a `DUPLICATE_COMMAND` state; added `STALE_VERSION_MESSAGE` with an explicit `Refresh record` path and no auto-retry; made `SCOPE_KINDS` the single canonical scope vocabulary for actions, pages, and persistence validation.
- Fixed regression: `ListUserRolesUseCase` authorized `PERM-ADM-ROLE-VIEW`/`VIEW` against entity type `USER`, which the policy registry does not declare (it is declared on `ROLE`), so role membership could never be read; it now uses the registered entity type. This means the pre-005 role list on the user-detail page was always restricted.
- Evidence: `pnpm typecheck` 0 errors; `tests/unit/admin` 65/65 PASS (3 new files: scope administration 17, role administration 6, error contract 14, plus existing guards). Not verified: full unit suite, lint, format, architecture, build, diff check, Playwright, PostgreSQL.
- State: PARTIAL / BLOCKED (source-level closure only).
- Key files: `src/modules/administration/application/{assign-user-scope,remove-user-scope}.ts`, `src/modules/administration/infrastructure/postgres-authorization-repository.ts`, `src/actions/admin.ts`, `src/pages/admin/users/[userId].astro`, `src/ui/components/feedback/ConfirmDialog.astro`, `src/ui/client/dialog.ts`, `src/ui/forms/admin-mutation-copy.ts`, `src/shared/errors/action-error-code.ts`.
- Not done in this task: dedicated Playwright spec, accessibility-spec extension, PostgreSQL integration tests, `SYSTEM-OWNER-DATA-CONTROL-MATRIX.md` classification refresh.

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

## Historical DR / UAT context — superseded by fresh evidence
- DR-008's old Docker blocker is superseded by local PG18.6 execution and structural restore; populated recovery/provider DR remain unverified. Historical detail: audit/100-percent/{RESTORE-DRILL-RESULT,DR-EVIDENCE-MATRIX}.md.
- Migration0023 stores UAT cycles/sessions/defects and authorized reauthenticated electronic-signature acceptance with snapshot hash. CSV/screenshot cannot become SIGNED_UAT_CYCLE; material controlled changes invalidate evidence. Six real participant personas and exact-candidate sign-off remain required; no human sessions exist.
- Historical E2E10 PASS/10 FAIL/16 SKIP is not current closure.

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

### Quarantine KPIs (QC-100-FINAL-005 follow-up, 2026-09-19)
- `/quarantine` counters تسقط عبر **نفس register** الذي تفتحه روابطها (`ReceivingOverviewSource` → `ListReceivingUseCase`)؛ لا SQL عدّ خاص ولا `created_by` counter. لذلك `actorScope` هو النطاق المصرّح (قراءة أي منشئ مسموح)، ولاءمة counter↔link محققة بالبناء لا بعُقدين يدويين.
- "Awaiting inspection" أُلغيت واستُبدلت بـ`Pending` و`Ready for inspection` (كل بطاقة بحالة واحدة ورابط واحد)، وHOLD انقسمت إلى `Receiving HOLD` (`?state=HOLD`) و`Inspection HOLD` (`?inspectionResult=HOLD`).
- فلتر زمني مدعوم خادميًا `?receivedOn=today` في سجل Receiving (مقارنة `receiving_date` داخل PostgreSQL، و"today" تُحسب مرّة واحدة UTC في `ListReceivingUseCase`) — استُبدل الرابط الذي كان يعرض كل السجل.
- فشل `AUTHORIZATION` مقابل انقطاع المزوّد حالتان مستقلتان على `/quarantine`، ولا `catch` يشغّل صف KPI فارغًا.
- تحقق: unit 85/579 PASS، typecheck 813/0 errors، architecture PASS، PostgreSQL مصرفي جدید `overview-parity 6/6` + `read-models 7/7` + `dashboard 19/19` + migrations 29 + concurrency 12. لا build ولا browser على هذا المرشّح (NOT RUN).

### Operational visibility
- كل صفحة تطبيق عادية ظاهرة وقابلة للفتح لأي حساب `ACTIVE` ومصادق؛ التنقل يستهلك قرار رؤية المسار نفسه، وليس permissions الخاصة بالـmutation.
- القراءة العامة لا تعطي حق mutation؛ الإنشاء/التعديل/المراجعة/الاعتماد/الإفراج/VOID/الاستعادة/التوقيع تبقى محكومة خادميًا بالسياسات.
- مسارات الإدارة والقوالب تعرض projections آمنة للقراءة فقط؛ كلمات المرور وhashes والجلسات والأسرار وبيانات أمن الهوية والتشخيصات الخام ليست ضمنها.
- `pageAccessDecision` هو الحارس المركزي: المساران `YAZEED_ONLY` الحاليان هما `/system/health` و`/system/control-center` (`RT-SYSTEM-002`)، وكلاهما يُرفض خادميًا بـ404 لغير الحساب `ACTIVE` ذي `SYSTEM_OWNER` و`loginIdentity === 'yazeed'`؛ دور SYSTEM_OWNER غير القانوني أو امتلاك كل الصلاحيات لا يكفي.
- الـowner control center يستدعي `GetControlCenterOverviewUseCase` (بوابة `isNamedSystemOwner`) ولا ينفّذ SQL أو منطق أعمال؛ الإنشاء/التعديل/الأدوار/النطاقات تمر عبر الـuse cases وactions القائمة نفسها.

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
- Equipment eligibility is verified fail-closed at Submit: equipment `ACTIVE`, not under maintenance/inactive/failed, its current-calibration pointer must match a `CURRENT` calibration that is not overdue, and equipment/calibration snapshots must match the referenced records. QC-CLOSURE-008 adds append-only status/calibration/maintenance history, explicit `SCHEDULED`/`COMPLETED`/`FAILED` calibration states, certificate preservation, maintenance downtime, and a maintenance lock; source requirement flags remain nullable until policy supplies their values.
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
- F-11 ما زال `OPEN / PARTIAL`: candidate-bound local archive bundle restored DB and file payloads from the archive; 77 tables / 487 snapshot rows / 30 ledger rows / 154 validated FKs, app/security and wrong-candidate denial PASS. Saved hashes show 74/77 current-source tables match; the 3 diffs are the measured post-backup task/audit/outbox marker. Local recovery measured 435 ms; provider DR/RPO remains NOT VERIFIED. Report `audit/2026-09-19/QC-100-FINAL-008-populated-backup-isolated-recovery.md`.
- الإعدادات الاختيارية لـR2 موجودة بدون أسرار، ويوجد backup job محلي fail-closed وPostgres recovery evidence append-only.
- واجهة Backups تعرض **أهداف** RPO=24h وRTO=4h؛ لا تعتبرها قياسات محققة. Marker محلي committed بعد إكمال dump بـ92s لم يوجد في الاستعادة؛ لا يحدد ذلك أقصى RPO.
- restore drill يجب أن يكون على target معزول صريح.
- application backup-catalog integration and provider plan/retention/PITR-WAL/storage/DR remain unverified; approved RPO/RTO and provider recovery remain unmeasured. Production stays behind QC-100-FINAL-015.
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

### Dashboard (QC-100-FINAL-017 — إعادة بناء كـcommand center)
- عقد الـcount صريح (`numerator`/`state`/`actorScope`/time window/href): لا قيمة شخصية تحت وسم نطاق مصرّح أو العكس، وكل `href` يجب أن يعيد إنتاج نفس المجموعة (وإلا فهو عيب لا خيار تقديمي). `value: number | null`؛ و`null` تعني "غير متاح لهذا الحساب" ولا تُعرض صفرًا — QC-100-FINAL-005/017.
- 7 action counts على `/dashboard`، كل واحدة تقرأ register يملكه الدومين المعني عبر use case خاص به: approvals، unread notifications، HOLD الخاص بالمستخدم، inspection reports RETURNED (المؤلف)، Tasks overdue، Tasks due today، Calibrations OVERDUE. عدد الـcard = عدد صفوف نفس القراءة التي يفتحها الرابط، فلا يمكن للعدّ أن يخالف رابطه.
- الروابط المدعومة الوحيدة: `/approvals`، `/notifications?unread=1`، `/quarantine/receiving?inspectionResult=HOLD&ownership=mine`، `/quarantine/inspections?state=RETURNED&ownership=mine`، `/tasks?assignee=mine&due=overdue|today`، `/assets/calibrations?state=OVERDUE`. فلتر Tasks بسبب `due` أُضيف خادميًا في نفس predicate الذي يقرؤه العدّاد؛ والـinspections register صار يدفع state/finalResult/assignedTo/ownership إلى SQL ويجمع العلاقات بـbatched reads بدل 6 queries لكل صف.
- Quarantine flow على `/dashboard` = 6 مراحل (Received today → Awaiting inspection → Under inspection → HOLD → PASS not released → Released) وكل مرحلة projection لمقياس واحد من `GetQuarantineOverviewUseCase` نفسه الذي يقدّم `/quarantine`؛ لا SQL موازٍ ولا تعريف ثانٍ للحالة.
- attention queue تُبنى من نفس صفوف الـcounts مع سبب بشري و`ageLabel` مشتق من timestamp خادمي حقيقي (`assignedAt`/`updatedAt`/`dueAt`/`createdAt`) وحالة ورابط مباشر، مرتّبة بالشدة الحقيقية ومحدودة بـ10؛ إن غاب timestamp تُكتب `Age not recorded`.
- فشل قراءة أي source (غير AUTHZ) يحجب الـsnapshot كاملًا؛ رفض `AUTHORIZATION` لحساب لا يملك قراءة register معيّن يظهر كـ"Not available" بلا رقم وبلا رابط ولا يصبح صفرًا. حالات الseries تبقى `AVAILABLE|EMPTY|UNAVAILABLE|NOT_SUPPLIED` بلا نقاط خارج `AVAILABLE`، ويعرض الرسم source/unit/grain/counts/scope/period/zero/freshness.
- coverage panel مُشتق من read model لا من copy الصفحة: 13 مدخلًا، منها `NOT_SUPPLIED` لـlaboratory workload وdocument review queue وblocked reasons وreject analytics وquality summary وsystem health (owner-only) — لكل مدخل سببه الحقيقي.
- ما زال يحتاج read model خادميًا قبل أي عرض: state filter/bounded lab workload، document review، blocked reasons، reject analytics بعد إغلاق عيوب SQL/runtime + مسار قراءة مصرّح، وownership filter في سجلات Quality.

## 10) UI / UX / Accessibility

### Language/copy
- الواجهة الحالية English-only, `lang="en"`, LTR.
- الأفعال والعناوين تستخدم sentence case.
- المصطلحات المنظمة مثل NCR/CAPA/PASS/RELEASED لا يُعاد تعريف معناها.
- UX vocabulary المشترك موجود في `src/shared/copy/ux-vocabulary.ts`؛ دليل الكتابة المعتمد: `Documents/UX-WRITING-GUIDE.md`.
- QC-100-FINAL-018: صفحات التسجيلات/التفاصيل تعرض الحالات عبر `stateLabel()`/`severityLabel()` بلا enums خام (المصطلحات المنظمة PASS/FAIL/HOLD/RELEASED/VOID تبقى حرفية). نسخ الأخطاء الصنفية موحّدة في `uxVocabulary.errorClasses`، وتسميات scope kinds البشرية في `scopeKindLabels`. **تنبيه للحرر المستقبلي:** كتلة facts في `receiving/[receivingId].astro` ونسخ Laboratory والـdashboard مثبتة بعقود E2E/unit (مثل `Release System State`، `NOT_RELEASED`، `/INSPECTION REPORT|INSP/i`) — أي تعديل copy يجب أن يفحص `tests/e2e/critical-workflows.spec.ts` و`tests/unit/ui/ux-writing-contract.test.ts` أولًا.

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
- QC-100-FINAL-005: أرضية قراءة 12px (`--font-size-xs`) لميتاداتا الـKPI، هدف 44px لعناصر الـshell ذات الأيقونة الوحيدة (search/notifications/approvals) و44px لـdefinition disclosure، والرمز المرئي داخل عنصر يحمل `aria-label` يبقى `aria-hidden` حتى لا يخالف ظاهر النص الاسمَ المتاح.
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
- Page-route contract: `definePageRoute` centralizes `id/path/page/domain/title/breadcrumb/visibility`; new browser pages default to `AUTHENTICATED`, and the explicit `YAZEED_ONLY` set is currently `/system/health` + `/system/control-center`; the architecture gate rejects registry/page/navigation drift. Route visibility remains separate from server-side mutation authority.

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
- Local equivalent PG18.6 executes suites: integration350 PASS/3 FAIL, migrations29 PASS, concurrency11 PASS/1 FAIL. Current candidate security is 51 PASS + 1 SKIP with the PostgreSQL rate-limit case BLOCKED; Docker/CI container path and fixture-backed six-persona E2E remain NOT VERIFIED.
- GitHub Verification CI exact-HEAD غير مثبت بسبب billing lock.
- Node المحلي خارج contract.
- provider-ingestion الموثوق لأدلة CI/Security/E2E/UAT غير مكتمل.
- UAT غير منفذ؛ production readiness غير مثبت.
- **قرار مالك مفتوح (QC-100-FINAL-004 Task 5/7): نطاق موقّع UAT.** قبول الدورة يصرّح بـ`scope: {}` على `UAT_CYCLE` مثل `ApproveReleaseUseCase`، وGLOBAL وحدها تمر مع scope فارغ؛ فمدير بنطاق TEAM (شخصية `uat-qcm`) يُرفض بـ`AUTHZ_SCOPE_DENIED`. لذلك العلامة البشرية ستكون من المالك المسمّى ما لم يُعتمد منح GLOBAL للـQCM — السلوك متسق ومقصود ولم يُغيَر. أدلة: `audit/2026-09-19/QC-100-FINAL-004-task5-uat-ingestion-closure.md`.
- Render’s last verified applied migration head is `0018` (historical; not reverified on the current candidate); source head `0030_reject_reports_role_parity` is not a production claim and must not be applied before the credential-rotation gate. Fresh QC-100-FINAL-001 confirmed the gate remains open and no direct production DB access occurred.
- **Historical live defect (2026-09-18):** authorized yazeed GET `/reject-reports` returned 500 with Render migration projection `0018`. QC-100-FINAL-014 verified the candidate SQL ambiguity fix and populated regression on disposable PostgreSQL; production result remains NOT VERIFIED because current production migration state is blocked.

### P1 / live validation / pre-existing test estate
- **Full `pnpm test:integration` على PostgreSQL المصرفي المشترك يفشل في 4–5 ملفات قائمة قبل هذا العمل (وليست انحدارًا منه؛ أُثبت بالاستبعاد على cluster جديد):** `identity/system-owner-upgrade-parity` (Migration checksum mismatch for 0030 — الsuite يسجّل DB كـ`migrations` بدون 0030 فيفشل `verifyMigrationIntegrity` متى سبقه أي ملف آخر إلى الـmigration)، `system/control-center` (`drift=true`)، `reporting/report-export-parity`، `shared/search-scope` (LIKE wildcard row count)، و`shared/notification-outbox-delivery` (dedupe، متقطع). السبب: مسار الخارجي يشارك قاعدة واحدة بين كل الملفات؛ هذه المضيفات تعوّل على قاعدة بكر. الأصل: تصميم اختبارات/migration `0030` في QC-100-FINAL-016، ولم يُغلق بعد.
- read models المطلوبة لاستكمال لوحة القيادة (QC-100-FINAL-017): bounded lab workload مع state filter، document review queue، blocked reasons، reject analytics (بعد إغلاق عيوب SQL/runtime ومسار قراءة مصرّح)، وownership filter في سجلات Quality. بدونها تبقى هذه المنتجات `NOT_SUPPLIED` معلنة على السطح نفسه، ولا تُقدَّر بأرقام.
- أُعيد التأكيد 2026-09-19 (QC-100-FINAL-017): الأربعة (`search-scope`, `reporting/report-export-parity`, `identity/system-owner-upgrade-parity`, `system/control-center`) تفشل أيضًا على cluster مصرفي جديد/فرغ، فليست متعلقة بمشاركة القاعدة وحدها؛ وأي تعديل لها يحتاج مهمة مستقلة.
- تشغيل مسار Testcontainers/`postgres:18-alpine` (نفس مسار CI) على بيئة فيها container runtime، لأن مسار الـcontainer الفرعي لم يُنفذ فعليًا بعد.
- live performance evidence لخلفية النظام وlogin (CPU/GPU/heap/Web Vitals).
- authenticated accessibility/responsive/keyboard/screen-reader matrix.
- provider backup/PITR/WAL/object-store DR and approved RPO/RTO validation; QC-100-FINAL-008 verifies the local populated archive bundle and isolated restore, while application backup-catalog integration remains open.
- ترقية fixtures القديمة بحيث `loginIdentity` يصبح حاضرًا بوضوح في test doubles.
- تنظيف Lottie container metadata/unused asset فقط إذا اعتُمد asset-pipeline لذلك.

## 15) Historical evidence snapshot — Production NFR evidence
- `QC-CLOSURE-NFR-010` أضاف سجل أدلة موحدًا على exact source `313bdfcc031abc18d3e55e75a025d880b9d16450` وbuild `rel-d740622fc9010566`، مع فصل الأدلة المحلية عن claims الإنتاج/UAT.
- frozen install/lock integrity، 37 focused security/observability tests، typecheck، architecture، build، release identity/verification، source-map scan، local CSP/CSRF/safe-error HTTP checks: **VERIFIED/PASS** ضمن Node `v22.23.1` فقط، وهو خارج contract `>=24.20.0 <25`.
- local smoke: login/live 200، readiness 503 بسبب PostgreSQL unavailable، cross-origin mutation 403؛ هذه أدلة runtime محلي لا production.
- accessibility selected browser run: 6/8 PASS؛ login tests unstable/NOT VERIFIED، وكل authenticated keyboard/AT/manual workflows NOT EXECUTED.
- dependency audit لم يرجع بسبب network، CI exact-head ما زال غير مثبت، Docker/PostgreSQL 18/authenticated E2E/provider/exporter/live performance ما زالت **BLOCKED/UNVERIFIED**.
- privacy data-flow inventory موجود في evidence file؛ مدد retention وdeletion/correction الدقيقة غير مخترعة وتبقى pending policy.

## 16) الحالة الحالية — AI Advisory Safety / Evaluation
- AI remains advisory-only. The boundary now blocks detected PII/secret-like input before provider access, rejects authority-claiming text and structured recommendations, fail-safe refuses high-risk unsupported-source requests, and preserves source identity/citations when supplied.
- Deterministic dataset is `qc-ai-governance-v2` / `2.0.0`. Fresh QC-100-FINAL-009 evidence on candidate `95d1380f2f463bad911d6ee041ae6a7f45cbf897`: focused AI `4 files / 66 PASS`, Prettier PASS, typecheck `821 files / 0 errors / 72 hints`, on Node `24.19.0` (outside declared `>=24.20.0 <25`). Earlier `53/53`, full-unit `83/564`, security `52/52`, and Node `24.20.0` results belong to prior candidate snapshots and are not current-candidate evidence.
- Groq is the default primary adapter, Gemini is the default fallback, and `DisabledAiProvider` remains the final safe fallback. Configuration is server-only with canonical names plus legacy-name transition support; provider metadata is sanitized and advisory-only. Live provider smoke tests, Render provider configuration, external data-processing approval, and human UAT remain `NOT VERIFIED/BLOCKED`. No production/provider approval is inferred.

## 17) سجل تاريخي مضغوط
- **2026-09-19 — RENDER-BUILD-FIX / duplicate lab dependencies imports**
  - Changed: حذف 4 استيرادات مكررة من `src/modules/laboratory/application/dependencies.ts` كانت تكسر build على Render (`Identifier already declared`).
  - Evidence: `astro build` PASS محليًا بعد الإصلاح؛ Render deploy build نجح.
  - State: DONE.
- **2026-09-19 — QC-100-FINAL-001 / Production parity recheck**
  - Changed/Evidence/State: ثبت deploy Render على `31ab21a…`؛ health/live/readiness `200`, release identity `401`, Reject unauthenticated redirect؛ applied DB state NOT VERIFIED بسبب rotation gate؛ PARTIAL / BLOCKED. `audit/2026-09-19/QC-100-FINAL-001-production-parity-recheck.md`.
- **2026-09-19 — QC-100-FINAL-008 / Populated backup and isolated recovery**
  - Changed: fail-closed loopback/empty `qc_restore*` target, full archive preflight, and release migration/version-context manifest verification.
  - Evidence: candidate fingerprint `89f4bc13763d10b98ab86efc2c66a7a1faec253071c9c2e7b2a8a8c76cc101a1`; bundle SHA `e7832c6051c4b14f8430251bdd759dc7e62c19fae684283fc2d45627c4ecc483`; 77 tables / 487 snapshot rows / 30 migrations / 154 validated FKs; archived file and app/security probes PASS; wrong candidate denied; pre/post-probe hashes captured; local recovery 435 ms; +92s marker absent. Provider recovery/RPO policy remain NOT VERIFIED.
  - State: PARTIAL.
- **2026-09-19 — QC-100-FINAL-009 / AI provider verification**
  - Changed: added deterministic coverage for provider error mapping, 12-second timeout, adapter-level failover, and sanitized application handling of primary/fallback exceptions; no application behavior or policy changed.
  - Evidence: candidate `95d1380f2f463bad911d6ee041ae6a7f45cbf897`, focused AI `66/66 PASS`, typecheck 0 errors/72 hints on Node 24.19.0 (outside contract); live calls, privacy approval and reviewer evidence remain NOT RUN/BLOCKED. `audit/2026-09-19/QC-100-FINAL-009-ai-provider-verification.md`.
  - State: PARTIAL.
- **2026-09-19 — QC-100-FINAL-007 / Performance, capacity & operational monitoring**
  - Changed: re-seeded the representative PERF- dataset on the disposable PG 18.6 cluster; ran EXPLAIN (ANALYZE, BUFFERS) on 9 critical reads, authenticated Chromium vitals on 8 routes, 11-path HTTP smoke, read concurrency to c=24, rate-limit mechanism check, outbox single-drain, and log/correlation/secret-scan verification; proposed (not approved) budgets; no source/migration/policy change.
  - Evidence: EXPLAIN all <30 ms with batched reads and no duplicate dashboard SQL; LCP ≤360 ms / CLS 0 / JS ~2.9 KB; TTFB p95 ≤168 ms except unbounded `/tasks` (1.26 MB); concurrency 200/200 to c=24 with p95 ≈538 ms; concurrency suite 12/12 PASS; secret scan 0 hits; metrics export NOT VERIFIED; alert delivery NOT RUN. `audit/2026-09-19-QC-100-FINAL-007-performance-capacity-monitoring.md`.
  - State: PARTIAL (provider alerts, session-valid INP, write-path load, outbox pressure, production capacity remain open).
  - Key files: `scripts/performance/{login-and-capture,explain-critical-reads,concurrency-probe,rate-limit-probe}.mjs`.
- **2026-09-19 — QC-100-FINAL-010 / Runtime security, privacy and supply-chain verification**
  - Changed: no application code or policy value changed; candidate-specific focused negative tests and local supply-chain checks were re-run, with blockers recorded instead of inferred closure.
  - Evidence: authorization/policy focus `63/63 PASS`; security `51 PASS + 1 SKIP` with PostgreSQL/Testcontainers `BLOCKED`; frozen offline lock install PASS; dependency audit/SBOM/dedicated scanner and approved privacy decisions remain unavailable or unverified. `audit/2026-09-19-QC-100-FINAL-010-security-privacy-supply-chain.md`.
  - State: PARTIAL / BLOCKED for full acceptance.
- **2026-09-18 — QC-100-FINAL-014 / Reject Reports analytics proof + populated regression**
  - Changed: no repository SQL change needed — the ambiguous-`status` fix (a.status / r.status qualification) is present at HEAD; strengthened the reject-reports integration analytics regression with populated report+confirmation rows, approvalStatus aggregate assertions, a VOID-exclusion aggregate check (distinct item code), a zero-denominator `rejectPctTrend` day (SQL `CASE WHEN SUM(good_qty) > 0` → NULL), and trend/by-item/by-department/by-reason assertions.
  - Evidence: on candidate `eab4e341` + Node 24.20.0/pnpm 11.25.0 + disposable TLS PG 18.6 at source head 0029: reject-reports unit 9 + integration 6 = 15/15 PASS; eslint on the touched test file PASS. Mutation check confirmed the regression catches the historical defect: de-qualifying `a.status` reproduces `column reference "status" is ambiguous` and fails the test; source reverted. Live /reject-reports HTTP smoke and production migration parity remain separate unproven acceptance items (owner-supplied).
  - State: DONE (local source + disposable-PG scope only).
  - Key files: `tests/integration/reject-reports/reject-reports.test.ts`.

> هذا السجل يحتفظ بسبب القرارات وتسلسل العمل فقط. إذا تعارض مع الأقسام 1–16، استخدم الأقسام 1–16.
- **2026-09-18 — QC-100-FINAL-013 / Controlled-workflow inventory + disposable-PG evidence refresh**
  - Changed: built the remaining-requirements inventory with source/owner/path/acceptance-evidence per item and a controlled-source request pack (PD-01..38 opens, TR-LAB-008 VOID, Domain-70 Arabic/RTL applicability decision); no code/policy/scientific value changed; fail-closed defaults preserved.
  - Evidence: on candidate `eab4e341` + Node 24.20.0/pnpm 11.25.0 with a local disposable PostgreSQL 18.6 (TLS, throwaway cert, `LC_ALL=en_US.UTF-8` needed for Homebrew startup): unit 83 files/564 PASS, integration 87 files/353 PASS, concurrency 12/12 PASS on live PG, migrations 29/29 + zero-op re-run, preflight/migration-integrity PASS, schema 77 tables/0 orphans; browser E2E still BLOCKED (host Chromium/localhost restriction); cluster destroyed after the run.
  - State: PARTIAL / BLOCKED (external authority sources remain open; G-001/G-002/G-004 closed for local disposable-PG scope only).
  - Key files: `audit/2026-09-18/QC-100-FINAL-013-remaining-requirements-inventory.md`.
- **2026-09-18 — QC-100-FINAL-002 / Verification gates repaired, candidate proven locally**
  - Changed: fixed the Reject analytics ambiguous-`status` SQL (root cause of the live `/reject-reports` 500 on a fully migrated schema), replaced the reject-reports `Function`/`any` filter helpers with typed Kysely builders, corrected the synchronous `.rejects` harness (asserts the throw + `AUTHZ_DENIED` now), derived the control-center expected migration head from `loadMigrations()`, re-contracted both concurrency race assertions to the three verified safe loser codes (`AUTHZ_DENIED` / `DOMAIN_INVALID_TRANSITION` / `CONFLICT_STALE_VERSION`), wired candidate-bound authenticated fixtures into CI (`QC_MANDATORY_VERIFY_FIXTURES` + new workflow step running `verify:e2e:authenticated` with one-time generated passwords), and pinned `LC_ALL=C` in `disposable-postgres.sh`.
  - Evidence: on candidate `e30285c39695defcaaa9a12ce517e6831f5bc8f7` + Node `24.20.0`/pnpm `11.25.0` and isolated disposable PG 18.6: format/lint/typecheck/architecture/tech-debt/diff-check/unit 83 files/564, integration 87/353, migrations 8/29, concurrency 2/12 (stability 15/15 runs), security 7/52, build, release identity, fixture seed/cleanup — all PASS. `audit/2026-09-18-qc-100-final-002-verification-gates.md`.
  - State: DONE (local). Exact-SHA CI remains BLOCKED (billing lock; push needs explicit authorization); CI Testcontainers path NOT RUN locally (no Docker).
- **2026-09-18 — QC-AI-PROVIDERS-001 / Groq + Gemini provider integration**
  - Changed: added server-only validated Groq/Gemini adapters behind the existing `AiProvider`, bounded failover to Disabled, sanitized provider metadata, optional AI health reporting, canonical/legacy environment transition, Render declarations, and advisory/provider security coverage.
  - Evidence: focused AI `53/53 PASS`; typecheck `0 errors`; architecture/build/targeted lint/format/diff check PASS. Full unit has one pre-existing Reject Reports UI failure; security has one Docker/Testcontainers-blocked case. Live providers/Render/UAT remain NOT VERIFIED.
  - State: PARTIAL / BLOCKED.
  - Key files: `src/modules/ai-advisory/infrastructure/`, `src/modules/ai-advisory/application/dependencies.ts`, `docs/operations/AI-PROVIDERS.md`.
- **2026-09-18 — QC-CLOSURE-010 / Cross-domain integration, search, notifications & reports**
  - Changed: wired approval-event outbox handling to recipient-scoped, replay-safe notifications; expanded authorized search identifiers and canonical report filters.
  - Evidence: focused `8 files / 29 tests PASS`; typecheck `0 errors`; architecture/build/diff checks PASS. PostgreSQL/outbox runtime blocked by local shared-memory permission and unavailable Docker daemon.
  - State: PARTIAL.
  - Key files: `src/shared/outbox/qc-event-handler.ts`, `src/shared/search/postgres-search.ts`, `src/modules/reporting/infrastructure/postgres-report-query.ts`, `audit/2026-09-18-qc-closure-010-cross-domain-integration.md`.
- **Project Mind rollovers** — `QC-YAZEED-CONTROL-CENTER-001` (12 سجلًا)، `QC-CLOSURE-007` (12)، `QC-CLOSURE-005` (23)، `QC-100-FINAL-016` (5)، `QC-100-FINAL-016 remediation` (5)، و`QC-100-FINAL-005 follow-up` (`QC-CLOSURE-006` + `QC-CLOSURE-007`) نُقلت إلى `02-mind-mid.md` بعد التحقق من وجودها في الأرشيف قبل الحذف (لم تُنقل أي قرارات حالية أو مشاكل مفتوحة). الحالة: DONE.
- **2026-09-19 — Mind rollover (QC-100-FINAL-004 Task 6):** بعد إضافة سجلي Task 6 وTask 5 بلغ `01` 511 سطرًا (فوق الحد الناعم 500)؛ نُقلت أربعة سجلات تاريخية (`QC-MCP-POSTGRES-001`، `CODEX-PLUGIN-SYNC`، `QC-MIDPOINT-REWRITE-001`، `QC-MIDPOINT-REBASE-001`) إلى أعلى `02-mind-mid.md` بعد التحقق من غيابها في الأرشيف، فنزل `01` إلى 493 سطرًا؛ لم تُمس أقسام الحالة الحالية أو الـinvariants أو المشاكل المفتوحة. الحالة: DONE.
- **2026-09-18 — QC-100-FINAL-016 / Live product UX & human-centered application review (read-only)**
  - Changed: no product code changed; live page-family review of the deployed product using an operator-typed session, recorded as `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md` (36 route families + 18 targeted URL probes; 5 P1 / 16 P2 / 10 P3, each with type, source pointer and copy replacement).
  - Evidence: live reproductions of the serif fallback, the ignored KPI drill-down params, the UUID topbar identity, `/reject-reports` 500, CSP-blocked inline scripts (`/ai-advisory` flow dead, `/account` toggle inert), `/account` outside the shell, the two phantom `/quality/*/new` routes, the self-contradicting migration card and the self-view role contradiction; strengths re-confirmed (fail-closed states, 404 semantics, keyboard/focus, no overflow on 34/35 routes, no unlabelled controls).
  - State: PARTIAL — review DONE; indicator unchanged at `29.0%`; consumers are 005/017/018/006. Not human UAT; single role; bootstrap-only data; deployed SHA `UNVERIFIED`.
  - Key files: `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`.

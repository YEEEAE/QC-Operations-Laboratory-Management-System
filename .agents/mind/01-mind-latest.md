# QC Operations & Laboratory Management System — Compact Project Mind

- **2026-09-23 — INTEGRATION-CONTRACTS / عقود المصادر ومحول الجهاز التجريبي**
  - Changed: عقود مسودة لستة مصادر؛ أول محول instrument sandbox مع فصل delivery عن business decision.
  - Evidence: عقود مركزة 8/8 PASS؛ typecheck بقي بخطأين قائمين في تعريفات release `.mjs`؛ لا مزود حي أو بيانات حساسة.
  - State: PARTIAL — تفعيل المزود وسياسات الاحتفاظ/إعادة المحاولة/هوية الفاعل تحتاج اعتماد المالك.

- **2026-09-23 — RECOVERY-POSTURE / backup, retention, and incident response**
  - Changed: removed unapproved RPO/RTO values and assumed 30-day retention; expiry now fails closed without an approved policy; backup verification reads actual stored bytes; added timestamp-derived metrics and recovery incident stop/GO runbook.
  - Evidence: focused backup-recovery unit 23/23 PASS; typecheck still reports 2 `.mjs` declaration errors in release tests. Read-only Render check: PG plan Free, web service only/no Cron, `qc.backup_runs` 0 rows, `qc.recovery_evidence` absent. User confirmed no isolated target/recovery bundle and decisions still open; local Docker/Postgres unavailable. Restore drill and response-time rehearsal BLOCKED; no production restore attempted.
  - State: PARTIAL — provider schedule/alerts/PITR/WAL and retention policy remain unverified; Render paid Cron capability not activated.

- **2026-09-23 — QC-WORKFLOW-REDESIGN / سياق رحلة QC والتسليمات**
  - Changed: اللوحة المشتركة تفصل مجال العمل عن مالك السجل وتوضح نقص المصدر؛ أضيفت روابط HOLD/review/PASS-not-released، وحُفظت مدخلات Receiving/Lab عند الفشل.
  - Evidence: focused unit 98/98 PASS؛ build PASS؛ typecheck 0 errors. UAT مع ستة مشاركين فعليين وقياس زمن المهام NOT RUN؛ مصادر evaluator والسياسات المعتمدة ما زالت مفتوحة.
  - State: PARTIAL — لا تغييرات على mutations أو المخطط أو الموقع الحي.

- **2026-09-23 — ATTACHMENT-SIGNATURE-DOC-AUDIT / lifecycle and traceability review**
  - Changed: added known-signature/text validation and stored-object size/type/hash checks; added document lifecycle and PG rollback fault-injection coverage.
  - Evidence: focused in-memory suites 31/31 PASS; PostgreSQL fault-injection NOT RUN (Docker daemon unavailable); typecheck has 2 existing `.mjs` declaration errors. Report: `audit/2026-09-23/attachment-signature-document-audit.md`.
  - State: PARTIAL — upload/retention authority, end-to-end route scope, database rollback evidence, and document effective-date policy remain open.

- **2026-09-23 — Mind rollover (AUTHZ-SERVER-MATRIX):** نُقلت أقدم سجلات 2026-09-22 إلى أعلى `02-mind-mid.md` بعد التحقق من حفظها؛ بقيت الحالة الحالية والقرارات والقيود.

- **2026-09-23 — AUTHZ-SERVER-MATRIX**
  - Changed: توحيد UX لرفض الصلاحية/السجل غير المتاح.
  - Evidence: unit 268/268 PASS؛ Docker PG 21/21؛ disposable actor HTTP reads/logout PASS؛ authenticated E2E الإجمالي FAIL (15 passed، 21 accessibility failures، 1 skipped، 2 لم تبدأ). كتابات actor على سجل صالح وتبدل الصلاحية أثناء الطلب NOT RUN؛ لا دليل BAD_REQUEST/ID غير موجود احتُسب كرفض صلاحية.
  - State: PARTIAL — `audit/2026-09-23/authorization-server-matrix.md`.

- **2026-09-23 — QC-100-FINAL-026-C / reconciled open QC and recovery decisions**
  - Changed: ربط سجل القرار وآلات الحالة ومصالحة المتطلبات بمسارات use case الحالية، وإضافة RD-019/RD-020. تحديث التدفق الفعلي: إنشاء/تسجيل نتيجة التفتيش موصولان لكن لا مصدر evaluator معتمد؛ laboratory `evaluate()` يرفض؛ Reject الافتراضي `POLICY_SOURCE_REQUIRED`.
  - Evidence: `requirements:check` PASS (100 requirements, 34 risks, 20 gaps, 33 decisions, 80 domains). اكتُشفت مخالفة: recovery metrics/code والاختبار يثبتون RPO=24h وRTO=4h رغم بقاء PD-26/27 مفتوحة؛ لم تُغيّر القيم دون قرار.
  - State: PARTIAL — قرارات QC/WI-SOP/Reject/restore وRPO/RTO ما زالت BLOCKED؛ لا tests أو migrations شُغلت، ولا تغيير runtime.
  - Key files: `Documents/REQUIREMENTS-RECONCILIATION.md`, `Documents/DECISION-ASSUMPTION-REGISTER-026.md`, `Documents/STATE-MACHINES.md`.

- **2026-09-23 — QC-BASELINE-REPAIR / إصلاح بوابات typecheck وarchitecture والوحدة**
  - Changed: تمرير offset المختبر، نقل metrics خلف application boundary، وإصلاح lint وعيوب unit مع تحديث العقود القديمة دون حذف أو تخفيف assertions.
  - Evidence: baseline SHA `d0dc705f278a574b3f8f5e822c216fb01b61a9bd` clean؛ Node `24.20.0` / pnpm `11.25.0`؛ 24/977 إخفاقًا صُنفت (19 عقد/fixture متقادمة، 5 عيوب تنفيذ)؛ final run `9d8cb827-63f1-4fc9-8087-2844e63aecf4`: typecheck 956/0 errors، unit 977/977، lint/architecture/requirements/parity/build PASS. PostgreSQL/E2E BLOCKED لغياب Docker؛ البناء لا يثبت الجاهزية. التفصيل: `audit/2026-09-23/unit-baseline-triage.md`.
  - State: DONE محليًا؛ بلا commit/push.
  - Key files: `src/pages/api/performance-metrics.ts`, `src/pages/laboratory/tests/index.astro`.

- **2026-09-23 — NAV-REBUILD / إعادة بناء التنقل الرئيسي**
  - Changed: شجرة تنقل من 10 أقسام + 4 أدوات مساعدة، مع إزالة الروابط المكررة، وحفظ معرفات 34 وجهة. لا تغيير في صلاحيات الصفحات أو use cases.
  - Evidence: عقود التنقل/shell المركزة 57/57 PASS؛ Astro check بقي بخطأين قائمين لتعريفات سكريبتات release `.mjs`. Playwright NOT VERIFIED: Chromium launch permission denied، ولا توجد بيانات دخول E2E؛ `.env` يشير لقاعدة خارجية ولم تُستخدم.
  - State: PARTIAL — اختبار browser/responsive الفعلي محجوب؛ السجل: `tests/e2e/mobile-drawer-inert.spec.ts`.
  - Key files: `src/ui/navigation/navigation.ts`, `src/ui/shell/Sidebar.astro`, `src/ui/layouts/AppLayout.astro`.

- **2026-09-23 — FULL-REPO-AUDIT / تدقيق مستقل**
  - Changed: تقرير HTML مستقل لـ100 مجال بمؤشر نضج أدلة 49%، وست توصيات تكامل وبرومبتات معالجة؛ أزيل منه تصور إعادة التصميم بطلب المستخدم. لا تعديل للتطبيق أو الإنتاج.
  - Evidence: Node 24.20.0؛ unit 960/975 PASS (15 FAIL)، typecheck خطأ واحد، lint 9 أخطاء، architecture مخالفة واحدة؛ format/requirements/diagnose/build بعد verification:begin PASS. قراءة 6 صفحات إنتاجية أكدت NOT READY وschema 0018/0038 وReject Reports محجوب وbackup catalog فارغ. PG18/E2E/UAT NOT RUN في هذه الجولة.
  - State: PARTIAL — `audit/2026-09-23-full-repository-audit-redesign-ar.html`؛ النسبة رأي تقييم أدلة وليست امتثالًا أو جاهزية إطلاق.

- **2026-09-23 — Mind rollover:** نُقل أقدم سجلي Ledger (QC-100-FINAL-017/018) إلى أعلى `02-mind-mid.md` بلا تغيير الحالة الحالية.


- **2026-09-23 — INDEPENDENT-LIVE-REASSESSMENT / تقييم عربي جديد**
  - Changed: تقرير مستقل بـ50 معيارًا/10 مجالات، مؤشر أدلة 46%، دون الاستناد إلى درجات التقارير السابقة.
  - Evidence: قراءة مصدر محلي عند `e9054c6` وست صفحات حية مصادقة؛ الصحة NOT READY، schema 0018/0038، Reject Reports محجوب، backup catalog فارغ، release identity UNVERIFIED. كشف تعارض RPO/RTO بين واجهة backups وخطة السياسة.
  - State: PARTIAL — `audit/2026-09-23-independent-reassessment-ar.html`؛ أوضح المالك أن برومبتات الإطلاق التجريبي جرى تجاوزها ولم تُكمل. هوية النشر وUAT/E2E/الاستعادة غير متحققة.

- **2026-09-23 — RELEASE-GATE-RECONCILIATION / exact-SHA readiness review**
  - Changed: أُنتج قرار بوابات للمرشح `5d591afc29c04d66f1c0a80b9cd24d5accb71527`؛ NO-GO. تأكد غياب مسار ingest موثوق لـCI/security/database/E2E، وبقي signer/scope لـUAT قرار مالك.
  - Evidence: `release:evidence:check` FAIL على Node `24.20.0`؛ run context والتقارير على SHAs/run IDs أخرى، unit فيها 9 إخفاقات تاريخية، E2E فيه إخفاق، وrelease identity مفقود. GitHub status checks فارغة؛ reconciliation guard PASS (80 domains). لا اختبارات أُجريت.
  - State: PARTIAL — `audit/2026-09-23/release-gate-reconciliation-5d591af.md`; blocker owners/actions therein. No deploy/promotion/RELEASED.

- **2026-09-23 — P14 / AI advisory governance and offline evaluation**
  - Changed: expanded the synthetic evaluation to dataset 3.0.0 with per-category error reporting; mismatched provider citations now refuse; UI shows source limits, abstention reason, and human handoff; documented drift monitoring and owner-gated activation.
  - Evidence: focused AI eval/security 41/41 PASS and full AI unit/integration suites 80/80 on Node 24.20.0; per-category error 0%, source SHA and evaluated diff fingerprint recorded in `audit/100-percent/ai-evals/results-2026-09-23.json`. No provider calls or business writes.
  - State: DONE locally; external processing stays disabled and unapproved.
  - Key files: `src/modules/ai-advisory/`, `tests/integration/ai-advisory/`, `Documents/AI-PROVIDERS.md`.

- **2026-09-23 — P13 / master-data approval gates and representative performance harness**
  - Changed: catalog separates governed schemas from value-set approval; all current value sets stay pending, so fixture and unconfirmed data are refused before database access. Reconciliation mismatch now rolls back; import output includes lineage and dataset hash. Synthetic load set adds linked file metadata, with local app memory/DB-pool sampling and same-scenario comparison support.
  - Evidence: focused unit 11/11 PASS, ESLint, Node syntax, diff check, and build PASS on Node 24.20.0. Typecheck FAILS on two pre-existing `.mjs` declaration gaps in release tests. Before/after P95 and server memory/pool measurements NOT RUN: no disposable app/database baseline was available; SLO/capacity decisions remain open.
  - State: PARTIAL — no production seeding or writes.
  - Key files: `scripts/data/master-data-catalog.ts`, `scripts/performance/seed-synthetic-dataset.ts`, `tests/performance/load-profiles.mjs`.

- **2026-09-23 — DENSE-QUEUES / توحيد سجل المهام والمختبر**
  - Changed: `/tasks` و`/laboratory/tests` يستخدمان عرض الجدول المشترك؛ البحث والترشيح والترتيب والصفحات في استعلامات الخادم، وعدّ النتائج يطابق مجموعة المرشحات. المختبر يرفض غياب/عدم كفاية `PERM-LAB-VIEW` بدل إظهار صفر؛ لم تُضف حقائق أو قواعد أو روابط غير موجودة في read models.
  - Evidence: Node 24.20.0؛ build وarchitecture وrelease:verify وPrettier للـTypeScript وdiff-check PASS. Typecheck لديه خطآن قائمان في declarations لسكريبتين `.mjs`؛ تكامل PostgreSQL BLOCKED لعدم توفر container runtime. replay اصطناعي 5,000 صف/طابور، 101 تجربة: مهمة due-sort من 200 صفحة إلى صفحة واحدة؛ عينة المختبر من غير قابلة للعثور ضمن أول 25 إلى قابلة للعثور. أزمنة المعالجة 0.103→0.235ms و0.001→0.077ms، وليست أزمنة بشرية أو HTTP؛ تحسن UX البشري NOT VERIFIED.
  - State: PARTIAL — مراجعة المتصفح/UAT ومقاييس إنجاز بشرية NOT VERIFIED؛ لا DB/provider/production writes.
  - Key files: `src/pages/tasks/index.astro`, `src/pages/laboratory/tests/index.astro`, `src/modules/laboratory/infrastructure/postgres-repository.ts`.

- **2026-09-23 — OBS-HEALTH-SIGNALS / ربط فشل الاعتماديات وعرض التدهور الآمن**
  - Changed: فشل pool غير المتزامن يصدر log/metric مرتبطًا ومصنفًا بلا تفاصيل driver؛ الصحة تعرض outbox pending كتدهور مع gauge، وتفصل liveness/readiness/QC-release والـbackup catalog/restore. التنبيه والاتجاه والتصدير والجهة المستقبلة `NOT CONFIGURED` وفق القرارات المؤجلة؛ لا عتبات مخترعة.
  - Evidence: Node 24.20.0؛ 10 اختبارات مركزة، architecture، typecheck، lint، build PASS. لا DB/provider/production writes.
  - State: PARTIAL — telemetry exporter ما زال no-op افتراضيًا؛ وصول التنبيهات والاتجاه وUAT NOT VERIFIED.
  - Key files: `src/shared/database/pool.ts`, `src/shared/observability/dependency-failure.ts`, `src/pages/system/health.astro`, `workspace-map/ENGINEERING.md`.

- **2026-09-23 — ARCH-DELIVERY-BOUNDARY / نقل قراءات العرض إلى application**
  - Changed: قراءات NCR/CAPA وربطهما، وإعداد توفر AI، ومفردات receiving/UAT أصبحت تمر عبر واجهات application؛ لا تغييرات صلاحيات أو نتائج قراءة مقصودة.
  - Evidence: Node 24.20.0؛ `pnpm test:architecture` PASS؛ typecheck 948 ملفًا / 0 أخطاء / 88 hints؛ suites المركزة 20/20 PASS؛ التحقق مربوط بالـHEAD `0ba087ca653c1f7d6855454f469716b52dc32307`.
  - State: PARTIAL — صفحات Astro المصادق عليها ونتائجها/صلاحياتها runtime ما زالت NOT VERIFIED؛ لا commit/push.
  - Key files: application dependencies/use case في quality NCR/CAPA.

- **2026-09-23 — AUDIT-PAYLOAD-BOUNDARY / تحقق قراءات audit المباشرة**
  - Changed: مسار idempotency في change requests يتحقق من payload المحفوظ قبل قراءة `expectedVersion`؛ الإسقاطات تواصل التحقق وتُبقي request ID دون تصدير payload.
  - Evidence: Node 24.20.0؛ اختبارات audit/read-model/change requests 26/26 PASS؛ typecheck 942 ملفًا و0 أخطاء؛ Prettier و`git diff --check` PASS.
  - State: DONE محليًا؛ لا تغيير صلاحيات أو بيانات أو سياسة احتفاظ.
  - Key files: `src/modules/change-requests/infrastructure/postgres-repository.ts`, `tests/integration/shared/audit.test.ts`.

- **2026-09-23 — FILE-EVIDENCE-01 / fail-closed upload boundaries**
  - Changed: `FileService` now requires explicit MIME/size/scanner policy; document-version actions no longer accept browser-supplied file IDs; evidence downloads resolve canonical links and authorize before object reads. Added draft decisions for unresolved file policy.
  - Evidence: Node 24.20.0 targeted file/telemetry tests 29/29 PASS; typecheck 942 files, 0 errors; build and release:verify PASS. Upload/download application routes and parent authorization wiring, approved scanner/policy, idempotency, and orphan reconciliation remain NOT VERIFIED/BLOCKED.
  - State: PARTIAL — allowlist/size/scanning/retention and per-domain policy decisions remain open; no production or provider writes.
  - Key files: `src/shared/files/file-service.ts`, `audit/2026-09-23/file-upload-policy-decision-request.md`.

- **2026-09-23 — OD-2026-09-23-RBAC-01 / قرار أدوار QC والاعتماد**
  - Changed: وثّق قرار Yazeed للأدوار ومصفوفة إنشاء 12 surface؛ QC متساوون بلا اعتماد/توقيع، Supervisor مرحلة أولى وQCM نهائي. أضيف API أدلة UAT الموثّق بالدورة/الفاعل/الدور، وترحيل 0038 لمنح QC وسحب اعتماد المرحلة الأولى من MANAGER.
  - Evidence: Node 24.20.0؛ authorization/UAT unit 47/47 PASS، typecheck 942 ملفًا بلا أخطاء، requirements:check PASS. PostgreSQL 18 integration/UAT وE2E BLOCKED لغياب container runtime؛ لم تُنشأ حسابات على أي قاعدة.
  - State: PARTIAL — PD-01/02/07 مفتوحة؛ لا UAT بشري ولا production writes أو deploy أو Git remote.
  - Key files: Documents/OWNER-DECISION-RBAC-2026-09-23.md، db/migrations/0038_owner_qc_report_access.sql، src/actions/uat-evidence.ts.


- **2026-09-23 — RENDER-DEPLOY / فشل نشر `ba9d60b` بسبب غياب run-context**
  - Changed: لا تغيير كود. صُحّح Build Command في خدمة Render `srv-dadqj67qj5pc7395rv2g` عبر الـAPI (كان يدويًا يتجاوز الـBlueprint) إلى `corepack pnpm install --frozen-lockfile && corepack pnpm verification:begin && corepack pnpm run build`، ونُشر `9b9af0c` بنجاح (`dep-dapri7egekts73ev1dfg` → live). كذلك كانت `DATABASE_URL` ببيانات اعتماد قديمة (فشل auth `28000`) واستُبدلت بسلسلة الاتصال الخارجية الحالية لقاعدة `qc-database` (أعيد النشر `dep-daprlh6gekts73evbceg` → live).
  - Evidence: النشر live؛ `/api/health/live` = 200 healthy والجذر يحوّل إلى `/login` على `qclevel.top`. `/api/health/ready` = 503 **متوقع**: قاعدة الإنتاج عند migration head `0018` بينما رأس المصدر `0038` وجدول `qc.reject_reports` غير موجود (بوابة readiness تجمع اتصال DB + توفر workflow — fail-closed كما صُمم). تطبيق الهجرات على الإنتاج يحتاج تفويضًا صريحًا.
  - State: DONE للنشر. ملاحظات إعداد في Render لا تطابق `render.yaml` (يدوية، لم تُغيّر): runtime `rust`، healthCheckPath فارغ، renderSubdomainPolicy disabled (نطاق onrender محظور `blocked-render-subdomain` — استخدم `qclevel.top`)، startCommand يشغّل `pnpm access:grant-system-owner` عند الإقلاع، ومتغيرا بيئة شاذان باسم `Key` و`Value`.
  - Security: مفتاح Render API وكلمة مرور DB ظهرا في المحادثة — يوصى بتدويرهما.

- **2026-09-23 — QC-100-FINAL-013 / inspection source decision gap traced**
  - Changed: documented approved fail-closed guardrails and added a draft-only QC/QMS/Document Control decision request; PD-01/02/07 remain OPEN. Existing create-from-receiving action is present; official result/source mapping blocks a valid positive approval path.
  - Evidence: requirements/state-machine/code trace reviewed on Node 24.20.0; focused PG integration BLOCKED because Testcontainers has no working runtime. No approval values or criteria inferred.
  - State: BLOCKED — positive PostgreSQL/E2E acceptance awaits approved owner decision and disposable PostgreSQL runtime.
  - Key file: `audit/2026-09-23/qc-100-final-013/owner-decision-request.md`.

- **2026-09-23 — UI-ROUTE-BASELINE / route visibility and task-first inventory**
  - Changed: reconciled stale `/admin` visibility denial with the current page guard/navigation; added current route × role and route copy-context matrices plus English task/state/measurement review.
  - Evidence: current source exports 87 routes/34 navigation destinations; Node 24.20.0 generation produced 435 role rows and 87 copy-context rows. Human task metrics and authenticated 1440/390 captures remain NOT VERIFIED.
  - State: PARTIAL — report `audit/2026-09-23/ui-baseline/current-interface-review.md`; no QC logic or runtime permissions changed.
- **2026-09-23 — REPORT-REDESIGN-ROLLBACK / العودة إلى تقرير ما قبل إعادة التصميم**
  - Changed: أُزيل ملحق تغيير التصميم من تقرير المجالات المئة وعادت البرومبتات التنفيذية إلى 22.
  - Evidence: مطابقة الملفين لنسخة `7d7f869` السابقة للتصميم، باستثناء تنسيق تاريخ Markdown؛ بقيت 100 درجة ومتوسط 55.0%.
  - State: DONE — لا تغيير في واجهة المنتج أو صلاحياته.

- **2026-09-23 — P03 / visual direction decision aid**
  - Changed: added three original directions with 12 synthetic workflow compositions, current 34-destination navigation, state/refusal examples, trade-offs, and a shared visual charter; `Evidence Ledger` recommended while `DESIGN-SYSTEM.md` stays approved and unchanged.
  - Evidence: Node 24.20.0 HTML/source checks; rendered browser review BLOCKED by URL policy; Product Owner and QC/QMS decision remains pending.
  - State: PARTIAL — `audit/2026-09-23/p03-visual-directions.html`; no runtime, permission, scientific rule, or retention change.
- **2026-09-23 — UI-BASELINE / inventory and visual baseline**
  - Changed: added a source-linked screen/role/state inventory and repeatable three-task usability protocol; authorized live reads via an existing `yazeed` browser session confirmed current empty/no-actionable states in several registers. No synthetic fixture or login credentials used against production.
  - Evidence: Node 24.20.0 `diagnose` and `typecheck` PASS; live route read-only; 1440/390 captures cover only local unauthenticated gate; authenticated production screenshots were not persisted.
  - State: PARTIAL — human task metrics and synthetic populated states remain NOT VERIFIED; audit `audit/2026-09-23/ui-baseline/interface-state-inventory.md`.
- **2026-09-23 — TOOLING / تثبيت uxaudit لـClaude Code**
  - Changed: إضافة سوق `gotalab-uxaudit` وتثبيت `uxaudit` بالإصدار `0.1.0` وتمكينه على نطاق المشروع.
  - Evidence: `claude plugin list` يعرض `uxaudit@gotalab-uxaudit` بحالة enabled؛ إعدادات `.claude/settings.json` صالحة.
  - State: DONE — إضافة Claude Code؛ المستودع يذكر أن دعم Codex غير متاح بعد.
- **2026-09-23 — TOOLING / تثبيت إضافة 21st لـCodex**
  - Changed: إضافة سوق `21st` وتثبيت الإضافة العالمية `21st@21st` إصدار `0.4.1`؛ MCP مربوط بمتغير `API_KEY_21ST` دون حفظ المفتاح في المشروع.
  - Evidence: حالة الإضافة `installed, enabled`؛ المتغير غير متاح لعمليات Codex التي تبدأ من الواجهة، لذلك مصادقة MCP لم تُتحقق وتتطلب توفيره ثم إعادة تشغيل Codex.
  - State: PARTIAL.
- **2026-09-23 — TOOLING / إضافة Impeccable لـCodex**
  - Changed: تثبيت المهارة الرسمية محليًا للمشروع (v4.3.1) ومحركها (v0.1.5) عبر `npx impeccable install --providers=codex --scope=project`.
  - Evidence: ملفات `.agents/skills/impeccable/` و`.codex/hooks.json` موجودة؛ Codex يتطلب مراجعة/اعتماد hook من `/hooks` قبل تفعيله.
  - State: DONE — التثبيت فقط؛ لم يُشغّل `impeccable init`.

- **2026-09-23 — QC-100-FINAL-036-B / ربط أدلة التحقق بالمرشح وتشغيل PG18 المحلي**
  - Changed: أدلة suites والبناء أصبحت مرتبطة بـSHA وبصمة المصدر وmigration head وNode والبيئة والتوقيت؛ runner E2E يستخدم Testcontainers PostgreSQL 18 عبر TLS ويعزل جلسات personas.
  - Evidence: رفضت البوابة SHA متغيرًا وتقريرًا قديمًا. على run `95969f8f` وfingerprint `06305aec…`: PG18 integration `487/487`، migrations `33/33`، security `52/52`، build `1/1`؛ unit `953/962` (9 FAIL). لم يُعَد concurrency بطلب المستخدم، وE2E أُوقف قبل إكماله. البوابة رفضت التقريرين الأقدمين، كما كشفت عدم تطابق manifest البناء بعد إضافة release identity إلى `dist/`.
  - State: PARTIAL — gate النهائي يفشل؛ إصلاح manifest، concurrency/E2E بأدلة حديثة، CI الخارجي، والقبول/UAT ما زالت غير متحققة.

- **2026-09-23 — QMD-CODEX-INTEGRATION-001 / وصل QMD بـCodex**
  - Changed: إعداد QMD 2.8.3 كـMCP عالمي عبر Node 24.20.0، تثبيت مهارته عالميًا، وإنشاء مجموعة `qc-operations` لفهرسة 73 ملف Markdown من الوثائق وذاكرة المشروع.
  - Evidence: MCP initialize/tools-list PASS (`query`, `get`, `multi_get`, `status`)؛ بحث lexical محلي PASS. نماذج GGUF غير منزلة، لذا vectors=0 والبحث الدلالي غير جاهز. أدوات MCP تحتاج إعادة تحميل Codex لتظهر في الجلسات.
  - State: PARTIAL — الإعداد والفهرس المحليان جاهزان؛ إعادة تحميل Codex مطلوبة لإتاحة الأدوات.

> آخر دمج: 2026-09-22  
> الغرض: ذاكرة تشغيلية قصيرة للوكيل، وليست بديلًا عن الكود أو الوثائق أو أدلة التدقيق.  
> **قاعدة التعارض:** الحالة الحالية والقرارات الثابتة في أعلى هذا الملف تتقدم على السجل التاريخي أدناه. السجل التاريخي للـtraceability فقط، ولا يعيد قرارًا ألغاه قرار أحدث.

- **2026-09-23 — Complete workspace file map, excluding tests**
  - Changed: ملفات التوجيه الستة في الجذر تحيل إلى فهارس `workspace-map/` التفصيلية؛ مولّد محلي يحافظ على فهرسة ملفات المشروع المتتبعة وغير المتتبعة ذات الصلة، مع استثناء الاختبارات والملفات المؤقتة/المولدة.
  - Evidence: 2,881 مسارًا فريدًا، كلها موجودة؛ `generate-workspace-map.py --check` و`git diff --check` PASS.
  - State: DONE.

- **2026-09-22 — Workspace router map**
  - Changed: أضيفت خمسة ملفات توجيه في الجذر للمنتج والهندسة والبيانات والتشغيل والتحقق، مع قسم `Map` في `AGENTS.md`.
  - Evidence: جميع المسارات الـ61 المشار إليها موجودة محليًا.
  - State: DONE.

- **2026-09-22 — Independent 100-discipline source audit + live read-only review**
  - Changed: أُنشئ تقرير HTML مستقل لـ100 مجال بسلم أدلة خاص به (55.0%، وليس مقام/درجة تدقيق المشروع ذي 80 مجالًا). مراجعة `qclevel.top` المصادقة كانت للقراءة فقط؛ لا تغيير في سجلات التطبيق.
  - Evidence: typecheck/lint/format PASS على Node 24.20.0؛ HTML يحوي 100 مجال ومرجعًا موجودًا لكل صف. المتصفح الحي: النواة READY وDB HEALTHY، لكن `/reject-reports` غير متاح لغياب migrations النشر؛ release SHA/head UNVERIFIED؛ backup catalog فارغ وrestore NOT VERIFIED. اختبارات الوحدة/التكامل/E2E لم تُشغّل لهذه المهمة.
  - State: PARTIAL — التحليل والتسليم المحلي DONE؛ التحقق الحي لا يرتبط بـSHA المستودع، والتغطية الديناميكية محدودة.
  - Key files: `audit/2026-09-22-repository-comprehensive-audit-ar.html`.

- **2026-09-22 — PR-A1 / مواءمة Node المحلي وإصلاح `.env` المحلي**
  - Changed: Node المحلي لتشغيلات التحقق إلى `v24.20.0` عبر `nvm use` + `.nvmrc` جديد؛ `.env` المحلي: `NODE_ENV=production` → `development` وإضافة `SERVICE_VERSION=0.1.0` و`RATE_LIMIT_LOGIN_MAX=8` و`RATE_LIMIT_LOGIN_WINDOW_SECONDS=60` (قيم معتمدة من harness المحلي/`package.json`، الأسماء فقط دون طباعة أي قيمة). عقد `package.json` engines/`.node-version`/CI كان مطابقًا مسبقًا — الفجوة كانت محلية.
  - Evidence: `pnpm diagnose` PASS (node-runtime + dotenv-configuration)؛ `pnpm release:parity:check` PASS (runtime-contract)؛ `pnpm typecheck` PASS (0 أخطاء)؛ `pnpm build` PASS — كلها على `node -v` = v24.20.0. صفر طباعة أسرار.
  - State: DONE — بلا commit/push.
  - Key files: `.nvmrc`، `.env` (untracked)، `Documents/ENVIRONMENT-DRIFT-REGISTER.md` (DRIFT-036-B-10).

- **2026-09-22 — QC-ULTIMATE-ZERO-ASSUMPTION-ADAPTIVE-AUDIT-001 / تحليل الحالة + خطة HTML تفاعلية**
  - Changed: تسليم عربي RTL واحد `audit/QC-ULTIMATE-CURRENT-STATE-ANALYSIS-AND-ACTION-PLAN.html` (KPIs، أدلة، بوابات 19، 17 نتيجة، مصفوفة 80 طازجة، 9 مجموعات RC، 16 برومبتًا كاملًا بنسخ/توسيع من `AUDIT_DATA` مصدّر واحد، مجهولات، قيود) على المرشح المجمّد `c4998fa4007ce2234c9f48940a0f48f56aa5930c` (tree `55987206…`، main == origin). دلتا من `653b58d`: 33 commit / 373 ملف. إعادة قياس: مجموع **3624 = 45.3%** (أساس 3739.3/تاريخي 3661=45.8%)، مقام 80 ثابت؛ بوابات **0/19**؛ NO-GO. خطة 67 بطاقة لها صفر سلطة توليد.
  - Evidence: typecheck/build/requirements:check/diff-check PASS؛ format FAIL 38؛ lint FAIL 2؛ architecture FAIL 17؛ unit FAIL 948/957 (9/7)؛ audit FAIL 30 (1 critical GHSA-26w7-cxv4-gfx2)؛ diagnose/parity FAIL (Node v22.22.3 خارج العقد، SERVICE_VERSION/RATE_LIMIT_LOGIN_* names only)؛ Docker-less PG suites BLOCKED؛ e2e evidence FAIL@f64960b ≠ HEAD؛ Render PG read-only public=0؛ GH runs failure. HTML مُتحقَّق متصفحًا: 80 صف/16 بطاقة/0 تكرار id/expand+copy يعمل.
  - State: DONE (تسليم وثائقي محلي) — بلا commit/push. `PASS ≠ RELEASED`.
  - Key files: `audit/QC-ULTIMATE-CURRENT-STATE-ANALYSIS-AND-ACTION-PLAN.html`.

## Current audit reality — 2026-09-18
- **2026-09-22 — QC-100-FINAL-037-B / unsaved-change + confirmation/recovery، تكامل وأدلة فنية (المرشّح HEAD `85dbe219689162afb0746cebbe0be9b38947ff5a`، بصمة dirty قبل `fa18d6d2…` وبعد `0a50dc64…` — الشجرة تحمل شغل laboratory غير مرتبط QC-DATA-003 وحُفظ، release محلي `rel-f841c47a20594672` verified)**
  - Changed: وحدة `src/ui/forms/unsaved-changes.ts` جديدة (حارس beforeunload للحقول المتسخة فقط، يُمسح بحدث `qc:form-committed` الذي يبثّه enhance-with-classification داخل فرع SUCCESS فقط، أو بـPOST أصلي غير معترض) موصولة بصفحات الإنشاء الست المعتمدة فقط — لا توقيعات/اعتمادات/سجلات مقفلة. **Autosave غير منفذ عمدًا**: لا عقد draft معتمد (تفويض/نسخة/احتفاظ) — القرار POLICY-DEPENDENT لـ013/026، ولا بيانات حساسة في تخزين المتصفح. البند 2 تحقق عقدي لآليات قائمة: focus return وEscape-أمان وstale-refresh في dialog.ts، استرداد الجلسة SESSION_ENDED→login/returnTo (031)، حارس التكرار، مسار الطلب المقاطع بمفردات UNKNOWN_SAFE_ERROR.
  - Evidence: عقد جديد `unsaved-navigation-contract` 18/18؛ عقود UI الست المتأثرة 113/113 PASS؛ typecheck 935/0 أخطاء؛ build + release:verify PASS؛ requirements:check PASS (domains=80). Unit الكامل 942/948 — 6 فشلات **سابقة كلها** (أُثبتت 4 UI منها على worktree نظيف عند HEAD؛ receiving-data-contract ×2 موثقة منذ 037-A). Node 22.22.3 خارج العقد كالسابق. Browser/E2E/AT/PG18 NOT RUN (003/006/040/002-027)؛ 012 يصالح. `PASS ≠ RELEASED`، gates 0/19 بلا تغيير.
  - State: DONE (بالبندين محليًا). Report: `audit/2026-09-22/QC-100-FINAL-037-B-integration-technical-evidence.md`.
- **2026-09-21 — QC-100-FINAL-036-B / بيئات وCI وهندسة الإصدار، تكامل وأدلة فنية (المرشّح المجمّد `5470a2ecbbd9da7593fe511e86da2e7c49bf80e1`, بصمة المحتوى `ab47712b0780654d936ced5462d031a1b423e289adf823fe07bb6a61659adc86` على 18 مسارًا, local release `rel-b5c70604216d73b7`)**
  - Changed: ثلاثة إصلاحات موثّقة على المرشّح — (1) **المرشّح كان لا يُبنى**: تكرار تعريف `describedBy`/`invalid` في `src/pages/quarantine/receiving/[receivingId].astro` أُزيل؛ (2) **هوية بناء حتمية**: `astro.config.mjs` يثبّت `ASTRO_KEY` **غير سرّي** (التطبيق لا يستخدم `astro:env getSecret`) و`scripts/release/normalize-server-manifest.mjs` (جديد، تستدعيه integration `astro:build:done`) يعيد تسمية `server/manifest_<hash>.mjs` → `server/manifest.mjs` ويكتب فقط المرجعين المتوقعين، ويفشل مغلقًا على أي مرجع غير متوقع؛ (3) **بوابة ترقية مرحلية جديدة** `scripts/release/check-staged-promotion.mjs` + `pnpm release:promotion:check` بسبعة فحوص fail-closed (ترتيب بيئات DEP-001، ربط المرشّح بالـcheckout، تطابق digest الملف مع `artifactSha256`، **parity الترقية عبر البيئات**، خطوة migration forward-only مقابل السجل، شروط rollback حسب نمط الفشل، وrecovery posture لخطر `HIGH` مربوطة بالـhead قبل الترحيل) + `.github/workflows/ci.yml` يسجّل build manifest في `.ci-results/` خارج `dist/` + `Documents/ENVIRONMENT-DRIFT-REGISTER.md` (جديد، 15 انحرافًا بفعل مشغّل دقيق) + إصلاح head الموثّق في `Documents/EXTENDING-THE-SYSTEM.md` (`0034` → `0035_receiving_normalization`) وإصلاح 6 أخطاء lint كلها في ملفات 036-A. **لا تغيير في تفويض الخادم ولا policy ولا schema/migrations.**
  - Evidence: `pnpm build` exit 1 → 0 مع إقلاع الخدمة (`/api/health/live` 200، `/login` 200)؛ **4 عمليات build متتالية من `dist/` نظيف متطابقة**: `reproducible: true`, 325 ملفًا, digest `da6fc6bb…81c99`, و`entry.mjs` `a12fcb45…5f816` (قبل الإصلاح كان كل rebuild يغيّر `entry.mjs` + اسم chunk المانيفست)؛ release identity `rel-b5c70604216d73b7` + `release:verify` PASS، وهوية ثابتة `rel-e33e895d19e5b3bc` لنفس build id/timestamp؛ بوابة الترقية **7/7 PASS** على المرشّح و**FAIL مغلق** عند تلاعب `artifactSha256` أو غياب recovery؛ 12 وحدة اختبار جديدة PASS؛ `release:parity:check` 7/7 PASS (كان 2 FAIL)؛ `pnpm lint` exit 0 (كان 6 أخطاء)؛ `pnpm typecheck` 909 ملفًا/0 أخطاء/74 hints؛ `pnpm requirements:check` PASS (denominator 80)؛ `release:tech-debt:check` PASS؛ `release:evidence:check --require-release` **FAIL مغلق** (exit 1) بدل ادعاء PASS؛ `pnpm test:unit` 868/873. المصدر schema head `0035_receiving_normalization` / checksum `c1f6aae4…`؛ Node 24.20.0.
  - State: PARTIAL — البندان DONE محليًا؛ **handoff الخاص بـ036-A مفقود** (التنفيذ موجود ومُعاد التحقق منه، والتقرير/السجل غائب — مُسجَّل بالتفصيل في التقرير)؛ CI **BLOCKED** (قفل حساب/فواتير) وترقية الإصدار وإعادة بناء المزوّد وmigrations الإنتاج خارجية تحتاج تفويضًا؛ بوابات موروثة حمراء على المرشّح المجمّد (format 15 ملفًا، 5 اختبارات unit مُثبت أنها سابقة، architecture). `PASS ≠ RELEASED`، gates 0/19 والمقام 80 بلا تغيير. Report: `audit/2026-09-21/QC-100-FINAL-036-B-integration-technical-evidence.md`.
- **2026-09-21 — Mind rollover (QC-100-FINAL-036-B):** تجاوز `01` الحد الصلب (124,320 بايت)؛ نُقلت أقدم سجلات Historical Ledger (`QC-100-FINAL-011/014/013/015/002` بتاريخ 2026-09-19، وسجلات «Fresh» لـ001/007/003/010/009/002، وسطر rollover الخاص بـ004 Task 7) إلى أعلى `02-mind-mid.md` بعد التحقق من غيابها في الأرشيف. لم تُنقل قرارات حالية ولا invariants ولا مشاكل مفتوحة: بقيت `NO-GO`/gates 0/19، خطة العمل الحالية، قرار التدقيق 012، حالة UAT البشرية 004، وقواعد القياس السلبية. الحالة: DONE.
- **2026-09-21 — QC-100-FINAL-035-B / configuration & DevEx integration evidence (candidate `4fa6ac3b3bdf2330335ba1d26d019c83af7c8876`, source dirty fingerprint `d28d515861368ec53347703c90c97f41df519980c9000681e4cf591ad2ed9346`, local release `rel-3a869b3a52445ad0`)**
  - Changed: `LOG_LEVEL` is now typed in `parseServerEnv` (allowlist, names-only rejection) with `resolveLogLevel()` degrading to `info` at the request path; partial `R2_*` backup config now fails validation all-or-none; new `Documents/CONFIGURATION-REFERENCE.md` (approved defaults + change impacts, secret-free); new read-only fail-closed `pnpm diagnose` (`scripts/diagnostics/run-local-diagnostics.mjs`) checking toolchain contracts, repo identity, migration head, and env validation incl. the allowlisted `.env` merge; `EXTENDING-THE-SYSTEM.md` migration head corrected 0029→0034; `LOCAL-DEVELOPMENT.md` gained diagnose + tech-debt ownership sections. Runtime/toolchain contracts untouched.
  - Evidence (02:00–02:09 UTC, Node 24.20.0): new config contract `8/8 PASS`; full unit `112 files/815 PASS`; typecheck `892/0/0/74 hints`; build + release verify PASS; requirements guard PASS (denominator 80); tech-debt checker PASS. `test:architecture` **FAIL pre-existing at HEAD** (NCR/CAPA + ai-advisory delivery-boundary violations); `db:migrate:check` BLOCKED by local `.env` gap (NODE_ENV=production without SERVICE_VERSION/rate-limit — now diagnosed by `pnpm diagnose`, names only).
  - State: PARTIAL. **035-A handoff is MISSING** (no report/ledger): module-boundary map + API/action contract work without recorded evidence — exact missing input recorded in the report. 013/026 confirm defaults wording; 002/027 DB regression; 003/006/040/004 external; 012 reconciles. Next phase 036. Denominator 80 and scores unchanged; `PASS ≠ RELEASED`. Report: `audit/2026-09-21/QC-100-FINAL-035-B-integration-technical-evidence.md`.
- **2026-09-21 — QC-100-FINAL-034-B / resilience integration evidence (candidate `4fa6ac3b3bdf2330335ba1d26d019c83af7c8876`, source dirty fingerprint `b8feaa9e5457318e5caa907444e2d2ea349f5c47ef6483ead0806457ea9712db`, local release `rel-0e889c54aa21f576`)**
  - Evidence: correlation/health/backup focused tests `65/65 PASS`; readiness against unavailable DB degrades to false; requirements guard PASS, denominator 80. Disposable PG18.6 current-head restore validated 34 migrations, 79 app tables + probe / 531 restored rows and one file hash; technical restore+validation 574ms. Read-only load 2,000/2,000 PASS through concurrency 40, pool queue drained. These are local measurements, not approved RPO/RTO/SLO or production capacity.
  - State: PARTIAL. Production telemetry exporter remains unwired (no-op default); failure signals now emit sanitized correlated structured logs/metrics; health shows pending outbox as DEGRADED with a gauge. Alert delivery, numeric thresholds, backlog trend window, and receiver remain NOT CONFIGURED per approved deferrals; provider DR NOT VERIFIED. 013/026 own budget/export/alert decisions; 002/027 extend representative recovery/pressure evidence; 003, 006/040, then 012 remain. Report/evidence: `audit/2026-09-21/QC-100-FINAL-034-B-integration-technical-evidence.md` and `...-local-drill-evidence.json`. Denominator 80 and scores unchanged; `PASS ≠ RELEASED`.
- **2026-09-21 — QC-100-FINAL-034-A / resilience contracts (candidate `0e9bdf28ae448ab2ebc197c567a05832ea88c07d`, dirty fingerprint `bc3746085e48528d6b7d95f9d8509d3963fd407d86bcb684b18fd831114909c1`, release `rel-ad3217a896358bca`)**
  - Changed: centralized safe failure classes; outbox retry summaries no longer persist raw error text; per-delivery exponential delay is capped at 15 minutes. No retry attempt ceiling/dead-letter policy was invented.
  - Evidence: focused provider/files/object-store/outbox/classifier `43/43 PASS`; final typecheck `0/0/74 hints` and build at 00:32 UTC; release identity and requirements guard PASS on Node 24.20.0; source schema head `0034`. PostgreSQL unavailable locally; applied schema and pressure/recovery measurements NOT VERIFIED.
  - State: PARTIAL. Approved retry exhaustion and DB timeout/capacity budgets 013/026; disposable PG18 and representative DB/outbox/file/provider drills 002/027 then 012. Next QC-100-FINAL-034-B. Scores and domain denominator 80 unchanged; `PASS ≠ RELEASED`. Report: `audit/2026-09-21/QC-100-FINAL-034-A-core-contracts.md`.
- **2026-09-21 — QC-100-FINAL-033 / privacy controls and UX (candidate base `0e9bdf28ae448ab2ebc197c567a05832ea88c07d`, source dirty fingerprint `d5b7f826d510c22a555f1c6f4e8ad878829fada7fd3f13196731487cb7e1dab3`, local release `rel-970f66a2b8acc936`)**
  - Current: Groq/Gemini requests now require explicit server-side `AI_EXTERNAL_PROCESSING_APPROVED=true` (default false); analytics event values are bounded to categorical allowlists; logger redaction covers common personal/request/AI/record content fields. Account, report-export, and AI notices explain their actual limits.
  - Evidence: focused privacy/security/export/copy `70/70 PASS`; typecheck `889/0/0/74 hints`; build and local release identity verification PASS; requirements guard PASS with denominator 80. Node `22.22.3` is below the runtime contract. Exact-candidate PostgreSQL report scope/history tests BLOCKED (Testcontainers runtime unavailable); applied schema NOT VERIFIED. Report: `audit/2026-09-21/QC-100-FINAL-033-privacy-controls.md`.
  - State: PARTIAL. 013/026 own field classification, correction/deletion, retention, export privacy and AI processor decisions; 002/027 exact-candidate PG18, 003 authenticated E2E, 006/040 accessibility, and 012 final reconciliation remain. Do not enable provider processing without recorded approval. No score/domain change; `PASS ≠ RELEASED`.
- **IAM authority/session UX (QC-100-FINAL-031, candidate `4d889128052ba66791b2c7a1a0b6e414f3beecfb`, source dirty fingerprint `bf0472b30db6838a11f186c4cd9c42b410aac783d5e7ee251f3ff5156af85cab`, release `rel-61446cc60088de49`)**
  - Current: expired/revoked protected sessions now show login recovery guidance with validated local returnTo and explicit no-resubmit copy; role/permission/scope/action mapping is captured as derived evidence without changing policy sources or the 80-domain denominator.
  - Evidence (2026-09-20 22:49–22:50 UTC): focused contracts 34/34; typecheck 887/0/0/74 hints; build/release verification and requirements guard PASS. Node 22.22.3 is outside contract; whole-repo format check FAIL is isolated to pre-existing untouched `tests/unit/ui/record-journey-contract.test.ts`; source migration `0033`, applied schema NOT VERIFIED.
  - State: PARTIAL. Full action-surface matrix and exact-candidate database regression go to 002/027; authenticated role/session/direct-request E2E to 003; accessibility to 006/040; final reconciliation to 012. See `audit/2026-09-21/QC-100-FINAL-031-authority-to-ui-matrix.md`.
- **2026-09-21 — QC-100-FINAL-032-A / database governance and concurrency controls (candidate `a0d0661294cb7cba17d8a9a9068a9f696ec197cf`, dirty fingerprint `cd63ebb3036e9154a9c57d073eb553d200d41ebf0dfd92d067fff1014ee5cf2b`, release `rel-ac6232405c719762`)
  - Changed: migration-backed data governance/lineage/stewardship register; Quality aggregate compare-and-set now advances versions, including RCA edits; added disposable-PG concurrency cases. Source head `0033_controlled_document_execution_context` / checksum `6b4cf38a…`.
  - Evidence: requirements guard, typecheck 887/0/0/74 hints, targeted lint/format, build and exact-SHA local release verification PASS on unsupported Node 22.22.3. PostgreSQL concurrency suite BLOCKED (no container runtime; PG14 `initdb` shared-memory EPERM); applied schema NOT VERIFIED. Report: `audit/2026-09-21/QC-100-FINAL-032-A-core-contracts.md`.
  - State: PARTIAL; 002/027 must run exact-candidate migration/concurrency regression on disposable PostgreSQL 18; 013/026 own open steward/classification/correction and source/authority decisions; 012 reconciles. Next: QC-100-FINAL-032-B. Denominator 80 and NO-GO/gates unchanged; `PASS ≠ RELEASED`.
- **2026-09-21 — QC-100-FINAL-030-B / secure delivery evidence (candidate `4d889128052ba66791b2c7a1a0b6e414f3beecfb`, source fingerprint empty-set `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, evidence fingerprint `5ab59be676f97546d441a053df3434ee6bf2f6f96b8263a0741495225793d4a0`, release `rel-b1ba82df142eb97c`)
  - Changed: lockfile-derived CycloneDX 1.5 inventory (822 components / integrity hashes); reference-only secret inventory and rotation/leak-response procedure. No source or dependency versions changed.
  - Evidence (2026-09-20 22:23–22:40 UTC): offline frozen install PASS; focused security 88/88 PASS; local build and exact-SHA release identity PASS on unsupported Node 22.22.3; 4 repeated build artifacts differed at generated Astro manifest filename (reproducibility FAIL); pnpm audit BLOCKED by registry ENOTFOUND; applied schema NOT VERIFIED. No secret values inspected or credentials rotated. Report: `audit/2026-09-21/QC-100-FINAL-030-B-integration-technical-evidence.md`.
  - State: PARTIAL. Current advisory/CI provenance and 002/027 exact-candidate disposable-PostgreSQL evidence go to 012; build reproducibility needs diagnosis. 013/026 still own approved file scan/MIME and retention/orphan policy; live credential state/rotation belongs to authorized provider owner.
- **2026-09-21 — QC-100-FINAL-030-A / core security contracts (candidate `df647bc455e55fbec879661e898d147ffbec94e3`, dirty fingerprint `b236c6ceb0ef425a2eed2ad1cc33cfcc0ca0e628773047af95a1d2154a8a1153`, release `rel-ac6ee814ab689750`)**
  - Changed: scoped threat model, CI dependency audit gate, atomic file/evidence metadata persistence with object cleanup compensation.
  - Evidence (2026-09-20 22:29 UTC): focused contracts 113/113, typecheck 884/0/0/74 hints, build/release identity and requirements guard PASS. PostgreSQL parity BLOCKED (container runtime unavailable); pnpm audit BLOCKED (registry DNS); Node 22.22.3 outside contract. Report: `audit/2026-09-21/QC-100-FINAL-030-A-core-contracts.md`.
  - State: PARTIAL; item 1 DONE, item 2 PARTIAL. Approved file scanning/MIME policy and retention/orphan lifecycle owner remain open for 013/026; PostgreSQL and exact-candidate CI evidence 002/027/012; next phase 030-B.
- **2026-09-21 — QC-100-FINAL-029-B / integration and technical evidence (frozen candidate `e872260bf91c8a27dc6d58088b39b7a9b022e752`, dirty fingerprint `bf6e62e86e2c0c95128dfdd19f75b41c550dba25e018475d9ce20da8704d5e5e`, release `rel-31d58df694fb5944`)**
  - Changed: migration source head `0033_controlled_document_execution_context`; version-specific WI/SOP links and immutable effective-version/result snapshots for lab tests and inspections; append-only UPDATE/DELETE/TRUNCATE guards.
  - Evidence: Node 24.20.0 / pnpm 11.25.0; typecheck 883/0 errors/0 warnings/74 hints, build/release verify, selected lint/format, requirement reconciliation (80 domains), and audit/signature/document unit 8/8 PASS. Database integration BLOCKED (container unavailable; disposable PG14 `shmget: Operation not permitted`); migration unapplied, applied schema NOT VERIFIED. Report: `audit/2026-09-21/QC-100-FINAL-029-B-integration-technical-evidence.md`.
  - State: PARTIAL; 002/027 PostgreSQL 18 verification and 013/026 authority decisions remain open; 003 authoring-surface E2E only if required; final evidence reconciliation 012. External human acceptance excluded. Scores and 80-domain denominator unchanged; `PASS ≠ RELEASED`.
- **2026-09-21 — QC-100-FINAL-029-A / record, signature and document integrity (candidate `32652b93de4d4dede9f5427c47a3cb940a8f168e`, dirty fingerprint `8cea29755f1c27d6bacffa7f17951fca539a8aa024bdcebaa428f19de3ff56bc`, release `rel-efb56b6dceddb70f`)**
  - Changed: source migration head is now `0032_document_version_file_integrity`; document-version file links are draft-only on insert and immutable against update/delete/truncate. Existing versioning/signature mechanics were traced; no policy-open signature edge was added.
  - Evidence: typecheck 883/0/0/74 hints, build and exact-SHA release identity PASS on Node 22.22.3 (unsupported); focused signature/document contracts 5/5 PASS. PostgreSQL test 4 skipped/BLOCKED (no container runtime), so migration syntax/application and applied schema remain NOT VERIFIED; migration-ledger check BLOCKED (`tsx` IPC `EPERM`). Item 1 source trace DONE/DB control NOT VERIFIED; item 2 existing code traced/DB behavior NOT VERIFIED. Report: `audit/2026-09-21/QC-100-FINAL-029-A-core-contracts.md`.
  - State: PARTIAL; 002/027 disposable-PostgreSQL verification, 013/026 approved policy/authority decisions, 003/006/040 applicable checks, external human evidence 004, and final reconciliation 012 remain dependencies. No score or 80-domain denominator change; `PASS ≠ RELEASED`.

- **2026-09-21 — QC-100-FINAL-028-B / integration and technical evidence (candidate `32652b93de4d4dede9f5427c47a3cb940a8f168e`, implementation fingerprint empty-set `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, release `rel-068a28d3d71b279c`)**
  - Changed: candidate-bound evidence handoff only; no source/test behavior changed. Lifecycle/QMS focused contracts 66/66, typecheck 883/0/0/74 hints, build and exact-SHA release identity PASS on Node 24.20.0. Source schema head `0031_qc_creation_parity_two_stage_approval` / checksum `44b160a6…`.
  - Evidence: populated PostgreSQL invocation BLOCKED (47 cases skipped; 5 suites failed setup) because Docker runtime is unavailable and isolated PG18 `initdb` fails `shmget: Operation not permitted`. Candidate-specific atomic DB edges, immutability, replay/concurrency and QMS linkage therefore remain NOT VERIFIED; no policy-blocked edge was opened. Report: `audit/2026-09-21/QC-100-FINAL-028-B-integration-technical-evidence.md`.
  - State: PARTIAL; 002/027 fresh disposable-PG regression, 013/026 approved policy sources, 003/006/040 where applicable, genuine 004 evidence, and final 012 reconciliation remain dependencies. Scores and 80-domain denominator unchanged; human acceptance excluded.

- **2026-09-21 — QC-100-FINAL-028-A / core contracts and controls (candidate `0f25de0f54dbaf3249d56a25a863ec52a42b2f28`, source fingerprint `91ec238d37e2653fbe77dd3e6673199462a610889e72e68f3e176fb76465e3f0`, release `rel-5543d7477e453b02`)**
  - Changed: lifecycle transition index added/reconciled; inspection/lab final-approval signature evidence now commits in the owning transaction; maintenance VOID denied at domain and use-case boundaries absent approved transition.
  - Evidence: focused 9/9 tests, typecheck 883/0/0/74 hints, targeted format/lint and local build/release PASS on unsupported Node 22.22.3. PG18 integration BLOCKED (no container runtime); disposable PG14 fallback BLOCKED by sandbox System V shared-memory EPERM; migration CLI BLOCKED (tsx IPC EPERM); architecture gate retains known NCR/CAPA violations.
  - State: PARTIAL; PG18 verification 002/027, E2E 003, accessibility 006/040, policy/source decisions 013/026, human evidence 004 and reconciliation 012 remain dependencies. Human acceptance excluded; denominator 80 and scores unchanged.
  - Key files: `audit/2026-09-21/QC-100-FINAL-028-A-core-contracts.md`, `Documents/STATE-MACHINES.md`, `Documents/BUSINESS-RULES.md`, `src/shared/e-signatures/insert-signature-evidence.ts`.

- **2026-09-21 — QC-100-FINAL-027-B / تكامل الأدلة الفنية (candidate `0f25de0f54dbaf3249d56a25a863ec52a42b2f28`, dirty fingerprint `ce83e6fa0a7ec51078776381bbe20878aceff8ca7cc5aac6850fa0cd741adff6`)**
  - Changed: تصحيح fixture/teardown لاختبار QC-024، وتثبيت locator/مهلة اختبار login؛ لا تغيير runtime أو سياسة صلاحيات.
  - Evidence: unit 785/785، PG integration 470/470، UI contracts 44/44، migrations 29/29، concurrency 12/12، security 52/52، typecheck 0 أخطاء، build/release identity PASS؛ authenticated E2E الواسع PARTIAL/FAIL (27 فشلًا، 12 skip بالتقرير) مع focused login 2/2 PASS؛ architecture gate FAIL بانتهاكات NCR/CAPA السابقة. PostgreSQL محلي disposable 18.6/schema 77 جدولًا؛ التفاصيل والتوقيت في التقرير.
  - State: PARTIAL؛ 003 يصلح E2E fixtures/session، 006/040 يكملان فحوص الوصول، 004 يحتفظ بدليل القبول البشري؛ 012 يجمع الأدلة. لا تغيير للمقام 80 أو الدرجات.
  - Key files: `audit/2026-09-21/QC-100-FINAL-027-B-integration-technical-evidence.md`.

- **2026-09-20 — QC-100-FINAL-027-A / عقود جودة الاختبار الأساسية (candidate `2f0cfeff2d5f70d8a8b17b0cfedf07408ece70fd`, fingerprint `d8fe4e18a2686f1ec0e44828bbdd1d627c0dc2324e8b9c101fdf82d259eeb659`)**
  - Changed: عزل cleanup للـunit globals، clock/random وfixture IDs حتمية، وعقود رفض الصلاحية على مستوى action/use case بلا كتابة؛ تقرير item-by-item.
  - Evidence: unit 105/785 PASS، build/release identity محلي PASS؛ PostgreSQL contracts BLOCKED لعدم توفر container/`QC_TEST_DATABASE_URL`؛ typecheck وarchitecture gate FAIL كما بالتقرير.
  - State وقت A: PARTIAL؛ تحققت عقود PostgreSQL لاحقًا محليًا ضمن 027-B؛ بقي هدف Docker/Testcontainers والعزل العام لـ21 reset sites غير محسوم، وE2E 003 وaccessibility 006/040 ومصالحة 012 مطلوبة. denominator 80 وgates 0/19 دون تغيير.
  - Key files: `audit/2026-09-20/QC-100-FINAL-027-A-quality-engineering-core-contracts.md`.

- **2026-09-20 — Mind rollover (QC-100-FINAL-026):** تجاوز `01` الحد الصلب (121,894 بايت)؛ نُقلت أقدم سجلات 2026-09-18 إلى أعلى `02-mind-mid.md` بعد التحقق من غيابها فيه، مع تثبيت ثوابت `NO-GO`/gates وانحراف Render في أقسام الحالة الحالية. لم تُمس القرارات الحالية ولا الـinvariants ولا المشاكل المفتوحة. الحالة: DONE.

- **2026-09-20 — QC-100-FINAL-026-B / تكامل سجل القرار والدليل الفني (مرشح `802de981a6dcaf9a4bde7ed6fa155c23b7726ee3`، بصمة التنفيذ `43771dc773e7cf2a73a3851ff9cea3298c19b57ceaad6e7df665c32fc4ff4c27`)**
  - Changed: سجل 5 افتراضات و33 صف قرار يغطي 35 PD مفتوحًا/جزئيًا، مع أسئلة المالك والسلوك والاعتماد والدليل؛ وخريطة التخصصات على النطاقات الموجودة فقط بلا تغيير مقام 80. أضيف حارس وعقد unit.
  - Evidence: requirements guard PASS (`100/34/20/33/5/7/80`)، unit 7/7 PASS، build PASS محدود بـNode 24.19 دون عقد 24.20، وهوية بناء محلية موثقة. typecheck FAIL بخطأ TS2353 السابق في QC-024؛ regression/E2E/accessibility لم تُشغّل لهذا المرشح؛ schema المطبّق وUAT غير متحققين/محجوبين.
  - State: PARTIAL إجمالًا، البندان المحليان DONE؛ بقاء PD وملاك 013، أدلة 002/027 و003 و006/040، UAT 004، ومصالحة 012. NO-GO وgates 0/19 بلا تغيير.
  - Key files: `audit/2026-09-20/QC-100-FINAL-026-B-integration-technical-evidence.md`, `Documents/DECISION-ASSUMPTION-REGISTER-026.md`.

- **2026-09-20 — QC-100-FINAL-026 / مصالحة المتطلبات ومصفوفة أولوية الفجوات والمخاطر (HEAD `6f07cf28fdf63469ab32c294a0943563ea962fff`، شجرة نظيفة عند التجميد، بصمة المحتوى النهائية `5fc27086af7c8231afff28a1f7a4dfcc3f4f713f`، release `rel-9c21a4b6db52b36c` محلي، مقارنة التدقيق: مرشح 2026-09-19 `653b58d2`، maturity 45.8%، gates 0/19، NO-GO بلا تغيير)**
  - Changed: `Documents/REQUIREMENTS-RECONCILIATION.md` (سجل مصالحة مشتق 100 صف / 9 عائلات RC-01..RC-09: معرّف مستقر + مصدر + هدف عمل + قابلية تطبيق + صنف قدرة MANDATORY=96/OPTIONAL=4 + مالك + مرجع دليل؛ 273 معرّفًا قديمًا من 31 عائلة مطويّة حرفيًا بلا إعادة ترقيم؛ القرارات المفتوحة PD/RD تبقى POLICY/SOURCE-DEPENDENT بـruntime DENY بلا إغلاق)؛ `Documents/GAP-RISK-PRIORITY-MATRIX.md` (20 فجوة G-026 + أولوية المخاطر الـ34 كلها بمنهج RISK-REGISTER §4–§8: أولوية بقيادة الأثر لأن Likelihood تبقى ASSESSMENT REQUIRED ولا تُخترع؛ لا إعادة تصنيف مطلوب→اختياري)؛ حارس آلي `scripts/requirements/check-reconciliation.mjs` + عقد unit (5 اختبارات)؛ تثبيت نطاقات التدقيق الـ80 حرفيًا (المقام ثابت؛ تخصصات 026 تُسقَط على D01/D21/D42/D53/D60/D61/D80 بلا نطاق جديد)؛ DOCUMENTATION-INVENTORY حُدّث. **لا تغيير على كود runtime ولا تفويض ولا schema/migrations.**
  - Evidence: الحارس PASS (requirements=100, risks=34, gaps=20, domains=80)؛ unit `tests/unit/requirements/reconciliation-contract.test.ts` 5/5 PASS؛ prettier+eslint PASS على الملفات الستة الملموسة؛ فشل typecheck السابق في `tests/integration/qc-100-final-024/record-journey-linkage.test.ts` (TS2353) خارج هذا الـdiff كما هو مسجل. Node المضيف v22.22.3 خارج العقد (انحراف موثق سابقًا).
  - State: PARTIAL — البندان 1–2 DONE محليًا؛ اكتمال العائلة يتطلب 026-B (سجل قرارات/افتراضات) + أدلة خارجية (013 policy، 004 UAT، 002/027 regression، 003 E2E، 006/040 a11y، تجميع 012). `PASS ≠ RELEASED`، gates 0/19.
  - Key files: `audit/2026-09-20/QC-100-FINAL-026-requirements-risk-reconciliation.md`, `Documents/{REQUIREMENTS-RECONCILIATION,GAP-RISK-PRIORITY-MATRIX}.md`, `scripts/requirements/check-reconciliation.mjs`، `package.json` (`requirements:check`).
- **2026-09-20 — QC-100-FINAL-025 / First-day operating checklist + incident/problem runbook + local recovery exercise (HEAD `e29c9fd3b282ae1c5053993cc19a6779af9c7a26`، dirty tree، بصمة المحتوى النهائية `93b5cbe8dfe06ec83b05f976d6cbb4ef959eb1a8b203d0941bfbc41893ca58a4`، release `rel-c2d11ab601eb0704`)**
  - Changed: `Documents/FIRST-DAY-OPERATING-CHECKLIST.md` (12 صفًا بدليل/مالك/اعتمادية/فعل قابل للعكس + فصل READY(local)/PENDING(external) + وضع تشغيل أدنى وشروط إيقاف العمل من السياسة المعتمدة + سجل DEP-025-01..07) و`Documents/INCIDENT-PROBLEM-RUNBOOK.md` (قالبا سجل حادث وسجل مشكلة + خريطة فشل→استجابة أولى) كطبقة مشتقة بلا مصدر سياسة جديد؛ DOCUMENTATION-INVENTORY حُدّث. تمرين فشل/استعادة محلي على PG 18.6 مصرفي `qc_f025` (31 migration/77 جدولًا، بيانات `f025-*` disposable، بلا تنبيه خارجي أو محاكاة موافقة بشرية): S1 انقطاع dependency → فشل مغلق بلا تسريب ثم تعافٍ PASS؛ S2 إعادة محاولة idempotent بعد كتابة غامضة → replay للنتيجة المسجلة ورفض fingerprint متعارض PASS؛ S3 فشل side effect الـoutbox لا يتراجع عن الالتزام + dedupe آمن وصف pending قابل للمطالبة PASS؛ S4 dump (276,813 بايت) → استعادة معزولة `qc_restore_f025` و`run-recovery-checklist` PASS لمخطط الـmanifest وقاعدة الاستعادة، وضابطة سلبية بـledger فاسد FAILed بأمانة، وبوابات provider/operator بقيت BLOCKED كما صُمم.
  - Evidence: نتيجة التمرين `2026-09-20T16:31:45Z` exit 0 (6/6)؛ prettier PASS على الملفات الأربعة الملموسة؛ لا سر في الأدلة. فشلان **سابقان** غير ملموسين في ملفات عائلة 024 (`record-journey-contract` format، و`record-journey-linkage` typecheck error + lint unused import) — ليست من هذا الـdiff. Node التمرين v24.20.0 (داخل العقد).
  - State: PARTIAL — البنود 1–4 DONE محليًا؛ التشغيل الإنتاجي/استعادة المزود/E2E/accessibility/UAT خارجية BLOCKED (012 تجمع DEP-025). `PASS ≠ RELEASED`، gates 0/19.
  - Key files: `audit/2026-09-20/QC-100-FINAL-025-first-day-operating-checklist.md`, `Documents/{FIRST-DAY-OPERATING-CHECKLIST,INCIDENT-PROBLEM-RUNBOOK}.md`.
- **2026-09-20 — QC-100-FINAL-023 / Copy inventory & terminology governance (base HEAD `654c3d4e7d388dfa4ddf3fea4f24320d8675625d`، tree `edb95d39b53b6686b0cd9bc9714ccc9b3f470ce9`، dirty tree 25 مسارًا، بصمة المحتوى `432ae27ad1638504b4c160622d34dbc8be7edbd8ac45f487da30e23c9c5e8864`)**
  - Changed: جرد نسخ على مستوى كل عائلة مسار (87 مسارًا / 26 عائلة) `Documents/COPY-INVENTORY.md` + قاموس مصطلحات محكوم `Documents/COPY-GLOSSARY.md` (المصطلحات المنظَّمة، الكلمات الخمس المنفصلة saved/submitted/reviewed/approved/released، جدول كود→تسمية، الحدود، النسخ الممنوعة) **بلا مصدر سياسة جديد** (المصدر الوحيد للتنفيذ يبقى `src/shared/copy/ux-vocabulary.ts`). أُضيف `uxVocabulary.lifecycle` و`targetTypeLabel()`/`workflowTypeLabel()` ووُسّع `stateLabels` (IN_REVIEW/EFFECTIVE/SUPERSEDED/APPLIED/APPLYING/APPLICATION_FAILED/CLOSED/PENDING_QCM_APPROVAL/NOT_DETERMINED/NOT_RELEASED/ISSUED/APPROVAL_TRACKING/FINALIZED). حُوّلت الحقائق الخام إلى تسميات بشرية (حالات + `transitionLabel` + تسميات نوع الهدف/سير العمل)، وأُزيلت عناوين "ID" فوق أرقام بشرية (receiving/inspections/laboratory/findings/documents + نماذج الإنشاء)، وحُلّت أسماء الأشخاص في السجلات (laboratory/inspections/findings/documents/approvals) بfallback عرضي فقط `Named account`. **لا تغيير على تفويض الخادم ولا المصطلحات المنظَّمة ولا schema/migrations.**
  - Evidence: typecheck **0 errors**؛ unit **101 ملف/766 PASS** (+13 عقد جديد `tests/unit/ui/copy-governance-contract.test.ts`)؛ architecture/boundaries/route integrity PASS؛ lint **0**؛ **`format:check` PASS** (زال فشل التنسيق القديم في ملفي النسخ `help-content.ts` + `help-content-contract.test.ts` — تنسيق فقط)؛ build exit 0؛ release `rel-be542dbed16c2e8f` verified؛ migration source head `0031_qc_creation_parity_two_stage_approval` (بلا تغيير). Arabic/RTL **BLOCKED** (قرار 013، لم تُخترع ترجمة)؛ Browser/AT/axe/NVDA و320px/200% وno-JS **NOT RUN** (003/006/040)؛ E2E المصادق BLOCKED (Docker)؛ UAT بشري BLOCKED (004). `PASS ≠ RELEASED`، gates 0/19.
  - State: DONE محليًا للبنود 1–4 / PARTIAL لأدلة المتصفح وAT والقبول البشري الخارجي.
  - Key files: `audit/2026-09-20/QC-100-FINAL-023-copy-inventory-terminology-governance.md`, `Documents/{COPY-INVENTORY,COPY-GLOSSARY,UX-WRITING-GUIDE}.md`, `src/shared/copy/ux-vocabulary.ts`, `tests/unit/ui/copy-governance-contract.test.ts`.
- **2026-09-20 — Mind rollover (QC-100-FINAL-017):** نُقلت ثلاثة سجلات تاريخية (`RENDER-BUILD-FIX`، `QC-100-FINAL-001 / Production parity recheck`، `QC-100-FINAL-008 / Populated backup`) إلى أعلى `02-mind-mid.md` بعد التحقق من غيابها في الأرشيف؛ لم تُمس أقسام الحالة أو الـinvariants أو المشاكل المفتوحة. الحالة: DONE.
- **Current remaining-work plan (2026-09-20):** 67 executable phases across 42 task families; 21 broad families split, original ID retained for A with -B/-C continuations. All 188 original work items and 100 requested disciplines retained; families019–042 follow018. Every phase includes scoped execution, checkpoint and handoff instructions. Final audit012 → 012-B → 012-C updates both reports and plan last. New work remains PLANNED / NOT RUN; human acceptance execution excluded, 004 documents external dependencies; product scores unchanged.

### قواعد قياس سلبية ثابتة (تسري على أي تدقيق/أتمتة قادمة)
- **رمز الحالة ليس دليل صلاحية:** صفحات delivery الافتراضية في هذا المشروع default-deny، فقد تُرجع 200 وتُخفي النموذج. الدليل يكون على المحتوى المُصيَّر أو على المنع في طبقة الاستخدام (use case).
- **رفض قبل التصريح ليس دليلًا:** رفض بسبب تحقق مدخلات أو سجل غير موجود (`BAD_REQUEST`) لا يُحتسب أبدًا كإثبات رفض صلاحية؛ يُسجَّل `INCONCLUSIVE/NOT RUN`. اختبار سلبي بلا سجل حقيقي أو بلا ضابط موجب = لا دليل.

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
- OD-2026-09-23-RBAC-01 يحسم مسار التفتيش/المختبر: Supervisor وحده بصفة الدور يمنح المرحلة الأولى؛ QCM/MANAGER نهائي فقط؛ المالك المسمى يبقى استثناءً صريحًا داخل use case. أدلة الوحدة PASS، لكن التحقق على PostgreSQL 18 ما زال BLOCKED.
- QC 01/02/03 يستخدمون EMPLOYEE bundle واحدًا لأسطح الإنشاء الـ12؛ لا مراجعة/إرجاع/اعتماد/توقيع/إغلاق/تجاوز. لم تُنشأ حسابات UAT لأن PostgreSQL المعزولة غير متاحة.
- أدلة UAT تُسجل عبر authenticated actions مع participant login/role matching، وتكتب مع audit داخل transaction؛ PostgreSQL write/read round-trip لم يُتحقق.
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
- **قرار التدقيق الحالي يبقى `NO-GO`** (مرشح 2026-09-19 `653b58d22d4a17994db7376a3bd691ca6e789f1a`: maturity 45.8%، gates 0/19) حتى تتحقق الأدلة الخارجية؛ `PASS ≠ RELEASED` ويبقى المجموع مشتقًا من الأدلة فقط.
- P-07 هو القرار الحالي المعتمد لهذه السلطة: Manager OR named `yazeed/SYSTEM_OWNER`, one signer; هذا إغلاق لقرار السلطة فقط وليس دليل Production/UAT/provider.
- لا يوجد حتى الآن provider-ingestion خارجي مكتمل لـCI/Security/E2E/UAT؛ هذه فجوة integration وليست وظيفة المتصفح.
- أضيفت عقود مسودة لستة مصادر تكامل ومحول جهاز مخبري sandbox بلا اتصال حي؛ سجل التسليم يظل منفصلًا عن قرار QC، وتبقى تفعيلات المزود وسياسات actor/retention/retry رهينة اعتماد المالك.

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
- **Two-stage approval (QC-100-FINAL-013، مُثبت runtime):** `UNDER_REVIEW --stage-1 Supervisor (PERM-INSP/LAB-APPROVE)--> PENDING_QCM_APPROVAL --stage-2 QCM (MANAGER أو yazeed المسمى؛ PERM-APR-APPROVE + PERM-ESIG-SIGN + reauthentication)--> APPROVED (مقفل)` بتوقيع واحد بمعنى `FINAL_APPROVE` مربوط بالنسخة السابقة للانتقال؛ stage-1 حدث سير عمل بلا توقيع؛ لا مسار تجاوز؛ `REOPEN` بسبب مدقّق من سلطة الاعتماد النهائي يعيد إلى `UNDER_REVIEW` ولا يمحو سجل التوقيع، ثم يعاد إلزاميًا ترتيب المرحلتين. اعتماد تقرير التفتيش يحدّث Receiving إلى `INSPECTION_COMPLETE` ولا يُفرج أبدًا، وعنصر Receiving في `HOLD` لا يُستعاد (الطلب يُرفض).
- **Blocker مؤكد (F-013-1):** تقرير التفتيش لا يملك مصدر نتيجة رسمي — `ApproveInspectionUseCase` يشترط `finalResult`، و`SaveInspectionDraftUseCase` يرفض نتيجة من المتصفح، ولا يوجد evaluator للتفتيش (بخلاف `PostgresControlledLabSources`)، و`StartInspectionUseCase` غير موصول بـ`quarantineActionDependencies()` ولا يوجد create action. لذلك سلسلة التفتيش fail-closed لأي سجل ينشئه التطبيق حتى تتوفر PD-01/PD-02/PD-07؛ لا يجوز اختراع معايير لتجاوزها.
- Lab reject (TR-LAB-007) is fail-closed by policy: the transition, reason, dual permission (`PERM-LAB-REJECT` + `PERM-APR-REJECT`), SoD, expected version and P-05 authority are enforced, but the reject **decision authority source does not exist** → default `LabRejectPolicy` throws `POLICY_SOURCE_REQUIRED` (PD-38 OPEN). Reject never changes `scientificResult` and preserves measurements/samples.
- Scientific evaluation stays server-side only: `PostgresControlledLabSources.evaluate()` throws; `PASS`/`FAIL`/`HOLD` are stored only from an injected server evaluator whose `sourceReference`/`contentHash` must match the frozen context. No limit, unit, formula, tolerance or method was invented.
- Equipment eligibility is verified fail-closed at Submit: equipment `ACTIVE`, not under maintenance/inactive/failed, its current-calibration pointer must match a `CURRENT` calibration that is not overdue, and equipment/calibration snapshots must match the referenced records. QC-CLOSURE-008 adds append-only status/calibration/maintenance history, explicit `SCHEDULED`/`COMPLETED`/`FAILED` calibration states, certificate preservation, maintenance downtime, and a maintenance lock; source requirement flags remain nullable until policy supplies their values.
- لا تربط نجاح inspection تلقائيًا بإفراج النظام.
- مسار release يفرض SoD مشتقًا خادميًا بين منفذ التفتيش ومنفذ الإفراج، ويعيد الطلب المكرر بعد نجاحه عبر idempotency؛ لا يوجد بعد دليل runtime مطبق للـmigration الجديدة.
- Laboratory retest يخضع للسياسة/السلطة المطبقة ولا تُخترع limits غير موجودة في الوثائق.
- Finding/NCR/CAPA/VOID تبقى مرتبطة بآلات الحالة والأدلة والتوقيعات المعتمدة.
- E-signature الخاصة بالاعتماد النهائي تُحضّر بعد reauthentication/authorization وتُكتب داخل معاملة الدومين نفسها مع الانتقال والآثار المتزامنة؛ الفشل يتراجع عن التوقيع. Maintenance `VOID` يبقى deny-by-default لغياب انتقال/مصدر معتمد.
- أي handoff أو Journey Context هو read context؛ لا ينقل ملكية mutation بين الدومينات.

## 7) Change Requests / Documents
- إنشاء Change Request لنوع `DOCUMENT_VERSION` صار contextual؛ لا تعرض UUID/JSON/fieldPath/dataType كمدخلات تشغيلية للمستخدم.
- allowlist الحالية للحقول: `revision`, `changeSummary`, `contentHash` فقط.
- `targetId/version/snapshot/currentValue/dataType` تُشتق خادميًا.
- مستودع الإنشاء يعيد قراءة النسخة `FOR UPDATE` ويرفض stale version.
- الموافقات على الوثائق وتفعيل النسخ تبقى حسب P-05/state/version/signature rules.
- Document Version/Approval/Change Request مرتبطة بعقد Journey Context/Handoff read-only وسجل Audit.

## 8) Backup / Recovery
- Current as of 2026-09-23: RPO/RTO objectives remain NOT APPROVED (PD-26/27); the UI says so, and measurements require evidence timestamps. Retention remains NOT APPROVED (PD-24/25); expiry requires an approved policy reference and otherwise deletes nothing. Incident procedure: `Documents/RECOVERY-INCIDENT-RUNBOOK.md`.
- Provider posture: fresh read-only Render check on 2026-09-23 confirmed the `qc-database` plan is Free and the workspace service list contains only the web service (no Cron); SQL found `qc.backup_runs` 0 rows and `qc.recovery_evidence` absent. Provider PITR is unavailable on Free; no failure-alert delivery, WAL-chain, or storage recoverability evidence. Render Cron could add cost, so it is not activated without approved owner, schedule, secrets, alert route, and retention policy.
- 2026-09-23 isolated restore drill/rehearsal: BLOCKED—user confirmed no isolated target or recovery bundle and the policy decisions remain open; Docker daemon and local PostgreSQL also unavailable. No production restore was attempted.
- F-11 ما زال `OPEN / PARTIAL`: candidate-bound local archive bundle restored DB and file payloads from the archive; 77 tables / 487 snapshot rows / 30 ledger rows / 154 validated FKs, app/security and wrong-candidate denial PASS. Saved hashes show 74/77 current-source tables match; the 3 diffs are the measured post-backup task/audit/outbox marker. Local recovery measured 435 ms; provider DR/RPO remains NOT VERIFIED. Report `audit/2026-09-19/QC-100-FINAL-008-populated-backup-isolated-recovery.md`.
- QC-100-FINAL-025 أعاد تمرين مسار dump→استعادة معزولة على المرشح الحالي (`0031`) بنجاح محلي وضابطة سلبية صادقة؛ أضاف `Documents/FIRST-DAY-OPERATING-CHECKLIST.md` و`Documents/INCIDENT-PROBLEM-RUNBOOK.md` كطبقة مشتقة. **حقيقة تشغيلية ثابتة: لا scheduler مربوطًا للنسخ اليومي/الـdrill الشهري (عقد تقويمي فقط) ولا قناة إشعارات خارجية (in-app فقط) ولا monitoring/alerting على المزود** — كلها مسجلة DEP-025-02..04 بلا تحويل إلى جاهزية.
- الإعدادات الاختيارية لـR2 موجودة بدون أسرار، ويوجد backup job محلي fail-closed وPostgres recovery evidence append-only.
- Local logical backup script creates a manifest in memory and verifies stored bytes, but does not persist the manifest or catalog row; R2 adapter cannot list objects for retention inventory. This is an open implementation gap, independent of the Free provider plan.
- التطبيق سابقًا كان يعرض 24h/4h كقيم hardcoded؛ أزيلت في هذا التغيير لأنها لا تمثل قرارًا معتمدًا أو قياسًا. Marker محلي committed بعد إكمال dump بـ92s لم يوجد في استعادة تاريخية؛ لا يحدد ذلك أقصى RPO.
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
- **10 action counts** على `/dashboard` (كانت 7 ثم 8 مع lab ثم 10 في QC-100-FINAL-022)، كل واحدة تقرأ register يملكه الدومين المعني عبر use case خاص به: approvals، unread notifications، HOLD الخاص بالمستخدم، inspection reports RETURNED (المؤلف)، Tasks overdue، Tasks due today، **Tasks assigned to me (`?assignee=mine&open=1`)**، **Tasks on hold (`?assignee=mine&state=ON_HOLD`)**، Calibrations OVERDUE، Lab tests returned. عدد الـcard = عدد صفوف نفس القراءة التي يفتحها الرابط، فلا يمكن للعدّ أن يخالف رابطه. `open` صار فلترًا خادميًا مدعومًا في سجل المهام بنفس predicate إلااستحقاق.
- الروابط المدعومة: `/approvals`، `/notifications?unread=1`، `/quarantine/receiving?inspectionResult=HOLD&ownership=mine`، `/quarantine/inspections?state=RETURNED&ownership=mine`، `/tasks?assignee=mine&due=overdue|today`، `/tasks?assignee=mine&open=1`، `/tasks?assignee=mine&state=ON_HOLD`، `/assets/calibrations?state=OVERDUE`، `/laboratory/tests?state=RETURNED&ownership=mine`. فلتر Tasks بسبب `due` أُضيف خادميًا في نفس predicate الذي يقرؤه العدّاد؛ والـinspections register صار يدفع state/finalResult/assignedTo/ownership إلى SQL ويجمع العلاقات بـbatched reads بدل 6 queries لكل صف.
- Quarantine flow على `/dashboard` = 6 مراحل (Received today → Awaiting inspection → Under inspection → HOLD → PASS not released → Released) وكل مرحلة projection لمقياس واحد من `GetQuarantineOverviewUseCase` نفسه الذي يقدّم `/quarantine`؛ لا SQL موازٍ ولا تعريف ثانٍ للحالة.
- attention queue تُبنى من نفس صفوف الـcounts مع سبب بشري و`ageLabel` مشتق من timestamp خادمي حقيقي (`assignedAt`/`updatedAt`/`dueAt`/`createdAt`) وحالة ورابط مباشر، مرتّبة بالشدة الحقيقية ومحدودة بـ10؛ إن غاب timestamp تُكتب `Age not recorded`.
- فشل قراءة أي source (غير AUTHZ) يحجب الـsnapshot كاملًا؛ رفض `AUTHORIZATION` لحساب لا يملك قراءة register معيّن يظهر كـ"Not available" بلا رقم وبلا رابط ولا يصبح صفرًا. حالات الseries تبقى `AVAILABLE|EMPTY|UNAVAILABLE|NOT_SUPPLIED` بلا نقاط خارج `AVAILABLE`، ويعرض الرسم source/unit/grain/counts/scope/period/zero/freshness.
- coverage panel مُشتق من read model لا من copy الصفحة: 13 مدخلًا؛ `AVAILABLE` الآن يشمل laboratory workload (bounded state/ownership) وtasks (assigned/open/due/hold)، و`NOT_SUPPLIED` يبقى لـdocument review queue وblocked reasons (نصًّا حرًّا فقط — العمل المحجوز نفسه صار مقروءًا) وreject analytics وquality summary وsystem health (owner-only) — لكل مدخل سببه الحقيقي ومالكه.
- ما زال يحتاج read model خادميًا قبل أي عرض: document review queue، blocked reason نصًّا حرًّا، reject analytics بعد إغلاق عيوب SQL/runtime + مسار قراءة مصرّح، وownership filter في سجلات Quality.

### My work today (QC-100-FINAL-022 — سطح جديد `/work`)
- الطابور **ليس** لوحة ثانية ولا مصدر SQL ثانيًا: `myWorkDependencies()` يستهلك نفس `dashboardMetricSources()`؛ لا `selectFrom`/`FROM qc.`/`getDatabase` في الصفحة (محروس في `tests/unit/ui/my-work-surface.test.ts`).
- تعريفات المجموعات الأربع مصدرها الوحيد `my-work-definitions.ts`، ولا يُعرَّف أي حد أو هدف أو SLA. `blocked` = حقائق مسجّلة فقط: `task.state = ON_HOLD` (reason إلزامي للحجز والاستئناف) و`receiving.inspection_result = HOLD`؛ `assigned` تشمل عقدة سجل الاعتماد وauthor للتقارير المعادة؛ `due today`/`overdue` يُحسمان على حدود اليوم UTC.
- ضمانات ثابتة: بند واحد مرة واحدة (بمرجعة `href` مع deferral مصرّح به في رسالة المجموعة)، ترتيب كلّي ثابت (شدة → timestamp حقيقي → identity)، `MY_WORK_ITEM_LIMIT = 10` للمجموعة مع نشر **إجمالي السجل الحقيقي**، و`count = null` + `NOT_AUTHORIZED` حين يكون أي مصدر في المجموعة غير مصرّح (لا صفر).
- `GetMyWorkUseCase` يطلب حسابًا `ACTIVE` فقط (لا `PERM-DASH-*`) لأن كل مجموعة تُصرَّح بواسطة سجلها؛ المصادر غير المحلولة معلنة في الواجهة بسبب ومالك (013/026، 017-B).
- الأدلة: `tests/unit/dashboard/my-work-queue.test.ts` 11/11، `tests/integration/dashboard/my-work-parity.test.ts` 8/8 (parity فوق صفحة واحدة، ترتيب مزدوج، رفض عبر النطاق، حدود UTC، حجز مكرر، ≤60 statements ثابتة و<80KB payload).

## 10) UI / UX / Accessibility

### Language/copy
- الواجهة الحالية English-only, `lang="en"`, LTR؛ قرار المستخدم (2026-09-23) يؤكد الإنجليزية والنصوص القصيرة الطبيعية للمنتج. إشارات العربية/RTL في `Documents/UI-UX-SPECIFICATION.md` تحتاج قرارًا مستقلًا قبل توسيع النطاق.
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

### Register surfaces & shared primitives (QC-100-FINAL-005، 2026-09-19)
- مرجع قابل للتنفيذ بدل الشك: `tests/unit/ui/register-surface-contract.test.ts` يجرد 85 صفحة — 81 داخل الـshell و4 استثناءات موثّقة (`index`/`laboratory/index` redirects، 404/500) — و30 صفحة بجداول كلها بـ`<caption>` وrow identity (استثناءات مُبرَّرة: audit/report grid/line items)، مع ratchets لا تزيد.
- **تصحيح واقع سابق:** «النماذج الرئيسية تعمل بدون JavaScript» صحيح لنماذج الإنشاء فقط؛ **9 أسطح انتقال/قرار JS-only بلا POST baseline** (receiving/[id]، capa/[id]، lab execute/review، change-request review، documents versions/new و[index]، admin/roles/[roleId]، reject-reports/daily/[id]) مثبتة كـratchet في `tests/unit/ui/mutation-safety-contract.test.ts`؛ الفجوة مملوكة لـ005-B مع تحقق 003/006.
- **UNAVAILABLE ≠ EMPTY وليس صفرًا:** `/audit` كان يحوّل أي فشل قراءة إلى `0 events`؛ الآن يفصل رفض AUTHZ (حماية existence-leakage: يبقى "لا أحداث") عن انقطاع المزوّد (`ProviderUnavailableState` بلا رقم). مثله `/tasks` و`/change-requests` (كانا `.catch(() => [])`) وصفحات Assets.
- **أسطح السجل الموحّدة:** Assets family + tasks + change-requests تستعمل `FilterBar` (GET + `role=search` + Clear)، `AppliedFilters` (شرائح بدلالة stateLabel)، و`EmptyTableState` (فصل EMPTY عن FILTERED EMPTY)؛ `/tasks` يستعمل `Pagination` المشتركة. `DataTable` ما زال غير مستهلك (slot contract يغيّر markup/العناوين المثبتة) — فجوة governance معلنة.
- **bounded registers = 3 فقط** (`/tasks`، `/audit`، `/reject-reports`) عبر `page`/`offset`؛ الباقي 15 سجلًا unbounded لأن كل واحد يصرّح صفًّا بعد الجلب (scope filter in memory) فيلزم دفع predicate النطاق إلى SQL قبل الحد — مملوك لـ005-B مع 010.
- **توكنز/اتجاه:** لا hex خام في UI chrome، و12px حد أدنى داخل `src/ui` (أُصلح FilterBar/ErrorState/ESignatureDialog/Chart/HandoffTimeline/JourneyContextPanel)، وخصائص logical فقط (أُصلح `padding-left` في reject-reports)؛ أرضية `src/pages` دين مُقاس: 71 موضعًا في 51 ملفًا، مسجّل سقفًا لا يزيد وليس إنجازًا. مرجع: `tests/unit/ui/design-governance-contract.test.ts`.
- **التاريخ/التعريب:** العرض عبر `src/shared/copy/format.ts` (en-GB + Asia/Riyadh بصيغة «18 Sep 2026, 18:43») و20 صفحة ما زالت `toLocale*` مسجّلة كـratchet متقلّص. **قرار applicability لـdomain 70 محفوظ ولا يُحتسب credit:** 70 في سجل الـ100 = Security UX (أدلة الرفض/التعداد runtime معلّقة). مستندات أقدم ذكرت العربية/RTL كمتطلب غير منفّذ (`audit/100-percent/POLICY-CLOSURE-MATRIX.md` سطر 184)، ونُفِّذت أساسيات فقط (logical properties + `[dir=rtl]` font mapping)؛ نطاق إعادة التصميم الحالي English-only وفق قرار المستخدم أعلاه، وتحتاج المستندات القديمة مصالحة مستقلة.

### Accessibility / responsive
- توجد حراسة static/unit لـWCAG fundamentals: landmarks/skip nav/focus/error summary/status semantics/drawer isolation/reduced motion/forced colors وغيرها.
- fixes مؤكدة: loading `role=status`, notification severity نصيًا، forced-colors contract، drawer inert/focus behavior، reflow guards.
- QC-100-FINAL-005: أرضية قراءة 12px (`--font-size-xs`) لميتاداتا الـKPI، وهدف 44px للتحكمات التفاعلية في shell/navigation، والرمز المرئي داخل عنصر يحمل `aria-label` يبقى `aria-hidden` حتى لا يخالف ظاهر النص الاسمَ المتاح. إعادة بناء التنقل: 10 أقسام، أدوات مساعدة مستقلة، مؤشّر حالي نصي/شكلي، وفتح القسم الحالي تلقائيًا؛ 57/57 عقود shell/navigation مركزة PASS على Node `22.22.3` (خارج عقد المشروع). E2E الحقيقي غير متحقق: Chromium تعذر إقلاعه داخل sandbox، بيانات دخول الاختبار غير موجودة، وملف البيئة يشير إلى DB خارجية لم تُستخدم.
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
- QC-100-FINAL-033 tightened current event values to exact low-cardinality allowlists; free-form and unimplemented attribute families are dropped. External analytics export remains absent; exact retention/access policy remains pending 013/026.
- hand-off عبر outbox `PRODUCT_ANALYTICS_EVENT`; ليس Audit ولا business state.
- exporter/dashboard/retention الرسمي والتغطية خارج البحث ما زالت pending.

### Journey/Handoffs
- `JourneyContextPanel` يفصل record owner عن owning domain، ويعرض مرجع السجل، السبب، الأدلة الموجودة والمطلوبة؛ الحقول الغائبة تظهر صراحة كمصدر غير مسجل.
- لوحة dashboard تربط المرشحات المدعومة لـHOLD وinspection/lab submission وPASS + NOT_RELEASED؛ document review وNCR/CAPA ownership queues لا تزال غير متاحة كـread models.
- `HandoffTimeline` يعرض أحداث التسليم؛ Receiving, Inspection Review, Lab Test, Calibration, Document Version, Approval, Change Request مرتبطة بالسياق المناسب.
- approval decision لا يعني application success؛ notification delivery ليست business completion.
- لا تخترع record links أو notification status إذا read model لا يوفرها.

## 12) Architecture / Deployment / Assets
- **2026-09-23 fresh live/source discrepancy:** التطبيق واختباراته يثبتون RPO=24h وRTO=4h، بينما `Documents/BACKUP-RECOVERY-PLAN.md` ومصفوفة القرارات يتركانهما `POLICY-DEPENDENT` ويحظران الرقم غير المعتمد؛ code correction remains open. في المشاهدة نفسها `/system/health`: NOT READY، 0018 مطبق/0038 مشحون، 20 ترحيلًا معلّقًا، هوية الإصدار UNVERIFIED، backup catalog فارغ وrestore NOT VERIFIED. هذه لقطة زمنية لا تثبت SHA النشر.
- **Historical — 2026-09-21 (035-B):** فشل architecture على المرشح `4fa6ac3` بسبب استيرادات delivery مباشرة؛ أُعيد التحقق وأُغلقت محليًا على HEAD `0ba087c` بتاريخ 2026-09-23 (انظر ARCH-DELIVERY-BOUNDARY أعلاه).
- `pnpm diagnose` (035-B) فحص محلي read-only fail-closed: عقد Node/pnpm، هوية المستودع، رأس migrations، وتحقق الإعدادات بما فيه دمج `.env` المسموح — أسماء فقط، exit 1 عند أي خرق عقد. **فجوة `.env` المحلية أُغلقت 2026-09-22 (PR-A1):** `NODE_ENV=development` + `SERVICE_VERSION` + `RATE_LIMIT_LOGIN_*` مكتملة؛ diagnose/parity/typecheck/build كلها PASS على Node `v24.20.0` مع `.nvmrc`.
- **Historical — candidate `5470a2e` (036-B):** سجل سابق عن build/receiving والـarchitecture؛ انتهاكات delivery/domain المرتبطة أُغلقت محليًا على HEAD `0ba087c` بتاريخ 2026-09-23 (انظر ARCH-DELIVERY-BOUNDARY).
- **هوية البناء صارت حتمية (036-B):** `astro.config.mjs` يثبّت `ASTRO_KEY` غير سرّي (لا `astro:env getSecret` في هذا التطبيق) و`scripts/release/normalize-server-manifest.mjs` يعيد تسمية `server/manifest_<hash>.mjs` → `server/manifest.mjs` بعد البناء. 4 عمليات build متتالية من `dist/` نظيف أنتجت نفس الشجرة (325 ملفًا، `da6fc6bb…81c99`) ونفس `entry.mjs` (`a12fcb45…5f816`)؛ إضافة ملف الأدلة داخل `dist/` تغيّر الشجرة بطبيعتها (325→326) ولهذا يسجّل CI المانيفست في `.ci-results/`.
- **بوابة الترقية المرحلية (036-B):** `pnpm release:promotion:check -- --plan <file>` بسبعة فحوص fail-closed (ترتيب بيئات DEP-001، ربط الـcheckout، digest الملف مقابل `artifactSha256`، parity الترقية عبر البيئات حيث **إعادة البناء ≠ الأثر المتحقَّق**، migration forward-only، شروط rollback حسب نمط الفشل، recovery posture لخطر `HIGH`). الدليل: 7/7 PASS على المرشّح وFAIL مغلق عند التلاعب. **`/api/health/*` ليس دليلًا على أي من هذه الشروط ولا على بوابات القبول البشري.**
- التطبيق Astro SSR ونشره المستهدف Render.
- **Render live service يواصل الانحراف عن `render.yaml` (آخر تحقق 2026-09-18، QC-100-FINAL-001):** runtime/env `rust` بدل `node`، `healthCheckPath` فارغ بدل `/api/health/ready`، `autoDeployTrigger: commit` بدل `checksPass`، `renderSubdomainPolicy: disabled`، وأمر تشغيل يفرض `SYSTEM_OWNER_LOGIN_IDENTITY=yazeed`. لا يُصلح هذا الانحراف ولا يُعتبر دليل نشر صحيح.
- `public/assets/astro/**` المنسوخ أزيل، ويوجد boundary check يمنع رجوع source tree إلى assets الإنتاج.
- Prettier/ESLint يركزان على كود المشروع ويستثنيان أدوات العمل `.opencode/**` و`.playwright-mcp/**`.
- Login Three.js dynamic/lazy ولا يدخل authenticated critical rendering path.
- لا تعتمد GitHub Pages/Jekyll كمسار نشر أو كإشارة صحة للتطبيق.
- Page-route contract: `definePageRoute` centralizes `id/path/page/domain/title/breadcrumb/visibility`; new browser pages default to `AUTHENTICATED`, and the explicit `YAZEED_ONLY` set is currently `/system/health` + `/system/control-center`; the architecture gate rejects registry/page/navigation drift. Route visibility remains separate from server-side mutation authority.

## 13) الوثائق والملفات المرجعية الأعلى أولوية
- **مسار الوثائق:** شجرة `docs/` نُقلت مسطّحة إلى `Documents/` (2026-09-19)؛ أي مسار `docs/...` في السجل التاريخي أو في مفاتيح ملفات قديمة تاريخي. المرجع: `Documents/DOCUMENTATION-INVENTORY.md`.
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
- `Documents/ROLE-OPERATING-GUIDES.md` (دليل أدوار التشغيل — طبقة مشتقة)
- `Documents/SUPPORT-OWNERSHIP-REGISTER.md` (ملكية الدعم والاعتماديات)
- `Documents/ENVIRONMENT-DRIFT-REGISTER.md` (انحرافات البيئة/الإصدار مع فعل المشغّل الدقيق — طبقة مشتقة، 15 انحرافًا)
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
- QMD local knowledge search: MCP `qmd` + skill at user scope; collection `qc-operations` indexes project Markdown documentation and mind. Keyword search is verified; local semantic models remain uninstalled.
- 21st.dev Codex plugin is installed and enabled globally (`21st@21st`, 0.4.1); its MCP reads `API_KEY_21ST`. The variable was not available to GUI-launched Codex during installation, so authenticated MCP use remains NOT VERIFIED until the variable is available and Codex is restarted.

## 14) المشاكل المفتوحة الحالية — لا تعيد فتح المشاكل المغلقة تاريخيًا

### P0 / blocking evidence
- **F-013-1 (QC-100-FINAL-013، غير مُصلح لغياب مدخل القرار):** سلسلة اعتماد التفتيش غير قابلة للإكمال من التطبيق — لا masدر نتيجة رسمي (PD-01/PD-02/PD-07) ولا create action؛ لا تُخترع معايير. المالك: QC/QMS ثم 013. الدليل: الحالة `[blocker]` في `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts`.
- **F-013-2 (QC-100-FINAL-013):** لا يوجد كاتب/مستورد لأدلة release gate لأنواع `ci`/`security`/`database`/`e2e`؛ المُنفذ فقط `ReleaseGateEvidenceWriter.recordUatGateEvidence`. التصدير نفسه (`TRUSTED_PLAYWRIGHT` من `scripts/verification/run-authenticated-e2e.ts`) لا يُدخَل. المالك: 013 مع مسار نشر candidate مصرّح للـCI.
- **حالة بوابات المرشّح المجمّد `5470a2e` (036-B، 2026-09-21):** `pnpm build` كان FAIL وأُصلح؛ `pnpm lint` كان 6 أخطاء كلها في ملفات 036-A وأُصلحت (الآن exit 0)؛ `pnpm format:check` **FAIL** على 15 ملفًا خارج diff هذه المهمة (11 ملف receiving + اختباران + record-journey + audit JSON)؛ `pnpm test:unit` **FAIL** 5 اختبارات في 4 ملفات مُثبت أنها سابقة للـHEAD (receiving-data-contract، dashboard/quarantine decision surfaces، mutation-safety)؛ `pnpm test:architecture` FAIL كما في القسم 12. أي ادعاء «CI أخضر» على هذا المرشّح غير صحيح. المالك: عمل receiving/002 ثم 012.
- **تقارير `.ci-results/*.json` غير مربوطة بالمرشّح (036-B):** بوابة الأدلة تتحقق من محتوى التقرير ومن هوية الإصدار فقط، فقد قُدّمت تقارير قديمة (integration 470/470، concurrency 12/12، security 52/52) كأنها حالية وفشلت فقط على `migrations 30/33` القديم. يجب إعادة توليد كل التقارير على المرشّح المجمّد قبل أي ادعاء تغطية. المالك: 002/027.
- Local equivalent PG18.6 (QC-100-FINAL-002, candidate `84bdf249`): unit 677/677، integration 419/419 (0 skips، مرتين)، migrations 29/29، concurrency 12/12 (5 تكرارات exit 0)، security 52/52 بلا skips، format/lint/typecheck/architecture/build/release PASS. Docker/CI container path وfixture-backed six-persona E2E تبقى NOT VERIFIED.
- GitHub Verification CI exact-HEAD غير مثبت بسبب billing lock.
- Node المحلي: عقد التحقق المحلي صار `v24.20.0` عبر `nvm use` + `.nvmrc` (PR-A1)؛ قد تبدأ أقواس جديدة على alias افتراضي أقدم ما لم يُستدعَ `nvm use` في جذر المشروع.
- provider-ingestion الموثوق لأدلة CI/Security/E2E/UAT غير مكتمل.
- UAT غير منفذ؛ production readiness غير مثبت.
- **قرار مالك مفتوح (QC-100-FINAL-004 Task 5/7): نطاق موقّع UAT.** قبول الدورة يصرّح بـ`scope: {}` على `UAT_CYCLE` مثل `ApproveReleaseUseCase`، وGLOBAL وحدها تمر مع scope فارغ؛ فمدير بنطاق TEAM (شخصية `uat-qcm`) يُرفض بـ`AUTHZ_SCOPE_DENIED`. لذلك العلامة البشرية ستكون من المالك المسمّى ما لم يُعتمد منح GLOBAL للـQCM — السلوك متسق ومقصود ولم يُغيَر. أدلة: `audit/2026-09-19/QC-100-FINAL-004-task5-uat-ingestion-closure.md`.
- Render’s last verified applied migration head is `0018` (historical; not reverified on the current candidate); source head `0033_controlled_document_execution_context` is not a production claim and must not be applied before the credential-rotation gate. Fresh QC-100-FINAL-001 confirmed the gate remains open and no direct production DB access occurred.
- **QC-100-FINAL-032-B technical evidence VERIFIED on exact local candidate** `0e9bdf28ae448ab2ebc197c567a05832ea88c07d` / dirty fingerprint `4d51084e350a79da5e8aed8d81e48f478f2101b8d5d2b5564841371fb807c51d`: Node 24.20.0, PG18.6, source head `0034_template_document_link_variable_scope` (34 migrations), 14 selected integration/concurrency files `65/65 PASS`; clean/upgrade/checksum/rollback, 79 tables/0 orphans, four PK-index plans, and restored report-lineage projection hash match. Provider-applied schema, Docker/Testcontainers, backup/PITR, and human acceptance remain NOT VERIFIED/NOT RUN. 013/026 own policy/source decisions; 002/027 container regression; 012 final reconciliation. Report: `audit/2026-09-21/QC-100-FINAL-032-B-integration-technical-evidence.md`.
- QC-100-FINAL-029-B candidate-specific PostgreSQL evidence remains NOT VERIFIED: migration 0033 was not applied, Testcontainers has no runtime, and local disposable PostgreSQL startup is blocked by host shared-memory permissions. Resume with 002/027 on supported disposable PostgreSQL 18; reconcile through 012. Source links have no template-authoring UI in B; ask 003 to assess E2E only if authoring UX is required.
- **Historical live defect (2026-09-18):** authorized yazeed GET `/reject-reports` returned 500 with Render migration projection `0018`. QC-100-FINAL-014 verified the candidate SQL ambiguity fix and populated regression on disposable PostgreSQL; production result remains NOT VERIFIED because current production migration state is blocked.

### P1 / live validation / pre-existing test estate
- **F-013-3 (QC-100-FINAL-013، كان مُقاسًا):** عولج محليًا في QC-100-FINAL-028-A بنقل إدراج signature evidence إلى transaction الدومين مع compare-and-set والآثار المتزامنة؛ اختبار populated PostgreSQL المحدّث لم يُنفذ لأن Testcontainers بلا runtime. تبقى حالة التحقق على قاعدة البيانات **BLOCKED** حتى 002/027.
- **ملف تكامل مخصص للمرحلتين موجود الآن** (كان مفتوحًا في تقرير FINAL-004): `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts`.
- **أُغلق 2026-09-19 (QC-100-FINAL-002):** كل ملفات `pnpm test:integration` التي كانت تفشل السابقة (`identity/system-owner-upgrade-parity`, `system/control-center`, `reporting/report-export-parity`, `shared/search-scope`, `shared/notification-outbox-delivery`, `quarantine/overview-parity`) صارت PASS بجذور مُثبتة: عزل schema لكل suite كانت تعوّل على قاعدة بكر، probed migration-dir في `createPostgresMigrationStatus` (العملة الواحدة كانت تُبلغ drift زائفًا تحت Vitest)، وعقود اختبار متقادمة (literal LIKE، bounded queue مقابل total، `uuidv7` غير مونوتونية داخل المللي ثانية، sparse-array matcher).
- read models المطلوبة لاستكمال لوحة القيادة (QC-100-FINAL-017): **DONE 2026-09-20** bounded lab workload مع state/ownership filter (KPI `lab-tests-returned` + readiness read)؛ **DONE 2026-09-20 (022)** عدّادا `tasks-assigned` (`open`) و`tasks-on-hold` وفلتر `open` خادميًا في سجل المهام — فالعمل المُسنَد صار مرئيًا حتى بلا تاريخ استحقاق، والعمل المحجوز له عدّاد مسجّل بدل استنتاج؛ **متبقٍ لـ017-B:** document review queue (لا يوجد read model لطابور المراجعة في وحدة documents)، quality ownership filters (سجلات findings/NCR/RCA/CAPA تدعم state فقط)، وblocked reason كنصّ حرّ (لا حقل في المخطط؛ إدخال audit لكل انتقال)، وreject analytics معلّق على قرار نطاق (النموذج يجمّع globally و`/reject-reports` مصرّح `authenticated` لا permission-bound، فنشر تجميعة عامة على سطح scope-aware ممنوع). بدونها تبقى هذه المنتجات `NOT_SUPPLIED` معلنة بأسباب تسمّي المصدر والمالك، ولا تُقدَّر بأرقام.
- **مكتشف 2026-09-19 (QC-100-FINAL-002):** ست صفحات `.astro` محفوظة كسطر مضغوط واحد (`assets/equipment|[calibrationId]|[maintenanceId]` + `laboratory/tests/[labTestId]/{review,index,execute}`) ولا بوابة تكشفها (Prettier لا ينسّق `.astro`)؛ تحتاج إعادة تنسيق محافظة على المخرجات. كذلك `.env` المحلي يضبط `NODE_ENV=production` فيرفض كل CLI قاعدة بيانات العمل محليًا حتى تتوفر `SERVICE_VERSION` + `RATE_LIMIT_LOGIN_*` أو يُتجاوَز NODE_ENV، و`audit/**` داخل نطاق Prettier العام، و`.tmp-check/check-bundles.ts` ملف scratch متتبَّع.
- تشغيل مسار Testcontainers/`postgres:18-alpine` (نفس مسار CI) على بيئة فيها container runtime، لأن مسار الـcontainer الفرعي لم يُنفذ فعليًا بعد.
- **QC-100-FINAL-027 audit (2026-09-21):** 027-B أثبت unit 785/785 وPG18.6 integration 470/470 وserver contracts على قاعدة محلية disposable صريحة؛ التشغيل عبر Docker/Testcontainers ما زال NOT RUN، والثقة العامة بقيمة `QC_TEST_DATABASE_URL` عبر 21 reset site ما زالت غير محسومة. authenticated E2E واسع PARTIAL/FAIL بسبب fixture/session state وأخطاء workflows؛ focused login 2/2 PASS. `pnpm test:architecture` ما زال FAIL بانتهاكات imports السابقة في NCR/CAPA. التفاصيل في تقريري 027-A و027-B.
- **QC-100-FINAL-030 current dependencies:** `pnpm audit --audit-level high` has a CI gate but no advisory result (registry DNS `ENOTFOUND`); local lockfile SBOM is available, but remote signed provenance and exact-SHA CI are not verified. Repeated Astro server builds produced different manifest filenames; reproducibility is FAIL pending diagnosis — **صُحّح في 036-B**: تثبيت `ASTRO_KEY` غير سرّي + normalizing لاسم chunk المانيفست، فأصبحت 4 عمليات build متتالية متطابقة الشجرة. 002/027 must provide exact-candidate PostgreSQL 18 evidence, then 012 reconciles. `REQ-FILE-008` scan/MIME/data-path policy and retention/orphan lifecycle authority remain POLICY-DEPENDENT through 013/026. Secret inventory/rotation preparation is recorded at 030-B; actual provider state and any rotation remain with the authorized credential owner.
- live performance evidence لخلفية النظام وlogin (CPU/GPU/heap/Web Vitals).
- authenticated accessibility/responsive/keyboard/screen-reader matrix.
- provider backup/PITR/WAL/object-store DR and approved RPO/RTO validation; QC-100-FINAL-034-B adds current-0034 local populated DB+file restore and synthetic read-pressure evidence, while provider DR, approved budgets, application backup-catalog integration, and representative workload limits remain open.
- ترقية fixtures القديمة بحيث `loginIdentity` يصبح حاضرًا بوضوح في test doubles.
- تنظيف Lottie container metadata/unused asset فقط إذا اعتُمد asset-pipeline لذلك.

## 16) الحالة الحالية — AI Advisory Safety / Evaluation
- AI remains advisory-only; no result writes controlled/business decisions. Detected secrets/PII are refused before provider access. Output authority fields/text and citations that do not match the supplied source identity/label/citation are refused. Missing controlled source and uncertainty prompts fail closed; normal human review remains authoritative.
- Deterministic non-confidential dataset is `qc-ai-governance-v2` / `3.0.0` (27 cases; authority, missing source, injection, secret/PII, wrong citation, uncertainty, and human handoff included). On Node `24.20.0`, focused eval/security suites: 41/41 PASS; each category disposition error rate 0%. Exact report is `audit/100-percent/ai-evals/results-2026-09-23.json`, bound to source HEAD plus evaluated-file diff fingerprint.
- `AI_EXTERNAL_PROCESSING_APPROVED=false` remains the default and current state. The technical flag is not evidence of authorization. Groq/Gemini configuration, live processing, Render provider configuration, external data-processing approval, and human UAT remain `NOT VERIFIED/BLOCKED`. Provider activation requires recorded owner decision, scoped data/retention terms, exact-SHA eval, and human acceptance as specified in `Documents/AI-PROVIDERS.md`.

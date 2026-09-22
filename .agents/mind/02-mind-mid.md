## Rollover from 01 — 2026-09-22 (QC-P44-REAUDIT — back under the hard size limit)

> نُقلت أقدم سجلات Historical Ledger بعد التحقق من غياب محتواها الكامل في الأرشيف: `QC-100-FINAL-012`، تفاصيل `QC-100-FINAL-004 human UAT` التنفيذية (المكشوفات المفتوحة بقيت في `01` §14)، دليل إعادة التحقق الحي `QC-100-FINAL-016`، كتلة المرشح الجانبي 2026-09-19 (`018` Humanized UX / توحيد الوثائق / `016 remediation` / `017` Dashboard command center / rollover-004T3 / `016` Live UX findings / `005 follow-up` / `005` Dashboard repair)، وسياق DR/UAT التاريخي المُستبدل، وسطر rollover الخاص بـ`QC-100-FINAL-020`. حُذفت مكرّرات §17 (034-B/034-A/032-B/033) لأن النسخ الكاملة باقية في Ledger و§14. لم يُنقل أي invariant أو قرار سارٍ أو مشكلة مفتوحة.

- **2026-09-19 — QC-100-FINAL-012 / Final 80-domain re-audit (candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`)**
  - Changed: reconciled the English/Arabic 36-section living audits and the 18-task interactive remaining-work plan; all 80 IDs retained. Exact-candidate method resets Browser/Human/Production credit when not rerun/accepted on this SHA.
  - Evidence: Node 24.20.0; typecheck 846/0, architecture/build/release identity PASS; PostgreSQL 18.6 source migrations 31/31, schema 77/0; migration tests 29/29 and security 52/52 PASS. FAIL: format 39 files, lint 55 errors, unit 672/677, integration 410/419 + 2 skip, concurrency 9/12. Bilingual arithmetic 80/80 identical; 36/36 sections; HTML 18/18 prompts/buttons and script/static responsive contracts PASS; browser rendering BLOCKED by local-file URL policy.
  - State: PARTIAL / NO-GO — evidence maturity 45.8%; exact-candidate mandatory production gates 0/19; open findings 7 P0 / 8 P1 / 2 P2. No commit/push/deploy/production migration.
  - Key files: `audit/2026-09-18-ULTIMATE-COMPREHENSIVE-SYSTEM-AUDIT{,-AR}.md`, `audit/QC-Remaining-to-100-Percent-Prompts-Interactive.html`.
- **QC-100-FINAL-004 human UAT + sign-off (2026-09-19):** `BLOCKED` — no real participants, no approved staging/UAT environment, no frozen release candidate, UAT-DD-001 signer unresolved; no `SIGNED_UAT_CYCLE` exists and none can be fabricated (release-gate evidence is server-derived, fail-closed, candidate-bound). All 8 implementation tasks are now DONE locally (Tasks 1–8; final report `audit/2026-09-19/QC-100-FINAL-004-execution-report.md`): ingestion path verified (Task 5, 8/8 integration), bring-up verified (Task 6), automated HTTP suite green 14/0/3 (Task 7, can never flip the gate), Task 8 regression cycle fixed 4 typecheck errors (review.astro `canApprove` residue + 3 pool non-null) and re-ran all gates green on HEAD `9e25827`. DB truth on `qc_uat_bringup`: cycles 7/0 accepted, gate rows 0, signatures 0, sessions 77 automated/0 human. The `uat` gate remains `UNVERIFIED`. Open owner items: `Documents/STATE-MACHINES.md` + `PERMISSION-MATRIX.md` lack `PENDING_QCM_APPROVAL` (docs behind code); dedicated two-stage integration test file missing; signer scope decision (GLOBAL vs TEAM for acceptance) unresolved; Node 22 local ≠ contract. Evidence: `audit/2026-09-19/QC-100-FINAL-004-{human-uat-signoff,task5-uat-ingestion-closure,task6-local-uat-bringup,task7-uat-scenarios,execution-report}.md`.
- **QC-100-FINAL-016 live re-verification (2026-09-18, read-only, 36 route families + 18 targeted URL probes):** serif/`Times` fallback on **every** surface incl. `/login`; dashboard + quarantine KPI drill-down params `?inspectionResult=`/`?workflowState=` silently ignored (`?state=` works); topbar identity is the internal UUID with role `Authenticated user`; CSP blocks dotlottie WASM on every page **and** the inlined enhancement scripts on `/ai-advisory` (request flow dead; the build emits a bare `<script>` with unprocessed TS) and `/account` (password toggle inert); `/account` renders outside the app shell; `/quality/{capa,ncr}/new` are registry routes with no page file and render detail pages; the control-center migration card reads `DRIFT DETECTED · applied 0018 · expected 0018 · 11 pending`; `/admin/users/<self>` says “No roles are assigned” while the owner console lists `ADMIN, SYSTEM_OWNER`; `/reject-reports` still `500`. 31 classified findings (P1 5 / P2 16 / P3 10) in `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`. Limits: single role (`yazeed`), bootstrap-only data, no AT/human UAT, deployed SHA `UNVERIFIED`. Indicator deliberately unchanged at `29.0%`.
- **2026-09-19 — QC-100-FINAL-018 / Humanized UX writing & content simplification (candidate-side)**
  - Changed: توحيد المفردات في `ux-vocabulary.ts` (`errorClasses` ستة أصناف، `scopeKindLabels`، `severityLabel()`)؛ إنسانة الحالات الخام عبر `stateLabel`/`severityLabel` في findings/equipment/calibrations/maintenance/inspections/backups/search؛ إصلاح روابط 404/500 المكررة؛ تسميات scope kinds بشرية في إنشاء الأعضاء؛ دليل `Documents/UX-WRITING-GUIDE.md`؛ اختبارات `tests/unit/ui/ux-writing-contract.test.ts`. لا تغيير على عقود خادمية أو المصطلحات المنظمة أو الـE2E pins.
  - Evidence: typecheck 820/0 errors؛ targeted UI contracts 44/44 PASS؛ unit 593 PASS + فشل واحد بيئي قائم (`QC_VERIFY_*` env)؛ architecture PASS؛ lint PASS. Browser accessibility وE2E المصادق NOT RUN (لا fixture بيئة).
  - State: DONE (مرشّح محليًا) / PARTIAL للـbrowser accessibility وE2E المصادق وUAT.
  - Key files: `src/shared/copy/ux-vocabulary.ts`, `docs/ui/UX-WRITING-GUIDE.md`, `tests/unit/ui/ux-writing-contract.test.ts`, `audit/2026-09-19-QC-100-FINAL-018-UX-WRITING-HANDOFF.md`.
- **2026-09-19 — توحيد الوثائق في `Documents/` (DONE):** شجرة `docs/` كاملة نُقلت مسطّحة إلى `Documents/`؛ أي مسار قديم بصيغة `docs/...` في هذه الذاكرة تاريخي. Key file: `Documents/DOCUMENTATION-INVENTORY.md`.

- **QC-100-FINAL-016 remediation (candidate-side, 2026-09-19):** رُفعت كل نتائج التدقيق الحي في الكود المرشّح مع أدلة محلية: `font` لا يعيد تعيين `body` (زال fallback الـserif) + أرضية قراءة 12px + هدف 44px؛ روابط KPI تستخدم بارامترات مدعومة مع شرائح فلتر مطبّقة (`inspectionResult`/`releaseState`/`workflowState` server-side على Receiving/Inspections)؛ هوية الشريط العلوي من الشريط = login identity + role/scope مشتقّة server-side (`scope-description.ts`)؛ `/reject-reports` صار يعلن حالته بصدق بدل 500، وقرار المالك: **إسقاط طبقة Lottie** — ونُفّذ + اختبار يفشل عند أي طلب runtime؛ سكربتات الصفحات أُخرجت من inline (CSP) و`/account` داخل AppLayout؛ migration card يستخدم buildHead/expectedHead بلا relabel؛ `/quality/{ncr,capa}/new` لهما صفحات إنشاء؛ وبقرار المالك صار `yazeed` قادرًا على الإنشاء عبر migration `0030_reject_reports_role_parity` (يرمّم bundle الـSYSTEM_OWNER الموجود ويمنح ADMIN كود الاسترداد) مع اختبار upgrade path. أدلة: typecheck 0 errors، unit 563/563 (83 ملف)، integration مركّز على PostgreSQL 18 مصرفي محلي/TLS 39+4+2+15 PASS، build PASS، lint 0 errors، migration integrity 30. `PASS ≠ RELEASED`: لا نشر، لا migration على الإنتاج، هوية الإصدار ما زالت UNVERIFIED، والتدقيق الحي على النسخة الجديدة وUAT البشري ما زالا مفتوحين. تفاصيل: القسم 13 في `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`.
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
## Historical DR / UAT context — superseded by fresh evidence
- DR-008's old Docker blocker is superseded by local PG18.6 execution and structural restore; populated recovery/provider DR remain unverified. Historical detail: audit/100-percent/{RESTORE-DRILL-RESULT,DR-EVIDENCE-MATRIX}.md.
- Migration0023 stores UAT cycles/sessions/defects and authorized reauthenticated electronic-signature acceptance with snapshot hash. CSV/screenshot cannot become SIGNED_UAT_CYCLE; material controlled changes invalidate evidence. Six real participant personas and exact-candidate sign-off remain required; no human sessions exist.
- Historical E2E10 PASS/10 FAIL/16 SKIP is not current closure.
- **2026-09-20 — Mind rollover (QC-100-FINAL-020):** بعد إضافة سجل 020 تجاوز `01` الحد الناعم؛ نُقلت أقدم سجلات Historical Ledger (كتلة FINAL-005، سجلات تحرير البرومبتات الثلاثة، وأربعة سجلات rollover meta) إلى أعلى `02-mind-mid.md` بعد التحقق من غيابها في الأرشيف؛ لم تُمس أقسام الحالة الحالية أو الـinvariants أو المشاكل المفتوحة. الحالة: DONE.

## Rollover from 01 — 2026-09-21 (QC-100-FINAL-036-B — back under the hard size limit)

> نُقلت أقدم سجلات Historical Ledger بعد التحقق من غيابها في الأرشيف: `QC-100-FINAL-011/014/013/015/002` (2026-09-19)، وسجلات «Fresh» لـ`QC-100-FINAL-001/007/003/010/009/002`، وسطر rollover الخاص بـ`QC-100-FINAL-004 Task 7`. لم يُنقل أي قرار حالي أو invariant أو مشكلة مفتوحة أو دليل سارٍ.

- **2026-09-19 — QC-100-FINAL-011 / Cross-domain search, outbox, reporting parity; import/bulk inventory (HEAD `f2a8172063d6b855dc94cd2351e6b70bd55c0b60`, dirty tree, diff fingerprint `08c532863c258822d1cb11c01465441e630e63da88d9fa9273049fe2a715a2d5`)**
  - Changed: إصلاحان مصدريان — (1) فلاتر تقرير `lot`/`itemCode` كانت تدخل قيمة المستخدم في `ILIKE '%…%'` بلا هروب فتعمل `%`/`_` كـmetacharacters (`LOT-%` يطابق كل شيء)؛ أُضيف `literalLikeContains()` مع `ESCAPE '\'` بما يحفظ دلالة substring المعتمدة (نفس قاعدة البحث العام)؛ (2) `outbox claim` كان يرتّب بـ`created_at` فقط وغير فريدة فلا ترتيب حتمي للدفعات المحدودة؛ أُضيف tie-break `id`. البحث العام (escaping/scope/ترتيب مستقر) وparity الشاشة/CSV/XLSX/print وdedupe/replay/recipient-scope كانوا منفذين وأُعيد إثباتهم على PG 18.6 حي.
  - Evidence: مركّز 28/28 PASS (+2 regression جديدة)؛ integration كامل **442/442** (0 skips) وunit **677/677** (93) وmigrations **29/29** على disposable PG 18.6 TLS (المنفذ المعتمد بلا Docker)؛ typecheck 0/0 + 74 hints؛ lint/format/architecture/build PASS؛ secret scan للـdiff صفر. F-009: لا إخفاقات حالية في هذا النطاق (26→28 PASS للملفات السبعة).
  - State: PARTIAL — مسارات import/bulk العامة **BLOCKED** بانتظار قرارات مالك عبر 013 (BR-GEN-064 UNCONFIRMED، BD-019/BD-020 مفتوحة؛ لم يُخترع placeholder)؛ backoff تصاعدي/max-attempt للـoutbox غير محدد في الوثائق (013)؛ report_runs/retention مشروط بقرار retention؛ E2E متصفح NOT RUN (لا Docker/Chromium sandbox) وUAT/CI/production 0/19. `PASS ≠ RELEASED`.
  - Key files: `src/modules/reporting/infrastructure/postgres-report-query.ts`, `src/shared/outbox/postgres-outbox-repository.ts`, `tests/integration/reporting/report-export-parity.test.ts`, `tests/integration/shared/notification-outbox-delivery.test.ts`, `audit/2026-09-19/QC-100-FINAL-011-cross-domain-data-reporting-import-bulk.md`.

- **2026-09-19 — QC-100-FINAL-014 / Reject Reports, analytics, Issue Slip & print acceptance (HEAD `de1ad2d6ca637bbb219eea681e233b1e57b7ce17`, dirty tree, content fingerprint `c584a071e42b3b802284e69e23b9469d845b00dca3327fd87ad0f391351a946c`)**
  - Changed: **إصلاحان مصدريان مؤكدان** — (1) `loadSlip` كان يرتّب confirmations بأمر SQL أبجدي فيأتي `FACTORY_DIRECTOR` أولًا، فيعرض دوْم الـcheckpoint التالي خطأً ويرفض التأكيد الصحيح؛ رُتّب بـ`array_position` على الترتيب القانوني SUPERVISOR→QC_MANAGER→FACTORY_DIRECTOR؛ (2) حارس `confirmApproval` كان يقبل صفوف `PENDING` فقط فكان إعادة تأكيد نقطة `REVERSED` (الموثّقة في REJECT-REPORTS.md) مستحيلة وترفض CONFLICT_STALE_VERSION ثم تُغلّف كـSYSTEM_DATABASE_UNAVAILABLE؛ قُبل `PENDING or REVERSED` (انتقال مفرد محفوظ)، وأصبح `translateDatabaseError` يمرر `AppError` القائم بدل إعادة تغليفه. + suite تكامل جديدة (5 حالات: الترتيب، أصناف الرفض بأثر صفري، التصحيح وإعادة التأكيد، VOID للنوعين، استبعاد VOID من كل المصنفات + NULL عند الصفر). إصلاح SQL ambiguity القديم أُعيد فحصه فقط دون إعادة تنفيذ.
  - Evidence: `tests/integration/qc-100-final-014` **5/5 PASS**؛ المركّز (014+reject-reports+013+UI-contract+unit-reject) **65/65**؛ unit **677/677** (93) وintegration كامل **440/440** (98 ملفًا، 0 skips) وmigrations 29/29 وconcurrency 12/12 وsecurity 52/52 على PG 18.6 مصرفي جديد (`qc_final014_full`, TLS verify-full)؛ typecheck **848/0/0** + 74 hints؛ lint/format/architecture/build PASS. عقد الرموز للصفحات 3/3 (لا انحدار placeholder-glyph). عيب الاختبار المُكتشف أثناء الإثبات: إعادة تأكيد QCM بعد عكسها تُكمل السجل تلقائيًا (FD لم يُعكس) — صُحح.
  - State: PARTIAL — إصلاحات المصدر DONE؛ export parity لـreject-reports غير موجود (قرار مالك مفتوح: تعريف تقرير + PERM-RPT-*)؛ authenticated mobile/desktop وpost-deploy وUAT وCI وdeploy NOT RUN/BLOCKED. `PASS ≠ RELEASED`، gates الإنتاج 0/19.
  - Key files: `src/modules/reject-reports/infrastructure/postgres-repository.ts`, `src/shared/database/database.ts`, `tests/integration/qc-100-final-014/reject-reports-void-analytics.test.ts`, `audit/2026-09-19/QC-100-FINAL-014-reject-reports-issue-slip-acceptance.md`.

- **2026-09-19 — QC-100-FINAL-013 / Two-stage controlled workflows + policy reconciliation (HEAD `8133185975809e37f4cda0f4006913f19921780d`, dirty tree, content fingerprint `9cf1a9437d56f47655a22a8a139e4ec06658fb9a8df4adaaa1792fd03d461d22`)**
  - Changed: **إصلاح مصدر مؤكد** — `PERM-ESIG-SIGN`/`SIGN` في `policy-registry.ts` لم يحمل `PENDING_QCM_APPROVAL`، فكان `createFinalApprovalCeremony` يرفض في فحص حالة السياسة والاعتماد النهائي **غير قابل للتنفيذ** لكل سجل (6 من 8 إخفاقات أول تشغيل). أُضيفت الحالة وحدها بلا أي تغيير آخر في المراسم. + مزامنة الوثائق: `STATE-MACHINES` (TR-INSP-006/006B/009 وTR-LAB-006/006B/009 + حالات `PENDING_QCM_APPROVAL` + lifecycle/states)، `PERMISSION-MATRIX` §61A، `ROLE-MATRIX` §55A، `BUSINESS-RULES` BR-APR-012، `REQUIREMENTS-TRACEABILITY` §103، وقسم مطابقة مؤرّخ في `POLICY-CLOSURE-MATRIX` (بلا إعادة فتح P-04/P-05/P-06/P-07).
  - Evidence: ملف جديد `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` — **16 حالة، 31/31 PASS للدليل كاملًا، 4 تشغيلات متتالية exit 0**؛ integration كامل **435/435** (97 ملفًا، 0 skips) وunit **677/677** (93) وmigrations **29/29** وconcurrency **12/12** (5 تكرارات لكل race) وsecurity **52/52** على PostgreSQL 18.6 متاح للتخلص (`qc_final013`) وtypecheck 847/0/0 + 74 hints؛ format/lint/architecture/build PASS (build exit 0). أدلة جديدة: سلسلة المختبر كاملة (create→measurements→submit→review→stage-1→final بتوقيع→reopen)، وسلسلة التفتيش من سجل يحمل نتيجة مصدرية، مع كل أصناف الرفض (سلطة/SoD/نطاق/حالة/نسخة/تكرار/تزامن) وأثر صفري مؤكد.
  - State: PARTIAL — البند 1 و5 DONE؛ البند 2 PARTIAL (سلسلة التفتيش محجوبة أدناه)؛ البند 3 PARTIAL (لا تغيير مطلوب، والـfail-closed محفوظ)؛ البند 4 BLOCKED. `PASS ≠ RELEASED`، gates الإنتاج 0/19، CI/E2E المصادق/UAT لم تُنفَّذ.
  - Key files: `src/shared/authorization/policy-registry.ts`, `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts`, `Documents/{STATE-MACHINES,PERMISSION-MATRIX,ROLE-MATRIX,BUSINESS-RULES,REQUIREMENTS-TRACEABILITY}.md`, `audit/100-percent/POLICY-CLOSURE-MATRIX.md`, `audit/2026-09-19/QC-100-FINAL-013-two-stage-controlled-workflows.md`.

- **2026-09-19 — QC-100-FINAL-015 / Credential & canonical-connection safety gate (HEAD `dccc78225c9718c2983999921bb7dabcfb15311a`, clean tree)**
  - Changed: لا تغيير في الكود ولا المزوّد ولا الاعتمادات ولا الدوران؛ تعديل محلي وحيد: أُعيد توجيه `.env` `DATABASE_URL` إلى قيمة الـExternal URL من تصدير المزوّد المحلي نفسه (**نفس الاعتماد — ليس دورانًا**) بعد أن كانت نسخة من hostname داخلي غير قابل للحل محليًا (السبب الجذري لفشل preflight الأول؛ DNS ENOTFOUND). جرد تشغيلي مطهّر + checklist تغيير/تراجع بلا أي قيم أسرار في التقرير.
  - Evidence: preflight القانوني **PASS**: PostgreSQL 18.6، `qc_operations`/`qc_operations_user`، **applied 0018 / pending 0019–0031 (13)**، capability checks كلها true؛ TLS حي عبر `pg_stat_ssl`: TLSv1.3 مع `rejectUnauthorized:true` و`is_superuser=off`؛ live `/api/health/{live,ready}` `200`. اكتشاف مطهّر: `.env` يحمل تصدير اعتماد كامل من المزوّد (لا يقرؤه أي مسار كود) بانتظار إزالته بعد الدوران. الدوران نفسه BLOCKED (تفويض مشغّل صريح) وتشغيل migrations يبقى محظورًا حتى إغلاق البوابة. Key file: `audit/2026-09-19/QC-100-FINAL-015-credential-canonical-connection-safety-gate.md`.
  - State: PARTIAL (البند 1 DONE؛ أدلة البند 3 المطهّرة — TLS/principal scope/parity/preflight — PASS على الاتصال القانوني؛ الدوران BLOCKED) — gates الإنتاج الإلزامية 0/19 دون تغيير؛ PASS ≠ RELEASED؛ لا يُعتبر أي مهمة أخرى مكتملة ضمنيًا.

- **2026-09-19 — QC-100-FINAL-002 / Local verification estate repair (candidate `84bdf249dc74062a62cd69a132a326ea2b3f2d82`, dirty tree)**
  - Changed: أُغلقت كل مخالفات الأدلة المحلية: 39 format + 55 lint (Node globals في `scripts/performance/*.mjs`، vocabularies صارت types، `loadLocalEnv()` على حد الـCLI، unused imports)؛ **إصلاحات سلوكية حقيقية:** `parseSystemOwnerGrantConfig` صار معزولًا عن `.env` (كان يدمج ملف المطوّر في الكائن المُمرَّر)، و`createPostgresMigrationStatus` يجرّب عمقي المسار (source tree + bundle) بدل عمق واحد (كان يُنتج `drift=true` زائفًا)، وصفحة مراجعة المختبر تستهلك الرموز المعرّفة بدل `--color-accent-secondary` غير الموجود، وسجل issue-slip بلا رموز U+2192؛ و8 ملفات اختبار حُدّثت عقودها المتقادمة (two-stage `PENDING_QCM_APPROVAL`، total مقابل bounded queue، literal LIKE، `uuidv7` غير مونوتونية، sparse-array) مع عزل schema للـsuites الناقصة.
  - Evidence: format 0، lint 0، typecheck 846/0 errors، architecture PASS، unit **677/677**، integration **419/419** مرتين متتاليتين، migrations 29/29، concurrency 12/12 (5 تكرارات exit 0)، security 52/52، build + release `rel-2fcb26ac5e08b697` verified، migrate clean 31/31 + re-run zero-op + schema 77/0؛ Node `22.22.3` خارج العقد. Key file: `audit/2026-09-19/QC-100-FINAL-002-local-verification-repair.md`.
  - State: PARTIAL — CI للـcandidate **BLOCKED** (run `35451577856` job `Verify` بـ0 خطوات: “account is locked due to a billing issue”) وE2E المصادق BLOCKED (لا container runtime)؛ لا commit/push/deploy/migration إنتاج.

- **2026-09-19 — Mind rollover (QC-100-FINAL-004 Task 7):** نُقل سجلا التدقيق التحريري (`Editorial revision` و`QC-MIDPOINT-REBASE-001`) إلى أعلى `02-mind-mid.md` بعد التحقق من نسخهما، إذ كان `01` عند الحد؛ أقسام الحالة والـinvariants والـblockers لم تُمس.
- **Fresh QC-100-FINAL-001 recheck (2026-09-19, candidate `31ab21a70ca479e8735d04835b5df62cafc9bc5a`, clean `main`):** Render deploy `dep-dan2jvfavr4c73a29r50` is `live` on exact SHA; live/ready 200, release identity 401, Reject unauthenticated 303. Config diverges (rust, empty health path, commit trigger, disabled subdomain, startup owner grant); RELEASE(0/6), AI(0/8), OTEL(0/2) absent; NODE_VERSION key present but value not revealed (Blueprint expects 24.20.0). Domain names present; verification not checked. DB Free expiry `2026-10-05`; PITR/exports unavailable, zero exports, one default credential; Production unprotected. No production DB access; canonical checks BLOCKED by rotation gate and absent local canonical URL. CI `35426396304` failed before steps due billing lock. PARTIAL / BLOCKED; `audit/2026-09-19/QC-100-FINAL-001-production-parity-recheck.md`.
- **Fresh local QC-100-FINAL-007 (2026-09-19, candidate `daf513ea3f2620f88cee1041bb8cf4ca04273fde` + untracked `scripts/performance/` harness):** representative PERF- dataset re-seeded (25 users / 3000 tasks / 8000 receiving / 2500 inspections / 1800 lab / 1200 reject / 2500 notifications / 12000 audit); EXPLAIN (ANALYZE, BUFFERS) 9 statements all <30 ms, batched reads not N+1, no duplicate dashboard SQL, seq-scan risks on unbounded `/tasks` + receiving scan; authenticated vitals 8 routes (LCP ≤360 ms, CLS 0, JS ~2.9 KB, WASM 0; INP NOT VERIFIED); smoke 11 paths TTFB p95 ≤168 ms except `/tasks` 1.26 MB unbounded; read concurrency to c=24 p95 ≈538 ms zero errors (single shared pool max-10 saturation signature); concurrency suite 12/12 PASS; rate-limit mechanism 5/60s→THROTTLED in-process, production values deferred; outbox single-drain PASS, pressure NOT RUN; logs+correlation+secret-scan PASS; metrics export NOT VERIFIED (no-op providers, no /metrics); alert delivery NOT RUN (OPEN); §6 budgets PROPOSED only (PRD-DD-004/005 still deferred). State: PARTIAL. Evidence: `audit/2026-09-19-QC-100-FINAL-007-performance-capacity-monitoring.md`.
- **Fresh QC-100-FINAL-003 candidate run (2026-09-19):** exact built candidate `bb42d6b51dc2754901dca6f84c4351c6ed36b766`, build `qc-closure-bb42d6b51dc2`, migration head `0030_reject_reports_role_parity`, disposable local PG18.6 equivalent, five `verify-*` personas plus untouched `yazeed`; machine evidence `11 PASS / 10 FAIL / 16 SKIP`. Authenticated closure remains **NOT VERIFIED / PARTIAL**. The run reproduced unsafe login `returnTo`; candidate fix is now in `src/pages/login.astro`. Full representative workflow records were not seeded, so required domain IDs were absent. Evidence: `audit/2026-09-19-QC-100-FINAL-003-authenticated-e2e.md` and `.ci-results/qc-100-final-003-authenticated-e2e-evidence.json`.
- **Fresh local QC-100-FINAL-010 (2026-09-19, candidate `f87ffe107426bc988e1e1e88eed3c5945ce3cb8d` + dirty tree):** focused authorization/security negative matrix `63/63 PASS`; `pnpm test:security` `51 PASS + 1 SKIP`, with the PostgreSQL rate-limit case BLOCKED by unavailable Testcontainers and an existing local PostgreSQL process preventing the disposable fallback. Frozen offline install/lock integrity PASS. Dependency audit produced no network result; SBOM tool and dedicated secret scanner unavailable. Privacy classification/retention/deletion/correction/export/AI-processing approvals remain NOT VERIFIED/open. Evidence: `audit/2026-09-19-QC-100-FINAL-010-security-privacy-supply-chain.md`.
- **Fresh local QC-100-FINAL-009 (2026-09-19, candidate `95d1380f2f463bad911d6ee041ae6a7f45cbf897`):** AI adapter/application-focused suite `4 files / 66 PASS`, Prettier PASS, typecheck `821 files / 0 errors / 72 hints`; runtime Node `24.19.0` is below the declared `24.20.0` minimum. Mocks cover Groq→Gemini bounded failover, 12-second timeout, error classes and sanitized fallback; no provider request was sent. Live Groq/Gemini/models/failover, approved external-processing scope and human reviewer evidence remain NOT RUN/BLOCKED. Evidence: `audit/2026-09-19/QC-100-FINAL-009-ai-provider-verification.md`.
- **Fresh local (QC-100-FINAL-002, candidate `e30285c…`):** install/format/lint/typecheck/architecture/tech-debt/diff-check/build/release PASS on Node `24.20.0` + pnpm `11.25.0`; unit83 files/564 PASS; integration87 files/353 PASS (Reject ambiguous-status SQL fixed); migrations29 PASS; concurrency12 PASS (stability 15/15 runs after re-contracting the loser codes); security52 PASS; schema77 tables/0 orphans. E2E48 PASS/19 FAIL/107 SKIP unchanged (Docker-only authenticated runner). Fixture seed/cleanup against the disposable PG 18.6 PASS. Details: `audit/2026-09-18-qc-100-final-002-verification-gates.md`.


## Rollover from 01 — 2026-09-20 (QC-100-FINAL-026 — back under the hard size limit)

> نُقلت أقدم سجلات Historical Ledger (سجلات 2026-09-18: `QC-100-FINAL-001`، `QC-CLOSURE-018/017/016/014/013/012/009/008`، `QC-DASHBOARD-LIVE-REVIEW-001`، `QC-SKILL-POSTGRES-ANALYTICS-001`، `QC-AUTH-E2E-DOCKER-001`، `QC-REJECT-REPORTS-001`، `QC-YAZEED-CONTROL-CENTER-001`، `QC-RENDER-POSTGRES-VERIFY-001`، وبرومبت التحرير القديم) بعد التحقق من غيابها في الأرشيف. ثوابت ما زالت سارية نُقلت إلى أقسام الحالة الحالية قبل النقل: قرار `NO-GO`/gates 0/19 (قسم Release Governance)، وانحراف خدمة Render الحية عن `render.yaml` (قسم Architecture/Deployment). لم يُنقل أي قرار حالي أو invariant أو مشكلة مفتوحة أو دليل سارٍ.

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
- **2026-09-18 — QC-CLOSURE-016 / Real UAT, Usability & Human Validation**
  - Changed: recorded manual live preflight observations and the complete required persona/scenario coverage as blocked; no fabricated participant results or sign-off were added to the UAT CSV templates.
  - Evidence: login page, anonymous `/dashboard`, `/system/health`, `/system/control-center` redirects, and safe invalid-login recovery observed through the browser. Real human role sessions, authenticated workflows, mobile use, stale-data recovery, and authorized sign-off remain unavailable.
  - State: PARTIAL / BLOCKED.
  - Key files: `audit/2026-09-18-qc-closure-016-real-uat-human-validation.md`.
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
- Exact current HEAD: `654c3d4e7d388dfa4ddf3fea4f24320d8675625d` on `main` with tree `edb95d39b53b6686b0cd9bc9714ccc9b3f470ce9` (verified 2026-09-20; QC-100-FINAL-023 working changes present and preserved; earlier record of `95d1380f…`/tree `85646464…` is HISTORICAL). The last provider-verified deploy record bound `298e307721af97d9c1bd22279d0c784fbf5b62a8` (`dep-damfhv8u01pc738s4430`, `live`, finished `2026-09-18T08:43:07Z`); this candidate is **not** provider-verified and live release identity stays `UNVERIFIED` (QC-100-FINAL-016). Migration source head is `0031_qc_creation_parity_two_stage_approval`; it is still not applied to Render and was not runtime-applied against Render. QC-100-FINAL-008 restored the candidate chain locally on disposable PostgreSQL 18.6: 30 migrations / 77 tables / 0 orphans.
- **Render PostgreSQL — VERIFIED (read-only):** `dpg-dadqmsgn74is73b774j0-a` is the Render **database** id (not the web-service id) and is the internal hostname label; app database `qc_operations`, principal `qc_operations_user`, PostgreSQL 18.6, region oregon, **free plan expiring `2026-10-05`**. Canonical pool connects with TLS 1.3 and session `search_path=qc,pg_catalog`, `TimeZone=UTC`; `/api/health/ready` is `200 healthy` both for the built app against this database and for live `https://qclevel.top`. Data is bootstrap-only (1 user, 2 role grants, 4 audit events, 0 lab tests).
- **Render migration gap (blocker; applied head RE-VERIFIED 2026-09-19 by QC-100-FINAL-015):** canonical local connectivity is now proven — after repointing the ignored `.env` `DATABASE_URL` from the non-resolvable internal bare hostname to the export's External URL value (**same existing credential, not a rotation**), `pnpm db:preflight` PASSes read-only: PostgreSQL 18.6, `qc_operations`/`qc_operations_user`, live `pg_stat_ssl` = TLSv1.3 under the canonical `rejectUnauthorized:true` policy, **applied head `0018` / pending `0019`–`0031` (13)**, capability checks true; live `/api/health/{live,ready}` `200`. The credential-rotation gate in `Documents/RENDER-DATABASE-CONNECTION.md` stays **actively open**: the in-use credential is the documented-compromised export credential, so applying migrations remains **prohibited** until the operator rotates and revokes. The local `.env` still carries the full provider credential export awaiting post-rotation removal. Provider facts: database `dpg-dadqmsgn74is73b774j0-a`, `qc_operations`, principal `qc_operations_user`, PostgreSQL 18, free plan, expiry `2026-10-05T05:41:06Z`. Evidence: `audit/2026-09-19/QC-100-FINAL-015-credential-canonical-connection-safety-gate.md`.
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

> ## 1) قواعد القراءة والتنفيذ

>- اقرأ هذا الملف أولًا لفهم الوضع الحالي، ثم ارجع إلى الكود والوثائق المعتمدة عند التنفيذ.
>- عند التعارض: الكود الحالي + الوثائق المعتمدة + الأدلة الطازجة على نفس HEAD تتقدم على وصف تاريخي قديم.
>- لا تحول نتيجة محلية أو static audit إلى claim عن production/UAT/live behavior.
>- لا تعتبر `PASS` في الفحص مساويًا لـ`RELEASED`; نتيجة الفحص وحالة الإفراج منفصلتان.
>- الأفعال الحساسة تبقى server-authorized وتخضع حسب المسار إلى permission + scope + state + SoD + expected version + business/scientific rules + reauthentication/e-signature عند الحاجة.
>- لا تعتمد بيانات هوية/بوابات/مخاطر قادمة من المتصفح كحقيقة إصدار أو اعتماد.
>- لا commit أو push أو deploy من الوكيل إلا بطلب صريح.
>- Render هو مسار نشر Astro SSR. GitHub Pages/Jekyll ليس هدف نشر التطبيق.

## Rollover from 01 — 2026-09-20 (QC-100-FINAL-022 — back under the size limit)

> نُقلت أقدم سجلات Historical Ledger بعد التحقق من وجودها هناك: سجل `QC-SYSTEM-OWNER-YAZEED-FINAL-CLOSURE-005` (يمثله قسم Protected grants الحالي)، و`QC-CLOSURE-POLICY-009` (يمثله `audit/100-percent/POLICY-CLOSURE-MATRIX.md`)، و`QC-CLOSURE-015` (يمثله قسم Backup/Recovery الحالي)، وسجلات تنفيذ `QC-100-FINAL-004` Tasks 3–8 (يمثلها سجل العلامة البشرية الحالي وقسم المشاكل المفتوحة). لم يُنقل أي قرار حالي أو invariant أو مشكلة مفتوحة أو دليل سارٍ.

- **2026-09-19 — QC-100-FINAL-004 / Task 8: Defect loop + regression + execution report (candidate-side, HEAD `9e258276a0f851a35c58d150f474bc962e38e12d`)**
  - Changed: إصلاحا عيب مكتشفان في دورة Detect→Fix→Retest: `nextAction` في `src/pages/quarantine/inspections/[inspectionId]/review.astro` كان يشير إلى `canApprove` المحذوف من سلسلة المرحلتين (بُدّل بـ`canStageApprove`/`canFinalApprove` حسب الحالة)، و3 مواضع `pool.query` في `tests/integration/uat-evidence/uat-evidence-ingestion.test.ts` صارت `pool!` بنمط الملف. لا تغيير عقود ولا schema.
  - Evidence (على الشجرة النهائية): typecheck **846/0 errors** (كانت 4)؛ architecture PASS؛ unit (uat-evidence+authorization+release-governance+approvals+qc-permission-contract+seeds) **93 PASS**؛ integration على PG 18.6: uat-evidence+release-governance 13 PASS، reject-reports+quarantine 49 PASS؛ `uat:scenarios` على `qc_uat_bringup` **14 PASS/0 FAIL/3 NOT RUN**؛ migrate:check 31 ok / schema:check 77 tables/0 orphans. مصفوفة الوصول مُقاسة من القاعدة: EMPLOYEE 106 صلاحية (0 approve/0 sign/14 create)، Supervisor 170 (stage-1 فقط)، QCM 128 (final)، yazeed 255. حقيقة الأدلة: cycles 7/0 accepted، gate 0، signatures 0، sessions 77 آلية/0 بشرية.
  - State: DONE للمهام 1–8 محليًا مع تقرير تنفيذ صادق (فقرتان FAILED مفتوحتان: ملف تكامل المرحلتين المخصص غير موجود، ووثائق STATE-MACHINES/PERMISSION-MATRIX لم تُزامن `PENDING_QCM_APPROVAL`)؛ **البلوكر النهائي الوحيد: علامة بشرية حقيقية — لا شيء مُفبرك، `uat` gate = UNVERIFIED**.
  - Key files: `audit/2026-09-19/QC-100-FINAL-004-execution-report.md`, `src/pages/quarantine/inspections/[inspectionId]/review.astro`, `tests/integration/uat-evidence/uat-evidence-ingestion.test.ts`.
- **2026-09-19 — QC-100-FINAL-004 / Task 7: Automated UAT scenario suite (candidate-side)**
  - Changed: جديد `scripts/uat/run-uat-scenarios.ts` (`pnpm uat:scenarios`) + نواة قرار خالصة `scripts/uat/scenario-support.ts`؛ يقود التطبيق الحقيقي عبر HTTP (login/صفحات/`/_actions/*`) على قاعدة UAT، ثم يكتب دليل جلسات آلية عبر مسار Task 5. النتيجة على `qc_uat_bringup`: **14 PASS / 0 FAIL / 3 NOT RUN / 0 BLOCKED**، مصفوفة إنشاء 12 مسارًا × QC-01/02/03 كلها 200 وبصمات قدرات متطابقة، وقبول واحد حقيقي للـreceiving لكل شخصية.
  - Evidence: ثوابت جديدة أُثبتت حيًا: `quarantine.{release,hold}Receiving` على سجل حقيقي مملوك لـ`uat-qc-01` → `FORBIDDEN`؛ واجهة `/admin/users/new` تُرجع 200 لكل شخصية لكنها **تُخفي النموذج وتُظهر قسم الرفض**، و`admin.createUser` بـpayload صالح → `FORBIDDEN` للثلاثة مع **0** حساب مُنشأ في `qc.users`؛ تحرير مستخدم خارج النطاق يُرفض والسجل المُخزَّن يبقى غير متغيّر (`version=2`)؛ الدورة تبقى `IN_PROGRESS` وبوابة `uat` صفر صفوف. بوابات: unit `28 PASS` للوحدة الجديدة، typecheck 0 errors، architecture PASS.
  - State: PARTIAL (مرشّح محليًا) — NOT RUN: السلسلة الكاملة بالاعتماد المزدوج + التوقيع الإلكتروني (بند 3)، return-for-correction (4)، stage-skip/edit-after-APPROVED/owner override (5 الباقي)، lock+REOPEN (6)، وتأكيدات التدقيق لكل انتقال (7)؛ وإنشاء مسودات لكل نوع تقرير. Key files: `scripts/uat/run-uat-scenarios.ts`, `scripts/uat/scenario-support.ts`, `tests/unit/uat-evidence/uat-scenario-support.test.ts`, `audit/2026-09-19/QC-100-FINAL-004-task7-uat-scenarios.md`.
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
- **2026-09-18 — QC-CLOSURE-015 / Backup, Restore, Deployment & Production Evidence**
  - Changed: added exact local backup/restore evidence and a disposable PostgreSQL portability setting (`dynamic_shared_memory_type = 'mmap'`) required on this host.
  - Evidence: PostgreSQL 18.6 dump `282,954` bytes, SHA-256 captured, restore parity `77/77` tables, ledger `29/29`, FK validation `0` invalid, focused recovery/catalog/health `35/35 PASS`; live domain/TLS/health verified. Production identity, provider capabilities, and populated controlled-record recovery remain unverified.
  - State: PARTIAL / NO-GO.
  - Key files: `audit/2026-09-18-qc-closure-015-backup-restore-deployment-production-evidence.md`, `scripts/db/disposable-postgres.sh`.
## [2026-09-18] — QC-SYSTEM-OWNER-YAZEED-FINAL-CLOSURE-005 / explicit role+scope admin, dialogs, stale UX
- Changed: added explicit incremental scope administration end to end (`assignUserScope` / `removeUserScope` port methods, transactional PostgreSQL implementation with canonical-owner `GLOBAL` protection, `AssignUserScopeUseCase` / `RemoveUserScopeUseCase`, Astro actions); replaced the replace-only scope UX with per-grant assign/remove plus a clearly-labelled bulk *Replace* inside `<details>`; rewrote `/admin/users/[userId]` with Profile / Account security / Roles / Scopes / Administrative control sections, capability-driven controls, `Protected` markers for canonical owner grants, and de-duplicated lifecycle controls; removed all native `confirm()`/`alert()` from the journey in favour of the shared `ConfirmDialog` + `src/ui/client/dialog.ts` (focus trap, focus return via opener registry, Escape blocked mid-submission, pending state, inline error region, stale refresh control); made the admin Action error boundary deterministic (`astroActionCodeFor` projects `ErrorCode` → Astro code, exact `ErrorCode` travels as the message) and taught the shared classifier the exact-code map plus a `DUPLICATE_COMMAND` state; added `STALE_VERSION_MESSAGE` with an explicit `Refresh record` path and no auto-retry; made `SCOPE_KINDS` the single canonical scope vocabulary for actions, pages, and persistence validation.
- Fixed regression: `ListUserRolesUseCase` authorized `PERM-ADM-ROLE-VIEW`/`VIEW` against entity type `USER`, which the policy registry does not declare (it is declared on `ROLE`), so role membership could never be read; it now uses the registered entity type. This means the pre-005 role list on the user-detail page was always restricted.
- Evidence: `pnpm typecheck` 0 errors; `tests/unit/admin` 65/65 PASS (3 new files: scope administration 17, role administration 6, error contract 14, plus existing guards). Not verified: full unit suite, lint, format, architecture, build, diff check, Playwright, PostgreSQL.
- State: PARTIAL / BLOCKED (source-level closure only).
- Key files: `src/modules/administration/application/{assign-user-scope,remove-user-scope}.ts`, `src/modules/administration/infrastructure/postgres-authorization-repository.ts`, `src/actions/admin.ts`, `src/pages/admin/users/[userId].astro`, `src/ui/components/feedback/ConfirmDialog.astro`, `src/ui/client/dialog.ts`, `src/ui/forms/admin-mutation-copy.ts`, `src/shared/errors/action-error-code.ts`.
- Not done in this task: dedicated Playwright spec, accessibility-spec extension, PostgreSQL integration tests, `SYSTEM-OWNER-DATA-CONTROL-MATRIX.md` classification refresh.
## [2026-09-17] — QC-CLOSURE-POLICY-009: Canonical policy closure matrix
- أضيفت `audit/100-percent/POLICY-CLOSURE-MATRIX.md` كمرجع واحد لـPD-01–PD-37 مع الحقول المطلوبة، والتصنيف `CLOSED/PARTIAL/OPEN/BLOCKED`، وسير controlled configuration/data دون اختراع قيم.
- أُغلقت كقرارات سياسة فقط: P-05 authority slices لـPD-08/09/10، وP-06 دورة حياة القوالب، وP-07 سلطة Production Release النهائية. بقيت أدلة UAT/provider/runtime منفصلة وغير مغلقة.
- حُذفت الحالات الميتة المقابلة من BUSINESS-RULES/PERMISSION-MATRIX/ROLE-MATRIX/STATE-MACHINES/REQUIREMENTS-TRACEABILITY/PRODUCTION-READINESS-CHECKLIST، مع إبقاء التوقيع العام وSoD/QMS/scientific/provider decisions مفتوحة.
- التحقق: targeted unit `43/43 PASS` (3 ملفات)، و`test:architecture` PASS؛ Node المحلي `v22.22.3` ما زال خارج العقد `>=24.20.0 <25`.
- الحالة: PARTIAL — matrix/document closure completed; R-007 remains OPEN for unresolved QMS/provider/data-instance items and live evidence.
# QC Operations & Laboratory Management System — Project Mind Archive

> **Status:** ARCHIVE — read-only historical project memory
> **Source:** Rotated from `01-mind-latest.md` on 2026-09-04 after the live mind exceeded the operating-size guideline.



## Rollover from 01 — 2026-09-20 (QC-100-FINAL-020 — further compaction to the soft limit)

> نُقلت أقدم سجلات Historical Ledger بعد التحقق من غيابها في هذا الأرشيف: كتلة `QC-100-FINAL-005 / Shared UI`، وسجلات تحرير البرومبتات الثلاثة، وأربعة سجلات rollover meta سابقة. لم يُنقل أي قرار حالي أو invariant أو مشكلة مفتوحة أو دليل إصدار سارٍ.

- **2026-09-19 — QC-100-FINAL-005 / Shared UI, navigation, forms, grids & recovery states (HEAD `ca71a76b…`، dirty fingerprint النهائي `290c516ea69ca2a6fcd6707e4edf9eba33efb5e28fa624366fe13a7310e3cbc2`، وfingerprint الكود وحده أثناء التحقق `d9168d26…`)**
  - Changed: أُصلحت انحدارات الرموز/الأهداف في primitives المشتركة + مخالفة logical property واحدة؛ واعتُمد سطح السجل المشترك (FilterBar/AppliedFilters/EmptyTableState/Pagination) على عائلة Assets وtasks وchange-requests؛ وأُزيل إسقاط الفشل إلى صفر في `/audit` و`/tasks` و`/change-requests` (فصل UNAVAILABLE عن EMPTY ورَفْض AUTHZ)؛ وأُضيفت منطقة status مفقودة لكل نموذج في change-request review. لا تغيير على تفويض الخادم ولا العقود ولا schema.
  - Evidence: typecheck 851 ملفًا/0 أخطاء/74 hints؛ unit **96 ملفًا/707 PASS** (+30 جديد)؛ integration **98 ملفًا/442 PASS** (0 skips) على PG 18.6 disposable؛ architecture/format/lint/build PASS؛ release `rel-74de185e8422a902` verified؛ migration head `0031` بلا تغيير. اختبارات جديدة: `tests/unit/ui/{register-surface,design-governance,mutation-safety}-contract.test.ts`.
  - State: PARTIAL — البنود 1/4/5 DONE في نطاقها المعلن؛ 2/3 PARTIAL بفجوات مسجّلة (9 أسطح JS-only، 15 سجل unbounded، حوارات تأكيد لـFinalize/Void)؛ authenticated browser/E2E وUAT وCI ما زالت BLOCKED/NOT RUN؛ `PASS ≠ RELEASED` وبوابات الإنتاج 0/19.
  - Key files: `audit/2026-09-20/QC-100-FINAL-005-shared-ui-navigation-forms-grids-recovery.md`, `tests/unit/ui/{register-surface,design-governance,mutation-safety}-contract.test.ts`.
- **2026-09-20 — Prompt execution hardening:** Changed: تقسيم21 عائلة إلى67 مرحلة ضمن42 مهمة، وإضافة قواعد التنفيذ والاستئناف والتسليم لكل مرحلة، ومزامنة التقريرين. Evidence: حفظ188/188 بندًا؛ النسخ67/67 والبديل والفشل والتوسيع والروابط PASS بمحاكاة DOM؛ التقريرين36 قسمًا ونسب متطابقة؛ استُخدمت أداة الكمبيوتر لحصر الأسطح فقط، والعرض البصري NOT RUN. State: DONE لتعديل البرومبتات فقط. Key file: `audit/QC-Remaining-to-100-Percent-Prompts-Interactive.html`.
- **2026-09-19 — Extended improvement prompts:** Changed: أضيفت 24 مهمة وفهرس 100 مجال، وزُومِن القسم33 في التقريرين؛ 012 أخيرًا. Evidence: 42 copy targets وروابط وفهرس وترتيب PASS؛ محاكاة النسخ 42/42 والبديل والفشل والتوسيع/الطي PASS؛ التقريرين 36 قسمًا ونسب متطابقة؛ العرض البصري NOT RUN. State: DONE لتحرير الخطة فقط. Key files: `audit/QC-Remaining-to-100-Percent-Prompts-Interactive.html` والتقريران الحيان.
- **2026-09-19 — Remaining-work prompts rewrite:** Changed: أعيدت كتابة البرومبتات الـ18، ثم أزيلت أقسام Acceptance وتعليمات تنفيذ UAT بطلب المستخدم؛ 004 لتوثيق اعتماد الدليل البشري فقط، دون إسقاط بوابة التقرير. Evidence: 18 prompts / 18 copy targets، 0 Acceptance sections، JavaScript syntax وdiff-check PASS؛ العرض البصري لم يُعد اختباره. State: DONE لنطاق تحرير البرومبتات فقط. Key file: `audit/QC-Remaining-to-100-Percent-Prompts-Interactive.html`.
- **2026-09-19 — Mind rollover (QC-100-FINAL-015):** نُقلت ثلاثة سجلات تاريخية من 2026-09-18 (FINAL-013، FINAL-002، FINAL-016 live UX) إلى أعلى `02-mind-mid.md` بعد التحقق من عدم وجودها في الأرشيف؛ لم تُمس أقسام الحالة أو الـinvariants أو المشاكل المفتوحة. الحالة: DONE.
- **2026-09-19 — Mind rollover (QC-100-FINAL-013):** بعد إضافة سجل FINAL-013 بلغ `01` 509 سطرًا (فوق الحد الناعم 500)؛ نُقلت أقدم سجلات الـHistorical Ledger (ملف NFR التاريخي §15، `QC-AI-PROVIDERS-001`، `QC-CLOSURE-010`) إلى أعلى `02-mind-mid.md` بعد التحقق من غيابها في الأرشيف، فنزل `01` إلى 492 سطرًا؛ لم تُمس أقسام الحالة الحالية أو الـinvariants أو المشاكل المفتوحة. الحالة: DONE.
- **Project Mind rollovers** — `QC-YAZEED-CONTROL-CENTER-001` (12 سجلًا)، `QC-CLOSURE-007` (12)، `QC-CLOSURE-005` (23)، `QC-100-FINAL-016` (5)، `QC-100-FINAL-016 remediation` (5)، و`QC-100-FINAL-005 follow-up` (`QC-CLOSURE-006` + `QC-CLOSURE-007`) نُقلت إلى `02-mind-mid.md` بعد التحقق من وجودها في الأرشيف قبل الحذف (لم تُنقل أي قرارات حالية أو مشاكل مفتوحة). الحالة: DONE.
- **2026-09-19 — Mind rollover (QC-100-FINAL-004 Task 6):** بعد إضافة سجلي Task 6 وTask 5 بلغ `01` 511 سطرًا (فوق الحد الناعم 500)؛ نُقلت أربعة سجلات تاريخية (`QC-MCP-POSTGRES-001`، `CODEX-PLUGIN-SYNC`، `QC-MIDPOINT-REWRITE-001`، `QC-MIDPOINT-REBASE-001`) إلى أعلى `02-mind-mid.md` بعد التحقق من غيابها في الأرشيف، فنزل `01` إلى 493 سطرًا؛ لم تُمس أقسام الحالة الحالية أو الـinvariants أو المشاكل المفتوحة. الحالة: DONE.

## Rollover from 01 — 2026-09-20 (QC-100-FINAL-017 — dashboard intelligence & operational read models)

> نُقلت ثلاثة سجلات تاريخية (`RENDER-BUILD-FIX`، `QC-100-FINAL-001 / Production parity recheck`، `QC-100-FINAL-008 / Populated backup`) إلى هنا بعد التحقق من غيابها في هذا الأرشيف، لأن `01` بلغ 498 سطرًا قبل إضافة سجل FINAL-017. لم تُنقل أي قرارات حالية أو invariants أو مشاكل مفتوحة أو أدلة إصدار سارية.

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

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-005 — shared UI/navigation/forms/grids/recovery)

> نُقلت أربعة سجلات تاريخية (`QC-100-FINAL-009`, `QC-100-FINAL-007`, `QC-100-FINAL-010` وسجل FINAL-014 المرشّح 2026-09-18) إلى هنا بعد التحقق من غيابها في هذا الأرشيف، لأن `01` بلغ 503 سطرًا (فوق الحد الناعم 500) قبل إضافة سجل FINAL-005. لم تُنقل أي قرارات حالية أو invariants أو مشاكل مفتوحة أو أدلة إصدار سارية.

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

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-013 — two-stage controlled workflows)

> نُقلت أقدم سجلات الـHistorical Ledger من `01` (ملف الأدلة التاريخي لـNFR، وسجلَا `QC-AI-PROVIDERS-001` و`QC-CLOSURE-010`) إلى هنا بعد التحقق من غيابها في هذا الأرشيف، لأن `01` بلغ 509 سطرًا (فوق الحد الناعم 500). لم تُنقل أي قرارات حالية أو invariants أو مشاكل مفتوحة أو أدلة إصدار سارية؛ كل ما نُقل تاريخي لمرشّحات سابقة.

## 15) Historical evidence snapshot — Production NFR evidence
- `QC-CLOSURE-NFR-010` أضاف سجل أدلة موحدًا على exact source `313bdfcc031abc18d3e55e75a025d880b9d16450` وbuild `rel-d740622fc9010566`، مع فصل الأدلة المحلية عن claims الإنتاج/UAT.
- frozen install/lock integrity، 37 focused security/observability tests، typecheck، architecture، build، release identity/verification، source-map scan، local CSP/CSRF/safe-error HTTP checks: **VERIFIED/PASS** ضمن Node `v22.23.1` فقط، وهو خارج contract `>=24.20.0 <25`.
- local smoke: login/live 200، readiness 503 بسبب PostgreSQL unavailable، cross-origin mutation 403؛ هذه أدلة runtime محلي لا production.
- accessibility selected browser run: 6/8 PASS؛ login tests unstable/NOT VERIFIED، وكل authenticated keyboard/AT/manual workflows NOT EXECUTED.
- dependency audit لم يرجع بسبب network، CI exact-head ما زال غير مثبت، Docker/PostgreSQL 18/authenticated E2E/provider/exporter/live performance ما زالت **BLOCKED/UNVERIFIED**.
- privacy data-flow inventory موجود في evidence file؛ مدد retention وdeletion/correction الدقيقة غير مخترعة وتبقى pending policy.

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

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-015 — credential/canonical-connection safety gate)

> نُقلت أقدم ثلاثة سجلات تاريخية (2026-09-18: QC-100-FINAL-013، QC-100-FINAL-002، QC-100-FINAL-016 live UX review) إلى هنا بعد التحقق من عدم وجودها في هذا الأرشيف، لإبقاء `01` قرب حدّه الناعم بعد سجل 015. لم تُنقل أي قرارات حالية أو invariants أو مشاكل مفتوحة؛ أرقامها تاريخية لمرشّحات سابقة.

- **2026-09-18 — QC-100-FINAL-013 / Controlled-workflow inventory + disposable-PG evidence refresh**
  - Changed: built the remaining-requirements inventory with source/owner/path/acceptance-evidence per item and a controlled-source request pack (PD-01..38 opens, TR-LAB-008 VOID, Domain-70 Arabic/RTL applicability decision); no code/policy/scientific value changed; fail-closed defaults preserved.
  - Evidence: on candidate `eab4e341` + Node 24.20.0/pnpm 11.25.0 with a local disposable PostgreSQL 18.6 (TLS, throwaway cert, `LC_ALL=en_US.UTF-8` needed for Homebrew startup): unit 83 files/564 PASS, integration 87 files/353 PASS, concurrency 12/12 PASS on live PG, migrations 29/29 + zero-op re-run, preflight/migration-integrity PASS, schema 77 tables/0 orphans; browser E2E still BLOCKED (host Chromium/localhost restriction); cluster destroyed after the run.
  - State: PARTIAL / BLOCKED (external authority sources remain open; G-001/G-002/G-004 closed for local disposable-PG scope only).
  - Key files: `audit/2026-09-18/QC-100-FINAL-013-remaining-requirements-inventory.md`.
- **2026-09-18 — QC-100-FINAL-002 / Verification gates repaired, candidate proven locally**
  - Changed: fixed the Reject analytics ambiguous-`status` SQL (root cause of the live `/reject-reports` 500 on a fully migrated schema), replaced the reject-reports `Function`/`any` filter helpers with typed Kysely builders, corrected the synchronous `.rejects` harness (asserts the throw + `AUTHZ_DENIED` now), derived the control-center expected migration head from `loadMigrations()`, re-contracted both concurrency race assertions to the three verified safe loser codes (`AUTHZ_DENIED` / `DOMAIN_INVALID_TRANSITION` / `CONFLICT_STALE_VERSION`), wired candidate-bound authenticated fixtures into CI (`QC_MANDATORY_VERIFY_FIXTURES` + new workflow step running `verify:e2e:authenticated` with one-time generated passwords), and pinned `LC_ALL=C` in `disposable-postgres.sh`.
  - Evidence: on candidate `e30285c39695defcaaa9a12ce517e6831f5bc8f7` + Node `24.20.0`/pnpm `11.25.0` and isolated disposable PG 18.6: format/lint/typecheck/architecture/tech-debt/diff-check/unit 83 files/564, integration 87/353, migrations 8/29, concurrency 2/12 (stability 15/15 runs), security 7/52, build, release identity, fixture seed/cleanup — all PASS. `audit/2026-09-18-qc-100-final-002-verification-gates.md`.
  - State: DONE (local). Exact-SHA CI remains BLOCKED (billing lock; push needs explicit authorization); CI Testcontainers path NOT RUN locally (no Docker).
- **2026-09-18 — QC-100-FINAL-016 / Live product UX & human-centered application review (read-only)**
  - Changed: no product code changed; live page-family review of the deployed product using an operator-typed session, recorded as `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md` (36 route families + 18 targeted URL probes; 5 P1 / 16 P2 / 10 P3, each with type, source pointer and copy replacement).
  - Evidence: live reproductions of the serif fallback, the ignored KPI drill-down params, the UUID topbar identity, `/reject-reports` 500, CSP-blocked inline scripts (`/ai-advisory` flow dead, `/account` toggle inert), `/account` outside the shell, the two phantom `/quality/*/new` routes, the self-contradicting migration card and the self-view role contradiction; strengths re-confirmed (fail-closed states, 404 semantics, keyboard/focus, no overflow on 34/35 routes, no unlabelled controls).
  - State: PARTIAL — review DONE; indicator unchanged at `29.0%`; consumers are 005/017/018/006. Not human UAT; single role; bootstrap-only data; deployed SHA `UNVERIFIED`.
  - Key files: `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`.

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-004 / Task 7 — automated UAT scenario suite)

> نُقل هنا سجلا التدقيق التحريري القديمان بعد التحقق من عدم وجودهما في هذا الأرشيف: كلاهما معلَّم تاريخيًا في `01` ("not revalidated for this newer HEAD" و"historical after subsequent commits")، ولا يحمل أي قرار ساري أو blocker مفتوح. لم يُنقل أي invariant أو مشكلة مفتوحة.

- **Editorial revision:** `20e6ead8f397d02ac2de807a273795dfac47a703`. Reports and the 15-prompt HTML were rewritten for clarity; prior operational results remain tied to `298e307721af97d9c1bd22279d0c784fbf5b62a8`, not revalidated for this newer HEAD. Scores unchanged; operational status must be rechecked before use.
- **QC-MIDPOINT-REBASE-001 evidence baseline (historical after subsequent commits):** HEAD `298e307721af97d9c1bd22279d0c784fbf5b62a8`/main dirty tree preserved; source 0030, 18 modules, 85 routes (2/81/2), 83 pages, 32 navigation destinations. Mechanical coverage 1048 first-party files plus targeted semantic review; exhaustive manual coverage NOT VERIFIED.

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-004 / Task 6 — local UAT bring-up)

> نُقل هنا أقدم سجلين متبقيين في `01` (QC-MCP-POSTGRES-001 وCODEX-PLUGIN-SYNC) بعد التحقق من عدم وجودهما في هذا الأرشيف، وبعد التأكد أن حالتهما الحالية ما زالت ممثلة في أقسام الحالة (إعداد MCP المحلي وحالة الـhandshake غير المتحقق). لم تُنقل أي قرارات أو blockers سارية.

- **2026-09-18 — QC-MCP-POSTGRES-001 / Project-local PostgreSQL MCP server**
  - Changed: added a Codex project-scoped `postgres-mcp` STDIO configuration and a fail-closed launcher that loads the allowlisted local `DATABASE_URL`, maps it to `DATABASE_URI`, and forces restricted read-only mode; documented the credential-rotation requirement.
  - Evidence: TOML parse PASS; project typecheck `0 errors`; launcher missing-URL guard PASS; live database handshake **NOT VERIFIED** by design while the Render credential-rotation gate is open.
  - State: PARTIAL.
  - Key files: `.codex/config.toml`, `scripts/mcp/postgres-mcp.ts`, `docs/operations/POSTGRES-MCP.md`.
- **2026-09-18 — CODEX-PLUGIN-SYNC / Codex plugin cache into project**
  - Changed: copied 49 installed Codex plugin packages into `.agents/plugins/codex-cache/`, excluding internal `.git` directories and `.DS_Store` files.
  - Evidence: source/destination `rsync` dry-run clean; 49 plugin roots / 2,685 files / 88 MB.
  - State: DONE.
  - Key files: `.agents/plugins/codex-cache/`.
- **2026-09-18 — QC-MIDPOINT-REWRITE-001 / إعادة كتابة التقرير والخطة**
  - Changed: clearer bilingual reports;15 independently copyable prompts with objective, dependencies, work, acceptance and handoff; separated editorial HEAD from evidence SHA.
  - Evidence:36 sections/80 matching domain rows; all15 clipboard/Copied checks and copy-failure recovery PASS;320/768/1440 light/dark overflow checks PASS. No application tests rerun.
  - State: DONE (editorial scope); historical release decision unchanged.
- **2026-09-18 — QC-MIDPOINT-REBASE-001 / Evidence rebase and adaptive plan**
  - Changed: refreshed existing bilingual80-domain reports and15-prompt HTML; compressed duplicated historical context, archives unchanged.
  - Evidence: local PG suites and authorized owner reads; independent arithmetic/bilingual review and pack UI PASS;46.7% overall/5.3% production gate completion/NO-GO.
  - State: PARTIAL — external/human and exhaustive manual coverage open; closure tasks not executed.
  - Key files: audit/2026-09-18-ULTIMATE-COMPREHENSIVE-SYSTEM-AUDIT{,-AR}.md, audit/QC-Remaining-to-100-Percent-Prompts-Interactive.html.

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-004 / Task 3 — Reject checkpoint order gating)

> نُقلت هنا أقدم سجلات `2026-09-18` (QC-CLOSURE-005 وQC-CLOSURE-001) بعد التحقق من أن محتواها أما زال مرجعًا في أقسام الحالة الحالية (`Key files`/disposable PostgreSQL) وإما صار موثّقًا في قسم المشاكل المفتوحة. لم تُنقل أي قرارات أو invariants أو blockers ما زالت سارية.

## [2026-09-18] — QC-CLOSURE-005 / PostgreSQL, migrations, transactions & integrity
- Changed: added `scripts/db/disposable-postgres.sh` (approved equivalent disposable PostgreSQL 18 environment for hosts without Docker) and an opt-in `{ tls: true }` mode on the shared test-container helper; fixed two runtime-proven product defects — `PERM-IDN-REVOKE-SESSIONS` had no policy-registry entry (so administrative session revocation was permanently `AUTHZ_DENIED`), and `ApproveReleaseUseCase` evaluated candidate state before idempotency replay (so retrying a committed approval failed with `DOMAIN_INVALID_TRANSITION` instead of replaying); replaced drifted hard-coded migration counts with expectations derived from `loadMigrations()`; corrected test-harness defects (container bypassing `QC_TEST_DATABASE_URL`, TLS-requiring operator script fed a non-TLS URL, Kysely `destroy()` ending the suite-owned pool); added two injected-failure atomicity proofs (release approval and role grant leave no half-committed state).
- Evidence: empty PG 18.6 → `0001…0024`, `pending []`, schema check 24/70/0 orphans; integration 80 files / 314 PASS (was 6 failed files), migrations 6 files / 22 PASS (was 3 failed), concurrency 12 PASS; static gates and `build` PASS. Details in `audit/2026-09-18-qc-closure-005-postgres-runtime-integrity.md`.
- State: PARTIAL — Docker/Testcontainers image path, authenticated E2E, UAT, CI and provider evidence remain unexecuted; Node 22 is outside contract.
- Key files: `scripts/db/disposable-postgres.sh`, `src/shared/authorization/policy-registry.ts`, `src/modules/release-governance/{ports/repository.ts,application/approve-release.ts,infrastructure/postgres-repository.ts}`, `tests/helpers/postgres-container.ts`.

## [2026-09-18] — QC-CLOSURE-001 / baseline, CI, and repository hygiene
- Changed: removed four tracked `.DS_Store` files; applied canonical Prettier output; removed two unused assignments/imports that made ESLint fail; added the required Git whitespace gate to canonical CI.
- Evidence: frozen install, format, lint, typecheck, architecture, tech-debt, unit `75/485`, build, release identity/verification, and both diff checks PASS; no tracked `.DS_Store` remains. Exact-head GitHub CI run `35284944134` has zero steps because the account is billing-locked.
- State: PARTIAL / BLOCKED (local repository defects closed; Node 22 mismatch, Docker-backed suites, authenticated E2E, and remote CI cannot be closed locally).

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-017 / Dashboard command center)

> نُقلت هنا أقدم سجلات `2026-09-17` بعد أن صارت حالتها التاريخية ممثّلة في أقسام الحالة الحالية (`Current State`, `الهوية والتفويض`). لم تُنقل أي invariants أو قرارات أو blockers ما زالت سارية.

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

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-005 follow-up / Quarantine KPI alignment)

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

## Rollover from 01 — 2026-09-19 (QC-100-FINAL-016 remediation)

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

## Rollover from 01 — 2026-09-18 (QC-100-FINAL-016)

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

## Rollover from 01 — 2026-09-18 (QC-YAZEED-CONTROL-CENTER-001)

- **[2026-09-10] — إعداد سيناريوهات UX وخطة اختبار قابلية الاستخدام بدون ادعاءات بحثية** — صارت خطة الاختبار والسيناريوهات جاهزة للتنفيذ على بيانات synthetic، مع منع ترقية فرضيات UX إلى findings قبل وجود ملاحظة أو قياس صالح.
- **[2026-09-10] — إكمال ربط handoffs والـtimelines لكل المساحات المطلوبة** — اكتمل ربط عقد handoff مع كل المساحات المطلوبة، وصارت الانتقالات والانتظار والمالك والأدلة أوضح، مع بقاء الملكية والتفويض والتاريخ المضبوط كما هي.
- **[2026-09-10] — تنفيذ أولي لعقد handoff وJourney Context على الأسطح التشغيلية** — صار عقد handoff مرئيًا ومستخدمًا فعليًا على أربع مساحات تشغيلية، مع record-level links حيث تتوفر الهوية، وبدون كسر حدود Quarantine/Laboratory/Assets/Audit أو التفويض.
- **[2026-09-10] — خرائط رحلات الخدمة التشغيلية وربط handoffs بين الدومينات** — صار عند المشروع تصور خدمة end-to-end قابل للتنفيذ يوضح الملكية والانتظار والدليل والوجهة التالية، مع الحفاظ على حدود Quarantine/Laboratory/Quality/Approvals/Documents/Assets وAudit/Notifications.
- **[2026-09-10] — تدقيق Motion Design وDigital Art Direction** — الحركة الحالية مناسبة لاتجاه QC الهادئ، والـlogin art منضبط طبيًا، مع debt واضح في layout transition وقياسات أداء حية مطلوبة قبل رفع fidelity.
- **[2026-09-10] — تنفيذ طبقة Product Analytics الخصوصية وربط قياس البحث** — صارت قياسات البحث تمر عبر عقد privacy-safe وoutbox مع اختبارات، بينما التوسع الكامل والمزود الخارجي والبيانات الفعلية ما زالت غير منفذة.
- **[2026-09-10] — رفع Dashboard إلى decision surface صادق بالبيانات** — الداشبورد صار أوضح كواجهة قرار، metadata والـdrill-down وحالات unavailable محروسة، والرسوم غير موجودة عمدًا حتى يوفّر الباكند سلسلة زمنية معرفة.
- **[2026-09-10] — معالجة فجوات الوصول المؤكدة من تدقيق WCAG** — الفجوات المؤكدة في loading/status/forced-colors/notification severity انصلحت ومحروسة، لكن التحقق الحي الكامل لكل route وscreen reader ما زال غير متاح.
- **[2026-09-15] — QC-CLOSURE-TEMPLATES-003: تثبيت سلطة القوالب وإغلاق حفظ السياق التاريخي** — أُغلق انحراف هوية SYSTEM_OWNER في قوالب التفتيش، وصارت قراءات التفتيش تعتمد على snapshot تاريخي يحافظ على نسخة القالب بعد الإيقاف أو الاستبدال، مع إبقاء RD-019 والـSoD العام خارج نطاق الإغلاق.
- **[2026-09-15] — QC-CLOSURE-RELEASE-002: Server-Derived Production Release Evidence** — لا توجد الآن قناة واجهة تجعل browser-controlled PASS أو risk acceptance حقيقة اعتماد؛ أي اعتماد فعلي يحتاج أدلة موثوقة مخزنة ومطابقة لهوية الإصدار.
- **[2026-09-15] — QC-CLOSURE-IDENTITY-001: إغلاق هوية SYSTEM_OWNER وصلاحيات P-05 والإفراج** — لم تعد مسارات P-05 أو Release أو Production Recovery تعتمد على `actor.id` كهوية دخول؛ الحساب المسمى لا ينجح إلا بهوية server-derived مع الدور والحالة الصحيحة.
- **[2026-09-15] — خط أساس الواقع الحالي قبل أي تغيير** — الواقع الحالي لا يبرر ادعاء أن الاختبارات أو lint أو format أو migration runtime كلها ناجحة؛ البناء والـtypecheck والحدود ناجحة فقط ضمن البيئة الحالية.

## Rollover from 01 — 2026-09-18 (QC-CLOSURE-007)

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
## Rollover from 01 — 2026-09-18 (QC-CLOSURE-005)

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
## Rollover from 01 — 2026-09-18

- **[2026-09-09] — إعادة تدقيق واجهة الإنتاج بنسب قابلة لإعادة الحساب** — التقرير صار صادقًا حسابيًا وقابلًا لإعادة الإنتاج، والجولة الحية أكدت الواقع بدل الاعتماد على تقدير؛ الحكم بقي `Needs changes` ولا توجد مطالبة 100% أو Production Ready.
- **[2026-09-09] — دمج خلفية QC ثلاثية الأبعاد في صفحة /login فقط** — خلفية الدخول ثلاثية الأبعاد تعمل على `/login` فقط (desktop وmobile) مع بقاء المصادقة والعزل والتنظيف، وبلا commit أو push.
- **[2026-09-09] — حزمة F-10 وF-11: سياسة ونشر مضبوطة بلا تغيير جاهزية** — الحزمة المضبوطة جاهزة كـ blocker متتبع: الجرد والفصل والرفض موثقة بدليل طازج، ولا مزود اختُرع ولا جاهزية تغيّرت.
- **[2026-09-09] — إصلاح F-07: توحيد استعلام التدقيق بين Dashboard و/audit** — السطحان يقرآن الآن نفس العقد المعتمد بترتيب وmapping وترقيم موحد، وحدث GRANT المؤهل يظهر متطابقًا عليهما لنفس الفاعل المخوّل، مع بقاء حماية عدم التسريب وبلا payload/أسرار.
- **[2026-09-10] — استكمال برومبتات الوصول المثبت إلى 100% في تدقيق الإنتاج** — التقرير يغطي الآن كامل مسار جعل المقاييس الأربعة 100% بشكل قابل للإثبات، لكنه ما يدّعي تحققها قبل التنفيذ والنشر والفحص الحي.
- **[2026-09-10] — استمرار تنفيذ F-11: تشغيل النسخ المحلي وتوثيق RPO/RTO** — زادت تغطية التنفيذ المحلي والتوثيق والواجهة، لكن F-11 ما زال `OPEN / PARTIAL` لأن catalog wiring الكامل، restore drill المعزول، وartifact حي بنفس deployed release لم تُثبت بعد.
- **[2026-09-10] — تنفيذ Prompt 3 (F-10): دورة حياة قوالب الحجر بسياسة P-06** — دورة حياة القوالب كاملة بسياسة P-06 ومحروسة بالاختبارات السالبة/الموجبة وSoD والتزامن، لكن F-10 يبقى OPEN حتى دليل حي على نفس الـbuild المنشور.
- **[2026-09-10] — تنفيذ Prompt 2: مسار سياقي مصرح به لإنشاء Change Request (DOCUMENT_VERSION)** — فورم Change Request صار سياقيًا مصرحًا بلا UUID/JSON ظاهرين، والقيم الحرجة تُشتق خادميًا مع فحص تزامن ذري، والقائمة المسموحة محروسة من المسارين الخام والسياقي.
- **[2026-09-10] — تنفيذ BI-01: عزل خلفية درج الجوال في AppLayout** — عزل الدرج مطبق ومغطى ومثبت سلوكيًا على البناء المحلي، لكن الإغلاق الحي للإيجاد (C-09 على الإنتاج) ما زال `NOT VERIFIED` — يحتاج fixture مصادقة وbuild منشور.
- **[2026-09-10] — تثبيت قرارات السياسة داخل تقرير التدقيق كبرومبتات فقط** — التقرير صار يحتوي القرارات النهائية وبرومبتات تنفيذية دقيقة بدون تطبيق تغييرات على النظام، وبقيت النسب كما هي لأنها ما زالت مرتبطة بأدلة التنفيذ الحقيقية.

- **[2026-09-09] — اعتماد القراءة العامة وحصرية صحة النظام وإدارة الأعضاء** — أصبحت سياسة الوثائق واضحة: قراءة تشغيلية عامة لكل الأعضاء، مع بقاء الأفعال الحساسة مفوضة، وحصرية صحة النظام وإدارة الأعضاء لـ`yazeed`.
- **[2026-09-09] — تدقيق إنتاجي شامل للواجهة والتدفقات بحساب yazeed** — الوصول الأساسي قوي، لكن النتيجة الإجمالية 68% مع خمس مشكلات عالية تمنع اعتماد الواجهة كتجربة تشغيلية مكتملة.
- **[2026-09-09] — تفعيل SYSTEM_OWNER لحساب yazeed على إنتاج Render** — حساب yazeed يملك الآن `SYSTEM_OWNER` وكل الصلاحيات النشطة بنطاق GLOBAL، والصفحات الأربع التي كانت مفقودة أصبحت ظاهرة وقابلة للفتح على الإنتاج.
- **[2026-09-09] — استثناء yazeed كمالك نظام بصلاحيات كاملة** — أصبح هناك مسار صريح وحصري يمنح yazeed كل permissions والصفحات عبر `SYSTEM_OWNER`. يلزم نشر النسخة ثم تشغيل الأمر على قاعدة الإنتاج حتى يصبح الحساب فعليًا كامل الصلاحيات.
- **[2026-09-09] — إصلاح F-12: واجهة إنجليزية فقط + مفردات sentence-case موحدة** — الواجهة الآن إنجليزية فقط بمفردات جملة موحدة ومحروسة، مع بقاء semantics المضبوطة والمصطلحات العلمية كما اعتُمدت.
- **[2026-09-09] — إصلاح F-03: إغلاق التمدد الأفقي عند 320px و200% زوم (LTR/RTL)** — التمدد الأفقي على مستوى الصفحة مغلق بالتوكنز القائمة مع درج ميسّر، والحراسة الآلية تمنع الانتكاس، لكن تشغيل الـ18 اختبارًا المصادق يحتاج بيئة disposable بصلاحيات مناسبة (وصحة النظام تحتاج مالك SYSTEM_OWNER).
- **[2026-09-09] — إصلاح F-04 وF-05: POST baseline لكل فورمات الإنشاء التسعة** — الفورمات التسعة تعمل الآن بلا JavaScript عبر POST حقيقي مع أخطاء مرئية وقيم محفوظة واسترداد، وJS تحسين اختياري، مع تغطية unit وعقود وE2E gated.
- **[2026-09-09] — إظهار صفحة Tasks وبياناتها لكل الأعضاء النشطين** — صفحة Tasks وبياناتها صارت ظاهرة لكل الأعضاء النشطين، بينما الإنشاء والتعديل وتغييرات الحالة ما زالت محكومة بالصلاحيات.
- **[2026-09-09] — تنفيذ F-02: مساحة Administration المضبوطة (/admin × 8 مسارات)** — مساحة الإدارة الثمانية تعمل بإنكار افتراضي ومنح صريح، مع رفض Admin-بلا-صلاحية وظهور SYSTEM_OWNER مثبتًا بالاختبارات، وكل الكتابات مدققة ومبنية على النسخة مع إبطال الجلسات.
- **[2026-09-09] — إصلاح F-01: توحيد فحص جاهزية قاعدة البيانات بين System Health وready** — الواجهتان تستهلكان الآن نفس فحص الجاهزية وإعداد TLS، وتتفقان في الحالات الثلاث مع مخرجات منقّحة مثبتة بالاختبارات والدخان الإنتاجي.
- **[2026-09-09] — توسيع وصول Administration لـAdmin وyazeed** — Admin و`yazeed` صاروا مخولين لمساحة Administration، وصحة النظام بقيت مقصورة على `yazeed`.
- **[2026-09-09] — تعريب تقرير تدقيق واجهة الإنتاج** — التقرير الآن بالعربي مع إبقاء البرومبتات التنفيذية بالإنجليزي.

## [2026-09-09] — إصلاح ظهور قائمة yazeed وربطها بالصلاحيات القانونية

### تم التنفيذ
- صححت قائمة التنقل لتستخدم رموز الصلاحيات canonical بدل الرموز القديمة أو غير الموجودة (`PERM-TASK-VIEW`, `PERM-QUAR-VIEW`, `PERM-EQP-VIEW`, `PERM-MNT-VIEW`, `PERM-APR-VIEW-ASSIGNED`, `PERM-CHG-VIEW`).
- دعمت عنصر Dashboard بأحد صلاحياته الثلاث (`VIEW` أو `MANAGEMENT` أو `ADMIN`) بدل ربطه بصلاحية واحدة فقط.
- استبدلت رابط `/administration` غير الموجود بصفحة التدقيق الفعلية، وأضفت روابط الصفحات الموجودة التي يملك Admin سماحها الصريح: المستندات، التنبيهات، البحث، والحساب.
- أضفت `PERM-DASH-ADMIN` إلى grants دور `ADMIN` لأنها `ALLOW` صريحة في مصفوفة الصلاحيات؛ لم أضف صلاحيات `POLICY` أو `DENY` مثل الإفراج والاعتماد والتوقيع.
- أضفت اختبار سلامة للقائمة يثبت أن كل capability canonical وكل href يشير إلى صفحة موجودة، وأن ADMIN يرى الصفحات المسموحة له فقط.

### الملفات المتأثرة
- `src/ui/navigation/navigation.ts`
- `db/seeds/common.ts`
- `tests/unit/ui/master-016.test.ts`
- `tests/unit/ui/navigation-permissions.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm typecheck` ✅ — لا أخطاء، مع تحذيرين deprecated سابقين في Zod.
- `pnpm lint` ✅
- `pnpm format:check` ✅
- `pnpm test:unit` ✅ — 32 ملفًا / 130 اختبارًا.
- `pnpm build` ✅ — نفس تحذيرات bundle السابقة فقط.
- `git diff --check` ✅

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** النسخة المحلية تعرض لـAdmin Dashboard والصفحات ذات السماح الصريح وتمنع الروابط الوهمية. يلزم نشر التغييرات وتشغيل `pnpm db:seed:foundation` على قاعدة الإنتاج حتى تصل إضافة `PERM-DASH-ADMIN` للحساب الحالي.

### ملاحظات / مشاكل مفتوحة
- الأقسام التشغيلية التي لا يملك Admin لها `ALLOW` صريحًا في Foundation ستبقى مخفية/مرفوضة حتى اعتماد سياسة ومنح permission/scopes مناسبة؛ لا يجوز فتحها تلقائيًا عبر Admin bypass.
- لم يُنفذ deploy أو تعديل مباشر لقاعدة الإنتاج، ولا commit أو push.

## [2026-09-08] — إصلاح 500 تسجيل الدخول في SSR: تعارض Zod 3 وZod 4

### تم التنفيذ
- فحصت Chrome على الإنتاج للمرجع `req_01a0821f-81bd-7635-aa7d-b68611cf807f`: POST login رجع 302 ثم GET login رجع 500؛ حمولة نتيجة Astro حملت `Right-hand side of 'instanceof' is not an object` ولم تُصدر كوكي جلسة. لم أطبع بيانات النموذج أو أسراره.
- ثبتّ السبب في artifact المبني: Astro 4 يستخدم `ZodEffects/ZodPipeline` من Zod 3، لكن external bare import لـ`zod` يُحل وقت التشغيل إلى Zod 4 المباشر للمشروع حيث constructors غير موجودة؛ لذلك يفشل قبل handler حتى مع نموذج فارغ.
- أضفت `vite.ssr.noExternal: ['zod']` إلى إعداد Astro لحفظ نسخ الاعتمادية الصحيحة داخل الحزمة؛ لا downgrade أو lockfile أو تغيير صلاحيات/TLS أو business rules.
- أضفت اختبارات HTTP/متصفح للنسخة المبنية: النموذج الفارغ يعطي validation 400 بعد POST/redirect، والإرسال الفعلي ببيانات وهمية يبقى في login برسالة آمنة بدون 500 عند غياب إعداد قاعدة محلي.
- صححت استنتاج التشخيص السابق: إصلاح `instanceof ActionError` المحلي وحده لا يغلق العطل؛ dev/Vitest لا يكشفان مشكلة SSR externalization التي ثبتت هنا.

### الملفات المتأثرة
- `astro.config.mjs`
- `tests/e2e/login-form-runtime.spec.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- على Node `24.20.0`: build قبل التعديل ✅، ثم اختبار regression ❌ أعاد نفس خطأ الإنتاج 500 حرفيًا.
- build بعد الإصلاح ✅؛ نفس الاختبار ✅ status 400 بدل 500، وحزمة Playwright الجديدة ✅ اختباران على standalone artifact محلي.
- `pnpm typecheck` ✅ — 0 errors، 26 hints سابقة.
- `pnpm lint` ✅، `pnpm test:unit` ✅ — 31 ملفًا / 127 اختبارًا، وفحص تنسيق الملفات المعدلة ✅.
- بقي warning سابق `Writable` وتحذيران من تعليقات PURE في Zod أثناء bundle؛ البناء ناجح.

### النتيجة
- **الحالة:** نجح محليًا؛ الإنتاج ينتظر نشر المستخدم.
- **مختصر:** عطل parsing في SSR مُعاد إنتاجه ومصلح بدليل RED→GREEN؛ نجاح الدخول بحساب فعلي على النسخة المصححة في الإنتاج لم يُختبر بعد.

### ملاحظات / مشاكل مفتوحة
- Chrome كشف أيضًا أن CSP يمنع تشغيل WASM لخلفية Lottie؛ مشكلة منفصلة عن 500 ولم تُخفف السياسة ضمن إصلاح الدخول.
- لا استخدام لأسرار الصورة، ولا اتصال محلي بقاعدة الإنتاج، ولا commit أو push أو deploy.

## [2026-09-08] — متابعة بلاغ 500 بعد تغيير DATABASE_URL: الجاهزية عادت

### تم التنفيذ
- أعدت فحص `/api/health/ready` حيًا بعد إفادة المستخدم أن المشكلة مستمرة؛ رجع `200 {"status":"healthy"}` بدل 503 السابقة.
- راجعت إعداد TLS في `src/shared/database/pool.ts`؛ لم أعدّل إعداد الاتصال أو أخفف التحقق من الشهادة.
- فصلت تعافي فحص اتصال قاعدة البيانات عن خطأ المستخدم المستمر؛ نجاح readiness لا يثبت نجاح تسجيل الدخول أو الطلب ذي الجلسة.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- GET readiness على الإنتاج ✅ — HTTP 200، healthy.
- اختبارات التطبيق لم تُشغّل: لا تغيير في الكود، ولا سجلات Runtime متاحة للطلب الفاشل.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** فشل الجاهزية السابق لم يعد قائمًا وقت الفحص؛ خطأ المستخدم ما زال غير مشخص دون تحديد الخطوة الحالية ومرجع جديد.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy أو استخدام للأسرار المكشوفة بالصورة.

## [2026-09-08] — تشخيص بلاغ 500 على الصفحة الرئيسية: الجاهزية الإنتاجية غير سليمة

### تم التنفيذ
- فحصت الموقع الحي قراءة فقط بعد بلاغ `req_01a081b0-85b1-7b31-a24f-205872b5e7aa`؛ طلب الصفحة الرئيسية بدون جلسة انتهى إلى `/login?returnTo=%2F` بحالة 200.
- تحققت من `/api/health/live`: حالة 200 و`healthy`، ومن `/api/health/ready`: حالة 503 و`unhealthy`؛ الخدمة حية لكن فحص الجاهزية يفشل.
- راجعت مسارات root/login/dashboard والميدلوير وفحص PostgreSQL ودليل الحوادث؛ 503 وحده لا يثبت سبب قاعدة البيانات التفصيلي أو علاقته بخطأ الطلب المحدد.
- تحققت من وجود إصلاح Astro Action السابق في HEAD المحلي `f072348`؛ لم أثبت SHA المنشور ولم أغير كود التطبيق أو إعدادات الإنتاج.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- HTTP GET حي بدون جلسة ✅ — root → login 200، live 200، ready 503.
- البحث المحلي عن مرجع الطلب لم يجد سجلًا مطابقًا؛ لا أداة Render logs متصلة، والوصول لسفاري غير متاح بسبب صلاحيات Computer Use.
- build/tests لم تُشغّل: تشخيص قراءة فقط دون تغيير سلوك التطبيق.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** ثبت فشل الجاهزية الحالي، لكن خطأ 500 المحدد لم يُعد إنتاجه والسبب الجذري يحتاج سجل Render المرتبط بمرجع الطلب؛ لا ادعاء إصلاح أو تعافي.

### ملاحظات / مشاكل مفتوحة
- يلزم سجل الخطأ المعقّم من Render، وهوية الإصدار المنشور، وفحص إعداد/اتصال PostgreSQL عبر مسار المشغّل المعتمد.
- لا commit أو push أو deploy أو كتابة على قاعدة الإنتاج.

## [2026-09-08] — QC-AUTH-LOGIN-500-002: إصلاح انهيار Astro Action في مسار الدخول

### تم التنفيذ
- أعدت إنتاج 500 محليًا على طلب Astro الحقيقي `POST /login?_astroAction=login`؛ الـpayload الداخلي كشف الخطأ `Right-hand side of 'instanceof' is not an object` بدل خطأ بيانات دخول آمن.
- ثبتّ السبب الجذري في `src/actions/auth.ts`: شرط `error instanceof ActionError` يعتمد على runtime constructor غير موثوق بعد SSR bundling في Astro 4، فكان مسار معالجة الخطأ نفسه ينهار.
- أضفت فحصًا structural آمنًا لـAstro Action errors في `src/shared/errors/action-error.ts`، واستبدلت شرط `instanceof` في login فقط بدون تعطيل المصادقة أو الصلاحيات.
- أضفت regression contract يثبت قبول شكل Astro Action error ورفض Error عادي أو payload ناقص.
- اختبرت POST ثم GET المتبوع محليًا مع قاعدة غير متاحة: النتيجة صارت رجوعًا لصفحة الدخول بحالة `400` ورسالة عامة، وسجل الخادم كتب `auth.login.failure` مع `requestId`؛ لم يعد fallback 500 يظهر.

### الملفات المتأثرة
- `src/actions/auth.ts`
- `src/shared/errors/action-error.ts`
- `tests/integration/actions/auth-actions.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm typecheck` ✅ — 0 أخطاء، 26 hints deprecated/legacy.
- `pnpm lint` ✅.
- `pnpm format:check` ✅.
- `pnpm test:unit` ✅ — 31 ملفًا / 127 اختبارًا.
- `pnpm test:architecture` ✅.
- `pnpm build` ✅ — مع warning سابق عن `Writable` غير مستخدم.
- اختبارات auth المركزة ✅ — 3 ملفات / 4 اختبارات.
- فحص HTTP محلي Astro dev ✅ — `GET /login` 200، POST الفاشل 302، والطلب المتبوع رجع login بحالة 400 بدون صفحة 500.
- جهزت PostgreSQL 18 disposable مع TLS مؤقت، طبقت migrations `18/18` وFoundation seed وأنشأت حساب `login-e2e` مؤقتًا؛ الحاوية والشهادة حُذفتا بعد الاختبار.
- شغلت رحلة متصفح كاملة على نفس قاعدة الاختبار: دخول خاطئ برسالة آمنة، دخول صحيح إلى Dashboard، refresh مع بقاء الجلسة، صفحة محمية، logout، رفض الوصول بعد logout، ومنع `returnTo` الخارجي؛ النتيجة `LOGIN_E2E_PASS`.

### النتيجة
- **الحالة:** نجح محليًا.
- **مختصر:** أُصلح السبب الجذري لمسار 500، وثبتت رحلة الدخول الكاملة محليًا على PostgreSQL 18 disposable مع بقاء الحماية والتحويل الداخلي والـlogout سليمة.

### ملاحظات / مشاكل مفتوحة
- Node المحلي `22.23.1` خارج عقد المشروع `>=24.20.0 <25`؛ build/typecheck مرّا لكن الدليل محلي فقط.
- لم يُختبر deploy الإنتاج أو request reference المقدم على production؛ يلزم نشر الإصلاح عبر مسار النشر المعتمد ثم إعادة smoke test هناك.
- لا commit أو push أو deploy أو production mutation.

## [2026-09-08] — QC-AUTH-LOGIN-REDIRECT-RATE-LIMIT-001: Login redirect and rate-limit diagnosis (partial / production blocked)

### تم التنفيذ
- جمّدت الواقع على `1ea19f6` (main، شجرة نظيفة قبل التعديل) وثبّتُّ Node `24.20.0` محليًا؛ لا commit/push/deploy أو production mutation.
- تحققت قراءة فقط من الإنتاج: `GET /login` يرجع 200 ونموذج Astro الحقيقي يرسل `POST /login?_astroAction=login`؛ `/live` 200 لكن `/ready` 503 مع requestId، لذلك readiness الخاصة بقاعدة البيانات غير متاحة.
- أثبتت جذري UX: middleware كان يقطع POST قبل Astro Action ويرجع raw `429 problem+json`، ونجاح Action يعيد `redirectTo` لا تستهلكه صفحة login.
- فرّقت قرار RateLimiter إلى `ALLOWED`/`THROTTLED`/`STORE_UNAVAILABLE` مع fail-closed ثابت، ونقلت limiter الحقيقي إلى Action حتى تعود أخطاء المتصفح لصفحة login؛ أضفت redirect آمن 303 بعد نجاح نتيجة Action ونسخ عربية/إنجليزية للـthrottle/unavailable.
- أنشأت دليل إغلاق صريح يفصل المثبت من المشتبه: 503 الجاهزية متسق مع تعطل store لكنه لا يثبت سبب PostgreSQL المحدد بدون read-only operator access.

### الملفات المتأثرة
- `src/actions/auth.ts`
- `src/middleware.ts`
- `src/pages/login.astro`
- `src/shared/security/rate-limit.ts`
- `tests/integration/security/rate-limit.test.ts`
- `audit/100-percent/LOGIN-AUTH-REDIRECT-RATE-LIMIT-CLOSURE.md`

### التحقق
- TDD: RED للـoutcome الجديد ثم focused GREEN ‏7/7 ✅
- `pnpm typecheck` ✅ (0 errors)، `pnpm lint` ✅، `pnpm format:check` ✅، `pnpm test:architecture` ✅، `pnpm test:unit` ✅ (31/127)، `pnpm build` ✅
- `pnpm test:security` ❌: 43 passed و1 skipped لكن PostgreSQL 18 Testcontainers لم يبدأ لغياب container runtime؛ E2E وDB integration وproduction login غير منفذة، ولا تعامل كنجاح.

### النتيجة
- **الحالة:** جزئي / محجوب.
- **مختصر:** أصل مشكلة JSON الخام والتحويل غير الحتمي مغطى محليًا، لكن إثبات store/identity/config/proxy والإنتاج منتهيًا يحتاج اعتماد Render read-only وPostgreSQL 18/Playwright وdeploy مراقب.

### ملاحظات / مشاكل مفتوحة
- لا يجوز اعتبار 503 readiness سبب limiter النهائي دون فحص read-only؛ لا `admin` ولا `yazeed` تم التحقق منهما ولا توجد قيم production threshold مطبوعة أو مخترعة.

## [2026-09-08] — QC-100-CLOSURE-10: Independent Final 100-Domain Closure Re-Audit (NOT YET 100/100, mean 50.30)

### تم التنفيذ
- جمدت الواقع طازجًا على `ebafae1` (`main`، شجرة نظيفة، Node `v22.22.3` خارج العقد، pnpm `11.25.0`) بدون إعادة استخدام أي SHA قديم، وأعدت حساب هوية الإصدار (`rel-2fb6cb8d510a5bb9` + `release:verify` true).
- أعدت تشغيل البوابات طازجة على نفس الـHEAD: format ✅ وlint ✅ وtypecheck ✅ (0/0/25 hints) وarchitecture ✅ وunit ✅ (31 ملف/127 اختبارًا) وbuild ✅، والـAI المركزة ✅ (3/39 including 429→UNAVAILABLE)، والـboundary scan صفر matches.
- جلبت دليل CI طازجًا لنفس الـHEAD: run `34201628961` الـVerify صفر steps مع نص billing-lock حرفيًا — السبب الخارجي أُعيد إثباته، مو مُعاد تدويره.
- فحصت الإنتاج قراءة فقط: `/live` صار 200 JSON مع headers كاملة (إصلاح CLOSURE-05 منتشر فعليًا)، وباقي الأسطح 503 fail-closed مصمم بدون تسريب؛ الـdeployed SHA ما زال غير مربوط.
- أعدت تدقيق الـ100 domain من الأدلة الحالية فقط (المجموع `5030` والمتوسط `50.30`): رفعت 11 صفًا بأدلة (11/27/34/39 إلى PARTIAL، و19/30/31/80 و98/99/100)، وأبقيت 13 على FAIL؛ وأنشأت ملفات `CLOSURE-FINAL-*` الأربعة.
- حدثت المخاطر: R-010 أُغلق (المنهجية)، R-003 تضيق (static-complete)، PROD-05-A انحل عند liveness؛ الباقي OPEN بأدلة طازجة + 5 remediation prompts للمالك/المشغل.

### الملفات المتأثرة
- `audit/100-percent/CLOSURE-FINAL-100-DOMAIN-AUDIT.md` (جديد)
- `audit/100-percent/CLOSURE-FINAL-EVIDENCE-INDEX.md` (جديد)
- `audit/100-percent/CLOSURE-FINAL-RISK-REGISTER.md` (جديد)
- `audit/100-percent/CLOSURE-FINAL-PRODUCTION-DECISION.md` (جديد)

### التحقق
- `pnpm format:check` ✅، `pnpm lint` ✅ exit 0، `pnpm typecheck` ✅، `pnpm test:architecture` ✅، `pnpm test:unit` ✅ 31/127، AI ‏3/39 ✅، `pnpm build` ✅، `release:verify` ✅، `git diff --check` ✅
- DB/E2E محليًا BLOCKED (لا Docker ولا Playwright ولا DATABASE_URL)؛ recovery checklist يرفض PASS بدون manifest (fail-safe ✅)
- مهارات: `verification-before-completion` مطبقة؛ لا توجد مهارة محلية systematic-debugging/TDD فطُبق انضباطهما يدويًا (لا تغيير سلوكي = لا دورة TDD)

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** إعادة تدقيق مستقلة مكتملة بأدلة طازجة على `ebafae1` والقرار `NOT YET 100/100` بمتوسط `50.30/100`؛ لا commit أو push أو deploy أو production mutation.

### ملاحظات / مشاكل مفتوحة
- R-001 (شق الإنتاج/exact-HEAD)، R-002 (النصف المصادق)، R-003 (إثبات CI)، R-004 (billing خارجي)، R-005، R-006 (شق المزود)، R-007، R-008 (شق المزود/المراجعين)، R-009 تبقى OPEN.
- ملفات المهمة الأربع untracked بانتظار commit المستخدم؛ ملاحظة: `audit/prompt4.md` محذوف ضمن commit سابق `ebafae1` (102 سطر) — يحتاج مراجعة المستخدم.

## [2026-09-08] — QC-100-CLOSURE-09: AI Advisory Runtime Verification, 429 Case + Scope Statement (R-008 stays OPEN)

### تم التنفيذ
- أعدت حساب الـHEAD طازجًا (`a5ca2b0` على `main`، شجرة نظيفة) بدل إعادة استخدام SHA التقارير القديمة، وثبتُّ أن `a5ca2b0` مجرد commit لشغل CLOSURE-07/08 السابق.
- شغلت حزمة AI المركزة طازجة قبل التغيير: `3 ملفات / 38 اختبارًا` كلها خضراء على نفس الـHEAD.
- أضفت حالة `rate-limited` الحتمية عبر TDD (فرع fake-provider متاح-ثم-429 + حالة dataset → `UNAVAILABLE` معقّم): خضراء من أول تشغيل لأن مسار التدهور catch-all كان موجودًا — الاختبار يثبّت مسار 429 لا يخترع سلوكًا؛ الـdataset صار 15 حالة.
- أنشأت `QC-100-CLOSURE-09-AI-RUNTIME-STATEMENT.md`: المزود الحي NOT APPLICABLE لهذا الإصدار (لا عقد/SDK/أسرار/`process.env` — مسح صفر)، `DisabledAiProvider` محفوظ، 7 ثوابت حرجة مربوطة بـfile:line، تغطية الأبعاد الـ14 المطلوبة، مسار HITL (توسيم + نسخ/مسودة فقط)، ووضع المراقبة (لا تسجيل prompts، عدّادات §46 متروكة عمدًا بلا مزود).
- حدثت `FINAL-EVIDENCE-INDEX.md` (C-31/C-32) و`FINAL-OPEN-RISKS.md` (دلتا R-008: مضيّق بدون إغلاق).

### الملفات المتأثرة
- `audit/100-percent/QC-100-CLOSURE-09-AI-RUNTIME-STATEMENT.md` (جديد)
- `audit/100-percent/ai-evals/deterministic-eval-dataset.json` (14 → 15 حالة)
- `tests/integration/ai-advisory/evals.test.ts` (فرع `rate-limited` + عدّ 15)
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md` (C-31 وC-32)
- `audit/100-percent/FINAL-OPEN-RISKS.md` (دلتا R-008)

### التحقق
- حزمة AI المركزة ✅ — 3 ملفات / 39 اختبارًا (38 سابقة + 1 جديدة)
- `pnpm format:check` ✅، `pnpm lint` ✅ exit 0، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة)
- `pnpm test:unit` ✅ — 31 ملفًا / 127 اختبارًا (بدون تغيير: evals تكاملية)
- `pnpm test:architecture` ✅، `git diff --check` ✅، ومسح الأسرار/DB-writes على مسار AI صفر ✅
- Node ‏`v22.22.3`‏ خارج العقد `>=24.20.0 <25` — النتائج محلية فقط؛ `pnpm build` لم يُشغّل (لا تغيير في `src/`)
- مهارات: `verification-before-completion` و`using-superpowers` مقروءة ومطبقة؛ لا توجد مهارة محلية باسم systematic-debugging/TDD فطُبق انضباطهما يدويًا

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** حدّ الـadvisory والتدهور والـHITL مثبتة طازجة على `a5ca2b0` مع حالة 429 جديدة، لكن R-008 يبقى مفتوحًا: النصف الحي (عقد مزود + UAT مراجعين) يحتاج اعتماد مالك العمل per PD-31.

### ملاحظات / مشاكل مفتوحة
- R-001 (شق الإنتاج)، R-002 (النصف المصادق)، R-003 (إثبات CI)، R-004، R-005، R-006 (شق المزود)، R-007، R-009، R-010 تبقى OPEN.
- لا commit أو push أو deploy أو production mutation؛ ملفات المهمة في الـworking tree بانتظار commit المستخدم.

## [2026-09-08] — QC-100-CLOSURE-08: Controlled Policy Decision Register + Fail-Closed Proof (R-007 stays OPEN)

### تم التنفيذ
- أنشأت `audit/100-percent/CONTROLLED-POLICY-DECISION-REGISTER.md` يوثق PD-01–PD-37 (حدود علمية، criteria، طرق فحص، precision/rounding، retest، release/approval/SoD، effective-date، retention/archival، RPO/RTO، escalation، master data، AI، e-signature، audit integrity) — كل بند OPEN مع سلوكه الحالي file:line والمُعتمِد المطلوب، بدون اختراع أي قيمة.
- طبقت TDD لاختبار fail-closed: `tests/unit/policy/controlled-policy-fail-closed.test.ts` بدأ RED (1 failed / 9 passed بسبب test-double يرجع الأصل بدل المُنشأ) ثم GREEN بعد إصلاح الـdouble — يثبت DENY الافتراضي لاعتماد المختبر/retest/release/اعتماد الفحص/supersede/التقييم العلمي وحفظ الخام كنص دقيق.
- تحققت من عدم وجود حذف تلقائي (لا cron/purge؛ كل `deleteFrom` داخل معاملات المسودات فقط) ولا escalation تلقائي ولا RPO/RTO مخترعة، وسجلت ذلك في PD-24/PD-26–PD-29.
- حدثت `FINAL-EVIDENCE-INDEX.md` (C-29/C-30) و`FINAL-OPEN-RISKS.md` (دلتا R-007: مضيّق بدون إغلاق)؛ R-007 يُغلق فقط بمصادر معتمدة + تنفيذ + اختبارات سالبة/موجبة على نفس الـHEAD.

### الملفات المتأثرة
- `audit/100-percent/CONTROLLED-POLICY-DECISION-REGISTER.md` (جديد)
- `tests/unit/policy/controlled-policy-fail-closed.test.ts` (جديد، 10 اختبارات)
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md` (C-29 وC-30)
- `audit/100-percent/FINAL-OPEN-RISKS.md` (دلتا R-007)

### التحقق
- الاختبار الجديد أول تشغيل RED ثم ✅ 10/10 بعد إصلاح الـdouble (التنفيذ كان fail-closed أصلًا)
- `pnpm format:check` ✅، `pnpm lint` ✅ exit 0، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة)
- `pnpm test:unit` ✅ — 31 ملفًا / 127 اختبارًا (117 سابقة + 10 جديدة)
- `pnpm test:architecture` ✅، `git diff --check` ✅، ومسح الأسرار على الملفات الجديدة صفر قيم ✅
- Node ‏`v22.22.3`‏ خارج العقد `>=24.20.0 <25` — النتائج محلية فقط؛ HEAD ‏`06b14cf`‏ على ‏`main`‏ (أُعيد حسابه طازجًا)

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** كل قرارات السياسة المعلقة صارت متتبعة بدليل fail-closed تنفيذي لست بوابات حرجة، لكن R-007 يبقى مفتوحًا: لا بند يُغلق بدون مصدر معتمد فعلي من QC/QMS.

### ملاحظات / مشاكل مفتوحة
- R-001 (شق الإنتاج)، R-002 (النصف المصادق)، R-003 (إثبات CI)، R-004، R-005، R-006 (شق المزود)، R-008–R-010 تبقى OPEN.
- لا commit أو push أو deploy أو production mutation؛ ملفات المهمة السابقة ما زالت في الـworking tree بانتظار commit المستخدم.

## [2026-09-08] — QC-100-CLOSURE-07: Isolated Logical Restore Drill (real backup+restore, provider/PITR stay BLOCKED)

### تم التنفيذ
- نفذت drill استعادة معزولة حقيقية بدون أي لمس للإنتاج: حاويتا `postgres:18-alpine` disposable (مصدر `:55434` وهدف `:55435`، TLS مؤقت، حُذفتا بعد المهمة)، ترحيل المصدر 18/18 + بذرة foundation + dataset تمثيلي (مستخدمَين، task، receiving بـHOLD/HOLD/unreleased، سلسلة approval وتوقيع، حدثَي audit، جلسة، ملفَّين + evidence link).
- أخذت نسخة `pg_dump -Fc` فعلية (202909 بايت، SHA-256 مسجل، 1s) واستعدتها بـ`pg_restore --clean` على الهدف المعزول (2s، PG 18.6=18.6)؛ وأقلع الإصدار نفسه `rel-2c958fe7b53b3047` ضد الهدف (`/live 200` و`/ready 200 healthy`).
- أصلحت عيبين حقيقيين في `validate-restored-database.ts` كشفهما الـdrill (RED→GREEN على الهدف المستعاد): محاكاة `search_path` الـruntime + فحص الوجود بدل مقارنة نص العرض؛ بدون إضعاف auth/CSP/RBAC.
- سجلت قدرات المزود بصدق: لا database/backup في `render.yaml` ولا Render API → ‏PITR/WAL/cross-region ‏`BLOCKED` غير مدّعاة، وRPO/RTO ‏POLICY-DEPENDENT‏ (قياس فقط بدون مقارنة).
- أنشأت `RESTORE-DRILL-RESULT.md` (الحالة `PARTIAL`: النطاق المنطقي `VERIFIED`، الجاهزية الكاملة مرفوضة حتى دليل المزود) وضيّقت R-006 بدون إغلاق زائف.

### الملفات المتأثرة
- `audit/100-percent/RESTORE-DRILL-RESULT.md` (جديد)
- `scripts/recovery/validate-restored-database.ts`
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md` (C-27 وC-28)
- `audit/100-percent/FINAL-OPEN-RISKS.md` (دلتا R-006)

### التحقق
- فاليديتور حي على الهدف المستعاد ✅ — DB ‏PASS‏ (ليدجر 18/18 + 11 core + 4 history) وملفات ‏PASS‏ (2/2 SHA-256)؛ والسالبية تفشل بأمان ✅ (ناقص/tamper → ‏FAIL‏ exit 1)
- فحوصات موسعة 11/11 ✅ — تطابق 15 جدولًا، فصل HOLD، سلسلة approval، audit IDs، ربط الملفات، 122 FK بصفر يتيم، قراءات حرجة، إبطال الجلسات 1→0، ومراجعة أسرار صفر
- `pnpm format:check` ✅، `pnpm lint` ✅، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة)
- `pnpm test:unit` ✅ — 30 ملفًا / 117 اختبارًا؛ recovery الموجه ✅ 6/6؛ `pnpm test:architecture` ✅
- `pnpm build` ✅، `git diff --check` ✅، ومسح الأسرار على الـdiff صفر ✅
- Node ‏`v24.20.0`‏ + pnpm ‏`11.25.0`‏ داخل العقد؛ HEAD ‏`06b14cf`‏ على ‏`main`‏ والشجرة فيها ملفات المهمة فقط

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** الاستعادة المنطقية المعزولة مثبتة بدليل حقيقي على نفس الـHEAD، لكن R-006 يبقى مفتوحًا (مضيّق): بوابات Render/PITR/WAL/RPO/RTO والمراجعة المستقلة ما زالت BLOCKED.

### ملاحظات / مشاكل مفتوحة
- R-001 (شق الإنتاج)، R-002 (النصف المصادق)، R-003 (إثبات CI)، R-004، R-005، R-007–R-010 تبقى OPEN.
- لا commit أو push أو deploy أو production mutation؛ الحاويات والشهادات المؤقتة أُتلفت.

## [2026-09-08] — QC-100-CLOSURE-06: UAT, Usability and Human Factors Evidence Closure (kit only, no participants)

### تم التنفيذ
- بنيت UAT kit تنفيذي (`QC-100-CLOSURE-06-UAT-KIT.md`): 7 شخصيات (P-EMP/P-INSP/P-LAB/P-SUP/P-MGR/P-ADM/P-AUD بدون بيانات دخول مخترعة)، 14 سيناريو وظيفي (T-UAT-01–14: دخول، عمل مسند، استلام، HOLD، PASS≠RELEASED، مختبر، Finding/NCR/CAPA، اعتماد+SoD، WI/SOP، معايرة، تقارير، تدقيق) بخطوات facilitator مربوطة بمسارات `src/pages/**` الحقيقية، 6 سيناريوهات سلبية Tier-1 (N-UAT-01–06)، و4 سيناريوهات وصولية (A-UAT-01–04: كيبورد/RTL/زوم/تقليل حركة).
- طبقت TDD للفاليديتور: `tests/unit/uat/uat-record-validator.test.ts` فشل RED (6/6، ملف غير موجود) ثم `audit/100-percent/uat/validate-uat-records.mjs` قلبها GREEN (6/6) — يتحقق من الهيدر والـenums وترتيب الوقت وتثبيت الـSHA، والملف الفاضي يرجع `UAT EXECUTION REQUIRED` بصفر جلسات بدل التلفيق.
- تركت كل قوالب الأدلة فاضية عمدًا: `UAT-SESSION-RECORD.csv` (هيدر فقط)، `UAT-DEFECT-BACKLOG.csv` (هيدر فقط)، `UAT-COVERAGE-MATRIX.csv` (24 سيناريو كلها `NOT EXECUTED`)؛ التشغيل الحي للفاليديتور أكد `sessions=0`.
- وثقت C-24–C-26 في `FINAL-EVIDENCE-INDEX.md` ودلتا R-005 في `FINAL-OPEN-RISKS.md` (يبقى OPEN)؛ رجعت حذفًا غير مرتبط في `audit/prompt4.md` بـ`git checkout`.

### الملفات المتأثرة
- `audit/100-percent/QC-100-CLOSURE-06-UAT-KIT.md`
- `audit/100-percent/uat/validate-uat-records.mjs`
- `audit/100-percent/uat/UAT-SESSION-RECORD.csv`
- `audit/100-percent/uat/UAT-DEFECT-BACKLOG.csv`
- `audit/100-percent/uat/UAT-COVERAGE-MATRIX.csv`
- `tests/unit/uat/uat-record-validator.test.ts`
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md`
- `audit/100-percent/FINAL-OPEN-RISKS.md`

### التحقق
- validator حي على القالب ✅ — `UAT EXECUTION REQUIRED / sessions=0` exit 0
- `pnpm test:unit` ✅ — 30 ملفًا / 117 اختبارًا (111 سابقة + 6 جديدة)
- `pnpm test:architecture` ✅، `pnpm format:check` ✅، `pnpm lint` ✅، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة)
- `git diff --check` ✅
- Node `v24.20.0` + pnpm `11.25.0` داخل العقد؛ HEAD `1d0ef75` على `main`

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** الـkit والأدوات جاهزة ومختبرة، لكن R-005 يبقى مفتوحًا: صفر جلسات مشاركين، ولا إغلاق بدون نتايج بشرية حقيقية وقبول ACCEPTED على نفس الـrelease candidate.

### ملاحظات / مشاكل مفتوحة
- R-001 (شق restore)، R-002 (النصف المصادق)، R-003 (إثبات CI)، R-004، R-006–R-010 تبقى OPEN.
- لا commit أو push أو deploy أو production mutation.

## [2026-09-08] — QC-100-CLOSURE-05: Render Production Runtime and Provider Evidence Closure

### تم التنفيذ
- فحصت الإنتاج قراءة فقط: qclevel.top يرجع 500 HTML على / و/login و/api/health/live و/api/health/ready بدون security headers ولا x-request-id ولا JSON، مع redirect صحيح http→https وتنقيح أخطاء سليم بدون تسريب.
- شخصت الجذر: middleware كان ينادي getServerEnv قبل تجاوز الصحة فيرمي InvalidEnvironmentError ويسقط كل الطلبات حتى live؛ أعدت الترتيب عبر health-gates.ts النقي (live يتجاوز التحقق، ready يتدهور لـ503 JSON، غيرها 503 problem+json مغلق الفشل) بدون إضعاف auth/CSP/RBAC/TLS.
- أضفت اختبار TDD middleware-health (RED→GREEN 3/3) وثبت عقد render.yaml (لا migrate/seed/bootstrap تلقائي، لا BOOTSTRAP_ADMIN_*، healthCheckPath ready) وسجلت أدلة PROD-05-A الحرجة بدون إغلاق زائف.

### الملفات المتأثرة
- `src/shared/http/health-gates.ts`
- `src/middleware.ts`
- `tests/unit/http/middleware-health.test.ts`
- `audit/100-percent/QC-100-CLOSURE-05-RENDER-RUNTIME-EVIDENCE.md`
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md`
- `audit/100-percent/FINAL-OPEN-RISKS.md`

### التحقق
- focused health/render/release/security/correlation/system-health ✅ — 6 ملفات / 46 اختبارًا
- `pnpm test:unit` ✅ — 29 ملفًا / 111 اختبارًا (108 سابقة + 3 جديدة)
- `pnpm test:architecture` ✅، `pnpm format:check` ✅، `pnpm lint` ✅، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة)
- `pnpm build` ✅، `git diff --check` ✅
- إنتاج حي: FAIL — كل الأسطح 500؛ Node محلي v22.22.3 خارج العقد فالنتائج محلية فقط

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** عيب liveness/readiness الكودي مثبت ومصلح محليًا باختبارات خضراء، لكن الإنتاج المنشور ما زال DOWN (PROD-05-A) ويحتاج تحقق مشغل وإعادة نشر مضبوطة قبل أي قبول.

### ملاحظات / مشاكل مفتوحة
- Deployed SHA/version/build/Node/logs وDB private/internal وtelemetry exporter: BLOCKED بدون Render API — لم تُدعَ.
- R-004/R-009/R-001-restore/R-002-auth/R-006/R-008 تبقى OPEN؛ لا commit أو push أو deploy أو production mutation.

## [2026-09-08] — QC-100-CLOSURE-04: Browser E2E, Accessibility, Visual and Lottie Runtime Closure

### تم التنفيذ
- شغلت الـrelease المبني للـHEAD الحالي `746c150` على Node `v24.20.0` + pnpm `11.25.0` عبر `node dist/server/entry.mjs` على `127.0.0.1:4321`، ونفذت كامل Playwright: `52 passed / 13 skipped / 0 failed` (الـ13 تخطي بوابات fixture مصادقة `QC_E2E_LOGIN_IDENTITY/PASSWORD` لم تُخترع).
- ثبتُّ Lottie runtime: `background.lottie` و`dotlottie-player.wasm` same-origin (200)، CSP `default-src 'self'` بدون أي طلب CDN (صفر external على 5 أسطح)، الخلفية `fixed` و`pointer-events none` و`aria-hidden true` تحت المحتوى، وreduced-motion/print يعطلان العرض.
- التقطت لقطات `1440×900` و`1920×1080` و`768×1024` و`390×844` عربي RTL وإنجليزي LTR؛ اللوحة opaque (`rgb(27,31,27)`) ومقروءة فلم أغير أي opacity.
- ضيقت R-002 فقط (C-18/C-19) بدون إغلاق زائف؛ سجلت أن النصف المصادق (13 spec + فحوصات يدوية/AT/LCP/CLS/CPU) ما زال يحتاج fixture معتمدة.

### الملفات المتأثرة
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md`
- `audit/100-percent/FINAL-OPEN-RISKS.md`

### التحقق
- `pnpm build` ✅ على Node 24.20.0
- Playwright كامل ✅ — 52 passed / 13 skipped / 0 failed
- `system-background` ✅ — 6/6؛ `accessibility+responsive` ✅ — 12 passed / 2 skipped
- axe WCAG 2.2 AA للـlogin LTR/RTL و404 ✅؛ reflow حتى 400% بدون overflow ✅
- `pnpm format:check` ✅، `pnpm lint` ✅، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة)
- `pnpm test:unit` ✅ — 28 ملفًا / 108 اختبارات؛ `pnpm test:architecture` ✅
- `git diff --check` ✅

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** أدلة المتصفح العامة للـHEAD الحالي صارت مثبتة (E2E/Lottie/CSP/axe/لقطات)، لكن R-002 يبقى مفتوحًا للنصف المصادق حتى تتوفر fixture دخول معتمدة وبيئة مصرح بها.

### ملاحظات / مشاكل مفتوحة
- Remote CI للـHEAD الحالي ما زال خارج النطاق (R-004 مفتوح، billing lock خارجي سابقًا).
- لا يوجد commit أو push أو deploy أو production mutation.

## [2026-09-08] — QC-100-CLOSURE-03: PostgreSQL Runtime, Migration, Integrity and Authorization Closure

### تم التنفيذ
- شغلت Docker Desktop محليًا (كان طافيًا) فصارت Testcontainers على `postgres:18-alpine` متاحة، وجهزت قاعدة مؤقتة PostgreSQL `18.6` للـ`db:*` scripts ثم دمرتها بعد المهمة؛ بدون أي لمس لقاعدة إنتاج وبدون طباعة أسرار.
- أصلحت `db:preflight` التي كانت تفشل `3F000 schema qc does not exist` على قاعدة فاضية (حماية `has_schema_privilege` بـ`CASE` ترجع `NULL`)، ثم سجلت Phase A كاملة: preflight PASS، ترحيل 18/18 بدون معلق، checksums سليمة، schema check (60 جدول/0 يتيم)، بذرة `4/198/164` idempotent، وإعادة الترحيل no-op.
- صححت عقد النسب لجدول `change_requests` في `check-schema-integrity.ts` و`integrity-governance.test.ts` من `created_by` إلى `requested_by` حسب DATA-DICTIONARY §53 وDATA-MODEL §109، وأصلحت teardown مزدوج `pool.end()` وعزلة هوية rate-limit في `rate-limit.test.ts` بعد فشل مثبت (`expected 6 to be 1` من تلوث قاعدة مشتركة).
- سجلت Phase B على PostgreSQL 18 حقيقية: migrations 22/22، concurrency 12/12، security 42/42 (مرتين)، integration 69 ملف/234 اختبار بدون فشل؛ وحدثت `FINAL-EVIDENCE-INDEX.md` (C-13 إلى C-17) و`FINAL-OPEN-RISKS.md` (تضييق R-001) بدون إغلاق زائف.

### الملفات المتأثرة
- `scripts/db/preflight.ts`
- `scripts/db/check-schema-integrity.ts`
- `tests/integration/database/integrity-governance.test.ts`
- `tests/integration/security/rate-limit.test.ts`
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md`
- `audit/100-percent/FINAL-OPEN-RISKS.md`

### التحقق
- `pnpm format:check` ✅، `pnpm lint` ✅ (0 errors)، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة).
- `pnpm test:unit` ✅ — 28 ملفًا / 108 اختبارات.
- `pnpm test:migrations` ✅ 22/22، `test:concurrency` ✅ 12/12، `test:security` ✅ 42/42 (مرتين)، `test:integration` ✅ 69/69 ملفًا / 234 ناجح / 1 skipped.
- `pnpm test:architecture` ✅، `pnpm build` ✅، `git diff --check` ✅.
- Node `v24.20.0` + pnpm `11.25.0` داخل العقد؛ HEAD `3f92569` على `main` والشجرة فيها ملفات المهمة فقط.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** كل أدلة PostgreSQL runtime للـHEAD الحالي صارت مثبتة محليًا على PG18 (ترحيل/نزاهة/تفويض سلبي/تزامن/idempotency/audit)، لكن R-001 تضيّق فقط (بقى شق restore لـR-006) وR-004 البعيد ما زال ينتظر CI أخضر بعد billing.

### ملاحظات / مشاكل مفتوحة
- Remote CI للـHEAD الحالي ما زال `completed/failure` بصفر steps (billing lock خارجي)؛ R-004 مفتوح.
- E2E/UAT/restore drill/provider evidence خارج نطاق هذه المهمة وما زالت مفتوحة (R-002/R-005/R-006/R-008).
- لا يوجد commit أو push أو deploy أو production mutation.

## [2026-09-08] — QC-100-CLOSURE-02: Delivery Layer / Database Boundary Enforcement

### تم التنفيذ
- شخصت الجذر: حارس `check-boundaries.mjs` القديم كان يشترط quote بعد `database|db|kysely|pg` فما مسك `shared/database/database.js`، وما كان عنده أي pattern لـ`getDatabase` أو `/infrastructure/` أو `Postgres*`؛ فحص `rg` مستقل لقى 12 ملف delivery فيها `getDatabase()` مع `Postgres*` مباشرة (4 actions و7 pages والميدلوير) بجانب `ready.ts` و`ai-advisory.ts`.
- بنيت 11 مصنع تركيب ضيق بدون god-service: وسعت `tasksActionDependencies`، وأنشأت `administration` و`findings` و`reporting` و`dashboard` و`aiAdvisory` dependencies، بجانب `notification` و`search` و`auditQuery` و`rateLimit` (singleton محفوظ) و`readiness`؛ كل delivery صار يستهلك `*Dependencies()` فقط مع نفس wiring للـaudit/outbox والـactor/requestId.
- أصلحت الحارس ليمسك `getDatabase` وأي database import بأي suffix وkysely/pg و`Kysely/DatabaseSchema/new Pool|Client` و`/infrastructure` و`Postgres*` و`new *Repository` وكائنات الترانزكشن، مع دعم `QC_ARCH_DELIVERY_ROOTS` للاختبارات وallowlist فارغة موثقة بدون استثناءات مخفية.
- أضفت `tests/unit/architecture/boundary-guard.test.ts` بخمس حالات: يفشل على الصفحة→`getDatabase` والأكشن→pg/Kysely والـUI→repository والدليفري→infrastructure، وينجح على التركيب المعتمد.
- حدثت `FINAL-EVIDENCE-INDEX.md` (C-07 إلى C-12) و`FINAL-OPEN-RISKS.md` (دلتا R-003) بدون رفع أي domain score؛ أبقيت domains 11/27/34/39 على FAIL حتى دليل CI runtime.

### الملفات المتأثرة
- `scripts/architecture/check-boundaries.mjs`
- `tests/unit/architecture/boundary-guard.test.ts`
- `src/actions/{tasks,admin,findings,reports,ai-advisory}.ts`
- `src/middleware.ts`
- `src/pages/{dashboard/index,notifications,search,audit}.astro`
- `src/pages/reports/{[reportCode],index}.astro`
- `src/pages/quality/findings/{index,[findingId]}.astro`
- `src/pages/api/health/ready.ts`
- `src/modules/{tasks/application/dependencies,administration/application/dependencies,quality/findings/application/dependencies,reporting/application/dependencies,dashboard/application/dependencies,ai-advisory/application/dependencies}.ts`
- `src/shared/{notifications/notification-dependencies,search/search-dependencies,audit/audit-dependencies,security/rate-limit-dependencies,health/health-dependencies}.ts`
- `audit/100-percent/{FINAL-EVIDENCE-INDEX,FINAL-OPEN-RISKS}.md`

### التحقق
- `pnpm format:check` ✅، `pnpm lint` ✅ (exit 0)، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة).
- `pnpm test:architecture` ✅، والـscan المستقل صفر مخالفات (`RG_EXIT:1`).
- `pnpm test:unit` ✅ — 28 ملفًا / 108 اختبارات (103 سابقة + 5 جديدة).
- `pnpm build` ✅ (Astro server/client)، و`git diff --check` ✅.
- `server-contract` integration: 4 passed / 1 skipped، والفشل على مستوى الملف container-only (`Could not find a working container runtime strategy`) بدون assertion failures.
- Node المحلي `v22.22.3` خارج العقد `>=24.20.0 <25`؛ النتائج محلية فقط وليست CI parity.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** الـscan والحارس صارا متفقين على صفر استيراد مباشر، والتركيب صار عبر مصانع معتمدة بدون god-service، لكن R-003 يبقى static-closure فقط حتى CI حاوية يثبت السلوك على PostgreSQL حي.

### ملاحظات / مشاكل مفتوحة
- `audit/prompt4.md` ظهر فيه حذف 244 سطرًا غير مرتبط بالمهمة؛ رجعته بـ`git checkout` والـstatus النهائي فيه ملفات المهمة فقط.
- R-001 وR-002 وR-004 حتى R-010 تبقى OPEN كما هي؛ لا يوجد commit أو push أو deploy أو production mutation.

## [2026-09-08] — QC-100-CLOSURE-01: GitHub Actions pre-step failure + Node runtime parity

### تم التنفيذ
- شخصت سبب فشل Verification CI: الـVerify job يخلص بـ3 ثواني وصفر steps لأن حساب GitHub مقفل بسبب billing (annotation رسمي)، وتأكد نفس السبب على 4 runs متتالية بما فيها HEAD الحالي؛ الـworkflow سليم والـactions كلها v4.
- أصلحت placeholder في `pnpm-workspace.yaml` (`sharp: set this to true or false` → `false`) كان يكسر كل `pnpm install`/script بخطأ `ERR_PNPM_IGNORED_BUILDS`؛ القرار deny صريح بدون إضعاف أمني.
- أصلحت lint في `scripts/release/check-tech-debt.mjs` بإضافة `/* global console: readonly */` على مستوى الملف فقط بدون تغيير قواعد عامة.
- شغلت مرآة CI محلية على Node `v24.20.0` + pnpm `11.25.0` للـHEAD `f9c8eb9`: format/lint/typecheck/architecture/tech-debt/unit/build/release-identity/release-verify كلها خضراء.
- حدثت `FINAL-EVIDENCE-INDEX.md` و`FINAL-OPEN-RISKS.md` بالأدلة الجديدة؛ أبقيت R-004 وR-009 مفتوحة بأسباب موثقة.

### الملفات المتأثرة
- `pnpm-workspace.yaml`
- `scripts/release/check-tech-debt.mjs`
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md`
- `audit/100-percent/FINAL-OPEN-RISKS.md`

### التحقق
- `pnpm install --frozen-lockfile` ✅ exit 0 على Node 24.20.0.
- `pnpm format:check` ✅، `pnpm lint` ✅، `pnpm typecheck` ✅ (0 errors، 25 hints سابقة).
- `pnpm test:architecture` ✅، `release:tech-debt:check` ✅ (6 items).
- `pnpm test:unit` ✅ — 103/103.
- `pnpm test:integration` ⚠️ — 57 ملف / 192 اختبار ناجح، 12 ملف فشل setup لغياب container runtime (صفر assertion failures).
- `pnpm test:migrations` / `test:concurrency` ⚠️ — نفس سبب الـcontainer؛ `test:security` ✅ جزئي (41 passed، ملف واحد container-blocked).
- `pnpm build` ✅، `release:identity` + `release:verify` ✅ على نفس الـSHA.
- `git diff --check` ✅؛ Remote CI للـHEAD الحالي: completed/failure بصفر steps (billing lock خارجي).
- E2E لم يُشغّل محليًا: لا يوجد Playwright browsers على المضيف.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** السبب الحقيقي لفشل CI قبل الخطوات صار مثبتًا (billing lock خارجي لا يُصلح بالكود)، والـtoolchain المحلي صار يعمل على Node 24، لكن R-004 وR-009 يبقيان مفتوحين حتى run أخضر جديد بعد حل الفوترة.

### ملاحظات / مشاكل مفتوحة
- المشغّل لازم يحل billing في GitHub ثم يدفع/يعيد التشغيل ويلتقط الـrun الجديد للـSHA الجديد — ممنوع عليّ الدفع.
- DB suites وE2E تحتاج CI أخضر (container runtime + Chromium) على Node 24.
- ملف `audit/prompt4.md` غير متتبع وموجود قبل المهمة؛ لم ألمسه.

## [2026-09-08] — QC-100-13: Final evidence closure audit for AI, UX research, UAT and 100 domains

### تم التنفيذ
- أضفت dataset حتمي غير سري من 14 حالة AI يغطي حدود QC limits والسياسات/WI-SOP والتوصيات الخطرة وطلبات السجلات غير المصرح بها وprompt injection وتسريب النطاق والمدخلات السرية وmalformed output/outage/timeout/refusal/user override/human confirmation.
- أضفت `tests/integration/ai-advisory/evals.test.ts` يمرر الحالات عبر `GetAdvisoryUseCase` الحقيقي، ويتحقق من `DENIED/REFUSED/UNAVAILABLE/AVAILABLE` ومن عدم وصول الحالات المرفوضة إلى provider.
- أضفت حزمة usability قابلة للتنفيذ فيها 7 أدوار و11 مهمة حرجة ومقاييس task success/time/errors/backtracking/navigation/form correction/assistance/confidence، ووسمت النتائج `UNVERIFIED` لعدم وجود مشاركين منفذين.
- أضفت re-audit مستقل للـ100 domain وفهرس أدلة ومخاطر مفتوحة وقرار إنتاج مربوط بالـHEAD الحالي؛ لم أرفع أي domain بسبب غياب أدلة runtime/UAT/CI/restore.
- سجلت الواقع الحالي: `main`، HEAD `ca8d1bdc49d84cb447c88ed12d380a38ff3940e9`، Node `v22.22.3` خارج العقد `>=24.20.0 <25`، pnpm `11.25.0`، migration source head `0018_rate_limit_windows.sql`، والـworking tree كان نظيفًا قبل المهمة.

### الملفات المتأثرة
- `audit/100-percent/ai-evals/deterministic-eval-dataset.json`
- `tests/integration/ai-advisory/evals.test.ts`
- `audit/100-percent/USABILITY-STUDY-PACKAGE.md`
- `audit/100-percent/FINAL-100-DOMAIN-AUDIT.md`
- `audit/100-percent/FINAL-EVIDENCE-INDEX.md`
- `audit/100-percent/FINAL-OPEN-RISKS.md`
- `audit/100-percent/FINAL-PRODUCTION-DECISION.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- focused AI suite ✅ — 3 files / 38 tests passed.
- `pnpm test:unit` ✅ — 27 files / 103 tests passed.
- `pnpm typecheck` ✅ — 0 errors، 25 hints.
- `pnpm build` ✅ — Astro server build completed؛ warning سابق عن `Writable` غير مستخدم.
- `pnpm format:check` ✅ — بعد تنسيق ملفات المهمة.
- `pnpm lint` ❌ — existing `scripts/release/check-tech-debt.mjs:48` يستخدم `console` بدون تعريف ESLint.
- `pnpm test` ❌ — 84 files passed، 12 PostgreSQL/Testcontainers suites failed لغياب container runtime، 295 passed و42 skipped.
- `pnpm test:architecture` ✅ — guard exit 0، مع بقاء scan مستقل يثبت مخالفات Delivery موثقة في `R-003`.
- `git diff --check` ✅؛ GitHub API/remote CI ❌/UNVERIFIED من هذا المضيف.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** AI governance صار له eval suite حتمي ناجح وحزمة usability/UAT صار لها بروتوكول تنفيذي، لكن القرار الدقيق يبقى `NOT YET 100/100` بمتوسط baseline `49.35/100` بسبب أدلة التشغيل والـUAT والـCI والـrestore والسياسات المفتوحة.

### ملاحظات / مشاكل مفتوحة
- لا يوجد claim عن participant results أو PostgreSQL applied migrations أو remote CI أو production/provider evidence.
- `pnpm lint` ما زال يفشل في ملف release checker موجود قبل هذه المهمة؛ لم أضعف القاعدة بإخفاء الخطأ.
- لا يوجد commit أو push أو deploy أو production mutation.

## [2026-09-08] — QC-100-12: Production delivery, release governance and Secure SDLC evidence gate

### تم التنفيذ
- أضفت `RELEASE-GATE.md` ببوابة Go/No-Go تربط القرار بهوية الإصدار الدقيقة: release ID وGit SHA وbuild/artifact hash وmigration head وUAT/change evidence، وترفض الأدلة العامة مثل “update site”.
- أضفت `ENVIRONMENT-MATRIX.md` للفصل الصريح بين LOCAL/DEVELOPMENT وTEST/CI وSTAGING/UAT وPRODUCTION، مع حدود البيانات والأسرار والهجرات والـpromotion invariants.
- أضفت `TECH-DEBT-REGISTER.md` كسجل قابل للتتبع لـP0/P1 debt، مع exit evidence وحالة صادقة؛ سجّلت فيه غياب provider/UAT/DB/production evidence بدل إغلاقها افتراضيًا.
- أضفت `scripts/release/check-tech-debt.mjs` وأمر `pnpm release:tech-debt:check` وربطته بـCI؛ checker يرفض الأعمدة المتغيرة، IDs المكررة، الحالات غير المعروفة، والصفوف الناقصة، ولا يغلق debt تلقائيًا.
- حافظت على release identity الحالية والـRender/CI contracts كما هي، ولم أضف deploy أو migration أو seed أو bootstrap أو production mutation.

### الملفات المتأثرة
- `audit/100-percent/RELEASE-GATE.md`
- `audit/100-percent/ENVIRONMENT-MATRIX.md`
- `audit/100-percent/TECH-DEBT-REGISTER.md`
- `scripts/release/check-tech-debt.mjs`
- `package.json`
- `.github/workflows/ci.yml`

### التحقق
- `node scripts/release/check-tech-debt.mjs` ✅ — 6 سجلات.
- `prettier --check` على كل الملفات المعدلة ✅.
- اختبارات release/render المركزة ✅ — 2 ملفات / 10 اختبارات.
- `node scripts/architecture/check-boundaries.mjs` ✅.
- `git diff --check` ✅.
- CI البعيد، dependency vulnerability/SBOM/provenance، Staging/UAT، PostgreSQL runtime، production deployment/smoke والـrollback ما زالت UNVERIFIED؛ لم تُنفذ من بيئة المهمة.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** صار عندنا release gate وenvironment matrix وtechnical-debt automation قابلة للتشغيل ومربوطة بالـCI، لكن QC-100-12 لا يُغلق ولا يتحول إلى GO بدون أدلة provider/CI/UAT/DB/production الحالية.

### ملاحظات / مشاكل مفتوحة
- Current source migration head هو `0018_rate_limit_windows`، بينما applied database head غير مثبت.
- Node المحلي خارج عقد المشروع حسب سجلات المهمة السابقة؛ نتائج التحقق المحلية لا تستبدل CI تحت Node `24.20.0`.

## [2026-09-08] — QC-100-11: Backup, recovery, restore verification and continuity evidence slice

### تم التنفيذ
- أضفت checklist تنفيذية آمنة وموجهة لسياق Render تجمع فحص manifest، وفحص PostgreSQL قراءة فقط، وفحص object metadata/size/SHA-256، وتُبقي physical restore وبوابات التطبيق والصلاحيات والجلسات والأسرار BLOCKED بدون دليل خارجي.
- أضفت أمر `pnpm recovery:checklist` وربطته بالـrunbook، بدون Render API أو backup/restore/WAL/PITR أو migrations أو أي كتابة على الهدف.
- جعلت أمر checklist يرجع non-zero عند أي بوابة غير `PASS` حتى لا يُفسر `BLOCKED/UNVERIFIED` كنجاح آلي.
- أضفت مصفوفة DR تربط الأدلة المطلوبة بالـdomains 9 و14 و20 و82 و83، وتفصل بوضوح بين backup created وrestore verified.
- أضفت قالب Restore Drill Evidence Record بإجراء Render تشغيلي صريح وحقول provider reference وledger/schema/audit/files/app/security/session/cleanup.
- أضفت اختبارات تمنع claim الاستعادة عند غياب دليل provider، وتثبت أن نجاح file hash وحده لا يغلق restore proof.

### الملفات المتأثرة
- `scripts/recovery/run-recovery-checklist.ts`
- `tests/unit/recovery/recovery-tooling.test.ts`
- `docs/operations/RESTORE-DRILL-RUNBOOK.md`
- `audit/100-percent/DR-EVIDENCE-MATRIX.md`
- `audit/100-percent/RESTORE-DRILL-EVIDENCE-TEMPLATE.md`
- `package.json`

### التحقق
- `pnpm exec vitest run tests/unit/recovery/recovery-tooling.test.ts` ✅ — 6/6.
- `pnpm test:unit` ✅ — 27 files / 103 tests.
- `pnpm lint` ✅.
- `pnpm typecheck` ✅ — 0 errors، 25 hints deprecation.
- `pnpm build` ✅.
- `pnpm exec prettier --check ...` ✅.
- `git diff --check` ✅.
- GitHub CI status UNVERIFIED — `gh run list` تعذر بسبب فشل الاتصال بـGitHub.

### النتيجة
- **الحالة:** جزئي — tooling والـevidence contracts أُضيفت وتحققت محليًا، لكن لا يوجد isolated Render restore فعلي أو provider/PITR/WAL/RPO/RTO evidence، لذلك domains DR المستهدفة لا تُغلق.
- **مختصر:** الفرق بين backup creation وrestore verification صار ممثلًا ومقيدًا آليًا؛ الإغلاق الحقيقي ما زال يحتاج تنفيذ مشغّل معتمد وتسجيل Restore Evidence Record.

### ملاحظات / مشاكل مفتوحة
- PostgreSQL restore/object target وapplication compatibility وauthorization/session/secret checks غير منفذة في بيئة المهمة.
- Node المحلي `v22.22.3` خارج عقد المشروع `>=24.20.0 <25`؛ نتائج التحقق المحلي لا تستبدل CI/Render evidence.

## [2026-09-08] — QC-100-10: Performance, resilience and observability evidence slice

### تم التنفيذ
- أصلحت قياس زمن HTTP في الـmiddleware: صار يبدأ قبل معالجة الطلب كاملة بدل بدء المؤقت بعد اكتمالها، وأضفت histogram آمن `qc_http_server_duration_ms` بعلامات route/method/status/environment محدودة.
- أضفت primitive histogram يتحقق من القيم السالبة وغير الصالحة ولا يسمح لفشل الـexporter بإيقاف العملية المتحكم بها، وربطت عليه `qc_db_query_duration_ms` بدون SQL أو bind parameters أو identifiers.
- أضفت service name/version/environment إلى structured logs مع بقاء request/trace/span correlation وredaction، وغطيتها باختبارات منع تسريب الحقول الحساسة.
- أضفت load runner قابل للتكرار للـlogin/dashboard/lists/search/receiving/laboratory/approvals/reports؛ profiles التي تكتب مقفلة افتراضيًا ولا تشتغل إلا بتأكيد صريح وبيئة disposable.
- أنشأت baseline/resilience/observability records صادقة: ما فيها SLO أو capacity أو production claim غير مقاس، وتحدد raw evidence المطلوب لإغلاق الفجوات.

### الملفات المتأثرة
- `src/middleware.ts`
- `src/shared/observability/{telemetry,db-telemetry,logger}.ts`
- `tests/integration/observability/correlation.test.ts`
- `tests/performance/load-profiles.mjs`
- `audit/100-percent/{PERFORMANCE-BASELINE,RESILIENCE-MATRIX,OBSERVABILITY-EVIDENCE}.md`

### التحقق
- `pnpm exec vitest run tests/integration/observability/correlation.test.ts tests/unit/health-live.test.ts tests/unit/health-ready.test.ts` ✅ — 3 ملفات / 21 اختبارًا.
- `pnpm exec eslint ...` و`pnpm exec prettier --check ...` ✅.
- `pnpm typecheck` ✅ — 0 errors و25 hints deprecation موجودة؛ Node المحلي `22.22.3` خارج العقد `>=24.20.0 <25`.
- `pnpm test:architecture` ✅ — لا مخالفات Delivery → database/domain/business-rule.
- `pnpm db:migrate:status` ❌/UNVERIFIED — `DATABASE_URL` غير متوفر، ولم تُطبع أي قيمة سرية؛ migration head المصدر `0018_rate_limit_windows` فقط.
- `git diff --check` ✅؛ المصدر scan وجد TODO واحدًا موثقًا في `audit/100-percent/02-GAP-REGISTER.md` ولا SQL داخل `src/pages` أو `src/actions` في الفحص المنفذ.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** القياس صار قابلاً للرصد محليًا وبلا تسريب أو تأثير على العملية المتحكم بها، لكن benchmark ممثل، PostgreSQL runtime، exporter/alert delivery وCI الحالي ما زالت غير مثبتة.

### ملاحظات / مشاكل مفتوحة
- ما فيه `DATABASE_URL` أو fixture مصرح للـload/write profiles؛ لذلك لا يوجد baseline مقاس ولا ادعاء capacity أو readiness.
- حالة CI البعيدة غير متاحة من بيئة المهمة؛ تبقى UNVERIFIED إلى أن تُلتقط من مزود CI مع SHA نفسه.

## [2026-09-08] — QC-100-09: خلفية dotLottie محلية ثابتة ونظام حركة آمن

### تم التنفيذ
- نقلت `background.lottie` من جذر الريبو إلى `public/assets/background.lottie` كمصدر التشغيل الوحيد، وأضفت `dotlottie-player.wasm` محليًا تحت نفس الحد العام.
- ثبّتُّ `@lottiefiles/dotlottie-web@0.80.0` بقفل integrity في `pnpm-lock.yaml`، وعيّنت صراحةً مسار WASM المحلي لمنع fallback CDN الذي تحمله الحزمة.
- أضفت `SystemBackground` لكل الصفحات عبر `BaseLayout`: fixed، غير تفاعلي، `aria-hidden`، تحت المحتوى، مع overlay للقراءة وcanvas يغطي الشاشة بلا distortion.
- جعلت المشغّل يبدأ مؤجلًا بعد 180ms، يخفض DPR إلى 1.5، يوقف عند إخفاء المستند، يدمر نفسه عند `prefers-reduced-motion` أو `pagehide`، ويُخفى في الطباعة.
- وحّدت `/login` مع `AuthLayout` بعد أن كشف E2E أنه كان يتجاوز `BaseLayout`؛ صار login يأخذ الخلفية وطبقة المحتوى نفسها بدون تغيير Action أو authorization.
- أبقيت الأسطح الحساسة واضحة: shell/sidebar/topbar/auth لها طبقات شبه opaque، والـpanels/tables/dialogs تستمر على tokens سطح opaque؛ لم يتغير أي لون أو دلالة state للـPASS/RELEASED.

### الملفات المتأثرة
- `public/assets/background.lottie`
- `public/assets/dotlottie-player.wasm`
- `src/ui/components/SystemBackground.astro`
- `src/ui/layouts/BaseLayout.astro`
- `src/ui/layouts/AppLayout.astro`
- `src/ui/layouts/AuthLayout.astro`
- `src/pages/login.astro`
- `src/ui/styles/global.css`
- `tests/unit/ui/system-background.test.ts`
- `tests/e2e/system-background.spec.ts`
- `package.json`
- `pnpm-lock.yaml`

### التحقق
- `node_modules/.bin/vitest run tests/unit/ui/system-background.test.ts tests/unit/shared/security-headers.test.ts` ✅ — ملفان / 11 اختبارًا.
- `node_modules/.bin/astro check` ✅ — 0 errors و25 hints deprecation موجودة سابقًا.
- `node_modules/.bin/astro build` ✅ — الملفات المحلية ظهرت في `dist/client/assets/`؛ warning سابق فقط عن `Writable` غير مستخدم.
- Playwright محلي للـlogin والخلفية/الشبكة/reduced-motion/print وأحجام 1440×900 و1920×1080 و768×1024 و390×844 RTL ✅ — 6 passed.
- `git diff --check` ✅؛ scan للمسارات المعدلة لم يجد secrets أو TODO/FIXME أو SQL/state assignment.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** الخلفية المحلية تعمل على login وBaseLayout مع CSP self-hosted مثبت بالاختبارات، لكن readability الفعلية للـDashboard والصفحات الحرجة المحمية ما زالت تحتاج fixture دخول E2E مستقلة؛ لا يوجد claim بإغلاق المجالات أو readiness كاملة.

### ملاحظات / مشاكل مفتوحة
- Node المحلي `22.23.1` خارج عقد المشروع `>=24.20.0 <25`، وأوامر `pnpm` المغلفة تعيد محاولة install وتفشل عند `ERR_PNPM_IGNORED_BUILDS`؛ شُغّلت الأدوات الثنائية المحلية مباشرة.
- bundle `dotLottie` client الجديد حجمه 62.83kB (14.33kB gzip) والـassets العامة تضيف 1.1MB `.lottie` و1.2MB WASM؛ لم تتوفر baseline أو memory/CPU profiler قبل التغيير، لذا القياس المقارن غير مثبت.
- E2E Dashboard/الصفحات المحمية وvisual QA اليدوي للـtables/dialogs/status chips يحتاجان fixture دخول معتمد؛ لا يجوز استنتاجهما من login فقط.

## [2026-09-08] — QC-100-08: WCAG 2.2 AA, RTL, keyboard and human-factors evidence slice

### تم التنفيذ
- أضفت مسار دخول عربي محدود بـ`/login?locale=ar` يحدد `lang=ar` و`dir=rtl` ويترجم عنوان ونصوص وأسماء الحقول ورسالة الخطأ، مع بقاء نفس Action ومبدأ عدم كشف صلاحيات من الـUI.
- أضفت Playwright فعليًا للـlogin بالإنجليزي LTR والعربي RTL: Axe WCAG 2.2 AA، labels/autocomplete، ترتيب Tab، وfocus الظاهر؛ ووسّعت reflow إلى 400% لهاتين الحالتين بدون overflow أفقي.
- حسّنت `initDialogs` بحيث ينقل focus بشكل حتمي لأول عنصر مفعّل داخل dialog بعد الفتح (يفضّل `[autofocus]`) ويرجعه للزر الفاتح عند الإغلاق؛ اختبرته بعقد unit.
- أنشأت `ACCESSIBILITY-EVIDENCE.md` بسجل Master Header ونتائج أوامر فعلية وقائمة manual/AT/Human Factors غير منفذة بدل اعتبارها ناجحة.
- ما ادعيت تغطية عربية أو WCAG كاملة للـworkflows المحمية: اختبارات accessibility الكاملة نفذت 3 وskipped 2 لأن fixture دخول معتمد ما توفر.

### الملفات المتأثرة
- `src/pages/login.astro`
- `src/ui/client/dialog.ts`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `tests/unit/ui/app-shell.test.ts`
- `audit/100-percent/ACCESSIBILITY-EVIDENCE.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm test:unit -- tests/unit/ui/app-shell.test.ts` ✅ — 26 ملفًا / 96 اختبارًا.
- `pnpm typecheck` ✅ — 0 errors و25 deprecation hints سابقة.
- Playwright login/Axe Arabic+English ✅ — اختباران.
- Playwright 400% reflow Arabic+English ✅ — اختبار واحد.
- ملف accessibility كامل: 3 passed و2 skipped لغياب `QC_E2E_LOGIN_IDENTITY` و`QC_E2E_PASSWORD`.
- `pnpm lint` ✅، `pnpm format:check` ✅، `pnpm build` ✅ مع warning `Writable` سابق، و`git diff --check` ✅.
- `pnpm db:migrate:status` ❌/UNVERIFIED: `tsx` IPC pipe محجوب بـ`EPERM`؛ remote CI كذلك UNVERIFIED لأن `api.github.com` غير متاح.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** صار فيه browser evidence حقيقي للـlogin بالعربي والإنجليزي و400% reflow، وتحسن عقد focus للـdialog، لكن accessibility/RTL/Human Factors للـcritical authenticated workflows والـAT/manual UAT ما زال غير مثبت.

### ملاحظات / مشاكل مفتوحة
- Node المحلي `22.22.3` خارج العقد `>=24.20.0 <25`، لذلك النتائج المحلية لا تكفي كبوابة بيئة معتمدة.
- يلزم توفير fixture دخول E2E غير سري وتوثيق browser/OS/AT ونتائج keyboard/modal/zoom/touch لكل Dashboard وReceiving وInspection وLaboratory وNCR/CAPA وApproval وDocuments وEquipment/Calibration وReports.
- ملف الـmind ما زال فوق الحد العملي؛ rotation منظم للسجلات القديمة يحتاج مهمة توثيق مستقلة حتى لا ينكسر ترتيب الأرشيف.

## [2026-09-08] — QC-100-07: Enterprise QC UX, UI and Design System closure slice

### تم التنفيذ
- وحّدت طبقة التطبيق التي تستعمل `AppLayout`: صار الـsidebar فعليًا قابلًا للطي على سطح المكتب، محفوظًا محليًا لتفضيل المستخدم، ويتحول إلى navigation drawer قابل للفتح/الإغلاق على الجوال مع `Escape` وإرجاع focus للزر.
- أضفت breadcrumbs مشتقة من مسار الصفحة، ومررت capabilities النشطة فقط للـnavigation؛ هذا يحسن wayfinding بدون اعتبار الظهور UI كصلاحية أو تجاوز authorization السيرفري.
- أضفت shortcut `Ctrl/Cmd + K` ينقل لبحث السجلات المصرح بها، مع تسمية وصول صريحة، وأبقيت badges التنبيهات/الموافقات مقتصرة على العداد المعطى من read model (لا تعرض أي نتائج أو موافقات مفترضة).
- أضفت اختبار unit لعقود shell: context من route، navigation capability-aware، mobile navigation، persistence، وsearch keyboard contract.
- فحصت inventory: 68 صفحة Astro؛ 62 تستخدم `AppLayout` وتأخذ التحسين العالمي، والست المتبقية هي login / account / landing / laboratory landing / 404 / 500 وتحتاج review عائلي منفصل بدل افتراض أنها صارت مطابقة تلقائيًا.

### الملفات المتأثرة
- `src/ui/layouts/AppLayout.astro`
- `src/ui/shell/Topbar.astro`
- `src/ui/shell/Sidebar.astro`
- `src/ui/navigation/navigation.ts`
- `tests/unit/ui/app-shell.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- focused UI contracts ✅ — ملفان / 5 اختبارات.
- `pnpm test:unit` ✅ — 26 ملفًا / 95 اختبارًا.
- `pnpm typecheck` ✅ — 0 errors، 25 hints deprecated موجودة مسبقًا.
- `pnpm lint` ✅.
- `pnpm build` ✅ — بقي warning موجود مسبقًا عن `Writable` غير مستخدم في `src/shared/observability/logger.ts`.
- `git diff --check` ✅.
- E2E/browser وPostgreSQL runtime لم يشغلا في هالمهمة؛ لا يوجد دليل تفاعل فعلي على browser أو قاعدة بيانات.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** تحسن shell الموحد لـ62 صفحة تشغيلية بدون تغيير صلاحيات أو state rules، لكن إغلاق UX لكل الصفحات والـbrowser/accessibility evidence ما زال غير مثبت.

### ملاحظات / مشاكل مفتوحة
- ما زالت صفحات Delivery محددة تستورد database/infrastructure مباشرة (منها dashboard/findings/search/notifications/reports/audit)؛ هذا مخالف لمسار Delivery المقصود ويحتاج refactor منفصل صغير ومدعوم باختبارات.
- صفحات record/form كثيرة ما زالت تستخدم styles محلية ومكونات table/status غير موحدة؛ كذلك column visibility، saved filters، print/PDF، offline/degraded runtime، وautosave لا تملك policy أو evidence شامل.
- ملف الـmind تجاوز الحد العملي (2673 سطرًا / 235KB قبل هذا السجل) ويحتاج rotation منظم إلى `02-mind-mid.md` بمهمة توثيق مخصصة؛ لم أنقل سجلات تاريخية هنا حتى ما أغيّر أرشيفًا ضخمًا ضمن slice واجهات.

## [2026-09-08] — QC-100-06: Evidence, file, reporting and notification integrity

### تم التنفيذ
- أضفت تحقق رفع دفاعي قبل التخزين: يمنع أسماء المسارات/control characters وامتدادات الملفات التنفيذية وPE binary المقنّع، ويتحقق من صيغة MIME وتوقيع PDF/PNG/JPEG/GIF عندما يكون MIME معلنًا من هذه الأنواع.
- حافظت على الصلاحية قبل الوصول، opaque storage key، private object storage، SHA-256 وفحصه عند التنزيل؛ ولم أضف size limit أو MIME allowlist أو retention/scanning policy مخترعة لأنها موثقة كـUNCONFIRMED.
- أضفت اختبار TDD سلبيًا يثبت رفض path traversal، التنفيذيات، محتوى MZ، وPDF MIME mismatch قبل كتابة object أو metadata، وعدلت fixture telemetry ليحمل PDF صحيحًا.
- أنشأت سجل أدلة QC-100-06 يفصل code/test-backed عن UNVERIFIED في audit/files/reports/notifications ويحدد فجوات contract audit وorphan cleanup وPDF/print وسياسات الملفات.

### الملفات المتأثرة
- `src/shared/files/file-service.ts`
- `tests/integration/shared/files.test.ts`
- `tests/integration/observability/correlation.test.ts`
- `audit/100-percent/06-EVIDENCE-AUDIT-FILES-REPORTING-NOTIFICATIONS.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- focused files/reporting/observability ✅ — 4 ملفات / 27 اختبارًا.
- `pnpm test:architecture` ✅.
- `pnpm lint` ✅.
- `pnpm typecheck` ✅ — 0 errors؛ تظهر hints deprecated سابقة، وNode المحلي `22.22.3` خارج العقد `>=24.20.0 <25`.
- `pnpm test:security` ❌/UNVERIFIED — 26 passed و1 skipped، وPostgreSQL suite لم يبدأ لأن Testcontainers لا يجد container runtime.
- `pnpm db:migrate:status` ❌/UNVERIFIED — `tsx` IPC pipe محجوب بـ`EPERM` قبل فحص قاعدة البيانات؛ وحالة GitHub CI غير قابلة للقراءة بسبب عدم الوصول إلى `api.github.com`.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** تحسن دفاع مسار الملفات وأدلة CSV/XLSX/notifications موجودة، لكن لا يوجد إثبات runtime لمعاملات PostgreSQL ولا سياسة معتمدة لحجم/MIME/scan/retention، ولا claim لإغلاق المجالات المستهدفة.

### ملاحظات / مشاكل مفتوحة
- عقد `audit_events` لا يفرض context للصلاحية/scope/version لكل controlled mutation، وحماية append-only على مستوى DB تحتاج دليل PostgreSQL.
- لا توجد object-store delete/orphan-cleanup contract، وPDF/print/large export/RTL-date-time coverage غير مثبتة.

## [2026-09-08] — QC-100-05: Controlled QC workflow evidence and held-receiving concurrency guard

### تم التنفيذ
- أنشأت سجل أدلة QC-100-05 يربط تدفقات Tasks وQuality وQuarantine وLaboratory وAssets وDocuments وApprovals/E-Signatures وChange Requests بمسار permission/scope/state/use case/repository/audit/outbox/UI/tests، مع تمييز ما هو code-backed وما يزال runtime-unverified.
- شددت transaction اعتماد تقرير الفحص: تحديث الاستلام المرتبط صار مشروطًا بحالة `UNDER_INSPECTION` ويزيد نسخة الاستلام؛ إذا انتقل الاستلام إلى `HOLD` يفشل الاعتماد بـ`CONFLICT_STALE_VERSION` ويتراجع التقرير والتدقيق والـoutbox معًا.
- عدلت fixture اعتماد الفحص السليم ليبدأ من `UNDER_INSPECTION` بدل حالة افتراضية لا تمثل workflow واقعيًا.
- أضفت اختبار PostgreSQL concurrency يحفظ `HOLD` ونتيجة `HOLD` وversion كما هي، ويتحقق من عدم إنشاء audit/outbox عند تعارض اعتماد الفحص.
- لم أضف policy إطلاق/اعتماد أو retest مخترعة: dependencies الحالية تبقى default-deny، وسجل التدقيق يسمي ذلك blocker صريحًا.

### الملفات المتأثرة
- `audit/100-percent/05-QC-WORKFLOW-EVIDENCE.md`
- `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts`
- `tests/integration/concurrency/controlled-mutations.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm typecheck` ✅ — 0 errors، 25 hints deprecated موجودة مسبقًا؛ Node المحلي `22.22.3` أقل من عقد المشروع `>=24.20.0 <25`.
- `pnpm lint` ✅.
- `pnpm test:unit` ✅ — 25 ملفات / 92 اختبارًا.
- اختبارات QC المركزة ✅ — 7 ملفات / 28 اختبارًا (quarantine release/review، laboratory boundaries، documents، approvals، e-signatures، change requests).
- `pnpm format:check` ✅، `pnpm test:architecture` ✅، `pnpm build` ✅؛ بقي warning معروف `Writable` غير مستخدم في `src/shared/observability/logger.ts`.
- `pnpm vitest run tests/integration/concurrency/controlled-mutations.test.ts` ❌/UNVERIFIED — كل الاختبارات skipped لأن Testcontainers لم يجد container runtime؛ لا توجد نتيجة PostgreSQL فعلية لاختبار HOLD race الجديد.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** انغلقت فجوة overwrite في مسار اعتماد الفحص على مستوى الكود واختبار التكامل، وصار سجل الأدلة يحدد المسارات والفجوات بوضوح؛ لا يوجد claim بأن كل تدفقات QC مغلقة قبل تشغيل PostgreSQL 18 وتثبيت policy authority.

### ملاحظات / مشاكل مفتوحة
- لا توجد Action عامة حاليًا لمساري inspection `REJECT` أو `VOID`؛ لذلك end-to-end rejected-inspection غير مغلق.
- Release وinspection approval وretest تظل default-deny حتى تعتمد policy/authority controlled؛ لا يجوز اختراعها لتجاوز البوابات.
- تحتاج أدلة PostgreSQL 18/Testcontainers للـtransaction/audit/outbox/concurrency، ولا commit أو push أو deploy.

## [2026-09-08] — QC-100-04: PostgreSQL integrity, concurrency and governance evidence

### تم التنفيذ
- أضفت suite تكامل PostgreSQL مستقلة تفحص fresh migration ledger، no-op upgrade، checksum verification، schema-to-migration table drift، TIMESTAMPTZ، lineage/version fields، critical indexes، وعدم وجود destructive FK cascades.
- أضفت orphan-record detection ديناميكيًا لكل foreign key أحادي العمود، مع تحقق فعلي من بقاء النتيجة صفرًا على قاعدة الاختبار.
- أضفت اختبار concurrency لإدخال نفس `task_no` مرتين بالتوازي، بحيث ينجح إدخال واحد فقط وتحمي قاعدة البيانات business-number uniqueness.
- أضفت أمرًا read-only باسم `pnpm db:schema:check` لفحص migration/schema drift وtimestamp/lineage وcascade/orphan contracts على PostgreSQL configured، بدون تعديل البيانات.
- لم أعدل أي migration تاريخي أو أضع policy علمية/تشغيلية جديدة؛ بقيت حدود controlled history وdefault-deny كما هي.

### الملفات المتأثرة
- `tests/integration/database/integrity-governance.test.ts`
- `scripts/db/check-schema-integrity.ts`
- `package.json`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `vitest run tests/unit` ✅ — 25 ملفًا / 92 اختبارًا.
- `astro check` ✅ — 0 errors، 0 warnings، 25 hints deprecated موجودة في ملفات سابقة.
- `eslint .` ✅.
- `astro build` ✅ — build server/client ناجح، مع warning import غير مستخدم معروف في `src/shared/observability/logger.ts`.
- TypeScript filtered للملفات الجديدة ✅.
- `check-boundaries.mjs` ✅.
- `git diff --check` ✅.
- PostgreSQL integrity suite ❌/UNVERIFIED — 7 اختبارات لم تبدأ لأن Docker daemon غير متاح (`Could not find a working container runtime strategy`).
- `pnpm db:schema:check` لم يصل للسكريبت بسبب `tsx` IPC `EPERM` في Node المحلي 22، ولم تُستخدم قاعدة أو credentials إنتاجية.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** أضيفت بوابات وأدلة قاعدة البيانات المطلوبة وصارت قابلة للتشغيل على PostgreSQL 18 disposable/CI، لكن لا يمكن تسجيل runtime PASS لهذه الأدلة في البيئة الحالية قبل تشغيل Docker أو قاعدة اختبار خارجية معتمدة.

### ملاحظات / مشاكل مفتوحة
- Fresh/upgrade/orphan/lineage/concurrency/least-privilege evidence ما زال يحتاج تشغيلًا فعليًا على PostgreSQL 18؛ وجود الاختبارات لا يساوي نجاحها.
- deadlock retry وambiguous-commit behavior ما زالا غير مثبتين كسياسة تنفيذية؛ لم يتم اختراع retry أو recovery semantics.
- لا commit ولا push ولا deploy.

## [2026-09-08] — QC-100-03: AppSec, IAM, Authorization and Privacy hardening

### تم التنفيذ
- ثبّتُّ عقدة كوكي الجلسة `__Host-qc_session`: مولّد الكوكي وكوكي الإلغاء يضيفان `Secure` دائمًا، حتى لو حاول caller تمرير `false`.
- أضفت اختبارات سلبية للجلسات المنتهية والملغاة وحساب disabled، ولـ Admin بدون permission صريحة، ولـ IDOR عبر استبدال كائن خارج النطاق، ولـ cookie downgrade.
- أضفت `downloadByEvidenceId` الذي يحل رابط الدليل canonical من المستودع قبل التفويض والقراءة، ويرفض الروابط المحذوفة/المفقودة.
- أنشأت `SECURITY-ATTACK-MATRIX.md` مع فصل واضح بين VERIFIED وPARTIAL وUNVERIFIED، وتغطية target domains: 3, 5, 6, 21, 24, 27, 36, 70, 71, 72, 79, 81.

### الملفات المتأثرة
- `src/modules/identity/application/session-service.ts`
- `src/shared/files/file-service.ts`
- `tests/unit/identity/session-service.test.ts`
- `tests/unit/shared/security-headers.test.ts`
- `tests/unit/shared/authorize.test.ts`
- `tests/integration/shared/files.test.ts`
- `audit/100-percent/SECURITY-ATTACK-MATRIX.md`

### التحقق
- `pnpm typecheck` ✅؛ 0 errors، مع تحذيرين deprecated معروفين وNode engine warning.
- `pnpm lint` ✅.
- `pnpm format:check` ✅.
- `pnpm test:unit` ✅؛ 25 ملفًا و92 اختبارًا.
- focused security tests ✅؛ 6 ملفات و21 اختبارًا.
- `pnpm build` ✅؛ ظهر warning import غير مستخدم معروف في `src/shared/observability/logger.ts`.
- `pnpm test:architecture` ✅.
- `pnpm test:security` جزئي؛ 26 اختبارًا نجحت و1 skipped، لكن PostgreSQL Testcontainers فشل لعدم وجود container runtime.
- `pnpm db:migrate:status` لم يثبت الحالة؛ `tsx` مُنع من فتح IPC pipe بـ`EPERM` في بيئة التشغيل.
- `git diff --check` ✅؛ لا commit أو push أو deploy.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تم إغلاق ثغرة cookie downgrade وإضافة أدلة سلبية مستقلة للـIAM/authorization/IDOR/session، لكن إغلاق AppSec الكامل غير مثبت؛ ما زالت تغطية المتصفح وPostgreSQL وfile delivery الفعلي وsecret scanning runtime غير مكتملة.

### ملاحظات / مشاكل مفتوحة
- لا يوجد claim بنسبة 100% أو READY أو production closure.
- `downloadByEvidenceId` capability آمنة لكنها غير مربوطة حاليًا بـpublic file Action/route؛ لذلك مصفوفة الهجوم تسجل private object disclosure كـPARTIAL.
- يلزم تشغيل security/integration/E2E على بيئة فيها PostgreSQL container وChromium، ثم إضافة أدلة CI/secret scanner مرتبطة بالـHEAD الحالي.

## [2026-09-08] — QC-100-02: تشديد بوابات التحقق وربط أدلة CI بالـGit SHA

### تم التنفيذ
- أزلت `--passWithNoTests` و`--pass-with-no-tests` من بوابات التكامل والترحيلات والتزامن والأمن وE2E، بحيث يفشل المسار إذا غابت الاختبارات أو فشل setup بدل نجاح صامت.
- أضفت تقارير Vitest JSON لكل suite حرجة، وتقرير Playwright JSON في CI، ورفع أدلة التحقق machine-readable باسم مرتبط بـ`github.sha`.
- أضفت assertion مبكرًا يثبت أن checkout يطابق `github.sha`، ووسّعت release verification لقبول `--expected-git-sha` والتحقق منه ضد هوية الإصدار.
- أصلحت teardown في PostgreSQL rate-limit fixture ليكون آمنًا عند فشل التهيئة، ومنعت أداة manifest schema من إخراج `PASS` مضلل؛ مخرجاتها الآن `SCHEMA_VALIDATED_ONLY`.
- تحققت من أن أحدث GitHub Actions `Verification CI #42` على `56cba0b` لم يبدأ بسبب قفل الحساب لمشكلة billing، وليس بسبب فشل application.

### الملفات المتأثرة
- `.github/workflows/ci.yml`
- `package.json`
- `playwright.config.ts`
- `scripts/release/release-id.mjs`
- `scripts/release/verify-release.mjs`
- `scripts/recovery/verify-recovery-manifest.ts`
- `tests/integration/security/rate-limit.test.ts`
- `.gitignore`

### التحقق
- `pnpm install --frozen-lockfile` ✅؛ ظهر تحذير Node لأن المحلي `22.22.3` والعقد يتطلب `>=24.20.0 <25`.
- `pnpm format:check` ✅، `pnpm lint` ✅، `pnpm typecheck` ✅ بـ0 errors و25 hints، `pnpm test:architecture` ✅.
- `pnpm test:unit` ✅؛ 24 ملفًا و88 اختبارًا.
- `pnpm test:integration` ❌؛ 11 suites فشلت بسبب عدم وجود container runtime، مع 56 suite نجحت و34 test skipped وJSON report تم توليده.
- `pnpm test:migrations` ❌؛ 5 suites فشلت بسبب container runtime، و15 test skipped.
- `pnpm test:concurrency` ❌؛ 2 suites فشلت بسبب container runtime، و11 test skipped.
- `pnpm test:security` ❌؛ 1 PostgreSQL suite فشلت بسبب container runtime، و25 test نجحت و1 skipped.
- `pnpm build` ✅؛ بقي warning import غير مستخدم لـ`Writable`.
- `pnpm test:e2e` ❌؛ 57/57 فشلوا بسبب قيود Chromium/localhost في بيئة macOS الحالية، وليس دليلًا على سلوك التطبيق.
- release identity/verify ✅ محليًا؛ Git SHA `56cba0b5373341fda9f6bea15664dd1093ac01df`، migration head `0018_rate_limit_windows`، checksum `8c77a34b3368a156e96368363081ba82fdd8fd9fb4035ae26d8f0d0e9f2b0822`.
- `git diff --check` ✅، وفحص bypass flags ✅ بدون نتائج.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** صارت بوابات CI أدق وتنتج أدلة قابلة للقراءة ومربوطة بالـSHA، لكن ما فيه fresh green run للـHEAD الحالي بسبب billing في GitHub وغياب container/Chromium runtime محليًا.

### ملاحظات / مشاكل مفتوحة
- يلزم إعادة تشغيل CI بعد معالجة billing، مع PostgreSQL 18 Testcontainers وPlaywright Chromium عاملين؛ لا يوجد claim بأن CI أو E2E أو migration/concurrency evidence مغلق.
- لا يوجد commit أو push أو deploy.

## [2026-09-08] — QC-100-01: Independent 100-domain reality audit baseline

### تم التنفيذ
- جمّدت واقع المستودع عند `main` وHEAD `eadc26390534194dc581dd5dce77c181f490af57`، وسجلت Node `22.22.3` مقابل عقد المشروع `>=24.20.0 <25`، وpnpm `11.25.0`، وmigration head الموجود في المستودع `0018`.
- أنشأت baseline تدقيق مستقل يغطي المجالات 100 كلها، مع طريقة score قابلة لإعادة الإنتاج عبر أبعاد implementation/test/runtime/documentation/security، بدون قبول نسب أو claims تاريخية.
- سجلت نتائج البوابات الحالية: typecheck/lint/format/unit/build exit 0؛ integration exit 1 بسبب 11 suite لم تجد container runtime؛ E2E exit 1 مع 57/57 فشل بسبب Chromium/localhost permissions.
- وثقت تعارضًا فعليًا بين boundary guard الذي خرج exit 0 وبين وجود `getDatabase()`/infrastructure imports مباشرة في صفحات/Actions Delivery، وربطته بـP0 remediation.
- أضفت gap register وcritical blockers وrequirement-to-evidence matrix، مع فصل الأدلة الحالية عن الأدلة المفقودة وعدم تنفيذ أي إصلاح broad أو production mutation.

### الملفات المتأثرة
- `audit/100-percent/00-REALITY-FREEZE.md`
- `audit/100-percent/01-100-DOMAIN-SCORECARD.md`
- `audit/100-percent/02-GAP-REGISTER.md`
- `audit/100-percent/03-REQUIREMENT-TO-EVIDENCE-MATRIX.md`
- `audit/100-percent/04-CRITICAL-BLOCKERS.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅ exit 0، مع بقاء تعارض المصدر المباشر المسجل في E-12.
- `pnpm typecheck` ✅ exit 0؛ 0 errors و25 hints، مع Node engine warning.
- `pnpm lint` ✅ exit 0.
- `pnpm format:check` ✅ exit 0.
- `pnpm test:unit` ✅ exit 0؛ 24 files / 88 tests.
- `pnpm test:integration` ❌ exit 1؛ 11 suites فشلت عند Testcontainers runtime، 173 tests reported و34 skipped.
- `pnpm build` ✅ exit 0؛ ظهر warning unused `Writable`.
- `pnpm test:e2e --reporter=line` ❌ exit 1؛ 57/57 فشلوا بسبب host Chromium/localhost permissions، وليس دليلًا على سلوك التطبيق.
- فحص `git status`/الفرق ✅؛ لم يحدث commit أو push أو deploy أو production write.

### النتيجة
- **الحالة:** جزئي — baseline التدقيق والـbacklog أُنشئا، لكن الأدلة الحرجة للـPostgreSQL وE2E وUAT والـbackup/restore والـprovider/CI غير متوفرة، ويوجد تعارض Delivery يجب حسمه.
- **مختصر:** هذا السجل لا يعلن أي نسبة إغلاق أو جاهزية؛ هو خط أساس قابل للتكرار للخطوة التالية.

### ملاحظات / مشاكل مفتوحة
- `audit/100-percent/01-100-DOMAIN-SCORECARD.md` يحتوي 100 صف؛ التوزيع الحالي 5 FAIL، 5 PARTIAL، و90 UNVERIFIED.
- يلزم تنفيذ remediation IDs `G-001` إلى `G-020` حسب الأولوية قبل إعادة تقييم أي domain متأثر.
- لا توجد تغييرات implementation ضمن هذا البرومبت؛ لا حاجة لاختبارات TDD لأن المطلوب baseline توثيقي فقط.

## [2026-09-08] — QC-RENDER-POSTGRES-RECOVERY-011: Render production database/environment contract

### تم التنفيذ
- حدّثت `render.yaml` ليعتمد Web Service على `DATABASE_URL` فقط، وأزلت متغيرات bootstrap ذات الاستخدام الواحد من عقد الخدمة.
- أبقيت build/start صريحين بدون migrations أو Foundation seed أو admin bootstrap تلقائيًا.
- بدّلت rate limiter الخاص بتسجيل الدخول إلى مخزن PostgreSQL مشترك بين نسخ Web Service، مع تهيئة lazy حتى لا يقرأ قاعدة البيانات أثناء build.
- استثنيت مساري liveness/readiness من canonical-host redirect حتى يقدر Render يفحصهما على hostname الخدمة، مع بقاء health responses مختصرة وآمنة.
- جعلت readiness يتحقق من عقد البيئة المفسّر حاليًا ومن اتصال PostgreSQL عبر `SELECT 1`، بدون عرض connection details.
- أضفت اختبار عقد Render يتحقق من `DATABASE_URL` وhealth path وغياب bootstrap variables وعدم وجود lifecycle commands في build.

### الملفات المتأثرة
- `render.yaml`
- `src/middleware.ts`
- `src/shared/health/postgres-readiness-probe.ts`
- `tests/unit/render-config.test.ts`

### التحقق
- `pnpm typecheck` ✅ من ناحية الكود عبر `astro check` على Node المضمّن `24.19.0`؛ 0 errors و25 hints deprecated قائمة سابقًا.
- `pnpm lint` ✅ عبر ESLint المباشر.
- `pnpm format:check` ✅ عبر Prettier المباشر.
- `pnpm build` ✅ عبر Astro المباشر؛ لا migrations/seed/bootstrap أثناء build.
- `pnpm test` / `pnpm test:integration` ⚠️ assertions العاملة PASS، لكن 11 suite فشلت لأن Docker/Testcontainers غير متاح في البيئة؛ لا فشل assertion متعلق بالتعديل.
- Artifact smoke ✅ liveness `200 healthy` وreadiness `503 unhealthy` عند قاعدة غير متاحة؛ لا أسرار في الاستجابات.
- `git diff --check` ✅ وفحص literals الحساسة في الملفات المتأثرة ✅؛ لم تُنفذ production writes أو commit أو push.

### النتيجة
- **الحالة:** جزئي — الكود والعقد المحليان ناجحان، والتحقق الفعلي من إعدادات Render Dashboard/الاتصال الداخلي لم يُنفذ من هذه الجلسة.
- **مختصر:** عقد Render صار يستخدم `DATABASE_URL` canonical، والـrate limiting والـhealth semantics مناسبة للإنتاج؛ يلزم تطبيق القيم السرية يدويًا في Render وتشغيل اختبارات PostgreSQL في بيئة فيها Docker أو قاعدة اختبار معتمدة.

### ملاحظات / مشاكل مفتوحة
- runtime المضمّن أقل من العقد الدقيق للمشروع (`24.19.0` بدل `>=24.20.0`، وpnpm `11.19.0` بدل `11.25.0`)؛ Render يجب أن يستخدم `NODE_VERSION=24.20.0` ونسخة pnpm المحددة من `packageManager`.
- `OTEL_EXPORTER_OTLP_ENDPOINT` و`OTEL_EXPORTER_OTLP_HEADERS` اختياريان لكن يجب ضبطهما معًا أو تركهما معًا فارغين.
- في Render: حط `DATABASE_URL` على Internal Database URL للـWeb Service فقط، و`SESSION_SECRET`، وعتبات rate limit، و`SERVICE_VERSION`؛ لا تضف `Internal_Database_URL` كمتغير جديد ولا تعيد متغيرات bootstrap بعد نجاح initial admin.

## [2026-09-08] — QC-RENDER-POSTGRES-RECOVERY-010: Initial admin bootstrap and authentication PASS

### تم التنفيذ
- تحققت من بوابات الإنتاج الثلاث على Render: migration integrity، foundation authorization، وdatabase preflight؛ كلها PASS على PostgreSQL `18.6` مع `18/18` migrations وpending `0`.
- أنشأت المستخدم الأول `yazeed` باسم عرض `Yazeed` عبر `pnpm bootstrap:admin` بإدخال كلمة مرور مخفي؛ لم تُطبع كلمة المرور ولم تُحفظ في `.env`.
- نفذت read-only verification دقيقة: عدد المستخدمين المطابقين `1`، الحساب ACTIVE، `password_hash` غير فارغ، ADMIN role active وغير revoked، وGLOBAL scope غير revoked.
- تحققت من الصلاحيات canonical الفعالة: `198` permission، `164` role grants، وeffective ADMIN authorization PASS.
- اختبرت authentication implementation فعليًا: login الصحيح نجح، كلمة المرور الخاطئة انرفضت، مسار authorization المحمي نجح، anonymous انرفض، وجلسة الاختبار أُلغيت بعد التحقق.
- تحققت من وجود أحداث bootstrap الثلاثة المتوقعة في audit.
- تأكدت أن متغيرات bootstrap السرية مؤقتة على مستوى العملية فقط، ولا توجد في البيئة الحالية أو `.env`.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm db:migrate:check` ✅ — `18` migrations سليمة.
- `pnpm db:seed:foundation:check` ✅ — `4` أدوار، `198` صلاحية، `164` منح.
- `pnpm db:preflight` ✅ — connectivity/capabilities PASS، pending `0`.
- `pnpm bootstrap:admin` ✅ — administrator created successfully.
- `pnpm bootstrap:admin:check` ✅ — identity/account/role/scope/effective authorization/audit PASS.
- Read-only SQL verification ✅ — exact user/hash/role/scope/audit checks كلها `true`.
- Authentication verification ✅ — valid login، invalid password rejection، protected authorization، anonymous denial.
- فحص بقاء الأسرار محليًا ✅ — لا `DATABASE_URL` أو `BOOTSTRAP_ADMIN_*` في environment أو `.env`.

### النتيجة
- **الحالة:** نجح
- **مختصر:** الأدمن الأول الحقيقي جاهز ومتحقق من الحساب والـArgon2id hash والصلاحيات والنطاق والتدقيق والمصادقة؛ `INITIAL ADMIN READY`.

### ملاحظات / مشاكل مفتوحة
- متغيرات Render ذات الاستخدام الواحد التي لا ينبغي إبقاؤها: `BOOTSTRAP_ADMIN_PASSWORD`، `BOOTSTRAP_ADMIN_IDENTITY`، `BOOTSTRAP_ADMIN_DISPLAY_NAME`، و`BOOTSTRAP_ADMIN_EMAIL` إن وُجد؛ تُحذف بعد نجاح bootstrap.
- رابط اتصال قاعدة البيانات احتوى credential إنتاجي ضمن سياق المهمة؛ يفضّل تدوير credential قاعدة البيانات عبر Render بعد انتهاء الاستعادة التشغيلية.

## [2026-09-08] — QC-RENDER-POSTGRES-RECOVERY-010: Initial admin created; authentication verification interrupted

### تم التنفيذ
- شغّلت بوابات الإنتاج المطلوبة على Render باستخدام Node `24.20.0`: migration integrity، foundation authorization، وdatabase preflight؛ كلها PASS.
- أكدت حالة قاعدة البيانات: PostgreSQL `18.6`، قاعدة `qc_operations`، migrations `18/18`، pending `0`، وFoundation `4` أدوار / `198` صلاحية / `164` منح.
- أنشأت المستخدم الأول `yazeed` باسم عرض `Yazeed` عبر `pnpm bootstrap:admin` باستخدام إدخال كلمة مرور مخفي؛ كلمة المرور لم تُطبع ولم تُحفظ في `.env`.
- شغّلت `pnpm bootstrap:admin:check` ونجح: المستخدم موجود، الحساب ACTIVE، ADMIN role، GLOBAL scope، effective authorization، وثلاثة bootstrap audit actions موجودة.
- بدأت تجهيز اختبار authentication الصحيح والخاطئ ومسار authorization المحمي، لكن أداة `tsx -e` فشلت قبل التنفيذ بسبب `top-level await` ثم أُوقفت الجولة من المستخدم؛ لم يُثبت login الفعلي.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- `scripts/db/seed-foundation.ts` و`tests/unit/db/` — تعديلات محلية سابقة موجودة قبل هذه المهمة ولم أعدّلها ضمن bootstrap.

### التحقق
- `pnpm db:migrate:check` ✅ — `18` migrations سليمة.
- `pnpm db:seed:foundation:check` ✅ — `Roles: 4`, `Permissions: 198`, `Role permissions: 164`.
- `pnpm db:preflight` ✅ — connectivity/capabilities PASS، pending `0`.
- `pnpm bootstrap:admin` ✅ — `Initial administrator created successfully.`
- `pnpm bootstrap:admin:check` ✅ — identity/account/role/scope/effective authorization/audit PASS.
- Authentication valid/invalid + protected HTTP path ⏸️ — لم يكتمل بعد إيقاف الجولة؛ لا يُستنتج منه PASS.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تم إنشاء الأدمن الحقيقي والتحقق من حالته وصلاحياته وسجل bootstrap، لكن لا يمكن إعلان `INITIAL ADMIN READY` قبل إكمال اختبار authentication المطلوب.

### ملاحظات / مشاكل مفتوحة
- يلزم إعادة تشغيل اختبار login الصحيح والخاطئ، والتحقق من مسار ADMIN المحمي ورفض anonymous، ثم توثيق النتائج.
- متغيرات bootstrap السرية كانت مؤقتة داخل العملية ولم تُحفظ في `.env`; يلزم مراجعة إعدادات Render ذات الصلة بعد إكمال التحقق.

## [2026-09-08] — QC-RENDER-POSTGRES-RECOVERY-009: Render migration PASS، Foundation BLOCKED

### تم التنفيذ
- تحققت قراءةً فقط من هدف Render المقدم: قاعدة `qc_operations`، المستخدم `qc_operations_user`، PostgreSQL `18.6`، وTLS/DNS ناجحان بدون طباعة رابط الاتصال أو بيانات الاعتماد.
- سجل PRE-WRITE evidence أن `qc` غير موجود، جداول التطبيق `0`، و`schema_migrations` غير موجود قبل الكتابة.
- نفذت `pnpm db:migrate` canonical وطبقت migrations من `0001` إلى `0018` بدون pending.
- نجحت `db:migrate:status` و`db:migrate:check` و`db:preflight`: `18` مطبقة، pending `0`، integrity/checksum `ok`، و`qc.users` وledger موجودان.
- نفذت `pnpm db:seed:foundation`؛ رجع الأمر exit 0 لكنه لم يخرج رسالة النجاح ولم يكتب permissions/grants.
- أوقفـت المسار بعد فشل `db:seed:foundation:check`؛ لم يُنشأ أي مستخدم، ولم يُشغّل bootstrap أو أي إعادة seed.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- PRE-WRITE read-only evidence ✅ — PostgreSQL 18.6، `qc` غير موجود، tables `0`، migrations `0`.
- `pnpm db:migrate` ✅ — `18/18` applied.
- `pnpm db:migrate:status` ✅ — pending `0`.
- `pnpm db:migrate:check` ✅ — `status=ok`, migrations `18`.
- `pnpm db:preflight` ✅ — connectivity/read-only capabilities PASS.
- `pnpm db:seed:foundation` ⚠️ — exit 0 بلا رسالة نجاح؛ ثبتت القراءة النهائية أنه no-op.
- `pnpm db:seed:foundation:check` ❌ — Roles `4`، Permissions `0`، Role permissions `0`، drift detected.
- Final read-only counts ✅ — migrations `18`، application tables `60`، users `0`.

### النتيجة
- **الحالة:** محجوب
- **مختصر:** تم تهيئة migrations على قاعدة Render الصحيحة، لكن Foundation لم يُطبق وcheck فشل؛ لذلك `PRODUCTION INITIALIZATION: BLOCKED` و`ADMIN USER CREATED: NO`.

### ملاحظات / مشاكل مفتوحة
- السبب الجذري المرصود: entrypoint لأمر Foundation seed رجع بنجاح دون تنفيذ/رسالة نجاح، بينما check كشف أن permissions/grants غير موجودة؛ يحتاج إصلاحًا ومراجعة واختبارًا منفصلًا قبل إعادة تشغيل seed.
- الحالة الحالية في قاعدة Render: roles `4`، permissions `0`، role grants `0`، users `0`، migrations `18`، application tables `60`.
- تحذير بيئة متكرر: Node الحالي `22.22.3` والمطلوب `>=24.20.0 <25`؛ لم يمنع migration لكنه يجب معالجته قبل إعادة التشغيل المعتمد.

## [2026-09-08] — جعل PROMPT 009 مستقلًا عن البرومبتات السابقة

### تم التنفيذ
- عدّلت قسم `PRECONDITIONS` في PROMPT 009 لإلغاء الاعتماد الإلزامي على Task 007 وTask 008.
- وضّحت أن PROMPT 009 يبدأ كمسار مستقل، ويقرأ هوية قاعدة البيانات وحالة migrations مباشرة قبل الكتابة.
- أبقيت إيقاف المهمة إذا تعذر التعرف الآمن على الهدف أو ظهرت حالة غير متوقعة، حفاظًا على بوابة الكتابة الإنتاجية.

### الملفات المتأثرة
- `audit/prompt2.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- مراجعة diff الخاص بـPROMPT 009 ✅
- `git diff --check` ✅
- لم تُشغّل اختبارات التطبيق؛ التغيير توثيقي في ملف التدقيق فقط.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار PROMPT 009 قابلًا للتنفيذ بشكل مستقل بدون تحقق مسبق من 007 و008، مع بقاء فحص الحالة الحالية قبل أي mutation.

### ملاحظات / مشاكل مفتوحة
- لا يوجد.

## [2026-09-08] — QC-READINESS-REMEDIATION-010: Actions unification + zero typecheck + full local gates + disposable PG rehearsal

### تم التنفيذ
- وحّدت `src/actions/index.ts` تحت `export const server` واحد مع إبقاء 16 namespace متداخلة (مدعومة من Astro 4.16.19: `toActionProxy` + `getAction` traversal + أنواع `server`)، وحدّثت 3 استخدامات `actions.server.*` إلى `actions.login/logout`؛ أثبت العقد باختبار TDD (أحمر 5/5 قبل، أخضر بعده).
- أغلقت typecheck من `197` إلى `0` (exit 0): إصلاح 8 صفحات بنمط `Awaited<ReturnType<...>>` الناقص، حذف 12 توجيه ts-expect-error زائد، إصلاح Chart.astro (سطر frontmatter مضغوط كان يكسر parsing الملف كاملًا)، و Houdini متفرقة (unions، readonly، عناصر مفقودة).
- أغلقت lint من `86` إلى `0` وformat من `232` ملف إلى `0` (prettier --write تنسيق فقط؛ لا .astro)؛ أضفت vitest aliases لـ`astro:actions`/`astro:schema` على runtime الخادم الحقيقي.
- كشفت وأصلحت 3 bugs حقيقية كانت مخفية بـ`any`: تعبير `db.fn('coalesce',1)` مكسور في findings-transition (أُزيل ليتطابق مع siblings)، وعدّ rcas بـ`owner_id` غير موجود (42703) فُصل لاستعلام خاص، واختبار تزامن متقطع وُثّق سباقه (stale-vs-post-commit) بدل إخفائه.
- شغّلت كل البوابات على Node 24.20.0: test ‏286/286، integration ‏207/207، build ناجح (أُعيد بعد آخر تعديل)، e2e ‏44 نجح/0 فشل/13 تخطي مشروط بـfixture، والـHTTP من الـartifact: live ‏200 وlogin ‏200 و`_actions/*` ‏400 تحقق مقابل ‏404 وهمي.
- نفّذت بروفة Task 007 على PostgreSQL 18.6 مؤقتة بـTLS: migrate ‏18/18، status/integrity/preflight PASS، seed ‏4 أدوار/198 صلاحية/164 منح + check، bootstrap-admin + check (ADMIN/GLOBAL/effective/audit)، rerun آمن، readiness ‏200 من الـbuild.

### الملفات المتأثرة
- `src/actions/index.ts` + `src/pages/login.astro` + `src/pages/account.astro` + `src/ui/shell/UserMenu.astro`
- `src/actions/change-requests.ts` + `src/actions/quarantine.ts`
- 8 صفحات quarantine/documents + `src/pages/system/health.astro` + `src/pages/tasks/*` + `src/pages/change-requests/*/review.astro` + `src/pages/system/backups/*/restore.astro`
- `src/ui/charts/Chart.astro` + `src/shared/authorization/policy-registry.ts` + `src/shared/database/*` (قراءة فقط)
- `src/modules/quality/{capa,findings,ncr,rca}/*` + `src/modules/quality/infrastructure/postgres-quality-overview.ts` + `src/modules/laboratory/*` + `src/modules/identity/application/create-user.ts` + `src/modules/{ai-advisory,documents}`
- `tests/integration/actions/server-contract.test.ts` (جديد) + `tests/integration/concurrency/controlled-mutations.test.ts` + `tests/e2e/{documents,approvals,authorization-matrix}.spec.ts` + إصلاحات `any` في ~12 ملف اختبار
- `vitest.config.ts` + تنسيق prettier لملفات كثيرة + `tests/performance/smoke.mjs` + `src/env.d.ts` + `src/ui/client/e-signature.ts`

### التحقق
- `pnpm install --frozen-lockfile` ✅ و`pnpm typecheck` ✅ exit 0 و`pnpm lint` ✅ exit 0 و`pnpm format:check` ✅ و`pnpm test:architecture` ✅ و`git diff --check` ✅
- `pnpm test` ✅ ‏88 ملف / 286 نجح و`pnpm test:integration` ✅ ‏67 ملف / 207 نجح و`pnpm build` ✅ و`pnpm test:e2e` ✅ ‏44 نجح / 0 فشل / 13 تخطي (fixture-gated)
- اختبار العقد: أحمر 5/5 على العقد القديم، أخضر 5/5 بعده ✅
- بروفة disposable: ‏60 جدولًا، users=1، audit=3، rerun آمن ✅
- فحص الأسرار في الـdiff ✅ نظيف؛ لا production write ولا commit ولا push

### النتيجة
- **الحالة:** نجح محليًا بالكامل
- **مختصر:** كل البوابات المحلية خضراء والـrehearsal مكتمل على قاعدة مؤقتة؛ العائق الوحيد المتبقي خارجي: لا يوجد اتصال Render مدوّر معتمد، فلا انتقال للإنتاج.

### ملاحظات / مشاكل مفتوحة
- إصلاحا findings-version وrcas-owner_id يغيّران سلوكًا كان مكسورًا (رمي/خطأ) إلى سلوك الـsiblings؛ يستحقان مراجعة دومين قبل أي إنتاج.
- `DATABASE_URL` الإنتاجي ما زال غائبًا؛ Task 008 يحتاج اتصالًا مدوّرًا عبر secret mechanism المعتمد.
- RENDER PRODUCTION WRITE GATE = BLOCKED وPRODUCTION TARGET = NOT CONFIRMED.
- PRODUCTION WRITES PERFORMED = NO وPRODUCTION ADMIN USER CREATED = NO.

## [2026-09-08] — مراجعة prompt2 والبيئة قبل recovery 010

### تم التنفيذ
- راجعت برومبتات 003–012 وسجل النتائج وrunbooks والكود باستخدام verification-before-completion.
- فحصت `.env` بحجب القيم: حقول provider السبعة موجودة، و`DATABASE_URL` غائب بالملف وبيئة العملية؛ الملف ignored وغير tracked وصلاحياته `644`. التدوير غير متحقق.
- رصدت side-effect imports لملف تحميل البيئة الذي يصدّر دالة فقط دون تنفيذ تلقائي، وحساب pending بفرق العدد وغياب TLS evidence من preflight.
- راجعت تجميع Actions الحالي تحت server واحد دون ادعاء نجاح typecheck أو RPC، وأوصيت ببوابة 009A ومراجعة هوية الإصدار ودليل الاستعادة قبل الإغلاق.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md` فقط؛ البرومبت والبيئة والكود لم تتغير ضمن المراجعة.

### التحقق
- قراءة الملفات وفحص أسماء إعدادات البيئة وGit tracking ✅.
- Render والتدوير والمigrations الإنتاجية: NOT VERIFIED؛ لا اتصال أو كتابة إنتاجية.
- build/tests لم تُشغّل: الطلب مراجعة برومبتات.

### النتيجة
- **الحالة:** نجحت المراجعة؛ نجاح Task 009 غير مثبت بالأدلة المحلية المتاحة.
- **مختصر:** يلزم ربط تقدم البرومبتات بنتائج موثقة ومعالجة فجوات التحميل وpreflight قبل متابعة إنشاء الأدمن.

## [2026-09-07] — Production Readiness: Astro 4 API alignment (partial) + gates BLOCKED, no production write

### تم التنفيذ
- ثبت Node `24.20.0` وpnpm `11.25.0` لكل البوابات، وفحصت واقع git عند HEAD `dd7a544` مع working tree فيه rollback Astro 4 وremediation سابق بدون commit/push.
- شخصت typecheck منهجيًا: baseline `377` خطأ، والسبب الجذري الأول غياب `extends: astro/tsconfigs/strict` فكانت virtual modules `astro:actions`/`astro:middleware` بدون أنواع (35 خطأ 2305 + cascade implicit-any).
- أصلحت `tsconfig.json` بإضافة `extends: astro/tsconfigs/strict`، وأزلت إعادة تعريف `PROD`/`NODE_ENV` المتعارضة من `src/env.d.ts`.
- طابقت `ActionError` مع Astro 4 (`new ActionError({ code, message })`) في 9 ملفات actions بدل الصيغة الثنائية، وصلحت `DisabledAiProvider.complete` لتطابق interface `AiProvider` بقبول request.
- أعدت القياس: `377` → `242` → `230` → `229` خطأ؛ `2305` و`7031` و`2687` و`2554` صارت صفر.

### الملفات المتأثرة
- `tsconfig.json`
- `src/env.d.ts`
- `src/actions/{account,admin,auth,reports,tasks,findings,ncr,capa,rca}.ts`
- `src/modules/ai-advisory/infrastructure/disabled-ai-provider.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm build` ✅ — exit 0 على Node 24.
- `pnpm test:architecture` ✅ — boundary check passed.
- Focused Vitest `tests/unit/ai-advisory/advisory.test.ts` + `tests/unit/health-live.test.ts` ✅ — 2 files / 15 tests passed.
- `git diff --check` ✅ — نظيف.
- `git check-ignore -v .env` ✅ — ignored، و`git ls-files .env` فارغ؛ فحص diff للأسرار ✅ — بلا credential literal.
- `pnpm typecheck` ❌ — exit 1، المجموع `229` (منها `2339: 126` لأسماء Actions المنقسمة، `2322: 13`، `7006: 12`، `2304: 12`، `Chart.astro CSS: 22`، `6385 deprecation: 25`).
- `DATABASE_URL` في البيئة: MISSING؛ مفاتيح `.env` الحالية provider dump فقط (Hostname/Database/.../PSQL_Command) بدون canonical `DATABASE_URL`.
- `pnpm db:migrate` و`db:seed:foundation` وpreflight إنتاجي لم تُشغّل — إيقاف إلزامي.

### النتيجة
- **الحالة:** محجوب / جزئي
- **مختصر:** إصلاحات API صغيرة وثابتة قللت الأخطاء بـ148 ونجح build والفحوص المركزة، لكن typecheck العام ما زال FAIL بسبب معمارية Actions المنقسمة وأخطاء صفحات، وTask 007/008 غير مثبتين، ولا يوجد credential مدور — لذلك تهيئة Render محجوبة ولم يحدث أي production write.

### ملاحظات / مشاكل مفتوحة
- يلزم مهمة مستقلة لتوحيد `src/actions/index.ts` تحت `server` واحد بأسماء فريدة وتحديث ~23 صفحة تستخدم `actions.<namespace>`، مع معالجة تعارضات `create/transition/submit/review/approve/updateDraft`؛ بدونه تبقى 126 خطأ `2339` وكسر RPC وقت التشغيل للأكشنات غير auth.
- تبقى أخطاء صفحات `2322/2304/7006` و`Chart.astro` (`1005/1381`) وdeprecations `6385` تحتاج معالجة منفصلة جراحية.
- يلزم تدوير credential في Render وتوفير `DATABASE_URL` خارجي مدور عبر secret mechanism قبل أي Task 008 حقيقي؛ لا تُستخدم قيم `.env` الحالية للإنتاج.
- RENDER PRODUCTION WRITE GATE = BLOCKED، وPRODUCTION TARGET = NOT CONFIRMED، وPRODUCTION INITIALIZATION = BLOCKED.

## [2026-09-07] — Astro dependency compatibility rollback

### تم التنفيذ
- رجّعت `astro` من `7.3.1` إلى `4.16.19` لأنه أقرب لواجهات الكود الحالية المستخدمة في Actions/Middleware.
- رجّعت `@astrojs/node` من `11.1.5` إلى `8.3.4` بما يطابق Astro 4.
- أعدت توليد `pnpm-lock.yaml` وثبّتُّ dependencies عبر `pnpm install --frozen-lockfile` بدون عرض أسرار.
- أبقيت تحديث `src/env.d.ts` الذي ولّده Astro لإشارة أنواع `.astro`، وأزلت تعديل `sharp` الجانبي من `pnpm-workspace.yaml`.

### الملفات المتأثرة
- `package.json`
- `pnpm-lock.yaml`
- `src/env.d.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- Astro version ✅ — `4.16.19`
- Node adapter version ✅ — `8.3.4`
- `node node_modules/astro/astro.js build` ✅ — server build اكتمل.
- `pnpm test:architecture` ✅
- Prettier check للملفات المتأثرة ✅
- `git diff --check` ✅
- focused Vitest: **5 files / 19 tests passed** ✅؛ ملفا PostgreSQL فشلا لأن Testcontainers لم يجد container runtime في هذه الجولة، مع teardown error تابع لعدم تهيئة الاتصال.
- `astro check` ❌ — ما زالت أخطاء type/API كثيرة؛ downgrade وحده لم يثبت توافق typecheck الكامل.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تم تثبيت baseline Astro 4 المقصود مع Node adapter المتوافق ونجح build، لكن typecheck الكامل ما زال محجوبًا بأخطاء API/typing قائمة، لذلك لا يُعلن التوافق الكامل.

### ملاحظات / مشاكل مفتوحة
- لا يوجد اتصال أو كتابة على Render، ولا migrations أو Foundation seed في الإنتاج؛ بوابات Task 007/008 ما زالت شرطًا مستقلًا.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-009: local release-gate remediation

### تم التنفيذ
- أضفت route مستقلًا لـ`GET /api/health/live` يرجع `200` و`{"status":"healthy"}` بدون فحص PostgreSQL، وفشل اختبار regression أولًا لغياب route ثم نجح بعد الإضافة.
- صححت upsert الخاص بـPostgreSQL rate limiting بتحديد `rate_limit_windows.request_count` داخل `ON CONFLICT`؛ كان التعبير غير المحدد يفشل في PostgreSQL 18 بـ`42702 ambiguous column`.
- أصلحت عزل وتوقعات اختبارات integration القديمة: test pool للـrate limit يرحّل schema قبل الاستعمال، فحص `PUBLIC CREATE` يقيس ACL العام بدل امتياز مالك قاعدة الاختبار، وassertions تقيس constraint/order الصحيحين.
- صححت اختبارات Tasks/Reporting/Inspection لتقيس permission/matcher/throw semantics الحقيقية، ونسقت الملفات المتأثرة.
- ثبتُّ Node `24.20.0` وpnpm `11.25.0` محليًا لتشغيل البوابات المعتمدة؛ لم يُستخدم Render أو credential إنتاجي.

### الملفات المتأثرة
- `src/pages/api/health/live.ts`
- `src/shared/security/postgres-rate-limit-store.ts`
- `tests/unit/health-live.test.ts`
- `tests/integration/{database/constraints,security/rate-limit,tasks/use-cases,reporting/reports,quarantine/inspection-execution}.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- HTTP live endpoint من production build ✅ — `200 {"status":"healthy"}`.
- focused Node 24 + PostgreSQL 18 integration: **7 files / 27 tests passed** ✅.
- `pnpm test:architecture` ✅، `pnpm build` ✅، scoped ESLint/Prettier و`git diff --check` ✅.
- `pnpm typecheck` ❌ — **343 errors**؛ الجذر الحالي dependency/API mismatch واسع: lockfile يثبت `astro@7.3.1` لكن التطبيق يستخدم exports غير موجودة في هذا الإصدار مثل `defineAction`/`ActionError` و`defineMiddleware`، إضافةً إلى baseline typings خارج نطاق remediation.
- full `pnpm test:integration` شُغّل مع Docker/Testcontainers لكن runner لم يعرض final summary في هذه البيئة؛ لا يُستنتج منه PASS. الفشل المتقطع الأول في concurrency مرّ عند التشغيل المعزول **5/5**.

### النتيجة
- **الحالة:** جزئي / محجوب
- **مختصر:** أصلحت blocker liveness وbug PostgreSQL فعليًا وثبتت المسارات المتأثرة، لكن Task 007 لا يمكن إعلانه PASS مع typecheck العام الفاشل وبدون evidence كامل ثابت للـintegration/E2E. Task 008 وتهيئة Render ما زالت محجوبة لعدم وجود `DATABASE_URL` مدوّر/معتمد في البيئة.

### ملاحظات / مشاكل مفتوحة
- يلزم قرار controlled لتوافق Astro 7/codebase أو استعادة dependency baseline متوافق؛ لا يتم تعديل مئات ملفات Actions/Middleware عشوائيًا.
- بعد إغلاق typecheck وتشغيل full integration وE2E بنجاح، يعاد Task 007. بعدها فقط يلزم توفير اعتماد Render خارجي مدوّر عبر secret mechanism وإعادة Task 008 قبل أي `db:migrate` إنتاجي.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-009: production initialization blocked by unmet gates

### تم التنفيذ
- قرأت سجل الـmind الحالي كاملًا، وراجعت تعليمات المستودع ووثائق تشغيل Render ذات الصلة.
- تحققت من أدلة Task 007 وTask 008 الحالية قبل أي اتصال أو كتابة إنتاجية.
- ثبت أن آخر evidence لـTask 008 يقول `PRODUCTION TARGET: NOT CONFIRMED` و`PRODUCTION WRITE ALLOWED NEXT = NO`.
- ثبت أن آخر evidence لـTask 007 يقول إن بوابة Render production write كانت محجوبة بسبب فشل `/api/health/live` وبوابات جودة أخرى.
- أوقفت المهمة قبل `pnpm db:migrate`؛ لم تُقرأ أو تُطبع أي أسرار، ولم تُنفذ migrations أو seed أو SQL mutation.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- مراجعة preconditions من آخر mind evidence ✅ — الشروط غير مستوفاة.
- فحص git status ✅ — التغيير الوحيد هو سجل الـmind الحالي.
- `pnpm db:migrate` لم يُشغّل — إيقاف إلزامي قبل أي production write.
- Foundation seed/check لم يُشغّل — ممنوع قبل نجاح migration verification.

### النتيجة
- **الحالة:** محجوب
- **مختصر:** لم تبدأ تهيئة قاعدة Render لأن Task 007 وTask 008 غير مثبتين كناجحين في المصدر الأحدث؛ قاعدة البيانات بقيت بدون تغيير.

### ملاحظات / مشاكل مفتوحة
- يلزم إعادة إكمال Task 007 وتوثيق `RENDER PRODUCTION WRITE GATE: PASS`، ثم إعادة Task 008 على Render الحقيقي وتوثيق `PRODUCTION TARGET: CONFIRMED` و`PRODUCTION WRITE ALLOWED NEXT: YES` قبل إعادة هذه المهمة.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-008: Render PostgreSQL read-only target preflight

### تم التنفيذ
- التزمت بوضع production read-only؛ لم تُنفذ أي أوامر `CREATE` أو `ALTER` أو `DROP` أو DML أو صلاحيات، ولم يتم أي migration أو seed أو bootstrap.
- تحققت من وجود إعداد اتصال canonical بدون عرض أي قيمة سرية؛ الإعداد غير موجود في البيئة أو ملف `.env` المقروء بالـallowlist.
- شغّلت `pnpm db:preflight` canonical، لكنه توقف قبل تشغيل preflight بسبب `Corepack EPERM` في cache المحلي.
- شغّلت نفس سكربت preflight مباشرة عبر Node كتحقق بديل؛ رجع `DATABASE PREFLIGHT CONFIGURATION ERROR` لأن إعداد الاتصال غير موجود، لذلك لم يحدث اتصال بقاعدة Render.
- أبقيت النتيجة غير مؤكدة ولم أستنتج هوية قاعدة أو نسخة PostgreSQL أو TLS أو جداول أو migration counts بدون دليل اتصال حالي.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص إعداد الاتصال الآمن بدون طباعة قيم: غائب ✅
- `pnpm db:preflight` ❌ — Corepack `EPERM` قبل تنفيذ السكربت
- preflight المباشر عبر `node --import ... scripts/db/preflight.ts` ❌ — إعداد الاتصال مفقود، بدون اتصال
- فحص read-only: لم تُنفذ أي كتابة أو migration أو SQL mutation ✅

### النتيجة
- **الحالة:** محجوب / غير مؤكد
- **مختصر:** لا يمكن تأكيد Render PostgreSQL الحقيقي من هذا الجهاز؛ بوابة تدوير الاعتماد وبيانات الاتصال الخارجي غير متاحة، لذلك Production Write Allowed Next = NO.

### ملاحظات / مشاكل مفتوحة
- يلزم توفير اعتماد Render خارجي مدوّر عبر secret mechanism المعتمد ثم إعادة تشغيل `pnpm db:preflight` بعد إصلاح صلاحية Corepack المحلية.
- Tasks 001–007 وRender production write gate لا تعتبر مكتملة بناءً على هذا التشغيل؛ آخر evidence في الـmind يذكر أن gate 007 كان محجوبًا.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-007: disposable PostgreSQL 18 production-like release gate

### تم التنفيذ
- شغّلت حاوية PostgreSQL 18.6 disposable محلية مع TLS مؤقت، بدون production credentials أو production connection/write، ونفذت preflight بعد إنشاء schema بنجاح.
- نفذت التسلسل canonical: migrations (`0001`–`0018`)، migration status/integrity، Foundation seed/check، initial-admin bootstrap/check، ثم repeat migration وFoundation seed/check؛ التكرار أعاد migrations بلا applied وFoundation counts ثابتة.
- أثبتت critical database state: 60 جدولًا في `qc`، `schema_migrations=18`، `users=1`، `sessions=1`، `roles=4`، `permissions=198`، `role_permissions=164`، `user_roles=1`، `user_scopes=1`، `audit_events=3`.
- اختبرت authentication عبر `LoginUseCase`: كلمة مرور خاطئة مرفوضة والصحيحة مقبولة وتصدر session؛ واختبرت server-side ADMIN authorization لصلاحية `PERM-IDN-MANAGE-USERS` وقراءة الأدوار read-only، ونجحت (`4` أدوار).
- شغّلت نفس production build محليًا، وتحقق readiness بـ`200 healthy`، بينما `/api/health/live` غير موجود ويرجع `404`، وهو blocker صريح مقابل route contract المطلوب.
- التقطت counts قبل/بعد restart وبقيت schema/auth counts ثابتة؛ أوقفت السيرفر وحذفت حاوية PostgreSQL disposable بعد الاختبار.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- PostgreSQL 18.6 disposable + TLS local ✅
- `db:preflight` بعد schema ✅ — 18 applied / 0 pending
- `db:migrate` ✅ — 18 applied أول مرة، ثم `applied=[]`, `pending=[]`
- `db:migrate:status` وintegrity ✅
- `db:seed:foundation` وcheck ✅ — 4 roles / 198 permissions / 164 grants
- `bootstrap:admin` وcheck ✅ — user active، ADMIN، GLOBAL، effective authorization، audit presence
- restart invariance ✅ — critical counts ثابتة قبل/بعد
- `pnpm typecheck` ❌ — Corepack EPERM على Node `22.22.3`; direct `astro check` فيه baseline type errors
- `pnpm lint` / `pnpm format:check` ❌ — Corepack EPERM؛ direct ESLint **88 errors** وPrettier **235 files**
- `pnpm test` / `pnpm test:integration` ❌ — direct Vitest full: **270 passed / 8 failed**؛ integration: failures في constraints/rate-limit/concurrency/reports/tasks/inspection
- `pnpm build` ✅ بالبديل المباشر `astro build`
- E2E ❌ — **10 passed / 47 failed**؛ Playwright Chromium غير مثبت، وظهر أيضًا `ERR_MODULE_NOT_FOUND` من build chunks أثناء HTTP action paths

### النتيجة
- **الحالة:** محجوب
- **مختصر:** rehearsal أثبت مسار PostgreSQL/Foundation/bootstrap والتكرار والـrestart على قاعدة disposable، لكن release gate لا يمر بسبب `/api/health/live` المفقود، quality-gate failures، ومشاكل E2E/runtime artifact؛ لم يتم الانتقال إلى Render.

### ملاحظات / مشاكل مفتوحة
- إضافة/تثبيت عقد `/api/health/live` مطلوبة قبل إعادة gate.
- يلزم إصلاح أخطاء typecheck/lint/format والـ8 اختبارات الفاشلة، ومعالجة Playwright browser و`dist` chunk loading قبل إعادة E2E.
- لا يوجد production write ولا commit ولا push.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-006: hardened one-time initial administrator bootstrap

### تم التنفيذ
- أضفت الأمر read-only `pnpm bootstrap:admin:check`؛ مخرجاته محصورة في وجود المستخدم، نشاط الحساب، ADMIN role، GLOBAL scope، effective ADMIN authorization، وbootstrap audit presence، بدون password/password_hash/session token/DATABASE_URL.
- جعلت `bootstrap:admin` يشترط اكتمال migrations ونجاح canonical Foundation authorization check قبل إنشاء الحساب، مع exact ADMIN grant set وADMIN system role active.
- أبقيت العملية explicit operator-only وcreate-only؛ identity موجودة مسبقًا ترجع `ALREADY_EXISTS` بدون reset password أو تغيير role/scope/account، والـbootstrap لا يوجد له استدعاء من build/migration/seed/startup/Render deploy.
- صححت authorization resolver ليقرأ `user_scopes` الفعلية بدل منح كل actor `OWN + GLOBAL` ضمنيًا، وربطت check باختبار server-side فعلي لـ`PERM-IDN-MANAGE-USERS` عبر GLOBAL scope.
- ثبّتُّ redaction لأخطاء bootstrap/check بحيث لا تطبع bootstrap password أو DATABASE_URL، وحدّثت runbook، وصححت اختبار Argon2id القديم ليختبر hash/verify الحقيقي بدل توقع dependency مفقودة.

### الملفات المتأثرة
- `scripts/bootstrap/create-initial-admin.ts`
- `scripts/bootstrap/check-initial-admin.ts`
- `src/modules/identity/application/bootstrap-initial-admin.ts`
- `src/modules/identity/application/bootstrap-admin-check.ts`
- `src/modules/identity/application/identity-dependencies.ts`
- `tests/integration/bootstrap/initial-admin.test.ts`
- `tests/unit/bootstrap/bootstrap-check.test.ts`
- `tests/unit/identity/password-hasher.test.ts`
- `docs/operations/INITIAL-ADMIN-BOOTSTRAP.md`
- `package.json`

### التحقق
- PostgreSQL 18 disposable focused proof: **5/5 tests passed**؛ شمل migration/seed precondition، atomic fail-closed بدون partial user، create، exact ADMIN role/GLOBAL scope/audit، repeat existing behavior، Argon2id hash، login الصحيح والخاطئ، disabled-account denial، safe check، وADMIN-protected authorization ✅
- Focused bootstrap/password/config/check suites: **4 files / 14 tests passed** ✅
- `node scripts/architecture/check-boundaries.mjs` ✅، `astro build` ✅، scoped ESLint ✅، scoped Prettier ✅، `git diff --check` ✅
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration` لم تبدأ عبر pnpm بسبب Corepack EPERM على Node المحلي `22.22.3`؛ direct equivalents سُجلت كما يلي: full Astro check baseline errors، full ESLint baseline **88 errors**، full Vitest **241 passed / 4 failed / 33 skipped**، وfull integration فيه failures baseline متعددة مع suites PostgreSQL التي احتاجت disposable runtime.
- Full integration شُغّل أيضًا عبر Vitest مع Docker escalation؛ bootstrap suite نجحت، بينما بقيت failures مستقلة في Tasks/Rate Limit/Concurrency/Constraints/Reports/Inspection.
- smoke تشغيل `bootstrap:admin:check` ببيئة وهمية أعاد connection error operator-safe بدون password أو DATABASE_URL، ولم يُستخدم أي production credential أو production database.

### النتيجة
- **الحالة:** نجح نطاق bootstrap والتحقق disposable؛ بوابات المشروع العامة **جزئية** بسبب baseline/بيئة Node 22/Corepack، وليست blocker في الكود المعدل.
- **ADMIN BOOTSTRAP:** PASS — explicit only، create-only، preconditions، check command.
- **ATOMICITY:** PASS — rollback/no partial account في disposable PostgreSQL 18.
- **PASSWORD SECURITY:** PASS — canonical Argon2id، لا plaintext/log/output/error leakage في المسار المعدل.
- **ROLE:** PASS — canonical active ADMIN role.
- **GLOBAL SCOPE:** PASS — persisted GLOBAL scope ويقرأه resolver فعليًا.
- **EFFECTIVE AUTHORIZATION:** PASS — server-side `authorize` ينجح فقط مع canonical grants + GLOBAL scope.
- **AUTHENTICATION:** PASS — LoginUseCase يقبل السر الصحيح ويرفض الخاطئ/الحساب المعطل.
- **PRODUCTION DB UNCHANGED:** PASS — لا production connection/write أو Render action.

### ملاحظات / مشاكل مفتوحة
- يجب تشغيل full quality gates في بيئة Node `24.20.0` مع Corepack/dependencies صحيحة، ومعالجة baseline failures المستقلة قبل إعلان repository-wide PASS.
- لم يُنفذ production bootstrap؛ القيم الحقيقية وهوية `yazeed` في production ما زالت تتطلب تشغيل operator صريح بعد Foundation check.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-005: canonical production-safe authorization Foundation

### تم التنفيذ
- أضفت مصدرًا canonical لأدوار Foundation الأربعة (`EMPLOYEE`, `SUPERVISOR`, `MANAGER`, `ADMIN`) وربطت `role_permissions` فقط بقرارات `ALLOW` الصريحة في `Documents/PERMISSION-MATRIX.md`؛ صلاحيات `POLICY` و`CONDITIONAL` و`DENY` بقيت بلا grant.
- وسّعت seed المعاملة الحالية لتصبح deterministic/idempotent للأدوار والصلاحيات وrole-permissions، بدون users أو credentials أو حذف grants موجودة.
- أضفت `pnpm db:seed:foundation` و`pnpm db:seed:foundation:check`؛ check read-only ويكشف missing/inactive/unexpected roles/permissions، missing/forbidden/duplicate grants، وnon-system canonical roles.
- حدّثت initial-admin bootstrap ليرفض إنشاء أو إعادة استخدام administrator إذا كانت canonical ADMIN authorization ناقصة، بدل اعتبار وجود دور ADMIN كافيًا.
- حدّثت اختبارات seeds/bootstrap لتتحقق من effective grants وتساوي counts بعد التشغيل المتكرر، ووثقت التسلسل التشغيلي الإنتاجي.

### الملفات المتأثرة
- `db/seeds/common.ts`
- `scripts/db/seed-foundation.ts`
- `scripts/db/check-foundation-seed.ts`
- `src/modules/identity/application/bootstrap-initial-admin.ts`
- `tests/unit/seeds-factories.test.ts`
- `tests/integration/database/seeds.test.ts`
- `tests/integration/bootstrap/initial-admin.test.ts`
- `docs/operations/INITIAL-ADMIN-BOOTSTRAP.md`
- `package.json`

### الأرقام والقرارات
- المصدر canonical الحالي يعطي: **4 roles، 198 permissions، 164 explicit role-permission grants**.
- لم تُمنح صلاحيات business لـADMIN بشكل شامل؛ مصفوفة الصلاحيات نفسها تترك release/approval/void/production restore وغيرها `POLICY` أو `DENY UNTIL APPROVED`.

### التحقق
- TDD: اختبار المصدر فشل قبل تعريف grants ثم نجح بعد التنفيذ — **2 files / 9 tests** ✅.
- Scoped ESLint ✅، scoped Prettier ✅، `node scripts/architecture/check-boundaries.mjs` ✅، `astro build` ✅.
- `pnpm typecheck` و`pnpm lint` و`pnpm format:check` و`pnpm test` و`pnpm test:integration` شُغّلت كما طلبت لكنها محجوبة/فاشلة بسبب Corepack EPERM على Node `22.22.3`, baseline formatting/type/test failures، وغياب Docker/Testcontainers runtime.
- PostgreSQL 18 disposable sequence لم تُثبت: Docker socket غير متاح، ولم تُستخدم قاعدة production أو credentials أو أي production write.

### النتيجة
- **الحالة:** جزئي — كود Foundation وdrift/bootstrap gates مكتوب ومتحقق static/unit/build، لكن IDENTITY/DB runtime evidence وfull gates غير مكتملة بسبب البيئة.
- **FOUNDATION:** UNVERIFIED runtime
- **ROLE MATRIX:** جزئيًا مطابق للـALLOW الصريح؛ policy-dependent grants غير ممنوحة
- **PERMISSION MATRIX:** PASS للمصدر المغلق، مع بقاء قرارات POLICY خارج النطاق
- **IDEMPOTENCY:** static/unit PASS؛ PostgreSQL runtime UNVERIFIED
- **DRIFT CHECK:** implementation PASS by inspection; DB execution UNVERIFIED
- **PRODUCTION DB UNCHANGED:** PASS — لم يتم أي اتصال أو كتابة إنتاجية

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل Docker/Testcontainers على `postgres:18-alpine` ثم تنفيذ migrate → foundation → check → foundation → check وتسجيل counts الفعلية.
- full quality gates تحتاج Node `24.20.0` وCorepack/dependencies سليمة؛ failures القائمة ليست منطقًا جديدًا في هذه المهمة إلا إذا ظهر خلاف ذلك عند تشغيل البيئة المعتمدة.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-004: تشغيل Docker وإثبات PostgreSQL 18

### تم التنفيذ
- شغّلت Docker Desktop محليًا بعد اكتشاف أن CLI كان خارج PATH، ثم استخدمت Testcontainers مع `postgres:18-alpine` وقاعدة مؤقتة.
- نجحت اختبارات migration/managed-user كاملة: **2 files / 6 tests passed**.
- ثبت الاختبار أن credential غير superuser وغير CREATEROLE يرحّل قاعدة فارغة، يملك كل كائنات `qc`، ينفذ DML runtime، وتكون إعادة migration بلا تطبيقات جديدة.
- ثبتت اختبارات rollback (لا probe table ولا ledger row بعد الفشل)، checksum mismatch، upgrade no-op، وadvisory-lock concurrency.
- حدّثت assertion القديم الذي كان يفترض وجود `qc_app_runtime` ليتحقق من عدم إنشاء الأدوار المخصصة مع بقاء `public CREATE` ممنوعًا.
- أعاد build النهائي النجاح، وبقيت حاويات الاختبار disposable ولم تُستخدم قاعدة Render أو production.

### الملفات المتأثرة
- `scripts/db/migrate.ts`
- `tests/integration/database/constraints.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `NODE_ENV=test vitest run tests/integration/database/migrations.test.ts tests/integration/database/managed-privileges.test.ts` ✅ — 6/6.
- `vitest run tests/integration/database` سابقًا: 11/15؛ أربع failures في constraints baseline/expectations، منها assertion الأدوار الذي تم تحديثه الآن.
- `node_modules/.bin/astro build` ✅.
- Scoped Prettier وESLint و`git diff --check` ✅.
- CLI sequence المباشر لم يُعتمد على الحاوية لأن TLS المحلي غير مفعّل؛ connection helper يرفض plaintext عمدًا، بينما Testcontainers integration نجحت عبر pool الاختبار.

### النتيجة
- **الحالة:** جزئي — migration architecture وmanaged PostgreSQL 18 evidence نجحا؛ full repository gates ليست نظيفة.
- **مختصر:** صار عندنا دليل فعلي على PostgreSQL 18 وcredential مُدار محدود الصلاحيات، لكن لا يوجد claim بأن كل suite أو الإنتاج جاهز.

### ملاحظات / مشاكل مفتوحة
- بقيت ثلاث failures قديمة في `constraints.test.ts` تحتاج معالجة منفصلة: PostgreSQL error-code expectation، ترتيب expected tables، وبيانات receiving test غير المكتملة.
- `pnpm` gates وfull typecheck/lint/format ما زالت متأثرة ببيئة Node 22 وbaseline repository errors؛ لم تُستخدم لتبرير نجاح migration.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-004: إصلاح نموذج صلاحيات migrations لـRender والتحقق المحدود

### تم التنفيذ
- أزلت من migrations `0001` و`0002` و`0003` و`0005`–`0016` و`0018` إنشاء/تحويل أدوار PostgreSQL ومنح الصلاحيات لـ`qc_migrator`/`qc_app_runtime`؛ أبقيت `REVOKE` لعزل `public` و`qc`.
- ثبّتُّ MODE A: credential واحد من Render يملك `qc` والكائنات ويخدم migration runner وruntime؛ لا يحتاج `SUPERUSER` أو `CREATEROLE` أو `ALTER OWNER` أو `SET ROLE`. MODE B غير مطلوب في المعمارية الحالية.
- أضفت فحصًا صريحًا لصلاحية `CREATE` على قاعدة البيانات وschema `qc`، وفحص ownership يمنع pending migrations على قاعدة legacy ذات ملكية خارج `current_user` بدل نقل الملكية بصمت.
- أضفت compatibility allowlist للـSHA-256 القديمة الدقيقة للمigrations المتأثرة، بحيث لا يُرفض ledger legacy الصحيح ولا يُقبل checksum معدل عشوائيًا؛ migration files الجديدة تسجل checksums الحالية.
- أضفت اختبار rollback لا يكتب صفًا فاشلًا في `qc.schema_migrations`، واختبار managed principal ينشئ قاعدة/credential غير superuser وغير CREATEROLE عندما يتوفر Testcontainers.
- وثقت الصلاحيات المطلوبة وتسلسل التشغيل والقيود في `docs/operations/RENDER-MIGRATION-RUNBOOK.md` وحدّثت audit السابق ليشير لقرار المعمارية الحالي.

### الملفات المتأثرة
- `db/migrations/0001_core_schema.sql`، و`db/migrations/0002_identity.sql`، `0003_authorization.sql`، `0005`–`0016`، `0018_rate_limit_windows.sql`
- `scripts/db/migrate.ts`
- `tests/integration/database/migrations.test.ts`
- `tests/integration/database/managed-privileges.test.ts`
- `db/migrations/README.md`
- `docs/operations/RENDER-MIGRATION-RUNBOOK.md`
- `docs/operations/RENDER-POSTGRES-RECOVERY-AUDIT.md`

### التحقق
- فحص SQL الممنوع (`CREATE ROLE`/`OWNER TO`/منح `qc_app_runtime`) ✅ — لا نتائج داخل migrations.
- `node_modules/.bin/prettier --check` للنطاق ✅، وESLint للنطاق ✅، و`git diff --check` ✅.
- اختبارات unit المرتبطة (`tests/unit/database` و`tests/unit/shared/validation.test.ts`) ✅ — 12/12.
- `node_modules/.bin/astro build` ✅.
- `tests/integration/database/migrations.test.ts` و`managed-privileges.test.ts` ❌/UNVERIFIED — Testcontainers اختار `postgres:18-alpine` لكنه توقف قبل التشغيل بسبب عدم وجود Docker/container runtime؛ 6 اختبارات صارت skipped.
- full `typecheck` ❌ بسبب baseline Astro/actions/dependency errors خارج المهمة؛ full lint ❌ بـ88 baseline errors؛ full format ❌ بـ238 ملف baseline. لا يوجد نجاح زائف من هذه البوابات.
- لم تُستخدم قاعدة Render أو أي secret إنتاجي، ولم تُشغّل migration على production.

### النتيجة
- **الحالة:** جزئي / BLOCKED للتحقق البيئي.
- **مختصر:** تم إصلاح التصميم الثابت ومسار compatibility، لكن لا يمكن إعلان Render-compatible أو PASS لـPostgreSQL 18/managed-user/rollback/checksum/concurrency حتى يعمل disposable PostgreSQL 18 فعليًا.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل نفس suite على PostgreSQL 18 disposable مع Docker/Testcontainers، ثم تشغيل `db:preflight` و`db:migrate` و`db:migrate:status` و`db:migrate:check` وrepeat migration وتوثيق counts/objects/ownership.
- compatibility للـlegacy لا يصلح DB legacy ذات pending migrations تلقائيًا؛ يلزم provider-admin remediation أو fresh database controlled.
- migration head بقي `0018`؛ checksums الحالية للمigrations المعدلة تغيّرت، والـlegacy hashes محفوظة في runner للتوافق المحدود.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-003: canonical `.env` loading and PostgreSQL TLS gate

### تم التنفيذ
- راجعت حالة 001/002 الحالية: `DATABASE_URL` هو عقد التطبيق، و`.env` غير tracked لكنه ما زال Render provider dump يحتوي credential قديمًا compromised؛ لم تُطبع أي قيمة ولم تُستخدم قاعدة إنتاج.
- أضفت parser محليًا allowlisted وغير shell-based لأوامر `tsx`، مع أولوية المتغيرات المصدّرة من البيئة، وربطته بكل أوامر DB وبـbootstrap؛ حقول `Hostname`/`Password`/روابط Render العرضية تُتجاهل.
- وحّدت إعداد اتصال PostgreSQL للـruntime/preflight/bootstrap/readiness: `sslmode` الصريح يُحترم، و`sslmode=disable` مرفوض، وغياب `sslmode` يفعّل certificate verification عبر `rejectUnauthorized=true`.
- أضفت اختبارات parsing وTLS وredaction، وحدثت runbook بخطوة تدوير credential الصريحة: Render Dashboard → PostgreSQL → Credentials → credential جديد → تحديث `DATABASE_URL` بأمان → تحديث الخدمة → preflight → إلغاء القديم.
- أبقيت `.env` provider dump مؤقتًا بدل حذف credential الوحيد قبل تأكيد توفر credential مدور؛ لا يجوز تشغيل production writes أو migrations قبل التدوير.

### الملفات المتأثرة
- `scripts/db/load-local-env.ts`
- `scripts/db/{migrate,preflight,migration-status,check-migration-integrity}.ts`
- `scripts/bootstrap/create-initial-admin.ts`
- `src/shared/database/pool.ts`, `src/shared/health/postgres-readiness-probe.ts`
- `tests/unit/database/preflight.test.ts`
- `docs/operations/RENDER-DATABASE-CONNECTION.md`
- `docs/operations/RENDER-POSTGRES-RECOVERY-AUDIT.md`

### التحقق
- `node node_modules/vitest/vitest.mjs run tests/unit/database/preflight.test.ts tests/unit/shared/validation.test.ts tests/unit/bootstrap/bootstrap-config.test.ts` ✅ — 18/18.
- ESLint scoped للملفات المتأثرة ✅؛ TypeScript scoped لم يُظهر أخطاء في النطاق.
- `node node_modules/astro/bin/astro.mjs build` ✅.
- `pnpm --version` ❌ — Node المحلي `22.22.3` وCorepack احتاج تنزيل pnpm `11.25.0` من الشبكة المحجوبة؛ البدائل المباشرة شُغّلت.
- full typecheck ❌ وfull lint ❌ وfull Vitest جزئيًا (`238 passed / 4 failed / 29 skipped`، و10 PostgreSQL suites محجوبة لغياب container runtime) بسبب baseline موثق خارج النطاق.
- `git check-ignore -v .env` ✅؛ `git ls-files .env` بلا نتيجة؛ `git diff --check` ❌ بسبب trailing whitespace موجود مسبقًا في تعديل المستخدم `audit/prompt2.md`، وليس في ملفات هذه المهمة.
- فحص tracked/diff secret patterns أظهر أمثلة واختبارات وحقولًا توثيقية فقط؛ لم يظهر credential literal في tracked content أو diff، والقيم لم تُعرض.

### النتيجة
- **الحالة:** جزئي / BLOCKED
- **مختصر:** عقد البيئة والتحميل الآمن وسياسة TLS صارت deterministic ومختبرة، لكن تدوير credential الحالي وتنظيف `.env` والتحقق من Render/PostgreSQL الحقيقي لم يتم؛ لذلك Production writes = NO.

### ملاحظات / مشاكل مفتوحة
- يلزم تنفيذ تدوير credential يدويًا في Render، ثم استبدال provider dump بملف `.env` ignored يحتوي `DATABASE_URL` المدور فقط، وبعدها تشغيل preflight read-only بصمت.
- لا تُشغّل `pnpm db:migrate` أو `bootstrap:admin` أو أي production write قبل اكتمال بوابة التدوير والصلاحيات والتأكد من topology.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-003: local Render credential handling audit and safe preflight gate

### تم التنفيذ
- تحققت من واقع `.env` بدون طباعة القيم: الملف ignored وغير tracked، وأسماءه هي `Hostname` و`Database` و`Username` و`Password` وحقول Render العرضية، ولا يطابق أي منها `DATABASE_URL` الذي يتوقعه التطبيق.
- تحققت أن أوامر `tsx` في database/bootstrap تعتمد على `process.env` فقط، ولا تستخدم `dotenv` أو تحميلًا تلقائيًا لـ`.env`.
- حدّثت runbook ليمنع sourcing لملف Render dump، ويثبت أن `.env.example` هو المرجع المتعقب للأسماء فقط، وأن الأسرار تبقى في Render أو shell مؤقت.
- عدّلت workflow الـzsh ليشغل preflight داخل subshell ويزيل `DATABASE_URL` بعد التنفيذ، مع انتهاء البيئة المؤقتة تلقائيًا عند المقاطعة.
- لم أحذف `.env` لأن الوصول إلى credential مدور من Render لم يتأكد، ولم أستخدم credential حقيقي أو أتصل بـRender.

### الملفات المتأثرة
- `docs/operations/RENDER-DATABASE-CONNECTION.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `./node_modules/.bin/vitest run tests/unit/database/preflight.test.ts tests/unit/shared/validation.test.ts` ✅ — 10/10.
- Prettier للـrunbook ✅؛ `git diff --check` ✅.
- فحص tracking/staging ✅ — `.env` غير tracked، والتغيير المرحلي الموجود `.env.example` names-only؛ لا يوجد secret env file staged.
- `pnpm db:preflight` لم يُشغّل: تدوير credential غير مؤكد، التزامًا بقاعدة إيقاف الاتصالات الإنتاجية.
- `pnpm db:migrate` و`bootstrap:admin` لم يُشغّلا.

### النتيجة
- **الحالة:** جزئي / BLOCKED
- **مختصر:** مسار التعامل المحلي الآمن موثق ومصحح، لكن production read-only preflight لم يُنفذ لأن active credential rotation غير مؤكدة.

### ملاحظات / مشاكل مفتوحة
- يلزم تأكيد أن credential السابق تم تدويره وأن credential الحالي متاح من Render؛ بعدها فقط يُنفذ preflight الخارجي بصمت وفق runbook.
- لا توجد أرقام قاعدة بيانات أو PostgreSQL أو migrations يمكن الإبلاغ عنها قبل preflight فعلي.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-002: deterministic PostgreSQL environment and preflight handling

### تم التنفيذ
- ثبّتُّ عقد بيئة الإنتاج في parser: `DATABASE_URL` يجب أن يكون PostgreSQL URL، و`SERVICE_VERSION` صار مطلوبًا في production، وrate-limit variables مطلوبة كزوج، وOTEL variables اختيارية لكن يجب أن تأتي معًا إذا استُخدمت.
- أضفت `pnpm db:preflight` عبر `scripts/db/preflight.ts`: اتصال read-only، PostgreSQL/database/user metadata، وجود `qc` و`qc.users` و`qc.schema_migrations`، applied/pending counts، وcapability checks بدون تعديل schema أو طباعة URL/كلمة مرور.
- فصلت أخطاء `DATABASE_URL` missing/malformed عن أخطاء PostgreSQL/network في preflight وmigration CLI، مع رسائل operator-safe لا تعرض driver credentials.
- أضفت توثيق Render External URL للماك وInternal URL للخدمة عند صلاحية topology، وworkflow zsh يستخدم `read -rs` داخل function ثم يمسح المتغير بعد preflight؛ حدّثت `.env.example` وتعريف Astro env.
- ثبّتُّ command sequence للمطورين على Node `24.20.0` وpnpm `11.25.0` بدون تخفيف engine أو إضافة secrets، مع بقاء `package.json` و`.node-version` و`render.yaml` وCI متطابقة.
- أضفت اختبارات environment/preflight redaction، ونجحت الاختبارات المركزة، بينما لم تُنفذ production migrations.

### الملفات المتأثرة
- `src/config/env.ts`, `src/env.d.ts`, `src/shared/database/pool.ts`
- `scripts/db/preflight.ts`, `scripts/db/migrate.ts`, `scripts/db/migration-status.ts`, `package.json`
- `.env.example`, `docs/development/LOCAL-DEVELOPMENT.md`
- `docs/operations/RENDER-DEPLOYMENT.md`, `docs/operations/RENDER-DATABASE-CONNECTION.md`
- `tests/unit/shared/validation.test.ts`, `tests/unit/database/preflight.test.ts`

### التحقق
- `./node_modules/.bin/vitest run tests/unit/shared/validation.test.ts tests/unit/database/preflight.test.ts` ✅ — 10/10.
- Prettier وESLint للملفات المتغيرة ✅؛ `git diff --check` ✅.
- CLI smoke باستخدام `tsx` خارج sandbox ✅: missing/malformed config وlocalhost network failures صُنفت منفصلة، والقيم الحساسة لم تظهر.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` ❌ قبل التنفيذ بسبب Node المحلي `22.22.3` وCorepack `EPERM` عند cache خارج المسار المسموح؛ البدائل المباشرة أكدت baseline: Astro check `342` errors، full ESLint `89` errors، full Vitest `70` files passed / 4 failed / 29 skipped مع PostgreSQL container runtime غير متاح.
- لم تُشغّل migrations أو preflight على PostgreSQL فعلي، ولم تُستخدم production credentials.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** مسار environment/connection/preflight الآمن موثق ومطبق ومتحقق باختبارات مركزة، لكن full repository gates وreal PostgreSQL evidence ما زالت محجوبة ببيئة Node/container الحالية؛ لا يوجد production migration أو commit أو push.

### ملاحظات / مشاكل مفتوحة
- يجب تشغيل `nvm install 24.20.0` ثم إعادة تثبيت/تشغيل pnpm gates على Node 24، وتوفير disposable PostgreSQL 18 لإثبات نجاح preflight/migrations integration.
- baseline failures خارج نطاق هذه المهمة ما زالت مفتوحة، وRender production topology/credentials لم تُتحقق فعليًا.

## [2026-09-07] — QC-RENDER-POSTGRES-RECOVERY-001: Reality-first Render PostgreSQL recovery audit

### تم التنفيذ
- جمّدت واقع المستودع عند الفرع `main` والـHEAD `9056ef422684a9bc6e8c25029d7ecfaecec92468` مع working tree نظيف، ودوّنت Node المحلي `22.22.3` مقابل Node المطلوب `24.20.0` وتعثر pnpm بسبب Corepack `EPERM` خارج المسار المسموح.
- راجعت مسار migrations والـseeds والـbootstrap والـlogin والـauthorization والـreadiness وRender configuration، وحددت أن `qc.users` تُنشأ في `0001`، و`ADMIN` في `0003`، لكن permission rows و`role_permissions` لا تملك مسار production reproducible مكتمل.
- أثبتت من المصدر أن `0001` يفترض `CREATE ROLE` و`ALTER OWNER` و`GRANT` على PostgreSQL المُدار، وأن `DATABASE_URL` واحد مستخدم للمهاجر/runtime بدون إثبات صلاحيات Render الفعلية أو فصل least-privilege.
- أنشأت تقرير التدقيق `docs/operations/RENDER-POSTGRES-RECOVERY-AUDIT.md` مع إجابات الأسئلة الـ15، blockers، مخاطر checksum/TLS/search_path، فجوات authz/Render، خطة remediation، الاختبارات وترتيب التنفيذ الإنتاجي.
- أجريت فحصًا حاليًا وتاريخيًا للـPostgreSQL URLs/credential assignments مع حجب القيم؛ لم يظهر secret إنتاجي واضح خارج الاختبارات والأمثلة والوثائق والمهارات، ولم أستخدم أو أطبع أي credential.

### الملفات المتأثرة
- `docs/operations/RENDER-POSTGRES-RECOVERY-AUDIT.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- targeted Vitest: `tests/unit/bootstrap/bootstrap-config.test.ts` + `tests/unit/shared/validation.test.ts` ✅ — 13/13.
- `git diff --check` ✅ قبل إنشاء سجل الـmind.
- PostgreSQL 18/Render migration/bootstrap runtime لم يُشغّل: بدون credential، بدون disposable PG runtime، ومع حاجز Node/tsx sandbox الموثق.

### النتيجة
- **الحالة:** BLOCKED
- **مختصر:** لا يوجد حاليًا مسار deterministic موثق ومتوافق مع Render من قاعدة فارغة إلى admin authenticated + authorized؛ السبب الأساسي غياب production foundation grants وعدم إثبات نموذج الصلاحيات/المستخدمين مع Render.

### ملاحظات / مشاكل مفتوحة
- يلزم تدوير credential المكشوف، اعتماد migration/runtime role model، إضافة production-safe permission/grant foundation path، إثبات TLS والصلاحيات، ثم اختبار login عبر HTTP وauthorized reads قبل أي Production Go.

## [2026-09-07] — MASTER-035: Release identity + full CI + developer/operator docs

### تم التنفيذ
- أضفت primitive release identity في `src/config/release.ts` يربط `releaseId` بشكل deterministic مع Git SHA الدقيق، build ID، application/service version، migration head/checksum، وartifact checksum، ويرفض evidence الإنتاجي من working tree dirty/unknown.
- أضفت `scripts/release/release-id.mjs` لإنشاء evidence بعد build و`scripts/release/verify-release.mjs` لإعادة حساب الهوية والتحقق من mismatch بدل قبول metadata غير موثوقة.
- ربطت `RuntimeConfig` باسم الخدمة و`service.version` آمن، وأضافت اختبارات release مركزة تشمل deterministic metadata، dirty production، mismatch، وغياب الأسرار من public fields.
- وسّعت `.github/workflows/ci.yml` إلى frozen install ثم formatting/lint/type/architecture/unit/integration/migration/concurrency/security/build/release evidence/E2E، مع artifact evidence وبدون deployment job أو production secrets.
- أضفت أوامر package parity وكتبت أدلة التطوير والتشغيل الفعلية، مع فصل deployment عن rollback/forward-fix وعن backup/disaster recovery، وربط incident correlation بـrequestId/trace بدل اعتبار logs Audit.

### الملفات المتأثرة
- `.github/workflows/ci.yml`, `package.json`
- `src/config/release.ts`, `src/config/runtime.ts`
- `scripts/release/release-id.mjs`, `scripts/release/verify-release.mjs`
- `tests/unit/release/release-id.test.ts`
- `docs/development/LOCAL-DEVELOPMENT.md`, `docs/development/TESTING.md`
- `docs/operations/RELEASE-RUNBOOK.md`, `docs/operations/INCIDENT-QUICK-REFERENCE.md`

### التحقق
- `pnpm exec vitest run tests/unit/release/release-id.test.ts` ✅ — 7/7.
- `pnpm build` ✅ — Astro server build ناجح، و`serviceVersion` موجود في output المبني.
- `pnpm test:architecture` ✅، و`node --check` لسكريبتات release ✅، وYAML workflow validation ✅، و`git diff --check` ✅.
- Prettier وESLint للملفات الداخلة في المهمة ✅؛ الفحص الكامل ما زال يفشل من baseline موجود في 238 ملف تنسيق و102 lint error خارج النطاق.
- `pnpm typecheck` ❌ — 342 baseline errors خارج ملفات release/config؛ `pnpm test:unit` ❌ — 16 ملف نجح وملفا UI/Argon2 فشلا من baseline.
- `pnpm test:integration`, `pnpm test:migrations`, `pnpm test:concurrency`, وDB-backed security ❌/UNVERIFIED — لا يوجد Docker/Testcontainers runtime محليًا، مع 25 اختبار security غير المرتبط بالـPostgreSQL نجحت قبل تعثر suite rate-limit.
- `pnpm test:e2e` ❌/UNVERIFIED محليًا — 57 اختبارًا حاولت الاتصال، لكن sandbox منع اتصال Playwright بالخادم المحلي بـ`EPERM`; CI workflow يشغّل الخادم المبني قبل E2E.
- Release CLI parity ✅ — إنشاء ثم verify لنفس build/artifact نجح؛ production dirty رفض، وenvironment mismatch رفض؛ فحص الأسرار في الملفات الجديدة بلا نتائج.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** release identity وCI evidence والوثائق أُضيفت وتحققت على المسارات القابلة للتشغيل محليًا، لكن نجاح CI/قاعدة البيانات/E2E والإنتاج ما زال غير مثبت بسبب baseline ومكونات التشغيل المحلية.

### ملاحظات / مشاكل مفتوحة
- Node المحلي `22.22.3` بينما engine المعتمد `>=24.20.0 <25`؛ يجب إعادة تشغيل البوابات على Node 24.20.x.
- Production/UAT/deployment/restore/provider evidence لم تُشغّل، ولا توجد قيم approved جديدة للعلم أو السياسة أو RPO/RTO أو retention أو calibration/retest.
- لم يتغير application version؛ release schema الحالي `1`، ولا يوجد commit أو push أو deployment.

## [2026-09-07] — MASTER-034: Accessibility + failure UX + performance baseline

### تم التنفيذ
- أضفت تغطية Playwright لـ WCAG 2.2 AA باستخدام `@axe-core/playwright`، مسار keyboard يدوي، focus واضح، جداول/رسوم بملخصات نصية، حالات status غير معتمدة على اللون فقط، وreduced-motion؛ الاختبارات المحمية تُعمل skip فقط عند غياب fixture مصادقة معتمد.
- أضفت responsive coverage لمقاسات 320/375/768/1024/1280/1440، portrait/landscape، RTL/LTR، و200% zoom، وأصلحت login فعليًا بإضافة landmark/labels وcontrols بحد أدنى 48px وresponsive shell.
- أضفت اختبارات failure/recovery لـ404 و500 مع request reference بدون stack، readiness dependency failure، IDOR-shaped unauthenticated requests، واختبارات stale-version وAI degradation المربوطة بfixtures؛ لم يُخترع commit truth أو authority عند فشل outbox/notification.
- أضفت `tests/performance/smoke.mjs` لقياس status/bytes/TTFB/total p50/p95 مع release/artifact/environment identity، ودوّنت baseline الفعلي بدون threshold أو SLO مخترع.
- فحصت query shapes ووثقت وجود قوائم غير محدودة وN+1 قائم في laboratory/inspection/tasks وdocument version files؛ لم أعدلها لغياب pagination contract وPostgreSQL dataset معتمد.

### الملفات المتأثرة
- `tests/e2e/accessibility.spec.ts`, `tests/e2e/responsive.spec.ts`, `tests/e2e/error-recovery.spec.ts`
- `tests/performance/smoke.mjs`, `docs/verification/PERFORMANCE-BASELINE.md`
- `src/pages/login.astro`, `package.json`, `pnpm-lock.yaml`

### التحقق
- `pnpm build` ✅ — Astro server build ناجح.
- Playwright scope: `14 passed / 4 skipped` ✅ — axe، keyboard، responsive، 200% zoom، 404/500/readiness/IDOR؛ الـskips بسبب غياب `QC_E2E_LOGIN_IDENTITY` و`QC_E2E_PASSWORD` وfixture stale task.
- `node tests/performance/smoke.mjs` ✅ — 1 warmup و5 samples؛ `/login` total p50/p95 = `1.138/2.451ms`، 404 = `1.294/1.926ms`، readiness = `0.713/0.747ms`، ورجوع readiness بـ503 موثق كفشل dependency متوقع.
- `prettier --check` ✅، ESLint للملفات الجديدة ✅، `check-boundaries.mjs` ✅، `git diff --check` ✅، وفحص secrets/raw SQL في Delivery بلا نتائج.
- اختبارات التكامل المرتبطة بالـdegradation والـobservability: `outbox.test.ts` و`ai-advisory/security.test.ts` و`system-health.test.ts` = `19/19` ✅؛ تثبت retry عند فشل provider وAI optional degradation وhealth vocabulary بدون تسريب.
- `pnpm typecheck` ❌ — 342 baseline errors خارج نطاق MASTER-034، منها Astro Actions typings وmiddleware وملفات UI/اختبارات قديمة؛ `pnpm test:unit` ❌ — 15 suites نجحت و2 فشلت لأسباب baseline (UI imports وArgon2 expectation).

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تغطية accessibility/responsive/failure والـbaseline موجودة ومتحققة على المسارات العامة، لكن readiness/performance غير مثبتة إنتاجيًا، والمسارات المحمية وstale/AI تحتاج fixtures معتمدة، وquery-shape issues الحالية مفتوحة.

### ملاحظات / مشاكل مفتوحة
- لا يوجد approved performance SLO أو threshold؛ القيم المسجلة observational فقط، والقياس تم على Node `22.22.3` بينما engine يطلب Node `24.20.x`.
- لا توجد قاعدة PostgreSQL disposable أو dataset معتمد في التشغيل؛ لا يزال إثبات mutation committed مع notification provider فعلي، وquery count/N+1 runtime trace، محجوبًا بغياب fixture/provider.

## [2026-09-05] — البحث عن بيانات الأدمن ومخطط قاعدة البيانات

### تم التنفيذ
- فحصت bootstrap ودليل التشغيل: `yazeed` مثال، وكلمة المرور متغير بيئة بلا قيمة افتراضية.
- طابقت الصورة: المعروض `public` بينما جداول التطبيق تحت `qc` ومنها `qc.users`.
- تحققت من غياب إعدادات `.env` ومتغيرات اتصال القاعدة وbootstrap محليًا؛ لم أتصل بـRender أو أنشئ حسابًا.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md` فقط.

### التحقق
- قراءة الكود وmigrations ودليل التشغيل وفحص وجود إعدادات البيئة بدون أسرار ✅.
- build/tests لم تُشغّل: تشخيص فقط بلا تغيير كود.

### النتيجة
- **الحالة:** نجح
- **مختصر:** حُدد مصدر اسم المثال وآلية تعيين كلمة المرور؛ وجود الحساب الفعلي في Render غير متحقق ويلزم فحص `qc.users`.

## [2026-09-05] — QC-BOOTSTRAP-INITIAL-ADMIN-001: secure one-time initial administrator

### تم التنفيذ
- أضفت الأمر الصريح `pnpm bootstrap:admin` وسكربت bootstrap ما يعمل مع build/start/migration، ويتحقق من متغيرات البيئة ومن اكتمال migrations قبل أي كتابة.
- أضفت `BootstrapInitialAdminUseCase` بمعاملة PostgreSQL واحدة وقفل transaction-advisory لكل identity: إنشاء user ACTIVE، إسناد role `ADMIN` الرسمي، وإسناد `GLOBAL` في `user_scopes` فقط؛ الإعادة لنفس identity ترجع بدون تعديل password/roles/scopes.
- استُخدم `Argon2idPasswordHasher` الحالي، وأضيفت حزمة `argon2` الناقصة التي كان يعتمد عليها adapter الموجود؛ لا توجد كلمة مرور حقيقية في الكود أو الوثائق أو Render.
- لم أضف grants أو bypass: seed الحالي لا يحوي role-permission mappings، والنتيجة تبلغ المشغّل أن grants ما زالت تحتاج إعدادًا معتمدًا.
- أضفت audit events آمنة داخل نفس المعاملة، وحدّثت `.env.example` و`render.yaml` بأسماء Render-managed secrets فقط، وكتبت إجراء التشغيل والإزالة في `docs/operations/INITIAL-ADMIN-BOOTSTRAP.md`.
- أضفت اختبارات config وPostgreSQL تغطي الإنشاء، hash، ADMIN/GLOBAL، الإعادة، login الصحيح/الخاطئ، والحساب المعطل.

### الملفات المتأثرة
- `scripts/bootstrap/create-initial-admin.ts`, `src/modules/identity/application/bootstrap-initial-admin.ts`
- `src/shared/database/db-types.ts`, `package.json`, `pnpm-lock.yaml`, `.env.example`, `render.yaml`
- `tests/unit/bootstrap/bootstrap-config.test.ts`, `tests/integration/bootstrap/initial-admin.test.ts`
- `docs/operations/INITIAL-ADMIN-BOOTSTRAP.md`

### التحقق
- `CI=true pnpm exec vitest run tests/unit/bootstrap/bootstrap-config.test.ts` ✅ — 6/6.
- Bootstrap integration ⚠️ لم يبدأ: لا يوجد Docker/Testcontainers runtime ولا `QC_TEST_DATABASE_URL` disposable.
- `git diff --check` ✅؛ secret/bypass search ✅ (ظهور `yazeed` محصور في test/doc المقصود، ولا يوجد bypass في source).
- `pnpm typecheck` و`pnpm lint` ❌ بسبب أخطاء baseline كثيرة خارج نطاق bootstrap (Astro Actions/واجهة وquality tests)؛ ملفات bootstrap الجديدة ليست ضمن الأخطاء.
- تشغيل الأمر نفسه بلا متغيرات لم يتم اعتماده من sandbox لأنّه قد يكتب على قاعدة غير محددة؛ لم يُشغّل ضد أي قاعدة حقيقية.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** آلية bootstrap الآمنة موجودة محليًا مع اختبار config ناجح؛ إثبات معاملة PostgreSQL وlogin end-to-end ينتظر قاعدة disposable معتمدة.

### ملاحظات / مشاكل مفتوحة
- حزمة `argon2` احتاجت approve-builds محليًا لتشغيل binary؛ بيئة production يجب أن تسمح بتثبيت dependency وفق supply-chain policy المعتمدة.
- `BOOTSTRAP_ADMIN_DISPLAY_NAME` إلزامي لأن schema الحالي يفرض `users.display_name NOT NULL`؛ هذا ليس افتراضًا للبيانات الشخصية.

## [2026-09-05] — MASTER-033: Critical workflow E2E + files/reports security

### تم التنفيذ
- أُنشئ `tests/e2e/critical-workflows.spec.ts` لاختبار حماية نقاط الدخول، فصل Receiving/Inspection/Release، سياق Laboratory المجمد، مسار Quality، حفظ تاريخ Document Versions، وعدم تسريب السجلات عند تبديل UUID.
- أُنشئ `tests/e2e/files-reports.spec.ts` لاختبار رفض وصول الملفات والتقارير غير المصادق، رفض تنزيل evidence خارج النطاق، كشف hash mismatch، تطابق عدد صفوف شاشة التقرير مع export، وتعطيل formula injection في CSV.
- ربطت السيناريوهات الإيجابية باختبار متصفح + server + PostgreSQL عبر `QC_E2E_*` و`QC_TEST_DATABASE_URL` فقط؛ بدون fixture معتمد تُعمل skip بدل اختراع حسابات أو صلاحيات أو بيانات علمية.
- أضفت assertions صريحة على عدم تسريب password/session/token/storage metadata، وعلى أن PASS لا يساوي RELEASED وأن audit history موجود لسياق المختبر.

### الملفات المتأثرة
- `tests/e2e/critical-workflows.spec.ts`
- `tests/e2e/files-reports.spec.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- Build server الموجود `dist/server/entry.mjs` شُغّل محليًا ✅
- Playwright suite الجديدة: **2 passed / 9 skipped من 11** ✅؛ الاختباران المنفذان فعليًا هما حماية المحتوى والتقارير/الملفات غير المصادق عليها، والـskips بسبب غياب `QC_E2E_*` fixtures.
- TypeScript transpile/syntax للملفين ✅
- `git diff --check` ✅
- raw SQL scan داخل `src/pages/**`, `src/actions/**`, `src/middleware.ts` بلا نتائج ✅
- `tsc --noEmit` ❌ بسبب أخطاء baseline خارج الملفات الجديدة (Astro typings/dependencies وأخطاء actions/authorization موثقة سابقًا).
- Prettier ❌ غير متوفر في `node_modules/.bin`.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** ملفات E2E المطلوبة أُنشئت واختبارات الرفض الأمني نجحت فعليًا؛ إثباتات workflow الإيجابية وPostgreSQL export/file fixtures ما زالت تحتاج بيئة fixtures معتمدة.

### ملاحظات / مشاكل مفتوحة
- Chromium احتاج تشغيلًا خارج sandbox؛ بعد السماح البيئي نجحت الاختبارات المنفذة.
- مشكلة Astro Actions المعروفة من MASTER-032 ما زالت خارج نطاق هذا البرومبت، لذلك لا يوجد claim بأن المسارات الإيجابية عبر RPC متحققة في runtime الحالي.

## [2026-09-05] — MASTER-032: Concurrency/idempotency stress + authorization/IDOR matrix

### تم التنفيذ
- أُنشئ `tests/integration/concurrency/controlled-mutations.test.ts` (5 اختبارات) على PostgreSQL حقيقي (Testcontainers postgres:18-alpine): سباقان متوازيان على نفس النسخة لكل عملية Tier-1 — Receiving Release، Inspection Approval، Laboratory Approval، Document Version Approval (حاجز `FOR UPDATE`)، وتحديث صلاحيات Role — مع إثباتات قاعدة بيانات: نسخة واحدة فقط تنجح والأخرى `CONFLICT_STALE_VERSION`، الصف النهائي بالنسخة المتوقعة، صف audit واحد، صف outbox واحد بـdedupe_key، ورفض replay الـinspection دون evidence إضافية.
- أُنشئ `tests/integration/concurrency/idempotency.test.ts` (6 اختبارات) على PostgreSQL حقيقي: حسم الـreserve الفريد تحت 8 محاولات متوازية، replay يرجع الاستجابة المخزنة دون إعادة التنفيذ، رفض fingerprint مختلف بـ`CONFLICT_DUPLICATE_COMMAND`، مسار FAILED، وتنفيذ controlled release مغلّف بـ`executeIdempotently` فعليًا مرة واحدة (audit/outbox نسخة واحدة) عند السباق والإعادة، وتوقيع E-Signature مرة واحدة عند replay بنفس المفتاح.
- أُنشئ `tests/e2e/authorization-matrix.spec.ts` (6 اختبارات Playwright) مبني على route registry: كل مسار محمي مسجل (39+) يرفض غير المصادق (redirect login أو ≥400 بدون أي leak)، استبدال UUID على كل مسارات التفاصيل بلا تسريب بيانات، استدعاء مباشر لـ12 action حساسة عبر RPC `/_actions/` وعبر `?_action=` بلا جلسة (≥400)، حاجز الـmiddleware 303 على POST لمسار محمي، ومسارات reports/search/dashboard.
- **إصلاحات عيوب حقيقية كشفتها الاختبارات (TDD):** (1) `JSON.stringify` الخام كان يرمي TypeError مع bigint في `PostgresIdempotencyRepository.complete` و`fingerprint` — أُنشئ `src/shared/json/stable-stringify.ts` (`stableJson`) واستُخدم في idempotency وaudit وoutbox payload؛ (2) `PostgresLabRepository.persist` كان يخزن snapshot بكائنات تحتوي bigint فيفشل إنشاء أي lab test على PG حقيقي — صار يخزن عبر `stableJson`؛ (3) `PostgresLabRepository.get` كان يقرأ `template_snapshot.context` ثم يستخدم `ctx.test`/`ctx.context` (خطأ مستوى خاطئ) فيرجع سياقًا فارغًا — صُحح لقراءة `{test, context}` الصحيحة، وُسمي `dataType`/`criteria` بشكل صحيح.
- `tests/helpers/postgres-container.ts`: دعم `QC_TEST_DATABASE_URL` كـoverride لبيئة PG خارجية قابلة للرمي (بدون container runtime)؛ سلوك Testcontainers الافتراضي في CI بدون تغيير.

### الملفات المتأثرة
- `tests/integration/concurrency/{controlled-mutations,idempotency}.test.ts` (جديد)
- `tests/e2e/authorization-matrix.spec.ts` (جديد)
- `src/shared/json/stable-stringify.ts` (جديد)، `src/shared/idempotency/{idempotency-service,postgres-idempotency-repository}.ts`، `src/shared/audit/postgres-audit-repository.ts`، `src/shared/outbox/postgres-outbox-repository.ts`
- `src/modules/laboratory/infrastructure/postgres-repository.ts`
- `tests/helpers/postgres-container.ts`

### التحقق
- TDD: اختبارات concurrency فشلت أولًا كاشفة 3 عيوب ثم نجحت — `tests/integration/concurrency`: 11/11 ✅ على PostgreSQL 16.9 محلي قابل للرمي (uuidv7 stand-in) ×4 تشغيلات متتالية بلا flakiness.
- `tests/integration/concurrency + laboratory + shared`: 12 files / 34 tests ✅.
- Playwright `tests/e2e/authorization-matrix.spec.ts`: **6/6 ✅** ضد build إنتاجي (`astro build` + `node dist/server/entry.mjs`) مع DATABASE_URL محلي. Chromium ثُبت أخيرًا محليًا (chromium-headless-shell v1234) — حاجز E2E السابق انحل.
- `tsc --noEmit` صفر أخطاء في كل ملفات النطاق ✅؛ ESLint scoped ✅؛ Prettier ✅؛ `check-boundaries.mjs` ✅؛ `git diff --check` ✅.
- Vitest الكلي: 221 passed / 3 failed (المعروفة سابقًا: tasks/use-cases، reporting/reports، quarantine/inspection-execution) / 26 skipped؛ ملفات فاشلة = 9 suites PostgreSQL تفشل عند بدء الحاوية (لا Docker محليًا، منها 2 جديدتان تعملان مع `QC_TEST_DATABASE_URL`).
- E2E suite كامل: 26 passed + فشلان سابقان ظهرا لأول مرة بتشغيلهما الفعلي (approvals `/sign`، documents `/effective`): المساران يرجعان 404 "Page not found" وهو السلوك الآمن الصحيح، لكن الـspecs القديمة تطابق URL مع `/404` وهو لا يتغير — خارج نطاق ملفات هذا البرومبت.

### النتيجة
- **الحالة:** نجح (مع اكتشافات)
- **مختصر:** إجهاد التوازي/الidempotency لعمليات Tier-1 الخمس ومصفوفة رفض التفويض/IDOR منفذة ومتحققة على PostgreSQL حقيقي وbuild إنتاجي، مع إصلاح 3 عيوب جوهرية كانت ستبطل lab persistence وidempotent replay وقراءة الـlab snapshots. إثبات PostgreSQL 18 الرسمي يبقى لـCI بحاويات.

### ملاحظات / مشاكل مفتوحة (اكتشافات جوهرية)
- **اكتشاف حرج — Astro Actions غير قابلة للاستدعاء:** Astro 7 يتوقع تصدير `server` واحدًا من `src/actions/index.ts` (الـRPC يحل الاسم بعد استبعاد البادئة). الوضع الحالي يصدّر namespaces متعددة (`server`, `quarantine`, `documents`, ...) فيفشل `getAction` بـ`ActionNotFoundError` 404 لكل الـactions — بما فيها `server.login` نفسه (الاسم المولد `server.login` لا يُحل). النتيجة: كل سير العمل المراقَب عبر UI/RPC معطل فعليًا في HTTP surface رغم نجاح اختبارات الـuse-case. الإصلاح = تجميع كل الـactions تحت `server` واحد بأسماء فريدة — إعادة هيكلة خارج نطاق ملفات هذا البرومبت، تحتاج مهمة مستقلة.
- المسار العميق للمصفوفة (wrong scope/SoD/disabled account عبر جلسة مصادقة E2E) يبقى محجوبًا بغياب harness مصادقة E2E؛ مغطى جزئيًا بمصفوفات الـuse-case الموجودة (`quarantine/documents/approvals/administration` authorization-matrix tests).
- تعديلات متزامنة غير من هذا البرومبت موجودة في الشجرة (middleware.ts، README، render.yaml، clean-page-path...) — تُركت كما هي، والـcommit على المستخدم.

## [2026-09-05] — تشخيص Render Static Site وNot Found

### تم التنفيذ
- طابقت بيانات المستخدم: الخدمة `srv-dadfq7pt0dsc738e0tp0` Static Site، بينما Astro مضبوط server مع Node standalone ويحتاج Web Service.
- فحصت الدومين حيًا: HTTP 404 مع Not Found وrndr-id من Render؛ الطلب يصل إلى Render، دون إثبات صحة كل إعدادات DNS.
- صححت دليل التشغيل إلى Cloudflare حسب إفادة المستخدم بدل Hostinger ووثقت إنشاء Web Service وإعداداته ونقل الدومين.
- وثقت أن canonical redirect يعيد رابط Render للدومين القديم قبل النقل، وأن 308 لا يثبت جاهزية PostgreSQL.

### الملفات المتأثرة
- `docs/operations/RENDER-DEPLOYMENT.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- GET HTTPS حي ✅ — أعاد 404 وأكد العرض المبلغ عنه.
- مطابقة Astro/Render/env مع وثائق Render الرسمية ✅.
- `git diff --check` للوثائق ✅ قبل إضافة هذا السجل.
- build/tests لم تُشغّل: تعديل توثيقي فقط.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** اختلاف نوع الاستضافة مشخص وخطوات الإصلاح موثقة؛ لم يحصل تعديل خارجي أو commit أو push.

### ملاحظات / مشاكل مفتوحة
- يلزم خدمة Web Service جديدة وhostname الفعلي وإعداد متغيراتها وPostgreSQL ثم نقل الدومين والتحقق النهائي.

## [2026-09-05] — Canonical clean URLs for Astro page files

### تم التنفيذ
- أضفت `cleanAstroPagePath` لتحويل الروابط التي تكشف امتداد المصدر `.astro` إلى public routes نظيفة.
- أضفت دعم `index.astro` بحيث يتحول مثلًا `/dashboard/index.astro` إلى `/dashboard` و`/index.astro` إلى `/`.
- ربطت التحويل في middleware الإنتاجي مع redirect الدومين الأساسي، فينتج رابط `https://qclevel.top` نظيفًا مع الحفاظ على query string.
- أبقيت dynamic segments كمسارات نظيفة مثل `/tasks/:taskId` و`/documents/:documentId/versions/:versionId/review`؛ الأقواس مصدر Astro وليست جزءًا من الرابط الفعلي.
- أكدت أن صفحات `src/pages` الحالية تُخدم عبر Astro SSR ولا تحتاج إدراجًا يدويًا في `render.yaml`.

### الملفات المتأثرة
- `src/shared/routing/clean-page-path.ts`
- `src/middleware.ts`
- `tests/unit/routing/clean-page-path.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `tests/unit/routing/clean-page-path.test.ts` + `tests/unit/routing-registry.test.ts` ✅ — 6/6
- `node node_modules/astro/bin/astro.mjs build` ✅
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** كل طلب ينتهي بـ`.astro` في الإنتاج يعاد توجيهه إلى مساره العام النظيف، مع استمرار route registry الحالي كمرجع للمسارات canonical.

### ملاحظات / مشاكل مفتوحة
- Render لا يدعم `headers/routes` لخدمة Web SSR؛ الـheaders والredirectات تنفذ عبر middleware، بينما DNS/ربط الدومين يتم من لوحة Render وDNS provider.

## [2026-09-05] — Render canonical domain, SSR routes, headers, and redirects

### تم التنفيذ
- صححت `render.yaml` من `startCommand: .` إلى `node dist/server/entry.mjs` المتوافق مع Astro Node standalone.
- ضبطت build command على Corepack مع `pnpm install --frozen-lockfile` و`pnpm run build`، مع تثبيت `SERVICE_VERSION` وإضافة متغيرات rate-limit السرية المطلوبة للإنتاج.
- ثبتُّ `qclevel.top` كالدومين الأساسي، وأبقيت Render subdomain مفعّلًا مؤقتًا حتى يمر عبر redirect للتأكد من canonical host بدل 404.
- أضفت redirect إنتاجي 308 من `www` وRender hostname وأي host غير أساسي إلى `https://qclevel.top` مع الحفاظ على path وquery، بدون استخدام Host لبناء وجهة موثوقة.
- وثّقت Service ID المقدم `srv-dadfq7pt0dsc738e0tp0` في baseline التشغيل، وأوضحت أن صفحات `src/pages` تُخدم تلقائيًا عبر Astro SSR ولا تحتاج page allowlist في Render.

### الملفات المتأثرة
- `render.yaml`
- `src/middleware.ts`
- `docs/operations/RENDER-DEPLOYMENT.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- YAML parse + assertions للدومين والـentrypoint ✅
- `node node_modules/astro/bin/astro.mjs build` ✅
- `tests/unit/shared/security-headers.test.ts` ✅ — 5/5
- `git diff --check` ✅
- ESLint/Prettier scoped ⚠️ لم يُشغّل: executables غير موجودة في `node_modules/.bin` و`pnpm exec` لم يجدها.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** إعداد Render ومسار التشغيل والدومين الأساسي والredirect والأمان محدثة محليًا ونجح build واختبار headers؛ فحص lint/Prettier ينتظر اكتمال أدوات dependencies.

### ملاحظات / مشاكل مفتوحة
- يلزم من لوحة Render إضافة/التحقق من `qclevel.top` ثم ضبط DNS عند Hostinger؛ Render يضيف `www.qclevel.top` ويربطه بالـroot حسب إعداد الدومين.
- يلزم إدخال قيم `DATABASE_URL` و`SESSION_SECRET` وrate-limit وOTEL السرية في Render؛ لا توجد قيم سرية داخل الريبو.
- `IMPLEMENTATION-MASTER-PLAN-MERGED.md` تعديل سابق للمستخدم وتم الحفاظ عليه بدون لمس.

## [2026-09-05] — MASTER-031: Production security + rate limiting + observability wiring

### تم التنفيذ
- أُنشئت طبقة observability داخلية vendor-neutral في `src/shared/observability/`: abstraction للـtracer/meter (OTel API-compatible) مع no-op افتراضي بحيث فشل الـexporter لا يُسقط أي عملية، `withSpan` + `runWithCorrelation` عبر AsyncLocalStorage يربطان requestId→traceId→spanId عبر HTTP→DB→outbox→files، حارس cardinality قائم على allowlist (يحجب requestId/userId/traceId/email...) ويحد القيم بـ128 حرفًا، وتطبيع route templates (`/tasks/<uuid>` → `/tasks/:id`).
- أُنشئ logger هيكلي JSON (pino) مع redaction إلزامي لـpassword/token/secret/cookie/authorization وربط correlation، وسقوط الـlog sink لا يكسر الطلب.
- أُنشئت إمكانية rate limiting (SECURITY §33/§141/§142): `RateLimiter` نافذة ثابتة مع fail-closed عند فشل الـstore، `InMemoryRateLimitStore`، `PostgresRateLimitStore` بـupsert ذرّي، port `RateLimitStore`، والعتبات كلها config-driven من env (`RATE_LIMIT_LOGIN_MAX`/`RATE_LIMIT_LOGIN_WINDOW_SECONDS`) — لا أرقام مخترعة. middleware يحمي POST `/login` ويعيد 429 problem+json مع retry-after وrequestId؛ عدم ضبط العتبات في production = FAIL_CLOSED + الـenv validation صار يطلب المفتاحين في production.
- middleware طوّر: security headers (CSP baseline §76 كامل بدون unsafe-inline/unsafe-eval في production، X-Content-Type-Options، X-Frame-Options DENY، Referrer-Policy، Permissions-Policy، COOP/CORP، HSTS production-only)، وHTTP metrics/log بعدد الطلبات بـroute template مطبّع وstatus class. استثناء `unsafe-inline` موثّق للتطوير فقط (HMR لـAstro).
- رُبط telemetry بالطبقات: Kysely plugin في `database.ts` (spans/counters بـstatement kind فقط بلا SQL/parameters، وعدّاد أخطاء عبر log hook)، `outbox/worker.ts` (spans + outcome counters بلا payloads)، `file-service.ts` (upload/download counters بلا filenames أو subject ids).
- astro.config: `inlineStylesheets: 'never'` (لتوافق CSP الصارم) و`sourcemap: false` (§196 policy-dependent). كوكي الجلسة موحّد عبر `session-cookie.ts` (__Host- مع Secure دائمًا/HttpOnly/SameSite=Strict/Path=/ بلا Domain) واستُخدم في `actions/auth.ts`.
- توقعات اختبار المايجريشن صُحّحت لـ18 migration مع إضافة `0018_rate_limit_windows.sql` (لاحظت أن التوقع السابق كان يستثني 0016 بالخطأ).

### الملفات المتأثرة
- `src/shared/security/{rate-limit,rate-limit-store,postgres-rate-limit-store,security-headers,session-cookie}.ts`
- `src/shared/observability/{telemetry,logger,db-telemetry}.ts`
- `src/middleware.ts`, `astro.config.mjs`, `src/actions/auth.ts`, `src/config/{env,constants}.ts`
- `src/shared/database/{database,db-types}.ts`, `src/shared/outbox/worker.ts`, `src/shared/files/file-service.ts`
- `db/migrations/0018_rate_limit_windows.sql`
- `tests/integration/security/rate-limit.test.ts`, `tests/integration/observability/correlation.test.ts`, `tests/unit/shared/security-headers.test.ts`, `tests/e2e/security-headers.spec.ts`, `tests/integration/database/{migrations,upgrade-path}.test.ts`

### التحقق
- TDD: اختبارات observability فشلت أولًا (موديول غير موجود) ثم نجحت 16/16 ✅؛ rate limit: 8/8 in-memory/config ✅ (نافذة، انتهاء، concurrency، عزل، fail-closed، parsing).
- `tests/integration/observability` + `tests/unit/shared` + `tests/integration/http`: 7 files / 35 tests ✅.
- Playwright `tests/e2e/security-headers.spec.ts`: **5/5 ✅ فعليًا** (شُغّل سيرفر dev محليًا — CSP baseline، HSTS production-only، لا wildcard CORS، رفض cross-origin POST 403، لا stack traces على 404).
- تحقق حي للـrate limit: سيرفر بعتبات اختبار (2/60s) → POST,POST=200,200 ثم 429 `application/problem+json` مع `retry-after` وrequestId ✅.
- `node node_modules/astro/bin/astro.mjs build` ✅، `check-boundaries.mjs` ✅، `git diff --check` ✅، ESLint scoped ✅، Prettier ✅، tsc scoped: صفر أخطاء في ملفات النطاق.
- Full vitest: 218 passed — الإخفاقات كلها معروفة: 6 suites PostgreSQL (لا Docker)، master-016 (سابق)، و3 اختبارات موثقة سابقًا (reports/toThrowErrorMatchingObject، tasks/use-cases، quarantine/inspection-execution).

### النتيجة
- **الحالة:** نجح (جزئي التحقق)
- **مختصر:** ضوابط الأمان الإنتاجية، rate limiting config-driven مع fail-closed، وobservability مترابط على HTTP/DB/outbox/files منفذة ومتحققة محليًا + E2E فعلي. إثبات PostgreSQL runtime للـstore الدائم يبقى محجوبًا بغياب Docker.

### ملاحظات / مشاكل مفتوحة
- عتبات rate limit للعمليات الأخرى عالية الخطورة (E-Signature reauth، AI، heavy search، report generation، file uploads) تبقى POLICY-DEPENDENT: الإمكانية جاهزة (`HIGH_RISK_POST_ROUTES` + limiter) لكن لم تُربط لعناصر إضافية بدون عتبات معتمدة، ولم تُخترع أرقام.
- قيم HSTS max-age (31536000) وPermissions-Policy technical choices موثقة، ليست سياسات علمية.
- PostgresRateLimitStore يحتاج تشغيل على PostgreSQL 18 فعلي (migration 0018 + concurrency) في CI/بيئة معتمدة.

## [2026-09-05] — MASTER-030: AI Advisory boundary + UI + security tests

### تم التنفيذ
- أُنشئ موديول ai-advisory بطبقات Domain/Ports/Infrastructure/Application كاملة: عقد `AiProvider` بلا SDK ولا credentials، وadapter افتراضي `DisabledAiProvider` يعيد `NOT_CONFIGURED` دائمًا، ودالة `parseProviderAdvisory` في الـDomain ترفض أي structured output فيه مفاتيح authority (approve/reject/release/sign/pass/fail/decision/permission/role...) بأي عمق وتحدّ طول النص بـ20k.
- أُنشئ `GetAdvisoryUseCase` يعيد التفويض server-side مرتين (`PERM-AI-USE` + إذن الوضع `PERM-AI-SUMMARIZE/SUGGEST/DRAFT` على كيان `AI_ADVISORY`)، يرفض النصوص/السياق الحاملين secret-like material قبل أي provider call، يحدّ السؤال بـ4000 حرف والسياق بـ10 مقاطع، ويعيد `AVAILABLE/UNAVAILABLE/REFUSED` مع رسائل ثابتة فقط — فشل أو غياب الـprovider لا يرمي خطأ أبدًا ولا يكشف تفاصيل infrastructure، ولا يُسجّل أي prompt/response في أي log.
- أُضيفت Astro Action `aiAdvisory.requestAdvisory` (POST/json فقط) تربط الـactor من context وتعيد view نظيفًا بلا أي حقل authority، وصفحة `/ai-advisory` (UI-AI-001) بهيدر «Suggestions and analysis only — not an approval authority»، label بارز على كل استجابة AI، حقل سياق مُصرّح به يدويًا فقط، وأزرار استجابة Copy/Use as Draft محلية فقط — لا يوجد أي زر controlled action من ناتج AI، وصفحة بدون `PERM-AI-USE` تعرض رفضًا بدون بيانات.
- أُضيفت سياسات `AI_ADVISORY` إلى policy-registry (default deny للبقية)، والمسار `/ai-advisory` (RT-AI-001 required) أصبح مغطى بملف فعلي في check-route-files.
- كُتبت الاختبارات بالـTDD: unit suite (14 اختبارًا: validation، رفض authority encoding، disabled adapter، degradation، injection كسؤال لا يمنح صلاحية، حدود الحجم) + integration security suite (9 اختبارات: تقليل البيانات الواصل للـprovider، لا سياق خفي، injection لا يغيّر authz، رفض الأسرار قبل الـprovider، رفض المخرجات Authoritative، outage منعزل بلا تفاصيل، فحص عدم وجود console/logger في الموديول والـAction).

### الملفات المتأثرة
- `src/modules/ai-advisory/{domain/advisory-response.ts,ports/ai-provider.ts,infrastructure/disabled-ai-provider.ts,application/get-advisory.ts}`
- `src/actions/{ai-advisory.ts,index.ts}`
- `src/pages/ai-advisory.astro`
- `src/shared/authorization/policy-registry.ts`
- `tests/unit/ai-advisory/advisory.test.ts`, `tests/integration/ai-advisory/security.test.ts`, `tests/e2e/ai-advisory.spec.ts`

### التحقق
- TDD: اختبار الـunit فشل أولًا (موديول غير موجود) ثم نجح ✅ — `tests/unit/ai-advisory` + `tests/integration/ai-advisory`: 2 files / 23 tests ✅.
- `node node_modules/astro/bin/astro.mjs build` ✅.
- `node scripts/architecture/check-boundaries.mjs` ✅ و`git diff --check` ✅.
- `check-route-files.mjs`: مسار `/ai-advisory` لم يعد يظهر ضمن الناقص ✅.
- ESLint scoped للنطاق ✅؛ tsc scoped (--ignoreConfig) على ملفات الموديول: صفر أخطاء في ملفات ai-advisory (أخطاء foundation سابقة في `src/shared/authorization/authorize.ts` بامتدادات ناقصة خارج النطاق).
- Suites المجاورة بعد تغيير policy-registry: `system + approvals + change-requests + e-signatures` → 8 files / 46 tests ✅؛ unit suite الكلي 47 passed مع فشل مسبق وحيد موثق في `tests/unit/ui/master-016.test.ts` (خارج النطاق).
- Playwright E2E `tests/e2e/ai-advisory.spec.ts` ⚠️ محجوب: Chromium executable غير مثبت في Playwright cache (نفس الحاجز الموثق من MASTER-024/025/027).
- static scans: لا raw SQL في Delivery، لا secrets، لا Admin bypass، لا أزرار authority في صفحة AI ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** حد الـAI Advisory advisory-only منفذ بالكامل: الموديول يبدأ معطّلًا وبلا أي provider أو credential، المخرجات الـauthoritative تُرفض في الـDomain، الـauthz server-side مرتين ولا يمكن للـprompt injection تغييرها، وفشل الـAI يبقي الـcore سليمًا بلا أي log للمحتوى. الـE2E runtime يبقى محجوبًا بغياب Chromium.

### ملاحظات / مشاكل مفتوحة
- لا يوجد أي provider حقيقي: الربط المستقبلي يكون بحقن adapter خلف `AiProvider` port فقط، وسياسة retention للـprompt/output (SEC §163) تبقى POLICY-DEPENDENT ولم تُخترع.
- السياق المرسل للـAI حاليًا هو المقاطع المُصرّح بها يدويًا فقط؛ ربط السياق بقراءة سجلات مصرح بها يحتاج read provider مملوك لكل Domain لاحقًا.
- لم يُضف عنصر للـsidebar (خارج قائمة الملفات في النطاق)؛ الصفحة محمية ومسجلها في route registry.
- لا commit أو push، وتم الحفاظ على تعديل المستخدم السابق في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.

## [2026-09-05] — MASTER-029: System Health + Backup/Restore catalog/orchestration/UI

### تم التنفيذ
- أُنشئ System Health application use case مع probes معزولة ومُنقّحة (application/database/storage/outbox/ai-provider) تعيد الحالة المعتمدة HEALTHY/DEGRADED/UNAVAILABLE/UNKNOWN بدون أي raw infrastructure errors أو secrets، وآلية AI DEGRADED لا تُسقط core READY، وPostgreSQL UNAVAILABLE يجعل core NOT READY.
- أُنشئ موديول backup-recovery كاملًا (domain/ports/infrastructure/application) فوق جداول `qc.backup_runs`/`qc.restore_runs` الموجودة في migration 0014، مع فصل صريح بين نتيجة backup job (CREATED/VERIFIED) وrestore verification المشتق فقط من restore runs الفعلية، وview آمن لا يخرج storage_reference أو checksum خارج طبقة infrastructure.
- أُنشئ restore intent boundary: `validate-restore-request` (سبب إلزامي + تأكيد صريح + بيئات canonical local/test/staging/production + DRILL ممنوع يستهدف production)، و`request-restore` يفحص صلاحية RESTORE حسب النوع (PERM-BKP-RESTORE-DRILL / PERM-BKP-RESTORE-PRODUCTION) مع scope GLOBAL، ويسجل الطلب بحالة PLANNED فقط مع replay idempotency وAudit/Outbox داخل transaction — ولا يوجد أي orchestrator مزيف أو تنفيذ فعلي، وproduction restore DENY لأن سلطته/e-signature غير معتمدة (RD-020، BKP-DD-014/016).
- أُضيفت `system.requestRestore` كـ Astro Action (POST فقط، لا restore عبر GET)، وصفحات `/system/health` و`/system/backups` و`/system/backups/[backupId]` و`/system/backups/[backupId]/restore` تعرض السياق (backup/environment/timezone Asia/Riyadh/schema version/verification/gaps) وتفصل صراحة بين Job SUCCEEDED وRESTORE NOT VERIFIED.
- أُضيفت سياسات `PERM-BKP-VIEW`/`PERM-BKP-RESTORE-DRILL`/`PERM-BKP-RESTORE-PRODUCTION`/`PERM-HLTH-VIEW` إلى policy-registry (Admin بدون permission صريح = DENY)، وأُضيفت جداول backup/restore إلى db-types، وصُحّح كود الـ nav للـ health إلى `PERM-HLTH-VIEW` (كان `PERM-SYS-HEALTH-VIEW` غير canonical) وأُضيف عنصر Backups بـ`PERM-BKP-VIEW`.

### الملفات المتأثرة
- `src/modules/system-health/{ports/health-probes.ts,application/{get-system-health,dependencies}.ts,infrastructure/postgres-health-probes.ts}`
- `src/modules/backup-recovery/{domain/backup-record.ts,ports/{repository,recovery-orchestrator}.ts,infrastructure/postgres-repository.ts,application/{list-backups,get-backup,validate-restore-request,request-restore,dependencies}.ts}`
- `src/actions/{system,index}.ts`, `src/pages/system/`, `src/ui/navigation/navigation.ts`
- `src/shared/authorization/policy-registry.ts`, `src/shared/database/db-types.ts`
- `tests/integration/system/{system-health,backup-catalog,restore-authorization}.test.ts`

### التحقق
- TDD: الاختبارات الثلاثة كُتبت أولًا وفشلت (modules غير موجودة) ثم نجحت ✅ — `27 tests / 3 files` في `tests/integration/system`.
- `node node_modules/astro/bin/astro.mjs build` ✅.
- `node scripts/architecture/check-boundaries.mjs` ✅ و`git diff --check` ✅.
- tsc --noEmit مفلتر على ملفات النطاق ✅ (صفر أخطاء)؛ الفحص العام يحتفظ بأخطاء foundation قديمة خارج النطاق.
- ESLint scoped للملفات الجديدة والمتأثرة ✅.
- static scans: لا raw SQL في Delivery، لا Admin bypass، لا secrets ✅.
- `tests/unit/ui/master-016.test.ts` ⚠️ يفشل مسبقًا (imports ناقصة خارج النطاق، موثق من MASTER-026).
- PostgreSQL/Testcontainers runtime ⚠️ لم يُشغّل لعدم توفر container runtime في البيئة.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات system health وbackup catalog وrestore intent boundary والصفحات والاختبارات والبناء أُنجزت محليًا؛ الـrestore يبقى intent-only بحالة PLANNED لأن لا provider ولا سلطه production معتمدة، والـposture يعرض backup job منفصلًا عن restore verification بدون أي ادعاء جاهزية استعادة.

### ملاحظات / مشاكل مفتوحة
- `RecoveryOrchestrator` port عقد فقط بلا أي implementation (عمدًا) — التنفيذ الفعلي يحتاج provider معتمد + drill evidence قبل أي claim.
- Storage/AI probes تعيد UNKNOWN لأن provider topology وAI integration غير معتمدين؛ لا قيم RPO/RTO/retention أو صلاحية production restore مخترعة.
- لا commit أو push، وتم الحفاظ على تعديل المستخدم السابق في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.

## [2026-09-05] — MASTER-027: Change Requests

### تم التنفيذ
- أُنشئ Change Request domain/port/PostgreSQL adapter بعقد lifecycle صريح من DRAFT إلى APPLIED/REJECTED/CANCELLED، ورفض transitions غير المعلنة وtarget-state الحر.
- أُضيفت create/get/list/transition use cases مع authorization مركزي، scope، expected-version، SoD، replay protection، ورفض أفعال APPLY الداخلية من مسار المستخدم.
- أُضيفت معاملات PostgreSQL مع optimistic locking، `FOR UPDATE`، Audit وOutbox correlation عبر `requestId`، وحفظ target snapshot/field changes/history/application attempts بدون كتابة مباشرة على Domain الهدف.
- أُضيفت Astro Actions وصفحات SSR لمسارات `/change-requests` و`/new` و`/[changeRequestId]` و`/review`؛ GET للقراءة فقط، وواجهة المراجعة تعرض السياق والتأثير المقترح ولا توحي بأن APPROVED يعني RELEASED أو أنه يغيّر السجل الهدف تلقائيًا.
- رُبط CHANGE_REQUEST مع Approval orchestration وsubject context، وأُضيفت سياسات `PERM-CHG-*` مع اشتراط زوج `PERM-CHG-APPROVE` + `PERM-APR-APPROVE` للقرار.
- أُضيفت اختبارات lifecycle/permissions/scope/version/SoD/replay وauthorization matrix وE2E governance boundary.

### الملفات المتأثرة
- `src/modules/change-requests/`
- `src/modules/approvals/application/dependencies.ts`
- `src/modules/approvals/infrastructure/postgres-repository.ts`
- `src/actions/change-requests.ts`, `src/actions/index.ts`
- `src/pages/change-requests/`
- `src/shared/authorization/policy-registry.ts`
- `src/shared/database/db-types.ts`
- `tests/integration/change-requests/change-requests.test.ts`
- `tests/integration/approvals/authorization-matrix.test.ts`
- `tests/e2e/governance.spec.ts`

### التحقق
- `node node_modules/vitest/vitest.mjs run tests/integration/approvals tests/integration/e-signatures tests/integration/change-requests --passWithNoTests` ✅ — 5 files / 19 tests.
- فحص ESLint scoped للملفات الجديدة والمتأثرة ✅.
- `node scripts/architecture/check-boundaries.mjs` ✅.
- `node node_modules/astro/bin/astro.mjs build` ✅.
- `git diff --check` ✅.
- E2E governance ⚠️ بدأ فعليًا لكنه محجوب: Playwright Chromium executable غير مثبت محليًا؛ أمر `pnpm test:e2e` نفسه لا يجد binary، والتشغيل المباشر فشل بسبب cache المتصفح.
- `astro check` العام ⚠️ غير صالح كإشارة نظيفة: يحتوي أخطاء foundation/virtual Astro modules كثيرة خارج النطاق، مع أخطاء typing معروفة في Actions الحالية؛ build وESLint scoped نجحا.
- PostgreSQL/Testcontainers runtime الكامل ⚠️ لم يُشغّل لعدم توفر provider/runtime database في البيئة.
- محاولة `tests/integration` العامة ⚠️ أظهرت تعثرات مستقلة سابقة في `tasks/use-cases` و`reporting/reports` و`quarantine/inspection-execution`، بينما اختبارات database/container بقيت skipped؛ لم تُنسب للـCR.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات Change Requests والربط مع approvals والضوابط والاختبارات المركزة والبناء أُنجزت محليًا. بقي تحقق E2E/قاعدة البيانات الفعلي محجوبًا ببيئة التشغيل، وسياسة E-Signature/مزود التطبيق الداخلي تبقى policy/provider-dependent ولا تم اختراع قيم لها.

### ملاحظات / مشاكل مفتوحة
- `PERM-CHG-APPLY` غير مكشوف في Astro Action للمستخدم؛ التطبيق الفعلي بعد APPROVED يحتاج owning-domain application service/system principal مع إعادة التحقق من target version/state/business rules.
- مسار CR المباشر يعيد فحص صلاحيات المجال وgeneric approval وSoD/version؛ أما signature ceremony فتظل عبر Approval use case عندما تعتمدها السياسة، والسياسة الافتراضية غير المعتمدة لا تُتجاوز.
- لا commit أو push، وتم الحفاظ على تعديل المستخدم السابق في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.

## [2026-09-05] — MASTER-026: Approvals + E-Signatures

### تم التنفيذ
- أُنشئت Approvals domain/ports/PostgreSQL repository مع حالات Work Item وقرارات append-only، optimistic version، idempotency، وقراءة scoped لـMy Approvals.
- أُضيفت orchestration use cases للقائمة والتفاصيل والقرار، مع إعادة فحص assignment/scope/permission/state/version/SoD ثم استدعاء owning-domain transition بدل تغيير الحالة من Approvals.
- أُنشئت E-Signatures evidence primitive وrepository/use case يطبق معنى الإجراء، إعادة التحقق، إعادة التفويض، وربط actor/action/version/snapshot/request؛ لا يُحفظ السر داخل الدليل.
- أُضيفت transaction wiring لـAudit وOutbox وsignature persistence بعد نجاح transition، مع منع القرار إذا كانت سياسة التوقيع المطلوبة غير معتمدة أو transition غير معروف.
- أُضيفت Astro Action وصفحتا `/approvals` و`/approvals/[approvalId]`؛ التوقيع جزء من ceremony القرار ولا توجد route مستقلة للتوقيع، والـDelivery لا يحتوي SQL أو business rules.
- أُضيفت اختبارات repository/orchestration/e-signature وE2E boundary، مع سياسات authorization للـapproval work/case وcontrolled subject signatures.

### الملفات المتأثرة
- `src/modules/approvals/`
- `src/modules/e-signatures/`
- `src/actions/approvals.ts`, `src/actions/index.ts`
- `src/pages/approvals/`
- `src/shared/authorization/policy-registry.ts`
- `src/shared/database/db-types.ts`
- `tests/integration/approvals/`, `tests/integration/e-signatures/`, `tests/e2e/approvals.spec.ts`

### التحقق
- اختبارات Approvals وE-Signatures: `3 files / 10 tests` ✅.
- TypeScript scoped للموديولات والاختبارات ✅؛ الفحص العام ما زال يتأثر بـAstro virtual modules وأخطاء foundation قديمة خارج النطاق.
- ESLint وPrettier للنطاق ✅.
- `node scripts/architecture/check-boundaries.mjs` ✅.
- `node node_modules/astro/bin/astro.mjs build` ✅.
- E2E ⚠️ محجوب: Chromium executable غير مثبت في Playwright cache.
- Unit suite ⚠️ `12 files / 33 tests` مرّت، و`tests/unit/ui/master-016.test.ts` يفشل بسبب imports ناقصة خارج النطاق.
- `git diff --check` ⚠️ يلتقط trailing whitespace موجودًا مسبقًا في `IMPLEMENTATION-MASTER-PLAN-MERGED.md` فقط؛ فحص diff للنطاق الجديد نظيف.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** بنية Approvals وE-Signatures والضوابط والاختبارات المصدرية والبناء مكتملة محليًا، لكن runtime E2E ينتظر Chromium، وسياسة التوقيع الافتراضية تبقى DENY إلى أن يُمرر provider/policy معتمد.

### ملاحظات / مشاكل مفتوحة
- PostgreSQL/Testcontainers runtime الكامل لم يُثبت في هذه البيئة؛ repository adapter مربوط بالجداول canonical الموجودة في migration `0012_approvals_esignatures.sql`.
- `subjectContext` الحالي يركّب queue context للـDocument Version وLab Test وInspection Report وCalibration Record فقط؛ بقية الأنواع canonical تُستبعد من queue إلى أن يتوفر read provider مملوك لها.
- لا commit أو push، وتم الحفاظ على تعديل المستخدم السابق في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.

## [2026-09-05] — MASTER-025: Controlled Documents implementation

### تم التنفيذ
- أُنشئت Controlled Documents domain models تفصل `DocumentIdentity` عن `DocumentVersion`، مع حالات lifecycle صريحة، revision metadata، content hash، ونسخة optimistic concurrency.
- أُضيفت repository port وPostgreSQL adapter للجداول الموجودة في migration `0011_documents.sql`، مع transaction، `FOR UPDATE` في supersession، audit/outbox، وحفظ `document_version_files` عبر file IDs وFK إلى Files capability.
- أُضيفت use cases للإنشاء، إنشاء Draft، تعديل Draft فقط، submit، review مسجل كأثر دائم، approve بصلاحيات الوثيقة وApproval infrastructure وSoD، وsupersede transactional محكوم بسياسة effective-date غير المعتمدة.
- أُضيفت سياسات authorization للهوية والإصدار، مع default deny، scope، expected version، ومنع self-review/self-approval؛ لا توجد mutation route لـ`/effective`.
- أُضيفت Actions وصفحات SSR للمكتبة، الهوية، الإصدار، محرر Draft، وت workspace المراجعة؛ الصفحة تعرض effective version من read model وتبقي approved/superseded history للقراءة فقط.
- أُضيفت اختبارات مركزة للهوية/الإصدار، Draft editing، approved-edit denial، dual approval/SoD، stale/transition validation، وحفظ superseded history، مع E2E boundary coverage.

### الملفات المتأثرة
- `src/modules/documents/`
- `src/shared/authorization/policy-registry.ts`
- `src/shared/database/db-types.ts`
- `src/actions/{documents,index}.ts`
- `src/pages/documents/`
- `tests/integration/documents/`, `tests/e2e/documents.spec.ts`

### التحقق
- `node node_modules/vitest/vitest.mjs run tests/integration/documents --passWithNoTests` ✅ — 4 files / 9 tests.
- `node node_modules/astro/bin/astro.mjs build` ✅.
- `node scripts/architecture/check-boundaries.mjs` ✅.
- `git diff --check` ✅.
- TypeScript filtered check للنطاق ✅؛ الفحص الكامل ما زال يحتوي أخطاء foundation/dependencies قديمة خارج النطاق.
- `node node_modules/playwright/cli.js test tests/e2e/documents.spec.ts` ⚠️ محجوب: Chromium executable غير مثبت في Playwright cache.
- `node scripts/architecture/check-route-files.mjs` ⚠️ ما زال يفشل بسبب routes canonical ناقصة خارج Documents؛ مسارات Documents المطلوبة موجودة.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** Controlled Documents layers والضوابط والاختبارات المصدرية أُضيفت محليًا ونجحت اختبارات التكامل وbuild والحدود، لكن E2E runtime ينتظر Chromium، وeffective-date/approval authority وسياسة binary upload provider ما زالت غير معتمدة؛ لا commit أو push.

### ملاحظات / مشاكل مفتوحة
- `APPROVED → EFFECTIVE` وsupersession public execution بقيت DENY افتراضيًا إلى أن تعتمد effective-date policy؛ لا تم اختراع تاريخ نفاذ.
- Binary content يبقى عبر shared Files capability؛ تنفيذ هذا النطاق يربط file IDs ولا يكتب object storage مباشرة، ولا يوجد provider/endpoint جديد غير معتمد.

## [2026-09-05] — MASTER-024: Assets equipment, calibration, maintenance, and laboratory eligibility

### تم التنفيذ
- أُنشئت طبقات Equipment وCalibration وMaintenance من Domain/Ports إلى PostgreSQL repositories وuse cases، مع UUID/business IDs، حالات صريحة، optimistic version، وفصل السجلات التاريخية.
- أُضيفت صلاحيات Assets إلى `policy-registry`، مع server-side authorization وscope وSoD للمعايرة ورفض المسارات غير المعرّفة افتراضيًا.
- أُضيفت audit/outbox wiring للإنشاء والانتقالات، وربطت بداية Maintenance بتحديث Equipment إلى `UNDER_MAINTENANCE` داخل transaction؛ الإكمال لا يثبت calibration ولا يعيد availability تلقائيًا.
- أُضيفت Assets-owned eligibility provider وربطت بـLaboratory submit؛ السياق غير الصالح أو snapshot الناقص أو calibration `OVERDUE` يوقف الاستخدام، وdue/overdue/current policy غير المعتمدة لا تُخترع.
- أُضيفت صفحات `/assets` وEquipment/Calibration/Maintenance lists/details والإنشاء المشروط، مع عرض الحالة والنسخة والتاريخ والروابط المرتبطة، وبدون SQL أو business rules داخل Delivery.
- أُضيفت اختبارات integration مركزة لثبات Equipment والنسخة والتاريخ، lifecycle المعايرة وSoD والسياسة غير المحسومة، Maintenance، eligibility، authorization، واختبار E2E للمسارات.

### الملفات المتأثرة
- `src/modules/assets/`
- `src/modules/laboratory/application/dependencies.ts`
- `src/shared/authorization/policy-registry.ts`
- `src/shared/database/db-types.ts`
- `src/actions/assets.ts`, `src/actions/index.ts`
- `src/pages/assets/`
- `tests/integration/assets/`, `tests/e2e/assets.spec.ts`

### التحقق
- `node node_modules/vitest/dist/cli.js run tests/integration/assets --passWithNoTests` ✅ — 5 files / 12 tests.
- `node node_modules/astro/bin/astro.mjs build` ✅.
- `pnpm exec tsc --noEmit` scoped to Assets ✅؛ لم تظهر أخطاء في ملفات Assets، مع بقاء أخطاء foundation قديمة خارج النطاق عند الفحص الكامل.
- `node node_modules/astro/bin/astro.mjs check` scoped to Assets ✅؛ الفحص الكامل ما زال يحمل أخطاء Astro/foundation سابقة.
- `node scripts/architecture/check-boundaries.mjs` ✅ و`git diff --check` ✅.
- `node scripts/architecture/check-route-files.mjs` ⚠️ ما زال يذكر routes canonical ناقصة خارج Assets؛ لم يذكر أي route من Assets.
- `node node_modules/playwright/cli.js test tests/e2e/assets.spec.ts` ⚠️ محجوب: Chromium executable غير مثبت في Playwright cache؛ سيرفر Astro المحلي اشتغل مؤقتًا ثم أُوقف.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** نطاق Assets مكتوب ومتحقق بالاختبارات المركزة وbuild والحدود، مع الحفاظ على history وauthorization وpolicy-deny؛ إثبات Playwright/PostgreSQL runtime الكامل ينتظر browser/container والبيئة المعتمدة.

### ملاحظات / مشاكل مفتوحة
- `MAKE_CURRENT` و`MARK_DUE` و`MARK_OVERDUE` ومسارات VOID الحساسة غير المعرفة تبقى DENY حتى اعتماد authority/policy المقابلة.
- لا يوجد commit أو push، وتم الحفاظ على تعديل المستخدم السابق في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.

## [2026-09-05] — MASTER-022: Quarantine review/release/read models/workspaces

### تم التنفيذ
- أُضيفت use cases منفصلة لـReview وReturn وApprove وRelease وHold، مع صلاحيات مزدوجة حيث يلزم، وفحص SoD والحالة والنسخة والنطاق قبل الانتقال.
- بقي اعتماد النتيجة الرسمية وrelease authority محكومًا بـapproved policy/source؛ default policy للـApprove وRelease هو DENY، و`PASS` لا يغيّر `releaseSystem` تلقائيًا.
- دُعمت انتقالات Receiving إلى `RELEASED` بشكل صريح، مع حفظ `release_system/released_at/released_by`، وتسجيل Audit وOutbox داخل transaction للإنشاء والانتقالات.
- دُعمت Inspection transitions للمراجعة/الإرجاع/الاعتماد والاستئناف من `RETURNED`، مع snapshot submission، ومنع `finalResult` أو point result القادم من العميل أثناء حفظ Draft.
- أُضيفت read models scoped لـQuarantine overview وadmin templates/state distribution، مع فصل metrics للـPASS غير المُحرر عن المُحرر.
- أُضيفت Astro Actions وصفحات Quarantine المعتمدة للـdashboard وreceiving وinspection execution/review وadmin، مع منع `/quarantine/inspections/new` وإظهار controlled states كـread-only.
- أُضيفت اختبارات integration مركزة للمراجعة/SoD/الاعتماد/الإرجاع، release/FAIL/stale، read models، وauthorization matrix، واختبار E2E لحدود الدخول والمسارات.

### الملفات المتأثرة
- `src/modules/quarantine/inspection/application/{review-inspection,approve-inspection,return-inspection,resume-inspection}.ts`
- `src/modules/quarantine/receiving/{application/{hold-receiving,release-receiving,transition-receiving}.ts,infrastructure/postgres-repository.ts,domain/{receiving-item,receiving-state}.ts}`
- `src/modules/quarantine/{application/{dependencies,get-quarantine-overview,get-quarantine-admin}.ts,infrastructure/postgres-quarantine-read-model.ts}`
- `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts`
- `src/actions/{index,quarantine}.ts`
- `src/pages/quarantine/`
- `src/shared/authorization/policy-registry.ts`
- `tests/integration/quarantine/`, `tests/e2e/quarantine.spec.ts`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- فحص TypeScript المفلتر على ملفات MASTER-022 لا يطلع أخطاء جديدة ✅؛ الفحص الكامل ما زال يتأثر باعتمادات Astro/Vitest الناقصة وأخطاء سابقة خارج النطاق.
- `pnpm exec vitest run tests/integration/quarantine --passWithNoTests` ⚠️ محجوب: `vitest` غير موجود في `node_modules`.
- `pnpm lint` ⚠️ محجوب: `eslint` غير موجود، مع Node `v22.22.3` بينما المشروع يطلب `>=24.20.0 <25`.
- `pnpm build` ⚠️ محجوب: `astro` غير موجود.
- `node scripts/architecture/check-route-files.mjs` ⚠️ يفشل بسبب routes ناقصة لـDomains أخرى؛ مسارات Quarantine المطلوبة لا تظهر ضمن القائمة الناقصة.
- فحص static للـDelivery لا يحتوي raw SQL أو استيراد infrastructure بعد فصل dependency composition ✅؛ لا PostgreSQL/Playwright runtime متاح.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** أُنجزت طبقات review/release/read models/pages/actions والضوابط الأمنية محليًا، لكن الاعتماد الرسمي العلمي/السياسي وe-signature غير موفّر فبقيت العمليات الحساسة DENY، كما تعذر إثبات runtime بسبب البيئة.

### ملاحظات / مشاكل مفتوحة
- انتقال `START_INSPECTION` الحالي ما زال انتقال Receiving فقط؛ إنشاء/link Inspection Report داخل transaction يحتاج orchestrator ومصدر numbering/template approved قبل اعتباره مكتملًا.
- شاشة التنفيذ الحالية لا تعرض نقاط template الفعلية ولا تسمح بإدخال observations كاملة؛ لا يجوز تحويل هذا النقص إلى نتيجة رسمية أو ادعاء جاهزية.
- لا يوجد commit أو push، وتم الحفاظ على تعديل المستخدم السابق في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.

## [2026-09-05] — MASTER-021: Quarantine Receiving + Inspection execution baseline

### تم التنفيذ
- أُنشئ Quarantine Receiving domain يحفظ Receiving identity والكمية الموجبة والحالات المنفصلة `workflowState` و`inspectionResult` و`releaseSystem=false`.
- أُضيفت state transitions صريحة للـReceiving مع رفض target state العشوائي، أسباب إلزامية لـHOLD/CANCEL/EXPIRED، ورفض Remove Hold غير المحسوم.
- أُضيفت Receiving repository port وPostgreSQL adapter وuse cases للإنشاء/القراءة/القائمة/تعديل Draft/الانتقال، مع authorization وscope وoptimistic version وaudit hooks.
- أُنشئ Inspection domain مرتبطًا بـReceiving، ويشترط approved template version ويحفظ controlled template context؛ lifecycle منفصل عن `PASS/FAIL/HOLD`.
- أُضيفت Inspection repository port وPostgreSQL adapter وuse cases للبدء/القراءة/القائمة/حفظ Draft/Submit؛ Submit يرفض المسودة الناقصة وينشئ submission snapshot داخل transaction، ولا يوجد مسار `/inspections/new` أو Release تلقائي.
- أُضيفت سياسات Quarantine/Inspection للـauthorization، وdb type mappings للجداول canonical الموجودة في migration `0008`، واختبارات مركزة للنطاقين.

### الملفات المتأثرة
- `src/modules/quarantine/receiving/`
- `src/modules/quarantine/inspection/`
- `src/shared/authorization/policy-registry.ts`
- `src/shared/database/db-types.ts`
- `tests/integration/quarantine/`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- `pnpm exec vitest run tests/integration/quarantine --passWithNoTests` ⚠️ محجوب: Vitest غير مثبت في `node_modules`.
- `pnpm exec tsc --noEmit` ⚠️ محجوب باعتمادات ناقصة (`kysely`, `vitest`, `pg`, Astro/Node types)؛ أخطاء Quarantine الظاهرة مرتبطة بالاعتمادات الناقصة.
- فحص فصل PASS عن release وعدم وجود raw SQL في Delivery ✅ عبر boundary check؛ PostgreSQL/Playwright لم تُشغّل.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات domain/application/ports/PostgreSQL والاختبارات المركزة أُضيفت محليًا، مع إبقاء Release والسياسات العلمية/الاعتمادية غير المحسومة DENY؛ إثبات runtime الكامل ينتظر استعادة dependencies والخدمات.

### ملاحظات / مشاكل مفتوحة
- Approval/Review وRelease وما يتطلبه من SoD/e-signature ما زال policy-dependent، ولم يُنفذ ضمن هذا النطاق.
- Adapter wiring الكامل لـAudit/Outbox ونتائج inspection typed persistence يحتاج استكمالًا قبل اعتماد production behavior.
- لا يوجد commit أو push.

## [2026-09-05] — MASTER-020: Quality Finding → NCR → RCA → CAPA baseline

### تم التنفيذ
- أُنشئت Quality domain models لـFinding وNCR وRCA وCAPA مع الحالات والانتقالات الأساسية المعتمدة، ورفض الانتقالات غير المسموحة، الأسباب الإلزامية، وعدم السماح بإغلاق NCR/CAPA بدون شروط الإغلاق المعتمدة.
- أُضيفت source context للـFinding عبر migration forward-only `0017`، مع إبقاء المصدر مملوكًا لدومينه وعدم تنفيذ cross-domain mutation؛ NCR يقبل فقط relation إلى Finding.
- أُنشئت repository ports وPostgreSQL adapters وuse cases للإنشاء/القراءة/القائمة/الانتقال والتعديل حيث يسمح النموذج، مع UUID/owner-or-creator scoping وoptimistic version predicates.
- أُضيفت Quality overview read model، وAstro Actions لـFinding/NCR/RCA/CAPA؛ direct NCR/CAPA creation غير الموثق بقي DENY، وإغلاق السجلات الحساسة بقي محكومًا بالسياسة/الصلاحية.
- أُضيفت صفحات Quality المعتمدة للـoverview وFinding وNCR وRCA وCAPA، مع إظهار source/history/capability context بدون SQL أو business rules داخل Delivery.
- أُضيفت اختبارات domain مركزة وQuality authorization/E2E smoke تغطي transition/source/closure/authentication negative controls.

### الملفات المتأثرة
- `src/modules/quality/`
- `src/actions/{index,findings,ncr,rca,capa}.ts`
- `src/pages/quality/`
- `src/shared/{authorization/policy-registry,database/db-types}.ts`
- `db/migrations/0017_quality_source_context.sql`
- `tests/integration/quality/`, `tests/e2e/quality.spec.ts`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- Quality route presence scan ✅؛ `check-route-files.mjs` ما زال يفشل فقط على routes canonical قديمة خارج Quality.
- static scan للـDelivery من SQL/raw DB/browser storage/Admin bypass ✅
- `pnpm exec vitest run tests/integration/quality --passWithNoTests` ⚠️ محجوب: Vitest غير موجود في `node_modules`.
- PostgreSQL integration، Astro build/typecheck، وPlaywright لم تُشغّل بسبب الاعتمادات/الخدمات غير المتاحة في البيئة الحالية.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** Quality baseline والحدود والاختبارات المصدرية أُضيفت محليًا، لكن runtime verification الكامل، audit/outbox transaction proof، وإثبات الإغلاق التشغيلي ينتظر تثبيت الاعتمادات واعتماد سياسات الإغلاق/الإنشاء غير المحسومة.

### ملاحظات / مشاكل مفتوحة
- `BR-QUAL-010` و`BR-QUAL-033` وسياسة closure authority ما زالت غير معتمدة؛ direct NCR/CAPA creation وclosure/effectiveness تبقى DENY/POLICY-DEPENDENT.
- يجب تشغيل migration/adapter tests على PostgreSQL المعتمد قبل اعتماد production behavior؛ لا يوجد commit أو push.

## [2026-09-05] — MASTER-019: Tasks domain, persistence, use cases, Actions, and workspaces

### تم التنفيذ
- أُنشئ Tasks Domain مستقل يثبت حالات `DRAFT`, `OPEN`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED` والانتقالات المعتمدة فقط؛ الانتقالات غير المعلنة، hold/cancel/reopen بدون سبب، وإكمال checklist الإلزامي تُرفض.
- أُنشئت Task repository port وPostgreSQL adapter مربوطان بالجداول canonical الموجودة في migration `0006_tasks.sql`، مع UUID boundary، optimistic version matching، فلترة scope للقراءة، وحفظ checklist/assignment الأولي.
- أُضيفت معاملات mutation ذرية لـcreate/update-draft/transition تشمل Audit وOutbox عند wiring الـPostgres adapters؛ state لا يأتي من العميل بل يُشتق من action intent.
- أُنشئت use cases للإنشاء والقراءة والقائمة وتعديل Draft والانتقالات، مع إعادة authorization server-side، scope `OWN`/`ASSIGNED`، ورفض `CANCEL` لأن سياسة الصلاحية ما زالت غير معتمدة.
- أُضيفت Astro Actions رفيعة وصفحات SSR لـ`/tasks`, `/tasks/new`, `/tasks/[taskId]`؛ الصفحات لا تحتوي SQL أو domain rules، وتعرض state/version/checklist وقدرات actions المصرح بها.
- أُضيفت db type mappings وTask policy registry واختبارات unit/use-case/authorization/repository contract وPlaywright protection smoke.

### الملفات المتأثرة
- `src/modules/tasks/{domain,ports,infrastructure,application}/`
- `src/shared/database/db-types.ts`
- `src/shared/authorization/policy-registry.ts`
- `src/actions/{index,tasks}.ts`
- `src/pages/tasks/{index,new,[taskId]}.astro`
- `tests/{unit/tasks,integration/tasks,e2e/tasks.spec.ts}`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- static scan لعدم وجود SQL/domain imports داخل صفحات Tasks ✅
- `pnpm exec vitest run ...tasks...` ⚠️ محجوب: executable `vitest` غير موجود في `node_modules`.
- `pnpm exec astro check` ⚠️ محجوب: executable `astro` غير موجود في `node_modules`.
- `tsc --noEmit` ⚠️ محجوب باعتمادات ناقصة؛ بعد عزل نتائج Tasks بقيت أخطاء missing modules وimplicit-any الناتجة عن غياب type declarations، بدون خطأ domain إضافي ظاهر.
- `node scripts/architecture/check-route-files.mjs` ⚠️ ما زال يفشل بسبب صفحات canonical سابقة كثيرة خارج هذا النطاق؛ صفحات Tasks المطلوبة لم تظهر ضمن النواقص.
- PostgreSQL integration وPlaywright وbuild لم تُشغّل بسبب نفس نقص الاعتمادات/الخدمة.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** نطاق Tasks مكتوب محليًا مع حدود domain/application/repository/Delivery وauthorization/version/audit/outbox، لكن إثبات runtime الحقيقي محجوب حتى تُستعاد dependencies وبيئة Node المعتمدة.

### ملاحظات / مشاكل مفتوحة
- assignment history/checklist persistence موجودان عند الإنشاء، لكن mutations مستقلة للتعليقات والdependencies والrecurrence ورفع evidence ليست ضمن use-case paths المطلوبة ولا توجد لها سياسة/schema تنفيذية إضافية معتمدة في هذا النطاق.
- `CANCEL` يبقى DENY UNTIL POLICY APPROVED حسب STATE-MACHINES.
- يوجد تعديل سابق غير مرتبط في `IMPLEMENTATION-MASTER-PLAN-MERGED.md` وتم الحفاظ عليه كما هو.

## [2026-09-05] — MASTER-018: Report registry, scoped exports, and report pages

### تم التنفيذ
- أُنشئ Report Registry allowlist يحتوي فقط على `quarantine-aging` الموثق كاسم route مثال، مع contract ثابت للأعمدة ومصدر `QUARANTINE_RECEIVING`؛ لا توجد أسماء جداول أو SQL قادمة من العميل.
- أُنشئ `RunReportUseCase` يتحقق من `PERM-RPT-VIEW` و`PERM-RPT-RUN`، يثبت report code من registry، ويتحقق من date filters server-side.
- أُنشئ Postgres query ثابت لـ`qc.receiving_items` يمرر `actor.id` داخل predicate `created_by` ويطبق نفس filters للعرض والتصدير.
- أُنشئ CSV/XLSX exporters من نفس canonical dataset مع prefix apostrophe للخلايا التي تبدأ بـ`=`, `+`, `-`, `@`؛ XLSX يولد artifact داخل الاستجابة ولا ينشئ public temporary file.
- أُنشئ `reports.exportReport` كـAstro Action POST-only منطقيًا، مع إعادة تفويض `PERM-RPT-EXPORT` وصلاحية format-specific، وأُضيفت صفحات `/reports` و`/reports/[reportCode]` SSR مع unknown code = 404.
- أُضيفت permission/policy entries لـReporting، وسُجل `PERM-RPT-EXPORT` ضمن approved seed codes لتطابق متطلب التصدير الصريح.

### الملفات المتأثرة
- `src/modules/reporting/{domain,application,ports,infrastructure}/`
- `src/actions/{index,reports}.ts`
- `src/pages/reports/{index,[reportCode]}.astro`
- `src/shared/authorization/{permissions,policy-registry}.ts`
- `db/seeds/common.ts`
- `tests/unit/reporting/export-safety.test.ts`
- `tests/integration/reporting/{reports,export-report}.test.ts`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- `pnpm exec vitest run tests/unit/reporting/... tests/integration/reporting/...` ⚠️ محجوب: `vitest` غير موجود في `node_modules`.
- `pnpm exec tsc --noEmit` ⚠️ محجوب باعتمادات غير مثبتة (`astro`, `kysely`, `pg`, `vitest`, Node types)؛ لم يعد يظهر syntax error في ملفات reporting.
- `pnpm lint` ⚠️ محجوب: `eslint` غير موجود، والبيئة Node `22.23.1` بدل القيد `24.20+`.
- `pnpm build` ⚠️ محجوب: `astro` غير موجود.
- `node scripts/architecture/check-route-files.mjs` ⚠️ يفشل بسبب صفحات canonical كثيرة سابقة غير موجودة؛ routes الخاصة بالتقارير موجودة ولم تظهر ضمن النواقص.
- Playwright وPostgreSQL integration الفعليان لم يُشغّلا بسبب الاعتمادات/الخدمات غير المتاحة.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات registry/query/use case/export/action/pages والاختبارات مكتوبة مع عزل actor وformula-injection defense و404 للـallowlist؛ إثبات runtime/build/Playwright/PostgreSQL ينتظر بيئة الاعتمادات المعتمدة.

### ملاحظات / مشاكل مفتوحة
- تعريف التقرير التشغيلي التفصيلي غير موجود في الوثائق؛ تم الالتزام بكود route المثال الموثق وdataset receiving ثابت بدون اختراع KPI أو قاعدة علمية.
- تغييرات `IMPLEMENTATION-MASTER-PLAN-MERGED.md` السابقة وغير المرتبطة بقيت بدون تعديل.

## [2026-09-04] — MASTER-017: Dashboard + Search + Notifications + Audit UI

### تم التنفيذ
- أُنشئت Dashboard port/use case وPostgreSQL read model يجمع مؤشرات وattention وactivity على الخادم، ويمرر actor المصادق عليه قبل القراءة.
- فُصلت مؤشرات `Inspection PASS` عن `Released items`، وربط pending review بسجل approval المحدد، ومنع عدّ HOLD خارج predicate مالك السجل.
- أُنشئت صفحات SSR لـ`/dashboard` و`/search` و`/notifications` و`/audit`؛ البحث يتحقق من `q`، والإشعارات recipient-only، ولا توجد mutations عبر GET.
- أُنشئت Audit query service/port وPostgres adapter بفلترة composable، وإخراج view آمن لا يمرر payload، مع صلاحية `PERM-ADM-AUDIT-VIEW` صريحة.
- عُدّل Topbar لفصل عدّاد الإشعارات عن عدّاد approvals، وأُضيفت سياسات Dashboard وAudit إلى policy registry.

### الملفات المتأثرة
- `src/modules/dashboard/{application,get-dashboard.ts,ports/dashboard-query.ts,infrastructure/postgres-dashboard-query.ts}`
- `src/shared/audit/{audit-query.ts,postgres-audit-query.ts}`
- `src/shared/authorization/policy-registry.ts`
- `src/pages/{dashboard/index,search,notifications,audit}.astro`
- `src/ui/shell/Topbar.astro`
- `tests/integration/{dashboard/dashboard-query.test.ts,shared/audit-query.test.ts}`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- forbidden-pattern scan للـDelivery (SQL/mutations/role Admin bypass/secret payloads/browser storage) ✅
- `pnpm exec vitest run ...MASTER-017 tests` ⚠️ محجوب: `node_modules/.bin/vitest` غير موجود.
- `tsc --noEmit` ⚠️ محجوب باعتمادات ناقصة (`astro`, `kysely`, `vitest`, `pg` وغيرها)؛ أصلحت export خطأ MASTER-017 الذي ظهر في الفحص وأُعيد الفحص دون أخطاء خاصة إضافية ظاهرة بعده.
- PostgreSQL integration وPlaywright/mobile/RTL لم تُشغّل: الاعتمادات/خدمة قاعدة البيانات غير متاحة في البيئة الحالية.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات القراءة والصفحات والاختبارات المركزة مكتوبة مع حدود authorization وscope وPASS/RELEASE منفصلة؛ إثبات runtime/build/browser/PostgreSQL ما زال محجوبًا بسبب البيئة.

### ملاحظات / مشاكل مفتوحة
- `SearchService` الحالي يعتمد authorizer injected من delivery ولا يملك بعد عقد ActorContext موحدًا؛ صفحة البحث تتحقق من `PERM-SRCH-USE` قبل الاستدعاء، وتحتاج wiring DI مركزي لاحقًا.
- لا توجد بيانات trend معتمدة في read model الحالي، لذلك تعرض Dashboard حالة عدم توفر trend بدل اختراع سلسلة زمنية.

## [2026-09-04] — MASTER-016: tables, shell/navigation, feedback, e-signature UI, charts, and root/error pages

### تم التنفيذ
- أُنشئت مكونات DataTable وTableToolbar وFilterBar وPagination وSortHeader وEmptyTableState بجداول HTML أصلية، caption، `scope` عبر SortHeader، وفرز/ترقيم ممثلين في query parameters للعرض فقط.
- أُنشئت navigation registry ومكونات Sidebar وTopbar وBreadcrumbs وScopeIndicator وUserMenu؛ الرؤية تعتمد على capability list فقط، مع sidebar قابلة للطي وإبقاء التفويض server-side.
- أُنشئت حالات Empty/Error/Loading/Stale، وConfirmDialog وToastRegion مع رسائل استرجاع واضحة؛ stale يحظر overwrite ولا يعرض خيارًا لتجاوز النسخة.
- أُنشئت ESignatureDialog لعرض معنى الفعل والكيان والنسخة والمستخدم، وإرسال secret لإعادة التحقق دون تخزينه في evidence، مع فصل ceremony عن approval route.
- أُنشئت Chart/KpiCard/Legend وchart-client؛ الرسم الحالي SVG خفيف وله بديل جدولي accessible، ولا يعتمد على بيانات غير مصرح بها أو مكتبة خارجية غير مثبتة.
- أُنشئت `/` للـredirect حسب session، وصفحتا 404 و500 الآمنتان، ووُصلت AppLayout بـSidebar/Topbar الافتراضيين واستُوردت global styles من BaseLayout.

### الملفات المتأثرة
- `src/ui/components/data/`
- `src/ui/components/feedback/`
- `src/ui/components/governance/ESignatureDialog.astro`
- `src/ui/{shell,navigation,client,charts}/`
- `src/ui/layouts/{AppLayout,BaseLayout}.astro`
- `src/pages/{index,404,500}.astro`
- `tests/unit/ui/master-016.test.ts`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- forbidden-pattern scan للـUI (SQL/DB imports، web storage، `innerHTML`، `javascript:`) ✅؛ ظهر فقط import readiness موجودًا سابقًا خارج نطاق UI في `src/pages/api/health/ready.ts`.
- `pnpm test:unit` ⚠️ محجوب: executable `vitest` غير موجود وNode الحالي 22.22.3 بدل Node 24.20+.
- `pnpm build` ⚠️ محجوب: executable `astro` غير موجود وNode الحالي 22.22.3 بدل Node 24.20+.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقة UI المطلوبة وroot/error wiring مكتوبة محليًا مع حدود Delivery صحيحة؛ إثبات Astro compile واختبارات runtime/accessibility ينتظر تثبيت الاعتمادات وتشغيل Node المعتمد.

### ملاحظات / مشاكل مفتوحة
- لم تُضف مكتبة ECharts لأن dependency غير مثبتة في المشروع ولم يوجد provider/قرار معتمد؛ Chart الحالي SVG accessible، ويحتاج قرارًا واعتمادًا مثبتًا إذا كان ECharts إلزاميًا.
- لم تُنفذ use cases أو mutations جديدة؛ حوار التوقيع واجهة ceremony فقط كما تتطلب المواصفات.

## [2026-09-04] — MASTER-015: Design tokens, layouts, UI primitives, and QC forms

### تم التنفيذ
- أُنشئت طبقة tokens الداكنة المعتمدة حرفيًا للألوان، الحالات، الخطوط، المسافات، الحواف، الظلال، الحركة، والـdensity.
- أُضيفت typography privacy-safe محلية فقط عبر font stacks لـInter وIBM Plex Sans Arabic بدون CDN أو طلبات خارجية، مع أساس RTL/LTR يعتمد على `lang` و`dir` من layout props.
- أُنشئت Base/Auth/App layouts؛ AppLayout يركّب slots للـsidebar والـtopbar والمحتوى، ويضيف skip link بدون DB أو business logic.
- أُنشئت primitives قابلة لإعادة الاستخدام: Button وIconButton وBadge وCard وDivider وTooltip وStatusBadge وStateBanner، مع focus-visible وloading وcontrolled-action semantics.
- أُنشئت نماذج طويلة لـFormField وTextInput وTextArea وSelect وCheckbox وDateInput وNumberInput وErrorSummary وFormActions، مع labels ظاهرة، required indication، ARIA descriptions/errors، وعدم اختراع precision أو rounding.
- فُصل `PASS` بصريًا عن `RELEASED`، وفُصل `Save Draft` عن controlled action؛ الواجهات لا تنفذ authorization ولا تتعامل مع state كحقيقة موثوقة من العميل.

### الملفات المتأثرة
- `src/ui/styles/{tokens,global,motion,density}.css`
- `src/ui/layouts/{BaseLayout,AuthLayout,AppLayout}.astro`
- `src/ui/components/{Button,IconButton,Badge,Card,Divider,Tooltip,StatusBadge,StateBanner}.astro`
- `src/ui/components/forms/`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `git diff --check` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- approved-token static contract: `24` مسار مطلوب موجود، وفحوص القيم المعتمدة ✅
- UI forbidden-pattern scan (DB/SQL/Auth/debug/secrets) ✅
- `pnpm build` ⚠️ محجوب: `astro` غير موجود في `node_modules`، والبيئة Node 22 بدل Node 24.20+
- typecheck/lint/runtime browser accessibility: لم تُشغّل بسبب الاعتمادات الناقصة؛ تحتاج بيئة المشروع المعتمدة.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** نطاق MASTER-015 مكتوب محليًا مع tokens وlayouts وprimitives وforms وحدود UI صحيحة؛ إثبات Astro build/typecheck وbrowser accessibility ينتظر استعادة الاعتمادات وNode المعتمد.

### ملاحظات / مشاكل مفتوحة
- يوجد تعديل سابق غير مرتبط في `IMPLEMENTATION-MASTER-PLAN-MERGED.md` وتم الحفاظ عليه كما هو.
- لا توجد بيانات علمية أو صلاحيات approval/release أو سياسات precision/rounding جديدة في هذا النطاق.

## [2026-09-04] — MASTER-014: Authorization administration repository, use cases, scopes, and Actions

### تم التنفيذ
- أُنشئت واجهة `AuthorizationRepository` وPostgreSQL implementation لقراءة الأدوار والصلاحيات، وتحديث grants الخاصة بالدور، وإدارة user scopes.
- أُضيفت migration `0016_authorization_scopes.sql` لتخزين scopes الصريحة؛ الإلغاء يحفظ التاريخ ولا يحذف assignment السابق.
- أُنشئت use cases لعرض الأدوار، عرض role، عرض permissions، تحديث role permissions، وإدارة user scopes مع authorization server-side ورفض self-grant.
- أُضيفت سياسات `PERM-ADM-*` إلى policy registry وأُضيفت Astro Actions رفيعة مربوطة بالـuse cases، بدون actor/target-state موثوق من العميل.
- تحديث role permissions يتم بمعاملة واحدة تشمل version check وgrant replacement وaudit؛ Actions تنشئ audit repository PostgreSQL لضمان atomicity مع mutation.
- أُضيفت اختبارات مركزة لـAdmin بدون permission، stale version، self-scope grant، canonical permission، cross-scope isolation، وعقود admin policies.

### الملفات المتأثرة
- `db/migrations/0016_authorization_scopes.sql`
- `src/modules/administration/{ports, infrastructure, application}/`
- `src/actions/{admin,index}.ts`
- `src/shared/{authorization/policy-registry,database/db-types}.ts`
- `tests/integration/{administration,actions/admin-actions.test.ts}`
- `tests/integration/database/migrations.test.ts`
- `tests/integration/database/upgrade-path.test.ts`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- forbidden-pattern scan للصلاحيات الوهمية وraw SQL في Delivery و`ON DELETE CASCADE` ✅
- `pnpm lint` ⚠️ محجوب: `eslint` غير موجود في `node_modules`، مع Node 22 بدل Node 24.20+
- Vitest tests ⚠️ محجوبة: executable `vitest` غير موجود في `node_modules`.
- PostgreSQL integration/atomicity الفعلية ⚠️ لم تُشغّل؛ تحتاج الاعتمادات وcontainer runtime.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** نطاق MASTER-014 مكتوب محليًا مع حدود authorization وDelivery صحيحة، لكن لا يوجد إثبات runtime للـTypeScript/Vitest/PostgreSQL بسبب بيئة الاعتمادات الحالية.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل `pnpm install --frozen-lockfile` على Node 24.20+ ثم تشغيل lint وVitest وPostgreSQL integration.
- migration `0016` إضافة لازمة لأن repository الحالي لم يكن يملك storage رسميًا لـuser scopes.

## [2026-09-04] — MASTER-013: Account/admin-user use cases + Actions + login/account pages + middleware

### تم التنفيذ
- أُضيفت use cases لقراءة الحساب وتغيير كلمة المرور وإنشاء/تحديث/تعطيل المستخدم وAdministrative Password Reset، مع authorization server-side وصلاحيات الهوية الرسمية فقط.
- تغيير كلمة المرور وAdministrative Reset وتعطيل الحساب تتحقق من current password/expected version حيث يلزم، وتبطل الجلسات في المسارات الأمنية المطلوبة؛ recovery/reset pages العامة لم تُنشأ.
- أُضيفت Astro Actions رفيعة لـlogin/logout/change-password، مع `safeReturnTo`، cookies HttpOnly/SameSite، وتحويل الأخطاء إلى رسائل آمنة.
- أُضيفت صفحات SSR لـ`/login` و`/account` بعناوين labels، password autocomplete، error alert، وPOST-only logout.
- عُدّل middleware لإنشاء request context، وحل opaque session من الخادم، وتعبئة `Astro.locals.user/actor`، وحماية المسارات المحمية مع redirect محلي إلى login.
- أُضيفت اختبارات مركزة للحساب/session، منع Admin role bypass، safe returnTo، وعقد middleware/actions.

### الملفات المتأثرة
- `src/modules/identity/application/{get-account,change-password,create-user,update-user,disable-user,admin-reset-password,identity-dependencies}.ts`
- `src/modules/identity/{ports/user-repository,infrastructure/postgres-user-repository}.ts`
- `src/actions/{index,auth,account}.ts`
- `src/pages/{login,account}.astro`
- `src/middleware.ts`, `src/env.d.ts`, `src/shared/authorization/policy-registry.ts`, `src/shared/database/db-types.ts`
- `tests/integration/{identity,actions,http}`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- فحص عدم وجود recovery/reset pages ✅
- فحص عدم وجود raw SQL/Kysely imports داخل Delivery ✅
- `pnpm exec tsc --noEmit` ⚠️ البيئة ناقصة `node_modules` وأظهرت أخطاء dependencies/foundation؛ لم يظهر خطأ syntax في الملفات الجديدة بعد إصلاح الإغلاق.
- `pnpm lint` ⚠️ محجوب: `eslint` غير موجود لأن `node_modules` غير مكتملة.
- Vitest/Playwright/Build ⚠️ لم تُشغّل لنفس سبب نقص الاعتمادات؛ PostgreSQL/Testcontainers غير متاحين.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تم تنفيذ نطاق MASTER-013 محليًا مع حدود Delivery صحيحة وفحوص static، لكن لا يمكن اعتبار runtime أو PostgreSQL أو Playwright متحققًا حتى تُستعاد الاعتمادات وبيئة Node المعتمدة.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل `pnpm install --frozen-lockfile` في بيئة شبكة/Node 24.20+، ثم تشغيل Vitest وPlaywright وAstro build.
- يلزم مراجعة/تشغيل transaction integration الفعلية لتعريف إثبات atomicity بين mutation وsession invalidation وaudit على PostgreSQL.
- ملف `IMPLEMENTATION-MASTER-PLAN-MERGED.md` فيه تعديل سابق غير مرتبط بالمهمة، وتم تركه كما هو.

## [2026-09-04] — MASTER-012: Identity domain + password/session authentication (جزئي)

### تم التنفيذ
- أُنشئت كيانات domain مستقلة لـUser/AccountState/Session بدون imports من PostgreSQL أو Kysely.
- أُنشئت ports وPostgreSQL repositories لقراءة المستخدم والجلسة، إنشاء الجلسات، وتكرار revoke بشكل idempotent عبر predicates server-side.
- أُنشئت SessionService بجلسات opaque عشوائية 256-bit، تخزين SHA-256 فقط، وفحص ACTIVE/expiry/revocation من الخادم.
- أُنشئت Login/Logout/Resolve-session use cases؛ login لا يفرق للمستخدم بين unknown/wrong-password/disabled، وlogout يرجع cookie حذف idempotent.
- أُنشئ Argon2id adapter بمعايير Security Architecture (memory 19 MiB، iterations 2، parallelism 1) ويفشل بإعداد آمن إذا الاعتمادية غير مثبتة.
- أُضيفت اختبارات domain أولية واختبار configuration guard للـArgon2.

### الملفات المتأثرة
- `src/modules/identity/domain/`
- `src/modules/identity/ports/`
- `src/modules/identity/infrastructure/`
- `src/modules/identity/security/`
- `src/modules/identity/application/`
- `src/shared/errors/error-codes.ts`
- `tests/unit/identity/`

### التحقق
- `git diff --check` ✅
- `pnpm exec tsc --noEmit` ⚠️ محجوب بعد محاولة pnpm لإعادة بناء `node_modules`؛ lockfile لم يتغير، لكن البيئة الحالية Node 22 بدل Node 24.20+ ولا توجد شبكة/اعتمادية Argon2.
- اختبارات Vitest وreal PostgreSQL repository/session integration: لم تُشغّل لأن `node_modules` غير مكتمل وTestcontainers يحتاج runtime.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات الهوية الأساسية مكتوبة، لكن لا يوجد إثبات تشغيلي للاختبارات/PG، ولا يمكن اعتماد password hashing فعلي حتى تتوفر حزمة Argon2id في بيئة Node المعتمدة.

### ملاحظات / مشاكل مفتوحة
- يلزم تثبيت `argon2` وتحديث lockfile عبر بيئة شبكة/حزمة معتمدة قبل تشغيل password tests.
- لم تُضف Delivery actions/pages أو password-reset completion؛ خارج الملفات المطلوبة في هذا الـprompt.

## [2026-09-04] — MASTER-010: Notifications + Files/Evidence + Object Storage + Search

### تم التنفيذ
- أُنشئت notification capability بعقد domain/repository/service وPostgreSQL repository؛ القراءة محصورة بالمستلم، وmark-read يمرر recipient داخل UPDATE ويعيد نفس الحالة عند replay.
- أُضيفت سياسات authorization صريحة لـ`PERM-NOT-VIEW-OWN` و`PERM-NOT-MARK-READ` بدون Admin bypass أو provider خارجي.
- أُنشئت files/evidence capability مع metadata repository، ربط evidence تاريخيًا بدون حذف، SHA-256 للـbytes الفعلية، وFileService يفوض قبل upload/download ويتحقق من hash عند التحميل.
- أُنشئ ObjectStore abstraction مع LocalObjectStore للاختبار/التطوير فقط ومنع traversal، وS3-compatible adapter يفرض `acl: private` بدون اختراع provider أو credentials.
- أُنشئت SearchResult/SearchService/PostgresSearch للكيانات المعتمدة فقط؛ q محدود إلى 200 حرفًا، limit محدود إلى 100، والاستعلامات parameterized وتضع actor predicates داخل SQL.
- أُضيفت اختبارات العزل بين المستخدمين، mark-read replay، hash mismatch، unauthorized access، path traversal، local roundtrip، private S3 contract، query limits وSQL-injection input.

### الملفات المتأثرة
- `src/shared/notifications/{notification,notification-repository,postgres-notification-repository,notification-service}.ts`
- `src/shared/files/{file-record,file-repository,postgres-file-repository,object-store,local-object-store,s3-object-store,sha256,file-service}.ts`
- `src/shared/search/{search-result,search-service,postgres-search}.ts`
- `src/shared/authorization/policy-registry.ts`
- `src/shared/database/db-types.ts`
- `tests/integration/shared/{notifications,files,object-store,search}.test.ts`

### التحقق
- اختبارات مركزة MASTER-010: `4 files / 7 tests` ✅
- `pnpm test:unit`: `8 files / 21 tests` ✅
- `pnpm lint` ✅
- `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- `pnpm test:integration`: ⚠️ 5 PostgreSQL suites محجوبة لأن Testcontainers لم يجد container runtime؛ 8 suites غير PostgreSQL مرّت و14 اختبارًا PostgreSQL تخطّت.
- `pnpm format:check`: ⚠️ ملف سابق خارج النطاق `db/seeds/common.ts` غير منسق؛ ملفات MASTER-010 منسقة.
- `pnpm exec tsc --noEmit`: ⚠️ أخطاء foundation/dependency في Astro وNode 22، مع تصفية أخطاء ملفات MASTER-010 وعدم ظهور أخطاء TypeScript جديدة فيها.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** capability layers والاختبارات المحلية وbuild/lint مكتملة، لكن إثبات PostgreSQL 18 الفعلي وS3 disposable service محجوبان؛ لا يوجد claim بجاهزية الإنتاج.

### ملاحظات / مشاكل مفتوحة
- نموذج scope assignments غير معتمد في المواصفات؛ Search يطبق server-side ownership/assignee predicates الحالية فقط، وتحتاج scopes الأوسع read model/policy معتمدة قبل إضافتها.
- لا توجد retention/MIME-size policy أو external email/SMS provider أو backup credential authority جديدة.

## [2026-09-04] — MASTER-009: concurrency + central authorization + SoD + audit + outbox

### تم التنفيذ
- أُضيفت optimistic-concurrency primitives في `src/shared/concurrency/version.ts` لرفض النسخة القديمة بـ`CONFLICT_STALE_VERSION` واحتساب النسخة التالية.
- أُضيفت idempotency service/repositories مع fingerprint SHA-256، replay بدون إعادة mutation، ورفض إعادة استخدام المفتاح مع command مختلف؛ وأُضيفت migration `0015` وجدول durable idempotency.
- أُنشئت authorization layer مركزية تجمع actor/account state/explicit permission/entity/state/scope/ownership/SoD/version/business condition، مع default-deny وبدون role hierarchy أو Admin bypass؛ أكواد permissions من canonical seed.
- أُنشئت SoD default تمنع self-review/self-approval/self-release/self-sign، مع policy registry لا يسمح إلا بسياسة معرفة صراحة.
- أُنشئت audit service/repository append-only contract مع حقول actor/action/reason/correlation ورفض payload keys الحساسة؛ وأُنشئت outbox enqueue/claim/processed/retry وworker بمعاملة claim و`SKIP LOCKED`.
- أُضيفت اختبارات authorization/SoD/idempotency/audit/outbox، وتحديث اختبارات migration لتتوقع 15 migration.

### الملفات المتأثرة
- `src/shared/{concurrency,authorization,idempotency,audit,outbox}/`
- `src/shared/database/db-types.ts`
- `db/migrations/0015_idempotency_records.sql`
- `scripts/workers/outbox.ts`
- `tests/unit/shared/{authorization-types,authorize,sod}.test.ts`
- `tests/integration/shared/{idempotency,audit,outbox}.test.ts`
- `tests/integration/database/{migrations,upgrade-path}.test.ts`

### التحقق
- `pnpm exec vitest run ...` للـauthorization/SoD/shared integration: 6 files / 12 tests ✅
- `pnpm test:unit`: 8 files / 21 tests ✅
- `pnpm exec tsc --noEmit`: ✅ على Node 22 مع تحذير engine؛ المشروع يطلب Node 24.20+
- `pnpm lint` ✅
- `pnpm build` ✅
- Prettier للملفات المتأثرة + `node scripts/architecture/check-boundaries.mjs` + `git diff --check` ✅
- `pnpm test:integration`: ⚠️ 5 suites PostgreSQL فشلت قبل الاختبارات لأن Docker/container runtime غير متاح؛ لا يوجد إثبات PG فعلي هنا.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات concurrency/idempotency/authorization/SoD/audit/outbox والاختبارات المحلية الأساسية منفذة ومتحققة، لكن real PostgreSQL concurrent/atomicity/privilege verification محجوب ببيئة التشغيل.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل Testcontainers على PostgreSQL 18 فعلياً للتحقق من migration `0015`، replay/conflict عبر PG، claim المتوازي، rollback/atomic commit، وبقاء التاريخ.
- لا توجد قيم علمية أو صلاحيات release/approval غير معتمدة مخترعة؛ السياسات غير المعرفة تبقى DENY.

## [2026-09-04] — Commit ودفع تغييرات MASTER-008

### تم التنفيذ
- جرى تجهيز كل تغييرات MASTER-008 الحالية، بما فيها migrations وseeds وfactories والاختبارات وتحديث الـ mind.
- تم اعتماد commit محلي واحد للتغييرات قبل الدفع.
- تم الدفع إلى `origin/main` بعد تأكيد المستخدم.

### الملفات المتأثرة
- `db/migrations/0010_assets.sql` إلى `db/migrations/0014_backup_recovery_metadata.sql`
- `db/seeds/`
- `tests/`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص حالة الفرع والريموت قبل الدفع ✅
- `git diff --check` ✅
- `git commit` بالرسالة `feat: add assets approvals and seed schemas` ✅
- `git push origin main` ✅ — `main` انتقل من `6c987b1` إلى `ab44284`

### النتيجة
- **الحالة:** نجح
- **مختصر:** تم إنشاء commit ودفع تغييرات MASTER-008 بنجاح إلى `origin/main` بدون force push.

### ملاحظات / مشاكل مفتوحة
- لا يوجد.

## [2026-09-04] — MASTER-008: Assets + Documents + Approvals + Change Requests + Backup metadata + seeds

### تم التنفيذ
- أُضيفت `0010_assets.sql` لكيانات Equipment/Calibration/Maintenance مع حالات lifecycle المعتمدة وFKs تاريخية `RESTRICT`، وربط `current_calibration_id` بدون اختراع interval أو overdue behavior.
- أُضيفت `0011_documents.sql` لفصل Document Identity عن Version وعن File bridge، مع revision uniqueness وpartial unique index يمنع أكثر من EFFECTIVE version لكل document.
- أُضيفت `0012_approvals_esignatures.sql` لـapproval cases/work items/append-only decisions/electronic signatures؛ لا توجد كلمات مرور أو reauth secrets أو Admin business bypass.
- أُضيفت `0013_change_requests.sql` مع target version/snapshot وfield-level JSONB changes ومحاولات apply ذات sequence ونتيجة success/failed.
- أُضيفت `0014_backup_recovery_metadata.sql` لـbackup/restore execution metadata فقط؛ لم تُخترع RPO/RTO أو retention/provider/production authority.
- أُضيفت seeds غير إنتاجية deterministic وidempotent (`db/seeds/dev.ts`, `db/seeds/test.ts`) للأدوار الأربعة و197 permission canonical فقط، مع production guard؛ لا يتم إنشاء users أو credentials.
- أُضيفت factories deterministic مع overrides صريحة للحالة والنسخة والـscope للاختبارات السلبية، واكتملت FKs المختبر المؤجلة إلى Equipment/Calibration/Documents داخل migrations المالكة.

### الملفات المتأثرة
- `db/migrations/0010_assets.sql`
- `db/migrations/0011_documents.sql`
- `db/migrations/0012_approvals_esignatures.sql`
- `db/migrations/0013_change_requests.sql`
- `db/migrations/0014_backup_recovery_metadata.sql`
- `db/seeds/{common,dev,test}.ts`
- `tests/helpers/factories.ts`
- `tests/unit/seeds-factories.test.ts`
- `tests/integration/database/seeds.test.ts`
- `tests/integration/database/{migrations,constraints,upgrade-path}.test.ts`

### التحقق
- `pnpm test:unit` → 5 files / 15 tests ✅
- `pnpm lint` ✅
- `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- `prettier --check` للملفات الجديدة/المتأثرة ✅
- `git diff --check` ✅
- forbidden-pattern/secret scan ✅؛ لا `ON DELETE CASCADE` ولا `PERM-ADMIN-BYPASS-ALL` ولا credentials.
- PostgreSQL مؤقت محلي مع substitution مؤقت لـ`uuidv7()` بسبب عدم توفر PostgreSQL 18 محليًا: fresh migration للسلسلة كاملة، FKs/قيود، seed مرتين، `roles=4`, `permissions=197`, `nonrestrict_fks=0`, وproduction guard blocked ✅ كتحقق compatibility فقط.
- `pnpm exec vitest run tests/integration/database --passWithNoTests` ⚠️ محجوب: لا يوجد container runtime لـTestcontainers PostgreSQL 18.
- `pnpm typecheck` ⚠️ 5 أخطاء foundation سابقة خارج النطاق في `src/middleware.ts` و`src/pages/api/health/ready.ts`.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** ملفات assets/documents/approvals/change/backup وseed/factories مكتوبة ومتحققة static/unit، ونجح PostgreSQL compatibility run؛ إثبات Testcontainers PostgreSQL 18 وtypecheck العام ما زالا محجوبين/خارج النطاق.

### ملاحظات / مشاكل مفتوحة
- يلزم PostgreSQL 18/container runtime لتشغيل fresh/upgrade/invalid-row/seed integration الرسمية.
- `risk_level` للصلاحيات غير محدد في المواصفات، لذلك seed يستخدم قيمة metadata محايدة `UNSPECIFIED` ولا يوزع permissions على roles.
- Production restore، RPO/RTO، retention، provider، وexact approval authorities تبقى DENY/POLICY-DEPENDENT.

## [2026-09-04] — MASTER-007: Tasks + Quality + Quarantine + Laboratory schemas

### تم التنفيذ
- أُضيفت هجرات `0006` إلى `0009` لجداول Tasks وQuality وQuarantine وLaboratory حسب الكيانات migration-safe المعتمدة.
- أُضيفت قيود حالات Task/Finding/NCR/RCA/CAPA/Receiving/Inspection/Lab، وفصلت `workflow_state` عن `inspection_result` وعن `release_system`.
- حُفظت traceability للمختبر عبر template versions وsamples وraw typed measurements وretest self-reference/sequence/reason وhistorical snapshots.
- حُفظت controlled history عبر `ON DELETE RESTRICT`، ومنعت snapshots من UPDATE/DELETE لصلاحية runtime؛ لم تُخترع limits علمية أو release/approval policy.
- أُضيفت اختبارات migration ledger، upgrade count، وجود الجداول، وinvalid-row constraints للـquantity/state/retest.
- لم تُهاجر recurrence rules أو CAPA effectiveness reviews أو retest_requests لأنها غير مؤكدة/تعتمد على policy. كما بقيت FKs إلى Equipment/Calibration/Documents مؤجلة للهجرات المالكة اللاحقة حتى لا ينكسر fresh ordering.

### الملفات المتأثرة
- `db/migrations/0006_tasks.sql`
- `db/migrations/0007_quality.sql`
- `db/migrations/0008_quarantine.sql`
- `db/migrations/0009_laboratory.sql`
- `tests/integration/database/{migrations,constraints,upgrade-path}.test.ts`

### التحقق
- `pnpm test:unit` → 4 files / 13 tests ✅
- `pnpm lint` ✅
- `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- `prettier --check tests/integration/database` ✅
- `git diff --check` ✅
- PostgreSQL مؤقت محلي مع substitution مؤقت لـ`uuidv7()` لأن النسخة المحلية ليست PostgreSQL 18: fresh application للسلسلة كاملة، 42 جدولًا، invalid quantity/state/retest rows مرفوضة، وruntime DDL privileges = false/false ✅ كتحقق صياغة/قيود فقط.
- `vitest` integration الرسمي على Testcontainers PostgreSQL 18 ⚠️ محجوب: لا يوجد container runtime.
- `pnpm typecheck` ⚠️ أخطاء foundation سابقة خارج النطاق في `src/middleware.ts` و`src/pages/api/health/ready.ts`.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** هجرات الدومينات واختبارات ledger/constraints مكتوبة ومراجعة، مع نجاح static/unit وPostgreSQL compatibility validation؛ إثبات Testcontainers PostgreSQL 18 وupgrade runner الفعلي ما زال محجوبًا ببيئة التشغيل.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل integration على PostgreSQL 18 فعليًا لإغلاق fresh/upgrade/invalid-row runtime verification.
- يلزم تنفيذ هجرات Equipment/Calibration/Controlled Documents لاحقًا لإضافة FKs المؤجلة من usage bridges.
- لا توجد قيم علمية أو سياسات release/approval/retest/effectiveness جديدة مخترعة.

> **Status:** ACTIVE — canonical live project memory
> **Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`
> **Default branch:** `main`
> **Product:** QC Operations & Laboratory Management System
> **Architecture:** Modular Monolith
> **Web framework:** Astro
> **Rendering model:** Server-rendered / on-demand
> **Database:** PostgreSQL
> **Operational timezone:** `Asia/Riyadh`
> **Last reset:** 2026-09-04

## [2026-09-04] — MASTER-006: shared identity/authz/audit/outbox/files schemas

### تم التنفيذ
- أُضيفت `password_reset_requests` مع `token_hash` فقط، وقيود انتهاء الطلب ومرجع المستخدم بدون تخزين reset token plaintext.
- أُضيفت جداول `roles` و`permissions` و`role_permissions` و`user_roles` مع UUIDs، قيود uniqueness/FK/version/range، وزُرعت الأدوار الأساسية الأربعة فقط (`EMPLOYEE`, `SUPERVISOR`, `MANAGER`, `ADMIN`) بدون role hierarchy أو Admin bypass.
- أُضيفت `0004` لفهارس audit/outbox المعتمدة؛ audit وoutbox الأساسيان موجودان من `0001` بصلاحيات runtime محدودة وبدون cascade هدّام.
- أُضيفت `files` و`evidence_links` و`notifications` و`notification_deliveries` ببيانات metadata/hash/storage refs، مع إبقاء binary خارج PostgreSQL وقيود hash/size/removal/dedupe/subject pairs.
- لم يُنشأ `idempotent_commands` ولا scope tables لأن المواصفات تصنفها صراحة `DO NOT MIGRATE`/UNCONFIRMED إلى أن تعتمد استراتيجية API ونموذج التنظيم؛ تم توثيق ذلك داخل migration `0004` بدل اختراع policy.
- أُضيفت اختبارات وجود الجداول وinvalid-row constraints، وحُدّثت اختبارات ledger/upgrade path لتتوقع migrations `0001` إلى `0005`.

### الملفات المتأثرة
- `db/migrations/0002_identity.sql`
- `db/migrations/0003_authorization.sql`
- `db/migrations/0004_audit_outbox_idempotency.sql`
- `db/migrations/0005_files_notifications.sql`
- `tests/integration/database/{migrations,constraints,upgrade-path}.test.ts`

### التحقق
- `pnpm format:check` ✅
- `pnpm lint` ✅
- `pnpm test:unit` → 4 files / 13 tests ✅
- `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- `pnpm exec vitest run tests/integration/database --passWithNoTests` ⚠️ تعذر runtime لأن Docker/container runtime غير متاح؛ fresh migration وupgrade وPostgreSQL constraint tests لم تُنفذ فعليًا.
- `pnpm typecheck` ⚠️ أخطاء سابقة خارج نطاق schema في `src/middleware.ts` و`src/pages/api/health/ready.ts`.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** migrations والاختبارات المطلوبة مكتوبة ومراجعة static، مع الحفاظ على حدود الصلاحيات والتاريخ؛ إثبات PostgreSQL runtime الفعلي واستراتيجية idempotency ما زالا محجوبين/غير معتمدين.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل PostgreSQL 18 فعليًا لإثبات fresh/upgrade/invalid-row constraints.
- يلزم اعتماد API command/idempotency policy قبل إنشاء جدول idempotency.
- لا توجد قيم علمية أو سياسات release/approval أو retention جديدة في هذا التغيير.

## [2026-09-04] — MASTER-005: PostgreSQL runtime + migration engine + core schema

### تم التنفيذ
- أُنشئت حدود runtime مشتركة لـ`pg.Pool` وKysely وtransaction helper، مع `UTC` و`search_path=qc,pg_catalog` وإغلاق pool صريح وترجمة أخطاء PostgreSQL إلى `AppError`.
- أُنشئ migration runner صريح يقرأ migrations SQL بترتيب ثابت، يحسب SHA-256، يسجل ledger في `qc.schema_migrations`، ويستخدم PostgreSQL advisory lock لمنع التشغيل المتوازي.
- أُنشئت `0001_core_schema.sql` لبنية `qc` فقط: ledger، users، sessions، audit_events، outbox_events؛ بدون جداول domain أو RLS، ومع UUIDv7 native وقيود FK/CHECK/UNIQUE وسلوك تاريخي محافظ.
- أُضيفت أدوار PostgreSQL primitive منفصلة `qc_migrator` و`qc_app_runtime`، مع منع runtime من DDL وCREATE على `public` و`qc`، ومنح أقل صلاحيات لازمة للجداول الأساسية.
- أُضيفت اختبارات migrations/constraints/upgrade path، وREADME يثبت immutability وforward-only policy، وحُدّثت scripts `db:migrate` و`db:migrate:status` و`db:migrate:check` لمساراتها الجديدة.

### الملفات المتأثرة
- `src/shared/database/{db-types,pool,database,transaction}.ts`
- `scripts/db/{migrate,migration-status,check-migration-integrity}.ts`
- `db/migrations/{README.md,0001_core_schema.sql}`
- `tests/integration/database/{migrations,constraints,upgrade-path}.test.ts`
- `package.json`, `vitest.config.ts`

### التحقق
- TypeScript compile للملفات الجديدة مع `--ignoreConfig` ✅
- `pnpm lint` ✅
- `pnpm format:check` ✅
- `git diff --check` ✅
- `pnpm test:unit` → 4 files / 13 tests ✅
- `pnpm test:integration -- database` ⚠️ فشل لأن Docker/container runtime غير متاح؛ PostgreSQL 18 لم تُشغّل فعليًا في هذه البيئة.
- `pnpm db:migrate:check` ⚠️ وصل للسكريبت وفشل آمنًا بـ`errors.system_configuration_invalid` لغياب `DATABASE_URL`؛ لم تُعرض credentials.
- `pnpm typecheck` ⚠️ بقيت أخطاء سابقة خارج ملفات المهمة في `src/middleware.ts` و`src/pages/api/health/ready.ts` مرتبطة بـ`tsconfig`/Astro types.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقة runtime وmigration/core schema والاختبارات مكتوبة ومتحققة static/unit، لكن إثبات PostgreSQL 18 الفعلي وfresh/upgrade/privilege runtime verification محجوبان بغياب Docker و`DATABASE_URL`، ولا يوجد claim بجاهزية الإنتاج.

### ملاحظات / مشاكل مفتوحة
- لا توجد قيم علمية أو سياسات release/approval جديدة، ولا جداول domain أُنشئت.
- يلزم تشغيل اختبارات database على PostgreSQL 18 فعلية، ثم معالجة أخطاء typecheck السابقة في نطاق منفصل قبل claim شامل.

## [2026-09-04] — MASTER-004: runtime config + IDs/time + errors + validation

### تم التنفيذ
- أُنشئت طبقة server-only typed config في `src/config/` تفرق بين `DATABASE_URL` و`SESSION_SECRET` كإعدادات حرجة للإنتاج، وإعدادات observability/version الاختيارية، مع أخطاء startup redacted.
- أُضيف UUIDv7 تقني مولّد على الخادم، وClock يعتمد وقت الخادم، وتحويل عرض آمن إلى `Asia/Riyadh`، وpagination bounded بحد أقصى تقني 100.
- أُنشئت عائلات AppError canonical (`AUTH/AUTHZ/VALIDATION/DOMAIN/CONFLICT/RESOURCE/SYSTEM`) مع mapping آمن إلى Action errors وRFC 9457 Problem Details؛ `CONFLICT_STALE_VERSION` يرجع 409 وdatabase unavailable يرجع 503.
- أُضيفت schemas/parsers للـUUID والتاريخ والتصفح/query، مع رفض UUID غير الصحيح قبل أي lookup، وstructured field errors.
- أُضيف request context وmiddleware يولدان/يحافظان على `requestId` ويربطان `traceId` و`spanId`، بدون أخذ actor أو permission أو final state من العميل.
- أُضيف `safeReturnTo` يقبل local relative paths فقط ويمنع open redirect، مع اختبارات unit وintegration مركزة.

### الملفات المتأثرة
- `src/config/{constants,env,runtime}.ts`
- `src/shared/{id,time,pagination,errors,validation,http}/`
- `src/middleware.ts`, `src/env.d.ts`
- `tests/unit/shared/`, `tests/integration/http/`

### التحقق
- TDD: اختبار pagination فشل أولًا مع السالب ثم نجح بعد تطبيق bounded normalization ✅
- `pnpm test:unit` → 4 files / 13 tests ✅
- `pnpm exec vitest run tests/integration/http/middleware.test.ts` → 1 test ✅
- `pnpm typecheck` → 0 errors/warnings/hints ✅
- `pnpm lint` ✅
- `pnpm format:check` ✅
- `pnpm build` ✅
- `git diff --check` وDelivery/raw-SQL/secret scans ✅
- `pnpm test:integration` ⚠️ اختبار PostgreSQL السابق لم يبدأ لأن Docker/container runtime غير متاح محليًا؛ اختبار HTTP integration نفسه نجح.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** foundation المطلوب لـruntime/config/IDs/time/errors/validation/request context منفذ ومتحقق محليًا؛ تحقق PostgreSQL container الكامل يبقى محجوبًا بسبب بيئة Docker، والتوافق المحلي مع Node 24 غير متاح (المحلي Node 22.22.3).

### ملاحظات / مشاكل مفتوحة
- ما زالت auth/session repository الفعلية وauthorization داخل use cases خارج نطاق MASTER-004؛ middleware لا يمنح صلاحية ولا ينفذ business rules.
- لا توجد قيم علمية أو سياسات release/approval جديدة في هذا التغيير.

## [2026-09-04] — إصلاح فشل Deploy على Render (port binding)

### تم التنفيذ
- شخص السبب الجذري: `@astrojs/node` standalone كان يربط السيرفر على localhost فقط (`[::1]`)، وRender يطلب المنفذ على `0.0.0.0` → "No open ports detected" → Deploy Timed Out.
- تحقق تجريبيًا أن `host` option داخل `node({...})` يتجاهله الـ adapter (يقرأ `config.server.host` فقط)، بينما `HOST` env يعمل ويُنتج binding على `*:port`.
- أضيف `HOST=0.0.0.0` كـ env var في `render.yaml` كحل رسمي.

### الملفات المتأثرة
- `render.yaml`

### التحقق
- `pnpm build` ✅
- `pnpm typecheck` ✅ (0 errors/warnings)
- تشغيل `PORT=4321 HOST=0.0.0.0 node dist/server/entry.mjs` → `lsof` يظهر `*:4321 LISTEN` (كل الواجهات) ✅
- بدون `HOST` → `[::1]` فقط (أعيد إنتاج مشكلة Render محليًا) ✅

### النتيجة
- **الحالة:** نجح (محليًا)
- **مختصر:** الإصلاح عبارة عن env var واحد في render.yaml؛ الـ deploy الفعلي على Render يحتاج المستخدم يعمل redeploy بعد commit.

### ملاحظات / مشاكل مفتوحة
- إذا خدمة Render غير مربوطة بـ Blueprint، لازم المستخدم يضيف `HOST=0.0.0.0` يدويًا في Environment Variables من الداشبورد أيضًا.


## [2026-09-04] — MASTER-003: Testing harness + CI baseline

### تم التنفيذ
- أُنشئ `vitest.config.ts` لفصل مسارات unit/integration وتشغيلها في Node مع timeouts مناسبة لحاويات الاختبار، وأُنشئ setup يعيد mocks/env stubs بعد كل test.
- أُنشئ helper لحاوية `postgres:18-alpine` عبر `@testcontainers/postgresql` وبـdatabase/username/password خاصة بالاختبار فقط؛ ما يكتب `DATABASE_URL` ولا يستخدم أي credential إنتاجي.
- أُنشئ PostgreSQL 18 integration smoke ينفذ `SELECT version()` على حاوية disposable ويتحقق من الإصدار، ويفشل صراحة إذا غاب container runtime بدل skip صامت.
- حُدّث Playwright لفصل E2E مع artifacts محتجزة عند الفشل فقط، وأُنشئ GitHub Actions verification CI بصلاحية `contents: read` فقط وبدون deploy job.
- CI يشغّل frozen install، format/lint/typecheck، architecture boundaries، unit/integration، migration check مشروط إلى أن يوجد runner، build، وPlaywright E2E؛ ويفعّل Chromium في CI ويرفع artifacts الفشل فقط.

### الملفات المتأثرة
- `vitest.config.ts`, `playwright.config.ts`, `package.json`, `pnpm-lock.yaml`
- `tests/setup/unit.ts`, `tests/helpers/{test-env,postgres-container}.ts`
- `tests/integration/postgres-container.smoke.test.ts`
- `.github/workflows/ci.yml`

### التحقق
- TDD: smoke test فشل أولًا بسبب helper غير موجود، ثم وصل لـTestcontainers بعد التنفيذ ✅
- `pnpm install --frozen-lockfile` ✅
- `pnpm test:unit` → 2 files / 5 tests ✅
- `pnpm exec playwright --version` → `1.62.1` ✅
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build` ✅
- YAML parse لـ`.github/workflows/ci.yml` ✅
- `node scripts/architecture/check-boundaries.mjs` و`git diff --check` ✅
- `pnpm test:integration` ⚠️ فشل محليًا لأن Docker/container runtime غير متاح؛ PostgreSQL 18 smoke لم يُتحقق runtime محليًا بعد.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** Test/CI harness موجود ومقفل بدون production credentials أو deployment، لكن إثبات PostgreSQL 18 الحقيقي محليًا محجوب إلى أن يتاح Docker runtime؛ CI سيشغله على GitHub runner الداعم للحاويات.

### ملاحظات / مشاكل مفتوحة
- `scripts/db-migrate.ts` غير موجود حاليًا؛ CI يسجل migration check كـdeferred ولا يدعي وجود migration verification.
- Node المحلي `22.22.3` بينما config يطلب Node `24.20.0`؛ CI يثبت Node `24.20.0` لكن التحقق المحلي عليه ما زال غير متاح.

## [2026-09-04] — MASTER-002: routing foundation + architecture boundary checks

### تم التنفيذ
- أُنشئ registry TypeScript مركزي لمسارات الـbrowser المعتمدة في `src/shared/routing/`، مع حالة file expectation تفصل `required` عن `deferred` و`conditional` بدون إنشاء صفحات Astro وهمية.
- أُنشئت policy helpers توضح أن metadata المسار ليست Authorization، وأن كل route محمي يحتاج re-authorization داخل الـApplication Use Case.
- أُنشئ فحص معماري لـDelivery يمنع imports قاعدة البيانات/Domain/Business Rules وraw SQL من `src/pages` و`src/actions` و`src/ui` وmiddleware عند وجوده.
- أُنشئ فحص route-file coverage يعطي مسارات الملفات الناقصة بوضوح ويخرج nonzero؛ النتيجة الحالية الناقصة متوقعة لأن صفحات الدومينات ما زالت غير منفذة، والـdeferred/conditional مستثناة عمدًا.
- أُضيفت READMEs لتثبيت حدود modules/shared/ui/pages/db/tests قبل feature code.
- ثُبّت Render Web Service و`qclevel.top` كأساس web/domain في وثائق التشغيل، مع Hostinger كمدير DNS حالي، وعدم اختراع hostname أو providers غير معتمدين.
- كانت metadata في UI/UX وRoute Manifest بالفعل `FOUNDATION — APPROVED` من العمل السابق؛ تم التحقق منها ولم يتغير محتواها.

### الملفات المتأثرة
- `src/shared/routing/route-types.ts`, `src/shared/routing/route-policy.ts`, `src/shared/routing/routes.ts`
- `scripts/architecture/check-boundaries.mjs`, `scripts/architecture/check-route-files.mjs`
- `src/{modules,shared,ui}/README.md`, `src/pages/README.md`, `db/README.md`, `tests/README.md`
- `tests/unit/routing-registry.test.ts`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`, `docs/operations/RENDER-DEPLOYMENT.md`

### التحقق
- TDD: اختبار الـrouting فشل أولًا بسبب غياب registry ثم نجح بعد التنفيذ؛ `pnpm test:unit` → 5 tests ✅
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅ بلا Delivery boundary violations.
- `pnpm exec tsx scripts/architecture/check-route-files.mjs` → nonzero متوقع مع قائمة الملفات المطلوبة الناقصة؛ لا يشمل deferred/conditional routes ✅
- إعادة قراءة metadata لأول 30 سطرًا من UI/UX وRoute Manifest، وفحص stale approval wording بلا نتائج ✅
- إعادة التحقق من Render الرسمي: Web Service يحتاج binding على `0.0.0.0`، root A fallback هو `216.24.57.1`، و`www` CNAME يحتاج hostname فعلي؛ لا توجد Render service/hostname/DNS/TLS حاليًا.
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** Foundation routing والحدود قابلة للفحص آليًا، مع بقاء تنفيذ صفحات الدومينات وتهيئة Render/DNS/قاعدة الإنتاج خارج نطاق التنفيذ الحالي.

### ملاحظات / مشاكل مفتوحة
- الجهاز المحلي ما زال Node `22.22.3` بينما الـruntime المقفل Node `24.20.0`؛ التحقق المحلي مرّ لكن توافق Node 24 ما زال غير متحقق محليًا.
- PostgreSQL، object storage، KMS/secrets، telemetry، backup/PITR providers وRender service hostname غير معتمدة/غير منشأة؛ DNS commands لا تُنفذ قبل إنشاء الخدمة ونسخ hostname الفعلي.

## [2026-09-04] — إزالة قيد "Execute this prompt only" من خطة التنفيذ المدمجة

### تم التنفيذ
- حذف سطر `EXECUTION MODE: Execute this prompt only. Do not start the next prompt.` من جميع مواضعه في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.
- المواضع المحذوفة: قالب القواعد الثابتة (القسم 3) + الـ40 برومبت MASTER = 41 موضعًا.
- لم يتغير أي محتوى آخر في الملف (لا عناوين، ولا متطلبات، ولا verification).

### الملفات المتأثرة
- `IMPLEMENTATION-MASTER-PLAN-MERGED.md`

### التحقق
- `grep -c "EXECUTION MODE: Execute this prompt only"` → `0` ✅
- `wc -l` → 5668 (كان 5709؛ الفرق 41 سطرًا محذوفًا بالضبط) ✅
- `git diff --check` ✅ و`git diff --stat` → 41 deletions فقط ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** البرومبتز أصبحت خالية من قيد التوقف بعد كل برومبت؛ باقي محتوى الخطة سليم 100%.

### ملاحظات / مشاكل مفتوحة
- لا يوجد.



## [2026-09-04] — MASTER-001: Astro + Render baseline

### تم التنفيذ
- تهيئة أساس مشروع Astro SSR/on-demand مع Node adapter standalone وNode `24.20.0` وpnpm `11.25.0` مثبتين في config/lockfile.
- إضافة hygiene/configuration files، TypeScript strict، ESLint/Prettier، وscripts للفحص والاختبارات والتشغيل.
- إنشاء Render Web Service Blueprint لـ`qclevel.top` مع `checksPass` وCorepack frozen install وبدون أي secret أو PostgreSQL resource.
- تنفيذ readiness infrastructure مستقل عن Delivery: يفحص PostgreSQL، ويرجع `200` عند الجاهزية أو `503` minimal عند غياب/فشل dependency.
- إضافة unit tests لحالتي readiness، Playwright config لعزل E2E، ووثيقة تشغيل Render.
- تدوير السجلات الأقدم إلى `02-mind-mid.md` لأن الـlive mind تجاوز حد الحجم التشغيلي.

### الملفات المتأثرة
- `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `render.yaml`
- `src/pages/api/health/ready.ts`, `src/shared/health/*`, `tests/unit/health-ready.test.ts`
- `docs/operations/RENDER-DEPLOYMENT.md`, `playwright.config.ts`
- `.agents/mind/01-mind-latest.md`, `.agents/mind/02-mind-mid.md`

### التحقق
- `pnpm install --frozen-lockfile` ✅ (بـpnpm 11.25.0؛ local Node 22 تجاوز القيد مؤقتًا)
- `pnpm exec astro --version` → `7.3.1` ✅
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm test:coverage`, `pnpm build` ✅
- Render Blueprint JSON Schema validation من `https://render.com/schema/render.yaml.json` ✅
- `node dist/server/entry.mjs` ثم `GET /api/health/ready` بدون `DATABASE_URL` → `503 {"status":"unhealthy"}` ✅
- `git diff --check` وsecret/raw-SQL Delivery scans ✅

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** baseline المحلي مكتمل ومتحقق؛ deploy وDNS/Render secrets وPostgreSQL الحقيقي غير منفذة عمدًا، لذلك الجاهزية الإنتاجية تبقى `UNVERIFIED`.

### ملاحظات / مشاكل مفتوحة
- الجهاز المحلي فيه Node `22.22.3` فقط؛ توافق Node 24 مو متحقق محليًا رغم تثبيت `.node-version` وRender `NODE_VERSION` على `24.20.0`.
- `DATABASE_URL`/Render service/DNS Hostinger ما زالت تحتاج إعداد وتشغيل معتمدين، ولا يوجد production deploy.

## [2026-09-04] — IMP-000: تطبيع اعتماد مواصفات UI/UX وRoute Manifest

### تم التنفيذ
- تحديث عنوان وحالة ونسخة `Documents/UI-UX-SPECIFICATION.md` إلى Foundation baseline معتمد.
- تحديث حالة ونسخة metadata النهائية في `Documents/ROUTE-MANIFEST-SPECIFICATION.md` إلى Foundation baseline معتمد.
- تحويل حالات سجلات قرارات UX وRoute من حالة الاعتماد المقترحة إلى `APPROVED` بدون تغيير متطلبات UI أو routes أو business behavior.
- إضافة الوثيقتين إلى قائمة `Canonical Foundation Documents` وإزالة ملاحظة أنهما ما زالتا Draft.

### الملفات المتأثرة
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/AUTHORIZATION-VISIBILITY-DECISION.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- إعادة قراءة أول 30 سطرًا من الوثيقتين ✅
- فحص عبارات حالة المسودة/الاعتماد القديمة بلا نتائج ✅
- التحقق من قائمة `Canonical Foundation Documents` ✅
- `git diff --check` ✅
- لم تُشغّل application tests/build لأن التغيير metadata توثيقي فقط ولا يغيّر runtime behavior.

### النتيجة
- **الحالة:** نجح
- **مختصر:** أصبحت مواصفات UI/UX وRoute Manifest ممثلة كـFoundation APPROVED baselines، مع بقاء تغييرات working tree غير المرتبطة كما هي.

### ملاحظات / مشاكل مفتوحة
- لا توجد قرارات سياسة أو علمية جديدة؛ حالة التنفيذ الفعلي للصفحات والـroutes ما زالت `UNVERIFIED` حسب المواصفات.

## [2026-09-04] — اعتماد Deployment + UAT + Production Readiness Foundation Closure Package

### تم التنفيذ
- إنشاء `Documents/DEPLOYMENT-ARCHITECTURE.md` بحالة `FOUNDATION — APPROVED DEPLOYMENT ARCHITECTURE BASELINE`.
- إنشاء `Documents/UAT-ACCEPTANCE-PLAN.md` بحالة `FOUNDATION — APPROVED UAT ACCEPTANCE BASELINE`.
- إنشاء `Documents/PRODUCTION-READINESS-CHECKLIST.md` بحالة `FOUNDATION — APPROVED PRODUCTION READINESS BASELINE`.
- اعتماد Controlled Release Architecture: `Local/Development → Test/CI → Staging/UAT → Production`.
- تثبيت release identity مرتبطة بـGit SHA + Build/Artifact ID + Migration Head، مع تفضيل build-once/promote-same-artifact حيث يكون ذلك ممكنًا تقنيًا.
- تثبيت أن Production migrations خطوات explicit controlled وليست silent application-startup mutations، وأن code rollback لا يساوي database rollback.
- اعتماد UAT بنموذج `Role × Domain × Workflow × State × Permission × Positive/Negative Scenario × Evidence` مع ربط النتائج بالـexact release candidate.
- اعتماد Production Readiness كـfinal evidence-based Go/No-Go gate، ومنع percentage-based readiness من تجاوز أي blocker حرج.
- تثبيت أن Critical FAIL/UNVERIFIED، required UAT failure، residual CRITICAL، required restore evidence missing، أو artifact/commit mismatch تمنع Go-Live.

### الملفات المتأثرة
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `DEPLOYMENT-ARCHITECTURE.md` أُنشئ على `main` بالـcommit `2d35f7f62d08afa31757113ff9568936fcd745e6` وتمت إعادة قراءته؛ Blob SHA: `afd06581c9da000f281ce2e624c132e1ef56b738`.
- `UAT-ACCEPTANCE-PLAN.md` أُنشئ على `main` بالـcommit `83a0f1c006f247e7f604d282d8b145d70eac4444` وتمت إعادة قراءته؛ Blob SHA: `3a2d88a1dedbdd173053cac43045d6578b59ddc7`.
- `PRODUCTION-READINESS-CHECKLIST.md` أُنشئ على `main` بالـcommit `c5c31426e9ec3f43708f50f2e175914659a0a4b1` وتمت إعادة قراءته؛ Blob SHA: `529e263fb37555f37074b42df00d5278b784793b`.
- تم التحقق من أن الملفات الثلاثة تحمل APPROVED statuses وليست Draft.
- لم تُشغّل application tests/build لأن هذه المهمة توثيق Foundation فقط، ولا يوجد claim بأن CI/CD أو UAT runtime أو Production deployment مطبقة فعليًا.

### النتيجة والقيود
- حزمة Deployment/UAT/Production Readiness أصبحت Foundation baselines معتمدة.
- لا يعني ذلك أن deployment pipeline أو UAT execution أو production readiness evidence موجودة فعليًا؛ implementation/runtime status يبقى UNVERIFIED حتى يوجد code + environment + current evidence.
- Exact hosting/provider، CI/CD tooling، production release authority، RPO/RTO، retention، HA topology، deployment mode، وapproval ceremonies ما زالت POLICY/DEPLOYMENT-DEPENDENT حيث نصت الوثائق على ذلك.
- `Documents/UI-UX-SPECIFICATION.md` و`Documents/ROUTE-MANIFEST-SPECIFICATION.md` كان محتواهما معتمدًا من المستخدم، وتم لاحقًا تطبيع metadata إلى APPROVED وإدخالهما في قائمة الـcanonical baseline بهذا الـMind.

---

## [2026-09-04] — اعتماد Backup & Recovery Foundation Baseline

### تم التنفيذ
- إنشاء `Documents/BACKUP-RECOVERY-PLAN.md` كوثيقة Foundation معتمدة، بدون Draft status.
- اعتماد Layered Recovery Architecture تشمل PostgreSQL physical base backups + continuous WAL archiving + PITR، مع logical export كطبقة ثانوية وprovider snapshots كطبقة إضافية عند توفرها.
- إدخال Object Storage / Evidence binaries ضمن recovery scope وربط الاستعادة بـSHA-256 والـmetadata/business linkage.
- اعتماد Recovery Manifest يربط backup set بـPostgreSQL version context وWAL coverage وobject recovery context وGit SHA/migration context وrestore-verification status.
- تثبيت أن Backup Job Success لا يساوي Restore Verified، وأن telemetry لا تستبدل controlled recovery evidence.
- اعتماد isolated restore كافتراضي للـdrills، واعتبار Production Restore عملية high-risk controlled operation.
- تثبيت أن Admin لا يملك Production Restore Authority تلقائيًا، وأن major disaster/database recovery يبطل sessions الحالية افتراضيًا قبل reopening.
- تثبيت أن exact RPO/RTO والretention/cadence/authority/provider topology تبقى POLICY/DEPLOYMENT-DEPENDENT ولا يتم اختراعها.

### الملفات المتأثرة
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تم إنشاء الوثيقة على `main` بالـcommit `c90e77bc7eb50c17f23158e3f00f720c9b7b8175`.
- تمت إعادة قراءة `Documents/BACKUP-RECOVERY-PLAN.md` من `main` بعد الإنشاء.
- Blob SHA المتحقق للوثيقة: `6b71c9189ecd3ae18bcdb9ccf737ea2e561afe6f`.
- الـStatus المتحقق داخل الملف: `FOUNDATION — APPROVED BACKUP & RECOVERY BASELINE`.
- لم تُشغّل application tests/build لأن التغيير توثيقي فقط ولا يوجد claim بأن backup implementation أو runtime recovery جاهز.

### النتيجة والقيود
- الوثيقة نفسها مثبتة كـFoundation baseline معتمدة.
- هذا لا يثبت أن backup/PITR/object recovery/restore drills مطبقة أو operationally verified؛ `RISK-028` يبقى residual risk غير متحقق حتى يوجد implementation + restore evidence.
- Exact RPO/RTO والretention والcadence والrestore approval/reopen authority والprovider choices ما زالت قرارات مفتوحة.

---

## [2026-09-04] — تثبيت بروتوكول استخدام مهارات المشروع

### تم التنفيذ
- توحيد تعليمات `AGENTS.md` و`.agents/AGENTS.md` و`.claude/AGENTS.md` و`.clinerules/e.md` لإلزام فحص `.agents/skills/` قبل كل مهمة.
- تثبيت قراءة `SKILL.md` كاملًا للمهارة المطابقة قبل تنفيذ الإجراء، واتباع المراجع المطلوبة، وذكر عدم وجود مهارة مناسبة عند الحاجة.

### التحقق
- فحص تطابق قسم Skills في ملفات تعليمات الوكلاء الأربعة.
- فحص `git diff --check` بعد التعديل.

### النتيجة والقيود
- أصبحت مهارات المشروع موثقة كمسار استخدام دائم ضمن تعليمات المستودع.
- لا يضمن ذلك تطبيق مهارة غير مرتبطة بالمهمة؛ الاختيار يظل حسب موضوع المهمة وتعارضات وثائق Foundation.

---

# 1. Purpose

هذا الملف هو الذاكرة الحية للمشروع الجديد فقط.

ممنوع استخدام تاريخ BRIGHTAI أو `apps/qc-task-manager` القديم كواقع أو مصدر حقيقة لهذا المشروع.

المرجع التشغيلي الحالي يكون بالترتيب التالي:

1. الواقع الحالي للمستودع وقاعدة البيانات والـruntime عند وجودها.
2. الوثائق المعتمدة داخل `Documents/`.
3. هذا الملف للقرارات الحديثة وسجل العمل.
4. `README.md` للعرض العام.

إذا تعارض هذا الملف مع وثيقة Foundation معتمدة، لا يتم تجاهل التعارض؛ يجب توثيقه وتصحيح أحد المصدرين صراحة.

---

# 2. Current Project Stage

الحالة الحالية:

> **IMPLEMENTATION BOOTSTRAP — ASTRO / RENDER BASELINE INITIALIZED**

الـFoundation architecture/specification package الأساسية مكتملة بدرجة كبيرة، وAstro SSR/Render baseline صار موجودًا محليًا ومتحققًا. قاعدة البيانات الفعلية، migrations، identity/authz/audit، domains، وproduction deployment ما زالت غير منفذة أو غير متحققة حسب نطاقها.

أي claim مثل:

- implemented
- complete
- verified
- production ready
- 100%

يحتاج دليل حالي من المستودع/الـruntime/الاختبارات.

---

# 3. Canonical Foundation Documents

المجلد الرسمي:

`Documents/`

الوثائق الأساسية المعتمدة حاليًا:

- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`
- `Documents/SYSTEM-INVARIANTS.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/REQUIREMENTS-TRACEABILITY.md`
- `Documents/ARCHITECTURE-SPECIFICATION.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

الوثائق تصف الـFoundation. الكود يجب أن يطابقها، وليس العكس.

---

# 4. Product Scope

المجالات الرئيسية:

- Dashboard
- Tasks
- Quality
  - Findings
  - NCR
  - RCA
  - CAPA
- Quarantine
  - Receiving Items
  - Inspection Reports
  - Quarantine Administration
- Laboratory Testing
- Equipment / Calibration / Maintenance
- WI / SOP / Controlled Documents
- Reviews / Approvals / E-Signatures
- Change Requests
- Reports
- Administration
- System Health / Backup / Recovery
- AI Advisory

Shared capabilities تشمل:

- Authorization
- Audit
- Notifications
- Files / Evidence
- Search
- Validation
- Transactions
- Errors
- Observability
- Time

---

# 5. Technology Decisions

## Web

- Astro هو الـWeb Framework الرسمي.
- النظام ليس static marketing site.
- الوظائف المحمية تعتمد server/on-demand rendering.
- `src/pages/`, Astro Actions/API endpoints, وmiddleware تعتبر Delivery Layer فقط.
- Business Rules لا توضع داخل `.astro` component أو client island أو route handler.

## Database

- PostgreSQL من اليوم الأول.
- Technical IDs: UUID.
- Human-readable business IDs منفصلة.
- Event timestamps: `TIMESTAMPTZ`.
- Internal time handling: UTC.
- Display timezone: `Asia/Riyadh`.
- Optimistic concurrency عبر record `version` للسجلات المناسبة.

## Architecture

- Modular Monolith.
- One application + one PostgreSQL database مع domain boundaries واضحة.
- لا Microservices في الـFoundation.
- لا direct UI → DB.
- لا direct cross-domain table writes.

---

# 6. Canonical Application Flow

```text
Astro Page / Client Island
        ↓
Astro Action / API Endpoint
        ↓
Authenticated Request Context
        ↓
Application Use Case
        ↓
Central Authorization
        ↓
Domain Rules / State Machine
        ↓
Transaction
        ↓
Repository
        ↓
PostgreSQL
        ↓
Audit / Durable Outbox / Notifications
```

---

# 7. Roles

الـFoundation roles الحالية فقط:

- Employee
- Supervisor
- Manager
- Admin

قاعدة ثابتة:

> **Role ≠ Permission**

Authorization يعتمد على:

`Role + Permission + Scope + Entity + State + SoD + Version + Business Rule`

Admin ليس Universal Business Approver.

Manager لا يرث تلقائيًا كل صلاحيات Supervisor/Employee.

---

# 8. Authorization Principles

- Default Deny.
- Authorization server-side دائمًا.
- UI visibility ليست security boundary.
- Astro middleware لا يستبدل domain authorization.
- كل sensitive Action تعيد authorization عند التنفيذ.
- Reports / Search / Export / Files تطبق نفس scope.
- Self-review وself-approval للـcontrolled records: DENY كـFoundation default إلى أن تعتمد SoD policy النهائية.
- أي sensitive permission غير محسومة: DENY UNTIL APPROVED.

---

# 9. Core System Invariants

1. UI visibility is never authorization.
2. Authorization is always server-side.
3. Separation of Duties must be enforced according to approved policy.
4. Approved controlled records cannot be silently edited.
5. VOID preserves history.
6. SUPERSEDED preserves history.
7. Important mutations require actor/time/entity/action/reason where required/audit evidence.
8. Scientific acceptance limits come only from approved controlled sources.
9. AI cannot approve, reject, release, sign, or set official PASS/FAIL.
10. Historical migrations are immutable.
11. Reports obey application authorization scope.
12. Backup is not proven until restore is verified.
13. Master-data changes do not rewrite historical records.
14. Draft / Submitted / Approved have different integrity rules.
15. Admin cannot rewrite historical facts.
16. Critical operations are transactional.
17. Critical actions are idempotent where applicable.
18. Concurrent edits never silently overwrite.
19. Routes, tests, and controlled workflows must be machine-verifiable.
20. No readiness claim without evidence.

---

# 10. Critical Domain Decisions Already Established

## Quarantine

These are separate facts:

- Receiving workflow state
- Inspection result
- Release System state

`PASS` does not automatically mean `Released`.

## Inspection

- Controlled report uses exact approved template version.
- Submission freezes historical controlled context.
- Approved records are not directly editable.

## Laboratory

- Raw observations/measurements are preserved.
- Scientific criteria are source-controlled.
- Retest is a separate execution linked to original test.
- Historical equipment/calibration/document context is snapshotted.

## Documents

- Document Identity and Document Version are separate.
- Approved/effective versions are controlled.
- Revision creates a new version.
- Superseded versions remain historical.

## Audit

- Audit is separate from application logging.
- Audit history must not be destroyed by cascade deletion.

## Files

- File metadata in PostgreSQL.
- Binary content in object storage abstraction.
- SHA-256 retained for integrity.

## AI

AI is advisory only and core workflows must function without AI.

---

# 11. Data Principles

- Normalize current business truth.
- Snapshot historical controlled truth.
- Use explicit FKs for core business relationships where practical.
- Restrict polymorphic `subject_type + subject_id` patterns to justified shared capabilities such as Audit / Evidence / Approval infrastructure.
- No giant generic QC table.
- No giant JSONB business model.
- No destructive cascades through controlled history.

---

# 12. Scientific / Policy Unknowns

Codex/developer/AI must not invent:

- Scientific acceptance limits
- Sampling rules
- Measurement precision
- Rounding rules
- Calibration intervals
- Release authority
- Release e-signature requirements
- Inspection final approver
- Lab final approver
- Retest allowance/count/authority
- NCR/CAPA closure authority
- Void authority
- Document approval authority
- Document effective-date policy
- Equipment behavior when calibration overdue
- RPO / RTO
- Retention periods

Unresolved sensitive behavior defaults to DENY/BLOCKED until approved.

---

# 13. Agent Working Rules

قبل أي مهمة:

1. اقرأ هذا الملف كاملًا.
2. اقرأ `AGENTS.md`.
3. اقرأ Foundation documents المرتبطة بالمهمة داخل `Documents/`.
4. افحص الواقع الحالي للمستودع قبل تصديق أي claim سابق.
5. افحص `.agents/skills/` واستخدم المهارة المناسبة إذا كانت موجودة.

بعد أي مهمة فعلية:

1. وثّق ما تم فعليًا فقط في أعلى هذا الملف.
2. اذكر الملفات المتأثرة.
3. اذكر verification commands/results الفعلية.
4. اذكر المشاكل المفتوحة/القيود.
5. لا تسجل خطة مستقبلية كأنها إنجاز.

---

## [2026-09-04] — تثبيت Astro كإطار رسمي في Foundation documents

### تم التنفيذ
- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`: أُضيف تثبيت Astro كـWeb Framework رسمي مع server output + Node adapter (on-demand rendering / Actions / Sessions)، واستُبدل مثال `React Component → Database` بـ`Astro Component / UI Component / Client Island → Database`، وحُدّث مسار القسم 14 ليبدأ بـ`Astro Page / UI Component / Client Island → Astro Action / API Endpoint`.
- `Documents/DOMAIN-MAP.md`: أُضيف قسم Delivery Layer في §2 يثبت أن `src/pages/` و`src/actions/` و`src/middleware.ts` هي Delivery Layer فقط و`src/modules/` مالك الـBusiness Logic.
- `Documents/PERMISSION-MATRIX.md`: أُضيف قسم فرعي بعد §2 يثبت أن middleware يثبت session/user context في locals فقط، وكل Action/API endpoint يعيد authorization بنفسه (Astro Actions public endpoints).
- `Documents/STATE-MACHINES.md`: حُدّث SM-GEN-002 من `UI / API` إلى `Astro Page / Astro Action / API Endpoint` بدون أي تغيير على State Machines.
- `README.md`: أُضيف قسم Technology Baseline (Astro + server rendering + Node adapter + PostgreSQL + Modular Monolith + Default Deny) مع ملاحظة أن static-only لا يناسب النظام.
- `DATA-MODEL.md` و`DATA-DICTIONARY.md`: لم تُغيَّر — PostgreSQL/UUID/snapshots/transactions مستقلة عن الـFramework.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `README.md`

### التحقق
- فحوص `rg` أكدت وجود النصوص الجديدة في الوثائق المطلوبة ✅
- `rg -F "UI / API" Documents/STATE-MACHINES.md` → لا نتائج ✅
- `rg -F "React Component" Documents README.md` → لا نتائج ✅
- `git diff --quiet -- Documents/DATA-MODEL.md Documents/DATA-DICTIONARY.md` → لم يتغير الملفان ✅
- `git diff --check` على الملفات المتأثرة → نظيف ✅
- لم يُشغّل build أو tests لأن التغيير توثيقي فقط.

### النتيجة
- **الحالة:** نجح
- **مختصر:** تثبيت Astro server-rendered كـFoundation في الوثائق المعتمدة بدون تغيير أي Business Rule أو State Machine.

### القيود / المتبقي
- هذا تحديث Foundation توثيقي؛ لم يُنشأ بعد تطبيق Astro أو Node adapter أو PostgreSQL runtime.
- تغييرات `AGENTS.md` و`.claude/AGENTS.md` و`.clinerules/` موجودة في working tree خارج نطاق هذه المهمة ولم تُعدَّل.

---

## [2026-09-04] — Reset project mind for new QC system

### تم التنفيذ
- أُلغي الاعتماد على mind/brain الموروث من BRIGHTAI و`apps/qc-task-manager` القديم.
- أُنشئ هذا الملف كذاكرة حية خاصة بمستودع `YEEEAE/QC-Operations-Laboratory-Management-System` فقط.
- ثُبتت القرارات الحالية: Astro server-rendered/on-demand + Modular Monolith + PostgreSQL.
- ثُبت `Documents/` كمصدر Foundation للمواصفات.
- ثُبتت قاعدة evidence-before-claims وعدم اختراع scientific/policy decisions.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- إزالة `.agents/mind/02-mind-mid.md`
- إزالة `.agents/mind/03-mind-earliest.md`
- إزالة `.agents/brain.md`

### التحقق
- Repository state verification مطلوب بعد اكتمال تحديث AGENTS.

### النتيجة
- **الحالة:** IN PROGRESS أثناء هذا السجل إلى أن يتم التحقق النهائي من AGENTS والـmind paths.

---

## Mind Maintenance

هذا الملف archive للقراءة فقط. السجل الحي هو `01-mind-latest.md`.

---

## Archived operating notes from the live mind

### Git Safety

- لا `git push` أو `git commit` بدون طلب صريح.
- لا `git reset --hard` أو حذف ملفات المستخدم.
- لا secrets في الكود أو ملفات الـmind.

### Verification Rule

لا يوجد claim عن fix أو readiness بدون evidence حالي مناسب: repository inspection، typecheck/lint، tests، build، وE2E/migration checks حسب نطاق التغيير.

### Prior Foundation Work Queue

كانت الخطوة التالية بعد إغلاق Foundation metadata هي Astro/PostgreSQL scaffolding، ثم auth/authz/audit، ثم domains وUAT/readiness evidence. تم إنجاز Astro/Render baseline في سجل MASTER-001 الحي؛ تفاصيل النطاق المتبقي توجد في السجل الحي والـFoundation documents.

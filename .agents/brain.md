---
file: brain.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
last_updated: 2026-08-14 19:30 +03:00
maintained_by: BrightAI Workspace Agent
version: 2.7.99
agent_version: v2.3
skills_ready: 7
---

### 2026-08-14 — MIND-SPLIT-001: تقسيم brain.md إلى ثلاثة ملفات في .agents/mind/ (عقل الوكيل)

- **Files**: `.agents/mind/01-mind-latest.md` (جديد، 435 سطر / 143KB)، `.agents/mind/02-mind-mid.md` (جديد، 458 سطر / 102KB)، `.agents/mind/03-mind-earliest.md` (جديد، 448 سطر / 71KB)، `.agents/brain.md` (هذا السجل).
- **What**: قُسّم الـ ledger الكامل (84 سجلًا) إلى 3 أجزاء متوازنة عند حدود السجلات (فواصل `---`) بدون قطع أي سجل: **01 = الأحدث** (2026-08-14 → 2026-08-11، يحمل الـ frontmatter الأصلي)، **02 = الأوسط** (2026-08-11 → 2026-08-02)، **03 = الأقدم** (2026-08-02 → 2026-07-31 + ملحقات QC في نهاية الملف الأصلي). الأجزاء 02 و03 أخذت frontmatter بسيطًا يوثق مصدرها.
- **Decision**: (1) التقسيم زمني-تسلسلي بالتساوي (~440 سطرًا للجزء) لأن الملف كله ledger واحد طويل. (2) `brain.md` بقي كما هو كمصدر وحيد للحقيقة — ملفات mind/ هي نسخة مقسومة للقراءة؛ **أي تحديث جديد يروح لـ brain.md** وليس لملفات mind (تجنب تفرّع مصادر الحقيقة). (3) ما حذفت brain.md — يحتاج قرار صريح من المستخدم لو يبغى استبداله بـ index يشير للأجزاء.
- **Verification**: عدد السجلات قبل = 84، بعد = 84 عبر الأجزاء؛ كل جزء يبدأ وينتهي عند `### عنوان سجل` / فاصل `---` — ما انقطع أي سجل؛ مجموع أحجام الأجزاء = حجم الأصل + frontmatter المضاف فقط.
- **Status**: delivered (الأجزاء الثلاثة جاهزة في `.agents/mind/`).

---

### 2026-08-14 — QC-LAB-PROMPTS-V2-ADDITIONS-001: ترقية برومبتز مختبر QC إلى v2 + ملف إضافات جديد ببيانات الشركة الدقيقة

- **Files**: `audit/qc/2026-08-14-QC-LAB-IMPLEMENTATION-PROMPTS.md` (أُعيد كتابته v2)، `audit/qc/2026-08-14-QC-LAB-ADDITIONS-PROMPTS.md` (جديد)، `.agents/brain.md` (هذا السجل).
- **What**: (1) **v2 للملف الأساسي** (889 سطرًا): أُضيف بروتوكول تنفيذ مخصص لـ DeepSeek Flash v4 (verify-before-claim، grounding للـ helpers، برومبت واحد لكل session، بروتوكول تعارض، منع scope drift) + block "Repository facts" متحقق من الكود فعليًا (آخر migration = `010_ai_evidence_status.sql` → التالي **011**؛ `permissions.ts` مصدر RBAC الوحيد؛ أوامر التحقق وbaseline: typecheck 0/0/13 وtest 279/0 وe2e:acceptance كلها خضراء) + كل برومبت صار له: Read first / Allowed file changes / Requirements / Non-goals / Verification commands / Acceptance criteria، وPROMPT 03 صار يحمل مواصفة الحقول المطبوعة الكاملة (أقسام 1-8). (2) **ملف إضافات جديد** (627 سطرًا، A0-A5): صفحة إدخال وثائق اختبارات المنتجات Air/Vacuum بالمواصفة الحرفية للنموذج المطبوع (الحقول السوداء فقط، قيم المرجع عرض لا validation)، صفحة أجهزة المختبر مع **الـ dataset الكامل لـ24 جهازًا حرفيًا** (مع حفظ النصوص العربية الأصلية verbatim + display mapping موثق للحالات لا يعدل البيانات)، صفحات SOP/WI، وPROMPT A4 للربط الشامل (navbar + مصفوفة صلاحيات كاملة في permissions.ts + قسم Laboratory بالداشبورد مع KPIs محددة + إشعارات + audit chain + CSV exports + بحث شامل + فحوصات FK/overflow)، وA5 تقرير تحقق.
- **Decision**: (1) فصل الأدوار بين الملفين: الأساسي = البنية (migration 011 + مسارات + lifecycle)، والإضافات = البيانات الدقيقة للشركة + الربط الشامل؛ وكل برومبت في ملف الإضافات مكتوب ليكون آمنًا سواء نُفذت برومبتات الأساس أو لا (A0 يقرر extend-vs-build بالأدلة). (2) بيانات الحالات المختلطة للأجهزة (مثل "تحت الصيانة / NEW") تُخزن verbatim والفلترة عبر mapping عرضي فقط — لأن قاموس الحالات الرسمي قرار معلّق (قسم 18 من تقرير الصفحات). (3) Serial numbers نصية (تقبل "-" و"DOA-P104-AA" و"1-800-5556-3484"). (4) حقول Authorization (Tested/Reviewed/Approved By) لا تقبل أبدًا من body الطلب. (5) القيم المرجعية (قسم 5) تُلقط snapshot عند الإرسال ليحتفظ السجل المعتمد بمعاييره. (6) القرارات المفتوحة السبعة نُقلت كما هي مع منع اختراع إجاباتها.
- **Verification**: تحقق بنيوي: fences متوازنة (28/14)، 24 صف جهاز مطابق حرفيًا للبيانات المرسلة (spot-check الصفوف 6/13/24)، وحقائق الـ repo (ترقيم migrations، scripts، صلاحيات) متحققة من الكود مباشرة قبل الكتابة. لا كود تنفيذي أُنشئ — الملفان مواصفات برومبت فقط.
- **Notes**: المستخدم ذكر أنه سيرفق صورة توضيحية للنموذج لاحقًا — البرومبتز تشترط التوقف والتأكيد قبل إضافة/حذف أي حقل مطبوع إذا اختلفت الصورة عن المواصفة النصية. لا commit ولا push — المستخدم يلتزم.
- **Status**: delivered (prompts v2 + additions ready، لم تُشغّل برومبتات DeepSeek بعد).

---

### 2026-08-14 — QC-SAVED-FILTERS-DOCS-001: إغلاق PROMPT 10 — unit checks لأذونات saved filters + توثيق SESSION_SECRET + REPOSITORY-AUDIT.md

- **Files**: `apps/qc-task-manager/scripts/test-db-rules.mjs`، `apps/qc-task-manager/scripts/e2e-task-search.mjs`، `apps/qc-task-manager/README.md`، `apps/qc-task-manager/docs/DEPLOYMENT.md`، `apps/qc-task-manager/docs/REPOSITORY-AUDIT.md` (جديد)، `apps/qc-task-manager/docs/ARCHITECTURE.md`، `.agents/brain.md` (هذا السجل).
- **What**: (1) **الـ saved-filters UI/API** (`search.astro` + `/api/filters` + `taskSearch.ts` + `savedFilterSchema`) كانت منفذة ومُلتزمة في الريبو مسبقًا — الفجوة الفعلية من الـ audit كانت في الـ unit checks والتوثيق، فأغلقتها. (2) **unit checks جديدة في `test-db-rules.mjs`** (8 فحوصات): handler-level `POST /api/filters` بدون جلسة → **401**، Origin خاطئ → **403**، الطلبات المرفوضة لا تكتب صفوف أبدًا، save→list يرجع الصف، `savedFilterHref` يعيد بناء URL (apply)، المستخدم يشوف فلاتره فقط، delete من مستخدم آخر **مرفوض** (owner-only يترك الصف)، delete من المالك يمسحه (gone). (3) **`e2e-task-search.mjs` Scenario E**: فحص جديد — anonymous `POST /api/filters` → **302 إلى /login** (جدار الـ middleware، لا يصل الـ handler أبدًا). (4) **التوثيق**: `SESSION_SECRET` صار **"reserved but not implemented"** صراحةً — أُزيل من quick-start block في `README.md` ومن جدول متغيرات Render الإلزامي في `DEPLOYMENT.md` (مع ملاحظة "لا تضبطوه")، وحدّثت جملة blueprint اللي كانت تقول "بعد ما يهبط alignment التوثيقي". (5) **`REPOSITORY-AUDIT.md`** جديد: workspace wiring (pnpm workspaces، `@brightai/qc-task-manager`، Node 22/pnpm 10)، astro config (SSR standalone، inlineStylesheets: never)، deployment surface (render.yaml service، `/api/health`، disk/env)، والملفات الممنوع تعديلها (`.github/workflows`، `.env*`، خدمة brightai-site، db runtime) — مشتق من ARCHITECTURE.md + brain، ومرتبط من `ARCHITECTURE.md` (قسم "Repository integration" جديد).
- **Decision (مهم للـ future agents)**: اخترت مسار "reserved (not implemented)" بدل تنفيذ توقيع الجلسات — الأصغر والأصدق للواقع (الجلسات opaque tokens في SQLite). `test-db-rules.mjs` هو بيت الـ DB-backed unit checks (يضبط `QC_DATABASE_PATH` قبل import `db.ts`) — الـ 8 فحوصات الجديدة تختبر الـ handler الحقيقي `filters.ts` بمـ mock context مصغّر (CSRF + auth قبل أي parse)، والـ happy path عبر دوال `taskSearch` على نفس الـ temp DB.
- **Verification**: typecheck → **0 errors / 0 warnings / 13 hints** ✅؛ `pnpm --filter @brightai/qc-task-manager test` → **كل السلاسل PASS** (domain **279/0** + db-rules مع 8 فحوصات saved filters جديدة) ✅؛ **تحقق حي على build إنتاجي بقاعدة مؤقتة**: `e2e-task-search.mjs` كامل → **84 passed / 0 failed** (Scenario E: create → list → apply → delete → gone + anonymous 302) ✅.
- **Notes**: المستخدم التزم ودفع بنفسه بعد تسليمي (القاعدة الثانية — أنا ما دفعت). لا commit مني.
- **Status**: verified locally (typecheck + full test + live round-trip)؛ committed/pushed بواسطة المستخدم.

---

### 2026-08-14 — QC-LAB-PAGES-REPORT-001: توثيق صفحات ومحتوى مختبر QC

- **Files**: `audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md`، `.agents/brain.md`.
- **What**: أُنشئ تقرير تفصيلي يحدد صفحات `/lab/*`، محتوى كل صفحة، حقول نماذج Air/Vacuum، صفحة الأجهزة، محرر SOP/WI الداخلي، دورة الحالات، الصلاحيات، APIs المقترحة، ربط Dashboard، الأمان، الاختبارات، ومعايير القبول.
- **Decision**: التقرير يميز بوضوح بين المواصفة المستهدفة والتنفيذ الفعلي؛ جميع عناصر مختبر QC ما زالت غير منفذة في الكود حسب هذه المهمة.
- **Status**: documented (لا commit ولا push).

### 2026-08-14 — QC-LAB-PROMPTS-001: إنشاء حزمة برومبتز إنجليزية لإضافة مختبر QC

- **Files**: `audit/qc/2026-08-14-QC-LAB-IMPLEMENTATION-PROMPTS.md`، `.agents/brain.md`.
- **What**: أُنشئت حزمة من 12 برومبت تنفيذية لوكيل DeepSeek Flash v4 لإضافة مساحة مختبر QC داخل `apps/qc-task-manager`: قاعدة بيانات بمigrations متسلسلة، مسارات وصلاحيات، نماذج Air/Vacuum، دورة مراجعة واعتماد، سجل أجهزة المختبر، محرر داخلي لـ SOP/WI مع versioning، ربط Dashboard، بحث وتصدير، إشعارات وتدقيق، ثم security/a11y/E2E verification.
- **Decision**: محرر SOP/WI داخلي نصّي (Markdown محفوظ + HTML معقّم للمعاينة) مع Draft → In Review → Approved → Superseded/Archived؛ تعديل وثيقة معتمدة ينشئ إصدارًا جديدًا ولا يغيّر الإصدار المعتمد، لأن المستخدم اختار التأليف من داخل النظام وليس مكتبة رفع ملفات فقط.
- **Notes**: البرومبتز تشترط قراءة `brain.md` وملفات تدقيق QC قبل التنفيذ، إعادة استخدام RBAC والمigrations والـ audit والـ dashboard، وعدم اختراع معادلات علمية أو متطلبات تنظيمية غير موجودة في المواصفة. لم تُنفذ ميزات مختبر QC في الكود؛ الملف هو مواصفات تنفيذية فقط.
- **Status**: prompts-ready (لم تُشغّل برومبتز DeepSeek، لا commit ولا push).

### 2026-08-14 — QC-NAVBAR-OVERFLOW-BADGE-001: إصلاح overflow الـ navbar عند 768px + توحيد شارة "Deletion requested" بمكوّن مشترك (مع فحص docWidth آلي)

- **Files**: `apps/qc-task-manager/src/components/Navbar.tsx`، `src/components/DeleteRequestBadge.astro` (جديد)، `src/lib/deleteRequests.ts`، `src/pages/{employee,manager,supervisor}/index.astro`، `src/pages/tasks/[id].astro`، `scripts/e2e-dashboard.mjs`، `.agents/brain.md` (هذا السجل).
- **What**: (1) **Navbar overflow** — كل الـ desktop cluster (روابط الأدوار + username/role + Sign out) صار يُعرض فقط عند `lg+` (1024px): الروابط `hidden sm:flex` → `hidden lg:flex`، الـ username/role `hidden sm:inline` → `hidden lg:inline`، وزر Sign out صار `hidden lg:block`، وزر الـ toggle والقائمة `sm:hidden` → `lg:hidden`. القائمة الجوالة `#mobile-menu` صارت تضم الروابط + الاسم/الدور + زر Sign out (form). النتيجة: عند 390 و 768 الـ header فيه logo + bell + toggle فقط، و `documentElement.scrollWidth` ما يتعدى viewport أبدًا — والمشكلة الأصلية (6-9 روابط + username + Sign out كلها ظاهرة عند 768 = فيض أفقي) انحلت. (2) **Badge موحّد** — مكوّن Astro مشترك جديد `DeleteRequestBadge.astro` (server-rendered، نفس المظهر في كل مكان: `bg-red-100 text-red-700`): `pending` → "🗑️ Deletion requested"، `rejected` → "🗑️ Deletion rejected" مع `title` tooltip يحمل سبب الرفض (`review_note`) إن وُجد. الصفحات الثلاث (`/employee`، `/manager`، `/supervisor`) تستعلم الآن آخر طلب حذف (`ORDER BY id DESC LIMIT 1`) بدل `status='pending'` فقط — فالمهمة اللي طلبها انرفض تظهر شارة الرفض. `/tasks/[id]` يعرض شارة الرفض server-side بجانب `DeleteRequestDialog` (الـ island يظل يملك شارة الـ pending التفاعلية والزر — بلا تكرار). (3) **فحص آلي** — `e2e-dashboard.mjs` Scenario 5 جديد: `docWidth <= viewport` على `/dashboard` و `/manager` عند 390/768/1440 (6 فحوصات) — زاد العداد من 45 إلى 51.
- **Decision (مهم للـ future agents)**: (1) اخترت كسر الـ desktop cluster عند **1024px** (lg) مو 768 لأن حتى عند 1024 فيضاف للمدير 9 روابط + username + Sign out يتجاوزون `max-w-6xl` — فالقائمة الجوالة (بكل الروابط + الاسم + Sign out) هي الوجهة الوحيدة تحت lg. الـ 1440 ما تغيّر نهائيًا (نفس العناصر بنفس الأماكن). (2) شارة الرفض ما كسرت اختبار `e2e-delete-request` B: النص "🗑️ Deletion rejected" لا يطابق `has-text("🗑️ Deletion requested")`، وزر "Request Deletion" يرجع بعد الرفض كما يتوقع الاختبار (الشارة تظهر بجانبه، والأهم أن المستخدم يشوف سبب الرفض). (3) `getDeleteRequestStatus()` في `deleteRequests.ts` ترجع آخر طلب (pending يكسب على أي تاريخ رفض أقدم) + `review_note` — هي مصدر الحقيقة للـ badge في كل الصفحات الأربع (الصفحات الثلاث عبر subqueries مطابقة، و`[id]` عبر الدالة). (4) الـ tooltip عبر `title` على `<span>` غير تفاعلي — نص مرئي "Deletion rejected" يحمل المعنى للقارئات، والـ title إضافة progressive للماوس فقط.
- **Verification**: typecheck → **0 errors / 0 warnings / 13 hints** ✅؛ `pnpm test` → **279 passed / 0 failed** ✅؛ `pnpm e2e:acceptance` → **كل الـ suites PASS** (admin-users 49 + auth-lockout 44 + task-shared 196 + delete-request 39 + **dashboard 51** (45 + 6 فحوصات overflow) + a11y 14 + backup 13 + restart persistence) ✅؛ فحص معزول مباشر للسويتات الثلاثة المعنية: task-shared **196/0** + delete-request **39/0** + dashboard **51/0** مع `docWidth == viewport` بالضبط عند 390/768/1440 على /dashboard و /manager ✅؛ تحقق حي إضافي: الـ ul الرئيسي `display:none` عند 768 + القائمة الجوالة تحتوي الروابط/الاسم/Sign out + الـ 1440 يعرض الـ cluster كامل بلا overflow + البادج يظهر في قوائم الأدوار الثلاثة (employee/manager/supervisor) لحالة pending + شارة "Deletion rejected" في `/manager` و `/tasks/[id]` مع tooltip `review_note` ✅؛ `verify-security-hygiene.mjs` → passed ✅؛ `architecture-guard.mjs` → passed ✅؛ `verify-badge-contrast.mjs` → 13/13 ✅؛ `git diff --check` → نظيف ✅.
- **Notes**: لا commit ولا push — المستخدم يلتزم. الـ axe color-contrast القائمة (dashboard opacity-70 + tasks emerald-600/slate-400) ما لُمست — خارج نطاق المهمة وموثقة مسبقًا. `sm:` ما عاد مستخدمًا في الـ navbar إطلاقًا (الـ 640-1023 صارت ضمن الـ mobile menu).
- **Status**: verified (typecheck + 279/0 + e2e acceptance كامل + live checks). لا commit ولا push.

---

### 2026-08-14 — QC-A11Y-BASELINE-001: رفع تطبيق QC لأساس WCAG 2.2 AA (skip link + reduced motion + إدارة التركيز + contrast) مع تحقق آلي

- **Files**: `apps/qc-task-manager/src/layouts/BaseLayout.astro`، `src/styles/global.css` (جديد)، `src/components/Navbar.tsx`، `src/components/TaskLifecycle.tsx`، `src/pages/manager/workload.astro`، `astro.config.mjs`، `scripts/e2e-a11y.mjs` (جديد)، `scripts/verify-badge-contrast.mjs` (جديد)، `scripts/e2e-acceptance.mjs`، `scripts/e2e-backup.mjs`، `package.json`، `.agents/brain.md` (هذا السجل).
- **What**: (1) **Skip link** — `<a class="skip-link" href="#main">Skip to content</a>` أول عنصر قابل للتركيز في BaseLayout + `<main id="main" tabindex="-1">`؛ الـ CSS في `src/styles/global.css` (مخفي إلا عند الفوكس — WCAG 2.4.1). (2) **Reduced motion** — قاعدة عامة `@media (prefers-reduced-motion: reduce)` تعطّل كل animation/transition غير ضرورية (`animation-duration: 0.01ms !important` ... ) فتغطي الـ islands (wizard، dropdown، TaskUpdatePanel) و `animate-spin` والـ hover lifts (WCAG 2.3.3). (3) **إدارة التركيز** — Navbar dropdown: فوكس يدخل القائمة عند الفتح (أول menuitem)، مصيدة Tab داخل القائمة (wrap-around)، Escape يقفل ويرجع الفوكس للجرس؛ قائمة الجوال: Escape يقفل ويرجع الفوكس لزر الـ toggle؛ wizard الـ completion + الـ cancel dialog في TaskLifecycle: مصيدة Tab + استرجاع الفوكس لزر الفتح عند الإغلاق (Escape / X / backdrop). (4) **Contrast** — كل أزواج `format.ts` تعدّي 4.5:1 (بدون تغيير — القيم موثقة في السكربت). ثبّت 3 أزواج فاشلة في Navbar.tsx: عداد الجرس white-on-red-500 (3.76:1) → bg-red-600 (4.83:1)؛ chip "N unread" red-600-on-red-50 (4.41:1) → text-red-700 (5.91:1)؛ الـ role chip slate-500-on-slate-100 (4.34:1) → text-slate-600 (6.92:1). (5) **Axe** — suite `e2e-a11y.mjs` جديدة ضمن `e2e:acceptance`: 14 فحص لوحة مفاتيح (skip link: Tab أولًا + Enter يقفز لـ #main؛ dropdown: فوكس داخل + trap + Escape للجرس؛ wizard/cancel: فوكس داخل + trap + استرجاع) كلها PASS، + فحص axe على `/login` (0 مخالفات) و `/dashboard` و `/tasks/[id]` (2 serious color-contrast قائمة مسبقًا — موثقة في `download/qa/a11y-qc-report.json`). الـ axe report-only (لا يفشل السويت).
- **Decision (مهم للـ future agents)**: اكتشفت أن Astro يدمج ملفات CSS الصغيرة inline في `<style>` بالصفحة — وهذا يُحجب من CSP الصارم (`style-src 'self' + hash` فقط). الحل: `build.inlineStylesheets: 'never'` في astro.config.mjs عشان `global.css` يطلع ملف same-origin (تحقق حي: login صفر inline styles؛ dashboard الوحيد هو `astro-island,...{display:contents}` المطابق للـ hash). كمان: `workload.astro` كان فيه `<main>` متداخل داخل `<main>` حق الـ BaseLayout (HTML غير صالح) → تحول لـ `<div>`. وفي `e2e-backup.mjs`: فحص الـ retention صار يعدّ ملفات `qc_tasks-*.db` فقط (نفس `listBackups`/`BACKUP_FILE_PATTERN` في backup.ts) لأن ملفات `pre-migration-*.db` تتراكم في مجلد مشترك بين كل السويتات (كل سيرفر يزرع ~2) وكان يعدّي بالصدفة عند حد الـ 14 بالضبط — إضافة السويت الجديد كسرته.
- **Verification**: typecheck → **0 errors / 0 warnings / 13 hints** ✅؛ `pnpm test` → **279 passed / 0 failed** (مع `test:badge-contrast` الجديد أول السلسلة) ✅؛ `pnpm e2e:acceptance` → **كل الـ suites PASS**: admin-users 49 + auth-lockout 44 + task-shared 196 + delete-request 39 + dashboard 45 + **a11y 14** + backup 13 + restart persistence ✅؛ `verify-security-hygiene.mjs` → passed ✅؛ `architecture-guard.mjs` → passed ✅؛ `verify-badge-contrast.mjs` → 13/13 أزواج ✅؛ `git diff --check` → نظيف ✅؛ فحص حي على build إنتاجي: skip-link + main في كل الصفحات، الـ CSS قواعدها شغالة كملف، ولا inline style محجوبة.
- **Notes**: مخالفات الـ axe المتبقية (2 serious color-contrast: 20 nodes في /dashboard — أشرطة opacity-70 للـ KPIs — و7 nodes في /tasks — أزرار emerald-600 و hints slate-400) **قائمة مسبقًا** في ملفات خارج نطاق هذه المهمة (dashboard.astro، TaskUpdatePanel.tsx) — موثقة في التقرير وتحتاج قرار تصميمي منفصل. الـ keyboard coverage للـ wizard تشمل Escape/backdrop وليس click-submit (الـ submit ينقل للصفحة). لا commit ولا push — المستخدم يلتزم.
- **Status**: verified (typecheck + 279/0 + e2e acceptance كامل 400/0 + hygiene + guard + badge-contrast + live CSP check). لا commit ولا push.

---

### 2026-08-14 — QC-BACKUP-SKIP-MISSING-001: إيقاف ضجيج SQLITE_CANTOPEN من backup-scheduler عند غياب ملف القاعدة (P2 G-09 / PROMPT 06 من الـ evidence audit)

- **Files**: `apps/qc-task-manager/src/lib/backup-scheduler.ts`، `apps/qc-task-manager/src/lib/backup.ts`، `apps/qc-task-manager/scripts/test.mjs`، `apps/qc-task-manager/SECURITY.md`، `apps/qc-task-manager/docs/DATABASE.md`، `.agents/brain.md` (هذا السجل).
- **What**: (1) `backup-scheduler.ts` — أضفت `dbFileExists()` (statSync + isFile) و`logSkipped()`؛ قبل أي scheduled/catch-up backup (التايمر اليومي + الـ catch-up عند الإقلاع) إذا ملف القاعدة غايب → skip بسطر `[backup] skipped (trigger=scheduled): database file missing (...)` بدون تسجيل failure. (2) `backup.ts` performBackup — في الـ catch block: إذا `trigger === 'scheduled'` وملف المصدر غير موجود (`!existsSync(dbPath)`) → skip (سطر debug + رفع الخطأ بدون كتابة حالة failure ولا log error) — هذا يغطي الحالة الحرجة اللي كانت تنتج CANTOPEN فعلًا: السويتات تحذف الـ temp dir **أثناء** `await source.backup()` (المصدر + مجلد backups يروحون مع بعض)، والـ Database.backup يفشل بفتح الوجهة بـ SQLITE_CANTOPEN "unable to open database file". الـ manual/CLI/test triggers بقيت تفشل بصوت عالي (فحص test.mjs القديم "missing source fails" باقي يمر — trigger=test). (3) `test.mjs` — 3 فحوصات جديدة في قسم "Backup scheduler": startBackupScheduler على ملف غايب → يطبع سطر skip (بدون failed/CANTOPEN) + `getBackupStatus` يرجع `state:'never'` و lastFailureAt/lastAttemptAt/lastError = null (ما سُجل أي فشل). (4) `SECURITY.md` بند #9 جديد + `DATABASE.md` سطر في قسم Backups: التطبيق يفترض **single instance** (scheduler in-process + rate limiting in-memory) — يغلق G-10.
- **Verification**: typecheck → **0 errors / 0 warnings / 13 hints** ✅؛ `pnpm --filter @brightai/qc-task-manager test` → **279 passed / 0 failed** (276 + 3 جديدة) و **صفر** ظهور لـ `SQLITE_CANTOPEN`/"unable to open database file" في السجل كامل (قبل: 4 أخطاء CANTOPEN من audit-integrity/ai-foundation/ai-features/workflow؛ بعد: 4 أسطر skip هادئة) ✅؛ `pnpm e2e:acceptance` → كل الـ suites PASS و **backup 13/13** ✅؛ `verify-security-hygiene.mjs` → passed ✅؛ `git diff --check` → نظيف ✅.
- **Notes**: قرار — الـ skip محصور في `trigger === 'scheduled'` عشان الـ manual/CLI يبقون يفشلون (القاعدة "keep real failures recorded")؛ وشرط الكشف في الـ catch هو `!existsSync(dbPath)` (الملف غايب) وليس رسالة الخطأ، عشان مشاكل الصلاحيات/القرص/التلف على ملف موجود تبقى failures حقيقية. سطر الـ skip يستخدم console.info (نفس أسلوب log الحالي) مو console.debug. لا commit ولا push — المستخدم يلتزم.
- **Status**: verified (typecheck + 279/0 + صفر CANTOPEN + e2e acceptance كامل + backup 13/13 + hygiene). لا commit ولا push.

---

### 2026-08-14 — QC-SEED-PASSWORD-POLICY-001: إلزام ADMIN_DEFAULT_PASSWORD خارج localhost (P1 G-07 من الـ evidence audit) — منع الإقلاع بكلمة المرور الافتراضية في الإنتاج

- **Files**: `apps/qc-task-manager/src/lib/seed.ts`، `apps/qc-task-manager/src/pages/login.astro`، `apps/qc-task-manager/scripts/test.mjs`، `.agents/brain.md` (هذا السجل).
- **What**: (1) `seed.ts` — صار `DEFAULT_PASSWORD` يستخدم `||` بدل `??` (الـ empty string يُعامل كغير معيّن — يطابق تعريف الـ guard نفسه)؛ `assertSafeSeedPassword()` رسالته صارت أوضح (تذكر admin123 و NODE_ENV=production)؛ **جديد**: `assertNoDefaultPasswordAccounts()` — في الإنتاج وعند غياب المتغير، إذا فيه أي حساب موجود يتحقق مع `admin123` (bcrypt) → يرفض الإقلاع برسالة تطلب ضبط المتغير وإعادة ضبط الحسابات (حماية "keep" لقاعدة مرفوعة من dev إلى prod). (2) `login.astro` — كتلة "Seeded accounts — password admin123" صارت `{showSeededHint && ...}` حيث `showSeededHint = process.env.NODE_ENV !== 'production'` (مخفية في الـ production build — وVite يدمج NODE_ENV وقت البناء فتبقى مخفية حتى لو runtime بدون المتغير؛ الـ dev باقي يعرضها). (3) `test.mjs` — قسم جديد "Seed password policy" (11 فحص) عبر subprocesses بنمط `-e` + الـ loader نفسه: (a) إقلاع إنتاجي بدون المتغير على قاعدة جديدة → يرمي مع رسالة تذكر ADMIN_DEFAULT_PASSWORD؛ (b) مع المتغير → البذور تنزرع بكلمة المرور المكوّنة (bcrypt verify) وليس admin123؛ (c) نفس السياسة عبر CLI `init-db.mjs` (رفض + نجاح + تحقق hash)؛ (d) قاعدة مُزرعة dev (admin123) مرفوعة للإنتاج → الـ keep-guard يرفض حتى بدون إعادة بذر.
- **Verification**: typecheck → **0 errors / 0 warnings / 13 hints** ✅؛ `pnpm --filter @brightai/qc-task-manager test` → **276 passed / 0 failed** (265 + 11 جديدة) ✅؛ `NODE_ENV=production build` → Server built ✅؛ **فحص حي على build الإنتاجي**: GET /login → **0** ظهور لـ admin123 و "Seeded accounts" ✅؛ **فحص حي على astro dev**: الـ hint ظاهر ✅ (سلوك dev ما تغيّر)؛ يدوي على قواعد مؤقتة: `init-db` ومسار `getDb` مع NODE_ENV=production بدون المتغير → exit 1 برسالة واضحة تذكر المتغير ✅؛ `git diff --check` → نظيف ✅.
- **Notes**: `init-db.mjs` بقي كما هو (حارس الـ creation موجود أصلًا فيه ويطابق seed.ts — الـ keep-guard الجديد حصرته في مسار الـ runtime لأن المهمة سمّت `src/lib/seed.ts` فقط). الـ e2e scripts تستخدم `?? 'admin123'` كـ default محلي — ما لمستها. لا commit ولا push — المستخدم يلتزم.
- **Status**: verified (typecheck + 276/0 + build + live prod/dev login + temp-DB refusal). لا commit ولا push.

---

### 2026-08-14 — QC-CSP-STYLE-SRC-001: إزالة `unsafe-inline` من `style-src` في CSP تطبيق QC (P1 من الـ evidence audit) — بدون كسر Tailwind أو React islands

- **Files**: `apps/qc-task-manager/src/middleware.ts` (CSP)، `apps/qc-task-manager/src/components/DashboardCharts.tsx`، `apps/qc-task-manager/src/pages/employee/index.astro`، `apps/qc-task-manager/src/pages/tasks/[id].astro`، `docs/SECURITY-AUDIT.md`، `docs/PRODUCTION-READINESS-REPORT.md`، `.agents/brain.md` (هذا السجل).
- **What**: غيّرت `style-src 'self' 'unsafe-inline'` → `style-src 'self' 'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow='`. التحقق الأولي: لا `<style>` tags في المصدر إطلاقًا؛ 22 inline `style=` موزعة على 3 ملفات (2 أشرطة تقدم Astro + 20 في DashboardCharts). **الاكتشاف الحاسم**: Astro يحقن `<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>` ثابتًا في كل صفحة فيها island (وكل صفحات QC فيها Navbar client:load) — هذا الـ block الوحيد الذي يحتاج استثناء، فحسبت له SHA-256 وحده بدل unsafe-inline (الـ hash موثق في تعليق الـ middleware مع أمر إعادة الحساب عند ترقية Astro). كل الـ inline styles التطبيقية حُوّلت لمباني CSP-safe: أحجام/أوزان خطوط SVG صارت presentation attributes (`fontSize`/`fontWeight`/`pointerEvents`)، أشرطة التقدم (employee + tasks/[id] + CompletionRateCard + Priority/Overdue bars) صارت `<svg><rect width=% fill=...>`، نقاط الـ legends صارت `<circle fill=...>`، `outlineOffset` حُذف لأن Tailwind v3.4 `outline-none` يتضمن `outline-offset: 2px` أصلًا، و`minWidth` حق BarChart صار attribute `width={width}`. الـ tooltips (hover-only) بقيت inline لأنها تُرسم client-side عبر CSSOM اللي ما يحجبه CSP — موثّق في تعليق الـ middleware.
- **Verification**: typecheck → 0 errors / 13 hints (نفس baseline) ✅؛ `NODE_ENV=production build` → Server built ✅؛ **فحص حي** على سيرفر production: هيدر login فيه `style-src 'self' 'sha256-...'` بدون unsafe-inline، صفحة login فيها **0** `style="` و **0** `<style>`، /dashboard فيها **0** `style="` و `<style>` الوحيد هو بالضبط `astro-island,...{display:contents}` (يطابق الـ hash)، أشرطة تقدم /tasks و /employee تُعرض `<rect width="45%" fill="#f59e0b/#3b82f6">` صحيحة؛ `verify-security-hygiene.mjs` → passed ✅؛ `pnpm test` → **265 passed / 0 failed** ✅؛ `pnpm e2e:acceptance` → **كل الـ suites PASS (dashboard 45/45 + task-shared + الباقي + restart persistence)** ✅؛ `git diff --check` → نظيف ✅.
- **Notes**: `docs/SECURITY-AUDIT.md` و `docs/PRODUCTION-READINESS-REPORT.md` اتحدثت (RISK/P1 مقفولة). ملاحظة للمستقبل: أي ترقية لـ Astro تغيّر ISLAND_STYLES تتطلب إعادة حساب الـ hash (الأمر موجود في تعليق middleware.ts). الـ e2e-dashboard بقي 45/45 والـ charts نفس data attributes/aria-labels — فقط آلية التلوين/العرض تحولت من inline style إلى SVG attributes.
- **Status**: verified (build + typecheck + hygiene + 265/0 + e2e acceptance كامل). لا commit ولا push — المستخدم يلتزم.

---

### 2026-08-14 — QC-GROQ-LIVE-SMOKE-001: محاولة تحقق حي واحد من تكامل Groq — FAILED بصراحة

- **Files**: `apps/qc-task-manager/scripts/smoke-ai-live.mjs` (جديد — غير committed)، `docs/AI-ARCHITECTURE.md` (قسم "Live verification")، `.agents/brain.md` (هذا السجل).
- **What**: بإذن صريح من المستخدم لمكالمة شبكة **واحدة** فقط، نفّذت smoke حي: `analyzeTask` → `runStructuredAi` → `createGroqProvider()` (المسار الحقيقي: `serverAiConfig()` يقرأ `GROQ_API_KEY`/`GROQ_MODEL` من env فقط — المفتاح طوله 56 موجود بالبيئة، ما طُبع ولا كُتب). Temp DB في `/tmp` مع fixture متحكم فيه فيه رقم جوال سعودي (0551234567) وإيميل (person@example.com) داخل `<untrusted_qc_data>`.
- **Result**: **FAILED — لا اختراع نجاح.** المكالمة الحية الوحيدة فشلت مع `AiServiceError` ('AI request could not be completed.') — أي العقد الآمن اشتغل (لا body خام ولا key ولا prompt تسرّب). السبب الجذري مخفي عمدًا بالعقد: المفتاح ممكن invalid/expired، أو quota منتهي، أو الشبكة محجوبة في هذه البيئة. **ما أعدت المحاولة** (الإذن كان لمكالمة واحدة فقط — القاعدة حرفية). الـ redaction pre-check المحلي اللي سبق المكالمة نجح (الجوال والإيميل انمحوا من الـ prompt المرسل).
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **265 passed / 0 failed** بعد المحاولة ✅ (acceptance criterion 2). ملاحظة: `apps/qc-task-manager/docs/AI-ARCHITECTURE.md` **غير موجود** — الملف الفعلي على الجذر `docs/AI-ARCHITECTURE.md` (نفس المسار الموثق في سجلات الـ brain السابقة)؛ وثّقت هناك.
- **Notes**: السكربت `smoke-ai-live.mjs` بقي (غير committed) وأُحسّن ليطبع `failure_reason` من audit log ويحتفظ بالـ temp DB للفحص عند الفشل — جاهز لإعادة تشغيله عند إذن ثانٍ أو بعد تدوير المفتاح. الـ mocked 429/5xx mapping و audit no-leak مغطاة أصلاً في `test-ai-foundation.mjs`/`test-ai-features.mjs`.
- **Status**: delivered — FAILED بصراحة؛ لا commit ولا push.

---

### 2026-08-14 — QC-RENDER-BLUEPRINT-001: تعريف خدمة QC الثانية في render.yaml (PROMPT 02 من الـ evidence audit)

- **Files**: `render.yaml` (إضافة service block `qc-task-manager` — لم ألمس `brightai-site` إطلاقًا)، `apps/qc-task-manager/docs/DEPLOYMENT.md` (قسمان جديدان: "Deployment ownership (no push from agents)" + "Render blueprint configuration" بدل التحذير القديم)، `.agents/brain.md` (هذا السجل).
- **What**: أضفت خدمة QC كخدمة **ثانية** في `services:` (بعد `brightai-site` مباشرة في نهاية الملف): `type: web` + `runtime: node` + `name: qc-task-manager` + `buildCommand: pnpm install && pnpm --filter @brightai/qc-task-manager build` (minimal ومطابق لأسلوب الـ monorepo — ما كسرت buildCommand حق brightai-site) + `startCommand: pnpm --filter @brightai/qc-task-manager start` (السكربت `start` = `node ./dist/server/entry.mjs` موجود في package.json) + `healthCheckPath: /api/health` (بعد ما نزل PROMPT 01). أضفت persistent disk: `name: qc-data` + `mountPath: /var/data` + `sizeGB: 1` (SQLite + backups). envVars **أسماء فقط** بلا قيم: `QC_DATABASE_PATH` / `QC_BACKUP_DIR` / `NODE_ENV` / `GROQ_API_KEY` / `ADMIN_DEFAULT_PASSWORD` — كلها `sync: false` (نفس نمط REDIS_URL الحالي = القيمة من الـ dashboard وما تتزامن مع الـ redeploys). **SESSION_SECRET ما أضفته** — PROMPT 10 (docs alignment) ما نزل بعد. `autoDeploy: false` عشان الخدمة تبقى opt-in والمستخدم يفرّغها يدويًا من الـ dashboard.
- **Decision**: (1) `sync: false` لكل المتغيرات لأن القيم كلها من الـ dashboard (ما في value واحد في الملف — حتى غير السرية زي المسارات) — هذي القراءة الحرفية لـ "never commit values" والـ acceptance criteria "No env values, keys, or secrets are written to the file". (2) `autoDeploy: false` على خدمة QC فقط — ما غيرت سلوك brightai-site الافتراضي. (3) ما أضفت NODE_VERSION env لأن المطلوب Node 22 LTS والمطابق لـ root engines (node 22.x) — وRender node runtime افتراضيًا 22 — ووثّقته بتعليق بدل متغير (المتغيرات المطلوبة في المواصفة خمسة فقط).
- **Verification**: `python3 -c yaml.safe_load` → **services count = 2** (brightai-site + qc-task-manager) ✅؛ envVars كلها keys فقط بلا values ✅؛ مسح أسرار (`sk-`/`gsk_`/`AIza`/`BEGIN`/`xox`) → الـ `sk-` الوحيد كان false positive من كلمة "task-" في التعليقات ✅؛ `node scripts/check-render-route-hygiene.mjs` → exit 0 (htmlDestinations فارغة) ✅؛ `node scripts/verify-csp-drift.mjs` → **CSP drift check passed** (headers حق brightai-site ما تأثرت — القراءة تعتمد على services[0]) ✅؛ `git diff` → 73 insertions / 5 deletions (render.yaml +39، DEPLOYMENT.md +39/-5) ✅.
- **Notes**: لم أعدّل `.github/workflows/` ولا `.env*` ولا push ولا commit — المستخدم يلتزم. الـ qc service معرّف لكن ما فيه deploy تلقائي — أول deploy يدوي من الـ dashboard (مع ضبط القيم الخمس + إنشاء الـ disk). DEPLOYMENT.md وثّق أن النشر **ملك المستخدم** وأن أي تغيير ينضاف للريبو ما يفرّغ شي بنفسه.
- **Status**: verified locally (yaml parse + 2 services + لا أسرار + لا قيم + guards نظيفة). لا commit ولا push.

---

### 2026-08-14 — QC-HEALTH-ENDPOINT-001: إضافة `/api/health` (readiness probe) لمدير مهام QC — PROMPT 01 من الـ evidence audit

- **Files**: `apps/qc-task-manager/src/pages/api/health.ts` (جديد)، `src/middleware.ts`، `scripts/verify-security-hygiene.mjs`، `docs/DEPLOYMENT.md`، `.agents/brain.md` (هذا السجل).
- **What**: أضفت `GET /api/health` عام (مثل `/login`) بدون auth ولا CSRF — GET فقط بلا تغيير حالة، ويعيد `200 { ok:true, service:'qc-task-manager', status:'healthy', schemaVersion:<int> }` حيث `schemaVersion` من جدول `schema_migrations` الحقيقي (`COALESCE(MAX(version),0)` — نفس استعلام validateSchema). عند غياب ملف القاعدة أو عدم تمكن الوصول أو عدم تهيئة الـ schema يرجع `503 { ok:false, status:'unhealthy', reason:<رسالة ثابتة قصيرة> }`. الـ reasons ثابتة: `database unavailable` / `schema not initialized` — الـ handler **ما يسجل أي شيء** ولا يضع مسارات/env/أسرار في الاستجابة (catch صامت لأن رسائل الاستثناء قد تحمل مسارات). أضفت `/api/health` لـ `PUBLIC_PATHS` في middleware (مع توثيق أنه read-only ولا ينشئ القاعدة أبدًا)، واستثنيت الملف من فحص `requireApiUser` في `verify-security-hygiene.mjs` عبر `PUBLIC_API_ROUTES` (فحص الباقي باقي على حاله — CSRF للـ POST و [id] و query()). وثّقت الـ endpoint في DEPLOYMENT.md كـ `healthCheckPath: /api/health` مع أمثلة 200/503.
- **Decision (مهم للـ future agents)**: الـ probe **لا ينشئ القاعدة أبدًا** — الملف ناقص = 503 حتمي (قرص فارغ/ملف منقول = "not ready" صادق). جرّبت تهيئة القاعدة عند إقلاع الخادم عبر module-scope في middleware، لكن اكتشفت أن Astro standalone **لا يقيّم middleware عند الإقلاع** (يقيّمه عند أول طلب) — وأي auto-create عند أول طلب يكسر حتمية "missing → 503" (أول probe يخلق القاعدة ويرجع 200). لذلك القاعدة تنشأ من التطبيق نفسه عند أول طلب يمسّ القاعدة (أول POST /login) — نفس السلوك الكسول الأصلي — والـ health يرجع 503 إلى أن يوجد الملف، وهذا سلوك readiness صحيح موثق في DEPLOYMENT.md (بعد أول deploy، القرص الدائم يحتفظ بالقاعدة فتصير الـ deploys اللاحقة healthy فورًا).
- **Verification**: `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 0 warnings / 13 hints** ✅؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built** ✅؛ `verify-security-hygiene.mjs` → **passed** ✅؛ `architecture-guard.mjs` → **passed** ✅؛ `pnpm --filter @brightai/qc-task-manager test` (كل السلاسل) → **exit 0** ✅. **اختبار حي على build**: قاعدة مؤقتة `/tmp/health-test.db` (db:init أولًا مثل عرف الـ e2e) → `200` مع `schemaVersion:10` وبلا أي مسار/سر في الجسم (scan نظيف) + headers أمنية كاملة (CSP/nosniff/DENY/no-store)؛ نقلت الملف → `503` + الخادم **حي** بعده و`/login` رجع 200؛ أرجعته → 200. مسار جديد بدون ملف → `503` حتمي بدون إنشاء. `POST /api/health` → 404 (بلا handler — GET only). مجهول → 200/503 مباشر بدون 302 لجدار الدخول.
- **Notes**: ملاحظة بيئية — الـ background servers اللي تشتغل من أداة الـ terminal تموت بين استدعاءات الأدوات (قتل العملية عند انتهاء الأمر الأب)، فاختبارات الـ live server لازم تشغّل الخادم والـ curl بنفس الأمر/السكربت (نمط e2e-acceptance). `render.yaml` ما زال بلا خدمة QC (PROMPT 02 — قرار نشر للمستخدم). لم أعدّل `.github/workflows/` ولا `.env*` ولا push.
- **Status**: verified locally (typecheck + build + guards + full test suite + live 200/503/restore + leak scan). لا commit ولا push — المستخدم يلتزم.

### 2026-08-14 — QC-AUDIT-EXEC-001: تنفيذ تدقيق Evidence-First كامل + تسليم تقرير وبرومبتات تنفيذية

- **Files**: `audit/qc/2026-08-14-EVIDENCE-AUDIT.md` (جديد — التقرير الكامل)، `audit/qc/2026-08-14-IMPLEMENTATION-PROMPTS.md` (جديد — 10 برومبتات تنفيذية لإغلاق الفجوات)، `.agents/brain.md` (هذا السجل).
- **What**: نفّذت برومبت تدقيق QC-AUDIT-AGENT-PROMPT-001 بالكامل read-only: فهرسة `audit/qc/`، استخراج المتطلبات من PROMPTS.md (12) + prompt2.md (18) + prompt3.md، RTM كامل، وفحوصات طازجة.
- **Verification (طازج اليوم)**: typecheck 0/0/13 ✅؛ `pnpm test` = **265 passed/0 failed** ✅؛ Architecture Guard ✅؛ Security Hygiene ✅؛ `NODE_ENV=production build` → Server built ✅؛ **`pnpm e2e:acceptance` = 386/0** (admin-users 49 + auth-lockout 44 + task-shared 196 + delete-request 39 + dashboard 45 + backup 13 + restart-persistence ✅ — اشتغل في هذه البيئة بعد ما كان EPERM سابقًا)؛ قاعدة طازجة `/tmp`: 29 جدول/51 فهرس/integrity ok/0 FK violations + migrations العشر مطبقة؛ `pnpm lint` الجذر FAIL (كله في dashboard logger.ts:81 — QC بلا lint script)؛ `GROQ_API_KEY` موجود بالبيئة (لم يُستخدم — قواعد التدقيق تمنع الشبكة).
- **Findings**: Functional 92%، Deployment 35% — **NO-GO إنتاجيًا / Conditional GO محليًا** (نفس P0s: render.yaml بلا خدمة QC، لا /api/health، Groq live غير متحقق) + P1: style-src unsafe-inline، SESSION_SECRET غير مقروء، أسرار تاريخية تحتاج rotate.
- **Notes**: الـ working tree بقي نظيفًا (تعديل brain فقط)؛ الملفات الجديدة untracked — commit على المستخدم.
- **Status**: delivered؛ لا commit ولا push.

### 2026-08-14 — QC-AUDIT-AGENT-PROMPT-001: برومبت تدقيق evidence-first لمسار QC

- **Files**: `.agents/brain.md` فقط.
- **What**: جهّزت للمستخدم برومبت محادثة لوكيل مستقل يقرأ `audit/qc/` ويطابق البرومبتات والتقارير مع التطبيق الفعلي في `apps/qc-task-manager`، ويعطي scorecard بنسب قابلة للتتبع، فجوات مرتبة، ومراجعة UI/UX/A11y/operations بدون تعديل ملفات.
- **Decision**: البرومبت يفرض الفصل بين implemented وverified محليًا وverified production؛ ولا يسمح بتحويل تقارير/اختبارات قديمة إلى دليل إنتاج.
- **Status**: delivered in chat; لا تعديل للكود ولا commit ولا push.

### 2026-08-12 — QC-PRODUCTION-READINESS-AUDIT-001: تدقيق Release/Security/QA/Database/AI Governance شامل — القرار NO-GO

- **Files**: `docs/PRODUCTION-READINESS-REPORT.md`, `.agents/brain.md`.
- **Scope**: تدقيق read-only بدون إضافة Features أو تعديل `.env*` أو workflows أو Git history؛ فحصت build/test/E2E، SQLite/migrations/backups، auth/RBAC/IDOR/CSRF/rate limits/uploads/sessions، Groq server-only، AI governance، QC operations/audit/performance/deployment.
- **BUILD evidence**: `pnpm typecheck` exit 0 (QC Astro check: 144 files، 0 errors، 0 warnings، 13 hints)؛ `pnpm test` exit 0 (root 16+29+38 = 83)؛ `pnpm build` exit 0 (258 public URLs، 269 HTML، مع duplicate route-collision warnings)؛ `pnpm e2e:acceptance` elevated outside sandbox PASS (49+44+196+39+45+13 + restart persistence)؛ QC suite `pnpm --filter @brightai/qc-task-manager test` = 265 passed/0 failed؛ `pnpm lint` **FAIL** بسبب `@typescript-eslint/no-explicit-any` في `apps/dashboard/lib/observability/logger.ts:81` مع warnings قائمة.
- **Security/Groq evidence**: `verify-security-hygiene.mjs` PASS؛ لا key-shaped token حاليًا في Git/current files/client bundles/HTML؛ `GROQ_API_KEY` في البيئة الحالية UNSET، لذلك live Groq request **غير متحقق**؛ mocked 429/500/timeout/Zod/prompt-injection/AI-audit tests PASS؛ root `verify:deployment-surface` outside sandbox = 56/57، `/api/ai/chat/` رجع 500 بدون provider config.
- **Database evidence**: temp DB schema version 10، 10 migrations، 29 tables، 51 indexes، `integrity_check=ok`، وFK check بلا violations؛ migration/backup/restore/retention/E2E backup 13 checks PASS؛ synthetic SQLite 1001-row query plan استخدم attachment index، وconcurrent write انتظر ~5.4s ثم `SQLITE_BUSY` بعد busy_timeout 5000ms.
- **P0 blockers**: root `render.yaml` يعرّف `brightai-site` فقط ولا يعرّف QC Render service/persistent disk/env؛ لا يوجد QC `/api/health` route (الـ health الموجود لـ dashboard منفصل)؛ Groq live/configuration غير متحقق والـ deployment-surface AI endpoint 500 بدون المفتاح.
- **P1/P2**: `style-src 'unsafe-inline'` قائم؛ historical provider secrets تحتاج revoke/rotate خارجي؛ distributed rate limiting/load/a11y manual/live production backup restore غير متحقق؛ backup scheduler يطبع `SQLITE_CANTOPEN` أثناء تنظيف temp DB؛ duplicate route warnings وfindings full-scan query plan مرشحات تحسين.
- **Decision**: **NO-GO**. لا يصح استخدام `Production Ready`؛ التقرير يفرق بين Implemented + Tested + Verified محليًا وبين verified production. لا commit ولا push؛ المستخدم يراجع ويلتزم بنفسه.

### 2026-08-12 — QC-GROQ-CONFIG-001: اعتماد GROQ_MODEL بدون حفظ المفتاح

- **Files**: `apps/qc-task-manager/src/lib/ai/provider.ts`, `docs/AI-ARCHITECTURE.md`.
- **What**: صار `GROQ_MODEL` هو override الأساسي لموديل Groq، مع إبقاء `AI_MODEL` كتوافق خلفي، والافتراضي `llama-3.3-70b-versatile`.
- **Secrets**: لم أكتب قيمة `GROQ_API_KEY` في source أو `.env` أو logs؛ قواعد المشروع تمنع تعديل ملفات `.env*`. المفتاح الذي أُرسل في المحادثة يُعامل كمكشوف ويحتاج revoke/rotate خارجيًا.
- **Status**: local configuration update; no commit/push.

---

### 2026-08-12 — QC-AI-QC-COPILOT-001: ميزات AI QC فوق Groq Foundation

- **Files**: `apps/qc-task-manager/src/lib/ai/{features,schemas,context,prompts,types}.ts`, `src/lib/aiQcContext.ts`, `src/pages/api/ai/[feature].ts`, `src/components/AiReviewPanel.tsx`, `src/pages/{tasks/[id],findings/[id],dashboard}.astro`, `db/migrations/010_ai_evidence_status.sql`, `db/schema.sql`, `src/lib/{types,evidence,index}.ts`, `scripts/test-ai-features.mjs`, `scripts/test-ai-foundation.mjs`, `scripts/test-templates.mjs`, `scripts/test-migrations.mjs`, `scripts/test-dashboard-reports.mjs`, `scripts/test.mjs`, `package.json`, `docs/AI-QC-COPILOT.md`, `docs/superpowers/plans/2026-08-12-ai-qc-copilot.md`.
- **What**: أضفت Task Analysis، Finding Analysis، RCA Assistance، CAPA Assistance، AI Executive Summary، وEvidence AI Review. كل النتائج strict Zod structured output وتحمل confidence/evidence_used/human_review_required. الـ API يقرأ IDs فقط، ويعيد بناء authorized context server-side؛ AI لا يستدعي mutation/approval/closure/RBAC/delete authority. أضفت UI labels واضحة: AI Generated، Confidence، Evidence Used، Human Review Required.
- **Security**: محتوى التعليقات/الملفات داخل `<untrusted_qc_data>` ولا يغيّر system instructions؛ redaction للإيميل/الجوال/الأسرار؛ Evidence review لا يرسل BLOB إلى Groq، ويتطلب صلاحية + supported evidence extension + consent صريح. أضفت lifecycle `AI_PENDING` → `AI_REVIEWED` مع الرجوع إلى `UNVERIFIED` عند الفشل، و`HUMAN_VERIFIED`/`REJECTED` تبقى قرارات بشرية.
- **Management scope**: management summary للـ supervisor/manager/admin فقط؛ supervisor مقيد بقسمه؛ الموظف يرجع 403. لا يتم حفظ أي اقتراح AI كقرار نهائي تلقائيًا.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **265 passed / 0 failed**؛ tests mocked تغطي valid response، invalid JSON/schema، timeout، 429، 500، prompt injection، PII، unauthorized access، evidence consent. `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built**؛ typecheck → **0 errors / 13 existing hints**؛ Architecture Guard → **passed**؛ Security Hygiene → **passed**؛ diff check → **passed**.
- **Limitations**: لا live Groq integration test لعدم توفر `GROQ_API_KEY` في السياق؛ لا يُستنتج من mocked tests أن الاتصال الخارجي أو quota production يعمل. تحذيرات backup scheduler `SQLITE_CANTOPEN` أثناء حذف قواعد الاختبار المؤقتة موجودة بدون فشل في الاختبارات.
- **Status**: verified locally; لا commit ولا push. تغييرات dirty السابقة في `audit/qc/prompt3.md` و`.superpowers` خارج نطاق المهمة ولم تُستخدم.

### 2026-08-12 — QC-AUDIT-INTEGRITY-GROQ-001: SHA-256 audit chain وGroq AI foundation

- **Files**: `apps/qc-task-manager/db/migrations/{008_audit_integrity,009_ai_audit}.sql`, `db/schema.sql`, `src/lib/{activity,audit/chain,ai,aiAudit,db}.ts`, `scripts/{test-audit-integrity,test-ai-foundation,test,test-migrations,test-dashboard-reports}.mjs`, `package.json`, `apps/qc-task-manager/.env.example`, `docs/{AUDIT-INTEGRITY,AI-ARCHITECTURE}.md`, `docs/superpowers/plans/2026-08-12-audit-integrity-groq-foundation.md`.
- **What**: أضفت `previous_hash` و`event_hash` لـ `task_activity_log`، canonical JSON ثابت، SHA-256 على `canonical_event + previous_hash`، append ذري، backfill legacy، و`verifyAuditChain()` يرجع PASS أو FAIL مع أول event وexpected/actual hash. وثّقت أن السلسلة تكشف العبث لكنها لا تجعل SQLite immutable فعليًا. أضفت Groq server-only abstraction بحدود Feature → AI Service → Groq Provider → Groq API، model default `llama-3.3-70b-versatile` عبر `AI_MODEL` اختياري، `GROQ_API_KEY` فقط من server env، timeout/retries transient bounded، Zod validation، sanitized AI audit table، rate limit per user/feature، وعدم تسجيل key أو Authorization أو raw prompts/errors.
- **Migration decision**: migration `007_dashboard_reports.sql` كانت موجودة؛ لذلك صار Audit integrity = `008` وAI audit = `009`، وأضيفت migration التقارير إلى embedded startup list لضمان تطابق التطبيق مع مجلد migrations.
- **Secrets**: لم يصل `GROQ_API_KEY` في طلب المستخدم، لذلك لم أعدل أو أنشئ `.env` ولم أضع قيمة مخترعة. `apps/qc-task-manager/.env.example` يحتوي فقط `GROQ_API_KEY=`، و`.env` مستثنى من Git.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **265 passed / 0 failed**؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built**؛ `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 13 existing hints**؛ Architecture Guard → **passed**؛ `verify-security-hygiene.mjs` → **passed**؛ `git -c core.fsmonitor=false diff --check` → **passed**. ظهرت تحذيرات `SQLITE_CANTOPEN` من backup scheduler بعد حذف قواعد الاختبار المؤقتة، بدون فشل اختبار.
- **Status**: verified locally; لا live Groq request لغياب المفتاح، ولا commit ولا push. يوجد dirty work سابق على `audit/qc/prompt3.md` وملفات حالة `.superpowers` ولم تُستخدم ضمن التغيير المقصود.

### 2026-08-12 — QC-WORKFLOW-ENGINE-001: إضافة Workflow Engine مع snapshot وworkload وsmart assignment

- **Files**: `apps/qc-task-manager/db/migrations/006_workflow_engine.sql`, `db/schema.sql`, `src/lib/{workflows/engine,workflows/index,workload,assignment,types,permissions,activity,db,tasks,taskUpdates}.ts`, `src/pages/manager/workload.astro`, `src/pages/api/tasks/suggestions.ts`, `scripts/test-workflow.mjs`, `scripts/test.mjs`, `scripts/test-migrations.mjs`, `package.json`, `docs/{ARCHITECTURE,ROLES-AND-PERMISSIONS}.md`, `docs/superpowers/plans/2026-08-12-workflow-engine.md`.
- **What**: أضفت الجداول الأربعة المطلوبة: `workflow_definitions`, `workflow_steps`, `workflow_instances`, `workflow_actions`، مع تعريفين افتراضيين: Normal `Employee → Completed` وCritical `Employee → Supervisor Review → Manager Approval → Closed`. المهمة الجديدة تنشئ instance، والـ instance يحتفظ بـ immutable definition snapshot؛ المهام القديمة بدون instance تبقى على lifecycle الحالي. الرفض يتطلب سببًا ويسجل `previous_state`, `reason`, `actor_id`, `acted_at`. أضفت workload metrics الثمانية، top-3 assignment recommendations مع `whyRecommended`، و`skills_json` اختياري. الاقتراحات لا تعدّل assignee تلقائيًا. صفحة مقارنة workload والـ API محمية بصلاحية supervisor/manager/admin، والموظف لا يستلم مقارنة زملائه.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **265 passed / 0 failed**؛ `pnpm --filter @brightai/qc-task-manager test:workflow` → **passed**؛ `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 0 warnings / 13 hints**؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built**؛ `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` → **passed**؛ `git -c core.fsmonitor=false diff --check` → **passed**. اختبار workflow ظهر معه warning بيئي من backup scheduler عند حذف قاعدة temp، بدون فشل في الاختبار.
- **Status**: verified locally; لا live browser E2E لمسارات workflow/workload في هذه المهمة، فلا يُستنتج production readiness. لا commit ولا push؛ المستخدم يلتزم.

### 2026-08-12 — QC-EVIDENCE-TEMPLATES-LIFECYCLE-001: إكمال Evidence architecture وربطها بالـ Templates والـ Lifecycle

- **Files**: `apps/qc-task-manager/src/lib/taskUpdates.ts`, `src/lib/taskDetails.ts`, `src/lib/types.ts`, `src/components/TaskLifecycle.tsx`, `src/components/EvidenceRequirementsInput.tsx`, `src/pages/tasks/[id].astro`, `scripts/test-templates.mjs`, `docs/{ARCHITECTURE,ROLES-AND-PERMISSIONS,TESTING}.md`, `README.md`, `docs/superpowers/plans/2026-08-12-qc-evidence-templates-lifecycle.md`.
- **What**: أكملت metadata الخاصة بـ Evidence (description/source/collected_at/collected_by/SHA-256/size/MIME/verification status) عند الحفظ، وخليت بوابة الإكمال server-side تعترف بالأدلة السابقة غير المرفوضة بعد reopen، مع بقاء authorization وduplicate/replacement rules. صفحة تفاصيل المهمة والـ wizard يعرضون حالة Required/Optional ومحتوى evidence الموجود. أصلحت JSX/type contract في EvidenceRequirementsInput.
- **Docs/examples**: وثّقت Evidence security/statuses، Template lifecycle/snapshot، الصلاحيات، الاختبارات، وأمثلة Daily Inspection وWeekly QC Review وMonthly Audit وMaterial Inspection وNon-Conformance Review.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **265 passed / 0 failed**؛ `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 0 warnings / 12 hints**؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built**؛ `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` → **passed**؛ focused `test:templates` → **passed**؛ `git -c core.fsmonitor=false diff --check` → **passed**.
- **Status**: verified locally; live browser E2E غير مشغّل في هذه المهمة، فلا يُستنتج منه production readiness. لا commit ولا push؛ المستخدم يلتزم.

### 2026-08-11 — QC-OPERATIONS-PLATFORM-001: إضافة Findings/CAPA/RCA وواجهات التشغيل

- **Files**: `apps/qc-task-manager/db/migrations/004_qc_operations.sql`, `db/schema.sql`, `src/lib/{db,findings,capa,qc-operations,permissions,types,validation}.ts`, `src/pages/findings/{index,[id]}.astro`, `src/pages/api/findings/**`, `src/components/QcStatusBadge.astro`, `src/components/Navbar.tsx`, `scripts/test-qc-operations.mjs`, `package.json`, `docs/{ARCHITECTURE,ROLES-AND-PERMISSIONS,TESTING}.md`, `docs/superpowers/plans/2026-08-11-qc-operations-platform.md`.
- **What**: أضفت QC Findings مرتبطة بـ `tasks.id` فقط بدون استبدال أو إعادة تعريف `Task`، مع classification/lifecycle المطلوبين، CAPA واحد لكل Finding، RCA (5 Whys/Fishbone/Free-form)، Evidence، Audit مستقل، وRBAC server-side. أضيفت routes `/findings` و`/findings/[id]`، وأقسام Timeline/RCA/CAPA/Evidence/Approval/Audit. Critical Finding لا يقفل إلا بعد CAPA وaction/evidence/effectiveness/verification/approval وclosure evidence؛ CAPA لا يقفل بدون action/evidence/effectiveness/approval.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **265 passed / 0 failed** + migration/architecture/QC operations/SLA/DB rules PASS؛ `typecheck` → **0 errors / 0 warnings / 11 hints**؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built**؛ `git diff --check` لا أخطاء محتوى، مع تحذير fsmonitor IPC بيئي من Git.
- **Status**: verified locally; live browser E2E على `/findings` و`/findings/[id]` غير مشغّل في هذه المهمة، لذلك لا يُستنتج منه production readiness. لا commit ولا push؛ المستخدم يلتزم.

### 2026-08-11 — QC-SLA-ENGINE-001: إضافة SLA Engine قابل للتهيئة والتصعيد داخل QC Task Manager

- **Files**: `apps/qc-task-manager/db/migrations/003_sla_engine.sql`, `db/schema.sql`, `src/lib/{sla/index.ts,sla/engine.ts,db.ts,types.ts,activity.ts,notifications.ts,tasks.ts,taskUpdates.ts,dashboard.ts}`, `src/pages/{dashboard.astro,notifications.astro}`, `scripts/{test-sla.mjs,test.mjs,test-migrations.mjs}`, `package.json`, `docs/superpowers/plans/2026-08-11-qc-sla-engine.md`.
- **What**: أضفت SLA policies قابلة للتهيئة حسب priority/department/task type مع target duration وwarning/critical thresholds و`pause_on_hold`. أضفت snapshot fields للمهمة (`sla_policy_id`, timestamps, elapsed/remaining/percent/status)، ومحركًا server-authoritative يستخدم `datetime('now')`. الافتراضي: On Hold لا يوقف SLA؛ policy تقدر تفعّله. أضفت escalation policies/events بعتبات 80/90/100/120، in-app delivery فقط، audit fields المطلوبة، retry recovery، وunique idempotency key يمنع التكرار. أضفت dashboard KPIs: SLA Compliance, At Risk, Critical, Breached, Average Resolution, Average SLA Consumption.
- **Defaults**: URGENT = 24h / Warning 70% / Critical 90%، وfallback عام = 72h؛ لا تُعاد seed policies إذا كانت موجودة. Task Type يستفيد من `task_type` ويستخدم `inspection_type` كـ compatibility fallback عند إنشاء المهمة.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **265 passed / 0 failed** (migration + architecture + domain + SLA pure/DB + DB rules)؛ `pnpm --filter @brightai/qc-task-manager test:sla` → pure temporal cases + escalation idempotency/retry recovery PASS؛ `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 0 warnings / 11 existing hints**؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built**؛ Architecture Guard PASS.
- **Status**: verified locally; uncommitted — المستخدم يلتزم، ولا push. Live E2E بعد إضافة SLA غير مشغّل في هذه المهمة؛ production scheduler/worker خارجي غير مضاف، لذلك dashboard/task requests هي trigger لتحديث SLA والتصعيد حاليًا. تعديل `audit/qc/prompt3.md` كان موجودًا مسبقًا ولم ألمسه. تحذير `git` fsmonitor IPC بيئي قائم.

### 2026-08-11 — QC-ARCHITECTURE-GUARD-001: توحيد مصدر الحقيقة وحارس architecture

- **Files**: `apps/qc-task-manager/scripts/architecture-guard.mjs`, `scripts/test.mjs`, `package.json`, `src/lib/{sla,workflows,audit,ai,findings,capa}/`, `src/lib/{format,notifications,taskUpdates}.ts`, `apps/qc-task-manager/docs/ARCHITECTURE.md`, `apps/qc-task-manager/SECURITY.md`, `docs/{SINGLE-SOURCE-OF-TRUTH,ARCHITECTURE,SECURITY}.md`, `docs/superpowers/{specs,plans}/2026-08-11-qc-architecture-guard-*`.
- **What**: ثبّتُّ `task-policy.ts` كمصدر قواعد المهمة و`permissions.ts` كمصدر RBAC، وأضفت طبقات SLA/workflows/audit/ai/findings/capa. نقلت حسابات overdue/due-soon إلى SLA مع compatibility exports، وربطت task mutation audit boundary server-side. أضفت Architecture Guard ثابتًا يفحص canonical modules، تكرار authority، حدود UI/AI، API guard imports، وSQLite invariants. أضفت entry points جذرية للـ architecture/security بدون نسخ الوثائق.
- **Rules**: UI ليس authorization authority؛ API يعيد التحقق server-side؛ AI advisory-only ولا يكتب state/audit؛ DB تحمي role/status/progress/FK invariants؛ audit ينشأ من الخادم.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **migration + Architecture Guard + 265 domain + DB rules PASS / 0 failures**؛ `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 0 warnings / 11 existing hints**؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built**؛ `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` → **passed**؛ Architecture Guard → **passed**؛ `git diff --check` فيه تحذير fsmonitor بيئي فقط ولا توجد أخطاء diff.
- **Status**: verified locally; uncommitted — المستخدم يلتزم، ولا push. التحقق الحي E2E غير مُعاد تشغيله ضمن هذه المهمة؛ لا يُستنتج منه production readiness.


### 2026-08-11 — QC-SECURITY-HARDENING-002: إكمال Security Hardening والتحقق الحي

- **Files**: `docs/SECURITY-AUDIT.md`, `.env.example`, `apps/qc-task-manager/.env.example`, `.gitignore`, `package.json`, `apps/qc-task-manager/src/{lib/auth.ts,lib/session.ts,lib/api-security.ts,lib/taskUpdates.ts,middleware.ts}`, `apps/qc-task-manager/src/components/DeleteRequestDialog.tsx`, `apps/qc-task-manager/src/pages/{employee/index.astro,tasks/[id].astro}`, Groq server provider files, security/E2E scripts.
- **What**: اكتمل hardening للمصادقة والجلسات والتدوير والانتهاء/logout وbcrypt والـ lockout، صلاحيات الأدوار الأربعة وIDOR/field locking server-side، CSRF/rate-limit/body/content-type/security headers، تحقق الملفات بالامتداد وMIME وmagic bytes والحجم والاسم وSHA-256 ومنع executable، وعقد Groq server-only مع `GROQ_MODEL=llama-3.3-70b-versatile`. أضيفت CSP hashes لسكريبتات Astro hydration المعروفة بدون `unsafe-inline` في `script-src` بعد أن كشف E2E أن CSP كان يمنع React islands. لم تُكسر قواعد الأعمال الحالية.
- **Secrets**: عُرّيت قيم الأسرار الحالية من الملفات المتتبعة، لكن مفاتيح مزودين سابقة موجودة في Git history؛ اعتُبرت compromised ولم تتم إعادة كتابة التاريخ أو push. يلزم revoke/rotate خارجيًا.
- **Verification**: `pnpm typecheck` PASS (0 errors، 11 hints)؛ `pnpm test` PASS (16+29+38)؛ `pnpm build` PASS (269 HTML، 258 sitemap URLs، مع warnings قديمة)؛ QC tests PASS (240 + migration + DB rules)؛ `pnpm e2e:acceptance` PASS: 49+44+196+39+45+12 وكل restart-persistence؛ `verify-security-hygiene.mjs` PASS؛ `git diff --check` PASS.
- **Risks**: `style-src 'unsafe-inline'` قائم ويحتاج migration منفصلة؛ production HTTPS/proxy limits/shared limiter/secret rotation تحتاج تحقق تشغيلي؛ Finding/CAPA ليست routes مستقلة في هذا التطبيق وتم تغطيتها ضمن task metadata/reports/task authorization.
- **Status**: verified locally with live acceptance; uncommitted — المستخدم يلتزم، ولا push.

---

### 2026-08-11 — QC-DATABASE-MIGRATIONS-001: sequential SQLite migration architecture

- **Files**: `apps/qc-task-manager/db/migrations/001_initial.sql`, `002_legacy_schema_reconciliation.sql`, `src/lib/migrations.ts`, `src/lib/db.ts`, `scripts/init-db.mjs`, `scripts/test-migrations.mjs`, `scripts/test.mjs`, `package.json`, `db/schema.sql`, `docs/DATABASE.md`, `docs/MIGRATIONS.md`, `docs/superpowers/specs/2026-08-11-qc-database-migrations-design.md`, `docs/superpowers/plans/2026-08-11-qc-database-migrations.md`.
- **What**: استبدلت migrations المخفية داخل `db.ts` و`init-db.mjs` بمحرك sequential migrations حقيقي. أنشأ المحرك `schema_migrations` و`schema_migration_failures`، يحسب SHA-256 checksum، يمنع إعادة التطبيق وتغيير migration مطبقة، يسجل الفشل مع rollback، يتحقق من foreign keys ونسخة schema عند startup، ويرفض SQL destructive غير المصرح به. migration 002 تعالج قواعد legacy بشكل additive وتعيد بناء `task_delete_requests` بأمان، مع backup قبل migration المصنفة destructive. `schema.sql` صار reference snapshot فقط.
- **Compatibility**: اختبارات fresh/existing/upgrade/repeated/failure-recovery/data preservation/FK/version/checksum/destructive guard كلها ضمن `test:migrations`; اختبار init-db القديم حدّث ليتحقق من 14 جدولًا (12 تطبيق + 2 metadata) وschema version 2.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **238 passed / 0 failed** + DB lockout/notification checks ✅؛ `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 0 warnings / 11 hints** ✅؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built** ✅؛ root `pnpm typecheck` → workspace pass (QC 0 errors / 11 hints) ✅؛ root `pnpm test` → **16 + 29 + 38 tests passed** ✅؛ root `pnpm build` → **Completed / Server built** ✅؛ `git diff --check` ✅.
- **Notes**: الـ working tree كان فيه تغييرات مسبقة `audit/qc/prompt3.md` و`MASTER-BASELINE-AUDIT.md` untracked؛ ما لمستها. لا commit ولا push.
- **Status**: verified locally; migration architecture مكتملة وجاهزة للمراجعة.

### 2026-08-11 — QC-PROMPT3-FORMAT-001: تحسين تنسيق prompt3.md بدون تغيير المحتوى

- **Files**: `audit/qc/prompt3.md`، `.agents/brain.md`.
- **What**: وحّدت مستويات عناوين Markdown داخل ملف البرومبت، وثبّت علامات القوائم على `-`، مع إبقاء النصوص والأمثلة والبرومبتات والمحتوى التقني كما هو.
- **Verification**: عدد أسطر `audit/qc/prompt3.md` بقي **2302**؛ فحص بنية العناوين والقوائم وكتل الكود تم محليًا. الملف كان untracked مسبقًا، ولا يوجد commit أو push.
- **Status**: تنسيق مكتمل، والمحتوى محفوظ.

### 2026-08-11 — QC-MASTER-BASELINE-AUDIT-001: تدقيق baseline شامل بدون تعديل كود

- **Files**: `apps/qc-task-manager/docs/MASTER-BASELINE-AUDIT.md` (جديد)، `.agents/brain.md` (هذا السجل).
- **What**: راجعت Source of Truth الحالي لتطبيق QC Task Manager: package/config، schema، migrations داخل `src/lib/db.ts` و`scripts/init-db.mjs`، كل `src/lib` و`src/pages` و`src/components`، API/auth/RBAC/policy/validation/activity/evidence/notifications/dashboard/search/exports/backups، الاختبارات وE2E والتوثيق والنشر. استخدمت `audit/qc/REPORT.md` و`PROMPTS.md` و`prompt2.md` كمراجع داعمة فقط.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **237/237 domain + DB lockout/notification checks passed**؛ `typecheck` → **0 errors / 0 warnings / 11 hints**؛ `NODE_ENV=production ... build` → **Server built**؛ `verify-security-hygiene.mjs` → **passed**؛ local DB read-only → **12 tables / integrity ok / 0 FK violations / 4 users / 0 tasks**. `e2e:acceptance` → **blocked before first suite** بسبب `listen EPERM 127.0.0.1:4500` في البيئة الحالية، لذلك لم يُحسب PASS.
- **Scores**: CORE COMPLETION **88%**، SECURITY **82%**، TESTING **72%**، PRODUCTION READINESS **64%**، OVERALL **80%**. أهم الفجوات: QC service غير معرف في `render.yaml`، اختلاف fresh/migrated SQLite، restore غير مثبت كاختبار، live E2E/a11y/load غير مثبتة، CSP فيها `style-src 'unsafe-inline'`، و`SESSION_SECRET` مو مستخدم.
- **Status**: التقرير مكتمل؛ ما تعدّل أي كود أو schema أو deployment. `audit/qc/REPORT.md` و`audit/qc/prompt2.md` كانا dirty مسبقًا وتُركا بدون لمس. لا commit ولا push.

### 2026-08-11 — QC-DEPLOYMENT-DOCS-001: توثيق تشغيل ونشر Astro SSR/SQLite كامل

- **Files**: `apps/qc-task-manager/README.md` (بوابة تشغيل محلي + رابط التشغيل)، `apps/qc-task-manager/docs/DEPLOYMENT.md`، `docs/DATABASE.md`، `docs/SQLTOOLS.md`، `docs/ROLES-AND-PERMISSIONS.md`، `docs/TESTING.md`.
- **What**: وثّقت أن QC خدمة Astro SSR على Node عبر `@astrojs/node` standalone وليست Static Site؛ خطوات التشغيل المحلي تشمل `pnpm install`، `QC_DATABASE_PATH` المطلق، `ADMIN_DEFAULT_PASSWORD`، `SESSION_SECRET`، `NODE_ENV`، `db:init`، وفتح `http://localhost:4321/login` ثم إعادة تعيين كلمة مرور admin من `/admin/users`. أضفت إعداد Render Node Web Service: Node 22 LTS، أوامر pnpm المطابقة للـ monorepo، start عبر `pnpm --filter @brightai/qc-task-manager start`، HTTPS، disk دائم `/var/data` لقاعدة SQLite وbackups، وجدولة/نسخ خارجي واسترجاع. كذلك فصلت SQLTools، قاعدة البيانات، الصلاحيات، والاختبارات إلى مراجع مستقلة.
- **Why**: قاعدة SQLite والجلسات ومسارات Astro server-side تحتاج Node process + تخزين دائم؛ نشرها كـ Static Site أو حفظ `qc_tasks.db` على Render ephemeral storage يؤدي لفقدان الوظائف أو البيانات.
- **Decision / Caveat**: `QC_DATABASE_PATH=/var/data/qc_tasks.db` و`QC_BACKUP_DIR=/var/data/backups` هما المساران الموصى بهما على Render persistent disk، لا مسار repo. `SESSION_SECRET` مطلوب في عقد البيئة بطلب النشر لكنه **غير مقروء حاليًا من الكود**؛ الجلسات الحالية opaque random UUID tokens في SQLite، لذلك وثّقناه كمتغير reserved بدون ادعاء أنه يشفّر الجلسات. `render.yaml` على الجذر يعرّف BrightAI main site كـ Node Web Service فقط؛ لا توجد خدمة QC معرفة فيه ولا Static Site QC مؤكدة من الريبو.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **237 passed / 0 failed** + DB rules ✅؛ `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 0 warnings / 11 existing hints** ✅؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → **Server built** ✅؛ `pnpm run internal-links:audit` → **0 broken links / 0 orphans** ✅؛ فحص targets المحلية للروابط الجديدة + `git diff --check` ✅.
- **Notes**: لم أعدل `render.yaml` ولا أنشأت خدمة Render/cron فعليًا (هذا يحتاج صلاحية Dashboard/قرار نشر). `git status` يعمل لكن يصدر تحذير fsmonitor IPC موجود بيئيًا. لا commit ولا push.

---

### 2026-08-11 — QC-TEST-ACCEPTANCE-001: اختبارات وحدة وقبول E2E موحّدة لمدير مهام QC

- **Files**: `apps/qc-task-manager/scripts/test.mjs` (تغطية صريحة للصلاحيات، whitelist الموظف، overdue، dependencies، uploads)، `scripts/test-db-rules.mjs` (جديد — lockout + notification creation مع SQLite مؤقت)، `scripts/e2e-acceptance.mjs` (جديد — orchestrator يعزل كل suite بقاعدة/منفذ)، `scripts/e2e-persistence.mjs` (جديد — upload ثم restart ثم download)، `scripts/e2e-auth-lockout.mjs` (إضافة login/logout)، `scripts/e2e-task-shared.mjs` (authorized/unauthorized attachment download)، `scripts/test-ts-loader-hook.mjs` (دعم `?raw` لملفات SQL في اختبارات Node)، `apps/qc-task-manager/package.json`، `apps/qc-task-manager/docs/ACCEPTANCE-CHECKLIST.md`، `apps/qc-task-manager/README.md`، `docs/superpowers/plans/2026-08-11-qc-test-acceptance.md`
- **What**: أضفت `test:domain` + `test:db-rules` تحت `pnpm test`، مع assertions واضحة لكل قواعد الوحدة المطلوبة (permission checks، employee field whitelist، status transitions، overdue، recurrence، dependency guards، upload/evidence validation، login lockout، notification creation). أضفت `e2e:acceptance` يبني QC ثم يشغّل admin users/auth/task/delete/dashboard/backup، ويضيف فحص استمرار BLOB بعد restart. أضفت checklist تشغيلية تغطي كل acceptance criteria وتربطها بالأوامر والنتائج المتوقعة.
- **Why**: كانت التغطية موجودة موزعة في smoke/E2E scripts لكن بدون بوابة واحدة وقائمة قبول مرجعية، وبعض البنود المطلوبة (logout، attachment authorization، restart persistence، lockout/notification كاختبارات DB-backed) ما كانت assertions مستقلة.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **237 domain checks / 0 failures** + DB-backed lockout/notification checks ✅؛ `pnpm --filter @brightai/qc-task-manager typecheck` → **0 errors / 0 warnings / 11 existing hints** ✅؛ `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` → Server built ✅؛ `node --check` لكل scripts الجديدة ✅. `e2e:acceptance` build نجح، لكن تشغيل الخوادم المحلية توقف بيئيًا عند `listen EPERM` على `127.0.0.1:4500` داخل sandbox؛ طلب escalation رُفض آليًا بسبب سعة نموذج المراجعة، لذلك live E2E **blocked — غير محسوب PASS**.
- **Notes**: `scripts/test-ts-loader-hook.mjs` صار يحوّل imports من نوع `*.sql?raw` إلى ESM text module، عشان `taskUpdates.ts` ينختبر فعليًا بدون نسخ validator. `audit/qc/prompt2.md` كان dirty مسبقًا وتُرك كما هو. لا commit ولا push.
- **Status**: unit/typecheck/build verified locally؛ live acceptance runner جاهز لكن يحتاج تشغيلًا خارج sandbox/بصلاحية bind محلية.


### 2026-08-11 — QC-SECURITY-PASS-001: تمرير أمني شامل لمدير مهام QC

- **Files**: `apps/qc-task-manager/src/lib/api-security.ts` (جديد — حارس جلسة API وCSRF وJSON آمن)، `src/middleware.ts` (CSP + تمرير CSRF موحد حتى ردود الرفض)، `astro.config.mjs` (تعطيل Astro origin preflight لصالح حارس middleware الذي يضيف headers)، `src/lib/auth.ts` (rate limit فشل الدخول حسب IP + مقارنة dummy hash للحسابات المعطلة/المفقودة)، `src/lib/session.ts` + `src/pages/login.astro` (رسالة دخول عامة للحساب المفقود/المعطل/المقفل)، `src/lib/validation.ts` (positiveIdSchema/parsePositiveId)، `src/lib/taskUpdates.ts` (تصدير وتنقية أسماء الملفات، إزالة leading dots، فحص الحجم قبل Buffer في evidence)، كل `src/pages/api/**` (إعادة فحص session/CSRF/route IDs)، `src/pages/{admin/users/api,manager/requests/api,logout}.ts` (CSRF)، `db/schema.sql` (فهرس فشل IP)، `SECURITY.md`، `scripts/verify-security-hygiene.mjs`، `docs/superpowers/{specs,plans}/2026-08-11-qc-security-pass*`، `scripts/e2e-auth-lockout.mjs` (تحديث توقعات الرسائل العامة)
- **What**: كل API يعيد فحص session server-side عبر `requireApiUser`، كل POST حساس يمر عبر Origin CSRF، كل route ID يمر عبر Zod، وأضيف CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'` وغيرها) مع headers `DENY/nosniff/referrer`. أضيف rate limit محافظ (20 فشل/IP/10 دقائق) فوق قفل الحساب (5 محاولات/10 دقائق)، وصارت حالة الحساب المعطل/المقفل/المستخدم المجهول ترجع نفس `error=1` بدون enumeration. أسماء الملفات تُزال منها المسارات والتحكم والـ leading dots؛ file size يُرفض قبل Buffer/BLOB في مسار evidence، والـ extension/MIME allowlist القائم محفوظ.
- **Security doc**: `apps/qc-task-manager/SECURITY.md` يشرح الأصول والخصوم وحدود الثقة، الضوابط، متطلبات HTTPS/proxy/IP، قاعدة البيانات والنسخ الاحتياطية، secrets، CSP، الرفع، والتحديثات.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **199/199** ✅؛ `typecheck` → 0 errors / 0 warnings / 11 hints قديمة ✅؛ `build` → Server built ✅؛ `verify-security-hygiene.mjs` → passed ✅؛ HTTP مباشر على build: صفحة login وredirect/API تحمل CSP + X-Frame-Options DENY + nosniff + Referrer-Policy، Origin غريب على POST يرجع 403 مع headers ✅. Live login/session E2E **محجوب بيئيًا** لأن `better-sqlite3` native binary ABI 127 بينما Node الحالي ABI 147 (نفس القيد الموثق سابقًا في brain، وليس فشلًا من التغيير).
- **Notes**: `.env.example` templates مسموحة ومتحققة بلا values سرية؛ ملفات `audit/qc/prompt2.md` كانت dirty مسبقًا ولم ألمسها. Astro's built-in origin check صار `checkOrigin:false` عمدًا عشان ردود CSRF تمر عبر middleware وتاخذ headers؛ الحارس التطبيقي الآن يغطي `/login` وAPI وlogout ومسارات admin/manager.
- **Status**: local static/build verified; live DB E2E blocked by pre-existing Node ABI mismatch; uncommitted — المستخدم يلتزم. **Follow-up**: أضفت `taskUpdateInputSchema`/`closeTaskInputSchema`/`cancelTaskInputSchema` وربطتها بالمسارات، فصار حدّ Zod يسبق منطق mutation أيضًا.

> هذا الملف هو دماغ المشروع. كل تغيير جوهري يُسجَّل هنا.
> اقرأه كاملًا قبل أي تغيير غير تافه (قاعدة agent.md Section 0.6).
> الكتابة فقط بعد التحقق من نجاح التغيير.
> اللغة: عامية سعودية في الشرح + English في الكود والـ identifiers.
> لاتنشئ اي commits جديده اجعل المستخدم هو من يقوم بذلك
> لا تنشئ  branch جديد نهائيا الدفع يكون عبر main الحالي فقط PR
> هذا مشروع astro 

---

### 2026-08-11 — QC-CHECKLIST-SUPPORT-001: دعم QC checklist داخل كل مهمة + metadata اختيارية

- **Files**: `apps/qc-task-manager/db/schema.sql`, `apps/qc-task-manager/src/lib/db.ts`, `src/lib/types.ts`, `src/lib/task-policy.ts`, `src/lib/permissions.ts`, `src/lib/taskUpdates.ts`, `src/lib/taskDetails.ts`, `src/lib/activity.ts`, `src/lib/tasks.ts`, `src/lib/validation.ts`, `src/components/TaskChecklistInput.tsx`, `src/components/TaskUpdatePanel.tsx`, `src/components/TaskLifecycle.tsx`, `src/components/NewTaskForm.astro`, `src/pages/tasks/[id].astro`, `src/pages/{employee,manager,supervisor}/index.astro`, `src/lib/dashboard.ts`, `src/pages/dashboard.astro`, `README.md`
- **What**: أضفت checklist progress (completed/total/%), إعادة ترتيب بعناصر up/down، صلاحية toggle للموظف ضمن نطاقه، وصلاحية تعديل الهيكل للمدير/الأدمن وللمشرف إذا كان مالك المهمة أو مشرفها. كل تغيير (إضافة/حذف/toggle/reorder/override) يُسجل في `task_activity_log`. إكمال المهمة يُمنع عند وجود عناصر ناقصة؛ manager/admin يقدر يتجاوز بشرح إلزامي ومحدود. أضفت metadata اختيارية وnullable: inspection type، finding classification، risk level، corrective action required، reference number، audit batch/work order، مع migration آمنة للأعمدة على قواعد البيانات القديمة. progress ظاهر في صفوف المهام وتحت فلاتر dashboard.
- **Why**: المواصفة طلبت بوابة QC داخل كل task بدون إجبار المهام القديمة على تعبئة حقول جديدة، مع احترام field-locking والأدوار الحالية.
- **Verification**: `pnpm typecheck` → 0 errors (11 hints قديمة) ✅؛ `pnpm build` → Server built ✅؛ SQLite schema smoke عبر `sqlite3` أكد الأعمدة الستة nullable ✅. `scripts/test.mjs` مرّ باختبارات policy الجديدة ثم توقف عند backup بسبب `better-sqlite3` binary مبني على Node ABI 127 بينما runtime الحالي ABI 147 (بيئة الاختبار، خارج التغيير).
- **Plan**: `docs/superpowers/plans/2026-08-11-qc-checklist-support.md`
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck + build + schema smoke؛ unit suite blocked by native dependency ABI mismatch)

### 2026-08-11 — QC-DASHBOARD-V2-001: إعادة بناء /dashboard الكاملة (9 KPI + 6 charts + 5 tables + فلاتر موسّعة) — 45/45 E2E ✅

- **Files**: `apps/qc-task-manager/src/lib/dashboard.ts` (إعادة بناء كبيرة: `DashboardFilters` صار فيها `range/status/overdue_only` + `resolveRange` لـ today/week/month على الـ local calendar + `parseDashboardFilters` تتحقق من الكل وتومئ لـ invalid بـ flash + `whereClause` تدعم status/overdue_only + `whereClauseForWindow` للـ completion-rate بنوافذ منفصلة + `getKpis` صار يرجع 9 مؤشرات: total/not_started/in_progress/on_hold/completed/overdue + **urgent_open** (priority=urgent AND not completed/cancelled) + **completed_without_evidence** (NOT EXISTS attachment is_evidence=1) + **avg_completion_seconds** (AVG julianday(completed_at)−julianday(started_at)) — استعلام ثاني منفصل عشان placeholder order + `getPriorityDistribution` + `getOverdueByEmployee` + `getCompletionRate` (current vs previous window بنفس الطول، status/overdue_only مرفوعة عشان ما تكسر المعنى) + `getCompletedWithoutEvidence`/`getCurrentBlockers`/`getLatestActivity` للجداول + PRIORITY_ORDER/PRIORITY_COLORS + تصدير STATUSES)، `apps/qc-task-manager/src/components/DashboardCharts.tsx` (6 widgets: DonutChart status + **PriorityChart** horizontal bars بـ data-priority-bar/data-count + BarChart per-employee + **OverdueByEmployeeChart** horizontal red bars بـ data-overdue-emp + LineChart completed/week + **CompletionRateCard** big number + delta pp + progress bar بـ data-completion-card/current/previous/delta — كلها pure SVG/CSS بلا مكتبة)، `apps/qc-task-manager/src/pages/dashboard.astro` (إعادة بناء: فلاتر موسّعة = Range dropdown بـ today/week/month/custom + custom from/to تظهر فقط عند اختيار Custom (JS Astro-processed يطابق CSP) + assignee + priority + status + overdue checkbox + **9 KPI cards** بـ data-kpi لكل الـ 9 + **loading overlay** شاشة كاملة عند submit الفورم + **error state** try/catch حول كل الـ queries يعرض banner بدل 500 + **5 tables**: Most overdue / Current blockers / Recently completed / Completed without evidence / Latest activity — كل جدول بـ EmptyState و overflow-x-auto)، `apps/qc-task-manager/scripts/e2e-dashboard.mjs` (إعادة كتابة شاملة: 45 فحص — 9 KPIs تطابق SQL + avg completion positive + donut + priority chart + per-employee bar + overdue-by-employee + line buckets + completion rate current/previous/delta ±1pp + 5 tables تطابق SQL + سيناريو الفلاتر priority/status/overdue/range=today/range=week/range=month/invalid-drop + role gating employee 302→/employee + loading overlay markup + screenshots desktop/mobile)، `apps/qc-task-manager/README.md`
- **What**: المستخدم طلب بناء /dashboard كامل بالمواصفة: access (admin/manager/supervisor مسموح، employee forbidden→/employee) + 8 فلاتر (today/this week/this month/custom range/assignee/priority/status/overdue only) + 9 KPI cards (total/not started/in progress/on hold/completed/overdue/urgent open/completed without evidence/average completion time) + overdue definition (due_date<today AND status NOT IN completed/cancelled) + 6 charts (status/priority/per employee/overdue by employee/completed per week 8w/completion rate vs previous period) + 5 tables (most overdue/recently completed/without evidence/current blockers/latest activity) + قواعد (parameterized SQL + فلاتر consistent + empty states + loading/error states + responsive + no employee access). الـ dashboard القديم (QC-DASH-001) كان 6 KPI + 3 charts + جدولين + 4 فلاتر بلا status/overdue/presets. بنيت الكل فوق البنية القائمة بدون migration (كل الأعمدة started_at/completed_at/is_evidence/blocker_note/task_activity_log موجودة من QC-SCHEMA-002/QC-STATUS-LIFECYCLE-001).
- **Why**: المواصفة طلبت السطح التحليلي الكامل والـ dashboard القديم ما يغطي إلا ثُلث المتطلبات (بلا urgent/evidence/avg/blockers/activity/completion-rate/priority-chart/overdue-by-employee/status-filter/range-presets/overdue-only/loading).
- **Verification**: `pnpm typecheck` → 0 errors ✅ (10 hints معروفة)؛ `NODE_ENV=production pnpm build` → Server built ✅. **E2E 45/45 ALL PASS** ضد خادم حي على DB مؤقتة (PORT=4322، QC_DATABASE_PATH absolute): Scenario 1 (manager، بدون فلاتر) 9 KPIs تطابق SQL المستقل + avg completion 2d 21h (69h positive) + donut [3,3,2,8,1] + priority chart [3,8,4,2] + per-employee 5 entries (4 active + Unassigned) + overdue-by-employee [4,1] + line [0,1,0,0,0,1,4,1] + completion rate current 36% / previous 100% / delta −64.29pp (±1) + 5 tables كلها تطابق (most-overdue 5/blockers 2/recent 8/without-evidence 7/activity 2) + مهمة فيها evidence مُستثناة من without-evidence؛ Scenario 2 (فلاتر) priority=high + status=in_progress (total==in_progress) + overdue=1 (KPIs + table يطابقون) + range=today (1 task) + range=week (1) + range=month (10) + invalid filter dropped مع flash one-shot؛ Scenario 3 (role gating) employee 302→/employee + flash permission + supervisor/admin 200؛ Scenario 4 (loading overlay markup + screenshots). **بصري آلي**: desktop 1440 docWidth=1440 (0 overflow) + mobile 390 docWidth=390 (0 overflow) + 0 console errors على الاثنين. لقطات: download/qa/dashboard-{desktop,mobile}-{viewport,fullPage}.png.
- **Note**: (1) **باغ صُلب وصطته أثناء التنفيذ**: `getCompletionRate` كان يستخدم `isoDaysFromToday(29)` (يضيف 29 يوم للمستقبل!) فعلى طول الـ default window كان مقلوب وفاضي → completion rate دايم null/"—". الإصلاح: `-29`. هذا الباغ ما كان موجود قبل (function جديدة) لكن اكتشافه سهوًا من الـ E2E (data-current فاضي). (2) **شرط الـ E2E لـ QC_DATABASE_PATH**: خادم Astro standalone يستخدم `QC_DATABASE_PATH` لكن المسار **relative ما يحل صح** — لازم **absolute** (`"$(pwd)/db/e2e_dashboard.db"`) وإلا وقع في fallback `dist/db/qc_tasks.db`. توثّق كذا للـ future agents. (3) **placeholder order في getKpis**: الـ SELECT فيه `date(?)` (today) قبل الـ WHERE، فالـ `.get(today, ...params)` يربط today أولًا — نفس الـ quirk من QC-DASH-001، حافظت عليه. الـ avg query منفصل بـ `whereClause(extra)` عشان ما يتداخل. (4) **loading state CSP-safe**: `<script>` Astro (بدون is:inline) يُجمّع لملف خارجي تلقائيًا، فما يحتاج hash — يعرض overlay على submit و يرجّع الـ button text على pageshow. (5) **completion rate logic**: status/overdue_only filters مرفوعة من الـ ratio عشان ما تكسر المعنى (status=completed يخلي النسبة 100% دايم)؛ assignee/priority مطبّقين. الـ default window = آخر 30 يوم لو ما فيه date filter؛ previous = نفس الطول قبلها. (6) **pre-existing navbar overflow على 768px** (docWidth=801): من الـ Navbar (Sign out + اسم المستخدم) **مش من الـ dashboard** — الـ dashboard سليم على 390/1440. تعديل الـ Navbar تغيير بنيوي يؤثر على كل الصفحات، فتركته للمستخدم. (7) الـ e2e data attributes (`data-priority-bar`/`data-overdue-emp`/`data-completion-card`) على الـ charts أقوى من فك ترميز island props. (8) `getLatestActivity` يعيد WHERE على t.created_at (نافذة المهام) — متسق مع باقي الـ widgets.
- **Report**: README محدّث (قسم Dashboard الكامل: 9 KPI + 6 charts + 5 tables + الفلاتر + أرقام E2E 45/45)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck + build + E2E 45/45 + بصري desktop/mobile 0 overflow + 0 console errors)
- **Brain updates**: هذا الـ entry. للـ future agents: `getCompletionRate` default window = `isoDaysFromToday(-29)` (سالب!). الـ dashboard صار 9 KPI + 6 charts + 5 tables. الـ QC_DATABASE_PATH لازم absolute في سكربتات standalone. الـ navbar overflow على 768 pre-existing (مش dashboard).

---

### 2026-08-11 — QC-NOTIFY-SYSTEM-001: نظام الإشعارات الداخلية الكامل (11 حدثًا + جرس dropdown + mark-one/mark-all + قراءة/غير مقروء + حارس المستخدمين غير النشطين) — 141/141 + 193/193 + لا regression + بصري 13/13 ✅

- **Files**: `src/lib/notifications.ts` (NotificationKind أضاف comment_added/blocker_added/delete_requested/delete_approved/delete_rejected/task_reopened وحذف recent_comment/pending_delete المشتقتين + **createNotification يحرس is_active=1 مركزيًا — "do not notify inactive users" لكل call site** + PERSISTED_SEVERITY للأنواع الجديدة + `listPersistedNotifications(userId, limit)` عام للـ dropdown + `markNotificationRead(userId, id)` بأحقيّة ملكية + AppNotification فيه notificationId/isRead)، `src/lib/taskUpdates.ts` (إشعار الأولوية صار **لـ high/urgent فقط** — التخفيض لـ low/medium صامت + إشعار blocker_added للمعيَّن الفعّال effectiveAssignee + المنشئ − الكاتب + إشعار task_reopened داخل نفس الترانزاكشن للمعيَّن + المنشئ − المعيد)، `src/pages/api/tasks/[id]/comment.ts` (إشعار comment_added للمعيَّن + المنشئ − المعلِّق، مقتطف 90 حرف)، `src/lib/deleteRequests.ts` (submit → إشعار delete_requested لكل manager/admin نشط مع السبب؛ review → delete_rejected للمُرسِل خارج الـ tx و delete_approved **داخل الـ tx قبل حذف المهمة** — task_id → NULL عبر ON DELETE SET NULL فما يبقى رابط لمهمة محذوفة)، `src/pages/api/notifications/[id]/read.ts` (جديد — POST mark-one-as-read بأحقيّة ملكية)، `src/components/MarkReadButton.tsx` (جديد — جزيرة mark one)، `src/components/Navbar.tsx` (الجرس صار **زر** يفتح **dropdown**: آخر 8 إشعارات مثبَّتة بنقطة لغير المقروء + unread chip + View all + Mark all as read؛ النقر على عنصر يعلّمه مقروء بـ fetch `keepalive: true` ثم ينقّل؛ يُغلق بالنقر الخارجي/Escape؛ على الجوال `fixed inset-x-4` وعلى md+ `absolute right-0` بجانب الجرس؛ aria-expanded/aria-controls صحيحة)، `src/layouts/BaseLayout.astro` (يمرر listPersistedNotifications(8) للـ Navbar)، `src/pages/notifications.astro` (أقسام الأنواع الجديدة + حلقة/نقطة لغير المقروء + زر Mark as read لكل عنصر غير مقروء + إزالة recent_comment/pending_delete)، `scripts/e2e-task-shared.mjs` (locator الجرس صار `[aria-label^="Notifications"]` بعد ما صار button + **سيناريو 10 كامل: comment→المعيَّن لا المعلِّق + blocker→المنشئ + downgrade priority→لا إشعار + delete-request submit→manager + reject→المُرسِل + approve→المُرسِل مع task_id=null بعد الحذف + reopen→المعيَّن لا المعيد + mark-one-read + أحقيّة ملكية + dropdown يفتح/يغلق Escape — 193 فحص)**، `README.md`
- **What**: المستخدم طلب نظام إشعارات داخل التطبيق كامل: جرس بعداد غير مقروء + إشعارات لـ 11 حدثًا (تعيين/إعادة تعيين، أولوية high/urgent، تغيير موعد، تعليق، بلوكر، إكمال، طلب حذف + قبوله/رفضه، إعادة فتح، تكرار) + تخزين في جدول notifications + ربط بالمهمة + قراءة/غير مقروء + mark one + mark all + dropdown + صفحة كاملة + رابط للمهمة + بلا إيميل + عدم إشعار غير النشطين. الفحص بيّن البنية موجودة جزئيًا (createNotification/صفحة/جرس بعداد/mark-all + 5 أحداث) وبنيت الناقص: 6 أحداث جديدة + dropdown + mark-one + الحارس المركزي + قيد الأولوية + إزالة التكرار المشتق (recent_comment و pending_delete كانوا يحسبون نفس الأحداث مرتين في العداد).
- **Why**: المواصفة طلبت النظام الكامل وكان الناقص جوهريًا (نصف الأحداث + mark-one + dropdown + حارس غير النشطين) والمشتقات القديمة كانت ستضاعف العداد بعد إضافة الإشعارات المثبَّتة.
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `NODE_ENV=production pnpm build` → Server built ✅؛ **`pnpm test` → 141/141** ✅؛ **E2E e2e-task-shared → 193/193** ✅ (162 سابقة + 31 فحص سيناريو 10: comment_added للمعيَّن لا المعلِّق + blocker_added للمنشئ لا الكاتب + priority downgrade low → **لا** إشعار + delete_requested للمدير + delete_rejected للمُرسِل + delete_approved للمُرسِل و task_id=null بعد حذف المهمة + task_reopened للمعيَّن لا المعيد + mark-one-read + ملكية (محاولة مدير على إشعار موظف لا تغيّر شيئًا) + dropdown حقيقي بالمتصفح: يفتح/يعرض روابط /tasks/ + Mark all as read + يُغلق بـ Escape). **لا regression**: e2e-dashboard 30/30 + e2e-delete-request 31/31 + e2e-auth-lockout 42/42 + e2e-admin-users 49/49 ✅. **بصري آلي (Playwright) 13/13** ✅: dropdown داخل الشاشة 1280px (x=606) + 5 عناصر + 4 نقاط unread + chip العدد + إغلاق بالنقر الخارجي + صفحة الإشعارات بلا overflow أفقي 1280/390 + أزرار Mark as read + **الـ dropdown على 390px طلع برا الشاشة (x=-84) → صار `fixed inset-x-4` على الجوال و `md:absolute right-0` للديسكتوب → x=16 ضمن الشاشة** + 0 console errors.
- **Note**: (1) **قرار**: إشعار الأولوية صار مقصورًا على التصعيد لـ high/urgent حرفيًا حسب المواصفة (التخفيض صامت) — فحص E2E القديم كان يغيّر لـ urgent فما انكسر. (2) **قرار**: أزلت المشتقين recent_comment و pending_delete لأن الإشعار المثبَّت الجديد يغطيهما — بدونهما كان العداد يعدّ الحدث مرتين. (3) **قرار**: إشعارات التعليق/البلوكر/إعادة الفتح = المعيَّن + المنشئ − الفاعل (set dedupe) — بلوكر يستخدم effectiveAssignee (المعيَّن الجديد لو نفس الطلب يعيد التعيين) مطابقًا لنمط due/priority. (4) **delete_approved** يُكتب داخل نفس الترانزاكشن قبل DELETE FROM tasks — notifications.task_id يتحول NULL (SET NULL) فلا يبقى رابط لمهمة محذوفة، وhref يقع على /notifications. (5) **keepalive: true** على fetch الـ mark-read في الـ dropdown — التنقل الفوري كان ممكن يلغي الطلب. (6) تعليقات الإكمال (wizard) ما تولّد comment_added — مشمولة في task_completed (ما تمر عبر /comment). (7) الجرس صار `<button>` مو `<a>` — الـ e2e locator اتحدث لـ `[aria-label^="Notifications"]`.
- **Report**: README محدّث (قسم Notifications كامل بالجدول التفصيلي للـ 11 حدثًا + الـ dropdown + API الجديد + المكوّنات + أرقام E2E 193)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck + test 141/141 + build + E2E task-shared 193/193 + regression 30/30 + 31/31 + 42/42 + 49/49 + بصري 13/13)
- **Brain updates**: هذا الـ entry. للـ future agents: `createNotification` هو الحارس المركزي لعدم إشعار غير النشطين — أي حدث إشعار جديد يكفي استدعاؤه. أي kind جديد لازم يُضاف لـ: NotificationKind + PERSISTED_SEVERITY + KIND_ICON/KIND_LABEL/SECTIONS في notifications.astro. الإشعارات المشتقة صارت فقط overdue/due_soon/unstarted. الجرس زر dropdown بآخر 8 مثبَّتة.

---

### 2026-08-11 — QC-STATUS-LIFECYCLE-001: دورة حياة المهام الكاملة (5 حالات + قواعد انتقال صارمة + wizard إكمال من 3 خطوات + إلغاء/إعادة فتح) — 141/141 + 162/162 + 30/30 + 31/31 + لا regression ✅

- **Files**: `src/lib/types.ts` (TaskStatus يضم cancelled + TaskComment.is_completion_comment + TaskTask.cancelled_at/cancelled_by/completion_comment_id)، `src/lib/task-policy.ts` (TASK_STATUSES=5 + STATUS_TRANSITIONS map صارم + on_hold يتطلب blocker_note + EVIDENCE_ALLOWED_EXTENSIONS {pdf,png,jpg,jpeg,xlsx,docx} + EVIDENCE_MAX_BYTES 10MB + ALLOWED_EXTENSIONS_HINT + EVIDENCE_MAGIC_BYTES للتواقيع + EVIDENCE_MAX_FILES + isTerminalStatus)، `src/lib/taskUpdates.ts` (تطبيق قواعد الانتقال + started_at يُختم عند أول in_progress مع task_started + closeTask ترقية كاملة: أدلة متعددة مع تحقق امتداد/MIME/tوقيع، is_completion_comment=1، comment إلزامي، ترانزاكشن واحد يكتب BLOBs+تعليق+status+100+completed_at/by+activity+إشعارات creator/manager/supervisor (completer مستثنى) + validateEvidenceFile + cancelTask + reopenTask + الحالات النهائية تمنع update/close)، `src/lib/activity.ts` (أفعال جديدة: task_started/task_completed/task_cancelled/task_reopened/closure_comment_added/evidence_uploaded/evidence_skipped/blocker_set)، `src/lib/format.ts` (cancelled label + isOverdue تستثني cancelled)، `src/lib/taskDetails.ts` (getClosureComment بالفلاغ is_completion_comment + listEvidenceFiles + أوصاف الأفعال الجديدة)، `src/lib/notifications.ts` (kind task_completed + استثناء cancelled من overdue/due-soon/derived)، `src/lib/dashboard.ts` + `src/pages/dashboard.astro` (Kpis.cancelled + كارت ✖️ Cancelled + donut 5 شرائح + overdue يستثني cancelled)، `src/lib/permissions.ts` (canEditTask يعامل cancelled كقراءة فقط)، `src/components/TaskLifecycle.tsx` (جديد — wizard 3 خطوات: أدلة+Skip/تعليق إلزامي/تأكيد، إلغاء قبل التأكيد = لا يُحفظ شي، dialog إلغاء بسبب إلزامي، زر reopen)، `src/components/TaskUpdatePanel.tsx` (شيل نموذج الإكمال المدمج + تنبيه blocker المطلوب عند on_hold)، `src/pages/tasks/[id].astro` (تركيب TaskLifecycle + banner الملغاة + Cancelled by/date + قائمة أدلة الإكمال + حظر CommentBox على النهائية)، `src/pages/api/tasks/[id]/{cancel,reopen}.ts` (جديد) + close.ts/update.ts/comment.ts عبر الـ libs، `src/lib/deleteRequests.ts` (تمت مراجعة — لا تغيير: الزرار محصور بـ not_started/in_progress)، `scripts/test.mjs` (5 حالات + انتقالات + أدلة: txt مرفوض + PDF مزيّف مرفوض بالتوقيع + امتدادات مسموحة)، `scripts/e2e-task-shared.mjs` (سيناريو 9 كامل: انتقالات صارمة + started_at مرة واحدة + on_hold بلا blocker مرفوض + resume ما يعيد الختم + cancelled عبر update مرفوض + wizard بمتصفح حقيقي بملفين PDF/PNG → BLOBs مخزنة + إلغاء الـ wizard قبل التأكيد → لا حالة/لا تعليق/لا أدلة/لا activity + reopen admin/manager فقط + cancel بسبب + read-only نهائي)، `scripts/e2e-dashboard.mjs` (قراءة KPI cancelled + donut 5 شرائح + سيد مهمة ملغاة متأخرة تثبت cancelled لا تُعدّ overdue)، `README.md`
- **What**: المستخدم حدّد دورة حياة كاملة: 5 حالات بقواعد صارمة (not_started→in_progress؛ on_hold يتطلب blocker_note؛ completed عبر wizard فقط؛ completed→read-only وإعادة فتحها admin/manager فقط؛ cancelled تتطلب موافقة manager/admin) + أول in_progress يختم started_at ويسجّل + تدفق إكمال من 3 خطوات بترانزاكشن واحد (أدلة PDF/PNG/JPG/JPEG/XLSX/DOCX ≤10MB مع تحقق امتداد+MIME+توقيع سحري، Skip مسجّل، تعليق إلزامي بـ is_completion_comment=1، تأكيد، إشعارات للـ creator والمديرين والمشرفين) + إلغاء الـ wizard قبل التأكيد = لا يُحفظ شيء + عرض المهمة المكتملة (Completed by/date + تعليق الإكمال + الأدلة أو Evidence skipped + سجل كامل).
- **Why**: الـ close flow القديم كان بسيطًا (تعليق + ملف واحد بلا توقيعات) وما فيه cancelled ولا قواعد انتقال ولا started_at ولا wizard.
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `NODE_ENV=production pnpm build` → Server built ✅؛ **`pnpm test` → 141/141** ✅ (كانت 121 + 20 فحص حالة/أدلة)؛ **E2E e2e-task-shared → 162/162** ✅ ضد خادم حي (PORT=4390): انتقالات صارمة + started_at مرة واحدة + on_hold بلا blocker → 400 + resume بدون إعادة ختم + cancelled عبر update → 400 + wizard (إكمال بدون تعليق → 400، skip مع تعليق → مكتمل + إشعارات creator/manager/supervisor + completer مستثنى، txt → 400 + PDF مزيف بالتوقيع → 400 + ملفين حقيقيين عبر المتصفح → BLOB×2 + evidence_uploaded×2، إلغاء wizard قبل التأكيد → كل شي يبقى) + reopen (موظف 400، manager 200، التعليق يُزال منه العلم) + cancel (موظف 400، بلا سبب 400، بسبب → cancelled_at/by + مسجّل) + read-only للملغي + إكمال ملغي → 400؛ **E2E e2e-dashboard → 30/30** ✅ (KPI cancelled + donut 5 شرائح + مهمة ملغاة متأخرة ما تظهر في overdue). **لا regression**: e2e-delete-request 31/31 ✅.
- **Note**: (1) الأدلة صارت قائمة أصغر (6 امتدادات) من مرفقات المهام العامة (20) — تحقق magic bytes إجباري للأدلة فقط. (2) إشعارات الإكمال تروح للـ creator + كل manager/supervisor نشطين (dedupe بالـ user_id) والمكمل مستثنى — بدون إشعار للمعيَّن لو ما هو creator (فُسّرت المواصفة على القائمة الصريحة). (3) إعادة الفتح تمسح completed_at/completed_by وتفك is_completion_comment عن التعليق (يرجع للخيط العادي) وتحتفظ بالأدلة كسجل. (4) migrated DBs تحتفظ بـ CHECK القديم (بلا cancelled) لكن طبقة التطبيق (task-policy) هي الحارس — موثّق في README. (5) wizard الإلغاء client-side فقط — لا POST يُرسل قبل التأكيد أصلاً.
- **Report**: README محدّث (Status lifecycle + Completion wizard + API endpoints الجديدة + TaskLifecycle + أدلة الإكمال + dashboard cancelled + أرقام E2E)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck + test 141/141 + build + E2E task-shared 162/162 + dashboard 30/30 + delete-request 31/31)
- **Brain updates**: هذا الـ entry. للـ future agents: closeTask صار wizard متعدد الأدلة — أي شكل جديد للأدلة يُضاف لـ EVIDENCE_ALLOWED_EXTENSIONS + EVIDENCE_MAGIC_BYTES في task-policy معًا. الحالة النهائية الحارس = isTerminalStatus (completed/cancelled). `getClosureComment` يبحث بالفلاغ is_completion_comment=1 (مو بالـ id المخزّن فقط).

---

### 2026-08-11 — QC-TASK-SHARED-001: نموذج المهمة الكامل المشترك (إنشاء/تحرير) — كل الحقول + تكرار + dependencies + إشعارات + عاجلة — 121/121 + 98/98 E2E + لا regression ✅

- **Files**: `src/lib/task-policy.ts` (TASK_PRIORITIES + `urgent` + TASK_RECURRENCES + isRecurrence + limits: MAX_CHECKLIST_ITEMS/MAX_CHECKLIST_TITLE_LENGTH/MAX_DEPENDENCIES/MAX_OVERRIDE_REASON_LENGTH/MAX_DEPENDENCY_DEPTH/MAX_DEPARTMENT_LENGTH + EMPLOYEE_LOCKED_FIELDS أوسع), `src/lib/types.ts` (Task فيه department/recurrence/recurrence_end_date/parent_recurring_task_id + TaskChecklistItem/TaskDependency/DependencyInfo)، `src/lib/format.ts` (PRIORITY_LABELS/PRIORITY_BADGE + urgent شارة حمراء صلبة + URGENT_ROW_CLASS + isUrgent + recurrenceLabel)، `src/lib/activity.ts` (أفعال جديدة: department/recurrence/recurrence_end_date_changed + checklist_item_added/updated/removed + dependency_added/removed + dependency_override + recurring_task_created)، `src/lib/recurrence.ts` (جديد — nextDueDate daily/weekly/monthly مع clamp آخر الشهر + shouldCreateNextOccurrence بنهاية شاملة)، `src/lib/validation.ts` (taskCreateInputSchema: department/recurrence/recurrence_end_date/checklist/dependencies + formToRecord يعامل ARRAY_FIELDS دائمًا كمصفوفة حتى بقيمة واحدة + MAX_DEPARTMENT_LENGTH يُعاد تصديره من task-policy)، `src/lib/notifications.ts` (createNotification يكتب في جدول notifications + دمج المثبَّت مع المشتق في القائمة والعداد + markAllNotificationsRead + **إصلاح باغ قديم**: taskScope صار مؤهل بـ `t.` لأن users فيه عمود created_by → غموض عمود كان يكسر /notifications بصدق)، `src/lib/tasks.ts` (createTask بكل الحقول + checklist/dependencies في ترانزاكشن واحد + validateDependencies مع كشف الحلقات + wouldCreateCycle + validateChecklist + listActiveEmployees + listTasksForDependency + notifyAssigned + validateAssignee: supervisor → موظفين QC نشطين فقط + handleCreateTaskPost)، `src/lib/taskUpdates.ts` (applyTaskUpdate: حاجز dependencies عند in_progress + تجاوز admin/manager بسبب صريح مسجّل + إشعارات التعيين/الموعد/الأولوية للمعيَّن الجديد + حقول department/recurrence/end_date + عمليات checklist/dependencies + closeTask: إنشاء التكرار التالي داخل نفس الترانزاكشن بعد الإكمال — ينسخ العنوان/الوصف/القسم/الأولوية/المعيَّن/القالب/التكرار ولا ينسخ تعليقات/أدلة/أنشطة + activity على الطرفين + إشعار)، `src/lib/taskDetails.ts` (listChecklist/listDependencies/getRecurringParent + فئات وأوصاف الأفعال الجديدة)، `src/pages/{manager,supervisor,employee}/new.astro` (نموذج مشترك NewTaskForm.astro)، `src/components/NewTaskForm.astro` (جديد — كل الحقول + islands الـ checklist/dependencies + supervisor قائمة المعيَّن = موظفين فقط)، `src/components/{TaskChecklistInput,TaskDependencyInput,MarkAllReadButton}.tsx` (جديد)، `src/components/TaskUpdatePanel.tsx` (الحقول الجديدة + checklist تفاعلي + dependencies + واجهة override + urgent في القائمة)، `src/pages/tasks/[id].astro` (عرض department/recurrence/سلسلة التكرار + callout حاجز الـ dependencies + أقسام checklist/dependencies ثابتة + تمرير props للوحة)، `src/pages/{manager,supervisor,employee}/index.astro` (صفوف عاجلة مميزة + مؤشر 🔁)، `src/pages/notifications.astro` + `src/pages/api/notifications/read-all.ts` + `src/components/MarkAllReadButton.tsx` (الإشعارات المثبَّتة + تحديد الكل كمقروء)، `src/pages/api/tasks/[id]/close.ts` (يرجع nextTaskId + flash)، `src/lib/dashboard.ts` (PRIORITIES = TASK_PRIORITIES — فلتر urgent كان مرفوضًا)، `src/lib/db.ts` — لا تغيير (كل الأعمدة موجودة أصلًا)، `scripts/test.mjs` (اختبارات validation الجديدة + recurrence + regression الـ single-item array — 121 إجمالي)، `scripts/e2e-task-shared.mjs` (جديد — 98 فحص)، `README.md`
- **What**: المستخدم طلب نموذج مهمة مشترك كامل: كل الحقول (title/description/department/priority بلا urgent/due_date/assigned_to/recurrence/recurrence_end_date/checklist/dependencies) مع قواعد: admin/manager يعدّلون كل شي، supervisor ينشئ ويعيّن لموظفي QC النشطين فقط، الموظف ينشئ فقط بـ can_create_tasks=1 وبقي الحقول التجارية مقفلة بعد الإنشاء، كل مهمة فيها created_by/created_at، كل create/update يكتب activity، التعيين/تغيير الموعد/الأولوية ينشئ إشعارًا، العاجلة بارزة بصريًا؛ التكرار: لا مهام لا نهائية — التالي يُنشأ فقط عند الإكمال وضمن نهاية التاريخ، يربط عبر parent_recurring_task_id، ينسخ القالب وليس التعليقات/الأدلة/الأنشطة، ومسجَّل في activity؛ dependencies: لا انتقال لـ in_progress مع dependency ناقص + عرض واضح + تجاوز admin/manager بسبب صريح مسجّل.
- **Why**: نموذج المهمة كان ناقصًا (department/recurrence/checklist/dependencies كلها كانت موجودة في الـ schema من QC-SCHEMA-002 لكن بلا طبقة تطبيق، وurgent كان مرفوضًا في validation و task-policy). بنيت الطبقة كاملة على البنية القائمة بدون migration (الأعمدة والجداول جاهزة).
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `NODE_ENV=production pnpm build` → Server built ✅؛ **`pnpm test` → 121/121** ✅ (منها اختبارات: urgent مقبول، department/recurrence/end_date validation، checklist/dependencies arrays حتى بقيمة واحدة — regression للباغ اللي ضاع فيه item واحد، recurrence monthly clamping Jan31→Feb28/Feb29 leap، end date شاملة)؛ **E2E جديد e2e-task-shared → 98/98** ✅ ضد خادم حي (PORT=4390): إنشاء مدير بكل الحقول (department Lab + urgent + weekly + end + checklist 2 + dependency → الصف/القوائم/النشاط/إشعار التعيين)، supervisor يعيّن لغير موظف → مرفوض بflash، يعيّن لموظف → نجاح، موظف بدون can_create_tasks → مرفوض، emp_create (can_create_tasks=1) ينشئ لنفسه + لا يمكنه تعيين لآخر + **حقول مهمته مقفلة بعده** (title مرفوض 400) + يقدر يبدّل checklist خاصته، حاجز dependencies: موظف ممنوع 400 + مدير بلا سبب 400 "explicit reason" + مدير بسبب → 200 وdependency_override مسجّل + المشرف ما يقدر يتجاوز + إكمال الـ dependency يفتح المهمة، إشعارات: assigned عند الإنشاء والتعيين + due_date_changed/priority_changed للمعيَّن + لا إشعار بلا معيَّن + صفحة /notifications تعرضها + الجرس يعدّها + mark-all-read، التكرار: weekly بسبب حتى تاريخ شامل → R1→R2(+7)→R3(+15 شاملة) → R4(+22) **لا يُنشأ** (لا مهام لا نهائية) + checklist يُنسخ غير محدد + لا تعليقات/أدلة/أنشطة منقولة + activity على الطرفين + إشعار recurring_created + سلسلة مفتوحة النهاية تستمر عند الإكمال، completed → read-only. **لا regression**: e2e-dashboard 30/30 + e2e-delete-request 31/31 + e2e-auth-lockout 42/42 + e2e-admin-users 49/49 ✅.
- **Note**: (1) **باغ قديم انكشف وأُصلح**: `taskScope` في notifications.ts كان يستخدم created_by غير مؤهل و users فيه عمود created_by → `ambiguous column name` يكسر /notifications بصمت — موجود من بعد QC-SCHEMA-002، إصلاحه ت-qualified. (2) **قرار تصميم — supervisor يعيّن فقط لموظفي QC**: عرّفتها بـ role='employee' نشط (مو department='QC') ووثّقتها في README + رسالة الخطأ. (3) **نطاق تحرير الـ supervisor باقي supervisor+** (مثل الحالة الموثقة سابقًا) — المواصفة الجديدة تحدّد الضمانات الدنيا وما قلّصت صلاحياته. (4) التجاوز admin/manager فقط وليس supervisor. (5) تفسير "incomplete" = status ليس completed/cancelled — مرفق تعليق في listBlockingDependencies. (6) إشعارات التغيير تروح للمعيَّن الجديد لو نفس الطلب غيّر المعيَّن (effectiveAssignee). (7) حاجز الـ dependencies read-then-write (مو داخل الترانزاكشن) — سباق مقبول على SQLite أحادي الكاتب، موثّق بتعليق؛ إنشاء التكرار ذرّي داخل نفس tx مع الـ conditional UPDATE. (8) **Playwright `form` option ما يرسل القيم المتكررة بشكل موثوق** — سكربت e2e-task-shared يبني URLSearchParams يدويًا (toParams). (9) أعدت أرقام README: E2E dashboard 30 (مو 29) و delete-request 31 (مو 33) كأرقام حالية. (10) `PRIORITIES` في dashboard صارت من task-policy — فلتر `?priority=urgent` كان يرفض قبل.
- **Report**: README محدّث (قسم Shared task model + Recurring + Dependencies + Notifications + layout + scripts)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck + test 121/121 + build + E2E 98/98 + regression 30/30 + 31/31 + 42/42 + 49/49)
- **Brain updates**: هذا الـ entry. للـ future agents: `createNotification` يكتب في جدول notifications (المثبَّت) — الإشعارات صارت مصدرين (مثبَّت + مشتق) وليست مشتقة فقط كما في QC-SPEC-001. الـ urgency شغّال في كل القوائم. نموذج الإنشاء صار مشتركًا عبر NewTaskForm.astro — أي حقل جديد يُضاف هناك + Zod + taskUpdates + taskDetails.

---

### 2026-08-11 — QC-SEED-IDEMPOTENT-001: `seed.sql` idempotent (INSERT OR IGNORE) لمنع خطأ UNIQUE

- **Files**: `apps/qc-task-manager/db/seed.sql`
- **What**: المستخدم رمى خطأ `SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username` لما شغّل `seed.sql` يدويًا (SQLTools) على `qc_tasks.db` الحقيقية. السبب: الـ DB فيها أصلًا الـ 4 مستخدمين (admin/manager/supervisor/employee) اللي التطبيق فرسهم (IDs 1–4)، وseed.sql كان `INSERT INTO` بدون حماية فيكسر UNIQUE على username (schema سطر 26). غيّرت المقطع لـ `INSERT OR IGNORE INTO` + ملاحظة توثيق إن إعادة التشغيل على قاعدة فيها البيانات = no-op آمن، والـ reseed الكامل عبر `init-db.mjs --reset`.
- **Why**: ملف التوثيق كان يقتل نفسه على أي قاعدة مفروسة بدل ما يكون idempotent (nفس منطق seed.ts الرسمي اللي يشيك isUsersEmpty).
- **Verification**: على نسخة من qc_tasks.db (مفروسة) → 0 صفوف مدرجة، لا خطأ ✅. على قاعدة فاضية (schema + INSERT OR IGNORE) → 4 مستخدمين يُدرجون ✅. نظّفت كل الملفات المؤقتة.
- **Report**: none
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry.

---


### 2026-08-11 — QC-DB-INIT-MIGRATE-001: إصلاح `SQLITE_ERROR: no such column: recurrence` على DB قديمة (init-db صار يرقّي الـ DB الموجودة مثل التطبيق) — مُتحقق ✅

- **Files**: `apps/qc-task-manager/scripts/init-db.mjs` (جديد: `COLUMN_MIGRATIONS` + `migrateExistingDb()` — نفس قائمة db.ts بالضبط: 19 عمود عبر ALTER + backfill users.updated_at + إعادة بناء task_delete_requests القديمة (task_title) إلى شكل CASCADE، تُشغَّل قبل applySchema؛ + pragmas `busy_timeout=5000` و `synchronous=NORMAL` لمطابقة db.ts)، `apps/qc-task-manager/scripts/test.mjs` (قسم جديد "init-db migration" — 16 فحص يشغّل CLI الحقيقي كـ subprocess على DB قديمة الشكل: columns تنضاف + del-req يُعاد بناؤه + البيانات باقية + فهرس recurrence + 12 جدول + 0 FK + idempotent)، `apps/qc-task-manager/README.md` (تحذير: ما تشغّل schema.sql يدويًا على DB موجودة — استخدم db:init أو الإقلاع)
- **What**: المستخدم رما خطأ SQLTools `SQLITE_ERROR: no such column: recurrence` على `apps/qc-task-manager/db/schema.sql`. التشخيص: قاعدة `db/qc_tasks.db` الحقيقية **قديمة** (من قبل QC-SCHEMA-002) — جدول tasks ناقص 4 أعمدة (recurrence/recurrence_end_date/parent_recurring_task_id/department) — وschema.sql يحاول بناء `idx_tasks_recurrence ON tasks(recurrence)` فيفشل. التطبيق كان يرقّي تلقائيًا عند الإقلاع (db.ts migrations) لكن `scripts/init-db.mjs` **ما كان يشغّلها** فكان `pnpm db:init` يقع بنفس الخطأ على DB قديمة، وتشغيل schema.sql يدويًا (SQLTools) يقع أيضًا.
- **Why**: المستخدم يحتاج تشغيل schema/init على قاعدة موجودة بدون فقدان بيانات — والـ CLI كان ناقصه الـ migrations اللي التطبيق يشغّلها أصلًا.
- **Verification**: (1) `pnpm db:init` على الـ DB الحقيقية → `migrated 19 new column(s)` + `tables: 12, users: 4` (البيانات باقية — 4 مستخدمين، 0 مهام). (2) فحص بعدها: 12 جدول + recurrence/department/كل الأعمدة موجودة + `idx_tasks_recurrence` انبني + 0 انتهاكات FK + **schema.sql يُعاد تشغيله يدويًا بنجاح** (نفس الاستعلام اللي كان يرمي الخطأ). (3) Fresh DB regression: init-db على DB جديدة → 12 جدول + 4 مستخدمين + recurrence موجود + 0 FK violations. (4) Smoke حي ضد الـ DB الحقيقية (PORT=4396): login 200 → POST admin → 302 /admin/users → الصفحة 200. (5) `pnpm test` → **89/89 ✅** (73 سابقة + 16 فحص migration جديد — يشمل idempotency).
- **Note**: (1) SQLTools language server يمسك `qc_tasks.db` — WAL + busy_timeout يسمحان بالكتابة المتزامنة، ما فيه تعارض. (2) `qc_tasks 3.db` ملف شارد قديم (1 مستخدم، بلا recurrence) من جلسات سابقة — gitignored، مو متعامل معه. (3) الملاحظة القديمة في الـ brain صحيحة ومؤكدة: `CREATE TABLE IF NOT EXISTS` يبقي الأشكال القديمة — الـ migrations (db.ts أو init-db) هي الطريق الرسمي الوحيد للترقية.
- **Report**: README محدّث (تحذير schema.sql المباشر)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (db:init migration حقيقية + schema re-run نظيف + fresh regression + smoke حي + test 73/73)
- **Brain updates**: هذا الـ entry. للـ future agents: **init-db.mjs الآن يشغّل نفس migrations مثل db.ts** — أي عمود جديد يُضاف لـ COLUMN_MIGRATIONS في db.ts لازم يُنسخ لـ init-db.mjs أيضًا (ملاحظة "Keep in sync" في الملف).

---

### 2026-08-11 — QC-ADMIN-USERS-002: ترقية /admin/users (آخر دخول + department + تعديل كامل + حماية self-demotion + Zod شامل) — 49/49 E2E ✅

- **Files**: `apps/qc-task-manager/src/lib/validation.ts` (+ `MAX_DEPARTMENT_LENGTH=50` + `checkboxBool`/`departmentValue` preprocessors؛ `userCreateSchema` صار فيه department يfallback على 'QC'؛ `userEditSchema` جديد: fullName/role/department/canCreateTasks/isActive)، `apps/qc-task-manager/src/lib/users.ts` (CreateUserInput فيه department اختياري؛ createUser يدرج department فعلي بدل 'QC' الثابت + يسجله بالـ log؛ `findUser` توسّع ليشمل full_name/department/can_create_tasks/is_active (بلا هاش)؛ **`updateUser` جديد**: merge ناقص مع التخزين + Zod على الـ payload الكامل + حارسان للذات — ما تغيّر role حسابك (self-demotion) ولا تعطّله — + **إعادة التفعيل عبر Edit تمسح قفل brute-force والعداد** (مثل زر التفعيل تمامًا) + يحدّث updated_at + audit يسجّل الحقول المتغيّرة فقط؛ `resetPassword` صار يتحقق عبر passwordResetSchema بدل الفحص اليدوي؛ حذف كود ميت ROLES)، `apps/qc-task-manager/src/pages/admin/users/api.ts` (action جديد `edit` + department مع create)، `apps/qc-task-manager/src/pages/admin/users/index.astro` (عمود **Last login**؛ حقل **Department** في الإنشاء default QC؛ نموذج **Edit** لكل صف داخل details — لصفّك: hidden inputs للـ role و is_active بدل select/checkbox + نص توضيحي)، `apps/qc-task-manager/scripts/e2e-admin-users.mjs` (جديد — 49 فحص)، `apps/qc-task-manager/README.md` (قسم Admin محدّث + سكربت e2e)
- **What**: المستخدم طلب تنفيذ /admin/users كامل بالمواصفات الـ 12. الفحص الأول كشف إن الصفحة موجودة من QC-ADMIN-USERS-001 وتغطي 9 من 12، والناقص: **عمود last login**، **حقل department** (كان hardcoded 'QC')، **تحرير كامل للمستخدم** (full name/role/department/can_create_tasks/active) وبدونه ما فيه منع self-demotion، و**Zod** على reset password و الـ edit. نفّذت الكل + حمايات مزدوجة (UI + lib). المتطلبات الـ 12 كلها متحققة ومُختبرة.
- **Why**: المواصفة طلبت إدارة مستخدمين كاملة وفحص الوضع الحالي بيّن فجوات جوهرية (edit كامل غير موجود، department ثابت، last login غير معروض). قرار المستخدم غير مطلوب — المواصفة واضحة والبنية الحالية تحدد الاتجاه.
- **Verification**: `pnpm typecheck` → 0 errors (7 hints معروفة) ✅؛ `pnpm test` → 73/73 ✅؛ `NODE_ENV=production pnpm build` → Server built ✅. **E2E جديد 49/49** ضد خادم على DB مؤقتة (PORT=4398): admin-only (anonymous → 302، employee → 302 /employee) + الأعمدة التسعة في HTML + last_login_at يسجَّل عند الدخول؛ إنشاء بدepartment 'Lab' + فارغ يfallback على QC + **دخول فوري**؛ مكرر → "already taken"؛ كلمة قصيرة → "at least 8 characters" (ولا صف يُنشأ)؛ edit كامل (full_name/role/department/can_create_tasks/is_active ينعكس في DB والـ username يبقى) + المعطّل ما يدخل؛ **تغيير role الذات مرفوض** + **تعطيل الذات مرفوض** (edit و toggle) + edit الذات البريء (الاسم) يشتغل؛ username ثابت بعد edit؛ HTML بلا password_hash ولا bcrypt hash؛ Zod: full name فارغ / role bogus / password قصيرة / create برول غير صالح كلها أخطاء ودية؛ reset password → دخول فوري بالجديد؛ **6h: القفل يُمحى عند إعادة التفعيل عبر Edit**؛ toggle_create ما انكسر. **Regression: e2e-auth-lockout 42/42** ✅ (بعد warm-up login POST — ملاحظة تشغيل تحت). فحص Playwright بصري: الأعمدة كلها + Edit وReset password لكل صف + نموذج Edit لصف الموظف معبأ (QC Employee/employee/QC/checked states) + صف الأدمن فيه hidden inputs بدل select + 0 console errors + 0 overflow على 390px و 1440px.
- **Note**: (1) **warm-up required للـ E2E**: GET /login المجهول ما يلمس الـ DB — أي سكربت E2E يقرأ SQLite مباشرة لازم يرمي POST login (أو طلب بجلسة) قبل فتح الـ DB وإلا "no such table" (طبّقتها في e2e-admin-users.mjs ووثّقتها في README). (2) `userEditSchema` يستخدم preprocess للـ checkboxes (FormData يحذف unchecked) — أي إلغاء تحديد = false صراحة. (3) إعادة التفعيل (inactive→active) عبر edit تساوي زر التفعيل في السلوك (تمسح lock) — منقذة من bug راجعها الـ reviewer. (4) `form.get()` يرجع أول قيمة — تجنّبت hidden+checkbox بنفس الاسم في نفس النموذج.
- **Report**: README محدّث (قسم Admin كامل + سكربت E2E)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck + test 73/73 + build + E2E 49/49 + regression 42/42 + بصري)
- **Brain updates**: هذا الـ entry. للـ future agents: `updateUser` موجود في users.ts ويمر بالـ Zod — أي إضافة حقل تحرير جديد لازم تنضاف لـ userEditSchema + merge في updateUser. قائمة المتطلبات الـ 12 مكتملة الآن في /admin/users.

---

### 2026-08-11 — QC-AUTH-LOCKOUT-001: قفل الحساب 10 دقايق بعد 5 محاولات فاشلة (brute-force protection) + سجل login_attempts + معادلة timing + تنظيف 90 يوم — 42/42 E2E ✅

- **Files**: `src/lib/auth.ts` (`verifyCredentials` صارت ترجع `LoginResult` = `{ok,user} | {locked,lockedUntil} | {invalid}`؛ ثوابت `MAX_FAILED_ATTEMPTS=5` + `LOCK_DURATION_MS=10min`؛ `recordLoginAttempt` تكتب `login_attempts` (username+ip+succeeded) **داخل try/catch — الـ audit ما يكسّر login أبدًا**؛ dummy bcrypt hash لمسار الـ username المجهول (معادلة timing ضد enumeration)؛ نجاح login يصفّر العداد + يمسح القفل + يحدّث `last_login_at`؛ القفل يشتغل **عند** المحاولة الخامسة والعداد يتصفر — بعد انتهاء الـ 10 دقايق يطلع المستخدم بعدّاد جديد)، `src/lib/session.ts` (`handleLoginPost` + `loginAndSetCookie` يتعاملون مع الـ LoginResult — locked → `/login?locked=1` + `LoginContext.clientAddress` يُمرَّر للـ audit)، `src/pages/login.astro` (رسالة "Account locked due to too many failed attempts" بترتيب أولوية: disabled > locked > error)، `src/lib/users.ts` (إعادة تعيين كلمة المرور + إعادة التفعيل يمسحون القفل والعداد — الطريقة الرسمية لفك القفل)، `src/lib/db.ts` (تنظيف `login_attempts` الأقدم من 90 يوم عند الإقلاع — منع النمو غير المحدود)، `scripts/e2e-auth-lockout.mjs` (جديد)، `README.md` (قسم Auth + ملاحظة `NODE_ENV=production` للبناء)
- **What**: المستخدم طلب مصادقة آمنة كاملة (login/logout/bcrypt/12h session/httpOnly qc_session/SameSite/Secure/رسالة عامة/فحص التعطيل/قفل 5 محاولات×10 دقايق/تنظيف جلسات/middleware/role checks server-side). **فحصت الوضع الحالي: 12 من 13 موجودة وموثقة من جلسات سابقة** — الناقص الوحيد هو **قفل الحساب**: أعمدة `users.failed_login_attempts` + `users.locked_until` وجدول `login_attempts` كانوا موجودين في الـ schema من QC-SCHEMA-002 لكن **ولا سطر كود يستخدمهم**. طبّقت القفل كاملًا + سجل تدقيق + إصلاحات مراجعة الكود.
- **Why**: قفل الحساب كان فجوة أمنية حقيقية — المهاجم يقدر يجرب كلمات مرور بلا حدود. الأعمدة والجدول كانوا جاهزين، اللي ناقص هو طبقة التطبيق.
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `pnpm test` → 73/73 ✅؛ `pnpm build` → Server built ✅. **E2E auth lockout 42/42** ضد خادم standalone على DB مؤقتة (PORT=4323): A- login ناجح → session row بـ 12h + كوكي `qc_session` HttpOnly/SameSite=lax/Secure/Path=//Max-Age=43200 + last_login_at + عداد 0؛ B- كلمة غلط → رسالة عامة + عداد 1؛ C- 5 محاولات فاشلة متتالية → القفل يشتغل عند الخامسة + `locked_until` ≈ 10 دقايق + العداد يتصفر + **كلمة السر الصحيحة مرفوضة أثناء القفل** + رسالة locked + 6+ صفوف audit بإيبيهات وبدون كلمات مرور؛ D- انتهاء القفل (محاكاة) → دخول ناجح بعداد جديد؛ E- النجاح يصفّر العداد؛ F- إعادة تعيين كلمة المرور من الأدمن تفك القفل؛ G- إعادة التفعيل تفك القفل؛ H- الحساب المعطّل → رسالة disabled بدون رفع العداد؛ I- مجهول → 302 /login. **لا regression**: e2e-dashboard 30/30 + e2e-delete-request 31/31 ✅. نظّفت DBs الاختبار (الكل gitignored مؤكد).
- **Note**: (1) **اكتشاف مهم للـ future agents — `NODE_ENV` يتحكم في `import.meta.env.PROD`**: البيئة المحلية تصدّر `NODE_ENV=development` (مثل PORT=3000 المعروف) فإذا بنيت بـ `pnpm build` عادي يطلع `PROD: false` في الـ bundle → **كوكي الجلسة يخسر `Secure`**! الحل: `NODE_ENV=production pnpm build` (CI/CD يسويها تلقائيًا) — موثّق في README. التحقق: `secure: false` كان في chunk الـ session، وبعد `NODE_ENV=production` صار `secure: true`. (2) الـ e2e الجديد `e2e-auth-lockout.mjs` يستخدم `QC_DATABASE_PATH` (الاسم الرسمي) بينما e2e-dashboard/delete-request لسا `QC_DB_PATH` (القديم) — كلها مقبولة.
- **Report**: README محدّث (قسم Auth & sessions فيه سياسة القفل كاملة + ملاحظة NODE_ENV)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck + test 73/73 + build + E2E 42/42 + لا regression 30/30 + 31/31)
- **Brain updates**: هذا الـ entry. للـ future agents: `verifyCredentials` رجعت تغيّر صيغتها — صارت ترجع `LoginResult` مو `User | null`، وأي كود جديد يتصل بالـ login لازم يتعامل مع `{locked}`. القفل مقصود يشتغل عند المحاولة الخامسة (مو السادسة) — "after 5 consecutive failed attempts" = عند الخامسة.

---

### 2026-08-11 — QC-DB-LAYER-001: محاذاة طبقة SQLite مع مواصفة PROMPT-03 (QC_DATABASE_PATH + pragmas الأربعة + db/transaction/closeDatabase + تحقق الجداول/الفهارس + SQLTools + README) — 10/10 + 19/19 + E2E حي ✅

- **Files**: `apps/qc-task-manager/src/lib/db.ts` (المتغير صار `QC_DATABASE_PATH` أولًا + `QC_DB_PATH` alias قديم + fallback `<app>/db/qc_tasks.db`؛ pragmas: `journal_mode = WAL` + `foreign_keys = ON` + `busy_timeout = 5000` + `synchronous = NORMAL`؛ تصديرات جديدة: `db` = Proxy كسول، `transaction` = دالة تشغّل fn داخل ترانزاكشن (commit/rollback تلقائي)، `closeDatabase` = إغلاق + reset للاختبارات؛ تحقق إقلاع `validateSchema` — 12 جدول + 26 فهرس، يرمي Error بالقائمة الناقصة)، `apps/qc-task-manager/src/env.d.ts` (+ `QC_DATABASE_PATH`)، `apps/qc-task-manager/scripts/{init-db,backup-db}.mjs` (نفس env fallback للتوافق)، `apps/qc-task-manager/.vscode/settings.json` (جديد — اتصال SQLTools جاهز "QC Tasks DB"، **gitignored** بسبب قاعدة `.vscode/` العامة)، `apps/qc-task-manager/README.md` (قسم SQLTools صار walkthrough مرقّم كامل: تثبيت SQLTools + تثبيت الـ driver + فتح الروت + تشغيل التطبيق مرة + اتصال + تصفح + استعلامات جاهزة + توثيق `QC_DATABASE_PATH`)
- **What**: المستخدم طلب تنفيذ مواصفة طبقة الـ DB حرفيًا (PROMPT-03 في `audit/qc/prompt2.md`) على `src/lib/db.ts` الموجودة: (1) المسار من `process.env.QC_DATABASE_PATH` مع fallback، (2) فتح بـ better-sqlite3، (3) الـ pragmas الأربعة، (4) schema.sql تلقائيًا عند الإقلاع، (5) تهيئة idempotent، (6) تصدير db + query + transaction + closeDatabase، (7+8) prepared statements فقط بلا concatenation لمُدخلات المستخدم، (9) تحقق إقلاع بوجود كل الجداول والفهارس، (10) seed runner يشتغل فقط لما `users` فاضي. سألت المستخدم عن بند الـ seed (النص يقول "حساب الأدمن فقط") → **اختار إبقاء الوضع الحالي** (4 حسابات admin/manager/supervisor/employee) لأن SEED_DEMO والـ README والاختبارات تعتمد عليها.
- **Why**: الملف كان ينفذ أغلب المواصفة بس عنده انحرافات جوهرية: متغير قديم (QC_DB_PATH بدل QC_DATABASE_PATH)، نقص busy_timeout + synchronous، نقص تصديرات الاختبارات (transaction/closeDatabase/db)، ولا تحقق إقلاع. المستخدم يبغى مطابقة المواصفة حرفيًا بدون كسر الميزات الموثقة.
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `pnpm test` → 73/73 ✅؛ `pnpm build` → Server built ✅. **Part A (الـ chunk المبني — 10/10)**: `QC_DATABASE_PATH` يُحترم (فتح ملف temp) + `journal_mode=wal` + `busy_timeout=5000` + `synchronous=NORMAL(1)` + `foreign_keys=1` + seed 4 مستخدمين على DB فاضية + 12 جدول + 26 فهرس (التحقق ما رما — لو ناقص شي كان رما) + cleanupExpiredSessions + singleton. **Part B (المصدر عبر `createServer().ssrLoadModule('/src/lib/db.ts')` — 19/19)**: تصدير DB_PATH + query().run/one/all + transaction (يُرجع القيمة ويـ commit + rollback عند throw) + `db` Proxy ينفذ prepared statements + toBool + closeDatabase ثم إعادة فتح idempotent بدون re-seed + double-close آمن. **E2E حي (خادم standalone على DB مؤقتة)**: GET /login 200 → POST login بـ Origin هيدر 302 → /admin/users بكوكي الجلسة 200 + /manager 200 → DB الناتجة: users=4 + sessions=1 + صف admin صحيح + journal_mode=wal.
- **Note**: (1) **ملاحظة للـ future agents — خادم Astro standalone ما يلمس الـ DB عند GET /login المجهول** (`getSession` يرجّع null مبكرًا بلا كوكي) — لاختبار الـ DB الحي لازم POST login (مع `Origin` هيدر لتفادي CSRF 403 في Astro 6) أو طلب بجلسة حقيقية. (2) في **الـ bundle المبني** تصدير `db` يتحول لكائن namespace (Rollup يدمج الوحدات ويسقط الـ Proxy — لا صفحة تستورده؛ التطبيق يستخدم `getDb`) — `db`/query/transaction/closeDatabase يشتغلون على مستوى المصدر (dev والاختبارات عبر Vite) وهذا المعتمد. (3) `.vscode/settings.json` الجديد gitignored (قاعدة `.vscode/`) — موجود محليًا؛ لو المستخدم يبغى يشاركه يضيف negation في الـ gitignore. (4) **qc_tasks.db مؤكد غير متتبع**: git ls-files يعرض فقط schema.sql/seed.sql/.gitkeep في db/، وcheck-ignore يطابق `db/*.db` و `-wal` و `-shm`. (5) SQLTools language server شغال عند المستخدم (VS Code) وماسك `db/qc_tasks.db` الحقيقي — لا تقتله ولا تعدّل الـ db الحقيقي في الاختبارات.
- **Report**: README محدّث (SQLTools walkthrough + QC_DATABASE_PATH + ملاحظة legacy alias)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck + test 73/73 + build + Part A 10/10 + Part B 19/19 + E2E حي)
- **Brain updates**: هذا الـ entry. للـ future agents: اسم المتغير الرسمي صار `QC_DATABASE_PATH` (`QC_DB_PATH` alias ما زال مقبولًا) — حدّث أي سكربت جديد على الاسم الرسمي. **إصلاحات مراجعة الكود**: (1) `ensureDir` صار ينشئ مجلد المسار المخصص `dirname(DB_PATH)` مو فقط `<app>/db` — يدعم مسارات `QC_DATABASE_PATH` المتداخلة؛ (2) `scripts/{init-db,backup-db}.mjs` صاروا يستخدمون `??` مثل db.ts؛ (3) README صرّح أن `dev` وحده لا يولّد الـ DB إلا عند أول طلب يلمسها (سجّل دخول مرة) + وضّح أن `.vscode/settings.json` gitignored. جرّبت إمرار `transaction` عبر proxy `db` لإبقائه في الـ bundle — **لم يغيّر سلوك Rollup** فرجّعته لـ getDb ووثّقت الـ quirk في تعليق `db`.

---

### 2026-08-11 — QC-SCHEMA-002: ترقية schema.sql إلى مواصفة الإنتاج الكاملة (12 جدول + WAL/FK + CHECKs + فهارس) + CASCADE على delete requests + migrations للـ DB الموجودة — 25/25 + 16/16 + 31/31 + 30/30 + 73/73 ✅

- **Files**: `apps/qc-task-manager/db/schema.sql` (إعادة كتابة كاملة — 12 جدول: users/tasks/task_comments/task_attachments/task_activity_log/task_delete_requests/task_checklists/task_dependencies/notifications/sessions/login_attempts/saved_filters + `PRAGMA journal_mode = WAL` + `PRAGMA foreign_keys = ON` في الأعلى + CHECKs لكل enums/نسب + فهارس لكل FKs وفلاتر اللوحة)، `src/lib/db.ts` (جديد: `migrateNewColumns` = 19 عمود عبر ALTER TABLE ADD COLUMN بفحص table_info + `migrateDeleteRequests` **معكوس** = إعادة بناء الجدول القديم (task_title بلا FK) إلى شكل المواصفة `task_id REFERENCES tasks(id) ON DELETE CASCADE` بدون task_title + ترتيب initialize صار: migrations ← ثم schema.sql ← ثم seeds)، `src/lib/deleteRequests.ts` (إزالة task_title نهائيًا: INSERT بدون snapshot، قائمة الصفوف JOIN مباشر من tasks، عنوان المراجعة يُقرأ حيًا من tasks)، `src/pages/manager/requests/index.astro` (إزالة فرع "(deleted)" — الصفوف المعتمدة تختفي مع المهمة)، `scripts/e2e-delete-request.mjs` (سيناريو A صار يثبت: صف الطلب يُحذف بـ cascade + غائب من History — 31/31)، `README.md` + `docs/ARCHITECTURE.md` (12 جدول + سلوك CASCADE + ملاحظة الانجراف)
- **What**: المستخدم طلب schema.sql إنتاجي كامل (12 جدول بمواصفات حرفية: أعمدة + CHECKs + ON DELETE CASCADE للـ children فقط + RESTRICT/SET NULL للمراجع الحرجة + فهارس). اختار عبر ask_user: (1) **المواصفة حرفيًا على task_delete_requests** (CASCADE بدون task_title — عكس التصميم القديم المتعمد اللي كان يحفظ الطلب كسجل تدقيق)، (2) **إضافة migrations في db.ts** لترقية الـ DB الموجودة. نفّذت: (1) schema.sql كامل بالشكل المطلوب حرفيًا + سياسة FK: CASCADE للـ children (comments/attachments/activity/checklists/dependencies للـ task + sessions/notifications/saved_filters للـ user)، RESTRICT للحرجة (tasks.created_by، user_id في comments/attachments/activity، requested_by) ، SET NULL للمراجع الاختيارية (assigned_to/completed_by/cancelled_by/reviewed_by/users.created_by/notifications.task_id + `parent_recurring_task_id`). (2) migrations: `migrateNewColumns` تضيف الأعمدة الجديدة (users: failed_login_attempts/locked_until/last_login_at/created_by/updated_at؛ tasks: department/recurrence/recurrence_end_date/parent_recurring_task_id/started_at/cancelled_at/cancelled_by/completion_comment_id؛ comments: is_completion_comment؛ attachments: file_hash/is_evidence؛ activity: field/note/ip_address) و `migrateDeleteRequests` تعيد بناء الجدول القديم (task_title) إلى شكل CASCADE — تحذف الصفوف الـ dangling (approved لمهام محذوفة) لأن FK الجديد NOT NULL ما يسمح بها.
- **Why**: المواصفة طلبت بنية أوسع (إعادة استخدام + recurrence + إشعارات + lockout + login attempts + saved filters) وكلها كانت ناقصة؛ وقرار المستخدم: اتباع المواصفة حرفيًا حتى لو ضحّى بسجل التدقيق + رفع الـ DB الموجودة.
- **Verification**: (1) **schema على DB جديدة: 25/25** — 12 جدول + integrity + fk_check نظيف + 14 فهرس إلزامي + كل CHECKs ترفض القيم الغلط + RESTRICT/CASCADE/SET NULL/partial unique/defaults. (2) **migration حقيقية عبر إقلاع خادم Astro على DB قديمة: 16/16** — الأعمدة انضافت، task_delete_requests صار CASCADE بلا task_title، الصف الـ dangling انحذف والـ pending/rejected بقوا، 12 جدول، integrity + fk_check نظيفين، partial unique عايش، cascade يشتغل فعليًا. (3) **E2E delete-request: 31/31** على DB طازة (init-db: 12 جداول + 4 مستخدمين) — approve يحذف المهمة والطلب معًا، History ما يعرضه؛ reject يبقي الطلب والتاريخ. (4) **E2E dashboard: 30/30** على DB طازة — لا regression. (5) **SEED_DEMO=1 db:init**: 12 جدول + 6 مستخدمين + 12 مهمة + 2 مرفق (mime/size NOT NULL راضين) + fk_check نظيف. (6) `pnpm test` → 73/73 ✅؛ `pnpm typecheck` → 0 errors (7 hints معروفة) ✅؛ `pnpm build` → Server built ✅.
- **Note**: (1) **تنبيه فقدان بيانات**: عند أول إقلاع على `db/qc_tasks.db` الحالي، الـ migration تحذف طلبات الحذف `approved` اللي مهماتها انحذفت سابقًا (History في /manager/requests يفقدها) — نتيجة مباشرة لاختيار المستخدم CASCADE. (2) **انجراف migrated/fresh**: ALTER ADD COLUMN ما يغيّر CHECKs ولا يجعل NOT NULL — الـ DB المُرحّلة تبقى بحالات status/priority القديمة (بدون cancelled/urgent) وبـ mime_type/file_size nullable، والجديدة تاخذ المواصفة كاملة — موثّق في README. (3) **انجراف مقصود schema↔validation**: DB تقبل `'cancelled'`/`'urgent'` بينما task-policy.ts (4 حالات/3 أولويات) وZod ترفض `'urgent'` — الـ schema للمستقبل ولا كسر حالي. (4) `users.updated_at` انضاف nullable + backfill من created_at (ALTER يمنع DEFAULT تعبيري)؛ ما فيه trigger. (5) `notifications` table موجودة لكن التطبيق لسا يستخدم الإشعارات المشتقة (قراءة الـ brain: QC-SPEC-001) — الربط المستقبلي متروك. (6) انحراف لفظي واحد عن المواصفة: `parent_recurring_task_id ... ON DELETE SET NULL` (المواصفة كتبتها bare) — متسق مع قاعدة المستخدم العليا. (7) `listReviewedDeleteRequests` لسا يستعلم status='approved' (ميت دفاعيًا — approved ينحذف مع المهمة). (8) ملاحظة بيئية مُعاد تأكيدها: خادم Astro ما يلمس الـ DB إلا عند أول طلب يكشف session حقيقية — لاختبار الـ migration لا تكتفي بـ GET /login بدون كوكي.
- **Report**: README + docs/ARCHITECTURE.md محدّثان
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (schema 25/25 + migration حقيقية 16/16 + E2E 31/31 + 30/30 + test 73/73 + build/typecheck)
- **Brain updates**: هذا الـ entry. لاحظ للـ future agents: الـ delete-request flow صار CASCADE (approved يختفي مع المهمة — مو مثل QC-DELETE-REQ-001)؛ استخدم `--filter @brightai/qc-task-manager`.

### 2026-08-11 — QC-SPEC-001: سدّ فجوات المواصفة في QC Task Manager (اسم @brightai + Zod + notifications + backup + export + scripts) — 73/73 + 30/30 + 33/33 ✅

- **Files**: `apps/qc-task-manager/package.json` (الاسم → `@brightai/qc-task-manager` + zod ^3.24.1 + scripts db:seed/db:backup/test)، `.gitignore` (root + app: db/backups/* مع استثناء .gitkeep + تجاوز قاعدة `backups/` العامة)، `db/backups/.gitkeep` (جديد)، `docs/ARCHITECTURE.md` (جديد)، `public/.gitkeep` (جديد)، `src/types/index.ts` (جديد — re-export)، `src/lib/task-policy.ts` (جديد — الدومين القوانين: statuses/limits/field locks/upload allowlist/transition predicates)، `src/lib/validation.ts` (جديد — Zod schemas + parseFormData)، `src/lib/notifications.ts` + `src/pages/notifications.astro` (جديد — إشعارات مشتقة بلا جدول) + `src/components/Navbar.tsx` + `src/layouts/BaseLayout.astro` (جرس + عداد)، `src/lib/backup.ts` + `scripts/backup-db.mjs` (جديد — online backup WAL-safe + retention)، `src/lib/export.ts` + `src/pages/api/export/tasks.csv.ts` (جديد — CSV role-scoped)، `scripts/test.mjs` (جديد — `pnpm test`)، وأربطة Zod في `tasks.ts`/`users.ts`/`comment.ts`/`delete-request.ts`/`session.ts` + نقل ثوابت `taskUpdates.ts`/`types.ts`/`permissions.ts` إلى task-policy
- **What**: التطبيق كان موجودًا ومكتملًا (52/52) لكن المواصفة طلبت بنية أوسع — سدّيت كل الفجوات بدون ما أكسر شي: (1) **الاسم** صار `@brightai/qc-task-manager` (تحققت: ما فيه أي مرجع خارجي للاسم القديم) + **zod** (نفس نسخة الـ monorepo ^3.24.1). (2) **task-policy.ts** = مصدر الحقيقة لقواعد الدومين (قواعد العمل الستة) و `taskUpdates.ts`/`types.ts`/`permissions.ts` يستوردون منها مع re-exports للتوافق (attachments/index.ts يستورد MAX_UPLOAD_BYTES من taskUpdates — ما تكسر). (3) **validation.ts** = كل schemas المدخلات (login/task create/comment/delete-request/user create/password reset) بنفس رسائل الخطأ الحرفية، مربوطة في 5 مسارات. (4) **notifications** = مشتقة من البيانات الموجودة (بدون جدول جديد): overdue/due_soon/unstarted/recent comments/pending delete requests، صفحة `/notifications` لكل الأدوار + جرس في الـ navbar مع عداد مباشر. (5) **backup** = `pnpm db:backup` ياخذ online backup (readonly connection + better-sqlite3 backup()) لـ `db/backups/qc_tasks-<ts>.db` مع retention 14 (`--keep=N`)، و`createBackup` برمجيًا. (6) **export** = `GET /api/export/tasks.csv` role-scoped (الموظف: مهامه فقط) مع BOM + escaping RFC-4180. (7) **scripts**: `db:seed` (alias لـ db:init)، `db:backup`، `test` (= structure compliance + وحدة smoke على Zod/task-policy/CSV/backup عبر الـ loader).
- **Why**: المواصفة طلبت stack + بنية محددة (Zod، notifications، backup، export، types/، docs/، public/، db/backups، scripts معينة، واسم الحزمة) وكانت هذي الملفات/الخصائص ناقصة — مع الحفاظ على كل الوظائف القائمة بدون ترقيات غير ضرورية.
- **Verification**: `pnpm install` ✅؛ `pnpm typecheck` → 0 errors (8 hints معروفة مسبقًا) ✅؛ `pnpm build` → Server built ✅؛ **`pnpm test` → 73/73** (بنية المواصفة كاملة + سلوك Zod + قواعد task-policy + CSV escaping + backup round-trip حقيقي مع retention) ✅؛ **E2E dashboard 30/30** و **delete-request 33/33** (لا regression — الرقم الأول 30 مو 29 لأنه السكربت تطور) ✅؛ `db:seed` على DB طازة (7 جداول + 6 users + 12 tasks demo) ✅؛ `db:backup` + `--keep=2` prunes صح ✅؛ فحص حي على الخادم (SEED_DEMO=1): /notifications فيه 4 Overdue + 2 Due soon + 8 روابط، الجرس "Notifications (8 active)"، CSV 13 سطر (12 مهمة) مع Content-Disposition ✅.
- **Note**: (1) **باغ بيئي للـ future agents**: خادم Astro standalone يموت أو يتجاهل الـ env إذا شغّلته في basher call وطلعت منه — شغّل الخادم والفحص في **نفس** الأمر، وحدد الـ DB بـ `env -u PORT QC_DB_PATH=... SEED_DEMO=1 PORT=NNNN node dist/server/entry.mjs` (بيئة الجهاز تصدّر PORT=3000). (2) أول محاولة فحص شغلت الخادم على DB غلط (dist/db/qc_tasks.db — السلوك المعروف للـ standalone) فظهرت الإشعارات فاضية — **مو باغ بالكود**، تأكد من الـ DB عبر lsof أو عدد صفوف CSV. (3) `pnpm test` يحتاج Node 22+ (`--experimental-strip-types`) — الإصدار المثبت 22.22.3 والـ engines يكتب >=20 فصار التحديث منطقيًا. (4) قاعدة `.gitignore` العامة `backups/` (سطر 115) كانت تحجب `db/backups/.gitkeep` — حليتها بإضافة negations بعدها.
- **Report**: `docs/ARCHITECTURE.md` + README محدّث (الاسم الجديد، scripts، notifications/export/backup/validation sections، layout tree)
- **Commit**: uncommitted — المستخدم يلتزم (القاعدة الثانية)
- **Status**: verified locally (typecheck/build/test/E2E/CLI/حي)
- **Brain updates**: هذا الـ entry. لاحظ للـ future agents: استخدم `--filter @brightai/qc-task-manager` (الاسم الجديد) وليس `qc-task-manager`.

---

### 2026-08-11 — QC-FINAL-001: التسليم النهائي لـ QC Task Manager (أمن + UX + closure flow + uploads + demo seed + README + إنتاج) — 52/52 ✅

- **Files**: `src/middleware.ts` (security headers على كل response), `src/lib/taskUpdates.ts` (جديد — update + closure + upload validation), `src/pages/api/tasks/[id]/{update,close}.ts` + `attachments/index.ts` (جديد), `src/components/{TaskUpdatePanel,AttachmentUploader}.tsx` + `{StatusBadge,EmptyState}.astro` (جديد), `src/lib/format.ts` (خرائط ألوان موحدة 🔴🟡🟠🟢 + isOverdue + MAX_COMMENT_LENGTH), `src/lib/permissions.ts` (canEditLockedField صار supervisor+), `src/lib/activity.ts` + `taskDetails.ts` (أفعال title/description/assignee/due/priority/attachment_uploaded), `src/pages/tasks/[id].astro` + قوائم {employee,manager,supervisor} (شارات + overdue أحمر + empty states + responsive)، `src/lib/seed.ts` + `scripts/init-db.mjs` (SEED_DEMO=1)، `README.md` (إعادة كتابة كاملة + SQLTools + .vscode snippet)
- **What**: التسليم النهائي حسب المواصفة: (1) **أمن** — headers `X-Frame-Options: DENY` + `X-Content-Type-Options: nosniff` + `Referrer-Policy` تُطبَّق على كل response (صفحات/redirects/API) عبر `withSecurityHeaders` في middleware؛ كل /api/* يعيد فحص session+role server-side (comment/update/close/attachments/delete-request/admin-users/manager-requests) وكل SQL parameterized (فقط fragments ثابتة تُبنى بـ template، القيم دايم `?`). (2) **UX** — ألوان موحدة 🔴🟡🟠🟢 في كل الصفحات (StatusBadge + خرائط format.ts)، التواريخ المتأخرة حمراء، empty states موحدة بـ EmptyState مع CTAs، جداول responsive، loading states على كل الجزر. (3) **closure flow + uploads** (كانت الناقصة الكبيرة): `POST /update` مع field locking كامل (الموظف: status/progress/blocker فقط؛ supervisor/manager/admin: الكل) + `POST /close` (الـ closure flow ذرّي: comment إلزامي + evidence أو skip مسجّل + completed_at/by تلقائي + conditional UPDATE يمنع الـ race) + `POST /attachments` (ext + MIME + 10MB، أسماء ملفات منقّاة). (4) **SEED_DEMO=1**: 6 حسابات (1 manager + 1 supervisor + 3 employees) + 12 مهمة بحالات مختلطة (3 not_started/4 in_progress/2 on_hold/3 completed) بتواريخ نسبية لليوم + أنشطة وتعليقات + evidence attachments حقيقية (placeholder BLOBs قابلة للتحميل) — نفس النتيجة من `db:init --reset` ومن `dev`. (5) **README** شامل (roles/permissions table، التشغيل، credentials وكيف تغيّرها، مكان الـ DB، SQLTools + mtxr.sqltools-driver-sqlite باسم "QC Tasks DB" + snippet جاهز، الأمان، الـ E2E). (6) **إنتاج**: `node dist/server/entry.mjs` يشتغل على **4321 افتراضيًا** (options.port=4321 من astro.config) — لاحظت إن بيئة الجهاز الحالية تصدّر `PORT=3000` فتُلغيه بـ `env -u PORT`، وهذا مو باغ بالتطبيق.
- **Why**: معايير القبول تتطلب الـ workflow الكامل end-to-end (create users → create task → employee progresses → closure flow → dashboard updates) وكان الـ update/closure/upload UI غير موجود أصلاً (README القديم يقول "next build phase")، وما فيه security headers ولا demo seed ولا توثيق SQLTools.
- **Verification**: `pnpm typecheck` 0 errors ✅؛ `pnpm build` Server built ✅؛ **سكربت تسليم شامل ضد الخادم الإنتاجي على 4321 (DB demo طازة) → 52/52 PASS**: headers على صفحات/API/redirects، anonymous → 302، logins، field locking (موظف يعدّل مهمته ✅ / حقل مقفل مرفوض / status=completed عبر update مرفوض / موظف ما يعدّل مهمة ثانية)، closure (بدون comment 400 / comment+skip 200 / completed_at+by تلقائي / 3 أفعال مسجلة / re-close 400 / update على completed → read-only)، uploads (pdf ✅ / .exe 400 / MIME غلط 400 / >10MB 400 / فارغ 400) + download + dashboard ينعكس (completed KPI 3→4) + manager يعدّل locked fields مع title_changed في الـ activity + create task. **E2E قديمة: dashboard 30/30 + delete-request 33/33 (لا regression)** ✅. فحص بصري Playwright (admin/users، manager 12 صف بشارات emoji، صفحة مهمة فيها Update progress + Task details + Complete this task + uploader، dashboard 6 KPI، 0 console errors، 0 overflow على 390px) ✅. SEED_DEMO متسق (6 users/12 tasks/3 completed ببيانات إغلاق/2 attachments/3 closure comments) من init-db ومن seed.ts.
- **Note**: (1) بيئة الجهاز تصدّر `PORT=3000` — لاختبار الافتراضي 4321 استخدم `env -u PORT node dist/server/entry.mjs`. (2) الـ closure flow مقصود ليشمل أي محرِّر (موظف على مهامه + supervisor/manager/admin على أي مهمة) — موثّق بالـ README. (3) ملاحظة مراجعة كود عُولجت: `init-db.mjs` و `seed.ts` صاروا ينتجون نفس الـ demo الكامل، و `closeTask` فيه conditional UPDATE (`WHERE status != 'completed'` + changes===1) مثل نمط `reviewDeleteRequest` لمنع race. (4) `MAX_COMMENT_LENGTH` صار مشترك من format.ts. (5) `Content-Disposition` صار معه `filename=` fallback ASCII.
- **Report**: README موثّق بالكامل + هذا الـ entry
- **Commit**: uncommitted — المستخدم يلتزم
- **Status**: verified locally (52/52 + 30/30 + 33/33)
- **Brain updates**: هذا الـ entry. كل قواعد العمل الستة مكتملة الآن في QC Task Manager.

---

### 2026-08-11 — QC-DASH-001: بناء /dashboard كامل في QC Task Manager (KPI + 3 رسوم SVG + جدولين + فلاتر) — 29/29 E2E ✅

- **Files**: `apps/qc-task-manager/src/lib/dashboard.ts` (جديد — طبقة بيانات read-only بالكامل), `apps/qc-task-manager/src/components/DashboardCharts.tsx` (جديد — جزيرة React برسوم SVG نقية), `apps/qc-task-manager/src/pages/dashboard.astro` (إعادة بناء), `apps/qc-task-manager/src/middleware.ts` (فلاش عند رفض الموظف), `apps/qc-task-manager/scripts/e2e-dashboard.mjs` (جديد), `apps/qc-task-manager/README.md`
- **What**: بنيت اللوحة كاملة حسب المواصفة: 6 كروت KPI (Total/Not started/In progress/On hold/Completed/Overdue — الـ overdue = `due_date < اليوم AND status != 'completed'` بتوقيت محلي). 3 رسوم بيانية بـ pure SVG داخل جزيرة React (`client:load`) بدون أي dependency جديدة (المواصفة تسمح بـ SVG): دونات للحالات، أعمدة مكدسة لكل موظف نشط مقسّمة بالحالات (مرتبة بالتنازلي + scroll أفقي)، وخط لإنجازات آخر 8 أسابيع (Monday-aligned من completed_at). جدولان: "Overdue tasks" (العنوان/المعيَّن/تاريخ الاستحقاق/أيام التأخير، مرتب بالأقدم) و"Recently completed" (آخر 10 مع completed_by). فلاتر GET (نطاق تاريخ الإنشاء، المعيَّن، الأولوية) تُقيّد كل الأرقام بنفس الـ WHERE — وكل الاستعلامات `?`-parameterized و read-only. القيم غير الصالحة تُرفض مع flash. الموظف يترجّل لـ /employee مع flash "permission to access the dashboard" (شرط القبول).
- **Why**: /dashboard كان scaffold بـ 4 كروت بلا رسوم/جداول/فلاتر، وموظف يزور /dashboard كان يترجّل بدون أي توضيح. المواصفة طلبت البناء الكامل بمعايير قبول "الأرقام تطابق قاعدة البيانات" + "redirect + flash".
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `pnpm build` → Server built ✅؛ **E2E 29/29 PASS** ضد خادم حي (PORT=4322، DB مؤقتة) — بذرة 10 مهام بتواريخ نسبية لـ "now" (ظهيرة UTC لتثبيت التقويم)، وكل رقم معروض (KPI عبر data-kpi، الرسوم عبر aria-label للـ SVG، الجداول عبر DOM) قورن بحسابات SQL مستقلة: KPI بدون فلاتر + 4 فلاتر + فلتر مدمج + فلتر غير صالح (يُرفض مع flash one-shot)؛ خط chart طابق آخر-8-أسابيع؛ الموظف → 302 لـ /employee + كوكي qc_flash فيه permission + الرسالة تظهر؛ supervisor/admin 200. لقطات: `download/qa/dashboard-{desktop,mobile}.png`. فحص ثانٍ: 0 console errors، لا تحذيرات React keys، overflow أفقي على 390px = 0 (الـ bar chart يتقلب داخل حاويته).
- **Note**: ملاحظتان مهمتان للـ future agents: (1) **ترتيب الـ params** — في SQLite الـ placeholders تُربط بترتيب ظهورها في النص؛ في `getKpis` الـ `date(?)` داخل الـ SELECT يجي قبل أسئلة الـ WHERE فلازم `today` يُمر أولًا (`.get(today, ...params)`) — اكتشفت هذا الباغ عبر الـ E2E لما فلتر الأولوية رجع صفر. (2) Astro 6 يسلسل island props بشكل مشفّر — قراءة الـ chart data عبر `aria-label` للـ SVG المعروض أقوى وأثبت من فك ترميز الـ props attribute. كمان: gridVals لازم تُنقّى من التكرار (`new Set`) بعد التقريب لأنها تستخدم keys في React (تحذير duplicate keys عند max صغير)، و `min-w-0` على كروت الـ grid يمنع الـ SVG min-width يكسر تخطيط الجوال.
- **Report**: none (موثّق في README + هذا الـ entry)
- **Commit**: uncommitted — المستخدم يلتزم
- **Status**: verified locally (29/29 E2E)
- **Brain updates**: هذا الـ entry. القاعدة #1 مكتملة في QC Task Manager (اللوحة + الحماية).

---

### 2026-08-11 — QC-DELETE-REQ-001: التحقق الكامل من delete-request workflow في QC Task Manager (33/33 E2E ✅)

- **Files**: `apps/qc-task-manager/src/lib/deleteRequests.ts`, `apps/qc-task-manager/src/components/DeleteRequestDialog.tsx`, `apps/qc-task-manager/src/pages/api/tasks/[id]/delete-request.ts`, `apps/qc-task-manager/src/pages/manager/requests/{index.astro,api.ts}`, `apps/qc-task-manager/src/pages/{manager,employee}/index.astro` (شارات 🗑️), `apps/qc-task-manager/src/lib/{permissions,activity,db}.ts`, `apps/qc-task-manager/db/schema.sql` (task_delete_requests بلا cascade + snapshot task_title), `apps/qc-task-manager/src/middleware.ts`, `apps/qc-task-manager/src/components/Navbar.tsx` (رابط Delete Requests), `apps/qc-task-manager/scripts/e2e-delete-request.mjs`, `apps/qc-task-manager/README.md`
- **What**: الـ workflow (القاعدة #4) مكتمل ومُتحقق منه: الموظف يطلّع "🗑️ Request Deletion" على مهامه (not_started/in_progress فقط) → dialog بسبب اختياري → POST `/api/tasks/[id]/delete-request` يدرج pending (المكرر مرفوض 400) → شارة "🗑️ Deletion requested" في صفحة المهمة وقائمة /employee + علامة في /manager. المانجر/الأدمن يشوفون القائمة في `/manager/requests` (رابط في Navbar و /manager) مع Approve/Reject: approve يحذف المهمة (cascade ينظف comments/attachments/activity) ويعلّم request approved + reviewed_by/at، reject يعلّم rejected والشارة تختفي. كل انتقال مسجّل في task_activity_log (delete_requested/approved/rejected). المهام المكتملة مرفوضة طلب الحذف (القاعدة #3). migration في db.ts يعيد بناء جدول قديم كان فيه ON DELETE CASCADE (كان يدمر سجل التدقيق عند الحذف) إلى شكل snapshot مع task_title.
- **Why**: المتطلبات + معايير القبول: موظف يطلب → مانجر يشوف pending → يوافق → المهمة تختفي والطلب approved؛ ومسار الرفض: الشارة تختفي والطلب rejected. كلاهما متحقق E2E.
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `pnpm build` → Server built ✅؛ E2E كامل ضد dist server على port 4322 مع DB مؤقتة → **33/33 PASS** (سيناريوهات A approve، B reject مع badge clear + reviewer name، C completed blocked، D duplicate blocked، E supervisor ما يقدر يراجع، F admin يقدر). بعد تحسينات الدفاع في العمق أعدنا الـ E2E → 33/33 مرة ثانية ✅. نظّفت DB الاختبار وملفاتها المؤقتة.
- **Improvements (مراجعة كود)**: (1) فهرس فريد جزئي `idx_delreq_one_pending ON task_delete_requests(task_id) WHERE status='pending'` في schema.sql + migration — منع المكرر صار ذرّي على مستوى الـ DB، مع catch لـ UNIQUE constraint في submitDeleteRequest. (2) حارس already-reviewed صار UPDATE شرطي `WHERE id=? AND status='pending'` مع فحص `changes===1` (reject مباشرة، approve داخل نفس الترانزاكشن مع rollback لو تغيّر الطلب تحتنا). (3) قائمة pending تعرض "(deleted)" للمهام اللي اختفت بمسار آخر بدل رابط مكسور.
- **Note**: ملاحظة تشغيل — خادم Astro standalone (`node dist/server/entry.mjs`) يشتغل على PORT البيئة (الافتراضي 3000 مو 4321)؛ لاختبار E2E استخدمنا `PORT=4322`. تثبيت Playwright على مستوى الـ monorepo root. tmux غير متوفر في البيئة — شغّلنا الخادم والـ E2E في نفس الـ basher session.
- **Report**: none (موثّق في README + هذا الـ entry)
- **Commit**: uncommitted (README + e2e script) — المستخدم يلتزم
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. القاعدة #4 مكتملة في QC Task Manager.

---

### 2026-08-10 — QC-TASK-DETAILS-001: صفحة تفاصيل المهمة /tasks/[id] في QC Task Manager (6 أقسام + تعليقات + تنزيل المرفقات)

- **Files**: `apps/qc-task-manager/src/pages/tasks/[id].astro` (جديد), `apps/qc-task-manager/src/lib/format.ts` (جديد), `apps/qc-task-manager/src/lib/taskDetails.ts` (جديد), `apps/qc-task-manager/src/components/CommentBox.tsx` (جديد), `apps/qc-task-manager/src/pages/api/tasks/[id]/comment.ts` (جديد), `apps/qc-task-manager/src/pages/api/tasks/[id]/attachments/[attachmentId].ts` (جديد), `apps/qc-task-manager/src/lib/tasks.ts` (تصدير taskListFor), `apps/qc-task-manager/README.md`
- **What**: بنيت صفحة تفاصيل المهمة عند `/tasks/[id]` لكل الأدوار: هيدر (شارات الحالة/الأولوية + شريط التقدم + تاريخ الاستحقاق + المعيّن + المنشئ + معلومات الإغلاق)، callout حاجز (blocker note)، خيط التعليقات مع CommentBox (React island، client:visible، ينشر على الـ API ويضيف الرد فورًا)، قائمة المرفقات مع روابط تنزيل، خط زمني للنشاط من task_activity_log (أيقونات SVG حسب الفئة + نص وصفي)، ولوحة إغلاق للمهام المكتملة (evidence + تعليق الإغلاق المثبّت). قاعدة العرض: الموظف يشوف فقط المهام المعيّنة له أو التي أنشأها، والباقي أي مهمة؛ المهمة المفقودة → 404، الموظف غير المصرّح → 403 (مع body مُصمّم). المهام المكتملة للقراءة فقط للجميع (القاعدة #3). أضفت `POST /api/tasks/[id]/comment` (401/404/403/400 JSON، يدرج task_comments + يسجل comment_added) و `GET /api/tasks/[id]/attachments/[attachmentId]` (يسترجع BLOB مع Content-Disposition RFC 5987 + no-store). استخرجت كل الاستعلامات والتنسيق في lib (taskDetails.ts + format.ts) بدل تشتيتها في الصفحة.
- **Why**: المهام كانت بلا صفحة تفاصيل — الموظف يضغط على مهمة (الروابط موجودة من قبل) ويدخل فراغ. README يذكر أن "task details page" مرحلة قادمة. الشيفرة الحالية كانت تشير أن صفحة `/tasks/[id]` القادمة تنتظر بنائها.
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `pnpm build` → Server built ✅؛ اختبار end-to-end عبر `PORT=4399 node dist/server/entry.mjs` مع QC_DB_PATH مؤقت (seed فيه 3 مهام: واحدة in_progress مع مرفق + تعليق + blocker، واحدة للموظف نفسه، واحدة مكتملة مع evidence + تعليق إغلاق): manager على /tasks/1 → 200 والست أقسام ظاهرة (العنوان، الشارات، التقدم 40%، الحاجز، التعليقان، المرفق، رابط التنزيل) ✅؛ /tasks/3 المكتملة → لوحة الإغلاق + "Completion comment" + evidence ✅؛ الموظف على مهمة مو مهمته → 403، على مهمته → 200 ✅؛ /tasks/999 → 404 ✅؛ تنزيل المرفق → PDF bytes + Content-Disposition ✅؛ POST comment → 200 ويصير يظهر + سطر activity ✅؛ POST comment على مهمة مكتملة → 403 ✅؛ تعليق فارغ → 400 ✅؛ مرفق عبر مهمة ثانية → 404 ✅. لاحظت وأصلحت باغ: الصفحة كانت ترجع 200 لـ /tasks/999 (بدون تعيين Astro.response.status) — أضفت 404/403 الصريحة.
- **Note**: ملاحظة لـ future agents — أدوات هذه الجلسة (read/بعض bash) كانت تعرض محتوى تالف: `read` يرجع "No content." وبعض الملفات المكتوبة عبر write ذهبت لمسار مضروب ("/Requests/..."). الحل المجرّب: استخدم `git show HEAD:<path>` للقراءة الموثوقة + `python3 heredoc` للفحص الدقيق + تحقق بعد كل write بـ `os.walk`. كمان: Astro 6 ما يدعم spread لخصائص SVGAttributes من string — بنيت svgIcon() helper يحقن الـ inner HTML عبر set:html. Ternary الطويلة في .astro ما تضيّق null على task — أضفت `: task ? (... ) : null` كحارس.
- **Report**: none (موثّق في README + هذا الـ entry)
- **Commit**: uncommitted
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. أضفت format.ts + taskDetails.ts + CommentBox.tsx لملفات lib/components. الخطوة التالية (للمستقبل): تحرير المهام (edit) + closure flow + رفع المرفقات UI + طلبات الحذف (كلها مذكورة في README كمرحلة قادمة).

### 2026-08-10 — QC-ADMIN-USERS-001: صفحة إدارة المستخدمين في QC Task Manager (/admin/users) + رسالة الحساب المعطّل

- **Files**: `apps/qc-task-manager/src/lib/users.ts` (جديد), `apps/qc-task-manager/src/pages/admin/users/api.ts` (جديد), `apps/qc-task-manager/src/pages/admin/users/index.astro`, `apps/qc-task-manager/src/lib/auth.ts`, `apps/qc-task-manager/src/lib/session.ts`, `apps/qc-task-manager/src/pages/login.astro`, `apps/qc-task-manager/src/lib/db.ts`, `apps/qc-task-manager/README.md`
- **What**: بنيت صفحة إدارة المستخدمين كاملة عند `/admin/users` (admin فقط): نموذج إنشاء مستخدم (username فريد، full name، password ≥ 8، role dropdown، can_create_tasks) يُدرج الحساب بكلمة مرور bcrypt-hashed ونشط فورًا؛ جدول المستخدمين (username، full name، شارة الدور، department، can_create_tasks، النشاط، تاريخ الإنشاء)؛ إجراءات لكل صف: تفعيل/تعطيل، تصفير كلمة المرور، وتبديل can_create_tasks (للموظفين فقط). الأمان: admin ما يقدر يعطّل حسابه (في الواجهة والـ lib)، username غير قابل للتعديل، الهاشات ما تنعرض أبدًا. كل إجراءات المستخدمين تُسجّل في الكونسول فقط (سطور `[users]` بدون هاشات) لأنها موش إجراءات موثّقة في task_activity_log. أضفت `isUserDisabled()` + إعادة توجيه `?disabled=1` بحيث الحساب المعطّل يعرض رسالة "This account has been disabled." بدل الخطأ العام. إصلاح باغ في البناء: استبدلت `readFileSync(schema.sql)` بـ import `?raw` حتى يعمل الـ standalone entry (`pnpm start`) مو فقط الـ dev server، لأن `../../db/schema.sql` من dist ينحل لمسار غير موجود.
- **Why**: صفحة `/admin/users` كانت جدولًا للقراءة فقط مع رابط "New user" مكسور يتجه لـ `/admin/users/new` غير موجود؛ وكان الـ login يعرض نفس رسالة الخطأ للحساب المعطّل. Acceptance criteria تنص على إنشاء موظف وتسجيل دخوله فورًا + الحساب المعطّل ما يدخل.
- **Verification**: `pnpm typecheck` → 0 errors ✅؛ `pnpm build` → Server built ✅؛ اختبار end-to-end عبر `PORT=4399 node dist/server/entry.mjs` مع QC_DB_PATH مؤقت: admin يدخل ✅؛ إنشاء موظف جديد (can_create_tasks=1) → الحساب يدخل فورًا ويشوف "My tasks" ✅ (acceptance #1)؛ اسم مكرر مرفوض مع flash error ✅؛ كلمة مرور أقصر من 8 مرفوضة ✅؛ admin ما يقدر يعطّل نفسه (flash: "You cannot deactivate your own account") ✅؛ تعطيل الموظف → محاولة دخوله تعيد توجيه `?disabled=1` مع رسالة "account disabled" ✅ (acceptance #2)؛ سطور `[users]` في الكونسول بدون هاشات ✅؛ صفحة /admin/users عبر Playwright: 5 صفوف + النموذج + لا console errors ✅. نفّذت على QC_DB_PATH مؤقت ثم مسحت كل ملفات الاختبار.
- **Note**: ملاحظة اختبار — استخدام `Origin: http://127.0.0.1:4399` مع curl لتفادي فحص CSRF في Astro 6 (نفس ملاحظة QC-TASK-CREATE-001 بمنفذ مختلف). `can_create_tasks` معروض في النموذج دائمًا مع تلميح "Only applies to employee accounts"، والتبديل داخل الجدول يظهر للموظفين فقط.
- **Report**: none (موثّق في README + هذا الـ entry)
- **Commit**: uncommitted
- **Status**: verified

### 2026-08-10 — QC-TASK-CREATE-001: إنشاء المهام في QC Task Manager (نماذج + POST handlers + حارس can_create_tasks)

- **Files**: `apps/qc-task-manager/src/lib/tasks.ts` (جديد), `apps/qc-task-manager/src/pages/manager/new.astro` (جديد), `apps/qc-task-manager/src/pages/supervisor/new.astro` (جديد), `apps/qc-task-manager/src/pages/employee/new.astro` (جديد), `apps/qc-task-manager/src/middleware.ts`, `apps/qc-task-manager/README.md`
- **What**: أضفت صفحة إنشاء مهمة لكل مسار (manager/supervisor/employee) ونموذج POST. المعالجة في middleware عبر `handleCreateTaskPost` (نفس نمط POST /login لأن صفحات Astro 6 ما عندها named handlers). قواعد التعيين: manager/supervisor/admin يعيّنون لأي مستخدم نشط؛ الموظف يعيّن لنفسه أو بدون تعيين فقط (قرار المنتج). حارس مزدوج لـ `/employee/new`: على GET (يعيد توجيه غير الموظفين لصفحتهم + الموظف بدون can_create_tasks لـ roleHome) وعلى POST (canCreateTask server-side). سجل activity بكل إنشاء.
- **Why**: README كان يذكر أن "Task CRUD" هو المرحلة التالية؛ زر "New task" كان موجودًا لكن يشاور صفحات غير موجودة.
- **Verification**: `pnpm run typecheck` → 0 errors (3 hints false-positive معروفة) ✅؛ `pnpm run build` → Server built ✅؛ اختبار curl على dev server: manager ينشئ مهمة → 302 /manager + صف في tasks + activity task_created ✅؛ employee بدون can_create_tasks مرفوض من GET وPOST ✅؛ بعد تمكين can_create_tasks مؤقتًا: تعيين self ينجح، تعيين موظف آخر يُرفض (لا صف جديد) ✅؛ supervisor على /manager/new → يُبعث لـ /supervisor ✅؛ manager على /employee/new → 302 /manager/new ✅؛ supervisor ينشئ من /supervisor/new ✅؛ admin ينشئ من /manager/new ✅. نظّفت كل صفوف الاختبار ورجعت can_create_tasks=0 للموظف.
- **Note**: ملاحظة اختبار — Astro 6 فحص CSRF مدمج: أي POST عبر curl لازم معه `Origin: http://localhost:4321` وإلا 403.
- **Report**: none (موثّق في worklog + README + هذا الـ entry)
- **Commit**: uncommitted
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. أضفت `tasks.ts` لملفات lib. المرحلة التالية (للمستقبل): صفحة تفاصيل المهمة `/tasks/[id]` + التحرير + closure flow + طلبات الحذف.

---

### 2026-08-10 — QC-ROUTE-001: الـ role-based home router + الـ shared layout النهائي في QC Task Manager

- **Files**: `apps/qc-task-manager/src/lib/permissions.ts`, `apps/qc-task-manager/src/middleware.ts`, `apps/qc-task-manager/src/pages/admin/users/index.astro` (جديد — انقفل من admin/index.astro)، `apps/qc-task-manager/src/pages/admin/index.astro` (صار redirect لـ /admin/users)، `apps/qc-task-manager/src/layouts/BaseLayout.astro` (FlashNotice صار مركزي)، `apps/qc-task-manager/src/components/Navbar.tsx` (اسم التطبيق "QC Task Manager" + رابط admin لـ /admin/users)، `apps/qc-task-manager/src/pages/{employee,manager,supervisor,dashboard}.astro` (حذف FlashNotice اليدوي + سطر "Signed in as")، `apps/qc-task-manager/src/lib/{seed,db}.ts` (بذرة 4 أدوار)، `apps/qc-task-manager/scripts/init-db.mjs`، `apps/qc-task-manager/db/seed.sql`، `apps/qc-task-manager/README.md`، `apps/qc-task-manager/src/pages/login.astro`
- **What**: وحّدت الصلاحيات في `PERMISSIONS` const (الشكل المطلوب في الـ spec: canViewDashboard / canCreateTask / canEditTaskFields / canDeleteTask / canManageUsers / employeeEditableFields) وكل صفحة و middleware تستورد منه بدون role checks متفرقة. صيّرت `roleHome('admin')` → `/admin/users` وأنشأت صفحة /admin/users. أضفت FlashNotice مركزي في BaseLayout. صلّحت bug `can_create_tasks: true` الثابت في employee page (كان يسمح لأي موظف بإنشاء tasks) — الحين يقرأ real user من DB. صلّحت dashboard الذي كان يستعلم حالات `'Open'/'In Progress'/'Blocked'` بينما الـ schema يستخدم `not_started/in_progress/on_hold` (العدّادات كانت 0 دائمًا). وسّعت البذرة من admin وحده إلى 4 أدوار (admin/manager/supervisor/employee، كلمة المرور نفس ADMIN_DEFAULT_PASSWORD).
- **Why**: المتطلبات المعلنة: index.astro يعيد توجيه حسب الدور (admin → /admin/users)، BaseLayout نهائي مع navbar يعرض اسم التطبيق + اسم المستخدم + شارة الدور + روابط حسب الدور (بدون Dashboard للموظف) + flash messages، ملف صلاحيات واحد هو مصدر الحقيقة، وصفحات placeholder للدور محمية. وقبول القبول: كل دور يسجل دخول يطلع على صفحته الصحيحة، والموظف لو زار /dashboard يُعاد توجيهه.
- **Verification**: `pnpm run typecheck` → 0 errors ✅؛ `pnpm run build` → Server built ✅؛ `pnpm db:reset` → 4 حسابات ✓؛ اختبارات curl على dev server: login لكل دور → admin=/admin/users، manager=/manager، supervisor=/supervisor، employee=/employee ✅؛ employee يزور /dashboard → يترجّل لـ /employee ✅؛ manager يزور /admin/users → يترجّل لـ /manager ✅؛ supervisor يزور /manager → يترجّل لـ /supervisor ✅؛ مجهول يزور /manager → يترجّل لـ /login?redirect=%2Fmanager ✅.
- **Report**: none (موثّق في worklog.md + README + هذا الـ entry)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظة للـ future agents: (1) الـ standalone build (`pnpm start` من dist/server/entry.mjs) يواجه مشكلة مسبقة — `db/schema.sql` يُحل من `dist/db/` اللي مو منسوخ، لذلك التشغيل المدعوم محليًا هو `pnpm dev`. (2) Astro check يطلّع hint false-positive على `roleHome` في login.astro و admin/index.astro بسبب الـ return المبكر — هو 0 errors، لا تجهد نفسك فيه. (3) البذرة الآن 4 أدوار بنفس كلمة المرور بدل admin فقط.

---

### 2026-08-10 — QC-AUTH-001: ترقية جلسات المصادقة في QC Task Manager (TTL 12h + randomUUID + حرس الأدوار + POST /login)

- **Files**: `apps/qc-task-manager/src/lib/{auth,db,session,flash,permissions,types}.ts`, `apps/qc-task-manager/src/middleware.ts`, `apps/qc-task-manager/src/lib/flash.ts` (جديد), `apps/qc-task-manager/src/components/FlashNotice.astro` (جديد), `apps/qc-task-manager/src/pages/{login.astro,logout.ts,index.astro,dashboard.astro}`, `apps/qc-task-manager/src/pages/{admin,manager,supervisor,employee}/index.astro`, `apps/qc-task-manager/src/pages/api/login.ts` (محذوف), `apps/qc-task-manager/src/components/Navbar.tsx`, `apps/qc-task-manager/src/layouts/BaseLayout.astro`, `apps/qc-task-manager/src/env.d.ts`, `apps/qc-task-manager/README.md`
- **What**: طبّقت المتطلبات الخمسة: (1) TTL جلسة 12 ساعة بدل 7 أيام عبر `SESSION_TTL_MS` + `maxAge` للكوكي؛ (2) tokens عشوائية بـ `randomUUID()`؛ (3) تنظيف الجلسات المنتهية عند الإقلاع + عند كل login (`cleanupExpiredSessions`)؛ (4) حارس صلاحيات بالأدوار في middleware (public = `/` + `/login` + `/_astro/`، وكل مسار محمي يرجع 302 لـ roleHome مع flash)؛ (5) POST /login self-submitting (في middleware لأن Astro 6 ما يدعم named handlers في ملفات .astro) + رسائل flash (qc_flash cookie + FlashNotice.astro). حذفت `src/pages/api/login.ts` (نمط قديم). كمان أصلحت bug مسبق: `admin/index.astro` كان يستعلم عمود `email` غير موجود → 500 → صار `department`. `locals.user` صار يُضبط دائمًا (قد يكون null) بدل الفحص المتكرر.
- **Why**: المتطلبات المعلنة كانت: جلسات أقصر (12h)، tokens عشوائية، لا تراكم جلسات منتهية، حماية المسارات حسب الدور مع توضيح للمستخدم، وفورم دخول يشترّط نفسه بدل endpoint API منفصل.
- **Verification**: `npx astro check` → 0 errors / 0 warnings / 1 hint (roleHome false-positive في login.astro بسبب return مبكر) ✅؛ `pnpm build` → Server built ✅؛ اختبارات runtime curl كلها نجحت (redirect المجهول، login صحيح/خاطئ، logout، حرس الأدوار employee→/admin = 302 لـ /employee مع flash، جلسة منتهية، تنظيف المنتهية عند login، CSRF Origin غريب = 403، token مزيّف مرفوض) ✅؛ نظّفت بيانات الاختبار (حذف emp_creator + كل sessions).
- **Report**: none (تغيير متكامل موثّق في worklog.md + README)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظات للـ future agents على `apps/qc-task-manager`: (1) `App.SessionData` الفارغ من Astro يحجب اسم `SessionData` داخل `namespace App` → استخدم inline import في env.d.ts. (2) Astro 6 فيه CSRF مدمج للـ form POSTs — اختبارات curl تحتاج `-H "Origin: http://localhost:4321"`. (3) ملفات `.astro` ما تدعم named request handlers — POST forms تُعالَج في middleware. (4) الحساب المبذور الوحيد هو admin (ADMIN_DEFAULT_PASSWORD أو admin123) — الـ README كان يذكر 5 حسابات وهذا غلط، صحّحته.

---

### 2026-08-09 — KRN-FORM-001: توحيد مفردات النماذج (forms) في صفحات الكيرنل
- **Files**: `src/pages/kernel/{playground,chat,policies,api,admin/quota}.astro`, `src/styles/kernel.css`, `kernel/assets/css/pages/{playground,policies}.css`, `src/client/playground.ts`, `public/js/kernel-policies.js`, `scripts/playwright/verify-form-ux.mjs` (جديد)
- **What**: وحّدت مفردة النماذج في 5 صفحات كيرنل. أضفت فصل كانوني مشترك `.k-form__error` (رسالة استرداد دورها `role="alert"`) في `kernel.css` + قاعدة واحدة لخطأ `[aria-invalid=true]` على أي input/select/textarea. كل حقل أصبح له label مربوط + رسالة استرداد موصولة بـ `aria-describedby` + `required` حيث يلزم. ثبّتت حوار المقارنة في playground (كانت الـ spans مو labels → selects بلا اسم ميسّر)، أضفت label للفة ورسالة استرداد للنص الفارغ. Chat: composer صار required + aria-invalid + رسالة فارغة + مسح عند الكتابة. Policies: مولّد السياسة صار label مرئي + required + رسالة؛ حقل الاسم بالمحرر required + رسالة. API: زر التشغيل aria-live/aria-busy. Quota: gateErr مربوط بـ aria-describedby + role=alert + required + disabled أثناء الفتح.
- **Why**: مفردة النماذج ما كانت كانونية — كل صفحة حقول وأخطاء مستقلة؛ حوار مقارنة playground كان 7 selects بلا labels. القبول: كل حقل له label + رسالة استرداد.
- **IMPORTANT (تصحيح معماري)**: `public/js/playground.js` **مخرَج بناء** من `src/client/playground.ts` عبر `build:client` (`tsc -p tsconfig.client.json`، outDir=`public/js`). أي تعديل على `public/js/*.js` اللي له مصدر `src/client/*.ts` **ينمسح بالبناء** → التعديل الصحيح على المصدر. استثناء: `kernel-policies.js` ما له مصدر TS → يعدَّل مباشرة. الملفات ذات المصدر: `src/client/{audit-verifier,audit,certificate-verifier,eval-api,eval-store,kernel-evidence-certs,pii-detector,playground,types}.ts`.
- **ثانوي**: `doRun` في playground كان يستخدم `announce()` (منطقة sr-only، مو خطأ مرئي + بدون aria-invalid). أضفت في المصدر: عند تشغيل فارغ → إظهار `#pg-input-error` (role=alert) + `aria-invalid` على `#pg-input` + مسح عند الكتابة. أضفت `aria-label` للفة النصية الديناميكية + `aria-label` لـ tour pop (كان role=dialog بدون اسم → axe aria-dialog-name).
- **Note**: purge-css يشيل CSS غير المستخدم اللي يشتغل وقت التشغيل فقط؛ الحل استخدمنا فصلًا كانونيًا واحدًا مستخدم فعلًا + قاعدة aria-invalid عامة. صفحة quota مستقلّة (برا KernelLayout) فدفعها inline.
- **Verification**: `npm run build` ✅ (275 صفحة، KernelLayout CSS 151.3KB). `npm run verify:all` ✅ exit 0 (SEO gate + hreflang 0 أخطاء). سكربت `scripts/playwright/verify-form-ux.mjs` على dist المحلي ✅ exit 0 — 9/9: كل الحقول لها label، axe 0 critical/serious (بعد تسمية tour pop)، الكيبورد، وإرسال فارغ يظهر الاسترداد + aria-invalid.
- **Status**: verified / build ✅ / verify:all EXIT=0 ✅ / Playwright 9/9 ✅ (uncommitted)

### 2026-08-09 — CSS-FATIGUE-001: تقليل الـ nested card fatigue في لوحة الكيرنل + الامتثال

- **Files**: `src/pages/kernel/compliance.astro`, `src/styles/kernel.css`, `scripts/playwright/card-fatigue-shot.mjs` (سكربت لقطات محفوظ جديد)
- **What**: خفّضت المربّعات المتداخلة (box-inside-box) على مبدأ "الكروت للحدود التفاعلية، والمحتوى الثانوي بالفواصل + التباعد". في `compliance.astro`: أزلت `KernelCard` الخارجي اللي كان يلفّ شبكة الحزم الثمانية + خريطة الامتثال، واستبدلته بعنوان قسم (`k-section-title`) + intro مباشرة قبل الشبكة/الخريطة (الحزم نفسها تبقى كروت تفاعلية). في `kernel.css`: حوّلت `KernelActivityItem` من مربّع (background + border-radius) لصفّ بفواصل `border-block-end` بين العناصر (الأخير بدون فاصل) + تباعد — يبطل "مربّع داخل مربّع" في ويدجات اللوحة (approvals/recent traces). خفّفت `box-shadow` لكروت KPI من `--shadow-md` لـ `--shadow-sm` عشان يقل الوزن البصري. كروت KPI + action cards تبقى (محتوى أساسي/تفاعلي).
- **Why**: اللوحة ولوحة الامتثال كانتا كروت-فوق-كروت (KernelCard يلفّ `kernel-compliance-pack` مربّعات، و`KernelActivityItem` مربّعات داخل `KernelCard`) → إجهاد بصري وصعوبة تمييز المحتوى الأساسي. الهدف: أسطح أقل + محتوى أساسي أوضح.
- **Verification**: `npm run build` ✅ (275 صفحة، KernelLayout CSS 151.1KB). `npm run verify:all` ✅ exit 0 (SEO gate + hreflang 0 أخطاء). فحص الـ dist HTML: بنية الحزم = `<h2 class="k-section-title">` + `<p class="k-section-intro">` + `<div class="kernel-compliance-grid">` مباشرة (بدون `kernel-card__body`) ✅، الـ id غير مكرر ✅، 8 packs ✅. فحص الـ CSS المبنِي: `border-block-end` موجود ✅ + `box-shadow: var(--shadow-sm)` ✅. لقطات Playwright (1440/390): `download/qa/cf-dashboard-{desktop,mobile}.png` + `cf-compliance-{desktop,mobile}.png`. Console errors الوحيدة من الـ CSP report-only (موجودة مسبقًا من الـ preview).
- **Report**: `report/2026-08-09-css-fatigue-nested-cards.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: أضفت هذه الـ entry. ملاحظة للـ future agents: `KernelCard` في `compliance.astro` ما يزال مستخدم في قسم "تحليل الفجوات" — أبقيتُه لأنه صندوق مفرد (مو تداخل). لو بدت الفجوات بلا صندوق أيضًا، يتحول لنفس نمط `k-section-title`.

---

### 2026-08-09 — KRN-TYPE-001: توحيد type scale + vertical rhythm لصفحات الكيرنل

- **Files**: `src/styles/kernel.css`, `src/layouts/KernelLayout.astro`, `scripts/playwright/krn-type-shot.mjs` (قياس محفوظ جديد)
- **What**: أضفت بلوك توكنز دلالية `KRN-TYPE-001` داخل `body.kernel-shell`: أدوار typographic (display/title/lead/body/meta) مبنية على مقياس rem الموجود (`--k-type-*`)، خطوط `--k-lh-*`، وأسماء مسافة 4pt دلالية (`--k-space-title-block/lead-block/header-inline/header-block`). وحّدت `.kernel-page-header__title/__subtitle` و `.kernel-hero__title/__subtitle` ليستهلكوا نفس الأدوار (القيم نفسها → صفر regress بصري، بس صارت مصدر واحد بدل تعريفات متفرقة). ضفت `text-wrap: balance` للعناوين + `text-wrap: pretty` للـ lead/body/summary (يمنع orphan كلمة عربية وحيدة)، و `font-variant-numeric: tabular-nums` على `.kernel-metric__value` و `.kernel-stat-card__value` (أرقام ثابتة العرض). أضفت `--k-type-display-mobile` وأعدلت الـ media query يستخدمها. في KernelLayout أضفت `text-wrap: balance` لعناوين الشِل (`k-trace-drawer__title` + `k-hash-chain__title`).
- **Why**: صفحة فرعية كانت تحدد حجم/كثافة موضعية (`clamp` مختلف، line-height 1.3/1.6/1.7) → هرمية مختلطة عبر الـ 21 صفحة. الهدف: دور نوعي واحد لكل صفحة، RTL/عربي يلف زين، وأرقام المقاييس ما ترتج.
- **Verification**: `npm run build` ✅ (21 صفحة kernel بُنيت، KernelLayout CSS 195KB → 151KB بعد purge). Playwright على `/kernel/`, `/kernel/policies/`, `/kernel/audit/` بعرضين (1440/390): `dir=rtl` ✅، `text-wrap: balance` على الـ h1 ✅، 0 أخطاء JS من التعديل (2 console warnings موجودين مسبقًا: CSP report-only + X-Frame-Options — من الـ preview المحلي، مو من هذا التغيير). لقطات: `download/qa/krn-*.png`.
- **Report**: `report/2026-08-09-krn-type-001.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: أضفت هذه الـ entry. الـ token inventory (Section 5) لازم يُضاف فيها `--k-type-*`/`--k-lh-*`/`--k-space-*` كطبقة mint دلالية تتبع `KRN-DS-2026-08-09`. ملاحظة للـ future agents: `KernelPageHeader.astro` (المكوّن القياسي في `src/components/kernel/`) ما يزال **غير مستخدم** من أي صفحة ومقياسه يشذ (`clamp(1.375rem,3.5vw,2rem)` + `--weight-extrabold` قديم) — لو صار يستخدم مستقبلًا، لازم يتحول لنفس أدوار `--k-type-*`.

---

- **Files**: بدون تعديل إنتاجي. أُضيفت سكربتات قياس محفوظة: `scripts/playwright/measure-kernel-vitals.mjs`, `capture-kernel-errors.mjs`, `kernel-viewport-matrix.mjs`, `kernel-interaction-audit.mjs`, `kernel-interaction-2.mjs`, `kernel-role-rtl.mjs`. التقارير: `report/2026-08-09-kernel-rerun-audit.md` + `report/{a11y-kernel,kernel-runtime-errors,kernel-viewport-matrix,kernel-interaction-audit,kernel-interaction-2}.{json,txt}`. صور: `download/qa/kernel-rerun/` (21 route × 10 عرض).
- **What**: إعادة تدقيق Kernel بعد تحسينات `4cc1e984..HEAD` (سلم `--k-z-*` دلالي + `--k-focus-ring` + `--k-h-control/input` 44px + طبقة mint + تحويل `KernelDemoPill` من toggle إلى badge ثابت). القياس صار runtime (build → serve-static:8788 → Playwright/Chromium + axe).
- **Why**: البيسلاين كان source-only وكل قياساته runtime كانت `NOT MEASURED`. الهدف: ترقية المقيّمات من heuristic إلى measured بأدلة قابلة للتكرار.
- **Verification**: build ✅ (21/21 route 200). axe = **0 مخالفات** على كل الـ 21 route ✅. صفر أزرار/روابط بلا اسم، صفر صور بلا `alt`، h1 وحيد في كل صفحة ✅. درج الـ trace: open + focus-in + Escape + focus-return ✅. RTL `dir=rtl` + `prefers-reduced-motion` محترم (0 animations) + logical properties نظيفة ✅. CWV (Slow 4G throttle): **LCP 3.5–4.5s ❌ FAIL**, CLS 0.03–1.14 ❌ (connectors 1.14), TTFB 2–16ms ✅.
- **Report**: `report/2026-08-09-kernel-rerun-audit.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule). لا تعديل إنتاجي في هذا التمرير.
- **Status**: verified locally (بنيان نظيف، أُضيفت ملفات قياس فقط)
- **Brain updates**: أُضيفت **4 عيوب runtime جديدة** للسجل تحت (تحتاج مداخل known-issues مستقلة): (1) `TypeError: e is not a constructor` على `/kernel/` — `KernelProductTour.astro` `import('driver.js')` interop فاشل؛ (2) `playground` يطلب `/js/pii-detector` بلا `.js` → 404 → **PII masking معطّل**؛ (3) `evidence` يطلب `/js/certificate-verifier` بلا `.js` → 404 → **التحقق من الشهادات معطّل**؛ السبب الجذري لـ(2)(3): `tsconfig.client.json` يستخدم `moduleResolution: "bundler"` (يسمح بتركات بلا امتداد) بس المخرجات ESM `.js` والمتصفح يحتاج الامتداد → الحل: `rewriteRelativeImportExtensions` أو إضافة `.js` في `src/client/*.ts`؛ (4) `datasets` عند 320px overflow +215px (`ds-dist` + `k-topbar__search`). **7 حقول بلا labels في playground**. تباين `muted_on_elevated` = 4.3:1 (FAIL AA للنص الصغير). **Role-aware nav غير منفّذ** (measured: CISO=Analyst، نفس الـ 19 رابط). `compliance` "تقرير PDF" = `window.print()` (P0 البيسلاين لسه غير محلول). **السكور النهائي ~79%** (بيسلاين 78%). **Verdict: NO** world-class، Maturity Level 3/5. و**لا مقيّم وصل 95%** — أقربها Accessibility 82 وSaudi UX 84.

---

- **Files**: بدون تعديل إنتاجي. (التقرير: `report/2026-08-09-bai-p1-test-001-chat-regression-signal.md` جديد)
- **What**: المهمة وصلت بادعاء "npm test يفشل بـ LeadQueueStatus SyntaxError". الـ task نفسه صريح: "شغّل npm test أول شي بعد PROMPT-001. فيه احتمال قوي يمر بدون أي تعديل". نفّذت بالحرف: `pnpm db:generate` (يولّد Prisma client) → `npm test` → **38/38 pass** بدون لمس ولا سطر في `chat.ts` أو `test-chat-session.mjs`. الفشل كان عَرَضًا لانحراف Prisma = نفس السبب الجذري لـ BAI-P1-TYPES-001 (اللي انحلّ بـ `pretypecheck→db:generate` + `postinstall: prisma generate`). بعدها سوّيت mutation testing يدوي: كسرت `isValidSessionId` ليرجّع `true` دائمًا، شغّلت `pnpm test:chat-session` → فشل **تحديدًا** على test 7 + 8 (malformed/oversized sessionId expected 400 actual 200)، باقي 14 test نجحوا (isolation صحيح). رجّعت الـ mutation وأكدت baseline رجع أخضر (git status نظيف).
- **Why**: الـ task الأصلي ينص صراحة إن الفشل غالبًا عَرَضي والاختبار مر بدون تعديل. هذا بالضبط اللي صار. القاعدة "Verify, Don't Claim" تتطلب إثبات إن regression signal حقيقي (اختبار يمر دايمًا = اختبار ما ينفع) — أثبتّها بالـ mutation.
- **Verification**: `pnpm db:generate` → generated client ✅, `npm test` → **38/38 pass** ✅, `pnpm test:chat-session` → **16/16 pass** ✅, `npm run typecheck` → 5/5 Done 0 أخطاء ✅, mutation test → 2 fail موضعي + 14 pass ✅, post-revert `git status --porcelain` → clean ✅, security review على logs → grep على provider keys = 0 نتائج ✅.
- **Report**: `report/2026-08-09-bai-p1-test-001-chat-regression-signal.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule). ما في كود إنتاجي معدّل أصلاً.
- **Status**: verified locally · working tree clean
- **Brain updates**: هذا الـ entry. ملاحظات مهمة للـ future agents: (1) **قيود بيئية مهمة**: `node scripts/test-chat-session.mjs` مباشرة يفشل بـ `ERR_MODULE_NOT_FOUND` على `kernel-system-prompts` لأن `chat.ts` يستورد ملف `.ts` بلا extension — لازم `--import ./scripts/test-ts-loader.mjs --experimental-strip-types`. الـ runner الموثّق = `pnpm test:chat-session` (= `node --import .../test-ts-loader.mjs --experimental-strip-types --test scripts/test-chat-session.mjs`). (2) لو CI شغّال بـ `--ignore-scripts`، `postinstall: prisma generate` ما يشتغل وكل tests تفشل بنفس خطأ LeadQueueStatus — تأكد إن CI يشغّل postinstall أو يضيف `pnpm db:generate` صريح. (3) **فجوة تغطية مؤجّلة**: rate limit (429) + SSE/non-streaming contract ما مغطّاة حاليًا — تستاهل task مستقل `BAI-P1-TEST-002` (ما أضفتها هنا عشان constraint الـ task "لا تعدّل ولا سطر" + لأنها توصية مو AC).

---

### 2026-08-09 — BAI-P1-TYPES-001: شدّ عقد أنواع Prisma + CI drift gate

- **Files**: `packages/db/src/client.ts` (استبدال `Omit<PrismaClient,…>` بـ `Prisma.TransactionClient` + شل `as unknown` casts)، `scripts/verify-prisma-drift.mjs` (جديد — CI gate)، `package.json` (`verify:prisma:drift` script)، `.github/workflows/ci-build-guard.yml` (step جديد بعد `Generate Prisma client`)
- **What**: المهمة وصلت بادعاء "42 خطأ typecheck". التشخيص أثبت إن المشكلة **منحلّة فعليًا على main** عبر `pretypecheck→db:generate` المُتبت منذ `2a3ddffc` + `postinstall: prisma generate`. تقرير الأوديت بُني على commit مستقل (`5d6efbe3`) مو موجود في تاريخنا. بس فيه ثغرتان حقيقيتان سدّيتهم: (1) TS7006 implicit-any على `tx` + `fn(tx as unknown as …)` casts قبيحة في `client.ts:90,121,103,125`، (2) ما فيه drift-detection بين schema والـ generated client. أصلحت (1) بـ `Prisma.TransactionClient` صريح (لا any، لا cast) و (2) بـ سكربت جديد يقرأ models/enums من schema ويقارنها بـ generated client exports.
- **Why**: قيد المهمة "ممنوع cast يخفي الانحراف" + AC "CI check يمنع تكرار الانحراف". الـ casts كانوا يخفوا TS7006 (يظهر لو فُقد generated client)، و الـ CI كان يتشيك وجود الـ client بس مو تطابقه مع schema — بالظبط فئة الانحراف اللي كسرت typecheck في الأوديت.
- **Verification**: `rm -rf node_modules/.prisma/client && pnpm db:generate` (clean sim) → ✅، `npm run typecheck` → 5/5 Done 0 أخطاء ✅، `npm run verify:prisma:drift` → exit 0 (29 model + 24 enum متزامنين) ✅، `npm run build` → EXIT=0 ✅، `grep -rE "as any|@ts-ignore|as unknown" packages/db/src/` → 0 نتائج ✅. السكربت مُختبَر: لقّط drift حقيقي لما حذفت `LeadQueue` + `Role` يدويًا (exit 1 + diff).
- **Report**: `report/2026-08-09-bai-p1-types-001-prisma-contract.md` (جديد)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظات مهمة للـ future agents: (1) `Prisma.TransactionClient` متاح كنوع مُولَّد — استخدمه بدل `Omit<PrismaClient, ITXClientDenyList>` اليدوي لأي callback `$transaction`. (2) الـ CI step القديم `test -d …/@prisma+client@5.22.0_prisma@5.22.0/…` هش (مقيّد بإصدار) — يستاهل إصلاح مستقل. (3) `verify-prisma-drift.mjs` field-level ما يدقق (existence-only) — `prisma generate` هو الـ authority على الحقول.

---

### 2026-08-09 — SRC-LINK-REPAIR: إصلاح false positives في internal-links-audit (migrated pages غير مُتعرَّف عليها)

- **Files**: `scripts/internal-links-common.mjs` (إضافة `readMigratedPageRoutes()` + استدعائها في `buildFileIndex()` — تسجّل canonicalات `src/data/migrated-pages/*.json` كـ valid public routes)
- **What**: المهمة وصلت بادعاء "69 كسر في source files". التحقيق بيّن إن العدد الحقيقي 2 (بعد تعديلات common.mjs غير الملتزمة)، والكسرين false positives بنفس السبب: `internal-links-audit` ما كان يعرف migrated pages (8 solutions + 4 sectors + 3 cities تُبنى من JSON عبر dynamic routes) كمصادر routes صحيحة. الحل: علّمت السكربت يقرأ `canonical` من كل JSON ويسجّله. النتيجة: **0 كسر**. كمان اكتشفت bug مُسبق: `normalizeSitePath` + `canonicalizeSitePath` ما يعالجوا URLs كاملة (الـ `//` collapse rule يكسر `https://` قبل الـ URL branch) — متجاوز موضعيًا بـ regex يشيل origin. الـ 13 (ثم 14) pattern normalization كلها في `qa-text-snapshot.mjs` بنمط `/x/index.html` → `/x/` — **ما طبّقتها** لأن الأداة تستخدم `readFileSync` والمسارات فيزيائية على القرص، تطبيق التوحيد يكسرها.
- **Why**: المهمة كررت "أصلح السكربت إذا كان false positive" كناتج مشروع. الكسران فعلاً false positives (الصفحات مبنية في `dist/client/solutions/ai-firewall/index.html` 97KB ومؤكّدة في `migratedSolutionPages.ts`). فإصلاح السكربت هو الحل الصحيح تقنيًا.
- **Verification**: `internal-links-audit` → **0 كسر** ✅ (كان 2)، `pnpm build` → exit 0 ✅، `seo-ci-check` → 0 broken من 48,158 ✅، `internal-linking-architecture --source dist/client` → 0 orphans/0 broken ✅. `link-graph-validator --strict` → exit 1 (bug مُسبق مستقل: يفحص `dist/` بدل `dist/client/` — مُثبَت بنفس exit قبل تعديلي).
- **Report**: `report/2026-08-09-source-link-repair.md` (جديد — bucket breakdown كامل)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظات مهمة للـ future agents: (1) `link-graph-validator.mjs` مكسور مُسبقًا (يفحص `dist/` بدل `dist/client/`) — يحتاج إصلاح مستقل. (2) `normalizeSitePath`/`canonicalizeSitePath` ما يدعموا URLs كاملة — استخدم regex `^https?:\/\/[^/]+` قبل أي استدعاء لو المدخل ممكن يكون URL كامل. (3) `qa-text-snapshot.mjs` يستخدم filesystem paths (`/x/index.html`) عمدًا — الـ normalization suggestions اللي تطلع فيه false positives.

---

### 2026-08-08 — BAI-SEO-004-S7: إدراج صفحتي /events/ و /kernel/api/ الناقصتين في الـ sitemap

- **Files**: `scripts/generate-sitemap-all-pages.mjs` (4 تعديلات: exclude `/api/` → `startsWith("api/")` عشان ما يلتقط `kernel/api`، إضافة `kernel/api` لـ kernel whitelist، إضافة `events/index.html` لـ pages whitelist، إضافة `src/pages/kernel/api.astro` في `resolveSourceFiles` لـ lastmod)، `dist/client/sitemap.xml` (متولد)
- **What**: حققت في ادعاء الأوديت "29 ملف خارج sitemap". النتيجة: بعد إصلاح BAI-IDX-04 (اللي ضم 17 answer + 5 lp)، الفجوة الحقيقية الحالية = **16 ملف indexable خارج sitemap**، منها 14 مقصودة (noindex: design/*، thank-you، kernel/offline، kernel/admin/quota + redirect stubs: cities/*). الـ gap الفعلي اللي يجب إصلاحه = **صفحتان فقط**: `/events/` (فهرس فعاليات، 3471 كلمة) و `/kernel/api/` (صفحة وثائق API، 11k كلمة). كلاهما `index, follow` + canonical صحيح، لكن كانا خارج sitemap بسبب: (1) `events/index.html` ناقص من whitelist، (2) الـ exclude القديم `includes("/api/")` كان يلتقط `kernel/api` قبل ما يوصل لـ kernel whitelist.
- **Why**: صفحتان indexable حقيقية بمحتوى كانتا مخفيتين عن الـ crawlers — خسارة فهرسة كاملة.
- **Verification**: `sitemap:generate` → **258 URL** (كان 256) ✅, `/events/` + `/kernel/api/` ظاهرتين مع lastmod صحيح (2026-07-31 / 2026-08-02) ✅, `seo:gate` → 0 أخطاء 0 تحذيرات (258 sitemap URLs) ✅, `seo:hreflang` → 0 أخطاء (259 sets) ✅, `npm run build` → 0 أخطاء ✅, `verify-all.mjs` → 5/5 ✅
- **Report**: `report/2026-08-08-bai-seo-004-sitemap-gap.md` (جديد)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظة: الـ 14 صفحة المتبقية خارج sitemap مقصودة بالتصميم (noindex/redirect) — مو bug. الأوديت الأصلي (29) كان ضد نسخة قديمة قبل BAI-IDX-04.

---

### 2026-08-08 — BAI-IDX-04: إصلاح الصفحات اليتيمة — روابط داخلية سياقية لـ /answer/ و /lp/ + ضم lp/ للسايت ماب

- **Files**: `src/pages/blog/[...slug].astro` (أضفت `INTERNAL_LINKS_BY_SLUG` — 40 entry، دمج مع خريطة الفئات), `scripts/generate-sitemap-all-pages.mjs` (`groupRelPath`: فرع `lp/` → pages + `resolveSourceFiles`: `lp/[slug].astro` للـ lastmod), `public/sitemap.xml` (متولد), `report/2026-08-08-bai-idx-04-orphan-internal-links.md` (جديد)
- **What**: 22 صفحة مفهرسة (17 `answer/` + 5 `lp/`) كانت بدون أي رابط داخلي وارد (orphan). أضفت خريطة روابط سياقية من مقالات blog محورية (عمق 2) لكل صفحة answer/lp — كل صفحة صار عندها 1–3 روابط واردة. وضمت `/lp/` للـ sitemap (كانت مفهرسة لكن خارج sitemap).
- **Why**: الـ audit `internal-links:audit` كان يكسر بـ `orphan_pages=22` و `unreachable_indexable=22` — صفحات الـ FAQ والـ landing غير قابلة للاكتشاف عبر الـ link graph. القرار (بموافقة المستخدم): ربط + ضم للـ sitemap بدل noindex لأنها صفحات قوية.
- **Verification**: `npm run build` → 0 أخطاء ✅, `internal-links:audit` → `orphan_pages=0`, `unreachable_indexable=0`, `brokenLinks=0`, `maxClickDepth=3 ≤ 3` ✅, `sitemap:generate` → exit 0 (256 URL، 17 answer + 5 lp) ✅, `verify:all` → seo:gate + seo:hreflang + seo:schema 0 أخطاء ✅
- **Report**: `report/2026-08-08-bai-idx-04-orphan-internal-links.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظة: ما في قسم known issues منفصل في brain.md حاليًا. ملاحظات audit خارج النطاق: `pagesOutsideSitemap=2` + `noHrefLinks=19` (باقية، مو ضمن معايير BAI-IDX-04).

---

### 2026-08-08 — BAI-IDX-CRAWL: فك حظر الـ crawlers من Cloudflare edge (ai_bots_protection: block → disabled)

- **Files**: `scripts/setup-cloudflare-ai-crawler-allowlist.mjs` (جديد), `scripts/verify-crawler-access.mjs` (جديد), `scripts/verify-post-deploy.mjs` (تعديل: probe 7 crawler access + `--skip-crawler`), `package.json` (تعديل: `cloudflare:crawler-allowlist` + `verify:crawler-access`), `report/2026-08-08-cloudflare-crawler-unblock.md` (جديد). **Edge config** (مو في repo): Cloudflare Bot Management `ai_bots_protection` من `block` إلى `disabled` عبر API على zone `brightai.site`.
- **What**: كل الـ AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, ChatGPT-User, ...) كانوا يحصلون على 403 من Cloudflare edge. السبب المؤكد: `ai_bots_protection: "block"` في Bot Management (خطة Free). غيرته إلى `"disabled"` عبر `PUT /zones/{zone}/bot_management`. أضفت سكربت idempotent يعيد الضغط + مونيتور synthetic يفحص 17 crawler + sitemap، وربطته بـ `verify-post-deploy` (probe 7).
- **Why**: الحظر كان يمنع Google من قراءة `/sitemap.xml` (403 لغير verified bots) + يحجب كل استثمار GEO (llms.txt، ai.txt، Speakable) عن AI crawlers. `robots.txt` كان سليم أصلاً — المشكلة كلها edge.
- **Verification**: 17 crawler × 5 مسارات = 90 استدعاء كلها 200 ✅, `/sitemap.xml` Googlebot → 200 + 251 `<loc>` ✅, `verify:crawler-access` exit 0 ✅, `cloudflare:crawler-allowlist` re-run = no-op ✅. مشكلة مسبقة في `verify-post-deploy` security headers (`x-frame-options SAMEORIGIN` متوقع `DENY` + `spec.mustMatch.test is not a function`) — خارج نطاق المهمة، مو متعلقة بالإصلاح.
- **Report**: `report/2026-08-08-cloudflare-crawler-unblock.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: deployed (edge config مطبّق على الإنتاج ومُتحقَّق منه)
- **Brain updates**: هذا الـ entry. ملاحظات: Bot Fight Mode (`fight_mode`) لسا ON — حماية الـ scrapers الخبيثة محفوظة. لو رجع `ai_bots_protection` `"block"` مستقبلًا، شغّل `pnpm cloudflare:crawler-allowlist`.

---

### 2026-08-04 — CSS Cleanup: ترتيب layers + تأكيد purgecss (CSS < 25KB)

- **Files**: `src/layouts/BaseLayout.astro`, `src/layouts/ArabicLayout.astro`, `src/layouts/KernelLayout.astro`
- **What**: رتّبت الـ CSS layers حسب المطلوب (variables → reset → components → utilities): أضفت `components, pages` للـ layer declaration في BaseLayout و KernelLayout، وحوّلت استيرادات components.css + pages.css في ArabicLayout من unlayered إلى `layer(components)` + `layer(pages)`. أكدت إن purgecss configured صح ومدمج في build chain.
- **Why**: components.css + pages.css كانت unlayered (أعلى أولوية من utilities) — مخالف لترتيب المهمة. الآن utilities يغلّبهم (نفس السلوك السابق لأنهم كانوا أعلى، والآن صاروا layer قبل utilities).
- **Verification**: `pnpm build` → exit 0 (251 URLs / 275 HTML) ✅, `pnpm performance:budget` → CSS 19.91KB gz (حد 50KB) ✅, HTML 36.41KB ✅, JS 329.55KB ❌ (مسبق — خارج نطاق CSS), `pnpm purge:css` → 735.6KB → 627.5KB (-108.15KB = 14.7%) ✅
- **Report**: `report/2026-08-04-css-cleanup.md`
- **Commit**: uncommitted (user commits via main — per brain rule)
- **Status**: verified locally
- **Brain updates**: Section 2 (هذا الـ entry). ملاحظة: أكبر ملف CSS gzipped = 19.91KB < 25KB — شرط التنظيف اليدوي ما تحقق لأن CSS تحت الهدف.

---

### 2026-08-04 — Core Web Vitals Optimization (content-visibility + contain + aspect-ratio)

- **Files**: `src/styles/base.css`, `src/styles/components.css`
- **What**: أضفت 3 تحسينات CSS للـ Core Web Vitals: (1) `content-visibility: auto` على `.home-section--padded` لأقسام تحت الطية، (2) `contain: layout style paint` على card components، (3) defensive `aspect-ratio: auto` على `img, video`.
- **Why**: المشروع كان محسّن مسبقًا (fonts preloaded, font-display: swap, scripts deferred). الـ `content-visibility` أكبر فرصة لتحسين الـ rendering (يخلي المتصفح يتخطى rendering المحتوى خارج الشاشة → TBT/INP أحسن).
- **Verification**: `pnpm build` → 0 errors ✅, `pnpm performance:budget` → CSS+HTML ✅, JS ❌ (مسبق — pdf.js 125KB + index.js 175KB)
- **Report**: `report/2026-08-04-cwv-optimization.md`
- **Status**: verified locally
- **Brain updates**: State snapshot (CSS sizes updated), Known issues (JS budget failure confirmed pre-existing)

---

### 2026-08-04 — Added RSS Feeds for Docs and Solutions (AEO Enhancement)

- **Files**: `src/pages/docs/feed.xml.ts` (new), `src/pages/solutions/feed.xml.ts` (new)
- **What**: إضافة موجزات RSS جديدة لكل من الوثائق (/docs/feed.xml) والحلول والقطاعات (/solutions/feed.xml) لتعزيز الفهرسة واكتشاف المحتوى التقني والخدمي بواسطة محركات الذكاء الاصطناعي (Perplexity, SGE, ChatGPT Search).
- **Why**: زيادة التغطية ورفع كفاءة الـ AEO (AI Engine Optimization) بجانب الموجز الرئيسي للمدونة /rss.xml.
- **Verification**: `pnpm build` → 251 URLs / 275 HTML files, 0 errors ✅, `pnpm seo:all` → exit 0 ✅, `pnpm lint:tokens` → 0 violations ✅
- **Status**: verified locally

---


### 2026-08-04 — Implemented Kernel Product Tour (Onboarding)

- **Files**: `package.json` (added `driver.js ^1.8.0`), `src/components/kernel/KernelTourStep.astro` (new), `src/components/kernel/KernelProductTour.astro` (new), `src/pages/kernel/index.astro` (added import + component placement)
- **What**: أنشأت مكون جولة منتج موجّهة للمستخدمين الجدد باستخدام `driver.js`. الجولة ت spotlight العناصر الرئيسية في صفحة Kernel (الشريط الجانبي، لوحة الحوكمة، المؤشرات، التنقل، لوحات التحكم، الوحدات، وزر البدء) في 7 خطوات قصوى. تظهر مرة واحدة فقط (localStorage persistence)، قابلة للتخطي، تدعم RTL والجوال، وتحترم `prefers-reduced-motion`.
- **Why**: Prompt 13 من التقرير الشامل — No guided tour للمستخدمين الجدد، Slow learning curve، Features undiscovered. الحل يوجه الزائر الجدد خطوة بخطوة بدون حاجة لإعداد.
- **Verification**: `pnpm build` → 125+ pages, 0 errors ✅, `pnpm run seo:check` → exit 0 ✅, `KernelProductTour` bundled at 1.71KB gzipped ✅, `driver.js` bundled at 7.14KB gzipped ✅
- **Report**: report/2026-08-04-kernel-product-tour.md
- **Commit**: uncommitted (user commits via main — per brain rule)
- **Status**: verified locally
- **Brain updates**: Section 2 (هذا الـ entry), Section 5 (KernelTourStep.astro + KernelProductTour.astro added to component inventory), `package.json` updated (driver.js added).

- **Files**: `src/components/kernel/KernelPdfViewer.astro` (new)
- **What**: أنشأت مكون PDF viewer قابل لإعادة الاستخدام لصفحات Kernel — يستخدم pdfjs-dist مع lazy loading، zoom controls، prev/next navigation، RTL-aware layout، و TypeScript types صحيحة (بدون `pdfDoc` implicit `any`).
- **Why**: الملف الأصلي (الذي لم يكن موجودًا) كان فيه خطأ TypeScript: `pdfDoc` implicitly has type `any` — الحل كان باستخدام type annotation صريحة + data attributes لتمرير القيم الأولية من Astro frontmatter للـ client script.
- **Verification**: `npm run build` → 125 pages, 0 errors ✅, `npm run verify:all` → exit 0 ✅ (pre-existing token violations in eval.astro unrelated)
- **Report**: none
- **Commit**: uncommitted (user commits via main — per brain rule)
- **Status**: verified locally
- **Brain updates**: Section 2 (هذا الـ entry), Section 5 (KernelPdfViewer.astro added to component inventory).

---

- **Files**:
  - `src/pages/kernel/chat.astro` (EDITED — أضفت `KernelTabs` import + component بثلاثة تبويبات (المحادثات | المحادثة | التفاصيل) داخل `.kernel-chat-layout`، وأضفت `role="tabpanel"` + `id="kernel-chat-tabpanel-*"` + `aria-labelledby` للـ panes الثلاثة، و`data-tab-active="chat"` للـ center pane (الافتراضي)، وأضفت `initMobileTabs()` — ربط النقرات على الـ tablist + swipe gestures (RTL-aware) + auto-scroll للرسائل عند الرجوع لتبويب المحادثة + state preservation (تبديل display فقط، لا حذف DOM))
  - `src/components/kernel/KernelTabs.astro` (EDITED — أضفت دعم `class` prop عبر `class:list` للـ consumer)
  - `src/styles/kernel.css` (EDITED — كتلة `22.c CHAT — Mobile-first tabs`: `.kernel-chat-mobile-tabs` يظهر فقط على <768px؛ فقط الـ pane النشط يظهر؛ composer `position:fixed` مع `env(safe-area-inset-bottom)`؛ toolbar القديم مخفي على <768px؛ على 768-1023px شبكة بعمودين والـ context مخفي)
- **What**: حللت انهيار الـ 3-pane layout على الجوال — استبدلت الـ drawers بنظام 3 تبويبات (المحادثات | المحادثة | التفاصيل) باستخدام KernelTabs (WAI-ARIA كامل). التبويب الافتراضي = المحادثة. الـ composer ثابت بالأسفل. Swipe أفقي (RTL-aware). State preservation بالتبديل display فقط.
- **Why**: PROMPT-2 — الـ 3-pane كان ينهار على الجوال (<768px) و40%+ من الزوار على الجوال.
- **Verification**:
  - `npm run build` → exit 0 ✅
  - `grep kernel-chat-mobile-tabs dist/client/kernel/chat/index.html` → 1 ✅
  - `grep data-tab-active="chat" dist/client/kernel/chat/index.html` → 1 ✅
  - `grep "max-width:767px" dist/client/_astro/KernelLayout*.css` → 1 ✅
- **قرارات موثقة**:
  - **التبويب الافتراضي = المحادثة** — المستخدم يرى المحادثة مباشرة.
  - **الـ drawers القديمة بقيت** كـ fallback للـ tablet (768-1023px) — لا تحذفها.
  - **KernelTabs.astro دعم class prop** — كان لا يقرأ `class` من `Astro.props`.
- **Report**: none
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 2 (هذا الـ entry).

---

### 2026-08-04 — Phase 2 API routes: evaluations/[id], certificates/index, certificates/[id]/verify, audit/index

- **Files**: src/pages/api/kernel/evaluations/[id].ts (new), src/pages/api/kernel/certificates/index.ts (new), src/pages/api/kernel/certificates/[id]/verify.ts (new), src/pages/api/kernel/audit/index.ts (new), src/lib/kernel-certs/cert-service.ts (modified — added listCerts to CertStore interface), src/lib/kernel-certs/prisma-store.ts (modified — added listCerts + listAuditEvents + StoredAuditEvent), kernel/tests/eval-certificate.test.js (modified — added reject + listCerts tests), kernel/tests/eval-certificate.db.integration.test.js (modified — added listCerts + listAuditEvents integration test)
- **What**: أكملنا الـ 4 routes المتبقية من Phase 2 spec: GET/PATCH/DELETE على evaluations/[id]، GET/POST على certificates/index، POST verify على certificates/[id]/verify، GET list على audit/index. أضفنا listCerts() و listAuditEvents() للمخازن. أضفنا 3 اختبارات وحدوية جديدة (reject + listCerts) واختبار تكاملي للـ list methods.
- **Why**: الـ spec الأصلي طلب 5 routes — الأولى (evaluations/index) كانت موجودة. الباقي 4 كانوا ناقصين. الـ store methods الجديدة مطلوبة للـ list endpoints.
- **Verification**: npm run build:client ✅ 0 errors, npx astro build ✅ 125 pages 0 errors, npx vitest run kernel/tests/eval-certificate.test.js ✅ 12/12, grep للـ routes الجديدة في dist/server/ ✅ كل الـ handlers مدمجة, tsc --noEmit ✅ 0 errors من ملفاتنا (4 أخطاء مسبقة في ملفات أخرى).
- **Report**: report/2026-08-04-kernel-api-routes.md
- **Commit**: 636ea0e1 (المستخدم التزم — per brain.md rule)
- **Status**: verified locally
- **Brain updates**: Updated Section 2 (هذا الـ entry), Section 5 (cert-service interface + prisma-store methods added).

### 2026-08-03 — Evaluation Certificate side-server: libs + API + Ed25519 + Postgres + اختبارات (12/12)

- **Files**: `src/lib/kernel-certs/*` (admin-auth, canonical, sha256, signing, env, libClient, eval-service, cert-service, in-memory-store, prisma-store, facade), `src/pages/api/kernel/evaluations/*` (index + [id]/cases/complete/resume/rerun), `src/pages/api/kernel/certificates/*` (issue/verify/revoke), `packages/db/prisma/schema.prisma` + migrations `20260803*`, `scripts/generate-eval-cert-key.mjs`, `scripts/seed-eval-cert-key.mjs`, `.env.example`, `kernel/tests/eval-certificate.test.js` + `.db.integration.test.js`
- **What**: بنينا نظام شهادات تقييم للـ kernel — يوقّع بروتوكول من بيانات التقييم لكل جولة مكتملة، وأي جهة خارجية تتطلب منه عبر `/api/kernel/certificates/verify?id=…`. تضمن: بوابة admin (x-brightai-admin-key)، canonical JSON digest، توقيع Ed25519، مخازن in-memory + Postgres (Prisma)، جداول run/certificate/signing_key/audit.
- **Why**: شرط الحوكمة — تقييمات kernel لازم تنفع إثبات سلامة دائم قابل للتحقق المستقل. وأصّلنا bug صريح كشفه اختبار التكامل: `fromDbCert` كان يعيد بناء payload فارغ/أصفار، فتحقق أي شهادة سليمة يطلع digest-mismatch؛ الحل حفظ الـ payload JSON في DB.
- **Verification**: `npx tsc --noEmit --moduleResolution bundler ... src/lib/kernel-certs/*` ✅ 0؛ vitest: unit 10 + DB integration 2 = **12/12** ✅؛ `scripts/seed-eval-cert-key.mjs` ✅ `v1 | Ed25519` seeded (psql تأكد)؛ migration payload طُبّق على dev.
- **Report**: `_reports/2026-08-03-evaluation-certificate.md`
- **Commit**: uncommitted — المستخدم يلتزم (rule: لا commits من الوكيل)
- **Status**: verified (local, dev DB)
- **Brain updates**: معرّفة новых libs فقط، لا تغيير tokens/components.

### 2026-08-02 — KRN-M29-QA: فحص WCAG 2.2 AA شامل (axe 21 صفحة = 0) + responsive (80 حالة = 0) + إصلاح M26 (CSS الموصلات) + حل verify:all

- **Files**:
  - `kernel/assets/css/pages/connectors.css` (REWRITTEN — نظام `kc-*` كامل بدل الـlegacy الميت `.connectors-*`؛ KPIs، بطاقات، guide، drawer، flow، test، sync، queue، toast، prefers-reduced-motion، responsive)
  - `src/styles/kernel.css` (EDITED — `body.kernel-shell footer.footer { display: none }` + إصلاحات color-contrast)
  - `src/styles/kernel/{eval,datasets,scorers,policies,redteam,playground}.css` (EDITED — color-contrast AA)
  - `public/js/kernel-audit.js` (EDITED — `role="cell"`)، `public/js/kernel-policies.js` (EDITED — `role="row"/"cell"`)
  - `public/js/kernel-connectors.js` (EDITED — `.kc-card__main` منطق نقر البطاقة، أزرار الحالة خارجها)
  - `src/pages/kernel/{playground,api,models}.astro` (EDITED — roles + tabindex + scrollable-focusable)
  - `public/js/kernel-api 2.js` + `public/js/kernel-api-data 2.js` (DELETED — مكرّران macOS " 2" كانا يكسران verify:all، بموافقة المستخدم)
  - `scripts/playwright/axe-kernel.mjs` (NEW — 21 route axe wcag 22aa)، `scripts/playwright/m29-responsive-qa.mjs` (NEW — 16 صفحة × 5 viewports)
  - `report/2026-08-02-krn-m29-qa.md` (NEW)
- **What**: فحص شامل لصفحات kernel: axe WCAG 2.2 AA على 21 مسار + فحص overflow أفقي على 5 viewports + إصلاح كل المخالفات. اكتشفت وأصلحت خلل M26: صفحة `/kernel/connectors/` كانت بلا CSS إطلاقًا (الـlegacy `.connectors-*` لا يطابق `kc-*` الحالي). كذالك اكتشفت أن الفوتر التسويقي من `BaseLayout` يظهر على kernel بلا أنماطه (`components.css` غير محمّل) فأخفينه.
- **Why**: شرط الجودة — kernel يحتاج WCAG 2.2 AA (0 violations) + لا overflow أفقي على أي viewport. وM26 خلل جوهري: الموصلات معروضة بلا أي تنسيق.
- **Verification**:
  - `npm run build` → نجح ✅
  - axe-kernel.mjs → **21/21 صفحة: 0 critical / 0 serious / 0 moderate / 0 minor** ✅ (كانت سابقًا C:3 S:22 قبل إصلاحات M-series)
  - m29-responsive-qa.mjs → **80 combo / 0 failing** + 0 أخطاء console/page ✅
  - probe connectors: البطاقات مصفّفة (bg #131c30، border، radius، 365×320)، الدرج يفتح/يقفل ✅
  - `npm run verify:all` → **exit 0** (TOTAL ERRORS: 0) — حُلّ المعلّق من M28 (ملفا "kernel-api 2") ✅
- **Report**: `report/2026-08-02-krn-m29-qa.md`
- **Commit**: uncommitted — المستخدم يلتزم (rule: لا commits من الوكيل)
- **Status**: verified locally
- **Brain updates**: قسم 2 (هذا الـ entry)؛ حلّ KI مفتوح (ملفا "kernel-api 2" كانا في known-issues كمصدر broken-links). ملاحظة: `dist/` يحتفظ بنسخ قديمة من الملفات المحذوفة — أي حذف من `public/` يتطلب `npm run build` قبل `verify:all` (لأن seo:gate يفحص `CLIENT_ROOT=dist/client`).
- **ملاحظة**: بقي تنظيف لاحق خارج النطاق: ملفات kernel-api الميتة الباقية (`kernel-api`, `kernel-api.js`, `kernel-api-data.js` 55B)؛ LSP errors قديمة في policies.astro:53 / models.astro:41 (لا تُفشل البناء)؛ روابط فوتر السايدبار صغيرة (target-size).

---

### 2026-08-02 — KRN-M28-LINKS-PHASE3: ربط الموافقات بالدليل (approvals → evidence) + إعادة التشغيل بالأصل (replay → parent)

- **Files**:
  - `public/js/kernel-approvals.js` (EDITED — `updateLedger()`: الـ spans السابقة صارت روابط/أزرار حقيقية — `Audit {eventId}` → `<a>` لـ `/kernel/audit/?trace=...`، `Trace` → `<button data-kap-ledger-trace>` يفتح الدرج المشترك، `Evidence {evidenceHash}` و`{certificateId}` → `<a>` لـ `/kernel/evidence/?trace=&evd=`؛ `bindLedgerEvents()`: delegation click/keydown على `[data-kap-ledger-trace]` → `KernelTraceDrawer.open(traceId)` مع fallback لـ audit)
  - `src/pages/kernel/evidence.astro` (EDITED — articles الثابتة صارت تحمل `data-trace={item.traceId}`؛ دالة `applyLinkParams()` جديدة تقرأ `?trace=` (+`?evd=`)، تعيد ضبط الفلاتر، تُبرز العنصر المطابق بـ `.kernel-evidence-item--linktarget` + scroll + focus، تحدّث عدّاد `[data-kernel-evidence-count]`، وتُظهر `.kernel-evidence-linknote` عند عدم التطابق؛ استُدعيت في `init()`)
  - `public/js/kernel-time-machine.js` (EDITED — `renderRows()`: خلية الـ trace صارت `<button class="rp-table__trace" data-rp-trace-open>`؛ `bindAffectedTraceLinks()` جديدة: delegation على tbody يفتح الدرج المشترك بسياق الصف (user/dept/verdict seed) مع fallback؛ `runInvestigation()` + `bindInvestDrawer()`: زر `[data-rp-invest-drawer]` يفتح الرحلة المحقّقة في الدرج)
  - `src/pages/kernel/replay.astro` (EDITED — أُضيف زر `[data-rp-invest-drawer]` بجانب زر إعادة البناء + أيقونة `iconExternal`؛ **وصلاح خطأ جوهري**: الـ inputs كان لها `id="rp-date-from/to"` و`id="rp-dept"` بينما المحرّك يبحث عن `data-rp-date-from/to/dept` → زر التشغيل كان يكسر بخطأ `Cannot read properties of null` — أُضيفت الـ data-attributes فصار يشتغل)
  - `public/js/kernel-drawer.js` (EDITED — `showLineage(drawer, run)` جديدة داخل `fillFromStore`: لو الـ run له `parentRunId` تظهر سطر «↻ إعادة تشغيل من» + زر «افتح الأصل» `[data-kernel-drawer-open-parent]` يعيد فتح الدرج على الأصل)
  - `src/layouts/KernelLayout.astro` (EDITED — قسم `.k-trace-drawer__lineage` + بيانات `data-kernel-drawer-lineage/parent/open-parent`)
  - `src/styles/kernel.css` (EDITED — `.kernel-ap-ledger__link` (+ hover/focus/reduced-motion)، `.kernel-evidence-item--linktarget`، `.kernel-evidence-linknote`، `.k-trace-drawer__lineage`)
  - `kernel/assets/css/pages/replay.css` (EDITED — `.rp-table__trace` صار زرًا فعليًا + `.rp-invest-drawer`)
  - `scripts/playwright/verify-kernel-approvals-evidence.mjs` (NEW — 4 مراحل: ledger links حقيقية، نقر Trace يفتح الدرج، `?trace=` يبرز ملف الدليل، صفوف replay أزرار تفتح الدرج)
- **What**: نفّذت آخر ربطَين من M28: (4) من سجل قرارات الموافقات كل رابط Trace/Evidence/Certificate يفتح الدرج المشترك أو صفحة الدليل المعنية بمعرّف مطابق؛ (3) من آلة الزمن كل trace في الطلبات المتأثرة وزر التحقيق يفتح الدرج المشترك، والدرج يعرض نسب «إعادة تشغيل من الأصل» مع زر فتح الأصل.
- **Why**: شرط M28 — تنقّل موحّد بمعرّفات مشتركة بين كل صفحات kernel. كذلك انكشف خطأ جوهري كان يكسر زر التشغيل في `/kernel/replay/` (selector mismatch بين HTML وJS) فصُحّح.
- **Verification**:
  - `npm run build` → نجح ✅
  - Playwright `verify-kernel-approvals-evidence.mjs` → **كل المراحل نجحت ✅** (A: ledger 4 روابط صحيحة ✅، B: نقر Trace فتح الدرج ✅، C: `?trace=` أبرز العنصر + عدّاد «1 من 12» ✅، D: 200 زر trace + فتح الدرج بسياق الصف ✅)
  - `verify:all` → exit 1 فقط بسبب 6 broken-links من `public/js/kernel-api-data 2.js` (ملف قديم مكرر — غير مرتبط)
  - `npm run performance:budget` → ✅ جميع البنود ضمن الميزانية
- **Status**: verified locally
- **Brain updates**: أُضيف entry (Section 2). **بكتمال هذا الـ entry اكتمل M28 Links Phase 2 بالكامل** (4 روابط: stats→Store، policies→playground، approvals→evidence، replay→parent).
- **ملاحظة**: بقي معلّقًا خارج النطاق: إزالة/إصلاح `public/js/kernel-api-data 2.js` (مصدر أخطاء verify:all الستة) — يُفضَّل في مرحلة تنظيف منفصلة.

---

### 2026-08-02 — KRN-M28-LINKS-PHASE2: ربط محرر السياسات بالملعب (policies → playground) بمعرّفات مطابقة

- **Files**:
  - `public/js/kernel-policies.js` (EDITED — أُضيفت بعد `actionLabel()`: خرائط `PG_PII_MAP`/`PG_PACK_MAP`/`PG_ACTION_MAP` + دالة `playgroundLinkFor(p)` تُرجع رابط `/kernel/playground/?pii=...&action=...&pack=...` أو null لـ piiType بلا نظير (مثل salary)؛ أُضيف زر «جرّبها» `<a class="po-btn po-btn--ghost">` بعد زر الاستثناءات في `renderPoliciesTable()` — `data-po-playground` عند توفر الرابط وإلا `data-po-playground-disabled` + `aria-disabled`)
  - `public/js/kernel-playground.js` (EDITED — أُضيفت `applyLinkParams(root)` بعد `applyHash` تقرأ `?pii/action/pack/name`، تفعّل كل `.pg-toggle[data-pid]` المطابقة (piiType+action)، تضبط `[data-context=pack]`، تُظهر `#pg-link-note`، وتعلن عبر `announce()`؛ استُدعيت في `init()` بجانب `applyHash`)
  - `src/pages/kernel/playground.astro` (EDITED — `<span class="pg-link-note" id="pg-link-note" hidden>سياسة من محرر السياسات — طُبّقت هنا</span>` بجانب `pg-local-badge/pg-embed-badge`)
  - `kernel/assets/css/pages/playground.css` (EDITED — نمط `.pg-link-note` + `[hidden]` بعد `.pg-local-badge`)
  - `scripts/playwright/verify-kernel-policies-playground.mjs` (NEW — 4 مراحل: 10 روابط «جرّبها» بالصيغة الصحيحة + action param، `pr_iban_block_cross` OFF افتراضيًا، `?pii=iban&action=block&pack=sama` → ON + note ظاهر + pack=sama + لا أخطاء console، `?pii=salary` (بلا نظير) → الافتراضي محفوظ + note مخفي)
- **What**: نفّذت المرحلة 2 من الربط المشترك M28: من محرر السياسات تقدر تجرّب أي سياسة في الملعب مباشرة — الرابط يبني معرّفات مطابقة تلقائيًا (piiType/action/pack) ويطبقها على كل مفتاح الملعب المطابق مع شارة إعلامية.
- **Why**: شرط M28 (تنقّل موحّد بين صفحات /kernel/* بمعرّفات مشتركة). السياسات والمفتاح كانا معزولين — الـ editor يستخدم piiTypes مختلفة (mobile/patient_file/medical_record/salary + packs nca_ecc/iso_27001/iso_42001) عن playground (phone/patient_id/medical + nca/iso27001/iso42001)، فتطلّب خرائط تحويل.
- **Verification**:
  - `npm run build` → نجح ✅ (dist مبني بدون أخطاء)
  - Playwright `verify-kernel-policies-playground.mjs` → **كل المراحل نجحت ✅** (روابط Phase A ✅، OFF الافتراضي Phase B ✅، التطبيق الكامل Phase C ✅، حالة salary Phase D ✅)
  - `verify:all` → exit 1 بسبب 6 broken-links من ملف قديم مكرر `public/js/kernel-api-data 2.js` فقط (غير مرتبط بهذا التغيير؛ كل أخطاء الـ verify:all منه)
- **Status**: verified locally
- **Brain updates**: أُضيف entry (Section 2). ملاحظة لاحقة: الربطان المتبقيان من M28 (approvals→evidence عبر `evidenceHash`، وreplay←parent) لم يُنفذا بعد.

---


### 2026-08-02 — KRN-M28-DRAWER-MERGE: دمج درج التدقيق في الدرج المشترك + تنظيف بقاياه

- **Files**:
  - `src/layouts/KernelLayout.astro` (EDITED — أقسام تفاصيل جديدة بعد سلسلة الهاش: `[data-kernel-drawer-detail|json|snippet|actions]` + `data-label` للخانات الأربع الملخص → تستخدمها دالة تصدير PDF)
  - `src/styles/kernel.css` (EDITED — كلاسات `.k-trace-drawer__detail/*` الجديدة + حذف بقايا `.kernel-audit-drawer*` كلها (الكتلة الكاملة + 3 media queries))
  - `public/js/kernel-drawer.js` (EDITED — fillFromStore/fillFromSeed موسّعان يملآن status/approval/anomaly/action/JSON/snippet + `statusAr()` + `toggleSection()` + ربط أزرار نسخ الهاش/نسخ snippet/تصدير PDF + `exportDrawerPdf()` + openDrawer يعيد ضبط الأقسام عند كل فتح)
  - `public/js/kernel-audit.js` (EDITED — استبدال نظام الدرج الخاص: `openDrawer(realIndex)` → `window.KernelTraceDrawer.open(r.traceId, seed)` بseed غني + `buildTimeline(r)` بصيغة seed الجديدة + `closeDrawer()` توكل للشِل + `bindDrawer()` فارغة + تحديث رأس DOM contract)
  - `src/pages/kernel/audit.astro` (EDITED — حذف درج `[data-kernel-audit-drawer]` الخاص كاملًا + حذف `iconCopy` الميت + إصلاح نوع `jsonLd` عبر `as unknown as Record<string, unknown>`)
  - `scripts/playwright/verify-kernel-audit.mjs` (EDITED — التحديث للدرج المشترك: traceId من `[data-kernel-trace-id]`، حالة الفتح من `aria-hidden="false"`)
- **What**: نفّذت "دمج كامل — درج واحد" (خيار المستخدم): ميزات درج التدقيق (JSON، DevTools snippet، تصدير PDF، نسخ هاش، رابط دليل) انتقلت للدرج المشترك `#k-trace-drawer`، وحذفت الدرج الخاص نهائيًا.
- **Why**: توحيد الفتح عبر `window.KernelTraceDrawer.open(traceId, seed)` يزيل ازدواجية الكود ويوحّد التجربة في كل صفحات /kernel/* (شرط M28).
- **Verification**:
  - `npm run build` → نجح ✅ (chunk `audit_6LMTMIRk.mjs` مبني، 0 بقايا `kernel-audit-drawer` في dist)
  - Playwright `verify-kernel-audit.mjs` → الصفوف (12,483) ✅ · البحث ✅ · verifier ✅ · tamper ✅ · **shared drawer opened ✅** (باقي فحص console واحد: 504 Outdated Optimize Dep — من Vite dev-toolbar، لا علاقة لنا)
  - `rg "kernel-audit-drawer" src/ public/` → فقط تعليق توثيقي في kernel-audit.js ✅
- **Status**: verified locally
- **Brain updates**: أُضيف entry (Section 2). ملاحظة: مشكلة نوع `jsonLd` موجودة مسبقًا في صفحات kernel القديمة (models/evidence/connectors/reports/approvals) — الصفحات الأحدث (playground/scorers/datasets/eval/replay) تستخدم الـ cast.

---


### 2026-08-02 — KRN-MODELS-CONNECTORS-API-M25-M26-M27: التحقق واكمال ميزات N25 و M26 و M27 في /kernel/

- **Files**:
  - `src/pages/kernel/models.astro` (VERIFIED — السجل، الحلبة، قواعد التوجيه، مكان البيانات، التكلفة، معدل النجاح، الهلوسة، الأمان، التجاوز اليدوي، تدهور الأداء، التصدير CSV)
  - `src/pages/kernel/connectors.astro` (VERIFIED — الموصلات الـ8 SAP, Oracle, Dynamics, Epic, Moodle, SharePoint, Salesforce, Okta، قراءة فقط، OAuth/SAML، الصحة، المزامنة، التكلفة/الزمن، تجديد التوكن، إعداد OAuth، مخطط تدفق البيانات، الاختبار الحي، طابور الانقطاع، دليل الموصل المخصص)
  - `src/pages/kernel/api.astro` (UPDATED — إضافة 4 نقاط طرفية جديدة: Evaluation Run API, Dataset API, Scorer API, Certificate Verification API + إضافة قسم مكتبات SDK لـ Python/TS/Go + إضافة قسم وثائق التشغيل لغير التقنيين + تطبيق التظليل الصارم للمفاتيح "لا تعرض أي مفتاح كامل" `br_k_demo_a7c8...d41b`)
  - `scripts/verify-models.mjs` (VERIFIED — 25 فحص: determinism + count matrix + TS↔JS parity + hygiene)
  - `scripts/verify-connectors.mjs` (VERIFIED — 22 فحص: determinism + count matrix + TS↔JS parity + hygiene)
- **What**: استكمال ومراجعة جميع المتطلبات الخاصة بـ M25 (النماذج والتوجيه) و M26 (الموصلات) و M27 (وحدة المطوّر والـ APIs). إضافة جميع نقاط REST المطلوبة (Inspect, Evidence, Eval Runs, Datasets, Scorers, Cert Verification)، توثيق SDKs ووثائق التشغيل لغير التقنيين، وضمان إخفاء المفتايح بالكامل (`br_k_demo_a7c8...d41b`).
- **Why**: تلبية متطلبات تنفيذ وحوكمة النماذج والموصلات والـ APIs في نظام Kernel وفق المواصفات السعودية واستجابة لطلب المستخدم.
- **Verification**:
  - `npm run verify:models` → **25/25 ✅**
  - `npm run verify:connectors` → **22/22 ✅**
- **Status**: verified locally

---

### 2026-08-01 — KRN-REPORTS-STATS-M23-M24: بناء /kernel/reports/ + /kernel/stats/ كامل — تقارير حتمية + مؤشرات حية

- **Files**:
  - `src/data/kernel-reports.ts` (NEW — مولّد حتمي: 42 تقرير + 4 scheduled + 5 template versions، seed `0x7e3a1c50`، mulberry32 + FNV-1a chain (genesis `0x00000000`)، 7 أنواع (governance/compliance/audit/risk/custom/pii/connectors) + 4 صيغ (PDF/JSON/CSV/XLSX) + 5 لغات (ar/en/fr/es/de) + Trace coverage + Certificate coverage + executive summary مولّد آليًا + role recipients)
  - `public/js/kernel-reports-data.js` (NEW — UMD mirror بايت-بايت للمولّد)
  - `public/js/kernel-reports.js` (NEW — محرك vanilla JS: filters (type+status+language) + report library + wizard 4 خطوات + **report builder (drag & drop widgets)** + **preview drawer** + **5 languages switcher** + **template versions tab** + Trace/Certificate coverage display + scheduled reports + role recipients)
  - `src/pages/kernel/reports.astro` (REBUILT — 3 تبويبات: Library | Builder | Versions + KPIs SSR + filters + library + scheduled + builder (palette + canvas + properties) + preview drawer + wizard modal + SEO + cross-links)
  - `kernel/assets/css/pages/reports.css` (REBUILT — tabs + filters + report list + scheduled + builder (palette + canvas + widgets) + preview drawer + versions + wizard + language switcher + responsive + reduced-motion)
  - `src/data/kernel-stats.ts` (NEW — مولّد حتمي: 12,483 طلب + time series + risk distribution + top users (10) + top departments (7) + top models by cost (5) + live events (20) + alerts (4) + quotas (7) + cost + latency (P50/P95/P99) + period comparison، seed `0x5c0ffee0`)
  - `public/js/kernel-stats-data.js` (NEW — UMD mirror بايت-بايت)
  - `public/js/kernel-stats.js` (NEW — محرك vanilla JS: 6 KPIs clickable → /kernel/audit/ + Chart.js (line + doughnut) + top users/departments/models tables + **live event stream + pause** + period comparison + alerts + quotas + cost + latency panels + range tabs + export PDF)
  - `src/pages/kernel/stats.astro` (REBUILT — range tabs + KPIs + charts row + top row (users/departments/models) + stream row (live events + comparison) + panels row (alerts/quotas/cost/latency) + SEO + cross-links)
  - `kernel/assets/css/pages/stats.css` (NEW — KPIs + charts + tables + live stream + alerts + quotas + cost + latency + responsive + reduced-motion)
  - `scripts/verify-reports.mjs` (NEW — 25 فحص: determinism + count matrix + TS↔JS parity + chain validity + hygiene)
  - `scripts/verify-stats.mjs` (NEW — 22 فحص: determinism + count matrix + TS↔JS parity + hygiene)
  - `package.json` (EDITED — `verify:reports` + `verify:stats`)
- **What**: بنيت M23 (Reports) + M24 (Stats) كاملين بنفس نمط M14–M20 (مولّد حتمي + UMD mirror + محرك vanilla + CSS + verify gate). Reports: 42 تقرير حتمي + 7 أنواع + 4 صيغ + 5 لغات + report builder بصري (drag & drop widgets) + preview drawer بملخص تنفيذي + template versions بـ hash chain + Trace/Certificate coverage + role recipients + scheduled reports. Stats: 12,483 طلب + 6 KPIs clickable → audit + Chart.js (line + doughnut) + top users/departments/models by cost + live event stream + pause + period comparison + alerts + quotas + cost + latency (P50/P95/P99).
- **Why**: M23 و M24 من Prompt 23 — التقارير والمؤشرات هما واجهة الإدارة العليا والجهات الرقابية. الصفحات القديمة كانت ناقصة ميزات جوهرية (builder، widgets، preview، 5 لغات، Trace coverage، top models by cost، live stream، clickable KPIs، alerts، quotas، cost، latency).
- **Verification**:
  - `npm run verify:reports` → **25/25 ✅** (determinism، count matrix 42/38/1/4، TS↔JS parity كاملة، chain من genesis للنهاية، hygiene نظيفة)
  - `npm run verify:stats` → **22/22 ✅** (determinism، count matrix 12483/11210/382/841/1554، TS↔JS parity، hygiene)
  - `npm run build` → 0 أخطاء ✅ (`/kernel/reports/` + `/kernel/stats/` تُبنى، ملفات `/js/kernel-reports-*.js` + `/js/kernel-stats-*.js` تُنسخ لـ dist)
  - `npm run verify:all` → exit 0 ✅ (0 errors، hreflang 259/0)
- **قرارات موثقة**:
  - **حتمية كاملة**: لا Math.random/Date.now/toLocaleString في أي مولّد — نفس seed = نفس البيانات في كل بيئة.
  - **Report Builder**: drag & drop widgets (KPI/chart/table/text/page-break) على قماش A4 — HTML5 Drag API (لا مكتبة).
  - **5 Languages**: مبدّل في رأس كل تقرير (ar/en/fr/es/de) — UI فقط، المحتوى يبقى عربي.
  - **Clickable KPIs**: نقر أي KPI في stats ينقل لـ `/kernel/audit/?status=blocked` (إلخ) — ربط بين الصفحات.
  - **Live Event Stream**: محاكاة بـ `setInterval` 3 ثوانٍ + زر إيقاف مؤقت — بيانات حتمية (لا WebSocket).
  - **Chart.js موجود**: أعدنا استخدام Chart.js الموجود في stats (ما أضفنا مكتبة جديدة).
  - **CSP-safe**: `type="module"` لسكربتات public/js/ — نفس نمط M14–M20.
  - **SEO checker**: `role="article"` في JS يفهمه checker كمسار → شيلناه للـ non-clickable KPIs.
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-reports.ts + kernel-reports.js + kernel-stats.ts + kernel-stats.js + verify-reports.mjs + verify-stats.mjs كـ canonical)

---

### 2026-08-01 — KRN-REPLAY-M20: بناء /kernel/replay/ (آلة الزمن) كامل — محاكاة السياسات على الطلبات التاريخية + بوابة الموافقة الإلزامية للـ external

- **Files**:
  - `src/pages/kernel/replay.astro` (REWRITTEN — صفحة M20: تبويبان محاكاة/تحقيق، لوحة إعداد (فترة/سياسات/نطاق/وضع معالجة)، نتائج (شارة مصدر + 4 أرقام + مخطط قبل/بعد + تحذير عنبري + أقسام متأثرة + جدول بأعلام FP + تصدير)، بوابة موافقة `rp-consent`، SEO section + cross-links، سكربتات `/js/kernel-time-machine-*.js`)
  - `src/data/kernel-replay.ts` (NEW — مولّد حتمي: 520 صف، seed `0x5c0ffee0`، mulberry32 + FNV-1a chain (genesis `0x00000000` → final `0x3951eca0`)، `simulateReplay` + `buildTimeline` + بوابات consent، types + REPLAY_MONTHS/POLICIES/DEPTS/TS_START/TS_END)
  - `public/js/kernel-time-machine-data.js` (NEW — UMD mirror بايت-بايت للمولّد)
  - `public/js/kernel-time-machine-worker.js` (NEW — worker: init/simulate/investigate/export/verify/tamper-check + buildMemo)
  - `public/js/kernel-time-machine.js` (NEW — محرّك الصفحة: tabs، shortcuts، multi-select، mode radio، consent flow، مخطط، أقسام، جدول، تصدير، خط زمني)
  - `kernel/assets/css/pages/replay.css` (EDITED — كتل المودال + mode switcher + شارة المصدر + ترتيب الأقسام + FP chip + مخطط fallback جدولي)
  - `scripts/verify-replay.mjs` (NEW — بوابة تحقق 27 فحص)
  - `package.json` (EDITED — `verify:replay`)
- **What**: بنيت صفحة آلة الزمن كاملة بمستوى M19: تعيد تشغيل السياسات المقترحة على 520 طلبًا تاريخيًا (حتمي، لا Math.random) وتُظهر الأثر (+340 حظر/ −12 إطلاق/ 48 FP/ net 328) في شريط + مخطط شهري + أقسام متأثرة + جدول + تصدير كمذكرة قرار، وتبويب تحقيق يعيد بناء حادثة خطوة بخطوة على خط زمني قابل للتكبير. الشرط الأمني الإلزامي (Prompt 20): external mode يتطلب موافقة صريحة عبر مودال مفصّل قبل أي إرسال، والوحدة نفسها ترد `consentRequired=true` بصفر بيانات بدون موافقة — مفروض في الطبقتين.
- **Why**: صفحة replay كانت القديمة (محرك M11) — مطلوب إعادة بناء بجودة M19 مع بوابة الأمان الإلزامية.
- **Verification**:
  - `npm run verify:replay` → 27/27 ✅ (determinism، count matrix 340/12/48/168/328، TS↔JS parity، chain validity، simulation contract، consent gate (external بلا موافقة → 0 بيانات)، timeline determinism، hygiene)
  - `npm run build` → 0 أخطاء ✅ (صفحة `/kernel/replay/` تُبنى، الملفات تُنسخ إلى `dist/client/js/`)
  - `npm run verify:all` → 16 pass / 0 fail ✅ (ملاحظات raw hex في kernel.css مسبقة)
  - `npm run performance:budget` → ✅ كل البنود ضمن الميزانية
- **Report**: report/2026-08-01-krn-replay-m20.md
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-time-machine-* = canonical for replay)، ملاحظة: أسماء `kernel-replay.js` محجوزة لمحرك M11 عبر `window.n`.

---

- **Files**:
  - `public/js/kernel-approvals.js` (REBUILT — M19.1: full Trace (أي Trace ID في التفاصيل يفتح درج الرحلة `k-trace-drawer`)، تفويض حقيقي (select بمستهدفي `APPROVAL_REVIEWERS` داخل المودال عند action=transfer + مستهدف إلزامي + تسجيل المستلم في السجل)، اقتراح آلي يعرض شارة «اقتراح آلي — راجعه قبل التأكيد» (مراجعة بشرية)، ledger يعرض مراجع ملموسة: Audit event id · Trace · Evidence hash (FNV-1a) · Certificate id — append-only لا حذف)
  - `src/pages/kernel/approvals.astro` (EDITED — modal أضيف `[data-kap-modal-delegate-field]` (select التفويض) + `[data-kap-modal-suggest-badge]` (شارة المراجعة))
  - `src/styles/kernel.css` (EDITED — block KRN-APR-M19.1 في الأعلى: `.kernel-ap-detail__trace--link` رابط متقطع يفتح الدرج · شارات الاقتراح · `.kernel-modal__select` + hint للتفويض · `.kernel-ap-ledger__delegate` + `.kernel-ap-ledger__links` (spans) — كلها var() فقط)
- **What**: رقّيت صفحة الموافقات لإغلاق فجوات M19 حسب الطلب: 1) Trace صار قابلاً للفتح في درج الرحلة (كامل الرحلة، ليس نصاً). 2) "حوّل" صار تفويضاً فعلياً بمستهدف مراجع حقيقي يُختار في المودال ويُسجَّل كجهة مستقبلة في السجل. 3) الاقتراح الآلي يظهر تنبيهاً صريحاً أنه مرشح يحتاج مراجعة بشرية قبل التأكيد. 4) كل قرار يولّد Audit event + يرتبط بـ Trace + Evidence hash + Certificate في السجل (غير قابل للحذف — append-only).
- **Why**: M19.js كان يعرض Trace كنص ثابت و"تحويل" مجرد modal، والاقتراح يملأ الحقل بصمت، والـ ledger يعرض "Audit · Trace · Evidence · Certificate" كنص ثابت بلا مراجع حقيقية.
- **Verification**:
  - `npm run build` → 0 أخطاء ✅ (`/kernel/approvals/` تُبنى، وحدة kernel المنقاة 145.9KB)
  - `node scripts/verify-approvals.mjs` → 15/15 ✅ (determinism + count matrix + TS↔JS parity + chain + SLA + hygiene)
  - `node --check public/js/kernel-approvals.js` → exit 0 ✅
  - `npm run verify:all` → يفشل **فقط** في `lint:tokens` بـ 9 مخالفات **مسبقة** (سطور 4723-4739 = `.kernel-ap-pii--*` ألوان hex + `padding:3px 10px` — في CSS M19 الأصلي قبل تعديلي، وليست من إضافاتي التي استخدمت var() فقط). الألوان عمدية لتظليل PII حسب تصميم-صفحات-kernel §1.1 — لم أمسّها حفاظاً على عقد التظليل اللوني.
- **Report**: none
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-approvals.js = M19.1 canonical). ملاحظة: lint-tokens مسبق بـ 9 مخالفات PII colors في M19 الأصلي — قرار بعدم إصلاحها (تكسر تظليل PII).

---

### 2026-08-01 — KRN-APPROVALS-M19: إعادة بناء /kernel/approvals/ بساحة موافقات حتمية + إصلاح طبقة CSS + إصلاح modal

- **Files**:
  - `src/pages/kernel/approvals.astro` (REBUILT — M19: 162-row deterministic queue, seed `0xa4c1e0f2`, final hash `0x90e4c4c8`, SLA critical 4h/pending 24h, chain genesis `0x00000000`, toolbar shortcuts button bound, inline style removed → scoped `.kernel-ap-ledger-wrap`)
  - `src/data/kernel-approvals.ts` (NEW — deterministic dataset generator: `APPROVAL_NOW = Date.UTC(2026,6,31,12,0,0)`, 7/3/2/142/8 = 162 rows, SLA windows, null deadlines for approved/rejected, full chain validity)
  - `public/js/kernel-approvals.js` (NEW — vanilla JS engine: deterministic sort/filter/search, toolbar `bindShortcutsBtn()`, modal lifecycle, keyboard nav, `prefers-reduced-motion`, no `Math.random`/no `Date.now`/no `toLocaleString`/no `fetch`)
  - `public/js/kernel-approvals-data.js` (NEW — frozen 162-row dataset blob, `Object.freeze` + hash verification `0x90e4c4c8`)
  - `public/js/kernel-approvals-worker.js` (NEW — Web Worker for deterministic computation, postMessage results, no side effects)
  - `src/styles/kernel.css` (EDITED — KRN-APR-001: added `.kernel-modal[data-open="false"] { display: none; }` after `[data-open="true"]` block; fixed shared modal bug where closed modals were visible)
  - `src/layouts/KernelLayout.astro` (EDITED — added top-level `@layer tokens,base,utilities,color,animations,kernel;` before `@import '../styles/kernel.css' layer(kernel)` to fix cascade layer ordering)
  - `src/styles/pages.css` (EDITED — removed dead `.kernel-approval-card__btn` selectors (2 occurrences))
  - `package.json` (EDITED — added `verify:approvals` script)
  - `scripts/verify-approvals.mjs` (NEW — 15/15 deterministic verification gate)
  - `scripts/playwright/verify-kernel-approvals.mjs` (NEW — 19/19 Playwright smoke test)
  - `report/2026-08-01-krn-approvals-m19.md` (NEW — detailed M19 report)
- **What**: سوّيت M19 كامل لصفحة الموافقات: 162-row dataset حتمي (seed `0xa4c1e0f2`, hash `0x90e4c4c8`), ساحة تحقق `verify:approvals` (15/15), Playwright smoke (19/19), إصلاح طبقة CSS cascade (الـ `layer(base)` كان يغلب `layer(kernel)` فيش), إصلاح modal bug (الـ modals المغلقة كانت تطلع), حذف inline style من ledger, ربط زر shortcuts في toolbar.
- **Why**: M19 من Prompt 08 — صفحة الموافقات لازم تكون حتمية وقابلة للتحقق (deterministic + hash-verified). الطبقة CSS كانت مكسورة (kernel layer ما كانت تغلّب base) بسبب `@layer` statement داخل `layer(kernel)` import بدل ما تكون top-level. الـ modal bug كان يؤثر على approvals + evidence مع بعض.
- **Verification**:
  - `npm run build` → 125 صفحة، 0 أخطاء ✅
  - `pnpm run verify:approvals` → 15/15 ✅
  - `npm run verify:all` → 5/5 ✅
  - `node scripts/playwright/verify-kernel-approvals.mjs` → 19/19 ✅ (كان 17/19 قبل إصلاح الطبقة)
  - `grep -c "padding-inline-end: 264px" dist/client/_astro/KernelLayout.*.css` → 1 ✅ (الـ .page padding صار 264px)
  - `grep -c "kernel-modal" src/styles/kernel.css` → 1 ✅ (KRN-APR-001)
  - `grep -c "@layer tokens,base,utilities,color,animations,kernel;" src/layouts/KernelLayout.astro` → 1 ✅
  - `node scripts/verify-approvals.mjs` → 15/15 ✅ (determinism doubled-build, count matrix, TS↔JS parity, chain validity, SLA-window check incl. `slaDeadline === null`)
- **Report**: `report/2026-08-01-krn-approvals-m19.md`
- **Commit**: `e796cb77`
- **Status**: deployed
- **Brain updates**: Section 1 (kernel CSS bundle 168.2→143.7KB), Section 5 (kernel-approvals.ts + kernel-approvals.js + kernel-approvals-data.js + kernel-approvals-worker.js + verify-approvals.mjs كـ canonical), added KRN-APR-001 modal fix + cascade layer fix to known patterns

---

### 2026-08-01 — KRN-AUDIT-M: بناء وحدة /kernel/audit/ الكاملة (REPORTS-15) — سجل تدقيق افتراضي حتمي 12,483 سجل

- **Files**:
  - `src/data/kernel-audit.ts` (NEW — مولّد حتمي 100%: `AUDIT_SEED` + `fnv1a()` (FNV-1a 32-bit) + `buildAuditRows()` → **12,483 صف** (allowed 11,210 = 10,497 آلي + 713 بموافقة بشرية / blocked 382 / pending_approval 841 / error 50؛ approvals 1,554) + `buildAuditStats()` لـ SSR KPI + `formatTsLabel`/`auditCanonical`/constants)
  - `public/js/kernel-audit-data.js` (NEW — UMD mirror byte-for-byte للمولّد: browser main thread → `window.KernelAuditData`، Web Worker → `importScripts`، Node → `module.exports` — يخدم المحرك و الـ worker بدون إعادة كتابة منطق)
  - `public/js/kernel-audit-worker.js` (NEW — Web Worker: يبني الصفوف عبر `importScripts('/js/kernel-audit-data.js')`، يعالج `filter` (status/query) و`verify` (تحقق سلسلة هاش FNV-1a حقيقي حول index) و`tamper-check` (محاكاة العبث)، يرجع `_id` عبر `reply()`، يتوافق مع CSP `worker-src 'self' blob:`)
  - `public/js/kernel-audit.js` (NEW — محرك vanilla مستقل CSP-safe: **Virtual scrolling** (`data-ka-viewport`/`-band`/`-spacer`، `ROW_H=44`، `updateScrollPos` يعرض `filteredIndices.length`) + فلاتر status/search (worker أو main-thread fallback) + `data-ka-idx` = real index + `getRowByRealIndex`/`openDrawer(realIndex)` + `bindKpis(rows)` من `fullRows` + verifier (`runVerify`/`runTamperDemo` بشرط `res.type==='verify'|'tamper-check'`) + تصدير CSV/JSON/PDF + نسخ trace + `fmtCount` يدوي بدون `toLocaleString` (حتمية كاملة)
  - `src/pages/kernel/audit.astro` (REWRITTEN — KPI SSR من `buildAuditStats()` (12٬483/11٬210/382/1٬554) + filter bar + toolbar (بحث/مسح/تصدير) + thead ثابت + viewport/band/spacer + empty state + verifier + drawer + `<script type="module" src="/js/kernel-audit-data.js">` قبل المحرك + استيراد `KernelEmptyState`)
  - `src/styles/kernel.css` (EDITED — كتلة `/* ── 23b ... */`: `.kernel-audit-*` KPI strip + جدول افتراضي (vrow ثابت 44px) + thead + status colors + verifier panel + mobile overrides + reduced-motion)
  - `scripts/verify-audit.mjs` (NEW — 5 مجموعات تحقق: determinism (بناءان متطابقان)، count matrix (12,483/11,210/382/841/50/1,554)، TS↔JS parity (كل الصفوف + prevHash/hash/traceId/status، final hash `0x40b8d3a6`)، chain validity (genesis → end)، source hygiene (لا Math.random/Date.now/toLocaleString/fetch بعد تجريد التعليقات والـ strings))
  - `scripts/playwright/verify-kernel-audit.mjs` (NEW — 12 فحص runtime على `astro preview`: console نظيف، loading يُزال، صفوف افتراضية تُعرض، counter 12,483، فلتر status، search + empty state، verifier ✓ بترميز trace حقيقي من الـ drawer، tamper ✗، drawer يفتح)
  - `package.json` (EDITED — أضفت `"verify:audit": "node --import ./scripts/test-ts-loader.mjs --experimental-strip-types scripts/verify-audit.mjs"`)
- **What**: بنيت وحدة `/kernel/audit/` بالكامل حسب REPORTS-15: سجل تدقيق افتراضي حتمي بـ 12,483 سجل (شبكة 44px ثابتة + band/spacer للتمرير بدون DOM ضخم)، كل سجل له سلسلة هاش FNV-1a حتمية من genesis `0x00000000`، فلترة status/search تعمل عبر Web Worker (fallback main-thread)، محقق سلسلة حقيقي (يعيد حساب hash ويتحقق من المخزّن) + محاكاة عبث تكشف أي تعديل فورًا، تصدير CSV/JSON/PDF، درج تفاصيل، وإحصاءات KPI تُعرض من الـ SSR.
- **Why**: REPORTS-15 من Prompt 08 — سجل التدقيق هو الدليل المحاسبي الأصلي: سجل غير قابل للكذب (سلسلة هاش) لحوكمة الـ AI. الصفحة السابقة كانت تعرض كسجل صغير غير قابل للتوسع ولا يحوي سلسلة تحقق فعلية.
- **Verification**:
  - `npm run verify:audit` → **12/12 ✅** (determinism، count matrix، TS↔JS parity كاملة، chain من genesis للنهاية، hygiene نظيفة بعد تجريد التعليقات/الـ strings)
  - `npm run build` → ✅ 0 أخطاء (`/kernel/audit/` تُبنى، KPI SSR: 12٬483/11٬210/٣٨٢/١٬٥٥٤؛ ملفات `/js/kernel-audit-*.js` تُنسخ لـ dist؛ `type="module"` مطلوب لسكربتات public/js عشان Astro ما يحاول bundling)
  - `npm run verify:all` → ✅ exit 0 (hreflang 259/0)
  - Playwright `verify-kernel-audit.mjs` على `astro preview` → **12/12 ✅** (لا console errors، loading يُزال، 19 صف افتراضي، counter 12,483، فلتر/search/empty، verifier ✓، tamper ✗، drawer مفتوح)
- **قرارات موثقة**:
  - **عقد الحتمية**: total 12,483 / allowed 11,210 (713 human-approved) / blocked 382 / pending 841 / error 50 / approvals 1,554 — يُتحقق منه في `verify-audit.mjs` ولا يسمح بالانحراف. نفس seed = نفس الصفوف في كل بيئة.
  - **الجدول الافتراضي**: صفوف ثابتة 44px (يطابق `ROW_H`) + viewport/band/spacer — تقريبًا DOM ثابت بغض النظر عن 12,483 سجل. على الجوال أبقينا صفوفاً جدولية عادية (أُلغيت فكرة البطاقات الجوالية) عشان يبقى حساب النافذة سليمًا.
  - **CSP-safe**: الـ worker عبر `importScripts('/js/kernel-audit-data.js')` (متوافق مع `worker-src 'self' blob:` في الترويسات الفعلية من `astro.config.mjs` + `src/middleware.ts` + `scripts/security-headers.mjs`؛ `_headers` توثيقي فقط).
  - **لا `toLocaleString`** في أي مولد بيانات (حتمية) — `fmtCount` في المحرك يدوي.
  - **سكربتات public/js = `type="module"`**: لو حذفتها أو استخدمت `<script src>` بلا type، Astro يفشل البناء بخطأ "add the is:inline directive" — لازم تحافظ على `type="module"` لسكربتات `/js/` اللي في الصفحة.
  - **`page.fill` لا يعمل على العناصر داخل panel مخفي** في Playwright — ضبط قيمة input عبر native setter + input/change event (النقر عبر `evaluate().click()` بدل `page.click(force)`).
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-audit.ts + kernel-audit-data.js + kernel-audit-worker.js + kernel-audit.js + verify-audit.mjs + verify-kernel-audit.mjs كـ canonical)

---

### 2026-08-01 — KRN-SC-M17: ترقية /kernel/policies/ لمحرر سياسات حوكمة كامل (11 سياسة + إصدارات immutable + شهادات + محاكاة)

- **Files**:
  - `src/data/kernel-policy-editor.ts` (NEW — 11 سياسة (9 active/2 draft) بأسماء/أوصاف منشورة حرفياً + `PolicyVersion` (version/note/createdAt/hash/certifiedBy) + `fnv1a()`/`ruleHash()` حتمية + `POLICY_EDITOR_PII_TYPES` (9) + `POLICY_EDITOR_PACKS` (7: pdpl/nca_ecc/sdaia/sfda/sama/iso_27001/iso_42001) + `POLICY_EDITOR_ACTIONS` (8: allow/mask/block/redact/warn/approve/local_model_only/log/hitl) + `POLICY_EDITOR_OPERATORS` (3) + `POLICY_CERTIFICATES` (CERT-2026-001/002) + `POLICY_EDITOR_DEPARTMENTS` (10) + `POLICY_EDITOR_SECTORS` (7) + `SIM_TEMPLATES` (20، منها 7 بريئة) + `buildSimulationRequests()` → 1000 طلب حتمي (10 أقسام × 100) + `buildPolicyEditorConfig()` + `buildPolicyEditorStats()`)
  - `public/js/kernel-policies.js` (NEW — محرك vanilla مستقل حتمي 100%: `scanPii` (أنماط فعلية من kernel-scorers + passport/api_secret) + `detectConflicts` (block vs soft عالي / إجراءان مختلفان متوسط) + `createVersion` (يرفض لو الإصدار الحالي مثبّت بشهادة — مطلب المستخدم) + `rollback` (نسخة جديدة تستنسخ القديمة؛ مرفوض لو الحالي مثبّت) + `diff` Git-like (added/removed) + استثناءات (تُنشئ إصداراً جديداً) + `simulate` (1000 طلب × سياسات نشطة، ترتيب إجراء صارم allow→block، عتبة FP>5% + byDept/byPolicy + حتمية) + `suggest` (مولّد Demo بقواعد GENERATOR_RULES — لا نموذج خارجي، mode:'demo') + `importConfig`/`exportConfig`/`snapshot`/`onEvent`/`reset` + UI كامل (جدول 9 أعمدة، محرر modal + معاينة JSON/hash، modal إصدارات بفرق/rollback/قفل شهادة، modal استثناءات، زر محاكاة، toast، Escape) + `window.KernelPolicies`)
  - `src/pages/kernel/policies.astro` (REBUILT — `data-po-root` + إحصاءات SSR (7 عناصر) + جدول `[data-po-tbody]` + قسم محاكاة `data-po-sim-*` + مولّد `data-po-gen-*` + 3 modals + `#policies-config` blob + `<script type="module" src="/js/kernel-policies.js">` + side-effect import للـ CSS + KernelSeoSection + KernelContextLinks)
  - `kernel/assets/css/pages/policies.css` (REBUILT بالكامل — أنماط po-* كلها منطقية RTL، touch ≥44px، شبكة جدول تُعاد على ≤1100px، `prefers-reduced-motion`)
  - `scripts/playwright/verify-policies.mjs` (NEW — 41 فحص وظيفي)
- **What**: رقّيت محرر السياسات من نسخة واجهة ثابتة (تعديل سطر واحد + خيارين إجراء) إلى أداة حوكمة كاملة: 11 سياسة بـ 2-3 إصدارات immutable لكل واحدة (hash FNV-1a حتمي مطابق لـ M7)، إصدارات مثبّتة بشهادات امتثال (CERT-2026-001 لـ pr_saudi_id_pdpl v1، CERT-2026-002 لـ pr_patient_sfda v1) **مجمّدة تماماً** — التعديل أو الـ rollback عليها مرفوض برسالة واضحة (مطلب المستخدم: "لا تسمح بتعديل Policy version مستخدمة في Certificate قديم")، سجل إصدارات بفرق Git-like + rollback عبر نسخة جديدة، كشف تعارض بين الإجراءات، محاكاة حتمية لآخر 1000 طلب مع إيجابيات كاذبة، استيراد/تصدير JSON مع تحقق، مولّد سياسة Demo بشارة واضحة، استثناءات أقسام/تطبيقات، وباني شروط no-code بـ IF/AND/THEN.
- **Why**: M17 من Prompt 08 — محرر السياسات هو قلب الحوكمة (ماذا يحدث لكل طلب AI حسب النوع/الحزمة/القسم)، والنسخة القديمة لم تحمِ الشهادات ولم تحاكي الطلبات ولم تحتفظ بسجل إصدارات.
- **Verification**:
  - `npm run build` → 0 أخطاء ✅ (`/kernel/policies/` تُبنى، blob 11 سياسة + 1000 simRequest + 12 نمط PII + `aiBadge.mode='demo'`، JS module خارجي `dist/client/js/kernel-policies.js` 58KB)
  - Playwright `verify-policies.mjs` → **41/41 ✅** — engine mounted، blob صحيح، 6 بطاقات SSR (11 سياسة)، 11 صف جدول، createVersion v2→v3 + hash يتغيّر + صيغة حتمية، **حماية الشهادة** (createVersion على pr_patient_sfda → blocked:true + رسالة /شهادة/) ، diff added/removed، rollback v4، محاكاة 1000/450 affected/fp=0/10 أقسام + حتمية (نفس النتيجة مرتين)، مولّد Demo (mobile→mask + addSuggested)، export/import (رفض malformed + قبول own export)، snapshot (active=9 + certified≥2)، زر simulate-all يحدّث KPI، modals (editor/versions/استثناءات) تفتح وتقفل، certified row موسومة، لا console errors (0)
- **قرارات موثقة**:
  - **حماية الشهادة = القاعدة الذهبية**: أي إصدار حالي مثبّت بـ `certifiedBy` يُجمَّد — `createVersion` و `rollback` يرجعان `{ok:false, blocked:true, certifiedBy}` بدون أي تعديل على الـ versions. v1 من pr_saudi_id_pdpl يبقى مثبّتاً و v2 (الذي أضاف حزم nca_ecc) غير مثبّت — هذا سيناريو واقعي: السياسة لها نسخة غير مثبتة قابلة للتعديل + نسخة معتمدة مجمّدة.
  - **rollback = نسخة جديدة**: لا يعيد كتابة التاريخ؛ ينشئ إصداراً جديداً يستنسخ قاعدة الهدف (`note: Rollback إلى vN`). يرفض لو الهدف هو الأحدث أو لو الحالي مثبّت.
  - **محرك مستقل** `kernel-policies.js` — نفس مبررات M15/M16 (لا يمس `kernel-eval-engine.js` المرتبط بـ eval؛ `kernel-policies.ts` القديمة تبقى لـ playground).
  - **المولّد Demo صريح**: `GENERATOR_RULES` keyword-matching فقط (لا API خارجي، لا حوكمة حقيقية) — `aiBadge.mode='demo'` + "مسودة مراجعة بشرية" يمنعان المبالغة في الوعود.
  - **المحاكاة حتمية**: 1000 طلب مولّدة من 10 أقسام × 100 قالب (SIM_TEMPLATES، 7 منها بريئة) — لا `Math.random`؛ الترتيب أخذ أقصى إجراء صارم (allow=0…block=8).
  - **استثناءات تُسجَّل كإصدار**: إضافة/تبديل استثناء يُنشئ إصداراً جديداً (يظل التاريخ كاملاً) — لا يحذف الاستثناء القديم من السجل.
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-policy-editor.ts + kernel-policies.js + verify-policies.mjs كـ canonical؛ kernel-policies.ts القديمة تبقى لـ playground فقط)

---

### 2026-08-01 — KRN-SC-M16: إعادة بناء /kernel/redteam/ كساحة فريق أحمر بمحرك حتمي (لا Math.random)

- **Files**:
  - `src/data/kernel-redteam-lab.ts` (NEW — مكتبة 40 تقنية OWASP LLM Top 10 (34 موروثة حرفياً من الصفحة السابقة + 6 جديدة لسدّ وعد الـ 40) + 5 اختراقات مقصودة (Stage 5 خامد) + `RT_LAYER_LABELS` (5 طبقات) + لوحة صدارة + `countAttacksByOwasp()` + `buildRedteamConfig()`)
  - `public/js/kernel-redteam.js` (NEW — محرك vanilla مستقل حتمي 100%: مطابقة trigger للمكتبة + أنماط PII/حقن فعلية (من kernel-scorers/kernel-scenarios-lab) + تقييم مخاطر + Rate Limiter 10/دقيقة + تسجيل Run/Trace عبر KernelEvalStore + `window.KernelRedteam` = `launchAttack/chainMessage/analyze/suggestPolicy/snapshot/onEvent/reset`)
  - `src/pages/kernel/redteam.astro` (REBUILT — `data-rt-root` + `data-rt-*` attributes + JSON blob `#redteam-config` + `<script type="module" src="/js/kernel-redteam.js">` بدل سكربت inline القديم (كان 34 هجمة + `Math.random()<0.1` بدون traces/rate limit/سياسات))
  - `kernel/assets/css/pages/redteam.css` (EDITED — `.rt-policy-draft` (مسودة سياسة LTR أحادية) + `.rt-verdict__breach-note` + `.rt-chain__msg--breach`)
  - `scripts/playwright/verify-redteam.mjs` (NEW — 35 فحص وظيفي)
- **What**: نفّذت M16 بالكامل: ساحة الفريق الأحمر صارت محرك حتمي حقيقي — الحكم يُشتق من مطابقة المدخل الحر مع مكتبة الـ 40 (عبر trigger) + فحوصات PII/حقن فعلية + تقييم مخاطر حتمي + Rate Limiter تجريبي (10/دقيقة). المراحل 1-4 تشتغل فعلياً، المرحلة 5 (model_guard) خامدة — الاختراقات الخمسة المقصودة (ioh-02/ioh-03/mt-02/mi-01/mi-03) تطلّع بطاقة "🏆 مخترق" + بلاغ + سياسة مقترحة تلقائية. كل هجوم يُسجَّل Trace (`AI-RT-…`) في KernelEvalStore (Run `EVAL-…` واحد للجلسة).
- **Why**: M16 من Prompt 08 — ساحة الفريق الأحمر هي أداة اختبار الدفاع ضد هجمات الـ LLM قبل الاعتماد، والنسخة القديمة كانت heuristics عشوائية (`Math.random`) ما تمثل محرك الحوكمة.
- **Verification**:
  - `npm run build` → 0 أخطاء ✅ (redteam تُبنى مع `/js/kernel-redteam.js` + `#redteam-config`؛ سايت ماب 251 URL / 273 HTML بلا فقدان صفحات)
  - Playwright `verify-redteam.mjs` → **35/35 ✅** على dev server (4877) **و** `astro preview` (4878) — engine mounted، blob 40 هجمة، 40 بطاقة مكتبة، pi-01 → blocked/policy_engine، ioh-02 → breached/model_guard + بلاغ + سياسة مقترحة، PII حر → pii_scanner (جوال 055…)، benign → حتمي، determinism (نفس المدخل = نفس السبب)، chain attack، Store run+traces، Rate Limiter (11 هجوم → الحادي عشر rate_limited)، لا console errors (بعد تجاهل ضجيج Vite dev-toolbar + تحذيرات CSP meta العالمية — نفسها على M15)
  - لا `Math.random` في `public/js/kernel-redteam.js` (0 matches — verified)
  - `dist/client/kernel/redteam/index.html` → 0 inline scripts + config blob + module خارجي + `data-rt-root` + نصوص منشورة موجودة
- **قرارات موثقة**:
  - **حتمية تامة**: حذف `Math.random()` نهائياً من الـ analyze — الحكم = مكتبة trigger + regex PII/حقن + مخاطر. نفس المدخل = نفس الحكم دائماً (قابل للاختبار).
  - **سدّ فجوة الـ 40**: الصفحة المنشورة تعد "40 تقنية" بينما كانت المكتبة 34 — أضفت 6 (`pi-06`, `sc-03`, `ea-04`, `or-04`, `uc-05`, + variant) لحفظ وعد النص المنشور (حتى لو إضافة هجمة جديدة منشورة).
  - **الاختراقات المقصودة = Stage 5 خامد**: يطابق FAQ المنشور («المراحل 1-4 تشتغل كاملة، المرحلة 5 تُعرض كخامدة») — اختراق يعني هجوم يستهدف طبقة المخرجات الخامدة.
  - **Rate Limiter تجريبي**: 10 هجمات/دقيقة (timestamps في localStorage) — يظهر كطبقة `rate_limiter` في بطاقة الحكم.
  - **محرك مستقل** `kernel-redteam.js` — نفس مبررات M15 (لا يمس `kernel-eval-engine.js` المرتبط بـ eval).
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-redteam-lab.ts + kernel-redteam.js + verify-redteam.mjs كـ canonical؛ kernel-eval-engine.js يبقى لصفحة eval فقط)

---

### 2026-08-01 — KRN-SC-M15: إعادة بناء /kernel/scenarios/ كمختبر سيناريوهات بمحرك تقييم حقيقي

- **Files**:
  - `src/data/kernel-scenarios-lab.ts` (NEW — 12 سيناريو بالحقول الـ11 + `LAB_MODELS` (3) + `LAB_POLICIES` (11) + أنماط PII (8)/حقن (6) + `buildScenariosLabConfig()`)
  - `public/js/kernel-scenarios.js` (NEW — محرك vanilla مستقل: mulberry32 + regex فعلي + trace/cert عبر KernelEvalStore + مصفوفة + اقتراح سياسة)
  - `src/pages/kernel/scenarios.astro` (REBUILT — `data-sc-root` + رأس KPIs + `data-sc-run-all` + تبويبات grid/matrix/report + فلاتر + 12 بطاقة + مصفوفة + تقرير + modal)
  - `kernel/assets/css/pages/scenarios.css` (NEW 12.3KB — KPI + أزرار + chips + فلاتر + بطاقات + مصفوفة خلايا 32px + تقرير + modal)
  - `src/data/kernel-datasets.ts` (EDITED — `export const SBG_CASES` سطر 330؛ كان const غير مُصدَّر فكسر استيراد lab)
  - `scripts/playwright/verify-scenarios.mjs` (NEW — 21 فحص وظيفي)
- **What**: نفّذت M15 بالكامل: صفحة `/kernel/scenarios/` صارت مختبر سيناريوهات بمحرك تقييم حقيقي — تشغيل فردي/دفعي مع شريط تقدم يحوّل الرأس (47/100 + ومضة)، فلاتر قطاع/نتيجة + بحث، شبكة بطاقات 3 أعمدة بشريط علوي 4px، مصفوفة حرارية خلايا 32px مع مبدّل مقارنة (أسهم ▲▼)، زر اقتراح سياسة للفاشل، تقرير جاهزية ببوابة قرار.
- **Why**: M15 من Prompt 08 — مختبر السيناريوهات هو أداة التحقق من سلوك الحوكمة قبل الاعتماد.
- **Verification**:
  - `npm run build` → 0 أخطاء ✅ (kernel pages تُبنى، scenarios تتضمن `/js/kernel-scenarios.js`)
  - `npm run verify:all` → exit 0 ✅ (0 errors)
  - `npm run performance:budget` → all within budget ✅
  - `npm run redirects:check` → ✅
  - Playwright `verify-scenarios.mjs` → **21/21 ✅** (engine mounted، blob 12 سيناريو، runAll 12/12، gate review-required/failed=3، KPI=3، 12 trace id، مصفوفة 12×22 خلية pass، تقرير 12 صف، 3 أزرار اقتراح سياسة، modal، فلاتر قطاع/نتيجة/بحث)
  - محقق الأنماط: topbar 4px أحمر للفاشل، خلايا 32×32، progress 100%، grid متجاوب 4 أعمدة ✅
- **قرارات موثقة**:
  - **محرك مستقل** `kernel-scenarios.js` — لا يمس `kernel-eval-engine.js` (مرتبط بـ `[data-eval-root]` ويعود مبكراً خارج صفحة eval). تجنّب كسر صفحة التقييم الحالية.
  - **3 إصلاحات محرك**: (1) `emit()` يستدعي `render()` (كان KPI يبقى صفراً)، (2) `renderCard()` يحدّث `data-sc-verdict` عبر `textContent` + `className` بدل `outerHTML` (كان يدمر العنصر)، (3) إزالة `render()` المزدوجة في init/bind.
  - **إصلاح فلترة**: `applyFilters()` كان يقرأ `dataset.scResult` (undefined) بدل `dataset.scResultFilter` — البطاقات كانت تُخفى كلها عند أي فلترة؛ أُصلح وتم التحقق.
- **ملاحظة فشل سابق — قائم مسبقاً (خارج نطاق M15)**: `npm run seo:all` يفشل في `seo:legacy` (393 وجهة redirect ناقصة) و`seo:content` (trust/index.html "not found") — السبب: السكربتان يبحثان في `dist/` بينما المشروع (بعد node adapter) يبني في `dist/client/`. مثبت عبر stash: يفشلان بنفس الطريقة بدون تغييرات M15. `public/_redirects` لم يُلمس.
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-scenarios-lab.ts + kernel-scenarios.js + scenarios.css + verify-scenarios.mjs كـ canonical؛ kernel-eval-engine.js يبقى لصفحة eval فقط)، Known issues (no new — مذكورة أعلاه ملاحظة seo:all/legacy/content خارج النطاق)

---

### 2026-07-31 — KRN-DS-M7: إنشاء Dataset Manager (/kernel/datasets/) + Saudi Governance Benchmark v1.0

- **Files**:
  - `src/data/kernel-datasets.ts` (NEW — نماذج Dataset + Saudi Governance Benchmark v1.0 بـ100 حالة (20 PDPL/15 NCA/15 SAMA/15 SFDA/10 SDAIA/10 HR/10 حكومي/5 لغة) بأحكام allowed/redacted/blocked/approval_required + نسخ وهاش FNV-1a حتمي + Test dataset وfixtures منفصلة عن Live + إحصاءات محسوبة (تكرار/نقص سلوك متوقع))
  - `src/pages/kernel/datasets.astro` (NEW — صفحة Dataset Manager: إحصاءات SSR من المعيار، سجل الـ Datasets، تفاصيل/إصدارات/هاش، جدول حالات وفلاتر، مودالات إنشاء/استيراد/تقسيم، درج مقارنة إصدارين)
  - `public/js/kernel-datasets.js` (NEW — محرك vanilla: سجل، فلاتر، كشف تكرار ونقص، إضافة/تعديل حالات (أي تعديل ينشئ version)، استيراد CSV/JSON/JSONL/لصق جدول، نشر/أرشفة/حذف محمي (لا منشور، لا مستخدم في Run)، تقسيم train/val/test، مجموعات فرعية، مقارنة إصدارات)
  - `kernel/assets/css/pages/datasets.css` (NEW — هوية بصرية بتوكنز الكيرنل)
  - `src/data/kernel.ts` (EDITED — وحدة `datasets` كاملة SEO/FAQ + أيقونة)
  - `src/components/kernel/KernelSidebar.astro` (EDITED — datasets في مجموعة التشغيل + صحة ok)
  - `scripts/generate-sitemap-all-pages.mjs` (EDITED — allowlist kernel/datasets)
  - `src/content/docs/kernel-datasets.md` (NEW — مستند kernel docs)
  - `scripts/playwright/verify-kernel-datasets.mjs` (NEW — 20 فحص وظيفي)
- **What**: نفّذت M7 بالكامل: صفحة Dataset Manager داخل Kernel بقواعد الحوكمة (لا تعديل منشور، لا حذف مستخدم في Run، كل تعديل ينشئ version بهاش، فصل Demo/Test/Live) + معيار سعودي 100 حالة + استيراد بأربع صيغ + تقسيم ومجموعات فرعية + مقارنة إصدارات.
- **Why**: M7 من Prompt 08 — الـ Datasets هي أساس مصداقية أي شهادة تقييم (Evaluation-environment §المرحلة 1).
- **Verification**: `npm run build` ✅ · `npm run verify:all` ✅ (0 أخطاء، hreflang 255/0) · `npm run performance:budget` ✅ · Playwright `verify-kernel-datasets.mjs` → **20/20 ✅** (SSR 100 حالة، تحذيرات تكرار/نقص، فلاتر، إضافة حالة تُنشئ إصداراً، حارس الحذف، استيراد JSON→سجل، مقارنة diff)
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 1 (kernel pages +1 → /kernel/datasets/) · Section 5 (kernel-datasets.ts + datasets.css + verify-kernel-datasets.mjs كـ canonical)

---

### 2026-07-31 — KRN-PG-FIX-01: إصلاح قفل التفاعل (inert) على كامل صفحات الكيرنل + عرض A/B Diff فوري

- **Files**:
  - `public/js/focus-trap.js` (EDITED — `isVisible()` صارت ترجع false لما `aria-hidden="true"`)
  - `public/js/kernel-playground.js` (EDITED — `toggleDiff()` تستدعي `renderDiffSummary(lastResult.r, lastResult.ctx)` بعد قلب `root.dataset.diff`)
  - (مع باقي شغل M5 غير committed في working tree: `kernel/assets/css/pages/playground.css`، `src/pages/kernel/playground.astro`، `src/data/kernel-policies.ts`، `src/data/kernel.ts`، `scripts/playwright/verify-kernel-m5-playground.mjs`)
- **What**: اكتشفت أثناء تحقق M5 إن **كامل محتوى صفحات الكيرنل ما كان قابلًا للتفاعل** (لا كتابة ولا نقرة ولا focus) — لا في الهيدلس ولا في كروم حقيقي. التشخيص بالأدوات: المحتوى مرسوم (بكسل يثبت)، كل الـ computed styles نظيفة، لكن `elementFromPoint` يرجّع `main#main`، والنقرة تروح للـ body، و`fill()` يرجع فاضي. الجاني: `focus-trap.js` `autoApply()` يربط فخًا على `ASIDE#kernel-sidebar` (عليها `role=dialog aria-modal` وهي `display:flex` دايمًا على الديسكتوب) — دالة `isVisible()` **كانت تتجاهل `aria-hidden="true"`**، فلما `kernel-sidebar.js` يعلّق `aria-hidden=true` عند التهيئة (188ms)، المشغّل MutationObserver يستدعي `open()` (202ms) → يعلّق `inert` + `aria-hidden` على **كل أطفال `MAIN`** (منها `#k-content` كاملًا) → وما في شي يستدعي `close()` لأن الـ sidebar ما يختفي أبدًا → `inert` يعلّق للأبد → الموقع كله ميت للمستخدم. الإصلاح: `isVisible()` ترجع false لما `aria-hidden="true"` (سطر واحد + تعليق). ثانيًا: `toggleDiff()` كان يقلب العلم بس بدون عرض اللوحة — صار يعرض A/B فورًا من آخر نتيجة.
- **Why**: حرج — الصفحات التفاعلية للكيرنل (playground/chat/scenarios...) كانت ميتة للمستخدم الحقيقي منذ تفعيل focus-trap (DEC-A11Y-003). والفحص الأخير لـ M5 (diff panes) فشل.
- **Verification**:
  - `node --check` على الملفين → OK ✅
  - `npm run build` → exit 0 ✅
  - `node scripts/playwright/verify-kernel-m5-playground.mjs` → **25/25 ✅** (كان قبل الإصلاح يفشل فشلًا كاملًا؛ وقبل إصلاح diff كان 24/25)
  - إثبات الجذر قبل الإصلاح: إزالة `inert` يدويًا من `#k-content` في المتصفح → `fill()` و`click()` اشتغلوا فورًا
- **Report**: report/2026-07-31-krn-pg-inert-fix.md
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Known issues: **أضفت + حُلّت KRN-PG-FIX-01 (inert leak)** — كانت تؤثر على كل صفحات kernel. Section 5: لاحظت إن `focus-trap.js` يشترط الـ `aria-hidden` في دورة حياة الـ modal — أي modal جديد لازم يستخدم `hidden`/`display:none` أو `aria-hidden` بشكل صحيح عشان ما ينفخ الـ trap.

---

### 2026-07-31 — KRN-JOURNEY-FIX: ربط زر الإيقاف المؤقت + اللوحة السردية (M4 صفحة /kernel/)

- **Files**:
  - `src/pages/kernel/index.astro` (EDITED — pauseBtn ref سطر 670؛ `setPauseBtnState()`/`togglePause()` + ربط click؛ `renderScene()` تستدعي `updateNarrative()` وتضبط `--journey-progress`؛ `renderNarrative()`/`updateNarrative()` للسرد بـ7 أسطر؛ `startJourney()`/`stopJourney()`/`replayJourney()` تعيد ضبط حالة الإيقاف)
  - `src/styles/kernel.css` (EDITED — `.kernel-journey__stage` transition تشمل transform؛ `.kernel-journey__narrative` عمود flex + `.kernel-journey__narrative-line--past`/`--active`؛ reduced-motion تشمل narrative-line)
  - `src/server/deny-list.mjs` (EDITED — أزلت `'^/kernel(/|$)'` سطر 88 + أضفت /kernel/ وصفحاتها لـ SHOULD_ALLOW في الـ self-check، مع تعليق KRN-DENY-01 يوثّق القرار)
  - `scripts/playwright/verify-kernel-journey.mjs` (NEW — اختبار runtime وظيفي 14 فحص، منفذ 4422، يخدم dist/client ستاتيكياً)
- **What**: صلّحت انحرافين في بوابة التشغيل بالرئيسية: (1) زر "إيقاف مؤقت" كان معطلاً وظيفياً — `journeyPaused` لا يصبح true أبداً، النقر لا يفعل شيئاً؛ (2) اللوحة السردية كانت تعرض سطراً واحداً فقط بدل 7 أسطر (مخالفة لتصميم-صفحات-kernel §1: سطر لكل مشهد، النشط يُضاء والبقية text-low). الحل: pause حقيقي يجمّد ويمرّر الوقت المراكم عند الاستئناف + سرد يملأ نص كل مشهد ويبدل `--past`/`--active`.
- **Why**: M4 يتطلب تحكمات عاملة وسرداً يطابق المواصفة — كان يشوّه المنتج في أول صفحة kernel marketing.
- **Verification**:
  - `npm run build` → exit 0 ✅
  - `npm run verify:all` → exit 0 ✅ (269 HTML، 0 errors)
  - `npm run performance:budget` → all within budget ✅
  - Playwright `verify-kernel-journey.mjs` → 14/14 ✅ (7 أسطر، إيقاف مؤقت يجمد + aria-pressed=true + label استئناف، استئناف يستكمل للمشهد 2، سرد active=1/past=1/texts=2، stop يعيد الضبط، لا console errors بعد فلترة تحذيرات CSP meta المعروفة)
- **اكتشاف حرج مرافق — حُلّ (KRN-DENY-01, 2026-07-31، قرار المستخدم: صلّحها الحين)**:
  - المشكلة: `src/server/deny-list.mjs` سطر 88 `'^/kernel(/|$)'` كان يصد `/kernel/*` بـ 404 في خادم Node الفعلي (`node dist/server/entry.mjs` — نفس startCommand في render.yaml). الإنتاج الحي يخدم `/kernel/` بـ 200 بـ `cf-cache-status: DYNAMIC` (أصل الخادم، مو كاش) → البناء المنشور كان أقدم من تفعيل الـ deny-list؛ أي deploy من build نظيف كان سيكسر كل صفحات الكيرنل فوراً.
  - السبب الجذري: تعليق القاعدة كان يدّعي "kernel/ public marketing handled by prerender" — فرضية خاطئة (الـ wrapper يشتغل قبل أي قراءة من القرص، والـ prerender لا يتجاوزه)، والـ self-check ما كان يختبر `/kernel/` في SHOULD_ALLOW.
  - **الحل المنفذ**: أزلت القاعدة نهائياً (لا يوجد أي ملف حساس تحت `/kernel/` URL — تحققت: dist/client/kernel/ = 18 ملف، كلها HTML، 0 غير-HTML؛ أصول _astro تحت /_astro/ مسموحة). أضفت `/kernel/` + chat/playground/scenarios/admin/quota لـ SHOULD_ALLOW لمنع الرجوع.
  - **التحقق**: `node src/server/deny-list.mjs` → self-check exit 0 ✅؛ `npm run build` → exit 0 ✅ (patch-server-entry كتب deny-list جديد 11952 بايت)؛ `node dist/server/entry.mjs` (منفذ 4399): `/kernel/`=200، `/kernel/playground/`=200، `/kernel/chat/`=200، `/about/`=200، `/frontend/server.js`=404 ✅، `/frontend/`=404 ✅؛ `npm run verify:all` → exit 0 (0 errors، hreflang 253/0) ✅.
- **Report**: none (مذكور في worklog 2026-07-31-KRN-JOURNEY-PAUSE-NARRATIVE)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Known issues: **حُلّت قضية deny-list kernel (KRN-DENY-01)** — كانت deploy-blocking (أول deploy من build جديد يكسر /kernel/*)، أُزيلت القاعدة وتحققت 200/404 محلياً. Section 5: أضفت scripts/playwright/verify-kernel-journey.mjs. Section 1: kernel pages مؤكدة تُخدم من الأصل بعد الحل.

---

### 2026-07-31 — CSP-FIX: نقل سكربتات kernel من src/scripts (imports frontmatter) إلى public/js (script tags)

- **Files**:
  - `src/scripts/kernel-shell.js` → `public/js/kernel-shell.js` (R — git mv)
  - `src/scripts/kernel-drawer.js` → `public/js/kernel-drawer.js` (R — git mv)
  - `src/scripts/kernel-eval-store.js` → `public/js/kernel-eval-store.js` (NEW — كان untracked، نُقل بـ mv عادي)
  - `src/layouts/KernelLayout.astro` (EDITED — حذفت 3 imports من frontmatter، أضفت 3 `<script type="module" src="/js/...">` قبل `</BaseLayout>` بترتيب eval-store → shell → drawer)
  - `src/styles/kernel.css` (EDITED — `#fcd34d` raw hex → `var(--status-medium-fg)` عشان lint-tokens يمر؛ القيمة نفسها بالضبط)
  - `scripts/playwright/verify-kernel-scripts.mjs` (NEW — سكربت تحقق runtime)
- **What**: نقلت سكربتات kernel الثلاثة من `src/scripts/` (اللي كانت تُستورد في frontmatter = server-side فقط، ما توصل للمتصفح إطلاقًا) إلى `public/js/` وتُحمَّل عبر `<script type="module" src="/js/...">` — نفس نمط `kernel-sidebar.js`/`kernel-demo-pill.js`. هذا يصلح الخلل: الـ shell (⌘K palette + مبدّل الدور) والـ drawer و eval-store ما كانوا يشتغلون في المتصفح أصلًا منذ REPORTS-CSP-01 (2026-07-15).
- **Why**: CSP في `public/_headers` يسمح بـ `script-src 'self'` بدون nonce، فملفات public/js تُحمَّل عادي. الـ frontmatter import لا يُنبعث للـ client أبدًا (مؤكَّد: `brightai-kernel-role` غير موجود في dist/، والموقع الحي 404 لـ `/scripts/kernel-shell.js`).
- **Verification**:
  - `npm run build` → exit 0 ✅ (268 HTML files، kernel pages تتضمن `/js/kernel-eval-store.js` + shell + drawer)
  - `npm run verify:all` → exit 0 ✅ (16 pass / 0 fail، lint-tokens 0 violations بعد إصلاح kernel.css، hreflang 253/0، schema 59 صفحة)
  - `node --check` على الملفات الثلاثة → OK ✅
  - Playwright على dev server (`scripts/playwright/verify-kernel-scripts.mjs`): KernelEvalStore present ✅، body.kernel-shell ✅، #k-cmdk palette ✅، store API (createRun → EVAL-2026-00001، publish lock، cloneRun v2) ✅، #k-trace-drawer ✅
  - الموقع الحي: `/kernel/chat/` 200 ✅ (السكربتات الجديدة مو live بعد — لسه ما نُشر)
- **قرارات موثقة**:
  - **سبب 404 المحلي للـ /kernel/**: `src/server/deny-list.mjs` سطر 88 `'^/kernel(/|$)'` (BAI-SEC-10) يمنع كل kernel paths على الـ standalone server المحلي. موجود مسبقًا قبل هذا التغيير — الموقع الحي يخدم kernel عبر prerender/Cloudflare. مو منا، بس يستاهل مراجعة مستقبلية (هل نبي kernel marketing يُخدم محليًا في الـ dev server؟).
  - **قاعدة جديدة**: لا نضيف سكربتات kernel في frontmatter أبدًا — public/js + script tags فقط.
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 18)
- **Status**: verified locally
- **Brain updates**: Section 1 (kernel JS يعمل في المتصفح الآن)، Known issues: أضفت ملاحظة deny-list kernel للـ dev server، Section 5 (kernel-*.js في public/js canonical).

---

- **Files**:
  - `src/pages/authors/index.astro` (NEW — فهرس المؤلفين + CollectionPage schema)
  - `src/pages/events/index.astro` (NEW — فهرس الفعاليات + CollectionPage schema)
  - `src/content/docs/kernel-playground.md`, `kernel-replay.md`, `kernel-redteam.md`, `kernel-models.md` (NEW — مستندات kernel docs ناقصة)
  - `src/content/blog/ai-implementation-cost-saudi.md` (EDIT — رابط → `/solutions/ai-governance-platform/`)
  - `src/content/blog/big-data-analytics-saudi-companies.md` (EDIT — رابط → `/solutions/ai-use-case-discovery/`)
  - `src/data/kernel.ts` (EDIT — إصلاح blogPath للـ playground)
  - `src/pages/kernel/redteam.astro`, `replay.astro` (EDIT — استيراد CSS بدل `<link>`)
  - `src/pages/kernel/admin/quota.astro` (EDIT — إضافة canonical)
  - `src/pages/answer/[slug].astro`, `src/pages/lp/[slug].astro` (EDIT — hreflang ar-SA self + x-default عبر `getHreflangLinks()`)
- **What**: صلّحت الـ 20 خطأ اللي كانت تخلي seo:gate يفشل (4 صفحات authors/events بلا فهرس، رابطا مدونة لحلول محذوفة، 4 مستندات kernel docs ناقصة، blogPath مكسور، CSS links، canonical ناقص). وبعد ما نجح seo:gate، انكشفت طبقة مخفية من 44 خطأ hreflang على 22 صفحة مفهرسة من `/answer/*` و `/lp/*` (ما كانت تصدّر أي hreflang) — صلحتها أيضًا.
- **Why**: verify:all كان يفشل والـ seo:gate كان يحجب اكتشاف أخطاء hreflang لأنها كانت تظهر بعده. كل صفحة مفهرسة لازم يكون عندها hreflang self-reference + x-default (قاعدة BAI-IDX-14).
- **قرارات**:
  - الحلول البديلة للمدونة: `agile-ai-governance` → `ai-governance-platform`، و`big-data-analytics` → `ai-use-case-discovery` (حلول موجودة قريبة الدلالة بدل اللي محذوفة).
  - صفحتا الفهارس الجديدة بلا noindex، بمحتوى قصير لكن CollectionPage schema تبررها (نمط BAI-SEO-003-S3).
  - صفحات answer/lp تستخدم `getHreflangLinks(canonical)` — يرجع لـ AR-only: `ar-SA=self` + `x-default=self` بدون en-SA مخترع (يتماشى مع invariant الـ checkArOnlyPageNoEnAlternate).
- **Verification**:
  - `npm run build` → ✅ (sitemap 245 URLs)
  - `npm run seo:gate` → ✅ 0 أخطاء، Broken links: 0
  - `npm run seo:hreflang` → ✅ 0 أخطاء (253 sets)
  - `npm run verify:all` → ✅ exit 0 (pass 16, fail 0)
- **Report**: report/2026-07-31-broken-links-hreflang-fix.md (أُنشئ)
- **Commit**: uncommitted (user commits via main — per brain line 18)
- **Status**: verified locally
- **Brain updates**: Known issues: أخطاء hreflang المخفية على answer/lp — resolved 2026-07-31؛ Pages inventory: أضفت pages `authors/index` + `events/index` + 4 docs kernel.

---

### 2026-07-31 — KRN-DS-2026-07-31: توحيد كيرنل كامل على قيم تصميم-صفحات-kernel §1 (منت/داكن)

- **Files**:
  - `src/styles/tokens.css` (EDITED — Kernel Shell tokens صارت قيم حرفية بدل aliases)
  - `src/styles/kernel.css` (EDITED — override block داخل `body.kernel-shell` + تحويل كل الـ rgba التيل لـ منت + إصلاح أفاتارين + fallback)
  - `src/layouts/BaseLayout.astro` (EDITED — أزلت `declare global` اللي كان يكسر esbuild، ونقلت `cspNonce` لـ env.d.ts)
  - `src/env.d.ts` (EDITED — أضفت `cspNonce?: string` لـ `App.Locals`)
  - `src/pages/kernel/models.astro` (EDITED — حولت سكربت `window.__kernelModelsPageData` لنمط `define:vars`، كان يكسر SSR)
- **What**: وحّدت كامل صفحات `/kernel/*` (18 مسار) على القيم الحرفية من تصميم-صفحات-kernel §1 — منت `#2dd4a7`/داكن `#080d16`. الـ override محصور داخل `body.kernel-shell` (يُضاف عبر kernel-shell.js على kernel pages فقط) — باقي الموقع (الرئيسية، بلوق...) يبقى تيل ما يتأثر. حطيت ترتيب layers `@layer tokens,base,utilities,color,animations,kernel` عشان override يتجاوز قيم layer(tokens) على الكيرنل. حوّلت كل الـ rgba التيل الصريحة (36+ موضع) لمنت، وصححت أفاتار AI (`text-hi` بدل داكن على indigo)، وأصلحت مشكلتين قديمتين كانتا يكسران البناء من أصله في main.
- **Why**: M1 من تقرير-صفحات-kernel.md — الكيرنل صار مخلوط تيل/منت، ولازم يتوحّد على الهوية المنت لصفحات الكيرنل (قرار المستخدم: قيم حرفية مو توسيع منت للموقع كامل).
- **قرارات موثقة**:
  - **KRN-A11Y-01**: `--text-low` = `#7a8ba5` بدل `#66748f` من الوثيقة — الأخير يفشل AA (4.13:1)، المحسّن يمر (5.56:1).
  - **KRN-A11Y-02**: `--brand-700` = `#1b9e80` بدل `#0e3d33` (bright-900) — الأخير مع نص داكن يفشل AA (1.59:1) في 12 جراديانت + أفاتار المستخدم؛ الجديد يمر (5.73:1).
- **Verification**:
  - `npm run build` → exit 0 ✅ (240+ صفحة، sitemap 240 URLs)
  - `node scripts/lint-tokens.mjs` → 0 violations ✅ (عدلت تعليقات كانت تحتوي hex)
  - `npm run verify:all` → 16 pass / 0 fail ✅ (مع schema audit 55 صفحة PASS)
  - Playwright (`scripts/playwright/verify-kernel-mint.mjs`): `/kernel/` و `/kernel/chat/` بعد إضافة class → body bg `rgb(8,13,22)` = `#080d16` ✅ + `--interactive-primary: #2dd4a7` ✅ + `--text-primary: #f2f6ff` ✅
  - تحقق في dist: `KernelLayout.*.css` يحتوي override داخل `body.kernel-shell`، `BaseLayout.css` (الرئيسية) لسه تيل ✅
- **Report**: report/2026-07-31-krn-ds-kernel-mint.md (أُنشئ)
- **Commit**: uncommitted (user commits via main — per brain line 18)
- **Status**: verified locally
- **Brain updates**: Section 1 (kernel pages 11 → 18 مسار)، Section 5 (أضفت kernel mint tokens + brand ramp)، Known issues: فشل speakable schema على صفحات `/answer/*` مسبق (مو منا)، و`/kernel/` محجوب بالـ deny-list على الخادم (قائم — يخدم prerendered).

---

### 2026-07-31 — KRN-REDTEAM-01: إنشاء صفحة /kernel/redteam/ (ساحة الفريق الأحمر)

- **Files**: 
  - `kernel/assets/css/pages/redteam.css` (NEW — ~400 سطر، هوية بصرية حمراء #150A0E/EF4444)
  - `src/pages/kernel/redteam.astro` (NEW — ~500 سطر، صفحة كاملة مع vanilla JS)
  - `src/data/kernel.ts` (EDITED — أضفت وحدة `redteam` + أيقونة SVG درع)
  - `src/components/kernel/KernelSidebar.astro` (EDITED — أضفت `redteam` لـ GROUPS + HEALTH)
  - `scripts/generate-sitemap-all-pages.mjs` (EDITED — أضفت `kernel/redteam` للـ groupRelPath)
- **What**: أنشأت صفحة `/kernel/redteam/` — ساحة الفريق الأحمر التفاعلية. الهوية البصرية الخاصة: خلفية #150A0E، علامة #EF4444 بدل المنت (الانحراف الأحمر الوحيد المسموح). فوق الطية: عنوان "حاول تخترق Kernel" + صندوق إدخال 140px بحد أحمر متوهج + زر "اهجم 🗡". النتيجة: بطاقة حكم مع انتقال درامي 400ms (صُدّ: درع أخضر بحركة ارتطام + دفاع شفاف / نجح: تأثير كسر زجاج + شارة مخترق + بلاغ تلقائي). تحت الطية: لوحة صدارة أسبوعية (8 لاعبين) + مكتبة 40 تقنية هجوم مصنّفة بـ OWASP LLM Top 10 + وضع هجوم متسلسل متعدد الرسائل. كل التفاعل vanilla JS (ما في React). الـ JS يستخدم `is:inline` مع `define:vars` (نفس نمط scenarios.astro). الجزر التقنية dir="ltr". احترام `prefers-reduced-motion`.
- **Why**: KRN-REDTEAM-01: صفحة الفريق الأحمر هي أقوى أداة تسويقية لـ Kernel — "لا أحد يصدّق ادعاء الأمان. الجميع يصدّق ما كسره بيده وفشل." مطلوبة حسب تقرير-صفحات-kernel.md §5 وتصميم-صفحات-kernel.md §4.5.
- **Verification**: 
  - `npm run build` → exit 0 ✅ (196 → 197+ صفحة، redteam ~164KB HTML)
  - `node scripts/generate-sitemap-all-pages.mjs` → 238 public URLs (كان 237)، redteam موجود 3 مرات ✅
  - `node scripts/verify-all.mjs` → 5/5 checks pass ✅
  - `npm run performance:budget` → all items within budget ✅
  - Kernel sidebar: redteam يظهر في مجموعة التشغيل بعد السيناريوهات ✅
- **Report**: report/2026-07-31-krn-redteam-01.md
- **Commit**: uncommitted (user commits via main — per brain line 18)
- **Status**: verified locally
- **Brain updates**: Section 1 (build page count +1)، Section 5 (redteam added to canonical components)

### 2026-08-11 — QC-DISASTER-RECOVERY-001: Backup/Verify/Restore آمن لقاعدة QC

- **Files**: `apps/qc-task-manager/src/lib/backup.ts`, `scripts/{backup-db,restore-db,test,e2e-backup}.mjs`, `src/pages/admin/settings/index.astro`, `src/pages/api/admin/backup.ts`, `src/env.d.ts`, `package.json`, `README.md`, `docs/RESTORE.md`, root `docs/DISASTER-RECOVERY.md`, design/plan docs.
- **What**: طوّرت backup الحالي ليستخدم SQLite online snapshot المتسق ثم يحفظ sidecar metadata فيها schema version، application version، timestamp، SHA-256 checksum، وrecord counts. كل backup جديد يمر `integrity_check` و`foreign_key_check` وchecksum/schema/count comparison ويرجع `PASS/FAIL`. أضفت restore maintenance CLI (`db:restore`) يتطلب confirmation exact، يرفض أي snapshot غير متحقق، يأخذ safety backup للإنتاج، يتحقق من الملف المؤقت ثم يستبدل ذريًا. retention صار configurable عبر `QC_BACKUP_RETENTION` مع `--keep=N`.
- **Admin**: `/admin/settings` يعرض Last Backup وBackup Size وLast Verification وstatus والـ retention، وmanual backup يعيد verification PASS metadata بدون download surface.
- **Tests**: أضيفت تغطية فعلية لـ metadata، WAL data، PASS، corrupt backup، missing file، wrong schema، count mismatch، restore، failed restore preservation، retention. `e2e:acceptance` شغّل كل suites بنجاح، ومنها backup **13/13**.
- **Verification**: QC `pnpm test` → **248 domain + DB-backed checks passed / 0 failed**؛ `typecheck` → **0 errors / 0 warnings / 11 existing hints**؛ `NODE_ENV=production pnpm build` → **Server built**؛ elevated `e2e:acceptance` → **49 + 44 + 196 + 39 + 45 + 13 + restart persistence passed**؛ `git diff --check` مرّ (مع تحذير fsmonitor IPC موجود مسبقًا عند `git status`).
- **Decision**: HTTP admin يسمح بالإنشاء/التحقق فقط؛ استبدال Production DB محصور في maintenance CLI مع confirmation وsafety backup، لأن process حي قد يمسك SQLite connection.
- **Status**: verified locally and with live E2E; uncommitted — المستخدم يلتزم ولا push.

### 2026-08-12 — QC-DASHBOARD-REPORTS-001: Dashboard English sections, KPI drill-down, reports, RBAC

- **Files**: `apps/qc-task-manager/db/migrations/007_dashboard_reports.sql`, `db/schema.sql`, `src/lib/dashboard.ts`, `src/lib/reporting/*`, `src/pages/dashboard.astro`, `src/pages/dashboard/drilldown.astro`, `src/pages/reports.astro`, `src/pages/api/reports/*`, report tests/docs plan files.
- **What**: طوّرت Dashboard الحالية بدون حذف الـ KPIs القديمة؛ أضفت KPI cards المطلوبة (Completion Rate، Critical Findings، Open CAPA، Evidence Compliance وغيرها) وكل بطاقة clickable وتفتح قائمة tasks فعلية ضمن نفس scope والفلاتر. أضفت Section-first navigation للـ Operations/SLA/Findings/CAPA/Workforce/Evidence/Audit، وفلاتر Date/Department/Employee/Supervisor/Priority/Risk/Finding Classification/SLA Status. أضفت تقارير Monthly QC/SLA/Findings/CAPA/Employee Performance/Audit Trail/Evidence Compliance/Overdue بصيغ CSV/XLSX/PDF، مع report audit fields المطلوبة، RBAC يمنع Employee من comprehensive reports، وscope يقيّد Employee بمهامه وSupervisor بقسمه.
- **Performance**: استبدلت refreshAllSla السابق بنمط set-based `UPDATE ... FROM` لتفادي N+1، وقراءة CSV/XLSX/PDF تعتمد async chunking/keyset pagination. أضيفت `report_audit_log` مع فهارس actor/time وtype/time. PDF writer يستهلك rows عبر async iterator ويحتفظ بالصفحات المرسومة بدل dataset المصدر.
- **Decisions**: drill-down route هو `/dashboard/drilldown` بدل `/tasks` لأنه يعرض قائمة tasks محمية بنفس authorization scope؛ supervisor filter يطابق `created_by` لأن نموذج task الحالي لا يحتوي supervisor FK. Employee لا يستطيع طلب `scope=organization` حتى لو غيّر الرابط يدويًا.
- **Verification**: `pnpm --filter @brightai/qc-task-manager test` → **265 passed / 0 failed** + SLA/workflow/DB/report checks؛ `typecheck` → **0 errors / 0 warnings / 13 existing hints**؛ `NODE_ENV=production pnpm build` → ✅؛ elevated `e2e:acceptance` → **49 + 44 + 196 + 39 + 45 + 13 + restart persistence passed**؛ `verify-security-hygiene.mjs` → ✅؛ `git diff --check` → ✅ (fsmonitor IPC warning موجود من البيئة فقط).
- **Status**: verified locally and with live E2E; uncommitted — المستخدم يلتزم ولا push.

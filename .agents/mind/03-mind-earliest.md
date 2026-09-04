---
file: 03-mind-earliest.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
part: 3/3 — الجزء الأقدم من عقل الوكيل (2026-08-02 → 2026-07-31 + ملحقات QC)
source: .agents/brain.md v2.7.99 (مقسوم 2026-08-14)
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

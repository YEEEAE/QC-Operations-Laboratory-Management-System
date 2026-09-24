# QC Operations & Laboratory Management System — Compact Project Mind

- **2026-09-24 — QC-ADP-11 / أمن وAI وسلسلة توريد**
  - Changed: exact provider endpoint allowlist; 4 formerly UNKNOWN package licenses resolved as MIT by pinned installed-text hashes; route denominator fixed at 10.
  - Evidence refreshed on HEAD `6b999b71c54e7e9c29399f8bae6a25b83ee39385`: AI/advisory + requirements contract 97/97 PASS; authenticated least-privilege AI denial E2E 1/1 PASS on disposable PG18.6; SBOM 822 packages, UNKNOWN=0; build/Astro check/release identity PASS; requirements guard PASS after accepting existing `QC-ADP-03` owner syntax. Advisory audit BLOCKED by registry DNS; owner provider policy/live eval remain approval-blocked.
  - State: PARTIAL / NO-GO (RT-AI-001 6/10 = 60%); `audit/2026-09-24/QC-ADP-11-handoff.md`.

- **2026-09-24 — QC-ADP-10 / report parity:** Changed Action export to pass all seven filters through the shared strict parser and unified screen/CSV/XLSX provenance; Evidence: Docker PG18 parity 9/9, focused suite 35/35, Astro 0 errors/0 warnings. State: PARTIAL / NO-GO — authenticated print E2E and durable cross-request snapshot/retention decision remain open; handoff `audit/2026-09-24/QC-ADP-10-report-parity-handoff.md`.

- **2026-09-24 — QC-ADP-09 / accessibility route handoff**
  - Changed: no runtime UI change; root cause remains missing route/state/AT evidence for F-010.
  - Evidence: WCAG contract 9/9 and local login/404 axe+keyboard subset 2/2 PASS; 8 viewport captures show no overflow; live qclevel.top skip links work for dashboard/tasks. Full route cards remain open; 88 have no fresh route evidence, and AT/full denominators remain unverified. Handoff/evidence: `audit/2026-09-24/QC-ADP-09-accessibility-route-handoff.md`.
  - State: PARTIAL / BLOCKED / NO-GO — no route fully closed on source HEAD `a7fb73eb9dd370a973634ac89f954bc369c83232`; live release identity is UNVERIFIED.

- **2026-09-24 — QC-ADP-08 / role-state matrix handoff**
  - Changed: added a real disposable task fixture, task denial/stale-version integration case, and TLS-loopback PG18 E2E override. 450 remains a gross planning envelope, not an applicable denominator.
  - Evidence: PG18.6; `/tasks/[taskId]` GET + direct denied POST 1/1 PASS with unchanged row/audit; server-contract 7/7 and nine authz integration files 23/23 PASS; typecheck 0 errors; build/release identity PASS at `069bebf`, migration 0041. Other routes remain NOT VERIFIED; handoff: `audit/2026-09-24/QC-ADP-08-role-state-matrix-handoff.md`.
  - State: PARTIAL / BLOCKED / NO-GO — one route has partial HTTP proof; no full page closure, F-009/F-018 and owner-dependent decisions remain open.
  - Mind rollover: أقدم سجلات 2026-09-23 نُقلت إلى `02-mind-mid.md` بعد التحقق من حفظها.

- **2026-09-24 — QC-ADP-07 / مصادر لوحة القرار**
  - Changed: أضيف document-review read model bounded بنفس actor predicate للعدد والصفوف، queue في dashboard/work ورابط register؛ أضيفت فهارس migration 0041. الجودة وblocked reason وreject analytics ما زالت محجوبة بسياسات/مصادر غير معتمدة.
  - Evidence: unit/UI 20/20 PASS وAstro check 0 errors؛ PostgreSQL 18/Testcontainers BLOCKED (لا container runtime)، لذا parity/role E2E/perf وlive schema/role NOT VERIFIED. 12 فحص route ما زالت 0 PASS قبولًا كاملًا؛ تفاصيل `audit/2026-09-24/QC-ADP-07-dashboard-decision-sources-handoff.md`.
  - State: PARTIAL / NO-GO — source migration head 0041؛ لا دليل تطبيق live ولا إغلاق قرارات الجودة/الرفض/سبب التعطيل.

- **2026-09-24 — QC-ADP-06 / سلسلة NCR/RCA/CAPA**
  - Changed: لا تغيير runtime/schema؛ سبب التعطل قرارات QMS المفتوحة PD-15/16/17/18، مع تعارض معيار القبول المطلق للفعالية مع استثناء P-04 المعتمد.
  - Evidence: quality unit/integration-file 17/17 PASS؛ PG18 BLOCKED/NOT RUN؛ E2E blocked قبل السيناريو بسبب Chromium sandbox؛ 13 route × 5 checks = 65، 0 PASS.
  - State: BLOCKED / NO-GO — handoff وقرارات المالك المطلوبة في `audit/2026-09-24/QC-ADP-06-ncr-rca-capa-handoff.md`.

- **2026-09-24 — QC-ADP-05 / laboratory report drafts**
  - Changed: fixed draft-storage failure being presented as permission denial; added grant/scope and source unit/precision recovery guidance. No grant/schema/scientific-source change.
  - Evidence: focused unit/UI 12/12 PASS; Astro check 0 errors; PostgreSQL 18 BLOCKED (no container runtime); likely live schema lag, actual yazeed grant/source approval NOT VERIFIED. Handoff: `audit/2026-09-24/QC-ADP-05-laboratory-report-drafts-handoff.md`.
  - State: PARTIAL / NO-GO — approved source/revision and live grant/schema evidence remain blocked; affected routes 0/50 acceptance checks closed.
- **2026-09-24 — QC-ADP-03 / signed release evidence intake**
  - Changed: added signer/scope/digest-bound provider intake and append-only evidence schema; release approval is fail-closed until the approved 19-gate register reconciles to exact candidate.
  - Evidence: unit 38/38 PASS; Astro check 0 errors; PostgreSQL integration BLOCKED (container runtime unavailable); exact-SHA CI, live deployment identity, provider/UAT evidence NOT VERIFIED. Details `audit/2026-09-24/QC-ADP-03-release-evidence-handoff.md`.
  - State: PARTIAL / NO-GO — migration 0040 unapplied; owner-approved register/signer scope and exact-SHA candidate absent.

- **2026-09-24 — QC-ADP-02 / handoff مصدر التفتيش والاعتماد**
  - Changed: ثُبّت مقام 6 فحوص لكل واحدة من بطاقات Quarantine العشر؛ PD-01/02/07 بقيت مفتوحة ولا تغيير runtime أو schema.
  - Evidence: source trace على `7e0a3535f80b956bcfe0143201ddfee2e4277e4c`؛ focused unit 40/40 PASS، لكن source-hash binding ونتيجة التقرير الرسمية غير مكتملين. قرار QC/QMS وPG18/E2E BLOCKED/NOT RUN؛ التفاصيل `audit/2026-09-24/QC-ADP-02-inspection-source-approval-handoff.md`.
  - State: BLOCKED — NO-GO حتى اعتماد المصدر والمعيار وسياسة الحكم.

- **2026-09-24 — QC-ADP-01 / مصالحة مخطط Reject Reports**
  - Changed: readiness candidate صار يطابق ledger/الأعمدة وقيود FK/unique؛ صفحات التفاصيل تعيد حالة خطأ 503 مفهومة عند نقص المخطط. لا migration تاريخية عُدلت.
  - Evidence: domain/approval unit 20/20 PASS؛ Astro check 0 errors؛ PostgreSQL 18/Testcontainers BLOCKED لغياب runtime؛ health المتاح تاريخيًا 0018 applied و21 pending.
  - State: PARTIAL / NO-GO — 4 بطاقات Reject Reports لكل منها 0/6 قبول؛ تقرير الخطة/الهاندوف `audit/2026-09-24/QC-ADP-01-reject-reports-schema-reconciliation.md`.

- **2026-09-24 — QC-ADAPTIVE-PAGE-BY-PAGE-AUDIT-001 / تدقيق الصفحات التكيفي**
  - Changed: جرد 90 موضع صفحة (88 ملفًا فعليًا، مساران deferred)، تقرير مصدر/حي وحزمة 26 مهمة مجال و90 بطاقة قبول صفحة و29 finding و20 تحسينًا؛ لكل صفحة مصطلح/مشكلة أو فجوة/حل/اختبار، وبوابة استلام NO-GO. سُحبت درجات الجودة التقديرية غير القابلة لإعادة الحساب. لا تعديل للتطبيق أو الإنتاج.
  - Evidence: 47 وجهة حية قراءة فقط بحساب yazeed في الجولة الأصلية؛ health يؤكد 0018 applied/0039 shipped وReject Reports محجوب وrelease/restore غير مثبتين؛ 90/90 بطاقة قبول وربط findings/prompts والتحسينات وHTML/JS PASS. لا PostgreSQL/E2E/UAT جديد.
  - State: PARTIAL / NO-GO — جودة الصفحات والنظام NOT VERIFIED رقميًا؛ `audit/2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md`.

- **2026-09-24 — QC-LAB-REPORT-TEMPLATES-ULTIMATE-001 / قوالب تقارير المختبر**
  - Changed: فصل حفظ المسودات خلف repository مع تحقق الصلاحيات/المالك والإصدار والتدقيق؛ أضيف عرض الطباعة وتحذير التغييرات غير المحفوظة دون اختراع وحدات أو حدود قياس.
  - Evidence: feature unit 6/6، typecheck 971/0 أخطاء، build وarchitecture وrequirements PASS؛ PostgreSQL integration BLOCKED لغياب container runtime. Full unit PARTIAL؛ التفاصيل `audit/2026-09-24/qc-lab-report-templates-ultimate-001.md`.
  - State: PARTIAL — لا يوجد نموذج مصدر معتمد/إصدار لتأكيد المطابقة، ولا دليل PostgreSQL أو browser runtime؛ لا اعتماد أو نتيجة علمية رسمية.
  - Key files: `src/pages/laboratory/report-templates.astro`, `src/modules/laboratory/`, `audit/2026-09-24/qc-lab-report-templates-ultimate-001.md`.

- **2026-09-24 — AI-POLICY-BOUNDARY / processing consent and advisory evals**
  - Changed: external providers now require a complete approved policy artifact, policy-permitted content class, and per-request consent; outputs expose provenance and local correction guidance. Eval dataset v4 covers 33 synthetic cases.
  - Evidence: AI-focused tests 90/90 PASS; eval category disposition errors 0%; typecheck 967/0 errors; build 1/1 PASS. No live provider calls. Source policy is absent, so external processing remains disabled.
  - State: PARTIAL — owner must provide actual provider/location/retention/deletion policy before any external processing can be enabled.
  - Key files: `Documents/AI-PROVIDERS.md`, `src/modules/ai-advisory/`, `audit/100-percent/ai-evals/results-2026-09-24.json`.

- **2026-09-24 — SECURITY-BOUNDARIES-SUPPLY-CHAIN / threat model and candidate gate**
  - Changed: expanded identity/files/AI/reports/approvals threat model; CI now produces lockfile-bound CycloneDX + license inventory and provenance/SBOM attestations; AI HTTP rejects redirects; poisoned SQL import test added.
  - Evidence: PG18 focused integration 17/17 PASS; AI provider HTTP 25/25 PASS; actual-server security E2E 8 PASS/4 FAIL (authenticated file cases blocked at login controls); SBOM 822 locked packages, 4 installed license declarations UNKNOWN; dependency advisory result NOT VERIFIED (registry unavailable); secret scan 10 high-entropy assignment candidates in ignored local env, values not shown.
  - State: PARTIAL — see `Documents/THREAT-MODEL-030.md`; Critical/High triage owner `yazeed` (24h/7d); four unknown license records due 2026-10-01.

- **2026-09-24 — LAB-REPORT-ENTRY / قالبا تقريري ضغط المختبر**
  - Changed: قالبا إدخال مسودة للاختبارين المطلوبين، 12 عينة، وحفظ مملوك للمستخدم بإصدار وتدقيق؛ يظل اعتماد الاختبار الرسمي تابعًا للقالب والمصدر المعتمدين.
  - Evidence: architecture PASS؛ Astro build PASS على Node 24.20.0؛ typecheck يظهر خطأَي declarations قائمين في release `.mjs` فقط. حفظ PostgreSQL الفعلي NOT VERIFIED لأن migration 0039 لم تُطبّق على قاعدة اختبار.
  - State: PARTIAL — واجهة/كود المسودة DONE محليًا؛ تشغيلها على قاعدة بيانات يحتاج تطبيق 0039 في بيئة مخولة.
  - Key files: `src/pages/laboratory/report-templates.astro`, `db/migrations/0039_laboratory_report_drafts.sql`.

- **2026-09-24 — Mind rollover (LAB-REPORT-ENTRY):** نُقلت سجلات UI/tooling الأقدم من `01` إلى أعلى `02` بعد التحقق؛ بقيت الحالة الحالية والقيود.

- **2026-09-24 — ACCESSIBILITY-TRANSITION-RECOVERY / POST fallback وتوثيق حدود التدقيق**
  - Changed: إضافة server POST/recovery لإنشاء نسخة مستند، وتقليص سجل الأسطح بلا baseline من 9 إلى 8.
  - Evidence: Astro check 963 ملفات/0 errors؛ عقد mutation safety 12/12. مصفوفة browser/AT موثقة NOT RUN لغياب بيانات E2E واعتماد بشري؛ `audit/2026-09-24/accessibility-responsive-transition-audit.md`.
  - State: PARTIAL — لا ادعاء WCAG أو إغلاق للأسطح الثمانية المتبقية.

- **2026-09-23 — REGISTERS-REPORT-PROVENANCE / مصدر التقرير وسلامة التصدير**
  - Changed: تقرير quarantine screen/print/CSV/XLSX يوضح منفذ التقرير والمصدر والنطاق والفلاتر والفترة والفرز والعدد والوقت وحالة النسخة غير المعتمدة؛ screen/export يشتركان في parser صارم؛ تحييد صيغ CSV/XLSX يشمل المحارف البيضاء/التحكمية السابقة للصيغة؛ الجداول المشتركة توفر اختيار كثافة من دون إخفاء الأعمدة، وتوضح أن الإجراءات الجماعية غير متاحة.
  - Evidence: focused reporting/filter/export tests 19/19 PASS؛ typecheck وAstro check وbuild PASS. populated PostgreSQL report/scope parity BLOCKED لغياب container runtime.
  - State: PARTIAL — تعميم source query/actor scope/server pagination وبوّابات KPI عبر جميع السجلات خارج نطاق التغيير الحالي وما زالت فجوة مفتوحة.
  - Key files: `src/modules/reporting/`, `src/ui/components/data/DataTable.astro`, `src/pages/reports/[reportCode].astro`.

- **2026-09-23 — QC-VISUAL-SYSTEM / اتجاه غرفة القرار**
  - Changed: ثلاثة اتجاهات موثقة، مع تطبيق غرفة القرار/المقعد العلمي/سجل الدليل على dashboard والسجلات ونموذج المختبر والاعتمادات؛ semantic tokens وحالات موحدة وحوكمة المساهمة.
  - Evidence: build وarchitecture PASS؛ contrast للحالات النصية المختبرة ≥4.5:1؛ لقطات specimen توضيحية عند 320/390/768/1440 وforced-colors/reduced-motion/print بلا page overflow. typecheck بقي بخطأين قائمين لتعريفات release `.mjs`؛ browser مصادق وقياس زمن مهمة بشرية NOT VERIFIED.
  - State: PARTIAL — اللقطات تثبت النموذج المرئي المحلي، لا سلوك البيانات الحية أو قبول المستخدم.
  - Key files: `Documents/QC-VISUAL-SYSTEM.md`, `src/ui/styles/workspaces.css`, `audit/2026-09-23/qc-visual-specimen.html`.

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
- أضيف محليًا endpoint لاستقبال أدلة CI/security/database/E2E بتوقيع HMAC ومجال اعتماد خادمي وبصمة immutable؛ لا توجد مفاتيح/سياسة owner-approved configured ولا run حالي ingested، واختبار PostgreSQL 18 BLOCKED. مسار UAT البشري الموقّع مستقل ولم يقدم evidence حالي.
- سجل الجاهزية المعتمد 19 بوابة لا يملك بعد mapping/schema إلى الفئات الداخلية الثماني؛ القراءة التنفيذية لقرار الـ19 ترجع `false` fail-closed، واعتماد المرشح محجوب إلى حين مصالحة register مع exact identity.
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
- **Laboratory report entry (2026-09-24):** مسودتا Subatmospheric Pressure Air Leakage وPressure Decay متاحتان من صفحة المختبر، و12 عينة لكل منهما، وتُحفظان منفصلتين عن `lab_tests`. الحقول نصّية transcription-only لغياب نموذج مصدر معتمد/رقم مراجعة؛ لا وحدات أو حدود أو تقييم علمي مستنتج، والطباعة ليست تقريرًا معتمدًا. `0039_laboratory_report_drafts` رأس المصدر المحلي؛ repository/integration PostgreSQL runtime NOT VERIFIED لغياب container runtime، دون تغيير قاعدة الإنتاج.
- `Inspection Result` و`Release System State` حالتان منفصلتان؛ `PASS ≠ RELEASED`.
- Laboratory state machine is fully implemented for Create/Save/Submit/Review/Return/Resume/Approve/**Reject**; `VOID` (TR-LAB-008) remains unimplemented and policy-denied.
- **Two-stage approval (QC-100-FINAL-013، مُثبت runtime):** `UNDER_REVIEW --stage-1 Supervisor (PERM-INSP/LAB-APPROVE)--> PENDING_QCM_APPROVAL --stage-2 QCM (MANAGER أو yazeed المسمى؛ PERM-APR-APPROVE + PERM-ESIG-SIGN + reauthentication)--> APPROVED (مقفل)` بتوقيع واحد بمعنى `FINAL_APPROVE` مربوط بالنسخة السابقة للانتقال؛ stage-1 حدث سير عمل بلا توقيع؛ لا مسار تجاوز؛ `REOPEN` بسبب مدقّق من سلطة الاعتماد النهائي يعيد إلى `UNDER_REVIEW` ولا يمحو سجل التوقيع، ثم يعاد إلزاميًا ترتيب المرحلتين. اعتماد تقرير التفتيش يحدّث Receiving إلى `INSPECTION_COMPLETE` ولا يُفرج أبدًا، وعنصر Receiving في `HOLD` لا يُستعاد (الطلب يُرفض).
- **Blocker قائم (F-013-1 / PD-01/02/07):** المصدر الحالي يوصل إنشاء التفتيش من الاستلام ويحسب نتيجة النقطة خادميًا من rule fields في نسخة القالب، لكنه لا يثبت ربط القواعد بمصدر QC معتمد وبصمته، ولا يحتوي تجميعًا يكتب `inspection_reports.final_result`. `ApproveInspectionUseCase` يشترط النتيجة الرسمية، و`SaveInspectionDraftUseCase` يرفض ادعاء المتصفح؛ لذا الإيجابي العلمي يبقى محجوبًا حتى اعتماد المصدر/المعيار/الحكم اليدوي. قرار الأدوار OD-2026-09-23-RBAC-01 يغطي P-05 role slice فقط. handoff QC-ADP-02: كل واحدة من البطاقات العشر 0/6؛ PG18/E2E NOT RUN.
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
- coverage panel مُشتق من read model لا من copy الصفحة: 13 مدخلًا؛ `AVAILABLE` يشمل laboratory workload، tasks، وdocument review queue (source bounded وsame-filter drilldown)؛ `NOT_SUPPLIED` يبقى لسبب blocked الحر، reject analytics، quality summary، وsystem health owner-only، ولكل مدخل سببه ومالكه.
- document review queue مُنفذ source-side لكن PG parity والأدوار والأداء/live schema غير مثبتة حتى تطبيق/اختبار migration 0041 في مرشح مخول. لا تعرض blocked free text ولا reject analytics قبل قرارات المصدر والنطاق، ولا quality KPI حتى اعتماد ownership filter لكل domain. التفاصيل والحالة `PARTIAL / NO-GO`: `audit/2026-09-24/QC-ADP-07-dashboard-decision-sources-handoff.md`.

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
- **أسطح السجل الموحّدة:** Assets family + tasks + change-requests تستعمل `FilterBar` (GET + `role=search` + Clear)، `AppliedFilters` (شرائح بدلالة stateLabel)، و`EmptyTableState` (فصل EMPTY عن FILTERED EMPTY)؛ `/tasks` و`/laboratory/tests` يستعملان `Pagination` الخادمية و`DataTable` المشتركة. `DataTable` يدعم كثافة قابلة للحفظ ويصرّح عندما لا توجد bulk actions؛ تقارير الشاشة تستخدم كثافة محلية محفوظة ووسمًا صريحًا لغياب الإجراءات الجماعية. لا تزال عائلات سجلات أخرى خارج هذا التعميم.
- **bounded registers = 3 فقط** (`/tasks`، `/audit`، `/reject-reports`) عبر `page`/`offset`؛ الباقي 15 سجلًا unbounded لأن كل واحد يصرّح صفًّا بعد الجلب (scope filter in memory) فيلزم دفع predicate النطاق إلى SQL قبل الحد — مملوك لـ005-B مع 010.
- **توكنز/اتجاه:** لا hex خام في UI chrome، و12px حد أدنى داخل `src/ui` (أُصلح FilterBar/ErrorState/ESignatureDialog/Chart/HandoffTimeline/JourneyContextPanel)، وخصائص logical فقط (أُصلح `padding-left` في reject-reports)؛ أرضية `src/pages` دين مُقاس: 71 موضعًا في 51 ملفًا، مسجّل سقفًا لا يزيد وليس إنجازًا. مرجع: `tests/unit/ui/design-governance-contract.test.ts`.
- **التاريخ/التعريب:** العرض عبر `src/shared/copy/format.ts` (en-GB + Asia/Riyadh بصيغة «18 Sep 2026, 18:43») و20 صفحة ما زالت `toLocale*` مسجّلة كـratchet متقلّص. **قرار applicability لـdomain 70 محفوظ ولا يُحتسب credit:** 70 في سجل الـ100 = Security UX (أدلة الرفض/التعداد runtime معلّقة). مستندات أقدم ذكرت العربية/RTL كمتطلب غير منفّذ (`audit/100-percent/POLICY-CLOSURE-MATRIX.md` سطر 184)، ونُفِّذت أساسيات فقط (logical properties + `[dir=rtl]` font mapping)؛ نطاق إعادة التصميم الحالي English-only وفق قرار المستخدم أعلاه، وتحتاج المستندات القديمة مصالحة مستقلة.

### Accessibility / responsive
- نمط القرار الحالي مطبق محليًا في dashboard، السجل الكثيف، إنشاء اختبار مختبري، ومراجعة الاعتماد؛ مرجع القواعد والحالات والحوكمة `Documents/QC-VISUAL-SYSTEM.md`. لقطات audit توضيحية وليست E2E مصادقًا.
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
- **F-013-2 / QC-ADP-03:** intake موقّع لـCI/security/database/E2E موجود محليًا، لكن لا policy مفاتيح/نطاقات معتمدة أو evidence حديثة؛ integration PostgreSQL BLOCKED. UAT يظل موقّعًا بشريًا ولا يوجد cycle مقبول للمرشح الحالي. سجل الـ19 غير reconciled، لذا الموافقة fail-closed. المالك: اعتماد signer/register ثم exact candidate evidence وQC-ADP-12.
- **حالة بوابات المرشّح المجمّد `5470a2e` (036-B، 2026-09-21):** `pnpm build` كان FAIL وأُصلح؛ `pnpm lint` كان 6 أخطاء كلها في ملفات 036-A وأُصلحت (الآن exit 0)؛ `pnpm format:check` **FAIL** على 15 ملفًا خارج diff هذه المهمة (11 ملف receiving + اختباران + record-journey + audit JSON)؛ `pnpm test:unit` **FAIL** 5 اختبارات في 4 ملفات مُثبت أنها سابقة للـHEAD (receiving-data-contract، dashboard/quarantine decision surfaces، mutation-safety)؛ `pnpm test:architecture` FAIL كما في القسم 12. أي ادعاء «CI أخضر» على هذا المرشّح غير صحيح. المالك: عمل receiving/002 ثم 012.
- **تقارير `.ci-results/*.json` غير مربوطة بالمرشّح (036-B):** بوابة الأدلة تتحقق من محتوى التقرير ومن هوية الإصدار فقط، فقد قُدّمت تقارير قديمة (integration 470/470، concurrency 12/12، security 52/52) كأنها حالية وفشلت فقط على `migrations 30/33` القديم. يجب إعادة توليد كل التقارير على المرشّح المجمّد قبل أي ادعاء تغطية. المالك: 002/027.
- Local equivalent PG18.6 (QC-100-FINAL-002, candidate `84bdf249`): unit 677/677، integration 419/419 (0 skips، مرتين)، migrations 29/29، concurrency 12/12 (5 تكرارات exit 0)، security 52/52 بلا skips، format/lint/typecheck/architecture/build/release PASS. Docker/CI container path وfixture-backed six-persona E2E تبقى NOT VERIFIED.
- GitHub Verification CI exact-HEAD غير مثبت بسبب billing lock.
- Node المحلي: عقد التحقق المحلي صار `v24.20.0` عبر `nvm use` + `.nvmrc` (PR-A1)؛ قد تبدأ أقواس جديدة على alias افتراضي أقدم ما لم يُستدعَ `nvm use` في جذر المشروع.
- provider-ingestion الموثوق لأدلة CI/Security/E2E/UAT غير مكتمل.
- UAT غير منفذ؛ production readiness غير مثبت.
- **قرار مالك مفتوح (QC-100-FINAL-004 Task 5/7): نطاق موقّع UAT.** قبول الدورة يصرّح بـ`scope: {}` على `UAT_CYCLE` مثل `ApproveReleaseUseCase`، وGLOBAL وحدها تمر مع scope فارغ؛ فمدير بنطاق TEAM (شخصية `uat-qcm`) يُرفض بـ`AUTHZ_SCOPE_DENIED`. لذلك العلامة البشرية ستكون من المالك المسمّى ما لم يُعتمد منح GLOBAL للـQCM — السلوك متسق ومقصود ولم يُغيَر. أدلة: `audit/2026-09-19/QC-100-FINAL-004-task5-uat-ingestion-closure.md`.
- Live health on 2026-09-24 reports `0018` applied and `0039` shipped with 21 pending; this is a read-only server projection, not direct database verification or permission to migrate. The credential-rotation gate remains open before any production migration.
- **QC-100-FINAL-032-B technical evidence VERIFIED on exact local candidate** `0e9bdf28ae448ab2ebc197c567a05832ea88c07d` / dirty fingerprint `4d51084e350a79da5e8aed8d81e48f478f2101b8d5d2b5564841371fb807c51d`: Node 24.20.0, PG18.6, source head `0034_template_document_link_variable_scope` (34 migrations), 14 selected integration/concurrency files `65/65 PASS`; clean/upgrade/checksum/rollback, 79 tables/0 orphans, four PK-index plans, and restored report-lineage projection hash match. Provider-applied schema, Docker/Testcontainers, backup/PITR, and human acceptance remain NOT VERIFIED/NOT RUN. 013/026 own policy/source decisions; 002/027 container regression; 012 final reconciliation. Report: `audit/2026-09-21/QC-100-FINAL-032-B-integration-technical-evidence.md`.
- QC-100-FINAL-029-B candidate-specific PostgreSQL evidence remains NOT VERIFIED: migration 0033 was not applied, Testcontainers has no runtime, and local disposable PostgreSQL startup is blocked by host shared-memory permissions. Resume with 002/027 on supported disposable PostgreSQL 18; reconcile through 012. Source links have no template-authoring UI in B; ask 003 to assess E2E only if authoring UX is required.
- **Live 2026-09-24:** authorized yazeed GET `/reject-reports` now shows controlled 503/`SCHEMA_NOT_READY`; `/system/health` shows `0018` applied, `0039` shipped, 21 pending, `NOT READY`, release identity `UNVERIFIED`, and restore `NOT VERIFIED`. The prior 500 is historical; production schema migration and runtime closure remain BLOCKED.
- **QC-ADP-01 candidate handoff (2026-09-24):** readiness now checks migration `0026` ledger identity, report columns and core FK/unique constraints; the four affected pages surface the unavailable state as 503. Exact source migration checksums and preflight/backup/forward-only recovery plan are in `audit/2026-09-24/QC-ADP-01-reject-reports-schema-reconciliation.md`. Live deployment remains at historical `0018`; production credential gate/explicit migration authority open; page cards remain 0/6 each pending PG18 and route evidence.

### P1 / live validation / pre-existing test estate
- **QC-ADP-08 / F-009 + F-018 remain OPEN:** real task fixture proves `/tasks/[taskId]` GET + server-denied POST with unchanged row/audit on the PG18.6 candidate. One route has partial HTTP proof; 450 remains gross planning only and each card needs applicable checks/N/A source and route-bound evidence. See `audit/2026-09-24/QC-ADP-08-role-state-matrix-handoff.md`.
- **QC-ADP-10 / F-011 PARTIAL:** PG18 candidate proves screen/query/CSV/XLSX row, filter, order, date, scope, permission, formula, and shared provenance parity. The Action filter omission is fixed. Live route/role and authenticated print E2E remain NOT VERIFIED; durable cross-request snapshots require owner reconciliation of `REQ-RPT-005` / `BR-RPT-005` and retention before persistence. Handoff: `audit/2026-09-24/QC-ADP-10-report-parity-handoff.md`.
- **QC-ADP-06:** Finding→NCR threshold/FAIL consequence/NCR closure/CAPA effectiveness remain owner-dependent (PD-15/16/17/18). Approved P-04 permits a controlled Supervisor exception without effectiveness acceptance, so an absolute effectiveness-before-every-closure acceptance criterion conflicts with current policy and requires an explicit owner decision; do not change the exception by implementation. Route handoff: `audit/2026-09-24/QC-ADP-06-ncr-rca-capa-handoff.md`.
- **F-013-3 (QC-100-FINAL-013، كان مُقاسًا):** عولج محليًا في QC-100-FINAL-028-A بنقل إدراج signature evidence إلى transaction الدومين مع compare-and-set والآثار المتزامنة؛ اختبار populated PostgreSQL المحدّث لم يُنفذ لأن Testcontainers بلا runtime. تبقى حالة التحقق على قاعدة البيانات **BLOCKED** حتى 002/027.
- **ملف تكامل مخصص للمرحلتين موجود الآن** (كان مفتوحًا في تقرير FINAL-004): `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts`.
- **أُغلق 2026-09-19 (QC-100-FINAL-002):** كل ملفات `pnpm test:integration` التي كانت تفشل السابقة (`identity/system-owner-upgrade-parity`, `system/control-center`, `reporting/report-export-parity`, `shared/search-scope`, `shared/notification-outbox-delivery`, `quarantine/overview-parity`) صارت PASS بجذور مُثبتة: عزل schema لكل suite كانت تعوّل على قاعدة بكر، probed migration-dir في `createPostgresMigrationStatus` (العملة الواحدة كانت تُبلغ drift زائفًا تحت Vitest)، وعقود اختبار متقادمة (literal LIKE، bounded queue مقابل total، `uuidv7` غير مونوتونية داخل المللي ثانية، sparse-array matcher).
- read models المطلوبة لاستكمال لوحة القيادة (QC-100-FINAL-017): **DONE 2026-09-20** bounded lab workload مع state/ownership filter (KPI `lab-tests-returned` + readiness read)؛ **DONE 2026-09-20 (022)** عدّادا `tasks-assigned` (`open`) و`tasks-on-hold` وفلتر `open` خادميًا في سجل المهام — فالعمل المُسنَد صار مرئيًا حتى بلا تاريخ استحقاق، والعمل المحجوز له عدّاد مسجّل بدل استنتاج؛ **متبقٍ لـ017-B:** document review queue (لا يوجد read model لطابور المراجعة في وحدة documents)، quality ownership filters (سجلات findings/NCR/RCA/CAPA تدعم state فقط)، وblocked reason كنصّ حرّ (لا حقل في المخطط؛ إدخال audit لكل انتقال)، وreject analytics معلّق على قرار نطاق (النموذج يجمّع globally و`/reject-reports` مصرّح `authenticated` لا permission-bound، فنشر تجميعة عامة على سطح scope-aware ممنوع). بدونها تبقى هذه المنتجات `NOT_SUPPLIED` معلنة بأسباب تسمّي المصدر والمالك، ولا تُقدَّر بأرقام.
- **مكتشف 2026-09-19 (QC-100-FINAL-002):** ست صفحات `.astro` محفوظة كسطر مضغوط واحد (`assets/equipment|[calibrationId]|[maintenanceId]` + `laboratory/tests/[labTestId]/{review,index,execute}`) ولا بوابة تكشفها (Prettier لا ينسّق `.astro`)؛ تحتاج إعادة تنسيق محافظة على المخرجات. كذلك `.env` المحلي يضبط `NODE_ENV=production` فيرفض كل CLI قاعدة بيانات العمل محليًا حتى تتوفر `SERVICE_VERSION` + `RATE_LIMIT_LOGIN_*` أو يُتجاوَز NODE_ENV، و`audit/**` داخل نطاق Prettier العام، و`.tmp-check/check-bundles.ts` ملف scratch متتبَّع.
- تشغيل مسار Testcontainers/`postgres:18-alpine` (نفس مسار CI) على بيئة فيها container runtime، لأن مسار الـcontainer الفرعي لم يُنفذ فعليًا بعد.
- **QC-100-FINAL-027 audit (2026-09-21):** 027-B أثبت unit 785/785 وPG18.6 integration 470/470 وserver contracts على قاعدة محلية disposable صريحة؛ التشغيل عبر Docker/Testcontainers ما زال NOT RUN، والثقة العامة بقيمة `QC_TEST_DATABASE_URL` عبر 21 reset site ما زالت غير محسومة. authenticated E2E واسع PARTIAL/FAIL بسبب fixture/session state وأخطاء workflows؛ focused login 2/2 PASS. `pnpm test:architecture` ما زال FAIL بانتهاكات imports السابقة في NCR/CAPA. التفاصيل في تقريري 027-A و027-B.
- **QC-100-FINAL-030 current dependencies:** `pnpm audit --audit-level high` has a CI gate but no advisory result (registry DNS `ENOTFOUND`); local lockfile SBOM is available, but remote signed provenance and exact-SHA CI are not verified. Repeated Astro server builds produced different manifest filenames; reproducibility is FAIL pending diagnosis — **صُحّح في 036-B**: تثبيت `ASTRO_KEY` غير سرّي + normalizing لاسم chunk المانيفست، فأصبحت 4 عمليات build متتالية متطابقة الشجرة. 002/027 must provide exact-candidate PostgreSQL 18 evidence, then 012 reconciles. `REQ-FILE-008` scan/MIME/data-path policy and retention/orphan lifecycle authority remain POLICY-DEPENDENT through 013/026. Secret inventory/rotation preparation is recorded at 030-B; actual provider state and any rotation remain with the authorized credential owner.
- **Security follow-up (2026-09-24):** local PostgreSQL 18 threat-case suite 17/17 PASS; authenticated file cross-scope/tampered-object requests and expired-session rejection remain NOT VERIFIED. QC-ADP-11 resolves four formerly UNKNOWN license classifications as MIT through exact version/text evidence, and limits provider destinations to exact official endpoints. Current dependency advisory result is still NOT VERIFIED (`registry.npmjs.org` DNS `ENOTFOUND`); security E2E is BLOCKED before Playwright because no container runtime is available. Prior 8 PASS/4 FAIL is HISTORICAL. See `audit/2026-09-24/QC-ADP-11-handoff.md`; do not treat this as security closure.
- live performance evidence لخلفية النظام وlogin (CPU/GPU/heap/Web Vitals).
- authenticated accessibility/responsive/keyboard/screen-reader matrix.
- **QC-ADP-09 / F-010 remains OPEN:** local login/404 have partial axe, keyboard-order, and responsive evidence; qclevel.top dashboard/tasks have read-only skip-link/AX observations, not bound to the local release. No route card is fully closed; screen-reader/device evidence is absent. See `audit/2026-09-24/QC-ADP-09-accessibility-route-handoff.md`.
- provider backup/PITR/WAL/object-store DR and approved RPO/RTO validation; QC-100-FINAL-034-B adds current-0034 local populated DB+file restore and synthetic read-pressure evidence, while provider DR, approved budgets, application backup-catalog integration, and representative workload limits remain open.
- ترقية fixtures القديمة بحيث `loginIdentity` يصبح حاضرًا بوضوح في test doubles.
- تنظيف Lottie container metadata/unused asset فقط إذا اعتُمد asset-pipeline لذلك.

## 16) الحالة الحالية — AI Advisory Safety / Evaluation
- AI remains advisory-only; no result writes controlled/business decisions. Secret/PII checks, English/Arabic authority and prompt-injection refusals, current-request source citations, and provider outages fail closed within the advisory path; normal human QC review remains authoritative.
- External Groq/Gemini sending now requires `AI_EXTERNAL_PROCESSING_APPROVED=true`, complete server-only `AI_PROCESSING_POLICY_JSON` (provider, processing location, retention/deletion terms, data classes, approval/source metadata), policy-permitted user-classification, and explicit consent for each request. The repository has no approved policy artifact; providers are currently disabled. Approved data classes are PUBLIC, SYNTHETIC, or AUTHORIZED_NONCONFIDENTIAL_EXCERPT; personal data, credentials, confidential/controlled QC records, and unauthorized content are prohibited. Pattern checks do not fully classify arbitrary content.
- Responses expose supplied source identity/citation with an authenticity limit, provider/model when available, prompt version, server generation time, advisory boundary, and uncalibrated confidence. User correction remains a local draft into the existing human review path; no save, QC decision, release, PASS/FAIL/HOLD, or e-sign action is available.
- Deterministic synthetic eval dataset is `qc-ai-governance-v2` / `4.0.0` (33 cases; hallucination, sensitive-data rejection, prompt injection, context switching, consent/policy gates, and Arabic/English included). Node `24.20.0`, AI-focused suites `90/90 PASS`, every category disposition error rate `0%`; prompt `qc-ai-prompt-v2`, criteria `1.0.0`, evaluated model `deterministic-fake-provider@1` (no live model). Result: `audit/100-percent/ai-evals/results-2026-09-24.json`.
- `AI_EXTERNAL_PROCESSING_APPROVED=false` remains the default. Provider location/retention/deletion terms and live-model behavior remain `NOT VERIFIED` until supplied/accepted through the authorized processing decision and exact-SHA evaluation; human UAT remains `NOT RUN`.
- QC-ADP-11 binds provider URLs to exact official Groq/Gemini endpoints; this is a technical destination allowlist, not processing approval. PD-31 remains PARTIAL; no external provider call or live eval was made. On candidate HEAD `6b999b71c54e7e9c29399f8bae6a25b83ee39385`, route acceptance is 6/10 (60%); authenticated least-privilege denial E2E passes on disposable PG18.6, while advisory audit remains blocked by registry DNS and owner policy/live eval remain approval-blocked. Live UI accessibility/readability is NOT VERIFIED. Details: `audit/2026-09-24/QC-ADP-11-handoff.md`.

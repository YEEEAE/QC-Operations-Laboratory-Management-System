# QC Operations & Laboratory Management System — Compact Project Mind

> آخر دمج: 2026-09-19  
> الغرض: ذاكرة تشغيلية قصيرة للوكيل، وليست بديلًا عن الكود أو الوثائق أو أدلة التدقيق.  
> **قاعدة التعارض:** الحالة الحالية والقرارات الثابتة في أعلى هذا الملف تتقدم على السجل التاريخي أدناه. السجل التاريخي للـtraceability فقط، ولا يعيد قرارًا ألغاه قرار أحدث.

## Current audit reality — 2026-09-18
- **Editorial revision:** 20e6ead8f397d02ac2de807a273795dfac47a703. Reports and the15-prompt HTML were rewritten for clarity; prior operational results remain tied to298e307721af97d9c1bd22279d0c784fbf5b62a8, not revalidated for this newer HEAD. Scores unchanged; operational status must be rechecked before use.
- **QC-MIDPOINT-REBASE-001 evidence baseline (historical after subsequent commits):** HEAD298e307721af97d9c1bd22279d0c784fbf5b62a8/main dirty tree preserved; source0030,18 modules,85 routes(2/81/2),83 pages,32 navigation destinations. Mechanical coverage1048 first-party files plus targeted semantic review; exhaustive manual coverage NOT VERIFIED. Earlier snapshots below are HISTORICAL where superseded here.
- **Fresh local (QC-100-FINAL-002, candidate `e30285c…`):** install/format/lint/typecheck/architecture/tech-debt/diff-check/build/release PASS on Node `24.20.0` + pnpm `11.25.0`; unit83 files/564 PASS; integration87 files/353 PASS (Reject ambiguous-status SQL fixed); migrations29 PASS; concurrency12 PASS (stability 15/15 runs after re-contracting the loser codes); security52 PASS; schema77 tables/0 orphans. E2E48 PASS/19 FAIL/107 SKIP unchanged (Docker-only authenticated runner). Fixture seed/cleanup against the disposable PG 18.6 PASS. Details: `audit/2026-09-18-qc-100-final-002-verification-gates.md`.
- **QC-100-FINAL-016 live re-verification (2026-09-18, read-only, 36 route families + 18 targeted URL probes):** serif/`Times` fallback on **every** surface incl. `/login`; dashboard + quarantine KPI drill-down params `?inspectionResult=`/`?workflowState=` silently ignored (`?state=` works); topbar identity is the internal UUID with role `Authenticated user`; CSP blocks dotlottie WASM on every page **and** the inlined enhancement scripts on `/ai-advisory` (request flow dead; the build emits a bare `<script>` with unprocessed TS) and `/account` (password toggle inert); `/account` renders outside the app shell; `/quality/{capa,ncr}/new` are registry routes with no page file and render detail pages; the control-center migration card reads `DRIFT DETECTED · applied 0018 · expected 0018 · 11 pending`; `/admin/users/<self>` says “No roles are assigned” while the owner console lists `ADMIN, SYSTEM_OWNER`; `/reject-reports` still `500`. 31 classified findings (P1 5 / P2 16 / P3 10) in `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`. Limits: single role (`yazeed`), bootstrap-only data, no AT/human UAT, deployed SHA `UNVERIFIED`. Indicator deliberately unchanged at `29.0%`.
- **QC-100-FINAL-016 remediation (candidate-side, 2026-09-19):** رُفعت كل نتائج التدقيق الحي في الكود المرشّح مع أدلة محلية: `font` لا يعيد تعيين `body` (زال fallback الـserif) + أرضية قراءة 12px + هدف 44px؛ روابط KPI تستخدم بارامترات مدعومة مع شرائح فلتر مطبّقة (`inspectionResult`/`releaseState`/`workflowState` server-side على Receiving/Inspections)؛ هوية الشريط العلوي من الشريط = login identity + role/scope مشتقّة server-side (`scope-description.ts`)؛ `/reject-reports` صار يعلن حالته بصدق بدل 500، وقرار المالك: **إسقاط طبقة Lottie** — ونُفّذ + اختبار يفشل عند أي طلب runtime؛ سكربتات الصفحات أُخرجت من inline (CSP) و`/account` داخل AppLayout؛ migration card يستخدم buildHead/expectedHead بلا relabel؛ `/quality/{ncr,capa}/new` لهما صفحات إنشاء؛ وبقرار المالك صار `yazeed` قادرًا على الإنشاء عبر migration `0030_reject_reports_role_parity` (يرمّم bundle الـSYSTEM_OWNER الموجود ويمنح ADMIN كود الاسترداد) مع اختبار upgrade path. أدلة: typecheck 0 errors، unit 563/563 (83 ملف)، integration مركّز على PostgreSQL 18 مصرفي محلي/TLS 39+4+2+15 PASS، build PASS، lint 0 errors، migration integrity 30. `PASS ≠ RELEASED`: لا نشر، لا migration على الإنتاج، هوية الإصدار ما زالت UNVERIFIED، والتدقيق الحي على النسخة الجديدة وUAT البشري ما زالا مفتوحين. تفاصيل: القسم 13 في `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`.
- **Fresh authorized live owner read:** login/dashboard/system-health/control-center200; live/readiness200 healthy; migration projection0018/pending11, expected console0018 misleading versus source0029; internal release/build/Git/environment UNVERIFIED; Reject500. Explicit axe35 rulesPASS/3 incomplete/1 serious label-in-name node; narrower zero-violation scan superseded. Not six-persona E2E or human UAT. No password saved in deliverables.
- **Audit/plan:** overall46.7%(previous52.6); production mandatory-gate completion1/19=5.3%(previous30.0), NO-GO/PARTIAL. Disclosed rubric judgment, not statistical feature completion.16 findings(7P0/7P1/2P2); existing bilingual36-section/80-domain reports and15-prompt HTML refreshed, closure tasks not executed. Copy/Copied/expand-collapse and320/768/1440 light/dark UI PASS.
- **External gates:** CI35325572254 exactHEAD / Verify105537703598 /0 steps /billing lock, not code-test FAIL or PASS. Prior provider deployedSHA observation remains historical valid evidence; no fresh provider API/direct production DB connection here. Credential rotation, populated DR, signed human UAT, live AI and production parity remain open. Latest detailed evidence: audit/2026-09-18-ULTIMATE-COMPREHENSIVE-SYSTEM-AUDIT{,-AR}.md.
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
- Exact current HEAD: `0316f4058584719d76194d65ff096fae8ee3b4dc` on `main` (verified 2026-09-19; the `update site` commit that lands the QC-100-FINAL-016 remediation; working tree dirty with the uncommitted QC-100-FINAL-005 dashboard/shared-UX repair only; user changes preserved). The last provider-verified deploy record bound `298e307721af97d9c1bd22279d0c784fbf5b62a8` (`dep-damfhv8u01pc738s4430`, `live`, finished `2026-09-18T08:43:07Z`), so the four newer `update site` commits are **not** provider-verified and live release identity stays `UNVERIFIED` (QC-100-FINAL-016). Migration source head is `0030_reject_reports_role_parity`; it is still not applied to Render and was not runtime-applied against Render during this task. A controlled disposable PostgreSQL 18.6 run of the canonical chain reached head `0029` with 29 migrations / 77 tables / 0 orphans and a zero-op re-run.
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
- عقد الـKPI صريح (`numerator`/`state`/`actorScope`/time window): لا قيمة شخصية تحت وسم نطاق مصرّح أو العكس، وكل `href` يجب أن يعيد إنتاج نفس المجموعة (وإلا فهو عيب لا خيار تقديمي) — QC-100-FINAL-005.
- `Pending review` و`/approvals` وdecision queue تقرأ rollup واحدًا (canonical approvals reader + HOLD الخاص بالمستخدم) بشدة مشتقة (HOLD `CRITICAL`، الموافقات `WARNING`)، وKPI الشخصية تربط بفلتر `ownership=mine` المدعوم خادميًا في سجلي Receiving/Inspections؛ لا معاملات غير مدعومة في روابط الـdrill-down.
- إذا provider غير متاح، تُحجب الادعاءات بدل عرض صفر مضلل، وفشل rollup يفشل الـread model بالكامل؛ وخطأ `AUTHORIZATION` حالة مستقلة عن انقطاع المزوّد.
- trend chart موجود الآن على `/dashboard` من series خادمية معتمدة صادرة من دومين Quarantine: grain يوم UTC، numerator = سجلات Receiving المسموح بقراءتها، unit = records، window = 14 يومًا متدرجة، وzero معرّف كصفر حقيقي. العقد الكامل (`grain`/`numerator`/`actorScope`/`windowLabel`/`zeroPolicy`) يُعرض مع الرسم، والنسخة على الداشبورد مُضيَّقة إلى ما أنشأه الفاعل لتطابق KPIs الشخصية المجاورة. حالات الseries صريحة `AVAILABLE|EMPTY|UNAVAILABLE|NOT_SUPPLIED` ولا نقاط إلا في `AVAILABLE` (لا chart للـEMPTY/UNAVAILABLE ولا صفر مضلل).
- overdue/calibration risk/lab workload/blocked reasons ما زالت تحتاج read models خادمية قبل تقديمها كحقائق (لا تُستهلك series جديدة بعد هذه المهمة).

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
- Local equivalent PG18.6 executes suites: integration350 PASS/3 FAIL, migrations29 PASS, concurrency11 PASS/1 FAIL, security52 PASS. Docker/CI container path and fixture-backed six-persona E2E remain NOT VERIFIED.
- GitHub Verification CI exact-HEAD غير مثبت بسبب billing lock.
- Node المحلي خارج contract.
- provider-ingestion الموثوق لأدلة CI/Security/E2E/UAT غير مكتمل.
- UAT غير منفذ؛ production readiness غير مثبت.
- Render remains at applied migration head `0018`; source head `0029` is not a production claim and must not be applied before the credential-rotation gate.
- **Live defect — fresh FAIL 2026-09-18:** authorized read-only yazeed GET /reject-reports500; owner pages200 and migration projection0018/pending11. Direct production SQL exception unproven. Fully migrated local analytics independently fails with ambiguous status near postgres-repository.ts:1050; migration alone is insufficient closure.

### P1 / live validation / pre-existing test estate
- **Full `pnpm test:integration` على PostgreSQL المصرفي المشترك يفشل في 4–5 ملفات قائمة قبل هذا العمل (وليست انحدارًا منه؛ أُثبت بالاستبعاد على cluster جديد):** `identity/system-owner-upgrade-parity` (Migration checksum mismatch for 0030 — الsuite يسجّل DB كـ`migrations` بدون 0030 فيفشل `verifyMigrationIntegrity` متى سبقه أي ملف آخر إلى الـmigration)، `system/control-center` (`drift=true`)، `reporting/report-export-parity`، `shared/search-scope` (LIKE wildcard row count)، و`shared/notification-outbox-delivery` (dedupe، متقطع). السبب: مسار الخارجي يشارك قاعدة واحدة بين كل الملفات؛ هذه المضيفات تعوّل على قاعدة بكر. الأصل: تصميم اختبارات/migration `0030` في QC-100-FINAL-016، ولم يُغلق بعد.
- تشغيل مسار Testcontainers/`postgres:18-alpine` (نفس مسار CI) على بيئة فيها container runtime، لأن مسار الـcontainer الفرعي لم يُنفذ فعليًا بعد.
- live performance evidence لخلفية النظام وlogin (CPU/GPU/heap/Web Vitals).
- authenticated accessibility/responsive/keyboard/screen-reader matrix.
- backup catalog + artifact + isolated restore drill.
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
- Deterministic dataset is `qc-ai-governance-v2` / `2.0.0`; the focused provider/advisory/security run remains `53/53 PASS` across 4 files. The current full unit run is `83 files / 564 PASS`; the current local security command is `52/52 PASS`. Typecheck (794 files), architecture, build, format and lint all pass on the declared Node `v24.20.0` / pnpm `11.25.0` contract.
- Groq is the default primary adapter, Gemini is the default fallback, and `DisabledAiProvider` remains the final safe fallback. Configuration is server-only with canonical names plus legacy-name transition support; provider metadata is sanitized and advisory-only. Live provider smoke tests, Render provider configuration, external data-processing approval, and human UAT remain `NOT VERIFIED/BLOCKED`. No production/provider approval is inferred.

## 17) سجل تاريخي مضغوط
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
- **2026-09-18 — QC-MIDPOINT-REWRITE-001 / إعادة كتابة التقرير والخطة**
  - Changed: clearer bilingual reports;15 independently copyable prompts with objective, dependencies, work, acceptance and handoff; separated editorial HEAD from evidence SHA.
  - Evidence:36 sections/80 matching domain rows; all15 clipboard/Copied checks and copy-failure recovery PASS;320/768/1440 light/dark overflow checks PASS. No application tests rerun.
  - State: DONE (editorial scope); historical release decision unchanged.
- **2026-09-18 — QC-MIDPOINT-REBASE-001 / Evidence rebase and adaptive plan**
  - Changed: refreshed existing bilingual80-domain reports and15-prompt HTML; compressed duplicated historical context, archives unchanged.
  - Evidence: local PG suites and authorized owner reads; independent arithmetic/bilingual review and pack UI PASS;46.7% overall/5.3% production gate completion/NO-GO.
  - State: PARTIAL — external/human and exhaustive manual coverage open; closure tasks not executed.
  - Key files: audit/2026-09-18-ULTIMATE-COMPREHENSIVE-SYSTEM-AUDIT{,-AR}.md, audit/QC-Remaining-to-100-Percent-Prompts-Interactive.html.
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
- **Project Mind rollovers** — `QC-YAZEED-CONTROL-CENTER-001` (12 سجلًا)، `QC-CLOSURE-007` (12)، `QC-CLOSURE-005` (23)، `QC-100-FINAL-016` (5)، `QC-100-FINAL-016 remediation` (5)، و`QC-100-FINAL-005 follow-up` (`QC-CLOSURE-006` + `QC-CLOSURE-007`) نُقلت إلى `02-mind-mid.md` بعد التحقق من وجودها في الأرشيف قبل الحذف (لم تُنقل أي قرارات حالية أو مشاكل مفتوحة). الحالة: DONE.
- **2026-09-18 — QC-100-FINAL-016 / Live product UX & human-centered application review (read-only)**
  - Changed: no product code changed; live page-family review of the deployed product using an operator-typed session, recorded as `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md` (36 route families + 18 targeted URL probes; 5 P1 / 16 P2 / 10 P3, each with type, source pointer and copy replacement).
  - Evidence: live reproductions of the serif fallback, the ignored KPI drill-down params, the UUID topbar identity, `/reject-reports` 500, CSP-blocked inline scripts (`/ai-advisory` flow dead, `/account` toggle inert), `/account` outside the shell, the two phantom `/quality/*/new` routes, the self-contradicting migration card and the self-view role contradiction; strengths re-confirmed (fail-closed states, 404 semantics, keyboard/focus, no overflow on 34/35 routes, no unlabelled controls).
  - State: PARTIAL — review DONE; indicator unchanged at `29.0%`; consumers are 005/017/018/006. Not human UAT; single role; bootstrap-only data; deployed SHA `UNVERIFIED`.
  - Key files: `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`.

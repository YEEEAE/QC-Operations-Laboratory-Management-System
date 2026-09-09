# تدقيق واجهة الإنتاج وتدفقات العمل — qclevel.top

آخر تحديث للقرارات والبرومبتات: 2026-09-10 (Asia/Riyadh)

المستودع: `YEEEAE/QC-Operations-Laboratory-Management-System`

الفرع: `main`

HEAD الذي تمت مراجعة مصدره: `2adb7871a285711e87a24a3b83dd3848b795d64a`

المتصفح: Google Chrome — جولة إنتاج مصادق عليها بالحساب المصرح

المنهج: `better-interface` مع Accessibility وLayout وWriting وTypography وColors وUI

النطاق: Login وApp Shell/Navigation وDashboard وSystem Health وAudit وChange Requests، مع فحص المصدر والاختبارات للحالات التي تعذر تشغيلها حيًا.

## الزبدة التنفيذية

تم إلغاء رقم **88%** السابق لأنه كان تقديرًا موزونًا ذاتيًا، وليس نسبة يمكن إعادة حسابها من عدّاد واضح. البديل ثلاث نسب منفصلة وقابلة لإعادة الحساب:

| المقياس | الحساب | النتيجة | ماذا يعني |
| --- | ---: | ---: | --- |
| إغلاق البنود المعروفة | 8 مغلقة ÷ 15 إجماليًا | **53.3%** | تقدم معالجة Findings، وليس جودة المنتج كلها |
| تغطية الجولة الحية | 6 منفذة ÷ 12 مخططة | **50.0%** | مقدار ما فُحص حيًا في Chrome |
| النجاح ضمن المنفذ حيًا | 5 ناجحة ÷ 6 منفذة | **83.3%** | لا يشمل البنود غير المتحققة |
| النجاح الحي المحافظ | 5 ناجحة ÷ 12 مخططة | **41.7%** | يعامل `Not verified` كغير مكتمل |

هذه الأرقام **ليست Production Readiness score**. بلوغ 100% هنا يتطلب إغلاق **15/15** Findings وإكمال **12/12** بنود تحقق حي بنجاح على نفس build المنشور.

**الحكم الحالي:** `Needs changes / Pending complete live verification`.

> تحديث 2026-09-10: تم اعتماد قرارات P-01 إلى P-07 كمدخلات تنفيذ، لكن لم يُنفذ منها كود في هذا التحديث بناءً على توجيه المالك. اعتماد القرار لا يغلق Finding ولا يرفع أي نسبة؛ الإغلاق يحتاج تنفيذًا واختبارات ودليلًا حيًا على نفس build المنشور.

## 0) القرارات المعتمدة التي يجب أن تلتزم بها البرومبتات

| القرار | السياسة المعتمدة | أثره على النسبة الآن |
| --- | --- | --- |
| P-01 | استخدام `Cloudflare R2 Standard` كخيار التخزين الأسهل والمتوفر والمجاني ضمن حدوده؛ لا يُعامل وحده كنسخ PostgreSQL أو PITR | لا تغيير |
| P-02 | نسخ يومي، احتفاظ 30 يومًا، تجربة استعادة شهرية، `RPO=24h` و`RTO=4h` | لا تغيير |
| P-03 | استعادة/إعادة فتح الإنتاج لـ`yazeed` فقط، مع إعادة تحقق وتوقيع إلكتروني وAudit | لا تغيير |
| P-04 | إغلاق NCR وCAPA بواسطة `Supervisor` فقط. إغلاق CAPA **لا يشترط** اكتمال كل الإجراءات ولا `effectivenessVerified=true` | لا تغيير |
| P-05 | اعتماد inspection/lab/release/retest/void/document بواسطة `Supervisor` أو `Manager` أو `yazeed`؛ Admin وحده ليس جهة اعتماد | لا تغيير |
| P-06 | كل المستخدمين ينشئون القوالب؛ Employee ينشئ `DRAFT`، وSupervisor/Manager/yazeed ينشئون `APPROVED` بتوقيع؛ لهم Review/Approve/Stop/Void/Supersede مع استثناء SoD الخاص بالقوالب وحفظ التاريخ | لا تغيير |
| P-07 | اعتماد Production Release النهائي بواسطة `Manager OR yazeed` بتوقيع واحد بعد اكتمال كل البوابات والأدلة | لا تغيير |

لطلب تغيير `DOCUMENT_VERSION`، الحقول المسموحة فقط هي: `revision` و`changeSummary` و`contentHash`. أي حقل آخر يجب رفضه خادميًا.

## 1) طريقة الحساب

### 1.1 إغلاق Findings

- المقام: 15 Finding مؤهلًا للحساب في هذه النسخة.
- المغلق: F-01 وF-02 وF-03 وF-04 وF-05 وF-07 وF-09 وF-12 = **8**.
- المفتوح: F-06 وF-10 وF-11 وBI-01 وBI-02 وBI-03 وBI-04 = **7**.
- الحساب: `8 ÷ 15 × 100 = 53.3%`.
- F-08 غير داخل المقام لأنه سُحب/قُبل كقرار منتج، وليس Finding مفتوحًا أو مغلقًا.

### 1.2 التحقق الحي

- المقام: 12 سيناريو إنتاج محددًا في §4.
- `PASS = 5`، و`FAIL = 1`، و`NOT VERIFIED = 6`.
- التغطية: `(PASS + FAIL) ÷ 12 = 50.0%`.
- نجاح المنفذ: `PASS ÷ (PASS + FAIL) = 83.3%`.
- النجاح المحافظ: `PASS ÷ 12 = 41.7%`.

لا يتم دمج النسبتين في متوسط واحد؛ الأولى تقيس إغلاق العمل والثانية تقيس تغطية الأدلة. دمجهما يخفي `Not verified`.

## 2) Scope and coverage — better-interface

| المجال | الأدلة المفحوصة | النتيجة |
| --- | --- | --- |
| Accessibility | Chrome accessibility tree لـLogin/Dashboard/Health/Audit/Change Request، و`AppLayout.astro`، و`reflow-320.spec.ts` | BI-01 مفتوح؛ mobile focus containment غير متحقق حيًا |
| Layout | Chrome desktop، app shell، form grids، contained table source/tests | لا HIGH مؤكد على desktop؛ 320px و200% حيًا `Not verified` |
| Writing | Dashboard وHealth وAudit وChange Request حيًا | BI-03 MEDIUM وBI-04 LOW |
| Typography | Login وDashboard بصريًا في Chrome، tokens/source | لا blocker مؤكد؛ القياس الشامل لم يُنفذ |
| Colors | semantic tokens والحالات المرئية | لا فشل مؤكد؛ contrast measurement الشامل `Not verified` |
| UI | Navigation icons وaction patterns وLogin 3D | BI-02 MEDIUM؛ الخلفية تعمل بصريًا على Login desktop |

## 3) Findings الحالية

ما فيه HIGH جديد مؤكد في الجولة الحالية.

| ID | Severity | Domain | الدليل الحالي | المطلوب للإغلاق |
| --- | --- | --- | --- | --- |
| F-06 / BI-03 | MEDIUM | Writing / Flow | الإنتاج يعرض `Target version identifier` و`Target snapshot (JSON)` و`Field path` و`Data type`. المصدر: `src/pages/change-requests/new.astro:27` و`:81` | contextual authorized selector، snapshot/version خادمي، ومحرر structured بأسماء بشرية؛ بلا اختراع سياسة QC |
| F-10 | MEDIUM | Operational UI | `/quarantine/admin` ما زال read-only وفق المصدر، ولا lifecycle mutation معتمد كامل | اعتماد authority/policy ثم create/revise/approve/retire مع audit/concurrency |
| F-11 | MEDIUM | Operational truth | Chrome على `/system/health`: `storage=UNKNOWN`، `ai-provider=UNKNOWN`، `NO CATALOG DATA`، `RESTORE NOT VERIFIED` | provider evidence + verified artifact + isolated restore + قرارات سياسة معتمدة |
| BI-01 | MEDIUM | Accessibility | `src/ui/layouts/AppLayout.astro:56` يجعل sidebar inert عند الإغلاق، لكنه لا يعزل `.app-workspace` عند فتح mobile drawer | عطّل focus/scroll للخلفية، contain focus، Escape وfocus return؛ تحقق حي عند 320px |
| BI-02 | MEDIUM | UI | `src/ui/navigation/navigation.ts:16` يستخدم Unicode/حروفًا متعددة، و`src/ui/shell/Sidebar.astro:13` يرسمها كنص | icon set محلي SVG واحد، `currentColor`، viewBox/stroke/size موحد، `aria-hidden=true` |
| BI-04 | LOW | Writing | Chrome و`src/pages/dashboard/index.astro` يعرضان “authorized read model” للمستخدم | نص مباشر يشرح عدم توفر trend data بلا مصطلح معماري داخلي |

F-06 وBI-03 سبب جذري واحد، لذلك يعالجان كحزمة تنفيذية واحدة، لكنهما باقيان معرفين للتتبع مع التقرير السابق.

## 4) سجل الجولة الحية الحالية في Chrome

| # | السيناريو | الحالة | الدليل |
| ---: | --- | --- | --- |
| C-01 | Login وأسماء الحقول والمصادقة إلى Dashboard | PASS | Chrome accessibility tree + وصول `/dashboard` |
| C-02 | Navigation وAdministration/System للحساب المصرح | PASS | Chrome tree يعرض Administration/Users/Roles/Permissions/Scopes |
| C-03 | Dashboard وKPI/attention/activity بدون خطأ | PASS | `/dashboard`؛ 4 KPI وحدث Audit ظاهر |
| C-04 | System Health يعرض الواقع بدون false-green | PASS | core READY مع storage/AI UNKNOWN وrestore غير متحقق |
| C-05 | Audit history والفلاتر والترقيم | PASS | `/audit`؛ 4 أحداث وفلاتر وpage size |
| C-06 | Change Request يخفي تفاصيل التخزين عن المشغل | FAIL | `/change-requests/new` يعرض JSON/identifier/field path/data type |
| C-07 | 320px reflow | NOT VERIFIED | الجلسة المصادق عليها لم توفر resize موثقًا |
| C-08 | 200% zoom بلا overflow/clipping | NOT VERIFIED | spec موجود ولم يُنفذ حيًا هنا |
| C-09 | mobile drawer focus containment/background inert | NOT VERIFIED | المصدر يؤكد gap؛ يحتاج runtime بعد الإصلاح |
| C-10 | create-form recovery/retained values/no-JS | NOT VERIFIED | لا mutation إنتاجي، والاختبارات لم تُشغّل طازجًا |
| C-11 | production deployment identity يطابق HEAD | NOT VERIFIED | لا release/SHA identity مثبتة في الواجهة الحالية |
| C-12 | negative authorization بحساب غير مخول | NOT VERIFIED | الجولة استخدمت حساب مالك واحدًا |

## 5) المثبت وغير المثبت

### مثبت حيًا

- Login 3D يظهر خلف النموذج، والنموذج واضح وقابل للتفاعل على desktop.
- المصادقة تعمل والحساب يصل إلى Dashboard.
- Administration routes موجودة في navigation للحساب المصرح.
- Dashboard وAudit متاحان، وحدث `GRANT_SYSTEM_OWNER_ACCESS` ظهر في السطحين.
- System Health صريح: core readiness لا يخفي غياب storage/AI/backup/restore evidence.
- نموذج Change Request في الإنتاج يطابق الفجوة التقنية؛ ليست استنتاجًا من المصدر فقط.

### غير مثبت في هذه الجولة

- أن production يشغل HEAD `2adb787...` نفسه.
- 320px و200% zoom على الجلسة المصادق عليها.
- focus containment للـmobile drawer.
- contrast ratios الشاملة لكل rendered pair.
- create/error/no-JS flows؛ لم نرسل mutation للإنتاج.
- authorization denial بحسابات Member/Admin غير المالك.
- الاختبارات المحلية الجديدة؛ تشغيل `pnpm` لم يكتمل، فلا توجد نتيجة طازجة تُحتسب PASS.

## 6) حالة Findings السابقة

| ID | الحالة | أساس الحكم |
| --- | --- | --- |
| F-01 | CLOSED IN SOURCE؛ live view confirmed | canonical DB readiness ظاهر وdatabase HEALTHY |
| F-02 | CLOSED + LIVE CONFIRMED FOR OWNER | Administration ظاهرة للحساب المصرح؛ negative roles غير متحققة |
| F-03 | CLOSED IN SOURCE؛ LIVE RECHECK PENDING | source/tests تعالج overflow؛ المقاسات حيًا لم تكتمل |
| F-04 | CLOSED IN SOURCE؛ LIVE RECHECK PENDING | summaries/inline errors/retained values موجودة؛ لا mutation إنتاجي |
| F-05 | CLOSED IN SOURCE؛ FRESH RUN PENDING | POST baseline والاختبار موجودان؛ لا تشغيل طازج |
| F-06 | OPEN | technical Change Request fields مؤكدة حيًا |
| F-07 | CLOSED + PARTIAL LIVE CONFIRMATION | نفس حدث Audit ظهر في Dashboard وAudit؛ negative scope غير مكتمل |
| F-09 | CLOSED IN SOURCE | Back/Cancel/safe return context موجودة |
| F-10 | OPEN / POLICY-GATED | lifecycle الإدارة غير مكتمل |
| F-11 | OPEN + LIVE CONFIRMED | storage/AI/backup/restore gaps ظاهرة حيًا |
| F-12 | CLOSED / ACCEPTED | الواجهة English-only وsentence case في الأسطح المفحوصة |

## 7) برومبتات تنفيذية للوصول إلى 100% قابل للإثبات

تنفيذ البرومبت لا يرفع النسبة تلقائيًا؛ الرفع يحصل بعد اجتياز معايير القبول.

### Prompt 1 — Close BI-01: mobile drawer accessibility

```text
Implement BI-01 from audit/2026-09-09-production-ui-audit.md. In src/ui/layouts/AppLayout.astro, make the open mobile navigation drawer isolate the background from keyboard and assistive-technology interaction. Reuse the existing native inert approach: while open at the mobile breakpoint, make .app-workspace inert, prevent background scrolling, keep focus inside the drawer, let Escape close it, and restore focus to the navigation toggle. When closed or leaving the breakpoint, remove every temporary inert/scroll-lock state. Do not alter server authorization or navigation visibility. Add tests for Tab/Shift+Tab containment, Escape, focus return, breakpoint changes, and reduced motion. Run relevant UI tests, Playwright accessibility/reflow, typecheck, lint, architecture checks, and build. Report exact results; no commit, push, deploy, or production mutation.
```

### Prompt 2 — Close F-06 / BI-03: contextual Change Request flow

```text
Replace the technical operator inputs in /change-requests/new with an authorized contextual workflow. The operator must select an allowed controlled document/version using a server-side authorized read model; targetId, targetVersion, targetSnapshot, currentValue, and data type must be resolved and captured server-side from the selected current version inside a transaction with an expected-version/lock check. For target type DOCUMENT_VERSION, allow exactly these change fields: revision, changeSummary, contentHash. Reject every other field server-side with a safe validation error; never trust a client-supplied field path, data type, version, hash, or snapshot. Render human labels and a structured value editor, while keeping storage identifiers and raw JSON out of the operator UI. Preserve immutable snapshots and optimistic concurrency. Keep the no-JavaScript POST baseline and Astro Action enhancement, reauthorize on the server, retain values on recoverable failure, and reject stale or unauthorized targets. Add unit allowlist tests for all three allowed fields and at least one denied field, integration tests proving server-derived snapshots, authorization-negative and concurrency tests, plus no-JS, JS, keyboard, and 320px E2E. Close only when Chrome no longer exposes raw UUID/JSON/storage-model fields.
```

### Prompt 3 — Close F-10: quarantine template administration

```text
Implement F-10 using the approved P-06 policy. Every active user may create a template. Employee creation must produce DRAFT and Employee must never review, approve, stop, void, or supersede. Supervisor, Manager, and yazeed may create a template only through reauthentication and E-Signature, producing APPROVED immediately; these three authorities may review/approve an Employee DRAFT and may approve their own template. Reviewer may also be approver: this is an explicit template-only exception to the general SoD rule. Stop/Void/Supersede is limited to the same three authorities and requires a mandatory reason, reauthentication, and E-Signature. Approved content must never be directly edited or deleted; replacement is a new revision followed by Supersede. Implement through Application use cases and Domain state machines, never direct UI/database writes. Require expected versions, reject stale writes, and atomically persist immutable audit and outbox evidence. Build /quarantine/admin list/create/review/approve/stop/void/supersede states with explicit disabled reasons. Add role/scope negative tests for Employee and Admin-only actors, positive tests for all three authorities, template-specific SoD tests, PostgreSQL concurrency/idempotency tests, audit/e-signature assertions, and critical E2E. Do not mark F-10 closed until every lifecycle action passes on the release candidate.
```

### Prompt 4 — Close F-11: operational evidence

```text
Close F-11 without false-green behavior. Use Cloudflare R2 Standard for private backup-artifact storage through its S3-compatible API, but do not describe R2 itself as PostgreSQL backup, WAL archive, or PITR. Configure credentials and bucket outside source control. Implement a daily PostgreSQL backup job, retain artifacts for 30 days, record immutable catalog identity and SHA-256 verification, and run an isolated restore drill every month. The approved targets are RPO 24 hours and RTO 4 hours; display measured values separately from targets. Production restore/reopen authorization belongs only to yazeed/SYSTEM_OWNER and must require reauthentication, E-Signature, exact artifact/build identity, reason, request ID, version check, and immutable audit. Admin, Supervisor, and Manager alone must be denied. Keep AI optional and advisory-only, and keep core readiness separate from optional dependencies. Expose sanitized evidence without credentials, endpoints, or raw errors. Add adapter, integration, scheduler-retention, authorization-negative, audit, corruption/hash-failure, and isolated-restore tests. Close only when a verified artifact and successful isolated restore exist for the same deployed release.
```

### Prompt 5 — Close BI-02 and BI-04: icons and copy

```text
Replace Unicode navigation glyphs with one local SVG icon system using one viewBox, currentColor, and consistent size/stroke weight. Keep visible labels and mark decorative icons aria-hidden. Replace user-facing backend terminology such as “authorized read model” with direct operational copy preserving authorization meaning. Add a static contract test preventing placeholder glyphs and banned backend terms. Verify collapsed/expanded navigation, hover/focus, 320px, 200% zoom, forced colors, and Chrome states.
```

### Prompt 6 — Complete live verification

```text
Run a read-only production UI verification against the exact deployed release identity in Google Chrome. Use separate authorized fixtures for SYSTEM_OWNER, Admin, and an active member without sensitive permissions. Execute C-01 through C-12 from the audit. Cover desktop, 320px, 200% zoom, keyboard-only navigation, mobile drawer containment, visible focus, measured contrast, create-form validation without committing records, Dashboard/Audit parity, and negative authorization. Do not submit destructive, approval, release, restore, or business mutations in production. Attach timestamped evidence. Mark blocked items NOT VERIFIED, never PASS.
```

### Prompt 7 — Recalculate and gate 100%

```text
Recalculate strictly from fixed denominators. Findings closure is closed findings divided by 15. Live verification coverage is executed C-items divided by 12. Conservative live pass is passed C-items divided by 12. Do not average these measures. A 100% claim is allowed only when all 15 findings are CLOSED with current evidence, all 12 live checks PASS on the same deployed release identity, no HIGH or MEDIUM remains, and required policy decisions are approved. Otherwise report the exact numerator, denominator, percentage, failures, and NOT VERIFIED items.
```

### Prompt 8 — Implement P-04 CAPA close exactly as approved

```text
Implement the approved P-04 CAPA closure rule without importing the old unapproved prerequisites. Only an actor with the Supervisor role, explicit PERM-CAPA-CLOSE permission, valid scope, active account, matching expected version, and an eligible non-terminal CAPA may close it. Do not require all CAPA actions to be complete and do not require effectivenessVerified/effectivenessAccepted=true for CLOSE. Still require a non-empty closure reason, successful reauthentication, E-Signature with explicit CLOSE meaning, request ID/idempotency protection, exact pre-transition snapshot/version, and immutable audit evidence in the same transaction. Employee, Manager, Admin-only, and yazeed without Supervisor authority must be denied for this specific action. CLOSED and VOID records remain terminal and cannot be closed again. Update the state-machine and permission documents, domain/application path, repository transaction, UI confirmation ceremony, and tests. Add positive tests proving a Supervisor can close with incomplete actions and effectivenessVerified=false, plus negative role, missing permission, stale version, missing reason, failed reauthentication, missing signature, duplicate request, and terminal-state tests. Do not weaken ACTIONS_COMPLETE or effectiveness-review rules for their own transitions; this exception applies only to CLOSE.
```

### Prompt 9 — Implement P-05 controlled approval authorities

```text
Implement the approved P-05 authority matrix for inspection approval, laboratory approval, receiving/material release, retest authorization, controlled VOID, and controlled-document approval. Each action may be performed by Supervisor, Manager, or yazeed/SYSTEM_OWNER only when the actor also has the explicit permission, valid scope, eligible state, matching version, and required business evidence. Admin alone is never approval authority. Preserve the general SoD rule except for the separately documented template lifecycle exception. Require reason, reauthentication, and E-Signature wherever the controlled transition policy requires them, and atomically persist audit/outbox evidence. Add a table-driven authorization suite covering allow and deny outcomes for Employee, Supervisor, Manager, Admin-only, yazeed, and multi-role Admin+Manager actors across every listed operation; include stale-version, out-of-scope, wrong-state, missing-evidence, and replay tests.
```

### Prompt 10 — Implement P-07 production release approval

```text
Implement a fail-closed production release-governance workflow. Final approval authority is Manager OR yazeed/SYSTEM_OWNER; one authorized signer is sufficient and Admin alone is denied. Approval must be impossible unless CI, security verification, database/migration verification, critical E2E, UAT acceptance, required signatures, no unresolved CRITICAL risks, and residual-risk handling all PASS for the exact same release candidate. LOW, MEDIUM, and HIGH residual risks may be accepted by Manager or yazeed with evidence; CRITICAL risk blocks a normal release. Require reauthentication and E-Signature, exact Git SHA, release-candidate ID, build identity, UAT evidence, residual-risk snapshot, timestamp, request ID, expected version, and immutable audit. Store RELEASE_APPROVED with approved_by, authority, release_id, git_sha, build_id, uat_status, residual_risk_status, signature_evidence_id, and approved_at atomically. Add table-driven gate tests, authority-negative tests, build-identity mismatch, stale/replay/concurrency tests, signature failure tests, and a critical E2E. Do not expose an enabled approval action until every gate is server-verified.
```

## 8) ترتيب التنفيذ

1. Prompt 1 وPrompt 2 وPrompt 5 لإغلاق فجوات الواجهة المباشرة.
2. Prompt 8 ثم Prompt 9 لتطبيق صلاحيات الجودة والاعتمادات المعتمدة.
3. Prompt 3 لتطبيق دورة حياة القوالب كاملة.
4. Prompt 4 لتجهيز النسخ والاستعادة والأدلة التشغيلية.
5. Prompt 10 لبناء بوابة اعتماد الإصدار النهائي.
6. Prompt 6 لإعادة التحقق الحي على release identity مثبتة.
7. Prompt 7 للحساب النهائي ومنع ادعاء 100% بدون أدلة كاملة.

## 9) الحكم النهائي

`better-interface verdict: Needs changes`.

- لا يوجد HIGH مؤكد في النطاق المفحوص.
- **إغلاق Findings: 53.3% (8/15).**
- **تغطية الجولة الحية: 50.0% (6/12).**
- **النجاح ضمن المنفذ: 83.3% (5/6).**
- **النجاح المحافظ: 41.7% (5/12).**
- لا توجد مطالبة Production Ready أو 100% في هذه النسخة.

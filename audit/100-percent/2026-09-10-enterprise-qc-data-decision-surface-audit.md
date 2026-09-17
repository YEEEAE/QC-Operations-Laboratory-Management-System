# Enterprise QC Data / Decision Surface Audit — 2026-09-10

## نطاق التدقيق

تمت مراجعة كل الأسطح المطلوبة كمساحات تشغيل QC مؤسسية، لا كقوالب إدارة عامة:

- Dashboard: KPIs, attention, activity
- Findings / NCR / RCA / CAPA
- Receiving / inspection / quarantine
- Laboratory
- Equipment / calibration / maintenance
- Controlled documents
- Change requests
- Approvals
- Reports
- Audit
- Backups / recovery
- Search
- Notifications
- Administration registers

## منهجية ودليل قابل لإعادة التحقق

- قراءة `01-mind-latest.md` كاملًا، و`AGENTS.md`، و`Documents/UI-UX-SPECIFICATION.md`، و`Documents/DESIGN-SYSTEM.md`، و`Documents/SYSTEM-INVARIANTS.md`، و`Documents/DOMAIN-MAP.md`، و`Documents/AUTHORIZATION-VISIBILITY-DECISION.md`.
- قراءة مهارة `ui-ux-pro-max` كاملة، ثم تشغيل بحوث محلية موجهة لـ: enterprise table states، accessible charts، authorized search، notification/live-region status، وAstro SSR/no-JS.
- جرد static لكل صفحات `src/pages` والمكوّنات المشتركة وطبقات read model/repository.
- فحص قراءة فقط للمتصفح على `https://qclevel.top/dashboard`؛ النسخة أعادت إلى `/login` بدون جلسة صالحة، لذلك لا يوجد ادعاء تحقق مصادق من الإنتاج في هذه الجولة.
- لا يوجد POST أو login أو mutation أو commit أو push أو deploy.

## الحكم التنفيذي

الأساس الدلالي جيد في نقاط حساسة: الواجهة تفصل `PASS` عن `RELEASED`، وتفصل نجاح النسخة عن `RESTORE VERIFIED`، والبحث ينص على عدم كشف النتائج غير المصرح بها. لكن الأسطح data-heavy غير موحّدة تشغيليًا:

1. لا يوجد فرز UI فعلي في أي قائمة جردت (`SortHeader` غير مستخدم)، رغم أن الاستعلامات تعتمد غالبًا على `updated_at DESC` بلا tie-breaker ظاهر للمستخدم.
2. لا يوجد pagination UI فعلي للقوائم التشغيلية تقريبًا (`Pagination` و`DataTable` غير مستخدمين)، بينما بعض read models ترجع قوائم كاملة أو limits ثابتة.
3. فشل مزوّد القراءة يتحول في عدة صفحات إلى قائمة فارغة أو صفر، وهذا يخلط بين `No data` و`Provider unavailable` ويخلق false zero في الأسطح الحساسة.
4. `LoadingState` و`StaleVersionState` موجودان كـprimitives لكن لا يوجد استخدام لهما داخل `src`؛ حالات التحميل/التعارض ليست عقدًا فعلية عبر الصفحات.
5. بعض الصفحات المطلوبة ليست registers مكتملة بعد: NCR/RCA/CAPA تعرض landing/notice فقط، وLab/Findings تعرض جداول مختصرة جدًا بلا سياق القرار المطلوب.
6. الرسوم التشغيلية غير موجودة فعليًا؛ هذا أفضل من رسم زخرفي، لكنه يعني أن Dashboard وReports لا تحققان مواصفة chart interaction لأنها تعرض empty trend أو table فقط.

## مصفوفة الأسطح

| السطح | ما هو مثبت | فجوات مؤسسية مؤثرة | الحالة |
|---|---|---|---|
| Dashboard | H1، scope، snapshot timestamp، 4 KPI definitions، attention links، activity timeline، نص صريح `PASS` ≠ `Released` | provider failure ينتهي بـempty arrays؛ attention query الحالية تركز على HOLD items؛ trend panel دائمًا `No trend series`; لا chart/table alternative فعلي لأنه لا توجد series | **NEEDS CHANGES** |
| Findings | business ID، summary، state، source context، links | لا filters، لا sort/pagination، الجدول بلا `scope`/wrapper horizontal، empty state لا يفرق filtered/provider، identifiers/source/owner/date/linked record ناقصة | **HIGH GAP** |
| NCR | route وlanding آمنان، creation policy unresolved موضح | لا NCR list/register ولا filters/metrics/empty/loading/provider state؛ المستخدم لا يملك queue تشغيلية | **BLOCKED / INCOMPLETE** |
| RCA | route context من NCR موضح | لا RCA register ولا state/owner/age/evidence/history surface | **BLOCKED / INCOMPLETE** |
| CAPA | closure authority unresolved ومرفوضة افتراضيًا بوضوح | لا CAPA register ولا due/overdue/owner/effectiveness queue؛ لا decision surface كاملة | **BLOCKED / INCOMPLETE** |
| Receiving | state filter، separate receiving/inspection/release columns، responsive wrapper، caption، row-scoped ID، `PASS`/release separation | filter ناقص (لا search/date/lot/item/assignee)، لا sort/page، provider failure يصير empty، لا stale/freshness، row action مجرد ID | **NEEDS CHANGES** |
| Inspection / Quarantine | state filter، workflow/result/version، receiving link، empty state، PASS/RELEASE boundary في overview | provider failure يصير empty، لا sort/page، لا search/date/inspector/result filters، overview يحوي KPI/attention محدودين ولا provider posture، no chart | **NEEDS CHANGES** |
| Laboratory | route/list وID/state/official result/version موجودة، controlled context موجود في detail | الجدول لا يملك horizontal scroll wrapper، لا filters/sort/page، لا sample/method/executor/reviewer/start/due/equipment، لا stale/readiness context ظاهر في list | **HIGH GAP** |
| Equipment | search/state filters، equipment/model/serial/state/location/version، wrapper horizontal | لا sort/page، provider failure empty، لا calibration/maintenance eligibility context في القائمة، no freshness/stale | **NEEDS CHANGES** |
| Calibration | search/state/equipment filter، calibration/equipment/date/due/certificate، wrapper horizontal، source-date caveat | لا sort/page، provider failure empty، overdue/due state قابل للعرض لكنه غير مميز بعقد دلالي واضح، no stale | **NEEDS CHANGES** |
| Maintenance | search/state/equipment filter، maintenance history list | لا sort/page، provider failure empty، لا provider/unavailable distinction، no stable action discoverability beyond row ID | **NEEDS CHANGES** |
| Controlled documents | search/document type، document identity/version table/detail، controlled history | لا sort/page، لا state/effective-date/owner filters، provider failure empty، versions detail غير قابلة للتصفح كجدول تشغيلي موحد | **NEEDS CHANGES** |
| Change requests | contextual target selection، state/search filters، snapshot/version/history في detail، stale wording في mutation paths | لا sort/page، لا provider state في list، list context/owner/age/target version غير مكتمل، JSON/snapshot detail يحتاج disclosure مضبوط لا truncation | **NEEDS CHANGES** |
| Approvals | authorized queue، visible subject/workflow/requester/version/state/action، count/actionable wording، no bulk approval | لا filters/sort/page، provider failure غير ممثل، count ليس page-aware، لا explicit pending/unavailable state، decision context يعتمد fallback على `subjectType/subjectId` | **HIGH GAP** |
| Reports | authorization before registry listing، server-side report execution، canonical table، scoped row count، horizontal scroll | report detail لا filter controls رغم عبارة server filters، لا pagination/sort، لا chart where useful، error handling غير موحد (unexpected error rethrows)، no provider/stale state | **HIGH GAP** |
| Audit | filters، authorized-empty anti-leakage، explicit caption/scopes، deterministic query order، real offset paging | provider/authorization failure intentionally indistinguishable from empty؛ useful security-wise لكن operationally no unavailable state، no sort UI، request/subject IDs may be difficult to scan without full-value disclosure | **NEEDS CHANGES** |
| Backups | catalog table، job vs restore distinction، schema/checksum posture، recovery target caveat، restore request boundary | list fixed limit 50 بلا pagination/sort/filter، catalog read failure redirects 404 بدل provider unavailable، no freshness/last successful backup summary، backup ID raw UUID is not a human operational identifier | **HIGH GAP** |
| Search | GET deep links via `q`، authorized search call، result type/business ID/descriptor/state/context، no-result recovery copy، no unauthorized result-then-deny | no keyboard command surface/arrow/Enter behavior or grouped suggestions، provider failure becomes no results، no explicit unavailable state، destination fallback to dashboard can hide unsupported entity routing | **NEEDS CHANGES** |
| Notifications | own-account query، All/Unread URL state، real subject links، unread visual state، severity has text aria label | provider failure becomes “You’re all caught up” false zero؛ no unread count truth on surface؛ severity dot still carries color visual dependence؛ no explicit read/unread status text; no loading/unavailable state | **HIGH GAP** |
| Admin registers | explicit admin authorization, captions/scoped IDs، role/user/permission tables، no destructive bulk actions | no filters/sort/page، provider denial and empty are partially distinguished but provider outages not، long login/code/state text may overflow, scope management uses raw UUID lookup, no register-level freshness/state | **NEEDS CHANGES** |

## Cross-cutting findings

### P0 — False empty / false zero on provider failure

الصفحات التالية تمسك الخطأ وتعيد array فارغ أو view افتراضي بدل حالة unavailable واضحة: `dashboard/index.astro:10-11`، `search.astro:10-12`، `notifications.astro:7-9`، `quarantine/receiving/index.astro`، `quarantine/inspections/index.astro`، `assets/equipment/index.astro`، `assets/calibrations/index.astro`، `assets/maintenance/index.astro`، `documents/index.astro`، و`quarantine/index.astro`.

الأثر: لا يمكن للمشغل يميز “ما فيه سجلات” عن “المزوّد ما رد”، وقد يظهر notification inbox أو KPI كأنه صفر. هذا يخالف عقد empty/error/unavailable ويؤثر على قرارات QC.

المعالجة المطلوبة: typed read outcome يفرق `loaded`, `empty`, `filtered-empty`, `unauthorized-empty`, `provider-unavailable`, مع request reference ورسالة استرجاع آمنة؛ لا تستخدم zero/empty كfallback صامت.

### P0 — قوائم بلا pagination ولا فرز قابل للاكتشاف

الدليل: `src/ui/components/data/Pagination.astro` و`SortHeader.astro` و`DataTable.astro` معرفة، لكن `rg` على `src` يثبت 0 استخدام فعلي لـ`SortHeader` و`DataTable` و`LoadingState` و`StaleVersionState`، و`Pagination` لا يظهر إلا في تعريفه. الاستعلامات الأساسية مثل `tasks`, `receiving_items`, `inspection_reports`, `lab_tests`, `equipment`, `calibration_records`, `maintenance_records`, `documents`, `findings`, و`change_requests` تستخدم غالبًا `orderBy(updated_at, desc)` فقط.

الأثر: ترتيب الصفوف غير قابل للاكتشاف وقد لا يكون deterministic عند تساوي timestamps، والقوائم لا تقدم page state أو total/next boundary، ما يضعف قدرة المشغل على العثور على سجل والتأكد أنه لم يتغير موضعه.

المعالجة المطلوبة: server pagination مع total/hasNext، sort allowlist مرئي بـ`aria-sort` وtie-breaker ثابت (`updated_at`, ثم business ID أو event number)، وحفظ filter/sort/page في deep link.

### P1 — الجداول اليدوية لا تلتزم دائمًا بعقد accessibility/responsive

بعض الصفحات تستخدم `caption` و`scope` بشكل صحيح، لكن Findings وLaboratory خصوصًا تستخدم `<table>` مباشرة بدون `scope` في الرؤوس أو wrapper horizontal. المكوّن المشترك نفسه يوفر scroll وfocus-within، لكنه غير مستخدم. الصفحات الأخرى تختلف في `min-width` وfocus/row action behavior.

المعالجة المطلوبة: توحيد primitive، إضافة `scope="col"` و`scope="row"`، row action واضح نصيًا، وعدم قص state/action/safety copy؛ اختر per-surface بين scroll مع عمود مفتاح ثابت أو mobile row detail.

### P1 — لا يوجد loading contract فعلي للقوائم

`LoadingState.astro` يوفر skeleton و`aria-busy` وreduced-motion، لكنه غير مستخدم. أغلب الصفحات تنتظر SSR read قبل أي markup، فلا يظهر section-level loading عند تأخر provider أو أثناء انتقالات client enhancement.

المعالجة المطلوبة: skeleton لكل section data-heavy، مع `aria-busy` وlabel يذكر السطح، وإبقاء no-JS content usable حسب Astro contract.

### P1 — stale/conflict contract غير موصول بالأسطح

`StaleVersionState.astro` موجود لكن غير مستخدم، بينما مواصفة النظام تتطلب blocking panel واضحًا عند `CONFLICT_STALE_VERSION`. بعض forms تعرض نصًا آمنًا فقط داخل status، ولا يظهر دائمًا opened version/latest version/compare context.

المعالجة المطلوبة: component موحد في review/approval/release/change/document/lab/quarantine، يعرض النسخة المفتوحة، latest reload، compare حيث يدعم domain، وسبب أن overwrite ممنوع.

### P1 — Search keyboard/deep-link contract ناقص

الصفحة الحالية هي GET form عادي وتحافظ على `q`، وهذا جيد للروابط. لكنها لا تطبق command surface الموصوفة في الـFoundation: `Ctrl/Cmd+K`, grouped authorized results, Arrow keys, Enter. ولا يوجد unavailable provider state أو suggestions مرتبطة بالكيانات المسموحة.

المعالجة المطلوبة: progressive enhancement فوق GET/no-JS، مع combobox semantics فقط إذا صار هناك behavior فعلي، وعدم استدعاء provider عند غياب permission، وعرض recovery suggestions لا تكشف وجود سجل غير مصرح.

### P1 — Notifications/Approvals لا تثبت truthfulness عند الاعتماد

Approvals تعرض `approvals.length` كعدد actionable في الصفحة، لكن بلا pagination/total أو provider state. Notifications تعرض “You’re all caught up” بعد catch. هذا يخالف شرط أن counts تمثل authorized actionable records وأن unavailable لا يظهر كصفر.

المعالجة المطلوبة: read model يرجع `count`, `items`, `freshness`, `availability`, و`lastChecked`; badge يعلن status سياقي واحد فقط إذا تغير، والـseverity لا يعتمد على اللون وحده.

## Charts decision

- لا يوجد chart فعلي مستخدم في `src/pages`؛ `Chart.astro` نفسه غير مستخدم، وDashboard يعرض `No trend series` بدل اختراع بيانات.
- هذا قرار صحيح من ناحية عدم اختراع metrics أو رسم زخرفي.
- لكنه يترك Dashboard/Reports ناقصة مقارنة بالمواصفة: إذا لم تتوفر series من backend، يجب إبقاء empty state صريحًا مع تعريف سبب غيابها؛ وإذا أضيفت series لاحقًا يجب إضافة legend/axis/unit، focus/keyboard detail، textual/table alternative، no color-only semantics، وlink إلى filtered source list.

## Bulk actions decision

لا توجد bulk actions في الأسطح التي جرى جردها، وهذا آمن ومتوافق مع منع bulk approve/release/sign. لا نوصي بإضافة checkboxes أو bulk toolbar إلا بعد وجود permission مستقل، row-level state validation، transaction/idempotency، وevidence/audit لكل batch.

## الأولويات التنفيذية المقترحة

1. إغلاق false empty/false zero بمسار read outcome موحد، بدءًا من Dashboard وNotifications وApprovals وSearch وBackups.
2. إدخال server pagination + deterministic sort لكل register قبل تحسين visual polish.
3. توحيد `DataTable`/caption/scopes/row actions/horizontal strategy وإصلاح Findings وLaboratory كأوضح مخالفتين.
4. وصل loading/stale components بالصفحات الفعلية، مع no-JS وreduced-motion.
5. استكمال register surfaces لـNCR/RCA/CAPA، أو إبقاء landing صريحًا بعنوان “not implemented / policy blocked” بدل إيحاء أنها قوائم موجودة.
6. بعد توفر verification fixtures، تشغيل مصفوفة مصادقة لكل role/scope، ثم فحص متصفح 320px/200%/keyboard/forced-colors على نفس release candidate.

## حالة التدقيق

**الحالة: جزئي / NEEDS CHANGES — لا يوجد claim readiness أو 100%.**

السبب: الدليل static قوي على فجوات موحّدة في القوائم والحالات، بينما التحقق المصادق الحي لكل role/provider failure/stale/approval لا يزال غير متاح في البيئة الحالية.

# QC-ADP26-25 — صلاحيات المنح الأولي للمستخدم

**State: PARTIAL.** يمنح `PERM-IDN-MANAGE-USERS` صلاحية إنشاء الحساب دون منح أولي فقط. منح أي دور أو نطاق أولي يحتاج إذن الإسناد المطابق؛ يرفض الخادم كامل العملية قبل تجزئة كلمة المرور أو أي كتابة إذا غاب الإذن. تغييرات المصدر والوثائق اكتملت محليًا، لكن تعارض مصفوفة الأدوار، ودليل PostgreSQL 18، والقبول المصادق للصفحة ما زالت مفتوحة.

## Changed

- حُدّثت `CreateUserUseCase` لتفويض كل دور عبر `PERM-ADM-ROLE-ASSIGN` وكل نطاق عبر `PERM-ADM-SCOPE-ASSIGN`، بالإضافة إلى إذن `PERM-IDN-MANAGE-USERS` السابق. فحص النطاق يستخدم `{}` ويتطلب grant نشطًا صريحًا بنطاق `GLOBAL`. الحساب الجديد يأخذ معرّفًا قبل التفويض؛ فحص النطاق يمرر ذلك الحساب، ويحافظ على شرط منع إسناد الصلاحية للنفس.
- تبقى عملية الرفض قبل password hashing وrepository/audit؛ لم تتغير حزم الأدوار ولا أضيفت صلاحية. الإنشاء بلا grants مسموح لحامل MANAGE العالمي. إنشاء الصفحة يرسل قائمتين فارغتين فيستخدم مسار `createProvisioned` الذري.
- أخفت الصفحة قوائم الدور والنطاق كلًا على حدة إذا غاب إذن الإسناد الموافق، مع مسار لإنشاء الحساب دون المنح وإضافتها لاحقًا بواسطة مسؤول مخوّل. أضيفت حالة لا توجد أدوار نشطة، وتوضيح الرفض ومسار المراجعة، ونصوص منفصلة للرفض، والاعتماد/السجل المفقود، وتعطل الخدمة ذات النتيجة المحتمل عدم تأكيدها، والنتيجة المجهولة. تبقى مدخلات المستخدم غير السرية؛ حقل كلمة المرور لا يُعاد عرضه.
- فُصل `SYSTEM_DATABASE_UNAVAILABLE` كحالة `PROVIDER_UNAVAILABLE` عن `RESOURCE_NOT_FOUND` (`DEPENDENCY_UNAVAILABLE`) والـstale والنتيجة المجهولة. عطل الخدمة يوجّه للتحقق من سجل المستخدمين قبل الإعادة، بينما المرجع المفقود يوجّه للتحقق من الدور/النطاق النشط. الإرسال المكرر محمي عبر enhancer القائم؛ لا autosave.
- وثّقت السياسة وحدودها في `Documents/PERMISSION-MATRIX.md`. لم تتغير قاعدة بيانات أو migration.

## Frozen candidate and tools

- **Requested audit HEAD:** `0b1bb21bb3b4eca77862dbba1da8623044e96355`، ولم يكن HEAD في workspace. لم أنقل دليل التدقيق إليه تلقائيًا.
- **Workspace source HEAD / candidate SHA:** `1da3b978b477b043eed22398ec8010f91e45148d`, branch `main`. كان status وdiff نظيفين عند بدء المهمة؛ لا تغييرات مستخدم سابقة على الملفات. التغييرات الحالية محلية وغير ملتزمة.
- **Dirty source fingerprint:** محفوظ في `.ci-results/run-context.json`، ومطابق للمرشح المشار إليه كذلك في `.ci-results/build.json`. هذا هو fingerprint الذي يشمل مصدر المهمة، الحandoff، والـMind وworkspace map النهائية.
- قبل إنشاء هوية هذا المرشح حُفظت الأدلة القديمة من مرشحين مختلفين تحت `.ci-results/qc-adp26-25-previous/`: `run-context.json` و`build.json` كانا على HEAD `d8319aaa…`/migration `0042`، بينما `dist/release-identity.json` كان على `edb3607f…`/migration `0043`. لم تُخلط هوياتها.
- Node: `v24.20.0` مطابق للعقد `.nvmrc` / `package.json`; Astro `4.16.19`; Vitest `5.0.0`; PostgreSQL المحلي المثبت `18.6`; RTK `0.49.0`. `packageManager` يثبت `pnpm@11.25.0`، لكن تشغيل Corepack لم يتمكن من جلب CLI بسبب DNS `ENOTFOUND`؛ أوامر التحقق استخدمت bin المحلي مباشرة تحت Node 24.20.0.
- PostgreSQL 18.6 بدأ تهيئته فقط في مسار مؤقت معزول ثم فشل `initdb` بسبب `shmget: Operation not permitted` حتى مع خيارات mmap؛ أزال initdb دليل التهيئة الفاشل. Docker/Testcontainers غير متاح. لم تُستخدم قاعدة الإنتاج أو أي `DATABASE_URL` خارجي.

## Evidence

| Check | Result | Reference / limit |
|---|---|---|
| Dual-permission boundary and active/global actor scope | PASS | `CreateUserUseCase`, authorization policy registry, unit tests؛ MANAGE منفرد ينجح بلا grants، وأي grant أولي بلا إذنه يرفض قبل hash/write. |
| Focused application / authorization tests | PASS | `vitest run tests/unit/admin/identity-admin.test.ts tests/unit/admin/admin-workspace-guard.test.ts tests/unit/admin/admin-error-contract.test.ts tests/unit/ui/mutation-post.test.ts` — 4 files, 94/94 PASS under Node 24.20.0. |
| Affected page copy/error-state contracts | PASS | Focused `ux-writing-contract.test.ts` + `copy-governance-contract.test.ts` selection — 4/4 PASS, 23 other cases deselected. |
| Role/state/fixture binding | PARTIAL | Integration setup inserts `MANAGER_ID` / `cc-manager` as ACTIVE with MANAGER role and GLOBAL `user_scopes`; the test `ActorContext` manually adds GLOBAL MANAGE (not derived from role seed). Positive control sends `roleCodes:[]`, `scopes:[]` and expects one `CREATE_USER_PROVISIONED` audit. It is synthetic, not a valid seeded manager permission fixture. |
| Granted role/scope set is not expanded | PASS | Unit tests تؤكد تمرير القوائم المطلوبة فقط، ورفض grant خارج `GLOBAL`. |
| ESLint / Prettier | PASS / PARTIAL | ESLint نجح لكل ملفات TS المعدلة. Prettier نجح للـTS/Markdown المتغير عدا `mutation-post.test.ts` الذي يحوي تنسيقًا سابقًا في سياقات غير معدلة؛ لا Astro parser متاح للتحقق من `new.astro`. |
| Page route visibility | PARTIAL | `pageAccessDecision` في middleware يتطلب حسابًا نشطًا؛ مسار إدارة المستخدمين يتطلب MANAGE الصريح. فحص الضيف الفعلي أعاد 303 إلى `/login`; لا توجد جلسة/fixture مصادق لتقييم عناصر الصفحة بعد تسجيل الدخول. |
| PostgreSQL 18 integration, row/audit/outbox before/after on denial | BLOCKED | مجموعة `control-center.test.ts` تحتوي positive control بحساب Manager اصطناعي وMANAGE عالمي مع قوائم فارغة، ثم تقارن أعداد `users`, `user_roles`, `user_scopes`, `audit_events`, `outbox_events` وسجل request للرفض. لم تصل إلى الإعداد: لا container runtime، وتهيئة PG18 المحلية مرفوضة من النظام. لا توجد before/after من قاعدة حقيقية. |
| PostgreSQL 18 transaction rollback, duplicate-login race, replay | BLOCKED / NOT VERIFIED | اختبارات failure injection والتزامن أضيفت؛ لم تنفذ. معاملة provisioning تضم user + grants + `CREATE_USER_PROVISIONED` audit. لا outbox event لعقدة إنشاء المستخدم. `requestId` للربط بالتدقيق وليس idempotency key؛ تكرار login يعتمد unique constraint، ولا ضمان replay مستقل. |
| Source/applied schema | PARTIAL | المصدر: 43 migration؛ الرأس `0043_controlled_document_source_binding` (اسم/Checksum في release identity). schema المطبق غير متحقق لغياب اتصال PostgreSQL معزول؛ لا migration جديدة مطلوبة. |
| Build / build identity | PASS / see artifact | `dist/release-identity.json`, `.ci-results/build.json`, `.ci-results/run-context.json`؛ الهوية مرتبطة بالـcandidate SHA والـdirty source fingerprint. لا تعني قبول نشر أو تحقق provider. |
| `astro check` | FAIL | خطأ واحد معروف خارج التغيير: `src/pages/ai-advisory.astro:148`, `requestButton` nullable. لا توجد أخطاء تشخيصية ظاهرة في الملفات المعدّلة؛ 113 hints خارج ذلك. |
| Neighboring legacy UI assertions | FAIL (out of scope) | `tests/unit/ui/unsaved-navigation-contract.test.ts` has a stale assertion that expects unknown-state wording in `ux-vocabulary.ts`; that file was not changed. Broader UX-writing also flags the existing 500-page one-action assertion. |
| Browser page | BLOCKED | فحص CUA على `astro dev` تحت Node `22.22.3`: `/admin/users/new` أعاد 303 إلى `/login`، وظهرت صفحة الدخول 200. معاينة build تحت Node `24.20.0` مع `DATABASE_URL` فارغ أغلقت الطلب بسبب إعداد runtime غير صالح. لم تُدخل بيانات اعتماد؛ الصفحة الإدارية المصادق عليها لم تُعرض لغياب fixture/session. |
| 320/375/768/1440 CSS px, 200% zoom, keyboard, manual AT | NOT VERIFIED | لم يُنفذ على الصفحة المصادق عليها لعدم وجود fixture. لا تُستنتج المطابقة من static source أو route redirect. |
| Canonical owner immutability | NOT VERIFIED on this candidate | لم تتغير حماية yazeed. اختبار repository القائم في `control-center.test.ts` لم ينفذ لغياب PG18؛ uniqueness والاختبارات السابقة ليست دليلًا حيًا جديدًا. |
| Human UAT | NOT RUN | لا يوجد توقيع بشري؛ لم يُنسب قبول UAT للوكيل. |
| Workspace map | PASS / see generated map | أُعيد توليد الفهارس بالأمر المعتمد بعد تحديث الوثيقة والـMind والـhandoff. |

### Database transaction/read/write boundary

- **Reads:** لا قراءة DB في `CreateUserUseCase` قبل التفويض؛ مصدر صلاحيات الفاعل هو `ActorContext` الخادمي. عند الإسناد، `createProvisioned` يقرأ الأدوار النشطة ويعيد التحقق من scope kinds/values والتكرار داخل المعاملة. واجهة الدور تقرأ الأدوار النشطة فقط عند وجود إذن الإسناد.
- **Writes:** provisioning يكتب `users`, ثم `user_roles` و`user_scopes` المختارة فقط، ثم `CREATE_USER_PROVISIONED` في `audit_events` ضمن معاملة PostgreSQL واحدة. لا outbox لعقدة إنشاء الهوية. رفض authorization يقع قبل hashing والمستودع والتدقيق، فلا صف جزئي ولا audit-denial.
- **Constraints:** unique login identity؛ FK إلى role/user؛ active-role check؛ تحقق نوع/قيمة scope ومنع تكرار scope في المستودع، وقيود schema ذات الصلة. سباق login ينبغي أن ينتج نجاحًا واحدًا ورفضًا واحدًا بلا grant/audit مكرر؛ هذا مثبت كاختبار مصدر فقط إلى حين PG18.
- **Locks / version / SoD / signature:** لا migration ولا version لصف user غير المنشأ؛ التفويض يستخدم عقد admin القائم `{currentVersion:1, expectedVersion:1}` وحالة ACTIVE. منع إسناد النطاق للنفس يطبق على id الحساب المولّد. لا توقيع أو reauth منصوص لهما في عقد إنشاء الحساب؛ `N/A` لذلك. صلاحية SYSTEM_OWNER/yazeed لا تتجاوز القرار أو policy.
- **Failure boundary:** إضافة trigger لفشل audit يجب أن تتراجع معها الحسابات/grants كلها. ضابط الرفض يقارن كل الجداول أعلاه قبل/بعد. كلاهما غير منفذ على PG18 لهذه النسخة.
- **Redacted DB before/after:** NOT AVAILABLE — لم تُنشأ قاعدة fixture. لا بيانات إنتاج أو أسرار في تقارير الأدلة.

## Route and finding status

| Page/finding | Status | Note |
|---|---|---|
| `/admin/users/new` / QC-PAGE-F-025 | PARTIAL | مصدر الصفحة والحماية والمحتوى تحسنت؛ route authenticated, responsive, AT and UAT remain NOT VERIFIED. |
| MANAGE alone creates account with no initial grants | PASS at unit/source level; acceptance BLOCKED | Fixture يحمل role `MANAGER` وglobal MANAGE اصطناعيًا. seed الحالي لا يمنح MANAGE للـManager، ومصفوفة السياسة تقول DENY؛ لذلك لا يوجد manager صالح وفق المصدر الحالي. |
| Initial role/scope grant without matching permission | PASS in unit; DB proof BLOCKED | الخادم يرفض كامل الإنشاء قبل hash/DB. |
| Role-to-permission mapping | OPEN — policy owner required | §28 من `Documents/PERMISSION-MATRIX.md` يمنع MANAGE عن Manager وAdmin؛ `db/seeds/common.ts` يعطي Admin MANAGE وROLE-ASSIGN وSCOPE-ASSIGN ولا يعطيها للـManager. لم أعدّل seed أو permission grants. هوية مالك قرار المصالحة غير مثبتة في المصادر المقروءة؛ لا يمكن إعلان manager acceptance قبل حسمه. |
| Canonical owner | OPEN evidence | لم تتغير سياسة الحماية؛ اختبار عدم التغيير يحتاج PG18. |

## Remaining decisions

- على مالك identity/RBAC الذي تعيّنه الحوكمة حسم تعارض مصفوفة MANAGE مقابل seed Admin، وتحديد هل دور Manager ممنوع من إنشاء الحسابات أم أن matrix/seed يحتاجان تغييرًا معتمدًا. يبقى المسار الافتراضي DENY حسب الصلاحيات الفعلية؛ لم أفترض delegation.
- توفير container runtime مدعوم أو مسار PG18 معزول يسمح بـ`initdb`، ثم تشغيل unit/application/PG/direct HTTP/E2E ذات الصلة بما فيها before/after، audit/outbox، failure injection، rollback، concurrency وduplicate replay.
- توفير fixture مصادق غير إنتاجي مع دور/صلاحيات متوافقة مع القرار؛ بعدها فحص الصفحة عند 320/375/768/1440 CSS px و200%، keyboard وAT يدوي، ثم قبول UAT بشري مستقل.

## State

**PARTIAL.** لا توسعة للصلاحيات ولا تغيير مخطط؛ الخادم يمنع المنح غير المخولة وتعرض الصفحة الخيارات المخولة فقط. تظل موافقة Manager acceptance محجوبة بتعارض المصدر، وإثبات PostgreSQL 18 والصفحة المصادق عليها وAT/UAT غير مكتمل. لا commit/push/merge/deploy أو كتابة قاعدة إنتاجية تمت.

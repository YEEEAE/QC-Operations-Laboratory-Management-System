# QC-LAUNCH-021 — خطة التصحيح والقرارات

> المرشح: `df822596d693dd5dfed61e24a7c3475e9835a966` (فرع `main`، working tree نظيف)
> مرجع التدقيق: `60e78cc6fdafe6c70e249be2d687c1df3af45412` (سلف لـHEAD — إعادة تأسيس إلزامية)
> سياق التحقق: `7d6078e3-c1eb-4009-a00e-440f7022e82c` — Node `v24.20.0`، macOS arm64
> الحالة: **BLOCKED** — 0 نقاط مقبولة. لا commit ولا push في هذه الخطة؛ كلها مقترحات تحتاج تفويضًا.

---

## ملخص القرار

لا يمكن قبول هذا المرشح لأي بند من بنود QC-LAUNCH-021 لأن البوابة المطلوبة `pnpm test:unit` حمراء على HEAD نفسه، ولأن المصادر المتحكمة التي تُقاس عليها الصلاحيات والسياسة مفقودة من المرشح. لا شيء في هذه الخطة يتطلب تعديل سلوك أمني في وحدة المهام؛ وحدة المهام نفسها سليمة في المصدر ودليلها الوحدي ناجح. المشكلة في المرشح حولها.

---

## القرارات المطلوبة من المالك (قبل أي تصحيح)

### D-1 — هل حذف `Documents/*.md` مقصود في المرشح؟

- `70c7b725 «update site»` حذف **70 من 74** ملفًا تحت `Documents/`، ومنها مصادر يتوقف عليها التحقق:
  - `Documents/QC360-TASK-POLICY-2026-10-08.md` (السياسة التي يثبّتها `occurrence.ts:34` حرفيًا)
  - `Documents/PERMISSION-MATRIX.md`، `Documents/OWNER-DECISION-RBAC-2026-09-23.md`، `Documents/BUSINESS-RULES.md`، `Documents/REQUIREMENTS-RECONCILIATION.md`
- الأثر: 17 فشل وحدة بـ`ENOENT`، وسقوط اختبار عقد الصلاحيات `qc-permission-contract.test.ts`، وعدم إمكانية التحقق من بصمة التكرار والصلاحيات على المرشح.
- الخيارات: (أ) إعادة المصادر المتحكمة إلى المرشح؛ (ب) نقلها إلى مسار متحكم موثّق وتحديث الاختبارات ومراجعها؛ (ج) إعلان صريح أن المرشح لا يحتوي مصادر متحكمة وإلغاء البنود التي تعتمد عليها.
- **لا يمكن المتابعة في (ب) أو (ج) دون قرارك**، لأن الأخير يغيّر نطاق القبول لا الكود فقط.

### D-2 — هل يُعاد `{type,id}` (UUID) لمستخدم المهمة الذي لا يملك عرض السجل الأجنبي؟

- الحالي: لا يُسرَّب عنوان ولا رابط، لكن يُعاد الزوج `{type, id}` في `task.specializedRecord` حتى عند المنع (`get.ts:68-75`).
- إن كان المقصود «صفر معرفات أجنبية» فيلزم تغيير في `get.ts` (حجب الزوج أيضًا عند المنع)، وهذا تغيير سلوك يحتاج قرارك وقاعدة قبول صريحة.

### D-3 — هل تُشغَّل اختبارات قاعدة البيانات لاحقًا؟

- Docker غير متاح محليًا، لذلك 50 ملف integration وكل اختبارات التزامن محجوبة.
- أي ادعاء إيجابي على الصلاحيات الفعلية أو التزامن يبقى **NOT TESTED** حتى توفر Docker أو قاعدة PG18 معزولة معتمدة.

---

## التصحيحات المطلوبة (مقترحة، بلا تنفيذ)

### P-1 — إصلاح دعوى اختبار سلبية كاذبة (الأهم داخل النطاق)

الملف: `tests/integration/tasks/use-cases.test.ts` — الفشل عند السطرين 113 و 128.

السبب: `CreateTaskUseCase.execute` دالة `async` (`src/modules/tasks/application/create.ts:17`)، واستدعاؤها لا يرمي متزامنًا أبدًا، لذلك `expect(() => …).toThrow(…)` يفشل دائمًا ويولّد unhandled rejection. **السلوك الأمني صحيح** (المسار: `authorize` → `throwOnDeny` → `AppError AUTHZ_PERMISSION_MISSING`)، والدعوى وحدها خاطئة.

قبل:

```ts
expect(() =>
  new CreateTaskUseCase(repository).execute({
    actor: actorWithoutCreate,
    taskNo: 'TASK-DENIED-CREATE',
    /* … */
  }),
).toThrow(expect.objectContaining({ code: 'AUTHZ_PERMISSION_MISSING' }));
expect(repository.task).toBeUndefined();
```

بعد:

```ts
await expect(
  new CreateTaskUseCase(repository).execute({
    actor: actorWithoutCreate,
    taskNo: 'TASK-DENIED-CREATE',
    /* … */
  }),
).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
expect(repository.task).toBeUndefined();
```

وينطبق النمط نفسه على كتلة «denies assignment…» حول السطر 128.

ملاحظة: الملف مطابق تمامًا بين مرجع التدقيق وHEAD (`3798e92d`)، فهذا **عيب سابق** لا يُنسب لإعادة التأسيس، لكنه يخص منع الصلاحيات مباشرة في هذه المهمة فيجب إصلاحه ليصبح دليلًا صالحًا.

### P-2 — استعادة المصادر المتحكمة أو تحديث مراجعها

حسب D-1. الحد الأدنى لفتح بوابات الوحدة هو إعادة الملفات المشار إليها في:

- `tests/unit/authorization/qc-permission-contract.test.ts` (يقرأ `Documents/OWNER-DECISION-RBAC-2026-09-23.md`)
- `tests/unit/requirements/reconciliation-contract.test.ts`
- `tests/unit/verification/route-acceptance.test.ts`
- `tests/unit/ui/help-content-contract.test.ts`
- `tests/unit/ui/record-journey-contract.test.ts`
- `tests/unit/ui/visual-token-contract.test.ts`

المصادر المفقودة المرصودة حرفيًا: `BUSINESS-RULES.md`، `PERMISSION-MATRIX.md`، `DESIGN-SYSTEM.md`، `DECISION-ASSUMPTION-REGISTER-026.md`، `EXTENDING-THE-SYSTEM.md`، `GAP-RISK-PRIORITY-MATRIX.md`، `REQUIREMENTS-RECONCILIATION.md`، `REQUIREMENTS-TRACEABILITY.md`، `ROLE-OPERATING-GUIDES.md`، `SUPPORT-OWNERSHIP-REGISTER.md`، `OWNER-DECISION-RBAC-2026-09-23.md`.

### P-3 — مرجع سكربت مدقق مفقود (عيب سابق)

- `tests/unit/uat/uat-record-validator.test.ts:7` يثبّت `audit/100-percent/uat/validate-uat-records.mjs`، والمسار غير موجود في HEAD **ولا** في مرجع التدقيق (`audit/100-percent` يحتوي في HEAD ملفًا واحدًا فقط: `ai-evals/deterministic-eval-dataset.json`).
- القرار: إما إعادة السكربت من مصدره المعتمد، أو حذف/تحديث الاختبار ليطابق الواقع. **لا يُختلق سكربت** لإرضاء اختبار.

### P-4 — عقود تربط مصدر الصفحات

- `tests/unit/backup-recovery/restore-form-contract.test.ts` و`tests/unit/ui/mutation-safety-contract.test.ts` تربط نص/أبنية المصدر وتنكسر بعد استبدال `<section class="page-head">` بمكوّن `PageHeader` في `src/pages/tasks/{[taskId],index,new}.astro`. وينطبق الاتجاه نفسه على أي صفحة أخرى تغيّرت في «update site».
- القرار: تحديث التوقعات لتقرأ العقد الجديد (المكوّن) بدل النص القديم، أو تثبيت العقد في مصدر واحد يمكن اختباره بدل الالتقاط النصي الهش.

### P-5 — فتح حاجز قاعدة البيانات

- توفير Docker/Testcontainers لإعادة تشغيل: `pnpm test:integration`، `pnpm test:concurrency`، و`pnpm test:migrations`.
- بعد الفتح، سيناريو القبول المطلوب لـC1 هو: إنشاء مهمة مرتبطة بسجل أجنبي، سحب صلاحية العرض للسجل، ثم إعادة فتح تفاصيل المهمة بصلاحية المهمة فقط ⇒ لا رابط، لا عنوان، ولا فشل واجهة.

### P-6 — نظافة المستودع (غير حاجز)

- مرجع Git مكسور: `refs/remotes/origin/main 2` (اسم يحتوي مسافة) يجعل `git log --all` يصدر تحذيرًا ويفشل. يُحذف بأمر صريح منك خارج هذه المهمة.
- ملفات مكررة بأسماء macOS تحت `audit/`: `Wi 2.pdf`، `Wi2 2.pdf`.

---

## ما لا يحتاج تصحيحًا

وحدة المهام سليمة في المصدر ولم تتغير بين مرجع التدقيق وHEAD. الأدلة الوحدية الناجحة داخل النطاق محفوظة:

- `references-occurrences.test.ts` (19) — منها منع تسرب الرابط عند رفض السجل الأجنبي، والفشل المغلق بلا كتابة، ورفض المنحة المفقودة/غير النشطة.
- `domain.test.ts` (4)، `transition-cancel-deny.test.ts` (2).
- `tests/integration/tasks/authorization-matrix.test.ts` و`repository.test.ts` (ناجحان، لا يحتاجان قاعدة بيانات).

هذه أدلة مرشحة، ولا تُحتسب نقاطًا حتى يوجد مراجع rubric مستقل ومرشح ببوابة خضراء.

---

## خطوات ما بعد التصحيح (بند التحرير)

1. `nvm use` (Node 24.20.0) في working tree نظيف.
2. `pnpm verification:begin` لإنشاء سياق مرشح جديد.
3. `pnpm test:unit` — يجب أن يكون Exit 0.
4. `pnpm test:integration` و`pnpm test:concurrency` مع Docker متاح — Exit 0.
5. سيناريو سحب الصلاحية لـC1 على قاعدة معزولة + دليل واجهة.
6. `pnpm verification:begin` جديد لكل تغيير مصدر، ثم إعادة تسجيل الأدلة وربطها بـ`gitSha` و`sourceFingerprint` الجديدين.
7. تحديث الـMind: إغلاق حاجز Docker إن انفتح، وتسجيل حذف المصادر المتحكمة وسببه.

أي إعادة تنفيذ على مصدر تغيّر بلا `verification:begin` جديد تُرفض من `evidence-identity.mjs:64-72`، وهذا مقصود.

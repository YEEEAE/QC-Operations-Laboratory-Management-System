# Restore Drill Runbook

**Status:** IMPLEMENTATION RUNBOOK — provider-neutral validation only  
**Scope:** Isolated post-restore verification for PostgreSQL, controlled history, evidence objects, and application context  
**Authority:** `Documents/BACKUP-RECOVERY-PLAN.md`, `Documents/DATABASE-ARCHITECTURE.md`, `Documents/PRODUCTION-READINESS-CHECKLIST.md`

## Purpose

هذا الإجراء يثبت أن قاعدة وملفات مستعادة يمكن التحقق منها في هدف معزول. وجود backup أو نجاح مهمة إنشائه لا يساوي `RESTORE VERIFIED`.

الأدوات هنا لا تنفذ backup أو physical restore أو WAL replay أو PITR، ولا تتصل بمزود محدد. هي تبدأ بعد أن ينجز المشغّل الاستعادة الفعلية بالطريقة المعتمدة لدى الاستضافة.

## Safety defaults

- الهدف الافتراضي للـdrill معزول وغير إنتاجي (`test` أو `staging` مخصص للاستعادة)، وليس production.
- لا تستخدم بيانات Production في جهاز مطوّر أو بيئة مشتركة بدون مسار sanitization/security معتمد.
- لا تشغّل migrations أو seeds أو bootstrap على الهدف قبل فحص baseline؛ الاستعادة والتحقق منفصلان عن forward upgrade.
- لا تطبع `DATABASE_URL` أو مفاتيح التخزين أو مسارات provider أو الأسرار في المخرجات.
- لا تعتبر نتيجة `BACKUP CREATED` أو `backupJobResult: SUCCEEDED` دليل استعادة.
- `PASS` التاريخي/العلمي لا يُعاد حسابه ولا يُخترع أثناء drill؛ نتحقق من بقاء السياق والعلاقات فقط.

## Preconditions

جهّز Recovery Manifest خارجيًا ومحميًا يحتوي على:

- backup set/reference وبيئة المصدر.
- PostgreSQL version context وmigration ledger مع checksums.
- core relations وhistory relations المطلوبة.
- file object storage keys وSHA-256 وsize.
- Git commit/release ID وmigration head.
- known gaps.

الـmanifest يجب أن يبقى `restoreVerificationStatus: NOT_VERIFIED` قبل إكمال كل المراحل. أي `pitr` provider claim مرفوض حاليًا لأن hosting/provider choice غير معتمد في المشروع.

## Execution

### 1. Verify the manifest

```bash
pnpm exec tsx scripts/recovery/verify-recovery-manifest.ts \
  --manifest /secure/recovery/manifest.json
```

نجاح هذه الخطوة يعني أن العقد والـreferences مكتملة فقط؛ لا يعني أن restore حصل.

### 2. Restore into an isolated target

ينفذ Database/Platform Owner الاستعادة الفعلية عبر tooling الاستضافة المعتمد، مع تسجيل `restoreReference` في الـmanifest. لا يوجد provider أو PITR implementation داخل هذه الأدوات.

### 3. Validate the restored database

```bash
pnpm exec tsx scripts/recovery/validate-restored-database.ts \
  --manifest /secure/recovery/manifest.json \
  --database-url "$QC_RECOVERY_DATABASE_URL"
```

الأداة قراءة فقط داخل transaction وتتحقق من PostgreSQL version، `qc` schema، ledger والـchecksums، core relations، history relations، وmatching migration head. أي mismatch يفشل ولا يصلح ledger تلقائيًا.

### 4. Validate restored file objects

بعد ربط object storage المستعاد بمسار فحص معزول:

```bash
pnpm exec tsx scripts/recovery/validate-restored-files.ts \
  --manifest /secure/recovery/manifest.json \
  --object-root /secure/isolated-object-root
```

يتم فحص وجود كل object، حجمه، وSHA-256. فشل object أو hash يعني أن نطاق evidence المتأثر غير مستعاد بالكامل.

### 5. Application/security/business checks

بعد نجاح baseline فقط، شغّل نسخة التطبيق المطابقة للـGit/release المذكور في الـmanifest على isolated target، ثم سجّل evidence عن:

- readiness/health واتصال runtime المقصود.
- قراءة controlled records وaudit/history والعلاقات مع الملفات.
- authorization server-side ورفض الوصول خارج النطاق.
- عدم تسريب secrets أو provider details.
- بقاء session invalidation وإعادة الفتح خاضعة للسياسة.

هذه الخطوة ليست تنفيذًا تلقائيًا داخل validator؛ يجب ألا تُسجل `RESTORE VERIFIED` إلا بعد اكتمالها.

### 6. Run the provider-aware safe checklist

لجمع نتائج الفحوصات الآلية وبوابات المشغّل في تقرير واحد، شغّل:

```bash
pnpm recovery:checklist -- \
  --manifest /secure/recovery/manifest.json \
  --database-url "$QC_RECOVERY_DATABASE_URL" \
  --object-root /secure/isolated-object-root
```

الأمر يدعم سياق Render الحالي فقط، ويجري فحوصات قراءة فقط للـmanifest والهدف
المعزول والـobjects إذا زُوّد بالمسارات. بوابة physical/provider restore،
توافق التطبيق، authorization، sessions، ومراجعة الأسرار تظهر `BLOCKED` إلى أن
يرفق المشغّل دليلها الخارجي. لا ينفذ الأمر Render API أو restore أو migrations
ولا يغيّر أي سجل.

## Evidence record

سجّل Recovery Evidence Record منفصلًا عن logs، يتضمن Recovery ID، backup set، target، timestamps، release/Git SHA، migration result، object result، app/security/business results، gaps، ونتيجة drill. لا تعدّل manifest التاريخي لتجميل النتيجة؛ أرفق نتيجة validation أو أنشئ evidence record جديدًا وفق الصلاحية المعتمدة.

استخدم [`audit/100-percent/DR-EVIDENCE-MATRIX.md`](../../audit/100-percent/DR-EVIDENCE-MATRIX.md)
للتغطية، و[`audit/100-percent/RESTORE-DRILL-EVIDENCE-TEMPLATE.md`](../../audit/100-percent/RESTORE-DRILL-EVIDENCE-TEMPLATE.md)
كسجل مستقل لكل drill.

النتيجة المسموحة:

| Result | Meaning |
|---|---|
| `PASS` | الفحص المحدد لهذه المرحلة نجح فقط |
| `FAIL` | يوجد mismatch أو dependency failure؛ لا reopening |
| `UNVERIFIED` | المرحلة أو provider evidence غير موجودة |
| `BLOCKED` | الإجراء غير مسموح أو قرار provider/policy مفقود |

## PITR/provider status

Physical base backup، WAL archiving، PITR، provider snapshots، object replication، والمفاتيح تحتاج hosting/provider configuration معتمد. إلى أن يُحسم ذلك ويُنفذ drill حقيقي، يبقى:

```text
Provider PITR = BLOCKED
Production DR readiness = UNVERIFIED
Backup Created != Restore Verified
```

## Failure handling and cleanup

- أوقف الـdrill عند ledger mismatch أو missing/hash-mismatched evidence.
- لا تشغّل automatic migrations أو destructive retry بعد انقطاع العميل؛ افحص operation state أولًا.
- احفظ diagnostics الآمنة فقط، بدون SQL/credentials/hostnames الحساسة.
- اعزل أو أتلف هدف الـdrill حسب retention/security policy المعتمدة، وسجّل cleanup evidence.
- لا يعاد فتح Production بدون required validation، security posture، recovery evidence، وحالة reopen authority معتمدة.

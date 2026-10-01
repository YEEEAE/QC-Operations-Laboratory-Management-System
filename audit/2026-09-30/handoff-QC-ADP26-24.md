# QC-ADP26-24 — contentHash حر لا يثبت أصالة المصدر

**State: PARTIAL.** نُفّذ ربط بصمة النسخة بملفات المصدر على الخادم، وتحديثات المستندات وطلبات التغيير وواجهة إدارة قوالب الحجر. لا يُعد هذا الإغلاق النهائي لـQC-PAGE-F-024؛ يلزم دليل PostgreSQL 18 وقرار مالك القواعد المفتوحة وقبول الصفحة الفعلية.

## Changed

- حُذف `contentHash` من مدخلات إنشاء/تعديل النسخة وطلبات تغييرها؛ إدارة قوالب الحجر لا تقبل بصمة أو مرجع مصدر حرًا. لا يُستهلك أي hash يرسله المتصفح.
- النسخة الجديدة ترتبط بمعرّفات ملفات مسجلة على المستند. المستودع يعيد قراءة file SHA-256 وحالة الملف ورابط الدليل داخل المعاملة، ويشتق SHA-256 من `{schema, documentId, revision, files[]}` بترتيب ثابت.
- الإرسال والاعتماد يعيدان احتساب الربط من ملفات النسخة المقروءة من قاعدة البيانات، ويرفضان النسخة القديمة غير الموثقة، الملف غير النشط، البصمة الخاطئة، أو ملفًا/مراجعة/مستندًا لا يطابق الربط.
- تعديل المسودة يعيد اشتقاق البصمة، ويكتب التدقيق وoutbox مع تحديث CAS. روابط الملفات ثابتة منذ إنشاء المسودة.
- migration 0043 تضيف `source_binding_verified` وبيانات snapshot والاستخدام. سجل الاستخدام الجديد لا ينجح إلا لنسخة `EFFECTIVE` ذات binding متحقق وملفات نشطة، ويحفظ المراجعة والبصمة وmanifest في INSERT نفسه. سجلات الاستخدام القديمة تبقى `source_snapshot_verified=false` ولا تُعاد كتابتها أو ترقية hash قديم إلى دليل موثوق.
- صفحة النسخة تعرض اسم الملف وSHA، وصفحات الإنشاء/التعديل تستخدم POST baseline مع حفظ القيم غير السرية، وتصنيف للرفض/الخدمة غير المتاحة/النتيجة المجهولة أو stale، وحماية الإرسال المكرر في الواجهة. صفحة المراجعة توضّح أن `APPROVED` لا يجعل النسخة `EFFECTIVE`.
- صُحح خطأ صياغة كان يمنع تشغيل مولّد workspace map؛ أُعيد توليد الفهارس.

## Frozen candidate and tools

- **Requested audit HEAD:** `0b1bb21bb3b4eca77862dbba1da8623044e96355`. لم يكن HEAD في workspace؛ لم أنقل دليل التدقيق إليه تلقائيًا.
- **Workspace source HEAD / candidate SHA:** `edb3607fc4308ee7c9403df514b5e8328b103b64`; branch `main`. بدأ العمل بـstatus نظيف وdiff فارغ، والآن التغييرات المحلية موضحة بهذا handoff. لا commit/push/merge/deploy.
- **Dirty source fingerprint:** `47f9c3420cad42c0067e299d8e305030f65d3490735a35d0d6bce9776cf33bb3` (يشمل diff والملفات غير المتعقبة عدا ملف handoff هذا لتجنب مرجعية ذاتية؛ لا تغييرات مصدرية بعد حسابه).
- Node `v24.20.0` (مطابق لـ`.nvmrc`). `pnpm@11.25.0` هو الإصدار المثبت في manifest لكن لم يتوفر تشغيله: Corepack تعذر عليه إنشاء cache الافتراضي، ثم تعذر تنزيل النسخة المثبتة من npm بسبب DNS/الشبكة. لم أستخدم إصدارًا بديلًا.
- Astro `4.16.19`, Vitest `5.0.0`, TypeScript `6.0.3`; Docker CLI `29.7.2`. PostgreSQL target في fixture هو `postgres:18-alpine`.
- Release/build identity (محلي، dirty): release `rel-c5e7272478eafa6f`; artifact SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`; migration source head `0043_controlled_document_source_binding`, SHA-256 `bba7c163956c82fe0fa829828bfc0bab9e7b47c1895d197a04e5d82d802ef35c`. الملف المحلي: `dist/release-identity.json`.
- لم أكتب `.ci-results/build.json`: `run-context.json` الموجود يطابق مرشحًا آخر (`d8319aaa…`، schema head `0042`)؛ بدء run جديد سيستبدل الدليل الموجود. حفظت الملف ولم أخلط attestations بين المرشحين.

## Evidence

| Check | Result | Reference / limit |
|---|---|---|
| Server derives digest; browser input removed | PASS | `document-content-digest.ts`, document actions, template actions, change-field allowlist |
| Wrong digest, wrong revision/document, legacy-unverified binding, no/inactive file denied | PASS | `tests/unit/documents/document-content-digest.test.ts` |
| Document workflow, snapshot fields, and change-request field allowlist | PASS | Focused Vitest: 6 files, 21/21 passed |
| Role/state/fixture binding | PASS (unit fixture only) | `review.test.ts`: authorized reviewer in `IN_REVIEW` with both document/shared review+approval permissions; author/SoD denial control. Digest fixture binds `document-1` / revision `1` / one ACTIVE `file-1` with fixed 64-hex test SHA. No live account or DB fixture. |
| Approval stays `APPROVED`; no automatic effectivity | PASS | `document-state.ts`, review page, focused document review/repository tests |
| Production build | PASS | `astro build`; artifact and identity listed above |
| Astro diagnostics | PARTIAL | 1 remaining error in unrelated `src/pages/ai-advisory.astro:148` (`requestButton` nullable) |
| PostgreSQL 18 migration/integration, before/after row + audit/outbox, rollback, race and replay | BLOCKED | Three requested integration suites stopped before setup: no working container runtime / Docker daemon. 19 tests skipped. No DB was changed. Provider-applied schema NOT VERIFIED. |
| Migration 0043 snapshot immutability, new usage positive/negative and restrictive FK execution | BLOCKED | SQL and existing FK/append-only contracts reviewed; no PostgreSQL runtime available to execute them. Existing usage rows intentionally remain unverified. |
| Local browser route | BLOCKED | Built preview opened in the in-app browser; GET returned HTTP 503 `SERVICE_UNAVAILABLE` because required runtime configuration/database was absent. No authenticated fixture was available. Preview stopped afterward. |
| 320/375/768/1440 CSS px, 200%, keyboard/AT, authenticated HTTP/E2E, UAT | NOT VERIFIED | Route content could not render without runtime DB/config and an authorized test fixture. No UAT was signed or claimed. |
| Workspace map | PASS | `python3 scripts/diagnostics/generate-workspace-map.py`; PRODUCT 23, ENGINEERING 678, DATA 66, OPERATIONS 63, VERIFICATION 285, TOOLING 2001 files |

### Database transaction/read/write boundary

- **Reads:** document identity; active, unremoved `evidence_links` for that identity; `files` metadata (`sha256`, state, name, size); bound `document_version_files` during submit/approval/update; source `document_versions` and file links during usage snapshot INSERT.
- **Writes:** create version + immutable file links + audit event + outbox in one transaction; draft edit + recomputed digest + audit + outbox using row lock and expected version; submit/approve state/version + audit/outbox in the existing owner transaction; usage source columns and lab `document_snapshot` in the usage INSERT.
- **Constraints/locks:** unique `(document_id, revision)`; immutable file digest metadata; DRAFT-only append-only file links and FK `ON DELETE RESTRICT`; selected evidence/file rows locked during binding; binding flag and snapshot checks; version CAS/row locks; source-use triggers require verified effective source and active files; existing usage triggers reject UPDATE/DELETE/TRUNCATE. Source FK and linked file FK prevent deletion of bound history.
- **Failure boundary:** an error in the owning transaction must roll back row, audit, and outbox together. This property has not been exercised against PG18 for this candidate. File-download authorization/access and file retention/scanning behavior were not expanded or proved here; retention remains policy-dependent.
- **Redacted database before/after:** NOT AVAILABLE — PostgreSQL setup did not start, so no fixture row/audit/outbox existed to snapshot. No production or other shared database was queried or written.

## Route coverage

The shared source-contract change/build applies to these routes, but source review does not substitute for route/role/browser acceptance:

| Route | Source work | Actual route acceptance |
|---|---|---|
| `/documents` | No route change | NOT VERIFIED |
| `/documents/new` | No route change | NOT VERIFIED |
| `/documents/[documentId]` | No route change | NOT VERIFIED |
| `/documents/[documentId]/versions/new` | Registered source selection; no browser hash | BLOCKED (preview 503) |
| `/documents/[documentId]/versions/[versionId]` | Human file names, file digests, verified/unverified fingerprint display | BLOCKED (preview 503) |
| `/documents/[documentId]/versions/[versionId]/review` | Review shows bound evidence; explains approval/effectivity separation | BLOCKED (preview 503) |
| `/change-requests` | No route change | NOT VERIFIED |
| `/change-requests/new` | Only revision/change summary can be proposed | BLOCKED (preview 503) |
| `/change-requests/[changeRequestId]` | No route change | NOT VERIFIED |
| `/change-requests/[changeRequestId]/review` | No route change | NOT VERIFIED |
| `/documents/[documentId]/versions/[versionId]/edit` | No digest input; server recomputes; POST baseline and stale/error copy | BLOCKED (preview 503) |
| `/quarantine/admin` | Removed free-text digest/source claims | BLOCKED (preview 503) |
| `/quarantine/admin/[templateId]` | Removed free-text digest/source claims from revisions | BLOCKED (preview 503) |

## Findings and decisions

- **Closed in source:** `contentHash` supplied by a browser no longer controls a document revision digest or a change request. Source file IDs are resolved and bound by the server; approval checks the bound manifest. Quarantine template create/revise no longer accepts free-text digest or source-document claims.
- **Still open — SD-023 / PD-13:** Document Control/QMS must approve effectivity/effective-date policy. Until then, approval does not trigger `EFFECTIVE`; policy-dependent effective-date/supersede paths stay deny-by-default.
- **Still open — source/file authority:** approved-file status/ownership, scan/MIME acceptance, file access, and retention are not defined by this implementation. Registration as ACTIVE evidence is deliberately not labelled as “approved.” Resolve through the existing file/document policy owner; do not infer an approval from a hash.
- **Still open — evidence:** PG18 migration execution and checksum/application status, rollback, populated positive and refusal fixture with unchanged row/audit/outbox, concurrency/replay, authenticated browser at requested viewports, manual AT, and human UAT acceptance.

## State

**PARTIAL.** The implementation addresses the untrusted browser-hash path and adds server-bound usage snapshots, but final acceptance is blocked by PG18/runtime evidence and remains open for owner decisions and live route/AT/UAT evidence. Nothing was applied to production.

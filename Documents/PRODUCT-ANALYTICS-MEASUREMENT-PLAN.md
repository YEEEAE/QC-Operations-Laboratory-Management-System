# QC Operations & Laboratory Management System
## Privacy-Conscious Product Analytics Measurement Plan — v1.0

**Status:** DESIGN SPECIFICATION — PARTIAL INTERNAL IMPLEMENTATION  
**Product:** QC Operations & Laboratory Management System  
**Audience:** Product, UX, Quality, Security, Operations  
**Timezone:** `Asia/Riyadh`

## 1. Purpose and boundary

هذا المستند يعرّف وش نحتاج نقيسه عشان نفهم استخدام المنتج ونحسّن UX، بدون تحويل التحليلات إلى مصدر حقيقة تشغيلية أو تنظيمية.

القياس هنا يصف:

- أسئلة UX والقرارات اللي ممكن يدعمها القياس.
- Events وattributes محدودة ومصنّفة حسب الخصوصية.
- فصل Product Analytics عن Business Audit Trail وSecurity Logging وOperational Observability.
- متطلبات الاحتفاظ والحذف قبل اختيار مزود أو تنفيذ SDK.

**الحالة الحالية:** فحص المستودع وجد OpenTelemetry dependency ومواصفة Observability، وما فيه مزود خارجي أو dashboard Product Analytics. تم تنفيذ hand-off داخلي اختياري عبر outbox لقياسات البحث فقط (`search.submitted` و`search.zero_result` و`form.validation_failed`)؛ بقية القياسات **غير منفذة حاليًا**، ولا توجد بيانات حالية نقدر نستنتج منها أداء أو سلوك المستخدمين.

## 2. Privacy principles

1. **Data minimization:** نسجل أقل معلومة تكفي للإجابة على السؤال.
2. **Aggregate by default:** نستخدم route template/domain/operation والفئات المحدودة، مو user ID أو record ID كأبعاد metric.
3. **No content capture:** ما نسجل كلمات البحث، نصوص النماذج، ملاحظات QC، وصف NCR/CAPA/RCA، نتائج المختبر، محتوى المستندات، الملفات، prompts أو responses.
4. **No credential capture:** ممنوع كلمات المرور، الأسرار، provider credentials، tokens، cookies، authorization headers، أو قيم الحقول الحساسة.
5. **Server-authoritative outcomes:** event نجاح mutation لا ينطلق من click؛ ينطلق بعد response/قرار الخادم، ومع ذلك لا يحل محل Audit.
6. **Review-aware:** مدة المراجعة تقاس لفهم العوائق، مو لفرض سرعة قد تضر deliberate review أو SoD أو التحقق العلمي.
7. **Policy before retention:** مدد الاحتفاظ الدقيقة تحتاج قرار Security/Operations/Compliance؛ ما نختلق 30/90/365 يوم.

### تصنيف الخصوصية

| التصنيف | المعنى | أمثلة مسموحة |
|---|---|---|
| `P0` | بيانات تجميعية غير شخصية | route template، domain، status class، device class |
| `P1` | سياق جلسة قصير العمر بدون هوية مباشرة | random session-scoped correlation key، sequence داخل session، لا يُربط بحساب |
| `P2` | معرّف تقني مبرر ومقيد الوصول | `requestId`/`traceId` في observability فقط؛ ليس Product Analytics dimension |
| `P3` | بيانات شخصية/محتوى/سرية | user ID، email، record ID، search text، form values، QC content، credentials — ممنوعة افتراضيًا |

## 3. Measurement plan

كل event أدناه **تصميم فقط**. `Event` اسم canonical مقترح، وليس دليلًا أنه موجود في النظام.

| Question | Metric | Event | Required attributes | Privacy classification | Retention requirement | Decision enabled |
|---|---|---|---|---|---|---|
| وين يروح المستخدمون أولًا، وهل بنية التنقل مفهومة؟ | navigation destination rate، backtrack rate، dead-end rate | `navigation.viewed`، `navigation.destination_selected` | `route_template`، `source_route_template`، `destination_group`، `input_method`، `outcome` | `P0` | أقصر مدة تحقق تكفي للمقارنة؛ المدة الدقيقة pending policy | ترتيب المجموعات، labels، breadcrumbs، والروابط التالية بدون كشف صفحات حساسة |
| هل البحث يوصل لنتيجة قابلة للاستخدام؟ | search success rate، result-open rate، time-to-first-result | `search.submitted`، `search.result_opened`، `search.session_resolved` | `search_surface`، `query_length_bucket`، `result_count_bucket`، `resolution`، `duration_bucket` | `P0` | aggregate-only؛ احذف raw query دائمًا؛ exact period pending policy | تحسين filters، ranking، result labels، ومسار التعافي |
| وين تظهر عمليات البحث صفر نتائج؟ | zero-result rate، repeated-zero rate | `search.zero_result` | `search_surface`، `filter_count_bucket`، `query_length_bucket`، `suggestion_shown`، `suggestion_used` | `P0` | يكفي trend مجمع؛ exact period pending policy | synonyms/labels/empty state؛ لا نستخدمها لاستخراج محتوى بحثي |
| وش أسباب فشل التحقق في النماذج؟ | validation failure rate، fields-failed bucket، recovery rate | `form.validation_failed`، `form.validation_recovered` | `form_key`، `field_group`، `error_family`، `attempt_index_bucket`، `recovery_outcome` | `P0` | لا تحفظ القيم أو الرسائل الحرة؛ period pending policy | تحسين labels، inline errors، error summary، وترتيب الحقول |
| هل يكتمل النموذج؟ | completion rate، valid-submit rate، server-accepted rate | `form.started`، `form.submitted`، `form.accepted` | `form_key`، `workflow_family`، `submit_outcome`، `duration_bucket`، `input_method` | `P0` | session-level aggregate فقط؛ exact period pending policy | إزالة الاحتكاك غير التنظيمي، مع إبقاء required review والـSoD |
| متى ولماذا يترك المستخدم النموذج؟ | abandonment rate، last-step distribution | `form.abandoned` | `form_key`، `last_step_bucket`، `time_bucket`، `navigation_exit_type` | `P0` | لا تحفظ session replay أو field content؛ period pending policy | تحسين save draft، التحذير من فقدان البيانات، أو شرح المتطلبات |
| هل إعادة الإرسال ناتجة عن غموض أو بطء؟ | repeated-submit rate، duplicate-prevented rate | `mutation.submit_attempted`، `mutation.duplicate_prevented`، `mutation.accepted` | `operation`، `route_template`، `attempt_count_bucket`، `outcome`، `latency_bucket` | `P0` | aggregate-only؛ لا تسجل payload أو idempotency key؛ period pending policy | تحسين feedback/loading/idempotency UX، لا تجاوز controls |
| كم تستغرق خطوات workflow فعليًا؟ | server duration، user elapsed duration، review dwell time | `workflow.step_started`، `workflow.step_completed` | `workflow_family`، `step_key`، `state_before`، `state_after`، `duration_bucket`، `completion_outcome` | `P0` | state labels تكون allowlisted؛ exact period pending policy | كشف bottlenecks. لا تستخدم metric لفرض سرعة approval/review |
| هل يتعافى المستخدم بعد الخطأ؟ | recovery rate، retry success rate، time-to-recovery | `error.presented`، `error.recovery_started`، `error.recovered` | `error_family`، `error_code_family`، `recovery_action`، `request_reference_present`، `outcome` | `P0` (`requestId` يبقى P2 في observability) | لا تحفظ stack trace أو content في analytics؛ period pending policy | تحسين رسائل الخطأ، retry، support reference، ومسارات الرجوع |
| أي features تُستخدم بما يكفي لتستحق الاستثمار؟ | eligible-active usage، feature completion، repeat use | `feature.entered`، `feature.completed` | `feature_key`، `domain`، `route_template`، `outcome`، `device_class` | `P0` | لا تخلطها مع business record counts؛ period pending policy | ترتيب backlog وتبسيط feature منخفضة الاستخدام بعد التحقق النوعي |
| هل توجد مشاكل responsive حقيقية؟ | overflow rate، reflow failure rate، mobile task completion | `responsive.issue_detected`، `responsive.task_completed` | `route_template`، `viewport_bucket`، `orientation`، `issue_family`، `input_method`، `outcome` | `P0` | لا تسجل screenshot أو page content؛ period pending policy | إصلاح reflow، tables، focus، touch targets، وmobile density |
| هل الأداء يعيق العمل؟ | p75/p95 route latency، LCP/INP/CLS، error rate، long-task rate | `performance.page_timing`، `performance.action_timing` | `route_template`، `resource_class`، `device_class`، `connection_class`، `metric_name`، `metric_bucket`، `status_class` | `P0` | ينسجم مع Observability retention؛ exact period pending policy | تحسين server/query/client cost بدون تقليل deliberate review أو validation |

### تعريفات حارسة للقياسات

- **Search success** لا يعني مجرد click؛ النجاح يحتاج نتيجة مفتوحة أو resolution صريحة، ويُعرض مع denominator واضح.
- **Form completion** لا يعني mutation accepted؛ نفصل started/submitted/server-accepted ونحترم رفض الخادم.
- **Workflow duration** يقسم server latency عن وقت المستخدم، ويستبعد فترات background غير المنسوبة للمستخدم حيث أمكن.
- **Abandonment** ما ينحسب بعد إغلاق تبويب فقط كحقيقة؛ يستخدم timeout/window معروض في التقرير، ويُوسم كتقدير.
- **Responsive issue** لا يُستنتج من viewport وحده؛ يحتاج detector موثوق أو task evidence.
- لا نعرض metric إذا فشل provider أو نقص denominator؛ نعرض `unavailable` بدل صفر مضلل.

## 4. Event contract

إذا تقرر التنفيذ لاحقًا، كل event Product Analytics يلتزم بهذا الشكل المحدود:

```ts
type ProductAnalyticsEvent = {
  name: string;                 // allowlisted canonical name
  occurredAt: string;           // server time where outcome matters
  environment: 'test' | 'staging' | 'production';
  routeTemplate?: string;       // never raw dynamic URL
  domain?: string;
  operation?: string;           // bounded allowlist
  outcome?: 'started' | 'completed' | 'failed' | 'abandoned' | 'unavailable';
  attributes: Record<string, string | number | boolean>;
};
```

Guardrails:

- allowlist للأسماء والـattributes؛ unknown event/attribute = deny/drop.
- كل bucket محدود cardinality؛ ممنوع `userId`/`recordId`/`sampleId`/`query` كـlabels.
- أحداث browser لا تحمل raw form values أو controlled content.
- الأحداث المرتبطة بـcontrolled actions تقيس UX outcome فقط؛ الـofficial state وaudit يجيان من use case الخادمي.
- retries والـoutbox تكون idempotent وموسومة بدون إعادة business mutation.
- أي provider export لازم يمر redaction قبل الإرسال، مع kill switch وتعطيل افتراضي في بيئات التطوير.

## 5. Four systems — separate and non-interchangeable

| System | يجاوب عن | أمثلة | ما لا يثبت |
|---|---|---|---|
| **Business audit trail** | وش التغيير التجاري الرسمي؟ | approval، release، void، correction، e-signature، permission change مع actor/time/reason | لا يثبت UX popularity أو performance |
| **Security logging** | هل صار حدث أمني أو محاولة مرفوضة؟ | login failure، authorization denial، CSRF، IDOR، session revocation | لا يثبت أن المستخدم أكمل workflow، ولا يحل محل audit |
| **Operational observability** | هل النظام صحي وأين التعطل؟ | traces، metrics، structured logs، health/readiness، DB/outbox latency | لا يثبت قبول business action أو official PASS/FAIL |
| **Product analytics** | كيف يستخدم الناس الواجهة وأين يتعثرون؟ | navigation، search outcome، form recovery، feature usage، responsive/performance UX | لا يثبت الحقيقة التجارية أو الصلاحية أو التفويض |

`requestId` و`traceId` تبقى correlation في observability/security عند الحاجة؛ ما تُستخدم كهوية مستخدم أو dimension في Product Analytics.

## 6. Retention and access policy

الاحتفاظ الدقيق لكل فئة **قرار pending** من Security/Operations/Compliance. إلى أن يعتمد القرار:

- لا ننفذ collection دائم أو third-party export.
- نحدد لكل event purpose وowner وretention class قبل التشغيل.
- نحذف/نجهّل event بعد انتهاء الغرض، مع منع نسخ raw content احتياطيًا في analytics.
- access يكون least privilege، read-only للتقارير، ومفصولًا عن الوصول إلى QC Audit والـcontrolled content.
- test/staging telemetry منفصلة عن production ولا تستخدم بيانات إنتاج حقيقية.
- أي طلب ربط identifier بحساب أو سجل يحتاج justification موثق وموافقة مالك الخصوصية/الأمن.

## 7. Implementation status and acceptance gates

**Implementation: PARTIAL.** عقد الحدث وsanitization وoutbox hand-off وقياسات البحث موجودة؛ ما فيه حاليًا exporter/collector خارجي أو dashboard Product Analytics، وبقية الأسطح غير موصولة.

قبل توسيع التنفيذ أو تصدير الأحداث لازم تتوفر الأدلة التالية:

1. اعتماد owner وpurpose وretention class لكل event.
2. اعتماد مزود/مكان تخزين متوافق مع Security وCompliance، أو قرار إبقاء القياس داخليًا.
3. adapter مستقل عن Domain/Application وAstro pages، مع redaction واختبارات forbidden fields.
4. اختبارات تثبت عدم إرسال password/secret/raw QC content/controlled-document content/private identifiers.
5. اختبارات denominator، unavailable state، duplicate prevention، وserver-authoritative outcome.
6. تقرير dashboard يبيّن sample/coverage ويفصل analytics عن audit/security/observability.
7. مراجعة UX/accessibility: الفشل يعرض recovery path وinline/error summary؛ ما نقيس النقر فقط إذا كان القرار يحتاج deliberate review.

## 8. Open decisions

- سياسة الاحتفاظ الدقيقة لكل من Product Analytics وSecurity وObservability.
- مالك الخصوصية ومالك البيانات ومسار الموافقة على أي P2/P3 use case.
- هل يلزم opt-out أو notice داخل التطبيق، حسب سياسة المؤسسة والبيئة النظامية.
- تعريف baseline وthreshold للأداء حسب SLOs المعتمدة؛ لا تُخترع أرقام من هذا المستند.
- قائمة `feature_key` و`operation` و`error_family` المعتمدة، مع versioning للعقد.

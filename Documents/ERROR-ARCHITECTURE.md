# ERROR-ARCHITECTURE.md

# QC Operations & Laboratory Management System
## Error Architecture Specification — v1.0

**Document Path:** `Documents/ERROR-ARCHITECTURE.md`  
**Status:** FOUNDATION — APPROVED ERROR ARCHITECTURE BASELINE  
**Product:** QC Operations & Laboratory Management System  
**Architecture:** Modular Monolith  
**Web Framework:** Astro  
**Primary Internal Error Model:** Canonical `AppError`  
**Astro Action Boundary:** `ActionError` adapter  
**HTTP API Boundary:** RFC 9457 Problem Details (`application/problem+json`)  
**Request Correlation:** `requestId`  
**Security Rule:** No raw infrastructure/database/internal exception leakage  

---

# 1. Purpose

هذه الوثيقة تحدد كيف يتم تمثيل الأخطاء، تصنيفها، تحويلها، تسجيلها، عرضها للمستخدم، وربطها بالـrequest/audit/security evidence داخل النظام.

الهدف أن لا يصبح كل Domain أو Astro Action أو PostgreSQL repository عنده طريقة مختلفة للأخطاء.

الـError Architecture يجب أن تحقق:

- Stable machine-readable error contracts.
- Safe user-visible feedback.
- Framework independence داخل Domain/Application.
- Correct Astro Action mapping.
- Correct HTTP/API mapping.
- Consistent PostgreSQL error translation.
- Explicit retry semantics.
- Field-level validation support.
- Concurrency/stale-version handling.
- IDOR-safe responses.
- Request correlation.
- Clear separation بين errors وQC Audit وSecurity Logging.
- Testable recovery behavior.

---

# 2. Authority Chain

```text
SYSTEM-INVARIANTS.md
        ↓
QC-SYSTEM-DESIGN-CONSTITUTION.md
        ↓
DOMAIN-MAP.md
        ↓
BUSINESS-RULES.md
        ↓
ROLE-MATRIX.md
        ↓
PERMISSION-MATRIX.md
        ↓
STATE-MACHINES.md
        ↓
DATA-MODEL.md
        ↓
DATA-DICTIONARY.md
        ↓
REQUIREMENTS-TRACEABILITY.md
        ↓
ARCHITECTURE-SPECIFICATION.md
        ↓
SECURITY-ARCHITECTURE.md
        ↓
DATABASE-ARCHITECTURE.md
        ↓
ERROR-ARCHITECTURE.md
```

Error handling لا يغير Business Rules أو Permission policy أو State Machine.

---

# 3. Core Principle

> **The Domain decides what failed. The Error Architecture decides how that failure is represented safely across boundaries.**

Framework error types لا تصبح Domain Truth.

Astro يعرف كيف يعرض/يرجع الخطأ.

Domain/Application يعرف معنى الخطأ.

---

# 4. Hybrid Error Architecture

المعتمد:

```text
Domain / Application
        ↓
Canonical AppError
        ↓
Error Mapping Layer
   ┌────┴──────────────┐
   ↓                   ↓
Astro Action         HTTP API
ActionError          RFC 9457 Problem Details
   ↓                   ↓
UI Feedback          API Client
```

هذا يمنع ربط الـDomain مباشرة بـAstro أو HTTP.

---

# 5. Error Ownership by Layer

## Domain

يعرف errors المتعلقة بـ:

```text
Business rule violation
Invalid state transition
Controlled precondition failure
Scientific/business rule failure
Signature requirement
Approval/release preconditions
```

## Application

يعرف errors المتعلقة بـ:

```text
Authorization orchestration
Scope/SoD outcome
Use-case conflict
Expected version
Idempotency
Cross-domain orchestration
```

## Infrastructure

يعرف raw failures من:

```text
PostgreSQL
Object Storage
External integrations
Email
AI provider
Filesystem/process/network
```

لكنه يجب أن يترجمها إلى canonical application/infrastructure errors قبل عبور boundary.

## Delivery

Astro Action/API/UI مسؤول عن presentation/transport mapping فقط.

---

# 6. Canonical Error Families

المعتمد:

```text
AUTH_*
AUTHZ_*
VALIDATION_*
DOMAIN_*
CONFLICT_*
RESOURCE_*
SYSTEM_*
```

يمكن إضافة family جديدة فقط إذا لم تكن semantics قابلة للتمثيل بوضوح ضمن القائمة الحالية.

---

# 7. Authentication Errors

Prefix:

```text
AUTH_*
```

Examples:

```text
AUTH_REQUIRED
AUTH_INVALID_CREDENTIALS
AUTH_SESSION_EXPIRED
AUTH_SESSION_REVOKED
AUTH_ACCOUNT_DISABLED
AUTH_REAUTH_REQUIRED
```

الـexact user-visible message يمكن أن يكون أكثر عمومية لمنع account enumeration.

---

# 8. Authorization Errors

Prefix:

```text
AUTHZ_*
```

Examples:

```text
AUTHZ_DENIED
AUTHZ_SCOPE_DENIED
AUTHZ_SOD_VIOLATION
AUTHZ_PERMISSION_MISSING
AUTHZ_OPERATION_NOT_ALLOWED
```

وجود error code داخلي لا يعني أنه يجب كشف exact authorization reason للمستخدم النهائي.

---

# 9. Validation Errors

Prefix:

```text
VALIDATION_*
```

Examples:

```text
VALIDATION_FAILED
VALIDATION_REQUIRED
VALIDATION_INVALID_FORMAT
VALIDATION_OUT_OF_RANGE
VALIDATION_UNKNOWN_FIELD
```

Field-level details تستخدم structured field errors ولا تعتمد على parsing message text.

---

# 10. Domain Errors

Prefix:

```text
DOMAIN_*
```

Examples:

```text
DOMAIN_INVALID_TRANSITION
DOMAIN_PRECONDITION_FAILED
DOMAIN_SIGNATURE_REQUIRED
DOMAIN_APPROVAL_REQUIRED
DOMAIN_RELEASE_NOT_ALLOWED
DOMAIN_CONTROLLED_RECORD_IMMUTABLE
DOMAIN_SOURCE_REQUIRED
```

لا يتم اختراع error code يعكس Policy غير معتمدة.

---

# 11. Conflict Errors

Prefix:

```text
CONFLICT_*
```

Examples:

```text
CONFLICT_STALE_VERSION
CONFLICT_DUPLICATE
CONFLICT_ALREADY_PROCESSED
CONFLICT_IDEMPOTENCY_KEY_REUSED
CONFLICT_SERIALIZATION_RETRY_REQUIRED
CONFLICT_LOCK_TIMEOUT
```

---

# 12. Resource Errors

Prefix:

```text
RESOURCE_*
```

Examples:

```text
RESOURCE_NOT_FOUND
RESOURCE_UNAVAILABLE
RESOURCE_FILE_NOT_FOUND
RESOURCE_DEPENDENCY_NOT_READY
```

لكن security mapping قد intentionally تخفي الفرق بين unauthorized وnot-found.

---

# 13. System Errors

Prefix:

```text
SYSTEM_*
```

Examples:

```text
SYSTEM_INTERNAL_ERROR
SYSTEM_DATABASE_UNAVAILABLE
SYSTEM_STORAGE_UNAVAILABLE
SYSTEM_EXTERNAL_SERVICE_UNAVAILABLE
SYSTEM_TIMEOUT
SYSTEM_CONFIGURATION_ERROR
```

هذه لا تكشف implementation details للمستخدم.

---

# 14. Stable Error Code Rule

كل canonical error code يجب أن يكون:

```text
Stable
Machine-readable
Uppercase snake-case
Non-localized
Semantically specific
```

ممنوع أن يعتمد client على exact English/Arabic message text.

---

# 15. Error Code Lifecycle

بعد استخدام code في production/API/client contract:

- لا يتم تغيير معناه بصمت.
- لا يعاد استخدامه لمعنى مختلف.
- Deprecation تكون موثقة.
- Replacement code يضاف بوضوح عند الحاجة.

---

# 16. Canonical AppError

Conceptual contract:

```text
AppError {
  code
  category
  userSafe
  retryability
  messageKey?
  fieldErrors?
  safeMetadata?
  cause?          // server-only
}
```

Exact TypeScript shape ينفذ لاحقًا.

---

# 17. `code`

`code` هو identifier ثابت مثل:

```text
CONFLICT_STALE_VERSION
```

وهو أهم field للـmachine behavior.

---

# 18. `category`

Category تستخدم للتصنيف العام:

```text
AUTHENTICATION
AUTHORIZATION
VALIDATION
DOMAIN
CONFLICT
RESOURCE
SYSTEM
```

ولا تستبدل error code.

---

# 19. `userSafe`

يشير إلى أن الرسالة/metadata المصاحبة يمكن إرسالها للعميل بعد mapping المناسب.

وجود `userSafe=true` لا يسمح بإرسال stack/cause/internal metadata.

---

# 20. `messageKey`

يفضل أن تكون user-facing messages قابلة للترجمة عبر key ثابت مثل:

```text
errors.staleVersion
errors.permissionDenied
errors.validationFailed
```

ولا يصبح النص نفسه contract.

---

# 21. `cause`

`cause` server-only.

يمكن أن يحتوي exception الأصلية لأغراض diagnostics.

ممنوع serialize `cause` إلى client response.

---

# 22. Safe Metadata

`safeMetadata` يمكن أن تحمل فقط data مثبت أنها غير حساسة ومطلوبة للتعافي.

Examples:

```text
retryAfterSeconds
currentVersion where safe
fieldName
allowedRecoveryAction
```

ممنوع وضع:

```text
SQL
DB host
constraint internals
filesystem path
secret
session token
raw provider response
```

---

# 23. Expected Errors

Expected errors هي outcomes معروفة من use case.

Examples:

```text
Validation failure
Permission denied
Invalid transition
Stale version
Not found
Duplicate command
Signature required
```

هذه لا تعامل تلقائيًا كـsystem crash.

---

# 24. Unexpected Errors

Unexpected errors تشمل:

```text
Programming bug
Unhandled exception
Unknown provider failure
Unexpected database error
Invariant impossible under current design
```

Client mapping الافتراضي:

```text
SYSTEM_INTERNAL_ERROR
```

مع requestId.

---

# 25. Unexpected Error Principle

> **Fail safely outward; diagnose richly inward.**

UI/API تحصل على safe response.

Server logs تحصل على diagnostic context بعد redaction.

---

# 26. Astro Independence

`src/modules/**/domain` و`application` لا تستورد:

```text
astro:actions
ActionError
AstroError
```

Astro-specific mapping يبقى في Delivery/shared error adapter.

---

# 27. Astro Action Mapping

Canonical flow:

```text
Use Case
  ↓
AppError
  ↓
mapAppErrorToActionError()
  ↓
Astro ActionError
```

---

# 28. Astro Action Status Mapping

Baseline conceptual mapping:

```text
AUTH_*                   → UNAUTHORIZED / appropriate auth code
AUTHZ_*                  → FORBIDDEN or safe NOT_FOUND mapping
VALIDATION_*             → BAD_REQUEST or validation flow
DOMAIN_INVALID_*         → BAD_REQUEST / CONFLICT depending semantics
CONFLICT_*               → CONFLICT
RESOURCE_NOT_FOUND       → NOT_FOUND
SYSTEM_*                 → INTERNAL_SERVER_ERROR / service equivalent
```

Exact ActionError code يتم اختياره حسب semantics الفعلية.

---

# 29. Astro Input Validation

Transport/schema validation failures من Astro Action يجب أن تتحول إلى نفس canonical validation UX contract حيث نحتاج consistent UI.

Framework-specific validation structure لا تنتشر داخل Domain.

---

# 30. HTTP API Error Standard

Independent API endpoints تستخدم:

```text
Content-Type: application/problem+json
```

وفق RFC 9457 Problem Details.

---

# 31. Problem Details Baseline

Response يمكن أن يحتوي:

```text
type
title
status
detail
instance
```

ومع extension members آمنة مثل:

```text
code
requestId
fieldErrors
retryable
```

---

# 32. Problem `type`

`type` يجب أن يكون stable identifier للنوع، وليس URL عشوائي generated لكل request.

مثال conceptual:

```text
/problems/stale-version
```

Exact public URI strategy تحسم عند API implementation.

---

# 33. Problem `title`

`title` وصف قصير وآمن لنوع المشكلة.

لا يحتوي data سرية أو dynamic debug details.

---

# 34. Problem `detail`

`detail` user/client-facing explanation لهذا occurrence.

قد يختلف حسب locale/client، لكن لا يحمل internals.

---

# 35. Problem `instance`

يمكن استخدامه لreference occurrence/route إذا مناسب.

لا يوضع فيه secret أو internal file path.

---

# 36. Problem Extension `code`

Canonical AppError code يضاف كـextension:

```json
{
  "code": "CONFLICT_STALE_VERSION"
}
```

ليكون contract stable للclients.

---

# 37. HTTP Status Mapping

Baseline:

| Scenario | HTTP |
|---|---:|
| Authentication required/invalid | 401 |
| Authenticated but denied | 403 |
| Resource hidden/not found | 404 |
| Malformed request | 400 |
| Semantic validation | 422 |
| State/version/idempotency conflict | 409 |
| Rate limit | 429 |
| Unexpected application failure | 500 |
| Required dependency unavailable | 503 |

Security Architecture قد تفرض safe `404` بدل `403` لبعض object lookups.

---

# 38. 400 vs 422

Use:

```text
400
```

للـmalformed/transport-invalid request.

Use:

```text
422
```

للـwell-formed input الذي يفشل semantic validation عندما API contract يستفيد من هذا الفرق.

Astro Actions لا يلزم أن تطابق HTTP semantics حرفيًا إذا framework abstraction مختلفة، لكن canonical error code يبقى نفسه.

---

# 39. 409 Conflict

`409` يستخدم خصوصًا لـ:

```text
Stale version
Duplicate controlled command
Already processed
Current state changed
Idempotency conflict
```

ولا يستخدم كـgeneric replacement لكل validation error.

---

# 40. IDOR-Safe Mapping

لـobject access:

```text
Unauthorized existence-sensitive resource
```

قد يتم mapping إلى:

```text
RESOURCE_NOT_FOUND / 404
```

لمنع existence leakage.

القرار يتم وفق Security Architecture ولا يعتمد على UI convenience.

---

# 41. Authentication Enumeration Safety

`AUTH_INVALID_CREDENTIALS` وunknown account يمكن أن يظهرا نفس user-facing message.

Internal logs/code يمكن أن يكون أكثر تحديدًا إذا آمن ومفيد.

---

# 42. Field Error Contract

Validation failure يجب أن يدعم structured field errors.

Conceptual:

```text
fieldErrors = {
  quantity: ["REQUIRED"],
  lotNumber: ["INVALID_FORMAT"]
}
```

Exact representation تنفذ لاحقًا.

---

# 43. Field Error Code Rule

Field error code:

- Stable.
- Non-localized.
- Does not embed value.
- Maps to UI message/translation.

---

# 44. Validation Summary

Form يمكن أن يعرض:

- Inline field error.
- Page/form error summary.
- Focus first invalid field.

لكن accessibility behavior يثبت بالتفصيل في UI/UX/Design System docs.

---

# 45. Domain Validation vs Transport Validation

Transport validation:

```text
Type
Shape
Required input format
Unknown fields
```

Domain validation:

```text
Business validity
State validity
Controlled requirements
Scientific/business source constraints
```

لا يتم دمج الاثنين في generic `INVALID_INPUT` لكل الحالات.

---

# 46. PostgreSQL Error Boundary

Raw `pg`/PostgreSQL error لا يعبر Infrastructure layer.

Flow:

```text
PostgreSQL Error
      ↓
Infrastructure Error Translator
      ↓
Canonical AppError / retry signal
```

---

# 47. SQLSTATE Handling

Infrastructure يمكن أن يعتمد على PostgreSQL SQLSTATE internally للترجمة.

لكن SQLSTATE لا يظهر user-facing بشكل افتراضي.

---

# 48. Unique Violation

PostgreSQL unique violation:

```text
23505
```

يترجم حسب constraint/use case إلى code مثل:

```text
CONFLICT_DUPLICATE
```

أو domain-specific canonical conflict إذا موجود.

ممنوع عرض constraint name مباشرة للمستخدم.

---

# 49. Foreign Key Violation

FK violation يمكن أن يعني:

- Invalid reference.
- Race where parent disappeared.
- Programming/invariant error.

الترجمة تعتمد على use case، ولا يتم تلقائيًا عرض `foreign key violation` للمستخدم.

---

# 50. Check Constraint Violation

CHECK violation قد تكون:

- Defensive DB rejection of invalid application data.
- Unexpected programming bug إذا application/domain كان يجب أن يمنعه.

Mapping يعتمد على contract والcontext.

---

# 51. Serialization Failure

Serialization failure:

- يمكن retry داخليًا إذا transaction مصممة لذلك.
- بعد استنفاد bounded retry تصبح conflict/system response مناسب.
- لا يتم retry external side effects بصورة غير idempotent.

---

# 52. Deadlock

Deadlock:

- يسجل diagnostics.
- يمكن bounded retry إذا safe.
- استمرار deadlock patterns يعتبر defect يحتاج تحليل lock ordering.

---

# 53. Lock Timeout

Lock timeout يتحول إلى controlled conflict/system response مناسب ولا يعرض SQL internals.

مثال code:

```text
CONFLICT_LOCK_TIMEOUT
```

إذا recovery هو retry لاحقًا.

---

# 54. Database Unavailable

Connection/pool/database unavailable:

```text
SYSTEM_DATABASE_UNAVAILABLE
```

User-facing message عامة.

Logs تحتوي diagnostics الآمنة.

---

# 55. Stale Version

First-class error:

```text
CONFLICT_STALE_VERSION
```

يستخدم عندما:

```text
expectedVersion != currentVersion
```

للـconcurrency-sensitive record.

---

# 56. Stale Version UX

Recovery:

```text
Stop mutation
Refresh/reload authoritative record
Show that record changed
Require user to review before retry
```

ممنوع silent overwrite.

---

# 57. Current Version Disclosure

إرسال `currentVersion` للعميل مسموح فقط إذا العميل مصرح له بالسجل وكانت المعلومة مفيدة وآمنة.

لا يتم كشف record existence عبر version metadata.

---

# 58. Invalid State Transition

Code:

```text
DOMAIN_INVALID_TRANSITION
```

يعني أن requested intent لا يسمح به state machine الحالي.

Recovery غالبًا:

```text
Refresh state
Show current status
Present valid next actions
```

---

# 59. Separation of Duties Failure

Code داخلي:

```text
AUTHZ_SOD_VIOLATION
```

User-facing explanation تكون آمنة ولا تكشف sensitive policy internals أكثر من اللازم.

Security event logging يعتمد على context.

---

# 60. Signature Required

Code:

```text
DOMAIN_SIGNATURE_REQUIRED
```

Recovery:

```text
Start approved reauthentication/e-signature ceremony
```

ولا يتم bypass تلقائيًا.

---

# 61. Reauthentication Required

Code:

```text
AUTH_REAUTH_REQUIRED
```

يختلف عن:

```text
AUTH_REQUIRED
```

لأن user قد يكون authenticated لكن security freshness غير كافية للعملية الحساسة.

---

# 62. Session Expired

Code:

```text
AUTH_SESSION_EXPIRED
```

Recovery:

```text
Sign in again
```

مع حماية draft UX حسب تصميم forms لاحقًا.

---

# 63. Retryability Model

كل canonical error يملك semantics واضحة:

```text
NEVER
AFTER_USER_CHANGE
AFTER_REFRESH
AFTER_REAUTH
AFTER_DELAY
INTERNAL_RETRY_ONLY
UNKNOWN
```

Exact TypeScript representation لاحقًا.

---

# 64. Retryability Examples

```text
VALIDATION_FAILED
→ AFTER_USER_CHANGE

CONFLICT_STALE_VERSION
→ AFTER_REFRESH

AUTH_REAUTH_REQUIRED
→ AFTER_REAUTH

RATE_LIMITED
→ AFTER_DELAY

SERIALIZATION_FAILURE
→ INTERNAL_RETRY_ONLY when safe

AUTHZ_DENIED
→ NEVER unless authorization state changes
```

---

# 65. Automatic Retry Rule

Automatic retry يستخدم فقط إذا operation:

- Idempotent أو protected by idempotency.
- Retry-safe.
- No external irreversible side effect duplicated.
- Error classified as retryable internally.

---

# 66. No Blind Retry on Controlled Actions

ممنوع blind retry لـ:

```text
Approval
Release
E-Signature
Void
Close
Permission changes
Restore
```

بدون idempotency/current-state/version guarantees.

---

# 67. Request ID

كل inbound request مهم يحصل على:

```text
requestId
```

ويستخدم في error correlation.

---

# 68. User Reference

Unexpected/support-relevant error يعرض reference آمن مثل:

```text
Reference: <requestId>
```

بدون stack trace.

---

# 69. Request Correlation

`requestId` يربط حسب applicability:

```text
Delivery response
Application log
Security log
Audit event
Database operation context
Outbox metadata
External integration log
```

---

# 70. Error Logging Rule

Expected error لا يعني دائمًا log level ERROR.

Examples:

```text
Validation failure → debug/info or no diagnostic log
Expected authorization denial → security/info/warn حسب context
Stale version → info/debug
Unexpected exception → error
Database unavailable → error
```

Exact logging levels تحسم في Observability Architecture.

---

# 71. Never Log from Error Context

ممنوع تسجيل:

```text
Password
Session token
Reset token
API key
DB password
Authorization header
Sensitive cookie
Private signing material
```

حتى عند exception.

---

# 72. Sensitive Input Redaction

Validation error على sensitive field لا يسجل القيمة نفسها.

مثال:

```text
password invalid
```

بدون password value.

---

# 73. Raw Stack Traces

Stack traces:

```text
Server-side diagnostics only
```

ولا تعرض في production response/UI.

---

# 74. Error Handling vs QC Audit

```text
Error Handling
≠
QC Audit
```

Validation failure العادية ليست QC Audit event.

Controlled successful mutation غالبًا Audit حتى لو لم يحدث error.

---

# 75. Error Handling vs Security Logging

```text
Error Handling
≠
Security Logging
```

لكن error قد ينتج Security Event عندما يمثل:

```text
Repeated unauthorized attempt
Suspicious access
CSRF failure
Authentication abuse
Signature abuse
Privilege escalation attempt
```

---

# 76. Audit on Failed Controlled Attempts

ليس كل failed approval attempt يُكتب في QC audit تلقائيًا.

هل يجب تسجيل denied/failed controlled attempts في audit أو security log يعتمد على policy/use case.

الـSecurity log هو الأصل للأحداث الأمنية.

---

# 77. User-Facing Severity

Presentation severity منفصلة عن technical category.

Baseline:

```text
INFO
WARNING
ERROR
BLOCKING
```

---

# 78. Severity Examples

```text
Validation field error
→ ERROR / inline

Stale version
→ WARNING or BLOCKING

Permission denied
→ BLOCKING

Internal temporary failure
→ ERROR

Informational recoverable condition
→ INFO
```

---

# 79. Severity Is Presentation Only

UI severity لا تغير HTTP status أو canonical error code.

---

# 80. Recovery Action Contract

Known errors should define recommended recovery behavior where possible.

Examples:

```text
REFRESH
RETRY
SIGN_IN
REAUTHENTICATE
FIX_FIELDS
RETURN_TO_RECORD
CONTACT_SUPPORT
NONE
```

UI يختار presentation المناسب.

---

# 81. No Fake Recovery

لا تعرض زر `Retry` إذا operation غير retry-safe أو error لن يتغير بالretry.

---

# 82. Batch Operation Errors

Bulk/import/batch operations تحتاج contract مستقل.

Conceptual:

```text
BatchResult {
  total
  succeeded
  failed
  itemResults[]
}
```

---

# 83. Batch Whole-Request Failure

إذا whole batch غير authorized أو malformed جذريًا:

```text
Reject whole request
```

ولا نبدأ per-row partial processing.

---

# 84. Batch Per-Item Failure

إذا contract يسمح partial processing:

كل item failure يحمل canonical code وsafe location/reference.

---

# 85. Batch Atomicity

هل batch atomic أو partial:

```text
USE-CASE / BUSINESS-RULE DEPENDENT
```

Error Architecture لا تفترض أحدهما.

---

# 86. Import Error Location

Import row errors يمكن أن تحمل:

```text
row number
column identifier
error code
```

إذا آمن ومفيد.

لا تعتمد على spreadsheet cell text وحده كـcontract.

---

# 87. External Service Errors

Provider-specific errors لا تنتشر خارج adapter.

Flow:

```text
ProviderError
   ↓
Adapter translation
   ↓
SYSTEM_EXTERNAL_SERVICE_UNAVAILABLE
or domain/application-specific safe error
```

---

# 88. External Error Payloads

Raw provider payload:

- Server-only if needed.
- Redacted.
- Not user-facing by default.
- Retention/logging حسب sensitivity.

---

# 89. Object Storage Errors

Examples:

```text
SYSTEM_STORAGE_UNAVAILABLE
RESOURCE_FILE_NOT_FOUND
AUTHZ_DENIED
```

اختيار code يعتمد هل failure storage failure أم authorized resource lookup.

---

# 90. File Upload Errors

Structured errors قد تشمل:

```text
VALIDATION_FILE_TOO_LARGE
VALIDATION_FILE_TYPE_NOT_ALLOWED
VALIDATION_FILE_CONTENT_MISMATCH
SYSTEM_FILE_SCAN_UNAVAILABLE
```

Exact file policy values تأتي من Security/Business policy.

---

# 91. Malware Scan Failure

إذا malware scan required policy ولم تكن الخدمة متاحة:

لا يتم قبول الملف كأنه clean.

Error semantics تكون fail-closed وفق security policy.

---

# 92. AI Errors

AI/provider failure لا يسمح بتجاوز controlled workflow.

AI advisory unavailable:

```text
SYSTEM_AI_UNAVAILABLE
```

أو equivalent canonical code إذا أضيف للregistry.

Business operation الأساسية يجب أن تظل واضحة هل تعتمد على AI أم لا؛ والـFoundation يقول AI Advisory فقط.

---

# 93. AI Output Validation Error

AI structured output غير مطابق schema:

```text
SYSTEM_AI_INVALID_RESPONSE
```

أو equivalent internal error.

لا يستخدم output invalid كcontrolled truth.

---

# 94. Search Errors

Invalid filter/search syntax:

```text
VALIDATION_FAILED
```

Unauthorized result لا يظهر كerror item؛ query نفسها scoped.

---

# 95. Dashboard Errors

Failure widget واحد لا يفرض دائمًا crash كامل dashboard إذا architecture تسمح partial safe degradation.

لكن critical authorization/query context failure يمنع render المناسب.

Exact graceful-degradation UX في UI/UX Specification.

---

# 96. Reporting Errors

Report generation errors تفرق بين:

```text
Invalid filters
Unauthorized report
No data
Generation failure
Export dependency failure
```

`No data` ليس بالضرورة error.

---

# 97. Export Errors

Export failure لا يغير underlying business data.

إذا generation async مستقبلًا، status/error contract يكون explicit.

---

# 98. Health/Readiness Errors

Public health/readiness response minimal.

Detailed dependency error يبقى internal observability.

---

# 99. Configuration Errors

Missing critical startup configuration:

```text
SYSTEM_CONFIGURATION_ERROR
```

غالبًا startup should fail rather than run partially insecure.

---

# 100. Fail-Closed Security Errors

إذا security control required ولم يمكن تقييمه:

```text
DENY / BLOCK
```

Examples:

```text
Authorization service/context unavailable
Signature verification unavailable
Required malware scan unavailable
Unknown security policy state
```

حسب approved architecture.

---

# 101. Fail-Open Prohibition

ممنوع:

```text
Authorization check crashed → allow
Signature verification failed → continue
Policy unknown → approve
```

---

# 102. Error Registry

يجب إنشاء registry مركزي لاحقًا، conceptually:

```text
src/shared/errors/
├── codes.ts
├── app-error.ts
├── mappings/
│   ├── astro.ts
│   ├── http.ts
│   └── postgres.ts
└── registry.ts
```

Exact file structure ينفذ في scaffolding.

---

# 103. One Canonical Code Registry

ممنوع تكرار error code strings داخل modules عشوائيًا.

الـregistry central/shared، مع ownership semantics موثقة.

---

# 104. Domain-Specific Codes

Domain-specific codes مسموحة داخل canonical namespace إذا تحتاج semantic distinction مفيد.

مثال:

```text
DOMAIN_LAB_RESULT_LOCKED
```

لكن لا نكثر codes لمجرد اختلاف النص.

---

# 105. Error Code Granularity

Code جديد يحتاج أن يغير واحدًا على الأقل من:

```text
Machine behavior
Recovery behavior
Authorization behavior
Logging/security classification
User action
API contract
```

إذا الفرق نص فقط، غالبًا لا يحتاج code جديد.

---

# 106. Localization

Canonical code لا يترجم.

User message يمكن أن تدعم:

```text
Arabic
English
```

لاحقًا حسب UI requirement.

---

# 107. Saudi Operational Language

إذا الواجهة تعتمد العربية، message UX تكون واضحة وبسيطة، لكن technical logs/codes تبقى canonical English identifiers.

---

# 108. Message Safety

User-facing message يجب أن تكون:

- Clear.
- Non-technical.
- Safe.
- Actionable where possible.
- Non-accusatory.
- No internal security detail.

---

# 109. No Generic `Something went wrong` for Known Errors

Known recoverable errors يجب أن تحصل على specific recovery message.

Generic internal message فقط للunexpected failures.

---

# 110. No Over-Detailed Authorization Message

لا نعرض policy internals التي تساعد attacker على enumeration/privilege discovery.

مثال internal:

```text
AUTHZ_SCOPE_DENIED
```

قد يظهر للمستخدم:

```text
You do not have access to this record.
```

---

# 111. Support Diagnostics

Support/admin diagnostics يمكن أن تحتوي أكثر من user response، لكن ما زالت:

- Permission-protected.
- Redacted.
- Logged/access-controlled.

---

# 112. Development Error Mode

Development يمكن أن يعرض developer diagnostics إضافية محليًا.

لكن production behavior لا يعتمد على `dev` permissiveness.

---

# 113. Production Error Mode

Production:

```text
No stack trace to client
No SQL details
No secret values
No filesystem paths
No raw provider payload
```

---

# 114. Error Boundary in UI

Client/UI component errors لا تتحول إلى authority لتغيير server state.

UI error boundary وظيفته render/recovery فقط.

---

# 115. Client-Side Exceptions

Client JS exception:

- May be captured by observability.
- Does not become QC audit.
- Must not contain secrets.
- Does not alter server transaction outcome.

---

# 116. Form Submission Recovery

عند recoverable form error:

- Preserve safe user-entered draft data where possible.
- Do not preserve secrets/passwords unnecessarily.
- Focus/announce error accessibly.

Exact UX لاحقًا.

---

# 117. Controlled Action Failure

إذا Approval/Release/Sign operation تفشل قبل commit:

```text
No partial controlled state
```

والـerror response توضح أن العملية لم تكتمل بدون ادعاء state غير متحقق.

---

# 118. Post-Commit Side Effect Failure

إذا business transaction committed وnotification/email فشلت لاحقًا عبر outbox:

لا نرجع العملية business نفسها إلى failed state إذا notification ليست جزءًا من atomic truth.

Error/event status يخص side effect.

---

# 119. Ambiguous Commit Outcome

إذا network disconnect بعد commit يجعل caller غير متأكد هل operation committed:

recovery يعتمد على:

```text
Idempotency
Current state reload
Command key
Audit/business record lookup
```

ولا يعاد command blind.

---

# 120. Timeout Semantics

Timeout لا يعني دائمًا operation لم يحدث.

خصوصًا بعد إرسال transaction/command.

الـerror model يجب أن يميز:

```text
Safe to retry
Outcome unknown
Committed but response lost
```

عندما يمكن تحديدها.

---

# 121. Outcome Unknown

يمكن إضافة canonical code مثل:

```text
SYSTEM_OUTCOME_UNKNOWN
```

فقط إذا implementation يحتاجه فعليًا.

Recovery يكون query current state/idempotency record قبل retry.

---

# 122. Error Metrics

Observability يمكن أن تجمع counts حسب:

```text
code
category
route/use case
status
```

بدون high-cardinality sensitive metadata.

---

# 123. Error Rate Alerts

Spike في:

```text
SYSTEM_INTERNAL_ERROR
SYSTEM_DATABASE_UNAVAILABLE
AUTH failures
CSRF failures
Deadlocks
Serialization failures
```

قد يحتاج alert حسب Observability/Risk policy.

---

# 124. PII in Errors

Error message/metadata لا تكرر PII غير ضرورية.

مثال لا نحتاج:

```text
User y@example.com has no permission
```

إذا generic actor reference يكفي.

---

# 125. File Paths

Internal storage key/filesystem path لا يظهر للمستخدم.

Original filename يمكن يظهر إذا مصرح وآمن.

---

# 126. Constraint Name Leakage

PostgreSQL constraint name server diagnostic فقط.

UI/API يستخدم canonical error code.

---

# 127. Third-Party Status Codes

External HTTP status لا يمر مباشرة كـsystem API status بدون translation.

مثال provider `401` بسبب integration credential لا يعني user `401`.

قد يصبح:

```text
SYSTEM_EXTERNAL_SERVICE_UNAVAILABLE
503
```

---

# 128. Error Wrapping

عند wrapping error:

- Preserve original cause server-side.
- Add meaningful canonical context.
- Avoid multiple re-wrapping that loses root cause.

---

# 129. Error Swallowing

ممنوع:

```text
catch (e) { return null }
```

إذا null يخفي failure meaningful.

Expected absence يجب تمثيلها كـoptional/not-found semantics صريحة.

---

# 130. `null` Is Not Error

No-data/optional relation ليست error إذا contract يسمح.

Error Architecture لا تحول كل absence إلى exception.

---

# 131. Exceptions vs Result Style

Foundation لا تفرض حصريًا:

```text
throw exceptions
```

أو:

```text
Result<T,E>
```

على كل codebase.

المطلوب هو canonical error semantics وboundary mapping.

Exact implementation style يحسم أثناء scaffolding.

---

# 132. Programming Errors

Assertions/impossible states داخل code قد throw unexpected error.

تتحول outward إلى:

```text
SYSTEM_INTERNAL_ERROR
```

وتحتاج fixing، لا إضافة user recovery rule يخفي defect.

---

# 133. Assertion Messages

Assertion internal message لا يعرض مباشرة للعميل.

---

# 134. Safe 404

Object-level routes/actions تستخدم not-found response بطريقة لا تكشف existence إذا permission policy تتطلب ذلك.

---

# 135. Route Not Found vs Resource Not Found

HTTP route 404 وbusiness resource 404 يمكن يشاركان status، لكن logs/canonical context تفرق بينهما داخليًا.

---

# 136. Rate Limit Error

Canonical code:

```text
SYSTEM_RATE_LIMITED
```

أو security-specific registry code عند implementation.

HTTP:

```text
429
```

`Retry-After` يستخدم عندما meaningful.

---

# 137. Abuse vs Normal Rate Limit

Repeated authentication abuse قد ينتج Security Event، بينما normal expensive-report rate limit قد يكون operational فقط.

---

# 138. Error Contract Versioning

API-visible error fields لا تتغير breaking change بصمت.

Adding optional extension field عادة compatible؛ removing/renaming canonical field يحتاج versioning review.

---

# 139. Internal Error Metadata Versioning

Internal diagnostic metadata ليست public contract، لكنها تبقى structured وقابلة للتحليل.

---

# 140. Error Testing

كل critical error path يحتاج tests حسب layer.

---

# 141. Domain Error Tests

تثبت:

```text
Correct code
Correct condition
No state mutation on failure
```

---

# 142. Application Error Tests

تثبت:

```text
Authorization mapping
Scope/SoD failures
Transaction rollback
Concurrency conflict
Retry semantics
```

---

# 143. Infrastructure Error Translation Tests

تثبت translation لـ:

```text
Unique violation
FK violation where relevant
Serialization failure
Deadlock
Timeout
DB unavailable
Provider/storage failure
```

---

# 144. Astro Action Error Tests

تثبت:

```text
AppError → correct ActionError
Unexpected exception → safe generic ActionError
No sensitive details leaked
```

---

# 145. API Problem Details Tests

تثبت:

```text
Content-Type
HTTP status
RFC 9457 fields
Canonical code
requestId
No secret/internal leakage
```

---

# 146. Validation Error Tests

تثبت field errors:

- Correct field.
- Stable error code.
- Safe message mapping.
- Accessible UI handling لاحقًا.

---

# 147. Stale Version Tests

يجب اختبار concurrent edit حقيقي ضد PostgreSQL:

```text
Actor A loads version N
Actor B updates to N+1
Actor A attempts mutation with N
→ CONFLICT_STALE_VERSION
→ no overwrite
```

---

# 148. Security Mapping Tests

تثبت IDOR-safe behavior مثل:

```text
Unauthorized object ID substitution
→ no existence leak
```

---

# 149. Unexpected Error Tests

Simulated unexpected exception:

```text
Client receives SYSTEM_INTERNAL_ERROR
Client receives requestId
Logs receive diagnostic cause
No stack/secret leaks outward
```

---

# 150. Error Registry Tests

CI/test يجب أن تمنع duplicate code definitions أو malformed codes حسب implementation.

---

# 151. Error Documentation

Critical/public error codes يجب أن يكون لها registry documentation تشمل:

```text
Code
Meaning
Category
Expected status/action mapping
Retryability
User recovery
Security sensitivity
```

---

# 152. Error Decision Register

## ERR-001

```text
Decision:
Canonical AppError is independent from Astro and HTTP.

Status:
APPROVED
```

## ERR-002

```text
Decision:
Stable machine-readable error codes are canonical; user text is not the contract.

Status:
APPROVED
```

## ERR-003

```text
Decision:
Hybrid delivery mapping: Astro ActionError for Astro Actions and RFC 9457 Problem Details for independent HTTP APIs.

Status:
APPROVED
```

## ERR-004

```text
Decision:
Raw infrastructure/database/provider errors never cross infrastructure boundary.

Status:
APPROVED
```

## ERR-005

```text
Decision:
Expected application errors are separated from unexpected system failures.

Status:
APPROVED
```

## ERR-006

```text
Decision:
Support-relevant/unexpected errors include requestId correlation.

Status:
APPROVED
```

## ERR-007

```text
Decision:
Validation errors support structured field-level errors.

Status:
APPROVED
```

## ERR-008

```text
Decision:
Retryability semantics are explicit; automatic retry is never assumed.

Status:
APPROVED
```

## ERR-009

```text
Decision:
Stale version is a first-class conflict and never silently overwrites data.

Status:
APPROVED
```

## ERR-010

```text
Decision:
Authorization/not-found mapping may intentionally hide resource existence according to Security Architecture.

Status:
APPROVED
```

## ERR-011

```text
Decision:
User-facing messages are safe and localizable.

Status:
APPROVED
```

## ERR-012

```text
Decision:
Detailed diagnostics remain server-side and are redacted.

Status:
APPROVED
```

## ERR-013

```text
Decision:
Error handling, QC Audit, and Security Logging are separate concerns.

Status:
APPROVED
```

## ERR-014

```text
Decision:
Batch operations use dedicated batch-result semantics where partial outcomes are allowed.

Status:
APPROVED
```

## ERR-015

```text
Decision:
Known critical errors define explicit user recovery behavior where possible.

Status:
APPROVED
```

---

# 153. Deferred Error Decisions

| ID | Decision |
|---|---|
| ED-ERR-001 | Exact TypeScript `AppError` implementation style |
| ED-ERR-002 | Exception vs `Result<T,E>` conventions per layer |
| ED-ERR-003 | Exact localized message catalog structure |
| ED-ERR-004 | Exact public Problem Details `type` URI scheme |
| ED-ERR-005 | Exact log levels per error category |
| ED-ERR-006 | Exact telemetry/error-monitoring provider |
| ED-ERR-007 | Exact batch atomic/partial contracts per feature |
| ED-ERR-008 | Exact retry counts/backoff for internal retryable DB failures |
| ED-ERR-009 | Exact UI severity mapping per code |
| ED-ERR-010 | Exact client error boundary implementation |
| ED-ERR-011 | Exact support/admin diagnostic UI |
| ED-ERR-012 | Exact rate-limit canonical code namespace |
| ED-ERR-013 | Exact Outcome-Unknown handling if needed by deployed infrastructure |

---

# 154. Forbidden Error Patterns

```text
Domain imports Astro ActionError
Raw PostgreSQL error returned to user
Raw provider error returned to user
UI behavior based on parsing English/Arabic error text
Duplicate ad-hoc error strings across modules
catch-and-return-null for meaningful failures
Silent stale-version overwrite
Authorization failure exposed with sensitive policy internals
Stack trace in production response
SQL or constraint name in user response
Password/token/secret inside error metadata
Every error logged as ERROR
Every error written to QC audit
Retry button on non-retryable operation
Blind automatic retry of approval/release/signature
Generic 500 for known recoverable business errors
Generic validation string when field-level recovery is needed
Client-selected error code/state treated as authority
```

---

# 155. Error Feature Checklist

قبل تسليم use case:

```text
[ ] Expected failure modes identified
[ ] Canonical error codes selected
[ ] No duplicate/ad-hoc code invented
[ ] Retryability defined
[ ] Recovery action defined where useful
[ ] Security-sensitive mapping reviewed
[ ] Field errors structured where applicable
[ ] Transaction rollback verified
[ ] Infrastructure errors translated
[ ] Astro/API mapping tested
[ ] requestId available where needed
[ ] Logs redacted
[ ] Audit/security-log behavior separated
[ ] Unexpected failure safe outward
[ ] Negative tests executed
```

---

# 156. API Error Checklist

```text
[ ] Correct HTTP status
[ ] `application/problem+json`
[ ] RFC 9457 fields valid
[ ] Canonical `code` included
[ ] requestId included where appropriate
[ ] No stack/SQL/secret leakage
[ ] IDOR-safe mapping
[ ] Field errors safe
[ ] Retry semantics accurate
```

---

# 157. Astro Action Error Checklist

```text
[ ] Action does not leak raw AppError cause
[ ] Canonical code maps correctly
[ ] Auth failures map safely
[ ] Conflict maps correctly
[ ] Validation integrates with form UX
[ ] Unexpected exception becomes safe generic error
[ ] requestId available for support
```

---

# 158. Database Error Checklist

```text
[ ] SQLSTATE handled only inside infrastructure
[ ] Unique violation translated
[ ] FK/check violations classified correctly
[ ] Serialization/deadlock retry behavior defined
[ ] Timeout semantics defined
[ ] DB unavailable safely mapped
[ ] Constraint/SQL details not leaked
```

---

# 159. Error Definition of Done

Error handling for a feature is not Done until:

```text
Known errors modeled
Unexpected errors safely contained
Transport mapping tested
Security leakage checked
Recovery behavior defined
Concurrency conflicts handled
Logs/audit/security separation verified
Negative-path tests executed
```

---

# 160. Final Error Flow

```text
┌──────────────────────────────────────┐
│ PostgreSQL / Storage / Providers    │
└───────────────────┬──────────────────┘
                    │ raw failure
┌───────────────────▼──────────────────┐
│ Infrastructure Error Translation   │
└───────────────────┬──────────────────┘
                    │ canonical semantics
┌───────────────────▼──────────────────┐
│ Domain / Application AppError       │
└───────────────────┬──────────────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
┌───────────────────┐ ┌────────────────────┐
│ Astro Action      │ │ HTTP API           │
│ ActionError       │ │ RFC 9457 Problem   │
└─────────┬─────────┘ └──────────┬─────────┘
          │                      │
          └──────────┬───────────┘
                     ▼
          Safe UI / Client Recovery
                     │
          requestId correlation inward
```

---

# 161. Final Principle

> **Errors are contracts, not strings.  
> The Domain describes the failure.  
> Infrastructure hides implementation details.  
> Delivery maps failures to the correct transport.  
> Users receive safe recovery guidance.  
> Operators receive correlated diagnostics.  
> Controlled history is never rewritten to hide an error.**

---

# 162. Document Status

```text
Document:
Documents/ERROR-ARCHITECTURE.md

Version:
1.0

Canonical Internal Model:
AppError

Error Families:
AUTH
AUTHZ
VALIDATION
DOMAIN
CONFLICT
RESOURCE
SYSTEM

Astro Actions:
ActionError adapter

Independent HTTP APIs:
RFC 9457 Problem Details
application/problem+json

Validation:
Structured field errors

Concurrency:
CONFLICT_STALE_VERSION first-class
No silent overwrite

Database Errors:
Translated inside infrastructure
No SQLSTATE/constraint leakage outward

Unexpected Errors:
SYSTEM_INTERNAL_ERROR outward
Rich redacted diagnostics inward

Correlation:
requestId

Retry:
Explicit semantics only

Audit:
Separate from error handling

Security Logging:
Separate from QC audit

User Messages:
Safe
Localizable
Recovery-oriented

Status:
FOUNDATION — APPROVED ERROR ARCHITECTURE BASELINE
```

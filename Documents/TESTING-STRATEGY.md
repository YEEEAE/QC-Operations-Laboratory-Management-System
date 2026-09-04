# TESTING-STRATEGY.md

# QC Operations & Laboratory Management System
## Evidence-Driven Risk-Based Testing Strategy — v1.0

**Document Path:** `Documents/TESTING-STRATEGY.md`  
**Status:** FOUNDATION — APPROVED TESTING STRATEGY BASELINE  
**Product:** QC Operations & Laboratory Management System  
**Architecture:** Modular Monolith  
**Web Framework:** Astro — Server / On-demand  
**Database:** PostgreSQL 18.x  
**Primary Unit/Application Test Runner:** Vitest  
**PostgreSQL Integration:** Real PostgreSQL via Testcontainers  
**Critical Browser E2E:** Playwright  
**Verification Model:** Risk-Based + Requirement-Traceable + Evidence-Driven  
**Readiness Status Vocabulary:** PASS / PARTIAL / FAIL / UNVERIFIED  

---

# 1. Purpose

هذه الوثيقة تحدد استراتيجية الاختبار الرسمية للنظام، وما الذي يجب اختباره، وفي أي طبقة، وبأي نوع من الأدلة، ومتى يسمح بوضع حالة:

```text
PASS
PARTIAL
FAIL
UNVERIFIED
```

الهدف ليس فقط الحصول على test suite كبيرة.

الهدف هو إثبات أن النظام:

- يطبق Business Rules الصحيحة.
- يمنع الاستخدام غير المصرح به.
- يحترم State Machines.
- يحافظ على historical integrity.
- يمنع silent overwrite.
- يتعامل مع PostgreSQL transactions/concurrency بشكل صحيح.
- لا يسمح بتجاوز SoD.
- يحافظ على Audit/E-Signature/Approval integrity.
- يعرض أخطاء آمنة وقابلة للتعافي.
- يعمل عبر الـcritical browser workflows.
- لا يحصل على PASS بدون evidence حالية.

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
        ↓
TESTING-STRATEGY.md
```

Test لا يجوز أن يثبت behavior يخالف وثيقة أعلى.

إذا test يمر لأن implementation يخالف Business Rule، فنجاح test لا يجعل behavior صحيحًا.

---

# 3. Core Principle

> **Test the rule at the lowest reliable layer, then verify critical journeys end-to-end.**

لا نعتمد على E2E وحدها.

ولا نعتمد على Unit tests وحدها.

ولا نعتمد على code coverage وحده.

---

# 4. Evidence Principle

> **No test claim is valid without fresh execution evidence.**

وجود:

```text
test file
mock
snapshot
old CI run
old report
```

لا يساوي PASS حالي.

---

# 5. Testing Model

المعتمد:

```text
Requirements / Risks
        ↓
Domain Unit Tests
        ↓
Application Use-Case Tests
        ↓
PostgreSQL Integration Tests
        ↓
Authorization / Security Negative Tests
        ↓
Astro Action / API Contract Tests
        ↓
Component / Accessibility Tests
        ↓
Critical Playwright E2E
        ↓
Operational / Backup / Restore Verification
        ↓
Evidence
```

---

# 6. Testing Strategy Type

المعتمد:

> **Risk-Based Multi-Layer Testing**

وليس:

```text
E2E-heavy only
Unit-only
Coverage-percentage driven
Manual-only acceptance
```

---

# 7. Approved Core Test Stack

## Vitest

يستخدم لـ:

```text
Domain unit tests
Application use-case tests
Shared utility tests
Error mapping tests
Pure authorization policy tests
Component tests where suitable
```

## Testcontainers + PostgreSQL

يستخدم لـ:

```text
Real PostgreSQL migrations
Constraints
Transactions
Locks
Concurrency
UUIDv7 defaults
Business-number allocation
Database roles where feasible
Repository integration
```

## Playwright

يستخدم لـ:

```text
Critical user journeys
Authentication flows
Permission-aware UI behavior
Forms
Approvals
E-Signatures
Reports/exports
Browser compatibility
```

Exact package versions تتثبت عند scaffolding ولا تُخترع داخل Foundation.

---

# 8. No Mocking PostgreSQL Behavior

يمكن استخدام fake/in-memory repositories لاختبار Domain/Application orchestration.

لكن لا يجوز استخدام mock لإثبات سلوك PostgreSQL الحقيقي مثل:

```text
Foreign Keys
CHECK constraints
UNIQUE constraints
Transactions
Rollback
Row locking
Deadlocks
Serialization
Optimistic concurrency
UUIDv7 database defaults
Migration execution
Business-number concurrency
```

هذه تحتاج PostgreSQL حقيقية.

---

# 9. Risk Tiers

كل requirement/use case يصنف حسب المخاطر.

## TIER 1 — CRITICAL

يشمل افتراضيًا أي capability يمكن أن يؤثر على controlled truth أو authority، مثل:

```text
Authentication
Authorization
Permission changes
Approval
E-Signature
Release
PASS / FAIL
Controlled scientific calculation
SoD
Controlled Documents approval/supersession
Critical Audit
Backup / Restore
Role/account security changes
```

## TIER 2 — HIGH

يشمل مثلًا:

```text
Receiving
Inspection submission/review
NCR / RCA / CAPA
Calibration / Maintenance
Evidence files
Change Requests
Reports / Exports
Retest workflows
```

## TIER 3 — NORMAL

يشمل غالبًا:

```text
Dashboard presentation
Search
Filters
Notifications
Non-controlled preferences
Presentation-only behavior
```

التصنيف النهائي يرتبط بـ`RISK-REGISTER.md` عند اعتماده.

---

# 10. Risk Tier Consequence

Tier أعلى يعني verification أعمق.

لا يعني أن Tier 3 بلا اختبارات.

يعني أن Tier 1 لا يمكن الاكتفاء له بـhappy-path test واحد.

---

# 11. Tier 1 Minimum Verification

Tier 1 يحتاج حسب applicability:

```text
Domain tests
Application tests
Negative authorization tests
State-transition tests
PostgreSQL integration tests
Concurrency tests
Error-contract tests
Security tests
Critical E2E
Evidence linked to requirement
```

---

# 12. Requirement Traceability

كل critical test يجب أن يرتبط بـRequirement IDs الموجودة في:

```text
Documents/REQUIREMENTS-TRACEABILITY.md
```

Canonical chain:

```text
Requirement
    ↓
Business Rule
    ↓
Permission
    ↓
State Transition
    ↓
Data
    ↓
Implementation
    ↓
Test
    ↓
Evidence
```

---

# 13. Test IDs

كل test controlled/traceable مهم يحصل على stable Test ID.

Pattern conceptual:

```text
TST-<DOMAIN>-<NNN>
```

Examples:

```text
TST-AUTH-001
TST-QUAR-014
TST-LAB-022
TST-DOC-031
```

Exact registry implementation يأتي مع Test Manifest.

---

# 14. Test Manifest

يجب إنشاء machine-readable Test Manifest لاحقًا.

Minimum fields:

```text
Test ID
Requirement IDs
Risk Tier
Domain
Test Type
Test File
Execution Command
Environment Requirement
Expected Evidence
Status
```

---

# 15. Test Types

Canonical categories:

```text
UNIT
APPLICATION
INTEGRATION_DB
AUTHORIZATION_NEGATIVE
SECURITY
ACTION_API
COMPONENT
ACCESSIBILITY
E2E
MIGRATION
CONCURRENCY
PERFORMANCE
BACKUP_RESTORE
UAT
```

---

# 16. Domain Unit Tests

Domain tests تثبت pure business behavior بدون HTTP/PostgreSQL عندما ذلك ممكن.

Examples:

```text
Allowed/forbidden transition
Value-object validation
Deterministic calculation
Controlled invariant
State precondition
```

---

# 17. Domain Unit Test Rule

Domain test لا يحتاج Astro.

Domain test لا يحتاج browser.

Domain test لا يحتاج PostgreSQL إذا rule pure.

هذا يساعد على سرعة واختبار الحدود بدقة.

---

# 18. Application Use-Case Tests

Application tests تثبت orchestration مثل:

```text
Authorization called
Correct Domain rule invoked
Repository contract called correctly
Transaction requested
Audit requested
Outbox requested
Error propagated correctly
```

يمكن استخدام test doubles هنا، بشرط وجود integration tests منفصلة للسلوك الحقيقي للـinfrastructure.

---

# 19. Application Failure Tests

كل critical use case يختبر failure paths، وليس happy path فقط.

Examples:

```text
Permission denied
Scope denied
Wrong state
SoD failure
Stale version
Missing controlled source
Duplicate operation
Repository failure
```

---

# 20. PostgreSQL Integration Tests

يتم تشغيل PostgreSQL حقيقية متوافقة مع production major version.

Foundation target:

```text
PostgreSQL 18.x
```

يفضل Testcontainers لتوفير instance disposable ومعزولة.

---

# 21. Fresh Database Test

كل migration chain يجب أن تثبت:

```text
Empty PostgreSQL
      ↓
Apply all migrations
      ↓
Latest schema
```

بدون manual intervention.

---

# 22. Upgrade Migration Test

عند وجود prior supported schema:

```text
Previous schema
      ↓
Apply new migrations
      ↓
Current schema
```

مع verification للبيانات/constraints المطلوبة.

---

# 23. Migration Immutability Test

CI/verification يجب أن يكتشف تعديل historical migration checksum بعد تطبيقها في shared environment.

Historical mutation:

```text
FAIL
```

---

# 24. Constraint Tests

Critical constraints يجب أن تثبت:

```text
Valid data accepted
Invalid data rejected
Correct SQL/application error mapping
```

يشمل حسب applicability:

```text
PK
FK
NOT NULL
CHECK
UNIQUE
Partial uniqueness
```

---

# 25. Transaction Tests

Critical transactions تختبر:

```text
All required writes commit together
Failure rolls all required writes back
Audit atomic when required
Outbox atomic when required
No partial controlled state
```

---

# 26. Audit Atomicity Test

إذا business mutation تتطلب Audit داخل نفس transaction:

```text
Business mutation succeeds
Audit insert fails
→ whole critical transaction rolls back
```

إذا الوثائق تنص على atomicity لهذه العملية.

---

# 27. Outbox Atomicity Test

إذا side effect يستخدم Outbox:

```text
Business mutation committed
→ required outbox row exists
```

وفشل outbox insert داخل required atomic transaction يمنع commit.

---

# 28. Optimistic Concurrency Test

Canonical scenario:

```text
Actor A reads version N
Actor B reads version N
Actor B commits update → version N+1
Actor A submits expectedVersion N
→ CONFLICT_STALE_VERSION
→ no silent overwrite
```

هذا اختبار إلزامي لكل controlled record يعتمد version-based concurrency.

---

# 29. Real Concurrency

Concurrency-critical behavior يُختبر بعمليات متوازية حقيقية ضد PostgreSQL، وليس mocks فقط.

---

# 30. Business Number Concurrency

عند تنفيذ Business Number allocator:

يجب تشغيل اختبار ضغط/تزامن مناسب، مثل عدد كبير من allocations المتوازية، والتحقق من:

```text
No duplicate numbers
Transactional consistency
Correct namespace/period behavior
No MAX()+1 race
```

لا يتم افتراض gapless sequence إلا إذا Business Rule تعتمد ذلك صراحة.

---

# 31. Double Approval Concurrency

للـApproval controlled workflows:

```text
Two authorized requests act on same expected version/state
```

يجب أن ينتج final outcome واحد صحيح حسب state/concurrency rules، بدون duplicate approval أو history inconsistent.

---

# 32. Release Concurrency

Release workflow إن كان معتمدًا يجب أن يختبر:

```text
Competing release commands
Stale state/version
Duplicate command
Required authorization
Atomic consequences
```

---

# 33. Deadlock Tests

إذا transaction path معروف بأنه يقفل عدة rows، نختبر lock ordering أو scenario مناسب يثبت أن behavior:

- لا يعلق بلا نهاية.
- يعالج deadlock safely.
- retry إن وُجد bounded وآمن.

---

# 34. Serialization Retry Tests

إذا use case تستخدم `SERIALIZABLE` أو retry semantics:

نختبر:

```text
Retry only allowed failures
Retry bounded
No duplicate side effects
Idempotency preserved
```

---

# 35. Authorization Testing Principle

> **Hidden UI is not authorization evidence.**

اختبار أن زر Approve مخفي لا يثبت أن Astro Action نفسها محمية.

---

# 36. Critical Authorization Matrix

لكل controlled action نختبر حسب applicability:

```text
Allowed actor
Unauthenticated actor
Missing permission
Wrong scope
Wrong entity ownership/assignment
Wrong record state
SoD violation
Stale version
Disabled/revoked account/session
Direct Action/API invocation
```

---

# 37. Direct Invocation Test

كل Astro Action/API الحساسة تختبر بدون المرور بالزر/الصفحة.

الهدف إثبات server-side authorization نفسها.

---

# 38. IDOR Tests

كل object-based route/action/file/report يجب أن يختبر object ID substitution.

Examples:

```text
User A authorized record
User B unauthorized actor
Replace UUID
→ no unauthorized data/action
→ no prohibited existence leak
```

---

# 39. SoD Tests

أي Separation-of-Duties policy APPROVED يجب أن تملك:

```text
Allowed reviewer/approver case
Forbidden same-actor case
Forbidden conflicting-role/scope case where applicable
```

Policy غير محسومة لا يتم اختراعها داخل test.

---

# 40. State Machine Tests

لكل state machine critical:

- Allowed declared transitions → pass.
- Undeclared transitions → deny.
- Terminal/protected state edits → deny unless explicit correction flow.

---

# 41. Transition Coverage

الهدف لـTier 1:

```text
100% of declared critical transitions covered
+
representative invalid transitions
```

لا يعني هذا 100% line coverage.

---

# 42. Controlled Record Integrity Tests

Approved/Signed/Closed/Void/Superseded records يجب أن تختبر ضد generic silent edits.

Expected:

```text
No unauthorized rewrite
History preserved
Explicit correction/version workflow only
```

---

# 43. Scientific Tests

Scientific calculations controlled تختبر boundary values من approved source.

Template:

```text
Below lower boundary
Exact lower boundary
Inside range
Exact upper boundary
Above upper boundary
Rounding boundary
Precision boundary
Unit conversion boundary
Missing source/criterion
```

---

# 44. Scientific Source Rule

Test values لا تُخترع من developer.

تأتي من:

```text
Approved WI
Approved SOP
Specification
Controlled Test Method
Approved Template
```

إذا المصدر غير متوفر:

```text
UNVERIFIED / BLOCKED
```

حسب requirement.

---

# 45. Precision Tests

عند استخدام `NUMERIC(p,s)` أو decimal logic:

نختبر:

```text
Scale
Rounding
Boundary precision
Trailing decimals
Unit conversion
No JavaScript floating-point corruption
```

حسب field-specific requirement.

---

# 46. Error Contract Tests

بناءً على `ERROR-ARCHITECTURE.md` يجب اختبار:

```text
AppError → correct Astro ActionError
AppError → correct RFC 9457 problem
PostgreSQL violation → canonical error
Unexpected exception → safe SYSTEM_INTERNAL_ERROR
requestId present where required
No internal leakage
```

---

# 47. Validation Error Tests

Forms/actions/API input تختبر:

```text
Required fields
Wrong types
Malformed UUID
Unknown fields
Invalid format
Semantic domain invalidity
Field-level error mapping
```

---

# 48. Stale Version Error Test

يجب التأكد أن stale version ينتج:

```text
CONFLICT_STALE_VERSION
```

ولا يرجع generic 500 ولا overwrite.

---

# 49. Unexpected Error Test

Simulate unexpected failure:

```text
Client receives safe generic error
requestId available
No stack trace
No SQL
No secrets
Diagnostic cause preserved server-side
```

---

# 50. Astro Action Tests

كل critical Astro Action تختبر على الأقل:

```text
Valid input + allowed actor
Unauthenticated
Unauthorized
Wrong scope
Malformed input
Wrong state
Stale version where applicable
Unexpected internal failure
```

---

# 51. API Contract Tests

Independent HTTP APIs تختبر:

```text
Method
Status code
Content-Type
RFC 9457 error shape
Authorization
Input schema
Response schema
Security headers where boundary-specific
```

---

# 52. Problem Details Tests

Error response لـAPI يجب أن يتحقق من:

```text
application/problem+json
status
canonical code
safe title/detail
requestId where applicable
no stack/SQL/provider leak
```

---

# 53. Authentication Tests

Minimum scenarios حسب implementation:

```text
Valid login
Invalid credentials
Unknown identity safe response
Disabled account
Session creation
Session fixation prevention
Session expiry
Session revocation
Logout
Password reset
Reset replay prevention
Reset revokes sessions
```

---

# 54. Session Tests

يجب اختبار:

```text
Secure/HttpOnly cookie behavior where environment supports
No auth token in Web Storage
Revoked session denied
Expired session denied
Disabled user denied
```

Exact timeout policy عند اعتمادها.

---

# 55. CSRF Tests

Cookie-authenticated mutation boundaries تختبر:

```text
Valid same-origin request
Invalid/cross-origin request
Astro origin protection behavior
Custom API CSRF proof when required
```

---

# 56. XSS Tests

User-controlled content points المهمة تختبر rendering safety مثل:

```text
Descriptions
Comments
Notes
File names
Search text
Document metadata
AI output
Report text
```

---

# 57. SQL Injection Tests

خصوصًا:

```text
Search
Filters
Sorting
Pagination
Reports
Exports
Admin queries
```

مع dynamic identifiers allowlisted وvalues parameterized.

---

# 58. File Security Tests

حسب Security Architecture:

```text
Allowed file
Disallowed extension
Fake MIME
Magic-byte mismatch
Oversized file
Unsafe filename/path traversal
Unauthorized file download
Object ID substitution
Private storage delivery
Malware policy behavior when implemented
```

---

# 59. CSV / Spreadsheet Export Security

Exports تختبر values التي تبدأ مثل:

```text
=
+
-
@
```

وفق export sanitization/escaping policy لمنع formula injection.

---

# 60. AI Security Tests

عند تنفيذ AI Advisory:

```text
AI cannot approve
AI cannot release
AI cannot set PASS/FAIL
Unauthorized context not sent
Secrets not sent
Prompt injection cannot change authorization
Invalid structured output rejected
Provider unavailable handled safely
```

---

# 61. Component Tests

Component tests تستخدم للأجزاء التي تستحق isolated behavior مثل:

```text
Forms
Dialogs
Status indicators
Tables
Filters
Error summaries
Interactive client islands
```

ولا تستخدم لإثبات server authorization.

---

# 62. Design System Tests

بعد إنشاء Design System نختبر primitives المهمة ضد:

```text
Keyboard behavior
Disabled states
Loading states
Error states
ARIA/labels where required
Responsive behavior where testable
```

---

# 63. Accessibility Testing Model

نحتاج طبقتين:

```text
Automated accessibility checks
+
Manual accessibility verification
```

الـautomated scanner وحده لا يثبت accessibility كاملة.

---

# 64. Automated Accessibility Tests

تغطي حسب tooling النهائي:

```text
Missing labels
Basic ARIA misuse
Contrast-detectable issues where supported
Landmark/semantic issues
Common WCAG violations
```

Exact package/tool يثبت عند UI testing setup.

---

# 65. Manual Accessibility Verification

Critical workflows تحتاج manual checks مثل:

```text
Keyboard-only navigation
Visible focus
Logical focus order
Modal focus trap/return
Zoom
Screen-reader labels/announcements
Error recovery
Reduced motion where applicable
```

---

# 66. Playwright E2E Scope

Playwright يستخدم للـcritical user journeys، وليس لاختبار كل branch منطقي.

---

# 67. Critical E2E Journeys

عند implementation الكامل يجب أن تشمل حسب approved requirements:

```text
Authentication
Receiving → Inspection
Inspection → Review → Approval
Laboratory lifecycle
Quality Finding / NCR / RCA / CAPA lifecycle
Controlled Document lifecycle
E-Signature
Change Request lifecycle
Reports / Exports
Admin authorization workflow
```

---

# 68. E2E Uses Production-Like Build

Final CI/staging E2E يجب أن يختبر production-style Astro build/server، وليس dev server فقط، قبل readiness claim.

---

# 69. Browser Matrix

Baseline CI browser:

```text
Chromium
```

Critical compatibility suite:

```text
Chromium
WebKit
Firefox
```

حسب release cadence/performance constraints.

WebKit مهم لضمان behavior قريب من Safari المستخدم فعليًا.

---

# 70. Mobile / Responsive E2E

Critical responsive routes تختبر representative viewport sizes بعد اعتماد UI/UX specification.

لا ننسخ كل desktop E2E إلى كل viewport بلا قيمة.

---

# 71. Test Isolation

كل test يجب أن يقدر يعمل بدون اعتماد مخفي على ترتيب test آخر.

Forbidden:

```text
Test B assumes Test A already created data
```

إلا suite orchestration مقصودة وواضحة جدًا.

---

# 72. Test Data Factories

Test data تستخدم factories/builders واضحة بدل fixtures ضخمة غامضة.

Factories يجب أن تحترم invariants الافتراضية، وتسمح explicit invalid setup عند اختبار defensive boundaries.

---

# 73. No Production Data in Automated Tests

ممنوع:

```text
Production database
Production secrets
Uncontrolled production exports
Real sensitive production records
```

داخل automated tests.

---

# 74. Test Database Isolation

Integration tests تستخدم disposable test PostgreSQL.

Options مثل:

```text
One container per suite
Database per worker
Schema per worker
```

تحسم بالتنفيذ، بشرط عدم cross-test contamination.

---

# 75. Deterministic Time

Tests التي تعتمد على time تستخدم injectable/frozen clock عندما rule ليست specifically database-trusted timestamp behavior.

أما اختبار trusted PostgreSQL/server timestamps فيستخدم runtime behavior الحقيقي.

---

# 76. Timezone Tests

نختبر:

```text
UTC storage
Asia/Riyadh display conversion
DATE vs TIMESTAMPTZ semantics
Boundary around midnight
```

عند features ذات العلاقة.

---

# 77. Randomness

Random data generation في tests يجب أن تكون reproducible عند failure عبر seed أو logged reproduction data حيث مفيد.

---

# 78. Flaky Test Definition

Test flaky إذا نفس commit/environment/data تنتج pass/fail غير ثابت بدون intentional concurrency property.

---

# 79. Flaky Tests Are Defects

ممنوع:

```text
rerun until green
→ mark PASS
```

Retry يمكن استخدامه للتشخيص أو tooling محدود، لكنه لا يحول flaky test إلى reliable evidence.

---

# 80. Quarantine of Flaky Tests

إذا اضطررنا لعزل flaky test مؤقتًا:

- يفتح defect واضح.
- لا يعتبر requirement Verified إذا test critical.
- يذكر في evidence/report.
- له owner/plan.

---

# 81. Skipped Tests

`skip`, `todo`, disabled suite:

```text
≠ PASS
```

إذا test مطلوب لcritical requirement، النتيجة تصبح PARTIAL أو UNVERIFIED حسب باقي evidence.

---

# 82. Coverage Philosophy

Code coverage:

```text
Signal
≠ Proof of correctness
```

لا نعتمد 100% statement/branch coverage كDefinition of Done.

---

# 83. Critical Coverage Targets

الأهم:

```text
100% critical requirement traceability
100% critical permission negative coverage
100% declared critical transition coverage
100% required migration verification
100% required concurrency scenario evidence
```

هذه targets مفاهيمية مرتبطة بالscope المعتمد، وليست claim حالي قبل وجود implementation/evidence.

---

# 84. Line/Branch Coverage Thresholds

Exact numeric thresholds للـline/branch/function coverage:

```text
DEFERRED UNTIL IMPLEMENTATION BASELINE
```

ويتم اختيارها بحيث تمنع regressions بدون خلق tests شكلية لرفع الرقم.

---

# 85. Mutation Testing

Mutation testing:

```text
OPTIONAL / FUTURE HIGH-VALUE CONTROL
```

يمكن استخدامه لاحقًا على critical pure-domain rules إذا كانت فائدته تبرر التكلفة.

---

# 86. Snapshot Testing

Snapshot tests لا تستخدم كبديل لفهم business output.

مناسبة فقط عندما snapshot نفسها contract واضح ومستقر.

Large blind snapshots discouraged.

---

# 87. Performance Testing

Performance claims تحتاج measurement.

Possible test types:

```text
Dashboard query latency
Large table pagination
Report generation
Bulk import
Concurrent approvals
Database pool behavior
```

Exact SLAs/thresholds تأتي من performance/operational requirements لاحقًا.

---

# 88. Performance Environment

لا نستنتج production capacity من laptop unit test.

Performance evidence يذكر environment/data volume بوضوح.

---

# 89. Load Testing

Load testing يضاف قبل production عندما traffic/concurrency model معروف.

لا نختار virtual-user target عشوائيًا الآن.

---

# 90. Backup Testing

وجود backup job ناجح لا يكفي.

نختبر حسب plan:

```text
Backup created
Integrity checked
Restore executed
Restored application/database verified
```

---

# 91. Restore Verification

Restore test يجب أن يثبت على الأقل:

```text
Database can be restored
Migration history intact
Critical representative records readable
Application can connect/use restored schema
```

حسب `BACKUP-RECOVERY-PLAN.md` عند إنشائه.

---

# 92. Operational Testing

System Health/Readiness تحتاج tests مثل:

```text
Process healthy
DB unavailable → readiness fails safely
No secrets in health response
Required dependency status correct
```

---

# 93. Security Verification Baseline

Security tests ترتبط بـ:

```text
OWASP ASVS 5.0 Level 2 baseline
+
selected deeper controls for high-risk workflows
```

حسب `SECURITY-ARCHITECTURE.md`.

---

# 94. Security Tests Are Negative by Nature

Security verification تركز على محاولة تجاوز النظام، مثل:

```text
Direct endpoint calls
Object substitution
Privilege escalation
CSRF
XSS
Injection
Replay
Session abuse
File abuse
```

وليس happy path فقط.

---

# 95. Secrets Testing

CI/build verification يجب أن يدعم:

```text
Secret scanning
No known production secret in repository
No server secret in client bundle
```

Exact scanning tool يحدد لاحقًا.

---

# 96. Dependency Security Tests

CI يجب أن يدعم dependency vulnerability checks حسب ecosystem.

وجود vulnerability scanner لا يعني أن كل finding تلقائيًا blocks release؛ severity/exploitability policy تتحدد في security/release process.

---

# 97. Architecture Guard Tests

Automated guards يجب أن تمنع حسب architecture:

```text
UI → database imports
Pages → raw DB
Domain → Astro imports
Cross-domain infrastructure imports
Duplicate permission definitions
Duplicate state definitions
Duplicate error code definitions
Unregistered critical routes/tests
```

---

# 98. Import Boundary Tests

Dependency graph/lint/static checks تتحقق من layer boundaries بدل الاعتماد على code review فقط.

Exact tooling يحدد لاحقًا.

---

# 99. Test Naming

Test name يجب أن يصف behavior وexpected outcome.

Prefer:

```text
rejects approval when actor violates SoD
```

على:

```text
test approval 3
```

---

# 100. Arrange / Act / Assert

Unit/application tests يفضل أن تكون واضحة عبر conceptual structure:

```text
Arrange
Act
Assert
```

بدون إلزام syntactic style معين.

---

# 101. One Reason to Fail

كل test يركز على behavior coherent بحيث failure تعطي signal مفهوم.

E2E journeys قد تحتوي عدة checkpoints بطبيعتها، لكن لا تتحول إلى mega-test يغطي النظام كله.

---

# 102. Test Assertion Quality

ممنوع assertions ضعيفة مثل:

```text
expect(result).toBeTruthy()
```

إذا contract يحتاج تحقق state/record/audit/version محدد.

---

# 103. Database Assertions

Critical DB tests تتحقق من persistent facts، وليس return value فقط.

Examples:

```text
version incremented
old history preserved
audit row exists
outbox row exists
forbidden duplicate absent
```

---

# 104. E-Signature Tests

عند تنفيذ E-Signature يجب اختبار:

```text
Reauthentication required
Correct actor bound
Correct subject/version bound
Stale version denied
Replay denied
SoD enforced
Signature evidence persisted
No password stored
Audit consistent
```

---

# 105. Controlled Document Tests

Critical cases:

```text
Draft editable
Submitted lifecycle restricted
Approved version protected
Superseded history preserved
Wrong version use prevented where required
Effective version lookup correct
```

فقط transitions المعتمدة في State Machines.

---

# 106. Laboratory Tests

تشمل حسب approved requirements:

```text
Template/version binding
Measurement validation
Scientific boundaries
Equipment/calibration context
Submit/review/approval state
Historical snapshot
Retest restrictions
```

---

# 107. Quarantine / Inspection Tests

تشمل حسب approved requirements:

```text
Receiving creation
Inspection state flow
PASS/FAIL/HOLD controlled result logic
Approval/review permissions
Release restrictions
Evidence requirements
Historical snapshot
Concurrency
```

ولا يتم اختراع Release rule غير محسومة.

---

# 108. Quality NCR/CAPA Tests

تشمل حسب approved state machines:

```text
Finding creation
NCR lifecycle
RCA linkage
CAPA lifecycle
Closure authority
Required evidence
Immutable closed history
```

---

# 109. Equipment / Calibration Tests

تشمل حسب approved requirements:

```text
Equipment state
Calibration lifecycle
Current calibration selection
Expiry boundaries
Use restrictions
Maintenance interactions
Historical calibration snapshot
```

Exact intervals/acceptance rules تأتي من controlled sources.

---

# 110. Reports / Export Tests

تثبت:

```text
Same canonical dataset for UI/export
Authorization scope preserved
Filters validated
No extra rows/columns leaked
CSV/XLSX security behavior
PDF/XLSX generation integrity where implemented
```

---

# 111. Dashboard Tests

Dashboard tests تركز على:

```text
Authorization-aware read model
Correct scoped aggregates
No global data leak
Correct empty/error states
Representative KPI correctness
```

ولا تعتمد browser calculation كsource of truth.

---

# 112. Search Tests

تثبت:

```text
Scope-aware results
No unauthorized existence leak
Safe filtering/query handling
Correct empty result behavior
```

---

# 113. Notification Tests

تثبت أن notification لا تصبح Business Truth.

مثال:

```text
Notification missing
≠ approval work item missing
```

عند الحاجة.

---

# 114. External Integration Tests

Adapters تختبر:

```text
Contract success
Timeout
Authentication/provider failure
Invalid response
Replay/idempotency where applicable
No leakage of provider error
```

External service calls تُmock/fake في most tests، مع sandbox/contract tests عند توفر provider environment.

---

# 115. Contract Tests

External/internal stable contracts يمكن أن تملك contract tests مستقلة حتى لا يكسر adapter/client behavior بصمت.

---

# 116. CI Testing Layers

Recommended pipeline logical stages:

```text
Static validation
↓
Unit/Application
↓
Architecture guards
↓
PostgreSQL migrations/integration
↓
Security negative tests
↓
Astro production build
↓
Action/API tests
↓
Critical E2E
↓
Artifacts / Evidence
```

Exact GitHub Actions implementation لاحقًا.

---

# 117. Fast vs Slow Suites

Tests تصنف operationally:

```text
FAST
INTEGRATION
E2E
OPERATIONAL
```

حتى يحصل developer على feedback سريع محليًا، بينما CI الكامل يظل gate للreadiness.

---

# 118. Local Developer Workflow

VS Code/local baseline لاحقًا يجب أن يوفر commands واضحة مثل:

```text
test
test:unit
test:integration
test:e2e
test:security
test:all
```

Exact package scripts تنفذ مع scaffolding.

---

# 119. Production Build Gate

قبل critical E2E/readiness:

```text
Astro production build must succeed
```

Dev-server success وحده غير كافٍ.

---

# 120. Test Evidence Record

كل verification run مهم يجب أن يسجل قدر الإمكان:

```text
Commit SHA
Branch
Environment
Node version
PostgreSQL version
Migration state/checksum
Test command
Suite/test IDs
Start/end timestamp
Passed count
Failed count
Skipped count
Duration
Artifacts
Known limitations
```

---

# 121. Evidence Artifact Examples

Examples:

```text
JUnit/XML or structured test report
Playwright HTML report
Screenshots/videos/traces on failure
Migration verification output
Coverage report
Security scan report
Backup/restore verification record
```

Artifacts لا تحل محل تفسير النتيجة، لكنها evidence داعمة.

---

# 122. PASS Definition

```text
PASS
```

فقط إذا:

```text
All required verification for declared scope executed
All blocking tests passed
No required critical test skipped
Evidence belongs to current commit/environment
Known limitations do not invalidate claim
```

---

# 123. PARTIAL Definition

```text
PARTIAL
```

إذا:

```text
Some required verification passed
but required scope/evidence remains incomplete
```

Examples:

```text
Unit tests pass but E2E not run
PostgreSQL tests pass but browser compatibility not run
Feature works but required security negative test missing
```

---

# 124. FAIL Definition

```text
FAIL
```

إذا أي blocking required verification fails.

لا يتم تخفيف FAIL بسبب نجاح نسبة كبيرة من tests.

---

# 125. UNVERIFIED Definition

```text
UNVERIFIED
```

إذا لا يوجد current executable evidence كافي للحكم.

وجود specification فقط = UNVERIFIED implementation status.

---

# 126. Skipped Critical Test Rule

Critical required test skipped:

```text
Cannot be PASS
```

حتى لو جميع tests المنفذة نجحت.

---

# 127. Old Evidence Rule

Evidence من commit قديم لا يثبت commit الحالي إلا إذا verification scope unaffected ومثبتة آليًا/تحليليًا بطريقة معتمدة.

Default:

```text
Re-run required gate on current commit
```

---

# 128. Manual Testing Evidence

Manual/UAT test يجب أن يسجل:

```text
Scenario ID
Tester
Environment
Build/commit
Steps
Expected result
Actual result
Timestamp
Evidence/notes
Disposition
```

---

# 129. UAT Is Not Replacement for Automated Tests

UAT تثبت business usability/acceptance.

لا تستبدل:

```text
Authorization negative tests
Concurrency tests
DB constraints
Security tests
```

---

# 130. Automated Tests Are Not Replacement for UAT

حتى لو automated suite قوية، critical operational workflows تحتاج UAT قبل production حسب UAT plan.

---

# 131. Defect Severity

Exact defect severity model يحدد في Risk/UAT/Release docs، لكن critical security/data-integrity failure يمنع readiness claim.

---

# 132. Regression Rule

كل bug مهم يتم إصلاحه يجب أن يحصل على regression test في أقرب layer ممكن، إذا قابل للأتمتة.

---

# 133. Security Regression Rule

أي security defect مغلق بدون test أو reproducible verification evidence يحتاج مبرر واضح.

---

# 134. Red-Green Verification

عند إصلاح bug أو تنفيذ behavior جديد عبر TDD، test الجديدة يجب أن تثبت أنها قادرة على كشف غياب behavior/fix، وليس مجرد pass بعد implementation.

---

# 135. Test Review

Critical tests تُراجع من ناحية:

```text
Does it test the requirement?
Can it fail for the right reason?
Does it verify negative paths?
Is test data realistic enough?
Is it independent?
Does it leak secrets?
```

---

# 136. Test Ownership

Tests تملكها نفس code/domain boundaries، لكن cross-cutting suites مثل authorization/security/e2e لها shared ownership واضح.

---

# 137. Test Folder Direction

Conceptual organization:

```text
src/modules/<domain>/tests/
tests/integration/
tests/security/
tests/e2e/
tests/architecture/
tests/fixtures/
```

Exact structure يتقرر أثناء scaffolding، بشرط discoverability/manifest consistency.

---

# 138. Test Environment Configuration

Test configuration تستخدم:

```text
Dedicated secrets
Dedicated DB
Dedicated storage/buckets or fakes
No production credentials
```

---

# 139. Network Isolation

Unit/application tests لا تعتمد على internet أو external provider availability إلا إذا test مصنف contract/integration صراحة.

---

# 140. Time Budget

CI suite يمكن تقسيمها لتبقى عملية، لكن لا نحذف verification critical فقط لتقليل الوقت.

Optimization يكون عبر layering/parallelism/isolation.

---

# 141. Parallel Testing

Parallelism مسموح بشرط:

```text
No shared mutable data races
Independent test databases/schemas where needed
No business-number collisions caused by bad test isolation
```

---

# 142. Browser Retry Policy

Playwright retries إن استخدمت في CI لا تخفي flaky behavior.

Final reporting يجب أن يوضح flaky/retried tests، والسياسة النهائية تحدد متى تعتبر blocker.

---

# 143. Screenshots and Visual Regression

Visual regression testing يمكن إضافته بعد تثبيت Design System/UI.

لا يُعتمد قبل وجود stable visual baselines.

---

# 144. Visual Regression Scope

إذا أضيف، يركز على stable components/critical layouts، وليس كل pixel لكل dynamic dashboard data.

---

# 145. Accessibility Release Gate

Critical flows لا تحصل على UI readiness PASS إذا automated accessibility checks أو required manual checks فيها blocking issues غير مقبولة.

Exact WCAG target يثبت في Design/UI/Accessibility specification إذا لم يكن مثبتًا بعد.

---

# 146. Browser Compatibility Gate

Compatibility claim يجب أن يذكر browsers التي تم اختبارها فعليًا.

لا نقول:

```text
Works on all browsers
```

إذا فقط Chromium تم تشغيله.

---

# 147. Data Volume Tests

Data-heavy pages مثل:

```text
Receiving
Inspection lists
Lab records
Audit timeline
Reports
Dashboard
```

تحتاج representative volume tests قبل performance readiness.

Exact volume يعتمد على expected usage وليس guess.

---

# 148. Pagination Tests

Server-side pagination/filter/sort تختبر:

```text
First page
Last page
Empty set
Invalid cursor/page
Stable ordering
Filters + sort combination
Authorization scope
```

---

# 149. Report Dataset Consistency

نفس filters/scope يجب أن تنتج canonical dataset متسق للـscreen/export formats.

اختبارات comparison مناسبة تمنع اختلاف XLSX/PDF عن الشاشة.

---

# 150. Backup/Restore Evidence Is Special

Backup/restore verification لا يمكن mockها بالكامل كدليل readiness.

Production-like restore drill مطلوب قبل claim حسب plan.

---

# 151. Test Failure Diagnostics

Failure output يجب أن يساعد developer بدون تسريب secrets.

يشمل حسب layer:

```text
Test ID
Requirement ID
Expected vs actual
requestId
Relevant sanitized logs
Trace/artifact
```

---

# 152. No Secret in Test Artifacts

Playwright traces/screenshots/logs/reports يجب ألا تحتوي credentials/secrets غير ضرورية.

Test users تستخدم non-production credentials.

---

# 153. CI Artifact Retention

Retention exact duration:

```text
OPERATIONS / SECURITY POLICY DEPENDENT
```

خصوصًا إذا artifacts تحتوي business-like test data.

---

# 154. Testing Decision Register

## TEST-001

```text
Decision:
Vitest is the baseline test runner for domain/application/shared/component-level tests where suitable.

Status:
APPROVED
```

## TEST-002

```text
Decision:
PostgreSQL behavior is verified against real PostgreSQL 18.x via disposable integration environment, preferably Testcontainers.

Status:
APPROVED
```

## TEST-003

```text
Decision:
Playwright is the baseline for critical browser E2E verification.

Status:
APPROVED
```

## TEST-004

```text
Decision:
Testing is risk-tiered and requirement-traceable.

Status:
APPROVED
```

## TEST-005

```text
Decision:
Negative authorization tests are mandatory for critical controlled actions.

Status:
APPROVED
```

## TEST-006

```text
Decision:
Concurrency-critical workflows require real concurrent PostgreSQL tests.

Status:
APPROVED
```

## TEST-007

```text
Decision:
Migration chain must be tested from a fresh PostgreSQL database and supported upgrade states.

Status:
APPROVED
```

## TEST-008

```text
Decision:
Controlled scientific behavior requires approved-source boundary tests; values are never invented by developers.

Status:
APPROVED
```

## TEST-009

```text
Decision:
Canonical error contracts require dedicated mapping and leakage tests.

Status:
APPROVED
```

## TEST-010

```text
Decision:
Security testing aligns with SECURITY-ARCHITECTURE and OWASP ASVS baseline.

Status:
APPROVED
```

## TEST-011

```text
Decision:
Accessibility verification combines automated and manual testing.

Status:
APPROVED
```

## TEST-012

```text
Decision:
Raw code coverage percentage is a signal, not completion proof.

Status:
APPROVED
```

## TEST-013

```text
Decision:
Critical requirement/permission/state/concurrency traceability outranks raw coverage percentage.

Status:
APPROVED
```

## TEST-014

```text
Decision:
Flaky tests are defects and do not become valid evidence by repeated reruns.

Status:
APPROVED
```

## TEST-015

```text
Decision:
PASS/readiness claims require fresh evidence from the current scoped commit/environment.

Status:
APPROVED
```

---

# 155. Deferred Testing Decisions

| ID | Decision |
|---|---|
| TD-TEST-001 | Exact Vitest version |
| TD-TEST-002 | Exact Testcontainers package/version |
| TD-TEST-003 | Exact Playwright version |
| TD-TEST-004 | Coverage provider and numeric thresholds |
| TD-TEST-005 | Exact accessibility automation package |
| TD-TEST-006 | Exact test folder structure |
| TD-TEST-007 | Exact database isolation per parallel worker |
| TD-TEST-008 | Exact CI parallelization strategy |
| TD-TEST-009 | Exact Playwright retry policy |
| TD-TEST-010 | Exact performance/load thresholds |
| TD-TEST-011 | Exact browser release matrix cadence |
| TD-TEST-012 | Exact visual regression tooling |
| TD-TEST-013 | Mutation testing adoption |
| TD-TEST-014 | Artifact retention duration |
| TD-TEST-015 | Exact security scanning tools |
| TD-TEST-016 | Exact backup/restore drill cadence |
| TD-TEST-017 | Exact UAT environment and sign-off workflow |

---

# 156. Forbidden Testing Patterns

```text
Mocking PostgreSQL and claiming DB behavior verified
UI-hidden button used as authorization proof
Happy-path-only tests for critical workflows
100% code coverage used as production-ready proof
Skipped critical tests counted as PASS
Rerun-until-green flaky tests
Tests connecting to production database
Production secrets in fixtures
Scientific limits invented in tests
Old CI run used as current evidence without justification
Manual testing used instead of concurrency/security tests
E2E used to replace all lower-level tests
Unit tests used to claim full user journey works
Test order dependency
Silent stale-version overwrite left untested
Raw SQL/provider errors accepted as user-visible behavior
Backup creation test treated as restore proof
```

---

# 157. Feature Testing Checklist

```text
[ ] Requirement IDs identified
[ ] Risk Tier assigned
[ ] Business Rules identified
[ ] Permission/Scope/SoD paths identified
[ ] State transitions identified
[ ] Domain tests added where applicable
[ ] Application tests added
[ ] PostgreSQL tests added where DB behavior matters
[ ] Negative authorization tests added
[ ] Concurrency tests added where required
[ ] Error contracts tested
[ ] Security cases tested
[ ] Component/accessibility tests added where relevant
[ ] Critical E2E updated where journey affected
[ ] Test evidence generated
[ ] No blocking required test skipped
```

---

# 158. Critical Workflow Checklist

```text
[ ] Allowed actor succeeds
[ ] Unauthorized actor denied
[ ] Wrong scope denied
[ ] Wrong state denied
[ ] SoD violation denied
[ ] Stale version denied
[ ] Duplicate/replay handled
[ ] Transaction rollback verified
[ ] Audit integrity verified
[ ] Outbox integrity verified where applicable
[ ] Direct endpoint/action invocation tested
[ ] Browser critical path tested
[ ] Requirement evidence linked
```

---

# 159. Database Verification Checklist

```text
[ ] Fresh migrations pass
[ ] Upgrade migrations pass where required
[ ] Historical checksums unchanged
[ ] Constraints tested
[ ] FK behavior tested
[ ] Optimistic concurrency tested
[ ] Row locking tested where used
[ ] Business-number allocation concurrency tested
[ ] Transaction rollback tested
[ ] Runtime DB role behavior tested where feasible
[ ] Timezone/date behavior tested
```

---

# 160. Security Verification Checklist

```text
[ ] Authentication negative cases
[ ] Session revocation/expiry
[ ] Authorization negative matrix
[ ] IDOR
[ ] CSRF
[ ] XSS
[ ] SQL injection
[ ] File authorization/validation
[ ] Error leakage
[ ] Secrets leakage
[ ] AI authority boundary where applicable
```

---

# 161. Test Run Evidence Template

```text
Test Run ID:
Commit SHA:
Branch:
Environment:
Node Version:
PostgreSQL Version:
Migration Version/Checksum:
Command:
Scope:
Requirement IDs:
Started At:
Completed At:
Passed:
Failed:
Skipped:
Duration:
Artifacts:
Known Limitations:
Final Status: PASS | PARTIAL | FAIL | UNVERIFIED
```

---

# 162. Feature Verification Status Template

```text
Feature:
Risk Tier:
Requirements:
Implemented Evidence:
Unit/Application:
PostgreSQL Integration:
Authorization Negative:
Security:
E2E:
Accessibility:
Known Gaps:
Status:
```

---

# 163. Definition of Done — Testing

Testing portion من feature لا تعتبر Done إلا إذا:

```text
Required test layers identified
Required tests implemented
Required tests executed fresh
Blocking tests passed
Negative paths covered
No critical test skipped
Evidence captured
Traceability updated
Known limitations declared
```

---

# 164. Release Testing Gate

قبل Release Candidate claim:

```text
Static checks pass
Production build passes
Unit/Application suite passes
PostgreSQL migrations/integration passes
Critical authorization/security suite passes
Critical E2E passes
Required accessibility checks pass
No blocking known test gaps
Evidence linked to current commit
```

Operational/UAT/restore gates تضاف حسب release stage.

---

# 165. Production Readiness Testing Gate

قبل Production Ready claim يجب أن تتوفر evidence مناسبة على الأقل لـ:

```text
Critical Requirements
Authentication
Authorization / SoD
Controlled State Machines
PostgreSQL migrations
Transactions / concurrency
Audit / E-Signature integrity
Scientific rules in approved scope
Reports / exports authorization
File/evidence security
Critical E2E
Accessibility required scope
Backup
Restore proven
Operational health/readiness
UAT disposition
```

---

# 166. Current Project Status Rule

هذه الوثيقة تصف ما **يجب** اختباره.

لا تعني أن الاختبارات موجودة أو نفذت.

حتى وجود:

```text
TESTING-STRATEGY.md
```

لا يغير implementation status عن:

```text
UNVERIFIED
```

إلى أن يوجد code + tests + current execution evidence.

---

# 167. Final Testing Model

```text
┌──────────────────────────────────────────┐
│ Requirements / Risks / Controlled Rules │
└────────────────────┬─────────────────────┘
                     │
        ┌────────────▼────────────┐
        │ Domain Unit Tests       │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Application Tests       │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Real PostgreSQL Tests   │
        │ Migrations / Locks / Tx │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Negative Auth/Security  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Astro Action/API Tests  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Component / A11y        │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Playwright Critical E2E │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Operational/UAT/Restore │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ Current Evidence        │
        │ PASS/PARTIAL/FAIL/...   │
        └─────────────────────────┘
```

---

# 168. Final Principle

> **A test file is not evidence until it runs.  
> A passing happy path is not authorization proof.  
> A mock is not PostgreSQL.  
> Coverage is not correctness.  
> Backup is not proven until restore is verified.  
> PASS belongs to current evidence, not confidence.**

---

# 169. Document Status

```text
Document:
Documents/TESTING-STRATEGY.md

Version:
1.0

Testing Model:
Evidence-Driven Risk-Based Multi-Layer

Unit/Application:
Vitest

Database Integration:
Real PostgreSQL 18.x
Testcontainers preferred

Critical Browser E2E:
Playwright

Authorization:
Mandatory negative testing for critical actions

Concurrency:
Real PostgreSQL concurrency tests

Migrations:
Fresh + supported upgrade verification

Scientific Rules:
Approved-source boundary tests only

Error Contracts:
Dedicated mapping/leakage tests

Security:
Aligned to SECURITY-ARCHITECTURE / OWASP ASVS baseline

Accessibility:
Automated + manual verification

Coverage:
Signal only
Not completion proof

Evidence Status:
PASS / PARTIAL / FAIL / UNVERIFIED

Readiness Claims:
Fresh current evidence required

Status:
FOUNDATION — APPROVED TESTING STRATEGY BASELINE
```

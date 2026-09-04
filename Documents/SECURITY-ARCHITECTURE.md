# SECURITY-ARCHITECTURE.md

# QC Operations & Laboratory Management System

## Security Architecture Specification — v1.0

**Document Path:** `Documents/SECURITY-ARCHITECTURE.md`
**Status:** FOUNDATION — APPROVED SECURITY BASELINE
**Product:** QC Operations & Laboratory Management System
**Architecture:** Modular Monolith
**Framework:** Astro — Server / On-demand
**Runtime:** Node.js
**Database:** PostgreSQL
**Security Baseline:** OWASP ASVS 5.0 — Level 2 baseline + selected high-risk Level 3 controls
**Authorization:** Centralized Server-Side / Default Deny
**Authentication:** Server-side opaque sessions
**Operational Timezone:** `Asia/Riyadh`

---

# 1. Purpose

هذه الوثيقة تحدد الـSecurity Architecture الرسمية للنظام.

الهدف ليس فقط:

```text
Prevent hacking
```

بل حماية:

```text
Identity
Authorization
QC Records
Scientific Results
Approvals
E-Signatures
Audit History
Controlled Documents
Evidence
Reports
Backups
System Administration
```

ضد:

```text
Unauthorized access
Privilege escalation
Data tampering
Record rewriting
IDOR
Session theft
Credential attacks
Replay
CSRF
XSS
SQL Injection
File attacks
Insider misuse
AI misuse
Configuration mistakes
Supply-chain compromise
```

---

# 2. Security Principle

القاعدة العليا:

> **Security is enforced by the server and the domain boundaries, never by UI visibility.**

زر مخفي:

```text
≠
Authorization
```

صفحة غير ظاهرة:

```text
≠
Authorization
```

Role في Browser:

```text
≠
Authorization
```

---

# 3. Authority Chain

```text
SYSTEM-INVARIANTS.md
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
```

Security implementation لا يجوز أن تتجاوز Business Rule أو Permission policy معتمدة.

---

# 4. Security Verification Baseline

يستخدم:

> **OWASP ASVS 5.0**

كـengineering verification baseline.

الـFoundation target:

```text
ASVS Level 2
```

مع controls أعمق للعمليات الحساسة.

---

# 5. High-Risk Security Areas

تحتاج verification أشد:

```text
Authentication
Authorization
Permission Administration
Approval
E-Signature
Release
PASS / FAIL
Void
Correction
NCR Closure
CAPA Closure
Retest
Controlled Documents
Audit
Backup
Restore
Scientific Calculations
Evidence
Reports / Exports
AI access to controlled data
```

---

# 6. Compliance Claim Rule

استخدام ASVS لا يعني:

```text
OWASP Certified
Compliant
Regulatory Approved
```

أي claim رسمي يحتاج evidence وتقييم مستقل حسب الجهة المطلوبة.

---

# 7. Threat Model

النظام يفترض وجود تهديدات من:

```text
Unauthenticated external attacker

Authenticated unauthorized user

Authenticated user outside permitted scope

Malicious insider

Compromised employee account

Compromised Admin account

Stolen browser session

Malicious uploaded file

Malicious controlled-document content

Compromised dependency

Misconfigured reverse proxy

Compromised external integration

AI prompt injection

Race / replay attacker

Accidental operator error
```

---

# 8. Trust Boundaries

```text
Browser
        ↓ UNTRUSTED
Reverse Proxy / TLS Boundary
        ↓
Astro Server
        ↓
Application / Authorization / Domain
        ↓
PostgreSQL

Astro Server
        ↓
Object Storage

Astro Server
        ↓
External Services

Astro Server
        ↓
AI Provider
```

كل انتقال بين الحدود يحتاج validation/authorization مناسب.

---

# 9. Browser Trust Rule

كل ما يأتي من Browser يعتبر:

```text
UNTRUSTED
```

بما فيه:

```text
User ID
Role
Permission
Scope
State
Timestamp
Approval status
PASS/FAIL
Release status
Record version
Filename
MIME type
Hidden inputs
Query parameters
Headers not supplied by trusted infrastructure
```

---

# 10. Security Request Pipeline

```text
HTTPS Request
      ↓
Trusted Host Validation
      ↓
Security Headers
      ↓
CSRF / Origin Controls
      ↓
Astro Middleware
      ↓
Session Authentication
      ↓
Transport Validation
      ↓
Application Use Case
      ↓
Authorization
      ↓
Scope / SoD / State / Version
      ↓
Domain Rules
      ↓
Transaction
      ↓
PostgreSQL
      ↓
Audit / Security Events / Outbox
```

---

# 11. Authentication Model

المعتمد:

> **Server-side opaque sessions**

وليس:

```text
JWT stored in localStorage
User ID from browser
Client-managed authentication state
```

---

# 12. Session Cookie

الاسم المقترح:

```text
__Host-qc_session
```

ويجب أن يستخدم:

```text
Secure
HttpOnly
Path=/
No Domain attribute
SameSite=Strict by default
```

إذا ظهر مستقبلًا SSO أو flow يتطلب cross-site navigation يتم إجراء security review قبل تغيير SameSite.

---

# 13. Session Identifier

Session identifier يجب أن يكون:

```text
Random
Opaque
Unpredictable
CSPRNG-generated
```

الحد المعماري المقترح:

```text
≥ 256 bits random entropy source
```

ولا يحتوي:

```text
User ID
Role
Email
Timestamp
Permission
```

---

# 14. Session Storage

Browser يحمل:

```text
opaque token
```

PostgreSQL يحتفظ فقط بـ:

```text
hashed session token
```

مع:

```text
user_id
created_at
last_seen_at
expires_at
revoked_at
revoked_reason
```

---

# 15. Session Token Hash

يمكن استخدام:

```text
SHA-256
```

لهش Session token العشوائي قبل تخزينه.

هذا مختلف عن Password hashing.

Session token أصله CSPRNG عالي entropy، لذلك لا يستخدم Argon2id لهذا الغرض.

---

# 16. No Authentication Token in Web Storage

ممنوع تخزين:

```text
Session IDs
Authentication tokens
Refresh tokens
Password-derived secrets
```

داخل:

```text
localStorage
sessionStorage
IndexedDB
```

كآلية Authentication رئيسية.

---

# 17. Session Creation

Session تنشأ فقط بعد:

```text
Successful authentication
Account-state validation
Security checks
```

ثم:

```text
Generate fresh token
Store hash server-side
Set secure cookie
```

---

# 18. Session Fixation Protection

بعد successful authentication:

```text
Generate NEW session identifier
```

ولا يتم إعادة استخدام anonymous/pre-authentication session identifier.

---

# 19. Session Rotation

Session identity يجب تدويرها أو استبدالها عند أحداث أمنية مهمة مثل:

```text
Authentication
Privilege elevation
Critical account change
Step-up authentication where appropriate
```

حسب implementation النهائي.

---

# 20. Session Revocation

يجب دعم:

```text
Single session revoke
All sessions revoke
Administrative revoke
Password-reset revoke
Account-disable revoke
Security-event revoke
```

---

# 21. Disabled Accounts

إذا أصبح account:

```text
DISABLED
LOCKED where policy requires
INACTIVE where policy blocks login
```

لا يجوز إنشاء session جديدة.

الجلسات الحالية تتعامل حسب account security policy، والأصل للحالات الأمنية:

```text
revoke
```

---

# 22. Session Expiration

النظام يجب أن يدعم:

```text
Idle timeout
Absolute timeout
```

لكن القيم الدقيقة:

```text
POLICY-DEPENDENT
```

ولا يتم اختراعها بواسطة developer.

---

# 23. Concurrent Sessions

هل يسمح للمستخدم بأكثر من session متزامنة:

```text
POLICY-DEPENDENT
```

Architecture تدعم tracking لكل session بشكل مستقل.

---

# 24. Password Storage

Password لا تخزن:

```text
Plaintext
Encrypted reversible value
SHA-256
SHA-512
MD5
```

---

# 25. Password Hashing Algorithm

المعتمد للـnew implementation:

> **Argon2id**

Baseline minimum:

```text
Memory: 19 MiB
Iterations: 2
Parallelism: 1
```

ويتم benchmark على production-class hardware قبل التثبيت النهائي.

يمكن رفع work factor بدون تغيير architecture.

---

# 26. Password Salt

كل password hash يستخدم:

```text
unique random salt
```

ويفضل ترك generation/encoding لمكتبة Argon2 موثوقة.

---

# 27. Password Pepper

Pepper:

```text
OPTIONAL DEFENSE-IN-DEPTH
```

إذا استُخدم:

```text
Never stored in database
Stored in secret-management boundary
Rotatable through controlled process
```

---

# 28. Legacy Password Algorithms

للنظام الجديد:

```text
bcrypt
scrypt
PBKDF2
```

لا تستخدم بدل Argon2id إلا بسبب requirement تقنية/تنظيمية موثقة.

إذا ظهر FIPS requirement مستقبلًا، يعاد تقييم algorithm.

---

# 29. Password Policy

التفاصيل التالية:

```text
Minimum length
Maximum length
Password history
Common-password blocking
Password expiration
Composition requirements
```

تحتاج Security Policy منفصلة.

Status:

```text
POLICY-DEPENDENT
```

ولا تُخترع.

---

# 30. Password Input Integrity

النظام لا:

```text
Silently truncate password
Silently trim meaningful characters
Transform password unexpectedly
```

ويجب دعم characters المناسبة للمستخدمين.

---

# 31. Login Enumeration

Login failure يجب ألا يكشف بوضوح:

```text
User exists
User does not exist
Account disabled
Wrong password
```

لجهة غير مصرح لها.

استخدم safe generic response حيث يلزم.

---

# 32. Authentication Logging

Security log يسجل:

```text
Successful login
Failed login
Rate limiting
Account security block
Session creation
Session revoke
Password reset request
Password reset completion
```

لكن لا يسجل:

```text
Password
Password hash
Session token
Reset token
```

---

# 33. Login Rate Limiting

Login endpoint يجب أن يملك abuse protection.

يؤخذ بالحسبان:

```text
Account
IP
Request rate
Repeated failures
Distributed attack considerations
```

Exact thresholds:

```text
POLICY-DEPENDENT
```

---

# 34. Lockout Strategy

Exact:

```text
Failure threshold
Lock duration
Backoff
Unlock method
```

غير محسوم.

يجب منع:

```text
Unlimited brute force
```

بدون إنشاء سهل لـdenial-of-service against legitimate users.

---

# 35. Password Reset

Password-reset process يجب أن يستخدم:

```text
Cryptographically random opaque token
Single use
Server-side hashed storage
Expiration
Rate limiting
Audit/security logging
```

---

# 36. Password Reset Completion

عند نجاح reset:

```text
Invalidate token
Update password hash
Revoke existing sessions
Write security event
```

داخل عملية متسقة.

---

# 37. Reset Enumeration

طلب reset يعطي response لا يكشف بشكل مفيد إذا user موجود أم لا.

---

# 38. Reset Delivery

Reset secret لا يرسل في:

```text
Logs
Analytics
URL referrers to third-party domains
```

Exact delivery channel:

```text
POLICY / IMPLEMENTATION DEPENDENT
```

---

# 39. MFA Architecture

Architecture تكون MFA-ready.

لكن MFA globally:

```text
NOT YET REQUIRED
```

حتى اعتماد company security policy.

---

# 40. Candidate MFA High-Risk Groups

مرشحين للمستقبل:

```text
Admin
Manager
Privileged Supervisor
Backup/Restore operators
Permission administrators
```

لكن لا يتم تفعيل policy بلا اعتماد.

---

# 41. Step-Up Authentication

Actions شديدة الحساسية يمكن أن تتطلب إعادة تحقق حديثة.

مثل:

```text
E-Signature
High-risk approval
Production restore
Permission escalation
Sensitive account changes
```

---

# 42. Step-Up Freshness Window

مدة صلاحية step-up authentication:

```text
POLICY-DEPENDENT
```

ولا تعتمد على مجرد وجود session قديمة.

---

# 43. Authorization Principle

المعادلة الرسمية:

```text
Authenticated Actor
+
Account State
+
Explicit Permission
+
Scope
+
Entity
+
Entity State
+
Ownership / Assignment
+
Separation of Duties
+
Expected Version
+
E-Signature Requirement
+
Business Rules
=
Authorization Decision
```

---

# 44. Default Deny

```text
Unknown
=
DENY
```

```text
Policy not approved
=
DENY
```

```text
Permission missing
=
DENY
```

---

# 45. Server Authorization

Authorization تنفذ:

```text
Server-side
```

لكل:

```text
Astro Action
API endpoint
Protected report
File download
Search result
Dashboard data query
Administrative command
```

---

# 46. Astro Actions

كل Astro Action تعامل كـ:

```text
PUBLICLY ADDRESSABLE SERVER ENTRY POINT
```

ولا تعتمد على أن المستخدم لن يعرف URL.

كل handler حساس يعيد Authentication + Authorization.

---

# 47. Middleware Limitation

Astro Middleware يمكن أن يقول:

```text
User authenticated
```

لكن لا يكفي ليقول:

```text
User may approve Inspection 123
```

القرار الثاني داخل Use Case.

---

# 48. Astro Origin Protection

يجب:

```text
security.checkOrigin = true
```

أو إبقاء default الآمن في Astro version المعتمدة.

ممنوع تعطيله بدون:

```text
Documented threat analysis
Alternative CSRF control
Architecture approval
Tests
```

---

# 49. Astro Origin Coverage Limitation

لا نفترض أن `checkOrigin` يحمي كل transport.

أي endpoint/method/content type لا يغطيه framework origin check يحتاج CSRF review مستقل.

---

# 50. CSRF Architecture

لـcookie-authenticated state-changing requests:

```text
SameSite cookie
+
Origin validation
+
Astro checkOrigin where applicable
+
Explicit CSRF defense for uncovered transports
```

---

# 51. Custom API CSRF

إذا أنشأنا JSON mutation endpoint أو transport غير مغطى تلقائيًا:

يجب استخدام أحد الحلول المعتمدة مثل:

```text
Validated Origin
+
CSRF token
and/or
Fetch Metadata policy
```

بحسب endpoint.

---

# 52. GET Safety

`GET` و`HEAD` لا يقومان:

```text
Approve
Delete
Release
Void
Close
Change Password
Assign Role
```

State changes تستخدم methods/actions مناسبة.

---

# 53. Scope Enforcement

Scope لا يطبق بالـUI فقط.

Database query نفسها يجب أن تحد النطاق المناسب.

مثال:

```text
Employee dashboard
```

لا يجلب global metrics ثم يخفيها.

---

# 54. IDOR Protection

كل object access يتطلب:

```text
Authentication
+
Authorization
+
Scope
```

ولا يكفي معرفة UUID.

---

# 55. UUID Is Not Authorization

استخدام UUID يقلل guessability لكنه:

```text
≠ access control
```

---

# 56. Existence Leakage

Unauthorized user لا يجب أن يحصل على useful distinction يسمح له بمعرفة وجود records حساسة.

Exact HTTP/error behavior يحدد في Error Architecture.

---

# 57. Bulk Authorization

Bulk mutation:

```text
Authorize each affected record
```

ولا:

```text
Authorize first row
→ assume rest allowed
```

---

# 58. Role Administration

تغيير:

```text
Role
Permission
Scope
Account state
```

يعتبر high-risk mutation.

---

# 59. Self-Escalation

المستخدم لا يستطيع منح نفسه صلاحية أعلى بسبب مجرد امتلاكه access إلى شاشة Admin.

Self privilege escalation:

```text
DENY BY DEFAULT
```

إلا إذا policy محددة تنص غير ذلك.

---

# 60. Admin Principle

Admin:

```text
System administrator
≠
Universal business approver
```

Admin لا يملك bypass تلقائي لـ:

```text
Scientific result
Approval policy
Release
SoD
Historical immutability
```

---

# 61. Separation of Duties

SoD check:

```text
Server-side
```

ولا يقبل override من:

```text
Hidden field
Admin UI
Client state
```

---

# 62. E-Signature Security

E-Signature ليست:

```text
Approve button
```

بل security ceremony منفصلة.

---

# 63. E-Signature Binding

Signature evidence ترتبط بـ:

```text
Actor
Action
Meaning
Subject Type
Subject ID
Subject Version
Snapshot Hash
Timestamp
Request ID
Reason where required
```

---

# 64. E-Signature Reauthentication

قبل Signature:

```text
Reauthenticate
```

ثم:

```text
Reauthorize
```

ثم:

```text
Revalidate state/version/SoD
```

---

# 65. E-Signature Secret

لا تخزن:

```text
Password
Password copy
Reauthentication credential
```

داخل signature evidence.

---

# 66. Signature Replay

نفس signature operation لا يمكن replay لتوقيع version أخرى أو transition أخرى.

---

# 67. Signature Staleness

إذا تغير subject version بين:

```text
Reauthentication
and
Final operation
```

يجب رفض العملية وإعادة validation.

---

# 68. Transport Security

Production traffic:

```text
HTTPS ONLY
```

---

# 69. TLS

Minimum architecture target:

```text
TLS 1.2+
```

مع تفضيل:

```text
TLS 1.3
```

عندما يدعمه stack.

---

# 70. HSTS

Production يستخدم:

```text
Strict-Transport-Security
```

بعد التأكد أن deployment/domain جاهز بالكامل HTTPS.

---

# 71. Reverse Proxy Trust

إذا كان التطبيق خلف:

```text
Load balancer
CDN
Reverse proxy
```

لا نثق تلقائيًا في:

```text
X-Forwarded-For
X-Forwarded-Host
X-Forwarded-Proto
```

إلا من proxy موثوق ومضبوط.

---

# 72. Host Header Security

التطبيق يجب أن يعرف production hostnames المسموحة.

Unknown host:

```text
REJECT / IGNORE FOR TRUSTED URL CONSTRUCTION
```

---

# 73. Astro Allowed Domains

إذا Astro version المستخدمة تدعم trusted/allowed domain configuration:

يتم ضبط production hosts صراحة.

إذا لا:

يطبق equivalent trusted-host validation على infrastructure/app boundary.

---

# 74. Security Headers

Production baseline يشمل:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options: nosniff
Referrer-Policy
Permissions-Policy
Frame protection
Cross-origin policy where compatible
```

---

# 75. Clickjacking

النظام الداخلي لا يحتاج embedding داخل third-party frame افتراضيًا.

Baseline:

```text
frame-ancestors 'none'
```

إلا إذا requirement مستقبلية معتمدة.

---

# 76. Content Security Policy

CSP baseline:

```text
default-src 'self'
object-src 'none'
base-uri 'none'
frame-ancestors 'none'
form-action 'self'
```

وباقي directives تضيق حسب الموارد المستخدمة فعليًا.

---

# 77. Script Security

Default:

```text
No unsafe-eval
```

و:

```text
No unsafe-inline
```

كقاعدة تصميمية.

Inline code إذا احتاج:

```text
nonce
or
hash
```

حسب Astro/runtime implementation.

---

# 78. CSP Exception

أي توسيع مثل:

```text
unsafe-inline
broad connect-src
wildcard script source
```

يحتاج:

```text
Documented reason
Threat analysis
Explicit approval
Test
```

---

# 79. XSS Principle

User-controlled data لا تعامل كـtrusted HTML.

---

# 80. Astro Raw HTML

أي capability مثل:

```text
set:html
```

مع untrusted data:

```text
FORBIDDEN
```

إلا بعد sanitization موثوق ومبرر.

---

# 81. DOM XSS

ممنوع:

```text
element.innerHTML = userInput
document.write(userInput)
eval(userInput)
new Function(userInput)
```

مع بيانات غير موثوقة.

---

# 82. Output Encoding

Output encoding حسب context:

```text
HTML
Attribute
URL
JavaScript
CSV
```

ولا توجد function واحدة آمنة لكل contexts.

---

# 83. SQL Injection

كل SQL parameters تأتي عبر:

```text
Parameterized queries
Prepared/bound parameters
Safe query builder
```

---

# 84. Dynamic SQL

Dynamic:

```text
table name
column
ORDER BY
direction
operator
```

لا يتم أخذها مباشرة من user input.

يتم mapping من allowlist.

---

# 85. Search/Filter SQL

Search/filter DSL يجب أن تتحول إلى server-approved query structure.

لا:

```text
WHERE ${userInput}
```

---

# 86. PostgreSQL Application Role

Runtime app لا يعمل كـ:

```text
postgres superuser
database owner
```

---

# 87. Database Least Privilege

يفضل فصل:

```text
Application runtime role
Migration role
Administrative/backup role
```

بصلاحيات مختلفة.

---

# 88. Runtime DB Permissions

Application runtime تحصل فقط على privileges التي تحتاجها.

---

# 89. Audit Table DB Protection

App path الطبيعي:

```text
INSERT audit events
```

لكن لا:

```text
UPDATE historical audit
DELETE historical audit
```

حيث يسمح التصميم الفيزيائي بذلك.

---

# 90. PostgreSQL TLS

إذا اتصال PostgreSQL يعبر network غير موثوق:

```text
TLS REQUIRED
```

Exact certificate mode حسب deployment architecture.

---

# 91. Database Secrets

Connection password/credential:

```text
Secret
```

ولا يكتب في:

```text
Source code
Git
Logs
Documentation examples
Client bundle
```

---

# 92. Database Error Leakage

Database errors لا تصل raw للمستخدم.

---

# 93. Data Classification

نعتمد التصنيفات الموجودة في Data Dictionary:

```text
PUBLIC-INTERNAL
INTERNAL
SENSITIVE
SECRET
```

---

# 94. SECRET

أمثلة:

```text
Passwords
Session tokens
Reset tokens
API keys
DB credentials
Private signing material
```

---

# 95. SENSITIVE

يمكن أن تشمل حسب field classification:

```text
Personal identifiers
Controlled security data
Sensitive QC evidence
Restricted business records
```

التصنيف الفعلي لكل field يأتي من Data Dictionary/policy.

---

# 96. Encryption at Rest

Production PostgreSQL storage والـObject Storage والـbackup يجب أن تستخدم encryption at rest من platform/provider المناسب.

---

# 97. Field-Level Encryption

لا نضيف application field encryption لكل شيء.

تستخدم فقط إذا:

```text
Data classification
Threat model
Regulatory requirement
```

يستدعيها.

---

# 98. Passwords Are Hashed

Passwords:

```text
HASH
```

ولا:

```text
Encrypt for retrieval
```

---

# 99. Secrets Management

Secrets تحصل من:

```text
Environment / Secret Manager
```

وليس repository.

---

# 100. Secret Startup Validation

Server يتحقق عند startup من required configuration.

لكن error لا يطبع secret value.

---

# 101. Secret Rotation

Architecture يجب أن تسمح بتدوير:

```text
DB credentials
Session-related secrets
Object storage keys
Email keys
AI API keys
Integration credentials
```

---

# 102. Client Bundle Secret Guard

CI/build verification يجب أن يفحص عدم تسريب server secrets إلى browser bundles.

---

# 103. File Upload Trust

كل upload:

```text
UNTRUSTED
```

بغض النظر عن uploader role.

---

# 104. File Validation

Upload validation تشمل:

```text
Size
Extension allowlist
Declared MIME
Actual content signature/magic bytes where possible
Filename handling
Authorization
Storage classification
```

---

# 105. File Size Limits

Exact maximum sizes:

```text
POLICY-DEPENDENT
```

وتختلف حسب evidence/document type إذا لزم.

---

# 106. Filename Security

Original filename:

```text
Metadata only
```

ولا يستخدم مباشرة كـstorage path.

---

# 107. Storage Key

Storage key يكون:

```text
Server-generated
Unpredictable
Path-safe
```

---

# 108. Path Traversal

ممنوع استخدام filename/user path لإنشاء filesystem/object-storage path بدون server-controlled mapping.

---

# 109. Object Storage

Default:

```text
PRIVATE
```

لا public bucket/object ACL للـcontrolled evidence.

---

# 110. File Download

```text
Request
↓
Authenticate
↓
Authorize linked entity
↓
Resolve evidence link
↓
Resolve file
↓
Deliver
```

---

# 111. Signed URLs

إذا استخدمت pre-signed URLs:

```text
Short-lived
Generated only after authorization
Bound to intended object
```

Exact TTL:

```text
POLICY / IMPLEMENTATION DEPENDENT
```

---

# 112. File Hash

Upload stores:

```text
SHA-256
```

لـintegrity/reference purposes.

---

# 113. Malware Scanning

Production user uploads يجب أن تكون architecture-ready للـmalware scanning.

الـscanner/provider:

```text
UNCONFIRMED
```

قبل production يجب حسم policy حسب file types.

---

# 114. Dangerous File Types

Executable/script-capable formats لا تقبل لمجرد أن uploader Admin.

Allowlist حسب business requirement.

---

# 115. PDF / Office Files

تعامل كـuntrusted binary حتى لو document controlled.

أي preview/conversion engine يعزل قدر الإمكان عن main application process حسب tooling.

---

# 116. File Response Headers

File downloads تضبط:

```text
Content-Type
Content-Disposition
X-Content-Type-Options
```

بشكل server-controlled.

---

# 117. CSV Injection

CSV/XLSX exports يجب أن تعالج cells التي يمكن تفسيرها كformula.

خاصة البداية بـ:

```text
=
+
-
@
```

بحسب export context.

---

# 118. Reporting Security

Report:

```text
same authorization
same scope
```

كتطبيق الويب.

---

# 119. Report Export

Export لا يعطي:

```text
more columns
more rows
more scope
```

من الشاشة لمجرد أن format = XLSX/PDF.

---

# 120. Report Parameters

Filters/date ranges/sort/options:

```text
Server validated
```

---

# 121. Report Files

Generated temporary report artifact لا يصبح public file تلقائيًا.

---

# 122. Search Security

Search query نفسها:

```text
authorization-aware
scope-aware
```

---

# 123. Search Leakage

Search لا يكشف:

```text
Record title
Lot
Item Code
Status
Snippet
Existence
```

لغير المصرح.

---

# 124. Dashboard Security

Dashboard KPI calculations نفسها scoped.

ممنوع:

```text
Global KPI query
→ hide card based on role
```

---

# 125. Dashboard Counts

حتى aggregate count قد يكون information disclosure.

لذلك Authorization تطبق قبل aggregation.

---

# 126. Notification Security

Notification تحتوي أقل قدر من البيانات الحساسة اللازم.

---

# 127. Notification Link

فتح notification لا يتجاوز authorization الحالي.

حتى لو notification قديمة.

---

# 128. Audit vs Security Logs

نفصل:

```text
QC Audit
```

عن:

```text
Security / Application Logs
```

---

# 129. QC Audit

يثبت:

```text
Who
What
When
Entity
Transition
Reason
Controlled decision
```

---

# 130. Security Logs

تستخدم لرصد:

```text
Authentication attacks
Authorization denials
Rate limits
Suspicious requests
Invalid CSRF
Session events
Upload failures
Security configuration problems
```

---

# 131. Never Log

ممنوع تسجيل:

```text
Passwords
Session token
Reset token
API keys
DB password
Full Authorization header
Secret cookies
Private cryptographic material
```

---

# 132. Sensitive Log Data

PII أو sensitive record contents لا تسجل إلا للحاجة المثبتة ومع redaction.

---

# 133. Security Event Correlation

Security events تستخدم:

```text
requestId
actorId where known
session reference where safely represented
timestamp
event type
result
```

---

# 134. Trusted Time

Security/Audit timestamps تأتي من:

```text
Server / Database trusted time
```

وليس Browser timestamp.

---

# 135. Log Integrity

المستخدم العادي وBusiness Admin لا يملكون capability لتعديل security logs/audit التاريخية.

---

# 136. Log Retention

Exact retention:

```text
POLICY-DEPENDENT
```

---

# 137. Audit Cryptographic Chain

Hash chaining/signing للـAudit:

```text
UNCONFIRMED
```

ولا يجوز claim:

```text
Cryptographically immutable
Tamper-proof
```

قبل implementation واختباره.

---

# 138. Error Security

User-facing error:

```text
Safe
Minimal
Actionable
Request-ID traceable
```

---

# 139. Production Errors

ممنوع عرض:

```text
Stack trace
SQL
Connection string
Filesystem paths
Internal source paths
Secrets
Detailed authorization internals
```

---

# 140. Error Codes

Use stable codes مثل:

```text
AUTHENTICATION_REQUIRED
AUTHORIZATION_DENIED
VALIDATION_FAILED
STALE_VERSION
INVALID_STATE_TRANSITION
SOD_VIOLATION
RATE_LIMITED
INTERNAL_ERROR
```

---

# 141. Rate-Limit Targets

Rate limiting مهم خصوصًا لـ:

```text
Login
Password reset
E-Signature reauthentication
AI calls
Heavy search
Report generation
File uploads
Expensive APIs
```

---

# 142. Rate Values

Exact limits:

```text
POLICY / PERFORMANCE DEPENDENT
```

لكن absence of unlimited-abuse protection requirement ليس مقبولًا للhigh-risk endpoints.

---

# 143. Replay Protection

High-risk mutation يجب أن تعتمد:

```text
Expected version
Idempotency
Current state
Current authorization
```

لمنع replay.

---

# 144. Concurrency Security

Race condition تعتبر security/integrity risk.

خصوصًا:

```text
Approval
Release
Role assignment
Current calibration
Document supersession
Change Request apply
Business ID generation
```

---

# 145. Transactions

Critical security state changes transactional.

مثال permission change:

```text
Change permission
Audit
Session/authorization consequence
```

يجب أن تكون متسقة حسب use case.

---

# 146. Administrative Security

Admin UI:

```text
Protected route
+
Protected action
+
Explicit permission
+
Audit
```

---

# 147. Critical Admin Operations

تشمل:

```text
User activation/deactivation
Role assignment
Permission assignment
Security configuration
Backup
Restore
Reference governance
```

---

# 148. Production Restore

```text
DENY
```

حتى اعتماد authority policy.

---

# 149. Backup Confidentiality

Backups تعتبر:

```text
SENSITIVE / potentially SECRET-containing
```

لأنها قد تحتوي كامل DB.

---

# 150. Backup Encryption

Production backups:

```text
Encrypted at rest
Encrypted in transit
Access restricted
```

---

# 151. Backup Credentials

Backup artifact لا يحتوي plaintext:

```text
DB credentials
API credentials
Secrets config
```

إلا إذا يوجد secret-backup process منفصل ومصمم لذلك.

---

# 152. Restore Security

Restore operation تتطلب:

```text
Authorization
Environment validation
Target validation
Audit
Backup integrity verification
```

---

# 153. Production Restore Step-Up

Production restore مرشح قوي لـ:

```text
Step-up authentication
+
Higher authorization
+
Explicit approval
```

لكن exact policy:

```text
POLICY-DEPENDENT
```

---

# 154. AI Security Boundary

AI:

```text
UNTRUSTED ADVISORY COMPUTATION
```

من ناحية business authority.

---

# 155. AI Cannot Control

AI لا يستطيع:

```text
Approve
Reject
Release
Sign
PASS
FAIL
Void
Close
Assign Role
Change Permission
Restore Production
```

---

# 156. AI Input Authorization

قبل إرسال context إلى AI:

```text
Authenticate
Authorize
Scope
Minimize
Redact where required
```

---

# 157. AI Data Minimization

لا نرسل entire record/database إذا task تحتاج جزء صغير.

---

# 158. AI Secrets

ممنوع إرسال:

```text
Passwords
Session tokens
API keys
Reset tokens
DB credentials
```

إلى AI provider.

---

# 159. Prompt Injection

كل:

```text
Document
Uploaded file
External text
Retrieved content
User note
```

يعامل كـuntrusted AI content.

النص داخل document لا يستطيع تغيير system authorization.

---

# 160. AI Tool Boundary

حتى لو AI مستقبلًا استخدمت tools:

كل tool call يمر:

```text
Normal server authorization
```

ولا يتم إعطاء model universal database credential.

---

# 161. AI Output Validation

Structured AI outputs تخضع لـ:

```text
Schema validation
Length limits
Type validation
Safe rendering
```

---

# 162. AI HTML

AI output لا يتم render كـraw trusted HTML افتراضيًا.

---

# 163. AI Retention

Prompt/output retention:

```text
POLICY-DEPENDENT
```

والأصل:

```text
Do not retain sensitive full content without requirement
```

---

# 164. External Integration Architecture

كل integration خلف:

```text
Adapter / Port
```

---

# 165. External Credentials

Integration credentials:

```text
server-only secrets
```

---

# 166. External Response

أي data من external system:

```text
UNTRUSTED INPUT
```

وتخضع validation.

---

# 167. SSRF

Application لا تقبل arbitrary URL من user ثم server يقوم fetch لها.

---

# 168. Egress Target

External adapters تستخدم:

```text
Approved fixed/configured hosts
Approved schemes
```

---

# 169. URL Validation

إذا business requirement تحتاج user-defined URL مستقبلًا:

يلزم SSRF-specific design يشمل منع الوصول غير المصرح إلى:

```text
localhost
metadata services
internal network ranges
unsupported schemes
```

حسب integration requirement.

---

# 170. Webhooks

إذا أضيفت webhooks:

يجب دعم:

```text
Authentication/signature verification
Replay protection
Timestamp/nonce where suitable
Payload validation
Rate limiting
Idempotency
Audit/security logging
```

---

# 171. CORS

Default:

```text
Same-origin only
```

---

# 172. CORS Wildcard

مع credentials:

```text
Access-Control-Allow-Origin: *
```

غير مسموح.

---

# 173. API Cross-Origin

أي cross-origin API access يحتاج:

```text
Explicit approved origin allowlist
Threat review
Authentication design
CSRF implications review
```

---

# 174. Dependency Security

Dependencies الجديدة تخضع لـ:

```text
Need review
Maintenance status
Security history
Package authenticity
License review where required
Bundle/server impact
```

---

# 175. Lockfile

Package lockfile:

```text
Committed
Reviewed
Used in deterministic installation
```

بعد اختيار package manager.

---

# 176. Dependency Updates

Security updates لا تؤجل بلا تقييم.

لكن major upgrades لا تطبق blind.

---

# 177. Dependency Scanning

CI يجب أن يملك dependency vulnerability scanning مناسب للecosystem.

Tool exact:

```text
UNCONFIRMED
```

---

# 178. Secret Scanning

CI/repository يجب أن يفحص:

```text
API keys
Private keys
Tokens
Credentials
```

قبل release.

---

# 179. SAST

Static security analysis يضاف بما يناسب TypeScript/Astro stack.

Exact tool:

```text
UNCONFIRMED
```

---

# 180. DAST

Staging security verification يجب أن يسمح بـDAST/scanner أو equivalent testing للroutes الفعلية.

---

# 181. Security Test Pyramid

```text
Security Unit Tests
        ↓
Authorization Tests
        ↓
PostgreSQL Security/Constraint Tests
        ↓
Astro Action/API Negative Tests
        ↓
Session/CSRF Tests
        ↓
File Security Tests
        ↓
E2E Security Tests
        ↓
DAST / Manual Security Review
```

---

# 182. Required Authentication Tests

```text
Valid login
Invalid password
Unknown identity
Disabled account
Session fixation
Session revocation
Expired session
Password reset
Reset replay
Reset invalidation
```

---

# 183. Required Authorization Tests

لكل critical action:

```text
Allowed user
No permission
Wrong role capability
Wrong scope
Wrong owner
Wrong assignment
Wrong state
SoD violation
Stale version
Direct action invocation
```

---

# 184. Required CSRF Tests

```text
Same-origin valid request
Cross-origin form request
Invalid Origin
Missing required CSRF proof where applicable
JSON/custom endpoint behavior
```

---

# 185. Required IDOR Tests

كل critical object route/action:

```text
User A record
User B unauthorized actor
Direct UUID substitution
Parent-child substitution
File ID substitution
Report/export scope substitution
```

---

# 186. Required Session Tests

```text
Cookie flags
No localStorage token
Rotation
Revoke
Logout
Password-reset revoke
Disabled-user revoke
Concurrent-session policy once defined
```

---

# 187. Required XSS Tests

على الأقل:

```text
Text fields
Comments
Descriptions
File names
Search
Report filters
AI outputs
Document metadata
```

---

# 188. Required SQLi Tests

خصوصًا:

```text
Search
Filters
Sort
Pagination
Reports
Dynamic exports
Admin lookup
```

---

# 189. Required File Tests

```text
Wrong extension
Fake MIME
Magic-byte mismatch
Oversized file
Path traversal filename
Unauthorized download
Object ID substitution
Dangerous file type
Duplicate/hash behavior where relevant
```

---

# 190. Security Regression Tests

كل security bug يتم إصلاحه يحتاج regression test مناسب قبل اعتباره closed.

---

# 191. CI Security Gates

Production-oriented CI يجب أن يشمل:

```text
Lint
Typecheck
Unit
Integration
Authorization negative tests
Migration verification
Architecture guards
Secret scan
Dependency scan
Security static checks
Production Astro build
E2E critical security tests
```

---

# 192. CI Secrets

Untrusted PR/build لا يحصل تلقائيًا على production secrets.

---

# 193. CI Token Privilege

CI token permissions:

```text
Least privilege
```

---

# 194. GitHub Actions Security

إذا استخدمت GitHub Actions:

Third-party Actions يفضل تثبيتها إلى trusted immutable reference/commit وفق CI policy.

---

# 195. Production Build

Security gate يتحقق أن:

```text
Server secrets not in client bundle
Debug mode off
Development diagnostics not exposed
Source maps handled according to policy
```

---

# 196. Source Maps

Production source-map exposure:

```text
POLICY / TOOLING DEPENDENT
```

إذا رفعت لمراقبة errors تكون private عند الإمكان.

---

# 197. Development Security

Development conveniences لا تنتقل تلقائيًا إلى Production.

مثل:

```text
debug endpoints
test users
seed passwords
open CORS
verbose errors
mock authentication
```

---

# 198. Test Data

Test data لا تستخدم production sensitive records إلا عبر عملية معتمدة ومناسبة.

---

# 199. Environment Isolation

```text
DEV
TEST
STAGING
PRODUCTION
```

لها:

```text
Separate DBs
Separate secrets
Separate storage where required
```

---

# 200. Production Database

Automated tests:

```text
MUST NOT
```

تتصل بProduction Database.

---

# 201. Health Endpoint Security

`/health` يعرض minimum generic state.

لا يعرض:

```text
DB credentials
Internal hostnames
Stack traces
Secret config
Full dependency topology
```

---

# 202. Readiness Security

`/readiness` يمكن أن يختبر dependencies لكن response الخارجي يبقى minimal.

Detailed diagnostics:

```text
Admin / internal observability only
```

---

# 203. Cache Security

أي caching لاحقًا يجب أن يضع في cache key:

```text
Authorization/scope context
```

حيث البيانات user/scoped.

---

# 204. Sensitive Response Caching

Authenticated sensitive pages/responses تحدد caching policy يمنع accidental shared-cache disclosure.

---

# 205. Browser Cache

Sensitive downloads/pages تحتاج review لـ:

```text
Cache-Control
```

حسب data type.

---

# 206. Referrer Leakage

Sensitive identifiers/tokens لا توضع في URLs قدر الإمكان.

`Referrer-Policy` يقلل leakage.

---

# 207. Query String Secrets

ممنوع وضع:

```text
Password
Session token
API key
Reset credential after avoidable handoff
```

في query string.

---

# 208. Security Decision Register

## SEC-001

```text
Decision:
OWASP ASVS 5.0 Level 2 baseline.

Status:
APPROVED
```

---

## SEC-002

```text
Decision:
Selected high-risk workflows receive deeper Level 3-style verification.

Status:
APPROVED
```

---

## SEC-003

```text
Decision:
Server-side opaque sessions.

Status:
APPROVED
```

---

## SEC-004

```text
Decision:
Authentication tokens are never stored in browser Web Storage.

Status:
APPROVED
```

---

## SEC-005

```text
Decision:
Argon2id for new password storage.

Minimum baseline:
19 MiB / t=2 / p=1

Status:
APPROVED
```

---

## SEC-006

```text
Decision:
Session cookie uses Secure + HttpOnly + __Host- semantics.

Status:
APPROVED
```

---

## SEC-007

```text
Decision:
SameSite=Strict default unless future authenticated cross-site flow requires approved change.

Status:
APPROVED
```

---

## SEC-008

```text
Decision:
Authorization remains server-side and Default Deny.

Status:
APPROVED
```

---

## SEC-009

```text
Decision:
Astro Actions are treated as public server entry points.

Status:
APPROVED
```

---

## SEC-010

```text
Decision:
Astro Origin protection must not be disabled without replacement control and approval.

Status:
APPROVED
```

---

## SEC-011

```text
Decision:
Custom cookie-authenticated transports require explicit CSRF review.

Status:
APPROVED
```

---

## SEC-012

```text
Decision:
CSP is restrictive by default.

Status:
APPROVED
```

---

## SEC-013

```text
Decision:
unsafe-eval is prohibited by default.

Status:
APPROVED
```

---

## SEC-014

```text
Decision:
unsafe-inline is not part of the default security baseline.

Status:
APPROVED
```

---

## SEC-015

```text
Decision:
Runtime PostgreSQL account is not superuser/database owner.

Status:
APPROVED
```

---

## SEC-016

```text
Decision:
Object storage is private by default.

Status:
APPROVED
```

---

## SEC-017

```text
Decision:
Security logging and QC audit are separate capabilities.

Status:
APPROVED
```

---

## SEC-018

```text
Decision:
Admin has no global business-rule bypass.

Status:
APPROVED
```

---

## SEC-019

```text
Decision:
AI has no controlled-action authority.

Status:
APPROVED
```

---

## SEC-020

```text
Decision:
Production secrets remain server-side and outside Git.

Status:
APPROVED
```

---

# 209. Deferred Security Decisions

| ID         | Decision                                    |
| ---------- | ------------------------------------------- |
| SD-SEC-001 | Password minimum length                     |
| SD-SEC-002 | Password history                            |
| SD-SEC-003 | Password expiration policy                  |
| SD-SEC-004 | Common password blocklist policy            |
| SD-SEC-005 | Idle session timeout                        |
| SD-SEC-006 | Absolute session timeout                    |
| SD-SEC-007 | Concurrent session limit                    |
| SD-SEC-008 | Login rate-limit threshold                  |
| SD-SEC-009 | Lockout/backoff policy                      |
| SD-SEC-010 | Password-reset expiration                   |
| SD-SEC-011 | MFA requirement                             |
| SD-SEC-012 | MFA roles                                   |
| SD-SEC-013 | E-Signature reauth freshness                |
| SD-SEC-014 | High-risk approval MFA/step-up              |
| SD-SEC-015 | File size limits                            |
| SD-SEC-016 | File MIME allowlists                        |
| SD-SEC-017 | Malware-scanning provider                   |
| SD-SEC-018 | Security-log retention                      |
| SD-SEC-019 | Audit cryptographic chaining                |
| SD-SEC-020 | Field-level encryption requirements         |
| SD-SEC-021 | Production restore security ceremony        |
| SD-SEC-022 | Backup key-management implementation        |
| SD-SEC-023 | SAST tool                                   |
| SD-SEC-024 | DAST tool                                   |
| SD-SEC-025 | Dependency-scanning tool                    |
| SD-SEC-026 | Secret-scanning tool                        |
| SD-SEC-027 | Security monitoring/SIEM provider           |
| SD-SEC-028 | External penetration-test requirement       |
| SD-SEC-029 | AI provider retention configuration         |
| SD-SEC-030 | External integration/webhook authentication |
| SD-SEC-031 | Production source-map policy                |
| SD-SEC-032 | Exact TLS cipher/platform configuration     |

---

# 210. Forbidden Security Patterns

ممنوع:

```text
Authorization in UI only

role === ADMIN → allow everything

Trust client userId

Trust client role

Trust client approval state

Trust client PASS/FAIL

JWT/session token in localStorage

Plaintext passwords

Fast password hash such as SHA-256

Raw SQL from user input

Generic SQL string concatenation

Public evidence bucket

Permanent public file URLs

User filename as storage path

Sensitive stack traces

Passwords in logs

Session tokens in logs

Secrets in Git

GET request changing state

Disabling CSRF protection silently

Wildcard CORS with credentials

Raw AI output trusted as HTML

AI business authorization

External URL fetch from arbitrary user input

Admin rewriting approved historical records

Tests against production database

Production DB superuser used by application

Security claim without evidence
```

---

# 211. High-Risk Feature Security Checklist

قبل تسليم أي high-risk feature:

```text
[ ] Authenticated
[ ] Server-authorized
[ ] Scope checked
[ ] SoD checked
[ ] State checked
[ ] Version checked
[ ] Input validated
[ ] CSRF protected
[ ] IDOR tested
[ ] Replay considered
[ ] Transaction boundary defined
[ ] Audit written
[ ] Sensitive errors hidden
[ ] Security logs appropriate
[ ] Negative tests exist
[ ] Direct endpoint/action invocation tested
[ ] Evidence current
```

---

# 212. Authentication Checklist

```text
[ ] Argon2id
[ ] Secure HttpOnly cookie
[ ] Opaque session
[ ] CSPRNG token
[ ] Server-side hashed token
[ ] Session fixation prevented
[ ] Logout revokes
[ ] Disabled account blocked
[ ] Reset token single-use
[ ] Reset revokes sessions
[ ] Rate protection
[ ] No enumeration leakage
```

---

# 213. Astro Security Checklist

```text
[ ] Server/on-demand rendering
[ ] security.checkOrigin remains enabled
[ ] Trusted host validated
[ ] Middleware resolves actor safely
[ ] Action reauthorizes
[ ] Custom JSON mutations receive CSRF review
[ ] No secrets in client bundle
[ ] No raw DB access from pages
[ ] No business authorization only in UI
```

---

# 214. Authorization Checklist

```text
[ ] Explicit permission
[ ] Default Deny
[ ] Scope
[ ] Entity
[ ] State
[ ] Ownership/assignment
[ ] SoD
[ ] Version
[ ] E-Signature where required
[ ] Negative permission tests
[ ] IDOR tests
```

---

# 215. File Security Checklist

```text
[ ] Authenticate uploader
[ ] Authorize parent
[ ] Size checked
[ ] Extension allowed
[ ] MIME checked
[ ] Signature/magic bytes checked where possible
[ ] Safe random storage key
[ ] Original filename metadata only
[ ] SHA-256 stored
[ ] Private storage
[ ] Authorized download
[ ] Dangerous type handling
[ ] Malware policy applied
```

---

# 216. Security Definition of Done

Security portion من Feature لا تعتبر Done إلا إذا:

```text
Threats identified
Trust boundaries respected
Authentication verified
Authorization verified
Input validated
Output safely rendered
CSRF assessed
IDOR assessed
Injection assessed
Transactions safe
Concurrency safe
Audit present
Security logging appropriate
Secrets protected
Negative tests executed
Evidence current
```

---

# 217. Security PASS Rule

لا تستخدم:

```text
SECURE
PASS
ASVS compliant
Production secure
```

إلا بوجود:

```text
Requirement
Implementation
Executed verification
Negative cases
Current commit
Current environment
Evidence
Known limitations
```

---

# 218. Current Foundation Status

هذه الوثيقة:

```text
Defines security architecture
```

ولا تثبت أن controls:

```text
Implemented
Tested
Operational
Production Ready
```

حتى يوجد application implementation ودليل حالي.

---

# 219. Relationship to Future Documents

```text
SECURITY-ARCHITECTURE.md
        ↓
DATABASE-ARCHITECTURE.md
        ↓
ERROR-ARCHITECTURE.md
        ↓
TESTING-STRATEGY.md
        ↓
DESIGN-SYSTEM.md
        ↓
UI-UX-SPECIFICATION.md
        ↓
Implementation
        ↓
Security Verification Evidence
```

---

# 220. Final Security Model

```text
┌───────────────────────────────────────┐
│               Browser                 │
│        UNTRUSTED INPUT BOUNDARY       │
└───────────────────┬───────────────────┘
                    │ HTTPS
┌───────────────────▼───────────────────┐
│ Trusted Host / Headers / CSRF / CSP   │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│          Astro Middleware             │
│ Request ID / Session / Actor Context  │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│        Action / API Entry Point       │
│ Validation + Reauthorization          │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│     Central Authorization Engine      │
│ Permission / Scope / SoD / State      │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│        Application / Domain           │
│     Rules / State / Transactions      │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│              PostgreSQL               │
│ Current Truth / History / Sessions    │
└───────────────────┬───────────────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      QC Audit          Security Logs
```

---

# 221. Final Principle

> **Authenticate identity.
> Authorize every action.
> Trust no client state.
> Preserve controlled history.
> Minimize privilege.
> Protect secrets.
> Validate every boundary.
> Record important security evidence.
> Deny what has not been explicitly approved.**

---

# 222. Document Status

```text
Document:
Documents/SECURITY-ARCHITECTURE.md

Version:
1.0

Security Baseline:
OWASP ASVS 5.0 Level 2
+ selected high-risk Level 3 controls

Framework:
Astro Server / On-demand

Authentication:
Server-side opaque sessions

Password Storage:
Argon2id

Session:
Secure HttpOnly host-bound cookie

Authorization:
Centralized Server-side
Default Deny

CSRF:
SameSite
+ Origin validation
+ Astro protection
+ explicit protection where framework coverage is insufficient

XSS:
Context-safe rendering
+ restrictive CSP

SQL Injection:
Parameterized queries / allowlisted dynamic SQL

Files:
Validated
Private
Authorization-protected
SHA-256 tracked

Secrets:
Server-only / outside Git

Audit:
Separate from security/application logging

Admin:
No business-rule bypass

AI:
Advisory only
No controlled authority

Policy Unknown:
DENY / BLOCK where security-sensitive

Security Claims:
Evidence required

Status:
FOUNDATION — APPROVED SECURITY ARCHITECTURE BASELINE
```

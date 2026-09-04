# OBSERVABILITY-ARCHITECTURE.md

# QC Operations & Laboratory Management System
## Observability Architecture Specification — v1.0

**Document Path:** `Documents/OBSERVABILITY-ARCHITECTURE.md`  
**Status:** FOUNDATION — APPROVED OBSERVABILITY ARCHITECTURE BASELINE  
**Product:** QC Operations & Laboratory Management System  
**Architecture:** Modular Monolith  
**Web Framework:** Astro — Server / On-demand  
**Runtime:** Node.js  
**Database:** PostgreSQL 18.x  
**Primary Telemetry Model:** OpenTelemetry-first / Vendor-neutral  
**Primary Signals:** Traces + Metrics + Structured JSON Logs + Health/Readiness  
**Correlation:** `requestId` + `traceId` + `spanId`  
**Telemetry Gateway:** OpenTelemetry Collector preferred  
**Transport:** OTLP preferred  
**Operational Timezone:** `Asia/Riyadh`  

---

# 1. Purpose

هذه الوثيقة تحدد كيف يراقب النظام نفسه وكيف يتم اكتشاف وفهم الأعطال والتدهور والمخاطر التشغيلية بدون خلط الـobservability مع الحقيقة التجارية أو سجل الـQC Audit.

الهدف هو الإجابة عن:

```text
Is the application healthy?
Is it ready to serve traffic?
Which request failed?
Where did it fail?
Which dependency is degraded?
Is PostgreSQL healthy?
Are locks/deadlocks increasing?
Is the outbox delayed?
Are notifications/files/backups failing?
Did a deployment introduce a regression?
Can an incident be correlated from user-visible requestId to traces/logs?
```

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
        ↓
RISK-REGISTER.md
        ↓
ROUTE-MANIFEST-SPECIFICATION.md
        ↓
OBSERVABILITY-ARCHITECTURE.md
```

Observability لا تغيّر Business Rules أو Authorization أو State Machines.

---

# 3. Core Principle

> **Observe the system without turning telemetry into business truth.**

Telemetry تساعدنا نفهم النظام.

لكن:

```text
Telemetry ≠ QC Audit
Telemetry ≠ E-Signature evidence
Telemetry ≠ Official PASS/FAIL
Telemetry ≠ Release authority
Telemetry ≠ Backup/Restore evidence by itself
```

---

# 4. Approved Architecture

المعتمد هو:

> **OpenTelemetry Hybrid Observability Architecture**

```text
Application
├─ Structured JSON Logs
├─ OpenTelemetry Traces
├─ OpenTelemetry Metrics
├─ Health / Readiness
└─ Correlation Context
          ↓
OpenTelemetry Collector / Platform Pipeline
          ↓
Logs / Metrics / Traces Backend(s)
```

الـapplication لا ترتبط مباشرة بمزوّد Observability محدد داخل الـDomain/Application code.

---

# 5. Why Hybrid

OpenTelemetry JavaScript current status:

```text
Traces  → Stable
Metrics → Stable
Logs    → Development
```

لذلك v1 يعتمد:

```text
OpenTelemetry
→ Traces + Metrics

Structured JSON Logging
→ Primary application/security/operational logging mechanism
```

مع correlation بين logs والـtraces.

---

# 6. Vendor Neutrality

الـFoundation لا يعتمد:

```text
Datadog-specific business code
New Relic-specific domain code
Sentry-specific domain code
Vendor-specific trace IDs as system contracts
```

Preferred:

```text
Application
→ Shared Observability Abstraction / OpenTelemetry
→ OTLP / Collector
→ Backend
```

---

# 7. Observability Signals

Canonical signals:

```text
LOGS
METRICS
TRACES
HEALTH / READINESS
```

Derived operational capabilities:

```text
ALERTS
DASHBOARDS
INCIDENT CORRELATION
DEPLOYMENT COMPARISON
CAPACITY / TREND ANALYSIS
```

---

# 8. Correlation Model

كل inbound request يحصل على:

```text
requestId
traceId
spanId
```

هذه identifiers مترابطة لكن غير متطابقة في الوظيفة.

---

# 9. `requestId`

`requestId` هو system-safe support/reference identifier.

يستخدم في:

```text
Error response
User-visible failure reference
Structured log correlation
Security event correlation
Incident investigation
```

ويستمر كـcanonical reference في `ERROR-ARCHITECTURE.md`.

---

# 10. `traceId`

`traceId` يربط spans داخل distributed/request trace.

لا يعرض للمستخدم عادة إلا في privileged diagnostics.

---

# 11. `spanId`

`spanId` يمثل operation واحدة داخل trace.

Examples:

```text
authorization.evaluate
inspection.load
inspection.approve
postgres.query
outbox.enqueue
```

---

# 12. Trace Context

Propagation baseline:

```text
W3C Trace Context
traceparent
tracestate
```

Incoming trace context يعتبر untrusted propagation metadata وليس Authorization proof.

---

# 13. Resource Identity

Telemetry resource attributes تشمل منخفضة الـcardinality مثل:

```text
service.name
service.version
deployment.environment.name
service.instance.id
```

Recommended:

```text
service.name = qc-operations-laboratory-management-system
```

`service.version` يجب أن يرتبط بالـrelease/commit SHA عند deployment.

---

# 14. Environment Separation

Canonical environments:

```text
local
test
staging
production
```

كل telemetry يجب أن تحمل environment context.

Production telemetry لا تختلط مع test traffic.

---

# 15. Structured Logging

Application logging output يكون structured JSON قدر الإمكان.

Conceptual shape:

```json
{
  "timestamp": "2026-09-04T12:45:00Z",
  "level": "error",
  "event": "inspection.approval.failed",
  "requestId": "req_...",
  "traceId": "...",
  "spanId": "...",
  "environment": "production",
  "domain": "quarantine",
  "operation": "inspection.approve",
  "errorCode": "CONFLICT_STALE_VERSION"
}
```

---

# 16. Log Levels

Canonical:

```text
TRACE
DEBUG
INFO
WARN
ERROR
FATAL
```

Production baseline:

```text
INFO+
```

مع إمكانية رفع verbosity مؤقتًا بشكل controlled عند investigation.

---

# 17. Event Naming

Structured event names تستخدم:

```text
<domain>.<subject>.<event>
```

Examples:

```text
auth.login.failed
authz.operation.denied
inspection.approval.failed
lab.submission.completed
files.upload.rejected
outbox.delivery.failed
backup.restore.verify_failed
```

لا نعتمد parsing لنصوص human messages لاستخراج المعنى.

---

# 18. Logs Are Not Audit

```text
Application Log
≠
QC Audit Event
```

Application log example:

```text
PostgreSQL query timeout
```

QC Audit example:

```text
INSP-2026-0044 approved by actor X at trusted time
```

الـAudit يجب أن يبقى durable controlled business history داخل architecture الخاصة به.

---

# 19. Logs Are Not Security Audit

Security logging له semantics مستقلة.

Examples:

```text
Authentication failure
Authorization denial
Session revocation
CSRF rejection
IDOR attempt
Permission administration
Suspicious upload rejection
```

Security telemetry لا تحل محل business audit.

---

# 20. Security Event Contract

Security event يجب أن يحتوي safe fields مثل:

```text
event type
trusted timestamp
requestId
traceId where available
actor technical ID where appropriate
anonymous/authenticated context
target type
operation
outcome
safe reason family
environment
```

ولا يحتوي secrets.

---

# 21. Sensitive Data Rule

Observability pipeline لا تسجل افتراضيًا:

```text
Passwords
Password hashes
Session tokens
Cookies
Authorization headers
Reset tokens
API keys
Database credentials
Private keys
Full uploaded-file contents
Full controlled-document contents
Raw evidence bodies
Secrets from environment
```

---

# 22. Free-Text Logging

Free-text business content يعتبر risky.

Fields مثل:

```text
comments
NCR descriptions
RCA narratives
AI prompts
AI responses
```

لا تسجل كاملة افتراضيًا.

استخدم identifiers / safe classifications بدل payload content.

---

# 23. Redaction

Preferred model:

```text
Known-safe fields allowlist
+
Redaction for known sensitive keys
```

Redaction يجب تطبيقها قبل export قدر الإمكان.

---

# 24. Metrics Cardinality Rule

Metric labels يجب أن تكون bounded.

Allowed examples:

```text
route_template
http_method
status_class
domain
operation
error_family
environment
dependency
outcome
```

Forbidden labels:

```text
userId
recordId
businessId
requestId
traceId
spanId
fileId
email
sessionId
raw URL containing UUID
```

---

# 25. HTTP Metrics

Minimum application HTTP metrics:

```text
request count
request duration
5xx count/rate
4xx count/rate
active requests
```

Grouped using normalized route template.

Example:

```text
/quarantine/inspections/:inspectionId/review
```

وليس UUID actual.

---

# 26. RED Model

Endpoint/service health follows:

```text
Rate
Errors
Duration
```

لكل relevant application operation.

---

# 27. Trace Span Naming

Business-relevant spans تستخدم canonical operation names.

Examples:

```text
auth.session.resolve
authorization.evaluate
task.create
inspection.submit
inspection.approve
quarantine.release
lab.submit
lab.approve
document.approve
capa.close
backup.restore
```

---

# 28. Example Controlled Trace

```text
HTTP POST
│
├─ auth.session.resolve
├─ authorization.evaluate
├─ inspection.approve
│  ├─ inspection.load
│  ├─ state.validate
│  ├─ sod.evaluate
│  ├─ transaction.begin
│  ├─ db.inspection.update
│  ├─ db.approval.insert
│  ├─ db.audit.insert
│  ├─ db.outbox.insert
│  └─ transaction.commit
└─ response
```

Trace يساعد investigation، لكنه لا يصبح audit record.

---

# 29. Authorization Telemetry

Authorization metrics/events يمكن أن تتضمن:

```text
allow
deny
scope deny
SoD deny
state deny
permission missing
account disabled
```

Grouped by domain/operation.

لا نستخدم user ID كـmetric dimension.

---

# 30. Authorization Denial Spike

ارتفاع denial rate قد يعني:

```text
Attack
Misconfiguration
Broken release
Incorrect permission assignment
Unexpected client behavior
```

لذلك يمثل security + operational signal.

---

# 31. Controlled Operations

Tier-1/high-risk operations تحتاج enhanced correlation:

```text
Approval
Release
Official PASS/FAIL transition
E-Signature
Void
Close
Retest
Permission changes
Restore
```

لكن business evidence remains audit/e-signature records.

---

# 32. PostgreSQL Observability

Observability تغطي مستويين:

```text
Application DB Client / Pool
+
PostgreSQL Server
```

---

# 33. Database Client / Pool Metrics

راقب:

```text
pool total connections
pool idle connections
pool waiting requests
connection acquire duration
query duration
query failures
connection failures
transaction duration
```

---

# 34. PostgreSQL Server Signals

استخدم official PostgreSQL statistics views مثل:

```text
pg_stat_activity
pg_stat_database
pg_stat_io
```

مع signals مثل:

```text
active sessions
idle-in-transaction sessions
transaction commit/rollback
lock waits
deadlocks
I/O activity
database size
temporary files/checkpoint-related signals where useful
```

---

# 35. Long Transaction Monitoring

Long-running transactions مهمة لأنها قد تؤثر على:

```text
Approvals
Release
Concurrency
Business-number generation
General throughput
```

Monitor:

```text
transaction duration
idle in transaction
lock wait duration
```

Exact thresholds deferred.

---

# 36. Deadlocks / Serialization

Track:

```text
deadlock count
serialization failure count
retry count
retry exhausted count
```

زيادة مفاجئة تعتبر operational signal عالية الأولوية.

---

# 37. Optimistic Concurrency Signals

Track canonical conflicts مثل:

```text
CONFLICT_STALE_VERSION
```

Metrics can be grouped by:

```text
domain
operation
```

هذا يساعد رصد workflow contention الحقيقي.

---

# 38. Idempotency Signals

Track:

```text
idempotent replay detected
duplicate command prevented
idempotency conflict
```

بدون تخزين idempotency key نفسها في metrics.

---

# 39. Outbox Observability

Durable Outbox يجب أن تكون observable.

Metrics:

```text
pending messages
oldest pending age
processed rate
failure count
retry count
terminal/dead-letter count if implemented
```

---

# 40. Outbox Alert Logic

High-risk condition:

```text
Business commits continue
+
Outbox oldest pending age keeps growing
```

هذا يعني side effects/notifications/integrations قد تكون متوقفة رغم نجاح business transaction.

---

# 41. Notification Observability

Track:

```text
queued
sent
failed
retrying
delivery latency
provider unavailable
```

Notification failure لا يلغي business mutation بعد successful commit إذا notification non-atomic by architecture.

---

# 42. File / Object Storage Observability

Track:

```text
upload count
upload failures
download failures
latency
storage availability
file validation failures
```

---

# 43. File Security Signals

Track counts مثل:

```text
extension rejected
MIME mismatch
content-signature mismatch
oversize upload
malware detection if scanner exists
unauthorized download denial
```

لا تستخدم filenames كـmetric label.

---

# 44. Authentication Metrics

Track:

```text
login attempts
login success
login failure
session expired
session revoked
account disabled denial
password recovery outcome if enabled
```

Security dashboard access محدود.

---

# 45. E-Signature Observability

Track:

```text
reauth attempt
reauth failure
signature success
stale-version failure
SoD denial
replay rejection
```

Signature evidence الرسمية تبقى في controlled persistence.

---

# 46. AI Observability

Track:

```text
AI request count
latency
provider failures
validation failures
provider availability
token/cost metrics if safely available and operationally useful
```

ولا نسجل افتراضيًا:

```text
full prompt
full response
controlled record content
```

---

# 47. AI Failure Isolation

AI advisory provider unavailable:

```text
AI capability = DEGRADED
```

لكن core QC system may remain:

```text
READY
```

لأن AI ليست authority ولا core transaction dependency.

---

# 48. Business Dashboard vs Observability Dashboard

```text
Business Dashboard
→ QC operations truth

Observability Dashboard
→ System/runtime health
```

Business examples:

```text
HOLD
NCR
CAPA
PASS
Pending approvals
```

Observability examples:

```text
5xx rate
latency
DB pool saturation
outbox backlog
deadlocks
storage availability
```

لا نخلطهم.

---

# 49. Health Model

Canonical health concepts:

```text
LIVENESS
READINESS
DEPENDENCY HEALTH
SYSTEM HEALTH UI
```

---

# 50. Liveness

Potential machine endpoint:

```text
GET /api/health/live
```

Meaning:

```text
Is this application process alive?
```

Liveness لا تعمل heavy dependency checks.

---

# 51. Readiness

Potential endpoint:

```text
GET /api/health/ready
```

Meaning:

```text
Can this instance safely serve core application traffic?
```

Critical checks may include:

```text
PostgreSQL connectivity
required runtime configuration
critical initialization
```

---

# 52. Dependency Classification

Dependencies classify as:

```text
CRITICAL
DEGRADING
OPTIONAL
```

Examples:

```text
PostgreSQL unavailable
→ NOT READY

Optional AI provider unavailable
→ READY + DEGRADED AI
```

Exact classification per integration defined when integration is approved.

---

# 53. System Health UI

Authenticated route:

```text
/system/health
```

يمكن تعرض authorized sanitized status لـ:

```text
Application
Database
Storage
Outbox
Notifications
External integrations
Backup/Recovery
```

لا تعرض secrets أو raw infrastructure credentials.

---

# 54. Health Status Vocabulary

```text
HEALTHY
DEGRADED
UNAVAILABLE
UNKNOWN
```

كل status يجب أن يكون مبنيًا على check حقيقية، وليس cosmetic state.

---

# 55. Backup Observability

Track:

```text
last backup attempt
last successful backup
backup duration
backup size
integrity verification outcome
```

لكن:

```text
Backup success ≠ Recovery proven
```

---

# 56. Restore Verification Observability

Track:

```text
last restore verification
restore verification result
restore duration
backup reference
environment
```

Restore verification evidence قد تحتاج controlled operational record منفصل.

---

# 57. Release / Deployment Identity

Telemetry تربط deployment بـ:

```text
service.version
Git commit SHA
release/environment
```

هذا يسمح comparison:

```text
Before deployment
vs
After deployment
```

---

# 58. Deployment Events

Where platform permits:

```text
deployment.started
deployment.completed
deployment.failed
```

تستخدم كoperational markers.

---

# 59. Alert Severity Model

Canonical conceptual severity:

```text
P1 — Critical outage / integrity threat
P2 — Major degradation / high-risk function impaired
P3 — Degradation requiring investigation
P4 — Informational / trend
```

Exact on-call/escalation workflow deferred.

---

# 60. P1 Examples

```text
PostgreSQL unavailable
Authentication unavailable system-wide
Controlled write path unavailable
Suspected audit persistence failure
Critical data-integrity condition
Required restore verification failure
```

---

# 61. P2 Examples

```text
High sustained 5xx rate
Severe pool exhaustion
Outbox backlog growing
Storage unavailable
Deadlock spike
Repeated controlled-action failure
```

---

# 62. P3 Examples

```text
Elevated latency
Notification provider degraded
AI provider unavailable
Repeated file validation/provider failures
```

---

# 63. Alert Threshold Rule

Exact numeric thresholds are NOT invented in Foundation.

Do not hardcode arbitrary assumptions like:

```text
5% errors
500ms latency
10 deadlocks
```

until supported by:

```text
Expected traffic
Operational baseline
Performance testing
Hosting capacity
Business criticality
SLOs
```

---

# 64. Service Level Indicators

Foundation SLIs:

```text
application availability
request success rate
request latency
controlled mutation success
database availability
outbox delivery latency
storage availability
backup success
restore verification freshness
```

---

# 65. SLOs

Exact numerical SLO targets:

```text
DEFERRED
```

Examples such as:

```text
99.9%
p95 < X ms
```

must come from approved operational requirements.

---

# 66. Error Budget

Error budgets are architecture-compatible but not Foundation requirement until SLOs are approved.

---

# 67. Sampling

Trace sampling may be used in production.

Principle:

```text
Errors / Tier-1 controlled operations
→ favor retention

High-volume normal reads
→ may be sampled
```

Exact sampling percentages deferred.

---

# 68. Audit Is Never Telemetry-Sampled

```text
QC Audit
E-Signature Evidence
Controlled Business History
```

لا تخضع trace sampling لأنها ليست telemetry truth.

---

# 69. Retention

Exact retention periods for:

```text
logs
metrics
traces
security telemetry
```

are:

```text
SECURITY / OPERATIONS / COMPLIANCE POLICY-DEPENDENT
```

ولا يتم اختراع 30/90/365 يوم.

---

# 70. Observability Access Control

Observability backends تعتبر sensitive operational systems.

Use:

```text
least privilege
production access restrictions
environment separation
admin/audit of access where supported
```

---

# 71. Production vs Non-Production

Production telemetry access أضيق من local/test.

لا تستخدم production secrets/data في test telemetry.

---

# 72. Local Development

Local baseline يسمح:

```text
structured console logs
optional local traces
optional local metrics
```

Developer لا يحتاج cloud observability backend لتشغيل التطبيق محليًا.

---

# 73. Telemetry Failure Rule

> **Observability export failure must not normally fail a controlled business transaction.**

إذا trace exporter أو metrics backend unavailable:

```text
business transaction may continue
```

بشرط أن business-required audit/evidence persistence نفسها سليمة.

---

# 74. No External Wait Inside Critical Transaction

لا ننتظر synchronous observability vendor call داخل DB transaction critical.

Correct:

```text
Business transaction
→ commit
→ telemetry exported asynchronously/buffered
```

---

# 75. OpenTelemetry Collector

Preferred topology:

```text
Application
→ OTLP
→ OpenTelemetry Collector
→ one or more observability backends
```

Collector يوفر vendor-neutral receive/process/export layer.

---

# 76. Collector Security

Collector itself يحتاج:

```text
authentication where applicable
network restriction
TLS where applicable
resource limits
secret management
least privilege
```

لا نفترض أنه trusted لمجرد أنه observability component.

---

# 77. Transport

Preferred telemetry transport:

```text
OTLP
```

Exact deployment transport:

```text
OTLP/HTTP protobuf
or
OTLP/gRPC
```

depends on runtime/hosting environment.

---

# 78. Logging Export

v1 preference:

```text
Structured JSON
→ stdout/stderr
→ platform/log pipeline
```

يمكن لاحقًا route logs عبر Collector إذا backend/platform architecture تستفيد.

---

# 79. Source Structure

Conceptual shared module:

```text
src/shared/observability/
├── logger.ts
├── telemetry.ts
├── tracing.ts
├── metrics.ts
├── context.ts
├── redaction.ts
├── health.ts
├── security-events.ts
└── instrumentation/
```

Exact files finalized in implementation planning.

---

# 80. Domain Dependency Rule

Domain/Application must not import vendor SDKs directly.

Forbidden:

```text
Laboratory Domain
→ Datadog SDK
```

Preferred:

```text
Application / Shared capability
→ Observability abstraction / OTel API
```

---

# 81. Error Architecture Integration

`AppError` integration:

```text
AppError
→ safe user mapping
→ structured error event
→ requestId/trace correlation
```

Internal cause can be logged safely after redaction.

No raw internal exception leakage to browser.

---

# 82. Error Code Metrics

Metrics can aggregate stable families/codes such as:

```text
AUTH_*
AUTHZ_*
VALIDATION_*
DOMAIN_*
CONFLICT_*
RESOURCE_*
SYSTEM_*
```

لكن avoid unbounded message labels.

---

# 83. Route Manifest Integration

HTTP metrics/traces use canonical route templates from Route Manifest.

Example:

```text
/quarantine/receiving/:receivingId
```

not raw URL with UUID.

---

# 84. Testing Requirements

Observability requires automated/operational verification.

Minimum examples:

```text
requestId generated
requestId preserved through error mapping
trace correlation present
secret redaction works
metric labels remain bounded
health endpoint returns correct semantic state
readiness fails when PostgreSQL unavailable
optional AI outage does not mark core application dead
telemetry exporter outage does not roll back business transaction
```

---

# 85. Security Testing

Tests should verify telemetry does NOT leak:

```text
passwords
cookies
session tokens
Authorization headers
reset tokens
DB connection secrets
full stack traces to client
controlled payload contents by default
```

---

# 86. Database Observability Tests

Where practical verify:

```text
query failure increments expected signal
pool saturation observable
stale-version conflicts observable
deadlock/serialization paths produce expected telemetry in integration tests
```

without making tests dependent on external vendor backend.

---

# 87. Health Tests

Liveness test:

```text
process alive
→ healthy liveness
```

Readiness test:

```text
PostgreSQL unavailable
→ not ready
```

Optional provider test:

```text
AI unavailable
→ degraded AI
→ core readiness may remain healthy
```

---

# 88. Observability Evidence for Readiness

Production readiness should include current evidence that:

```text
logs are emitted
request correlation works
metrics are emitted
traces are emitted where enabled
critical health endpoints behave correctly
critical alerts are configured/tested where required
PostgreSQL monitoring exists
outbox monitoring exists if outbox implemented
backup/restore signals exist
```

وجود architecture document وحده لا يثبت implementation.

---

# 89. Operational Dashboard Families

Recommended future dashboard families:

```text
Application Health
HTTP / RED
PostgreSQL / Pool
Critical Workflow Errors
Security Signals
Outbox / Notifications
Files / Storage
Backup / Restore
AI / External Dependencies
```

---

# 90. Application Health Dashboard

Should answer:

```text
Is the service available?
Is it ready?
Is error rate elevated?
Is latency elevated?
Which deployment version is active?
```

---

# 91. PostgreSQL Dashboard

Should answer:

```text
Connection pressure?
Long transactions?
Lock waits?
Deadlocks?
Rollback spike?
I/O pressure?
Database growth?
```

---

# 92. Security Signals Dashboard

Restricted dashboard can include:

```text
login failure trend
authorization denial trend
SoD denials
session revocations
CSRF/security rejection events
file-security rejections
permission administration activity indicators
```

No raw secrets.

---

# 93. Critical Workflow Error Dashboard

Track failure families for:

```text
Inspection approval
Release
Lab approval
E-Signature
Document approval
CAPA closure
Permission administration
Restore
```

This dashboard observes technical outcomes, not business KPI performance.

---

# 94. Incident Correlation Workflow

Recommended investigation flow:

```text
User reports requestId
        ↓
Find structured log
        ↓
traceId
        ↓
Open trace
        ↓
Locate failing span
        ↓
Check dependency / DB / errorCode
        ↓
Cross-reference Audit only if controlled business action occurred
```

---

# 95. Ambiguous Commit Observability

إذا network timeout occurs after possible commit:

Telemetry should preserve:

```text
requestId
operation
transaction/commit outcome if known
idempotency context classification
```

لكن recovery logic follows Error Architecture/idempotency/current-state checks.

---

# 96. Time

Telemetry timestamps use UTC internally.

Operational dashboards may display:

```text
Asia/Riyadh
```

but raw correlation remains UTC-safe.

---

# 97. Clock Source

Official business event time uses trusted server/database time.

Observability clocks must be synchronized sufficiently for trace/log correlation.

Browser time is not authoritative.

---

# 98. Data Freshness

Operational dashboard panels should show freshness/update time where backend data may lag.

Especially:

```text
outbox backlog
backup state
restore verification
external dependency health
```

---

# 99. Observability Decision Register

## OBS-001

```text
Decision:
Use an OpenTelemetry-first vendor-neutral architecture.

Status:
APPROVED
```

## OBS-002

```text
Decision:
OpenTelemetry Traces and Metrics are canonical v1 telemetry signals.

Status:
APPROVED
```

## OBS-003

```text
Decision:
Structured JSON logging is the canonical v1 application logging mechanism.

Status:
APPROVED
```

## OBS-004

```text
Decision:
OpenTelemetry JavaScript Logs SDK is not a required v1 foundation dependency while its implementation status remains Development.

Status:
APPROVED
```

## OBS-005

```text
Decision:
requestId, traceId and spanId are correlated but remain distinct identifiers.

Status:
APPROVED
```

## OBS-006

```text
Decision:
W3C Trace Context is the propagation baseline.

Status:
APPROVED
```

## OBS-007

```text
Decision:
OpenTelemetry Collector is the preferred telemetry gateway.

Status:
APPROVED
```

## OBS-008

```text
Decision:
OTLP is the preferred telemetry transport.

Status:
APPROVED
```

## OBS-009

```text
Decision:
Application Logs, QC Audit and Security Logging are distinct concerns.

Status:
APPROVED
```

## OBS-010

```text
Decision:
Secrets and sensitive payloads are excluded/redacted from telemetry by default.

Status:
APPROVED
```

## OBS-011

```text
Decision:
High-cardinality entity/user/request identifiers are forbidden as metric labels.

Status:
APPROVED
```

## OBS-012

```text
Decision:
PostgreSQL client/pool and PostgreSQL server health are explicitly observable.

Status:
APPROVED
```

## OBS-013

```text
Decision:
Outbox, notifications, files/storage, backup/restore and AI integrations have explicit telemetry requirements when implemented.

Status:
APPROVED
```

## OBS-014

```text
Decision:
Liveness and Readiness are distinct signals.

Status:
APPROVED
```

## OBS-015

```text
Decision:
An optional AI provider outage does not automatically make the core QC application unready.

Status:
APPROVED
```

## OBS-016

```text
Decision:
Observability backend/export failure does not normally block controlled business transactions.

Status:
APPROVED
```

## OBS-017

```text
Decision:
Exact alert thresholds are baseline/SLO dependent and are not guessed in Foundation.

Status:
APPROVED
```

## OBS-018

```text
Decision:
Exact telemetry retention periods are policy-dependent.

Status:
APPROVED
```

## OBS-019

```text
Decision:
QC Audit and controlled evidence are never sampled as ordinary telemetry.

Status:
APPROVED
```

## OBS-020

```text
Decision:
Production-readiness claims require fresh observability verification evidence appropriate to implemented scope.

Status:
APPROVED
```

---

# 100. Deferred Observability Decisions

| ID | Decision |
|---|---|
| DO-OBS-001 | Exact observability backend/vendor |
| DO-OBS-002 | Exact logging library |
| DO-OBS-003 | Exact OpenTelemetry package versions |
| DO-OBS-004 | OTLP/HTTP vs OTLP/gRPC deployment choice |
| DO-OBS-005 | Exact Collector deployment topology |
| DO-OBS-006 | Trace sampling percentages |
| DO-OBS-007 | Numeric alert thresholds |
| DO-OBS-008 | Numerical SLO targets |
| DO-OBS-009 | Telemetry retention periods |
| DO-OBS-010 | On-call/escalation policy |
| DO-OBS-011 | Exact dashboard backend/tooling |
| DO-OBS-012 | Exact PostgreSQL exporter/collection mechanism |
| DO-OBS-013 | Exact security-event retention/access policy |
| DO-OBS-014 | Exact external synthetic monitoring strategy |
| DO-OBS-015 | Exact browser-side telemetry adoption |

---

# 101. Forbidden Observability Patterns

```text
Vendor SDK imports inside Domain logic
Logging passwords/tokens/cookies
Logging raw Authorization headers
Logging full controlled payloads by default
Using requestId/userId/recordId as metric labels
Using raw dynamic URLs as route labels
Treating logs as QC Audit
Treating traces as E-Signature evidence
Sampling away business audit history
Synchronous vendor call inside critical DB transaction
Making optional AI outage fail core readiness
Hardcoding arbitrary SLOs/alerts without evidence
Publicly exposing raw health diagnostics
Returning stack traces/SQL to users
Calling the system observable because logs merely exist
```

---

# 102. Implementation Checklist

```text
[ ] Generate requestId for inbound requests
[ ] Preserve requestId through errors/logs
[ ] Configure OpenTelemetry resource identity
[ ] Configure trace context propagation
[ ] Instrument Astro/HTTP request lifecycle
[ ] Instrument core Application Use Cases
[ ] Instrument PostgreSQL safely
[ ] Configure metrics with bounded labels
[ ] Implement structured JSON logger
[ ] Implement redaction/allowlist rules
[ ] Implement security-event abstraction
[ ] Implement liveness
[ ] Implement readiness
[ ] Implement System Health authorized view
[ ] Add DB pool metrics
[ ] Add PostgreSQL server monitoring
[ ] Add concurrency/deadlock signals
[ ] Add outbox telemetry when outbox exists
[ ] Add files/storage telemetry when storage exists
[ ] Add backup/restore telemetry when platform exists
[ ] Add AI dependency telemetry when AI enabled
[ ] Configure Collector/backend
[ ] Add dashboards
[ ] Add alerts
[ ] Test telemetry failure isolation
[ ] Test secret redaction
```

---

# 103. Production Readiness Checklist

```text
[ ] Application version/commit visible in telemetry
[ ] Production environment isolated
[ ] requestId correlation verified
[ ] trace correlation verified where tracing enabled
[ ] structured logging verified
[ ] secrets absent from representative telemetry
[ ] route labels bounded
[ ] PostgreSQL health observable
[ ] pool saturation observable
[ ] deadlocks/long transaction signals available
[ ] liveness verified
[ ] readiness verified
[ ] critical dependency behavior verified
[ ] core alerts tested where required
[ ] outbox observable if implemented
[ ] backup status observable if implemented
[ ] restore verification observable if implemented
[ ] telemetry exporter failure does not break critical transaction
[ ] evidence captured for current release
```

---

# 104. Current Foundation Status

هذه الوثيقة تعتمد architecture فقط.

لا تعني أن:

```text
OpenTelemetry installed
Collector deployed
Dashboards created
Alerts configured
PostgreSQL exporter configured
Health endpoints implemented
```

Current implementation evidence remains:

```text
UNVERIFIED
```

حتى يوجد code/runtime/current evidence.

---

# 105. External Standards / Technical References

Foundation technical verification used current official sources including:

```text
OpenTelemetry JavaScript documentation
OpenTelemetry Collector documentation
OpenTelemetry specification/status documentation
W3C Trace Context
PostgreSQL 18 Monitoring Database Activity documentation
```

Package/provider versions remain deferred and must be re-verified at implementation time.

---

# 106. Final Architecture

```text
Browser / Client
       │
       ▼
Astro / Node.js
       │
       ├─ requestId
       ├─ Structured JSON Logs
       ├─ OTel Traces
       ├─ OTel Metrics
       ├─ Security Signals
       └─ Health / Readiness
                │
                ▼
       OpenTelemetry Collector
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
      Logs    Metrics   Traces

Separate Controlled Truth:
QC Audit / E-Signature / Business Records / Restore Evidence
```

---

# 107. Final Principle

> **If a controlled action fails, we must be able to find it.  
> If the system degrades, we must be able to see why.  
> If a deployment introduces risk, we must be able to correlate it.  
> But telemetry must never replace the controlled evidence that defines QC truth.**

---

# 108. Document Status

```text
Document:
Documents/OBSERVABILITY-ARCHITECTURE.md

Version:
1.0

Architecture:
OpenTelemetry Hybrid / Vendor-neutral

Traces:
OpenTelemetry

Metrics:
OpenTelemetry

Logs:
Structured JSON v1

OTel JavaScript Logs SDK:
Not required for v1 baseline

Correlation:
requestId + traceId + spanId

Propagation:
W3C Trace Context

Gateway:
OpenTelemetry Collector preferred

Transport:
OTLP preferred

Database:
PostgreSQL client/pool + server monitoring

Health:
Liveness + Readiness + Authorized System Health

Audit:
Separate controlled evidence

Telemetry Failure:
Must not normally break controlled business transactions

Thresholds / SLOs:
Deferred until operational baseline

Implementation Evidence:
UNVERIFIED until code/runtime verification exists

Status:
FOUNDATION — APPROVED OBSERVABILITY ARCHITECTURE BASELINE
```

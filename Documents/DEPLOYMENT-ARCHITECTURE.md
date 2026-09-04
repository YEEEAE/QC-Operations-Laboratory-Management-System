# DEPLOYMENT-ARCHITECTURE.md

# QC Operations & Laboratory Management System
## Deployment Architecture — v1.0

**Document Path:** `Documents/DEPLOYMENT-ARCHITECTURE.md`  
**Status:** FOUNDATION — APPROVED DEPLOYMENT ARCHITECTURE BASELINE  
**Product:** QC Operations & Laboratory Management System  
**Architecture:** Modular Monolith  
**Web Framework:** Astro — Server / On-demand  
**Runtime:** Node.js  
**Database:** PostgreSQL 18.x  
**Release Model:** Controlled, immutable-release deployment  
**Primary Environments:** Local/Development → Test/CI → Staging/UAT → Production  
**Operational Timezone:** `Asia/Riyadh`  
**Provider Topology:** DEPLOYMENT-DEPENDENT / not fixed by Foundation  

---

# 1. Purpose

هذه الوثيقة تحدد كيف تنتقل نسخة النظام من source code إلى بيئة Production بشكل controlled وقابل للتتبع والتحقق.

الهدف هو ضمان أن كل deployment يجيب بوضوح عن:

```text
Which source commit is being released?
Which immutable artifact was verified?
Which migrations are required?
Which environment receives it?
Which evidence allowed promotion?
How is failure detected?
How do we stop or recover safely?
How do we prove the exact production version?
```

Deployment لا يعتبر مجرد `git push` أو تشغيل build؛ هو controlled release process مرتبط بالاختبارات، UAT، readiness، migrations، observability، backup/recovery، والأمن.

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
OBSERVABILITY-ARCHITECTURE.md
        ↓
BACKUP-RECOVERY-PLAN.md
        ↓
DEPLOYMENT-ARCHITECTURE.md
```

Deployment لا يغير business/scientific policy ولا يضيف صلاحيات أو transitions غير معتمدة.

---

# 3. Core Principle

> **Build once, verify once, promote the same release identity across environments wherever technically feasible.**

الممنوع:

```text
Build in UAT
↓
change code
↓
build something different for Production
↓
call it the same release
```

المعتمد:

```text
Commit
↓
CI Verification
↓
Immutable Release Artifact / Release Identity
↓
Staging/UAT Verification
↓
Production Readiness Gate
↓
Production Promotion
```

---

# 4. Environment Model

Canonical environments:

```text
LOCAL / DEVELOPMENT
TEST / CI
STAGING / UAT
PRODUCTION
```

Optional specialized environments مثل DR rehearsal أو security test يمكن إضافتها لاحقًا، لكن لا تخلط مع Production.

---

# 5. Environment Isolation

كل environment يجب أن تفصل قدر الإمكان:

```text
Database
Object Storage
Secrets
Runtime configuration
Telemetry environment identity
External integration credentials
Session/signing context
```

Production data/secrets لا تستخدم في lower environments بدون approved sanitization/security path.

---

# 6. Release Identity

كل release يجب أن يملك identity قابلة للإثبات تشمل على الأقل:

```text
Git Commit SHA
Release ID / Build ID
Build timestamp
Application version
Migration head/context
Dependency lockfile state
Environment promoted to
```

`service.version` في Observability يجب أن يطابق release identity الفعلية.

---

# 7. Source-to-Production Flow

```text
Source Commit
    ↓
CI Checkout
    ↓
Dependency Install from Lockfile
    ↓
Static / Type / Lint Verification where configured
    ↓
Unit Tests
    ↓
Integration Tests
    ↓
Database/Migration Tests
    ↓
Security / Dependency Checks where configured
    ↓
Build
    ↓
Immutable Release Artifact / Release ID
    ↓
Deploy to Staging/UAT
    ↓
UAT + Operational Verification
    ↓
Production Readiness Gate
    ↓
Controlled Production Deployment
    ↓
Post-Deployment Verification
    ↓
Release Evidence
```

No stage may be reported PASS without current evidence.

---

# 8. Build Contract

Build يجب أن يكون reproducible قدر الإمكان من:

```text
Repository commit
Lockfile
Approved runtime version
Approved build configuration
```

Build process لا يسحب uncontrolled mutable dependencies خارج lockfile semantics إلا إذا package ecosystem يتطلب ذلك وتم توثيقه.

---

# 9. Immutable Release Artifact

الـrelease التي تمر UAT يجب ألا تتغير in-place قبل Production.

Artifact يمكن أن يكون حسب platform:

```text
Container image
Platform build artifact
Packaged server bundle
Immutable deployment image
```

Exact artifact technology = DEPLOYMENT-DEPENDENT.

لكن artifact يجب أن يكون attributable إلى commit/release ID.

---

# 10. Astro Deployment Baseline

Astro يعمل server/on-demand مع Node runtime.

Deployment يجب أن يدعم:

```text
Server-rendered protected routes
Astro Actions / API endpoints
Middleware
Sessions
Node adapter/runtime
Private network access to PostgreSQL where applicable
```

Static-only hosting غير كافٍ للـcontrolled application baseline.

---

# 11. Runtime Process

Application runtime يجب أن:

- يعمل كnon-root/non-privileged process حيث platform يسمح.
- يستخدم production runtime secrets من secure provider/configuration.
- لا يملك filesystem write authority غير اللازمة.
- لا يملك backup-admin authority.
- يستخدم least-privilege DB role.
- يرسل logs/metrics/traces حسب Observability Architecture.

---

# 12. Database Migration Deployment Model

Migrations هي explicit release step.

المعتمد:

```text
Forward-only SQL migrations
Immutable historical migrations
Explicit migration execution
Migration verification
```

ممنوع:

```text
Application startup silently mutates schema
```

كـdefault production behavior.

---

# 13. Migration Gate

قبل Production migration:

```text
[ ] Migration file immutable/new
[ ] Fresh database migration path verified
[ ] Upgrade path from supported previous state verified
[ ] Backup/recovery readiness appropriate to risk verified
[ ] Lock/duration risk assessed
[ ] Backward/forward compatibility reviewed
[ ] Required application release known
```

Migration failure:

```text
DEPLOYMENT BLOCKED
```

حتى يتم reconciliation والتحقق.

---

# 14. Expand / Contract Strategy

للتغييرات غير المتوافقة مباشرة، يفضل:

```text
Expand
→ deploy compatible application
→ migrate/backfill if required
→ verify
→ Contract in later controlled release
```

بدل destructive schema change + code deploy في خطوة غير قابلة للرجوع.

Exact sequence per migration risk.

---

# 15. Code Rollback ≠ Database Rollback

قاعدة رسمية:

> **Rolling back application code does not automatically roll back database migrations.**

لذلك كل release يجب أن تحدد:

```text
Can prior app version operate against migrated schema?
If not, what recovery/forward-fix strategy exists?
```

Historical migrations لا تعدل بعد التنفيذ.

---

# 16. Deployment vs Recovery

ثلاث عمليات مستقلة:

```text
Deployment
Rollback / Forward Fix
Backup / Disaster Recovery
```

لا تستخدم PITR كـnormal code rollback mechanism بدون incident/recovery justification.

ولا يعتبر إعادة deploy للنسخة السابقة Database Recovery.

---

# 17. Secrets

Secrets لا تدخل:

```text
Git
Build logs
Artifact metadata visible publicly
Client bundle
Telemetry payloads
```

Secrets injected at runtime/deployment through approved secret mechanism.

Exact provider = DEPLOYMENT-DEPENDENT.

---

# 18. Configuration

Configuration تصنف إلى:

```text
Non-sensitive versioned configuration
Environment-specific non-sensitive configuration
Secrets
```

كل configuration critical يجب أن تكون validated عند startup/readiness بدون طباعة secret values.

---

# 19. Production Database Role

Application runtime DB role:

```text
Non-superuser
Least privilege
No schema-owner authority unless explicitly justified
No backup/restore authority
No uncontrolled CREATE in public schema
```

Migration role يمكن أن يكون منفصلًا وأعلى privilege، ويستخدم فقط controlled release step.

---

# 20. Deployment Authorization

Production deployment يجب أن يحتاج explicit deployment/release authority حسب policy.

Developer/Admin role داخل التطبيق لا يعني تلقائيًا infrastructure deployment authority.

Exact human authority remains:

```text
POLICY-DEPENDENT
```

---

# 21. Branch / Release Governance

Foundation لا يفرض GitFlow محدد، لكن production release يجب أن يربط exact commit موجود في repository.

No deployment from unknown local working tree.

Release candidate يجب أن يكون:

```text
Committed
Traceable
Verifiable
Reproducible enough for audit/release evidence
```

---

# 22. CI Gate

CI gate should cover applicable checks from Testing Strategy:

```text
Formatting / static checks
Type checking
Unit tests
Integration tests
Database tests
Migration tests
Authorization negative tests
Critical security checks
Build
```

Exact pipeline tooling = IMPLEMENTATION-DEPENDENT.

---

# 23. Test Artifact Integrity

Test result يجب أن يرتبط بالـsame commit/release identity.

ممنوع استخدام:

```text
Tests from commit A
+
Production build from commit B
```

كـrelease evidence واحدة.

---

# 24. Staging / UAT Environment

Staging/UAT يجب أن يمثل Production architecture بقدر عملي مناسب، خصوصًا:

```text
Astro/Node runtime model
PostgreSQL major version
Migration mechanism
Session/auth flow
Object storage abstraction
Observability integration
Network/security assumptions
```

لكن يمكن أن تختلف capacity/provider tier إذا documented ولا تغير correctness.

---

# 25. UAT Deployment

Release Candidate:

```text
CI PASS
↓
Deploy exact candidate to Staging/UAT
↓
Run UAT-ACCEPTANCE-PLAN.md
↓
Capture evidence
```

أي code change بعد UAT invalidates affected UAT evidence ويحتاج retest scope مناسب.

---

# 26. Production Readiness Dependency

Production deployment لا يبدأ قبل:

```text
PRODUCTION-READINESS-CHECKLIST.md
→ GO
```

أو equivalent explicitly approved conditional path إذا الوثيقة تسمح، مع عدم تجاوز blockers.

---

# 27. Production Deployment Modes

Foundation يسمح بموديل deployment واحد أو أكثر حسب provider:

```text
Rolling
Blue/Green
Replace/Recreate
Canary
```

لكن لا نعتمد mode معين بدون hosting/capacity constraints.

المطلوب ثابت:

```text
Controlled
Observable
Abortable where possible
Version-attributable
```

---

# 28. Maintenance Mode

قد تحتاج بعض migrations/recovery operations Maintenance Mode.

إذا استخدمت:

```text
New controlled writes blocked
Read behavior defined
Clear user message
Admin bypass not implicit
```

Maintenance mode لا تستخدم لإخفاء partial failure أو تخطي authorization.

---

# 29. Health Gates

بعد deployment:

```text
Liveness
Readiness
Critical dependency checks
```

تستخدم كما في Observability Architecture.

Process alive ≠ Application ready.

---

# 30. Post-Deployment Verification

بعد Production promotion:

```text
[ ] Correct release/version visible
[ ] Liveness passes
[ ] Readiness passes
[ ] PostgreSQL connection healthy
[ ] Migration head expected
[ ] Authentication smoke path works
[ ] Authorized read path works
[ ] Critical controlled write smoke path only if safe/testable in production policy
[ ] Object/file path health appropriate
[ ] Error/5xx rate normal relative to baseline
[ ] No new critical alert
[ ] Outbox/notifications not stuck if implemented
```

No destructive production smoke test بدون controlled test data/policy.

---

# 31. Deployment Success Definition

Deployment status لا يصبح SUCCESS بمجرد platform saying `deployed`.

Canonical success requires:

```text
Artifact promoted
+
Required migration success
+
Application ready
+
Required post-deploy verification pass
+
No blocking incident detected
```

---

# 32. Abort / Rollback Decision

إذا release causes severe regression:

خيارات:

```text
Abort rollout
Rollback code where schema-compatible
Disable affected optional capability
Forward fix
Recovery only if actual data/integrity event requires it
```

القرار يعتمد على actual failure mode.

---

# 33. Rollback Preconditions

قبل rollback:

```text
Prior artifact available
Schema compatibility known
No incompatible irreversible mutation prevents prior code
Session/security implications understood
```

إذا غير آمن:

```text
ROLLBACK BLOCKED
→ forward-fix/recovery strategy required
```

---

# 34. Release Evidence Record

كل Production release يجب أن يملك evidence contract يشمل:

```text
Release ID
Git SHA
Build/Artifact ID
Deployment environment
Migration head before/after
CI result reference
UAT result reference
Production Readiness decision
Deployment started/completed
Post-deploy verification result
Observed incidents/alerts
Rollback/forward-fix if any
Decision authority reference where required
```

---

# 35. Observability Integration

Deployment emits/records where supported:

```text
deployment.started
deployment.completed
deployment.failed
```

ومع:

```text
service.version
Git SHA
release ID
deployment.environment
```

هذا يسمح مقارنة before/after deployment.

---

# 36. Backup / Recovery Precondition

أي migration/release ذات risk عالي على data integrity تحتاج recovery posture مناسب قبل التنفيذ.

لكن:

```text
Backup Job Success
≠
Restore Verified
```

يتم الرجوع إلى `BACKUP-RECOVERY-PLAN.md` وProduction Readiness Gate.

---

# 37. Object Storage Deployment

Application release لا تمنح runtime credentials قدرة administration أو deletion لprotected recovery copies.

Bucket/container policies والـCORS/public access يجب أن تكون environment-specific ومراجعة.

---

# 38. External Dependencies

Release verification لازم تفرق بين:

```text
Critical dependency unavailable
→ NOT READY / BLOCKED

Optional dependency unavailable
→ DEGRADED capability
```

مثال AI advisory optional حسب Foundation.

---

# 39. AI Deployment Boundary

AI provider/config changes لا تمنح AI صلاحيات business إضافية.

Core workflows يجب أن تبقى تعمل بدون AI.

AI outage لا تمنع production readiness للـcore إذا كل required core controls سليمة.

---

# 40. Security Headers / Runtime Security

Deployment يجب أن يطبق security runtime configuration المعتمدة مثل:

```text
TLS
Secure cookies
CSRF protections
CSP/security headers where specified
No debug mode in production
No source-map/stack leakage to public users unless safely configured
```

Exact values تأتي من Security Architecture/implementation.

---

# 41. Dependency / Supply-Chain Gate

Release process يجب أن يحترم `RISK-033`.

At minimum:

```text
Lockfile present
Unexpected dependency drift detected
Known critical vulnerabilities reviewed according to policy/tooling
Build provenance traceable to repository commit
```

No claim of supply-chain safety بدون evidence.

---

# 42. Deployment Logs

Deployment logs تعتبر operational evidence لكنها لا تحتوي secrets.

Redact:

```text
Tokens
Passwords
Connection strings
Private keys
Secret environment values
```

---

# 43. No Direct Manual Production Mutation

ممنوع كـnormal release practice:

```text
SSH into production
edit application source manually
run untracked SQL manually
change controlled config without evidence
```

Emergency intervention إذا حدثت يحتاج incident/change evidence ومراجعة لاحقة.

---

# 44. Database Emergency SQL

إذا emergency SQL ضرورية:

```text
Explicit authority
Exact script captured
Backup/recovery consideration
Transaction where appropriate
Peer review where policy requires
Audit/change evidence
Post-action validation
```

لا تصبح ad hoc console commands غير موثقة.

---

# 45. Release Blocking Conditions

Examples:

```text
CI critical failure
Migration verification failure
UAT required scenario FAIL
Production Readiness = NO-GO
Residual CRITICAL risk
Residual VERY HIGH risk without allowed acceptance
Required restore evidence missing
Required security control unverified
Artifact/commit mismatch
Unknown migration state
Critical dependency unavailable
```

---

# 46. Deployment Decision Register

| ID | Approved Decision |
|---|---|
| DEP-001 | Use controlled multi-environment release flow: Local/Dev → Test/CI → Staging/UAT → Production |
| DEP-002 | Production release identity is bound to exact Git SHA + build/artifact identity |
| DEP-003 | Prefer build-once/promote-same-artifact behavior wherever technically feasible |
| DEP-004 | Production migrations are explicit controlled steps, not silent application-startup mutations |
| DEP-005 | Historical migrations remain immutable |
| DEP-006 | Code rollback does not imply automatic database rollback |
| DEP-007 | Secrets remain outside Git and immutable release artifacts |
| DEP-008 | Production runtime uses least-privilege non-superuser DB credentials |
| DEP-009 | UAT evidence must correspond to the release candidate being promoted |
| DEP-010 | Production deployment requires Production Readiness GO decision |
| DEP-011 | Deployment success requires post-deployment verification, not platform status alone |
| DEP-012 | Deployment, rollback/forward-fix, and disaster recovery are distinct operations |
| DEP-013 | Provider/hosting topology remains deployment-dependent until explicitly approved |
| DEP-014 | Observability must identify exact release/environment |
| DEP-015 | Optional AI failure does not automatically block core deployment |
| DEP-016 | Direct untracked manual production mutations are forbidden as normal practice |
| DEP-017 | Production-derived lower-environment data requires approved security/sanitization handling |
| DEP-018 | High-risk migrations require explicit recovery/readiness consideration before execution |
| DEP-019 | The Astro SSR application web runtime is a Render Web Service; `qclevel.top` is the canonical production domain and Hostinger remains the DNS manager unless nameservers are intentionally moved |

---

# 47. Deferred Deployment Decisions

```text
DEP-DD-002 Container vs platform-native artifact
DEP-DD-003 Exact CI/CD provider
DEP-DD-004 Exact production deployment mode: rolling/blue-green/canary/etc.
DEP-DD-005 Exact environment URLs/domains
DEP-DD-006 Exact production deployment authority
DEP-DD-007 Exact maintenance-mode implementation
DEP-DD-008 Exact secrets/KMS provider
DEP-DD-009 Exact infrastructure-as-code tool
DEP-DD-010 Exact deployment frequency/cadence
DEP-DD-011 Exact rollback retention window for artifacts
DEP-DD-012 Exact HA/standby/cross-region topology
DEP-DD-013 Exact vulnerability scanning tools/policies
DEP-DD-014 Exact approval ceremony for high-risk releases
DEP-DD-015 PostgreSQL provider
DEP-DD-016 Object-storage provider
DEP-DD-017 KMS/secrets provider
DEP-DD-018 Telemetry backend
DEP-DD-019 Physical backup/PITR provider implementation
```

No deferred choice may be silently invented during implementation without explicit decision/evidence where material.

---

# 48. Deployment Verification Checklist

```text
[ ] Exact Git SHA known
[ ] Exact release/artifact ID known
[ ] Lockfile-based install/build verified
[ ] Required CI gates pass
[ ] Build succeeds
[ ] Migration tests pass
[ ] Staging/UAT deployment matches release candidate
[ ] Required UAT passes
[ ] Production Readiness = GO
[ ] Production secrets/config available
[ ] Backup/recovery gate appropriate to risk passes
[ ] Production migration succeeds
[ ] Correct release visible in telemetry
[ ] Liveness passes
[ ] Readiness passes
[ ] Required post-deploy smoke checks pass
[ ] No blocking alerts/incidents
[ ] Release evidence persisted
```

---

# 49. Production Claim Rule

وجود هذه الوثيقة لا يعني أن deployment pipeline مطبقة.

Implementation status remains:

```text
UNVERIFIED
```

حتى يوجد current CI/CD/runtime evidence.

---

# 50. Final Principle

> **A release is not production-ready because it builds; it is production-ready only when the exact release identity has passed the required technical, security, UAT, recovery, and operational gates and survives controlled post-deployment verification.**

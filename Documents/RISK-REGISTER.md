# RISK-REGISTER.md

# QC Operations & Laboratory Management System
## System Risk Register — v1.0

**Document Path:** `Documents/RISK-REGISTER.md`  
**Status:** FOUNDATION — APPROVED RISK GOVERNANCE BASELINE  
**Product:** QC Operations & Laboratory Management System  
**Risk Model:** 5×5 Likelihood × Impact  
**Assessment Model:** Inherent Risk + Residual Risk  
**Evidence Rule:** Controls do not reduce Residual Risk until implemented and verified  
**Release Rule:** Residual CRITICAL / VERY HIGH risks block release by default  
**Risk Acceptance Authority:** POLICY-DEPENDENT  

---

# 1. Purpose

هذه الوثيقة هي سجل المخاطر الرسمي للنظام.

الهدف هو ربط:

```text
Risk
↓
Business / Security / Data Consequence
↓
Preventive Controls
↓
Detective Controls
↓
Recovery Controls
↓
Required Tests
↓
Current Evidence
↓
Residual Risk
↓
Release / Acceptance Decision
```

ولا تستخدم هذه الوثيقة لإعطاء أرقام شكلية أو ادعاء أن الخطر Mitigated لمجرد أن Architecture ذكرت control معين.

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
```

Risk treatment لا يغير Business Rule أو Scientific Source أو Permission Policy.

---

# 3. Core Principle

> **A risk is not mitigated because a control is documented. It is mitigated only when the control exists, is verified, and current evidence supports the residual-risk assessment.**

---

# 4. Risk Scoring Model

المعتمد:

```text
Likelihood = 1..5
Impact = 1..5
Risk Score = Likelihood × Impact
```

لكن لا يتم اختراع Likelihood تشغيلي بدون evidence.

إذا لا توجد بيانات أو خبرة تشغيلية كافية:

```text
Likelihood = ASSESSMENT REQUIRED
Score = NOT YET RATED
```

---

# 5. Likelihood Scale

| Score | Label | Meaning |
|---:|---|---|
| 1 | Rare | Requires unusual conditions; little evidence of occurrence |
| 2 | Unlikely | Possible but not expected in normal operation |
| 3 | Possible | Credible under normal operational conditions |
| 4 | Likely | Expected to occur without effective controls |
| 5 | Almost Certain | Repeated/frequent occurrence expected without controls |

Operational assignment requires evidence or approved expert assessment.

---

# 6. Impact Scale

| Score | Label | Meaning |
|---:|---|---|
| 1 | Minor | Limited inconvenience; no material controlled-data or operational impact |
| 2 | Moderate | Localized operational impact; recoverable without controlled-record compromise |
| 3 | Significant | Material workflow/data impact; rework or investigation required |
| 4 | Major | Serious QC/security/availability/compliance impact |
| 5 | Severe | Could produce incorrect controlled decision, release, major integrity loss, major security breach, or unrecoverable operational/compliance consequence |

---

# 7. Impact Dimensions

Impact يقيّم عبر الأبعاد التالية، ويستخدم **أعلى Impact** منها كالتقييم النهائي:

```text
QC / Product Integrity
Data Integrity
Security / Confidentiality
Audit / Traceability / Compliance
Operational Continuity
Availability / Recovery
```

هذا يمنع تخفيض Risk خطرة لأن تأثيرها المالي أو التقني وحده منخفض.

---

# 8. Risk Severity Bands

| Score | Severity |
|---:|---|
| 1–4 | LOW |
| 5–9 | MODERATE |
| 10–14 | HIGH |
| 15–19 | VERY HIGH |
| 20–25 | CRITICAL |

إذا Likelihood غير مقيمة:

```text
Severity = ASSESSMENT REQUIRED
```

---

# 9. Inherent Risk

`Inherent Risk` هو الخطر قبل الاعتماد على controls الحالية.

يصف:

```text
What could happen if the control set did not protect the process?
```

---

# 10. Residual Risk

`Residual Risk` هو الخطر المتبقي بعد controls **المطبقة والمتحقق منها فعليًا**.

Control موجود في specification فقط:

```text
≠ Verified Control
```

لذلك في Foundation stage، كثير من Residual ratings ستبقى:

```text
UNVERIFIED / ASSESSMENT REQUIRED
```

حتى وجود implementation + tests + evidence.

---

# 11. Control Classes

كل Risk يمكن أن يملك ثلاثة أنواع controls:

```text
Preventive
Detective
Recovery
```

## Preventive

تمنع وقوع الخطر أو تقلل احتمال حدوثه.

## Detective

تكشف وقوع الخطر أو محاولة حدوثه.

## Recovery

تساعد على استعادة الحالة الصحيحة بعد الحدث.

---

# 12. Risk Treatment

Canonical treatments:

```text
AVOID
MITIGATE
TRANSFER
ACCEPT
```

لا يجوز للDeveloper/Agent/AI تنفيذ `ACCEPT` نيابة عن Business/Risk Authority.

---

# 13. Risk Acceptance Authority

Exact authority:

```text
POLICY-DEPENDENT
```

حتى يتم اعتماد governance رسمي.

أي residual risk يحتاج acceptance يبقى:

```text
ACCEPTANCE REQUIRED
```

ولا يعتبر Closed.

---

# 14. Risk Status Vocabulary

```text
IDENTIFIED
ANALYSIS_REQUIRED
MITIGATION_PLANNED
MITIGATING
MITIGATED
ACCEPTANCE_REQUIRED
ACCEPTED
BLOCKED
CLOSED
```

`MITIGATED` تحتاج evidence.

`CLOSED` لا يحذف التاريخ.

---

# 15. Release Gate

المعتمد:

```text
Residual CRITICAL
→ RELEASE BLOCKED

Residual VERY HIGH
→ RELEASE BLOCKED BY DEFAULT

Residual HIGH
→ Requires documented mitigation + evidence + explicit acceptance before production

Residual MODERATE
→ Owner review / treatment / acceptance according to policy

Residual LOW
→ Monitor / accept according to policy
```

إذا Residual Risk غير مقيمة بسبب غياب evidence وكانت الـRisk ذات Impact مرتفع على controlled truth:

```text
NO PRODUCTION PASS
```

حتى يتم التقييم المناسب.

---

# 16. Risk Record Contract

كل Risk رسمي يتبع على الأقل:

```text
Risk ID
Title
Domain
Category
Scenario
Primary Cause
Potential Consequence
Affected Controls / Requirements
Inherent Likelihood
Inherent Impact
Inherent Severity
Preventive Controls
Detective Controls
Recovery Controls
Required Verification
Residual Likelihood
Residual Impact
Residual Severity
Treatment
Owner Role
Acceptance Authority
Status
Open Gaps
Last Reviewed
```

---

# 17. Risk Categories

Canonical categories:

```text
AUTHENTICATION
AUTHORIZATION
CONTROLLED_WORKFLOW
SCIENTIFIC_INTEGRITY
DATA_INTEGRITY
CONCURRENCY
AUDIT_TRACEABILITY
DOCUMENT_CONTROL
EQUIPMENT_CALIBRATION
FILES_EVIDENCE
REPORTING_DISCLOSURE
SECURITY
DATABASE
BACKUP_RECOVERY
DEPENDENCY_INTEGRATION
AI_GOVERNANCE
OBSERVABILITY
READINESS_GOVERNANCE
TIME_DATE
SUPPLY_CHAIN
```

---

# 18. Owner Role Model

نستخدم Role/Function وليس أسماء أشخاص في الـFoundation.

Examples:

```text
Identity / Security Owner
Authorization Owner
Quality Domain Owner
Quarantine Domain Owner
Laboratory Domain Owner
Equipment / Calibration Domain Owner
Document Control Owner
Database / Platform Owner
System Administration Owner
Reporting Owner
AI / Integration Owner
Release / Quality Governance Owner
```

Actual individual assignment later.

---

# 19. Risk-to-Test Relationship

Risk Register يغذي `TESTING-STRATEGY.md` مباشرة.

```text
Risk
  ↓
Risk Tier
  ↓
Requirement IDs
  ↓
Test IDs
  ↓
Evidence
  ↓
Residual Risk
```

Test coverage بدون Risk linkage قد يترك high-impact gaps غير مرئية.

---

# 20. Foundation Risk Register Summary

> **Important:** Likelihood values below are intentionally not guessed. Inherent Impact is assigned only where the consequence is directly supported by current Foundation rules. Residual ratings remain UNVERIFIED until implementation and evidence exist.

| Risk ID | Title | Primary Category | Inherent Impact | Likelihood | Foundation Status |
|---|---|---|---:|---|---|
| RISK-001 | Unauthorized controlled action | AUTHORIZATION | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-002 | Separation-of-Duties bypass | AUTHORIZATION | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-003 | Admin bypasses business integrity | AUTHORIZATION | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-004 | Unauthorized scoped data disclosure | REPORTING_DISCLOSURE | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-005 | Incorrect QC PASS / FAIL | SCIENTIFIC_INTEGRITY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-006 | PASS incorrectly treated as Release | CONTROLLED_WORKFLOW | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-007 | Unauthorized Release | CONTROLLED_WORKFLOW | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-008 | Unapproved scientific criteria used | SCIENTIFIC_INTEGRITY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-009 | Precision / rounding corrupts scientific result | SCIENTIFIC_INTEGRITY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-010 | Silent concurrent overwrite | CONCURRENCY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-011 | Duplicate critical mutation | CONCURRENCY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-012 | Ambiguous commit outcome causes duplicate or false failure | DATA_INTEGRITY | 4 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-013 | Approved record silently edited | DATA_INTEGRITY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-014 | Master-data change rewrites historical truth | DATA_INTEGRITY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-015 | Audit history lost or tampered | AUDIT_TRACEABILITY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-016 | E-Signature bound to wrong subject/version | CONTROLLED_WORKFLOW | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-017 | Wrong controlled document version used | DOCUMENT_CONTROL | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-018 | Invalid equipment/calibration context used | EQUIPMENT_CALIBRATION | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-019 | Retest misused or detached from original test | CONTROLLED_WORKFLOW | 4 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-020 | Unauthorized file/evidence access | FILES_EVIDENCE | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-021 | Malicious/invalid uploaded file accepted | SECURITY | 4 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-022 | Report/export leaks out-of-scope data | REPORTING_DISCLOSURE | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-023 | Spreadsheet formula injection in export | SECURITY | 4 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-024 | Session/account compromise enables controlled actions | AUTHENTICATION | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-025 | Sensitive error/secret leakage | SECURITY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-026 | Migration drift / historical migration mutation | DATABASE | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-027 | Business-number collision / DB race | DATABASE | 4 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-028 | Backup exists but cannot restore | BACKUP_RECOVERY | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-029 | External dependency failure corrupts local business outcome | DEPENDENCY_INTEGRATION | 4 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-030 | AI exceeds advisory authority | AI_GOVERNANCE | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-031 | Dashboard KPI or scope is incorrect | REPORTING_DISCLOSURE | 4 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-032 | Timezone/date interpretation changes business meaning | TIME_DATE | 4 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-033 | Dependency/supply-chain compromise | SUPPLY_CHAIN | 5 | ASSESSMENT REQUIRED | IDENTIFIED |
| RISK-034 | False PASS / Production-Ready claim | READINESS_GOVERNANCE | 5 | ASSESSMENT REQUIRED | IDENTIFIED |

---

# 21. RISK-001 — Unauthorized Controlled Action

**Domain:** Cross-System  
**Category:** AUTHORIZATION  
**Scenario:** مستخدم ينفذ action حساس بدون permission/scope/state authority صحيحة.  
**Potential Consequence:** Unauthorized approval, rejection, release, controlled mutation, or record access.  
**Inherent Impact:** 5  
**Likelihood:** ASSESSMENT REQUIRED

**Preventive Controls:**

```text
Central server-side authorization
Default Deny
Permission + Scope + Entity + State + SoD + Version evaluation
Reauthorization inside every sensitive Astro Action/API
```

**Detective Controls:**

```text
Authorization-denial security logs
Negative authorization test suite
Audit/security correlation by requestId
```

**Recovery Controls:**

```text
Session revocation/account containment
Controlled correction/void where business mutation already committed
Incident investigation using audit/security evidence
```

**Required Verification:**

```text
Allowed actor
Unauthenticated
Missing permission
Wrong scope
Wrong state
Direct Action invocation
IDOR substitution
```

**Residual Risk:** UNVERIFIED  
**Treatment:** MITIGATE  
**Owner Role:** Authorization / Security Owner  
**Status:** MITIGATION_PLANNED

---

# 22. RISK-002 — Separation-of-Duties Bypass

**Domain:** Approvals / Controlled Workflows  
**Category:** AUTHORIZATION  
**Scenario:** actor reviews/approves controlled record contrary to approved SoD policy.  
**Consequence:** Invalid independent review and compromised controlled decision.  
**Impact:** 5  
**Likelihood:** ASSESSMENT REQUIRED

**Controls:**

```text
Central SoD evaluation
Actor/action history checks
Server-side enforcement
E-Signature reauthorization
Negative SoD tests
```

**Open Gap:** Exact final SoD policy remains policy-dependent where not yet approved.  
**Residual:** UNVERIFIED  
**Treatment:** MITIGATE / BLOCK undefined sensitive flows  
**Owner:** Quality Governance + Authorization Owner

---

# 23. RISK-003 — Admin Bypasses Business Integrity

**Scenario:** Admin privilege is treated as universal business approval/edit authority.  
**Impact:** 5

**Controls:**

```text
Admin ≠ universal business approver
No bypass of controlled state/history
Permission-specific authorization
Negative admin tests
```

**Required Evidence:** Tests proving Admin cannot rewrite approved history or execute ungranted business actions.  
**Residual:** UNVERIFIED  
**Treatment:** MITIGATE

---

# 24. RISK-004 — Unauthorized Scoped Data Disclosure

**Scenario:** Search, Dashboard, Reports, API or Export returns records outside actor scope.  
**Impact:** 5

**Controls:**

```text
Scope applied in server query
Authorization-aware read models
No global fetch then client-side hiding
IDOR-safe lookup
```

**Tests:** Cross-user/cross-scope search, dashboard, report, export, file, API substitution.  
**Residual:** UNVERIFIED

---

# 25. RISK-005 — Incorrect QC PASS / FAIL

**Scenario:** System calculates or stores official result using incorrect criterion, unit, precision, formula or state.  
**Impact:** 5

**Controls:**

```text
Scientific values only from approved controlled sources
Deterministic server/domain calculation
Historical criteria snapshot
Decimal-safe numeric handling
Boundary tests
Human approval where policy requires
```

**Required Evidence:** Approved-source scientific boundary test evidence.  
**Residual:** UNVERIFIED

---

# 26. RISK-006 — PASS Incorrectly Treated as Release

**Domain:** Quarantine  
**Scenario:** Inspection `PASS` automatically changes Release System State to Released.  
**Impact:** 5

**Foundation Rule:** Inspection Result and Release System State are separate facts. PASS does not automatically mean Released.

**Controls:**

```text
Separate DB fields/state machines
Explicit Release use case
Explicit release authorization
No derived automatic release from PASS
```

**Tests:** PASS without Release permission/action must remain not released.  
**Residual:** UNVERIFIED

---

# 27. RISK-007 — Unauthorized Release

**Scenario:** wrong actor, wrong state, wrong scope, stale record or missing approval releases item.  
**Impact:** 5

**Controls:**

```text
Explicit Release command
Default Deny while release policy unresolved
State/version/authorization checks
Transaction + audit
E-Signature if later required by approved policy
```

**Residual:** UNVERIFIED

---

# 28. RISK-008 — Unapproved Scientific Criteria Used

**Scenario:** developer/UI/AI hardcodes scientific acceptance values not sourced from controlled WI/SOP/specification.  
**Impact:** 5

**Controls:**

```text
SOURCE-DEPENDENT markers
Controlled source/version references
Do-not-invent rule
Block implementation/testing where source absent
```

**Residual:** UNVERIFIED

---

# 29. RISK-009 — Precision / Rounding Error

**Scenario:** floating-point or wrong scale/rounding changes scientific decision.  
**Impact:** 5

**Controls:**

```text
NUMERIC(p,s) field-specific
No guessed p/s
No uncontrolled JavaScript float for controlled science
Approved rounding rule
Precision/boundary tests
```

**Open Gap:** Exact scientific precision/rounding remains source-dependent per field.  
**Residual:** UNVERIFIED

---

# 30. RISK-010 — Silent Concurrent Overwrite

**Scenario:** two actors edit same record; later save silently overwrites earlier committed data.  
**Impact:** 5

**Controls:**

```text
BIGINT version
expectedVersion
optimistic update WHERE id + version
CONFLICT_STALE_VERSION
No silent overwrite
```

**Tests:** Real concurrent PostgreSQL stale-version scenario.  
**Residual:** UNVERIFIED

---

# 31. RISK-011 — Duplicate Critical Mutation

**Scenario:** double-click/retry/replay produces duplicate Submit/Approve/Release/Void/Close/Retest.  
**Impact:** 5

**Controls:**

```text
Idempotency where applicable
Current state validation
Unique command/business constraints
Version checks
Transactional execution
```

**Tests:** Duplicate concurrent command tests.  
**Residual:** UNVERIFIED

---

# 32. RISK-012 — Ambiguous Commit Outcome

**Scenario:** client sees timeout/network error after DB may already have committed and retries blindly.  
**Impact:** 4

**Controls:**

```text
Idempotency key where applicable
Reload current state before retry
Audit/business lookup
Explicit error architecture for unknown outcome
```

**Residual:** UNVERIFIED

---

# 33. RISK-013 — Approved Record Silently Edited

**Scenario:** generic CRUD allows normal edit of approved/signed/closed/void/superseded record.  
**Impact:** 5

**Controls:**

```text
State-aware use cases
No generic controlled-record save
Correction/Revision/Void/Supersede paths
Audit and snapshots
```

**Tests:** Direct update attempts after controlled states must fail/preserve history.  
**Residual:** UNVERIFIED

---

# 34. RISK-014 — Historical Master-Data Rewrite

**Scenario:** current product/equipment/document/master-data change causes old approved record to display new facts as if they were historical truth.  
**Impact:** 5

**Controls:**

```text
Normalize current truth
Snapshot controlled historical context
Reference + immutable snapshot
```

**Tests:** Change master data after approval; historical record remains unchanged.  
**Residual:** UNVERIFIED

---

# 35. RISK-015 — Audit History Lost or Tampered

**Scenario:** cascade/update/delete or application path destroys/modifies historical audit evidence.  
**Impact:** 5

**Controls:**

```text
Append-oriented audit
No normal UPDATE/DELETE historical audit path
Restrictive FK/deletion behavior
Audit atomic with critical mutation where required
Separate security logs
```

**Tests:** Delete/cascade/role privilege/transaction rollback/audit atomicity tests.  
**Residual:** UNVERIFIED

---

# 36. RISK-016 — E-Signature Bound to Wrong Subject / Version

**Scenario:** signature proves actor but not exact record/version/action meaning.  
**Impact:** 5

**Controls:**

```text
Reauthentication
Reauthorization
Actor
Meaning
Subject type/id
Exact version
Snapshot hash
Trusted timestamp
Replay protection
```

**Tests:** stale version, replay, wrong subject, wrong actor, no-password-storage.  
**Residual:** UNVERIFIED

---

# 37. RISK-017 — Wrong Controlled Document Version Used

**Scenario:** inspection/lab execution references current document after later revision rather than exact version actually used.  
**Impact:** 5

**Controls:**

```text
Document identity separated from version
Exact controlled version binding
Historical snapshot/reference
Superseded version retained
```

**Residual:** UNVERIFIED

---

# 38. RISK-018 — Invalid Equipment / Calibration Context Used

**Scenario:** execution uses equipment/calibration context that is not valid or historical context is lost.  
**Impact:** 5

**Controls:**

```text
Equipment/calibration lifecycle
Approved policy before use restrictions
Historical equipment/calibration snapshot
State/date validation
```

**Open Gap:** Exact overdue behavior/calibration intervals remain policy/source-dependent.  
**Residual:** UNVERIFIED

---

# 39. RISK-019 — Retest Misuse

**Scenario:** retest used to replace/hide original failed test or created without approved authority/count/rules.  
**Impact:** 4

**Controls:**

```text
Retest as separate execution linked to original
Original result preserved
Default Deny while policy unresolved
Audit/approval rules once approved
```

**Open Gap:** Retest allowance/count/authority remains policy-dependent.  
**Residual:** UNVERIFIED

---

# 40. RISK-020 — Unauthorized File / Evidence Access

**Scenario:** user obtains evidence by guessing/substituting file/object ID or direct URL.  
**Impact:** 5

**Controls:**

```text
Private object storage
Authorize linked business entity on every download
No permanent public URL
Short-lived signed URL only after authorization if used
```

**Tests:** file ID substitution, cross-scope download, expired signed URL.  
**Residual:** UNVERIFIED

---

# 41. RISK-021 — Malicious / Invalid Uploaded File Accepted

**Scenario:** executable/malicious/misdeclared file is accepted and later delivered/processed.  
**Impact:** 4

**Controls:**

```text
Extension allowlist
MIME + content signature checks
Size limits
Private storage
Malware scanning architecture-ready
Safe filename/storage key
```

**Open Gap:** final allowlists/size limits/scanner provider unresolved.  
**Residual:** UNVERIFIED

---

# 42. RISK-022 — Report / Export Scope Leakage

**Scenario:** report/export uses broader dataset than on-screen authorized scope.  
**Impact:** 5

**Controls:**

```text
Canonical authorization-aware dataset
Same scope for UI/API/export
Server-side filters
No export privilege escalation
```

**Tests:** Cross-scope row/column leakage tests across CSV/XLSX/PDF.  
**Residual:** UNVERIFIED

---

# 43. RISK-023 — Spreadsheet Formula Injection

**Scenario:** exported user-controlled cell begins with formula-significant characters and executes when opened in spreadsheet software.  
**Impact:** 4

**Controls:**

```text
CSV/XLSX formula-injection protection
Context-aware export encoding
Security tests for = + - @ prefixes
```

**Residual:** UNVERIFIED

---

# 44. RISK-024 — Session / Account Compromise

**Scenario:** stolen/reused session or compromised credential permits controlled actions.  
**Impact:** 5

**Controls:**

```text
Opaque server-side sessions
Secure HttpOnly __Host- cookie
Session token hashing at rest
Argon2id password hashing
Session revocation
Reauthentication for high-risk actions
Rate/abuse controls
```

**Open Gaps:** exact timeouts, lockout, MFA policy remain deferred.  
**Residual:** UNVERIFIED

---

# 45. RISK-025 — Sensitive Error / Secret Leakage

**Scenario:** client/log/trace reveals SQL, stack, token, credential, path, provider payload or PII.  
**Impact:** 5

**Controls:**

```text
Canonical AppError
RFC 9457 safe mapping
ActionError adapter
Redacted diagnostics
No raw infrastructure errors outward
Secret scanning
```

**Tests:** unexpected error leakage tests, client bundle secret checks.  
**Residual:** UNVERIFIED

---

# 46. RISK-026 — Migration Drift / Historical Migration Mutation

**Scenario:** applied migration edited or manual production DDL causes schema not reproducible from repository history.  
**Impact:** 5

**Controls:**

```text
Forward-only immutable SQL migrations
Checksums
Fresh DB migration tests
Upgrade migration tests
No manual production DDL except controlled emergency process
```

**Residual:** UNVERIFIED

---

# 47. RISK-027 — Business Number Collision / Database Race

**Scenario:** concurrent creation produces duplicate official human-readable IDs.  
**Impact:** 4

**Controls:**

```text
Transactional counter allocation
Unique DB constraint
No MAX()+1
Real concurrency tests
```

**Residual:** UNVERIFIED

---

# 48. RISK-028 — Backup Exists but Cannot Restore

**Scenario:** backup job reports success but artifact is corrupt, incomplete or incompatible with recovery.  
**Impact:** 5

**Controls:**

```text
Backup integrity verification
Restore drills
Migration/schema compatibility verification
Critical representative data verification
```

**Foundation Rule:** Backup is not proven until restore is verified.  
**Open Gaps:** RPO/RTO/provider/cadence unresolved.  
**Residual:** UNVERIFIED

---

# 49. RISK-029 — External Dependency Failure Corrupts Local Outcome

**Scenario:** provider timeout/failure inside workflow causes partial state or misleading business result.  
**Impact:** 4

**Controls:**

```text
Adapter boundaries
No slow external call inside critical DB transaction
Local transaction + outbox
Idempotency
Safe error translation
```

**Residual:** UNVERIFIED

---

# 50. RISK-030 — AI Exceeds Advisory Authority

**Scenario:** AI output directly approves/rejects/releases/signs/sets PASS/FAIL or bypasses human authorization.  
**Impact:** 5

**Controls:**

```text
AI advisory only
No controlled mutation authority
Normal server authorization for any AI-invoked tool
Minimum authorized context
Structured output validation
Prompt injection treated as untrusted content
```

**Tests:** AI cannot execute controlled actions; unauthorized context not transmitted.  
**Residual:** UNVERIFIED

---

# 51. RISK-031 — Dashboard KPI / Scope Error

**Scenario:** dashboard displays incorrect KPI or aggregate from data outside actor scope, causing wrong operational decisions or disclosure.  
**Impact:** 4

**Controls:**

```text
Server-side KPI calculations
Authorization-aware read model
Scoped aggregate query
Representative KPI correctness tests
```

**Residual:** UNVERIFIED

---

# 52. RISK-032 — Timezone / Date Interpretation Error

**Scenario:** UTC/local conversion, DATE vs TIMESTAMPTZ, or midnight boundary changes expiry/status/business meaning.  
**Impact:** 4

**Controls:**

```text
TIMESTAMPTZ for events
UTC internal handling
Asia/Riyadh display
DATE for pure business dates
Trusted server/DB time
Timezone boundary tests
```

**Residual:** UNVERIFIED

---

# 53. RISK-033 — Dependency / Supply-Chain Compromise

**Scenario:** vulnerable/malicious package, CI action or dependency compromises server/client/build.  
**Impact:** 5

**Controls:**

```text
Dependency review
Lockfile
Vulnerability scanning
Secret scanning
Pinned/trusted CI actions where applicable
Least-privilege CI tokens
Security updates
```

**Open Gaps:** exact scanners/policies unresolved.  
**Residual:** UNVERIFIED

---

# 54. RISK-034 — False PASS / False Production-Ready Claim

**Scenario:** system/feature declared PASS, 100%, complete or production-ready without current evidence.  
**Impact:** 5

**Controls:**

```text
PASS/PARTIAL/FAIL/UNVERIFIED vocabulary
Requirement traceability
Fresh evidence rule
Critical tests cannot be skipped
Backup ≠ Restore Proven
Production Readiness Checklist
```

**Tests / Evidence:** Current commit test/build/migration/security/E2E/UAT/restore evidence according to declared scope.  
**Residual:** UNVERIFIED  
**Owner:** Release / Quality Governance Owner

---

# 55. Cross-Risk Dependencies

بعض المخاطر مركبة.

Examples:

```text
RISK-024 Session compromise
    ↓
RISK-001 Unauthorized action
    ↓
RISK-007 Unauthorized release
```

و:

```text
RISK-010 Concurrency failure
    ↓
RISK-016 Wrong signature version
```

و:

```text
RISK-017 Wrong document version
    ↓
RISK-005 Incorrect QC result
```

Risk analysis لا يجب أن يعامل كل Risk كجزيرة مستقلة.

---

# 56. Detection and Monitoring

Observability Architecture لاحقًا يجب أن يحدد signals مرتبطة بالمخاطر مثل:

```text
Authorization denials
Authentication failures
CSRF failures
Deadlocks / lock waits
Serialization failures
Database unavailable
File validation failures
Restore drill failures
Unexpected error spikes
AI/provider validation failures
```

وجود monitor لا يخفض risk إلا إذا implemented, configured, and verified.

---

# 57. Risk Evidence Classes

Accepted evidence can include:

```text
Automated test results
PostgreSQL integration evidence
Concurrency test output
Security negative tests
Playwright traces/reports
Migration checksums/results
Backup/restore drill record
Audit samples
Configuration verification
UAT evidence
Manual controlled review where automation is insufficient
```

---

# 58. Evidence Freshness

Risk reduction claim يحتاج evidence مناسبة للـcurrent implementation.

Old test report لا يخفض Residual Risk current automatically.

---

# 59. Risk Review Triggers

Risk يجب مراجعته عند:

```text
New critical feature
New permission/role/scope rule
State machine change
Scientific rule/source change
Database migration architecture change
Security incident
New external integration
AI capability expansion
Backup/recovery change
Major dependency/framework upgrade
Production incident
Material operational volume change
```

---

# 60. Risk Reassessment after Incident

أي incident يكشف أن Likelihood/Impact/Control effectiveness كانت غير واقعية:

```text
Reassess
Update controls
Update tests
Update residual rating
Preserve history
```

---

# 61. Unknown Policy Risk Rule

إذا risk يعتمد على policy غير محسومة:

```text
Do not invent policy
Do not lower residual risk
Sensitive operation defaults to DENY/BLOCK when required by Foundation
```

---

# 62. Unknown Scientific Rule Risk

إذا scientific limit/formula/precision غير معتمد:

```text
DO NOT IMPLEMENT AS OFFICIAL RULE
DO NOT TEST AGAINST GUESSED VALUES
DO NOT MARK PASS
```

---

# 63. Risk Acceptance Record

عند اعتماد acceptance لاحقًا يجب أن يحتوي:

```text
Risk ID
Residual rating
Evidence considered
Reason for acceptance
Scope/environment
Known consequences
Acceptance authority
Accepted at
Review/expiry date if policy requires
```

---

# 64. Temporary Acceptance

Temporary risk acceptance لا تصبح دائمة تلقائيًا.

إذا authority تحدد expiry/review date يجب إعادة assessment قبل الاستمرار.

---

# 65. Risk Closure

Risk يمكن أن يصبح `CLOSED` فقط إذا:

```text
Risk no longer applies
or
Control architecture removes scenario materially
and
Evidence supports closure
and
Required authority agrees where applicable
```

Closed risk يبقى تاريخيًا.

---

# 66. Risk Decision Register

## RISK-DEC-001

```text
Decision:
Use 5×5 Likelihood × Impact model.

Status:
APPROVED
```

## RISK-DEC-002

```text
Decision:
Track both Inherent and Residual Risk.

Status:
APPROVED
```

## RISK-DEC-003

```text
Decision:
Impact rating uses the highest materially affected dimension.

Status:
APPROVED
```

## RISK-DEC-004

```text
Decision:
A documented but unimplemented/unverified control does not reduce Residual Risk.

Status:
APPROVED
```

## RISK-DEC-005

```text
Decision:
Risks link to Requirements, Tests and Evidence.

Status:
APPROVED
```

## RISK-DEC-006

```text
Decision:
Residual CRITICAL and VERY HIGH risks block release by default.

Status:
APPROVED
```

## RISK-DEC-007

```text
Decision:
Risk acceptance authority is policy-dependent and not assigned to developers/AI.

Status:
APPROVED
```

## RISK-DEC-008

```text
Decision:
Developer/Agent/AI cannot accept business or compliance risk on behalf of the organization.

Status:
APPROVED
```

## RISK-DEC-009

```text
Decision:
Unknown operational likelihood remains ASSESSMENT REQUIRED; it is never guessed.

Status:
APPROVED
```

## RISK-DEC-010

```text
Decision:
Closed risks remain historically traceable.

Status:
APPROVED
```

## RISK-DEC-011

```text
Decision:
Risk Register feeds Testing Strategy and Production Readiness gates.

Status:
APPROVED
```

## RISK-DEC-012

```text
Decision:
The Foundation register starts with RISK-001 through RISK-034 defined in this document.

Status:
APPROVED
```

---

# 67. Deferred Risk Decisions

| ID | Decision |
|---|---|
| RD-RISK-001 | Final organizational risk acceptance authority |
| RD-RISK-002 | Exact operational Likelihood ratings |
| RD-RISK-003 | Exact residual-risk ratings after implementation |
| RD-RISK-004 | Review cadence |
| RD-RISK-005 | Risk acceptance expiration policy |
| RD-RISK-006 | Risk-management owner assignments by person |
| RD-RISK-007 | Regulatory/compliance-specific risk thresholds if applicable |
| RD-RISK-008 | Formal incident severity mapping |
| RD-RISK-009 | Final production release authority |
| RD-RISK-010 | Quantitative operational-loss model if later required |

---

# 68. Forbidden Risk Patterns

```text
Guessing Likelihood values without evidence
Calling a risk mitigated because a document mentions a control
Developer accepting business risk
AI accepting risk
Closing a risk without evidence
Deleting closed risk history
Using average impact when one dimension is severe
Using code coverage percentage as risk closure proof
Treating backup creation as recovery proof
Treating hidden UI as authorization control evidence
Treating PASS result as Release control
Treating scientific guesses as mitigations
Ignoring policy-dependent gaps
Releasing with unresolved CRITICAL residual risk
```

---

# 69. Risk Review Checklist

```text
[ ] Risk scenario still accurate
[ ] Business consequence still accurate
[ ] Impact dimensions reviewed
[ ] Likelihood supported by evidence or marked ASSESSMENT REQUIRED
[ ] Preventive controls implemented?
[ ] Detective controls implemented?
[ ] Recovery controls implemented?
[ ] Required tests executed?
[ ] Evidence current?
[ ] Residual rating justified?
[ ] Treatment current?
[ ] Owner role assigned?
[ ] Acceptance required?
[ ] Release impact reviewed?
[ ] Open gaps documented?
```

---

# 70. Production Risk Gate Checklist

```text
[ ] No unaccepted residual CRITICAL risk
[ ] No unaccepted residual VERY HIGH risk
[ ] HIGH risks have explicit treatment/evidence/acceptance where required
[ ] Critical scientific risks have approved source evidence
[ ] Authorization/SoD risks have negative-test evidence
[ ] Concurrency risks have real PostgreSQL evidence
[ ] Migration risk has fresh migration evidence
[ ] Backup/restore risk has restore evidence
[ ] Security risks have required verification evidence
[ ] AI authority risk verified where AI enabled
[ ] Readiness claim risk has complete current evidence package
```

---

# 71. Current Foundation Status

هذه الوثيقة تحدد:

```text
Known risks
Required controls
Required verification
Risk governance
Release gating
```

لكنها لا تعني أن controls implemented أو residual risks أصبحت Low.

Current implementation evidence status remains:

```text
UNVERIFIED
```

حتى يوجد implementation وfresh verification evidence.

---

# 72. Final Risk Model

```text
┌───────────────────────────────────────┐
│ Requirement / Business / System Risk │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│ Inherent Risk                        │
│ Likelihood × Highest Impact          │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│ Preventive / Detective / Recovery    │
│ Controls                             │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│ Tests + Operational Evidence         │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│ Residual Risk                        │
└───────────────────┬───────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 Treatment / Acceptance     Release Gate
```

---

# 73. Final Principle

> **Unknown risk is not low risk.  
> Planned control is not verified control.  
> No one reduces residual risk by confidence alone.  
> High-impact controlled decisions require evidence.  
> Release decisions must reflect current residual risk, not documentation quality.**

---

# 74. Document Status

```text
Document:
Documents/RISK-REGISTER.md

Version:
1.0

Risk Model:
5×5 Likelihood × Impact

Assessment:
Inherent + Residual

Impact Rule:
Highest materially affected dimension

Unknown Likelihood:
ASSESSMENT REQUIRED

Control Credit:
Only after implementation + verification

Initial Risks:
RISK-001 through RISK-034

Residual CRITICAL:
Release Blocked

Residual VERY HIGH:
Release Blocked by Default

Risk Acceptance Authority:
POLICY-DEPENDENT

Developer / AI Risk Acceptance:
NOT ALLOWED

Testing Link:
Requirements → Tests → Evidence → Residual Risk

Current Implementation Risk Evidence:
UNVERIFIED

Status:
FOUNDATION — APPROVED RISK GOVERNANCE BASELINE
```

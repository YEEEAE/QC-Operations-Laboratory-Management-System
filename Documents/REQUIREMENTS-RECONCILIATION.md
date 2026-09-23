# REQUIREMENTS-RECONCILIATION.md

# QC Operations & Laboratory Management System

## Requirements Reconciliation Register — v1.0 (QC-100-FINAL-026)

**Document Path:** `Documents/REQUIREMENTS-RECONCILIATION.md`
**Status:** RECONCILIATION LAYER — derived, machine-checked
**Owning task:** QC-100-FINAL-026 (phase A); downstream reconciliation owner QC-100-FINAL-012
**Frozen candidate:** HEAD `6f07cf28fdf63469ab32c294a0943563ea962fff` (clean tree at freeze 2026-09-20)
**Audit comparison baseline:** 2026-09-19 candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`, maturity 45.8%, gates 0/19, NO-GO (`audit/2026-09-18-ULTIMATE-COMPREHENSIVE-SYSTEM-AUDIT.md`)

---

# 1. Purpose and authority

This register reconciles **approved requirements** (`Documents/REQUIREMENTS-TRACEABILITY.md`), **current implementation**, and **open decisions** (`audit/100-percent/POLICY-CLOSURE-MATRIX.md`, `Documents/RISK-REGISTER.md`) into one reviewable record per requirement family.

It is a **derived layer**. It does not replace, weaken, or re-approve any requirement. The source-authority chain of `REQUIREMENTS-TRACEABILITY.md` §4 is unchanged. `PASS ≠ RELEASED`.

Guarded by `scripts/requirements/check-reconciliation.mjs` (structural invariants only; it proves register consistency, not runtime behavior).

# 2. Record contract

Every register row carries:

```text
Requirement ID (stable, this register)   — column 1
Reconciliation ID RC-nn-nnn              — column 2
Requirement statement (+ legacy IDs)     — column 3
Source (governing document / rule)       — column 4
Business objective                       — column 5
Applicability (where it applies)         — column 6
Capability class                         — column 7
Owning task                              — column 8
Technical evidence reference             — column 9
```

**Capability class vocabulary** (exactly two values):

- `MANDATORY` — required capability of the approved product scope; absence or failure is a release-blocking gap.
- `OPTIONAL` — genuine enhancement; never assigned to a capability whose absence would violate an approved requirement, a policy gate, or a controlled-workflow rule. **A required feature must never be reclassified as OPTIONAL to raise scores.**

**Applicability** states the surface the requirement binds: `All controlled actions`, `Quarantine/Receiving`, `Inspection`, `Laboratory`, `Documents/Approvals`, `Production operations`, `All authenticated UI`, `AI surfaces`, etc.

# 3. Stable ID rules

- New-family prefixes: `REQ-AUTHZ`, `REQ-WFLOW`, `REQ-DINT`, `REQ-AUDF`, `REQ-RCOV`, `REQ-AIGV`, `REQ-READY`, `REQ-OPS`, `REQ-SCOPE` (2-digit budget per family).
- Legacy IDs from `REQUIREMENTS-TRACEABILITY.md` (`REQ-ARCH`, `REQ-AUTH`, `REQ-INSP`, …) remain stable and are folded verbatim into the per-section *legacy coverage* lines; they are never renumbered or deleted.
- The **80-domain scoring denominator is unchanged**. Task-family-026 disciplines map onto existing audit domains **D01, D21, D42, D53, D60, D61, D80**; no new scored domain is added.
- Status vocabulary follows `REQUIREMENTS-TRACEABILITY.md` §13–§15: `APPROVED / POLICY-DEPENDENT / SOURCE-DEPENDENT / DEFERRED / REMOVED` for requirements; evidence state is tracked separately and never upgraded without fresh evidence.

# 4. Open-decision reconciliation rule

Requirements whose behavior depends on an unapproved policy or controlled source stay `POLICY-DEPENDENT` / `SOURCE-DEPENDENT` with runtime `DENY` (fail-closed). The open decision is named (PD-xx / RD-xxx) in the row; this register does not close any of them. Resolution owner: QC-100-FINAL-013 (policy) and QC-100-FINAL-026-B (decision/assumption register).

---

# RC-01 — Authorization & security of controlled actions

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-AUTHZ-001 | RC-01-001 | Authorization enforced server-side on every controlled action; client input never authoritative (REQ-AUTH-001, REQ-SEC-001/002/010) | BR-GEN-001, BR-AUTH-001; PERMISSION-MATRIX | No unauthorized controlled mutation | All controlled actions | MANDATORY | QC-100-FINAL-002 (regression) | `tests/integration/security`; `src/middleware.ts`; audit domains D01/D42 |
| REQ-AUTHZ-002 | RC-01-002 | Default deny for undefined or unmapped permissions (REQ-AUTH-002) | BR-GEN-002 | Unknown permission is never silently allowed | All controlled actions | MANDATORY | QC-100-FINAL-002 | negative permission tests; §71 policy runtime rule |
| REQ-AUTHZ-003 | RC-01-003 | Separation of duties enforced server-side; SoD overrides Allow (REQ-AUTH-006) | PERMISSION-MATRIX; P-05 authority sets | Maker cannot check own controlled work | Approvals, release, inspection/lab review | MANDATORY | QC-100-FINAL-013 | SoD tests; two-stage workflow evidence `audit/2026-09-19/QC-100-FINAL-013-*.md` |
| REQ-AUTHZ-004 | RC-01-004 | Scope and entity state participate in authorization (REQ-AUTH-004/005) | BR-AUTH-002 | Cross-scope / wrong-state access denied | All scoped registers and mutations | MANDATORY | QC-100-FINAL-002 | wrong-scope / wrong-state test suites |
| REQ-AUTHZ-005 | RC-01-005 | Record version validated on sensitive mutations; stale version rejected (REQ-AUTH-007, REQ-DATA-022) | BR-GEN-011 | No silent concurrent overwrite | All versioned controlled records | MANDATORY | QC-100-FINAL-002 | stale-version / concurrency tests |
| REQ-AUTHZ-006 | RC-01-006 | Role alone never grants authorization; Admin has no universal business override (REQ-AUTH-003/010) | ROLE-MATRIX; BR-AUTH-004 | Administrative power cannot bypass business integrity | Administration + all domains | MANDATORY | QC-100-FINAL-002 | negative admin tests |
| REQ-AUTHZ-007 | RC-01-007 | Reports, search and exports obey the same authorization scope (REQ-AUTH-008/009, REQ-SEC-007/009) | BR-AUTH-003, BR-SRCH-003 | No out-of-scope disclosure via read surfaces | Reporting, search, export, dashboard | MANDATORY | QC-100-FINAL-011 | report IDOR / scope-leak tests; D42 |
| REQ-AUTHZ-008 | RC-01-008 | Controlled human actions require an authenticated, enabled, personal account (REQ-IDN-001/002/003/005) | BR-IDN-001..005 | Actor identity is trustworthy | All authenticated surfaces | MANDATORY | QC-100-FINAL-002 | session/identity integration tests |
| REQ-AUTHZ-009 | RC-01-009 | Session and password hygiene: reset invalidates sessions; secrets never plaintext or committed (REQ-IDN-004, REQ-SEC-004/005/006) | BR-IDN-004; SECURITY-ARCHITECTURE | Credential compromise does not cascade | Identity / session management | MANDATORY | QC-100-FINAL-015 | credential safety gate `audit/2026-09-19/QC-100-FINAL-015-*.md` |
| REQ-AUTHZ-010 | RC-01-010 | Middleware never replaces domain authorization; Astro Actions re-authorize server-side (REQ-ARCH-010, REQ-AUTH-011) | PERMISSION-MATRIX; Astro architecture | Defense in depth at the delivery boundary | Delivery layer | MANDATORY | QC-100-FINAL-002 | action integration tests; architecture guard |
| REQ-AUTHZ-011 | RC-01-011 | Health/readiness failures sanitize dependency detail; `sslmode=disable` rejected; no host/secret/exception leakage (REQ-SEC-005 family, REQ-HLTH-*) | SECURITY-ARCHITECTURE; OBSERVABILITY-ARCHITECTURE | Diagnostics never become a disclosure channel | Health/observability endpoints | MANDATORY | QC-100-FINAL-014 | sanitized 503 evidence; D53 (operational health) |
| REQ-AUTHZ-012 | RC-01-012 | Production restore authority explicitly approved and bound to named owner identity (REQ-BKP-008) | PERMISSION-MATRIX; PERM-BKP-RESTORE-PRODUCTION | Restore power is accountable, not generic admin | Backup / recovery operations | MANDATORY | QC-100-FINAL-013 | POLICY-DEPENDENT — restore authority decision open (PD family); runtime DENY |

# RC-02 — Controlled workflow & scientific integrity

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-WFLOW-001 | RC-02-001 | PASS is never RELEASED: inspection/lab PASS has no release effect by itself (REQ-QUAR-009 family; Mind invariant) | SYSTEM-INVARIANTS; STATE-MACHINES | Release stays an explicit authorized act | Quarantine / receiving / laboratory | MANDATORY | QC-100-FINAL-013 | quarantine state-machine tests; D01 |
| REQ-WFLOW-002 | RC-02-002 | Release executes only via approved two-stage controlled workflow with explicit authority set (REQ-QUAR-008; PD-32 signature scope) | BR-QUAR-008; P-05 (Supervisor/Manager/yazeed) | Release decision is attributable and authorized | Quarantine release | MANDATORY | QC-100-FINAL-013 | two-stage workflow evidence `audit/2026-09-19/QC-100-FINAL-013-*.md` |
| REQ-WFLOW-003 | RC-02-003 | Reject decisions use an explicit policy source; default policy throws `POLICY_SOURCE_REQUIRED` (fail-closed) | STATE-MACHINES; reject policy (PD-38 OPEN) | No invented reject authority | Quarantine reject path | MANDATORY | QC-100-FINAL-013/026 | `LabRejectPolicy` fail-closed behavior; reject-reports acceptance `audit/2026-09-19/QC-100-FINAL-014-*.md` |
| REQ-WFLOW-004 | RC-02-004 | Scientific evaluation is server-side only; PASS/FAIL/HOLD stored only from an injected evaluator whose `sourceReference`/`contentHash` match the frozen context (REQ-INSP-004/006, REQ-LAB-020) | BR-INSP-004/006, BR-LAB-021 | No invented limits, units, formulas or tolerances | Inspection + laboratory | MANDATORY | QC-100-FINAL-013 | SOURCE-DEPENDENT; `PostgresControlledLabSources.evaluate()` throws |
| REQ-WFLOW-005 | RC-02-005 | Equipment eligibility verified fail-closed at submit: ACTIVE, not under maintenance, current-calibration pointer matches a CURRENT non-overdue calibration (REQ-EQP-*, REQ-CAL-*) | BR-CAL-004; equipment/calibration state rules | Results only from eligible instruments | Laboratory / inspection execution | MANDATORY | QC-100-FINAL-013 | equipment eligibility checks; calibration supersession atomicity |
| REQ-WFLOW-006 | RC-02-006 | Submit freezes controlled context; submitted report not freely editable; reviewer cannot silently rewrite author results (REQ-INSP-009/010/011) | BR-INSP-010/011/012 | Immutable review trail | Inspection workflow | MANDATORY | QC-100-FINAL-013 | snapshot + return-path tests |
| REQ-WFLOW-007 | RC-02-007 | Approval + consequences atomic; approval verifies current version (REQ-INSP-012/013, REQ-DATA-023) | BR-INSP-013/014 | No half-applied approvals | Inspection / document / change approvals | MANDATORY | QC-100-FINAL-013 | integration transaction tests |
| REQ-WFLOW-008 | RC-02-008 | Retest authorization and count policy explicit; retest never detached from original test (REQ-LAB-018; RISK-019) | BR-LAB-018; PERM-LAB-AUTHORIZE-RETEST | No result shopping | Laboratory | MANDATORY | QC-100-FINAL-013 | POLICY-DEPENDENT — retest policy open; runtime DENY |
| REQ-WFLOW-009 | RC-02-009 | Controlled inspection uses approved template version; exact template/source snapshot retained (REQ-INSP-001/003, REQ-TMPL-001..006) | BR-INSP-001/003; P-06 | Reproducible inspection basis | Inspection templates | MANDATORY | QC-100-FINAL-013 | template-version snapshot evidence |
| REQ-WFLOW-010 | RC-02-010 | E-Signatures bound to exact subject/version; required-signature actions explicit (REQ-ESIG-*) | BR-ESIG-*; PERMISSION-MATRIX | Signature means the signed thing | Approvals / release / documents | MANDATORY | QC-100-FINAL-013 | REQ-ESIG-008 POLICY-DEPENDENT; signature binding tests |
| REQ-WFLOW-011 | RC-02-011 | Document approval/effective-date policy and version activation follow P-05/state/version rules; allowlist fields only (`revision`, `changeSummary`, `contentHash`) (REQ-DOC-007/008, REQ-CHG-*) | BR-DOC-009; change-request allowlist | No uncontrolled document drift | Controlled documents / change requests | MANDATORY | QC-100-FINAL-013 | POLICY-DEPENDENT (approver/effective-date open); FOR UPDATE stale-version guard |
| REQ-WFLOW-012 | RC-02-012 | Findings/NCR/CAPA/VOID stay bound to approved state machines, evidence and signatures (REQ-QUAL-*) | STATE-MACHINES; BR-QUAL-* | Quality records are decision-grade | Quality module | MANDATORY | QC-100-FINAL-013 | NCR/CAPA closure authority POLICY-DEPENDENT; state-machine tests |
| REQ-WFLOW-013 | RC-02-013 | Duplicate receiving definition never invented; receiving intake rules come from approved source (REQ-QUAR-010) | BR-QUAR-011; TR-RCV-001 | Intake integrity without guessed rules | Quarantine / receiving | MANDATORY | QC-100-FINAL-013 | POLICY-DEPENDENT; runtime DENY |
| REQ-WFLOW-014 | RC-02-014 | Acceptance criteria, test definitions, environmental requirements and required evidence come from approved controlled sources only (REQ-INSP-008, REQ-LAB-002/008/011) | BR-INSP-009, BR-LAB-002/008/011 | No uncontrolled scientific input | Inspection + laboratory | MANDATORY | QC-100-FINAL-013 | SOURCE-DEPENDENT; evidence_links / template_version bindings |

# RC-03 — Data & concurrency integrity

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-DINT-001 | RC-03-001 | Critical operations transactional; approval consequences atomic (REQ-DATA-020/023/024/025/026) | BR-GEN-009, BR-INSP-014, BR-CHG-007 | No partial controlled state | All controlled mutations | MANDATORY | QC-100-FINAL-002 | integration rollback tests |
| REQ-DINT-002 | RC-03-002 | Critical commands idempotent; ambiguous commit outcomes replay the recorded result, conflicting fingerprints rejected (REQ-DATA-021) | BR-GEN-010 | Retries never duplicate controlled effects | Mutation entry points / outbox | MANDATORY | QC-100-FINAL-025 | idempotency exercise S2 `audit/2026-09-20/QC-100-FINAL-025-*.md` (local, disposable data) |
| REQ-DINT-003 | RC-03-003 | Concurrent edits never silently overwrite; version + FOR UPDATE re-read on sensitive paths (REQ-DATA-022, REQ-AUTH-007) | BR-GEN-011 | Lost updates impossible | Versioned controlled records | MANDATORY | QC-100-FINAL-002 | concurrency suites (Docker-blocked on this host — see Open Issues) |
| REQ-DINT-004 | RC-03-004 | Controlled history avoids destructive cascade; approved records not silently edited; master-data changes never rewrite history (REQ-DATA-007, RISK-013/014) | DATA-MODEL; SYSTEM-INVARIANTS | Historical truth survives correction | All controlled data | MANDATORY | QC-100-FINAL-002 | DB negative tests; snapshot rows |
| REQ-DINT-005 | RC-03-005 | Historical migrations immutable; migration drift detected (REQ-DATA-012, RISK-026) | SYSTEM-INVARIANTS; `db/migrations/README.md` | Schema provenance is verifiable | Database lifecycle | MANDATORY | QC-100-FINAL-002 | `db:migrate:check` integrity ledger; head `0031` |
| REQ-DINT-006 | RC-03-006 | Business numbers collision-safe under concurrency (RISK-027) | DATA-MODEL | Human-readable IDs unique | Numbering sequences | MANDATORY | QC-100-FINAL-002 | DB race tests |
| REQ-DINT-007 | RC-03-007 | Scientific NUMERIC precision from controlled requirement only (REQ-DATA-011, RISK-009) | DATA-DICTIONARY | No invented rounding | Scientific fields | MANDATORY | QC-100-FINAL-013 | SOURCE-DEPENDENT |
| REQ-DINT-008 | RC-03-008 | Technical IDs UUID; human business IDs separate; TIMESTAMPTZ/DATE discipline; normalized truth; snapshots over JSONB blobs (REQ-DATA-001..010) | DATA-MODEL; DATA-DICTIONARY | Predictable data contract | Whole schema | MANDATORY | QC-100-FINAL-002 | schema tests |
| REQ-DINT-009 | RC-03-009 | Timezone/date interpretation never changes business meaning (RISK-032) | DATA-DICTIONARY | Dates mean the same everywhere | All dated records | MANDATORY | QC-100-FINAL-002 | timezone tests |
| REQ-DINT-010 | RC-03-010 | Starting/master data only from approved manifest; reference-data control policy explicit (REQ-ADM-005; FIRST-USE-DATA-MANIFEST) | BR-ADM-004; PERM-ADM-REFERENCE-DATA | No uncontrolled seed data | Initial data load | MANDATORY | QC-100-FINAL-019 | approved starting-data evidence `audit/2026-09-20/QC-100-FINAL-019-*.md`; reference-data policy POLICY-DEPENDENT |

# RC-04 — Audit, files & disclosure

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-AUDF-001 | RC-04-001 | Audit history preserved and tamper-evident by design; audit query contract is the only read path; raw payload never exposed (REQ-AUD-*, RISK-015) | SYSTEM-INVARIANTS; audit-query contract | Traceability survives incidents | Audit surfaces | MANDATORY | QC-100-FINAL-002 | `audit-query.ts` contract; D60 (audit/traceability discipline) |
| REQ-AUDF-002 | RC-04-002 | Audit cryptographic-integrity mechanism never falsely claimed (REQ-AUD-007) | BR-AUD-007 | Honest integrity claims | Audit records | MANDATORY | QC-100-FINAL-013 | POLICY-DEPENDENT — mechanism not claimed |
| REQ-AUDF-003 | RC-04-003 | Controlled files/evidence access authorized; URLs never bypass authorization; malicious/invalid uploads rejected per explicit policy (REQ-FILE-*, REQ-SEC-008, RISK-020/021) | DATA-DICTIONARY; SECURITY-ARCHITECTURE | Evidence files are protected data | Files / evidence module | MANDATORY | QC-100-FINAL-002 | file authorization tests; REQ-FILE-008 scan policy POLICY-DEPENDENT |
| REQ-AUDF-004 | RC-04-004 | Report/export scope equals UI scope; spreadsheet formula injection prevented (REQ-RPT-*, REQ-SEC-009, RISK-022/023) | BR-AUTH-003; export rules | Exports disclose exactly what the user may see | Reporting / export | MANDATORY | QC-100-FINAL-011 | export scope tests; cross-domain reporting evidence `audit/2026-09-19/QC-100-FINAL-011-*.md` |
| REQ-AUDF-005 | RC-04-005 | Sensitive errors never leak secrets, hosts or raw exceptions (REQ-SEC-005 family, RISK-025) | ERROR-ARCHITECTURE | Failure output is safe to show | All error paths | MANDATORY | QC-100-FINAL-014 | redaction tests; sanitized 503 evidence |
| REQ-AUDF-006 | RC-04-006 | Notifications in-app only until an external channel is explicitly approved; no external notification claimed (REQ-NOT-*) | SYSTEM-INVARIANTS; DEP-025-04 record | No phantom alerting | Notification module | MANDATORY | QC-100-FINAL-025 | first-day checklist dependency register DEP-025 |
| REQ-AUDF-007 | RC-04-007 | Search never reveals unauthorized records (REQ-AUTH-009, REQ-SRCH-*) | BR-SRCH-003 | Discovery surface is scope-safe | Search | MANDATORY | QC-100-FINAL-002 | negative search tests |
| REQ-AUDF-008 | RC-04-008 | Evidence append-only for recovery/verification records; no mutation of recorded evidence (Mind invariant: immutable evidence) | SYSTEM-INVARIANTS | Evidence stays credible | Verification / recovery records | MANDATORY | QC-100-FINAL-025 | recovery evidence append-only; `run-recovery-checklist` |
| REQ-AUDF-009 | RC-04-009 | Dashboard/report counts reproduce the exact row set of their link target; `null` means not available, never shown as zero (REQ-DASH-*) | REQUIREMENTS-TRACEABILITY §Dashboard; QC-100-FINAL-017 count contract | Numbers are auditable | Dashboard / KPIs | MANDATORY | QC-100-FINAL-017 | count-contract tests `tests/unit` dashboard suites |
| REQ-AUDF-010 | RC-04-010 | Copy/terminology governed; regulated terms and lifecycle words separated (saved/submitted/reviewed/approved/released) | COPY-GLOSSARY; UX-WRITING-GUIDE | Users cannot misread record state | All authenticated UI | MANDATORY | QC-100-FINAL-023 | copy governance contract `tests/unit/ui/copy-governance-contract.test.ts` |

# RC-05 — Availability, recovery & dependency

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-RCOV-001 | RC-05-001 | Backups exist, are restorable, and restores are drilled on an isolated explicit target (REQ-BKP-*; RISK-028) | BACKUP-RECOVERY-PLAN; RESTORE-DRILL-RUNBOOK | Backup is a recovery capability, not a file | Backup / recovery | MANDATORY | QC-100-FINAL-008 | populated-bundle isolated restore `audit/2026-09-19/QC-100-FINAL-008-*.md`; 025 re-drill on head `0031` PASS (local) |
| REQ-RCOV-002 | RC-05-002 | RPO explicitly approved before claimed (REQ-BKP-006) | BR-BKP-006 | Recovery point is a decision, not a guess | Production operations | MANDATORY | QC-100-FINAL-013 | BLOCKED — implementation hard-codes 86,400s, but PD-26 is OPEN; no approved target or provider measurement |
| REQ-RCOV-003 | RC-05-003 | RTO explicitly approved before claimed (REQ-BKP-007) | BR-BKP-007 | Recovery time is a decision | Production operations | MANDATORY | QC-100-FINAL-013 | BLOCKED — implementation hard-codes 14,400s, but PD-27 is OPEN; local restore 435 ms is not production RTO |
| REQ-RCOV-004 | RC-05-004 | Daily-backup scheduler and monthly restore drill are calendar-contract only until an approved scheduler is wired (DEP-025-02) | BACKUP-RECOVERY-PLAN; FIRST-DAY-OPERATING-CHECKLIST | No unmonitored silent gap | Production operations | MANDATORY | QC-100-FINAL-025 | BLOCKED — no scheduler; recorded as external dependency |
| REQ-RCOV-005 | RC-05-005 | No provider monitoring/alerting channel exists; do not claim it (DEP-025-03) | OBSERVABILITY-ARCHITECTURE | Honest operability | Production operations | MANDATORY | QC-100-FINAL-007 | BLOCKED — provider telemetry NOT VERIFIED |
| REQ-RCOV-006 | RC-05-006 | Health/readiness use one canonical DB check with canonical TLS config (REQ-HLTH-*) | DATABASE-ARCHITECTURE; RENDER-DATABASE-CONNECTION | Readiness means what it says | Health endpoints | MANDATORY | QC-100-FINAL-014 | canonical readiness check evidence |
| REQ-RCOV-007 | RC-05-007 | External dependency failure degrades sanitized and fail-closed; never corrupts local business outcome (RISK-029; REQ-HLTH-*; outbox pattern) | ERROR-ARCHITECTURE; OBSERVABILITY-ARCHITECTURE | Dependency failure ≠ data corruption | All integration edges | MANDATORY | QC-100-FINAL-025 | exercise S1/S3 PASS (local) `audit/2026-09-20/QC-100-FINAL-025-*.md` |
| REQ-RCOV-008 | RC-05-008 | Incident/problem runbook and first-day checklist derived from approved policy with explicit READY(local)/PENDING(external) split | INCIDENT-PROBLEM-RUNBOOK; FIRST-DAY-OPERATING-CHECKLIST | Operable first day, honestly bounded | Operations | MANDATORY | QC-100-FINAL-025 | runbook + checklist documents; recovery exercise 6/6 exit 0 |
| REQ-RCOV-009 | RC-05-009 | Deployment identity reproducible: release identity bound to SHA/build/version/migration head (REQ-BKP/HLTH family) | RENDER-DEPLOYMENT; release scripts | Deployments are attributable | Deployment | MANDATORY | QC-100-FINAL-001 | `release:identity` / `release:verify` scripts; production migration gate BLOCKED |
| REQ-RCOV-010 | RC-05-010 | Performance/observability: no N+1 on admin grant reads; indexes present; request IDs consistent in responses and logs (REQ-TST/HLTH family) | OBSERVABILITY-ARCHITECTURE; migration `0029` | System diagnosable under load | Platform-wide | MANDATORY | QC-100-FINAL-014 | focused 41/41 PASS; representative volume NOT VERIFIED |
| REQ-RCOV-011 | RC-05-011 | Uptime/availability claims require provider evidence; none claimed | DEPLOYMENT-ARCHITECTURE | No availability fiction | Production operations | MANDATORY | QC-100-FINAL-001 | BLOCKED — provider parity drift recorded; gates 0/19 |
| REQ-RCOV-012 | RC-05-012 | Production incident response has a documented owner chain and reversible first actions before any external escalation | INCIDENT-PROBLEM-RUNBOOK; FIRST-DAY-OPERATING-CHECKLIST | Incidents are handled, not improvised | Production operations | MANDATORY | QC-100-FINAL-025 | runbook DEP-025 register; external paging/notification BLOCKED (DEP-025-04) |

# RC-06 — AI governance

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-AIGV-001 | RC-06-001 | AI is advisory-only; cannot approve/reject/release/sign or set official PASS/FAIL (REQ-AI-003/004/005; RISK-030) | BR-AI-003..008 | AI never acquires controlled authority | AI surfaces | MANDATORY | QC-100-FINAL-009 | AI advisory negative tests (66 PASS on candidate 95d1380 — superseded snapshot) |
| REQ-AIGV-002 | RC-06-002 | AI receives only authorized context; detected PII/secret-like input blocked before provider access (REQ-AI-006) | BR-AI-009; SECURITY-ARCHITECTURE | No data leakage to providers | AI surfaces | MANDATORY | QC-100-FINAL-009 | boundary-block evidence; live provider smoke NOT VERIFIED |
| REQ-AIGV-003 | RC-06-003 | Structured AI output schema-validated; output visibly advisory; authority-claiming text rejected (REQ-AI-007/008) | BR-AI-010/011 | AI output cannot masquerade as decision | AI surfaces | MANDATORY | QC-100-FINAL-009 | contract + UX tests |
| REQ-AIGV-004 | RC-06-004 | AI invocation metadata auditable; prompt/output retention policy explicit (REQ-AI-009/010) | BR-AI-012; DATA-DICTIONARY | AI usage is reviewable | AI surfaces | MANDATORY | QC-100-FINAL-013 | REQ-AI-010 retention POLICY-DEPENDENT |
| REQ-AIGV-005 | RC-06-005 | Fail-safe refusal for high-risk unsupported-source requests; source identity/citations preserved when supplied | AI-PROVIDERS governance dataset `qc-ai-governance-v2` / 2.0.0 | Unsupported advice refused, not guessed | AI surfaces | MANDATORY | QC-100-FINAL-009 | deterministic dataset evaluation evidence |
| REQ-AIGV-006 | RC-06-006 | Provider configuration server-only; sanitized provider metadata; Groq primary / Gemini fallback / DisabledAiProvider final fallback | AI-PROVIDERS | No client-side provider secrets | AI configuration | MANDATORY | QC-100-FINAL-009 | provider config tests; Render provider config NOT VERIFIED |
| REQ-AIGV-007 | RC-06-007 | External data-processing approval is an explicit external dependency before live provider use | AI-PROVIDERS | Legal/organizational consent precedes data flow | AI surfaces | MANDATORY | QC-100-FINAL-013 | BLOCKED — external approval missing |
| REQ-AIGV-008 | RC-06-008 | AI capability is not required for any core QC workflow; system fully operable with DisabledAiProvider | DOMAIN-MAP | AI is an enhancement surface, not a dependency | AI surfaces | OPTIONAL | QC-100-FINAL-009 | disabled-provider fallback path tests |

# RC-07 — Readiness, UAT & evidence governance

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-READY-001 | RC-07-001 | PASS is a test result, never a release claim; no false Production-Ready statements (RISK-034) | REQUIREMENTS-TRACEABILITY §63; SYSTEM-INVARIANTS | Claims match evidence | All reporting / audit output | MANDATORY | QC-100-FINAL-026 | this register + priority matrix; PASS != RELEASED invariant |
| REQ-READY-002 | RC-07-002 | UAT executed by real personas with signed acceptance before release claims (REQ-UAT-*) | UAT-ACCEPTANCE-PLAN | Human acceptance is real | Release governance | MANDATORY | QC-100-FINAL-004 | BLOCKED — UAT UNVERIFIED; preflight is not UAT evidence (016 record) |
| REQ-READY-003 | RC-07-003 | Production release evidence server-derived via release_gate_evidence / release_risk_evidence; browser submits intent only (P-07) | REQUIREMENTS-TRACEABILITY P-07 | Release approval cannot be forged client-side | Release governance | MANDATORY | QC-100-FINAL-013 | P-07 contract; 8-gate provenance rules |
| REQ-READY-004 | RC-07-004 | Evidence carries SHA, branch, timestamp, environment, command, exit code, affected requirement IDs (§16); stale evidence re-verified (§17) | REQUIREMENTS-TRACEABILITY §16/§17 | Evidence is reproducible | All verification | MANDATORY | QC-100-FINAL-026 | audit file headers; this task freeze block |
| REQ-READY-005 | RC-07-005 | Requirement-to-evidence traceability complete: every controlled requirement maps to verification (G-010) | REQUIREMENTS-TRACEABILITY §95/§96 | No untraced controlled requirement | Governance | MANDATORY | QC-100-FINAL-026 | this register + scripts/requirements/check-reconciliation.mjs |
| REQ-READY-006 | RC-07-006 | 80-domain scoring denominator fixed; disciplines never added as new scored domains; scores evidence-derived | audit/100-percent/QC-CLOSURE-017-FINAL-80-DOMAIN-AUDIT.md method | Score integrity | Audit / scoring | MANDATORY | QC-100-FINAL-012 | D01/D21/D42/D53/D60/D61/D80 mapping, this document section 3 |
| REQ-READY-007 | RC-07-007 | Exact-head CI evidence for the release candidate | TESTING-STRATEGY; CI gate §58 | CI proves the shipped thing | CI/CD | MANDATORY | QC-100-FINAL-002 | BLOCKED — remote CI run for current HEAD not captured |
| REQ-READY-008 | RC-07-008 | Node/toolchain contract honored on all verification runs (>=24.20.0 <25) | package.json engines | Reproducible toolchain | All verification | MANDATORY | QC-100-FINAL-002 | host runs v22.22.3 — recorded deviation; CI uses contract version |
| REQ-READY-009 | RC-07-009 | Production migration gate: no production migration without explicit scoped authorization; applied-head parity proven | RENDER-MIGRATION-RUNBOOK | No silent schema drift in production | Production database | MANDATORY | QC-100-FINAL-001 | BLOCKED — Render applied-head drift recorded (0018 vs source 0031 at 2026-09-18) |
| REQ-READY-010 | RC-07-010 | No artificial 100%: percentage integrity rule and claims-vs-reality separation (§77/§80) | REQUIREMENTS-TRACEABILITY §77/§80 | Scores cannot be inflated | Audit / scoring | MANDATORY | QC-100-FINAL-026 | priority matrix keeps likelihood ASSESSMENT REQUIRED |
| REQ-READY-011 | RC-07-011 | Accessibility evidence: axe + manual keyboard/RTL/zoom/reduced-motion matrix on authenticated pages (REQ-UX/A11y family) | UI-UX-SPECIFICATION; UAT-ACCEPTANCE-PLAN | Accessibility is verified, not asserted | All authenticated UI | MANDATORY | QC-100-FINAL-006/040 | BLOCKED — authenticated a11y matrix open (006/040 own execution) |
| REQ-READY-012 | RC-07-012 | Final evidence reconciliation is owned centrally; family evidence feeds final audit | REQUIREMENTS-TRACEABILITY §20; QC-100-FINAL-012 reconciliation role | One reconciled truth at release time | Governance | MANDATORY | QC-100-FINAL-012 | handoff records of this task family |

# RC-08 — Operations, usability & accessibility

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-OPS-001 | RC-08-001 | Role-based operational UX: each role sees its authorized work surface (REQ-UX-002) | ROLE-MATRIX; ROLE-OPERATING-GUIDES | Users act only on their work | All authenticated UI | MANDATORY | QC-100-FINAL-020 | role operating guides; authorization-visibility decision |
| REQ-OPS-002 | RC-08-002 | Dashboard answers what needs my attention with count-contract links and honest null states (REQ-UX-001, REQ-DASH-*) | QC-SYSTEM-DESIGN-CONSTITUTION; 017/022 contracts | Attention routing is truthful | Dashboard / /work | MANDATORY | QC-100-FINAL-017/022 | 10 action counts contract tests; my-work surface guard |
| REQ-OPS-003 | RC-08-003 | Data-heavy registers use tables/grids with server-side filters (REQ-UX-003) | UI-UX-SPECIFICATION | Operational density without deception | Registers | MANDATORY | QC-100-FINAL-005 | shared UI/navigation/forms/grids evidence `audit/2026-09-20/QC-100-FINAL-005-*.md` |
| REQ-OPS-004 | RC-08-004 | Forms: logical tab order, inline validation + error summary, first-invalid-field focus, unsaved-change protection, double-submit prevention (REQ-UX-004..008) | DESIGN-SYSTEM; UI-UX-SPECIFICATION | Safe data entry | All forms | MANDATORY | QC-100-FINAL-005 | form/a11y test suites; browser E2E blocked on this host |
| REQ-OPS-005 | RC-08-005 | Scientific fields always display units (REQ-UX-009) | DATA-DICTIONARY; UI-UX-SPECIFICATION | No ambiguous measurements | Scientific UI | MANDATORY | QC-100-FINAL-018 | product wording completion evidence |
| REQ-OPS-006 | RC-08-006 | Desktop-first operational workflows; tablet/mobile usable adaptively (REQ-UX-010/011) | UI-UX-SPECIFICATION | Field access without degradation | All authenticated UI | MANDATORY | QC-100-FINAL-005 | responsive review; authenticated matrix BLOCKED (external) |
| REQ-OPS-007 | RC-08-007 | Contextual guidance and next actions derived from real state (021) | UI-UX-SPECIFICATION; DOMAIN-MAP | Guidance never invents state | All authenticated UI | MANDATORY | QC-100-FINAL-021 | contextual guidance evidence `audit/2026-09-20/QC-100-FINAL-021-*.md` |
| REQ-OPS-008 | RC-08-008 | Terminology governance: single vocabulary source; regulated terms separated (023) | COPY-GLOSSARY; UX-WRITING-GUIDE | No ambiguous operational words | All copy | MANDATORY | QC-100-FINAL-023 | copy-governance contract tests |
| REQ-OPS-009 | RC-08-009 | Accessibility WCAG 2.2 AA target on authenticated workflows (REQ-UX family; D53 discipline boundary: a11y checks owned by 006/040) | UI-UX-SPECIFICATION §A11y | Usable by all operators | All authenticated UI | MANDATORY | QC-100-FINAL-006/040 | PARTIAL — axe/manual matrix pending |
| REQ-OPS-010 | RC-08-010 | First-use data manifest and master-data import are controlled and preflighted | FIRST-USE-DATA-MANIFEST; MASTER-DATA-STARTING-DATA | First day starts from approved data | Initial operation | MANDATORY | QC-100-FINAL-019 | starting-data evidence + import preflight script |
| REQ-OPS-011 | RC-08-011 | Support ownership register: every failure mode has a named owner and first response | SUPPORT-OWNERSHIP-REGISTER; INCIDENT-QUICK-REFERENCE | No orphan failures | Operations | MANDATORY | QC-100-FINAL-020 | support ownership register document |
| REQ-OPS-012 | RC-08-012 | Non-essential visual/animation assets (Lottie etc.) loaded only when pipeline approved; never block workflows | DESIGN-SYSTEM | Decoration never gates operation | Presentation layer | OPTIONAL | QC-100-FINAL-005 | asset-pipeline note in Open Issues |

# RC-09 — Product scope & governance

| Requirement ID | RC ID | Requirement (legacy IDs) | Source | Business objective | Applicability | Capability | Owning task | Technical evidence reference |
|---|---|---|---|---|---|---|---|---|
| REQ-SCOPE-001 | RC-09-001 | Product scope = the approved controlled QC workflow: quarantine, inspection, laboratory, quality, documents, equipment/calibration, tasks, reporting, audit (REQ-ARCH-004; DOMAIN-MAP) | DOMAIN-MAP; QC-SYSTEM-DESIGN-CONSTITUTION | One bounded product, no scope creep | Whole system | MANDATORY | QC-100-FINAL-026 | domain map + route matrix (85 routes, D80 index) |
| REQ-SCOPE-002 | RC-09-002 | Reject reports / issue slips within scope with role parity (REJECT-REPORTS; migration 0030/0031) | REJECT-REPORTS; BUSINESS-RULES | Rejection is a first-class controlled outcome | Quarantine / reject reporting | MANDATORY | QC-100-FINAL-014 | reject-reports acceptance `audit/2026-09-19/QC-100-FINAL-014-*.md` |
| REQ-SCOPE-003 | RC-09-003 | Dashboard intelligence: read models before display; NOT_SUPPLIED products declared with named source/owner, never estimated (017) | DOMAIN-MAP; 017 contract | Honest command center | Dashboard | MANDATORY | QC-100-FINAL-017 | coverage-panel derivation; remaining read-model gaps recorded |
| REQ-SCOPE-004 | RC-09-004 | Cross-domain reporting/import/bulk within authorized dataset contract (011) | BUSINESS-RULES; DATA-MODEL | Bulk never bypasses per-record rules | Reporting / import | MANDATORY | QC-100-FINAL-011 | cross-domain evidence `audit/2026-09-19/QC-100-FINAL-011-*.md` |
| REQ-SCOPE-005 | RC-09-005 | Product analytics measurement plan exists; analytics never collect beyond approved plan | PRODUCT-ANALYTICS-MEASUREMENT-PLAN | Measurement is deliberate | Analytics | OPTIONAL | QC-100-FINAL-026 | measurement plan document; implementation not claimed |
| REQ-SCOPE-006 | RC-09-006 | Recurring task generation deferred pending policy (REQ-TASK-008) | BR-TASK-009 | No uncontrolled automation | Tasks | OPTIONAL | QC-100-FINAL-013 | DEFERRED/POLICY status retained |
| REQ-SCOPE-007 | RC-09-007 | Automatic NCR and effectiveness policies not invented (REQ-QUAL-009/010) | BR-QUAL-010/033 | Policy drives automation, not code defaults | Quality | MANDATORY | QC-100-FINAL-013 | POLICY-DEPENDENT; runtime DENY |
| REQ-SCOPE-008 | RC-09-008 | Route manifest machine-verifiable; every route registered; no broken navigation (REQ-ARCH-011/012; ROUTE-MATRIX) | ROUTE-MANIFEST-SPECIFICATION; SYSTEM-INVARIANTS | Surface inventory is provable | Delivery layer | MANDATORY | QC-100-FINAL-002 | route manifest tests; `test:architecture` |
| REQ-SCOPE-009 | RC-09-009 | Technology change control: framework/database independence requirements honored (§87/§88/§89) | REQUIREMENTS-TRACEABILITY §87-§89 | No silent stack drift | Platform | MANDATORY | QC-100-FINAL-026 | stack contract unchanged: Astro + PostgreSQL + pnpm 11.25.0 |
| REQ-SCOPE-010 | RC-09-010 | Two-stage controlled approval trace documented for creation parity (103; migration 0031) | REQUIREMENTS-TRACEABILITY §103 | Creation approvals are traceable | Controlled creation paths | MANDATORY | QC-100-FINAL-013 | two-stage workflow evidence |

# 5. Audit-domain mapping (denominator unchanged)


Task-family-026 disciplines map onto existing audit domains and are **not** new scored domains:

| Discipline | Existing audit domain IDs | Register sections |
|---|---|---|
| Requirements Engineering & Business Analysis | D01, D42 | RC-01, RC-02, RC-07, RC-09 |
| Product Design / Product Strategy | D53, D60 | RC-08, RC-09 |
| Risk Management / Operational Risk | D61, D80 | RC-03, RC-04, RC-05, RC-06, `Documents/GAP-RISK-PRIORITY-MATRIX.md` |

The 80-domain scoring denominator is unchanged. All domain IDs D01..D80 of the 2026-09-19 audit (`audit/2026-09-18-ULTIMATE-COMPREHENSIVE-SYSTEM-AUDIT.md`) are retained verbatim; the guard asserts their presence.

# 6. Legacy requirement ID coverage

Every legacy requirement ID defined in `Documents/REQUIREMENTS-TRACEABILITY.md` is folded into this register verbatim (never renumbered, never deleted). Mapping: requirement families RC-01..RC-09 correspond to legacy families as follows — legacy IDs are listed exactly as defined:
- **REQ-ARCH** → RC-08/RC-09 (delivery architecture & scope): REQ-ARCH-001, REQ-ARCH-002, REQ-ARCH-003, REQ-ARCH-004, REQ-ARCH-005, REQ-ARCH-006, REQ-ARCH-007, REQ-ARCH-008, REQ-ARCH-009, REQ-ARCH-010, REQ-ARCH-011, REQ-ARCH-012
- **REQ-IDN** → RC-01 (identity): REQ-IDN-001, REQ-IDN-002, REQ-IDN-003, REQ-IDN-004, REQ-IDN-005, REQ-IDN-006
- **REQ-AUTH** → RC-01 (authorization): REQ-AUTH-001, REQ-AUTH-002, REQ-AUTH-003, REQ-AUTH-004, REQ-AUTH-005, REQ-AUTH-006, REQ-AUTH-007, REQ-AUTH-008, REQ-AUTH-009, REQ-AUTH-010, REQ-AUTH-011
- **REQ-TASK** → RC-08/RC-09 (tasks): REQ-TASK-001, REQ-TASK-002, REQ-TASK-003, REQ-TASK-004, REQ-TASK-005, REQ-TASK-006, REQ-TASK-007, REQ-TASK-008
- **REQ-QUAL** → RC-02 (quality): REQ-QUAL-001, REQ-QUAL-002, REQ-QUAL-003, REQ-QUAL-004, REQ-QUAL-005, REQ-QUAL-006, REQ-QUAL-007, REQ-QUAL-008, REQ-QUAL-009, REQ-QUAL-010
- **REQ-QUAR** → RC-02 (quarantine): REQ-QUAR-001, REQ-QUAR-002, REQ-QUAR-003, REQ-QUAR-004, REQ-QUAR-005, REQ-QUAR-006, REQ-QUAR-007, REQ-QUAR-008, REQ-QUAR-009, REQ-QUAR-010, REQ-QUAR-011
- **REQ-TMPL** → RC-02 (templates): REQ-TMPL-001, REQ-TMPL-002, REQ-TMPL-003, REQ-TMPL-004, REQ-TMPL-005, REQ-TMPL-006
- **REQ-INSP** → RC-02 (inspection): REQ-INSP-001, REQ-INSP-002, REQ-INSP-003, REQ-INSP-004, REQ-INSP-005, REQ-INSP-006, REQ-INSP-007, REQ-INSP-008, REQ-INSP-009, REQ-INSP-010, REQ-INSP-011, REQ-INSP-012, REQ-INSP-013, REQ-INSP-014, REQ-INSP-015, REQ-INSP-016
- **REQ-LAB** → RC-02 (laboratory): REQ-LAB-001, REQ-LAB-002, REQ-LAB-003, REQ-LAB-004, REQ-LAB-005, REQ-LAB-006, REQ-LAB-007, REQ-LAB-008, REQ-LAB-009, REQ-LAB-010, REQ-LAB-011, REQ-LAB-012, REQ-LAB-013, REQ-LAB-014, REQ-LAB-015, REQ-LAB-016, REQ-LAB-017, REQ-LAB-018, REQ-LAB-019, REQ-LAB-020, REQ-LAB-021
- **REQ-EQP** → RC-02 (equipment): REQ-EQP-001, REQ-EQP-002, REQ-EQP-003, REQ-EQP-004, REQ-EQP-005
- **REQ-CAL** → RC-02 (calibration): REQ-CAL-001, REQ-CAL-002, REQ-CAL-003, REQ-CAL-004, REQ-CAL-005, REQ-CAL-006
- **REQ-MNT** → RC-02 (maintenance): REQ-MNT-001, REQ-MNT-002, REQ-MNT-003
- **REQ-DOC** → RC-02 (documents): REQ-DOC-001, REQ-DOC-002, REQ-DOC-003, REQ-DOC-004, REQ-DOC-005, REQ-DOC-006, REQ-DOC-007, REQ-DOC-008, REQ-DOC-009
- **REQ-APR** → RC-02 (approvals): REQ-APR-001, REQ-APR-002, REQ-APR-003, REQ-APR-004, REQ-APR-005, REQ-APR-006, REQ-APR-007, REQ-APR-008, REQ-APR-009
- **REQ-ESIG** → RC-02 (e-signatures): REQ-ESIG-001, REQ-ESIG-002, REQ-ESIG-003, REQ-ESIG-004, REQ-ESIG-005, REQ-ESIG-006, REQ-ESIG-007, REQ-ESIG-008
- **REQ-CHG** → RC-02 (change requests): REQ-CHG-001, REQ-CHG-002, REQ-CHG-003, REQ-CHG-004, REQ-CHG-005, REQ-CHG-006, REQ-CHG-007, REQ-CHG-008
- **REQ-RPT** → RC-04 (reporting): REQ-RPT-001, REQ-RPT-002, REQ-RPT-003, REQ-RPT-004, REQ-RPT-005, REQ-RPT-006, REQ-RPT-007
- **REQ-AUD** → RC-04 (audit): REQ-AUD-001, REQ-AUD-002, REQ-AUD-003, REQ-AUD-004, REQ-AUD-005, REQ-AUD-006, REQ-AUD-007
- **REQ-FILE** → RC-04 (files): REQ-FILE-001, REQ-FILE-002, REQ-FILE-003, REQ-FILE-004, REQ-FILE-005, REQ-FILE-006, REQ-FILE-007, REQ-FILE-008
- **REQ-NOT** → RC-04 (notifications): REQ-NOT-001, REQ-NOT-002, REQ-NOT-003, REQ-NOT-004, REQ-NOT-005
- **REQ-SRCH** → RC-04 (search): REQ-SRCH-001, REQ-SRCH-002, REQ-SRCH-003, REQ-SRCH-004
- **REQ-DASH** → RC-04/RC-08 (dashboard): REQ-DASH-001, REQ-DASH-002, REQ-DASH-003, REQ-DASH-004, REQ-DASH-005
- **REQ-ADM** → RC-03/RC-09 (administration): REQ-ADM-001, REQ-ADM-002, REQ-ADM-003, REQ-ADM-004, REQ-ADM-005
- **REQ-HLTH** → RC-05 (health): REQ-HLTH-001, REQ-HLTH-002, REQ-HLTH-003, REQ-HLTH-004, REQ-HLTH-005
- **REQ-BKP** → RC-05 (backup/recovery): REQ-BKP-001, REQ-BKP-002, REQ-BKP-003, REQ-BKP-004, REQ-BKP-005, REQ-BKP-006, REQ-BKP-007, REQ-BKP-008
- **REQ-AI** → RC-06 (AI): REQ-AI-001, REQ-AI-002, REQ-AI-003, REQ-AI-004, REQ-AI-005, REQ-AI-006, REQ-AI-007, REQ-AI-008, REQ-AI-009, REQ-AI-010
- **REQ-DATA** → RC-03 (data integrity): REQ-DATA-001, REQ-DATA-002, REQ-DATA-003, REQ-DATA-004, REQ-DATA-005, REQ-DATA-006, REQ-DATA-007, REQ-DATA-008, REQ-DATA-009, REQ-DATA-010, REQ-DATA-011, REQ-DATA-012, REQ-DATA-020, REQ-DATA-021, REQ-DATA-022, REQ-DATA-023, REQ-DATA-024, REQ-DATA-025, REQ-DATA-026
- **REQ-SEC** → RC-01/RC-04 (security): REQ-SEC-001, REQ-SEC-002, REQ-SEC-003, REQ-SEC-004, REQ-SEC-005, REQ-SEC-006, REQ-SEC-007, REQ-SEC-008, REQ-SEC-009, REQ-SEC-010
- **REQ-UX** → RC-08 (UX/accessibility): REQ-UX-001, REQ-UX-002, REQ-UX-003, REQ-UX-004, REQ-UX-005, REQ-UX-006, REQ-UX-007, REQ-UX-008, REQ-UX-009, REQ-UX-010, REQ-UX-011
- **REQ-TST** → RC-07 (testing/verification): REQ-TST-001, REQ-TST-002, REQ-TST-003, REQ-TST-004, REQ-TST-005, REQ-TST-006, REQ-TST-007, REQ-TST-008, REQ-TST-009, REQ-TST-010, REQ-TST-011, REQ-TST-012, REQ-TST-013, REQ-TST-014, REQ-TST-015
- **REQ-UAT** → RC-07 (UAT): 

## 7A. Current requirement → implementation → test → evidence → status

- **REQ-WFLOW-004/014 — official inspection result (PD-01/02/07)**
  - Code/use case: receiving-origin creation and `RecordInspectionResultsUseCase` are wired; point-level server evaluation reads approved template rules. The use case persists point outcomes, but current persistence does not derive/write `inspection_reports.final_result`; no approved mapping to report outcome or manual-judgment policy exists.
  - Existing test: `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` verifies client-declared `finalResult` and approval without a stored result are rejected.
  - Evidence/source: `STATE-MACHINES.md` TR-INSP-001/006; `POLICY-CLOSURE-MATRIX.md` PD-01/02/07; approved QC method/WI/SOP and manual-judgment procedure are absent.
  - Status: BLOCKED — point results can be recorded against template rules, but report-level result aggregation and approved source/signature binding are unavailable; final approval remains denied.
- **REQ-WFLOW-004 — laboratory evaluator (PD-01/02/03)**
  - Code/use case: `PostgresControlledLabSources.resolve()` snapshots approved template/effective documents/hash; `evaluate()` denies; `ApproveLabTestUseCase` checks source/hash equality before persisting result.
  - Existing test: `tests/integration/qc-100-final-013/controlled-workflow-proof-matrix.test.ts`; `tests/unit/laboratory/scientific-governance.test.ts`.
  - Evidence/source: `STATE-MACHINES.md` TR-LAB-002/006; controlled criteria and evaluator source not supplied.
  - Status: BLOCKED — no official laboratory result written.
- **REQ-WFLOW-003 — laboratory Reject (PD-38)**
  - Code/use case: `RejectLabTestUseCase`; deny-by-default policy with required reason/dual permissions/P-05/version guards.
  - Existing test: `tests/unit/laboratory/lab-workflow.test.ts`; `tests/unit/laboratory/scientific-governance.test.ts`.
  - Evidence/source: `POLICY-CLOSURE-MATRIX.md` PD-38; approved QC/QMS reject-authority source absent.
  - Status: BLOCKED — `POLICY_SOURCE_REQUIRED`; workflow Reject remains separate from scientific FAIL.
- **REQ-WFLOW-001/002 — release boundary (PD-08/PD-32)**
  - Code/use case: explicit `ReleaseReceivingUseCase` and P-05 authority; inspection PASS has no release effect.
  - Existing test: `tests/unit/quarantine/release-state.test.ts`; `tests/unit/shared/p05/authority-matrix.test.ts`.
  - Evidence/source: owner-approved P-05 decision and `STATE-MACHINES.md` TR-RCV; complete signature scope remains open under PD-32.
  - Status: PARTIAL — P-05 authority slice closed; full signature scope and live evidence blocked.
- **REQ-WFLOW-010 — signature scope (PD-32)**
  - Code/use case: final inspection/lab approval ceremonies bind signatures to exact subject/version; this does not enumerate all actions needing signature.
  - Existing test: `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` and e-signature suites referenced by the policy matrix.
  - Evidence/source: `POLICY-CLOSURE-MATRIX.md` PD-32; QMS signature-scope list absent.
  - Status: BLOCKED for complete scope; mechanics only.
- **REQ-WFLOW-011 — WI/SOP approval (RD-019)**
  - Code/use case: document-version approval; P-06 template approval does not grant WI/SOP approval permission.
  - Existing test: document workflow suites referenced by canonical matrix RD-019.
  - Evidence/source: `PERMISSION-MATRIX.md` §58; `STATE-MACHINES.md` TR-DOC; Document Control/QMS decision absent.
  - Status: BLOCKED — `PERM-DOC-APPROVE` denied until explicit approval.
- **REQ-RCOV-002/003 — RPO/RTO (PD-26/27)**
  - Code/use case: `recovery-metrics.ts` hard-codes RPO 86,400s / RTO 14,400s, and unit tests assert them. Those values conflict with the open canonical decision and are not approved targets.
  - Existing test: `tests/unit/backup-recovery/metrics.test.ts` asserts code constants; it is not policy approval or provider-compliance evidence.
  - Evidence/source: `POLICY-CLOSURE-MATRIX.md` PD-26/27 and recovery risk record; approved target/provider measurement absent.
  - Status: BLOCKED — code discrepancy identified; no approved target or provider measurement.
- **REQ-AUTHZ-012 / REQ-RCOV-001 — production restore (RD-020)**
  - Code/use case: restore validation distinguishes isolated drill target from production target.
  - Existing test: recovery authorization tests referenced by canonical matrix RD-020.
  - Evidence/source: `PERMISSION-MATRIX.md` §78; Recovery Plan owner decision absent.
  - Status: BLOCKED — production restore denied until approval.

All other open `PD-*` decisions remain itemized in `DECISION-ASSUMPTION-REGISTER-026.md` §3 and the canonical `audit/100-percent/POLICY-CLOSURE-MATRIX.md`, which records each decision's owner, exact question, governing source, implementation location, tests/evidence, and current fail-closed behavior. `RD-019` and `RD-020` are cross-referenced there and in §8 of the decision register. No unresolved requirement is upgraded by this derived mapping.


# 7. Document status

```text
Document: Documents/REQUIREMENTS-RECONCILIATION.md
Version: 1.0
Register rows: 100 (RC-01..RC-09)
Capability classes: MANDATORY=96, OPTIONAL=4 (RC-06-008, RC-08-012, RC-09-005, RC-09-006)
Open decisions: unchanged — PD/RD items stay POLICY-DEPENDENT / SOURCE-DEPENDENT with runtime DENY
Scoring denominator: 80 domains (unchanged)
Guard: scripts/requirements/check-reconciliation.mjs
Status: RECONCILIATION LAYER — does not upgrade any evidence state by itself
```

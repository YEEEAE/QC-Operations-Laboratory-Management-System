# GAP-RISK-PRIORITY-MATRIX.md

# QC Operations & Laboratory Management System

## Workflow-Gap & Operational-Risk Priority Matrix — v1.0 (QC-100-FINAL-026)

**Document Path:** `Documents/GAP-RISK-PRIORITY-MATRIX.md`
**Status:** PRIORITIZATION LAYER — derived, machine-checked
**Owning task:** QC-100-FINAL-026 (phase A); residual-risk acceptance authority stays POLICY-DEPENDENT per `Documents/RISK-REGISTER.md` §13
**Frozen candidate:** HEAD `6f07cf28fdf63469ab32c294a0943563ea962fff`

---

# 1. Method (documented, per RISK-REGISTER §4–§8)

```text
Risk Score = Likelihood (1..5) x Impact (1..5)
Severity bands: 1-4 LOW | 5-9 MODERATE | 10-14 HIGH | 15-19 VERY HIGH | 20-25 CRITICAL
Impact = highest materially affected dimension (QC integrity / data / security / audit-compliance / continuity / recovery)
```

**Likelihood discipline (unchanged):** operational likelihood is never invented. Every entry below keeps `Likelihood = ASSESSMENT REQUIRED` and `Severity = ASSESSMENT REQUIRED` until evidence or approved expert assessment exists (RISK-REGISTER §5). Therefore **priority is impact-led**:

1. **Impact** (documented, from RISK-REGISTER §20 and traceability high-risk list §68) — descending.
2. **Mandatory before optional** — a mandatory capability gap always outranks an optional enhancement of equal impact.
3. **Blocking breadth** — number of dependent gates/evidence streams (tie-breaker, documented per row).

**No reclassification rule:** no required feature was or may be reclassified as OPTIONAL to raise scores. OPTIONAL appears only where the approved scope itself treats the capability as an enhancement (register rows RC-06-008, RC-09-005, RC-09-006).

# 2. Gap priority register (G-026-nn)

Gaps are reconciled workflow/operational gaps consolidated from `audit/100-percent/02-GAP-REGISTER.md` (G-001..G-020) and current Mind open issues; legacy gap IDs are cited per row. Priority = impact-led order.

| Gap ID | Gap (legacy refs) | Capability | Impact | Likelihood | Score | Severity | Owning task | Register linkage |
|---|---|---|---|---|---|---|---|---|
| G-026-01 | UAT with real personas and signed acceptance never executed (G-013, G-008) | MANDATORY | 5 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-004 | RC-07-002 |
| G-026-02 | Production provider parity, migration applied-head drift, live release identity (G-009, G-002) | MANDATORY | 5 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-001 | RC-05-009, RC-07-009 |
| G-026-03 | Open policy/authority decisions block controlled paths (release signature scope PD-32, reject policy PD-38, retest, calibration blocking, document approver) (G-020) | MANDATORY | 5 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-002, RC-02-003, RC-02-008 |
| G-026-04 | Server authorization/SoD/concurrency unproven against persisted PostgreSQL on an approved runtime (G-001, G-004) | MANDATORY | 5 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-01-001, RC-01-003, RC-03-003 |
| G-026-05 | Backup/restore scheduler absent; provider DR/PITR/RPO/RTO unverified (G-013, G-018; DEP-025-02) | MANDATORY | 5 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-008/025 | RC-05-001, RC-05-002, RC-05-003, RC-05-004 |
| G-026-06 | Audit cryptographic-integrity mechanism undefined (REQ-AUD-007) | MANDATORY | 5 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-04-002 |
| G-026-07 | Exact-head CI evidence for the release candidate missing (G-007, G-017) | MANDATORY | 5 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-07-007, RC-07-008 |
| G-026-08 | Authenticated E2E/browser matrix blocked (Chromium host/EPERM; approved environment required) (G-006) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-003 | RC-08-004, RC-08-006 |
| G-026-09 | Accessibility axe/manual keyboard/RTL/zoom/reduced-motion matrix incomplete on authenticated pages (G-011) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-006/040 | RC-07-011, RC-08-009 |
| G-026-10 | Dashboard read-model gaps: document review queue, quality ownership filters, blocked-reason field, reject analytics scope decision (017-B) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-017 | RC-09-003, RC-04-009 |
| G-026-11 | Report/search/dashboard scope consistency not current runtime evidence (G-019) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-011 | RC-01-007, RC-04-004 |
| G-026-12 | External notification channel absent (in-app only); incident paging undefined (DEP-025-04) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-025 | RC-04-006, RC-05-012 |
| G-026-13 | Provider monitoring/alerting absent (DEP-025-03) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-007 | RC-05-005 |
| G-026-14 | No approved performance/capacity thresholds; representative volume evidence missing (G-012) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-007/014 | RC-05-010 |
| G-026-15 | Object-storage/provider file recovery drill not executed (G-018) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-008 | RC-05-001, RC-04-003 |
| G-026-16 | Delivery-layer architecture contradiction observed in prior audit needs exact-head re-verification (G-003; E-12) | MANDATORY | 4 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-09-008 |
| G-026-17 | AI live provider smoke, Render provider config, external data-processing approval missing | MANDATORY | 3 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-009 | RC-06-002, RC-06-006, RC-06-007 |
| G-026-18 | Copy/design governance: static TODO placeholders in controlled documents unclassified (G-015); terminology/content review (G-014) partially closed by 023 | MANDATORY | 3 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-023 | RC-08-008, RC-04-010 |
| G-026-19 | Six compressed single-line `.astro` pages need conservative reformat; no gate detects them (Mind open issue) | MANDATORY | 2 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-09-008 |
| G-026-20 | Product analytics measurement implementation beyond approved plan | OPTIONAL | 2 | ASSESSMENT REQUIRED | NOT YET RATED | ASSESSMENT REQUIRED | QC-100-FINAL-026-B | RC-09-005 |

# 3. Operational risk priority (all 34 registered risks)

Full risk records stay in `Documents/RISK-REGISTER.md` §21–§54. This section only adds **priority order** (impact-led, then register order as tie-breaker) and links each risk to its reconciliation rows. Residual ratings remain UNVERIFIED until implementation + evidence exist (§10, §71). Control credit only after implementation + verification (§74).

| Risk ID | Title (short) | Category | Impact | Likelihood | Priority order | Severity | Owner | Register linkage |
|---|---|---|---|---|---|---|---|---|
| RISK-001 | Unauthorized controlled action | AUTHORIZATION | 5 | ASSESSMENT REQUIRED | P1 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-01-001 |
| RISK-002 | Separation-of-Duties bypass | AUTHORIZATION | 5 | ASSESSMENT REQUIRED | P2 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-01-003 |
| RISK-003 | Admin bypasses business integrity | AUTHORIZATION | 5 | ASSESSMENT REQUIRED | P3 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-01-006 |
| RISK-004 | Unauthorized scoped data disclosure | REPORTING_DISCLOSURE | 5 | ASSESSMENT REQUIRED | P4 | ASSESSMENT REQUIRED | QC-100-FINAL-011 | RC-01-007 |
| RISK-005 | Incorrect QC PASS / FAIL | SCIENTIFIC_INTEGRITY | 5 | ASSESSMENT REQUIRED | P5 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-004 |
| RISK-006 | PASS incorrectly treated as Release | CONTROLLED_WORKFLOW | 5 | ASSESSMENT REQUIRED | P6 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-001 |
| RISK-007 | Unauthorized Release | CONTROLLED_WORKFLOW | 5 | ASSESSMENT REQUIRED | P7 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-002 |
| RISK-008 | Unapproved scientific criteria used | SCIENTIFIC_INTEGRITY | 5 | ASSESSMENT REQUIRED | P8 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-014 |
| RISK-009 | Precision / rounding corrupts scientific result | SCIENTIFIC_INTEGRITY | 5 | ASSESSMENT REQUIRED | P9 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-03-007 |
| RISK-010 | Silent concurrent overwrite | CONCURRENCY | 5 | ASSESSMENT REQUIRED | P10 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-03-003 |
| RISK-011 | Duplicate critical mutation | CONCURRENCY | 5 | ASSESSMENT REQUIRED | P11 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-03-002 |
| RISK-013 | Approved record silently edited | DATA_INTEGRITY | 5 | ASSESSMENT REQUIRED | P12 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-03-004 |
| RISK-014 | Master-data change rewrites historical truth | DATA_INTEGRITY | 5 | ASSESSMENT REQUIRED | P13 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-03-004 |
| RISK-015 | Audit history lost or tampered | AUDIT_TRACEABILITY | 5 | ASSESSMENT REQUIRED | P14 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-04-001 |
| RISK-016 | E-Signature bound to wrong subject/version | CONTROLLED_WORKFLOW | 5 | ASSESSMENT REQUIRED | P15 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-010 |
| RISK-017 | Wrong controlled document version used | DOCUMENT_CONTROL | 5 | ASSESSMENT REQUIRED | P16 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-011 |
| RISK-018 | Invalid equipment/calibration context used | EQUIPMENT_CALIBRATION | 5 | ASSESSMENT REQUIRED | P17 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-005 |
| RISK-020 | Unauthorized file/evidence access | FILES_EVIDENCE | 5 | ASSESSMENT REQUIRED | P18 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-04-003 |
| RISK-022 | Report/export leaks out-of-scope data | REPORTING_DISCLOSURE | 5 | ASSESSMENT REQUIRED | P19 | ASSESSMENT REQUIRED | QC-100-FINAL-011 | RC-04-004 |
| RISK-024 | Session/account compromise enables controlled actions | AUTHENTICATION | 5 | ASSESSMENT REQUIRED | P20 | ASSESSMENT REQUIRED | QC-100-FINAL-015 | RC-01-009 |
| RISK-025 | Sensitive error/secret leakage | SECURITY | 5 | ASSESSMENT REQUIRED | P21 | ASSESSMENT REQUIRED | QC-100-FINAL-014 | RC-04-005 |
| RISK-026 | Migration drift / historical migration mutation | DATABASE | 5 | ASSESSMENT REQUIRED | P22 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-03-005 |
| RISK-028 | Backup exists but cannot restore | BACKUP_RECOVERY | 5 | ASSESSMENT REQUIRED | P23 | ASSESSMENT REQUIRED | QC-100-FINAL-008 | RC-05-001 |
| RISK-030 | AI exceeds advisory authority | AI_GOVERNANCE | 5 | ASSESSMENT REQUIRED | P24 | ASSESSMENT REQUIRED | QC-100-FINAL-009 | RC-06-001 |
| RISK-033 | Dependency/supply-chain compromise | SUPPLY_CHAIN | 5 | ASSESSMENT REQUIRED | P25 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-07-007 |
| RISK-034 | False PASS / Production-Ready claim | READINESS_GOVERNANCE | 5 | ASSESSMENT REQUIRED | P26 | ASSESSMENT REQUIRED | QC-100-FINAL-026 | RC-07-001 |
| RISK-012 | Ambiguous commit outcome causes duplicate or false failure | DATA_INTEGRITY | 4 | ASSESSMENT REQUIRED | P27 | ASSESSMENT REQUIRED | QC-100-FINAL-025 | RC-03-002 |
| RISK-019 | Retest misused or detached from original test | CONTROLLED_WORKFLOW | 4 | ASSESSMENT REQUIRED | P28 | ASSESSMENT REQUIRED | QC-100-FINAL-013 | RC-02-008 |
| RISK-021 | Malicious/invalid uploaded file accepted | SECURITY | 4 | ASSESSMENT REQUIRED | P29 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-04-003 |
| RISK-023 | Spreadsheet formula injection in export | SECURITY | 4 | ASSESSMENT REQUIRED | P30 | ASSESSMENT REQUIRED | QC-100-FINAL-011 | RC-04-004 |
| RISK-027 | Business-number collision / DB race | DATABASE | 4 | ASSESSMENT REQUIRED | P31 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-03-006 |
| RISK-029 | External dependency failure corrupts local business outcome | DEPENDENCY_INTEGRATION | 4 | ASSESSMENT REQUIRED | P32 | ASSESSMENT REQUIRED | QC-100-FINAL-025 | RC-05-007 |
| RISK-031 | Dashboard KPI or scope is incorrect | REPORTING_DISCLOSURE | 4 | ASSESSMENT REQUIRED | P33 | ASSESSMENT REQUIRED | QC-100-FINAL-017 | RC-04-009 |
| RISK-032 | Timezone/date interpretation changes business meaning | TIME_DATE | 4 | ASSESSMENT REQUIRED | P34 | ASSESSMENT REQUIRED | QC-100-FINAL-002 | RC-03-009 |

# 4. Document status

```text
Document: Documents/GAP-RISK-PRIORITY-MATRIX.md
Version: 1.0
Method: RISK-REGISTER §4–§8 (impact-led; likelihood never invented)
Gap rows: 20 (G-026-01..G-026-20); MANDATORY=19, OPTIONAL=1
Risk rows: 34 (all registered risks prioritized; none re-scored, none accepted)
Residual CRITICAL / VERY HIGH: unchanged — Release Blocked (RISK-REGISTER §74)
Guard: scripts/requirements/check-reconciliation.mjs
Status: PRIORITIZATION LAYER — does not change any risk rating or evidence state
```

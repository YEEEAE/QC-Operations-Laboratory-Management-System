# Canonical Policy Closure Matrix — QC-CLOSURE-POLICY-009

**Date:** 2026-09-17
**Decision authority:** project-owner decisions already recorded in the repository; QC/QMS/provider decisions remain controlled-source dependent.
**Rule:** `CLOSED` means the decision itself is explicitly supplied and bound to normative documentation/code/tests. It does **not** mean UAT, provider verification, or production readiness is complete.
**No fabricated closures:** no scientific value, threshold, retention period, RPO/RTO, provider behavior, or unapproved authority was inferred.

## Disposition summary

| Disposition | Records |
|---|---|
| CLOSED | `PD-08 (P-05)` quarantine release authority; `PD-09 (P-05)` laboratory approval authority; `PD-10 (P-05)` inspection approval authority; `P-06` template authority/lifecycle; `P-07` final production-release authority |
| PARTIAL | 7 records: `PD-11` SoD (P-06 exception closed; general matrix open); `PD-12` role→permission grants (approved high-risk slices only); `PD-13` document effective date (template lifecycle only, generic document rule open); `PD-17` NCR closure (P-04 CAPA closure is separate); `PD-31` AI advisory boundary closed, provider contract open; `PD-32` signature mechanics and P-06/P-07 scopes closed, complete action list open; `PD-36` existing reason guards closed, complete workflow map open |
| OPEN | `PD-01..07`; `PD-14..16`; `PD-18..27`; `PD-28..30`; `PD-33..35`; `PD-37`; `PD-38`; all unresolved QMS/provider/data-instance decisions below |
| BLOCKED | Any record requiring a controlled source, human approval, provider evidence, live UAT, or generic configuration intake that is not present. This includes RPO/RTO/PITR/retention/provider behavior and live production evidence. |

## Canonical index

The index is the cross-document reconciliation. The detailed records below are authoritative for the required fields.

| ID | Domain | Exact decision | Current status | Source of authority | Required approver/source | Fail-closed behavior | Final disposition |
|---|---|---|---|---|---|---|---|
| PD-01 | Laboratory | Per-parameter PASS/FAIL limits | OPEN | BR-LAB-003/021 | QC WI/SOP/spec per method | Missing criteria denies evaluation | OPEN / BLOCKED |
| PD-02 | Inspection/Lab | Bind exact approved source/version/hash to criteria | OPEN | BR-INSP-004, BR-LAB-021 | Document-control approved version | Missing/drifted source denies | OPEN / BLOCKED |
| PD-03 | Laboratory | Approved method per test | OPEN | BR-LAB-002 | QC method/template | No approved template denies test | OPEN / BLOCKED |
| PD-04 | Laboratory | Precision per parameter | OPEN | BR-LAB-005; DB §26; DD | QC precision statement | Raw decimal text preserved; no invented precision | OPEN / BLOCKED |
| PD-05 | Laboratory | Whether/where rounding applies | OPEN | DB §26; UI anti-rounding rule | QC rounding rule | No rounding in scientific path | OPEN / BLOCKED |
| PD-06 | Laboratory | Retest count, authorizer, final-result effect | OPEN | BR-LAB-014..018 | Lab/QMS retest policy | Default retest policy denies | OPEN / BLOCKED |
| PD-07 | Inspection | Manual PASS/FAIL judgment | OPEN | BR-INSP-007 | QC manual-judgment procedure | No manual override path | OPEN / BLOCKED |
| PD-08 (P-05) | Quarantine | Supervisor, Manager, or named yazeed may release with explicit permission; Admin alone denied | CLOSED | Approved P-05 decision; BR-QUAR-006/007 | Already supplied owner decision; release permission/scope/state still required | P05 authority + permission/state/version gates; no implicit role bypass | CLOSED (signature subdecision remains PD-32) |
| PD-09 (P-05) | Laboratory | Supervisor, Manager, or named yazeed may approve lab tests | CLOSED | Approved P-05; BR-APR-003..007 mechanics | P-05 owner decision; explicit permissions | deny-by-default policy/dual permission/SoD/version/source checks | CLOSED (live evidence separate) |
| PD-10 (P-05) | Inspection | Supervisor, Manager, or named yazeed may approve inspections | CLOSED | Approved P-05; BR-APR-003..007 mechanics | P-05 owner decision; explicit permissions | deny-by-default/dual permission/SoD/version/result checks | CLOSED (live evidence separate) |
| PD-11 | Cross-domain approvals | Exact author/reviewer/approver/executor incompatibilities | OPEN | BR-APR-006/007 | QMS SoD matrix | Self-review/approve/reject/release/sign denied; unknown combinations denied | PARTIAL |
| PD-12 | Authorization | Exact role→permission grants | OPEN | Role/Permission matrices; BR-AUTH-005 | Central authorization deny-by-default | Unlisted grants denied | PARTIAL |
| P-06 | Inspection templates | Lifecycle, authorities, direct approval, exception, stop/void/supersede/revise | CLOSED | Approved P-06 in Permission/State/Traceability docs | Owner decision; authority ceremony | Employee/Admin-only denied; stale/state/reason/reauth/signature gates | CLOSED |
| P-07 | Production release | Manager OR named yazeed; one signer; all server-derived gates/risk evidence must pass | CLOSED | Approved P-07; BR-GEN-020; release governance code | Owner decision; reauth + e-signature | Missing/stale/foreign/untrusted evidence or wrong authority denies | CLOSED (production evidence still BLOCKED) |
| PD-13 | Controlled documents | Generic effective-date rule | OPEN | BR-DOC-009 | Document-control/QMS rule | Generic supersede denied by default; effective date required on approved path | PARTIAL |
| PD-14 | Controlled documents | Revision numbering scheme/assigner | OPEN | BR-DOC-008 | Document-control procedure | Free-text reference only; no invented scheme | OPEN / BLOCKED |
| PD-15 | Quality | Finding→NCR threshold | OPEN | BR-QUAL-010 | QC NCR criteria | No automatic threshold/inference | OPEN / BLOCKED |
| PD-16 | Inspection/Quality | FAIL→NCR automatic vs user action | OPEN | BR-INSP-015/016 | QC FAIL-handling procedure | No automatic NCR creation | OPEN / BLOCKED |
| PD-17 | Quality | NCR closure authority/workflow | OPEN | BR-QUAL-012; state/permission docs | QMS workflow + permission binding | Invalid transitions denied; no silent close | PARTIAL |
| PD-18 | Quality | CAPA effectiveness-check requirement | OPEN | BR-QUAL-031..033 | Quality-policy owner | No effectiveness claim invented | OPEN / BLOCKED |
| PD-19 | Quarantine | Duplicate receiving key | OPEN | BR-QUAR-011 | QC duplicate definition | No duplicate rule invented | OPEN / BLOCKED |
| PD-20 | Calibration | Interval/due-date derivation | OPEN | BR-CAL-002/003 | Approved calibration policy per equipment | No interval invented | OPEN / BLOCKED |
| PD-21 | Equipment | Use while overdue: block/warn/exception | OPEN | BR-CAL-004 | Approved equipment-use policy | Context preserved; no silent allow/block claim | OPEN / BLOCKED |
| PD-22 | Laboratory | Environmental requirements per method | OPEN | BR-LAB-008 | Approved method | No blanket requirement invented | OPEN / BLOCKED |
| PD-23 | Laboratory | Mandatory equipment identification per test | OPEN | BR-LAB-011 | Approved method | Source-driven; missing source blocks controlled evaluation | OPEN / BLOCKED |
| PD-24 | Records | Retention per record class | OPEN | DB §99; observability docs | QMS retention schedule | No automatic deletion job | OPEN / BLOCKED |
| PD-25 | Records/Documents | Archival timing/retrievability | OPEN | BR-DOC-004/005; PD-24 | QMS archival schedule | Archive transition preserves; no deletion clock | OPEN / BLOCKED |
| PD-26 | Recovery | RPO target | OPEN | BR-BKP-006; recovery plan | Business owner | No target comparison/claim | OPEN / BLOCKED / PROVIDER |
| PD-27 | Recovery | RTO target | OPEN | BR-BKP-007; recovery plan | Business owner | No target comparison/claim | OPEN / BLOCKED / PROVIDER |
| PD-28 | Recovery | Production restore/risk-acceptance authority | OPEN | Recovery plan | Business owner + isolated evidence | Production restore path denied/operator-only | OPEN / BLOCKED |
| PD-29 | Operations | Escalation paths/timelines/owners | OPEN | Observability deferred policy | Business owner/on-call source | No automatic escalation invented | OPEN / BLOCKED |
| PD-30 | Administration | Controlled reference-data catalog/change level | OPEN | BR-ADM-004; BR-EQP-005 | Business owner catalog | Privileged + audited; controlled-field list unresolved | OPEN / BLOCKED |
| PD-31 | AI | Provider, use cases, outage behavior, reviewer UAT | OPEN | BR-AI-001..012; R-008 | Business-approved provider contract + UAT | Provider disabled; advisory cannot authorize | PARTIAL / BLOCKED |
| PD-32 | E-signature | Complete action list requiring signature | OPEN | BR-ESIG-001..008 | QMS scope list | Mechanics work; no unapproved scope inferred | PARTIAL |
| PD-33 | Audit | Append-only/hash-chain/signed-digest mechanism | OPEN | BR-AUD-001/006/007 | Security/QMS design | No cryptographic mechanism claimed | OPEN / BLOCKED |
| PD-34 | Cross-domain | Permitted hard-delete draft records | OPEN | BR-GEN-050..053 | Per-domain approval | Controlled-record deletion denied | OPEN / BLOCKED |
| PD-35 | Imports | All-or-nothing/partial/staged strategy | OPEN | BR-GEN-063/064 | Per-use-case owner | Full validation; no silent partial success | OPEN / BLOCKED |
| PD-36 | Approvals | Workflow-specific reject/return reason mandate | OPEN | BR-APR-011 | QMS mapping | Existing guarded paths require reason; no exemptions inferred | PARTIAL |
| PD-37 | Reporting | Audit-report export grant list | OPEN | BR-RPT-008 | Business-approved grant list | No specific grant → deny | OPEN / BLOCKED |
| PD-38 | Laboratory | Lab test reject decision authority (TR-LAB-007) | OPEN | STATE-MACHINES §TR-LAB-007 | QC/QMS reject-authority source | `RejectLabTestUseCase` default policy throws `POLICY_SOURCE_REQUIRED`; transition mechanics exist, decision stays denied | OPEN / BLOCKED |

## Evidence, code, tests, and implementation impact

| ID | Code location | Test coverage | Evidence | Implementation impact |
|---|---|---|---|---|
| PD-01 | `src/modules/laboratory/infrastructure/postgres-controlled-sources.ts:34-80` | `controlled-policy-fail-closed.test.ts` deny path; positive criteria tests await source | Missing criteria returns `AUTHZ_DENIED`; no approved QC source supplied | Controlled template/config data only; no code default |
| PD-02 | `postgres-controlled-sources.ts:34-80`; `approve-lab-test.ts` source-drift guard | Fail-closed suite; focused drift test remains open | Approved template requires method/hash; drift is rejected | Preserve source/version/hash snapshot |
| PD-03 | `postgres-controlled-sources.ts:15-42`; lab create use case | Fail-closed suite | Only approved template method is selectable | QC method data intake; no client method authority |
| PD-04 | `src/modules/laboratory/domain/measurement.ts:26-50`; DB §26 | `scientific-boundaries.test.ts`; exact-text fail-closed coverage | Decimal text preserved; no precision source | Presentation/storage policy only after QC source |
| PD-05 | Lab/quarantine scientific path; no rounding calls | Fail-closed suite; scan shows no scientific rounding | Current behavior is no rounding | Future presentation-only rule if approved |
| PD-06 | `src/modules/laboratory/application/create-retest.ts:7-11`; `domain/retest.ts:3-12` | Fail-closed deny + explicit allow-path | Default policy denies; reason/link/sequence structural guards | Implement approved `RetestPolicy` data/logic |
| PD-07 | `approve-inspection.ts`; review UI | Fail-closed approval denial | No manual override route | Add only with approved QC procedure |
| PD-08 | `src/modules/quarantine/receiving/application/release-receiving.ts:26-49`; `p05-authority.ts` | `release-state.test.ts`; `p05/authority-matrix.test.ts`; fail-closed suite | P-05 owner decision + role/permission implementation | Authority slice closed; signature remains PD-32 |
| PD-09 | `src/modules/laboratory/application/approve-lab-test.ts` | Fail-closed suite; P-05 matrix tests | P-05 authority decision; permission/SoD/version/source gates | No role code change; live proof separate |
| PD-10 | `src/modules/quarantine/inspection/application/approve-inspection.ts` | Fail-closed suite; P-05 matrix tests | P-05 authority decision; deny-by-default guard | No role code change; live proof separate |
| PD-11 | `src/shared/authorization/sod.ts:8-11` | `tests/unit/shared/sod.test.ts`; exact matrix tests pending | Self-conflict foundation only; QMS matrix absent | Add policy data/tests after QMS approval |
| PD-12 | `src/shared/authorization/authorize.ts`; role/permission seeds | Authorization matrix foundation tests | Unlisted grants deny; complete approved grant list absent | Seed/config update plus negative tests |
| P-06 | `src/modules/quarantine/templates/**` | `template-policy.test.ts`; `template-lifecycle.test.ts` | Approved docs + owner decision; live runtime not evidenced | Policy/docs/code aligned; UAT separate |
| P-07 | `src/modules/release-governance/domain/release-approval.ts:109-151`; `application/approve-release.ts:37-89` | `release-approval.test.ts`; concurrency integration | P-07 owner decision; server-derived gates and signature path | Provider/UAT/CI evidence ingestion remains |
| PD-13 | `src/modules/documents/application/supersede-version.ts:10-14` | Fail-closed deny + effective-date tests | Generic rule unconfirmed; template effective timestamp is scoped to P-06 | Add document-control rule/config |
| PD-14 | `src/modules/documents/infrastructure/postgres-repository.ts:105-130` | No approved scheme test | Revision is required but free-form | Add validation only after numbering procedure |
| PD-15 | Findings/NCR application paths; no automatic threshold | No policy-positive test; absence scan | No QC NCR threshold supplied | Add threshold/config and tests if approved |
| PD-16 | Inspection approval consequence path; no auto-NCR adapter | No policy-positive test | FAIL does not auto-create NCR | Add explicit workflow or keep manual process |
| PD-17 | `src/modules/quality/ncr/domain/ncr.ts`; state machine | NCR suites; authority negatives pending matrix | State transition guards exist; exact authority open | Bind QMS closure permission/workflow |
| PD-18 | CAPA domain/state paths | No policy-positive test | No effectiveness claim invented | Add approved effectiveness ceremony |
| PD-19 | Receiving repository/use cases; no duplicate detector | No policy-positive test | No duplicate key invented | Add detector after QC definition |
| PD-20 | Equipment/calibration records; no interval default | No policy-positive test | Due date is record data, not developer interval | Add source-driven interval data |
| PD-21 | Calibration context snapshot path | No overdue-use policy test | Overdue state is preserved; no use rule claimed | Add block/warn/exception policy |
| PD-22 | Lab template parameters/source resolver | No policy-positive test | No environmental requirement invented | Add method-bound validation |
| PD-23 | Lab equipment context/source resolver | No policy-positive test | Requirement is source-driven | Add method-bound requiredness |
| PD-24 | No retention/purge job in `src/`; draft-only deletes | Scan evidence; no job test by design | No automatic deletion | Add controlled scheduler only after QMS schedule |
| PD-25 | `document-state.ts:13`; document repository archive transition | Document suites; clock tests pending | Archive preserves records; no retention clock | Add approved archival clock |
| PD-26 | Recovery tooling measures only; no target comparator | Restore/recovery tooling tests assert no comparison without target | RPO not approved; provider half blocked | Provider schedule/WAL/PITR design after target |
| PD-27 | Recovery tooling measures only; no target comparator | Restore/recovery tooling tests assert no comparison without target | RTO not approved; provider half blocked | Runbook/SLO/provider design after target |
| PD-28 | `src/modules/backup-recovery/application/request-restore.ts` | Recovery authorization tests | Production restore is denied/operator-only | Add business-approved authority ceremony |
| PD-29 | No automatic escalation in `src/` | No policy-positive test | Zero escalation automation; manual oversight only | Add on-call/escalation workflow after source |
| PD-30 | Admin/reference-data surfaces; no controlled-field catalog | Admin suites; per-item tests pending | Privileged/audited boundary exists; catalog open | Add catalog/change-request binding |
| PD-31 | `src/modules/ai-advisory/infrastructure/disabled-ai-provider.ts`; advisory response | AI advisory/security `39/39` current evidence | Advisory boundary verified; provider contract absent | Provider adapter/contract/UAT only if approved |
| PD-32 | `src/modules/e-signatures/**`; P-06/P-07 ceremonies | E-signature suites; scope mapping pending | Reauth/meaning/version mechanics implemented; complete scope absent | Add approved action allowlist |
| PD-33 | `src/shared/audit/**`; no chain mechanism | No cryptographic-mechanism test | Audit separation/append behavior only; mechanism unclaimed | Future migration and integrity tests |
| PD-34 | Repository delete paths are draft-scoped; no controlled hard delete | Absence/constraint evidence; policy tests pending | Controlled record deletion denied | Add only per-domain approved deletion |
| PD-35 | Bulk validation paths | Validation suites; strategy tests pending | Full validation; no silent partial success | Add per-use-case transaction strategy |
| PD-36 | `requireReason` state guards | State-machine suites | Existing reject/return/void guards require reasons | Add QMS workflow-to-mandate map |
| PD-37 | `run-report.ts`; `export-report.ts`; `audit-query.ts` | Export-safety suite | Specific grant required; grant list absent | Bind approved export permission |
| PD-38 | `src/modules/laboratory/application/reject-lab-test.ts`; `domain/lab-state.ts` (`REJECT: UNDER_REVIEW → REJECTED`); policy registry entries for `PERM-LAB-REJECT`/`PERM-APR-REJECT` | `tests/unit/laboratory/lab-workflow.test.ts` reject suite; `tests/unit/laboratory/scientific-governance.test.ts` | TR-LAB-007 implemented with reason + SoD + version + dual permission; default reject policy denies with `POLICY_SOURCE_REQUIRED`; measurements/results preserved | Add approved reject-authority policy source |

## Detailed closure records

### P-06 — template authority and lifecycle — CLOSED

- **Domain / exact decision:** inspection template administration: every active user may create; Employee creates `DRAFT`; Supervisor, Manager, and named `yazeed` may direct-create `APPROVED` only with reauthentication and electronic signature; those authorities review/approve/stop/void/supersede; any active user may revise into a new `DRAFT`; approved content is never edited in place. Reviewer may also approve, and an authority may approve their own template, as a template-only SoD exception.
- **Source / approver:** explicit project-owner P-06; `Documents/PERMISSION-MATRIX.md §151`, `Documents/STATE-MACHINES.md §118`, `Documents/REQUIREMENTS-TRACEABILITY.md §27A`.
- **Current fail-closed behavior:** `src/modules/quarantine/templates/domain/template-policy.ts:10-17`; lifecycle use cases require authority, state, expected version, reauthentication/signature and reason for stop/void/supersede.
- **Code / tests:** `src/modules/quarantine/templates/**`; `tests/unit/quarantine/template-policy.test.ts`; `tests/integration/quarantine/template-lifecycle.test.ts`.
- **Implementation impact:** normative docs and permission/state/traceability records are aligned; live PostgreSQL/UAT evidence remains a separate release gate.
- **Evidence / final disposition:** P-06 source and implementation are present; policy `CLOSED`, live operational verification `BLOCKED` until runtime/UAT.

### P-07 — final production-release authority — CLOSED

- **Domain / exact decision:** final production-release approval is allowed to `Manager OR named yazeed/SYSTEM_OWNER`; one authorized signer is sufficient; Admin alone, Employee, and Supervisor are denied. Server-derived CI/security/database/E2E/UAT/signature/risk gates for the exact release must pass; reauthentication and e-signature are required.
- **Source / approver:** explicit project-owner P-07 in `audit/100-percent/2026-09-09-production-ui-audit.md §0`; `Documents/BUSINESS-RULES.md BR-GEN-020`; `Documents/REQUIREMENTS-TRACEABILITY.md §QC-CLOSURE-RELEASE-002`.
- **Current fail-closed behavior:** `src/modules/release-governance/domain/release-approval.ts:109-131, 143-151`; `src/modules/release-governance/application/approve-release.ts:37-89`; missing/non-pass evidence is denied.
- **Code / tests:** `src/modules/release-governance/**`; `tests/unit/release-governance/release-approval.test.ts`; `tests/integration/release-governance/release-concurrency.test.ts`.
- **Implementation impact:** release-governance authority and transaction are aligned. This does not close provider ingestion, UAT execution, CI billing, Docker/PostgreSQL runtime, or production readiness.
- **Evidence / final disposition:** policy `CLOSED`; operational/release evidence `BLOCKED/PARTIAL`.

### P-05 slices — quarantine release, laboratory approval, inspection approval — CLOSED

- **Exact decision:** Supervisor, Manager, and named `yazeed/SYSTEM_OWNER` are the approved authority set for inspection/lab/release/retest/void/document actions where the corresponding explicit permission exists; Admin alone is never business approval authority. This record closes only the authority-role decision for `PD-08..10`; it does not close retest count/effect, e-signature scope, generic SoD, or generic document approval.
- **Source / approver:** explicit project-owner P-05 in `audit/100-percent/2026-09-09-production-ui-audit.md §0`; current role/permission implementation and `tests/integration/p05/authority-matrix.test.ts`.
- **Current fail-closed behavior:** `src/shared/authorization/p05-authority.ts`; action-specific permission, scope, state, version, evidence and SoD checks remain mandatory. `src/modules/quarantine/receiving/application/release-receiving.ts:26-49` does not treat role labels as sufficient.
- **Final disposition:** `PD-08..10` authority subdecisions `CLOSED`; live integration/production evidence is not implied.

## Controlled configuration/data workflow for QMS-dependent decisions

This is the only permitted path for supplying decisions such as limits, methods, precision, rounding, retest rules, NCR thresholds, environmental requirements, retention schedules, and other controlled values. It is a workflow contract, not evidence that those values have already been supplied.

1. **Draft intake:** authorized QC/QMS personnel create a new immutable candidate; the browser may submit proposed values, but never authority, approval, effective state, or audit identity.
2. **Required provenance:** every candidate must carry `decisionId`, domain/field, exact source-document reference, source version, content hash where applicable, proposed value/payload, effective date, and requested change reason. Scientific values must be bound to the method/template/version that consumes them.
3. **Server validation:** derive actor from the authenticated server session; validate source reference/version/hash, schema and domain constraints; reject missing provenance, hash mismatch, stale source, duplicate active version, or unsupported value types.
4. **Controlled approval:** required QC/QMS/business approver reauthenticates and applies an electronic signature whose meaning names the decision and source snapshot. Reviewer/approver separation follows the general SoD rule unless an explicitly documented exception applies.
5. **Atomic persistence:** in one transaction write the versioned configuration, approval/signature evidence, audit event, and outbox event. Do not edit an active version in place; replacement is a new version.
6. **Activation:** activate only after the effective date and all required approvals are present. Consumers read only the active approved version and snapshot its source/version/hash at execution time.
7. **Runtime fail-closed:** missing, inactive, expired, stale, unsigned, or hash-mismatched configuration produces `UNVERIFIED`/`AUTHZ_DENIED`; it must not silently fall back to a developer default.
8. **Change and retirement:** changes use a new source/version and repeat the ceremony. Retirement preserves historical snapshots and audit; deletion of controlled history is denied unless a separately approved policy exists.

**Current implementation boundary:** template/document records already persist portions of source reference, version/effective metadata, content hash, signatures, snapshots and audit. A generic policy-configuration intake/activation service for all PD records is not yet present. Therefore this workflow is `PARTIAL` as an operating design, and all unsupplied QMS/provider decisions remain `OPEN/BLOCKED`.

## Cross-document reconciliation and dead-state removals

- `Documents/PERMISSION-MATRIX.md`: P-06 table is normative; receiving release is now P-05-approved for Supervisor/Manager/yazeed with explicit `PERM-QUAR-RELEASE`; Admin remains denied. The old `DENY UNTIL BD-001` text is removed. Generic document approval (`RD-019`) remains open.
- `Documents/ROLE-MATRIX.md`: Supervisor/Manager release text now points to the approved P-05 slice, while preserving explicit permission/scope/state/SoD requirements. Final production release is separately P-07 Manager/yazeed.
- `Documents/STATE-MACHINES.md`: receiving release authority is P-05-approved; unknown compatibility, e-signature scope, and other policy-dependent conditions remain fail-closed. P-06 remains its own approved lifecycle.
- `Documents/BUSINESS-RULES.md`: BD-001 is resolved by P-05; BD-002 remains open; P-06/P-07 are recorded as approved decisions. Scientific/QMS rules remain `SOURCE-DEPENDENT`/`UNCONFIRMED`.
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`: final authority is P-07 Manager/yazeed; deferred readiness authority item is removed, while evidence/UAT/provider gates remain.
- `Documents/REQUIREMENTS-TRACEABILITY.md`, `DATA-DICTIONARY.md`, `DATABASE-ARCHITECTURE.md`, and `RISK-REGISTER.md`: unresolved records continue to point to this matrix; no source-dependent value is promoted to PASS.

## QC-100-FINAL-013 reconciliation — 2026-09-19

Candidate: `84bdf249dc74062a62cd69a132a326ea2b3f2d82` + working tree (see the FINAL-013 report for the frozen fingerprint). P-04/P-05/P-06/P-07 were **not** reopened; nothing below invents a formula, limit, method, unit, tolerance, retention period or signer.

**What the reconciliation changed**

- `PD-09`/`PD-10` (P-05 inspection/laboratory approval): the approved two-stage decision is now implemented and runtime-proven per the records below, including a real defect fix — `PERM-ESIG-SIGN`/`SIGN` previously had no `PENDING_QCM_APPROVAL` state, so the binding signature (and therefore any final approval) was unreachable. Evidence: `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` (16 cases, 4 consecutive green runs).
- **New blocking dependency inside the already-approved inspection chain:** `ApproveInspectionUseCase` requires an official `final_result`, but no application path can write it — `SaveInspectionDraftUseCase` refuses a browser-supplied result (`errors.official_result_must_come_from_approved_source`) and no inspection controlled-source evaluator exists (unlike laboratory). `StartInspectionUseCase` is also not wired into the quarantine action graph, so a report cannot be created from the application. Consequence: `TR-INSP-006` is fail-closed for any application-created report. These are implementation gaps whose *decision inputs* are `PD-01`/`PD-02`/`PD-07`.

**Unresolved decisions that block FINAL-013 item 2/3 (owner / question / dependent behavior / evidence needed)**

| ID | Decision owner | Exact question | Dependent behavior | Evidence needed to close |
|---|---|---|---|---|
| PD-01 | QC WI/SOP/spec per method | What are the per-parameter PASS/FAIL limits? | `inspection_report_points.acceptance_rule_payload` evaluation and the official inspection result | Approved criteria document + version/hash bound to each template |
| PD-02 | Document-control approved version | Which exact approved source/version/hash binds judgment to criteria (inspection and lab)? | Source-drift guard; frozen execution snapshot validity | Approved source reference + content hash per template version |
| PD-07 | QC manual-judgment procedure | May a human record a manual PASS/FAIL judgment for an inspection point, and who? | Whether any non-automatic inspection-result path may exist | Approved manual-judgment procedure with signer and scope |
| PD-16 | QC FAIL-handling procedure | Does a FAIL inspection auto-create an NCR, or is it a user action? | Post-approval QMS consequence (currently: no automatic NCR) | Approved FAIL-handling rule |
| PD-11 | QMS SoD matrix | Exact author/reviewer/approver/executor incompatibilities beyond self-approval | Whether reopen/final-approve combinations need extra separation | Approved SoD matrix |
| PD-32 | QMS scope list | Complete action list requiring an electronic signature | Which transitions must sign (currently final approval only, per owner decision) | Approved scope list |
| PD-24/PD-25 | QMS retention/archival schedule | Retention per record class; archival timing | Purge/archive jobs and evidence lifecycle | Approved retention + archival schedule |
| PD-38 | QC/QMS reject-authority source | Who may apply the TR-LAB-007 reject decision? | `RejectLabTestUseCase` stays `POLICY_SOURCE_REQUIRED` | Approved reject-authority source |

**Applicability decision — domain 70**

Domain 70 in `01-100-DOMAIN-SCORECARD.md` is **Security UX**; its applicability stands (runtime denial/enumeration evidence is pending), and it is **not** a localization domain. Arabic/RTL is a separate approved capability requirement (`Documents/UI-UX-SPECIFICATION.md §42`, `Documents/DESIGN-SYSTEM.md §16`, `Documents/PRODUCTION-READINESS-CHECKLIST.md §31`, `Documents/UAT-ACCEPTANCE-PLAN.md §57`) and is **not implemented** (the interface is English-only, `lang="en"`, LTR). The domain ID is retained, implementation is handed to 005/018 and verification to 006, and no unapproved `N/A` is recorded.

**Unchanged by this reconciliation:** all `OPEN`/`BLOCKED` provider, recovery, CI, UAT and production-evidence records remain open; `PASS` is still not `RELEASED`.

## Closure rule

`CLOSED` is not a release certificate. For every closed policy, code and tests may prove the guard exists, but only current evidence on the exact candidate can prove a live release. R-007 remains open for the unresolved records; provider and recovery records remain blocked until external evidence exists.

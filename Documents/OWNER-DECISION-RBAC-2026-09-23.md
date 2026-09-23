# Owner Decision OD-2026-09-23-RBAC-01 — Users, QC Report Access and Approval Authority

**Status:** APPROVED BY OWNER FOR RBAC / WORKFLOW IMPLEMENTATION  
**Decision owner:** Yazeed — Owner (`SYSTEM_OWNER`, named login identity `yazeed`)  
**Decision date:** 2026-09-23  
**Scope:** Persistent users and role mapping, QC report creation, approval/signature separation, server authorization, audit, and local UAT evidence.  
**Source:** Owner decision supplied in the Codex task on 2026-09-23. This record documents that instruction; it does not claim an electronic signature ceremony occurred.

## Decision

1. Keep the application role codes already used by the authorization model: Owner = `SYSTEM_OWNER` (only the active named `yazeed` identity has owner authority), QCM = `MANAGER`, Supervisor = `SUPERVISOR`, and QC 01/02/03 = `EMPLOYEE`. Display names are `Yazeed`, `QCM`, `Supervisor`, `QC 01`, `QC 02`, and `QC 03`.
2. QC 01/02/03 share the same QC data-entry permission bundle. They may create and submit all currently registered QC report/form surfaces listed below, enter data, edit eligible drafts/returned records, and upload permitted evidence. The server still checks the domain permission, ownership/scope, state, version, and business conditions.
3. QC data-entry users have no review, return, approval, final-approval, release, reject/close, approval-signature, or workflow-override authority. Creation access never grants authority over a submitted or approved record. In particular, QC users cannot attest to, confirm, finalize, or void Reject Reports.
4. Supervisor is the first-stage reviewer and approver. The existing approved two-stage contract treats stage 1 as a workflow approval event without a formal e-signature. QCM is the normal final approver and supplies the binding `FINAL_APPROVE` electronic signature. `SYSTEM_OWNER` retains the already implemented named-owner final/administrative authority, with server-side identity checks, state/version checks, and audit.
5. The normal controlled-report path remains `DRAFT → SUBMITTED → UNDER_REVIEW → PENDING_QCM_APPROVAL → APPROVED`. `APPROVED` is locked. Return, correction, resubmission, reopen, and revision use the existing domain transitions; no direct status writes or historical audit edits are authorized.
6. Owner override is limited to explicit administrative/workflow capabilities already represented by server-side use cases. It must preserve signature ceremony, record history, audit, and immutable evidence. It cannot create a missing official inspection result, invent a scientific criterion, or bypass an unavailable controlled source.
7. User, role, permission, record, transition, signature, and audit data remain PostgreSQL-backed. UAT personas are real database identities in an isolated UAT database. The existing `yazeed` account is verified without seed-driven password or permission mutation. No production account or data mutation is authorized by this decision.

## Current QC create-surface matrix

`CREATE` below means the actor may invoke the actual server-side create operation under that domain's remaining required fields and business rules. A `200` page response alone is not proof of create authorization.

| Report / form surface | Route | Required create permission | QC 01 | QC 02 | QC 03 |
| --- | --- | --- | --- | --- | --- |
| Receiving record | `/quarantine/receiving/new` | `PERM-QUAR-CREATE` | CREATE | CREATE | CREATE |
| Laboratory report | `/laboratory/tests/new` | `PERM-LAB-CREATE` | CREATE | CREATE | CREATE |
| NCR | `/quality/ncr/new` | `PERM-NCR-CREATE` | CREATE | CREATE | CREATE |
| CAPA | `/quality/capa/new` | `PERM-CAPA-CREATE` | CREATE | CREATE | CREATE |
| Finding | `/quality/findings/new` | `PERM-FIND-CREATE` | CREATE | CREATE | CREATE |
| Change request | `/change-requests/new` | `PERM-CHG-CREATE` | CREATE | CREATE | CREATE |
| Document | `/documents/new` | `PERM-DOC-CREATE` | CREATE | CREATE | CREATE |
| Reject report | `/reject-reports/new` | `PERM-RREJ-CREATE` | CREATE | CREATE | CREATE |
| Task | `/tasks/new` | `PERM-TASK-CREATE` | CREATE | CREATE | CREATE |
| Equipment record | `/assets/equipment/new` | `PERM-EQP-CREATE` | CREATE | CREATE | CREATE |
| Calibration record | `/assets/calibrations/new` | `PERM-CAL-CREATE` | CREATE | CREATE | CREATE |
| Maintenance record | `/assets/maintenance/new` | `PERM-MNT-CREATE` | CREATE | CREATE | CREATE |

Starting an inspection from a receiving record is a distinct domain action and additionally requires `PERM-QUAR-START-INSPECTION`; creating an inspection does not produce an official result. Each new QC report/form surface must be added to this matrix, the explicit foundation grants, and the authorization tests before it is considered covered.

## Approval and signature matrix

| Action | QC 01/02/03 (`EMPLOYEE`) | Supervisor | QCM (`MANAGER`) | Yazeed (`SYSTEM_OWNER`) |
| --- | --- | --- | --- | --- |
| Create / edit eligible draft / submit | ALLOW by domain grant and state/scope | ALLOW where domain grant exists | ALLOW where domain grant exists | ALLOW by owner grant and domain rules |
| Review / return for correction | DENY | ALLOW at assigned first stage | ALLOW at assigned final stage | ALLOW where owner use case permits |
| Stage-1 approval | DENY | ALLOW; no formal e-signature in this chain | DENY | ALLOW only through an explicit named-owner use case |
| QCM final approval | DENY | DENY | ALLOW after stage 1, with reauthentication and binding signature | ALLOW only through explicit named-owner use case, with required ceremony and audit |
| Approval signature | DENY | No stage-1 signature in the approved inspection/laboratory chain | ALLOW for final approval ceremony | ALLOW for explicitly authorized owner action |
| Override workflow order | DENY | DENY | DENY | ALLOW only where the server use case defines it and audit/history checks pass |
| Direct edit/delete of approved history or audit evidence | DENY | DENY | DENY | DENY; use the existing controlled reopen/revision path |

For inspection/laboratory stage 1, `MANAGER` is not an authority. The named
`SYSTEM_OWNER` exception is retained only where the domain use case explicitly
permits it; this does not turn QCM final approval into a stage-1 action.

The matrix does not grant an action that a domain's state machine does not implement. `PASS ≠ RELEASED` remains in force.

## Requirements and verification linkage

| Requirement | Permission / transition | Code and persistence | Test / evidence |
| --- | --- | --- | --- |
| QC-OD-01: identical creation bundle for QC 01/02/03 across all registered surfaces | Explicit domain `*-CREATE`; report submit permissions remain separate | `FOUNDATION_ROLE_PERMISSIONS.EMPLOYEE`; migration `0038_owner_qc_report_access.sql`; `qc.role_permissions` | `tests/unit/authorization/qc-permission-contract.test.ts`; `tests/unit/authorization/uat-personas.test.ts`; UAT create-route coverage |
| QC-OD-02: QC cannot approve, sign, or close controlled workflows | Default-deny plus domain and generic approval permissions; state transition guards | `policy-registry`, domain use cases, `qc.user_roles`, `qc.role_permissions` | Negative authorization contracts and populated PostgreSQL tests |
| QC-OD-03: Supervisor first stage; QCM final signed stage | `UNDER_REVIEW → PENDING_QCM_APPROVAL → APPROVED` | Approval use cases; PostgreSQL records, signature, and audit | `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` |
| QC-OD-04: named owner authority and override are server-side | `SYSTEM_OWNER` plus `loginIdentity === 'yazeed'` and explicit owner action | `p05-authority.ts`, owner role grants, domain transactions | owner allow/forged-role denial and audit/state assertions |
| QC-OD-05: UAT evidence is persistent and retrievable | Owner creates cycles/defects; active participant records only their own role-bound session; QCM/owner acceptance uses the existing signed ceremony; authorized actors read via `PERM-RPT-VIEW` | `qc.uat_*`, application use cases, `src/actions/uat-evidence.ts`; cycle/session/defect insert and audit are transactional | `tests/unit/uat-evidence/uat-evidence.test.ts`; PostgreSQL write/read round-trip and authenticated API E2E remain NOT VERIFIED |
| QC-OD-06: scientific inspection result remains source-bound | PD-01/PD-02/PD-07 remain OPEN; evaluation fail-closed | Controlled-source evaluator and inspection use cases | Source-missing rejection tests; no fixture-seeded result counts as application proof |

## Still open

- PD-01: controlled per-method/per-point acceptance criteria and limits.
- PD-02: exact approved document revision, applicability, and content fingerprint.
- PD-07: whether manual judgment is allowed, who may make it, and its scope/evidence.
- Automated end-to-end creation/persistence of every form needs valid, approved domain fixtures; route visibility or permission-bundle parity alone is not runtime proof.
- PostgreSQL 18, E2E, human UAT, and signed acceptance remain evidence gates until executed on an isolated UAT environment and by real participants.

# QC-ADP-02 — Inspection source and approval handoff

**Status:** BLOCKED — owner-controlled QC/QMS decision required before scientific-result or policy-dependent runtime changes. No application code, schema, or migration was changed.

**Candidate inspected:** `main` at `7e0a3535f80b956bcfe0143201ddfee2e4277e4c` (clean before this handoff). **Source schema:** `0039_laboratory_report_drafts` (39 migration files). Applied schema, PG18 runtime, authenticated E2E, and live route state were not checked in this task.

## Root cause and current-source reconciliation

The controlling inputs remain open: PD-01 (criteria per inspection point), PD-02 (approved source/version/hash bound to the template and frozen execution), and PD-07 (whether manual PASS/FAIL is permitted and by whom). The existing owner decision `OD-2026-09-23-RBAC-01` resolves the P-05 role slice—Supervisor stage one, QCM/MANAGER final approval, and the named-owner exception—but does not approve scientific criteria or source identity. The broader QMS SoD/signature-scope decisions remain bounded by PD-11/PD-32.

Current code differs from the older wiring description in the audit history: receiving-origin inspection creation is wired through `CreateInspectionFromReceivingUseCase`; `RecordInspectionResultsUseCase` evaluates point values server-side from template rule fields; and template/version context is snapshotted. However, the inspected result path does not establish that those rule fields are linked to an approved controlled-document identity/content hash, and it has no report-level aggregation that writes an official `inspection_reports.final_result`. `ApproveInspectionUseCase` requires that final result, while `SaveInspectionDraftUseCase` rejects browser-supplied results. This correctly prevents an unapproved result but leaves the positive scientific path unavailable. A template rule or test fixture is not QC/QMS approval.

Release remains a separate transition: `ReleaseReceivingUseCase` requires `RELEASE_PENDING`, `inspectionResult === 'PASS'`, a release permission/authority check, scope/state/version/SoD validation, and policy approval. No inspection PASS by itself releases receiving. Keep HOLD reason visible and preserve the frozen source/version with the decision context.

## Decision request

Use the existing controlled request, [`owner-decision-request.md`](../2026-09-23/qc-100-final-013/owner-decision-request.md), rather than creating a second policy source. QC/QMS and Document Control must complete and approve its fields for:

1. Decision ID, approvers, effective date, product/site/method scope, and approval evidence.
2. Exact controlled source ID/title/revision/status, effective scope, repository record, and content hash.
3. Per-template-version and per-point criteria, including data type, unit, source clause, rule and literal parameters, boundary inclusivity, precision/rounding source, and treatment when evaluation is unavailable.
4. Manual-judgment allowed/denied, signer qualification, exact role/permission/scope, evidence/reason, and author/executor/reviewer/approver incompatibilities.
5. Report-level aggregation and HOLD/FAIL consequences, including confirmation that scientific PASS and receiving release remain separate decisions.

No field is inferred from existing code, seeds, examples, tests, or prior audit snapshots. If a field is not applicable, the approver must mark it N/A with rationale. On receipt, reconcile PD-01/02/07 and applicable SoD/signature rows first; only then implement evaluator/source binding and separately authorized workflow transitions.

## Page-card handoff and denominator

The source audit contains ten affected page cards. Each remains `NOT VERIFIED`; the route's linked finding IDs are the existing card scope, not independent proof. For this task, freeze these six acceptance checks **per route card** before implementation (denominator 6 each; 60 route-check slots total, reported per route so one page cannot mask another):

1. Source and decision context is truthful: approved source/revision/hash and applicable unit/criterion are shown where the route presents criteria; otherwise the route clearly shows the missing-source/HOLD reason.
2. The action/page state agrees with the server-side workflow; create, execute, submit, review, stage-one approval, final approval, and release are never collapsed into one action.
3. An authorized in-scope actor can complete the route's allowed positive read/action path on representative data.
4. Missing/unapproved/drifted source, invalid input, or forbidden client PASS/FAIL is denied without persisting an official result.
5. Wrong permission/scope, SoD conflict, and stale version are denied with no state/audit/outbox partial transition; authorized audit/outbox writes are atomic.
6. Result/decision evidence, HOLD reason, version, and next action are understandable and recoverable by keyboard with labels, visible focus, and actionable errors.

“Where applicable” in check 1 is route-specific: the approval template and receiving routes must expose provenance needed to understand the downstream decision, while execution/review must expose the exact frozen criterion/source. N/A requires a cited source; it does not reduce the six-check denominator. Evidence state is initially `NOT RUN` for each check. A check may be PASS only with candidate-bound evidence; FAIL/BLOCKED/NOT VERIFIED stay in the denominator. Do not calculate one quality percentage across routes. Each route closes at `PASS ÷ 6`; the ten-route family is not READY while any route is below 6/6 or any P0/P1 is open.

| Route card | Route | Audit-linked findings | F-002 closure |
|---|---|---|---|
| RT-QUAR-001 | `/quarantine` | F-009, F-010, F-013, F-016, F-002, F-014 | 0/6 — BLOCKED |
| RT-REC-001 | `/quarantine/receiving` | F-009, F-010, F-013, F-016, F-002, F-014 | 0/6 — BLOCKED |
| RT-REC-002 | `/quarantine/receiving/new` | F-009, F-010, F-013, F-016, F-002, F-015 | 0/6 — BLOCKED |
| RT-REC-003 | `/quarantine/receiving/[receivingId]` | F-009, F-010, F-013, F-016, F-002, F-014 | 0/6 — BLOCKED |
| RT-INSP-001 | `/quarantine/inspections` | F-009, F-010, F-013, F-016, F-002, F-014 | 0/6 — BLOCKED |
| RT-INSP-002 | `/quarantine/inspections/[inspectionId]` | F-009, F-010, F-013, F-016, F-002, F-014, F-028 | 0/6 — BLOCKED |
| RT-INSP-003 | `/quarantine/inspections/[inspectionId]/execute` | F-009, F-010, F-013, F-016, F-002, F-015 | 0/6 — BLOCKED |
| RT-INSP-004 | `/quarantine/inspections/[inspectionId]/review` | F-009, F-010, F-013, F-016, F-002 | 0/6 — BLOCKED |
| RT-QUAR-002 | `/quarantine/admin` | F-009, F-010, F-013, F-016, F-002, F-014 | 0/6 — BLOCKED |
| RT-QUAR-003 | `/quarantine/admin/[templateId]` | F-009, F-010, F-013, F-016, F-002, F-014 | 0/6 — BLOCKED |

The source audit remains [`QC-ADAPTIVE-PAGE-BY-PAGE-AUDIT-001`](../2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md), including finding QC-PAGE-F-002 and improvement I-02. Focused unit verification ran the command `node_modules/.bin/vitest run tests/unit/quarantine/inspection-dynamic-points.test.ts tests/unit/quarantine/acceptance-evaluation.test.ts tests/unit/quarantine/receiving-release-chain.test.ts tests/unit/policy/controlled-policy-fail-closed.test.ts` (4 files / 40 tests PASS). It does not close any page-card check: no route, PostgreSQL, accessibility, browser, or E2E acceptance run was performed. Therefore all six checks remain `NOT RUN` despite the pre-implementation denominator being fixed.

## Evidence and next gate

| Evidence | State | Boundary |
|---|---|---|
| Code/source trace of current creation, evaluator, approval guard, and release guard | PASS (source inspection only) | Does not prove behavior on PostgreSQL or a live route |
| QC/QMS PD-01/02/07 decision and bound controlled source | BLOCKED | Existing request is an unapproved blank form |
| P-05 role slice | VERIFIED as documented | Does not close scientific source, complete SoD, or full signature scope |
| Focused unit tests on this candidate | PASS — 4 files / 40 tests | Existing unit cases only; no owner-approved positive scientific criterion was available |
| Disposable PostgreSQL 18 integration | NOT RUN / BLOCKED | Transaction, audit/outbox, conflict, and applied schema evidence remain open |
| Authenticated E2E and route evidence | NOT RUN | No candidate-bound browser/actor evidence in this task |
| Applied schema / schema version / live role grants | NOT VERIFIED | Source head only is recorded above |
| Final readiness | NO-GO | Ten route cards remain 0/6; P0 QC-PAGE-F-002 remains open |

After approval, required implementation evidence must cover source/version/hash drift denial; valid and boundary numeric/enum results; invalid and missing inputs; manual-judgment allow/deny according to the signed decision; report aggregation; create/execute/submit/review/stage-1/final-approve/release as separate transitions; role/scope/SoD/stale-version denials; transaction rollback and idempotent conflict; PASS without release; and HOLD reason rendering. Run unit, disposable PostgreSQL 18, and authenticated E2E on the same candidate, then update each route card with its six outcomes and evidence links. No migration, commit, push, or deployment is authorized by this handoff.

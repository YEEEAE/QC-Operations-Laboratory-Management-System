# QC-100-05 — Controlled Workflow Evidence Register

**Reality freeze:** 2026-09-08 (Asia/Riyadh)  
**Branch / HEAD:** `main` / `fca0c9bad7feb49fa98c09ae92f87ee25a455219`  
**Status:** Partial. This register is an evidence index, not a readiness or closure claim.

## Evidence key

- **Code-backed:** static inspection finds the named delivery, use-case, repository, and evidence path.
- **Test-backed:** the named test runs without a PostgreSQL container.
- **Runtime-unverified:** PostgreSQL transactional behavior requires the disposable PostgreSQL 18 suite; that runtime is unavailable in this workspace.
- **Blocked by policy:** default-deny is intentional because the controlled approval/release policy is unresolved; no policy has been invented to make an action pass.

## Common control chain

All rows below require a server-side actor, explicit permission and scope, an expected version for mutable controlled records, and an authoritative state transition. The application repositories that support the operation append audit/outbox evidence inside their transaction. UI controls are capability hints only; the Action/use case remains authoritative.

| Workflow | Requirement → permission/scope → state/use case | Transaction, repository, audit/outbox | UI and tests | Evidence status |
| --- | --- | --- | --- | --- |
| Tasks | Draft edit and explicit lifecycle (`ACTIVATE`, `START`, `HOLD`, `RESUME`, `COMPLETE`, `CANCEL`, `REOPEN`) through `PERM-TASK-*` and expected version. | `tasks/application/transition.ts` → `tasks/infrastructure/postgres-repository.ts`; repository includes audit/outbox. | `/tasks/*`; `tests/unit/tasks/domain.test.ts`, `tests/integration/tasks/*.test.ts`. | Code-backed; PostgreSQL history/runtime-unverified. |
| Findings | Finding lifecycle and reason-required return/void through `PERM-FINDING-*`, scope, state and version. | `quality/findings/application/transition-finding.ts` → Postgres repository. | `/quality/findings/*`; `tests/integration/quality/findings.test.ts`. | Code/test-backed for domain paths; audit/outbox wiring needs runtime evidence. |
| NCR | NCR controlled transition through `PERM-NCR-*`, scope, state, expected version and required reason where defined. | `quality/ncr/application/transition-ncr.ts` → Postgres repository. | `/quality/ncr/*`; `tests/integration/quality/ncr.test.ts`. | Code/test-backed; runtime-unverified. |
| RCA | RCA update/transition uses explicit permission, scope, state and expected version. | `quality/rca/application/{update,transition}-rca.ts` → Postgres repository. | `/quality/rca/*`; `tests/integration/quality/rca.test.ts`. | Code/test-backed; runtime-unverified. |
| CAPA | CAPA lifecycle uses `PERM-CAPA-*`, authorization and expected version. | `quality/capa/application/transition-capa.ts` → Postgres repository. | `/quality/capa/*`; `tests/integration/quality/capa.test.ts`. | Code/test-backed; runtime-unverified. |
| Receiving / release | Receiving state, inspection result and release system state are independent. Release requires `RELEASE_PENDING`, result `PASS`, `releaseSystem=false`, `PERM-QUAR-RELEASE`, scope, current version and explicit `ReleasePolicy`. | `quarantine/receiving/application/release-receiving.ts` → receiving repository, transaction audit/outbox. | `/quarantine/receiving/*`; `tests/integration/quarantine/release-state.test.ts`. | PASS is proven not to release by itself. Actual release is **blocked by policy** in production dependencies. |
| Inspection reports | Approved template, distinct review/approval permissions, SoD, state and expected version; submission snapshot is retained. Approval transfers the approved final result to its receiving item only while that item is `UNDER_INSPECTION`. | `quarantine/inspection/application/*` → inspection repository transaction, audit/outbox. | `/quarantine/inspections/*`; `inspection-execution`, `inspection-review`, `controlled-mutations` tests. | Code-backed; HOLD-race assertion added in this prompt; PostgreSQL runtime-unverified. |
| Laboratory | Measurements retain raw textual observation, explicit unit/parameter/source; server evaluates official outcome; state is draft → submit → review → approve. | `laboratory/application/*` → lab repository transaction, audit/outbox. | `/laboratory/*`; `execution.test.ts`, `scientific-boundaries.test.ts`. | Code/test-backed. Retest remains **blocked by policy** by default. |
| Equipment | Equipment creation/update requires authorization, scope and expected version; eligibility is read separately. | `assets/equipment/application/*` → equipment repository, audit/outbox. | `/assets/equipment/*`; equipment and eligibility tests. | Code/test-backed; runtime-unverified. |
| Calibration | Calibration is a controlled lifecycle with explicit transition and stale-version guard. | `assets/calibration/application/transition-calibration.ts` → calibration repository, audit/outbox. | `/assets/calibrations/*`; `calibration.test.ts`. | Code/test-backed; runtime-unverified. |
| Maintenance | Maintenance lifecycle uses explicit transition, authorization and expected version. | `assets/maintenance/application/transition-maintenance.ts` → maintenance repository, audit/outbox. | `/assets/maintenance/*`; `maintenance.test.ts`. | Code/test-backed; runtime-unverified. |
| Documents / WI / SOP | Document identity is separate from its version. Draft-only editing, version-bound approval, single effective version, superseding and void history are explicit paths. | `documents/application/*` → document repository transaction, audit/outbox; database has effective-version unique index. | `/documents/*`; `editing`, `review`, `repository`, and authorization tests. | Code/test-backed; PostgreSQL uniqueness/history runtime-unverified. |
| Approvals / e-signatures | Decisions bind approval case/work item to exact subject type/id/version; assignment, SoD, stale version and reauthentication are rechecked. Signature evidence stores no secret. | `approvals/application/decide-approval.ts`, `e-signatures/application/sign-controlled-action.ts` → repositories with audit/outbox. | `/approvals/*`; approval orchestration/authorization and e-signature tests. | Code/test-backed. Runtime transaction evidence remains unverified. |
| Change requests | Controlled target type/id/version, reviewer/approver authorization, SoD and expected version are required. | `change-requests/application/{create,transition}-change-request.ts` → transaction repository, audit/outbox. | `/change-requests/*`; `change-requests.test.ts`. | Code/test-backed; runtime-unverified. |

## Critical quarantine proof obligations

| Rule | Current evidence | Status |
| --- | --- | --- |
| `PASS != RELEASED` | `ReleaseReceivingUseCase` requires a separate release policy; `release-state.test.ts` asserts initial denial and only a supplied policy can permit release. | Test-backed. |
| `HOLD != RELEASED` | Release predicate accepts only inspection result `PASS`, `RELEASE_PENDING`, and unreleased state. The new PostgreSQL concurrency test asserts an inspection approval cannot replace a held receiving state. | Code-backed; PostgreSQL runtime-unverified. |
| `REJECT != RELEASED` | `REJECTED` is an inspection-report state, not a receiving inspection result; release accepts only a receiving `PASS`. There is no public reject-inspection use case/Action in the current delivery surface. | Code-backed for release denial; workflow exposure is a gap. |
| Inspection completion does not release | Inspection approval moves a receiving item to `INSPECTION_COMPLETE` and writes its result; it does not set `release_system`. | Code-backed; PostgreSQL runtime-unverified. |
| Release needs approved authority | `PERM-QUAR-RELEASE`, scope, version and a separately injected policy are all required. `quarantineActionDependencies()` currently supplies default-deny policy. | Code-backed; blocked by policy. |

## Findings and residual blockers

1. The PostgreSQL inspection-approval path previously could overwrite a concurrently held receiving item. It now conditions the receiving update on `UNDER_INSPECTION`, increments its version, and rolls back the report approval/audit/outbox if that condition no longer holds. The added integration test is the executable proof once PostgreSQL 18 is available.
2. Release and inspection approval Actions currently construct default-deny policies. This is safer than inventing business authority, but it means operational approval/release cannot be demonstrated as enabled until a controlled policy source and authority decision are approved.
3. Retest creation is intentionally default-deny. `Documents/DATA-MODEL.md` defers retest authorization policy; no bypass was added.
4. No current public delivery Action exposes inspection `REJECT` or `VOID`; therefore the end-to-end rejected-inspection workflow is not closed even though the domain state machine defines it.
5. No fresh PostgreSQL 18 / Testcontainers run is available in this workspace, so transaction, durable audit/outbox, superseding, and concurrent-update claims remain runtime-unverified.

## Evidence references

- `Documents/SYSTEM-INVARIANTS.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-MODEL.md`
- `Documents/BUSINESS-RULES.md`
- `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts`
- `tests/integration/concurrency/controlled-mutations.test.ts`

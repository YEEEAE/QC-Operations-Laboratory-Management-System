# QC-CLOSURE-007 — Laboratory & Scientific Governance Closure Evidence

**Date:** 2026-09-18
**Scope:** laboratory module (`src/modules/laboratory`), lab delivery surface (`src/actions/laboratory.ts`, `src/pages/laboratory/**`), policy registry, policy closure matrix.
**Status key:** PASS / FAIL / BLOCKED / NOT VERIFIED. `PASS ≠ RELEASED`.

## Verification matrix against the task checklist

| Verify item | Current state | Evidence |
|---|---|---|
| Lab test definition | Controlled: only APPROVED template versions are resolvable; missing method reference/content hash denies | `infrastructure/postgres-controlled-sources.ts`; fail-closed suites |
| Test method | Server-resolved from the approved template; never accepted from the client | `create-lab-test.ts`; `listApprovedTemplates` filter |
| Sample | Identity traceable; submit requires complete samples | `domain/lab-test.ts assertComplete`; BR-LAB-004/009 |
| Measurement | Raw decimal text preserved without binary conversion/rounding; client cannot submit result/calculatedValue | `domain/measurement.ts`; `scientific-boundaries.test.ts` |
| Units | Explicit; a mismatched unit rejects the measurement | `validateMeasurement`; BR-LAB-006 |
| Specification limits | Read only from `acceptance_rule_payload` + `controlled_source_reference`; missing criteria deny evaluation (PD-01 OPEN) | `postgres-controlled-sources.ts`; fail-closed suite |
| Result calculation | Server-side only at approval; production evaluator intentionally not implemented | `ApproveLabTestUseCase.evaluate`; `PostgresControlledLabSources.evaluate` throws |
| PASS / FAIL / HOLD | Stored only from server evaluation, bound to source reference/hash; HOLD is valid with APPROVED workflow state | `approve-lab-test.ts`; `lab-workflow.test.ts`; `scientific-governance.test.ts` |
| Retest | Separate DRAFT record, linked to original, reason required, dual permission + P-05 authority, original record/history untouched; count/sequence/effect policy still fail-closed (PD-06 OPEN) | `create-retest.ts`; `domain/retest.ts`; both lab test suites |
| Submit / Review / Approve | Use cases with permission + scope + state + SoD + expected version + snapshot + audit/outbox in one transaction | `application/*`; `postgres-repository.ts persist()` |
| Evidence | Snapshot chain per mutation (template/source/equipment/calibration/document/criteria/sample) + audit + outbox, hash-linked | `postgres-repository.ts` |
| Audit | Every transition appends audit + outbox inside the same transaction | `postgres-repository.ts persist()` |

## Change delivered in this task: TR-LAB-007 reject transition

Before this task the documented lab state machine had **no implementation** for
`UNDER_REVIEW → REJECTED` (TR-LAB-007), `PERM-LAB-REJECT`/`PERM-APR-REJECT` had no
policy-registry entries for `LAB_TEST`, and `rejected_at` was never persisted.

- `domain/lab-state.ts`: `REJECT` action added (`UNDER_REVIEW → REJECTED` only).
- `application/reject-lab-test.ts`: `RejectLabTestUseCase` — reason required, dual
  permission, SoD, expected version, P-05 authority; measurements/results preserved.
- Default `LabRejectPolicy` is **fail-closed**: `POLICY_SOURCE_REQUIRED`.
  POLICY / SCIENTIFIC SOURCE REQUIRED: no approved reject-authority source exists,
  so the reject decision is denied by default until QC/QMS supplies one (PD-38 OPEN).
- `ports/controlled-sources.ts`: `LabRejectPolicy` port.
- `shared/errors/error-codes.ts`: `POLICY_SOURCE_REQUIRED` error code (DOMAIN category).
- `policy-registry.ts`: `PERM-LAB-REJECT` + `PERM-APR-REJECT` / REJECT / LAB_TEST / UNDER_REVIEW.
- `infrastructure/postgres-repository.ts`: persists `rejected_at` on the update path.
- `domain/lab-test.ts`: `rejectedAt` field added to the record model.
- `actions/laboratory.ts`: `rejectTest` action wired (server-authorized only).
- `pages/laboratory/tests/[labTestId]/review.astro`: discloses the reject contract and
  its policy gate; renders no actionable reject control (no UI-as-security).
- `audit/100-percent/POLICY-CLOSURE-MATRIX.md`: PD-38 recorded OPEN / BLOCKED.

## Equipment integration (BR-LAB-011/012)

`GetEquipmentEligibilityUseCase` verifies, fail-closed at submit time:
equipment ACTIVE state, calibration record CURRENT state, calibration/equipment linkage,
calibration overdue (denied while PD-21 is OPEN), and snapshot identity match
(equipment/calibration snapshots must match the referenced records).
Maintenance-state coverage is via the equipment state (`OUT_OF_SERVICE`,
`UNDER_MAINTENANCE`, `DECOMMISSIONED` all fail the ACTIVE check).

## Test evidence (local, Node v22.22.3 — outside the declared >=24.20.0 <25 contract)

- `tests/unit/laboratory/lab-workflow.test.ts`: 15 tests — submit/review/return/approve/reject/retest transitions, SoD, P-05, fail-closed equipment gate.
- `tests/unit/laboratory/scientific-governance.test.ts`: 11 tests — reject reason/SoD/stale/state/missing-permission denials, policy-gated deny (`POLICY_SOURCE_REQUIRED`), retest governance, server-side result boundary, delivery wiring guards.
- `tests/integration/laboratory/execution.test.ts`, `scientific-boundaries.test.ts`: raw-precision, stale-version, unit/result-boundary, state-machine intents.
- Targeted run: `vitest run tests/unit/laboratory tests/integration/laboratory tests/unit/policy` → 5 files / 42 tests PASS.

## Explicitly NOT VERIFIED / BLOCKED

- PostgreSQL-backed integration path (transactions, snapshot rows, audit rows on a live database): BLOCKED — no container runtime; disposable PG cluster requires `QC_TEST_DATABASE_URL`, not run in this task.
- Authenticated E2E coverage of the laboratory workflow: NOT VERIFIED — Docker/browser runtime unavailable; no new E2E spec was added because it could not be executed.
- Scientific evaluation (PASS/FAIL/HOLD derivation) in production: BLOCKED by policy (PD-01/02/03) — the production evaluator deliberately throws; no limits, units, formulas, tolerances, or methods were invented.
- `VOID` lab transition (TR-LAB-008): NOT IMPLEMENTED — runtime policy is DENY until void policy is approved; out of scope for this task.

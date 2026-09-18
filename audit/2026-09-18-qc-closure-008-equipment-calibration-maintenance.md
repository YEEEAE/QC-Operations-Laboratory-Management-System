# QC-CLOSURE-008 — Equipment, Calibration & Maintenance Closure

Date: 2026-09-18  
State: PARTIAL — local implementation and disposable-PostgreSQL evidence complete; Render migration, authenticated E2E, UAT, and CI remain unverified.

## Scope closed locally

- Equipment lifecycle records now preserve active/inactive/status history, location, calibration and maintenance requirement flags, and controlled evidence links.
- Calibration supports scheduled, due, overdue, completed, failed, certificate, next-due, immutable history, and safe current-calibration pointer handling.
- Maintenance supports preventive/corrective records, open/completed transitions, evidence, downtime, immutable history, and an equipment maintenance lock; completion leaves the equipment locked until the separately controlled `RETURN_TO_SERVICE` transition.
- Laboratory equipment eligibility fails closed for inactive, out-of-service, under-maintenance, failed-calibration, overdue-calibration, unlinked, or snapshot-mismatched equipment.

## Evidence

- `tests/integration/assets/closure-008.test.ts`: 3/3 PASS on disposable PostgreSQL 18.6; covers evidence preservation, immutable history rejection, concurrent update conflict, failed calibration, maintenance lock/downtime, and history access.
- Focused asset integration suite: 17/17 PASS.
- Migration/database suite: 7 files / 26 tests PASS; source migration head `0027_equipment_calibration_maintenance_closure`.
- `pnpm typecheck`: PASS, 0 errors, 68 hints. Build, architecture, targeted ESLint, and `git diff --check`: PASS.

## Boundaries

- Full lint is not clean because existing Reject Reports errors are outside this task.
- Local Node `v22.22.3` is outside the declared `>=24.20.0 <25` contract.
- Render remains at applied head `0018`; no production migration, commit, push, or deployment was performed.

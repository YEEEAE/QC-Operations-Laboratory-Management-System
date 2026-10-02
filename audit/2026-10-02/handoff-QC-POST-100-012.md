# QC-POST-100-012 — Measured performance closure

**State: PARTIAL.** The maintenance equipment-selector source fan-out is removed. `QC-PAGE-F-031` remains OPEN because matched before/after performance measurements and approved budgets are unavailable.

## Source and change

- Requested audit SHA `6059e177438d8ae110c99084d32758b048f22cd2` is historical. Current source HEAD before this change was `c083a5b998cc8d51d23f7df0cc578c8a43ab767f`; evidence below is rebound to that HEAD plus the final dirty-source fingerprint in `.ci-results/QC-POST-100-012.json`.
- `/assets/maintenance/new` previously invoked `assess` once per equipment option. `assess` may issue an equipment read, a current-calibration read, and a maintenance read per option. With the representative 80-equipment dataset from the existing performance fixture, the source shape is 160–240 per-item reads plus one equipment-list read (161–241 total), depending on whether current calibrations exist. This is a source-derived query-shape calculation, not a database measurement.
- It now invokes `assessMany` once, matching the existing calibration create-selector approach. For the same 80 equipment, the existing batch reader uses an equipment query, an optional calibration query, and a maintenance query; including the equipment list, the source shape is 3–4 SQL statements. Authorization, scope, eligibility labels, and unknown-item fail-closed behavior remain in the shared use case.
- No implementation changes were made to scientific, owner, signature, `/dashboard`, `/login`, or background behavior.

## Evidence

- Focused tests: `tests/unit/assets/equipment-eligibility.test.ts` and the relevant equipment-selector cases in `tests/unit/ui/entity-select.test.ts`; **10 PASS, 13 skipped by name filter**, Node `v22.22.3` (outside project contract `>=24.20.0 <25`; environment-qualified only).
- Broader two-file run: **22 PASS, 1 FAIL**. The failure is the existing unrelated `change-requests/new` assertion expecting `contentHash` in `DOCUMENT_VERSION_CHANGE_FIELDS`; this task did not change that code or assertion.
- `pnpm verification:begin` was run after tracked edits. Candidate SHA, dirty-source fingerprint, migration head and test run metadata are recorded in ignored `.ci-results/QC-POST-100-012.json`.
- PostgreSQL18/query-counter before/after, SQL p95, response payload, authenticated page p95, LCP/INP, and login GPU timing: **BLOCKED / NOT VERIFIED**. Docker daemon is unavailable, Node is below contract, and no matched authenticated browser/device run was performed.
- Existing performance budget file remains `PROPOSED_NOT_APPROVED_SLO`; no new threshold was added. The prior 4-statement selector ceiling and web budgets are not approved acceptance criteria. `/dashboard`, `/login`, and calibration selector have no same-condition timing evidence in this run.

## Closure

The maintenance N+1 source path is fixed and compatibility contracts pass in the scoped run. This does not close `QC-PAGE-F-031` or authorize a performance score change. Closure still needs owner-approved budgets, a representative isolated PostgreSQL18 dataset, and candidate-bound before/after SQL count, SQL/page p95, payload, LCP/INP and hardware GPU captures under the same conditions. Keep state **PARTIAL / NOT VERIFIED** until those proofs exist; no human UAT was manufactured.

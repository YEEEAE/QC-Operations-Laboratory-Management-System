# QC-POST-100-007 — Laboratory stage routing and asset actions

## Scope and result

**State: PARTIAL.** Local source work for QC-ADP26-33 is implemented. The requested audit SHA `6059e177438d8ae110c99084d32758b048f22cd2` is historical; the working base was `b08bef8cfed54522d8f8e7fa301595dd0f540cc8`.

- Lab detail now routes `SUBMITTED` to supervisor review and `PENDING_QCM_APPROVAL` to the existing QCM final-review workspace based on current state and permissions.
- Inspection filters include `PENDING_QCM_APPROVAL`; the `state` / `workflowState` query alias is normalized and removable.
- Inspection review availability now follows reviewer, supervisor, and QCM stage permissions and state; server actions remain authoritative.
- Calibration and maintenance detail pages expose only the existing state/permission-bound transitions through their existing actions. `MAKE_CURRENT` and `VOID` remain unavailable under current owner/policy decisions.
- Maintenance detail now links with the equipment number/name when the scoped equipment read succeeds.
- Existing eligibility enforcement remains fail-closed for laboratory use. Repair creation remains allowed for ineligible equipment.

No policy, scientific limits, owner decision, signature rule, schema, or human evidence was invented. Dependencies QC-POST-100-001/002 were treated as prerequisites already present in source; no changes to their scope were made.

## Evidence

- Focused Vitest suite: **31/31 PASS** on Node 24.20.0, including populated calibration state/version/role fixtures, eligible/ineligible lab use, and repair creation.
- `pnpm test:architecture`: **PASS**.
- Audit rollback integration test added: **BLOCKED**; Testcontainers reports no working container runtime. Atomic audit/history/outbox rollback is therefore **NOT VERIFIED** against PostgreSQL 18.
- `pnpm typecheck`: **FAIL** with 10 existing TS7016/TS7006 errors in unrelated release/route-acceptance files; no changed file appeared in diagnostics.
- Browser, assistive technology, responsive acceptance, and human UAT: **NOT VERIFIED**.
- Candidate-bound build evidence is recorded after final freeze in `.ci-results/build.json`; consult that artifact for the final source fingerprint and build outcome.

## Key files

- `src/pages/laboratory/tests/[labTestId]/index.astro`
- `src/pages/quarantine/inspections/index.astro`
- `src/pages/quarantine/inspections/[inspectionId]/review.astro`
- `src/ui/components/workflow/AssetActionRail.astro`
- `src/pages/assets/calibrations/[calibrationId].astro`
- `src/pages/assets/maintenance/[maintenanceId].astro`
- `tests/integration/assets/{calibration,maintenance,closure-008}.test.ts`
- `tests/unit/ui/authorization-visibility-ui.test.ts`

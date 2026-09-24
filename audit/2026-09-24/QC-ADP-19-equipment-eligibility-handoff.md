# QC-ADP-19 — Equipment eligibility, calibration, and maintenance

**Finding:** QC-PAGE-F-022  
**State:** PARTIAL / BLOCKED — do not mark READY.  
**Source HEAD:** `84775c130ee25e9adbcdbc4c8312dab46ab6c9d1` (workspace HEAD; changes are uncommitted).  
**Source migration head:** `0042_immutable_lab_equipment_usage` (42 migrations). No production migration was run.  
**Authority:** eligibility policy is approved in `Documents/BUSINESS-RULES.md` (`BR-CAL-004`, `BR-MNT-004`); existing permissions only, no new grants.  
**Fixture actor:** unit actor `00000000-0000-7000-8000-000000000001`; `PERM-EQP-VIEW`, `PERM-CAL-VIEW`, and `PERM-MNT-VIEW` with `GLOBAL` in unit/source-reader cases; `PERM-LAB-EDIT-DRAFT` with `OWN` for the laboratory draft write. No authenticated database actor/role/scope fixture was exercised.

## Implemented trace

The live calibration and maintenance creation forms now show equipment eligibility, the blocking reason, current calibration number/date/due date, and an authorized active maintenance number/start date beside the selected equipment. The laboratory execution page offers eligible equipment for a run; ineligible options are disabled and explain the reason. The selected equipment and calibration IDs remain tied to the existing equipment record; the user does not re-enter them.

The server reloads the equipment and calibration records, checks the existing source view scopes, current-calibration pointer/state, active equipment state, maintenance state, and due date, then creates the snapshot and usage time itself. The browser can no longer submit snapshot JSON or a usage timestamp. Recording a run checks the existing draft save permission in the test owner's scope, test state/version, and batch before source capture. PostgreSQL persistence writes the usage row, `EQUIPMENT_LINKED` audit event, and `LAB_EQUIPMENT_LINKED` outbox event in the existing transaction. Migration 0042 protects usage history from update/delete/truncate. No new permission or exception was added; the existing author/executor SoD at review and approval remains unchanged.

Policy: source due date in the past prevents laboratory use; an equipment record in `UNDER_MAINTENANCE` remains blocked until its separately approved state transition to `ACTIVE`. No calibration interval is inferred and no exception permission was added.

## Frozen acceptance checklist

| Check | Result | Evidence / limitation |
|---|---|---|
| Approved policy for overdue calibration and active maintenance | PASS | `Documents/BUSINESS-RULES.md`; `Documents/DECISION-ASSUMPTION-REGISTER-026.md` |
| Selection copy includes eligibility, reason, calibration dates, and active maintenance date | PASS (source/unit) | `src/ui/forms/equipment-eligibility.ts`; focused unit assertion. The additional eligibility contract suite 6/6 uses an in-memory reader, not PostgreSQL. Live browser rendering remains NOT VERIFIED. |
| Eligible, expired, and under-maintenance assessment cases | PASS | `tests/unit/assets/equipment-eligibility.test.ts` |
| Trusted source snapshot and server time; no browser-provided snapshot | PASS (unit/source) | `tests/unit/assets/equipment-eligibility.test.ts`; `tests/unit/laboratory/record-run-equipment.test.ts`; action schema removes snapshot fields. |
| Draft permission, stale version, capture-before-write ordering | PASS (unit) | `tests/unit/laboratory/record-run-equipment.test.ts` |
| PostgreSQL lab usage transaction, audit/outbox, frozen history, persisted snapshot, overdue/maintenance server denial | BLOCKED | `tests/integration/laboratory/qc-data-003-runs.test.ts` could not start PostgreSQL: no working container runtime. No production database was touched. |
| Authenticated E2E success and direct server rejection with role/scope | BLOCKED / NOT VERIFIED | No authenticated candidate fixture/PG runtime was available; no authenticated task journey was run. |
| Keyboard/focus/reflow and live empty/populated/error states | NOT VERIFIED | Source and focused unit copy checks only; no browser session/captures. |
| Human UAT | NOT EXECUTED | Requires a candidate-bound session and participant evidence. |

**Closure metric:** 9 applicable checks; 5 PASS / 9 = **55.6%**. Two BLOCKED and two NOT VERIFIED are not successes. This is an evidence completion ratio, not a quality score. Any route acceptance card that remains BLOCKED or NOT VERIFIED keeps the task out of READY.

## Page-card handoff for all 10 requested routes

| Card / route | Route-specific implementation and check | Result / evidence |
|---|---|---|
| `RT-ASSET-001` `/assets` | Overview links continue to the existing equipment, calibration, and maintenance records; eligibility reader is exposed through Assets read dependencies. No selector on this route. | SOURCE PASS; live/role/populated/AT NOT VERIFIED. |
| `RT-EQUIP-001` `/assets/equipment` | Equipment register remains the source for state and current calibration; shared eligibility assessment is available to downstream selection surfaces. No selector on this route. | SOURCE PASS; live/role/populated/AT NOT VERIFIED. |
| `RT-EQUIP-002` `/assets/equipment/new` | This is equipment creation, not equipment selection; no duplicate ID field added. | SOURCE PASS; route-specific selector N/A; live form NOT VERIFIED. |
| `RT-EQUIP-003` `/assets/equipment/[equipmentId]` | Detail remains source for equipment state/version and next calibration/maintenance actions. | SOURCE PASS; live/role/populated/AT NOT VERIFIED. |
| `RT-CAL-001` `/assets/calibrations` | Calibration register supplies existing source records used by eligibility evaluation. | SOURCE PASS; populated/role/AT NOT VERIFIED. |
| `RT-CAL-002` `/assets/calibrations/new` | Equipment selector displays eligibility, reason, calibration number/date/due date, and active maintenance start date when the existing maintenance view scope allows it. | SOURCE + unit copy PASS; live browser states/keyboard NOT VERIFIED. |
| `RT-CAL-003` `/assets/calibrations/[calibrationId]` | Detail remains source for calibration state/version and equipment relation. | SOURCE PASS; live/role/populated/AT NOT VERIFIED. |
| `RT-MAINT-001` `/assets/maintenance` | Maintenance register remains source for maintenance state; `UNDER_MAINTENANCE` blocks lab usage. | SOURCE + unit state case PASS; route display/populated/AT NOT VERIFIED. |
| `RT-MAINT-002` `/assets/maintenance/new` | Equipment selector displays eligibility, reason, calibration number/date/due date, and active maintenance start date when the existing maintenance view scope allows it. | SOURCE + unit copy PASS; live browser states/keyboard NOT VERIFIED. |
| `RT-MAINT-003` `/assets/maintenance/[maintenanceId]` | Detail remains source for maintenance state/version; no implicit return-to-active behavior is added. | SOURCE PASS; live/role/populated/AT NOT VERIFIED. |

The laboratory action that consumes these records is `/laboratory/tests/[labTestId]/execute` (`RT-LAB-005`); it is covered by the linked unit and PostgreSQL integration evidence above, not added to the ten-route denominator supplied for this task.

## Verification record

- Focused unit: **10/10 PASS**; asset eligibility contract suite: **6/6 PASS** (in-memory reader; not PostgreSQL evidence).
- `astro check`: **0 errors, 0 warnings, 88 hints**; installed bundled Node 24.19.0 is below the package's declared `>=24.20.0 <25` engine.
- Targeted integration: asset eligibility contract **6/6 PASS** using in-memory sources; PostgreSQL laboratory run/equipment suite **BLOCKED** during container startup (`Could not find a working container runtime strategy`; its two cases did not execute). PostgreSQL persistence/migration evidence is therefore BLOCKED.
- Requirements reconciliation: **PASS**. Architecture boundary check: **FAIL** on existing violations in `src/pages/api/release-evidence.ts` and `src/pages/tasks/index.astro`; these files are outside this change.
- Authenticated E2E, keyboard/reflow browser evidence, and UAT: **NOT VERIFIED / NOT EXECUTED**.
- `git diff --check`: PASS.

## Key files

- `src/modules/assets/equipment/application/get-equipment-eligibility.ts`
- `src/modules/laboratory/application/record-run-equipment.ts`
- `src/modules/laboratory/infrastructure/postgres-repository.ts`
- `src/pages/assets/calibrations/new.astro`
- `src/pages/assets/maintenance/new.astro`
- `src/pages/laboratory/tests/[labTestId]/execute.astro`
- `db/migrations/0042_immutable_lab_equipment_usage.sql`
- `tests/unit/assets/equipment-eligibility.test.ts`
- `tests/unit/laboratory/record-run-equipment.test.ts`
- `tests/integration/laboratory/qc-data-003-runs.test.ts`

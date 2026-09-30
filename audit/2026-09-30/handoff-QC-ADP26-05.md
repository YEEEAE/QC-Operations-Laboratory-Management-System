# QC-ADP26-05 — Inspection execution notes and remarks

## Changed

- Execution drafts now collect and validate each point before submit. Required point completeness and malformed/blank values are checked in the use case against the frozen server criteria before SQL replacement. `MULTI_MEASUREMENT` retains repeated reading rows.
- Point `remarks` are persisted with their existing result row. `REMARK_ONLY` stores its text as the row value and receives server-resolved `REMARK`; `NOT_APPLICABLE` stores `N/A` as its typed text value and receives server-resolved `NA`.
- Removed the general execution-notes textbox because the approved draft contract and `inspection_reports` schema have no general notes field. The page states that general notes are not saved.
- No schema/migration, policy, audit payload, or outbox change. Existing draft transaction remains report version update + result replacement + mandatory audit append. Existing one-value constraint remains in force.

## Candidate and environment

- Expected audit HEAD: `0b1bb21bb3b4eca77862dbba1da8623044e96355`.
- Candidate base HEAD: `161762e74c06f8fb0e9bd89b23fc0944a142486b` (`main`); it differs from the audit SHA, so the original source finding was rechecked against current page/action/use case/repository/schema rather than inherited.
- Candidate dirty fingerprint / verification source fingerprint: `ed3e68cd6e95664e20e8fa4469d0ec088efee3177cbe3a715d59fb0f48640c04` (run `675bdc97-a82e-4fc7-88d8-8be95f7dad37`).
- Worktree was clean at initial freeze; no user changes were present.
- Node: `v24.20.0`; pnpm: `11.25.0` (project contract `pnpm@11.25.0`).
- Source migration head: `0042_immutable_lab_equipment_usage.sql` (42 files). Applied schema: **BLOCKED / NOT VERIFIED**; Docker daemon unavailable and local PostgreSQL reported no response. No production connection or write was attempted.
- Build: **PASS** on this candidate after starting the bound verification run; 1/1 build record passed; artifact digest `aae7a2d6544c5bfb868bc7f96d823c2e69a0a8a945e89d32b9b139107af06b58`, entry artifact digest `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`. This is a local build artifact, not a deployed release identity.

## Evidence

| Check | State | Evidence / limit |
|---|---|---|
| Focused save/validation regression | PASS | `TASK_NODE TASK_PNPM exec vitest run tests/unit/quarantine/inspection-dynamic-points.test.ts tests/unit/ui/form-ux-contract.test.ts`: 2 files, 33/33 tests. Positive exact decimal, enum, remarks-only, NA and repeated multi-measurement contracts; invalid decimal, blank/orphan remarks, missing required point, stale/state/permission/scope denials do not reach the fake repository write. Run `675bdc97-a82e-4fc7-88d8-8be95f7dad37`, candidate fingerprint above. |
| Astro/type check | PASS | `pnpm run typecheck` / `astro check`: 994 files, 0 errors, 0 warnings, 89 hints. |
| Production build | PASS | `pnpm run build`, run `675bdc97-a82e-4fc7-88d8-8be95f7dad37`, one build record passed; exact artifact digests above. Existing large-chunk warning remains. |
| Authorization fixture binding | PARTIAL | Unit fixture is a valid readable `DRAFT` inspection, actor role `EMPLOYEE`, owner/assignee same actor, version `3`; denial cases cover missing edit permission, inactive actor, out-of-scope actor, stale version, locked state, and named owner against locked state. These are unit doubles, not PostgreSQL row/audit/outbox snapshots. |
| PostgreSQL 18 save→reload / before-after row, audit, outbox | BLOCKED | No Docker daemon; `pg_isready` reports `/tmp:5432` no response. No fixture-backed DB write/read ran. Existing source transaction reads report+criteria/results, writes report version+result rows+audit atomically; no outbox consumer is registered for draft save. |
| Failure injection / rollback / concurrency / replay | NOT VERIFIED | Not run on this candidate without isolated PostgreSQL 18. |
| Real authenticated browser, 320/375/768/1440 CSS px, 200%, keyboard/AT | BLOCKED / NOT VERIFIED | Browser inventory had no tabs, and no isolated DB/authenticated inspection fixture was available. No viewport, screen reader, or human UAT claim is made. |
| Route card `RT-INSP-003` / finding `QC-PAGE-F-005` | PARTIAL | Source repair is present; full route acceptance remains open until PostgreSQL save→reload, authenticated browser/AT, and any required human acceptance are bound to this candidate. QC-PAGE-F-005 remains OPEN; no other page/finding was closed by this task. |

## Database contract

- Reads: inspection report, frozen creation criteria, and existing results.
- Writes: `inspection_reports.updated_by/updated_at/version`; delete and replace rows in `inspection_report_results`; append `MEASUREMENT_RECORDED` audit event in the same transaction.
- Existing constraints: report/point/user foreign keys, typed one-value check, unique/identifier constraints, report version/state compare-and-set. No new constraint or migration.
- Transaction boundary: existing `PostgresInspectionRepository.saveDraft` transaction; authorization rechecked while holding the report row lock; audit failure rolls back result replacement and version update.
- Outbox: N/A by current contract; draft save has no registered downstream side effect. This does not claim an outbox row was inspected in PostgreSQL for this candidate.

## Remaining

- Re-run PostgreSQL 18 positive and denial cases on an isolated database, verify `save → reload` for point remarks, `REMARK_ONLY`, `NA`, and decimal values, and capture redacted before/after row/audit/outbox digests.
- Run same-version race, rollback/failure injection, and replay checks; denial must leave existing row/audit/outbox unchanged with a positive read control.
- Run authenticated browser widths, 200% zoom, keyboard and manual AT against the built candidate; record the real actor/role/state fixture. Human UAT remains the responsibility of real participants.
- No owner decision remains open for this code change: the general notes field was removed per the task’s contract requirement. The page remains `PARTIAL`, and QC-PAGE-F-005 is not claimed closed.

## State

**PARTIAL** — source change and local technical checks are complete; database and live-page acceptance are blocked/unverified.

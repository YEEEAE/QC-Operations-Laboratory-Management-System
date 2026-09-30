# QC-ADP26-04 — exact decimal transport on inspection execution

Date: 2026-09-30, Asia/Riyadh. State: **PARTIAL**. Page: `/quarantine/inspections/[inspectionId]/execute`. Finding: **QC-PAGE-F-004 technically addressed in local source; acceptance remains open**. No production DB, schema migration, commit, push, merge, deployment, or human UAT signature.

## Changed

- Execute inputs always submit `input.value` as text. Both inspection result Actions reject JSON numeric values; `InspectionResultEntry.value` is `string | boolean`.
- The use case resolves numeric point type from its frozen criteria, validates plain decimal notation, preserves the exact submitted string as `numericValue`, and evaluates approved machine-readable rules using the exact-decimal evaluator. Invalid numeric forms reject before save; a numeric point without a formal rule retains the exact observation but no computed result.
- The repository persists tagged measurements only to existing `numeric_value NUMERIC`, maps PostgreSQL reads as strings, and the generated DB type no longer permits `number`. No precision/scale/rounding limit or business rule was invented.
- Updated inspection save contract and workspace map; no migration is needed. Existing NUMERIC storage is exact and unconstrained; DB-driver roundtrip still needs runtime evidence.

## Candidate and evidence binding

- Audit HEAD supplied: `0b1bb21bb3b4eca77862dbba1da8623044e96355` (historical).
- Actual starting HEAD / branch: `6c312f05c1234a00a5e6557116c50fb44c9e4be4` / `main`; initial working tree and diff clean. Final work is local/uncommitted.
- Node: `v22.22.3`, below project engine requirement `>=24.20.0 <25`. `pnpm@11.25.0` NOT VERIFIED: Corepack could not write its cache outside the workspace. Dependencies already present; tests invoked directly through `node_modules`.
- Dirty fingerprint: `7154898569805eb448618411e5255ad9613975a096141b93d4ce2be66ef52f91` (SHA-256 of `git diff --binary` for the 9 implementation/test paths named in the command below; documentation/evidence/map excluded to avoid self-reference).
- Source schema: migration `0008_quarantine.sql` defines `numeric_value NUMERIC` and exactly-one-value constraint. No applied schema ledger was available; source/applied parity NOT VERIFIED.
- Build identity: NOT VERIFIED. No build run.

## Evidence

| Acceptance | Status | Evidence |
| --- | --- | --- |
| Exact decimal UI → Action → use case → domain → repository | PASS (source/unit scope) | `execute.astro` collects `input.value`; numeric Actions accept string only; use case rejects floats and malformed decimal text; focused unit suite preserves `5.4000000000000000001` and evaluates against approved synthetic bounds. |
| Positive, malformed, notation and boundary behavior | PASS (unit) | `tests/unit/quarantine/inspection-dynamic-points.test.ts` and `tests/unit/quarantine/acceptance-evaluation.test.ts`, focused command **37/37**. Invalid `1e2`, `Infinity`, whitespace-wrapped number, and `NaN` are rejected. Existing exact comparator boundary tests included. |
| Role/state/version denial and unchanged row/audit/outbox | NOT VERIFIED by this run | QC-ADP26-03 candidate-specific PG/browser evidence belongs to a different HEAD and is not transplanted. Denial test code remains in the focused PG suite but runtime was unavailable here. |
| PostgreSQL 18 storage/read roundtrip and source/hash binding | BLOCKED | `tests/integration/quarantine/qc-data-002-dynamic-workflow.test.ts` was attempted; container startup failed with “Could not find a working container runtime strategy” before tests ran (5 skipped). New fixture asserts exact NUMERIC text after repository read/write once runtime is available. |
| Astro diagnostics | PASS | `node node_modules/astro/astro.js check`: 994 files, 0 errors; 89 hints and 2 existing deprecation warnings. |
| Browser/direct HTTP/actual responsive viewport, 200% zoom, AT, UAT | NOT VERIFIED | No candidate build or populated test DB/browser acceptance executed. No human acceptance signed. |
| Source/applied schema, DB before/after, race/replay, failure injection | BLOCKED / NOT VERIFIED | No PostgreSQL runtime. No production DB used. |

Commands: `node node_modules/vitest/vitest.mjs run tests/unit/quarantine/inspection-dynamic-points.test.ts tests/unit/quarantine/acceptance-evaluation.test.ts` (37/37 PASS); `node node_modules/astro/astro.js check` (0 errors); `node node_modules/vitest/vitest.mjs run tests/integration/quarantine/qc-data-002-dynamic-workflow.test.ts` (BLOCKED before tests); `git diff --check` (PASS).

## Data, policy and transaction boundary

Reads: existing report, frozen inspection/template snapshot, approved criteria and controlled source metadata. Writes remain the report version/update, replaced point result rows (`numeric_value`, text/boolean value columns), and mandatory `MEASUREMENT_RECORDED` audit in the existing transaction. Existing row lock, authorization recheck, exactly-one-value constraint, FK constraints, audit rollback and optimistic version semantics remain. No new outbox event, signature, approval, receiving consequence, or migration. Outbox/signature/SoD/reauthentication are N/A for registered EDIT-DRAFT, as documented in `INSPECTION-DRAFT-SAVE-CONTRACT.md`; review/approval policy is unchanged.

Scientific limits/source decisions remain governed by controlled QC source. No precision/rounding policy has been invented. Owner decision remains open wherever controlled rule/source/hash is absent; automated result stays unset without a valid formal rule. `yazeed` does not bypass the existing EDIT-DRAFT permission/scope/state/version checks.

## Findings and dependencies

- QC-PAGE-F-004: decimal transport/evaluator defect fixed in source; page finding remains OPEN pending PostgreSQL roundtrip, real browser/HTTP, and accessibility evidence.
- QC-ADP26-03: dependency evidence is historical on a different candidate; no evidence imported.
- QC-ADP26-10: report parity dependency not re-executed or claimed.
- Route visibility is handled by global `pageAccessDecision` in `src/middleware.ts`; page-specific HTTP visibility was not exercised in this task.
- Open: page-level linked validation errors/recovery, 320/375/768/1440 CSSpx, 200% zoom, keyboard/manual AT, source/hash fixture binding and human UAT.

Changed: exact decimal text is preserved through inspection execution and malformed/numeric JSON inputs are denied.
Evidence: focused unit 37/37 and Astro 0 errors; PostgreSQL integration blocked before tests due to missing container runtime.
State: PARTIAL.

Implementation/test fingerprint command: `git diff --binary -- src/actions/quarantine.ts src/modules/quarantine/inspection/application/record-inspection-results.ts src/modules/quarantine/inspection/domain/inspection-result.ts src/modules/quarantine/inspection/infrastructure/postgres-repository.ts src/pages/quarantine/inspections/[inspectionId]/execute.astro src/shared/database/db-types.ts tests/e2e/inspection-draft-authorization.spec.ts tests/integration/quarantine/qc-data-002-dynamic-workflow.test.ts tests/unit/quarantine/inspection-dynamic-points.test.ts | shasum -a 256` → `7154898569805eb448618411e5255ad9613975a096141b93d4ce2be66ef52f91`.

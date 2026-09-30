# QC-ADP26-10 — scientific source and final judgment

Date: 2026-10-01 (Asia/Riyadh). State: **PARTIAL / BLOCKED**. Finding **QC-PAGE-F-010 remains open**. No runtime, schema, migration, production, approval, or UAT change was made.

## Candidate and scope

- Branch: `main`; candidate HEAD: `b3d2d47684e74f76ef3da05435de1e5c47b05b4e`.
- Initial working tree: clean. Initial tracked-diff SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty set).
- Runtime: Node `22.22.3`, pnpm `11.25.0`; Node is below the project contract `>=24.20.0`.
- Source migration head: `0042_immutable_lab_equipment_usage`; applied schema was not queried.
- The pasted task's audit candidate `0b1bb21bb3b4eca77862dbba1da8623044e96355` is historical and does not match this candidate. No prior-candidate evidence was transferred.
- Applicable route set is the 18 routes listed in the task: quarantine overview/receiving/inspection/template routes and laboratory overview/tests/report-template/test execution/review/retest routes. Their route-specific acceptance denominator and browser states were not frozen or executed here; no family score is claimed.

## Source and use-case trace

The governing register `Documents/DECISION-ASSUMPTION-REGISTER-026.md` still records PD-01 through PD-05 as OPEN: approved criteria and method, controlled source/revision/hash, precision, and rounding. PD-07 (manual judgment) is OPEN too. The owner-approved RBAC decision covers workflow authority only; it does not approve scientific criteria or source identity. The controlling register and referenced handoffs identify no approved decision/source artifact containing the required source ID, revision, hash, scope, unit, precision, criteria, boundary semantics, and judgment rule. Existing template fields, examples, seed data, fixtures, and `EFFECTIVE` document links are not substitutes for that approval.

Current code trace:

- Laboratory source resolution reads approved template versions, linked effective documents, their hashes, per-parameter units and criteria, and snapshots that context. Production `PostgresControlledLabSources.evaluate()` throws `AUTHZ_DENIED`, so `ApproveLabTestUseCase` cannot persist an official result in the default wiring. It also compares evaluator `sourceReference` and `contentHash` with the frozen context. This is fail-closed mechanics, not a positive scientific evaluation.
- Inspection creation snapshots template criteria and linked document metadata. `RecordInspectionResultsUseCase` rejects client PASS/FAIL claims and evaluates server-side from rule type/payload. However `PostgresInspectionRepository.listPointCriteria()` reads live template rows and does not validate a controlled-source approval decision or reconcile their source hash against the frozen source snapshot before the use case persists point results. Template `content_hash` is accepted as supplied by template authoring; this path does not compute or verify it. The report-level official result remains unset by this save path; approval requires it. `PASS` remains separate from receiving release, and HOLD is not converted to release.
- Therefore the lab default denies the positive official result path, while inspection point PASS/FAIL persistence is not yet proven to be scientifically source-bound. No source/hash/evaluator change can safely close this gap without the owner decision and canonical source.

## Data boundary and actions

No database writes were run. Existing inspection draft save reads the report, template criteria, and authorization context; its repository transaction replaces draft result rows and advances report version while appending audit atomically. No schema change is currently justified. The necessary future transaction, audit/outbox behavior, and race/replay proof must be reconciled against the approved evaluator/snapshot contract before implementation; no new outbox event or transition is inferred here. Production DB was not accessed.

Authorization and result boundaries confirmed by source inspection: result writes require existing draft-edit authorization/scope/state/version checks; browser PASS/FAIL is rejected in the inspection use case; laboratory evaluation and approval fail closed under default wiring; inspection final approval and receiving release are separate actions. No authenticated role/state database test was executed on this candidate.

## Evidence

| Check | State | Evidence / boundary |
| --- | --- | --- |
| Approved scientific source/revision/hash/unit/precision/criteria | BLOCKED | PD-01/02/03/04/05/07 remain open in the register; owner/source artifact absent. |
| Inspection evaluator and source snapshot binding | PARTIAL | Source inspection only; persistence path currently evaluates rule payload without proving approved-source/hash binding. |
| Laboratory evaluator source/hash binding | PARTIAL | Default production adapter denies evaluation; no authorized positive evaluator/source exists. |
| Focused unit contracts | PASS | 4 files, 63/63 tests: inspection dynamic points, inspection acceptance evaluation, laboratory scientific governance, controlled-policy fail-closed. These do not establish a real scientific positive case. |
| PostgreSQL 18 positive/denial/rollback/race/replay | NOT RUN | No disposable PG18 run in this task; applied schema NOT VERIFIED. |
| Browser/direct HTTP, actual viewport/200% zoom, manual AT | NOT RUN | No candidate-bound authenticated runtime or accessibility evidence. |
| Human UAT / approval signature | NOT RUN | No real participant/owner decision; none signed for a human. |
| Build/typecheck/release identity | NOT RUN | No application code changed; current Node is below contract. |
| Migration | N/A | No justified schema change without the source decision and resolved persistence contract. |
| Production writes / commit / push / deploy | NOT RUN | None performed. |

## Open decision and next bounded implementation

QC/QMS method owner and Document Control must provide/approve the source and exact effective revision/hash, applicable product/site/method/template/point mapping, unit and precision, criterion payload and boundary semantics, rounding stage, manual-judgment allowance/authority, and report aggregation/HOLD/FAIL consequences. QC-100-FINAL-013 coordinates the decision; QC-100-FINAL-012 reconciles evidence. After that input is recorded, implement exact hash/revision validation and frozen snapshots on the server, then bind both evaluators and report-level results to that same verified source. Keep client PASS/FAIL denied, keep missing/hash drift denied, preserve exact decimals, and retain the separate Supervisor→QCM/owner workflow, HOLD behavior, and `PASS ≠ RELEASED`.

## Handoff state

- Changed: no runtime behavior; recorded current-candidate source and code-path evidence, including the inspection point-result provenance gap.
- Evidence: focused unit contracts 63/63 PASS; all external/runtime scientific acceptance remains BLOCKED or NOT RUN as listed above.
- State: **PARTIAL / BLOCKED** — scientific decision required before completing the requested evaluator/snapshot binding. Existing handoff `audit/2026-09-24/QC-ADP-02-inspection-source-approval-handoff.md` remains controlling for inspection owner decisions and its 10 cards; `audit/2026-09-24/QC-ADP-05-laboratory-report-drafts-handoff.md` remains relevant for source-bound lab drafts.
- Key files: `Documents/DECISION-ASSUMPTION-REGISTER-026.md`, `src/modules/quarantine/inspection/application/record-inspection-results.ts`, `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts`, `src/modules/laboratory/infrastructure/postgres-controlled-sources.ts`.

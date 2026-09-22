# QC-100-FINAL-038 — Laboratory Ergonomics & Task-Sequence Analysis

## MASTER HEADER

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Target: `main`
- Frozen candidate (analysis baseline): HEAD `03c41b61ec2d5a6df3c6cbe02e35a3a2ec9e2b32`, working-tree dirty fingerprint `5a5b8a0a6a5fa1fc`, Node `v22.17.0`, Astro `5.16.0`
- Date: 2026-09-22
- Scope: laboratory operational journey ergonomics only. No scientific/scientific-authority change, no new audit-scoring domain (80-domain denominator unchanged).

## Sources analyzed (approved workflow sources + current implementation)

- `Documents/STATE-MACHINES.md`, `Documents/BUSINESS-RULES.md`, `Documents/PERMISSIONS.md`, `Documents/UX-RESEARCH-SCENARIOS.md`, `Documents/PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md`, `Documents/UI-UX-ACCESSIBILITY-SPECIFICATION.md`
- `src/pages/laboratory/tests/new.astro`, `[labTestId]/index.astro`, `[labTestId]/execute.astro`, `[labTestId]/review.astro`
- `src/modules/laboratory/application/save-measurements.ts`, `get-lab-test.ts`, `src/modules/laboratory/domain/measurement.ts`, `parameter-acceptance.ts`
- `audit/100-percent/USABILITY-STUDY-PACKAGE.md`, `audit/100-percent/2026-09-10-ux-research-scenarios-and-usability-plan.md`

## Operational task sequence (from approved sources)

The laboratory journey is a governed state chain, not a set of screens:

1. Create record from an approved controlled template version (`DRAFT`).
2. Record samples and raw observations against the frozen method context.
3. Submit for review (`DRAFT → SUBMITTED`) — completeness, equipment eligibility and controlled sources are verified server-side.
4. Supervisor review starts (`UNDER_REVIEW`); stage-1 approval evaluates the scientific result only through the approved source.
5. QCM final approval (`PENDING_QCM_APPROVAL → FINAL_APPROVED`) with binding e-signature and reauthentication.
6. Controlled return/reopen/reject paths with reason, SoD, state, version, and scope.

## Findings — ergonomic gaps in the pre-change implementation

| # | Gap | Type | Evidence (pre-change) | Risk |
|---|---|---|---|---|
| F1 | Execute page showed only aggregate counts ("Samples: N; measurements: M") with no measurement entry surface at all; raw observation capture had no UI path | Avoidable re-entry / missing affordance | `execute.astro` (pre-change) rendered counts + submit button only | Operator forced to record observations outside the controlled record and re-enter them later, breaking traceability of who observed what, when |
| F2 | Units, precision guidance, and approved acceptance criteria were not visible at the point of entry | Ambiguous units / memory burden | Parameters exist in frozen context (`unit`, `precisionGuidance`, `sourceReference`, approved rule payload) but were never rendered | Operator must hold units/limits in memory or consult an external document — exactly the memory-load failure mode UI-UX-01 §5.1 warns against |
| F3 | Sample identifiers were not displayed on the execute surface | Memory burden / re-keying risk | Samples are created with the record but invisible during execution | Operator re-types identifiers from memory/paper, enabling transposition errors the server then stores as evidence |
| F4 | Review page showed only counts; reviewers had no side-by-side observed-value vs approved-criteria comparison | Error-prone review step | `review.astro` (pre-change) rendered "Measurements: N; samples: M" only | Reviewer must mentally reconstruct each observation against criteria — a deliberate-review step deprived of its evidence, inviting rubber-stamping |
| F5 | No distinction surfaced between a rule-evaluated value and a parameter the reviewer owns | Ambiguity in review | Domain rule: parameters without an approved acceptance rule have no automated outcome (`parameter-acceptance.ts` returns `null`) | Reviewer cannot tell "approved rule says PASS" from "no rule exists — you own this", risking implied authority the system does not have |
| F6 | No unsaved-changes protection on the execution surface | Error prevention | `new.astro` already guards unsaved changes; execute page did not | Loss of entered observations on navigation |
| F7 | Controlled document and equipment context shown as bare counts | Context visibility | "Equipment records: N; Controlled documents: N" | Operator cannot confirm which approved SOP revision or instrument applies without leaving the task |

## Ergonomic requirements derived (implemented in item 2)

- R1 — Point-of-entry context: every entry cell shows the approved unit; each parameter block shows precision guidance and its controlled source reference.
- R2 — No re-entry: sample identifiers are rendered from the frozen record, never re-typed; the measurement grid is samples × parameters with existing values pre-filled.
- R3 — Review comparison: review page renders observed value + unit next to the approved criteria text per (sample, parameter), plus calculated values where the approved calculation rule produced one.
- R4 — Authority clarity: rule-derived PASS/FAIL is shown only when the frozen context carries an approved acceptance rule (evaluated by `evaluateParameterAcceptance`, which never invents thresholds); otherwise the cell is labeled "Reviewer decision — no approved rule".
- R5 — Error prevention: unsaved-change guard on the measurement form; submission blocked until server-side completeness, eligibility and scope checks pass (unchanged server authority).
- R6 — Context panel: controlled documents listed by document number, title and revision; equipment usage records listed when present.

# QC-100-FINAL-021 — Contextual guidance & safe next actions

- **Candidate (frozen before execution):** base HEAD `75c9d0be0a70a40099fe031f9c4803cf543fc59f` (audit012 comparison candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a` predates 018/019/020 remediation; current HEAD carries that work on a dirty tree).
- **Dirty-tree changed files (this task):** 7 files listed under Evidence.

## Requirement → implementation → evidence → dependency

| Requirement (scoped item) | Changed path | Evidence | Unresolved dependency / owner |
|---|---|---|---|
| 1. Inventory screens lacking status/next-action/prereq/responsibility guidance | `audit/2026-09-20/QC-100-FINAL-021-contextual-guidance-next-actions.md` (this matrix) | Inventory below: 7 record workspaces already carry `JourneyContextPanel`; guides page gained a state matrix | none |
| 2a. Contextual help + prereq explanations + next-action links on the shared panel | `src/ui/components/workflow/JourneyContextPanel.astro` | unit UI 275/275 PASS (5 journey-panel contracts) | Browser/AT verification NOT RUN (003/006/040) |
| 2b. Two-stage approval explained without implying authority | `src/pages/quarantine/inspections/[inspectionId]/review.astro` | stageNote + per-stage prerequisites in contract tests; e-signature/reauth fact preserved | E2E authenticated NOT RUN (003) |
| 2c. PASS vs RELEASED without ambiguity | `src/pages/quarantine/receiving/[receivingId].astro`, `src/shared/copy/help-content.ts` (guidance matrix row + help section) | "PASS ≠ RELEASED" asserted in `tests/unit/ui/help-content-contract.test.ts` and receiving `stageNote` | UAT human evidence BLOCKED (owner 004/external) |
| 2d. Screen/state guidance matrix on the help page | `src/pages/help/index.astro`, `src/shared/copy/help-content.ts` (`HELP_GUIDANCE_MATRIX`) | matrix route IDs resolved against registry in contract test | none |
| 3. State tests: empty/denied/stale/unavailable + no-JS | `tests/unit/ui/{journey-context-panel,help-content-contract}.test.ts` | panel: no `<form>`, no `astro:actions`; guidance is prop-driven (`prerequisites?`, `item.met`), so denied/stale states render changed guidance; links are plain `<a>` → no-JS safe | Browser execution NOT RUN (003/006/040) |

## Screen/state guidance inventory (item 1)

Workspaces already instrumented with `JourneyContextPanel` (7):
`assets/calibrations/[calibrationId]`, `quarantine/receiving/[receivingId]`, `approvals/[approvalId]`, `quarantine/inspections/[inspectionId]/review`, `laboratory/tests/[labTestId]`, `documents/[documentId]/versions/[versionId]`, `change-requests/[changeRequestId]`.

Gaps closed this task (item 2):
- Shared panel lacked *why* guidance: no stage explanation, no prerequisites, no informational-vs-mutation boundary → added `stageNote`, `prerequisites[]` (met/not-met), and a fixed mutation-authority note.
- `receiving/[receivingId]`: PASS result vs release system state now stated on the panel, with derived release prerequisites.
- Inspection review: two-stage `SUBMITTED → UNDER_REVIEW → PENDING_QCM_APPROVAL → APPROVED` chain explained per state, Admin denial and `PASS ≠ RELEASED` explicit.
- Help page: new "Screen and state guidance" section rendering `HELP_GUIDANCE_MATRIX` (receiving / two-stage inspection / document version), derived from approved state machines, with the informational-vs-authorized-mutation boundary stated.

Guidance derivation rule respected: all strings derive from record state + actor permissions read server-side (`inspection.state`, `item.releaseSystem`, `canStageApprove`, `canFinalApprove`, `canRelease`); no hardcoded promise of authority; no new policy source created.

## Command results (2026-09-20, 04:56–04:58 local)

- `pnpm vitest run tests/unit/ui/help-content-contract.test.ts tests/unit/ui/journey-context-panel.test.ts` → 23/23 PASS.
- `pnpm vitest run tests/unit/ui` → **27 files / 275 PASS** (0 fail) after fixing 3 self-inflicted contract violations caught by suites: 12px typography floor (`.72rem` → `--font-size-xs`), banned "read model" wording in 3 presentation files (reworded, wording only).
- `pnpm typecheck` → 0 errors / 0 warnings / 74 hints.
- `pnpm astro build` → exit 0.

## Identity

- Base SHA: `75c9d0be0a70a40099fe031f9c4803cf543fc59f` (unchanged — no commit performed).
- Dirty-tree files: 7 (listed in the table above).
- Build: completes; no schema/migration change; no server authorization change.

## States

- **DONE:** scoped items 1, 2 (implementation + contract evidence), 3 (static/contract level).
- **NOT RUN:** live browser and assistive-technology verification (owners 003/006/040); authenticated E2E (003).
- **BLOCKED (external):** human acceptance / UAT sign-off (owner 004 policy; human execution excluded from this task); final reconciliation owner 012; audit012 re-score on a new frozen candidate.
- **PASS ≠ RELEASED** retained; no commit/push/deploy/migration performed.

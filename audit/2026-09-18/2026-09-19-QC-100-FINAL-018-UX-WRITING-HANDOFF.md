# QC-100-FINAL-018 — Humanized UX Writing & Application-Wide Content Simplification — Handoff Report

- Date: 2026-09-19
- Baseline: HEAD `36130a7`, clean tree before this task
- Status: **DONE (unit + gates). Browser/E2E verification: NOT RUN (requires populated PostgreSQL fixture environment).**
- Indicator note: no domain score or completion percentage was changed by this task; copy-only scope.

## Scope executed

Surfaces changed (all presentation-only; no authorization, state machine, SoD, audit,
or data contract was touched):

| Surface | File(s) | Change |
| --- | --- | --- |
| Shared vocabulary | `src/shared/copy/ux-vocabulary.ts` | Added `errorClasses` (six canonical failure messages), `scopeKindLabels`, `severityLabel()` |
| Finding detail | `src/pages/quality/findings/[findingId].astro` | `stateLabel(finding.state)`, added Severity row with `severityLabel`, removed developer-facing lede, renamed "History and related NCR" → "History and related records" |
| Findings register | `src/pages/quality/findings/index.astro` | Severity cell uses `severityLabel`, state cell uses `stateLabel`, filter options humanized |
| Equipment register/detail | `src/pages/assets/equipment/*.astro` | State cells + filter options via `stateLabel`; "Equipment ID" → "Equipment number"; simplified identity-change lede |
| Calibration register/detail | `src/pages/assets/calibrations/*.astro` | State cells + filter options via `stateLabel`; "Calibration ID" → "Calibration number" |
| Maintenance register/detail | `src/pages/assets/maintenance/*.astro` | State cells + filter options via `stateLabel`; "Maintenance ID" → "Maintenance number"; UNDER_MAINTENANCE sentence humanized (meaning preserved) |
| Inspection detail facts | `src/pages/quarantine/inspections/[inspectionId]/index.astro` | Workflow state fact now `stateLabel(inspection.state)` |
| Backup register | `src/pages/system/backups/index.astro` | YES/NO → Yes/No; tightened lede, empty state, restore boundary, RPO/RTO copy (BKP-001 meaning preserved) |
| Backup detail | `src/pages/system/backups/[backupId]/index.astro` | `{backup.state} (execution result only)` → `stateLabel(backup.state) — execution result only`; restore-run states humanized; RECORDED/NOT RECORDED → sentence case |
| Restore request | `src/pages/system/backups/[backupId]/restore.astro` | Same state humanization; PLANNED/CREATED/VERIFIED prose → sentence case without losing the deny boundary |
| 404 / 500 | `src/pages/404.astro`, `src/pages/500.astro` | Removed duplicated identical action links (one clear action each); 500 now says "Nothing was changed" |
| User creation | `src/pages/admin/users/new.astro` | Scope-kind checkboxes now use human labels (`Own records`, `Whole system`, …) instead of raw `OWN`/`GLOBAL`; ACTIVE → active; password-audit lede simplified |
| Notifications | `src/pages/notifications.astro` | Unavailable-state wording and empty-state wording tightened |
| Search | `src/pages/search.astro` | Result state now `stateLabel(result.state)`; "business ID" → "record number" |

## Before / after examples

| Page | Before | After |
| --- | --- | --- |
| Findings register | `<td>{finding.state}</td>` renders `UNDER_REVIEW` | `stateLabel()` renders `Under review` |
| Findings register | `<td>{finding.severity ?? 'Not classified'}</td>` renders `CRITICAL` | `severityLabel()` renders `Critical` |
| Calibration filter | `<option>OVERDUE</option>` | `<option>Overdue</option>` |
| Equipment table | `Equipment ID` | `Equipment number` |
| Equipment detail | `{equipment.state}` renders `OUT_OF_SERVICE` | `Out of service` |
| Equipment history | `PENDING → ACTIVE` | `Pending → Active` |
| Backup detail | `CREATED (execution result only)` | `Created — execution result only` |
| Backup detail | `RECORDED (value withheld)` | `Recorded (value withheld)` |
| Restore page | `This backup set is CREATED.` | `This set is Created.` (deny boundary text unchanged) |
| Admin user creation | `OWN`, `GLOBAL` checkboxes | `Own records`, `Whole system` |
| 404 | "Continue safely" + "Go back" (both to the same URL) | Single "Go to dashboard" |
| 500 | "Try again" + "Go to dashboard" (identical `/dashboard`) | Single "Back to dashboard" |

## Preserved regulated terminology (verified by tests)

- `PASS`, `FAIL`, `HOLD`, `RELEASED`, `VOID`, `NCR`, `CAPA` exact casing everywhere.
- Receiving detail facts block keeps `Receiving state`, `Inspection result`,
  `Release System State`, and the `NOT_RELEASED`/`RELEASE_PENDING`/`RELEASED` raw
  codes — pinned by `tests/e2e/critical-workflows.spec.ts`.
- Inspection-report heading matches `/INSPECTION REPORT|INSP/i`; laboratory execute/review
  pinned copy (`Frozen context`, `Criteria source:`, `Raw observations`,
  `POLICY / SCIENTIFIC SOURCE REQUIRED`) untouched.
- Dashboard identity `OPERATIONAL COMMAND CENTER`, `Attention data is unavailable`,
  `Activity data is unavailable`, and all fail-closed copy untouched (pinned by
  `tests/unit/ui/universal-shell.test.ts` and `dashboard-decision-surface.test.ts`).

## Shared vocabulary added

`src/shared/copy/ux-vocabulary.ts`:
- `errorClasses`: one distinct message per canonical server error class
  (validation / authorization / stale / dependency / duplicate / unknown-safe).
- `scopeKindLabels`: `OWN` → `Own records` … `GLOBAL` → `Whole system`.
- `severityLabel()`: `CRITICAL` → `Critical`; `null` → `Not classified`.

## Guide

Created `Documents/UX-WRITING-GUIDE.md` (project documentation root per the approved
Documents/ consolidation; the historical `docs/` tree no longer exists): principles,
state-label rules, identifier rules, error-class table, empty/unavailable/loading
rules, protected boundaries (PASS ≠ RELEASED, backup ≠ restore, AI advisory), and a
review checklist.

## Tests added

`tests/unit/ui/ux-writing-contract.test.ts` (14 tests):
- vocabulary behavior: regulated codes exact, non-regulated codes humanized,
  severity humanization, transition label never empty, release boundary pinned,
  error classes distinct and non-generic.
- page hygiene: no raw enum in state cells across quality/assets pages, human
  number column headings, receiving facts block E2E pin, backup state label,
  single-action error pages, no generic failure text in mutation forms, human
  scope-kind labels.

## Verification evidence

- `npx vitest run` (unit suite): **593 passed, 1 failed, 138 skipped** — the single
  failure (`tests/unit/verification/expected-access-matrix.test.ts`) asserts
  `QC_VERIFY_*_PASSWORD` env vars are unset; they are legitimately set in this local
  session for manual verification. **Unrelated to this task** (copy-only change).
- Targeted UI contracts (`ux-writing-contract`, `universal-shell`,
  `dashboard-decision-surface`, `quarantine-decision-surface`, `form-ux-contract`):
  **44/44 PASS**.
- `npm run typecheck` (astro check, 820 files): **0 errors**.
- `npm run test:architecture`: **PASS** (boundary + route-file checks).
- `npm run lint` (eslint): **PASS, no output**.
- Browser accessibility pass and populated-PostgreSQL E2E: **NOT RUN** here (no
  fixture environment in this session).

## Unresolved decisions / downstream work

1. Accessibility re-run after copy changes (accessible names and label-in-name can
   shift) — recommended before release: `tests/e2e/accessibility.spec.ts`.
2. Arabic/RTL remains out of scope per the approved 013 policy; guide documents
   English-only as the baseline decision.
3. Two E2E suites that exercise copy (`critical-workflows`, `authenticated-closure`)
   need a populated fixture run to confirm nothing regressed on rendered pages.
4. `authored-closure`/UAT copy review remains with 019+ tasks; this task does not
   claim UAT or production readiness.

# QC-100-FINAL-014 — Reject Reports, analytics, Issue Slip and print acceptance

**Date:** 2026-09-19
**State:** PARTIAL
**Evidence:** PASS on the scoped local candidate for every command in §5; NOT RUN/BLOCKED where marked below.
**Release:** `PASS ≠ RELEASED` — this is technical evidence only, not a release authorization or a UAT result.

## 1. Candidate and environment (frozen)

| Item | Value |
| --- | --- |
| Repository HEAD | `de1ad2d6ca637bbb219eea681e233b1e57b7ce17` (`main`, commit "update site") |
| Working tree | dirty — 2 modified files + 1 new test directory (the change set below) |
| Content dirty fingerprint | `c584a071e42b3b802284e69e23b9469d845b00dca3327fd87ad0f391351a946c` (all tracked+untracked files except `node_modules`/`.git`) |
| Release identity | `rel-2a804c6531a7e717`, buildId `local-de1ad2d6ca63`, applicationVersion `0.1.0`, migrationHead `0031_qc_creation_parity_two_stage_approval` (checksum `44b160a6…`) |
| Node / pnpm (local) | `v22.22.3` / `11.25.0` — **outside** the declared `>=24.20.0 <25` contract; local results are not runtime-parity evidence |
| Database | disposable task-owned PostgreSQL **18.6** (`scripts/db/disposable-postgres.sh`), TLS `verify-full`, task-owned databases `qc_final014` (focused) and `qc_final014_full` (full suites), both created fresh for this task and never shared |
| Comparison baseline | candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`: maturity 45.8%, mandatory production gates 0/19, PARTIAL / NO-GO — comparison values only, not proof for this candidate |

No commit, push, merge, deploy, production migration, credential rotation or paid-service change was performed. No production database was touched. No secret or credential-bearing URL appears in this report or in any artifact produced here. The probe scripts used during diagnosis were temporary (`.tmp/`, gitignored) and are not part of the change set.

## 2. Change set (3 paths)

| File | Change |
| --- | --- |
| `src/modules/reject-reports/infrastructure/postgres-repository.ts` | (a) `loadSlip` orders approval confirmations by the canonical checkpoint order (`array_position` over `SUPERVISOR, QC_MANAGER, FACTORY_DIRECTOR`) instead of alphabetical SQL order; (b) `confirmApproval` row guard now accepts `PENDING` **or** `REVERSED` so a reversed checkpoint can actually be re-confirmed, keeping the single-transition guarantee. |
| `src/shared/database/database.ts` | `translateDatabaseError` re-throws an existing `AppError` unchanged instead of re-wrapping it as `SYSTEM_DATABASE_UNAVAILABLE` (matching the pattern already used in change-requests/documents/backup-recovery repositories). |
| `tests/integration/qc-100-final-014/reject-reports-void-analytics.test.ts` | New populated integration suite, 5 cases (§4). |

## 3. Two real defects found and fixed

### F-014-1 (fixed): the checkpoint queue loaded in the wrong order
`loadSlip` used `.orderBy('approval_role')`. Alphabetical SQL ordering is `FACTORY_DIRECTOR < QC_MANAGER < SUPERVISOR`, so `slip.approvals` arrived reversed. The domain queue (`pendingApprovalRoles`) then offered `FACTORY_DIRECTOR` as the "next pending checkpoint" for a slip whose real next checkpoint was `SUPERVISOR`, and `assertApprovalRoleIsNext` denied the **correct** confirmation while the page rendered "Confirm the earlier checkpoint first." for the wrong checkpoint. This contradicted `Documents/REJECT-REPORTS.md` ("the detail page only offers the confirm action for the next pending checkpoint") and made the reversed-checkpoint recovery path unusable whenever FACTORY_DIRECTOR had already been confirmed. Fixed by ordering in SQL by the canonical checkpoint array; proven by the `reverse → skip-denied → re-confirmed → COMPLETED` chain in the new suite.

### F-014-2 (fixed): reversed checkpoints could never be re-confirmed
`confirmApproval` guarded the confirmation row with `status = 'PENDING'` only, but the documented correction semantics (`REJECT-REPORTS.md`, domain `pendingApprovalRoles`) require a `REVERSED` checkpoint to re-enter the queue and be re-confirmable. Any re-confirmation attempt reached the repository and found no matching row, throwing `CONFLICT_STALE_VERSION` — which `translateDatabaseError` then re-wrapped as `SYSTEM_DATABASE_UNAVAILABLE`, hiding the real code. Fixed both halves: the row guard accepts `PENDING or REVERSED` (still single-transition), and `translateDatabaseError` passes through an existing `AppError`.

Note on the SQL ambiguity repair (prompt item 1): the historical `column reference "status" is ambiguous` fix in the analytics SQL was **rechecked, not reimplemented** — every analytics/summary statement qualifies `r.status` / `a.status` to its joined table, and the long-standing regression case in `tests/integration/reject-reports` (populated report + confirmation tables) still passes. No change was made to that SQL.

## 4. What the new suite proves (populated PostgreSQL, task-owned disposable cluster)

`tests/integration/qc-100-final-014/reject-reports-void-analytics.test.ts` — 5 cases:

1. **Ordered completion**: create → issue → `SUPERVISOR → QC_MANAGER → FACTORY_DIRECTOR` in order, each recorded as a creator attestation (`confirmedBy = creator.id`, never an approver signature), completing atomically with `COMPLETED` + `completed_at`.
2. **Denial classes with zero side effects**: skip-ahead (`QC_MANAGER`/`FACTORY_DIRECTOR` first), non-creator (SoD, even with a GLOBAL grant), inactive account, and stale version — all denied, state/version/approvals unchanged; replay of a confirmed checkpoint denied (domain ordering gate + row-status guard); exactly one `ISSUE_SLIP_APPROVAL_CONFIRMED` audit row with `approvalRole: SUPERVISOR`; no `ISSUE_SLIP_COMPLETED` outbox event.
3. **Correction path**: reversal requires a non-blank reason (`VALIDATION_FAILED`); non-creator non-owner denied (`AUTHZ_DENIED`); stale version denied; reversal sets `REVERSED` with actor/timestamp/reason and returns the report to `APPROVAL_TRACKING`; confirming a later checkpoint first stays denied; re-confirming the reversed checkpoint completes the record atomically; the correction is an immutable audit fact (`REJECT_REPORT_CORRECTED` with reason and states).
4. **VOID where approved, both types**: non-creator void denied despite GLOBAL grant; creator voids a FINALIZED Daily Reject and an APPROVAL_TRACKING slip with mandatory reasons; entries/history retained after VOID; a VOID slip can never be confirmed afterwards; both voids audited (`REJECT_REPORT_VOIDED` ×2).
5. **Analytics grain and honesty**: a voided slip (unique item/reason) and a voided daily record vanish from `byItem`, `byReason`, `topRejectItems`, `byDepartment`, `trendByDate` and `rejectPctTrend`; populated trend/reportCount/approvalStatus deltas hold; a populated daily day yields a finite server-computed percentage; a day whose only entries have `good_qty = 0` yields `null` (never `0` or `Infinity`); list filters respect status/department/search; `VOID` records are listable but excluded from every dashboard counter.

## 5. Verification commands (all on the final tree, fresh disposable PostgreSQL 18.6, TLS verify-full)

| Command | Result |
| --- | --- |
| `pnpm vitest run tests/integration/qc-100-final-014 tests/integration/reject-reports tests/integration/qc-100-final-013 tests/unit/ui/icon-and-copy-contract.test.ts tests/unit/reject-reports` | **65/65 PASS** (7 files) on fresh `qc_final014` |
| `pnpm test:unit` (fresh `qc_final014_full`) | **677/677 PASS**, 93 files, exit 0 |
| `pnpm test:integration` (fresh `qc_final014_full`) | **440/440 PASS**, 98 files, exit 0 — 0 skips (435 + 5 new) |
| `pnpm test:migrations` | **29/29 PASS**, 8 files, exit 0 |
| `pnpm test:concurrency` | **12/12 PASS**, 2 files, exit 0 |
| `pnpm test:security` | **52/52 PASS**, 7 files, exit 0 |
| `pnpm test:architecture` | PASS (boundaries + canonical route coverage), exit 0 |
| `pnpm typecheck` (`astro check`) | **848 files / 0 errors / 0 warnings / 74 hints**, exit 0 |
| `pnpm lint` | PASS (no findings), exit 0 |
| `pnpm format:check` | PASS — `All matched files use Prettier code style!` |
| `pnpm build` (Astro SSR) | PASS, exit 0 — server built, no errors |

## 6. Prompt items 3–4 status

* **Issue-slip placeholder-glyph regression**: rechecked on the current source. The detail pages use semantic CSS status dots (`aria-hidden` decorative dots + human-readable state text), and the guarded `tests/unit/ui/icon-and-copy-contract.test.ts` (`3/3 PASS`) fails on any U+2192-style placeholder glyph in `src/pages`/`src/ui`. The historical regression was the U+2192 comment arrows fixed in QC-100-FINAL-002; nothing regressed on this candidate. **No change was needed.**
* **Empty/error/loading states, server-side scope, print layout**: the register page renders an honest `503 + ErrorState` when the module schema is unavailable (fail-closed, never a fake zero) and honest empty states per panel; detail pages deep-link-redirect to the register when unavailable; every read goes through the use cases (`AUTHZ_DENIED` for inactive actors; scope enforced server-side by `authorize()`); print views ship `@media print` layouts on both detail pages that hide action surfaces.
* **Export parity**: no Reject-specific export exists. The canonical export pipeline (`/reports/[reportCode]/export`, CSV/XLSX through `ExportReportUseCase`) re-runs the same server-side use case as the screen, but the `ReportRegistry` contains only `quarantine-aging`. A reject-reports export would require a new report definition + a permission decision (`PERM-RPT-*` family) — **not implemented, recorded as an open owner decision**, not silently claimed.
* **Authenticated mobile/desktop workflows and post-deploy route behavior**: NOT RUN. No browser automation, no container runtime, and this candidate was **not deployed** — the deployed Render release remains an older SHA at migration head `0018` with the credential-rotation gate open. An unauthenticated redirect check would not prove authorized behavior and was not offered as evidence (per the negative-measurement rules).

## 7. Unfulfilled dependencies (unchanged, unfulfilled)

* Exact-candidate CI, authenticated E2E (mobile/desktop), production deployment of this candidate, and human UAT remain **NOT RUN/BLOCKED**. Mandatory production gates remain **0/19**. None may be manufactured under this task.
* Open owner items: reject-reports export definition + `PERM-RPT-*` decision (owner: QC decision + implementation); Node 24.20.0 runtime parity; operator credential rotation (blocks production migration).
* Downstream: 002/003 (regression evidence re-run on the next candidate), 005/018 (any further UI changes), 001 (production acceptance), 004 (authentic acceptance).

## 8. Final state

* Implementation status: **DONE** for the two verified source fixes; **PARTIAL** overall because export parity is an open owner decision and authenticated/post-deploy evidence is out of reach locally.
* Evidence status: **PASS** for every command in §5; **NOT RUN** for browser/E2E/CI/UAT/deployed-route verification.
* F-008 / F-009 linkage: the referenced quality-gate and integration-suite findings were closed earlier (QC-100-FINAL-002) and are re-confirmed green on this candidate (format/lint 0, unit 677/677, integration 440/440, 0 skips).

No other task is marked complete by implication.

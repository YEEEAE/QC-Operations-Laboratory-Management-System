# QC-100-FINAL-037-B — Integration and technical evidence: unsaved-change/draft behavior and consequence-specific confirmation/recovery

- Date: 2026-09-22 (evidence run 15:21–15:26 UTC, local machine)
- Candidate (frozen before execution): HEAD `85dbe219689162afb0746cebbe0be9b38947ff5a` (`main`). The 037-A diff was verified present on this HEAD (`git log` shows `enhance-with-classification.ts` and `interaction-state-contract.test.ts` landed in commit `add43da`; the A-time candidate `a022722c…` is an ancestor).
- Working tree at freeze: dirty with **unrelated** laboratory work (QC-DATA-003 family). Baseline dirty fingerprint (sha256 of sorted `git status --porcelain` lines, before this diff): `fa18d6d2854125b5a1a85d97b3af6c65b492e8b664c8b71c5347f54eb3846c25`. Final dirty fingerprint (after this diff, excluding this report and the Mind entry themselves): `0a50dc648da9b979113c3243ed05086324747fc9e477f4b5faa8fdd0d3bdfec4`. The unrelated dirty set was preserved untouched.
- Local release identity: `rel-f841c47a20594672` (gitSha `85dbe21…`, workingTree dirty) — `dist/release-identity.json`, `pnpm release:verify` → `verified: true`.
- Environment caveat: Node `v22.22.3` is outside the declared runtime contract (`>=24.20.0 <25`); same constraint recorded in earlier family reports. pnpm `11.25.0`.
- Scope: disciplines map onto existing audit domains 4/20/62/63/65/66/68/69 — no new scored domain, 80-domain denominator unchanged (`pnpm requirements:check` PASS).

## Item 1 — Unsaved-change / draft behavior, approved editable states only

**Changed paths:**
- `src/ui/forms/unsaved-changes.ts` (new) — shared unsaved-change navigation guard implementing the approved sources (Documents/UI-UX-SPECIFICATION §31, Documents/ROUTE-MANIFEST-SPECIFICATION §136): tracks dirtiness from real field `input`/`change` events, warns through the native `beforeunload` Discard/Continue dialog only when dirty, clears on the committed-success event or on a genuine native (non-intercepted) POST. In-memory only; idempotent per form; returns a detach function.
- `src/ui/forms/enhance-with-classification.ts` — dispatches `FORM_COMMITTED_EVENT` (`qc:form-committed`) inside the SUCCESS branch only, before the intentional post-commit navigation, so the guard never warns about a successful save. A failed or interrupted request keeps the guard dirty (entries stay on screen and stay protected).
- Six approved create surfaces wired (guard registered after the enhancement so `defaultPrevented` is visible to it): `assets/equipment/new.astro`, `assets/maintenance/new.astro`, `assets/calibrations/new.astro`, `documents/new.astro`, `laboratory/tests/new.astro`, `change-requests/new.astro`.
- `tests/unit/ui/unsaved-navigation-contract.test.ts` (new, 18 tests).

**Autosave decision (explicit, not implemented):** no autosave was added. The requirement conditions it on an explicit supported draft contract with authorization, version handling, and a retention policy; none exists in the approved sources, so autosave stays **POLICY-DEPENDENT through 013/026**. Until then the honest behavior is warn-before-leave. The contract test pins this: no Web Storage/cookie/IndexedDB use in the guard or the guarded pages, no autosave timers. Signature, approval, reauthentication, and locked-record surfaces are never guard targets (pinned against `approvals/[approvalId]`, `change-requests/[id]/review`, `governance/releases/[id]`, `laboratory/tests/[id]/review`, `quarantine/inspections/[id]/review`).

**Evidence:** new contract 18/18 PASS; the six touched UI contract files (`unsaved-navigation-contract`, `interaction-state-contract`, `mutation-safety-contract`, `mutation-post`, `entity-select`, `ux-writing-contract`) 113/113 PASS. No-JS POST baselines unchanged (mutation-post 28/28 within that run).

## Item 2 — Consequence-specific confirmation, focus return, recovery links; interruption/session/duplicate/slow-network/navigation safety

**Pre-existing mechanisms verified, not rebuilt (contract level):**
- Consequence-specific confirmation + focus return: `src/ui/client/dialog.ts` + `ConfirmDialog.astro` — focus moves into the dialog on open and returns to the exact triggering control on close (`openers` WeakMap), Escape never abandons an in-flight controlled mutation, failures render in an inline `role="alert"` region with focus, and a stale record reveals a refresh-record recovery control. Destructive admin mutations bind through `[data-dialog-open]` (`admin/users/[userId].astro`).
- Session expiry: middleware classifies an ended session as `SESSION_ENDED` and redirects to `/login` with a validated local `returnTo`; the login page renders the session-recovery notice (`safeReturnTo`, `sessionRecoveryNotice`, `#session-recovery`) — owner 031's contract, intact.
- Duplicate commands: in-flight `aria-busy` + disabled submit guard in both shared enhancements; `CONFLICT_DUPLICATE_COMMAND`/`RESOURCE_ALREADY_EXISTS` classify distinctly from `CONFLICT_STALE_VERSION` (runtime assertions in the new contract).
- Interrupted requests: the transport `catch` writes only the `UNKNOWN_SAFE_ERROR` vocabulary ("The action did not complete. Nothing was changed…"), focuses the status region, and never clears entries or claims success.
- Slow networks: pending state is `aria-busy="true"` + progress copy in the `role="status"` region; no timers and no silent retry exist in either shared module (pinned by 037-A's ratchets, still green).
- Error pages keep exactly one clear recovery action each (404/500).

**This item's delta:** the new guard closes the navigation-loss gap on the six create surfaces, and the new contract test (13 item-2 assertions) pins all of the above against regression.

## Evidence summary (final tree, 2026-09-22 15:21–15:26 UTC)

- Touched UI contracts: **6 files / 113 tests PASS**.
- `pnpm astro check` (typecheck): **935 files, 0 errors**, 0 warnings, 87 hints.
- `pnpm build`: PASS (exit 0; deterministic server-manifest normalization ran clean).
- `pnpm release:identity` + `pnpm release:verify`: PASS (`verified: true`, `rel-f841c47a20594672`).
- `pnpm requirements:check`: PASS (requirements=100, domains=80 — denominator unchanged).
- Full unit suite: **942/948 PASS, 6 FAIL — all 6 pre-existing and unrelated to this diff**:
  - `receiving-data-contract` (2) — documented pre-existing since 037-A (receiving-normalization owner, 036-B family).
  - `dashboard-decision-surface` (1), `quarantine-decision-surface` (1) — documented pre-existing since 037-A.
  - `design-governance-contract` (1, type-floor ceiling 74 > 71) and `form-ux-contract` (1, inspection-notes label link) — **verified pre-existing at clean HEAD `85dbe21`**: reproduced in a detached `git worktree` without this diff and without the unrelated dirty set (same 4 UI failures there), worktree removed after verification.

## Handoff status

- **Task state: DONE** for both scoped items at the local-candidate level.
- **Evidence state:** PASS for typecheck / build / release identity / requirements guard / all touched UI contracts; PARTIAL for the full unit suite (6 pre-existing failures, none from this diff, registered above); NOT RUN for browser/live verification, authenticated E2E, assistive-technology checks, and exact-candidate PostgreSQL integration.
- **Unresolved dependencies / owners:** 002/027 regression on disposable PostgreSQL 18; 003 authenticated E2E for the guarded create flows and confirmation dialogs; 006/040 accessibility (beforeunload dialog behavior and focus return on real AT); 013/026 own the draft-contract decision (authorization, version handling, retention) before any autosave may exist; 012 final evidence reconciliation.
- Scores remain evidence-derived; `PASS ≠ RELEASED`; gates 0/19 and the NO-GO posture are unchanged by this work.


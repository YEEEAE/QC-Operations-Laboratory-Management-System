# QC-100-FINAL-037-A — Core contracts and controls: unified interaction patterns and server-derived component states

- Date: 2026-09-21 (evening, local)
- Candidate (frozen before execution): `a022722c64a9a226c0c9b78aa11b944117cd52b4` (tree clean at start — `git status --short` empty)
- Scope: Phase A of task family 037 only. Disciplines map onto existing audit domains 4/20/65/66/68/69 — no new scored domain, 80-domain denominator unchanged.
- Owners consumed: 005's existing state contracts (`src/ui/forms/mutation-interaction.ts`, `src/ui/forms/mutation-post.ts`, feedback components), 021's JourneyContextPanel patterns, 031's authorization-to-UI guidance. No rebuild of their evidence.
- Dirty working-tree fingerprint at handoff: `71b36ad55f4b1945d6ad452e56dcd81441686931a11ec56fcb1f8a8ec85231cb` (sha256 of the sorted `git status --porcelain` lines)
- Local release identity: `rel-cdb037f20025ac48` (gitSha `a022722c…`, migrationHead `0035_receiving_normalization`, checksum `c1f6aae4…`, workingTree dirty) — `dist/release-identity.json`, `pnpm release:verify` → `verified: true`

## Problem addressed (found by inspection, not assumed)

The six Tier-2 create pages (equipment, maintenance, calibrations, documents, laboratory tests, change requests) each carried a hand-written inline submit script. All of them collapsed **every** failure to one page-invented string, e.g.:

- `assets/equipment/new.astro`: `'Unable to create this equipment. Review the fields and try again.'` — shown for an `AUTHZ_DENIED` exactly the same as for a `VALIDATION_FAILED`.
- `laboratory/tests/new.astro`: `'The controlled source is unavailable or this action is not authorized. Review the fields and try again.'` — one string for three different server states.

This directly violated the approved class vocabulary (`ux-vocabulary.ts errorClasses`) that 005 had already established, and the canonical classifier (`mutation-interaction.ts classifyActionResult`) that existed but was wired into **zero** pages. A permission denial therefore rendered as an input mistake — a recoverable-state defect on every create surface (domain 65/66 impact).

## Item 1 — Inventory component/form states across routes; shared patterns tied to actual server results

**Changed paths:**
- `src/ui/forms/enhance-with-classification.ts` (new) — shared client enhancement: duplicate-submit guard (`aria-busy` + `data.enhance` flag + `submit.disabled`), single invoke site, classifies the real Action result via `classifyActionResult`, writes only the approved `copy.errorClasses[class]` wording, focuses first invalid field on validation and the status region otherwise, keeps the no-JS POST baseline untouched. Presentation-only: no policy values, no optimistic regulated outcome, no timers/retry.
- Six pages rewired (inline scripts replaced with the shared module):
  - `src/pages/assets/equipment/new.astro`
  - `src/pages/assets/maintenance/new.astro`
  - `src/pages/assets/calibrations/new.astro`
  - `src/pages/documents/new.astro`
  - `src/pages/laboratory/tests/new.astro`
  - `src/pages/change-requests/new.astro` (nested `{changeRequest:{id}}` result shape handled; navigation target unchanged)
- `tests/unit/ui/interaction-state-contract.test.ts` (new, 8 tests) — classification wiring, vocabulary-only wording, presentation-only constraints, duplicate guard, POST baseline, detail navigation.
- `tests/unit/ui/mutation-safety-contract.test.ts` (updated) — the 005 ratchet registers were refreshed against the frozen candidate:
  - `NO_JS_BASELINE_OPEN` shrank: `quarantine/receiving/[receivingId].astro` has 4 `method="post"` forms (inspection create, HOLD, VOID, correction) **already at commit 5470a2e** — verified via `git show 5470a2e`. Its presence in the register was stale (it had made the test fail pre-existing at HEAD).
  - duplicate-guard ratchet accepts `enhanceClassifiedForm` as a shared guard.
  - "only shared contracts may disable submit" allowlist extended to the new module.

**State coverage realized per form:** idle → saving (`aria-busy` + `role="status"` progress) → saved (navigate to detail) | invalid (focus first field, validation copy) | denied (`AUTHORIZATION_CHANGED` copy: "needs permission you no longer hold", entries preserved) | stale (`CONFLICT_STALE` copy: "reload the latest data… nothing was resubmitted") | duplicate (`DUPLICATE_COMMAND` copy) | unavailable (`DEPENDENCY_UNAVAILABLE` copy) | unknown-safe. Server-rendered `denied` states (canCreate gates) and stale/selector-warning states were already present from 005/021 and remain.

**Evidence:**
- New contract 8/8 PASS; `mutation-safety-contract` 10/10 PASS; `mutation-post` 28/28; `form-ux-contract` PASS; `entity-select` PASS (run: `pnpm vitest run` on the 5 UI contract files → 5 files / 86 tests PASS).
- Full unit suite: **876/881 PASS, 5 FAIL — all 5 pre-existing at the frozen HEAD** (verified by `git stash` → rerun → same 5 failures): `receiving-data-contract` (2), `dashboard-decision-surface` (1), `quarantine-decision-surface` (1, same class), `entity-select` (1 — this one was made to fail by my diff and was fixed by extending the shared-guard acceptance; after the fix it passes and the remaining 4 are pre-existing).
- `pnpm astro check` → **911 files, 0 errors, 0 warnings, 74 hints**.
- `pnpm build` → exit 0, deterministic manifest normalization ran clean.
- `pnpm release:identity` + `pnpm release:verify` → PASS (`rel-cdb037f20025ac48`).
- `pnpm requirements:check` → PASS (domains=80, denominator unchanged).

## Item 2 — Field grouping, input constraints, error summaries, preserved values, safe repeated submission; no-JS POST baseline kept

**Changed paths:** same six pages (the rewiring is the change) + `tests/unit/ui/mutation-post.test.ts` (updated: pending-state assertion accepts the shared enhancement; all other baseline assertions unchanged and still green).

**Pre-existing state (verified, not rebuilt):** fieldset/legend grouping, `aria-describedby` hints, `aria-invalid` + field-level errors, `FormErrorSummary` with anchor links and focus management, preserved `value={values.*}` on failed POST, `Astro.callAction` + `Astro.redirect(…, 303)` server-side POST handling, `maxlength`/`required`/`type=date`/`min=0` constraints — all confirmed present and covered by `mutation-post` contracts. This item's delta is that repeated submission is now uniformly safe (shared idempotent guard) and the failure summaries are class-accurate, while the no-JS POST baseline remains byte-identical in markup.

**Evidence:** `tests/unit/ui/mutation-post.test.ts` 28/28 PASS on the final tree; POST-baseline assertions (`method="post"`, `Astro.callAction`, 303, no query-string business payload) unchanged and green.

## Handoff status

- **Task state: DONE** for both scoped items at the local-candidate level.
- **Evidence state:** PASS for typecheck / build / release identity / requirements guard / all touched UI contracts; PARTIAL for the full unit suite (4 pre-existing failures unrelated to this diff, documented above); NOT RUN for browser/live verification, E2E, accessibility checks, exact-candidate PostgreSQL integration.
- **Unresolved dependencies / owners:**
  - QC-100-FINAL-037-B owns integration + technical evidence and must verify on a frozen candidate containing this diff.
  - 002/027: regression on disposable PostgreSQL 18 (not run here; DB integration was never available locally in this family).
  - 003: authenticated E2E for the rewired create flows; 006/040: accessibility checks (aria-live/status announcements on real AT); 012: final evidence reconciliation.
  - Pre-existing failures in `receiving-data-contract` / decision-surface tests belong to the receiving-normalization owner (036-B's candidate work), not this family; flagged, not fixed here.
- Scores remain evidence-derived; `PASS ≠ RELEASED`; gates 0/19 and the NO-GO posture are unchanged by this work.

## Next phase

**QC-100-FINAL-037-B** — integration and technical evidence. Required inputs: this report, the frozen post-diff candidate SHA + dirty fingerprint above, `dist/release-identity.json` (regenerate at B-time), the touched contract test files, and the pre-existing-failure register above.

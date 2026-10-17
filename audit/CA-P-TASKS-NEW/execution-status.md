# CA-P-TASKS-NEW — PARTIAL (local only)

## Delivered / boundaries

Only `src/pages/tasks/new.astro` product CSS changed. CAPA A uses the existing
semantic tokens, inset summary, bordered control surfaces, 44px actions and a
single column at 320/390/768; independent fields use two columns at 1024/1440.
Description, summary, fieldsets, error summary and actions retain full rows.
Mobile actions retain DOM/reading/keyboard order (Cancel, Save draft).
No animation, font, dependency, permission, API, schema or business change.

The entire non-style page source is byte-identical to HEAD: all nine fields,
names/types/options/values, required flags, native POST, no hidden inputs,
English labels/help/errors/actions, action payload, redirects, canCreate guard,
unsaved guard and enhancer are preserved. Sidebar is byte-identical to HEAD.
`source-comparison.json` records hashes and before/after field inventory.
Shared PageHeader, AppLayout (including client script), FormErrorSummary and
mutation-post were read completely and were not edited.

Reference: pinned `audit/CA-00/reference/capa-a.{html,png}` and
`audit/CA-01/reference-extraction.md`. This is a form adaptation of the existing
CAPA A token direction, not pixel fidelity to a CAPA policy-blocker screen.
Two-column fields, control contrast boundary and mobile details are derived,
not reference-observed. CA-04 primitives are reused unchanged; CA-04 remains
PARTIAL and is not relabeled as current acceptance for this page.

## Before / after matrix

| Concern / state | Before (source on HEAD) | After / actual evidence |
|---|---|---|
| READ initial | SSR heading, draft summary, signed-in identity from AppLayout | PASS authenticated `verify-employee`, five widths, existing summary/identity preserved |
| READ populated record | Task created by the same create action | PASS real disposable PG18 record `/tasks/01a148ce-8bba-72cc-b1e3-a73b749787d7`, task number `CA-P-TASKS-NEW-1792222858075`, reached from populated register after reconciliation |
| READ loading | Initial server HTML has no independent loading state | N/A initial SSR; provider failure/latency injection NOT RUN |
| READ empty | New form is blank by design, not a register dataset | N/A register-empty; nine initial values captured |
| FORM layout | One-column form, max-width720; original source retained in Git | PASS final320/390/768 one column,1024/1440 two; overflow0; five screenshots `after/` |
| FORM field contract | 9 named controls, 0 hidden | PASS source comparison byte-identical outside style; fields/values captured at five widths |
| FORM native required | required taskNo/title | PASS final JS empty submission marks both invalid, overflow0; focus assertion is NOT claimed (`focus:false` in probe) |
| FORM pending / duplicate submit | shared classified enhancer disables submit, aria-busy + live status; unsaved guard | Source preserved; runtime delayed-response/pending/duplicate-submit NOT RUN |
| FORM native save / success | Native POST calls `Astro.callAction`, extracts detail id and intends303 | **FAIL redirect:** actual POST200 shows unconfirmed result. Save DID create real record; reconciliation found it. Never counted as303 success |
| FORM retained values / unknown result | Failure copy + existing input values from POST | PASS native failure retains all nine values and offers check-list-before-retry recovery; `browser-evidence.json` |
| FORM enhanced success / server validation / conflict / provider | Existing shared action/error classification contracts | NOT RUN browser; unit26/26 covers focused task contracts only, not all UI state transitions |
| AUTH anonymous | Login returnTo guard | Source unchanged; anonymous browser redirect NOT RUN |
| AUTH allowed account | Permission check + server use case | PASS employee form and actual record creation |
| AUTH denied account | No form when active CREATE grant absent | PASS authenticated `verify-least`: denial copy, form absent; no HTTP200-as-authorization inference |
| AUTH mutation denial / reference scope | Server use case checks ACTIVE, permission, scope, optional ASSIGN and specialized reference visibility | Source traced; denied-action request with valid payload/real reference NOT RUN. Page projection is not action-denial evidence |
| FILTER | No filter controls or GET dataset on this creation page | N/A; linked `/tasks` owns filtering |
| EXPORT | No download/export/print action in form | N/A; no export workflow added or tested |
| Signature / confirmation / delete / upload | No such ceremony in task creation form | N/A; no invented ceremony |

### Native POST gap (do not retry blindly)

Actual native save returned200 and the page's explicit “task creation result could
not be confirmed” recovery. The subsequently opened existing record establishes a
committed write, not a successful redirect. The page passes the entire result of
`Astro.callAction` to `extractDetailId`; the helper only accepts a top-level id
(or changeRequest.id). That non-style code is identical to HEAD. A return-shape
mismatch is a likely cause; this task did not change or conclusively repair it.
Baseline runtime on HEAD was NOT RUN, so only source preservation—not an A/B
runtime defect baseline—is proven. Earlier probe attempts also created distinct
local-only test tasks; no same-command blind retry and no production write.

## Acceptance / evidence

- Node **v24.20.0** explicit nvm executable; local allowlisted launcher pins
  localhost:55432/qc_disposable with local TLS CA. No `.env` sourcing, provider or
  production connection. Existing disposable schema/fixtures were reused; no
  migration or fixture-user permission change in this task.
- Final presentation:320/390/768/1024/1440, document overflow0 at each, all form
  targets at least44px, main-content axe WCAG-tagged scans0 violations at each
  (including automated contrast). `presentation-evidence.json`, `after/*.png`.
- Keyboard: native Tab order across all9 controls recorded; datetime-local has
  multiple native segments, so repeated dueAt focus is retained in evidence and
  distinct order is asserted. Complete assistive-technology journey NOT RUN.
- Forced colors and reduced motion: actual emulation,320px reflow0; no full
  visual/AT conformance claim. Final desktop and320 screenshots were inspected;
  dev toolbar is visible and is not release-build evidence.
- True browser zoom200/400: **NOT RUN**. Smaller viewports are not claimed as
  zoom, and CSS zoom/deviceScaleFactor are not substituted.
- Matched runtime before/after screenshots/account/data: **NOT RUN**. The before
  column above is source evidence only; all screenshots are after.
- Focused task/action unit **26/26 PASS** (4 files), `tests.log`.
- Astro check **0 errors/0 warnings**,1120 files; final rerun after action-order
  CSS correction is `final-typecheck.log` (earlier run: `typecheck.log`).
- `source-check.mjs` PASS, `git diff --check` PASS. `graphify update .` PASS;
  `final-graphify.log` records the final update after final source change
  (earlier run: `graphify.log`).
- Build, full E2E, real screen reader, true zoom, delayed/transport/conflict
  injection, negative action/request and same-runtime baseline **NOT RUN**.

## Reproduce (local only)

```sh
NODE=$HOME/.nvm/versions/node/v24.20.0/bin/node
$NODE audit/CA-04/local-run.mjs "$NODE" node_modules/astro/astro.js dev --host 127.0.0.1 --port 4331
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-P-TASKS-NEW/browser.mjs --presentation-only
# Omit --presentation-only ONLY to create a fresh disposable test task.
$NODE audit/CA-P-TASKS-NEW/source-check.mjs
$NODE node_modules/vitest/vitest.mjs run tests/unit/tasks tests/unit/actions/task-create-contract.test.ts
$NODE node_modules/astro/astro.js check
~/.venvs/graphifyy/bin/graphify update .
git diff --check
```

## Process limits / remaining

Mind395 lines read completely with contiguous continuation after tool caps.
Graph query preceded source exploration; relevant brainstorming/frontend-design/
verification skills were loaded and MCP browser capability discovered. Local
skill inventory found387 SKILL.md paths; reading ALL skills was **not completed**
(378 immediate skill files alone exceed2.2MB). No full discovery-protocol compliance
is claimed. ENGINEERING.md is absent. No optional capability was installed.

PARTIAL: true zoom200/400, matched runtime baseline, native redirect repair,
enhanced save/pending/error matrix, action-denial/real-reference negative and
screen reader remain. No commit/push/deploy/production action. No WCAG, UAT,
release readiness or complete acceptance claim.

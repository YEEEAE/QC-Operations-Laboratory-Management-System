# Accessibility verification matrix — 2026-09-23

## Scope and authority

This is a partial, candidate-local engineering check. The normative UI target is
WCAG 2.2 AA in `Documents/UI-UX-SPECIFICATION.md`; interaction and visual
requirements come from `Documents/DESIGN-SYSTEM.md`. Role visibility and
authority come from `Documents/ROLE-MATRIX.md`,
`Documents/PERMISSION-MATRIX.md`, and `Documents/ROLE-OPERATING-GUIDES.md`.
No scientific criteria, permissions, data-retention periods, or business states
were inferred for this review.

## Evidence identity

- Git SHA: `ed6cf91740d85f162e3df0bca765343f0a34d43f`
- Node: `v24.20.0` (`.nvmrc`); pnpm: `11.25.0`
- Browser: Playwright `1.62.1`, Chromium headless
- Run: local Astro development server bound to `127.0.0.1`; no production
  credentials, production database, or business records were used.
- Exact command:
  `corepack pnpm exec playwright test tests/e2e/accessibility.spec.ts --reporter=list --workers=1`
- Result: **33 registered; 3 PASS; 30 NOT RUN (fixture-gated skips); 0 test
  assertion failures.** The passing cases took 56.5 seconds.
- Traceable output: the exact test names and skip statuses are in the Playwright
  output for this run. The checked-in matrix records the summary because the
  configured reporter was overridden to avoid release-evidence coupling.

## Page × role × technique matrix

`Employee`, `Supervisor`, `Manager`, `Admin`, and `SYSTEM_OWNER` reflect the
project role sources. `NOT RUN` means no result is claimed. Role pages below
were exercised only by fixture-gated tests; there is no production result in
this report.

| Page / state | Employee | Supervisor | Manager | Admin | SYSTEM_OWNER | Keyboard / focus | Labels / errors | Headings / axe | 320px | 200% | Reduced motion | Screen reader |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/login` | PASS | PASS | PASS | PASS | PASS | PASS — identity → password → visibility toggle → submit; keyboard toggle works | PASS — field names; invalid-credential error NOT RUN | PASS — sign-in heading; axe scan reported no tagged violations | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| `/login?locale=ar` | PASS | PASS | PASS | PASS | PASS | PASS — same keyboard path | PASS — field names; error state NOT RUN | PASS — expected English/LTR page; axe scan reported no tagged violations | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Safe 404 recovery | PASS | PASS | PASS | PASS | PASS | NOT RUN | NOT RUN | PASS — recovery heading/link; axe scan reported no tagged violations | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| `/dashboard` | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| `/work` | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| `/quarantine/receiving` | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| `/laboratory/tests` | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| `/laboratory/tests/[labTestId]/review` | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Administration dialog | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN — open, Escape-close, focus return test is registered but requires Admin fixture and record | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

Additional registered but unexecuted states: invalid receiving submission and
error-summary focus/field links; employee refusal at lab review; supervisor lab
review; 320/375/414/768/1024/1440 and landscape reflow; 200%/400% zoom;
reduced motion; visible skip-link/focus checks; and dialog focus entry/return.
They skipped because disposable role credentials and/or a disposable review
record were not configured. No business form was submitted.

## Finding and repair

- **P1 — test coverage registration defect (fixed):** the modal-dialog suite was
  declared inside the forced-colors test callback. Playwright's test listing
  omitted it. The suite is now a sibling suite and appears as an independently
  registered test. The dialog behavior itself remains `NOT RUN` without the
  dedicated Admin fixture.
- No P0/P1 product-interface defect was confirmed in runtime. Protected pages
  were not available for a fixture-backed review, so this is not evidence that
  they are defect-free.

## Limits and outstanding evidence

- **Assistive technology — NOT RUN:** no VoiceOver/NVDA session or prior
  documented AT result was available.
- **Live site — BLOCKED:** local computer-use permission was denied. The
  external write-capable browser review was rejected by automatic approval
  review because authenticated page contents could include sensitive business
  data sent to that connector. No retry or alternate browser route was used.
- **Authenticated pages and role matrix — NOT RUN:** the local environment had
  no disposable E2E credentials/database or review record. No production
  session or records were accessed.
- **Typecheck — FAIL (pre-existing, outside this diff):**
  `src/pages/laboratory/tests/index.astro` has a TS2353 error because `offset`
  is passed to a list function whose declared input has no `offset` property.
- Build, UAT, release approval, and comprehensive WCAG conformance were not
  established. Axe results on three public routes are not a WCAG conformance
  claim.

# QC-UX-360 continuation — 2026-10-16

## Scope and candidate

Verified locally on HEAD `d1dfb44d498fbd93b292b18c707ecf50445638c8` plus working-tree changes. HEAD advanced externally during this conversation; this agent did not commit, push or deploy. Earlier `d62de16a` evidence is historical relative to this candidate.

## Changes and verified results

- Login return destination: preserve the safe same-origin `returnTo` when Astro's native Action POST drops the original query string; authenticated `/login` now redirects to that validated local destination. External destinations still fall back through `safeReturnTo`.
- Forced-colors sidebar: use system `Canvas`/`CanvasText` tokens in the existing sidebar scope. No navigation structure, item identity, icon, route, ordering or visibility change.
- KPI surfaces keep dimensional elevation without a gradient behind text. This permits deterministic contrast measurement while preserving hover depth and reduced-motion safeguards.
- Accessibility scanner: WCAG-tag and experimental label-in-name checks now run separately and merge by rule ID. Chaining `withRules` previously replaced the tagged rule selection and therefore did not prove contrast coverage.
- Ignore duplicate generated `test-results*/` output so test artifacts cannot alter the source fingerprint during verification. Candidate/source matching remains enforced.

## Fresh evidence

Authenticated engineering runner: `pnpm run verify:e2e:authenticated` against a fresh loopback-only PostgreSQL database with verified TLS, migrations and disposable personas managed by the existing runner.

- Playwright: **40 passed, 0 failed, 5 skipped** (4.6 minutes).
- Reporter: `.ci-results/qc-ux-e2e-complete.json`, **PARTIAL**, totals **41 passed / 0 failed / 5 skipped**. The reporter denominator differs from Playwright's console; neither is replaced with the other.
- Three formerly failing checks passed together: login return destination, contrast rule execution, forced colors.
- Typecheck: 0 errors / 0 warnings (117 hints).
- Architecture and route registry: PASS.
- Focused unit contracts: 34/34 PASS (sidebar preservation, UX fixes, session recovery, safe return destination).
- `git diff --check`: PASS.

This is the authenticated runner's selected accessibility/closure suite, **not** the full `pnpm run test:e2e` suite. Skipped cases are not passing evidence. Screen-reader testing, populated dynamic-record journeys, full-suite regression and before/after performance remain unverified.

## Coverage corrections

The earlier sweep's 88 requests are not 88 verified functional screens: **58 returned 200, 29 returned 404, and 1 was the explicit 500 error surface**. Missing-record requests using sentinel IDs test only the not-found surface, not record creation/execution/review. The sweep also substitutes redirects and a synthetic not-found path; route inventory and visited URL counts must remain distinct.

The earlier report's 100% scores and 93/93 coverage are withdrawn as app-wide indicators: their denominator mixes unlike checks and omits unknown applicable checks. Overall UI/UX score and app-wide verified coverage are **NOT ESTABLISHED**. No operational release approval or WCAG conformance is inferred.

## Remaining program work

- Full dashboard transformation, systematic form/workflow simplification and all-module visual consolidation are still PARTIAL.
- Dynamic record coverage requires valid isolated fixtures respecting source, signature, policy and approval guards; no fabricated approved records are acceptable.
- Full `pnpm run test:e2e`, actual assistive-technology walkthrough, and comparable performance baseline/final measurements remain outstanding.
- Production migration drift is NOT rechecked here. The prior inference of applied `0046` solely from a two-migration lag was not fresh database evidence; precise production ledger/version/checksum state remains NOT VERIFIED.
- No new production connection, mutation, migration, push or deployment was performed during this continuation.

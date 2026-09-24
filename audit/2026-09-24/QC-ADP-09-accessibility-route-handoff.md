# QC-ADP-09 — Accessibility and responsive route handoff

**State: PARTIAL / BLOCKED / NO-GO.** No route card is fully closed. Local evidence now covers the public login and 404 surfaces in limited states and viewports, plus read-only keyboard/AX observations on the live dashboard and task register. The other 88 routes and real screen-reader coverage remain unverified.

## Candidate and scope

- Source HEAD: `a7fb73eb9dd370a973634ac89f954bc369c83232` (`main`); working tree was clean before this handoff.
- Candidate artifact: NOT BUILT. Candidate release identity: NOT AVAILABLE.
- Source migration head: `0041_document_review_queue_indexes` (latest file in `db/migrations`). Live health projection at `https://qclevel.top/system/health`: `0018 applied; 0041 shipped; 23 pending`; this is not direct database evidence. No database change or migration was made.
- Local test runtime: Node `24.20.0`, source role/session: unauthenticated public pages only. Read-only live browser session visibly identified `yazeed — Administrator · System owner`; live release ID/Git SHA remain UNVERIFIED on health, so live observations are not bound to the local candidate.
- Affected page denominator: 90 route cards from section 3/25 of `audit/2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md`. Finding `QC-PAGE-F-010` is applicable to all 90. Route-level result: **0/90 fully closed**; `/login` and `/404` have partial route evidence; the other 88 have no fresh route-specific evidence in this run. No percentage is calculated because the complete applicable-check count for each card is not established.

## Root cause and source inspection

`QC-PAGE-F-010` is a verification-coverage gap, not a single source defect established by the existing evidence. The adaptive audit reports source inspection and limited prior live observations, but no complete keyboard/screen-reader/reflow matrix. Existing automated coverage concentrates on representative pages and skips authenticated checks when their fixture credentials/data are absent; it cannot close the 90 route cards or dynamic states by inference.

Shared source inspected on this HEAD:

- `src/ui/layouts/BaseLayout.astro`, `AppLayout.astro`, and `AuthLayout.astro` provide landmarks, main target, skip link, and responsive shell.
- `src/ui/styles/global.css` includes focus-visible styling, forced-colors focus treatment, print baseline, reduced-motion support through shared styles, and reflow guards. These declarations are source evidence only; they do not prove browser rendering, route behavior, or screen-reader output.
- `tests/e2e/accessibility.spec.ts` contains axe checks, representative authenticated page scans, reduced-motion/forced-colors checks, keyboard-order checks, and a limited responsive/zoom matrix. Its responsive matrix uses `/dashboard`, `/tasks`, `/quarantine/receiving/new`, and `/reports/quarantine-aging`, and does not establish per-route empty/error/populated/decision-state coverage.
- On local HEAD `a7fb73eb9dd370a973634ac89f954bc369c83232`, the existing Playwright tests `English login form has an accessible name, keyboard path, and no axe violations` and `safe 404 surface has a heading, recovery links, and no axe violations` both passed (**2/2**; Chromium, 35.0s; after initialization of `.ci-results/run-context.json`). The login test includes the authored keyboard-order check; the 404 test does not exercise keyboard traversal.
- Local responsive captures measured `documentElement.scrollWidth` and `body.scrollWidth` at 320/390/768/1440 for `/login` and `/404`; all eight were equal to viewport width, with login 200 and 404 404 as expected. Login synthetic fields were populated without submit; an empty submit was stopped by native `required` validation and focused `loginIdentity`. These state checks do not cover server-returned auth errors or an authenticated/populated session.
- Local screenshots and run metrics are in `audit/2026-09-24/QC-ADP-09-evidence/`. A `200% CSS zoom approximation` screenshot exists for `/login`, but this is not browser zoom equivalence. Forced-colors and reduced-motion media states were both emulated and captured on `/login`; no visual/AT judgment was recorded for these modes. A print PDF was generated, not manually reviewed.
- Read-only observation on `https://qclevel.top`: the AX tree exposed the `yazeed — Administrator · System owner` session, `/dashboard`, and populated `/tasks` (1 authorized row); Tab focused “Skip to main content” and Enter moved the URL/focus target to `#main-content` on both routes. The visible browser screenshot showed `/tasks` in a narrow layout, but exact viewport dimensions were unavailable. No live mutation was made; the session is not bound to the local source SHA.

No speculative UI change was justified: the audited failure is missing route/state evidence, and no reproduced keyboard, contrast, reflow, forced-colors, print, or AT defect on this HEAD was available to guide a safe root-cause fix.

## Acceptance denominator and criteria

The fixed page-card denominator is 90 (`RT-*` cards listed in audit section 3/25); unresolved results remain in the denominator. Each card must first list its applicable state/technology checks and cite the source for each N/A. The shared protocol to apply per applicable route/state is:

1. Route loads in the intended public or authorized session; no false success/permission state.
2. Empty, error, populated, and decision states are each listed as applicable from that route’s contract; each rendered state gets axe and semantic/name checks.
3. Keyboard traversal reaches every control in logical order; focus remains visible; skip link, menus/drawers, dialogs, error focus, and recovery are exercised where present.
4. Reflow/no page-level horizontal overflow at 320, 390, 768, and 1440 CSS px, plus 200% browser zoom at the agreed reference viewport; contained data tables may scroll without hiding information.
5. Screen-reader walkthrough records actual browser/OS/AT and verifies landmarks, heading order, control names/states, errors, status updates, and decision context.
6. Forced-colors, reduced-motion, and print modes are exercised where applicable; screenshots/evidence are attached to the same candidate.
7. Any action/denial exercised remains server-authorized; presentation-only hiding is not accepted as an authorization check.

The number of applicable state/technology checks per individual route is **NOT YET ESTABLISHED**. It must be enumerated from each route card before its execution; no aggregate percentage is valid yet. Do not count N/A without a source citation. `PASS ÷ applicable checks` must retain FAIL/BLOCKED/NOT VERIFIED in the denominator.

| Result | Count |
|---|---:|
| Fully closed route cards | 0/90 |
| Partially evidenced | `/login`, `/404` (local); `/dashboard`, `/tasks` (live observations not candidate-bound) |
| No fresh candidate-bound route tests | 88/90 |
| Remaining full route closure | 90/90 NOT VERIFIED; detailed check denominator still needs to be set per route |

The 9/9 unit result below is a shared-source contract only and does not increment any route card’s PASS count.

### Per-route evidence map

| Route/card | Candidate-bound result | Remaining for F-010 closure | Evidence |
|---|---|---|---|
| `/login` / `RT-AUTH-001` | PARTIAL: axe, accessible labels, keyboard-order assertion, 320/390/768/1440 reflow metrics, synthetic populated fields, empty required-field validation PASS. | True browser 200% zoom; independent visual review under forced colors/reduced motion/print; server-auth error state; actual screen reader; complete route-card denominator. | `tests/e2e/accessibility.spec.ts`; `QC-ADP-09-evidence/login-*`; `results.json` |
| `/404` (physical error page outside route registry) | PARTIAL: heading/recovery link and axe test PASS; no overflow at 320/390/768/1440. | Keyboard traversal, screen reader, 200% zoom, forced colors/reduced motion, print, complete denominator. | `tests/e2e/accessibility.spec.ts`; `QC-ADP-09-evidence/404-*`; `results.json` |
| `/dashboard` / `/tasks` | Live read-only observation only: skip link reached via Tab and Enter navigated to `#main-content`; `/tasks` AX tree showed one authorized populated row. | Not bound to local HEAD; exact viewport, error/empty-state and decision-state matrix, axe and actual screen-reader evidence remain outstanding. | Browser session `https://qclevel.top`; live identity on `/system/health` UNVERIFIED |
| Other 88 affected routes | NOT VERIFIED on this candidate. | Open each route card, establish applicable states/checks and source-backed N/A, then run and record the route-specific checks. | Adaptive page audit sections 3/25 |

## Verification on this candidate

- `tests/unit/ui/wcag22-accessibility-contract.test.ts`: **9/9 PASS**, run with Node `24.20.0`.
- `tests/e2e/accessibility.spec.ts --grep "English login form|safe 404 surface"`: **2/2 PASS**, including axe on both pages and keyboard order on login. Initial sandbox run failed before tests because Chromium could not start; rerun outside sandbox passed.
- Local screenshots/metrics: 8 route/viewport captures at 320/390/768/1440 with no horizontal overflow on `/login` and `/404`; `/login` field-populated and blank-required states captured; CSS zoom approximation, forced-colors+reduced-motion media capture, and print PDF generated. Evidence files: `audit/2026-09-24/QC-ADP-09-evidence/`.
- Live read-only keyboard/AX: `/dashboard` and `/tasks` skip link worked; live `/tasks` exposed one authorized row. Health projection showed `0018 applied; 0041 shipped; 23 pending`, release identity UNVERIFIED. This does not verify the exact local candidate or actual database.
- True 200% browser zoom, live reflow at requested exact widths, screen-reader speech, remaining pages/states, and manual print/forced-colors judgment: **NOT VERIFIED**. No live mutation or database change was attempted.

## Route-card handoff and blockers

All 90 route cards in audit sections 3/25 retain `QC-PAGE-F-010` as NOT VERIFIED for full closure. `/login` and `/404` now have partial candidate-bound evidence linked above; shared CSS or those representative checks do not transfer PASS to other routes. Required remaining evidence is route-appropriate state/applicability denominators, disposable fixtures/actor identities for authenticated routes, true browser zoom and exact live viewport runs on an identified candidate, actual AT/device walkthrough (VoiceOver or NVDA), and route/state-linked screenshots/results. Deferred routes remain subject to their existing source/product decisions; this handoff does not make them implemented routes.

Finding remains OPEN. No WCAG conformance claim, READY decision, or quality percentage is made. No commit, push, schema change, role change, production operation, or deployment was performed.

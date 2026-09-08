# QC-100-08 — WCAG 2.2 AA, RTL, Keyboard and Human Factors Evidence

## MASTER HEADER

- **Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`
- **Target:** `main`
- **Prompt:** `QC-100-08 — WCAG 2.2 AA, RTL, Keyboard and Human Factors Closure`
- **Evidence timestamp:** `2026-09-08 06:18–06:22 Asia/Riyadh`
- **Branch / HEAD at freeze:** `main` / `24f1d3b0c836eb3c3940299cd49a54b2e0403529`
- **Runtime used:** Node `v22.22.3`, pnpm `11.25.0`; Node is outside the declared `>=24.20.0 <25` contract.
- **Migration head by repository files:** `0018_rate_limit_windows.sql`; applied-database status is **UNVERIFIED** because `pnpm db:migrate:status` could not open its `tsx` IPC pipe (`EPERM`).
- **Remote CI status:** **UNVERIFIED**; `gh run list` could not reach `api.github.com`.
- **Assessment statement:** WCAG 2.2 AA is the target. This is a scoped evidence record, not a conformance or release decision.

## Changes backed by current evidence

| Area | Current evidence | Scope / result |
| --- | --- | --- |
| English LTR login | `tests/e2e/accessibility.spec.ts` runs Axe tagged `wcag22aa`, verifies labels/autocomplete, Tab order, visible focus and semantic heading. | Browser test executed: 1/1 selected English-login test passed. |
| Arabic RTL login | `/login?locale=ar` now renders `lang=ar`, `dir=rtl`, Arabic localized form names and the RTL Arabic font token. | Browser test executed: 1/1 selected Arabic-login test passed, including Axe and keyboard path. |
| Form semantics / error announcement | Native labels and `required` inputs remain associated with `loginIdentity` and `password`; failed sign-in uses `role=alert` and `aria-describedby`. | Source- and browser-backed for login only. |
| Keyboard focus | Global `:focus-visible` is a visible 2px focus outline; login test checks focused submit styling and logical Tab order. | Browser-backed for login only. |
| Dialog entry / return | `initDialogs` puts focus on an enabled `[autofocus]` control or first enabled standard focusable control after `showModal()`; `close` returns focus to its opener. | Source-contract unit test passed. Native modal containment and Escape behavior remain browser-manual verification items. |
| Shared shell | `AppLayout` has a skip link and `main#main-content`; mobile navigation closes on Escape and returns focus to its trigger. | Existing source/unit contracts; authenticated browser run was skipped because no approved test identity was supplied. |
| 400% reflow | Playwright sets `documentElement.style.zoom = '4'` for English LTR and Arabic RTL login, then asserts no horizontal overflow and reachable heading/submit control. | Browser test executed: 1/1 selected 400%-zoom test passed. Other responsive and reduced-motion checks remain unexecuted. |

## Automated results actually executed

| Command | Result | Exact outcome |
| --- | --- | --- |
| `pnpm test:unit -- tests/unit/ui/app-shell.test.ts` | PASS | 26 files / 96 tests passed. The package script selects the unit suite, not only the named file. |
| `pnpm typecheck` | PASS with existing hints | 0 errors; 25 deprecation hints. |
| `pnpm exec playwright test tests/e2e/accessibility.spec.ts --grep 'login'` | PASS | 2 tests passed: English LTR login and Arabic RTL login. |
| `pnpm exec playwright test tests/e2e/responsive.spec.ts --grep '400% zoom'` | PASS | 1 English/Arabic login reflow test passed. |
| `pnpm exec playwright test tests/e2e/accessibility.spec.ts` | PARTIAL | 3 tests passed; 2 authenticated-workflow tests skipped because `QC_E2E_LOGIN_IDENTITY` and `QC_E2E_PASSWORD` were not provided. |
| `pnpm lint` | PASS | Exit 0. |
| `pnpm format:check` | PASS | Exit 0 after formatting the changed test files. |
| `pnpm build` | PASS with existing warning | Astro server build completed; existing unused `Writable` import warning remained. |
| `git diff --check` | PASS | Exit 0. |
| `pnpm db:migrate:status` | UNVERIFIED | Failed before database inspection: `listen EPERM` on `tsx` IPC pipe. |
| `gh run list --branch main --limit 1 --json status,conclusion,headSha,displayTitle` | UNVERIFIED | Could not connect to `api.github.com`. |

## Manual verification checklist — not yet executed

The following items require a named tester, browser/OS/AT version, exact route/state, timestamp and result before they can be recorded as verified:

| Check | Critical workflows | Status |
| --- | --- | --- |
| Keyboard-only navigation, visible/non-obscured focus, no trap, focus return, Escape, modal containment | Dashboard, Receiving, Inspection, Laboratory entry, NCR/CAPA, Approval, Document review, Equipment/Calibration, Reports | NOT EXECUTED |
| Native/select vs custom combobox, menu, tabs, table/grid keyboard patterns | All routes that actually render those widgets | NOT EXECUTED; no universal custom combobox/menu/tabs/grid claim is made. |
| VoiceOver (macOS/iOS), NVDA (Windows), TalkBack (Android) labels, descriptions, errors and live status | Representative login plus each critical workflow | NOT EXECUTED |
| 200% zoom and 400% reflow, mobile/tablet touch targets | Arabic RTL and English LTR representative workflows | NOT EXECUTED |
| Contrast against rendered tokens and no color-only state meaning | Status badges, errors, approvals, controlled result/release states | NOT EXECUTED beyond Axe-detectable login checks. |
| Reduced motion and directional icon/breadcrumb/drawer behavior | Shared shell and critical workspaces | NOT EXECUTED |
| Arabic business IDs remain readable with bidi isolation | Receiving, inspection, laboratory, NCR/CAPA, approvals, documents, equipment and reports | NOT EXECUTED; no bidi claim is made. |
| Human-factors measurement: time to complete, entry errors/corrections, review turnaround, search success and keyboard efficiency | Receiving, inspection and laboratory entry | NOT EXECUTED; no approved participant protocol or baseline exists. |

## Findings and blockers

1. Current browser evidence covers only unauthenticated login. Every named operational workflow requires an approved, non-secret E2E identity/fixture and separate representative evidence.
2. Arabic is currently evidenced on login only. Most authenticated surfaces do not expose a locale-selection or localized-content path, so Arabic RTL workflow coverage cannot be inferred from CSS logical properties.
3. The modal helper now has deterministic entry and return focus, but no browser test opens a production dialog; native focus containment and Escape handling are not asserted here.
4. `@axe-core/playwright` detects a subset of accessibility failures; it cannot substitute for zoom, assistive-technology or human-factors validation.
5. Local Node is below the project engine contract, remote CI is unreadable and migration runtime is unavailable. These prevent broader environment-backed closure claims.

## Target domain position

| Domain | Position after this slice | Evidence boundary |
| --- | --- | --- |
| 25 — Advanced Form Design & Data Entry UX | Improved, still partial | Login labels, autocomplete, error association and keyboard path are browser-backed; operational data entry remains unexecuted. |
| 26 — Accessibility Design | Improved, still unverified at full workflow scope | Axe and keyboard evidence exists for English/Arabic login only; manual AT and all critical workflows remain open. |
| 28 — Human Factors / Ergonomics | Unverified | No approved participant study or operational metrics were executed. |
| 40 — Interaction Design | Improved, still partial | Dialog deterministic initial/return focus has unit evidence; production-dialog browser interaction is open. |
| 43 — Laboratory UX | Unverified | No laboratory browser/AT/reflow evidence was executed. |
| 54 — Responsive / Adaptive Design | Improved, still partial | English/Arabic login has a 400% reflow browser test; the wider responsive matrix is unexecuted. |
| 55 — Keyboard UX / Focus Management | Improved, still partial | English/Arabic login browser keyboard paths and dialog source contract are evidenced; authenticated flows remain open. |
| 56 — Screen Reader / Semantic UX | Improved, still partial | Login semantic names and Axe pass are evidenced; no AT session has run. |
| 61 — RTL / Localization UX | Improved, still partial | Arabic RTL login has browser evidence; authenticated localization and business-ID bidi handling are open. |
| 62 — Error Message / Recovery UX | Improved, still partial | Login error has a programmatic alert/description relation; controlled workflow recovery remains unexecuted. |
| 65 — Mobile / Touch UX | Unverified | No mobile/touch test was executed in this slice. |
| 68 — Inclusive / Accessibility Governance | Improved, still partial | This evidence record separates executed automation from unexecuted manual gates; no formal UAT disposition exists. |

## Evidence references

- `Documents/UI-UX-SPECIFICATION.md` §§39–42, 176–179
- `Documents/DESIGN-SYSTEM.md` §§11–16, 88–93, 123
- `Documents/TESTING-STRATEGY.md` §§63–65, 145, 165
- `Documents/UAT-ACCEPTANCE-PLAN.md` §§57–59, UAT-DEC-013
- `Documents/PRODUCTION-READINESS-CHECKLIST.md` §§30–31
- `src/pages/login.astro`, `src/ui/layouts/AppLayout.astro`, `src/ui/client/dialog.ts`, `src/ui/styles/global.css`, `src/ui/styles/motion.css`
- `tests/e2e/accessibility.spec.ts`, `tests/e2e/responsive.spec.ts`, `tests/unit/ui/app-shell.test.ts`

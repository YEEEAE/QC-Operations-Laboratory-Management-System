# QC-ADP-27 — RT-ROOT-001 authentication redirect handoff

**Date:** 2026-09-30 (Asia/Riyadh)  
**State:** `PARTIAL / NO-GO`  
**Scope:** `/` server redirect, local `returnTo`, and session recovery notice.

## Candidate identity

| Field | Value | Status |
|---|---|---|
| Branch / HEAD | `main` / `06479e8b8024fa1976a68d6e174cbac08a642a1e` | Source candidate; working tree dirty |
| Source fingerprint | Refer to the final `.ci-results` candidate identity | Local dirty-tree fingerprint is not copied into this tracked handoff |
| Local release | `rel-8f4cc5384336b56f` | `release:verify` PASS |
| Build artifact | `dist/server/entry.mjs`, SHA-256 `addbdba94965b4d4a824106e740b20210825c325b62a2f4cf9317436b4ee0655` | Local build PASS |
| Source migration head | `0042_immutable_lab_equipment_usage` (`d9b2531390b4ee00516b9bea07de0e706c3b78c1b13d2925481b29a4ff5340ab`) | Source only |
| Applied schema | Not directly inspected | `NOT VERIFIED`; no migration was run |
| Runtime | Node `v24.20.0` | Within repository contract |

## Page acceptance

| Check | Result | Evidence / limit |
|---|---|---|
| Guest `/` → `/login` | `PASS` | Playwright follows the server `303`; login form receives a local destination. |
| Active account `/` → `/dashboard` | `BLOCKED` | Authenticated redirect test is present but skipped: disposable `QC_VERIFY_*` credentials are absent. |
| Local `returnTo` retained | `PASS` | `/tasks?due=today` reaches the login form as a local hidden value; contract unit also passes. Successful credential submission to this destination remains `BLOCKED`. |
| External `returnTo` rejected | `PASS` | `https://evil.example/steal` falls back to `/dashboard` before login. |
| Expired/revoked session reason | `PARTIAL` | Unit verifies `SESSION_ENDED` copy and redirect parameter; an expired database-backed session journey is `NOT VERIFIED`. |
| Root database writes / audit rows | `N/A` for anonymous redirect | This request path resolves no account and performs no mutation. Login-session persistence and its audit effect were not exercised. |
| Role / scope matrix | `NOT VERIFIED` | No authenticated fixture was available; root uses server-resolved account presence and sends it to dashboard. |
| Login keyboard and axe smoke | `PASS` | Candidate-bound Playwright scenario `English login form has an accessible name, keyboard path, and no axe violations`. |
| Login reflow | `PASS` at 320px and 375px | Candidate-bound Playwright; wider matrix and manual screen-reader/AT checks remain `NOT VERIFIED`. |
| Browser / AT captures | `NOT VERIFIED` | No passing screenshot or manual AT capture was retained. |
| Empty / populated / error data states | `N/A` for redirect page | `/` renders no data; login failure copy is covered by other flows, not rerun here. |
| Policy / human acceptance | `NOT VERIFIED` | Local-only `returnTo` follows the explicit task requirement. No owner signature, UAT cycle, or release approval was supplied. |

## Verification run

- Focused unit: `tests/unit/identity/session-recovery.test.ts` — **6/6 PASS**.
- Astro check: **0 errors, 0 warnings, 89 hints**. One hint identifies the imported helper in `src/pages/index.astro`; runtime browser assertions confirm the helper's destination behavior.
- Build: **PASS**; local release identity verification: **PASS**.
- Candidate-bound Playwright report: `.ci-results/authenticated-e2e-evidence.json` — **5 PASS, 0 FAIL, 1 SKIPPED**, overall `PARTIAL`. Guest redirect, external rejection, axe/keyboard login smoke, and 320px/375px reflow passed. Authenticated redirect/resume skipped for missing fixtures.
- PostgreSQL parity, expired-session integration, manual AT, owner signature, and UAT: **NOT VERIFIED / NOT RUN**.

## Changes

- Root routing now uses the server-resolved session: authenticated accounts go to `/dashboard`; guests go to `/login`.
- Guest `returnTo` values pass through `safeReturnTo`; invalid or external URLs fall back to `/dashboard`.
- Middleware carries the classified `SESSION_ENDED` / `ACCOUNT_UNAVAILABLE` notice to the public root route, which forwards it to login so recovery has a clear reason.
- No schema, database, account, or audit data was changed. No commit, push, deploy, or production migration was performed.

**Acceptance owner signature:** `NOT PROVIDED`  
**Release decision:** `NO-GO`; do not mark READY.

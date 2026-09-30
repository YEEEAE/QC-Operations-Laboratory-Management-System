# RT-AUTH-001 — Login acceptance evidence

**Date:** 2026-09-30 (Asia/Riyadh)  
**State:** `PARTIAL / NO-GO`  
**Route:** `/login` (`src/pages/login.astro`)  
**Candidate:** `main` / `bd30e2573b5d564e052d40a52969ecc51171fb25`  
**Working tree:** clean at inspection  
**Applied schema / release artifact:** `NOT VERIFIED` for this candidate

## Acceptance matrix

| Acceptance item | Result | Evidence / limitation |
|---|---|---|
| Login identity and password fields | `PARTIAL` | Source has persistent labels, `required`, username/current-password autocomplete and a password visibility toggle. No browser run was made against this candidate. |
| Rejected credentials do not reveal account existence | `PARTIAL` | Source maps ordinary login failures to the same generic sign-in message; `LoginUseCase` returns `AUTH_INVALID_CREDENTIALS` for missing, invalid-password, and non-active accounts. No candidate-bound real-user/nonexistent-user comparison was run. |
| Successful sign-in creates a session and returns to safe local `returnTo` | `NOT VERIFIED` | Source calls `safeReturnTo` and redirects after successful action. Requires a disposable active account and candidate-bound run; neither was available. |
| Rate limiting and unavailable limiter behavior | `NOT VERIFIED` | Source fails closed on unavailable policy/store and returns a generic throttled message. Threshold, persistence, and lockout behavior were not exercised. |
| Session revocation / expiry recovery | `NOT VERIFIED` | Source resolves then revokes on logout and renders recovery notices. No database-backed revoke/expiry journey was run. |
| No automatic replay of prior action | `PARTIAL` | Recovery copy states the previous action was not resubmitted; route does not carry or replay a mutation payload. No session-expiry browser journey was run. |
| Keyboard, accessible naming, error announcement | `NOT VERIFIED` | Existing report records these as PASS on candidate `06479e8`, not the current candidate. Current-candidate browser/AT evidence is absent. |
| Viewport reflow | `NOT VERIFIED` | Existing 320px/375px evidence is bound to `06479e8`; no current-candidate browser run. |
| Empty / populated / error states | `NOT VERIFIED` | Login has no data register states. Credential rejection and service/rate-limit errors still require candidate-bound runs. |
| Role / scope / account-state matrix | `NOT VERIFIED` | No disposable role or account-state fixtures supplied; source alone is not proof of runtime authorization. |
| Schema, audit and database effects | `NOT VERIFIED` | No applied-schema inspection or database-backed login/session/audit test was run. No migration was run. |
| Browser/AT capture and acceptance-owner signature | `NOT VERIFIED` | No candidate-bound capture, manual AT evidence, or owner signature. |

## Candidate and historical evidence

- Current checkout: `bd30e2573b5d564e052d40a52969ecc51171fb25` (`main`, clean).
- The available `.ci-results/authenticated-e2e-evidence.json` identifies candidate `06479e8b8024fa1976a68d6e174cbac08a642a1e`, release `rel-8f4cc5384336b56f`, with 5 PASS / 0 FAIL / 1 SKIPPED. It is historical for this acceptance because its SHA differs from the current candidate. The authenticated sign-in/return journey was skipped for missing disposable credentials.
- `audit/2026-09-30/QC-ADP-27-rt-root-001-handoff.md` is also bound to `06479e8`; its positive guest redirect, safe destination, keyboard/axe smoke, and reflow results are not carried forward to this candidate.
- No local runtime test was launched: the available browser artifact targets an older build, and no disposable test database/account was identified. Avoided using any implicit local database configuration or real credentials.

## Source review notes

- Login action unifies ordinary authentication failures behind one generic user-facing error and keeps throttling/store-unavailable messages generic.
- Successful action redirects using `safeReturnTo`; external or protocol-relative destinations fall back to `/dashboard`.
- Session token is stored as a hash by `SessionService`; cookie is `HttpOnly`, `SameSite=Strict`, `Secure`, and host-prefixed. Logout attempts server-side revocation and expires the cookie.
- These are source observations only. They do not prove effective runtime role/scope, applied schema, durable audit effects, or actual session invalidation.

## Release decision

`NO-GO`; do not mark `READY`. Candidate-bound authenticated success/rejection, rate-limit, session revoke/expiry, applied-schema/database evidence, role/state coverage, current browser/AT evidence, and acceptance-owner signature remain open. No commit, push, deploy, or production migration was performed.

# RT-AUTH-003 — Self-Service Recovery Deferral

**Date:** 2026-09-30 (Asia/Riyadh)  
**Decision:** DEFER self-service account access recovery; remove its executable route contract until an approved recovery policy exists.  
**State:** PARTIAL / NO-GO for implementing the reset page; the adaptive-card acceptance option “documented deferral” is satisfied. This is not release readiness or owner acceptance.

## Scope and source identity

- Page card: `RT-AUTH-003`, `/auth/reset/[requestId]`, expected file `src/pages/auth/reset/[requestId].astro` (absent).
- Related request route: `/auth/recovery` (also absent).
- Base repository HEAD: `bd30e2573b5d564e052d40a52969ecc51171fb25` on `main`.
- Working-tree patch SHA-256 at decision time: `d00e9245b338ced3637cf88ba568539f3df857224264f8dbbeda52907543460e` (includes the pre-existing working-tree changes; not an immutable release identity).
- Source schema: unchanged. No migration added or applied; current live schema, actor, and role were not queried for this documentation/registry decision.
- Fixture: none. No user recovery flow exists to exercise.

## Basis

`BR-IDN-004` and `REQ-IDN-004` approve **administrative** password reset: invalidate existing sessions, require a new user-owned password, and audit the reset. They do not define self-service recovery using an emailed token. Existing route records marked these missing pages `AUTHENTICATED`, which is inconsistent with the token-link model and could imply that an active session is the authorization to reset an account.

There is no approved policy or implementation source defining proof of account control, message delivery, reset-token storage, lifetime, atomic single use, replay/concurrency behavior, account-enumeration protection, rate limits, session invalidation, or recovery audit events. Guessing these security controls would create an unapproved authentication mechanism. Therefore the canonical route registry no longer claims these pages exist. They may be reintroduced only after the policy and its owner are recorded.

## Acceptance record

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Approved decision to implement a self-service reset flow | **NOT VERIFIED** | No recovery policy or owner approval found in the governing sources reviewed. |
| Explicit defer decision recorded for this page | **PASS** | This report and `Documents/BUSINESS-RULES.md` distinguish self-service recovery from administrative reset. |
| Reset route exists as a canonical executable contract | **PASS — removed** | `RT-AUTH-003` and the recovery request route are absent from `src/shared/routing/routes.ts`. |
| Valid, expired, reused, or concurrently replayed token behavior | **NOT VERIFIED / NOT APPLICABLE** | No token flow or token schema exists; values must be decided before implementation. |
| Account enumeration protection | **NOT VERIFIED / NOT APPLICABLE** | No public recovery request handler exists. The approved policy must require indistinguishable responses for known and unknown accounts. |
| Role and scope | **NOT APPLICABLE** | Deferred public recovery is not an authenticated role/scope feature. Administrative reset remains permission-bound through its existing use case. |
| Empty / populated / error UI, keyboard, reflow, browser, or assistive technology | **NOT VERIFIED / NOT APPLICABLE** | No page is implemented, so no UI acceptance is claimed. |
| Database and audit effects | **NOT VERIFIED / NOT APPLICABLE** | No self-service schema, reset mutation, or audit effect was added. |
| Owner acceptance signature | **NOT VERIFIED** | No named owner signature supplied or captured. |
| Release readiness | **NOT READY / NO-GO** | This deferral closes the card's explicit “documented deferral” alternative only; it does not establish an implemented or releasable page. |

## Reopen criteria

Before adding either route, approve and record a recovery policy covering:

1. How control of the account is proved and how delivery destinations are verified.
2. Random, non-secret-revealing token design/storage, a defined expiry, and atomic one-time consumption that rejects replay and concurrent reuse.
3. Indistinguishable request responses for existing and unknown accounts, plus abuse/rate controls.
4. Password rules, invalidation of every existing session, and sanitized but attributable audit evidence.
5. Delivery provider, privacy/retention, operational ownership, and recovery support path.

Then specify and verify the schema, actor assumptions, success and rejection database/audit effects, error and empty states, keyboard/reflow/assistive-technology behavior, candidate-bound E2E, and owner sign-off. The accepted requirement for administrative password reset remains in force and separate.

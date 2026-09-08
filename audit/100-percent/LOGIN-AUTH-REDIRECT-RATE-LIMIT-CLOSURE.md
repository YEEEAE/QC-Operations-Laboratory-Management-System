# QC-AUTH-LOGIN-REDIRECT-RATE-LIMIT-001 — Closure Evidence

## Scope and frozen reality

- HEAD: `1ea19f6ae699a6291ed3961379a066e0f6079821` before this working-tree change.
- Local runtime used for verification: Node `v24.20.0`, pnpm `11.25.0`.
- No commit, push, deploy, production mutation, credential submission, or production login POST was performed.

## Production observations (read-only, 2026-09-08)

| Request | Result | Evidence |
| --- | --- | --- |
| `GET https://qclevel.top/login` | `200 text/html` | Browser inspection found `POST /login?_astroAction=login`; production security headers were present. |
| `GET /api/health/live` | `200 application/json` | Has `x-request-id`; process is live. |
| `GET /api/health/ready` | `503 application/json` | Has `x-request-id`; database readiness is unavailable. |

No production POST was sent: intentionally consuming a shared login-rate-limit bucket would not be a safe observational check.

## Root-cause tree

### Confirmed

1. The browser form uses Astro 4 form Actions: `POST /login?_astroAction=login`.
2. The previous middleware applied the login policy before Astro's Action middleware and emitted a direct `429 application/problem+json` response. A browser therefore displayed raw JSON instead of Astro's normal form-result page.
3. The successful Action returned `{ ok, redirectTo }`, but the `/login` page did not consume that Action result. Astro's standard form flow redirects back to the referring page, so no explicit transition to the returned safe path happened.
4. `RateLimiter` collapsed a true threshold exceed and an increment-store exception into the same `allowed: false` result.

### Production database contributor — not yet proven to the limiter operation

`/api/health/ready` returning `503` proves readiness cannot currently reach the required database dependency. It is consistent with `RATE_LIMIT_STORE_FAILURE`, but it does not prove whether the limiter's exact operation failed because of connectivity, schema, runtime privilege, or a different database condition. Production `DATABASE_URL`, role, migration ledger, and rate-limit configuration remain unavailable for read-only operator verification.

## Remediation implemented locally

- Rate-limit decisions now carry `ALLOWED`, `THROTTLED`, or `STORE_UNAVAILABLE`, and the store outage remains fail-closed.
- The actual Astro login Action owns the login attempt limiter, so normal browser Action failures return to the login page instead of being short-circuited into raw JSON by outer middleware.
- The login page consumes successful Action data and returns a deterministic safe `303` to the validated internal target.
- The login page renders generic, throttled, and temporary-unavailability copy in English and Arabic; no identity detail is exposed.
- Safe observability events/counters distinguish successful login, generic login failure, true throttling, and a rate-limit-store outage. They do not include passwords, session tokens, or connection strings.

## Account, proxy, configuration, and database state

- `admin` / `yazeed`: **not checked**. The required production read-only connection was not supplied; no account mutation was attempted.
- Configured production maximum/window: **not available**. Values were not guessed.
- Client bucket strategy: Astro `context.clientAddress`, not user-controlled forwarded headers. Render provenance remains **unverified**.
- Migration `0018` / `qc.rate_limit_windows` / runtime privileges: **unverified in production**; no migration or schema write was attempted.

## Verification

- TDD RED: the new distinction assertions failed because `outcome` did not exist; the focused non-container suite then passed `7/7`.
- `pnpm typecheck` ✅ — 0 errors, 26 pre-existing hints.
- `pnpm lint` ✅.
- `pnpm format:check` ✅.
- `pnpm test:architecture` ✅.
- `pnpm test:unit` ✅ — 31 files, 127 tests.
- `pnpm build` ✅.
- `pnpm test:security` ❌ — 43 tests passed and 1 skipped, but PostgreSQL 18 Testcontainers could not start because this host has no working container runtime. This is not treated as a pass.
- Browser E2E, production account verification, and production smoke: **not executed**. They require an approved disposable PostgreSQL 18 runtime and then an operator-supplied existing production account after controlled deployment.

## Remaining risks and required operator evidence

1. Run the required read-only Render preflight, migration/status/schema checks, `qc.rate_limit_windows` inspection, and safe identity query using a rotated credential supplied through the approved interactive workflow.
2. Verify Render's trusted client-address behavior and rate-limit values without exposing secret configuration.
3. Run disposable PostgreSQL 18 integration/concurrency/security checks and Playwright login E2E with a disposable user.
4. Deploy only an approved exact SHA, then perform one operator-supplied controlled production login and record the redacted HTTP chain.

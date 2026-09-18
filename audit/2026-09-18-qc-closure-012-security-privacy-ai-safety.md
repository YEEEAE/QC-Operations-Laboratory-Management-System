# QC-CLOSURE-012 — Security, Privacy & AI Safety Closure

**Date:** 2026-09-18  
**Scope:** authentication/session security, application attack surface, headers, privacy boundaries, and AI advisory safety.  
**Evidence status:** PARTIAL — source and deterministic focused evidence is fresh; PostgreSQL-backed, browser-authenticated, CI, and live-provider evidence remain environment-gated.

## Changes made

- Added a defensive 25 MiB upload ceiling.
- Validated optional file extensions for safe characters and consistency with the original filename.
- Rejected overlong filenames and control characters before storage.
- Added regression coverage proving oversized and inconsistent extension inputs do not reach the repository or object store.

## Verified controls

| Area | Result | Evidence |
|---|---|---|
| Argon2id | VERIFIED | `argon2` implementation uses `memoryCost=19456`, `timeCost=2`, `parallelism=1`, `type=2`; encoded parameter probe confirmed `argon2id` parameters. |
| Brute-force/rate limit | PARTIAL | In-memory thresholds, window reset, concurrency, and fail-closed store behavior pass; PostgreSQL atomic store test is BLOCKED because Docker runtime is unavailable. |
| Sessions | VERIFIED at source/focused-test level | New opaque CSPRNG token, SHA-256 storage hash, server-side expiry/revocation/disabled checks, logout revocation, `__Host-` Secure/HttpOnly/SameSite=Strict cookie. |
| CSRF | VERIFIED at configuration level; runtime PARTIAL | Astro `security.checkOrigin=true`; same-origin/cross-origin runtime proof still needs browser execution. |
| Authorization/IDOR/mass assignment | PARTIAL | Central server authorization, scope checks, stale-version and object-link tests exist; full authenticated matrix needs PostgreSQL/browser runtime. |
| XSS/SQLi/error/secret leakage | PARTIAL | Escaped Astro rendering, parameterized report access, export formula neutralization, redacted logger, sanitized error/provider paths inspected; full payload/DAST/runtime scan not run. |
| Files | IMPROVED / PARTIAL | Authorization-before-access, server-generated keys, traversal/name/MIME/magic-byte/executable/hash checks plus new size/extension controls; malware scanning and production object-provider evidence remain open. |
| Headers | VERIFIED at source/unit level | Production CSP without unsafe-inline/eval, HSTS, DENY/frame-ancestors, nosniff, referrer and permissions policies pass focused tests. |
| Privacy | PARTIAL | Prompt/response logging is absent, logger redaction exists, reports are server-authorized and exports neutralize formulas; retention/live log/export review requires runtime/provider/UAT evidence. |
| AI advisory | VERIFIED at deterministic boundary level | 67 focused security tests pass overall; prompt injection is untrusted, malformed/authoritative output is refused, provider outage is unavailable-only, secrets/PII are rejected, and no controlled mutation authority is reachable. Human authority remains outside AI. |

## Verification

- Focused security set: **67/67 PASS** across sessions, headers, files, AI advisory/providers/evals, and HTTP middleware.
- `pnpm typecheck`: **0 errors / 68 hints**; existing hints only.
- Architecture boundary and canonical route checks: **PASS**.
- `git diff --check`: **PASS**.
- Full `pnpm test:security`: **51 PASS, 1 skipped, 1 suite BLOCKED** by missing Docker container runtime during the PostgreSQL rate-limit test.
- Node `v22.22.3` is outside the project contract `>=24.20.0 <25`; local results are not runtime-parity evidence.

## Closure decision

**PARTIAL / NO-GO for a claim of full security closure.** The source-level defensive controls and deterministic AI boundary are strengthened and verified, but full closure requires PostgreSQL-backed rate-limit/file/auth tests, authenticated browser CSRF/IDOR/XSS tests, CI exact-head execution, live provider verification, and privacy/UAT evidence. No commit, push, deployment, migration, or production mutation was performed.

# Security Attack Matrix — QC-100-03

**Date:** 2026-09-08  
**Scope:** AppSec, IAM, authorization, and privacy review for target domains 3, 5, 6, 21, 24, 27, 36, 70, 71, 72, 79, 81.  
**Evidence rule:** This matrix records current repository evidence only. `VERIFIED` means the named automated test or source inspection currently demonstrates the stated denial/control. `PARTIAL` or `UNVERIFIED` is not closure.

| attack vector | target | precondition | expected denial | test | result | evidence |
|---|---|---|---|---|---|---|
| missing permission | central authorization / all protected actions | authenticated actor has no grant | deny even when role is `ADMIN` | `authorize.test.ts` — Admin without explicit permission | VERIFIED | `tests/unit/shared/authorize.test.ts` |
| revoked permission | central authorization | grant has `active: false` | deny | `authorize.test.ts` existing inactive-grant path | VERIFIED | `src/shared/authorization/authorize.ts` |
| disabled account | IAM/session | valid token belongs to disabled user | deny session resolution | `session-service.test.ts` | VERIFIED | `tests/unit/identity/session-service.test.ts` |
| expired session | IAM/session | token session is past `expiresAt` | deny | `session-service.test.ts` | VERIFIED | `tests/unit/identity/session-service.test.ts` |
| revoked/stale session | IAM/session | token session has `revokedAt` | deny | `session-service.test.ts` | VERIFIED | `tests/unit/identity/session-service.test.ts` |
| IDOR object substitution | scope evaluator | actor requests entity from another domain/scope | deny before use-case mutation/read | `authorize.test.ts` — substituted entity | VERIFIED | `tests/unit/shared/authorize.test.ts` |
| direct URL bypass | protected Astro pages | no session cookie | redirect to local login target | authorization E2E suite | PARTIAL | `tests/e2e/authorization-matrix.spec.ts`; browser runtime evidence unavailable in this freeze |
| direct Action/API bypass | Astro actions | no actor in action context | safe auth denial | action integration suites | PARTIAL | `src/actions/*.ts`; full HTTP execution requires configured integration DB |
| wrong-state transition | domain use case | explicit permission but entity state is not policy state | deny | central policy tests and domain authorization matrices | PARTIAL | `src/shared/authorization/policy-registry.ts`; target-path coverage is not exhaustive |
| stale version overwrite | authorization/use cases | expected version differs from current version | deny with conflict | `authorize.test.ts` | VERIFIED | `tests/unit/shared/authorize.test.ts` |
| cross-origin mutation / CSRF | Astro origin boundary | state-changing request has foreign `Origin` | reject | security headers E2E | PARTIAL | `tests/e2e/security-headers.spec.ts`; browser runtime unavailable |
| session cookie downgrade | session cookie | caller tries to disable `Secure` | still emit `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` | security headers unit test | VERIFIED | `tests/unit/shared/security-headers.test.ts`, `src/modules/identity/application/session-service.ts` |
| open redirect | login return target | attacker supplies absolute, protocol-relative, or JavaScript URL | use `/dashboard` fallback | safe-return-to unit test | VERIFIED | `tests/unit/shared/safe-return-to.test.ts`, `src/shared/http/safe-return-to.ts` |
| brute force | login POST | configured production threshold exceeded | 429 and no downstream action | rate-limit integration/unit suite | PARTIAL | `tests/integration/security/rate-limit.test.ts`; PostgreSQL execution needs container runtime |
| rate-limit store outage | login POST | shared counter store unavailable | fail closed | rate-limit unit suite | VERIFIED | `tests/integration/security/rate-limit.test.ts` |
| path traversal | local object store | key contains absolute path, separator, NUL, or escapes root | reject | file security tests | PARTIAL | `src/shared/files/local-object-store.ts`; no fresh traversal test in this change |
| private object disclosure | evidence download | attacker substitutes evidence id/link | resolve canonical link and authorize subject | file integration test | PARTIAL | `tests/integration/shared/files.test.ts`, `src/shared/files/file-service.ts`; no public file delivery Action/route is currently wired |
| file tampering | evidence download | stored bytes differ from recorded digest | deny | file integration test | VERIFIED | `tests/integration/shared/files.test.ts` |
| SQL injection | search/report/filter | attacker controls filter values | parameterized/allowlisted query only | query tests and source inspection | PARTIAL | `src/modules/reporting/infrastructure/postgres-report-query.ts`; full PostgreSQL injection run unavailable |
| XSS | user-controlled descriptions/AI/report values | attacker submits markup/script | encoded output/no executable HTML | source inspection and export tests | PARTIAL | Astro escaping and `tests/unit/reporting/export-safety.test.ts`; no complete browser payload matrix |
| spreadsheet formula injection | CSV/XLSX export | cell starts `=`, `+`, `-`, or `@` | neutralize formula | export safety tests | VERIFIED | `tests/unit/reporting/export-safety.test.ts`, `src/modules/reporting/infrastructure/csv-exporter.ts` |
| sensitive logging | auth/file/database failures | attacker triggers controlled failure | no password/token/SQL in response or telemetry | error/security suites | PARTIAL | `src/shared/errors/*`, `src/shared/observability/*`; runtime log redaction needs fresh evidence |
| public health/admin disclosure | health/admin routes | unauthenticated request | only approved public liveness/readiness data; admin UI protected | health and authorization tests | PARTIAL | `src/pages/api/health/*`, `src/pages/system/health.astro` |
| runtime DB privilege escalation | PostgreSQL runtime role | application connects with excessive role | restricted runtime capabilities | database privilege integration suite | UNVERIFIED | `tests/integration/database/managed-privileges.test.ts`; requires PostgreSQL runtime |
| secret in repo/client | build/source | secret-like value or server env reaches client bundle | build/scanning denial | CI/source inspection | PARTIAL | `.github/workflows/ci.yml`; no fresh secret scanner result for this HEAD |

## Current interpretation

- The matrix is evidence inventory, not a closure certificate.
- Browser, PostgreSQL, CI, and production-configuration rows remain `PARTIAL` or `UNVERIFIED` where the required runtime was unavailable or the test is not exhaustive.
- No 100%/READY/production-closure claim is made from this matrix.
- Latest focused run: 6 files / 21 tests succeeded. `pnpm test:security` reached 26 successful tests and 1 skipped test, but the PostgreSQL-backed rate-limit setup failed because no container runtime was available.

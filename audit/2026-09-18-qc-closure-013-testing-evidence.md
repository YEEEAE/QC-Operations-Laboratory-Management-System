# QC-CLOSURE-013 — Testing Architecture & Evidence Closure

**Evidence snapshot:** 2026-09-18, Asia/Riyadh  
**Repository:** `main` / `ef1ec1aeb29e660a1455e88fbfe040bff19aa17d`  
**Decision:** `PARTIAL / NO-GO`

This record is a requirement-to-evidence traceability register. It does not convert
source inspection, skipped tests, or local-only results into PostgreSQL, E2E, CI, or
UAT closure. `PASS` below means the named evidence is present and passed in the
current workspace; `BLOCKED` means the required execution could not run; `FAIL`
means an executable check failed.

## 1. Critical requirement traceability

| ID / requirement | Implementation | Unit | Integration | PostgreSQL | Security / negative | E2E | UAT | Current state / gap |
|---|---|---|---|---|---|---|---|---|
| R-01 Identity, session, authentication | `src/modules/identity`, auth middleware/actions | `tests/unit/identity`, `tests/unit/shared/session-service` | `tests/integration/identity`, `tests/integration/http/auth-middleware.test.ts` | `tests/integration/identity/identity-rbac-postgres.test.ts` | unauthenticated, expiry, rate-limit contracts; DB rate-limit blocked | `authenticated-closure.spec.ts`, `authorization-matrix.spec.ts` | `UAT-COVERAGE-MATRIX.csv`; no sessions | PARTIAL — unit/integration source evidence; runtime/E2E/UAT absent |
| R-02 Authorization, roles, scopes, SYSTEM_OWNER | `src/shared/authorization`, administration use cases, owner control center | `tests/unit/admin`, `tests/unit/access`, policy tests | `tests/integration/administration`, `identity/system-owner-access.test.ts`, `system/control-center.test.ts` | owner/role/scope persistence suites | unauthorized actor, wrong scope, protected owner, forged action | `authorization-matrix.spec.ts`, `control-center.spec.ts` | no signed cycle | PARTIAL — local PG evidence exists historically/currently, browser/CI/UAT not verified |
| R-03 Receiving → inspection → release separation | quarantine receiving/inspection use cases and repositories | quarantine state/policy tests | `tests/integration/quarantine/release-state.test.ts`, inspection suites | controlled mutation/concurrency and migration constraints | PASS≠RELEASED, HOLD race, wrong state, missing policy | `critical-workflows.spec.ts` | critical UAT scenario defined, not executed | PARTIAL — policy-positive release and current E2E remain unverified |
| R-04 Laboratory execution, review, approve/reject/retest | `src/modules/laboratory` application/domain/infrastructure | `tests/unit/laboratory/*` | `tests/integration/laboratory/*`, e-signature | laboratory schema/constraints and controlled-record suites | missing source, wrong permission, stale, invalid transition, reject policy | `critical-workflows.spec.ts` | scientific acceptance not executed | PARTIAL — source and integration coverage; browser/UAT/provider policy open |
| R-05 Quality findings, NCR, RCA, CAPA | `src/modules/quality` use cases/repositories | `tests/unit/quality/capa-close.test.ts`, domain tests | `tests/integration/quality/{findings,ncr,rca,capa}.test.ts` | real transaction/append-only evidence requires PG | unauthorized, wrong state, missing reason, stale | quality paths in `critical-workflows.spec.ts` / closure suite | no human acceptance | PARTIAL — automated coverage exists; full current runtime chain not verified |
| R-06 Controlled documents, WI/SOP, versions | `src/modules/documents` and template lifecycle | document/version/template unit tests | `tests/integration/documents/*`, `quarantine/template-lifecycle.test.ts` | migration `0028`, unique effective-version/history guards | tampered content, stale version, invalid transition, duplicate effective version | `documents.spec.ts`, `critical-workflows.spec.ts` | document-review scenario defined, no session | PARTIAL — disposable PG evidence is available in prior record; exact-head E2E/UAT absent |
| R-07 Approvals, e-signatures, SoD | `src/modules/approvals`, `e-signatures` | approval/P-05/P-06 ceremony tests | `tests/integration/approvals/*`, `e-signatures/signature.test.ts` | atomic signature/audit/idempotency tests | unauthorized, failed reauth, SoD, duplicate, stale, invalid signature | `approvals.spec.ts`, authenticated closure | no signed UAT | PARTIAL — deterministic negatives pass; browser and human evidence absent |
| R-08 Change requests and controlled change | `src/modules/change-requests` | `tests/unit/change-requests/*` | `tests/integration/change-requests/*` | transaction/history constraints | wrong target/version, duplicate, missing reviewer/approver, invalid state | `change-request-contextual.spec.ts` | change-control UAT not run | PARTIAL — implementation and test mapping exists; full chain blocked |
| R-09 Equipment, calibration, maintenance eligibility | `src/modules/assets` | asset unit contracts | `tests/integration/assets/*` | migration `0027`, eligibility/history/lock constraints | maintenance lock, expired calibration, unauthorized, stale | `assets.spec.ts` | operational UAT absent | PARTIAL — focused PG evidence recorded; exact-head E2E/UAT absent |
| R-10 Files and evidence integrity | `src/shared/files`, object-store adapters | validation/file unit contracts | `tests/integration/shared/files.test.ts`, `object-store.test.ts` | file/evidence FK/hash/privilege coverage | missing file, tampered hash, traversal, unauthorized subject, size/type mismatch | `files-reports.spec.ts` | no evidence-handling session | PARTIAL — tamper/unit/integration intent present; browser runtime blocked |
| R-11 Reports, exports, search, dashboard scope | reporting/search read models and pages | `tests/unit/reporting`, UI/export contracts | `tests/integration/reporting/*`, `shared/search.test.ts`, dashboard | query/scope behavior requires PG | unauthorized rows, formula injection, invalid filters | `files-reports.spec.ts`, critical read surfaces | no business acceptance | PARTIAL — source/read-model coverage; scoped runtime/browser/UAT not current |
| R-12 Notifications, outbox, handoffs | notification/outbox services and repositories | notification/error contracts | `tests/integration/shared/{outbox,notifications}.test.ts` | durable outbox/replay requires PG | duplicate, missing dependency, failed delivery, unauthorized recipient | system/background and closure specs | no human handoff run | PARTIAL — current source integration exists; PG/provider/E2E unverified |
| R-13 Error, stale, dependency and recovery behavior | error architecture, readiness, recovery services | `tests/unit/health`, validation, recovery, error contracts | `tests/integration/http`, system health, recovery authorization | DB unavailable/transaction rollback requires PG | DB unavailable, stale, invalid state, missing dependency, sanitized 404/500 | `error-recovery.spec.ts` | no operational recovery UAT | PARTIAL — static and unit coverage; browser/PG/restore evidence absent |
| R-14 Security, privacy, AI advisory boundary | headers, CSRF/origin, redaction, file validation, AI advisory | shared security and AI unit tests | `tests/integration/security`, `ai-advisory`, `http` | rate-limit store and DB privilege checks blocked locally | unauthenticated, IDOR, XSS/CSRF, secret leakage, provider failure | `security-headers`, authorization, files, AI specs | privacy/security UAT absent | PARTIAL — 51 security tests passed and 1 skipped; DB-backed and browser evidence not verified |
| R-15 Release identity, CI, deployment gate | release scripts, render config, `.github/workflows/ci.yml` | release identity/config tests | HTTP release identity tests | migration head/schema checks | missing identity, drift, failed readiness, deploy mismatch | `release-identity.spec.ts`, E2E closure | signed UAT required | FAIL/BLOCKED — current CI billing lock, provider drift, UAT absent |

### Required negative-path coverage index

| Negative path | Unit / integration evidence | Browser / runtime evidence | State |
|---|---|---|---|
| unauthenticated | auth middleware, authorization matrix tests | E2E specs exist | BLOCKED locally by browser launch |
| unauthorized / wrong scope | policy, admin, P-05, route/action tests | authorization matrix exists | PARTIAL |
| stale version | shared authorize, concurrency and stale-recovery tests | `error-recovery.spec.ts` | PostgreSQL/E2E BLOCKED |
| duplicate / replay | idempotency unit/integration suites | authenticated E2E fixture path | PostgreSQL/E2E BLOCKED |
| missing dependency / provider failure | health/error/AI tests | error-recovery and AI E2E | E2E BLOCKED |
| DB unavailable | readiness and fail-closed contracts | readiness E2E | E2E BLOCKED |
| missing file | file service/integration coverage | files E2E | E2E BLOCKED |
| tampered file | hash mismatch integration test | files E2E | E2E BLOCKED |
| invalid state transition | domain/state-machine suites | critical workflow/error E2E | E2E/PG BLOCKED |

## 2. Test-estate audit

Inventory at this snapshot: **83 unit files**, **87 integration files**, and **29 E2E
spec files**.

| Audit concern | Finding | Evidence / disposition |
|---|---|---|
| Source-text-only tests | 23 test/support files read source text or directory contents. This is legitimate for architecture, UI contract, token, and config tests, but is not runtime behavior evidence. | `rg -l 'readFileSync|readFile\\(|globSync|readdirSync' tests`; classify as static-only in traceability. |
| Brittle tests | Several tests rely on exact copy, CSS/HTML structure, filenames, or broad text matching. They protect presentation contracts but can fail on harmless copy/layout edits. | `tests/unit/ui/*`, `tests/e2e/*`; retain only where the text/structure is an explicit contract; no blanket “brittle” failure claim without a failing reproduction. |
| Orphan tests | No orphan test file was proven. Unit and integration directories are included by Vitest; all E2E specs are included by the default Playwright project. | CI invokes `test:unit`, `test:integration`, and `test:e2e`; closure subset is explicit in `test:e2e:closure`. |
| Skipped tests | 28 skip markers were found across 16 E2E files. Most are fixture-gated, but skipped critical coverage is not PASS. | `rg` inventory; PostgreSQL-backed tests also fail at container startup in this host. |
| Tests outside CI | Performance scripts, UAT validator/manual records, and some focused closure commands are not in `.github/workflows/ci.yml`. | CI covers format/lint/typecheck/architecture/tech-debt/unit/integration/migrations/concurrency/security/build/release/E2E; performance and UAT remain separate evidence. |
| Duplicate tests | No safe semantic duplicate set was asserted by filename or text similarity. Similar authorization tests serve different layers and are not counted as duplicates. | Requires deliberate review, not an automated deletion. |
| Fake/no-op tests | No empty test body or unconditional pass was established in this audit. Test doubles are used in unit/application tests; they do not prove PostgreSQL behavior. | `docs/development/TESTING.md` correctly limits fake usage. |
| Implementation assertions | Static route/UI/token tests assert implementation details by design; some E2E tests assert exact headings/copy. These must not be cited as workflow behavior alone. | Mapped separately as implementation/static evidence above. |

## 3. Current required-suite execution

| Command | Result | Material reason |
|---|---|---|
| `pnpm format:check` | FAIL | 3 existing files are unformatted: audit HTML, `scripts/mcp/postgres-mcp 2.ts`, and fixture seeder. |
| `pnpm lint` | FAIL | 19 errors, mainly existing Reject Reports `any`/`Function` typing, unused variable, and file-service control-regex rule. |
| `pnpm typecheck` | PASS | 0 errors, 68 hints; Node 22.22.3 is outside declared Node 24 contract. |
| `pnpm test:architecture` | PASS | boundary and canonical-route checks passed. |
| `pnpm test:unit` | PASS | Final rerun after the Issue Slip fix: 83 files / 564 tests passed. |
| `pnpm test:integration` | NOT RUN in this snapshot | Required PostgreSQL runtime is unavailable; migration/concurrency/security runs demonstrate the same blocker. |
| `pnpm test:migrations` | BLOCKED/FAIL | 8 suites cannot find a Testcontainers runtime; 29 tests skipped. |
| `pnpm test:concurrency` | BLOCKED/FAIL | 2 suites cannot find a Testcontainers runtime; 12 tests skipped. |
| `pnpm test:security` | BLOCKED/FAIL | 51 passed, 1 skipped; PostgreSQL rate-limit suite cannot start without container runtime. |
| `pnpm build` | PASS | Astro server/client build completed; warnings only. |
| `pnpm test:e2e` | BLOCKED/FAIL | Chromium launch is denied by host macOS sandbox; prior Docker attempt was 10 passed / 10 failed / 16 skipped. |
| `pnpm test:e2e:closure` | BLOCKED/FAIL | Same Chromium launch permission failure; no browser evidence may be claimed. |
| `pnpm system-owner:check` | BLOCKED | `tsx` IPC pipe listen denied (`EPERM`) by host sandbox. |
| `pnpm release:tech-debt:check` | PASS | Register contract returned `status: ok`, 6 items. |
| `git diff --check` | PASS | No whitespace errors. |

## 4. Closure rules and next evidence

The repository already has the right layer names and CI ordering, but the current
evidence chain is not closed. The minimum next run must use Node `24.20.0`, a fresh
PostgreSQL 18 runtime, Chromium with permission to launch, exact current SHA, and
the authenticated fixture set. It must capture machine-readable counts and artifacts
for each command above. UAT remains a human activity and cannot be replaced by E2E.

No command in this record authorizes production migration, deployment, commit, push,
or a release-readiness claim.

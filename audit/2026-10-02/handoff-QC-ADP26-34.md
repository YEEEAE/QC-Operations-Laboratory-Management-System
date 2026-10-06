# QC-ADP26-34 / QC-POST-100-013 handoff

**State: PARTIAL / EVIDENCE_PENDING.** Reconciled again on 2026-10-07 at exact HEAD `4c8bdb32db810674710d73bade392293d30ae0da`, initially clean working tree, Node `v24.20.0`, source migration head `0046_inspection_report_catalog.sql`. The earlier implementation remains present; no residual source defect was reproduced, so no product code was changed. Current evidence and blockers are in `.ci-results/QC-POST-100-013-20261007/reconciliation.md`.

## Changed

- `src/pages/login.astro`: retain form POST, add a first-submit pending status, disable the submit button, and ignore repeated enhanced submit events. Existing password-manager autocomplete attributes and password visibility control remain.
- `src/actions/auth.ts`: add the limiter's server-computed `retryAfterSeconds` to the throttled Action result. The display accepts only the bounded server Action result format; URL query strings cannot set a numeric wait.
- `tests/e2e/login-form-runtime.spec.ts`: add browser checks for pending/double-submit and a no-JavaScript form contract.
- No schema, migration, scientific decision, owner authority, or signature policy changed. Existing session-expiry recovery and `safeReturnTo` remain the source of recovery behavior. No credential is logged or persisted by the new code.

## Candidate and evidence

- Historical audit candidate `6059e177438d8ae110c99084d32758b048f22cd2` was not reused. Work started from current HEAD `5e31667978d063e4f07accb80f8de868d3a6e538` on `main`, initially clean.
- Toolchain for local build: Node `v24.20.0`, pnpm `11.25.0`; migration source head `0043_controlled_document_source_binding`.
- Final run identity and source fingerprint are recorded in the generated `.ci-results/build.json` (ignored local evidence). Local release `rel-2bd3542c621797ec`; entry artifact SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`. Candidate is dirty and remains local.
- Focused unit: `pnpm exec vitest run tests/unit/identity/session-recovery.test.ts tests/unit/shared/safe-return-to.test.ts` — 8/8 PASS.
- Login browser suite against local built server: `pnpm exec playwright test tests/e2e/login-form-runtime.spec.ts --reporter=line` — 4/4 PASS (invalid Action rendering, rejected credentials without server error, pending/double-submit guard, native POST semantics with JavaScript disabled).
- Astro build: PASS on the final evidence freeze. The build emitted existing dependency/bundling warnings (Zod annotation, unused `Writable`, chunk warning); no build failure.
- First browser attempt had invalid test synchronization and failed; after correction the final-artifact rerun passed 4/4. The initial failure is test-development history, not acceptance evidence.

## Still NOT VERIFIED

- Actual configured rate-limit threshold and end-to-end `retryAfterSeconds` rendering under a true throttled response.
- Pending UI while the real server response is delayed by network throttling; current browser check exercises the submit event guard without sending a throttled login attempt.
- Browser session-expired redirect/recovery, password-manager autofill behavior, manual keyboard/screen-reader testing, and human UAT.
- No-JavaScript POST acceptance with a configured disposable database; the no-JS test verifies the rendered native form contract only.
- Candidate-bound live/runtime evidence and any production behavior. No production login, write, deployment, migration, commit, or push was performed.

## Current-candidate reconciliation — 2026-10-07

- Status: **PARTIAL / EVIDENCE_PENDING** (not DONE, NOT_STARTED, STALE, REGRESSED, or SUPERSEDED). Source implementation is still present at current HEAD. Historical browser evidence remains historical because it was generated against another candidate.
- Focused current-source execution: `tests/unit/identity/session-recovery.test.ts`, `tests/unit/shared/safe-return-to.test.ts`, `tests/integration/identity/account.test.ts` plus attempted PostgreSQL suites. On Node 24.20.0: 3 files passed, 2 database-backed suites could not initialize; aggregate 21 passed / 9 skipped. `tests/integration/security/rate-limit.test.ts` and `tests/integration/identity/identity-rbac-postgres.test.ts` were blocked at Testcontainers setup (`Could not find a working container runtime strategy`). External `QC_TEST_DATABASE_URL` was explicitly unset for this run.
- The real configured server throttle/retry page, network delay/interruption, duplicate HTTP request count, session-expiry browser route, password-manager autofill, credential/session/audit rollback and race, fixture-persona sign-in matrix, manual AT and human UAT remain **NOT VERIFIED/BLOCKED**. No fixture secrets were read or used.
- Source review confirmed no credential values in the auth logger fields; only event and request ID are logged. Current session-recovery copy states the previous action is not resubmitted. `safeReturnTo` and session-recovery focused checks passed.
- No schema change was made. Source migration head is `0046_inspection_report_catalog.sql`; applied schema was not queried. No commit, push, deployment, production migration, or production write occurred.

`QC-PAGE-F-034` remains OPEN and QC-ADP26-34 remains PARTIAL. Preserve owner/scientific/signature decisions; no new policy was inferred.

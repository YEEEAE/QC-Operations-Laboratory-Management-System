# QC-ADP26-34 / QC-POST-100-013 handoff

**State: PARTIAL.** The current source change implements the unstarted `/login` pending and duplicate-submit behavior while preserving the native POST path. It reports a retry duration only when returned by the server-side login limiter. This does not close the finding or establish release acceptance.

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

`QC-PAGE-F-034` remains OPEN and QC-ADP26-34 remains PARTIAL. Preserve owner/scientific/signature decisions; no new policy was inferred.

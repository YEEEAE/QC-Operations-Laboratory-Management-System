# QC-CLOSURE-E2E-006 — Authenticated Critical Workflow E2E Closure

## Evidence classification

This is engineering Playwright evidence only. It is not UAT, user acceptance, or a production-readiness approval.

## Implemented closure path

- `verify:e2e:authenticated` builds the current checkout, creates release identity, provisions PostgreSQL 18 through the existing Testcontainers helper, applies all migrations, seeds the controlled foundation, verifies the canonical ACTIVE `yazeed`/`SYSTEM_OWNER` account without creating or mutating it, provisions disposable `verify-*` personas, starts the built server, and runs the closure suite.
- `tests/e2e/authenticated-closure.spec.ts` covers login failure/safe returnTo/logout contract, unauthenticated route opacity, role/scope checks for Employee/Supervisor/Manager/Admin/`yazeed`, critical operational read surfaces, PASS versus release-state separation, malformed IDs, forged approval denial, throttling exercise, and WCAG 2.2 AA/keyboard smoke checks.
- `tests/e2e/release-evidence-reporter.ts` emits machine-readable scenario evidence with trusted Playwright provenance and explicit `uatClaim: false`.

## Latest execution

- Release ID: `rel-7a5fb92d651ccd42`
- Git SHA: `beeefde6369016f55223df22d482f601325f4a75`
- Build ID: `qc-closure-beeefde63690`
- Migration head: `0022_server_release_evidence`
- Test run ID: `qc-closure-a75ae9e5-7ef2-4488-853a-58e535e36e4b`
- Evidence: `.ci-results/authenticated-e2e-evidence.json`
- Outcome: `BLOCKED`

## Verification

- Exact Astro server build: PASS.
- `astro check`: PASS — 0 errors, 0 warnings, 61 existing hints.
- `git diff --check`: PASS.
- Disposable PostgreSQL 18/Testcontainers + authenticated Playwright: BLOCKED — no working container runtime strategy / Docker daemon unavailable.
- No production URL or production data was used; temporary passwords were supplied only through the process environment and were not logged or persisted.

## Required follow-up

Run the same command on a host/CI worker with Docker available and six disposable password variables, then retain the generated JSON as the `TRUSTED_PLAYWRIGHT` evidence reference for the matching release identity.

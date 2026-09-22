# Testing guide

## Status

This guide documents the test commands and evidence model implemented in this repository. It does not turn a test file or an old CI run into current evidence.

Current freeze `a6876f0fb0de6acbead7f62b3d1fbdf6c61e5de7`: unit `83 files /
564 PASS`, architecture/typecheck/build PASS; format fails on 3 files, lint
fails with 19 errors, security is `51 PASS / 1 skipped / 1 container-blocked`,
and migration/concurrency suites are blocked by the unavailable container
runtime. The Playwright inventory is `174 tests in 29 files`; execution is not
current-head E2E evidence without the required server, fixtures, and database.

## Test layers

| Layer | Command | What it proves |
| --- | --- | --- |
| Formatting | `pnpm format:check` | Tracked files match the repository formatter configuration. |
| Lint | `pnpm lint` | Static code checks pass for the current tree. |
| Typecheck | `pnpm typecheck` | Astro/TypeScript checking passes for the current tree. |
| Architecture | `pnpm test:architecture` | Delivery boundaries do not import database/business infrastructure directly. |
| Unit | `pnpm test:unit` | Pure domain, application, shared, and component contracts. |
| PostgreSQL migration | `pnpm test:migrations` | Fresh/upgrade/checksum/locking behavior against real PostgreSQL. |
| Integration | `pnpm test:integration` | Current application integration suites, including database suites where configured. |
| Concurrency | `pnpm test:concurrency` | Real concurrent mutation/idempotency behavior and stale-version protection. |
| Security | `pnpm test:security` | Security headers, rate limiting, AI boundary, HTTP/error, and related negative paths. |
| Build | `pnpm build` | The current Astro server production build succeeds. |
| Browser | `pnpm test:e2e` | Critical browser paths against a running production-like server. |

## Full local sequence

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm verification:begin
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:architecture
pnpm test:unit
pnpm test:migrations
pnpm test:integration
pnpm test:concurrency
pnpm test:security
pnpm build
pnpm run release:identity -- --environment local --build-id local-verification --artifact dist/server/entry.mjs
pnpm run release:verify -- --environment local --build-id local-verification --artifact dist/server/entry.mjs
pnpm verify:e2e:authenticated
pnpm release:evidence:check -- --require-release --fail-on-skip --expect unit --expect integration --expect migrations --expect concurrency --expect security --expect build --expect e2e
```

`pnpm verify:e2e:authenticated` starts PostgreSQL 18 in a disposable TLS-enabled Testcontainer, seeds guarded fixtures, verifies the exact built server artifact, runs `tests/e2e/authenticated-closure.spec.ts`, then tears the server and container down. The closure marks its repeated-login browser stress case skipped with an explicit reason; the PostgreSQL-backed rate-limit behavior is exercised by `pnpm test:security`. `pnpm test:e2e` remains available for a separately provisioned production-like server and database.

## Test data and infrastructure

- PostgreSQL behavior is tested with real PostgreSQL 18 through Testcontainers. Fakes are appropriate for domain/application orchestration, not for claiming database behavior.
- `QC_TEST_DATABASE_URL` is an explicit override for a disposable local test database only. It must not point at production or a shared operational database.
- Integration tests isolate disposable schemas where the suite requires it.
- No production data or production secrets belong in fixtures, reports, screenshots, traces, or logs.
- Missing authenticated E2E fixtures cause only the scenarios that require them to be skipped; skipped critical coverage is not PASS.

## Evidence

For a release candidate, capture the command, exact Git SHA, branch/ref, environment, Node version, PostgreSQL version where applicable, migration state/checksum, passed/failed/skipped counts, duration, artifacts, and known limitations. The release scripts create the identity file after build:

```bash
pnpm run release:identity -- --environment ci --build-id local-ci-check --artifact dist/server/entry.mjs
pnpm run release:verify -- --environment ci --build-id local-ci-check --artifact dist/server/entry.mjs
```

The identity file is evidence metadata, not an approval or deployment command. It must stay bound to the same build and Git SHA as the test evidence.

Start a fresh local evidence run before running any suite. This creates a new run context and leaves old `.ci-results` reports untouched; the gate rejects reports that do not match the new run ID and source fingerprint:

```bash
pnpm verification:begin
pnpm test:unit
pnpm test:integration
pnpm test:migrations
pnpm test:concurrency
pnpm test:security
pnpm build
pnpm run release:identity -- --environment local --build-id local-verification --artifact dist/server/entry.mjs
pnpm run release:verify -- --environment local --build-id local-verification --artifact dist/server/entry.mjs
pnpm verify:e2e:authenticated
pnpm release:evidence:check -- --require-release --fail-on-skip --expect unit --expect integration --expect migrations --expect concurrency --expect security --expect build --expect e2e
```

The run context binds all reports to one random run ID, current Git SHA, source-tree fingerprint, migration head, Node version, and execution environment. Suite reports include explicit pass/fail/skip counts and a SHA-256 digest. The gate rejects reports from an earlier run or a different working tree and compares the build manifest with the bytes still in `dist/`. All skips fail this mandatory evidence gate; no undocumented skip is counted as a pass.

## Interpreting results

- `PASS` requires every required gate for the declared scope to run on the current release identity.
- `PARTIAL` means some evidence passed but required scope is incomplete.
- `FAIL` means a required gate failed.
- `UNVERIFIED` means current executable evidence is unavailable.

Do not rerun a flaky test until it happens to pass, count skipped critical tests as success, or use coverage percentages as a readiness decision. A failed or blocked PostgreSQL, security, concurrency, or critical E2E gate remains visible in the release evidence.

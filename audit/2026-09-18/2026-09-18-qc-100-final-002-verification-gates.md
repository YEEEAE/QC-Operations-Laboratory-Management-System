# QC-100-FINAL-002 — Repair verification gates and prove the final candidate in CI

> Date: 2026-09-18
> Candidate frozen at execution: **`e30285c39695defcaaa9a12ce517e6831f5bc8f7`** (branch `main`, clean working tree before changes)
> Audit baseline referenced by the task: `298e307721af97d9c1bd22279d0c784fbf5b62a8` (historical input, re-frozen before use)
> State: **DONE (local)** — CI execution itself remains **BLOCKED** on an external operator dependency (billing).

## 1. Environment (declared toolchain)

| Item | Value | Contract | Result |
|---|---|---|---|
| Node | `v24.20.0` (nvm local; default shell was `v22.22.3`, outside contract) | `>=24.20.0 <25` | PASS |
| pnpm | `11.25.0` | `11.25.0` | PASS |
| Install | `pnpm install --frozen-lockfile` | lockfile unchanged, `engine-strict=true` | PASS |
| Database | disposable local PostgreSQL **18.6** via `scripts/db/disposable-postgres.sh` (TLS `verify-full`, isolated port, `qc_disposable` + `qc_test`) | isolated PostgreSQL 18 | PASS |

Note: the disposable cluster previously refused to start on this host
(`postmaster became multithreaded during startup`) when `LC_ALL` was unset. The
script now pins `LC_ALL`/`LANG` to `C` (the locale it also initialises with), so
the documented provisioning command works without manual env setup.

## 2. Changes made (final tree vs `e30285c`)

### Format / lint root causes
- `src/modules/reject-reports/infrastructure/postgres-repository.ts`
  - **Product fix:** the dashboard analytics "approval confirmations" query used
    an unqualified `status` while joining `issue_slip_approval_confirmations a`
    to `reject_reports r` (both have `status`) → PostgreSQL error `column
    reference "status" is ambiguous` (also the live `/reject-reports` 500 root
    cause on a fully migrated schema). Now qualified as `a.status`.
  - Replaced the `Function`-typed generic filter helper and all 15 `any`s with
    real Kysely builder types (detail filters on `daily_reject_entries` are now a
    typed correlated `EXISTS`). No new eslint suppressions in application code.
- `src/shared/files/file-service.ts` — one targeted `eslint-disable-next-line
  no-control-regex` with justification: rejecting C0/DEL control characters is
  the purpose of that regex.
- `scripts/mcp/postgres-mcp 2.ts` (unreferenced helper variant with a macOS
  filename-collision name, tracked in git) — removed the unused `_databaseUrl`
  binding by stripping `DATABASE_URL` explicitly; Prettier-formatted. Its sibling
  duplicate `docs/operations/POSTGRES-MCP 2.md` is left in place (content differs
  from `postgres-mcp.ts`, so deleting was not assumed).
- `scripts/verification/seed-verification-fixtures.ts` — Prettier-formatted.
- `eslint.config.mjs` — `.tmp/**` added to the ignore list: that directory is
  gitignored scratch tooling that Prettier already skips through `.gitignore`;
  the lint scope is aligned with it. **No** application source path was excluded
  and no rule was weakened.
- `.prettierignore` — `audit/**/*.html` added (narrow): the interactive audit
  report packs are frozen evidence deliverables with inline scripts. Reformatting
  them rewrites reviewed evidence (668 lines / +3 KB on a probe run) for no
  application benefit. `*.md` was already excluded globally.

### Test / verification corrections (contracts verified before changing)
- `tests/integration/reject-reports/reject-reports.test.ts` — the "rejects
  anonymous/inactive actors" assertion used `.rejects` against
  `CreateIssueSlipUseCase.execute`, which denies **synchronously** (`authorize()`
  throws before any repository promise exists). The harness now asserts the throw
  itself and the exact `AppError` code (`AUTHZ_DENIED`) — a stronger assertion
  than the previous class-only `.rejects.toThrow`. Product semantics were **not**
  changed to make the test pass.
- `tests/integration/system/control-center.test.ts` — the hard-coded expected
  head `'0027'` was stale (source head is `0029`). The assertion now derives the
  expected head from `loadMigrations()` and additionally asserts
  `pendingCount === 0`, so adding a migration cannot stale this contract again.
- `tests/integration/concurrency/controlled-mutations.test.ts` — investigation
  of the losing inspection approval (20 targeted runs) showed the loser is
  **non-deterministically** rejected at one of three safe points, all preventing
  a silent overwrite: `AUTHZ_DENIED` (use-case state gate saw the committed
  `APPROVED` state), `DOMAIN_INVALID_TRANSITION` (`transition()`'s own fresh read
  saw `APPROVED`, and the domain state machine has no `APPROVE` transition from
  `APPROVED`), and `CONFLICT_STALE_VERSION` (both re-reads raced as
  `UNDER_REVIEW`, but only one `UPDATE` matched version 3). Both race tests
  (receiving release and inspection approval) now accept exactly these three
  codes with the reasoning inline, while keeping every deterministic
  post-condition (exactly one fulfilment, committed row state/version, exactly
  one audit event, exactly one outbox event, replay denial) unchanged.
- `scripts/verification/run-authenticated-e2e.ts` — sets
  `QC_MANDATORY_VERIFY_FIXTURES=true` and `QC_VERIFY_BASE_URL` for the Playwright
  child so fixture-gated journeys cannot silently skip.
- `tests/e2e/verify-fixtures.ts` (new) + `authenticated-closure.spec.ts`,
  `control-center.spec.ts`, `verification-access.spec.ts` — shared fixture
  presence helper; under the mandatory flag a missing fixture throws (fail
  closed) instead of skipping.
- `.github/workflows/ci.yml` — new step **"Authenticated closure E2E with
  candidate-bound fixtures"** generating six one-time disposable passwords in the
  step environment (never written to files or logs) and running
  `pnpm verify:e2e:authenticated`: disposable TLS PostgreSQL 18 container →
  migrate to the candidate head → foundation seed → disposable `yazeed` owner +
  five `verify-*` personas → built server from the exact SHA → the six mandatory
  closure specs. The runner exits `2` with blocked evidence when it cannot run.

## 3. Gate results (final tree, exact commands)

| Command | Result | Count |
|---|---|---|
| `pnpm install --frozen-lockfile` | PASS | lockfile unchanged |
| `pnpm format:check` | PASS | 0 unformatted files (baseline: 4) |
| `pnpm lint` | PASS | 0 errors (baseline: 37 = 19 source/script + 18 operational helpers) |
| `pnpm typecheck` | PASS | 794 files, 0 errors |
| `pnpm test:architecture` | PASS | boundaries + route files |
| `pnpm release:tech-debt:check` | PASS | — |
| `git diff --check HEAD` | PASS | no whitespace errors |
| `pnpm test:unit` | PASS | 83 files / 564 tests |
| `pnpm test:integration` | PASS | 87 files / 353 tests (baseline: 350/3) |
| `pnpm test:migrations` | PASS | 8 files / 29 tests |
| `pnpm test:concurrency` | PASS | 2 files / 12 tests (baseline: 11/1) |
| `pnpm test:security` | PASS | 7 files / 52 tests |
| `pnpm build` | PASS | dist generated |
| `pnpm run release:identity` | PASS | `dist/release-identity.json` |
| fixture seed / cleanup | PASS | "Verification fixtures provisioned (seed-managed only; yazeed untouched; passwords not logged)"; cleanup disabled 5 disposable accounts |

Concurrency stability: full concurrency suite **15/15** consecutive passing runs
after the fix, plus 20/20 targeted inspection runs (gitignored scratch logs under
`.tmp/logs/`).

All local runs used Node `v24.20.0` + pnpm `11.25.0` against the isolated
disposable PostgreSQL 18.6 cluster (never production, no provider credentials).

## 4. Not run / remaining dependencies

| Item | State | Reason |
|---|---|---|
| Exact-SHA GitHub Actions run | **BLOCKED** | Account billing lock (baseline run `35325572254` had zero steps). Pushing a candidate also requires explicit user authorization, which was not given for this task. |
| CI Testcontainers (`postgres:18-alpine`) path | NOT RUN locally | No Docker runtime on this host. CI runs it through the same suites; local evidence uses the approved equivalent disposable PostgreSQL 18.6 cluster. |
| Authenticated E2E locally | BLOCKED | `verify:e2e:authenticated` is Docker-only by design (it refuses `QC_TEST_DATABASE_URL`). The fixture seed/cleanup path itself is proven above. |
| Fixture provenance in a real CI run | NOT VERIFIED | Requires the billing-resolved exact-SHA run. |

Nothing was deleted, skipped or weakened to reach these results: every baseline
failure was either fixed at the root cause or re-contracted with its verified
reason, and no test was removed.


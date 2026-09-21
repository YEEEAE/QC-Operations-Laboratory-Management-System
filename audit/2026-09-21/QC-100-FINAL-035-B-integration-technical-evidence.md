# QC-100-FINAL-035-B — Integration and technical evidence

**Work state: PARTIAL.** Both scoped items have fresh local source, test, and
documentation evidence on the frozen candidate. The phase-A handoff for task
family 035 is missing, the architecture boundary gate has a pre-existing FAIL
on the frozen candidate, database-backed regression is owned by 002/027, and
external evidence (E2E 003, accessibility 006/040, human acceptance 004, final
reconciliation 012) remains open. No maturity score or the 80-domain
denominator changed. `PASS ≠ RELEASED`.

## Frozen candidate and identity

| Field | Value |
|---|---|
| Frozen Git SHA | `4fa6ac3b3bdf2330335ba1d26d019c83af7c8876` |
| Branch / start state | `main`; dirty tree carried from QC-100-FINAL-034-B (Mind update, `tests/integration/observability/correlation.test.ts`, two 034-B audit files) — preserved untouched by this task |
| Dirty fingerprint | `d28d515861368ec53347703c90c97f41df519980c9000681e4cf591ad2ed9346`; SHA-256 over the 12 sorted changed source paths (audit and Mind excluded), each path + NUL + file bytes + NUL. Paths: `.env.example`, `Documents/CONFIGURATION-REFERENCE.md`, `Documents/DOCUMENTATION-INVENTORY.md`, `Documents/EXTENDING-THE-SYSTEM.md`, `Documents/LOCAL-DEVELOPMENT.md`, `package.json`, `scripts/diagnostics/run-local-diagnostics.mjs`, `src/config/constants.ts`, `src/config/env.ts`, `src/shared/observability/logger.ts`, `tests/integration/observability/correlation.test.ts` (carried from 034-B), `tests/unit/config/server-env.test.ts` |
| Runtime | Node `24.20.0` (selected explicitly via nvm for all checks; host default `22.22.3` is outside the contract); pnpm `11.25.0` |
| Build | `pnpm build` PASS at 2026-09-21 02:05 UTC (Astro server output, `@astrojs/node`) |
| Local release identity | `rel-3a869b3a52445ad0`; `release:verify` PASS at 02:06 UTC, exact Git SHA verified, working tree dirty (non-production evidence) |
| Source schema | Migration head `0034_template_document_link_variable_scope` (34 migrations); unchanged by this task |
| Applied schema | NOT VERIFIED by this task — no schema change was made; 034-B verified 34 migrations on a task-owned disposable PostgreSQL 18.6 |

Times are UTC on 2026-09-21.

## Missing prerequisite input (035-A handoff)

No `audit/**/QC-100-FINAL-035-*` report and no Mind ledger entry for
QC-100-FINAL-035 exist. The exact missing input is the phase-A record for its
two scoped items: (1) the module-boundary / dependency-direction / ownership
map with identified coupling, and (2) strengthened API/action contracts with
consumer compatibility tests. This phase proceeded with independent
preparation: the current architecture gate output was captured as the de-facto
boundary baseline (see Known failures), and no A-scoped refactor was
re-implemented. Owner: QC-100-FINAL-035 (phase A) or 026 for re-planning.

## Evidence by scoped item

| Item | State | Changed paths and evidence | Unresolved dependency / owner |
|---|---|---|---|
| 1. Typed, fail-closed configuration; documented approved defaults and change impacts; secrets out of examples | **DONE locally / PARTIAL for external confirmation** | `src/config/env.ts`: `LOG_LEVEL` added to the typed Zod schema (`fatal/error/warn/info/debug/trace/silent`, unknown values rejected with names only); partial `R2_*` backup configuration now fails validation all-or-none, matching the `.env.example` contract and the store's own fail-closed parse (`parseR2Config`). `src/config/constants.ts`: `ENV_KEYS.logLevel`, `SERVER_LOG_LEVELS`, `DEFAULT_LOG_LEVEL`, `R2_ENV_KEYS`. `src/shared/observability/logger.ts`: `resolveLogLevel()` passes valid levels and degrades unexpected values to `info` (logging must never break a request; startup validation is the strict gate). `tests/unit/config/server-env.test.ts`: 8 contract tests — defaults, production missing-critical names-only failure, non-PostgreSQL URL rejection without value echo, OTEL pairing, R2 all-or-none, log-level allowlist without value echo, full production acceptance, resolver fallback. `Documents/CONFIGURATION-REFERENCE.md` (new): every recognized variable with type, approved default, required-when, change impact, and change-management rules; no secret values. `.env.example`: `LOG_LEVEL` added as a name with the approved default; still names-only. Evidence: new suite **8/8 PASS** (02:03); focused config/logger/validation/render/backup suites **40/40 PASS** (02:02); full unit **112 files / 815 PASS** (02:03); typecheck **892 files / 0 errors / 0 warnings / 74 hints** (02:03); middleware configuration-failure path regression via `tests/unit/http` + health suites **15/15 PASS** (02:05); build + local release identity PASS (02:05–02:06). | 013/026: confirm approved defaults/change-impact wording as policy; 002/027: exact-candidate regression including database suites; 012: final reconciliation. Production/provider configuration remains operator-owned and NOT VERIFIED. |
| 2. Reproducible local setup, diagnostic commands, debt ownership and module extension guides; scoped refactors only | **DONE locally / PARTIAL for external confirmation** | `scripts/diagnostics/run-local-diagnostics.mjs` + `pnpm diagnose` (new, read-only, fail-closed): Node/pnpm versions vs `package.json` contract, repository identity and dirty state, migration source head, typed configuration validation including the same allowlisted `.env` merge the local db scripts apply — names only, never values; exit 1 on any contract violation. Evidence: on Node 24.20.0 **6/6 checks PASS, exit 0** (02:00); on host Node 22.22.3 it **fails closed exit 1** on `node-runtime` (02:00); with the current local `.env` it **fails closed exit 1** on `dotenv-configuration` naming only `SERVICE_VERSION` and the rate-limit pair (02:08) — the same failure `pnpm db:migrate:check` surfaces mid-command (02:06, pre-existing local `.env` gap, not a repo defect). `Documents/LOCAL-DEVELOPMENT.md`: new "Diagnose the local environment" and "Technical debt ownership" sections; `requirements:check` and `release:tech-debt:check` added to the verification list. `Documents/EXTENDING-THE-SYSTEM.md`: stale migration head corrected `0029` → `0034_template_document_link_variable_scope` (measured against `db/migrations`). `Documents/DOCUMENTATION-INVENTORY.md`: configuration reference registered. Guards: `pnpm requirements:check` PASS (`100/34/20/33/5/7`, denominator **80** unchanged); `pnpm release:tech-debt:check` PASS (6 items); ESLint + Prettier PASS on all touched files. No runtime/toolchain contract changed (`engines`, `packageManager`, dependencies untouched). | Local `.env` gap (NODE_ENV=production without `SERVICE_VERSION`/rate-limit pair) belongs to the local operator; 002/027 own container/database regression; 003 E2E, 006/040 accessibility not applicable to docs/config-only changes but unrun; 012 reconciliation. |

## Known failures and non-claims

- `pnpm test:architecture` **FAIL (pre-existing)** on the frozen candidate:
  delivery-layer boundary violations in `src/pages/quality/ncr/[ncrId].astro`,
  `src/pages/quality/capa/[capaId].astro`, and `src/pages/ai-advisory.astro`.
  None of these files are in this task's diff; the violations exist at HEAD
  (`git log` confirms last change at `4fa6ac3`). This is the current module-
  boundary evidence baseline that the missing 035-A phase was meant to map.
- `pnpm db:migrate:check` **BLOCKED locally**: the local `.env` sets
  `NODE_ENV=production` without the production-required non-secret keys, so
  validation fails closed naming `SERVICE_VERSION` and the login rate-limit
  pair. This predates this task and is now diagnosed by `pnpm diagnose`.
  Database-backed regression was not rerun: no schema or query behavior
  changed; owner 002/027.
- Authenticated E2E (003), accessibility checks (006/040), human acceptance
  (004), CI on the exact candidate (billing lock), and production/provider
  configuration remain **NOT RUN / BLOCKED** as recorded in the Mind.
- Scores and the 80-domain denominator are unchanged; `PASS ≠ RELEASED`.

## Command record

| UTC | Command / action | Result |
|---|---|---|
| 01:56 | Candidate freeze: `git rev-parse HEAD`, `git status --short` | `4fa6ac3b…`; 034-B dirty paths identified and preserved |
| 01:56–02:01 | Config survey (`process.env` consumers, R2 store, logger, rate-limit policy, docs inventory) | Gaps confirmed: `LOG_LEVEL` untyped; R2 pairing unenforced in code; no configuration reference; stale migration head in extension guide; no single diagnostic command |
| 02:03 | `vitest run tests/unit/config` (new) | PASS 8/8 |
| 02:02 | Focused regression: config + validation + logger-privacy + render-config + backup-recovery | PASS 40/40 across 11 files |
| 02:03 | `pnpm typecheck` | PASS: 892 files, 0 errors, 0 warnings, 74 hints |
| 02:03 | `pnpm test:unit` | PASS: 112 files / 815 tests |
| 02:04 | ESLint + Prettier on touched files | PASS after fixing 4 `no-useless-assignment` findings in the new diagnostics script |
| 02:04 | `pnpm test:architecture` | FAIL (pre-existing NCR/CAPA + ai-advisory delivery-boundary violations at HEAD) |
| 02:04 | `pnpm requirements:check` | PASS: requirements=100, risks=34, gaps=20, decisions=33, assumptions=5, mappedDomains=7, domains=80 |
| 02:04 | `pnpm release:tech-debt:check` | PASS: 6 register items valid |
| 02:00 / 02:08 | `pnpm diagnose` on Node 24.20.0 / 22.22.3 / with local `.env` | PASS exit 0 / FAIL exit 1 (node-runtime) / FAIL exit 1 (dotenv-configuration, names only) |
| 02:05 | `pnpm build` | PASS |
| 02:05–02:06 | `release:identity` + `release:verify` | PASS: `rel-3a869b3a52445ad0` on exact SHA, dirty tree marked |
| 02:06 | `pnpm db:migrate:check` | BLOCKED: local `.env` production gap (names only); pre-existing |
| 02:09 | Dirty fingerprint computed over final tree | `d28d5158…` (12 source paths, audit/Mind excluded) |

## Next phase / required inputs

Next phase in the recorded plan: **QC-100-FINAL-036** (environments, CI and
release engineering — A). Required inputs it should consume: this report; the
missing 035-A module-boundary/contract handoff (still owed); the pre-existing
architecture-gate FAIL as boundary baseline; and the local `.env` gap finding.
Final evidence reconciliation remains with 012; downstream owners 002/027
(regression), 003 (E2E), 006/040 (accessibility), 013/026 (policy/default
approval) are unchanged.


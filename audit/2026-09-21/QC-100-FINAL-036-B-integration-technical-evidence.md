# QC-100-FINAL-036-B — Integration and technical evidence

**Work state: PARTIAL.** Both scoped items have fresh local source, test and
documentation evidence on the frozen candidate, and two release-engineering
defects that blocked any artifact evidence were diagnosed and repaired locally.
The phase-A handoff for task family 036 is **missing**, CI cannot execute
(account lock), deployment/production mutations remain authorization-bound, and
four CI gates inherited from the frozen commit are still red. No maturity score
or the 80-domain denominator changed. `PASS ≠ RELEASED`.

## Frozen candidate and identity

| Field | Value |
|---|---|
| Frozen Git SHA | `5470a2ecbbd9da7593fe511e86da2e7c49bf80e1` (`main`, HEAD) |
| Start state | clean tree at freeze (`git status --short` empty) |
| Runtime | Node `24.20.0` (selected via nvm for every check; host default `22.22.3` violates the contract and is recorded as DRIFT-036-B-01); pnpm `11.25.0` |
| Build | `pnpm build` **exit 1 at freeze → exit 0 after the repair**; Astro server output, `@astrojs/node` |
| Build tree | 325 files; digest `da6fc6bb5458fc0ca0fd25e5f6321a022b68c44c6765dfa544bb4c3d50281c99` — identical across 4 consecutive clean builds (`reproducible: true`) |
| Declared artifact | `dist/server/entry.mjs`, sha256 `a12fcb45e6d0db4abf083518d30984cb6ada886e73d37259943777456bf5f816` — identical across rebuilds |
| Local release identity | `rel-b5c70604216d73b7` (`--environment local`, dirty tree, non-production evidence); `release:verify` PASS; an earlier identity with a fixed build ID/timestamp reproduced exactly (`rel-e33e895d19e5b3bc`) |
| Source schema | Migration head `0035_receiving_normalization` (35 migrations), checksum `c1f6aae49023e8a8a428f2fed4dadbfb21cd9fe153a24b75bbe0f883c306ac00` |
| Applied schema | **NOT VERIFIED** — no database was reachable; production evidence remains applied head `0018` (DRIFT-036-B-04) |
| Content-based dirty fingerprint | `ab47712b0780654d936ced5462d031a1b423e289adf823fe07bb6a61659adc86` over the 18 sorted changed source paths (audit and Mind excluded), each path + NUL + file bytes + NUL |

Times below are UTC on 2026-09-21.

## Missing prerequisite input (036-A handoff)

No `audit/**/QC-100-FINAL-036-*` report and no Mind ledger entry for
QC-100-FINAL-036 (phase A) exist. Its **implementation** is present and
committed in the frozen candidate:

- `scripts/release/check-environment-parity.mjs`, `scripts/release/build-manifest.mjs`,
  `scripts/release/check-verification-evidence.mjs`;
- `tests/unit/release/{environment-parity-guard,build-manifest,verification-evidence-gate}.test.ts`,
  `tests/unit/verification/fixture-isolation-guards.test.ts`;
- `package.json` scripts `release:parity:check`, `release:evidence:check`, `release:manifest`;
- a CI step running `release:parity:check`.

The **exact missing input** is its phase-A record: the environment
parity/isolation inventory by runtime, schema, config, data and artifact
identity, and the evidence it produced for the reproducibility and
candidate-bound immutable-evidence contracts. This phase proceeded with
independent preparation (it read and executed those deliverables rather than
re-creating them) and re-verified them on the frozen candidate. The A-phase
contract suites were **red at freeze** (one parity test failed on the
documented migration head, and `pnpm lint` failed with 6 errors in the A-phase
scripts); both are repaired here. Owner: QC-100-FINAL-036 phase A, or `026` for
re-planning.

## Evidence by scoped item

| Item | State | Changed paths and evidence | Unresolved dependency / owner |
|---|---|---|---|
| 1. Prepare migration/backup/rollback and staged release checks; verify build promotion uses the same artifact | **DONE locally / PARTIAL for external execution** | **Repair 1 (build blocker):** the frozen commit did not build — `The symbol "describedBy" has already been declared` in `src/pages/quarantine/receiving/[receivingId].astro` (the block at 102–109 declared `describedBy`/`invalid` twice). Removed the duplicate pair (4 lines). `pnpm build` exit 1 → 0; the built server boots and answers `/api/health/live` `200` and `/login` `200`. **Repair 2 (artifact identity):** `astro.config.mjs` now pins a fixed non-secret build key (`ASTRO_KEY`, documented as inert because `astro:env` `getSecret` is not enabled and no source path reads it) and, via an `astro:build:done` integration, calls the new `scripts/release/normalize-server-manifest.mjs` to rename Astro's generated `server/manifest_<hash>.mjs` to a stable `server/manifest.mjs`, rewriting only the two references that point at it and failing closed on any unexpected referrer. Before: every rebuild changed `server/manifest_<hash>.mjs` **and** `server/entry.mjs`. After: **4 consecutive builds from a clean `dist/` produced an identical tree** (`reproducible: true`, 325 files, digest `da6fc6bb…81c99`), identical `entry.mjs` (`a12fcb45…5f816`), and an identical release identity for a fixed build ID/timestamp (`rel-e33e895d19e5b3bc`). **New gate:** `scripts/release/check-staged-promotion.mjs` (+ `pnpm release:promotion:check`) with 7 fail-closed checks — plan shape and DEP-001 environment order, candidate evidence bound to the expected checkout and to the planned target head, local artifact bytes hashing to the candidate's declared digest, **promotion parity** across target environments (Git SHA, versions, migration head/checksum, artifact digest — a rebuild is not the verified artifact), forward-only migration step against the source ledger, rollback preconditions per declared failure mode (DEP-006/012/033-style: code rollback needs `schemaCompatible` and a distinct prior artifact; forward-fix/recovery need an owner), and recovery posture for a declared `HIGH` risk or `recovery` mode validated against the existing recovery-manifest schema bound to the pre-migration head. `migration-forward-only` reuses the source ledger; `recovery-precondition` reuses `validateRecoveryManifest` rather than restating the schema. **Live evidence:** on the real candidate the gate returned `7/7 PASS, exit 0`; with a tampered target identity it returned `FAIL promotion-parity` (`artifactSha256 mismatch`), and with `riskLevel: HIGH` and no manifest it returned `FAIL recovery-precondition` — both `exit 1`. **Tests:** `tests/unit/release/staged-promotion-gate.test.ts` (7) and `tests/unit/release/deterministic-build-output.test.ts` (5) PASS. **CI preparation:** `.github/workflows/ci.yml` now records the build manifest to `.ci-results/build-manifest.json` **outside `dist/`** (adding evidence inside `dist/` changes the tree by construction: 325 → 326 files, measured). `Documents/RELEASE-RUNBOOK.md` documents the deterministic build and the gate. | CI execution is **BLOCKED** (account/billing lock, DRIFT-036-B-07) so the manifest step is locally verified but not run by CI. Provider rebuild-instead-of-promote is **OPEN** (DRIFT-036-B-06) and needs deployment authorization. Production migration execution needs authorization (DRIFT-036-B-04) and a clean candidate (DRIFT-036-B-09). Owner: deployment authority / account owner. |
| 2. Record drift and exact operator action required; refresh post-change technical evidence | **DONE locally / PARTIAL for external confirmation** | `Documents/ENVIRONMENT-DRIFT-REGISTER.md` (new) records 15 drifts with scope, observed value, evidence, impact, **exact operator action**, owner and status, split into `RESOLVED-LOCAL` / `OPEN` / `EXTERNAL` / `HISTORICAL`. Three were repaired locally: the undocumented migration head (`Documents/EXTENDING-THE-SYSTEM.md` `0034…` → `0035_receiving_normalization`, which also turned the 036-A parity suite green), the build blocker, and the 6 `pnpm lint` errors that all sat inside the 036-A release-engineering deliverables (`process` declared in a `/* global */` comment while also imported, `URL` under `no-undef`, two useless assignments). **Refreshed evidence on the final state:** `pnpm release:parity:check` **7 checks / 0 failed, `status: ok`** — was 2 FAIL at freeze; its `artifact-identity` check reported `INFO` (no local release identity existed yet) and `PASS` (schema-valid, secret-free) once one did; `pnpm lint` **exit 0** (was 6 errors); `pnpm typecheck` **909 files / 0 errors / 0 warnings / 74 hints**; `pnpm requirements:check` PASS with denominator **80**; `pnpm release:tech-debt:check` PASS (6 items); release identity + `release:verify` PASS on the exact SHA; `pnpm release:evidence:check --require-release` **failed closed** (`exit 1`, `migrations: 3 failed test(s)`) instead of claiming a pass. `pnpm test:unit` **868/873** (120 files). `Documents/DOCUMENTATION-INVENTORY.md` registers the new register. **A running health endpoint is explicitly excluded as evidence**: `/api/health/live` returning `200` proves neither these prerequisites nor the human release gates. | Still red and owned elsewhere: `format:check` 15 files (DRIFT-036-B-12), 5 unit failures in 4 files (DRIFT-036-B-14, proven pre-existing by re-running the contract against the pristine `HEAD` file), architecture gate (DRIFT-036-B-15). Suite reports are not candidate-bound (DRIFT-036-B-11). `002/027` own database regression, `003` E2E, `006/040` accessibility, `012` final reconciliation. |

## Known failures and non-claims

- `pnpm test:unit` **FAIL (pre-existing at HEAD)**: 5 tests in
  `tests/unit/quarantine/receiving-data-contract.test.ts`,
  `tests/unit/ui/dashboard-decision-surface.test.ts`,
  `tests/unit/ui/quarantine-decision-surface.test.ts`,
  `tests/unit/ui/mutation-safety-contract.test.ts`. All four files were last
  changed by the frozen commit `5470a2e`. Proven not caused by this task by
  restoring the pristine `HEAD` version of
  `src/pages/quarantine/receiving/[receivingId].astro` and re-running
  `mutation-safety-contract` — the failure reproduced unchanged.
- `pnpm format:check` **FAIL**: 15 files, none in this task's diff (11
  `src/modules/quarantine/receiving/**`, 2 receiving tests, one pre-existing
  record-journey contract, one audit JSON). Deliberately not reformatted here —
  it belongs to the receiving workstream.
- `pnpm test:architecture` **FAIL**: the historical NCR/CAPA + `ai-advisory`
  delivery-boundary violations **plus** new violations from the frozen commit
  (`quarantine/receiving/{index,new,[receivingId]}.astro`, `src/actions/quarantine.ts`
  importing the receiving domain directly).
- `.ci-results/*.json` are **stale and not candidate-bound**; the evidence gate
  consumed them and reported integration `470/470`, concurrency `12/12`,
  security `52/52` while failing on `migrations 30/33` from an earlier state.
  No suite result in this report is claimed for this candidate on the strength
  of those files.
- Database-backed regression, authenticated E2E, accessibility, human UAT,
  deployment, production migrations and credential rotation are **NOT RUN /
  BLOCKED** as recorded in the Mind; scores and the 80-domain denominator are
  unchanged; `PASS ≠ RELEASED`.

## Command record

| UTC | Command / action | Result |
|---|---|---|
| 16:19 | Candidate freeze: `git rev-parse HEAD`, `git status --short` | `5470a2ec…`; clean tree |
| 16:20 | `vitest run tests/unit/release tests/unit/verification` (Node 24.20.0) | 1 failed / 81 passed — `schema-identity` FAIL (036-A contract red at freeze) |
| 16:21 | `pnpm build` | **exit 1** — duplicate `describedBy` declaration |
| 16:21 | Duplicate removed, `pnpm build` | exit 0 |
| 16:22 | `build-manifest --write` → rebuild → `--verify` | `reproducible: false`, 3 differing paths (`entry.mjs` + manifest chunk) |
| 16:23 | Root cause isolated | Astro's random per-build `ASTRO_KEY` and the manifest chunk's self-referential filename |
| 16:25 | Deterministic key + `astro:build:done` normalizer wired | generator log `manifest.mjs normalized (2 reference(s) in entry.mjs, manifest.mjs)` |
| 16:26 | Built server smoke after normalization | `/api/health/live` 200, `/login` 200 |
| 16:31 | Full unit run ×2 | 868/873; the same 5 pre-existing failures; pristine-file control reproduced one of them |
| 16:33–16:34 | 4 × `pnpm build` + `build-manifest --verify` | `reproducible: true`, 325 files, digest `da6fc6bb…81c99` each time; `entry.mjs` `a12fcb45…5f816` |
| 16:34 | `release:identity` + `release:verify` | `rel-b5c70604216d73b7` verified on the exact SHA (dirty, non-production) |
| 16:34 | `release:evidence:check --require-release --fail-on-skip …` | exit 1 — fails closed on the stale `migrations` report |
| 16:35 | `release:promotion:check --plan …` (real candidate) | `7/7 PASS`, exit 0 |
| 16:35 | Same gate, tampered target identity / `HIGH` risk without recovery | `FAIL promotion-parity`, `FAIL recovery-precondition`, exit 1 |
| 16:35 | `pnpm release:parity:check` | 7 checks / 0 failed (`artifact-identity` INFO); re-run at 16:41 `PASS` on the local release identity |
| 16:36 | `pnpm lint` | exit 1 (6 errors, all 036-A) → after repair **exit 0** |
| 16:36 | `pnpm typecheck` | 909 files, 0 errors, 0 warnings, 74 hints |
| 16:37 | `pnpm requirements:check` / `release:tech-debt:check` | PASS (`…/80`) / PASS (6 items) |
| 16:37 | `pnpm format:check` | FAIL — 15 files, none in this diff |
| 16:38 | Dirty fingerprint over 18 changed source paths | `ab47712b…c86` |

## Next phase / required inputs

Next phase in the recorded plan: **QC-100-FINAL-037**. Required inputs: this
report; the still-owed **036-A** parity/isolation record; the drift register
(`Documents/ENVIRONMENT-DRIFT-REGISTER.md`) as the environment/release baseline;
and the frozen-commit defects recorded as DRIFT-036-B-12/-14/-15 for the owning
workstreams. External dependencies stay with `002/027` (database regression),
`003` (E2E), `006/040` (accessibility), `004` (human acceptance) and `012`
(final reconciliation); the CI account lock, the provider
rebuild-instead-of-promote behaviour and any production migration remain
authorization-bound.

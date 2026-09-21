# Environment drift register

**Document path:** `Documents/ENVIRONMENT-DRIFT-REGISTER.md`
**Status:** DERIVED OPERATIONAL RECORD — no new policy, authority or threshold is defined here.
**Owner of the disciplines:** Deployment / Release Engineering, CI/CD Engineering,
Environment Management (Dev/Test/Staging/Prod).
**Last updated:** 2026-09-21 (QC-100-FINAL-036-B).

This register records where the repository contract, the running environments and
the release pipeline disagree, and the exact operator action each drift needs. It
is deliberately derived: every action points back to an already approved decision
(`DEPLOYMENT-ARCHITECTURE.md` §46, `RELEASE-RUNBOOK.md`, `BACKUP-RECOVERY-PLAN.md`)
rather than inventing a new one.

A running health endpoint is **not** evidence against any row here. Liveness and
readiness say nothing about artifact identity, applied schema, or human
prerequisites.

## Status vocabulary

| Status | Meaning |
|---|---|
| `RESOLVED-LOCAL` | The drift was repaired in the repository by this task; runtime/deployment confirmation still belongs to the listed operator. |
| `OPEN` | Confirmed disagreement with an exact operator action still required. |
| `EXTERNAL` | Cannot be closed from the repository; needs account/provider/authority access. |
| `HISTORICAL` | Recorded from earlier evidence; not re-verified by this task. |

## Register

| ID | Scope | Observed drift | Evidence (task-run, 2026-09-21) | Impact | Exact operator action | Owner | Status |
|---|---|---|---|---|---|---|---|
| DRIFT-036-B-01 | Local runtime | Host Node `v22.22.3` violates the declared engine contract `>=24.20.0 <25` | `pnpm release:parity:check` → `runtime-contract` FAIL; `pnpm diagnose` fails closed naming only `node-runtime` | Release checks executed on the host are not contract-representative | Run every release/verification check with Node `24.20.0` (e.g. `nvm use 24.20.0`) before recording evidence | Local operator | OPEN |
| DRIFT-036-B-02 | Schema identity (docs) | Source migration head moved to `0035_receiving_normalization` while `EXTENDING-THE-SYSTEM.md` still documented `0034_…` | `release:parity:check` → `schema-identity` FAIL before the fix; 12/12 contract suites now PASS after correcting the documented head | A candidate would carry an undefined "documented schema identity" | None remaining locally. Keep the documented head in step whenever a new `db/migrations/NNNN_*.sql` is added | Migration author | RESOLVED-LOCAL |
| DRIFT-036-B-03 | Build integrity | HEAD did **not** build: `The symbol "describedBy" has already been declared` in `src/pages/quarantine/receiving/[receivingId].astro` (duplicated `describedBy`/`invalid` declarations) | `pnpm build` exit 1 at the frozen candidate; exit 0 after removing the duplicate pair, twice consecutively | No release artifact could exist for this candidate, so promotion identity was unprovable | None remaining. `002/027` should keep the repaired page in the regression scope | `002` / `027` | RESOLVED-LOCAL |
| DRIFT-036-B-04 | Applied schema (production) | Production database reported at applied head `0018` with `0019`–`0035` pending (read-only provider evidence, 2026-09-19); source head is `0035_receiving_normalization` | Recorded in the Mind; not re-verified by this task (no production access) | Applied schema and candidate schema are not the same schema | Run the approved forward-only migrations against the target with the migration gate and recovery posture satisfied, under explicit production migration authorization | Release authority | EXTERNAL |
| DRIFT-036-B-05 | Artifact identity | Build output was not byte-reproducible: every rebuild changed `server/manifest_<hash>.mjs` **and** `server/entry.mjs` | Before the fix: whole-tree manifest diff on 3 paths (`added`/`changed`/`missing`), reproducing the failure first recorded by 030-B. After pinning the non-secret build key and normalizing the generated chunk name: **4 consecutive builds from a clean `dist/` produced an identical tree** (`reproducible: true`, 325 files, digest `da6fc6bb…81c99`), identical `dist/server/entry.mjs` (`a12fcb45…5f816`) and stable identity `rel-e33e895d19e5b3bc`. One mid-sequence observation over a `dist/` left inconsistent by a failed normalization run showed the internal `/astro/hoisted.js?q=N` index order vary; clean builds have not reproduced it | The verified artifact and the build tree are now provable byte-identical | Re-verify with the CI-recorded manifest at promotion time. If a future build ever differs at `server/manifest.mjs` only, treat it as this hydration-index ordering and re-run from a clean `dist/` before investigating further | Build owner | RESOLVED-LOCAL |
| DRIFT-036-B-06 | Deployment pipeline | Provider Blueprint rebuilds on every deploy (`buildCommand` runs `pnpm install && pnpm run build`, `autoDeployTrigger: checksPass`) instead of promoting the verified candidate bytes | `render.yaml`; parity between CI artifact and deployed artifact cannot be proven from provider evidence | The deployed bytes are a rebuild, not the verified artifact, so DEP-003 is unproven end to end | Deploy the CI-verified artifact (or record the rebuilt artifact digest and re-run `release:verify` + the promotion gate against it) before any promotion claim. Requires deployment authorization | Deployment authority | OPEN |
| DRIFT-036-B-07 | CI execution | CI cannot run: previous run `35451577856` job `Verify` started with 0 steps — account locked for a billing issue | Recorded in the Mind; this task added a CI step that therefore could not execute | No exact-candidate CI evidence exists, so CI credit stays unclaimed | Resolve the account/billing lock, then run the workflow on the frozen candidate and attach the run ID | Account owner (`015` / `001`) | EXTERNAL |
| DRIFT-036-B-08 | Provider configuration | Live Render service diverges from `render.yaml` (runtime, health path, deploy trigger, subdomain, startup owner grant) | Recorded in the Mind (2026-09-18/19 read-only evidence); not re-verified | Source configuration is not deployment evidence; the live service is not the Blueprint | Reconcile the live service with the Blueprint (or record the approved deviation) and re-run the production-parity recheck | Deployment authority | HISTORICAL |
| DRIFT-036-B-09 | Candidate freeze | The working tree is dirty at the frozen candidate (task-owned changes) | `release-id` records `workingTree: dirty`; production release evidence refuses a dirty tree by contract | No production evidence can be produced from this state | Commit/freeze a clean candidate, then create production-bound evidence from that exact SHA | Release authority | OPEN |
| DRIFT-036-B-10 | Local DB checks | `pnpm db:migrate:check` fails closed locally because the developer `.env` sets `NODE_ENV=production` without the production-required non-secret keys (`SERVICE_VERSION`, login rate-limit pair) | `pnpm diagnose` names the missing keys only (never values) | Database-backed local checks cannot run; database regression stays with `002/027` | Use a development/test configuration locally, or supply a complete production configuration; never weaken validation to make the check pass | Local operator | OPEN |
| DRIFT-036-B-11 | Evidence binding | Machine-readable suite reports are not candidate-bound: the evidence gate validates a report's *content* and the release metadata's Git SHA, but never that the report itself came from this candidate | `release:evidence:check --require-release` consumed `.ci-results/*.json` written on 2026-09-20/21 by earlier runs and reported integration `470/470`, concurrency `12/12` and security `52/52` as if current, failing only on a stale `migrations` report (`30/33`) | Coverage can be claimed from another candidate, so a green gate is not proof for this SHA | Regenerate all four reports on the frozen candidate immediately before running the gate, and add candidate stamping to the reports (design owner decision). The stale `migrations` report must never be read as this candidate's result | `002` / `027` + 036 follow-up | OPEN |
| DRIFT-036-B-12 | CI gate (format) | `pnpm format:check` fails on 15 files, none of them in this task's diff: 11 `src/modules/quarantine/receiving/**` files, 2 receiving test files, `tests/unit/ui/record-journey-contract.test.ts`, and one audit JSON | `pnpm format:check` exit 1 listing those 15 paths (the 036-A scripts this task touched now pass) | CI cannot pass the format step | Run `npx prettier --write` on those 15 paths. This task deliberately did not reformat another workstream's in-flight files | Receiving-normalization work owner | OPEN |
| DRIFT-036-B-13 | CI gate (lint) | `pnpm lint` failed with 6 errors, all inside the 036-A release-engineering deliverables (`process` declared in a `/* global */` comment while also imported, `URL` used under `no-undef`, two useless assignments) | Before the fix: `eslint .` reported 6 errors across `scripts/release/{build-manifest,check-environment-parity,check-verification-evidence}.mjs` and `tests/unit/release/environment-parity-guard.test.ts`. After: `eslint .` exit 0 | The lint step of the CI gate was red | None remaining | Release engineering (this task) | RESOLVED-LOCAL |
| DRIFT-036-B-14 | CI gate (unit) | `pnpm test:unit` fails 5 tests in 4 files at the frozen candidate: `receiving-data-contract`, `ui/dashboard-decision-surface`, `ui/quarantine-decision-surface`, `ui/mutation-safety-contract` | `873` tests, `868` passed, `5` failed; all four files were last changed by the frozen commit. Proven pre-existing by running the affected contract against the pristine `HEAD` version of `[receivingId].astro` (failure reproduced unchanged) | Unit gate red, so the candidate cannot pass CI | The owning workstream must reconcile the new receiving/decision-surface code with its contracts; `002`/`027` then verify on a disposable database | Receiving-normalization work owner | OPEN |
| DRIFT-036-B-15 | CI gate (architecture) | `pnpm test:architecture` fails: delivery-layer violations in `quality/ncr`, `quality/capa`, `ai-advisory` (historical) **plus** new ones from the frozen commit in `quarantine/receiving/{index,new,[receivingId]}.astro` and `src/actions/quarantine.ts` importing the receiving domain directly | `pnpm test:architecture` exit 1 | Architecture gate red | Route the receiving domain access through a use case; the boundary map itself is owed by 035-A (`026` can re-plan it) | Receiving work owner + `035-A`/`026` | OPEN |

## Promotion gate

`pnpm release:promotion:check -- --plan <promotion-plan.json>` evaluates the rows
above that a promotion actually depends on, and fails closed on each of them:
same-artifact parity across target environments, forward-only migration step,
rollback preconditions for the declared failure mode, and recovery posture for a
declared high-risk migration. It deliberately does **not** treat a health check
as evidence, and it cannot close DRIFT-036-B-04, `-06`, `-07` or `-09` by itself —
those need the named authority.

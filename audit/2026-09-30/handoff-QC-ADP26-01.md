# QC-ADP26-01 — route/state/persona evidence

State: **PARTIAL / NO-GO**. QC-PAGE-F-001 remains **OPEN**.

## Changed

- Added an executable inventory for all 88 F-001 page cards, retaining each
  card's reads/writes, domain states, transaction/audit/outbox, authority and
  recovery constraints. Registry drift or missing cards fail the generator.
- Added six-persona scenario identifiers and 2,200 source visibility checks,
  including disabled/inactive sessions, Admin-only and noncanonical owner.
  The 3,696 planning rows are not a finalized applicable denominator.
- Strengthened the existing real-task direct-denial E2E with complete task,
  subject audit and aggregate outbox snapshots, applied ledger/checksum parity,
  live grant/scope projections and sanitized candidate-bound supporting proof.
- Added an evidence validator rejecting candidate/schema/build/fixture drift,
  BAD_REQUEST denial claims, mutated row/audit/outbox, unsupported N/A and
  automated human acceptance. No runtime authorization or migration changed.
- Documented the workflow in `Documents/ROUTE-ACCEPTANCE-MATRIX.md` and linked
  it from VERIFICATION and the UAT acceptance plan.

## Candidate and evidence

The audit baseline `0b1bb21bb3b4eca77862dbba1da8623044e96355` is historical.
Current local base: `60237b5071faee0c0ff301094c4b9417b20cb220`, branch `main`,
clean before task edits. Initial diff was empty; existing files were preserved.
Node 24.20.0 is selected explicitly; package contract is pnpm 11.25.0.
The pnpm executable version is NOT VERIFIED: Corepack attempted a cache write
outside the sandbox and failed with EPERM. Existing installed project tools
were invoked directly with Node 24.20.0; no dependency was installed or changed.
The final dirty fingerprint/build binding is in
`.ci-results/route-acceptance.json`; do not transplant it to another candidate.
Source migration head: `0042_immutable_lab_equipment_usage.sql`; the generator
records the full migration-set digest.

- Focused contract/page-access tests: PASS, final counts recorded in local
  verification output. Source-function coverage does not constitute page UAT.
- During evidence expansion, the E2E incorrectly assumed PERM-TASK-VIEW was
  stored in role_permissions. The real NONE-role fixture receives universal
  operational reads at `resolveActor`; the evidence now calls that same server
  resolver and retains both stored projections and derived permissions. The
  initial failed assertion is not an application authorization failure.
- PostgreSQL 18.6 was initialized in `/private/tmp/qc-adp26-01-pg` with loopback
  TLS and disposable DB `qc_adp26_01`. No production database was used.
- PG concurrency/replay + action contracts: **17 PASS / 3 FAIL** (20 cases).
  The three failures in `controlled-mutations.test.ts` concern inspection
  stage-1, HOLD-race and lab stage-1 approval; actor fixtures use MANAGER while
  the current stage-1 policy requires SUPERVISOR, so the expected successful
  approval is denied. The failures are retained; no policy/test weakening.
  This is not a PASS for controlled mutation concurrency.
- Full browser/persona/state coverage, manual AT and real participant UAT:
  **NOT VERIFIED**. No human signature, READY, production parity or finding
  closure is inferred from these changes.

## Reproducible commands and local artifacts

Commands were run with Node 24.20.0 first in PATH. Integration commands used
only `qc_adp26_01` at loopback port 55461 with verified TLS; the E2E runner uses
independent fresh disposable databases in that same cluster and randomly generated test passwords
in memory. No secret values are present in the following references.

```sh
node scripts/verification/begin-verification-run.mjs
node scripts/verification/run-vitest-evidence.mjs unit -- vitest run tests/unit/verification/route-acceptance.test.ts tests/unit/routing/page-access.test.ts
node scripts/verification/run-vitest-evidence.mjs integration -- vitest run tests/integration/concurrency/controlled-mutations.test.ts tests/integration/concurrency/idempotency.test.ts tests/integration/actions/server-contract.test.ts --no-file-parallelism
node node_modules/@astrojs/check/bin/astro-check.js
node node_modules/astro/astro.js build
node scripts/release/release-id.mjs --environment local --artifact dist/server/entry.mjs
node scripts/verification/write-build-evidence.mjs
node scripts/release/verify-release.mjs --input dist/release-identity.json
QC_ADP08_AUTHORIZATION_ONLY=true node --import=tsx scripts/verification/run-authenticated-e2e.ts
node --import=tsx scripts/verification/build-route-acceptance.ts
```

Final candidate-bound results are `.ci-results/unit.json`,
`.ci-results/integration.json`, `.ci-results/build.json`,
`.ci-results/authenticated-e2e-evidence.json`,
`.ci-results/task-direct-denial.json` and `.ci-results/route-acceptance.json`.
The direct-task proof includes a real populated DRAFT/version-1 record read by
`verify-least` followed by AUTHZ permission denial and unchanged task/audit/outbox
digests. `verify-least` is a supporting technical fixture, not one of the six
UAT personas, and cannot supply their acceptance. The reporter's RUN_CONFIG
row is metadata, not a second E2E case. Required browser widths/200% and manual
AT were not covered by that focused case.

Build/lint/typecheck/format results are technical checks only. Current typecheck
has 0 errors/0 warnings and 89 hints; build's large-chunk warning is retained.
No broader UI, scientific roundtrip, constraint audit or production readiness
claim follows. The matrix keeps all page acceptances NV even when supporting
technical evidence is attached to the task route.

The E2E safety guard refused reuse of a previously seeded database; a fresh
isolated DB was created instead. No existing yazeed account was reset. The
disposable PostgreSQL service is stopped after final evidence collection.

## Remaining decisions and coverage

All 88 page acceptances remain open. The source inventory and stale-evidence
boundary are implemented; route-specific action/state/applicability expansion
and current fixture-backed execution remain incomplete. QC/QMS must reconcile
applicable state/action combinations and contract-based N/A, scientific source
decisions and unresolved business authority. UAT-DD-001 acceptance authority
and real participant sessions remain outside automated closure.

Next evidence must bind concrete record state/version, live permissions/scope,
SoD and applicable reauthentication/signature, approved expected outcome,
applied migration checksums, artifact identity and sanitized DB before/after
row/results/audit/outbox. Re-run affected HTTP/E2E, rollback/race/replay and
browser checks at 320/375/768/1440 CSSpx and 200%; capture keyboard and manual
AT evidence. The current tool does not claim those executions happened.

No commit, push, merge, deploy, production migration or external publication.

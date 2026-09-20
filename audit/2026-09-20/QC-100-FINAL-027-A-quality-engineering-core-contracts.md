# QC-100-FINAL-027-A — Quality engineering core contracts and controls

## Candidate and environment identity

| Field | Value |
|---|---|
| Work status | **PARTIAL** overall; scoped local controls implemented |
| Frozen candidate SHA (before edits) | `2f0cfeff2d5f70d8a8b17b0cfedf07408ece70fd` (`main`) |
| Candidate base tree | `d82e11d8295df1a7008a4f94754cb129af43688c` |
| Candidate source after edits | Frozen SHA plus the nine implementation paths listed below; no commit created |
| Content-based dirty fingerprint | `d8fe4e18a2686f1ec0e44828bbdd1d627c0dc2324e8b9c101fdf82d259eeb659` |
| Fingerprint method | SHA-256 over sorted changed implementation paths; each record is `path NUL git-status NUL SHA256(file-bytes)`, records joined by LF. This report and `.agents/mind/01-mind-latest.md` are excluded to avoid self-reference. |
| Audit comparison baseline | Candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`; maturity 45.8%, gates 0/19, NO-GO (comparison only) |
| App / service version | `0.1.0` / `0.1.0` |
| Runtime / package manager | Node `v24.20.0` / pnpm `11.25.0` (both satisfy package contract) |
| Build identity | `local-2f0cfeff2d5f`; release identity `rel-ebdac9293e9a0ef1`; generated `2026-09-20T20:01:07.596Z`, environment `local`, working tree dirty |
| Built server artifact | `dist/server/entry.mjs`, SHA-256 `77a60703275f02a5e73feb3e90dbc94857672b02ef43c861064accdec07143bf`; build completed `2026-09-20T20:00:49Z` |
| Source schema identity | `0031_qc_creation_parity_two_stage_approval`, SHA-256 `44b160a6b8c09769fd7f18e19c29b2e29c98635cbf81de603a2cbbbd6324ec61` |
| Applied database schema | **NOT VERIFIED** — no reusable disposable database URL and no container runtime available |
| Evidence window | `2026-09-20T19:51:51Z`–`2026-09-20T20:10:24Z`; latest full unit run at `20:10:01Z`, latest action contract attempt at `20:09:10Z`, build at `20:00:46Z`–`20:00:49Z` |

The frozen SHA is the observed `HEAD` before changes. The Mind's 026-B entry names a different earlier candidate (`802de981…`); this report uses the actual current `HEAD` as the candidate and does not transfer evidence from either candidate.

## Requirement- and failure-mode test pyramid audit

The approved architecture describes a behavior pyramid: domain rules → use-case orchestration → PostgreSQL constraints/transactions/concurrency → authorization negatives → Astro action/API entry points → critical E2E journeys (`Documents/ARCHITECTURE-SPECIFICATION.md` §§141–147). The requirements reconciliation retains server authorization, scope, SoD, state/version, scientific precision, timezone, idempotency, and immutable evidence as mandatory contracts. This work adds no audit domain, score, or denominator change.

| Requirement / failure mode | Existing evidence at the frozen candidate | Finding and action in 027-A |
|---|---|---|
| Scientific result integrity: exact decimal preservation, invalid values, wrong units/parameters, and client-supplied official results | `tests/integration/laboratory/scientific-boundaries.test.ts`; `tests/unit/laboratory/scientific-governance.test.ts` | Kept the precision and forged-result negatives; fresh focused run passed. No scientific criteria, rounding, or policy was added. |
| Authorization and workflow: missing permission, wrong scope/state, SoD/self-approval, stale version | `tests/integration/verification/verification-access.test.ts`, `tests/integration/quarantine/inspection-review.test.ts`, domain/use-case suites | Added create-task denial at both action and use-case boundaries, including a no-write assertion. Existing scope/SoD/stale-version negatives remain. |
| Clock/randomness and test cross-contamination | Unit setup restored spies/environment but did not call `vi.useRealTimers()`; helpers had no namespaced deterministic fixture identity contract | Added automatic timer/global cleanup, repeatable scoped IDs/keys, a fixed clock, and a repeatable random stream. Mutation check: removing timer cleanup made the next-test cleanup assertions fail (2 failures); restoring cleanup returned the test and full unit suite to PASS. |
| Database constraints, transaction rollback, idempotency, concurrency, and migrations | Integration suites exercise these failure modes; many are PostgreSQL-backed. `fileParallelism: false`; 21 integration locations explicitly drop `qc` before using a reused disposable cluster. | Cross-suite schema reset is deliberate, but `QC_TEST_DATABASE_URL` is trusted to be disposable and its target is not independently verified. The authorized PostgreSQL API path could not run without a container runtime. Continue isolation hardening in 027-B. |
| Astro action entry points and malformed/unauthenticated requests | `tests/integration/actions/server-contract.test.ts` resolves UI paths and covers unauthenticated, malformed, and authorized requests | Added authenticated-without-create-authority denial. Five database-independent action contracts PASS. Both authorized and denied disposable-DB scenarios are blocked by Testcontainers startup. A direct unit action contract invokes the real create use case with a no-write repository and passes without DB. |
| UI / design QA | 33 test files read source via `readFileSync`, including 27 `tests/unit/ui` files; some pin exact implementation strings and markup | These are useful structural tripwires but brittle when implementation wording or formatting changes. Full unit run exposed a stale retest-policy phrase and an unregistered ad-hoc NCR date renderer; corrected the expectation and routed NCR dates through shared `formatDateTime`. Browser, responsive, keyboard, axe, and screen-reader checks remain owned externally. |
| Mandatory skips | Static scan found zero literal `describe.skip` / `it.skip` / `test.skip` / `.todo` / `skipIf` declarations in test files | On the attempted action integration run, Vitest marked its authorized DB test skipped because the suite `beforeAll` could not start PostgreSQL. Report that as dependency-blocked, not as an intentional skip or PASS. |

The raw test-file inventory is 105 unit, 102 integration, and 31 E2E files on this tree. These counts are descriptive only; acceptance is based on requirement/failure-mode evidence above, not volume.

## Item-by-item evidence

| Scoped item | Work status | Evidence status | Changed path(s) | Evidence | Unresolved dependency / owner |
|---|---|---|---|---|---|
| 1. Audit the test pyramid by requirement/failure mode; identify assertion gaps, shared state, brittle source checks, and mandatory skips. | **DONE** | **PASS** for the static audit; runtime database isolation **PARTIAL** | `audit/2026-09-20/QC-100-FINAL-027-A-quality-engineering-core-contracts.md` | Matrix above maps scientific, authorization, database, API, and UI risks to current checks. Zero explicit skip declarations; one suite-setup skip was reproduced and classified. 21 shared-schema reset sites and 33 source-reading test files were counted and recorded. | QC-100-FINAL-027-B to harden/verify shared-database isolation; QC-100-FINAL-002 for database regression. |
| 2. Implement isolated deterministic fixtures, clock/random controls, and API/domain contracts; prove a regression test detects the defect and retain authorization/scientific negatives. | **DONE locally** | **PARTIAL** overall: local contracts **PASS**; DB-backed API scenarios **BLOCKED** | `tests/setup/unit.ts`; `tests/helpers/deterministic-runtime.ts`; `tests/helpers/fixture-scope.ts`; `tests/unit/verification/deterministic-runtime.test.ts`; `tests/unit/actions/task-create-contract.test.ts`; `tests/integration/tasks/use-cases.test.ts`; `tests/integration/actions/server-contract.test.ts`; `tests/unit/ui/authorization-visibility-ui.test.ts`; `src/pages/quality/ncr/[ncrId].astro` | Latest full unit: `105 files / 785 passed / 0 failed` at `20:10:01Z`, including direct API action denial through the real create use case and no-write assertion. Focused preserved-negative runs: `6 files / 26 passed` at about `19:53:08Z`, and `8 files / 41 passed` at about `19:56:42Z`. Latest action contract attempt at `20:09:10Z`: five database-independent contracts passed; two disposable PostgreSQL cases were skipped after suite setup failed with `Could not find a working container runtime strategy`. Red-green mutation: 2 cleanup assertions failed when timer restoration was disabled; restored setup passed. ESLint, Prettier, and `git diff --check`: PASS. | QC-100-FINAL-002/027: rerun PostgreSQL regression and action contracts on an approved disposable target. QC-100-FINAL-003: affected E2E. QC-100-FINAL-006/040: affected UX/accessibility evidence. QC-100-FINAL-012: final reconciliation. |

## Technical checks and limits

| Check | Status | Result |
|---|---|---|
| `pnpm test:unit` | **PASS** | `105 files / 785 passed / 0 failed`, Node 24.20.0. |
| Focused authorization/science/workflow/API contracts | **PASS** | `26/26` then `41/41` across the named suites; direct task-create action denial invokes the real use case and asserts no repository write. |
| `tests/integration/actions/server-contract.test.ts` | **PARTIAL / BLOCKED** | Five database-independent contracts passed. Two disposable DB cases were skipped after suite setup failed because Testcontainers had no runtime strategy. `QC_TEST_DATABASE_URL` absent; `docker info` unavailable. |
| Red-green timer cleanup mutation | **PASS** | With `vi.useRealTimers()` removed, the next-test global-state assertions failed; restored setup passed. |
| ESLint / Prettier / `git diff --check` | **PASS** | ESLint had no errors on changed TypeScript; Astro file is outside ESLint's configured files. Prettier passed on changed TypeScript; `git diff --check` passed. |
| `pnpm build` | **PASS** | Astro server and client build completed on Node 24.20.0. Existing dependency annotation, unused import, dynamic/static import, and large-chunk warnings remain. |
| `pnpm release:identity` / `pnpm release:verify` | **PASS (local identity only)** | Verified release identity against frozen `HEAD`; identity marks the worktree dirty. This is not deployment or release approval. |
| `pnpm typecheck` | **FAIL** | 882 files; one existing `TS2353` at `tests/integration/qc-100-final-024/record-journey-linkage.test.ts:170` (`occurredAt` not in `AuditEventInput`), unchanged by this task. 76 hints; no warnings. |
| `pnpm test:architecture` | **FAIL** | Existing delivery-boundary violations in `src/pages/quality/capa/[capaId].astro` and `src/pages/quality/ncr/[ncrId].astro` (direct DB/infrastructure access); those patterns exist in the frozen source. Canonical route-file integrity separately **PASS**. No new authorization or route rule was weakened. |
| PostgreSQL schema/migration application | **NOT VERIFIED** | Source head/checksum identified; no database migration executed. |
| E2E / accessibility / human acceptance | **NOT RUN / BLOCKED** | Owner 003 for E2E, owners 006/040 for accessibility; human UAT remains excluded and must be supplied by 004. No acceptance is inferred. |

## Next phase handoff — QC-100-FINAL-027-B

Required inputs: this report and the frozen candidate identity; the deterministic controls and negative contracts above; an approved disposable PostgreSQL 18 target (container runtime or explicitly disposable `QC_TEST_DATABASE_URL`); QC-100-FINAL-002 regression baseline; QC-100-FINAL-003 E2E environment; QC-100-FINAL-006/040 accessibility scope; approved policy/authority inputs from 013/026 where applicable. Re-run applicable checks after any material source change and bind outputs to the exact candidate/build/schema. QC-100-FINAL-012 reconciles final evidence. Human acceptance remains an external dependency owned by 004. Keep policy-dependent paths fail-closed; preserve scope/state/version/SoD, idempotency, immutable evidence, and `PASS ≠ RELEASED`. Audit comparison remains 45.8%, gates 0/19, NO-GO; this task adds no scored domain and changes no denominator.

No commit, push, merge, deployment, production migration, external contact, or human acceptance execution occurred.

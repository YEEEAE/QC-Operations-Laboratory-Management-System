# QC-100-FINAL-028-A — Core contracts and controls

**Work status: PARTIAL.** The approved transition index and two local control fixes are implemented. Fresh PostgreSQL transaction evidence is blocked by the unavailable container runtime; exact-contract runtime evidence must be rerun by 002/027. No score or 80-domain denominator changed. Human acceptance execution is excluded.

## Candidate, build, and schema identity

| Identity | Value |
|---|---|
| Frozen candidate before this phase | Git SHA `0f25de0f54dbaf3249d56a25a863ec52a42b2f28`; source dirty fingerprint `ce83e6fa0a7ec51078776381bbe20878aceff8ca7cc5aac6850fa0cd741adff6` (same initial source diff and fingerprint recorded by 027-B; mind/audit excluded) |
| Final Git SHA | `0f25de0f54dbaf3249d56a25a863ec52a42b2f28` (no commit created) |
| Final source dirty fingerprint | `91ec238d37e2653fbe77dd3e6673199462a610889e72e68f3e176fb76465e3f0`; sorted `path NUL status NUL SHA256(file bytes)` rows joined with LF and SHA-256; excludes `.agents/mind/**` and `audit/**`; includes pre-existing source/test changes and this phase's source/docs/tests |
| Runtime used | Node `v22.22.3`, pnpm `11.25.0`; project requires Node `>=24.20.0 <25`, so local checks are outside runtime parity |
| Build | `pnpm build` PASS at 2026-09-21 00:23 Asia/Riyadh; Astro SSR server build. Warnings: third-party Zod annotations, unused stream import, chunk-size warning, and mixed static/dynamic template-state import |
| Release identity | PASS; `rel-5543d7477e453b02`, build `local-0f25de0f54db`, timestamp `2026-09-20T21:23:14.693Z`, dirty=true; artifact `dist/server/entry.mjs` SHA-256 `cb9b724c66e40913833300e86c390aa32ba7a97ebf0851dc7bd088c0ab405c95` |
| Source migration identity | `0031_qc_creation_parity_two_stage_approval`, checksum `44b160a6b8c09769fd7f18e19c29b2e29c98635cbf81de603a2cbbbd6324ec61` (from verified release identity). No database schema was applied by this phase. |
| Evidence times | Unit 00:21:58; typecheck completed 00:21:58; 013 integration attempted 00:21:17; build 00:23:01–00:23:05; release verification 00:23; disposable-PG fallback attempt 00:27:40; all Asia/Riyadh, 2026-09-21 |

The frozen comparison baseline remains 2026-09-19 candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`, maturity 45.8%, mandatory gates 0/19, NO-GO. No gate, score, production state, or human acceptance is inferred from this local work.

## Item-by-item implementation and evidence

| Item | Result | Changed paths | Evidence | Remaining dependency / owner |
|---|---|---|---|---|
| 1. Reconcile controlled transition contracts and two-stage approval | **DONE locally** | `Documents/STATE-MACHINES.md`, `Documents/BUSINESS-RULES.md` | Added the QC-100-FINAL-028-A transition index across QMS Finding/NCR/RCA/CAPA, receiving, inspection, laboratory, retest, equipment, calibration, maintenance, templates, controlled documents, change requests, approvals, backup/restore. The index gives exact allowed edge/transition IDs and points to the authoritative per-edge permission/scope definitions; records version, SoD, evidence and side effects; explicitly marks source-dependent/denied edges. Corrected calibration lifecycle to match the existing DRAFT/SCHEDULED/SUBMITTED/APPROVED/CURRENT/DUE/OVERDUE/COMPLETED/FAILED/SUPERSEDED/VOID implementation. Two-stage docs now state that prepared stage-2 signature evidence, the transition, receiving consequence, audit and outbox commit together. | Policy/source decisions stay open and DENY by default: PD-01/02/07 official inspection result/create source, PD-32 signature scope, PD-38 lab reject authority, and per-edge document/calibration/retest decisions. Owners: source owners via 013/026. |
| 2a. Signature evidence only for a committed final approval | **DONE in source; persistence evidence PARTIAL** | `src/modules/e-signatures/application/final-approval-ceremony.ts`, `src/shared/e-signatures/insert-signature-evidence.ts`, `src/modules/{quarantine/inspection,laboratory}/{application,ports,infrastructure}/*`, `src/modules/{quarantine,laboratory}/application/dependencies.ts`, `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts`, `tests/integration/concurrency/controlled-mutations.test.ts` | Ceremony now prepares evidence after reauthentication and current permission; owning repositories validate subject, actor, request, action, meaning and pre-transition version, then insert signature within the same transaction as the compare-and-set, audit/outbox, and required inspection→receiving update. Any stale write or Receiving HOLD conflict rolls back the signature as well. Updated the populated PostgreSQL contract so the held Receiving denial expects zero signatures. `pnpm typecheck`: 883 files, 0 errors, 0 warnings, 74 hints. `pnpm build` and release identity verification PASS. | `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` could not run against PostgreSQL: 16 tests skipped because Testcontainers reported “Could not find a working container runtime strategy”; `docker info` confirmed no daemon. No PostgreSQL 18 task-owned URL was available. Owner 002/027 must rerun the modified integration/concurrency contracts on supported Node and disposable PG18. |
| 2b. Maintenance VOID remains denied absent an approved transition | **DONE locally; focused contract PASS** | `src/modules/assets/maintenance/domain/maintenance.ts`, `tests/integration/assets/maintenance.test.ts`, `Documents/STATE-MACHINES.md` | Removed DRAFT/PLANNED→VOID from the domain transition map (`VOID` is an empty edge set); use case already denies VOID pending policy. Added a regression assertion. Focused command: 2 test files / 9 tests PASS, including maintenance and two-stage authorization contracts. | A future maintenance VOID path requires an approved source/transition contract. Owner 013/026. |

## Verification results

| Check | Result | Notes |
|---|---|---|
| Focused tests | **PASS** — 2 files / 9 tests | Includes the new maintenance VOID denial contract. |
| `pnpm typecheck` | **PASS** — 883 files / 0 errors / 0 warnings / 74 hints | Node 22.22.3 is outside the declared engine contract. |
| Targeted Prettier + ESLint | **PASS** | All changed TypeScript/test/docs paths in the command used for the phase. |
| `pnpm build` + `pnpm release:verify` | **PASS** | Local build identity above; not a production release claim. |
| 013 populated PostgreSQL integration | **BLOCKED** — 0/16 executed | Container runtime unavailable; the runner skipped all 16 and failed suite setup. A materially different disposable local PostgreSQL 14 fallback was also attempted under `/private/tmp`, but `initdb` was denied System V shared memory (`shmget: Operation not permitted`) during bootstrap; initdb removed its partial data directory. No existing database was used or altered. |
| Architecture boundary check | **FAIL** | Same 12 known NCR/CAPA delivery-layer findings in `src/pages/quality/capa/[capaId].astro` and `src/pages/quality/ncr/[ncrId].astro`, previously recorded by 027; no violation points to this phase's new shared signature helper. |
| `pnpm db:migrate:check` | **BLOCKED** | `tsx` could not create its IPC socket (`EPERM`) under both default temp and `/private/tmp`; source migration identity is available from the verified build manifest, but no live schema check ran. |
| E2E / accessibility / human acceptance | **NOT RUN / BLOCKED** | No page behavior was changed; 003 owns authenticated E2E, 006/040 own applicable accessibility review, 004 retains mandatory human evidence and its execution is excluded. |

## Scope and handoff

- Pre-existing changes were preserved: `tests/e2e/accessibility.spec.ts` and `tests/integration/qc-100-final-024/record-journey-linkage.test.ts` were not edited by 028-A. The working tree remains uncommitted and local; no push, merge, deployment, production migration, paid operation, or external contact occurred.
- Existing server authorization, scope checks, expected-version compare-and-set, SoD, idempotent replay behavior, immutable signature storage, source-deny behavior and `PASS ≠ RELEASED` remain enforced. The signature now accompanies successful final approval atomically; denied attempts leave no final-approval signature.
- The project’s 80-domain denominator and existing scored-domain set are unchanged.
- **Next phase: QC-100-FINAL-028-B. Required inputs:** this report and source fingerprint; the final paths above; supported Node `>=24.20.0 <25` and pnpm `11.25.0`; disposable PostgreSQL 18.6 with task-owned identities/data; fresh 002/027 regression and PostgreSQL evidence for stale/race/HOLD rollback/replay; 003 authenticated E2E and 006/040 applicable accessibility results; approved owner sources from 013/026 before implementing any presently denied edge; and 004 human evidence only when genuine participants/environment are available. 012 performs final evidence reconciliation. Preserve missing evidence as an external dependency.

**State: PARTIAL. Evidence status: PASS for listed local checks; BLOCKED for PostgreSQL, migration integrity and dependent owner evidence; FAIL for the known architecture boundary gate; NOT RUN for E2E/accessibility/UAT.**

# QC-100-FINAL-027-B — Integration and technical evidence

**Work status: PARTIAL.** Evidence capture and regression/UI technical QA are complete for the local disposable candidate. The authenticated browser suite has unresolved failures owned by 003/006/040; architecture boundary findings also remain open. Human acceptance execution is excluded and remains with 004. No score or 80-domain denominator changed.

## Candidate and environment

- Frozen candidate before execution: Git SHA `0f25de0f54dbaf3249d56a25a863ec52a42b2f28` (`main`, equal to `origin/main`); initial worktree clean. This is the supplied 2026-09-19 comparison candidate's descendant/current checkout; audit comparison remains maturity 45.8%, gates 0/19, NO-GO.
- Final content-based dirty fingerprint: `ce83e6fa0a7ec51078776381bbe20878aceff8ca7cc5aac6850fa0cd741adff6`. Method: sort changed paths; for each hash UTF-8 `path NUL git-status NUL SHA256(file bytes)`; join records with LF and SHA-256 the result. Included paths: `tests/e2e/accessibility.spec.ts` (status ` M`, SHA-256 `639941f9fdf861b8aa13d2b480a6091911318849a3cadf57122ad832001679b8`) and `tests/integration/qc-100-final-024/record-journey-linkage.test.ts` (status ` M`, SHA-256 `c73cf9837fe4fe9b195d50e0303aefd0c4a95017121c8f4e9f826bc110577038`). Audit and Mind files are excluded from the content fingerprint.
- Runtime: Node `24.20.0` (contract `>=24.20.0 <25`), pnpm `11.25.0`, service/application version `0.1.0`; PostgreSQL `18.6`, local task-created TLS cluster on loopback only, task-owned `qc_test` and `qc_disposable` databases. Existing `.tmp/pg18` data was left untouched. No production database used.
- Final production build command `pnpm build`: PASS at 2026-09-21 00:04 Asia/Riyadh. Release identity verification: PASS at 00:04. Release `rel-b0f16d11074be10f`, build `qc-027b-final-0f25de0f54db`, build timestamp `2026-09-20T21:04:56.899Z` UTC; artifact `dist/server/entry.mjs`, SHA-256 `c91a60f8afeee443d76abf71bd0b0ce93d4d8ab5e2226318bf429b9531941705`. Identity records `dirty=true` and the frozen Git SHA above.
- Schema/source identity: source and disposable DB migration head `0031_qc_creation_parity_two_stage_approval`, checksum `44b160a6b8c09769fd7f18e19c29b2e29c98635cbf81de603a2cbbbd6324ec61`. `db:migrate:check` PASS (31 migrations); `db:schema:check` PASS (31 migrations, 77 tables, 0 orphans). E2E runner migrated only the task-owned disposable database. No production migration ran.
- Evidence timestamps: full unit start 2026-09-21 00:01:52 Asia/Riyadh; full PostgreSQL integration start 00:01:55; build/release 00:04; report finalized 00:05. Machine-readable wide E2E summary: `.ci-results/qc-100-final-027b-authenticated-e2e-evidence.json` (generated during the same candidate run; status FAIL).

## Item 1 — Risk-based regression across unit, PostgreSQL integration, contracts, and authenticated E2E

**Status: PARTIAL.** Coverage and evidence were produced; broad authenticated E2E is not passing.

| Layer | Evidence | Result |
|---|---|---|
| Unit | `pnpm test:unit` on Node 24.20.0, final source tree | PASS — 105 files / 785 tests, 0 failures, 2026-09-21 00:01:52 Asia/Riyadh, 9.51s. |
| PostgreSQL integration | `pnpm test:integration` on local TLS PostgreSQL 18.6, `qc_test` disposable DB | PASS — 102 files / 470 tests, 0 failures, 2026-09-21 00:01:55, 23.34s. Includes server contract tests (6 tests) and QC-024 record journey integration (5 tests). |
| Risk gates | `pnpm test:migrations`, `pnpm test:concurrency`, `pnpm test:security` against the same task-local PostgreSQL 18.6 | PASS — 29/29, 12/12, 52/52 respectively. |
| Type contract | `pnpm typecheck` on Node 24.20.0 | PASS — 882 files, 0 errors, 0 warnings, 75 existing hints. |
| Authenticated browser E2E | `pnpm verify:e2e:authenticated`, production build, one worker, disposable identities/data on `qc_disposable`; broad run report at the path above | FAIL / PARTIAL — reporter totals 17 passed / 27 failed / 12 skipped across 56 scenarios. Playwright console counted 16 passed / 27 failed / 10 skipped / 2 did not run; the reporter's aggregation differs by one configuration pass and folds the two not-run tests into skip. A later focused final-tree rerun of the two affected login tests passed 2/2 in 1.1m; this does not convert the broad run to PASS. |

The first integration execution exposed a QC-024 test fixture pointing at inspection templates instead of lab-test templates, a redundant shared-pool close, and an invalid audit input field. Those test defects were corrected in `tests/integration/qc-100-final-024/record-journey-linkage.test.ts`; the focused suite passed 5/5 and the complete integration suite then passed 470/470. This changes test setup/teardown only; no application runtime behavior or authorization policy changed.

The broad E2E run's major unresolved failure was authenticated accessibility storage state not being written/read (`test-results/.a11y-authenticated-state.json` missing), which caused dependent cases to fail. Other failures include route assertions, missing seeded record IDs in critical workflows, an AI page timeout, and report-export expectations. The password-toggle locator was corrected to remain stable when its accessible label changes, and login tests received 60s timeouts to accommodate the Three.js shell plus axe scan. Both affected tests passed on the final tree. Full broad E2E was not rerun after this test-only correction. Owner 003: fixture/session bootstrap and authenticated workflows. Owners 006/040: accessibility and responsive/keyboard evidence. Human acceptance remains excluded (004).

The generic `QC_TEST_DATABASE_URL` trust concern across 21 schema-reset test locations remains open: this run used an explicitly created task-owned disposable cluster/database and did not prove arbitrary configured targets are safe. Docker/Testcontainers execution path remains NOT RUN because Docker was unavailable.

## Item 2 — Technical UI QA for route/state/copy/component consistency

**Status: DONE for local technical contracts; PARTIAL for browser/accessibility breadth.**

- Focused UI governance/authorization/record-journey contracts: 5 files / 44 tests PASS (`register-surface-contract`, `copy-governance-contract`, `design-governance-contract`, `authorization-visibility-ui`, `record-journey-contract`) on final source tree.
- Full unit suite also passes 785/785. PostgreSQL server-contract coverage passes within integration (6 tests), including authorized and denied action paths. These checks preserve server-side authorization; UI visibility is not treated as an authorization boundary.
- `tests/e2e/accessibility.spec.ts`: changed the password toggle to a stable `[data-password-toggle]` locator and explicitly checks its changed accessible name; increased timeout for the two expensive login tests without weakening assertions. Final focused run: 2/2 PASS, 1.1m.
- Prettier check, ESLint on both changed files, and `git diff --check`: PASS after final edits.
- `pnpm test:architecture`: FAIL with 12 pre-existing boundary violations confined to `src/pages/quality/capa/[capaId].astro` and `src/pages/quality/ncr/[ncrId].astro`, consistent with 027-A. The command short-circuits before route-integrity checks. These paths were not changed here.
- Full browser route/state and a11y matrix is PARTIAL/FAIL as recorded under item 1. No human UAT or acceptance session was run.

## Evidence, limitations, and handoff

- `PASS` describes only the named check and candidate. It does not mean RELEASED, UAT passed, production verified, or all accessibility requirements met.
- The wide E2E failure JSON is retained for review; transient Playwright auth state/traces were not retained as deliverables. Generated secrets were held in process environment and disposable storage only. Credentials were not written into the audit report.
- No new scored discipline/domain was added. Existing audit domains 1, 2, 3, 43, 44, 45, 55 remain the mapping; denominator stays 80. Scores remain evidence-derived and were not recalculated.
- Changed paths: `tests/integration/qc-100-final-024/record-journey-linkage.test.ts` and `tests/e2e/accessibility.spec.ts`. Evidence artifact: this report and `.ci-results/qc-100-final-027b-authenticated-e2e-evidence.json`.
- Downstream owners: 002/027 consume the fresh regression evidence; 003 resolves fixture/session and authenticated workflow failures; 006/040 finish applicable accessibility/browser checks; 013/026 resolve requirement/authority gaps where applicable; 004 retains human acceptance evidence; 012 performs final evidence reconciliation and score derivation.
- Next phase: **QC-100-FINAL-012 final evidence reconciliation**. Required inputs: this report and exact candidate identity/fingerprint; current 002/027 regression evidence; 003's corrected fixture/session E2E rerun; 006/040 applicable accessibility evidence; 013/026 approved policy/authority sources for unresolved claims; and 004 human acceptance evidence when executed. Preserve the 2026-09-19 comparison baseline (45.8%, 0/19, NO-GO) and do not infer gate closure from this local evidence.

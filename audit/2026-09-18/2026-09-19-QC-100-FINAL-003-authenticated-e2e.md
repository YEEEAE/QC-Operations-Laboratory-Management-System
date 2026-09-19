# QC-100-FINAL-003 — Authenticated E2E handoff

## Status

- Work: **PARTIAL**
- Evidence: **FAIL** for the executed candidate run; authenticated closure is not proven.
- UAT claim: **false**. These are engineering Playwright results only.

## Candidate and environment

- Candidate SHA: `bb42d6b51dc2754901dca6f84c4351c6ed36b766`
- Build ID: `qc-closure-bb42d6b51dc2`
- Release ID: `rel-333795d813025d10`
- Migration head: `0030_reject_reports_role_parity`
- Migration checksum: `8297eb76a726ee1313dfa69946cca51115e93308ea5a3d90510300b922c46859`
- Runtime: Node `v22.22.3`, pnpm `11.25.0`; project contract requires Node `>=24.20.0 <25`.
- Database: disposable local PostgreSQL `18.6`, TLS, isolated `qc_test` database on local port `55432`; cluster was stopped and removed after the interrupted follow-up.
- Working tree was dirty before this task; no commit, push, deploy, production migration, or external write was performed.

## Executed evidence

Command shape (credentials omitted and generated in-process):

```text
DATABASE_URL=<disposable-local-tls-url> QC_TEST_DATABASE_URL=<same>
QC_VERIFY_*=<generated disposable values>
E2E_EVIDENCE_OUTPUT=.ci-results/qc-100-final-003-authenticated-e2e-evidence.json
pnpm verify:e2e:authenticated
```

The runner built the exact candidate, generated release identity, migrated the database, provisioned the five disposable `verify-*` personas, left `yazeed` untouched, started the built server, and ran the selected E2E files with Playwright.

Machine-readable evidence: `.ci-results/qc-100-final-003-authenticated-e2e-evidence.json`.

Counts: `11 PASS / 10 FAIL / 16 SKIP`; duration approximately `2m`. Mandatory workflow fixture IDs were absent, so receiving/laboratory/document/file/report/stale-version scenarios did not execute. The 16 skips are not evidence of success.

## Findings and changes

- The run reproduced an unsafe login hidden `returnTo`: an external URL was preserved in the login form. `src/pages/login.astro` now normalizes it through `safeReturnTo`.
- The runner now accepts an explicitly supplied non-production `QC_TEST_DATABASE_URL` as the approved local disposable equivalent when Docker is unavailable. Production-host guards remain in place.
- The runner binds general authenticated suites to the disposable employee credentials and uses one Playwright worker to reduce rate-limit contention. This does not create missing domain records.
- Focused auth/return-target verification: `3/3 PASS` (`safe-return-to` unit and auth-action contracts).

## Remaining blockers

- Full six-persona authenticated workflow coverage remains **NOT VERIFIED**: no disposable representative records were seeded for all required domains, so the required `QC_E2E_*` IDs were absent.
- The executed candidate had `10 FAIL`, including login returnTo behavior captured before the fix and several browser timeout failures. The follow-up rerun after the fix was interrupted by the user and was not claimed.
- 16 scenarios remained skipped; acceptance requires zero mandatory skips.
- Node contract mismatch remains (`22.22.3` vs `>=24.20.0 <25`).
- Docker/Testcontainers was unavailable; the local PostgreSQL equivalent was used only after explicit local execution approval.

## Downstream impact

QC-100-FINAL-003 remains open. QC-100-FINAL-004/005/006 must not be marked complete by implication. A next run needs a Node-24 contract runtime, a fully populated disposable fixture pack with machine-readable IDs, clean single-worker execution, and a fresh evidence read-back on the same candidate.

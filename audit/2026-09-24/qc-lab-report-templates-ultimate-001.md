# QC-LAB-REPORT-TEMPLATES-ULTIMATE-001 — Evidence

Date: 2026-09-24  
Source commit: `7b6a28761ccaf4140f9986987d337b0e2839bb3f`  
Verification run: `ef93392c-c413-4b1b-966a-251b94bb72f6`  
Source fingerprint at run start: `d7f75158987dac231b95eb33c8c0961b964ba3a13bd6e5fbbb18910d027d942b`

## Implemented

- Kept report drafts in their own PostgreSQL repository/table and out of `lab_tests`; repository writes version updates and append-only audit events transactionally.
- Enforced active-account permission and owner/global scope at the application boundary; prevents report-type changes and stale-version overwrites.
- Preserved submitted measurement and date text without inferred units, thresholds, calculations, or pass/fail rules. The source-approved form and revision were not present, so fields remain transcription-only.
- Added strict payload validation, 12 identified sample rows, print view with draft/version identity and transcription warnings, and unsaved-change guard.
- Added repository unit/integration coverage and feature documentation/route/permission inventory entries.

## Verification

| Check | Result |
| --- | --- |
| Feature unit tests | PASS — 6/6 |
| Typecheck (`astro check`) | PASS — 971 files, 0 errors, 0 warnings, 89 hints |
| Production build | PASS — Astro server and client build completed |
| Architecture check | PASS |
| Requirements check | PASS — 100 requirements, 34 risks, 20 gaps, 33 decisions, 80 domains |
| Full unit suite | PARTIAL — 128 files passed, 7 failed; 1,005 passed / 8 failed / 1,013 total. Failures are in unrelated pre-existing UI/release contract cases. |
| Full integration suite | BLOCKED/FAIL — container runtime unavailable; 44 files failed, 63 passed, 219 skipped; 3 assertions failed in existing unrelated integration cases. PostgreSQL-backed feature test did not obtain a database. |
| Migration suite | BLOCKED — all 33 cases skipped after Testcontainers could not find a container runtime. |
| Targeted lint | PASS — changed TypeScript modules and feature tests |
| Full lint | PARTIAL — existing findings in untouched audit/security scripts |
| Format check | PARTIAL — repository check reports eight untouched files; Astro parser unavailable in configured Prettier |
| Browser/E2E and accessibility runtime | NOT RUN — no running authenticated application/browser test environment |

## Limits

The feature unit tests and build do not prove PostgreSQL migration/application, browser behavior, source-form fidelity, scientific correctness, approval, or release. No production database was used or mutated. PostgreSQL-backed evidence remains blocked until an authorized disposable PostgreSQL 18 test runtime is available.

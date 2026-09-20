# QC-100-FINAL-030-A — Core security contracts and controls

## Candidate and evidence identity

- Frozen base candidate before execution: `df647bc455e55fbec879661e898d147ffbec94e3`.
- Current Git SHA: `df647bc455e55fbec879661e898d147ffbec94e3`; working tree is dirty.
- Content-based dirty fingerprint: `b236c6ceb0ef425a2eed2ad1cc33cfcc0ca0e628773047af95a1d2154a8a1153`.
  - SHA-256 over sorted changed file paths and file bytes with length framing; excludes this report and `.agents/mind/01-mind-latest.md` only.
- Build/runtime: Astro Node standalone build PASS; Node `v22.22.3` (outside declared `>=24.20.0 <25`), pnpm `11.25.0`.
- Build artifact: `dist/server/entry.mjs`, SHA-256 `d6333634bd3f8b49356e890933a9613e06176f7e7bbc6b7f1f4a768251721f43`.
- Release identity: `rel-ac6ee814ab689750`, build `qc-100-final-030-a-20260921`, local/dirty, identity verification PASS.
- Schema identity: source migration head `0033_controlled_document_execution_context`, checksum `6b4cf38ab8974ba0dbb30fc4cccb766dac3351796f4d84eb5bf226de0d75c472`. Applied schema NOT VERIFIED; no database migration was run.
- Final evidence capture: `2026-09-20 22:29 UTC` (`2026-09-21 01:29 Asia/Riyadh`); the dependency-audit registry failure was observed at `22:23 UTC`.
- Scope denominator remains 80; no scored domain was added. `PASS != RELEASED`.

## Item 1 — Scoped threat model

**Work state: DONE. Evidence state: PASS for documented scope and linked source checks; NOT VERIFIED for full operational/security assessment.**

- Changed path: `Documents/THREAT-MODEL-030.md`.
- Covers identity/session, actions/API, uploads, evidence download, exports, evidence/AI ingestion, dependency delivery, and infrastructure boundaries.
- Each row names its controls and executable checks. Existing server-derived actor, authorization, scope/state/version/SoD, idempotency, AI advisory-only and redacted-error contracts are retained.
- Related source paths are cited in the threat model; no policy-dependent behavior was asserted as approved.
- Unresolved: exact-head remote CI, production/proxy configuration, PostgreSQL-backed evidence and external data-processing approval remain dependencies of 002/027, 012, and 013/026 as applicable.

## Item 2 — Input/output, CSRF/session, error, and file controls

**Work state: PARTIAL. Evidence state: PASS for focused local checks; BLOCKED/NOT VERIFIED for database, registry, scanner, and retention evidence.**

- Changed paths: `src/shared/files/{file-repository,file-service,local-object-store,object-store,postgres-file-repository,s3-object-store}.ts`; `tests/integration/shared/{files,object-store}.test.ts`; `tests/unit/security/astro-origin-contract.test.ts`; `.github/workflows/ci.yml`.
- File metadata and evidence-link insertion now share one PostgreSQL transaction. If persistence fails after object upload, FileService attempts private-object deletion and rethrows the persistence error; if compensation also fails, an AggregateError retains both causes rather than reporting a clean rollback.
- Both local and S3-compatible stores now implement deletion for that compensation path. Upload authorization, safe-name checks, executable rejection, MIME syntax, 25 MiB ceiling, selected signature checks, SHA-256, canonical evidence-link resolution, download authorization and digest verification were reused.
- CI now runs `pnpm audit --audit-level high` after frozen dependency installation. This installs a gate but does not itself establish the present lockfile's advisory result.
- Astro Origin protection remains enabled (`security.checkOrigin: true`); a contract test now guards this setting. Existing opaque session cookie, security headers, safe action errors and redacted logging were verified through focused tests.
- Local focused suite: **113/113 PASS** across 15 files, including file compensation success/failure, object-store contract, Astro origin setting, session, headers, reporting export safety, AI security/evals, action and authorization contracts.
- Typecheck: **884 files, 0 errors, 0 warnings, 74 hints — PASS**.
- Targeted ESLint: PASS after preserving both causes on cleanup failure. Targeted Prettier: PASS. `git diff --check`: PASS.
- Build: PASS; emitted existing bundler warnings (Zod annotation, unused logger import, mixed static/dynamic import, large Three.js chunk). Release identity verification: PASS for the artifact above.
- PostgreSQL report-export parity suite: BLOCKED before tests because no container runtime strategy was available (8 cases skipped); atomic Postgres transaction was typechecked but not executed against PostgreSQL in this phase.
- `pnpm audit --audit-level high`: BLOCKED by registry DNS (`ENOTFOUND` / fetch failed); no advisory/no-vulnerability claim is made.
- `REQ-FILE-008`: approved content-type/size/scanning policy and approved malware scanner/data path are still missing. Current defensive checks/25 MiB limit do not replace that policy; no scanner was invented.
- Retention and periodic orphan reconciliation: POLICY-DEPENDENT and NOT VERIFIED. Upload-time compensation covers the partial-write path; retention, historical orphan cleanup, and operational handling if object deletion fails still need an approved owner/policy. No existing upload/download HTTP route was found in this source tree.
- Evidence/API output sanitization and actual cookie-authenticated browser CSRF behavior remain bounded by existing implementation plus source/config tests; full browser/E2E remains owner 003.

## Handoff to QC-100-FINAL-030-B

**Overall work state: PARTIAL.** Item 1 is DONE; item 2 is PARTIAL. No production schema, credentials, external service, paid service, or remote repository was changed.

Required inputs for B: this candidate SHA/fingerprint/release identity; a supported disposable PostgreSQL 18/Testcontainers runtime for `createWithEvidence` and report-export parity; registry access to resolve the dependency audit; owner-approved `REQ-FILE-008` scanner/data path and MIME/size policy; and retention/orphan lifecycle authority. B should rerun any affected checks against its frozen candidate and hand final reconciliation to 012. Human acceptance remains external and excluded.

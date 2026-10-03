# QC-POST-100-008 — Exact-HEAD reconciliation

**State: PARTIAL / BLOCKED — PostgreSQL 18 acceptance NOT VERIFIED.**

## Candidate and reconciliation

- Exact HEAD: `64b5dcf7bc0a4bca7ae74e785bba7fcd950e6751` (`main`), clean tracked/untracked worktree at task freeze. The evidence files and Mind ledger were written afterward, so the final worktree is intentionally dirty; no final dirty-tree fingerprint is claimed as an accepted result.
- Candidate-freeze source fingerprint: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` using the repository's `evidence-identity.mjs` algorithm. It identifies the frozen source before this task's evidence-only edits.
- Host Node is `v22.22.3`; supported project range is `>=24.20.0 <25`.
- Current source migration inventory is 45 files, head `0045_provider_attestation_nonce_replay_guard.sql`; the aggregate SHA-256 of the ordered `{file, file SHA-256}` list is `290d0570d22496be5b8acbb037e0d1f563bf8afc89a6fc5aa91ff53104729588`.
- The ignored `.ci-results/QC-POST-100-008.json` binds to `35284d53578b66b71adcf7f3e5b5a80e38c514a8`, fingerprint `781ea220…`, and migration 0043. It is **STALE** for this candidate. Earlier test counts are not current evidence.
- The historical full-system report binds to `6059e177438d8ae110c99084d32758b048f22cd2`; its 48 integration failures, 10 integration skips, migration/concurrency failures and security PASS are **HISTORICAL**, not current acceptance.
- The prompt-pack record itself lists the gap as unproven PostgreSQL behavior and its source handoff as lacking PG18/container availability. No current-PG18 defect is reproduced, so no application repair or migration is authorized or justified from the available evidence.

## Blocker and coverage

- Docker CLI exists, but the daemon socket is absent. `QC_TEST_DATABASE_URL`, `DATABASE_URL`, and verification password environment values are unset. The host reports PostgreSQL client 14.19 and a local default endpoint accepting connections; that endpoint was not used because it is not an authorized disposable PostgreSQL 18 target.
- No named authorized isolated PG18 target or fixture identity was available. Therefore migration/checksum application, schema digest, applied head, constraints/indexes/orphans, normal/negative role fixtures, row snapshots, fault injection, rollback, race/replay, direct negative route requests, and browser/E2E traces are all **NOT RUN**.
- `pnpm test:migrations`, `pnpm test:integration`, `pnpm test:concurrency`, `pnpm test:security`, `pnpm db:migrate:check`, and `pnpm db:schema:check` were not invoked: this execution environment cannot meet the required PG18 target and Node runtime preconditions. No skipped suite is represented as a pass.
- Source-side migration inventory was hashed only. This does not prove checksums in an applied database. `schemaDigest`, applied ledger, build identity, fixture identity and PG18 major remain null.
- No production DB was contacted or changed; no migration, commit, push, deploy or policy edit occurred.

## Evidence files

- `candidate.json` — SHA, dirty fingerprint, source migration identity and environment classification.
- `scope-db-auth-manifest.json` — assigned row/suite scope and explicit absence of target, live schema, fixtures and route expansion.
- `commands-and-results.json` — fresh capability observations and honest `NOT RUN` suite counts.

## Required next evidence to resume

1. Provide/enable an authorized isolated disposable PostgreSQL 18 target (or supported container runtime) and supported Node 24.20.x; do not reuse the local PG14 endpoint.
2. Freeze a fresh candidate identity and derive route, table/column, role/permission/scope/state/version and transaction scope from the current route registry and source repositories.
3. Run clean/upgrade/no-op migration and checksum checks; verify schema digest, constraints, indexes, foreign keys/orphans and fixture identity.
4. Execute applicable integration, migration, concurrency and security suites; capture exact counts, skips and exits. Exercise rollback/failure points, duplicate/replay and races with before/after record/history/audit/outbox snapshots and 0 unauthorized writes.
5. Collect any applicable authenticated HTTP/browser evidence and bind all artifacts to the same SHA, source fingerprint, schema, migration ledger and build identity. Human UAT/provider acceptance remains independently required where applicable.

# QC-100-FINAL-001 — Production PostgreSQL, Render and release parity recheck

**Work status:** `PARTIAL / BLOCKED`  
**Evidence status:** production DB parity `BLOCKED`; Render source/deploy SHA `PASS`; live health `PASS`; internal release identity `NOT VERIFIED`; authenticated smoke `BLOCKED`; exact-head CI `BLOCKED`.

## Candidate freeze and environment

- Repository: `main`, exact HEAD `31ab21a70ca479e8735d04835b5df62cafc9bc5a`; working tree clean at freeze and handoff.
- Source migrations: 30 SQL files; source head `0030_reject_reports_role_parity` (filename inventory). This is source truth only.
- Provider: Render Production web service `srv-dadqj67qj5pc7395rv2g`; database `dpg-dadqmsgn74is73b774j0-a`; environment `Production` (unprotected); PostgreSQL 18, Free plan, expiry `2026-10-05` (provider view).
- Latest provider deploy: `dep-dan2jvfavr4c73a29r50`, `live`, trigger `new_commit`, SHA `31ab21a70ca479e8735d04835b5df62cafc9bc5a`, finished `2026-09-19T06:24:05.864404Z`. Source/provider SHA parity is verified. Provider API did not expose an application build ID; application release identity was not established.
- Local runtime observed: Node `v22.22.3`, outside project `>=24.20.0 <25`; the available Homebrew `node@24` path also reported `v26.0.0`. No local build was run under the supported Node runtime for this candidate.

## Database and session contract

Direct production database access was **not attempted**. The approved connection document requires completing QC-100-FINAL-015 and rotating the documented-compromised credential before any production connection. Render's PostgreSQL Recovery page confirms PITR restore is paid-only, exports/backups are unavailable on Free, and there are zero exports. The credentials panel shows one default credential; no rotation was performed. The database is scheduled to expire on 2026-10-05. QC-100-FINAL-015 remains blocked, and the pre-migration production backup/restore gate is unmet. The ignored local `.env` has provider-export names and noncanonical `Database_URL`, but no canonical `DATABASE_URL`; values were not printed or copied. No canonical preflight, migration status, checksum, schema/orphan, or wire TLS/session query was executed. Therefore the production applied head, pending count, checksums, table/orphan counts, TLS, and session settings are all `BLOCKED / NOT VERIFIED`; the historical applied head `0018` is not reused as current proof.

Current source contract was inspected: `src/shared/database/pool.ts` requires TLS for network connections, rejects `sslmode=disable`, defaults certificate validation to `rejectUnauthorized: true`, and applies `search_path=qc,pg_catalog` plus `timezone=UTC`. Source contract does not prove the production wire/session state.

QC-100-FINAL-015 remains `PARTIAL`: QC-100-FINAL-008 proved a populated local disposable-PG18.6 backup/isolated restore on a different candidate, but provider backup, PITR/WAL, retention and isolated provider recovery remain `NOT VERIFIED / BLOCKED`. QC-CLOSURE-014 remains `PARTIAL`; its runtime performance, exporter, alerting and production evidence do not close the prerequisite to accept Reject behavior. No production migration was run.

## Render configuration and release

`render.yaml` declares Node, `NODE_VERSION=24.20.0`, frozen pnpm install/build, `node dist/server/entry.mjs`, readiness `/api/health/ready`, `checksPass`, `qclevel.top`, and enabled Render subdomain. The fresh Render CLI read still reports:

- runtime/env `rust`;
- empty health check path;
- `autoDeployTrigger=commit` (`autoDeploy=yes`);
- Render subdomain disabled;
- start command `SYSTEM_OWNER_LOGIN_IDENTITY=yazeed pnpm access:grant-system-owner; node dist/server/entry.mjs`, a startup-time authorization mutation with a semicolon that does not fail-fast;
- same frozen-install/build commands as the Blueprint;
- production database/service region Oregon; database plan Free; `ipAllowList=0.0.0.0/0`.

The authenticated Dashboard Environment page showed these keys only; all values remained masked: `DATABASE_URL`, `HOST`, `NODE_ENV`, `NODE_VERSION`, `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_SECONDS`, `SERVICE_VERSION`, `SESSION_SECRET`. The six required `RELEASE_*`, eight AI-provider, and two OTEL keys were absent. `NODE_VERSION` is present, but its configured value was not revealed; `render.yaml` expects `24.20.0`, while the provider labels the service runtime `rust`. The service URL list contains `qclevel.top`, `www.qclevel.top`, and the Render hostname; domain verification/DNS state was not checked. The application `DATABASE_URL` target (internal vs external) was not inferred from its masked value. The app's unauthenticated `/api/system/release-identity` probe returned 401, so the internal release identity is `NOT VERIFIED`.

Public HTTP smoke after the deploy completed:

| Probe | Result |
|---|---|
| `GET https://qclevel.top/api/health/live` | HTTP 200 |
| `GET https://qclevel.top/api/health/ready` | HTTP 200 |
| `GET https://qclevel.top/api/system/release-identity` | HTTP 401 (expected unauthenticated boundary; identity not observed) |
| `GET https://qclevel.top/reject-reports` | HTTP 303 to login; authenticated page not exercised |

Thus health and public routing pass, but neither health response proves applied migration parity or a working authenticated Reject page. No owner credential or production session was used; disposable verification credentials were not replayed against production.

## CI and exact-candidate evidence

GitHub `Verification CI` run `35426396304` is for the frozen exact SHA and failed before any job step. GitHub annotation: account locked due to billing issue. This is an external CI blocker, not a test assertion failure or pass. The provider deployment nonetheless reached `live` because its current trigger is `commit`, contradicting the Blueprint's `checksPass` contract.

## Changes, rollback and authorization

No source code, migration, provider configuration, credential, DNS record, database, or service state was changed. No commit, push, deployment, migration or restart was initiated. The only repository edits for this handoff are this evidence report and the current deployment/Mind status notes.

Concrete parity changes to prepare after gates: remove the startup grant and use exactly `node dist/server/entry.mjs`; reconcile service runtime, health path, deploy trigger and subdomain policy to the approved Blueprint; move `DATABASE_URL` to the provider's internal endpoint where supported and narrow public access; set/verify release identity and required environment-variable presence; verify domain binding; then build/promote the exact candidate through checks-gated flow. No provider update is authorized by this task without explicit target/impact authorization.

Rollback evidence: no production mutation means no rollback is needed now. The previous recorded deploy is `dep-dan1ah3tqb8s73a53di0` on SHA `95d1380f2f463bad911d6ee041ae6a7f45cbf897` (deactivated after the new deploy); it is only a candidate recovery reference, not an approved rollback or proof of compatibility. Migration rollback is not prepared: project migrations are forward-only; production backup/restore evidence is absent. Do not run migrations until QC-100-FINAL-015, the credential gate, and migration review are complete.

## Commands and evidence paths

Read-only commands used:

- `git rev-parse HEAD`; `git status --short --branch`
- `render services --output json` and read-only Render Dashboard Service Settings, Environment, PostgreSQL Recovery, and Info pages (secret values were not revealed or copied)
- `render deploys list srv-dadqj67qj5pc7395rv2g --output json` (output filtered to deploy id/status/trigger/SHA/times)
- `gh run list --limit 5 --json databaseId,name,headSha,status,conclusion,event,createdAt`
- `gh run view 35426396304`
- `for p in /api/health/live /api/health/ready /api/system/release-identity /reject-reports; do curl -sS -o /dev/null -w '%{http_code}' "https://qclevel.top$p"; done`
- source inspection of `render.yaml`, `src/shared/database/pool.ts`, and migration filenames.

Approved connection and deployment contracts: `Documents/RENDER-DATABASE-CONNECTION.md`, `Documents/RENDER-DEPLOYMENT.md`, `Documents/RENDER-MIGRATION-RUNBOOK.md`. Prerequisite evidence: `audit/2026-09-18/2026-09-18-qc-closure-014-performance-reliability-observability.md`, `audit/2026-09-18/2026-09-18-qc-closure-015-backup-restore-deployment-production-evidence.md`, and `audit/2026-09-19/QC-100-FINAL-008-populated-backup-isolated-recovery.md`.

## Handoff

Acceptance is not met. Remaining blockers: rotate compromised DB credential and complete QC-100-FINAL-015; use the approved canonical read-only DB flow to establish live head/checksum/schema/TLS/session parity; complete QC-CLOSURE-014 prerequisite evidence before accepting authenticated Reject behavior; reconcile Render config and inspect env/domain presence through an authorized Dashboard/API view; establish application release/build identity; obtain exact-head CI after the billing lock clears; then exercise both owner pages and Reject with an authorized production or approved staging identity. Downstream tasks QC-100-FINAL-002 (CI), QC-100-FINAL-003 (authenticated E2E), QC-100-FINAL-008/015 (recovery/provider DB gate), and QC-CLOSURE-014 remain open independently.

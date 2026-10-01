# QC-ENV26-05 — Canonical Render key and operator environment isolation

**Finding:** QC-ENV-F-004  
**Position:** after QC-ADP26-14; original task IDs preserved  
**Page:** `/system/health`  
**State:** PARTIAL — local configuration contract clarified; Render read-back and isolated PostgreSQL proof remain open

## Candidate and evidence identity

| Item | Result |
|---|---|
| Frozen branch / HEAD | `main` / `04d76a2b06d39940ac81c973d820cc47c180aba9` |
| Initial tree | Clean; initial dirty fingerprint SHA-256 empty `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Final dirty fingerprint | `sourceFingerprint` in `.ci-results/run-context.json`, generated after final handoff and workspace-map update |
| Verification date / runtime | 2026-10-01 (Asia/Riyadh); Node `24.20.0`, pnpm `11.25.0` |
| Current source migration set | 42 files through `0042_immutable_lab_equipment_usage`; row-by-row SHA-256 comparison with the existing source manifest: 42/42 match |
| Existing evidence hashes | Render comparison `929bcbfe143b6df39506c868a248997dd1c9e98c2e89ba92adfb224fc6579ce8`; database snapshot `d10223f4ab1a222bc21d1126a63573ef5f351dd2a63c3c54371f377aefe0fbc6`; source manifest `328c549688ad342c6df6246ea9187b98a211d4d04644e296ca71911e040b8955` |
| Render snapshot identity | Latest deployment was `update_in_progress` at SHA `6f12fecdd58acb89d6c0fceb5a8c20b33101b628`; last listed live deployment SHA `831a0f4396e2ae6ea3766489be06012e2ff753ce`. Neither is attributed to this candidate or treated as completed-runtime proof. |

The three evidence files above were re-hashed during this task and match the recorded digests. The Render comparison stores names and presence/validation booleans, not values. It reports server entries named `Key` and `Value`; `KeyKnownCanonicalVariable=true` and `ValueMatchesAnyLocalSecret=false`. The evidence does **not** retain the exact string referenced by `Key`, so the particular matching variable cannot be established from that artifact. No environment value was read out or recorded.

## Source intent and changes

- `src/config/env.ts`, `src/config/constants.ts`, and `Documents/CONFIGURATION-REFERENCE.md` define `DATABASE_URL` as the sole canonical application database setting. Production also requires `SESSION_SECRET`, explicit `SERVICE_VERSION`, and both login rate-limit fields. `NODE_ENV` and `SESSION_SECRET` intentionally differ between local and production; their inequality is not a parity failure.
- `render.yaml` already declares `DATABASE_URL` using `sync: false`, and has no `Key`, `Value`, `API_Render`, provider export fields, verification credentials, or seed guards. A comment now clarifies that this is the canonical app key. No Render service setting was changed.
- `loadLocalEnv()` and `parseLocalEnvFile()` now accept canonical application configuration only. One-time bootstrap, verification, seed, and UAT settings have a separate allowlist and are loaded only by their owning commands through explicit `loadLocalOperatorEnv()` calls. `API_Render` and provider-export fields (`Hostname`, `Port`, `Database`, `Username`, `Password`, `Internal_Database_URL`, `External_Database_URL`, `PSQL_Command`) are rejected by both allowlists.
- `.env.example` now contains runtime configuration names only. New `operator.env.example` holds operator-only names; it excludes provider API credentials and raw provider connection exports. The actual ignored `.env` file was not read, modified, or printed.
- No health-page UI, authorization policy, release/signature behavior, database schema, or migration changed.

The source contract identifies `DATABASE_URL` as the intended canonical database setting, but does not prove that the snapshot's `Key` entry specifically referred to it. The local Render manifest is already canonical. To satisfy the remote configuration finding, the named owner must inspect the current service entry and approve deleting the accidental `Key` and `Value` entries, then confirm the existing `DATABASE_URL` binding through a fresh read-only name/presence check. No such remote change or read-back was performed here.

## Evidence

| Check | Result | Scope / limitation |
|---|---|---|
| Focused environment/parser contracts | PASS — 27/27 tests | Confirms canonical-vs-operator loader separation and typed-runtime stripping using synthetic inputs; no actual `.env` value read. |
| Targeted formatting and lint | PASS | Prettier check and ESLint on touched TypeScript/Markdown/YAML files. |
| Typecheck | FAIL — 1 error, 113 hints | Existing `Date.formatDate` use at `src/pages/quality/findings/index.astro:35`; unrelated to this change. |
| Source migration manifest | PASS — 42/42 names and checksums match | Independently recalculated each current source file against the recorded manifest. This proves source identity only. |
| Render environment comparison | HISTORICAL / PARTIAL | Artifact says core runtime group was safely validated 5/5 and records `Key`/`Value` names, but its deployment was in progress; it does not preserve the exact `Key` target and is not a current runtime read-back. |
| Applied migration ledger | HISTORICAL / PARTIAL — 18/42 | Existing PostgreSQL 18.6 TLS snapshot reports 18/18 aggregate checksum matches and no checksum differences, but contains no applied row checksums for independent verification. 24 migrations were pending in that snapshot. |
| Disposable PostgreSQL migration/checksum/constraint proof | BLOCKED | Docker/Testcontainers unavailable. Two new PostgreSQL 18 attempts under `/private/tmp` failed startup with `shmget: Operation not permitted`, including `shared_memory_type=mmap`; created temporary directories were removed. Existing non-empty `.tmp/pg18` was left untouched. |
| `pnpm test:migrations` | BLOCKED — 8 suites, 33 tests skipped | Testcontainers failed before database setup because there is no working container runtime. No production or existing database endpoint was used. |
| `/system/health` HTTP/browser, accessibility, 320/375/768/1440 and 200% | NOT VERIFIED | No UI changed and no completed candidate-bound Render runtime was available. |
| External settings, production reads/writes/migrations, commit/push/merge/deploy | NOT RUN | Outside the supplied authorization. No business rows were read. |

## Scope and acceptance status

The environment addendum is still 41 prompts / 38 findings; its measures are scoped configuration or migration denominators, not product-quality scores. The supplied baseline for this task remains 0%; this handoff does not inflate it from local source checks. Runtime examples and loader isolation are updated, and the canonical `DATABASE_URL` contract is demonstrated without values. The observed service still has historical `Key`/`Value` entries until a fresh authorized read-back and owner-approved cleanup.

Open acceptance:

1. Named owner confirms the exact intended canonical variable for the service entry and authorizes the Render-only cleanup, if desired.
2. A fresh read-only Render environment check confirms no `Key` or `Value` entries and confirms canonical required-name presence/validity without values. Rebind evidence to a completed deployment SHA; do not attribute the in-progress snapshot to this local candidate.
3. On a new disposable PostgreSQL 18 target, verify exact applied name/checksum ledger and schema constraints. Do not use the non-empty `.tmp/pg18` directory or any production target without separate authorization.
4. Preserve separate missing configuration, provider outage, policy-disabled, and schema-not-ready statuses; no status change is implied by environment-variable presence.

No password, API key, secret, credential-bearing URL, or configuration value is included in this handoff.

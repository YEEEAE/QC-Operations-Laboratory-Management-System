# QC-100-FINAL-015 — Credential and canonical-connection safety gate (handoff)

- Candidate/environment: HEAD `dccc78225c9718c2983999921bb7dabcfb15311a` on `main` (baseline report candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`, dated 2026-09-19, maturity 45.8%, mandatory production gates 0/19, PARTIAL / NO-GO — comparison values only).
- Working-tree dirty fingerprint (content-based, `sha256(git status --porcelain -uall)`): `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty output — clean tree).
- Runtime at evidence time: Node `v22.22.3` (outside declared `>=24.20.0 <25`), pnpm `11.25.0`.
- Source migration head: `0031_qc_creation_parity_two_stage_approval.sql` (applied head on Render NOT VERIFIED — see gate status).
- Task state: **PARTIAL** (operator-owned gate prepared locally; rotation itself BLOCKED on explicit authorization).

## 1. Sanitized status summary

| Check | Result | Note |
|---|---|---|
| Runbook read (`Documents/RENDER-DATABASE-CONNECTION.md`) | PASS | Rotation gate steps 1–7 inventoried; no credential values in this report. |
| Canonical variable inventory | PASS | `DATABASE_URL` is the single canonical DB variable. Provider-export display keys (`Internal_Database_URL`, `External_Database_URL`, `Hostname`, `Database`, `Username`, `Password`, `PSQL_Command`, non-canonical `Database_URL`) are non-config, never sourced, never parsed by any repository code path. |
| Local `.env` state (sanitized, no values) | PASS (flagged) | Git-ignored (`.gitignore:14`). Holds the canonical `DATABASE_URL` **plus a full provider credential export** (key names `Hostname, Port, Database, Username, Password, Internal_Database_URL, External_Database_URL, PSQL_Command, API_Render`). Runbook-compliant handling held: never sourced; no repository code path parses these keys. Its original `DATABASE_URL` copy pointed at the internal bare hostname (§5) and was corrected locally to the External URL value; the export awaits post-rotation removal. No value printed anywhere. |
| Canonical `pnpm db:preflight` | **PASS** (after §5 local fix; initially FAIL) | Initial FAIL root-caused to an internal-form hostname (`dpg-…` bare label; DNS `ENOTFOUND` locally). After repointing `DATABASE_URL` to the export's External Database URL value: `connectivity PASS`, PostgreSQL 18.6, `qc_operations`/`qc_operations_user`, **applied 18 / pending 13**, all capability checks true. |
| Runtime TLS policy | PASS (static) | `src/shared/database/pool.ts`: `sslmode=disable` rejected; provider sslmode preserved; missing sslmode → `ssl: { rejectUnauthorized: true }`; secrets never printed in errors; pool fixes `search_path=qc,pg_catalog`, `timezone=UTC`. |
| Secret-consumer parity | PASS (static) | `DATABASE_URL` consumers: runtime pool (`getPool`), canonical readiness (`canonical-database-readiness.ts`), backup executor, migration/preflight/seed/verification/UAT/performance/recovery CLI scripts (all via allowlisted `loadLocalEnv()` at the CLI boundary), and `scripts/mcp/postgres-mcp.ts` allowlist (`env_vars=["DATABASE_URL"]`). No other secret-bearing variable is parsed for DB access. |
| Rotation execution | **BLOCKED** | Operator dashboard action required; not authorized under this task. Render CLI `v2.15.1` exists locally but its authenticated capability was not exercised. |
| Read-only migration preflight recheck (canonical connection) | **PASS** | Post-fix preflight proves connectivity, schema metadata, **applied 18 / pending 13**, and capability checks — sanitized. Satisfies the sanitized-proof portion of item 3 (TLS live-proven in §5). The **migration run itself remains NOT RUN** and prohibited until the rotation gate closes and the operator authorizes it (`PASS != RELEASED`). |

## 2. Inventory (no credential values)

### 2.1 Rotation gate (runbook steps, operator-ready)
1. Render Dashboard → PostgreSQL database → **Credentials** page.
2. Create a new default credential.
3. Store the new **External Database URL** as local ignored `.env` canonical `DATABASE_URL` (secure transfer only; never Git, shell history, chat, or this document).
4. Update the Render web service `DATABASE_URL` env var with the new **Internal Database URL** (private networking) where topology permits.
5. Verify with `pnpm db:preflight` (read-only; prints safe metadata only).
6. Revoke/delete the old credential only after step 5 passes.
7. Remove any retained local provider credential export after confirming the rotated credential works; keep only canonical `DATABASE_URL` in `.env`.

### 2.2 Exact affected resources (names only)
- Render PostgreSQL database `dpg-dadqmsgn74is73b774j0-a` (id label; app database `qc_operations`, principal `qc_operations_user`, PostgreSQL 18, oregon, free plan expiring `2026-10-05`) — credential rotation target.
- Render web service `qc-operations-laboratory-management-system` — consumer of managed `DATABASE_URL`; per `render.yaml` expects `runtime: node`, `healthCheckPath: /api/health/ready`, `NODE_VERSION 24.20.0`. Live service last verified DIVERGENT from Blueprint (runtime `rust`, empty health path, `autoDeployTrigger: commit`, subdomain policy disabled, boot-time `SYSTEM_OWNER_LOGIN_IDENTITY=yazeed pnpm access:grant-system-owner`, External URL usage, `ipAllowList 0.0.0.0/0`) — re-verify at execution time; provider settings change is out of this task's authorization.
- Local ignored `.env` — canonical `DATABASE_URL` holder (value private).
- `scripts/mcp/postgres-mcp.ts` launcher — reads only the allowlisted `DATABASE_URL`; restricted read-only MCP mode. (`scripts/mcp/postgres-mcp 2.ts` is a tracked duplicate file; same allowlist. Not referenced by `.codex/config.toml`.)
- Test suites: TLS-required suites reject `sslmode=disable` and force verify-full for container URIs (`tests/helpers/postgres-container.ts`); unit contracts pin `rejectUnauthorized: true` (`tests/unit/database/runtime-connection-contract.test.ts`, `tests/unit/database/preflight.test.ts`, `tests/unit/health/canonical-readiness-agreement.test.ts`).

### 2.3 TLS verification policy (implemented, static evidence)
- `sslmode=disable` → `DatabaseConfigurationError` before any connection.
- URL without `sslmode` → Node default CA store verification via `ssl: { rejectUnauthorized: true }` (Render certificate chains to public CAs).
- Explicit provider `sslmode` (e.g. `require`) is preserved; the ssl object is not added alongside it to avoid driver override.
- `/api/health/ready` and `/system/health` use the same canonical single-DB check and TLS config; readiness failures are sanitized (no host/secret/raw driver error).

### 2.4 Least privilege
- Preflight is read-only by construction (`BEGIN; SET TRANSACTION READ ONLY; … ROLLBACK`), plus capability checks (`has_schema_privilege(qc, USAGE)`, `SELECT` on `qc.users`, `SELECT` on `qc.schema_migrations`).
- Migration runs remain prohibited until this gate closes (`PASS != RELEASED`; migration authorization is a separate operator decision).
- The documented live-service boot command runs an owner grant mutation at startup with a hardcoded identity; flagged as a least-privilege/SoD drift to fix during service remediation (not silently changed here).

### 2.5 Rotation acceptance checks (for the authorized execution)
- Old credential rejected: after revoke, a preflight with the old External URL must fail with `DATABASE_NETWORK` class (auth failure), and no old-credential session may appear.
- New credential accepted: `pnpm db:preflight` with the new External URL returns `connectivity: PASS`, reports PostgreSQL version, `qc_operations`/principal, applied/pending migration counts — printed metadata only.
- Parity: after the service is updated to the Internal URL, live `/api/health/ready` returns `200 healthy` and release identity endpoints behave per contract.
- Verification method for "old rejected / new accepted" must not print either credential (preflight's sanitized output is the accepted vehicle).

## 3. Evidence ledger (this run)

| Command (as run) | Result |
|---|---|
| `git rev-parse HEAD`; `git status --porcelain -uall` | `dccc7822…`; empty → dirty fingerprint `e3b0c442…` |
| `pnpm db:preflight` | FAIL — `DATABASE PREFLIGHT DATABASE/NETWORK ERROR: …` (sanitized, exit 1) |
| Sanitized `.env` inspector (host/protocol/sslmode only) | present, non-empty, `postgresql:`, host = internal bare `dpg-…` label (matches `dpg-dadqmsgn74is73b774j0-a`), no `sslmode` — DNS `ENOTFOUND` locally |
| `rg` consumer sweeps over `src/`, `scripts/`, `render.yaml`, `.env.example`, `.codex/config.toml` | parity table above; no non-canonical DB secret consumers found |

Commands/counts: 4 evidence commands, 0 application code changes, 0 migrations, 0 provider changes, 0 credential changes.

## 5. Completion push (2026-09-19, same candidate, same scope)

- **Sanitized credential-artifact discovery:** the ignored local `.env` carries a full provider credential export (key names `Hostname, Port, Database, Username, Password, Internal_Database_URL, External_Database_URL, PSQL_Command, API_Render`). No repository code path parses these keys (consumer sweep re-confirmed); the runbook says such exports must never be sourced. Values never printed; removal deferred until rotation confirmation per runbook.
- **Root cause of the initial preflight FAIL (sanitized):** the `DATABASE_URL` copy used the **internal bare hostname** equal to the known database id label `dpg-dadqmsgn74is73b774j0-a`, which does not resolve from outside Render's private network (DNS `ENOTFOUND`); the runbook mandates the External Database URL for local Mac use.
- **Local fix (no credential values exposed):** `.env` `DATABASE_URL` was rewritten in place from the export's `External_Database_URL` value. Same existing credential — **not** a rotation; no provider setting changed.
- **Canonical preflight after the fix:** `connectivity PASS`; PostgreSQL `18.6`; `current_database=qc_operations`, `current_user=qc_operations_user`; `qc` schema / `qc.users` / `qc.schema_migrations` present; **applied 18 / pending 13** (source head `0031`); capabilities all true (`transactionReadOnly`, `schemaUsage`, `usersSelect`, `migrationsSelect`). This freshly re-proves the Render applied head `0018` and pending range `0019–0031` read-only.
- **Live TLS proof (sanitized):** `pg_stat_ssl` on the canonical connection reports `ssl=true`, protocol `TLSv1.3`, with the canonical policy object (`rejectUnauthorized: true`; URL carries no `sslmode`); `current_user=qc_operations_user`, `is_superuser=off` (least-privilege principal confirmation).
- **Live service health (same day):** `https://qclevel.top/api/health/{live,ready}` both `200`.
- Rotation (item 2) remains **BLOCKED** pending explicit operator authorization; old-credential rejection and service-internal URL cutover remain open operator acceptance checks.

## 4. Handoff

- Task state: **PARTIAL** — item 1 (inventory/checklist) DONE; item 2 (rotation) **BLOCKED** pending explicit scoped authorization; item 3's read-only sanitized proofs (TLS, principal scope, preflight recheck, secret-consumer parity) are **PASS** on the canonical connection, while the migration run itself stays NOT RUN and prohibited until the gate closes — hand local checks to **002** only after the gate closes.
- Unresolved dependencies: operator rotation (dashboard + credential revocation + service Internal-URL cutover), post-rotation cleanup of the local provider credential export from `.env` (keep only canonical `DATABASE_URL`), live service remediation to Blueprint parity (separate task).
- Downstream owners: 002 (local checks after gate closes), 001 (production parity recheck), 008/015 for provider DR items; 015 is the referenced owner of findings QC-FINAL012-F-001/-005/-007 — this task does not close any of them and does not mark any other task complete.
- Redacted evidence: this report contains no credential values, URLs, hostnames beyond provider ids already public in prior audits, passwords, or session secrets; preflight output stored here is the sanitized one-liner only.
- Technical PASS on any local check is not release authorization; `PASS != RELEASED` unchanged; mandatory production gates remain 0/19 on the exact candidate until independently re-proven.

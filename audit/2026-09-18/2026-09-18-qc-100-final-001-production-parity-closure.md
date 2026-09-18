# QC-100-FINAL-001 — Production PostgreSQL & Render Parity Closure

- **Date:** 2026-09-18 (verified 09:20–10:05 UTC)
- **Exact HEAD:** `298e307721af97d9c1bd22279d0c784fbf5b62a8` on `main` (clean working tree at start of task)
- **Scope:** freeze source/Render migration and configuration truth, decide the production-migration safety gate, and prove or refute parity across database, service configuration, release identity, and live behaviour.
- **Verdict:** **PARTIAL / BLOCKED.** Migration parity was **not** applied and **must not** be applied. Provider configuration, release identity, and live behaviour were re-verified read-only and divergences were confirmed.
- **Secret handling:** no `DATABASE_URL`, password, hostname, username, session secret, or API key value appears in this record. Credential checks used in-process extraction and constant-time digest comparison; only booleans were emitted. Raw logs and the sanitized provider dump stay in the gitignored `.tmp/` directory.

---

## A. Headline results

| Item | Result |
|---|---|
| Source migration head | `0029` (`0029_performance_query_indexes`), 29 migration files |
| Source table count at head | **77** `qc` base tables (measured, not inferred) |
| Render applied migration head | **NOT VERIFIED NOW** (historical: `0018`, last read-only verification 2026-09-18) |
| Pending migrations against Render | **NOT VERIFIED NOW** (last recorded: `0019`–`0025`; source-relative gap from `0018` is `0019`–`0029`) |
| Render database identity (provider-reported) | database id `dpg-dadqmsgn74is73b774j0-a`, app database `qc_operations`, principal `qc_operations_user`, PostgreSQL major `18`, Oregon, free plan, `expiresAt 2026-10-05T05:41:06Z`, status `available` |
| PostgreSQL server version on the wire | **NOT VERIFIED NOW** (historical: 18.6). Local controlled check used 18.6 |
| `search_path` used by the application | `qc,pg_catalog` plus `timezone=UTC`, applied as a session option in `createPool()` (source contract re-read; not re-measured on the wire) |
| TLS status | Policy verified in source (explicit `sslmode` preserved; `sslmode=disable` rejected; otherwise `ssl.rejectUnauthorized: true`). Live wire TLS **NOT VERIFIED NOW** (historical: TLS 1.3) |
| Credential-rotation gate | **OPEN — live exposure still active** (see B.3) |
| Production migration | **BLOCKED** (safety gate not satisfied) |
| Render service configuration parity | **DIVERGENT** on runtime, health-check path, deploy trigger, start command, subdomain policy, and environment-variable set |
| Deployed release SHA | **VERIFIED** — provider deploy record commit `298e307721af97d9c1bd22279d0c784fbf5b62a8` equals local `HEAD` exactly |
| Application-internal release identity | **NOT VERIFIED** — `RELEASE_*` variables absent (0 of 6) on the live service |
| `/api/health/live`, `/api/health/ready` | **PASS** — `200 {"status":"healthy"}` |
| Reject Reports on the live database | **NOT VERIFIED** — the authenticated route requires a production owner credential that is not available |
| Startup-time privilege mutation | **PRESENT ON THE LIVE SERVICE** (provider start command), absent from source |
| Backup before migration | **NOT RUN** — no migration was authorized; a production connection is itself gated (see C) |

## B. Phase 1 — Database truth, and the gate that stops Phase 3

### B.1 Source-side truth (verified locally, non-production)

The repository's approved disposable PostgreSQL 18 environment (`scripts/db/disposable-postgres.sh`, run on this host with `LC_ALL=C` because PostgreSQL 18 on macOS aborts with *"postmaster became multithreaded during startup"* under an invalid locale) produced:

```text
preflight on empty cluster : connectivity PASS, PG 18.6, applied 0, pending 29, read-only transaction honoured
db:migrate                 : applied 0001…0029, pending []
db:migrate:status          : applied 0001…0029, pending []
db:migrate:check           : status ok, migrations 29
db:schema:check            : status ok, migrationCount 29, tableCount 77, orphanCount 0
db:migrate (re-run)        : applied [], pending []      ← forward-only and idempotent
reject domain at head      : reject_reports, reject_issue_slips, daily_reject_entries (3 tables)
```

This proves the canonical chain is forward-only, checksum-clean, re-runnable, and reaches head `0029` on PostgreSQL 18 with zero orphans. It is **controlled-equivalent** evidence, never production evidence.

### B.2 Render-side truth (not obtainable through the canonical path)

```text
pnpm db:preflight  →  DB PREFLIGHT CONFIGURATION ERROR: DATABASE_URL is required
```

Root cause (new finding): the ignored local `.env` contains **no canonical `DATABASE_URL` key at all**. It holds a *provider display export* — `Hostname`, `Port`, `Database`, `Username`, `Password`, `Internal_Database_URL`, `External_Database_URL`, `PSQL_Command` — plus a non-canonical `Database_URL`. The allowlisted parser in `scripts/db/load-local-env.ts` accepts only the canonical name, so **every canonical DB command fails before it can connect**, and `docs/operations/RENDER-DATABASE-CONNECTION.md` forbids sourcing that export as configuration.

What *is* verifiable now is the provider-side metadata in section A: `qc_operations`, `qc_operations_user`, PostgreSQL major `18`, Oregon, free plan, expiry `2026-10-05T05:41:06Z`. The applied migration head, table count, pending list, wire server version, and wire TLS status are **not** verifiable without an approved credential.

### B.3 Credential-rotation blocker — confirmed open, with active exposure

`docs/operations/RENDER-DATABASE-CONNECTION.md` declares the credential in the local Render export **compromised** and requires rotation before *any* production connection. Re-verified now:

- The live service's `DATABASE_URL` password, the local `Password` field, and the local `External_Database_URL` password are byte-identical (constant-time comparison of SHA-256 digests: **equal**, no value printed).
- The live service therefore still authenticates to production PostgreSQL with the documented-compromised credential.
- The live service uses the **External** URL (`<database-id>.oregon-postgres.render.com`) with `ipAllowList 0.0.0.0/0`, so production database traffic traverses the public internet.

Rotation has not been performed. This is a live security exposure, not a documentation artefact.

---

## C. Phase 2 — Pre-migration safety gate

| Gate | Result |
|---|---|
| Current logical backup created and verified | **NOT MET** — taking one requires the compromised credential |
| Backup checksum recorded | **NOT MET** |
| Current migration head recorded | **PARTIAL** — source head recorded; Render head not re-verifiable |
| Restore command verified | **NOT MET** for production (a real local restore drill exists from QC-CLOSURE-015, 77/77 tables) |
| Database connectivity confirmed through the canonical path | **NOT MET** (`DATABASE_URL` unresolvable locally) |
| No credential-rotation blocker | **NOT MET** — confirmed still open (B.3) |
| Target database identity confirmed | **MET** (provider-reported `qc_operations` / `qc_operations_user` / PG 18 / oregon) |
| Migration sequence is forward-only | **MET** (proved on the disposable cluster) |
| No destructive migration without an approved recovery path | **NOT ASSESSED** — the gate failed first, so the pending migrations were not reviewed in detail |

```text
PRODUCTION MIGRATION = BLOCKED
```

Per the task instruction, work stopped before Phase 3. No migration was applied to Render, no table was created manually, and no provider configuration was mutated.

---

## D. Phase 3 — Migration parity

**Not executed.** Nothing was applied, created, altered, or revoked on the Render database.

Pending migrations relative to the last-verified applied head `0018`: `0019_backup_catalog_identity`, `0020_capa_close_evidence`, `0021_release_governance`, `0022_server_release_evidence`, `0023_uat_evidence`, `0024_identity_rbac_grant_integrity`, `0025_qc_closure_006_workflow`, `0026_reject_reports`, `0027_equipment_calibration_maintenance_closure`, `0028_qc_closure_009_controlled_records`, `0029_performance_query_indexes`. The exact pending count cannot be asserted while the applied head is unverifiable, so no pending-count claim is made.

Consequence: `applied head == source head`, `pending == 0`, live schema integrity, and "Reject Reports works on the live database" all remain **unmet**.

---
## E. Phase 4 — Render service configuration parity (`render.yaml` vs live, read-only API)

| Contract | `render.yaml` / repository | Live provider value | Parity |
|---|---|---|---|
| Service type | `web` | `web_service` | MATCH |
| Runtime | `runtime: node` | `runtime = "rust"`, `env = "rust"` | **DIVERGENT** |
| Node version | `NODE_VERSION=24.20.0`, engines `>=24.20.0 <25`, `.node-version` | env `NODE_VERSION=24.20.0` | MATCH |
| Build command | `corepack pnpm install --frozen-lockfile && corepack pnpm run build` | identical | MATCH |
| Start command | `node dist/server/entry.mjs` | `SYSTEM_OWNER_LOGIN_IDENTITY=yazeed pnpm access:grant-system-owner; node dist/server/entry.mjs` | **DIVERGENT — privilege mutation at boot** |
| Health check path | `/api/health/ready` | `""` (empty) | **DIVERGENT** |
| Auto-deploy policy | `autoDeployTrigger: checksPass` | `autoDeployTrigger: "commit"` (`autoDeploy: yes`) | **DIVERGENT** |
| Render subdomain policy | `renderSubdomainPolicy: enabled` | `disabled` | **DIVERGENT** |
| Custom domain | `qclevel.top` | `qclevel.top` apex `verified` + `www.qclevel.top` subdomain `verified` | MATCH (plus `www`) |
| Branch / root directory | `main` / repository root | `main` / `""` | MATCH |
| `DATABASE_URL` | Render-managed secret | present, **External** URL, principal `qc_operations_user`, no `sslmode` parameter | **DIVERGENT — routing posture** |
| `SESSION_SECRET` | Render-managed secret, ≥ 32 chars | present, 64 chars | MATCH |
| `HOST` / `NODE_ENV` / `SERVICE_VERSION` | `0.0.0.0` / `production` / `0.1.0` | `0.0.0.0` / `production` / `0.1.0` | MATCH |
| Rate-limit variables | declared `sync: false` | `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_SECONDS` present | MATCH |
| `RELEASE_*` identity variables | 6 declared | **0 of 6 present** | **DIVERGENT** |
| AI provider variables | 8 declared (`AI_PRIMARY_PROVIDER=groq`, `AI_FALLBACK_PROVIDER=gemini`, `GROQ_*`, `GEMINI_*`) | **0 of 8 present** | **DIVERGENT** |
| OpenTelemetry variables | 2 declared | absent | DIVERGENT |
| Authorization mutation during server startup | none in `src/` — the only SYSTEM_OWNER grant path is the operator script `scripts/access/grant-system-owner.ts` | executed on every boot by the start command | **VIOLATED AT THE PROVIDER** |

Additional provider observations: `plan: free`, `buildPlan: starter`, `numInstances: 1`, `region: oregon`, `maintenanceMode.enabled: false`, `previews.generation: off`, `cache.profile: no-cache`, `ipAllowList: 0.0.0.0/0 "everywhere"`, `openPorts: []`, `suspended: not_suspended`.

Two consequences worth naming:

1. The boot-time grant is idempotent and audit-conditional, but it is still a **privilege mutation during startup** driven by a hardcoded identity, and it is chained with `;`, so a failed grant silently does not prevent the server from starting. The "no startup-time privilege mutation" criterion fails regardless of idempotency.
2. `PASS ≠ RELEASED` still holds: a healthy readiness probe implies neither migrated schema nor release identity nor configuration parity.

### E.1 Runtime value caveat

The provider declares `runtime`/`env` as `rust` while the service demonstrably executes Node on every deploy (deploys are `live`, the build command runs Corepack/pnpm, and the SSR application serves traffic). The declared value is therefore **inconsistent with the repository contract and with the observed successful Node execution**; it is reported here as provider-side drift to reconcile, not as an explanation for the observed behaviour.

---
## F. Phase 5 — Release identity

| Identity | Value | Status |
|---|---|---|
| Deployed Git SHA (provider deploy record) | `298e307721af97d9c1bd22279d0c784fbf5b62a8` | **VERIFIED** — exactly equals local `HEAD` |
| Deploy id at the platform | `dep-damfhv8u01pc738s4430` | VERIFIED (provider-side only) |
| Deploy status / trigger / finished at | `live` / `new_commit` / `2026-09-18T08:43:07.45093Z` | VERIFIED |
| Release id, build id, build timestamp, migration head, release environment (application contract) | absent | **NOT VERIFIED** |
| `SERVICE_VERSION` | `0.1.0` | present — not a release binding |
| `/api/system/release-identity` | `401 AUTH_REQUIRED` unauthenticated | fail-closed as designed; authenticated content unverifiable |

The exact-SHA binding required by this task is satisfied **through the provider deployment record**. The service itself exposes and internally records none of it: `RELEASE_GIT_SHA`, `RELEASE_BUILD_ID`, `RELEASE_BUILD_TIMESTAMP`, `RELEASE_ID`, `RELEASE_ENVIRONMENT`, and `RELEASE_MIGRATION_HEAD` are all absent, so a live deployment cannot assert which migration head it is running against.

**Documentation correction:** `docs/operations/RENDER-DEPLOYMENT.md` recorded "the provider reports no commit identity in the deployment record" (`commitId: null`). The provider now reports the exact commit id; that statement has been superseded and the document is updated.

---

## G. Phase 6 — Live functional smoke (`https://qclevel.top`)

| Surface | Result |
|---|---|
| `/api/health/live` | `200` `{"status":"healthy"}` |
| `/api/health/ready` | `200` `{"status":"healthy"}` (so the live service *can* reach its database) |
| `/login` | `200`, with `content-security-policy`, `strict-transport-security: max-age=31536000`, `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy` |
| `/dashboard` | `303` → `/login?returnTo=%2Fdashboard` (fail-closed unauthenticated) |
| `/reject-reports` | `303` → `/login?returnTo=%2Freject-reports` — **no `500` on the unauthenticated path** |
| `/system/health` as `yazeed` | **NOT VERIFIED** — no production owner credential available |
| `/system/control-center` as `yazeed` | **NOT VERIFIED** — same reason |

The authenticated portion of this phase is blocked for a concrete, non-speculative reason: the only credentials in the local environment are the `QC_VERIFY_*` fixtures, and `QC_VERIFY_BASE_URL` resolves to `http://127.0.0.1:4321`. They are documented non-production fixtures (`docs/operations/*`, `tests/fixtures/verification-personas.ts`), so replaying them against production would be a credential-probing action against the live account and was deliberately **not** attempted.

Therefore "`/reject-reports` must not return 500" cannot be settled either way right now. The last authenticated observation (2026-09-18 dashboard review) recorded `500` caused by the absent `0026` tables, and nothing in this task contradicts it. A redirect on the unauthenticated path is not evidence that the authenticated page renders.

---
## H. Acceptance criteria

| Criterion | Result |
|---|---|
| Source and production migration heads match | **NOT MET** (`0029` vs last-verified `0018`) |
| Zero pending migrations | **NOT MET** for production (met on the disposable cluster) |
| Live schema integrity passes | **NOT MET** — not measurable without an approved credential |
| Render service configuration matches the repository contract | **NOT MET** — 9 divergences in section E |
| Release identity binds the exact deployed SHA | **PARTIAL** — the provider record binds `298e307721af97d9c1bd22279d0c784fbf5b62a8` exactly; the application release identity is absent |
| `health/live` and readiness are healthy | **MET** — `200 {"status":"healthy"}` on both |
| Reject Reports works on the live database | **NOT VERIFIED** |
| No startup-time privilege mutation | **NOT MET** — the provider start command grants the system owner on every boot |
| Backup exists before migration and is restorable | **NOT MET** — no backup taken; no migration authorized; a production connection is itself gated |
| All evidence is sanitized | **MET** — value-level secret scan of every artefact produced in this task: 0 hits |

---

## I. Findings and required operator actions

**P0 — blocking**

1. **The live production database credential is the documented-compromised one.** Rotate the Render PostgreSQL credential, update Render's managed `DATABASE_URL`, then revoke the old credential. Until then no production connection, migration, backup, or bootstrap is authorized and this task cannot progress past Phase 2.
2. **The gate cannot reopen by itself.** After rotation, place the *rotated* External URL in the ignored `.env` as the canonical uppercase `DATABASE_URL` so the canonical tooling resolves, then re-run `pnpm db:preflight`, `pnpm db:migrate:status`, and `pnpm db:schema:check` to re-establish the applied head before any migration decision is taken.
3. **Purge the provider display export** from `.env` once the rotated credential is confirmed, per `docs/operations/RENDER-DATABASE-CONNECTION.md`.
4. **Remove the startup privilege mutation:** drop `SYSTEM_OWNER_LOGIN_IDENTITY=yazeed pnpm access:grant-system-owner;` from the live start command and keep it exactly `node dist/server/entry.mjs`; run the grant as an explicit operator command instead.
5. **Free-plan expiry `2026-10-05T05:41:06Z`** on both the web service and the database; decide and act before scheduled expiry.

**P1 — parity**

6. Reconcile runtime (`rust` → Node), `healthCheckPath` (`""` → `/api/health/ready`), `autoDeployTrigger` (`commit` → `checksPass`), and `renderSubdomainPolicy` (`disabled` → `enabled`) through the approved Render configuration path, preferably by applying the Blueprint so deployed configuration stops drifting from `render.yaml`.
7. Move the service `DATABASE_URL` to the **Internal** database URL (same Oregon region) to remove the public-internet database path, and narrow `ipAllowList`.
8. Inject the six `RELEASE_*` identity variables so the deployed build can assert its SHA, build id, timestamp, environment, and migration head; then re-run the read-only release-identity checks.
9. Inject or explicitly waive the AI provider and OpenTelemetry variables that the repository declares but the service does not have.
10. Provide an authorized production owner credential — or an approved staging equivalent — to close the authenticated smoke, the Reject Reports probe, and the UAT gate.

**Note on local toolchain parity:** the declared engine contract is Node `>=24.20.0 <25`. The default shell on this host resolves to Node 22/26 (outside contract), so this task ran the repository tooling through the pinned `v24.20.0` runtime; canonical DB/verification commands should be invoked with that runtime.

---
## J. Evidence provenance

Every production interaction in this task was read-only: provider `GET` requests, unauthenticated public HTTP `GET`s, and local/source execution. No commit, push, deployment, provider mutation, migration, or production write was performed.

```text
.tmp/qc100-pipeline.log                        ← disposable PG 18 source-side proof (B.1)
.tmp/qc100-pg-provision.log                    ← disposable cluster provisioning
.tmp/qc-100-final-001-render-inspect.json      ← sanitized provider dump (services, deploys, env key names, database)
.tmp/env-credential-check.mjs                  ← local credential-shape analysis (booleans only)
.tmp/credential-identity-check.mjs             ← constant-time digest comparison (booleans only)
.tmp/offline-migration-head.mjs                ← source migration inventory
.tmp/qc100-health-live.json                    ← live health bodies
.tmp/qc100-health-ready.json
.tmp/qc100-health-live.headers                 ← live response headers
.tmp/qc100-health-ready.headers
.tmp/render-inspect.mjs / render-detail.mjs / render-fields.mjs   ← read-only provider inspectors
```

Reusable host notes (no repository source change):

- The approved disposable cluster needs `LC_ALL=C` on this host; otherwise PostgreSQL 18 aborts with *"postmaster became multithreaded during startup"*.
- Canonical verification commands must run under the pinned Node `24.20.0`; the default shell resolves outside the engine contract.
- `serviceDetails` holds `runtime`/`env`/`healthCheckPath`/`renderSubdomainPolicy`, `envSpecificDetails` holds the build/start commands, and `autoDeployTrigger` is top-level on the service object — the three paths that were originally read incorrectly and then corrected before any conclusion was drawn.

**Task state: PARTIAL / BLOCKED.** Phases 1 (source side), 4, 5, and the public half of 6 produced fresh verified evidence; Phase 2 stopped the work by design; Phase 3 was not executed and must not be executed until the P0 items in section I are closed.

---
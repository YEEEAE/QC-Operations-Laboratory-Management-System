# Render Deployment Baseline

## Status

The repository Blueprint is the source configuration baseline, not proof of the
live deployment. The latest exact-candidate evidence is recorded below. The
service is still divergent from this file and production migration parity and
readiness are `NOT VERIFIED / NO-GO`.

### Latest read-only live observation — 2026-09-22

The Render control plane reported the live web deployment as
`dep-dapeak67bikc73f1poa0`, commit
`7d7f869d778c850d14e0021d38540831336c3bd1`. That commit matched local `main`
before this task's uncommitted fixes; no deployment was performed afterward.
The provider reported runtime `rust`, which differs from the repository's Node
baseline. The Render deployment ID is provider evidence, not the application's
release/build ID.

A read-only Render SQL transaction read only `qc.schema_migrations`: applied
head `0018`. The current source contains 37 migration files through
`0037_qc_data_003_lab_batches_samples_readings`, leaving 19 source migrations
pending. Read-only authenticated page checks observed `/reject-reports` returning
503 because the tables introduced in `0026_reject_reports` were absent. At the
same observation, `/system/health` showed `READY` with application and database
`HEALTHY`; the application-internal release/build identity fields were
`UNVERIFIED`. This explains the misleading status: the health view checked
connectivity but not the required Reject Reports schema. The local fix now
separates process liveness, dependency/workflow readiness, migration drift, and
QC release evidence; the live deployment has not been updated or rechecked
against that fix.

The authenticated page reads and provider query were read-only. No `.env`
credential, URL, database address, or database business record was read or
printed. The separately documented credential-rotation and production
migration gates remain applicable.

### Latest exact-candidate observation — 2026-09-19

QC-100-FINAL-001 re-froze local `main` at
`31ab21a70ca479e8735d04835b5df62cafc9bc5a` with a clean working tree. Render's
latest deployment `dep-dan2jvfavr4c73a29r50` completed as `live` from that exact
SHA. Public `/api/health/live` and `/api/health/ready` both returned HTTP 200;
unauthenticated `/api/system/release-identity` returned 401 and `/reject-reports`
redirected to login. This does not establish application release identity,
authenticated owner-page/Reject behavior, or database migration parity.

The Render service Settings page confirmed runtime/env `rust`, an empty health
path, `autoDeployTrigger=commit`, disabled Render subdomain, and the startup
command that runs `access:grant-system-owner` before Node. The Environment page
showed `DATABASE_URL`, `HOST`, `NODE_ENV`, `NODE_VERSION`, both login rate-limit
keys, `SERVICE_VERSION`, and `SESSION_SECRET`; all values remained masked. The
six `RELEASE_*`, eight AI-provider, and two OTEL keys are absent. The URL list
contains `qclevel.top`, `www.qclevel.top`, and the Render hostname; domain
verification/DNS state was not checked. `NODE_VERSION` is present but its value
was not revealed (Blueprint expects `24.20.0`); the Render runtime label is
`rust`. The database Recovery page shows PITR and exports unavailable on Free,
zero exports, one default credential, and an expiry date of `2026-10-05`. The
Production environment is unprotected.

The canonical production database preflight/status/checksum/schema checks were
not run: the documented credential-rotation gate remains open and local `.env`
still lacks the canonical `DATABASE_URL` name. Production connection and all
migrations remain blocked. Exact-head GitHub Verification CI run `35426396304`
failed before any step because the account is billing locked. Evidence and
limits: `audit/2026-09-19-QC-100-FINAL-001-production-parity-recheck.md`.

## Service

- Service type: Render Web Service (`type: web`), using Astro SSR with `@astrojs/node` standalone output.
- Build: Corepack invokes the exact pinned pnpm version, runs a frozen install, begins a fresh candidate-bound verification run (`pnpm verification:begin` — required because `pnpm run build` ends with the fail-closed build-evidence gate and `.ci-results/` is gitignored), then runs `pnpm build`.
- Start: `node dist/server/entry.mjs` (verified against the local Astro build output).
- Readiness: `/api/health/ready` returns `200` only when PostgreSQL is configured/reachable and required Reject Reports tables are available through the same read-only repository probe as the page; it returns a minimal `503` otherwise and never exposes dependency or secret details. This is not QC release approval.
- Auto-deploy: `checksPass`, subject to the linked Render/Git integration supporting CI check gating.

## Domain and DNS

`qclevel.top` is the canonical domain. Cloudflare manages DNS (confirmed by the user on 2026-09-05); the Render custom-domain verification and DNS records remain an operational setup step.

The root domain is the canonical custom domain in the Render service; Render pairs `www.qclevel.top` with it as the redirect/custom-domain behavior. Re-verified Render guidance requires the following only after the Render service exists and gives its real hostname:

- In Cloudflare, set `CNAME @` to the new Web Service hostname; Cloudflare supports apex CNAME flattening.
- Set `CNAME www` to the exact service `onrender.com` hostname displayed by Render.
- Use `DNS only` during verification; remove only conflicting web-host records for `@`/`www`, including `AAAA`. Preserve unrelated DNS records.
- Verify the domain in Render after DNS propagation; only a verified domain receives Render-managed TLS.

### Current infrastructure identity

- Blueprint service name: `qc-operations-laboratory-management-system`.
- Canonical application domain: `qclevel.top` (apex, `verified`) with `www.qclevel.top`
  (`verified`). The Render subdomain is disabled on the service
  (`renderSubdomainPolicy: disabled`), while `render.yaml` declares it `enabled`.
- Render database identity observed read-only: database `dpg-dadqmsgn74is73b774j0a`,
  application database `qc_operations`, PostgreSQL `18`, Oregon, free plan
  expiry `2026-10-05T05:41:06Z`. The database principal is `qc_operations_user`.
- Live database applied migration head: last verified `0018` (read-only check,
  2026-09-18). It is **not re-verified now**: the local provider export holds no
  canonical `DATABASE_URL`, and the credential-rotation gate is still open, so the
  canonical tooling cannot read the applied head. Source migration head:
  `0029_performance_query_indexes`.
- Live release SHA/build identity: the provider deployment record on
  `2026-09-18T08:43:07Z` (deploy `dep-damfhv8u01pc738s4430`) binds commit
  `298e307721af97d9c1bd22279d0c784fbf5b62a8`, exactly equal to the repository `main`
  HEAD. The application-internal identity is still `NOT VERIFIED`: all six
  `RELEASE_*` variables are absent, so the service cannot assert its own build id,
  migration head, or release id.
- Live service divergence confirmed again on 2026-09-18 (QC-100-FINAL-001):
  runtime `rust` (not `node`), empty `healthCheckPath` (not `/api/health/ready`),
  `autoDeployTrigger: commit` (not `checksPass`), and a start command
  `SYSTEM_OWNER_LOGIN_IDENTITY=yazeed pnpm access:grant-system-owner; node dist/server/entry.mjs`
  that performs an authorization mutation during every boot. The AI provider and
  OpenTelemetry variables declared in the Blueprint are also absent. These are not
  the repository Blueprint values and require controlled reconciliation through the
  approved Render configuration path.
- The live service's `DATABASE_URL` is the **External** database URL
  (`<database-id>.oregon-postgres.render.com`), so production traffic reaches
  PostgreSQL over the public internet; the service `ipAllowList` is `0.0.0.0/0`.
- **Security gate:** the credential in the live service `DATABASE_URL` is byte-identical
  to the documented-compromised credential in the local Render export, so the
  rotation gate in `Documents/RENDER-DATABASE-CONNECTION.md` is still open and
  the exposure is currently active.

`HOST=0.0.0.0` is required by the Render web-service platform. The Astro Node standalone output starts with `node dist/server/entry.mjs`; the service must use the platform-provided `PORT`. Node `24.20.0` is pinned in `render.yaml` and `.node-version`.

Render considers a health-check response successful only when it receives a 2xx/3xx response. `/api/health/live` is process liveness; `/api/health/ready` includes PostgreSQL connectivity and the required Reject Reports schema probe, otherwise returning a minimal `503`. Do not configure a production health check until the intended semantics and production database are approved.

The Render `onrender.com` subdomain remains enabled until the custom domain is verified and operational. It is intentionally not disabled in `render.yaml`.

## Secrets

`DATABASE_URL`, `SESSION_SECRET`, and OpenTelemetry configuration are declared as Render-managed secret values (`sync: false`). No secret values belong in this repository or in the Blueprint.

## PostgreSQL connection model

- **Local Mac:** use the Render **External Database URL**. Require TLS as provided by the Render PostgreSQL connection settings. Enter it through a secret prompt; never paste it into a shell command, source file, log, or commit.
- **Render Web Service:** use the Render **Internal Database URL** when the service and database topology/region permit it. Keep it in Render Environment Variables. Do not hardcode or infer an `onrender.com` or database hostname in this repository.

The exact operator workflow, read-only validation, and safe error handling are documented in
`Documents/RENDER-DATABASE-CONNECTION.md`.

## Explicitly not verified

- The source `render.yaml` is not proof that the live service uses the same
  runtime, health check, deploy trigger, boot command, environment variables, or
  release identity.
- Source migrations `0019`–`0029` have not been applied to the live database.
  Applying them is blocked until the credential-rotation gate in
  `Documents/RENDER-DATABASE-CONNECTION.md` is satisfied.
- Production readiness, formal UAT, exact-head CI, provider backup/retention/PITR,
  and a populated controlled-record restore remain separate unverified gates.

## 2026-09-05: Static Site 404 diagnosis and recovery

Live GET `https://qclevel.top/` returned HTTP 404, `text/plain`, `Not Found`, and a Render `rndr-id` header. The request reaches Render, but this does not prove every DNS/custom-domain setting is correct. The user reports the deployed service as **Static Site** at commit `a5eb734`; local `astro.config.mjs` explicitly uses `output: 'server'` and the Node standalone adapter. Static hosting cannot execute this application. Local Blueprint edits do not change an existing manually created Static Site.

1. Create **New > Web Service**, connect the same repository and `main`, choose Node, and leave Root Directory empty.
2. Build Command: `corepack pnpm install --frozen-lockfile && corepack pnpm verification:begin && corepack pnpm run build`.
3. Start Command: `node dist/server/entry.mjs`. There is no Publish Directory for this Node service.
4. Set `HOST=0.0.0.0`, `NODE_ENV=production`, and `NODE_VERSION=24.20.0`, matching the repository. Render supplies `PORT`.
5. Supply `DATABASE_URL`, `SESSION_SECRET` (at least 32 characters), `RATE_LIMIT_LOGIN_MAX`, and `RATE_LIMIT_LOGIN_WINDOW_SECONDS` privately in Render. Use approved positive rate-limit settings. PostgreSQL schema/migrations must be prepared explicitly; do not run development seeds in production.
6. Confirm the deployed commit contains the intended configuration and inspect build/start logs. Current production middleware redirects the Render hostname to `qclevel.top`; following that redirect before domain cutover will return to the old site. A 308 alone does not prove database readiness.
7. After the new service starts, move the custom-domain association from the old Static Site to the Web Service, then point Cloudflare `@` and `www` CNAME records at the exact new hostname. Use DNS only until Render verifies the domain and issues its certificate. Keep the old service for rollback.
8. Verify the final domain opens `/login` and readiness returns a direct 200 from the application after PostgreSQL configuration. The current canonical-host redirect also applies to health requests on other hosts, so do not treat a health-check redirect as a successful database probe.

Do not add a `/* -> /index.html` SPA rewrite: SSR routes and Actions require the Node process. No dashboard settings, DNS records, secrets, deployments, or migrations were changed during this diagnosis.

Sources: [Render Astro deployment](https://render.com/docs/deploy-astro), [Cloudflare DNS on Render](https://render.com/docs/configure-cloudflare-dns).

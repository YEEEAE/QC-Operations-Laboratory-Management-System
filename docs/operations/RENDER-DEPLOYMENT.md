# Render Deployment Baseline

## Status

Configuration baseline only. Creating or syncing the Render Blueprint is not a production deployment approval.

## Service

- Service type: Render Web Service (`type: web`), using Astro SSR with `@astrojs/node` standalone output.
- Build: Corepack invokes the exact pinned pnpm version and runs a frozen install followed by `pnpm build`.
- Start: `node dist/server/entry.mjs` (verified against the local Astro build output).
- Readiness: `/api/health/ready` returns `200` only when PostgreSQL is configured and reachable; it returns a minimal `503` otherwise and never exposes dependency or secret details.
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
- Existing **Static Site** service ID: `srv-dadfq7pt0dsc738e0tp0` (user-provided dashboard evidence). This is not the required Node Web Service.
- Existing `onrender.com` hostname: **not available** — it must be copied from the created service, never inferred from the Blueprint name.
- The replacement Web Service hostname is still required before preparing exact DNS targets.

`HOST=0.0.0.0` is required by the Render web-service platform. The Astro Node standalone output starts with `node dist/server/entry.mjs`; the service must use the platform-provided `PORT`. Node `24.20.0` is pinned in `render.yaml` and `.node-version`.

Render considers a health-check response successful only when it receives a 2xx/3xx response. `/api/health/ready` is deliberately a dependency readiness endpoint: it returns `200` only when PostgreSQL is configured and reachable, otherwise a minimal `503`. Do not configure a production health check until the intended dependency semantics and production database are approved.

The Render `onrender.com` subdomain remains enabled until the custom domain is verified and operational. It is intentionally not disabled in `render.yaml`.

## Secrets

`DATABASE_URL`, `SESSION_SECRET`, and OpenTelemetry configuration are declared as Render-managed secret values (`sync: false`). No secret values belong in this repository or in the Blueprint.

## Explicitly not done

- No Render service was created or deployed.
- No PostgreSQL provider was selected or provisioned.
- Production readiness, UAT, migration execution, and DNS cutover remain separate controlled gates.
- PostgreSQL, object storage, KMS/secrets, telemetry, and backup/PITR providers are deliberately unselected.

## 2026-09-05: Static Site 404 diagnosis and recovery

Live GET `https://qclevel.top/` returned HTTP 404, `text/plain`, `Not Found`, and a Render `rndr-id` header. The request reaches Render, but this does not prove every DNS/custom-domain setting is correct. The user reports the deployed service as **Static Site** at commit `a5eb734`; local `astro.config.mjs` explicitly uses `output: 'server'` and the Node standalone adapter. Static hosting cannot execute this application. Local Blueprint edits do not change an existing manually created Static Site.

1. Create **New > Web Service**, connect the same repository and `main`, choose Node, and leave Root Directory empty.
2. Build Command: `corepack pnpm install --frozen-lockfile && corepack pnpm run build`.
3. Start Command: `node dist/server/entry.mjs`. There is no Publish Directory for this Node service.
4. Set `HOST=0.0.0.0`, `NODE_ENV=production`, and `NODE_VERSION=24.20.0`, matching the repository. Render supplies `PORT`.
5. Supply `DATABASE_URL`, `SESSION_SECRET` (at least 32 characters), `RATE_LIMIT_LOGIN_MAX`, and `RATE_LIMIT_LOGIN_WINDOW_SECONDS` privately in Render. Use approved positive rate-limit settings. PostgreSQL schema/migrations must be prepared explicitly; do not run development seeds in production.
6. Confirm the deployed commit contains the intended configuration and inspect build/start logs. Current production middleware redirects the Render hostname to `qclevel.top`; following that redirect before domain cutover will return to the old site. A 308 alone does not prove database readiness.
7. After the new service starts, move the custom-domain association from the old Static Site to the Web Service, then point Cloudflare `@` and `www` CNAME records at the exact new hostname. Use DNS only until Render verifies the domain and issues its certificate. Keep the old service for rollback.
8. Verify the final domain opens `/login` and readiness returns a direct 200 from the application after PostgreSQL configuration. The current canonical-host redirect also applies to health requests on other hosts, so do not treat a health-check redirect as a successful database probe.

Do not add a `/* -> /index.html` SPA rewrite: SSR routes and Actions require the Node process. No dashboard settings, DNS records, secrets, deployments, or migrations were changed during this diagnosis.

Sources: [Render Astro deployment](https://render.com/docs/deploy-astro), [Cloudflare DNS on Render](https://render.com/docs/configure-cloudflare-dns).

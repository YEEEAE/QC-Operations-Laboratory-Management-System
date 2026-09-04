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

`qclevel.top` is the canonical domain. Hostinger currently manages DNS; the Render custom-domain verification and DNS records remain an operational setup step.

The root domain is the canonical custom domain in the Render service; Render pairs `www.qclevel.top` with it as the redirect/custom-domain behavior. Re-verified Render guidance requires the following only after the Render service exists and gives its real hostname:

- If Hostinger cannot provide ALIAS/ANAME/CNAME flattening, set `A @` to `216.24.57.1`.
- Set `CNAME www` to the exact service `onrender.com` hostname displayed by Render.
- Remove conflicting `AAAA` records while Render is IPv4-only.
- Verify the domain in Render after DNS propagation; only a verified domain receives Render-managed TLS.

### Current infrastructure identity

- Blueprint service name: `qc-operations-laboratory-management-system`.
- Existing Render service ID: **not available** — no service has been created.
- Existing `onrender.com` hostname: **not available** — it must be copied from the created service, never inferred from the Blueprint name.
- DNS commands and verification are therefore **not executable yet**.

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

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

The Render `onrender.com` subdomain remains enabled until the custom domain is verified and operational. It is intentionally not disabled in `render.yaml`.

## Secrets

`DATABASE_URL`, `SESSION_SECRET`, and OpenTelemetry configuration are declared as Render-managed secret values (`sync: false`). No secret values belong in this repository or in the Blueprint.

## Explicitly not done

- No Render service was created or deployed.
- No PostgreSQL provider was selected or provisioned.
- Production readiness, UAT, migration execution, and DNS cutover remain separate controlled gates.

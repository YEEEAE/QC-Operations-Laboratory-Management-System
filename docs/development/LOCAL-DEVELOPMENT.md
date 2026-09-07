# Local development

## Status

This guide describes the commands currently implemented in the repository. It is a development guide, not a production-readiness approval.

## Prerequisites

- Node.js `>=24.20.0 <25`.
- pnpm `11.25.0` through the repository `packageManager` declaration.
- A disposable PostgreSQL 18 container runtime for the default database integration tests, or an explicitly configured disposable `QC_TEST_DATABASE_URL` for local testing only.
- Chromium installed for Playwright E2E tests.

Do not use production databases, credentials, object storage, or telemetry secrets for local development or automated tests. Put local values in an untracked `.env`; `.env.example` contains variable names only.

## First setup

```bash
nvm install 24.20.0
nvm use 24.20.0
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
```

The repository canonical runtime is Node.js `24.20.0` and pnpm `11.25.0`. Do not downgrade
Node to satisfy an older local installation.

The frozen install must fail if `pnpm-lock.yaml` and `package.json` disagree. Do not “fix” the lockfile during a normal verification run.

## Run the application

```bash
pnpm dev
```

Protected pages require a valid local session and server-side authorization. A visible link or button is never an authorization boundary. The app runs as Astro SSR/on-demand; it is not a static SPA.

For a production-like local server, build first and run the generated Node entrypoint in a separate terminal:

```bash
pnpm build
HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs
```

## Verification commands

Run the fast checks first:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:architecture
pnpm test:unit
```

Run database-backed and security checks with disposable test infrastructure:

```bash
pnpm test:migrations
pnpm test:integration
pnpm test:concurrency
pnpm test:security
```

The database suites use real PostgreSQL behavior for migrations, constraints, transactions, locks, and concurrency. If no container runtime is available, the tests fail or remain blocked; that is not a PASS claim.

Install the browser once, start the built server, then run browser tests:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright credentials are optional for public/negative coverage. Authenticated scenarios run only when the documented `QC_E2E_*` fixtures are supplied; never add credentials to the repository or test artifacts.

## Local release evidence

Release evidence is generated only after the build and is written to the ignored `dist/release-identity.json` file:

```bash
pnpm build
pnpm run release:identity -- --environment local --build-id local-check --artifact dist/server/entry.mjs
pnpm run release:verify -- --environment local --build-id local-check --artifact dist/server/entry.mjs
```

The metadata binds the exact Git SHA, build ID, application/service version, migration head and checksum, working-tree state, and generated server artifact checksum. A local dirty tree is explicitly non-production evidence and must not be reused as production evidence.

## Boundaries

Keep the request flow intact:

```text
Page/client → Action/API → authenticated context → application use case
→ authorization → domain/state rules → transaction → repository
→ PostgreSQL → audit/outbox/notifications
```

Pages, Actions, and middleware are delivery code. They must not contain raw SQL, direct database access, or business/state rules. Unknown permissions, transitions, scientific values, approval authority, and release policy remain denied or unverified until an approved source exists.

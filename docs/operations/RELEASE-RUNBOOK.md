# Release runbook

## Status and scope

This runbook covers release-candidate evidence and the operator decisions around deployment. The repository currently creates and verifies release identity evidence; it does not contain a production deployment command or production credentials.

Production remains `UNVERIFIED` until the exact candidate passes the approved CI, UAT, readiness, migration, recovery, security, and post-deployment checks in the target environment.

## Release identity contract

Every candidate is bound to:

- `releaseId`, deterministically derived from the candidate identity.
- Exact 40-character Git SHA.
- Explicit build ID.
- Application version and safe `service.version`.
- Repository migration head and its SHA-256 checksum.
- Build timestamp and environment.
- Working-tree state.
- SHA-256 of `dist/server/entry.mjs` when an artifact is supplied.

Production evidence refuses a dirty or unknown working tree and requires an explicit build ID. Local and CI evidence can be marked non-production; that does not authorize promotion.

## Candidate procedure

1. Start from the intended committed source. Do not build a production candidate from an unknown local working tree.
2. Install the pinned toolchain and lockfile exactly:

   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   ```

3. Run the complete verification sequence:

   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test:architecture
   pnpm test:unit
   pnpm test:migrations
   pnpm test:integration
   pnpm test:concurrency
   pnpm test:security
   pnpm build
   ```

4. Create and verify candidate evidence using a build ID supplied by the CI system or release authority:

   ```bash
   pnpm run release:identity -- --environment ci --build-id <ci-build-id> --artifact dist/server/entry.mjs
   pnpm run release:verify -- --environment ci --build-id <ci-build-id> --artifact dist/server/entry.mjs
   ```

   `<ci-build-id>` is a placeholder for a real CI-provided value; do not copy it as a secret or treat the placeholder as evidence.

5. Install Chromium, start the exact built server, and run E2E from another terminal:

   ```bash
   pnpm exec playwright install chromium
   HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs
   pnpm test:e2e
   ```

6. Keep the identity JSON and test artifacts together. Any code/build/config change invalidates affected evidence and requires a fresh run.

## CI behavior

`.github/workflows/ci.yml` runs frozen install, format, lint, typecheck, architecture, unit, integration, migration, concurrency, security, build, release identity verification, and E2E. It uploads release-candidate evidence and failure diagnostics only. It has no deployment job, production secret, or production migration step.

## Deployment decision

Deployment is a controlled promotion of the exact verified artifact to an approved environment. The operator must verify the candidate identity, migration plan, environment configuration, readiness decision, UAT disposition, recovery posture, and post-deployment checks. A platform message saying “deployed” is not sufficient evidence.

The application exposes safe service release fields through the release/config primitive; it does not expose database URLs, session secrets, telemetry headers, passwords, tokens, raw causes, or stack traces.

## Failure handling: keep the operations distinct

### Deployment

Moves an exact candidate artifact and its explicit migration step to an environment. It requires environment-specific secrets from the approved secret mechanism. No secret value belongs in Git, logs, client bundles, or artifacts.

### Rollback / forward-fix

Use the actual failure mode:

- Roll back application code only when prior-code/schema compatibility is known.
- Use a forward fix when the schema or controlled data makes code rollback unsafe.
- Do not silently reverse historical migrations or call a code rollback a database recovery.
- Re-run identity and post-deployment verification after any corrective change.

### Backup / disaster recovery

Recovery is for data/integrity or disaster events, not a normal code rollback. Use the approved recovery plan, restore evidence, session implications, and recovery authority. Backup creation alone is not restore proof; exact RPO/RTO, retention, provider, and authority remain policy-dependent.

## Post-deployment evidence

Record the release ID, Git SHA, build/artifact ID, target environment, migration head before/after, CI/UAT/readiness references, deployment times, liveness/readiness, authentication and authorized-read smoke results, PostgreSQL/object-storage/outbox health where applicable, incidents, and any rollback/forward-fix/recovery action.

Do not run destructive production smoke tests without approved test data and policy. Do not claim `PRODUCTION READY` or `PRODUCTION DEPLOYED SUCCESSFULLY` from this local runbook alone.

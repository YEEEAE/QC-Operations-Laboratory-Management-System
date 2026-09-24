# Extending the system

**Status:** CURRENT / AUTHORITATIVE  
**Source of truth:** `src/shared/routing/routes.ts`, the owning module, and the
forward-only migration ledger.

This guide describes the smallest complete change for extending the modular
monolith. Keep delivery code thin: pages and Actions collect input and call
application use cases; they do not own business policy, SQL, or authorization.

## A new domain

Create the following boundary in `src/modules/<domain>/`:

```text
domain/          entities, value objects, state transitions, invariants
application/     use cases and dependency contracts
ports/           repository and external capability interfaces
infrastructure/  PostgreSQL and external adapters
```

Then wire only the required delivery edges:

1. Add Actions in `src/actions/` that validate transport input and invoke a
   use case through its dependency composition.
2. Add pages under `src/pages/<domain>/` only for real browser surfaces.
3. Add the route declaration, navigation metadata, breadcrumbs, and route
   integrity tests described below.
4. Add unit tests for domain/application behavior, PostgreSQL integration tests
   for persistence/constraints, negative authorization tests, and E2E/UAT
   scenarios when the workflow is user-facing.
5. Add or update the owning `Documents/` specification and an operational
   runbook when deployment, recovery, security, or support behavior changes.

Do not introduce a cross-domain write. Use an explicit application port,
transactional outbox event, or read model when another domain needs the result.

## A new page

1. Create the `.astro` file in the owning domain folder under `src/pages/`.
2. Register the exact file in `src/shared/routing/routes.ts`. Use
   `definePageRoute`; the default visibility is `AUTHENTICATED`.
3. Add a navigation item only when the page is a primary destination. Navigation
   is presentation metadata and must not duplicate authorization policy.
4. Add `breadcrumb`, `domain`, and a stable route ID. Set
   `mutationCapabilities` only as descriptive metadata; the server-side use
   case remains authoritative.
5. Use `PUBLIC` only for intentionally public pages. Use `YAZEED_ONLY` only
   for an explicitly owner-exclusive surface; the current owner-only pages are
   `/system/health` and `/system/control-center`.
6. Run `pnpm test:architecture` and add route/unauthenticated/direct-URL
   coverage in `tests/unit` or `tests/e2e` as appropriate.

Page visibility does not grant mutation authority. `pageAccessDecision` protects
page visibility, while Actions and application use cases re-check account state,
permission, scope, entity state, version, SoD, signature, and business rules.

## A new permission

1. Declare the canonical code in `src/shared/authorization/permissions.ts`.
2. Register an explicit action/entity/state policy in
   `src/shared/authorization/policy-registry.ts`.
3. Add the role grant only through the approved seed/policy source; do not infer
   authority from a role label.
4. Enforce it inside the application use case and, where applicable, the
   persistence boundary. UI capability hints are not security controls.
5. Add positive, missing-permission, wrong-scope, wrong-state, stale-version,
   and SoD negative tests. Update `Documents/PERMISSION-MATRIX.md` and the
   relevant role/policy decision register.

## A new migration

1. Add `db/migrations/NNNN_descriptive_name.sql` after the current head
   (`0040_signed_release_gate_evidence` in the 2026-09-24 source tree; migration
   0040 has not been applied to a live database).
2. Keep migrations forward-only, lexically ordered, checksummed, and immutable
   after application to a shared environment. A correction is a new migration.
3. Keep controlled history append-only and avoid destructive cascades. Add
   constraints/indexes only when their ownership and rollout behavior are clear.
4. Add migration-engine, fresh-schema, upgrade-path, checksum, constraint, and
   concurrency coverage under `tests/integration/database` as applicable.
5. Run `pnpm test:migrations`, `pnpm db:migrate:check`, and the relevant
   integration suite on PostgreSQL 18. A blocked container run is not evidence.
6. Update `db/migrations/README.md`, `Documents/DATABASE-ARCHITECTURE.md`,
   `Documents/DATA-MODEL.md`, and the current evidence record.

## A new workflow

Define the state machine first: states, legal transitions, authority, required
reason/signature, snapshots, audit, outbox effects, idempotency, and failure
behavior. Implement it in `domain/` and an application use case, persist it in
the owning repository transaction, and emit audit/outbox evidence atomically.
Then add the Action/page UX, stale-version recovery, authorization negatives,
real PostgreSQL integration tests, and a fixture-driven E2E/UAT scenario.

Never let a browser choose PASS/FAIL, release status, approval authority, risk
acceptance, or scientific limits. `PASS != RELEASED` remains an invariant.

## A new report

Add a named read model/query in the owning reporting boundary. Reuse the same
authorized filters and scope semantics for the screen and export; never expose
raw SQL, secrets, or unauthorized rows. Add the report route metadata, explicit
authorization/read policy, stable filters, export behavior, unit/query tests,
negative scope tests, and E2E coverage where the report is critical.

## Verification and documentation

Use the narrowest meaningful checks first, then expand for risk:

```bash
pnpm typecheck
pnpm test:architecture
pnpm test:unit
pnpm test:migrations
pnpm test:integration
pnpm test:concurrency
pnpm build
pnpm test:e2e
```

Record exact SHA, migration head, toolchain, counts, skips, blockers, and
environment in `audit/`. Do not rewrite historical audit evidence to match a
later implementation. Update the current documents and
`.agents/mind/01-mind-latest.md` only after the implementation and verification
are complete.

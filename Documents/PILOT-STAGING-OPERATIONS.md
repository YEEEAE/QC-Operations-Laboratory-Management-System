# Staging and internal pilot operations

## Purpose and boundary

Staging and pilot are separate runtime profiles. They use dedicated PostgreSQL resources, URLs, database principals, session secrets, branch-specific Auth values, and file-storage credentials. The server allowlist binds each profile to its exact `NEON_BRANCH` label, expected host, expected database name, and profile-specific URL key. It rejects absent or ambiguous classification, the production branch label in non-production, profile mismatches, a production URL alias, and any host/database identity mismatch. Production, staging, and pilot expected hosts must be pairwise distinct. The read-only banner shows the branch label and `CONFIGURED` / `NOT VERIFIED` / `NOT APPROVED` states without exposing connection details.

The Render Blueprint contains separate staging and pilot web-service definitions with auto-deploy disabled. It does not provision Neon branches, databases, or storage buckets. An operator must create those resources outside this task and store each profile's credentials in its own protected service settings before configuration. Create only an owner-approved sanitized snapshot outside this task; never copy unmasked company user data into a sandbox. No production connection, branch creation, or clone is authorized by this runbook.

## Initial state

- `APP_ENVIRONMENT_PROFILE=staging` or `pilot` selects its dedicated database URL.
- `NEON_BRANCH` must be exactly `staging` or `pilot`; `production` is rejected for either profile.
- `STAGING_DATABASE_HOST` / `STAGING_DATABASE_NAME`, `PILOT_DATABASE_HOST` / `PILOT_DATABASE_NAME`, and `PRODUCTION_DATABASE_HOST` / `PRODUCTION_DATABASE_NAME` are the approved identity allowlist. The URL host and database name must match the active profile exactly.
- Use only `STAGING_DATABASE_URL` with `STAGING_SESSION_SECRET` for staging, or `PILOT_DATABASE_URL` with `PILOT_SESSION_SECRET` for pilot. The generic production `DATABASE_URL` and `SESSION_SECRET` are rejected in those profiles.
- Configure branch-specific Neon Auth values and profile-specific R2 values only from the corresponding provider/secret-manager setup. Missing provider configuration stays unconfigured; no URL or API contract is inferred.
- `PILOT_ENABLED=false` keeps the pilot unavailable until a scoped internal authorization is recorded.
- `PILOT_SHADOW_MODE=true` is mandatory when pilot mode is enabled.
- Pilot scope must explicitly name site, department, line, and shift. A receiving record with any missing or non-matching scope value cannot create a simulated release decision.
- Existing records and records created before scope assignment remain unscoped (`NULL`) and are ineligible.
- `PILOT_REAL_MASTER_DATA_ENABLED` is locked off in the current implementation. A supplied approval reference alone is not approval evidence.

## Controlled onboarding of company master data

1. Keep pilot disabled and shadow mode enabled.
2. Obtain the approved company master-data source and written approval defining owner, site/department/line/shift scope, permitted fields, provenance, effective date, access, retention, and reconciliation method.
3. Have the designated Data/QMS owner map the approved source to the new nullable pilot scope attributes. Do not infer scope from product names, receiving state, or a physical inspection category.
4. Use a separately reviewed, access-controlled import implementation to bind source references and scope values. The current repository does not yet provide that import workflow; do not perform direct SQL updates as a workaround.
5. Reconcile imported rows against the approved source and record evidence in the controlled company system. Keep verification and approval as independent states.
6. Enable the pilot only after the authorization and the import workflow have been implemented and approved. This code does not treat configuration presence as verification or approval.

Synthetic fixtures may be used only in an isolated sandbox. They are not source-backed release authority and must never be used as company master data or official disposition evidence.

## Shadow decisions

In pilot profile, the only release path is `PILOT_SHADOW_MODE`. The app stores a distinct `SIMULATED_RELEASE` decision and matching audit event, while leaving the receiving workflow state, `release_system`, and released timestamps unchanged. No ERP/warehouse command is sent. A simulated application decision is not an official ERP/warehouse execution, physical disposition, or product release.

The simulation retains the existing server authorization, P-05 authority, inspection-author separation, policy, state, and version checks. It additionally requires exact configured scope match for all four scope dimensions. When a record lacks matching scope binding, the app records an immutable `PENDING_SCOPE_BINDING` request and audit event; it does not record a simulated decision. In-Process is not treated as Incoming or Final Inspection; no inspection applicability or acceptance criterion is inferred here.

The 2026-10-16 owner decision remains a scoped internal owner approval. It is not a formal electronic signature; e-signatures remain deferred on that path.

## Readiness and approval

The read-only control-center summary reports implementation, configuration, verification, and approval separately. `IMPLEMENTED` does not imply `CONFIGURED`; `CONFIGURED` does not imply `VERIFIED`; `VERIFIED` does not imply `APPROVED`. The current source intentionally reports pilot verification as `NOT VERIFIED` and approval as `NOT APPROVED`. The view does not connect to a database or check a health endpoint.

Local database command helpers require an explicit non-production `APP_ENVIRONMENT_PROFILE`. Production is always refused; development/test commands accept only loopback PostgreSQL; staging/pilot commands require the matching active profile identity and direct-credential target. Commands do not automatically run migrations or seed production masters.

## Disable and rollback controls

1. Set `PILOT_ENABLED=false` to stop new pilot decisions immediately at the application gate.
2. Preserve shadow mode as `PILOT_SHADOW_MODE=true`; never disable the safety gate to make pilot behave like production.
3. Keep existing simulated decision and audit records immutable for review. They do not change product disposition.
4. Remove or rotate pilot-only database, session, and file-store credentials through the approved secret manager when the environment is retired.
5. The additive migration is forward-only. Do not drop scope columns or shadow-decision records as rollback. Rollback means disabling the pilot and reverting application code only under the repository release process; no database rollback is specified or performed here.
6. This document describes controls only. It does not authorize a migration, deployment, production operation, or data import.

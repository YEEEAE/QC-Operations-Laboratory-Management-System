# Staging and internal pilot operations

## Purpose and boundary

Staging and pilot are separate runtime profiles. They use dedicated PostgreSQL URLs, session credentials, and file-storage credentials. The application rejects the generic `DATABASE_URL` alias when the staging or pilot profile is selected and rejects a non-production database URL whose host matches `PRODUCTION_DATABASE_HOST`. The explicitly configured `STAGING_DATABASE_HOST` or `PILOT_DATABASE_HOST` must match the selected URL. Do not reuse production credentials, hosts, databases, buckets, or access keys. A hostname in the environment banner is a label only; it is not evidence of isolation.

The Render Blueprint contains a staging web-service definition with auto-deploy disabled. It does not provision a database or storage bucket. An operator must provision separate non-production resources and credentials through the approved company secret manager before configuration. No production database, file store, ERP, or warehouse endpoint is configured by this runbook.

## Initial state

- `APP_ENVIRONMENT_PROFILE=staging` or `pilot` selects its dedicated database URL.
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

## Disable and rollback controls

1. Set `PILOT_ENABLED=false` to stop new pilot decisions immediately at the application gate.
2. Preserve shadow mode as `PILOT_SHADOW_MODE=true`; never disable the safety gate to make pilot behave like production.
3. Keep existing simulated decision and audit records immutable for review. They do not change product disposition.
4. Remove or rotate pilot-only database, session, and file-store credentials through the approved secret manager when the environment is retired.
5. The additive migration is forward-only. Do not drop scope columns or shadow-decision records as rollback. Rollback means disabling the pilot and reverting application code only under the repository release process; no database rollback is specified or performed here.
6. This document describes controls only. It does not authorize a migration, deployment, production operation, or data import.

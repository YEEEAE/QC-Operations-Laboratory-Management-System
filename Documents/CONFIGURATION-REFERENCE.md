# Runtime configuration reference

## Scope and ownership

The web service is Astro SSR on Node and reads runtime configuration on the server. Put secret values in the approved secret manager for each isolated service profile. `.env.example` contains names and blank placeholders only. Never pass a database URL, API key, session secret, or `process.env` object to a browser component, serialized page prop, log, trace, or user-visible error.

`APP_ENVIRONMENT_PROFILE` must explicitly select the profile in production, staging, and pilot services. `NEON_BRANCH` must match the server allowlist (`production`, `staging`, or `pilot`) and is still only a label: the application separately validates the selected URL's host and database name against the expected identity. A label alone is not provider attestation.

## Database variables

| Name | Consumer | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production/development/test runtime | Pooled application connection for the existing production profile. |
| `STAGING_DATABASE_URL` | Staging runtime | Dedicated staging application connection; retained as the established profile-specific name. |
| `PILOT_DATABASE_URL` | Pilot runtime | Dedicated pilot application connection; retained as the established profile-specific name. |
| `PRODUCTION_DATABASE_HOST` | Production, staging, pilot | Host identity metadata. Required for production and non-production profile separation. |
| `PRODUCTION_DATABASE_NAME` | Production, staging, pilot | Expected production database name; must match the production URL identity. |
| `STAGING_DATABASE_HOST` / `STAGING_DATABASE_NAME` | Staging; optional metadata elsewhere | Owner-approved staging identity allowlist. If either field is supplied, both are required. |
| `PILOT_DATABASE_HOST` / `PILOT_DATABASE_NAME` | Pilot; optional metadata elsewhere | Owner-approved pilot identity allowlist. If either field is supplied, both are required. |
| `DATABASE_URL_UNPOOLED` | Explicit operator migration tooling only | Direct migration/admin connection. The web runtime rejects a nonblank value and never selects it for its pool. |
| `MIGRATION_DATABASE_URL` | Existing operator migration tooling | Legacy direct-URL name retained for compatibility. If both direct names are set, they must be identical. |

The server-side allowlist maps each profile to exactly one URL variable, branch label, expected host, and expected database name. Production, staging, and pilot hosts must be distinct. A staging/pilot process rejects the generic production `DATABASE_URL`, production branch label, mismatched host/database, or another profile's URL. Development/test runtime and CLI targets are restricted to loopback PostgreSQL, and local development/test file-store credentials are rejected. Neon web-service URLs must use the pooled hostname; direct Neon endpoints are reserved for operator migration work. Do not configure another profile's URL or credentials in a web service. Provision distinct PostgreSQL resources and principals through the approved owner-controlled secret manager.

Neon pooled connections omit the unsupported `search_path` startup option; application Kysely queries explicitly qualify the `qc` schema, and raw application SQL uses qualified table names. UTC remains a startup setting. Direct maintenance/local connections retain the `qc,pg_catalog` search path. Use driver-supported connection parameters: this `pg` version supports `channel_binding=prefer` and rejects `channel_binding=require`; keep certificate verification enabled (`sslmode=verify-full`).

`DATABASE_URL_UNPOOLED` is only read by the migration CLI after the operator-only environment loader runs and the operator explicitly passes `--direct`. Without that selection, the CLI fails closed; it never falls back to the runtime pool. The CLI checks that the URL is direct, uses a database principal distinct from the runtime principal, and targets the active runtime database (treating Neon pooled/direct endpoint labels as the same target only when removing the `-pooler` suffix). The web pool only uses the selected pooled runtime URL. Do not add the direct URL to Render web-service environment settings.

## Auth and vendor variables

| Name | Handling |
| --- | --- |
| `NEON_AUTH_JWKS_URL` | Server-only HTTPS URL for public signing-key discovery. |
| `NEON_AUTH_ISSUER` | Server-only HTTPS issuer identifier. |
| `NEON_AUTH_AUDIENCE` | Server-only expected audience. |
| `NEON_AUTH_ENABLED` | Explicit server-side feature switch; defaults to `false`. Staging and pilot use their matching profile-specific switch. |
| `LOCAL_PASSWORD_LOGIN_ENABLED` | Explicit switch for the existing QC password login; defaults to `true`. Set to `false` only after an authorized replacement login path is implemented and accepted. |
| `EXPLABS_API_KEY` | Optional server-only secret. No ExLabs API base URL or provider contract is established by this repository; this value alone does not enable outbound processing. |
| `STAGING_NEON_AUTH_*`, `PILOT_NEON_AUTH_*` | Optional branch-specific Neon Auth validation values and enable switches; each profile's JWKS, issuer, and audience must be configured together. |
| `STAGING_EXPLABS_API_KEY`, `PILOT_EXPLABS_API_KEY` | Optional profile-specific secret names. No ExLabs API base URL or provider contract is established. |

If any Neon Auth validation setting is supplied, all three must be present and valid. The JWKS URL is pinned to the owner-supplied public discovery endpoint; issuer and audience must come from separately approved Neon Auth configuration and are never derived from a token. The optional JOSE verifier is server-only and disabled unless the active profile's `*_NEON_AUTH_ENABLED` switch is `true`. This switch does not enable external login: the middleware and login action still accept only the local QC session. `LOCAL_PASSWORD_LOGIN_ENABLED` gates the existing password login and defaults to `true`. External login remains unavailable until a provider client flow, subject proof, session freshness/revocation policy, and role/scope policy are approved and implemented. The verifier checks token cryptography and expected claims only; it does not establish a QC identity, check a Neon session's revocation state, create an application session, or grant roles/permissions/scopes. Keep values scoped per environment in protected settings. Do not expose them through `PUBLIC_*`, `import.meta.env` in browser code, HTML, or client bundles.

## Other production requirements

Production requires an explicit profile, its exact branch label, matching expected host and database name, `DATABASE_URL`, `SESSION_SECRET`, `SERVICE_VERSION`, and both login rate-limit values. Staging and pilot require their own URL, session-secret key (`STAGING_SESSION_SECRET` or `PILOT_SESSION_SECRET`), and complete profile-specific R2 file-store credentials. Their configured database identities must differ from each other and production. `PILOT_ENABLED` remains false until its independent governance requirements are met; when enabled, shadow mode and all four explicit scope values are required. `PILOT_REAL_MASTER_DATA_ENABLED` remains fail-closed.

`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` must be configured together. Optional R2 settings remain all-or-none and profile-specific. Environment presence alone does not prove provider connectivity, monitoring, backup persistence, approval, or release readiness.

## Provisioning checklist

1. Choose the profile explicitly with `APP_ENVIRONMENT_PROFILE`; never infer it from `NEON_BRANCH`.
2. Have an operator create each Neon branch and its PostgreSQL resources out-of-band; this repository does not create or clone branches. Never copy unmasked company user data into a sandbox. Use only an approved sanitized snapshot or a schema-only source prepared outside this change.
3. Record the active profile's owner-approved host/database identity in protected settings. Staging and pilot also require the production identity so separation can be checked. An unprovisioned inactive profile does not block startup; any additional identity metadata must be complete and its host distinct. Configure only the active profile's pooled URL and dedicated session/storage credentials in that service.
4. Keep branch-specific Auth and optional vendor credentials in their profile's protected settings. Do not copy production credentials into staging or pilot.
5. Keep Neon Auth disabled unless its issuer/audience, subject mapping, session-revocation behavior, and transition policy are separately approved. Keep ExLabs disabled unless its provider contract and owner approval are established.

For an existing Render service, verify its actual environment settings before deploying a changed runtime contract. A checked-in `render.yaml` does not update a service that is not managed by that Blueprint. Production needs `APP_ENVIRONMENT_PROFILE=production`, `NEON_BRANCH=production`, the verified pooled `DATABASE_URL`, and matching `PRODUCTION_DATABASE_HOST` / `PRODUCTION_DATABASE_NAME` in addition to its existing session/version/rate-limit settings.

See [NEON-CREDENTIAL-ROTATION-RUNBOOK.md](NEON-CREDENTIAL-ROTATION-RUNBOOK.md) for handling the credentials disclosed during the configuration request.

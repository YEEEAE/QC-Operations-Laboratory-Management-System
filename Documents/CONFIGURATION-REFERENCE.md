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
| `STAGING_DATABASE_HOST` / `STAGING_DATABASE_NAME` | Production, staging, pilot | Owner-approved staging identity allowlist. |
| `PILOT_DATABASE_HOST` / `PILOT_DATABASE_NAME` | Production, staging, pilot | Owner-approved pilot identity allowlist. |
| `DATABASE_URL_UNPOOLED` | Explicit operator migration tooling only | Direct migration/admin connection. The web runtime rejects a nonblank value and never selects it for its pool. |
| `MIGRATION_DATABASE_URL` | Existing operator migration tooling | Legacy direct-URL name retained for compatibility. If both direct names are set, they must be identical. |

The server-side allowlist maps each profile to exactly one URL variable, branch label, expected host, and expected database name. Production, staging, and pilot hosts must be distinct. A staging/pilot process rejects the generic production `DATABASE_URL`, production branch label, mismatched host/database, or another profile's URL. Development/test runtime and CLI targets are restricted to loopback PostgreSQL, and local development/test file-store credentials are rejected. Neon web-service URLs must use the pooled hostname; direct Neon endpoints are reserved for operator migration work. Do not configure another profile's URL or credentials in a web service. Provision distinct PostgreSQL resources and principals through the approved owner-controlled secret manager.

`DATABASE_URL_UNPOOLED` is only read by the migration CLI after the operator-only environment loader runs and the operator explicitly passes `--direct`. Without that selection, the CLI fails closed; it never falls back to the runtime pool. The CLI checks that the URL is direct, uses a database principal distinct from the runtime principal, and targets the active runtime database (treating Neon pooled/direct endpoint labels as the same target only when removing the `-pooler` suffix). The web pool only uses the selected pooled runtime URL. Do not add the direct URL to Render web-service environment settings.

## Auth and vendor variables

| Name | Handling |
| --- | --- |
| `NEON_AUTH_JWKS_URL` | Server-only HTTPS URL for public signing-key discovery. |
| `NEON_AUTH_ISSUER` | Server-only HTTPS issuer identifier. |
| `NEON_AUTH_AUDIENCE` | Server-only expected audience. |
| `EXPLABS_API_KEY` | Optional server-only secret. No ExLabs API base URL or provider contract is established by this repository; this value alone does not enable outbound processing. |
| `STAGING_NEON_AUTH_*`, `PILOT_NEON_AUTH_*` | Optional branch-specific Neon Auth validation values; each profile's JWKS, issuer, and audience must be configured together. |
| `STAGING_EXPLABS_API_KEY`, `PILOT_EXPLABS_API_KEY` | Optional profile-specific secret names. No ExLabs API base URL or provider contract is established. |

If any Neon Auth validation setting is supplied, all three must be present and valid. These settings do not migrate or replace the application's existing identity provider and are not evidence that Neon Auth is wired or operational. Keep values scoped per environment in the service's protected environment settings. Do not expose them through `PUBLIC_*`, `import.meta.env` in browser code, HTML, or client bundles.

## Other production requirements

Production requires an explicit profile, its exact branch label, matching expected host and database name, `DATABASE_URL`, `SESSION_SECRET`, `SERVICE_VERSION`, and both login rate-limit values. Staging and pilot require their own URL, session-secret key (`STAGING_SESSION_SECRET` or `PILOT_SESSION_SECRET`), and complete profile-specific R2 file-store credentials. Their configured database identities must differ from each other and production. `PILOT_ENABLED` remains false until its independent governance requirements are met; when enabled, shadow mode and all four explicit scope values are required. `PILOT_REAL_MASTER_DATA_ENABLED` remains fail-closed.

`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` must be configured together. Optional R2 settings remain all-or-none and profile-specific. Environment presence alone does not prove provider connectivity, monitoring, backup persistence, approval, or release readiness.

## Provisioning checklist

1. Choose the profile explicitly with `APP_ENVIRONMENT_PROFILE`; never infer it from `NEON_BRANCH`.
2. Have an operator create each Neon branch and its PostgreSQL resources out-of-band; this repository does not create or clone branches. Never copy unmasked company user data into a sandbox. Use only an approved sanitized snapshot or a schema-only source prepared outside this change.
3. Record all three owner-approved host/database identities in protected settings, then configure only the active profile's pooled URL and dedicated session/storage credentials in that service.
4. Keep branch-specific Auth and optional vendor credentials in their profile's protected settings. Do not copy production credentials into staging or pilot.
5. Keep Auth and ExLabs capabilities disabled unless their provider contract, owner approval, and server-side integration are separately established.

See [NEON-CREDENTIAL-ROTATION-RUNBOOK.md](NEON-CREDENTIAL-ROTATION-RUNBOOK.md) for handling the credentials disclosed during the configuration request.

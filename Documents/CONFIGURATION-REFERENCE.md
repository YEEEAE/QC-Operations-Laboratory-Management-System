# Runtime configuration reference

## Scope and ownership

The web service is Astro SSR on Node and reads runtime configuration on the server. Put secret values in the approved secret manager for each isolated service profile. `.env.example` contains names and blank placeholders only. Never pass a database URL, API key, session secret, or `process.env` object to a browser component, serialized page prop, log, trace, or user-visible error.

`APP_ENVIRONMENT_PROFILE` selects the application profile. `NEON_BRANCH` is an operator-supplied label only; `NEON_BRANCH=production` does not prove which database a URL reaches and grants no permission to connect. The application checks the configured PostgreSQL hostname against the profile's separately configured host label. Host labels are metadata and must not be treated as provider attestation.

## Database variables

| Name | Consumer | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production/development/test runtime | Pooled application connection for the existing production profile. |
| `STAGING_DATABASE_URL` | Staging runtime | Dedicated staging application connection; retained as the established profile-specific name. |
| `PILOT_DATABASE_URL` | Pilot runtime | Dedicated pilot application connection; retained as the established profile-specific name. |
| `PRODUCTION_DATABASE_HOST` | Production, staging, pilot | Host identity metadata. Required for production and non-production profile separation. |
| `STAGING_DATABASE_HOST` | Staging runtime | Must match the host in `STAGING_DATABASE_URL` and differ from production. |
| `PILOT_DATABASE_HOST` | Pilot runtime | Must match the host in `PILOT_DATABASE_URL` and differ from production. |
| `DATABASE_URL_UNPOOLED` | Explicit operator migration tooling only | Direct migration/admin connection. The web runtime rejects a nonblank value and never selects it for its pool. |
| `MIGRATION_DATABASE_URL` | Existing operator migration tooling | Legacy direct-URL name retained for compatibility. If both direct names are set, they must be identical. |

The runtime rejects a staging/pilot profile that also receives the generic production `DATABASE_URL`, a URL whose host disagrees with its configured profile host, or a non-production host equal to the production host. Neon web-service URLs must use the pooled hostname; direct Neon endpoints are reserved for operator migration work. The runtime also compares non-secret SHA-256 identity fingerprints for any multiple profile URLs supplied to one process and rejects duplicate identities. Do not configure another profile's URL in a web service. Provision distinct database principals and credentials out-of-band for each service; a host label cannot prove that passwords differ across separately configured services.

`DATABASE_URL_UNPOOLED` is only read by the migration CLI after the operator-only environment loader runs and the operator explicitly passes `--direct`. Without that selection, the CLI fails closed; it never falls back to the runtime pool. The CLI checks that the URL is direct, uses a database principal distinct from the runtime principal, and targets the active runtime database (treating Neon pooled/direct endpoint labels as the same target only when removing the `-pooler` suffix). The web pool only uses the selected pooled runtime URL. Do not add the direct URL to Render web-service environment settings.

## Auth and vendor variables

| Name | Handling |
| --- | --- |
| `NEON_AUTH_JWKS_URL` | Server-only HTTPS URL for public signing-key discovery. |
| `NEON_AUTH_ISSUER` | Server-only HTTPS issuer identifier. |
| `NEON_AUTH_AUDIENCE` | Server-only expected audience. |
| `EXPLABS_API_KEY` | Optional server-only secret. No ExLabs API base URL or provider contract is established by this repository; this value alone does not enable outbound processing. |

If any Neon Auth validation setting is supplied, all three must be present and valid. These settings do not migrate or replace the application's existing identity provider and are not evidence that Neon Auth is wired or operational. Keep values scoped per environment in the service's protected environment settings. Do not expose them through `PUBLIC_*`, `import.meta.env` in browser code, HTML, or client bundles.

## Other production requirements

Production requires `DATABASE_URL` (or the profile-specific database URL for staging/pilot), `PRODUCTION_DATABASE_HOST` for the production profile, `SESSION_SECRET`, `SERVICE_VERSION`, and both login rate-limit values. `PILOT_ENABLED` remains false until its independent governance requirements are met; when enabled, shadow mode and all four explicit scope values are required. `PILOT_REAL_MASTER_DATA_ENABLED` remains fail-closed.

`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` must be configured together. Optional R2 settings remain all-or-none and profile-specific. Environment presence alone does not prove provider connectivity, monitoring, backup persistence, approval, or release readiness.

## Provisioning checklist

1. Choose the profile explicitly with `APP_ENVIRONMENT_PROFILE`; never infer it from `NEON_BRANCH`.
2. Provision a dedicated database and runtime principal for that profile. Use the pooled URL for application traffic and a separately scoped direct principal for operator migration work.
3. Record the expected host metadata in the same protected service configuration and compare it to the provider-issued URL before enabling the service.
4. Store each profile's session, database, storage, and optional provider credentials in that profile's protected secret manager. Do not copy production credentials into staging or pilot.
5. Keep Auth and ExLabs capabilities disabled unless their provider contract, owner approval, and server-side integration are separately established.

See [NEON-CREDENTIAL-ROTATION-RUNBOOK.md](NEON-CREDENTIAL-ROTATION-RUNBOOK.md) for handling the credentials disclosed during the configuration request.

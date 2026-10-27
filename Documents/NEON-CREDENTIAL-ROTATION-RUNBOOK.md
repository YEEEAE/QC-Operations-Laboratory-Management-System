# Neon and vendor credential rotation runbook

## Status and boundary

The database password and `EXPLABS_API_KEY` disclosed with the configuration request must be treated as exposed. The application owner must rotate them out-of-band using the provider consoles and approved secret manager. This runbook documents operator actions only; it does not rotate credentials through an API, connect to a database, or authorize production changes.

Do not paste secret values into tickets, chat, source, command arguments, screenshots, logs, or this document. This repository must contain variable names only. If a credential is invalidated before its replacement is installed, the related service may fail closed until configuration is complete.

## Database credential rotation

1. Identify every authorized consumer of the exposed database principal and the approved maintenance window. Do not assume the branch label identifies the database.
2. In the Neon owner console, provision a replacement runtime role with only the database privileges required by the application. Provision a separate migration role for controlled operator work; do not reuse the runtime role for migrations.
3. Obtain the provider-issued pooled runtime URL for the application role and direct URL for the migration role. Do not copy either value into this repository. Keep `DATABASE_URL_UNPOOLED` in operator-only secret storage; keep only the pooled, profile-appropriate URL in the web service.
4. Update the production service's protected settings for `DATABASE_URL` and `PRODUCTION_DATABASE_HOST`. Update staging and pilot independently using their established `STAGING_DATABASE_URL` / `PILOT_DATABASE_URL` names and their own host metadata. Do not copy a URL or password between profiles.
5. Update the operator secret entry for `DATABASE_URL_UNPOOLED`. `MIGRATION_DATABASE_URL` is a retained compatibility alias; if both direct names are present, set them to the same URL or remove the legacy alias.
6. Have the authorized owner verify the target identity and service behavior through the approved release process. Only after replacement consumers are accounted for, revoke the exposed database credential in Neon. Do not change or apply schema as part of credential rotation.
7. Remove any exposed copies from secret stores or operational notes where policy permits, and record the rotation event without recording secret material.

## ExLabs key rotation

1. In the ExLabs owner console, revoke or rotate the disclosed key and issue a replacement only if an approved provider contract and business need exist.
2. Store the replacement as `EXPLABS_API_KEY` in the protected environment settings for the specific service profile. Do not share the same key across production, staging, and pilot.
3. The current repository does not define the ExLabs API base URL or request contract and does not use this key to enable an integration. Do not add an endpoint, send a request, or enable external processing based only on key availability.
4. Confirm revocation with the provider owner and record the event without retaining either key.

## After rotation

- Keep `APP_ENVIRONMENT_PROFILE` explicit and `NEON_BRANCH` treated as a label only.
- Keep the unpooled URL out of all web-service configuration, client bundles, logs, traces, and user-safe errors.
- Review secret access and audit history in the provider and secret manager using the approved owner process.
- Rotation is not evidence of database connectivity, migration parity, UAT, production acceptance, or release readiness.

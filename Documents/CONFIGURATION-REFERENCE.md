# Configuration reference

**Status:** CURRENT / AUTHORITATIVE for the typed configuration layer
**Source of truth:** `src/config/env.ts` (`parseServerEnv`), `src/config/constants.ts`,
and the module-specific parsers referenced below.

This document lists every environment variable the server configuration layer
recognizes, its approved default, and the impact of changing it. Values are never
recorded here; secret values belong only in the local untracked `.env` or the
provider secret manager. `.env.example` carries variable names only.

## Validation contract

- Configuration is **typed and fail-closed**: `parseServerEnv` validates the
  process environment with a Zod schema and throws `InvalidEnvironmentError`
  listing only the affected variable **names** — never their values.
- The middleware converts an invalid environment into a sanitized `503`
  problem response with security headers; no request runs against an invalid
  configuration, and no value is logged.
- In `production`, startup validation additionally requires `DATABASE_URL`,
  `SESSION_SECRET`, an explicit `SERVICE_VERSION`, and the login rate-limit
  pair (SECURITY-ARCHITECTURE §142 forbids unlimited-abuse exposure on login).
- Paired settings are all-or-none: OTEL endpoint/headers and the four `R2_*`
  backup settings must be configured together or not at all.
- The AI advisory providers have their own fail-closed parser
  (`src/modules/ai-advisory/infrastructure/ai-configuration.ts`): any invalid
  field disables external providers and is reported through `invalidFields`;
  external processing stays off unless `AI_EXTERNAL_PROCESSING_APPROVED=true`.

## Core runtime

| Variable | Type / allowed values | Approved default | Required when | Change impact |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | `development` / `test` / `production` | `development` | always (defaulted) | Switches fail-closed production requirements, security-header profile, and high-risk rate-limit enforcement. Setting `production` without the required keys stops the service with a sanitized 503. |
| `DATABASE_URL` | `postgres://` / `postgresql://` URL | none | `production` | Changing it repoints every read/write; TLS policy is enforced by the canonical connection config (`sslmode=disable` is rejected). |
| `SESSION_SECRET` | string, min 32 chars | none | `production` | Rotating it invalidates existing sessions. Never commit or log it. |
| `SERVICE_VERSION` | non-empty string | `0.1.0` | explicit in `production` | Feeds release identity and structured-log `service_version`; must match the deployed artifact version. |
| `LOG_LEVEL` | `fatal` / `error` / `warn` / `info` / `debug` / `trace` / `silent` | `info` | optional | Changes log verbosity only. Unknown values are rejected at validation; the request-path logger degrades an unexpected value to `info` because logging must never break a request. |

## Release evidence (optional, sanitized)

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `RELEASE_ID` | non-empty string | unset | Overrides the derived local release identity; a wrong value breaks candidate binding. |
| `RELEASE_BUILD_ID` | non-empty string | unset | Part of release evidence identity. |
| `RELEASE_BUILD_TIMESTAMP` | non-empty string | unset | Part of release evidence identity. |
| `RELEASE_ENVIRONMENT` | `local` / `test` / `ci` / `staging` / `production` | unset | Labels evidence; `production` evidence is only valid from the real deployment path. |
| `RELEASE_GIT_SHA` | string | unset | Binds evidence to an exact candidate. |
| `RELEASE_MIGRATION_HEAD` | string | unset | Binds evidence to a schema head. |

All six release values are injected by the build/deployment system; local runs
produce explicitly non-production evidence.

## Rate limiting

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `RATE_LIMIT_LOGIN_MAX` | digits | unset (no limit outside production) | Together with the window, sets the login attempt ceiling. Both are required in `production`; a partial pair is rejected as `SYSTEM_CONFIGURATION_INVALID` at the policy boundary. |
| `RATE_LIMIT_LOGIN_WINDOW_SECONDS` | digits | unset (no limit outside production) | Same pairing rule as above. |

## Observability (paired)

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | URL | unset (no-op providers) | Enables trace/metric export when paired with headers. Unpaired configuration fails validation. Delivery to a real backend remains operator-configured. |
| `OTEL_EXPORTER_OTLP_HEADERS` | non-empty string | unset | Must be paired with the endpoint; may carry credentials — never commit or log it. |

## Backup artifact storage (all four together)

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `R2_ENDPOINT` | HTTPS URL | unset (local file artifacts) | Selects the Cloudflare R2 artifact store. Any partial subset of the four `R2_*` keys fails validation. |
| `R2_ACCESS_KEY_ID` | non-empty string | unset | Credential — secret manager only. |
| `R2_SECRET_ACCESS_KEY` | non-empty string | unset | Credential — secret manager only. |
| `R2_BUCKET` | bucket name, min 3 chars | unset | Destination bucket; the store additionally enforces the safe bucket pattern and HTTPS. |

## AI advisory providers (fail-closed, default off)

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `AI_EXTERNAL_PROCESSING_APPROVED` | `true` / `false` | `false` | Technical gate only — not evidence of approval. When `false` or any provider field is invalid, the `DisabledAiProvider` is used and no external call is possible. |
| `AI_PRIMARY_PROVIDER` | `groq` / `gemini` | `groq` | Selection only; inert while the gate is `false`. |
| `AI_FALLBACK_PROVIDER` | `groq` / `gemini` | `gemini` | Selection only; inert while the gate is `false`. |
| `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL` | strings / HTTPS URL | unset / provider defaults | Credential and model selection for Groq; key is secret-manager only. |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL` | strings / HTTPS URL | unset / provider defaults | Same contract for Gemini. |

## Operator and verification harness variables

`BOOTSTRAP_ADMIN_*`, `QC_VERIFY_*`, `QC_UAT_*`, `QC_SEED_ALLOW_NON_PRODUCTION`,
`QC_VERIFICATION_SEED_ALLOW`, and `QC_VERIFICATION_OPERATOR_IDENTITY` belong to
one-time operator commands and non-production verification harnesses. They are
parsed by their owning scripts with explicit non-production guards, are never
read by the request path, and must be removed after use. `HOST` / `PORT` select
the local bind for the built server; `PGPASSFILE` and `PG_VERSION_CONTEXT` are
PostgreSQL tooling context for the local backup executor. None of these carry
approved defaults beyond what their owning script documents.

## Change-management rules

1. Adding or renaming a variable requires updating `src/config/constants.ts`
   (`ENV_KEYS`), the schema in `src/config/env.ts`, `.env.example` (names only),
   this reference, and the unit contract in `tests/unit/config/`.
2. Tightening a validation rule is a breaking runtime change: record the change
   impact above and re-run the configuration unit tests, the middleware
   configuration-failure path, and the build before relying on it.
3. Never introduce a default that weakens a fail-closed control (production
   requirements, pairing rules, AI gate, TLS enforcement).
4. Secret values never appear in this document, `.env.example`, tests, logs, or
   audit artifacts.


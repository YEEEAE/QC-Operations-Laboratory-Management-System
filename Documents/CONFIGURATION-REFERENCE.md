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

## Release evidence

The six runtime identity elements are generated into `dist/release-identity.json`
from the checked-out Git SHA, Render's `RENDER_GIT_COMMIT`, the ordered source
migrations, the build timestamp, the explicit build environment, and the
server-entry SHA-256. Runtime reads this artifact and compares the running
server entry bytes before marking fields `VERIFIED`. They are not operator-set
environment variables; browser query/body fields cannot override them. Missing,
invalid, stale, or mismatched artifact/runtime evidence stays `UNVERIFIED`.
`SERVICE_VERSION` remains a separate core runtime setting and cannot establish
release identity or approval by itself.

## Rate limiting

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `RATE_LIMIT_LOGIN_MAX` | digits | unset (no limit outside production) | Together with the window, sets the login attempt ceiling. Both are required in `production`; a partial pair is rejected as `SYSTEM_CONFIGURATION_INVALID` at the policy boundary. |
| `RATE_LIMIT_LOGIN_WINDOW_SECONDS` | digits | unset (no limit outside production) | Same pairing rule as above. |

## Observability (paired)

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | URL | unset (no-op providers) | Paired values are parsed and exposed in runtime diagnostics; this does not currently wire an exporter. The application telemetry providers remain no-op unless an adapter is installed in code. Unpaired configuration fails validation. |
| `OTEL_EXPORTER_OTLP_HEADERS` | non-empty string | unset | Must be paired with the endpoint; may carry credentials — never commit or log it. |

## Backup artifact storage (all four together)

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `R2_ENDPOINT` | HTTPS URL | unset (no durable server store selected) | Used by the explicit daily-backup script to select Cloudflare R2. Any partial subset of the four `R2_*` keys fails validation. The in-memory `LocalArtifactStore` is for isolated execution only; it is not a file-backed or durable production fallback. |
| `R2_ACCESS_KEY_ID` | non-empty string | unset | Credential — secret manager only. Required with the endpoint, secret key, and bucket for the daily-backup script. |
| `R2_SECRET_ACCESS_KEY` | non-empty string | unset | Credential — secret manager only. Required with the endpoint, access key, and bucket for the daily-backup script. |
| `R2_BUCKET` | bucket name, min 3 chars | unset | Destination bucket; the store additionally enforces the safe bucket pattern and HTTPS. Required with the other three values for the daily-backup script. |

### Server-side integration status

The environment schema validates configuration; it does not prove a provider is
reachable or that application code uses it. At the 2026-10-01 environment
comparison, all four R2 variables and both OTEL variables were absent from the
service. The daily backup script explicitly constructs the R2 adapter, but it
is not scheduled or wired to the web application's backup catalog. The local
artifact adapter stores bytes in process memory and is used by isolated tests;
it cannot provide persistent server backup storage. The OTEL SDK API is a
dependency, but the application still installs no exporter and keeps no-op
tracer/meter providers. Do not mark either integration active based on env
variable presence alone.

Until a durable provider and its scheduler/restore path are approved and
implemented, backup storage and recovery remain unverified. A future R2 setup
requires an owner-approved provider/bucket and access scope; enter all four
`R2_*` values in the server secret manager, run the candidate-bound artifact
round-trip and isolated restore checks, and verify least-privilege access. Do
not create a paid resource or enter credentials as part of local preparation.
OTEL remains optional while no monitoring backend is approved. Once its
exporter is implemented and a backend is approved, configure
`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` together in the
server secret manager, then verify an emitted signal and provider outage
handling. Header values can carry credentials and must never enter source,
logs, or evidence.

## AI advisory providers (fail-closed, default off)

Provider-selection defaults (`groq` and `gemini`) are routing preferences only;
they do not indicate that credentials exist, that a provider is reachable, or
that processing is approved. Missing key/model settings, invalid settings,
owner approval, the complete policy artifact, provider availability, and
per-request consent are separate gates. The request path must remain closed
when any required gate is absent. Health reports database schema readiness
separately from AI provider availability.

| Variable | Type | Approved default | Change impact |
| --- | --- | --- | --- |
| `AI_EXTERNAL_PROCESSING_APPROVED` | `true` / `false` | `false` | Technical gate only — not evidence of approval. When `false` or any provider field is invalid, the `DisabledAiProvider` is used and no external call is possible. |
| `AI_PRIMARY_PROVIDER` | `groq` / `gemini` | `groq` | Selection only; inert while the gate is `false`. |
| `AI_FALLBACK_PROVIDER` | `groq` / `gemini` | `gemini` | Selection only; inert while the gate is `false`. |
| `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL` | strings / exact allowlisted HTTPS endpoint | unset / `https://api.groq.com/openai/v1/chat/completions` | Credential and model selection for Groq; key is secret-manager only. Any other endpoint invalidates AI provider configuration. |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL` | strings / exact allowlisted HTTPS base URL | unset / `https://generativelanguage.googleapis.com/v1beta` | Same contract for Gemini. Any other endpoint invalidates AI provider configuration. |

## Operator and verification harness variables

The application's `.env.example` and Render service use canonical runtime keys
only. `DATABASE_URL` is the only supported runtime database setting; the app
does not accept aliases such as `Database`, `Internal_Database_URL`, or
`External_Database_URL`. `Hostname`, `Port`, `Username`, `Password`, and
`PSQL_Command` are provider-export/operator fields, not application settings.
`API_Render` is an operator API credential and is not an application key. These
provider-export fields are not present in `ENV_KEYS`, the runtime parser, the
Render blueprint, or either local env loader.

`BOOTSTRAP_ADMIN_*`, `SYSTEM_OWNER_LOGIN_IDENTITY`, `QC_VERIFY_*`, `QC_E2E_*`,
`QC_UAT_*`, `QC_SEED_ALLOW_NON_PRODUCTION`, `QC_VERIFICATION_SEED_ALLOW`,
`QC_VERIFICATION_OPERATOR_IDENTITY`, and `QC_MASTER_DATA_IMPORT_ALLOW` are
operator-only settings for their named bootstrap, verification, UAT, or seed
commands. Keep their names in `operator.env.example`; do not copy them into the
web-service runtime. Generic `loadLocalEnv()` reads only canonical application
settings. Guarded operator CLIs must explicitly opt into
`loadLocalOperatorEnv()`, and their own non-production authorization checks
remain mandatory. No API credential or provider connection export is loaded by
that operator allowlist. Remove temporary operator values after their approved
use.

`HOST` / `PORT` select a local bind for the built server; `PGPASSFILE` and
`PG_VERSION_CONTEXT` are PostgreSQL tooling context for the local backup
executor. None of these carry approved defaults beyond what their owning tool
documents.

## Change-management rules

1. Adding or renaming a runtime variable requires updating
   `src/config/constants.ts` (`ENV_KEYS`), the schema in `src/config/env.ts`,
   `.env.example` (names only), this reference, and the unit contract in
   `tests/unit/config/`. Operator-only variables belong in the owning CLI's
   allowlist and `operator.env.example`; they must not be added to `ENV_KEYS` or
   the runtime schema.
2. Tightening a validation rule is a breaking runtime change: record the change
   impact above and re-run the configuration unit tests, the middleware
   configuration-failure path, and the build before relying on it.
3. Never introduce a default that weakens a fail-closed control (production
   requirements, pairing rules, AI gate, TLS enforcement).
4. Secret values never appear in this document, `.env.example`, tests, logs, or
   audit artifacts.

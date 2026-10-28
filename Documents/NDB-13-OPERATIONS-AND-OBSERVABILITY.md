# NDB-13 — operational overview and observability contract

## Status and evidence boundary

This is a source and operator-documentation contract. Editing this file does not verify service availability, Neon identity, database grants, migration application, monitoring delivery, company pilot configuration, QC acceptance, regulatory approval, or production release. Missing evidence is `NOT VERIFIED`, `UNAVAILABLE`, or `NOT CONFIGURED`; it is never converted to a healthy default.

The read-only `/system/health` view uses server-side configuration and existing database-backed read models. `/system/control-center` remains restricted to the active canonical `yazeed` / `SYSTEM_OWNER` identity. No JWKS request, ExLabs request, or additional external provider probe is part of this overview.

## Four separate operational decisions

| Layer | Source | What it establishes | What it does not establish |
| --- | --- | --- | --- |
| Liveness | `GET /api/health/live` | The process can return its liveness response. | Database readiness, workflow availability, QC acceptance, or approval. |
| Operational readiness | `GET /api/health/ready` and the matching server-side probes | PostgreSQL reachability and required Reject Reports capability. | Migration approval, QC acceptance, regulatory/QMS approval, or product release. |
| QC operations acceptance | Owner-controlled acceptance evidence | Only the evidence accepted by its approved QC gate. | Regulatory approval or software deployment authorization. Health does not create this evidence. |
| Regulatory / QMS approval | Controlled QMS source and authorized decision record | The decision recorded by the approved authority. | Runtime, database, or deployment availability. No such source is inferred by this health view. |

Release GO/NO-GO and software deployment release remain separate decisions. A passing process, database, schema, or workflow probe is not a product release decision.

## Configuration source boundaries

| Variable or source | Safe display | Meaning and limit |
| --- | --- | --- |
| `APP_ENVIRONMENT_PROFILE` | Profile label | Server-selected environment profile. It is configuration, not deployment attestation. |
| `NEON_BRANCH` | Branch label | Metadata checked against the configured profile. It is not a branch ID, provider lookup, host identity, or proof of database target. |
| `DATABASE_URL` | Reachability class only | Secret-bearing pooled PostgreSQL runtime DSN. Never render its value, hostname, database name, username, or error text. |
| `NEON_AUTH_JWKS_URL` | `NOT VERIFIED` unless separately evidenced | Public signing-key discovery configuration. It is not a PostgreSQL DSN and is not probed by this page. JWKS configuration or API availability is not a database-health signal. Issuer/audience and login/session policy still require owner approval. |
| `EXPLABS_API_KEY` | `UNAVAILABLE` / `NOT CONFIGURED` | Secret name only. Provider base URL, API contract, data policy, and owner authorization are absent; do not send requests. Key presence must never proxy for PostgreSQL or production health. |

Do not serialize environment objects into HTML or browser assets. Preserve the pooled-runtime versus direct-operator DSN boundary described by `CONFIGURATION-REFERENCE.md` and `NEON-CREDENTIAL-ROTATION-RUNBOOK.md`.

## Read-only status fields

The system health view may show the configured environment profile and Neon branch label; the expected migration head from the configured release identity (or the current build's shipped head when that identity is unavailable); the applied head read from the migration ledger; and a sanitized database reachability class. If the ledger or source cannot be read, show `UNKNOWN` / `NOT VERIFIED`, never the applied value as the expected head.

Backup job state, artifact verification, and restore verification are separate fields. A verified restore is paired with its source restore-run ID, type, and recorded verification timestamp when present. No backup record is `NO CATALOG DATA`; missing restore evidence is `RESTORE NOT VERIFIED`. Backup success, artifact checksum verification, and a restore drill are distinct evidence. The current recovery source and operator procedure still have known gaps; see `BACKUP-RECOVERY-PLAN.md` and the draft `RESTORE-DRILL-RUNBOOK.md`.

Service availability is a server-side process probe, not an external uptime check. The liveness endpoint itself is not called back from the SSR page. Do not treat an optional provider's availability as a PostgreSQL or service-health proxy.

## Non-secret database observability definitions

Metrics must use bounded names and labels only. The default telemetry meter is no-op and no OTLP exporter is wired; configured `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_EXPORTER_OTLP_HEADERS` presence does not prove metric delivery. Do not expose SQL text, bind values, company identifiers, user identifiers, DSNs, hostnames, credentials, or exception messages as metric labels.

| Signal | Definition | Safe dimensions / current boundary |
| --- | --- | --- |
| Pool exhaustion | Pool is saturated when `totalCount` is at its configured maximum, `idleCount` is zero, and one or more clients are waiting. Track sampled waiting/total/idle counts and a bounded exhaustion observation; do not infer saturation from connection count alone. | No query or record labels. A production pool exhaustion meter/sampler is not currently wired. |
| Connection error class | Classify failures from stable PostgreSQL/network error codes into `NETWORK`, `CONSTRAINT`, or `OTHER`; never use the raw message. | `qc_db_queries_total` error events may carry `error_family`; keep labels bounded. |
| Query duration histogram | Record elapsed milliseconds for successful and failed Kysely queries. | `qc_db_query_duration_ms`; successful events carry bounded `statement_kind`, failures carry bounded `error_family`, and both carry `outcome`. Durations do not include SQL parameters. |
| Outbox backlog | Read-only count of unprocessed, currently available, and retrying messages plus oldest pending age and last processed time. | `qc_outbox_pending` and health view aggregate only; no payload or destination values. Worker heartbeat and receiver delivery remain `NOT RECORDED` / `NOT REPRESENTED`. |
| Slow-query identifier | Use a reviewed static application operation ID and bounded statement kind if a slow-query registry is later approved. Never use SQL text, a literal-bearing SQL hash, parameters, or row identity as the identifier. | No complete slow-query registry is currently configured; do not claim one exists. Provider-side query analytics are outside this source contract. |

Metrics are diagnostic only. They do not replace the append-only QC audit ledger or controlled decision evidence.

## Tenant scope and control-center access

The admin/control-center overview contains global account, role, scope-assignment, and audit projections. Its route is `YAZEED_ONLY` and the server additionally checks the canonical active `yazeed` / `SYSTEM_OWNER` identity. Generic `PERM-HLTH-VIEW` or other health permissions do not grant access to this page or its cross-company projections. UI visibility is not the authorization boundary.

Company operational data must remain behind the owning domain's server-side permission and tenant/scope predicates. A system-health overview may display only sanitized system-level statuses and must not list tenant records, counts, identifiers, or raw diagnostic data. Preserve existing sidebar visibility and server authorization rules.

## Operational runbook inventory

This inventory reflects files present in this checkout; references to expected-but-missing docs are not claims that a procedure is approved.

| Operation | Current source | Inventory state / remaining requirement |
| --- | --- | --- |
| Secret rotation | `NEON-CREDENTIAL-ROTATION-RUNBOOK.md` | Present; owner-led, out-of-band rotation only. Credential material remains excluded from repository and evidence. |
| Neon branches and PostgreSQL role grants | `CONFIGURATION-REFERENCE.md` (partial setup guidance) | No dedicated branch/grant runbook found. Owner must approve branch identity, runtime least-privilege grants, separate migration principal, grant/revocation evidence, and profile isolation before provisioning. |
| Schema release | `RENDER-MIGRATION-RUNBOOK.md` | Present as a source-level controlled migration plan, but its static inventory stops at `0053` while current source has advanced. Refresh the inventory before operator use; it does not show that any migration was applied. |
| User enrollment | Existing owner-gated `/system/control-center` account workflow | No dedicated approved enrollment runbook found. Enrollment, identity proof, role/scope authorization, training, and deactivation procedure require owner/QMS decisions. |
| Incident response | None found in this checkout | Incident commander, severity, escalation, notification, evidence preservation, and recovery authority remain to be defined in an approved runbook. |
| Disaster recovery | `BACKUP-RECOVERY-PLAN.md`, `RESTORE-DRILL-RUNBOOK.md` | Recovery plan is present and restore drill is a draft. Provider retention/PITR, file-store identity/bytes, isolated target, RPO/RTO, and independent verification remain unresolved or unverified. |
| Controlled GO/NO-GO | 19-gate release governance source; no `RELEASE-RUNBOOK.md` found | Dedicated runbook and accepted current gate register are absent. A status page cannot authorize product release, deployment, or QC acceptance. |

The generated workspace map may still list historical planned filenames. The inventory above is based on source files present at this edit; the map was not regenerated because this task explicitly excludes running scripts.

# QC-100-10 — Observability Evidence

**Recorded:** 2026-09-08 (Asia/Riyadh)  
**Verdict:** PARTIAL — the repository has safe correlation/metrics/logging primitives, but exporter, dashboard, alert delivery and live dependency evidence are absent.

## Implemented evidence

| Requirement | Evidence |
| --- | --- |
| Request correlation | `createRequestContext` creates/validates `requestId`, W3C `traceId` and `spanId`; middleware enters the async correlation context. |
| Structured logs | Pino JSON logger includes correlation fields, route template, HTTP method/status class, and server duration. It redacts passwords, tokens, cookies, authorization and secrets. |
| Service identity | Runtime config exposes environment, service name and service version. Release identity is separately generated/verified; exporter integration is still optional. |
| Latency | `qc_http_server_duration_ms` measures full middleware duration; `qc_db_query_duration_ms` measures query pipeline duration with only `dependency`, bounded statement kind and outcome. |
| Security/control events | Rate-limit denials are logged/counted. Domain spans and bounded counters cover outbox and file outcomes. QC audit remains separate from application/security logs. |
| Health | `/api/health/live` is dependency-free; `/api/health/ready` checks PostgreSQL and emits minimal 200/503 state. |
| Exporter safety | tracer, meter and log-sink failures are non-fatal, covered by focused tests. |

## Data-safety controls

Metric labels use an allowlist and bounded values; raw URLs, query strings, SQL text, bind parameters, record IDs, filenames, content and request IDs are excluded. Health responses avoid configuration/topology disclosure. This does not prove every future call site is safe; keep the source scans and focused tests in the release evidence.

## Actionable alert conditions (no owner/escalation policy assumed)

- Sustained HTTP 5xx or repeated controlled-unavailable outcomes by normalized route.
- Sustained increase in HTTP or DB p95 against an approved, recorded baseline.
- Database readiness returns 503.
- Rate-limit denials spike above the recorded normal baseline.
- Outbox error/retry outcomes persist or grow.
- Dependency failures for object storage or AI increase.
- Telemetry exporter/log sink failure signals appear, while remembering these signals must not affect business transactions.

Thresholds, channels, routing, retention and escalation owners are deliberately not stated: none were approved or measured in repository evidence. Exporter configuration, collector availability, alert delivery, dashboards and production dependency health remain unverified.

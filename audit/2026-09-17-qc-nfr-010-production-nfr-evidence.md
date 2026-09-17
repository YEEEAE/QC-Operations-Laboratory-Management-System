# QC-CLOSURE-NFR-010 — Production Non-Functional Evidence

**Recorded:** 2026-09-17 (Asia/Riyadh)  
**State:** PARTIAL — repository and local SSR evidence are recorded; PostgreSQL-backed, authenticated, CI, provider, and manual AT gates remain unverified.  
**Exact source:** `313bdfcc031abc18d3e55e75a025d880b9d16450`  
**Build:** `rel-d740622fc9010566` / `qc-nfr-010-local` / artifact SHA-256 `40902a576dbfe321f079234f081f2e35d8cfe08490c13357ee0f26d00d32c0d1`  
**Migration evidence:** head `0023_uat_evidence`, checksum `a1ff60a7dbffbc8906b3f648f88a50bbeb96e63e45de8d4b8169f4235d1b2fd6`  
**Runtime caveat:** local Node `v22.23.1` is outside the project contract `>=24.20.0 <25`.

This is an evidence record, not a production-readiness or capacity certificate. `PASS` below means the named local/static check passed on this source/build; it does not mean production, UAT, or CI passed.

## Evidence index

| Workstream | Current position | Evidence boundary |
| --- | --- | --- |
| Security | PARTIAL | Strong source/unit/browser controls verified locally; PostgreSQL runtime, authenticated negative matrix, provider/runtime behavior, and external dependency audit are not closed. |
| Supply chain | PARTIAL | Frozen lockfile and artifact identity verified; audit network was unavailable, actions are tag-pinned rather than commit-pinned, and no approved SBOM generator is configured. |
| Privacy | PARTIAL | Data-flow inventory below is source/migration-backed; exact retention, deletion/correction policy, and third-party processor configuration are not invented and remain open. |
| Performance | PARTIAL | Repeatable runners and local unauthenticated observations exist; representative authenticated database workload and browser CPU/heap/Web Vitals are not measured. |
| Observability | PARTIAL | Correlation, structured redaction, counters/histograms, health, and failure isolation have focused evidence; exporter, alert delivery, dashboards, and live dependency signals are unverified. |
| Accessibility | PARTIAL | Static/unit and 404/security browser checks pass; login browser checks were unstable in this run and authenticated keyboard/AT/manual workflows were not executed. |

## Security evidence

### Verified on this source/build

- `pnpm install --frozen-lockfile --offline`: **PASS**; lockfile is accepted without modification.
- `pnpm exec vitest run` focused security/observability set: **37/37 PASS** across 7 files.
- `pnpm exec playwright test ... --grep ...`: **6/8 PASS**. Security headers, HSTS policy, no wildcard CORS, cross-origin mutation rejection, safe 404, and axe on 404 passed. Two login accessibility cases timed out with a closed browser session; they are not treated as PASS.
- Production header source and local production-like response: CSP has no `unsafe-inline`/`unsafe-eval`; `frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'`, `X-Content-Type-Options`, `X-Frame-Options`, COOP/CORP, Permissions-Policy, Referrer-Policy, and HSTS are present. The production-like `/login` request redirected to the configured canonical host, so it is header evidence only, not a production latency result.
- Session contract: `__Host-qc_session`, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`; unit evidence exists. No successful login/session-cookie issuance was possible without a disposable database and approved credentials.
- Source-map exposure: `dist` contains **0** `.map` files; tracked source maps: **0**; build config sets `sourcemap: false`.
- High-signal secret scan: no AWS access-key/private-key/GitHub-token/OpenAI-key patterns found in tracked source after excluding dependencies/build output. This is not a replacement for a managed secret scanner.
- File controls: existing integration tests cover traversal-shaped filenames, extension/content mismatch, PDF signature validation, authorization, and digest tampering. The integration suite was not rerun because Docker/PostgreSQL is unavailable.
- SQL injection: repository search found parameterized Kysely `sql` templates and allowlisted filters; no unparameterized value concatenation was identified in the inspected paths. PostgreSQL injection execution remains **UNVERIFIED**.

### Not closed

| Control | State | Required evidence |
| --- | --- | --- |
| Dependency vulnerability audit | BLOCKED | `pnpm audit --json` did not return under the available network path; rerun in CI/connected review environment and preserve raw result. |
| Authenticated authorization negative matrix | BLOCKED | Run `authorization-matrix`, critical closure E2E, and PostgreSQL integration with approved non-production fixture. |
| Rate limiting under shared-store behavior | BLOCKED | PostgreSQL-backed integration requires Docker/PostgreSQL 18; source/unit fail-closed behavior is present. |
| Runtime DB privileges | UNVERIFIED | Run managed-privilege integration test against the deployed database role. |
| Upload/content-type/path traversal | PARTIAL | Source and existing tests are strong; repeat on current runtime and public download boundary. |
| Error/log redaction | PARTIAL | Unit/source contracts pass; collect sanitized runtime logs for dependency, auth, upload, DB, and outbox failures. |
| Provider failure behavior | PARTIAL | AI/object-store/outbox failure contracts exist; live provider outage and retry/backlog evidence are absent. |

## Supply-chain and release identity

- `pnpm-lock.yaml` is lockfile v9 with 822 package entries; a parser check found **0** package entries missing `resolution.integrity` (links excluded).
- Frozen install passed offline, which is evidence of lockfile/install reproducibility on this host, not provenance or vulnerability absence.
- The workflow uses version tags (`actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`). Commit-SHA pinning is **OPEN** because exact immutable SHAs were not retrieved from a trusted connected source in this run; do not claim pinned actions.
- No generated artifact is tracked. The current server artifact is identified and verified by `release:identity`/`release:verify` above.
- No SBOM was generated. `pnpm list --depth=0` and lockfile integrity are inventory evidence only; adding a CycloneDX/SPDX tool needs an approved dependency/pipeline decision.
- GitHub exact-HEAD CI remains unverified because the project mind records a billing lock; local build/unit/type/architecture evidence is not a substitute.

## Privacy data-flow inventory

The table records what is evidenced by migrations, source, and privacy/observability documents. `Not specified` means no retention period is claimed.

| Data category | Collection and purpose | Persistence / access | Logs and exports | Retention / deletion-correction | Third-party transmission |
| --- | --- | --- | --- | --- | --- |
| Identity and authentication | Login identity, account status, role/grant context, password credential input for authentication and recovery | `qc.users`, `qc.sessions`, `qc.password_reset_requests`; server-side identity/session services and authorized administration | Security outcomes and sanitized request telemetry; no password/token/cookie values. No ordinary export. | Retention **not specified**. Users are deactivated rather than hard-deleted; credential/session lifecycle is policy-controlled. | None evidenced. |
| Operational QC records | Receiving, inspection, laboratory, quality, tasks, assets, documents, approvals and controlled state changes | Domain tables in `qc`; access is server-authorized by actor, permission, scope, state, SoD and version rules | Business audit events and bounded operational telemetry; authorized reports/exports where implemented | Exact retention **not specified**. Controlled records are not hard-deleted after controlled lifecycle; draft deletion rules are documented. Correction is controlled/versioned, not silent overwrite. | None evidenced for core workflows. |
| Evidence files and file metadata | Upload bytes, original filename, MIME declaration, size, SHA-256 and evidence link for controlled records | `qc.files`, `qc.evidence_links`, local/object-store adapter; authorized download only | File operation outcome counters; filenames/content are excluded from metrics/logs | Exact retention **not specified**. Deletion/void behavior is lifecycle- and policy-dependent; no retention period is invented. | Optional object-store provider is supported by configuration; no live provider transmission was evidenced. |
| Audit, signatures and release/UAT evidence | Actor, request, time, reason, version, signature and release/UAT evidence for controlled decisions | `qc.audit_events`, `qc.electronic_signatures`, release/UAT evidence tables; restricted audit/governance views | Audit is separate from logs/telemetry and is not sampled; exports are policy-controlled | Exact retention **not specified**. Historical controlled evidence is append-only/immutable by contract; correction is a new controlled event. | None evidenced. |
| Notifications and outbox | Internal workflow handoffs, notifications, analytics hand-off and delivery state | `qc.notifications`, deliveries, `qc.outbox_events`; worker/provider boundaries | Bounded outcome/latency/failure signals; no raw QC content in telemetry contract | Exact retention **not specified**; backlog/dead-letter policy and deletion schedule require owner decision. | Optional notification/analytics provider is not configured/evidenced. |
| Observability and security telemetry | Request/trace IDs, normalized route, status class, duration, bounded metrics, rate-limit/auth outcomes | Process sink/exporter is optional; internal outbox analytics is optional | Pino JSON redaction; metrics exclude query strings, SQL, IDs, filenames, content, credentials | Exact retention **not specified**; Security/Operations/Compliance must approve class and access. | OTLP/provider export is optional and not live-verified. |
| Optional AI advisory | User-provided advisory request and provider result only when capability is enabled; advisory is not authority | AI module/provider adapter and controlled metadata; core readiness does not depend on AI | Provider availability/failure telemetry; raw prompts/responses are not approved for logs | Exact retention **not specified**; no provider export is claimed in current evidence. | Potential provider transmission is configuration-dependent and requires separate processor/security approval. |

## Performance budgets and measurements

The following are **proposed engineering budgets**, not approved SLOs and not pass/fail claims. They are deliberately paired with the missing dataset/runtime evidence.

| Workflow | Proposed p95 response budget | DB query budget | Measurement status |
| --- | ---: | ---: | --- |
| Login | 750 ms | ≤ 12 | Local GET `/login`: p95 total 34.52 ms in development; authenticated POST not measured. |
| Dashboard | 1000 ms | ≤ 20 | Not validly measured; unauthenticated load followed redirect to login. |
| Receiving list/detail | 1000 ms | ≤ 20 | Not measured; PostgreSQL/auth fixture required. |
| Inspection page | 1200 ms | ≤ 25 | Not measured; PostgreSQL/auth fixture required. |
| Laboratory entry | 1200 ms | ≤ 25 | Not measured; PostgreSQL/auth fixture required. |
| Audit timeline | 1000 ms | ≤ 20 | Not measured; PostgreSQL/auth fixture required. |
| Search | 800 ms | ≤ 15 | Not measured against representative data. |
| Report generation | 3000 ms | ≤ 40 | Not measured against representative data/export payloads. |

Observed local measurements on the exact build, with 10 samples and 2 warmups, were:

- `/login`: 200 for all samples; p50/p95 total **19.01/34.52 ms**; 1,928 response bytes.
- `/api/health/live`: 200 for all samples; p50/p95 total **6.79/9.04 ms**; 20 response bytes.
- `/api/health/ready`: 503 for all samples because PostgreSQL was unavailable; p50/p95 total **13.64/14.83 ms**. This is dependency-failure behavior, not readiness performance.
- Unknown route: 404 for all samples; p50/p95 total **6.85/8.76 ms**; no stack/source markers.
- A 15-request, concurrency-3 read probe produced statuses 200 only after redirect-following and therefore is **not accepted as dashboard evidence**.
- Client JS output was 1,008,539 raw bytes / 266,213 gzip bytes across emitted `.js` files; the largest emitted chunk was `three.module` at 734.44 kB raw / 189.57 kB gzip. This is an asset observation, not a user-perceived performance result.
- No representative DB query count, slow-query `EXPLAIN (ANALYZE, BUFFERS)`, memory/heap, CPU/GPU, Web Vitals, or concurrency capacity result is claimed.

Repeatable runners:

```sh
QC_PERF_BASE_URL=http://127.0.0.1:4321 pnpm exec node tests/performance/smoke.mjs
QC_PERF_BASE_URL=http://127.0.0.1:4321 QC_PERF_LOAD_PROFILE=dashboard-reads \
  QC_PERF_CONCURRENCY=5 QC_PERF_REQUESTS=50 pnpm exec node tests/performance/load-profiles.mjs
```

Write profiles remain intentionally blocked unless `QC_PERF_ENABLE_WRITES=true` is used against a disposable authorized environment with unique idempotency inputs.

## Observability and runbook mapping

| Signal | Implemented evidence | Alert/runbook mapping | Current limit |
| --- | --- | --- | --- |
| Request correlation / structured logs | `requestId`, W3C trace/span context, Pino JSON, redaction tests | HTTP incident: correlate request → route → dependency; preserve sanitized log sample | Exporter and log sink delivery unverified. |
| HTTP errors and latency histogram | `qc_http_requests_total`, `qc_http_server_duration_ms` | HTTP 5xx/p95 investigation against an approved baseline | No approved numeric threshold or alert channel. |
| Authentication/rate-limit telemetry | login outcomes, rate-limit denial/store-unavailable counters and logs | Security abuse runbook: verify shared store, investigate spike, keep fail-closed | PostgreSQL-backed runtime evidence blocked. |
| Readiness/liveness | dependency-free liveness and sanitized DB readiness 503 | Availability runbook: liveness process check, readiness DB/TLS/pool check | Live deployment check unavailable. |
| DB failures/slow queries | bounded DB duration/outcome telemetry | Database runbook: pool, readiness, slow-query EXPLAIN, locks | No representative live query evidence. |
| Outbox failure/backlog | bounded outbox outcome/worker signals in source contract | Worker runbook: retry/backlog/dead-letter and dependency isolation | Export/dashboard/threshold not configured. |
| File/object/AI provider failure | safe degraded/unavailable contracts | Dependency runbook: fail closed or show unavailable; do not emit zero/empty claims | Provider outage test not run live. |
| Telemetry exporter failure | exporter failure is non-fatal by design/tests | Observability runbook: repair exporter without rolling back business transaction | Collector/alert delivery unverified. |

Exact owners, channels, thresholds, escalation, and telemetry retention are intentionally not assigned because project policy has not approved them.

## Accessibility evidence

- Automated/source evidence: unit and source contracts cover landmarks, skip navigation, focus, error/status semantics, dialog return focus, reduced motion and forced-colors behavior. Existing authenticated accessibility suite remains gated on an approved disposable identity.
- Fresh browser run on this build: **6/8 PASS** for the selected accessibility/security set. The safe 404 passed axe and semantic checks. Two login tests timed out with a closed Chromium session even though the raw `/login` HTML contained `lang="en"`, `dir="ltr"`, `Sign in`, associated labels, autocomplete values, and a keyboard-capable form. Login browser evidence is therefore `NOT VERIFIED` for this run.
- Manual keyboard verification for dashboard, receiving, inspection, laboratory entry, audit timeline, search and report generation: **NOT EXECUTED**. Required recording fields are tester, browser/OS, exact route/state, build SHA, focus sequence, traps, focus visibility/return, Escape behavior, and result.
- VoiceOver/NVDA/TalkBack, 200%/400% reflow on authenticated workflows, touch-target review, contrast review on controlled states, and human task success/error metrics: **NOT EXECUTED**.
- Target remains WCAG 2.2 AA; no conformance claim is made.

## Release-governance disposition

Only the following verified evidence is eligible to be ingested into release governance: exact source/build identity, frozen install, lock integrity, source-map result, focused tests, local HTTP header/CSRF/safe-error results, and clearly scoped local latency observations. The following must remain `UNVERIFIED/BLOCKED`: dependency vulnerability result, PostgreSQL-backed security and performance, authenticated E2E, CI exact-head result, provider/exporter health, manual AT/keyboard workflow evidence, retention/deletion decisions, and any production capacity claim.

## Required next evidence

1. Run with Node `>=24.20.0 <25` and Docker/PostgreSQL 18 on the exact source/build.
2. Execute integration, migration, concurrency, authenticated E2E, authorization-negative, upload, rate-limit and DB privilege suites; preserve machine-readable outputs.
3. Run dependency audit and a managed secret scanner in connected CI; pin GitHub Actions to reviewed commit SHAs and preserve provenance/SBOM artifacts if approved.
4. Load a synthetic representative dataset; run all read/write profiles, DB query counts/slow-query plans, browser Web Vitals/heap/CPU and concurrency tests. Compare to the proposed budgets only after owner approval.
5. Execute manual keyboard and assistive-technology sessions on the critical workflows and attach exact build evidence.
6. Obtain approved retention/deletion/correction and alert ownership decisions; update this inventory without inventing periods.

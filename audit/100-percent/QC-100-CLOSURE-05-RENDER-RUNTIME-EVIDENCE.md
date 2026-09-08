# QC-100-CLOSURE-05 — Render Production Runtime and Provider Evidence (READ-ONLY)

## MASTER HEADER

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Target: `main`
- Base HEAD (before this task): `4384c76b47e79f523103e81f0686edc952b9006a`
- Working tree at probe time: clean (baseline), dirty after local fix (see Files)
- Probe timestamp: `2026-09-08 ~09:17 +03` (Asia/Riyadh)
- Mode: PRODUCTION READ-ONLY. No push, merge, deploy, production write, credential rotation, or secret printing.
- Node (local host): `v22.22.3` — outside contract `>=24.20.0 <25`; local results are not CI parity (R-009 stays OPEN).
- pnpm: `11.25.0` — matches contract.

## 1. Production read-only probes (public HTTPS, no secrets)

Sampled surfaces on `https://qclevel.top` (Cloudflare → Render origin):

| Probe | Result | Headers observed | Body |
|---|---|---|---|
| `GET /api/health/live` | `500` | `server: cloudflare`, `x-render-origin-server: Render`, `x-astro-noop: true`; NO `content-security-policy`, NO `strict-transport-security`, NO `x-content-type-options`, NO `x-request-id` | Generic `500.astro` HTML (`Service unavailable`, no stack, no secret) |
| `GET /api/health/ready` | `500` | same as above, NO security headers | same generic 500 HTML (expected contract is `200/503` JSON `{status}`) |
| `GET /` | `500` | same, NO security headers | same generic 500 HTML |
| `GET /login` | `500` | same, NO security headers; `cf-cache-status: DYNAMIC` | same generic 500 HTML |
| `GET /api/health/live` with `x-request-id: probe-123` | `500`, requestId NOT echoed | NO `x-request-id` response header | 500 HTML |
| `http://qclevel.top/api/health/live` | `301` → `https://qclevel.top/api/health/live` | `server: cloudflare` | redirect only |

Interpretation (evidence-backed, not assumption):

- Canonical host `qclevel.top` + HTTPS + HTTP→HTTPS redirect: OBSERVED working.
- Error redaction on 500: OBSERVED working (generic page, no stack/SQL/secret/host).
- Liveness (`200 JSON {status:healthy}`, dependency-free): FAIL on deployed service (got 500 HTML).
- Readiness (`200/503 JSON`, PG probe): FAIL on deployed service (got 500 HTML, not the JSON contract).
- Security headers on production responses: FAIL on sampled error responses (absent because the error bypassed middleware header application).
- `requestId` echo/correlation on prod responses: FAIL (absent).
- `service.version` / release identity visibility in prod responses: NOT OBSERVED (no such header/body on these surfaces).
- Rate-limit denial evidence in prod: NOT OBSERVED (all sampled GETs 500 before rate-limit branch).
- Auth denial evidence in prod: NOT OBSERVED (protected `/` did not redirect to `/login`; it 500'd).
- Structured request logs / `service.version` / DB-readiness-failure logs in prod: BLOCKED — no Render log/metrics API access from this host; no credential was requested or printed.

## 2. Root cause (code, verified locally)

`src/middleware.ts` called `getServerEnv()` unconditionally before the machine-health bypass.

`parseServerEnv({NODE_ENV:'production'})` with empty env throws `InvalidEnvironmentError`:

```text
Invalid server environment configuration (DATABASE_URL, SESSION_SECRET, SERVICE_VERSION, RATE_LIMIT_LOGIN_MAX + RATE_LIMIT_LOGIN_WINDOW_SECONDS)
```

Reproduced locally via `tsx`:

```text
THROWS:InvalidEnvironmentError:Invalid server environment configuration (...)
```

Consequence: any production request — including dependency-free `/api/health/live` — throws before reaching the route, Astro renders generic `500.astro` without middleware security headers, `x-request-id`, metrics, or JSON contract. `/api/health/ready` can never return its designed `503 JSON` in this state.

This is consistent with (but does not prove) a missing/misconfigured production secret set on Render (`DATABASE_URL`, `SESSION_SECRET`, `SERVICE_VERSION`, `RATE_LIMIT_LOGIN_*` are all `sync:false` in `render.yaml` and must be set in the Dashboard). Dashboard values were NOT read (no API access); only existence/state is recorded here, never values.

## 3. Local config fix (no weakening)

Files:

- `src/shared/http/health-gates.ts` (new, pure, no `astro:middleware` import)
- `src/middleware.ts` (reordered, fail-closed preserved)
- `tests/unit/http/middleware-health.test.ts` (new, TDD RED→GREEN)

Behavior:

- `/api/health/live` bypasses production env validation; returns `200 JSON {status:healthy}` with `x-request-id` + full security headers + `qc_http_requests_total` / `qc_http_server_duration_ms` / `http.request` log. No DB, no session, no auth, no business state.
- `/api/health/ready` with invalid env returns `503 JSON {status:unhealthy}` with headers + `x-request-id`; with valid env it delegates to `PostgresReadinessProbe` (missing DB → `false` → `503 JSON`, never 500 HTML), then adds `x-request-id` + headers + observability. A 503 is never upgraded.
- Non-health routes with invalid env return `503 problem+json {title:SERVICE_UNAVAILABLE, requestId}` with security headers + `config.invalid_environment` warn log — still fail-closed, still redacted (key names only, never values).
- Canonical-host redirect, `__Host-qc_session` Secure/Strict, CSP baseline (`default-src 'self'`, no `unsafe-inline/eval` in production), HSTS (production only), rate-limit fail-closed (`FAIL_CLOSED` → 429), authorization DENY, DB TLS enforcement, audit/outbox wiring: UNCHANGED.

TDD:

- Wrote `middleware-health.test.ts` first: 3 tests importing non-existent helpers → RED (`has no exported member`).
- Extracted pure `health-gates.ts` (avoids `astro:middleware` in unit tests) → GREEN `3/3`.
- Existing `health-live` / `health-ready` / `security-headers` contracts still GREEN.

## 4. Render/provider contract (static, current tree)

`render.yaml` (current):

- `startCommand: node dist/server/entry.mjs` — explicit Node entrypoint.
- `buildCommand: corepack pnpm install --frozen-lockfile && corepack pnpm run build` — lockfile install + build; contains NO `db:migrate`, `db:seed`, or `bootstrap:admin`.
- `healthCheckPath: /api/health/ready` — canonical readiness endpoint.
- `domains: [qclevel.top]`, `renderSubdomainPolicy: enabled` (Render hostname stays reachable for canonical redirect until DNS/TLS verification completes).
- `NODE_VERSION: 24.20.0`, `HOST: 0.0.0.0`, `NODE_ENV: production`, `SERVICE_VERSION: 0.1.0` (versioned, non-secret).
- Secrets (`sync:false`, Dashboard-only, never in Git): `DATABASE_URL`, `SESSION_SECRET`, `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_SECONDS`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`. Existence/state confirmed in YAML; values NEVER read or printed.
- No `BOOTSTRAP_ADMIN_*` keys in the Web Service contract (`render-config.test.ts` asserts this). One-time bootstrap stays a manual explicit script (`pnpm bootstrap:admin`), not startup.
- No `INTERNAL_DATABASE_URL` key; single `DATABASE_URL` contract. Private/internal vs external topology remains DEPLOYMENT-DEPENDENT per `DEPLOYMENT-ARCHITECTURE.md` DEP-013/DEP-DD-015; the pool enforces TLS when no `sslmode` is supplied and preserves provider `sslmode` otherwise. No TLS weakening was made in this task.

Startup-mutation check (DEP-004):

- `grep render.yaml` for `db:(migrate|seed)|bootstrap` → CLEAN (no match).
- `package.json` exposes `db:migrate`, `db:seed:foundation`, `bootstrap:admin` as EXPLICIT manual scripts only; nothing in `build`/`start` invokes them.
- Application startup (`node dist/server/entry.mjs`) therefore does NOT silently migrate, seed foundation, or bootstrap admin. Any schema/data change remains an explicit controlled release step.

## 5. Release identity (current HEAD)

- `node scripts/release/release-id.mjs --environment local` on base `4384c76` + working tree (dirty with this task's 3 files): `releaseId rel-1d57db1d4f50807d`, `applicationVersion 0.1.0`, `serviceVersion 0.1.0`, `migrationHead 0018_rate_limit_windows` (+ checksum recorded in full JSON), `workingTree dirty → dirty:true`. Production evidence refuses dirty trees by design; this local identity is NOT a production release.
- Deployed Render Git SHA / application version / build ID / Node runtime / environment: BLOCKED — no Render API/dashboard access from this host; the old SHAs written in prior audit reports were NOT reused.

## 6. Observability (code-backed, local)

- Request correlation (`requestId`/`traceId`/`spanId`), bounded route templates, allowlisted metric labels, `qc_http_server_duration_ms` + `qc_db_query_duration_ms`, Pino JSON logs with `service_name`/`service_version`/`environment` + redaction, rate-limit denial counters/logs, exporter-failure non-fatal behavior: covered by `correlation.test.ts` (16 tests), `security-headers.test.ts`, `system-health.test.ts` (9 tests) — all GREEN locally (see §7).
- External OTLP exporter (`OTEL_EXPORTER_OTLP_*`): optional by contract (`env.ts` requires endpoint+headers together or neither); Dashboard state is `sync:false` (operator-managed). No exporter endpoint was invented or probed. Per approved architecture this is OPTIONAL for core readiness (AI/degraded paths); alert/dashboard/delivery evidence remains UNVERIFIED.
- Production log/metrics/traces for request/auth-denial/rate-limit/error/DB-readiness/version: BLOCKED (no provider log access). Do NOT infer from healthy HTTP alone — and HTTP is currently 500 anyway.

## 7. Verification (fresh, exact working tree)

- `tests/unit/http/middleware-health.test.ts` + `health-live` + `health-ready`: `6/6` ✅
- Focused provider slices (health-gates + `render-config` + `release-id` + `security-headers` + `correlation` + `system-health`): `6 files / 46 tests` ✅
- `pnpm test:unit`: `29 files / 111 tests` ✅ (108 prior + 3 new)
- `pnpm test:architecture`: `passed` ✅
- `pnpm format:check`: ✅
- `pnpm lint`: ✅ (exit 0; only Node engine warning `v22.22.3` vs `>=24.20.0 <25`)
- `pnpm typecheck`: ✅ `0 errors`, `25 pre-existing hints`
- `pnpm build`: ✅ (server built, no new warnings)
- `git diff --check`: ✅
- Production probes: `curl` read-only GETs above (all `500`, evidence of outage, not of fix — the fix is local-only until a controlled redeploy + post-deploy verification).

## 8. PASS/FAIL (this task, evidence-backed)

- Liveness code contract (local): PASS — dependency-free `200 JSON` + headers + requestId, tested.
- Readiness code contract (local): PASS — `200/503 JSON` preserved, env-failure degrades to `503 JSON` (not 500 HTML), tested.
- Startup-mutation prohibition (static): PASS — no auto migrate/seed/bootstrap in `render.yaml` build/start.
- Bootstrap-secret hygiene (static): PASS — no `BOOTSTRAP_ADMIN_*` in Web Service contract.
- Deployed production health (remote): FAIL — `/live` and `/ready` both `500 HTML` on `qclevel.top` at probe time.
- Deployed SHA/version/build/Node/env/logs (remote): BLOCKED — no authorized Render API access; not claimed.
- DB private/internal topology proof (remote): BLOCKED — needs operator dashboard/network evidence; code keeps single-`DATABASE_URL` + TLS-preserving contract, no weakening.
- External telemetry exporter delivery (remote): NOT CONFIGURED-or-UNKNOWN — classified OPTIONAL for core per architecture; no invention.

## 9. Remaining blockers (no false closure)

- PROD-05-A (CRITICAL, new): deployed `qclevel.top` returns `500` on `/`, `/login`, `/api/health/live`, `/api/health/ready`. Local fix exists but is UNDEPLOYED. Needs: operator verifies Dashboard secrets (`DATABASE_URL`, `SESSION_SECRET`, `SERVICE_VERSION`, `RATE_LIMIT_LOGIN_*`), controlled redeploy of an exact-SHA release, then post-deploy verification (§30 checklist: correct version, liveness 200 JSON, readiness 200/503 JSON, PG healthy, migration head expected, auth smoke, headers, requestId, 5xx baseline, no critical alert).
- R-004 (OPEN): exact-HEAD remote CI run still required (billing lock history); local Node is `v22.22.3`, not contract.
- R-009 (OPEN): runtime parity — all gates must rerun on Node `24.20.0` (CI or approved host).
- R-001 restore half / R-006 (OPEN): restore drill still required; this task touched no production data.
- R-002 authenticated half (OPEN): unchanged.
- R-008 (OPEN): AI provider remains disabled-by-default; no provider evidence claimed.
- Secrets after bootstrap: `BOOTSTRAP_ADMIN_*` must remain absent from the Web Service (currently absent ✅); after any future bootstrap the one-time values must be removed/rotated by the operator — to be confirmed at bootstrap time, not here.

## 10. Updated risk IDs

- No risk CLOSED in this task. Production is observably DOWN, so nothing can close on HTTP evidence.
- NARROWED (code only): the middleware env-validation defect class — liveness can no longer be killed by missing secrets in the new working tree (unit-proven), but deployed behavior is still FAIL until redeploy.
- NEW explicit blocker: PROD-05-A (deployed 500 on all sampled surfaces) — recorded here for the operator; maps to G-009/CB-009 lineage.

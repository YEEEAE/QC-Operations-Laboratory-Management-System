# QC-100-FINAL-030 — Scoped Application Threat Model

Status: implementation and source review for phase 030-A. This is a focused
threat model mapped to the existing application boundary; it does not claim an
independent security assessment or close policy-dependent requirements.

## Boundaries and assumptions

Browser input is untrusted, including identity, roles, scope, state, version,
filenames, MIME declarations, timestamps, approval results, and query values.
The server derives the actor from an opaque session and passes actions through
server authorization, scope/state/version and SoD checks before persistence.
PostgreSQL, private object storage, external integrations, CI/package registry,
and AI providers are separate trust boundaries. AI remains advisory-only.

## Risk, control, and executable check

| Boundary / threat | Required control | Executable check / evidence |
| --- | --- | --- |
| Identity: stolen, forged, replayed, or expired browser session | Opaque server-side session; `__Host-` Secure/HttpOnly/Path=/ cookie; SameSite=Strict; server actor resolution; session revocation | `pnpm exec vitest run tests/unit/identity/session-service.test.ts tests/unit/shared/security-headers.test.ts`; current implementation `src/shared/security/session-cookie.ts`, `src/middleware.ts` |
| Actions/APIs: CSRF, IDOR, scope escape, stale/replayed mutation, mass assignment | Astro `security.checkOrigin: true`; Zod action schemas; actor from middleware; authorization at use case; expected-version and idempotency contracts where applicable; GET routes remain read-only | `pnpm exec vitest run tests/unit/actions tests/integration/security tests/integration/concurrency`; config contract in `astro.config.mjs`; authorization remains server-enforced |
| Upload: traversal, spoofed MIME, executable, oversized or malformed payload; storage/DB partial failure | Authorize before bytes are persisted; reject unsafe names, executable signatures/extensions, malformed MIME and oversized payloads; SHA-256; private object storage; persist file metadata + evidence link in one DB transaction; compensate object write on transaction failure | `pnpm exec vitest run tests/integration/shared/files.test.ts tests/integration/shared/object-store.test.ts`; `FileService` and `PostgresFileRepository` |
| Evidence download: link substitution, unauthorized access, tampered object | Resolve canonical evidence link by opaque ID; authorize against linked subject before object read; verify stored digest; do not expose public object URLs | Same focused files test, especially “canonical evidence link” and “tampered object” cases; DB-backed verification belongs to 002/027 |
| Export: formula injection, excessive data or inline browser rendering | Report registry and server-side export permission; canonical registered dataset; CSV cell sanitization and XLSX XML escaping; fixed filename from report code/format; attachment, `nosniff`, `no-store` | `pnpm exec vitest run tests/unit/reporting/export-safety.test.ts tests/integration/reporting/export-report.test.ts tests/integration/reporting/report-export-parity.test.ts`; `src/pages/reports/[reportCode]/export.ts` |
| Evidence ingestion / AI: malicious content, prompt injection, accidental PII or secrets sent outside | Evidence is authorized and integrity-checked; detected PII/secret-like AI input is blocked before provider access; outputs remain advisory and sanitized; provider failures return fixed safe errors | `pnpm exec vitest run tests/integration/ai-advisory/security.test.ts tests/integration/ai-advisory/evals.test.ts tests/unit/ai-advisory`; live-provider processing approval and scan policy remain external/policy-dependent |
| Infrastructure / delivery: dependency compromise, leaked credentials, host/proxy misconfiguration, raw errors | Frozen lockfile install; exact-SHA CI; dependency audit gate; server-only secrets; production CSP/HSTS/security headers; redacted logs and fixed problem responses | CI runs `pnpm install --frozen-lockfile` then `pnpm audit --audit-level high`; `pnpm test:security`; secret/credential rotation and live proxy configuration remain operational evidence |

## Open decisions and external dependencies

- `REQ-FILE-008` remains POLICY-DEPENDENT: approved MIME/size/scanning policy and
  approved malware scanner/data path are not supplied. The existing 25 MiB
  ceiling is a defensive implementation limit, not the approved evidence-type
  policy. No scanner or content allowlist is invented here.
- File retention/expiry and periodic object-store orphan reconciliation require
  an approved retention class and operational owner. Phase 030-A now prevents
  or compensates the upload-time partial-write orphan case; it does not delete
  historical evidence or introduce a retention period.
- `REQ-AI-010` prompt/output retention remains POLICY-DEPENDENT; live provider
  use remains blocked on external data-processing approval.
- CI dependency-audit results require registry connectivity and must be bound to
  an exact candidate by 030-B/012. This local phase does not claim that remote
  CI has run or that the current lockfile has zero advisories.
- Server-side authorization, scope/state/version/SoD, idempotency,
  append-only evidence, and `PASS != RELEASED` remain invariants. No audit domain
  was added and the denominator remains 80.

## Security review extension — 2026-09-24

This section records a source review of identity/session, file evidence,
AI-provider, reporting/export, approval/signature, HTTP security, and CI supply
chain boundaries. It is not a penetration test or a production security claim.

### Threat scenarios and current treatment

| Asset / boundary | Abuse case and impact | Current control / executable evidence | Residual / owner |
| --- | --- | --- | --- |
| Identity and sessions | Stolen, forged, replayed, or expired browser session; login abuse; account enumeration | Opaque server-side sessions, hashed server token, `__Host-` Secure/HttpOnly/SameSite=Strict cookie, revocation and DB-backed high-risk rate limit; middleware resolves actor per request | PostgreSQL-backed focused authorization integration passed, but authenticated session-expiry HTTP rejection remains NOT VERIFIED because login controls blocked the focused E2E requests. Security owner: `yazeed` |
| Authorization and scope | Change a record ID, scope, role, state, or version in a direct request; cross-scope read/write or self-approval | Server-derived actor, default deny, route/use-case authorization, scope/state/SoD/version validation and transactional approval/signature; see approval/document authorization matrices and `tests/e2e/authorization-matrix.spec.ts` | Exact-candidate HTTP + populated PostgreSQL negative run NOT VERIFIED; 002/027 own DB evidence and 003 owns authenticated E2E |
| Files and evidence | MIME/name spoofing, traversal, oversized/malicious bytes, link substitution, object tampering, partial DB/object write | Size and signature checks, required explicit scanner policy, private storage, digest verification, canonical evidence-link resolution, subject authorization before object read, transaction/compensation; `tests/integration/shared/files.test.ts` | Approved scanner/MIME/retention policy remains POLICY-DEPENDENT; exact-candidate PostgreSQL and authenticated expired-session download rejection NOT VERIFIED; 013/026 own policy and 002/027 own DB evidence |
| AI processing | Prompt injection, secret/PII disclosure, unsafe authority output, provider failure, redirect to a hostile endpoint | External processing defaults false; only explicitly entered question/context is sent; visible notice before submission identifies configured provider and data sent; deterministic refusal/evaluation suites; HTTP redirect following is disabled | Configured HTTPS host is not allowlisted; environment/configuration compromise could direct server egress. Provider retention/deletion and permitted data classes remain open under PD-31; 013/026 own approval |
| Reports and exports | Cross-scope rows, filter manipulation, formula injection, excessive export, raw HTML/XSS, error detail leakage | Registered report code, server permission and actor-scope query, strict filter parser, CSV/XLSX formula neutralization, attachment/nosniff/no-store, fixed errors and redacted logs | Populated-DB report-scope parity across every report remains PARTIAL; 002/027 own exact-candidate negative evidence |
| Approvals and e-signatures | Replay, stale version, signature substitution/tampering, forged approval, SoD bypass, cross-scope mutation | Reauthentication, binding to actor/action/subject/version/snapshot, DB transaction and concurrency/idempotency protection; `tests/integration/e-signatures/signature.test.ts`, `tests/integration/concurrency/idempotency.test.ts`, approval authorization/rollback tests | Current local DB-backed signature tamper and server request rejection NOT VERIFIED in this run; 002/027 |
| HTTP / browser boundary | CSRF, reflected/stored XSS, injection, clickjacking, MIME confusion, referrer leakage, raw stack/driver output | Astro origin checks, Zod action schemas, parameterized Kysely/SQL, context-safe text rendering, restrictive production CSP, HSTS/security headers, safe problem responses; security-header unit/E2E tests and `pnpm test:security` | Custom mutation routes and authenticated browser attack coverage must run on the exact candidate; no blanket penetration-test claim |
| SSRF / provider egress | Redirect or malicious provider response forwards prompt/API key to another origin | AI client sets `redirect: 'error'`; configured provider URLs require HTTPS | Provider hostname allowlist/private-address denial remains OPEN; `yazeed` to decide whether custom enterprise endpoints are required before provider activation |
| Supply chain | Compromised dependency, hidden transitive component, license conflict, artifact substitution | Exact-SHA CI job runs high/critical audit, creates lockfile-bound CycloneDX inventory and package-license inventory, records artifact digest, and requests GitHub build-provenance plus SBOM attestations for the same build output | Registry audit and GitHub attestation need a successful CI run; current local run has no advisory result. CI/platform owner: `yazeed` |

### Data leaving the system

| Feature | Data sent | Destination and user notice | Current state |
| --- | --- | --- | --- |
| AI advisory | Only the submitted question and explicitly entered source label/excerpt; no session, role, password, DB URL, unrelated record, or audit history | The AI page displays the configured provider and outbound fields above the submit button. It warns against personal, credential, or unauthorized content and states there is no provider-side deletion control. | External processing disabled by default; provider retention terms and approval remain unresolved |
| File evidence | File bytes and minimal object metadata | Configured private object-storage provider; disclose provider and data class before enabling an external object-store integration | Provider/data-path policy remains open; a configured credential is not approval |
| Email/notifications | Notification payload and recipient | Configured email provider; disclose payload and recipient before enabling external delivery | Delivery provider/receiver is NOT CONFIGURED |
| Backups | Database backup bytes and recovery metadata | Approved backup/object-storage provider; disclose provider and retention terms before activation | Provider schedule, retention, and restore posture remain unverified |
| Reports | User-requested rows in a downloaded file | Browser download; report endpoint does not itself transfer data to a third party | Server scope and export controls apply |

No feature may submit data to a newly configured third party until its
user-facing notice names the recipient, lists the fields/data classes sent,
explains retention/deletion limits, and appears before the send action.

### Candidate security and supply-chain gate

`.github/workflows/ci.yml` keeps dependency audit, SBOM, license inventory,
security/integration tests, build digest, and provenance in the same exact-SHA
`Verify` job. `.ci-results/sbom.cdx.json` is generated from the frozen lockfile
with integrity hashes and package license metadata; `.ci-results/licenses.json`
binds the license inventory to the lockfile SHA. Unknown license metadata fails
the candidate. A provenance attestation covers `dist/server/entry.mjs`; a
second attestation binds the same artifact to the SBOM. Artifact upload retains
both inventories.

Critical and High dependency findings fail the candidate through
`pnpm audit --audit-level high`. The named system owner `yazeed` owns initial
triage and assignment: Critical findings are dispositioned within 24 hours
(2026-09-25 for this review); High findings within 7 calendar days
(2026-10-01). Close only with a fixed upgrade, verified non-applicability, or a
time-bounded exception naming approver, mitigation, and next review date. No
advisory was independently verified in this local run; registry connectivity
and green candidate CI are required before claiming the dependency set is
clear.

The current local package inventory reports four installed dependencies without
declared license metadata: `buildcheck@0.0.7`, `cpu-features@0.0.10`,
`ssh2@1.17.0`, and `zod-to-ts@1.2.0`. This is an UNKNOWN classification, not a
claim that any license is incompatible. Owner `yazeed` must verify upstream
license texts and record disposition by 2026-10-01; the CI inventory fails
closed until metadata is known or an approved, reviewable disposition exists.

### Secret-path review and verification limits

Secret-bearing paths and ignore/tracking metadata were checked without printing
file contents, path names, or environment values. One ignored local environment
file contains 10 high-entropy assignments matching a secret-name heuristic;
this is a candidate count, not confirmation that each value is a live secret.
No private-key block or common vendor-token pattern was detected. No rotation
or production secret access was performed.

Fresh local PostgreSQL 18 integration evidence on Node 24.20.0: four focused
files passed, 17/17 tests, including controlled-record tamper constraints,
approval/document scope matrices, and the poisoned-import SQL payload test.
The poisoned string was retained as data and `qc.equipment` remained queryable.
AI provider HTTP contract tests passed 25/25; the redirect refusal setting is
asserted. On a built server backed by disposable PostgreSQL, security E2E was
8 passed / 4 failed: security headers, production-only HSTS behavior, no
wildcard CORS, cross-origin POST rejection, safe unknown-route errors, and
unauthenticated file/report denials passed. The four failures occurred before
authenticated file/report requests: Playwright could not interact with the
login controls in this runner. Cross-scope download and tampered-object HTTP
rejection are therefore NOT VERIFIED, despite corresponding DB/domain tests.
Two broad route-enumeration checks also exceeded Playwright's 30-second timeout
in the earlier run. The product has no bearer-style expiring file link; file
downloads are authenticated actions, so link-expiry is NOT APPLICABLE. Expired
server-session rejection remains a separate integration evidence gap.

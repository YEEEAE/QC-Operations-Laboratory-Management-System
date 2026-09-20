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

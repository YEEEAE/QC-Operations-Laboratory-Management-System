# QC-100-06 — Evidence, Auditability, Files, Reporting and Notifications

**Assessment date:** 2026-09-08 05:21 Asia/Riyadh  
**Repository evidence:** `main` / `fca0c9bad7feb49fa98c09ae92f87ee25a455219`  
**Verdict:** PARTIAL — this record is evidence, not a readiness claim.

## Verified from source and focused tests

| Area | Evidence | Status |
| --- | --- | --- |
| Audit persistence | `PostgresAuditRepository` writes actor, subject, action, states, reason, request ID and optional signature in `qc.audit_events`. | Code-backed; database runtime unverified. |
| Audit access | `AuditQueryService` requires `PERM-ADM-AUDIT-VIEW`; normal UI paths do not own audit mutations. | Code-backed. |
| Evidence authorization/integrity | `FileService` authorizes parent access before upload/download, derives opaque storage keys, stores SHA-256, and re-hashes on download. | Focused test-backed. |
| File hardening | Service rejects path-shaped/control-character filenames, executable filename extensions, PE (`MZ`) binaries, invalid MIME syntax, and declared PDF/PNG/JPEG/GIF signature mismatches before storage. | Focused test-backed. |
| Private storage | `S3ObjectStore` requests private ACL; local object storage rejects production and traversal keys. | Test-backed. |
| Report canonicality | `ExportReportUseCase` runs one authorized report dataset and hands its same rows to CSV/XLSX. | Focused test-backed. |
| Export safety | CSV and XLSX use the same formula neutralization; current tests cover `=`, `+`, `-`, and `@`. | Focused test-backed. |
| Notification visibility | `NotificationService.listOwn` scopes to the authenticated recipient; mark-read is recipient-scoped and idempotent. | Focused test-backed. |
| Delivery isolation | Durable outbox and notification delivery structures exist; state-machine rules say delivery failure must not replay business mutation. | Source-backed; worker/database runtime unverified. |

## Confirmed gaps and policy-dependent blockers

- `AuditEventInput` and `qc.audit_events` have no dedicated permission-context, authorization-scope, or record-version fields. Some transitions include version in their entity update and can put extra data in `payload`, but that is not a universal audit contract. Therefore universal controlled-mutation trace completeness is **UNVERIFIED**.
- Audit append-only protection is modeled in the intended write path, but this environment has no PostgreSQL evidence for managed privileges/triggers against normal `UPDATE`/`DELETE`.
- `DATA-DICTIONARY.md` explicitly marks exact maximum upload size, allowed MIME list, malware scanner, and retention details as unconfirmed. No numeric maximum or allowlist was invented for this audit.
- The object-store contract has no delete/orphan-cleanup capability, and no approved cleanup/retention workflow was found. Object orphan handling is **UNVERIFIED**.
- No PDF or print report generator was found under `src/modules/reporting`; CSV/XLSX are the implemented export formats. PDF/print canonicality, large-export limits, Unicode/RTL/date-time output, and controlled PASS-vs-RELEASED presentation are **UNVERIFIED**.
- Notifications can be created/listed/read, but producer-level permission-safe content, delivery retries and idempotency need a PostgreSQL/outbox execution run. The code rule that delivery must not mutate business truth is not runtime-proven here.
- PostgreSQL/Testcontainers verification cannot run because no container runtime is available. `pnpm db:migrate:status` did not start due `tsx` IPC `EPERM`. Current GitHub CI status cannot be read because `api.github.com` is unreachable.

## Domain position

| Target domain | Position | Evidence / limitation |
| --- | --- | --- |
| 5 — Authorization | Improved | File/report/notification access uses server-side actor authorization; all-surface runtime proof remains incomplete. |
| 36 — Files | Improved | Filename, executable, MIME syntax, signature and hash protections are test-backed; policy-dependent limits/scanning/retention remain unconfirmed. |
| 46/47 — Auditability | Partial | Transactional audit code is present; complete permission/scope/version contract and append-only DB proof are absent. |
| 59/60 — Reports | Partial | Scoped canonical CSV/XLSX and formula safety are test-backed; PDF/print/large/RTL/date-time coverage absent. |
| 73/74/77 — Notifications | Partial | Recipient isolation/idempotent read behavior is test-backed; producer content and delivery runtime behavior remain unverified. |

## Commands and exact results

- `pnpm exec vitest run tests/integration/shared/files.test.ts tests/integration/observability/correlation.test.ts tests/integration/reporting/export-report.test.ts tests/unit/reporting/export-safety.test.ts` — **PASS**, 4 files / 27 tests.
- `pnpm test:architecture` — **PASS**.
- `pnpm test:security` — **FAIL/UNVERIFIED**, 26 passed, 1 skipped, 1 suite failed before database assertions: no working Testcontainers runtime.
- `pnpm lint` — **PASS**.
- `pnpm typecheck` — **PASS**, with existing Zod deprecation hints; local Node is outside the declared engine range.
- `git diff --check` — **PASS**.

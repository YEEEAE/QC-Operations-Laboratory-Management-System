# Attachment, signature, controlled-document, and audit trace audit

**Date:** 2026-09-23  
**Status:** PARTIAL — bounded implementation and focused in-memory tests verified; PostgreSQL rollback and live route authorization NOT VERIFIED.

## Evidence run

After the implementation below, focused in-memory suites — **6 files, 31 tests PASS**. These suites use in-memory repositories/stores; they do not establish PostgreSQL transaction rollback or production storage behavior.

`tests/integration/approvals/transaction-rollback.test.ts` now injects failure at each signature/decision/work/case/audit/outbox write and at the audit/outbox writes for WI/SOP supersession, asserting no partial state/evidence remains. The suite is **NOT RUN**: Testcontainers could not find a working Docker runtime. The `docker` client exists, but its daemon socket is absent. `pnpm typecheck` remains blocked by two existing missing declarations for `scripts/release/*.mjs`; targeted ESLint and Prettier passed.

## Implemented in this pass

- Upload rejects known PDF/PNG/JPEG/GIF signature mismatches even when the mismatching bytes are declared as another allowed MIME; `text/plain` must be valid UTF-8 without binary control bytes. This narrows spoofing but is **not a general-purpose content detector**; all other formats still require an approved parser/scanner policy.
- Download now rejects stored bytes when byte count, stored content type, or SHA-256 differs from the canonical file metadata.
- Added a full domain transition test through draft, review, approval, effective, and superseded that checks prior content hash and attachment links stay on the historical version.

## Attachment lifecycle

| Stage | Current implementation / evidence | Result |
|---|---|---|
| Entry point and actor authorization | `FileService.upload` authorizes before policy checks/storage. No upload/download page or action calls `FileService`; `src/pages/documents/[documentId]/versions/[versionId]/index.astro` renders file IDs only. | **INCOMPLETE** — no application delivery path was found. The unit callback test does not prove parent-record authorization wiring. |
| Name and size | Rejects path separators, control chars, executable extensions, unsafe extension, and bytes above the injected policy limit. | **PARTIAL** — behavior exists, but production policy/limit is unresolved; name normalization and display encoding are not end-to-end tested. |
| MIME and malware | Allowlist and scanner are mandatory; PDF/PNG/JPEG/GIF have selected magic-byte checks; MZ executable header is refused. Scanner error prevents storage. | **PARTIAL** — this is not general MIME detection. Other allowed MIME types, including `text/plain`, are trusted from the client/policy; polyglot/format parser behavior is not established. No approved scanner/provider is configured. |
| Quarantine | No quarantine state/store/scan-pending transition exists in `FileRecord` (`ACTIVE`, `VOID`, `SUPERSEDED` only). Upload scans synchronously before writing. | **NOT IMPLEMENTED** — no quarantine lifecycle to test. |
| Storage and hash | S3 adapter writes private ACL; local adapter forbids production. Upload hashes actual bytes and download compares bytes with metadata SHA-256. DB metadata+link are atomic; object-first failure triggers compensating delete, and failed cleanup is surfaced as `AggregateError`. | **PARTIAL** — focused tests cover fake storage/repository. No live object-store integrity, orphan-reconciliation job, or PG transaction test was run. |
| Link and download authorization | Download accepts opaque evidence ID, resolves canonical persisted link, refuses removed links, authorizes `DOWNLOAD` against its stored subject before object read, requires ACTIVE metadata, and verifies hash. Out-of-scope test asserts zero object reads. | **VERIFIED AT SERVICE BOUNDARY ONLY** — there is no HTTP/file route or signed URL surface in the inspected code to prove every actor-facing URL is scoped. No temporary URL exists; no expiry/revocation behavior can be claimed. |
| Delete and retention | Link schema supports `removed_at` + required reason; service only rejects removed link. Files have no expiry/retention field or cleanup implementation. No deletion use case was found. Policy decision request says not to silently remove evidence. | **POLICY-BLOCKED / INCOMPLETE** — exact retention, authorized deletion, legal holds, object deletion, and orphan reconciliation are unresolved. |
| Controlled-document attachment binding | Version links are immutable rows with `ON DELETE RESTRICT`; document version stores a caller-supplied `content_hash`. | **GAP** — no code shown here recomputes/compares `content_hash` to linked file SHA-256 or snapshots a manifest of file IDs/hashes. Historical version reads preserve links, but file bytes can be inaccessible through current UI. |

## Electronic signature and transaction

`SignControlledActionUseCase` verifies the secret for `actor.id`, checks `PERM-ESIG-SIGN`, then creates evidence bound to actor, subject type/id, subject version, action, meaning, snapshot hash, reauth method, timestamp, and request ID. Approval orchestration passes `persist:false`; `PostgresApprovalRepository.recordDecision` inserts signature, decision, work/case transitions, audit event, and outbox event inside one transaction. This is the correct atomic boundary in source.

The transaction includes the decision and the workflow mutation, but reauthentication verification happens before that transaction and is not transactionally coupled (the credential read need not share the business DB transaction). The tests show rejected reauthentication, required signature data, and that a failed owning-domain transition writes no decision in a fake repository. They do **not** inject a failure after signature insert / decision insert / work update / audit append / outbox enqueue and query PostgreSQL to prove all rows and state roll back. No complete rollback proof exists.

Signature `snapshotHash` is required and stored, but this review did not establish that the signer-facing meaning is displayed to the human at confirmation or that all production signing paths derive the snapshot from locked canonical state. The approvals Postgres read path recomputes subject snapshot from DB evidence; exact cross-domain coverage remains NOT VERIFIED.

## WI/SOP version lifecycle

Source has DRAFT create/edit, submit to IN_REVIEW, review event, approve to APPROVED, and policy-gated supersede from EFFECTIVE to SUPERSEDED while activating an APPROVED replacement. Supersede updates both rows, appends two audit events, and enqueues outbox in one transaction. Migrations enforce one EFFECTIVE row per document and protect approved content from mutation; version rows and linked files use restrictive foreign keys.

Focused tests cover draft → in-review → review-without-approval → approved, and a fake-repository supersede retaining the old row. They do not cover the whole requested draft/review/approve/effective/superseded flow against PostgreSQL. `SupersedeVersionUseCase` requires an approved effective-date policy; the mind records that policy as unresolved. The inspected document page explicitly reports the APPROVED → EFFECTIVE policy as unavailable. Historical snapshots of full source content/file hashes are not proven; current version metadata and file-link rows alone are not proof of byte-stable snapshot content.

## Audit read model and traceability

`PostgresAuditQuery` selects an explicit column allowlist and never selects `payload`; stable order is `occurred_at DESC, event_no DESC`, and the view mapper structurally omits payload while validating loaded payload/reason where present. Permission is `PERM-ADM-AUDIT-VIEW`; dashboard policy is separately actor-scoped. Focused tests verify payload omission/rejection, safe reason rejection, permission denial, and request-ID retention.

Traceability is available through `event_no`, subject type/id, action, actor, signature ID, and request ID; document supersede emits paired events with reciprocal replacement/superseded IDs in payload, but payload is not exposed by audit read model. This gives a safe source pointer, not a payload-bearing audit view. The query test is not a PostgreSQL SQL-shape assertion; query source is the evidence for the no-payload projection. No end-to-end lineage test followed one attachment/version/signature from source row through the rendered audit page.

## Required closures before claiming end-to-end security

1. Approve per-evidence MIME allowlists, byte limits, scanner, quarantine behavior, and retention/deletion/legal-hold ownership; wire an actual upload/download route to parent-record authorization.
2. Add expiring, actor- and subject-scoped download URLs only if the approved delivery architecture requires URLs; otherwise keep bytes behind the authorized service endpoint. Test expiry and cross-actor denial at the HTTP boundary.
3. Bind controlled document snapshots to canonical content plus attachment manifest hashes, and expose immutable historical content to authorized readers.
4. Run the new disposable PostgreSQL fault-injection suite to verify signature, decision, workflow state/version, audit, and outbox rollback; it also checks WI/SOP supersede rollback when audit or outbox persistence fails.
5. Resolve/approve effective-date policy, then run PostgreSQL WI and SOP lifecycle tests including historical snapshot read and immutable prior revision.
6. Add SQL/read-model lineage test proving no payload column is selected and the audit event resolves back to the originating subject/version/signature while preserving actor scope.

# File Upload and Evidence Policy Decision Request

**Status:** DRAFT — no policy approval is implied by this request.

## Current approved constraints

- File bytes are untrusted. Metadata is separate from business meaning; evidence files carry SHA-256 and use private object storage (`BR-FILE-001` through `BR-FILE-007`).
- Access follows the parent record's authorization. A file URL or opaque identifier is not authorization.
- Controlled evidence must not be silently removed. Until retention is approved, controlled business history must not be automatically deleted.
- `REQ-FILE-008` remains `POLICY-DEPENDENT` in `Documents/REQUIREMENTS-TRACEABILITY.md`; exact file retention is `UNCONFIRMED` in `Documents/DATA-MODEL.md`.

## Decisions required from QC/QMS, Information Security, and Document Control

1. **Per-evidence-type allowlist:** approve extensions and canonical MIME types, including whether PDF, office formats, image formats, archives, or other types are needed. State whether MIME parameters are allowed and how content signatures are checked for each type.
2. **Maximum size:** approve a byte limit per evidence type and whether any upload/request aggregate limit is needed. The implementation must not choose a production number by default.
3. **Malware scanning:** name the approved scanner/provider and required verdicts. Decide behavior for timeout, unavailable scanner, encrypted archives, nested archives, and files that cannot be inspected. Default implementation behavior remains deny before storage unless the scanner returns `CLEAN`.
4. **Retention and deletion:** define retention by evidence type and parent lifecycle, who may invalidate/unlink, whether bytes remain after unlink/supersede/VOID, legal hold behavior, and the approved purge actor/process. Automatic deletion stays disabled until this is approved.
5. **Orphan recovery:** approve a reconciliation process for private objects written before metadata failure or left behind when compensation fails, including audit requirements and a safe age/ownership rule. No time threshold is assumed.
6. **Idempotency:** decide the request identity and replay contract for retries, including same-key/same-content replay and same-key/different-content rejection. No request key or replay guarantee is claimed until persisted and tested.
7. **Parent authorization matrix:** confirm each upload/view/download operation against its owning domain's permission, state, scope, and any evidence-specific restrictions. Generic file access must not grant cross-domain authority.

## Implementation state pending these decisions

- `FileService` requires an explicit MIME allowlist, byte limit, and malware scanner policy for upload. Missing policy fails with `POLICY_SOURCE_REQUIRED`; non-clean or unavailable scans fail closed before object storage writes.
- Document version creation no longer accepts file IDs from the browser. A future link flow must validate the file, owning record, and actor server-side.
- Download resolves the canonical evidence link by ID, authorizes the linked subject before reading private bytes, verifies SHA-256, and uses the database MIME type for delivery. No public URL is created.
- Storage-first / database-second writes compensate by deleting an object if the atomic metadata/link transaction fails. If cleanup also fails, the error is surfaced as an aggregate failure; automated orphan reconciliation is not implemented.
- No upload/download route is enabled until approved parent authorization and storage/scanner dependencies are configured.

# QC-LAUNCH-015 — Patch and decision plan

## Candidate and boundary

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Candidate HEAD: `9c43fe5d108413e4871e2477eda7f0bace16413a`
- Requested audit reference: `60e78cc6fdafe6c70e249be2d687c1df3af45412` (different SHA)
- Source fingerprint at verification: `f04430bb68ff06935884ffac2d79ccc68959c7d4456ef3beb89e6bed0e8c87a6`
- Execution was performed in an isolated detached clone at `/private/tmp/qc-launch-015-9c43fe5`; the primary checkout remains unchanged.
- Evidence status: `PARTIAL / BLOCKED`; accepted rubric points: `0` because an independent reviewer and signed rubric evidence were not supplied.

## Applied local patch

1. Contextual change-request creation now accepts only a server-resolved `DRAFT` document version. The use case rejects `APPROVED` and `EFFECTIVE` snapshots before repository creation.
2. The PostgreSQL change-target source lists and loads only `DRAFT` versions.
3. Within the owning Documents transaction, draft metadata update requires `source_binding_verified`, active linked source files, and equality between the persisted source digest and a fresh digest of those files. Existing document mutation, audit, and outbox remain in the same transaction.
4. Focused source tests now use a DRAFT target and assert that APPROVED/EFFECTIVE targets create no request.

The patch is limited to:

- `src/modules/change-requests/application/create-document-version-change-request.ts`
- `src/modules/change-requests/infrastructure/postgres-change-target-source.ts`
- `src/modules/documents/infrastructure/postgres-repository.ts`
- `tests/integration/change-requests/document-version-change-request.test.ts`

## Decisions grounded in current source

- Supported apply coverage is one `DOCUMENT_VERSION` DRAFT metadata change (`revision` or `changeSummary`); other target types/fields fail closed.
- `APPROVED → APPLYING → APPLIED` occurs within one transaction. The owning-domain mutation returns before `APPLIED` and the success attempt are recorded. This is source inspection, not PostgreSQL runtime proof.
- Historical APPROVED/EFFECTIVE version edits are not allowed by this patch. Use the authorized revision/effectivity/signature lifecycle only after its governing authority is established.
- Some stale/invalid-transition failures may persist a failed attempt while leaving the request APPROVED. The defined `APPLICATION_FAILED` state is not reached by the inspected apply path. Do not change retry/failure semantics without an effective approved policy.
- A successful approval signature authorizes a decision; it does not establish that the owning-domain mutation succeeded.

## Decisions still required from Document Control / QMS owner

The expected controlled source `Documents/QC360-CHANGE-APPLICATION-POLICY-2026-10-08.md` is absent at this candidate. No replacement policy was inferred. Supply and approve:

1. The effective change-application policy and its revision/effectivity evidence.
2. Complete permitted `target_type` vocabulary, fields, allowed states, and owning-domain adapters.
3. Whether source-file effectiveness, retention, or supersession rules add constraints beyond active-file digest binding.
4. Failure-attempt, retry, replay, and audit-failure semantics, including whether failed audit attempts may be persisted separately.
5. Applicable revision, approval, electronic-signature, and effectivity lifecycle for controlled documents.

Until these decisions are controlled and effective, unsupported targets remain denied and release/apply policy closure remains blocked.

## Required verification after authority is supplied

Run on this exact final source candidate with a working isolated PostgreSQL 18/Testcontainers runtime:

- two competing applies and prove at most one owning-domain mutation;
- stale request/target contexts with before/after target, request, attempt, audit, and outbox counts;
- successful same-request replay and conflicting request-id replay;
- denied authorization with zero mutation/attempt/audit/outbox effects;
- injected audit failure with rollback evidence across target, request state, attempt, audit, and outbox;
- source-binding failure and approved failure-attempt behavior;
- rerun required integration, concurrency, and security suites and bind their reports to a fresh candidate fingerprint.

Then obtain independent rubric review, human UAT, and the required owner sign-off. None is evidenced here. No commit, push, deployment, production database operation, or controlled-document mutation was performed.

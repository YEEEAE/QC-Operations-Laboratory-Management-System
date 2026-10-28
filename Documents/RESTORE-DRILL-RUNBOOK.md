# Isolated Restore Drill Runbook — NDB-12 operator draft

**Status: DRAFT / NOT EXECUTED.** Use only after a separate owner-approved isolated target and recovery bundle exist. This runbook does not authorize production restore.

## Preconditions

- Approved drill reference, named operator, source and target environment identities, and isolated target access.
- Target database and target private object store are distinct from the source. Never use `NEON_BRANCH=production` as proof of actual identity.
- A version 2 recovery manifest with exact Git SHA, migration head and ledger checksums, schema checksum, archive digest, file-store identity, detached object references/digests, and controlled document/WI revision snapshots.
- Approved RPO/RTO objectives if the drill measures them. If absent, record both as `NOT APPROVED` and do not report a pass against them.
- Current provider settings and retention evidence reviewed by an authorized operator. Do not infer an available PITR window.

## Procedure

1. Verify the manifest schema and immutable artifact references. Keep connection strings and object credentials in the operator credential store; do not paste them into commands, evidence, or logs.
2. Confirm source and target identities independently. Use a direct non-pooled operator connection for controlled database maintenance; never use the browser/runtime pooled connection or a user-supplied URL.
3. Restore the archive only into the approved empty isolated database. Do not run migrations or redirect restored data to a production service.
4. Restore detached QC objects into an isolated, private, encrypted file-store namespace for the target. Preserve keys or apply a documented deterministic mapping, and record both source and target identities. Do not overwrite source objects or silently point target rows at another environment's store.
5. Verify database version, schema checksum, full migration ledger/head, key historical relations, and manifest identity. Verify every restored object's presence, byte size, and SHA-256 against both the manifest and immutable `qc.files` metadata. Reconcile controlled WI revision/content digest/file bindings without making an approval/effectivity claim.
6. Record separate outcomes for archive integrity, database restore, object restore, authorization/session behavior, application compatibility, and controlled evidence. Any missing object or mismatch is `FAIL` or `BLOCKED`, never a warning that can be waived by an aggregate pass.
7. Confirm the source database and source object store remained unchanged. Capture elapsed times only as observations; do not claim RPO/RTO acceptance without approved objectives and a valid measurement method.
8. Have an independent authorized reviewer record the restore verification outcome and evidence references. Keep this outcome separate from backup creation and artifact checksum verification.
9. Revoke temporary credentials and arrange any target/artifact cleanup only through a separately approved manual operator procedure. No automated deletion is authorized here.

## Neon-native PITR branch option

If the approved recovery source is a Neon point-in-time branch, first confirm current provider plan/settings, retention, eligible timestamp, source branch identity, and operation result. Create/use only an isolated recovery target under the operator's approved provider procedure. Record those provider facts and references; do not assume a default or fixed history window. The branch still needs the database and detached QC file checks above, and it must not be promoted automatically.

## Production restore gate

Production restore is blocked until approved RPO/RTO, a specifically named emergency release authority, the operator ceremony, an isolated pre-restore verification method, and a separately recorded post-restore verification outcome are in force. The application path is request-only and denies production restore. Do not bypass that guard by calling the backup script, an API, or a provider command.

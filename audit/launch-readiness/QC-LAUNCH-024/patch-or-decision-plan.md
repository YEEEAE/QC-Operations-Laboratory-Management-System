# QC-LAUNCH-024 — Controlled source decision request

**Disposition:** SOURCE NOT AVAILABLE / BLOCKED — no implementation patch authorized by the available controlled sources.

## Candidate and scope
- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Audit reference: `60e78cc6fdafe6c70e249be2d687c1df3af45412`
- Candidate HEAD: `e0a677180872064a18281b6152e1cf01f43d55a0` (reference is ancestor; 38 commits ahead)
- Clean source-tree fingerprint before this evidence packet: SHA-256 of `git diff --binary HEAD`: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- No application source, migration, controlled document, role, database, or remote repository was changed. Evidence and logs are local deliverables only.

## Verified source gap
`src/modules/reject-reports/infrastructure/postgres-repository.ts:743-777` completes an Issue Slip when every checkpoint is `CONFIRMED`. `src/modules/reject-reports/application/confirm-issue-slip-approval.ts:8-18` explicitly defines these as creator-recorded attestations, not approver e-signatures; `src/modules/reject-reports/domain/issue-slip.ts:16-19` repeats that distinction. This conflicts with requiring authenticated formal signatures if Issue Slip completion is a governed approval action. No approved/effective action-map row for Issue Slip was found. The expected `Documents/REJECT-REPORTS.md` is absent. Do not silently interpret the recorded approval-role names as signatures.

## Decision required (QMS / Document Control owner)
Provide a controlled, revisioned and effective `REJECT-REPORTS` WI/SOP/policy (or authoritative cross-reference) that states:
1. Whether a Daily Reject is operational-only and whether finalize is unsigned; define required fields/attachment evidence and any category/date/lot rules without inventing thresholds.
2. Whether an Issue Slip is a formal approval; signer identity/role per checkpoint, electronic-signature meaning, reauthentication, action/version binding, SoD, correction/reversal and replay rules.
3. Whether three sequential confirmations are required, what evidence attachment is mandatory, and who is authorized to issue/finalize/correct/void; distinguish creator attestation from actual approver signature.
4. Correction/void semantics, historical export status/watermark, linked receiving semantics, audit retention and authorized user/scope filtering.
5. Approved role/permission mapping and applicability to the current controlled signature action map.

**Owners:** QMS/Document Control authority for the controlled source and effective revision; QC process owner for workflow/record requirements; Engineering for implementation and same-candidate verification after source approval; independent rubric reviewer for scoring.

## Implementation proposal after authority is supplied
- Map each governed action to its approved signer, permission, prerequisites, signature meaning, evidence and version. Keep unmapped actions fail-closed.
- Implement only the smallest approved delta. Persist signature, transition and audit atomically; preserve append-only correction history and idempotent/replay protection. Do not treat a name field or creator attestation as an e-signature.
- Test synthetic records against isolated PostgreSQL 18 and authenticated disposable actors; bind all outputs to one candidate SHA and worktree fingerprint.

## Rollback and dependencies
- **Dependency:** approved/effective source and owner-signed action × subject × state × signer × meaning × evidence applicability decision. No production data or roles may be touched.
- **Rollback:** source changes should be isolated and reversible; any required schema change needs a forward-compatible reviewed migration and explicit local rollback/recovery plan. Never rollback by deleting controlled history or applying destructive production migrations.
- **Remote actions:** none; GitHub remains read-only. No commit, push, PR, deployment or remote write authorized/performed.

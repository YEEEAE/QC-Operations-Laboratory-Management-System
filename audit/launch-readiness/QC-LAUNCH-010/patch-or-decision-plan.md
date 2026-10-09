# QC-LAUNCH-010 — Patch or decision plan

## Disposition

**BLOCKED — controlled source decision required before implementation.** No product patch is justified until an approved, effective QMS action registry is supplied. The current generic approval flow remains fail-closed with `UNRESOLVED`.

## Candidate

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Branch / HEAD: `main` / `f9409b298fadb2270f28e8658ab39740db4b4e61`
- Audit reference: `60e78cc6fdafe6c70e249be2d687c1df3af45412` (ancestor; seven commits behind)
- Source fingerprint during verification: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- Migration head: `0047_task_references_occurrences.sql`

## Current local diff

- No product source, permission, migration, signature evidence, or controlled QMS source was changed.
- Local deliverables: this plan, `execution-report.html`, `evidence.json`, and the Mind/workspace-map audit updates.
- There is no patch to roll back. If a later authorized implementation fails acceptance, revert only that candidate's resolver/tests/schema change and retain the prior `UNRESOLVED` deny behavior; do not delete or rewrite historical approval/signature records.

## Decision request and owners

**Accountable owner:** QMS authority / Document Control, with the named domain decision owners for inspection, laboratory, controlled documents, CAPA, change requests, calibration, templates, release governance, and any other controlled decision family.

Provide one controlled and signed registry containing, for each action and subject/state:

1. Whether the event is an approval and whether an e-signature is required, explicitly distinguishing APPROVE/FINAL_APPROVE from REJECT, RETURN, VOID, REOPEN, RELEASE, CLOSE, and other actions. State explicit applicability or non-applicability; do not infer N/A.
2. Authorized signer role, permission, scope, separation-of-duties rule, and permitted override boundaries.
3. Exact signature meaning/action, subject version binding, required prerequisites, reauthentication/recency, and evidence/history fields.
4. Policy identifier, revision, approval record, effective-from date, superseded revision, and source document authority.
5. Whether each existing ceremony is retained as a domain-specific flow or handled by the shared generic approval service, avoiding duplicate signatures.

The supplied owner decision remains authoritative for its explicit APPROVE/FINAL_APPROVE scope: inspection/lab stage 1 and final signatures remain distinct; PASS is not RELEASED; APPROVED is not EFFECTIVE; it does not authorize scientific-source bypass or retroactive signatures.

## Implementation after decision

Approval engineer should then:

1. Reconcile the signed registry against every domain action and current ceremony, recording exact source paths and gaps.
2. Add a server-only, revision-aware policy resolver. Unknown, expired, unavailable, or conflicting policy must return a blocked state before reauthentication.
3. Persist policy id/revision with signature evidence if the approved contract requires it; introduce only the migration supported by that source.
4. Preserve atomic subject transition, signature, audit, and outbox; preserve version, actor/session, SoD, scope, source-effectivity, idempotency, race, and replay controls.
5. Test every approved mapping and denial on the same source SHA, then run isolated PostgreSQL 18 rollback/race/replay, authenticated route behavior, history checks, and human UAT.
6. Have an independent rubric reviewer assess QC360-SC-04-02. Until accepted, points stay zero.

## Dependencies and verification blockers

- QMS signed registry and controlled effectivity are a hard prerequisite.
- PostgreSQL 18 Testcontainers could not find a working container runtime in this environment.
- Current full test commands and exact outputs/digests are in `evidence.json`; none passed as a complete suite.
- No branch, remote repository, PR, production DB, provider, or deployment was changed.

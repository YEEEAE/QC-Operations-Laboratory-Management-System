# QC-POST-100-034 — exact-HEAD approval/change-request reconciliation

**Overall:** PARTIAL / BLOCKED_BY_AUTHORITY_SOURCE. Acceptance remains OPEN. This is a source-and-authority reconciliation; no business-code, schema, migration, provider, or database changes were made.

## Candidate identity and preserved work

- HEAD: `1f3993421276efb989d938a0e29a1f11179e741b` (`main`).
- Initial `git status --short`: modified `.agents/mind/01-mind-latest.md` and untracked `audit/1f3993421276efb989d938a0e29a1f11179e741b/` (pre-existing user work; preserved).
- SHA-256 of tracked `git diff HEAD --binary` at reconciliation: `01f1e6087055a5f1f53316343fba8be15292ae445abc10364ecc98c6772fab36`. This covers tracked dirty content only, not untracked audit files; no complete-tree fingerprint or candidate build was produced.
- Source migration head recorded in current Mind: `0045_provider_attestation_nonce_replay_guard`. The applied database ledger was not inspected for this task.

## Evidence and authority reconciliation

- The current `Documents/QUALITY-POLICY-DECISION-PACK-2026-10-02.md` explicitly labels itself **PROPOSED**, not signed/approved (lines 3–5). Its proposed PD-32 matrix includes change-request approval (line 27) but is not an authority source.
- `Documents/DECISION-ASSUMPTION-REGISTER-026.md` identifies PD-32 as PARTIAL and says the approved QMS signature-scope/action matrix is outstanding. Current Mind also says PD-32 remains partial/open. Therefore the task prompt's “approved PD32” premise is not corroborated by canonical project evidence; no signature applicability was inferred from the proposal.
- Matching historical handoffs `audit/2026-09-30/handoff-QC-ADP26-22.md` and `...23.md` are on different candidate SHAs. They document a shared transaction boundary, handler-derived decision capabilities, and a deny-before-password unresolved signature policy. They are HISTORICAL, not current-candidate tests or runtime evidence.
- Current source retains existing controls: `DecideApprovalUseCase` rejects `UNRESOLVED` signature policy before signing/transition; decision capabilities mark such actions `POLICY_BLOCKED`; approval repository supports one transaction for subject transition, optional signature, decision/work-item/case, audit, and outbox. Change-request creation binds target ID/version/snapshot/reason and the document-version path allowlists `revision`/`changeSummary`; the transition repository locks and compares expected request version and records audit/outbox in its transaction. These are source observations, not PostgreSQL proof.

## Classification

| Scope | Classification | Evidence / limit |
|---|---|---|
| Existing generic approval source and atomicity | PARTIAL | Source mechanisms are present, but cited supporting runs are historical; no current exact-HEAD approval suite was run. |
| Signature-required generic approve/reject/close applicability | BLOCKED_BY_AUTHORITY_SOURCE | PD-32 approved action matrix absent; unresolved policy remains fail-closed. No policy or UI action was enabled. |
| Change-request allowlist and target/version/reason binding | PARTIAL | Current source has contextual document-version allowlist and snapshot/version binding; no current PG18 race/rollback proof. |
| Requested submit/return/review/approve/reject/close end-to-end behavior | PARTIAL | Existing user actions/handlers are narrower than the requested full matrix and are policy/subject-handler gated. No invented target-field editor or new transitions. |
| Native/JavaScript authenticated routes and denials | NOT VERIFIED | No authenticated HTTP/browser, no-JS, real-record, keyboard/mobile/print, or trace evidence gathered. |
| PostgreSQL 18 rollback/concurrency/constraints | NOT RUN | No disposable PostgreSQL 18 transaction proof executed. |
| Migration requirement | NOT ESTABLISHED | No schema gap was demonstrated; no migration added/applied. |
| Human acceptance / provider identity | NOT RUN / NOT VERIFIED | No UAT or provider evidence supplied. |

## Safe next step

Provide the approved QMS PD-32 action-to-signature matrix with owner, source identifier, revision, effective date and content hash, and confirm any applicable PD-11 SoD decisions. Reconcile the approved matrix against the exact actions and current subject handlers. Then implement only authorized residual transitions and run exact-candidate focused tests plus disposable PostgreSQL 18 rollback/race/replay and authenticated route/browser evidence. Register evidence IDs and human acceptance; do not treat historical handoffs or this source inspection as closure.

No application tests/build, PostgreSQL, browser, production, migration, commit, push, or deploy were run/performed in this evidence-only reconciliation.

## Follow-up implementation after user said “go” — 2026-10-03

- Candidate remains HEAD `1f3993421276efb989d938a0e29a1f11179e741b`; source+tests dirty fingerprint (SHA-256 of `git diff HEAD --binary -- src tests`): `f9005837f69993ef3f36b369d79aa4096afd89faca45e2df755fd4758ed2541d`. This does not include Mind or audit artifacts; no build/release artifact identity was created.
- Closed the direct user-action bypass: `TransitionChangeRequestUseCase` now denies `RETURN`, `APPROVE`, and `REJECT` unless called with the enclosing approval transaction. The browser Action cannot supply that transaction; the approval subject handler already invokes this use case inside `DecideApprovalUseCase`'s shared transaction. This keeps those decisions behind the unresolved signature-policy gate rather than bypassing it.
- `/change-requests/[changeRequestId]/review` now offers only permission/state-gated `START_REVIEW`, with a native POST carrying the expected request version (JS remains an enhancement). Direct Return/Reject/Approve buttons were removed; the route explains the controlled approval/signature-policy boundary. The static no-JS inventory now drops this route.
- Source/test fingerprint is local and dirty. Node used: `v22.22.3`, outside the repository contract `>=24.20.0 <25`; pnpm `11.25.0`.

### Follow-up verification

| Check | Result | Limits |
|---|---|---|
| Focused change-request + approval orchestration/repository + mutation-safety/capability tests | **PASS — 35/35** | Synthetic/domain repository doubles; not PostgreSQL or authenticated route evidence. Command: `pnpm exec vitest run tests/integration/change-requests/change-requests.test.ts tests/integration/approvals/orchestration.test.ts tests/integration/approvals/repository.test.ts tests/unit/ui/mutation-safety-contract.test.ts tests/unit/ui/approval-decision-capability-contract.test.ts`. |
| Astro check | **PASS — 0 errors, 0 warnings, 114 hints** | Executed on unsupported Node 22.22.3; hints include pre-existing unused imports and deprecations. |
| Prettier on changed TS/tests; `git diff --check` | **PASS** | Astro file excluded because no Prettier Astro parser is installed. |
| Approval transaction rollback PG18 integration | **BLOCKED before setup** | `Could not find a working container runtime strategy`; 8 tests skipped by setup. Not a pass; no database changed. |
| Build/release identity, authenticated browser/no-JS POST, PG18 real-record race/rollback, AT/UAT | **NOT RUN / NOT VERIFIED** | No supported Node/runtime fixture/container/browser identity or human acceptance was used in this follow-up. |

Overall remains **PARTIAL / BLOCKED_BY_AUTHORITY_SOURCE**: PD-32 is still PROPOSED/unapproved, so signature applicability and approved/reject/return decisions remain unavailable; atomic PostgreSQL and route evidence are also outstanding. No schema/migration, provider, or production operation occurred.

# QC-ADP26-22 — Domain approval and decision evidence

**State: PARTIAL.** The source change makes the owning-domain transition and approval evidence one PostgreSQL transaction. The current signature policy remains unresolved and fail-closed. Database rollback/race/replay, authenticated route, browser/AT, and human UAT acceptance are not verified.

## Candidate and toolchain

| Item | Evidence |
|---|---|
| Requested audit HEAD | `0b1bb21bb3b4eca77862dbba1da8623044e96355` |
| Candidate HEAD | `396cb7fbe7842029e441863d6a894f4873a55192` (branch `main`) |
| Initial status | Clean; initial empty diff SHA-256 `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b`; mismatch means evidence is bound to the candidate above, not the requested audit SHA. |
| Node / pnpm | Runtime Node `v24.19.0`, pnpm `11.25.0`; package contract requires Node `>=24.20.0 <25`. Host Node `v22.22.3` is also outside contract. |
| Source migration head | `0042_immutable_lab_equipment_usage`; migration `0012_approvals_esignatures.sql` already defines decisions and signatures. No schema change was needed. Applied database schema: NOT VERIFIED. |
| Build artifact | Candidate-bound `pnpm build` **PASS**; release identity `rel-60ddb06fb7814ced`, build ID `local-396cb7fbe784`, artifact `dist/server/entry.mjs`, SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`. Build manifest: `.ci-results/build.json`; it binds HEAD, dirty fingerprint, source migration head and Node version. |
| Dirty fingerprint | `43c6a3b3922243fc721fe6db4105de045d683f21899f379244f53d03a01496b1` — SHA-256 of `git diff --binary HEAD -- src tests`, covering the changed implementation and tests. Documentation/evidence files are excluded from this implementation fingerprint. |

## Changed

- Added a transaction runner to `ApprovalRepository`; `DecideApprovalUseCase` passes its transaction to the selected subject transition and `recordDecision`.
- Threaded the same Kysely transaction through document, laboratory, inspection, and change-request approval adapters. Owning-domain state/version compare-and-set, domain audit/outbox, e-signature, approval decision/work item/case, approval audit, and approval outbox now execute in the same PostgreSQL transaction.
- Decision signature evidence remains persisted only with the approval commit. The action dependency still supplies no approved signature-scope policy, so the use case's unresolved policy continues to deny. The detail page now explains this block before asking for a password and exposes no decision form while the policy is unresolved.
- Improved detail-page reason error association, secret clearing, and stale/unknown-result recovery. The list uses human subject references when available and avoids raw subject UUID labels.
- No migration, policy, permission grant, or production data change.

## Database transaction contract

- **Reads:** authorization/detail projections and current approval/subject state are read through the existing repositories. Domain adapters re-read and compare the expected subject version in the transaction before updating. Approval persistence locks/re-reads the work item and case version, and checks request replay in the transaction.
- **Writes:** owning subject row/version and its domain audit/outbox; optional signature; one approval decision; approval work item and case; approval audit and outbox.
- **Constraints:** `approval_work_items(approval_case_id, step_no)` is unique; existing primary keys, foreign keys, state/version checks, row locks, domain expected-version compare-and-set, and append-only audit/signature/decision protections remain in force. The transaction boundary is `PostgresApprovalRepository.runDecisionTransaction`; all listed writes use its transaction handle. There is no unique DB constraint for the decision/signature request-id tuple; committed replay reads the prior decision, while the owning-domain version compare-and-set prevents a second same-version transition. Concurrent replay behavior still needs PostgreSQL 18 proof.
- **Failure behavior:** a thrown transition/evidence/audit/outbox error aborts the same transaction. A domain success without a persisted decision is no longer committed by this path.
- **Unverified:** PostgreSQL 18 failure injection at every boundary; database before/after snapshots on a bound fixture; rollback, concurrent same-case/version submissions and replay; zero row/audit/outbox change on real-record denial; duplicate-signature and orphan checks. Container runtime setup failed before tests (`Could not find a working container runtime strategy`); no database was changed.

## Verification

| Check | Result | Reference / limit |
|---|---|---|
| Approval orchestration + repository focused tests | **PASS — 9/9** | `pnpm exec vitest run tests/integration/approvals/orchestration.test.ts tests/integration/approvals/repository.test.ts`; synthetic fakes, not PostgreSQL. Includes shared transaction propagation and transition-failure short circuit. |
| Architecture + route integrity | **PASS** | `pnpm test:architecture`; Node 24.19 engine warning. |
| Astro typecheck | **FAIL — 1 error, 0 warnings, 112 hints** | Existing unrelated `src/pages/ai-advisory.astro:148` nullable `requestButton`; no errors reported in changed approval/domain files. |
| PostgreSQL 18 rollback integration | **BLOCKED before setup** | `tests/integration/approvals/transaction-rollback.test.ts`; no container runtime strategy. No production DB used. |
| Astro build + artifact identity | **PASS** | Candidate-bound manifest `.ci-results/build.json`; server/client compilation and release identity generation succeeded. Node 24.19 engine warning remains. |
| Applied schema parity / DB snapshots | **NOT VERIFIED** | No disposable PostgreSQL 18 instance available. Source head only is known. |
| Direct HTTP / authenticated browser / viewport 320, 375, 768, 1440 CSS px / 200% / manual AT | **NOT VERIFIED** | No authenticated approval fixture or target live browser session. No real action was posted. |
| Human UAT | **NOT RUN** | Must be signed by an authorized human; no UAT signature is claimed. |

Actor/role/state/fixture binding: unit tests use synthetic `ApprovalRecord` and actor doubles only; they do not represent a persisted role or current-state fixture. Positive real approval, existing-record denial with a positive read control, self-approval, stale version, wrong secret, and scope/SoD cases remain open. yazeed receives no business-policy bypass.

## Findings and remaining decisions

- **Source atomicity issue — addressed in code, database proof open.** Domain transition and evidence persistence now share a transaction on all wired subject domains.
- **RT-APPROVAL-001 (`/approvals`) — PARTIAL.** Human subject labels and assigned/scoped queue behavior remain source-level only; populated-role, empty/provider distinction, and no-leak HTTP/browser proof remain open.
- **RT-APPROVAL-002 (`/approvals/[approvalId]`) — PARTIAL.** Human context, reason validation, secret clearing and recovery copy are improved; live success/rejection and accessibility are not verified. The action stays unavailable while signature policy is unresolved.
- **PD-11 exact SoD matrix — OPEN; owner: QMS.** Foundation self-approval denial remains. Unknown combinations remain denied.
- **PD-32 e-signature scope — OPEN; owner: QMS.** No action/signature scope was invented. This is why decision submission remains blocked.
- **PD-12 role-to-permission grants — OPEN; owner: business owner.** Existing deny-by-default behavior remains unchanged.
- Dependency `QC-ADP26-23` remains pending; no decision has been assumed on its behalf.

## Changed files

Implementation paths are listed by `git status --short`; this handoff and `.agents/mind/01-mind-latest.md` contain the evidence summary. No commit, push, merge, deploy, production migration, or external write was performed.

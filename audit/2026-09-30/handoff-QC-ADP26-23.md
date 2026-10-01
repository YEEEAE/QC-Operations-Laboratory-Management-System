# QC-ADP26-23 — Approval decision capabilities and signature-policy block

**State: PARTIAL.** The source now derives per-decision capabilities from wired handlers, actionable state/version, assignment, permissions, scope, and SoD. The current generic approval signature policy is still unresolved and remains deny-before-password. PostgreSQL 18, authenticated browser, responsive/AT, and human UAT evidence are not verified.

## Candidate and toolchain

| Item | Evidence |
|---|---|
| Requested audit HEAD | `0b1bb21bb3b4eca77862dbba1da8623044e96355` |
| Candidate HEAD | `d8319aaa8cb5c930b5b0040c8f446bb5cb494bda` (`main`; clean at task start). Candidate differs from the audit SHA; evidence is rebound to this candidate. |
| Initial worktree | Clean; initial empty diff SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; tree `ae9a36eda3e413a1e38bed38cd0175d92a886ae6`. |
| Dirty fingerprint | `e1438cfde0611a31d1b21f11e5098a322eeab3adaa4e49e927f53e9b7db53a9c` — SHA-256 over `git diff --binary HEAD -- src tests` plus sorted untracked `src/` and `tests/` paths/content; implementation and test changes only. |
| Runtime / package manager | Node `v24.20.0` used for checks (package contract `>=24.20.0 <25`). Package contract is pnpm `11.25.0`; pnpm unavailable because Corepack could not fetch it (`ENOTFOUND registry.npmjs.org`). Host default Node is `v22.22.3` and outside contract. |
| Source / applied schema | Source migration head `0042_immutable_lab_equipment_usage`, checksum `d9b2531390b4ee00516b9bea07de0e706c3b78c1b13d2925481b29a4ff5340ab`. Existing migration `0012_approvals_esignatures.sql` defines approval decisions/signatures. No schema change was needed. Applied schema: **NOT VERIFIED**; no database connection was used. |
| Build | **PASS** — local Astro server/client build, then candidate-bound release identity. Release `rel-7114d77761d731df`, build `local-d8319aaa8cb5`, Node `v24.20.0`, source head above; artifact `dist/server/entry.mjs`, SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`. Full source fingerprint recorded at build time: `7dccb4df3c36fbd39071fd4c4d350b3e8e4f046bd4b10de2d54380fb44eae5ff`. Evidence: `.ci-results/build.json`, identity: `dist/release-identity.json`. The `pnpm build` wrapper itself was unavailable. |

## Changed

- Each approval transition now declares its supported decisions in wiring. Documents and lab tests wire `APPROVE`; inspections wire `APPROVE`/`RETURN`; change requests wire `APPROVE`/`REJECT`/`RETURN`. The application rejects an unregistered decision before signature reauthentication, transition execution, or writes.
- Added a per-decision capability resolver. It checks handler support, work-item actionability, case/subject version, assignment, generic and domain permission, scope, SoD, signature-policy status, and signer availability. The list/detail projections expose the result; the UI renders only `AVAILABLE` decisions.
- Wiring has no owner-approved generic action-to-signature matrix. It injects `UNRESOLVED`, so otherwise-eligible generic decisions remain `POLICY_BLOCKED`; the detail page shows the QMS owner and does not render decision/password fields. No signature scope or document-approval rule was inferred.
- The queue distinguishes empty from provider failure and labels assigned work with human subject references. The detail page distinguishes missing from denied and provider failure, preserves non-secret form input through errors, prevents repeat submit while pending, and describes unknown commit recovery. The queue table can receive keyboard focus for horizontal scrolling.
- No migration, production/database write, grant, commit, push, merge, deploy, or external publication.

## Authorization and transaction boundary

- Page visibility remains at the central `pageAccessDecision` middleware and registered permission-bound routes (`RT-APPROVAL-001/002`). Application use cases still perform the actual view/decision authorization; navigation visibility is not treated as decision authority.
- Decision authorization checks assignment/view, generic and owning-domain decision grants, scope, subject state/version, and author/executor SoD. The use case blocks unresolved signature policy before calling the signer. If policy later requires a signature, the signer reauthenticates with `persist: false` before the decision transaction.
- **Reads:** approval case/work item and owning subject projection/version; request-id replay lookup; actor/role context is server-derived. **Writes:** owning-domain row transition, optional signature evidence, approval decision, work item/case state, audit, and outbox share the existing `PostgresApprovalRepository.runDecisionTransaction` boundary. Existing row/version checks, foreign keys, uniqueness, append-only audit/signature/decision constraints remain. No schema change or migration.
- Failure/rollback/lock/replay behavior belongs to the existing single PostgreSQL transaction. It is source-inspected and unit-fake tested, not proven against PostgreSQL 18 in this run.

## Verification

| Check | Result | Evidence / limit |
|---|---|---|
| Focused approval orchestration, authorization matrix, repository | **PASS — 14/14** | `node scripts/verification/run-vitest-evidence.mjs integration -- vitest run tests/integration/approvals/orchestration.test.ts tests/integration/approvals/authorization-matrix.test.ts tests/integration/approvals/repository.test.ts`; synthetic records/actors, not persisted fixtures. Includes explicit positive test policy and unresolved/unsupported no-write rejection. |
| UI capability contracts | **PASS — 2/2** | `node scripts/verification/run-vitest-evidence.mjs unit -- vitest run tests/unit/ui/approval-decision-capability-contract.test.ts`; source contract, not rendered browser. |
| ESLint / Prettier (TS files) | **PASS** | Focused changed TS/tests. Prettier has no Astro parser installed, so `.astro` files were not covered by that command. |
| Architecture boundaries / route registry | **PASS** | `node scripts/architecture/check-boundaries.mjs`; `node --import=tsx scripts/architecture/check-route-files.mjs`. |
| Astro check | **FAIL — 1 error, 0 warnings, 113 hints** | Existing unrelated `src/pages/ai-advisory.astro:148`: nullable `requestButton`. No approval-page or approval-module errors. |
| PostgreSQL 18 rollback / race / replay | **BLOCKED** | Approval rollback suite could not find a working container runtime strategy. No database was connected or changed. Real-record denial with positive read control and row/audit/outbox before/after: **NOT VERIFIED**; there is no bound fixture or DB snapshot. Unit rejection spies show no transaction/decision write call for unsupported or unresolved policy, but do not prove DB audit/outbox state. |
| Capability positive / denial / boundaries | **PASS — synthetic only** | Synthetic actionable `APPROVE` with explicit test `NOT_REQUIRED` policy => `AVAILABLE`; unsupported `RETURN`/`REJECT`, missing domain grant, self-approval, stale version, and unresolved policy map to denied states. The positive fixture does not represent an owner-approved production policy or persisted user/role. |
| Authenticated HTTP/browser and actual UI | **NOT VERIFIED** | No bound approval DB fixture/session available; no authenticated read/action was sent. Empty/missing/denied/provider presentation, layout at 320/375/768/1440 CSS px and 200%, keyboard scroll, and manual AT are not evidenced in a browser. Static UI contracts pass only. |
| Human UAT | **NOT RUN** | Requires an authorized human; no UAT acceptance is claimed. |

## Findings and remaining decisions

- **QC-PAGE-F-023 / QC-ADP26-23 — PARTIAL:** handler-derived capabilities and fail-closed unresolved policy are implemented. Unsupported Return/Reject are absent from the approval-only UI and rejected before password. Real DB/runtime/browser/AT/UAT closure remains open.
- **RT-APPROVAL-001 (`/approvals`) — PARTIAL:** assigned queue and per-item decision state now use the capability projection; live role-boundary/empty/provider and responsive/AT behavior remain unverified.
- **RT-APPROVAL-002 (`/approvals/[approvalId]`) — PARTIAL:** actions are sourced from capabilities; unresolved policy hides controls before password; error/recovery copy preserves non-secret context. Real authorized, denied, stale, provider, and unknown-commit routes remain unverified.
- **PD-32 — OPEN / owner: QMS.** Provide the approved action-to-signature matrix with source/version and subject/version binding. Until then generic actions requiring a policy decision remain denied.
- **RD-019 — OPEN / owners: Document Control and QMS.** Provide authorized WI/SOP roles, scope, SoD and ceremony. This task does not grant generic document approval.
- **PD-11 / exact SoD and PD-12 / role grants** remain owner-controlled where not already approved; no `yazeed` bypass was added.

## Closed and open evidence

| Finding/page | Source status | Evidence status |
|---|---|---|
| QC-PAGE-F-023 | Source implementation addressed for handler/state/role/scope/SoD/signature capability and pre-password denial | PARTIAL; DB, actual browser, AT and UAT open |
| RT-APPROVAL-001 `/approvals` | Source implementation addressed | PARTIAL; role-bound live queue and viewport/AT open |
| RT-APPROVAL-002 `/approvals/[approvalId]` | Source implementation addressed | PARTIAL; authenticated route, error variants, viewport/AT open |

No real before/after DB row values are available; none are fabricated. No credentials, secrets, or production data were used.

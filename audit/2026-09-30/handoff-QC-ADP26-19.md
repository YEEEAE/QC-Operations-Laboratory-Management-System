# QC-ADP26-19 — Architecture boundary repair and release evidence intake

## Changed

- Moved provider signer policy, intake DTOs, verified-attestation contract, and typed intake errors to `src/modules/release-governance/application/ports/provider-attestation.ts`.
- Moved cryptographic verification into application code and added `IngestProviderEvidenceUseCase`; the API route now performs the body-size guard, passes signed headers/body, and maps typed outcomes to HTTP responses. The route no longer constructs repositories, accesses the database, or imports release-domain policy.
- Preserved the existing signed intake rules: 32 KiB body bound, HMAC-SHA256, timestamp freshness, signer/key/scope/environment/age checks, exact release identity, idempotent digest replay, and conflicting digest rejection.
- Moved the task list presentation type behind `application/ports`. Routed the two template admin pages through an application authority facade so the existing global Delivery→Domain boundary check can pass. The boundary checker allowlist remains empty and unchanged.
- No presentation behavior or styling changed on `/tasks` or `/governance/releases/[releaseId]`. No database migration was added.

## Frozen candidate and environment

- User-specified audit HEAD `0b1bb21bb3b4eca77862dbba1da8623044e96355` did not match the checkout. The candidate HEAD was `de23116d32b71f8ef42ad6a59191d16497eaaade`, branch `main`; working tree was clean before edits. The F-019 source evidence was rechecked on this candidate and reproduced: the API route crossed infrastructure/domain boundaries, and the tasks page imported `TaskListItem` from domain. Baseline architecture also reported two template-authority domain imports; those were removed through application facades to satisfy the unchanged gate.
- Node `v24.20.0`; pnpm `11.25.0`.
- Build candidate identity is in `.ci-results/build.json` and `.ci-results/run-context.json`; those files bind the run to exact HEAD and source fingerprint. Build output: release `rel-8996912516dddf51`, build `local-de23116d32b7`, entry artifact SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`.
- Source migration head: `0042_immutable_lab_equipment_usage.sql`. Migration `0040_signed_release_gate_evidence.sql` already defines digest uniqueness, signer/signature fields and append-only/no-truncate protections. It was not modified or applied in this task. Applied database schema: NOT VERIFIED.
- Code/test dirty fingerprint: recorded below; complete source fingerprint and build identity are in `.ci-results/build.json`.

## Data and authorization contract

- Reads: candidate lookup by signed `identity.releaseId`; the persistence transaction then selects that candidate `FOR UPDATE`, checks all candidate identity fields and release version, checks an existing `(release_id, evidence_type, evidence_digest)` replay/conflict, and reads the latest evidence version for that gate.
- Write on accepted new evidence: one insert into `qc.release_gate_evidence`; `audit_info` stores provider, signer/key, approved scope/reference, environment, nonce, evidence/signature digests, and signature algorithm. The evidence insert and version allocation share one PostgreSQL transaction. An exact replay returns the existing evidence ID without another insert. A conflicting replay, missing/stale candidate, invalid signature, invalid scope, malformed payload, and missing signer policy fail closed.
- No separate audit-log or outbox write is defined by this endpoint contract; the immutable evidence row carries its audit metadata. No change was made to approval, UAT, signature, or release decision policy. Provider signer approval/scope ownership remains unresolved in QC-ADP-03; no owner approval was inferred.
- The integration fixture is designed to establish one valid evidence row before a foreign-SHA denial and compare `id`, digest, and `audit_info` before/after. It could not execute here, so no database before/after claim is made. There is no actor role in this machine-provider endpoint; authority is the configured signer key and its owner-approved gate/environment scope. Named human release approval remains separately enforced by the release approval use case.

## Evidence

| Requirement | Status | Evidence |
|---|---|---|
| Candidate/source binding | PASS | HEAD, Node, pnpm and source fingerprint in `.ci-results/build.json` / `.ci-results/run-context.json`; build identity values above. The tree is dirty by design. |
| Route checker | PASS | `pnpm test:architecture` invokes `scripts/architecture/check-route-files.mjs`; canonical route coverage and registry integrity passed. |
| Architecture boundaries | PASS | `pnpm test:architecture`; Delivery→database/domain/business-rule boundary check passed with no allowlist entry. |
| Provider signature/use-case unit cases | PASS | `vitest run tests/unit/release-governance/provider-attestation.test.ts tests/unit/release-governance/provider-evidence-intake.test.ts`: 8/8, including accepted signed evidence, malformed/modified signature rejection, absent policy/candidate rejection, and 32 KiB / 32 KiB+1 body boundary. Fake repository only; not DB proof. |
| Astro build | PASS | `pnpm build` after `pnpm verification:begin`; Astro build, release identity, and build evidence completed for the candidate. Existing dependency/large-chunk warnings remain. |
| Formatting | PASS | Prettier check on changed TS/test files passed. `.astro` files are not handled by the configured standalone Prettier parser; only import lines changed in them. |
| PostgreSQL 18 persistence, denial immutability, replay race, rollback | BLOCKED | The focused integration command `vitest run tests/integration/release-governance/provider-ingestion.test.ts` could not start Testcontainers (`Could not find a working container runtime strategy`); 2 cases skipped before setup. `QC_TEST_DATABASE_URL` is unset and local `pg_isready` reported no response. |
| Typecheck | FAIL | `pnpm typecheck`: 10 TypeScript errors in `scripts/verification/build-route-acceptance.ts`, `scripts/verification/route-acceptance.mjs` consumers, `scripts/release/*.mjs` consumers, and `tests/unit/verification/route-acceptance.test.ts`; none point to the changed implementation files. No pristine baseline comparison was performed. |
| Direct HTTP security contract | NOT VERIFIED | The unit cases exercise the application intake/verifier; no authenticated/server-backed HTTP request was run. |
| Browser, responsive widths, AT, human UAT | NOT VERIFIED | No authenticated page fixture/browser session was available. UI/rendering code was not changed; route source and registry were checked only. No WCAG or UAT claim. |
| Applied schema / DB row, audit or outbox before/after | NOT VERIFIED | No disposable PostgreSQL 18 service was available. Production DB was not accessed. |

## Page and finding disposition

- `QC-PAGE-F-019`: **PARTIAL / OPEN**. The architecture import violations are closed in source and the architecture gate passes. PostgreSQL persistence/security integration, authenticated direct HTTP, and page acceptance remain unverified or blocked; this does not close the broader card.
- `/tasks` (`RT-TASK-001`): source boundary import is repaired; `routechecker` PASS. No UI/route behavior test, role fixture, populated database test, or AT/UAT was performed.
- `/governance/releases/[releaseId]` (`RT-REL-001`): page source and NO-GO/19-gate policy were unchanged. Existing named Manager or yazeed/SYSTEM_OWNER human approval path was not exercised. Live candidate/read-role behavior remains NOT VERIFIED.
- Remaining policy decision: Release Governance owner must approve signer identities, key custody/rotation, allowed gate and environment scopes, and approval references before production provider intake can be configured. The owner is not identified by the available approved source; keep unapproved policy fail-closed.

## State

**PARTIAL.** Source architecture finding addressed. Evidence acceptance is not complete. No production write, migration, commit, push, merge, deploy, or external publication occurred. Human UAT was not signed.

Code/test dirty fingerprint (SHA-256 of the binary HEAD diff plus sorted untracked implementation/test paths and contents): `4e1db6f9c075b6db1edfc8ae50b81983eb759093775de2ffbd0cb4cb285189f0`.

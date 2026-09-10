# P-05 Controlled Approval Authorities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the approved P-05 authority policy for inspection approval, laboratory approval, receiving/material release, retest authorization, controlled `VOID`, and controlled-document approval while preserving server-side authorization, controlled history, SoD, evidence, signatures, and atomicity.

**Architecture:** Use the existing hybrid design. `Approvals` and `E-Signatures` provide shared assignment, authorization, reauthentication, signature meaning, replay, and decision ceremony where an approval case exists. Each owning Domain keeps its own state machine, evidence validation, snapshot, transition, and PostgreSQL repository transaction. Astro Actions remain thin and never write domain tables directly.

**Tech Stack:** Astro SSR/Actions 4.16.19, TypeScript, PostgreSQL, Kysely, Vitest, Testcontainers PostgreSQL 18, Playwright, existing `authorize()`/SoD/idempotency/audit/outbox/e-signature primitives.

---

## File map before implementation

### Shared authorization and policy

- Modify `src/shared/authorization/policy-registry.ts` to register the final P-05 authority policy and only explicit canonical operation/state pairs.
- Verify canonical P-05 permissions in `src/shared/authorization/permissions.ts`; the current listed permissions are reused and no new wildcard or Admin-bypass permission is added.
- Modify `db/seeds/common.ts` to add P-05 permissions only to the approved `SUPERVISOR` and `MANAGER` grants. Keep `ADMIN` out of approval/release/VOID/signature grants unless an existing `ALLOW` decision explicitly requires it.
- Add `src/shared/authorization/p05-authority.ts` for the reusable authority predicate: `SUPERVISOR`, `MANAGER`, or named active `yazeed/SYSTEM_OWNER`. It must be a policy check in addition to explicit permission, not a replacement for it.

### Existing approval-bearing domains

- Modify `src/modules/quarantine/inspection/application/approve-inspection.ts` and its dependencies to replace the permanent deny policy with the final P-05 policy while retaining evidence, state, scope, version, SoD, signature, and transaction checks.
- Modify `src/modules/laboratory/application/approve-lab-test.ts` and its dependencies using the same boundary.
- Modify `src/modules/quarantine/receiving/application/release-receiving.ts` and dependencies to activate the final release policy without coupling `PASS` to `RELEASED`.
- Modify `src/modules/documents/application/approve-version.ts` and document dependencies to activate the final document policy and signature ceremony.

### Retest and controlled VOID

- Modify `src/modules/laboratory/application/create-retest.ts` to enforce both `PERM-LAB-RETEST` and `PERM-LAB-AUTHORIZE-RETEST`, then create the linked retest only after the approved ceremony.
- Modify `src/modules/laboratory/domain/lab-state.ts`, `src/modules/laboratory/domain/lab-test.ts`, and laboratory repository ports/adapters only for an explicitly documented `VOID` transition; do not invent a new terminal state if the current state machine does not define one.
- Add domain-specific VOID use cases and repository commands for currently supported non-template target types with both a canonical permission and explicit transition: Finding, Calibration, and CAPA. Add Inspection and Document VOID only with explicit state/permission entries in this task; Lab, Receiving, NCR, RCA, and the template lifecycle remain outside P-05 and denied/handled by their existing policies where their current contracts do not define the transition.
- Add corresponding thin Actions in `src/actions/quarantine.ts`, `src/actions/laboratory.ts`, `src/actions/documents.ts`, and the existing owning-domain Action files; do not add a generic cross-domain SQL Action.

### Shared ceremony and persistence

- Reuse `src/modules/e-signatures/application/sign-controlled-action.ts` and its existing `persist: false` contract for outer transactions; no signature persistence API redesign is planned.
- Modify `src/modules/approvals/application/decide-approval.ts` and `src/modules/approvals/application/authorization.ts` to use explicit P-05 signature policies and authority checks without weakening generic approval checks.
- Modify owning PostgreSQL repositories and ports to persist exact pre-transition snapshots, signature evidence, audit, outbox, and idempotency in one transaction.
- Reuse existing approval/signature/audit/outbox/idempotency tables and columns from migrations `0004`, `0011`, `0012`, and `0015`; do not add a migration unless a failing PostgreSQL test proves a required P-05 field is absent, and then stop for explicit schema review rather than inventing a column.

### Tests

- Add `tests/unit/shared/p05-authority.test.ts`.
- Add `tests/unit/policy/p05-authority-matrix.test.ts`.
- Add focused domain/application suites under `tests/unit/{quarantine,laboratory,documents}/`.
- Add `tests/integration/p05/authority-matrix.test.ts` for the table-driven application matrix.
- Add `tests/integration/p05/transactional-evidence.test.ts` for PostgreSQL atomicity, concurrency, replay, and failure rollback.
- Add `tests/e2e/p05-authority-matrix.spec.ts` with fixture gates and no production credentials.

## Task 1: Lock the authority matrix in shared policy code

**Files:**
- Create: `src/shared/authorization/p05-authority.ts`
- Modify: `src/shared/authorization/policy-registry.ts`
- Modify: `src/shared/authorization/permissions.ts` only when a listed canonical permission is absent
- Modify: `db/seeds/common.ts`
- Test: `tests/unit/shared/p05-authority.test.ts`
- Test: `tests/unit/policy/p05-authority-matrix.test.ts`

- [ ] **Step 1: Write failing authority tests.**

Use a table of actors with the exact cases `EMPLOYEE`, `SUPERVISOR`, `MANAGER`, `ADMIN_ONLY`, `YAZEED_SYSTEM_OWNER`, and `ADMIN_MANAGER`. Assert that only Supervisor, Manager, yazeed, and Admin+Manager through its Manager role satisfy the authority predicate. Assert that Admin-only fails even with GLOBAL scope.

```ts
it.each([
  ['employee', ['EMPLOYEE'], false],
  ['supervisor', ['SUPERVISOR'], true],
  ['manager', ['MANAGER'], true],
  ['admin only', ['ADMIN'], false],
  ['yazeed owner', ['SYSTEM_OWNER'], true],
  ['admin plus manager', ['ADMIN', 'MANAGER'], true],
])('%s has the approved P-05 authority result', (_name, roles, expected) => {
  expect(isP05Authority(actor({ id: 'u-1', loginIdentity: _name, roles }))).toBe(expected);
});
```

- [ ] **Step 2: Run the focused tests and verify RED.**

Run:

```bash
pnpm exec vitest run tests/unit/shared/p05-authority.test.ts tests/unit/policy/p05-authority-matrix.test.ts
```

Expected: FAIL because `isP05Authority` and final P-05 policy entries are not implemented.

- [ ] **Step 3: Implement the smallest shared predicate.**

The predicate must require the named identity for `SYSTEM_OWNER` and must not infer authority from `ADMIN`, GLOBAL scope, or a numeric hierarchy. Keep explicit operation permissions in `authorize()` as a separate check.

- [ ] **Step 4: Add explicit policy entries.**

Register the existing canonical permissions and exact entity/action/state pairs. Use explicit entries such as:

```ts
{
  permission: 'PERM-INSP-APPROVE',
  action: 'APPROVE',
  entityType: 'INSPECTION_REPORT',
  states: ['UNDER_REVIEW'],
}
```

Add the matching generic approval entry only for approval-case paths. Do not add a policy entry for an unknown `LAB VOID`, `RECEIVING VOID`, or other transition unless the current domain state machine and canonical permission both define it.

- [ ] **Step 5: Add Supervisor/Manager grants without granting Admin.**

Update `db/seeds/common.ts` so the final P-05 operation permissions and `PERM-APR-APPROVE` are explicit grants for `SUPERVISOR` and `MANAGER`. Add `PERM-ESIG-SIGN` only according to the existing controlled signature contract. Keep the Foundation seed deterministic/idempotent and preserve the existing count/drift checks.

- [ ] **Step 6: Run the tests and seed contract.**

Run:

```bash
pnpm exec vitest run tests/unit/shared/p05-authority.test.ts tests/unit/policy/p05-authority-matrix.test.ts tests/unit/seeds-factories.test.ts
pnpm test:architecture
```

Expected: focused tests PASS and the architecture guard remains PASS.

## Task 2: Add a reusable P-05 ceremony contract

**Files:**
- Create: `src/shared/authorization/p05-ceremony.ts`
- Modify: `src/modules/e-signatures/application/sign-controlled-action.ts`
- Modify: `src/modules/approvals/application/decide-approval.ts`
- Modify: `src/modules/approvals/application/authorization.ts`
- Test: `tests/unit/shared/p05-ceremony.test.ts`
- Test: `tests/integration/approvals/p05-ceremony.test.ts`

- [ ] **Step 1: Write failing ceremony tests.**

Cover exact meaning binding, empty reason rejection where required, missing reauthentication, missing signature, actor mismatch, subject/version mismatch, and the `persist: false` signature path used inside an outer transaction.

- [ ] **Step 2: Run focused tests and verify RED.**

```bash
pnpm exec vitest run tests/unit/shared/p05-ceremony.test.ts tests/integration/approvals/p05-ceremony.test.ts
```

- [ ] **Step 3: Implement the contract.**

Use a typed input such as:

```ts
type P05CeremonyInput = {
  actor: ActorContext;
  subjectType: string;
  subjectId: string;
  subjectVersion: bigint;
  currentState: string;
  action: string;
  meaning: string;
  snapshotHash: string;
  reason?: string;
  reauthenticationSecret: string;
  requestId: string;
};
```

The helper must call the existing signer with `persist: false` when the caller owns the transaction. It must never log or return the secret and must reject a meaning that differs from the operation.

- [ ] **Step 4: Wire generic approval decisions.**

Define explicit P-05 signature policies for inspection, lab, and document approval. Keep unresolved policies fail-closed for operations not covered by the approved P-05 contract. Preserve the existing assignment, generic permission, domain permission, subject version, and SoD checks.

- [ ] **Step 5: Verify ceremony and neighboring suites.**

```bash
pnpm exec vitest run tests/unit/shared/p05-ceremony.test.ts tests/integration/approvals/p05-ceremony.test.ts tests/integration/approvals/orchestration.test.ts tests/integration/e-signatures/signature.test.ts
```

Expected: PASS with no password or signature secret in captured evidence/log assertions.

## Task 3: Activate inspection and laboratory approval

**Files:**
- Modify: `src/modules/quarantine/inspection/application/approve-inspection.ts`
- Modify: `src/modules/quarantine/inspection/application/dependencies.ts`
- Modify: `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts`
- Modify: `src/modules/laboratory/application/approve-lab-test.ts`
- Modify: `src/modules/laboratory/application/dependencies.ts`
- Modify: `src/modules/laboratory/infrastructure/postgres-repository.ts`
- Test: `tests/unit/quarantine/inspection-approval-p05.test.ts`
- Test: `tests/unit/laboratory/lab-approval-p05.test.ts`
- Test: `tests/integration/p05/inspection-lab-approval.test.ts`

- [ ] **Step 1: Add RED tests for authorized and denied actors.**

For both domains, use the same table-driven actor matrix. Add failures for inactive account, missing operation permission, missing generic approval permission, wrong scope, wrong state, stale version, missing evidence/source hash, SoD, failed reauthentication, invalid signature, and duplicate request.

- [ ] **Step 2: Add RED transaction assertions.**

Assert that a successful operation increments the subject version and creates exactly one pre-transition snapshot, signature, audit row, outbox row, and idempotency record. Assert that missing signature/audit/outbox rolls back all writes.

- [ ] **Step 3: Replace permanent deny policies with explicit P-05 policies.**

Keep existing evidence checks and `authorize()` calls. Add `isP05Authority` as an additional condition. Do not let yazeed bypass state, evidence, version, or SoD.

- [ ] **Step 4: Add final snapshots and ceremony inputs to repository commands.**

The repository must lock the row, re-read version/state, capture the exact snapshot, perform the transition, persist signature/audit/outbox/idempotency, and rollback on any failure.

- [ ] **Step 5: Run focused suites.**

```bash
pnpm exec vitest run tests/unit/quarantine/inspection-approval-p05.test.ts tests/unit/laboratory/lab-approval-p05.test.ts tests/integration/p05/inspection-lab-approval.test.ts
```

Expected: unit/application tests PASS; PostgreSQL tests run when `QC_TEST_DATABASE_URL` or Testcontainers is available and otherwise report the documented environment block, never a false PASS.

## Task 4: Activate receiving/material release

**Files:**
- Modify: `src/modules/quarantine/receiving/application/release-receiving.ts`
- Modify: `src/modules/quarantine/receiving/application/dependencies.ts`
- Modify: `src/modules/quarantine/receiving/infrastructure/postgres-repository.ts`
- Test: `tests/unit/quarantine/release-p05.test.ts`
- Test: `tests/integration/p05/release.test.ts`

- [ ] **Step 1: Add RED release matrix tests.**

Require `RELEASE_PENDING`, `inspectionResult === 'PASS'`, `releaseSystem === false`, explicit `PERM-QUAR-RELEASE`, valid scope, matching version, active account, and final P-05 authority. Deny FAIL, HOLD, RELEASED, stale, out-of-scope, Admin-only, and missing evidence/signature cases.

- [ ] **Step 2: Add the approved release policy injection.**

Replace `denyByDefault` only for the P-05 release path. The policy must be explicit and fail closed if the required business evidence is absent. Do not change the invariant that PASS does not automatically set `releaseSystem`.

- [ ] **Step 3: Make release ceremony and transaction atomic.**

Use exact `RELEASE` signature meaning where the controlled transition requires it. Persist the release flag, version increment, snapshot, signature, audit, outbox, and request result in one transaction with a row lock.

- [ ] **Step 4: Preserve idempotency.**

Use the request ID plus command fingerprint, not only the current version, as the dedupe identity. Same request/same fingerprint replays the stored result; same request/different fingerprint returns duplicate-command conflict.

- [ ] **Step 5: Run focused release tests.**

```bash
pnpm exec vitest run tests/unit/quarantine/release-p05.test.ts tests/integration/p05/release.test.ts tests/integration/concurrency/idempotency.test.ts
```

## Task 5: Implement retest authorization without inventing scientific policy

**Files:**
- Modify: `src/modules/laboratory/application/create-retest.ts`
- Modify: `src/modules/laboratory/application/dependencies.ts`
- Modify: `src/modules/laboratory/infrastructure/postgres-repository.ts`
- Modify: `src/modules/laboratory/domain/retest.ts`
- Test: `tests/unit/laboratory/retest-authorization-p05.test.ts`
- Test: `tests/integration/p05/retest.test.ts`

- [ ] **Step 1: Add RED authorization tests.**

Use a valid original test fixture and verify that the operation requires both `PERM-LAB-RETEST` and `PERM-LAB-AUTHORIZE-RETEST`, plus Supervisor/Manager/yazeed authority, active account, scope, valid original state, non-empty reason, and valid approved template/source linkage.

- [ ] **Step 2: Add RED integrity tests.**

Verify `originalTestId`, `retestSequence`, `retestReason`, fresh version, draft state, no copied scientific result, and no mutation when source resolution, authorization, signature, or persistence fails. Add duplicate request and concurrent sequence tests.

- [ ] **Step 3: Implement the dedicated application path.**

The use case reads the original through the repository, authorizes server-side, validates the reason and existing `assertRetestLink` contract, resolves controlled source context, runs the exact `AUTHORIZE_RETEST` ceremony, then persists the new linked test atomically. It must not define limits, sampling, precision, rounding, maximum attempts, or final-result semantics absent from approved sources.

- [ ] **Step 4: Add repository idempotency and audit evidence.**

Persist the authorization action and creation result with the original ID, sequence, reason, source snapshot reference, actor, request ID, and signature reference. Preserve raw measurement/history rules.

- [ ] **Step 5: Run focused tests.**

```bash
pnpm exec vitest run tests/unit/laboratory/retest-authorization-p05.test.ts tests/integration/p05/retest.test.ts
```

## Task 6: Implement controlled VOID for explicitly supported targets

**Files:**
- Create: `src/modules/quarantine/inspection/application/void-inspection.ts` with the explicit inspection VOID policy/state contract
- Create: `src/modules/documents/application/void-version.ts`
- Modify: owning domain state files and repository ports/adapters for each supported target
- Modify: `src/shared/authorization/policy-registry.ts`
- Modify: owning Action files
- Test: `tests/unit/p05/controlled-void.test.ts`
- Test: `tests/integration/p05/controlled-void.test.ts`

- [ ] **Step 1: Build a supported-target table from current canonical sources.**

The implementation table must contain only target type, canonical `PERM-*-VOID`, source state(s), terminal state, reason requirement, and signature meaning. The initial supported set is Finding, Calibration, and CAPA. Inspection and Document are added with explicit state/permission entries in this task. Laboratory, Receiving, NCR, RCA, and the template lifecycle remain outside P-05; where their current contracts do not define a P-05 transition, their runtime result remains `AUTHZ_DENIED` and no P-05 Action is exposed.

- [ ] **Step 2: Add RED tests for history preservation.**

Assert that supported VOID transitions require P-05 authority, explicit permission, valid scope, eligible state, matching version, non-empty reason, SoD, reauthentication, signature, and request ID. Assert that the record, evidence, and prior snapshot remain queryable after VOID.

- [ ] **Step 3: Implement domain-specific use cases.**

Each use case calls its owning domain state transition and repository command. No generic VOID service may write multiple domain tables. `VOID` is never a hard delete and cannot be repeated from the terminal state.

- [ ] **Step 4: Add safe Actions and capability output.**

Expose only supported domain actions. Server-derived capabilities control visibility; forged direct requests still fail through application authorization.

- [ ] **Step 5: Run focused VOID tests.**

```bash
pnpm exec vitest run tests/unit/p05/controlled-void.test.ts tests/integration/p05/controlled-void.test.ts
```

## Task 7: Activate controlled-document approval

**Files:**
- Modify: `src/modules/documents/application/approve-version.ts`
- Modify: `src/modules/documents/application/dependencies.ts`
- Modify: `src/modules/documents/infrastructure/postgres-repository.ts`
- Modify: `src/modules/documents/domain/document-state.ts` only for already documented transitions
- Test: `tests/unit/documents/document-approval-p05.test.ts`
- Test: `tests/integration/p05/document-approval.test.ts`

- [ ] **Step 1: Add RED authority and evidence tests.**

Require `IN_REVIEW`, matching expected version, non-empty content hash, valid document context, `PERM-DOC-APPROVE`, `PERM-APR-APPROVE`, P-05 authority, valid scope, SoD, reauthentication, and exact approval signature.

- [ ] **Step 2: Add the explicit policy gate.**

Register the already documented document approval policy and do not bypass the unresolved/deny behavior of unrelated effective-date or supersession policies.

- [ ] **Step 3: Add atomic approval evidence.**

Persist the pre-approval version snapshot, approval transition, signature, audit, outbox, and idempotency result in one transaction. Preserve immutable approved content and reject direct edits afterward.

- [ ] **Step 4: Run focused document tests.**

```bash
pnpm exec vitest run tests/unit/documents/document-approval-p05.test.ts tests/integration/p05/document-approval.test.ts tests/integration/documents/review.test.ts
```

## Task 8: Complete the table-driven P-05 integration matrix

**Files:**
- Create: `tests/integration/p05/authority-matrix.test.ts`
- Create: `tests/integration/p05/transactional-evidence.test.ts`
- Modify: `tests/helpers/factories.ts` only for explicit P-05 actor/target fixtures

- [ ] **Step 1: Define operation fixtures.**

Create one valid fixture per operation with explicit state, version, owner/assignee, evidence, permission grants, and expected action. Use the same actor table across all operations.

- [ ] **Step 2: Add table-driven allow/deny cases.**

For every operation assert Employee deny, Supervisor allow, Manager/QCM allow, Admin-only deny, yazeed/SYSTEM_OWNER allow, and Admin+Manager allow through Manager authority only. Repeat the negative dimensions for every operation: inactive, missing permission, missing generic permission where applicable, out-of-scope, wrong state, stale, missing evidence, missing reason, failed reauth, invalid signature, SoD, replay, and changed fingerprint.

- [ ] **Step 3: Add PostgreSQL transaction tests.**

Run two concurrent commands against the same target and assert one winner, one stale/duplicate result, one state transition, one version increment, one snapshot, one signature, one audit row, one outbox row, and one idempotency result.

- [ ] **Step 4: Add failure rollback tests.**

Inject repository failures at signature, audit, and outbox persistence. Assert that the controlled record, version, snapshot, signature, audit, outbox, and idempotency rows remain unchanged after rollback.

- [ ] **Step 5: Run the P-05 integration suite.**

```bash
pnpm exec vitest run tests/integration/p05 --reporter=verbose
```

Expected: all assertions PASS on PostgreSQL 18; if no database runtime exists, setup must fail/skip according to the repository's existing explicit gate and the result must be reported as unverified.

## Task 9: Add authenticated browser evidence

**Files:**
- Create: `tests/e2e/p05-authority-matrix.spec.ts`
- Reuse the existing fixture contract in `playwright.config.ts`; do not change Playwright configuration.
- Modify: relevant detail/review pages only to show server-derived capability and safe disabled reasons

- [ ] **Step 1: Add fixture-gated positive journeys.**

Use disposable `QC_E2E_*` identities and IDs. Cover one authorized journey for each operation, including the visible ceremony and final authoritative state.

- [ ] **Step 2: Add negative journeys.**

Cover Admin-only, Employee, wrong scope, stale version, and forged direct Action/API calls. Assert no transition and no sensitive error details.

- [ ] **Step 3: Add responsive/keyboard ceremony checks.**

Verify visible focus, keyboard completion, reason/reauth/signature labels, disabled processing state, and no duplicate submissions. Respect reduced motion.

- [ ] **Step 4: Run the gated suite.**

```bash
pnpm exec playwright test tests/e2e/p05-authority-matrix.spec.ts
```

Expected: PASS with approved fixtures; otherwise explicit fixture-gated skips, never fabricated credentials or production mutations.

## Task 10: Full verification and documentation alignment

**Files:**
- Modify: `Documents/PERMISSION-MATRIX.md`
- Modify: `Documents/STATE-MACHINES.md` only for implemented transitions/evidence
- Modify: `Documents/BUSINESS-RULES.md` only to record the final P-05 authority decision without inventing scientific policy
- Modify: `audit/2026-09-09-production-ui-audit.md`
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] **Step 1: Run the full local gates on Node 24.20.0.**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:architecture
pnpm test:unit
pnpm test:integration -- tests/integration/p05
pnpm build
git diff --check
```

- [ ] **Step 2: Run PostgreSQL and concurrency gates.**

```bash
pnpm test:migrations
pnpm test:concurrency
```

Record actual PASS/FAIL/blocked results. Do not convert skipped or unavailable container evidence into PASS.

- [ ] **Step 3: Run the focused browser gate.**

```bash
pnpm exec playwright test tests/e2e/p05-authority-matrix.spec.ts
```

- [ ] **Step 4: Align controlled documents.**

Document the exact final authority mapping: Supervisor, Manager/QCM, and yazeed/SYSTEM_OWNER. Document Admin-only denial and the fact that QCM is not a separate role. List only transitions actually supported by the current state machines.

- [ ] **Step 5: Update the live mind.**

Record changed files, exact test results, environment limitations, whether PostgreSQL/E2E actually ran, and the final outcome. Keep the status partial if any required P-05 operation or required evidence is not verified.

## Completion gates

- [ ] All six P-05 operations have explicit server-side authority, permission, state, scope, version, evidence, SoD, and ceremony behavior.
- [ ] Admin-only is denied for every operation; Admin+Manager succeeds only through Manager authority.
- [ ] Retest and controlled VOID never invent scientific or operational policy values.
- [ ] Controlled history is preserved and no operation hard-deletes a controlled record.
- [ ] Every critical mutation is atomic and replay-safe.
- [ ] Table-driven negative coverage exists for every operation and actor class.
- [ ] PostgreSQL concurrency/rollback evidence and authenticated Playwright evidence are either PASS or explicitly documented as unverified.
- [ ] `pnpm typecheck`, lint, architecture, unit, relevant integration, build, and `git diff --check` results are recorded truthfully.
- [ ] No commit, push, deploy, or production mutation is performed by the agent.

# CA-F-00 — actual wiring, persistence and audit gates

2026-10-17 · **PARTIAL** implementation; three independent source gates **BLOCKED**.

## Prerequisites

- CA-01 is recorded DONE in the current Mind and has `audit/CA-01/` source/register artifacts. No new design-source fetch was needed for these domain-only repairs.
- CA-03 is recorded PARTIAL, not blanket accepted: documented state contracts exist; full transitions/browser/AT acceptance does not. CA-F-00 cannot upgrade that status.
- Sidebar, all UI files, native POST baseline, English/LTR, CAPA A, actions' transport, signatures and version APIs remain unchanged. There are still **no enabled operational forms** on these three creation pages. That is a blocker, not form completion.

## NCR — separate gate

`quality/ncr/new.astro` → decision card only; no POST write handler.
`src/actions/ncr.ts:create` → JSON findingId UUID parser → unconditional FORBIDDEN.
`ncrReadDependencies` registers reads only, no create provider.

Direct `CreateNcrUseCase.execute` previously authorized on `Boolean(findingId)` then constructed/wrote a draft. It now retains permission/scope checks and **refuses POLICY_SOURCE_REQUIRED before UUID/time/repository mutation**. Named owner/grants do not bypass source evidence.

`PostgresNcrRepository.create` previously inserted only `ncrs` with no audit/replay/linked-source lock. It now independently refuses POLICY_SOURCE_REQUIRED before database access. This prevents a direct adapter caller restoring the hidden unaudited path. Reads and transitions unchanged.

**Not implemented:** approved Finding eligibility/source state, number allocation, owner assignment, locked source/version recheck, transaction+audit+idempotency and native form submission. Source approval alone does not switch any of these on; adapter and use case must be implemented and tested together.

## CAPA — separate gate

`quality/capa/new.astro` → decision card only.
`src/actions/capa.ts:create` → JSON ncrId UUID parser → unconditional FORBIDDEN.
`capaActionDependencies` wires **close only**, not create; read dependencies are separate.

Direct CreateCapa previously checked only a nonempty NCR ID and accepted caller requirement booleans/actions. Now it refuses POLICY_SOURCE_REQUIRED after authorization, before construction/write.

PostgresCapaRepository.create previously inserted **only header**, discarded supplied `actions[]`, returned an aggregate with no children, and omitted audit/idempotency. Now independently refuses before database access. Domain shape validation mirrors existing nonblank action descriptions, integer/unique sequence and boolean storage types; it does not choose verification/effectiveness applicability.

P-04 `close`, snapshots, idempotency and e-signatures **not modified**. Closure is not creation authority; current owner-signature deferral does not silently replace the existing CAPA close use case.

**Not implemented:** approved NCR/RCA eligibility, action assignment/state/deadline rules, server requirement policy, server child binding, atomic header+children+audit+replay and native POST. No schema changes.

## Retest — traced dependency gate, not just fallback text

`laboratory.createRetest` JSON action calls `laboratoryActionDependencies().retest.execute`.
`laboratoryActionDependencies` constructs PostgresLabRepository with Postgres audit/outbox, PostgresControlledLabSources, and `new CreateRetestUseCase(repository, sources)` with **no third-argument policy override**.

Actual order: readable original → nonblank reason → P-05 → two permissions/scope/state → default policy throws POLICY_SOURCE_REQUIRED → **no resolve/create**. A test invokes the actual dependency factory, substitutes only its readable-original adapter result, uses an authorized actor, and verifies this exact policy rejection and zero downstream resolve/write. Synthetic data is not approved QC policy.

With an explicitly injected **test-only** policy, the use case validates output/context, creates a new DRAFT, clears *all* execution/result collections, and passes reason with CREATE_RETEST. Previously spreading original carried runs/readings/sample results/derivedResult into the new test. Populated unit evidence proves originals unchanged and no call to save(original).

Persistence source trace if a future approved provider is introduced:
`PostgresLabRepository.create` → persist(undefined,next,mutation) → transaction → lab_tests → lab_document_usage → reconcile run content → lab_test_snapshots → snapshot pointer → audit append → outbox enqueue. Production dependency supplies transaction-bound PostgreSQL audit/outbox. Create is not currently idempotent, does not lock/recheck original or allocate unique retest sequence under lock, and has no client expectedVersion; these are **separate unresolved implementation gates**, not covered by the default source denial or new units. Direct low-level LabRepository create remains a trusted internal capability, not an approved retest entry point.

## Explicit owner questions (no fabricated approvals)

| Question | Required authority/source | Owner evidenced / unresolved |
|---|---|---|
| PD-15: Which Finding states, severity/evidence, source types and conditions permit NCR initiation? Is more than one NCR per Finding permitted? Which revision becomes effective when? | Approved effective initiation procedure with clause/revision and source identity | Quality owner (Q3 §2) |
| PD-16: What exactly follows an inspection FAIL: NCR creation, HOLD, escalation, or a separate decision? Who acts and under what evidence? | Approved QC/inspection consequence procedure | QC / inspection procedure owner (Q3 §2) |
| What is the NCR number format, allocator/reset scope, uniqueness and correction/reuse rule? Who owns it? | Controlled numbering procedure; explicit accountable owner designation | **Owner not designated in available source**; request designation from Quality owner/Document Control, not an inferred authority |
| Which users may own NCR/CAPA/actions, who may assign them, and what active state/scope/SoD conditions apply? Are unassigned drafts allowed? | Approved assignment procedure and owning identity capability | **Assignment policy owner not designated**; Quality owner must identify accountable authority |
| What NCR and/or approved RCA state/evidence permits CAPA creation? Is RCA mandatory? What relationship should be persisted when entered from RCA? | Approved Quality initiation/relationship procedure | Quality-policy owner must resolve/designate; Q3 does not supply eligibility rules |
| What is CAPA numbering allocation/format/reset/reuse? | Approved controlled numbering procedure | **Numbering owner not designated**; obtain designation |
| PD-18: Who determines verificationRequired and effectivenessRequired, for which CAPA classes, using which persisted evidence and criteria? May either be false? | Effective PD-18 decision and verification/effectiveness procedure | Quality-policy owner (Q3 §2) |
| Which initial action states, sequence allocation, owners, target/due dates and completion/verification evidence are permitted/required? | Approved action-plan procedure, no invented deadlines | **Detailed action-plan authority absent**; Quality-policy owner to designate |
| Which original test states/results permit Retest; who authorizes it and what source records the decision? Are signatures required for that decision independently of test approval? | Effective laboratory retest SOP/WI and action-specific authority/ceremony map | Laboratory policy owner; scientific/method owner + Document Control for source (L5) |
| What maximum/count/sequence allocation applies across all retests, and are retests of retests prohibited/redirected to original? | Same approved retest policy; no +1 fallback inference | Laboratory policy owner |
| Which approved template version must the retest use, and what happens to original result, existing signatures, disposition and reporting? How is the new number allocated? | Effective retest/source-selection/numbering procedure | Laboratory policy owner; number allocator owner still needs designation |

PD-17 concerns NCR closure, not a silent extra condition for draft creation. Keep its decision separate. Generic SYSTEM_OWNER approval of this implementation cannot supply missing scientific/operational policy values.

## Acceptance remaining before opening any form

Per form independently: approved effective source/identity → trusted eligibility+assignment reads → locked/versioned source recheck → source-derived numbering and policy values → transactionally complete aggregate+audit+command replay → native POST with per-form command key, retained field errors and 303 only after committed valid ID → populated positive/negative/stale/replay/rollback/cross-scope tests → same-candidate browser/no-JS/AT evidence. No unchecked box or client-supplied PASS/source-valid assertion may replace a gate.

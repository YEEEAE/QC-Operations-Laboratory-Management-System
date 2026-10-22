# CA-F-02 — CAPA creation and action plan

Date: 2026-10-17. Candidate: `a8e289f71534f48ddc9c8486bf7bcb1b9fa9751b`.
Execution state: **BLOCKED**. No product code changed. This is not form acceptance.

## Prerequisite finding

CA-F-00 remains PARTIAL and its CAPA source gate remains BLOCKED. See
`audit/CA-F-00/field-contracts.md` (CAPA header and every action field) and
`audit/CA-F-00/wiring-and-gates.md` (CAPA gate and explicit owner questions).
CA-F-01 resolves NCR initiation only; it does not authorize CAPA initiation.
CA-03 remains PARTIAL. No approved CAPA source decision was supplied by this request.

## Observed states and guards

| Layer / state | Actual guard source | Disposition |
|---|---|---|
| Action create / denied | `src/actions/capa.ts`: UUID parser then unconditional FORBIDDEN, approved source/RCA message | Preserved; message is not evidence that RCA is mandatory |
| Application create / policy blocked | `src/modules/quality/capa/application/create-capa.ts`: authorization then `assertCreationSource()` throws POLICY_SOURCE_REQUIRED | Nonempty NCR is insufficient; named owner does not bypass gate |
| Storage create / policy blocked | `src/modules/quality/capa/infrastructure/postgres-repository.ts`: unconditional POLICY_SOURCE_REQUIRED before DB access | No header-only fallback |
| Header DRAFT, version 1 | `src/modules/quality/capa/domain/capa.ts:createCapa` | Structural constructor only; not permission to save |
| Action initial state / unresolved | Same domain: `CapaAction.state: string` | No inferred OPEN/PENDING/COMPLETED |
| Action owner / unresolved | Same domain: required `ownerId: string`; CA-F-00 assignment question unresolved | Do not assign actor or invent a responsible person |
| Verification/effectiveness / unresolved | Required booleans in domain; CA-F-00 PD-18 unresolved | Neither false nor true supplies authority |
| Dependency wiring | `src/modules/quality/capa/application/dependencies.ts` | Mutation factory wires close only, no create |

`ports/repository.ts` accepts a complete aggregate for create, but supplies no
creation-source/assignment policy or durable intent contract. Readable NCRs are
not necessarily eligible NCRs. The current create command has `ncrId`, not `rcaId`.
No separate RCA selector or invented relationship was added.

## Required authority before implementation

1. Reconcile the action's approved-source/RCA wording with the NCR-only command
   in CA-F-00 using a specific approved source: eligible NCR states/evidence,
   mandatory or optional RCA, persisted relationship and source concurrency rules.
2. Resolve PD-18: server decision source for both requirement flags.
3. Specify CAPA numbering, header/action assignment eligibility, initial action
   state, sequence allocation, target/due-date input rules. SQL types and test
   fixtures are not authority for these choices.

Until resolved, an operational multirow form would require fabricated required
values. No disabled imitation form, fake eligible selector, hidden write,
synthetic successful save or speculative API/schema was introduced.

## Verification on this candidate

| Command / acceptance | Result | Scope |
|---|---|---|
| `/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run tests/unit/quality/creation-source-gates.test.ts` | PASS: 17/17 | Existing mixed NCR/CAPA structural and denial tests; not 17 CAPA workflow cases. Subsequent version check returned v26.0.0 despite directory name: outside the >=24.20.0 <25 contract; supported-runtime acceptance NOT RUN |
| CAPA source denial including flags true/false and direct adapter | PASS within suite | Mocks/proxy; no real source eligibility or PG transaction proof |
| Multirow persistence/readback, identity replay, duplicate submit, mid-plan rollback | BLOCKED | No authorized creation policy or implementation |
| PG acceptance / JS and no-JS creation E2E / 303 after commit | BLOCKED | No enabled create workflow; no database connection attempted |
| Build/typecheck/browser screenshots/AT | NOT RUN | Documentation-only change; no new visual candidate |

No close/P-04, Sidebar, signature, scientific evaluation, schema or API changes.
No commit/push/merge/deploy or production write connection. PASS ≠ RELEASED;
APPROVED ≠ EFFECTIVE. Remaining implementation and all positive form acceptance
are explicitly outstanding, not DONE.

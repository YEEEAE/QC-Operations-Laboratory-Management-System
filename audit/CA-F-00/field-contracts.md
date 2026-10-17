# CA-F-00 — field contracts and decision matrix

2026-10-17 · base `450d1fbec493d14566f585c0dc4c67cff96d6e78` + local changes.
Overall **PARTIAL**; all three operational creation gates **BLOCKED**.
This is an observed implementation contract, not a new approved QMS policy.

## Source register

- Q3: `Documents/QC_System_WI_SOP_Pack/SOPs/approved/SOP-FRS-003-D0.1-Quality-Pages.docx`, read from its complete document XML. Approved by yazeed 2026-10-09; effective date NOT ASSIGNED. §§2, 4.3–4.4, 4.7 and 5 stop unresolved initiation and hidden CAPA writes; PD-15/16/17/18 owners explicit.
- L5: same directory, `SOP-FRS-005-D0.1-Laboratory-Tests.docx`, complete document XML read. Approved file, effective date NOT ASSIGNED. §§1, 4.14, 6 do not define retest rules; preserve original evidence.
- N: `src/modules/quality/ncr/{domain/ncr.ts,application/create-ncr.ts,ports/repository.ts}`.
- C: `src/modules/quality/capa/{domain/capa.ts,application/create-capa.ts,ports/repository.ts}`.
- R: `src/modules/laboratory/{application/create-retest.ts,domain/retest.ts,domain/lab-test.ts,ports/controlled-sources.ts}`.
- DB7: `db/migrations/0007_quality.sql`; DB9: `db/migrations/0009_laboratory.sql`. Column presence/type is not business-rule authority.
- A: `src/shared/authorization/{authorize.ts,policy-registry.ts,types.ts}` and `p05-authority.ts`.
- Missing historical `Documents/*.md` specifications are not treated as approved sources. Routing maps are under `README-system-detailed/`, not at root.

Required below means current code/schema requiredness, **not** a newly approved user form. Client checks for all three forms are **NOT IMPLEMENTED**: the routes render honest decision cards, not disabled forms or a successful save. No client checkbox can resolve a server policy flag.

## NCR

| Field | Type / required | Source / decision | Server / client behavior | Error / disposition |
|---|---|---|---|---|
| `findingId` | string UUID relation / yes in N; nullable DB7 | Q3 PD-15; PD-16 for inspection FAIL; eligibility absent | Currently nonempty relationship is checked, but no existence/state/scope/duplicate eligibility reader; do not enable selector/save | missing relation `AUTHZ_DENIED`; policy otherwise `POLICY_SOURCE_REQUIRED` |
| `ncrNo` | string / yes DB7 | UNIQUE + NOT NULL, no approved allocation/format/reset rule | Server policy must allocate/validate; never infer a format from fixtures | blocked |
| `title` | string / yes | N + DB7 nonblank CHECK | Server domain rejects whitespace; future client required feedback mirrors only this | `VALIDATION_FAILED` |
| `description` | string / yes | N + DB7 nonblank CHECK | Same; no invented max length | `VALIDATION_FAILED` |
| `affectedItemCode` | optional string | DB7 context column only | No approved authoritative lookup/derivation rule found; leave absent, do not infer item eligibility | write blocked |
| `affectedLot` | optional string | DB7 context column only | Same; relationship consistency unresolved | write blocked |
| `ownerId` | optional UUID user relation | DB7 FK; assignment authority absent | Current fallback scope is actor; not proof another user is assignable. Need owning identity capability and source | write blocked |
| `id`, `createdBy`, timestamps | UUID / actor ID / Date; required | N uuidv7 + server actor + clock | Server-derived, never editable | writes blocked before allocation |
| `state`, `version`, opened/closed times | DRAFT / bigint 1 / optional Date | N | Server-only; creation is not opening/closure | no browser authority |
| `requestId` | string; required application metadata | Existing request context, not durable command replay | Not a per-form idempotency implementation | replay/atomicity NOT IMPLEMENTED |

## CAPA header

| Field | Type / required | Source / decision | Server / client behavior | Error / disposition |
|---|---|---|---|---|
| `ncrId` | UUID relation / yes C; nullable DB7 | Q3; approved eligible NCR/RCA criteria absent | Nonempty ID is not source validation. Current model has no `rcaId`; do not fabricate a column or silently substitute one | missing `AUTHZ_DENIED`; policy `POLICY_SOURCE_REQUIRED` |
| `capaNo` | string / yes | DB7 unique NOT NULL only | Allocation/format authority missing; no fixture-derived numbering | blocked |
| `title`, `description` | string / yes each | C + DB7 nonblank CHECK | Server validates nonblank; future client mirrors | `VALIDATION_FAILED` |
| `ownerId` | optional UUID | DB7 FK; assignment authority absent | Must verify active/assignable actor and scope via owning capability once policy exists | blocked |
| `targetDate` | optional date string | DB7 DATE only; no approved deadline/default | No invented duration, calendar or escalation; current input has no complete date validator | blocked / validation incomplete |
| `verificationRequired` | boolean / yes | DB7 boolean NOT NULL; decision source missing | Runtime type checked in domain; value must eventually come from approved server policy, not checkbox | type `VALIDATION_FAILED`; source blocked |
| `effectivenessRequired` | boolean / yes | Q3 PD-18 unresolved | Same. Both true and false refuse the source gate | type `VALIDATION_FAILED`; source blocked |
| `actions` | readonly action array / ≥1 C | C structural minimum; action-plan policy missing | Server domain rejects empty array; no science inferred | `VALIDATION_FAILED` |
| `id`, creator, created/updated time | UUID, actor ID, Date / yes | C server-derived | No client control | blocked |
| state/version/closedAt | DRAFT / bigint 1 / absent | C | P-04 closure and signature ceremony unchanged; not creation authority | no bypass |
| `requestId` | metadata string / yes | request context only | Durable create replay and atomic child/audit write absent | blocked |

## Every CAPA action field

| Field | Type / required | Source | Server / client / unresolved decision | Error |
|---|---|---|---|---|
| `id` | UUID / yes | C + DB7 PK | Must be generated server-side once enabled; not a user field | gate blocked |
| `capaId` | UUID / yes | DB7 FK | Server must bind newly created header ID; current command accepts prebuilt children; not solved by current constructor | gate blocked |
| `sequenceNo` | integer / yes, unique per CAPA | DB7 INTEGER + composite UNIQUE | Domain now rejects fractional/duplicate numbers. Positive range/order allocation **not** inferred | `VALIDATION_FAILED` for implemented checks |
| `description` | string / yes | DB7 nonblank CHECK | Domain now rejects whitespace | `VALIDATION_FAILED` |
| `ownerId` | UUID / yes | DB7 FK | Assignment eligibility missing; server-derived selector needed | gate blocked |
| `dueAt` | optional Date | DB7 timestamp | No approved deadline/default/overdue consequence; no complete input validator yet | gate blocked |
| `state` | string / yes | DB7 TEXT NOT NULL, no approved create-state mapping | Do not invent OPEN/PENDING/COMPLETED as creation default | gate blocked |
| `completedAt`, `completedBy` | optional Date / UUID | DB7 | Later recorded facts, not creation checkbox claims | gate blocked |
| `verificationState` | optional string | DB7 | No approved vocabulary/evidence source established | gate blocked |
| `version` | bigint / positive | DB7 | Server-controlled; should begin from source contract when write is implemented | gate blocked |

## Retest

| Field | Type / required | Source / decision | Server / client behavior | Error / disposition |
|---|---|---|---|---|
| `originalId` | UUID / yes action schema | R + existing repository readable original | Actual server get before policy; absent/unreadable yields same not-found | `RESOURCE_NOT_FOUND` |
| `reason` | trimmed nonempty string / yes | R + L5 preserve lineage | Server validates; reason now accompanies CREATE_RETEST audit mutation as well as record | `VALIDATION_FAILED` |
| authority | server ActorContext / yes | A P-05 + both retest permissions | Supervisor/Manager/named owner is necessary, not sufficient; no browser role/authority assertion | `AUTHZ_DENIED`, `AUTHZ_PERMISSION_MISSING`, `AUTHZ_SCOPE_DENIED` |
| original state | persisted enum / yes | A currently allows DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED | This registry allowance is not a source-approved operational retest rule; policy must narrow it | unresolved policy |
| `sequence` | positive safe integer / yes policy output | R `RetestPolicy.authorize` | Type/shape checked; count/allocation/maximum remains policy-dependent, never `original+1` fallback | `VALIDATION_FAILED` or default `POLICY_SOURCE_REQUIRED` |
| `labTestNo` | nonblank string / yes policy output | R; controlled number source absent | Validate shape only; no generated suffix rule | same |
| `templateVersionId` | nonblank string / yes policy output | R + ControlledLabSources | Resolve on server, assertContext, require returned ID matches requested version | `VALIDATION_FAILED`; source denial `AUTHZ_DENIED` |
| frozen context | ControlledContext / yes | R + approved template/doc sources | `assertContext` validates existing contract; no units/method/limit invention | `AUTHZ_DENIED` / `VALIDATION_FAILED` |
| new ID/actor/timestamps/version/state | UUID/server actor/ISO/1n/DRAFT | R | Server-derived | no client controls |
| originalTestId/retestSequence/retestReason | link/number/reason | R assertRetestLink | No self-link, missing reason, nonpositive sequence or retest-of-retest | `VALIDATION_FAILED` |
| scientificResult/derivedResult | null / null on new draft | R new-test semantics; L5 original evidence preserved | Now explicitly reset both; no copied scientific claim | no browser value |
| samples/measurements/batches/readings/sampleResults | empty arrays on new draft | R new independent test | Reset every collection, not only samples/measurements; original remains untouched | no copied IDs/results |
| submitted/review/approved/rejected times | null on draft | R | Server reset; signatures unchanged on original | no browser control |
| expected original version / command key | **absent** current Retest command | No implementation yet | Current authorization compares original.version to itself. This is NOT optimistic client intent protection. No durable idempotency record or original lock in retest create | implementation gap; do not claim stale/replay PASS |

Validation PASS establishes only shape/invariants. It does not establish authority, approval, effectivity, a real saved round-trip, UAT or release readiness.

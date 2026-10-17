# CA-F-00 — source gate and decision matrix for NCR / CAPA / Retest creation

Date: 2026-10-17 · HEAD: `e62f44745d5936d89747209673c3035a9986b6db` (working tree dirty)
Scope: whether an authorized write path exists for the three creation surfaces.
No policy, threshold, role, numbering rule or scientific criterion is invented here.

## Authority sources read

| Source | Status | What it decides |
|---|---|---|
| `SOP-FRS-003-D0.1-Quality-Pages.docx` (approved 2026-10-09) | **APPROVED; effective date NOT ASSIGNED** | §4.2–4.4: Finding→NCR initiation stops while PD-15/16 are pending. §4.7: the current page does not offer a general CAPA creation or action-edit form; "do not substitute a hidden operation or database update". PD-15/16/17/18 owners named. |
| `SOP-FRS-005-D0.1-Laboratory-Tests.docx` | APPROVED; effective date NOT ASSIGNED | Retest remains policy-bound; no count/sequence/template values supplied. |
| `src/modules/laboratory/ports/controlled-sources.ts` | Code contract | `RetestPolicy.authorize` must return `{sequence, labTestNo, templateVersionId}`. |
| `src/modules/laboratory/application/create-retest.ts` | Code | Default policy throws `POLICY_SOURCE_REQUIRED`; no fallback provider is wired. |
| `src/actions/ncr.ts`, `src/actions/capa.ts` | Code | Both create actions unconditionally throw `FORBIDDEN`. |
| `src/modules/quality/ncr/application/create-ncr.ts`, `.../capa/application/create-capa.ts` | Code | Use cases exist but only check `Boolean(findingId)` / `Boolean(ncrId)`. |
| `db/migrations/0007_quality.sql` | Code | `ncr_no`, `capa_no` are `TEXT NOT NULL` with UNIQUE constraints; no format or sequence generator. |

`APPROVED ≠ EFFECTIVE`: the SOPs are approved files but carry no assigned effective
date, so they are not asserted as operational acceptance. They are nevertheless the
only approved authority text available, and they prohibit enabling these writes.

## Gate verdicts

| Form | Gate | Verdict | Exact missing decision(s) | Owner |
|---|---|---|---|---|
| New NCR | NCR creation | **BLOCKED** | PD-15 Finding→NCR initiation criteria; PD-16 inspection FAIL consequence; NCR number format/sequence authority | Quality owner; QC / inspection procedure owner |
| New CAPA | CAPA creation + action plan | **BLOCKED** | PD-18 general effectiveness requirement and criteria; CAPA number format/sequence; action-plan owner/due-date authority | Quality-policy owner; QC owner |
| Retest | Retest creation | **BLOCKED** | `RetestPolicy` source: authority, count, sequence, `labTestNo`, template-version selection, original-result handling | Laboratory policy owner |

Consequence: the three routes render `DecisionStateCard` with the exact blocker. They
do not render a disabled form, do not call a hidden mutation, and do not write. This is
consistent with the existing approved SOP and with the prompt's rule that a governed
write stays blocked when its authority source is absent.

## Field / guard matrix — NCR

| Field / guard | Source type | Required | Approved source | Server / client | Rejection |
|---|---|---|---|---|---|
| `ncrNo` | controlled record number | yes | **NONE** (no format/sequence policy) | must be server-validated once a source exists | `POLICY_SOURCE_REQUIRED` (blocked before form) |
| `title` | user input | yes (DB check) | domain/DB | server + client UX | `VALIDATION_FAILED` |
| `description` | user input | yes (DB check) | domain/DB | server + client UX | `VALIDATION_FAILED` |
| `findingId` | relation to Finding | yes (domain) | **eligibility PD-15 pending** | server must re-read under lock | `AUTHZ_DENIED` (current domain) |
| Finding visibility/scope | authorization | yes | existing read policy | server | `AUTHZ_DENIED` / hidden |
| `affectedItemCode`, `affectedLot` | optional context | no | DB columns | server | — |
| `ownerId` | assignable user | optional | **assignment authority not defined** | server must verify assignability | `AUTHZ_DENIED` |
| `actor`, `id`, timestamps | server-derived | yes | `ActorContext`, uuidv7, clock | server only | never accepted from the browser |
| Idempotency | command contract | yes | project idempotency records exist; not wired for NCR create | server | `DUPLICATE_COMMAND` / replay |
| Audit + state + relation atomicity | integrity | yes | audit repository exists; NCR `create` currently inserts only the row | server transaction | rollback on failure |

`CreateNcrUseCase` currently checks only `Boolean(findingId)` and the repository
inserts `ncrs` without audit or idempotency. Enabling it would silently accept any
finding id and produce an unaudited record, which is outside the permitted scope.

## Field / guard matrix — CAPA

| Field / guard | Source type | Required | Approved source | Server / client | Rejection |
|---|---|---|---|---|---|
| `capaNo` | controlled record number | yes | **NONE** | server-validated once sourced | blocked |
| `ncrId` | relation to NCR | yes (domain) | **eligibility not defined beyond existence** | server must re-read | `AUTHZ_DENIED` |
| `title`, `description` | user input | yes | domain/DB | server + client | `VALIDATION_FAILED` |
| `ownerId` | assignable user | optional | **assignment authority not defined** | server | `AUTHZ_DENIED` |
| `targetDate` | user input | optional | **no approved target-date rule** | server | `VALIDATION_FAILED` if malformed |
| `verificationRequired` | policy flag | yes | **NONE (PD-18)** | server decision, not a user checkbox | blocked |
| `effectivenessRequired` | policy flag | yes | **NONE (PD-18)** | server decision, not a user checkbox | blocked |
| `actions[]` | action plan | yes (domain) | **owner/due-date/sequence authority absent** | server | `VALIDATION_FAILED` |
| Idempotency / audit / atomicity | integrity | yes | absent from CAPA `create` | server transaction | rollback |

A boolean checkbox cannot decide PD-18. The use case requires both flags and at least
one action row, so a form cannot be completed truthfully from current sources.

## Field / guard matrix — Retest

| Field / guard | Source type | Required | Approved source | Server / client | Rejection |
|---|---|---|---|---|---|
| original test | relation | yes | existing lab read | server | `RESOURCE_NOT_FOUND` |
| reason | user input | yes | domain | server + client | `VALIDATION_FAILED` |
| P-05 authority | actor authority | yes | `isP05Authority` + two permissions | server | `AUTHZ_DENIED` |
| count / sequence | policy | yes | **NONE** | server (`RetestPolicy`) | `POLICY_SOURCE_REQUIRED` |
| `labTestNo` | controlled number | yes | **NONE** | server | `POLICY_SOURCE_REQUIRED` |
| template version | controlled source | yes | **NONE** | server (`resolve`) | `POLICY_SOURCE_REQUIRED` |
| original-result handling | policy | yes | **NONE** | server | `POLICY_SOURCE_REQUIRED` |
| original immutability | invariant | yes | `assertRetestLink`, append-only create | server | rejection |

The default policy is deliberately fail-closed and no adapter is registered. There is
no safe way to choose a count, sequence, number or template in the UI.

## What is complete without authority

- Visual language for the three surfaces and all existing pages (CA-02).
- UI state contracts (CA-03) including the creation gate outcome.
- Deny-by-default negative contracts: action stubs, `POLICY_SOURCE_REQUIRED` retest
  policy, and the existing authorization/policy tests (all PASS in the focused run).
- Route/register inventory and the reference manifest (CA-01).

## What remains blocked

1. Any governed write for NCR, CAPA or Retest.
2. Record numbering and owner-assignment rules.
3. CAPA effectiveness/verification flags and action-plan policy.
4. Retest authority, count, sequence, template and original-result handling.
5. Idempotency + audit atomicity for NCR/CAPA create (implementation follow-up once a
   source exists; not invented now).

Owner action required: issue the specific decisions PD-15, PD-16, PD-18 and the retest
policy (with numbering and assignment authority), then CA-F-01/02/03 can be implemented
and CA-F-04 accepted per form.

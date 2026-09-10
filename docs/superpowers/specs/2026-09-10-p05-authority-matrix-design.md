# P-05 Controlled Approval Authorities — Design Specification

## Scope

Implement the final P-05 authority policy for these controlled operations:

- Inspection approval
- Laboratory approval
- Receiving/material release
- Laboratory retest authorization
- Controlled `VOID`
- Controlled-document approval

The authority for every listed operation is:

```text
Supervisor OR Manager (QCM) OR yazeed/SYSTEM_OWNER
```

`QCM` is the existing `Manager` role. It is not a new role or an additional
approval layer. `Admin` alone is never an approval authority and receives no
hierarchy bypass.

The implementation must preserve domain ownership, controlled history,
server-side authorization, fail-closed behavior for unspecified rules, and the
existing distinction between inspection result, laboratory result, receiving
workflow state, and release system state.

## Authoritative P-05 contract

An operation is allowed only when all applicable conditions pass:

- the actor is authenticated and the account is `ACTIVE`;
- the actor is `Supervisor`, `Manager`, or the named `yazeed/SYSTEM_OWNER`;
- the actor has the explicit operation permission;
- the actor has `PERM-APR-APPROVE` where the operation uses the generic approval
  case/decision path;
- the target is inside the actor's authorized scope;
- the target is in the operation's documented eligible state;
- the submitted expected version matches the current version;
- the required business evidence and controlled source context are present and
  valid;
- general SoD rules pass; the template-lifecycle exception does not apply to
  P-05;
- required reason, reauthentication, and E-Signature ceremony checks pass;
- the request has a request ID and is replay-safe.

The client supplies action intent, expected version, reason, and ceremony
inputs only. It cannot supply authoritative state, result, authority, scope,
snapshot, or approval outcome.

## Operation matrix

| Operation | Owning domain | Operation permission | Required state/evidence baseline |
|---|---|---|---|
| Inspection approval | Quarantine / Inspection | `PERM-INSP-APPROVE` | Existing inspection approval state machine, final result, valid inspection evidence and controlled context |
| Laboratory approval | Laboratory | `PERM-LAB-APPROVE` | Existing laboratory approval state machine, raw measurements, controlled source/content hash, and required lab evidence |
| Material release | Quarantine / Receiving | `PERM-QUAR-RELEASE` | `RELEASE_PENDING`, approved `PASS` inspection result, unreleased item, and existing release evidence; `PASS` does not imply release |
| Retest authorization | Laboratory | `PERM-LAB-AUTHORIZE-RETEST` and `PERM-LAB-RETEST` | Valid original test, approved retest reason/linkage/sequence rules, and any existing controlled-source requirements; no scientific limits or retest policy values are invented |
| Controlled `VOID` | Owning domain of target | Domain-specific `PERM-*-VOID` | Explicit `VOID` transition in the target state machine, mandatory reason, and preserved historical record; unknown transitions remain denied |
| Controlled-document approval | Documents | `PERM-DOC-APPROVE` | Eligible document revision, matching version, non-empty content hash, and existing document approval state machine |

The generic `PERM-APR-APPROVE` requirement is applied only where the
operation is represented by an approval case/work item. Domain-specific
operations remain responsible for their own permission and transition.

## Architecture

Use the existing hybrid architecture:

1. Keep each domain's use case responsible for its business evidence, state
   transition, controlled snapshot, and owning repository.
2. Reuse the Approvals/E-Signatures infrastructure for generic approval
   cases, assignment, SoD, reauthentication, signature meaning, idempotency,
   and decision orchestration where the domain is already represented there.
3. Add small domain-specific application paths for operations that do not yet
   have a complete use case, especially retest authorization and controlled
   `VOID`.
4. Keep Astro Actions thin. They resolve the authenticated actor and request
   context, validate input shape, and call application use cases only.
5. Do not create a cross-domain god-service or allow pages, Actions, reporting,
   or approvals to mutate another domain's tables directly.

The policy registry becomes the explicit source for the P-05 authority
combination. It must not grant approval authority merely because an actor has
the `Admin` role or a broad scope. `SYSTEM_OWNER` supplies the named yazeed
identity and permissions but does not bypass state, evidence, version, or SoD
checks.

## Authorization flow

Every P-05 mutation follows this order:

```text
Action/API
  → authenticated request context
  → active account
  → authority role/identity
  → explicit operation permission
  → generic approval permission when applicable
  → scope
  → eligible state
  → expected version
  → business evidence/source/hash
  → SoD
  → reauthentication
  → exact E-Signature meaning
  → owning-domain transition
  → atomic snapshot + record + signature + audit + outbox + idempotency
```

An unknown policy, state, evidence type, or transition returns a stable denial
and performs no write.

## Transaction boundary and controlled history

Each critical P-05 mutation must be committed as one PostgreSQL transaction.
The owning repository must:

- re-read and lock the target when required;
- verify the request replay record and expected version inside the transaction;
- capture the exact pre-transition snapshot and version;
- validate the domain transition and all required evidence;
- persist the E-Signature evidence without storing passwords;
- update the controlled record and increment its version;
- append immutable audit evidence with actor, action, state/version delta,
  reason, request ID, signature reference, and snapshot reference;
- enqueue the corresponding outbox event;
- persist the idempotent result.

Failure of signature persistence, audit, outbox, or the domain transition rolls
back the complete mutation. A repeated request with the same fingerprint
returns its stored result without repeating the transition. Reusing a request
ID with different input is denied as a duplicate-command conflict.

Controlled `VOID` never deletes the record or its evidence. It creates the
documented terminal/history-preserving state. Approved, signed, voided,
superseded, and closed records remain non-draft controlled history.

## E-Signature and SoD

Where the operation's controlled transition requires a signature, the ceremony
binds:

```text
meaning → reauthentication → reauthorization → state/version/SoD check →
evidence → controlled transition
```

The signature meaning must equal the exact operation (`APPROVE`, `RELEASE`,
`AUTHORIZE_RETEST`, `VOID`, or the documented domain action). The general
self-review/self-approval/self-release/self-sign rule remains active. The
template-only reviewer/approver exception is explicitly out of scope for
P-05.

If the controlled source does not currently define a required signature or
business evidence condition, the implementation must preserve the existing
fail-closed policy rather than invent a scientific or operational value. The
approved P-05 authority decision does not authorize inventing retest limits,
sampling, precision, rounding, release criteria, or retention rules.

## UI and delivery behavior

- Capabilities are derived server-side from the authenticated actor and the
  current target state/version.
- A P-05 action is not rendered as enabled unless the server-derived
  capability allows it.
- The UI presents target identity, current state, current version, evidence
  summary, required reason, reauthentication, and exact signature meaning.
- Submit controls disable during processing and block duplicate submissions.
- Stale version, wrong state, denied scope, missing evidence, failed
  reauthentication, invalid signature, SoD, and replay errors are safe and
  recoverable, without raw infrastructure details.
- No UI action claims that laboratory/inspection `PASS` automatically means
  released.

## Verification plan

Add a table-driven authorization suite for all six operations and these actor
fixtures:

- Employee — deny
- Supervisor — allow when every condition passes
- Manager/QCM — allow when every condition passes
- Admin-only — deny
- yazeed/SYSTEM_OWNER — allow when every condition passes
- Admin + Manager — allow only through the Manager authority, not Admin

For every operation, add negative cases for inactive account, missing
operation permission, missing generic approval permission where applicable,
out-of-scope target, wrong state, stale version, missing evidence, missing
reason, failed reauthentication, missing/invalid signature, SoD violation, and
replay/different-fingerprint reuse.

Add focused domain/application tests and PostgreSQL integration tests for:

- retest linkage, reason, sequence, state, evidence, and authorization;
- controlled `VOID` transitions and history preservation;
- one winner under concurrent mutation;
- exactly one snapshot/signature/audit/outbox/idempotency result;
- rollback when signature, audit, or outbox persistence fails;
- no mutation on unknown transition or unapproved evidence policy.

Add authenticated Playwright coverage for at least one positive and one
negative journey per operation, including direct forged action/API requests,
server-side denial, visible disabled reasons, and the signature ceremony.

## Non-goals

- No new `QCM` role; `QCM` remains the Manager role.
- No Admin approval bypass or role hierarchy inference.
- No automatic release from `PASS`.
- No new scientific limits, formulas, precision, rounding, sampling, retest
  count, calibration interval, or retention value.
- No destructive deletion of controlled records or history.
- No broad refactor unrelated to P-05.
- No commit, push, deploy, or production mutation.

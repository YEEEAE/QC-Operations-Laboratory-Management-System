# P-04 CAPA Closure — Design Specification

## Scope

Implement the approved P-04 exception for the CAPA `CLOSE` action only. The
implementation must not import the older, unapproved prerequisites that require
all CAPA actions to be complete or effectiveness acceptance to be true.

## Authoritative close contract

`CLOSE` is allowed only when all of the following are true:

- the authenticated actor has the `Supervisor` role;
- the actor has the explicit `PERM-CAPA-CLOSE` grant;
- the CAPA is inside the grant's authorized scope;
- the actor account is `ACTIVE`;
- the expected record version matches the current version;
- the CAPA is in an eligible non-terminal state;
- the closure reason is non-empty;
- reauthentication succeeds;
- an E-Signature is created with explicit `CLOSE` meaning;
- the request ID is present and replay-safe.

The close action does **not** require:

- all CAPA actions to be complete;
- `effectivenessVerified = true`;
- `effectivenessAccepted = true`;
- the CAPA to have passed `ACTIONS_COMPLETE`, `START_EFFECTIVENESS`, or
  `READY_FOR_CLOSURE` first.

`CLOSED` and `VOID` are terminal for this action and cannot be closed again.
Employee, Manager, Admin-only, and `yazeed` without Supervisor authority are
denied even if they possess the permission or broad system access.

## Architecture

Create a dedicated `CloseCapaUseCase` rather than extending the generic CAPA
transition use case. The use case will:

1. validate request shape and closure reason;
2. return the prior successful result for a valid duplicate request ID;
3. read the authorized CAPA and verify the current state/version;
4. enforce Supervisor role, explicit permission, active account, and scope;
5. run the E-Signature ceremony with reauthentication and meaning `CLOSE`;
6. call a repository close command that performs all required writes in one
   PostgreSQL transaction.

The generic transition path remains responsible for `ACTIONS_COMPLETE` and
effectiveness-review transitions, preserving their existing prerequisites.

## Transaction boundary

The repository close command will execute one transaction that re-reads and
locks the CAPA, captures the exact pre-transition record snapshot and version,
checks the request replay registry, updates the CAPA to `CLOSED` and increments
its version, persists signature evidence, writes immutable audit evidence, and
records the idempotent result. Any failure rolls back the complete close,
including signature and audit evidence.

The audit event will include the CAPA ID, `TR-CAPA-006`, `CLOSE`, old/new state,
old/new version, actor, reason, request ID, signature reference, and exact
pre-transition snapshot reference. No password is stored.

## UI ceremony

The CAPA detail page will show a close action only when the server-provided
capability allows it. The action opens an accessible blocking ceremony showing
the CAPA identity, current state, version, the fact that incomplete actions and
unaccepted effectiveness do not prevent this approved P-04 close, a required
closure reason, reauthentication field, and explicit signature meaning:

> I close CAPA `<CAPA number>`, version `<version>`.

The submit control is disabled while processing and duplicate submissions are
blocked. Stale, denied, missing-reason, failed-reauthentication, missing-
signature, and replay outcomes receive safe recoverable messages. A successful
close shows the authoritative CLOSED state and audit/timeline confirmation.

## Verification

Add focused domain/application tests plus repository/integration coverage where
the current test environment supports PostgreSQL. Required cases:

- Supervisor closes an eligible CAPA with incomplete actions and effectiveness
  verification false;
- Employee, Manager, Admin-only, and `yazeed` without Supervisor authority are
  denied;
- missing permission, wrong scope, inactive account, stale version, terminal
  state, missing reason, failed reauthentication, missing signature, and
  duplicate request are denied or safely replayed as specified;
- successful close increments the version and persists one snapshot, signature,
  and audit record atomically;
- `ACTIONS_COMPLETE` and effectiveness-review transitions still enforce their
  original prerequisites.

## Non-goals

- No changes to ACTIONS_COMPLETE or effectiveness-review business rules.
- No automatic completion of CAPA actions.
- No automatic effectiveness acceptance.
- No new scientific, sampling, retention, or approval policy values.
- No commit, push, deploy, or production mutation.

# Owner Decision — Owner-Controlled Internal Approval

- **Decision ID:** `OWNER-DECISION-2026-10-16-OWNER-CONTROLLED-APPROVAL`
- **Deciding authority:** System Owner — `yazeed` (role `SYSTEM_OWNER`)
- **Decision date:** 2026-10-16
- **Status:** In force (internal application governance)
- **Supersedes (internal-scope only):** the internal-approval and signature-ceremony
  requirements of `README-system-detailed/Approval-Electronic-Signature-Release-Policy.md`
  §6 and §9 criterion 6, **for the owner pathway only**.
- **Does NOT supersede:** applicable law, mandatory regulatory requirements,
  scientific acceptance criteria, data-integrity safeguards, or external
  QMS/product-release obligations.

## 1. Decision

For the current release, internal governed approval is completed by the
authenticated, active System Owner account `yazeed` (role `SYSTEM_OWNER`) through
a direct, auditable decision:

```
DRAFT → READY_FOR_OWNER_REVIEW → OWNER_APPROVED
VALIDATED → OWNER_APPROVED → INTERNAL_RELEASED
```

No Supervisor, QCM, Manager or Factory Director approval is required as a
prerequisite to this internal owner pathway, and **no intermediary approval is
ever fabricated**.

## 2. Deferred capabilities (register)

| # | Deferred capability | Current status | Re-enable mechanism |
|---|---|---|---|
| D-1 | Electronic signature ceremony (password re-entry + signature meaning) on the owner pathway | Deferred — owner decisions record `signature_deferred = TRUE` and create **no** `electronic_signatures` row | `OWNER_APPROVAL_DEFERRAL.active = false` in `src/modules/approvals/application/owner-approval-policy.ts` + signature-policy decision + tests |
| D-2 | Handwritten/drawn signature capture and signature-image upload for internal approval | Not implemented for internal approval; must not be introduced as a substitute | Future design phase |
| D-3 | Mandatory internal multi-person approval hierarchy as a prerequisite | Deferred for the owner pathway; standard (non-owner) paths unchanged | Future configurable approval/signature model |
| D-4 | Dedicated per-domain signature ceremonies (inspection stage-1/final, laboratory stage-1/final, CAPA close, template lifecycle, release approval, UAT acceptance, document effectivity) | **NOT yet reconciled** — these live in per-domain use cases outside the generic approval pipeline and still enforce their own ceremony | Follow-up workstream (see §6) |

D-4 is recorded as an **open, accepted deferral request** with an implementation
gap, not as a completed change.

## 3. What the decision explicitly does NOT change

Owner approval may bypass internal administrative approval hierarchy only. It does
not bypass, and the implementation continues to enforce:

- server-side authentication and canonical identity resolution;
- record-level scope checks and separation of duties;
- state and eligibility validation;
- approved scientific acceptance limits and scientific PASS/FAIL;
- HOLD and quarantine restrictions;
- data-completeness validation;
- version and concurrency checks (`CONFLICT_STALE_VERSION`);
- append-only/immutable historical records;
- evidence provenance;
- audit logging in the same transaction;
- transaction integrity and idempotency;
- applicable external release requirements.

The distinction between the following is preserved and must never be collapsed:

```
Scientific PASS / FAIL
Internal Owner Approval
Internal Material Release
Official QMS Approval
Physical Product Release
Software Deployment Release
```

An `INTERNAL_RELEASED` record is **not** authorization to move physical product.

## 4. Implementation (this change)

| Layer | File | Change |
|---|---|---|
| Policy | `src/modules/approvals/application/owner-approval-policy.ts` | Single declaration of the owner pathway, deferral register, owner decision metadata, audit-safe authorization context |
| Registry | `src/modules/approvals/application/signature-policy-registry.ts` | Owner pathway resolves to `NOT_REQUIRED` (deferred); standard path rules unchanged |
| Use case | `src/modules/approvals/application/decide-approval.ts` | Passes actor to the policy; records previous/resulting state, owner metadata, evidence refs; no signer call on the owner path |
| Capabilities | `src/modules/approvals/application/decision-capabilities.ts` | Surfaces `signatureDeferred` + `authority` |
| Authorization | `src/modules/approvals/application/authorization.ts` | Named owner may review/decide any actionable record (assignment bypass only) |
| Queue | `src/modules/approvals/application/list-my-approvals.ts` + `infrastructure/postgres-repository.ts` | Owner lists all actionable records |
| Schema | `db/migrations/0049_owner_approval_authority.sql` | Non-destructive columns + constraints on `qc.approval_decisions`, idempotency index, FK to the audit event |
| Audit | `src/shared/audit/postgres-audit-repository.ts` | `appendReturningId` (additive) so the decision links its real audit event |
| UI | `src/pages/approvals/index.astro`, `src/pages/approvals/[approvalId].astro` | Owner Approval Command Center surfaces + `Approve as System Owner` control; route and global navigation unchanged |

## 5. Evidence

- `pnpm typecheck` (`astro check`): **0 errors**.
- Unit tests for the owner authority: `tests/unit/approvals/owner-approval-authority.test.ts`
  (6 tests) and `tests/unit/approvals/signature-policy-registry.test.ts` (7 tests) — **PASS**.
- Full unit suite: **1441 passed / 25 failed (1466)** — the 25 failures are the
  pre-existing `Documents/*.md` documentation gaps recorded in the Project Mind,
  not regressions from this change.
- Migration `0049` is **NOT applied** to any database in this change.

## 6. Remaining work before this governance model is complete

1. Reconcile the dedicated per-domain ceremonies (D-4) so the owner's direct
   decision is not blocked by `DOMAIN_SIGNATURE_REQUIRED` originating inside a
   domain use case (`approve-inspection`, `approve-lab-test`, `close-capa`,
   template lifecycle, release approval, UAT acceptance).
2. `DOCUMENT_VERSION` approval currently always throws `POLICY_SOURCE_REQUIRED`
   in `ApproveVersionUseCase` — a pre-existing blocker that prevents any owner
   approval of controlled document versions until it is resolved.
3. Complete the Approvals Center sections (blocked-with-reason, internally
   approved, returned, internal release requests, decision history, linked
   evidence).
4. Apply and verify migration `0049`; run integration/concurrency/security/E2E
   against a real PostgreSQL instance.

## 7. Truthfulness statement

This decision records the owner's acceptance of the deferral. It is **evidence of
the owner's decision, not evidence that an unperformed test passed**. No
production-readiness claim, no UAT result and no regulatory compliance claim is
made by this document.

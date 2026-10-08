# Global electronic-signature policy reconciliation — QC-LAUNCH-002

**Input:** user-supplied “GLOBAL ELECTRONIC SIGNATURE & APPROVAL POLICY” received 2026-10-09.  
**SHA-256:** `f9d92c4973524578b98fdfc78c0957228ce4293800ae0accee7ffe41ee3fcc08`  
**Document control:** no revision or effective date is stated. The owner labels it an approved functional requirement; no controlled QMS approval record or system e-signature accompanies it. Treat it as the latest functional direction, not an effective controlled policy.

## Reconciled decisions

1. The new user direction supersedes the earlier request for a *silent* yazeed bypass of signature and audit requirements. For controlled approval actions, it calls for explicit owner override, reason, and recorded audit evidence. This supersession is based on the later user-supplied policy. It does not establish QMS effectivity or a production permission grant.
2. The policy requires e-signature intent, reauthentication, action and version binding, prerequisite checks, atomic decision/signature/audit, concurrency and replay protection, and visible approval details. Do not treat a report marker as signature evidence.
3. The policy does not define an exception that lets yazeed bypass scientific source authority. Its generic prerequisite and controlled-override language does not identify which scientific rules may be overridden, by whom, under which conditions, or what disposition results. Scientific-source controls remain fail-closed.
4. QC employee, Supervisor, QCM, yazeed, and technical Admin boundaries are supplied as functional requirements. They do not amend controlled role/permission sources or prove current implementation.
5. Per-action applicability remains unresolved: many listed events are qualified by “where required” or “when governed”. The policy lacks a complete action × subject × state × signer × permission × meaning × policy revision/effectivity map, named accountable approvers, and controlled revision/effective date.

## Implementation crosswalk

| Policy requirement | Current source evidence | Gap / disposition |
|---|---|---|
| Shared approval/signature service and ceremony | `src/modules/e-signatures/application/sign-controlled-action.ts`, `final-approval-ceremony.ts`, `reauthentication-verifier.ts`; shared `ESignatureDialog.astro` | Building blocks exist; adoption is distributed across modules. Central policy-driven coverage is not verified. |
| Server-side permission, action, state/version and prerequisite checks | Existing module flows and `src/modules/approvals/application/dependencies.ts` | Generic approval signature policy remains `UNRESOLVED`; do not enable unmapped approvals. |
| Atomic decision + signature + audit/effects; replay/concurrency defenses | PostgreSQL repository and module-specific transaction paths | Must verify per workflow; existing handlers may already sign internally, so avoid double-signing by layering a generic wrapper without refactoring. |
| Policy reference and version persisted with signature | `SignatureEvidence` and migration `0012_approvals_esignatures.sql` reviewed | No policy reference/version field identified; schema/API change and migration needed after policy registry is authoritative. |
| Shared approval history/details across modules | Document version detail page displays history | No universal subject-history API/UI found; module coverage gap. |
| Modules/events enumerated by the policy | Existing approval subject registry includes inspection, lab, document, calibration, CAPA, change, RCA, NCR, finding, templates, release candidate and UAT; distinct signed flows exist in several modules | List does not map each event to exact state, signer, meaning and policy version. Receiving, quarantine, retest, Issue Slip, maintenance, tasks, reports, backup/recovery and admin events need explicit applicability decisions. Physical Issue Slip attestation is not an electronic signature. |
| yazeed controlled override | New policy explicitly expects controlled/justified/audited overrides; prior follow-up asked for all-control bypass | Signature/audit silent-bypass request is superseded by newer user direction. Scientific-source bypass remains undefined. No code grant made. |
| Technical Admin separation | New policy says Admin is technical-only and not a QC approver | Existing permission and role sources require controlled reconciliation before changing them. |
| Verification | New policy calls for representative unit, persistence, rollback, replay, concurrency, authorization and UI checks | No tests were run for this policy review. Future tests must follow the approved action map and exact policy revision. |

## Closure boundary

**PARTIAL / BLOCKED:** this review reconciles the new functional direction and current implementation evidence. It does not establish policy effectivity, complete action applicability, scientific-source exceptions, controlled role changes, runtime correctness, UAT, or regulatory scope. Keep unmapped actions blocked; do not score them as N/A. Required next input is a controlled, revisioned/effective action registry with action-specific signer/meaning/permission/prerequisite and yazeed override boundaries, approved by the accountable QMS and domain authorities.

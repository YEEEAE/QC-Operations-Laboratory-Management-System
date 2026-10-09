import type { ApprovalDecisionKind, ApprovalSubjectType } from '../domain/approval.js';
import type { ApprovalRecord } from '../ports/repository.js';
import type { SignaturePolicy, SignatureRequirement } from './decide-approval.js';

/**
 * Central generic-approval signature registry.
 *
 * Approved by the system owner on 2026-10-09, effective 2026-10-09, from
 * `Documents/QC-GLOBAL-ELECTRONIC-SIGNATURE-ACTION-MAP.md` (Action × Signer ×
 * Meaning map). This is the single place where an approval decision's signing
 * requirement and meaning are declared.
 *
 * Only rows listed below are active. Every subject/decision without an explicit
 * row stays fail-closed (`UNRESOLVED`), which is the default the generic
 * approval pipeline must keep: no signature policy, no decision.
 *
 * Dedicated ceremonies (inspection stage-1/final, laboratory stage-1/final,
 * CAPA close, template lifecycle, release approval, UAT acceptance, backup
 * recovery) keep their own version-bound ceremonies and are intentionally not
 * duplicated here.
 */
interface ApprovedSignatureRule {
  status: Extract<SignatureRequirement, 'REQUIRED' | 'NOT_REQUIRED'>;
  meaning?: (record: ApprovalRecord) => string;
}

const APPROVED_RULES: Partial<
  Record<ApprovalSubjectType, Partial<Record<ApprovalDecisionKind, ApprovedSignatureRule>>>
> = {
  CHANGE_REQUEST: {
    // Approved map row 15: formal authorization requires an account-bound
    // signature with the owner/QCM authority (PERM-CHG-APPROVE + PERM-APR-APPROVE
    // + PERM-ESIG-SIGN are still enforced by authorizeApprovalDecision and the
    // shared signer).
    APPROVE: {
      status: 'REQUIRED',
      meaning: (record) => `Authorize change request ${record.subject.subjectId}`,
    },
    // Approved map §4 item 3: workflow refusals are not formal approvals and stay
    // available to the assigned reviewer without a signature until the owner
    // designates them as signed actions.
    RETURN: { status: 'NOT_REQUIRED' },
    REJECT: { status: 'NOT_REQUIRED' },
  },
};

/** Generic subject types routed through the shared approval pipeline. */
const WIRED_SUBJECT_TYPES: readonly ApprovalSubjectType[] = ['DOCUMENT_VERSION', 'CHANGE_REQUEST'];

export type ApprovalSignaturePolicyStatus = 'ACTIVE' | 'PARTIAL' | 'UNRESOLVED';

export function createApprovedSignaturePolicy(): SignaturePolicy {
  return {
    requirement({ record, decision }) {
      const rule = APPROVED_RULES[record.subject.subjectType]?.[decision];
      if (!rule) return { status: 'UNRESOLVED' };
      return {
        status: rule.status,
        ...(rule.meaning ? { meaning: rule.meaning(record) } : {}),
      };
    },
  };
}

/**
 * Global status for the approvals surfaces. `PARTIAL` is expected while some
 * wired subject types (for example a controlled document version) have not yet
 * received an approved action map, so their decisions stay blocked even though
 * other subjects are active.
 */
export function approvalSignaturePolicyStatus(): ApprovalSignaturePolicyStatus {
  const resolved = WIRED_SUBJECT_TYPES.filter((type) => Boolean(APPROVED_RULES[type]));
  if (resolved.length === 0) return 'UNRESOLVED';
  if (resolved.length < WIRED_SUBJECT_TYPES.length) return 'PARTIAL';
  return 'ACTIVE';
}

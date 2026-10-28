import { AppError } from '../../../shared/errors/app-error.js';
import type { IssueSlipStatus } from './reject-report.js';
import type { EventDeliveryStatus, FocusComplianceEntry } from './focus-compliance.js';
import {
  assertNonBlank,
  assertOptionalNonNegativeNumberString,
  assertPositiveNumberString,
  optionalTrimmed,
} from './reject-report.js';

export const ISSUE_SLIP_APPROVAL_ROLES = ['SUPERVISOR', 'QC_MANAGER', 'FACTORY_DIRECTOR'] as const;
export type IssueSlipApprovalRole = (typeof ISSUE_SLIP_APPROVAL_ROLES)[number];

export const APPROVAL_CONFIRMATION_STATUSES = ['PENDING', 'CONFIRMED', 'REVERSED'] as const;
export type ApprovalConfirmationStatus = (typeof APPROVAL_CONFIRMATION_STATUSES)[number];
export type ExternalApprovalOutcome = 'APPROVED' | 'REJECTED' | 'UNKNOWN';
export type EvidenceConfidence = 'UNASSESSED' | 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * A recorded external-approval fact. The recorder and named approver are
 * separate actors; the stored fact is not an electronic signature or an
 * internal approval decision.
 */
export interface ApprovalConfirmation {
  id: string;
  reportId: string;
  role: IssueSlipApprovalRole;
  status: ApprovalConfirmationStatus;
  approverName?: string;
  /** Identity/name as recorded by the reporter; it is not identity proof. */
  approverIdentity?: string;
  /** Authenticated approver who made a real decision, when that route is authorized. */
  actualApproverId?: string;
  actualDecisionAt?: Date;
  outcome?: ExternalApprovalOutcome;
  evidenceConfidence: EvidenceConfidence;
  /** Actor who entered the factual confirmation, distinct from the approver. */
  reportedBy?: string;
  evidenceReporterRole?: 'ORIGINAL_SUBMITTER' | 'QC_COMPLIANCE_DATA_ENTRY';
  confirmationBasis: 'SELF_REPORTED' | 'APPROVER_CONFIRMED';
  confirmedBy?: string;
  confirmedAt?: Date;
  note?: string;
  evidenceFileId?: string;
  reversedBy?: string;
  reversedAt?: Date;
  reversalReason?: string;
  version: bigint;
}

export interface IssueSlipFields {
  goodsDescription?: string;
  itemCode: string;
  itemName: string;
  lotNo?: string;
  unit: string;
  rejectedQty: string;
  unitCost?: string;
  totalValue?: string;
  rejectReason: string;
  remarks?: string;
}

export interface IssueSlip {
  id: string;
  reportNo: string;
  reportDate: Date;
  department: string;
  status: IssueSlipStatus;
  fields: IssueSlipFields;
  approvals: readonly ApprovalConfirmation[];
  focusCompliance?: FocusComplianceEntry;
  eventDeliveryStatuses?: readonly EventDeliveryStatus[];
  issuedAt?: Date;
  completedAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  correctionOf?: string;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
  version: bigint;
}

export function validateIssueSlipFields(fields: IssueSlipFields): IssueSlipFields {
  return {
    goodsDescription: optionalTrimmed(fields.goodsDescription),
    itemCode: assertNonBlank(fields.itemCode, 'itemCode'),
    itemName: assertNonBlank(fields.itemName, 'itemName'),
    lotNo: optionalTrimmed(fields.lotNo),
    unit: assertNonBlank(fields.unit, 'unit'),
    rejectedQty: assertPositiveNumberString(fields.rejectedQty, 'rejectedQty'),
    unitCost: assertOptionalNonNegativeNumberString(fields.unitCost, 'unitCost'),
    totalValue: assertOptionalNonNegativeNumberString(fields.totalValue, 'totalValue'),
    rejectReason: assertNonBlank(fields.rejectReason, 'rejectReason'),
    remarks: optionalTrimmed(fields.remarks),
  };
}

export function pendingApprovalRoles(
  approvals: readonly ApprovalConfirmation[],
): readonly IssueSlipApprovalRole[] {
  return ISSUE_SLIP_APPROVAL_ROLES.filter(
    (role) => !approvals.some((a) =>
      a.role === role && a.status === 'CONFIRMED' && a.outcome === 'APPROVED' &&
      a.confirmationBasis === 'APPROVER_CONFIRMED' && Boolean(a.actualApproverId && a.actualDecisionAt),
    ),
  );
}

export function allApprovalsConfirmed(approvals: readonly ApprovalConfirmation[]): boolean {
  return pendingApprovalRoles(approvals).length === 0;
}

export function approvalPresentationState(
  confirmation: ApprovalConfirmation | undefined,
): 'AWAITING_EXTERNAL_APPROVAL' | 'CONFIRMATION_RECORDED_BY_CREATOR' | 'EVIDENCE_ATTACHED' | 'INTERNAL_APPROVED' {
  if (!confirmation || confirmation.status === 'PENDING' || confirmation.status === 'REVERSED')
    return 'AWAITING_EXTERNAL_APPROVAL';
  if (
    confirmation.confirmationBasis === 'APPROVER_CONFIRMED' && confirmation.outcome === 'APPROVED' &&
    confirmation.actualApproverId && confirmation.actualDecisionAt
  ) return 'INTERNAL_APPROVED';
  if (confirmation.evidenceFileId) return 'EVIDENCE_ATTACHED';
  return 'CONFIRMATION_RECORDED_BY_CREATOR';
}

/**
 * Ordering gate (QC-100-FINAL-004 Task 3).
 *
 * The three checkpoints are sequential — `SUPERVISOR → QC_MANAGER →
 * FACTORY_DIRECTOR`. Only the first checkpoint without a reported `APPROVED`
 * outcome may be recorded next, so a later checkpoint cannot pass an earlier
 * rejection or unknown outcome. A `REVERSED` row is not approved, so reversing a
 * checkpoint returns it to the front of the queue and re-confirmation restarts
 * from that checkpoint (the following checkpoints still apply in order).
 */
export function nextPendingApprovalRole(
  approvals: readonly ApprovalConfirmation[],
): IssueSlipApprovalRole | undefined {
  return pendingApprovalRoles(approvals)[0];
}

/**
 * Rejects a confirmation that is out of order, whatever the recorder's role.
 */
export function assertApprovalRoleIsNext(
  approvals: readonly ApprovalConfirmation[],
  role: IssueSlipApprovalRole,
): void {
  if (nextPendingApprovalRole(approvals) !== role)
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
}

/** Confirmation is only possible while the slip tracks approvals. */
export function assertConfirmable(slip: IssueSlip): void {
  if (slip.status !== 'APPROVAL_TRACKING' && slip.status !== 'ISSUED')
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
}

export function assertDraftEditable(status: RejectReportStatusLike): void {
  if (status !== 'DRAFT') throw new AppError('AUTHZ_DENIED', { userSafe: true });
}

export function assertNotVoided(status: RejectReportStatusLike): void {
  if (status === 'VOID') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
}

type RejectReportStatusLike = IssueSlipStatus | 'DRAFT' | 'FINALIZED' | 'VOID';

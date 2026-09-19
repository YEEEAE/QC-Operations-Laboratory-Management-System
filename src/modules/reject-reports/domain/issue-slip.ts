import { AppError } from '../../../shared/errors/app-error.js';
import type { IssueSlipStatus } from './reject-report.js';
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

/**
 * A creator-recorded confirmation that a real-world approval was obtained.
 * This is NOT an electronic signature by the named approver role; UI and
 * documents must always render it as "confirmation recorded by the creator".
 */
export interface ApprovalConfirmation {
  id: string;
  reportId: string;
  role: IssueSlipApprovalRole;
  status: ApprovalConfirmationStatus;
  approverName?: string;
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
    (role) => !approvals.some((a) => a.role === role && a.status === 'CONFIRMED'),
  );
}

export function allApprovalsConfirmed(approvals: readonly ApprovalConfirmation[]): boolean {
  return pendingApprovalRoles(approvals).length === 0;
}

/**
 * Ordering gate (QC-100-FINAL-004 Task 3).
 *
 * The three checkpoints are sequential — `SUPERVISOR → QC_MANAGER →
 * FACTORY_DIRECTOR`. Only the first checkpoint that is not `CONFIRMED` may be
 * recorded next, so a later checkpoint can never be confirmed while an earlier
 * one is still pending. A `REVERSED` row is not `CONFIRMED`, so reversing a
 * checkpoint returns it to the front of the queue and re-confirmation restarts
 * from that checkpoint (the following checkpoints still apply in order).
 */
export function nextPendingApprovalRole(
  approvals: readonly ApprovalConfirmation[],
): IssueSlipApprovalRole | undefined {
  return pendingApprovalRoles(approvals)[0];
}

/**
 * Rejects a confirmation that is out of order, whatever the actor's role:
 * a QC data-entry (EMPLOYEE) creator who holds `PERM-RREJ-CONFIRM-APPROVAL`
 * cannot record a checkpoint above the one the slip is currently at.
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

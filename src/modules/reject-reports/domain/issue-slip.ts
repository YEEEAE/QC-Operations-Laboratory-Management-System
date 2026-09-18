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

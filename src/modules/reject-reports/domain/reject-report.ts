import { AppError } from '../../../shared/errors/app-error.js';

export const REJECT_REPORT_TYPES = ['ISSUE_SLIP', 'DAILY_REJECT'] as const;
export type RejectReportType = (typeof REJECT_REPORT_TYPES)[number];

export const ISSUE_SLIP_STATUSES = [
  'DRAFT',
  'ISSUED',
  'APPROVAL_TRACKING',
  'COMPLETED',
  'VOID',
] as const;
export type IssueSlipStatus = (typeof ISSUE_SLIP_STATUSES)[number];

export const DAILY_REJECT_STATUSES = [
  'DRAFT', 'SUBMITTED_FOR_QC', 'QC_REVIEWED', 'RETURNED', 'SUPERVISOR_APPROVED', 'CORRECTED', 'FINALIZED', 'VOID',
] as const;
export type DailyRejectStatus = (typeof DAILY_REJECT_STATUSES)[number];

export type RejectReportStatus = IssueSlipStatus | DailyRejectStatus;

export type IssueSlipAction = 'ISSUE' | 'VOID';
export type DailyRejectAction = 'SUBMIT_FOR_QC' | 'QC_REVIEW' | 'QC_RETURN' | 'SUPERVISOR_APPROVE' | 'VOID';

const issueSlipTransitions: Record<IssueSlipAction, readonly [IssueSlipStatus, IssueSlipStatus][]> =
  {
    ISSUE: [['DRAFT', 'ISSUED']],
    VOID: [
      ['DRAFT', 'VOID'],
      ['ISSUED', 'VOID'],
      ['APPROVAL_TRACKING', 'VOID'],
    ],
  };

const dailyRejectTransitions: Record<
  DailyRejectAction,
  readonly [DailyRejectStatus, DailyRejectStatus][]
> = {
  SUBMIT_FOR_QC: [['DRAFT', 'SUBMITTED_FOR_QC']],
  QC_REVIEW: [['SUBMITTED_FOR_QC', 'QC_REVIEWED']],
  QC_RETURN: [['SUBMITTED_FOR_QC', 'RETURNED']],
  SUPERVISOR_APPROVE: [['QC_REVIEWED', 'SUPERVISOR_APPROVED']],
  VOID: [
    ['DRAFT', 'VOID'],
    ['SUBMITTED_FOR_QC', 'VOID'], ['QC_REVIEWED', 'VOID'],
    ['RETURNED', 'VOID'], ['SUPERVISOR_APPROVED', 'VOID'], ['CORRECTED', 'VOID'],
  ],
};

export function transitionIssueSlipStatus(
  state: IssueSlipStatus,
  action: IssueSlipAction,
): IssueSlipStatus {
  const next = issueSlipTransitions[action].find(([from]) => from === state)?.[1];
  if (!next) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  return next;
}

export function transitionDailyRejectStatus(
  state: DailyRejectStatus,
  action: DailyRejectAction,
): DailyRejectStatus {
  const next = dailyRejectTransitions[action].find(([from]) => from === state)?.[1];
  if (!next) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  return next;
}

export function assertNonBlank(value: string, field: string): string {
  if (!value.trim())
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { [field]: ['required'] },
    });
  return value.trim();
}

export function assertPositiveNumberString(value: string, field: string): string {
  const trimmed = assertNonBlank(value, field);
  if (!isNonNegativeDecimalString(trimmed) || /^0+(?:\.0+)?$/.test(trimmed))
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: {
        [field]: ['enter a positive decimal number using digits and an optional decimal point'],
      },
    });
  return trimmed;
}

export function isNonNegativeDecimalString(value: string): boolean {
  return value.length <= 50 && /^\d+(?:\.\d+)?$/.test(value);
}

export function assertNonNegativeNumberString(value: string, field: string): string {
  const trimmed = assertNonBlank(value, field);
  if (!isNonNegativeDecimalString(trimmed))
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: {
        [field]: ['enter a non-negative decimal number using digits and an optional decimal point'],
      },
    });
  return trimmed;
}

export function assertOptionalNonNegativeNumberString(
  value: string | undefined,
  field: string,
): string | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  return assertNonNegativeNumberString(value, field);
}

export function optionalTrimmed(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function assertReason(reason: string | undefined): string {
  return assertNonBlank(reason ?? '', 'reason');
}

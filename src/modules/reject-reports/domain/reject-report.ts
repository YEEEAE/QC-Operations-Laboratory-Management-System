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

export const DAILY_REJECT_STATUSES = ['DRAFT', 'FINALIZED', 'VOID'] as const;
export type DailyRejectStatus = (typeof DAILY_REJECT_STATUSES)[number];

export type RejectReportStatus = IssueSlipStatus | DailyRejectStatus;

export type IssueSlipAction = 'ISSUE' | 'VOID';
export type DailyRejectAction = 'FINALIZE' | 'VOID';

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
  FINALIZE: [['DRAFT', 'FINALIZED']],
  VOID: [
    ['DRAFT', 'VOID'],
    ['FINALIZED', 'VOID'],
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
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { [field]: ['must be a positive number'] },
    });
  return trimmed;
}

export function assertNonNegativeNumberString(value: string, field: string): string {
  const trimmed = assertNonBlank(value, field);
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { [field]: ['must be a non-negative number'] },
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

import { describe, expect, it } from 'vitest';
import {
  transitionIssueSlipStatus,
  transitionDailyRejectStatus,
  assertNonBlank,
} from '../../../src/modules/reject-reports/domain/reject-report.js';
import { validateIssueSlipFields } from '../../../src/modules/reject-reports/domain/issue-slip.js';
import {
  pendingApprovalRoles,
  allApprovalsConfirmed,
  nextPendingApprovalRole,
  assertApprovalRoleIsNext,
} from '../../../src/modules/reject-reports/domain/issue-slip.js';
import { computeRejectPercent } from '../../../src/modules/reject-reports/domain/reject-percentage.js';
import {
  formatReportNo,
  isReportNo,
  reportNoDateKey,
  REPORT_NO_PATTERN,
} from '../../../src/modules/reject-reports/domain/report-number.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ApprovalConfirmation } from '../../../src/modules/reject-reports/domain/issue-slip.js';

const confirmation = (
  role: ApprovalConfirmation['role'],
  status: ApprovalConfirmation['status'],
): ApprovalConfirmation => ({
  id: `id-${role}`,
  reportId: 'report-1',
  role,
  status,
  version: 1n,
});

describe('Reject Reports — Issue Slip state machine', () => {
  it('transitions DRAFT → ISSUED and non-terminal states → VOID', () => {
    expect(transitionIssueSlipStatus('DRAFT', 'ISSUE')).toBe('ISSUED');
    expect(transitionIssueSlipStatus('DRAFT', 'VOID')).toBe('VOID');
    expect(transitionIssueSlipStatus('ISSUED', 'VOID')).toBe('VOID');
    expect(transitionIssueSlipStatus('APPROVAL_TRACKING', 'VOID')).toBe('VOID');
  });
  it('rejects invalid transitions', () => {
    expect(() => transitionIssueSlipStatus('COMPLETED', 'ISSUE')).toThrow(AppError);
    expect(() => transitionIssueSlipStatus('COMPLETED', 'VOID')).toThrow(AppError);
    expect(() => transitionIssueSlipStatus('VOID', 'VOID')).toThrow(AppError);
  });
});

describe('Reject Reports — Daily Reject state machine', () => {
  it('transitions DRAFT → FINALIZED and allows controlled void', () => {
    expect(transitionDailyRejectStatus('DRAFT', 'FINALIZE')).toBe('FINALIZED');
    expect(transitionDailyRejectStatus('DRAFT', 'VOID')).toBe('VOID');
    expect(transitionDailyRejectStatus('FINALIZED', 'VOID')).toBe('VOID');
    expect(() => transitionDailyRejectStatus('FINALIZED', 'FINALIZE')).toThrow(AppError);
    expect(() => transitionDailyRejectStatus('VOID', 'VOID')).toThrow(AppError);
  });
});

describe('Reject Reports — report numbers', () => {
  it('formats and validates the human-readable convention', () => {
    const date = new Date('2026-09-18T10:00:00Z');
    expect(formatReportNo('ISSUE_SLIP', date, 7)).toBe('RIS-20260918-0007');
    expect(formatReportNo('DAILY_REJECT', date, 42)).toBe('DRR-20260918-0042');
    expect(isReportNo('RIS-20260918-0007')).toBe(true);
    expect(isReportNo('DRR-20260918-0001')).toBe(true);
    expect(isReportNo('TASK-20260918-0001')).toBe(false);
    expect(REPORT_NO_PATTERN.test('RIS-20260918-10000')).toBe(false);
    expect(() => formatReportNo('ISSUE_SLIP', date, 0)).toThrow(AppError);
    expect(() => formatReportNo('ISSUE_SLIP', date, 10000)).toThrow(AppError);
    expect(reportNoDateKey(new Date('2026-01-05T23:30:00Z'))).toBe('20260105');
  });
});

describe('Reject Reports — reject percentage (paper-form convention)', () => {
  it('computes rejectQty / goodQty * 100 server-side', () => {
    expect(computeRejectPercent(42, 303)).toBeCloseTo(13.8614, 3);
    expect(computeRejectPercent(0, 100)).toBe(0);
  });
  it('handles divide-by-zero and invalid inputs safely', () => {
    expect(computeRejectPercent(10, 0)).toBeNull();
    expect(computeRejectPercent(-1, 100)).toBeNull();
    expect(computeRejectPercent(Number.NaN, 100)).toBeNull();
  });
});

describe('Reject Reports — approval completeness', () => {
  it('is complete only when all three checkpoints are CONFIRMED', () => {
    const pending = [
      confirmation('SUPERVISOR', 'PENDING'),
      confirmation('QC_MANAGER', 'PENDING'),
      confirmation('FACTORY_DIRECTOR', 'PENDING'),
    ];
    expect(allApprovalsConfirmed(pending)).toBe(false);
    const partial = [
      confirmation('SUPERVISOR', 'CONFIRMED'),
      confirmation('QC_MANAGER', 'PENDING'),
      confirmation('FACTORY_DIRECTOR', 'PENDING'),
    ];
    expect(pendingApprovalRoles(partial)).toEqual(['QC_MANAGER', 'FACTORY_DIRECTOR']);
    expect(allApprovalsConfirmed(partial)).toBe(false);
    const reversed = [
      confirmation('SUPERVISOR', 'CONFIRMED'),
      confirmation('QC_MANAGER', 'CONFIRMED'),
      confirmation('FACTORY_DIRECTOR', 'REVERSED'),
    ];
    expect(allApprovalsConfirmed(reversed)).toBe(false);
    const complete = [
      confirmation('SUPERVISOR', 'CONFIRMED'),
      confirmation('QC_MANAGER', 'CONFIRMED'),
      confirmation('FACTORY_DIRECTOR', 'CONFIRMED'),
    ];
    expect(allApprovalsConfirmed(complete)).toBe(true);
  });
});

describe('Reject Reports — checkpoint ordering gate (QC-100-FINAL-004 Task 3)', () => {
  const allPending = () => [
    confirmation('SUPERVISOR', 'PENDING'),
    confirmation('QC_MANAGER', 'PENDING'),
    confirmation('FACTORY_DIRECTOR', 'PENDING'),
  ];

  it('exposes only the next pending checkpoint and walks SUPERVISOR → QC_MANAGER → FACTORY_DIRECTOR', () => {
    expect(nextPendingApprovalRole(allPending())).toBe('SUPERVISOR');
    expect(
      nextPendingApprovalRole([
        confirmation('SUPERVISOR', 'CONFIRMED'),
        confirmation('QC_MANAGER', 'PENDING'),
        confirmation('FACTORY_DIRECTOR', 'PENDING'),
      ]),
    ).toBe('QC_MANAGER');
    expect(
      nextPendingApprovalRole([
        confirmation('SUPERVISOR', 'CONFIRMED'),
        confirmation('QC_MANAGER', 'CONFIRMED'),
        confirmation('FACTORY_DIRECTOR', 'PENDING'),
      ]),
    ).toBe('FACTORY_DIRECTOR');
    expect(
      nextPendingApprovalRole([
        confirmation('SUPERVISOR', 'CONFIRMED'),
        confirmation('QC_MANAGER', 'CONFIRMED'),
        confirmation('FACTORY_DIRECTOR', 'CONFIRMED'),
      ]),
    ).toBeUndefined();
  });

  it('denies confirming a checkpoint before its predecessors', () => {
    expect(() => assertApprovalRoleIsNext(allPending(), 'SUPERVISOR')).not.toThrow();
    expect(() => assertApprovalRoleIsNext(allPending(), 'QC_MANAGER')).toThrow(AppError);
    expect(() => assertApprovalRoleIsNext(allPending(), 'FACTORY_DIRECTOR')).toThrow(AppError);
    const afterSupervisor = [
      confirmation('SUPERVISOR', 'CONFIRMED'),
      confirmation('QC_MANAGER', 'PENDING'),
      confirmation('FACTORY_DIRECTOR', 'PENDING'),
    ];
    expect(() => assertApprovalRoleIsNext(afterSupervisor, 'FACTORY_DIRECTOR')).toThrow(AppError);
    expect(() => assertApprovalRoleIsNext(afterSupervisor, 'QC_MANAGER')).not.toThrow();
  });

  it('treats a missing confirmation row as pending and denies the later checkpoint', () => {
    const onlyDirectorRow = [confirmation('FACTORY_DIRECTOR', 'PENDING')];
    expect(nextPendingApprovalRole(onlyDirectorRow)).toBe('SUPERVISOR');
    expect(() => assertApprovalRoleIsNext(onlyDirectorRow, 'FACTORY_DIRECTOR')).toThrow(AppError);
  });

  it('returns a reversed checkpoint to the front of the queue', () => {
    const reversed = [
      confirmation('SUPERVISOR', 'REVERSED'),
      confirmation('QC_MANAGER', 'CONFIRMED'),
      confirmation('FACTORY_DIRECTOR', 'PENDING'),
    ];
    expect(nextPendingApprovalRole(reversed)).toBe('SUPERVISOR');
    expect(() => assertApprovalRoleIsNext(reversed, 'FACTORY_DIRECTOR')).toThrow(AppError);
  });
});

describe('Reject Reports — field validation', () => {
  it('requires item identity and a positive rejected quantity', () => {
    expect(() =>
      validateIssueSlipFields({
        itemCode: ' ',
        itemName: 'x',
        unit: 'kg',
        rejectedQty: '10',
        rejectReason: 'damaged',
      }),
    ).toThrow(AppError);
    expect(() =>
      validateIssueSlipFields({
        itemCode: 'IT-1',
        itemName: 'x',
        unit: 'kg',
        rejectedQty: '0',
        rejectReason: 'damaged',
      }),
    ).toThrow(AppError);
    expect(() =>
      validateIssueSlipFields({
        itemCode: 'IT-1',
        itemName: 'x',
        unit: 'kg',
        rejectedQty: '-5',
        rejectReason: 'damaged',
      }),
    ).toThrow(AppError);
    expect(() =>
      validateIssueSlipFields({
        itemCode: 'IT-1',
        itemName: 'x',
        unit: 'kg',
        rejectedQty: '10',
        rejectReason: ' ',
      }),
    ).toThrow(AppError);
    const valid = validateIssueSlipFields({
      itemCode: 'IT-1',
      itemName: 'x',
      unit: 'kg',
      rejectedQty: '10',
      rejectReason: 'damaged',
      unitCost: '2.5',
      totalValue: '25',
    });
    expect(valid.rejectedQty).toBe('10');
    expect(() =>
      validateIssueSlipFields({
        itemCode: 'IT-1',
        itemName: 'x',
        unit: 'kg',
        rejectedQty: '10',
        rejectReason: 'damaged',
        unitCost: '-1',
      }),
    ).toThrow(AppError);
  });
  it('requires non-blank reasons everywhere', () => {
    expect(() => assertNonBlank('  ', 'reason')).toThrow(AppError);
    expect(assertNonBlank(' ok ', 'reason')).toBe('ok');
  });
});

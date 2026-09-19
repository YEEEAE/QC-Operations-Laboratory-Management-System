import { describe, expect, it } from 'vitest';
import { ConfirmIssueSlipApprovalUseCase } from '../../../src/modules/reject-reports/application/confirm-issue-slip-approval.js';
import {
  ISSUE_SLIP_APPROVAL_ROLES,
  type ApprovalConfirmation,
  type IssueSlip,
  type IssueSlipApprovalRole,
} from '../../../src/modules/reject-reports/domain/issue-slip.js';
import type { RejectReportRepository } from '../../../src/modules/reject-reports/ports/repository.js';
import type { ActorContext, ScopeKind } from '../../../src/shared/authorization/types.js';

const CREATOR_ID = '01900000-0000-7000-8000-0000000000d1';
const OTHER_ID = '01900000-0000-7000-8000-0000000000d2';
const REPORT_ID = '01900000-0000-7000-8000-0000000000e1';

const actor = (input: {
  id: string;
  roles: readonly string[];
  permissionScopes?: readonly ScopeKind[];
}): ActorContext => ({
  id: input.id,
  accountState: 'ACTIVE',
  roles: [...input.roles],
  permissions: [
    { code: 'PERM-RREJ-VIEW', scopes: ['OWN'] },
    { code: 'PERM-RREJ-CONFIRM-APPROVAL', scopes: [...(input.permissionScopes ?? ['OWN'])] },
  ],
});

/** QC data-entry creator (EMPLOYEE) holding the confirmation permission. */
const employeeCreator = () => actor({ id: CREATOR_ID, roles: ['EMPLOYEE'] });
/** Creator who is also the QCM: role must not bypass the checkpoint order. */
const qcmCreator = () =>
  actor({ id: CREATOR_ID, roles: ['MANAGER'], permissionScopes: ['GLOBAL'] });
/** Another authorized user who is not the creator. */
const otherAuthorizedUser = () =>
  actor({ id: OTHER_ID, roles: ['SUPERVISOR'], permissionScopes: ['GLOBAL'] });

function confirmation(
  role: IssueSlipApprovalRole,
  status: ApprovalConfirmation['status'],
): ApprovalConfirmation {
  return { id: `id-${role}`, reportId: REPORT_ID, role, status, version: 1n };
}

function issueSlip(approvals?: readonly ApprovalConfirmation[]): IssueSlip {
  return {
    id: REPORT_ID,
    reportNo: 'RIS-20260918-0001',
    reportDate: new Date('2026-09-18'),
    department: 'Production A',
    status: 'APPROVAL_TRACKING',
    fields: {
      itemCode: 'FG-001',
      itemName: 'Rejected widget',
      unit: 'PCS',
      rejectedQty: '42',
      rejectReason: 'Dimensional defect',
    },
    approvals: approvals ?? ISSUE_SLIP_APPROVAL_ROLES.map((role) => confirmation(role, 'PENDING')),
    createdBy: CREATOR_ID,
    createdAt: new Date('2026-09-18T08:00:00.000Z'),
    updatedAt: new Date('2026-09-18T08:00:00.000Z'),
    version: 5n,
  };
}

interface ConfirmCall {
  role: IssueSlipApprovalRole;
  actorId: string;
  approverName?: string;
}

/** Minimal in-memory repository exposing only what this use case reads/writes. */
class MemoryIssueSlipRepository {
  readonly confirmCalls: ConfirmCall[] = [];
  constructor(private slip: IssueSlip) {}
  async getIssueSlip(): Promise<IssueSlip | undefined> {
    return this.slip;
  }
  async confirmApproval(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    role: IssueSlipApprovalRole;
    approverName?: string;
    note?: string;
    evidenceFileId?: string;
  }): Promise<IssueSlip> {
    this.confirmCalls.push({
      role: input.role,
      actorId: input.actor.id,
      approverName: input.approverName,
    });
    const confirmedAt = new Date('2026-09-19T00:00:00.000Z');
    this.slip = {
      ...this.slip,
      version: this.slip.version + 1n,
      approvals: this.slip.approvals.map((approval) =>
        approval.role === input.role
          ? {
              ...approval,
              status: 'CONFIRMED',
              confirmedBy: input.actor.id,
              confirmedAt,
              approverName: input.approverName,
            }
          : approval,
      ),
    };
    return this.slip;
  }
}

const useCaseFor = (repository: MemoryIssueSlipRepository) =>
  new ConfirmIssueSlipApprovalUseCase(repository as unknown as RejectReportRepository);

describe('Reject Reports — Issue Slip checkpoint order enforcement', () => {
  it('denies an EMPLOYEE creator recording QC_MANAGER before SUPERVISOR', async () => {
    const repository = new MemoryIssueSlipRepository(issueSlip());
    await expect(
      useCaseFor(repository).execute({
        actor: employeeCreator(),
        reportId: REPORT_ID,
        expectedVersion: 5n,
        role: 'QC_MANAGER',
        requestId: 'req-order-1',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    expect(repository.confirmCalls).toHaveLength(0);
  });

  it('denies an EMPLOYEE creator jumping straight to FACTORY_DIRECTOR', async () => {
    const repository = new MemoryIssueSlipRepository(issueSlip());
    await expect(
      useCaseFor(repository).execute({
        actor: employeeCreator(),
        reportId: REPORT_ID,
        expectedVersion: 5n,
        role: 'FACTORY_DIRECTOR',
        requestId: 'req-order-2',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    expect(repository.confirmCalls).toHaveLength(0);
  });

  it('denies a QCM (MANAGER) creator recording QC_MANAGER before SUPERVISOR — order beats role', async () => {
    const repository = new MemoryIssueSlipRepository(issueSlip());
    await expect(
      useCaseFor(repository).execute({
        actor: qcmCreator(),
        reportId: REPORT_ID,
        expectedVersion: 5n,
        role: 'QC_MANAGER',
        requestId: 'req-order-3',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    expect(repository.confirmCalls).toHaveLength(0);
  });

  it('denies SUPERVISOR-before-SUPERVISOR skip after the first checkpoint is confirmed', async () => {
    const repository = new MemoryIssueSlipRepository(
      issueSlip([
        confirmation('SUPERVISOR', 'CONFIRMED'),
        confirmation('QC_MANAGER', 'PENDING'),
        confirmation('FACTORY_DIRECTOR', 'PENDING'),
      ]),
    );
    // duplicate confirmation of the already-confirmed checkpoint
    await expect(
      useCaseFor(repository).execute({
        actor: employeeCreator(),
        reportId: REPORT_ID,
        expectedVersion: 5n,
        role: 'SUPERVISOR',
        requestId: 'req-order-4',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    // skipping the QC_MANAGER checkpoint
    await expect(
      useCaseFor(repository).execute({
        actor: employeeCreator(),
        reportId: REPORT_ID,
        expectedVersion: 5n,
        role: 'FACTORY_DIRECTOR',
        requestId: 'req-order-5',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    expect(repository.confirmCalls).toHaveLength(0);
  });

  it('denies a non-creator holding the confirmation permission (owner check)', async () => {
    const repository = new MemoryIssueSlipRepository(issueSlip());
    await expect(
      useCaseFor(repository).execute({
        actor: otherAuthorizedUser(),
        reportId: REPORT_ID,
        expectedVersion: 5n,
        role: 'SUPERVISOR',
        requestId: 'req-order-6',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repository.confirmCalls).toHaveLength(0);
  });

  it('allows the creator to walk SUPERVISOR → QC_MANAGER → FACTORY_DIRECTOR in order', async () => {
    const repository = new MemoryIssueSlipRepository(issueSlip());
    const useCase = useCaseFor(repository);
    const first = await useCase.execute({
      actor: employeeCreator(),
      reportId: REPORT_ID,
      expectedVersion: 5n,
      role: 'SUPERVISOR',
      approverName: 'S. Supervisor',
      requestId: 'req-order-7',
    });
    expect(first.approvals.find((a) => a.role === 'SUPERVISOR')?.status).toBe('CONFIRMED');
    const second = await useCase.execute({
      actor: employeeCreator(),
      reportId: REPORT_ID,
      expectedVersion: first.version,
      role: 'QC_MANAGER',
      requestId: 'req-order-7',
    });
    const third = await useCase.execute({
      actor: employeeCreator(),
      reportId: REPORT_ID,
      expectedVersion: second.version,
      role: 'FACTORY_DIRECTOR',
      requestId: 'req-order-7',
    });
    expect(third.approvals.every((a) => a.status === 'CONFIRMED')).toBe(true);
    expect(repository.confirmCalls.map((call) => call.role)).toEqual([
      'SUPERVISOR',
      'QC_MANAGER',
      'FACTORY_DIRECTOR',
    ]);
    // still a creator attestation, never an approver signature
    expect(third.approvals[0].confirmedBy).toBe(CREATOR_ID);
  });

  it('denies confirmation on a VOID slip regardless of order', async () => {
    const voidRepository = new MemoryIssueSlipRepository({ ...issueSlip(), status: 'VOID' });
    await expect(
      useCaseFor(voidRepository).execute({
        actor: employeeCreator(),
        reportId: REPORT_ID,
        expectedVersion: 5n,
        role: 'SUPERVISOR',
        requestId: 'req-order-8',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    expect(voidRepository.confirmCalls).toHaveLength(0);
  });
});

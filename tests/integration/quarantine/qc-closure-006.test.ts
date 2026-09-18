import { describe, expect, it } from 'vitest';
import { SubmitInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/submit-inspection.js';
import { RejectInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/reject-inspection.js';
import type { Inspection } from '../../../src/modules/quarantine/inspection/domain/inspection.js';
import type { InspectionRepository } from '../../../src/modules/quarantine/inspection/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const authorId = '01900000-0000-7000-8000-000000000001';
const reviewerId = '01900000-0000-7000-8000-000000000002';
const reportId = '01900000-0000-7000-8000-000000000003';
const receivingId = '01900000-0000-7000-8000-000000000004';

const report = (state: Inspection['state']): Inspection => ({
  id: reportId,
  inspectionNo: 'INSP-CLOSURE-006',
  receiving: {
    receivingId,
    receivingNo: 'RCV-CLOSURE-006',
    supplier: 'Approved supplier',
    docNo: 'DOC-006',
    itemCode: 'ITEM-006',
    description: 'Controlled material',
    lot: 'LOT-006',
    qty: '1',
    receivingDate: new Date('2026-01-01'),
  },
  template: {
    templateId: '01900000-0000-7000-8000-000000000005',
    templateVersionId: '01900000-0000-7000-8000-000000000006',
    versionNo: '1',
    templateSnapshot: { sourceDocument: 'WI-006' },
    sourceDocument: 'WI-006',
    approved: true,
  },
  state,
  finalResult: 'PASS',
  authorId,
  assignedTo: authorId,
  evidenceCount: 1,
  results: [
    {
      id: '01900000-0000-7000-8000-000000000007',
      pointId: '01900000-0000-7000-8000-000000000008',
      value: 'within criteria',
      version: 1n,
    },
  ],
  version: 2n,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const actor = (id: string, permissions: ActorContext['permissions']): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions,
});

function repository(initial: Inspection): InspectionRepository {
  let current = initial;
  return {
    async create() {
      return current;
    },
    async get() {
      return current;
    },
    async list() {
      return [current];
    },
    async saveDraft() {
      return current;
    },
    async transition(input) {
      current = {
        ...current,
        state: input.action === 'REJECT' ? 'REJECTED' : 'SUBMITTED',
        version: current.version + 1n,
      };
      return current;
    },
  };
}

describe('QC-CLOSURE-006 workflow contracts', () => {
  it('requires server-counted evidence before submission', async () => {
    const noEvidence = { ...report('DRAFT'), evidenceCount: 0 };
    const submitter = actor(authorId, [{ code: 'PERM-INSP-SUBMIT', scopes: ['OWN'] }]);
    await expect(
      new SubmitInspectionUseCase(repository(noEvidence)).execute({
        actor: submitter,
        id: reportId,
        expectedVersion: 2n,
        requestId: 'req-no-evidence',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('supports an independent Reject decision with a durable reason', async () => {
    const reviewer = actor(reviewerId, [
      { code: 'PERM-INSP-REJECT', scopes: ['GLOBAL'] },
      { code: 'PERM-APR-REJECT', scopes: ['GLOBAL'] },
    ]);
    await expect(
      new RejectInspectionUseCase(repository(report('UNDER_REVIEW'))).execute({
        actor: reviewer,
        id: reportId,
        expectedVersion: 2n,
        reason: 'Supplier evidence does not support the controlled decision.',
        requestId: 'req-reject',
      }),
    ).resolves.toMatchObject({ state: 'REJECTED' });
    await expect(
      new RejectInspectionUseCase(repository(report('UNDER_REVIEW'))).execute({
        actor: actor(authorId, [
          { code: 'PERM-INSP-REJECT', scopes: ['GLOBAL'] },
          { code: 'PERM-APR-REJECT', scopes: ['GLOBAL'] },
        ]),
        id: reportId,
        expectedVersion: 2n,
        reason: 'self decision must be blocked',
        requestId: 'req-self-reject',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
  });
});

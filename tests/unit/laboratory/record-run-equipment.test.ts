import { describe, expect, it, vi } from 'vitest';
import { RecordRunEquipmentUseCase } from '../../../src/modules/laboratory/application/record-run-equipment.js';
import type { LabRepository } from '../../../src/modules/laboratory/ports/repository.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actorId = '00000000-0000-7000-8000-000000000001';
const equipmentId = '00000000-0000-7000-8000-000000000002';
const calibrationId = '00000000-0000-7000-8000-000000000003';
const batchId = '00000000-0000-7000-8000-000000000004';
const test: LabTest = {
  id: '00000000-0000-7000-8000-000000000005',
  labTestNo: 'LAB-1',
  state: 'DRAFT',
  scientificResult: null,
  authorId: actorId,
  createdBy: actorId,
  version: 3n,
  context: {
    templateVersionId: 'template-v1',
    versionNo: '1',
    methodReference: 'METHOD-1',
    sourceReference: 'SOURCE-1',
    contentHash: 'hash',
    parameters: [],
    documents: [],
    equipment: [],
    source: {},
    requirementsReference: 'METHOD-1',
  },
  samples: [],
  measurements: [],
  batches: [
    {
      id: batchId,
      batchNo: 'RUN-1',
      sequence: 1,
      startedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  originalTestId: null,
  retestSequence: 0,
  retestReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  submittedAt: null,
  reviewStartedAt: null,
  approvedAt: null,
  rejectedAt: null,
};
const actor = (allowed: boolean): ActorContext => ({
  id: actorId,
  accountState: 'ACTIVE' as const,
  roles: ['EMPLOYEE'],
  permissions: allowed ? [{ code: 'PERM-LAB-EDIT-DRAFT', scopes: ['OWN'] as const }] : [],
});
const captured = {
  equipmentId,
  calibrationRecordId: calibrationId,
  usedAt: '2026-06-01T12:30:00.000Z',
  equipmentSnapshot: { equipmentId, equipmentNo: 'EQ-1', version: '7' },
  calibrationSnapshot: { calibrationRecordId: calibrationId, calibrationNo: 'CAL-1', version: '4' },
};

function setup(allowed = true) {
  const linkRunEquipment = vi.fn(async () => undefined);
  const repository = {
    get: vi.fn(async () => test),
    linkRunEquipment,
  } as unknown as LabRepository;
  const capture = vi.fn(async () => captured);
  const useCase = new RecordRunEquipmentUseCase(
    repository,
    { capture },
    () => new Date(captured.usedAt),
  );
  return { useCase, linkRunEquipment, capture, actor: actor(allowed) };
}

describe('record laboratory run equipment', () => {
  it('authorizes the draft owner and stores the Assets-owned source snapshot', async () => {
    const { useCase, linkRunEquipment, capture } = setup();
    const result = await useCase.execute({
      actor: actor(true),
      id: test.id,
      expectedVersion: test.version,
      batchId,
      usage: { equipmentId, calibrationRecordId: calibrationId },
      requestId: 'request-1',
    });
    expect(capture).toHaveBeenCalledWith({
      actor: actor(true),
      usage: { equipmentId, calibrationRecordId: calibrationId },
      context: test.context,
    });
    expect(result).toEqual(captured);
    expect(linkRunEquipment).toHaveBeenCalledWith(
      expect.objectContaining({ usage: captured, actor: actor(true), requestId: 'request-1' }),
    );
  });

  it('rejects without the existing draft-edit permission before reading eligibility', async () => {
    const { useCase, linkRunEquipment, capture } = setup(false);
    await expect(
      useCase.execute({
        actor: actor(false),
        id: test.id,
        expectedVersion: test.version,
        batchId,
        usage: { equipmentId, calibrationRecordId: calibrationId },
        requestId: 'request-2',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(capture).not.toHaveBeenCalled();
    expect(linkRunEquipment).not.toHaveBeenCalled();
  });

  it('rejects stale record versions before writing', async () => {
    const { useCase, linkRunEquipment } = setup();
    await expect(
      useCase.execute({
        actor: actor(true),
        id: test.id,
        expectedVersion: 2n,
        batchId,
        usage: { equipmentId, calibrationRecordId: calibrationId },
        requestId: 'request-3',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(linkRunEquipment).not.toHaveBeenCalled();
  });
});

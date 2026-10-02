import { describe, expect, it } from 'vitest';
import type { ActorContext } from '../../../src/shared/authorization/types';
import { SaveMeasurementsUseCase } from '../../../src/modules/laboratory/application/save-measurements';
import type { LabRepository } from '../../../src/modules/laboratory/ports/repository';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test';

const actor: ActorContext = {
  id: '00000000-0000-7000-8000-000000000001',
  accountState: 'ACTIVE',
  roles: [],
  permissions: [
    { code: 'PERM-LAB-VIEW', scopes: ['OWN'] },
    { code: 'PERM-LAB-EDIT-DRAFT', scopes: ['OWN'] },
    { code: 'PERM-LAB-ENTER-MEASUREMENT', scopes: ['OWN'] },
  ],
};
const test: LabTest = {
  id: '00000000-0000-7000-8000-000000000002',
  labTestNo: 'TEST-ONLY-001',
  state: 'DRAFT',
  scientificResult: null,
  authorId: actor.id,
  createdBy: actor.id,
  version: 1n,
  context: {
    templateVersionId: 'template',
    versionNo: 'fixture',
    methodReference: 'fixture-method',
    sourceReference: 'fixture-source',
    contentHash: 'fixture-hash',
    requirementsReference: 'fixture-source',
    source: {},
    documents: [],
    equipment: [],
    parameters: [
      {
        id: 'parameter',
        code: 'p',
        label: 'P',
        dataType: 'NUMERIC',
        unit: 'u',
        required: true,
        sourceReference: 'fixture-source',
        criteria: { fixture: true },
      },
    ],
  },
  samples: [{ id: 'sample', identifier: 'sample-1' }],
  measurements: [],
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
class MemoryRepository implements LabRepository {
  value = test;
  async get() {
    return this.value;
  }
  async list() {
    return { items: [this.value], total: 1 };
  }
  async workload() {
    return {
      total: 1,
      rows: [
        {
          id: this.value.id,
          labTestNo: this.value.labTestNo,
          state: this.value.state,
          updatedAt: new Date(this.value.updatedAt),
        },
      ],
    };
  }
  async create() {
    return this.value;
  }
  async history() {
    return [];
  }
  async save(_previous: LabTest, next: LabTest) {
    this.value = next;
    return next;
  }
  async linkRunEquipment() {}
  async listRunEquipment() {
    return [];
  }
}
describe('laboratory draft measurement entry', () => {
  it('preserves raw decimal text and rejects a stale version', async () => {
    const repository = new MemoryRepository();
    const useCase = new SaveMeasurementsUseCase(
      repository,
      () => new Date('2026-01-02T00:00:00.000Z'),
    );
    const result = await useCase.execute({
      actor,
      id: test.id,
      expectedVersion: 1n,
      samples: test.samples,
      measurements: [
        {
          sampleId: 'sample',
          parameterId: 'parameter',
          raw: '9007199254740993.0000000001',
          unit: 'u',
          remarks: 'Exact observed note',
        },
      ],
      requestId: 'test',
    });
    expect(result.measurements[0]?.raw).toBe('9007199254740993.0000000001');
    expect(result.measurements[0]?.remarks).toBe('Exact observed note');
    await expect(
      useCase.execute({
        actor,
        id: test.id,
        expectedVersion: 1n,
        samples: test.samples,
        measurements: [],
        requestId: 'stale',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
  });

  it.each(['true', 'false'])('persists TEXT observation %s as text', async (raw) => {
    const repository = new MemoryRepository();
    repository.value = {
      ...test,
      context: {
        ...test.context,
        parameters: [{ ...test.context.parameters[0]!, dataType: 'TEXT', unit: null }],
      },
    };
    const result = await new SaveMeasurementsUseCase(repository).execute({
      actor,
      id: test.id,
      expectedVersion: 1n,
      samples: test.samples,
      measurements: [{ sampleId: 'sample', parameterId: 'parameter', raw, unit: null }],
      requestId: `text-${raw}`,
    });
    expect(result.measurements[0]?.raw).toBe(raw);
    expect(typeof result.measurements[0]?.raw).toBe('string');
  });

  it('rejects values that are not booleans for a BOOLEAN parameter', async () => {
    const repository = new MemoryRepository();
    repository.value = {
      ...test,
      context: {
        ...test.context,
        parameters: [{ ...test.context.parameters[0]!, dataType: 'BOOLEAN', unit: null }],
      },
    };
    await expect(
      new SaveMeasurementsUseCase(repository).execute({
        actor,
        id: test.id,
        expectedVersion: 1n,
        samples: test.samples,
        measurements: [{ sampleId: 'sample', parameterId: 'parameter', raw: 'yes', unit: null }],
        requestId: 'boolean-invalid',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

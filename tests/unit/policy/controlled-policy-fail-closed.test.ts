import { describe, expect, it } from 'vitest';
import { ApproveLabTestUseCase } from '../../../src/modules/laboratory/application/approve-lab-test.js';
import { CreateRetestUseCase } from '../../../src/modules/laboratory/application/create-retest.js';
import type { LabRepository } from '../../../src/modules/laboratory/ports/repository.js';
import type {
  ControlledLabSources,
  LabApprovalPolicy,
  RetestPolicy,
} from '../../../src/modules/laboratory/ports/controlled-sources.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
import { validateMeasurement } from '../../../src/modules/laboratory/domain/measurement.js';
import { PostgresControlledLabSources } from '../../../src/modules/laboratory/infrastructure/postgres-controlled-sources.js';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import type { ReceivingRepository } from '../../../src/modules/quarantine/receiving/ports/repository.js';
import type { ReceivingItem } from '../../../src/modules/quarantine/receiving/domain/receiving-item.js';
import { ApproveInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/approve-inspection.js';
import type { InspectionRepository } from '../../../src/modules/quarantine/inspection/ports/repository.js';
import type { Inspection } from '../../../src/modules/quarantine/inspection/domain/inspection.js';
import { SupersedeVersionUseCase } from '../../../src/modules/documents/application/supersede-version.js';
import type { DocumentRepository } from '../../../src/modules/documents/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const AUTHOR_ID = '01900000-0000-7000-8000-0000000000a1';
const APPROVER_ID = '01900000-0000-7000-8000-0000000000a2';

function labActor(): ActorContext {
  return {
    id: APPROVER_ID,
    accountState: 'ACTIVE',
    roles: ['MANAGER'],
    permissions: [
      { code: 'PERM-LAB-APPROVE', scopes: ['GLOBAL'] },
      { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
      { code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] },
    ],
  };
}

function labTest(): LabTest {
  return {
    id: '01900000-0000-7000-8000-0000000000b1',
    labTestNo: 'TEST-ONLY-001',
    state: 'UNDER_REVIEW',
    scientificResult: null,
    authorId: AUTHOR_ID,
    createdBy: AUTHOR_ID,
    version: 3n,
    context: {
      templateVersionId: 'template-version-1',
      versionNo: 'v1',
      methodReference: 'TEST-ONLY-METHOD',
      sourceReference: 'TEST-ONLY-SOURCE',
      contentHash: 'TEST-ONLY-HASH',
      requirementsReference: 'TEST-ONLY-SOURCE',
      source: {},
      documents: [],
      equipment: [],
      parameters: [
        {
          id: 'parameter-1',
          code: 'obs',
          label: 'Observation',
          dataType: 'NUMERIC',
          unit: 'mg',
          required: true,
          sourceReference: 'TEST-ONLY-SOURCE',
          criteria: { reference: 'fixture-only' },
        },
      ],
    },
    samples: [{ id: 'sample-1', identifier: 'sample-1' }],
    measurements: [],
    originalTestId: null,
    retestSequence: 0,
    retestReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    submittedAt: null,
    reviewStartedAt: null,
    approvedAt: null,
  };
}

function labRepository(current: LabTest): LabRepository {
  return {
    async get() {
      return current;
    },
    async list() {
      return [current];
    },
    async create(test: LabTest) {
      return test;
    },
    async history() {
      return [];
    },
    async save(_previous: LabTest, next: LabTest) {
      return next;
    },
  };
}

const matchingSources: ControlledLabSources = {
  async resolve(templateVersionId: string) {
    return { ...labTest().context, templateVersionId };
  },
  async listApprovedTemplates() {
    return [];
  },
  async validateExecution() {},
  async evaluate(test: LabTest) {
    return {
      result: 'PASS' as const,
      sourceReference: test.context.sourceReference,
      contentHash: test.context.contentHash,
    };
  },
};

const explodingSources: ControlledLabSources = {
  async resolve() {
    throw new Error('must not be called when policy denies');
  },
  async listApprovedTemplates(): Promise<never> {
    throw new Error('must not be called when policy denies');
  },
  async validateExecution() {
    throw new Error('must not be called when policy denies');
  },
  async evaluate() {
    throw new Error('must not be called when policy denies');
  },
};

describe('controlled policy fail-closed defaults (R-007)', () => {
  it('lab approval denies by default even for a fully authorized non-author approver', async () => {
    await expect(
      new ApproveLabTestUseCase(labRepository(labTest()), explodingSources).execute({
        actor: labActor(),
        id: labTest().id,
        expectedVersion: 3n,
        requestId: 'req-lab-approve-deny',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('lab approval proceeds only with an explicitly supplied approval policy', async () => {
    const allow: LabApprovalPolicy = { authorize: async () => {} };
    const saved = await new ApproveLabTestUseCase(
      labRepository(labTest()),
      matchingSources,
      allow,
    ).execute({
      actor: labActor(),
      id: labTest().id,
      expectedVersion: 3n,
      requestId: 'req-lab-approve-allow',
    });
    expect(saved.state).toBe('APPROVED');
    expect(saved.scientificResult).toBe('PASS');
  });

  it('retest creation denies by default and never invents sequence authority', async () => {
    await expect(
      new CreateRetestUseCase(labRepository(labTest()), explodingSources).execute({
        actor: labActor(),
        originalId: labTest().id,
        reason: 'suspected contamination, supervisor requested repeat',
        requestId: 'req-retest-deny',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('retest creation proceeds only with an explicitly supplied retest policy', async () => {
    const allow: RetestPolicy = {
      authorize: async () => ({
        sequence: 1,
        labTestNo: 'TEST-ONLY-002',
        templateVersionId: 'template-version-1',
      }),
    };
    const next = await new CreateRetestUseCase(
      labRepository(labTest()),
      matchingSources,
      allow,
    ).execute({
      actor: labActor(),
      originalId: labTest().id,
      reason: 'suspected contamination, supervisor requested repeat',
      requestId: 'req-retest-allow',
    });
    expect(next.retestSequence).toBe(1);
    expect(next.originalTestId).toBe(labTest().id);
    expect(next.scientificResult).toBeNull();
  });

  it('release denies by default even when inspection PASS is recorded', async () => {
    const item: ReceivingItem = {
      id: '01900000-0000-7000-8000-0000000000c1',
      receivingNo: 'RCV-1',
      docNo: 'DOC-1',
      itemCode: 'ITEM-1',
      description: 'Material',
      lot: 'LOT-1',
      qty: '2',
      receivingDate: new Date('2026-01-01T00:00:00Z'),
      workflowState: 'RELEASE_PENDING',
      inspectionResult: 'PASS',
      releaseSystem: false,
      createdBy: APPROVER_ID,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      version: 5n,
    };
    const repository: ReceivingRepository = {
      async get() {
        return item;
      },
      async list() {
        return [item];
      },
      async create() {
        return item;
      },
      async updateDraft() {
        return item;
      },
      async transition() {
        throw new Error('must not transition when policy denies');
      },
    };
    const actor: ActorContext = {
      id: APPROVER_ID,
      accountState: 'ACTIVE',
      roles: ['MANAGER'],
      permissions: [{ code: 'PERM-QUAR-RELEASE', scopes: ['GLOBAL'] }],
    };
    await expect(
      new ReleaseReceivingUseCase(repository).execute({
        actor,
        id: item.id,
        expectedVersion: 5n,
        requestId: 'req-release-deny',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('inspection approval denies by default even in UNDER_REVIEW with a recorded result', async () => {
    const inspection = {
      id: '01900000-0000-7000-8000-0000000000d1',
      inspectionNo: 'INSP-1',
      receiving: {
        receivingId: 'r1',
        receivingNo: 'RCV-1',
        docNo: 'DOC-1',
        itemCode: 'ITEM-1',
        description: 'Material',
        lot: 'LOT-1',
        qty: '2',
        receivingDate: new Date('2026-01-01T00:00:00Z'),
      },
      template: {
        templateId: 't1',
        templateVersionId: 'tv1',
        versionNo: 'v1',
        templateSnapshot: {},
        approved: true,
      },
      state: 'UNDER_REVIEW',
      finalResult: 'PASS',
      authorId: AUTHOR_ID,
      results: [],
      version: 4n,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as Inspection;
    const repository: InspectionRepository = {
      async get() {
        return inspection;
      },
      async list() {
        return [inspection];
      },
      async create() {
        return inspection;
      },
      async saveDraft() {
        throw new Error('must not save drafts in this policy test');
      },
      async transition() {
        throw new Error('must not transition when policy denies');
      },
    };
    const actor: ActorContext = {
      id: APPROVER_ID,
      accountState: 'ACTIVE',
      roles: ['MANAGER'],
      permissions: [
        { code: 'PERM-INSP-APPROVE', scopes: ['GLOBAL'] },
        { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
      ],
    };
    await expect(
      new ApproveInspectionUseCase(repository).execute({
        actor,
        id: inspection.id,
        expectedVersion: 4n,
        requestId: 'req-inspection-approve-deny',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('document supersede denies by default until the effective-date policy is approved', async () => {
    const repository = {
      async createDocument() {
        throw new Error('must not be called when policy denies');
      },
      async getDocument() {
        return undefined;
      },
      async listDocuments() {
        return [];
      },
      async createVersion() {
        throw new Error('must not be called when policy denies');
      },
      async getVersion() {
        return undefined;
      },
      async listVersions() {
        return [];
      },
      async updateDraft() {
        throw new Error('must not be called when policy denies');
      },
      async recordReview() {
        throw new Error('must not be called when policy denies');
      },
      async transition() {
        throw new Error('must not be called when policy denies');
      },
      async supersede() {
        throw new Error('must not supersede when policy denies');
      },
    } as unknown as DocumentRepository;
    const actor: ActorContext = {
      id: APPROVER_ID,
      accountState: 'ACTIVE',
      roles: ['MANAGER'],
      permissions: [{ code: 'PERM-DOC-SUPERSEDE', scopes: ['GLOBAL'] }],
    };
    await expect(
      new SupersedeVersionUseCase(repository).execute({
        actor,
        currentVersionId: 'v-current',
        currentExpectedVersion: 4n,
        replacementVersionId: 'v-replacement',
        replacementExpectedVersion: 2n,
        effectiveAt: new Date('2026-02-01T00:00:00Z'),
        requestId: 'req-supersede-deny',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('document supersede requires an explicit effective date even with an approved policy', async () => {
    const repository = {
      async createDocument() {
        throw new Error('not used');
      },
      async getDocument() {
        return undefined;
      },
      async listDocuments() {
        return [];
      },
      async createVersion() {
        throw new Error('not used');
      },
      async getVersion() {
        return undefined;
      },
      async listVersions() {
        return [];
      },
      async updateDraft() {
        throw new Error('not used');
      },
      async recordReview() {
        throw new Error('not used');
      },
      async transition() {
        throw new Error('not used');
      },
      async supersede() {
        throw new Error('must not supersede without an effective date');
      },
    } as unknown as DocumentRepository;
    const actor: ActorContext = {
      id: APPROVER_ID,
      accountState: 'ACTIVE',
      roles: ['MANAGER'],
      permissions: [{ code: 'PERM-DOC-SUPERSEDE', scopes: ['GLOBAL'] }],
    };
    await expect(
      new SupersedeVersionUseCase(repository, { isApproved: () => true }).execute({
        actor,
        currentVersionId: 'v-current',
        currentExpectedVersion: 4n,
        replacementVersionId: 'v-replacement',
        replacementExpectedVersion: 2n,
        requestId: 'req-supersede-no-date',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('controlled scientific evaluation never invents PASS/FAIL without an approved source', async () => {
    const sources = new PostgresControlledLabSources({} as never);
    await expect((sources as ControlledLabSources).evaluate(labTest())).rejects.toMatchObject({
      code: 'AUTHZ_DENIED',
    });
  });

  it('raw numeric observations are preserved exactly with no invented rounding', () => {
    const parameter = {
      id: 'parameter-1',
      code: 'obs',
      label: 'Observation',
      dataType: 'NUMERIC' as const,
      unit: 'mg',
      required: true,
      sourceReference: 'TEST-ONLY-SOURCE',
      criteria: { reference: 'fixture-only' },
    };
    const raw = '0.30000000000000004';
    expect(
      validateMeasurement(
        { sampleId: 'sample-1', parameterId: 'parameter-1', raw, unit: 'mg' },
        parameter,
      ).raw,
    ).toBe(raw);
  });
});

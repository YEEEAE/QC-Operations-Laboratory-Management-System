import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { RejectLabTestUseCase } from '../../../src/modules/laboratory/application/reject-lab-test.js';
import { ApproveLabTestUseCase } from '../../../src/modules/laboratory/application/approve-lab-test.js';
import { CreateRetestUseCase } from '../../../src/modules/laboratory/application/create-retest.js';
import { assertRetestLink } from '../../../src/modules/laboratory/domain/retest.js';
import type { LabRepository, Mutation } from '../../../src/modules/laboratory/ports/repository.js';
import type {
  ControlledLabSources,
  LabApprovalPolicy,
  LabRejectPolicy,
  RetestPolicy,
} from '../../../src/modules/laboratory/ports/controlled-sources.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';

const AUTHOR_ID = '01900000-0000-7000-8000-0000000000a1';
const DECIDER_ID = '01900000-0000-7000-8000-0000000000a2';

function authorActor(): ActorContext {
  return {
    id: AUTHOR_ID,
    accountState: 'ACTIVE',
    roles: ['EMPLOYEE'],
    permissions: [
      { code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] },
      { code: 'PERM-LAB-REJECT', scopes: ['GLOBAL'] },
      { code: 'PERM-APR-REJECT', scopes: ['GLOBAL'] },
    ],
  };
}

function deciderActor(): ActorContext {
  return {
    id: DECIDER_ID,
    accountState: 'ACTIVE',
    roles: ['MANAGER'],
    permissions: [
      { code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] },
      { code: 'PERM-LAB-REJECT', scopes: ['GLOBAL'] },
      { code: 'PERM-APR-REJECT', scopes: ['GLOBAL'] },
      { code: 'PERM-LAB-APPROVE', scopes: ['GLOBAL'] },
      { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
      { code: 'PERM-LAB-RETEST', scopes: ['GLOBAL'] },
      { code: 'PERM-LAB-AUTHORIZE-RETEST', scopes: ['GLOBAL'] },
    ],
  };
}

function labTest(overrides: Partial<LabTest> = {}): LabTest {
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
    rejectedAt: null,
    ...overrides,
  };
}

function labRepository(current: LabTest): LabRepository & {
  mutations: Mutation[];
  saves: [LabTest, LabTest][];
} {
  const mutations: Mutation[] = [];
  const saves: [LabTest, LabTest][] = [];
  return {
    mutations,
    saves,
    async get() {
      return current;
    },
    async list() {
      return { items: [current], total: 1 };
    },
    async workload() {
      return {
        total: 1,
        rows: [
          {
            id: current.id,
            labTestNo: current.labTestNo,
            state: current.state,
            updatedAt: new Date(current.updatedAt),
          },
        ],
      };
    },
    async create(test: LabTest) {
      return test;
    },
    async history() {
      return [];
    },
    async save(previous: LabTest, next: LabTest, mutation: Mutation) {
      saves.push([previous, next]);
      mutations.push(mutation);
      return next;
    },
    // QC-DATA-003 run evidence is not exercised by this policy suite.
    async linkRunEquipment() {},
    async listRunEquipment() {
      return [];
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

describe('lab test reject transition (TR-LAB-007)', () => {
  it('moves UNDER_REVIEW to REJECTED with a supplied policy, preserving measurements and recording reason + audit mutation', async () => {
    const current = labTest();
    const repository = labRepository(current);
    const allow: LabRejectPolicy = { authorize: async () => {} };
    const saved = await new RejectLabTestUseCase(
      repository,
      allow,
      () => new Date('2026-01-03T00:00:00.000Z'),
    ).execute({
      actor: deciderActor(),
      id: current.id,
      expectedVersion: 3n,
      reason: 'measurement record incomplete for the approved method',
      requestId: 'req-lab-reject-allow',
    });
    expect(saved.state).toBe('REJECTED');
    expect(saved.version).toBe(4n);
    expect(saved.rejectedAt).toBe('2026-01-03T00:00:00.000Z');
    // Reject never destroys the submitted scientific record.
    expect(repository.saves[0]?.[1].measurements).toBe(current.measurements);
    expect(repository.saves[0]?.[1].samples).toBe(current.samples);
    expect(repository.saves[0]?.[1].scientificResult).toBe(current.scientificResult);
    expect(repository.mutations[0]).toMatchObject({
      action: 'REJECT',
      reason: 'measurement record incomplete for the approved method',
      requestId: 'req-lab-reject-allow',
    });
  });

  it('denies reject without an approved policy source (POLICY / SCIENTIFIC SOURCE REQUIRED)', async () => {
    const repository = labRepository(labTest());
    await expect(
      new RejectLabTestUseCase(repository).execute({
        actor: deciderActor(),
        id: labTest().id,
        expectedVersion: 3n,
        reason: 'documented reason',
        requestId: 'req-lab-reject-deny',
      }),
    ).rejects.toMatchObject({ code: 'POLICY_SOURCE_REQUIRED' });
    expect(repository.saves).toHaveLength(0);
  });

  it('requires a reason, enforces SoD against the author, and rejects stale versions', async () => {
    const allow: LabRejectPolicy = { authorize: async () => {} };
    const useCase = new RejectLabTestUseCase(labRepository(labTest()), allow);
    await expect(
      useCase.execute({
        actor: deciderActor(),
        id: labTest().id,
        expectedVersion: 3n,
        reason: '   ',
        requestId: 'req-lab-reject-noreason',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(
      useCase.execute({
        actor: authorActor(),
        id: labTest().id,
        expectedVersion: 3n,
        reason: 'author attempts to reject own submission',
        requestId: 'req-lab-reject-sod',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
    await expect(
      useCase.execute({
        actor: deciderActor(),
        id: labTest().id,
        expectedVersion: 1n,
        reason: 'stale intent',
        requestId: 'req-lab-reject-stale',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
  });

  it('denies reject outside UNDER_REVIEW and from REJECTED (terminal)', async () => {
    const allow: LabRejectPolicy = { authorize: async () => {} };
    for (const state of ['DRAFT', 'SUBMITTED', 'REJECTED', 'APPROVED'] as const) {
      await expect(
        new RejectLabTestUseCase(labRepository(labTest({ state })), allow).execute({
          actor: deciderActor(),
          id: labTest().id,
          expectedVersion: 3n,
          reason: 'documented reason',
          requestId: 'req-lab-reject-state',
        }),
      ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    }
  });

  it('denies reject when the reject permissions are missing', async () => {
    const allow: LabRejectPolicy = { authorize: async () => {} };
    const actor = deciderActor();
    actor.permissions = [{ code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] }];
    await expect(
      new RejectLabTestUseCase(labRepository(labTest()), allow).execute({
        actor,
        id: labTest().id,
        expectedVersion: 3n,
        reason: 'documented reason',
        requestId: 'req-lab-reject-noperm',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });
});

describe('retest governance (TR-RETEST-003, BR-LAB-014..018 guards)', () => {
  it('rejects a retest-of-a-retest chain link at the domain boundary', () => {
    const original = labTest({ originalTestId: '01900000-0000-7000-8000-0000000000b9' });
    const next = labTest({
      id: '01900000-0000-7000-8000-0000000000c9',
      originalTestId: original.id,
      retestSequence: 2,
      retestReason: 'fixture reason',
    });
    expect(() => assertRetestLink(original, next)).toThrowError(AppError);
  });

  it('creates a retest from a REJECTED original without mutating the original record', async () => {
    const original = labTest({ state: 'REJECTED', scientificResult: 'FAIL' });
    const repository = labRepository(original);
    let created: LabTest | undefined;
    repository.create = async (test: LabTest) => {
      created = test;
      return test;
    };
    const allow: RetestPolicy = {
      authorize: async () => ({
        sequence: 1,
        labTestNo: 'TEST-ONLY-002',
        templateVersionId: 'template-version-1',
      }),
    };
    await new CreateRetestUseCase(repository, matchingSources, allow).execute({
      actor: deciderActor(),
      originalId: original.id,
      reason: 'suspected contamination, supervisor requested repeat',
      requestId: 'req-retest-rejected',
    });
    expect(created?.originalTestId).toBe(original.id);
    expect(created?.retestSequence).toBe(1);
    expect(created?.state).toBe('DRAFT');
    expect(created?.scientificResult).toBeNull();
    expect(repository.saves).toHaveLength(0);
  });

  it('denies retest for non-authority actors even with both permissions', async () => {
    const allow: RetestPolicy = {
      authorize: async () => ({
        sequence: 1,
        labTestNo: 'TEST-ONLY-002',
        templateVersionId: 'template-version-1',
      }),
    };
    const employee = deciderActor();
    employee.roles = ['EMPLOYEE'];
    await expect(
      new CreateRetestUseCase(labRepository(labTest()), matchingSources, allow).execute({
        actor: employee,
        originalId: labTest().id,
        reason: 'documented reason',
        requestId: 'req-retest-nonauthority',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });
});

describe('scientific result boundary on approval (BR-LAB-003)', () => {
  it('stage-1 approval stores only the server-side evaluated result, never a client-supplied verdict (QC-100-FINAL-004)', async () => {
    const repository = labRepository(labTest());
    const allow: LabApprovalPolicy = { authorize: async () => {} };
    const holdSources: ControlledLabSources = {
      ...matchingSources,
      async evaluate(test: LabTest) {
        return {
          result: 'HOLD' as const,
          sourceReference: test.context.sourceReference,
          contentHash: test.context.contentHash,
        };
      },
    };
    const saved = await new ApproveLabTestUseCase(repository, holdSources, allow).execute({
      actor: deciderActor(),
      id: labTest().id,
      expectedVersion: 3n,
      requestId: 'req-lab-approve-hold',
    });
    expect(saved.state).toBe('PENDING_QCM_APPROVAL');
    expect(saved.scientificResult).toBe('HOLD');
  });
});

describe('laboratory evidence delivery wiring (QC-CLOSURE-007)', () => {
  it('the lab review workspace discloses the reject contract without faking client authority', () => {
    const source = readFileSync(
      new URL('../../../src/pages/laboratory/tests/[labTestId]/review.astro', import.meta.url),
      'utf8',
    );
    expect(source).toContain('POLICY / SCIENTIFIC SOURCE REQUIRED');
    expect(source).toContain('TR-LAB-007');
    // The page renders no reject control and accepts no scientific verdict from
    // the client: reject enforcement and the official result stay server-side.
    // QC-100-FINAL-004 adds the two-stage approval/return rail to this page;
    // its authority is asserted against src/actions/laboratory.ts below, so the
    // workspace still cannot fake client authority.
    expect(source).not.toContain('laboratory.reject');
    expect(source).not.toContain('scientificResult');
  });

  it('the laboratory actions surface exposes the policy-gated reject transition', () => {
    const source = readFileSync(
      new URL('../../../src/actions/laboratory.ts', import.meta.url),
      'utf8',
    );
    expect(source).toContain('laboratoryActionDependencies().reject.execute');
  });
});

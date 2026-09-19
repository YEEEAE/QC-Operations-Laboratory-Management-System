import { describe, expect, it } from 'vitest';
import { ApproveLabTestUseCase } from '../../../src/modules/laboratory/application/approve-lab-test.js';
import { CreateRetestUseCase } from '../../../src/modules/laboratory/application/create-retest.js';
import { RejectLabTestUseCase } from '../../../src/modules/laboratory/application/reject-lab-test.js';
import { ReturnLabTestUseCase } from '../../../src/modules/laboratory/application/return-lab-test.js';
import { ReviewLabTestUseCase } from '../../../src/modules/laboratory/application/review-lab-test.js';
import { SubmitLabTestUseCase } from '../../../src/modules/laboratory/application/submit-lab-test.js';
import { transitionLab } from '../../../src/modules/laboratory/domain/lab-state.js';
import { assertRetestLink } from '../../../src/modules/laboratory/domain/retest.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
import type {
  ControlledLabSources,
  RetestPolicy,
} from '../../../src/modules/laboratory/ports/controlled-sources.js';
import type { LabRepository } from '../../../src/modules/laboratory/ports/repository.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext, PermissionGrant } from '../../../src/shared/authorization/types.js';

const AUTHOR_ID = '01900000-0000-7000-8000-0000000000a1';
const REVIEWER_ID = '01900000-0000-7000-8000-0000000000a2';

const author = (): ActorContext => ({
  id: AUTHOR_ID,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-LAB-VIEW', scopes: ['OWN'] },
    { code: 'PERM-LAB-EDIT-DRAFT', scopes: ['OWN'] },
    { code: 'PERM-LAB-ENTER-MEASUREMENT', scopes: ['OWN'] },
    { code: 'PERM-LAB-SUBMIT', scopes: ['OWN'] },
  ],
});

const p05Reviewer = (permissions: readonly PermissionGrant[]): ActorContext => ({
  id: REVIEWER_ID,
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [{ code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] }, ...permissions],
});

const reviewerActor = (): ActorContext =>
  p05Reviewer([
    { code: 'PERM-LAB-REVIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-APR-REVIEW', scopes: ['GLOBAL'] },
  ]);
const approverActor = (): ActorContext =>
  p05Reviewer([
    { code: 'PERM-LAB-APPROVE', scopes: ['GLOBAL'] },
    { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
  ]);
const rejecterActor = (): ActorContext =>
  p05Reviewer([
    { code: 'PERM-LAB-REJECT', scopes: ['GLOBAL'] },
    { code: 'PERM-APR-REJECT', scopes: ['GLOBAL'] },
  ]);
const retesterActor = (): ActorContext =>
  p05Reviewer([
    { code: 'PERM-LAB-RETEST', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-AUTHORIZE-RETEST', scopes: ['GLOBAL'] },
  ]);

function labTest(state: LabTest['state'] = 'DRAFT'): LabTest {
  return {
    id: '01900000-0000-7000-8000-0000000000b1',
    labTestNo: 'TEST-ONLY-001',
    state,
    scientificResult: null,
    authorId: AUTHOR_ID,
    createdBy: AUTHOR_ID,
    version: 1n,
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
    measurements: [
      {
        id: 'measurement-1',
        sampleId: 'sample-1',
        parameterId: 'parameter-1',
        raw: '1',
        unit: 'mg',
        enteredBy: AUTHOR_ID,
        enteredAt: '2026-01-01T00:00:00.000Z',
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
}

interface PersistedMutation {
  action: string;
  reason?: string;
}

class MemoryRepository implements LabRepository {
  mutations: PersistedMutation[] = [];
  constructor(public value: LabTest) {}
  async get() {
    return this.value;
  }
  async list() {
    return [this.value];
  }
  async create(test: LabTest, mutation: PersistedMutation) {
    this.mutations.push(mutation);
    return test;
  }
  async history() {
    return [];
  }
  async save(_previous: LabTest, next: LabTest, mutation: PersistedMutation) {
    this.mutations.push(mutation);
    this.value = next;
    return next;
  }
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
      result: 'HOLD' as const,
      sourceReference: test.context.sourceReference,
      contentHash: test.context.contentHash,
    };
  },
};

describe('laboratory workflow transitions (TR-LAB-002..006)', () => {
  it('submit: DRAFT → SUBMITTED with complete measurements and audit mutation', async () => {
    const repository = new MemoryRepository(labTest('DRAFT'));
    const saved = await new SubmitLabTestUseCase(
      repository,
      matchingSources,
      eligibleAssets,
    ).execute({ actor: author(), id: labTest().id, expectedVersion: 1n, requestId: 'r-submit' });
    expect(saved.state).toBe('SUBMITTED');
    expect(repository.mutations.at(-1)?.action).toBe('SUBMIT');
  });

  it('submit is denied when equipment eligibility verification fails (fail-closed)', async () => {
    const repository = new MemoryRepository(labTest('DRAFT'));
    await expect(
      new SubmitLabTestUseCase(repository, matchingSources, failingAssets).execute({
        actor: author(),
        id: labTest().id,
        expectedVersion: 1n,
        requestId: 'r-submit-equipment',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repository.value.state).toBe('DRAFT');
  });

  it('review: SUBMITTED → UNDER_REVIEW with SoD denying the author', async () => {
    const submitted = labTest('SUBMITTED');
    const repository = new MemoryRepository(submitted);
    const authorReviewer: ActorContext = {
      ...author(),
      permissions: [
        ...author().permissions,
        { code: 'PERM-LAB-REVIEW', scopes: ['GLOBAL'] },
        { code: 'PERM-APR-REVIEW', scopes: ['GLOBAL'] },
      ],
    };
    await expect(
      new ReviewLabTestUseCase(repository).execute({
        actor: authorReviewer,
        id: submitted.id,
        expectedVersion: 1n,
        requestId: 'r-review-self',
      }),
    ).rejects.toMatchObject({ code: expect.stringMatching(/^AUTHZ_/) });
    const saved = await new ReviewLabTestUseCase(repository).execute({
      actor: reviewerActor(),
      id: submitted.id,
      expectedVersion: 1n,
      requestId: 'r-review',
    });
    expect(saved.state).toBe('UNDER_REVIEW');
  });

  it('return: UNDER_REVIEW → RETURNED requires a reason recorded on the mutation', async () => {
    const repository = new MemoryRepository(labTest('UNDER_REVIEW'));
    const returner = p05Reviewer([{ code: 'PERM-LAB-RETURN', scopes: ['GLOBAL'] }]);
    await expect(
      new ReturnLabTestUseCase(repository).execute({
        actor: returner,
        id: labTest().id,
        expectedVersion: 1n,
        reason: '   ',
        requestId: 'r-return-empty',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    const saved = await new ReturnLabTestUseCase(repository).execute({
      actor: returner,
      id: labTest().id,
      expectedVersion: 1n,
      reason: 'Measurement remarks incomplete',
      requestId: 'r-return',
    });
    expect(saved.state).toBe('RETURNED');
    expect(repository.mutations.at(-1)?.reason).toBe('Measurement remarks incomplete');
  });

  it('approve (stage-1): UNDER_REVIEW → PENDING_QCM_APPROVAL stores the provider-evaluated result without locking (QC-100-FINAL-004)', async () => {
    const repository = new MemoryRepository(labTest('UNDER_REVIEW'));
    const saved = await new ApproveLabTestUseCase(repository, matchingSources).execute({
      actor: approverActor(),
      id: labTest().id,
      expectedVersion: 1n,
      requestId: 'r-approve',
    });
    expect(saved.state).toBe('PENDING_QCM_APPROVAL');
    expect(saved.scientificResult).toBe('HOLD');
    // Stage-1 is a workflow event, not the final approval: approvedAt stays
    // empty until the QCM final approval with the binding e-signature.
    expect(saved.approvedAt).toBeNull();
  });

  it('approve denies a non-P-05 authority even with both permissions', async () => {
    const repository = new MemoryRepository(labTest('UNDER_REVIEW'));
    await expect(
      new ApproveLabTestUseCase(repository, matchingSources).execute({
        actor: {
          id: REVIEWER_ID,
          accountState: 'ACTIVE',
          roles: ['EMPLOYEE'],
          permissions: [
            { code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] },
            { code: 'PERM-LAB-APPROVE', scopes: ['GLOBAL'] },
            { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
          ],
        },
        id: labTest().id,
        expectedVersion: 1n,
        requestId: 'r-approve-denied',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repository.value.state).toBe('UNDER_REVIEW');
  });
});

const eligibleAssets = { verify: async () => {} };
const failingAssets = {
  verify: async () => {
    throw new AppError('AUTHZ_DENIED', { userSafe: true });
  },
};

describe('lab reject transition (TR-LAB-007)', () => {
  it('state machine maps UNDER_REVIEW → REJECTED and keeps REJECTED terminal', () => {
    expect(transitionLab('UNDER_REVIEW', 'REJECT')).toBe('REJECTED');
    for (const action of ['SAVE', 'SUBMIT', 'REVIEW', 'RETURN', 'RESUME', 'APPROVE'] as const) {
      expect(() => transitionLab('REJECTED', action)).toThrowError(AppError);
    }
  });

  it('default wiring is fail-closed: reject decision authority is POLICY_SOURCE_REQUIRED', async () => {
    const repository = new MemoryRepository(labTest('UNDER_REVIEW'));
    await expect(
      new RejectLabTestUseCase(repository).execute({
        actor: rejecterActor(),
        id: labTest().id,
        expectedVersion: 1n,
        reason: 'Raw evidence contradicts the recorded observation',
        requestId: 'r-reject-policy',
      }),
    ).rejects.toMatchObject({ code: 'POLICY_SOURCE_REQUIRED' });
    expect(repository.value.state).toBe('UNDER_REVIEW');
    expect(repository.mutations).toHaveLength(0);
  });

  it('denies reject without a reason before touching authority', async () => {
    const repository = new MemoryRepository(labTest('UNDER_REVIEW'));
    await expect(
      new RejectLabTestUseCase(repository, { authorize: async () => {} }).execute({
        actor: rejecterActor(),
        id: labTest().id,
        expectedVersion: 1n,
        reason: ' ',
        requestId: 'r-reject-noreason',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('denies the author self-rejecting even with both reject permissions (SoD)', async () => {
    const repository = new MemoryRepository(labTest('UNDER_REVIEW'));
    const authorDecider: ActorContext = {
      ...author(),
      permissions: [
        ...author().permissions,
        { code: 'PERM-LAB-REJECT', scopes: ['GLOBAL'] },
        { code: 'PERM-APR-REJECT', scopes: ['GLOBAL'] },
      ],
    };
    await expect(
      new RejectLabTestUseCase(repository, { authorize: async () => {} }).execute({
        actor: authorDecider,
        id: labTest().id,
        expectedVersion: 1n,
        reason: 'reason',
        requestId: 'r-reject-denied',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
  });

  it('an explicitly supplied policy rejects UNDER_REVIEW → REJECTED and preserves measurements', async () => {
    const repository = new MemoryRepository(labTest('UNDER_REVIEW'));
    const saved = await new RejectLabTestUseCase(repository, {
      authorize: async () => {},
    }).execute({
      actor: rejecterActor(),
      id: labTest().id,
      expectedVersion: 1n,
      reason: 'Raw evidence contradicts the recorded observation',
      requestId: 'r-reject-allow',
    });
    expect(saved.state).toBe('REJECTED');
    expect(saved.rejectedAt).not.toBeNull();
    expect(saved.measurements).toHaveLength(1);
    expect(repository.mutations.at(-1)).toMatchObject({
      action: 'REJECT',
      reason: 'Raw evidence contradicts the recorded observation',
    });
  });
});

describe('retest governance (TR-RETEST-003)', () => {
  it('creates a linked retest as a new DRAFT and never mutates the original', async () => {
    const original = { ...labTest('APPROVED'), scientificResult: 'FAIL' as const };
    const repository = new MemoryRepository(original);
    const policy: RetestPolicy = {
      authorize: async ({ original: o }) => ({
        sequence: o.retestSequence + 1,
        labTestNo: `${o.labTestNo}-R1`,
        templateVersionId: o.context.templateVersionId,
      }),
    };
    const retest = await new CreateRetestUseCase(repository, matchingSources, policy).execute({
      actor: retesterActor(),
      originalId: original.id,
      reason: 'Suspected sample contamination; supervisor ordered repeat',
      requestId: 'r-retest',
    });
    expect(retest.state).toBe('DRAFT');
    expect(retest.originalTestId).toBe(original.id);
    expect(retest.retestSequence).toBe(1);
    expect(retest.retestReason).toBe('Suspected sample contamination; supervisor ordered repeat');
    expect(retest.scientificResult).toBeNull();
    expect(retest.measurements).toHaveLength(0);
    expect(repository.mutations.at(-1)?.action).toBe('CREATE_RETEST');
    // Original record and its approved FAIL result are preserved untouched.
    expect(repository.value.state).toBe('APPROVED');
    expect(repository.value.scientificResult).toBe('FAIL');
    expect(repository.value.retestSequence).toBe(0);
  });

  it('requires a non-empty retest reason', async () => {
    const repository = new MemoryRepository(labTest('APPROVED'));
    await expect(
      new CreateRetestUseCase(repository, matchingSources, {
        authorize: async () => ({ sequence: 1, labTestNo: 'X', templateVersionId: 't' }),
      }).execute({
        actor: retesterActor(),
        originalId: labTest().id,
        reason: '   ',
        requestId: 'r-retest-noreason',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('requires P-05 authority; a non-authority holder of both retest permissions is denied', async () => {
    const repository = new MemoryRepository(labTest('APPROVED'));
    await expect(
      new CreateRetestUseCase(repository, matchingSources).execute({
        actor: {
          id: REVIEWER_ID,
          accountState: 'ACTIVE',
          roles: ['EMPLOYEE'],
          permissions: [
            { code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] },
            { code: 'PERM-LAB-RETEST', scopes: ['GLOBAL'] },
            { code: 'PERM-LAB-AUTHORIZE-RETEST', scopes: ['GLOBAL'] },
          ],
        },
        originalId: labTest().id,
        reason: 'reason',
        requestId: 'r-retest-notp05',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('assertRetestLink rejects retests of retests, self-links, and missing reason', () => {
    const original = labTest('APPROVED');
    const retest: LabTest = {
      ...labTest('DRAFT'),
      id: '01900000-0000-7000-8000-0000000000c1',
      originalTestId: original.id,
      retestSequence: 1,
      retestReason: 'reason',
    };
    expect(() => assertRetestLink(original, retest)).not.toThrow();
    expect(() =>
      assertRetestLink({ ...original, originalTestId: 'x', retestSequence: 1 }, retest),
    ).toThrowError(AppError);
    expect(() => assertRetestLink(original, { ...retest, id: original.id })).toThrowError(AppError);
    expect(() => assertRetestLink(original, { ...retest, retestReason: ' ' })).toThrowError(
      AppError,
    );
    expect(() => assertRetestLink(original, { ...retest, retestSequence: 0 })).toThrowError(
      AppError,
    );
  });
});

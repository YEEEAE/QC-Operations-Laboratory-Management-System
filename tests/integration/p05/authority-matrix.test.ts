/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { ApproveInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/approve-inspection.js';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import { ApproveVersionUseCase } from '../../../src/modules/documents/application/approve-version.js';
import { VoidInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/void-inspection.js';
import { VoidVersionUseCase } from '../../../src/modules/documents/application/void-version.js';
import { TransitionFindingUseCase } from '../../../src/modules/quality/findings/application/transition-finding.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

function actor(id: string, roles: string[], permissions: string[]): ActorContext {
  return {
    id,
    accountState: 'ACTIVE',
    roles,
    permissions: permissions.map((code) => ({
      code: code as ActorContext['permissions'][number]['code'],
      scopes: ['GLOBAL'],
    })),
  };
}

const EMPLOYEE = actor('emp-1', ['EMPLOYEE'], ['PERM-INSP-APPROVE', 'PERM-APR-APPROVE']);
const SUPERVISOR = actor('sup-1', ['SUPERVISOR'], [
  'PERM-INSP-APPROVE',
  'PERM-APR-APPROVE',
  'PERM-QUAR-RELEASE',
  'PERM-DOC-APPROVE',
  'PERM-DOC-VOID',
  'PERM-INSP-VOID',
  'PERM-FIND-VOID',
]);
const MANAGER = actor('mgr-1', ['MANAGER'], [
  'PERM-INSP-APPROVE',
  'PERM-APR-APPROVE',
  'PERM-QUAR-RELEASE',
  'PERM-DOC-APPROVE',
  'PERM-DOC-VOID',
  'PERM-INSP-VOID',
  'PERM-FIND-VOID',
]);
const ADMIN_ONLY = actor('adm-1', ['ADMIN'], [
  'PERM-INSP-APPROVE',
  'PERM-APR-APPROVE',
  'PERM-QUAR-RELEASE',
  'PERM-DOC-APPROVE',
  'PERM-DOC-VOID',
  'PERM-INSP-VOID',
  'PERM-FIND-VOID',
]);
const YAZEED = actor('yazeed', ['SYSTEM_OWNER'], [
  'PERM-INSP-APPROVE',
  'PERM-APR-APPROVE',
  'PERM-QUAR-RELEASE',
  'PERM-DOC-APPROVE',
  'PERM-DOC-VOID',
  'PERM-INSP-VOID',
  'PERM-FIND-VOID',
]);
const ADMIN_MANAGER = actor('adm-mgr-1', ['ADMIN', 'MANAGER'], [
  'PERM-INSP-APPROVE',
  'PERM-APR-APPROVE',
  'PERM-QUAR-RELEASE',
  'PERM-DOC-APPROVE',
  'PERM-DOC-VOID',
  'PERM-INSP-VOID',
  'PERM-FIND-VOID',
]);

function inspectionRepo(state = 'UNDER_REVIEW', version = 4n, authorId = 'author-1') {
  const inspection: any = {
    id: 'insp-1',
    inspectionNo: 'INSP-1',
    receiving: {
      receivingId: 'r1',
      receivingNo: 'RCV-1',
      docNo: 'DOC-1',
      itemCode: 'ITEM-1',
      description: 'Material',
      lot: 'LOT-1',
      qty: '2',
      receivingDate: new Date('2026-01-01'),
    },
    template: {
      templateId: 't1',
      templateVersionId: 'tv1',
      versionNo: 'v1',
      templateSnapshot: {},
      approved: true,
    },
    state,
    finalResult: 'PASS',
    authorId,
    results: [],
    version,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return {
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
      return inspection;
    },
    async transition() {
      return { ...inspection, state: 'APPROVED' as const };
    },
  } as any;
}

describe('P-05 authority matrix', () => {
  it.each([
    ['Employee', EMPLOYEE, false],
    ['Supervisor', SUPERVISOR, true],
    ['Manager/QCM', MANAGER, true],
    ['Admin-only', ADMIN_ONLY, false],
    ['yazeed owner', YAZEED, true],
    ['Admin+Manager', ADMIN_MANAGER, true],
  ])('inspection approval for %s resolves to allow=%s', async (_name, currentActor, allowed) => {
    const useCase = new ApproveInspectionUseCase(inspectionRepo());
    if (allowed) {
      await expect(
        useCase.execute({
          actor: currentActor,
          id: 'insp-1',
          expectedVersion: 4n,
          requestId: `req-${currentActor.id}`,
        }),
      ).resolves.toMatchObject({ state: 'APPROVED' });
    } else {
      await expect(
        useCase.execute({
          actor: currentActor,
          id: 'insp-1',
          expectedVersion: 4n,
          requestId: `req-${currentActor.id}`,
        }),
      ).rejects.toMatchObject({ code: expect.stringMatching(/AUTHZ|CONFLICT/) });
    }
  });

  it.each([
    ['Employee', EMPLOYEE, false],
    ['Supervisor', SUPERVISOR, true],
    ['Manager/QCM', MANAGER, true],
    ['Admin-only', ADMIN_ONLY, false],
    ['yazeed owner', YAZEED, true],
    ['Admin+Manager', ADMIN_MANAGER, true],
  ])('release for %s resolves to allow=%s', async (_name, currentActor, allowed) => {
    const item: any = {
      id: 'rcv-1',
      receivingNo: 'RCV-1',
      docNo: 'DOC-1',
      itemCode: 'ITEM-1',
      description: 'Material',
      lot: 'LOT-1',
      qty: '2',
      receivingDate: new Date(),
      workflowState: 'RELEASE_PENDING',
      inspectionResult: 'PASS',
      releaseSystem: false,
      createdBy: 'other-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 5n,
    };
    const repo: any = {
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
        return { ...item, workflowState: 'RELEASED', releaseSystem: true };
      },
    };
    const useCase = new ReleaseReceivingUseCase(repo);
    if (allowed) {
      await expect(
        useCase.execute({
          actor: currentActor,
          id: item.id,
          expectedVersion: 5n,
          requestId: `req-${currentActor.id}`,
        }),
      ).resolves.toMatchObject({ workflowState: 'RELEASED' });
    } else {
      await expect(
        useCase.execute({
          actor: currentActor,
          id: item.id,
          expectedVersion: 5n,
          requestId: `req-${currentActor.id}`,
        }),
      ).rejects.toMatchObject({ code: expect.stringMatching(/AUTHZ|CONFLICT/) });
    }
  });

  it('inspection VOID requires reason and P-05 authority without deleting history', async () => {
    const repo = {
      async get() {
        return {
          id: 'insp-void-1',
          state: 'APPROVED',
          authorId: 'author-1',
          version: 5n,
        };
      },
      async list() {
        return [];
      },
      async create() {
        throw new Error('no create');
      },
      async saveDraft() {
        throw new Error('no draft');
      },
      async transition(input: any) {
        return { id: input.id, state: 'VOID', version: 6n };
      },
    } as any;
    const useCase = new VoidInspectionUseCase(repo);
    await expect(
      useCase.execute({
        actor: ADMIN_ONLY,
        id: 'insp-void-1',
        expectedVersion: 5n,
        reason: 'entered in error',
        requestId: 'req-void-admin',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      useCase.execute({
        actor: MANAGER,
        id: 'insp-void-1',
        expectedVersion: 5n,
        reason: '   ',
        requestId: 'req-void-empty',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(
      useCase.execute({
        actor: MANAGER,
        id: 'insp-void-1',
        expectedVersion: 5n,
        reason: 'entered in error',
        requestId: 'req-void-ok',
      }),
    ).resolves.toMatchObject({ state: 'VOID' });
  });

  it('document approval and VOID preserve P-05 authority', async () => {
    const version: any = {
      id: 'doc-v-1',
      documentId: 'doc-1',
      state: 'IN_REVIEW',
      version: 2n,
      createdBy: 'author-1',
      contentHash: 'hash-1',
    };
    const repo: any = {
      async getVersion() {
        return version;
      },
      async getDocument() {
        return { id: 'doc-1', active: true, ownerId: 'author-1', createdBy: 'author-1', version: 1n };
      },
      async transition(input: any) {
        return { ...version, state: input.toState, version: 3n };
      },
    };
    await expect(
      new ApproveVersionUseCase(repo).execute({
        actor: ADMIN_ONLY,
        versionId: version.id,
        expectedVersion: 2n,
        requestId: 'req-doc-admin',
      }),
    ).rejects.toMatchObject({ code: expect.stringMatching(/AUTHZ|DOMAIN/) });
    await expect(
      new ApproveVersionUseCase(repo).execute({
        actor: SUPERVISOR,
        versionId: version.id,
        expectedVersion: 2n,
        requestId: 'req-doc-sup',
      }),
    ).resolves.toMatchObject({ state: 'APPROVED' });
    await expect(
      new VoidVersionUseCase(repo).execute({
        actor: EMPLOYEE,
        versionId: version.id,
        expectedVersion: 2n,
        reason: 'entered in error',
        requestId: 'req-doc-void-emp',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('finding VOID denies non-authority actors', async () => {
    const repo: any = {
      async get() {
        return { id: 'f-1', state: 'OPEN', ownerId: 'owner-1', createdBy: 'owner-1', version: 1n };
      },
      async transition(input: any) {
        return { id: input.id, state: 'VOID' };
      },
    };
    const useCase = new TransitionFindingUseCase(repo);
    await expect(
      useCase.execute({
        actor: ADMIN_ONLY,
        id: 'f-1',
        expectedVersion: 1n,
        action: 'VOID',
        reason: 'duplicate',
        requestId: 'req-f-void-admin',
      }),
    ).rejects.toMatchObject({ code: expect.stringMatching(/AUTHZ/) });
    await expect(
      useCase.execute({
        actor: MANAGER,
        id: 'f-1',
        expectedVersion: 1n,
        action: 'VOID',
        reason: 'duplicate',
        requestId: 'req-f-void-mgr',
      }),
    ).resolves.toMatchObject({ state: 'VOID' });
  });
});

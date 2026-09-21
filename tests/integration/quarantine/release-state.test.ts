import { describe, expect, it } from 'vitest';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import type { ReceivingRepository } from '../../../src/modules/quarantine/receiving/ports/repository.js';
import type { ReceivingItem } from '../../../src/modules/quarantine/receiving/domain/receiving-item.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: '01900000-0000-7000-8000-000000000001',
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: [{ code: 'PERM-QUAR-RELEASE', scopes: ['GLOBAL'] }],
};
const item = (result: ReceivingItem['inspectionResult'] = 'PASS'): ReceivingItem => ({
  id: '01900000-0000-7000-8000-000000000002',
  receivingNo: 'RCV-1',
  supplier: 'Supplier 1',
  docNo: 'DOC-1',
  itemCode: 'ITEM-1',
  description: 'Material',
  lot: 'LOT-1',
  qty: '2',
  receivingDate: new Date(),
  workflowState: 'RELEASE_PENDING',
  inspectionResult: result,
  releaseSystem: false,
  createdBy: actor.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 5n,
});
function repository(initial: ReceivingItem): ReceivingRepository {
  let current = initial;
  return {
    async get() {
      return current;
    },
    async list() {
      return [current];
    },
    async create() {
      return current;
    },
    async updateDraft() {
      return current;
    },
    async correct() {
      return current;
    },
    async transition(input) {
      current = {
        ...current,
        workflowState: input.action === 'RELEASE' ? 'RELEASED' : current.workflowState,
        releaseSystem: input.action === 'RELEASE',
      };
      return current;
    },
  };
}

describe('Quarantine release system state', () => {
  it('releases PASS under the approved P-05 policy but denies with an explicit deny policy', async () => {
    await expect(
      new ReleaseReceivingUseCase(repository(item()), { canRelease: () => false }).execute({
        actor,
        id: item().id,
        expectedVersion: 5n,
        requestId: 'req-deny',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      new ReleaseReceivingUseCase(repository(item())).execute({
        actor,
        id: item().id,
        expectedVersion: 5n,
        requestId: 'req',
      }),
    ).resolves.toMatchObject({ workflowState: 'RELEASED', releaseSystem: true });
  });
  it('rejects FAIL and stale versions even when a release policy is supplied', async () => {
    await expect(
      new ReleaseReceivingUseCase(repository(item('FAIL')), { canRelease: () => true }).execute({
        actor,
        id: item().id,
        expectedVersion: 5n,
        requestId: 'req',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      new ReleaseReceivingUseCase(repository(item()), { canRelease: () => true }).execute({
        actor,
        id: item().id,
        expectedVersion: 4n,
        requestId: 'req',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    await expect(
      new ReleaseReceivingUseCase(repository(item('HOLD')), { canRelease: () => true }).execute({
        actor,
        id: item().id,
        expectedVersion: 5n,
        requestId: 'req-hold',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      new ReleaseReceivingUseCase(repository(item()), { canRelease: () => true }).execute({
        actor: { ...actor, roles: ['EMPLOYEE'] },
        id: item().id,
        expectedVersion: 5n,
        requestId: 'req-unauthorized',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });
  it('blocks release when the release authority is the inspection author', async () => {
    await expect(
      new ReleaseReceivingUseCase(repository({ ...item(), inspectionAuthorId: actor.id })).execute({
        actor,
        id: item().id,
        expectedVersion: 5n,
        requestId: 'req-sod',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
  });
  it('returns a committed replay for a duplicate release request', async () => {
    const repositoryWithReplay = repository(item());
    repositoryWithReplay.resolveReplay = async () => ({
      ...item(),
      workflowState: 'RELEASED',
      releaseSystem: true,
    });
    await expect(
      new ReleaseReceivingUseCase(repositoryWithReplay).execute({
        actor,
        id: item().id,
        expectedVersion: 5n,
        requestId: 'req-replay',
      }),
    ).resolves.toMatchObject({ workflowState: 'RELEASED', releaseSystem: true });
  });
});

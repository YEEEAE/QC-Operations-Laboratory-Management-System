import { describe, expect, it } from 'vitest';
import { ReleaseReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/release-receiving.js';
import type { ReceivingRepository } from '../../../src/modules/quarantine/receiving/ports/repository.js';
import type { ReceivingItem } from '../../../src/modules/quarantine/receiving/domain/receiving-item.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = { id: '01900000-0000-7000-8000-000000000001', accountState: 'ACTIVE', roles: ['MANAGER'], permissions: [{ code: 'PERM-QUAR-RELEASE', scopes: ['GLOBAL'] }] };
const item = (result: ReceivingItem['inspectionResult'] = 'PASS'): ReceivingItem => ({ id: '01900000-0000-7000-8000-000000000002', receivingNo: 'RCV-1', docNo: 'DOC-1', itemCode: 'ITEM-1', description: 'Material', lot: 'LOT-1', qty: '2', receivingDate: new Date(), workflowState: 'RELEASE_PENDING', inspectionResult: result, releaseSystem: false, createdBy: actor.id, createdAt: new Date(), updatedAt: new Date(), version: 5n });
function repository(initial: ReceivingItem): ReceivingRepository { let current = initial; return { async get() { return current; }, async list() { return [current]; }, async create() { return current; }, async updateDraft() { return current; }, async transition(input) { current = { ...current, workflowState: input.action === 'RELEASE' ? 'RELEASED' : current.workflowState, releaseSystem: input.action === 'RELEASE' }; return current; } }; }

describe('Quarantine release system state', () => {
  it('keeps PASS unreleased until the explicit release policy is approved', async () => {
    await expect(new ReleaseReceivingUseCase(repository(item())).execute({ actor, id: item().id, expectedVersion: 5n, requestId: 'req' })).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(new ReleaseReceivingUseCase(repository(item()), { canRelease: () => true }).execute({ actor, id: item().id, expectedVersion: 5n, requestId: 'req' })).resolves.toMatchObject({ workflowState: 'RELEASED', releaseSystem: true });
  });
  it('rejects FAIL and stale versions even when a release policy is supplied', async () => {
    await expect(new ReleaseReceivingUseCase(repository(item('FAIL')), { canRelease: () => true }).execute({ actor, id: item().id, expectedVersion: 5n, requestId: 'req' })).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(new ReleaseReceivingUseCase(repository(item()), { canRelease: () => true }).execute({ actor, id: item().id, expectedVersion: 4n, requestId: 'req' })).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
  });
});

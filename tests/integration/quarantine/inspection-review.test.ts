import { describe, expect, it } from 'vitest';
import { ApproveInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/approve-inspection.js';
import { ReviewInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/review-inspection.js';
import { ReturnInspectionUseCase } from '../../../src/modules/quarantine/inspection/application/return-inspection.js';
import type { InspectionRepository } from '../../../src/modules/quarantine/inspection/ports/repository.js';
import type { Inspection } from '../../../src/modules/quarantine/inspection/domain/inspection.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const authorId = '01900000-0000-7000-8000-000000000001';
const reviewerId = '01900000-0000-7000-8000-000000000002';
const inspection = (state: Inspection['state'] = 'SUBMITTED'): Inspection => ({ id: '01900000-0000-7000-8000-000000000003', inspectionNo: 'INSP-1', receiving: { receivingId: '01900000-0000-7000-8000-000000000004', receivingNo: 'RCV-1', docNo: 'DOC-1', itemCode: 'ITEM-1', description: 'Material', lot: 'LOT-1', qty: '2', receivingDate: new Date('2026-01-01') }, template: { templateId: '01900000-0000-7000-8000-000000000005', templateVersionId: '01900000-0000-7000-8000-000000000006', versionNo: '1', templateSnapshot: {}, approved: true }, state, finalResult: 'PASS', authorId, results: [{ id: '01900000-0000-7000-8000-000000000007', pointId: '01900000-0000-7000-8000-000000000008', value: 'ok', version: 1n }], version: 2n, createdAt: new Date(), updatedAt: new Date() });
const actor = (id: string): ActorContext => ({ id, accountState: 'ACTIVE', roles: ['SUPERVISOR'], permissions: [{ code: 'PERM-INSP-REVIEW', scopes: ['GLOBAL'] }, { code: 'PERM-APR-REVIEW', scopes: ['GLOBAL'] }, { code: 'PERM-INSP-RETURN', scopes: ['GLOBAL'] }, { code: 'PERM-APR-RETURN', scopes: ['GLOBAL'] }, { code: 'PERM-INSP-APPROVE', scopes: ['GLOBAL'] }, { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] }] });
function repository(initial: Inspection): InspectionRepository { let current = initial; return { async get() { return current; }, async list() { return [current]; }, async create() { return current; }, async saveDraft() { return current; }, async transition(input) { current = { ...current, state: input.action === 'BEGIN_REVIEW' ? 'UNDER_REVIEW' : input.action === 'RETURN' ? 'RETURNED' : 'APPROVED', version: current.version + 1n }; return current; } }; }

describe('Quarantine inspection review and approval', () => {
  it('requires distinct review and approval permissions and blocks self-review', async () => {
    const repo = repository(inspection());
    await expect(new ReviewInspectionUseCase(repo).execute({ actor: actor(authorId), id: inspection().id, expectedVersion: 2n, requestId: 'req' })).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
    await expect(new ReviewInspectionUseCase(repo).execute({ actor: actor(reviewerId), id: inspection().id, expectedVersion: 2n, requestId: 'req' })).resolves.toMatchObject({ state: 'UNDER_REVIEW' });
  });
  it('does not approve without an approved deterministic policy/source gate', async () => {
    const repo = repository({ ...inspection('UNDER_REVIEW'), version: 3n });
    await expect(new ApproveInspectionUseCase(repo).execute({ actor: actor(reviewerId), id: inspection().id, expectedVersion: 3n, requestId: 'req' })).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });
  it('returns with a required reason and preserves the controlled path', async () => {
    const repo = repository({ ...inspection('UNDER_REVIEW'), version: 4n });
    await expect(new ReturnInspectionUseCase(repo).execute({ actor: actor(reviewerId), id: inspection().id, expectedVersion: 4n, reason: 'Correct the evidence', requestId: 'req' })).resolves.toMatchObject({ state: 'RETURNED' });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { ListDocumentReviewQueueUseCase } from '../../../src/modules/documents/application/list-review-queue.js';
import type { DocumentReviewQueueQuery } from '../../../src/modules/documents/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: '01900000-0000-7000-8000-00000000e701',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [
    { code: 'PERM-DOC-REVIEW', scopes: ['OWN'] },
    { code: 'PERM-APR-REVIEW', scopes: ['OWN'] },
  ],
};

describe('document review queue authorization contract', () => {
  it('requires both review grants and limits the requested page', async () => {
    const listForReviewer = vi.fn<DocumentReviewQueueQuery['listForReviewer']>(async () => ({ total: 0, items: [] }));
    const useCase = new ListDocumentReviewQueueUseCase({ listForReviewer });
    await useCase.execute({ actor, limit: 10_000 });
    expect(listForReviewer).toHaveBeenCalledWith({ actorId: actor.id, limit: 100, global: false, own: true });

    expect(() => useCase.execute({ actor: { ...actor, permissions: actor.permissions.slice(0, 1) }, limit: 10 }))
      .toThrow(expect.objectContaining({ code: 'AUTHZ_PERMISSION_MISSING' }));
  });

  it('fails closed for inactive actors and unsupported named scopes', async () => {
    const listForReviewer = vi.fn<DocumentReviewQueueQuery['listForReviewer']>();
    const useCase = new ListDocumentReviewQueueUseCase({ listForReviewer });
    expect(() => useCase.execute({ actor: { ...actor, accountState: 'DISABLED' }, limit: 10 }))
      .toThrow(expect.objectContaining({ code: 'AUTHZ_DENIED' }));
    expect(() => useCase.execute({ actor: { ...actor, permissions: actor.permissions.map((grant) => ({ ...grant, scopes: ['TEAM'] })) as ActorContext['permissions'] }, limit: 10 }))
      .toThrow(expect.objectContaining({ code: 'AUTHZ_SCOPE_DENIED' }));
    expect(listForReviewer).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from 'vitest';
import { AuditQueryService, type AuditQuery, type AuditQueryFilter, type AuditQueryResult } from '../../../src/shared/audit/audit-query';
import type { ActorContext } from '../../../src/shared/authorization/types';

const actor = (permissions: ActorContext['permissions'] = [{ code: 'PERM-ADM-AUDIT-VIEW', scopes: ['GLOBAL'] }]): ActorContext => ({ id: 'u1', accountState: 'ACTIVE', roles: [], permissions });
const event = { id: 'a1', eventNo: 1n, occurredAt: new Date('2026-09-04T08:00:00Z'), actorType: 'USER' as const, actorId: 'u1', subjectType: 'LAB_TEST', subjectId: 't1', action: 'SUBMIT', oldState: 'DRAFT', newState: 'SUBMITTED', reason: undefined, requestId: 'req-1', signatureId: undefined };

class MemoryAuditQuery implements AuditQuery {
  last?: { actorId: string; filter: Record<string, unknown> };
  async list(actorContext: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult> {
    this.last = { actorId: actorContext.id, filter };
    return { events: [event], total: 1 };
  }
}

describe('explicit-permission audit query', () => {
  it('returns safe, read-only audit history and supports composable record filters', async () => {
    const repository = new MemoryAuditQuery();
    const result = await new AuditQueryService(repository).list(actor(), { subjectType: 'LAB_TEST', subjectId: 't1' });
    expect(repository.last).toMatchObject({ actorId: 'u1', filter: { subjectType: 'LAB_TEST', subjectId: 't1' } });
    expect(result.events[0]).not.toHaveProperty('payload');
  });

  it('denies audit viewing without the explicit permission, including Admin role alone', async () => {
    const repository = new MemoryAuditQuery();
    await expect(new AuditQueryService(repository).list({ ...actor([]), roles: ['ADMIN'] }, {})).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });
});

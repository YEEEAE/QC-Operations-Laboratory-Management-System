import { describe, expect, it } from 'vitest';
import {
  AuditQueryService,
  mapAuditRowToView,
  type AuditQuery,
  type AuditQueryFilter,
  type AuditQueryResult,
} from '../../../src/shared/audit/audit-query';
import type { ActorContext } from '../../../src/shared/authorization/types';

const actor = (
  permissions: ActorContext['permissions'] = [{ code: 'PERM-ADM-AUDIT-VIEW', scopes: ['GLOBAL'] }],
): ActorContext => ({ id: 'u1', accountState: 'ACTIVE', roles: [], permissions });
const event = {
  id: 'a1',
  eventNo: 1n,
  occurredAt: new Date('2026-09-04T08:00:00Z'),
  actorType: 'USER' as const,
  actorId: 'u1',
  subjectType: 'LAB_TEST',
  subjectId: 't1',
  action: 'SUBMIT',
  oldState: 'DRAFT',
  newState: 'SUBMITTED',
  reason: undefined,
  requestId: 'req-1',
  signatureId: undefined,
};

class MemoryAuditQuery implements AuditQuery {
  last?: { actorId: string; filter: AuditQueryFilter };
  async list(actorContext: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult> {
    this.last = { actorId: actorContext.id, filter };
    return { events: [event], total: 1, limit: 50, offset: 0 };
  }
}

describe('explicit-permission audit query', () => {
  it('returns safe, read-only audit history and supports composable record filters', async () => {
    const repository = new MemoryAuditQuery();
    const result = await new AuditQueryService(repository).list(actor(), {
      subjectType: 'LAB_TEST',
      subjectId: 't1',
    });
    expect(repository.last).toMatchObject({
      actorId: 'u1',
      filter: { subjectType: 'LAB_TEST', subjectId: 't1' },
    });
    expect(result.events[0]).not.toHaveProperty('payload');
  });

  it('denies audit viewing without the explicit permission, including Admin role alone', async () => {
    const repository = new MemoryAuditQuery();
    await expect(
      new AuditQueryService(repository).list({ ...actor([]), roles: ['ADMIN'] }, {}),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });

  it('rejects an unsafe stored payload before exposing the allowlisted projection', () => {
    expect(() =>
      mapAuditRowToView({
        id: 'event-2',
        event_no: 2n,
        occurred_at: new Date('2026-09-21T00:00:00Z'),
        actor_type: 'USER',
        actor_id: 'u1',
        subject_type: 'DOCUMENT_VERSION',
        subject_id: 'doc-version-1',
        action: 'CORRECT',
        old_state: 'EFFECTIVE',
        new_state: 'SUPERSEDED',
        reason: 'Authorized correction with retained history',
        request_id: 'req-correction',
        signature_id: null,
        payload: { context: [{ token: 'SYNTHETIC_VALUE' }] },
      } as Parameters<typeof mapAuditRowToView>[0]),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_FAILED' }));
  });

  it('rejects a sensitive stored reason before exposing the audit projection', () => {
    expect(() =>
      mapAuditRowToView({
        id: 'event-3',
        event_no: 3n,
        occurred_at: new Date('2026-09-21T00:00:00Z'),
        actor_type: 'USER',
        actor_id: 'u1',
        subject_type: 'DOCUMENT_VERSION',
        subject_id: 'doc-version-1',
        action: 'CORRECT',
        old_state: null,
        new_state: null,
        reason: 'token=SYNTHETIC_VALUE',
        request_id: 'req-correction',
        signature_id: null,
      }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_FAILED' }));
  });

  it('keeps request correlation while structurally dropping a safe payload', () => {
    const projected = mapAuditRowToView({
      id: 'event-2',
      event_no: 2n,
      occurred_at: new Date('2026-09-21T00:00:00Z'),
      actor_type: 'USER',
      actor_id: 'u1',
      subject_type: 'DOCUMENT_VERSION',
      subject_id: 'doc-version-1',
      action: 'CORRECT',
      old_state: 'EFFECTIVE',
      new_state: 'SUPERSEDED',
      reason: 'Authorized correction with retained history',
      request_id: 'req-correction',
      signature_id: null,
      payload: { changed_fields: ['state'], before: { state: 'EFFECTIVE' } },
    });
    expect(projected).toMatchObject({
      subjectType: 'DOCUMENT_VERSION',
      action: 'CORRECT',
      oldState: 'EFFECTIVE',
      newState: 'SUPERSEDED',
      requestId: 'req-correction',
    });
    expect(projected).not.toHaveProperty('payload');
    expect(Object.values(projected).join(' ')).not.toContain('must-not-escape');
  });
});

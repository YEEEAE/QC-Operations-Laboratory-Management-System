import { describe, expect, it } from 'vitest';
import { AuditService } from '../../../src/shared/audit/audit-service';
import type { AuditEventInput } from '../../../src/shared/audit/audit-event';

describe('immutable audit service contract', () => {
  it('captures trusted actor/time correlation fields through the repository', async () => {
    const events: AuditEventInput[] = [];
    const service = new AuditService({
      append: async (event) => {
        events.push(event);
      },
    });
    await service.record({
      actorType: 'USER',
      actorId: 'u1',
      subjectType: 'INSPECTION_REPORT',
      subjectId: 'r1',
      action: 'REVIEW',
      oldState: 'SUBMITTED',
      newState: 'UNDER_REVIEW',
      reason: 'reviewed',
      requestId: 'req-1',
    });
    expect(events[0]).toMatchObject({ actorId: 'u1', action: 'REVIEW', requestId: 'req-1' });
  });
  it('rejects secrets in controlled audit payloads', async () => {
    const service = new AuditService({ append: async () => undefined });
    await expect(
      service.record({
        actorType: 'SYSTEM',
        subjectType: 'X',
        subjectId: 'x',
        action: 'X',
        requestId: 'r',
        payload: { token: 'secret' },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

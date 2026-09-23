import { describe, expect, it } from 'vitest';
import { AuditService } from '../../../src/shared/audit/audit-service';
import {
  assertSafeAuditPayload,
  AUDIT_PAYLOAD_LIMITS,
  type AuditEventInput,
} from '../../../src/shared/audit/audit-event';
import { mapAuditRowToView } from '../../../src/shared/audit/audit-query';

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

  it('rejects sensitive values in the separately stored reason without echoing them', async () => {
    const service = new AuditService({ append: async () => undefined });
    await expect(
      service.record({
        actorType: 'USER',
        subjectType: 'X',
        subjectId: 'x',
        action: 'X',
        requestId: 'request-safe',
        reason: 'Authorization: Bearer SYNTHETIC_VALUE',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it.each([
    { evidence: [{ context: { password: 'SYNTHETIC_VALUE' } }] },
    { evidence: [{ nested: { accessToken: 'SYNTHETIC_VALUE' } }] },
    { evidence: [{ metadata: { authorization: 'SYNTHETIC_VALUE' } }] },
    { evidence: [{ metadata: { value: 'Bearer SYNTHETIC_VALUE' } }] },
    { evidence: [{ contact_email: 'synthetic@example.invalid' }] },
  ])('rejects forbidden nested audit data without echoing it', (payload) => {
    expect(() => assertSafeAuditPayload(payload)).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_FAILED' }),
    );
  });

  it('preserves valid structured evidence and correlation fields unchanged', async () => {
    const payload = {
      schema_version: 1,
      changed_fields: ['state'],
      before: { state: 'DRAFT', version: 2 },
      after: { state: 'SUBMITTED', version: 3 },
      context: [{ requestId: 'req-safe-1', source: 'workflow' }],
    };
    const events: AuditEventInput[] = [];
    await new AuditService({ append: async (event) => void events.push(event) }).record({
      actorType: 'SYSTEM',
      subjectType: 'CHANGE_REQUEST',
      subjectId: 'record-1',
      action: 'SUBMIT',
      requestId: 'req-safe-1',
      payload,
    });
    expect(events[0]?.payload).toBe(payload);
    expect(events[0]?.requestId).toBe('req-safe-1');
    expect(() =>
      assertSafeAuditPayload({ values: Array(AUDIT_PAYLOAD_LIMITS.maxArrayLength).fill('x') }),
    ).not.toThrow();
    expect(() =>
      assertSafeAuditPayload({ values: Array(4).fill('x'.repeat(4_000)) }),
    ).not.toThrow();
  });

  it('validates stored payloads before exporting the allowlisted audit view', () => {
    const baseRow = {
      id: 'audit-1',
      event_no: 1n,
      occurred_at: new Date('2026-09-23T00:00:00.000Z'),
      actor_type: 'USER',
      actor_id: 'actor-1',
      subject_type: 'CHANGE_REQUEST',
      subject_id: 'record-1',
      action: 'SUBMIT',
      old_state: 'DRAFT',
      new_state: 'SUBMITTED',
      reason: null,
      request_id: 'request-safe-1',
      signature_id: null,
    };

    expect(() =>
      mapAuditRowToView({
        ...baseRow,
        payload: { context: [{ authorization: 'SYNTHETIC_VALUE' }] },
      }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_FAILED' }));

    const view = mapAuditRowToView({
      ...baseRow,
      payload: { before: { state: 'DRAFT' }, after: { state: 'SUBMITTED' } },
    });
    expect(view.requestId).toBe('request-safe-1');
    expect(view).not.toHaveProperty('payload');
  });

  it('rejects depth, array, node, string, and serialized byte overflow', () => {
    const tooDeep: Record<string, unknown> = {};
    let cursor = tooDeep;
    for (let depth = 0; depth < AUDIT_PAYLOAD_LIMITS.maxDepth + 1; depth += 1) {
      const child: Record<string, unknown> = {};
      cursor.level = child;
      cursor = child;
    }
    expect(() => assertSafeAuditPayload(tooDeep)).toThrow();
    const atDepthLimit: Record<string, unknown> = {};
    cursor = atDepthLimit;
    for (let depth = 0; depth < AUDIT_PAYLOAD_LIMITS.maxDepth; depth += 1) {
      const child: Record<string, unknown> = {};
      cursor.level = child;
      cursor = child;
    }
    expect(() => assertSafeAuditPayload(atDepthLimit)).not.toThrow();
    expect(() => assertSafeAuditPayload({ values: Array(101).fill('x') })).toThrow();
    expect(() =>
      assertSafeAuditPayload({ values: Array(100).fill({ nested: Array(10).fill('x') }) }),
    ).toThrow();
    expect(() => assertSafeAuditPayload({ value: 'x'.repeat(4_097) })).toThrow();
    expect(() => assertSafeAuditPayload({ values: Array(5).fill('x'.repeat(4_000)) })).toThrow();
  });
});

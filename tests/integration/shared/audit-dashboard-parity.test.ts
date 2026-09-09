import { describe, expect, it } from 'vitest';
import { GetDashboardUseCase } from '../../../src/modules/dashboard/application/get-dashboard';
import type { DashboardQuery } from '../../../src/modules/dashboard/ports/dashboard-query';
import {
  AuditQueryService,
  mapAuditRowToView,
  normalizeAuditQueryFilter,
  type AuditEventRow,
  type AuditEventView,
  type AuditQuery,
  type AuditQueryFilter,
  type AuditQueryResult,
} from '../../../src/shared/audit/audit-query';
import { assertSafeAuditPayload } from '../../../src/shared/audit/audit-event';
import type { ActorContext } from '../../../src/shared/authorization/types';

const SECRET = 's3cr3t-value-that-must-never-leak';

function row(partial: Partial<AuditEventRow> & { id: string }): AuditEventRow {
  return {
    event_no: 1n,
    occurred_at: new Date('2026-09-09T08:00:00Z'),
    actor_type: 'USER',
    actor_id: 'u1',
    subject_type: 'USER',
    subject_id: 'u1',
    action: 'GRANT_SYSTEM_OWNER_ACCESS',
    old_state: null,
    new_state: null,
    reason: 'User-approved exclusive full-system access',
    request_id: `req-${partial.id}`,
    signature_id: null,
    ...partial,
  } as AuditEventRow;
}

/** Canonical in-memory store: same semantics both surfaces must honor. */
class MemoryAuditStore implements AuditQuery {
  lastFilter?: AuditQueryFilter;
  constructor(readonly rows: AuditEventRow[]) {}
  async list(_actor: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult> {
    const normalized = normalizeAuditQueryFilter(filter);
    this.lastFilter = normalized;
    const matches = this.rows
      .filter((candidate) =>
        (normalized.subjectType === undefined || candidate.subject_type === normalized.subjectType) &&
        (normalized.subjectId === undefined || candidate.subject_id === normalized.subjectId) &&
        (normalized.actorId === undefined || candidate.actor_id === normalized.actorId) &&
        (normalized.action === undefined || candidate.action === normalized.action) &&
        (normalized.from === undefined || new Date(candidate.occurred_at) >= normalized.from) &&
        (normalized.to === undefined || new Date(candidate.occurred_at) < normalized.to),
      )
      .sort((a, b) => {
        const time = new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
        if (time !== 0) return time;
        const left = typeof a.event_no === 'bigint' ? a.event_no : BigInt(a.event_no);
        const right = typeof b.event_no === 'bigint' ? b.event_no : BigInt(b.event_no);
        return left < right ? 1 : left > right ? -1 : 0;
      });
    return {
      events: matches
        .slice(normalized.offset, normalized.offset + normalized.limit)
        .map(mapAuditRowToView),
      total: matches.length,
      limit: normalized.limit,
      offset: normalized.offset,
    };
  }
}

/**
 * Dashboard Recent Activity projection, mirroring
 * PostgresDashboardQuery: DASH-gated shell, OWN-actor scope, canonical order
 * and allowlist mapper shared with /audit.
 */
function dashboardActivity(store: MemoryAuditStore, actorId: string, limit = 8): AuditEventView[] {
  return store.rows
    .filter((candidate) => candidate.actor_id === actorId)
    .sort((a, b) => {
      const time = new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
      if (time !== 0) return time;
      const left = typeof a.event_no === 'bigint' ? a.event_no : BigInt(a.event_no);
      const right = typeof b.event_no === 'bigint' ? b.event_no : BigInt(b.event_no);
      return left < right ? 1 : left > right ? -1 : 0;
    })
    .slice(0, limit)
    .map(mapAuditRowToView);
}

const dualActor = (id = 'u1'): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: [],
  permissions: [
    { code: 'PERM-DASH-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-ADM-AUDIT-VIEW', scopes: ['GLOBAL'] },
  ],
});

const dashOnlyActor = (id = 'u1'): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: [],
  permissions: [{ code: 'PERM-DASH-VIEW', scopes: ['GLOBAL'] }],
});

describe('F-07 dashboard/audit canonical contract', () => {
  it('shows the same qualifying event on both surfaces for the same actor', async () => {
    const store = new MemoryAuditStore([
      row({ id: 'grant-1', event_no: 7n }),
      row({ id: 'other-1', actor_id: 'u2', subject_id: 'u2', request_id: 'req-other' }),
    ]);
    const actor = dualActor('u1');
    const audit = await new AuditQueryService(store).list(actor, {});
    const activity = dashboardActivity(store, actor.id);
    const viaAudit = audit.events.find((event) => event.id === 'grant-1');
    const viaDashboard = activity.find((event) => event.id === 'grant-1');
    expect(viaAudit).toMatchObject({
      action: 'GRANT_SYSTEM_OWNER_ACCESS',
      subjectType: 'USER',
      subjectId: 'u1',
    });
    expect(viaDashboard).toMatchObject({
      action: viaAudit?.action,
      subjectType: viaAudit?.subjectType,
      subjectId: viaAudit?.subjectId,
      occurredAt: viaAudit?.occurredAt,
    });
    expect(activity.some((event) => event.id === 'other-1')).toBe(false);
  });

  it('keeps dashboard activity own-scoped while /audit stays explicitly permission-gated', async () => {
    const store = new MemoryAuditStore([row({ id: 'grant-1' })]);
    const actor = dashOnlyActor('u1');
    // Dashboard path (DASH permission only) still shows the actor's own event.
    expect(dashboardActivity(store, actor.id).map((event) => event.id)).toEqual(['grant-1']);
    // /audit path requires the explicit audit permission: same denial code
    // whether or not matching history exists (no existence leakage).
    await expect(new AuditQueryService(store).list(actor, {})).rejects.toMatchObject({
      code: 'AUTHZ_PERMISSION_MISSING',
    });
    await expect(
      new AuditQueryService(new MemoryAuditStore([])).list(actor, {}),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });

  it('denies audit viewing without the explicit permission, including Admin role alone', async () => {
    const store = new MemoryAuditStore([row({ id: 'grant-1' })]);
    const service = new AuditQueryService(store);
    await expect(
      service.list({ ...dualActor(), permissions: [] }, {}),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    await expect(
      service.list({ ...dualActor(), permissions: [], roles: ['ADMIN'] }, {}),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    await expect(
      service.list({ ...dualActor(), accountState: 'INACTIVE' }, {}),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('paginates with a stable order and reports the full matching total', async () => {
    const rows = [0, 1, 2, 3, 4].map((index) =>
      row({
        id: `e${index}`,
        event_no: BigInt(index + 1),
        occurred_at: new Date(`2026-09-09T08:0${index}:00Z`),
        request_id: `req-e${index}`,
      }),
    );
    const store = new MemoryAuditStore(rows);
    const service = new AuditQueryService(store);
    const first = await service.list(dualActor(), { limit: 2, offset: 0 });
    const second = await service.list(dualActor(), { limit: 2, offset: 2 });
    const third = await service.list(dualActor(), { limit: 2, offset: 4 });
    expect(first.events.map((event) => event.id)).toEqual(['e4', 'e3']);
    expect(second.events.map((event) => event.id)).toEqual(['e2', 'e1']);
    expect(third.events.map((event) => event.id)).toEqual(['e0']);
    for (const page of [first, second, third]) expect(page.total).toBe(5);
    expect(first.limit).toBe(2);
    expect(second.offset).toBe(2);
  });

  it('clamps pagination bounds instead of failing', async () => {
    const store = new MemoryAuditStore([row({ id: 'grant-1' })]);
    const service = new AuditQueryService(store);
    expect((await service.list(dualActor(), { limit: 0 })).events).toHaveLength(1);
    expect((await service.list(dualActor(), { limit: 500 })).limit).toBe(100);
    expect((await service.list(dualActor(), { offset: -5 })).offset).toBe(0);
    const beyond = await service.list(dualActor(), { offset: 99 });
    expect(beyond.events).toEqual([]);
    expect(beyond.total).toBe(1);
  });

  it('filters by subject, actor, action, and time window', async () => {
    const store = new MemoryAuditStore([
      row({ id: 'grant-1', event_no: 1n, occurred_at: new Date('2026-09-09T08:00:00Z') }),
      row({
        id: 'lab-1',
        event_no: 2n,
        occurred_at: new Date('2026-09-09T09:00:00Z'),
        subject_type: 'LAB_TEST',
        subject_id: 't1',
        action: 'SUBMIT',
        reason: null,
        request_id: 'req-lab',
      }),
    ]);
    const service = new AuditQueryService(store);
    expect((await service.list(dualActor(), { subjectType: 'LAB_TEST' })).events.map((e) => e.id)).toEqual(['lab-1']);
    expect(
      (await service.list(dualActor(), { subjectType: 'LAB_TEST', subjectId: 't1' })).total,
    ).toBe(1);
    expect((await service.list(dualActor(), { actorId: 'u2' })).total).toBe(0);
    expect(
      (await service.list(dualActor(), { action: 'GRANT_SYSTEM_OWNER_ACCESS' })).events.map((e) => e.id),
    ).toEqual(['grant-1']);
    expect(
      (
        await service.list(dualActor(), {
          from: new Date('2026-09-09T08:30:00Z'),
          to: new Date('2026-09-09T09:30:00Z'),
        })
      ).events.map((e) => e.id),
    ).toEqual(['lab-1']);
  });

  it('orders by event_no when timestamps tie', async () => {
    const store = new MemoryAuditStore([
      row({ id: 'early-no', event_no: 3n, request_id: 'req-a' }),
      row({ id: 'late-no', event_no: 9n, request_id: 'req-b' }),
    ]);
    const result = await new AuditQueryService(store).list(dualActor(), {});
    expect(result.events.map((event) => event.id)).toEqual(['late-no', 'early-no']);
  });

  it('never exposes raw payload or secret values on either surface', async () => {
    const tainted = row({ id: 'grant-1' }) as AuditEventRow & { payload: unknown };
    tainted.payload = {
      password: SECRET,
      token: SECRET,
      secret: SECRET,
      cookie: SECRET,
      authorization: SECRET,
    };
    const store = new MemoryAuditStore([tainted]);
    const audit = await new AuditQueryService(store).list(dualActor(), {});
    const activity = dashboardActivity(store, 'u1');
    for (const view of [...audit.events, ...activity]) {
      expect(view).not.toHaveProperty('payload');
      const serialized = JSON.stringify(view, (_key, value) =>
        typeof value === 'bigint' ? `bigint:${value.toString()}` : value,
      );
      expect(serialized).not.toContain(SECRET);
    }
    await expect(
      (async () => {
        assertSafeAuditPayload(tainted.payload as Record<string, unknown>);
      })(),
    ).rejects.toBeDefined();
  });

  it('passes the authenticated actor through the dashboard use case', async () => {
    const seen: string[] = [];
    const query: DashboardQuery = {
      async get(actorContext: ActorContext) {
        seen.push(actorContext.id);
        return {
          generatedAt: new Date('2026-09-09T08:00:00Z'),
          scopeLabel: 'Authorized operational scope',
          metrics: [],
          attention: [],
          activity: [],
        };
      },
    };
    await new GetDashboardUseCase(query).execute(dashOnlyActor('u9'));
    expect(seen).toEqual(['u9']);
    await expect(
      new GetDashboardUseCase(query).execute({ ...dashOnlyActor('u9'), permissions: [] }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });
});

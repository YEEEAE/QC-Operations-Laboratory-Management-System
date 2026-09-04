import { describe, expect, it } from 'vitest';
import { GetDashboardUseCase, type DashboardReadModel } from '../../../src/modules/dashboard/application/get-dashboard';
import type { DashboardQuery } from '../../../src/modules/dashboard/ports/dashboard-query';
import type { ActorContext } from '../../../src/shared/authorization/types';

const actor = (id: string, permission: 'PERM-DASH-VIEW' | 'PERM-DASH-MANAGEMENT' = 'PERM-DASH-VIEW'): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: [],
  permissions: [{ code: permission, scopes: ['GLOBAL'] }],
});

class MemoryDashboardQuery implements DashboardQuery {
  calls: string[] = [];
  async get(actorContext: ActorContext): Promise<DashboardReadModel> {
    this.calls.push(actorContext.id);
    return {
      generatedAt: new Date('2026-09-04T08:00:00Z'),
      scopeLabel: actorContext.id === 'u1' ? 'Site A' : 'Site B',
      metrics: [{ key: 'pending-review', label: 'Pending review', value: actorContext.id === 'u1' ? 2 : 7, definition: 'Authorized pending review items.', href: '/approvals' }],
      attention: [],
      activity: [],
    };
  }
}

describe('role and scope-aware dashboard', () => {
  it('passes the authenticated actor to the authorized read model and never aggregates in the browser', async () => {
    const query = new MemoryDashboardQuery();
    const result = await new GetDashboardUseCase(query).execute(actor('u1'));
    expect(query.calls).toEqual(['u1']);
    expect(result.metrics[0]?.value).toBe(2);
    expect(result.metrics.every((metric) => metric.definition.length > 0)).toBe(true);
  });

  it('keeps dashboard metrics isolated across actors and requires an explicit dashboard permission', async () => {
    const query = new MemoryDashboardQuery();
    const useCase = new GetDashboardUseCase(query);
    await expect(useCase.execute(actor('u2'))).resolves.toMatchObject({ scopeLabel: 'Site B' });
    await expect(useCase.execute({ ...actor('u1'), permissions: [] })).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });
});

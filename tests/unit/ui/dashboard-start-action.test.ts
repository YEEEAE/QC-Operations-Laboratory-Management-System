import { describe, expect, it } from 'vitest';
import { emptyDashboard } from '../../../src/modules/dashboard/application/dashboard-empty.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { DashboardReadModel } from '../../../src/modules/dashboard/ports/dashboard-query.js';
import { dashboardStartAction } from '../../../src/ui/components/dashboard/start-action.js';

const actor: ActorContext = { id: 'operator', accountState: 'ACTIVE', roles: ['Employee'], permissions: [{ code: 'PERM-QUAR-CREATE', scopes: ['OWN'] }] };
function snapshot(): DashboardReadModel {
  const dashboard = emptyDashboard(actor);
  dashboard.metrics = [{ key: 'pending-review', label: 'Pending review', value: 0, unit: 'records', denominator: 'Authorized work', grain: 'Work item', timeRange: 'current snapshot', timezone: 'UTC', freshness: 'Current snapshot', source: 'Approvals', definition: 'Assigned pending work', numerator: 'Pending assigned work', state: 'PENDING', actorScope: 'Assigned to you', drilldown: '/approvals', href: '/approvals', drilldownLabel: 'Open approvals', tone: 'neutral' }];
  dashboard.flow = { ...dashboard.flow, state: 'AVAILABLE', stages: [{ key: 'pending', label: 'Pending', value: 0, definition: 'Pending receiving', numerator: 'Pending receiving', state: 'PENDING', actorScope: 'Authorized scope', href: '/quarantine/receiving?state=PENDING', drilldownLabel: 'Open receiving', tone: 'neutral' }] };
  return dashboard;
}
describe('dashboard first authorized action', () => {
  it('opens receiving creation for a confirmed empty snapshot and canonical OWN create grant', () => {
    expect(dashboardStartAction(actor, snapshot())).toEqual({ href: '/quarantine/receiving/new', label: 'Create receiving item' });
  });
  it.each([
    { ...actor, permissions: [] },
    { ...actor, accountState: 'DISABLED' as const },
    { ...actor, permissions: [{ code: 'PERM-QUAR-CREATE' as const, scopes: ['OWN' as const], active: false }] },
    { ...actor, permissions: [{ code: 'PERM-QUAR-CREATE' as const, scopes: ['ASSIGNED' as const] }] },
  ])('does not offer creation without the current canonical authority', (deniedActor) => {
    expect(dashboardStartAction(deniedActor, snapshot())).toBeUndefined();
  });
  it('withholds first-run guidance when source counts or receiving coverage are unavailable', () => {
    const dashboard = snapshot();
    dashboard.metrics[0]!.value = null;
    expect(dashboardStartAction(actor, dashboard)).toBeUndefined();
    dashboard.metrics[0]!.value = 0;
    dashboard.flow.state = 'NOT_AUTHORIZED';
    expect(dashboardStartAction(actor, dashboard)).toBeUndefined();
  });
  it('keeps populated work in its review workflow', () => {
    const dashboard = snapshot();
    dashboard.metrics[0]!.value = 1;
    expect(dashboardStartAction(actor, dashboard)).toBeUndefined();
  });
});

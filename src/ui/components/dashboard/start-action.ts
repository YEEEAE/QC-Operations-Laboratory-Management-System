import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DashboardReadModel } from '../../../modules/dashboard/ports/dashboard-query.js';

export function dashboardStartAction(actor: ActorContext, dashboard: DashboardReadModel) {
  const empty = dashboard.metrics.length > 0
    && dashboard.metrics.every((metric) => !metric.unavailable && metric.value === 0)
    && dashboard.flow.state === 'AVAILABLE'
    && dashboard.flow.stages.length > 0
    && dashboard.flow.stages.every((stage) => stage.value === 0);
  if (!empty) return undefined;
  // Match CreateReceivingUseCase's canonical authorization. Opening the form
  // grants no mutation; the use case checks the final submission again.
  const decision = authorize({
    actor,
    permission: 'PERM-QUAR-CREATE',
    action: 'CREATE',
    entity: { type: 'RECEIVING_ITEM', id: 'new', state: 'PENDING', ownerId: actor.id },
    scope: { ownerId: actor.id },
    currentVersion: 1n,
    expectedVersion: 1n,
    businessCondition: true,
  });
  return decision.allowed
    ? { href: '/quarantine/receiving/new', label: 'Create receiving item' }
    : undefined;
}

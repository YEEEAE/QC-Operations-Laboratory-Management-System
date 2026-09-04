import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DashboardQuery, DashboardReadModel } from '../ports/dashboard-query.js';
export type { DashboardReadModel } from '../ports/dashboard-query.js';

function assertDashboardAccess(actor: ActorContext): void {
  const permissions = ['PERM-DASH-ADMIN', 'PERM-DASH-MANAGEMENT', 'PERM-DASH-VIEW'] as const;
  for (const permission of permissions) {
    if (!actor.permissions.some((grant) => grant.code === permission && grant.active !== false)) continue;
    const decision = authorize({ actor, permission, action: 'VIEW', entity: { type: 'DASHBOARD', id: actor.id, state: 'ACTIVE', domain: 'DASHBOARD' }, scope: { domain: 'DASHBOARD' }, currentVersion: 1, expectedVersion: 1, businessCondition: true });
    if (decision.allowed) return;
  }
  throw new AppError('AUTHZ_PERMISSION_MISSING');
}

export class GetDashboardUseCase {
  constructor(private readonly query: DashboardQuery) {}
  async execute(actor: ActorContext): Promise<DashboardReadModel> {
    assertDashboardAccess(actor);
    return this.query.get(actor);
  }
}

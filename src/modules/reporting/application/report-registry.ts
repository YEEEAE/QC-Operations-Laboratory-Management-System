import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { REPORT_DEFINITIONS, type ReportDefinition } from '../domain/report-definition.js';

const definitions = new Map(REPORT_DEFINITIONS.map((definition) => [definition.code, definition]));

export class ReportRegistry {
  list(): readonly ReportDefinition[] {
    return REPORT_DEFINITIONS;
  }

  get(code: string): ReportDefinition {
    const definition = definitions.get(code as ReportDefinition['code']);
    if (!definition) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return definition;
  }

  canView(actor: ActorContext, definition: ReportDefinition): boolean {
    const reportEntity = { type: 'REPORT', id: definition.code, state: 'ACTIVE', ownerId: actor.id, domain: 'REPORTING' } as const;
    const reportDecision = authorize({
      actor,
      permission: definition.viewPermission,
      action: 'VIEW',
      entity: reportEntity,
      scope: { domain: 'REPORTING' },
      currentVersion: 1,
      expectedVersion: 1,
      businessCondition: true,
    });
    if (!reportDecision.allowed) return false;
    const runDecision = authorize({
      actor,
      permission: definition.runPermission,
      action: 'RUN',
      entity: reportEntity,
      scope: { domain: 'REPORTING' },
      currentVersion: 1,
      expectedVersion: 1,
      businessCondition: true,
    });
    if (!runDecision.allowed) return false;
    const sourceGrant = actor.permissions.find(
      (grant) => grant.code === definition.sourcePermission && grant.active !== false,
    );
    if (!sourceGrant) return false;
    const reportableScopes = definition.authorizedScope === 'OWN'
      ? ['OWN', 'GLOBAL']
      : ['OWN', 'ASSIGNED', 'GLOBAL'];
    return sourceGrant.scopes.some((scope) => reportableScopes.includes(scope));
  }

  canExport(actor: ActorContext, definition: ReportDefinition, format: 'CSV' | 'XLSX'): boolean {
    const entity = { type: 'REPORT', id: definition.code, state: 'ACTIVE', ownerId: actor.id, domain: 'REPORTING' } as const;
    return [definition.exportPermission, definition.exportPermissions[format]].every((permission) =>
      authorize({
        actor,
        permission,
        action: 'EXPORT',
        entity,
        scope: { domain: 'REPORTING' },
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      }).allowed,
    );
  }
}

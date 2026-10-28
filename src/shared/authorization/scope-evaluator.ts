import { evaluateScope } from './scopes';
import type { ActorContext, EntityContext, PermissionGrant, ScopeContext } from './types';
export function actorHasScope(
  actor: ActorContext,
  entity: EntityContext,
  requested: ScopeContext,
  grant?: PermissionGrant,
): boolean {
  const candidate = grant ?? actor.permissions[0];
  if (!candidate || candidate.active === false) return false;
  const assignments = actor.scopeAssignments;
  return candidate.scopes.some((kind) => {
    if (kind === 'GLOBAL' || kind === 'OWN' || kind === 'ASSIGNED')
      return evaluateScope(kind, actor.id, entity, requested);
    // A kind alone is not an assignment. Compare the trusted persisted value
    // to the resource value; missing resource dimensions fail closed.
    return (assignments ?? []).some((assignment) =>
      assignment.kind === kind &&
      evaluateScope(kind, actor.id, entity, {
        ...requested,
        ...(kind === 'TEAM' ? { teamId: assignment.value } : {}),
        ...(kind === 'AREA' ? { areaId: assignment.value } : {}),
        ...(kind === 'DEPARTMENT' ? { departmentId: assignment.value } : {}),
        ...(kind === 'SITE' ? { siteId: assignment.value } : {}),
        ...(kind === 'DOMAIN' ? { domain: assignment.value } : {}),
        ...(kind === 'SHIFT' ? { shiftId: assignment.value } : {}),
        ...(kind === 'FUNCTION' ? { functionCode: assignment.value } : {}),
      }),
    );
  });
}

import { evaluateScope } from './scopes';
import type { ActorContext, EntityContext, PermissionGrant, ScopeContext } from './types';
export function actorHasScope(
  actor: ActorContext,
  entity: EntityContext,
  requested: ScopeContext,
  grant?: PermissionGrant,
): boolean {
  const candidate = grant ?? actor.permissions[0];
  return Boolean(
    candidate &&
    candidate.active !== false &&
    candidate.scopes.some((kind) => evaluateScope(kind, actor.id, entity, requested)),
  );
}

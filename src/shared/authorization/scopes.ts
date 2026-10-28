import type { EntityContext, ScopeContext, ScopeKind } from './types';
export function evaluateScope(
  kind: ScopeKind,
  actorId: string,
  entity: EntityContext,
  requested: ScopeContext,
): boolean {
  switch (kind) {
    case 'OWN':
      return entity.ownerId === actorId || entity.authorId === actorId;
    case 'ASSIGNED':
      return entity.assigneeId === actorId;
    case 'TEAM':
      return Boolean(entity.teamId && entity.teamId === requested.teamId);
    case 'AREA':
      return Boolean(entity.areaId && entity.areaId === requested.areaId);
    case 'DEPARTMENT':
      return Boolean(entity.departmentId && entity.departmentId === requested.departmentId);
    case 'SITE':
      return Boolean(entity.siteId && entity.siteId === requested.siteId);
    case 'DOMAIN':
      return Boolean(entity.domain && entity.domain === requested.domain);
    case 'SHIFT':
      return Boolean(entity.shiftId && entity.shiftId === requested.shiftId);
    case 'FUNCTION':
      return Boolean(entity.functionCode && entity.functionCode === requested.functionCode);
    case 'GLOBAL':
      return true;
  }
}

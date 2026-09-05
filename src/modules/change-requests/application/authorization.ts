import { authorize } from '../../../shared/authorization/authorize.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import type { ActorContext, EntityContext } from '../../../shared/authorization/types.js';
import type { ChangeRequest, UserChangeRequestAction } from '../domain/change-request.js';

const genericPermission: Record<UserChangeRequestAction | 'VIEW', PermissionCode> = {
  VIEW: 'PERM-CHG-VIEW',
  SUBMIT: 'PERM-CHG-SUBMIT',
  START_REVIEW: 'PERM-CHG-REVIEW',
  RETURN: 'PERM-CHG-RETURN',
  RESUME: 'PERM-CHG-EDIT-DRAFT',
  APPROVE: 'PERM-CHG-APPROVE',
  REJECT: 'PERM-CHG-REJECT',
  CANCEL: 'PERM-CHG-CANCEL',
};

function entity(request: ChangeRequest): EntityContext {
  return { type: 'CHANGE_REQUEST', id: request.id, state: request.state, ownerId: request.requestedBy, authorId: request.requestedBy, domain: 'CHANGE_REQUESTS' };
}

export function authorizeChangeRequestView(request: ChangeRequest, actor: ActorContext): void {
  const hasWorkflowAccess = actor.permissions.some(
    (permission) =>
      permission.active !== false &&
      [...['PERM-CHG-REVIEW', 'PERM-CHG-RETURN', 'PERM-CHG-APPROVE', 'PERM-CHG-REJECT'], 'PERM-CHG-VIEW'].includes(permission.code) &&
      permission.scopes.some((scope) => scope === 'GLOBAL' || scope === 'DOMAIN'),
  );
  authorize({ actor, permission: genericPermission.VIEW, action: 'VIEW', entity: entity(request), scope: { ownerId: request.requestedBy, domain: 'CHANGE_REQUESTS' }, currentVersion: request.version, expectedVersion: request.version, businessCondition: actor.id === request.requestedBy || hasWorkflowAccess }, { throwOnDeny: true });
}

export function authorizeChangeRequestAction(request: ChangeRequest, actor: ActorContext, action: UserChangeRequestAction, expectedVersion: bigint): void {
  const permission = genericPermission[action];
  authorizeChangeRequestView(request, actor);
  authorize({ actor, permission, action: action === 'START_REVIEW' ? 'REVIEW' : action, entity: entity(request), scope: { ownerId: request.requestedBy, domain: 'CHANGE_REQUESTS' }, currentVersion: request.version, expectedVersion, sod: { actorId: actor.id, authorId: request.requestedBy }, businessCondition: true }, { throwOnDeny: true });
  const approvalPermission =
    action === 'APPROVE'
      ? 'PERM-APR-APPROVE'
      : action === 'REJECT'
        ? 'PERM-APR-REJECT'
        : action === 'RETURN'
          ? 'PERM-APR-RETURN'
          : action === 'START_REVIEW'
            ? 'PERM-APR-REVIEW'
            : undefined;
  if (approvalPermission) {
    authorize({ actor, permission: approvalPermission, action: action === 'START_REVIEW' ? 'REVIEW' : action, entity: entity(request), scope: { ownerId: request.requestedBy, domain: 'CHANGE_REQUESTS' }, currentVersion: request.version, expectedVersion, sod: { actorId: actor.id, authorId: request.requestedBy }, businessCondition: true }, { throwOnDeny: true });
  }
}

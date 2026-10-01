import type { PermissionCode } from './permissions';
import type { ActorContext, ScopeKind } from './types';

/**
 * Presentation capabilities for administration controls. These predicates
 * only decide whether a control is useful to show; they never authorize an
 * action. Each application use case still checks its canonical permission,
 * target, state, scope, version, SoD, and business conditions.
 *
 * Ordinary administration routes and safe read projections remain visible to
 * ACTIVE accounts. Route visibility belongs to pageAccessDecision.
 */
export const ADMIN_ACTION_CAPABILITIES = {
  createUser: { permission: 'PERM-IDN-MANAGE-USERS', scope: 'GLOBAL' },
  updateUserProfile: { permission: 'PERM-IDN-MANAGE-USERS', scope: 'GLOBAL' },
  activateUser: { permission: 'PERM-IDN-ACTIVATE', scope: 'GLOBAL' },
  deactivateUser: { permission: 'PERM-IDN-DEACTIVATE', scope: 'GLOBAL' },
  resetUserPassword: { permission: 'PERM-IDN-RESET-PASSWORD', scope: 'GLOBAL' },
  revokeUserSessions: { permission: 'PERM-IDN-REVOKE-SESSIONS', scope: 'GLOBAL' },
  assignUserRole: { permission: 'PERM-ADM-ROLE-ASSIGN', scope: 'GLOBAL' },
  removeUserRole: { permission: 'PERM-ADM-ROLE-ASSIGN', scope: 'GLOBAL' },
  assignUserScope: { permission: 'PERM-ADM-SCOPE-ASSIGN', scope: 'GLOBAL' },
  removeUserScope: { permission: 'PERM-ADM-SCOPE-ASSIGN', scope: 'GLOBAL' },
  replaceUserScopes: { permission: 'PERM-ADM-SCOPE-ASSIGN', scope: 'GLOBAL' },
  assignRolePermissions: { permission: 'PERM-ADM-PERMISSION-ASSIGN', scope: 'GLOBAL' },
  viewAudit: { permission: 'PERM-ADM-AUDIT-VIEW', scope: 'GLOBAL' },
} as const satisfies Record<string, { permission: PermissionCode; scope: ScopeKind }>;

export type AdminActionCapability = keyof typeof ADMIN_ACTION_CAPABILITIES;

export function hasAdminCapability(
  actor: ActorContext | undefined,
  capability: AdminActionCapability,
): boolean {
  if (!actor || actor.accountState !== 'ACTIVE') return false;
  const required = ADMIN_ACTION_CAPABILITIES[capability];
  return actor.permissions.some(
    (grant) =>
      grant.code === required.permission &&
      grant.active !== false &&
      grant.scopes.includes(required.scope),
  );
}

import type { PermissionCode } from './permissions';
import type { ActorContext } from './types';

/**
 * Controlled Administration workspace (F-02) route guard.
 *
 * Default deny: a route is visible only when the actor is ACTIVE and holds at
 * least one explicit, active permission grant for that route. The Admin role
 * alone is never sufficient (Role is not Permission), and SYSTEM_OWNER passes
 * because it holds every canonical grant.
 *
 * This helper only decides workspace visibility for Delivery (navigation and
 * page shells). Every mutation re-authorizes inside its Application Use Case
 * with permission + scope + entity + state + SoD + version + business rule.
 */
export const ADMIN_WORKSPACE_PERMISSIONS = [
  'PERM-ADM-USERS',
  'PERM-ADM-ROLES',
  'PERM-ADM-PERMISSIONS',
  'PERM-ADM-SCOPES',
  'PERM-IDN-MANAGE-USERS',
  'PERM-IDN-ACTIVATE',
  'PERM-IDN-DEACTIVATE',
  'PERM-IDN-RESET-PASSWORD',
  'PERM-IDN-REVOKE-SESSIONS',
  'PERM-ADM-ROLE-VIEW',
  'PERM-ADM-ROLE-ASSIGN',
  'PERM-ADM-PERMISSION-VIEW',
  'PERM-ADM-PERMISSION-ASSIGN',
  'PERM-ADM-SCOPE-ASSIGN',
] as const satisfies readonly PermissionCode[];

export type AdminRouteId =
  'admin' | 'users' | 'usersNew' | 'userDetail' | 'roles' | 'roleDetail' | 'permissions' | 'scopes';

export const ADMIN_ROUTE_PERMISSIONS: Record<AdminRouteId, readonly PermissionCode[]> = {
  admin: [...ADMIN_WORKSPACE_PERMISSIONS],
  users: ['PERM-ADM-USERS', 'PERM-IDN-MANAGE-USERS'],
  usersNew: ['PERM-IDN-MANAGE-USERS'],
  userDetail: ['PERM-ADM-USERS', 'PERM-IDN-MANAGE-USERS', 'PERM-ADM-SCOPES'],
  roles: ['PERM-ADM-ROLES', 'PERM-ADM-ROLE-VIEW'],
  roleDetail: [
    'PERM-ADM-ROLES',
    'PERM-ADM-ROLE-VIEW',
    'PERM-ADM-PERMISSION-VIEW',
    'PERM-ADM-PERMISSION-ASSIGN',
  ],
  permissions: ['PERM-ADM-PERMISSIONS', 'PERM-ADM-PERMISSION-VIEW'],
  scopes: ['PERM-ADM-SCOPES', 'PERM-ADM-SCOPE-ASSIGN'],
};

export function hasAdminGrant(actor: ActorContext, permission: PermissionCode): boolean {
  return actor.permissions.some((grant) => grant.code === permission && grant.active !== false);
}

export function canAccessAdminRoute(actor: ActorContext | undefined, route: AdminRouteId): boolean {
  if (!actor || actor.accountState !== 'ACTIVE') return false;
  const required = ADMIN_ROUTE_PERMISSIONS[route];
  if (!required) return false;
  return required.some((permission) => hasAdminGrant(actor, permission));
}

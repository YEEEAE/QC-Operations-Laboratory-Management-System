import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import type { ScopeKind } from '../../../shared/authorization/types.js';

export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  active: boolean;
  version: bigint;
}
export interface PermissionRecord {
  id: string;
  code: PermissionCode;
  domain: string;
  action: string;
  description: string | null;
  riskLevel: string;
  active: boolean;
}
export interface UserScopeRecord {
  id: string;
  userId: string;
  kind: ScopeKind;
  value: string | null;
  assignedBy: string;
  assignedAt: Date;
  revokedAt: Date | null;
}
export interface UserRoleSummary {
  userId: string;
  codes: readonly string[];
}
export interface UserScopeSummary {
  userId: string;
  scopes: readonly UserScopeRecord[];
}

export interface AuthorizationRepository {
  listRoles(): Promise<readonly RoleRecord[]>;
  getRole(roleId: string): Promise<RoleRecord | undefined>;
  listPermissions(): Promise<readonly PermissionRecord[]>;
  listRolePermissions(roleId: string): Promise<readonly PermissionCode[]>;
  replaceRolePermissions(input: {
    roleId: string;
    permissionCodes: readonly PermissionCode[];
    actorId: string;
    expectedVersion: bigint;
    requestId: string;
  }): Promise<RoleRecord>;
  listUserScopes(userId: string): Promise<readonly UserScopeRecord[]>;
  listUserRoles(userId: string): Promise<readonly RoleRecord[]>;
  listUserRolesForUsers?(userIds: readonly string[]): Promise<readonly UserRoleSummary[]>;
  listUserScopesForUsers?(userIds: readonly string[]): Promise<readonly UserScopeSummary[]>;
  assignUserRole(input: {
    userId: string;
    roleId: string;
    actorId: string;
    requestId: string;
    reason?: string;
  }): Promise<void>;
  removeUserRole(input: {
    userId: string;
    roleId: string;
    actorId: string;
    requestId: string;
    reason?: string;
  }): Promise<void>;
  replaceUserScopes(input: {
    userId: string;
    scopes: readonly { kind: ScopeKind; value?: string }[];
    actorId: string;
    requestId: string;
    reason?: string;
  }): Promise<readonly UserScopeRecord[]>;
  /**
   * Incremental scope administration. `replaceUserScopes` stays available for
   * atomic provisioning and bulk operations, but ordinary interactive
   * administration must be able to add or revoke one grant without disturbing
   * every unrelated grant the member already holds.
   */
  assignUserScope(input: {
    userId: string;
    kind: ScopeKind;
    value?: string;
    actorId: string;
    requestId: string;
    reason?: string;
  }): Promise<readonly UserScopeRecord[]>;
  removeUserScope(input: {
    userId: string;
    kind: ScopeKind;
    value?: string;
    actorId: string;
    requestId: string;
    reason?: string;
  }): Promise<readonly UserScopeRecord[]>;
}

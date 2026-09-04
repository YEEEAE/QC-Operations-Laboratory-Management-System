import type { PermissionCode, } from '../../../shared/authorization/permissions.js';
import type { ScopeKind } from '../../../shared/authorization/types.js';

export interface RoleRecord { id: string; code: string; name: string; description: string | null; isSystemRole: boolean; active: boolean; version: bigint; }
export interface PermissionRecord { id: string; code: PermissionCode; domain: string; action: string; description: string | null; riskLevel: string; active: boolean; }
export interface UserScopeRecord { id: string; userId: string; kind: ScopeKind; value: string | null; assignedBy: string; assignedAt: Date; revokedAt: Date | null; }

export interface AuthorizationRepository {
  listRoles(): Promise<readonly RoleRecord[]>;
  getRole(roleId: string): Promise<RoleRecord | undefined>;
  listPermissions(): Promise<readonly PermissionRecord[]>;
  replaceRolePermissions(input: { roleId: string; permissionCodes: readonly PermissionCode[]; actorId: string; expectedVersion: bigint; requestId: string; }): Promise<RoleRecord>;
  listUserScopes(userId: string): Promise<readonly UserScopeRecord[]>;
  replaceUserScopes(input: { userId: string; scopes: readonly { kind: ScopeKind; value?: string }[]; actorId: string; requestId: string; reason?: string; }): Promise<readonly UserScopeRecord[]>;
}

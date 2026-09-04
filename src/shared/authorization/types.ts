import type { PermissionCode } from './permissions';
export type AccountState = 'ACTIVE' | 'INACTIVE' | 'DISABLED';
export type ScopeKind = 'OWN' | 'ASSIGNED' | 'TEAM' | 'DEPARTMENT' | 'SITE' | 'DOMAIN' | 'GLOBAL';
export type DecisionAction = string;
export interface PermissionGrant {
  code: PermissionCode;
  scopes: readonly ScopeKind[];
  active?: boolean;
}
export interface ActorContext {
  id: string;
  accountState: AccountState;
  roles: readonly string[];
  permissions: readonly PermissionGrant[];
}
export interface EntityContext {
  type: string;
  id: string;
  state: string;
  ownerId?: string;
  authorId?: string;
  executorId?: string;
  assigneeId?: string;
  teamId?: string;
  departmentId?: string;
  siteId?: string;
  domain?: string;
}
export interface ScopeContext {
  ownerId?: string;
  assigneeId?: string;
  teamId?: string;
  departmentId?: string;
  siteId?: string;
  domain?: string;
}
export interface SodContext {
  actorId: string;
  authorId?: string;
  executorId?: string;
}
export interface AuthorizationInput {
  actor: ActorContext;
  permission: PermissionCode;
  action: DecisionAction;
  entity: EntityContext;
  scope: ScopeContext;
  currentVersion: number | bigint;
  expectedVersion: number | bigint;
  sod?: SodContext;
  businessCondition?: boolean;
}
export type DenialCode =
  | 'AUTHZ_DENIED'
  | 'AUTHZ_SCOPE_DENIED'
  | 'AUTHZ_SOD_VIOLATION'
  | 'AUTHZ_PERMISSION_MISSING'
  | 'CONFLICT_STALE_VERSION';
export interface AuthorizationDecision {
  allowed: boolean;
  code?: DenialCode;
  reason?: string;
}

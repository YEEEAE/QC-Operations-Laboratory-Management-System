import type { PermissionCode } from './permissions';
export type AccountState = 'ACTIVE' | 'INACTIVE' | 'DISABLED';
/**
 * Canonical scope vocabulary. This is the single source used by the
 * authorization model, the persistence CHECK constraint, and every
 * administration surface — no surface may invent an extra scope kind.
 */
export const SCOPE_KINDS = [
  'OWN',
  'ASSIGNED',
  'TEAM',
  'DEPARTMENT',
  'SITE',
  'DOMAIN',
  'GLOBAL',
] as const satisfies readonly string[];
export type ScopeKind = (typeof SCOPE_KINDS)[number];

/**
 * Scope kinds that always name a collection, so a non-empty value is required
 * (this mirrors the persistence CHECK constraint on qc.user_scopes).
 */
export const NAMED_SCOPE_KINDS = [
  'TEAM',
  'DEPARTMENT',
  'SITE',
  'DOMAIN',
] as const satisfies readonly ScopeKind[];

/** GLOBAL is the whole-system grant: it is never qualified by a value. */
export const VALUELESS_SCOPE_KINDS = ['GLOBAL'] as const satisfies readonly ScopeKind[];

export function isScopeKind(value: unknown): value is ScopeKind {
  return typeof value === 'string' && (SCOPE_KINDS as readonly string[]).includes(value);
}

export function scopeRequiresValue(kind: ScopeKind): boolean {
  return (NAMED_SCOPE_KINDS as readonly string[]).includes(kind);
}

/**
 * Shared value semantics for a scope grant. Returns the normalized value
 * (`undefined` when the kind is valueless) or `{ ok: false }` so callers fail
 * closed without duplicating the rule in the UI, the Action, and the use case.
 */
export function normalizeScopeValue(
  kind: ScopeKind,
  value: string | undefined,
): { ok: true; value?: string } | { ok: false } {
  const trimmed = value?.trim() ?? '';
  if (scopeRequiresValue(kind)) return trimmed ? { ok: true, value: trimmed } : { ok: false };
  if (kind === 'GLOBAL' && trimmed) return { ok: false };
  return trimmed ? { ok: true, value: trimmed } : { ok: true };
}
export type DecisionAction = string;
/** Immutable internal user identifier. Login identities are not user IDs. */
export type UserId = string;
export interface PermissionGrant {
  code: PermissionCode;
  scopes: readonly ScopeKind[];
  active?: boolean;
}
export interface ActorContext {
  id: UserId;
  /** Always populated by resolveActor; optional only for legacy non-auth test doubles. */
  loginIdentity?: string;
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

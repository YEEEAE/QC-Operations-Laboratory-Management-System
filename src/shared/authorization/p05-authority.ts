import type { ActorContext, ScopeKind } from './types.js';

export const SYSTEM_OWNER_LOGIN_IDENTITY = 'yazeed' as const;

/** Only the canonical application role codes may participate in authorization. */
export const RECOGNIZED_ROLE_CODES = new Set([
  'SYSTEM_OWNER', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'EMPLOYEE', 'QC_COMPLIANCE',
]);

export function isCanonicalSystemOwnerId(userId: string): boolean {
  const configuredId = process.env.QC_SYSTEM_OWNER_USER_ID?.trim().toLowerCase();
  return Boolean(configuredId && userId.toLowerCase() === configuredId);
}

function isCanonicalOwnerIdUnconfigured(): boolean {
  return !process.env.QC_SYSTEM_OWNER_USER_ID?.trim();
}

/** Admin surface access requires a configured canonical account identity. */
export function isAdminOrCanonicalOwner(actor: ActorContext): boolean {
  if (actor.accountState !== 'ACTIVE') return false;
  if (actor.roles.some((role) => !RECOGNIZED_ROLE_CODES.has(role))) return false;
  if (actor.roles.includes('ADMIN')) return true;
  return actor.roles.includes('SYSTEM_OWNER') && isCanonicalSystemOwnerId(actor.id);
}

/**
 * Canonical-owner grant protections.
 *
 * The configured canonical SYSTEM_OWNER account must keep its role and GLOBAL
 * scope so administration remains recoverable.
 * These are grant-level protections on the *target* account, independent of
 * which actor submits the request: the UI renders them as `Protected`, and the
 * persistence layer rejects a crafted removal even when the caller holds
 * PERM-ADM-ROLE-ASSIGN or PERM-ADM-SCOPE-ASSIGN.
 */
export function isProtectedOwnerRoleGrant(
  targetUserId: string,
  targetAccountState: string,
  roleCode: string,
): boolean {
  return targetAccountState === 'ACTIVE' && roleCode === 'SYSTEM_OWNER' &&
    (isCanonicalSystemOwnerId(targetUserId) || isCanonicalOwnerIdUnconfigured());
}

export function isProtectedOwnerScope(targetUserId: string, targetAccountState: string, kind: ScopeKind): boolean {
  return targetAccountState === 'ACTIVE' && kind === 'GLOBAL' &&
    (isCanonicalSystemOwnerId(targetUserId) || isCanonicalOwnerIdUnconfigured());
}

/**
 * The canonical System Owner is bound to the configured immutable QC account
 * ID. Login identity and display name are descriptive only. Role assignments
 * and account state are resolved server-side for each request.
 */
export function isNamedSystemOwner(actor: Pick<ActorContext, 'id' | 'roles' | 'accountState'>): boolean {
  return (
    actor.accountState === 'ACTIVE' &&
    actor.roles.includes('SYSTEM_OWNER') &&
    isCanonicalSystemOwnerId(actor.id)
  );
}

/** Final P-05 authority: Supervisor, Manager/QCM, or the named system owner. */
export function isP05Authority(actor: ActorContext): boolean {
  if (actor.accountState !== 'ACTIVE') return false;
  if (actor.roles.includes('SUPERVISOR') || actor.roles.includes('MANAGER')) return true;
  return isNamedSystemOwner(actor);
}

/**
 * QC-100-FINAL-004 two-stage approval: the final (QCM) approval authority.
 *
 * Owner-approved policy: Supervisor supplies the first-stage approval only.
 * The final approval that makes a record APPROVED/locked belongs to the QCM
 * (role `MANAGER`) or the named `yazeed/SYSTEM_OWNER` — never to Supervisor
 * alone, and never to Admin.
 */
export function isFinalApprovalAuthority(actor: ActorContext): boolean {
  if (actor.accountState !== 'ACTIVE') return false;
  if (actor.roles.includes('MANAGER')) return true;
  return isNamedSystemOwner(actor);
}

/** Owner decision 2026-09-23: first-stage approval belongs to Supervisor. */
export function isStageOneApprovalAuthority(actor: ActorContext): boolean {
  if (actor.accountState !== 'ACTIVE') return false;
  return actor.roles.includes('SUPERVISOR') || isNamedSystemOwner(actor);
}

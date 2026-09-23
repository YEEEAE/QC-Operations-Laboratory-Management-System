import type { ActorContext, ScopeKind } from './types.js';

export const SYSTEM_OWNER_LOGIN_IDENTITY = 'yazeed' as const;

/**
 * Canonical-owner grant protections.
 *
 * The canonical SYSTEM_OWNER account must keep the SYSTEM_OWNER role and the
 * GLOBAL scope so the system cannot be locked out of its own administration.
 * These are grant-level protections on the *target* account, independent of
 * which actor submits the request: the UI renders them as `Protected`, and the
 * persistence layer rejects a crafted removal even when the caller holds
 * PERM-ADM-ROLE-ASSIGN or PERM-ADM-SCOPE-ASSIGN.
 */
export function isProtectedOwnerRoleGrant(targetLoginIdentity: string, roleCode: string): boolean {
  return targetLoginIdentity === SYSTEM_OWNER_LOGIN_IDENTITY && roleCode === 'SYSTEM_OWNER';
}

export function isProtectedOwnerScope(targetLoginIdentity: string, kind: ScopeKind): boolean {
  return targetLoginIdentity === SYSTEM_OWNER_LOGIN_IDENTITY && kind === 'GLOBAL';
}

/**
 * Canonical named-owner check. The login identity is resolved server-side
 * from qc.users; actor.id is always the immutable internal user ID.
 */
export function isNamedSystemOwner(actor: ActorContext): boolean {
  return (
    actor.accountState === 'ACTIVE' &&
    actor.roles.includes('SYSTEM_OWNER') &&
    actor.loginIdentity === SYSTEM_OWNER_LOGIN_IDENTITY
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

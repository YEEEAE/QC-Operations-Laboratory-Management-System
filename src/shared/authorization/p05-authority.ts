import type { ActorContext } from './types.js';

export const SYSTEM_OWNER_LOGIN_IDENTITY = 'yazeed' as const;

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

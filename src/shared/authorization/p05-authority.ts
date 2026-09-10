import type { ActorContext } from './types.js';

/** Final P-05 authority: Supervisor, Manager/QCM, or the named system owner. */
export function isP05Authority(actor: ActorContext): boolean {
  if (actor.accountState !== 'ACTIVE') return false;
  if (actor.roles.includes('SUPERVISOR') || actor.roles.includes('MANAGER')) return true;
  return actor.id === 'yazeed' && actor.roles.includes('SYSTEM_OWNER');
}

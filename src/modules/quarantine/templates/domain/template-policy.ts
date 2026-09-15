import type { ActorContext } from '../../../../shared/authorization/types.js';
import { isNamedSystemOwner } from '../../../../shared/authorization/p05-authority.js';

/**
 * P-06 template authority: Supervisor, Manager, and yazeed (SYSTEM_OWNER).
 * Admin alone is never template authority, and Employee is never a
 * reviewer/approver/stopper/voider/superseder.
 */
export function isTemplateAuthority(actor: ActorContext): boolean {
  if (actor.accountState !== 'ACTIVE') return false;
  if (actor.roles.some((role) => role === 'SUPERVISOR' || role === 'MANAGER')) return true;
  // The approved policy names yazeed, not the SYSTEM_OWNER role by itself.
  return isNamedSystemOwner(actor);
}

export function isEmployeeOnly(actor: ActorContext): boolean {
  return actor.roles.includes('EMPLOYEE') && !isTemplateAuthority(actor);
}

export function describeTemplateActor(actor: ActorContext): 'AUTHORITY' | 'EMPLOYEE' | 'OTHER' {
  if (isTemplateAuthority(actor)) return 'AUTHORITY';
  if (actor.roles.includes('EMPLOYEE')) return 'EMPLOYEE';
  return 'OTHER';
}

import type { ActorContext } from '../../../../shared/authorization/types.js';

const AUTHORITY_ROLES = new Set(['SUPERVISOR', 'MANAGER', 'SYSTEM_OWNER']);

/**
 * P-06 template authority: Supervisor, Manager, and yazeed (SYSTEM_OWNER).
 * Admin alone is never template authority, and Employee is never a
 * reviewer/approver/stopper/voider/superseder.
 */
export function isTemplateAuthority(actor: ActorContext): boolean {
  return actor.roles.some((role) => AUTHORITY_ROLES.has(role));
}

export function isEmployeeOnly(actor: ActorContext): boolean {
  return actor.roles.includes('EMPLOYEE') && !isTemplateAuthority(actor);
}

export function describeTemplateActor(actor: ActorContext): 'AUTHORITY' | 'EMPLOYEE' | 'OTHER' {
  if (isTemplateAuthority(actor)) return 'AUTHORITY';
  if (actor.roles.includes('EMPLOYEE')) return 'EMPLOYEE';
  return 'OTHER';
}

import type { ActorContext } from './types.js';

/**
 * Presentation-only descriptions of an actor's authority.
 *
 * The actor context carries scope *kinds* (GLOBAL / SITE / DEPARTMENT / DOMAIN
 * / TEAM) and role codes, not scope values. These helpers therefore describe
 * what is actually known and never invent a site, department, or name. They are
 * copy helpers: they are never an authorization decision and must not be used
 * to gate an action.
 */
const ROLE_LABELS: Readonly<Record<string, string>> = {
  SYSTEM_OWNER: 'System owner',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  EMPLOYEE: 'Employee',
};

const SCOPE_KIND_LABELS: Readonly<Record<string, string>> = {
  GLOBAL: 'All sites (global)',
  SITE: 'One site',
  DEPARTMENT: 'One department',
  DOMAIN: 'One domain',
  TEAM: 'One team',
};

export function actorRoleLabel(actor?: ActorContext): string {
  if (!actor) return 'Signed in';
  const labels = actor.roles.map((role) => ROLE_LABELS[role] ?? role);
  return labels.length ? labels.join(' · ') : 'No role assigned';
}

export function describeActorScope(actor?: ActorContext): string {
  if (!actor) return 'Your authorized scope';
  const kinds = [
    ...new Set(actor.permissions.flatMap((permission) => permission.scopes as readonly string[])),
  ];
  if (!kinds.length) return 'Your authorized work only';
  const labels = kinds.map((kind) => SCOPE_KIND_LABELS[kind] ?? kind);
  return labels.join(' · ');
}

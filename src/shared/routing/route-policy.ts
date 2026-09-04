import type { CanonicalRoute } from './route-types.js';

/**
 * Routing metadata is not authorization. Each protected request must still be
 * authorized by its Application Use Case against the current actor and scope.
 */
export function requiresAuthenticatedContext(route: CanonicalRoute): boolean {
  return route.access !== 'public';
}

export function requiresExplicitPermission(route: CanonicalRoute): boolean {
  return route.access === 'permission-bound';
}

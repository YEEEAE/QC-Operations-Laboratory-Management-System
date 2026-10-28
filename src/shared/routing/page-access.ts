import { isAdminOrCanonicalOwner, isNamedSystemOwner } from '../authorization/p05-authority.js';
import type { ActorContext } from '../authorization/types.js';
import { getRouteByPathname } from './routes.js';

export type PageAccessDecision = 'ALLOWED' | 'AUTHENTICATION_REQUIRED' | 'YAZEED_ONLY' | 'ADMIN_ONLY';

/**
 * Single server-side visibility decision for registered browser pages.
 * It governs page access only. Every mutation remains authorized by its
 * Application Use Case with its own permission, scope, state, SoD, and
 * business-rule checks.
 */
export function pageAccessDecision(
  actor: ActorContext | undefined,
  pathname: string,
): PageAccessDecision {
  const route = getRouteByPathname(pathname);
  const administrationRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  if (administrationRoute) {
    if (!actor || actor.accountState !== 'ACTIVE') return 'AUTHENTICATION_REQUIRED';
    return isAdminOrCanonicalOwner(actor) ? 'ALLOWED' : 'ADMIN_ONLY';
  }
  if (!actor || actor.accountState !== 'ACTIVE')
    return route?.visibility === 'PUBLIC' || !route ? 'ALLOWED' : 'AUTHENTICATION_REQUIRED';
  if (!route || route.visibility === 'PUBLIC') return 'ALLOWED';
  if (route.visibility === 'YAZEED_ONLY' && !isNamedSystemOwner(actor)) return 'YAZEED_ONLY';
  return 'ALLOWED';
}

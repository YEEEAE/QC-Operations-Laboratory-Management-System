import { safeReturnTo } from '../http/safe-return-to.js';

export type SessionRecoveryNotice = 'SESSION_ENDED' | 'ACCOUNT_UNAVAILABLE' | 'PASSWORD_CHANGED';

/**
 * Public, non-sensitive recovery copy for a protected-page redirect. The
 * notice is only a hint; the login action and server session resolver remain
 * authoritative. Never carry a mutation payload or credential into recovery.
 */
export function sessionRecoveryNotice(value: unknown): SessionRecoveryNotice | undefined {
  if (value === 'SESSION_ENDED' || value === 'ACCOUNT_UNAVAILABLE' || value === 'PASSWORD_CHANGED')
    return value;
  return undefined;
}

export function sessionRecoveryCopy(notice: SessionRecoveryNotice): string {
  if (notice === 'SESSION_ENDED')
    return 'Your session ended or expired. Sign in again to continue. The previous action was not resubmitted.';
  if (notice === 'PASSWORD_CHANGED')
    return 'Your password was changed and all active sessions ended. Sign in with your new password.';
  return 'This account cannot continue. Contact the system owner if you think access should be restored.';
}

/**
 * Selects the root route destination using the server-resolved session. Guests
 * may resume only at a same-origin path; unknown or external values fall back
 * to the dashboard. An expired/revoked session receives an explicit recovery
 * reason without replaying the original request.
 */
export function rootRedirectDestination(
  authenticated: boolean,
  returnTo: unknown,
  notice?: SessionRecoveryNotice,
): string {
  if (authenticated) return '/dashboard';

  const query = new URLSearchParams({ returnTo: safeReturnTo(returnTo) });
  if (notice) query.set('session', notice);
  return `/login?${query.toString()}`;
}

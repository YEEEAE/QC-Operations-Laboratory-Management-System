export type SessionRecoveryNotice = 'SESSION_ENDED' | 'ACCOUNT_UNAVAILABLE';

/**
 * Public, non-sensitive recovery copy for a protected-page redirect. The
 * notice is only a hint; the login action and server session resolver remain
 * authoritative. Never carry a mutation payload or credential into recovery.
 */
export function sessionRecoveryNotice(value: unknown): SessionRecoveryNotice | undefined {
  if (value === 'SESSION_ENDED' || value === 'ACCOUNT_UNAVAILABLE') return value;
  return undefined;
}

export function sessionRecoveryCopy(notice: SessionRecoveryNotice): string {
  if (notice === 'SESSION_ENDED')
    return 'Your session ended or expired. Sign in again to continue. The previous action was not resubmitted.';
  return 'This account cannot continue. Contact the system owner if you think access should be restored.';
}

import type { MutationState } from './mutation-interaction.js';

/**
 * Failure copy for the controlled administration journey.
 *
 * The server never sends a stack trace, SQL text, or secret; it sends a
 * canonical error code that the shared classifier turns into one of these
 * states. Each state gets its own message so an operator can tell a stale
 * record apart from an authorization change, a duplicate, or a missing
 * dependency instead of one generic "the change was not applied".
 */
export interface AdminFailureContext {
  /** Human-readable operation, for example `Remove role`. */
  operation: string;
  /** Human-readable target, for example `verify-user — USER`. */
  subject: string;
}

export const STALE_VERSION_MESSAGE =
  'This user record changed after you opened it. Refresh the latest data before trying again. Nothing was resubmitted.';

export function adminFailureMessage(state: MutationState, context: AdminFailureContext): string {
  const { operation, subject } = context;
  switch (state) {
    case 'CONFLICT_STALE':
      return STALE_VERSION_MESSAGE;
    case 'DUPLICATE_COMMAND':
      return `${operation} for ${subject} was already applied. Reload the record to see the current state — nothing was duplicated.`;
    case 'AUTHORIZATION_CHANGED':
      return `${operation} for ${subject} was denied. Your authority may have changed — reload the record and try again only if you are still authorized.`;
    case 'VALIDATION_ERROR':
      return `${operation} for ${subject} was not applied. Review the highlighted entries and try again. Your entries are preserved.`;
    case 'DEPENDENCY_UNAVAILABLE':
      return `${operation} for ${subject} was not applied because a referenced record is unavailable. Reload the record and check the current state.`;
    default:
      return `${operation} for ${subject} was not applied. Nothing was changed — try again, or reload the record.`;
  }
}

export function isStaleVersionState(state: MutationState): boolean {
  return state === 'CONFLICT_STALE';
}

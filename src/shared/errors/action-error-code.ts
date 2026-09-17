import type { ErrorCode } from './error-codes.js';

/**
 * Astro Action error codes. Astro only transports this fixed vocabulary, so
 * application error codes have to be projected onto it before crossing the
 * Action boundary.
 */
export type AstroActionErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR';

/**
 * Deterministic projection of the application error vocabulary onto the Astro
 * Action error vocabulary. This keeps authentication, authorization,
 * validation, not-found, and conflict failures distinguishable for the UI
 * instead of collapsing every server failure into one generic message. The
 * exact `ErrorCode` still travels as the Action message, so the client can
 * recover the precise cause without ever receiving a stack trace or SQL text.
 */
export function astroActionCodeFor(errorCode: ErrorCode): AstroActionErrorCode {
  switch (errorCode) {
    case 'AUTH_REQUIRED':
    case 'AUTH_SESSION_EXPIRED':
    case 'AUTH_INVALID_CREDENTIALS':
    case 'AUTH_ACCOUNT_DISABLED':
    case 'AUTH_SESSION_REVOKED':
    case 'AUTH_REAUTH_REQUIRED':
      return 'UNAUTHORIZED';
    case 'AUTHZ_DENIED':
    case 'AUTHZ_SCOPE_DENIED':
    case 'AUTHZ_SOD_VIOLATION':
    case 'AUTHZ_PERMISSION_MISSING':
      return 'FORBIDDEN';
    case 'RESOURCE_NOT_FOUND':
      return 'NOT_FOUND';
    case 'RESOURCE_ALREADY_EXISTS':
    case 'CONFLICT_STALE_VERSION':
    case 'CONFLICT_DUPLICATE_COMMAND':
      return 'CONFLICT';
    case 'DOMAIN_INVALID_TRANSITION':
    case 'DOMAIN_SIGNATURE_REQUIRED':
      return 'PRECONDITION_FAILED';
    case 'SYSTEM_INTERNAL':
    case 'SYSTEM_DATABASE_UNAVAILABLE':
    case 'SYSTEM_CONFIGURATION_INVALID':
      return 'INTERNAL_SERVER_ERROR';
    default:
      return 'BAD_REQUEST';
  }
}

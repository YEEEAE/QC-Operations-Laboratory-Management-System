import { asAppError } from './app-error';
import type { ErrorCode } from './error-codes';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: ErrorCode;
  requestId?: string;
  retryable: boolean;
  fieldErrors?: Record<string, readonly string[]>;
  [extension: string]: unknown;
}
const statuses: Record<string, number> = {
  AUTH: 401,
  AUTHZ: 403,
  VALIDATION: 422,
  DOMAIN: 422,
  CONFLICT: 409,
  RESOURCE: 404,
  SYSTEM: 500,
};

const POSTGRES_URL = /\bpostgres(?:ql)?:\/\/[^\s"'`<>]+/gi;
const URI_USERINFO = /\b(https?:\/\/)[^/@\s]+@/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT = /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\b/g;
const SECRET_QUERY_VALUE = /([?&][^=?&#\s]*(?:token|password|api[_-]?key|apikey|secret|credential|signature)[^=]*=)[^&#\s]*/gi;
const SECRET_HEADER = /\b((?:authorization|proxy-authorization|cookie|set-cookie|x-api-key)\s*[:=]\s*)[^\s,;]+/gi;
const INLINE_SECRET = /\b((?:EXPLABS_API_KEY|DATABASE_URL_UNPOOLED|MIGRATION_DATABASE_URL|password|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi;

function redactUserSafeText(value: string): string {
  return value
    .replace(POSTGRES_URL, '[REDACTED_DATABASE_URL]')
    .replace(URI_USERINFO, '$1[REDACTED]@')
    .replace(BEARER_TOKEN, 'Bearer [REDACTED]')
    .replace(JWT, '[REDACTED]')
    .replace(SECRET_QUERY_VALUE, '$1[REDACTED]')
    .replace(SECRET_HEADER, '$1[REDACTED]')
    .replace(INLINE_SECRET, '$1[REDACTED]');
}

function redactFieldErrors(errors: Record<string, readonly string[]>): Record<string, readonly string[]> {
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      redactUserSafeText(field),
      messages.map(redactUserSafeText),
    ]),
  );
}

export function statusForError(code: ErrorCode): number {
  if (code === 'SYSTEM_DATABASE_UNAVAILABLE') return 503;
  return statuses[code.split('_')[0]] ?? 500;
}
export function errorToProblemDetails(
  error: unknown,
  instance?: string,
  requestId?: string,
): ProblemDetails {
  const appError = asAppError(error);
  const status = statusForError(appError.code);
  const safeMetadata = appError.safeMetadata
    ? Object.fromEntries(
        Object.entries(appError.safeMetadata)
          .filter(([key]) =>
            ['retryAfterSeconds', 'currentVersion', 'fieldName', 'allowedRecoveryAction'].includes(key),
          )
          .map(([key, value]) => [key, typeof value === 'string' ? redactUserSafeText(value) : value]),
      )
    : {};
  return {
    type: `/problems/${appError.code.toLowerCase().replaceAll('_', '-')}`,
    title: appError.category,
    status,
    detail: redactUserSafeText(appError.userSafe ? appError.messageKey : 'The request could not be completed.'),
    ...(instance ? { instance: redactUserSafeText(instance) } : {}),
    code: appError.code,
    ...(requestId ? { requestId: redactUserSafeText(requestId) } : {}),
    retryable: appError.retryability !== 'NEVER',
    ...(appError.fieldErrors ? { fieldErrors: redactFieldErrors(appError.fieldErrors) } : {}),
    ...safeMetadata,
  };
}

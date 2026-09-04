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
        Object.entries(appError.safeMetadata).filter(([key]) =>
          ['retryAfterSeconds', 'currentVersion', 'fieldName', 'allowedRecoveryAction'].includes(
            key,
          ),
        ),
      )
    : {};
  return {
    type: `/problems/${appError.code.toLowerCase().replaceAll('_', '-')}`,
    title: appError.category,
    status,
    detail: appError.userSafe ? appError.messageKey : 'The request could not be completed.',
    ...(instance ? { instance } : {}),
    code: appError.code,
    ...(requestId ? { requestId } : {}),
    retryable: appError.retryability !== 'NEVER',
    ...(appError.fieldErrors ? { fieldErrors: appError.fieldErrors } : {}),
    ...safeMetadata,
  };
}

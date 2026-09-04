import { asAppError, type AppError } from './app-error';

export interface ActionErrorResult {
  ok: false;
  error: {
    code: string;
    messageKey: string;
    fieldErrors?: Record<string, readonly string[]>;
    requestId?: string;
  };
}
export function toActionError(error: unknown, requestId?: string): ActionErrorResult {
  const appError: AppError = asAppError(error);
  return {
    ok: false,
    error: {
      code: appError.code,
      messageKey: appError.messageKey,
      fieldErrors: appError.fieldErrors,
      requestId,
    },
  };
}

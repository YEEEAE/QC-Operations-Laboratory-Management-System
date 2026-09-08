import { asAppError, type AppError } from './app-error';

/**
 * Astro 4 exposes ActionError through a virtual module that is available to
 * the Action runtime, but it is not a reliable runtime constructor for
 * application modules after SSR bundling. Keep the boundary check structural
 * so an error path cannot itself turn into a 500.
 */
export function isAstroActionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { type?: unknown; code?: unknown; status?: unknown };
  return (
    candidate.type === 'AstroActionError' &&
    typeof candidate.code === 'string' &&
    typeof candidate.status === 'number'
  );
}

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

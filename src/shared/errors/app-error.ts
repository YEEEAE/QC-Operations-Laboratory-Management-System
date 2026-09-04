import {
  categoryForCode,
  type ErrorCategory,
  type ErrorCode,
  type Retryability,
} from './error-codes';

export interface FieldErrors {
  [field: string]: readonly string[];
}
export interface AppErrorOptions {
  messageKey?: string;
  userSafe?: boolean;
  retryability?: Retryability;
  fieldErrors?: FieldErrors;
  safeMetadata?: Readonly<Record<string, string | number | boolean>>;
  cause?: unknown;
  category?: ErrorCategory;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly userSafe: boolean;
  readonly retryability: Retryability;
  readonly messageKey: string;
  readonly fieldErrors?: FieldErrors;
  readonly safeMetadata?: Readonly<Record<string, string | number | boolean>>;

  constructor(code: ErrorCode, options: AppErrorOptions = {}) {
    super(options.messageKey ?? `errors.${code.toLowerCase()}`, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.category = options.category ?? categoryForCode(code);
    this.userSafe = options.userSafe ?? this.category === 'VALIDATION';
    this.retryability =
      options.retryability ?? (this.category === 'VALIDATION' ? 'AFTER_USER_CHANGE' : 'UNKNOWN');
    this.messageKey = options.messageKey ?? `errors.${code.toLowerCase()}`;
    this.fieldErrors = options.fieldErrors;
    this.safeMetadata = options.safeMetadata;
  }
}

export function asAppError(error: unknown): AppError {
  return error instanceof AppError
    ? error
    : new AppError('SYSTEM_INTERNAL', { cause: error, userSafe: false });
}

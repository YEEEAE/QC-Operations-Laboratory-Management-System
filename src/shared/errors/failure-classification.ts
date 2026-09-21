import { AppError } from './app-error.js';

export type FailureClass =
  'VALIDATION' | 'AUTHORIZATION' | 'STALE_STATE' | 'DUPLICATE' | 'DEPENDENCY' | 'UNKNOWN';

/** Stable, content-free classification for recovery decisions and telemetry. */
export function classifyFailure(error: unknown): FailureClass {
  if (!(error instanceof AppError)) return 'UNKNOWN';
  if (error.code.startsWith('AUTHZ_')) return 'AUTHORIZATION';
  if (error.code.startsWith('VALIDATION_')) return 'VALIDATION';
  if (error.code === 'CONFLICT_STALE_VERSION') return 'STALE_STATE';
  if (error.code === 'RESOURCE_ALREADY_EXISTS' || error.code === 'CONFLICT_DUPLICATE_COMMAND')
    return 'DUPLICATE';
  if (error.code === 'SYSTEM_DATABASE_UNAVAILABLE') return 'DEPENDENCY';
  return 'UNKNOWN';
}

/**
 * Per-delivery retry schedule for durable outbox effects. It bounds delay, not
 * attempts: retry exhaustion/dead-letter behavior requires an approved policy.
 */
export function outboxRetryDelayMs(attemptCount: number): number {
  const attempt = Number.isSafeInteger(attemptCount) ? Math.max(1, attemptCount) : 1;
  return Math.min(30_000 * 2 ** Math.min(attempt - 1, 5), 15 * 60_000);
}

/** Raw exception text may contain provider, file, database, or personal data. */
export function safeFailureSummary(error: unknown): string {
  switch (classifyFailure(error)) {
    case 'VALIDATION':
      return 'delivery rejected by validation';
    case 'AUTHORIZATION':
      return 'delivery rejected by authorization';
    case 'STALE_STATE':
      return 'delivery rejected because state is stale';
    case 'DUPLICATE':
      return 'duplicate delivery was rejected';
    case 'DEPENDENCY':
      return 'delivery dependency unavailable';
    default:
      return 'delivery failed';
  }
}

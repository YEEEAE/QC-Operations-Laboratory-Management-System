import { Kysely, PostgresDialect } from 'kysely';

import { AppError } from '../errors/app-error.js';
import { createTelemetryQueryPlugin } from '../observability/db-telemetry.js';
import { recordCounter } from '../observability/telemetry.js';
import type { DatabaseSchema } from './db-types.js';
import { getPool } from './pool.js';

export function createDatabase(): Kysely<DatabaseSchema> {
  return new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({ pool: getPool() }),
    plugins: [createTelemetryQueryPlugin()],
    log: (event) => {
      if (event.level === 'error') {
        recordCounter('qc_db_queries_total', 1, { dependency: 'postgres', outcome: 'error' });
      }
    },
  }).withSchema('qc');
}

let sharedDatabase: Kysely<DatabaseSchema> | undefined;

export function getDatabase(): Kysely<DatabaseSchema> {
  return (sharedDatabase ??= createDatabase());
}

/** Call after the Astro Node server has stopped accepting and drained requests to end Kysely's pg pool. */
export async function destroyDatabase(): Promise<void> {
  if (!sharedDatabase) return;
  const database = sharedDatabase;
  sharedDatabase = undefined;
  await database.destroy();
}

export type DatabaseFailureClass = 'CONSTRAINT' | 'NETWORK' | 'OTHER';

const networkErrorCodes = new Set([
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'ENETUNREACH',
  'EPIPE',
  'ETIMEDOUT',
]);

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : undefined;
}

/** Classify by stable error codes only; messages can contain server details. */
export function classifyDatabaseFailure(error: unknown): DatabaseFailureClass {
  const code = errorCode(error);
  if (!code) return 'OTHER';
  if (code.startsWith('23')) return 'CONSTRAINT';
  if (
    code.startsWith('08') ||
    networkErrorCodes.has(code) ||
    ['57P01', '57P02', '57P03'].includes(code)
  ) {
    return 'NETWORK';
  }
  return 'OTHER';
}

export function translateDatabaseError(error: unknown): AppError {
  // An AppError raised inside a transaction (e.g. a guarded write that found
  // no matching row) is already a classified domain error, not a database
  // failure; re-wrapping it as SYSTEM_DATABASE_UNAVAILABLE hid the real code
  // from callers (QC-100-FINAL-014).
  if (error instanceof AppError) return error;
  const code = errorCode(error);
  switch (code) {
    case '23505':
      return new AppError('RESOURCE_ALREADY_EXISTS', { cause: error, userSafe: true });
    case '23503':
      return new AppError('RESOURCE_NOT_FOUND', { cause: error, userSafe: true });
    case '23514':
      return new AppError('VALIDATION_FAILED', { cause: error, userSafe: true });
    case '40001':
      return new AppError('CONFLICT_DUPLICATE_COMMAND', {
        cause: error,
        retryability: 'INTERNAL_RETRY_ONLY',
      });
    case '40P01':
      return new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
        cause: error,
        retryability: 'INTERNAL_RETRY_ONLY',
      });
    case '55P03':
    case '57014':
      return new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
        cause: error,
        // A timeout or lock failure must not trigger a blind write retry.
        retryability: 'NEVER',
      });
    default:
      if (classifyDatabaseFailure(error) === 'CONSTRAINT') {
        return new AppError('VALIDATION_FAILED', {
          cause: error,
          userSafe: true,
          retryability: 'AFTER_USER_CHANGE',
        });
      }
      return new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
        cause: error,
        // A connection can fail after PostgreSQL committed a write. Callers
        // must reconcile idempotency/audit state before any retry.
        retryability: 'NEVER',
        safeMetadata: { databaseFailureClass: classifyDatabaseFailure(error) },
      });
  }
}

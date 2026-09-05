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
  });
}

let sharedDatabase: Kysely<DatabaseSchema> | undefined;

export function getDatabase(): Kysely<DatabaseSchema> {
  return (sharedDatabase ??= createDatabase());
}

export async function destroyDatabase(): Promise<void> {
  if (!sharedDatabase) return;
  const database = sharedDatabase;
  sharedDatabase = undefined;
  await database.destroy();
}

export function translateDatabaseError(error: unknown): AppError {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
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
        retryability: 'AFTER_DELAY',
      });
    default:
      return new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
        cause: error,
        retryability: 'AFTER_DELAY',
      });
  }
}

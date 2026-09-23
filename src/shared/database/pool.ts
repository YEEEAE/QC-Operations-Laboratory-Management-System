import { Pool, type PoolConfig } from 'pg';

import { getRuntimeConfig } from '../../config/runtime.js';
import { AppError } from '../errors/app-error.js';
import { reportDependencyFailure } from '../observability/dependency-failure.js';

let sharedPool: Pool | undefined;

function databaseError(cause: unknown): AppError {
  return new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
    cause,
    userSafe: false,
    retryability: 'AFTER_DELAY',
  });
}

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

export function getDatabaseConnectionConfig(value: string | undefined): PoolConfig {
  const connectionString = validateDatabaseUrl(value);
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get('sslmode')?.toLowerCase();

  if (sslMode === 'disable') {
    throw new DatabaseConfigurationError(
      'DATABASE_URL must use TLS for network database connections; sslmode=disable is not allowed.',
    );
  }

  // Preserve provider-supplied sslmode semantics. Adding an ssl object alongside
  // sslmode can make node-postgres override connection-string TLS settings.
  if (sslMode) return { connectionString };

  // No sslmode means the URL is incomplete for the canonical runtime path.
  // Node's default CA store verifies the provider certificate.
  return { connectionString, ssl: { rejectUnauthorized: true } };
}

export function validateDatabaseUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL is required. Set it through the approved secret mechanism; the value is never printed.',
    );
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
      throw new Error('unsupported protocol');
    }
    if (!url.hostname || !url.pathname || url.pathname === '/') {
      throw new Error('missing database name');
    }
    return value;
  } catch {
    throw new DatabaseConfigurationError(
      'DATABASE_URL is malformed. Provide a valid postgres:// or postgresql:// URL through the approved secret mechanism; the value is never printed.',
    );
  }
}

export function createPool(config: PoolConfig): Pool {
  return new Pool({
    ...config,
    application_name: config.application_name ?? 'qc-operations',
    options: [config.options, '-c timezone=UTC', '-c search_path=qc,pg_catalog']
      .filter(Boolean)
      .join(' '),
  });
}

export function getPool(): Pool {
  if (sharedPool) return sharedPool;

  const databaseUrl = validateDatabaseUrl(getRuntimeConfig().databaseUrl);

  sharedPool = createPool(getDatabaseConnectionConfig(databaseUrl));
  attachPoolErrorTelemetry(sharedPool);
  return sharedPool;
}

/** Exported separately so asynchronous idle-client failures can be injected in tests. */
export function attachPoolErrorTelemetry(
  pool: Pick<Pool, 'on'>,
  reportFailure = reportDependencyFailure,
): void {
  pool.on('error', (error) => {
    // Pool clients report errors asynchronously; the error is classified but never serialized.
    const classified = databaseError(error);
    void reportFailure({
      dependency: 'postgres',
      operation: 'pool_client',
      error: classified,
    });
  });
}

export async function closePool(): Promise<void> {
  if (!sharedPool) return;
  const pool = sharedPool;
  sharedPool = undefined;
  await pool.end();
}

export function resetPoolForTests(): void {
  sharedPool = undefined;
}

import { Pool, type PoolConfig } from 'pg';

import { getRuntimeDatabaseUrl } from '../../config/runtime.js';
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
  const channelBinding = url.searchParams.get('channel_binding')?.toLowerCase();

  if (sslMode === 'disable' || sslMode === 'no-verify') {
    throw new DatabaseConfigurationError(
      'PostgreSQL connections must verify the server certificate; insecure sslmode values are not allowed.',
    );
  }

  if (channelBinding && !['disable', 'prefer', 'require'].includes(channelBinding)) {
    throw new DatabaseConfigurationError('The PostgreSQL channel_binding parameter is invalid.');
  }
  // pg 8.23.0 can prefer SCRAM-SHA-256-PLUS through enableChannelBinding, but
  // cannot enforce libpq's strict channel_binding=require semantics. Fail
  // closed instead of silently falling back to ordinary SCRAM.
  if (channelBinding === 'require') {
    throw new DatabaseConfigurationError(
      'The installed pg client cannot enforce channel_binding=require; use a supported channel-binding mode.',
    );
  }

  // Preserve provider-supplied sslmode semantics. Adding an ssl object alongside
  // sslmode can make node-postgres override connection-string TLS settings.
  const channelBindingConfig = channelBinding === 'prefer' ? { enableChannelBinding: true } : {};
  if (sslMode) return { connectionString, ...channelBindingConfig };

  // No sslmode means the URL is incomplete for the canonical runtime path.
  // Node's default CA store verifies the provider certificate.
  return {
    connectionString,
    ssl: { rejectUnauthorized: true },
    ...channelBindingConfig,
  };
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
    ...withDatabaseStartupOptions(config),
    max: config.max ?? 5,
    idleTimeoutMillis: config.idleTimeoutMillis ?? 10_000,
    connectionTimeoutMillis: config.connectionTimeoutMillis ?? 10_000,
    query_timeout: config.query_timeout ?? 35_000,
    statement_timeout: config.statement_timeout ?? 30_000,
    idle_in_transaction_session_timeout: config.idle_in_transaction_session_timeout ?? 60_000,
    application_name: config.application_name ?? 'qc-operations',
  });
}

/** A small, independently owned pool for explicitly selected operator work. */
export function createMaintenancePool(config: PoolConfig): Pool {
  return new Pool({
    ...withDatabaseStartupOptions(config),
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    application_name: 'qc-operations-maintenance',
  });
}

function withDatabaseStartupOptions(config: PoolConfig): PoolConfig {
  const defaults = '-c timezone=UTC -c search_path=qc,pg_catalog';
  if (config.connectionString) {
    const url = new URL(config.connectionString);
    const options = [url.searchParams.get('options'), config.options, defaults]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' ');
    url.searchParams.set('options', options);
    return { ...config, connectionString: url.toString(), options: undefined };
  }
  return {
    ...config,
    options: [config.options, defaults].filter(Boolean).join(' '),
  };
}

/** Reject pooled Neon endpoints for tools that require a stable PostgreSQL session. */
export function assertDirectDatabaseEndpoint(value: string | undefined): string {
  const connectionString = validateDatabaseUrl(value);
  const hostname = new URL(connectionString).hostname.toLowerCase();
  const firstLabel = hostname.split('.')[0] ?? '';
  if (hostname.endsWith('.neon.tech') && firstLabel.endsWith('-pooler')) {
    throw new DatabaseConfigurationError(
      'Operator maintenance requires a provider-issued direct PostgreSQL endpoint.',
    );
  }
  return connectionString;
}

export function getPool(): Pool {
  if (sharedPool) return sharedPool;

  const databaseUrl = validateDatabaseUrl(getRuntimeDatabaseUrl());

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

import { Pool, type PoolConfig } from 'pg';

import { getRuntimeConfig } from '../../config/runtime.js';
import { AppError } from '../errors/app-error.js';

let sharedPool: Pool | undefined;

function databaseError(cause: unknown): AppError {
  return new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
    cause,
    userSafe: false,
    retryability: 'AFTER_DELAY',
  });
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

  const databaseUrl = getRuntimeConfig().databaseUrl;
  if (!databaseUrl) {
    throw new AppError('SYSTEM_CONFIGURATION_INVALID', { userSafe: false });
  }

  sharedPool = createPool({ connectionString: databaseUrl });
  sharedPool.on('error', (error) => {
    // Pool clients report errors asynchronously; do not leak driver details.
    void databaseError(error);
  });
  return sharedPool;
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

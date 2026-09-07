import { fileURLToPath } from 'node:url';

import {
  assertFoundationAuthorizationReady,
  inspectFoundationData,
} from '../../db/seeds/common.js';
import { createPool, getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { loadLocalEnv } from './load-local-env.js';

export async function runFoundationCheck(environment = process.env): Promise<void> {
  loadLocalEnv(environment);
  const pool = createPool({
    ...getDatabaseConnectionConfig(environment.DATABASE_URL),
    application_name: 'qc-foundation-seed-check',
  });
  try {
    const report = await inspectFoundationData(pool);
    console.log(`Roles: ${report.counts.roleCount}`);
    console.log(`Permissions: ${report.counts.permissionCount}`);
    console.log(`Role permissions: ${report.counts.rolePermissionCount}`);
    assertFoundationAuthorizationReady(report);
    console.log('Foundation authorization check passed.');
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFoundationCheck().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Foundation check failed.');
    process.exitCode = 1;
  });
}

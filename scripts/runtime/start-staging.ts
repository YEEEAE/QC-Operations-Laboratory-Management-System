import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadLocalEnv } from '../db/load-local-env.js';
import { getServerEnv } from '../../src/config/env.js';

// Load only runtime keys; direct database and bootstrap credentials stay out.
loadLocalEnv();
if (process.env.APP_ENVIRONMENT_PROFILE !== 'staging' || process.env.NEON_BRANCH !== 'staging') {
  throw new Error('The staging launcher requires the staging environment profile and branch.');
}
if (
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.MIGRATION_DATABASE_URL ||
  process.env.BOOTSTRAP_ADMIN_PASSWORD
) {
  throw new Error('Operator credentials must not enter the staging web process.');
}
getServerEnv();
process.env.HOST ??= '127.0.0.1';
process.env.PORT ??= '4327';
await import(pathToFileURL(resolve('dist/server/entry.mjs')).href);

import { Client } from 'pg';
import { parseServerEnv } from '../../config/env.js';
import type { ReadinessProbe } from './readiness.js';
import { getDatabaseConnectionConfig } from '../database/pool.js';

export class PostgresReadinessProbe implements ReadinessProbe {
  async isReady(): Promise<boolean> {
    let client: Client;
    try {
      const env = parseServerEnv(process.env);
      if (!env.DATABASE_URL) return false;
      client = new Client(getDatabaseConnectionConfig(env.DATABASE_URL));
    } catch {
      return false;
    }

    try {
      await client.connect();
      await client.query('SELECT 1');
      return true;
    } catch {
      return false;
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}

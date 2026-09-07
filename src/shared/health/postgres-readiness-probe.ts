import { Client } from 'pg';
import type { ReadinessProbe } from './readiness.js';
import { getDatabaseConnectionConfig } from '../database/pool.js';

export class PostgresReadinessProbe implements ReadinessProbe {
  async isReady(): Promise<boolean> {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      return false;
    }

    let client: Client;
    try {
      client = new Client(getDatabaseConnectionConfig(connectionString));
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

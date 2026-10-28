import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDatabase } from '../../../src/shared/database/database.js';
import { createPool, resetPoolForTests } from '../../../src/shared/database/pool.js';

const { configs } = vi.hoisted(() => ({ configs: [] as Record<string, unknown>[] }));
const pooledUrl = 'postgresql://runtime:synthetic@ep-example-pooler.us-east-2.aws.neon.tech/qc';

vi.mock('../../../src/config/runtime.js', () => ({ getRuntimeDatabaseUrl: () => pooledUrl }));
vi.mock('pg', () => ({
  Pool: class {
    constructor(config: Record<string, unknown>) {
      configs.push(config);
    }
    on() {
      return this;
    }
  },
}));

beforeEach(() => {
  configs.length = 0;
  resetPoolForTests();
});

function startupOptions(config: Record<string, unknown>) {
  return new URL(String(config.connectionString)).searchParams.get('options') ?? '';
}

describe('Neon pooled startup', () => {
  it('does not send the search_path startup option rejected by Neon PgBouncer', () => {
    createPool({ connectionString: pooledUrl });
    expect(startupOptions(configs[0]!)).not.toContain('search_path');
    expect(startupOptions(configs[0]!)).toContain('timezone=UTC');
  });

  it('preserves the direct connection session contract for maintenance and local databases', () => {
    createPool({ connectionString: 'postgresql://runtime:synthetic@localhost/qc' });
    expect(startupOptions(configs[0]!)).toContain('search_path=qc,pg_catalog');
  });

  it('qualifies application tables with qc without depending on session search_path', () => {
    const db = createDatabase();
    expect(db.selectFrom('users').select('id').compile().sql).toBe('select "id" from "qc"."users"');
  });
});

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterAll, describe, expect, it, vi } from 'vitest';

import { loadLocalEnv, parseLocalEnvFile } from '../../../scripts/db/load-local-env.js';
import {
  DatabaseConfigurationError,
  createPool,
  getDatabaseConnectionConfig,
  validateDatabaseUrl,
} from '../../../src/shared/database/pool.js';

const { poolConfigs } = vi.hoisted(() => ({ poolConfigs: [] as unknown[] }));

// Only the driver is replaced: `createPool` and `getDatabaseConnectionConfig`
// must stay real so the canonical session options handed to PostgreSQL can be
// inspected without a server.
vi.mock('pg', () => ({
  Pool: class {
    constructor(config: unknown) {
      poolConfigs.push(config);
    }

    on() {
      return this;
    }

    end() {
      return Promise.resolve();
    }
  },
}));

const URL_WITH_CREDENTIALS =
  'postgresql://qc_probe:live_secret_value@db.example.invalid:5432/qc_ops';

const tempDirectories: string[] = [];
function tempEnvDirectory(contents: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'qc-local-env-'));
  tempDirectories.push(directory);
  writeFileSync(join(directory, '.env'), contents, 'utf8');
  return directory;
}

afterAll(() => {
  for (const directory of tempDirectories) rmSync(directory, { recursive: true, force: true });
});

describe('runtime connection contract', () => {
  it('applies the canonical session contract (qc search_path + UTC) to the pool', () => {
    poolConfigs.length = 0;
    createPool({ connectionString: URL_WITH_CREDENTIALS });

    expect(poolConfigs).toHaveLength(1);
    const config = poolConfigs[0] as { application_name: string; options: string };
    expect(config.application_name).toBe('qc-operations');
    // The `qc` schema boundary and UTC timestamps are session options, not
    // per-query decoration. Without them the same database answers from
    // `public`, and every schema gate fails closed for the wrong reason.
    expect(config.options).toContain('-c search_path=qc,pg_catalog');
    expect(config.options).toContain('-c timezone=UTC');
  });

  it('preserves caller-supplied pool identity and options instead of replacing them', () => {
    poolConfigs.length = 0;
    createPool({
      connectionString: URL_WITH_CREDENTIALS,
      application_name: 'qc-foundation-seed',
      options: '-c statement_timeout=5000',
    });

    const config = poolConfigs[0] as { application_name: string; options: string };
    expect(config.application_name).toBe('qc-foundation-seed');
    expect(config.options).toContain('-c statement_timeout=5000');
    expect(config.options).toContain('-c search_path=qc,pg_catalog');
  });

  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['whitespace only', '   '],
    ['not a URL', 'not-a-postgres-url'],
    ['unsupported protocol', 'mysql://qc_probe:secret@db.example.invalid:3306/qc_ops'],
    ['missing database name', 'postgresql://qc_probe:secret@db.example.invalid:5432'],
  ])('rejects a %s DATABASE_URL without echoing the value', (_label, value) => {
    expect(() => validateDatabaseUrl(value)).toThrow(DatabaseConfigurationError);
    try {
      validateDatabaseUrl(value);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      // The credential value and host must never be echoed; only the fixed
      // guidance text may mention the approved secret mechanism.
      expect(message).not.toContain('live_secret_value');
      expect(message).not.toContain('db.example.invalid');
      expect(message).toMatch(/approved secret mechanism/);
    }
  });

  it('keeps TLS mandatory and never silently downgrades the connection', () => {
    expect(getDatabaseConnectionConfig(`${URL_WITH_CREDENTIALS}?sslmode=require`)).toEqual({
      connectionString: `${URL_WITH_CREDENTIALS}?sslmode=require`,
    });
    expect(getDatabaseConnectionConfig(URL_WITH_CREDENTIALS)).toMatchObject({
      ssl: { rejectUnauthorized: true },
    });
    expect(() => getDatabaseConnectionConfig(`${URL_WITH_CREDENTIALS}?sslmode=disable`)).toThrow(
      /TLS/,
    );
  });

  it('ignores a Render provider export instead of treating it as application config', () => {
    // Shape of the local Render "connection details" export. It is not an
    // application configuration file: the runtime only reads `DATABASE_URL`,
    // so provider display fields must never be adopted or surfaced.
    const exportContents = [
      'Connection details. *Render services.',
      'Hostname=dpg-examplehost-a',
      'Port=5432',
      'Database=qc_operations',
      'Username=qc_example_user',
      'Password=provider_export_password_value',
      'Internal_Database_URL=postgresql://qc_example_user:provider_export_password_value@dpg-examplehost-a/qc_operations',
      'External_Database_URL=postgresql://qc_example_user:provider_export_password_value@dpg-examplehost-a.oregon-postgres.render.com/qc_operations',
      'PSQL_Command=PGPASSWORD=provider_export_password_value psql -h host -U user -d db',
      'DATABASE_URL=postgresql://canonical_user:canonical_password@db.example.invalid:5432/qc_ops',
    ].join('\n');

    const parsed = parseLocalEnvFile(exportContents);

    expect(Object.keys(parsed)).toEqual(['DATABASE_URL']);
    expect(JSON.stringify(parsed)).not.toContain('provider_export_password_value');
    expect(JSON.stringify(parsed)).not.toContain('dpg-examplehost-a');
  });

  it('loads only allowlisted keys and never overwrites an explicit environment value', () => {
    const directory = tempEnvDirectory(
      [
        'DATABASE_URL=postgresql://from_file:file_secret@db.example.invalid:5432/qc_ops',
        'SERVICE_VERSION=9.9.9',
        'PSQL_Command=PGPASSWORD=file_secret psql',
        'Hostname=dpg-from-file-a',
      ].join('\n'),
    );

    const environment: NodeJS.ProcessEnv = { DATABASE_URL: 'postgresql://explicit_env_url' };
    loadLocalEnv(environment, join(directory, '.env'));

    expect(environment.DATABASE_URL).toBe('postgresql://explicit_env_url');
    expect(environment.SERVICE_VERSION).toBe('9.9.9');
    expect(environment.Hostname).toBeUndefined();
    expect(environment.PSQL_Command).toBeUndefined();
  });

  it('wires the ignored local .env into every documented standalone CLI entrypoint', () => {
    // Regression guard: these files previously imported `load-local-env.js`
    // for a side effect that never ran, so `pnpm db:preflight`, `db:migrate`,
    // `db:migrate:status`, `db:migrate:check`, `db:schema:check` and the
    // recovery validator silently ignored the local `.env` that
    // docs/operations/RENDER-DATABASE-CONNECTION.md documents them as loading.
    const entrypoints = [
      'scripts/db/preflight.ts',
      'scripts/db/migrate.ts',
      'scripts/db/migration-status.ts',
      'scripts/db/check-migration-integrity.ts',
      'scripts/db/check-schema-integrity.ts',
      'scripts/recovery/validate-restored-database.ts',
    ];

    for (const entrypoint of entrypoints) {
      const source = readFileSync(resolve(process.cwd(), entrypoint), 'utf8');
      expect(source, entrypoint).toContain('loadLocalEnv');
      expect(source, entrypoint).toMatch(/\bloadLocalEnv\(\);/);
      // A bare side-effect import never loads anything.
      expect(source, entrypoint).not.toMatch(/\bimport\s+['"][^'"]*load-local-env\.js['"]\s*;/);
    }
  });
});

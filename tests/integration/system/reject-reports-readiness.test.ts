import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMigrations, migrate } from '../../../scripts/db/migrate.js';
import { GetSystemHealthUseCase } from '../../../src/modules/system-health/application/get-system-health.js';
import { createPostgresMigrationStatus } from '../../../src/modules/system-health/infrastructure/postgres-migration-status.js';
import { PostgresRejectReportRepository } from '../../../src/modules/reject-reports/infrastructure/postgres-repository.js';
import { PostgresSystemHealthProbes } from '../../../src/modules/system-health/infrastructure/postgres-health-probes.js';
import type { BackupCatalogRepository } from '../../../src/modules/backup-recovery/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { createReadinessResponse } from '../../../src/shared/health/readiness.js';
import { RequiredWorkflowReadinessProbe } from '../../../src/shared/health/required-workflow-readiness.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const viewer: ActorContext = {
  id: '01900000-0000-7000-8000-000000000213',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: [
    { code: 'PERM-HLTH-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-HLTH-READINESS', scopes: ['GLOBAL'] },
  ],
};

const emptyCatalog: BackupCatalogRepository = {
  async listBackups() {
    return [];
  },
  async getBackup() {
    return undefined;
  },
  async listRestoreRuns() {
    return [];
  },
  async recordRestoreRequest() {
    throw new Error('not used here');
  },
};

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema> | undefined;

beforeAll(async () => {
  const container = await startPostgresContainer();
  const databaseUrl = getTestDatabaseUrl(container);
  pool = createPool({ connectionString: databaseUrl, max: 4 });
  await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');

  const migrations = await loadMigrations();
  await migrate({ pool, migrations: migrations.filter(({ version }) => version <= '0018') });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
});

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

describe('Reject Reports readiness against disposable PostgreSQL', () => {
  it('blocks readiness on old migration head using the same schema probe as the page', async () => {
    const database = db!;
    const migrations = await loadMigrations();
    const repository = new PostgresRejectReportRepository(database);
    const migrationStatus = createPostgresMigrationStatus(database);
    const oldStatus = await migrationStatus();
    const readinessProbe = new RequiredWorkflowReadinessProbe(
      {
        async isReady() {
          return true;
        },
      },
      [repository],
    );
    const response = await createReadinessResponse(readinessProbe);
    const health = await new GetSystemHealthUseCase(
      new PostgresSystemHealthProbes(database, async () => true),
      emptyCatalog,
      {
        migrationStatus,
        rejectReportsAvailability: () => repository.availability(),
      },
    ).execute({ actor: viewer });

    expect(oldStatus.appliedHead).toBe('0018');
    expect(oldStatus.buildHead).toBe(migrations.at(-1)?.version);
    expect(oldStatus.pending).toHaveLength(migrations.length - 18);
    expect(await repository.availability()).toEqual({
      available: false,
      reason: 'SCHEMA_NOT_READY',
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unhealthy' });
    expect(health.dependencyReadiness).toBe('READY');
    expect(health.rejectReportsReadiness).toBe('NOT_READY');
    expect(health.qcReleaseReadiness).toBe('BLOCKED');
    expect(health.checks.find(({ dependency }) => dependency === 'migration-schema')).toMatchObject(
      {
        status: 'DEGRADED',
        detail: `0018 applied; ${migrations.at(-1)?.version} shipped; ${migrations.length - 18} pending`,
      },
    );
  });

  it('reports workflow available after forward migrations but leaves QC release evidence unverified', async () => {
    const database = db!;
    const migrations = await loadMigrations();
    await migrate({ pool, migrations });
    const repository = new PostgresRejectReportRepository(database);
    const migrationStatus = createPostgresMigrationStatus(database);
    const status = await migrationStatus();
    const readinessProbe = new RequiredWorkflowReadinessProbe(
      {
        async isReady() {
          return true;
        },
      },
      [repository],
    );
    const response = await createReadinessResponse(readinessProbe);
    const health = await new GetSystemHealthUseCase(
      new PostgresSystemHealthProbes(database, async () => true),
      emptyCatalog,
      {
        migrationStatus,
        rejectReportsAvailability: () => repository.availability(),
      },
    ).execute({ actor: viewer });

    expect(status.appliedHead).toBe(migrations.at(-1)?.version);
    expect(status.buildHead).toBe(migrations.at(-1)?.version);
    expect(status.pending).toHaveLength(0);
    expect(await repository.availability()).toEqual({ available: true });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'healthy' });
    expect(health.dependencyReadiness).toBe('READY');
    expect(health.rejectReportsReadiness).toBe('READY');
    expect(health.qcReleaseReadiness).toBe('NOT_VERIFIED');
  });
});

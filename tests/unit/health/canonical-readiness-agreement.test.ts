import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSystemHealthUseCase } from '../../../src/modules/system-health/application/get-system-health.js';
import { PostgresSystemHealthProbes } from '../../../src/modules/system-health/infrastructure/postgres-health-probes.js';
import type { BackupCatalogRepository } from '../../../src/modules/backup-recovery/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import {
  checkCanonicalDatabaseReadiness,
  resolveCanonicalDatabaseUrl,
} from '../../../src/shared/health/canonical-database-readiness.js';
import { PostgresReadinessProbe } from '../../../src/shared/health/postgres-readiness-probe.js';
import { createReadinessResponse } from '../../../src/shared/health/readiness.js';

const { connectMock, endMock, queryMock, seenConfigs } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  endMock: vi.fn(),
  queryMock: vi.fn(),
  seenConfigs: [] as unknown[],
}));

vi.mock('pg', () => ({
  Client: class {
    constructor(config: unknown) {
      seenConfigs.push(config);
    }

    connect = connectMock;

    query = queryMock;

    end = endMock;
  },
}));

const VALID_URL = 'postgresql://qc_probe:probe_secret@db.internal:5432/qc_ops';
const SSLMODE_URL = 'postgresql://qc_probe:probe_secret@db.internal:5432/qc_ops?sslmode=require';

const viewer: ActorContext = {
  id: '01900000-0000-7000-8000-000000000211',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: [{ code: 'PERM-HLTH-VIEW', scopes: ['GLOBAL'] }],
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

function mockClientSuccess() {
  connectMock.mockResolvedValue(undefined);
  queryMock.mockResolvedValue({ rows: [{ '?column?': 1 }] });
  endMock.mockResolvedValue(undefined);
}

function mockClientFailure() {
  connectMock.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.9:5432'));
  endMock.mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.clearAllMocks();
  seenConfigs.length = 0;
  vi.stubEnv('NODE_ENV', 'test');
});

describe('canonical database readiness agreement (F-01)', () => {
  it('reports healthy on both surfaces with the canonical TLS configuration', async () => {
    vi.stubEnv('DATABASE_URL', VALID_URL);
    mockClientSuccess();

    const readiness = new PostgresReadinessProbe();
    const response = await createReadinessResponse(readiness);
    const view = await new GetSystemHealthUseCase(
      new PostgresSystemHealthProbes(),
      emptyCatalog,
    ).execute({ actor: viewer });

    expect(await readiness.isReady()).toBe(true);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'healthy' });
    expect(view.checks.find((item) => item.dependency === 'database')?.status).toBe('HEALTHY');
    expect(view.coreStatus).toBe('READY');
    // Canonical TLS: no provider sslmode means the driver must verify the
    // provider certificate instead of silently skipping TLS. Three canonical
    // checks run above (readiness response, explicit isReady, health view).
    expect(seenConfigs).toHaveLength(3);
    for (const config of seenConfigs) {
      expect(config).toMatchObject({
        connectionString: VALID_URL,
        ssl: { rejectUnauthorized: true },
      });
    }
  });

  it('reports unavailable on both surfaces when the database is unreachable', async () => {
    vi.stubEnv('DATABASE_URL', VALID_URL);
    mockClientFailure();

    const readiness = new PostgresReadinessProbe();
    const response = await createReadinessResponse(readiness);
    const view = await new GetSystemHealthUseCase(
      new PostgresSystemHealthProbes(),
      emptyCatalog,
    ).execute({ actor: viewer });
    const serialized = JSON.stringify({
      readiness: await (await createReadinessResponse(new PostgresReadinessProbe())).json(),
      view,
    });

    expect(await readiness.isReady()).toBe(false);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unhealthy' });
    expect(view.checks.find((item) => item.dependency === 'database')?.status).toBe('UNAVAILABLE');
    expect(view.coreStatus).toBe('NOT_READY');
    expect(serialized).not.toContain('probe_secret');
    expect(serialized).not.toContain('db.internal');
    expect(serialized).not.toContain('ECONNREFUSED');
  });

  it.each([
    { label: 'missing url', url: undefined, resolvesToUndefined: true },
    { label: 'malformed url', url: 'not-a-postgres-url', resolvesToUndefined: true },
    // sslmode=disable passes env-shape validation but is rejected by the
    // canonical TLS policy inside the check, so the resolver still returns it.
    {
      label: 'tls disabled',
      url: 'postgresql://qc_probe:probe_secret@db.internal:5432/qc_ops?sslmode=disable',
      resolvesToUndefined: false,
    },
  ])(
    'treats a configuration error ($label) as unavailable on both surfaces',
    async ({ url, resolvesToUndefined }) => {
      if (url === undefined) vi.stubEnv('DATABASE_URL', '');
      else vi.stubEnv('DATABASE_URL', url);
      mockClientSuccess();

      const readiness = new PostgresReadinessProbe();
      const response = await createReadinessResponse(readiness);
      const readinessBody = await response.json();
      const view = await new GetSystemHealthUseCase(
        new PostgresSystemHealthProbes(),
        emptyCatalog,
      ).execute({ actor: viewer });
      const serialized = JSON.stringify({ readiness: readinessBody, view });

      if (resolvesToUndefined) expect(resolveCanonicalDatabaseUrl()).toBeUndefined();
      expect(await checkCanonicalDatabaseReadiness(resolveCanonicalDatabaseUrl())).toBe(false);
      expect(await readiness.isReady()).toBe(false);
      expect(response.status).toBe(503);
      expect(view.checks.find((item) => item.dependency === 'database')?.status).toBe(
        'UNAVAILABLE',
      );
      expect(view.coreStatus).toBe('NOT_READY');
      expect(connectMock).not.toHaveBeenCalled();
      expect(serialized).not.toContain('probe_secret');
      expect(serialized).not.toContain('db.internal');
    },
  );

  it('preserves provider sslmode instead of overriding connection-string TLS settings', async () => {
    vi.stubEnv('DATABASE_URL', SSLMODE_URL);
    mockClientSuccess();

    expect(await new PostgresReadinessProbe().isReady()).toBe(true);
    expect(seenConfigs).toHaveLength(1);
    expect(seenConfigs[0]).toEqual({ connectionString: SSLMODE_URL });
  });
});

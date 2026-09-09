import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSystemHealthUseCase } from '../../../src/modules/system-health/application/get-system-health.js';
import { PostgresSystemHealthProbes } from '../../../src/modules/system-health/infrastructure/postgres-health-probes.js';
import type { BackupCatalogRepository } from '../../../src/modules/backup-recovery/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { readinessDependencies } from '../../../src/shared/health/health-dependencies.js';

const { connectMock, endMock, queryMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  endMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock('pg', () => ({
  Client: class {
    connect = connectMock;

    query = queryMock;

    end = endMock;
  },
}));

const VALID_URL = 'postgresql://qc_int:integration_secret@db.internal:5432/qc_ops';

const viewer: ActorContext = {
  id: '01900000-0000-7000-8000-000000000212',
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

async function readinessOutcome() {
  const dependencies = readinessDependencies();
  const response = await dependencies.createResponse(dependencies.probe);
  return { status: response.status, body: await response.json() };
}

async function systemHealthOutcome() {
  const view = await new GetSystemHealthUseCase(
    new PostgresSystemHealthProbes(),
    emptyCatalog,
  ).execute({ actor: viewer });
  return {
    coreStatus: view.coreStatus,
    database: view.checks.find((item) => item.dependency === 'database')?.status,
    serialized: JSON.stringify(view),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NODE_ENV', 'test');
});

describe('health surface agreement (F-01 integration)', () => {
  it('agrees on healthy when the canonical probe reaches the database', async () => {
    vi.stubEnv('DATABASE_URL', VALID_URL);
    connectMock.mockResolvedValue(undefined);
    queryMock.mockResolvedValue({ rows: [{ '?column?': 1 }] });
    endMock.mockResolvedValue(undefined);

    const readiness = await readinessOutcome();
    const health = await systemHealthOutcome();

    expect(readiness).toEqual({ status: 200, body: { status: 'healthy' } });
    expect(health.coreStatus).toBe('READY');
    expect(health.database).toBe('HEALTHY');
  });

  it('agrees on unavailable when the canonical probe cannot reach the database', async () => {
    vi.stubEnv('DATABASE_URL', VALID_URL);
    connectMock.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.9:5432'));
    endMock.mockResolvedValue(undefined);

    const readiness = await readinessOutcome();
    const health = await systemHealthOutcome();

    expect(readiness).toEqual({ status: 503, body: { status: 'unhealthy' } });
    expect(health.coreStatus).toBe('NOT_READY');
    expect(health.database).toBe('UNAVAILABLE');
    expect(health.serialized).not.toContain('integration_secret');
    expect(health.serialized).not.toContain('db.internal');
    expect(health.serialized).not.toContain('ECONNREFUSED');
  });

  it('agrees on unavailable for a configuration error without exposing connection details', async () => {
    vi.stubEnv(
      'DATABASE_URL',
      'postgresql://qc_int:integration_secret@db.internal:5432/qc_ops?sslmode=disable',
    );
    connectMock.mockResolvedValue(undefined);
    queryMock.mockResolvedValue({ rows: [{ '?column?': 1 }] });
    endMock.mockResolvedValue(undefined);

    const readiness = await readinessOutcome();
    const health = await systemHealthOutcome();

    // sslmode=disable is rejected by the canonical TLS policy before any
    // connection attempt, so the mocked success above must not leak through.
    expect(connectMock).not.toHaveBeenCalled();
    expect(readiness).toEqual({ status: 503, body: { status: 'unhealthy' } });
    expect(health.coreStatus).toBe('NOT_READY');
    expect(health.database).toBe('UNAVAILABLE');
    expect(health.serialized).not.toContain('integration_secret');
    expect(health.serialized).not.toContain('db.internal');
  });
});

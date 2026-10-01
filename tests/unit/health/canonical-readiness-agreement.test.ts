import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSystemHealthUseCase } from '../../../src/modules/system-health/application/get-system-health.js';
import { PostgresSystemHealthProbes } from '../../../src/modules/system-health/infrastructure/postgres-health-probes.js';
import { resetAiConfigurationForTests } from '../../../src/modules/ai-advisory/infrastructure/ai-configuration.js';
import type { BackupCatalogRepository } from '../../../src/modules/backup-recovery/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import {
  checkCanonicalDatabaseReadiness,
  inspectCanonicalDatabaseConfiguration,
  resolveCanonicalDatabaseUrl,
} from '../../../src/shared/health/canonical-database-readiness.js';
import { PostgresReadinessProbe } from '../../../src/shared/health/postgres-readiness-probe.js';
import { createReadinessResponse } from '../../../src/shared/health/readiness.js';
import {
  resetTelemetryProviders,
  setTelemetryProviders,
} from '../../../src/shared/observability/telemetry.js';

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

const VALID_URL = 'postgresql://localhost:5432/qc_ops';
const SSLMODE_URL = 'postgresql://localhost:5432/qc_ops?sslmode=require';

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

const readyWorkflow = {
  async migrationStatus() {
    return { appliedHead: '0037', buildHead: '0037', pending: [] };
  },
  async rejectReportsAvailability() {
    return { available: true as const };
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
  resetAiConfigurationForTests();
});

describe('canonical database readiness agreement (F-01)', () => {
  it('separates disabled policy, invalid policy, and missing provider configuration without probing providers', async () => {
    vi.stubEnv('AI_EXTERNAL_PROCESSING_APPROVED', 'false');
    expect(await new PostgresSystemHealthProbes().aiProvider()).toMatchObject({
      status: 'DEGRADED',
      detail: 'POLICY_DISABLED',
    });

    resetAiConfigurationForTests();
    vi.stubEnv('AI_EXTERNAL_PROCESSING_APPROVED', 'true');
    vi.stubEnv('AI_PROCESSING_POLICY_JSON', 'not-json');
    expect(await new PostgresSystemHealthProbes().aiProvider()).toMatchObject({
      status: 'DEGRADED',
      detail: 'POLICY_NOT_VALID',
    });

    resetAiConfigurationForTests();
    vi.stubEnv(
      'AI_PROCESSING_POLICY_JSON',
      JSON.stringify({
        status: 'APPROVED',
        policyId: 'synthetic',
        version: '1',
        sourceReference: 'synthetic',
        approvedBy: 'synthetic',
        approvedAt: '2026-10-01T00:00:00Z',
        providers: ['groq'],
        processingLocation: 'synthetic',
        retentionDays: 0,
        deletionTerms: 'synthetic',
        providerTraining: false,
        consentVersion: '1',
        permittedDataClasses: ['SYNTHETIC'],
        prohibitedDataClasses: [
          'PERSONAL_DATA',
          'CREDENTIALS',
          'CONFIDENTIAL_QC',
          'CONTROLLED_RECORDS',
          'UNAUTHORIZED_CONTENT',
        ],
      }),
    );
    expect(await new PostgresSystemHealthProbes().aiProvider()).toMatchObject({
      status: 'DEGRADED',
      detail: 'CONFIGURATION_MISSING',
    });
  });

  it('keeps liveness, readiness, capability degradation, and QC release status separate', async () => {
    vi.stubEnv('DATABASE_URL', VALID_URL);
    mockClientSuccess();
    const probes = {
      application: () => ({
        dependency: 'application',
        status: 'HEALTHY' as const,
        checkedAt: new Date(),
      }),
      database: () => ({
        dependency: 'database',
        status: 'HEALTHY' as const,
        checkedAt: new Date(),
      }),
      storage: () => ({
        dependency: 'storage',
        status: 'UNAVAILABLE' as const,
        checkedAt: new Date(),
      }),
      outbox: () => ({
        dependency: 'outbox',
        status: 'DEGRADED' as const,
        checkedAt: new Date(),
        detail: 'Pending messages: 3',
      }),
      aiProvider: () => ({
        dependency: 'ai-provider',
        status: 'UNAVAILABLE' as const,
        checkedAt: new Date(),
      }),
    };
    const view = await new GetSystemHealthUseCase(probes, emptyCatalog, readyWorkflow).execute({
      actor: {
        ...viewer,
        permissions: [
          ...viewer.permissions,
          { code: 'PERM-HLTH-READINESS', scopes: ['GLOBAL'] },
          { code: 'PERM-BKP-VIEW', scopes: ['GLOBAL'] },
        ],
      },
    });

    expect(view.dependencyReadiness).toBe('READY');
    expect(view.rejectReportsReadiness).toBe('READY');
    expect(view.qcReleaseReadiness).toBe('NOT_VERIFIED');
    expect(view.checks.find((item) => item.dependency === 'outbox')).toMatchObject({
      status: 'DEGRADED',
      detail: 'Pending messages: 3',
    });
    expect(view.checks.find((item) => item.dependency === 'storage')?.status).toBe('UNAVAILABLE');
    expect(view.aiCapability).toBe('UNAVAILABLE');
    expect(view.backupPosture).toMatchObject({
      restoreVerification: 'NOT_VERIFIED',
      postureStatus: 'UNKNOWN',
      knownGaps: ['BACKUP_CATALOG_EMPTY'],
    });
  });

  it('records outbox pending count as a bounded gauge without choosing a trend threshold', async () => {
    const setGauge = vi.fn();
    setTelemetryProviders(undefined, {
      createCounter: () => ({ increment: vi.fn() }),
      createGauge: () => ({ set: setGauge }),
    });
    const database = {
      selectFrom: () => ({
        select: () => ({ where: () => ({ executeTakeFirst: async () => ({ pending: '3' }) }) }),
      }),
    };
    try {
      const health = await new PostgresSystemHealthProbes(database as never).outbox();
      expect(health.status).toBe('DEGRADED');
      expect(setGauge).toHaveBeenCalledWith(3, { dependency: 'outbox' });
    } finally {
      resetTelemetryProviders();
    }
  });

  it('reports healthy on both surfaces with the canonical TLS configuration', async () => {
    vi.stubEnv('DATABASE_URL', VALID_URL);
    mockClientSuccess();

    const readiness = new PostgresReadinessProbe();
    const response = await createReadinessResponse(readiness);
    const view = await new GetSystemHealthUseCase(
      new PostgresSystemHealthProbes(),
      emptyCatalog,
      readyWorkflow,
    ).execute({ actor: viewer });

    expect(await readiness.isReady()).toBe(true);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'healthy' });
    expect(view.checks.find((item) => item.dependency === 'database')?.status).toBe('HEALTHY');
    expect(view.dependencyReadiness).toBe('READY');
    expect(view.rejectReportsReadiness).toBe('READY');
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
      readyWorkflow,
    ).execute({ actor: viewer });
    const serialized = JSON.stringify({
      readiness: await (await createReadinessResponse(new PostgresReadinessProbe())).json(),
      view,
    });

    expect(await readiness.isReady()).toBe(false);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unhealthy' });
    expect(view.checks.find((item) => item.dependency === 'database')?.status).toBe('UNAVAILABLE');
    expect(view.dependencyReadiness).toBe('NOT_READY');
    expect(serialized).not.toContain('postgresql://');
    expect(serialized).not.toContain('ECONNREFUSED');
  });

  it.each([
    {
      label: 'missing url',
      url: undefined,
      resolvesToUndefined: true,
      status: 'CONFIGURATION_MISSING',
    },
    {
      label: 'malformed url',
      url: 'not-a-postgres-url',
      resolvesToUndefined: true,
      status: 'CONFIGURATION_INVALID',
    },
    // sslmode=disable passes env-shape validation but is rejected by the
    // canonical TLS policy inside the check, so the resolver still returns it.
    {
      label: 'tls disabled',
      url: 'postgresql://localhost:5432/qc_ops?sslmode=disable',
      resolvesToUndefined: false,
      status: 'CONFIGURATION_INVALID',
    },
  ])(
    'separates a configuration error ($label) from provider outage on the health view',
    async ({ url, resolvesToUndefined, status }) => {
      if (url === undefined) vi.stubEnv('DATABASE_URL', '');
      else vi.stubEnv('DATABASE_URL', url);
      mockClientSuccess();

      const readiness = new PostgresReadinessProbe();
      const response = await createReadinessResponse(readiness);
      const readinessBody = await response.json();
      const view = await new GetSystemHealthUseCase(
        new PostgresSystemHealthProbes(),
        emptyCatalog,
        readyWorkflow,
      ).execute({ actor: viewer });
      const databaseHealth = await new PostgresSystemHealthProbes().database();
      const serialized = JSON.stringify({ readiness: readinessBody, view });

      if (resolvesToUndefined) expect(resolveCanonicalDatabaseUrl()).toBeUndefined();
      expect(await checkCanonicalDatabaseReadiness(resolveCanonicalDatabaseUrl())).toBe(false);
      expect(await readiness.isReady()).toBe(false);
      expect(response.status).toBe(503);
      expect(view.checks.find((item) => item.dependency === 'database')).toMatchObject({
        status: 'DEGRADED',
      });
      expect(databaseHealth.detail).toBe(status);
      expect(view.dependencyReadiness).toBe('NOT_READY');
      expect(connectMock).not.toHaveBeenCalled();
      expect(serialized).not.toContain('postgresql://');
    },
  );

  it('preserves provider sslmode instead of overriding connection-string TLS settings', async () => {
    vi.stubEnv('DATABASE_URL', SSLMODE_URL);
    mockClientSuccess();

    expect(await new PostgresReadinessProbe().isReady()).toBe(true);
    expect(seenConfigs).toHaveLength(1);
    expect(seenConfigs[0]).toEqual({ connectionString: SSLMODE_URL });
  });

  it('labels provider connectivity failure separately from missing configuration', async () => {
    vi.stubEnv('DATABASE_URL', VALID_URL);
    const health = await new PostgresSystemHealthProbes(undefined, async () => false).database();
    expect(inspectCanonicalDatabaseConfiguration({ DATABASE_URL: '' })).toEqual({
      status: 'MISSING',
    });
    expect(health).toMatchObject({ status: 'UNAVAILABLE', detail: 'PROVIDER_UNAVAILABLE' });
  });
});

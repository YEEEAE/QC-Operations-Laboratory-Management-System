import { describe, expect, it } from 'vitest';
import { GetSystemHealthUseCase } from '../../../src/modules/system-health/application/get-system-health.js';
import type {
  DependencyHealth,
  SystemHealthProbes,
} from '../../../src/modules/system-health/ports/health-probes.js';
import type { BackupCatalogRepository } from '../../../src/modules/backup-recovery/ports/repository.js';
import type { BackupRun } from '../../../src/modules/backup-recovery/domain/backup-record.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { SystemHealthReadinessDependencies } from '../../../src/modules/system-health/application/get-system-health.js';

const viewerId = '01900000-0000-7000-8000-000000000201';

const actor = (
  id: string,
  codes: readonly string[],
  scopes: readonly ('OWN' | 'GLOBAL')[] = ['GLOBAL'],
): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: codes.map((code) => ({
    code: code as ActorContext['permissions'][number]['code'],
    scopes,
  })),
});

const check = (
  dependency: string,
  status: DependencyHealth['status'],
  detail?: string,
): DependencyHealth => ({
  dependency,
  status,
  checkedAt: new Date('2026-09-05T10:00:00.000Z'),
  ...(detail ? { detail } : {}),
});

function probes(
  overrides: Partial<Record<keyof SystemHealthProbes, DependencyHealth | Error>> = {},
): SystemHealthProbes {
  const resolve = (
    name: string,
    override?: DependencyHealth | Error,
  ): DependencyHealth | Promise<DependencyHealth> => {
    if (override instanceof Error) throw override;
    return override ?? check(name, 'HEALTHY');
  };
  return {
    application: () => resolve('application', overrides.application),
    database: () => resolve('database', overrides.database),
    storage: () => resolve('storage', overrides.storage),
    outbox: () => resolve('outbox', overrides.outbox),
    aiProvider: () => resolve('ai-provider', overrides.aiProvider),
  };
}

function catalog(
  backups: ReturnType<typeof backup>[] = [],
  failing = false,
): BackupCatalogRepository {
  return {
    async listBackups() {
      if (failing) throw new Error('connection refused to 10.0.0.9:5432');
      return backups;
    },
    async getBackup() {
      return backups[0];
    },
    async listRestoreRuns() {
      return [];
    },
    async recordRestoreRequest() {
      throw new Error('not used here');
    },
  };
}

const backup = (state: string): BackupRun => ({
  id: '01900000-0000-7000-8000-000000000301',
  state: state as BackupRun['state'],
  requestedAt: new Date('2026-09-05T09:00:00.000Z'),
  requestId: 'req-1',
});

const healthViewer = actor(viewerId, ['PERM-HLTH-VIEW']);
const fullViewer = actor(viewerId, [
  'PERM-HLTH-VIEW',
  'PERM-HLTH-DATABASE',
  'PERM-HLTH-STORAGE',
  'PERM-HLTH-READINESS',
  'PERM-HLTH-AI',
  'PERM-BKP-VIEW',
]);

function readiness(
  overrides: Partial<{
    appliedHead: string;
    buildHead: string;
    pending: readonly string[];
    reportsAvailable: boolean;
    reportReason: 'SCHEMA_NOT_READY' | 'CHECK_FAILED';
  }> = {},
): SystemHealthReadinessDependencies {
  return {
    async migrationStatus() {
      return {
        appliedHead: overrides.appliedHead ?? '0037',
        buildHead: overrides.buildHead ?? '0037',
        pending: overrides.pending ?? [],
      };
    },
    async rejectReportsAvailability() {
      return overrides.reportsAvailable === false
        ? { available: false, reason: overrides.reportReason ?? 'SCHEMA_NOT_READY' }
        : { available: true };
    },
  };
}

describe('system health view', () => {
  it('denies a viewer without the explicit health view permission', async () => {
    const useCase = new GetSystemHealthUseCase(probes(), catalog(), readiness());
    await expect(useCase.execute({ actor: actor(viewerId, []) })).rejects.toThrowError(AppError);
  });

  it('denies an Admin whose role does not carry the explicit health view permission', async () => {
    const useCase = new GetSystemHealthUseCase(probes(), catalog(), readiness());
    await expect(
      useCase.execute({
        actor: { id: viewerId, accountState: 'ACTIVE', roles: ['ADMIN'], permissions: [] },
      }),
    ).rejects.toThrowError(AppError);
  });

  it('reports core READY with healthy critical dependencies and UNKNOWN backup posture when no backups exist', async () => {
    const view = await new GetSystemHealthUseCase(probes(), catalog(), readiness()).execute({
      actor: fullViewer,
    });
    expect(view.dependencyReadiness).toBe('READY');
    expect(view.rejectReportsReadiness).toBe('READY');
    expect(view.qcReleaseReadiness).toBe('NOT_VERIFIED');
    expect(view.checks.find((item) => item.dependency === 'database')?.status).toBe('HEALTHY');
    expect(view.backupPosture?.postureStatus).toBe('UNKNOWN');
    expect(view.backupPosture?.restoreVerification).toBe('NOT_VERIFIED');
  });

  it('keeps core READY when the optional AI provider is degraded', async () => {
    const view = await new GetSystemHealthUseCase(
      probes({ aiProvider: check('ai-provider', 'DEGRADED') }),
      catalog(),
      readiness(),
    ).execute({
      actor: fullViewer,
    });
    expect(view.aiCapability).toBe('DEGRADED');
    expect(view.dependencyReadiness).toBe('READY');
    expect(view.rejectReportsReadiness).toBe('READY');
  });

  it('reports core NOT READY when PostgreSQL is unavailable', async () => {
    const view = await new GetSystemHealthUseCase(
      probes({ database: check('database', 'UNAVAILABLE') }),
      catalog(),
      readiness(),
    ).execute({
      actor: fullViewer,
    });
    expect(view.dependencyReadiness).toBe('NOT_READY');
  });

  it('sanitizes a failing dependency probe and never leaks raw infrastructure errors', async () => {
    const view = await new GetSystemHealthUseCase(
      probes({
        database: new Error(
          'FATAL: password authentication failed for user "qc_app" host 10.0.0.9',
        ),
      }),
      catalog(),
      readiness(),
    ).execute({ actor: fullViewer });
    const database = view.checks.find((item) => item.dependency === 'database');
    expect(database?.status).toBe('UNAVAILABLE');
    expect(JSON.stringify(view)).not.toContain('qc_app');
    expect(JSON.stringify(view)).not.toContain('10.0.0.9');
    expect(JSON.stringify(view)).not.toContain('password');
  });

  it('returns UNKNOWN backup posture instead of a green state when the catalog read fails', async () => {
    const view = await new GetSystemHealthUseCase(probes(), catalog([], true), readiness()).execute({
      actor: fullViewer,
    });
    expect(view.backupPosture?.postureStatus).toBe('UNKNOWN');
    expect(view.backupPosture?.restoreVerification).toBe('UNKNOWN');
  });

  it('separates a succeeded backup job from an unverified restore in the backup posture', async () => {
    const view = await new GetSystemHealthUseCase(
      probes(),
      catalog([backup('CREATED')]),
      readiness(),
    ).execute({ actor: fullViewer });
    expect(view.backupPosture?.lastBackupJobState).toBe('CREATED');
    expect(view.backupPosture?.artifactVerified).toBe(false);
    expect(view.backupPosture?.restoreVerification).toBe('NOT_VERIFIED');
    expect(view.backupPosture?.postureStatus).toBe('DEGRADED');
  });

  it('omits privileged detail and backup posture for viewers without the granular permissions', async () => {
    const view = await new GetSystemHealthUseCase(
      probes(),
      catalog([backup('VERIFIED')]),
      readiness(),
    ).execute({ actor: healthViewer });
    expect(view.checks.find((item) => item.dependency === 'database')?.detail).toBeUndefined();
    expect(view.backupPosture).toBeUndefined();
  });

  it('blocks service and release readiness when the required workflow and migration head are old', async () => {
    const view = await new GetSystemHealthUseCase(
      probes(),
      catalog(),
      readiness({
        appliedHead: '0018',
        buildHead: '0037',
        pending: Array.from({ length: 19 }, (_, index) => String(index + 19).padStart(4, '0')),
        reportsAvailable: false,
      }),
    ).execute({ actor: fullViewer });

    expect(view.dependencyReadiness).toBe('READY');
    expect(view.rejectReportsReadiness).toBe('NOT_READY');
    expect(view.qcReleaseReadiness).toBe('BLOCKED');
    expect(view.checks.find((item) => item.dependency === 'reject-reports')).toMatchObject({
      status: 'UNAVAILABLE',
      detail: 'SCHEMA_NOT_READY',
    });
    expect(view.checks.find((item) => item.dependency === 'migration-schema')).toMatchObject({
      status: 'DEGRADED',
      detail: '0018 applied; 0037 shipped; 19 pending',
    });
  });

  it('keeps a failed schema check UNKNOWN instead of claiming a migration gap', async () => {
    const view = await new GetSystemHealthUseCase(
      probes(),
      catalog(),
      readiness({ reportsAvailable: false, reportReason: 'CHECK_FAILED' }),
    ).execute({ actor: fullViewer });

    expect(view.rejectReportsReadiness).toBe('UNKNOWN');
    expect(view.qcReleaseReadiness).toBe('BLOCKED');
    expect(view.checks.find((item) => item.dependency === 'reject-reports')).toMatchObject({
      status: 'UNKNOWN',
      detail: 'CHECK_FAILED',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { GetControlCenterOverviewUseCase } from '../../../src/modules/system-health/application/get-control-center-overview.js';
import type { SystemHealthProbes } from '../../../src/modules/system-health/ports/health-probes.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor = (overrides: Partial<ActorContext> = {}): ActorContext => ({
  id: 'actor-1',
  loginIdentity: 'employee',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [{ code: 'PERM-HLTH-VIEW', scopes: ['GLOBAL'] }],
  ...overrides,
});

const owner = () => actor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'] });

const healthyProbes: SystemHealthProbes = {
  application: async () => ({
    dependency: 'application',
    status: 'HEALTHY',
    checkedAt: new Date('2026-09-18T00:00:00Z'),
  }),
  database: async () => ({
    dependency: 'database',
    status: 'HEALTHY',
    detail: 'postgresql 18.6',
    checkedAt: new Date('2026-09-18T00:00:00Z'),
  }),
  storage: async () => ({
    dependency: 'storage',
    status: 'HEALTHY',
    checkedAt: new Date('2026-09-18T00:00:00Z'),
  }),
  outbox: async () => ({
    dependency: 'outbox',
    status: 'HEALTHY',
    checkedAt: new Date('2026-09-18T00:00:00Z'),
  }),
  aiProvider: async () => ({
    dependency: 'ai-provider',
    status: 'DEGRADED',
    checkedAt: new Date('2026-09-18T00:00:00Z'),
  }),
};

function useCase(overrides: Record<string, unknown> = {}) {
  return new GetControlCenterOverviewUseCase({
    probes: healthyProbes,
    auditReadiness: async () => ({ status: 'HEALTHY' }),
    migrationStatus: async () => ({ appliedHead: '0025', buildHead: '0025', pending: [] }),
    release: {
      status: 'VERIFIED',
      releaseId: 'rel-0123456789abcdef',
      buildId: 'build-1',
      buildTimestamp: '2026-09-18T00:00:00Z',
      environment: 'test',
      gitSha: 'a'.repeat(40),
      migrationHead: '0025_qc_closure_006_workflow',
      serviceVersion: '0.1.0',
    },
    now: () => new Date('2026-09-18T03:00:00Z'),
    ...overrides,
  });
}

describe('GetControlCenterOverviewUseCase', () => {
  it('denies every non-canonical actor even with full permissions', async () => {
    for (const current of [
      actor(),
      actor({ roles: ['ADMIN'] }),
      actor({ roles: ['MANAGER'] }),
      actor({ roles: ['SUPERVISOR'] }),
      actor({ loginIdentity: 'owner-like', roles: ['SYSTEM_OWNER'] }),
      actor({ loginIdentity: 'yazeed', roles: ['EMPLOYEE'] }),
      actor({ loginIdentity: 'yazeed', roles: ['SYSTEM_OWNER'], accountState: 'DISABLED' }),
    ]) {
      await expect(useCase().execute({ actor: current })).rejects.toMatchObject({
        code: 'AUTHZ_DENIED',
      });
    }
  });

  it('returns a sanitized live overview for the canonical owner', async () => {
    const view = await useCase().execute({ actor: owner() });
    expect(view.coreStatus).toBe('READY');
    expect(view.applicationStatus).toBe('HEALTHY');
    expect(view.databaseStatus).toBe('HEALTHY');
    expect(view.auditStatus).toBe('HEALTHY');
    expect(view.migration.appliedHead).toBe('0025');
    expect(view.migration.expectedHead).toBe('0025_qc_closure_006_workflow');
    expect(view.migration.drift).toBe(false);
    expect(view.release.releaseId).toBe('rel-0123456789abcdef');
    expect(view.release.gitSha).toBe('a'.repeat(40));
    expect(view.release.applicationVersion).toBe('0.1.0');
    expect(view.generatedAt).toEqual(new Date('2026-09-18T03:00:00Z'));
  });

  it('reports migration drift without exposing raw internals', async () => {
    const drifting = useCase({
      migrationStatus: async () => ({
        appliedHead: '0018',
        pending: ['0019_x', '0020_y'],
      }),
      release: { status: 'UNVERIFIED', migrationHead: '0025_qc_closure_006_workflow' },
    });
    const view = await drifting.execute({ actor: owner() });
    expect(view.migration.drift).toBe(true);
    expect(view.migration.appliedHead).toBe('0018');
    expect(view.migration.expectedHead).toBe('0025_qc_closure_006_workflow');
    expect(view.migration.pendingCount).toBe(2);
    expect(view.release.status).toBe('UNVERIFIED');
    // No raw error text, connection strings, or stack data crosses the boundary.
    expect(JSON.stringify(view)).not.toMatch(/password|postgres:\/\/|DATABASE_URL|at\s+\w+\s*\(/i);
  });

  it('fails closed to sanitized statuses, never leaking probe internals', async () => {
    const broken = useCase({
      probes: {
        ...healthyProbes,
        application: async () => {
          throw new Error('postgres://user:secret@host/db stack frame at x');
        },
      },
      migrationStatus: async () => {
        throw new Error('connection string leaked postgres://u:p@h');
      },
      release: { status: 'UNVERIFIED' },
    });
    const view = await broken.execute({ actor: owner() });
    expect(view.coreStatus).toBe('NOT_READY');
    expect(view.applicationStatus).toBe('UNAVAILABLE');
    expect(view.migration.appliedHead).toBe('UNKNOWN');
    expect(JSON.stringify(view)).not.toMatch(/secret|postgres:\/\/|stack frame/i);
  });
});

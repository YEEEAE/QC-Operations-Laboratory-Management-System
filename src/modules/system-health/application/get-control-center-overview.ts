import { AppError } from '../../../shared/errors/app-error.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ConfiguredReleaseIdentity } from '../../../config/release.js';
import type { HealthStatus, SystemHealthProbes } from '../ports/health-probes.js';

export type ControlCenterCoreStatus = 'READY' | 'NOT_READY';

export interface ControlCenterMigrationStatus {
  /** Applied head from qc.schema_migrations, or UNKNOWN when unreadable. */
  appliedHead: string;
  /** Expected head: server-derived release identity when present, otherwise the applied head. */
  expectedHead: string;
  pendingCount: number;
  drift: boolean;
}

export interface ControlCenterReleaseView {
  status: ConfiguredReleaseIdentity['status'];
  releaseId?: string;
  buildId?: string;
  buildTimestamp?: string;
  environment?: string;
  gitSha?: string;
  migrationHead?: string;
  applicationVersion?: string;
}

export interface ControlCenterOverview {
  coreStatus: ControlCenterCoreStatus;
  applicationStatus: HealthStatus;
  databaseStatus: HealthStatus;
  auditStatus: HealthStatus;
  migration: ControlCenterMigrationStatus;
  release: ControlCenterReleaseView;
  generatedAt: Date;
}

export interface ControlCenterOverviewDependencies {
  probes: SystemHealthProbes;
  auditReadiness: () => Promise<{ status: HealthStatus }>;
  migrationStatus: () => Promise<{ appliedHead: string; pending: readonly string[] }>;
  release: ConfiguredReleaseIdentity;
  now?: () => Date;
}

/**
 * Canonical-owner system overview. This use case is the server-side authority
 * for the owner control center header: it is gated by the canonical named
 * SYSTEM_OWNER identity (never by a role label or permission set alone), and
 * every dependency failure is sanitized to a fixed status — raw errors,
 * connection strings, and stack data never cross this boundary
 * (OBSERVABILITY-ARCHITECTURE sections 53-54).
 */
export class GetControlCenterOverviewUseCase {
  constructor(private readonly dependencies: ControlCenterOverviewDependencies) {}

  async execute(input: { actor: ActorContext }): Promise<ControlCenterOverview> {
    if (!isNamedSystemOwner(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });

    const now = this.dependencies.now ?? (() => new Date());
    const generatedAt = now();

    const probeStatus = async (probe: keyof SystemHealthProbes): Promise<HealthStatus> => {
      try {
        return (await this.dependencies.probes[probe]()).status;
      } catch {
        return 'UNAVAILABLE';
      }
    };

    const [applicationStatus, databaseStatus, auditResult, migrationResult] = await Promise.all([
      probeStatus('application'),
      probeStatus('database'),
      this.dependencies
        .auditReadiness()
        .then((result) => result.status)
        .catch(() => 'UNKNOWN' as const),
      this.dependencies
        .migrationStatus()
        .then((result) => ({ ok: true as const, result }))
        .catch(() => ({ ok: false as const })),
    ]);

    const release = this.dependencies.release;
    const appliedHead = migrationResult.ok ? migrationResult.result.appliedHead : 'UNKNOWN';
    const pendingCount = migrationResult.ok ? migrationResult.result.pending.length : 0;
    // The ledger stores the bare version ("0025"); the release identity carries
    // the full name ("0025_qc_closure_006_workflow"). Compare on the version.
    const expectedHead = release.migrationHead ?? appliedHead;
    const expectedVersion = expectedHead.slice(0, 4);
    const drift =
      appliedHead !== 'UNKNOWN' && (appliedHead !== expectedVersion || pendingCount > 0);

    return {
      coreStatus:
        applicationStatus === 'HEALTHY' && databaseStatus === 'HEALTHY' ? 'READY' : 'NOT_READY',
      applicationStatus,
      databaseStatus,
      auditStatus: auditResult,
      migration: { appliedHead, expectedHead, pendingCount, drift },
      release: {
        status: release.status,
        ...(release.releaseId ? { releaseId: release.releaseId } : {}),
        ...(release.buildId ? { buildId: release.buildId } : {}),
        ...(release.buildTimestamp ? { buildTimestamp: release.buildTimestamp } : {}),
        ...(release.environment ? { environment: release.environment } : {}),
        ...(release.gitSha ? { gitSha: release.gitSha } : {}),
        ...(release.migrationHead ? { migrationHead: release.migrationHead } : {}),
        ...(release.serviceVersion ? { applicationVersion: release.serviceVersion } : {}),
      },
      generatedAt,
    };
  }
}

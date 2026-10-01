import { AppError } from '../../../shared/errors/app-error.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ConfiguredReleaseIdentity } from '../../../config/release.js';
import type { HealthStatus, SystemHealthProbes } from '../ports/health-probes.js';

export type ControlCenterCoreStatus = 'READY' | 'NOT_READY';

export interface ControlCenterMigrationStatus {
  /** Applied head from qc.schema_migrations, or UNKNOWN when unreadable. */
  appliedHead: string;
  /**
   * Highest migration version shipped with the deployed build.
   *
   * This is never the applied head relabelled: an environment whose database
   * is behind its build must be able to say so (QC-100-FINAL-016 P2-2).
   */
  buildHead: string;
  /**
   * Expected head: the release identity's migration head when one is
   * configured, otherwise the deployed build's own migration head. Falls back
   * to UNKNOWN — never to the applied head — when neither is available.
   */
  expectedHead: string;
  pendingCount: number;
  integrityMismatches: readonly string[];
  sourceAvailable: boolean;
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
  sourceCheckedAt: {
    application: Date;
    database: Date;
    audit: Date;
    migration: Date;
  };
}

export interface ControlCenterOverviewDependencies {
  probes: SystemHealthProbes;
  auditReadiness: () => Promise<{ status: HealthStatus }>;
  migrationStatus: () => Promise<{
    appliedHead: string;
    buildHead: string;
    pending: readonly string[];
    integrityMismatches?: readonly string[];
    sourceAvailable?: boolean;
  }>;
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

    const probeStatus = async (
      probe: keyof SystemHealthProbes,
    ): Promise<{ status: HealthStatus; checkedAt: Date }> => {
      const fallbackCheckedAt = now();
      try {
        const health = await this.dependencies.probes[probe]();
        return { status: health.status, checkedAt: health.checkedAt };
      } catch {
        return { status: 'UNAVAILABLE', checkedAt: fallbackCheckedAt };
      }
    };

    const [applicationResult, databaseResult, auditResult, migrationResult] = await Promise.all([
      probeStatus('application'),
      probeStatus('database'),
      this.dependencies
        .auditReadiness()
        .then((result) => ({ status: result.status, checkedAt: now() }))
        .catch(() => ({ status: 'UNKNOWN' as const, checkedAt: now() })),
      this.dependencies
        .migrationStatus()
        .then((result) => ({ ok: true as const, result, checkedAt: now() }))
        .catch(() => ({ ok: false as const, checkedAt: now() })),
    ]);

    const applicationStatus = applicationResult.status;
    const databaseStatus = databaseResult.status;
    const release = this.dependencies.release;
    const appliedHead = migrationResult.ok ? migrationResult.result.appliedHead : 'UNKNOWN';
    const buildHead = migrationResult.ok ? migrationResult.result.buildHead : 'UNKNOWN';
    const pendingCount = migrationResult.ok ? migrationResult.result.pending.length : 0;
    const integrityMismatches = migrationResult.ok
      ? (migrationResult.result.integrityMismatches ?? [])
      : [];
    const sourceAvailable = migrationResult.ok && migrationResult.result.sourceAvailable !== false;
    // The ledger stores the bare version ("0025"); the release identity carries
    // the full name ("0025_qc_closure_006_workflow"). Compare on the version.
    // A release identity is authoritative for the *intended* head; otherwise the
    // deployed build's own migration set is the honest expectation. The applied
    // head is never substituted for the expectation (that relabelling hid the
    // production drift behind a self-contradicting card).
    const expectedHead = release.migrationHead ?? (buildHead !== 'NONE' ? buildHead : 'UNKNOWN');
    const expectedVersion = expectedHead.slice(0, 4);
    const drift =
      !sourceAvailable ||
      integrityMismatches.length > 0 ||
      (appliedHead !== 'UNKNOWN' && (appliedHead !== expectedVersion || pendingCount > 0));

    return {
      coreStatus:
        applicationStatus === 'HEALTHY' && databaseStatus === 'HEALTHY' ? 'READY' : 'NOT_READY',
      applicationStatus,
      databaseStatus,
      auditStatus: auditResult.status,
      migration: {
        appliedHead,
        buildHead,
        expectedHead,
        pendingCount,
        integrityMismatches,
        sourceAvailable,
        drift,
      },
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
      sourceCheckedAt: {
        application: applicationResult.checkedAt,
        database: databaseResult.checkedAt,
        audit: auditResult.checkedAt,
        migration: migrationResult.checkedAt,
      },
    };
  }
}

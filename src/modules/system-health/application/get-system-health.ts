import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import {
  describeBackupPosture,
  type BackupRunState,
  type RestoreVerificationStatus,
} from '../../backup-recovery/domain/backup-record.js';
import type { BackupCatalogRepository } from '../../backup-recovery/ports/repository.js';
import type { DependencyHealth, HealthStatus, SystemHealthProbes } from '../ports/health-probes.js';

export type CoreSystemStatus = 'READY' | 'NOT_READY';

export interface SystemHealthCheck {
  dependency: string;
  status: HealthStatus;
  detail?: string;
}

export interface SystemHealthBackupPosture {
  lastBackupJobState?: BackupRunState;
  lastBackupAt?: Date;
  artifactVerified: boolean;
  restoreVerification: RestoreVerificationStatus | 'UNKNOWN';
  postureStatus: HealthStatus;
  knownGaps: readonly string[];
}

export interface SystemHealthView {
  coreStatus: CoreSystemStatus;
  aiCapability: HealthStatus;
  checks: readonly SystemHealthCheck[];
  backupPosture?: SystemHealthBackupPosture;
  generatedAt: Date;
}

interface ProbeGate {
  probe: keyof SystemHealthProbes;
  dependency: string;
  detailPermission?: PermissionCode;
}

const checkOrder: readonly ProbeGate[] = [
  { probe: 'application', dependency: 'application' },
  { probe: 'database', dependency: 'database', detailPermission: 'PERM-HLTH-DATABASE' },
  { probe: 'storage', dependency: 'storage', detailPermission: 'PERM-HLTH-STORAGE' },
  { probe: 'outbox', dependency: 'outbox', detailPermission: 'PERM-HLTH-READINESS' },
  { probe: 'aiProvider', dependency: 'ai-provider', detailPermission: 'PERM-HLTH-AI' },
];

/**
 * Sanitized authenticated system health view. Deliberately distinct from the
 * machine /api/health endpoints: authorization is explicit, dependency
 * detail is permission-gated, failures are sanitized to fixed statuses
 * without raw infrastructure errors, and the backup posture always
 * separates backup job results from restore verification
 * (OBSERVABILITY-ARCHITECTURE.md sections 53-54 and BACKUP-RECOVERY-PLAN.md
 * section 62).
 */
export class GetSystemHealthUseCase {
  constructor(
    private readonly probes: SystemHealthProbes,
    private readonly catalog: BackupCatalogRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: { actor: ActorContext }): Promise<SystemHealthView> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-HLTH-VIEW',
        action: 'VIEW',
        entity: { type: 'SYSTEM_HEALTH', id: 'view', state: 'ACTIVE', domain: 'SYSTEM_OPERATION' },
        scope: { domain: 'SYSTEM_OPERATION' },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );

    const generatedAt = this.now();
    const raw = await Promise.all(
      checkOrder.map(async (gate): Promise<{ gate: ProbeGate; health: DependencyHealth }> => {
        try {
          const health = await this.probes[gate.probe]();
          return { gate, health };
        } catch {
          return {
            gate,
            health: { dependency: gate.dependency, status: 'UNAVAILABLE', checkedAt: generatedAt },
          };
        }
      }),
    );

    const byStatus = new Map<string, DependencyHealth>(
      raw.map((item) => [item.gate.dependency, item.health]),
    );
    const database = byStatus.get('database');
    const application = byStatus.get('application');
    const coreStatus: CoreSystemStatus =
      application?.status === 'HEALTHY' && database?.status === 'HEALTHY' ? 'READY' : 'NOT_READY';

    const has = (permission: PermissionCode) =>
      input.actor.permissions.some((grant) => grant.active !== false && grant.code === permission);

    const checks: SystemHealthCheck[] = checkOrder.map(({ dependency, detailPermission }) => {
      const health = byStatus.get(dependency) as DependencyHealth;
      const includeDetail = Boolean(health.detail && (!detailPermission || has(detailPermission)));
      return {
        dependency,
        status: health.status,
        ...(includeDetail ? { detail: health.detail } : {}),
      };
    });

    const view: SystemHealthView = {
      coreStatus,
      aiCapability: byStatus.get('ai-provider')?.status ?? 'UNKNOWN',
      checks,
      generatedAt,
    };

    if (has('PERM-BKP-VIEW')) view.backupPosture = await this.backupPosture();
    return view;
  }

  private async backupPosture(): Promise<SystemHealthBackupPosture> {
    try {
      const [latest] = await this.catalog.listBackups({ limit: 1 });
      if (!latest) {
        return {
          artifactVerified: false,
          restoreVerification: 'NOT_VERIFIED',
          postureStatus: 'UNKNOWN',
          knownGaps: ['NO_BACKUP_CATALOG_DATA'],
        };
      }
      const restoreRuns = await this.catalog.listRestoreRuns(latest.id);
      const posture = describeBackupPosture(latest, restoreRuns);
      const postureStatus: HealthStatus =
        latest.state === 'VERIFIED' && posture.restoreVerification === 'VERIFIED'
          ? 'HEALTHY'
          : ['FAILED', 'EXPIRED', 'DELETED'].includes(latest.state)
            ? 'UNAVAILABLE'
            : ['REQUESTED', 'RUNNING'].includes(latest.state)
              ? 'UNKNOWN'
              : 'DEGRADED';
      return {
        lastBackupJobState: posture.backupJobState,
        lastBackupAt: latest.requestedAt,
        artifactVerified: posture.artifactVerified,
        restoreVerification: posture.restoreVerification,
        postureStatus,
        knownGaps: posture.knownGaps,
      };
    } catch {
      return {
        artifactVerified: false,
        restoreVerification: 'UNKNOWN',
        postureStatus: 'UNKNOWN',
        knownGaps: ['BACKUP_CATALOG_UNAVAILABLE'],
      };
    }
  }
}

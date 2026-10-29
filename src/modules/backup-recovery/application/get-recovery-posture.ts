import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { BackupCatalogRepository } from '../ports/repository.js';
import type {
  RecoveryGovernanceRepository,
  RecoveryIncidentRecord,
  RecoveryPolicyEvent,
  RecoveryStorageBoundaryRecord,
} from '../ports/recovery-governance.js';
import type { RecoveryPolicyVersion } from '../domain/recovery-policy.js';
import {
  evaluateRecoveryReadiness,
  type RecoveryReadinessView,
} from '../domain/recovery-sla.js';

export interface RecoveryPostureView {
  readiness: RecoveryReadinessView;
  checkedAt: Date;
  /** Approved version in force at read time, when one exists. */
  currentPolicy?: RecoveryPolicyVersion;
  latestPolicy?: RecoveryPolicyVersion;
  policyHistory: readonly RecoveryPolicyVersion[];
  policyEvents: readonly RecoveryPolicyEvent[];
  incidents: readonly RecoveryIncidentRecord[];
  unresolvedIncidents: readonly RecoveryIncidentRecord[];
  storageBoundaries: readonly RecoveryStorageBoundaryRecord[];
  actions: {
    canDraftPolicy: boolean;
    canApprovePolicy: boolean;
    canRecordIncident: boolean;
    canResolveIncident: boolean;
    productionRestoreExecution: 'BLOCKED';
    restoreExecution: 'NOT_AVAILABLE';
  };
}

const hasPermission = (actor: ActorContext, code: string) =>
  actor.permissions.some((grant) => grant.active !== false && grant.code === code);

/**
 * Read-only recovery governance posture.
 *
 * Policy, service-level evidence, unresolved exceptions and environment
 * boundaries are composed from source records. A missing policy or boundary is
 * a real NOT_CONFIGURED fact, never a default. This use case never restores,
 * never approves and never writes.
 */
export class GetRecoveryPostureUseCase {
  constructor(
    private readonly catalog: BackupCatalogRepository,
    private readonly governance: RecoveryGovernanceRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: { actor: ActorContext }): Promise<RecoveryPostureView> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-BKP-VIEW',
        action: 'VIEW',
        entity: {
          type: 'BACKUP_RUN',
          id: 'catalog',
          state: 'REQUESTED',
          domain: 'BACKUP_RECOVERY',
        },
        scope: { domain: 'BACKUP_RECOVERY' },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );

    const checkedAt = this.now();
    const [latestPolicy, approvedPolicy, policyHistory, incidents, storageBoundaries] =
      await Promise.all([
        this.governance.latestPolicyVersion(),
        this.governance.latestApprovedPolicyVersion(),
        this.governance.listPolicyVersions(10),
        this.governance.listIncidents(50),
        this.governance.listStorageBoundaries(20),
      ]);

    const currentPolicy =
      approvedPolicy &&
      (!approvedPolicy.effectiveFrom || approvedPolicy.effectiveFrom.getTime() <= checkedAt.getTime()) &&
      (!approvedPolicy.effectiveTo || approvedPolicy.effectiveTo.getTime() > checkedAt.getTime())
        ? approvedPolicy
        : undefined;
    // Evidence is judged against the policy actually in force. An approved but
    // expired version is still passed so the view can report POLICY_EXPIRED
    // rather than pretending no policy ever existed.
    const policyForEvidence = currentPolicy ?? approvedPolicy ?? latestPolicy;

    const [latestBackup] = await this.catalog.listBackups({ limit: 1 });
    const restoreRuns = latestBackup ? await this.catalog.listRestoreRuns(latestBackup.id) : [];
    const drillEvidence = latestBackup
      ? await this.governance.listRecoveryEvidence(latestBackup.id)
      : [];

    const closedIncidentIds = new Set(
      incidents.flatMap((incident) => (incident.resolvesIncidentId ? [incident.resolvesIncidentId] : [])),
    );
    const unresolvedIncidents = incidents.filter(
      (incident) => incident.state === 'OPEN' && !closedIncidentIds.has(incident.id),
    );

    const readiness = evaluateRecoveryReadiness({
      ...(policyForEvidence ? { policy: policyForEvidence } : {}),
      ...(latestBackup ? { latestBackup } : {}),
      restoreRuns,
      drillEvidence,
      unresolvedExceptions: unresolvedIncidents.map((incident) => ({
        id: incident.id,
        reference: incident.reference,
        kind: incident.kind,
        environment: incident.environment,
        detectedAt: incident.detectedAt,
        summary: incident.summary,
      })),
      now: checkedAt,
    });

    const policyEvents = latestPolicy
      ? await this.governance.listPolicyEvents(latestPolicy.id)
      : [];

    const canManagePolicy = hasPermission(input.actor, 'PERM-BKP-POLICY-MANAGE');
    return {
      readiness,
      checkedAt,
      ...(currentPolicy ? { currentPolicy } : {}),
      ...(latestPolicy ? { latestPolicy } : {}),
      policyHistory,
      policyEvents,
      incidents,
      unresolvedIncidents,
      storageBoundaries,
      actions: {
        canDraftPolicy: canManagePolicy,
        canApprovePolicy:
          hasPermission(input.actor, 'PERM-BKP-POLICY-APPROVE') && isNamedSystemOwner(input.actor),
        canRecordIncident: canManagePolicy,
        canResolveIncident: canManagePolicy,
        productionRestoreExecution: 'BLOCKED',
        restoreExecution: 'NOT_AVAILABLE',
      },
    };
  }
}

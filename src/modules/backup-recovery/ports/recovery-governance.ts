import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  NormalizedRecoveryPolicyDraft,
  RecoveryPolicyVersion,
} from '../domain/recovery-policy.js';
import type { RecoveryDrillEvidence } from '../domain/recovery-sla.js';

export interface RecoveryPolicyEvent {
  id: string;
  policyVersionId: string;
  action: string;
  actorId: string;
  occurredAt: Date;
  reason: string;
  approvalReference?: string;
}

export interface RecoveryIncidentRecord {
  id: string;
  reference: string;
  kind: string;
  environment: string;
  detectedAt: Date;
  summary: string;
  state: 'OPEN' | 'RESOLVED';
  resolvedAt?: Date;
  resolutionSummary?: string;
  resolvesIncidentId?: string;
  recoveredDataAsOf?: Date;
  recoveryStartedAt?: Date;
  recoveryValidatedAt?: Date;
  observedRpoSeconds?: number;
  observedRtoSeconds?: number;
  policyVersionId?: string;
  recordedBy: string;
  createdAt: Date;
}

export interface RecoveryStorageBoundaryRecord {
  id: string;
  environment: string;
  boundaryLabel: string;
  artifactStoreKind: string;
  isolationState: 'NOT_CONFIGURED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'FAILED';
  crossEnvironmentReadAllowed: boolean;
  crossEnvironmentWriteAllowed: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface RecoveryProcedureAuthorizationRecord {
  id: string;
  environment: string;
  procedureReference: string;
  procedureRevision: string;
  procedureSourceSha256: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REVOKED';
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

/**
 * Persistence boundary for governed recovery policy, incident evidence,
 * environment storage boundaries and the separate recovery procedure
 * authorization. Implementations never return credentials, bucket names or
 * checksum values.
 */
export interface RecoveryGovernanceRepository {
  listPolicyVersions(limit: number): Promise<readonly RecoveryPolicyVersion[]>;
  getPolicyVersion(policyId: string): Promise<RecoveryPolicyVersion | undefined>;
  latestPolicyVersion(): Promise<RecoveryPolicyVersion | undefined>;
  /** Latest APPROVED version regardless of its effective window. */
  latestApprovedPolicyVersion(): Promise<RecoveryPolicyVersion | undefined>;
  createPolicyDraft(input: {
    draft: NormalizedRecoveryPolicyDraft;
    revision: number;
    supersedesId?: string;
    actor: ActorContext;
    requestId: string;
    now: Date;
  }): Promise<RecoveryPolicyVersion>;
  decidePolicy(input: {
    policyId: string;
    decision: 'APPROVE' | 'REJECT';
    reason: string;
    approvalReference?: string;
    actor: ActorContext;
    requestId: string;
    expectedVersion: bigint;
    now: Date;
  }): Promise<RecoveryPolicyVersion>;
  listPolicyEvents(policyId: string): Promise<readonly RecoveryPolicyEvent[]>;
  listRecoveryEvidence(backupRunId: string): Promise<readonly RecoveryDrillEvidence[]>;
  listStorageBoundaries(limit: number): Promise<readonly RecoveryStorageBoundaryRecord[]>;
  listIncidents(limit: number): Promise<readonly RecoveryIncidentRecord[]>;
  recordIncident(input: {
    reference: string;
    kind: string;
    environment: string;
    detectedAt: Date;
    summary: string;
    recoveredDataAsOf?: Date;
    recoveryStartedAt?: Date;
    recoveryValidatedAt?: Date;
    policyVersionId?: string;
    actor: ActorContext;
    requestId: string;
    now: Date;
  }): Promise<RecoveryIncidentRecord>;
  resolveIncident(input: {
    incidentId: string;
    resolutionSummary: string;
    recoveredDataAsOf?: Date;
    recoveryStartedAt?: Date;
    recoveryValidatedAt?: Date;
    actor: ActorContext;
    requestId: string;
    now: Date;
  }): Promise<RecoveryIncidentRecord>;
  getApprovedProcedureAuthorization(
    environment: string,
    now: Date,
  ): Promise<RecoveryProcedureAuthorizationRecord | undefined>;
}

import { createHash } from 'node:crypto';
import type { Kysely, Transaction } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { isUuid } from '../../../shared/id/uuid.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import {
  RECOVERY_POLICY_KEY,
  assertPolicyApprovable,
  type NormalizedRecoveryPolicyDraft,
  type RecoveryPolicySourceKind,
  type RecoveryPolicyStatus,
  type RecoveryPolicyVersion,
} from '../domain/recovery-policy.js';
import type { RecoveryDrillEvidence } from '../domain/recovery-sla.js';
import type {
  RecoveryGovernanceRepository,
  RecoveryIncidentRecord,
  RecoveryPolicyEvent,
  RecoveryProcedureAuthorizationRecord,
  RecoveryStorageBoundaryRecord,
} from '../ports/recovery-governance.js';

const sha256 = (value: unknown) =>
  createHash('sha256')
    .update(stableJson(value), 'utf8')
    .digest('hex');

const mapPolicy = (row: DatabaseRow<'recovery_policy_versions'>): RecoveryPolicyVersion => ({
  id: row.id,
  policyKey: row.policy_key,
  revision: row.revision,
  status: row.status as RecoveryPolicyStatus,
  ...(row.rpo_seconds !== null ? { rpoSeconds: Number(row.rpo_seconds) } : {}),
  ...(row.rto_seconds !== null ? { rtoSeconds: Number(row.rto_seconds) } : {}),
  ...(row.retention_days !== null ? { retentionDays: row.retention_days } : {}),
  ...(row.immutable_backup_copies !== null
    ? { immutableBackupCopies: row.immutable_backup_copies }
    : {}),
  ...(row.responsible_person ? { responsiblePerson: row.responsible_person } : {}),
  ...(row.policy_source_kind
    ? { sourceKind: row.policy_source_kind as RecoveryPolicySourceKind }
    : {}),
  ...(row.policy_reference ? { policyReference: row.policy_reference } : {}),
  ...(row.policy_revision ? { policyRevision: row.policy_revision } : {}),
  ...(row.policy_source_sha256 ? { policySourceSha256: row.policy_source_sha256 } : {}),
  ...(row.effective_from ? { effectiveFrom: row.effective_from } : {}),
  ...(row.effective_to ? { effectiveTo: row.effective_to } : {}),
  ...(row.approval_reference ? { approvalReference: row.approval_reference } : {}),
  ...(row.approved_by ? { approvedBy: row.approved_by } : {}),
  ...(row.approved_at ? { approvedAt: row.approved_at } : {}),
  ...(row.supersedes_id ? { supersedesId: row.supersedes_id } : {}),
  createdBy: row.created_by,
  createdAt: row.created_at,
  version: BigInt(row.version),
});

const mapIncident = (row: DatabaseRow<'recovery_incidents'>): RecoveryIncidentRecord => ({
  id: row.id,
  reference: row.incident_reference,
  kind: row.kind,
  environment: row.environment,
  detectedAt: row.detected_at,
  summary: row.summary,
  state: row.state as 'OPEN' | 'RESOLVED',
  ...(row.resolved_at ? { resolvedAt: row.resolved_at } : {}),
  ...(row.resolution_summary ? { resolutionSummary: row.resolution_summary } : {}),
  ...(row.resolves_incident_id ? { resolvesIncidentId: row.resolves_incident_id } : {}),
  ...(row.recovered_data_as_of ? { recoveredDataAsOf: row.recovered_data_as_of } : {}),
  ...(row.recovery_started_at ? { recoveryStartedAt: row.recovery_started_at } : {}),
  ...(row.recovery_validated_at ? { recoveryValidatedAt: row.recovery_validated_at } : {}),
  ...(row.observed_rpo_seconds !== null
    ? { observedRpoSeconds: Number(row.observed_rpo_seconds) }
    : {}),
  ...(row.observed_rto_seconds !== null
    ? { observedRtoSeconds: Number(row.observed_rto_seconds) }
    : {}),
  ...(row.policy_version_id ? { policyVersionId: row.policy_version_id } : {}),
  recordedBy: row.recorded_by,
  createdAt: row.created_at,
});

const policySnapshot = (policy: RecoveryPolicyVersion) => ({
  id: policy.id,
  revision: policy.revision,
  status: policy.status,
  rpoSeconds: policy.rpoSeconds ?? null,
  rtoSeconds: policy.rtoSeconds ?? null,
  retentionDays: policy.retentionDays ?? null,
  immutableBackupCopies: policy.immutableBackupCopies ?? null,
  responsiblePerson: policy.responsiblePerson ?? null,
  sourceKind: policy.sourceKind ?? null,
  policyReference: policy.policyReference ?? null,
  policyRevision: policy.policyRevision ?? null,
  policySourceSha256: policy.policySourceSha256 ?? null,
  effectiveFrom: policy.effectiveFrom?.toISOString() ?? null,
  effectiveTo: policy.effectiveTo?.toISOString() ?? null,
  approvalReference: policy.approvalReference ?? null,
  approvedAt: policy.approvedAt?.toISOString() ?? null,
});

/**
 * PostgreSQL adapter for governed recovery policy, incident evidence, storage
 * boundaries and procedure authorizations.
 *
 * Policy decisions, transition events and audit rows commit in one
 * transaction. Incident evidence is append-only. No method reads, stores or
 * returns bucket names, keys or credential material.
 */
export class PostgresRecoveryGovernanceRepository implements RecoveryGovernanceRepository {
  constructor(
    private readonly database: Kysely<DatabaseSchema>,
    private readonly auditForTransaction: (
      transaction: Transaction<DatabaseSchema>,
    ) => AuditRepository,
  ) {}

  async listPolicyVersions(limit: number): Promise<readonly RecoveryPolicyVersion[]> {
    try {
      const rows = await this.database
        .selectFrom('recovery_policy_versions')
        .selectAll()
        .orderBy('revision', 'desc')
        .limit(Math.min(Math.max(limit, 1), 50))
        .execute();
      return rows.map(mapPolicy);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async getPolicyVersion(policyId: string): Promise<RecoveryPolicyVersion | undefined> {
    if (!isUuid(policyId)) return undefined;
    try {
      const row = await this.database
        .selectFrom('recovery_policy_versions')
        .selectAll()
        .where('id', '=', policyId)
        .executeTakeFirst();
      return row ? mapPolicy(row) : undefined;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async latestPolicyVersion(): Promise<RecoveryPolicyVersion | undefined> {
    try {
      const row = await this.database
        .selectFrom('recovery_policy_versions')
        .selectAll()
        .orderBy('revision', 'desc')
        .limit(1)
        .executeTakeFirst();
      return row ? mapPolicy(row) : undefined;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async latestApprovedPolicyVersion(): Promise<RecoveryPolicyVersion | undefined> {
    try {
      const row = await this.database
        .selectFrom('recovery_policy_versions')
        .selectAll()
        .where('status', '=', 'APPROVED')
        .orderBy('effective_from', 'desc')
        .orderBy('revision', 'desc')
        .limit(1)
        .executeTakeFirst();
      return row ? mapPolicy(row) : undefined;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async createPolicyDraft(input: {
    draft: NormalizedRecoveryPolicyDraft;
    revision: number;
    supersedesId?: string;
    actor: ActorContext;
    requestId: string;
    now: Date;
  }): Promise<RecoveryPolicyVersion> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const inserted = await tx
          .insertInto('recovery_policy_versions')
          .values({
            revision: input.revision,
            status: 'PENDING_APPROVAL',
            rpo_seconds: input.draft.rpoSeconds === null ? null : BigInt(input.draft.rpoSeconds),
            rto_seconds: input.draft.rtoSeconds === null ? null : BigInt(input.draft.rtoSeconds),
            retention_days: input.draft.retentionDays,
            immutable_backup_copies: input.draft.immutableBackupCopies,
            responsible_person: input.draft.responsiblePerson,
            policy_source_kind: input.draft.sourceKind,
            policy_reference: input.draft.policyReference,
            policy_revision: input.draft.policyRevision,
            policy_source_sha256: input.draft.policySourceSha256,
            effective_from: input.draft.effectiveFrom,
            effective_to: input.draft.effectiveTo,
            approval_reference: null,
            approval_authority: null,
            approved_by: null,
            approved_at: null,
            supersedes_id: input.supersedesId ?? null,
            created_by: input.actor.id,
            request_id: input.requestId,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        const policy = mapPolicy(inserted);
        const snapshot = policySnapshot(policy);
        await tx
          .insertInto('recovery_policy_events')
          .values({
            policy_version_id: policy.id,
            action: 'DRAFTED',
            actor_id: input.actor.id,
            actor_login_identity: input.actor.loginIdentity ?? null,
            reason: 'Recovery policy version transcribed from an approved source.',
            approval_reference: null,
            snapshot: JSON.stringify(snapshot),
            snapshot_sha256: sha256(snapshot),
            request_id: input.requestId,
          })
          .execute();
        await this.auditForTransaction(tx).append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'RECOVERY_POLICY',
          subjectId: policy.id,
          action: 'DRAFT_RECOVERY_POLICY',
          newState: 'PENDING_APPROVAL',
          reason: 'Recovery policy version drafted from an approved source.',
          requestId: input.requestId,
          payload: {
            revision: policy.revision,
            policyReference: policy.policyReference ?? null,
            policyRevision: policy.policyRevision ?? null,
            policySourceSha256: policy.policySourceSha256 ?? null,
            objectivesRecorded: Boolean(policy.rpoSeconds && policy.rtoSeconds),
          },
        });
        return policy;
      });
    } catch (error) {
      throw error instanceof AppError ? error : translateDatabaseError(error);
    }
  }

  async decidePolicy(input: {
    policyId: string;
    decision: 'APPROVE' | 'REJECT';
    reason: string;
    approvalReference?: string;
    actor: ActorContext;
    requestId: string;
    expectedVersion: bigint;
    now: Date;
  }): Promise<RecoveryPolicyVersion> {
    if (!isUuid(input.policyId)) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    try {
      return await this.database.transaction().execute(async (tx) => {
        const current = await tx
          .selectFrom('recovery_policy_versions')
          .selectAll()
          .where('id', '=', input.policyId)
          .where('policy_key', '=', RECOVERY_POLICY_KEY)
          .forUpdate()
          .executeTakeFirst();
        if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        if (current.status !== 'PENDING_APPROVAL')
          throw new AppError('DOMAIN_INVALID_TRANSITION', {
            userSafe: true,
            safeMetadata: { reason: 'RECOVERY_POLICY_NOT_PENDING' },
          });
        if (BigInt(current.version) !== input.expectedVersion)
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

        if (input.decision === 'REJECT') {
          const updated = await tx
            .updateTable('recovery_policy_versions')
            .set({ status: 'REJECTED', version: input.expectedVersion + 1n })
            .where('id', '=', input.policyId)
            .where('version', '=', input.expectedVersion)
            .returningAll()
            .executeTakeFirstOrThrow();
          const rejected = mapPolicy(updated);
          const snapshot = policySnapshot(rejected);
          await tx
            .insertInto('recovery_policy_events')
            .values({
              policy_version_id: rejected.id,
              action: 'REJECTED',
              actor_id: input.actor.id,
              actor_login_identity: input.actor.loginIdentity ?? null,
              reason: input.reason,
              approval_reference: null,
              snapshot: JSON.stringify(snapshot),
              snapshot_sha256: sha256(snapshot),
              request_id: input.requestId,
            })
            .execute();
          await this.auditForTransaction(tx).append({
            actorType: 'USER',
            actorId: input.actor.id,
            subjectType: 'RECOVERY_POLICY',
            subjectId: rejected.id,
            action: 'REJECT_RECOVERY_POLICY',
            previousState: 'PENDING_APPROVAL',
            newState: 'REJECTED',
            reason: input.reason,
            requestId: input.requestId,
            payload: { revision: rejected.revision },
          });
          return rejected;
        }

        const candidate = mapPolicy(current);
        assertPolicyApprovable(candidate, {
          approvalReference: input.approvalReference ?? '',
          approvedBy: input.actor.id,
          createdBy: candidate.createdBy,
          now: input.now,
        });

        const superseded = await tx
          .selectFrom('recovery_policy_versions')
          .selectAll()
          .where('policy_key', '=', RECOVERY_POLICY_KEY)
          .where('status', '=', 'APPROVED')
          .where('id', '!=', input.policyId)
          .forUpdate()
          .executeTakeFirst();
        if (superseded) {
          const updatedSuperseded = await tx
            .updateTable('recovery_policy_versions')
            .set({ status: 'SUPERSEDED', version: BigInt(superseded.version) + 1n })
            .where('id', '=', superseded.id)
            .returningAll()
            .executeTakeFirstOrThrow();
          const previous = mapPolicy(updatedSuperseded);
          const previousSnapshot = policySnapshot(previous);
          await tx
            .insertInto('recovery_policy_events')
            .values({
              policy_version_id: previous.id,
              action: 'SUPERSEDED',
              actor_id: input.actor.id,
              actor_login_identity: input.actor.loginIdentity ?? null,
              reason: 'Superseded by an approved recovery policy version.',
              approval_reference: input.approvalReference ?? null,
              snapshot: JSON.stringify(previousSnapshot),
              snapshot_sha256: sha256(previousSnapshot),
              request_id: `${input.requestId}:supersede:${previous.id}`,
            })
            .execute();
          await this.auditForTransaction(tx).append({
            actorType: 'USER',
            actorId: input.actor.id,
            subjectType: 'RECOVERY_POLICY',
            subjectId: previous.id,
            action: 'SUPERSEDE_RECOVERY_POLICY',
            previousState: 'APPROVED',
            newState: 'SUPERSEDED',
            reason: 'Superseded by an approved recovery policy version.',
            requestId: `${input.requestId}:supersede`,
            payload: { revision: previous.revision, supersededByRevision: candidate.revision },
          });
        }

        const updated = await tx
          .updateTable('recovery_policy_versions')
          .set({
            status: 'APPROVED',
            approval_reference: input.approvalReference!.trim(),
            approval_authority: 'SYSTEM_OWNER_INTERNAL_APPROVAL',
            approved_by: input.actor.id,
            approved_at: input.now,
            supersedes_id: superseded?.id ?? candidate.supersedesId ?? null,
            version: input.expectedVersion + 1n,
          })
          .where('id', '=', input.policyId)
          .where('version', '=', input.expectedVersion)
          .returningAll()
          .executeTakeFirstOrThrow();
        const approved = mapPolicy(updated);
        const approvedSnapshot = policySnapshot(approved);
        await tx
          .insertInto('recovery_policy_events')
          .values({
            policy_version_id: approved.id,
            action: 'APPROVED',
            actor_id: input.actor.id,
            actor_login_identity: input.actor.loginIdentity ?? null,
            reason: input.reason,
            approval_reference: approved.approvalReference ?? null,
            snapshot: JSON.stringify(approvedSnapshot),
            snapshot_sha256: sha256(approvedSnapshot),
            request_id: input.requestId,
          })
          .execute();
        await this.auditForTransaction(tx).append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'RECOVERY_POLICY',
          subjectId: approved.id,
          action: 'APPROVE_RECOVERY_POLICY',
          previousState: 'PENDING_APPROVAL',
          newState: 'APPROVED',
          reason: input.reason,
          requestId: input.requestId,
          payload: {
            revision: approved.revision,
            approvalReference: approved.approvalReference ?? null,
            approvalAuthority: 'SYSTEM_OWNER_INTERNAL_APPROVAL',
            effectiveFrom: approved.effectiveFrom?.toISOString() ?? null,
            rpoSeconds: approved.rpoSeconds ?? null,
            rtoSeconds: approved.rtoSeconds ?? null,
            retentionDays: approved.retentionDays ?? null,
            immutableBackupCopies: approved.immutableBackupCopies ?? null,
          },
        });
        return approved;
      });
    } catch (error) {
      throw error instanceof AppError ? error : translateDatabaseError(error);
    }
  }

  async listPolicyEvents(policyId: string): Promise<readonly RecoveryPolicyEvent[]> {
    if (!isUuid(policyId)) return [];
    try {
      const rows = await this.database
        .selectFrom('recovery_policy_events')
        .selectAll()
        .where('policy_version_id', '=', policyId)
        .orderBy('occurred_at', 'asc')
        .execute();
      return rows.map((row) => ({
        id: row.id,
        policyVersionId: row.policy_version_id,
        action: row.action,
        actorId: row.actor_id,
        occurredAt: row.occurred_at,
        reason: row.reason,
        ...(row.approval_reference ? { approvalReference: row.approval_reference } : {}),
      }));
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async listRecoveryEvidence(backupRunId: string): Promise<readonly RecoveryDrillEvidence[]> {
    if (!isUuid(backupRunId)) return [];
    try {
      const rows = await this.database
        .selectFrom('recovery_evidence')
        .select([
          'id',
          'restore_run_id',
          'result',
          'started_at',
          'completed_at',
          'measured_rto_seconds',
          'target_environment',
          'known_gaps',
        ])
        .where('backup_run_id', '=', backupRunId)
        .orderBy('created_at', 'desc')
        .execute();
      return rows.flatMap((row) => {
        if (!row.restore_run_id) return [];
        return [
          {
            restoreRunId: row.restore_run_id,
            outcome: row.result as RecoveryDrillEvidence['outcome'],
            startedAt: row.started_at,
            ...(row.completed_at ? { completedAt: row.completed_at } : {}),
            ...(row.measured_rto_seconds !== null
              ? { observedRestoreSeconds: Number(row.measured_rto_seconds) }
              : {}),
            targetEnvironment: row.target_environment,
            knownGaps: Array.isArray(row.known_gaps)
              ? row.known_gaps.filter((value): value is string => typeof value === 'string')
              : [],
          },
        ];
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async listStorageBoundaries(limit: number): Promise<readonly RecoveryStorageBoundaryRecord[]> {
    try {
      const rows = await this.database
        .selectFrom('recovery_storage_boundaries')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(Math.min(Math.max(limit, 1), 100))
        .execute();
      const seen = new Set<string>();
      const latest: RecoveryStorageBoundaryRecord[] = [];
      for (const row of rows) {
        if (seen.has(row.environment)) continue;
        seen.add(row.environment);
        latest.push({
          id: row.id,
          environment: row.environment,
          boundaryLabel: row.boundary_label,
          artifactStoreKind: row.artifact_store_kind,
          isolationState: row.isolation_state as RecoveryStorageBoundaryRecord['isolationState'],
          crossEnvironmentReadAllowed: row.cross_environment_read_allowed,
          crossEnvironmentWriteAllowed: row.cross_environment_write_allowed,
          ...(row.verified_at ? { verifiedAt: row.verified_at } : {}),
          createdAt: row.created_at,
        });
      }
      return latest;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async listIncidents(limit: number): Promise<readonly RecoveryIncidentRecord[]> {
    try {
      const rows = await this.database
        .selectFrom('recovery_incidents')
        .selectAll()
        .orderBy('detected_at', 'desc')
        .limit(Math.min(Math.max(limit, 1), 100))
        .execute();
      return rows.map(mapIncident);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async recordIncident(input: {
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
  }): Promise<RecoveryIncidentRecord> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const observed = observedDurations(input);
        const inserted = await tx
          .insertInto('recovery_incidents')
          .values({
            incident_reference: input.reference,
            kind: input.kind,
            environment: input.environment,
            detected_at: input.detectedAt,
            summary: input.summary,
            state: 'OPEN',
            resolved_at: null,
            resolution_summary: null,
            resolves_incident_id: null,
            recovered_data_as_of: input.recoveredDataAsOf ?? null,
            recovery_started_at: input.recoveryStartedAt ?? null,
            recovery_validated_at: input.recoveryValidatedAt ?? null,
            observed_rpo_seconds: observed.rpoSeconds,
            observed_rto_seconds: observed.rtoSeconds,
            policy_version_id: input.policyVersionId ?? null,
            storage_boundary_id: null,
            recorded_by: input.actor.id,
            request_id: input.requestId,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.auditForTransaction(tx).append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'RECOVERY_INCIDENT',
          subjectId: inserted.id,
          action: 'RECORD_RECOVERY_INCIDENT',
          newState: 'OPEN',
          reason: input.summary,
          requestId: input.requestId,
          payload: {
            reference: input.reference,
            kind: input.kind,
            environment: input.environment,
            observedRpoSeconds: observed.rpoSeconds,
            observedRtoSeconds: observed.rtoSeconds,
          },
        });
        return mapIncident(inserted);
      });
    } catch (error) {
      throw error instanceof AppError ? error : translateDatabaseError(error);
    }
  }

  async resolveIncident(input: {
    incidentId: string;
    resolutionSummary: string;
    recoveredDataAsOf?: Date;
    recoveryStartedAt?: Date;
    recoveryValidatedAt?: Date;
    actor: ActorContext;
    requestId: string;
    now: Date;
  }): Promise<RecoveryIncidentRecord> {
    if (!isUuid(input.incidentId)) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    try {
      return await this.database.transaction().execute(async (tx) => {
        const original = await tx
          .selectFrom('recovery_incidents')
          .selectAll()
          .where('id', '=', input.incidentId)
          .forUpdate()
          .executeTakeFirst();
        if (!original) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        if (original.state !== 'OPEN')
          throw new AppError('DOMAIN_INVALID_TRANSITION', {
            userSafe: true,
            safeMetadata: { reason: 'RECOVERY_INCIDENT_ALREADY_CLOSED' },
          });
        const existingClosure = await tx
          .selectFrom('recovery_incidents')
          .select('id')
          .where('resolves_incident_id', '=', original.id)
          .executeTakeFirst();
        if (existingClosure)
          throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
        const observed = observedDurations({
          detectedAt: original.detected_at,
          ...(input.recoveredDataAsOf ? { recoveredDataAsOf: input.recoveredDataAsOf } : {}),
          ...(input.recoveryStartedAt ? { recoveryStartedAt: input.recoveryStartedAt } : {}),
          ...(input.recoveryValidatedAt ? { recoveryValidatedAt: input.recoveryValidatedAt } : {}),
        });
        const inserted = await tx
          .insertInto('recovery_incidents')
          .values({
            incident_reference: `${original.incident_reference}:CLOSURE`,
            kind: original.kind,
            environment: original.environment,
            detected_at: original.detected_at,
            summary: input.resolutionSummary,
            state: 'RESOLVED',
            resolved_at: input.now,
            resolution_summary: input.resolutionSummary,
            resolves_incident_id: original.id,
            recovered_data_as_of: input.recoveredDataAsOf ?? original.recovered_data_as_of,
            recovery_started_at: input.recoveryStartedAt ?? original.recovery_started_at,
            recovery_validated_at: input.recoveryValidatedAt ?? original.recovery_validated_at,
            observed_rpo_seconds: observed.rpoSeconds ?? original.observed_rpo_seconds,
            observed_rto_seconds: observed.rtoSeconds ?? original.observed_rto_seconds,
            policy_version_id: original.policy_version_id,
            storage_boundary_id: original.storage_boundary_id,
            recorded_by: input.actor.id,
            request_id: input.requestId,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.auditForTransaction(tx).append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'RECOVERY_INCIDENT',
          subjectId: inserted.id,
          action: 'RESOLVE_RECOVERY_INCIDENT',
          previousState: 'OPEN',
          newState: 'RESOLVED',
          reason: input.resolutionSummary,
          requestId: input.requestId,
          payload: {
            resolvesIncidentId: original.id,
            reference: original.incident_reference,
            observedRpoSeconds: inserted.observed_rpo_seconds,
            observedRtoSeconds: inserted.observed_rto_seconds,
          },
        });
        return mapIncident(inserted);
      });
    } catch (error) {
      throw error instanceof AppError ? error : translateDatabaseError(error);
    }
  }

  async getApprovedProcedureAuthorization(
    environment: string,
    now: Date,
  ): Promise<RecoveryProcedureAuthorizationRecord | undefined> {
    try {
      const row = await this.database
        .selectFrom('recovery_procedure_authorizations')
        .selectAll()
        .where('environment', '=', environment)
        .where('status', '=', 'APPROVED')
        .where('effective_from', '<=', now)
        .where((expression) =>
          expression.or([
            expression('effective_to', 'is', null),
            expression('effective_to', '>', now),
          ]),
        )
        .limit(1)
        .executeTakeFirst();
      if (!row) return undefined;
      return {
        id: row.id,
        environment: row.environment,
        procedureReference: row.procedure_reference,
        procedureRevision: row.procedure_revision,
        procedureSourceSha256: row.procedure_source_sha256,
        status: row.status as RecoveryProcedureAuthorizationRecord['status'],
        ...(row.effective_from ? { effectiveFrom: row.effective_from } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to } : {}),
      };
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}

function observedDurations(input: {
  detectedAt: Date;
  recoveredDataAsOf?: Date;
  recoveryStartedAt?: Date;
  recoveryValidatedAt?: Date;
}): { rpoSeconds: bigint | null; rtoSeconds: bigint | null } {
  const seconds = (later: Date, earlier: Date) =>
    Math.max(0, Math.ceil((later.getTime() - earlier.getTime()) / 1000));
  return {
    rpoSeconds:
      input.recoveredDataAsOf && input.recoveredDataAsOf <= input.detectedAt
        ? BigInt(seconds(input.detectedAt, input.recoveredDataAsOf))
        : null,
    rtoSeconds:
      input.recoveryValidatedAt && input.recoveryValidatedAt >= input.detectedAt
        ? BigInt(seconds(input.recoveryValidatedAt, input.detectedAt))
        : null,
  };
}

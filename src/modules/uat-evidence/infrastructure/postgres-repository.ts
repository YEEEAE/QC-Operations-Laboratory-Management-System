/**
 * QC-100-FINAL-004 Task 5 — PostgreSQL implementation of the UAT evidence
 * repository. All writes are transactional and append an audited
 * `qc.audit_events` row; duplicates fail closed through the table's unique
 * constraints translated by `translateDatabaseError`.
 */
import type { Kysely } from 'kysely';

import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import {
  AUTOMATED_PARTICIPANT_CODE,
  type UatCycleIdentityBinding,
  type UatCycleStatus,
  type UatDefectStatus,
} from '../domain/uat-evidence.js';
import type {
  IngestionActor,
  RecordDefectCommand,
  RecordSessionCommand,
  UatAcceptanceWrite,
  UatCycleEvidenceSummary,
  UatCycleRecord,
  UatDefectRecord,
  UatEvidenceRepository,
  UatSessionRecord,
} from '../ports/repository.js';

const mapCycle = (row: DatabaseRow<'uat_cycles'>): UatCycleRecord => ({
  id: row.id,
  cycleId: row.cycle_id,
  releaseId: row.release_id,
  gitSha: row.git_sha,
  buildId: row.build_id,
  applicationVersion: row.application_version,
  migrationHead: row.migration_head,
  environment: row.environment as UatCycleRecord['environment'],
  planReference: row.plan_reference,
  status: row.status as UatCycleStatus,
  evidenceSnapshotHash: row.evidence_snapshot_hash,
  ...(row.execution_started_at ? { executionStartedAt: row.execution_started_at } : {}),
  ...(row.execution_ended_at ? { executionEndedAt: row.execution_ended_at } : {}),
  createdAt: row.created_at,
});

const mapSession = (row: DatabaseRow<'uat_session_evidence'>): UatSessionRecord => ({
  id: row.id,
  cycleId: row.cycle_id,
  sessionId: row.session_id,
  taskId: row.task_id,
  participantRole: row.participant_role,
  participantCode: row.participant_code,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  timeOnTaskSeconds: row.time_on_task_seconds,
  taskSuccess: row.task_success,
  errorCount: row.error_count,
  backtrackingCount: row.backtracking_count,
  failedNavigationCount: row.failed_navigation_count,
  formCorrectionCount: row.form_correction_count,
  assistance: row.assistance as UatSessionRecord['assistance'],
  wrongActionAttempts: row.wrong_action_attempts,
  confidence1To5: row.confidence_1_to_5,
  seq1To7: row.seq_1_to_7,
  observations: row.observations,
  severity: row.severity as UatSessionRecord['severity'],
  participantComments: row.participant_comments,
  scenarioStatus: row.scenario_status as UatSessionRecord['scenarioStatus'],
  taskAcceptReject: row.task_accept_reject as UatSessionRecord['taskAcceptReject'],
  evidenceReference: row.evidence_reference,
  createdAt: row.created_at,
});

const mapDefect = (row: DatabaseRow<'uat_defects'>): UatDefectRecord => ({
  id: row.id,
  cycleId: row.cycle_id,
  defectId: row.defect_id,
  sessionId: row.session_id,
  taskId: row.task_id,
  severity: row.severity as UatDefectRecord['severity'],
  title: row.title,
  observedEvidence: row.observed_evidence,
  expectedBusinessOutcome: row.expected_business_outcome,
  actualBusinessOutcome: row.actual_business_outcome,
  requestIdOrRef: row.request_id_or_ref,
  status: row.status as UatDefectRecord['status'],
  createdAt: row.created_at,
});

export class PostgresUatEvidenceRepository implements UatEvidenceRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async findCycleByCycleId(cycleId: string): Promise<UatCycleRecord | undefined> {
    const row = await this.database
      .selectFrom('uat_cycles')
      .selectAll()
      .where('cycle_id', '=', cycleId)
      .executeTakeFirst();
    return row ? mapCycle(row) : undefined;
  }

  async createCycle(input: {
    identity: UatCycleIdentityBinding;
    evidenceSnapshotHash: string;
    status?: UatCycleStatus;
    requestId: string;
    actorId?: string;
  }): Promise<UatCycleRecord> {
    const id = uuidv7();
    try {
      const row = await this.database.transaction().execute(async (trx) => {
        const inserted = await trx
          .insertInto('uat_cycles')
          .values({
            id,
            cycle_id: input.identity.cycleId.trim(),
            release_id: input.identity.releaseId.trim(),
            git_sha: input.identity.gitSha.trim().toLowerCase(),
            build_id: input.identity.buildId.trim(),
            application_version: input.identity.applicationVersion.trim(),
            migration_head: input.identity.migrationHead.trim(),
            environment: input.identity.environment,
            plan_reference: input.identity.planReference.trim(),
            status: input.status ?? 'UNVERIFIED',
            evidence_snapshot_hash: input.evidenceSnapshotHash,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await new PostgresAuditRepository(trx).append({
          actorType: input.actorId ? 'USER' : 'SYSTEM',
          ...(input.actorId ? { actorId: input.actorId } : {}),
          subjectType: 'UAT_CYCLE',
          subjectId: inserted.id,
          action: 'UAT_CYCLE_CREATED',
          requestId: input.requestId,
          reason: `environment=${inserted.environment}; release=${inserted.release_id}`,
          payload: {
            cycleId: inserted.cycle_id,
            gitSha: inserted.git_sha,
            buildId: inserted.build_id,
            applicationVersion: inserted.application_version,
            migrationHead: inserted.migration_head,
            environment: inserted.environment,
            evidenceSnapshotHash: inserted.evidence_snapshot_hash,
          },
        });
        return inserted;
      });
      return mapCycle(row);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async recordSession(command: RecordSessionCommand): Promise<UatSessionRecord> {
    const cycle = await this.findCycleByCycleId(command.cycleId);
    if (!cycle) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (cycle.status === 'ACCEPTED' || cycle.status === 'REJECTED') {
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    }
    const id = uuidv7();
    const session = command.session;
    try {
      const row = await this.database.transaction().execute(async (trx) => {
        const inserted = await trx
          .insertInto('uat_session_evidence')
          .values({
            id,
            cycle_id: cycle.id,
            session_id: session.sessionId.trim(),
            participant_role: session.participantRole.trim(),
            participant_code: session.participantCode.trim(),
            task_id: session.taskId.trim(),
            started_at: session.startedAt,
            ended_at: session.endedAt,
            time_on_task_seconds: session.timeOnTaskSeconds,
            task_success: session.taskSuccess,
            error_count: session.errorCount,
            backtracking_count: session.backtrackingCount,
            failed_navigation_count: session.failedNavigationCount,
            form_correction_count: session.formCorrectionCount,
            assistance: session.assistance,
            wrong_action_attempts: session.wrongActionAttempts,
            confidence_1_to_5: session.confidence1To5,
            seq_1_to_7: session.seq1To7,
            observations: session.observations,
            severity: session.severity,
            participant_comments: session.participantComments,
            scenario_status: session.scenarioStatus,
            task_accept_reject: session.taskAcceptReject,
            evidence_reference: session.evidenceReference.trim(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await new PostgresAuditRepository(trx).append({
          actorType: command.actorId ? 'USER' : 'SYSTEM',
          ...(command.actorId ? { actorId: command.actorId } : {}),
          subjectType: 'UAT_SESSION_EVIDENCE',
          subjectId: inserted.id,
          action: 'UAT_SESSION_RECORDED',
          requestId: command.requestId,
          reason: `cycle=${cycle.cycleId}; task=${inserted.task_id}; scenario=${inserted.scenario_status}`,
          payload: {
            cycleId: cycle.cycleId,
            sessionId: inserted.session_id,
            taskId: inserted.task_id,
            participantCode: inserted.participant_code,
            scenarioStatus: inserted.scenario_status,
          },
        });
        return inserted;
      });
      return mapSession(row);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async recordDefect(command: RecordDefectCommand): Promise<UatDefectRecord> {
    const cycle = await this.findCycleByCycleId(command.cycleId);
    if (!cycle) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const id = uuidv7();
    const defect = command.defect;
    try {
      const row = await this.database.transaction().execute(async (trx) => {
        const inserted = await trx
          .insertInto('uat_defects')
          .values({
            id,
            cycle_id: cycle.id,
            defect_id: defect.defectId.trim(),
            session_id: defect.sessionId.trim(),
            task_id: defect.taskId.trim(),
            severity: defect.severity,
            title: defect.title.trim(),
            observed_evidence: defect.observedEvidence.trim(),
            expected_business_outcome: defect.expectedBusinessOutcome,
            actual_business_outcome: defect.actualBusinessOutcome,
            request_id_or_ref: defect.requestIdOrRef.trim(),
            status: defect.status,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await new PostgresAuditRepository(trx).append({
          actorType: command.actorId ? 'USER' : 'SYSTEM',
          ...(command.actorId ? { actorId: command.actorId } : {}),
          subjectType: 'UAT_DEFECT',
          subjectId: inserted.id,
          action: 'UAT_DEFECT_RECORDED',
          requestId: command.requestId,
          reason: `cycle=${cycle.cycleId}; defect=${inserted.defect_id}; severity=${inserted.severity}`,
          payload: {
            cycleId: cycle.cycleId,
            defectId: inserted.defect_id,
            sessionId: inserted.session_id,
            taskId: inserted.task_id,
            severity: inserted.severity,
            status: inserted.status,
          },
        });
        return inserted;
      });
      return mapDefect(row);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async getEvidenceSummary(cycleId: string): Promise<UatCycleEvidenceSummary> {
    const cycle = await this.findCycleByCycleId(cycleId);
    if (!cycle) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const [sessions, critical] = await Promise.all([
      this.listSessions(cycleId),
      this.listDefects(cycleId, ['OPEN', 'RETEST_REQUIRED']),
    ]);
    return {
      sessionCount: sessions.length,
      humanSessionCount: sessions.filter(
        (session) => session.participantCode !== AUTOMATED_PARTICIPANT_CODE,
      ).length,
      openCriticalDefectCount: critical.filter(
        (defect) => defect.severity === 'BLOCKER' || defect.severity === 'CRITICAL',
      ).length,
    };
  }

  async listSessions(cycleId: string): Promise<UatSessionRecord[]> {
    const cycle = await this.findCycleByCycleId(cycleId);
    if (!cycle) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const rows = await this.database
      .selectFrom('uat_session_evidence')
      .selectAll()
      .where('cycle_id', '=', cycle.id)
      .orderBy('created_at', 'asc')
      .execute();
    return rows.map(mapSession);
  }

  async listDefects(
    cycleId: string,
    statuses?: readonly UatDefectStatus[],
  ): Promise<UatDefectRecord[]> {
    const cycle = await this.findCycleByCycleId(cycleId);
    if (!cycle) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    let query = this.database
      .selectFrom('uat_defects')
      .selectAll()
      .where('cycle_id', '=', cycle.id);
    if (statuses && statuses.length > 0) query = query.where('status', 'in', [...statuses]);
    const rows = await query.orderBy('created_at', 'asc').execute();
    return rows.map(mapDefect);
  }
}

/**
 * Acceptance transaction shared by `AcceptUatCycleUseCase`: re-reads the cycle
 * fresh, verifies the signer and the recomputed snapshot hash, writes the
 * acceptance row plus the trusted `SIGNED_UAT_CYCLE` gate-evidence row, and
 * flips the cycle status — all atomically. Exported so the release-governance
 * gate writer and the acceptance use case share one code path.
 */
export async function executeUatAcceptance(
  database: Kysely<DatabaseSchema>,
  input: {
    cycleId: string;
    acceptance: UatAcceptanceWrite;
    gateEvidence: {
      releaseId: string;
      cycleReference: string;
      status: 'PASS' | 'FAIL' | 'PARTIAL' | 'UNVERIFIED';
      immutableReference: string;
      observedAt: Date;
      gitSha: string;
      buildId: string;
      applicationVersion: string;
      migrationHead: string;
      releaseVersion: bigint;
      evidenceVersion: bigint;
      recordedBy: string;
      auditInfo: unknown;
    };
    signer: IngestionActor;
  },
): Promise<{ acceptanceId: string; outcome: string }> {
  return database.transaction().execute(async (trx) => {
    const cycle = await trx
      .selectFrom('uat_cycles')
      .selectAll()
      .where('cycle_id', '=', input.cycleId)
      .forUpdate()
      .executeTakeFirst();
    if (!cycle) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (cycle.status === 'ACCEPTED' || cycle.status === 'REJECTED') {
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    }
    if (cycle.evidence_snapshot_hash !== input.acceptance.evidenceSnapshotHash) {
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    }
    if (input.signer.accountState !== 'ACTIVE') {
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    }

    const sessions = await trx
      .selectFrom('uat_session_evidence')
      .select(['id', 'participant_code', 'started_at'])
      .where('cycle_id', '=', cycle.id)
      .execute();
    if (sessions.length === 0) {
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    }
    const humanSessions = sessions.filter(
      (session) => session.participant_code !== AUTOMATED_PARTICIPANT_CODE,
    );
    if (humanSessions.length === 0) {
      // Automated-only cycles can never flip the release gate.
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    }
    const criticalDefects = await trx
      .selectFrom('uat_defects')
      .select(['id'])
      .where('cycle_id', '=', cycle.id)
      .where('status', 'in', ['OPEN', 'RETEST_REQUIRED'])
      .where('severity', 'in', ['BLOCKER', 'CRITICAL'])
      .execute();
    if (criticalDefects.length > 0) {
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    }

    // The signature must exist, belong to the signer, and bind this cycle.
    const signature = await trx
      .selectFrom('electronic_signatures')
      .select(['id', 'actor_id', 'subject_type', 'subject_id'])
      .where('id', '=', input.acceptance.signatureEvidenceId)
      .executeTakeFirst();
    if (
      !signature ||
      signature.actor_id !== input.signer.id ||
      signature.subject_type !== 'UAT_CYCLE' ||
      signature.subject_id !== cycle.id
    ) {
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    }

    const acceptanceRow = await trx
      .insertInto('uat_acceptances')
      .values({
        cycle_id: cycle.id,
        outcome: input.acceptance.outcome,
        authorized_signer_id: input.acceptance.authorizedSignerId,
        signature_evidence_id: input.acceptance.signatureEvidenceId,
        reauthenticated_at: input.acceptance.reauthenticatedAt,
        evidence_snapshot_hash: input.acceptance.evidenceSnapshotHash,
        request_id: input.acceptance.requestId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    if (input.acceptance.outcome === 'ACCEPTED') {
      await trx
        .insertInto('release_gate_evidence')
        .values({
          release_id: input.gateEvidence.releaseId,
          evidence_type: 'uat',
          status: input.gateEvidence.status,
          source: 'SIGNED_UAT_CYCLE',
          immutable_reference: input.gateEvidence.immutableReference,
          observed_at: input.gateEvidence.observedAt,
          git_sha: input.gateEvidence.gitSha,
          build_id: input.gateEvidence.buildId,
          application_version: input.gateEvidence.applicationVersion,
          migration_head: input.gateEvidence.migrationHead,
          uat_cycle_id: input.gateEvidence.cycleReference,
          release_version: input.gateEvidence.releaseVersion,
          evidence_version: input.gateEvidence.evidenceVersion,
          recorded_by: input.gateEvidence.recordedBy,
          audit_info: input.gateEvidence.auditInfo,
        })
        .execute();
    }

    // Closing the execution window requires a start: `qc.uat_cycles` rejects an
    // end without one (`execution_ended_at >= execution_started_at`). When the
    // cycle never recorded a start, its execution begins with the earliest
    // recorded session — real evidence, not an invented timestamp.
    const earliestSessionStart = sessions.reduce<Date | undefined>(
      (earliest, session) =>
        earliest === undefined || session.started_at < earliest ? session.started_at : earliest,
      undefined,
    );

    await trx
      .updateTable('uat_cycles')
      .set({
        status: input.acceptance.outcome,
        execution_started_at:
          cycle.execution_started_at ?? earliestSessionStart ?? input.acceptance.reauthenticatedAt,
        execution_ended_at: new Date(),
      })
      .where('id', '=', cycle.id)
      .execute();

    await new PostgresAuditRepository(trx).append({
      actorType: 'USER',
      actorId: input.signer.id,
      subjectType: 'UAT_CYCLE',
      subjectId: cycle.id,
      action: 'UAT_CYCLE_ACCEPTANCE_RECORDED',
      requestId: input.acceptance.requestId,
      transitionId: 'TR-UAT-ACCEPT',
      oldState: cycle.status,
      newState: input.acceptance.outcome,
      reason: `outcome=${input.acceptance.outcome}; sessions=${sessions.length}; human=${humanSessions.length}`,
      signatureId: input.acceptance.signatureEvidenceId,
      payload: {
        cycleId: cycle.cycle_id,
        releaseId: cycle.release_id,
        gateEvidenceWritten: input.acceptance.outcome === 'ACCEPTED',
      },
    });
    return { acceptanceId: acceptanceRow.id, outcome: acceptanceRow.outcome };
  });
}

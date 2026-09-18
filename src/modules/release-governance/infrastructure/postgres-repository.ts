import { createHash } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import type {
  ReleaseApprovalRecord,
  ReleaseApprovalReplayInput,
  ReleaseCandidateRecord,
  ReleaseGovernanceRepository,
} from '../ports/repository.js';
import {
  assertAllGatesPass,
  assertResidualRisksAcceptable,
  deriveReleaseEvidence,
} from '../domain/release-approval.js';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// The idempotency key and command fingerprint are the single source of truth
// for approval replay. They are shared by the pre-flight replay resolution and
// the transactional write path so both agree on what "same command" means.
function approvalIdempotencyKey(releaseId: string, requestId: string): string {
  return `RELEASE:APPROVE:${releaseId}:${requestId}`;
}

function approvalFingerprint(input: {
  releaseId: string;
  expectedVersion: bigint;
  actorId: string;
  gitSha: string;
  buildId: string;
  applicationVersion: string;
  migrationHead: string;
}): string {
  return createHash('sha256')
    .update(
      stableJson({
        releaseId: input.releaseId,
        expectedVersion: String(input.expectedVersion),
        actorId: input.actorId,
        gitSha: input.gitSha,
        buildId: input.buildId,
        applicationVersion: input.applicationVersion,
        migrationHead: input.migrationHead,
      }),
    )
    .digest('hex');
}

interface IdempotencyRecordRow {
  request_fingerprint: string;
  status: string;
  response_payload: unknown;
}

function replayResult(
  record: IdempotencyRecordRow | undefined,
  fingerprint: string,
): ReleaseApprovalRecord | undefined {
  if (!record) return undefined;
  if (record.request_fingerprint !== fingerprint) {
    throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
  }
  if (record.status === 'COMPLETED' && record.response_payload) {
    return record.response_payload as ReleaseApprovalRecord;
  }
  throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
}

function approvalReplayIdentity(input: {
  releaseId: string;
  requestId: string;
  expectedVersion: bigint;
  actorId: string;
  gitSha: string;
  buildId: string;
  applicationVersion: string;
  migrationHead: string;
}): { key: string; fingerprint: string } {
  return {
    key: approvalIdempotencyKey(input.releaseId, input.requestId),
    fingerprint: approvalFingerprint(input),
  };
}

export class PostgresReleaseGovernanceRepository implements ReleaseGovernanceRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async getCandidate(releaseId: string): Promise<ReleaseCandidateRecord | undefined> {
    if (!isUuid(releaseId)) return undefined;
    const row = await this.db
      .selectFrom('release_candidates')
      .selectAll()
      .where('id', '=', releaseId)
      .executeTakeFirst();
    if (!row) return undefined;
    return {
      releaseId: row.id,
      gitSha: row.git_sha,
      buildId: row.build_id,
      applicationVersion: row.application_version,
      migrationHead: row.migration_head,
      uatCycleId: row.uat_cycle_id,
      uatStatus: row.uat_status,
      residualRiskStatus: row.residual_risk_status,
      state: row.state as ReleaseCandidateRecord['state'],
      version: BigInt(row.version),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getEvidence(releaseId: string) {
    const [gates, risks] = await Promise.all([
      this.db
        .selectFrom('release_gate_evidence')
        .selectAll()
        .where('release_id', '=', releaseId)
        .execute(),
      this.db
        .selectFrom('release_risk_evidence')
        .selectAll()
        .where('release_id', '=', releaseId)
        .execute(),
    ]);
    return {
      gateRecords: gates.map((row) => ({
        evidenceType: row.evidence_type as never,
        status: row.status as never,
        source: row.source,
        immutableReference: row.immutable_reference,
        observedAt: row.observed_at,
        releaseVersion: BigInt(row.release_version),
        evidenceVersion: BigInt(row.evidence_version),
        recordedBy: row.recorded_by,
        auditInfo: row.audit_info,
        releaseId: row.release_id,
        gitSha: row.git_sha,
        buildId: row.build_id,
        applicationVersion: row.application_version,
        migrationHead: row.migration_head,
        uatCycleId: row.uat_cycle_id,
      })),
      riskRecords: risks.map((row) => ({
        riskId: row.risk_id,
        severity: row.severity as never,
        status: row.status as never,
        source: row.source,
        immutableReference: row.immutable_reference,
        observedAt: row.observed_at,
        releaseVersion: BigInt(row.release_version),
        evidenceVersion: BigInt(row.evidence_version),
        recordedBy: row.recorded_by,
        ...(row.acceptance ? { acceptance: row.acceptance as never } : {}),
        auditInfo: row.audit_info,
        releaseId: row.release_id,
        gitSha: row.git_sha,
        buildId: row.build_id,
        applicationVersion: row.application_version,
        migrationHead: row.migration_head,
        uatCycleId: row.uat_cycle_id,
      })),
    };
  }

  async resolveReplay(
    input: ReleaseApprovalReplayInput,
  ): Promise<ReleaseApprovalRecord | undefined> {
    const { key, fingerprint } = approvalReplayIdentity({
      releaseId: input.candidate.releaseId,
      requestId: input.requestId,
      expectedVersion: input.expectedVersion,
      actorId: input.actor.id,
      gitSha: input.candidate.gitSha,
      buildId: input.candidate.buildId,
      applicationVersion: input.candidate.applicationVersion,
      migrationHead: input.candidate.migrationHead,
    });
    const record = await this.db
      .selectFrom('idempotency_records')
      .select(['request_fingerprint', 'status', 'response_payload'])
      .where('key', '=', key)
      .executeTakeFirst();
    return replayResult(record, fingerprint);
  }

  async approve(
    input: Parameters<ReleaseGovernanceRepository['approve']>[0],
  ): Promise<ReleaseApprovalRecord> {
    const { key, fingerprint } = approvalReplayIdentity({
      releaseId: input.candidate.releaseId,
      requestId: input.requestId,
      expectedVersion: input.expectedVersion,
      actorId: input.actor.id,
      gitSha: input.candidate.gitSha,
      buildId: input.candidate.buildId,
      applicationVersion: input.candidate.applicationVersion,
      migrationHead: input.candidate.migrationHead,
    });
    return this.db.transaction().execute(async (trx) => {
      const replay = await trx
        .selectFrom('idempotency_records')
        .select(['request_fingerprint', 'status', 'response_payload'])
        .where('key', '=', key)
        .executeTakeFirst();
      const replayed = replayResult(replay, fingerprint);
      if (replayed) return replayed;
      await trx
        .insertInto('idempotency_records')
        .values({
          key,
          request_fingerprint: fingerprint,
          status: 'IN_PROGRESS',
          response_payload: null,
        })
        .execute();

      const row = await trx
        .selectFrom('release_candidates')
        .selectAll()
        .where('id', '=', input.candidate.releaseId)
        .forUpdate()
        .executeTakeFirst();
      if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (BigInt(row.version) !== input.expectedVersion) {
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      }
      if (row.state !== 'PENDING')
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      const rows = await Promise.all([
        trx
          .selectFrom('release_gate_evidence')
          .selectAll()
          .where('release_id', '=', row.id)
          .execute(),
        trx
          .selectFrom('release_risk_evidence')
          .selectAll()
          .where('release_id', '=', row.id)
          .execute(),
      ]);
      const freshEvidence = deriveReleaseEvidence(
        {
          releaseId: row.id,
          gitSha: row.git_sha,
          buildId: row.build_id,
          applicationVersion: row.application_version,
          migrationHead: row.migration_head,
          uatCycleId: row.uat_cycle_id,
          uatStatus: row.uat_status,
          residualRiskStatus: row.residual_risk_status,
          state: row.state as 'PENDING' | 'RELEASE_APPROVED',
          version: BigInt(row.version),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        rows[0].map((e) => ({
          ...e,
          evidenceType: e.evidence_type as never,
          status: e.status as never,
          immutableReference: e.immutable_reference,
          observedAt: e.observed_at,
          releaseVersion: BigInt(e.release_version),
          evidenceVersion: BigInt(e.evidence_version),
          recordedBy: e.recorded_by,
          auditInfo: e.audit_info,
          releaseId: e.release_id,
          gitSha: e.git_sha,
          buildId: e.build_id,
          applicationVersion: e.application_version,
          migrationHead: e.migration_head,
          uatCycleId: e.uat_cycle_id,
        })),
        rows[1].map((e) => ({
          ...e,
          riskId: e.risk_id,
          severity: e.severity as never,
          status: e.status as never,
          immutableReference: e.immutable_reference,
          observedAt: e.observed_at,
          releaseVersion: BigInt(e.release_version),
          evidenceVersion: BigInt(e.evidence_version),
          recordedBy: e.recorded_by,
          auditInfo: e.audit_info,
          releaseId: e.release_id,
          gitSha: e.git_sha,
          buildId: e.build_id,
          applicationVersion: e.application_version,
          migrationHead: e.migration_head,
          uatCycleId: e.uat_cycle_id,
          ...(e.acceptance
            ? {
                acceptance: e.acceptance as unknown as {
                  acceptedBy: string;
                  authority: 'MANAGER' | 'SYSTEM_OWNER';
                  evidenceRef: string;
                  acceptedAt: string;
                },
              }
            : {}),
        })) as never,
        new Date(),
      );
      assertAllGatesPass(freshEvidence.gates);
      assertResidualRisksAcceptable(freshEvidence.risks);
      if (
        stableJson(freshEvidence.gates) !== stableJson(input.evidence.gates) ||
        stableJson(freshEvidence.risks) !== stableJson(input.evidence.risks)
      ) {
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      }
      // Recompute the signed snapshot inside the transaction from database evidence.
      const recomputed = createHash('sha256')
        .update(
          stableJson({
            releaseId: row.id,
            gitSha: row.git_sha.toLowerCase(),
            buildId: row.build_id,
            applicationVersion: row.application_version,
            migrationHead: row.migration_head,
            uatCycleId: row.uat_cycle_id,
            gates: input.gateSnapshot,
            risks: input.riskSnapshot,
            uatStatus: row.uat_status,
            residualRiskStatus: row.residual_risk_status,
          }),
        )
        .digest('hex');
      if (recomputed !== input.signature.snapshotHash) {
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      }
      if (
        input.signature.subjectId !== row.id ||
        input.signature.subjectVersion !== BigInt(row.version) ||
        input.signature.actorId !== input.actor.id
      ) {
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      }

      await trx
        .insertInto('electronic_signatures')
        .values({
          id: input.signature.id,
          actor_id: input.signature.actorId,
          subject_type: 'RELEASE_CANDIDATE',
          subject_id: row.id,
          subject_version: BigInt(row.version),
          action: input.signature.action,
          meaning: input.signature.meaning,
          signed_at: input.signature.signedAt,
          snapshot_hash: input.signature.snapshotHash,
          reason: input.signature.reason ?? null,
          reauth_method: input.signature.reauthMethod,
          request_id: input.requestId,
        })
        .execute();

      const approvalId = crypto.randomUUID();
      const approvedAt = new Date();
      const authority = input.actor.roles.includes('MANAGER')
        ? 'MANAGER'
        : ('SYSTEM_OWNER' as const);
      const inserted = await trx
        .insertInto('release_approvals')
        .values({
          id: approvalId,
          release_id: row.id,
          approved_by: input.actor.id,
          authority,
          git_sha: row.git_sha.toLowerCase(),
          build_id: row.build_id,
          application_version: row.application_version,
          migration_head: row.migration_head,
          uat_status: row.uat_status,
          residual_risk_status: row.residual_risk_status,
          gate_snapshot: input.gateSnapshot,
          risk_snapshot: input.riskSnapshot,
          signature_evidence_id: input.signature.id,
          approved_at: approvedAt,
          request_id: input.requestId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const updated = await trx
        .updateTable('release_candidates')
        .set({
          state: 'RELEASE_APPROVED',
          updated_at: new Date(),
          version: BigInt(row.version) + 1n,
        })
        .where('id', '=', row.id)
        .where('version', '=', input.expectedVersion)
        .returningAll()
        .executeTakeFirst();
      if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

      await trx
        .insertInto('audit_events')
        .values({
          actor_type: 'USER',
          actor_id: input.actor.id,
          subject_type: 'RELEASE_CANDIDATE',
          subject_id: row.id,
          action: 'RELEASE_APPROVE',
          transition_id: 'TR-REL-001',
          old_state: 'PENDING',
          new_state: 'RELEASE_APPROVED',
          reason: `UAT ${row.uat_status}; residual risk ${row.residual_risk_status}`,
          request_id: input.requestId,
          signature_id: input.signature.id,
          payload: {
            gitSha: row.git_sha.toLowerCase(),
            buildId: row.build_id,
            applicationVersion: row.application_version,
            migrationHead: row.migration_head,
            authority,
            approvedBy: input.actor.id,
            snapshotHash: input.signature.snapshotHash,
          },
        })
        .execute();

      const record: ReleaseApprovalRecord = {
        id: inserted.id,
        releaseId: inserted.release_id,
        approvedBy: inserted.approved_by,
        authority: inserted.authority as ReleaseApprovalRecord['authority'],
        gitSha: inserted.git_sha,
        buildId: inserted.build_id,
        applicationVersion: inserted.application_version,
        migrationHead: inserted.migration_head,
        uatStatus: inserted.uat_status,
        residualRiskStatus: inserted.residual_risk_status,
        signatureEvidenceId: inserted.signature_evidence_id,
        approvedAt: inserted.approved_at,
        requestId: inserted.request_id,
      };
      await trx
        .updateTable('idempotency_records')
        .set({ status: 'COMPLETED', response_payload: record, completed_at: new Date() })
        .where('key', '=', key)
        .execute();
      return record;
    });
  }
}

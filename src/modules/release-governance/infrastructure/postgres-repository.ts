import { createHash } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import type {
  ReleaseApprovalRecord,
  ReleaseCandidateRecord,
  ReleaseGovernanceRepository,
} from '../ports/repository.js';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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

  async approve(input: Parameters<ReleaseGovernanceRepository['approve']>[0]): Promise<ReleaseApprovalRecord> {
    const key = `RELEASE:APPROVE:${input.candidate.releaseId}:${input.requestId}`;
    const fingerprint = createHash('sha256')
      .update(
        stableJson({
          releaseId: input.candidate.releaseId,
          expectedVersion: String(input.expectedVersion),
          actorId: input.actor.id,
          gitSha: input.gitSha,
          buildId: input.buildId,
          applicationVersion: input.applicationVersion,
          migrationHead: input.migrationHead,
        }),
      )
      .digest('hex');
    return this.db.transaction().execute(async (trx) => {
      const replay = await trx
        .selectFrom('idempotency_records')
        .selectAll()
        .where('key', '=', key)
        .executeTakeFirst();
      if (replay) {
        if (replay.request_fingerprint !== fingerprint) {
          throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
        }
        if (replay.status === 'COMPLETED' && replay.response_payload) {
          return replay.response_payload as ReleaseApprovalRecord;
        }
        throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
      }
      await trx
        .insertInto('idempotency_records')
        .values({ key, request_fingerprint: fingerprint, status: 'IN_PROGRESS', response_payload: null })
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
      if (row.state !== 'PENDING') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (
        row.git_sha.toLowerCase() !== input.gitSha.toLowerCase() ||
        row.build_id !== input.buildId ||
        row.application_version !== input.applicationVersion ||
        row.migration_head !== input.migrationHead
      ) {
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      }
      // Recompute the signed snapshot inside the transaction: stale or tampered gate/risk evidence fails closed.
      const recomputed = createHash('sha256')
        .update(
          stableJson({
            releaseId: row.id,
            gitSha: input.gitSha.toLowerCase(),
            buildId: input.buildId,
            applicationVersion: input.applicationVersion,
            migrationHead: input.migrationHead,
            uatCycleId: row.uat_cycle_id,
            gates: input.gateSnapshot,
            risks: input.riskSnapshot,
            uatStatus: input.uatStatus,
            residualRiskStatus: input.residualRiskStatus,
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
      const authority =
        input.actor.roles.includes('MANAGER')
          ? 'MANAGER'
          : ('SYSTEM_OWNER' as const);
      const inserted = await trx
        .insertInto('release_approvals')
        .values({
          id: approvalId,
          release_id: row.id,
          approved_by: input.actor.id,
          authority,
          git_sha: input.gitSha.toLowerCase(),
          build_id: input.buildId,
          application_version: input.applicationVersion,
          migration_head: input.migrationHead,
          uat_status: input.uatStatus,
          residual_risk_status: input.residualRiskStatus,
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
        .set({ state: 'RELEASE_APPROVED', updated_at: new Date(), version: BigInt(row.version) + 1n })
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
          reason: `UAT ${input.uatStatus}; residual risk ${input.residualRiskStatus}`,
          request_id: input.requestId,
          signature_id: input.signature.id,
          payload: {
            gitSha: input.gitSha.toLowerCase(),
            buildId: input.buildId,
            applicationVersion: input.applicationVersion,
            migrationHead: input.migrationHead,
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

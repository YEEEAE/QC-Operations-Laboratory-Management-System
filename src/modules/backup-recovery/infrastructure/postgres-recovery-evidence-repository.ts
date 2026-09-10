import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { RecoveryEvidenceInput, RecoveryEvidenceRepository } from '../ports/recovery-evidence.js';

export class PostgresRecoveryEvidenceRepository implements RecoveryEvidenceRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async append(input: RecoveryEvidenceInput): Promise<{ id: string }> {
    try {
      const id = uuidv7();
      await this.database
        .insertInto('recovery_evidence')
        .values({
          id,
          backup_run_id: input.backupRunId,
          restore_run_id: input.restoreRunId ?? null,
          evidence_version: 1n,
          result: input.result,
          source_environment: input.sourceEnvironment,
          target_environment: input.targetEnvironment,
          requested_by: null,
          authorized_by: null,
          reason: input.reason,
          request_id: input.requestId,
          git_sha: input.gitSha,
          build_id: input.buildId,
          release_id: input.releaseId,
          migration_head: input.migrationHead,
          postgres_version: input.postgresVersion,
          started_at: input.startedAt,
          completed_at: input.completedAt ?? null,
          measured_rpo_seconds: input.measuredRpoSeconds ?? null,
          measured_rto_seconds: input.measuredRtoSeconds ?? null,
          database_validation: input.databaseValidation,
          object_validation: input.objectValidation,
          security_validation: input.securityValidation,
          business_validation: input.businessValidation,
          session_invalidation: input.sessionInvalidation ?? null,
          known_gaps: JSON.stringify(input.knownGaps),
          created_at: new Date(),
        })
        .execute();
      return { id };
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async listForBackup(backupRunId: string): Promise<readonly RecoveryEvidenceInput[]> {
    try {
      const rows = await this.database
        .selectFrom('recovery_evidence')
        .selectAll()
        .where('backup_run_id', '=', backupRunId)
        .orderBy('created_at', 'asc')
        .execute();
      return rows.map((row) => ({
        backupRunId: row.backup_run_id,
        ...(row.restore_run_id ? { restoreRunId: row.restore_run_id } : {}),
        result: row.result as RecoveryEvidenceInput['result'],
        sourceEnvironment: row.source_environment,
        targetEnvironment: row.target_environment,
        reason: row.reason,
        requestId: row.request_id,
        releaseId: row.release_id ?? '',
        gitSha: row.git_sha ?? '',
        buildId: row.build_id ?? '',
        migrationHead: row.migration_head ?? '',
        postgresVersion: row.postgres_version ?? '',
        startedAt: row.started_at,
        ...(row.completed_at ? { completedAt: row.completed_at } : {}),
        ...(row.measured_rpo_seconds !== null ? { measuredRpoSeconds: Number(row.measured_rpo_seconds) } : {}),
        ...(row.measured_rto_seconds !== null ? { measuredRtoSeconds: Number(row.measured_rto_seconds) } : {}),
        databaseValidation: row.database_validation as 'PASS' | 'FAIL',
        objectValidation: row.object_validation as 'PASS' | 'FAIL',
        securityValidation: row.security_validation as 'PASS' | 'FAIL',
        businessValidation: row.business_validation as 'PASS' | 'FAIL',
        ...(row.session_invalidation ? { sessionInvalidation: row.session_invalidation as RecoveryEvidenceInput['sessionInvalidation'] } : {}),
        knownGaps: Array.isArray(row.known_gaps) ? row.known_gaps.filter((value): value is string => typeof value === 'string') : [],
      }));
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}

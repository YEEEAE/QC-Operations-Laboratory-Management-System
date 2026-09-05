import type { Kysely } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { isUuid } from '../../../shared/id/uuid.js';
import type {
  BackupRun,
  BackupRunState,
  RestoreRun,
  RestoreRunState,
} from '../domain/backup-record.js';
import type { BackupCatalogFilter, BackupCatalogRepository } from '../ports/repository.js';

const mapBackup = (row: DatabaseRow<'backup_runs'>): BackupRun => ({
  id: row.id,
  state: row.state as BackupRunState,
  ...(row.requested_by ? { requestedBy: row.requested_by } : {}),
  requestedAt: row.requested_at,
  ...(row.started_at ? { startedAt: row.started_at } : {}),
  ...(row.artifact_created_at ? { artifactCreatedAt: row.artifact_created_at } : {}),
  ...(row.verified_at ? { verifiedAt: row.verified_at } : {}),
  ...(row.completed_at ? { completedAt: row.completed_at } : {}),
  ...(row.size_bytes !== null ? { sizeBytes: BigInt(row.size_bytes) } : {}),
  ...(row.database_schema_version ? { databaseSchemaVersion: row.database_schema_version } : {}),
  ...(row.error_code ? { errorCode: row.error_code } : {}),
  requestId: row.request_id,
});

const mapRestore = (row: DatabaseRow<'restore_runs'>): RestoreRun => ({
  id: row.id,
  backupRunId: row.backup_run_id,
  restoreType: row.restore_type as RestoreRun['restoreType'],
  state: row.state as RestoreRunState,
  ...(row.requested_by ? { requestedBy: row.requested_by } : {}),
  ...(row.authorized_by ? { authorizedBy: row.authorized_by } : {}),
  requestedAt: row.requested_at,
  ...(row.started_at ? { startedAt: row.started_at } : {}),
  ...(row.verified_at ? { verifiedAt: row.verified_at } : {}),
  ...(row.completed_at ? { completedAt: row.completed_at } : {}),
  targetEnvironment: row.target_environment,
  ...(row.error_code ? { errorCode: row.error_code } : {}),
  requestId: row.request_id,
});

/**
 * PostgreSQL adapter over the canonical `qc.backup_runs` / `qc.restore_runs`
 * tables. Storage references and checksums are read by the database but are
 * deliberately never mapped out of this layer. The restore request insert is
 * transactional with audit and outbox evidence.
 */
export class PostgresBackupCatalogRepository implements BackupCatalogRepository {
  constructor(
    private readonly database: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}

  async listBackups(filter: BackupCatalogFilter = {}): Promise<readonly BackupRun[]> {
    try {
      let query = this.database
        .selectFrom('backup_runs')
        .selectAll()
        .orderBy('requested_at', 'desc');
      if (filter.states?.length)
        query = query.where('state', 'in', [...filter.states]) as typeof query;
      query = query.limit(Math.min(Math.max(filter.limit ?? 50, 1), 100)) as typeof query;
      const rows = await query.execute();
      return rows.map(mapBackup);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async getBackup(backupId: string): Promise<BackupRun | undefined> {
    if (!isUuid(backupId)) return undefined;
    try {
      const row = await this.database
        .selectFrom('backup_runs')
        .selectAll()
        .where('id', '=', backupId)
        .executeTakeFirst();
      return row ? mapBackup(row) : undefined;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async listRestoreRuns(backupId: string): Promise<readonly RestoreRun[]> {
    if (!isUuid(backupId)) return [];
    try {
      const rows = await this.database
        .selectFrom('restore_runs')
        .selectAll()
        .where('backup_run_id', '=', backupId)
        .orderBy('requested_at', 'asc')
        .execute();
      return rows.map(mapRestore);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async recordRestoreRequest(input: {
    restore: RestoreRun;
    actor: ActorContext;
    requestId: string;
  }): Promise<RestoreRun> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const restore = input.restore;
        const row = await tx
          .insertInto('restore_runs')
          .values({
            id: restore.id,
            backup_run_id: restore.backupRunId,
            restore_type: restore.restoreType,
            state: restore.state,
            requested_by: restore.requestedBy ?? null,
            authorized_by: null,
            requested_at: restore.requestedAt,
            started_at: null,
            verified_at: null,
            completed_at: null,
            target_environment: restore.targetEnvironment,
            error_code: null,
            evidence: JSON.stringify({
              recordedVia: 'RESTORE_REQUEST_USE_CASE',
              orchestrationStatus: 'NOT_AVAILABLE',
              restoreExecuted: false,
            }),
            request_id: restore.requestId,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.audit?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'BACKUP_RESTORE_REQUEST',
          subjectId: restore.backupRunId,
          action: 'REQUEST_RESTORE',
          newState: restore.state,
          reason: 'Restore intent recorded; execution requires an approved recovery orchestrator.',
          requestId: input.requestId,
          payload: {
            restoreType: restore.restoreType,
            targetEnvironment: restore.targetEnvironment,
          },
        });
        await this.outbox?.enqueue({
          eventType: 'BACKUP_RESTORE_REQUESTED',
          aggregateType: 'BACKUP_RUN',
          aggregateId: restore.backupRunId,
          payload: {
            restoreRunId: restore.id,
            restoreType: restore.restoreType,
            targetEnvironment: restore.targetEnvironment,
            state: restore.state,
          },
          dedupeKey: `backup-restore-requested:${restore.id}`,
        });
        return mapRestore(row);
      });
    } catch (error) {
      throw error instanceof AppError ? error : translateDatabaseError(error);
    }
  }
}

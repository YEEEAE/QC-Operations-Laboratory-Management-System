import { createHash } from 'node:crypto';
import type { Kysely, Transaction } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { isUuid } from '../../../shared/id/uuid.js';
import { backupEligibilityVersion } from '../domain/backup-eligibility.js';
import { isRestorableBackup } from '../domain/backup-record.js';
import type {
  BackupRun,
  BackupRunState,
  RestoreRun,
  RestoreRunState,
} from '../domain/backup-record.js';
import type {
  BackupCatalogFilter,
  BackupCatalogPage,
  BackupCatalogPageFilter,
  BackupCatalogRepository,
} from '../ports/repository.js';

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
  hasChecksum: typeof row.checksum === 'string' && /^[0-9a-f]{64}$/i.test(row.checksum),
  checksumVersionDigest:
    typeof row.checksum === 'string'
      ? createHash('sha256').update(row.checksum, 'utf8').digest('hex')
      : undefined,
  ...(row.database_schema_version ? { databaseSchemaVersion: row.database_schema_version } : {}),
  ...(row.artifact_type === 'LOGICAL_EXPORT' ? { artifactType: 'LOGICAL_EXPORT' as const } : {}),
  ...(row.object_version ? { objectVersion: row.object_version } : {}),
  ...(row.git_sha ? { gitSha: row.git_sha } : {}),
  ...(row.build_id ? { buildId: row.build_id } : {}),
  ...(row.release_id ? { releaseId: row.release_id } : {}),
  ...(row.migration_head ? { migrationHead: row.migration_head } : {}),
  ...(row.postgres_version ? { postgresVersion: row.postgres_version } : {}),
  ...(row.retention_expires_at ? { retentionExpiresAt: row.retention_expires_at } : {}),
  ...(row.manifest_sha256 ? { manifestSha256: row.manifest_sha256 } : {}),
  ...(Array.isArray(row.known_gaps)
    ? { knownGaps: row.known_gaps.filter((value): value is string => typeof value === 'string') }
    : {}),
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
    private readonly auditForTransaction?: (
      transaction: Transaction<DatabaseSchema>,
    ) => AuditRepository,
    private readonly outboxForTransaction?: (
      transaction: Transaction<DatabaseSchema>,
    ) => OutboxRepository,
  ) {}

  async listBackups(filter: BackupCatalogFilter = {}): Promise<readonly BackupRun[]> {
    try {
      let query = this.database
        .selectFrom('backup_runs')
        .selectAll()
        .orderBy('requested_at', 'desc')
        .orderBy('id', 'desc');
      if (filter.states?.length)
        query = query.where('state', 'in', [...filter.states]) as typeof query;
      query = query.limit(Math.min(Math.max(filter.limit ?? 50, 1), 100)) as typeof query;
      const rows = await query.execute();
      return rows.map(mapBackup);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async listBackupPage(filter: BackupCatalogPageFilter): Promise<BackupCatalogPage> {
    try {
      const page = Math.max(1, Math.trunc(filter.page));
      const pageSize = Math.min(100, Math.max(1, Math.trunc(filter.pageSize)));
      let countQuery = this.database
        .selectFrom('backup_runs')
        .select((eb) => eb.fn.countAll().as('total'));
      let rowsQuery = this.database.selectFrom('backup_runs').selectAll();
      if (filter.states?.length) {
        countQuery = countQuery.where('state', 'in', [...filter.states]) as typeof countQuery;
        rowsQuery = rowsQuery.where('state', 'in', [...filter.states]) as typeof rowsQuery;
      }
      const count = await countQuery.executeTakeFirstOrThrow();
      const total = Number(count.total);
      const effectivePage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
      const rows = await rowsQuery
        .orderBy('requested_at', 'desc')
        .orderBy('id', 'desc')
        .limit(pageSize)
        .offset((effectivePage - 1) * pageSize)
        .execute();
      return { items: rows.map(mapBackup), total, page: effectivePage, pageSize };
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
    idempotencyKey: string;
    reason: string;
    expectedVersion: string;
    requestFingerprint: string;
  }): Promise<RestoreRun> {
    const auditForTransaction = this.auditForTransaction;
    const outboxForTransaction = this.outboxForTransaction;
    if (!auditForTransaction || !outboxForTransaction)
      throw new AppError('SYSTEM_INTERNAL', { userSafe: false });
    try {
      return await this.database.transaction().execute(async (tx) => {
        const restore = input.restore;
        const backup = await tx
          .selectFrom('backup_runs')
          .selectAll()
          .where('id', '=', restore.backupRunId)
          .forUpdate()
          .executeTakeFirst();
        if (!backup) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        const currentBackup = mapBackup(backup);
        if (!isRestorableBackup(currentBackup))
          throw new AppError('DOMAIN_INVALID_TRANSITION', {
            userSafe: true,
            safeMetadata: { reason: 'BACKUP_NOT_RESTORABLE' },
          });
        if (backupEligibilityVersion(currentBackup) !== input.expectedVersion)
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

        const inserted = await tx
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
              operatorReason: input.reason,
              expectedBackupVersion: input.expectedVersion,
              requestFingerprint: input.requestFingerprint,
            }),
            request_id: input.idempotencyKey,
          })
          .onConflict((conflict) => conflict.columns(['backup_run_id', 'request_id']).doNothing())
          .returningAll()
          .executeTakeFirst();

        if (!inserted) {
          const existing = await tx
            .selectFrom('restore_runs')
            .selectAll()
            .where('backup_run_id', '=', restore.backupRunId)
            .where('request_id', '=', input.idempotencyKey)
            .forUpdate()
            .executeTakeFirst();
          if (!existing) throw new AppError('SYSTEM_INTERNAL', { userSafe: false });
          let evidence: unknown = existing.evidence;
          if (typeof evidence === 'string') {
            try {
              evidence = JSON.parse(evidence);
            } catch {
              evidence = undefined;
            }
          }
          const storedFingerprint =
            evidence && typeof evidence === 'object' && !Array.isArray(evidence)
              ? (evidence as Record<string, unknown>).requestFingerprint
              : undefined;
          if (storedFingerprint !== input.requestFingerprint)
            throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
          return mapRestore(existing);
        }

        await auditForTransaction(tx).append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'BACKUP_RESTORE_REQUEST',
          subjectId: restore.backupRunId,
          action: 'REQUEST_RESTORE',
          newState: restore.state,
          reason: input.reason,
          requestId: input.requestId,
          payload: {
            restoreRunId: restore.id,
            idempotencyKey: input.idempotencyKey,
            expectedBackupVersion: input.expectedVersion,
            restoreType: restore.restoreType,
            targetEnvironment: restore.targetEnvironment,
          },
        });
        await outboxForTransaction(tx).enqueue({
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
        return mapRestore(inserted);
      });
    } catch (error) {
      throw error instanceof AppError ? error : translateDatabaseError(error);
    }
  }
}

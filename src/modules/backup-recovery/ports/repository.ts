import type { ActorContext } from '../../../shared/authorization/types.js';
import type { BackupRun, RestoreRun, BackupRunState } from '../domain/backup-record.js';

export interface BackupCatalogFilter {
  states?: readonly BackupRunState[];
  limit?: number;
}

/**
 * Read/write boundary for the application-level backup catalog backed by the
 * canonical `qc.backup_runs` / `qc.restore_runs` tables. Raw storage
 * references and checksum values stay inside the implementing infrastructure
 * layer and are never part of the returned domain records.
 */
export interface BackupCatalogRepository {
  listBackups(filter?: BackupCatalogFilter): Promise<readonly BackupRun[]>;
  getBackup(backupId: string): Promise<BackupRun | undefined>;
  listRestoreRuns(backupId: string): Promise<readonly RestoreRun[]>;
  recordRestoreRequest(input: {
    restore: RestoreRun;
    actor: ActorContext;
    requestId: string;
  }): Promise<RestoreRun>;
}

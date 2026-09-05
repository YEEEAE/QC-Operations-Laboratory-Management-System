import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { PostgresBackupCatalogRepository } from '../infrastructure/postgres-repository.js';
import { ListBackupsUseCase } from './list-backups.js';
import { GetBackupUseCase } from './get-backup.js';
import { RequestRestoreUseCase } from './request-restore.js';

export function backupCatalogReadDependencies() {
  const repository = new PostgresBackupCatalogRepository(getDatabase());
  return { list: new ListBackupsUseCase(repository), get: new GetBackupUseCase(repository) };
}

export function backupRestoreActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresBackupCatalogRepository(
    database,
    new PostgresAuditRepository(database),
    new PostgresOutboxRepository(database),
  );
  return { requestRestore: new RequestRestoreUseCase(repository) };
}

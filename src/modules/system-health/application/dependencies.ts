import { getDatabase } from '../../../shared/database/database.js';
import { PostgresBackupCatalogRepository } from '../../backup-recovery/infrastructure/postgres-repository.js';
import { PostgresSystemHealthProbes } from '../infrastructure/postgres-health-probes.js';
import { GetSystemHealthUseCase } from './get-system-health.js';

export function systemHealthReadDependencies() {
  const database = getDatabase();
  return {
    health: new GetSystemHealthUseCase(
      new PostgresSystemHealthProbes(database),
      new PostgresBackupCatalogRepository(database),
    ),
  };
}

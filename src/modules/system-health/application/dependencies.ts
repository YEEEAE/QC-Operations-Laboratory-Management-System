import { getDatabase } from '../../../shared/database/database.js';
import { PostgresBackupCatalogRepository } from '../../backup-recovery/infrastructure/postgres-repository.js';
import { PostgresSystemHealthProbes } from '../infrastructure/postgres-health-probes.js';
import { GetSystemHealthUseCase } from './get-system-health.js';
import { GetReleaseIdentityUseCase } from './get-release-identity.js';
import { getRuntimeConfig } from '../../../config/runtime.js';

export function systemHealthReadDependencies() {
  const database = getDatabase();
  return {
    health: new GetSystemHealthUseCase(
      new PostgresSystemHealthProbes(database),
      new PostgresBackupCatalogRepository(database),
      getRuntimeConfig().release,
    ),
  };
}

export function systemHealthReleaseIdentityDependencies() {
  return {
    identity: new GetReleaseIdentityUseCase(getRuntimeConfig().release),
  };
}

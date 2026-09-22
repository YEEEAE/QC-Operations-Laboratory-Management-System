import { getDatabase } from '../../../shared/database/database.js';
import { PostgresBackupCatalogRepository } from '../../backup-recovery/infrastructure/postgres-repository.js';
import { PostgresRejectReportRepository } from '../../reject-reports/infrastructure/postgres-repository.js';
import { PostgresSystemHealthProbes } from '../infrastructure/postgres-health-probes.js';
import {
  createPostgresAuditReadiness,
  createPostgresMigrationStatus,
} from '../infrastructure/postgres-migration-status.js';
import { GetSystemHealthUseCase } from './get-system-health.js';
import { GetReleaseIdentityUseCase } from './get-release-identity.js';
import { GetControlCenterOverviewUseCase } from './get-control-center-overview.js';
import { getRuntimeConfig } from '../../../config/runtime.js';

export function systemHealthReadDependencies() {
  const database = getDatabase();
  const rejectReports = new PostgresRejectReportRepository(database);
  return {
    health: new GetSystemHealthUseCase(
      new PostgresSystemHealthProbes(database),
      new PostgresBackupCatalogRepository(database),
      {
        migrationStatus: createPostgresMigrationStatus(database),
        rejectReportsAvailability: () => rejectReports.availability(),
      },
      getRuntimeConfig().release,
    ),
  };
}

/**
 * Canonical-owner control center wiring. Read-only composition over the shared
 * PostgreSQL pool; the use case itself enforces the named-owner gate.
 */
export function controlCenterReadDependencies() {
  const database = getDatabase();
  return {
    overview: new GetControlCenterOverviewUseCase({
      probes: new PostgresSystemHealthProbes(database),
      auditReadiness: createPostgresAuditReadiness(database),
      migrationStatus: createPostgresMigrationStatus(database),
      release: getRuntimeConfig().release,
    }),
  };
}

export function systemHealthReleaseIdentityDependencies() {
  return {
    identity: new GetReleaseIdentityUseCase(getRuntimeConfig().release),
  };
}

import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { PostgresBackupCatalogRepository } from '../infrastructure/postgres-repository.js';
import { PostgresRecoveryGovernanceRepository } from '../infrastructure/postgres-recovery-governance-repository.js';
import { ListBackupsUseCase } from './list-backups.js';
import { GetBackupUseCase } from './get-backup.js';
import { RequestRestoreUseCase } from './request-restore.js';
import { GetRecoveryPostureUseCase } from './get-recovery-posture.js';
import { CreateRecoveryPolicyDraftUseCase } from './create-recovery-policy-draft.js';
import { DecideRecoveryPolicyUseCase } from './decide-recovery-policy.js';
import {
  RecordRecoveryIncidentUseCase,
  ResolveRecoveryIncidentUseCase,
} from './record-recovery-incident.js';
import { FailClosedControlledRecoveryRunner } from './controlled-recovery-runner.js';

export function backupCatalogReadDependencies() {
  const repository = new PostgresBackupCatalogRepository(getDatabase());
  return { list: new ListBackupsUseCase(repository), get: new GetBackupUseCase(repository) };
}

export function backupRestoreActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresBackupCatalogRepository(
    database,
    (transaction) => new PostgresAuditRepository(transaction),
    (transaction) => new PostgresOutboxRepository(transaction),
  );
  return { requestRestore: new RequestRestoreUseCase(repository) };
}

/** Read-only governed recovery posture, shared by /system/backups and health. */
export function recoveryGovernanceReadDependencies() {
  const database = getDatabase();
  return {
    posture: new GetRecoveryPostureUseCase(
      new PostgresBackupCatalogRepository(database),
      new PostgresRecoveryGovernanceRepository(
        database,
        (transaction) => new PostgresAuditRepository(transaction),
      ),
    ),
  };
}

/**
 * Governed recovery policy/incident actions plus the fail-closed runner. The
 * runner is composed here so no caller can substitute an executing adapter.
 */
export function recoveryGovernanceActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresRecoveryGovernanceRepository(
    database,
    (transaction) => new PostgresAuditRepository(transaction),
  );
  return {
    createPolicyDraft: new CreateRecoveryPolicyDraftUseCase(repository),
    decidePolicy: new DecideRecoveryPolicyUseCase(repository),
    recordIncident: new RecordRecoveryIncidentUseCase(repository),
    resolveIncident: new ResolveRecoveryIncidentUseCase(repository),
    runner: new FailClosedControlledRecoveryRunner(repository),
  };
}

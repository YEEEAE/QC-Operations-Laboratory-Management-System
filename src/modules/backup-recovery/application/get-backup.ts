import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import {
  isRestorableBackup,
  restoreVerificationStatus,
  type BackupRun,
  type RestoreRun,
  type RestoreVerificationStatus,
} from '../domain/backup-record.js';
import type { BackupCatalogRepository } from '../ports/repository.js';

export interface BackupDetail {
  backup: BackupRun;
  restoreRuns: readonly RestoreRun[];
  restoreVerification: RestoreVerificationStatus;
  restorable: boolean;
}

/**
 * Read-only backup detail. A GET path can never trigger or schedule a
 * restore: the returned contract carries state for display only.
 */
export class GetBackupUseCase {
  constructor(private readonly repository: BackupCatalogRepository) {}

  async execute(input: {
    actor: ActorContext;
    backupId: string;
  }): Promise<BackupDetail | undefined> {
    const backup = await this.repository.getBackup(input.backupId);
    if (!backup) return undefined;
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-BKP-VIEW',
        action: 'VIEW',
        entity: {
          type: 'BACKUP_RUN',
          id: backup.id,
          state: backup.state,
          domain: 'BACKUP_RECOVERY',
        },
        scope: { domain: 'BACKUP_RECOVERY' },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const restoreRuns = await this.repository.listRestoreRuns(backup.id);
    return {
      backup,
      restoreRuns,
      restoreVerification: restoreVerificationStatus(restoreRuns),
      restorable: isRestorableBackup(backup),
    };
  }
}

export function requireBackupDetail(detail: BackupDetail | undefined): BackupDetail {
  if (!detail) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
  return detail;
}

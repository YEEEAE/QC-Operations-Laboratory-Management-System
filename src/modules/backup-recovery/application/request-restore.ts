import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { createRestoreRequest, type RestoreRun } from '../domain/backup-record.js';
import type { BackupCatalogRepository } from '../ports/repository.js';
import {
  validateRestoreRequest,
  isProductionRestorePolicyApproved,
} from './validate-restore-request.js';

const restorePermission: Record<string, 'PERM-BKP-RESTORE-DRILL' | 'PERM-BKP-RESTORE-PRODUCTION'> =
  {
    DRILL: 'PERM-BKP-RESTORE-DRILL',
    PRODUCTION: 'PERM-BKP-RESTORE-PRODUCTION',
  };

/**
 * Records a controlled restore intent after validation and server-side
 * authorization. The request is persisted in PLANNED state; no restore is
 * executed and no recovery orchestrator exists in this baseline, so the
 * result never claims execution or verification (GET never restores either:
 * this use case is reachable only through the explicit POST Astro Action).
 */
export class RequestRestoreUseCase {
  constructor(
    private readonly repository: BackupCatalogRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    backupId: string;
    restoreType: string;
    targetEnvironment: string;
    reason: string;
    confirmation: boolean;
    requestId: string;
  }): Promise<{
    restore: RestoreRun;
    orchestration: { executed: false; status: 'NOT_AVAILABLE' };
  }> {
    const backup = await this.repository.getBackup(input.backupId);
    if (!backup) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });

    const validated = validateRestoreRequest({
      backupRun: backup,
      restoreType: input.restoreType,
      targetEnvironment: input.targetEnvironment,
      reason: input.reason,
      confirmation: input.confirmation,
    });

    if (validated.restoreType === 'PRODUCTION' && !isProductionRestorePolicyApproved())
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        safeMetadata: { reason: 'PRODUCTION_RESTORE_AUTHORITY_UNRESOLVED' },
      });

    authorize(
      {
        actor: input.actor,
        permission: restorePermission[validated.restoreType],
        action: 'REQUEST_RESTORE',
        entity: {
          type: 'BACKUP_RESTORE',
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

    const existing = await this.repository.listRestoreRuns(backup.id);
    const replay = existing.find(
      (run) =>
        run.requestId === input.requestId &&
        run.restoreType === validated.restoreType &&
        run.targetEnvironment === validated.targetEnvironment,
    );
    if (replay)
      return { restore: replay, orchestration: { executed: false, status: 'NOT_AVAILABLE' } };

    const restore = createRestoreRequest({
      id: uuidv7(),
      backupRun: backup,
      restoreType: validated.restoreType,
      targetEnvironment: validated.targetEnvironment,
      reason: validated.reason,
      confirmation: input.confirmation,
      requestedBy: input.actor.id,
      now: this.now(),
      requestId: input.requestId,
    });
    const persisted = await this.repository.recordRestoreRequest({
      restore,
      actor: input.actor,
      requestId: input.requestId,
    });
    return { restore: persisted, orchestration: { executed: false, status: 'NOT_AVAILABLE' } };
  }
}

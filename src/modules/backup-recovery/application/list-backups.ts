import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { BACKUP_RUN_STATES, type BackupRun } from '../domain/backup-record.js';
import type { BackupCatalogFilter, BackupCatalogRepository } from '../ports/repository.js';

const MAX_CATALOG_PAGE = 100;

/**
 * Read-only backup catalog listing. Explicit backup view permission is
 * re-checked server-side before any catalog read; the catalog is a
 * system-wide operational view, so only GLOBAL/DOMAIN grants satisfy it.
 */
export class ListBackupsUseCase {
  constructor(private readonly repository: BackupCatalogRepository) {}

  async execute(input: {
    actor: ActorContext;
    filter?: BackupCatalogFilter;
  }): Promise<readonly BackupRun[]> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-BKP-VIEW',
        action: 'VIEW',
        entity: {
          type: 'BACKUP_RUN',
          id: 'catalog',
          state: 'REQUESTED',
          domain: 'BACKUP_RECOVERY',
        },
        scope: { domain: 'BACKUP_RECOVERY' },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const limit = Math.min(Math.max(input.filter?.limit ?? 50, 1), MAX_CATALOG_PAGE);
    const requestedStates = input.filter?.states?.length
      ? input.filter.states.filter((state) =>
          (BACKUP_RUN_STATES as readonly string[]).includes(state),
        )
      : [...BACKUP_RUN_STATES];
    return this.repository.listBackups({
      ...input.filter,
      limit,
      states: requestedStates as readonly BackupRun['state'][],
    });
  }
}

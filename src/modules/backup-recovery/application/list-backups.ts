import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
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
    const requestedStates = this.authorizeAndFilter(input.actor, input.filter?.states);
    const limit = Math.min(Math.max(input.filter?.limit ?? 50, 1), MAX_CATALOG_PAGE);
    return this.repository.listBackups({ ...input.filter, limit, states: requestedStates });
  }

  async executePage(input: {
    actor: ActorContext;
    filter: { states?: readonly string[]; page: number; pageSize: number };
  }) {
    const states = this.authorizeAndFilter(input.actor, input.filter.states);
    if (!this.repository.listBackupPage)
      throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
        userSafe: true,
        retryability: 'INTERNAL_RETRY_ONLY',
      });
    return this.repository.listBackupPage({
      states,
      page: Math.max(1, Math.trunc(input.filter.page)),
      pageSize: Math.min(100, Math.max(1, Math.trunc(input.filter.pageSize))),
    });
  }

  private authorizeAndFilter(
    actor: ActorContext,
    states?: readonly string[],
  ): readonly BackupRun['state'][] {
    authorize(
      {
        actor,
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
    if (states?.some((state) => !(BACKUP_RUN_STATES as readonly string[]).includes(state))) {
      throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
    }
    return states?.length ? (states as readonly BackupRun['state'][]) : [...BACKUP_RUN_STATES];
  }
}

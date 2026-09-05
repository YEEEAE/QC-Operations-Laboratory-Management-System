import { describe, expect, it } from 'vitest';
import { RequestRestoreUseCase } from '../../../src/modules/backup-recovery/application/request-restore.js';
import type { BackupCatalogRepository } from '../../../src/modules/backup-recovery/ports/repository.js';
import type {
  BackupRun,
  RestoreRun,
} from '../../../src/modules/backup-recovery/domain/backup-record.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { AppError } from '../../../src/shared/errors/app-error.js';

const requesterId = '01900000-0000-7000-8000-000000000501';
const backupId = '01900000-0000-7000-8000-000000000502';
const requestId = 'req-restore-drill-1';

const actor = (
  codes: readonly string[],
  scopes: readonly ('OWN' | 'GLOBAL')[] = ['GLOBAL'],
): ActorContext => ({
  id: requesterId,
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: codes.map((code) => ({
    code: code as ActorContext['permissions'][number]['code'],
    scopes,
  })),
});

const backup = (state: string): BackupRun => ({
  id: backupId,
  state: state as BackupRun['state'],
  requestedBy: requesterId,
  requestedAt: new Date('2026-09-05T08:00:00.000Z'),
  artifactCreatedAt: new Date('2026-09-05T08:30:00.000Z'),
  databaseSchemaVersion: '0017',
  requestId: 'req-backup-1',
});

function catalog(
  items: readonly BackupRun[],
  options: { recorded?: RestoreRun[]; existing?: RestoreRun } = {},
): BackupCatalogRepository & { recorded: RestoreRun[]; insertCount: number } {
  const recorded = options.recorded ?? [];
  let insertCount = 0;
  return {
    recorded,
    get insertCount() {
      return insertCount;
    },
    async listBackups() {
      return items;
    },
    async getBackup(id) {
      return items.find((item) => item.id === id);
    },
    async listRestoreRuns(backupRunId) {
      if (backupRunId === backupId && options.existing) return [options.existing];
      return [];
    },
    async recordRestoreRequest(input) {
      const replay = recorded.find(
        (item) =>
          item.requestId === input.restore.requestId &&
          item.backupRunId === input.restore.backupRunId &&
          item.restoreType === input.restore.restoreType,
      );
      if (replay) return replay;
      insertCount += 1;
      recorded.push(input.restore);
      return input.restore;
    },
  };
}

const drillInput = {
  backupId,
  restoreType: 'DRILL',
  targetEnvironment: 'test',
  reason: 'Isolated restore drill after schema change.',
  confirmation: true,
};

describe('restore request authorization boundary', () => {
  it('records a planned drill restore for an actor holding the explicit drill restore permission', async () => {
    const repository = catalog([backup('VERIFIED')]);
    const result = await new RequestRestoreUseCase(repository).execute({
      actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-DRILL']),
      ...drillInput,
      requestId,
    });
    expect(result.restore.state).toBe('PLANNED');
    expect(result.restore.restoreType).toBe('DRILL');
    expect(result.orchestration.executed).toBe(false);
    expect(repository.insertCount).toBe(1);
  });

  it('denies a restore request without the explicit restore permission', async () => {
    const repository = catalog([backup('VERIFIED')]);
    await expect(
      new RequestRestoreUseCase(repository).execute({
        actor: actor(['PERM-BKP-VIEW']),
        ...drillInput,
        requestId,
      }),
    ).rejects.toThrowError(AppError);
    expect(repository.insertCount).toBe(0);
  });

  it('denies an Admin whose role does not carry the explicit restore permission', async () => {
    const repository = catalog([backup('VERIFIED')]);
    await expect(
      new RequestRestoreUseCase(repository).execute({ actor: actor([]), ...drillInput, requestId }),
    ).rejects.toThrowError(AppError);
    expect(repository.insertCount).toBe(0);
  });

  it('denies a restore request scoped below GLOBAL for a system-wide operation', async () => {
    const repository = catalog([backup('VERIFIED')]);
    await expect(
      new RequestRestoreUseCase(repository).execute({
        actor: actor(['PERM-BKP-RESTORE-DRILL'], ['OWN']),
        ...drillInput,
        requestId,
      }),
    ).rejects.toThrowError(AppError);
    expect(repository.insertCount).toBe(0);
  });

  it('denies a drill restore that targets the production environment', async () => {
    const repository = catalog([backup('VERIFIED')]);
    await expect(
      new RequestRestoreUseCase(repository).execute({
        actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-DRILL']),
        ...drillInput,
        targetEnvironment: 'production',
        requestId,
      }),
    ).rejects.toThrowError(AppError);
    expect(repository.insertCount).toBe(0);
  });

  it('denies a production restore while the production restore authority and e-signature policy are unresolved', async () => {
    const repository = catalog([backup('VERIFIED')]);
    await expect(
      new RequestRestoreUseCase(repository).execute({
        actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-PRODUCTION']),
        ...drillInput,
        restoreType: 'PRODUCTION',
        targetEnvironment: 'production',
        requestId,
      }),
    ).rejects.toThrowError(AppError);
    expect(repository.insertCount).toBe(0);
  });

  it('rejects restore requests without explicit confirmation or reason', async () => {
    const repository = catalog([backup('VERIFIED')]);
    await expect(
      new RequestRestoreUseCase(repository).execute({
        actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-DRILL']),
        ...drillInput,
        confirmation: false,
        requestId,
      }),
    ).rejects.toThrowError(AppError);
    await expect(
      new RequestRestoreUseCase(repository).execute({
        actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-DRILL']),
        ...drillInput,
        reason: '  ',
        requestId,
      }),
    ).rejects.toThrowError(AppError);
    expect(repository.insertCount).toBe(0);
  });

  it('rejects a restore request for a backup without a created artifact', async () => {
    const repository = catalog([backup('RUNNING')]);
    await expect(
      new RequestRestoreUseCase(repository).execute({
        actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-DRILL']),
        ...drillInput,
        requestId,
      }),
    ).rejects.toThrowError(AppError);
    expect(repository.insertCount).toBe(0);
  });

  it('replays the same restore request without inserting a duplicate record', async () => {
    const repository = catalog([backup('VERIFIED')]);
    const useCase = new RequestRestoreUseCase(repository);
    const first = await useCase.execute({
      actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-DRILL']),
      ...drillInput,
      requestId,
    });
    const second = await useCase.execute({
      actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-DRILL']),
      ...drillInput,
      requestId,
    });
    expect(second.restore.id).toBe(first.restore.id);
    expect(repository.insertCount).toBe(1);
  });

  it('never executes or claims restore orchestration from the request path', async () => {
    const repository = catalog([backup('VERIFIED')]);
    const result = await new RequestRestoreUseCase(repository).execute({
      actor: actor(['PERM-BKP-VIEW', 'PERM-BKP-RESTORE-DRILL']),
      ...drillInput,
      requestId,
    });
    expect(result.orchestration.executed).toBe(false);
    expect(result.orchestration.status).toBe('NOT_AVAILABLE');
    expect(result.restore.state).not.toBe('SUCCEEDED');
    expect(result.restore.verifiedAt).toBeUndefined();
  });
});

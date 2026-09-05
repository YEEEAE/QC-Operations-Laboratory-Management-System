import { describe, expect, it } from 'vitest';
import {
  BACKUP_RUN_STATES,
  CANONICAL_ENVIRONMENTS,
  RESTORABLE_BACKUP_STATES,
  describeBackupPosture,
  restoreVerificationStatus,
} from '../../../src/modules/backup-recovery/domain/backup-record.js';
import { validateRestoreRequest } from '../../../src/modules/backup-recovery/application/validate-restore-request.js';
import { ListBackupsUseCase } from '../../../src/modules/backup-recovery/application/list-backups.js';
import { GetBackupUseCase } from '../../../src/modules/backup-recovery/application/get-backup.js';
import type { BackupCatalogRepository } from '../../../src/modules/backup-recovery/ports/repository.js';
import type {
  BackupRun,
  RestoreRun,
} from '../../../src/modules/backup-recovery/domain/backup-record.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { AppError } from '../../../src/shared/errors/app-error.js';

const operatorId = '01900000-0000-7000-8000-000000000401';
const backupId = '01900000-0000-7000-8000-000000000402';

const actor = (codes: readonly string[]): ActorContext => ({
  id: operatorId,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: codes.map((code) => ({
    code: code as ActorContext['permissions'][number]['code'],
    scopes: ['GLOBAL'],
  })),
});

const backup = (state: string): BackupRun => ({
  id: backupId,
  state: state as BackupRun['state'],
  requestedBy: operatorId,
  requestedAt: new Date('2026-09-05T08:00:00.000Z'),
  artifactCreatedAt: new Date('2026-09-05T08:30:00.000Z'),
  sizeBytes: 1048576n,
  checksum: 'a'.repeat(64),
  databaseSchemaVersion: '0017',
  requestId: 'req-backup-1',
});

const restoreRun = (state: string): RestoreRun => ({
  id: '01900000-0000-7000-8000-000000000403',
  backupRunId: backupId,
  restoreType: 'DRILL',
  state: state as RestoreRun['state'],
  requestedBy: operatorId,
  requestedAt: new Date('2026-09-05T09:00:00.000Z'),
  targetEnvironment: 'test',
  requestId: 'req-restore-1',
});

function catalog(
  items: readonly BackupRun[] = [],
  restoreRuns: readonly RestoreRun[] = [],
): BackupCatalogRepository {
  return {
    async listBackups() {
      return items;
    },
    async getBackup(id) {
      return items.find((item) => item.id === id);
    },
    async listRestoreRuns(backupRunId) {
      return backupRunId === backupId ? restoreRuns : [];
    },
    async recordRestoreRequest() {
      throw new Error('not used here');
    },
  };
}

describe('backup catalog', () => {
  it('keeps the canonical backup state vocabulary aligned with the controlled migration', () => {
    expect(BACKUP_RUN_STATES).toEqual([
      'REQUESTED',
      'RUNNING',
      'CREATED',
      'VERIFYING',
      'VERIFIED',
      'FAILED',
      'EXPIRED',
      'DELETED',
    ]);
  });

  it('only treats backups with a created artifact as restorable', () => {
    expect(RESTORABLE_BACKUP_STATES).toEqual(['CREATED', 'VERIFIED']);
    expect(() =>
      validateRestoreRequest({
        backupRun: backup('RUNNING'),
        restoreType: 'DRILL',
        targetEnvironment: 'test',
        reason: 'Isolated drill after schema change.',
        confirmation: true,
      }),
    ).toThrowError(AppError);
    expect(() =>
      validateRestoreRequest({
        backupRun: backup('DELETED'),
        restoreType: 'DRILL',
        targetEnvironment: 'test',
        reason: 'Isolated drill after schema change.',
        confirmation: true,
      }),
    ).toThrowError(AppError);
  });

  it('requires an explicit reason and confirmation for a restore request', () => {
    expect(() =>
      validateRestoreRequest({
        backupRun: backup('VERIFIED'),
        restoreType: 'DRILL',
        targetEnvironment: 'test',
        reason: '',
        confirmation: true,
      }),
    ).toThrowError(AppError);
    expect(() =>
      validateRestoreRequest({
        backupRun: backup('VERIFIED'),
        restoreType: 'DRILL',
        targetEnvironment: 'test',
        reason: 'Isolated drill after schema change.',
        confirmation: false,
      }),
    ).toThrowError(AppError);
  });

  it('rejects a drill targeting the production environment and unknown environments', () => {
    expect(() =>
      validateRestoreRequest({
        backupRun: backup('VERIFIED'),
        restoreType: 'DRILL',
        targetEnvironment: 'production',
        reason: 'Isolated drill after schema change.',
        confirmation: true,
      }),
    ).toThrowError(AppError);
    expect(() =>
      validateRestoreRequest({
        backupRun: backup('VERIFIED'),
        restoreType: 'DRILL',
        targetEnvironment: 'prod-bucket-2',
        reason: 'Isolated drill after schema change.',
        confirmation: true,
      }),
    ).toThrowError(AppError);
    expect(CANONICAL_ENVIRONMENTS).toEqual(['local', 'test', 'staging', 'production']);
  });

  it('never presents a succeeded backup job as a verified restore', () => {
    expect(restoreVerificationStatus([])).toBe('NOT_VERIFIED');
    expect(restoreVerificationStatus([restoreRun('SUCCEEDED')])).toBe('VERIFIED');
    expect(restoreVerificationStatus([restoreRun('FAILED')])).toBe('VERIFICATION_FAILED');
    expect(restoreVerificationStatus([restoreRun('VALIDATING')])).toBe('VERIFYING');

    const posture = describeBackupPosture(backup('CREATED'), []);
    expect(posture.backupJobState).toBe('CREATED');
    expect(posture.artifactVerified).toBe(false);
    expect(posture.restoreVerification).toBe('NOT_VERIFIED');
    expect(posture.backupJobState).not.toBe(posture.restoreVerification);
  });

  it('lists the catalog only for actors holding the explicit backup view permission', async () => {
    await expect(
      new ListBackupsUseCase(catalog([backup('CREATED')])).execute({ actor: actor([]) }),
    ).rejects.toThrowError(AppError);
    const items = await new ListBackupsUseCase(catalog([backup('CREATED')])).execute({
      actor: actor(['PERM-BKP-VIEW']),
    });
    expect(items).toHaveLength(1);
  });

  it('returns backup details with restore history for permitted viewers and nothing for missing records', async () => {
    await expect(
      new GetBackupUseCase(catalog([backup('VERIFIED')], [restoreRun('PLANNED')])).execute({
        actor: actor([]),
        backupId,
      }),
    ).rejects.toThrowError(AppError);
    const detail = await new GetBackupUseCase(
      catalog([backup('VERIFIED')], [restoreRun('PLANNED')]),
    ).execute({
      actor: actor(['PERM-BKP-VIEW']),
      backupId,
    });
    expect(detail?.backup.state).toBe('VERIFIED');
    expect(detail?.restoreRuns).toHaveLength(1);
    expect(detail?.restorable).toBe(true);
    expect(
      await new GetBackupUseCase(catalog([backup('VERIFIED')])).execute({
        actor: actor(['PERM-BKP-VIEW']),
        backupId: '01900000-0000-7000-8000-000000000499',
      }),
    ).toBeUndefined();
  });

  it('exposes a sanitized catalog view without raw storage references', () => {
    const posture = describeBackupPosture(backup('VERIFIED'), []);
    expect(JSON.stringify(posture)).not.toContain('storage');
  });
});

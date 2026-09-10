import { describe, expect, it } from 'vitest';
import { LocalArtifactStore } from '../../../src/modules/backup-recovery/infrastructure/local-artifact-store.js';
import { runLogicalBackupJob } from '../../../src/modules/backup-recovery/application/run-backup-job.js';

const release = { gitSha: 'a'.repeat(40), buildId: 'build-1', releaseId: 'rel-1', migrationHead: '0019_backup_catalog_identity', postgresVersion: '18.6' };
const execution = { bytes: new Uint8Array([1, 2]), postgresVersion: '18.6', startedAt: new Date('2026-09-10T00:00:00Z'), completedAt: new Date('2026-09-10T00:01:00Z'), command: 'pg_dump' as const };

describe('logical backup job', () => {
  it('verifies exact stored bytes before returning VERIFIED', async () => {
    const result = await runLogicalBackupJob({ executor: { createLogicalBackup: async () => execution, restoreLogicalBackup: async () => { throw new Error('unused'); } }, store: new LocalArtifactStore(), databaseUrl: 'postgresql://redacted', release, catalogId: '01999999-9999-7999-8999-999999999999', requestId: 'req-1', now: () => new Date('2026-09-10T00:02:00Z') });
    expect(result.status).toBe('VERIFIED');
    expect(result.manifest?.releaseId).toBe('rel-1');
  });
  it('fails closed when backup execution fails', async () => {
    const result = await runLogicalBackupJob({ executor: { createLogicalBackup: async () => { throw new Error('secret stderr'); }, restoreLogicalBackup: async () => { throw new Error('unused'); } }, store: new LocalArtifactStore(), databaseUrl: 'postgresql://redacted', release, catalogId: '01999999-9999-7999-8999-999999999999', requestId: 'req-1' });
    expect(result).toEqual({ status: 'FAILED', failureCode: 'BACKUP_EXECUTION_FAILED' });
  });
});

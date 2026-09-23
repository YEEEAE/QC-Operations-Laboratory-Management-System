import { describe, expect, it } from 'vitest';
import { LocalArtifactStore } from '../../../src/modules/backup-recovery/infrastructure/local-artifact-store.js';
import { expireBackupArtifacts } from '../../../src/modules/backup-recovery/application/retention.js';
import { checksum } from '../../../src/modules/backup-recovery/infrastructure/postgres-logical-backup-executor.js';

describe('backup retention', () => {
  it('fails closed without approved retention policy', async () => {
    const store = new LocalArtifactStore();
    const metadata = { sizeBytes: 1n, checksum: checksum(new Uint8Array([1])) };
    await store.put({
      reference: 'old',
      bytes: new Uint8Array([1]),
      contentType: 'application/octet-stream',
      metadata,
    });
    const result = await expireBackupArtifacts({
      store,
      now: new Date('2026-12-01T00:00:00Z'),
      eligibleReferences: new Set(['old']),
    });
    expect(result).toEqual({ deleted: [], protected: ['old'] });
    expect(await store.get('old')).toEqual(new Uint8Array([1]));
  });
  it('deletes only eligible expired artifacts under an approved policy and preserves the last eligible artifact', async () => {
    const store = new LocalArtifactStore();
    const metadata = { sizeBytes: 1n, checksum: checksum(new Uint8Array([1])) };
    for (const reference of ['oldest', 'older', 'unrelated'])
      await store.put({
        reference,
        bytes: new Uint8Array([1]),
        contentType: 'application/octet-stream',
        metadata,
      });
    const result = await expireBackupArtifacts({
      store,
      now: new Date('2026-12-01T00:00:00Z'),
      eligibleReferences: new Set(['oldest', 'older']),
      policy: { retentionMs: 1, approvalReference: 'PD-24-approved' },
    });
    expect(result).toEqual({ deleted: ['older'], protected: ['oldest'] });
    expect(await store.get('unrelated')).toEqual(new Uint8Array([1]));
  });
});
